import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Priority, DayOfWeek, RecurringReminderConfig } from '../types';
import {
  X,
  Bell,
  Calendar,
  Tag,
  Trash2
} from 'lucide-react';

const COMMON_HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00'
];

const ALL_DAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const TaskModal: React.FC = () => {
  const {
    isTaskModalOpen,
    setIsTaskModalOpen,
    editingTodo,
    addTodo,
    updateTodo,
    allTags
  } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [subtaskTitle, setSubtaskTitle] = useState('');

  // Reminder Configuration
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderType, setReminderType] = useState<'specific_hours' | 'interval_hours'>('specific_hours');
  const [specificHours, setSpecificHours] = useState<string[]>(['09:00', '14:00', '17:00']);
  const [customHourInput, setCustomHourInput] = useState('');
  const [intervalHours, setIntervalHours] = useState<number>(2);
  const [intervalStartHour, setIntervalStartHour] = useState<string>('08:00');
  const [intervalEndHour, setIntervalEndHour] = useState<string>('20:00');
  const [repeatDays, setRepeatDays] = useState<DayOfWeek[]>(['mon', 'tue', 'wed', 'thu', 'fri']);

  useEffect(() => {
    if (editingTodo) {
      setTitle(editingTodo.title);
      setDescription(editingTodo.description || '');
      setPriority(editingTodo.priority);
      setDueDate(editingTodo.dueDate || '');
      setTags(editingTodo.tags || []);
      setSubtasks(editingTodo.subtasks || []);

      if (editingTodo.reminder) {
        setReminderEnabled(editingTodo.reminder.enabled);
        setReminderType(editingTodo.reminder.type);
        setSpecificHours(editingTodo.reminder.specificHours || ['09:00']);
        setIntervalHours(editingTodo.reminder.intervalHours || 2);
        setIntervalStartHour(editingTodo.reminder.intervalStartHour || '08:00');
        setIntervalEndHour(editingTodo.reminder.intervalEndHour || '20:00');
        setRepeatDays(editingTodo.reminder.repeatDays || ALL_DAYS);
      } else {
        setReminderEnabled(false);
        setReminderType('specific_hours');
        setSpecificHours(['09:00', '14:00', '17:00']);
        setRepeatDays(['mon', 'tue', 'wed', 'thu', 'fri']);
      }
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setTags(['Work']);
      setSubtasks([]);
      setReminderEnabled(false);
      setReminderType('specific_hours');
      setSpecificHours(['09:00', '14:00', '17:00']);
      setRepeatDays(['mon', 'tue', 'wed', 'thu', 'fri']);
    }
  }, [editingTodo, isTaskModalOpen]);

  if (!isTaskModalOpen) return null;

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((item) => item !== t));
  };

  const handleAddSubtask = () => {
    if (subtaskTitle.trim()) {
      setSubtasks([
        ...subtasks,
        {
          id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: subtaskTitle.trim(),
          completed: false
        }
      ]);
      setSubtaskTitle('');
    }
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const toggleHour = (hour: string) => {
    if (specificHours.includes(hour)) {
      setSpecificHours(specificHours.filter((h) => h !== hour));
    } else {
      setSpecificHours([...specificHours, hour].sort());
    }
  };

  const handleAddCustomHour = () => {
    if (/^\d{1,2}:\d{2}$/.test(customHourInput.trim())) {
      const parts = customHourInput.trim().split(':');
      const formatted = `${parts[0].padStart(2, '0')}:${parts[1]}`;
      if (!specificHours.includes(formatted)) {
        setSpecificHours([...specificHours, formatted].sort());
      }
      setCustomHourInput('');
    }
  };

  const toggleDay = (day: DayOfWeek) => {
    if (repeatDays.includes(day)) {
      setRepeatDays(repeatDays.filter((d) => d !== day));
    } else {
      setRepeatDays([...repeatDays, day]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let reminderConfig: RecurringReminderConfig | undefined = undefined;
    if (reminderEnabled) {
      reminderConfig = {
        enabled: true,
        type: reminderType,
        specificHours: reminderType === 'specific_hours' ? specificHours : [],
        intervalHours: reminderType === 'interval_hours' ? intervalHours : undefined,
        intervalStartHour: reminderType === 'interval_hours' ? intervalStartHour : undefined,
        intervalEndHour: reminderType === 'interval_hours' ? intervalEndHour : undefined,
        repeatDays: repeatDays.length > 0 ? repeatDays : ALL_DAYS
      };
    }

    if (editingTodo) {
      updateTodo(editingTodo.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate || undefined,
        tags,
        subtasks,
        reminder: reminderConfig
      });
    } else {
      addTodo({
        title: title.trim(),
        description: description.trim() || undefined,
        completed: false,
        priority,
        dueDate: dueDate || undefined,
        tags,
        subtasks,
        reminder: reminderConfig
      });
    }

    setIsTaskModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="chronos-glass-modal w-full max-w-2xl max-h-[90vh] flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h2 className="text-base font-bold text-slate-900 font-heading">
              {editingTodo ? 'Edit Task' : 'Create New Task'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsTaskModalOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* Title Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-heading">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Conduct weekly team sync or write unit tests"
              className="w-full bg-white border border-slate-200 focus:border-blue-600 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-heading">
              Notes & Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes, context, or links..."
              className="w-full bg-white border border-slate-200 focus:border-blue-600 rounded-lg px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-colors leading-relaxed"
            />
          </div>

          {/* Row: Priority & Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-heading">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-white border border-slate-200 focus:border-blue-600 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none font-medium"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent (Immediate attention)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-heading flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Due Date</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-blue-600 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-heading flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-600" />
              <span>Tags</span>
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag and press Enter..."
                className="flex-1 bg-white border border-slate-200 focus:border-blue-600 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors border border-slate-200"
              >
                Add Tag
              </button>
            </div>

            {/* Tag suggestions from existing */}
            {allTags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                <span className="text-[10px] text-slate-500">Suggested:</span>
                {allTags.map((at) => (
                  <button
                    key={at}
                    type="button"
                    onClick={() => {
                      if (!tags.includes(at)) setTags([...tags, at]);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-medium"
                  >
                    +{at}
                  </button>
                ))}
              </div>
            )}

            {/* Selected Tags */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="text-blue-500 hover:text-blue-800 ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Subtasks Section */}
          <div className="pt-2 border-t border-slate-200">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-heading">
              Subtasks / Checklist ({subtasks.length})
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={subtaskTitle}
                onChange={(e) => setSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Add a step or subtask..."
                className="flex-1 bg-white border border-slate-200 focus:border-blue-600 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors border border-slate-200"
              >
                Add Subtask
              </button>
            </div>

            {subtasks.length > 0 && (
              <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {subtasks.map((st) => (
                  <div key={st.id} className="flex items-center justify-between text-xs text-slate-700">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      <span>{st.title}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="text-slate-400 hover:text-rose-600 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recurring Hourly Reminders Engine Configuration */}
          <div className="pt-4 border-t border-slate-200 bg-blue-50/50 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-slate-900 font-heading">
                  Recurring Hourly Reminders
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>

            {reminderEnabled && (
              <div className="space-y-4 pt-2">
                {/* Type Selection */}
                <div className="flex items-center gap-4 text-xs font-medium text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="reminderType"
                      checked={reminderType === 'specific_hours'}
                      onChange={() => setReminderType('specific_hours')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Specific Hours of the Day</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="reminderType"
                      checked={reminderType === 'interval_hours'}
                      onChange={() => setReminderType('interval_hours')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Repeating Hourly Cadence</span>
                  </label>
                </div>

                {/* Option 1: Specific Hours Grid */}
                {reminderType === 'specific_hours' && (
                  <div>
                    <div className="text-xs text-slate-600 mb-2 font-medium">
                      Select specific hours to trigger alerts (or type custom time e.g. 14:30):
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap mb-3">
                      {COMMON_HOURS.map((h) => {
                        const isSelected = specificHours.includes(h);
                        return (
                          <button
                            key={h}
                            type="button"
                            onClick={() => toggleHour(h)}
                            className={`hour-chip-btn ${isSelected ? 'selected' : ''}`}
                          >
                            {h}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Hour Add */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customHourInput}
                        onChange={(e) => setCustomHourInput(e.target.value)}
                        placeholder="HH:MM (e.g. 16:45)"
                        className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-900 placeholder-slate-400 w-32 focus:outline-none focus:border-blue-600 font-mono-numbers"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomHour}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium rounded border border-slate-300 transition-colors"
                      >
                        + Add Time
                      </button>

                      {specificHours.length > 0 && (
                        <span className="text-[11px] text-blue-700 ml-auto font-mono-numbers font-medium">
                          {specificHours.length} alert times active
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Option 2: Interval Hours */}
                {reminderType === 'interval_hours' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1 font-medium">Repeat Every</label>
                      <select
                        value={intervalHours}
                        onChange={(e) => setIntervalHours(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                      >
                        <option value={1}>Every 1 Hour</option>
                        <option value={2}>Every 2 Hours</option>
                        <option value={3}>Every 3 Hours</option>
                        <option value={4}>Every 4 Hours</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1 font-medium">Active Window Start</label>
                      <input
                        type="time"
                        value={intervalStartHour}
                        onChange={(e) => setIntervalStartHour(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono-numbers"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1 font-medium">Active Window End</label>
                      <input
                        type="time"
                        value={intervalEndHour}
                        onChange={(e) => setIntervalEndHour(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono-numbers"
                      />
                    </div>
                  </div>
                )}

                {/* Days of Week Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-slate-600 font-semibold uppercase">Repeat Days</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRepeatDays(ALL_DAYS)}
                        className="text-[10px] text-blue-600 hover:underline font-medium"
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => setRepeatDays(['mon', 'tue', 'wed', 'thu', 'fri'])}
                        className="text-[10px] text-blue-600 hover:underline font-medium"
                      >
                        Weekdays
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {ALL_DAYS.map((day) => {
                      const isSelected = repeatDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`day-chip-btn ${isSelected ? 'selected' : ''}`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsTaskModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              {editingTodo ? 'Save Task Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
