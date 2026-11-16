# Tray quick controls

Peter requested a small Gapa-style toolbar so users can see their desktop while adjusting, with access to the full app when needed. Builder interpretation: a Windows system-tray popup, rather than a permanent full-size taskbar window.

Normal launch opens a 364 × 548 frameless popup. Clicking the tray icon toggles it; double-click or the context menu opens the full app. `--background` continues to start silently at sign-in. `--full-app` opts into the full workspace on a manual launch. The full app has a Quick controls button that hides it and opens the popup.

If an earlier engine connection failed, reopening quick controls automatically retries it. Startup errors retain their actionable cause instead of being replaced by a generic child-exit message.

The panel exposes all five proven controls, editable numeric values, built-in/saved profiles, effect toggle, original-colors button, engine retry and settings warnings. It shares the existing validated IPC/controller/native engine with the full app: no second color transform or duplicate settings store. Both windows receive acknowledged state changes. The popup follows PlayTime theme/accent changes through the shared storage origin.

The popup sits above other windows while open and hides on blur by default. Its lock/pin button keeps it visible when focus changes; the draggable header moves it. Pin state lasts for the current application session. Close and Escape hide it, including when pinned, while colors remain applied. Quitting remains explicit through the existing tray/full-app flow and restores the baseline.

Initial placement uses tray bounds and the corresponding display work area. Bounds are clamped, including negative display coordinates, top/bottom taskbars and short displays; a short work area permits panel scrolling. The popup is not shown as its own taskbar button. It does not force Windows to show an icon outside the user's tray-overflow preference.

Both renderer windows remain sandboxed and context-isolated. IPC accepts only the exact trusted local main-frame URL associated with each registered window. New window-control actions validate pin booleans; navigation and window-open requests are blocked. Development reload updates both renderers without restarting the engine.

Verification: 15 Node tests include positioning edge cases. Electron mock-engine smoke checks real popup creation, always-on-top state, shared theme, live slider synchronization, pinned/unpinned blur, settings recovery warnings, hide-without-disable, and switching to the full app. Existing browser/design checks pass. Smoke mode makes no physical desktop color changes. No downloads, packaging, startup enabling or pushes are part of this change.
