import { createAdminClient } from '@/lib/supabase/server';
import type { EventKind, FactoryJob, JobStore, StageName } from './types';

const BUCKET = 'scorm-packages';

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToJob(r: any): FactoryJob {
  return {
    id: r.id,
    moduleId: r.module_id,
    fileName: r.file_name,
    sourceFormat: r.source_format,
    storagePath: r.storage_path,
    status: r.status,
    currentStage: r.current_stage,
    completedStages: r.completed_stages ?? [],
    attempt: r.attempt,
    maxAttempts: r.max_attempts,
    costUsd: Number(r.cost_usd ?? 0),
    smeFlags: Array.isArray(r.sme_flags) ? r.sme_flags : [],
    error: r.error,
  };
}

function patchToRow(p: Partial<FactoryJob>): Record<string, unknown> {
  const m: Record<string, string> = {
    status: 'status',
    currentStage: 'current_stage',
    completedStages: 'completed_stages',
    attempt: 'attempt',
    costUsd: 'cost_usd',
    smeFlags: 'sme_flags',
    error: 'error',
  };
  const row: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(p)) if (m[k]) row[m[k]] = v;
  return row;
}

export function createSupabaseStore(): JobStore {
  const sb = createAdminClient();
  const artifactPath = (jobId: string, name: string) => `factory/${jobId}/${name}.json`;

  return {
    async claimNext() {
      for (let i = 0; i < 5; i++) {
        const { data: next } = await sb
          .from('factory_jobs')
          .select('id')
          .eq('status', 'queued')
          .order('created_at', { ascending: true })
          .limit(1);
        if (!next || next.length === 0) return null;
        const now = new Date().toISOString();
        const { data: claimed } = await sb
          .from('factory_jobs')
          .update({ status: 'running', locked_at: now, started_at: now, updated_at: now })
          .eq('id', next[0].id)
          .eq('status', 'queued') // loses the race cleanly if another worker took it
          .select('*');
        if (claimed && claimed.length > 0) return rowToJob(claimed[0]);
      }
      return null;
    },

    async recoverStale(olderThanMs) {
      const cutoff = new Date(Date.now() - olderThanMs).toISOString();
      const { data } = await sb
        .from('factory_jobs')
        .update({ status: 'queued', locked_at: null })
        .eq('status', 'running')
        .lt('locked_at', cutoff)
        .select('id');
      return data?.length ?? 0;
    },

    async update(id, patch) {
      const now = new Date().toISOString();
      const row: Record<string, unknown> = { ...patchToRow(patch), updated_at: now, locked_at: now };
      if (patch.status && patch.status !== 'running') {
        row.locked_at = null;
        if (['complete', 'failed', 'cancelled', 'awaiting_review'].includes(patch.status)) row.finished_at = now;
      }
      const { error } = await sb.from('factory_jobs').update(row).eq('id', id);
      if (error) throw new Error(`factory_jobs update failed: ${error.message}`);
    },

    async isCancelled(id) {
      const { data } = await sb.from('factory_jobs').select('status').eq('id', id).single();
      return data?.status === 'cancelled';
    },

    async addEvent(jobId: string, stage: StageName | null, kind: EventKind, message: string, data) {
      const { error } = await sb
        .from('factory_job_events')
        .insert({ job_id: jobId, stage, kind, message, data: data ?? null });
      if (error) console.error('[factory] event insert failed:', error.message);
    },

    async readArtifact(jobId, name) {
      const { data, error } = await sb.storage.from(BUCKET).download(artifactPath(jobId, name));
      if (error || !data) return null;
      return JSON.parse(await data.text());
    },

    async writeArtifact(jobId, name, payload) {
      const { error } = await sb.storage
        .from(BUCKET)
        .upload(artifactPath(jobId, name), new Blob([JSON.stringify(payload)], { type: 'application/json' }), {
          contentType: 'application/json',
          upsert: true,
        });
      if (error) throw new Error(`artifact upload failed (${name}): ${error.message}`);
    },
  };
}

export { rowToJob, BUCKET };
