interface Props {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  color?: string;
  children?: React.ReactNode;
}

export function ProgressRing({ value, size = 84, stroke = 10, color = 'var(--accent)', children }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(1, Math.max(0, value)))}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.3, 1.2, 0.5, 1)' }}
        />
      </svg>
      <div className="ring-label">{children}</div>
    </div>
  );
}
