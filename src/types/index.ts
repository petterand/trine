/**
 * ChronosTask Core Types
 */

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface RecurringReminderConfig {
  enabled: boolean;
  type: 'specific_hours' | 'interval_hours';
  // Specific times of day, e.g. ["09:00", "13:00", "17:00"]
  specificHours: string[];
  // Interval repeating, e.g. every 2 hours between 08:00 and 20:00
  intervalHours?: number;
  intervalStartHour?: string; // "08:00"
  intervalEndHour?: string;   // "20:00"
  repeatDays: DayOfWeek[];
  lastTriggeredMinute?: string; // "2026-10-14-09:00" to prevent double-firing
  snoozedUntil?: number; // epoch ms if snoozed
}

export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  tags: string[];
  dueDate?: string; // YYYY-MM-DD
  subtasks: SubTask[];
  reminder?: RecurringReminderConfig;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface GeneralReminder {
  id: string;
  title: string;
  description?: string;
  enabled: boolean;
  priority?: Priority;
  tags: string[];
  config: RecurringReminderConfig;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  soundVolume: number; // 0.0 - 1.0
  activeHoursStart: string; // "08:00"
  activeHoursEnd: string;   // "20:00"
  autoSave: boolean;
  filePath: string;
}

export interface AppData {
  version: string;
  lastUpdated: string;
  settings: AppSettings;
  todos: TodoItem[];
  generalReminders: GeneralReminder[];
}

export type ViewFilter = 'all' | 'today' | 'upcoming' | 'reminders' | 'completed';

export interface ActiveAlert {
  id: string;
  type: 'todo' | 'general';
  itemId: string;
  title: string;
  description?: string;
  priority?: Priority;
  targetHour: string;
  timestamp: number;
}
