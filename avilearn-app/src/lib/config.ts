/**
 * AviLearn — AI model configuration.
 * All model names MUST be referenced from this file. Never hardcode model strings.
 *
 * Strategy: Opus 4.6 for "thinking" (classification, verification)
 *           Sonnet 4.6 for "doing" (research, code generation)
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
  },
} as const;
