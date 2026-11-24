/** A local calendar day formatted as 'YYYY-MM-DD'. */
export type DateKey = string;

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  createdAt: DateKey;
}

export type ThemePref = 'system' | 'light' | 'dark';

export interface Settings {
  theme: ThemePref;
  /** 0 = Sunday, 1 = Monday */
  weekStart: 0 | 1;
}

/** completions[habitId][dateKey] === true when the habit was done that day */
export type Completions = Record<string, Record<DateKey, true>>;

export interface AppState {
  version: 1;
  habits: Habit[];
  completions: Completions;
  settings: Settings;
}
