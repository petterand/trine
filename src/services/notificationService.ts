/**
 * Notification Service for Tauri Desktop and Web Notification API
 */

import { isTauriEnvironment } from './tauriBridge';
import {
  sendNotification,
  isPermissionGranted,
  requestPermission
} from '@tauri-apps/plugin-notification';

export async function requestNotificationPermission(): Promise<boolean> {
  if (isTauriEnvironment()) {
    try {
      let permissionGranted = await isPermissionGranted();
      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
      }
      return permissionGranted;
    } catch (err) {
      console.warn('Tauri notification permission check failed:', err);
    }
  }

  // Web Notification API fallback
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      return true;
    }
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
  }

  return false;
}

export async function sendDesktopNotification(title: string, body?: string): Promise<void> {
  // 1. Try Tauri native notification
  if (isTauriEnvironment()) {
    try {
      sendNotification({
        title,
        body: body || 'You have an active scheduled reminder in ChronosTask.'
      });
      return;
    } catch (err) {
      console.warn('Tauri sendNotification error:', err);
    }
  }

  // 2. Fallback to Web Notification API
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: body || 'You have an active scheduled reminder in ChronosTask.',
        icon: '/favicon.ico',
        tag: 'chronostask-reminder'
      });
    } catch (err) {
      console.warn('Web notification error:', err);
    }
  }
}
