# Notifications, contribution prompt, tour and startup repair

**Goal:** Implement the user's Screen Color experience improvements and correct startup detection.
**Spec:** ../specs/2026-11-18-notifications-tour-design.md
**Stack:** Existing Electron 33, CJS, plain DOM, Node tests and installed Playwright/Edge. Work on dev; no dependencies/build/download/push/merge.

- [x] Capture Settings/full workspace before edits; reserve UI History screen-color-013.
- [x] Startup: exact named Run/StartupApproved state and quoted paths, preserving disabled approval; serialized whole preferences transaction and exact rollback. Regression tests include overlapping requests and localized missing values versus access errors. Actual temporary-name Windows registry check restores the original state.
- [x] Experience: atomic separate persistence and validated flags/counters; 4 explicit launches, background/reload exclusions, backup recovery, prompt priority, failed saves and once-only dismissal covered. Main owns state and validated actions.
- [x] Updates: strict stable-version/release validator and bounded HTTPS checker; trusted asset/URL, newer/equal/older/prerelease/malformed, timeout/rate limits/offline/oversize, concurrent checks and no installer fetch covered. Scheduled/manual checks, deduplicated native notifications, snapshots and main-validated Download update action wired.
- [x] UI: existing-theme update banner, popup notice and Settings controls; once-only contribution dialog with 3 fixed actions and green donation button; welcome/spotlight tour with Skip/Back/Next/replay and focus handling. Waits behind dialogs, no hidden-workspace prompts or silent color changes.
- [x] Verify: all Node tests, existing mocked-engine smoke, focused real Electron/browser experience checks at 1280x900 and 760x680; inspect screenshots, review diff, fix review findings, record before/after in UI History, commit verified work locally on dev. Installed 0.1.1 unchanged until a requested build/install.

**Review focus:** startup disabling outside app; repeated/parallel launch/actions; stale update failures after success; tour on small/scrolled layouts; support persistence failure and focus restoration; renderer reload/quiet startup showing unintended dialogs; malicious release fields reaching shell.openExternal.

**Verified:** 45 Node tests, 22 existing mocked-engine smoke checks, focused browser experience checks, real isolated Electron experience IPC checks, and actual temporary Windows startup registry verification pass. Independent review findings fixed and re-reviewed clear. See ../../notifications-tour-verification.md for evidence and limits. No production build/install/push/merge.
