import { esc } from './html';
import type { CompiledDeck } from './compiler';
import { SLIDE_CSS } from './styles';
import { STAGE } from './tokens';
import { TEMPLATES } from './templates';
import { NAV_CHART, ownerOf, packCss, type ThemePack } from './packs';

/**
 * Template gallery: every slide of every sample deck at full view, in light or
 * dark and standard or sober tone, with its QA result. It is the visual review
 * page and the page the screenshot check walks.
 */
export function buildGallery(decks: { key: string; deck: CompiledDeck }[], linkFor: (key: string) => string): string {
  const used = new Map<string, Set<string>>();
  for (const { deck } of decks) for (const s of deck.slides) {
    if (!used.has(s.templateId)) used.set(s.templateId, new Set());
    used.get(s.templateId)!.add(deck.spec.course);
  }
  const coverage = [...TEMPLATES.keys()].map((id) => {
    const courses = used.get(id)?.size ?? 0;
    const owner = ownerOf(id);
    const need = owner ? 1 : 2;
    return `<li class="${courses >= need ? 'ok' : 'gap'}"><code>${id}</code><span>${owner ? `${esc(owner.name)} · ` : ''}${courses} course${courses === 1 ? '' : 's'}</span></li>`;
  });
  const errors = decks.reduce((n, d) => n + d.deck.issues.filter((i) => i.level === 'error').length, 0);
  const warns = decks.reduce((n, d) => n + d.deck.issues.filter((i) => i.level === 'warn').length, 0);

  const packs = new Map<string, ThemePack>();
  for (const { deck } of decks) if (deck.theme) packs.set(deck.theme.id, deck.theme);
  const packStyles = [...packs.values()].map((p) => packCss(p, `.g-pack-${p.id}`)).join('');
  const fontLinks = [...new Set([NAV_CHART, ...packs.values()].map((p) => p.fonts.googleHref))]
    .map((h) => `<link rel="stylesheet" href="${esc(h)}">`)
    .join('');

  const sections = decks
    .map(({ key, deck }) => {
      const cards = deck.slides
        .map((s, i) => {
          const iss = s.issues.map((x) => `<li class="${x.level}">${esc(x.message)}</li>`).join('');
          return `<figure class="g-card">
            <a class="g-thumb" href="${esc(linkFor(key))}#${i + 1}-1" aria-label="Present slide ${i + 1}"><div class="g-scale">${s.html}</div></a>
            <figcaption><b>${i + 1}. <code>${s.templateId}</code></b><span>${s.words} words · ${s.steps} step${s.steps === 1 ? '' : 's'}</span></figcaption>
            ${iss ? `<ul class="g-issues">${iss}</ul>` : ''}
          </figure>`;
        })
        .join('');
      return `<section class="g-deck g-pack-${esc(deck.theme?.id ?? 'none')}">
        <header><div><h2>${esc(deck.spec.course)}</h2><p>${esc(deck.spec.module.code)} · ${esc(deck.spec.lesson.title)} · theme ${esc(deck.theme?.name ?? '?')} · industry ${esc(deck.vertical?.name ?? '?')} · starts ${deck.spec.defaultTheme ?? deck.theme?.defaultMode}</p></div>
        <a class="g-btn" href="${esc(linkFor(key))}">Present deck</a></header>
        <div class="g-grid st-tone-${deck.spec.tone}">${cards}</div></section>`;
    })
    .join('');

  return `<!doctype html>
<html lang="en" data-theme="light">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AviLearn Studio gallery</title>
${fontLinks}
<style>${packCss(NAV_CHART)}${packStyles}${SLIDE_CSS}
body{margin:0;background:var(--s-bg);color:var(--s-ink);font:16px/1.5 var(--s-font-body);padding:24px max(16px,3vw) 64px}
h1{font:700 44px/1 var(--s-font-display);text-transform:var(--s-head-case);margin:0 0 8px}
h2{font:600 28px/1.1 var(--s-font-display);text-transform:var(--s-head-case);margin:0}
p{margin:4px 0 0;color:var(--s-ink-muted)}
code{font:500 13px var(--s-font-mono)}
.g-deck{background:var(--s-bg);color:var(--s-ink);padding:16px;border-radius:6px}
.g-top{display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;align-items:flex-end;margin-bottom:20px}
.g-tools{display:flex;gap:8px;flex-wrap:wrap}
.g-btn,.g-tools button{font:600 14px var(--s-font-body);color:var(--s-ink);background:var(--s-card);border:1px solid var(--s-line);border-radius:4px;padding:8px 14px;cursor:pointer;text-decoration:none}
.g-tools button[aria-pressed="true"]{border-color:var(--s-accent);color:var(--s-accent)}
.g-cov{list-style:none;padding:0;margin:0 0 28px;display:flex;flex-wrap:wrap;gap:6px}
.g-cov li{border:1px solid var(--s-line);border-radius:999px;padding:2px 10px;font-size:13px;display:flex;gap:6px}
.g-cov li.gap{border-color:var(--s-accent);color:var(--s-accent)}
.g-deck{margin-top:36px}.g-deck>header{display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between;align-items:flex-end;margin-bottom:14px}
.g-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:18px}
.g-card{margin:0;min-width:0}
.g-thumb{display:block;position:relative;aspect-ratio:16/9;overflow:hidden;border:1px solid var(--s-line);border-radius:4px}
.g-scale{position:absolute;left:0;top:0;width:${STAGE.canvas.width}px;height:${STAGE.canvas.height}px;transform-origin:0 0;transform:scale(var(--k,.17))}
figcaption{display:flex;justify-content:space-between;gap:8px;font-size:13px;margin-top:6px;color:var(--s-ink-muted)}
figcaption b{color:var(--s-ink);font-weight:600}
.g-issues{margin:6px 0 0;padding-left:18px;font-size:12px;color:var(--s-ink-muted)}
.g-issues .error{color:var(--s-accent);font-weight:600}
</style></head>
<body>
<div class="g-top"><div><h1>AviLearn Studio gallery</h1>
<p>${TEMPLATES.size} templates · ${decks.length} sample courses · ${errors} QA error${errors === 1 ? '' : 's'} · ${warns} warning${warns === 1 ? '' : 's'}. Slides show the full view. Click a slide to present it.</p></div>
<div class="g-tools" role="group" aria-label="View">
<button type="button" data-theme-btn="light" aria-pressed="true">Light</button><button type="button" data-theme-btn="dark" aria-pressed="false">Dark</button>
<button type="button" id="g-sober" aria-pressed="false">Sober tone</button></div></div>
<h2>Template coverage</h2><p>Each core template must work for at least 2 courses, and each industry template for 1. An accent pill marks a gap.</p>
<ul class="g-cov">${coverage.join('')}</ul>
${sections}
<script>(function(){
var root=document.documentElement;
function fit(){[].forEach.call(document.querySelectorAll('.g-thumb'),function(t){t.firstElementChild.style.setProperty('--k',t.clientWidth/${STAGE.canvas.width});});}
addEventListener('resize',fit);fit();
[].forEach.call(document.querySelectorAll('[data-theme-btn]'),function(b){b.addEventListener('click',function(){
  root.setAttribute('data-theme',b.getAttribute('data-theme-btn'));
  [].forEach.call(document.querySelectorAll('[data-theme-btn]'),function(x){x.setAttribute('aria-pressed',String(x===b));});});});
var sober=document.getElementById('g-sober');sober.addEventListener('click',function(){
  var on=sober.getAttribute('aria-pressed')!=='true';sober.setAttribute('aria-pressed',String(on));
  [].forEach.call(document.querySelectorAll('.g-grid'),function(g){g.classList.toggle('st-tone-sober',on);});});
})();</script>
</body></html>`;
}
