import { generateObject } from 'ai';
import { z } from 'zod';
import { getModel } from './anthropic-client';
import { logAgentDecision, timer } from './logger';
import type { AgentContext, ContentDomain } from './types';

const ClassificationSchema = z.object({
  domain: z.enum([
    'rca', 'procedure', 'human_factors', 'ndt_inspection',
    'emergency', 'regulatory', 'data_entry', 'hazard_id',
  ]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

export type ClassificationResult = z.infer<typeof ClassificationSchema>;

export async function classifyContentDomain(
  context: AgentContext
): Promise<ClassificationResult> {
  const elapsed = timer();

  const { object } = await generateObject({
    model: getModel('supervisor'),
    schema: ClassificationSchema,
    prompt: `You are an aviation training content domain classifier.

Given the following module information, classify it into the most appropriate content domain.

Module: "${context.moduleTitle}"
Course: ${context.courseCode}
Learning Objectives:
${context.learningObjectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}

${context.slideContent ? `Content excerpt:\n${context.slideContent.slice(0, 2000)}` : ''}

Content domains:
- rca: Root cause analysis, fault analysis, Ishikawa, 5-Why
- procedure: Step-by-step operational or maintenance procedures, checklists
- human_factors: CRM, SHELL model, human performance, decision-making
- ndt_inspection: Non-destructive testing, borescope, eddy current, visual inspection
- emergency: Fire, evacuation, abnormal procedures, time-critical actions
- regulatory: Part 145, EASA-66, FARs, compliance, documentation requirements
- data_entry: Form completion, release certificates, paperwork validation
- hazard_id: Hazard identification, risk assessment, SMS reporting

Classify with confidence (0-1) and explain your reasoning.`,
  });

  const ms = elapsed();
  await logAgentDecision({
    agentName: 'supervisor',
    action: 'classify_content_domain',
    inputSummary: `Module: ${context.moduleTitle} (${context.courseCode})`,
    outputSummary: `Domain: ${object.domain} (${(object.confidence * 100).toFixed(0)}%)`,
    confidenceScore: object.confidence,
    durationMs: ms,
    relatedModuleId: context.moduleId,
  });

  return object;
}
