/**
 * Objective Aligner Agent — checks how well a slide covers
 * the module's assigned course-level learning objectives.
 *
 * Uses generateObject() with a Zod schema for structured coverage analysis.
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import { getModel } from './anthropic-client';
import { logAgentDecision, timer } from './logger';
import type { SmartObjective, AlignmentReport } from './types';

// --- Zod schema for the alignment report ---

const AlignmentSchema = z.object({
  objectives: z.array(
    z.object({
      index: z.number().int().describe('The course-level objective index'),
      text: z.string().describe('The full objective text'),
      coverage: z.enum(['fully_covered', 'partially_covered', 'not_covered']),
      evidence: z.string().describe('Quote or reference from the slide that supports coverage'),
      suggestion: z.string().optional().describe('What to add if partially or not covered'),
    }),
  ),
  overallCoverage: z.number().min(0).max(100)
    .describe('Percentage of objectives fully or partially covered'),
  recommendations: z.array(z.string())
    .describe('1-3 actionable recommendations for improving objective coverage'),
});

// --- System prompt ---

const SYSTEM_PROMPT = `You are an aviation training quality reviewer analyzing whether
slide content adequately addresses its assigned learning objectives.

For each objective, evaluate:
1. Does the slide content address the SPECIFIC ACTION VERB in the objective?
   (e.g., if the objective says "list", does the content present information in a list format
   or support the learner in listing items?)
2. Does the content address the CONDITIONS described?
   (e.g., "given a reference manual" — does the slide reference or simulate that condition?)
3. Does the content support the PERFORMANCE STANDARD?
   (e.g., "on the first attempt" — is the content clear enough for first-attempt success?)

Rating criteria:
- **fully_covered**: The slide content directly addresses all aspects of the objective
  (action verb, conditions, and standard are all represented or supported)
- **partially_covered**: The slide covers some but not all aspects of the objective
  (e.g., covers the topic but doesn't address the specific action verb or conditions)
- **not_covered**: The slide content does not meaningfully address this objective

For the evidence field:
- If fully or partially covered, quote the specific text from the slide that demonstrates coverage
- If not covered, write "No relevant content found"

For suggestions:
- Only provide for partially_covered or not_covered objectives
- Be specific and actionable (e.g., "Add a practice exercise where learners list the 6M categories")

Calculate overallCoverage as: (fully * 100 + partially * 50) / total objectives

Provide 1-3 recommendations that would most improve the slide's objective alignment.`;

// --- Main export ---

export interface ObjectiveAlignerInput {
  currentHtml: string;
  objectives: SmartObjective[];
  objectiveIndices: number[];
  evaluationStrategy?: string;
  moduleTitle: string;
}

export async function checkObjectiveAlignment(
  input: ObjectiveAlignerInput,
): Promise<AlignmentReport> {
  const elapsed = timer();

  // Build the user prompt with the slide content and objectives
  const objectiveList = input.objectives
    .map(
      (obj, i) =>
        `[${input.objectiveIndices[i] ?? i}] ${obj.text}\n` +
        `   Action verb: ${obj.action_verb} | Bloom's: ${obj.bloom_level}\n` +
        `   Conditions: ${obj.conditions} | Standard: ${obj.standard}`,
    )
    .join('\n\n');

  const userPrompt = `## Module: ${input.moduleTitle}

## Course Learning Objectives Assigned to This Module:

${objectiveList}

${input.evaluationStrategy ? `## Evaluation Strategy:\n${input.evaluationStrategy}\n` : ''}

## Slide Content (HTML):

${input.currentHtml}

Analyze the slide content against each listed objective and produce the alignment report.`;

  const { object } = await generateObject({
    model: getModel('objectiveAligner'),
    schema: AlignmentSchema,
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
  });

  const result = object as AlignmentReport;
  const durationMs = elapsed();

  await logAgentDecision({
    agentName: 'objective_aligner',
    action: 'check_alignment',
    inputSummary: `Module: "${input.moduleTitle}" | ${input.objectives.length} objectives | Slide: ${input.currentHtml.length} chars`,
    outputSummary: `Coverage: ${result.overallCoverage}% | ${result.objectives.filter((o) => o.coverage === 'fully_covered').length} full, ${result.objectives.filter((o) => o.coverage === 'partially_covered').length} partial, ${result.objectives.filter((o) => o.coverage === 'not_covered').length} missing`,
    confidenceScore: result.overallCoverage / 100,
    durationMs,
  });

  return result;
}
