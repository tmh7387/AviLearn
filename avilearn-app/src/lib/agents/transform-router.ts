import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import { getModel } from './anthropic-client';
import { logAgentDecision, timer } from './logger';
import type { ParsedSlide } from '../transform/types';

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
 * The Transform Router Agent groups slides into lessons and compiles
 * 'html' type lessons into rich self-contained HTML5 slide decks.
 */
export async function runTransformRouterAgent(
  slides: ParsedSlide[],
  moduleId: string
) {
  const elapsed = timer();

  // 1. Group slides into logical lessons and select formats
  const { object: routing } = await generateObject({
    model: getModel('researcher'), // Doing model (Sonnet 4.6) for routing layout
    schema: RoutingSchema,
    prompt: `You are an aviation training Transform Router Agent.
    
Given the classified slides list, group them into logical, bite-sized lessons under the module.
For each lesson, recommend the most appropriate content type:
- html: For text, diagrams, and charts. These will be rendered as interactive animated HTML5 slides.
- video: For visual/operational overview.
- simulation: For complex procedures, checklists, or decision-making drills. (Will trigger simulation generator).

Ensure slides are grouped in order of sequence.
Slides list:
${JSON.stringify(slides, null, 2)}`,
  });

  const processedLessons = [];

  // 2. For each lesson mapped to 'html', generate the animated HTML5 slides
  for (const lesson of routing.lessons) {
    const lessonSlides = slides.filter(s => lesson.slideIndices.includes(s.index));
    
    let htmlCode: string | undefined;
    if (lesson.contentType === 'html') {
      const { text } = await generateText({
        model: getModel('simDesigner'), // Sonnet 4.6 for code generation
        prompt: `You are an aviation training slide renderer (frontend-slides skill).
        
Generate a single, self-contained, responsive HTML file that presents the following slides as a premium animated deck.
The design must match the AviLearn dark slate style with square-cornered elements and custom spacing.

Slides Content:
${JSON.stringify(lessonSlides, null, 2)}

Requirements:
1. Canvas color: #14171f, Card/slide background: #1c1f2a, Text primary: #e6e9f2, Accent brand: #2dd4bf.
2. Single file including CSS in <style> and simple JS in <script> for navigation (Prev / Next buttons, keyboard arrows).
3. Smooth transitions (fade-in, slide-in) between slides.
4. Render slides according to their type:
   - text_heavy: beautiful bullet lists with spacing.
   - diagram: structured CSS boxes/flowcharts.
   - data_chart: styled HTML table with borders and highlights.
   - procedure_checklist: styled vertical steps sequence.
5. Access Inter font from Google Fonts.`,
      });
      htmlCode = text;
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
