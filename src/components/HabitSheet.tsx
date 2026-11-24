import { useState } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { Sheet } from './Sheet';
import { DEFAULT_HABIT_COLOR, HABIT_COLORS, alpha, onColor } from '../lib/colors';
import { EMOJIS, QUICK_PICKS, firstGrapheme } from '../lib/emojis';
import { useStore } from '../lib/store';
import { remindersSupported, requestNotificationPermission } from '../lib/reminders';
import type { Habit } from '../lib/types';

interface Props {
  habit?: Habit;
  onClose: () => void;
}

export function HabitSheet({ habit, onClose }: Props) {
  const { dispatch } = useStore();
  const [name, setName] = useState(habit?.name ?? '');
  const [emoji, setEmoji] = useState(habit?.emoji ?? '💧');
  const [color, setColor] = useState(habit?.color ?? DEFAULT_HABIT_COLOR);
  const [reminderOn, setReminderOn] = useState(habit?.reminder.enabled ?? false);
  const [time, setTime] = useState(habit?.reminder.time ?? '20:00');
  const [customEmoji, setCustomEmoji] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reminderNote, setReminderNote] = useState('');

  const toggleReminder = async () => {
    if (reminderOn) {
      setReminderOn(false);
      setReminderNote('');
      return;
    }
    setReminderOn(true);
    if (!remindersSupported) {
      setReminderNote('Reminders pop up in the Android app 📱');
      return;
    }
    const perm = await requestNotificationPermission();
    setReminderNote(perm === 'granted' ? '' : 'Notifications are blocked. Allow them in Android Settings › Apps › Habit Tracker › Notifications.');
  };

  const trimmed = name.trim();
  const isNew = !habit;

  return (
    <Sheet onClose={onClose} label={isNew ? 'New habit' : 'Edit habit'}>
      {(close) => {
        const save = () => {
          if (!trimmed) return;
          const data = { name: trimmed, emoji, color, reminder: { enabled: reminderOn, time } };
          if (habit) dispatch({ type: 'updateHabit', id: habit.id, patch: data });
          else dispatch({ type: 'addHabit', habit: data });
          close();
        };
        return (
          <>
            <div className="sheet-head">
              <h2>{isNew ? 'New habit' : 'Edit habit'}</h2>
              <button className="icon-btn plain" onClick={close} aria-label="Close">
                <X size={22} />
              </button>
            </div>

            <div className="sheet-body">
              <div className="habit-preview" style={{ background: alpha(color, 0.14) }}>
                <span className="emoji-bubble lg" style={{ background: alpha(color, 0.25) }}>
                  {emoji}
                </span>
                <span className="habit-preview-name" style={{ color: trimmed ? undefined : 'var(--text-3)' }}>
                  {trimmed || 'Your new habit'}
                </span>
              </div>

              {isNew && !trimmed && (
                <>
                  <p className="field-label">Quick picks</p>
                  <div className="chips scroll-x">
                    {QUICK_PICKS.map((q) => (
                      <button
                        key={q.name}
                        className="chip"
                        onClick={() => {
                          setName(q.name);
                          setEmoji(q.emoji);
                          setColor(q.color);
                        }}
                      >
                        <span>{q.emoji}</span> {q.name}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <label className="field-label" htmlFor="habit-name">
                Name
              </label>
              <input
                id="habit-name"
                className="text-input"
                placeholder="e.g. Drink 8 glasses of water"
                value={name}
                maxLength={40}
                autoComplete="off"
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && save()}
              />

              <p className="field-label">Emoji</p>
              <div className="emoji-grid">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    className={`emoji-opt${emoji === e ? ' selected' : ''}`}
                    style={emoji === e ? { background: alpha(color, 0.22), borderColor: color } : undefined}
                    onClick={() => setEmoji(e)}
                    aria-label={`Emoji ${e}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <input
                className="text-input small"
                placeholder="…or type any emoji here ✨"
                value={customEmoji}
                onChange={(e) => {
                  setCustomEmoji(e.target.value);
                  const g = firstGrapheme(e.target.value);
                  if (g) setEmoji(g);
                }}
              />

              <p className="field-label">Colour</p>
              <div className="color-grid">
                {HABIT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    className={`color-opt${color === c.value ? ' selected' : ''}`}
                    style={{ background: c.value, color: c.value }}
                    onClick={() => setColor(c.value)}
                    aria-label={c.name}
                    aria-pressed={color === c.value}
                  >
                    {color === c.value && <Check size={20} strokeWidth={3} color={onColor(c.value)} />}
                  </button>
                ))}
              </div>

              <div className="setting-row card-inset">
                <span className="setting-icon" style={{ color }}>
                  <Bell size={20} />
                </span>
                <div className="setting-text">
                  <span className="setting-title">Daily reminder</span>
                  <span className="setting-sub">{reminderOn ? 'Pip will nudge you every day 🌱' : 'Off'}</span>
                </div>
                <button
                  className={`switch${reminderOn ? ' on' : ''}`}
                  style={reminderOn ? { background: color } : undefined}
                  role="switch"
                  aria-checked={reminderOn}
                  aria-label="Daily reminder"
                  onClick={toggleReminder}
                >
                  <span />
                </button>
              </div>
              {reminderOn && (
                <div className="time-row">
                  <label htmlFor="reminder-time">Remind me at</label>
                  <input id="reminder-time" type="time" className="time-input" value={time} onChange={(e) => setTime(e.target.value || '20:00')} />
                </div>
              )}
              {reminderOn && reminderNote && <p className="reminder-note">{reminderNote}</p>}
            </div>

            <div className="sheet-foot">
              {!isNew &&
                (confirmDelete ? (
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      dispatch({ type: 'deleteHabit', id: habit.id });
                      close();
                    }}
                  >
                    <Trash2 size={18} /> Tap again to delete
                  </button>
                ) : (
                  <button className="btn btn-danger" onClick={() => setConfirmDelete(true)} aria-label="Delete habit">
                    <Trash2 size={18} />
                  </button>
                ))}
              <button className="btn btn-primary grow" disabled={!trimmed} onClick={save} style={{ background: color, color: onColor(color) }}>
                {isNew ? 'Add habit' : 'Save changes'}
              </button>
            </div>
          </>
        );
      }}
    </Sheet>
  );
}
