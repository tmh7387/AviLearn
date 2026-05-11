import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const supabase = await createClient();

  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      id, code, name, description, status,
      modules(id, title, description, sort_order, learning_objectives)
    `)
    .eq('id', courseId)
    .single();

  if (error || !course) {
    return Response.json({ error: 'Course not found' }, { status: 404 });
  }

  return Response.json(course);
}
