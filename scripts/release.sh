#!/usr/bin/env bash
# Build the app on this Mac and upload it: iOS to TestFlight, Android to Google Play internal
# testing. No EAS build or submit queue.
#
#   scripts/release.sh ios        # build + upload iOS
#   scripts/release.sh android    # build + upload Android
#   scripts/release.sh all        # both, one after the other
#
# It builds the committed code (`eas build --local`; uncommitted changes aren't included), with
# the signing credentials stored on EAS, and EAS bumps the build number as for a cloud build.
# The builds are kept in build/releases/.
#
# Upload settings come from env vars, read from ~/.config/adhan-app/env (outside the repo):
#   ASC_API_KEY_ID, ASC_API_ISSUER_ID, ASC_API_KEY_PATH   App Store Connect API key (iOS)
#   PLAY_SERVICE_ACCOUNT_JSON                             Play service account key (Android)
#
# Needs: Xcode and CocoaPods (iOS), a JDK 17 and the Android SDK (Android), and Homebrew's
# fastlane (`brew install fastlane`) for both.
set -euo pipefail

# fastlane, CocoaPods and Gradle break without a UTF-8 locale.
export LANG="${LANG:-en_US.UTF-8}" LC_ALL="${LC_ALL:-en_US.UTF-8}"
export EAS_BUILD_NO_EXPO_GO_WARNING=true

ENV_FILE="$HOME/.config/adhan-app/env"
# shellcheck source=/dev/null
[ -f "$ENV_FILE" ] && source "$ENV_FILE"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/build/releases"
PACKAGE=com.conelabs.adhanapp

die() { echo "error: $*" >&2; exit 1; }
need() { [ -n "${!1:-}" ] || die "$1 is not set (put it in $ENV_FILE)"; }
step() { printf '\n==> %s\n' "$*"; }

case "${1:-}" in
  ios) platforms=(ios) ;;
  android) platforms=(android) ;;
  all) platforms=(ios android) ;;
  *) die "usage: $0 ios|android|all" ;;
esac

# Homebrew's fastlane brings its own Ruby; an rvm/rbenv one can be broken. Put only fastlane
# first on PATH, so CocoaPods still comes from wherever it works.
FASTLANE="${FASTLANE:-$( [ -x /opt/homebrew/bin/fastlane ] && echo /opt/homebrew/bin/fastlane || command -v fastlane || true)}"
[ -n "$FASTLANE" ] || die "fastlane is needed (brew install fastlane)"
shim="$(mktemp -d)"
trap 'rm -rf -- "$shim"' EXIT
ln -s "$FASTLANE" "$shim/fastlane"
export PATH="$shim:$PATH"

EAS=(npx --yes eas-cli)
command -v eas >/dev/null && EAS=(eas)

# Check the upload settings before spending 15 minutes on a build.
for p in "${platforms[@]}"; do
  if [ "$p" = ios ]; then
    need ASC_API_KEY_ID
    need ASC_API_ISSUER_ID
    ASC_API_KEY_PATH="${ASC_API_KEY_PATH:-$HOME/.appstoreconnect/private_keys/AuthKey_$ASC_API_KEY_ID.p8}"
    [ -f "$ASC_API_KEY_PATH" ] || die "App Store Connect key not found: $ASC_API_KEY_PATH"
  else
    need PLAY_SERVICE_ACCOUNT_JSON
    [ -f "$PLAY_SERVICE_ACCOUNT_JSON" ] || die "Play key not found: $PLAY_SERVICE_ACCOUNT_JSON"
    if [ -z "${JAVA_HOME:-}" ] || ! "$JAVA_HOME/bin/java" -version 2>&1 | grep -q '"17'; then
      JAVA_HOME="$(/usr/libexec/java_home -v 17 2>/dev/null)" || die "a JDK 17 is needed for Android"
      export JAVA_HOME
    fi
  fi
done

[ -z "$(git -C "$ROOT" status --porcelain)" ] ||
  echo "note: you have uncommitted changes; the build uses the last commit ($(git -C "$ROOT" rev-parse --short HEAD))."

mkdir -p "$OUT"
cd "$ROOT"

upload_ios() {
  # altool only looks for the key in a few folders, by file name.
  local want="$HOME/.appstoreconnect/private_keys/AuthKey_$ASC_API_KEY_ID.p8"
  if [ "$ASC_API_KEY_PATH" != "$want" ]; then
    mkdir -p "$(dirname "$want")" && install -m 600 "$ASC_API_KEY_PATH" "$want"
  fi
  xcrun altool --upload-app --type ios --file "$1" \
    --apiKey "$ASC_API_KEY_ID" --apiIssuer "$ASC_API_ISSUER_ID"
}

upload_android() {
  FASTLANE_SKIP_UPDATE_CHECK=1 FASTLANE_HIDE_CHANGELOG=1 "$FASTLANE" run upload_to_play_store \
    package_name:"$PACKAGE" aab:"$1" json_key:"$PLAY_SERVICE_ACCOUNT_JSON" \
    track:internal release_status:completed \
    skip_upload_metadata:true skip_upload_images:true skip_upload_screenshots:true \
    skip_upload_changelogs:true skip_upload_apk:true
}

for p in "${platforms[@]}"; do
  ext=$([ "$p" = ios ] && echo ipa || echo aab)
  file="$OUT/AdhanApp-$p-$(date +%Y%m%d-%H%M).$ext"

  step "Building $p locally ($(git rev-parse --short HEAD))"
  "${EAS[@]}" build --platform "$p" --profile production --local --non-interactive --output "$file"

  step "Uploading $(basename "$file")"
  if [ "$p" = ios ]; then
    upload_ios "$file"
    echo "Uploaded. It shows in TestFlight once Apple has processed it (usually 10–30 min)."
  else
    upload_android "$file"
    echo "Uploaded to Google Play internal testing."
  fi
done
