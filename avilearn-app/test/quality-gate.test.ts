import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSlideQuestions,
  buildSlideInput,
  countWords,
  interpretSlide,
  reportToSmeFlags,
  runQualityGate,
  type DecisionAnswer,
  type DecisionsClient,
} from '../src/lib/agents/quality-gate';
import type { ParsedSlide } from '../src/lib/transform/types';

const slide = (over: Partial<ParsedSlide> = {}): ParsedSlide => ({
  index: 1,
  title: 'Hazard identification',
  textContent: 'Report every hazard.',
  classification: 'text_heavy',
  hasImages: false,
  hasCharts: false,
  ...over,
});

const noul = (p: number): DecisionAnswer => ({ type: 'noul', noul: p, confidence: Math.max(p, 1 - p) });
const choice = (c: string, conf: number): DecisionAnswer => ({ type: 'choice', choice: c, probabilities: { [c]: conf }, confidence: conf });
const score = (s: number): DecisionAnswer => ({ type: 'score', score: s, probabilities: {}, confidence: 0.9 });

const clean = (): Record<string, DecisionAnswer> => ({
  slide_type: choice('text_heavy', 0.95),
  multiple_ideas: noul(0.05),
  sme_check: noul(0.05),
  visual_candidate: noul(0.1),
  projector: score(2.8),
});

test('questions stay inside Decisions API limits', () => {
  const q = buildSlideQuestions();
  for (const [key, question] of Object.entries(q)) {
    assert.match(key, /^[A-Za-z0-9_-]{1,64}$/);
    if (question.type === 'choice') {
      const n = Object.keys(question.criteria).length;
      assert.ok(n >= 2 && n <= 255);
    }
    if (question.type === 'score') assert.ok(question.criteria.length >= 2 && question.criteria.length <= 255);
  }
});

test('input never carries base64 image data', () => {
  const input = buildSlideInput(slide({ images: [{ id: 'a', base64: 'SECRETBYTES', width: 1, height: 1, altText: 'x' }] }));
  assert.ok(!input.includes('SECRETBYTES'));
  assert.equal(JSON.parse(input).visual.images, 1);
});

test('a clean slide raises no flags', () => {
  const r = interpretSlide(slide(), clean());
  assert.deepEqual(r.flags, []);
  assert.equal(r.needsReview, false);
});

test('low type confidence goes to review', () => {
  const r = interpretSlide(slide(), { ...clean(), slide_type: choice('diagram', 0.5) });
  assert.deepEqual(r.flags.map((f) => f.code), ['type_uncertain']);
});

test('confident disagreement with the enrichment agent goes to review', () => {
  const r = interpretSlide(slide(), { ...clean(), slide_type: choice('diagram', 0.9) });
  assert.deepEqual(r.flags.map((f) => f.code), ['type_disagrees']);
});

test('rule flags fire at their thresholds', () => {
  const text = Array.from({ length: 45 }, (_, i) => `word${i}`).join(' ');
  const r = interpretSlide(slide({ textContent: text }), {
    ...clean(),
    multiple_ideas: noul(0.8),
    sme_check: noul(0.6),
    visual_candidate: noul(0.9),
    projector: score(0.7),
  });
  assert.deepEqual(r.flags.map((f) => f.code).sort(), ['make_visual', 'sme_check', 'split_slide', 'too_dense', 'too_many_words']);
});

test('make_visual only applies to text and procedure slides', () => {
  const r = interpretSlide(slide({ classification: 'diagram' }), {
    ...clean(),
    slide_type: choice('diagram', 0.95),
    visual_candidate: noul(0.95),
  });
  assert.deepEqual(r.flags, []);
});

test('word count ignores bullets and dashes', () => {
  assert.equal(countWords('• Check — the brakes\n- now'), 4);
});

test('runner keeps going when one slide fails and sums tokens', async () => {
  const client: DecisionsClient = {
    async decide(input) {
      if (JSON.parse(input).title === 'bad') throw new Error('safety');
      return { answers: clean(), inputTokens: 200 };
    },
  };
  const report = await runQualityGate(
    [slide({ index: 1 }), slide({ index: 2, title: 'bad' }), slide({ index: 3 })],
    client,
    { model: 'gemini-decision-1', concurrency: 2 }
  );
  assert.equal(report.slides.length, 2);
  assert.deepEqual(report.errors, [{ index: 2, error: 'safety' }]);
  assert.equal(report.inputTokens, 400);
  assert.ok(Math.abs(report.costUsd - 0.00004) < 1e-12);
  assert.ok(reportToSmeFlags(report).some((f) => f.includes('1 slides were not checked')));
});

test('SME flags put fact checks first and cap the list', async () => {
  const client: DecisionsClient = {
    async decide() {
      return { answers: { ...clean(), sme_check: noul(0.9), projector: score(0.2) }, inputTokens: 1 };
    },
  };
  const slides = Array.from({ length: 30 }, (_, i) => slide({ index: i + 1 }));
  const report = await runQualityGate(slides, client, { model: 'm' });
  const flags = reportToSmeFlags(report, 10);
  assert.equal(flags.length, 11);
  assert.ok(flags[0].includes('expert must verify'));
  assert.ok(flags[10].includes('50 more flags'));
});
