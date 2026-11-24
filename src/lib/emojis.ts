export const EMOJIS = [
  '💧', '🏃', '📚', '🧘', '💪', '🥗', '😴', '🦷',
  '✍️', '🎸', '🎨', '💻', '🧹', '🌱', '🚶', '🚴',
  '🏊', '⚽', '🏀', '🎮', '📵', '☀️', '🍎', '🥦',
  '💊', '🧠', '🙏', '❤️', '😊', '📝', '🎯', '⭐',
  '🐶', '🌳', '🛏️', '🚿', '🧴', '🎧', '📖', '🇪🇸',
];

export const QUICK_PICKS = [
  { name: 'Drink water', emoji: '💧', color: '#0ea5e9' },
  { name: 'Read 10 pages', emoji: '📚', color: '#f59e0b' },
  { name: 'Exercise', emoji: '🏃', color: '#22c55e' },
  { name: 'Meditate', emoji: '🧘', color: '#8b5cf6' },
  { name: 'Sleep by 10pm', emoji: '😴', color: '#3b82f6' },
  { name: 'Practice guitar', emoji: '🎸', color: '#f43f5e' },
];

/** First user-perceived character of a string (handles multi-codepoint emoji). */
export function firstGrapheme(s: string): string {
  const t = s.trim();
  if (!t) return '';
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    for (const { segment } of seg.segment(t)) return segment;
  }
  return Array.from(t)[0];
}
