/**
 * Live smoke test of the quality gate against Gemini Decision 1.
 * Usage: GEMINI_API_KEY=<key> npx tsx scripts/gate-live.ts
 */
import { runQualityGate } from '../src/lib/agents/quality-gate';
import { createGeminiDecisionsClient } from '../src/lib/agents/decisions-client';

const slides = [
  { index: 1, title: 'Root Cause Analysis', textContent: 'Module 14. Aviation Synergy.', notes: 'Welcome the group.', images: [], shapes: [], tables: [], hasCharts: false, classification: 'title_slide' },
  { index: 2, title: 'Why we investigate', textContent: 'ICAO Annex 19 requires a State Safety Programme. Operators must keep occurrence records for 5 years. EASA Part-ORO.GEN.200 requires a management system. Investigation is not about blame. We also need to cover the reporting form, the deadlines for mandatory reports within 72 hours, the safety review board, the budget for training, and how the hangar roster works on weekends.', notes: '', images: [], shapes: [], tables: [], hasCharts: false, classification: 'text_heavy' },
  { index: 3, title: 'Run a 5-Why', textContent: '1. State the problem. 2. Ask why it happened. 3. Ask why again for each answer. 4. Stop at a cause you can act on. 5. Write the action and the owner.', notes: 'Use the hydraulic leak example.', images: [], shapes: [], tables: [], hasCharts: false, classification: 'procedure_checklist' },
  { index: 4, title: 'Fishbone categories', textContent: 'People  Procedures  Equipment  Environment  Management  Materials', notes: '', images: [], shapes: Array.from({ length: 8 }, (_, i) => ({ groupId: 'g1', id: String(i) })), tables: [], hasCharts: false, classification: 'diagram' },
  { index: 5, title: 'Check your understanding', textContent: 'A torque wrench was out of calibration. Which bone of the fishbone does this belong to? A) People B) Equipment C) Environment', notes: 'Answer: B', images: [], shapes: [], tables: [], hasCharts: false, classification: 'quiz_exercise' },
];

async function main() {
  const t0 = Date.now();
  const report = await runQualityGate(slides as never, createGeminiDecisionsClient(), { model: process.env.GEMINI_DECISION_MODEL || 'gemini-decision-1' });
  console.log(JSON.stringify({ ms: Date.now() - t0, ...report }, null, 2));
}
main().catch((e) => { console.error(e); process.exit(1); });
