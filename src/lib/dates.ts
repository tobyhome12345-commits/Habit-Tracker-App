import type { DateKey } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar day of a Date. */
export function toKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayKey(): DateKey {
  return toKey(new Date());
}

function parts(key: DateKey): [number, number, number] {
  const [y, m, d] = key.split('-').map(Number);
  return [y, m, d];
}

/** Local-midnight Date for a key (for display formatting). */
export function fromKey(key: DateKey): Date {
  const [y, m, d] = parts(key);
  return new Date(y, m - 1, d);
}

// Day arithmetic is done in UTC so daylight-saving changes can never skip or repeat a day.
function toUTC(key: DateKey): number {
  const [y, m, d] = parts(key);
  return Date.UTC(y, m - 1, d);
}

function fromUTC(ms: number): DateKey {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

const DAY = 86_400_000;

export function addDays(key: DateKey, n: number): DateKey {
  return fromUTC(toUTC(key) + n * DAY);
}

/** Whole days from a to b (positive when b is later). */
export function diffDays(a: DateKey, b: DateKey): number {
  return Math.round((toUTC(b) - toUTC(a)) / DAY);
}

/** 0 = Sunday … 6 = Saturday */
export function weekday(key: DateKey): number {
  return new Date(toUTC(key)).getUTCDay();
}

export function startOfWeek(key: DateKey, weekStart: 0 | 1): DateKey {
  const offset = (weekday(key) - weekStart + 7) % 7;
  return addDays(key, -offset);
}

export function startOfMonth(key: DateKey): DateKey {
  return key.slice(0, 8) + '01';
}

export function daysInMonth(key: DateKey): number {
  const [y, m] = parts(key);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function endOfMonth(key: DateKey): DateKey {
  return key.slice(0, 8) + pad(daysInMonth(key));
}

export function addMonths(key: DateKey, n: number): DateKey {
  const [y, m] = parts(key);
  const total = y * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}-01`;
}

/** Inclusive list of days from `from` to `to`. */
export function eachDay(from: DateKey, to: DateKey): DateKey[] {
  const out: DateKey[] = [];
  for (let k = from; k <= to; k = addDays(k, 1)) out.push(k);
  return out;
}

export const minKey = (a: DateKey, b: DateKey) => (a < b ? a : b);
export const maxKey = (a: DateKey, b: DateKey) => (a > b ? a : b);

export function formatDate(key: DateKey, opts: Intl.DateTimeFormatOptions): string {
  return fromKey(key).toLocaleDateString(undefined, opts);
}

/** Short weekday labels starting at weekStart, e.g. ['M','T','W',…] */
export function weekdayLetters(weekStart: 0 | 1, style: 'narrow' | 'short' = 'narrow'): string[] {
  // 2023-01-01 was a Sunday
  return Array.from({ length: 7 }, (_, i) => formatDate(addDays('2023-01-01', i + weekStart), { weekday: style }));
}
