export const HABIT_COLORS = [
  { name: 'Coral', value: '#ff6b5b' },
  { name: 'Tangerine', value: '#ff8f3f' },
  { name: 'Sunflower', value: '#f5b52e' },
  { name: 'Moss', value: '#8cbf3f' },
  { name: 'Leaf', value: '#3dbe7e' },
  { name: 'Lagoon', value: '#22b8b0' },
  { name: 'Sky', value: '#3aa5f2' },
  { name: 'Iris', value: '#6f7cf7' },
  { name: 'Plum', value: '#a970f0' },
  { name: 'Rose', value: '#f25c9a' },
] as const;

export const DEFAULT_HABIT_COLOR = '#3dbe7e';

/** v1.0.x palette → "garden" palette, so habits made before the redesign restyle automatically. */
export const LEGACY_COLOR_MAP: Record<string, string> = {
  '#8b5cf6': '#a970f0',
  '#3b82f6': '#6f7cf7',
  '#0ea5e9': '#3aa5f2',
  '#14b8a6': '#22b8b0',
  '#22c55e': '#3dbe7e',
  '#84cc16': '#8cbf3f',
  '#f59e0b': '#f5b52e',
  '#f97316': '#ff8f3f',
  '#f43f5e': '#ff6b5b',
  '#ec4899': '#f25c9a',
};

/** Hex colour → rgba() with the given alpha. */
export function alpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/** Readable text colour (near-black or white) to put on top of a solid habit colour. */
export function onColor(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  // White when it reaches 3:1 (WCAG level for bold text and icons), otherwise near-black.
  return 1.05 / (L + 0.05) >= 3 ? '#ffffff' : '#16141f';
}
