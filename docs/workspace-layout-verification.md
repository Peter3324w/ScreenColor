# Stationary workspace and compact toolbar

18 November 2026. Peter requested the engine indicator at bottom right, a better arrangement for Quick controls / Effect on / Reset all, and sidebars that stay visible while scrolling.

- The app now uses a viewport-height shell. Navigation stays in place while the main workspace scrolls. Navigation has its own overflow for short windows and expanded theme choices.
- Quick controls, Reset all and the effect switch share a compact sticky toolbar. Their actions and IDs are preserved. Reset all is now also available on other pages.
- Engine status remains live and is announced as a status region at bottom right. Bottom padding leaves room to reach final content without the indicator covering it.
- The reference panel sticks beside desktop adjustments, with independent overflow for short windows. Below 1050px it becomes regular content below the controls. The existing sticky image preview now clears the toolbar.

Verification: all 23 Node tests and all 21 mock-engine Electron smoke checks passed. The existing design check passed with its scroll target and preview offset updated for the new shell. Live Edge checks passed at 1920x1057, 1280x900, 1100x620 and 760x620: no horizontal overflow; stationary navigation, sticky toolbar/reference/preview and fixed status; effect switch and Reset all work; Settings and expanded sidebar controls remain reachable; no page errors. Mock smoke does not prove physical desktop color output. Source review found no important issues.

The design detector reported existing color-study label contrast/size and nested-surface warnings. These were not introduced by the toolbar or scrolling changes.

Matched browser before/after captures and a scrolled after capture are saved in UI-History/screen-color/008-sticky-workspace-toolbar. No dependency downloads or production builds were needed.
