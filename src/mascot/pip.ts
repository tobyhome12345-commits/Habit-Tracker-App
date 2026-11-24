/**
 * Pip, the seed sprout 🌱: the app's mascot.
 *
 * A round sunflower-yellow seed with a sprout on its head that grows with your streaks.
 * Drawn as plain SVG markup (no React) so the same artwork powers the in-app component,
 * the app icon, the splash screen and notification images.
 *
 * Only erasable TypeScript syntax here: Node can run this file directly to render assets.
 */

export type PipMood = 'happy' | 'celebrate' | 'encourage' | 'sleepy' | 'wave';
/** 0 seedling · 1 two leaves · 2 bigger leaves · 3 bud · 4 flower */
export type PipStage = 0 | 1 | 2 | 3 | 4;

export interface PipOptions {
  mood?: PipMood;
  stage?: PipStage;
  /** Unique prefix for gradient ids when several Pips share a page. */
  id?: string;
  /** Hide the ground shadow (e.g. for icons). */
  shadow?: boolean;
  /** Render as a flat single-colour silhouette (Android themed / notification icons). */
  silhouette?: string;
  /**
   * Sticker rim drawn behind the figure in `currentColor`, coloured by the CSS variable
   * `--pip-rim`. Keeps the ink outline readable on dark backgrounds.
   * Pass a colour string to bake the rim colour in (static images).
   */
  rim?: boolean | string;
}

export const PIP_COLORS = {
  ink: '#221c2e',
  sunLight: '#ffe07a',
  sun: '#ffc845',
  sunDeep: '#f5a524',
  arm: '#f9bb33',
  cheek: '#ff8a6b',
  leaf: '#5bd08f',
  stem: '#2e9e62',
  bud: '#ff7a59',
  petal: '#ff8fa3',
  tongue: '#ff7a8a',
  zzz: '#9a8fb0',
};

const C = PIP_COLORS;
const OUT = 4.5; // outline width
const BODY = 'M100 66 C138 66 160 100 160 134 C160 165 133 184 100 184 C67 184 40 165 40 134 C40 100 62 66 100 66 Z';

const ARMS = {
  leftDown: 'M53 138 Q40 147 37 160',
  rightDown: 'M147 138 Q160 147 163 160',
  leftUp: 'M52 122 Q38 108 32 90',
  rightUp: 'M148 122 Q162 108 168 90',
  rightPump: 'M148 128 Q166 122 171 102',
  rightWave: 'M148 126 Q165 114 169 94',
};

/** Drawing context: `flat` draws everything in `ink`; `extra` thickens every outline (for the rim). */
interface Pen {
  ink: string;
  flat: boolean;
  extra: number;
}

function leaf(p: Pen, x: number, y: number, angle: number, len: number): string {
  const w = len * 0.42;
  const vein = p.flat ? '' : `<path d="M3 0 L${len * 0.72} 0" stroke="${p.ink}" stroke-opacity="0.35" stroke-width="2" stroke-linecap="round"/>`;
  return `<g transform="translate(${x} ${y}) rotate(${angle})">
    <path d="M0 0 Q${len * 0.5} ${-w} ${len} 0 Q${len * 0.5} ${w} 0 0 Z" fill="${p.flat ? p.ink : C.leaf}" stroke="${p.ink}" stroke-width="${OUT - 0.5 + p.extra}" stroke-linejoin="round"/>${vein}
  </g>`;
}

function sprout(p: Pen, stage: PipStage): string {
  const top = [48, 44, 38, 34, 30][stage];
  const stem = `M100 72 Q97 ${(72 + top) / 2} 100 ${top}`;
  let out = `<path d="${stem}" fill="none" stroke="${p.ink}" stroke-width="${10 + p.extra}" stroke-linecap="round"/>`;
  if (!p.flat) out += `<path d="${stem}" fill="none" stroke="${C.stem}" stroke-width="4" stroke-linecap="round"/>`;
  if (stage === 0) {
    out += leaf(p, 100, top + 3, -32, 22);
  } else if (stage === 1) {
    out += leaf(p, 100, top + 3, -28, 25) + leaf(p, 100, top + 5, -152, 22);
  } else {
    const len = stage === 2 ? 31 : 30;
    const y = stage === 2 ? top + 4 : top + 10;
    out += leaf(p, 100, y, -24, len) + leaf(p, 100, y + 2, -156, len - 2);
    if (stage === 2) out += leaf(p, 99, top + 22, -8, 15);
  }
  const sw = OUT - 0.5 + p.extra;
  if (stage === 3) {
    out += `<ellipse cx="100" cy="${top - 4}" rx="8" ry="11" fill="${p.flat ? p.ink : C.bud}" stroke="${p.ink}" stroke-width="${sw}"/>`;
    if (!p.flat) out += `<path d="M93 ${top + 3} Q100 ${top - 2} 107 ${top + 3}" fill="none" stroke="${C.stem}" stroke-width="3" stroke-linecap="round"/>`;
  }
  if (stage === 4) {
    const cy = top - 8;
    for (let i = 0; i < 5; i++) {
      const a = (i * 72 - 90) * (Math.PI / 180);
      const px = (100 + Math.cos(a) * 9).toFixed(1);
      const py = (cy + Math.sin(a) * 9).toFixed(1);
      out += `<ellipse cx="${px}" cy="${py}" rx="7" ry="9.5" transform="rotate(${i * 72} ${px} ${py})" fill="${p.flat ? p.ink : C.petal}" stroke="${p.ink}" stroke-width="${sw - 0.5}"/>`;
    }
    out += `<circle cx="100" cy="${cy}" r="6.5" fill="${p.flat ? p.ink : C.sun}" stroke="${p.ink}" stroke-width="${sw - 0.5}"/>`;
  }
  return out;
}

function arm(p: Pen, d: string): string {
  return `<path d="${d}" fill="none" stroke="${p.ink}" stroke-width="${17 + p.extra}" stroke-linecap="round"/>` +
    (p.flat ? '' : `<path d="${d}" fill="none" stroke="${C.arm}" stroke-width="8.5" stroke-linecap="round"/>`);
}

function arms(p: Pen, mood: PipMood): string {
  if (mood === 'celebrate') return arm(p, ARMS.leftUp) + arm(p, ARMS.rightUp);
  if (mood === 'encourage') return arm(p, ARMS.leftDown) + arm(p, ARMS.rightPump);
  if (mood === 'wave') return arm(p, ARMS.leftDown) + `<g class="pip-wave">${arm(p, ARMS.rightWave)}</g>`;
  return arm(p, ARMS.leftDown) + arm(p, ARMS.rightDown);
}

function face(mood: PipMood): string {
  const ink = C.ink;
  const openEye = (cx: number) =>
    `<g class="pip-eye"><ellipse cx="${cx}" cy="124" rx="7.5" ry="9.5" fill="${ink}"/><circle cx="${cx + 2.6}" cy="120" r="2.8" fill="#fff"/></g>`;
  const arcEye = (cx: number, down: boolean) =>
    `<path d="M${cx - 9} ${down ? 122 : 127} Q${cx} ${down ? 131 : 115} ${cx + 9} ${down ? 122 : 127}" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round"/>`;
  const open = (w: number, depth: number) =>
    `<path d="M${100 - w} 143 Q100 ${143 + depth} ${100 + w} 143 Z" fill="${ink}" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>` +
    `<ellipse cx="100" cy="${143 + depth * 0.36}" rx="${w * 0.42}" ry="${depth * 0.14}" fill="${C.tongue}"/>`;

  let eyes: string;
  if (mood === 'celebrate') eyes = arcEye(80, false) + arcEye(120, false);
  else if (mood === 'sleepy') eyes = arcEye(80, true) + arcEye(120, true);
  else if (mood === 'encourage') eyes = openEye(80) + arcEye(120, false);
  else eyes = openEye(80) + openEye(120);

  let mouth: string;
  if (mood === 'celebrate') mouth = open(14, 25);
  else if (mood === 'wave') mouth = open(11, 20);
  else if (mood === 'encourage') mouth = open(11, 17);
  else if (mood === 'sleepy') mouth = `<ellipse cx="100" cy="148" rx="4" ry="3.6" fill="${ink}"/>`;
  else mouth = `<path d="M90 144 Q100 155 110 144" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round"/>`;

  const cheeks = `<ellipse cx="62" cy="142" rx="10" ry="6" fill="${C.cheek}" fill-opacity="0.55"/><ellipse cx="138" cy="142" rx="10" ry="6" fill="${C.cheek}" fill-opacity="0.55"/>`;
  const shine = `<ellipse cx="70" cy="98" rx="11" ry="6.5" transform="rotate(-38 70 98)" fill="#fff" fill-opacity="0.6"/>`;
  return shine + cheeks + eyes + mouth;
}

/** The whole character (sprout, arms, feet, body, face) in one pen. */
function figure(p: Pen, mood: PipMood, stage: PipStage, gradientId: string): string {
  const droop = mood === 'sleepy' ? ' transform="rotate(24 100 70)"' : '';
  const footFill = p.flat ? p.ink : C.sunDeep;
  const sw = OUT + p.extra;
  return `<g${droop}><g class="pip-sprout">${sprout(p, stage)}</g></g>
    ${arms(p, mood)}
    <ellipse cx="80" cy="184" rx="13" ry="7" fill="${footFill}" stroke="${p.ink}" stroke-width="${sw}"/>
    <ellipse cx="120" cy="184" rx="13" ry="7" fill="${footFill}" stroke="${p.ink}" stroke-width="${sw}"/>
    <path d="${BODY}" fill="${p.flat ? p.ink : `url(#${gradientId})`}" stroke="${p.ink}" stroke-width="${sw}" stroke-linejoin="round"/>
    ${p.flat ? '' : face(mood)}`;
}

function sparkle(x: number, y: number, s: number, fill: string, delay: number): string {
  return `<g transform="translate(${x} ${y}) scale(${s})"><path class="pip-sparkle" style="animation-delay:${delay}ms" d="M0 -11 Q2 -2 11 0 Q2 2 0 11 Q-2 2 -11 0 Q-2 -2 0 -11 Z" fill="${fill}" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"/></g>`;
}

function zzz(): string {
  const z = (x: number, y: number, s: number, delay: number) =>
    `<g transform="translate(${x} ${y}) scale(${s})"><path class="pip-z" style="animation-delay:${delay}ms" d="M-6 -6 H6 L-6 6 H6" fill="none" stroke="${C.zzz}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  return z(150, 58, 1, 0) + z(165, 40, 0.8, 700) + z(178, 25, 0.6, 1400);
}

/** Returns a complete <svg> string for Pip. */
export function pipSvg(opts: PipOptions = {}): string {
  const mood = opts.mood ?? 'happy';
  const stage = opts.stage ?? 0;
  const id = opts.id ?? 'pip';
  const gradientId = `${id}-body`;

  if (opts.silhouette) {
    const p: Pen = { ink: opts.silhouette, flat: true, extra: 0 };
    return `<svg class="pip pip--${mood}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${figure(p, mood, stage, gradientId)}</svg>`;
  }

  const defs = `<defs><radialGradient id="${gradientId}" cx="0.36" cy="0.3" r="0.85">
    <stop offset="0" stop-color="${C.sunLight}"/><stop offset="0.55" stop-color="${C.sun}"/><stop offset="1" stop-color="${C.sunDeep}"/>
  </radialGradient></defs>`;
  const rimStyle = typeof opts.rim === 'string' ? `color:${opts.rim}` : 'color:var(--pip-rim, transparent)';
  const rim = opts.rim
    ? `<g class="pip-rim" style="${rimStyle}">${figure({ ink: 'currentColor', flat: true, extra: 7 }, mood, stage, gradientId)}</g>`
    : '';
  const sparkles =
    mood === 'celebrate'
      ? sparkle(30, 62, 1, C.sun, 0) + sparkle(172, 58, 0.8, C.bud, 250) + sparkle(184, 140, 0.65, C.sun, 500) + sparkle(16, 138, 0.6, C.bud, 750)
      : mood === 'encourage'
        ? sparkle(186, 88, 0.6, C.sun, 0)
        : '';
  const shadow = opts.shadow === false ? '' : `<ellipse class="pip-shadow" cx="100" cy="192" rx="44" ry="6" fill="#000" fill-opacity="0.1"/>`;

  return `<svg class="pip pip--${mood}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs}
  ${shadow}${sparkles}
  <g class="pip-hop"><g class="pip-all">${rim}${figure({ ink: C.ink, flat: false, extra: 0 }, mood, stage, gradientId)}</g></g>
  ${mood === 'sleepy' ? zzz() : ''}
</svg>`;
}

/**
 * One-colour Pip with the eyes and mouth cut out (transparent), for Android's
 * monochrome themed icon and the status-bar notification icon.
 */
export function pipKnockoutSvg(mood: PipMood = 'happy', stage: PipStage = 0, size = 200, color = '#ffffff'): string {
  const p: Pen = { ink: '#fff', flat: true, extra: 0 };
  const holes = face(mood)
    .replace(/fill="#fff" fill-opacity="0.6"/, 'fill="none"') // drop the shine
    .replace(/fill="#ff8a6b" fill-opacity="0.55"/g, 'fill="none"') // drop the cheeks
    .replace(/#ff7a8a/g, '#000') // tongue becomes part of the mouth hole
    .replace(/#221c2e/g, '#000')
    .replace(/fill="#fff"/g, 'fill="#000"'); // eye sparkles stay part of the eye hole
  return `<svg viewBox="0 0 200 200" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs><mask id="k" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200">
    <g>${figure(p, mood, stage, 'unused')}</g><g>${holes}</g>
  </mask></defs>
  <rect width="200" height="200" fill="${color}" mask="url(#k)"/>
</svg>`;
}

/** Growth stage from the best current streak across all habits. */
export function growthStage(bestCurrentStreak: number): PipStage {
  if (bestCurrentStreak >= 30) return 4;
  if (bestCurrentStreak >= 14) return 3;
  if (bestCurrentStreak >= 7) return 2;
  if (bestCurrentStreak >= 3) return 1;
  return 0;
}

export const STAGE_NAMES = ['seedling', 'two leaves', 'big leaves', 'bud', 'flower'] as const;
