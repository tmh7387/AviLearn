/**
 * Quality gate (pilot) — Gemini Decision 1.
 *
 * Runs after the enrichment stage. For each source slide it asks a fixed set of
 * yes/no, choice and score questions and turns the calibrated answers into
 * review flags. The gate never writes content. It only tells the human
 * reviewer which slides need attention first.
 *
 * This file has no app imports, so tests can run it with a fake client.
 */

import type { ParsedSlide, SlideClassification } from '../transform/types';

// ---------------------------------------------------------------------------
// Decisions API shapes (subset of @google/genai Decisions types)
// ---------------------------------------------------------------------------

export type DecisionQuestion =
  | { type: 'noul'; instructions: string; criteria?: { true_description?: string; false_description?: string } }
  | { type: 'choice'; instructions: string; criteria: Record<string, string> }
  | { type: 'score'; instructions: string; criteria: string[] };

export type DecisionAnswer =
  | { type: 'noul'; noul: number; confidence: number }
  | { type: 'choice'; choice: string; probabilities: Record<string, number>; confidence: number }
  | { type: 'score'; score: number; probabilities: Record<string, number>; legend?: Record<string, string>; confidence: number };

export interface DecisionsClient {
  decide(input: string, questions: Record<string, DecisionQuestion>, signal?: AbortSignal): Promise<{
    answers: Record<string, DecisionAnswer>;
    inputTokens: number;
  }>;
}

// ---------------------------------------------------------------------------
// Thresholds. Tune these with labelled slides before the gate blocks anything.
// ---------------------------------------------------------------------------

export interface GateThresholds {
  /** Below this, the slide type goes to the reviewer. */
  classificationConfidence: number;
  /** P(yes) at or above this raises the flag. */
  multipleIdeas: number;
  smeCheck: number;
  visualCandidate: number;
  /** Projector score at or below this raises the flag (scale 0 to 3). */
  projectorScoreMax: number;
  /** Word count above this raises the flag. Counted in code, not by the model. */
  maxWords: number;
}

export const DEFAULT_THRESHOLDS: GateThresholds = {
  classificationConfidence: 0.7,
  multipleIdeas: 0.7,
  smeCheck: 0.6,
  visualCandidate: 0.7,
  projectorScoreMax: 1.0,
  maxWords: 40,
};

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

/** Same categories and wording as the Opus enrichment prompt, so the two can be compared. */
export const CLASSIFICATION_CRITERIA: Record<SlideClassification, string> = {
  title_slide: 'Introductions, titles, section breaks.',
  text_heavy: 'Standard explanation slides, bullet points, text descriptions.',
  diagram: 'Mindmaps, fishbones, pyramids, funnels, flowcharts, or graphical concepts. Grouped shapes with fill colours that form a visual layout.',
  procedure_checklist: 'Step-by-step operations, guidelines, checklist procedures.',
  data_chart: 'Numeric tables, flight paths, performance charts, engine readings, or structured tabular data.',
  image_heavy: 'Mostly images, photos, aircraft visuals, or slides where embedded photographs are the primary content.',
  quiz_exercise: 'Reviews, quizzes, scenario questions.',
};

export const PROJECTOR_LEVELS = [
  'Unreadable on a projector: a wall of text or a dense table.',
  'Hard to read: many bullets or long sentences.',
  'Readable: a few short points.',
  'Clean: one idea, few words, clear focus.',
];

export function buildSlideQuestions(): Record<string, DecisionQuestion> {
  return {
    slide_type: {
      type: 'choice',
      instructions: 'Which category best describes this training slide? Use the title, text, notes and visual content metadata.',
      criteria: CLASSIFICATION_CRITERIA,
    },
    multiple_ideas: {
      type: 'noul',
      instructions: 'Does this slide cover more than one main idea, so that it should be split into two or more slides?',
      criteria: {
        true_description: 'Two or more separate topics or messages on one slide.',
        false_description: 'One topic, even if it has several supporting points.',
      },
    },
    sme_check: {
      type: 'noul',
      instructions: 'Does this slide state specific facts that a subject matter expert must verify before publishing, such as numbers, limits, regulation or manual references, or dates?',
      criteria: {
        true_description: 'Contains at least one specific factual claim, figure, limit, or reference.',
        false_description: 'General explanation only, with no specific figures or references.',
      },
    },
    visual_candidate: {
      type: 'noul',
      instructions: 'Would this content teach better as a diagram, timeline, process graphic or other visual than as bullet text?',
    },
    projector: {
      type: 'score',
      instructions: 'How readable is this slide when projected in a training room?',
      criteria: PROJECTOR_LEVELS,
    },
  };
}

type GateSlide = Omit<ParsedSlide, 'classification'> & { classification?: SlideClassification };

/** Shared input for one slide. Text only; base64 image data is never sent. */
export function buildSlideInput(slide: GateSlide): string {
  const visual = {
    images: slide.images?.length ?? 0,
    shapes: slide.shapes?.length ?? 0,
    shapeGroups: new Set((slide.shapes ?? []).map((s) => s.groupId).filter(Boolean)).size,
    tables: (slide.tables ?? []).map((t) => `${t.rows.length}x${t.rows[0]?.length ?? 0}`),
    hasCharts: slide.hasCharts,
  };
  return JSON.stringify({
    title: slide.title ?? '',
    text: slide.textContent.slice(0, 2000),
    notes: (slide.notes ?? '').slice(0, 500),
    visual,
  });
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

// ---------------------------------------------------------------------------
// Interpretation
// ---------------------------------------------------------------------------

export type FlagCode =
  | 'type_uncertain'
  | 'type_disagrees'
  | 'split_slide'
  | 'sme_check'
  | 'make_visual'
  | 'too_dense'
  | 'too_many_words';

export interface GateFlag {
  code: FlagCode;
  message: string;
}

export interface SlideGateResult {
  index: number;
  title?: string;
  /** Type chosen by the enrichment agent (Opus). */
  enrichmentType?: SlideClassification;
  /** Type chosen by Gemini Decision 1. */
  gateType: string;
  gateTypeConfidence: number;
  words: number;
  projectorScore: number;
  probabilities: { multipleIdeas: number; smeCheck: number; visualCandidate: number };
  flags: GateFlag[];
  needsReview: boolean;
}

function noul(a: DecisionAnswer | undefined): number {
  return a && a.type === 'noul' ? a.noul : 0;
}

export function interpretSlide(
  slide: GateSlide,
  answers: Record<string, DecisionAnswer>,
  t: GateThresholds = DEFAULT_THRESHOLDS
): SlideGateResult {
  const flags: GateFlag[] = [];
  const n = slide.index;

  const typeAns = answers.slide_type;
  const gateType = typeAns && typeAns.type === 'choice' ? typeAns.choice : 'unknown';
  const gateTypeConfidence = typeAns?.confidence ?? 0;

  if (gateTypeConfidence < t.classificationConfidence) {
    flags.push({ code: 'type_uncertain', message: `Slide ${n}: the slide type is not clear (${gateType}, ${pct(gateTypeConfidence)}). Check the type.` });
  } else if (slide.classification && gateType !== slide.classification) {
    flags.push({ code: 'type_disagrees', message: `Slide ${n}: the two models disagree on the slide type (${slide.classification} or ${gateType}). Check the type.` });
  }

  const multipleIdeas = noul(answers.multiple_ideas);
  if (multipleIdeas >= t.multipleIdeas) {
    flags.push({ code: 'split_slide', message: `Slide ${n}: the slide has more than one main idea. Think about a split.` });
  }

  const smeCheck = noul(answers.sme_check);
  if (smeCheck >= t.smeCheck) {
    flags.push({ code: 'sme_check', message: `Slide ${n}: the slide has specific facts. An expert must verify them.` });
  }

  const visualCandidate = noul(answers.visual_candidate);
  const type = slide.classification ?? gateType;
  if (visualCandidate >= t.visualCandidate && (type === 'text_heavy' || type === 'procedure_checklist')) {
    flags.push({ code: 'make_visual', message: `Slide ${n}: the text can become a visual. Think about a diagram or process template.` });
  }

  const proj = answers.projector;
  const projectorScore = proj && proj.type === 'score' ? proj.score : PROJECTOR_LEVELS.length - 1;
  if (projectorScore <= t.projectorScoreMax) {
    flags.push({ code: 'too_dense', message: `Slide ${n}: the slide is hard to read on a projector. Cut the text.` });
  }

  const words = countWords(`${slide.title ?? ''} ${slide.textContent}`);
  if (words > t.maxWords) {
    flags.push({ code: 'too_many_words', message: `Slide ${n}: the slide has ${words} words. The limit is ${t.maxWords}.` });
  }

  return {
    index: n,
    title: slide.title,
    enrichmentType: slide.classification,
    gateType,
    gateTypeConfidence,
    words,
    projectorScore,
    probabilities: { multipleIdeas, smeCheck, visualCandidate },
    flags,
    needsReview: flags.length > 0,
  };
}

function pct(p: number): string {
  return `${Math.round(p * 100)}%`;
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

export interface GateReport {
  model: string;
  slides: SlideGateResult[];
  /** Slides the model could not check (error text per slide index). */
  errors: { index: number; error: string }[];
  inputTokens: number;
  /** Estimate at USD 0.10 per 1M input tokens (paid tier, November 2026). */
  costUsd: number;
  reviewCount: number;
}

export const USD_PER_INPUT_TOKEN = 0.1 / 1_000_000;

export async function runQualityGate(
  slides: GateSlide[],
  client: DecisionsClient,
  opts: { model: string; thresholds?: GateThresholds; concurrency?: number; signal?: AbortSignal } = { model: 'gemini-decision-1' }
): Promise<GateReport> {
  const questions = buildSlideQuestions();
  const results: (SlideGateResult | undefined)[] = new Array(slides.length);
  const errors: GateReport['errors'] = [];
  let inputTokens = 0;
  let next = 0;

  async function worker() {
    while (next < slides.length) {
      const i = next++;
      const slide = slides[i];
      if (opts.signal?.aborted) return;
      try {
        const r = await client.decide(buildSlideInput(slide), questions, opts.signal);
        inputTokens += r.inputTokens;
        results[i] = interpretSlide(slide, r.answers, opts.thresholds);
      } catch (err) {
        errors.push({ index: slide.index, error: err instanceof Error ? err.message : String(err) });
      }
    }
  }

  const n = Math.max(1, Math.min(opts.concurrency ?? 4, slides.length));
  await Promise.all(Array.from({ length: n }, worker));

  const done = results.filter((r): r is SlideGateResult => !!r);
  return {
    model: opts.model,
    slides: done,
    errors: errors.sort((a, b) => a.index - b.index),
    inputTokens,
    costUsd: inputTokens * USD_PER_INPUT_TOKEN,
    reviewCount: done.filter((r) => r.needsReview).length,
  };
}

/** Flags to add to the job, most useful first. Capped so one deck cannot flood the reviewer. */
export function reportToSmeFlags(report: GateReport, max = 50): string[] {
  const order: FlagCode[] = ['sme_check', 'type_uncertain', 'type_disagrees', 'split_slide', 'too_dense', 'too_many_words', 'make_visual'];
  const all = report.slides.flatMap((s) => s.flags);
  all.sort((a, b) => order.indexOf(a.code) - order.indexOf(b.code));
  const out = all.slice(0, max).map((f) => `[Quality gate] ${f.message}`);
  if (all.length > max) out.push(`[Quality gate] ${all.length - max} more flags. See the quality-gate artifact.`);
  if (report.errors.length) out.push(`[Quality gate] ${report.errors.length} slides were not checked. See the quality-gate artifact.`);
  return out;
}
