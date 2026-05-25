import { generateObject } from 'ai';
import { z } from 'zod';
import { getModel } from './anthropic-client';
import { logAgentDecision, timer } from './logger';
import type { ParsedSlide } from '../transform/types';

const IntakeResultSchema = z.object({
  slides: z.array(
    z.object({
      index: z.number(),
      title: z.string().optional(),
      textContent: z.string(),
      hasImages: z.boolean(),
      hasCharts: z.boolean(),
      notes: z.string().optional(),
    })
  ),
});

/**
 * The Intake Agent takes raw text (from PDFs/manuals) and structures it into distinct slides.
 */
export async function runIntakeAgent(
  rawText: string,
  fileName: string,
  moduleId: string
): Promise<ParsedSlide[]> {
  const elapsed = timer();

  const { object } = await generateObject({
    model: getModel('supervisor'), // Use Opus 4.6 for heavy structural reasoning
    schema: IntakeResultSchema,
    prompt: `You are an aviation training Intake Agent.
    
Given the raw text content of a document named "${fileName}", parse it and structure it into a series of slides or learning sections.
For each slide/section, provide:
1. index: The sequence number (1-based).
2. title: A descriptive slide/section title.
3. textContent: The key learning bullet points or paragraphs.
4. hasImages: Set to true if the text mentions diagrams, figures, or illustrations.
5. hasCharts: Set to true if it mentions tables, charts, or data sheets.
6. notes: Speaker notes or supplementary instruction context.

Ensure the structure is logical, chronological, and focuses on aviation training concepts.

Raw Document Text:
${rawText.slice(0, 25000)}`,
  });

  const ms = elapsed();
  await logAgentDecision({
    agentName: 'intake' as any,
    action: 'structure_document',
    inputSummary: `File: ${fileName}, length: ${rawText.length} chars`,
    outputSummary: `Structured into ${object.slides.length} slides/sections.`,
    confidenceScore: 0.95,
    durationMs: ms,
    relatedModuleId: moduleId,
  });

  // Default slide classification to 'text_heavy' initially
  return object.slides.map(s => ({
    ...s,
    classification: 'text_heavy',
  }));
}
