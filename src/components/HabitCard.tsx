import { memo, useEffect, useRef, useState } from 'react';
import { Check, Flame, Trophy } from 'lucide-react';
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

/** Check mark that draws itself in when the habit gets done. */
function CheckMark({ on }: { on: boolean }) {
  return (
    <svg className={`checkmark${on ? ' on' : ''}`} viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <path d="M5 12.5l4.6 4.6L19.2 7.4" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
    </svg>
  );
}

export const HabitCard = memo(function HabitCard({ habit, done, today, onToggle, onEdit }: Props) {
  const isDone = !!done?.[today];
  const streak = currentStreak(done, today);
  const best = bestStreak(done, today);
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const c = habit.color;

  // Particle burst when it flips to done (not on first render).
  const [burst, setBurst] = useState(0);
  const prev = useRef(isDone);
  useEffect(() => {
    if (isDone && !prev.current) setBurst((b) => b + 1);
    prev.current = isDone;
  }, [isDone]);

  return (
    <article
      className={`habit-card card${isDone ? ' done' : ''}`}
      style={isDone ? { background: `linear-gradient(135deg, ${alpha(c, 0.16)}, ${alpha(c, 0.04)}), var(--surface)`, borderColor: alpha(c, 0.4) } : undefined}
    >
      <div className="habit-main">
        <button className="habit-info" onClick={() => onEdit(habit)} aria-label={`Edit ${habit.name}`}>
          <span className="emoji-bubble" style={{ background: alpha(c, 0.18) }}>
            {habit.emoji}
          </span>
          <span className="habit-text">
            <span className="habit-name">{habit.name}</span>
            <span className="habit-meta">
              <span className={`meta-chip${streak > 0 ? ' hot' : ''}`}>
                <Flame size={14} strokeWidth={2.6} />
                {streak > 0 ? `${streak} day${streak === 1 ? '' : 's'}` : 'Start today'}
              </span>
              <span className="meta-chip">
                <Trophy size={13} strokeWidth={2.6} />
                Best {best}
              </span>
            </span>
          </span>
        </button>
        <div className="check-wrap">
          <button
            className={`check-btn${isDone ? ' on' : ''}`}
            style={isDone ? { background: c, borderColor: c, color: onColor(c) } : { borderColor: alpha(c, 0.5), color: alpha(c, 0.45) }}
            onClick={() => onToggle(habit.id, today)}
            role="checkbox"
            aria-checked={isDone}
            aria-label={`Mark ${habit.name} done today`}
          >
            <CheckMark on={isDone} />
          </button>
          {burst > 0 && (
            <span key={burst} className="burst" aria-hidden="true">
              {Array.from({ length: 8 }, (_, i) => {
                const a = (i / 8) * Math.PI * 2;
                return <i key={i} style={{ background: c, '--bx': `${Math.cos(a) * 38}px`, '--by': `${Math.sin(a) * 38}px` } as React.CSSProperties} />;
              })}
            </span>
          )}
        </div>
      </div>
      <div className="week-strip">
        {week.map((d) => {
          const on = !!done?.[d];
          const isToday = d === today;
          return (
            <button
              key={d}
              className={`week-day${isToday ? ' today' : ''}${on ? ' on' : ''}`}
              onClick={() => onToggle(habit.id, d)}
              aria-label={`${formatDate(d, { weekday: 'long', month: 'short', day: 'numeric' })}: ${on ? 'done' : 'not done'}`}
              aria-pressed={on}
            >
              <span className="week-letter">{formatDate(d, { weekday: 'narrow' })}</span>
              <span
                className="week-dot"
                style={on ? { background: c, color: onColor(c) } : isToday ? { boxShadow: `inset 0 0 0 2px ${alpha(c, 0.7)}` } : undefined}
              >
                {on ? <Check size={14} strokeWidth={3.6} /> : formatDate(d, { day: 'numeric' })}
              </span>
            </button>
          );
        })}
      </div>
    </article>
  );
});
