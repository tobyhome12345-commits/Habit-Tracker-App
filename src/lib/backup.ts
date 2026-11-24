import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { normalizeState } from './storage';
import { todayKey } from './dates';
import type { AppState } from './types';

/** Saves a JSON backup: native → share sheet (Drive, Files, email…), web → file download. */
export async function exportBackup(state: AppState): Promise<void> {
  const data = JSON.stringify({ app: 'habit-tracker', exportedAt: new Date().toISOString(), ...state }, null, 2);
  const name = `habit-tracker-backup-${todayKey()}.json`;
  if (Capacitor.isNativePlatform()) {
    const file = await Filesystem.writeFile({ path: name, data, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: 'Habit Tracker backup', files: [file.uri], dialogTitle: 'Save your backup' });
    return;
  }
  const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Parses and validates a backup file. Throws a friendly error if it isn't one. */
export function parseBackup(text: string): AppState {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('That file isn’t a Habit Tracker backup.');
  }
  try {
    return normalizeState(raw);
  } catch {
    throw new Error('That file isn’t a Habit Tracker backup.');
  }
}
