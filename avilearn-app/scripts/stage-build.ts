/**
 * Build the stage gallery and sample decks as static files.
 *   npm run stage:build      -> ../env/tmp/stage/{gallery,sms,crm,iosa}.html
 * Exits with code 1 when any sample deck has a QA error.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildGallery, compileDeck } from '../src/lib/stage';
import { SAMPLE_DECKS } from '../src/lib/stage/samples';

const publicDir = resolve(__dirname, '..', 'public');
const MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml', webp: 'image/webp' };

/** Standalone files have no web server, so embed /stage/... images as data URIs. */
function inlineImages(html: string): string {
  return html.replace(/(src|href)="(\/stage\/[^"]+)"/g, (m, attr: string, url: string) => {
    const file = join(publicDir, url);
    const mime = MIME[url.split('.').pop()!.toLowerCase()];
    if (!mime || !existsSync(file)) return m;
    return `${attr}="data:${mime};base64,${readFileSync(file).toString('base64')}"`;
  });
}

const out = resolve(__dirname, '..', '..', 'env', 'tmp', 'stage');
mkdirSync(out, { recursive: true });

const decks = Object.entries(SAMPLE_DECKS).map(([key, spec]) => ({ key, deck: compileDeck(spec) }));
let errors = 0;
for (const { key, deck } of decks) {
  writeFileSync(join(out, `${key}.html`), inlineImages(deck.html));
  for (const i of deck.issues) {
    if (i.level === 'error') errors++;
    console.log(`${i.level.padEnd(5)} ${key}/${i.slideId ?? '-'}: ${i.message}`);
  }
}
writeFileSync(join(out, 'gallery.html'), inlineImages(buildGallery(decks, (key) => `${key}.html`)));
console.log(`Wrote ${decks.length} decks and gallery.html to ${out}`);
if (errors) {
  console.error(`${errors} QA error(s).`);
  process.exit(1);
}
