#!/usr/bin/env python3
"""Print the store "What's new" text for a version, written for the people using the app.

  scripts/whats_new.py 1.1.0 [--max 500] [--changelog FILE]

It comes from that version's section in CHANGELOG.md:

1. A `### What's new` subsection, if there is one, is used as it is. That's the place for a
   hand-written summary (the production-release skill writes it before a release).
2. Otherwise it's drafted from the Added / Changed / Fixed bullets: the first sentence of each,
   without PR links, code formatting or the "Before, …" explanations, under "New", "Improved"
   and "Fixed". The Platform section (build tooling, CI) is left out: users never see it.

--max N keeps it to N characters (Play allows 500) by dropping bullets from the end, with a
closing "Plus smaller fixes and improvements." Standard library only.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

CHANGELOG = Path(__file__).resolve().parent.parent / 'CHANGELOG.md'
GROUPS = {'Added': 'New', 'Changed': 'Improved', 'Fixed': 'Fixed'}
MORE = '• Plus smaller fixes and improvements.'


def section(text: str, version: str) -> str | None:
    m = re.search(
        r'^## \[' + re.escape(version) + r'\][^\n]*\n(.*?)(?=^## |\Z)', text, re.S | re.M
    )
    return m.group(1) if m else None


def subsections(body: str) -> dict[str, list[str]]:
    """{"Added": [lines…], …} for the version's ### headings."""
    out: dict[str, list[str]] = {}
    current = None
    for line in body.splitlines():
        h = re.match(r'^### (.+?)\s*$', line)
        if h:
            current = h.group(1)
            out[current] = []
        elif current is not None:
            out[current].append(line)
    return out


def plain(line: str) -> str:
    """A changelog bullet → one plain sentence for the store."""
    line = re.sub(r'\s*\((\[#\d+\]\([^)]*\)(,\s*)?)+\)', '', line)  # " ([#68](…), [#70](…))"
    line = re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', line)  # [text](url) → text
    line = line.replace('**', '').replace('`', '').strip()
    # The first sentence: the rest is detail ("Before, …", the reasons, the old behaviour).
    first = re.split(r'(?<=[.!?…])\s+(?=[A-Z"“])', line, maxsplit=1)[0]
    first = first.rstrip()
    if not first.endswith(('.', '!', '?', '…')):
        first += '.'
    return first


def draft(subs: dict[str, list[str]]) -> list[str]:
    lines: list[str] = []
    for heading, title in GROUPS.items():
        bullets = [plain(l[2:]) for l in subs.get(heading, []) if l.startswith('- ')]
        if bullets:
            if lines:
                lines.append('')
            lines.append(title)
            lines.extend('• ' + b for b in bullets)
    return lines


def fit(lines: list[str], limit: int) -> str:
    text = '\n'.join(lines).strip()
    if len(text) <= limit:
        return text
    bullets = [i for i, l in enumerate(lines) if l.startswith('• ')]
    while bullets:
        lines = lines[: bullets.pop()]
        while lines and not lines[-1].startswith('• '):  # an emptied heading
            lines.pop()
        text = '\n'.join(lines + [MORE]).strip()
        if len(text) <= limit:
            return text
    return text[:limit]


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    ap.add_argument('version')
    ap.add_argument('--changelog', type=Path, default=CHANGELOG, help='default: the repo\'s CHANGELOG.md')
    ap.add_argument('--max', type=int, default=4000, help='characters (Play: 500, App Store: 4000)')
    args = ap.parse_args()

    body = section(args.changelog.read_text(encoding='utf-8'), args.version)
    if body is None:
        sys.exit(f'error: CHANGELOG.md has no [{args.version}] section')
    subs = subsections(body)
    written = next((v for k, v in subs.items() if k.lower() in ("what's new", 'what’s new')), None)
    lines = [l.rstrip() for l in written] if written else draft(subs)
    text = fit(lines, args.max)
    if not text:
        sys.exit(f'error: the [{args.version}] section has nothing for users')
    print(text)


if __name__ == '__main__':
    main()
