# Notifications, contribution prompt, tour and Windows startup repair

Date: 18 November 2026. Implements Peter's request for new-version notifications, a contribution/feedback/more-apps invitation after about four openings, a PlayTime-style interface tour, and investigation of the Windows startup warning. Peter selected the existing Cave support page for the contribution action.

## Result and boundaries

The current source includes release checks, Windows notification delivery when supported, an in-app update banner, Quick controls notice, manual checks/download actions, a one-time fourth-deliberate-launch invitation and a replayable nine-step tour. The startup fix reads the exact named registration and Windows approval state, quotes paths, preserves external disabling and serializes preference transactions with rollback.

The installed app and published 0.1.1 installer are unchanged. No new production build, installer upload, source push, merge or website deployment was performed for these additions. A later requested installer build is needed to distribute them.

## Startup diagnosis

The existing app wrote the named `Screen Color` Run value but verified Electron's legacy `openAtLogin` field, which reads by AppUserModelID. The named entry was actually registered/enabled when inspected. Its command also lacked quotes around the executable path containing spaces. [Electron 33.4.11's Windows implementation](https://github.com/electron/electron/blob/v33.4.11/shell/browser/browser_win.cc) shows the write/read mismatch.

The repair examines only the app's own HKCU Run and StartupApproved values. It repairs a known unquoted command without changing its approval state. Explicit user changes verify the result, commit the preference and marker together, and restore the exact original command/approval on failure. Serialized transactions prevent an older failure from rolling back a newer successful request. Missing keys/values are distinguished from access errors through readable registry listings, without English-only error matching.

## Verification performed

- `node --test test/*.test.cjs`: **45 tests pass**. Covers existing color behavior plus experience persistence/recovery/failed writes, deliberate versus background launches, once-only flags, exact release/asset URLs, stable versions, offline/rate-limit/oversize/JSON failures, coalesced checks, late responses after timeout, preserved known updates, quoted startup paths, disabled Windows approval, rollback, overlapping requests and localized missing/error cases.
- `node scripts/experience-check.cjs`: **passes** in headless Edge with an explicitly injected app API fixture. Exercises welcome and all nine tour steps, completion/skip/replay/persistence, hidden-workspace suppression, waiting behind a profile dialog, all three invitation destinations, green contribution action, failed external opening and failed dismissal save with retry, update download/dismiss/manual retry, desktop 1280×900 and narrow 760×680 layouts, and no page errors.
- `node scripts/experience-electron-check.cjs`: **passes** through the real main/preload/renderers in an isolated smoke-mode app. Confirms durable tour completion with unchanged color values/enabled state, the fourth explicit second-instance launch, exclusion of background/reload events, persistent invitation dismissal, update metadata shared with Quick controls, and a main-validated fixture download URL even when a malicious payload is supplied.
- `node scripts/smoke.cjs`: **all 22 existing Electron checks pass**, with an explicitly mocked native color engine.
- `node scripts/startup-check.cjs`: **passes against actual Windows registry values** using a unique temporary test name. Confirms quoted legacy repair, preservation of disabled approval, exact rollback and enable/disable. Restores/removes that temporary entry afterward; it does not modify the installed app's startup values.
- The updater detected the actual public 0.1.1 release when checked with a simulated current version of 0.1.0. Only release JSON was fetched; no installer was downloaded.
- Independent review found the overlapping-transaction and localized-error issues. Both received failing regression tests, fixes and a clear follow-up review.
- `git diff --check` passes. Visual inspection corrected inherited backdrop blur so the tour's highlighted target stays sharp. The mechanical UI detector's remaining warnings concern existing color-reference labels/contrast and incumbent card/text styles; those unrelated surfaces were not redesigned.

## What these checks do not claim

The native color engine was mocked for Electron verification; no physical desktop transform was enabled. External opening was intercepted in integration checks; no donation, real installer download or new Windows notification was triggered by those checks. A visible Windows toast under the user's notification settings, the next packaged installer and a fresh Windows sign-in remain acceptance checks for the later requested build/install.

## Evidence

The central UI History archive entry is `screen-color/013-notifications-tour-startup/`. Matching before/after Settings images use the original browser preview, Midnight theme, 1× scale and the same top-of-page framing at 1280×900 and 760×680. The narrow first viewport remains substantially unchanged because the new Settings sections are below it. Separate invitation/tour images use the labeled injected API fixture rather than a live native engine or a real future release. Capture-only hiding was not used.

Source design: [notifications/tour design](superpowers/specs/2026-11-18-notifications-tour-design.md). Implementation checklist: [plan](superpowers/plans/2026-11-18-notifications-tour.md).
