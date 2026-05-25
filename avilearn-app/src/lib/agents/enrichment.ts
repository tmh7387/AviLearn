import { generateObject } from 'ai';
import { z } from 'zod';
import { getModel } from './anthropic-client';
import { logAgentDecision, timer } from './logger';
import type { ParsedSlide, SlideClassification } from '../transform/types';

const EnrichmentSchema = z.object({
  slides: z.array(
    z.object({
      index: z.number(),
      classification: z.enum([
        'text_heavy',
        'diagram',
        'procedure_checklist',
        'data_chart',
        'title_slide',
        'image_heavy',
        'quiz_exercise',
      ]),
      reasoning: z.string(),
    })
  ),
});

/**
 * The Enrichment Agent analyzes each slide/section to classify it semantically.
 */
export async function runEnrichmentAgent(
  slides: Omit<ParsedSlide, 'classification'>[],
  moduleId: string
): Promise<ParsedSlide[]> {
  const elapsed = timer();

  const { object } = await generateObject({
    model: getModel('supervisor'), // Use Opus 4.6 for classification accuracy
    schema: EnrichmentSchema,
    prompt: `You are an aviation training Enrichment Agent.
    
Given a list of slides/sections with titles, text, and notes, analyze each slide and classify it into one of the following categories:
- title_slide: Introductions, titles, section breaks.
- text_heavy: Standard explanation slides, bullet points, text descriptions.
- diagram: Mindmaps, fishbones, or graphical concepts.
- procedure_checklist: Step-by-step operations, guidelines, checklist procedures.
- data_chart: Contains numeric tables, flight paths, performance charts, engine readings.
- image_heavy: Mostly images, photos, aircraft visuals.
- quiz_exercise: Reviews, quizzes, scenario questions.

Provide your classification and a brief reasoning for each slide.

Slides list:
${JSON.stringify(slides, null, 2)}`,
  });

  const ms = elapsed();
  await logAgentDecision({
    agentName: 'enrichment' as any,
    action: 'classify_slides',
    inputSummary: `Enriching ${slides.length} slides`,
    outputSummary: `Classified slides into categories.`,
    confidenceScore: 0.9,
    durationMs: ms,
    relatedModuleId: moduleId,
  });

  const classificationMap = new Map(
    object.slides.map(s => [s.index, s.classification])
  );

  return slides.map(s => ({
    ...s,
    classification: (classificationMap.get(s.index) || 'text_heavy') as SlideClassification,
  }));
}
