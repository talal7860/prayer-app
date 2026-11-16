---
name: production-release
description: Release Adhan Times to production - the tested TestFlight and Play internal testing builds go to the App Store and Google Play with a user-facing "What's new", and GitHub gets a release with its generated changelog. Use when asked to release, ship, publish or promote a version to production or the stores (not for TestFlight/internal uploads, which are scripts/release.sh).
---

# Production release

`scripts/production-release.sh` does the release. This skill prepares it, runs it with the
owner's answers, and reports. **It submits to Apple and Google and publishes a GitHub release:
never run it without `--dry-run` until the owner has said yes to the exact summary in this turn.**

## 1. Which builds

The builds must already be on TestFlight and Play internal testing (`scripts/release.sh`, which
also records each build's commit in `build/releases/builds.tsv`). List them read-only:

```bash
scripts/production-release.sh all --dry-run --yes
```

Ask the owner which iOS build and Android versionCode they tested and approve (default: the
newest), unless they already said. Also ask, if they haven't said: iOS released automatically
after Apple's approval or by hand, and the Android rollout % (100 = everyone).

## 2. "What's new" for users

The store text comes from `scripts/whats_new.py <version>`: the version's `### What's new`
subsection in `CHANGELOG.md`, or, without one, a rough draft from its Added/Changed/Fixed bullets.
Write the subsection (the draft is only a fallback). Read the version's CHANGELOG section and the
merged PRs (`gh pr list --state merged --base master --search "merged:>=<last release date>"`),
then write for someone who uses the app, not for developers:

- What they'll notice and why it helps, in plain words: "Widgets show Sunrise, so you can see
  when Fajr ends", not "Added sunrise to IN_LIST".
- No PR numbers, file names, library names, CI or build tooling (the Platform section is never
  in it), no "Before, …" explanations.
- Group under `New`, `Improved`, `Fixed` (skip an empty one), one `• ` line per change, most
  noticeable first; leave out changes users can't see.
- **≤ 500 characters in all** (Play's limit; the same text goes to both stores). Check with
  `scripts/whats_new.py <version> | wc -m`.
- English only (Play's listing language is en-CA; App Store gets the same text in every locale).

Also date the version: `## [1.1.0] - Unreleased` → `## [1.1.0] - <today>`, and add the next
version's `[x.y.z]: …/compare/v<version>...HEAD` link. Put both in a PR to master (the script
reads CHANGELOG.md from `origin/master`), show the owner the text, and merge it when they approve.

## 3. Dry run, confirm, release

```bash
scripts/production-release.sh all --version 1.1.0 --build 24 --version-code 17 --rollout 100 --dry-run --yes
```

It checks everything with the stores (App Store Connect read, Play validates the edit) and
previews GitHub's generated notes for `v<version>` (PRs since the previous `v` tag). Show the
owner: the builds, the release timing and rollout, the What's new text, the commit to tag and
GitHub's notes. Ask for a clear yes.

Then the same command without `--dry-run` (add `--manual-release` for a manual iOS release,
`--commit <sha>` if the tag should be another commit, `--skip-github` if they don't want a
release). It submits iOS for review, promotes Android to production, then creates the GitHub
release `v<version>` with `--generate-notes`. The owner can also run it themselves without
flags: it asks every question and ends with a y/N.

## 4. Report

Say what was submitted (version, build, versionCode, rollout), the GitHub release link
(`gh release view v<version> --json url -q .url`), and that Apple and Google review it first
(hours to a few days). If a step failed, say which, and that the ones before it went through:
the order is App Store, Play, GitHub. Re-running is safe: an already submitted App Store version
and an existing GitHub release are skipped.

## Notes

- Credentials come from `~/.config/adhan-app/env` / `.env.release` (`ASC_API_*`,
  `PLAY_SERVICE_ACCOUNT_JSON`); never print or commit them.
- "Another version is still open in App Store Connect": a version in Prepare for Submission or
  Rejected blocks a new one; the owner submits or removes it, or passes that `--version`.
- A Play edit left open by a failed run is deleted by the script.
- After the release, bump `expo.version` in a PR for the next version and add its
  `## [next] - Unreleased` section.
