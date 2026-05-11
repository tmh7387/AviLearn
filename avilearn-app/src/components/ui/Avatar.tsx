const COLORS = [
  '#2dd4bf', '#3b82f6', '#f59e0b', '#ef4444',
  '#22c55e', '#ec4899', '#8b5cf6', '#06b6d4',
];

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  seed?: number;
}

export function Avatar({ name, size = 'md', seed }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const colorIndex = seed !== undefined ? seed % COLORS.length : name.charCodeAt(0) % COLORS.length;
  const bg = COLORS[colorIndex];

  return (
    <span className={`avatar ${size}`} style={{ background: bg }}>
      {initials}
    </span>
  );
}
