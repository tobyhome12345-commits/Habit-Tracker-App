import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Download, Trash2, Upload, X } from 'lucide-react';
import { Tick } from './Tick';
import { AccentPicker } from './AccentPicker';
import { HabitSettings } from './HabitSettings';
import { Sheet } from './Sheet';
import { useStore } from '../lib/store';
import { defaultState } from '../lib/storage';
import { exportBackup, parseBackup } from '../lib/backup';
import type { AppState, ThemePref } from '../lib/types';

type Msg = { kind: 'ok' | 'error'; text: string } | null;

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const { settings } = state;
  const [version, setVersion] = useState('web preview');
  const [pendingImport, setPendingImport] = useState<AppState | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) CapApp.getInfo().then((i) => setVersion(`v${i.version}`));
  }, []);

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
            <p className="field-label">Accent colour</p>
            <AccentPicker />
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

            <p className="section-title">Habits</p>
            <HabitSettings />

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
                setMsg({ kind: 'ok', text: 'All habits deleted. Fresh start! ✓' });
              }}
            >
              <Trash2 size={18} /> {confirmReset ? 'Tap again to delete ALL habits' : 'Reset everything'}
            </button>

            <div className="about">
              <Tick mood="proud" stage={4} size={56} still />
              <p>
                <b>Habit Tracker</b> {version}
                <br />
                Cheered on by Tick ✓ Free forever. No ads, no account, no subscription.
              </p>
            </div>
          </div>
        </>
      )}
    </Sheet>
  );
}

