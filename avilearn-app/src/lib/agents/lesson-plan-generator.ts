/**
 * Lesson Plan Generator Agent — produces a complete, course-level
 * lesson plan from minimal input using structured output (generateObject).
 *
 * Uses the "thinking" model tier (Opus) for complex instructional design reasoning.
 * Encodes pedagogical best practices in the system prompt.
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import { getModel } from './anthropic-client';
import { logAgentDecision, timer } from './logger';
import type { LessonPlan } from './types';

// --- Zod schema matching the LessonPlan type ---

const SmartObjectiveSchema = z.object({
  text: z.string().describe('Full objective text in SMART format'),
  bloom_level: z.enum(['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']),
  action_verb: z.string().describe('The primary observable action verb used'),
  conditions: z.string().describe('Circumstances under which performance occurs'),
  standard: z.string().describe('Criteria for successful performance'),
  audience: z.string().describe('The target learner, e.g. "the trainee"'),
});

const ModuleTopicSchema = z.object({
  topic: z.string(),
  activities: z.string().describe('What learners and instructor DO during this topic'),
  content: z.string().describe('Key content points covered'),
  instructional_method: z.enum(['direct', 'interactive', 'indirect', 'experiential']),
  time_minutes: z.number().int().positive(),
});

const ConductModuleSchema = z.object({
  module_title: z.string(),
  objective_indices: z.array(z.number().int().min(0))
    .describe('Indices into the course-level learning_objectives array that this module fulfills'),
  topics: z.array(ModuleTopicSchema).min(1),
  module_evaluation: z.string().describe('How this module\'s objectives will be assessed'),
  total_time_minutes: z.number().int().positive(),
});

const LessonPlanPhasesSchema = z.object({
  start: z.object({
    activities: z.string(),
    content: z.string(),
    time_minutes: z.number().int().positive(),
  }),
  conduct: z.array(ConductModuleSchema).min(1),
  wrap_up: z.object({
    activities: z.string(),
    content: z.string(),
    time_minutes: z.number().int().positive(),
  }),
});

const LessonPlanSchema = z.object({
  course_title: z.string(),
  total_time_minutes: z.number().int().positive(),
  instructor: z.string().optional(),
  audience_description: z.string().optional(),
  target_group_size: z.string().optional(),
  rationale: z.string().describe('Why this course matters to the learner (WIIFM)'),
  learning_objectives: z.array(SmartObjectiveSchema).min(1)
    .describe('Course-level SMART learning objectives'),
  evaluation_strategy: z.string()
    .describe('Overall strategy for evaluating whether course objectives are met'),
  instructional_aids: z.array(z.string())
    .describe('Materials, equipment, and resources needed for the course'),
  phases: LessonPlanPhasesSchema,
  notes: z.string().optional(),
  module_objective_indices: z.record(z.string(), z.array(z.number().int().min(0)))
    .describe('Map of module ID to array of objective indices that module fulfills'),
});

type LessonPlanOutput = z.infer<typeof LessonPlanSchema>;

// --- System prompt with pedagogical rules ---

const SYSTEM_PROMPT = `You are an expert instructional designer specializing in aviation training.
Your task is to create a complete, structured course lesson plan that serves as the master
instructional design document for the entire course.

## CRITICAL RULES FOR LEARNING OBJECTIVES

Every learning objective MUST follow the SMART format:
- **Specific**: State exactly what the learner will do
- **Measurable**: Use observable, measurable action verbs
- **Action-oriented**: Begin with an action verb
- **Reasonable**: Achievable within the course timeframe
- **Time-bound**: Include a performance standard with criteria

Format: "Given [conditions], [audience] will be able to [action verb] [specific task] [standard]"

### BANNED VERBS — NEVER use these (they are not observable or measurable):
comprehend, grasp, know, learn, discern, understand, appreciate, be aware, be familiar, realize

### APPROVED ACTION VERBS — ALWAYS use these:
write, list, explain, demonstrate, operate, sketch, compare, construct, identify, describe,
apply, analyze, evaluate, create, classify, distinguish, calculate, assemble, design,
formulate, select, state, define, label, name, recall, recognize, interpret, summarize,
locate, perform, implement, differentiate, examine, categorize, critique, justify, assess,
compose, develop, plan, produce, troubleshoot, inspect, verify, measure, calibrate

## RATIONALE (WIIFM)

The rationale MUST answer the learner's "What's in it for me?" question:
- Why does this course matter to their daily job?
- What real-world problems will they be able to solve?
- How does this protect safety, save time, or improve performance?

## EVALUATION STRATEGY

- Must align DIRECTLY to the behavior stated in each objective
- Use variety: open questions, observation, discussion, hands-on demonstration, performance notes
- Don't rely solely on written tests
- Consider validity (tests what it claims), reliability (consistent results), and variety

## INSTRUCTIONAL METHODS (select per topic based on purpose)

| Method | When to Use |
|--------|-------------|
| Direct (lecture, explanation) | To convey information, introduce concepts |
| Interactive (discussion, sharing) | To involve people, pool ideas, build on experience |
| Indirect (inductive, learner-centered) | To convey difficult or complex subjects |
| Experiential (real-life problem solving) | To teach a practical skill, develop competency |

## ACTIVE TRAINING REQUIREMENT

Every module MUST include at least ONE active training technique:
discussions, hands-on practice, exercises, group assignments, case studies,
role plays, triggers/jolts/games, or simulations.

## INSTRUCTIONAL AIDS

- Must complement and reinforce instruction, NOT replace it
- Don't use aids merely to impress or avoid interaction
- List specific materials, equipment, simulators, software, reference documents

## TIME ALLOCATION

- Must be realistic
- Allocate sufficient time for activities where learners develop and demonstrate mastery
- Include time for questions, transitions, and breaks where appropriate

## 5 COMMON MISTAKES TO AVOID

1. Objective doesn't specify observable behavior
2. Assessment is disconnected from the objective's behavior
3. Materials are extraneous to the described activities
4. Instruction method is not efficient for the intended learning level
5. Student activities don't contribute directly to the learning objective

## MODULE MAPPING

- Each CONDUCT entry maps to exactly one module
- Every course objective must be covered by at least one module
- Use the provided module IDs in the module_objective_indices mapping
- Order CONDUCT entries to match the module sort order

## OUTPUT

Generate a complete lesson plan with all fields populated. Be thorough and specific.
The plan should be immediately usable by an instructor to deliver the course.`;

// --- Main export ---

export interface LessonPlanGeneratorInput {
  courseCode: string;
  courseName: string;
  modules: {
    id: string;
    title: string;
    description?: string;
    learningObjectives?: string[];
  }[];
  contentDomain?: string;
  totalTimeMinutes?: number;
}

export async function generateLessonPlan(
  input: LessonPlanGeneratorInput,
): Promise<LessonPlan & { moduleObjectiveIndices: Record<string, number[]> }> {
  const elapsed = timer();

  const moduleList = input.modules
    .map(
      (m, i) =>
        `${i + 1}. [ID: ${m.id}] "${m.title}"${m.description ? ` — ${m.description}` : ''}${
          m.learningObjectives?.length
            ? `\n   Existing objectives: ${m.learningObjectives.join('; ')}`
            : ''
        }`,
    )
    .join('\n');

  const userPrompt = `Create a complete course lesson plan for:

Course Code: ${input.courseCode}
Course Name: ${input.courseName}
${input.contentDomain ? `Content Domain: ${input.contentDomain}` : ''}
${input.totalTimeMinutes ? `Target Total Duration: ${input.totalTimeMinutes} minutes` : 'Estimate an appropriate total duration'}

Modules (in delivery order):
${moduleList}

Generate the full lesson plan with SMART course-level objectives, WIIFM rationale,
evaluation strategy, instructional aids, and the 3-phase structure (START → CONDUCT → WRAP-UP).
Map each module to the course objectives it fulfills via module_objective_indices.`;

  const { object } = await generateObject({
    model: getModel('lessonPlanGenerator'),
    schema: LessonPlanSchema,
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
  });

  const result = object as LessonPlanOutput;
  const durationMs = elapsed();

  await logAgentDecision({
    agentName: 'lesson_plan_generator',
    action: 'generate_lesson_plan',
    inputSummary: `Course: ${input.courseCode} "${input.courseName}" with ${input.modules.length} modules`,
    outputSummary: `Generated plan: ${result.learning_objectives.length} objectives, ${result.phases.conduct.length} conduct modules, ${result.total_time_minutes}min total`,
    confidenceScore: 0.9,
    durationMs,
  });

  return {
    course_title: result.course_title,
    total_time_minutes: result.total_time_minutes,
    instructor: result.instructor,
    audience_description: result.audience_description,
    target_group_size: result.target_group_size,
    rationale: result.rationale,
    learning_objectives: result.learning_objectives,
    evaluation_strategy: result.evaluation_strategy,
    instructional_aids: result.instructional_aids,
    phases: result.phases,
    notes: result.notes,
    moduleObjectiveIndices: result.module_objective_indices,
  };
}
