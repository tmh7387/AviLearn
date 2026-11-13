import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contrast } from '../src/lib/stage/tokens';
import { NAV_CHART, THEME_PACKS, ownerOf } from '../src/lib/stage/packs';
import { compileDeck, auditColors } from '../src/lib/stage/compiler';
import { TEMPLATES, stepCount } from '../src/lib/stage/templates';
import { SAMPLE_DECKS } from '../src/lib/stage/samples';
import type { SlideDeckSpecInput } from '../src/lib/stage/schema';

test('text tokens meet WCAG AA (4.5:1) on the canvas in both modes of every theme pack', () => {
  for (const pack of THEME_PACKS.values()) {
    for (const name of ['light', 'dark'] as const) {
      const t = pack.modes[name];
      for (const key of ['ink', 'inkMuted', 'accent'] as const) {
        const ratio = contrast(t[key], t.bg);
        assert.ok(ratio >= 4.5, `${pack.id}.${name}.${key} is ${ratio.toFixed(2)}:1`);
      }
    }
  }
});

test('every sample deck compiles with no QA errors', () => {
  for (const [key, spec] of Object.entries(SAMPLE_DECKS)) {
    const out = compileDeck(spec);
    const errors = out.issues.filter((i) => i.level === 'error');
    assert.deepEqual(errors, [], `${key}: ${errors.map((e) => e.message).join('; ')}`);
    assert.ok(out.html.startsWith('<!doctype html>'));
  }
});

test('core templates are used by at least 2 sample courses, industry templates by 1', () => {
  const used = new Map<string, Set<string>>();
  for (const spec of Object.values(SAMPLE_DECKS)) {
    for (const s of spec.slides) {
      if (!used.has(s.templateId)) used.set(s.templateId, new Set());
      used.get(s.templateId)!.add(spec.course);
    }
  }
  for (const id of TEMPLATES.keys()) {
    const need = ownerOf(id) ? 1 : 2;
    assert.ok((used.get(id)?.size ?? 0) >= need, `${id} is used by fewer than ${need} course(s)`);
  }
});

const base = (slide: unknown): SlideDeckSpecInput => ({
  specVersion: 'stage/1',
  programme: 'test',
  course: 'Test course',
  module: { code: 'T 01', title: 'Test' },
  lesson: { title: 'Test' },
  slides: [slide as SlideDeckSpecInput['slides'][number]],
});

test('a headline over 12 words is rejected', () => {
  const out = compileDeck(base({
    id: 'a', templateId: 'hero-number',
    assertion: 'one two three four five six seven eight nine ten eleven twelve thirteen',
    data: { value: '4', label: 'Things' }, steps: [{ speakerNotes: 'x' }],
  }));
  assert.ok(out.issues.some((i) => i.level === 'error' && i.code === 'schema'));
});

test('a slide over the 30-word hard limit fails; over 20 only warns', () => {
  const items = (n: number) => Array.from({ length: n }, (_, i) => `Item ${i} has four`);
  const mk = (n: number) => compileDeck(base({
    id: 'c', templateId: 'checklist', assertion: 'This headline adds seven more words here',
    data: { items: items(n) }, steps: Array.from({ length: n + 1 }, () => ({ speakerNotes: 'x' })),
  }));
  assert.ok(mk(6).issues.some((i) => i.level === 'error' && i.code === 'words'));
  const five = mk(5).issues.filter((i) => i.code === 'words');
  assert.ok(five.every((i) => i.level === 'warn') && five.length === 1);
});

test('step count must match the template build plan', () => {
  const out = compileDeck(base({
    id: 'p', templateId: 'procedure-flow', assertion: 'Do it in order',
    data: { steps: ['One', 'Two', 'Three'] }, steps: [{ speakerNotes: 'only one' }],
  }));
  assert.ok(out.issues.some((i) => i.code === 'steps'));
  assert.equal(stepCount(TEMPLATES.get('procedure-flow')!, { steps: ['a', 'b', 'c'] }), 4);
});

test('content templates need an assertion headline', () => {
  const out = compileDeck(base({ id: 'h', templateId: 'hero-number', data: { value: '8', label: 'Disciplines' }, steps: [{ speakerNotes: 'x' }] }));
  assert.ok(out.issues.some((i) => i.code === 'assertion'));
});

test('colour audit flags literals that are not tokens', () => {
  assert.equal(auditColors('<div style="color:#ef4444"></div>', NAV_CHART).length, 1);
  assert.equal(auditColors(`<div style="color:${NAV_CHART.modes.light.ink}"></div>`, NAV_CHART).length, 0);
});

test('every step needs speaker notes', () => {
  const out = compileDeck(base({ id: 'q', templateId: 'questions', data: {}, steps: [{ speakerNotes: '' }] }));
  assert.ok(out.issues.some((i) => i.code === 'schema'));
});

test('the voice check rejects stock AI phrases', () => {
  for (const assertion of ['Five Parts, One Risk Cycle', 'Three Things to Take Back', 'By the end you can run one risk cycle']) {
    const out = compileDeck(base({ id: 'v', templateId: 'hero-number', assertion, data: { value: '4', label: 'Things' }, steps: [{ speakerNotes: 'x' }] }));
    assert.ok(out.issues.some((i) => i.code === 'voice'), assertion);
  }
  const ok = compileDeck(base({ id: 'v', templateId: 'hero-number', assertion: 'Which ISM Edition Governs You', data: { value: '19', label: 'Edition from 2027' }, steps: [{ speakerNotes: 'x' }] }));
  assert.ok(!ok.issues.some((i) => i.code === 'voice'));
});

test('a domain template is rejected outside its industry pack', () => {
  const slide = { id: 't', templateId: 'phase-of-flight', assertion: 'Threats Arise in Every Phase', data: { phases: ['One', 'Two', 'Three', 'Four', 'Five'].map((value) => ({ value })) }, steps: [1, 2, 3, 4, 5, 6].map(() => ({ speakerNotes: 'x' })) };
  const general = compileDeck({ ...base(slide), theme: 'studio-neutral', vertical: 'general' });
  assert.ok(general.issues.some((i) => i.code === 'pack'));
  const aviation = compileDeck({ ...base(slide), vertical: 'aviation' });
  assert.ok(!aviation.issues.some((i) => i.code === 'pack'));
});

test('an unknown theme pack is a QA error', () => {
  const out = compileDeck({ ...base({ id: 'q', templateId: 'questions', data: {}, steps: [{ speakerNotes: 'x' }] }), theme: 'no-such-pack' });
  assert.ok(out.issues.some((i) => i.code === 'pack'));
  assert.equal(out.html, '');
});

test('the theme pack sets brand text, fonts and colours', () => {
  const slide = { id: 'c', templateId: 'course-title', data: { title: 'Giving Useful Feedback' }, steps: [{ speakerNotes: 'x' }] };
  const nav = compileDeck(base(slide));
  assert.ok(nav.html.includes('Aviation Synergy') && nav.html.includes('Barlow'));
  const neutral = compileDeck({ ...base(slide), theme: 'studio-neutral', vertical: 'general' });
  assert.ok(neutral.html.includes('Sample Organisation') && neutral.html.includes('Inter'));
  assert.ok(!neutral.html.includes('Aviation Synergy') && !neutral.html.includes('AviLearn'));
});
