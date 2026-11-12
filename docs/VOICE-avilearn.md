# AviLearn Voice and Course Structure

Source: the courses Anthony Houston teaches (reference deck: IOSA RBI Day 1, v3.6).
The Stage compiler enforces the banned phrases in `avilearn-app/src/lib/stage/voice.ts`.

## 1. Course structure

### Course opening (Day 1, in this order)

| # | Slide | Template |
|---|---|---|
| 1 | Course title: course name, subtitle, client ("for ..."), dates, facilitator, Aviation Synergy | `course-title` |
| 2 | Course Learning Objectives: 3 to 5 objectives, each starts with a verb | `objectives` |
| 3 | Introductions: "Facilitator — Name", organisation logos, photo panel (see section 5) | `facilitator` |
| 4 | Breaking the Ice: numbered prompts (Who Are You?, Your Position, Your Duties, Your Experience) | `icebreaker` |
| 5 | Day N Overview — Theme: module codes and titles (M0, M1 ...) | `day-overview` (one per day) |
| 6 | Course Materials: link, QR code, PIN and sign-in word | `course-materials` |

### Each module

| Position | Slide | Template |
|---|---|---|
| Start | "Module N" + title + 3 or 4 objectives | `module-opener` |
| End | "Module N — Key Points" + one lead line + 3 titled points | `key-points` |
| After | Tea Break / Lunch Break: "End of Module N. We resume with Module N+1 — Title." | `break` |

Workshops say "Please refer to your Participant Workbook" in the speaker notes and give the time in minutes.

### End of day

`day-close`: "End of Day N", the day theme, the modules covered, one line on what the next day builds.

## 2. Voice

- Write as the facilitator talking to the room. Use "you" and "your".
- Headlines are statements or direct questions in Title Case: "Which ISM Edition Governs You", "Decisions That Have Deadlines", "Your SMS Is the Auditor's Map".
- Cite the exact reference: "IAH 2.5.3", "ICAO Annex 19, App. 2", "ISO 19011:2018".
- Use real numbers from the data: "Unstable approach events up 31% on the new type".
- Card titles are 2 to 4 words. Detail goes in speaker notes.
- British spelling: organisation, prioritise, programme, behaviour.
- Practical instructions: "Work in your groups for ten minutes, then nominate one speaker per group to report back."

## 3. Do not write

The compiler rejects these patterns:

- Counting slogans: "Five Parts, One Risk Cycle", "Three Things to Take Back".
- "By the end you can ...". Use the module objectives list.
- "Takeaways". Use "Key Points".
- Filler and marketing words: "let's dive in", "deep dive", "journey", "unlock", "game changer", "level up", "in a nutshell", "at a glance", "leverage".

## 4. Visuals

- Technical visuals (walkround, callouts, parts of the aircraft): use renders of the Kestrel Pacific 3D models.
  - Full livery (`*-livery.webp`, style `livery`): the default. One file works on light and dark.
  - Line drawing (`*-light.png` and `*-dark.png`, style `tech`): for diagrams that need a plain outline.
- Make renders with `avilearn-app/scripts/kestrel-render.py` (Blender, headless). Files go in `avilearn-app/public/stage/kestrel/`.
- Mood visuals (course title, module opener panel): use the Kestrel media kit images (`kind: 'photo'`).
- Kestrel Pacific is a fictional airline. Every Kestrel asset has a `credit` that says so. AI images also say "not for technical teaching". Renders of the 787-9 credit the Sketchfab model (CC BY).
- Do not use AI images for technical teaching. Registrations and details in them are not accurate.

## 5. Facilitator slide

Follows slide 4 of the reference deck: "Introductions", then "Facilitator — Name", then the logos of the organisations the facilitator has worked with, and a photo panel on the left. No role line and no list of skills.
