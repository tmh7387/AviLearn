import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const maxDuration = 300;
type Ctx = { params: Promise<{ id: string }> };
const TERMINAL = ['complete', 'failed', 'cancelled', 'awaiting_review'];

/**
 * Server-Sent Events for one job. Every event is a row from factory_job_events,
 * so the stream shows only what really happened. Resume with ?cursor=<last id>.
 */
export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const sb = createAdminClient();
  let cursor = Number(new URL(req.url).searchParams.get('cursor') ?? req.headers.get('last-event-id') ?? 0) || 0;
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      req.signal.addEventListener('abort', () => { closed = true; });
      const started = Date.now();
      try {
        while (!closed && Date.now() - started < 280_000) {
          const { data: events } = await sb
            .from('factory_job_events').select('*').eq('job_id', id).gt('id', cursor).order('id').limit(200);
          for (const e of events ?? []) {
            cursor = e.id;
            controller.enqueue(enc.encode(`id: ${e.id}\nevent: ${e.kind}\ndata: ${JSON.stringify(e)}\n\n`));
          }
          const { data: job } = await sb.from('factory_jobs').select('status').eq('id', id).single();
          if (!job || (TERMINAL.includes(job.status) && (events ?? []).length === 0)) break;
          controller.enqueue(enc.encode(': keepalive\n\n'));
          await new Promise((r) => setTimeout(r, 1000));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' },
  });
}
