// Usage: node scripts/factory-submit.mjs <moduleId> <file> [file...]
// Env:   FACTORY_URL (default http://localhost:3000)
import { openAsBlob } from 'node:fs';
import { basename } from 'node:path';

const [moduleId, ...files] = process.argv.slice(2);
if (!moduleId || files.length === 0) {
  console.error('Usage: node scripts/factory-submit.mjs <moduleId> <file> [file...]');
  process.exit(1);
}
const form = new FormData();
form.set('moduleId', moduleId);
for (const f of files) form.append('file', await openAsBlob(f), basename(f));

const base = process.env.FACTORY_URL || 'http://localhost:3000';
const res = await fetch(`${base}/api/factory/jobs`, { method: 'POST', body: form });
const body = await res.json();
console.log(res.status, JSON.stringify(body, null, 2));
process.exit(res.ok ? 0 : 1);
