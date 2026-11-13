import type { TemplateId } from '../schema';
import type { VoiceRule } from '../voice';

/**
 * Industry packs (verticals). A pack holds tools, not content: domain
 * templates, extra voice rules and the review rule for its industry.
 *
 * Core templates (every template not listed in any pack) work in every pack.
 * A domain template works only in the pack that lists it.
 *
 * Rule (Anthony, 12 Nov 2026): Aviation Synergy writes aviation content only.
 * Other packs are frameworks; experts in that field convert their own
 * content, and a named reviewer from the customer signs it off.
 */
export interface VerticalPack {
  id: string;
  name: string;
  /** Who writes the content in courses that use this pack. */
  contentBy: 'aviation-synergy' | 'customer-expert';
  /** Domain templates that only this pack may use. */
  templates: TemplateId[];
  /** Extra banned phrases on top of the core voice rules. */
  voice: VoiceRule[];
}

export const AVIATION: VerticalPack = {
  id: 'aviation',
  name: 'Aviation',
  contentBy: 'aviation-synergy',
  templates: ['phase-of-flight'],
  voice: [],
};

/** No domain templates: core templates only. For test decks and new customers. */
export const GENERAL: VerticalPack = {
  id: 'general',
  name: 'General',
  contentBy: 'customer-expert',
  templates: [],
  voice: [],
};

export const VERTICAL_PACKS: ReadonlyMap<string, VerticalPack> = new Map([AVIATION, GENERAL].map((p) => [p.id, p]));
export const DEFAULT_VERTICAL = AVIATION.id;

export function getVertical(id: string): VerticalPack | undefined {
  return VERTICAL_PACKS.get(id);
}

/** The pack that owns a domain template, or undefined for a core template. */
export function ownerOf(templateId: TemplateId): VerticalPack | undefined {
  for (const p of VERTICAL_PACKS.values()) if (p.templates.includes(templateId)) return p;
  return undefined;
}

/** True when a deck in this vertical may use the template. */
export function templateAllowed(vertical: VerticalPack, templateId: TemplateId): boolean {
  const owner = ownerOf(templateId);
  return !owner || owner.id === vertical.id;
}
