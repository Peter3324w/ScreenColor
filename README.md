# Screen Color

Screen Color's original code is available under the [MIT License](LICENSE). See [third-party notices](THIRD_PARTY_NOTICES.md) for dependency licenses and asset provenance, including the unresolved origin of the bundled preview image.

A Windows desktop color utility with live saturation, contrast, warmth, software brightness and tint adjustments. Save your favourite looks as profiles, explore eight starter filters, and switch settings from a compact system-tray panel.

**[Screen Color 0.1.2 Windows release](https://github.com/Peter3324w/ScreenColor/releases/tag/v0.1.2)** · **[Screenshots and app details](https://peters-cave.vercel.app/apps/screen-color)**

The published 0.1.2 installer contains unsupported Electron 33.4.11. The current development source upgrades to Electron 45.4.1; that upgrade has not been packaged or published. See the [security audit and follow-up](docs/security-audit-2026-11-19.md).

Settings and profiles stay on your PC. Adjustments apply to all displays together, and quitting restores the original colors. Windows may show a SmartScreen warning because the installer is unsigned.

The interface uses [PlayTime's design system](docs/design-system.md): its six themes (five dark plus Light), custom accent derivation, Iconsax icons, typography, spacing, glass surfaces and component styling. Choose a palette under Settings → Appearance.

## Open the app

The release page above contains `Screen-Color-Setup-0.1.2-x64.exe`. Review its security status above before installing. The installer includes Electron and the native engine, so the source folder is not needed afterward. It registers Screen Color to start quietly at Windows sign-in by default. You can change this in Settings; upgrades preserve that choice.

The instructions below launch the development copy.

The published **0.1.2** Windows x64 installer is also retained locally at `release/Screen-Color-Setup-0.1.2-x64.exe`. It includes the TypeScript migration and connection/error-recovery fixes, plus the notifications/tour/startup work below. It predates the security runtime upgrade. See the [0.1.2 audit and build record](docs/windows-0.1.2-audit.md).

1. Close all old `ColorTest`, `ColorTest-Live` and `ColorTest-Range` windows. Their temporary effects are separate from this app.
2. Double-click **Start-Screen-Color.cmd** in this folder.
3. The compact quick-controls popup opens first. Choose **Custom preset one** from its Profile list for the accepted starting point: saturation 139%, contrast 115%, warmth 100. Choose **Open full app** for the larger workspace.

There is no mandatory preview timeout. The effect stays enabled until you turn it off or quit. Click the Windows system-tray icon for quick controls; double-click it for the full app. The popup hides when you click away unless its lock/pin button is selected. When pinned it stays above other windows, and its header can be dragged. Its close button and Escape hide the popup without turning off your colors.

Closing the full app keeps it in the tray by default. Use Settings → **Quit and restore original colors**, or Quit in the tray menu, to restore the captured original matrix. If you disable **Keep running when closed**, closing the full app quits and restores instead. The full app's **Quick controls** button returns to the compact panel. Windows sign-in startup remains quiet in the tray.

The global reset shortcut is Ctrl+Alt+F12 when available; some Windows environments cannot register it. The effect toggle and tray menu remain available.

To keep a new look directly from the toolbar, adjust the sliders, click **Save as profile** beside the Profile label, enter a name and click **Save profile**. It becomes selected in the toolbar list and is also available in the full app, including after reopening.

## What works in version one

- Live saturation 0–200%, contrast 80–140%, warmth -300 to +300, software brightness 80–120% and tint -100 to +100.
- Numeric inputs, individual reset, original/adjusted toggle and reset all.
- A wallpaper preview above the sliders, Original/Adjusted comparison and a local image picker. Selected images stay in this browser/app's IndexedDB and are never uploaded. JPG, PNG, WebP and AVIF are supported up to 20 MB / 40 megapixels. Browser preview simulates the same color matrix on the image only; Electron relies on the desktop effect to avoid double processing.
- Protected Default/Custom preset one presets, named local profiles and persistent chosen settings.
- Tray controls, optional 60-second preview, restoration on exit, native helper recovery and display/resume reapply.
- **Start with Windows**, enabled by default for the installed app. The development copy registers its existing runtime and source folder only when you opt in; a localhost server is not required.

Changes apply to **all displays together**. Brightness is software picture gain, not panel backlight control. This version does not include per-monitor correction, selective vibrance, gamma, nonlinear shadow/highlight curves, DDC control or HDR processing. It changes preferred appearance; it does not provide measured calibration or OLED blacks.

## Development

Requires Windows Node 22.12.0 or newer and the .NET Framework x64 compiler. Install the project's compiler workspace once:

```powershell
npm ci --workspace @screen-color/typescript-tooling --ignore-scripts --no-audit --no-fund
```

This installs pinned TypeScript 5.9.3, esbuild 0.25.12 and its platform binary, Node 24.19.2 definitions and Electron 45.4.1 declarations/dependencies. `--ignore-scripts` prevents Electron's runtime download; the workspace excludes the packaging tools. A full root installation is separate and substantially larger. The compiler does not depend on another project's cache.

The launcher requires an existing Electron **45.4.1** runtime with an adjacent matching `version` file. It checks the local `node_modules/electron/dist` first, then neighboring projects, and rejects missing or mismatched version evidence. An explicit `SCREEN_COLOR_ELECTRON=C:\path\to\electron.exe` override must also match; it never silently falls back after an invalid override. Runtime selection never downloads anything. Packaging requires this project's own **electron-builder 26.18.0** installation so its dependencies use the security overrides in this lockfile; neighboring builders are rejected. Production builds and installer packaging remain separate, explicitly requested steps (`build:win` or `build:dir`).

```powershell
node scripts/compile.cjs
node scripts/launch.cjs
```

The launcher and **Start-Screen-Color.cmd** compile the application into the ignored `out/` directory before opening Electron. Node/Electron files keep their CommonJS runtime; browser scripts keep their existing globals without Node access. Native helper and diagnostics paths still resolve from the project root, not `out/`.

Renderer HTML/CSS/JS/TS edits compile and reload the Electron windows automatically, preserving native processing. Main/preload/core edits compile but require quitting and reopening the app to take effect in the main process. C# changes compile incrementally on launch; no native recompilation is needed for UI changes.

```powershell
npm run typecheck
npm run compile:app
```

Application code uses strict TypeScript with separate Node, Electron and DOM configurations. All core modules, Electron/preload and handwritten renderers are typed; shared data/action/API contracts are in `shared/types.ts`. Browser entries and the sandboxed preload are bundled with esbuild. The matrix/catalog retain their browser globals and come from the same typed source as Node. Source maps embed original source and resolve back to the project files. Compilation preserves source and removes orphaned output after deletion/renaming.

Generated `ui/icons.js`, copied `ui/playtime-appearance.js`, the Electron smoke harness and bootstrap/build/check scripts intentionally remain JavaScript/CommonJS. Narrow declarations describe their application-facing interfaces. No application TypeScript uses `any`, `@ts-ignore`, `@ts-nocheck` or `skipLibCheck`. Node 24 types match Electron 45's declared type dependency; the Electron compiler configuration includes DOM types required by Electron's upstream declarations, while the core configuration forbids browser globals.

```powershell
npm run dev
```

This compiles the application and serves `out/ui/` as a separate browser UI preview at **http://localhost:3000**, or the next free port up to 3010. It is clearly marked preview-only and cannot alter desktop settings. Source edits compile before server-sent reload events. JavaScript source maps are served for debugging. There is no HTTP API for desktop changes. Restart the preview after changing compiler configuration or development scripts.

```powershell
npm test
node scripts/smoke.cjs
node scripts/browser-check.cjs
node scripts/toolchain-check.cjs
```

`npm test` compiles first and tests `out/`. Type checking verifies action/payload contracts and rejects Node globals in renderers and DOM globals in core code. Electron smoke uses an explicitly mocked engine and isolated data; it never changes the screen. Browser/toolchain checks require the preview server and reuse PlayTime's installed Playwright/Chromium. The toolchain check covers source preservation, bundled maps, typed browser compilation/reload and stale-output removal. Wait for the preview's listening message or `/health` before running browser checks. See [final migration verification](docs/typescript-migration-verification.md) for results and limits.

## Data and recovery

Actual app settings: `%APPDATA%\ScreenColor\settings.json`, validated and atomically replaced with a flushed write and a `.bak` recovery copy. Profiles, selected adjustments and the intended enabled state survive reopening and temporary engine failures. The development and installed copies share this location, and uninstall keeps it. Original desktop matrices are journaled under `%APPDATA%\ScreenColor\recovery`. Installed startup diagnostics are under `%APPDATA%\ScreenColor\logs`; development diagnostics are under `.local/`. Smoke checks use isolated settings.

Quit cleanly before using a different desktop color tool. A native named mutex, recovery journal and ownership check coordinate restoration if the helper or Electron exits unexpectedly. On failure the interface reports the effect off and offers Retry. It never force-reapplies continuously against competing color tools.

Source and implementation decisions: [design](docs/superpowers/specs/2026-11-16-screen-color-design.md), [plan](docs/superpowers/plans/2026-11-16-screen-color.md).

## Feedback, support and themes

The sidebar's **Customise** button opens a small menu with **Feedback / Support**, **Tips**, **Theme** and **Settings**; **Help me** stays as its own link above it. The **Feedback / Support** page links to the shared Peter's Cave feedback form and Screen Color reports in the app-feedback GitHub repository. **Help me** opens Peter's Cave's support page. Links open in the system browser; desktop IPC accepts only fixed destination IDs, never arbitrary URLs. Include Screen Color in the report; the deployed form's app selection has not been verified.

The **Theme** picker under Customise offers Midnight, Graphite, Deep, Moss, Rose and Light. Each window also opens in its theme's own background colour, so Light never flashes black on launch. It shares the Settings appearance preferences and persists locally. Custom accent colors remain in Settings.

## Filters and personal profiles

Open **Filters** in the sidebar, or **Browse filters** beside Fine-tune your screen. Eight starter looks cover subtle and cinematic styles: Natural, Vivid, Golden, Cool, Soft, Cinema, Vintage and Mono. Each card applies an existing five-slider preset immediately. The cards use your local preview image; choose a different image on Adjustments to compare a familiar scene.

The active desktop effect also changes the sample images. **Compare samples** turns that effect off for a clean comparison while preserving your chosen values and profile. Selecting a card applies its filter again. The effect switch can also restore the chosen look.

Fine-tune any preset in Adjustments, then use **Save as profile** or **Save current look** to keep your own version. Your profiles appear below the gallery; starter filters cannot be deleted or overwritten. Default and Custom preset one remain available. Quick controls includes all eight filters and your saved profiles, with the same selected look as the full app.

## Updates, interface tour and support prompt

These additions are included in **0.1.2**. The older **0.1.1 installer predates them**.

- Screen Color checks its public GitHub releases on launch and every six hours. A newer stable Windows x64 release appears in the app, Quick controls and, when Windows allows it, a desktop notification. Settings and the tray menu also offer **Check for updates**. Checking reads a small release response; **Download update** opens the installer download only when you choose it. Nothing downloads or installs automatically.
- The first time you open the full workspace, a welcome prompt offers a nine-step interface tour. It explains image comparison, adjustments, filters, profiles, original colors, tray controls and settings without changing your colors. Skip or finish it at any time, and use **Settings → Replay interface tour** to revisit it.
- In the current development source, **Tips** sits in the sidebar's Customise menu, after Feedback / Support. It contains eight expandable tips and **Replay interface tour**. Finishing or skipping a replay returns to Tips and restores focus; the Settings replay button remains available. This page is not yet included in a published installer.
- After the fourth deliberate app launch, a one-time invitation appears when the full workspace is visible. Windows background startup, renderer reloads and tray clicks do not count. Choose the green **Contribute to the PC fund** button, **Give feedback**, **Browse more Cave apps**, or **Not now**. The contribution button currently opens Peter's Cave's support page; it does not collect a payment inside the app.

Tour completion, launch count and invitation/update dismissal preferences stay in `%APPDATA%\ScreenColor\experience.json`, with an atomic write and backup. They are separate from your saved color profiles. Prompts wait until an existing dialog or tour closes.

Version 0.1.2 also corrects Windows startup registration detection and command quoting. It preserves startup disabling made in Windows Settings instead of turning it back on each time the app launches. The warning in 0.1.1 can appear even when its named startup entry is present; the fix is included in 0.1.2.

Verification details and limitations: [notifications, tour and startup checks](docs/notifications-tour-verification.md).

## Next session

The [migration plan](typescript%20migration%20plan.md) has been implemented through renderer conversion and cleanup. Final isolated verification is recorded [here](docs/typescript-migration-verification.md). Native desktop acceptance with the migrated source requires quitting the currently running installed Screen Color first; the migration checks leave that app and its color effect untouched. The current installer remains unchanged. Production packaging is a separate requested step.
