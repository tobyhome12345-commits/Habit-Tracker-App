import { describe, expect, it } from 'vitest';
import { dayContext, isMilestone, pipGrowth, pipMessage, pipMood, pipReminder } from '../../mascot/mood';
import { growthStage } from '../../mascot/pip';
import { defaultState } from '../storage';
import type { AppState } from '../types';

const today = '2026-11-24';
const ctx = (done: number, total: number, hour = 10, lostStreak = false) => ({ done, total, hour, lostStreak, today });

function stateWith(days: Record<string, string[]>): AppState {
  const s = defaultState();
  for (const [id, list] of Object.entries(days)) {
    s.habits.push({ id, name: id, emoji: '⭐', color: '#3dbe7e', createdAt: '2026-01-01', reminder: { enabled: false, time: '20:00' } });
    s.completions[id] = Object.fromEntries(list.map((d) => [d, true as const]));
  }
  return s;
}

describe('pipMood', () => {
  it('waves with no habits and celebrates a perfect day', () => {
    expect(pipMood(ctx(0, 0))).toBe('wave');
    expect(pipMood(ctx(3, 3, 23))).toBe('celebrate');
  });
  it('is happy before you start, encouraging once you have', () => {
    expect(pipMood(ctx(0, 3))).toBe('happy');
    expect(pipMood(ctx(1, 3))).toBe('encourage');
  });
  it('gets sleepy late at night and cheers you up after a lost streak', () => {
    expect(pipMood(ctx(1, 3, 22))).toBe('sleepy');
    expect(pipMood(ctx(0, 3, 3))).toBe('sleepy');
    expect(pipMood(ctx(0, 3, 10, true))).toBe('encourage');
  });
  it('keeps the same message all day', () => {
    const c = ctx(1, 4);
    expect(pipMessage(c, 'encourage')).toBe(pipMessage({ ...c }, 'encourage'));
    expect(pipMessage(c, 'encourage')).toMatch(/3/);
  });
});

describe('dayContext', () => {
  it('detects a 3+ day streak that ended yesterday', () => {
    const s = stateWith({ a: ['2026-11-20', '2026-11-21', '2026-11-22'], b: ['2026-11-24'] });
    expect(dayContext(s, today, 9)).toMatchObject({ done: 1, total: 2, lostStreak: true });
  });
  it('does not flag streaks that are still alive', () => {
    const s = stateWith({ a: ['2026-11-21', '2026-11-22', '2026-11-23'] });
    expect(dayContext(s, today, 9).lostStreak).toBe(false);
  });
});

describe('growth & milestones', () => {
  it('maps streaks to stages', () => {
    expect([0, 2, 3, 6, 7, 13, 14, 29, 30, 400].map(growthStage)).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4]);
  });
  it('uses the best current streak and knows the next step', () => {
    const s = stateWith({ a: ['2026-11-20', '2026-11-21', '2026-11-22', '2026-11-23', '2026-11-24'], b: ['2026-11-24'] });
    expect(pipGrowth(s, today)).toEqual({ stage: 1, best: 5, next: 7 });
  });
  it('knows milestone days', () => {
    expect([3, 7, 8, 30, 100, 101].map(isMilestone)).toEqual([true, true, false, true, true, false]);
  });
});

describe('pipReminder', () => {
  it('is sleepy late, streak-aware otherwise', () => {
    expect(pipReminder(22, 9, 1).largeIcon).toBe('pip_sleepy');
    expect(pipReminder(18, 9, 1)).toEqual({ body: 'Pip here! Keep your 9-day streak going 🔥', largeIcon: 'pip_encourage' });
    expect(pipReminder(8, 0, 1).largeIcon).toBe('pip_happy');
    expect(pipReminder(15, 0, 1).largeIcon).toBe('pip_encourage');
  });
});
