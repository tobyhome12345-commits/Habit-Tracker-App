import { useEffect } from 'react';
import { Pip } from './Pip';
import { GROW_PHRASES } from '../mascot/mood';
import type { PipStage } from '../mascot/pip';
import type { Habit } from '../lib/types';

export interface Milestone {
  key: string;
  habit: Habit;
  streak: number;
  stage: PipStage;
  grew: boolean;
}

function headline(streak: number): string {
  if (streak === 3) return '3-day streak! You’re on a roll 🔥';
  if (streak === 7) return 'One whole week! 🔥';
  if (streak === 14) return 'Two weeks strong! 💪';
  if (streak === 21) return '21 days! That’s a real habit now 🧠';
  if (streak === 30) return '30 days! Legendary 🏆';
  if (streak === 365) return 'ONE YEAR! Pip is speechless 🥹';
  return `${streak}-day streak! Incredible 🌟`;
}

/** Non-blocking celebration that slides in from the top and leaves on its own. */
export function MilestoneToast({ m, onDone }: { m: Milestone; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4200);
    return () => clearTimeout(t);
  }, [m.key, onDone]);

  return (
    <div className="toast-layer" aria-live="polite">
      <button key={m.key} className="toast" onClick={onDone} aria-label={`${headline(m.streak)} ${m.habit.name}. Tap to dismiss.`}>
        <span className="toast-pip">
          <Pip mood="celebrate" stage={m.stage} size={64} />
        </span>
        <span className="toast-text">
          <span className="toast-title">{headline(m.streak)}</span>
          <span className="toast-sub">
            {m.habit.emoji} {m.habit.name}
            {m.grew ? ` · Pip ${GROW_PHRASES[m.stage]}!` : ''}
          </span>
        </span>
      </button>
    </div>
  );
}
