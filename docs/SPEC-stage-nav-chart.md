# Spec: AviLearn Stage — Nav Chart courseware style

Version: 1.0. Date: 2026-11-11. Owner: Anthony M. Houston.
Status: approved style direction. Values are ready for `src/lib/stage/tokens.ts`.
Concept page: https://claude.ai/artifact/THQNPk5pUVjK6T7abwruKy
Related: `docs/PLAN-stage-upgrade.md`, `docs/HANDOFF-content-factory.md`.

This spec controls all projected AviLearn courseware: HTML5 slide decks, step-through diagrams, and code-generated video. The AviLearn Console UI keeps its own design system (`Reference/AviLearn Design System/`). Where the two differ, this spec applies to courseware only.

---

## 1. Principles

1. One idea per slide. The headline states the idea as a full sentence (assertion). The visual proves it (evidence).
2. The trainer speaks the detail. The slide shows labels only. All prose goes to speaker notes.
3. One part at a time. A diagram builds one part per click.
4. One highlight colour. Brand teal marks the active part and the root cause. There is no red, magenta, or violet.
5. Light by default. Light chart paper works in lit rooms. Dark (night chart) is for dim rooms.
6. Code draws the visuals. Claude supplies data only. Claude does not write HTML, CSS, or SVG geometry.

## 2. Canvas

| Item | Value |
|---|---|
| Size | 1920 × 1080 px, 16:9. All values in this spec are in canvas px. |
| Scaling | Scale the whole canvas with `transform: scale()`. Do not reflow. |
| Safe margins | Left and right 115 px. Top 88 px. Bottom 134 px (footer zone). |
| Grid | 12 columns, 32 px gutter, inside the safe margins. |
| Background grid | 1 px lines every 77 px (4% of width), colour `grid`. |

## 3. Colour tokens

Text colours meet WCAG AA (4.5:1) on `bg`. Checked values are in the last column.

| Token | Light (default) | Dark (night chart) | Use |
|---|---|---|---|
| `bg` | `#eef3ef` | `#0c1a2c` | Canvas (chart paper) |
| `grid` | `rgba(18,48,90,.07)` | `rgba(170,205,235,.07)` | Background grid |
| `ink` | `#12305a` | `#e3ecf6` | Headlines, labels, lines. 11.7:1 / 14.7:1 |
| `inkMuted` | `#4b6584` | `#97abc3` | Eyebrows, footer, small labels. 5.4:1 / 7.4:1 |
| `teal` | `#0a6b62` | `#2dd4bf` | Highlight text, active marks, root cause. 5.7:1 / 9.4:1 |
| `tealFill` | `#0b7d72` | `#2dd4bf` | Bars, dots, filled shapes (no text on it in dark) |
| `tealTint` | `rgba(11,125,114,.11)` | `rgba(45,212,191,.13)` | Fill behind the active or root-cause box |
| `card` | `rgba(255,255,255,.78)` | `rgba(255,255,255,.045)` | Box fill |
| `line` | `#12305a` | `#b9cadc` | Box borders, diagram lines |

Rules:
- Use `teal` for one meaning only: "look here" (active step, root cause, key value).
- Do not use red, amber, magenta, or violet on slides. Show severity with words, icons, or position.
- Do not use gradients, glows, or shadows on slides.

Light teal text note: `#0b7d72` gives only 4.46:1 on `bg`. Use `#0a6b62` for teal text in light mode.

## 4. Typography

Fonts load from Google Fonts. Self-host them for SCORM packages and video render.

| Role | Font | Size (px) | Weight | Case |
|---|---|---|---|---|
| Module title (title slide) | Barlow Condensed | 150–170 | 700 | UPPER |
| Assertion headline | Barlow Condensed | 64–72 | 600 | UPPER |
| Hero number | Barlow Condensed | 140–180 | 700 | — |
| Diagram label | Barlow | 32–40 | 600 | Sentence |
| Card text | Barlow | 40–44 | 500 | Sentence |
| Eyebrow, tags, references | JetBrains Mono | 24–26 | 600 | UPPER, +0.12em |
| Footer | JetBrains Mono | 22 | 500 | — |

- Floor: no text under 22 px. No diagram label under 32 px.
- Line height: 1.05–1.1 for headings, 1.15–1.2 for labels.
- Headline: one or two lines, `text-wrap: balance`, max width 86% of the safe area.
- Numbers: tabular figures (`font-variant-numeric: tabular-nums`).
- Use the real aviation form for codes and units: `ORG 2.1.5`, `ZFW`, `180 kt`, `FL350`, 24-hour time.

## 5. Word budget

| Item | Limit |
|---|---|
| Assertion headline | 12 words |
| Diagram or card label | 1–4 words |
| Whole slide at full view | 30 words hard limit, 20 words target |
| Visible at any one step | 12 new words |

Words over the limit move to `speakerNotes`. The QA stage counts words and fails the slide when it is over the hard limit.

Note: some diagrams (5 Whys, Bowtie) need about 25–30 words at full view. The build steps keep each step under 12 new words.

## 6. Slide anatomy

Top to bottom:
1. Eyebrow (mono, `teal`): the topic, for example `FISHBONE DIAGRAM`.
2. Assertion headline (`ink`).
3. Evidence area: one diagram, card group, image, or hero number. It fills the rest of the safe area.
4. Footer (`inkMuted`): AviLearn mark left, `M14 · 4 / 7` right.

The title slide has no eyebrow. It has a mono line (module number and course), the module title, a one-line subtitle, and the compass rose at top right.

## 7. Step builds (signaling and segmenting)

Each content slide has 1 or more steps. Each element has a `step` number. It appears on that step.

| State | Rule |
|---|---|
| Future (`step > current`) | Hidden: opacity 0 |
| Active (`step = current`) | Opacity 1.0 |
| Past (`step < current`) | Opacity 0.3 |
| Structure (spine, axes, centre knot) | Opacity 1.0 when active, 0.55 when past |
| Full view (last step) | All elements at opacity 1.0 |

Controls:
- `Space`, `→`, `PageDown`, click: next step. After the last step, go to the next slide.
- `←`, `PageUp`: previous step.
- `F`: full screen. `D`: light / dark. `N`: show or hide speaker notes.

Step count: 2–8 steps for each slide. Each step has its own `speakerNotes`.

## 8. Motion

| Item | Value |
|---|---|
| Step change | 450 ms, `cubic-bezier(.2,.7,.2,1)`, opacity plus a 15 px rise for new elements |
| Line draw (SVG) | 600 ms ease-out, `stroke-dashoffset` from 1 to 0 |
| Slide change | 300 ms fade |
| Intro and outro bumper | 3 s: compass rose turns to north, then the AviLearn mark and module title fade in |
| Not allowed | Bounce, spring, parallax, looping idle motion, 3D spin |

`prefers-reduced-motion`: show state changes with no animation.

## 9. Templates and diagram kit

Claude picks a `templateId` and fills `diagramData`. Code draws everything.

| `templateId` | Data from Claude | Default steps |
|---|---|---|
| `title-bumper` | module number, course, title (≤ 4 words), subtitle (≤ 8 words) | 1 |
| `cause-chain` | 3–5 levels: label + text (≤ 5 words); index of the root cause | 1 per level + full view |
| `five-why` | finding + 3–5 whys + root cause, each ≤ 7 words | 1 per row + full view |
| `fishbone` | finding (≤ 4 words) + reference; 4–7 categories; optional 1–2 causes per bone | head, 1 per bone, full view |
| `swiss-cheese` | hazard, 3–5 layers (≤ 3 words each), event | hazard, 1 per layer, trajectory, full view |
| `bowtie` | hazard, top event, 2–4 threats, 2–4 consequences, barrier labels (optional) | hazard + event, threats, preventive barriers, consequences, recovery barriers, full view |
| `procedure-flow` | 3–6 steps, verb first, ≤ 4 words | 1 per step + full view |
| `checklist` | 2–6 items, ≤ 4 words | 1 per item + full view |
| `split-contrast` | 2 hero values + 2-word labels | left, right |
| `flight-timeline` | 3–6 pins: time or altitude + label | 1 per pin + full view |
| `annotated-image` | image ref, 1–4 callouts (≤ 3 words, x/y in %) | image, 1 per callout |

Diagram drawing rules:
- Lines: `line`, 4 px (main), 3 px (branches). Round caps.
- Boxes: `card` fill, 2 px `line` border, 0–4 px corner radius.
- Active or root-cause box: `tealTint` fill, `teal` border and label.
- Barriers (bowtie): `tealFill` bars, 22 × 88 px.
- Swiss cheese: flat slanted slabs, `card` fill, holes in `bg`. The trajectory is a `teal` dashed line, 6 px.
- Labels sit outside shapes where possible. No legends.

Category defaults (from Module 14): Procedures, Training, Communication, Resources, Management, Human factors, Organizational culture. Courses can override them.

## 10. Imagery and icons

- Icons: Lucide, 1.5 px stroke scaled to the canvas, colour `ink` or `teal`.
- Photos: cool, slightly desaturated. 6 px corners. No text on top of photos. Callouts sit beside the image.
- Generated images: chart-like line illustration in `ink` and `teal` only, no text in the image.
- Store images in Supabase Storage. Reference them by URL. Do not embed base64.

## 11. Accessibility

- Contrast: text 4.5:1 minimum (all tokens above pass). Non-text marks 3:1.
- Colour is never the only signal. The active part also has full opacity, and the root cause also has its label.
- Each SVG has `role="img"` and an `aria-label` that names the diagram and its parts.
- Speaker notes are the text alternative for the slide.

## 12. Video output

| Item | Value |
|---|---|
| Frame | 1920 × 1080, 30 fps |
| Codec | H.264 High profile, yuv420p, MP4 container |
| Audio | AAC 48 kHz stereo, −16 LUFS integrated |
| Captions | WebVTT, max 2 lines, max 42 characters per line |
| Step timing | Step length = narration clip length + 0.6 s. Minimum 2.5 s. |
| Bumpers | 3 s intro and 2 s outro on each video |
| Theme | Light by default. Same tokens as the slides. |

The video renders from the same `SlideDeckSpec` and the same diagram components as the HTML deck.

## 13. QA checks (factory `qa` stage)

A slide fails if any check fails:
1. Words over the limits in section 5.
2. A colour not in the token table.
3. Text under 22 px, or a diagram label under 32 px.
4. A step with no `speakerNotes`.
5. A number, speed, altitude, weight, or ICAO/IOSA reference that changed from the source. The stage flags it for an SME (subject matter expert) to check.

## 14. Token file shape

```ts
// src/lib/stage/tokens.ts
export const STAGE = {
  canvas: { width: 1920, height: 1080, safe: { x: 115, top: 88, bottom: 134 } },
  themes: {
    light: { bg: '#eef3ef', grid: 'rgba(18,48,90,.07)', ink: '#12305a', inkMuted: '#4b6584',
             teal: '#0a6b62', tealFill: '#0b7d72', tealTint: 'rgba(11,125,114,.11)',
             card: 'rgba(255,255,255,.78)', line: '#12305a' },
    dark:  { bg: '#0c1a2c', grid: 'rgba(170,205,235,.07)', ink: '#e3ecf6', inkMuted: '#97abc3',
             teal: '#2dd4bf', tealFill: '#2dd4bf', tealTint: 'rgba(45,212,191,.13)',
             card: 'rgba(255,255,255,.045)', line: '#b9cadc' },
  },
  defaultTheme: 'light',
  fonts: { display: "'Barlow Condensed', sans-serif", body: "'Barlow', sans-serif", mono: "'JetBrains Mono', monospace" },
  type: { title: 160, headline: 68, hero: 160, label: 34, card: 42, eyebrow: 25, footer: 22, floor: 22, labelFloor: 32 },
  words: { headline: 12, label: 4, slideTarget: 20, slideMax: 30, perStep: 12 },
  steps: { active: 1, past: 0.3, structurePast: 0.55, future: 0 },
  motion: { step: 450, draw: 600, slide: 300, ease: 'cubic-bezier(.2,.7,.2,1)' },
  video: { fps: 30, codec: 'h264', audioLufs: -16, minStepSec: 2.5, padSec: 0.6 },
} as const;
```
