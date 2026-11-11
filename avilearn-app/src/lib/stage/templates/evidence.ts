import { z } from 'zod';
import { esc, s } from '../html';
import { label } from '../schema';
import { defineTemplate, type RenderContext } from './types';

function asset(ctx: RenderContext, id: string) {
  const a = ctx.assets.get(id);
  if (!a) throw new Error(`Unknown asset "${id}". Add it to deck.assets.`);
  return a;
}

export const assertionImage = defineTemplate({
  id: 'assertion-image',
  purpose: 'Headline plus one photo or illustration as the evidence.',
  schema: z.object({ image: z.string().min(1), caption: label(8).optional() }),
  needsAssertion: true,
  parts: () => 1,
  fullView: false,
  render: (d, ctx) => {
    const a = asset(ctx, d.image);
    return `
      <figure class="st-img" ${s(1)}>
        <img src="${esc(a.url)}" alt="${esc(a.alt)}"${a.lineArt ? ' class="st-line-art"' : ''}>
        ${d.caption ? `<figcaption>${ctx.log.t(1, d.caption)}</figcaption>` : ''}
      </figure>`;
  },
});

export const annotatedImage = defineTemplate({
  id: 'annotated-image',
  purpose: 'Image with 1 to 4 numbered callouts that appear one per step. x and y are percent of the image.',
  schema: z.object({
    image: z.string().min(1),
    callouts: z
      .array(z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100), label: label(3) }))
      .min(1)
      .max(4),
  }),
  needsAssertion: true,
  parts: (d) => d.callouts.length,
  fullView: true,
  render: (d, ctx) => {
    const a = asset(ctx, d.image);
    return `
      <div class="st-ann">
        <div class="st-ann-frame" ${s(1, true)}>
          <img src="${esc(a.url)}" alt="${esc(a.alt)}"${a.lineArt ? ' class="st-line-art"' : ''}>
          ${d.callouts
            .map(
              (c, i) =>
                `<div class="st-ann-pin" style="left:${c.x}%;top:${c.y}%" ${s(i + 1)}><span class="st-ann-dot">${i + 1}</span></div>`,
            )
            .join('')}
        </div>
        <ol class="st-ann-list">
          ${d.callouts
            .map((c, i) => `<li ${s(i + 1)}><span class="st-ann-dot">${i + 1}</span>${ctx.log.t(i + 1, c.label)}</li>`)
            .join('')}
        </ol>
      </div>`;
  },
});

export const heroNumber = defineTemplate({
  id: 'hero-number',
  purpose: 'One big number that proves the headline, with its unit and a short label.',
  schema: z.object({ value: z.string().min(1).max(10), unit: z.string().max(8).optional(), label: label(6) }),
  needsAssertion: true,
  parts: () => 1,
  fullView: false,
  render: (d, ctx) => `
    <div class="st-hero" ${s(1)}>
      <div class="st-hero-v">${ctx.log.t(1, d.value)}${d.unit ? `<span class="st-hero-u">${ctx.log.t(1, d.unit)}</span>` : ''}</div>
      <div class="st-hero-l">${ctx.log.t(1, d.label)}</div>
    </div>`,
});

const side = z.object({ value: z.string().min(1).max(12), label: label(4) });

export const splitContrast = defineTemplate({
  id: 'split-contrast',
  purpose: 'Two values side by side (before / after, us / them). The right side is the highlight.',
  schema: z.object({ left: side, right: side }),
  needsAssertion: true,
  parts: () => 2,
  fullView: false,
  lastIsFull: true,
  render: (d, ctx) => `
    <div class="st-split">
      <div class="st-split-side" ${s(1)}><div class="st-split-v">${ctx.log.t(1, d.left.value)}</div><div class="st-split-l">${ctx.log.t(1, d.left.label)}</div></div>
      <div class="st-split-rule" aria-hidden="true" ${s(1, true)}></div>
      <div class="st-split-side st-hot-text" ${s(2)}><div class="st-split-v">${ctx.log.t(2, d.right.value)}</div><div class="st-split-l">${ctx.log.t(2, d.right.label)}</div></div>
    </div>`,
});

export const quoteReference = defineTemplate({
  id: 'quote-reference',
  purpose: 'Short excerpt from a standard or regulation (ICAO, IOSA, EASA) with its exact reference.',
  schema: z.object({ quote: z.string().min(1).max(220), reference: z.string().min(1).max(60) }),
  needsAssertion: true,
  parts: () => 1,
  fullView: false,
  render: (d, ctx) => `
    <blockquote class="st-quote" ${s(1)}>
      <p>${ctx.log.t(1, d.quote)}</p>
      <cite>${esc(d.reference)}</cite>
    </blockquote>`,
});
