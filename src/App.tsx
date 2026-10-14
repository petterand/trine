/**
 * ChronosTask - Advanced Desktop Todo & Recurring Reminders
 * Built with Tauri, React, TypeScript, and SCSS.
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { DesktopWindowBar } from './components/DesktopWindowBar';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { TaskList } from './components/TaskList';
import { RoutineRemindersView } from './components/RoutineRemindersView';
import { TimelineView } from './components/TimelineView';
import { TaskModal } from './components/TaskModal';
import { RawJsonModal } from './components/RawJsonModal';
import { SettingsModal } from './components/SettingsModal';
import { ReminderAlertBanner } from './components/ReminderAlertBanner';

const MainWorkspace: React.FC = () => {
  const { activeViewTab } = useApp();

  return (
    <div className="chronos-app">
      {/* Desktop Window Title & Status Bar */}
      <DesktopWindowBar />

      {/* Main Workspace Split */}
      <div className="chronos-layout">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Center Main Viewport */}
        <main className="chronos-main-viewport">
          <TopBar />

          <div className="chronos-content-scroll">
            {activeViewTab === 'tasks' && <TaskList />}
            {activeViewTab === 'routines' && <RoutineRemindersView />}
            {activeViewTab === 'timeline' && <TimelineView />}
          </div>
        </main>
      </div>

      {/* Interactive Modals & Floating Reminder Banners */}
      <TaskModal />
      <RawJsonModal />
      <SettingsModal />
      <ReminderAlertBanner />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainWorkspace />
    </AppProvider>
  );
}
