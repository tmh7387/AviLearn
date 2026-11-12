import type { z } from 'zod';
import type { TextLog } from '../html';
import type { SlideDeckSpec, StageAsset, TemplateId } from '../schema';

export interface RenderContext {
  deck: SlideDeckSpec;
  assets: Map<string, StageAsset>;
  log: TextLog;
}

export interface TemplateDef<T = unknown> {
  id: TemplateId;
  /** Short description for prompts and the gallery. */
  purpose: string;
  schema: z.ZodType<T>;
  /** Content templates need an assertion headline; structure slides do not. */
  needsAssertion: boolean;
  /** Number of build parts. Each part appears on its own step. */
  parts(data: T): number;
  /** True when a final "full view" step follows the parts (only when parts > 1). */
  fullView: boolean;
  /** True when the last part completes the picture, so the last step shows everything at 100%. */
  lastIsFull?: boolean;
  /** Markup for the evidence area. Use s(step) on elements and ctx.log.t() for visible text. */
  render(data: T, ctx: RenderContext): string;
}

export function stepCount<T>(def: TemplateDef<T>, data: T): number {
  const p = def.parts(data);
  return p + (def.fullView && p > 1 ? 1 : 0);
}

export function defineTemplate<T>(def: TemplateDef<T>): TemplateDef<T> {
  return def;
}
