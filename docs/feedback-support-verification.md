# Feedback, support and sidebar themes - 18 November 2026

Scope: reuse PlayTime's sidebar support destinations and five theme choices in Screen Color. No Electron upgrade, production packaging, publishing, or downloads.

Implemented an in-app Feedback / Support page, Help me browser link, and a sidebar Theme picker using the existing appearance preferences. Sidebar stays visible while the content scrolls. Settings and sidebar selection stay synchronized; existing popup storage synchronization is retained. Main-process support opening validates both IPC sender (existing guard) and a fixed destination ID (new allowlist). All URLs are HTTPS. User failures appear beside the support controls.

Verification:
- node --test test/*.test.cjs: 23 passed, including fixed app-specific destinations and rejection of arbitrary URLs, prototype keys and malformed IDs.
- node --check on electron/main.cjs, ui/app.js and ui/appearance.js: passed.
- git diff --check: passed.
- Actual headless Edge using installed Playwright: feedback navigation/selected state; sidebar visibility; five themes and Settings synchronization; theme persistence after reload; Escape; no horizontal overflow at 760x620; browser-preview feedback URL. Renderer with a mocked preload API: correct support payloads, browser failure messages on page and sidebar, enabled retry controls. No page errors. Harness: ignored .local/support-ui-check.cjs.
- Electron smoke attempted twice: runtime 33.4.11 exits 1 before startup, empty stderr, no new app startup log/report. Native shell handoff and popup theme synchronization are not verified in this session. Added smoke assertions cover these paths for a functioning Electron run. Do not treat old smoke logs as current results.
- Live Cave feedback/help pages could not be retrieved; deployed Screen Color form selection and submission are unverified. No public reports or donations were submitted.
- Impeccable detector ran once: warnings concern incumbent color-study labels, small legacy text and existing nested preview surfaces; retained outside this change.

Matching before/after screenshots and feedback variants: ../UI-History/screen-color/007-feedback-support-themes.
