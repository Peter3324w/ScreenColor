# Starter filters verification

18 November 2026. Peter requested sample filters made from the existing five controls and selected a mix of natural and cinematic styles.

Added eight immutable built-in presets in a catalog shared by the controller, settings validator, full UI and quick controls. Native acknowledgment and disk persistence use the existing preset path. Filters are reserved IDs, not user profile records, so they cannot be deleted/shadowed and do not consume the 100-profile limit. Fine-tuning clears the filter selection; saving stores a personal copy. Default and Custom preset one are unchanged.

The Filters page has image cards, selected/disabled states, an existing-image comparison and saved profiles below. Card selection preserves keyboard focus. Browse filters opens the gallery from Adjustments and resets the center scroll position. Three-column layout, hidden scrollbars and independent sidebars remain intact.

Desktop samples are affected by the global native color effect. Review caught this: a gallery-only message explains it while enabled, and Compare samples explicitly turns the effect off without changing the selected profile or slider values. Applying a card reenables its look. No automatic or hidden effect toggling is used.

## Evidence

- New filter tests were observed failing before the shared catalog existed, then passing after implementation. All 28 Node tests pass, including every preset's allowed values, fresh-controller persistence, reserved IDs/deletion protection, fine-tuning/saving, and native-failure rollback.
- `node scripts/filter-check.cjs` passes in installed headless Edge against localhost:3000. All eight cards apply all five values and retain focus; selection and fine-tuning state update; Natural/Mono samples differ; personal profiles save/delete; a chosen local image reaches all samples and survives reload; default wallpaper restores; 1920/1280/1020/760px layouts fit; no page errors. Captures are local under .local and copied to UI History.
- Existing design browser check passes (themes, icons, custom accents, sticky preview and narrow layouts).
- All 22 isolated mock-engine Electron smoke checks pass. The new check covers gallery-to-controller IPC, renderer reload, popup synchronization, comparison guidance and disabling the effect without losing the chosen filter. It does not prove subjective color quality or actual fullscreen sample rendering.
- JavaScript syntax and git diff checks pass. The mechanical design scan reports incumbent color-study label contrast/size and nested-surface warnings; no visual identity rewrite was attempted.

Matching before/after captures: UI-History/screen-color/010-starter-filter-gallery. No new dependencies, downloads, production builds or packaging.

## Adjustment shortcuts

Peter subsequently requested four options at the bottom of Adjustments with a white Browse more filters button underneath. Added Natural, Vivid, Golden and Cinema there, reusing the gallery sample matrix, image source, selected/disabled state, comparison action and existing preset handler. The white button opens the full Filters page at the top. Four cards form one row on wider windows and two rows on narrow windows.

Verified all four apply and synchronize with the full gallery, the button is white and navigates correctly, the 760px layout fits and remains clickable, and there are no browser page errors. Updated the existing filter check to scope full-gallery selectors separately from the four shortcuts. Full gallery, design check and all 22 Electron smoke checks pass. Matching captures are in UI-History/screen-color/011-adjustment-filter-shortcuts.
