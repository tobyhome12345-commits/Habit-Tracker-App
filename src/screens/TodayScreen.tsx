import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Settings } from 'lucide-react';
import { useStore } from '../lib/store';
import { formatDate } from '../lib/dates';
import { successHaptic, tapHaptic } from '../lib/haptics';
import { HabitCard } from '../components/HabitCard';
import { ProgressRing } from '../components/ProgressRing';
import { Confetti } from '../components/Confetti';
import type { DateKey, Habit } from '../lib/types';

interface Props {
  today: DateKey;
  onAdd: () => void;
  onEdit: (h: Habit) => void;
  onSettings: () => void;
}

function summary(done: number, total: number) {
  if (done === total) return { title: 'Perfect day! 🎉', sub: 'Every habit done. Absolute legend.' };
  if (done === 0) return { title: 'Let’s get rolling 🚀', sub: `${total} habit${total === 1 ? '' : 's'} waiting for you` };
  const left = total - done;
  return { title: 'Nice, keep going! 💪', sub: `Just ${left} more to go today` };
}

export function TodayScreen({ today, onAdd, onEdit, onSettings }: Props) {
  const { state, dispatch } = useStore();
  const { habits, completions } = state;
  const doneCount = habits.filter((h) => completions[h.id]?.[today]).length;
  const allDone = habits.length > 0 && doneCount === habits.length;

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
      const willAllBeDone = date === today && habits.every((h) => h.id === id || state.completions[h.id]?.[today]);
      if (willAllBeDone) successHaptic();
      else tapHaptic();
    },
    [dispatch, habits, state.completions, today],
  );

  const s = summary(doneCount, habits.length);

  return (
    <main className={`screen${habits.length ? ' has-fab' : ''}`}>
      <header className="screen-header">
        <div>
          <p className="subtitle">{formatDate(today, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1>Today</h1>
        </div>
        <button className="icon-btn" aria-label="Settings" onClick={onSettings}>
          <Settings size={22} />
        </button>
      </header>

      {habits.length === 0 ? (
        <div className="card empty">
          <div className="empty-art">🌱</div>
          <h2>Start your first habit</h2>
          <p>Small things, done daily, add up to big things. What do you want to build?</p>
          <button className="btn btn-primary" onClick={onAdd}>
            <Plus size={20} strokeWidth={2.6} /> Add a habit
          </button>
        </div>
      ) : (
        <>
          <section className={`summary card${allDone ? ' all-done' : ''}`} aria-live="polite">
            <ProgressRing value={doneCount / habits.length} color={allDone ? 'var(--success)' : 'var(--accent)'}>
              <strong>{doneCount}</strong>
              <span>/{habits.length}</span>
            </ProgressRing>
            <div className="summary-text">
              <h2>{s.title}</h2>
              <p>{s.sub}</p>
            </div>
            {burst > 0 && <Confetti key={burst} />}
          </section>

          <div className="habit-list">
            {habits.map((h) => (
              <HabitCard key={h.id} habit={h} done={completions[h.id]} today={today} onToggle={onToggle} onEdit={onEdit} />
            ))}
          </div>
          <p className="hint">Tap a habit to edit it · tap a day in the strip to fix a missed one</p>

          <button className="fab" onClick={onAdd} aria-label="New habit">
            <Plus size={28} strokeWidth={2.6} />
          </button>
        </>
      )}
    </main>
  );
}
