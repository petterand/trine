import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell, Check, Clock, X, Sparkles } from 'lucide-react';

export const ReminderAlertBanner: React.FC = () => {
  const {
    activeAlerts,
    dismissAlert,
    snoozeAlert,
    completeTodoFromAlert
  } = useApp();

  if (activeAlerts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
      {activeAlerts.map((alert) => {
        const isTodo = alert.type === 'todo';

        return (
          <div
            key={alert.id}
            className="reminder-alert-floating pointer-events-auto bg-white border border-slate-300 rounded-xl p-4 shadow-2xl text-slate-900 flex flex-col gap-2.5"
          >
            {/* Top row: Icon, Category, Dismiss */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  {isTodo ? <Bell className="w-4 h-4 animate-bounce" /> : <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />}
                </div>
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-blue-700">
                  {isTodo ? 'Scheduled Todo Reminder' : 'Routine Daily Alarm'}
                </span>
                <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {alert.targetHour}
                </span>
              </div>

              <button
                onClick={() => dismissAlert(alert.id)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-colors"
                title="Dismiss alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Alert Content */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 font-heading">{alert.title}</h4>
              {alert.description && (
                <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                  {alert.description}
                </p>
              )}
            </div>

            {/* Actions: Mark Done (if todo), Snooze presets, Dismiss */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 mt-1 text-xs">
              {isTodo ? (
                <button
                  onClick={() => completeTodoFromAlert(alert.itemId)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark Complete</span>
                </button>
              ) : (
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Acknowledge</span>
                </button>
              )}

              {/* Snooze Options */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-500 mr-1 flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3" /> Snooze:
                </span>
                <button
                  onClick={() => snoozeAlert(alert.id, 5)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[11px] text-slate-700 font-medium transition-colors"
                >
                  5m
                </button>
                <button
                  onClick={() => snoozeAlert(alert.id, 15)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[11px] text-slate-700 font-medium transition-colors"
                >
                  15m
                </button>
                <button
                  onClick={() => snoozeAlert(alert.id, 60)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[11px] text-slate-700 font-medium transition-colors"
                >
                  1h
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
