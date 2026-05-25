import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET /api/simulations/library — List all simulations with filters
export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);

  const moduleId = searchParams.get('moduleId');
  const status = searchParams.get('status');
  const simType = searchParams.get('simType');

  let query = supabase
    .from('generated_simulations')
    .select(`
      id, title, status, xapi_verb, sme_flags, agent_rationale,
      version, created_at, updated_at, approved_at, cmi5_package_path,
      learning_objectives, generation_cost_tokens,
      researcher_output, verifier_output,
      modules(id, title, course_id, courses(code, name)),
      simulation_types(name, display_name)
    `)
    .order('created_at', { ascending: false });

  if (moduleId) query = query.eq('module_id', moduleId);
  if (status) query = query.eq('status', status);
  if (simType) query = query.eq('simulation_types.name', simType);

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data || []);
}
