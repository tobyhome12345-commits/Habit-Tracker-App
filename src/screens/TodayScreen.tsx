import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Settings } from 'lucide-react';
import { useStore } from '../lib/store';
import { formatDate } from '../lib/dates';
import { successHaptic, tapHaptic } from '../lib/haptics';
import { HabitCard } from '../components/HabitCard';
import { ProgressRing } from '../components/ProgressRing';
import { Confetti } from '../components/Confetti';
import { Pip } from '../components/Pip';
import { STAGE_BADGES, dayContext, greeting, pipGrowth, pipMessage, pipMood } from '../mascot/mood';
import type { DateKey, Habit } from '../lib/types';

interface Props {
  today: DateKey;
  hour: number;
  onAdd: () => void;
  onEdit: (h: Habit) => void;
  onSettings: () => void;
  onChecked: (habit: Habit, date: DateKey) => void;
}

export function TodayScreen({ today, hour, onAdd, onEdit, onSettings, onChecked }: Props) {
  const { state, dispatch } = useStore();
  const { habits, completions } = state;
  const ctx = dayContext(state, today, hour);
  const mood = pipMood(ctx);
  const growth = pipGrowth(state, today);
  const allDone = habits.length > 0 && ctx.done === habits.length;

  // Confetti when the last habit of the day gets ticked (not on first render).
  const [burst, setBurst] = useState(0);
  const prevAllDone = useRef(allDone);
  useEffect(() => {
    if (allDone && !prevAllDone.current) setBurst((b) => b + 1);
    prevAllDone.current = allDone;
  }, [allDone]);

  const onToggle = useCallback(
    (id: string, date: DateKey) => {
      const wasDone = !!state.completions[id]?.[date];
      dispatch({ type: 'toggle', id, date });
      if (wasDone) return;
      const habit = habits.find((h) => h.id === id);
      if (habit) onChecked(habit, date);
      const willAllBeDone = date === today && habits.every((h) => h.id === id || state.completions[h.id]?.[today]);
      if (willAllBeDone) successHaptic();
      else tapHaptic();
    },
    [dispatch, habits, state.completions, today, onChecked],
  );

  const header = (
    <header className="screen-header">
      <div>
        <p className="subtitle">
          {greeting(hour)} · {formatDate(today, { weekday: 'short', month: 'short', day: 'numeric' })}
        </p>
        <h1>Today</h1>
      </div>
      <div className="header-actions">
        {habits.length > 0 && (
          <button className="icon-btn primary" aria-label="New habit" onClick={onAdd}>
            <Plus size={24} strokeWidth={2.6} />
          </button>
        )}
        <button className="icon-btn" aria-label="Settings" onClick={onSettings}>
          <Settings size={21} />
        </button>
      </div>
    </header>
  );

  if (habits.length === 0) {
    return (
      <main className="screen">
        {header}
        <section className="card empty hello">
          <div className="hello-art">
            <Pip mood="wave" size={156} label="Pip the seed sprout, waving hello" />
          </div>
          <h2>Hi, I’m Pip!</h2>
          <p>I’m a little seed who grows when you keep your habits. Plant your first one and let’s start a streak together.</p>
          <button className="btn btn-primary" onClick={onAdd}>
            <Plus size={20} strokeWidth={2.6} /> Plant your first habit
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="screen">
      {header}

      <section className={`hero card mood-${mood}`} aria-live="polite">
        <div className="hero-main">
          <div className="hero-art">
            <ProgressRing value={ctx.done / habits.length} size={124} stroke={9} color="var(--leaf)">
              <Pip mood={mood} stage={growth.stage} size={104} label={`Pip is ${mood === 'celebrate' ? 'celebrating' : mood === 'encourage' ? 'cheering you on' : mood}`} />
            </ProgressRing>
            {burst > 0 && <Confetti key={burst} />}
          </div>
          <div className="hero-text">
            <p className="bubble">{pipMessage(ctx, mood)}</p>
            <p className="hero-count">
              <strong>{ctx.done}</strong> of {habits.length} done
            </p>
          </div>
        </div>
        <div className="growth">
          <div className="growth-row">
            <span className="stage-badge">{STAGE_BADGES[growth.stage]}</span>
            <span className="growth-label">
              {growth.next !== null ? (
                <>
                  Next: <b>{STAGE_BADGES[growth.stage + 1]}</b> at a {growth.next}-day streak
                </>
              ) : (
                <>Full bloom! Keep that {growth.best}-day streak going</>
              )}
            </span>
          </div>
          {growth.next !== null && (
            <div className="growth-row">
              <span className="growth-bar" aria-hidden="true">
                <i style={{ width: `${Math.min(100, (growth.best / growth.next) * 100)}%` }} />
              </span>
              <span className="growth-num">
                {growth.best}/{growth.next} days
              </span>
            </div>
          )}
        </div>
      </section>

      <div className="habit-list">
        {habits.map((h) => (
          <HabitCard key={h.id} habit={h} done={completions[h.id]} today={today} onToggle={onToggle} onEdit={onEdit} />
        ))}
      </div>
      <button className="add-card" onClick={onAdd}>
        <Plus size={20} strokeWidth={2.6} /> Add a habit
      </button>
      <p className="hint">Tap a habit to edit it · tap a day in the strip to fix a missed one</p>
    </main>
  );
}
