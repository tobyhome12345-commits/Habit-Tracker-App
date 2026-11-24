import { useEffect } from 'react';
import { PencilLine, Undo2 } from 'lucide-react';
import type { Habit } from '../lib/types';

export interface SnackInfo {
  key: number;
  habit: Habit;
  date: string;
  /** Count before the tap that completed it (for Undo). */
  prev: number;
}

/** "✓ Water · Add note · Undo": slides up above the tab bar and leaves on its own. */
export function Snackbar({ s, onNote, onUndo, onDone }: { s: SnackInfo; onNote: () => void; onUndo: () => void; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4500);
    return () => clearTimeout(t);
  }, [s.key, onDone]);
  return (
    <div className="snack-layer" aria-live="polite">
      <div key={s.key} className="snack" role="status">
        <span className="snack-text">
          <span aria-hidden="true">✓</span> {s.habit.emoji} {s.habit.name}
        </span>
        <button className="snack-btn" onClick={onNote}>
          <PencilLine size={16} /> Note
        </button>
        <button className="snack-btn" onClick={onUndo}>
          <Undo2 size={16} /> Undo
        </button>
      </div>
    </div>
  );
}
