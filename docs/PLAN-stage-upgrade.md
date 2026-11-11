# Plan: AviLearn Stage — Projector-Ready & Code-Generated Courseware Upgrade

**Date:** 2026-11-11  
**Owner:** Anthony M. Houston (CEO, Aviation Synergy Co., Ltd.)  
**Reference Concept File:** [`docs/stage_concept_gallery.html`](stage_concept_gallery.html)  
**Related Handoff:** [`docs/HANDOFF-content-factory.md`](HANDOFF-content-factory.md)

---

## 1. Objective & Pedagogical Foundation

Upgrade the AviLearn Content Factory from generating freeform, text-heavy HTML slides to producing **projector-ready, visually driven, animated courseware and code-generated MP4 videos** with 100% brand consistency.

### Governing Learning & Design Rules
1. **Assertion–Evidence Model (Michael Alley, Penn State):** Every content slide consists of **one short full-sentence assertion headline** at the top and **visual evidence** filling 85–90% of the canvas. Zero bullet-point walls.
2. **Multimedia Learning Principles (Richard Mayer & Ruth Clark):**
   - **Coherence:** Strip all extraneous headers, footers, metadata badges, and decorative chrome from the projected canvas.
   - **Signaling:** Spotlight the active diagram node/layer at `100%` opacity while dimming inactive steps to `18–25%`.
   - **Redundancy:** Never print paragraphs on screen that the instructor or narrator says aloud. Move all prose into `speakerNotes` (for live instructors and Text-to-Speech).
   - **Segmenting:** Break complex diagrams into 2–5 progressive click/time steps.
3. **3-Second Glance Test (Nancy Duarte & Garr Reynolds):** A learner or pilot in a classroom must grasp the slide's point within 3 seconds. Hard ceiling: **≤ 20 words total on screen**.
4. **High Data-Ink Ratio (Edward Tufte):** Use direct 1–2 word labels on graphics instead of legends or multi-line text boxes.

---

## 2. The 5-Part Architecture Plan

### Part 1: `AviLearn Stage` Spec & Single Token Source
Create a single TypeScript source of truth (`avilearn-app/src/lib/stage/tokens.ts`) imported by all AI prompts, HTML slide compilers, interactive simulations, and video renderers.

- **Canvas:** Fixed `1920×1080` (`16:9`) coordinate space that scales cleanly via CSS `transform: scale()` to fit any screen or classroom projector without layout reflow.
- **Typography Floor:**
  - Hero Numbers / Stats: `96px–168px` (`JetBrains Mono`)
  - Course / Module Titles: `68px–96px` (`Inter` ExtraBold)
  - Slide Assertion Headline: `44px–54px` (`Inter` Bold)
  - Diagram Labels: `≥ 32px` minimum (`Inter` SemiBold/Bold)
- **Word Budget:**
  - `maxWordsPerSlide`: **20 words** hard ceiling across the entire slide.
  - `maxAssertionWords`: **12 words** maximum for the top sentence.
  - `maxLabelWords`: **1–3 words** per diagram node.
- **Unified Color Palette (Dark Avionics Slate — No Purple/Violet):**
  - Canvas: `#14171f` | Surface: `#1c1f2a` | Border: `#2c3142` / `#3a4055`
  - Text Primary: `#e6e9f2` | Secondary: `#a4a9bd`
  - Semantic Accents: Brand Teal (`#2dd4bf`), Caution Amber (`#f59e0b`), Hazard Red (`#ef4444`), Safe Green (`#22c55e`), Telemetry Blue (`#3b82f6`).
- **Refactor:** Remove hardcoded hex strings from `transform-router.ts`, `slide-designer.ts`, and `sim-designer.ts` so all three read from `STAGE_TOKENS`.

---

### Part 2: JSON Slide Spec + Deterministic Template Compiler
Stop having Claude write raw HTML/CSS/JS from scratch for every lesson. Instead, separate **AI Content Distillation** from **Code Rendering**.

1. **Image Extraction to Supabase Storage (Fixes the 4.8 MB HTML Bloat):**
   - During the Factory `intake` / `routing` stage, upload extracted PPTX images to Supabase Storage (`scorm-packages` bucket under `assets/<moduleId>/<jobId>/<imageId>.png`) and reference them by URL instead of embedding multi-megabyte base64 strings inside HTML/JSON.
2. **Structured JSON Slide Spec (`SlideDeckSpec`):**
   - Claude distills raw slide text into a strict Zod-validated JSON schema:
     ```ts
     interface SlideSpec {
       id: string;
       templateId:
         | 'title-bumper'
         | 'swiss-cheese'
         | 'five-why'
         | 'fishbone'
         | 'bowtie'
         | 'flight-timeline'
         | 'split-contrast'
         | 'procedure-flow'
         | 'annotated-image';
       assertion: string; // <= 12 words
       diagramData: Record<string, unknown>; // Typed per templateId
       steps: Array<{
         focusIndex: number;
         speakerNotes: string; // Full narration for instructor / TTS
         lowerThird?: { tag: string; text: string; tone: 'teal' | 'amber' | 'red' };
       }>;
     }
     ```
3. **Deterministic HTML5 Compiler (`compileDeckToHtml(spec: SlideDeckSpec)`):**
   - Pure TypeScript code compiles `SlideDeckSpec` into a lightweight (~25 KB), self-contained HTML5 presentation with keyboard navigation (`Space`, `←`, `→`), Speaker Notes toggle (`N`), and progressive step states.
   - Store both the `SlideDeckSpec` JSON artifact and the compiled `.html` file so **Slide Studio** can edit structured fields cleanly and re-compile in milliseconds.

---

### Part 3: Aviation Diagram Kit (Parameterized SVG Components)
Build a library of reusable, data-driven SVG visual components (`avilearn-app/src/lib/stage/diagrams/`) where Claude only supplies the data parameters and never draws raw geometry from scratch:

| Component ID | Visual Geometry | Parameters Supplied by AI |
| :--- | :--- | :--- |
| `swiss-cheese` | 3D isometric barrier slabs with aligned holes + animated hazard laser beam | 3–4 barrier labels (1–2 words each), active breach index |
| `five-why` | Stepped Bezier causal cascade from symptom to systemic root cause | 5 short node labels (2–3 words each) + tone |
| `fishbone` | Classic Ishikawa diagram (Man, Machine, Method, Material, Environment, Measurement) | Problem head label + 1–2 short causes per bone |
| `bowtie` | Left preventive wing (Teal barriers) → Center Top-Event Knot (Amber) → Right recovery wing (Red barriers) | Prevention labels, Top Event label, Recovery labels |
| `flight-timeline` | Approach glidepath / runway profile or horizontal telemetry timeline with event pins | 3–5 time/altitude pins + metric callouts |
| `split-contrast` | Two giant hero metrics or side-by-side visual contrast | Left/Right metric (`-68%` vs `+340%`) + 2-word labels |
| `procedure-flow` | Connected horizontal/vertical sequence nodes with active step spotlight | 3–5 sequential action verbs |

---

### Part 4: Brand Motion System & Automated QA Gate

1. **Brand Motion Choreography:**
   - **Standard Timing:** `600ms` duration with `cubic-bezier(0.22, 1, 0.36, 1)` easing across all step transitions.
   - **Progressive Spotlight:** Advancing a step highlights the current visual element (`opacity: 1.0`, active stroke glow) and dims non-active elements (`opacity: 0.18`).
   - **Branded Intro/Outro Bumpers:** Standardized animated vector emblem card at the start and end of every module deck.
   - **Optional Broadcast Lower-Thirds:** Toggleable overlay banner for video exports or instructor callouts (kept off the static slide canvas by default to preserve zero clutter).
2. **Automated Visual & Safety QA Stage (`qa` stage in Factory):**
   - Runs automatically between `routing` and `saving`:
     - **Word Count Gate:** Counts all visible words in `assertion` + `diagramData` labels. If `> 20 words`, automatically triggers a fast LLM compression pass to trim labels and move excess text into `speakerNotes`.
     - **Contrast & Font Floor Gate:** Deterministic check that compiled templates use `STAGE_TOKENS` font sizes (`≥ 32px`) and WCAG AA contrast ratios.
     - **Aviation Fact & SME Verification:** Compares distilled `SlideDeckSpec` + `speakerNotes` against source PPTX slides to flag any altered numbers, speeds, altitudes, or ICAO references into `job.smeFlags`.

---

### Part 5: Dual-Mode Code-Generated Video Engine (Remotion + TTS + WebVTT)
Replace the placeholder stock video (`mov_bbb.mp4` in `transform-router.ts`) with a real code-generated video stage powered by **Remotion**:

1. **Shared Spec → Dual Output:**
   - The exact same `SlideDeckSpec` JSON and SVG Diagram Kit render inside a Remotion `<Composition width={1920} height={1080} fps={30} />`.
2. **Two Output Modes:**
   - **Mode A — Classroom Projector Motion Loop (Silent):** Renders smooth step-by-step animated transitions without audio so a live instructor can pace the room.
   - **Mode B — Self-Paced LMS / SCORM Video (`1080p`, `30fps`, `H.264 MP4`):**
     - Generates natural voiceover audio from each step's `speakerNotes` via TTS.
     - Sets each motion step's frame duration to match the exact audio clip length.
     - Generates a synchronized `.vtt` (WebVTT) closed-caption file and uploads both `.mp4` and `.vtt` to Supabase Storage (`lessons/<moduleId>/<jobId>_<n>.mp4`).

---

## 3. Implementation Sequence (Phased Rollout)

| Phase | Scope | Key Deliverables |
| :--- | :--- | :--- |
| **Phase 2A: Stage Core & Diagram Kit** | Parts 1, 2, & 3 | `src/lib/stage/tokens.ts`, `src/lib/stage/schema.ts`, `src/lib/stage/diagrams/*`, `src/lib/stage/compiler.ts`, plus Supabase image extraction (killing base64 bloat). |
| **Phase 2B: Factory Integration & QA Gate** | Part 4 | Update `transform-router.ts` to output `SlideDeckSpec` JSON (parallelized 3 lessons at a time), add `qa` stage in `src/lib/factory/stages.ts` for the ≤20-word gate & SME fact check, and update `SlideStudio.tsx` to edit/recompile Stage specs. |
| **Phase 2C: Remotion Video & TTS Stage** | Part 5 | Add Remotion compositions + TTS + WebVTT generator for `video` lessons and wire empty `simulation` lessons to `sim-designer.ts`. |

