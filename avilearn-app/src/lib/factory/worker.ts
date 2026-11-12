import { drainQueue } from './runner';
import { FACTORY_STAGES } from './stages';
import { createSupabaseStore } from './supabase-store';

const STALE_MS = 15 * 60 * 1000;
let draining = false;

/** Process the queue in this process. A second call while running returns at once. */
export async function kickWorker(): Promise<{ started: boolean; processed?: number; failed?: number; recovered?: number }> {
  if (draining) return { started: false };
  draining = true;
  try {
    const store = createSupabaseStore();
    const recovered = await store.recoverStale(STALE_MS);
    const r = await drainQueue(FACTORY_STAGES, store, {
      requireReview: process.env.FACTORY_REQUIRE_REVIEW === '1',
    });
    return { started: true, recovered, ...r };
  } finally {
    draining = false;
  }
}
