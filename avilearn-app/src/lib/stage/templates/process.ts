import { z } from 'zod';
import { s } from '../html';
import { label } from '../schema';
import { defineTemplate } from './types';

export const procedureFlow = defineTemplate({
  id: 'procedure-flow',
  purpose: 'A sequence of 3 to 6 actions, verb first. One step per action.',
  schema: z.object({ steps: z.array(label(4)).min(3).max(6), highlight: z.number().int().min(0).optional() }),
  needsAssertion: true,
  parts: (d) => d.steps.length,
  fullView: true,
  render: (d, ctx) => `
    <div class="st-flow" style="--n:${d.steps.length}">
      ${d.steps
        .map(
          (t, i) =>
            `<div class="st-box st-flow-node${d.highlight === i ? ' st-hot' : ''}" ${s(i + 1)}><div class="st-box-n">${i + 1}</div><div class="st-box-t">${ctx.log.t(i + 1, t)}</div></div>`,
        )
        .join('')}
    </div>`,
});

export const checklist = defineTemplate({
  id: 'checklist',
  purpose: '2 to 6 criteria or checks, one per step.',
  schema: z.object({ items: z.array(label(4)).min(2).max(6) }),
  needsAssertion: true,
  parts: (d) => d.items.length,
  fullView: true,
  render: (d, ctx) => `
    <div class="st-checks${d.items.length > 4 ? ' st-checks-3' : ''}">
      ${d.items
        .map(
          (t, i) =>
            `<div class="st-check" ${s(i + 1)}><svg viewBox="0 0 40 40" aria-hidden="true"><rect class="st-cb" x="2" y="2" width="36" height="36"/><path class="st-tk" d="M10 21l7 7 13-15"/></svg><span>${ctx.log.t(i + 1, t)}</span></div>`,
        )
        .join('')}
    </div>`,
});

const timelineSchema = z.object({
  pins: z
    .array(z.object({ at: z.string().min(1).max(10), label: label(4), key: z.boolean().optional() }))
    .min(3)
    .max(6),
});

const makeTimeline = (id: 'timeline' | 'flight-timeline', purpose: string) =>
  defineTemplate({
    id,
    purpose,
    schema: timelineSchema,
    needsAssertion: true,
    parts: (d) => d.pins.length,
    fullView: true,
    render: (d, ctx) => {
      const n = d.pins.length;
      return `
      <div class="st-tl">
        <div class="st-tl-axis" ${s(1, true)}></div>
        ${d.pins
          .map((p, i) => {
            const left = n === 1 ? 50 : 4 + (i * 92) / (n - 1);
            const up = i % 2 === 0;
            return `<div class="st-tl-pin ${up ? 'st-up' : 'st-down'}${p.key ? ' st-hot-text' : ''}" style="left:${left}%" ${s(i + 1)}>
              <span class="st-tl-at">${ctx.log.t(i + 1, p.at)}</span><span class="st-tl-dot"></span><span class="st-tl-l">${ctx.log.t(i + 1, p.label)}</span></div>`;
          })
          .join('')}
      </div>`;
    },
  });

/** Core: any sequence of events in time. */
export const timeline = makeTimeline('timeline', 'Events along a time axis, 3 to 6 pins. `at` is a time, date or stage. key marks the events that matter most.');

/** Aviation pack: the same build, with phases of flight on the axis. */
export const flightTimeline = makeTimeline('flight-timeline', 'Aviation pack. Events along the phases of flight, 3 to 6 pins. `at` is a phase, time or altitude.');

export const causeChain = defineTemplate({
  id: 'cause-chain',
  purpose: 'Levels of causation from symptom to root cause, 3 to 5 levels. rootIndex marks the root cause.',
  schema: z.object({
    levels: z.array(z.object({ label: label(2), text: label(5) })).min(3).max(5),
    rootIndex: z.number().int().min(0),
  }),
  needsAssertion: true,
  parts: (d) => d.levels.length,
  fullView: true,
  render: (d, ctx) => `
    <div class="st-flow st-chain" style="--n:${d.levels.length}">
      ${d.levels
        .map(
          (l, i) =>
            `<div class="st-box st-flow-node${d.rootIndex === i ? ' st-hot' : ''}" ${s(i + 1)}><div class="st-box-n">${i + 1}</div><div class="st-box-k">${ctx.log.t(i + 1, l.label)}</div><div class="st-box-t">${ctx.log.t(i + 1, l.text)}</div></div>`,
        )
        .join('')}
    </div>`,
});
