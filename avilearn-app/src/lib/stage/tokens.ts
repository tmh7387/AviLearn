/**
 * Stage tokens: the single source of truth for projected courseware.
 *
 * Every template, the compiler, the presenter runtime, AI prompts and the
 * video renderer read sizes and timing from here, and colours and fonts from
 * the deck's theme pack. Do not write colour or size literals anywhere else
 * in src/lib/stage.
 */

export type StageThemeName = 'light' | 'dark';
export type StageTone = 'standard' | 'sober';

export interface StageTheme {
  bg: string;
  grid: string;
  ink: string;
  inkMuted: string;
  accent: string;
  accentFill: string;
  accentTint: string;
  card: string;
  line: string;
  /** Opaque white behind third-party logos, in both themes. */
  paper: string;
}

/**
 * Brand-free geometry, type scale, word budget and timing. Colours and fonts
 * live in theme packs (./packs/themes.ts), so one course can use any brand.
 */
export const STAGE = {
  canvas: { width: 1920, height: 1080, safe: { x: 115, top: 88, bottom: 134 }, gridStep: 77 },
  /** Sizes in canvas px (1920 x 1080). */
  type: {
    title: 160,
    headline: 68,
    hero: 170,
    label: 34,
    card: 42,
    body: 40,
    eyebrow: 25,
    footer: 22,
    floor: 22,
    labelFloor: 32,
  },
  words: { headline: 12, label: 4, slideTarget: 20, slideMax: 30, perStep: 12 },
  steps: { active: 1, past: 0.3, structurePast: 0.55, future: 0 },
  /**
   * Motion rules (strategy doc, phase B). One easing curve for the studio.
   * enter: a part appears. dim: an active part goes to 30%. stagger: gap
   * between parts that enter on one step. maxMove: the longest move on a
   * content slide. Sequences (intro, bumper, outro, lower third) are branded
   * moments and may run longer. The deck and the video read these values.
   */
  motion: {
    enter: 600,
    dim: 300,
    stagger: 120,
    minStagger: 60,
    maxMove: 1200,
    rise: 24,
    slide: 300,
    ease: 'cubic-bezier(.2,.7,.2,1)',
    easeBack: 'cubic-bezier(.3,1.5,.5,1)',
    verbs: { reveal: 600, draw: 900, grow: 900, count: 900, pin: 600 },
    sequences: { intro: 3000, bumper: 1500, outro: 2000, lowerThird: 5000 },
  },
  stroke: { main: 4, branch: 3, box: 2, trajectory: 6 },
  radius: { box: 4 },
  video: { width: 1920, height: 1080, fps: 30, codec: 'h264', audioLufs: -16, minStepSec: 2.5, padSec: 0.6 },
} as const;

/** CSS custom properties for one colour mode, e.g. `--s-bg: #eef3ef;`. */
export function themeCssVars(t: StageTheme): string {
  return (Object.keys(t) as (keyof StageTheme)[])
    .map((k) => `--s-${k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}:${t[k]};`)
    .join('');
}

/** WCAG relative luminance for a #rrggbb colour. */
export function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const ch = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = ch.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

/** WCAG contrast ratio between two #rrggbb colours. */
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
