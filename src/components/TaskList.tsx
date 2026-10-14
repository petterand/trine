import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Priority } from '../types';
import {
  Check,
  Calendar,
  MoreVertical,
  Edit2,
  Copy,
  Trash2,
  ChevronDown,
  ChevronRight,
  Plus,
  Bell,
  CheckCircle2,
  Search,
  X,
  Tag
} from 'lucide-react';

const HighlightMatch: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query || !query.trim()) return <>{text}</>;
  const cleanQ = query.trim().replace(/^#+/, '').replace(/^(tag|tags|title):/, '').trim();
  if (!cleanQ) return <>{text}</>;

  try {
    const parts = text.split(new RegExp(`(${cleanQ.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === cleanQ.toLowerCase() ? (
            <mark key={i} className="bg-amber-200/90 text-amber-950 px-1 py-0.5 rounded text-inherit font-inherit">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  } catch {
    return <>{text}</>;
  }
};

export const TaskList: React.FC = () => {
  const {
    filteredTodos,
    toggleTodoComplete,
    deleteTodo,
    duplicateTodo,
    setEditingTodo,
    setIsTaskModalOpen,
    toggleSubTask,
    addSubTask,
    deleteSubTask,
    addTodo,
    currentFilter,
    selectedTag,
    searchQuery,
    setSearchQuery,
    searchScope,
    setSearchScope
  } = useApp();

  // Quick Add State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<Priority>('medium');
  const [expandedSubtasks, setExpandedSubtasks] = useState<Record<string, boolean>>({});
  const [newSubtaskInputs, setNewSubtaskInputs] = useState<Record<string, string>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Close actions menu when clicking outside
  useEffect(() => {
    if (!openMenuId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.action-menu-container')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    addTodo({
      title: quickTitle.trim(),
      completed: false,
      priority: quickPriority,
      tags: selectedTag ? [selectedTag] : ['Personal'],
      dueDate: currentFilter === 'today' ? new Date().toISOString().split('T')[0] : undefined,
      subtasks: []
    });

    setQuickTitle('');
  };

  const toggleSubtaskExpand = (id: string) => {
    setExpandedSubtasks((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleAddSubtask = (todoId: string) => {
    const title = newSubtaskInputs[todoId];
    if (title && title.trim()) {
      addSubTask(todoId, title.trim());
      setNewSubtaskInputs((prev) => ({ ...prev, [todoId]: '' }));
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Quick Add Bar */}
      <form onSubmit={handleQuickAdd} className="mb-6">
        <div className="bg-white border border-slate-200 hover:border-slate-300 focus-within:border-blue-600 rounded-xl p-2 pl-4 flex items-center gap-3 transition-colors shadow-sm">
          <Plus className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Quick add a new task and press Enter..."
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />

          {/* Quick Priority Selector */}
          <select
            value={quickPriority}
            onChange={(e) => setQuickPriority(e.target.value as Priority)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-blue-600 font-medium"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <button
            type="submit"
            disabled={!quickTitle.trim()}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-all shadow-sm"
          >
            Add Task
          </button>
        </div>
      </form>

      {/* Active Search & Filter Indicator */}
      {searchQuery.trim() && (
        <div className="mb-4 px-3.5 py-2.5 bg-blue-50/70 border border-blue-200/70 rounded-xl flex items-center justify-between text-xs text-blue-900 shadow-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <Search className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              Real-time search {searchScope === 'tag' ? 'in tags' : searchScope === 'title' ? 'in titles' : 'across tasks'}:{' '}
              <strong className="font-semibold text-blue-950 bg-blue-100/70 px-1.5 py-0.5 rounded">
                "{searchQuery}"
              </strong>
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-200/70 text-blue-800 font-bold font-mono-numbers">
              {filteredTodos.length} {filteredTodos.length === 1 ? 'task found' : 'tasks found'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-blue-700 hover:text-blue-900 font-semibold hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filter</span>
            </button>
          </div>
        </div>
      )}

      {/* Task Rows */}
      {filteredTodos.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white border border-dashed border-slate-200 rounded-2xl shadow-sm">
          {searchQuery.trim() ? (
            <>
              <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800 font-heading">
                No tasks matching "{searchQuery}"
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                {searchScope === 'tag'
                  ? `No tasks have tags containing "${searchQuery}". Try selecting another tag or switching to All.`
                  : searchScope === 'title'
                  ? `No task titles contain "${searchQuery}". Try searching tags or descriptions.`
                  : `Check your spelling, try another keyword, or clear your search filter.`}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchScope('all');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-2xs"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear Search Filter</span>
              </button>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800 font-heading">No tasks found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                {currentFilter === 'completed'
                  ? 'Completed tasks will be archived and shown here.'
                  : 'Add your first task above, configure recurring reminders, and save locally.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingTodo(null);
                  setIsTaskModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Task</span>
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTodos.map((todo) => {
            const isCompleted = todo.completed;
            const hasReminder = todo.reminder?.enabled;
            const subtaskCount = todo.subtasks?.length || 0;
            const completedSubtasks = todo.subtasks?.filter((s) => s.completed).length || 0;
            const isExpanded = !!expandedSubtasks[todo.id];
            const isMenuOpen = openMenuId === todo.id;

            const isOverdue = todo.dueDate && todo.dueDate < todayStr && !isCompleted;

            return (
              <div
                key={todo.id}
                className={`task-item-row ${isCompleted ? 'completed' : ''} ${isMenuOpen ? 'z-30 shadow-md' : 'z-10'}`}
                style={{ zIndex: isMenuOpen ? 40 : 1 }}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('button, input, select, textarea')) return;
                }}
              >
                {/* Custom Checkbox */}
                <button
                  type="button"
                  onClick={() => toggleTodoComplete(todo.id)}
                  className={`custom-checkbox ${isCompleted ? 'checked' : ''}`}
                  title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                {/* Priority Indicator Dot */}
                <div className={`priority-indicator ${todo.priority}`} title={`Priority: ${todo.priority}`} />

                {/* Main Content Column */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="task-title text-sm font-semibold text-slate-900 font-heading">
                      <HighlightMatch text={todo.title} query={searchQuery} />
                    </span>

                    {/* Priority Badge */}
                    <span className={`priority-tag ${todo.priority}`}>
                      {todo.priority}
                    </span>

                    {/* Recurring Hour Reminder Badge */}
                    {hasReminder && todo.reminder && (
                      <span className="recurring-hour-badge" title="Recurring Hourly Reminder">
                        <Bell className="w-3 h-3 text-blue-600" />
                        {todo.reminder.type === 'specific_hours' ? (
                          <span>
                            {todo.reminder.specificHours.length > 0
                              ? todo.reminder.specificHours.join(', ')
                              : 'Daily Alert'}
                          </span>
                        ) : (
                          <span>
                            Every {todo.reminder.intervalHours || 1}h ({todo.reminder.intervalStartHour || '08:00'} - {todo.reminder.intervalEndHour || '20:00'})
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {todo.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 mb-2 leading-relaxed">
                      <HighlightMatch text={todo.description} query={searchQuery} />
                    </p>
                  )}

                  {/* Metadata Row: Due Date, Tags, Subtask indicator */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    {/* Due Date */}
                    {todo.dueDate && (
                      <span className={`flex items-center gap-1 font-mono-numbers text-[11px] ${
                        isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-500'
                      }`}>
                        <Calendar className="w-3 h-3" />
                        {todo.dueDate} {isOverdue && '(Overdue)'}
                      </span>
                    )}

                    {/* Tags */}
                    {todo.tags && todo.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {todo.tags.map((tag) => {
                          const cleanQuery = searchQuery.trim().toLowerCase().replace(/^#+/, '').replace(/^(tag|tags):/, '');
                          const isTagMatch = cleanQuery && tag.toLowerCase().includes(cleanQuery);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSearchQuery(`#${tag}`);
                                setSearchScope('tag');
                              }}
                              className={`text-[11px] px-2 py-0.5 rounded font-medium border transition-all cursor-pointer ${
                                isTagMatch
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 hover:border-slate-300'
                              }`}
                              title={`Filter by tag #${tag}`}
                            >
                              #<HighlightMatch text={tag} query={searchQuery} />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Subtasks Count & Toggle */}
                    {subtaskCount > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleSubtaskExpand(todo.id)}
                        className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition-colors font-medium"
                      >
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        <span className="font-mono-numbers">
                          {completedSubtasks}/{subtaskCount} Subtasks
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Subtask Progress Bar */}
                  {subtaskCount > 0 && (
                    <div className="subtask-progress-bar w-48">
                      <div
                        className="fill"
                        style={{ width: `${(completedSubtasks / subtaskCount) * 100}%` }}
                      />
                    </div>
                  )}

                  {/* Expanded Subtasks Checklist */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 pl-2 bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/60">
                      {todo.subtasks.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between gap-2 text-xs">
                          <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
                            <input
                              type="checkbox"
                              checked={sub.completed}
                              onChange={() => toggleSubTask(todo.id, sub.id)}
                              className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className={sub.completed ? 'line-through text-slate-400' : ''}>
                              {sub.title}
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => deleteSubTask(todo.id, sub.id)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 transition-colors"
                            title="Delete subtask"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      {/* Add Subtask Input */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={newSubtaskInputs[todo.id] || ''}
                          onChange={(e) =>
                            setNewSubtaskInputs((prev) => ({ ...prev, [todo.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSubtask(todo.id);
                            }
                          }}
                          placeholder="Add a subtask..."
                          className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSubtask(todo.id)}
                          className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs rounded transition-colors font-medium"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Action Menu */}
                <div className="relative action-menu-container">
                  <button
                    type="button"
                    onClick={() => setOpenMenuId(isMenuOpen ? null : todo.id)}
                    className={`p-1.5 rounded-md transition-colors ${
                      isMenuOpen ? 'bg-slate-200 text-slate-800' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div
                      className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-2xl py-1 z-50 text-xs text-slate-700"
                    >
                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          setEditingTodo(todo);
                          setIsTaskModalOpen(true);
                        }}
                        className="w-full px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 hover:text-slate-900"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Edit Task</span>
                      </button>

                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          duplicateTodo(todo.id);
                        }}
                        className="w-full px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 hover:text-slate-900"
                      >
                        <Copy className="w-3.5 h-3.5 text-amber-500" />
                        <span>Duplicate</span>
                      </button>

                      <div className="border-t border-slate-100 my-1" />

                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          deleteTodo(todo.id);
                        }}
                        className="w-full px-3 py-1.5 text-left hover:bg-rose-50 text-rose-600 hover:text-rose-700 flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
