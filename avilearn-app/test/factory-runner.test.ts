import test from 'node:test';
import assert from 'node:assert/strict';
import { runJob, drainQueue } from '../src/lib/factory/runner';
import { NonRetryableError } from '../src/lib/factory/types';
import type { FactoryJob, JobStore, StageDef, EventKind, StageName } from '../src/lib/factory/types';

function makeJob(over: Partial<FactoryJob> = {}): FactoryJob {
  return {
    id: 'j1', moduleId: 'm1', fileName: 'a.pptx', sourceFormat: 'pptx', storagePath: 'p',
    status: 'queued', currentStage: null, completedStages: [], attempt: 0, maxAttempts: 3,
    costUsd: 0, smeFlags: [], error: null, ...over,
  };
}

function memStore(jobs: FactoryJob[]) {
  const events: { kind: EventKind; stage: StageName | null; message: string }[] = [];
  const artifacts = new Map<string, unknown>();
  const cancelled = new Set<string>();
  const store: JobStore = {
    async claimNext() {
      const j = jobs.find((x) => x.status === 'queued');
      if (!j) return null;
      j.status = 'running';
      return { ...j };
    },
    async recoverStale() { return 0; },
    async update(id, patch) { Object.assign(jobs.find((x) => x.id === id)!, patch); },
    async isCancelled(id) { return cancelled.has(id); },
    async addEvent(_id, stage, kind, message) { events.push({ kind, stage, message }); },
    async readArtifact(id, name) { return artifacts.get(`${id}/${name}`) ?? null; },
    async writeArtifact(id, name, data) { artifacts.set(`${id}/${name}`, data); },
  };
  return { store, events, artifacts, cancelled };
}

const noSleep = async () => {};
const stage = (name: StageName, run: StageDef['run']): StageDef => ({ name, run });

test('runs all stages in order and completes', async () => {
  const job = makeJob();
  const { store, events } = memStore([job]);
  const order: string[] = [];
  const stages = (['intake', 'enrichment', 'routing', 'saving'] as StageName[]).map((n) =>
    stage(n, async () => { order.push(n); })
  );
  const status = await runJob(job, stages, store, { sleep: noSleep });
  assert.equal(status, 'complete');
  assert.deepEqual(order, ['intake', 'enrichment', 'routing', 'saving']);
  assert.deepEqual(job.completedStages, ['intake', 'enrichment', 'routing', 'saving']);
  assert.equal(events.at(-1)!.kind, 'job.complete');
});

test('retries a flaky stage then succeeds', async () => {
  const job = makeJob();
  const { store, events } = memStore([job]);
  let calls = 0;
  const stages = [stage('intake', async () => { if (++calls < 3) throw new Error('boom'); })];
  const status = await runJob(job, stages, store, { sleep: noSleep });
  assert.equal(status, 'complete');
  assert.equal(calls, 3);
  assert.equal(events.filter((e) => e.kind === 'stage.retry').length, 2);
});

test('fails after max attempts and keeps the error', async () => {
  const job = makeJob({ maxAttempts: 2 });
  const { store } = memStore([job]);
  const stages = [stage('intake', async () => { throw new Error('always'); })];
  const status = await runJob(job, stages, store, { sleep: noSleep });
  assert.equal(status, 'failed');
  assert.equal(job.status, 'failed');
  assert.match(job.error!, /intake: always/);
});

test('NonRetryableError fails at once', async () => {
  const job = makeJob();
  const { store } = memStore([job]);
  let calls = 0;
  const stages = [stage('intake', async () => { calls++; throw new NonRetryableError('bad format'); })];
  assert.equal(await runJob(job, stages, store, { sleep: noSleep }), 'failed');
  assert.equal(calls, 1);
});

test('resumes: skips stages already completed', async () => {
  const job = makeJob({ completedStages: ['intake', 'enrichment'] });
  const { store } = memStore([job]);
  const ran: string[] = [];
  const stages = (['intake', 'enrichment', 'routing'] as StageName[]).map((n) =>
    stage(n, async () => { ran.push(n); })
  );
  await runJob(job, stages, store, { sleep: noSleep });
  assert.deepEqual(ran, ['routing']);
});

test('stages pass data through artifacts and add SME flags', async () => {
  const job = makeJob();
  const { store } = memStore([job]);
  let seen: unknown;
  const stages = [
    stage('intake', async (c) => { await c.writeArtifact('intake', { n: 5 }); c.addSmeFlags(['check torque value']); }),
    stage('enrichment', async (c) => { seen = await c.readArtifact('intake'); }),
  ];
  await runJob(job, stages, store, { sleep: noSleep });
  assert.deepEqual(seen, { n: 5 });
  assert.deepEqual(job.smeFlags, ['check torque value']);
});

test('requireReview parks the job in awaiting_review', async () => {
  const job = makeJob();
  const { store } = memStore([job]);
  const status = await runJob(job, [stage('intake', async () => {})], store, { sleep: noSleep, requireReview: true });
  assert.equal(status, 'awaiting_review');
});

test('cancel stops the job before the next stage', async () => {
  const job = makeJob();
  const { store, cancelled } = memStore([job]);
  const ran: string[] = [];
  const stages = [
    stage('intake', async () => { ran.push('intake'); cancelled.add(job.id); }),
    stage('enrichment', async () => { ran.push('enrichment'); }),
  ];
  assert.equal(await runJob(job, stages, store, { sleep: noSleep }), 'cancelled');
  assert.deepEqual(ran, ['intake']);
});

test('drainQueue processes every queued job and counts failures', async () => {
  const jobs = [makeJob({ id: 'a' }), makeJob({ id: 'b', maxAttempts: 1 }), makeJob({ id: 'c' })];
  const { store } = memStore(jobs);
  const stages = [stage('intake', async (c) => { if (c.job.id === 'b') throw new Error('x'); })];
  const r = await drainQueue(stages, store, { sleep: noSleep });
  assert.deepEqual(r, { processed: 3, failed: 1 });
});

test('a hung stage times out, is retried, and then succeeds', async () => {
  const job = makeJob();
  const { store, events } = memStore([job]);
  let calls = 0;
  const stages = [stage('intake', async () => { if (++calls === 1) await new Promise(() => {}); })];
  const status = await runJob(job, stages, store, { sleep: noSleep, stageTimeoutMs: 50 });
  assert.equal(status, 'complete');
  assert.equal(calls, 2);
  assert.ok(events.some((e) => e.kind === 'stage.retry' && /timed out/.test(e.message)));
});

test('a stage that always hangs ends the job as failed', async () => {
  const job = makeJob({ maxAttempts: 2 });
  const { store } = memStore([job]);
  const stages = [stage('intake', async () => { await new Promise(() => {}); })];
  const status = await runJob(job, stages, store, { sleep: noSleep, stageTimeoutMs: 30 });
  assert.equal(status, 'failed');
  assert.match(job.error!, /timed out/);
});

test('a long stage refreshes the job lock with heartbeats', async () => {
  const job = makeJob();
  const { store } = memStore([job]);
  let heartbeats = 0;
  const realUpdate = store.update.bind(store);
  store.update = async (id, patch) => { if (Object.keys(patch).length === 0) heartbeats++; return realUpdate(id, patch); };
  const stages = [stage('intake', async () => { await new Promise((r) => setTimeout(r, 120)); })];
  assert.equal(await runJob(job, stages, store, { sleep: noSleep, heartbeatMs: 20 }), 'complete');
  assert.ok(heartbeats >= 3, `expected >=3 heartbeats, got ${heartbeats}`);
});
