// Dev tool: run the enrichment agent alone on a saved intake artifact and time it.
// Usage: node --env-file=.env.local <tsx> scripts/factory-diag-enrichment.ts <jobId>
import { createSupabaseStore } from '../src/lib/factory/supabase-store';
import { runEnrichmentAgent } from '../src/lib/agents/enrichment';

(async () => {
  const jobId = process.argv[2];
  const store = createSupabaseStore();
  const slides = (await store.readArtifact(jobId, 'intake')) as any[] | null;
  if (!slides) throw new Error('no intake artifact');
  const t = Date.now();
  console.log('slides', slides.length, 'artifact ok');
  const r = await Promise.race([
    runEnrichmentAgent(slides, 'e3a2a5e1-960c-478e-ad07-fe86e03b465f'),
    new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT after 240s')), 240000)),
  ]);
  console.log('done in', Date.now() - t, 'ms', (r as any[]).length, 'slides classified');
  process.exit(0);
})().catch((e) => { console.log('ERR', e.statusCode ?? '', String(e.message).slice(0, 500)); process.exit(1); });
