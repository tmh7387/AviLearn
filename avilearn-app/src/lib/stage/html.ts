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

/** Compass rose for title slides (hidden in sober tone). Cardinal letters sit outside the ring. */
export function roseSvg(): string {
  const f = (n: number) => n.toFixed(1);
  let ticks = '';
  for (let i = 0; i < 72; i++) {
    const a = (i * 5 * Math.PI) / 180;
    const r1 = i % 18 === 0 ? 70 : i % 6 === 0 ? 82 : i % 2 === 0 ? 87 : 90;
    ticks += `<line x1="${f(100 + 94 * Math.sin(a))}" y1="${f(100 - 94 * Math.cos(a))}" x2="${f(100 + r1 * Math.sin(a))}" y2="${f(100 - r1 * Math.cos(a))}" stroke-width="${i % 18 === 0 ? 2.5 : i % 6 === 0 ? 1.6 : 1}"/>`;
  }
  const star = (rot: number, long: number, fill: string) =>
    `<g transform="rotate(${rot} 100 100)"><path d="M100 ${100 - long} L108 100 L100 100 Z" fill="${fill}"/><path d="M100 ${100 - long} L92 100 L100 100 Z" fill="${fill}" fill-opacity=".55"/></g>`;
  const letter = (x: number, y: number, t: string, hot = false) =>
    `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-family="Barlow Condensed, sans-serif" font-weight="700" font-size="${hot ? 21 : 17}" fill="var(${hot ? '--s-teal' : '--s-ink'})">${t}</text>`;
  return (
    '<svg class="st-rose" viewBox="-24 -24 248 248" aria-hidden="true">' +
    '<g fill="none" stroke="var(--s-line)" stroke-opacity=".4" stroke-width="1.5"><circle cx="100" cy="100" r="94"/><circle cx="100" cy="100" r="66"/></g>' +
    `<g stroke="var(--s-line)" stroke-opacity=".4">${ticks}</g>` +
    `<g opacity=".35">${star(45, 46, 'var(--s-ink)')}${star(135, 46, 'var(--s-ink)')}${star(225, 46, 'var(--s-ink)')}${star(315, 46, 'var(--s-ink)')}</g>` +
    `<g class="st-rose-needle">${star(0, 84, 'var(--s-teal-fill)')}${star(90, 64, 'var(--s-ink)')}${star(180, 64, 'var(--s-ink)')}${star(270, 64, 'var(--s-ink)')}</g>` +
    '<circle cx="100" cy="100" r="5" fill="var(--s-bg)" stroke="var(--s-line)" stroke-width="2"/>' +
    letter(100, -12, 'N', true) +
    letter(212, 100, 'E') +
    letter(100, 212, 'S') +
    letter(-12, 100, 'W') +
    '</svg>'
  );
}

/** Image or code-drawn illustration for an asset. */
export function mediaHtml(asset: { url: string; alt: string; lineArt?: boolean }, illustrationFor: (u: string, a: string) => string | null): string {
  const svg = illustrationFor(asset.url, asset.alt);
  if (svg) return svg;
  return `<img src="${esc(asset.url)}" alt="${esc(asset.alt)}"${asset.lineArt ? ' class="st-line-art"' : ''}>`;
}
