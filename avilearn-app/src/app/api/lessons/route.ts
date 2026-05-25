import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// POST /api/lessons — Create a new lesson under a module
export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const body = await request.json();
  const { moduleId, title, contentType, contentUrl, sortOrder, durationMinutes } = body;

  if (!moduleId || !title || !contentType) {
    return Response.json({ error: 'moduleId, title, and contentType are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('lessons')
    .insert({
      module_id: moduleId,
      title,
      content_type: contentType,
      content_url: contentUrl || null,
      sort_order: sortOrder || 0,
      duration_minutes: durationMinutes || null,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}
