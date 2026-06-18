/**
 * Image Generator Agent — Two-phase slide image generation.
 *
 * Phase 1 (Prompt Writer): Uses Anthropic Sonnet to analyze slide HTML and
 *   generate an optimal image-generation prompt + alt text.
 * Phase 2 (Image Generator): Calls the Gemini Imagen API if a key is
 *   configured, otherwise returns a dark-themed SVG placeholder.
 */

import { generateText } from 'ai';
import { getModel } from './anthropic-client';
import { logAgentDecision, timer } from './logger';
import { AI_CONFIG } from '@/lib/config';

/** Result returned by the image generator agent. */
export interface SlideImageResult {
  /** The image-generation prompt crafted by Phase 1. */
  prompt: string;
  /** Base64-encoded data URI (PNG from Gemini, or SVG placeholder). */
  base64DataUri: string;
  /** Accessibility alt text for the generated image. */
  altText: string;
}

// ---------------------------------------------------------------------------
// Phase 1 — Prompt Writer
// ---------------------------------------------------------------------------

const PROMPT_WRITER_SYSTEM = `You are an image prompt specialist for aviation training content.
Given slide HTML content and an optional user hint, write a concise, detailed image generation prompt.
The image should:
- Be educational and professional
- Support the learning content on the slide
- Use a clean, technical illustration style appropriate for aviation training
- Be suitable for a dark-themed slide deck
- NOT contain any text (text will be added separately)

Also generate a descriptive alt text for accessibility.

Respond in EXACTLY this format (no extra commentary):
PROMPT: <the image generation prompt>
ALT: <accessibility alt text>`;

async function writeImagePrompt(
  slideHtml: string,
  userHint?: string,
): Promise<{ prompt: string; altText: string }> {
  const userMessage = userHint
    ? `Slide HTML:\n${slideHtml}\n\nUser hint: ${userHint}`
    : `Slide HTML:\n${slideHtml}`;

  const { text } = await generateText({
    model: getModel('quizGenerator'), // Sonnet "doing" tier
    system: PROMPT_WRITER_SYSTEM,
    prompt: userMessage,
  });

  // Parse response — tolerant of minor formatting variations
  const promptMatch = text.match(/PROMPT:\s*(.+)/i);
  const altMatch = text.match(/ALT:\s*(.+)/i);

  return {
    prompt: promptMatch?.[1]?.trim() || 'Aviation training illustration',
    altText: altMatch?.[1]?.trim() || 'Aviation training image',
  };
}

// ---------------------------------------------------------------------------
// Phase 2 — Image Generator (Gemini Imagen or SVG placeholder)
// ---------------------------------------------------------------------------

/**
 * Call Gemini Imagen API and return a base64 PNG data URI.
 * Throws on network / API errors so the caller can fall back.
 */
async function callGeminiImagen(prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIG.gemini.imageModel}:generateContent?key=${AI_CONFIG.gemini.apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => 'unknown');
    throw new Error(`Gemini API ${res.status}: ${errorBody}`);
  }

  const json = await res.json();

  // Navigate the Gemini response to extract base64 image data
  const parts = json?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) {
    throw new Error('Gemini response contained no parts');
  }

  const imagePart = parts.find(
    (p: Record<string, unknown>) => p.inlineData && typeof p.inlineData === 'object',
  );

  if (!imagePart?.inlineData?.data) {
    throw new Error('Gemini response did not include image data');
  }

  const mimeType = (imagePart.inlineData.mimeType as string) || 'image/png';
  return `data:${mimeType};base64,${imagePart.inlineData.data}`;
}

/**
 * Generate a dark-themed SVG placeholder when no Gemini key is available.
 */
function generatePlaceholderSvg(prompt: string): string {
  const truncated =
    prompt.length > 120 ? prompt.slice(0, 117) + '...' : prompt;

  // Escape XML-sensitive characters in user-provided text
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <rect width="800" height="450" fill="#1c1f2a" rx="8"/>
  <rect x="1" y="1" width="798" height="448" fill="none" stroke="#2dd4bf" stroke-dasharray="8,6" rx="8"/>
  <!-- Image icon -->
  <g transform="translate(370, 140)">
    <rect x="0" y="0" width="60" height="48" rx="6" fill="none" stroke="#2dd4bf" stroke-width="2"/>
    <circle cx="18" cy="16" r="6" fill="#2dd4bf" opacity="0.6"/>
    <polyline points="6,40 22,26 34,36 42,28 54,40" fill="none" stroke="#2dd4bf" stroke-width="2" stroke-linejoin="round"/>
  </g>
  <!-- Prompt text -->
  <text x="400" y="230" text-anchor="middle" fill="#a4a9bd" font-family="system-ui, sans-serif" font-size="13">
    ${esc(truncated)}
  </text>
  <!-- Pending notice -->
  <text x="400" y="260" text-anchor="middle" fill="#6b7187" font-family="system-ui, sans-serif" font-size="11">
    Image generation pending — configure GEMINI_API_KEY
  </text>
</svg>`;

  const base64 = Buffer.from(svg, 'utf-8').toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate an image for a slide.
 *
 * 1. Crafts an image-generation prompt via Anthropic Sonnet.
 * 2. Generates the image via Gemini Imagen (or returns an SVG placeholder).
 */
export async function generateSlideImage(input: {
  slideHtml: string;
  userHint?: string;
}): Promise<SlideImageResult> {
  const elapsed = timer();

  // Phase 1 — Prompt Writer
  const { prompt, altText } = await writeImagePrompt(
    input.slideHtml,
    input.userHint,
  );

  // Phase 2 — Image Generator
  let base64DataUri: string;
  let source: 'gemini' | 'placeholder';

  if (AI_CONFIG.gemini.apiKey) {
    try {
      base64DataUri = await callGeminiImagen(prompt);
      source = 'gemini';
    } catch (err) {
      console.warn(
        '[ImageGenerator] Gemini call failed, falling back to placeholder:',
        err instanceof Error ? err.message : err,
      );
      base64DataUri = generatePlaceholderSvg(prompt);
      source = 'placeholder';
    }
  } else {
    base64DataUri = generatePlaceholderSvg(prompt);
    source = 'placeholder';
  }

  const ms = elapsed();

  // Log agent decision (fire-and-forget)
  logAgentDecision({
    agentName: 'slide_designer',
    action: 'generate_slide_image',
    inputSummary: `HTML ${input.slideHtml.length} chars${input.userHint ? `, hint: "${input.userHint.slice(0, 80)}"` : ''}`,
    outputSummary: `Source: ${source}. Prompt: "${prompt.slice(0, 100)}"`,
    durationMs: ms,
  }).catch(() => {}); // Swallow logging errors

  return { prompt, base64DataUri, altText };
}
