import {
  NonRetryableError,
  type FactoryJob,
  type JobStore,
  type StageDef,
  type StageName,
} from './types';

export interface RunOptions {
  /** If true, a finished job waits in awaiting_review. Phase 4 turns this on. */
  requireReview?: boolean;
  /** Delay before a retry. Default 2000 ms x attempt. */
  retryDelayMs?: (attempt: number) => number;
  /** How often a running job refreshes its lock, so other workers do not take it. Default 60 s. */
  heartbeatMs?: number;
  /** Default max time for one stage attempt. Default 10 minutes. */
  stageTimeoutMs?: number;
  /** Injected for tests. */
  sleep?: (ms: number) => Promise<void>;
}

async function withTimeout(
  work: (signal: AbortSignal) => Promise<void>,
  ms: number,
  stageName: string
): Promise<void> {
  const ac = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      ac.abort();
      reject(new Error(`Stage ${stageName} timed out after ${Math.round(ms / 1000)} s`));
    }, ms);
  });
  try {
    await Promise.race([work(ac.signal), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Run one claimed job through the stage list.
 * - Skips stages already in job.completedStages (resume after crash or retry).
 * - Retries a failing stage up to job.maxAttempts times, unless it throws NonRetryableError.
 * - Checks for cancel between stages.
 */
export async function runJob(
  job: FactoryJob,
  stages: StageDef[],
  store: JobStore,
  opts: RunOptions = {}
): Promise<FactoryJob['status']> {
  const sleep = opts.sleep ?? defaultSleep;
  const delay = opts.retryDelayMs ?? ((n: number) => 2000 * n);
  const completed = new Set<StageName>(job.completedStages);
  const smeFlags = new Set<string>(job.smeFlags);

  await store.update(job.id, { status: 'running', error: null });
  await store.addEvent(job.id, null, 'job.start', `Started ${job.fileName}`);

  for (const stage of stages) {
    if (stage.appliesTo && !stage.appliesTo(job)) continue;
    if (completed.has(stage.name)) continue;

    if (await store.isCancelled(job.id)) {
      await store.addEvent(job.id, null, 'job.cancelled', 'Job cancelled');
      return 'cancelled';
    }

    await store.update(job.id, { currentStage: stage.name });
    const started = Date.now();

    let stageDone = false;
    for (let attempt = 1; attempt <= job.maxAttempts && !stageDone; attempt++) {
      await store.addEvent(job.id, stage.name, 'stage.start', `Stage ${stage.name}, attempt ${attempt}`, {
        attempt,
      });
      const heartbeat = setInterval(() => {
        store.update(job.id, {}).catch(() => {});
      }, opts.heartbeatMs ?? 60_000);
      try {
        await withTimeout(
          (signal) =>
            stage.run({
              job,
              readArtifact: <T,>(name: string) => store.readArtifact(job.id, name) as Promise<T | null>,
              writeArtifact: (name, data) => store.writeArtifact(job.id, name, data),
              progress: (message, data) => store.addEvent(job.id, stage.name, 'stage.progress', message, data),
              addSmeFlags: (flags) => flags.forEach((f) => smeFlags.add(f)),
              signal,
            }),
          stage.timeoutMs ?? opts.stageTimeoutMs ?? 10 * 60 * 1000,
          stage.name
        );
        stageDone = true;
      } catch (err) {
        const message = errMessage(err);
        const retryable = !(err instanceof NonRetryableError) && attempt < job.maxAttempts;
        if (!retryable) {
          await store.addEvent(job.id, stage.name, 'stage.failed', message, { attempt });
          await store.update(job.id, {
            status: 'failed',
            error: `${stage.name}: ${message}`,
            attempt: job.attempt + attempt,
            smeFlags: [...smeFlags],
          });
          await store.addEvent(job.id, null, 'job.failed', `${stage.name}: ${message}`);
          return 'failed';
        }
        await store.addEvent(job.id, stage.name, 'stage.retry', `${message} — retrying`, { attempt });
        await sleep(delay(attempt));
      } finally {
        clearInterval(heartbeat);
      }
    }

    completed.add(stage.name);
    await store.update(job.id, {
      completedStages: [...completed],
      smeFlags: [...smeFlags],
    });
    await store.addEvent(job.id, stage.name, 'stage.done', `Stage ${stage.name} done`, {
      durationMs: Date.now() - started,
    });
  }

  const finalStatus = opts.requireReview ? 'awaiting_review' : 'complete';
  await store.update(job.id, {
    status: finalStatus,
    currentStage: null,
    smeFlags: [...smeFlags],
  });
  await store.addEvent(
    job.id,
    null,
    finalStatus === 'complete' ? 'job.complete' : 'job.awaiting_review',
    finalStatus === 'complete' ? 'Job complete' : 'Job waiting for SME review',
    { smeFlagCount: smeFlags.size }
  );
  return finalStatus;
}

/** Process queued jobs until none are left or `limit` jobs are done. */
export async function drainQueue(
  stages: StageDef[],
  store: JobStore,
  opts: RunOptions & { limit?: number } = {}
): Promise<{ processed: number; failed: number }> {
  let processed = 0;
  let failed = 0;
  const limit = opts.limit ?? Infinity;
  while (processed < limit) {
    const job = await store.claimNext();
    if (!job) break;
    const status = await runJob(job, stages, store, opts);
    processed++;
    if (status === 'failed') failed++;
  }
  return { processed, failed };
}
