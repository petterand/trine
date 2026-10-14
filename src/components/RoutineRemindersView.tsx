import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GeneralReminder, Priority, DayOfWeek } from '../types';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Bell,
  ToggleLeft,
  ToggleRight,
  X
} from 'lucide-react';

const COMMON_HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00'
];

const ALL_DAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const RoutineRemindersView: React.FC = () => {
  const {
    appData,
    toggleGeneralReminder,
    deleteGeneralReminder,
    addGeneralReminder,
    updateGeneralReminder
  } = useApp();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [reminderType, setReminderType] = useState<'specific_hours' | 'interval_hours'>('specific_hours');
  const [specificHours, setSpecificHours] = useState<string[]>(['09:00', '14:00']);
  const [customHourInput, setCustomHourInput] = useState('');
  const [intervalHours, setIntervalHours] = useState<number>(2);
  const [intervalStartHour, setIntervalStartHour] = useState('08:00');
  const [intervalEndHour, setIntervalEndHour] = useState('20:00');
  const [repeatDays, setRepeatDays] = useState<DayOfWeek[]>(['mon', 'tue', 'wed', 'thu', 'fri']);

  const openNewRoutine = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setPriority('medium');
    setReminderType('specific_hours');
    setSpecificHours(['09:00', '14:00']);
    setRepeatDays(['mon', 'tue', 'wed', 'thu', 'fri']);
    setIsEditorOpen(true);
  };

  const openEditRoutine = (item: GeneralReminder) => {
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description || '');
    setPriority(item.priority || 'medium');
    setReminderType(item.config.type);
    setSpecificHours(item.config.specificHours || ['09:00']);
    setIntervalHours(item.config.intervalHours || 2);
    setIntervalStartHour(item.config.intervalStartHour || '08:00');
    setIntervalEndHour(item.config.intervalEndHour || '20:00');
    setRepeatDays(item.config.repeatDays || ALL_DAYS);
    setIsEditorOpen(true);
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const config = {
      enabled: true,
      type: reminderType,
      specificHours: reminderType === 'specific_hours' ? specificHours : [],
      intervalHours: reminderType === 'interval_hours' ? intervalHours : undefined,
      intervalStartHour: reminderType === 'interval_hours' ? intervalStartHour : undefined,
      intervalEndHour: reminderType === 'interval_hours' ? intervalEndHour : undefined,
      repeatDays: repeatDays.length > 0 ? repeatDays : ALL_DAYS
    };

    if (editingId) {
      updateGeneralReminder(editingId, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        config
      });
    } else {
      addGeneralReminder({
        title: title.trim(),
        description: description.trim() || undefined,
        enabled: true,
        priority,
        tags: ['Routine'],
        config
      });
    }

    setIsEditorOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Intro Header */}
      <div className="mb-6 p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-amber-900 font-heading flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>General Routine Alarms</span>
          </h2>
          <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
            These are stand-alone recurring reminders not tied to a specific checklist item. Use them for daily routine check-ins, hydration, posture resets, or hourly team cadence notifications.
          </p>
        </div>
        <button
          onClick={openNewRoutine}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-all shrink-0 inline-flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Routine Alarm</span>
        </button>
      </div>

      {/* Routine Cards Grid */}
      <div className="space-y-3">
        {appData.generalReminders.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white border border-dashed border-slate-200 rounded-xl shadow-sm">
            <Bell className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800 font-heading">No routine alarms configured</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-3">
              Add recurring hourly routines like "Hydrate", "Standup Check", or "Evening Review".
            </p>
            <button
              onClick={openNewRoutine}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm"
            >
              Add First Routine
            </button>
          </div>
        ) : (
          appData.generalReminders.map((routine) => {
            const isEnabled = routine.enabled;
            const r = routine.config;

            return (
              <div
                key={routine.id}
                className={`p-4 rounded-xl border transition-all ${
                  isEnabled
                    ? 'bg-white border-slate-200 shadow-sm'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Toggle Button */}
                    <button
                      type="button"
                      onClick={() => toggleGeneralReminder(routine.id)}
                      className="mt-0.5 text-slate-400 hover:text-slate-600 transition-colors"
                      title={isEnabled ? 'Click to disable' : 'Click to enable'}
                    >
                      {isEnabled ? (
                        <ToggleRight className="w-6 h-6 text-blue-600" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-slate-300" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900 font-heading">
                          {routine.title}
                        </span>
                        {routine.priority && (
                          <span className={`priority-tag ${routine.priority}`}>
                            {routine.priority}
                          </span>
                        )}
                        <span className="text-[11px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-mono font-medium">
                          {r.type === 'specific_hours'
                            ? `At ${r.specificHours?.join(', ') || 'Any hour'}`
                            : `Every ${r.intervalHours}h (${r.intervalStartHour} - ${r.intervalEndHour})`}
                        </span>
                      </div>

                      {routine.description && (
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {routine.description}
                        </p>
                      )}

                      {/* Repeat Days */}
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-500 font-mono uppercase font-medium">
                        <span>Repeats:</span>
                        <span>{r.repeatDays?.join(' · ') || 'Every day'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openEditRoutine(routine)}
                      className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                      title="Edit Routine"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteGeneralReminder(routine.id)}
                      className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete Routine"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Routine Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="chronos-glass-modal w-full max-w-xl bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  {editingId ? 'Edit Routine Alarm' : 'Create Routine Alarm'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Routine Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 5-Minute Stretch & Posture Reset"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Description / Instructions
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Step away from screen, drink water, do shoulder rolls"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Recurring Schedule Type */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-4 text-xs font-medium text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="routineType"
                      checked={reminderType === 'specific_hours'}
                      onChange={() => setReminderType('specific_hours')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Specific Hours of Day</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="routineType"
                      checked={reminderType === 'interval_hours'}
                      onChange={() => setReminderType('interval_hours')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Hourly Cadence (Every N Hours)</span>
                  </label>
                </div>

                {reminderType === 'specific_hours' ? (
                  <div>
                    <div className="text-[11px] text-slate-600 mb-1.5 font-medium">Pick target hours:</div>
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      {COMMON_HOURS.map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => toggleHour(h)}
                          className={`hour-chip-btn ${specificHours.includes(h) ? 'selected' : ''}`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customHourInput}
                        onChange={(e) => setCustomHourInput(e.target.value)}
                        placeholder="HH:MM (e.g. 17:30)"
                        className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-900 w-32 focus:outline-none focus:border-blue-600"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomHour}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium rounded border border-slate-300 transition-colors"
                      >
                        + Add Time
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1 font-medium">Cadence</label>
                      <select
                        value={intervalHours}
                        onChange={(e) => setIntervalHours(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                      >
                        <option value={1}>Every 1 Hour</option>
                        <option value={2}>Every 2 Hours</option>
                        <option value={3}>Every 3 Hours</option>
                        <option value={4}>Every 4 Hours</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1 font-medium">Start Hour</label>
                      <input
                        type="time"
                        value={intervalStartHour}
                        onChange={(e) => setIntervalStartHour(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1 font-medium">End Hour</label>
                      <input
                        type="time"
                        value={intervalEndHour}
                        onChange={(e) => setIntervalEndHour(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                )}

                {/* Days of week */}
                <div>
                  <div className="text-[11px] text-slate-600 mb-1 font-medium">Active Days</div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {ALL_DAYS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(d)}
                        className={`day-chip-btn ${repeatDays.includes(d) ? 'selected' : ''}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
                >
                  Save Routine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
