import { memo } from 'react';
import { Check } from 'lucide-react';
import { alpha, onColor } from '../lib/colors';
import { addDays, formatDate } from '../lib/dates';
import { bestStreak, currentStreak } from '../lib/streaks';
import type { DateKey, Habit } from '../lib/types';

interface Props {
  habit: Habit;
  done: Record<DateKey, true> | undefined;
  today: DateKey;
  onToggle: (id: string, date: DateKey) => void;
  onEdit: (h: Habit) => void;
}

export const HabitCard = memo(function HabitCard({ habit, done, today, onToggle, onEdit }: Props) {
  const isDone = !!done?.[today];
  const streak = currentStreak(done, today);
  const best = bestStreak(done, today);
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const c = habit.color;

  return (
    <article
      className={`habit-card card${isDone ? ' done' : ''}`}
      style={isDone ? { background: `linear-gradient(135deg, ${alpha(c, 0.16)}, ${alpha(c, 0.05)}) , var(--surface)`, borderColor: alpha(c, 0.35) } : undefined}
    >
      <div className="habit-main">
        <button className="habit-info" onClick={() => onEdit(habit)} aria-label={`Edit ${habit.name}`}>
          <span className="emoji-bubble" style={{ background: alpha(c, 0.2) }}>
            {habit.emoji}
          </span>
          <span className="habit-text">
            <span className="habit-name">{habit.name}</span>
            <span className="habit-meta">
              <span className={streak > 0 ? 'streak-on' : undefined}>
                {streak > 0 ? `🔥 ${streak} day${streak === 1 ? '' : 's'}` : 'No streak yet'}
              </span>
              <span className="dot-sep">·</span>
              <span>🏆 Best {best}</span>
            </span>
          </span>
        </button>
        <button
          className={`check-btn${isDone ? ' on' : ''}`}
          style={isDone ? { background: c, borderColor: c, color: onColor(c) } : { borderColor: alpha(c, 0.55), color: c }}
          onClick={() => onToggle(habit.id, today)}
          role="checkbox"
          aria-checked={isDone}
          aria-label={`Mark ${habit.name} done today`}
        >
          <Check size={28} strokeWidth={3.2} />
        </button>
      </div>
      <div className="week-strip">
        {week.map((d) => {
          const on = !!done?.[d];
          const isToday = d === today;
          return (
            <button
              key={d}
              className={`week-day${isToday ? ' today' : ''}`}
              onClick={() => onToggle(habit.id, d)}
              aria-label={`${formatDate(d, { weekday: 'long', month: 'short', day: 'numeric' })}: ${on ? 'done' : 'not done'}`}
              aria-pressed={on}
            >
              <span className="week-letter">{formatDate(d, { weekday: 'narrow' })}</span>
              <span
                className="week-dot"
                style={on ? { background: c, color: onColor(c) } : isToday ? { boxShadow: `inset 0 0 0 2px ${alpha(c, 0.6)}` } : undefined}
              >
                {on ? <Check size={14} strokeWidth={3.5} /> : formatDate(d, { day: 'numeric' })}
              </span>
            </button>
          );
        })}
      </div>
    </article>
  );
});
