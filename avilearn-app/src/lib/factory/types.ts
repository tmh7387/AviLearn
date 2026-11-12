/**
 * Content Factory — shared types. No imports from app code, so the runner can be unit tested alone.
 */

export const STAGE_ORDER = ['intake', 'enrichment', 'routing', 'saving'] as const;
export type StageName = (typeof STAGE_ORDER)[number];

export type JobStatus =
  | 'queued'
  | 'running'
  | 'awaiting_review'
  | 'complete'
  | 'failed'
  | 'cancelled';

export type SourceFormat = 'pptx' | 'pdf' | 'docx' | 'mp4' | 'html';

export interface FactoryJob {
  id: string;
  moduleId: string;
  fileName: string;
  sourceFormat: SourceFormat;
  storagePath: string;
  status: JobStatus;
  currentStage: StageName | null;
  completedStages: StageName[];
  attempt: number;
  maxAttempts: number;
  costUsd: number;
  smeFlags: string[];
  error: string | null;
}

export type EventKind =
  | 'job.queued'
  | 'job.start'
  | 'job.complete'
  | 'job.awaiting_review'
  | 'job.failed'
  | 'job.cancelled'
  | 'stage.start'
  | 'stage.progress'
  | 'stage.done'
  | 'stage.retry'
  | 'stage.failed';

/** Throw this from a stage when retrying cannot help (e.g. unsupported format). */
export class NonRetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NonRetryableError';
  }
}

export interface StageContext {
  job: FactoryJob;
  /** Read JSON saved by an earlier stage. Returns null if missing. */
  readArtifact<T = unknown>(name: string): Promise<T | null>;
  /** Save JSON for later stages. Overwrites. */
  writeArtifact(name: string, data: unknown): Promise<void>;
  /** Write a progress line to the job event log. */
  progress(message: string, data?: Record<string, unknown>): Promise<void>;
  /** Add SME review flags to the job. */
  addSmeFlags(flags: string[]): void;
  /** Aborted when the stage times out. Pass it to fetch or SDK calls that accept a signal. */
  signal: AbortSignal;
}

export interface StageDef {
  name: StageName;
  /** Return false to skip this stage for a job. */
  appliesTo?: (job: FactoryJob) => boolean;
  /** Max run time for one attempt. Default comes from RunOptions.stageTimeoutMs (10 min). */
  timeoutMs?: number;
  run(ctx: StageContext): Promise<void>;
}

/** Storage and queue operations. Supabase implements this in production; tests use memory. */
export interface JobStore {
  /** Atomically take the oldest queued job and mark it running. */
  claimNext(): Promise<FactoryJob | null>;
  /** Move running jobs with a stale lock back to queued. Returns how many. */
  recoverStale(olderThanMs: number): Promise<number>;
  update(id: string, patch: Partial<FactoryJob>): Promise<void>;
  isCancelled(id: string): Promise<boolean>;
  addEvent(
    jobId: string,
    stage: StageName | null,
    kind: EventKind,
    message: string,
    data?: Record<string, unknown>
  ): Promise<void>;
  readArtifact(jobId: string, name: string): Promise<unknown | null>;
  writeArtifact(jobId: string, name: string, data: unknown): Promise<void>;
}
