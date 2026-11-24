import { Preferences } from '@capacitor/preferences';
import { todayKey } from './dates';
import { DEFAULT_HABIT_COLOR, LEGACY_COLOR_MAP } from './colors';
import type { AppState, Habit } from './types';

const KEY = 'habit-tracker-state';

export function defaultState(): AppState {
  return { version: 1, habits: [], completions: {}, settings: { theme: 'system', weekStart: 1 } };
}

function migrateColor(c: unknown): string {
  const hex = String(c).toLowerCase();
  if (!/^#[0-9a-f]{6}$/.test(hex)) return DEFAULT_HABIT_COLOR;
  return LEGACY_COLOR_MAP[hex] ?? hex;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Validates and repairs anything loaded from storage or a backup file. Throws if it isn't our data at all. */
export function normalizeState(raw: unknown): AppState {
  if (!isObj(raw) || !Array.isArray(raw.habits)) throw new Error('Not a Habit Tracker backup');
  const base = defaultState();
  const habits: Habit[] = raw.habits.filter(isObj).map((h) => ({
    id: String(h.id ?? crypto.randomUUID()),
    name: String(h.name ?? 'Habit').slice(0, 60),
    emoji: String(h.emoji ?? '⭐'),
    color: migrateColor(h.color),
    createdAt: /^\d{4}-\d{2}-\d{2}$/.test(String(h.createdAt)) ? String(h.createdAt) : todayKey(),
    reminder: {
      enabled: isObj(h.reminder) ? !!h.reminder.enabled : false,
      time: isObj(h.reminder) && /^\d{2}:\d{2}$/.test(String(h.reminder.time)) ? String(h.reminder.time) : '20:00',
    },
  }));
  const completions: AppState['completions'] = {};
  if (isObj(raw.completions)) {
    for (const h of habits) {
      const days = raw.completions[h.id];
      if (!isObj(days)) continue;
      completions[h.id] = {};
      for (const d of Object.keys(days)) if (/^\d{4}-\d{2}-\d{2}$/.test(d) && days[d]) completions[h.id][d] = true;
    }
  }
  const s = isObj(raw.settings) ? raw.settings : {};
  return {
    version: 1,
    habits,
    completions,
    settings: {
      theme: s.theme === 'light' || s.theme === 'dark' ? s.theme : base.settings.theme,
      weekStart: s.weekStart === 0 ? 0 : 1,
    },
  };
}

export async function loadState(): Promise<AppState> {
  try {
    const { value } = await Preferences.get({ key: KEY });
    return value ? normalizeState(JSON.parse(value)) : defaultState();
  } catch (e) {
    console.error('Failed to load saved data', e);
    return defaultState();
  }
}

export async function saveState(state: AppState): Promise<void> {
  await Preferences.set({ key: KEY, value: JSON.stringify(state) });
}
