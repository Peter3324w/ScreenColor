# TypeScript migration: shared data and core logic

19 November 2026. Phase 2 of the saved migration plan is complete. Electron/preload and UI conversions remain separate phases.

All `lib/` modules now use strict TypeScript: values, model/state validation, controller, store, native bridge, platform/popup/support helpers, experience preferences, startup registration and update checking. Disk, controller IPC inputs, native JSON and release metadata enter as `unknown` and are validated. Settings version, profile IDs, limits/defaults, preview generations, atomic backups and startup rollback are preserved.

Matrix and filter catalog each have one typed shared source. Node consumes CommonJS output; esbuild emits browser IIFEs with the existing `ColorPreview` and `ScreenColorFilters` names. HTML/CSS, images and visible behavior are unchanged. Project-owned esbuild 0.25.12 and its Windows binary added about 4.52 MB compressed; no Electron/browser runtime or packaging dependencies were downloaded.

Verification:

- Strict Node/DOM checks and correlated controller/native-command type fixtures passed. New expected-error fixtures initially failed because legacy JS accepted invalid payloads.
- All 49 Node tests passed: original 45, two malformed-native-reply regressions and two browser/Node shared-code checks. Native tests failed before validation was added. Malformed replies now reject pending work, clear the connection and permit reconnection.
- Real Electron passed all 22 isolated mocked-engine smoke checks. Browser feature/design/filter checks passed, including image persistence, eight filters, 760/1020/1280/1920 layouts, focus, duplicate-save/failure retry and no page errors.
- Browser and real isolated Electron tour/support/update checks passed. Toolchain source preservation/maps/typed browser compile/reload/stale-output checks passed.
- A fresh typed Store loaded existing live version-1 settings/profiles exactly, without writing or changing their bytes or issuing a native request.
- Independent read-only review reported no findings. Electron/preload/UI typing, production packaging and physical native-effect acceptance remain later work.

Preview: `http://localhost:3000`. Repeat checks using the milestone-1 verification commands; `npm test` compiles before testing. No production build, installer change, push or merge performed.
