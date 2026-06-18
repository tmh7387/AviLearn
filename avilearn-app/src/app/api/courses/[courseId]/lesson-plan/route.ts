/**
 * Lesson Plan API — CRUD + AI generation for course-level lesson plans.
 *
 * GET    — fetch existing lesson plan for a course
 * POST   — generate a new lesson plan via AI (SSE streaming)
 * PUT    — update an existing lesson plan
 * DELETE — remove lesson plan and clear module objective mappings
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { generateLessonPlan } from '@/lib/agents/lesson-plan-generator';

export const maxDuration = 120;

type RouteContext = { params: Promise<{ courseId: string }> };

// --- GET: Fetch existing lesson plan ---

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
) {
  const { courseId } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('lesson_plans')
    .select('*')
    .eq('course_id', courseId)
    .single();

  if (error && error.code === 'PGRST116') {
    return NextResponse.json({ error: 'No lesson plan found' }, { status: 404 });
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// --- POST: Generate new lesson plan (SSE streaming) ---

export async function POST(
  _request: NextRequest,
  { params }: RouteContext,
) {
  const { courseId } = await params;
  const supabase = createAdminClient();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(step: string, message: string, data?: Record<string, unknown>) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ step, message, data })}\n\n`),
        );
      }

      try {
        // 1. Fetch course
        send('analyzing', 'Fetching course details...');
        const { data: course, error: courseErr } = await supabase
          .from('courses')
          .select('id, code, name')
          .eq('id', courseId)
          .single();

        if (courseErr || !course) {
          send('error', 'Course not found');
          controller.close();
          return;
        }

        // 2. Fetch modules
        const { data: modules, error: modErr } = await supabase
          .from('modules')
          .select('id, title, description, learning_objectives, sort_order')
          .eq('course_id', courseId)
          .order('sort_order');

        if (modErr || !modules || modules.length === 0) {
          send('error', 'No modules found for this course. Add modules before generating a lesson plan.');
          controller.close();
          return;
        }

        send('structuring', `Analyzing ${modules.length} modules and mapping objectives...`);

        // 3. Generate lesson plan
        send('generating', 'Generating instructional strategy with AI...');

        const result = await generateLessonPlan({
          courseCode: course.code,
          courseName: course.name,
          modules: modules.map((m) => ({
            id: m.id,
            title: m.title,
            description: m.description ?? undefined,
            learningObjectives: m.learning_objectives ?? undefined,
          })),
        });

        // 4. Save lesson plan (upsert on course_id)
        send('saving', 'Saving lesson plan...');

        const { data: saved, error: saveErr } = await supabase
          .from('lesson_plans')
          .upsert(
            {
              course_id: courseId,
              course_title: result.course_title,
              total_time_minutes: result.total_time_minutes,
              instructor: result.instructor || null,
              audience_description: result.audience_description || null,
              target_group_size: result.target_group_size || null,
              rationale: result.rationale,
              learning_objectives: result.learning_objectives,
              evaluation_strategy: result.evaluation_strategy,
              instructional_aids: result.instructional_aids,
              phases: result.phases,
              notes: result.notes || null,
              generated_by: 'lesson_plan_generator',
              generation_confidence: 0.9,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'course_id' },
          )
          .select('id')
          .single();

        if (saveErr) {
          send('error', `Failed to save lesson plan: ${saveErr.message}`);
          controller.close();
          return;
        }

        // 5. Update module objective_indices
        for (const mod of modules) {
          const indices = result.moduleObjectiveIndices[mod.id] || [];
          await supabase
            .from('modules')
            .update({ objective_indices: indices })
            .eq('id', mod.id);
        }

        // 6. Done
        send('complete', 'Lesson plan generated successfully', {
          lessonPlanId: saved?.id,
          objectiveCount: result.learning_objectives.length,
          totalTimeMinutes: result.total_time_minutes,
          moduleCount: result.phases.conduct.length,
        });
      } catch (err) {
        send('error', err instanceof Error ? err.message : 'Failed to generate lesson plan');
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

// --- PUT: Update existing lesson plan ---

export async function PUT(
  request: NextRequest,
  { params }: RouteContext,
) {
  const { courseId } = await params;
  const supabase = createAdminClient();

  try {
    const body = await request.json();

    // Remove fields that shouldn't be directly updated
    const { id, course_id, created_at, ...updateData } = body;

    const { data, error } = await supabase
      .from('lesson_plans')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('course_id', courseId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update lesson plan' },
      { status: 500 },
    );
  }
}

// --- DELETE: Remove lesson plan and clear module mappings ---

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
) {
  const { courseId } = await params;
  const supabase = createAdminClient();

  try {
    // Delete the lesson plan
    const { error: delErr } = await supabase
      .from('lesson_plans')
      .delete()
      .eq('course_id', courseId);

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    // Clear objective_indices on all modules for this course
    await supabase
      .from('modules')
      .update({ objective_indices: null })
      .eq('course_id', courseId);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete lesson plan' },
      { status: 500 },
    );
  }
}
