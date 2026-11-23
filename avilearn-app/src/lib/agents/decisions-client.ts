import { GoogleGenAI } from '@google/genai';
import { AI_CONFIG } from '../config';
import type { DecisionAnswer, DecisionQuestion, DecisionsClient } from './quality-gate';

/**
 * Gemini Decisions API client (Gemini Decision 1). Server only.
 * Needs a paid-tier GEMINI_API_KEY: on the free tier Google may use the
 * content to improve its products, so customer slides must not go there.
 */
export function createGeminiDecisionsClient(): DecisionsClient {
  const apiKey = AI_CONFIG.gemini.apiKey;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  const ai = new GoogleGenAI({ apiKey, apiVersion: 'v1beta' });
  const model = AI_CONFIG.gemini.decisionModel;

  return {
    async decide(input: string, questions: Record<string, DecisionQuestion>, signal?: AbortSignal) {
      const res = await ai.decisions.create(
        { model, input, questions },
        signal ? { signal } : undefined
      );
      const usage = (res as { usage?: { total_input_tokens?: number } }).usage;
      return {
        answers: (res.answers ?? {}) as Record<string, DecisionAnswer>,
        inputTokens: usage?.total_input_tokens ?? 0,
      };
    },
  };
}
