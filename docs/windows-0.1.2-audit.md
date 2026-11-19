# Windows 0.1.2 bug audit

19 November 2026. Peter requested a bug check followed by a PC build. Version 0.1.2 distinguishes the new installer from the existing public 0.1.1 and includes the TypeScript migration, notifications/tour/support/startup work, and these reliability fixes.

## Bugs reproduced and fixed

- **Hidden slider errors:** a rejected or missing IPC connection could show an error and immediately hide it in the final render. Both windows now retain local action errors across redraws and clear them after successful retry.
- **Unsafe initial connection failure:** a rejected initial state request left color controls enabled without a valid state. Both windows now start from a complete unavailable state, disable effect controls while connecting, and expose a working retry path.
- **Stale Quick controls errors after recovery:** a server-owned slider error was duplicated locally, so reconnecting through the other window left an obsolete error visible. Backend errors now remain owned by the backend snapshot and disappear when recovery is published.

`node scripts/reliability-check.cjs` exercises both windows, thrown/rejected slider requests, redraws, retry, initial connection failure/recovery, and recovery published from another window. The original four cases and the server-owned stale-error case were observed failing before their fixes. All pass afterward with no page errors.

## Scope and verification

Independent read-only review covered controller/preview serialization, bridge failure/retry/shutdown, native recovery/watchdog, store backups, startup rollback, update validation/timeouts and compiled packaging paths. No additional confirmed core defect was found.

Strict type checking and all 52 Node tests passed. Final browser and real isolated Electron results are recorded in `.local/pc-final-checks.json`, with per-check `.local/pc-*.log` files. These cover existing layout/filter/image/theme/save/tour/update behavior plus the new failure cases.

The actual native helper was also contacted through the compiled bridge. It correctly reported the already-running installed app as the desktop owner; no apply command was sent and the existing app was left untouched. Normal live color-effect/restoration acceptance remains a manual installed-app check.

Build uses cached Electron 33.4.11, electron-builder 25.1.8 and NSIS. No new runtime/tool download is needed. The build does not install the app or publish it to GitHub.
