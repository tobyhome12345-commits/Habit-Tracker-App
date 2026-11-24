import { addDays } from '../lib/dates';
import { currentStreak } from '../lib/streaks';
import type { AppState, DateKey } from '../lib/types';
import { growthStage, type PipMood, type PipStage } from './pip';

export interface DayContext {
  done: number;
  total: number;
  hour: number;
  /** A streak of 3+ days ended yesterday. */
  lostStreak: boolean;
  today: DateKey;
}

/** How Pip feels about your day. */
export function pipMood(c: DayContext): PipMood {
  if (c.total === 0) return 'wave';
  if (c.done === c.total) return 'celebrate';
  if (c.hour >= 22 || c.hour < 5) return 'sleepy';
  if (c.done === 0 && !c.lostStreak) return 'happy';
  return 'encourage';
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

/** What Pip says in the speech bubble. */
export function pipMessage(c: DayContext, mood: PipMood): string {
  const left = c.total - c.done;
  const seed = c.today + mood + left;
  switch (mood) {
    case 'wave':
      return 'Hi, I’m Pip! I grow when you do 🌱';
    case 'celebrate':
      return pick(['Perfect day! I’m doing my happy dance 💃', 'Every single one! So proud of you 🥹', 'All done! You’re unstoppable 🌟', 'Clean sweep! Time to relax 😎'], seed);
    case 'sleepy':
      return left === 1
        ? 'Yawn… just one more, then bed? 😴'
        : pick(['Yawn… still time for a tiny habit before bed 😴', 'Nearly bedtime. One quick win first? 🌙'], seed);
    case 'happy':
      return {
        morning: pick(['Morning! Let’s grow something today 🌱', 'Rise and shine! Ready when you are ☀️'], seed),
        afternoon: pick(['Hey you! Got a minute for a habit? ☀️', 'Afternoon! Let’s get one on the board 💫'], seed),
        evening: pick(['Evening! There’s still time ✨', 'Hey! A tiny habit before dinner? 🍽️'], seed),
      }[partOfDay(c.hour)];
    case 'encourage':
      if (c.done === 0) return 'Streaks restart, and that’s okay. Let’s begin again 🌱';
      return left === 1
        ? pick(['Just ONE left! You’ve got this 💪', 'So close! One more for a perfect day ⭐'], seed)
        : pick([`Nice! ${left} to go. Keep it rolling 🚀`, `Look at you go! Just ${left} left 💪`, `${c.done} down, ${left} to go. You’ve got this ✨`], seed);
  }
}

export function dayContext(state: AppState, today: DateKey, hour: number): DayContext {
  const yesterday = addDays(today, -1);
  let done = 0;
  let lostStreak = false;
  for (const h of state.habits) {
    const d = state.completions[h.id];
    if (d?.[today]) done++;
    else if (!d?.[yesterday] && currentStreak(d, yesterday) >= 3) lostStreak = true;
  }
  return { done, total: state.habits.length, hour, lostStreak, today };
}

export const GROWTH_STEPS = [3, 7, 14, 30];
/** How Pip changes when reaching each stage (index = stage). */
export const GROW_PHRASES = ['', 'sprouts', 'grows into a sapling', 'grows a flower bud', 'blooms into a sunflower 🌻'];
/** Badge for each evolution stage. */
export const STAGE_BADGES = ['🌰 Seed', '🌱 Sprout', '🌿 Sapling', '🌷 Bud', '🌻 Bloom'];

export interface Growth {
  stage: PipStage;
  best: number;
  /** Streak needed for the next stage, or null at full bloom. */
  next: number | null;
}

/** Pip's growth follows your best current streak across all habits. */
export function pipGrowth(state: AppState, today: DateKey): Growth {
  let best = 0;
  for (const h of state.habits) best = Math.max(best, currentStreak(state.completions[h.id], today));
  return { stage: growthStage(best), best, next: GROWTH_STEPS.find((s) => s > best) ?? null };
}

export const MILESTONES = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 365];

export function isMilestone(streak: number): boolean {
  return MILESTONES.includes(streak);
}
