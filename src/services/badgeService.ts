/**
 * macOS Dock & Desktop App Icon Badging Service
 * 
 * Supports:
 * 1. Tauri Native macOS Dock Badge: calls native window badge methods & Rust IPC.
 * 2. W3C App Badging API: navigator.setAppBadge / clearAppBadge for macOS Safari & Chrome desktop PWA.
 * 3. Dynamic Canvas Favicon Badging: draws a Slack-style red badge (circle for 1-9, pill for '9+') on the icon.
 * 4. Document Title: prefixes window title with `(${badgeLabel})`.
 */

import { isTauriEnvironment } from './tauriBridge';

const DEFAULT_ICON_PATH = '/src/assets/images/trine_app_icon_1791999108987.jpg';
const APP_TITLE_BASE = 'Trine - Desktop Todo & Recurring Reminders';

let cachedIconImage: HTMLImageElement | null = null;

// Preload the base icon image for instant canvas rendering
const getBaseIconImage = (): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    if (cachedIconImage && cachedIconImage.complete) {
      resolve(cachedIconImage);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      cachedIconImage = img;
      resolve(img);
    };
    img.onerror = (err) => reject(err);
    img.src = DEFAULT_ICON_PATH;
  });
};

/**
 * Format the badge label according to user specification:
 * - count <= 0: null (cleared)
 * - count > 9: '9+'
 * - count 1..9: string representation ('1', '2', ..., '9')
 */
export const formatBadgeCount = (count: number): string | null => {
  if (count <= 0) return null;
  if (count > 9) return '9+';
  return count.toString();
};

/**
 * Draw a Slack-style red badge on top of the Trine app icon and update the browser favicon
 */
const updateFaviconWithBadge = async (badgeLabel: string | null): Promise<void> => {
  if (typeof document === 'undefined') return;

  const faviconEl = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
  if (!faviconEl) return;

  if (!badgeLabel) {
    faviconEl.href = DEFAULT_ICON_PATH;
    return;
  }

  try {
    const baseImg = await getBaseIconImage();
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Draw base icon with rounded corners
    ctx.save();
    ctx.beginPath();
    const r = 14;
    ctx.moveTo(r, 0);
    ctx.lineTo(64 - r, 0);
    ctx.quadraticCurveTo(64, 0, 64, r);
    ctx.lineTo(64, 64 - r);
    ctx.quadraticCurveTo(64, 64, 64 - r, 64);
    ctx.lineTo(r, 64);
    ctx.quadraticCurveTo(0, 64, 0, 64 - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(baseImg, 0, 0, 64, 64);
    ctx.restore();

    // 2. Draw Slack-style red badge in top-right corner
    const isPill = badgeLabel.length > 1; // '9+' or multi-digit
    const badgeHeight = 24;
    const badgeWidth = isPill ? 36 : 24;
    const badgeX = 64 - badgeWidth - 2;
    const badgeY = 2;
    const cornerRadius = badgeHeight / 2;

    // Draw white outline ring for crisp separation
    ctx.save();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#ef4444'; // Slack vibrant red

    ctx.beginPath();
    ctx.moveTo(badgeX + cornerRadius, badgeY);
    ctx.lineTo(badgeX + badgeWidth - cornerRadius, badgeY);
    ctx.arc(badgeX + badgeWidth - cornerRadius, badgeY + cornerRadius, cornerRadius, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(badgeX + cornerRadius, badgeY + badgeHeight);
    ctx.arc(badgeX + cornerRadius, badgeY + cornerRadius, cornerRadius, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();

    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;

    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Draw badge text
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = isPill ? 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' : 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeLabel, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2 + 0.5);
    ctx.restore();

    faviconEl.href = canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('[BadgeService] Failed to generate dynamic favicon badge:', err);
  }
};

/**
 * Updates the macOS Dock badge, W3C Web Badge, dynamic favicon, and window title
 */
export const updateAppBadge = async (count: number): Promise<void> => {
  const badgeLabel = formatBadgeCount(count);

  // 1. Update Document Title
  if (typeof document !== 'undefined') {
    if (badgeLabel) {
      document.title = `(${badgeLabel}) ${APP_TITLE_BASE}`;
    } else {
      document.title = APP_TITLE_BASE;
    }
  }

  // 2. Update Browser Dynamic Favicon
  await updateFaviconWithBadge(badgeLabel);

  // 3. W3C App Badging API (Works on macOS Dock in Safari, Chrome, Edge when pinned/PWA)
  if (typeof navigator !== 'undefined') {
    try {
      if (badgeLabel && 'setAppBadge' in navigator) {
        await (navigator as any).setAppBadge(count);
      } else if (!badgeLabel && 'clearAppBadge' in navigator) {
        await (navigator as any).clearAppBadge();
      }
    } catch {
      // Ignore if permission not granted
    }
  }

  // 4. Tauri Native Desktop macOS Dock Badging
  if (isTauriEnvironment()) {
    try {
      // Dynamic import to prevent crash when outside Tauri
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const win = getCurrentWindow();

      // Check if Tauri v2 setBadgeCount or setBadgeLabel is present
      if ('setBadgeLabel' in win && typeof (win as any).setBadgeLabel === 'function') {
        await (win as any).setBadgeLabel(badgeLabel || undefined);
      } else if ('setBadgeCount' in win && typeof (win as any).setBadgeCount === 'function') {
        await (win as any).setBadgeCount(count > 0 ? count : undefined);
      }
    } catch (e) {
      // Window API might vary depending on OS build
    }

    try {
      // Optional Rust IPC command if compiled with custom AppKit dock integration
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('set_dock_badge', { badge: badgeLabel });
    } catch {
      // Command optional
    }
  }
};
