import { createContext, useContext, useEffect, useReducer, useRef, type ReactNode } from 'react';
import { loadState, saveState, defaultState } from './storage';
import { todayKey } from './dates';
import type { AppState, DateKey, Habit, Settings } from './types';

export type Action =
  | { type: 'load'; state: AppState }
  | { type: 'addHabit'; habit: Omit<Habit, 'id' | 'createdAt'> }
  | { type: 'updateHabit'; id: string; patch: Partial<Omit<Habit, 'id'>> }
  | { type: 'deleteHabit'; id: string }
  | { type: 'toggle'; id: string; date: DateKey }
  | { type: 'settings'; patch: Partial<Settings> };

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'load':
      return action.state;
    case 'addHabit': {
      const habit: Habit = { ...action.habit, id: newId(), createdAt: todayKey() };
      return { ...state, habits: [...state.habits, habit] };
    }
    case 'updateHabit':
      return {
        ...state,
        habits: state.habits.map((h) => (h.id === action.id ? { ...h, ...action.patch } : h)),
      };
    case 'deleteHabit': {
      const completions = { ...state.completions };
      delete completions[action.id];
      return { ...state, habits: state.habits.filter((h) => h.id !== action.id), completions };
    }
    case 'toggle': {
      const days = { ...(state.completions[action.id] ?? {}) };
      if (days[action.date]) delete days[action.date];
      else days[action.date] = true;
      return { ...state, completions: { ...state.completions, [action.id]: days } };
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
