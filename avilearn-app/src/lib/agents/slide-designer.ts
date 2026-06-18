import { streamText } from 'ai';
import { getModel } from './anthropic-client';
import { logAgentDecision, timer } from './logger';
import type { ElementContext, SlideEditMessage } from './types';

/**
 * The Slide Designer Agent — an AI design editor for HTML lesson content.
 *
 * Takes the current HTML, user instructions, optional element context,
 * and conversation history. Returns a stream that yields:
 *   - An EXPLANATION section (shown in chat)
 *   - The modified HTML (loaded into the preview iframe)
 *
 * Uses a structured response format with delimiters for easy parsing.
 */

const SYSTEM_PROMPT = `You are the AviLearn Slide Designer — an expert frontend designer specializing in aviation training slide decks.
You edit self-contained HTML5 documents that render as animated slide presentations.

## Design System (AviLearn Dark Slate)

### Colors
- Canvas background: #14171f
- Card/slide background: #1c1f2a
- Surface accent: #232735
- Surface accent 2: #2c3142
- Border: #2c3142
- Border strong: #3a4055
- Text primary: #e6e9f2
- Text secondary: #a4a9bd
- Text muted: #6b7187
- Text inverse (on brand): #14171f
- Brand accent: #2dd4bf
- Brand hover: #34e2cc
- Brand tint (15% opacity): rgba(45, 212, 191, 0.15)
- Success: #22c55e / tint: rgba(34, 197, 94, 0.15)
- Warning: #f59e0b / tint: rgba(245, 158, 11, 0.15)
- Danger: #ef4444 / tint: rgba(239, 68, 68, 0.15)
- Info: #3b82f6 / tint: rgba(59, 130, 246, 0.15)
- Accent magenta: #ec4899
- Accent violet: #8b5cf6

### Typography
- Font stack: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif (from Google Fonts)
- Monospace: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace
- Scale: 11px (xs), 12px (sm), 14px (base), 15px (md), 18px (lg), 22px (xl), 28px (2xl), 36px (3xl), 48px (4xl)
- Line heights: 1.2 (tight), 1.35 (snug), 1.5 (base), 1.7 (loose)
- Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- Tracking: 0.06em (uppercase labels), -0.01em (headings)

### Spacing (use multiples of 4px)
4px | 8px | 12px | 16px | 24px | 32px | 48px | 64px

### Border Radii
- Small: 4px (buttons, inputs, chips)
- Medium: 6px (cards)
- Large: 10px (modals, panels)
- Pill: 999px (badges, tags)

### Shadows
- Pop: 0 4px 12px rgba(0, 0, 0, 0.40)
- Modal: 0 20px 40px rgba(0, 0, 0, 0.50)
- Input inset: inset 0 0 0 1px rgba(255, 255, 255, 0.02)

### Motion
- Easing: cubic-bezier(.4, 0, .2, 1) — standard for all transitions
- Fast: 80ms (hover highlights)
- Base: 150ms (buttons, inputs)
- Slow: 200ms (panels, drawers)
- Data: 600ms (chart animations)

## Design Principles
- Dark aviation aesthetic: professional, clean, high contrast
- Use inline SVG for diagrams, charts, and visual elements — never external images
- CSS flexbox/grid for layouts
- Smooth transitions and subtle animations for slide changes
- WCAG AA contrast compliance (minimum 4.5:1 for text, 3:1 for UI components)
- Square-cornered elements (border-radius: 4-6px max)
- Use the spacing scale above — avoid arbitrary pixel values
- Consistent font sizing from the type scale — avoid arbitrary sizes
- For accessibility: always include alt text on images, use semantic headings (h1-h3), ensure interactive elements have visible focus states

## Response Format
You MUST structure your response EXACTLY as follows:

EXPLANATION:
<A concise 1-3 sentence description of what you changed, written conversationally for the user>

---HTML---
<The complete modified HTML document, starting with <!DOCTYPE html> or <html>>
---END_HTML---

## Editing Rules
1. PRESERVE all existing JavaScript for slide navigation, keyboard handlers, and navigation UI.
2. PRESERVE the overall slide structure and navigation buttons (Prev/Next).
3. Only modify what the user asks for. Do NOT rewrite unrelated slides or sections.
4. For diagrams (pyramids, funnels, flowcharts, fishbones), create clean inline SVG graphics with proper colors and labels.
5. For tables, use styled HTML tables with header row in accent color and alternating row backgrounds.
6. Ensure all slides remain responsive and fill the viewport.
7. When modifying a specific element (provided in the element context), target that element precisely.
8. Always output the COMPLETE HTML document — never output a partial fragment or diff.`;

export interface SlideDesignerInput {
  currentHtml: string;
  instruction: string;
  elementContext?: ElementContext;
  conversationHistory?: SlideEditMessage[];
}

export function runSlideDesigner(input: SlideDesignerInput) {
  const { currentHtml, instruction, elementContext, conversationHistory } = input;
  const elapsed = timer();

  // Build the user prompt
  const parts: string[] = [];

  parts.push(`USER INSTRUCTION: ${instruction}`);

  if (elementContext) {
    parts.push(`\nSELECTED ELEMENT CONTEXT:
- Tag: <${elementContext.tagName}>
- CSS Selector: ${elementContext.cssSelector}
- Text preview: "${elementContext.textPreview.slice(0, 300)}"
- Outer HTML (truncated):
\`\`\`html
${elementContext.outerHTML.slice(0, 1500)}
\`\`\``);
  }

  // Include recent conversation for continuity (last 6 turns max)
  if (conversationHistory && conversationHistory.length > 0) {
    const recent = conversationHistory.slice(-6);
    parts.push(`\nRECENT CONVERSATION CONTEXT:`);
    for (const msg of recent) {
      const prefix = msg.role === 'user' ? 'User' : 'Assistant';
      parts.push(`${prefix}: ${msg.content.slice(0, 300)}`);
    }
  }

  parts.push(`\nCURRENT HTML DOCUMENT:
\`\`\`html
${currentHtml}
\`\`\`

Apply the user's instruction to this HTML document. Remember to output the COMPLETE modified HTML wrapped in ---HTML--- / ---END_HTML--- delimiters.`);

  const userPrompt = parts.join('\n');

  const streamResult = streamText({
    model: getModel('slideDesigner'),
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
  });

  return {
    streamResult,
    /** Call after stream is fully consumed to log the decision. */
    async logCompletion(outputSummary: string, relatedModuleId?: string) {
      const ms = elapsed();
      await logAgentDecision({
        agentName: 'slide_designer',
        action: 'edit_slide_html',
        inputSummary: `Instruction: "${instruction.slice(0, 120)}" | HTML size: ${currentHtml.length} chars${elementContext ? ` | Target: <${elementContext.tagName}>` : ''}`,
        outputSummary,
        durationMs: ms,
        relatedModuleId,
      });
    },
  };
}

/**
 * Parse the AI response into explanation and HTML sections.
 * Called after the full stream is collected.
 */
export function parseSlideDesignerResponse(fullText: string): {
  explanation: string;
  html: string | null;
} {
  // Extract explanation
  let explanation = '';
  const explanationMatch = fullText.match(/EXPLANATION:\s*([\s\S]*?)(?=---HTML---|$)/i);
  if (explanationMatch) {
    explanation = explanationMatch[1].trim();
  }

  // Extract HTML
  let html: string | null = null;
  const htmlMatch = fullText.match(/---HTML---\s*([\s\S]*?)\s*---END_HTML---/);
  if (htmlMatch) {
    html = htmlMatch[1].trim();
    // Strip markdown code fences if model wrapped the HTML
    html = html.replace(/^```(?:html)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  }

  return { explanation, html };
}
