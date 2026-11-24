/**
 * Pip 🌱 → 🌻: the app's mascot.
 *
 * A sunflower seed who *evolves* as your streaks grow:
 *   0 seed → 1 sprout → 2 sapling → 3 bud → 4 bloom (a full sunflower).
 * Each stage changes his whole body (size, shape, head, arms), and five moods
 * (happy, celebrate, encourage, sleepy, wave) work on every stage.
 *
 * Modern flat-soft style: no outlines, gentle gradients, glossy capsule eyes.
 * Drawn as plain SVG markup (no React) so the same artwork powers the in-app
 * component, the app icon and the splash screen.
 * Only erasable TypeScript syntax here: Node can run this file directly.
 */

export type PipMood = 'happy' | 'celebrate' | 'encourage' | 'sleepy' | 'wave';
/** 0 seed · 1 sprout · 2 sapling · 3 bud · 4 bloom */
export type PipStage = 0 | 1 | 2 | 3 | 4;

export interface PipOptions {
  mood?: PipMood;
  stage?: PipStage;
  /** Unique prefix for gradient ids when several Pips share a page. */
  id?: string;
  /** Hide the ground shadow (e.g. for icons). */
  shadow?: boolean;
}

const INK = '#2b2238';
const ZZZ = '#a79bc4';

/** Per-stage body: growth scale, body shape, anchor points. */
interface StageSpec {
  scale: number;
  seed: boolean; // teardrop seed body vs round body
  top: number; // y where the head decoration starts
  faceDy: number; // face offset for the seed shape
  shoulderL: [number, number];
  shoulderR: [number, number];
  leafArms: boolean;
  body: [string, string, string]; // gradient stops: light, mid, deep
  feet: string;
}

const SEED_BODY = 'M100 72 C125 90 153 112 153 142 C153 168 128 185 100 185 C72 185 47 168 47 142 C47 112 75 90 100 72 Z';
const ROUND_BODY = 'M100 70 C136 70 158 100 158 134 C158 164 133 185 100 185 C67 185 42 164 42 134 C42 100 64 70 100 70 Z';

const SUN: [string, string, string] = ['#fff3b0', '#ffcd45', '#f39c1f'];
const STAGES: StageSpec[] = [
  { scale: 0.74, seed: true, top: 74, faceDy: 9, shoulderL: [53, 150], shoulderR: [147, 150], leafArms: false, body: ['#ffe9b8', '#f5bd5c', '#d98a36'], feet: '#c97c2c' },
  { scale: 0.8, seed: false, top: 72, faceDy: 0, shoulderL: [47, 142], shoulderR: [153, 142], leafArms: false, body: SUN, feet: '#e38f22' },
  { scale: 0.88, seed: false, top: 72, faceDy: 0, shoulderL: [47, 142], shoulderR: [153, 142], leafArms: true, body: SUN, feet: '#e38f22' },
  { scale: 0.95, seed: false, top: 72, faceDy: 0, shoulderL: [47, 142], shoulderR: [153, 142], leafArms: true, body: SUN, feet: '#e38f22' },
  { scale: 1, seed: false, top: 72, faceDy: 0, shoulderL: [47, 142], shoulderR: [153, 142], leafArms: true, body: SUN, feet: '#e38f22' },
];

/** Arm angles (degrees, 0 = pointing right, 90 = down) for [left, right]. */
const POSES: Record<PipMood, [number, number]> = {
  happy: [128, 52],
  sleepy: [118, 62],
  celebrate: [-138, -42],
  encourage: [128, -68],
  wave: [128, -58],
};

interface Paint {
  flat: string | null; // single colour for silhouettes, or null for full colour
  id: string;
}

const fill = (p: Paint, name: string) => (p.flat ? p.flat : `url(#${p.id}-${name})`);

function almond(len: number, w: number): string {
  return `M0 0 Q${len * 0.5} ${-w} ${len} 0 Q${len * 0.5} ${w} 0 0 Z`;
}

function leaf(p: Paint, x: number, y: number, angle: number, len: number, w: number): string {
  const vein = p.flat ? '' : `<path d="M3 0 L${(len * 0.68).toFixed(1)} 0" stroke="#fff" stroke-opacity="0.5" stroke-width="1.8" stroke-linecap="round"/>`;
  return `<g transform="translate(${x} ${y}) rotate(${angle})"><path d="${almond(len, w)}" fill="${fill(p, 'leaf')}"/>${vein}</g>`;
}

function stem(p: Paint, from: number, to: number, width: number): string {
  return `<path d="M100 ${from} Q97 ${(from + to) / 2} 100 ${to}" fill="none" stroke="${p.flat ?? '#38b26f'}" stroke-width="${width}" stroke-linecap="round"/>`;
}

/** Everything that grows out of Pip's head for a stage. */
function headGrowth(p: Paint, stage: PipStage, s: StageSpec): string {
  const t = s.top;
  switch (stage) {
    case 0:
      return stem(p, t + 4, t - 10, 4) + leaf(p, 100, t - 8, -38, 17, 7);
    case 1:
      return stem(p, t + 4, t - 12, 5) + leaf(p, 100, t - 10, -28, 30, 11) + leaf(p, 100, t - 10, -152, 30, 11);
    case 2:
      return (
        stem(p, t + 4, t - 20, 5.5) +
        leaf(p, 100, t - 14, -22, 34, 12) +
        leaf(p, 100, t - 14, -158, 34, 12) +
        leaf(p, 100, t - 19, -90, 27, 10) +
        leaf(p, 100, t - 4, -6, 20, 8) +
        leaf(p, 100, t - 4, -174, 20, 8)
      );
    case 3: {
      const budBase = t - 26;
      const bud = `<path d="M100 ${budBase - 30} C112 ${budBase - 20} 116 ${budBase - 10} 113 ${budBase - 2} C110 ${budBase + 6} 90 ${budBase + 6} 87 ${budBase - 2} C84 ${budBase - 10} 88 ${budBase - 20} 100 ${budBase - 30} Z" fill="${fill(p, 'bud')}"/>`;
      const budLine = p.flat ? '' : `<path d="M100 ${budBase - 24} Q103 ${budBase - 12} 100 ${budBase + 2}" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="2" stroke-linecap="round"/>`;
      return (
        stem(p, t + 4, budBase, 6) +
        leaf(p, 100, t - 8, -18, 34, 12) +
        leaf(p, 100, t - 8, -162, 34, 12) +
        bud +
        budLine +
        leaf(p, 100, budBase + 2, -58, 13, 5) +
        leaf(p, 100, budBase + 2, -122, 13, 5)
      );
    }
    case 4:
      return stem(p, t + 4, t - 8, 5) + leaf(p, 100, t - 6, -55, 18, 7) + leaf(p, 100, t - 6, -125, 18, 7);
  }
}

/** Sunflower petals fanned around the upper body (stage 4). */
function petals(p: Paint): string {
  let out = '';
  const cx = 100;
  const cy = 130;
  for (let i = 0; i <= 12; i++) {
    const a = -198 + i * 18; // from lower-left, over the top, to lower-right
    const r = (a * Math.PI) / 180;
    const x = (cx + Math.cos(r) * 46).toFixed(1);
    const y = (cy + Math.sin(r) * 50).toFixed(1);
    const len = i % 2 ? 34 : 39;
    out += `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 -9 C${len * 0.45} -14 ${len} -9 ${len} 0 C${len} 9 ${len * 0.45} 14 0 9 Z" fill="${fill(p, 'petal')}"/></g>`;
  }
  return out;
}

function arm(p: Paint, s: StageSpec, side: 'L' | 'R', angle: number, cls = ''): string {
  const [x, y] = side === 'L' ? s.shoulderL : s.shoulderR;
  const shape = s.leafArms
    ? `<path d="${almond(36, 12)}" fill="${fill(p, 'leaf')}"/>` + (p.flat ? '' : `<path d="M4 0 L24 0" stroke="#fff" stroke-opacity="0.45" stroke-width="1.8" stroke-linecap="round"/>`)
    : `<rect x="-4" y="-8" width="32" height="16" rx="8" fill="${fill(p, 'arm')}"/>`;
  const g = `<g transform="translate(${x} ${y}) rotate(${angle})">${shape}</g>`;
  return cls ? `<g class="${cls}" style="transform-origin:${x}px ${y}px">${g}</g>` : g;
}

/** Eyes + mouth (+ cheeks/shine in colour mode). `holes` draws them in black for masks. */
function face(p: Paint, mood: PipMood, s: StageSpec, holes: boolean): string {
  const dy = s.faceDy;
  const ink = holes ? '#000' : INK;
  const ex = s.seed ? 15 : 18; // eye distance from centre
  const ey = 122 + dy;
  const capsule = (cx: number) =>
    `<g class="pip-eye"><ellipse cx="${cx}" cy="${ey}" rx="7" ry="9.5" fill="${ink}"/>` +
    (holes ? '' : `<circle cx="${cx + 2.2}" cy="${ey - 3.6}" r="2.7" fill="#fff"/><circle cx="${cx - 2}" cy="${ey + 3.4}" r="1.2" fill="#fff" fill-opacity="0.8"/>`) +
    `</g>`;
  const arc = (cx: number, up: boolean) =>
    `<path d="M${cx - 7.5} ${ey + (up ? 3 : -1)} Q${cx} ${ey + (up ? -6 : 6)} ${cx + 7.5} ${ey + (up ? 3 : -1)}" fill="none" stroke="${ink}" stroke-width="4.2" stroke-linecap="round"/>`;
  const L = 100 - ex;
  const R = 100 + ex;
  let eyes: string;
  if (mood === 'celebrate') eyes = arc(L, true) + arc(R, true);
  else if (mood === 'sleepy') eyes = arc(L, false) + arc(R, false);
  else if (mood === 'encourage') eyes = capsule(L) + arc(R, true);
  else eyes = capsule(L) + capsule(R);

  const my = 140 + dy;
  const open = (w: number, d: number) =>
    `<path d="M${100 - w} ${my - 1} Q100 ${my - 1 + d} ${100 + w} ${my - 1} Z" fill="${ink}" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>` +
    (holes ? '' : `<ellipse cx="100" cy="${(my - 1 + d * 0.38).toFixed(1)}" rx="${(w * 0.45).toFixed(1)}" ry="${(d * 0.15).toFixed(1)}" fill="#ff7d8c"/>`);
  let mouth: string;
  if (mood === 'celebrate') mouth = open(11, 21);
  else if (mood === 'wave') mouth = open(8.5, 16);
  else if (mood === 'encourage') mouth = open(9, 14);
  else if (mood === 'sleepy') mouth = `<ellipse cx="100" cy="${my + 3}" rx="3.4" ry="3" fill="${ink}"/>`;
  else mouth = `<path d="M93 ${my} Q100 ${my + 7} 107 ${my}" fill="none" stroke="${ink}" stroke-width="4.2" stroke-linecap="round"/>`;

  if (holes) return eyes + mouth;
  const bx = s.seed ? 30 : 32;
  const shine = s.seed
    ? `<ellipse cx="80" cy="104" rx="13" ry="8" transform="rotate(-38 80 104)" fill="url(#${p.id}-shine)"/>`
    : `<ellipse cx="74" cy="97" rx="17" ry="10" transform="rotate(-32 74 97)" fill="url(#${p.id}-shine)"/>`;
  const blush = `<ellipse cx="${100 - bx}" cy="${ey + 16}" rx="10" ry="6.5" fill="url(#${p.id}-blush)"/><ellipse cx="${100 + bx}" cy="${ey + 16}" rx="10" ry="6.5" fill="url(#${p.id}-blush)"/>`;
  return shine + blush + eyes + mouth;
}

/** The whole character for one stage, scaled from the ground point so Pip literally grows. */
function figure(p: Paint, mood: PipMood, stage: PipStage, faceMode: 'color' | 'holes' | 'none'): string {
  const s = STAGES[stage];
  const [la, ra] = POSES[mood];
  const droop = mood === 'sleepy' ? (stage === 4 ? 6 : 24) : 0;
  const rightCls = mood === 'wave' ? 'pip-wave' : '';
  const body = s.seed ? SEED_BODY : ROUND_BODY;
  const fx = s.seed ? 15 : 18;
  const feetFill = p.flat ?? s.feet;
  return `<g transform="translate(100 188) scale(${s.scale}) translate(-100 -188)">
    ${stage === 4 ? `<g${droop ? ` transform="rotate(${droop} 100 130)"` : ''}><g class="pip-petals">${petals(p)}</g></g>` : ''}
    <g${droop ? ` transform="rotate(${droop} 100 ${s.top})"` : ''}><g class="pip-sprout" style="transform-origin:100px ${s.top}px">${headGrowth(p, stage, s)}</g></g>
    ${arm(p, s, 'L', la)}${arm(p, s, 'R', ra, rightCls)}
    <ellipse cx="${100 - fx}" cy="184" rx="${s.seed ? 10 : 13}" ry="6.5" fill="${feetFill}"/>
    <ellipse cx="${100 + fx}" cy="184" rx="${s.seed ? 10 : 13}" ry="6.5" fill="${feetFill}"/>
    <path d="${body}" fill="${fill(p, 'body')}"/>
    ${faceMode === 'none' ? '' : face(p, mood, s, faceMode === 'holes')}
  </g>`;
}

function defs(id: string, stage: PipStage): string {
  const [l, m, d] = STAGES[stage].body;
  return `<defs>
    <radialGradient id="${id}-body" cx="0.36" cy="0.28" r="0.88"><stop offset="0" stop-color="${l}"/><stop offset="0.5" stop-color="${m}"/><stop offset="1" stop-color="${d}"/></radialGradient>
    <linearGradient id="${id}-arm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${m}"/><stop offset="1" stop-color="${d}"/></linearGradient>
    <linearGradient id="${id}-leaf" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2fae6e"/><stop offset="1" stop-color="#8be4a8"/></linearGradient>
    <linearGradient id="${id}-petal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff8a2a"/><stop offset="1" stop-color="#ffc83d"/></linearGradient>
    <linearGradient id="${id}-bud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb4a2"/><stop offset="1" stop-color="#ff6a55"/></linearGradient>
    <radialGradient id="${id}-shine"><stop offset="0" stop-color="#fff" stop-opacity="0.85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}-blush"><stop offset="0" stop-color="#ff7d6e" stop-opacity="0.6"/><stop offset="1" stop-color="#ff7d6e" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}-shadow"><stop offset="0" stop-color="#000" stop-opacity="0.22"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}-spark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#ff9a3c"/></linearGradient>
  </defs>`;
}

function sparkle(id: string, x: number, y: number, s: number, delay: number): string {
  return `<g transform="translate(${x} ${y}) scale(${s})"><path class="pip-sparkle" style="animation-delay:${delay}ms" d="M0 -12 Q2 -2 12 0 Q2 2 0 12 Q-2 2 -12 0 Q-2 -2 0 -12 Z" fill="url(#${id}-spark)"/></g>`;
}

function zzz(stage: PipStage): string {
  const y = 66 - stage * 6;
  const z = (x: number, yy: number, s: number, delay: number) =>
    `<g transform="translate(${x} ${yy}) scale(${s})"><path class="pip-z" style="animation-delay:${delay}ms" d="M-6 -6 H6 L-6 6 H6" fill="none" stroke="${ZZZ}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  return z(150, y, 1, 0) + z(165, y - 18, 0.8, 700) + z(178, y - 33, 0.6, 1400);
}

/** Returns a complete <svg> string for Pip. */
export function pipSvg(opts: PipOptions = {}): string {
  const mood = opts.mood ?? 'happy';
  const stage = opts.stage ?? 0;
  const id = opts.id ?? 'pip';
  const p: Paint = { flat: null, id };
  const sc = STAGES[stage].scale;
  const sparkles =
    mood === 'celebrate'
      ? sparkle(id, 28, 70, 1, 0) + sparkle(id, 174, 62, 0.8, 250) + sparkle(id, 186, 140, 0.6, 500) + sparkle(id, 14, 136, 0.55, 750)
      : mood === 'encourage'
        ? sparkle(id, 182, 84, 0.6, 0)
        : '';
  const shadow =
    opts.shadow === false ? '' : `<ellipse class="pip-shadow" cx="100" cy="190" rx="${(50 * sc).toFixed(1)}" ry="7" fill="url(#${id}-shadow)"/>`;
  return `<svg class="pip pip--${mood} pip--stage-${stage}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs(id, stage)}
  ${shadow}${sparkles}
  <g class="pip-hop"><g class="pip-all">${figure(p, mood, stage, 'color')}</g></g>
  ${mood === 'sleepy' ? zzz(stage) : ''}
</svg>`;
}

/**
 * One-colour Pip with the eyes and mouth cut out (transparent), for Android's
 * monochrome themed icon.
 */
export function pipKnockoutSvg(mood: PipMood = 'happy', stage: PipStage = 0, size = 200, color = '#ffffff'): string {
  const white: Paint = { flat: '#fff', id: 'k' };
  return `<svg viewBox="0 0 200 200" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs><mask id="k" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200">
    ${figure(white, mood, stage, 'none')}${figure(white, mood, stage, 'holes').replace(/fill="#fff"/g, 'fill="none"').replace(/stroke="#fff"/g, 'stroke="none"')}
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

export const STAGE_NAMES = ['seed', 'sprout', 'sapling', 'bud', 'bloom'] as const;
