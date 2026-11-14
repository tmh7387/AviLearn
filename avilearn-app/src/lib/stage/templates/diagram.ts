import { z } from 'zod';
import { s } from '../html';
import { IconSchema, iconSvg } from '../icons';
import { label } from '../schema';
import { defineTemplate, type RenderContext } from './types';

/**
 * Core diagram templates: loop, hierarchy and steps
 * (asked for in the IOSA RBI Module 2 review, 14 Nov 2026).
 */

const node = z.object({ title: label(4), detail: label(6).optional(), icon: IconSchema.optional() });
type Node = z.infer<typeof node>;

const nodeHtml = (n: Node, step: number, ctx: RenderContext, cls: string, extra = '') => `
  <div class="${cls}" ${s(step)}${extra}>
    ${n.icon ? `<span class="st-dg-ic" ${ctx.motion.m(step, 'pin')}>${iconSvg(n.icon)}</span>` : ''}
    <span class="st-dg-txt"><span class="st-dg-h">${ctx.log.t(step, n.title)}</span>${n.detail ? `<span class="st-dg-t">${ctx.log.t(step, n.detail)}</span>` : ''}</span>
  </div>`;

/** Loop: 3 to 6 parts on a ring, clockwise from the top. Arrows show the direction. */
const CY = { w: 1690, h: 640, cx: 845, cy: 320, rx: 560, ry: 228 };
export const cycle = defineTemplate({
  id: 'cycle',
  purpose:
    'A loop of 3 to 6 parts that feed each other (roles that must connect, a continuous improvement cycle). Clockwise from the top, one part per step. Optional centre label.',
  schema: z.object({ nodes: z.array(node).min(3).max(6), center: label(4).optional() }),
  needsAssertion: true,
  parts: (d) => d.nodes.length,
  fullView: true,
  render: (d, ctx) => {
    const n = d.nodes.length;
    const at = (deg: number) => {
      const r = (deg * Math.PI) / 180;
      return { x: CY.cx + CY.rx * Math.cos(r), y: CY.cy + CY.ry * Math.sin(r), r };
    };
    const ang = (i: number) => -90 + (360 / n) * i;
    const arrows = d.nodes
      .map((_, i) => {
        const p = at(ang(i) + 180 / n);
        const rot = (Math.atan2(CY.ry * Math.cos(p.r), -CY.rx * Math.sin(p.r)) * 180) / Math.PI;
        const step = ((i + 1) % n) + 1;
        return `<path class="st-cy-arr" ${s(step === 1 ? n : step)} d="M-14,-13 L12,0 L-14,13" transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${rot.toFixed(1)})"/>`;
      })
      .join('');
    const nodes = d.nodes
      .map((nd, i) => {
        const p = at(ang(i));
        return nodeHtml(nd, i + 1, ctx, 'st-dg-node st-cy-node', ` style="left:${((p.x / CY.w) * 100).toFixed(2)}%;top:${((p.y / CY.h) * 100).toFixed(2)}%"`);
      })
      .join('');
    return `
    <div class="st-cy">
      <svg class="st-cy-ring" viewBox="0 0 ${CY.w} ${CY.h}" aria-hidden="true">
        <ellipse ${s(1)} cx="${CY.cx}" cy="${CY.cy}" rx="${CY.rx}" ry="${CY.ry}" pathLength="1" ${ctx.motion.m(1, 'draw')}/>
        ${arrows}
      </svg>
      ${d.center ? `<div class="st-cy-center" ${s(n, true)}>${ctx.log.t(n, d.center)}</div>` : ''}
      ${nodes}
    </div>`;
  },
});

/** Hierarchy: one top box and 2 to 5 boxes under it, each with up to 3 short items. */
export const hierarchy = defineTemplate({
  id: 'hierarchy',
  purpose:
    'A hierarchy: one top box (accountable manager, a framework) and 2 to 5 boxes under it, each with up to 3 short items. Top box first, then one child per step.',
  schema: z.object({
    root: node,
    children: z.array(node.extend({ items: z.array(label(4)).max(3).default([]) })).min(2).max(5),
  }),
  needsAssertion: true,
  parts: (d) => 1 + d.children.length,
  fullView: true,
  render: (d, ctx) => `
    <div class="st-tree" style="--n:${d.children.length}">
      ${nodeHtml(d.root, 1, ctx, 'st-dg-node st-tree-root st-hot')}
      <div class="st-tree-kids">
        <i class="st-tree-bar" aria-hidden="true" ${s(2)}></i>
        ${d.children
          .map(
            (c, i) => `
          <div class="st-tree-kid" ${s(i + 2)}>
            ${nodeHtml(c, i + 2, ctx, 'st-dg-node')}
            ${c.items.length ? `<ul class="st-tree-items">${c.items.map((it) => `<li>${ctx.log.t(i + 2, it)}</li>`).join('')}</ul>` : ''}
          </div>`,
          )
          .join('')}
      </div>
    </div>`,
});

/** Steps: a staircase of 3 to 6 levels, low to high (maturity levels, build-up). */
export const staircase = defineTemplate({
  id: 'staircase',
  purpose:
    'A staircase of 3 to 6 levels that build on each other, lowest first (maturity levels, from reactive to predictive). One level per step. highlight marks a level.',
  schema: z.object({ levels: z.array(node).min(3).max(6), highlight: z.number().int().min(0).optional() }),
  needsAssertion: true,
  parts: (d) => d.levels.length,
  fullView: true,
  render: (d, ctx) => {
    const n = d.levels.length;
    return `
    <div class="st-stairs" style="--n:${n}">
      ${d.levels
        .map((l, i) => {
          const h = 38 + (62 * i) / (n - 1);
          return `<div class="st-stair${d.highlight === i ? ' st-hot' : ''}" style="height:${h.toFixed(1)}%" ${s(i + 1)}>
            <span class="st-stair-n">${String(i + 1).padStart(2, '0')}</span>
            ${nodeHtml(l, i + 1, ctx, 'st-dg-node st-stair-node')}
          </div>`;
        })
        .join('')}
    </div>`;
  },
});
