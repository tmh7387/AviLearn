import { buildGallery, compileDeck } from '@/lib/stage';
import { SAMPLE_DECKS } from '@/lib/stage/samples';

/** GET /stage/gallery — every platform template, rendered from the sample decks. */
export async function GET() {
  const decks = Object.entries(SAMPLE_DECKS).map(([key, spec]) => ({ key, deck: compileDeck(spec) }));
  const html = buildGallery(decks, (key) => `/stage/deck/${key}`);
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
