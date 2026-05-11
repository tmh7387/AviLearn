import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { classifyContentDomain } from '@/lib/agents/supervisor';
import { recommendSimulationType } from '@/lib/agents/researcher';
import { generateSimulationCode } from '@/lib/agents/sim-designer';
import { verifySimulation } from '@/lib/agents/verifier';
import type { AgentContext, PipelineProgress } from '@/lib/agents/types';

export const maxDuration = 120; // Allow up to 2 min for the full pipeline

export async function POST(request: NextRequest) {
  const { moduleId } = await request.json();

  if (!moduleId) {
    return Response.json({ error: 'moduleId is required' }, { status: 400 });
  }

  const supabase = await createClient();

  // Fetch module + course info
  const { data: mod, error: modErr } = await supabase
    .from('modules')
    .select('id, title, description, learning_objectives, course_id, courses(code, name)')
    .eq('id', moduleId)
    .single();

  if (modErr || !mod) {
    return Response.json({ error: 'Module not found' }, { status: 404 });
  }

  const course = (mod as Record<string, unknown>).courses as { code: string; name: string } | null;

  const context: AgentContext = {
    moduleId: mod.id,
    moduleTitle: mod.title,
    courseCode: course?.code || 'UNKNOWN',
    learningObjectives: mod.learning_objectives || [],
    slideContent: mod.description || undefined,
  };

  // Use SSE for real-time progress
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(progress: PipelineProgress) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(progress)}\n\n`)
        );
      }

      try {
        // Step 1: Classify content domain
        send({ step: 'classifying', message: 'Analyzing content domain...' });
        const classification = await classifyContentDomain(context);
        send({
          step: 'classifying',
          message: `Domain: ${classification.domain} (${(classification.confidence * 100).toFixed(0)}% confidence)`,
          data: { classification },
        });

        // Step 2: Research best simulation type
        send({ step: 'researching', message: 'Researching pedagogic best practice...' });
        const recommendation = await recommendSimulationType(context, classification.domain);
        send({
          step: 'researching',
          message: `Recommended: ${recommendation.simType} — ${recommendation.rationale.slice(0, 80)}...`,
          data: { recommendation },
        });

        // Look up sim_type_id from DB
        const { data: simTypeRow } = await supabase
          .from('simulation_types')
          .select('id')
          .eq('name', recommendation.simType)
          .single();

        const simTypeId = simTypeRow?.id;

        // Step 3: Generate simulation code
        send({ step: 'generating', message: `Generating ${recommendation.simType} simulation...` });
        const generated = await generateSimulationCode(
          context,
          recommendation.simType,
          recommendation.rationale
        );
        send({
          step: 'generating',
          message: `Generated ${generated.htmlCode.length} chars of HTML`,
        });

        // Step 4: Verify quality
        send({ step: 'verifying', message: 'Reviewing against learning objectives...' });
        const verification = await verifySimulation(
          context,
          recommendation.simType,
          generated.htmlCode
        );
        send({
          step: 'verifying',
          message: `Score: ${verification.score}/100 — ${verification.passed ? 'PASSED' : 'NEEDS REVIEW'}`,
          data: { verification },
        });

        // Store in DB
        const { data: simRecord, error: insertErr } = await supabase
          .from('generated_simulations')
          .insert({
            module_id: moduleId,
            sim_type_id: simTypeId || null,
            title: `${recommendation.simType}: ${context.moduleTitle}`,
            html_code: generated.htmlCode,
            status: verification.passed ? 'pending_review' : 'revision_requested',
            xapi_verb: generated.xapiVerb,
            learning_objectives: context.learningObjectives,
            sme_flags: verification.smeFlags,
            agent_rationale: `Domain: ${classification.domain} (${classification.reasoning})\n\nSim type: ${recommendation.simType}\nRationale: ${recommendation.rationale}\nPedagogic basis: ${recommendation.pedagogicBasis}`,
            researcher_output: recommendation as unknown as Record<string, unknown>,
            verifier_output: verification as unknown as Record<string, unknown>,
          })
          .select()
          .single();

        if (insertErr) {
          send({ step: 'error', message: `DB error: ${insertErr.message}` });
          controller.close();
          return;
        }

        send({
          step: 'complete',
          message: 'Simulation generated successfully!',
          data: {
            simulationId: simRecord?.id,
            simType: recommendation.simType,
            score: verification.score,
            passed: verification.passed,
            smeFlags: verification.smeFlags,
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        send({ step: 'error', message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
