# Screen Color TypeScript migration

## Assessment and scope

Feasible, with moderate implementation effort. The repository has roughly 40 JS/CommonJS files across application code, tests and scripts. Some are generated/copied assets, and several compact files contain substantial logic, so raw line counts understate the work. This is a language/tooling migration of the existing Electron and plain-DOM app.

Keep `native/ColorHost.cs`, HTML, CSS, image assets, native recovery behavior, saved settings and the existing three-column UI intact. Retain Electron's CommonJS runtime compatibility rather than mixing in an unrelated module-system migration. Browser scripts must still run without Node APIs. Prefer a TypeScript compiler for Node/Electron source and a small renderer bundling step only if needed to consume shared modules cleanly. Choose and prove the exact output layout in Phase 1 before renaming more files.

Current verification baseline: 30 Node tests, 22 isolated mock-engine Electron checks, browser feature/design/filter checks, and a renderer repeated-save/failure-retry check. Existing JavaScript and TypeScript may coexist while modules move. Enable strict checking for migrated modules, without demanding that every untouched JavaScript asset be rewritten first.

Implementation started on 19 November 2026. The first milestone covers Phase 1, the typed color-value validator and shared data/action/API contracts from Phase 2. The remaining core, Electron and renderer conversions are later milestones.

## Global constraints

- Develop and commit verified milestones locally on `dev`; no automatic push or merge.
- Preserve existing profile IDs, values, settings format, startup behavior, tray controls and restoration on exit.
- TypeScript does not replace runtime validation of disk contents, IPC payloads or native responses. Receive external data as `unknown` and validate it.
- Do not use broad `any` annotations or blanket compiler suppression to make the migration appear complete.
- Keep generated JavaScript in a dedicated ignored output directory; never overwrite source files. Retain source maps for VS Code debugging.
- Keep production app builds and installer packaging deferred until Peter explicitly asks. Development compilation and tests are part of the migration.
- Check dependency/download sizes before installing. A planned batch above 50 MB requires Peter's go-ahead. Avoid downloading a second Electron or browser runtime during type-tool setup.

## Phase 1 — Tooling and a working development path

Targets: `package.json`, TypeScript configs, ignored output location, `scripts/launch.cjs`, `scripts/dev.cjs`, smoke/check entry points and asset-copy rules as needed.

1. Record a clean baseline and retain the current tests as behavior checks.
2. Add a project-owned TypeScript toolchain and Node types. A compiler is cached under Playtime, useful for an offline investigation, but the final project must declare its own tooling dependencies rather than silently depending on that cache.
3. Add `typecheck` and development compilation commands with separate Node/Electron and DOM environments. Allow untouched JS during transition.
4. Prove a small typed module through the real development path. Preserve one-click desktop launch, browser preview on localhost, UI reload, native helper location and asset loading.
5. Inspect packaging source configuration for the new compiled paths; do not run packaging.

Exit gate: the app and browser preview still run, the baseline checks pass, generated output is ignored, source maps point back to source, and compilation never writes over source files. Do not convert all files before this gate works.

## Phase 2 — Shared data and core logic

Targets: `lib/model.cjs`, `lib/controller.cjs`, `lib/store.cjs`, `lib/bridge.cjs`, the color matrix and preset catalog, plus small platform/popup/support helpers.

1. Define shared types for five-control values, filter definitions, saved profiles, persisted state, snapshots, native commands/replies and controller actions. Use discriminated action/payload types.
2. Convert pure value validation, matrix calculations and presets first. Make the catalog consumable by Node and browser outputs from one typed source.
3. Convert store/controller/bridge incrementally, including timers, promises, optional state, native response parsing and failure paths. Preserve preview generation checks.
4. Adapt tests to consume compiled output while retaining the existing Node test runner; test source can remain JS initially.

Exit gate: strict checking passes for converted modules; all Node tests pass, including saved-state recovery, native failures and queued preview expiry; existing saved settings reopen without migration/reset.

## Phase 3 — Electron and the preload API

Targets: `electron/main.cjs`, `electron/preload.cjs`, `electron/popup.cjs`.

1. Convert lifecycle, window/tray ownership and startup code while retaining CommonJS-compatible emitted files.
2. Define one typed `ScreenColorAPI` for preload and renderers: `getState`, the action/payload/result mapping and subscription cleanup.
3. Keep sender validation and payload validation at IPC boundaries. Share types without exposing Node or Electron internals to the renderer.
4. Check all compiled/source/resource path calculations, single-instance behavior, tray transitions and quit/restoration paths.

Exit gate: all 22 Electron smoke checks pass against compiled code, the actual dev app connects to the native helper, and the full UI and popup agree on selected filter and effect state.

## Phase 4 — Main UI, popup and previews

Targets: `ui/app.js`, `ui/popup.js`, `ui/appearance.js`, `ui/image-preview.js` and their declarations/imports.

1. Convert renderer entry points and remove duplicated state/value definitions in favor of shared types.
2. Type DOM elements and events precisely; narrow nullable lookups and validate numeric/file input. Type IndexedDB records and async preview state.
3. Handle missing/failed bridge responses explicitly. Preserve in-flight save guards, failed-save retry, live-slider ordering, gallery focus and chosen-image updates.
4. Keep generated `ui/icons.js` and copied PlayTime code as JS behind narrow typed declarations initially. Do not hand-rewrite generated assets merely to change extensions; adapt their generator separately if necessary.

Exit gate: browser feature/design/filter checks and renderer save/retry checks pass; no console errors; 760/1020/1280/1920px layouts and sticky masking match the current UI; full desktop smoke remains green.

## Phase 5 — Cleanup and final verification

1. Convert remaining hand-written tooling/tests where useful, or document the small intentional JS/CommonJS bootstrap/generator exceptions. Remove obsolete mixed-language shims and stale source references.
2. Make type checking cover all migrated application code under strict settings, with no accidental emitted files tracked. Keep build configuration and generated/vendor assets intentionally separate.
3. Run type checking, all Node tests, all browser checks and Electron smoke once as the final gate. Verify profile persistence, image storage, startup path resolution and native restoration behavior at the appropriate isolated/dev boundaries.
4. Update README startup/debugging instructions and installer source paths. A real installer verification remains a separate, explicitly requested production build/packaging step.

Exit gate: a clean checkout has documented, repeatable commands; VS Code can navigate the typed UI/API/controller/native bridge relationships; the user-visible app behaves the same.

## Suggested first milestone

Start with Phase 1 and the shared value/profile/action types from Phase 2. This delivers useful editor checks early, while the app remains usable. Commit each verified milestone separately. Avoid combining the migration with new features or UI changes.

### Milestone 1 implementation

- Pinned compiler workspace: install with `npm ci --workspace @screen-color/typescript-tooling --ignore-scripts --no-audit --no-fund` (about 4.85 MB compressed; excludes packaging dependencies/runtime downloads).
- Separate strict Node/Electron and DOM configs; legacy JavaScript accepted without requiring its conversion yet. Type fixtures cover action/payload mapping and environment isolation.
- Ignored `out/` layout, source maps, asset copies and orphan-output pruning; launch, preview, tests and smoke consume compiled code. Builder source configuration points at compiled paths; no production packaging performed.
- `lib/values.cts` owns typed limits/defaults/reference/unknown-input validation; `shared/types.ts` and `types/browser.d.ts` establish shared contracts. The remaining model/state logic, catalog, matrix, store/controller/bridge, Electron/preload and UI source remain JavaScript.
- Current baseline is 45 Node tests and 22 Electron smoke checks, reflecting the completed notifications/tour/startup work since this plan was first written.
- Verification record: [docs/typescript-milestone-1-verification.md](docs/typescript-milestone-1-verification.md).

## References

- TypeScript incremental migration: https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html
- Mixed JS/TS inputs: https://www.typescriptlang.org/tsconfig/allowJs.html
