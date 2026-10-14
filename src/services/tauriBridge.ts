/**
 * Tauri Native FileSystem & Browser File System Access Bridge
 * 
 * Provides unified, seamless local JSON reading, writing, and backup:
 * - In Tauri Desktop: uses Tauri's official @tauri-apps/plugin-fs via IPC.
 * - In Web Preview: uses browser File System Access API (showOpenFilePicker/showSaveFilePicker),
 *   localStorage auto-cache, and direct JSON download/upload file picker.
 */

import { AppData } from '../types';
import { readTextFile, writeTextFile, exists, BaseDirectory } from '@tauri-apps/plugin-fs';

const STORAGE_KEY = 'chronostask_local_data';
const DEFAULT_FILENAME = 'todos.json';

export const isTauriEnvironment = (): boolean => {
  return typeof window !== 'undefined' && ('__TAURI__' in window || '__TAURI_INTERNALS__' in window);
};

export const defaultInitialData: AppData = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  settings: {
    notificationsEnabled: true,
    soundEnabled: true,
    soundVolume: 0.7,
    activeHoursStart: '08:00',
    activeHoursEnd: '20:00',
    autoSave: true,
    filePath: 'todos.json'
  },
  todos: [
    {
      id: 'task-1',
      title: 'Review quarterly architecture proposals',
      description: 'Go over draft RFCs and align on core database schema changes.',
      completed: false,
      priority: 'high',
      tags: ['Work', 'Engineering'],
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      subtasks: [
        { id: 'sub-1', title: 'Read RFC-104 on caching', completed: true },
        { id: 'sub-2', title: 'Leave feedback on security audit', completed: false }
      ],
      reminder: {
        enabled: true,
        type: 'specific_hours',
        specificHours: ['09:00', '14:00', '17:00'],
        repeatDays: ['mon', 'tue', 'wed', 'thu', 'fri']
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'task-2',
      title: 'Submit open-source pull request',
      description: 'Finish unit tests and push upstream to main repository.',
      completed: false,
      priority: 'urgent',
      tags: ['Dev', 'OpenSource'],
      dueDate: new Date().toISOString().split('T')[0],
      subtasks: [
        { id: 'sub-3', title: 'Verify lint & build passing', completed: true },
        { id: 'sub-4', title: 'Write release notes', completed: false }
      ],
      reminder: {
        enabled: true,
        type: 'interval_hours',
        specificHours: [],
        intervalHours: 3,
        intervalStartHour: '10:00',
        intervalEndHour: '19:00',
        repeatDays: ['mon', 'tue', 'wed', 'thu', 'fri']
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'task-3',
      title: 'Update desktop backup routines',
      description: 'Ensure local JSON storage is synced and exported properly.',
      completed: true,
      priority: 'medium',
      tags: ['System'],
      subtasks: [],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    }
  ],
  generalReminders: [
    {
      id: 'gen-1',
      title: 'Hydration & Posture Reset',
      description: 'Drink a glass of water and stretch back and shoulders.',
      enabled: true,
      priority: 'medium',
      tags: ['Health', 'Routine'],
      config: {
        enabled: true,
        type: 'interval_hours',
        specificHours: [],
        intervalHours: 2,
        intervalStartHour: '09:00',
        intervalEndHour: '19:00',
        repeatDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'gen-2',
      title: 'End of Day Todo Review & Planning',
      description: 'Check off finished items, reschedule overdue tasks, and plan tomorrow.',
      enabled: true,
      priority: 'high',
      tags: ['Productivity', 'Routine'],
      config: {
        enabled: true,
        type: 'specific_hours',
        specificHours: ['17:30'],
        repeatDays: ['mon', 'tue', 'wed', 'thu', 'fri']
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
};

// Handle in-memory file handle for File System Access API
let fileHandle: any = null;

/**
 * Loads JSON data from Tauri FS, FileSystemFileHandle, or localStorage fallback
 */
export async function loadJsonData(): Promise<{ data: AppData; source: 'tauri' | 'fsa' | 'localstorage' | 'default'; filePath: string }> {
  // 1. Try Tauri FS if running inside native Tauri
  if (isTauriEnvironment()) {
    try {
      const filename = DEFAULT_FILENAME;
      const fileExists = await exists(filename, { baseDir: BaseDirectory.AppData });
      if (fileExists) {
        const content = await readTextFile(filename, { baseDir: BaseDirectory.AppData });
        const parsed = JSON.parse(content) as AppData;
        return { data: parsed, source: 'tauri', filePath: `$APPDATA/${filename}` };
      }
    } catch (err) {
      console.warn('Tauri fs readTextFile failed or plugin not initialized in webview:', err);
    }
  }

  // 2. Try File System Access API if previously opened handle exists
  if (fileHandle) {
    try {
      const file = await fileHandle.getFile();
      const text = await file.text();
      const parsed = JSON.parse(text) as AppData;
      return { data: parsed, source: 'fsa', filePath: fileHandle.name || DEFAULT_FILENAME };
    } catch (err) {
      console.warn('File handle read error:', err);
    }
  }

  // 3. Fallback to localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      return { data: parsed, source: 'localstorage', filePath: 'todos.json (Local Storage)' };
    }
  } catch (err) {
    console.warn('localStorage read error:', err);
  }

  // 4. Default initial state
  return { data: defaultInitialData, source: 'default', filePath: 'todos.json (Default)' };
}

/**
 * Saves JSON data to disk via Tauri FS, File System Access API handle, and localStorage
 */
export async function saveJsonData(data: AppData): Promise<{ success: boolean; filePath: string }> {
  const jsonString = JSON.stringify(data, null, 2);
  let savedPath = data.settings.filePath || DEFAULT_FILENAME;

  // 1. Always sync to localStorage as immediate offline safeguard
  try {
    localStorage.setItem(STORAGE_KEY, jsonString);
  } catch (err) {
    console.warn('localStorage save failed:', err);
  }

  // 2. Tauri native save
  if (isTauriEnvironment()) {
    try {
      await writeTextFile(DEFAULT_FILENAME, jsonString, { baseDir: BaseDirectory.AppData });
      return { success: true, filePath: `$APPDATA/${DEFAULT_FILENAME}` };
    } catch (err) {
      console.error('Tauri writeTextFile error:', err);
    }
  }

  // 3. File System Access API if active
  if (fileHandle) {
    try {
      const writable = await fileHandle.createWritable();
      await writable.write(jsonString);
      await writable.close();
      return { success: true, filePath: fileHandle.name };
    } catch (err) {
      console.warn('FileSystemHandle write failed:', err);
    }
  }

  return { success: true, filePath: savedPath };
}

/**
 * Open local JSON file dialog
 */
export async function openLocalJsonFileDialog(): Promise<{ data: AppData; fileName: string } | null> {
  // If browser supports showOpenFilePicker
  if (typeof window !== 'undefined' && 'showOpenFilePicker' in window) {
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [
          {
            description: 'JSON Files',
            accept: {
              'application/json': ['.json']
            }
          }
        ],
        multiple: false
      });
      if (handle) {
        fileHandle = handle;
        const file = await handle.getFile();
        const text = await file.text();
        const parsed = JSON.parse(text) as AppData;
        return { data: parsed, fileName: file.name };
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error opening file via showOpenFilePicker:', err);
      }
      return null;
    }
  }

  // Fallback: programmatic input file
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as AppData;
        resolve({ data: parsed, fileName: file.name });
      } catch (err) {
        console.error('Failed to parse uploaded JSON file', err);
        resolve(null);
      }
    };
    input.click();
  });
}

/**
 * Save As / Export JSON file to user's disk
 */
export async function exportJsonFile(data: AppData, suggestedName = 'todos.json'): Promise<string | null> {
  const jsonString = JSON.stringify(data, null, 2);

  // If browser supports showSaveFilePicker
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: 'JSON Files',
            accept: {
              'application/json': ['.json']
            }
          }
        ]
      });
      if (handle) {
        fileHandle = handle;
        const writable = await handle.createWritable();
        await writable.write(jsonString);
        await writable.close();
        return handle.name;
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Save file error:', err);
      }
    }
  }

  // Browser download fallback
  try {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = suggestedName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return suggestedName;
  } catch (err) {
    console.error('Download fallback error:', err);
    return null;
  }
}
