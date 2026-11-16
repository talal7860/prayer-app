#!/usr/bin/env python3
"""Promote a Google Play internal testing release to production (Play Developer API).

Run through scripts/production-release.sh, which loads the settings and asks the questions. On its own:

  scripts/play_promote.py --package com.conelabs.adhanapp --key service-account.json --list
  scripts/play_promote.py --package … --key … [--version-code 16] [--rollout 0.2] \
      [--notes-file notes.txt] [--dry-run] [--yes]

--list prints the internal release(s). A promotion copies the internal release to the production
track (all users, or a staged rollout), with the release notes ("What's new") in the listing's
default language, and sends it to Google for review. --dry-run asks Play to validate the change
and then throws it away. Python's standard library plus `openssl` (for the RS256 token).
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

API = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications'
NOTES_MAX = 500  # Play's limit per language


def b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode()


def access_token(key_file: str) -> str:
    with open(key_file, encoding='utf-8') as f:
        sa = json.load(f)
    now = int(time.time())
    head = b64(json.dumps({'alg': 'RS256', 'typ': 'JWT'}).encode())
    claims = {
        'iss': sa['client_email'],
        'scope': 'https://www.googleapis.com/auth/androidpublisher',
        'aud': sa['token_uri'],
        'iat': now,
        'exp': now + 3600,
    }
    body = b64(json.dumps(claims).encode())
    # openssl signs from a key file: a private temp file, removed straight after.
    fd, pem = tempfile.mkstemp(suffix='.pem')
    try:
        with os.fdopen(fd, 'w') as f:
            f.write(sa['private_key'])
        sig = subprocess.run(
            ['openssl', 'dgst', '-sha256', '-sign', pem],
            input=f'{head}.{body}'.encode(),
            capture_output=True,
            check=True,
        ).stdout
    finally:
        os.remove(pem)
    data = urllib.parse.urlencode(
        {
            'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion': f'{head}.{body}.{b64(sig)}',
        }
    ).encode()
    with urllib.request.urlopen(urllib.request.Request(sa['token_uri'], data=data)) as res:
        return json.loads(res.read())['access_token']


class Play:
    def __init__(self, package: str, key_file: str):
        self.base = f'{API}/{package}'
        self.token = access_token(key_file)

    def call(self, method: str, path: str, body: dict | None = None) -> dict:
        req = urllib.request.Request(
            self.base + path,
            method=method,
            data=json.dumps(body).encode() if body is not None else None,
            headers={'Authorization': 'Bearer ' + self.token, 'Content-Type': 'application/json'},
        )
        try:
            with urllib.request.urlopen(req) as res:
                return json.loads(res.read() or b'{}')
        except urllib.error.HTTPError as e:
            detail = e.read().decode()
            try:
                detail = json.loads(detail)['error']['message']
            except (ValueError, KeyError):
                pass
            sys.exit(f'error: {method} {path} → HTTP {e.code}: {detail}')


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    ap.add_argument('--package', required=True)
    ap.add_argument('--key', required=True, help='service account JSON key')
    ap.add_argument('--list', action='store_true', help='print the internal release(s) and stop')
    ap.add_argument('--version-code', help='which internal release (default: the newest)')
    ap.add_argument('--rollout', type=float, default=1.0, help='fraction of users, 0 < r ≤ 1')
    ap.add_argument('--notes-file', help="release notes (≤ 500 characters)")
    ap.add_argument('--dry-run', action='store_true', help='validate, then discard')
    ap.add_argument('--yes', action='store_true', help="don't ask before promoting")
    args = ap.parse_args()
    if not 0 < args.rollout <= 1:
        sys.exit('error: --rollout is a fraction, 0 < r ≤ 1 (0.2 = 20 %)')

    play = Play(args.package, args.key)
    edit = play.call('POST', '/edits', {})['id']
    try:
        internal = play.call('GET', f'/edits/{edit}/tracks/internal').get('releases', [])
        internal = [r for r in internal if r.get('versionCodes')]
        if not internal:
            sys.exit('error: nothing on internal testing (upload with scripts/release.sh android)')
        newest = max(internal, key=lambda r: max(int(c) for c in r['versionCodes']))
        if args.list:
            for r in internal:
                mark = '  (newest)' if r is newest else ''
                print(f"{r.get('name', '?')}: versionCode {', '.join(r['versionCodes'])}{mark}")
            return
        release = newest
        if args.version_code:
            release = next((r for r in internal if args.version_code in r['versionCodes']), None)
            if not release:
                sys.exit(f'error: versionCode {args.version_code} is not on internal testing')

        lang = play.call('GET', f'/edits/{edit}/details').get('defaultLanguage', 'en-US')
        notes = ''
        if args.notes_file:
            with open(args.notes_file, encoding='utf-8') as f:
                notes = f.read().strip()
            if len(notes) > NOTES_MAX:
                sys.exit(f'error: Play release notes are {len(notes)} characters; the limit is {NOTES_MAX}')

        promoted = {
            'name': release.get('name'),
            'versionCodes': release['versionCodes'],
            'status': 'completed' if args.rollout >= 1 else 'inProgress',
        }
        if args.rollout < 1:
            promoted['userFraction'] = args.rollout
        if notes:
            promoted['releaseNotes'] = [{'language': lang, 'text': notes}]
        codes = ', '.join(release['versionCodes'])
        who = 'everyone' if args.rollout >= 1 else f'{args.rollout:.0%} of users (staged)'
        print(f"Release {release.get('name', '?')} (versionCode {codes}) → production, {who}")
        if notes:
            print(f'Release notes ({lang}):\n  ' + notes.replace('\n', '\n  '))

        play.call('PUT', f'/edits/{edit}/tracks/production', {'track': 'production', 'releases': [promoted]})
        if args.dry_run:
            play.call('POST', f'/edits/{edit}:validate')
            print('\nDry run: Play validated the promotion; nothing was changed.')
            return
        if not args.yes:
            answer = input(f'\nPromote versionCode {codes} to Play production? [y/N] ').strip().lower()
            if answer not in ('y', 'yes'):
                sys.exit('Cancelled.')
        play.call('POST', f'/edits/{edit}:commit')
        edit = ''
        print('Promoted. Google reviews it before it reaches the store (hours to a few days).')
    finally:
        if edit:
            # An unfinished or dry-run edit: drop it so it doesn't block the next one.
            try:
                play.call('DELETE', f'/edits/{edit}')
            except SystemExit:
                pass


if __name__ == '__main__':
    main()
