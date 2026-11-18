# Bug review — 18 November 2026

Reviewed the current desktop application, filter gallery, custom profiles, controller queue, saved-state validation, native bridge and lifecycle. Opened the ScreenColor folder in VS Code for Peter's inspection.

## Fixed

1. **An expired preview could override a newer action.** If native acknowledgment for a new filter or replacement preview arrived after the old preview deadline, the old timer's restore was already queued. Clearing the timer after acknowledgment did not remove that queued work. Each preview now owns a generation token, checked when the queued restore executes. Both reproductions failed before the fix and pass afterward using a fake bridge, without changing desktop colors. Regression: `node --test test/preview-race.test.cjs`.
2. **Rapid profile submissions could create duplicate profiles.** Two submits while the first save awaited its response produced two saved profiles. The full-app form now guards an in-flight save and disables its submit button until completion, resetting in finally. The browser regression failed with two saves before the fix and passes with one afterward. It also verifies that failed saves leave the form open and permit retry. Regression: `node scripts/renderer-check.cjs`.

## Verification

- All 30 Node tests pass, including the two new preview-timer regressions.
- All 22 mock-engine Electron smoke checks pass on an isolated rerun. The first run exceeded the runner's 60-second timeout while VS Code and browser checks were starting concurrently; the isolated rerun completed successfully.
- Full filter browser check, design/theme check and original browser feature check pass. Includes all filters, profile save/delete, local-image persistence, sticky preview, and narrow layouts.
- Renderer repeated-submit and failed-save/retry checks pass.
- JavaScript syntax checks across lib, electron, scripts, ui and test pass; git diff checks pass.
- Review of both fixes found no remaining important issues. Development app restarted to load the controller fix.

No production build, installer packaging, downloads, pushes or merges. Electron smoke uses an isolated mock engine; physical screen color accuracy and Windows sign-in/reboot behavior were not retested.
