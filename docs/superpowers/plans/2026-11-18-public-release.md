# Screen Color public release and Peter's Cave integration

**Goal:** Publish Screen Color safely, describe it on GitHub, show three real interface screenshots on Peter's Cave, and make its download buttons start the Windows installer download.

**Scope:** User's four requested tasks; item 4 explicitly corrected to Screen Color. PlayTime is unchanged. Work on existing dev branches; preserve unrelated Cave auth edits and public/PlayTime-test.txt. No new app build, history rewrite or merge.

- [x] Inspect tracked files and every reachable history blob for credential filenames and secret patterns; manually review credential-related code and URLs. No secrets found in 176 historical blobs. Replace the personal development path and ignore future environment/key files.
- [x] Run existing Screen Color tests and commit publication documentation on dev. Update GitHub description/topics/homepage and public visibility. Release the existing verified 0.1.1 x64 installer, with its SHA256, at v0.1.1. Publication metadata and the installer are live; source pushes remain pending Peter's explicit instruction.
- [x] Capture Adjustments, Filters and Quick Controls from the actual Electron UI with an isolated mocked engine without enabling desktop processing. Create optimized WebP screenshots and small variants in Cave public/screen-color/screens.
- [x] Reuse the existing screenshot switcher with serializable product-specific configuration; retain PlayTime's defaults. Add Screen Color screenshots, cover, GitHub link and download URL in lib/apps.js. Add the download action to AppAvailability and update its availability copy.
- [x] Run Cave tests and browser verification at desktop/mobile sizes: all images decode, all three screen buttons and keyboard navigation work, PlayTime retains its defaults, and all three Screen Color download actions hand off to the exact release URL and open the existing thank-you dialog. Intercept installer requests with a tiny attachment; separately check public release headers without downloading the installer. Anonymous HEAD returned HTTP 200 with the attachment filename and 82,543,707-byte length; GitHub asset SHA256 matches the verified local installer.
- [x] Review the diff and commit only scoped Cave files on dev. Cave commit 089ce7cb47db58c4f3cab622fa4fb00096a8d8e8; UI History cave-007 committed as 00154e1. Cave preview http://localhost:3001/apps/screen-color responds HTTP 200.

**Handoff:** Peter asked whether merging transfers the entire app and said a major change is still needed. Explained that merging code is separate from installer uploads. No push, merge, new app build or website deployment has been performed. Await the description of the major change; preserve current tested local work. The public 0.1.1 release is the existing, previously verified installer, not a build of future changes.

**Publication checks:** Verify GitHub reports PUBLIC, expected description, release asset size and digest; verify public download with a HEAD request. Never print credential values.
