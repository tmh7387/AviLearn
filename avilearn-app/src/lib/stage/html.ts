/** Small helpers shared by the stage templates. Pure string building, no DOM. */

export function esc(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}

/** Attribute that tells the presenter on which step an element appears. */
export function s(step: number, keep = false): string {
  return `data-s="${step}"${keep ? ' data-keep="1"' : ''}`;
}

/** Visible text collected while rendering, with the step it appears on. */
export interface VisibleText {
  step: number;
  text: string;
}

export class TextLog {
  readonly items: VisibleText[] = [];
  /** Record the text and return it escaped, ready for HTML. */
  t(step: number, text: string): string {
    this.items.push({ step, text });
    return esc(text);
  }
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/** The AviLearn mark, drawn with theme tokens so it works on light and dark. */
export const MARK_SVG =
  '<svg class="st-mark-ico" viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M2 14 L22 2 L16 22 L11 14 Z" fill="var(--s-teal-tint)" stroke="var(--s-teal)" stroke-width="2" stroke-linejoin="round"/>' +
  '<path d="M11 14 L22 2" stroke="var(--s-teal)" stroke-width="2" stroke-linecap="round"/></svg>';

/** Compass rose for title slides (hidden in sober tone). */
export function roseSvg(): string {
  let ticks = '';
  for (let i = 0; i < 36; i++) {
    const a = (i * 10 * Math.PI) / 180;
    const r1 = i % 9 === 0 ? 60 : i % 3 === 0 ? 80 : 86;
    const f = (n: number) => n.toFixed(1);
    ticks += `<line x1="${f(100 + 92 * Math.sin(a))}" y1="${f(100 - 92 * Math.cos(a))}" x2="${f(100 + r1 * Math.sin(a))}" y2="${f(100 - r1 * Math.cos(a))}" stroke-width="${i % 9 === 0 ? 2.5 : 1.2}"/>`;
  }
  return (
    '<svg class="st-rose" viewBox="0 0 200 200" aria-hidden="true">' +
    '<g fill="none" stroke="var(--s-line)" stroke-opacity=".35" stroke-width="1.5"><circle cx="100" cy="100" r="92"/><circle cx="100" cy="100" r="70"/></g>' +
    `<g stroke="var(--s-line)" stroke-opacity=".35">${ticks}</g>` +
    '<g class="st-rose-needle"><path d="M100 18 L107 100 L93 100 Z" fill="var(--s-teal-fill)"/></g>' +
    '<text x="100" y="13" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="12" fill="var(--s-ink)">N</text></svg>'
  );
}
