# Screen Color

A Windows desktop color utility with live saturation, contrast, warmth, software brightness and tint adjustments. Save your favourite looks as profiles, explore eight starter filters, and switch settings from a compact system-tray panel.

**[Download Screen Color 0.1.1 for Windows (64-bit)](https://github.com/Peter3324w/ScreenColor/releases/download/v0.1.1/Screen-Color-Setup-0.1.1-x64.exe)** · **[Screenshots and app details](https://peters-cave.vercel.app/apps/screen-color)**

Settings and profiles stay on your PC. Adjustments apply to all displays together, and quitting restores the original colors. Windows may show a SmartScreen warning because the installer is unsigned.

The interface uses [PlayTime's design system](docs/design-system.md): its five themes, custom accent derivation, Iconsax icons, typography, spacing, glass surfaces and component styling. Choose a palette under Settings → Appearance.

## Open the app

Download the installer above, then run `Screen-Color-Setup-0.1.1-x64.exe`. The installer includes Electron and the native engine, so the source folder is not needed afterward. It registers Screen Color to start quietly at Windows sign-in by default. You can change this in Settings; upgrades preserve that choice.

The instructions below launch the development copy.

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

## Development without downloads

Requires the existing Windows Node installation and .NET Framework x64 compiler. The launcher finds an already installed Electron runtime in a neighboring project; it never downloads one. Override with `SCREEN_COLOR_ELECTRON=C:\path\to\electron.exe` if needed. The installer bundles its own pinned Electron runtime. Run `npm run build:win` to package using local cached build tools, or `npm run build:dir` for an unpacked build.

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

Actual app settings: `%APPDATA%\ScreenColor\settings.json`, validated and atomically replaced with a flushed write and a `.bak` recovery copy. Profiles, selected adjustments and the intended enabled state survive reopening and temporary engine failures. The development and installed copies share this location, and uninstall keeps it. Original desktop matrices are journaled under `%APPDATA%\ScreenColor\recovery`. Installed startup diagnostics are under `%APPDATA%\ScreenColor\logs`; development diagnostics are under `.local/`. Smoke checks use isolated settings.

Quit cleanly before using a different desktop color tool. A native named mutex, recovery journal and ownership check coordinate restoration if the helper or Electron exits unexpectedly. On failure the interface reports the effect off and offers Retry. It never force-reapplies continuously against competing color tools.

Source and implementation decisions: [design](docs/superpowers/specs/2026-11-16-screen-color-design.md), [plan](docs/superpowers/plans/2026-11-16-screen-color.md).

## Feedback, support and themes

The sidebar's **Feedback / Support** page links to the shared Peter's Cave feedback form and Screen Color reports in the app-feedback GitHub repository. **Help me** opens Peter's Cave's support page. Links open in the system browser; desktop IPC accepts only fixed destination IDs, never arbitrary URLs. Include Screen Color in the report; the deployed form's app selection has not been verified.

The sidebar **Theme** picker offers Midnight, Graphite, Deep, Moss and Rose. It shares the Settings appearance preferences and persists locally. Custom accent colors remain in Settings.

## Filters and personal profiles

Open **Filters** in the sidebar, or **Browse filters** beside Fine-tune your screen. Eight starter looks cover subtle and cinematic styles: Natural, Vivid, Golden, Cool, Soft, Cinema, Vintage and Mono. Each card applies an existing five-slider preset immediately. The cards use your local preview image; choose a different image on Adjustments to compare a familiar scene.

The active desktop effect also changes the sample images. **Compare samples** turns that effect off for a clean comparison while preserving your chosen values and profile. Selecting a card applies its filter again. The effect switch can also restore the chosen look.

Fine-tune any preset in Adjustments, then use **Save as profile** or **Save current look** to keep your own version. Your profiles appear below the gallery; starter filters cannot be deleted or overwritten. Default and Custom preset one remain available. Quick controls includes all eight filters and your saved profiles, with the same selected look as the full app.

## Next session

The phased migration is saved in [typescript migration plan.md](typescript%20migration%20plan.md). Planning is complete; TypeScript implementation has not started.
