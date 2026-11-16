#!/usr/bin/env bash
# Production release: the builds you tested (TestFlight, Play internal testing; uploaded by
# scripts/release.sh) go to the App Store and Google Play, and GitHub gets a release.
#
#   scripts/production-release.sh [ios|android|all] [options]
#
# 1. Asks which stores, the version, and which build of each goes out (it lists the builds; the
#    newest is the default). That's the build you approve for production.
# 2. "What's new": drafted for users by scripts/whats_new.py from CHANGELOG.md on origin/master
#    (its `### What's new` text if there is one). Keep, edit, write your own, or none. One text for
#    both stores, ≤ 500 characters (Play's limit).
# 3. iOS: release automatically after Apple approves it, or by hand. Android: % of users.
# 4. Checks everything with the stores (Play validates the change, App Store Connect is read) and
#    previews GitHub's generated release notes, then asks once: y/N.
# 5. Submits for App Store review and to Play production, then creates the GitHub release
#    v<version> on the commit the builds were made from, with GitHub's generated notes (the PRs
#    since the previous v tag).
#
# Options answer the questions up front (with --yes, unasked ones take the default):
#   --version 1.1.0      marketing version (default: expo.version in app.json)
#   --build N            iOS build number (default: the newest processed one)
#   --version-code N     Android versionCode on internal testing (default: the newest)
#   --rollout 20         Android: % of users, below 100 = staged rollout (default: 100)
#   --manual-release     iOS: release by hand after approval (default: automatically)
#   --notes-file F       the What's new text (default: scripts/whats_new.py)
#   --commit SHA         the commit for the GitHub release (default: the one release.sh recorded
#                        for the chosen builds in build/releases/builds.tsv, else origin/master)
#   --skip-github        no GitHub release
#   --dry-run            check and preview everything; change nothing
#   --yes                ask nothing (the final y/N included)
#
# Settings are the ones release.sh reads (~/.config/adhan-app/env, then .env.release):
# ASC_API_KEY_ID, ASC_API_ISSUER_ID, ASC_API_KEY_PATH (iOS), PLAY_SERVICE_ACCOUNT_JSON (Android).
# Needs python3, openssl and gh (signed in).
set -euo pipefail

export LANG="${LANG:-en_US.UTF-8}" LC_ALL="${LC_ALL:-en_US.UTF-8}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env.release"
for file in "$HOME/.config/adhan-app/env" "$ENV_FILE"; do
  # shellcheck source=/dev/null
  [ -f "$file" ] && { set -a; source "$file"; set +a; }
done
export GIT_PAGER=cat GH_PAGER=cat

PACKAGE=com.conelabs.adhanapp
NOTES_MAX=500
BUILDS_TSV="$ROOT/build/releases/builds.tsv"

die() { echo "error: $*" >&2; exit 1; }
need() { [ -n "${!1:-}" ] || die "$1 is not set (put it in $ENV_FILE)"; }
step() { printf '\n==> %s\n' "$*"; }
json() { python3 -c 'import json,sys; d=json.load(open(sys.argv[1]))
for k in sys.argv[2:]: d=d[k]
print(d)' "$@"; }
chars() { python3 -c 'import sys; print(len(open(sys.argv[1], encoding="utf-8").read().strip()))' "$1"; }
editor() { "${VISUAL:-${EDITOR:-nano}}" "$1"; }
indent() { sed 's/^/    /' "$1"; }

platforms=() version="" build="" code="" rollout="" manual="" notes_file="" commit=""
github=true dry=false yes=false
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
    --commit) commit="${2:?}"; shift 2 ;;
    --skip-github) github=false; shift ;;
    --dry-run) dry=true; shift ;;
    --yes) yes=true; shift ;;
    -h | --help) sed -n '2,/^set -e/p' "$0" | sed '$d; s/^# \{0,1\}//'; exit 0 ;;
    *) die "unknown option: $1 (see $0 --help)" ;;
  esac
done

# ask "Question" default → the answer (the default with --yes or just Enter).
ask() {
  local answer
  if $yes; then echo "$2"; return; fi
  read -r -p "$1 [$2] " answer || true
  echo "${answer:-$2}"
}

work="$(mktemp -d)"
trap 'rm -rf -- "$work"' EXIT
cd "$ROOT"

if $github; then
  command -v gh >/dev/null || die "gh is needed for the GitHub release (or pass --skip-github)"
  gh auth status >/dev/null 2>&1 || die "gh isn't signed in (gh auth login), or pass --skip-github"
fi
git fetch --quiet --tags origin master

# --- Stores and version ----------------------------------------------------------------------
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

git show origin/master:CHANGELOG.md >"$work/CHANGELOG.md"
grep -q "^## \[$version\]" "$work/CHANGELOG.md" || die "CHANGELOG.md on master has no [$version] section"
grep -q "^## \[$version\] - Unreleased" "$work/CHANGELOG.md" &&
  echo "note: CHANGELOG.md on master still calls $version Unreleased (date it in a PR)."

# --- Which builds ------------------------------------------------------------------------------
if has ios; then
  need ASC_API_KEY_ID
  need ASC_API_ISSUER_ID
  export ASC_API_KEY_ID ASC_API_ISSUER_ID
  export ASC_API_KEY_PATH="${ASC_API_KEY_PATH:-$HOME/.appstoreconnect/private_keys/AuthKey_$ASC_API_KEY_ID.p8}"
  [ -f "$ASC_API_KEY_PATH" ] || die "App Store Connect key not found: $ASC_API_KEY_PATH"
  asc=(python3 "$ROOT/scripts/appstore_submit.py"
    --app "$(json "$ROOT/eas.json" submit production ios ascAppId)" --version "$version")
  if [ -z "$build" ]; then
    step "TestFlight builds of $version"
    "${asc[@]}" --list | tee "$work/ios-builds.txt"
    newest="$(sed -nE '1s/^[^(]*\(([0-9]+)\).*/\1/p' "$work/ios-builds.txt")"
    build="$(ask 'iOS: which build goes to production?' "$newest")"
  fi
fi

if has android; then
  need PLAY_SERVICE_ACCOUNT_JSON
  [ -f "$PLAY_SERVICE_ACCOUNT_JSON" ] || die "Play key not found: $PLAY_SERVICE_ACCOUNT_JSON"
  play=(python3 "$ROOT/scripts/play_promote.py" --package "$PACKAGE" --key "$PLAY_SERVICE_ACCOUNT_JSON")
  if [ -z "$code" ]; then
    step "Play internal testing"
    "${play[@]}" --list | tee "$work/play-builds.txt"
    newest="$(sed -nE 's/.*versionCode ([0-9]+).*\(newest\).*/\1/p' "$work/play-builds.txt" | head -1)"
    code="$(ask 'Android: which versionCode goes to production?' "$newest")"
  fi
fi

# --- The commit, for the GitHub release ----------------------------------------------------------
# release.sh records "platform version build commit" for every upload.
recorded() {
  [ -f "$BUILDS_TSV" ] || return 0
  awk -F'\t' -v p="$1" -v v="$version" -v n="$2" '$1 == p && $2 == v && $3 == n { c = $4 } END { if (c) print c }' "$BUILDS_TSV"
}
if $github && [ -z "$commit" ]; then
  ios_commit="" android_commit=""
  has ios && ios_commit="$(recorded ios "$build")"
  has android && android_commit="$(recorded android "$code")"
  if [ -n "$ios_commit" ] && [ -n "$android_commit" ] && [ "$ios_commit" != "$android_commit" ]; then
    echo "note: the iOS build is from $(git rev-parse --short "$ios_commit"), the Android build from $(git rev-parse --short "$android_commit")."
  fi
  guess="${ios_commit:-${android_commit:-$(git rev-parse origin/master)}}"
  step "GitHub release v$version"
  git log -1 --format='Commit: %h %s (%cs)' "$guess"
  [ -n "$ios_commit$android_commit" ] || echo "(release.sh didn't record these builds, so this is origin/master)"
  commit="$(ask 'Tag this commit? (Enter = yes, or give another commit)' "$(git rev-parse --short "$guess")")"
fi
if $github; then
  commit="$(git rev-parse --verify "$commit^{commit}" 2>/dev/null)" || die "unknown commit: $commit"
  git merge-base --is-ancestor "$commit" origin/master || die "$commit isn't on origin/master"
  prev="$(git describe --tags --abbrev=0 --match 'v*' "$commit^" 2>/dev/null || true)"
  [ "$prev" = "v$version" ] && prev=""
fi

# --- What's new ----------------------------------------------------------------------------------
notes="$work/notes.txt"
if [ -n "$notes_file" ]; then
  cp "$notes_file" "$notes"
else
  python3 "$ROOT/scripts/whats_new.py" "$version" --changelog "$work/CHANGELOG.md" --max $NOTES_MAX >"$notes"
  while ! $yes; do
    step "What's new in $version ($(chars "$notes") characters)"
    if [ -s "$notes" ]; then indent "$notes"; else echo "    (none)"; fi
    case "$(ask "(k)eep, (e)dit, (w)rite new, or (n)one?" k)" in
      k | K) break ;;
      e | E) editor "$notes" ;;
      w | W) : >"$notes"; editor "$notes" ;;
      n | N) : >"$notes"; break ;;
      *) echo "Pick k, e, w or n." ;;
    esac
  done
fi
[ ! -s "$notes" ] || [ "$(chars "$notes")" -le $NOTES_MAX ] ||
  die "What's new is $(chars "$notes") characters; Play allows $NOTES_MAX"

# --- Release options -----------------------------------------------------------------------------
if has ios && [ -z "$manual" ]; then
  case "$(ask 'iOS: once Apple approves it, release (a)utomatically or (m)anually?' a)" in
    m | M) manual=true ;;
    *) manual=false ;;
  esac
fi
if has android; then
  [ -n "$rollout" ] || rollout="$(ask 'Android: roll out to what % of users? (below 100 = staged)' 100)"
  fraction="$(awk -v p="${rollout%\%}" 'BEGIN { if (p > 0 && p <= 100) printf "%g", p / 100; else exit 1 }')" ||
    die "the rollout is a percentage, 1–100"
fi

ios_args() {
  local a=(--build "$build")
  [ -s "$notes" ] && a+=(--notes-file "$notes")
  ${manual:-false} && a+=(--manual-release)
  echo "${a[@]}"
}
play_args() {
  local a=(--version-code "$code" --rollout "$fraction")
  [ -s "$notes" ] && a+=(--notes-file "$notes")
  echo "${a[@]}"
}

# --- Check with the stores, preview, confirm -----------------------------------------------------
# (Paths in $work have no spaces, so the word splitting of ios_args/play_args is safe.)
# shellcheck disable=SC2046
for p in "${platforms[@]}"; do
  if [ "$p" = ios ]; then
    step "Check: App Store $version ($build)"
    "${asc[@]}" $(ios_args) --dry-run
  else
    step "Check: Google Play versionCode $code"
    "${play[@]}" $(play_args) --dry-run
  fi
done
if $github; then
  step "Check: GitHub release v$version on $(git rev-parse --short "$commit")${prev:+, changes since $prev}"
  if gh release view "v$version" >/dev/null 2>&1; then
    echo "v$version already exists on GitHub; it'll be left as it is."
  else
    gh api "repos/{owner}/{repo}/releases/generate-notes" -f tag_name="v$version" \
      -f target_commitish="$commit" ${prev:+-f previous_tag_name="$prev"} --jq .body |
      sed 's/^/    /'
  fi
fi

if $dry; then
  echo
  echo "Dry run: nothing was submitted or created."
  exit 0
fi
step "Ready"
has ios && echo "  App Store: $version ($build) for review, released $($manual && echo 'by hand' || echo 'automatically') after approval"
has android && echo "  Google Play: versionCode $code to production, $rollout% of users"
$github && echo "  GitHub: release v$version on $(git rev-parse --short "$commit")"
[ -s "$notes" ] && echo "  What's new: $(chars "$notes") characters" || echo "  What's new: none"
answer="$(ask 'Release to production now? (y/N)' n)"
$yes || [[ "$answer" =~ ^[yY] ]] || die "cancelled; nothing was submitted"

# --- Release -------------------------------------------------------------------------------------
# shellcheck disable=SC2046
for p in "${platforms[@]}"; do
  if [ "$p" = ios ]; then
    step "App Store: submitting $version ($build)"
    "${asc[@]}" $(ios_args) --yes
  else
    step "Google Play: promoting versionCode $code"
    "${play[@]}" $(play_args) --yes
  fi
done
if $github; then
  step "GitHub: release v$version"
  if gh release view "v$version" >/dev/null 2>&1; then
    echo "v$version already exists; left as it is."
  else
    gh release create "v$version" --target "$commit" --title "$version" --generate-notes \
      ${prev:+--notes-start-tag "$prev"}
    git fetch --quiet --tags origin
  fi
fi
echo
echo "Done. Apple and Google review the builds before they reach the stores (hours to a few days)."
