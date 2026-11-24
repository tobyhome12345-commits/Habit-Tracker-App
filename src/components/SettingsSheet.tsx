import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Bell, BellOff, Clock, Download, Trash2, Upload, X } from 'lucide-react';
import { Pip } from './Pip';
import { Sheet } from './Sheet';
import { useStore } from '../lib/store';
import { defaultState } from '../lib/storage';
import { exportBackup, parseBackup } from '../lib/backup';
import {
  exactAlarmsAllowed,
  notificationPermission,
  openExactAlarmSettings,
  requestNotificationPermission,
  syncReminders,
  type PermissionState,
} from '../lib/reminders';
import { todayKey } from '../lib/dates';
import type { AppState, ThemePref } from '../lib/types';

type Msg = { kind: 'ok' | 'error'; text: string } | null;

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const { settings } = state;
  const [perm, setPerm] = useState<PermissionState>('unsupported');
  const [exact, setExact] = useState(true);
  const [version, setVersion] = useState('web preview');
  const [pendingImport, setPendingImport] = useState<AppState | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refreshPerms = () => {
    notificationPermission().then(setPerm);
    exactAlarmsAllowed().then(setExact);
  };

  useEffect(() => {
    refreshPerms();
    if (Capacitor.isNativePlatform()) CapApp.getInfo().then((i) => setVersion(`v${i.version}`));
    // Coming back from Android settings → re-check.
    const onVis = () => document.visibilityState === 'visible' && refreshPerms();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const reminderCount = state.habits.filter((h) => h.reminder.enabled).length;

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const next = parseBackup(await file.text());
      setPendingImport(next);
      setMsg(null);
    } catch (err) {
      setMsg({ kind: 'error', text: (err as Error).message });
    }
  };

  return (
    <Sheet onClose={onClose} label="Settings">
      {(close) => (
        <>
          <div className="sheet-head">
            <h2>Settings</h2>
            <button className="icon-btn plain" onClick={close} aria-label="Close">
              <X size={22} />
            </button>
          </div>
          <div className="sheet-body settings">
            <p className="section-title first">Appearance</p>
            <p className="field-label">Theme</p>
            <div className="segmented" role="radiogroup" aria-label="Theme">
              {(['system', 'light', 'dark'] as ThemePref[]).map((t) => (
                <button
                  key={t}
                  role="radio"
                  aria-checked={settings.theme === t}
                  className={settings.theme === t ? 'active' : undefined}
                  onClick={() => dispatch({ type: 'settings', patch: { theme: t } })}
                >
                  {t === 'system' ? '📱 Auto' : t === 'light' ? '☀️ Light' : '🌙 Dark'}
                </button>
              ))}
            </div>
            <p className="field-label">Week starts on</p>
            <div className="segmented" role="radiogroup" aria-label="Week starts on">
              {([1, 0] as const).map((d) => (
                <button
                  key={d}
                  role="radio"
                  aria-checked={settings.weekStart === d}
                  className={settings.weekStart === d ? 'active' : undefined}
                  onClick={() => dispatch({ type: 'settings', patch: { weekStart: d } })}
                >
                  {d === 1 ? 'Monday' : 'Sunday'}
                </button>
              ))}
            </div>

            <p className="section-title">Reminders</p>
            <div className="settings-group">
              <div className="setting-row">
                <span className="setting-icon">{perm === 'denied' ? <BellOff size={20} /> : <Bell size={20} />}</span>
                <div className="setting-text">
                  <span className="setting-title">Notifications</span>
                  <span className="setting-sub">
                    {perm === 'unsupported'
                      ? 'Reminders work in the Android app 📱'
                      : perm === 'granted'
                        ? `Allowed · ${reminderCount} habit${reminderCount === 1 ? '' : 's'} with reminders`
                        : perm === 'denied'
                          ? 'Blocked — allow in Android Settings › Apps › Habit Tracker'
                          : 'Not allowed yet'}
                  </span>
                </div>
                {perm === 'prompt' && (
                  <button
                    className="btn btn-soft small"
                    onClick={async () => {
                      const p = await requestNotificationPermission();
                      setPerm(p);
                      if (p === 'granted') syncReminders(state, todayKey()).catch(() => {});
                    }}
                  >
                    Allow
                  </button>
                )}
              </div>
              {perm === 'granted' && !exact && (
                <button className="setting-row" onClick={() => openExactAlarmSettings().then(refreshPerms)}>
                  <span className="setting-icon">
                    <Clock size={20} />
                  </span>
                  <span className="setting-text">
                    <span className="setting-title">On-time reminders</span>
                    <span className="setting-sub">Android may delay reminders a little. Tap to allow exact timing.</span>
                  </span>
                </button>
              )}
            </div>
            <p className="settings-note">Set a reminder time for each habit by tapping it on the Today screen.</p>

            <p className="section-title">Your data</p>
            <p className="settings-note top">
              Everything is saved <b>only on this phone</b>: no account, no cloud, no tracking. Export a backup now and then so you never lose
              your streaks (e.g. when you get a new phone).
            </p>
            <div className="btn-row">
              <button className="btn btn-soft grow" onClick={() => exportBackup(state).catch((e) => setMsg({ kind: 'error', text: `Export failed: ${e.message ?? e}` }))}>
                <Download size={18} /> Export
              </button>
              <button className="btn btn-soft grow" onClick={() => fileRef.current?.click()}>
                <Upload size={18} /> Import
              </button>
              <input ref={fileRef} type="file" hidden onChange={onFile} />
            </div>
            {pendingImport && (
              <div className="confirm-box">
                <p>
                  Replace everything with this backup? It has <b>{pendingImport.habits.length}</b> habit{pendingImport.habits.length === 1 ? '' : 's'}.
                </p>
                <div className="btn-row">
                  <button className="btn btn-soft grow" onClick={() => setPendingImport(null)}>
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary grow"
                    onClick={() => {
                      dispatch({ type: 'load', state: pendingImport });
                      setPendingImport(null);
                      setMsg({ kind: 'ok', text: 'Backup restored! 🎉' });
                    }}
                  >
                    Replace
                  </button>
                </div>
              </div>
            )}
            {msg && <p className={`settings-msg ${msg.kind}`}>{msg.text}</p>}

            <button
              className="btn btn-danger btn-block reset-btn"
              onClick={() => {
                if (!confirmReset) return setConfirmReset(true);
                dispatch({ type: 'load', state: { ...defaultState(), settings } });
                setConfirmReset(false);
                setMsg({ kind: 'ok', text: 'All habits deleted. Fresh start! 🌱' });
              }}
            >
              <Trash2 size={18} /> {confirmReset ? 'Tap again to delete ALL habits' : 'Reset everything'}
            </button>

            <div className="about">
              <Pip mood="happy" stage={4} size={56} still />
              <p>
                <b>Habit Tracker</b> {version}
                <br />
                Grown with love by Pip 🌱 Free forever. No ads, no account, no subscription.
              </p>
            </div>
          </div>
        </>
      )}
    </Sheet>
  );
}

