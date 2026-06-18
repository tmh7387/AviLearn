import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import { getModel } from './anthropic-client';
import { logAgentDecision, timer } from './logger';
import type { ParsedSlide, SlideImage } from '../transform/types';

const RoutingSchema = z.object({
  lessons: z.array(
    z.object({
      title: z.string(),
      contentType: z.enum(['html', 'video', 'simulation']),
      slideIndices: z.array(z.number()),
      durationMinutes: z.number(),
      rationale: z.string(),
    })
  ),
});

/**
 * Build a visual context block for a slide, to be included in the HTML generation prompt.
 * Sends shape metadata and image placeholders (NOT raw base64) to keep tokens low.
 */
function buildVisualContext(slide: ParsedSlide): string {
  const parts: string[] = [];

  // Image placeholders
  if (slide.images && slide.images.length > 0) {
    parts.push(`EMBEDDED IMAGES (use <img src="{{IMG_${slide.images[0].id}}}" ...> placeholders):`);
    for (const img of slide.images) {
      parts.push(`  - {{IMG_${img.id}}}: "${img.altText}" (${img.width}x${img.height}px)${img.groupId ? ` [part of ${img.groupId}]` : ''}`);
    }
  }

  // Shape metadata for diagram recreation
  if (slide.shapes && slide.shapes.length > 0) {
    parts.push(`SHAPE METADATA (recreate as CSS/SVG diagram):`);

    // Group shapes by groupId
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

    for (const [gid, shapes] of groups) {
      parts.push(`  Group "${gid}" (${shapes.length} shapes — recreate as a unified visual):`);
      for (const s of shapes) {
        parts.push(`    - "${s.name}" | pos: (${s.left},${s.top}) size: ${s.width}x${s.height}px${s.fillColor ? ` | fill: ${s.fillColor}` : ''}${s.text ? ` | label: "${s.text}"` : ''}`);
      }
    }
    for (const s of ungrouped) {
      parts.push(`  - "${s.name}" | pos: (${s.left},${s.top}) size: ${s.width}x${s.height}px${s.fillColor ? ` | fill: ${s.fillColor}` : ''}${s.text ? ` | label: "${s.text}"` : ''}`);
    }
  }

  // Structured table data
  if (slide.tables && slide.tables.length > 0) {
    parts.push(`TABLE DATA (render as styled HTML table):`);
    for (let ti = 0; ti < slide.tables.length; ti++) {
      const t = slide.tables[ti];
      parts.push(`  Table ${ti + 1}:`);
      for (const row of t.rows) {
        parts.push(`    | ${row.join(' | ')} |`);
      }
    }
  }

  return parts.length > 0 ? `\n--- VISUAL CONTENT FOR THIS SLIDE ---\n${parts.join('\n')}\n--- END VISUAL CONTENT ---` : '';
}

/**
 * Build a mapping of image placeholder IDs to their base64 data URIs,
 * collected from all slides in a lesson.
 */
function collectImageMap(slides: ParsedSlide[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const slide of slides) {
    if (slide.images) {
      for (const img of slide.images) {
        map.set(`{{IMG_${img.id}}}`, img.base64);
      }
    }
  }
  return map;
}

/**
 * Replace image placeholders in generated HTML with actual base64 data URIs.
 */
function replaceImagePlaceholders(html: string, imageMap: Map<string, string>): string {
  let result = html;
  for (const [placeholder, base64Data] of imageMap) {
    result = result.replaceAll(placeholder, base64Data);
  }
  return result;
}

/**
 * Prepare slides for the prompt by stripping base64 image data.
 * We keep everything except the heavy base64 payloads.
 */
function prepareSlidesForPrompt(slides: ParsedSlide[]): object[] {
  return slides.map(s => {
    const cleaned: Record<string, unknown> = {
      index: s.index,
      title: s.title,
      textContent: s.textContent,
      classification: s.classification,
    };
    if (s.notes) cleaned.notes = s.notes;
    // Visual context is added separately via buildVisualContext
    return cleaned;
  });
}

/**
 * The Transform Router Agent groups slides into lessons and compiles
 * 'html' type lessons into rich self-contained HTML5 slide decks.
 */
export async function runTransformRouterAgent(
  slides: ParsedSlide[],
  moduleId: string
) {
  const elapsed = timer();

  // 1. Group slides into logical lessons and select formats
  // Use a lightweight representation for routing (no images/shapes)
  const routingSlides = slides.map(s => ({
    index: s.index,
    title: s.title,
    textContent: s.textContent.slice(0, 300),
    classification: s.classification,
    hasImages: s.hasImages,
    hasCharts: s.hasCharts,
    hasShapes: !!(s.shapes && s.shapes.length > 0),
    hasTables: !!(s.tables && s.tables.length > 0),
  }));

  const { object: routing } = await generateObject({
    model: getModel('researcher'),
    schema: RoutingSchema,
    prompt: `You are an aviation training Transform Router Agent.
    
Given the classified slides list, group them into logical, bite-sized lessons under the module.
For each lesson, recommend the most appropriate content type:
- html: For text, diagrams, tables, and charts. These will be rendered as interactive animated HTML5 slides.
- video: For visual/operational overview.
- simulation: For complex procedures, checklists, or decision-making drills. (Will trigger simulation generator).

Ensure slides are grouped in order of sequence.
Slides list:
${JSON.stringify(routingSlides, null, 2)}`,
  });

  const processedLessons = [];

  // 2. For each lesson mapped to 'html', generate the animated HTML5 slides
  for (const lesson of routing.lessons) {
    const lessonSlides = slides.filter(s => lesson.slideIndices.includes(s.index));
    
    let htmlCode: string | undefined;
    if (lesson.contentType === 'html') {
      // Build visual context for each slide
      const visualContexts = lessonSlides.map(s => {
        const vc = buildVisualContext(s);
        return vc ? `\nSlide ${s.index} ("${s.title}"):${vc}` : '';
      }).filter(Boolean).join('\n');

      // Collect image map for post-processing
      const imageMap = collectImageMap(lessonSlides);

      const { text } = await generateText({
        model: getModel('simDesigner'),
        prompt: `You are an aviation training slide renderer (frontend-slides skill).
        
Generate a single, self-contained, responsive HTML file that presents the following slides as a premium animated deck.
The design must match the AviLearn dark slate style with square-cornered elements and custom spacing.

Slides Content:
${JSON.stringify(prepareSlidesForPrompt(lessonSlides), null, 2)}

${visualContexts ? `\n--- VISUAL CONTENT INSTRUCTIONS ---\nThe following slides have visual elements that MUST be recreated:\n${visualContexts}\n--- END VISUAL CONTENT INSTRUCTIONS ---` : ''}

Requirements:
1. Canvas color: #14171f, Card/slide background: #1c1f2a, Text primary: #e6e9f2, Accent brand: #2dd4bf.
2. Single file including CSS in <style> and simple JS in <script> for navigation (Prev / Next buttons, keyboard arrows).
3. Smooth transitions (fade-in, slide-in) between slides.
4. Render slides according to their classification type:
   - text_heavy: Beautiful bullet lists with spacing and hierarchy.
   - diagram: CRITICAL — Recreate the visual diagram from the shape metadata using inline SVG or styled CSS divs.
     * Use the provided fill colors to match the original color scheme.
     * Maintain spatial relationships (which shape is above/below, larger/smaller).
     * If shapes form a pyramid/funnel/triangle, render as a tapered shape with colored sections.
     * If shapes form a flowchart, use connected boxes with arrows.
     * Label each section with the text provided in the shape metadata.
   - data_chart: Render structured table data as styled HTML tables with:
     * Header row in accent color (#2dd4bf), body rows with alternating backgrounds.
     * Clean borders, readable cell padding, and text alignment.
   - procedure_checklist: Styled vertical steps sequence with numbered indicators.
   - image_heavy: Layout images prominently with captions.
5. Access Inter font from Google Fonts.
6. IMAGES: When image placeholders ({{IMG_xxx}}) are provided, embed them using:
   <img src="{{IMG_xxx}}" alt="description" style="max-width:100%;height:auto;border-radius:4px;">
   Place images at contextually appropriate positions within the slide layout.
   For slides with both text and images, use a two-column layout (text left, image right).
7. TABLES: When structured table data is provided in the visual content block, render it as a proper HTML table.
   Use the exact cell values from the table data. Style with the AviLearn dark theme.
8. Show a slide counter in the top-right corner (e.g., "Slide 1 / 5").
9. Each slide should fill the viewport height. Use flexbox centering for content.

CRITICAL: Output ONLY the raw HTML. Do NOT wrap it in markdown code fences. Start with <!DOCTYPE html> or <html>.`,
      });

      // Strip markdown code fences if the model wrapped the output
      htmlCode = text
        .replace(/^```(?:html)?\s*\n?/i, '')
        .replace(/\n?```\s*$/i, '')
        .trim();

      // Post-process: replace image placeholders with actual base64 data
      if (imageMap.size > 0) {
        htmlCode = replaceImagePlaceholders(htmlCode, imageMap);
      }
    } else if (lesson.contentType === 'video') {
      // Mocking video render file (creating a simple preview player overlay)
      htmlCode = `
      <div style="background:#14171f;color:#e6e9f2;font-family:sans-serif;height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;">
        <h2 style="color:#2dd4bf;margin-bottom:8px;">${lesson.title}</h2>
        <p style="color:#a4a9bd;margin-bottom:24px;">Narrated procedural video simulation (HeyGen HyperFrames output)</p>
        <video width="640" height="360" controls style="border:1px solid #2c3142;border-radius:6px;background:#000;">
          <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      </div>`;
    }

    processedLessons.push({
      title: lesson.title,
      contentType: lesson.contentType,
      durationMinutes: lesson.durationMinutes,
      htmlCode,
    });
  }

  const ms = elapsed();
  await logAgentDecision({
    agentName: 'transform_router' as any,
    action: 'route_and_render',
    inputSummary: `Routed ${slides.length} slides into ${routing.lessons.length} lessons.`,
    outputSummary: `Generated code for HTML/Video lessons.`,
    confidenceScore: 0.9,
    durationMs: ms,
    relatedModuleId: moduleId,
  });

  return processedLessons;
}
