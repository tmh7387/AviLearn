import { NextRequest } from 'next/server';
import { kickWorker } from '@/lib/factory/worker';

export const maxDuration = 300;

/**
 * Wake the worker (for a scheduler or cron). Requires header x-factory-key = FACTORY_WORK_KEY.
 * If FACTORY_WORK_KEY is not set, only non-production runs are allowed.
 */
export async function POST(req: NextRequest) {
  const key = process.env.FACTORY_WORK_KEY;
  if (key ? req.headers.get('x-factory-key') !== key : process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  return Response.json(await kickWorker());
}
