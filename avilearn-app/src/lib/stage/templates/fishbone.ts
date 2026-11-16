import { z } from 'zod';
import { s } from '../html';
import { label } from '../schema';
import { STAGE } from '../tokens';
import { defineTemplate } from './types';

/**
 * fishbone-build (core): a fishbone (Ishikawa) diagram that builds one
 * category per step, then marks the systemic causes.
 *
 * Data uses the same shape as the Portal fishbone exercise
 * (avilearn-portal lib/iosa/fishbone.ts): problem, categories with causes,
 * and isSystemic on a cause. The Portal tool is where teams fill in their own
 * diagram; this template is the instructor's worked example.
 *
 * Steps: 1 = the event and the spine. 2..n+1 = one category bone with its
 * causes (the new bone at 100%, earlier bones at 30%). Last = every bone at
 * 100%, systemic causes filled in the accent colour, other causes at 30%.
 *
 * Layout is in slide pixels (1920 x 1080). Bones alternate above and below
 * the spine, right to left, and lean back toward the tail.
 */

const C = STAGE.canvas;
const SY = 640; // spine level
const TAIL = 150;
const HEAD_X = 1450;
const RISE = 270;
const RUN = 165;
const FIRST = 1370; // attach point of the first bone
const GAP = 210; // attach spacing; same-side bones are 2 x GAP apart

export interface FishboneBone {
  x: number;
  up: 1 | -1;
  end: [number, number];
  causes: [number, number][];
}

/** Attach points and cause positions for n categories with k[i] causes each. */
export function fishboneGeometry(k: number[]): FishboneBone[] {
  return k.map((n, i) => {
    const x = FIRST - i * GAP;
    const up = (i % 2 === 0 ? 1 : -1) as 1 | -1;
    const end: [number, number] = [x - RUN, SY - up * RISE];
    const causes = Array.from({ length: n }, (_, j): [number, number] => {
      const f = n === 1 ? 0.5 : n === 2 ? 0.36 + 0.36 * j : 0.3 + 0.25 * j;
      return [x - RUN * f, SY - up * RISE * f];
    });
    return { x, up, end, causes };
  });
}

const r = (v: number) => Math.round(v);

export const fishboneBuild = defineTemplate({
  id: 'fishbone-build',
  purpose:
    'Fishbone (cause and effect) diagram for an event: 3 to 5 categories with 1 to 3 short causes (5 words max) each. Builds one category per step, then marks the systemic causes. Same data shape as the Portal fishbone exercise.',
  schema: z.object({
    /** The event at the head of the fish. */
    problem: label(6),
    categories: z
      .array(
        z.object({
          name: label(3),
          causes: z.array(z.object({ text: label(5), isSystemic: z.boolean().optional() })).min(1).max(3),
        }),
      )
      .min(3)
      .max(5),
    /** Legend for the last step. */
    systemicLabel: label(3).default('Systemic cause'),
  }),
  needsAssertion: true,
  parts: (d) => d.categories.length + 2,
  fullView: false,
  lastIsFull: true,
  render: (d, ctx) => {
    const bones = fishboneGeometry(d.categories.map((c) => c.causes.length));
    const last = d.categories.length + 2;
    const fin = `M${TAIL + 4} ${SY} L${TAIL - 46} ${SY - 46} M${TAIL + 4} ${SY} L${TAIL - 46} ${SY + 46}`;
    const cats = d.categories
      .map((c, i) => {
        const b = bones[i];
        const st = i + 2;
        const ly = b.up === 1 ? b.end[1] - 64 : b.end[1] + 14;
        const causes = c.causes
          .map((k, j) => {
            const [px, py] = b.causes[j];
            return `<div class="st-fb-c${k.isSystemic ? ' st-fb-sys' : ''}" style="right:${r(C.width - px)}px;top:${r(py - 24)}px" ${ctx.motion.m(st, 'reveal')}><b>${ctx.log.t(st, k.text)}</b><i></i></div>`;
          })
          .join('');
        return `<div class="st-fb-cat" ${s(st)}>
          <svg viewBox="0 0 ${C.width} ${C.height}" aria-hidden="true"><line x1="${b.x}" y1="${SY}" x2="${r(b.end[0])}" y2="${r(b.end[1])}" pathLength="1" ${ctx.motion.m(st, 'draw')}/></svg>
          <div class="st-fb-cn" style="left:${r(b.end[0] - 200)}px;top:${ly}px" ${ctx.motion.m(st, 'reveal')}><span>${ctx.log.t(st, c.name)}</span></div>
          ${causes}
        </div>`;
      })
      .join('');
    return `
    <div class="st-fb">
      <div class="st-fb-core" ${s(1, true)}>
        <svg viewBox="0 0 ${C.width} ${C.height}" aria-hidden="true">
          <line class="st-fb-spine" x1="${TAIL}" y1="${SY}" x2="${HEAD_X}" y2="${SY}" pathLength="1" ${ctx.motion.m(1, 'draw')}/>
          <path class="st-fb-fin" d="${fin}"/>
        </svg>
        <div class="st-fb-head" style="left:${HEAD_X - 34}px;top:${SY - 120}px" ${ctx.motion.m(1, 'reveal')}>
          <span class="st-fb-hk">Event</span><span class="st-fb-ht">${ctx.log.t(1, d.problem)}</span>
        </div>
      </div>
      ${cats}
      <div class="st-fb-end" ${s(last)}><span class="st-fb-key" ${ctx.motion.m(last, 'reveal')}><i></i>${ctx.log.t(last, d.systemicLabel)}</span></div>
    </div>`;
  },
});

export const FISHBONE_CSS = `
/* fishbone-build: drawn in slide pixels over the whole slide */
.t-fishbone-build .st-body{position:static}
.st-fb{position:absolute;left:-${C.safe.x}px;top:-${C.safe.top}px;width:${C.width}px;height:${C.height}px;pointer-events:none}
.st-fb svg{position:absolute;left:0;top:0;width:${C.width}px;height:${C.height}px;overflow:visible}
.st-fb-cat,.st-fb-core,.st-fb-end{position:absolute;inset:0}
.st-slide .st-fb-core.st-past{opacity:1}
.st-fb-spine{stroke:var(--s-ink);stroke-width:7;stroke-linecap:round}
.st-fb-fin{fill:none;stroke:var(--s-ink);stroke-width:7;stroke-linecap:round}
.st-fb-cat line{stroke:var(--s-ink);stroke-width:4;stroke-linecap:round}
.st-fb-head{position:absolute;width:394px;height:240px;box-sizing:border-box;padding:26px 26px 0 52px;display:flex;flex-direction:column;gap:10px;
  background:var(--s-accent-fill);color:var(--s-bg);clip-path:polygon(34px 0,100% 0,100% 100%,34px 100%,0 50%);border-radius:0 ${STAGE.radius.box}px ${STAGE.radius.box}px 0}
.st-fb-hk{font:600 22px/1 var(--s-font-mono);letter-spacing:.08em;text-transform:uppercase;opacity:.85}
.st-fb-ht{font:700 34px/1.12 var(--s-font-body)}
.st-fb-cn{position:absolute;width:400px;text-align:center}
.st-fb-cn span{display:inline-block;font:700 30px/1 var(--s-font-display);letter-spacing:.04em;text-transform:uppercase;color:var(--s-ink);padding-bottom:8px;border-bottom:4px solid var(--s-accent-fill)}
.st-fb-c{position:absolute;height:48px;display:flex;align-items:center;gap:14px;white-space:nowrap;transition-property:opacity,transform}
.st-fb-c b{font:600 27px/48px var(--s-font-body);color:var(--s-ink);padding:0 16px;border-radius:7px;transition:background-color ${STAGE.motion.enter}ms,color ${STAGE.motion.enter}ms}
.st-fb-c i{display:block;width:46px;height:3px;background:var(--s-ink)}
.st-fb-end{display:flex;align-items:flex-end;justify-content:center;padding-bottom:58px;box-sizing:border-box}
.st-fb-key{display:flex;align-items:center;gap:14px;font:600 26px/1 var(--s-font-body);color:var(--s-ink)}
.st-fb-key i{display:block;width:36px;height:24px;border-radius:5px;background:var(--s-accent-fill)}
/* last step: systemic causes fill, the rest step back */
.st-fb:has(.st-fb-end.st-act) .st-fb-c:not(.st-fb-sys){opacity:${STAGE.steps.past}}
.st-fb:has(.st-fb-end.st-act) .st-fb-sys b{background:var(--s-accent-fill);color:var(--s-bg)}
`;
