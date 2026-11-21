/**
 * Video stage: export one module to MP4 (1080p, 30 fps, H.264, AAC) with
 * narration from the speaker notes and WebVTT captions.
 *
 *   Voice: ElevenLabs "george" (default) or "alice". Offline fallback: any Kokoro id
 *   (e.g. --voice bm_george), after: bash scripts/video/setup-tts.sh (once)
 *   npm run stage:video -- rbi-m2 [--voice george|alice|<kokoro id>] [--speed 1] [--out dir] [--slides m2-open,m2-sms] [--shadow 1024]
 *     -> ../env/tmp/video/<key>/<key>.mp4, <key>.vtt
 *
 * How it works. The compiled deck is the source: no second set of templates.
 * The script plays the deck in headless Chromium one step at a time, the same
 * order as a presenter pressing Space. Each step is one segment:
 *   - CSS motion (step builds, focus dim, branded sequences) is paused and
 *     stepped frame by frame through the Web Animations API, so every frame
 *     is exact whatever the machine speed.
 *   - Motion scenes (route opener, flight profile) are stepped through
 *     window.stScene(slide, ms), the same pure at(t) the slide plays live.
 *   - When the motion ends, one frame is held for the rest of the segment.
 * A segment lasts as long as its motion or its narration, whichever is longer.
 * Narration starts 0.4 s into the segment so the motion leads the voice.
 */
import { spawnSync } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { compileDeck } from '../../src/lib/stage';
import { COURSE_DECKS } from '../../src/lib/stage/courses';
import { SAMPLE_DECKS } from '../../src/lib/stage/samples';
import type { SlideDeckSpecInput } from '../../src/lib/stage/schema';

const FPS = 30;
const LEAD = 0.4; // narration starts this long after the step starts (s)
const TAIL = 0.7; // hold after the narration ends (s)
const MIN_STEP = 2.0; // shortest segment (s)
const MAX_MOTION = 6000; // cap for looping or very long CSS motion (ms)

const app = resolve(__dirname, '..', '..');
const args = process.argv.slice(2);
const opt = (name: string, def: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const key = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const decks: Record<string, SlideDeckSpecInput> = { ...SAMPLE_DECKS, ...COURSE_DECKS } as Record<string, SlideDeckSpecInput>;
if (!key || !decks[key]) {
  console.error(`Usage: npm run stage:video -- <deck key> [--voice george|alice|<kokoro id>] [--speed 1] [--out dir] [--slides id,id]\nDeck keys: ${Object.keys(decks).join(', ')}`);
  process.exit(2);
}
const voice = opt('voice', 'george');
const eleven = ['george', 'alice'].includes(voice); // ElevenLabs voices; anything else is a Kokoro voice id
const speed = opt('speed', '1');
const out = resolve(opt('out', join(app, '..', 'env', 'tmp', 'video', key)));
const ttsDir = resolve(opt('tts', join(app, '..', 'env', 'tmp', 'tts')));
const only = opt('slides', '');
if (!eleven && !existsSync(join(ttsDir, 'kokoro-q8.onnx'))) {
  console.error(`No narration model in ${ttsDir}. Run: bash scripts/video/setup-tts.sh`);
  process.exit(2);
}

/* ---------- 1. compile the deck (three.js from the local package, not the CDN) ---------- */
let spec = decks[key];
if (only) spec = { ...spec, slides: spec.slides.filter((s) => only.split(',').includes(s.id)) };
const deck = compileDeck(spec, { sceneLib: '/three' });
const errs = deck.issues.filter((i) => i.level === 'error');
if (errs.length) {
  for (const e of errs) console.error(`QA error ${e.slideId ?? '-'}: ${e.message}`);
  process.exit(1);
}
rmSync(join(out, 'frames'), { recursive: true, force: true });
mkdirSync(join(out, 'frames'), { recursive: true });
mkdirSync(join(out, 'voice'), { recursive: true });

/* ---------- 2. narration: one segment per step, from the speaker notes ---------- */
const segs = spec.slides.flatMap((s, i) =>
  s.steps.map((st, k) => ({ id: `s${String(i + 1).padStart(2, '0')}-${k + 1}`, slide: i, step: k + 1, text: (st.speakerNotes ?? '').trim() })),
);
writeFileSync(join(out, 'segments.json'), JSON.stringify(segs.filter((s) => s.text), null, 1));
console.log(`Narration: ${segs.length} steps, voice ${voice}`);
const tts = spawnSync('python3', [join(__dirname, 'tts.py'), 'speak', join(out, 'segments.json'), join(out, 'voice'), ttsDir, voice, speed], { stdio: 'inherit' });
if (tts.status) process.exit(1);
const timing: Record<string, { dur: number; cues: [number, number, string][] }> = JSON.parse(readFileSync(join(out, 'voice', 'timing.json'), 'utf8'));

/* ---------- 3. serve the deck, the stage assets and three.js ---------- */
const MIME: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const roots: [string, string][] = [
  ['/three/', join(app, 'node_modules', 'three') + '/'],
  ['/stage/', join(app, 'public', 'stage') + '/'],
];
const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  if (url === '/' || url === '/deck.html') {
    res.writeHead(200, { 'content-type': 'text/html' });
    return res.end(deck.html);
  }
  for (const [p, dir] of roots) {
    const file = join(dir, url.slice(p.length));
    if (url.startsWith(p) && file.startsWith(dir) && existsSync(file) && statSync(file).isFile()) {
      res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
      return createReadStream(file).pipe(res);
    }
  }
  res.writeHead(404).end();
});

type Shot = { file: string; dur: number };

async function main() {
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
  const port = (server.address() as { port: number }).port;
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => console.log('page error:', e.message));
  // Software rendering (no GPU here): a 4096 shadow map costs ~4 s a frame, 1024 costs ~0.5 s.
  await page.addInitScript((sm) => {
    (window as unknown as { stShadowMap: number }).stShadowMap = sm;
    try {
      localStorage.setItem('stage-theme', 'light');
      localStorage.setItem('stage-still', '0');
    } catch {}
  }, +opt('shadow', '1024'));
  await page.goto(`http://127.0.0.1:${port}/deck.html`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  // The deck starts the first scene live on load; stop it, frames come from stScene.
  await page.evaluate(() => document.querySelectorAll('.st-slide').forEach((s) => s.dispatchEvent(new Event('st:leave'))));
  // Presenter chrome off: the video shows the slide only.
  await page.addStyleTag({ content: '.st-hud,.st-notes,.st-pos{display:none!important}' });
  // Load every 3D model now, so no frame waits on the network.
  await page.evaluate(() => {
    const w = window as unknown as { stScene?: (s: Element, ms: number) => number };
    document.querySelectorAll('.st-slide').forEach((s) => w.stScene?.(s, 0));
  });
  await page.waitForTimeout(4000);

  const shots: Shot[] = [];
  const cues: { at: number; end: number; text: string }[] = [];
  const voices: { wav: string; at: number }[] = [];
  let clock = 0;
  let n = 0;
  const snap = async (dur: number) => {
    const file = join(out, 'frames', `f${String(n++).padStart(6, '0')}.jpg`);
    await page.screenshot({ path: file, type: 'jpeg', quality: 94 });
    shots.push({ file, dur });
  };

  for (const seg of segs) {
    // Advance exactly as the presenter does (the first segment is the opening state).
    const motion: number = await page.evaluate(
      ({ first, max }) => {
        if (!first) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
        document.body.getBoundingClientRect();
        const slide = [...document.querySelectorAll('.st-slide')].find((s) => !(s as HTMLElement).hidden)!;
        // Stop the live scene loop; frames come from stScene below.
        slide.dispatchEvent(new Event('st:leave'));
        const anims = document.getAnimations();
        anims.forEach((a) => a.pause());
        const ends = anims.map((a) => Number(a.effect?.getComputedTiming().endTime ?? 0)).filter((e) => isFinite(e));
        (window as unknown as { __anims: Animation[] }).__anims = anims;
        return Math.min(max, Math.max(0, ...ends));
      },
      { first: seg === segs[0], max: MAX_MOTION },
    );
    const scene: number = await page.evaluate(() => {
      const slide = [...document.querySelectorAll('.st-slide')].find((s) => !(s as HTMLElement).hidden)!;
      const w = window as unknown as { stScene?: (s: Element, ms: number) => number | null };
      return slide.querySelector('.st-ro,.st-fps') && w.stScene ? (w.stScene(slide, 0) ?? 0) : 0;
    });
    // Scenes play once, on the slide's first step.
    const sceneMs = seg.step === 1 ? scene : 0;
    const moveMs = Math.max(motion, sceneMs);
    const t = timing[seg.id];
    const speech = t ? LEAD + t.dur + TAIL : 0;
    const total = Math.max(MIN_STEP, moveMs / 1000 + 0.3, speech);

    const frames = Math.ceil((moveMs / 1000) * FPS);
    for (let f = 0; f <= frames; f++) {
      const ms = (f * 1000) / FPS;
      await page.evaluate(
        ({ ms, scene }) => {
          (window as unknown as { __anims: Animation[] }).__anims.forEach((a) => (a.currentTime = ms));
          if (scene) {
            const slide = [...document.querySelectorAll('.st-slide')].find((s) => !(s as HTMLElement).hidden)!;
            (window as unknown as { stScene: (s: Element, ms: number) => number }).stScene(slide, ms);
          }
        },
        { ms, scene: sceneMs > 0 },
      );
      await snap(f < frames ? 1 / FPS : Math.max(1 / FPS, total - frames / FPS));
    }
    if (t) {
      voices.push({ wav: join(out, 'voice', `${seg.id}.wav`), at: clock + LEAD });
      for (const [a, b, text] of t.cues) cues.push({ at: clock + LEAD + a, end: clock + LEAD + b, text });
    }
    clock += total;
    process.stdout.write(`\r${seg.id}  ${clock.toFixed(1)} s  ${n} frames   `);
  }
  console.log();
  await browser.close();
  server.close();

  /* ---------- 4. audio, captions, video ---------- */
  writeFileSync(join(out, 'voices.json'), JSON.stringify(voices));
  if (spawnSync('python3', [join(__dirname, 'tts.py'), 'mix', join(out, 'voices.json'), String(clock), join(out, 'narration.wav')], { stdio: 'inherit' }).status) process.exit(1);

  const ts = (s: number) => new Date(Math.max(0, s) * 1000).toISOString().slice(11, 23);
  writeFileSync(join(out, `${key}.vtt`), `WEBVTT\n\n${cues.map((c, i) => `${i + 1}\n${ts(c.at)} --> ${ts(c.end)}\n${c.text}\n`).join('\n')}`);

  const list = shots.map((s) => `file '${s.file}'\nduration ${s.dur.toFixed(5)}`).join('\n') + `\nfile '${shots[shots.length - 1].file}'\n`;
  writeFileSync(join(out, 'frames.txt'), list);
  const mp4 = join(out, `${key}.mp4`);
  const ff = spawnSync(
    'ffmpeg',
    ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', join(out, 'frames.txt'), '-i', join(out, 'narration.wav'), '-i', join(out, `${key}.vtt`),
      '-map', '0:v', '-map', '1:a', '-map', '2:s', '-vf', `fps=${FPS},format=yuv420p`, '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-tune', 'stillimage',
      '-c:a', 'aac', '-b:a', '160k', '-c:s', 'mov_text', '-metadata:s:s:0', 'language=eng', '-shortest', '-movflags', '+faststart', mp4],
    { stdio: 'inherit' },
  );
  if (ff.status) process.exit(1);
  rmSync(join(out, 'frames'), { recursive: true, force: true });
  console.log(`Wrote ${mp4} (${clock.toFixed(1)} s) and ${key}.vtt`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
