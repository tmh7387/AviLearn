import { createAnthropic } from '@ai-sdk/anthropic';
import { AI_CONFIG } from '@/lib/config';

export const anthropic = createAnthropic({
  apiKey: AI_CONFIG.anthropic.apiKey,
});

export function getModel(role: keyof typeof AI_CONFIG.agents = 'supervisor') {
  const modelName = AI_CONFIG.agents[role];
  return anthropic(modelName);
}
