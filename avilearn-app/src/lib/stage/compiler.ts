import { esc, MARK_SVG, TextLog, countWords, type VisibleText } from './html';
import { SlideDeckSpecSchema, type SlideDeckSpec, type SlideDeckSpecInput, type SlideSpec, type StageAsset } from './schema';
import { getTemplate, stepCount } from './templates';
import { PRESENTER_CSS, SLIDE_CSS } from './styles';
import { PRESENTER_JS } from './runtime';
import { STAGE } from './tokens';
import { MotionLog, motionPlan } from './motion';
import { voiceProblems } from './voice';
import { allowedColors, getThemePack, getVertical, ownerOf, packCss, templateAllowed, type ThemePack, type VerticalPack } from './packs';

export interface StageIssue {
  level: 'error' | 'warn';
  code: 'schema' | 'pack' | 'template' | 'assertion' | 'steps' | 'words' | 'words-step' | 'color' | 'voice' | 'motion';
  slideId?: string;
  message: string;
}

export interface RenderedSlide {
  id: string;
  templateId: SlideSpec['templateId'];
  html: string;
  steps: number;
  fullView: boolean;
  /** Words visible at full view (assertion + template text). */
  words: number;
  texts: VisibleText[];
  notes: string[];
  issues: StageIssue[];
}

const W = STAGE.words;

/** Render one slide to markup. Validation problems come back as issues, not exceptions. */
export function renderSlide(
  deck: SlideDeckSpec,
  slide: SlideSpec,
  index: number,
  assets: Map<string, StageAsset>,
  theme: ThemePack,
  vertical: VerticalPack,
): RenderedSlide {
  const issues: StageIssue[] = [];
  const def = getTemplate(slide.templateId);
  if (!templateAllowed(vertical, slide.templateId)) {
    issues.push({
      level: 'error',
      code: 'pack',
      slideId: slide.id,
      message: `${slide.templateId} belongs to the ${ownerOf(slide.templateId)?.name} pack; this deck uses the ${vertical.name} pack`,
    });
  }
  const parsed = def.schema.safeParse(slide.data);
  const base = { id: slide.id, templateId: slide.templateId, notes: slide.steps.map((st) => st.speakerNotes) };

  if (!parsed.success) {
    for (const iss of parsed.error.issues) {
      issues.push({ level: 'error', code: 'schema', slideId: slide.id, message: `data.${iss.path.join('.')}: ${iss.message}` });
    }
    return { ...base, html: errorSlide(slide, issues), steps: slide.steps.length, fullView: false, words: 0, texts: [], issues };
  }

  const data = parsed.data;
  const log = new TextLog();
  const motion = new MotionLog();
  let body: string;
  try {
    body = def.render(data, { deck, assets, log, theme, vertical, motion });
  } catch (e) {
    issues.push({ level: 'error', code: 'template', slideId: slide.id, message: (e as Error).message });
    return { ...base, html: errorSlide(slide, issues), steps: slide.steps.length, fullView: false, words: 0, texts: [], issues };
  }

  if (def.needsAssertion && !slide.assertion) {
    issues.push({ level: 'error', code: 'assertion', slideId: slide.id, message: `${slide.templateId} needs an assertion headline` });
  }

  const steps = stepCount(def, data);
  const fullView = (def.fullView && def.parts(data) > 1) || !!def.lastIsFull;
  if (slide.steps.length !== steps) {
    issues.push({
      level: 'error',
      code: 'steps',
      slideId: slide.id,
      message: `${slide.templateId} with this data builds in ${steps} step(s)${fullView ? ' (last is the full view)' : ''}, but the spec gives ${slide.steps.length} speaker-note step(s)`,
    });
  }

  const showHead = def.needsAssertion || !!slide.assertion;
  const head = showHead
    ? `${slide.eyebrow ? `<div class="st-eyebrow">${esc(slide.eyebrow)}</div>` : ''}${slide.assertion ? `<h2 class="st-h">${esc(slide.assertion)}</h2>` : ''}`
    : '';

  let l3 = '';
  if (slide.lowerThird) {
    const lt = slide.lowerThird;
    l3 = `<div class="st-l3" aria-hidden="true"><b>${log.t(1, lt.name)}</b>${lt.role ? `<span>${log.t(1, lt.role)}</span>` : ''}</div>`;
  }
  const words = log.items.reduce((n, t) => n + countWords(t.text), 0) + countWords(slide.assertion ?? '');
  if (words > W.slideMax) {
    issues.push({ level: 'error', code: 'words', slideId: slide.id, message: `${words} words on screen; the limit is ${W.slideMax}. Move detail to speaker notes.` });
  } else if (words > W.slideTarget) {
    issues.push({ level: 'warn', code: 'words', slideId: slide.id, message: `${words} words on screen; the target is ${W.slideTarget}.` });
  }
  for (let st = 1; steps > 1 && st <= steps; st++) {
    const added = log.items.filter((t) => t.step === st).reduce((n, t) => n + countWords(t.text), 0);
    if (added > W.perStep) {
      issues.push({ level: 'warn', code: 'words-step', slideId: slide.id, message: `Step ${st} adds ${added} words; the target is ${W.perStep} or fewer.` });
    }
  }

  if (def.sequence) {
    // Branded sequence: no step limit, but its parts still enter one after another.
  } else {
    const parts = Array.from({ length: steps }, (_, k) => (body.match(new RegExp(`data-s="${k + 1}"`, 'g')) ?? []).length);
    for (const p of motionPlan(steps, parts, motion)) {
      if (p.longest > STAGE.motion.maxMove || p.stagger < STAGE.motion.minStagger) {
        issues.push({
          level: 'error',
          code: 'motion',
          slideId: slide.id,
          message: `Step ${p.step} moves ${p.movers} parts; they cannot all enter inside ${STAGE.motion.maxMove} ms. Split the step.`,
        });
      }
    }
  }

  const outro = def.sequence === 'outro';
  const html =
    `<section class="st-slide t-${slide.templateId}"${def.sequence ? ` data-seq="${def.sequence}"` : ''}${slide.lowerThird ? ' data-l3' : ''} data-id="${esc(slide.id)}" aria-label="Slide ${index + 1}">` +
    `<div class="st-in">${head}<div class="st-body">${body}</div></div>${l3}` +
    `<div class="st-foot"><span class="st-mark"${outro ? ` data-s="1" ${motion.m(1, 'pin')}` : ''}>${theme.markIcon ? MARK_SVG : ''}${esc(theme.product)}</span><span>${esc(deck.module.code)} · ${index + 1} / ${deck.slides.length}</span></div>` +
    `</section>`;

  for (const text of [slide.eyebrow ?? '', slide.assertion ?? '', ...log.items.map((t) => t.text)]) {
    for (const message of voiceProblems(text, vertical.voice)) issues.push({ level: 'error', code: 'voice', slideId: slide.id, message });
  }

  issues.push(...auditColors(html, theme, slide.id));
  return { ...base, html, steps, fullView, words, texts: log.items, issues };
}

function errorSlide(slide: SlideSpec, issues: StageIssue[]): string {
  return `<section class="st-slide" data-id="${esc(slide.id)}"><div class="st-in"><div class="st-eyebrow">Slide error · ${esc(slide.templateId)}</div>${issues
    .map((i) => `<p class="st-box-t">${esc(i.message)}</p>`)
    .join('')}</div></section>`;
}

const COLOR_RE = /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/gi;

/** Any colour literal in slide markup must be a token value. */
export function auditColors(html: string, theme: ThemePack, slideId?: string): StageIssue[] {
  const allowed = allowedColors(theme);
  const found = new Set<string>();
  for (const m of html.matchAll(COLOR_RE)) {
    const v = m[0].toLowerCase().replace(/\s+/g, '');
    if (!allowed.has(v)) found.add(m[0]);
  }
  return [...found].map((c) => ({ level: 'error' as const, code: 'color' as const, slideId, message: `Colour ${c} is not a stage token` }));
}

export interface CompiledDeck {
  spec: SlideDeckSpec;
  theme: ThemePack;
  vertical: VerticalPack;
  slides: RenderedSlide[];
  issues: StageIssue[];
  html: string;
}

/** Validate a deck spec and compile it to one self-contained HTML presentation. */
export function compileDeck(input: SlideDeckSpecInput | unknown): CompiledDeck {
  const parsed = SlideDeckSpecSchema.safeParse(input);
  if (!parsed.success) {
    const issues: StageIssue[] = parsed.error.issues.map((i) => ({ level: 'error', code: 'schema', message: `${i.path.join('.')}: ${i.message}` }));
    return { spec: input as SlideDeckSpec, theme: undefined as unknown as ThemePack, vertical: undefined as unknown as VerticalPack, slides: [], issues, html: '' };
  }
  const spec = parsed.data;
  const theme = getThemePack(spec.theme);
  const vertical = getVertical(spec.vertical);
  if (!theme || !vertical) {
    const issues: StageIssue[] = [];
    if (!theme) issues.push({ level: 'error', code: 'pack', message: `Unknown theme pack "${spec.theme}"` });
    if (!vertical) issues.push({ level: 'error', code: 'pack', message: `Unknown industry pack "${spec.vertical}"` });
    return { spec, theme: theme!, vertical: vertical!, slides: [], issues, html: '' };
  }
  const mode = spec.defaultTheme ?? theme.defaultMode;
  const assets = new Map(spec.assets.map((a) => [a.id, a]));
  const ids = new Set<string>();
  const issues: StageIssue[] = [];
  const slides = spec.slides.map((sl, i) => {
    if (ids.has(sl.id)) issues.push({ level: 'error', code: 'schema', slideId: sl.id, message: `Duplicate slide id "${sl.id}"` });
    ids.add(sl.id);
    return renderSlide(spec, sl, i, assets, theme, vertical);
  });
  issues.push(...slides.flatMap((s) => s.issues));

  const meta = {
    theme: mode,
    steps: slides.map((s) => s.steps),
    full: slides.map((s) => s.fullView),
    notes: slides.map((s) => s.notes),
  };

  const html = `<!doctype html>
<html lang="en" data-theme="${mode}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(spec.module.code)} · ${esc(spec.lesson.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${theme.fonts.googleHref}">
<style>${packCss(theme)}${SLIDE_CSS}${PRESENTER_CSS}</style>
</head>
<body>
<main class="st-stage" aria-label="${esc(spec.lesson.title)}">
<div class="st-deck st-tone-${spec.tone}">
${slides.map((s) => s.html).join('\n')}
</div>
</main>
<aside class="st-notes" hidden><b>Speaker notes</b><p></p></aside>
<nav class="st-hud" aria-label="Presenter controls">
<button type="button" data-a="prev" aria-label="Back">‹</button><span class="st-pos"></span><button type="button" data-a="next" aria-label="Next">›</button>
<button type="button" data-a="notes">Notes</button><button type="button" data-a="theme">Light/Dark</button><button type="button" data-a="fs">Full screen</button><button type="button" data-a="motion">Motion</button>
</nav>
<script type="application/json" id="st-meta">${JSON.stringify(meta).replace(/</g, '\\u003c')}</script>
<script>${PRESENTER_JS}</script>
</body>
</html>`;

  return { spec, theme, vertical, slides, issues, html };
}
