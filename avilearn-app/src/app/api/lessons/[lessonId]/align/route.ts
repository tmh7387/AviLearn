/**
 * Objective Alignment API — checks slide content against module objectives.
 *
 * POST /api/lessons/[lessonId]/align
 * Returns JSON (not SSE) — designed for fast single responses.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { checkObjectiveAlignment } from '@/lib/agents/objective-aligner';
import type { SmartObjective } from '@/lib/agents/types';

export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const { lessonId } = await params;

  try {
    const { currentHtml } = await request.json();

    if (!currentHtml || typeof currentHtml !== 'string') {
      return NextResponse.json({ error: 'currentHtml is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch lesson → module → course lesson plan chain
    const { data: lesson, error: lessonErr } = await supabase
      .from('lessons')
      .select('id, module_id, title')
      .eq('id', lessonId)
      .single();

    if (lessonErr || !lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    const { data: module, error: modErr } = await supabase
      .from('modules')
      .select('id, course_id, title, learning_objectives, objective_indices')
      .eq('id', lesson.module_id)
      .single();

    if (modErr || !module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Try to get SMART objectives from the course lesson plan
    let smartObjectives: SmartObjective[] = [];
    let objectiveIndices: number[] = module.objective_indices || [];
    let evaluationStrategy: string | undefined;

    const { data: lessonPlan } = await supabase
      .from('lesson_plans')
      .select('learning_objectives, evaluation_strategy')
      .eq('course_id', module.course_id)
      .single();

    if (lessonPlan?.learning_objectives && objectiveIndices.length > 0) {
      // Use course-level SMART objectives filtered by module's indices
      const allObjectives = lessonPlan.learning_objectives as SmartObjective[];
      smartObjectives = objectiveIndices
        .filter((idx) => idx >= 0 && idx < allObjectives.length)
        .map((idx) => allObjectives[idx]);
      evaluationStrategy = lessonPlan.evaluation_strategy ?? undefined;
    } else if (module.learning_objectives?.length) {
      // Fallback: map module's text-based objectives to basic SmartObjective format
      smartObjectives = (module.learning_objectives as string[]).map((text, i) => ({
        text,
        bloom_level: 'understand' as const,
        action_verb: 'demonstrate',
        conditions: '',
        standard: '',
        audience: 'the trainee',
      }));
      objectiveIndices = smartObjectives.map((_, i) => i);
    } else {
      return NextResponse.json(
        {
          error: 'No learning objectives found. Create a course lesson plan or add objectives to the module first.',
        },
        { status: 400 },
      );
    }

    // Run alignment check
    const report = await checkObjectiveAlignment({
      currentHtml,
      objectives: smartObjectives,
      objectiveIndices,
      evaluationStrategy,
      moduleTitle: module.title,
    });

    return NextResponse.json(report);
  } catch (err) {
    console.error('Objective alignment error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to check objective alignment' },
      { status: 500 },
    );
  }
}
