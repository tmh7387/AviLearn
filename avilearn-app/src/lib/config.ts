/**
 * AviLearn — AI model configuration.
 * All model names MUST be referenced from this file. Never hardcode model strings.
 *
 * Strategy: Opus 4.6 for "thinking" (classification, verification, lesson plan design)
 *           Sonnet 4.6 for "doing" (research, code generation, quiz generation)
 */

export const AI_CONFIG = {
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    thinkingModel: process.env.ANTHROPIC_THINKING_MODEL || 'claude-opus-4-6',
    doingModel: process.env.ANTHROPIC_DOING_MODEL || 'claude-sonnet-4-6',
  },
  agents: {
    supervisor: process.env.ANTHROPIC_THINKING_MODEL || 'claude-opus-4-6',
    researcher: process.env.ANTHROPIC_DOING_MODEL || 'claude-sonnet-4-6',
    simDesigner: process.env.ANTHROPIC_DOING_MODEL || 'claude-sonnet-4-6',
    verifier: process.env.ANTHROPIC_THINKING_MODEL || 'claude-opus-4-6',
    slideDesigner: process.env.ANTHROPIC_DOING_MODEL || 'claude-sonnet-4-6',
    lessonPlanGenerator: process.env.ANTHROPIC_THINKING_MODEL || 'claude-opus-4-6',
    quizGenerator: process.env.ANTHROPIC_DOING_MODEL || 'claude-sonnet-4-6',
    objectiveAligner: process.env.ANTHROPIC_DOING_MODEL || 'claude-sonnet-4-6',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    imageModel: process.env.GEMINI_IMAGE_MODEL || 'imagen-3.0-generate-002',
  },
} as const;

