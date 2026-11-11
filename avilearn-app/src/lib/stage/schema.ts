import { z } from 'zod';
import { STAGE } from './tokens';
import { countWords } from './html';

/**
 * The JSON slide spec. Claude writes this; code renders it.
 * Per-template `data` schemas live with each template in ./templates.
 */

export const TEMPLATE_IDS = [
  // structure
  'title-bumper',
  'section-divider',
  'agenda',
  'objectives',
  'summary',
  'questions',
  // evidence
  'assertion-image',
  'annotated-image',
  'hero-number',
  'split-contrast',
  'quote-reference',
  // process
  'procedure-flow',
  'checklist',
  'flight-timeline',
  'cause-chain',
  // interaction
  'knowledge-check',
  'exercise-launch',
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

const maxWords = (n: number, what: string) =>
  z.string().trim().min(1).refine((v) => countWords(v) <= n, { message: `${what} must be ${n} words or fewer` });

export const AssetSchema = z.object({
  id: z.string().min(1),
  /** Supabase Storage URL. data: URIs are allowed only for samples and tests. */
  url: z.string().min(1),
  alt: z.string().min(1, 'Every image needs alt text'),
  /** Dark line drawing on a clear background. It is inverted in the dark theme so it stays visible. */
  lineArt: z.boolean().optional(),
});

export const SourceRefSchema = z.object({
  file: z.string().min(1),
  slide: z.number().int().positive().optional(),
  page: z.number().int().positive().optional(),
});

export const StepSchema = z.object({
  speakerNotes: z.string().trim().min(1, 'Every step needs speaker notes'),
  lowerThird: z.string().optional(),
});

export const SlideSpecSchema = z.object({
  id: z.string().min(1),
  templateId: z.enum(TEMPLATE_IDS),
  eyebrow: maxWords(4, 'Eyebrow').optional(),
  assertion: maxWords(STAGE.words.headline, 'Assertion headline').optional(),
  data: z.unknown(),
  steps: z.array(StepSchema).min(1).max(8),
  sourceRefs: z.array(SourceRefSchema).default([]),
});

export const SlideDeckSpecSchema = z.object({
  specVersion: z.literal('stage/1'),
  programme: z.string().min(1),
  course: z.string().min(1),
  module: z.object({ code: z.string().min(1), title: z.string().min(1) }),
  lesson: z.object({ title: z.string().min(1), objectives: z.array(z.string()).default([]) }),
  tone: z.enum(['standard', 'sober']).default('standard'),
  defaultTheme: z.enum(['light', 'dark']).default(STAGE.defaultTheme),
  assets: z.array(AssetSchema).default([]),
  slides: z.array(SlideSpecSchema).min(1),
});

export type SlideSpec = z.infer<typeof SlideSpecSchema>;
export type SlideDeckSpec = z.infer<typeof SlideDeckSpecSchema>;
export type SlideDeckSpecInput = z.input<typeof SlideDeckSpecSchema>;
export type StageAsset = z.infer<typeof AssetSchema>;

/** Short label: 1 to 4 words (spec section 5). */
export const label = (n: number = STAGE.words.label) => maxWords(n, 'Label');
