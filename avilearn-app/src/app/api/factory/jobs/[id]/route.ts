import { NextRequest, after } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { rowToJob } from '@/lib/factory/supabase-store';
import { kickWorker } from '@/lib/factory/worker';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const { data } = await createAdminClient().from('factory_jobs').select('*').eq('id', id).single();
  if (!data) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ job: rowToJob(data) });
}

/** Body: { action: "cancel" | "retry" } */
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const { action } = (await req.json().catch(() => ({}))) as { action?: string };
  const sb = createAdminClient();
  const { data: job } = await sb.from('factory_jobs').select('status').eq('id', id).single();
  if (!job) return Response.json({ error: 'Not found' }, { status: 404 });

  if (action === 'cancel') {
    if (!['queued', 'running'].includes(job.status)) {
      return Response.json({ error: `Cannot cancel a ${job.status} job` }, { status: 409 });
    }
    await sb.from('factory_jobs').update({ status: 'cancelled', finished_at: new Date().toISOString() }).eq('id', id);
    await sb.from('factory_job_events').insert({ job_id: id, kind: 'job.cancelled', message: 'Cancelled by user' });
    return Response.json({ ok: true });
  }
  if (action === 'retry') {
    if (!['failed', 'cancelled'].includes(job.status)) {
      return Response.json({ error: `Cannot retry a ${job.status} job` }, { status: 409 });
    }
    // completed_stages is kept, so the job resumes where it stopped.
    await sb.from('factory_jobs').update({ status: 'queued', error: null, finished_at: null }).eq('id', id);
    await sb.from('factory_job_events').insert({ job_id: id, kind: 'job.queued', message: 'Re-queued by user' });
    after(() => kickWorker().catch((e) => console.error('[factory] worker error', e)));
    return Response.json({ ok: true });
  }
  return Response.json({ error: 'action must be "cancel" or "retry"' }, { status: 400 });
}
