/**
 * AviLearn Stage tokens: the single source of truth for projected courseware.
 *
 * Values come from docs/SPEC-stage-nav-chart.md (Nav Chart style). Every
 * template, the compiler, the presenter runtime, AI prompts and the future
 * video renderer read from here. Do not write colour or size literals
 * anywhere else in src/lib/stage.
 */

export type StageThemeName = 'light' | 'dark';
export type StageTone = 'standard' | 'sober';

export interface StageTheme {
  bg: string;
  grid: string;
  ink: string;
  inkMuted: string;
  teal: string;
  tealFill: string;
  tealTint: string;
  card: string;
  line: string;
  /** Opaque white behind third-party logos, in both themes. */
  paper: string;
}

export const STAGE = {
  canvas: { width: 1920, height: 1080, safe: { x: 115, top: 88, bottom: 134 }, gridStep: 77 },
  themes: {
    light: {
      bg: '#eef3ef',
      grid: 'rgba(18,48,90,.07)',
      ink: '#12305a',
      inkMuted: '#4b6584',
      teal: '#0a6b62',
      tealFill: '#0b7d72',
      tealTint: 'rgba(11,125,114,.11)',
      card: 'rgba(255,255,255,.78)',
      line: '#12305a',
      paper: '#ffffff',
    },
    dark: {
      bg: '#0c1a2c',
      grid: 'rgba(170,205,235,.07)',
      ink: '#e3ecf6',
      inkMuted: '#97abc3',
      teal: '#2dd4bf',
      tealFill: '#2dd4bf',
      tealTint: 'rgba(45,212,191,.13)',
      card: 'rgba(255,255,255,.045)',
      line: '#b9cadc',
      paper: '#ffffff',
    },
  } satisfies Record<StageThemeName, StageTheme>,
  defaultTheme: 'light' as StageThemeName,
  fonts: {
    display: "'Barlow Condensed', 'Arial Narrow', sans-serif",
    body: "'Barlow', 'Segoe UI', Arial, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace",
    googleHref:
      'https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@500;600;700&family=JetBrains+Mono:wght@500;600&display=swap',
  },
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
  motion: { step: 450, draw: 600, slide: 300, ease: 'cubic-bezier(.2,.7,.2,1)', bumper: 3000 },
  stroke: { main: 4, branch: 3, box: 2, trajectory: 6 },
  radius: { box: 4 },
  video: { width: 1920, height: 1080, fps: 30, codec: 'h264', audioLufs: -16, minStepSec: 2.5, padSec: 0.6 },
} as const;

/** CSS custom properties for one theme, e.g. `--s-bg: #eef3ef;`. */
export function themeCssVars(name: StageThemeName): string {
  const t = STAGE.themes[name];
  return (Object.keys(t) as (keyof StageTheme)[])
    .map((k) => `--s-${k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}:${t[k]};`)
    .join('');
}

/** Every colour value the stage is allowed to emit (used by the QA colour audit). */
export function allowedColors(): Set<string> {
  const out = new Set<string>();
  for (const name of ['light', 'dark'] as const) {
    for (const v of Object.values(STAGE.themes[name])) out.add(v.toLowerCase().replace(/\s+/g, ''));
  }
  return out;
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
