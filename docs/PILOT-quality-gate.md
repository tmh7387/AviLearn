# Pilot: quality gate with Gemini Decision 1

Status: pilot, off by default. Decided by Anthony on 2026-11-23 (option A).

## What it does

The quality gate runs at the end of the factory `enrichment` stage.
It sends each source slide to Gemini Decision 1 (Decisions API).
The model returns calibrated yes/no, choice and score answers. It writes no text.
The gate turns the answers into review flags on the job (`smeFlags`).
The reviewer sees which slides need attention first.

The gate never changes content. It never fails a job. If the API fails, the job continues without flags.

## Checks per slide

| Key | Type | Flag | Default threshold |
| --- | --- | --- | --- |
| `slide_type` | choice (7 slide types) | `type_uncertain` if confidence is low; `type_disagrees` if Opus chose a different type | confidence < 0.70 |
| `multiple_ideas` | yes/no | `split_slide` | P(yes) ≥ 0.70 |
| `sme_check` | yes/no | `sme_check` (facts an expert must verify) | P(yes) ≥ 0.60 |
| `visual_candidate` | yes/no | `make_visual` (text and procedure slides only) | P(yes) ≥ 0.70 |
| `projector` | score 0–3 | `too_dense` | score ≤ 1.0 |
| word count | code | `too_many_words` | > 40 words |

Thresholds live in `DEFAULT_THRESHOLDS` in `avilearn-app/src/lib/agents/quality-gate.ts`.
Tune them with 20 to 30 slides that a human has labelled.

## Turn it on

Set these server environment variables:

```
QUALITY_GATE_ENABLED=1
GEMINI_API_KEY=<paid-tier key>
# optional
GEMINI_DECISION_MODEL=gemini-decision-1
FACTORY_REQUIRE_REVIEW=1
```

Use a paid-tier key. On the free tier, Google can use the content to improve its products.

## Output

- Job artifact `quality-gate`: one result per slide, with probabilities, flags, token count and cost.
- Job `smeFlags`: up to 50 flags, prefixed `[Quality gate]`, fact checks first.
- Cost: USD 0.10 per 1M input tokens. One slide is about 200 to 600 tokens. A 60-slide deck costs well under 1 cent.

## Files

- `avilearn-app/src/lib/agents/quality-gate.ts`: questions, interpretation, runner. No app imports.
- `avilearn-app/src/lib/agents/decisions-client.ts`: `@google/genai` wrapper.
- `avilearn-app/src/lib/factory/stages.ts`: `runGate` hook in the enrichment stage.
- `avilearn-app/test/quality-gate.test.ts`: `npm run test:gate`.

## Live test (2026-11-23)

Run: `npm run gate:live` (needs `GEMINI_API_KEY`).
In the cloud environment, the proxy sets the key. Use a dummy key and set `NODE_USE_ENV_PROXY=1`, because Node `fetch` ignores `HTTPS_PROXY` without it:

```
NODE_USE_ENV_PROXY=1 GEMINI_API_KEY=dummy npm run gate:live
```

Result on 5 sample slides (`scripts/gate-live.ts`): 5 of 5 checked, 0 errors, 3,471 input tokens, USD 0.00035, 0.5 s.

| Slide | Gemini type (conf.) | Opus type | Flags |
| --- | --- | --- | --- |
| 1 Title | title_slide (0.99) | same | none |
| 2 Dense regulation text, 62 words | text_heavy (0.94) | same | split_slide (0.92), sme_check (0.98), too_dense (0.29), too_many_words |
| 3 5-Why steps | procedure_checklist (0.60) | same | type_uncertain |
| 4 Fishbone shapes | diagram (0.95) | same | none |
| 5 Quiz | quiz_exercise (0.97) | same | none |

The answers match the expected flags. No SDK change was needed.

## Next steps (not in this pilot)

- Check Stage deck copy (AI-sounding text, brand rules) on rendered slide screenshots.
- Check video narration audio for pronunciation and pacing.
- Show the gate results per slide in the review screen.
