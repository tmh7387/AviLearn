import { generateObject } from 'ai';
import { z } from 'zod';
import { getModel } from './anthropic-client';
import { logAgentDecision, timer } from './logger';
import type { ParsedSlide, SlideClassification } from '../transform/types';

const EnrichmentSchema = z.object({
  slides: z.array(
    z.object({
      index: z.number(),
      classification: z.enum([
        'text_heavy',
        'diagram',
        'procedure_checklist',
        'data_chart',
        'title_slide',
        'image_heavy',
        'quiz_exercise',
      ]),
      reasoning: z.string(),
    })
  ),
});

/**
 * Prepare a summary of a slide's visual content for the enrichment prompt.
 * Strips base64 data to keep token usage low — only sends metadata.
 */
function summarizeVisualContent(slide: Omit<ParsedSlide, 'classification'>): string {
  const parts: string[] = [];

  if (slide.images && slide.images.length > 0) {
    parts.push(`Images: ${slide.images.length} embedded image(s) [${slide.images.map(i =>
      `${i.altText} (${i.width}x${i.height}px, ${i.contentType || 'unknown'}${i.groupId ? ', grouped' : ''})`
    ).join(', ')}]`);
  }

  if (slide.shapes && slide.shapes.length > 0) {
    // Group shapes by groupId for clearer context
    const groups = new Map<string, typeof slide.shapes>();
    const ungrouped: typeof slide.shapes = [];
    for (const s of slide.shapes) {
      if (s.groupId) {
        if (!groups.has(s.groupId)) groups.set(s.groupId, []);
        groups.get(s.groupId)!.push(s);
      } else {
        ungrouped.push(s);
      }
    }

    if (groups.size > 0) {
      for (const [gid, shapes] of groups) {
        parts.push(`Shape Group "${gid}": ${shapes.length} shapes [${shapes.map(s =>
          `"${s.name}"${s.fillColor ? ` fill:${s.fillColor}` : ''}${s.text ? ` text:"${s.text}"` : ''}`
        ).join(', ')}]`);
      }
    }
    if (ungrouped.length > 0) {
      parts.push(`Standalone shapes: ${ungrouped.map(s =>
        `"${s.name}"${s.fillColor ? ` fill:${s.fillColor}` : ''}${s.text ? ` text:"${s.text}"` : ''}`
      ).join(', ')}`);
    }
  }

  if (slide.tables && slide.tables.length > 0) {
    parts.push(`Tables: ${slide.tables.length} table(s) [${slide.tables.map(t =>
      `${t.rows.length} rows x ${t.rows[0]?.length || 0} cols`
    ).join(', ')}]`);
  }

  return parts.length > 0 ? `\nVisual content: ${parts.join(' | ')}` : '';
}

/**
 * The Enrichment Agent analyzes each slide/section to classify it semantically.
 */
export async function runEnrichmentAgent(
  slides: Omit<ParsedSlide, 'classification'>[],
  moduleId: string
): Promise<ParsedSlide[]> {
  const elapsed = timer();

  // Build a leaner representation for the prompt (no base64 image data)
  const slideSummaries = slides.map(s => ({
    index: s.index,
    title: s.title,
    textContent: s.textContent.slice(0, 500),
    hasImages: s.hasImages,
    hasCharts: s.hasCharts,
    notes: s.notes?.slice(0, 200),
    visualSummary: summarizeVisualContent(s),
  }));

  const { object } = await generateObject({
    model: getModel('supervisor'), // Use Opus 4.6 for classification accuracy
    schema: EnrichmentSchema,
    prompt: `You are an aviation training Enrichment Agent.
    
Given a list of slides/sections with titles, text, notes, and visual content metadata, analyze each slide and classify it into one of the following categories:
- title_slide: Introductions, titles, section breaks.
- text_heavy: Standard explanation slides, bullet points, text descriptions.
- diagram: Mindmaps, fishbones, pyramids, funnels, flowcharts, or graphical concepts. Look for grouped shapes with fill colors that form a visual layout.
- procedure_checklist: Step-by-step operations, guidelines, checklist procedures.
- data_chart: Contains numeric tables, flight paths, performance charts, engine readings, or structured tabular data.
- image_heavy: Mostly images, photos, aircraft visuals, or slides where embedded photographs are the primary content.
- quiz_exercise: Reviews, quizzes, scenario questions.

IMPORTANT classification hints from visual content:
- If "Shape Group" metadata is present with colored shapes forming a layout (pyramid, funnel, flow), classify as 'diagram'.
- If multiple embedded images are present and text is minimal, classify as 'image_heavy'.
- If structured table data is the primary content, classify as 'data_chart'.

Provide your classification and a brief reasoning for each slide.

Slides list:
${JSON.stringify(slideSummaries, null, 2)}`,
  });

  const ms = elapsed();
  await logAgentDecision({
    agentName: 'enrichment' as any,
    action: 'classify_slides',
    inputSummary: `Enriching ${slides.length} slides`,
    outputSummary: `Classified slides into categories.`,
    confidenceScore: 0.9,
    durationMs: ms,
    relatedModuleId: moduleId,
  });

  const classificationMap = new Map(
    object.slides.map(s => [s.index, s.classification])
  );

  return slides.map(s => ({
    ...s,
    classification: (classificationMap.get(s.index) || 'text_heavy') as SlideClassification,
  }));
}
