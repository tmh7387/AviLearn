import { themeCssVars, type StageTheme, type StageThemeName } from '../tokens';

/**
 * Theme packs: everything that makes a deck look like one brand.
 * A deck names its pack in `theme`. Templates never name a brand; they read
 * the pack through CSS variables (--s-*) and RenderContext.theme.
 */
export interface ThemePack {
  id: string;
  /** Name shown in the gallery, e.g. "Nav Chart". */
  name: string;
  /** Organisation line on the course title slide, e.g. "Aviation Synergy". */
  org: string;
  /** Footer mark text. */
  product: string;
  /** Name of the live workshop tool, used on exercise slides. */
  portal: string;
  /** Show the AviLearn mark icon before the footer text. */
  markIcon: boolean;
  modes: Record<StageThemeName, StageTheme>;
  defaultMode: StageThemeName;
  fonts: { display: string; body: string; mono: string; googleHref: string };
  /** Multiplier for display type sizes. Condensed faces use 1; wider faces need less. */
  displayScale: number;
  /** Text case for display headings. */
  headingCase: 'uppercase' | 'none';
  /** Decoration on title bumpers. */
  ornament: 'compass' | 'none';
}

/** Aviation Synergy courses. Aeronautical chart look (docs/SPEC-stage-nav-chart.md). */
export const NAV_CHART: ThemePack = {
  id: 'nav-chart',
  name: 'Nav Chart',
  org: 'Aviation Synergy',
  product: 'AviLearn',
  portal: 'AviLearn Portal',
  markIcon: true,
  modes: {
    light: {
      bg: '#eef3ef',
      grid: 'rgba(18,48,90,.07)',
      ink: '#12305a',
      inkMuted: '#4b6584',
      accent: '#0a6b62',
      accentFill: '#0b7d72',
      accentTint: 'rgba(11,125,114,.11)',
      card: 'rgba(255,255,255,.78)',
      line: '#12305a',
      paper: '#ffffff',
    },
    dark: {
      bg: '#0c1a2c',
      grid: 'rgba(170,205,235,.07)',
      ink: '#e3ecf6',
      inkMuted: '#97abc3',
      accent: '#2dd4bf',
      accentFill: '#2dd4bf',
      accentTint: 'rgba(45,212,191,.13)',
      card: 'rgba(255,255,255,.045)',
      line: '#b9cadc',
      paper: '#ffffff',
    },
  },
  defaultMode: 'light',
  fonts: {
    display: "'Barlow Condensed', 'Arial Narrow', sans-serif",
    body: "'Barlow', 'Segoe UI', Arial, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace",
    googleHref:
      'https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@500;600;700&family=JetBrains+Mono:wght@500;600&display=swap',
  },
  displayScale: 1,
  headingCase: 'uppercase',
  ornament: 'compass',
};

/**
 * Neutral studio look for customers without their own pack yet, and the
 * test theme that proves templates do not depend on Nav Chart.
 */
export const STUDIO_NEUTRAL: ThemePack = {
  id: 'studio-neutral',
  name: 'Studio Neutral',
  org: 'Sample Organisation',
  product: 'Studio',
  portal: 'Workshop Portal',
  markIcon: false,
  modes: {
    light: {
      bg: '#f7f7f5',
      grid: 'rgba(0,0,0,0)',
      ink: '#1f2430',
      inkMuted: '#5b6270',
      accent: '#3b5bdb',
      accentFill: '#3b5bdb',
      accentTint: 'rgba(59,91,219,.10)',
      card: '#ffffff',
      line: '#2f3644',
      paper: '#ffffff',
    },
    dark: {
      bg: '#15171c',
      grid: 'rgba(0,0,0,0)',
      ink: '#eceef2',
      inkMuted: '#a3a9b6',
      accent: '#8ea2ff',
      accentFill: '#8ea2ff',
      accentTint: 'rgba(142,162,255,.14)',
      card: 'rgba(255,255,255,.05)',
      line: '#c3c8d2',
      paper: '#ffffff',
    },
  },
  defaultMode: 'light',
  fonts: {
    display: "'Inter Tight', 'Segoe UI', Arial, sans-serif",
    body: "'Inter', 'Segoe UI', Arial, sans-serif",
    mono: "'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace",
    googleHref:
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Inter+Tight:wght@600;700&family=IBM+Plex+Mono:wght@500;600&display=swap',
  },
  displayScale: 0.72,
  headingCase: 'none',
  ornament: 'none',
};

export const THEME_PACKS: ReadonlyMap<string, ThemePack> = new Map([NAV_CHART, STUDIO_NEUTRAL].map((p) => [p.id, p]));
export const DEFAULT_THEME_PACK = NAV_CHART.id;

export function getThemePack(id: string): ThemePack | undefined {
  return THEME_PACKS.get(id);
}

function packVars(pack: ThemePack, mode: StageThemeName): string {
  const f = pack.fonts;
  return (
    themeCssVars(pack.modes[mode]) +
    `--s-font-display:${f.display};--s-font-body:${f.body};--s-font-mono:${f.mono};--s-head-case:${pack.headingCase};--s-dscale:${pack.displayScale};`
  );
}

/**
 * CSS variables for a pack. `:root` follows <html data-theme>. Any other
 * scope (a gallery section) follows the page's data-theme from outside.
 */
export function packCss(pack: ThemePack, scope = ':root'): string {
  if (scope === ':root') {
    return `:root,:root[data-theme="light"]{${packVars(pack, 'light')}}:root[data-theme="dark"]{${packVars(pack, 'dark')}}`;
  }
  return `${scope}{${packVars(pack, 'light')}}[data-theme="dark"] ${scope}{${packVars(pack, 'dark')}}`;
}

/** Every colour value a deck in this pack may emit (QA colour audit). */
export function allowedColors(pack: ThemePack): Set<string> {
  const out = new Set<string>();
  for (const mode of ['light', 'dark'] as const) {
    for (const v of Object.values(pack.modes[mode])) out.add(v.toLowerCase().replace(/\s+/g, ''));
  }
  return out;
}
