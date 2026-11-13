import { STAGE } from './tokens';

/**
 * AviLearn Studio motion system (phase B).
 *
 * Authors never pick animations. Each template part carries one motion verb,
 * and the template applies it the same way every time. The HTML deck runs the
 * verbs with CSS transitions (styles.ts) and a small script (runtime.ts). The
 * video stage (phase D, Remotion) reads the same verbs and timings from here.
 *
 * Verbs:
 * - reveal: fade in and rise 24 px (text, cards). The default for every part.
 * - draw:   a line draws along its path (connectors, axes, arrows, ticks).
 *           SVG shapes need pathLength="1". HTML lines draw left to right;
 *           draw-v draws top to bottom.
 * - grow:   a bar or fill grows from zero, bottom up. grow-x: left to right.
 * - count:  a number counts up to its value (statistics).
 * - pin:    a callout scales in with a small overshoot (annotated images).
 * - focus:  the active part is 100%, past parts 30%. Built into every step.
 */
export type MotionVerb = 'reveal' | 'draw' | 'draw-v' | 'grow' | 'grow-x' | 'count' | 'pin';

/** Branded sequences. A template names one; the slide plays it on entry. */
export type MotionSequence = 'intro' | 'bumper' | 'outro';

const M = STAGE.motion;

export function verbDuration(verb: MotionVerb): number {
  const base = verb.replace(/-[xv]$/, '') as keyof typeof M.verbs;
  return M.verbs[base];
}

export interface MotionItem {
  step: number;
  verb: MotionVerb;
}

/** Collects the motion parts of one slide while it renders, like TextLog for words. */
export class MotionLog {
  readonly items: MotionItem[] = [];
  /** Attribute for one moving element that appears on `step`. */
  m(step: number, verb: MotionVerb): string {
    this.items.push({ step, verb });
    return `data-m="${verb}"`;
  }
}

/**
 * Stagger that keeps one step inside the 1200 ms rule: n parts enter
 * `stagger` ms apart, and the last one takes `longest` ms.
 */
export function fitStagger(n: number, longest: number): number {
  if (n <= 1) return M.stagger;
  return Math.min(M.stagger, Math.floor((M.maxMove - longest) / (n - 1)));
}

export interface MotionStepPlan {
  step: number;
  movers: number;
  longest: number;
  stagger: number;
  total: number;
}

/**
 * Plan for each step of a content slide: how many parts move, the longest
 * verb, the stagger the presenter will use, and the total time.
 * `partsPerStep` counts the elements with data-s for each step.
 */
export function motionPlan(steps: number, partsPerStep: number[], log: MotionLog): MotionStepPlan[] {
  const plan: MotionStepPlan[] = [];
  for (let st = 1; st <= steps; st++) {
    const items = log.items.filter((i) => i.step === st);
    const movers = Math.max(partsPerStep[st - 1] ?? 0, items.length);
    const longest = Math.max(M.enter, ...items.map((i) => verbDuration(i.verb)));
    const stagger = fitStagger(movers, longest);
    plan.push({ step: st, movers, longest, stagger, total: Math.max(0, movers - 1) * stagger + longest });
  }
  return plan;
}
