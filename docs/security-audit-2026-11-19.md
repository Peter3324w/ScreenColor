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
