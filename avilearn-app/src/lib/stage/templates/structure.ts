import { z } from 'zod';
import { esc, roseSvg, s } from '../html';
import { label } from '../schema';
import { defineTemplate } from './types';

const short = (n: number) => label(n);

export const titleBumper = defineTemplate({
  id: 'title-bumper',
  sequence: 'bumper',
  purpose: 'Opening slide of a module or lesson. Module code, title, one-line subtitle, and the theme ornament (compass rose in Nav Chart).',
  schema: z.object({ title: short(5), subtitle: short(10).optional() }),
  needsAssertion: false,
  parts: () => 1,
  fullView: false,
  render: (d, ctx) => `
    ${ctx.theme.ornament === 'compass' ? roseSvg() : ''}
    <div class="st-tb">
      <div class="st-tb-meta" ${s(1)}>${ctx.log.t(1, ctx.deck.module.code)} · ${esc(ctx.deck.course)}</div>
      <h1 class="st-tb-title" ${s(1)}>${ctx.log.t(1, d.title)}</h1>
      ${d.subtitle ? `<p class="st-tb-sub" ${s(1)}>${ctx.log.t(1, d.subtitle)}</p>` : ''}
    </div>`,
});

export const sectionDivider = defineTemplate({
  id: 'section-divider',
  sequence: 'bumper',
  purpose: 'Start of a new section inside a lesson.',
  schema: z.object({ number: z.string().max(4).optional(), title: short(6) }),
  needsAssertion: false,
  parts: () => 1,
  fullView: false,
  render: (d, ctx) => `
    <div class="st-sd">
      ${d.number ? `<div class="st-sd-num" ${s(1)}>${ctx.log.t(1, d.number)}</div>` : ''}
      <h2 class="st-sd-title" ${s(1)}>${ctx.log.t(1, d.title)}</h2>
    </div>`,
});

export const agenda = defineTemplate({
  id: 'agenda',
  purpose: 'Lesson or day agenda. Optionally marks the current item.',
  schema: z.object({ items: z.array(short(5)).min(2).max(7), current: z.number().int().min(0).optional() }),
  needsAssertion: true,
  parts: () => 1,
  fullView: false,
  render: (d, ctx) => `
    <ol class="st-list st-agenda">
      ${d.items
        .map(
          (it, i) =>
            `<li class="st-row${d.current === i ? ' st-hot' : ''}" ${s(1)}><span class="st-row-k">${String(i + 1).padStart(2, '0')}</span><span class="st-row-v">${ctx.log.t(1, it)}</span></li>`,
        )
        .join('')}
    </ol>`,
});

export const objectives = defineTemplate({
  id: 'objectives',
  purpose: 'Learning objectives, one per step. Start each with a verb (Explain, Describe, Apply, Identify).',
  schema: z.object({ items: z.array(short(6)).min(2).max(5) }),
  needsAssertion: true,
  parts: (d) => d.items.length,
  fullView: true,
  render: (d, ctx) => `
    <ol class="st-list st-points">
      ${d.items
        .map(
          (it, i) =>
            `<li class="st-row" ${s(i + 1)}><span class="st-row-k"><svg viewBox="0 0 40 40" aria-hidden="true"><rect class="st-cb" x="2" y="2" width="36" height="36"/><path class="st-tk" pathLength="1" ${ctx.motion.m(i + 1, 'draw')} d="M10 21l7 7 13-15"/></svg></span><span class="st-row-v">${ctx.log.t(i + 1, it)}</span></li>`,
        )
        .join('')}
    </ol>`,
});

export const questions = defineTemplate({
  id: 'questions',
  purpose: 'Questions or discussion slide.',
  schema: z.object({ prompt: short(10).optional() }),
  needsAssertion: false,
  parts: () => 1,
  fullView: false,
  render: (d, ctx) => `
    <div class="st-q">
      <div class="st-q-big" ${s(1)}>${ctx.log.t(1, 'Questions')}</div>
      ${d.prompt ? `<p class="st-q-sub" ${s(1)}>${ctx.log.t(1, d.prompt)}</p>` : ''}
    </div>`,
});
