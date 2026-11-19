# Third-party notices

Screen Color's original code is licensed under the [MIT License](LICENSE). Third-party components retain their own licenses and copyright notices; Screen Color's MIT license does not replace these terms or grant rights to separately sourced assets.

## Included in the application

| Component | Use | License and notices |
| --- | --- | --- |
| [Iconsax React 0.0.8](https://www.npmjs.com/package/iconsax-react/v/0.0.8) | Static SVG icons generated into `ui/icons.js` | MIT; [retained license](licenses/iconsax-react-LICENSE.txt), copyright ERFAN KHADIVAR |
| [Electron 45.4.1](https://github.com/electron/electron/tree/v45.4.1) | Current development runtime; the existing published 0.1.2 release uses Electron 33.4.11 | MIT; [retained license](licenses/electron-LICENSE.txt). The Windows distribution also includes `LICENSE.electron.txt` beside the executable. |
| Chromium and Electron's bundled dependencies | Browser/runtime components | Multiple upstream licenses; the full runtime-specific notices are distributed as `LICENSES.chromium.html` beside the Windows executable. Preserve this file when redistributing the application. |

The source runtime upgrade has not been packaged or published. See the [security audit and follow-up](docs/security-audit-2026-11-19.md).

## Development tools

| Component | License |
| --- | --- |
| [TypeScript 5.9.3](https://github.com/microsoft/TypeScript/tree/v5.9.3) | Apache-2.0; [retained license](licenses/typescript-LICENSE.txt) |
| [esbuild 0.25.12](https://github.com/evanw/esbuild/tree/v0.25.12) | MIT; [retained license](licenses/esbuild-LICENSE.txt) |
| [electron-builder 26.18.0](https://github.com/electron-userland/electron-builder/tree/v26.18.0) | MIT; [retained license](licenses/electron-builder-LICENSE.txt) |

These development tools and their transitive packages retain their own package notices. This table identifies direct tools; it is not a complete inventory of every transitive development dependency. Recheck notices when updating dependencies or redistributing development packages.

## Other assets and shared code

PlayTime theme tokens and appearance helpers were copied from Peter's neighboring project. Their provenance is recorded in the [design-system notes](docs/design-system.md). This notice does not assert that all of PlayTime has been relicensed.

The interface uses installed system fonts; no font files are bundled. The repository does not currently record the origin or redistribution terms of `ui/preview-default.jpg`. Its provenance must be established or the image replaced with an appropriately licensed asset. No new license grant for that image is implied here.
