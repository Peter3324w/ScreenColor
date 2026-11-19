# Security runtime upgrade implementation plan

> Execute inline with the executing-plans and verification-before-completion skills. Peter approved merging licensing PR #4 and the approximately 158 MB runtime download. Continue on `dev` per his workflow preference.

**Goal:** Replace unsupported Electron and affected build dependencies in source, prevent accidental use of stale cached tools, and verify the upgraded development application without producing or publishing an installer.

**Spec:** Findings and recommended next work in `docs/security-audit-2026-11-19.md`.

**Constraints:** Keep the installed app and its physical color effect untouched. Do not run native probe/apply. Use mock-native Electron checks. No production packaging or new GitHub publication is authorized here. Additional download batches over 50 MB require Peter's approval.

## Tasks

- [x] Merge and verify PR #4; align the local development baseline with GitHub main.
- [x] Download Electron 45.4.1's approved Windows x64 runtime and verify its SHA-256 against upstream checksums before extraction.
- [x] Pin Electron 45.4.1 in both manifests and electron-builder 26.18.0; regenerate the lockfile without running install scripts. Review the new audit and estimate any additional dependency download before installation.
- [x] Add regressions proving a runtime with a missing or mismatched version is rejected, while the pinned runtime is accepted. Add an equivalent version guard for the packaging tool. Implement those guards after observing failures.
- [x] Install the required compiler/types packages without lifecycle scripts and use the approved runtime for isolated verification. Resolve genuine compatibility errors without weakening strict TypeScript checks.
- [x] Run strict checks, Node tests and mock-native Electron smoke/integration checks. Re-audit dependencies. Update version-specific licenses/notices and the audit follow-up record.
- [x] Review the final diff and commit verified changes locally to `dev`. Record remaining packaging, signing/fuse and native acceptance work without claiming the published installer has changed.

## Review focus

- Environment overrides and neighboring checkouts must not bypass the pinned runtime version.
- The build tool must not select an older cached electron-builder after a dependency upgrade.
- Electron's newer type definitions must compile without `skipLibCheck` or broad unsafe type assertions.
- Isolated tests must not start the real native engine or edit the real user's startup registration/settings.
- The existing release remains Electron 33.4.11 until a separately requested build and publication; notices must distinguish source from that release.

## Results and review

Additional full dependency installation was approved after reporting an approximate 90 MB allowance; lifecycle scripts remained disabled. Node types were aligned to Electron's declared Node 24 type requirement. Initial builder upgrade left a minimatch advisory; the targeted 11.0.1 override removed the remaining six propagated moderate findings. Fresh installed dependency audit reports zero known vulnerabilities.

Fresh review identified that even a matching-version neighboring builder could bypass the local dependency override. A new regression failed before removal of that fallback. The fixed implementation requires a local builder; all eight selection regressions pass. Review then verified the real installed downstream minimatch APIs with no further findings.

Final checks: all strict configurations/type fixtures, 60 Node tests, 22 actual Electron 45 mock-native smoke checks, separate tour/support/update Electron integration, builder API load and configuration validation passed. No production packaging or native physical effects were performed. Detailed evidence and release limitations are in `docs/security-audit-2026-11-19.md`.
