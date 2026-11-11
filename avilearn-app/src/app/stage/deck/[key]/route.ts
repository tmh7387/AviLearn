import { NextRequest } from 'next/server';
import { compileDeck } from '@/lib/stage';
import { SAMPLE_DECKS } from '@/lib/stage/samples';

type Ctx = { params: Promise<{ key: string }> };

/** GET /stage/deck/<key> — a sample deck compiled to the presenter HTML. */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { key } = await params;
  const spec = SAMPLE_DECKS[key];
  if (!spec) return new Response('Unknown deck', { status: 404 });
  const { html, issues } = compileDeck(spec);
  if (!html) return Response.json({ issues }, { status: 422 });
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
