# macOS Dock App Badge for Unchecked Reminders (Tauri & Web Badging)

Implement native macOS Dock badging for the Trine desktop application—exactly like Slack's red unread badge on the macOS Dock—with **`9+` badge overflow formatting**, W3C Web Badging, and dynamic canvas favicon badges for browser testing.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Summary of User Choices & `9+` Rule**:
> - **macOS Dock Icon Badge**: When reminders trigger and remain unacknowledged, Trine sets the native badge directly on the macOS Dock icon (e.g., a red circle or pill).
> - **`9+` Overflow Cap**: If the count of unchecked reminders is **above 9**, the badge label displays **`9+`** (formatted in a wider pill badge), preventing text overflow just like Slack and macOS notification centers. For counts $1$ through $9$, it displays the exact number (`1`, `2`, ..., `9`).
> - **Tauri Desktop Native API**: Uses Tauri's native window badge API (`getCurrentWindow().setBadgeLabel(label)` / `getCurrentWebviewWindow().setBadgeCount(count)`) and custom Rust command fallback in `src-tauri` (`tauri::Manager` macOS dock tile `NSApp.dockTile().setBadgeLabel()`).
> - **W3C App Badging API (`navigator.setAppBadge`)**: The official web standard supported by macOS Safari and Chrome when Trine is added to the macOS Dock or run as a standalone desktop web app.
> - **Dynamic Canvas Favicon & Title Badge**: In web preview mode, Trine renders the exact Slack-style red badge onto the browser favicon using an in-memory 64×64 `<canvas>` with `9+` pill formatting and updates `document.title` (e.g., `(9+) Trine` or `(3) Trine`).
> - **Dock Preview Widget**: A macOS Dock preview card in Settings so you can inspect how the Trine icon and red badge look rendered at full macOS Dock resolution with test buttons for 1, 5, and 12 (`9+`).

- **Confirmed Decision 1**: macOS Dock icon badge is driven by `activeAlerts.length` (unacknowledged recurring reminder alarms).
- **Confirmed Decision 2**: Format rule: `count > 9 ? '9+' : count.toString()`.
- **Confirmed Decision 3**: Automatic clearing: as soon as the user snoozes, dismisses, or completes reminders, the Dock badge immediately updates and removes the badge once all alerts are cleared (`count === 0`).

---

## 1. Overview & Core Concept

- **What It Does**: Mirrors the Slack desktop experience on macOS. When an hourly reminder or routine alarm fires in Trine and hasn't been checked, the macOS Dock icon displays a red notification badge counter (`1`, `2`, ..., `9`, or `9+` if $>9$). Once the user addresses the alerts, the Dock badge disappears.
- **Why It Matters**: Desktop users frequently minimize or background their task app. The macOS Dock icon badge gives an ambient, persistent indicator that a reminder needs attention without forcing intrusive popups.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Idle State**:
   - macOS Dock icon displays the clean Trine icon with no badge.
2. **Reminder Triggered**:
   - The scheduler matches the current hour and adds an active alert to `activeAlerts`.
   - The badge service executes `updateAppBadge(activeAlerts.length)`:
     - Formats text: `label = count > 9 ? '9+' : String(count)`.
     - On macOS (Tauri): The native macOS Dock tile updates with the red badge label (`9+` if $>9$).
     - In Web / PWA (`navigator.setAppBadge`): Sets the OS dock badge directly.
     - In Browser Tab: The favicon updates dynamically via `<canvas>` with the red Slack-style pill badge with `9+`, and the tab title updates to `(9+) Trine`.
3. **Clearing Alerts**:
   - The user opens Trine and clicks **Done**, **Snooze**, or **Dismiss** on the reminder alert banner.
   - `activeAlerts` decrements. If it goes from 10 to 9, the badge switches from `9+` to `9`.
   - When count reaches 0, `clearBadge()` is called:
     - Tauri resets the macOS Dock badge (`setBadgeLabel(null)`).
     - `navigator.clearAppBadge()` clears the OS dock.
     - The favicon restores to the clean original Trine icon and title returns to `Trine`.

---

## 3. Technical Architecture & Implementation Details

### Badging Architecture Diagram

```
┌────────────────────────────────────────────────────────┐
│                   AppContext                           │
│  - activeAlerts: ActiveReminderAlert[]                 │
│  - Evaluated on every clock tick and user dismissal    │
└───────────────────────────┬────────────────────────────┘
                            │
               count = activeAlerts.length
               badgeLabel = count > 9 ? '9+' : count
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│              Badge Service (badgeService.ts)           │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 1. Tauri Native macOS Dock Badge                 │  │
│  │    getCurrentWindow().setBadgeLabel(badgeLabel)  │  │
│  │    + Rust dockTile fallback command              │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 2. W3C App Badging API (macOS Safari & Chrome)   │  │
│  │    navigator.setAppBadge(count)                  │  │
│  │    navigator.clearAppBadge()                     │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 3. Dynamic Canvas Favicon & Tab Title (Web)      │  │
│  │    drawSlackBadgeOnFavicon(iconUrl, badgeLabel)  │  │
│  │    (Pill shape for '9+', circle for '1'-'9')     │  │
│  │    document.title = `(${badgeLabel}) Trine`      │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### Component & Service Changes
1. `src/services/badgeService.ts` (New Service):
   - `updateAppBadge(count: number): Promise<void>`
     - If `count > 0`:
       - `badgeLabel = count > 9 ? '9+' : count.toString()`
       - Invokes Tauri native badge API if in Tauri (`getCurrentWindow().setBadgeLabel(badgeLabel)` or `setBadgeCount(count)`).
       - Calls `navigator.setAppBadge(count)` if supported by the browser.
       - Generates a dynamic favicon with the red circular/pill badge and `badgeLabel` using HTML5 Canvas.
       - Prefixes `document.title` with `(${badgeLabel}) `.
     - If `count === 0`:
       - Clears Tauri badge (`setBadgeLabel(undefined)`).
       - Calls `navigator.clearAppBadge()`.
       - Restores the static clean favicon.
       - Restores clean `document.title`.
2. `src/context/AppContext.tsx`:
   - Add a `useEffect` watching `activeAlerts.length` that calls `updateAppBadge(activeAlerts.length)`.
3. `src-tauri/src/main.rs`:
   - Add native Rust command `set_dock_badge(badge: Option<String>)` so that on macOS it calls AppKit's `NSApp.dockTile().setBadgeLabel()` natively.
4. `src/components/SettingsModal.tsx`:
   - Add a "macOS Dock Badging & Preview" card in settings with test buttons (Clear, 1 alert, 5 alerts, 12 alerts [9+]) to instantly preview the dock badge.
