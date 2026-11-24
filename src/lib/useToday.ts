import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { todayKey } from './dates';

/** Today's DateKey, kept fresh across midnight and when the app comes back from the background. */
export function useToday(): string {
  const [today, setToday] = useState(todayKey);
  useEffect(() => {
    const check = () => setToday((t) => (t === todayKey() ? t : todayKey()));
    const timer = setInterval(check, 30_000);
    document.addEventListener('visibilitychange', check);
    const sub = Capacitor.isNativePlatform() ? CapApp.addListener('resume', check) : null;
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
      sub?.then((s) => s.remove());
    };
  }, []);
  return today;
}
