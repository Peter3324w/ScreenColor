# Screen Color 0.1.2 security audit

Audited on 19 November 2026 against release commit `59e25688983bb663b1198d82efa6b5d8cbbfec7e` and the locally retained published Windows x64 package. This is a scoped review, not a penetration-test certification.

## Release concern: outdated bundled runtime

The published package uses Electron **33.4.11**, which reached end of support with Electron 36's release on 28 April 2025. Electron supports its latest three stable major versions. The runtime needs upgrading before the release receives security clearance.

- [Electron 36 release / Electron 33 end of support](https://releases.electronjs.org/release/v36.0.0)
- [Electron support policy](https://www.electronjs.org/docs/latest/tutorial/electron-timelines)
- [Electron advisories](https://github.com/electron/electron/security/advisories)

The npm audit identifies Electron as a high-severity affected package. Advisory applicability depends on platform and enabled APIs; a version-range match does not demonstrate exploitability in Screen Color. For example, [GHSA-h7rp-cf8h-j98x](https://github.com/advisories/GHSA-h7rp-cf8h-j98x) concerns Promise-returning contextBridge functions in windows loading untrusted content. Screen Color exposes such functions but loads its own local UI and blocks navigation; no untrusted script execution path was found. Chromium's image decoder still processes locally selected images.

## Dependency audit

`npm audit --json` reported **18 affected dependency packages: 1 critical, 13 high and 4 moderate**. These counts include transitive propagation, not 18 independently exploitable application defects. Electron is declared as a development dependency but ships inside the installer, so omitting development dependencies would hide a relevant runtime finding.

Other findings concern the build/install toolchain, including electron-builder 25.1.8 and its transitive dependencies. The critical package is `tar`; its critical advisory is [unlimited-input decompression/parse denial of service](https://github.com/advisories/GHSA-23hp-3jrh-7fpw). These packages are not present as application modules in the packaged ASAR. They still matter when processing dependency archives or running packaging/publishing tools.

Registry-reported upgrade candidates at audit time were Electron 45.4.1 and electron-builder 26.18.0. These are candidates requiring compatibility tests, not verified replacements. The Electron Windows x64 runtime archive alone is 158,296,013 bytes. No upgrade download, dependency replacement, new production build or release modification was performed during this audit.

## Source review and verification

A separate read-only review found no confirmed exploitable defect in the examined IPC, preload, navigation, external URL, settings/profile/image DOM, development server or native command surfaces.

- Both Electron windows use context isolation, sandboxing and disabled Node integration. New windows and navigation away from the expected local page are blocked.
- IPC checks the owned webContents, exact main-frame identity and exact expected file URL. An isolated test of the compiled predicate accepted both trusted windows and rejected ten spoofed/subframe/navigated/destroyed-owner cases. This used mocked frame identities, not actual hostile Electron frames.
- Support links use fixed destinations; update URLs are constrained to the expected GitHub repository, version and installer filename. Fetch redirects are rejected, with bounded metadata size and timeout.
- User-visible labels use DOM text/property APIs. Image selection excludes SVG and limits input size; decoded dimensions are checked after decoding.
- Native execution uses a fixed executable and argument arrays without a shell. Commands accept bounded finite numeric controls. Recovery-journal tampering requires same-user local write access; journal float validation remains a resilience improvement.
- The preview server binds localhost, restricts Host and served files, and exposes no native bridge.
- **26/26 existing model/controller/bridge/preload/support/update tests passed** during the review, without production compilation or real native color changes.

## Published artifact checks

Microsoft Defender custom-scanned the complete local `release` directory with remediation disabled: exit 0, **no threats found**. Antivirus and real-time protection were enabled. Definition version was 1.463.315.0, last updated **15 November 2026 10:40:55 UTC**; definitions were not updated during the audit. This result is bounded by those definitions and does not establish vulnerability freedom.

The installer is **unsigned**. Static inspection of the actual packaged executable's Electron fuse wire found RunAsNode, NODE_OPTIONS and command-line inspection enabled, with embedded ASAR integrity validation and ASAR-only loading disabled. These are packaging-hardening opportunities, not a demonstrated remote exploit. Signing requires an appropriate signing identity; no certificate was provisioned.

Secret-pattern scanning found no matches across 110 tracked files, 314 historical Git blobs and 68 packaged ASAR files. Patterns covered GitHub, AWS, Google, OpenAI and Slack credentials and private-key headers. This is a limited pattern scan, not proof that no credential exists.

Local ignored evidence: `.local/security-npm-audit.json`, `.local/security-defender.log`, `.local/security-secret-scan.json`. The published release and installed running application were left untouched.

## Recommended next work

1. Upgrade to a supported patched Electron runtime and compatible packaging dependencies, inspect the resulting lockfile audit, and rerun strict checks, tests and isolated Electron smoke tests.
2. Configure and verify appropriate production fuses, then test the actual packaged application. Keep development runtime behavior separate from production fuse changes.
3. Build and publish a replacement only when requested; preserve the release's native desktop acceptance limitation until physical color/restoration checks are performed.

## Source upgrade follow-up, 19 November 2026

Peter approved the runtime download and subsequently approved an additional approximately 90 MB dependency-download allowance. Licensing PR [#4](https://github.com/Peter3324w/ScreenColor/pull/4) was merged on GitHub at `762ee0f03b73d27a181e034c9f1db9ba8a02e2dc`; GitHub's license API recognizes MIT on `main`. The security upgrade described below is subsequent development work, not part of that merged PR or the published installer.

Current source pins Electron **45.4.1**, electron-builder **26.18.0** and Node types **24.19.2**, with Node **22.12.0** as the minimum development runtime. Both Electron declarations and the executable use 45.4.1. The 158,296,013-byte Windows runtime archive's SHA-256 matched the upstream `SHASUMS256.txt` before extraction:

`2ba6223afa9121f42831fefe92c434334907540165294fc56697449d12e7cfe9`

Upgrading Electron and builder removed the original critical/high findings, but left one underlying moderate advisory propagated through six build-tool packages: [minimatch pattern amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249). A targeted override replaces minimatch versions `>=7.0.0 <11.0.1` with **11.0.1**, while preserving older API families used elsewhere. Fresh `npm audit --json` after the full `npm ci --ignore-scripts --no-audit --no-fund` reports **zero known vulnerabilities**. This is the registry's result for this dependency graph at audit time, not a guarantee against unknown vulnerabilities.

Runtime selection now rejects executables with a missing or mismatched adjacent version file, including explicit environment overrides. Neighboring runtime caches are usable only if their version matches the pin. Packaging accepts only this project's own matching builder installation. Review identified that accepting a matching-version neighboring builder could bypass this project's transitive dependency override; that fallback was removed, with a regression observed failing before the fix and passing afterward.

Verification completed against the installed upgraded dependencies:

- Strict Node, Electron and DOM TypeScript checks plus both type-fixture configurations passed without weakening compiler settings.
- **60/60 Node tests passed**, including eight runtime/builder-selection regressions. The initial seven version-check regressions failed before implementation; the additional neighboring-builder regression failed before removal of that fallback.
- The actual verified Electron 45.4.1 executable passed **22/22 isolated mock-native smoke checks**. Separate real Electron welcome/tour/support/update integration checks passed, including persistence, fixed external destinations and rejected real startup changes.
- The new builder API loads, and the existing application configuration passes its schema validation. Read-only review confirmed app-builder-lib and @electron/universal resolve minimatch 11.0.1; their real matching APIs passed focused configured-file-pattern, traversal/exclusion, literal-folder, hasMagic, named-export and matchBase checks.
- Upstream Electron and builder license texts were refreshed; notices distinguish the current source from the unchanged 0.1.2 release.

No production app or installer was built, installed or published. Version remains 0.1.2 in source pending a separately requested release version bump. The existing published installer still uses Electron 33.4.11; the original artifact findings above remain applicable to it. Production fuse hardening, signing, packaged verification and physical native color/restoration acceptance remain separate work. The preview wallpaper's unrecorded licensing provenance is tracked in `THIRD_PARTY_NOTICES.md`.

Additional local evidence: `.local/security-final-audit.json`, `.local/security-installed-dependencies.log`, `.local/security-final-typecheck.log`, `.local/security-final-tests.log`, `.local/security-electron45-smoke.json`, `.local/security-electron45-experience.log`, `.local/security-runtime-red.log` and `.local/security-builder-fallback-red.log`.
