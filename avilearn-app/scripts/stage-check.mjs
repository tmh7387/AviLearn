/**
 * Screenshot check for the stage sample decks at 1920 x 1080.
 *   npm run stage:build && npm run stage:check
 *
 * For every slide, in light and dark, at the full-view step it checks that:
 *   - no text sits outside the 1920 x 1080 canvas,
 *   - the content area does not overflow (clipped text),
 *   - no visible text is smaller than the 22 px floor.
 * Screenshots go to ../env/tmp/stage/shots. Exit code 1 on any failure.
 * Needs a Chromium for Playwright (npx playwright install chromium).
 */
import { mkdirSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const dir = resolve(here, '..', '..', 'env', 'tmp', 'stage');
const shots = join(dir, 'shots');
mkdirSync(shots, { recursive: true });
const decks = readdirSync(dir).filter((f) => f.endsWith('.html') && f !== 'gallery.html');
const FLOOR = 22;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
let failures = 0;
let checked = 0;

for (const file of decks) {
  const url = pathToFileURL(join(dir, file)).href;
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  const meta = await page.evaluate(() => JSON.parse(document.getElementById('st-meta').textContent));
  for (const theme of ['light', 'dark']) {
    for (let i = 0; i < meta.steps.length; i++) {
      await page.goto(`${url}#${i + 1}-${meta.steps[i]}`);
      await page.reload();
      await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
      await page.waitForTimeout(600);
      const problems = await page.evaluate((floor) => {
        const out = [];
        const slide = [...document.querySelectorAll('.st-slide')].find((s) => !s.hidden);
        const box = slide.getBoundingClientRect();
        const k = box.width / 1920;
        // Panels marked data-bleed run to the slide edge on purpose; leave them out of the overflow check.
        const bleed = [...slide.querySelectorAll('[data-bleed]')];
        bleed.forEach((b) => (b.style.display = 'none'));
        for (const el of slide.querySelectorAll('.st-in, .st-body')) {
          if (el.scrollHeight > el.clientHeight + 2) out.push(`content overflows ${el.className} by ${el.scrollHeight - el.clientHeight}px`);
        }
        bleed.forEach((b) => (b.style.display = ''));
        const walker = document.createTreeWalker(slide, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          if (!node.textContent.trim()) continue;
          const el = node.parentElement;
          if (el.closest('svg')) continue;
          const cs = getComputedStyle(el);
          const size = parseFloat(cs.fontSize);
          if (size < floor) out.push(`text "${node.textContent.trim().slice(0, 30)}" is ${size}px`);
          const r = el.getBoundingClientRect();
          const l = (r.left - box.left) / k, t = (r.top - box.top) / k, rr = (r.right - box.left) / k, b = (r.bottom - box.top) / k;
          if (l < -1 || t < -1 || rr > 1921 || b > 1081) out.push(`text "${node.textContent.trim().slice(0, 30)}" leaves the canvas`);
          if (el.scrollWidth > el.clientWidth + 2 && cs.overflow !== 'visible') out.push(`text "${node.textContent.trim().slice(0, 30)}" is clipped`);
        }
        return out;
      }, FLOOR);
      checked++;
      const name = `${file.replace('.html', '')}-${String(i + 1).padStart(2, '0')}-${theme}.png`;
      await page.screenshot({ path: join(shots, name) });
      if (problems.length) {
        failures++;
        console.log(`FAIL ${name}\n  - ${problems.join('\n  - ')}`);
      }
    }
  }
}
await browser.close();
console.log(`${checked} slide views checked, ${failures} failed. Screenshots in ${shots}`);
process.exit(failures ? 1 : 0);
