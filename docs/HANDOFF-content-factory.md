# Handoff: AviLearn Content Factory

Date: 2026-11-11. Owner: Anthony M. Houston (CEO, Aviation Synergy Co., Ltd.).
Branch: `feat/content-factory` (on GitHub). Repo root: `D:\App development\AviLearn` (this machine) or `D:\AppDevelopment\AviLearn` (other machine). App folder: `avilearn-app/`.

## Goal
Turn AviLearn into an automated training-content conversion factory.
- Inputs: PPTX, PDF/DOCX, MP4.
- Outputs: HTML5 slides and SCORM/cmi5 packages.
- Selling point: a live visual pipeline display that shows real job events.
- Design choice: build the job queue and worker natively in AviLearn. Use ideas from StarNet (androoAGI/starnet). Do not copy its code, name, logo, or art.

## Test database
Supabase project LEP_2026 (`nhjvunaoqiolrvlweypf`). The owner says it is safe for testing and development. It holds real data: 5 courses, 14 modules, 79+ lessons, 40 quiz questions. Do not delete real courses.

## What exists (Phase 0/1, done and verified)
- Migration `supabase/migrations/00010_factory_jobs.sql`. Applied to LEP_2026. Tables: `factory_jobs`, `factory_job_events`. Column: `lessons.factory_job_id`.
- `src/lib/factory/`: `types.ts`, `runner.ts`, `supabase-store.ts`, `stages.ts`, `worker.ts`.
- Stage order: intake, enrichment, routing, saving.
- Runner: retry (max 3), resume through `completed_stages`, per-stage timeout, lock heartbeat, cancel check.
- Crash recovery: `recoverStale` re-queues running jobs with a lock older than 15 minutes.
- Artifacts: JSON in Storage bucket `scorm-packages` at `factory/<jobId>/<name>.json`.
- Saving is idempotent through `lessons.factory_job_id`.
- API: `POST/GET /api/factory/jobs`, `GET/POST /api/factory/jobs/[id]`, `GET /api/factory/jobs/[id]/events` (SSE), `POST /api/factory/work`.
- CLI: `node scripts/factory-submit.mjs <moduleId> <file> [file...]` (env `FACTORY_URL`).
- Dev tools (run with tsx and `--env-file=.env.local`): `scripts/factory-local-run.ts`, `scripts/factory-work.ts`, `scripts/factory-diag-enrichment.ts`.
- Tests: `npm run test:factory` (12 tests, all pass).
- PPTX parsing uses `resources/parse_pptx.py`. It needs Python with `python-pptx`. Set `FACTORY_PYTHON` to choose the Python command.
- End-to-end proof: a Module 14 PPTX produced 13 lessons. Crash recovery worked on a real stale job.

## Test data to clean up later
- Test course "Test", module "FACTORY TEST - Module 14 RCA", id `e3a2a5e1-960c-478e-ad07-fe86e03b465f`. Delete it when testing ends.
- The owner is reviewing lessons 1, 3, 8, 10 of that module. His verdict is not in yet.

## Phase 2 list (not started)
1. Write lessons 3 at a time. Routing now takes about 8 minutes for 13 lessons.
2. Move images out of the HTML into separate files. Lesson files reach 4.8 MB because images are base64.
3. Add a QA stage. Compare lessons with the source slides. Flag changed facts and accessibility problems.
4. Track cost per job from token usage. Cost is always 0 now.
5. Replace the fake video lessons (2 use a stock clip). Send the 3 empty simulation lessons to the existing simulation generator.
6. Add a review queue and an approve gate before SCORM/cmi5 packaging.
7. Merge or retire the old `conversion_jobs` table.

Later: Phase 3 DOCX, Phase 4 review queue UI, Phase 5 factory-floor pipeline display, Phase 6 MP4, Phase 7 hardening and runbook.

## Rules for this repo
- DO NOT run `npm run publish:portal` (script `scripts/publish-to-portal.mjs`). The owner does not want courses on the AviLearn Portal yet. The courses are not mature. If it is ever needed, run `--dry-run` first. Never run `--all` without `--dry-run`. It needs `PORTAL_URL` and `PORTAL_PUBLISH_KEY`.
- The factory code has no link to the portal.
- Never print or commit `.env.local` values. Required names: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `ANTHROPIC_THINKING_MODEL`, `ANTHROPIC_DOING_MODEL`.
- Report in plain, short sentences. Give 2 options max for decisions, with a recommendation. Flag any doubt on aviation safety content.

## Run it
- Server: `cd avilearn-app` then `npm run dev` (Next.js 16, webpack). URL: http://localhost:3000.
- On Windows, a detached launcher keeps the server alive: `env\logs\start-dev.bat` (local file, not in git). Log: `env\logs\dev-server.log`.
- Tests: `npm run test:factory`.
- Check: `/courses` and `/api/factory/jobs` must return 200.

## Git state (2026-11-11)
- `feat/content-factory` is merged with `main` and pushed. Latest commit: `e83d078` (package.json comma fix).
- Local `main` on the original machine may hold an unpublished July commit, `43c18b9`. Check before you touch `main`.
- Stray file on the original machine: `env/tmp/_ping.ts.bak`. The owner may delete it.