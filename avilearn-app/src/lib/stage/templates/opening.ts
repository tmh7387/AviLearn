import { z } from 'zod';
import QRCode from 'qrcode';
import { creditHtml, mediaHtml, s } from '../html';
import { label } from '../schema';
import { IconSchema, iconSvg } from '../icons';
import { asset } from './evidence';
import { defineTemplate, type RenderContext } from './types';

/**
 * Course opening, module start and module end.
 * Core templates for every industry. Order and wording were first taken from
 * the courses Anthony teaches (IOSA RBI Day 1):
 * course title, course objectives, facilitator, icebreaker, day overview,
 * course materials; then per module: module opener ... key points, break;
 * and at the end of the day: day close.
 */

const art = (ctx: RenderContext, id: string | undefined, cls: string) => {
  if (!id) return '';
  const a = asset(ctx, id);
  return `<figure class="${cls}" ${s(1)}>${mediaHtml(a)}${a.credit ? `<figcaption>${creditHtml(a)}</figcaption>` : ''}</figure>`;
};

/** Full-height side panel (module opener, facilitator). Photos fill it; drawings sit inside it. */
const panel = (ctx: RenderContext, id: string | undefined) => {
  if (!id) return '<div class="st-panel" data-bleed></div>';
  const a = asset(ctx, id);
  return `<div class="st-panel${a.kind === 'photo' ? ' st-panel-photo' : ''}" data-bleed>${mediaHtml(a)}${creditHtml(a)}</div>`;
};

export const courseTitle = defineTemplate({
  id: 'course-title',
  sequence: 'intro',
  purpose: 'First slide of a course: organisation (from the theme pack), course name, subtitle, client, dates and facilitator.',
  schema: z.object({
    title: label(7),
    subtitle: label(8).optional(),
    client: label(5).optional(),
    dates: z.string().max(30).optional(),
    facilitator: label(4).optional(),
    image: z.string().optional(),
  }),
  needsAssertion: false,
  parts: () => 1,
  fullView: false,
  render: (d, ctx) => `
    <div class="st-ct">
      <div class="st-ct-text" ${s(1)}>
        <div class="st-ct-org" ${ctx.motion.m(1, 'reveal')}>${ctx.log.t(1, ctx.theme.org)}</div>
        <h1 class="st-ct-title" ${ctx.motion.m(1, 'reveal')}>${ctx.log.t(1, d.title)}</h1>
        <div class="st-ct-rule" aria-hidden="true" ${ctx.motion.m(1, 'draw')}></div>
        ${d.subtitle ? `<p class="st-ct-sub" ${ctx.motion.m(1, 'reveal')}>${ctx.log.t(1, d.subtitle)}</p>` : ''}
        ${d.client ? `<p class="st-ct-client" ${ctx.motion.m(1, 'reveal')}>${ctx.log.t(1, `for ${d.client}`)}</p>` : ''}
        <div class="st-ct-facts" ${ctx.motion.m(1, 'reveal')}>
          ${d.dates ? `<span>${ctx.log.t(1, d.dates)}</span>` : ''}
          ${d.facilitator ? `<span>${ctx.log.t(1, `Facilitator: ${d.facilitator}`)}</span>` : ''}
        </div>
      </div>
      ${art(ctx, d.image, 'st-ct-art')}
    </div>`,
});

export const facilitator = defineTemplate({
  id: 'facilitator',
  purpose: 'Introductions: "Facilitator — Name", the logos of organisations the facilitator has worked with, and a photo panel.',
  schema: z.object({
    title: label(3).default('Introductions'),
    name: label(4),
    logos: z.array(z.string().min(1)).max(8).default([]),
    photo: z.string().optional(),
  }),
  needsAssertion: false,
  parts: () => 1,
  fullView: false,
  render: (d, ctx) => `
    <div class="st-mo">
      ${panel(ctx, d.photo)}
      <div class="st-mo-text" ${s(1)}>
        <h2 class="st-h">${ctx.log.t(1, d.title)}</h2>
        <p class="st-fac-name">${ctx.log.t(1, `Facilitator — ${d.name}`)}</p>
        <div class="st-logos">
          ${d.logos.map((id) => `<div class="st-logo">${mediaHtml(asset(ctx, id))}</div>`).join('')}
        </div>
      </div>
    </div>`,
});

export const icebreaker = defineTemplate({
  id: 'icebreaker',
  purpose: 'Participant introductions. 3 to 5 numbered prompts, one per step. Put the full question in speaker notes.',
  schema: z.object({
    prompts: z.array(z.object({ title: label(4), detail: label(6).optional() })).min(3).max(5),
  }),
  needsAssertion: true,
  parts: (d) => d.prompts.length,
  fullView: true,
  render: (d, ctx) => `
    <div class="st-boxes" style="--n:${d.prompts.length}">
      ${d.prompts
        .map(
          (p, i) => `
        <div class="st-box" ${s(i + 1)}>
          <div class="st-box-n">${String(i + 1).padStart(2, '0')}</div>
          <div class="st-box-h">${ctx.log.t(i + 1, p.title)}</div>
          ${p.detail ? `<div class="st-box-t">${ctx.log.t(i + 1, p.detail)}</div>` : ''}
        </div>`,
        )
        .join('')}
    </div>`,
});

export const dayOverview = defineTemplate({
  id: 'day-overview',
  purpose:
    'The modules of one course day as a route: one waypoint per module, top to bottom, with its code (M0, M1 ...) and an optional icon. Optionally marks the current module.',
  schema: z.object({
    modules: z.array(z.object({ code: z.string().min(1).max(4), title: label(5), icon: IconSchema.optional() })).min(2).max(6),
    current: z.number().int().min(0).optional(),
  }),
  needsAssertion: true,
  parts: () => 1,
  fullView: false,
  render: (d, ctx) => `
    <ol class="st-route" style="--n:${d.modules.length}" ${s(1)}>
      <li class="st-route-line" aria-hidden="true"><i ${ctx.motion.m(1, 'draw-v')}></i></li>
      ${d.modules
        .map(
          (m, i) => `
        <li class="st-wp${d.current === i ? ' st-wp-hot' : ''}" ${ctx.motion.m(1, 'reveal')}>
          <span class="st-wp-k">${ctx.log.t(1, m.code)}</span>
          <span class="st-wp-card">
            ${m.icon ? `<span class="st-wp-ic">${iconSvg(m.icon)}</span>` : ''}
            <span class="st-wp-t">${ctx.log.t(1, m.title)}</span>
          </span>
        </li>`,
        )
        .join('')}
    </ol>`,
});

function qrSvg(text: string): string {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const n = qr.modules.size;
  let d = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.modules.get(x, y)) d += `M${x + 4},${y + 4}h1v1h-1z`;
  return `<svg class="st-qr" viewBox="0 0 ${n + 8} ${n + 8}" shape-rendering="crispEdges" aria-hidden="true"><rect width="${n + 8}" height="${n + 8}" fill="var(--s-bg)"/><path d="${d}" fill="var(--s-ink)"/></svg>`;
}

export const courseMaterials = defineTemplate({
  id: 'course-materials',
  purpose: 'Where to get the course materials: link with QR code, plus up to 3 access codes (PIN, sign-in word).',
  schema: z.object({
    url: z.string().min(1).max(60),
    codes: z.array(z.object({ label: label(3), value: z.string().min(1).max(14) })).max(3).default([]),
  }),
  needsAssertion: true,
  parts: () => 1,
  fullView: false,
  render: (d, ctx) => `
    <div class="st-mat" ${s(1)}>
      ${qrSvg(d.url.startsWith('http') ? d.url : `https://${d.url}`)}
      <div class="st-mat-info">
        <div class="st-mat-url">${ctx.log.t(1, d.url.replace(/^https?:\/\//, ''))}</div>
        <div class="st-mat-codes">
          ${d.codes.map((c) => `<div class="st-mat-code"><span>${ctx.log.t(1, c.label)}</span><b>${ctx.log.t(1, c.value)}</b></div>`).join('')}
        </div>
      </div>
    </div>`,
});

export const moduleOpener = defineTemplate({
  id: 'module-opener',
  sequence: 'bumper',
  purpose: 'First slide of a module: number, title and its objectives (verbs first). Illustration panel on the left.',
  schema: z.object({
    number: z.string().min(1).max(4),
    title: label(6),
    objectives: z.array(label(7)).min(1).max(4),
    image: z.string().optional(),
  }),
  needsAssertion: false,
  parts: () => 1,
  fullView: false,
  render: (d, ctx) => `
    <div class="st-mo">
      ${panel(ctx, d.image)}
      <div class="st-mo-text" ${s(1)}>
        <div class="st-mo-k" ${ctx.motion.m(1, 'reveal')}>${ctx.log.t(1, `Module ${d.number}`)}</div>
        <h1 class="st-mo-title" ${ctx.motion.m(1, 'reveal')}>${ctx.log.t(1, d.title)}</h1>
        <ul class="st-mo-list">
          ${d.objectives.map((o) => `<li ${ctx.motion.m(1, 'reveal')}>${ctx.log.t(1, o)}</li>`).join('')}
        </ul>
      </div>
    </div>`,
});

export const keyPoints = defineTemplate({
  id: 'key-points',
  purpose:
    'Last content slide of a module ("Module N — Key Points"): an optional short lead line and 2 to 4 numbered points, one per step. Each point can carry an icon.',
  schema: z.object({
    lead: label(8).optional(),
    points: z.array(z.object({ title: label(4), detail: label(6).optional(), icon: IconSchema.optional() })).min(2).max(4),
  }),
  needsAssertion: true,
  parts: (d) => d.points.length,
  fullView: true,
  render: (d, ctx) => `
    <div class="st-kp">
      ${d.lead ? `<div class="st-kp-tag" ${s(1, true)}>${ctx.log.t(1, d.lead)}</div>` : ''}
      <ol class="st-list st-kp-rows">
        ${d.points
          .map(
            (p, i) => `
          <li class="st-kp-row" ${s(i + 1)}>
            <span class="st-kp-n">${String(i + 1).padStart(2, '0')}</span>
            <span><span class="st-kp-h">${ctx.log.t(i + 1, p.title)}</span>${p.detail ? `<span class="st-kp-t">${ctx.log.t(i + 1, p.detail)}</span>` : ''}</span>
            ${p.icon ? `<span class="st-kp-ic" ${ctx.motion.m(i + 1, 'pin')}>${iconSvg(p.icon)}</span>` : '<span></span>'}
          </li>`,
          )
          .join('')}
      </ol>
    </div>`,
});

const HHMM = /^([01]?\d|2[0-3]):[0-5]\d$/;
function clockSvg(resume?: string): string {
  const m = resume ? HHMM.exec(resume) && resume.split(':').map(Number) : null;
  const [h, mi] = m ? m : [0, 0];
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i * 30 * Math.PI) / 180;
    const r1 = i % 3 === 0 ? 70 : 76;
    const x1 = 100 + r1 * Math.sin(a), y1 = 100 - r1 * Math.cos(a), x2 = 100 + 86 * Math.sin(a), y2 = 100 - 86 * Math.cos(a);
    return `<line class="st-ct${i % 3 === 0 ? ' q' : ''}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
  }).join('');
  return `<svg viewBox="0 0 200 200" aria-hidden="true"><circle class="st-cf" cx="100" cy="100" r="94"/>${ticks}
    <line class="st-ch-h" x1="100" y1="100" x2="100" y2="54" transform="rotate(${(h % 12) * 30 + mi * 0.5} 100 100)"/>
    <line class="st-ch-m" x1="100" y1="100" x2="100" y2="28" transform="rotate(${mi * 6} 100 100)"/>
    <circle class="st-cc" cx="100" cy="100" r="7"/></svg>`;
}

export const breakSlide = defineTemplate({
  id: 'break',
  purpose:
    'Tea or lunch break between modules. States which module ended and which one comes next. A clock shows the return time; the presenter sets it on the slide (−5 / +5 min). resume (HH:MM) is the default.',
  schema: z.object({
    kind: label(3),
    ended: label(3).optional(),
    next: z.object({ code: z.string().min(1).max(10), title: label(6) }).optional(),
    resume: z.string().regex(HHMM, 'resume must be HH:MM (24 h)').optional(),
    clock: z.boolean().default(true),
  }),
  needsAssertion: false,
  parts: () => 1,
  fullView: false,
  render: (d, ctx) => `
    <div class="st-brk" ${s(1)}>
      <div>
        <div class="st-brk-kind">${ctx.log.t(1, d.kind)}</div>
        ${d.ended ? `<p class="st-brk-line">${ctx.log.t(1, `End of ${d.ended}.`)}</p>` : ''}
        ${d.next ? `<p class="st-brk-line">${ctx.log.t(1, `We resume with ${d.next.code} — ${d.next.title}.`)}</p>` : ''}
      </div>
      ${
        d.clock
          ? `<div class="st-clock" data-resume="${d.resume ?? ''}">
        ${clockSvg(d.resume)}
        <div class="st-clock-time">${ctx.log.t(1, 'Back at')} <b class="st-clock-t">${d.resume ?? '--:--'}</b></div>
        <div class="st-clock-in"></div>
        <div class="st-clock-ctl" aria-label="Change the return time"><button type="button" data-d="-5">−5 min</button><button type="button" data-d="5">+5 min</button></div>
      </div>`
          : ''
      }
    </div>`,
});

export const dayClose = defineTemplate({
  id: 'day-close',
  sequence: 'outro',
  purpose: 'End of a course day: the modules covered, then one line on what the next day builds.',
  schema: z.object({
    day: z.string().min(1).max(10),
    title: label(6).optional(),
    covered: z.array(z.object({ code: z.string().min(1).max(4), title: label(3) })).min(2).max(5),
    next: label(10).optional(),
  }),
  needsAssertion: false,
  parts: (d) => (d.next ? 2 : 1),
  fullView: false,
  lastIsFull: true,
  render: (d, ctx) => `
    <div class="st-dc">
      <div ${s(1)}>
        <h1 class="st-dc-title">${ctx.log.t(1, `End of ${d.day}`)}</h1>
        ${d.title ? `<p class="st-dc-sub">${ctx.log.t(1, d.title)}</p>` : ''}
      </div>
      <div class="st-dc-mods" style="--n:${d.covered.length}" ${s(1, true)}>
        ${d.covered.map((m) => `<div class="st-dc-mod"><span>${ctx.log.t(1, m.code)}</span>${ctx.log.t(1, m.title)}</div>`).join('')}
      </div>
      ${d.next ? `<p class="st-dc-next" ${s(2)}>${ctx.log.t(2, d.next)}</p>` : ''}
    </div>`,
});
