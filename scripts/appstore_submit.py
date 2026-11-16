#!/usr/bin/env python3
"""Submit an iOS build that's on TestFlight to App Store review (App Store Connect API).

Run through scripts/production-release.sh, which loads the settings. On its own:

  ASC_API_KEY_ID=… ASC_API_ISSUER_ID=… ASC_API_KEY_PATH=… \
    scripts/appstore_submit.py --app 6833678431 --version 1.1.0 [--build 12] \
      [--notes-file notes.txt] [--manual-release] [--dry-run] [--yes]

1. Finds the App Store version (creates it if there's none), and checks it can still be edited.
2. Picks the build: the newest processed TestFlight build of that version, or --build.
3. Attaches the build, sets "What's New" (updates only, not the first version) and the
   release type (after approval, or --manual-release), then submits it for review.

--list prints the version's processed TestFlight builds. --dry-run only reads. Python's standard library plus `openssl` (for the ES256 token).
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

API = 'https://api.appstoreconnect.apple.com'
# States in which a version can still be changed and submitted.
EDITABLE = {
    'PREPARE_FOR_SUBMISSION',
    'DEVELOPER_REJECTED',
    'REJECTED',
    'METADATA_REJECTED',
    'INVALID_BINARY',
}


def b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode()


def der_to_raw(der: bytes) -> bytes:
    """openssl's DER ECDSA signature (SEQUENCE of r, s) → the JWT's 64-byte r || s."""
    assert der[0] == 0x30, 'not a DER signature'
    i = 2
    parts = []
    for _ in range(2):
        assert der[i] == 0x02
        n = der[i + 1]
        parts.append(int.from_bytes(der[i + 2 : i + 2 + n], 'big').to_bytes(32, 'big'))
        i += 2 + n
    return parts[0] + parts[1]


class Asc:
    def __init__(self, key_id: str, issuer: str, key_path: str, dry_run: bool):
        self.key_id, self.issuer, self.key_path, self.dry_run = key_id, issuer, key_path, dry_run
        self._token, self._expires = '', 0.0

    def token(self) -> str:
        if time.time() < self._expires - 60:
            return self._token
        now = int(time.time())
        head = b64(json.dumps({'alg': 'ES256', 'kid': self.key_id, 'typ': 'JWT'}).encode())
        body = b64(
            json.dumps(
                {'iss': self.issuer, 'iat': now, 'exp': now + 1200, 'aud': 'appstoreconnect-v1'}
            ).encode()
        )
        signed = f'{head}.{body}'.encode()
        der = subprocess.run(
            ['openssl', 'dgst', '-sha256', '-sign', self.key_path],
            input=signed,
            capture_output=True,
            check=True,
        ).stdout
        self._token, self._expires = f'{head}.{body}.{b64(der_to_raw(der))}', now + 1200
        return self._token

    def call(self, method: str, path: str, body: dict | None = None) -> dict:
        if method != 'GET' and self.dry_run:
            print(f'   (dry run: would {method} {path})')
            return {}
        req = urllib.request.Request(
            API + path,
            method=method,
            data=json.dumps(body).encode() if body is not None else None,
            headers={'Authorization': 'Bearer ' + self.token(), 'Content-Type': 'application/json'},
        )
        try:
            with urllib.request.urlopen(req) as res:
                return json.loads(res.read() or b'{}')
        except urllib.error.HTTPError as e:
            detail = e.read().decode()
            try:
                errors = json.loads(detail).get('errors', [])
                detail = '\n'.join(
                    f"  {x.get('title', '')}: {x.get('detail', '')}" for x in errors
                ) or detail
            except ValueError:
                pass
            sys.exit(f'error: {method} {path} → HTTP {e.code}\n{detail}')


def version_state(v: dict) -> str:
    a = v['attributes']
    return a.get('appVersionState') or a.get('appStoreState') or ''


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    ap.add_argument('--app', required=True, help='App Store Connect app id (eas.json ascAppId)')
    ap.add_argument('--version', required=True, help='marketing version, e.g. 1.1.0')
    ap.add_argument('--build', help='build number (default: the newest processed one)')
    ap.add_argument('--list', action='store_true', help="print the version's processed builds and stop")
    ap.add_argument('--notes-file', help="What's New text (updates only)")
    ap.add_argument('--manual-release', action='store_true', help='release by hand after approval')
    ap.add_argument('--dry-run', action='store_true', help='only read; change nothing')
    ap.add_argument('--yes', action='store_true', help="don't ask before submitting")
    args = ap.parse_args()

    asc = Asc(
        os.environ['ASC_API_KEY_ID'],
        os.environ['ASC_API_ISSUER_ID'],
        os.environ['ASC_API_KEY_PATH'],
        args.dry_run,
    )
    app, ver = args.app, args.version
    release_type = 'MANUAL' if args.manual_release else 'AFTER_APPROVAL'

    if args.list:
        builds = asc.call(
            'GET',
            f'/v1/builds?filter[app]={app}&filter[preReleaseVersion.version]={ver}'
            '&filter[processingState]=VALID&filter[expired]=false&sort=-uploadedDate&limit=10',
        )['data']
        if not builds:
            sys.exit(f'error: no processed build of {ver} on TestFlight')
        for i, b in enumerate(builds):
            a = b['attributes']
            mark = '  (newest)' if i == 0 else ''
            print(f"{ver} ({a['version']}), uploaded {a['uploadedDate'][:16]}{mark}")
        return

    # 1. The App Store version.
    versions = asc.call('GET', f'/v1/apps/{app}/appStoreVersions?filter[platform]=IOS&limit=50')[
        'data'
    ]
    version = next((v for v in versions if v['attributes']['versionString'] == ver), None)
    others = [v for v in versions if v is not version]
    if version:
        state = version_state(version)
        print(f'App Store version {ver}: {state}')
        if state not in EDITABLE:
            print(f'Nothing to do: {ver} is already submitted or released ({state}).')
            return
    else:
        editable = [v for v in others if version_state(v) in EDITABLE]
        if editable:
            v = editable[0]['attributes']['versionString']
            sys.exit(
                f'error: version {v} is still open in App Store Connect '
                f'({version_state(editable[0])}). Submit or remove it first, or pass --version {v}.'
            )
        print(f'App Store version {ver}: none yet, it will be created')

    # 2. The build.
    query = (
        f'/v1/builds?filter[app]={app}&filter[preReleaseVersion.version]={ver}'
        '&filter[processingState]=VALID&filter[expired]=false&sort=-uploadedDate&limit=1'
    )
    if args.build:
        query += f'&filter[version]={args.build}'
    builds = asc.call('GET', query)['data']
    if not builds:
        which = f'build {args.build} of {ver}' if args.build else f'a processed build of {ver}'
        sys.exit(
            f'error: no {which} on TestFlight. Upload one (scripts/release.sh ios) and wait until '
            'Apple has processed it.'
        )
    build = builds[0]
    number = build['attributes']['version']
    print(f"Build: {ver} ({number}), uploaded {build['attributes']['uploadedDate'][:16]}")

    notes = ''
    if args.notes_file:
        with open(args.notes_file, encoding='utf-8') as f:
            notes = f.read().strip()[:4000]
    # Apple rejects What's New on an app's first version.
    first = not others
    if notes and not first:
        print("What's New:\n  " + notes.replace('\n', '\n  '))
    print('Release: ' + ('by hand after approval' if args.manual_release else 'automatically after approval'))

    if args.dry_run:
        print('\nDry run: nothing was changed.')
        return
    if not args.yes:
        answer = input(f'\nSubmit {ver} ({number}) for App Store review? [y/N] ').strip().lower()
        if answer not in ('y', 'yes'):
            sys.exit('Cancelled.')

    # 3. Create or update the version, attach the build.
    if version:
        vid = version['id']
        asc.call(
            'PATCH',
            f'/v1/appStoreVersions/{vid}',
            {
                'data': {
                    'type': 'appStoreVersions',
                    'id': vid,
                    'attributes': {'releaseType': release_type},
                }
            },
        )
    else:
        vid = asc.call(
            'POST',
            '/v1/appStoreVersions',
            {
                'data': {
                    'type': 'appStoreVersions',
                    'attributes': {
                        'platform': 'IOS',
                        'versionString': ver,
                        'releaseType': release_type,
                    },
                    'relationships': {'app': {'data': {'type': 'apps', 'id': app}}},
                }
            },
        )['data']['id']
        print(f'Created version {ver}.')
    asc.call(
        'PATCH',
        f'/v1/appStoreVersions/{vid}/relationships/build',
        {'data': {'type': 'builds', 'id': build['id']}},
    )
    print(f'Attached build {number}.')

    if notes and not first:
        locs = asc.call('GET', f'/v1/appStoreVersions/{vid}/appStoreVersionLocalizations')['data']
        for loc in locs:
            asc.call(
                'PATCH',
                f"/v1/appStoreVersionLocalizations/{loc['id']}",
                {
                    'data': {
                        'type': 'appStoreVersionLocalizations',
                        'id': loc['id'],
                        'attributes': {'whatsNew': notes},
                    }
                },
            )
        print("Set What's New for " + ', '.join(l['attributes']['locale'] for l in locs) + '.')

    # 4. Submit: a review submission (reuse an open draft) with this version in it.
    drafts = asc.call(
        'GET',
        f'/v1/reviewSubmissions?filter[app]={app}&filter[platform]=IOS'
        '&filter[state]=READY_FOR_REVIEW&limit=1',
    )['data']
    if drafts:
        sid = drafts[0]['id']
    else:
        sid = asc.call(
            'POST',
            '/v1/reviewSubmissions',
            {
                'data': {
                    'type': 'reviewSubmissions',
                    'attributes': {'platform': 'IOS'},
                    'relationships': {'app': {'data': {'type': 'apps', 'id': app}}},
                }
            },
        )['data']['id']
    items = asc.call('GET', f'/v1/reviewSubmissions/{sid}/items?include=appStoreVersion')['data']
    has_version = any(
        (i.get('relationships', {}).get('appStoreVersion', {}).get('data') or {}).get('id') == vid
        for i in items
    )
    if not has_version:
        asc.call(
            'POST',
            '/v1/reviewSubmissionItems',
            {
                'data': {
                    'type': 'reviewSubmissionItems',
                    'relationships': {
                        'reviewSubmission': {'data': {'type': 'reviewSubmissions', 'id': sid}},
                        'appStoreVersion': {'data': {'type': 'appStoreVersions', 'id': vid}},
                    },
                }
            },
        )
    asc.call(
        'PATCH',
        f'/v1/reviewSubmissions/{sid}',
        {'data': {'type': 'reviewSubmissions', 'id': sid, 'attributes': {'submitted': True}}},
    )
    print(f'Submitted {ver} ({number}) for App Store review.')


if __name__ == '__main__':
    main()
