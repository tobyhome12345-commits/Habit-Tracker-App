import { addDays, diffDays } from './dates';
import type { DateKey } from './types';

type DoneMap = Record<DateKey, true> | undefined;

/**
 * Consecutive completed days ending today. If today isn't ticked yet, the streak
 * counts back from yesterday, so it only "breaks" once a whole day is missed.
 */
export function currentStreak(done: DoneMap, today: DateKey): number {
  if (!done) return 0;
  let day = done[today] ? today : addDays(today, -1);
  let n = 0;
  while (done[day]) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

/** Longest run of consecutive completed days ever (ignores future days). */
export function bestStreak(done: DoneMap, today: DateKey): number {
  if (!done) return 0;
  const days = Object.keys(done)
    .filter((d) => d <= today)
    .sort();
  let best = 0;
  let run = 0;
  let prev: DateKey | null = null;
  for (const d of days) {
    run = prev && diffDays(prev, d) === 1 ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  }
  return best;
}

export function totalDone(done: DoneMap, today: DateKey): number {
  if (!done) return 0;
  return Object.keys(done).filter((d) => d <= today).length;
}
