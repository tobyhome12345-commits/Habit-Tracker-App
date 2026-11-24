import { memo, useId, useMemo } from 'react';
import { pipSvg, type PipMood, type PipStage } from '../mascot/pip';

interface Props {
  mood?: PipMood;
  stage?: PipStage;
  size?: number;
  /** Accessible description; omit when nearby text already says what Pip is doing. */
  label?: string;
  className?: string;
  /** Freeze animations (e.g. tiny avatars). */
  still?: boolean;
}

/** Pip the seed sprout. Pure SVG, memoised, never intercepts taps. */
export const Pip = memo(function Pip({ mood = 'happy', stage = 0, size = 96, label, className, still }: Props) {
  const rid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const html = useMemo(() => pipSvg({ mood, stage, id: `pip${rid}` }), [mood, stage, rid]);
  return (
    <span
      className={`pip-wrap${still ? ' still' : ''}${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});
