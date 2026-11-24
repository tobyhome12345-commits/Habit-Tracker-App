import { describe, expect, it } from 'vitest';
import { dailySeries, habitPeriodStats, overallStats, periodFor, shiftPeriod } from '../stats';
import type { Habit } from '../types';

const habit = (id: string, createdAt: string): Habit => ({
  id,
  name: id,
  emoji: '⭐',
  color: '#8b5cf6',
  createdAt,
  reminder: { enabled: false, time: '20:00' },
});

describe('stats', () => {
  const today = '2026-11-24'; // Tuesday

  it('builds week and month periods', () => {
    expect(periodFor('week', today, 1)).toEqual({ start: '2026-11-23', end: '2026-11-29' });
    expect(periodFor('month', today, 1)).toEqual({ start: '2026-11-01', end: '2026-11-30' });
    expect(shiftPeriod('month', periodFor('month', today, 1), -1, 1)).toEqual({ start: '2026-10-01', end: '2026-10-31' });
    expect(shiftPeriod('week', periodFor('week', today, 1), 1, 1)).toEqual({ start: '2026-11-30', end: '2026-12-06' });
  });

  it('only counts days since creation and up to today', () => {
    const h = habit('a', '2026-11-20');
    const c = { a: { '2026-11-20': true as const, '2026-11-22': true as const, '2026-11-24': true as const } };
    const s = habitPeriodStats(h, c, periodFor('month', today, 1), today);
    expect(s).toEqual({ done: 3, possible: 5, rate: 3 / 5 });
  });

  it('counts back-filled days before creation', () => {
    const h = habit('a', '2026-11-24');
    const c = { a: { '2026-11-22': true as const, '2026-11-24': true as const } };
    expect(habitPeriodStats(h, c, periodFor('month', today, 1), today)).toEqual({ done: 2, possible: 3, rate: 2 / 3 });
  });

  it('returns null rate for periods before the habit existed', () => {
    const h = habit('a', '2026-11-24');
    expect(habitPeriodStats(h, {}, periodFor('month', '2026-10-05', 1), today).rate).toBeNull();
  });

  it('summarises daily series and perfect days', () => {
    const habits = [habit('a', '2026-11-01'), habit('b', '2026-11-24')];
    const c = { a: { '2026-11-23': true as const, '2026-11-24': true as const }, b: { '2026-11-24': true as const } };
    const series = dailySeries(habits, c, periodFor('week', today, 1), today);
    expect(series.map((d) => [d.done, d.possible, d.future])).toEqual([
      [1, 1, false],
      [2, 2, false],
      [0, 2, true],
      [0, 2, true],
      [0, 2, true],
      [0, 2, true],
      [0, 2, true],
    ]);
    expect(overallStats(series)).toEqual({ done: 3, possible: 3, rate: 1, perfectDays: 2 });
  });
});
