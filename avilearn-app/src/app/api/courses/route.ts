import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// POST /api/courses — Create a new course
export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const { name, code, description, status } = await request.json();

  if (!name || !code) {
    return Response.json({ error: 'Name and Code are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('courses')
    .insert({
      name,
      code,
      description: description || null,
      status: status || 'draft'
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}
