import React from 'react';
import { useApp } from '../context/AppContext';
import { Settings, X, Volume2, Bell, Clock, HardDrive } from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    appData,
    updateSettings,
    testReminderChime,
    isTauri,
    filePath
  } = useApp();

  if (!isSettingsModalOpen) return null;

  const s = appData.settings;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="chronos-glass-modal w-full max-w-lg bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900 font-heading">
              Application & Reminder Settings
            </h2>
          </div>
          <button
            onClick={() => setIsSettingsModalOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs text-slate-700">
          {/* Notifications Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">System Desktop Notifications</div>
                <div className="text-[11px] text-slate-500">
                  {isTauri ? 'Native OS desktop notification' : 'Browser HTML5 notification alerts'}
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={s.notificationsEnabled}
                onChange={(e) => updateSettings({ notificationsEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>

          {/* Sound & Volume */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Audio Reminder Chimes</div>
                  <div className="text-[11px] text-slate-500">Synthesized Web Audio dual-tone harmonics</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={s.soundEnabled}
                  onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>

            {s.soundEnabled && (
              <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
                <span className="text-[11px] text-slate-600 w-20 font-medium">Volume:</span>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={s.soundVolume}
                  onChange={(e) => updateSettings({ soundVolume: parseFloat(e.target.value) })}
                  className="flex-1 accent-blue-600"
                />
                <span className="font-mono text-[11px] text-slate-600 w-10 text-right font-medium">
                  {Math.round(s.soundVolume * 100)}%
                </span>
                <button
                  type="button"
                  onClick={testReminderChime}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] text-slate-700 font-medium transition-colors"
                >
                  Play
                </button>
              </div>
            )}
          </div>

          {/* Active Hours Window */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Default Active Work Window</div>
                <div className="text-[11px] text-slate-500">Limits recurring intervals to waking hours</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1 font-medium">Start Time</label>
                <input
                  type="time"
                  value={s.activeHoursStart}
                  onChange={(e) => updateSettings({ activeHoursStart: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-1 font-medium">End Time</label>
                <input
                  type="time"
                  value={s.activeHoursEnd}
                  onChange={(e) => updateSettings({ activeHoursEnd: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Storage & Environment Info */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-semibold">
              <HardDrive className="w-4 h-4 text-blue-600" />
              <span>Filesystem Storage Backend</span>
            </div>
            <div className="text-[11px] text-slate-600 font-mono">
              Target: <span className="text-slate-900 font-semibold">{filePath}</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Runtime: <span className="text-blue-700 font-medium">{isTauri ? 'Native Tauri Desktop App' : 'Browser Web Sandbox (with File System Access API & export)'}</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={() => setIsSettingsModalOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
