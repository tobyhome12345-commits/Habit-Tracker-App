import { useEffect, useRef, useState } from 'react';
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { syncReminders } from './reminders';
import type { AppState, DateKey, ThemePref } from './types';

/** Applies the theme to <html> and the Android status/navigation bar icons. */
export function useThemeSync(theme: ThemePref) {
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const on = () => setSystemDark(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const dark = theme === 'dark' || (theme === 'system' && systemDark);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0f0e17' : '#f5f4fa');
    if (Capacitor.isNativePlatform()) {
      SystemBars.setStyle({ style: dark ? SystemBarsStyle.Dark : SystemBarsStyle.Light }).catch(() => {});
    }
  }, [theme, dark]);
}

/** Re-plans reminders (debounced) whenever anything that affects them changes. */
export function useReminderSync(state: AppState, today: DateKey, ready: boolean) {
  const signature =
    today +
    '|' +
    state.habits
      .map((h) => [h.id, h.name, h.emoji, h.color, h.reminder.enabled, h.reminder.time, state.completions[h.id]?.[today] ? 1 : 0].join(','))
      .join('|');
  const latest = useRef(state);
  latest.current = state;
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      syncReminders(latest.current, today).catch((e) => console.error('Reminder sync failed', e));
    }, 800);
    return () => clearTimeout(t);
  }, [signature, today, ready]);
}
