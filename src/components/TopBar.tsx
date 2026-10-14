import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  Plus,
  Sparkles,
  X,
  Tag,
  SlidersHorizontal,
  CheckCircle2,
  Calendar,
  Bell,
  ArrowRight
} from 'lucide-react';

export const TopBar: React.FC = () => {
  const {
    appData,
    currentFilter,
    selectedTag,
    setSelectedTag,
    searchQuery,
    setSearchQuery,
    searchScope,
    setSearchScope,
    activeViewTab,
    setActiveViewTab,
    filteredTodos,
    setIsTaskModalOpen,
    setEditingTodo,
    setIsRoutineModalOpen,
    setEditingRoutine,
    allTags
  } = useApp();

  const [isFocused, setIsFocused] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute tag frequencies across todos
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    appData.todos.forEach((t) => {
      t.tags?.forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return counts;
  }, [appData.todos]);

  // Global Keyboard shortcuts: Cmd+K / Ctrl+K / Ctrl+F / "/" to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K');
      const isCmdF = (e.metaKey || e.ctrlKey) && (e.key === 'f' || e.key === 'F');
      const isSlash = e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName);

      if (isCmdK || isCmdF || isSlash) {
        e.preventDefault();
        if (activeViewTab !== 'tasks') {
          setActiveViewTab('tasks');
        }
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        setIsFocused(true);
      } else if (e.key === 'Escape' && isFocused) {
        if (searchQuery) {
          setSearchQuery('');
        } else {
          searchInputRef.current?.blur();
          setIsFocused(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused, searchQuery, setSearchQuery, activeViewTab, setActiveViewTab]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as HTMLElement)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    // When typing a search query, ensure the user is viewing the tasks view so they see real-time results
    if (val.trim() && activeViewTab !== 'tasks') {
      setActiveViewTab('tasks');
    }
  };

  const handleSelectTagQuick = (tag: string) => {
    if (activeViewTab !== 'tasks') {
      setActiveViewTab('tasks');
    }
    // Set search query with # tag prefix for immediate real-time filtering
    setSearchQuery(`#${tag}`);
    setSearchScope('tag');
    searchInputRef.current?.focus();
  };

  const clearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const getTitle = () => {
    if (activeViewTab === 'routines') return 'Routine Reminders';
    if (activeViewTab === 'timeline') return '24-Hour Schedule Timeline';

    if (searchQuery.trim()) {
      return 'Search Results';
    }

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
    if (searchQuery.trim()) {
      const scopeLabel = searchScope === 'title' ? 'in titles' : searchScope === 'tag' ? 'in tags' : 'across all fields';
      return `${filteredTodos.length} ${filteredTodos.length === 1 ? 'task' : 'tasks'} matching "${searchQuery}" (${scopeLabel})`;
    }
    return `${filteredTodos.length} ${filteredTodos.length === 1 ? 'task' : 'tasks'} found`;
  };

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const shortcutKey = isMac ? '⌘K' : 'Ctrl+K';

  // Preview matches for the dropdown when query exists
  const previewMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return filteredTodos.slice(0, 4);
  }, [filteredTodos, searchQuery]);

  return (
    <div className="h-16 px-8 border-b border-slate-200 flex items-center justify-between gap-6 bg-white shrink-0 relative z-20">
      {/* Left: View Title & Live Task Count */}
      <div className="min-w-[190px]">
        <h1 className="text-lg font-bold text-slate-900 font-heading tracking-tight flex items-center gap-2">
          {getTitle()}
        </h1>
        <p className="text-xs text-slate-500 font-mono-numbers">{getSubtitle()}</p>
      </div>

      {/* Middle: Global Real-Time Search Bar */}
      <div className="flex-1 max-w-xl relative" ref={containerRef}>
        <div
          className={`relative flex items-center rounded-xl transition-all duration-150 border bg-slate-50 ${
            isFocused
              ? 'bg-white border-blue-600 ring-3 ring-blue-500/10 shadow-sm'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          {/* Search Icon */}
          <div className="pl-3.5 pr-2 flex items-center pointer-events-none text-slate-400">
            <Search className={`w-4 h-4 transition-colors ${isFocused ? 'text-blue-600' : 'text-slate-400'}`} />
          </div>

          {/* Search Input Field */}
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onFocus={() => {
              setIsFocused(true);
              if (activeViewTab !== 'tasks') {
                setActiveViewTab('tasks');
              }
            }}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search tasks by title, tag (#work), or notes..."
            className="w-full bg-transparent py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
          />

          {/* Scope Selector Badges (All / Title / Tag) */}
          <div className="flex items-center gap-0.5 px-1 py-0.5 mr-1 bg-slate-200/60 rounded-lg p-0.5 text-[10px] font-semibold text-slate-600 select-none">
            <button
              type="button"
              onClick={() => setSearchScope('all')}
              className={`px-1.5 py-0.5 rounded transition-all ${
                searchScope === 'all'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'hover:text-slate-900 text-slate-500'
              }`}
              title="Filter by title, tag, or description"
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setSearchScope('title')}
              className={`px-1.5 py-0.5 rounded transition-all ${
                searchScope === 'title'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'hover:text-slate-900 text-slate-500'
              }`}
              title="Filter strictly by task title"
            >
              Title
            </button>
            <button
              type="button"
              onClick={() => setSearchScope('tag')}
              className={`px-1.5 py-0.5 rounded transition-all ${
                searchScope === 'tag'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'hover:text-slate-900 text-slate-500'
              }`}
              title="Filter strictly by task tags"
            >
              Tag
            </button>
          </div>

          {/* Match Counter Badge or Keyboard Shortcut Hint */}
          <div className="flex items-center gap-1.5 pr-2.5">
            {searchQuery ? (
              <>
                <span
                  className={`text-[11px] font-medium font-mono-numbers px-2 py-0.5 rounded-md ${
                    filteredTodos.length > 0
                      ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                      : 'bg-rose-50 text-rose-600 border border-rose-200/60'
                  }`}
                >
                  {filteredTodos.length} {filteredTodos.length === 1 ? 'match' : 'matches'}
                </span>
                <button
                  type="button"
                  onClick={clearSearch}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Clear search (Esc)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-slate-400 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 font-mono shadow-2xs">
                {shortcutKey}
              </kbd>
            )}
          </div>
        </div>

        {/* Real-time Interactive Search Dropdown & Suggestions */}
        {isFocused && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 text-xs text-slate-700 animate-in fade-in slide-in-from-top-1 duration-150">
            {/* Filter by Tag Section */}
            {allTags.length > 0 && (
              <div className="p-3 border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-blue-600" /> Filter by Tag
                  </span>
                  <span className="text-[10px] text-slate-400">Click to filter</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map((tag) => {
                    const count = tagCounts[tag] || 0;
                    const isActive =
                      searchQuery.toLowerCase().includes(tag.toLowerCase()) || selectedTag === tag;
                    return (
                      <button
                        key={tag}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectTagQuick(tag);
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-700'
                        }`}
                      >
                        <span>#{tag}</span>
                        <span
                          className={`text-[10px] px-1 py-0.2 rounded-full ${
                            isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Live Search Results Preview */}
            {searchQuery.trim() && (
              <div className="p-3 max-h-64 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3 h-3 text-blue-600" />
                    Matching Tasks ({filteredTodos.length})
                  </span>
                  {filteredTodos.length > 4 && (
                    <span className="text-[10px] text-slate-400">Showing top 4 results</span>
                  )}
                </div>

                {filteredTodos.length === 0 ? (
                  <div className="py-4 text-center text-slate-500">
                    <p className="text-xs font-medium text-slate-700">No tasks matched "{searchQuery}"</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Try searching with a tag (#tag) or toggle scope above
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {previewMatches.map((task) => (
                      <div
                        key={task.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setEditingTodo(task);
                          setIsTaskModalOpen(true);
                          setIsFocused(false);
                        }}
                        className="group flex items-center justify-between p-2 rounded-lg hover:bg-blue-50/60 border border-transparent hover:border-blue-100 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <CheckCircle2
                            className={`w-3.5 h-3.5 shrink-0 ${
                              task.completed ? 'text-emerald-500' : 'text-slate-300 group-hover:text-blue-500'
                            }`}
                          />
                          <span
                            className={`truncate text-xs font-medium ${
                              task.completed ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {task.title}
                          </span>
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex items-center gap-1 shrink-0">
                              {task.tags.slice(0, 2).map((t) => (
                                <span
                                  key={t}
                                  className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-medium"
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400 shrink-0 ml-2">
                          {task.reminder?.enabled && (
                            <span className="flex items-center gap-0.5 text-blue-600">
                              <Bell className="w-3 h-3" />
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="flex items-center gap-0.5">
                              <Calendar className="w-3 h-3" />
                              {task.dueDate}
                            </span>
                          )}
                          <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Keyboard Hint Bar */}
            <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-3">
                <span>
                  <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono mr-1">
                    Esc
                  </kbd>
                  to close
                </span>
                <span>
                  <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono mr-1">
                    #tag
                  </kbd>
                  for tag filter
                </span>
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    clearSearch();
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Reset filter
                </button>
              )}
            </div>
          </div>
        )}
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
