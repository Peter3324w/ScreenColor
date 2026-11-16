# Verification — 16 November 2026

## PlayTime design-system transfer

- 13 Node tests, complete browser feature checks and the Electron mock-engine smoke check pass after the styling transfer.
- New design integration check passes: exact five palette backgrounds, Midnight black/white contrast, all SVG icon placeholders filled, Linear/Bulk selected states, custom accent validation and reload persistence, Auto reset, sticky preview, and no overflow on adjustments/settings at 760px.
- Matched live before/after browser captures: 1280 × 900 CSS pixels, scale 1, dark, Adjustments at top, Peter reference selected. A Settings appearance capture also records the imported controls.
- Imported from PlayTime read-only; no source project modifications or dependency downloads. Source mapping and regeneration command are in `docs/design-system.md`.

## Image preview follow-up (full access)

After Peter granted full access, Electron and cached Chromium automation both run successfully under his normal account. Earlier sandbox failures below are historical, not current blockers.

- 13 Node tests pass, including SVG matrix channel ordering and the native-preview simulation bypass.
- Browser check passes: default image loads, Original/Adjusted render different image pixels, saturation changes the image, local image choice survives reload, default image restoration works, profiles/settings still work, and the 760px layout has no horizontal overflow. No page errors.
- Electron smoke passes its six preload/controller/profile/live-slider/reload/toggle checks with the explicitly mocked engine. This proves Electron UI integration, not physical screen processing or actual sign-in behavior.
- Matching browser captures for the preview change use 1020 × 820 CSS pixels, scale 1, Adjustments, Peter reference selected, dark theme, full page.
- Fresh review of the preview change found no critical or important issues. No downloads, packaging or native engine changes were needed.

## Passed

- `node --test test/*.test.cjs`: 11 tests, 11 passed. Includes strict color ranges/nonfinite inputs, neutral/reference math, gray preservation, versioned settings and malformed-file recovery, atomic persistence, acknowledgment-driven enabled state, apply/disk error restoration, protected/saved profiles, serialized mutations, temporary preview state, and retry after an executable launch failure.
- `node --check` for main/preload/renderer and development scripts: passed.
- `node scripts/compile.cjs`: native x64 development helper compiled using the already installed .NET Framework compiler. No installer or production packaging.
- `native/bin/ColorHost.exe --probe`: Windows accepted a tiny matrix, returned matching values, and the original matrix was restored and verified. This is API evidence, not a measurement of physical display quality.
- Native bridge refused to run while Peter's old `ColorTest-Range` process was active, with the explicit close-the-experiment message. This protects baseline capture from the old tool.
- Fresh design check found no important unresolved design questions.
- Whole implementation review found four important lifecycle issues: close without tray, preview persistence, native replacement/recovery ownership, and executable-launch retry. All were addressed. Preview persistence and retry now have regression tests observed failing before the fixes and passing after.

## Automation limits

- The reused Electron 33.4.11 runtime exits with code 1 before executing the app's JavaScript under the CodexSandboxOffline account. It produces no main-process startup marker or smoke report.
- A diagnostic run with the already installed Slipstream Electron 44.4.3 reaches the main process, but its renderer fails loading the local UI with ERR_FAILED and reports child GPU startup error 0xC0000135. Diagnostic flags did not resolve this. Runtime sandboxes were not disabled and no new runtime was downloaded. Default launcher continues to use the complete existing Electron 33 runtime, as other local apps do.
- Cached Playwright Chromium launches, but its page-creation promise does not complete before the process exits in this tool environment. The browser check records this as incomplete/failing, not passing. No rendered screenshot was fabricated.
- The browser UI preview is served at the verified localhost URL recorded at handoff. It is clearly a UI preview and does not control desktop color.
- Desktop launch under Peter's normal account, visual screenshot, full Electron-to-native interaction, tray use, actual sign-in startup and subjective color quality remain to be verified there. Peter was asked asynchronously to open the real launch script; no response had arrived when this record was written.

## Review fixes

Native restoration now uses an owned recovery journal plus the same named mutex for the helper, replacement startup and recovery child. A replacement restores any abandoned journal before capturing its baseline; a delayed watcher checks its owner ID and cannot overwrite a replacement's active transform. A normal exit removes the journal only after verified restoration. This coordination was source-reviewed/compiled; crash/replacement execution is still pending an isolated normal-account check.

Timed previews persist their prior enabled state and retain their timer during profile/preferences/display operations. A deliberate slider/preset/toggle action ends the temporary preview. Closing with tray mode disabled calls the full quit/restore path. Failed executable launches clear the bridge child state and can retry.

## Deferred capability

Version one uses the proven global RGB matrix only. Gamma, independent shadow/highlight curves, selective vibrance, per-display correction, hardware brightness, HDR and application-specific automation are not implemented or implied by the UI.
