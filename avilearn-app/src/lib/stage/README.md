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
| `templates/` | 26 templates. Core templates work in every pack. A domain template (for example `flight-timeline`) works only in its industry pack. Each has a data schema, a build plan and a renderer. `opening.ts` holds the course opening and module start/end slides |
| `public/stage/kestrel/` | Kestrel Pacific 3D renders (light and dark PNG) and media kit images. Make new renders with `scripts/kestrel-render.py` |
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
| `npm run stage:check` | Opens every slide at 1920×1080 in light and dark, checks overflow, canvas bounds and the 22 px floor, saves screenshots. Needs `npx playwright install chromium` once |
| `npm run dev`, then `/stage/gallery` | The gallery in the app. `/stage/deck/sms` (or `crm`, `iosa`, `general`) presents a sample deck |

## Presenter keys

`Space` / `→` / `PageDown` / click: next step. `←` / `PageUp`: back. `Home` / `End`. `F` full screen. `D` light/dark. `N` speaker notes.
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
