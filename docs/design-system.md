# PlayTime design system in Screen Color

Peter requested the complete PlayTime visual language on 16 November 2026: colors, spacing, icons and other component styling. Screen Color now uses the same foundations rather than the earlier graphite/amber utility styling.

## Source

Read-only source: `C:\Users\peter\Projects\Playtime`, `dev` at `a85c4b52b9fee1c759c8688910abf1c1c5a0ab20`. PlayTime has unrelated in-progress work; none of its files were edited. Imported style/util files were unchanged in its working tree.

- `src/renderer/src/styles/00-base.css`: exact token/theme prefix copied to `ui/playtime-tokens.css`, including the original source comments. Midnight, Graphite, Deep, Moss and Rose retain their complete neutral ramps, accent/on-accent pairs, wash/stroke/glass tokens, chart colors and semantic greens/reds.
- `src/renderer/src/lib/util.js`: theme/accent helper section copied to `ui/playtime-appearance.js`, including lightness floors, contrast-aware text, green/danger hue separation, and Auto accent behavior. Only module exports were adapted for the existing browser/CommonJS setup.
- `styles/05-sidebar.css`: 224px desktop sidebar; 11px active navigation radius; 11px/14px row padding; 13px icon gap; 14px navigation type; 16px/12px brand hierarchy. Narrow Screen Color windows retain their supported compact layout instead of inheriting PlayTime's unrelated 940px minimum window requirement.
- `styles/06-shell-chrome.css`: 30px/700 page titles, 24px page spacing, 10px buttons, primary 10px/18px padding, secondary 9px/15px glass controls, inset sheens and state transitions.
- `styles/11-settings-modals.css`: 16px cards, 22px/24px card padding, 14px setting rows, 46px × 26px switches with 20px knobs, and 18px dialogs. Screen Color's own controls are restyled to these same measurements. The `--space-*` aliases in its stylesheet name these observed measurements; they are not presented as pre-existing PlayTime spacing tokens.
- Iconsax React 0.0.8: 13 exact icon families exported from PlayTime's installed package into static SVGs in `ui/icons.js`. Navigation uses Linear when inactive and Bulk when selected, as PlayTime does. No React dependency or download is needed at runtime. MIT notice is retained in `licenses/iconsax-react-LICENSE.txt`.

## Use

Settings → Appearance offers the five copied themes and custom accent controls. Appearance is saved independently in localStorage under `screen-color-appearance`; it does not alter the color-engine settings or PlayTime preferences. Invalid/missing appearance data falls back to Midnight and the theme's automatic accent. Custom accents use PlayTime's original safety/contrast derivation.

`node scripts/sync-playtime-design.cjs` regenerates the token, helper and SVG snapshots from the neighboring PlayTime checkout. The generated snapshots are committed, so Screen Color does not need that checkout to run. CSS adapts the imported rules to Screen Color's markup; game/library-specific screens and PlayTime branding are not copied as product features.

Calibration swatches, the grayscale ramp and preview images keep their own image colors because they are the material being adjusted, rather than application chrome. Existing sticky preview, native processing, profiles, tray and startup behavior remain functional.

## Verification

`node scripts/design-check.cjs` checks the actual rendered palette values, selected navigation contrast, SVG installation, every copied theme, custom accent validation/persistence/reset, sticky positioning and overflow at 760px. Browser image/profile checks, 13 Node tests and the Electron smoke check all pass. The Electron smoke engine is explicitly mocked; this design change does not introduce a new claim about physical display output.
