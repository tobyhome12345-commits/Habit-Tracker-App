import { addDays, addMonths, eachDay, endOfMonth, maxKey, minKey, startOfMonth, startOfWeek } from './dates';
import type { Completions, DateKey, Habit } from './types';

export type PeriodKind = 'week' | 'month';

export interface Period {
  start: DateKey;
  end: DateKey;
}

export function periodFor(kind: PeriodKind, anchor: DateKey, weekStart: 0 | 1): Period {
  if (kind === 'week') {
    const start = startOfWeek(anchor, weekStart);
    return { start, end: addDays(start, 6) };
  }
  return { start: startOfMonth(anchor), end: endOfMonth(anchor) };
}

export function shiftPeriod(kind: PeriodKind, p: Period, n: number, weekStart: 0 | 1): Period {
  if (kind === 'week') return periodFor('week', addDays(p.start, 7 * n), weekStart);
  return periodFor('month', addMonths(p.start, n), weekStart);
}

/**
 * First day a habit "counts" from: when it was created, or earlier if the user
 * back-filled completions before that.
 */
export function habitStart(habit: Habit, completions: Completions): DateKey {
  let start = habit.createdAt;
  for (const d of Object.keys(completions[habit.id] ?? {})) if (d < start) start = d;
  return start;
}

export interface HabitPeriodStats {
  done: number;
  possible: number;
  /** 0..1, or null when the habit didn't exist yet in this period */
  rate: number | null;
}

export function habitPeriodStats(habit: Habit, completions: Completions, p: Period, today: DateKey): HabitPeriodStats {
  const from = maxKey(p.start, habitStart(habit, completions));
  const to = minKey(p.end, today);
  if (from > to) return { done: 0, possible: 0, rate: null };
  const done = completions[habit.id] ?? {};
  let n = 0;
  let possible = 0;
  for (const d of eachDay(from, to)) {
    possible++;
    if (done[d]) n++;
  }
  return { done: n, possible, rate: n / possible };
}

export interface DayStat {
  date: DateKey;
  done: number;
  possible: number;
  future: boolean;
}

export function dailySeries(habits: Habit[], completions: Completions, p: Period, today: DateKey): DayStat[] {
  const starts = habits.map((h) => habitStart(h, completions));
  return eachDay(p.start, p.end).map((date) => {
    let done = 0;
    let possible = 0;
    habits.forEach((h, i) => {
      if (date < starts[i]) return;
      possible++;
      if (completions[h.id]?.[date]) done++;
    });
    return { date, done, possible, future: date > today };
  });
}

export interface OverallStats {
  done: number;
  possible: number;
  rate: number | null;
  perfectDays: number;
}

export function overallStats(series: DayStat[]): OverallStats {
  let done = 0;
  let possible = 0;
  let perfectDays = 0;
  for (const d of series) {
    if (d.future) continue;
    done += d.done;
    possible += d.possible;
    if (d.possible > 0 && d.done === d.possible) perfectDays++;
  }
  return { done, possible, rate: possible ? done / possible : null, perfectDays };
}
