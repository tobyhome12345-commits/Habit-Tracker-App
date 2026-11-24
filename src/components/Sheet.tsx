import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { pushBack } from '../lib/backStack';

interface Props {
  onClose: () => void;
  label: string;
  children: (close: () => void) => ReactNode;
}

/** Bottom sheet that slides up on mount and animates out before calling onClose. */
export function Sheet({ onClose, label, children }: Props) {
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    setTimeout(onClose, 200);
  }, [onClose]);

  useEffect(() => pushBack(close), [close]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [close]);

  return createPortal(
    <div className={`sheet-root${closing ? ' closing' : ''}`}>
      <div className="sheet-scrim" onClick={close} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={label}>
        <div className="sheet-grabber" />
        {children(close)}
      </div>
    </div>,
    document.body,
  );
}
