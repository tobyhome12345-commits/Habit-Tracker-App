import { useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../lib/store';
import { addDays, addMonths, eachDay, endOfMonth, formatDate, startOfMonth, startOfWeek, weekday, weekdayLetters } from '../lib/dates';
import { alpha, onColor } from '../lib/colors';
import { habitStart } from '../lib/stats';
import { tapHaptic } from '../lib/haptics';
import { Pip } from '../components/Pip';
import type { DateKey, Habit } from '../lib/types';

interface Props {
  today: DateKey;
  selected: string; // 'all' or habit id
  onSelect: (id: string) => void;
}

const HEAT_WEEKS = 22;

/** 0..4 intensity bucket for a share of habits done (0 = none, 4 = all). */
function bucket(done: number, possible: number): number {
  if (!possible || !done) return 0;
  if (done === possible) return 4;
  return Math.min(3, Math.ceil((done / possible) * 3));
}

const HEAT_MIX = [0, 30, 55, 80, 100];

function heatColor(level: number, color: string): string | undefined {
  if (level === 0) return undefined;
  return `color-mix(in oklab, ${color} ${HEAT_MIX[level]}%, var(--heat-empty))`;
}

export function CalendarScreen({ today, selected, onSelect }: Props) {
  const { state, dispatch } = useStore();
  const { habits, completions, settings } = state;
  const habit = habits.find((h) => h.id === selected);
  const mode: 'all' | 'one' = habit ? 'one' : 'all';
  const [month, setMonth] = useState(() => startOfMonth(today));
  const [pickedDay, setPickedDay] = useState<DateKey>(today);
  const [heatPick, setHeatPick] = useState<DateKey | null>(null);

  const starts = useMemo(() => Object.fromEntries(habits.map((h) => [h.id, habitStart(h, completions)])), [habits, completions]);

  /** done / possible for the "All" view on a given day */
  const dayShare = (d: DateKey) => {
    let done = 0;
    let possible = 0;
    for (const h of habits) {
      if (d < starts[h.id]) continue;
      possible++;
      if (completions[h.id]?.[d]) done++;
    }
    return { done, possible };
  };

  const isDone = (h: Habit, d: DateKey) => !!completions[h.id]?.[d];

  // ----- Month grid -----
  const monthDays = eachDay(month, endOfMonth(month));
  const lead = (weekday(month) - settings.weekStart + 7) % 7;
  const letters = weekdayLetters(settings.weekStart);
  const canGoNext = month < startOfMonth(today);

  let monthSummary = '';
  if (habit) {
    const past = monthDays.filter((d) => d <= today);
    const n = past.filter((d) => isDone(habit, d)).length;
    monthSummary = `${n} day${n === 1 ? '' : 's'} done this month`;
  } else {
    const perfect = monthDays.filter((d) => {
      if (d > today) return false;
      const s = dayShare(d);
      return s.possible > 0 && s.done === s.possible;
    }).length;
    monthSummary = `${perfect} perfect day${perfect === 1 ? '' : 's'} ⭐`;
  }

  const onDayTap = (d: DateKey) => {
    if (d > today) return;
    if (habit) {
      tapHaptic();
      dispatch({ type: 'toggle', id: habit.id, date: d });
    } else {
      setPickedDay(d);
    }
  };

  // ----- Heatmap -----
  const heatStart = startOfWeek(addDays(today, -(HEAT_WEEKS - 1) * 7), settings.weekStart);
  const heatDays = eachDay(heatStart, addDays(startOfWeek(today, settings.weekStart), 6));
  const heatColorBase = habit ? habit.color : 'var(--leaf)';
  const heatLevel = (d: DateKey) => {
    if (d > today) return -1;
    if (habit) return isDone(habit, d) ? 4 : 0;
    const s = dayShare(d);
    return bucket(s.done, s.possible);
  };
  const monthLabels: { col: number; label: string }[] = [];
  for (let w = 0; w < heatDays.length / 7; w++) {
    const first = heatDays[w * 7];
    const prev = w > 0 ? heatDays[(w - 1) * 7] : null;
    if (!prev || first.slice(5, 7) !== prev.slice(5, 7)) monthLabels.push({ col: w, label: formatDate(first, { month: 'short' }) });
  }
  // Drop the leading partial-month label if it would collide with the next one.
  if (monthLabels.length > 1 && monthLabels[1].col - monthLabels[0].col < 3) monthLabels.shift();
  const heatReadout = (d: DateKey) => {
    const label = formatDate(d, { weekday: 'short', month: 'short', day: 'numeric' });
    if (habit) return `${label} · ${isDone(habit, d) ? 'Done ✅' : 'Not done'}`;
    const s = dayShare(d);
    return s.possible ? `${label} · ${s.done} of ${s.possible} habits done` : `${label} · no habits yet`;
  };

  if (habits.length === 0) {
    return (
      <main className="screen">
        <header className="screen-header">
          <h1>Calendar</h1>
        </header>
        <div className="card empty">
          <Pip mood="sleepy" size={130} label="Pip napping" />
          <h2>Pip’s napping…</h2>
          <p>Add a habit on the Today tab and your days will light up here.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="screen">
      <header className="screen-header">
        <div>
          <p className="subtitle">Your history</p>
          <h1>Calendar</h1>
        </div>
      </header>

      <div className="chips scroll-x habit-filter" role="tablist" aria-label="Choose habit">
        <button className={`chip${mode === 'all' ? ' selected' : ''}`} role="tab" aria-selected={mode === 'all'} onClick={() => onSelect('all')}>
          ✨ All habits
        </button>
        {habits.map((h) => (
          <button
            key={h.id}
            className={`chip${selected === h.id ? ' selected' : ''}`}
            role="tab"
            aria-selected={selected === h.id}
            onClick={() => onSelect(h.id)}
            style={selected === h.id ? { borderColor: h.color, background: alpha(h.color, 0.15) } : undefined}
          >
            <span>{h.emoji}</span> {h.name}
          </button>
        ))}
      </div>

      {/* Month grid */}
      <section className="card month-card">
        <div className="month-head">
          <button className="icon-btn plain" onClick={() => setMonth(addMonths(month, -1))} aria-label="Previous month">
            <ChevronLeft size={22} />
          </button>
          <div className="month-title">
            <h2>{formatDate(month, { month: 'long', year: 'numeric' })}</h2>
            <p>{monthSummary}</p>
          </div>
          <button className="icon-btn plain" onClick={() => setMonth(addMonths(month, 1))} disabled={!canGoNext} aria-label="Next month">
            <ChevronRight size={22} />
          </button>
        </div>

        <div className="month-grid">
          {letters.map((l, i) => (
            <div key={i} className="month-letter">
              {l}
            </div>
          ))}
          {Array.from({ length: lead }, (_, i) => (
            <div key={`b${i}`} />
          ))}
          {monthDays.map((d, i) => {
            const future = d > today;
            const isToday = d === today;
            const col = (lead + i) % 7;
            let fill: string | undefined;
            let text: string | undefined;
            let joinL = false;
            let joinR = false;
            let on = false;
            let label: string;
            const dateLabel = formatDate(d, { weekday: 'long', month: 'long', day: 'numeric' });
            if (habit) {
              on = isDone(habit, d);
              if (on) {
                fill = habit.color;
                text = onColor(habit.color);
                joinL = col > 0 && i > 0 && isDone(habit, monthDays[i - 1]);
                joinR = col < 6 && i < monthDays.length - 1 && monthDays[i + 1] <= today && isDone(habit, monthDays[i + 1]);
              }
              label = `${dateLabel}: ${on ? 'done' : 'not done'}`;
            } else {
              const s = dayShare(d);
              const lvl = future ? 0 : bucket(s.done, s.possible);
              fill = heatColor(lvl, 'var(--leaf)');
              text = lvl >= 3 ? 'var(--ink)' : undefined;
              on = lvl === 4;
              label = `${dateLabel}: ${s.done} of ${s.possible} habits done`;
            }
            const picked = mode === 'all' && d === pickedDay;
            return (
              <button
                key={d}
                className={`day${future ? ' future' : ''}${isToday ? ' today' : ''}${picked ? ' picked' : ''}`}
                onClick={() => onDayTap(d)}
                disabled={future}
                aria-label={label}
                aria-pressed={habit ? on : picked}
              >
                <span
                  className={`day-fill${joinL ? ' jl' : ''}${joinR ? ' jr' : ''}`}
                  style={fill ? { background: fill, color: text } : undefined}
                >
                  {d.slice(8).replace(/^0/, '')}
                </span>
              </button>
            );
          })}
        </div>
        <p className="month-foot">
          {habit ? 'Tap any past day to mark it done or undo it' : 'Darker = more habits done · tap a day for details'}
        </p>
      </section>

      {/* Day detail for "All" */}
      {mode === 'all' && (
        <section className="card day-detail">
          <h3>{pickedDay === today ? 'Today' : formatDate(pickedDay, { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
          {habits.map((h) => {
            const on = isDone(h, pickedDay);
            return (
              <button
                key={h.id}
                className="detail-row"
                role="checkbox"
                aria-checked={on}
                onClick={() => {
                  tapHaptic();
                  dispatch({ type: 'toggle', id: h.id, date: pickedDay });
                }}
              >
                <span className="emoji-bubble sm" style={{ background: alpha(h.color, 0.2) }}>
                  {h.emoji}
                </span>
                <span className="detail-name">{h.name}</span>
                <span className="mini-check" style={on ? { background: h.color, borderColor: h.color, color: onColor(h.color) } : undefined}>
                  {on && <Check size={16} strokeWidth={3.4} />}
                </span>
              </button>
            );
          })}
        </section>
      )}

      {/* Heatmap */}
      <section className="card heat-card">
        <div className="heat-head">
          <h3>Last {HEAT_WEEKS} weeks</h3>
          <div className="heat-legend" aria-hidden="true">
            Less
            {(habit ? [0, 4] : [0, 1, 2, 3, 4]).map((l) => (
              <i key={l} style={{ background: heatColor(l, heatColorBase) }} />
            ))}
            More
          </div>
        </div>
        <div className="heat-wrap">
          <div className="heat-months" style={{ gridTemplateColumns: `repeat(${HEAT_WEEKS}, 1fr)` }}>
            {monthLabels.map((m) => (
              <span key={m.col} style={{ gridColumn: `${m.col + 1} / span 3` }}>
                {m.label}
              </span>
            ))}
          </div>
          <div className="heat-grid" style={{ gridTemplateColumns: `repeat(${HEAT_WEEKS}, 1fr)` }}>
            {heatDays.map((d) => {
              const lvl = heatLevel(d);
              return (
                <button
                  key={d}
                  className={`heat-cell${lvl < 0 ? ' future' : ''}${heatPick === d ? ' picked' : ''}`}
                  style={lvl > 0 ? { background: heatColor(lvl, heatColorBase) } : undefined}
                  disabled={lvl < 0}
                  onClick={() => setHeatPick(d)}
                  aria-label={heatReadout(d)}
                />
              );
            })}
          </div>
        </div>
        <p className="heat-readout">{heatPick ? heatReadout(heatPick) : 'Tap a square to see that day'}</p>
      </section>
    </main>
  );
}
