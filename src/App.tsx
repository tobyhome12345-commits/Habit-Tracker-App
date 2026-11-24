import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { TabBar, type Tab } from './components/TabBar';
import { HabitSheet } from './components/HabitSheet';
import { SettingsSheet } from './components/SettingsSheet';
import { MilestoneToast, type Milestone } from './components/MilestoneToast';
import { BIG_MILESTONES, isMilestone, tickLevel } from './mascot/mood';
import { MilestoneCelebration } from './components/MilestoneCelebration';
import { currentStreak } from './lib/streaks';
import { successHaptic } from './lib/haptics';
import { useThemeSync } from './lib/useSystemSync';
import { TodayScreen } from './screens/TodayScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { StatsScreen } from './screens/StatsScreen';
import { StoreProvider, useStore } from './lib/store';
import { popBack } from './lib/backStack';
import type { DateKey, Habit } from './lib/types';
import './styles/components.css';
import './styles/today.css';
import './styles/calendar.css';
import './styles/stats.css';
import { useHour, useToday } from './lib/useToday';
import './styles/tick.css';

function Shell() {
  const { state, ready } = useStore();
  const [tab, setTab] = useState<Tab>('today');
  const [editing, setEditing] = useState<Habit | 'new' | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const today = useToday();
  const hour = useHour();
  const [calHabit, setCalHabit] = useState('all');
  useThemeSync(state.settings.theme, state.settings.accent);

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

  // Streak milestones: computed from the state *before* this check-off plus the new tick.
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const shown = useRef(new Set<string>());
  const onChecked = useCallback(
    (habit: Habit, date: DateKey, count: number) => {
      if (date !== today) return;
      const before = stateRef.current;
      const days = { ...(before.completions[habit.id] ?? {}), [date]: count };
      const after = { ...before, completions: { ...before.completions, [habit.id]: days } };
      const s = currentStreak(habit, after, today);
      const streak = s.count;
      // Only when this check-off actually grew the streak (not a bonus tick on an off day)
      if (!isMilestone(streak) || streak <= currentStreak(habit, before, today).count) return;
      const key = `${habit.id}:${today}:${streak}`;
      if (shown.current.has(key)) return;
      shown.current.add(key);
      const oldStage = tickLevel(before, today).stage;
      const stage = tickLevel(after, today).stage;
      setMilestone({ key, habit, streak, unit: s.unit, stage, grew: stage > oldStage });
      setTimeout(successHaptic, 250);
    },
    [today],
  );
  const dismissMilestone = useCallback(() => setMilestone(null), []);

  if (!ready) return <div className="app" />;

  const onAdd = () => setEditing('new');
  const onEdit = (h: Habit) => setEditing(h);

  return (
    <div className="app">
      {tab === 'today' && (
        <TodayScreen today={today} hour={hour} onAdd={onAdd} onEdit={onEdit} onSettings={() => setSettingsOpen(true)} onChecked={onChecked} />
      )}
      {tab === 'calendar' && <CalendarScreen today={today} selected={calHabit} onSelect={setCalHabit} />}
      {tab === 'stats' && <StatsScreen today={today} />}
      <TabBar tab={tab} onChange={setTab} />
      {editing && <HabitSheet habit={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
      {milestone &&
        (BIG_MILESTONES.includes(milestone.streak) ? (
          <MilestoneCelebration m={milestone} onDone={dismissMilestone} />
        ) : (
          <MilestoneToast m={milestone} onDone={dismissMilestone} />
        ))}
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
