# AviLearn Voice and Course Structure

Source: the courses Anthony Houston teaches (reference deck: IOSA RBI Day 1, v3.6).
The Stage compiler enforces the banned phrases in `avilearn-app/src/lib/stage/voice.ts`.

## 1. Course structure

### Course opening (Day 1, in this order)

| # | Slide | Template |
|---|---|---|
| 1 | Course title: course name, subtitle, client ("for ..."), dates, facilitator, Aviation Synergy | `course-title` |
| 2 | Course Learning Objectives: 3 to 5 objectives, each starts with a verb | `objectives` |
| 3 | Facilitator introduction | `facilitator` |
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

## 4. Illustrations

- Use the AviLearn illustration library (`illustration:<id>` assets): detailed technical drawings with real proportions, not photos and not cartoons.
- Current drawings: `aircraft-side`, `aircraft-ramp`, `flight-deck`.
- Every colour comes from the theme tokens, so each drawing works on light and dark.
