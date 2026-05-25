import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// POST /api/modules — Create a new module under a course
export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const body = await request.json();
  const { courseId, title, description, learningObjectives, sortOrder } = body;

  if (!courseId || !title) {
    return Response.json({ error: 'courseId and title are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('modules')
    .insert({
      course_id: courseId,
      title,
      description: description || null,
      learning_objectives: learningObjectives || null,
      sort_order: sortOrder || 0,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}
