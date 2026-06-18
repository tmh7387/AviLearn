import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { generateQuiz } from '@/lib/agents/quiz-generator';
import type { SmartObjective, BloomLevel } from '@/lib/agents/types';

export const maxDuration = 120; // Allow 2 min for AI response

/**
 * POST /api/lessons/[lessonId]/quiz
 *
 * Generates quiz questions for a lesson using the Quiz Generator agent.
 * Fetches learning objectives from the lesson plan, generates the quiz,
 * saves questions to the quiz_questions table, and streams results via SSE.
 *
 * Request body:
 *   { currentHtml: string, bloomLevel?: BloomLevel, questionCount?: number }
 *
 * Response: Server-Sent Events stream
 *   data: { type: 'text', content: string }        — progress messages
 *   data: { type: 'html', content: string }         — the quiz HTML
 *   data: { type: 'done' }                          — signals completion
 *   data: { type: 'error', content: string }        — error message
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;
  const supabase = createAdminClient();

  // --- Parse request body ---
  let body: {
    currentHtml: string;
    bloomLevel?: BloomLevel;
    questionCount?: number;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.currentHtml || body.currentHtml.trim().length === 0) {
    return Response.json({ error: 'currentHtml is required' }, { status: 400 });
  }

  // --- Fetch lesson ---
  const { data: lesson, error: lessonErr } = await supabase
    .from('lessons')
    .select('id, module_id, title')
    .eq('id', lessonId)
    .single();

  if (lessonErr || !lesson) {
    return Response.json({ error: 'Lesson not found' }, { status: 404 });
  }

  // --- Fetch module ---
  const { data: module, error: moduleErr } = await supabase
    .from('modules')
    .select('id, course_id, title, objective_indices')
    .eq('id', lesson.module_id)
    .single();

  if (moduleErr || !module) {
    return Response.json({ error: 'Module not found' }, { status: 404 });
  }

  // --- Fetch course lesson plan for learning objectives ---
  const { data: lessonPlan } = await supabase
    .from('lesson_plans')
    .select('learning_objectives')
    .eq('course_id', module.course_id)
    .single();

  // --- Extract relevant objectives ---
  let learningObjectives: SmartObjective[] = [];

  if (lessonPlan?.learning_objectives && Array.isArray(lessonPlan.learning_objectives)) {
    const allObjectives = lessonPlan.learning_objectives as SmartObjective[];

    if (module.objective_indices && Array.isArray(module.objective_indices)) {
      // Filter to only the objectives relevant to this module
      learningObjectives = (module.objective_indices as number[])
        .filter((idx: number) => idx >= 0 && idx < allObjectives.length)
        .map((idx: number) => allObjectives[idx]);
    }

    // Fall back to all objectives if indices didn't produce results
    if (learningObjectives.length === 0) {
      learningObjectives = allObjectives;
    }
  }

  // If no lesson plan exists, fall back to module's own learning_objectives text array
  if (learningObjectives.length === 0) {
    const { data: moduleWithObjectives } = await supabase
      .from('modules')
      .select('learning_objectives')
      .eq('id', module.id)
      .single();

    if (moduleWithObjectives?.learning_objectives && Array.isArray(moduleWithObjectives.learning_objectives)) {
      learningObjectives = (moduleWithObjectives.learning_objectives as string[]).map(
        (text: string): SmartObjective => ({
          text,
          bloom_level: body.bloomLevel ?? 'understand',
          action_verb: text.split(' ')[0] || 'describe',
          conditions: 'Given the course material',
          standard: 'correctly',
          audience: 'aviation maintenance personnel',
        })
      );
    }
  }

  // Final fallback — use lesson title as a minimal objective
  if (learningObjectives.length === 0) {
    learningObjectives = [{
      text: `Demonstrate understanding of ${lesson.title}`,
      bloom_level: body.bloomLevel ?? 'understand',
      action_verb: 'demonstrate',
      conditions: 'Given the course material',
      standard: 'correctly',
      audience: 'aviation maintenance personnel',
    }];
  }

  // --- Stream the response via SSE ---
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(data: Record<string, unknown>) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      }

      try {
        sendEvent({ type: 'text', content: 'Generating quiz questions...' });

        const result = await generateQuiz({
          currentHtml: body.currentHtml,
          learningObjectives,
          bloomLevel: body.bloomLevel,
          questionCount: body.questionCount,
          moduleTitle: module.title,
          courseCode: module.course_id,
        });

        // --- Save questions to quiz_questions table ---
        if (result.questions.length > 0) {
          const rows = result.questions.map((q, idx) => ({
            lesson_id: lessonId,
            module_id: module.id,
            question_type: q.questionType,
            question_text: q.questionText,
            options: q.options ?? null,
            correct_answer: q.correctAnswer ?? null,
            explanation: q.explanation,
            bloom_level: q.bloomLevel,
            difficulty: q.difficulty,
            objective_index: q.objectiveIndex ?? null,
            sort_order: idx,
          }));

          const { error: insertErr } = await supabase
            .from('quiz_questions')
            .insert(rows);

          if (insertErr) {
            console.error('[QuizRoute] Failed to save quiz questions:', insertErr);
            // Don't fail the whole request — still return the generated quiz
          }
        }

        // Send the quiz HTML
        if (result.htmlCode) {
          sendEvent({ type: 'html', content: result.htmlCode });
        } else {
          sendEvent({ type: 'error', content: 'AI did not produce valid quiz HTML. Please try again.' });
        }

        // Include SME flags if any
        if (result.smeFlags.length > 0) {
          sendEvent({ type: 'text', content: `⚠️ SME Review Flags: ${result.smeFlags.join('; ')}` });
        }

        sendEvent({ type: 'done' });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error generating quiz';
        console.error('[QuizRoute] Error:', message);
        sendEvent({ type: 'error', content: message });
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
