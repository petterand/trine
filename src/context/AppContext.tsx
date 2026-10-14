/**
 * ChronosTask Core State & Recurring Reminder Engine
 */

import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import {
  AppData,
  TodoItem,
  GeneralReminder,
  AppSettings,
  ViewFilter,
  ActiveAlert,
  DayOfWeek,
  RecurringReminderConfig
} from '../types';
import {
  loadJsonData,
  saveJsonData,
  openLocalJsonFileDialog,
  exportJsonFile,
  isTauriEnvironment,
  defaultInitialData
} from '../services/tauriBridge';
import { soundService } from '../services/soundService';
import { sendDesktopNotification, requestNotificationPermission } from '../services/notificationService';
import { updateAppBadge } from '../services/badgeService';

interface AppContextType {
  // Data
  appData: AppData;
  storageSource: 'tauri' | 'fsa' | 'localstorage' | 'default';
  filePath: string;
  isSaving: boolean;
  lastSavedAt: string | null;
  isTauri: boolean;

  // View state
  currentFilter: ViewFilter;
  setCurrentFilter: (filter: ViewFilter) => void;
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchScope: 'all' | 'title' | 'tag';
  setSearchScope: (scope: 'all' | 'title' | 'tag') => void;
  activeViewTab: 'tasks' | 'routines' | 'timeline';
  setActiveViewTab: (tab: 'tasks' | 'routines' | 'timeline') => void;

  // Modals & Editing
  isTaskModalOpen: boolean;
  setIsTaskModalOpen: (open: boolean) => void;
  editingTodo: TodoItem | null;
  setEditingTodo: (todo: TodoItem | null) => void;
  isRoutineModalOpen: boolean;
  setIsRoutineModalOpen: (open: boolean) => void;
  editingRoutine: GeneralReminder | null;
  setEditingRoutine: (routine: GeneralReminder | null) => void;
  isRawJsonModalOpen: boolean;
  setIsRawJsonModalOpen: (open: boolean) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;

  // Todo CRUD
  addTodo: (todo: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTodo: (id: string, updates: Partial<TodoItem>) => void;
  deleteTodo: (id: string) => void;
  toggleTodoComplete: (id: string) => void;
  toggleSubTask: (todoId: string, subtaskId: string) => void;
  addSubTask: (todoId: string, title: string) => void;
  deleteSubTask: (todoId: string, subtaskId: string) => void;
  duplicateTodo: (id: string) => void;

  // Routine CRUD
  addGeneralReminder: (item: Omit<GeneralReminder, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateGeneralReminder: (id: string, updates: Partial<GeneralReminder>) => void;
  deleteGeneralReminder: (id: string) => void;
  toggleGeneralReminder: (id: string) => void;

  // Alert Management
  activeAlerts: ActiveAlert[];
  dismissAlert: (alertId: string) => void;
  snoozeAlert: (alertId: string, minutes: number) => void;
  completeTodoFromAlert: (todoId: string) => void;
  testReminderChime: () => void;
  addTestAlerts: (count: number) => void;
  clearAllAlerts: () => void;

  // Storage / File Operations
  forceSave: () => Promise<void>;
  openJsonFile: () => Promise<void>;
  exportDataFile: () => Promise<void>;
  importRawJsonString: (jsonStr: string) => boolean;
  updateSettings: (updates: Partial<AppSettings>) => void;

  // Derived filtered todos
  filteredTodos: TodoItem[];
  allTags: string[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DAYS_MAP: Record<number, DayOfWeek> = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat'
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appData, setAppData] = useState<AppData>(defaultInitialData);
  const [storageSource, setStorageSource] = useState<'tauri' | 'fsa' | 'localstorage' | 'default'>('default');
  const [filePath, setFilePath] = useState<string>('todos.json');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isTauri] = useState<boolean>(isTauriEnvironment());

  // View state
  const [currentFilter, setCurrentFilter] = useState<ViewFilter>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchScope, setSearchScope] = useState<'all' | 'title' | 'tag'>('all');
  const [activeViewTab, setActiveViewTab] = useState<'tasks' | 'routines' | 'timeline'>('tasks');

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState<boolean>(false);
  const [editingRoutine, setEditingRoutine] = useState<GeneralReminder | null>(null);
  const [isRawJsonModalOpen, setIsRawJsonModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Active alerts
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([]);

  // Automatically update macOS Dock badge, W3C Web Badge, dynamic favicon, and window title
  useEffect(() => {
    updateAppBadge(activeAlerts.length);
  }, [activeAlerts.length]);

  // Prevent multiple saves on rapid change
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Load from Local File / Tauri / LocalStorage
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const res = await loadJsonData();
      if (isMounted) {
        setAppData(res.data);
        setStorageSource(res.source);
        setFilePath(res.filePath);
        setLastSavedAt(new Date().toLocaleTimeString());
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Auto-save to Disk on State Changes
  const triggerAutoSave = (updatedData: AppData) => {
    setAppData(updatedData);
    if (!updatedData.settings.autoSave) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      const res = await saveJsonData(updatedData);
      setIsSaving(false);
      setLastSavedAt(new Date().toLocaleTimeString());
      if (res.filePath) {
        setFilePath(res.filePath);
      }
    }, 400);
  };

  // 3. Recurring Hourly Reminder Clock Engine
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentHourStr = `${currentHours}:${currentMinutes}`;
      const hourOnly = `${currentHours}:00`;
      const currentDay = DAYS_MAP[now.getDay()];
      const currentMinuteKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${currentHours}:${currentMinutes}`;

      let hasTriggered = false;
      const newAlerts: ActiveAlert[] = [];
      let updatedTodos = [...appData.todos];
      let updatedRoutines = [...appData.generalReminders];

      // A. Check Todos Reminders
      updatedTodos = updatedTodos.map((todo) => {
        if (todo.completed || !todo.reminder || !todo.reminder.enabled) {
          return todo;
        }

        const r = todo.reminder;

        // Check if snoozed
        if (r.snoozedUntil && Date.now() < r.snoozedUntil) {
          return todo;
        }

        // Check day
        if (r.repeatDays && r.repeatDays.length > 0 && !r.repeatDays.includes(currentDay)) {
          return todo;
        }

        // Check if already triggered this minute
        if (r.lastTriggeredMinute === currentMinuteKey) {
          return todo;
        }

        let isMatch = false;

        if (r.type === 'specific_hours') {
          // Check if specific hours list includes this hour/time
          isMatch = r.specificHours.some((h) => {
            const cleanH = h.length === 5 ? h : `${h.padStart(2, '0')}:00`;
            // Trigger either at the exact minute if specified (e.g. 14:30) or during the hour's first minute
            return cleanH === currentHourStr || cleanH === hourOnly;
          });
        } else if (r.type === 'interval_hours' && r.intervalHours) {
          const currentHNum = now.getHours();
          const startHNum = r.intervalStartHour ? parseInt(r.intervalStartHour.split(':')[0], 10) : 8;
          const endHNum = r.intervalEndHour ? parseInt(r.intervalEndHour.split(':')[0], 10) : 20;

          if (currentHNum >= startHNum && currentHNum <= endHNum) {
            const diff = currentHNum - startHNum;
            if (diff >= 0 && diff % r.intervalHours === 0 && now.getMinutes() === 0) {
              isMatch = true;
            }
          }
        }

        if (isMatch) {
          hasTriggered = true;
          newAlerts.push({
            id: `alert-todo-${todo.id}-${Date.now()}`,
            type: 'todo',
            itemId: todo.id,
            title: todo.title,
            description: todo.description || 'Scheduled todo hourly reminder',
            priority: todo.priority,
            targetHour: currentHourStr,
            timestamp: Date.now()
          });

          return {
            ...todo,
            reminder: {
              ...r,
              lastTriggeredMinute: currentMinuteKey,
              snoozedUntil: undefined
            }
          };
        }

        return todo;
      });

      // B. Check General / Routine Reminders
      updatedRoutines = updatedRoutines.map((routine) => {
        if (!routine.enabled || !routine.config || !routine.config.enabled) {
          return routine;
        }

        const r = routine.config;

        if (r.snoozedUntil && Date.now() < r.snoozedUntil) {
          return routine;
        }

        if (r.repeatDays && r.repeatDays.length > 0 && !r.repeatDays.includes(currentDay)) {
          return routine;
        }

        if (r.lastTriggeredMinute === currentMinuteKey) {
          return routine;
        }

        let isMatch = false;

        if (r.type === 'specific_hours') {
          isMatch = r.specificHours.some((h) => {
            const cleanH = h.length === 5 ? h : `${h.padStart(2, '0')}:00`;
            return cleanH === currentHourStr || cleanH === hourOnly;
          });
        } else if (r.type === 'interval_hours' && r.intervalHours) {
          const currentHNum = now.getHours();
          const startHNum = r.intervalStartHour ? parseInt(r.intervalStartHour.split(':')[0], 10) : 8;
          const endHNum = r.intervalEndHour ? parseInt(r.intervalEndHour.split(':')[0], 10) : 20;

          if (currentHNum >= startHNum && currentHNum <= endHNum) {
            const diff = currentHNum - startHNum;
            if (diff >= 0 && diff % r.intervalHours === 0 && now.getMinutes() === 0) {
              isMatch = true;
            }
          }
        }

        if (isMatch) {
          hasTriggered = true;
          newAlerts.push({
            id: `alert-routine-${routine.id}-${Date.now()}`,
            type: 'general',
            itemId: routine.id,
            title: routine.title,
            description: routine.description || 'Scheduled routine reminder',
            priority: routine.priority || 'medium',
            targetHour: currentHourStr,
            timestamp: Date.now()
          });

          return {
            ...routine,
            config: {
              ...r,
              lastTriggeredMinute: currentMinuteKey,
              snoozedUntil: undefined
            }
          };
        }

        return routine;
      });

      if (hasTriggered) {
        if (appData.settings.soundEnabled) {
          soundService.playReminderChime(appData.settings.soundVolume);
        }

        if (appData.settings.notificationsEnabled) {
          newAlerts.forEach((alert) => {
            sendDesktopNotification(`Reminder: ${alert.title}`, alert.description);
          });
        }

        setActiveAlerts((prev) => [...prev, ...newAlerts]);

        const nextData: AppData = {
          ...appData,
          lastUpdated: new Date().toISOString(),
          todos: updatedTodos,
          generalReminders: updatedRoutines
        };
        triggerAutoSave(nextData);
      }
    };

    // Check every 5 seconds for responsive minute triggers
    const interval = setInterval(checkReminders, 5000);
    return () => clearInterval(interval);
  }, [appData]);

  // Alert Handlers
  const dismissAlert = (alertId: string) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const snoozeAlert = (alertId: string, minutes: number) => {
    const alert = activeAlerts.find((a) => a.id === alertId);
    if (!alert) return;

    const snoozeUntil = Date.now() + minutes * 60 * 1000;

    if (alert.type === 'todo') {
      const updatedTodos = appData.todos.map((t) => {
        if (t.id === alert.itemId && t.reminder) {
          return {
            ...t,
            reminder: {
              ...t.reminder,
              snoozedUntil: snoozeUntil
            }
          };
        }
        return t;
      });
      triggerAutoSave({ ...appData, todos: updatedTodos });
    } else {
      const updatedRoutines = appData.generalReminders.map((g) => {
        if (g.id === alert.itemId) {
          return {
            ...g,
            config: {
              ...g.config,
              snoozedUntil: snoozeUntil
            }
          };
        }
        return g;
      });
      triggerAutoSave({ ...appData, generalReminders: updatedRoutines });
    }

    dismissAlert(alertId);
  };

  const completeTodoFromAlert = (todoId: string) => {
    toggleTodoComplete(todoId);
    setActiveAlerts((prev) => prev.filter((a) => a.itemId !== todoId));
  };

  const testReminderChime = () => {
    soundService.playReminderChime(appData.settings.soundVolume);
    // Also display a sample alert
    const testAlert: ActiveAlert = {
      id: `test-alert-${Date.now()}`,
      type: 'general',
      itemId: 'sample-test',
      title: 'Reminder Preview Active',
      description: 'This is how your recurring hourly reminder alert appears on screen.',
      priority: 'high',
      targetHour: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    };
    setActiveAlerts((prev) => [...prev, testAlert]);
    sendDesktopNotification('Test Reminder Alert', 'Audio and desktop notification are working properly.');
  };

  const addTestAlerts = (count: number) => {
    const newItems: ActiveAlert[] = Array.from({ length: count }).map((_, idx) => ({
      id: `test-alert-${Date.now()}-${idx}`,
      type: 'general',
      itemId: `test-item-${idx}`,
      title: `Unchecked Reminder #${idx + 1}`,
      description: 'Pending recurring alert awaiting your attention in macOS Dock',
      priority: idx % 2 === 0 ? 'urgent' : 'high',
      targetHour: `${String(9 + (idx % 12)).padStart(2, '0')}:00`,
      timestamp: Date.now() - idx * 1000
    }));
    setActiveAlerts((prev) => [...newItems, ...prev]);
  };

  const clearAllAlerts = () => {
    setActiveAlerts([]);
  };

  // Todo CRUD Operations
  const addTodo = (todoInput: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newTodo: TodoItem = {
      ...todoInput,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now
    };

    const nextData: AppData = {
      ...appData,
      lastUpdated: now,
      todos: [newTodo, ...appData.todos]
    };
    triggerAutoSave(nextData);
  };

  const updateTodo = (id: string, updates: Partial<TodoItem>) => {
    const now = new Date().toISOString();
    const updatedTodos = appData.todos.map((todo) => {
      if (todo.id === id) {
        return {
          ...todo,
          ...updates,
          updatedAt: now
        };
      }
      return todo;
    });

    const nextData: AppData = {
      ...appData,
      lastUpdated: now,
      todos: updatedTodos
    };
    triggerAutoSave(nextData);
  };

  const deleteTodo = (id: string) => {
    const now = new Date().toISOString();
    const updatedTodos = appData.todos.filter((todo) => todo.id !== id);
    const nextData: AppData = {
      ...appData,
      lastUpdated: now,
      todos: updatedTodos
    };
    triggerAutoSave(nextData);
  };

  const toggleTodoComplete = (id: string) => {
    const now = new Date().toISOString();
    const target = appData.todos.find((t) => t.id === id);
    const isNowCompleted = target ? !target.completed : false;

    if (isNowCompleted && appData.settings.soundEnabled) {
      soundService.playSuccessTone(appData.settings.soundVolume);
    }

    const updatedTodos = appData.todos.map((todo) => {
      if (todo.id === id) {
        return {
          ...todo,
          completed: isNowCompleted,
          completedAt: isNowCompleted ? now : undefined,
          updatedAt: now
        };
      }
      return todo;
    });

    const nextData: AppData = {
      ...appData,
      lastUpdated: now,
      todos: updatedTodos
    };
    triggerAutoSave(nextData);
  };

  const toggleSubTask = (todoId: string, subtaskId: string) => {
    const now = new Date().toISOString();
    const updatedTodos = appData.todos.map((todo) => {
      if (todo.id === todoId) {
        const updatedSubtasks = todo.subtasks.map((sub) => {
          if (sub.id === subtaskId) {
            return { ...sub, completed: !sub.completed };
          }
          return sub;
        });
        return {
          ...todo,
          subtasks: updatedSubtasks,
          updatedAt: now
        };
      }
      return todo;
    });

    triggerAutoSave({
      ...appData,
      lastUpdated: now,
      todos: updatedTodos
    });
  };

  const addSubTask = (todoId: string, title: string) => {
    if (!title.trim()) return;
    const now = new Date().toISOString();
    const newSub: { id: string; title: string; completed: boolean } = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      completed: false
    };

    const updatedTodos = appData.todos.map((todo) => {
      if (todo.id === todoId) {
        return {
          ...todo,
          subtasks: [...todo.subtasks, newSub],
          updatedAt: now
        };
      }
      return todo;
    });

    triggerAutoSave({
      ...appData,
      lastUpdated: now,
      todos: updatedTodos
    });
  };

  const deleteSubTask = (todoId: string, subtaskId: string) => {
    const now = new Date().toISOString();
    const updatedTodos = appData.todos.map((todo) => {
      if (todo.id === todoId) {
        return {
          ...todo,
          subtasks: todo.subtasks.filter((s) => s.id !== subtaskId),
          updatedAt: now
        };
      }
      return todo;
    });

    triggerAutoSave({
      ...appData,
      lastUpdated: now,
      todos: updatedTodos
    });
  };

  const duplicateTodo = (id: string) => {
    const source = appData.todos.find((t) => t.id === id);
    if (!source) return;

    const now = new Date().toISOString();
    const duplicated: TodoItem = {
      ...source,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: `${source.title} (Copy)`,
      completed: false,
      completedAt: undefined,
      subtasks: source.subtasks.map((s) => ({ ...s, id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, completed: false })),
      createdAt: now,
      updatedAt: now
    };

    triggerAutoSave({
      ...appData,
      lastUpdated: now,
      todos: [duplicated, ...appData.todos]
    });
  };

  // General Reminder CRUD
  const addGeneralReminder = (itemInput: Omit<GeneralReminder, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newReminder: GeneralReminder = {
      ...itemInput,
      id: `gen-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now
    };

    triggerAutoSave({
      ...appData,
      lastUpdated: now,
      generalReminders: [newReminder, ...appData.generalReminders]
    });
  };

  const updateGeneralReminder = (id: string, updates: Partial<GeneralReminder>) => {
    const now = new Date().toISOString();
    const updatedRoutines = appData.generalReminders.map((r) => {
      if (r.id === id) {
        return {
          ...r,
          ...updates,
          updatedAt: now
        };
      }
      return r;
    });

    triggerAutoSave({
      ...appData,
      lastUpdated: now,
      generalReminders: updatedRoutines
    });
  };

  const deleteGeneralReminder = (id: string) => {
    const now = new Date().toISOString();
    const updatedRoutines = appData.generalReminders.filter((r) => r.id !== id);
    triggerAutoSave({
      ...appData,
      lastUpdated: now,
      generalReminders: updatedRoutines
    });
  };

  const toggleGeneralReminder = (id: string) => {
    const now = new Date().toISOString();
    const updatedRoutines = appData.generalReminders.map((r) => {
      if (r.id === id) {
        const nextEnabled = !r.enabled;
        return {
          ...r,
          enabled: nextEnabled,
          config: {
            ...r.config,
            enabled: nextEnabled
          },
          updatedAt: now
        };
      }
      return r;
    });

    triggerAutoSave({
      ...appData,
      lastUpdated: now,
      generalReminders: updatedRoutines
    });
  };

  // Storage Actions
  const forceSave = async () => {
    setIsSaving(true);
    const res = await saveJsonData(appData);
    setIsSaving(false);
    setLastSavedAt(new Date().toLocaleTimeString());
    if (res.filePath) {
      setFilePath(res.filePath);
    }
  };

  const openJsonFile = async () => {
    const result = await openLocalJsonFileDialog();
    if (result && result.data) {
      setAppData(result.data);
      setFilePath(result.fileName);
      setStorageSource('fsa');
      setLastSavedAt(new Date().toLocaleTimeString());
      triggerAutoSave(result.data);
    }
  };

  const exportDataFile = async () => {
    const savedName = await exportJsonFile(appData, 'todos.json');
    if (savedName) {
      setFilePath(savedName);
      setLastSavedAt(new Date().toLocaleTimeString());
    }
  };

  const importRawJsonString = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr) as AppData;
      if (!parsed.todos || !Array.isArray(parsed.todos)) {
        throw new Error('Missing todos array in JSON');
      }
      setAppData(parsed);
      triggerAutoSave(parsed);
      return true;
    } catch (err) {
      console.error('Invalid JSON syntax:', err);
      return false;
    }
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    const updated = {
      ...appData,
      settings: {
        ...appData.settings,
        ...updates
      }
    };
    triggerAutoSave(updated);

    if (updates.notificationsEnabled) {
      requestNotificationPermission();
    }
  };

  // Derived filtered todos
  const filteredTodos = useMemo(() => {
    let result = [...appData.todos];
    const todayStr = new Date().toISOString().split('T')[0];

    // Filter by view tab
    if (currentFilter === 'today') {
      result = result.filter((t) => t.dueDate === todayStr);
    } else if (currentFilter === 'upcoming') {
      result = result.filter((t) => t.dueDate && t.dueDate > todayStr && !t.completed);
    } else if (currentFilter === 'reminders') {
      result = result.filter((t) => t.reminder && t.reminder.enabled && !t.completed);
    } else if (currentFilter === 'completed') {
      result = result.filter((t) => t.completed);
    } else {
      // 'all' shows all or non-completed first
      result = result.sort((a, b) => Number(a.completed) - Number(b.completed));
    }

    // Filter by tag
    if (selectedTag) {
      result = result.filter((t) => t.tags && t.tags.includes(selectedTag));
    }

    // Search query & real-time filter by title, tag, or content
    if (searchQuery.trim()) {
      const rawQuery = searchQuery.trim().toLowerCase();
      let mode = searchScope;
      let cleanQuery = rawQuery;

      if (rawQuery.startsWith('tag:') || rawQuery.startsWith('tags:')) {
        mode = 'tag';
        cleanQuery = rawQuery.replace(/^(tag|tags):/, '').trim();
      } else if (rawQuery.startsWith('#')) {
        mode = 'tag';
        cleanQuery = rawQuery.replace(/^#+/, '').trim();
      } else if (rawQuery.startsWith('title:')) {
        mode = 'title';
        cleanQuery = rawQuery.replace(/^title:/, '').trim();
      }

      if (cleanQuery) {
        result = result.filter((t) => {
          const matchTitle = t.title.toLowerCase().includes(cleanQuery);
          const matchDesc = t.description ? t.description.toLowerCase().includes(cleanQuery) : false;
          const matchTag = t.tags ? t.tags.some((tag) => tag.toLowerCase().includes(cleanQuery)) : false;
          const matchSubtask = t.subtasks ? t.subtasks.some((sub) => sub.title.toLowerCase().includes(cleanQuery)) : false;

          if (mode === 'title') {
            return matchTitle;
          }
          if (mode === 'tag') {
            return matchTag;
          }
          return matchTitle || matchTag || matchDesc || matchSubtask;
        });
      }
    }

    return result;
  }, [appData.todos, currentFilter, selectedTag, searchQuery, searchScope]);

  // Derived all tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    appData.todos.forEach((t) => t.tags?.forEach((tag) => set.add(tag)));
    appData.generalReminders.forEach((r) => r.tags?.forEach((tag) => set.add(tag)));
    return Array.from(set).sort();
  }, [appData.todos, appData.generalReminders]);

  return (
    <AppContext.Provider
      value={{
        appData,
        storageSource,
        filePath,
        isSaving,
        lastSavedAt,
        isTauri,
        currentFilter,
        setCurrentFilter,
        selectedTag,
        setSelectedTag,
        searchQuery,
        setSearchQuery,
        searchScope,
        setSearchScope,
        activeViewTab,
        setActiveViewTab,
        isTaskModalOpen,
        setIsTaskModalOpen,
        editingTodo,
        setEditingTodo,
        isRoutineModalOpen,
        setIsRoutineModalOpen,
        editingRoutine,
        setEditingRoutine,
        isRawJsonModalOpen,
        setIsRawJsonModalOpen,
        isSettingsModalOpen,
        setIsSettingsModalOpen,
        addTodo,
        updateTodo,
        deleteTodo,
        toggleTodoComplete,
        toggleSubTask,
        addSubTask,
        deleteSubTask,
        duplicateTodo,
        addGeneralReminder,
        updateGeneralReminder,
        deleteGeneralReminder,
        toggleGeneralReminder,
        activeAlerts,
        dismissAlert,
        snoozeAlert,
        completeTodoFromAlert,
        testReminderChime,
        addTestAlerts,
        clearAllAlerts,
        forceSave,
        openJsonFile,
        exportDataFile,
        importRawJsonString,
        updateSettings,
        filteredTodos,
        allTags
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
