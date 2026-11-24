import { currentStreak } from '../lib/streaks';
import type { AppState, DateKey } from '../lib/types';
import { tickStage, type TickMood, type TickStage } from './tick';

export const MILESTONES = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 365];

export function isMilestone(streak: number): boolean {
  return MILESTONES.includes(streak);
}

/** A streak this long, still unticked by this hour, counts as "at risk". */
export const AT_RISK_STREAK = 3;
export const AT_RISK_HOUR = 18;

export interface DayContext {
  done: number;
  total: number;
  hour: number;
  today: DateKey;
  /** Longest streak on a habit that isn't done yet today (0 if none). */
  atRisk: number;
  /** Name of that habit. */
  atRiskName: string;
  /** A streak milestone hit today (0 if none). */
  milestone: number;
}

/** How Tick feels about your day. */
export function tickMood(c: DayContext): TickMood {
  if (c.total === 0) return 'happy';
  if (c.done === c.total) return 'celebrate';
  if (c.milestone > 0) return 'proud';
  if (c.atRisk >= AT_RISK_STREAK && c.hour >= AT_RISK_HOUR) return 'encourage';
  if (c.done === 0) return 'sleepy';
  return 'happy';
}

/** Small stable hash so the message only changes once a day (no flicker between renders). */
function pick<T>(list: T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return list[Math.abs(h) % list.length];
}

function partOfDay(hour: number): 'morning' | 'afternoon' | 'evening' {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

export function greeting(hour: number): string {
  if (hour >= 22 || hour < 5) return 'Up late?';
  return { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening' }[partOfDay(hour)];
}

/** What Tick says in the speech bubble: playful, short, a bit cheeky. */
export function tickMessage(c: DayContext, mood: TickMood): string {
  const left = c.total - c.done;
  const seed = c.today + mood + left;
  if (c.total === 0) return 'Hi, I’m Tick! Give me something to check off 👋';
  switch (mood) {
    case 'celebrate':
      return pick(['ALL DONE?! I’m literally jumping 🎉', 'Every box ticked. Show-off 😏', 'Perfect day! Tick-tastic ✓✓✓', 'Clean sweep! Take a bow 🙌'], seed);
    case 'proud':
      return pick([`${c.milestone} days?! Okay, legend 😤`, `A ${c.milestone}-day streak. I’m not crying, you are 🥹`, `${c.milestone} days in a row. Look at you go ✨`], seed);
    case 'encourage':
      return pick(
        [`Your ${c.atRisk}-day streak is sweating. Save it! 💪`, `Psst… ${c.atRiskName} is waiting. Don’t break the chain!`, `${c.atRisk} days on the line. You’ve got this 👊`],
        seed,
      );
    case 'sleepy':
      return {
        morning: pick(['Yawn… is it habit o’clock already? 😴', '*stretches* One tick and I’m awake ☀️'], seed),
        afternoon: pick(['Zzz… poke me with a tick? 💤', 'Still on snooze. One tick wakes me up!'], seed),
        evening: pick(['Yawn… one tiny tick before bed? 🌙', 'I’m sleepy, but I’ll stay up for one tick 😴'], seed),
      }[partOfDay(c.hour)];
    case 'happy':
    default:
      return left === 1
        ? pick(['One left. Don’t leave me hanging! ✓', 'Last one! Then we party 🎉', 'So close I can taste it. One more!'], seed)
        : pick([`${c.done} down, ${left} to go. Easy, right? 😏`, `Nice tick! ${left} more and I’ll do a flip`, `Ooh, momentum! ${left} left, keep ticking ✓`, `You’re on a roll. ${left} to go, no pressure 😎`], seed);
  }
}

export function dayContext(state: AppState, today: DateKey, hour: number): DayContext {
  let done = 0;
  let atRisk = 0;
  let atRiskName = '';
  let milestone = 0;
  for (const h of state.habits) {
    const d = state.completions[h.id];
    // currentStreak counts from yesterday when today isn't done yet
    const streak = currentStreak(d, today);
    if (d?.[today]) {
      done++;
      if (isMilestone(streak)) milestone = Math.max(milestone, streak);
    } else if (streak > atRisk) {
      atRisk = streak;
      atRiskName = h.name;
    }
  }
  return { done, total: state.habits.length, hour, today, atRisk, atRiskName, milestone };
}

export const LEVEL_STEPS = [3, 7, 14, 30];
/** Badge for each level (index = stage). */
export const STAGE_BADGES = ['✏️ Faint', '🎨 Fresh', '💪 Bold', '✨ Golden', '👑 Legend'];
/** What happens to Tick when he reaches each level. */
export const LEVEL_UP = ['', 'is filling up with colour', 'went Bold', 'turned Golden', 'is a LEGEND'];

export interface Level {
  stage: TickStage;
  best: number;
  /** Streak needed for the next level, or null at Legend. */
  next: number | null;
}

/** Tick levels up with your best current streak across all habits. */
export function tickLevel(state: AppState, today: DateKey): Level {
  let best = 0;
  for (const h of state.habits) best = Math.max(best, currentStreak(state.completions[h.id], today));
  return { stage: tickStage(best), best, next: LEVEL_STEPS.find((s) => s > best) ?? null };
}
