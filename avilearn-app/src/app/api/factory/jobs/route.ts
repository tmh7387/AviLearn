import { NextRequest, after } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { BUCKET, rowToJob } from '@/lib/factory/supabase-store';
import { kickWorker } from '@/lib/factory/worker';
import type { SourceFormat } from '@/lib/factory/types';

export const maxDuration = 300;

const EXT_TO_FORMAT: Record<string, SourceFormat> = {
  pptx: 'pptx', pptm: 'pptx', pdf: 'pdf', docx: 'docx', mp4: 'mp4',
};
const MAX_BYTES = 200 * 1024 * 1024;

/** Submit one or many files. Form fields: moduleId, file (repeat for batch). */
export async function POST(request: NextRequest) {
  const sb = createAdminClient();
  const form = await request.formData();
  const moduleId = form.get('moduleId') as string | null;
  const files = form.getAll('file').filter((f): f is File => f instanceof File);

  if (!moduleId || files.length === 0) {
    return Response.json({ error: 'moduleId and at least one file are required' }, { status: 400 });
  }
  const { data: mod } = await sb.from('modules').select('id').eq('id', moduleId).single();
  if (!mod) return Response.json({ error: 'Module not found' }, { status: 404 });

  const created: unknown[] = [];
  const rejected: { fileName: string; reason: string }[] = [];

  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const format = EXT_TO_FORMAT[ext];
    if (!format) { rejected.push({ fileName: file.name, reason: `Unsupported extension .${ext}` }); continue; }
    if (file.size > MAX_BYTES) { rejected.push({ fileName: file.name, reason: 'File over 200 MB' }); continue; }

    const jobId = crypto.randomUUID();
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `factory/inbox/${jobId}/${safe}`;
    const { error: upErr } = await sb.storage.from(BUCKET).upload(storagePath, file, {
      contentType: file.type || 'application/octet-stream', upsert: false,
    });
    if (upErr) { rejected.push({ fileName: file.name, reason: `Upload failed: ${upErr.message}` }); continue; }

    const { data, error } = await sb.from('factory_jobs').insert({
      id: jobId, module_id: moduleId, file_name: file.name, source_format: format, storage_path: storagePath,
    }).select('*').single();
    if (error || !data) { rejected.push({ fileName: file.name, reason: `Queue failed: ${error?.message}` }); continue; }

    await sb.from('factory_job_events').insert({ job_id: jobId, kind: 'job.queued', message: `Queued ${file.name}` });
    created.push(rowToJob(data));
  }

  if (created.length > 0) after(() => kickWorker().catch((e) => console.error('[factory] worker error', e)));
  return Response.json({ jobs: created, rejected }, { status: created.length ? 202 : 400 });
}

/** List recent jobs. Optional ?moduleId= and ?status= filters. */
export async function GET(request: NextRequest) {
  const sb = createAdminClient();
  const url = new URL(request.url);
  let q = sb.from('factory_jobs').select('*').order('created_at', { ascending: false }).limit(100);
  const moduleId = url.searchParams.get('moduleId');
  const status = url.searchParams.get('status');
  if (moduleId) q = q.eq('module_id', moduleId);
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ jobs: (data ?? []).map(rowToJob) });
}
