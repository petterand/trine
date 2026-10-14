# Advanced Todo & Recurring Reminder Desktop App (Pure Tauri / TypeScript / React / SCSS)

A pure desktop application architecture built with React, TypeScript, SCSS, and Tauri. All filesystem operations (reading and writing local JSON files) and system notifications are handled natively by the Tauri wrapper without any Node.js or Express backend server.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Pure Tauri Architecture (No Express Server)**:
> You correctly pointed out that Tauri handles filesystem operations directly through its native Rust wrapper. 
> - **Zero Server Architecture**: There is **no Express or Node server**. The frontend is a pure Vite/React/TypeScript bundle running inside Tauri's native webview.
> - **Native Tauri FileSystem API (`@tauri-apps/api/fs`)**: Reading and writing the `todos.json` file is performed directly by calling Tauri's native fs APIs (`readTextFile`, `writeTextFile`, `exists`, `BaseDirectory.AppData` or custom path).
> - **Native Tauri Notifications (`@tauri-apps/api/notification`)**: System desktop alerts are fired directly through Tauri's native notification bridge.
> - **Preview Environment Fallback**: For running in this browser preview environment (where Tauri's Rust binary isn't compiling in the browser frame), the app gracefully switches to the browser's native **File System Access API** (`window.showOpenFilePicker` / `showSaveFilePicker`) and `localStorage`, so you can test local JSON file reading, editing, and saving right here before building your `.exe` / `.app` / `.deb` bundle with `cargo tauri build`.

- **Confirmed Decision 1**: 100% pure Tauri desktop application — no Express or background Node.js server.
- **Confirmed Decision 2**: Native filesystem read/write for local `todos.json` storage using `@tauri-apps/api/fs` in Tauri and File System Access API in browser preview.
- **Confirmed Decision 3**: Recurring reminders supported both **per-todo** and **in general (routine alarms)**, configurable for specific clock hours and repeating intervals.
- **Confirmed Decision 4**: SCSS modular styling paired with Tailwind CSS in a refined dark slate desktop workspace aesthetic.

---

## 1. Overview & Core Concept

- **What It Does**: A standalone desktop task manager and daily cadence engine. Users can create, edit, organize, subtask, and complete tasks with priorities and tags. Tasks or general daily routines have recurring hourly reminders that trigger in-app visual banners, Web Audio chimes, and native system notifications.
- **Target Audience / Persona**: Professionals, developers, and power users who want a lightweight, fast, distraction-free desktop app that saves data directly to transparent local JSON files.
- **Key Value**: 100% local, private, offline-first. No cloud logins, no servers running, instantaneous startup, and direct control over the local JSON file.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Workspace Overview**:
   - Left desktop sidebar ($250\text{px}$): Navigation (*All Tasks*, *Today*, *Upcoming*, *Recurring Reminders*, *Completed*), quick tag list, and active file indicator.
   - Main task board: Real-time search, priority chips, sort controls, and high-density view toggle.
   - Live "Upcoming Reminders" agenda showing current hour timeline and scheduled triggers.
2. **Task Creation & Editing**:
   - Quick-add input on top of list or detailed modal/drawer.
   - Configure title, notes, priority (Urgent, High, Medium, Low), tags, due date, checklist/subtasks.
   - **Recurring Reminder Section**:
     - Toggle specific hours of the day (e.g. multi-select `09:00`, `13:00`, `17:00`).
     - Or repeating interval (e.g. every $N$ hours between active start/end hours).
     - Select active repeat days (Daily, Weekdays, Weekends, or specific days).
3. **General / Routine Reminders**:
   - Standalone daily routines not tied to a single checklist task (e.g., "Hourly hydration & posture reset", "Standup sync at 09:30", "Daily review at 17:30").
4. **Trigger & Notification Experience**:
   - When the scheduled hour hits, the app fires a native Tauri desktop notification and displays an in-app action card with synthesized audio chime.
   - Interactive actions: **Mark Complete**, **Snooze (5m / 15m / 1h)**, or **Dismiss**.
5. **JSON File Management Toolbar**:
   - Status badge showing active file location (e.g., `AppData/todos.json`).
   - Auto-save indicator (saves immediately upon changes).
   - "Open JSON File", "Save As / Export", "Reload from Disk", and an interactive "Raw JSON Inspector/Editor" to view and modify the file directly.

### Visual Identity & Theme
- **Aesthetic Direction**: Desktop workspace aesthetic (clean, modern, dark slate).
- **Color Palette**:
  - Base canvas: `#0b0f19` (Deep slate night)
  - Elevated surfaces: `#111827` (Card / sidebar surface), `#1f2937` (Muted input fills)
  - Borders: `#2d3748` (Hairline 1px dividers)
  - Accents: Indigo (`#6366f1` / `#818cf8`), Amber (`#f59e0b`), Emerald (`#10b981`), Crimson (`#ef4444`).
- **Typography & Hierarchy**:
  - Headings: `Plus Jakarta Sans`.
  - Body & UI: `DM Sans`.
  - Times, Hours, Counters & JSON data: `font-mono tabular-nums`.

---

## 3. Technical Architecture & File System Strategy

### Pure Tauri Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│               Tauri Desktop Window (Webview)                    │
│                                                                 │
│  ┌─────────────────┐ ┌───────────────────┐ ┌─────────────────┐  │
│  │  Sidebar & Tags │ │ Tasks & Reminders │ │ Reminder Engine │  │
│  └────────┬────────┘ └─────────┬─────────┘ └────────┬────────┘  │
│           │                    │                    │           │
│           └────────────────────┼────────────────────┘           │
│                                │                                │
│                     ┌──────────┴──────────┐                     │
│                     │  Tauri FS Bridge    │                     │
│                     │  (Storage Adapter)  │                     │
│                     └──────────┬──────────┘                     │
└────────────────────────────────┼────────────────────────────────┘
                                 │
           ┌─────────────────────┴─────────────────────┐
           ▼ (Inside Tauri Desktop)                    ▼ (Inside Web Preview)
  ┌───────────────────────────────┐           ┌────────────────────────────┐
  │ @tauri-apps/api/fs            │           │ File System Access API     │
  │ readTextFile / writeTextFile  │           │ showOpenFilePicker / Save  │
  │ directly via Tauri Rust IPC   │           │ + localStorage auto-sync   │
  └───────────────┬───────────────┘           └─────────────┬──────────────┘
                  │                                         │
                  ▼                                         ▼
         Local OS File System                     Local .json File / Disk
       (e.g. $APPDATA/todos.json)
```

### Tauri Project Configuration & Rust Files
We provide all native Tauri files:
- `src-tauri/tauri.conf.json`: Configured with window dimensions, title, bundle identifier, and filesystem security permissions (`fs:allow-read-text-file`, `fs:allow-write-text-file`, `fs:allow-exists`, `path:default`, `notification:default`).
- `src-tauri/Cargo.toml`: Tauri v2 / v1 dependency configuration.
- `src-tauri/src/main.rs`: Native desktop entry point.
- `src/services/tauriBridge.ts`: TypeScript abstraction checking `window.__TAURI__` to invoke Tauri native APIs directly, or browser File System Access API fallback in web mode.

### Data Model Schema (`todos.json`)

```typescript
interface AppData {
  version: string;
  lastUpdated: string;
  settings: {
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    activeHoursStart: string; // e.g. "08:00"
    activeHoursEnd: string;   // e.g. "20:00"
    storagePath?: string;
  };
  todos: TodoItem[];
  generalReminders: GeneralReminder[];
}

interface TodoItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  dueDate?: string;
  subtasks: { id: string; title: string; completed: boolean }[];
  reminder?: RecurringReminderConfig;
  createdAt: string;
  completedAt?: string;
}

interface GeneralReminder {
  id: string;
  title: string;
  description?: string;
  enabled: boolean;
  config: RecurringReminderConfig;
  createdAt: string;
}

interface RecurringReminderConfig {
  type: 'specific_hours' | 'interval_hours';
  specificHours?: string[]; // e.g. ["09:00", "13:00", "17:00"]
  intervalHours?: number;   // e.g. 2 (every 2 hours)
  intervalStartHour?: string;
  intervalEndHour?: string;
  repeatDays: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
  lastTriggeredAt?: string;
}
```

---

## 4. Implementation Steps (Planned for Execution)

1. **Install Tauri & SCSS Packages**:
   - Install `sass` for SCSS compilation.
   - Install `@tauri-apps/api` for native filesystem and notification bindings.
2. **Tauri Desktop Configuration Files**:
   - Create `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, `src-tauri/src/main.rs`, and `src-tauri/build.rs`.
3. **Tauri Native Filesystem & Notification Bridge**:
   - Build `src/services/tauriBridge.ts` providing seamless `loadDataFromFile()`, `saveDataToFile()`, `exportJsonFile()`, and `sendNativeNotification()`.
4. **State Management & CRUD Operations**:
   - Full todo management: add, edit, delete, toggle completion, manage subtasks, tag filtering, search, and sorting.
   - General recurring routine reminders management.
5. **Recurring Hourly Reminders Engine**:
   - Clock tick scheduler checking specific hours and interval hours.
   - In-app notification cards with snooze/complete actions and synthesized Web Audio chime.
6. **Desktop UI & SCSS Layout**:
   - Modern desktop sidebar, task list, modal editors, raw JSON editor, and filesystem status header.
