/**
 * Core voice rules for every pack, first taken from the courses Anthony
 * Houston teaches (reference: IOSA RBI Day 1 deck). Industry packs add their
 * own rules. Full guide: docs/VOICE-avilearn.md.
 *
 * The compiler rejects any visible text that matches a banned pattern.
 * These are stock phrases that make slides sound machine-written.
 */

export interface VoiceRule {
  pattern: RegExp;
  why: string;
}

export const BANNED_PHRASES: VoiceRule[] = [
  { pattern: /^(two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(things|parts|steps|ways|keys|lessons|takeaways|ideas|pillars|truths)\b/i, why: 'Counting slogan. Name the content instead.' },
  { pattern: /,\s*one\s+[a-z]+$/i, why: 'Slogan pattern "X parts, one Y".' },
  { pattern: /\bthings to (take|carry) (back|away|home)\b/i, why: 'Use "Module N — Key Points".' },
  { pattern: /\b(key )?takeaways?\b/i, why: 'Use "Key Points".' },
  { pattern: /\bby the end,? you (can|will)\b/i, why: 'Use the module objectives list instead.' },
  { pattern: /\b(let'?s|let us) (dive|explore|unpack|jump)\b/i, why: 'Filler opener.' },
  { pattern: /\bdeep[- ]dive\b/i, why: 'Jargon.' },
  { pattern: /\b(journey|unlock|game[- ]changer|level up|superpower|secret sauce|supercharge|in a nutshell|at a glance|deep insight|leverage)\b/i, why: 'Marketing jargon.' },
  { pattern: /\bwhat good looks like\b/i, why: 'Cliché. Say what the standard requires.' },
  { pattern: /\b(simply put|the bottom line|here'?s the thing|the secret)\b/i, why: 'Filler.' },
];

export function voiceProblems(text: string, extra: VoiceRule[] = []): string[] {
  const t = text.trim();
  return [...BANNED_PHRASES, ...extra].filter((r) => r.pattern.test(t)).map((r) => `"${t}": ${r.why}`);
}
