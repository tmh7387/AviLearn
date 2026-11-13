import { z } from 'zod';
import { s } from '../html';
import { IconSchema, iconSvg } from '../icons';
import { label } from '../schema';
import { defineTemplate } from './types';

/**
 * Core templates for source slides built from columns of cards
 * (first seen in IOSA RBI Day 1: ISO foundations, audit lifecycle,
 * traditional vs risk-based IOSA, audit scenarios).
 */

export const cardRow = defineTemplate({
  id: 'card-row',
  purpose:
    '2 to 4 cards side by side, one per step: an icon or a code (01, Scenario A), a short title and an optional short detail. Put the full card text in the speaker notes.',
  schema: z.object({
    cards: z
      .array(
        z.object({
          title: label(5),
          detail: label(7).optional(),
          icon: IconSchema.optional(),
          code: z.string().min(1).max(16).optional(),
        }),
      )
      .min(2)
      .max(4),
    highlight: z.number().int().min(0).optional(),
  }),
  needsAssertion: true,
  parts: (d) => d.cards.length,
  fullView: true,
  render: (d, ctx) => `
    <div class="st-boxes st-cards" style="--n:${d.cards.length}">
      ${d.cards
        .map(
          (c, i) => `
        <div class="st-box st-card${d.highlight === i ? ' st-hot' : ''}" ${s(i + 1)}>
          ${c.icon || c.code ? `<div class="st-card-top">${c.icon ? `<span class="st-card-ic" ${ctx.motion.m(i + 1, 'pin')}>${iconSvg(c.icon)}</span>` : ''}${c.code ? `<span class="st-box-k">${ctx.log.t(i + 1, c.code)}</span>` : ''}</div>` : ''}
          <div class="st-box-h">${ctx.log.t(i + 1, c.title)}</div>
          ${c.detail ? `<div class="st-box-t st-card-t">${ctx.log.t(i + 1, c.detail)}</div>` : ''}
        </div>`,
        )
        .join('')}
    </div>`,
});

const column = z.object({
  heading: label(5),
  items: z.array(label(8)).min(1).max(4),
  tag: label(5).optional(),
  icon: IconSchema.optional(),
});

export const compareColumns = defineTemplate({
  id: 'compare-columns',
  purpose:
    'Two columns: the left one first (old way, what the data shows), then the right one (new way, what changes). The right column is the highlight. Optional tag line under each column.',
  schema: z.object({ left: column, right: column }),
  needsAssertion: true,
  parts: () => 2,
  fullView: true,
  render: (d, ctx) => {
    const col = (c: z.infer<typeof column>, step: number, hot: boolean) => `
      <div class="st-cmp-col${hot ? ' st-cmp-hot' : ''}" ${s(step)}>
        <div class="st-cmp-head">${c.icon ? `<span class="st-cmp-ic">${iconSvg(c.icon)}</span>` : ''}<span>${ctx.log.t(step, c.heading)}</span></div>
        <ul class="st-cmp-list">
          ${c.items.map((it) => `<li ${ctx.motion.m(step, 'reveal')}>${ctx.log.t(step, it)}</li>`).join('')}
        </ul>
        ${c.tag ? `<div class="st-cmp-tag">${ctx.log.t(step, c.tag)}</div>` : ''}
      </div>`;
    return `
    <div class="st-cmp">
      ${col(d.left, 1, false)}
      <div class="st-cmp-arrow" aria-hidden="true" ${s(2)}><svg viewBox="0 0 48 48"><path d="M8 24h30M28 12l12 12-12 12" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      ${col(d.right, 2, true)}
    </div>`;
  },
});
