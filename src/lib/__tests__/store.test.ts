import { describe, expect, it } from 'vitest';
import { reducer } from '../store';
import { defaultState, normalizeState } from '../storage';

describe('reducer', () => {
  it('adds, toggles, edits and deletes habits', () => {
    let s = reducer(defaultState(), {
      type: 'addHabit',
      habit: { name: 'Read', emoji: '📚', color: '#f59e0b', reminder: { enabled: false, time: '20:00' } },
    });
    const id = s.habits[0].id;
    s = reducer(s, { type: 'toggle', id, date: '2026-11-24' });
    expect(s.completions[id]['2026-11-24']).toBe(true);
    s = reducer(s, { type: 'toggle', id, date: '2026-11-24' });
    expect(s.completions[id]['2026-11-24']).toBeUndefined();
    s = reducer(s, { type: 'updateHabit', id, patch: { name: 'Read more' } });
    expect(s.habits[0].name).toBe('Read more');
    s = reducer(s, { type: 'deleteHabit', id });
    expect(s.habits).toHaveLength(0);
    expect(s.completions[id]).toBeUndefined();
  });
});

describe('normalizeState', () => {
  it('maps the old palette onto the garden palette', () => {
    const s = normalizeState({ habits: [{ id: 'a', color: '#8B5CF6' }, { id: 'b', color: '#123456' }] });
    expect(s.habits.map((h) => h.color)).toEqual(['#a970f0', '#123456']);
  });

  it('rejects junk', () => {
    expect(() => normalizeState({ foo: 1 })).toThrow();
    expect(() => normalizeState('hello')).toThrow();
  });

  it('repairs partial data', () => {
    const s = normalizeState({
      habits: [{ id: 'x', name: 'Run', color: 'nope', createdAt: '2026-01-01' }],
      completions: { x: { '2026-01-02': true, bad: true }, ghost: { '2026-01-02': true } },
      settings: { theme: 'dark', weekStart: 0 },
    });
    expect(s.habits[0]).toMatchObject({ id: 'x', name: 'Run', color: '#3dbe7e', emoji: '⭐' });
    expect(s.completions).toEqual({ x: { '2026-01-02': true } });
    expect(s.settings).toEqual({ theme: 'dark', weekStart: 0 });
  });
});
