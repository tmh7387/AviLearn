import { z } from 'zod';
import { ICON_NODES } from './icons.data';

/**
 * Line icons for slides (from lucide, ISC licence). The set is curated:
 * add names in scripts/stage-icons.mjs and run `node scripts/stage-icons.mjs`.
 * Icons inherit the text colour (stroke="currentColor").
 */
export type IconName = keyof typeof ICON_NODES;
export const ICON_NAMES = Object.keys(ICON_NODES) as IconName[];
export const IconSchema = z.enum(ICON_NAMES as [IconName, ...IconName[]]);

const attr = (o: Record<string, string>) =>
  Object.entries(o)
    .map(([k, v]) => `${k}="${String(v).replace(/"/g, '&quot;')}"`)
    .join(' ');

export function iconSvg(name: IconName, cls = 'st-ic'): string {
  const nodes = ICON_NODES[name] as unknown as [string, Record<string, string>][];
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${nodes
    .map(([tag, a]) => `<${tag} ${attr(a)}/>`)
    .join('')}</svg>`;
}
