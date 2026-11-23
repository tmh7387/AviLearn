/**
 * Package one module as a self-study course: the interactive player with
 * narration, scored knowledge checks and progress tracking.
 *
 *   npm run stage:package -- rbi-m2 [--format scorm12|xapi|web] [--voice george|alice] [--speed 1] [--out dir] [--three local|cdn]
 *     -> ../env/tmp/package/<key>/<key>-<format>.zip and the unzipped folder next to it
 *
 * scorm12: SCORM 1.2 zip for an LMS (learning management system). The LMS gets
 *   completion, a score (percent of knowledge checks right; pass mark 80%) and a
 *   bookmark, so a learner can leave and resume.
 * xapi: xAPI (Tin Can) zip with tincan.xml for an LMS or LRS (learning record store).
 *   Statements: initialized, experienced (each slide), answered (every answer, with
 *   the question, options, response and success; the scored first answer is marked),
 *   completed, passed or failed with the score, terminated. Bookmark in the State API.
 *   Activity IDs start with --activity-base (default https://avilearn.app/xapi/).
 * web: the same folder without the LMS manifest, for the Portal or any web server.
 *
 * The deck is the same compiled deck the presenter uses, in self-study mode:
 * slides marked delivery 'live' (workshops, breaks) are left out, slides marked
 * 'self-study' (scored checks) are added. Narration comes from the speaker notes
 * (facilitator lines are never read) through scripts/video/tts.py; audio is
 * cached, so a re-package spends no characters on unchanged notes.
 * Fonts load from Google Fonts; everything else is in the package.
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { compileDeck } from '../../src/lib/stage';
import { slidesFor } from '../../src/lib/stage/compiler';
import { COURSE_DECKS } from '../../src/lib/stage/courses';
import { SAMPLE_DECKS } from '../../src/lib/stage/samples';
import type { SlideDeckSpecInput } from '../../src/lib/stage/schema';

const app = resolve(__dirname, '..', '..');
const args = process.argv.slice(2);
const opt = (name: string, def: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const key = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const decks: Record<string, SlideDeckSpecInput> = { ...SAMPLE_DECKS, ...COURSE_DECKS } as Record<string, SlideDeckSpecInput>;
if (!key || !decks[key]) {
  console.error(`Usage: npm run stage:package -- <deck key> [--format scorm12|xapi|web] [--voice george|alice] [--speed 1] [--out dir]\nDeck keys: ${Object.keys(decks).join(', ')}`);
  process.exit(2);
}
const format = opt('format', 'scorm12');
if (!['scorm12', 'xapi', 'web'].includes(format)) {
  console.error('--format must be scorm12, xapi or web');
  process.exit(2);
}
const voice = opt('voice', 'george');
const speed = opt('speed', '1');
const work = resolve(opt('out', join(app, '..', 'env', 'tmp', 'package', key)));
const site = join(work, format);
rmSync(site, { recursive: true, force: true });
mkdirSync(join(site, 'audio'), { recursive: true });

/* ---------- 1. narration for the self-study slides ---------- */
const input = decks[key];
const slides = slidesFor(input.slides, 'self-study');
const segs = slides.flatMap((s, i) =>
  s.steps.map((st, k) => ({ id: `s${String(i + 1).padStart(2, '0')}-${k + 1}`, slide: s.id, text: (st.speakerNotes ?? '').trim() })),
);
writeFileSync(join(work, 'segments.json'), JSON.stringify(segs.filter((s) => s.text), null, 1));
console.log(`Narration: ${segs.filter((s) => s.text).length} steps, voice ${voice}`);
mkdirSync(join(work, 'voice'), { recursive: true });
const tts = spawnSync('python3', [join(app, 'scripts', 'video', 'tts.py'), 'speak', join(work, 'segments.json'), join(work, 'voice'), join(app, '..', 'env', 'tmp', 'tts'), voice, speed], {
  stdio: 'inherit',
  // Share the video export's cache, so the same notes are never paid for twice.
  env: { ...process.env, TTS_CACHE: join(app, '..', 'env', 'tmp', 'video', key, 'voice-cache') },
});
if (tts.status) process.exit(1);
const audio: Record<string, string[]> = {};
for (const s of segs) {
  audio[s.slide] ??= [];
  if (!s.text) {
    audio[s.slide].push('');
    continue;
  }
  const mp3 = `audio/${s.id}.mp3`;
  const ff = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(work, 'voice', `${s.id}.wav`), '-ac', '1', '-b:a', '96k', join(site, mp3)], { stdio: 'inherit' });
  if (ff.status) process.exit(1);
  audio[s.slide].push(mp3);
}

/* ---------- 2. compile the player; local assets and three.js go in the package ---------- */
const copied = new Set<string>();
const local = (url: string) => {
  if (!url.startsWith('/')) return url; // remote (Supabase Storage) stays remote
  const rel = url.slice(1);
  if (!existsSync(join(app, 'public', rel))) throw new Error(`Asset not found: public${url}`);
  copied.add(rel);
  return rel;
};
const spec = {
  ...input,
  assets: (input.assets ?? []).map((a) => ({ ...a, url: local(a.url), ...(a.urlDark ? { urlDark: local(a.urlDark) } : {}) })),
};
// three.js for motion scenes: in the package by default (an LMS may be offline). --three cdn loads the pinned jsDelivr copy instead.
const cdnThree = opt('three', 'local') === 'cdn';
const deck = compileDeck(spec, { mode: 'self-study', audio, ...(cdnThree ? {} : { sceneLib: './three' }) });
const errs = deck.issues.filter((i) => i.level === 'error');
if (errs.length) {
  for (const e of errs) console.error(`QA error ${e.slideId ?? '-'}: ${e.message}`);
  process.exit(1);
}
for (const rel of copied) {
  if (!deck.html.includes(rel)) continue; // only the assets the slides use
  mkdirSync(dirname(join(site, rel)), { recursive: true });
  copyFileSync(join(app, 'public', rel), join(site, rel));
}
if (!cdnThree && deck.html.includes('type="importmap"')) {
  for (const f of ['build/three.module.js', 'examples/jsm/loaders/GLTFLoader.js', 'examples/jsm/utils/BufferGeometryUtils.js', 'examples/jsm/environments/RoomEnvironment.js']) {
    mkdirSync(dirname(join(site, 'three', f)), { recursive: true });
    copyFileSync(join(app, 'node_modules', 'three', f), join(site, 'three', f));
  }
}
const title = `${deck.spec.module.code} · ${deck.spec.module.title}`;
const adapter = format === 'scorm12' ? 'scorm12.js' : format === 'xapi' ? 'xapi.js' : '';
writeFileSync(join(site, 'index.html'), adapter ? deck.html.replace('</body>', `<script src="${adapter}"></script>\n</body>`) : deck.html);
if (format === 'xapi') {
  const base = opt('activity-base', 'https://avilearn.app/xapi/').replace(/\/?$/, '/');
  const activity = `${base}courses/${encodeURIComponent(key)}`;
  writeFileSync(join(site, 'xapi.js'), xapiJs(activity, title));
  writeFileSync(join(site, 'tincan.xml'), `<?xml version="1.0" encoding="utf-8"?>
<tincan xmlns="http://projecttincan.com/tincan.xsd">
  <activities>
    <activity id="${xml(activity)}" type="http://adlnet.gov/expapi/activities/course">
      <name>${xml(title)}</name>
      <description lang="en-US">${xml(deck.spec.lesson.title)}</description>
      <launch lang="en-US">index.html</launch>
    </activity>
  </activities>
</tincan>
`);
}

/* ---------- 3. SCORM 1.2: LMS adapter and manifest ---------- */
if (format === 'scorm12') {
  writeFileSync(join(site, 'scorm12.js'), scorm12Js());
  const files = spawnSync('find', ['.', '-type', 'f'], { cwd: site, encoding: 'utf8' })
    .stdout.split('\n')
    .filter(Boolean)
    .map((f) => f.replace(/^\.\//, ''))
    .sort();
  writeFileSync(join(site, 'imsmanifest.xml'), manifest(key, title, files));
}

/* ---------- 4. zip ---------- */
const zipPath = join(work, `${key}-${format}.zip`);
rmSync(zipPath, { force: true });
const z = spawnSync('zip', ['-q', '-r', '-X', zipPath, '.'], { cwd: site, stdio: 'inherit' });
if (z.status) process.exit(1);
const kb = Math.round(readFileSync(zipPath).length / 1024);
console.log(`Wrote ${zipPath} (${kb} KB): ${deck.slides.length} slides, ${Object.values(audio).flat().filter(Boolean).length} narration clips, ${deck.slides.filter((s) => s.templateId === 'knowledge-check').length} knowledge checks`);

function xml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function manifest(id: string, name: string, files: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="avilearn-${xml(id)}" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata><schema>ADL SCORM</schema><schemaversion>1.2</schemaversion></metadata>
  <organizations default="org-1">
    <organization identifier="org-1">
      <title>${xml(name)}</title>
      <item identifier="item-1" identifierref="res-1">
        <title>${xml(name)}</title>
        <adlcp:masteryscore>80</adlcp:masteryscore>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res-1" type="webcontent" adlcp:scormtype="sco" href="index.html">
${files.map((f) => `      <file href="${xml(f)}"/>`).join('\n')}
    </resource>
  </resources>
</manifest>
`;
}

/**
 * SCORM 1.2 adapter. Listens to the player's events. Bookmark: cmi.core.lesson_location
 * ("slide-step"); answers in cmi.suspend_data; score.raw = percent right; status passed
 * or failed against the 80% mastery score (completed when the module has no checks).
 * Outside an LMS it does nothing, so the same folder also plays from a plain web server.
 */
function scorm12Js() {
  return `(function(){
function find(w){for(var n=0;w&&n<20;n++){if(w.API)return w.API;if(w.parent===w)break;w=w.parent;}return null;}
var api=find(window)||(window.opener&&find(window.opener));
if(!api)return;
var ok=String(api.LMSInitialize(''))==='true';if(!ok)return;
function set(k,v){api.LMSSetValue(k,String(v));}
var status=api.LMSGetValue('cmi.core.lesson_status');
if(!status||status==='not attempted')set('cmi.core.lesson_status','incomplete');
var loc=/^(\\d+)-(\\d+)$/.exec(api.LMSGetValue('cmi.core.lesson_location')||'');
if(loc&&window.stGo&&!window.stDeepLink)window.stGo(+loc[1]-1,+loc[2]);
var t0=Date.now(),answers={};
try{answers=JSON.parse(api.LMSGetValue('cmi.suspend_data')||'{}').answers||{};}catch(e){}
document.addEventListener('st:progress',function(e){set('cmi.core.lesson_location',(e.detail.slide+1)+'-'+e.detail.step);api.LMSCommit('');});
document.addEventListener('st:answer',function(e){var d=e.detail;if(!d.first)return;answers[d.id]={c:d.choice,ok:d.correct};set('cmi.suspend_data',JSON.stringify({answers:answers}));api.LMSCommit('');});
document.addEventListener('st:complete',function(e){var d=e.detail;
  if(d.max){var pct=Math.round(100*d.score/d.max);set('cmi.core.score.min',0);set('cmi.core.score.max',100);set('cmi.core.score.raw',pct);set('cmi.core.lesson_status',pct>=80?'passed':'failed');}
  else set('cmi.core.lesson_status','completed');
  api.LMSCommit('');});
function hms(ms){var s=Math.round(ms/1000),h=Math.floor(s/3600),m=Math.floor(s%3600/60);s=s%60;function p(n){return(n<10?'0':'')+n;}return p(h)+':'+p(m)+':'+p(s);}
var closed=false;function finish(){if(closed)return;closed=true;set('cmi.core.session_time',hms(Date.now()-t0));api.LMSCommit('');api.LMSFinish('');}
addEventListener('pagehide',finish);addEventListener('beforeunload',finish);
})();`;
}

/**
 * xAPI adapter (Tin Can launch). The LMS opens index.html with endpoint, auth, actor,
 * registration and activity_id in the query string. Outside an LMS it does nothing.
 */
function xapiJs(courseId: string, courseName: string) {
  return `(function(){
var q={};location.search.replace(/^\\?/,'').split('&').forEach(function(p){if(!p)return;var i=p.indexOf('=');q[decodeURIComponent(p.slice(0,i<0?p.length:i))]=i<0?'':decodeURIComponent(p.slice(i+1).replace(/\\+/g,' '));});
if(!q.endpoint||!q.actor)return;
var EP=q.endpoint.replace(/\\/?$/,'/'),AUTH=q.auth||'',REG=q.registration||'',COURSE=q.activity_id||${JSON.stringify(courseId)},NAME=${JSON.stringify(courseName)};
var actor;try{actor=JSON.parse(q.actor);}catch(e){return;}
['name','mbox','mbox_sha1sum','openid','account'].forEach(function(k){if(Array.isArray(actor[k]))actor[k]=actor[k][0];});
/* Older Tin Can launches send account as {accountServiceHomePage, accountName}. */
if(actor.account&&actor.account.accountServiceHomePage){actor.account={homePage:actor.account.accountServiceHomePage,name:actor.account.accountName};}
actor.objectType='Agent';
var t0=Date.now(),seen={},closed=false;
function uuid(){return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16);});}
function hdr(json){var h={'X-Experience-API-Version':'1.0.3'};if(AUTH)h.Authorization=AUTH;if(json)h['Content-Type']='application/json';return h;}
function course(){return {objectType:'Activity',id:COURSE,definition:{type:'http://adlnet.gov/expapi/activities/course',name:{'en-US':NAME}}};}
function send(verb,obj,result){
  var st={id:uuid(),actor:actor,verb:{id:'http://adlnet.gov/expapi/verbs/'+verb,display:{'en-US':verb}},object:obj,timestamp:new Date().toISOString(),context:{}};
  if(REG)st.context.registration=REG;
  if(obj.id!==COURSE)st.context.contextActivities={parent:[{objectType:'Activity',id:COURSE}]};
  if(result)st.result=result;
  try{fetch(EP+'statements',{method:'POST',headers:hdr(true),body:JSON.stringify(st),keepalive:true}).catch(function(){});}catch(e){}
}
function dur(ms){return 'PT'+Math.round(ms/100)/10+'S';}
function stateUrl(){return EP+'activities/state?activityId='+encodeURIComponent(COURSE)+'&agent='+encodeURIComponent(JSON.stringify(actor))+'&stateId=bookmark'+(REG?'&registration='+encodeURIComponent(REG):'');}
send('initialized',course());
/* Resume at the bookmark, unless the address already names a place. */
fetch(stateUrl(),{headers:hdr(false)}).then(function(r){return r.ok?r.json():null;}).then(function(b){
  if(b&&b.slide>=0&&window.stGo&&!window.stDeepLink)window.stGo(b.slide,b.step);}).catch(function(){});
var bm=0;
document.addEventListener('st:progress',function(e){var d=e.detail;
  if(!seen[d.id]){seen[d.id]=1;var el=document.querySelector('.st-slide[data-id="'+d.id+'"]'),h=el&&el.querySelector('.st-h,.st-kc-q,h1,h2');
    send('experienced',{objectType:'Activity',id:COURSE+'/slides/'+encodeURIComponent(d.id),definition:{type:'http://adlnet.gov/expapi/activities/module',name:{'en-US':(h&&h.textContent.trim())||d.id}}});}
  clearTimeout(bm);bm=setTimeout(function(){try{fetch(stateUrl(),{method:'PUT',headers:hdr(true),body:JSON.stringify({slide:d.slide,step:d.step}),keepalive:true}).catch(function(){});}catch(x){}},800);
});
document.addEventListener('st:answer',function(e){var d=e.detail,el=document.querySelector('.st-slide[data-id="'+d.id+'"]');if(!el)return;
  var L='abcdefgh',opts=[].map.call(el.querySelectorAll('.st-kc-opt .st-box-t'),function(o,i){return {id:L[i],description:{'en-US':o.textContent.trim()}};});
  var qx=el.querySelector('.st-kc-q');
  send('answered',{objectType:'Activity',id:COURSE+'/checks/'+encodeURIComponent(d.id),definition:{type:'http://adlnet.gov/expapi/activities/cmi.interaction',interactionType:'choice',
    description:{'en-US':qx?qx.textContent.trim():d.id},choices:opts,correctResponsesPattern:[L[d.answer]]}},
    {response:L[d.choice],success:d.correct,extensions:{'https://avilearn.app/xapi/ext/first-attempt':!!d.first}});
});
document.addEventListener('st:complete',function(e){var d=e.detail,res={completion:true,duration:dur(Date.now()-t0)};
  send('completed',course(),res);
  if(d.max){var s=d.score/d.max;send(s>=0.8?'passed':'failed',course(),{score:{scaled:Math.round(s*100)/100,raw:d.score,min:0,max:d.max},success:s>=0.8,completion:true,duration:dur(Date.now()-t0)});}
});
function finish(){if(closed)return;closed=true;send('terminated',course(),{duration:dur(Date.now()-t0)});}
addEventListener('pagehide',finish);
})();`;
}

