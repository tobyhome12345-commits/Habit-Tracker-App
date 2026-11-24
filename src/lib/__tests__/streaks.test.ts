import { describe, expect, it } from 'vitest';
import { bestStreak, currentStreak, totalDone } from '../streaks';

const days = (...ds: string[]) => Object.fromEntries(ds.map((d) => [d, true as const]));

describe('streaks', () => {
  const today = '2026-11-24';

  it('is 0 with no data', () => {
    expect(currentStreak(undefined, today)).toBe(0);
    expect(bestStreak({}, today)).toBe(0);
  });

  it('counts back from today when today is done', () => {
    expect(currentStreak(days('2026-11-22', '2026-11-23', '2026-11-24'), today)).toBe(3);
  });

  it('keeps the streak alive if today is not done yet', () => {
    expect(currentStreak(days('2026-11-22', '2026-11-23'), today)).toBe(2);
  });

  it('breaks after a fully missed day', () => {
    expect(currentStreak(days('2026-11-21', '2026-11-22'), today)).toBe(0);
  });

  it('works across a month boundary', () => {
    expect(currentStreak(days('2026-10-30', '2026-10-31', '2026-11-01'), '2026-11-01')).toBe(3);
  });

  it('finds the best streak with gaps', () => {
    const d = days('2026-01-01', '2026-01-02', '2026-01-03', '2026-01-05', '2026-01-06', '2026-02-28', '2026-03-01');
    expect(bestStreak(d, today)).toBe(3);
  });

  it('ignores future days', () => {
    expect(bestStreak(days('2026-11-25', '2026-11-26'), today)).toBe(0);
    expect(totalDone(days('2026-11-24', '2026-11-25'), today)).toBe(1);
  });
});
