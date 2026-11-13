# Adhan Times

A prayer-times app for iPhone, iPad, Apple Watch and Android. It works out the five daily prayers
for where you are, plays the adhan at each one, and keeps the times on your home screen, lock
screen and wrist. English, Arabic and Urdu, with a right-to-left layout for the last two.

## Features

- **Today**: a sky that follows the time of day, a live countdown to the next prayer ("Fajr ends
  in…" during Fajr), the sun on an arc, the Hijri date, and a bell per prayer to mute it.
- **Qibla**: a compass to the Kaaba with a light haptic tap when you face it, and a recalibrate
  button.
- **Week**: seven days of times, and a monthly timetable you can share as a PDF.
- **Settings**: location (GPS or a typed city), calculation method, Asr, high-latitude rule,
  per-prayer minute adjustments, adhan sound, a 10-minute reminder, 12/24 h, travel alerts, and a
  test notification.
- **First-run setup**: location, method and Asr (preselected for your country), then today's times.
- **Notifications**: the Makkah adhan at every prayer, about 12 days ahead, kept topped up by a
  background task so they don't stop if the app isn't opened.
- **Widgets**: iOS home and lock screen widgets with a live countdown, an Android widget with a
  ticking countdown, and an optional Live Activity / Dynamic Island in the hour before a prayer.
- **Apple Watch**: an app and complications that calculate the times on the watch.
- **Siri, Shortcuts and Spotlight**: "What prayer time is it in Adhan Times?", "When is Isha in
  Adhan Times?", "What's the next prayer in Adhan Times?".
- **iPad and foldables**: a wide layout for iPad and an open foldable, and a compact one for a
  cover screen.
- **Travel**: when your prayer times change because you're in another city, the app offers to
  update them, and optionally notifies you.

## Tech stack

| Area | What's used |
|---|---|
| App | [Expo](https://expo.dev) SDK 58, React Native 0.88 (New Architecture), React 19, TypeScript |
| Navigation | React Navigation 7 (native stack + bottom tabs) |
| Prayer times | [`adhan`](https://github.com/batoulapps/adhan-js) in the app, [adhan-swift](https://github.com/batoulapps/adhan-swift) (vendored) on the watch and for Siri, so both give the same times |
| Notifications | `expo-notifications` (local only, no push), `expo-background-task` |
| Location and compass | `expo-location` |
| Widgets and Live Activity | `expo-widgets` + `@expo/ui` (SwiftUI on iOS, Glance on Android) |
| Apple Watch and Siri | SwiftUI + WidgetKit + App Intents, added with [`@bacons/apple-targets`](https://github.com/EvanBacon/expo-apple-targets) |
| Storage | AsyncStorage, plus an App Group shared with the watch, widgets and Siri |
| Translations | `i18n-js` + `expo-localization` |
| Tests and tooling | Jest (`jest-expo`) + React Native Testing Library, strict `typescript-eslint`, Prettier |
| Builds and stores | [EAS Build](https://docs.expo.dev/build/introduction/) and EAS Submit, TestFlight, Google Play |

## How it works

**Native projects are generated.** `ios/` and `android/` aren't in git
([Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/)):
`npx expo prebuild` makes them from `app.json`, `app.config.js` and config plugins. Native code
we own lives in three places instead:

- `targets/`: the watch app, its complications and the Siri intents (Swift), compiled by
  `@bacons/apple-targets`. `targets/_shared/PrayerCore.swift` holds the Swift side of the prayer
  maths and settings.
- `modules/`: small local Expo modules: `watch-sync` (sends settings to the watch and the App
  Group), `exact-alarm` (Android "Alarms & reminders" access) and `window-controls` (iPad window
  controls).
- `patches/`: a [`patch-package`](https://github.com/ds300/patch-package) patch to `expo-widgets`
  that adds a ticking countdown (a native `Chronometer`) to Android widgets, and an alarm that
  redraws the widget at each prayer.

**One calculation everywhere.** `app/lib/prayerTimes.ts` turns the settings into times with the
`adhan` library. The watch, its complications and Siri use the same library in Swift, with the same
method mapping, from settings the phone shares through WatchConnectivity and the App Group.

**Logic is kept out of the screens.** Pure, tested modules in `app/lib/` decide what to show and
schedule: the period of day and countdowns (`prayerDay.ts`), which notifications to set
(`schedule.ts`), the widget data (`widgetData.ts`), the Qibla bearing (`qibla.ts`). They don't
import React, so the background task can use them too.

**Notifications that keep coming.** iOS allows 64 pending local notifications, so the app plans
as many prayers as fit (about 12 days) plus one "open the app" reminder, and refills them on every
launch, settings change and day change, and from a background task. Each notification has a fixed
id, so overlapping refills can't leave duplicates. On Android 14+ the app asks for "Alarms &
reminders", without which Android may deliver the adhan late.

**Widgets.** On iOS the app gives WidgetKit a two-day timeline with a live countdown. Android
widgets can't take a timeline or tick on their own, so the app sends two days of data, the widget
picks the current entry when it draws, and the patched native countdown ticks between redraws.

## Project structure

```
App.tsx                 navigation, fonts, the settings provider
app/
  screens/              Today, Qibla, Week, Settings, Setup
  components/ui/        Text, Icon, Card/Row, Segmented, Toggle, ChoiceList
  lib/                  prayer maths, scheduling, widget data, Qibla, timetable (pure, tested)
  hooks/                usePrayerDay, useHeading, useExactAlarms, ...
  widgets/              iOS and Android widgets, the Live Activity
  locales/              en / ar / ur strings, and native strings (app name, permission prompts)
  theme/tokens.ts       colours, sky gradients, fonts
targets/                Apple Watch app, complications, Siri intents (Swift)
modules/                local Expo modules
patches/                patch-package patches
scripts/release.sh      build on this Mac and upload to TestFlight / Google Play
__tests__/              Jest tests
```

## Getting started

You need Node 22, Yarn 1, and Xcode (iOS) or Android Studio with a JDK 17 (Android). The app uses
native modules, so it runs in a development build, not Expo Go.

```bash
yarn install            # also applies patches/ (postinstall)
npx expo run:ios        # or: npx expo run:android
```

Signing for iOS needs your Apple team id in `EXPO_APPLE_TEAM_ID` (see "Releasing" below).

Checks, the same ones CI runs on every pull request:

```bash
yarn format:check
yarn lint
yarn typecheck
yarn test
npx expo-doctor
```

[`CLAUDE.md`](CLAUDE.md) has the detailed notes: how each feature is built, the gotchas, and how to
test the watch, widgets and Live Activity in the simulator.

## Releasing

Build numbers are managed by EAS (`appVersionSource: remote`), so never bump them by hand; bump
`expo.version` in `app.json` for a new marketing version.

- **EAS in the cloud** (the default): GitHub → Actions → **Deploy** → Run workflow. It runs the
  checks, then builds both platforms on EAS and submits iOS to TestFlight and Android to Google
  Play internal testing. It only queues the builds; results are on expo.dev.
- **On your Mac**, which skips the EAS queues: `scripts/release.sh ios|android|all` builds the last
  commit locally and uploads it (`altool` for TestFlight, fastlane for Google Play).

Secrets and ids are never in the repo (it's public). They live in:

| What | Where |
|---|---|
| Signing certificates and profiles, the App Store Connect API key, the Play service account | EAS (`eas credentials`) |
| `EXPO_TOKEN` and `APPLE_TEAM_ID` for CI | GitHub repository secrets |
| `EXPO_APPLE_TEAM_ID` for cloud builds | EAS environment variables (production) |
| Your local keys and ids for `release.sh` | `.env.release` (git-ignored; copy `.env.release.example`) |

## How this repo was developed

- It started in 2021 as a bare React Native 0.65 app using PrayTimes.js. In November 2026 it was
  moved to Expo SDK 58 with Continuous Native Generation, and the unmaintained libraries were
  replaced (push notifications → `expo-notifications`, geolocation → `expo-location`, PrayTimes →
  `adhan`).
- The UI follows a design canvas ("Adhan App Redesign"), worked through board by board: the app,
  the widgets and lock screen, the Apple Watch, iPad and foldables, and the icon.
- Work is tracked in GitHub issues (epics with sub-issues). Each change goes through a pull request
  that CI checks, and is squash-merged into `master`; a ruleset requires branches to be up to date
  and green.
- Much of it was written with [Claude Code](https://claude.com/claude-code). `CLAUDE.md` is kept up
  to date as the project's working notes, for people and coding agents alike.

## Credits

- Prayer times: [adhan-js and adhan-swift](https://github.com/batoulapps) by Batoul Apps (MIT).
  The first version used [PrayTimes.org](http://praytimes.org).
- Typeface: [Inter](https://rsms.me/inter/).
