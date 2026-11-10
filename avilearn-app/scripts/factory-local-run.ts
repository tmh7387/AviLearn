/**
 * Run the factory without Next.js (for tests and batch runs on any OS).
 * Usage: node --env-file=.env.local <tsx> scripts/factory-local-run.ts <moduleId> <file> [file...]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createAdminClient } from '../src/lib/supabase/server';
import { BUCKET } from '../src/lib/factory/supabase-store';
import { kickWorker } from '../src/lib/factory/worker';

async function main() {
  const [moduleId, ...files] = process.argv.slice(2);
  if (!moduleId || files.length === 0) throw new Error('Usage: <moduleId> <file> [file...]');
  const sb = createAdminClient();
  const ids: string[] = [];

  for (const f of files) {
    const fileName = path.basename(f);
    const ext = fileName.split('.').pop()!.toLowerCase();
    const format = ({ pptx: 'pptx', pptm: 'pptx', pdf: 'pdf', docx: 'docx', mp4: 'mp4' } as Record<string, string>)[ext];
    if (!format) throw new Error(`Unsupported extension: ${fileName}`);
    const jobId = crypto.randomUUID();
    const storagePath = `factory/inbox/${jobId}/${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const up = await sb.storage.from(BUCKET).upload(storagePath, fs.readFileSync(f), { upsert: false });
    if (up.error) throw new Error(`Upload failed: ${up.error.message}`);
    const ins = await sb.from('factory_jobs').insert({
      id: jobId, module_id: moduleId, file_name: fileName, source_format: format, storage_path: storagePath,
    });
    if (ins.error) throw new Error(`Queue failed: ${ins.error.message}`);
    await sb.from('factory_job_events').insert({ job_id: jobId, kind: 'job.queued', message: `Queued ${fileName}` });
    ids.push(jobId);
    console.log(`queued ${fileName} -> job ${jobId}`);
  }

  // Print events live while the worker runs.
  let cursor = 0;
  const timer = setInterval(async () => {
    const { data } = await sb.from('factory_job_events').select('*').in('job_id', ids).gt('id', cursor).order('id');
    for (const e of data ?? []) {
      cursor = e.id;
      console.log(`[${new Date(e.created_at).toISOString().slice(11, 19)}] ${e.kind.padEnd(15)} ${e.stage ?? '-'} ${e.message}`);
    }
  }, 1500);

  const result = await kickWorker();
  await new Promise((r) => setTimeout(r, 2000));
  clearInterval(timer);
  console.log('worker result:', result);
  const { data: jobs } = await sb.from('factory_jobs').select('id,file_name,status,error,sme_flags').in('id', ids);
  console.log(JSON.stringify(jobs, null, 2));
}
main().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
