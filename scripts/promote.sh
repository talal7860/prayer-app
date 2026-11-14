#!/usr/bin/env bash
# Put builds that scripts/release.sh uploaded into production:
#   iOS      the TestFlight build → submitted for App Store review (released when approved)
#   Android  the Play internal testing release → the production track (Google reviews it)
#
#   scripts/promote.sh [ios|android|all] [options]
#
# It asks what it needs: which stores, the version, the release notes (drafted from that
# version's section in CHANGELOG.md: keep, edit or write your own; Play allows 500 characters),
# when iOS releases after approval, which Android build and how many users get it. Then each
# store shows a summary and asks once more before anything is submitted.
#
# Options answer the questions up front (with --yes, unasked ones take the default):
#   --version 1.1.0         marketing version (default: expo.version in app.json)
#   --build N               iOS build number (default: the newest processed one)
#   --version-code N        Android versionCode on internal testing (default: the newest)
#   --rollout 0.2           Android staged rollout to 20 % (default: everyone)
#   --manual-release        iOS: release by hand after approval (default: automatically)
#   --notes-file F          release notes for both stores
#   --play-notes-file F     release notes for Play only (≤ 500 characters)
#   --dry-run               only read and validate; change nothing
#   --yes                   ask nothing
#
# Settings are the ones release.sh reads (~/.config/adhan-app/env, then .env.release):
# ASC_API_KEY_ID, ASC_API_ISSUER_ID, ASC_API_KEY_PATH (iOS), PLAY_SERVICE_ACCOUNT_JSON (Android).
# Needs python3 and openssl.
set -euo pipefail

export LANG="${LANG:-en_US.UTF-8}" LC_ALL="${LC_ALL:-en_US.UTF-8}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env.release"
for file in "$HOME/.config/adhan-app/env" "$ENV_FILE"; do
  # shellcheck source=/dev/null
  [ -f "$file" ] && { set -a; source "$file"; set +a; }
done

PACKAGE=com.conelabs.adhanapp
PLAY_MAX=500

die() { echo "error: $*" >&2; exit 1; }
need() { [ -n "${!1:-}" ] || die "$1 is not set (put it in $ENV_FILE)"; }
step() { printf '\n==> %s\n' "$*"; }
json() { python3 -c 'import json,sys; d=json.load(open(sys.argv[1]))
for k in sys.argv[2:]: d=d[k]
print(d)' "$@"; }
chars() { python3 -c 'import sys; print(len(open(sys.argv[1], encoding="utf-8").read().strip()))' "$1"; }
editor() { "${VISUAL:-${EDITOR:-nano}}" "$1"; }
indent() { sed 's/^/    /' "$1"; }

platforms=() version="" build="" code="" rollout="" manual="" notes_file="" play_notes_file=""
dry=false yes=false
case "${1:-}" in
  ios) platforms=(ios); shift ;;
  android) platforms=(android); shift ;;
  all) platforms=(ios android); shift ;;
esac
while [ $# -gt 0 ]; do
  case "$1" in
    --version) version="${2:?}"; shift 2 ;;
    --build) build="${2:?}"; shift 2 ;;
    --version-code) code="${2:?}"; shift 2 ;;
    --rollout) rollout="${2:?}"; shift 2 ;;
    --manual-release) manual=true; shift ;;
    --notes-file) notes_file="${2:?}"; shift 2 ;;
    --play-notes-file) play_notes_file="${2:?}"; shift 2 ;;
    --dry-run) dry=true; shift ;;
    --yes) yes=true; shift ;;
    -h | --help) sed -n '2,/^set -e/p' "$0" | sed '$d; s/^# \{0,1\}//'; exit 0 ;;
    *) die "unknown option: $1 (see $0 --help)" ;;
  esac
done

# ask "Question" default → the answer (the default when --yes or just Enter).
ask() {
  local answer
  if $yes; then echo "$2"; return; fi
  read -r -p "$1 [$2] " answer || true
  echo "${answer:-$2}"
}

work="$(mktemp -d)"
trap 'rm -rf -- "$work"' EXIT

# --- Which stores, which version -----------------------------------------------------------
if [ ${#platforms[@]} -eq 0 ]; then
  case "$(ask 'Release to: (1) App Store and Play, (2) App Store only, (3) Play only?' 1)" in
    1) platforms=(ios android) ;;
    2) platforms=(ios) ;;
    3) platforms=(android) ;;
    *) die "pick 1, 2 or 3" ;;
  esac
fi
has() { [[ " ${platforms[*]} " == *" $1 "* ]]; }
[ -n "$version" ] || version="$(ask 'Version to release?' "$(json "$ROOT/app.json" expo version)")"

# --- Release notes ---------------------------------------------------------------------------
# The version's CHANGELOG section as plain text: bullets only, links and PR numbers dropped.
changelog_notes() {
  python3 - "$ROOT/CHANGELOG.md" "$version" <<'PY'
import re, sys
text, ver = open(sys.argv[1], encoding='utf-8').read(), sys.argv[2]
m = re.search(r'^## \[' + re.escape(ver) + r'\][^\n]*\n(.*?)(?=^## |\Z)', text, re.S | re.M)
for line in (m.group(1).splitlines() if m else []):
    if line.startswith('- '):
        line = re.sub(r'\s*\((\[#\d+\]\([^)]*\)(,\s*)?)+\)', '', line[2:])  # " ([#68](…))"
        line = re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', line).replace('**', '').replace('`', '')
        print('• ' + line.strip())
PY
}

notes="$work/notes.txt"
if [ -n "$notes_file" ]; then
  cp "$notes_file" "$notes"
else
  changelog_notes >"$notes"
  while true; do
    if [ -s "$notes" ]; then
      step "Release notes for $version"
      indent "$notes"
      choice="$(ask "Use these (k)eep, (e)dit, (w)rite new, or (n)one?" k)"
    else
      echo "No release notes yet (CHANGELOG.md has no $version section)."
      choice="$(ask "(w)rite them or go on with (n)one?" w)"
    fi
    case "$choice" in
      k | K) break ;;
      e | E) editor "$notes" ;;
      w | W) : >"$notes"; editor "$notes" ;;
      n | N) : >"$notes"; break ;;
      *) echo "Pick k, e, w or n." ;;
    esac
  done
fi
[ -s "$notes" ] || $yes || echo "Going on without release notes."

play_notes="$work/play-notes.txt"
if has android; then
  if [ -n "$play_notes_file" ]; then
    cp "$play_notes_file" "$play_notes"
  else
    cp "$notes" "$play_notes"
  fi
  while [ -s "$play_notes" ] && [ "$(chars "$play_notes")" -gt $PLAY_MAX ]; do
    $yes && die "the Play release notes are $(chars "$play_notes") characters; the limit is $PLAY_MAX (use --play-notes-file)"
    echo
    echo "Play allows $PLAY_MAX characters of release notes; these are $(chars "$play_notes")."
    case "$(ask "(e)dit a shorter copy for Play, or (s)kip notes on Play?" e)" in
      e | E) editor "$play_notes" ;;
      s | S) : >"$play_notes" ;;
    esac
  done
fi

# --- Per-store questions ---------------------------------------------------------------------
if has ios && [ -z "$manual" ]; then
  case "$(ask 'iOS: once Apple approves it, release (a)utomatically or (m)anually?' a)" in
    m | M) manual=true ;;
    *) manual=false ;;
  esac
fi

if has android; then
  need PLAY_SERVICE_ACCOUNT_JSON
  [ -f "$PLAY_SERVICE_ACCOUNT_JSON" ] || die "Play key not found: $PLAY_SERVICE_ACCOUNT_JSON"
  play=(python3 "$ROOT/scripts/play_promote.py" --package "$PACKAGE" --key "$PLAY_SERVICE_ACCOUNT_JSON")
  if [ -z "$code" ] && ! $yes; then
    step "Play internal testing"
    "${play[@]}" --list
    code="$(ask 'Android: which versionCode goes to production? (Enter = the newest)' newest)"
    [ "$code" = newest ] && code=""
  fi
  if [ -z "$rollout" ]; then
    pct="$(ask 'Android: roll out to what % of users? (less than 100 = staged rollout)' 100)"
    rollout="$(awk -v p="${pct%\%}" 'BEGIN { if (p > 0 && p <= 100) printf "%g", p / 100; else exit 1 }')" ||
      die "the rollout is a percentage, 1–100"
  fi
fi

# --- Submit ----------------------------------------------------------------------------------
for p in "${platforms[@]}"; do
  if [ "$p" = ios ]; then
    step "App Store: $version$($dry && echo ' (dry run)')"
    need ASC_API_KEY_ID
    need ASC_API_ISSUER_ID
    export ASC_API_KEY_ID ASC_API_ISSUER_ID
    export ASC_API_KEY_PATH="${ASC_API_KEY_PATH:-$HOME/.appstoreconnect/private_keys/AuthKey_$ASC_API_KEY_ID.p8}"
    [ -f "$ASC_API_KEY_PATH" ] || die "App Store Connect key not found: $ASC_API_KEY_PATH"
    args=(--app "$(json "$ROOT/eas.json" submit production ios ascAppId)" --version "$version")
    [ -s "$notes" ] && args+=(--notes-file "$notes")
    [ -n "$build" ] && args+=(--build "$build")
    $manual && args+=(--manual-release)
    $dry && args+=(--dry-run)
    $yes && args+=(--yes)
    python3 "$ROOT/scripts/appstore_submit.py" "${args[@]}"
  else
    step "Google Play: $version$($dry && echo ' (dry run)')"
    args=(--rollout "$rollout")
    [ -s "$play_notes" ] && args+=(--notes-file "$play_notes")
    [ -n "$code" ] && args+=(--version-code "$code")
    $dry && args+=(--dry-run)
    $yes && args+=(--yes)
    "${play[@]}" "${args[@]}"
  fi
done
