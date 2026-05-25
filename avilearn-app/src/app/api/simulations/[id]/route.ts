import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET /api/simulations/[id] — Fetch simulation details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('generated_simulations')
    .select(`
      *,
      modules(title, course_id, courses(code, name)),
      simulation_types(name, display_name)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    return Response.json({ error: 'Simulation not found' }, { status: 404 });
  }

  return Response.json(data);
}

// PATCH /api/simulations/[id] — Update status (approve/reject)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const supabase = createAdminClient();

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.status) {
    updates.status = body.status;
    if (body.status === 'approved') {
      updates.approved_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from('generated_simulations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

// DELETE /api/simulations/[id] — Remove simulation
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('generated_simulations')
    .delete()
    .eq('id', id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
