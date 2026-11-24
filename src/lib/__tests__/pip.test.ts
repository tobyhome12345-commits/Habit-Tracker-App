import { describe, expect, it } from 'vitest';
import { pipKnockoutSvg, pipSvg, type PipMood, type PipStage } from '../../mascot/pip';

const stages: PipStage[] = [0, 1, 2, 3, 4];
const moods: PipMood[] = ['happy', 'celebrate', 'encourage', 'sleepy', 'wave'];

describe('Pip artwork', () => {
  it('draws every stage differently (Pip evolves, not just his leaf)', () => {
    const svgs = stages.map((stage) => pipSvg({ stage, id: 'x' }));
    expect(new Set(svgs).size).toBe(5);
    // grows bigger every stage
    const scales = svgs.map((s) => Number(/scale\(([\d.]+)\)/.exec(s)![1]));
    expect(scales).toEqual([...scales].sort((a, b) => a - b));
    expect(scales[0]).toBeLessThan(scales[4]);
  });

  it('only blooms into a sunflower at stage 4', () => {
    expect(pipSvg({ stage: 4 })).toContain('pip-petals');
    expect(pipSvg({ stage: 3 })).not.toContain('pip-petals');
  });

  it('renders every mood × stage with unique gradient ids', () => {
    for (const mood of moods)
      for (const stage of stages) {
        const svg = pipSvg({ mood, stage, id: 'abc' });
        expect(svg).toContain(`pip--${mood}`);
        expect(svg).not.toMatch(/url\(#(?!abc-)/);
      }
  });

  it('makes a one-colour knockout for Android icons', () => {
    const svg = pipKnockoutSvg('happy', 4);
    expect(svg).toContain('<mask');
    expect(svg).not.toContain('url(#k-'); // no gradients in a silhouette
  });
});
