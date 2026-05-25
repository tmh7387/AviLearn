import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  const { moduleId } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('modules')
    .select(`
      id, title, description, learning_objectives, sort_order,
      courses(code, name),
      lessons(id, title, content_type, duration_minutes, sort_order)
    `)
    .eq('id', moduleId)
    .single();

  if (error || !data) {
    return Response.json({ error: 'Module not found' }, { status: 404 });
  }

  return Response.json(data);
}
