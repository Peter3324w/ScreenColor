# Three-column workspace

18 November 2026. Peter requested the engine indicator at bottom right, a better arrangement for Quick controls / Effect on / Reset all, and sidebars that stay visible while scrolling.

- Peter clarified that he wanted three columns and vertical actions, with no top bar or space above the heading.
- The app now uses a viewport-height, three-column shell: navigation, scrolling workspace, and right controls/reference sidebar. Both sidebars have independent overflow for short windows and expanded theme choices. At 1050px and below the navigation uses icons, keeping three columns within the 760px minimum app width.
- Quick controls, Reset all and the effect switch stack vertically at the top of the right sidebar. Their actions and IDs are preserved. The right column remains available on every page.
- Engine status remains live and is announced as a status region at bottom right. Bottom padding leaves room to reach final content without the indicator covering it.
- The reference panel remains in the right column at all supported app widths. The existing sticky image preview sits 12px below the top of the center workspace while scrolling.

Verification: all 23 Node tests and all 21 mock-engine Electron smoke checks passed. The existing design check passed with its scroll target and preview offset updated for the new shell. Live Edge checks passed at 1920x1057, 1280x900, 1050x620 and 760x620: no horizontal overflow; three columns, vertically ordered actions, stationary sidebars, sticky preview and fixed status; effect switch and Reset all work; Settings and the final reference control remain reachable; no page errors. The compact navigation fits without clipping text. Mock smoke does not prove physical desktop color output.

The design detector reported existing color-study label contrast/size and nested-surface warnings. These were not introduced by the toolbar or scrolling changes.

Matched browser before/after captures and scrolled/narrow after captures are saved in UI-History/screen-color/009-three-column-workspace. The previous toolbar iteration is recorded in 008-sticky-workspace-toolbar. No dependency downloads or production builds were needed.
