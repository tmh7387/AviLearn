# AviLearn Design System

AviLearn is an aviation training & learning-management platform for flight schools, ground-school instructors, and student pilots. The product family is admin-led: instructors and school administrators run their day from a dense, data-rich dashboard while students get a focused learning surface. The design system here describes how every screen should look, sound, and behave so the brand stays consistent across the dashboard, the chat/mail apps, the gradebook, scheduling, and the student-facing learning surface.

## Source / Reference
- **Visual reference:** EduAdmin Bootstrap 5 admin template — dark variant
  - https://eduadmin-template.multipurposethemes.com/bs5/main-dark/contact_app_chat.html
- AviLearn is a fictional brand on top of that template. The visual DNA (dark slate canvas, dense data cards, sidebar nav, soft inset surfaces, vivid status accent colors, square-cornered cards with thin dividers) is taken from EduAdmin; the brand voice, palette tokens, and aviation-flavored content are written here for AviLearn.

## Products represented
1. **AviLearn Console** (web admin) — instructor / admin dashboard. Sidebar shell, header bar, dense content grid. The chat, mailbox, taskboard, gradebook, scheduling, and student-roster screens all live here.
2. **AviLearn Learn** (student learning surface) — lighter-weight study experience: lesson reader, quiz runner, flight-log review. Shares tokens with the Console but uses larger type and more breathing room.

The Console is the primary surface; the student Learn surface is a secondary skin of the same tokens.

## Index — what's in this folder
- `README.md` — this file. Brand context, content fundamentals, visual foundations, iconography.
- `SKILL.md` — agent skill manifest (cross-compatible with Claude Code skills).
- `colors_and_type.css` — design tokens (CSS custom properties) for color, type, spacing, radii, shadows, plus semantic element styles.
- `assets/`
  - `avilearn-logo.svg` — wordmark for dark surfaces.
  - `avilearn-logo-light.svg` — wordmark for light surfaces.
  - `avilearn-mark.svg` — standalone mark for favicons / collapsed nav.
- `fonts/` — empty. Inter and JetBrains Mono load from Google Fonts CDN. **Substitution flag:** the EduAdmin reference template ships its own bundled icon fonts (Themify, Simple Line, Material). We did not copy those font files in — please confirm whether to host them.
- `preview/` — small HTML cards that populate the Design System review tab (one card per token / component cluster). Grouped by Colors, Type, Spacing, Components, Brand.
- `ui_kits/console/` — high-fidelity recreation of the AviLearn Console (admin) UI. `index.html` is the interactive demo (Dashboard, Roster, Chat). Components: `Avatar.jsx`, `Sidebar.jsx`, `Header.jsx`, `Views.jsx`. Local styles in `console.css`.

---

## CONTENT FUNDAMENTALS

**Voice.** Crisp, operational, instructor-to-instructor. AviLearn speaks like an experienced chief flight instructor briefing the next watch: factual, terse, no marketing puff. Sentences are short. Numbers are exact. Acronyms (METAR, TAF, ATPL, PPL, IFR/VFR, CFI) are used without apology when the audience is pilots; expanded on first use when the audience is students.

**Person.** "You" for the user (the instructor or student). "We" for AviLearn the platform — used sparingly, only in onboarding and empty states. Never "I". Never "us vs them" phrasing.

**Casing.** Sentence case for everything: page titles, card headers, buttons, menu items, table column headers. Examples: "Add student", "Flight log", "Open mailbox" — not "Add Student" or "ADD STUDENT". The only exception is brand names (AviLearn, AviLearn Console) and acronyms (PPL, ATPL, IFR).

**Punctuation.** No trailing periods on buttons, menu items, badges, or single-line table cells. Periods on full-sentence body text and toast messages. Em-dashes are fine; ellipses indicate truncation, not pause.

**Numbers & units.** Always show units. "12 students", "3 lessons remaining", "180 kts", "2.4 hrs logged". Time is 24-hour ("14:30") in the operational shell; 12-hour with am/pm only in chat timestamps where the source template uses it.

**Tone in specific surfaces.**
- Empty states — direct and instructive. "No flights logged this week. Add a flight from the toolbar." Not cute, not apologetic.
- Errors — name the thing, name the fix. "Couldn't reach the FAA endpoint. Retry, or check your network."
- Confirmations — short and past-tense. "Lesson published.", "Roster updated.", "3 students invited."
- Marketing/login — slightly warmer but still grounded. "Log in to your flight school." not "Welcome back, friend!"

**Vibe.** Professional, slightly technical, calm-under-pressure. Think pilot briefing room, not edtech mascot. **No emoji** in product copy. **No exclamation marks** outside genuine celebration moments (course completion, license earned). Unicode chars are fine where functional (›, →, ↗, ✓, •).

**Sample copy lines** (use these as templates):
- "47 students enrolled · 12 active this week"
- "Schedule lesson"
- "Last sync 2 min ago"
- "Pre-flight checklist incomplete — review before departure."
- "Welcome back, Mayra. 3 lessons need grading."
- "PPL ground school · Module 4 of 9"

---

## VISUAL FOUNDATIONS

**Mode.** Dark-first. The entire Console is on a deep slate canvas. A light skin exists but is secondary; design dark, then check light.

**Color.**
- Canvas: deep desaturated navy (`--bg-canvas: #14171f`), one tick darker than card surface.
- Surfaces: a near-black graphite (`--bg-surface: #1c1f2a`) for cards, modals, sidebars.
- Surface-2: slightly lighter (`--bg-surface-2: #232735`) for nested panels, hovers, table stripes.
- Border / divider: low-contrast gray (`--border: #2c3142`), almost just visible.
- Foreground: off-white (`--fg-1: #e6e9f2`) for primary text, `--fg-2: #a4a9bd` for secondary, `--fg-3: #6b7187` for muted/labels.
- Brand: a desaturated aviation cyan (`--brand: #2dd4bf` teal-cyan) used for primary actions, key data points, and the AviLearn mark.
- Status accents — saturated, used sparingly: success green `#22c55e`, warn amber `#f59e0b`, danger red `#ef4444`, info blue `#3b82f6`, accent magenta `#ec4899` (used in charts, never alone).
- Color comes from data, not chrome. The dashboard background never carries a color. Color is reserved for status badges, chart series, brand accent on focused / primary actions, and the user's own avatar ring.

**Type.** Single sans-serif family — **Inter** (with `-apple-system, "Segoe UI", Roboto` fallback). One typeface only. No serifs anywhere. Numerics are tabular for tables, KPIs, and chat timestamps (`font-variant-numeric: tabular-nums`). A monospace face — **JetBrains Mono** — is used in code blocks, METAR/TAF readouts, aircraft tail numbers, and any fixed-width data. Display sizes top out modestly: 28px for page titles in the Console, 40px on the marketing/login hero. Body 14px is the workhorse; 13px is acceptable for dense tables and sidebar items.

**Layout & density.** Console pages are dense — 12-column grid, 16px gutter, 12–16px card padding. Sidebar is 244px fixed; collapsed rail 60px. Top header is 56px. Cards rarely have more than 12px padding on their inner sections; chat messages are 8px above/below avatars. Don't pad like a marketing site.

**Backgrounds.** Flat color only on the Console. **No gradients on chrome** (sidebar, header, cards). The one place a subtle gradient is allowed is the auth/login / marketing surface, where a soft top-down brand-tint (`--brand` at ~6% on top, fading to canvas) gives the hero some atmosphere. **No background imagery, no patterns, no textures** on functional surfaces. Photographic imagery only appears where it's the content (avatars, course thumbnails, aircraft photos) — never decorative.

**Imagery vibe.** When photographic content does appear (course thumbnails, instructor avatars, aircraft photos, airfield headers), keep it cool and unsaturated — slightly desaturated, neutral white balance, never warm Instagram filters. Aircraft, sky, hangar, runway. Avatars are square-cropped circles.

**Animation.** Functional and fast.
- Hover state changes: 150ms `cubic-bezier(.4,0,.2,1)` — opacity / background only.
- Press: 80ms ease-in.
- Modal / drawer enter: 200ms slide+fade.
- Chart line drawing: 600ms ease-out, single pass on data load.
- No bounces. No spring. No parallax. No looping idle motion. Loading uses a thin 2px progress bar at the top of the page (Pace.js style) and inline spinners only.

**Hover states.** Two patterns:
- On clickable rows / list items / nav items: background fades to `--bg-surface-2` (one shade lighter). No translation, no scale.
- On buttons: background lightens by ~6% if filled; outline buttons fill with their accent at 10% opacity.

**Press states.** Filled buttons darken by ~8% and snap (no scale). Icon buttons get a 28px circular `--bg-surface-2` background.

**Borders.** 1px, `--border` color, almost invisible. Cards have a 1px border AND no shadow — borders, not elevation, separate the surfaces from the canvas. Form inputs have 1px border that shifts to `--brand` on focus with a 2px ring at 25% opacity.

**Shadows.** Minimal. Used only for things that physically float over content:
- `--shadow-pop`: `0 4px 12px rgba(0,0,0,0.4)` for dropdowns and popovers.
- `--shadow-modal`: `0 20px 40px rgba(0,0,0,0.5)` for modals and drawers.
- Cards on the canvas: **no shadow**. The border carries the separation.

**Inner shadows / inset.** Used in one place: the chat input and search input get a subtle 1px `inset 0 0 0 1px rgba(255,255,255,0.02)` to look slightly recessed from the surrounding card. That's it.

**Protection gradients vs capsules.** Status pills (badges) are CAPSULES — fully-rounded pills, 2px vertical padding, 10px horizontal, accent color at 15% background with the accent color text. Never use a protection gradient (a fade behind text over imagery). When text overlaps imagery (avatar with online dot, course thumbnail with title), the text moves OUT of the image into a separate row beneath it.

**Layout rules — fixed elements.** Sidebar fixed left (`position: fixed`). Header fixed top, full width minus sidebar offset. Right control sidebar (notifications / live chat / todos) slides in over content as a 320px drawer — does NOT push content. Page footer is small, single-line, sticky-bottom with copyright + version.

**Transparency & blur.** Used minimally. The page header has a 1px bottom border, no blur. The right control drawer has a backdrop at 40% black (no blur). `backdrop-filter: blur` appears only on the toast container that floats over a video preview — and only there. Don't reach for glassmorphism.

**Imagery treatment.** Avatars are circular. Course thumbnails are 16:9 with 6px corners. Aircraft photos for the flight-log feed are 4:3 with 6px corners. No drop shadows on imagery.

**Corner radii.**
- Cards, modals, drawers: **6px** (square-leaning).
- Buttons, inputs: **4px**.
- Pills / badges / avatars: fully rounded.
- Sidebar nav items: 4px.
- The system is square-leaning, not playful.

**Cards.** Defining element of the Console. Solid `--bg-surface` fill, 1px `--border`, 6px corners, **no shadow**. Card header is a top section with a 13px uppercase-tracked label and an optional action menu (3-dot icon button) on the right; below it a 1px `--border` divider; below that the card body at 12-16px padding. Many cards have a colored top accent strip (3px tall) in a status color when relevant — used sparingly, only on KPI cards and alert cards.

**Spacing scale.** 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px. Most layouts use 12/16/24 — no 10s, no 18s, no 22s.

**Iconography vibe.** Outline-style line icons, 1.5px stroke. See ICONOGRAPHY below for specifics.

---

## ICONOGRAPHY

The reference template ships several icon sets bundled (Font Awesome, Themify, Simple Line, Material, Glyphicons, Cryptocoins, Flag Icons, Weather Icons). For AviLearn we standardize on **one** primary icon system to keep the surface coherent:

**Primary icon set: Lucide** (CDN-loaded, 1.5px stroke, outline). Lucide is the closest CDN-available match to the line-icon style EduAdmin defaults to in chrome (Themify / Simple Line). It's MIT-licensed, tree-shakeable, and matches AviLearn's tone better than emoji or filled glyphs.

> **Substitution flag.** The original EduAdmin template bundles Themify Icons / Simple Line / Material Icons font files. We did not copy those font files into the project (large, redistributable-with-license-care). If you need pixel-exact parity with the EduAdmin template, replace the Lucide CDN reference with the original `themify-icons.css` and `simple-line-icons.css`. **Please confirm: should we host the Themify / Simple Line icon fonts directly?**

**Loading.** From CDN:
```html
<script src="https://unpkg.com/lucide@latest"></script>
<i data-lucide="plane"></i>
<script>lucide.createIcons();</script>
```

**Sizing.** Three sizes only:
- `--icon-sm: 14px` — inline with body text, table cells.
- `--icon-md: 18px` — sidebar nav, button icons, header bar.
- `--icon-lg: 24px` — empty state illustrations, large action buttons.

**Color.** Icons inherit `currentColor`. They never carry their own color. The exception: status icons in toasts/alerts take the matching status color (green check, red x, amber warn, blue info).

**Stroke weight.** 1.5px Lucide default. Do not mix stroke weights in one screen.

**Use of emoji.** **No emoji in product UI.** Emojis only appear inside user-generated content (chat messages a student types) — and there they're rendered as system glyphs, never colorized brand-side.

**Unicode chars used as glyphs.** Functional only:
- `›` for breadcrumb separators
- `→ ↗ ↘` for trend / external-link arrows in tables
- `•` for inline separators in metadata rows
- `✓` for completed checklist items
- `−` for collapsed rows (paired with `+`)

**Logo / brand mark.** AviLearn logo is a simple wordmark with a small paper-plane glyph — see `assets/avilearn-logo.svg` and `assets/avilearn-mark.svg`. The mark is used standalone in the collapsed sidebar and in favicons; the wordmark is used everywhere else.

**Required icons we use repeatedly** (Lucide names):
- Navigation: `layout-dashboard`, `users`, `book-open`, `calendar`, `mail`, `message-square`, `clipboard-check`, `bar-chart-3`, `settings`, `bell`, `search`
- Aviation-specific: `plane`, `plane-takeoff`, `plane-landing`, `wind`, `cloud`, `compass`, `gauge`, `map`
- Actions: `plus`, `more-horizontal`, `more-vertical`, `chevron-right`, `chevron-down`, `x`, `check`, `pencil`, `trash-2`, `download`, `upload`, `filter`, `arrow-up-right`
- Status: `circle-check`, `circle-alert`, `circle-x`, `info`
