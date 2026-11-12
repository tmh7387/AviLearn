import { z } from 'zod';
import { esc, s } from '../html';
import { label } from '../schema';
import { defineTemplate } from './types';

export const knowledgeCheck = defineTemplate({
  id: 'knowledge-check',
  purpose: 'Question with 2 to 4 options. Step 1 asks; step 2 reveals the answer.',
  schema: z.object({
    question: label(14),
    options: z.array(label(6)).min(2).max(4),
    answerIndex: z.number().int().min(0),
  }),
  needsAssertion: false,
  parts: () => 2,
  fullView: false,
  lastIsFull: true,
  render: (d, ctx) => `
    <div class="st-kc">
      <p class="st-kc-q" ${s(1, true)}>${ctx.log.t(1, d.question)}</p>
      <div class="st-kc-opts">
        ${d.options
          .map(
            (o, i) =>
              `<div class="st-box st-kc-opt" ${s(1, true)}><span class="st-kc-k">${String.fromCharCode(65 + i)}</span><span class="st-box-t">${ctx.log.t(1, o)}</span>${
                i === d.answerIndex ? `<span class="st-kc-mark" ${s(2)}></span>` : ''
              }</div>`,
          )
          .join('')}
      </div>
    </div>`,
});

export const exerciseLaunch = defineTemplate({
  id: 'exercise-launch',
  purpose: 'Sends the room to a live workshop tool on the Portal. Names the exercise, the tool, the task and the time.',
  schema: z.object({
    exercise: label(6),
    tool: label(3),
    task: label(12),
    minutes: z.number().int().positive().max(240).optional(),
    team: z.boolean().default(true),
    /** Portal address shown to the room. A QR code is planned for Phase 3. */
    url: z.string().max(80).optional(),
  }),
  needsAssertion: false,
  parts: () => 1,
  fullView: false,
  render: (d, ctx) => `
    <div class="st-ex">
      <div class="st-ex-k" ${s(1)}>Exercise · ${esc(ctx.theme.portal)}</div>
      <h2 class="st-ex-title" ${s(1)}>${ctx.log.t(1, d.exercise)}</h2>
      <p class="st-ex-task" ${s(1)}>${ctx.log.t(1, d.task)}</p>
      <div class="st-ex-facts" ${s(1)}>
        <span class="st-chip st-hot">${ctx.log.t(1, d.tool)}</span>
        ${d.minutes ? `<span class="st-chip">${d.minutes} min</span>` : ''}
        <span class="st-chip">${d.team ? 'Team' : 'Individual'}</span>
      </div>
      ${d.url ? `<div class="st-ex-url" ${s(1)}>${esc(d.url)}</div>` : ''}
    </div>`,
});
