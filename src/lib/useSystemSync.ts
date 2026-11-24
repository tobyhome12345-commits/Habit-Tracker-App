import { useEffect, useState } from 'react';
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { accentTokens } from './colors';
import type { ThemePref } from './types';

/** Applies the theme + accent colour to <html> and the Android status/navigation bar icons. */
export function useThemeSync(theme: ThemePref, accent: string | null = null) {
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

  // Accent: CSS variables on <html> override the theme's defaults (Classic = none).
  useEffect(() => {
    const root = document.documentElement;
    const keys = Object.keys(accentTokens('#000000', false));
    for (const k of keys) root.style.removeProperty(k);
    if (!accent) {
      delete root.dataset.accent;
      return;
    }
    root.dataset.accent = '';
    for (const [k, v] of Object.entries(accentTokens(accent, dark))) root.style.setProperty(k, v);
  }, [accent, dark]);
}
