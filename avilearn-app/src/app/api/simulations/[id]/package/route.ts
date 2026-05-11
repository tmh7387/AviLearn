import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { packageSimulationAsCmi5 } from '@/lib/agents/packager';

// POST /api/simulations/[id]/package — Package approved simulation as cmi5 AU
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch simulation
  const { data: sim, error } = await supabase
    .from('generated_simulations')
    .select('*, modules(title)')
    .eq('id', id)
    .single();

  if (error || !sim) {
    return Response.json({ error: 'Simulation not found' }, { status: 404 });
  }

  if (sim.status !== 'approved') {
    return Response.json(
      { error: 'Only approved simulations can be packaged' },
      { status: 400 }
    );
  }

  try {
    const storagePath = await packageSimulationAsCmi5({
      simulationId: sim.id,
      moduleId: sim.module_id,
      moduleTitle: (sim.modules as { title: string })?.title || sim.title,
      htmlCode: sim.html_code,
      simType: sim.title.split(':')[0] || 'simulation',
    });

    return Response.json({ storagePath, success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Packaging failed';
    return Response.json({ error: message }, { status: 500 });
  }
}
