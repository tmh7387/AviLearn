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

export const timeline = defineTemplate({
    id: 'timeline',
    purpose: 'Events along a time axis, 3 to 6 pins. `at` is a time, date or stage. key marks the events that matter most.',
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

/**
 * The five phases of flight, A to B. Keys and short labels match the Portal
 * flight-profile tool (avilearn-portal lib/crm/course-content.ts W4_PHASES),
 * so a slide and a live workshop board read the same. Keys never change.
 */
export const FLIGHT_PHASES = [
  { key: 'pre-departure-taxi', label: 'Pre-Dep/Taxi' },
  { key: 'takeoff-climb', label: 'TKOF/CLB' },
  { key: 'cruise', label: 'Cruise' },
  { key: 'descent-approach-land', label: 'Desc/App/Lnd' },
  { key: 'taxi-park', label: 'Taxi/Park' },
] as const;

// Route in a 1000 x 100 box, same shape as the Portal diagram: ground at 80,
// cruise at 20, each arrow stops short of the column line.
const FP_SEGMENTS = [
  [40, 80, 180, 80],
  [215, 80, 385, 20],
  [415, 20, 585, 20],
  [615, 20, 785, 80],
  [820, 80, 960, 80],
];

/** Aviation pack: any topic by phase of flight (threats, errors, workload). */
export const phaseOfFlight = defineTemplate({
  id: 'phase-of-flight',
  purpose:
    'Aviation pack. One value per phase of flight, A to B: Pre-Dep/Taxi, TKOF/CLB, Cruise, Desc/App/Lnd, Taxi/Park. Any topic: threats, errors, workload. Optional bar (0-100) per phase. Optional latent band for whole-flight items. key marks the phases that matter most.',
  schema: z.object({
    phases: z
      .array(z.object({ value: label(3), bar: z.number().min(0).max(100).optional(), key: z.boolean().optional() }))
      .length(FLIGHT_PHASES.length),
    latent: z.object({ label: label(2).default('Latent'), value: label(4) }).optional(),
  }),
  needsAssertion: true,
  parts: (d) => d.phases.length + (d.latent ? 1 : 0),
  fullView: true,
  render: (d, ctx) => {
    const bars = d.phases.some((p) => p.bar !== undefined);
    const top = Math.max(1, ...d.phases.map((p) => p.bar ?? 0));
    const cols = d.phases
      .map((p, i) => {
        const h = bars ? Math.round(((p.bar ?? 0) / top) * 100) : 0;
        return `<div class="st-fp-col${p.key ? ' st-hot-text' : ''}" ${s(i + 1)}>
          <div class="st-fp-ph">${ctx.log.t(i + 1, FLIGHT_PHASES[i].label)}</div>
          <div class="st-fp-v">${ctx.log.t(i + 1, p.value)}</div>
          ${bars ? `<div class="st-fp-bar"><i style="height:${h}%"></i></div>` : ''}
        </div>`;
      })
      .join('');
    const route = FP_SEGMENTS.map(
      ([x1, y1, x2, y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#st-fp-arrow)"/>`,
    ).join('');
    const ls = d.phases.length + 1;
    return `
      <div class="st-fp${bars ? ' st-fp-bars' : ''}">
        <div class="st-fp-cols">${cols}</div>
        <div class="st-fp-route" ${s(1, true)}>
          <svg viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">
            <defs><marker id="st-fp-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
            ${route}
          </svg>
          <i class="st-fp-dot" style="left:2%"></i><i class="st-fp-dot" style="left:98%"></i><span class="st-fp-a">A</span><span class="st-fp-b">B</span>
        </div>
        ${d.latent ? `<div class="st-fp-latent" ${s(ls)}><span class="st-fp-ph">${ctx.log.t(ls, d.latent.label)}</span><span class="st-fp-lv">${ctx.log.t(ls, d.latent.value)}</span></div>` : ''}
      </div>`;
  },
});

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
