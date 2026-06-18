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
      lessons(id, title, content_type, content_url, duration_minutes, sort_order)
    `)
    .eq('id', moduleId)
    .single();

  if (error || !data) {
    return Response.json({ error: 'Module not found' }, { status: 404 });
  }

  return Response.json(data);
}

// PATCH /api/modules/[moduleId] — Update module details
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  const { moduleId } = await params;
  const supabase = createAdminClient();
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.learningObjectives !== undefined) updates.learning_objectives = body.learningObjectives;
  if (body.sortOrder !== undefined) updates.sort_order = body.sortOrder;

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'No fields to update' }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('modules')
    .update(updates)
    .eq('id', moduleId)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

// DELETE /api/modules/[moduleId] — Delete a module and all its lessons
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  const { moduleId } = await params;
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('modules')
    .delete()
    .eq('id', moduleId);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
