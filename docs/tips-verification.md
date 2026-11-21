# Tips and tutorial replay

Peter requested a Tips entry beside the lower sidebar links, following PlayTime's Tips page, with practical advice and tutorial replay. The page inherits Screen Color's existing PlayTime theme and uses the same Iconsax Lamp icon, a tour banner and grouped expandable tips. Its eight tips describe existing behavior; they do not change color settings.

The replay button shares the existing tutorial implementation through `[data-replay-tour]`. The Settings replay entry remains available. Completing or skipping the tutorial returns to the page and scroll position from which it started, then restores focus to its replay button.

## Checks

`node scripts/tips-check.cjs` was observed failing before implementation because the Tips navigation button was absent. After implementation, it passed:

- Tips navigation and current-page state.
- Eight native details controls, including Enter/Space keyboard operation.
- The complete nine-step replay, return to Tips and restored focus.
- Escape from a later tutorial step, return to Tips and restored focus.
- Unchanged adjustment values and effect intent during replay.
- Existing Settings replay behavior.
- Desktop 1280 × 900 and narrow 760 × 680 layouts, with no horizontal overflow or page errors.

The existing real Electron integration check passed with Tips replay, return/focus and preserved color state through the isolated mock-native bridge. It does not launch the real color engine or alter Windows startup registration. All 60 Node tests, strict Node/Electron/DOM checks and both type fixtures passed. The existing browser experience suite also passed, covering welcome/tour/support/update behavior.

Matching before/after Adjustments captures record the added sidebar entry; separate after captures show the Tips page. They use the browser preview at `http://localhost:3000`, default Midnight theme, 1× device scale and matching viewport sizes. Central history entry: `UI-History/screen-color/014-tips-and-tour`.

The design detector reported nine warnings on the existing full interface (calibration swatch contrast/labels, collapsed navigation text, small text and nested surfaces). No finding specifically named a new Tips selector. Desktop and narrow Tips screenshots were visually reviewed; this is not a claim that the entire pre-existing interface passes an accessibility audit.

Read-only code review found one factual copy error: the shortcut turns the effect off rather than resetting adjustment values. The tip was corrected to match the existing `toggle(false)` handler; no other concrete regression was identified.

No production packaging, release publication or installed-app replacement is part of this change. The installed app's single-instance lock must be released before launching the real desktop development copy; the browser preview runs independently.
