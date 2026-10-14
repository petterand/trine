import React from 'react';
import { useApp } from '../context/AppContext';
import { HardDrive, CheckCircle2, RefreshCw, Bell, Volume2, VolumeX } from 'lucide-react';
import { AppIconBadge } from './AppIconBadge';

export const DesktopWindowBar: React.FC = () => {
  const {
    isTauri,
    filePath,
    isSaving,
    lastSavedAt,
    forceSave,
    appData,
    updateSettings,
    testReminderChime
  } = useApp();

  return (
    <header className="h-[44px] bg-white border-b border-slate-200 flex items-center justify-between px-4 select-none z-30 shrink-0">
      {/* Left: Desktop Window Controls & App Mark */}
      <div className="flex items-center gap-3">
        {/* Native desktop window mock dots */}
        <div className="flex items-center gap-1.5 mr-2">
          <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/40 inline-block" />
          <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/40 inline-block" />
          <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]/40 inline-block" />
        </div>

        <div className="flex items-center gap-2">
          <AppIconBadge size="sm" />
          <span className="text-sm font-bold tracking-tight text-slate-900 font-heading">
            Trine
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono font-medium">
            {isTauri ? 'TAURI DESKTOP' : 'TAURI FS READY'}
          </span>
        </div>
      </div>

      {/* Middle: File Status & Path Display */}
      <div className="flex items-center gap-2 max-w-md truncate text-xs text-slate-500">
        <HardDrive className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span className="text-slate-600 truncate font-mono text-[11px]" title={filePath}>
          {filePath}
        </span>
        <span className="text-slate-300">·</span>
        {isSaving ? (
          <span className="flex items-center gap-1 text-[11px] text-amber-600 font-mono">
            <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-mono">
            <CheckCircle2 className="w-3 h-3" /> Saved {lastSavedAt || 'locally'}
          </span>
        )}
      </div>

      {/* Right: Quick Controls & Actions */}
      <div className="flex items-center gap-2">
        {/* Audio Toggle */}
        <button
          onClick={() => updateSettings({ soundEnabled: !appData.settings.soundEnabled })}
          className={`p-1.5 rounded-md hover:bg-slate-100 transition-colors ${
            appData.settings.soundEnabled ? 'text-blue-600' : 'text-slate-400'
          }`}
          title={appData.settings.soundEnabled ? 'Sound alerts enabled (Click to mute)' : 'Sound alerts muted'}
        >
          {appData.settings.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        {/* Test Chime Alert */}
        <button
          onClick={testReminderChime}
          className="text-[11px] text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center gap-1.5 font-medium"
          title="Trigger a preview reminder sound and notification"
        >
          <Bell className="w-3 h-3 text-blue-600" />
          <span>Test Reminder</span>
        </button>

        {/* Force Save */}
        <button
          onClick={() => forceSave()}
          className="text-[11px] text-white px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 transition-colors font-medium shadow-sm"
          title="Save to local JSON file now"
        >
          Save Now
        </button>
      </div>
    </header>
  );
};
