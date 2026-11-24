export const EMOJIS = [
  '💧', '🏃', '📚', '🧘', '💪', '🥗', '😴', '🦷',
  '✍️', '🎸', '🎨', '💻', '🧹', '🌱', '🚶', '🚴',
  '🏊', '⚽', '🏀', '🎮', '📵', '☀️', '🍎', '🥦',
  '💊', '🧠', '🙏', '❤️', '😊', '📝', '🎯', '⭐',
  '🐶', '🌳', '🛏️', '🚿', '🧴', '🎧', '📖', '🇪🇸',
];

export const QUICK_PICKS = [
  { name: 'Drink water', emoji: '💧', color: '#3aa5f2' },
  { name: 'Read 10 pages', emoji: '📚', color: '#f5b52e' },
  { name: 'Exercise', emoji: '🏃', color: '#3dbe7e' },
  { name: 'Meditate', emoji: '🧘', color: '#a970f0' },
  { name: 'Sleep by 10pm', emoji: '😴', color: '#6f7cf7' },
  { name: 'Practice guitar', emoji: '🎸', color: '#ff6b5b' },
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
