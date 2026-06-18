import { NextRequest, NextResponse } from 'next/server';
import { generateSlideImage } from '@/lib/agents/image-generator';

export const maxDuration = 120; // Allow 2 min for AI image generation

/**
 * POST /api/lessons/[lessonId]/image
 *
 * Generate an image for a slide using the Image Generator agent.
 *
 * Request body:
 *   { currentHtml: string, hint?: string }
 *
 * Response:
 *   { base64DataUri: string, altText: string, prompt: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  // Await dynamic params (Next.js App Router convention)
  await params;

  // Parse request body
  let body: { currentHtml: string; hint?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  // Validate required field
  if (!body.currentHtml || typeof body.currentHtml !== 'string' || body.currentHtml.trim().length === 0) {
    return NextResponse.json(
      { error: 'currentHtml is required and must be a non-empty string' },
      { status: 400 },
    );
  }

  try {
    const result = await generateSlideImage({
      slideHtml: body.currentHtml,
      userHint: body.hint,
    });

    return NextResponse.json({
      base64DataUri: result.base64DataUri,
      altText: result.altText,
      prompt: result.prompt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image generation failed';
    console.error('[POST /api/lessons/[lessonId]/image]', message);

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
