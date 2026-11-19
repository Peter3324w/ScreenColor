# TypeScript migration verification

19 November 2026. Implements the source/tooling work in `typescript migration plan.md` through shared/core, Electron/preload, renderer and cleanup phases. Existing installed/public 0.1.1 is unchanged.

## Implementation

- Strict `.cts` core/Electron modules and `.ts` shared/renderer modules. CommonJS remains the Node runtime. All handwritten application code is typed, without broad `any`, ignore directives or `skipLibCheck`.
- One typed matrix/catalog source, shared value/profile/state/action/native/API contracts, runtime validation of unknown disk/native/IPC/release/IndexedDB data. Settings format and existing profile values/IDs are preserved.
- esbuild browser IIFEs preserve existing globals; bundled sandboxed preload requires only Electron. Browser code has no Node APIs. Core and browser type fixtures reject the wrong environment's globals and incorrect action/native payloads.
- Separate Node, Electron and DOM configurations. Electron's upstream declarations need DOM types, so that environment has its own configuration. Node 22.19.2 types are pinned/overridden to avoid the [upstream Electron declaration conflict](https://github.com/electron/electron/issues/49213), without suppressing compiler checks.
- Development compilation emits only ignored `out/`, copies assets, embeds original source in maps, and prunes orphaned output. Main uses the application root for native helper/logs/startup and compiled runtime root for UI/preload/popup. Builder source configuration points at compiled output.
- Intentional JS/CommonJS exceptions: generated icons, copied PlayTime appearance utility, development/build/check/bootstrap scripts, JS tests and the existing smoke harness. The harness has a narrow declaration and explicit output copy; generated/copied code is not manually rewritten.

## Verification

Final commands:

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

The preview must be listening at `http://localhost:3000` before browser/toolchain checks. Full final logs are local under `.local/migration-*.log`; `.local/migration-final-checks.json` records exit status for every command.

The final suite has 52 passing Node tests and 22 passing Electron smoke checks. Coverage includes settings/profile recovery, real live-settings read-only compatibility, atomic backups, startup transaction rollback, native errors/reconnection, queued preview expiry, correlated type contracts, browser/Node bundle parity, sandboxed preload validation/cleanup, slider/profile/popup synchronization, duplicate saves, failed/missing-response retries, image import/persistence, themes, nine-step tour/support/updates, 760/1020/1280/1920 layouts, source preservation/maps/reload and deleted-source output removal.

Native malformed-reply, preload malformed-state/subscription and renderer missing-save-response regressions were observed failing before their fixes. The smoke harness output-copy issue was caught by actual Electron startup and corrected. Two browser checks initially reached the preview before startup completed; both passed after `/health` was confirmed. The toolchain event timeout was extended from 20 to 60 seconds to allow all three strict compiler configurations to finish.

Independent read-only reviews found no outstanding concrete issues in shared/core or Electron/renderer changes. This verification preserves HTML/CSS, native C#, images and visible UI; it does not add features.

## Limits

The installed Screen Color native engine was already running and was left untouched. Automated desktop checks use the existing isolated mock engine. Actual migrated-app connection/effect/restoration acceptance remains pending until the installed app is quit and the development launcher is tried. No physical color changes, real notification/external downloads, installed-app replacement, production app build, installer packaging, push, merge or release were performed.

The compiler workspace was installed with `--ignore-scripts`; Electron was installed for declarations/dependencies, without its runtime archive. Existing cached Electron/Playwright/browser runtimes were reused. Downloads remained well below 50 MB; the full packaging dependency installation was not performed. Clean reinstall uses the README's selective workspace command.
