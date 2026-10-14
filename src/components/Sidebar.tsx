import React from 'react';
import { useApp } from '../context/AppContext';
import { ViewFilter } from '../types';
import {
  CheckSquare,
  Calendar,
  Clock,
  Bell,
  Archive,
  Tag,
  FolderOpen,
  Download,
  Code2,
  Settings,
  Sparkles,
  Layers,
  Plus
} from 'lucide-react';
import { AppIconBadge } from './AppIconBadge';

export const Sidebar: React.FC = () => {
  const {
    appData,
    currentFilter,
    setCurrentFilter,
    selectedTag,
    setSelectedTag,
    activeViewTab,
    setActiveViewTab,
    openJsonFile,
    exportDataFile,
    setIsRawJsonModalOpen,
    setIsSettingsModalOpen,
    setIsTaskModalOpen,
    setEditingTodo,
    allTags
  } = useApp();

  // Counts
  const todayStr = new Date().toISOString().split('T')[0];
  const allCount = appData.todos.filter((t) => !t.completed).length;
  const todayCount = appData.todos.filter((t) => t.dueDate === todayStr && !t.completed).length;
  const upcomingCount = appData.todos.filter((t) => t.dueDate && t.dueDate > todayStr && !t.completed).length;
  const remindersCount = appData.todos.filter((t) => t.reminder?.enabled && !t.completed).length;
  const completedCount = appData.todos.filter((t) => t.completed).length;
  const routinesCount = appData.generalReminders.filter((r) => r.enabled).length;

  const handleNavFilter = (filter: ViewFilter) => {
    setActiveViewTab('tasks');
    setCurrentFilter(filter);
  };

  return (
    <aside className="chronos-sidebar flex flex-col justify-between py-3 bg-white border-r border-slate-200">
      {/* Top Section: View Switcher & Task Navigation */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* App Branding & Icon */}
        <div className="px-3.5 pt-1 pb-3 mb-2.5 flex items-center gap-3 border-b border-slate-100">
          <AppIconBadge size="md" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight text-slate-900 font-heading leading-tight">
                Trine
              </span>
              <span className="text-[10px] px-1 rounded bg-blue-50 text-blue-700 font-mono font-semibold border border-blue-200/60">
                T·3
              </span>
            </div>
            <div className="text-[10.5px] text-slate-500 truncate leading-tight mt-0.5">
              Todo & Recurring Alarms
            </div>
          </div>
        </div>

        {/* Action Button: Create Task */}
        <div className="px-3 mb-3">
          <button
            onClick={() => {
              setEditingTodo(null);
              setIsTaskModalOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm shadow-blue-600/20 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>

        {/* View Mode Switcher */}
        <div className="px-3 mb-3">
          <div className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 px-2 mb-1.5 font-heading">
            Workspace Views
          </div>
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => setActiveViewTab('tasks')}
              className={`nav-item w-full ${activeViewTab === 'tasks' ? 'active' : ''}`}
            >
              <span className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Task Board</span>
              </span>
              <span className="badge">{allCount}</span>
            </button>

            <button
              onClick={() => setActiveViewTab('routines')}
              className={`nav-item w-full ${activeViewTab === 'routines' ? 'active' : ''}`}
            >
              <span className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Routine Alarms</span>
              </span>
              <span className="badge">{routinesCount}</span>
            </button>

            <button
              onClick={() => setActiveViewTab('timeline')}
              className={`nav-item w-full ${activeViewTab === 'timeline' ? 'active' : ''}`}
            >
              <span className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>24h Timeline</span>
              </span>
            </button>
          </div>
        </div>

        {/* Filter Navigation (Active when on Tasks view) */}
        {activeViewTab === 'tasks' && (
          <div className="px-3 mb-4">
            <div className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 px-2 mb-1.5 font-heading">
              Task Filters
            </div>
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => handleNavFilter('all')}
                className={`nav-item ${currentFilter === 'all' && !selectedTag ? 'active' : ''}`}
              >
                <span className="flex items-center gap-2.5">
                  <CheckSquare className="w-4 h-4 text-slate-600" />
                  <span>All Tasks</span>
                </span>
                <span className="badge">{allCount}</span>
              </button>

              <button
                onClick={() => handleNavFilter('today')}
                className={`nav-item ${currentFilter === 'today' ? 'active' : ''}`}
              >
                <span className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  <span>Today</span>
                </span>
                <span className="badge">{todayCount}</span>
              </button>

              <button
                onClick={() => handleNavFilter('upcoming')}
                className={`nav-item ${currentFilter === 'upcoming' ? 'active' : ''}`}
              >
                <span className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>Upcoming</span>
                </span>
                <span className="badge">{upcomingCount}</span>
              </button>

              <button
                onClick={() => handleNavFilter('reminders')}
                className={`nav-item ${currentFilter === 'reminders' ? 'active' : ''}`}
              >
                <span className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <span>With Reminders</span>
                </span>
                <span className="badge">{remindersCount}</span>
              </button>

              <button
                onClick={() => handleNavFilter('completed')}
                className={`nav-item ${currentFilter === 'completed' ? 'active' : ''}`}
              >
                <span className="flex items-center gap-2.5">
                  <Archive className="w-4 h-4 text-slate-400" />
                  <span>Completed</span>
                </span>
                <span className="badge">{completedCount}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tags Section */}
        {allTags.length > 0 && (
          <div className="px-3 mb-4">
            <div className="flex items-center justify-between px-2 mb-1.5">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 font-heading">
                Tags
              </span>
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag(null)}
                  className="text-[10px] text-blue-600 hover:underline font-medium"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              {allTags.map((tag) => {
                const count = appData.todos.filter((t) => t.tags?.includes(tag) && !t.completed).length;
                const isSelected = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      setActiveViewTab('tasks');
                      setSelectedTag(isSelected ? null : tag);
                    }}
                    className={`nav-item ${isSelected ? 'active' : ''}`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{tag}</span>
                    </span>
                    <span className="badge">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: Local JSON File System & App Tools */}
      <div className="pt-2 px-3 border-t border-slate-200 shrink-0">
        <div className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 px-2 mb-1.5 font-heading">
          Local JSON Storage
        </div>

        <div className="grid grid-cols-2 gap-1.5 mb-2">
          <button
            onClick={() => openJsonFile()}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-medium transition-colors"
            title="Open an existing local JSON file from your machine"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">Open File</span>
          </button>

          <button
            onClick={() => exportDataFile()}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-medium transition-colors"
            title="Export / Save As JSON file to disk"
          >
            <Download className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">Export</span>
          </button>
        </div>

        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => setIsRawJsonModalOpen(true)}
            className="nav-item m-0 py-1.5 text-xs text-slate-600 hover:text-slate-900"
          >
            <span className="flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Raw JSON Inspector</span>
            </span>
          </button>

          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="nav-item m-0 py-1.5 text-xs text-slate-600 hover:text-slate-900"
          >
            <span className="flex items-center gap-2">
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>Reminder Settings</span>
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};
