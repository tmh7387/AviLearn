# AviLearn Stage

Projected courseware for any training brand and industry. Nav Chart is the first theme pack.
How to add a brand or an industry: `docs/STUDIO-packs.md`.
Spec: `docs/SPEC-stage-nav-chart.md`. Voice and course structure: `docs/VOICE-avilearn.md`. Plan: `docs/PLAN-stage-upgrade.md` (Phase 1).

## How it works

1. Claude (later, the factory) writes a `SlideDeckSpec` JSON (`schema.ts`).
2. `compileDeck(spec)` validates it, renders each slide from a template, runs the QA checks (schema, steps, words, colours, voice) and returns one self-contained HTML deck.
3. The deck runs the presenter: one part per click, active 100%, past 30%, full view last.

No AI writes HTML, CSS or SVG. Templates draw everything from `tokens.ts`.

## Files

| File | Job |
|---|---|
| `tokens.ts` | Sizes, word limits, step opacities, motion, video format. Contrast helpers |
| `packs/themes.ts` | Theme packs (brand): colours, fonts, heading case, display scale, org and product names. `nav-chart` (default) and `studio-neutral` (test) |
| `packs/verticals.ts` | Industry packs: the domain templates each industry owns, plus extra voice rules. `aviation` (default) and `general` |
| `schema.ts` | Deck and slide spec (Zod) |
| `templates/` | 34 templates. Core templates work in every pack. A domain template (for example `phase-of-flight`) works only in its industry pack. Each has a data schema, a build plan and a renderer. `opening.ts` holds the course opening and module start/end slides |
| `public/stage/kestrel/` | Kestrel Pacific 3D renders (light and dark PNG) and media kit images. Make new renders with `scripts/kestrel-render.py` |
| `motion.ts` | Motion system: verbs (reveal, draw, grow, count, pin), stagger rule, motion QA plan. Timings live in `tokens.ts` (`STAGE.motion`) |
| `voice.ts` | Banned phrases. The compiler rejects them |
| `compiler.ts` | `compileDeck`, `renderSlide`, QA issues (schema, steps, words, colours, voice) |
| `styles.ts`, `runtime.ts` | Slide CSS and the presenter script inlined into each deck |
| `gallery.ts` | Review page with every sample slide and its QA result |
| `samples/` | Sample decks: SMS, CRM, IOSA (Nav Chart, aviation) and `general` (Studio Neutral, SAMPLE text only) |

Analysis tools shared with the Portal (fishbone, five-why, swiss-cheese, bowtie, risk-matrix, flight-profile, card-sort) come in Phase 2 from `tmh7387/avilearn-course-tools`.

## Commands (run in `avilearn-app/`)

| Command | What it does |
|---|---|
| `npm run test:stage` | Unit tests: contrast, QA rules, template coverage |
| `npm run stage:build` | Writes `../env/tmp/stage/{gallery,sms,crm,iosa,general}.html`. Fails on a QA error |
| `npm run stage:video -- rbi-m2` | Exports one module to `../env/tmp/video/<key>/<key>.mp4` (1080p, 30 fps, H.264, AAC) and `<key>.vtt`. Narration comes from the speaker notes. See Video below |
| `npm run stage:package -- rbi-m2 [--format scorm12\|web]` | Packages one module as a self-study course: `../env/tmp/package/<key>/<key>-<format>.zip`. See Self-study below |
| `npm run stage:check` | Opens every slide at 1920×1080 in light and dark, checks overflow, canvas bounds and the 22 px floor, saves screenshots. Needs `npx playwright install chromium` once |
| `npm run dev`, then `/stage/gallery` | The gallery in the app. `/stage/deck/sms` (or `crm`, `iosa`, `general`) presents a sample deck |

## Presenter keys

`Space` / `→` / `PageDown` / click: next step. `←` / `PageUp`: back. `Home` / `End`. `F` full screen. `D` light/dark. `N` speaker notes. `M` motion on or off.
The address keeps the place as `#<slide>-<step>`.

## Adding a template

1. Add the id to `TEMPLATE_IDS` in `schema.ts`.
2. Write it in `templates/` with `defineTemplate`: data schema, `parts`, `fullView`, `render`. Use `s(step)` on elements and `ctx.log.t(step, text)` for every visible word.
3. Use token variables only (`var(--s-…)`). The colour audit fails any other colour.
4. Core template: add sample slides to at least 2 sample courses. Domain template: add its id to the industry pack's `templates` list and use it in 1 sample course. The coverage test enforces this.
5. Never write brand text (org, product, portal names) into a template. Read it from `ctx.theme`.

## Deck fields for brand and industry

```json
{ "theme": "nav-chart", "vertical": "aviation" }
```

Both default to the values above. An unknown pack is a QA error. `defaultTheme` (light or dark) is optional; it falls back to the pack's `defaultMode`.

## Motion (phase B)

- Every part enters in 600 ms on one easing curve. Past parts dim to 30% in 300 ms. Parts that enter on one step start 120 ms apart; the presenter shortens the gap so a step ends inside 1200 ms.
- A template gives a part its verb with `ctx.motion.m(step, verb)`: `reveal`, `draw` (SVG needs `pathLength="1"`), `draw-v`, `grow`, `grow-x`, `count`, `pin`. Parts with no verb reveal.
- Motion scenes (`templates/scene.ts`): `route-opener` (aviation pack) is a module opener played as a flight. A live 3D glTF aircraft (asset `kind: 'model'`, nose along +X) flies in, turns onto the course and crosses one waypoint per objective. Each objective lights when the nose crosses its waypoint, and each leg lasts as long as reading that objective takes (`pace`, words per second, default 2.5). The markup is the end state, so the slide reads without JavaScript or WebGL. three.js loads on first play from a pinned jsDelivr copy; pass `compileDeck(spec, { sceneLib })` to use a local copy (offline SCORM). Frame capture for video: `window.stScene(slideElement, ms)` sets an exact frame. Motion off (M key) shows the end state.
- `flight-profile-scene` (aviation pack) is the motion version of `phase-of-flight`. A side-view aircraft (asset with gear objects named `GEAR_*`) flies gate to gate, and each phase value shows as the nose enters that phase, paced to reading time. The latent band shows after parking. Attitude is a real pitch, not the line's angle.
- `fishbone-build` (core, `templates/fishbone.ts`) builds a fishbone one category per click, then fills the systemic causes. It reads the Portal fishbone data shape (problem, categories, causes, `isSystemic`).
- Branded sequences: `course-title` plays the intro (3 s), `module-opener`, `title-bumper` and `section-divider` the bumper (1.5 s), `day-close` the outro (2 s). A slide's `lowerThird: { name, role }` shows a name bar for 5 s.
- Motion QA (`code: 'motion'`) fails a step whose parts cannot enter inside 1200 ms. Split the step.
- The system setting "reduce motion" and the `M` key switch motion off.

## Video (phase D)

`scripts/video/stage-video.ts` turns a compiled deck into an MP4. The deck is the only source, so every template, theme and motion scene works in video with no second renderer.

- Order: one segment per step, the same order as a presenter pressing Space.
- Motion: CSS motion is paused and stepped frame by frame (Web Animations API). Motion scenes are stepped with `window.stScene`. When the motion ends, one frame is held, so a held slide costs one frame.
- Length: a segment lasts as long as its motion or its narration, whichever is longer. The voice starts 0.4 s after the step starts.
- Two kinds of notes per step. `speakerNotes` is the content: always narrated. `facilitatorNotes` holds room instructions for a live session ("refer to your workbook", "you have 40 minutes"): the presenter sees them under Notes (N), and the video leaves them out unless you pass `--facilitator`. A step needs at least one of the two.
- Narration: `scripts/video/tts.py`. Default engine ElevenLabs (`eleven_v4`). Voices: `george` (default, British male) and `alice` (alternate, British female): `--voice alice`. `--speed 1.1` (0.7 to 1.2). Needs `ELEVENLABS_API_KEY`, or a cloud environment secret for `api.elevenlabs.io`. Audio is cached in `<out>/voice-cache` by text, voice and speed, so a re-export spends no characters on unchanged notes.
- Offline fallback: Kokoro-82M (Apache-2.0). Run `bash scripts/video/setup-tts.sh` once, then pass a Kokoro voice id, e.g. `--voice bm_george`. Acronyms are spelled for Kokoro in `tts.py` (`SAY`).
- Captions: one WebVTT cue per spoken sentence, timed from the audio. Also inside the MP4 as a soft subtitle track.
- Software rendering: the 3D shadow map drops to 1024 px for capture (`--shadow`), because a 4096 map takes about 4 s a frame without a GPU.

## Self-study (interactive player and export)

- `compileDeck(spec, { mode: 'self-study', audio })` builds the learner player from the same deck. Each slide has `delivery`: `both` (default), `live` (classroom only: workshops, breaks) or `self-study` (player only, e.g. a scored check that replaces a group task). The video export also uses the self-study set (`--mode live` for the classroom set).
- The player: Start, then the narration plays each step and moves on (P = pause). Space or click also moves on. A `knowledge-check` waits for an answer, marks it right or wrong, shows the answer, then plays the explanation (step 2). A progress bar and the score show in the player.
- Events on `document`: `st:progress` {slide, step, id, at, total}, `st:answer` {id, choice, correct, answer}, `st:complete` {score, max}. `window.stGo(slide, step)` jumps (resume).
- `scripts/package/stage-package.ts` makes the narration (ElevenLabs, cached with the video), MP3 per step, copies the used assets and three.js, and zips. `scorm12`: adds `imsmanifest.xml` and `scorm12.js` (completion, score as percent of checks right, pass mark 80%, bookmark in `cmi.core.lesson_location`, answers in `cmi.suspend_data`). `web`: the same folder for the Portal or any web server. xAPI is next.
- Fonts load from Google Fonts; everything else is in the package.

