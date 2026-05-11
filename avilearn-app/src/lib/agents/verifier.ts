import { generateObject } from 'ai';
import { z } from 'zod';
import { getModel } from './anthropic-client';
import { logAgentDecision, timer } from './logger';
import type { AgentContext, SimulationType } from './types';

const VerificationSchema = z.object({
  score: z.number().min(0).max(100),
  passed: z.boolean(),
  smeFlags: z.array(z.string()),
  feedback: z.string(),
  accessibilityNotes: z.string(),
  interactivityLevel: z.enum(['passive', 'low', 'medium', 'high']),
  objectivesCovered: z.array(z.string()),
  objectivesMissing: z.array(z.string()),
});

export type VerificationResult = z.infer<typeof VerificationSchema>;

export async function verifySimulation(
  context: AgentContext,
  simType: SimulationType,
  htmlCode: string
): Promise<VerificationResult> {
  const elapsed = timer();

  const { object } = await generateObject({
    model: getModel('verifier'),
    schema: VerificationSchema,
    prompt: `You are an aviation training quality assurance reviewer and Subject Matter Expert (SME) gate.

Review the following generated HTML simulation against the module's learning objectives.

MODULE: "${context.moduleTitle}"
COURSE: ${context.courseCode}
SIMULATION TYPE: ${simType}

LEARNING OBJECTIVES:
${context.learningObjectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}

HTML SIMULATION CODE (first 5000 chars):
${htmlCode.slice(0, 5000)}

EVALUATE:
1. **Pedagogic Quality** (0-100): Does the simulation effectively teach the learning objectives?
2. **Interactivity Level**: Is the learner actively engaged (not passively reading)?
3. **Objective Coverage**: Which objectives are covered vs missing?
4. **SME Flags**: Flag any aviation-specific content that needs expert verification. 
   Examples: procedural steps, regulatory references, safety-critical information.
5. **Accessibility**: Note any WCAG issues visible in the code.

A simulation PASSES if:
- Score >= 70
- Interactivity is "medium" or "high"
- No critical safety inaccuracies detected

Set passed=true if the simulation meets all criteria.`,
  });

  const ms = elapsed();
  await logAgentDecision({
    agentName: 'verifier',
    action: 'verify_simulation',
    inputSummary: `Type: ${simType}, Module: ${context.moduleTitle}`,
    outputSummary: `Score: ${object.score}, Passed: ${object.passed}, SME flags: ${object.smeFlags.length}`,
    confidenceScore: object.score / 100,
    durationMs: ms,
    relatedModuleId: context.moduleId,
  });

  return object;
}
