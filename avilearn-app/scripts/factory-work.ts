// Dev tool: run the worker once and print events. Use after re-queuing a job.
// Usage: node --env-file=.env.local <tsx> scripts/factory-work.ts
import { createAdminClient } from '../src/lib/supabase/server';
import { kickWorker } from '../src/lib/factory/worker';

(async () => {
  const sb = createAdminClient();
  const since = new Date().toISOString();
  let cursor = 0;
  const timer = setInterval(async () => {
    const { data } = await sb.from('factory_job_events').select('*').gte('created_at', since).gt('id', cursor).order('id');
    for (const e of data ?? []) {
      cursor = e.id;
      console.log(`[${new Date(e.created_at).toISOString().slice(11, 19)}] ${e.kind.padEnd(15)} ${e.stage ?? '-'} ${e.message}`);
    }
  }, 1500);
  const result = await kickWorker();
  await new Promise((r) => setTimeout(r, 2500));
  clearInterval(timer);
  console.log('worker result:', result);
  process.exit(0);
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
