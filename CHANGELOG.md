# Changelog

All notable changes to Adhan Times. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and versions follow the app's marketing version (`expo.version` in `app.json`).
Each version's `### What's new` is the store text, for users (≤ 500 characters, `scripts/whats_new.py`).

## [1.2.0] - Unreleased

## [1.1.0] - 2026-11-16

### What's new
New
• Prayer ending reminder: a notification 20 minutes before each prayer's time ends, like "Fajr ends in 20 minutes". It replaces the 10-minute reminder.
• Widgets show Sunrise, so you can see when Fajr ends.
• A new Fajr adhan recording.
• Settings shows which version you have.

Improved
• Widgets highlight the prayer whose time it is now, and the next one in gold.
• Today is tidier: the date and your city share one line.

### Added
- Settings shows the installed version and build number ([#68](https://github.com/talal7860/prayer-app/pull/68)).
- Widgets list Sunrise, the time Fajr ends ([#70](https://github.com/talal7860/prayer-app/pull/70)).
- "Prayer ending reminder": a notification 20 minutes before each prayer's time ends ("Fajr ends in 20 minutes"). It replaces the 10-minute heads-up, and it's on for anyone who had the heads-up on ([#70](https://github.com/talal7860/prayer-app/pull/70)).

### Changed
- A new Fajr adhan recording.
- Today: the date and the city are on one line. The calculation method's acronym (UKIS, ISNA…) sits above the list and opens Settings. The "Fajr has ended" line is gone ([#66](https://github.com/talal7860/prayer-app/pull/66)).

### Fixed
- Widgets fill the prayer whose time it is now, and the next one is gold. Before, the next prayer was filled, so it looked like Asr had started a few minutes before Asr ([#67](https://github.com/talal7860/prayer-app/pull/67)).
- Widgets fill Isha from Isha until Fajr. Before, only the next Fajr stood out ([#69](https://github.com/talal7860/prayer-app/pull/69)).

## [1.0.0] - 2026-11-13

First store release: the 2021 app, rebuilt.

### Platform
- Upgraded from React Native 0.65 to 0.88 with Expo SDK 58 (New Architecture), plus CI and deploys to TestFlight and Play ([#13](https://github.com/talal7860/prayer-app/pull/13)).
- Prettier and strict ESLint, enforced in CI ([#48](https://github.com/talal7860/prayer-app/pull/48)).
- Release tooling: per-platform deploys, the Apple team passed to CI builds, local `release.sh` builds, release settings in `.env.release` ([#30](https://github.com/talal7860/prayer-app/pull/30), [#32](https://github.com/talal7860/prayer-app/pull/32), [#44](https://github.com/talal7860/prayer-app/pull/44), [#46](https://github.com/talal7860/prayer-app/pull/46), [#58](https://github.com/talal7860/prayer-app/pull/58)).
- README ([#59](https://github.com/talal7860/prayer-app/pull/59)).

### Added
- Redesigned app: Today with the sky and sun arc, a first-run setup, notifications that keep coming for about 12 days, and home screen widgets ([#22](https://github.com/talal7860/prayer-app/pull/22)).
- Arabic and Urdu with right-to-left layout, and a monthly timetable PDF ([#29](https://github.com/talal7860/prayer-app/pull/29)).
- Widget redesign: sky, arc, rings, chips and list ([#36](https://github.com/talal7860/prayer-app/pull/36)).
- Qibla finder, then its own tab, with a haptic tap on the qibla and Recalibrate ([#40](https://github.com/talal7860/prayer-app/pull/40), [#41](https://github.com/talal7860/prayer-app/pull/41), [#42](https://github.com/talal7860/prayer-app/pull/42), [#45](https://github.com/talal7860/prayer-app/pull/45)).
- Live Activity countdown, opt-in, with a switch in Settings and in the setup ([#39](https://github.com/talal7860/prayer-app/pull/39), [#43](https://github.com/talal7860/prayer-app/pull/43)).
- Apple Watch app and complications ([#37](https://github.com/talal7860/prayer-app/pull/37)).
- Android widget with a ticking countdown and Hijri date ([#49](https://github.com/talal7860/prayer-app/pull/49)).
- Settings → Test notification ([#57](https://github.com/talal7860/prayer-app/pull/57)).
- Siri: ask for prayer times without opening the app ([#55](https://github.com/talal7860/prayer-app/pull/55)).
- iPad and foldable layouts ([#56](https://github.com/talal7860/prayer-app/pull/56)).
- Adhan sounds: Makkah, Madinah and Al-Aqsa, a Fajr adhan, and choosing one plays it ([#61](https://github.com/talal7860/prayer-app/pull/61), [#65](https://github.com/talal7860/prayer-app/pull/65)).
- Accessibility: screen readers, large text, contrast, watch and widgets ([#63](https://github.com/talal7860/prayer-app/pull/63)).

### Changed
- Prayer times come from the `adhan` library, and location is coarse only ([#31](https://github.com/talal7860/prayer-app/pull/31)).
- Today says "tomorrow" when the countdown is to tomorrow's Fajr, and "Fajr ends in" during Fajr ([#33](https://github.com/talal7860/prayer-app/pull/33), [#45](https://github.com/talal7860/prayer-app/pull/45)).
- Renamed to Adhan Times ([#51](https://github.com/talal7860/prayer-app/pull/51)).
- Removed background location: no Travel alerts and no "Always" permission ([#64](https://github.com/talal7860/prayer-app/pull/64)).

### Fixed
- Blank widget ([#31](https://github.com/talal7860/prayer-app/pull/31)).
- Android: asks for "Alarms & reminders" so the adhan isn't late ([#50](https://github.com/talal7860/prayer-app/pull/50)).
- No duplicate notifications: fixed ids, and anything pending that isn't planned is dropped ([#47](https://github.com/talal7860/prayer-app/pull/47)).
- Android release widget showed "Can't show content" ([#54](https://github.com/talal7860/prayer-app/pull/54)).
- Silent adhan on Android 17: a new channel with audio attributes ([#60](https://github.com/talal7860/prayer-app/pull/60)).
- Tests no longer depend on the machine's time zone ([#26](https://github.com/talal7860/prayer-app/pull/26)).

## 2021

The first version: prayer times from the device location, calculation methods, Asr setting, and a notification with the Makkah azan for each prayer ([#1](https://github.com/talal7860/prayer-app/pull/1), [#2](https://github.com/talal7860/prayer-app/pull/2)).

[1.2.0]: https://github.com/talal7860/prayer-app/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/talal7860/prayer-app/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/talal7860/prayer-app/releases/tag/v1.0.0
