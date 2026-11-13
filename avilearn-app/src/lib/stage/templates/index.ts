import type { TemplateId } from '../schema';
import type { TemplateDef } from './types';
import { agenda, objectives, questions, sectionDivider, titleBumper } from './structure';
import { breakSlide, courseMaterials, courseTitle, dayClose, dayOverview, facilitator, icebreaker, keyPoints, moduleOpener } from './opening';
import { annotatedImage, assertionImage, heroNumber, quoteReference, splitContrast } from './evidence';
import { causeChain, checklist, phaseOfFlight, procedureFlow, timeline } from './process';
import { exerciseLaunch, knowledgeCheck } from './interaction';

/**
 * Registry of platform templates. Most are core templates for every industry;
 * domain templates belong to one industry pack (./packs/verticals.ts).
 * Analysis tools shared with the Portal
 * (fishbone, five-why, swiss-cheese, bowtie, risk-matrix, flight-profile,
 * card-sort) arrive in Phase 2 through the avilearn-course-tools package.
 */
const ALL = [
  courseTitle,
  facilitator,
  icebreaker,
  dayOverview,
  courseMaterials,
  moduleOpener,
  keyPoints,
  breakSlide,
  dayClose,
  titleBumper,
  sectionDivider,
  agenda,
  objectives,
  questions,
  assertionImage,
  annotatedImage,
  heroNumber,
  splitContrast,
  quoteReference,
  procedureFlow,
  checklist,
  timeline,
  phaseOfFlight,
  causeChain,
  knowledgeCheck,
  exerciseLaunch,
] as TemplateDef<unknown>[];

export const TEMPLATES: ReadonlyMap<TemplateId, TemplateDef<unknown>> = new Map(ALL.map((t) => [t.id, t]));

export function getTemplate(id: TemplateId): TemplateDef<unknown> {
  const t = TEMPLATES.get(id);
  if (!t) throw new Error(`No template "${id}"`);
  return t;
}

export { stepCount } from './types';
export type { TemplateDef, RenderContext } from './types';
