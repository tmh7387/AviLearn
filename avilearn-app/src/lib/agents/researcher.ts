import { generateObject } from 'ai';
import { z } from 'zod';
import { getModel } from './anthropic-client';
import { logAgentDecision, timer } from './logger';
import type { AgentContext, ContentDomain, SimulationType, SimRecommendation } from './types';

const RecommendationSchema = z.object({
  simType: z.enum([
    'ishikawa-builder', 'five-why-chain', 'decision-tree',
    'step-sequencer', 'drag-drop-matcher', 'hotspot-diagram',
    'timed-scenario', 'form-validator', 'branching-story',
  ]),
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
  pedagogicBasis: z.string(),
  alternativeType: z.enum([
    'ishikawa-builder', 'five-why-chain', 'decision-tree',
    'step-sequencer', 'drag-drop-matcher', 'hotspot-diagram',
    'timed-scenario', 'form-validator', 'branching-story',
  ]).optional(),
});

export async function recommendSimulationType(
  context: AgentContext,
  domain: ContentDomain
): Promise<SimRecommendation> {
  const elapsed = timer();

  const { object } = await generateObject({
    model: getModel('researcher'),
    schema: RecommendationSchema,
    prompt: `You are an aviation training pedagogic researcher specializing in simulation-based learning.

Given the content domain and learning objectives, recommend the MOST pedagogically effective simulation type.

Content Domain: ${domain}
Module: "${context.moduleTitle}"
Course: ${context.courseCode}
Learning Objectives:
${context.learningObjectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}

Available simulation types and when to use them:
- ishikawa-builder: Interactive fishbone diagram — best for root cause analysis, fault categorization. Learner drags cause categories onto branches.
- five-why-chain: Iterative "Why?" questioning — best for tracing proximate causes to root causes. Learner types successive why-answers.
- decision-tree: Branching scenario — best for CRM, human factors, decision-making. Learner chooses paths and sees consequences.
- step-sequencer: Drag-and-drop ordering — best for procedures, checklists, maintenance sequences. Learner arranges steps correctly.
- drag-drop-matcher: Classification/matching — best for terminology, component identification. Learner matches items to categories.
- hotspot-diagram: Interactive image — best for inspection, defect identification, component ID. Learner clicks on correct areas.
- timed-scenario: Time-pressured decisions — best for emergency procedures, quick response. Learner acts within countdown.
- form-validator: Form completion — best for paperwork, release certificates, documentation. Learner fills in and system validates.
- branching-story: Narrative case study — best for complex scenarios combining multiple domains.

Select the type that will best achieve the learning objectives through active learner engagement.
Explain your pedagogic reasoning and cite relevant instructional design principles.`,
  });

  const ms = elapsed();
  await logAgentDecision({
    agentName: 'researcher',
    action: 'recommend_sim_type',
    inputSummary: `Domain: ${domain}, Module: ${context.moduleTitle}`,
    outputSummary: `Recommended: ${object.simType} (${(object.confidence * 100).toFixed(0)}%) — ${object.rationale.slice(0, 100)}`,
    confidenceScore: object.confidence,
    durationMs: ms,
    relatedModuleId: context.moduleId,
  });

  return {
    simType: object.simType as SimulationType,
    confidence: object.confidence,
    rationale: object.rationale,
    pedagogicBasis: object.pedagogicBasis,
  };
}
