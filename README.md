# Screen Color

A Windows desktop color utility built around Peter's successful HP ProBook 450 G4 / Intel HD 620 experiment. Working name, local development version 0.1.

The interface uses [PlayTime's design system](docs/design-system.md): its five themes, custom accent derivation, Iconsax icons, typography, spacing, glass surfaces and component styling. Choose a palette under Settings → Appearance.

## Open the app

1. Close all old `ColorTest`, `ColorTest-Live` and `ColorTest-Range` windows. Their temporary effects are separate from this app.
2. Double-click **Start-Screen-Color.cmd** in this folder.
3. Choose **Apply reference** for the accepted starting point: saturation 139%, contrast 115%, warmth 100.

There is no mandatory preview timeout. The effect stays enabled until you turn it off or quit. Closing the window keeps it in the tray by default. Use Settings → **Quit and restore original colors**, or Quit in the tray menu, to restore the captured original matrix. If you disable **Keep running when closed**, closing quits and restores instead.

The global reset shortcut is Ctrl+Alt+F12 when available; some Windows environments cannot register it. The effect toggle and tray menu remain available.

## What works in version one

- Live saturation 0–200%, contrast 80–140%, warmth -300 to +300, software brightness 80–120% and tint -100 to +100.
- Numeric inputs, individual reset, original/adjusted toggle and reset all.
- A wallpaper preview above the sliders, Original/Adjusted comparison and a local image picker. Selected images stay in this browser/app's IndexedDB and are never uploaded. JPG, PNG, WebP and AVIF are supported up to 20 MB / 40 megapixels. Browser preview simulates the same color matrix on the image only; Electron relies on the desktop effect to avoid double processing.
- Protected Neutral/Peter reference presets, named local profiles and persistent chosen settings.
- Tray controls, optional 60-second preview, restoration on exit, native helper recovery and display/resume reapply.
- An opt-in **Start with Windows** checkbox. It registers the existing Electron runtime with this source folder and `--background`; a localhost server is not required. Keep the runtime/source paths stable. Startup is off until you choose it; this delivery does not enable it for you.

Changes apply to **all displays together**. Brightness is software picture gain, not panel backlight control. This version does not include per-monitor correction, selective vibrance, gamma, nonlinear shadow/highlight curves, DDC control or HDR processing. It changes preferred appearance; it does not provide measured calibration or OLED blacks.

## Development without downloads

Requires the existing Windows Node installation and .NET Framework x64 compiler. The launcher finds an already installed Electron runtime in a neighboring project; it never downloads one. Override with `SCREEN_COLOR_ELECTRON=C:\path\to\electron.exe` if needed. Reusing a neighbor's runtime is a development convenience, not a distribution strategy; a future authorized package will pin its own maintained runtime.

```powershell
node scripts/compile.cjs
node scripts/launch.cjs
```

Renderer HTML/CSS/JS edits reload the Electron window automatically, preserving native processing. Main/preload edits require quitting and reopening the app. C# changes compile incrementally on launch; no native recompilation is needed for UI changes.

```powershell
npm run dev
```

This starts a separate browser UI preview at **http://localhost:3000**, or the next free port up to 3010. It is clearly marked preview-only and cannot alter desktop settings. Browser UI edits reload through server-sent events. There is no HTTP API for desktop changes.

```powershell
npm test
node scripts/smoke.cjs
node scripts/browser-check.cjs
```

The Electron smoke check uses an explicitly mocked engine and isolated data; it never changes the screen. The browser check reuses PlayTime's installed Playwright/Chromium without downloads. These automation tools may be unavailable under the Codex sandbox; consult the actual results in `docs/verification.md`.

## Data and recovery

Actual app settings: `%APPDATA%\ScreenColor\settings.json`, validated and atomically replaced. Original desktop matrices are journaled under `%APPDATA%\ScreenColor\recovery`. Startup errors are logged to `.local\startup.log` beside the source. Diagnostic captures and automated reports are ignored under `.local/`.

Quit cleanly before using a different desktop color tool. A native named mutex, recovery journal and ownership check coordinate restoration if the helper or Electron exits unexpectedly. On failure the interface reports the effect off and offers Retry. It never force-reapplies continuously against competing color tools.

Source and implementation decisions: [design](docs/superpowers/specs/2026-11-16-screen-color-design.md), [plan](docs/superpowers/plans/2026-11-16-screen-color.md).
