import React from 'react';
import { useApp } from '../context/AppContext';
import { Search, Plus, Sparkles, X } from 'lucide-react';

export const TopBar: React.FC = () => {
  const {
    currentFilter,
    selectedTag,
    searchQuery,
    setSearchQuery,
    activeViewTab,
    filteredTodos,
    setIsTaskModalOpen,
    setEditingTodo,
    setIsRoutineModalOpen,
    setEditingRoutine
  } = useApp();

  const getTitle = () => {
    if (activeViewTab === 'routines') return 'Routine Reminders';
    if (activeViewTab === 'timeline') return '24-Hour Schedule Timeline';

    if (selectedTag) return `Tag: #${selectedTag}`;
    switch (currentFilter) {
      case 'today':
        return 'Today’s Tasks';
      case 'upcoming':
        return 'Upcoming Tasks';
      case 'reminders':
        return 'Tasks with Recurring Reminders';
      case 'completed':
        return 'Completed Tasks';
      case 'all':
      default:
        return 'All Tasks';
    }
  };

  const getSubtitle = () => {
    if (activeViewTab === 'routines') {
      return 'Manage general routine alarms and recurring hourly check-ins';
    }
    if (activeViewTab === 'timeline') {
      return 'Real-time schedule of hourly recurring reminders for today';
    }
    return `${filteredTodos.length} ${filteredTodos.length === 1 ? 'task' : 'tasks'} found`;
  };

  return (
    <div className="h-16 px-8 border-b border-slate-200 flex items-center justify-between gap-4 bg-white shrink-0">
      {/* Title & Context */}
      <div>
        <h1 className="text-lg font-bold text-slate-900 font-heading tracking-tight flex items-center gap-2">
          {getTitle()}
        </h1>
        <p className="text-xs text-slate-500 font-mono-numbers">{getSubtitle()}</p>
      </div>

      {/* Middle: Search Bar */}
      <div className="flex-1 max-w-md relative">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, descriptions, or tags... (Ctrl+F)"
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Quick Action CTAs */}
      <div className="flex items-center gap-2">
        {activeViewTab === 'routines' ? (
          <button
            onClick={() => {
              setEditingRoutine(null);
              setIsRoutineModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm shadow-blue-600/20 transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            <span>Add Routine Alarm</span>
          </button>
        ) : (
          <button
            onClick={() => {
              setEditingTodo(null);
              setIsTaskModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-sm shadow-blue-600/20 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        )}
      </div>
    </div>
  );
};
