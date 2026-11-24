import { createContext, useContext, useEffect, useReducer, useRef, type ReactNode } from 'react';
import { loadState, saveState, defaultState } from './storage';
import { addDays, todayKey } from './dates';
import { ruleOn, sameSchedule } from './schedule';
import type { AppState, DateKey, DateRange, Habit, Schedule, Settings, TimeOfDay } from './types';

/** Everything the add/edit sheet can set. */
export interface HabitInput {
  name: string;
  emoji: string;
  color: string;
  unit: string;
  timeOfDay: TimeOfDay;
  target: number;
  schedule: Schedule;
}

export type Action =
  | { type: 'load'; state: AppState }
  | { type: 'addHabit'; habit: HabitInput; today?: DateKey; id?: string }
  | { type: 'updateHabit'; id: string; patch: Partial<HabitInput>; today?: DateKey }
  | { type: 'deleteHabit'; id: string }
  /** +1 / −1 tap on a day (counted habits), never below 0. */
  | { type: 'tap'; id: string; date: DateKey; delta: 1 | -1 }
  | { type: 'setCount'; id: string; date: DateKey; count: number }
  | { type: 'setNote'; id: string; date: DateKey; text: string }
  | { type: 'archive'; id: string; today?: DateKey }
  | { type: 'restore'; id: string; today?: DateKey }
  /** Pause one habit, or every habit ('all' = vacation mode). */
  | { type: 'pause'; id: string | 'all'; from: DateKey; to: DateKey | null }
  | { type: 'resume'; id: string | 'all'; today?: DateKey }
  /** Move a habit to where `overId` is (drag to reorder). */
  | { type: 'reorder'; id: string; overId: string }
  | { type: 'settings'; patch: Partial<Settings> };

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const MAX_COUNT = 999;

function setDay(state: AppState, id: string, date: DateKey, count: number): AppState {
  const days = { ...(state.completions[id] ?? {}) };
  const n = Math.max(0, Math.min(MAX_COUNT, Math.round(count)));
  if (n > 0) days[date] = n;
  else delete days[date];
  return { ...state, completions: { ...state.completions, [id]: days } };
}

/** New goal/schedule from today on; old days keep the rule they had. */
function withRule(h: Habit, target: number, schedule: Schedule, today: DateKey): Habit {
  const cur = ruleOn(h, today);
  if (cur.target === target && sameSchedule(cur.schedule, schedule)) return h;
  const last = h.rules[h.rules.length - 1];
  const rule = { since: today, target, schedule };
  // Same-day edits (or a habit made today) just replace the rule.
  const rules = last.since >= today ? [...h.rules.slice(0, -1), rule] : [...h.rules, rule];
  return { ...h, rules };
}

/** End ranges that are active today (from today on), drop ones that haven't started. */
function endRanges(ranges: DateRange[], today: DateKey): DateRange[] {
  const yesterday = addDays(today, -1);
  return ranges
    .filter((r) => r.from < today || (r.to !== null && r.to < today))
    .map((r) => (r.to === null || r.to >= today ? { ...r, to: yesterday } : r));
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'load':
      return action.state;
    case 'addHabit': {
      const today = action.today ?? todayKey();
      const { target, schedule, ...rest } = action.habit;
      const habit: Habit = {
        ...rest,
        id: action.id ?? newId(),
        createdAt: today,
        rules: [{ since: today, target, schedule }],
        pauses: [],
        archivedAt: null,
      };
      return { ...state, habits: [...state.habits, habit] };
    }
    case 'updateHabit': {
      const today = action.today ?? todayKey();
      const { target, schedule, ...rest } = action.patch;
      return {
        ...state,
        habits: state.habits.map((h) => {
          if (h.id !== action.id) return h;
          const next = { ...h, ...rest };
          const cur = ruleOn(h, today);
          return withRule(next, target ?? cur.target, schedule ?? cur.schedule, today);
        }),
      };
    }
    case 'deleteHabit': {
      const completions = { ...state.completions };
      const notes = { ...state.notes };
      delete completions[action.id];
      delete notes[action.id];
      return { ...state, habits: state.habits.filter((h) => h.id !== action.id), completions, notes };
    }
    case 'tap':
      return setDay(state, action.id, action.date, (state.completions[action.id]?.[action.date] ?? 0) + action.delta);
    case 'setCount':
      return setDay(state, action.id, action.date, action.count);
    case 'setNote': {
      const days = { ...(state.notes[action.id] ?? {}) };
      const text = action.text.trim().slice(0, 280);
      if (text) days[action.date] = text;
      else delete days[action.date];
      return { ...state, notes: { ...state.notes, [action.id]: days } };
    }
    case 'archive': {
      const today = action.today ?? todayKey();
      return { ...state, habits: state.habits.map((h) => (h.id === action.id ? { ...h, archivedAt: today } : h)) };
    }
    case 'restore': {
      const today = action.today ?? todayKey();
      return {
        ...state,
        habits: state.habits.map((h) => {
          if (h.id !== action.id || !h.archivedAt) return h;
          // The archived days become a pause, so restoring never breaks the streak.
          const pauses = h.archivedAt < today ? [...h.pauses, { from: h.archivedAt, to: addDays(today, -1) }] : h.pauses;
          return { ...h, archivedAt: null, pauses };
        }),
      };
    }
    case 'pause': {
      const range = { from: action.from, to: action.to !== null && action.to < action.from ? action.from : action.to };
      if (action.id === 'all') return { ...state, settings: { ...state.settings, vacations: [...state.settings.vacations, range] } };
      return { ...state, habits: state.habits.map((h) => (h.id === action.id ? { ...h, pauses: [...h.pauses, range] } : h)) };
    }
    case 'resume': {
      const today = action.today ?? todayKey();
      if (action.id === 'all') return { ...state, settings: { ...state.settings, vacations: endRanges(state.settings.vacations, today) } };
      return { ...state, habits: state.habits.map((h) => (h.id === action.id ? { ...h, pauses: endRanges(h.pauses, today) } : h)) };
    }
    case 'reorder': {
      const from = state.habits.findIndex((h) => h.id === action.id);
      const to = state.habits.findIndex((h) => h.id === action.overId);
      if (from < 0 || to < 0 || from === to) return state;
      const habits = [...state.habits];
      const [moved] = habits.splice(from, 1);
      habits.splice(to, 0, moved);
      return { ...state, habits };
    }
    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.patch } };
  }
}

interface Store {
  state: AppState;
  ready: boolean;
  dispatch: (a: Action) => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, defaultState);
  const ready = useRef(false);
  const [, force] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    let cancelled = false;
    loadState().then((s) => {
      if (cancelled) return;
      dispatch({ type: 'load', state: s });
      ready.current = true;
      force();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist every change (only after the first load, so we never overwrite saved data with an empty state).
  useEffect(() => {
    if (ready.current) saveState(state).catch((e) => console.error('Save failed', e));
  }, [state]);

  return <StoreContext.Provider value={{ state, ready: ready.current, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
