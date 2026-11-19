# TypeScript migration: first milestone

19 November 2026. Implements the saved plan's suggested first milestone: Phase 1 tooling/development output and the initial shared contracts/color-value validator from Phase 2. This is an incremental migration, not a completed conversion of the app.

## Changes

- Project-owned npm compiler workspace pins TypeScript 5.9.3, `@types/node` 22.20.5 and `undici-types` 6.21.0. Selective installation downloaded about 4.85 MB. The full root dependency tree measured about 91.33 MB compressed and was not downloaded. No Electron or browser runtime was downloaded.
- Strict Node/Electron and DOM configurations emit to ignored `out/`; untouched JS is accepted with `checkJs: false`. Narrow compile-time fixtures exercise action payloads, missing required arguments, fixed support destinations and environment isolation. Expected type errors exist only in those fixtures.
- `lib/values.cts` owns limits, defaults/reference and runtime validation of `unknown` values. `lib/model.cjs` consumes its compiled CommonJS output. State/profile/action/native/API contracts live in `shared/types.ts`; browser declarations live in `types/browser.d.ts`.
- Launch, preview, unit tests and Electron smoke run compiled code. Renderer assets are copied alongside emitted JS. Source maps embed original source. Successful compilation prunes orphaned output after deleted/renamed inputs.
- Main distinguishes the project/application root from the compiled runtime root: UI/preload/popup load from `out`, while development native helper, logs and startup arguments keep their project-root paths. Packaged resources still resolve outside the archive.
- Builder source configuration includes `out` application files and licenses. Build entry points compile first, but no production build or packaging was run.

## Verification

Baseline before migration: clean `dev` at `37cd036`, all 45 Node tests and all 22 mocked-engine Electron smoke checks passed.

Commands used after migration:

```powershell
npm run typecheck
npm test
node scripts/smoke.cjs
node scripts/browser-check.cjs
node scripts/design-check.cjs
node scripts/filter-check.cjs
node scripts/renderer-check.cjs
node scripts/experience-check.cjs
node scripts/experience-electron-check.cjs
node scripts/toolchain-check.cjs
```

The browser and toolchain checks use the development preview at `http://localhost:3000`.

- All 45 existing Node tests passed against compiled output, including persistence/recovery, native errors, preview-generation races and startup transactions.
- All 22 real Electron smoke checks passed with the existing isolated mock engine, including sandboxed preload, main/controller/renderer IPC, filter/popup synchronization, reload and profile persistence.
- Browser checks passed: image comparison/import/persistence, gallery selection/focus, all eight filters, theme/accent persistence, sticky preview, 760/1020/1280/1920 layouts, repeated-save protection and failed-save retry, with no page errors.
- Browser experience checks and the real isolated Electron experience harness passed against compiled renderers/main/preload: tour, support scheduling/actions/retries, update actions, persistence, unchanged color intent and no page errors.
- Toolchain checks verify unchanged source hashes, Node/browser source-map paths and embedded source, localhost map serving, typed browser compilation/reload without Node globals, and removal of deleted-source output/maps. The missing HTTP map route and stale generated output were each observed failing before their fixes.
- Independent read-only review found no Critical/Important issues. Both smaller tooling findings above were fixed; the same reviewer found no new issues in that fix pass.

## Limits and next work

Only the value validator/constants are converted application implementation. Shared contracts establish the intended types, but do not yet enforce every JS caller. Matrix/presets, remaining model/store/controller/bridge, Electron/preload and renderer conversions remain in later phases. Native C#, UI design, settings format and profile IDs are unchanged.

Electron verification uses a mocked engine and isolated data. No physical desktop transform, real startup registration mutation, real notification, external download or installed-app replacement was performed. The launcher still uses the existing native compiler/helper path. A production installer and actual installed acceptance remain separate, explicitly requested work. Public 0.1.1 remains unchanged.
