# Screen Color Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Deliver the Windows Electron color utility Peter approved after the experiment.
**Architecture:** A sandboxed local renderer invokes a validated main-process controller; a serialized native bridge manages a recoverable C# Magnification helper. A dependency-free localhost server reloads renderer changes. Startup uses local files.
**Tech Stack:** Existing Electron runtime, Node 24 built-ins, HTML/CSS/JS, C#/.NET Framework x64.
**Spec:** ../specs/2026-11-16-screen-color-design.md

## Global constraints
Windows SDR; all displays together; no downloads; local `dev` commits; no packaging/publishing; preserve reference 139/115/100; restore original matrix on quit/failure; no pretend gamma/vibrance/per-monitor support.

## Review focus
Malformed persisted settings must never silently enable extreme effects. Slider floods and rejected helper commands must not corrupt state. Renderer reload must not reset processing. Helper/parent death must restore baseline. Development startup must work without localhost server and remain opt-in.

### Task 1: Color domain and persistence
Files: `lib/model.cjs`, `lib/store.cjs`, `test/model.test.cjs`, `test/store.test.cjs`, `package.json`.
Interfaces: `validateValues(input) -> values`, `matrix(values) -> number[25]`, `defaultState() -> state`, `validateState(input) -> state`; `Store(path).load()/save(state)`.
- [ ] Write failing tests for ranges, reference values, identity/gray preservation, nonfinite inputs, unknown fields, malformed files, atomic roundtrip and profile preservation.
- [ ] Run `node --test test/*.test.cjs`, implement modules, rerun green, commit.

### Task 2: Native lifecycle and controller
Files: `native/ColorHost.cs`, `lib/bridge.cjs`, `lib/controller.cjs`, `scripts/compile.cjs`, `test/controller.test.cjs`, `test/bridge.test.cjs`.
Interfaces: `NativeBridge.start()/request(command)/close()`, `Controller.dispatch(action,payload)/snapshot()/close()`; JSON lines requests `{id,command,values?}` and responses `{id,ok,error?}`.
- [ ] Write failing tests for apply acknowledgment, coalesced/serialized changes, error disabling, baseline reset, profile mutations, timer restores, helper transport failure and bounded timeouts.
- [ ] Implement validation in both JS and native host, baseline capture/recovery child, parent monitoring, native probe and single-instance/experiment detection.
- [ ] Compile development helper, run unit tests and native checks only if experiments closed; commit.

### Task 3: Electron shell and renderer
Files: `electron/main.cjs`, `electron/preload.cjs`, `ui/index.html`, `ui/app.js`, `ui/style.css`, `scripts/dev.cjs`, `scripts/runtime.cjs`, `Start-Screen-Color.cmd`.
Interfaces: preload `screenColor.getState()/action(type,payload)/subscribe(listener)` with controlled IPC; controller emits state. Renderer changes watch/reload via Electron file watcher. Local preview at localhost offers read-only controls illustration.
- [ ] Build shell with IPC validation, local load, tray, startup readback, resume/display hooks, hotkey and orderly quit.
- [ ] Build keyboard-accessible controls, numeric inputs, reference/profile management, persistent effect toggle, Settings and useful error/retry states.
- [ ] Add localhost preview, cached-runtime launcher, native incremental compilation and Electron smoke capture. Run JS parse checks and functional smoke; commit.

### Task 4: Review, evidence and handoff
Files: `README.md`, `docs/verification.md`, central UI History record.
- [ ] Review whole branch with a fresh reviewer; resolve important findings, run full verification once changes settle.
- [ ] Record evidence, startup not exercised at sign-in, physical quality needing Peter's evaluation; record current commit and screenshots.
- [ ] Commit verified final work on `dev`; leave runnable launch script and localhost dev preview. Do not launch an invisible desktop instance for Peter.
