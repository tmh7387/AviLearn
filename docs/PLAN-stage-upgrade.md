# Plan: AviLearn Stage — platform-wide courseware upgrade

**Version:** 2.0 (replaces v1, saved as `docs/PLAN-stage-upgrade.v1.md`)
**Date:** 2026-11-11
**Owner:** Anthony M. Houston (CEO, Aviation Synergy Co., Ltd.)

**Related documents and code**

| Item | Location |
|---|---|
| Design spec (Nav Chart) | `docs/SPEC-stage-nav-chart.md` |
| Concept deck (click-through) | https://claude.ai/artifact/THQNPk5pUVjK6T7abwruKy |
| Factory handoff | `docs/HANDOFF-content-factory.md` |
| Engine app | `D:\App development\AviLearn\avilearn-app` (repo `tmh7387/AviLearn`, branch `feat/content-factory`) |
| **Portal app** | `D:\App development\avilearn-portal` (repo `tmh7387/avilearn-portal`) |
| **Portal workshop tools** | `D:\App development\avilearn-portal\components` (and `lib/` for each tool's data model) |
| Engine → Portal contract | `avilearn-portal/lib/publish.ts`, `avilearn-app/scripts/publish-to-portal.mjs` |

---

## 1. Objective

Upgrade AviLearn so that **every course** on the platform produces projector-ready, visual, step-through courseware and code-generated video, in one consistent style. The work builds platform templates, standards, and tools. It is not built around one course.

Two apps share the job:
- **AviLearn Engine** makes the course content that the instructor teaches. Course tools (for example the Fishbone) appear here as **teaching views**: projected, step by step, read-only.
- **AviLearn Portal** runs the workshops. Participants use the same tools **live**: they edit, submit, and export their team's work.

A tool must look and behave as the same tool in both apps.

---

## 2. Decisions (settled 2026-11-11)

| # | Decision |
|---|---|
| D1 | Courseware style is **Nav Chart**: chart paper, navy ink, Barlow Condensed / Barlow / JetBrains Mono. Full values in `SPEC-stage-nav-chart.md`. |
| D2 | **Brand teal is the only highlight colour** on slides. No red, amber, magenta, or violet. |
| D3 | **Light theme by default.** Dark (night chart) is a toggle. |
| D4 | Diagrams **build one part per click** (`Space` / `→`). Active part 100%, past parts **30%**, future parts hidden, full view on the last step. |
| D5 | Word budget: **20 words target, 30 hard limit** per slide at full view. Max 12 new words per step. Headline max 12 words. |
| D6 | Scope is the **whole platform**. Module 14 (RCA) was only the concept sample. |
| D7 | **Course tools stay in sync between Engine and Portal.** A tool built in one app gets its counterpart in the other. |
| D8 | First real test: a **fresh course** from the slides Anthony actually taught, converted end to end. |
| D9 | **The Engine never makes unbranded (IATA) content.** Engine output is only for Aviation Synergy courses on the AviLearn Portal, in the Nav Chart style. Unbranded IATA courses stay a Portal-only matter. |
| D10 | Shared course tools live in their **own repo**, `tmh7387/avilearn-course-tools`, used by both apps as a versioned git dependency. |

### What changed from v1

| v1 said | v2 says | Why |
|---|---|---|
| Dark avionics slate palette | Nav Chart light, dark toggle | D1, D3 |
| Teal, amber, red, green, blue accents | Teal only | D2 |
| Inter for all text | Barlow Condensed, Barlow, JetBrains Mono | D1 |
| Dim inactive steps to 18–25% | 30% | D4 |
| 2–5 steps per slide | 1–8 steps (Fishbone needs 8) | Concept test |
| ≤ 20 words hard ceiling | 20 target, 30 hard | D5 |
| Fishbone uses 6M (Man, Machine, Method…) | Categories come from the course content; the Portal already works this way | Portal `lib/cause-diagram.ts` |
| Bowtie with amber knot and red recovery barriers | Teal barriers, teal-tint knot | D2 |
| Strip all footers | Small footer with mark and page number | Section 4.4 |
| Brand modes | One brand (Nav Chart); no unbranded mode in the Engine | D9 |
| Diagram kit is Engine-only | Diagram kit = teaching views of shared course tools | D7 |

---

## 3. Learning rules (all courses)

1. **Assertion–evidence (Alley).** One full-sentence headline. One visual as the evidence.
2. **Coherence (Mayer).** No decoration. No text that the instructor will say.
3. **Signaling (Mayer).** Teal and full opacity mark the active part.
4. **Segmenting (Mayer).** Complex visuals build in steps.
5. **Redundancy (Mayer).** Prose goes to `speakerNotes`, not to the slide.
6. **Glance test (Duarte).** The point of a slide reads in about 3 seconds.
7. **Data-ink (Tufte).** Direct labels, no legends.

---

## 4. Architecture

### 4.1 Stage tokens and spec

- One source of truth: `avilearn-app/src/lib/stage/tokens.ts`, built from section 14 of the spec.
- All prompts, the compiler, the presenter, the simulation generator, and the video renderer read it.
- Remove hardcoded colours from `transform-router.ts`, `slide-designer.ts`, `sim-designer.ts`, and `image-generator.ts`.

### 4.2 Slide spec and compiler

Claude writes a validated JSON spec. Code renders it. Claude no longer writes HTML.

```ts
interface SlideDeckSpec {
  specVersion: string;            // e.g. "stage/1"
  programme: string;              // e.g. "sms-airlines"
  module: { code: string; title: string };
  lesson: { title: string; objectives: string[] };   // links to ObjectiveInput
  tone: 'standard' | 'sober';     // one brand only (D9), so no brand field
  defaultTheme: 'light' | 'dark';
  slides: SlideSpec[];
}

interface SlideSpec {
  id: string;
  templateId: TemplateId;         // see 4.3
  eyebrow?: string;
  assertion: string;              // ≤ 12 words
  data: unknown;                  // validated per templateId (Zod)
  steps: { speakerNotes: string; lowerThird?: string }[];
  sourceRefs: { file: string; slide?: number; page?: number }[];   // for SME review
  assets?: { id: string; url: string; alt: string }[];             // Storage URLs, no base64
}
```

- Compiler: `compileDeck(spec): { html, assets }`. Output is one small HTML file plus asset URLs.
- Presenter runtime (in the HTML): step engine, keys (`Space`, `→`, `←`, `PageUp`, `PageDown`, `F`, `D`, `N`), notes panel, works with presentation clickers.
- Store the spec JSON and the compiled HTML. Slide Studio edits the spec, then recompiles.
- Images: upload to Supabase Storage at `scorm-packages/assets/<moduleId>/<jobId>/<imageId>.<ext>`. This removes the 4.8 MB base64 problem.

### 4.3 Template library (course-agnostic)

Each template has a Zod schema, a default step plan, and sample data from **at least 2 different courses**, to prove it is not tied to one course.

| Group | `templateId` |
|---|---|
| Structure | `title-bumper`, `section-divider`, `agenda`, `objectives`, `summary`, `questions` |
| Evidence | `assertion-image`, `annotated-image`, `hero-number`, `split-contrast`, `quote-reference` (ICAO / IOSA / regulation excerpt) |
| Process | `procedure-flow`, `checklist`, `timeline`, `phase-of-flight`, `cause-chain` |
| Analysis tools (shared with Portal, see 4.5) | `fishbone` (cause diagram), `five-why`, `swiss-cheese`, `bowtie`, `risk-matrix`, `flight-profile`, `card-sort` |
| Interaction | `knowledge-check`, `exercise-launch` (tells the room to open a Portal tool, with the exercise name and a QR code) |

### 4.4 Brand and tone

**Brand.** The Engine has one brand: Nav Chart, for Aviation Synergy courses on the AviLearn Portal (D9). The Engine has no unbranded mode.
- Engine content maps to Portal programmes with `CourseTheme.AVIATION_SYNERGY`.
- The publish step refuses a target programme with `CourseTheme.UNBRANDED`. Unbranded IATA courses are made and run in the Portal only.
- The footer and bumpers carry the mark shown in the spec.

**Tone.** The Portal "tone rule" applies to Engine content too.

| Tone | Portal source | Engine behaviour |
|---|---|---|
| `standard` | default | Full Nav Chart: compass rose, bumpers, step motion |
| `sober` | `sober` flag in `lib/cause-diagram.ts` | For workshops about a real accident: no compass rose, no bumper motion, plain diagram heads |

### 4.5 Course tools: one model, two views (NEW)

**Roles**

| | Engine | Portal |
|---|---|---|
| Purpose | Teach the tool | Use the tool |
| View | Teaching view: projected, step builds, Nav Chart tokens, read-only | Live view: editor, team data, save, PNG export, Portal skin |
| Data | Worked example in the slide spec | Team answer in `TeamExerciseResponse.payload` |

**Current Portal tools** (`D:\App development\avilearn-portal\components`)

| Portal section type | Components | Data model | Engine teaching view |
|---|---|---|---|
| `CAUSE_DIAGRAM` | `cause-diagram/*` | `lib/cause-diagram.ts` (categories from content, `sober` mode) | `fishbone` — build first |
| `FISHBONE` (IOSA) | `fishbone-*.tsx` | `lib/iosa/fishbone.ts` | Use `fishbone`; Portal keeps the IOSA copy as is |
| `FLIGHT_PROFILE` | `flight-profile/*` | in component | `flight-profile` |
| `CARD_SORT` | `card-sort-board.tsx` | `lib/card-sort.ts` | `card-sort` |
| `RISK_PROFILE` | `risk-assessment-*`, `forms/*` | Prisma HIRA models | `risk-matrix` |
| `SCORE_CARD` | `notechs-score-card.tsx` | `lib/crm/notechs.ts` | `checklist` or a NOTECHS view (later) |
| `CHECK_LIST`, `ROW_TABLE`, `QUESTION_SET`, `DEBRIEF_SIM`, `ROTATED_BOARD` | various | various | `checklist`, `knowledge-check`, later |
| — (Engine only today) | — | — | `five-why`, `swiss-cheese`, `bowtie` need Portal live versions |

**Sync rules**

1. **One data model per tool.** The model (types, Zod schema, defaults, limits such as `MAX_CAUSE_LEVELS`) lives in one shared package, `avilearn-course-tools`.
2. **Share data and layout maths, not React components.** The Portal is Next 14 / React 18 / Tailwind. The Engine is Next 16 / React 19 / no Tailwind. Pure TypeScript works in both. Each app draws its own view.
3. **Tool registry.** Each tool has an entry: `toolId`, `version`, Portal section type, Engine `templateId`, schema, teaching-view step plan, live-view status.
4. **No one-sided tools.** A tool counts as done only when it has a teaching view in the Engine and a live view in the Portal (or a written reason why not).
5. **Version check at publish.** Extend `lib/publish.ts` so the Portal refuses a tool version it does not implement. This follows the existing rule: "a new kind is a portal release, not new content."
6. **Worked example → exercise.** The Engine's teaching data (for example the categories on a Fishbone slide) can seed the Portal exercise config, because both use the same schema.
7. **Respect Portal decisions.** Do not change the Portal handover's "deliberate decisions" (for example: no reactive/proactive/predictive labels, IOSA fishbone unchanged, diagram canvases stay white for PNG export).

**Where the package lives (decided, D10)**
- Repo `tmh7387/avilearn-course-tools`. Both apps install it as a git dependency pinned to a version tag.
- Contents: types, Zod schemas, defaults, limits, layout maths, tool registry, sample data. No React, no CSS.
- Each change gets a new tag. Each app moves to the new tag in its own pull request, with its own checks.

### 4.6 Motion

- Step change 450 ms, line draw 600 ms, slide change 300 ms, ease `cubic-bezier(.2,.7,.2,1)`.
- Intro and outro bumpers (3 s / 2 s) per brand mode. None in `sober` tone.
- No bounce, spring, parallax, or looping motion. Respect `prefers-reduced-motion`.

### 4.7 QA gate (factory `qa` stage)

Runs between `routing` and `saving`. A slide fails when:
1. Words exceed D5 limits. A compression pass moves extra text to `speakerNotes`, then the check runs again.
2. A colour, font, or size is outside the tokens.
3. A step has no `speakerNotes`.
4. A number, speed, altitude, weight, date, or ICAO / IOSA / regulation reference differs from the source. These go to `job.smeFlags` for an SME (subject matter expert) to check.
5. A rendered 1920×1080 screenshot shows overflow or clipped text (Playwright check).
6. An image has no alt text, or an SVG has no `aria-label`.

### 4.8 Video

- Same spec and same teaching views render to MP4 (1920×1080, 30 fps, H.264, AAC −16 LUFS) with WebVTT captions.
- Two modes: silent classroom loop, and narrated self-paced video (TTS from `speakerNotes`, step length = clip length + 0.6 s).
- Upload MP4 and VTT to Supabase Storage. Package in SCORM / cmi5.
- Engine choice is open: **Remotion** (needs a paid company licence for companies with more than 3 people) or **HyperFrames** (Apache 2.0, HTML-based). The diagram views must be plain SVG so either engine can use them.

---

## 5. Platform features (added in v2)

| Area | Feature |
|---|---|
| Authoring | Slide Studio edits spec fields (headline, labels, steps, notes) with live preview. Chat edits change the JSON, not the HTML. |
| Authoring | Template gallery page: every template, light and dark, standard and sober tone, sample data from several courses. It is also the visual test page. |
| Presenting | Presenter view: current step, next step preview, notes, timer, clicker support. |
| Presenting | Offline deck: one HTML file with self-hosted fonts. It runs with no network in a classroom. |
| Review | Review queue and approve gate before packaging (handoff Phase 2 item 6). SME flags show on each slide with the source slide beside it. |
| Review | Version history per lesson (route `api/lessons/[lessonId]/versions` exists). |
| Output | SCORM 1.2 / cmi5 package with the step runtime. xAPI statement per step viewed. |
| Output | PDF handout: full-view slides plus speaker notes. |
| Content | Objective link: each slide maps to a lesson objective (uses `ObjectiveInput`). |
| Content | Image style rule for generated images: line illustration in ink and teal only, no text in the image. |
| Factory | Write lessons 3 at a time; cost per job from token use (handoff Phase 2 items 1 and 4). |
| Factory | Source traceability: every slide keeps `sourceRefs`. |
| Portal link | `exercise-launch` slide plus publish of the matching Portal exercise config. |
| Later | Localisation (text grows 20–35% in some languages; the word budget applies to the target language). |

---

## 6. Phases

Each phase ends with a check that a person can run.

| Phase | Scope | Done when |
|---|---|---|
| **0. Repo hygiene** | Switch `D:\App development\AviLearn` to `feat/content-factory` (the folder is on `main` now, and `src/lib/factory/` is missing there). Commit `docs/`. Create the empty `tmh7387/avilearn-course-tools` repo. | `npm run test:factory` passes on the branch. `docs/` is committed. The tools repo exists. |
| **1. Stage foundation (platform)** | `stage/tokens.ts`, `stage/schema.ts` for all templates in 4.3 except analysis tools, compiler, presenter runtime, standard and sober tone, template gallery, screenshot tests at 1920×1080. | The gallery renders every template in light and dark, standard and sober, with sample data from 3 different courses (for example SMS, CRM, IOSA). All screenshot tests pass. |
| **2. Course tools, shared model** | Create `avilearn-course-tools`. Move the cause-diagram model in first. Build the Engine `fishbone` teaching view on it. Point the Portal `CAUSE_DIAGRAM` at the shared model with no visible change. Add the tool registry and the publish version check. Then `five-why`, `swiss-cheese`, `bowtie`, `risk-matrix`, `flight-profile`, `card-sort`. | For each tool: Engine teaching view and Portal live view read the same schema. The Portal looks and works as before. |
| **3. Factory integration** | Router outputs `SlideDeckSpec` (3 lessons at a time). `qa` stage. Image extraction to Storage. Review queue and approve gate. Slide Studio on spec fields. | A test PPTX gives a deck with no QA failures, or with failures listed in the review queue. |
| **4. Fresh course conversion** | Anthony's taught slides, full course, end to end. Publish to the Portal only after Anthony approves (do not run `npm run publish:portal` without his word; use `--dry-run` first). | Anthony signs off the converted course. |
| **5. Video** | Choose Remotion or HyperFrames. TTS provider. WebVTT. Replace the stock clip. Send empty simulation lessons to `sim-designer.ts`. | One narrated lesson MP4 with captions plays in the SCORM package. |

---

## 7. Open decisions

| # | Question | Options | Recommendation |
|---|---|---|---|
| ~~O1~~ | Where does `avilearn-course-tools` live? | Decided: own repo (D10) | — |
| ~~O2~~ | Unbranded (IATA) courses | Decided: never in the Engine (D9) | — |
| O3 | Portal has two fishbones (`FISHBONE` IOSA and `CAUSE_DIAGRAM`) | Keep both, or move IOSA onto `CAUSE_DIAGRAM` later | Keep both now; revisit after Phase 2 |
| O4 | Video engine | Remotion (licence cost) or HyperFrames | Decide at Phase 5 after the licence check |
| O5 | TTS provider | to be chosen | Decide at Phase 5 |

---

## 8. Rules (carry forward)

- Do not run `npm run publish:portal` unless Anthony asks. Use `--dry-run` first. Never `--all` without `--dry-run`.
- Never print or commit `.env.local` values.
- Do not delete real courses in the LEP_2026 database.
- In the Portal, follow `HANDOVER.md` and the "deliberate decisions" in it. Do not change the IOSA fishbone.
- Flag any doubt on aviation safety content for SME review.
- Report in short, plain sentences. Give 2 options at most for a decision, with a recommendation.
