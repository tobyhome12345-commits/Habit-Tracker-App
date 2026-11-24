import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { TabBar, type Tab } from './components/TabBar';
import { HabitSheet } from './components/HabitSheet';
import { SettingsSheet } from './components/SettingsSheet';
import { useReminderSync, useThemeSync } from './lib/useSystemSync';
import { TodayScreen } from './screens/TodayScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { StatsScreen } from './screens/StatsScreen';
import { StoreProvider, useStore } from './lib/store';
import { popBack } from './lib/backStack';
import type { Habit } from './lib/types';
import './styles/components.css';
import './styles/today.css';
import './styles/calendar.css';
import './styles/stats.css';
import { useToday } from './lib/useToday';

function Shell() {
  const { state, ready } = useStore();
  const [tab, setTab] = useState<Tab>('today');
  const [editing, setEditing] = useState<Habit | 'new' | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const today = useToday();
  const [calHabit, setCalHabit] = useState('all');
  useThemeSync(state.settings.theme);
  useReminderSync(state, today, ready);

  // Android back button: close sheets first, then return to Today, then leave the app.
  const tabRef = useRef(tab);
  tabRef.current = tab;
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const sub = CapApp.addListener('backButton', () => {
      if (popBack()) return;
      if (tabRef.current !== 'today') setTab('today');
      else CapApp.minimizeApp();
    });
    return () => {
      sub.then((s) => s.remove());
    };
  }, []);

  if (!ready) return <div className="app" />;

  const onAdd = () => setEditing('new');
  const onEdit = (h: Habit) => setEditing(h);

  return (
    <div className="app">
      {tab === 'today' && <TodayScreen today={today} onAdd={onAdd} onEdit={onEdit} onSettings={() => setSettingsOpen(true)} />}
      {tab === 'calendar' && <CalendarScreen today={today} selected={calHabit} onSelect={setCalHabit} />}
      {tab === 'stats' && <StatsScreen today={today} />}
      <TabBar tab={tab} onChange={setTab} />
      {editing && <HabitSheet habit={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
