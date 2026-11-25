import { invoke, isTauri } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';

export const inDesktop = isTauri();
const appWindow = inDesktop ? getCurrentWindow() : undefined;

export async function hideWindow() {
  if (appWindow) {
    await appWindow.hide();
  } else if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

export async function setPinned(pinned: boolean) {
  await appWindow?.setAlwaysOnTop(pinned);
}

export function copyText(text: string) {
  return inDesktop ? writeText(text) : navigator.clipboard.writeText(text);
}

export function onEditorOpened(callback: () => void) {
  return inDesktop ? listen('editor-opened', callback) : Promise.resolve();
}

export function onDesktopNotice(callback: (message: string) => void) {
  return inDesktop ? listen<string>('desktop-notice', ({ payload }) => callback(payload)) : Promise.resolve();
}

export function shortcutUnavailable() {
  return inDesktop ? invoke<boolean>('shortcut_unavailable') : Promise.resolve(false);
}
