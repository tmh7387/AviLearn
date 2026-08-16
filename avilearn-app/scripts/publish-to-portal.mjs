/**
 * Publish a course from the engine to the AviLearn Portal.
 *
 *   node scripts/publish-to-portal.mjs SMS-101 --dry-run
 *   node scripts/publish-to-portal.mjs SMS-101
 *   node scripts/publish-to-portal.mjs --all
 *
 * The engine authors what a course says; the portal delivers it. This is the
 * one place the two meet, and it only ever sends content — modules, exercises,
 * grounding material. It cannot change how the portal behaves.
 *
 * The mapping, which is the whole of the design decision:
 *
 *   engine `courses`  ->  portal Programme   (a course type, not a run of one)
 *   engine `modules`  ->  portal Module      (the unit of reuse)
 *   engine `lessons`  ->  nothing, yet       (see the note below)
 *
 * A portal Course is a *run* — dates, a class PIN, a register — and is created
 * in the portal by an admin choosing a programme. The engine never creates one,
 * which is why nothing here mentions cohorts.
 *
 * On lessons: the engine's lessons are content items with a type and a URL, and
 * the portal has no concept of them. What the portal wants from a module is its
 * exercises, and the engine does not model those yet — `quiz_questions` and
 * `assessments` are both empty. So a publish today creates the programme and its
 * modules, and the exercises stay as the portal seeded them. When the engine
 * grows exercises, add them in buildExercises() below; the portal already
 * accepts them.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, '..');

// -------------------------------------------------------------------------
// Environment
//
// Read by hand rather than adding a dependency. Next loads .env.local for the
// app; a plain node script does not, and this has to run from a terminal.
// -------------------------------------------------------------------------

function loadEnv() {
  for (const name of ['.env.local', '.env']) {
    const path = join(appRoot, name);
    if (!existsSync(path)) continue;

    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      // Real environment wins, so CI can override the file.
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

loadEnv();

const REQUIRED = [
  ['PORTAL_URL', 'the portal address, e.g. https://avilearn-portal.netlify.app'],
  ['PORTAL_PUBLISH_KEY', 'the key you set as PUBLISH_API_KEY in the portal'],
  ['NEXT_PUBLIC_SUPABASE_URL', "this engine's Supabase project URL"],
  ['SUPABASE_SERVICE_ROLE_KEY', "this engine's service role key"],
];

const missing = REQUIRED.filter(([k]) => !process.env[k]?.trim());

if (missing.length) {
  console.error('Missing settings in avilearn-app/.env.local:\n');
  for (const [k, why] of missing) console.error(`  ${k}  — ${why}`);
  console.error('\nAdd them, then run this again.');
  process.exit(1);
}

const PORTAL_URL = process.env.PORTAL_URL.trim().replace(/\/+$/, '');
const PORTAL_PUBLISH_KEY = process.env.PORTAL_PUBLISH_KEY.trim();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL.trim().replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY.trim();

/**
 * Read a table through Supabase's REST API.
 *
 * Plain fetch rather than @supabase/supabase-js, which builds a realtime client
 * on construction and needs a WebSocket that Node 20 does not have. This script
 * only reads rows, so the dependency bought nothing and cost a crash — and a
 * script with no dependencies cannot break when the app's change.
 */
async function selectRows(table, params) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Accept: 'application/json',
    },
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error(
      'Supabase refused the key. Check SUPABASE_SERVICE_ROLE_KEY in avilearn-app/.env.local.'
    );
  }
  if (!res.ok) {
    throw new Error(`Could not read ${table}: HTTP ${res.status} ${await res.text()}`);
  }
  return res.json();
}

// -------------------------------------------------------------------------
// Mapping
// -------------------------------------------------------------------------

/**
 * A portal slug: lowercase, hyphenated, no leading or trailing hyphen.
 *
 * The portal validates this and rejects anything else, so it is worth getting
 * right here rather than reading the rejection.
 */
function slugify(input, fallback) {
  const slug = String(input ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

/**
 * Exercises for a module.
 *
 * Empty today: the engine has no exercise model. When it grows one, return
 * objects of this shape and the portal will store them:
 *
 *   {
 *     key: 'srm-eval',                 // stable; responses are stored under it
 *     title: 'Conduct a risk evaluation',
 *     kind: 'FORM' | 'RISK_PROFILE' | 'CHECKLIST' | 'EXAM',
 *     scope: 'INDIVIDUAL' | 'GROUP' | 'PRIVATE',
 *     persisted: true,                 // must be false when scope is PRIVATE
 *     content: { ... }                 // shape depends on kind
 *   }
 *
 * Two rules the portal enforces and will reject you for breaking:
 *   - a PRIVATE exercise must have persisted: false — its answers never reach
 *     the server at all;
 *   - an EXAM must not carry questions or an answer key in content, because
 *     content is served to participants. Publish framing only.
 */
function buildExercises(_module) {
  return [];
}

async function buildProgramme(course) {
  const modules = await selectRows('modules', {
    select: 'id,title,description,sort_order',
    course_id: `eq.${course.id}`,
    order: 'sort_order.asc',
  });

  return {
    // The programme's identity is the course code where there is one — it is
    // stable, and the name gets edited.
    slug: slugify(course.code || course.name, `course-${course.id.slice(0, 8)}`),
    title: course.name,
    code: course.code ?? null,
    description: course.description ?? null,
    modules: (modules ?? []).map((m, i) => ({
      slug: slugify(m.title, `module-${m.id.slice(0, 8)}`),
      title: m.title,
      summary: m.description ?? null,
      // The engine orders modules but has no notion of teaching days. One
      // module per day is the honest default; the portal's admin can move them
      // afterwards, and the day is a property of the programme rather than of
      // the material.
      dayNumber: (m.sort_order ?? i) + 1,
      orderIndex: m.sort_order ?? i,
      exercises: buildExercises(m),
    })),
    // Knowledge resources are not modelled in the engine yet either. When they
    // are, add them here as { slug, title, kind, body }.
    knowledge: [],
  };
}

// -------------------------------------------------------------------------
// Publish
// -------------------------------------------------------------------------

async function publish(programme, { dryRun }) {
  const moduleCount = programme.modules.length;
  const exerciseCount = programme.modules.reduce((n, m) => n + m.exercises.length, 0);

  console.log(`\n${programme.title}  (${programme.slug})`);
  for (const m of programme.modules) {
    console.log(`  day ${m.dayNumber}  ${m.slug}  ${m.exercises.length} exercise(s)`);
  }

  if (dryRun) {
    console.log(`\n  DRY RUN — nothing sent. ${moduleCount} module(s), ${exerciseCount} exercise(s).`);
    return { ok: true };
  }

  const res = await fetch(`${PORTAL_URL}/api/publish/programme`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': PORTAL_PUBLISH_KEY,
    },
    body: JSON.stringify(programme),
  });

  const body = await res.json().catch(() => null);

  if (res.status === 401) {
    console.error('\n  Rejected: the portal did not accept the key.');
    console.error('  PORTAL_PUBLISH_KEY must equal PUBLISH_API_KEY in the portal.');
    return { ok: false };
  }

  if (res.status === 404) {
    console.error('\n  The portal has no publish endpoint configured.');
    console.error('  Set PUBLISH_API_KEY in the portal and redeploy it.');
    return { ok: false };
  }

  if (res.status === 422) {
    console.error('\n  The portal rejected the content:');
    for (const e of body?.errors ?? []) console.error(`    - ${e}`);
    return { ok: false };
  }

  if (!res.ok) {
    console.error(`\n  Publish failed: HTTP ${res.status} ${body?.error ?? ''}`);
    return { ok: false };
  }

  const p = body.published;
  console.log(
    `\n  Published: ${p.modules} module(s), ${p.exercises} exercise(s), ${p.knowledge} knowledge resource(s).`
  );
  if (body.coursesUsingThisProgramme > 0) {
    console.log(
      `  ${body.coursesUsingThisProgramme} course(s) already run this programme and now see these changes.`
    );
  }
  return { ok: true };
}

// -------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const all = args.includes('--all');
  const code = args.find((a) => !a.startsWith('--'));

  if (!all && !code) {
    console.error('Give a course code, or --all:\n');
    console.error('  node scripts/publish-to-portal.mjs SMS-101 --dry-run');
    console.error('  node scripts/publish-to-portal.mjs SMS-101');
    console.error('  node scripts/publish-to-portal.mjs --all\n');

    const data = await selectRows('courses', { select: 'code,name', order: 'code.asc' });
    if (data?.length) {
      console.error('Courses in this engine:');
      for (const c of data) console.error(`  ${String(c.code ?? '(no code)').padEnd(14)} ${c.name}`);
    }
    process.exit(1);
  }

  console.log(`Portal: ${PORTAL_URL}${dryRun ? '   (dry run)' : ''}`);

  const courses = await selectRows('courses', {
    select: 'id,code,name,description,status',
    ...(all ? { order: 'code.asc' } : { code: `eq.${code}` }),
  });

  if (!courses?.length) {
    console.error(`No course with code "${code}".`);
    process.exit(1);
  }

  let failed = 0;
  for (const course of courses) {
    const programme = await buildProgramme(course);

    if (programme.modules.length === 0) {
      console.log(`\n${programme.title}  (${programme.slug})`);
      console.log('  Skipped: no modules to publish.');
      continue;
    }

    const result = await publish(programme, { dryRun });
    if (!result.ok) failed += 1;
  }

  console.log('');
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(`\n${e instanceof Error ? e.message : e}\n`);
  process.exit(1);
});
