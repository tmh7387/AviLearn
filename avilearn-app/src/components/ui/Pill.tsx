interface PillProps {
  kind?: 'success' | 'warn' | 'danger' | 'info' | 'brand' | 'neutral';
  children: React.ReactNode;
}

export function Pill({ kind = 'neutral', children }: PillProps) {
  return <span className={`pill pill-${kind}`}>{children}</span>;
}

export function TagPill({ kind = 'neutral', children }: PillProps) {
  return <span className={`pill tag pill-${kind}`}>{children}</span>;
}
