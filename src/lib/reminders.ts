import { Capacitor } from '@capacitor/core';
import { LocalNotifications, type LocalNotificationSchema } from '@capacitor/local-notifications';
import { addDays, fromKey } from './dates';
import { currentStreak } from './streaks';
import type { AppState, DateKey } from './types';

export const remindersSupported = Capacitor.isNativePlatform();

const CHANNEL = 'habit-reminders';
/** Android caps an app at ~500 pending alarms; stay well under it. */
const MAX_PENDING = 400;
const MAX_DAYS = 30;

const NUDGES = [
  'Tiny step, big win. You’ve got this! 💪',
  'Future you says thanks 🙌',
  'Quick one before the day ends? ⏰',
  'Keep the momentum going 🚀',
  'Small habits, big results ✨',
];

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';

export async function notificationPermission(): Promise<PermissionState> {
  if (!remindersSupported) return 'unsupported';
  const { display } = await LocalNotifications.checkPermissions();
  return display === 'granted' ? 'granted' : display === 'denied' ? 'denied' : 'prompt';
}

export async function requestNotificationPermission(): Promise<PermissionState> {
  if (!remindersSupported) return 'unsupported';
  const { display } = await LocalNotifications.requestPermissions();
  return display === 'granted' ? 'granted' : display === 'denied' ? 'denied' : 'prompt';
}

/** Whether Android lets us fire at the exact minute (Android 12+ can restrict it). */
export async function exactAlarmsAllowed(): Promise<boolean> {
  if (!remindersSupported) return true;
  try {
    const r = await LocalNotifications.checkExactNotificationSetting();
    return r.exact_alarm === 'granted';
  } catch {
    return true;
  }
}

export async function openExactAlarmSettings(): Promise<void> {
  if (remindersSupported) await LocalNotifications.changeExactNotificationSetting().catch(() => {});
}

let channelReady = false;

/**
 * Re-plans every reminder from scratch. Each habit gets one notification per upcoming day
 * (instead of a single repeating one) so we can skip today once the habit is already done.
 */
export async function syncReminders(state: AppState, today: DateKey): Promise<void> {
  if (!remindersSupported) return;
  if ((await notificationPermission()) !== 'granted') return;

  if (!channelReady) {
    await LocalNotifications.createChannel({
      id: CHANNEL,
      name: 'Habit reminders',
      description: 'Daily nudges for your habits',
      importance: 4,
      visibility: 1,
      vibration: true,
    }).catch(() => {});
    channelReady = true;
  }

  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length) {
    await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
  }

  const withReminders = state.habits.filter((h) => h.reminder.enabled);
  if (!withReminders.length) return;
  const days = Math.max(1, Math.min(MAX_DAYS, Math.floor(MAX_PENDING / withReminders.length)));
  const now = Date.now();
  const notifications: LocalNotificationSchema[] = [];
  let id = 1;

  for (const h of withReminders) {
    const [hh, mm] = h.reminder.time.split(':').map(Number);
    const done = state.completions[h.id] ?? {};
    for (let i = 0; i < days; i++) {
      const day = addDays(today, i);
      if (done[day]) continue; // already ticked — no nagging
      const at = fromKey(day);
      at.setHours(hh, mm, 0, 0);
      if (at.getTime() <= now + 30_000) continue;
      const streak = i === 0 ? currentStreak(done, today) : 0;
      notifications.push({
        id: id++,
        title: `${h.emoji} ${h.name}`,
        body: streak > 1 ? `Keep your ${streak}-day streak alive! 🔥` : NUDGES[(i + h.name.length) % NUDGES.length],
        channelId: CHANNEL,
        smallIcon: 'ic_stat_notify',
        iconColor: h.color,
        autoCancel: true,
        schedule: { at, allowWhileIdle: true },
        extra: { habitId: h.id },
      });
    }
  }
  if (notifications.length) await LocalNotifications.schedule({ notifications });
}
