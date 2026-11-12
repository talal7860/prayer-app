#!/usr/bin/env bash
# Upload a build to TestFlight (iOS) or Google Play internal testing (Android) from this Mac,
# without EAS Submit and its queue.
#
#   scripts/upload-build.sh ios                  # the latest finished EAS cloud build
#   scripts/upload-build.sh android path/app.aab # a file you already have
#
# Settings come from the environment (see CLAUDE.md → CI / CD):
#   ASC_API_KEY_ID, ASC_API_ISSUER_ID, ASC_API_KEY_PATH   App Store Connect API key (iOS)
#   PLAY_SERVICE_ACCOUNT_JSON                             Play service account key (Android)
# ~/.config/adhan-app/env is read if it exists.
set -euo pipefail
# fastlane and CocoaPods break without a UTF-8 locale.
export LANG="${LANG:-en_US.UTF-8}" LC_ALL="${LC_ALL:-en_US.UTF-8}"

ENV_FILE="$HOME/.config/adhan-app/env"
# shellcheck source=/dev/null
[ -f "$ENV_FILE" ] && source "$ENV_FILE"

PACKAGE=com.conelabs.adhanapp
platform="${1:-}"
file="${2:-}"

die() { echo "error: $*" >&2; exit 1; }
need() { [ -n "${!1:-}" ] || die "$1 is not set (put it in $ENV_FILE)"; }

case "$platform" in
  ios) ext=ipa ;;
  android) ext=aab ;;
  *) die "usage: $0 ios|android [file.ipa|file.aab]" ;;
esac

# No file: download the newest finished EAS cloud build for the platform. (Local builds keep
# their file on the Mac, so EAS has nothing to download for them; they're skipped.)
if [ -z "$file" ]; then
  command -v jq >/dev/null || die "jq is needed to read the EAS build list (brew install jq)"
  echo "Looking up the latest finished $platform build on EAS…"
  json=$(npx --yes eas-cli build:list --platform "$platform" --status finished --limit 20 \
    --non-interactive --json 2>/dev/null)
  pick='[.[] | select(.artifacts.buildUrl)][0]'
  url=$(jq -r "$pick.artifacts.buildUrl // empty" <<<"$json")
  number=$(jq -r "$pick.appBuildVersion // \"?\"" <<<"$json")
  [ -n "$url" ] || die "no finished $platform build found on EAS"
  file="$(mktemp -d)/AdhanApp-$platform-$number.$ext"
  echo "Downloading build $number…"
  curl -fsSL -o "$file" "$url"
fi
[ -f "$file" ] || die "no such file: $file"

if [ "$platform" = ios ]; then
  need ASC_API_KEY_ID
  need ASC_API_ISSUER_ID
  key="${ASC_API_KEY_PATH:-$HOME/.appstoreconnect/private_keys/AuthKey_$ASC_API_KEY_ID.p8}"
  [ -f "$key" ] || die "App Store Connect key not found: $key"
  # altool only looks for the key in a few folders, by file name.
  want="$HOME/.appstoreconnect/private_keys/AuthKey_$ASC_API_KEY_ID.p8"
  if [ "$key" != "$want" ]; then
    mkdir -p "$(dirname "$want")" && install -m 600 "$key" "$want"
  fi
  echo "Uploading $file to App Store Connect…"
  xcrun altool --upload-app --type ios --file "$file" \
    --apiKey "$ASC_API_KEY_ID" --apiIssuer "$ASC_API_ISSUER_ID"
  echo "Done. It shows in TestFlight once Apple has processed it (usually 10–30 min)."
else
  need PLAY_SERVICE_ACCOUNT_JSON
  [ -f "$PLAY_SERVICE_ACCOUNT_JSON" ] || die "Play key not found: $PLAY_SERVICE_ACCOUNT_JSON"
  # Homebrew's fastlane brings its own Ruby; prefer it over one from rvm/rbenv.
  fastlane="${FASTLANE:-$( [ -x /opt/homebrew/bin/fastlane ] && echo /opt/homebrew/bin/fastlane || command -v fastlane || true)}"
  [ -n "$fastlane" ] || die "fastlane is needed for Android uploads (brew install fastlane)"
  echo "Uploading $file to Google Play (internal testing)…"
  FASTLANE_SKIP_UPDATE_CHECK=1 FASTLANE_HIDE_CHANGELOG=1 "$fastlane" run upload_to_play_store \
    package_name:"$PACKAGE" aab:"$file" json_key:"$PLAY_SERVICE_ACCOUNT_JSON" \
    track:internal release_status:completed \
    skip_upload_metadata:true skip_upload_images:true skip_upload_screenshots:true \
    skip_upload_changelogs:true skip_upload_apk:true
  echo "Done. It's on Play's internal testing track."
fi
