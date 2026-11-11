import { z } from 'zod';
import QRCode from 'qrcode';
import { esc, mediaHtml, s } from '../html';
import { illustrationFor } from '../illustrations';
import { label } from '../schema';
import { asset } from './evidence';
import { defineTemplate, type RenderContext } from './types';

/**
 * Course opening, module start and module end.
 * Order and wording follow the courses Anthony teaches (IOSA RBI Day 1):
 * course title, course objectives, facilitator, icebreaker, day overview,
 * course materials; then per module: module opener ... key points, break;
 * and at the end of the day: day close.
 */

const art = (ctx: RenderContext, id: string | undefined, cls: string) =>
  id ? `<div class="${cls}" ${s(1)}>${mediaHtml(asset(ctx, id), illustrationFor)}</div>` : '';

export const courseTitle = defineTemplate({
  id: 'course-title',
  purpose: 'First slide of a course: course name, subtitle, client, dates and facilitator. Aviation Synergy brand.',
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
        <div class="st-ct-org">${ctx.log.t(1, 'Aviation Synergy')}</div>
        <h1 class="st-ct-title">${ctx.log.t(1, d.title)}</h1>
        ${d.subtitle ? `<p class="st-ct-sub">${ctx.log.t(1, d.subtitle)}</p>` : ''}
        ${d.client ? `<p class="st-ct-client">${ctx.log.t(1, `for ${d.client}`)}</p>` : ''}
        <div class="st-ct-facts">
          ${d.dates ? `<span>${ctx.log.t(1, d.dates)}</span>` : ''}
          ${d.facilitator ? `<span>${ctx.log.t(1, `Facilitator: ${d.facilitator}`)}</span>` : ''}
        </div>
      </div>
      ${art(ctx, d.image, 'st-ct-art')}
    </div>`,
});

export const facilitator = defineTemplate({
  id: 'facilitator',
  purpose: 'Introduce the facilitator: name, role and up to 4 short credentials. Photo optional.',
  schema: z.object({
    name: label(4),
    role: label(6),
    credentials: z.array(label(6)).min(1).max(4),
    photo: z.string().optional(),
  }),
  needsAssertion: false,
  parts: () => 1,
  fullView: false,
  render: (d, ctx) => {
    const photo = d.photo ? asset(ctx, d.photo) : null;
    return `
    <div class="st-fac" ${s(1)}>
      <div class="st-fac-who">
        ${photo ? `<img class="st-fac-photo" src="${esc(photo.url)}" alt="${esc(photo.alt)}">` : ''}
        <div class="st-fac-k">${ctx.log.t(1, 'Your Facilitator')}</div>
        <div class="st-fac-name">${ctx.log.t(1, d.name)}</div>
        <div class="st-fac-role">${ctx.log.t(1, d.role)}</div>
      </div>
      <ul class="st-list st-fac-list">
        ${d.credentials.map((c) => `<li class="st-row"><span class="st-row-v">${ctx.log.t(1, c)}</span></li>`).join('')}
      </ul>
    </div>`;
  },
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
  purpose: 'The modules of one course day, with their codes (M0, M1 ...). Optionally marks the current module.',
  schema: z.object({
    modules: z.array(z.object({ code: z.string().min(1).max(4), title: label(5) })).min(2).max(6),
    current: z.number().int().min(0).optional(),
  }),
  needsAssertion: true,
  parts: () => 1,
  fullView: false,
  render: (d, ctx) => `
    <ol class="st-list st-agenda">
      ${d.modules
        .map(
          (m, i) =>
            `<li class="st-row${d.current === i ? ' st-hot' : ''}" ${s(1)}><span class="st-row-k">${ctx.log.t(1, m.code)}</span><span class="st-row-v">${ctx.log.t(1, m.title)}</span></li>`,
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
      <div class="st-mo-panel${d.image && asset(ctx, d.image).url.startsWith('illustration:aircraft') ? ' st-mo-wide' : ''}">${d.image ? mediaHtml(asset(ctx, d.image), illustrationFor) : ''}</div>
      <div class="st-mo-text" ${s(1)}>
        <div class="st-mo-k">${ctx.log.t(1, `Module ${d.number}`)}</div>
        <h1 class="st-mo-title">${ctx.log.t(1, d.title)}</h1>
        <ul class="st-mo-list">
          ${d.objectives.map((o) => `<li>${ctx.log.t(1, o)}</li>`).join('')}
        </ul>
      </div>
    </div>`,
});

export const keyPoints = defineTemplate({
  id: 'key-points',
  purpose: 'Last content slide of a module ("Module N — Key Points"): a short lead line and 2 or 3 points, one per step.',
  schema: z.object({
    lead: label(8).optional(),
    points: z.array(z.object({ title: label(4), detail: label(6).optional() })).min(2).max(3),
  }),
  needsAssertion: true,
  parts: (d) => d.points.length,
  fullView: true,
  render: (d, ctx) => `
    ${d.lead ? `<p class="st-kp-lead" ${s(1, true)}>${ctx.log.t(1, d.lead)}</p>` : ''}
    <div class="st-boxes" style="--n:${d.points.length}">
      ${d.points
        .map(
          (p, i) => `
        <div class="st-box" ${s(i + 1)}>
          <div class="st-box-h">${ctx.log.t(i + 1, p.title)}</div>
          ${p.detail ? `<div class="st-box-t">${ctx.log.t(i + 1, p.detail)}</div>` : ''}
        </div>`,
        )
        .join('')}
    </div>`,
});

export const breakSlide = defineTemplate({
  id: 'break',
  purpose: 'Tea or lunch break between modules. States which module ended, which one comes next, and the return time.',
  schema: z.object({
    kind: label(3),
    ended: label(3).optional(),
    next: z.object({ code: z.string().min(1).max(10), title: label(6) }).optional(),
    resume: z.string().max(12).optional(),
  }),
  needsAssertion: false,
  parts: () => 1,
  fullView: false,
  render: (d, ctx) => `
    <div class="st-brk" ${s(1)}>
      <div class="st-brk-kind">${ctx.log.t(1, d.kind)}</div>
      ${d.resume ? `<div class="st-brk-time">${ctx.log.t(1, `Back at ${d.resume}`)}</div>` : ''}
      ${d.ended ? `<p class="st-brk-line">${ctx.log.t(1, `End of ${d.ended}.`)}</p>` : ''}
      ${d.next ? `<p class="st-brk-line">${ctx.log.t(1, `We resume with ${d.next.code} — ${d.next.title}.`)}</p>` : ''}
    </div>`,
});

export const dayClose = defineTemplate({
  id: 'day-close',
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
