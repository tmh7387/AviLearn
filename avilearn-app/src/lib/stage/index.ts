export { STAGE, themeCssVars, contrast } from './tokens';
export type { StageThemeName, StageTone, StageTheme } from './tokens';
export { SlideDeckSpecSchema, SlideSpecSchema, TEMPLATE_IDS } from './schema';
export type { SlideDeckSpec, SlideDeckSpecInput, SlideSpec, TemplateId } from './schema';
export { compileDeck, renderSlide, auditColors } from './compiler';
export type { CompiledDeck, RenderedSlide, StageIssue } from './compiler';
export { TEMPLATES, getTemplate, stepCount } from './templates';
export { buildGallery } from './gallery';
