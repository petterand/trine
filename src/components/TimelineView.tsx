import React from 'react';
import { useApp } from '../context/AppContext';
import { Clock, Bell, Sparkles, CheckCircle2 } from 'lucide-react';

export const TimelineView: React.FC = () => {
  const { appData, toggleTodoComplete } = useApp();

  const currentHour = new Date().getHours();
  const currentMinutes = new Date().getMinutes();
  const currentFormattedTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;

  // Hours array from 06:00 to 23:00
  const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6 to 23

  // Map reminders to hour slots
  const getItemsForHour = (hourNum: number) => {
    const hourPrefix = `${String(hourNum).padStart(2, '0')}:`;

    // 1. Todos with reminders matching this hour
    const matchingTodos = appData.todos.filter((todo) => {
      if (!todo.reminder || !todo.reminder.enabled) return false;
      const r = todo.reminder;

      if (r.type === 'specific_hours') {
        return r.specificHours.some((h) => h.startsWith(hourPrefix) || parseInt(h.split(':')[0], 10) === hourNum);
      } else if (r.type === 'interval_hours' && r.intervalHours) {
        const startH = r.intervalStartHour ? parseInt(r.intervalStartHour.split(':')[0], 10) : 8;
        const endH = r.intervalEndHour ? parseInt(r.intervalEndHour.split(':')[0], 10) : 20;
        if (hourNum >= startH && hourNum <= endH) {
          return (hourNum - startH) % r.intervalHours === 0;
        }
      }
      return false;
    });

    // 2. General routines matching this hour
    const matchingRoutines = appData.generalReminders.filter((routine) => {
      if (!routine.enabled || !routine.config || !routine.config.enabled) return false;
      const r = routine.config;

      if (r.type === 'specific_hours') {
        return r.specificHours.some((h) => h.startsWith(hourPrefix) || parseInt(h.split(':')[0], 10) === hourNum);
      } else if (r.type === 'interval_hours' && r.intervalHours) {
        const startH = r.intervalStartHour ? parseInt(r.intervalStartHour.split(':')[0], 10) : 8;
        const endH = r.intervalEndHour ? parseInt(r.intervalEndHour.split(':')[0], 10) : 20;
        if (hourNum >= startH && hourNum <= endH) {
          return (hourNum - startH) % r.intervalHours === 0;
        }
      }
      return false;
    });

    return { todos: matchingTodos, routines: matchingRoutines };
  };

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="mb-6 p-4 rounded-xl bg-blue-50/80 border border-blue-200 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-600 text-white shadow-sm">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 font-heading">
              Daily 24-Hour Reminder Timeline
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Current local time: <span className="font-mono text-blue-700 font-semibold">{currentFormattedTime}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Hour Slots */}
      <div className="space-y-4">
        {hours.map((hourNum) => {
          const isCurrent = hourNum === currentHour;
          const hourLabel = `${String(hourNum).padStart(2, '0')}:00`;
          const { todos, routines } = getItemsForHour(hourNum);
          const totalItems = todos.length + routines.length;

          return (
            <div
              key={hourNum}
              className={`timeline-hour-slot ${isCurrent ? 'is-current-hour' : ''}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className={`font-mono text-xs font-semibold ${
                  isCurrent ? 'text-blue-600' : 'text-slate-500'
                }`}>
                  {hourLabel}
                </span>
                {isCurrent && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-600 text-white font-mono shadow-sm">
                    Current Hour
                  </span>
                )}
                <span className="text-xs text-slate-300">·</span>
                <span className="text-xs text-slate-500 font-mono-numbers">
                  {totalItems === 0 ? 'No reminders' : `${totalItems} active ${totalItems === 1 ? 'alert' : 'alerts'}`}
                </span>
              </div>

              {/* Items Container */}
              {totalItems > 0 && (
                <div className="space-y-2 mt-2">
                  {/* Routines */}
                  {routines.map((routine) => (
                    <div
                      key={routine.id}
                      className="p-3 rounded-lg bg-white border border-amber-200 flex items-center justify-between gap-3 text-xs shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="font-semibold text-slate-800">{routine.title}</span>
                        <span className="text-[10px] text-slate-500 font-mono">(Routine Alarm)</span>
                      </div>
                      <span className="text-[11px] text-amber-700 font-mono font-medium">
                        {routine.config.type === 'specific_hours' ? 'Set Time' : `Every ${routine.config.intervalHours}h`}
                      </span>
                    </div>
                  ))}

                  {/* Tasks */}
                  {todos.map((todo) => (
                    <div
                      key={todo.id}
                      className={`p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs shadow-sm transition-opacity ${
                        todo.completed ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Bell className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className={`font-semibold text-slate-800 ${todo.completed ? 'line-through text-slate-400' : ''}`}>
                          {todo.title}
                        </span>
                        <span className={`priority-tag ${todo.priority}`}>
                          {todo.priority}
                        </span>
                      </div>

                      <button
                        onClick={() => toggleTodoComplete(todo.id)}
                        className="text-[11px] text-slate-500 hover:text-emerald-600 flex items-center gap-1 transition-colors font-medium"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{todo.completed ? 'Completed' : 'Mark Done'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
