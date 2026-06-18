import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { runSlideDesigner, parseSlideDesignerResponse } from '@/lib/agents/slide-designer';
import type { ElementContext, SlideEditMessage } from '@/lib/agents/types';

export const maxDuration = 120; // Allow 2 min for AI response

/**
 * POST /api/lessons/[lessonId]/edit
 *
 * Streaming AI edit endpoint for the Slide Studio.
 * Accepts user instruction + optional element context,
 * fetches the current HTML from Supabase, calls the Slide Designer agent,
 * and streams back the explanation + modified HTML.
 *
 * Request body:
 *   { instruction: string, elementContext?: ElementContext, conversationHistory?: SlideEditMessage[] }
 *
 * Response: Server-Sent Events stream
 *   event: explanation  — incremental text of the AI explanation
 *   event: html         — the complete modified HTML document
 *   event: done         — signals completion
 *   event: error        — error message
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;
  const supabase = createAdminClient();

  // Parse request body
  let body: {
    instruction: string;
    elementContext?: ElementContext;
    conversationHistory?: SlideEditMessage[];
    currentHtml?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.instruction || body.instruction.trim().length === 0) {
    return Response.json({ error: 'instruction is required' }, { status: 400 });
  }

  // Get current HTML
  let currentHtml: string;

  if (body.currentHtml) {
    // Use the provided HTML (enables editing unsaved working state)
    currentHtml = body.currentHtml;
  } else {
    // Fetch from Supabase Storage
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('id, content_url')
      .eq('id', lessonId)
      .single();

    if (error || !lesson) {
      return Response.json({ error: 'Lesson not found' }, { status: 404 });
    }

    if (!lesson.content_url) {
      return Response.json({ error: 'Lesson has no content to edit' }, { status: 404 });
    }

    const { data: fileData, error: downloadErr } = await supabase.storage
      .from('scorm-packages')
      .download(lesson.content_url);

    if (downloadErr || !fileData) {
      return Response.json({ error: 'Failed to download lesson content' }, { status: 500 });
    }

    currentHtml = await fileData.text();
  }

  // --- HTML size guardrail ---
  // Per-slide editing on the client typically sends ~10-50K.
  // This server-side limit is a safety net for direct API calls.
  const MAX_HTML_CHARS = 200_000;
  if (currentHtml.length > MAX_HTML_CHARS) {
    return Response.json({
      error: `Document too large for AI editing (${currentHtml.length.toLocaleString()} chars). Maximum is ${MAX_HTML_CHARS.toLocaleString()} chars. The Slide Studio should automatically edit per-slide for large documents. If you see this error, try navigating to a specific slide first.`,
    }, { status: 413 });
  }

  // Fetch module_id for agent logging
  let relatedModuleId: string | undefined;
  {
    const { data: lessonRow } = await supabase
      .from('lessons')
      .select('module_id')
      .eq('id', lessonId)
      .single();
    relatedModuleId = lessonRow?.module_id;
  }

  // Stream the AI response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(event: string, data: string) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      }

      try {
        const { streamResult, logCompletion } = runSlideDesigner({
          currentHtml,
          instruction: body.instruction,
          elementContext: body.elementContext,
          conversationHistory: body.conversationHistory,
        });

        // Collect the full text while streaming
        let fullText = '';

        const resolved = await streamResult;

        for await (const chunk of resolved.textStream) {
          fullText += chunk;

          // Try to parse explanation progressively
          const explanationMatch = fullText.match(/EXPLANATION:\s*([\s\S]*?)(?=---HTML---|$)/i);
          if (explanationMatch && !fullText.includes('---HTML---')) {
            // Still in explanation phase — stream it
            sendEvent('explanation', explanationMatch[1].trim());
          }
        }

        // Parse the complete response
        const { explanation, html } = parseSlideDesignerResponse(fullText);

        // Send final explanation
        sendEvent('explanation', explanation);

        // Send the HTML
        if (html) {
          sendEvent('html', html);
        } else {
          sendEvent('error', 'AI did not produce valid HTML output. Please try again.');
        }

        sendEvent('done', 'complete');

        // Log the agent decision (fire-and-forget, don't block response)
        logCompletion(
          html
            ? `Generated ${html.length} chars HTML. ${explanation.slice(0, 120)}`
            : `Failed to produce HTML. ${explanation.slice(0, 120)}`,
          relatedModuleId,
        ).catch(() => {}); // Swallow logging errors
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        sendEvent('error', message);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
