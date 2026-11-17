import { z } from 'zod';
import { esc, s } from '../html';
import { label } from '../schema';
import { IconSchema, iconSvg } from '../icons';
import { STAGE } from '../tokens';
import { FLIGHT_PHASES } from './process';
import { defineTemplate } from './types';

/**
 * Motion scenes: slides that play a timed 2D + live 3D sequence on entry.
 *
 * route-opener (aviation pack): a module opener on a navigation chart. An
 * aircraft (live glTF model, three.js) flies in, turns onto the course and
 * crosses one waypoint per objective. Each objective lights when the nose
 * crosses its waypoint. Each leg lasts as long as it takes to read the
 * objective that just lit (pace in words per second).
 *
 * The page is complete without JavaScript or WebGL: the markup is the end
 * state. The scene script (SCENE_JS) rewinds it to t = 0 and plays it. One
 * pure function at(t) sets every frame, so the video stage can capture exact
 * frames: window.stScene(slideElement, ms).
 */

const D2R = Math.PI / 180;
const C = STAGE.canvas;
const ROSE = { x: 1385, y: 520, r: 320 };
const TURN_R = 230;
const T_D = -430; // course distance (px from the rose centre) where the turn ends
const EXIT_D = 1000;
const ENTRY_Y = C.height + 260;

export interface RouteGeometry {
  C: [number, number];
  r: number;
  u: [number, number];
  S: [number, number];
  O: [number, number];
  T: [number, number];
  R: number;
  TD: number;
  ED: number;
  entryY: number;
  course: number;
  wp: number[];
  edge: number;
}

/** Entry leg (heading 000), a right turn of radius R onto the course, then the course through the rose. */
export function routeGeometry(course: number, n: number): RouteGeometry {
  const u: [number, number] = [Math.sin(course * D2R), -Math.cos(course * D2R)];
  const rn: [number, number] = [Math.cos(course * D2R), Math.sin(course * D2R)];
  const T: [number, number] = [ROSE.x + u[0] * T_D, ROSE.y + u[1] * T_D];
  const O: [number, number] = [T[0] + rn[0] * TURN_R, T[1] + rn[1] * TURN_R];
  const S: [number, number] = [O[0] - TURN_R, O[1]];
  const wp = Array.from({ length: n }, (_, i) => -280 + i * (580 / Math.max(1, n - 1)));
  const edge = Math.min((C.width - ROSE.x) / u[0], ROSE.y / -u[1]);
  return { C: [ROSE.x, ROSE.y], r: ROSE.r, u, S, O, T, R: TURN_R, TD: T_D, ED: EXIT_D, entryY: ENTRY_Y, course, wp, edge };
}

const f1 = (v: number) => Math.round(v * 10) / 10;

export const routeOpener = defineTemplate({
  id: 'route-opener',
  sequence: 'intro',
  purpose:
    'Module opener as a flight on a navigation chart: a live 3D aircraft crosses one waypoint per objective, and each objective lights as it is crossed. Legs are paced to reading time.',
  schema: z.object({
    /** Small label above the title, e.g. "Module 2". */
    label: label(3),
    title: label(8),
    objectives: z.array(z.object({ text: label(8), icon: IconSchema.optional() })).min(2).max(5),
    /** Inbound course through the compass rose, degrees. */
    course: z.number().int().min(20).max(70).default(45),
    /** Asset id of a glTF model (nose along +X). Without it the flight shows the track only. */
    aircraft: z.string().optional(),
    /** Reading pace in words per second. Each leg lasts words / pace + 0.5 s. */
    pace: z.number().min(1.5).max(4).default(2.5),
  }),
  needsAssertion: false,
  parts: () => 1,
  fullView: false,
  render: (d, ctx) => {
    const g = routeGeometry(d.course, d.objectives.length);
    const [cx, cy] = g.C;
    const model = d.aircraft ? ctx.assets.get(d.aircraft) : undefined;
    if (d.aircraft && !model) throw new Error(`Unknown asset "${d.aircraft}"`);
    const words = d.objectives.map((o) => o.text.trim().split(/\s+/).length);
    const cfg = { ...g, words, pace: d.pace, model: model?.url ?? null, alt: model?.alt ?? null, px: 230 };

    const ticks: string[] = [];
    for (let a = 0; a < 360; a += 10) {
      const sx = Math.sin(a * D2R), sy = Math.cos(a * D2R), L = a % 30 ? 12 : 24;
      ticks.push(`<line x1="${f1(cx + g.r * sx)}" y1="${f1(cy - g.r * sy)}" x2="${f1(cx + (g.r + L) * sx)}" y2="${f1(cy - (g.r + L) * sy)}"/>`);
    }
    const end: [number, number] = [cx + g.u[0] * g.ED, cy + g.u[1] * g.ED];
    const track = `M${f1(g.S[0])} ${g.entryY} L${f1(g.S[0])} ${f1(g.S[1])} A${g.R} ${g.R} 0 0 1 ${f1(g.T[0])} ${f1(g.T[1])} L${f1(end[0])} ${f1(end[1])}`;
    const tri = '0,-21 18,11 -18,11';

    return `
    <div class="st-ro" ${s(1)} data-ro="${esc(JSON.stringify(cfg))}">
      <svg class="st-ro-chart" viewBox="0 0 ${C.width} ${C.height}" aria-hidden="true">
        <g class="st-ro-rings">${[g.r / 2, g.r].map((r) => `<circle cx="${cx}" cy="${cy}" r="${r}" pathLength="1"/>`).join('')}</g>
        <g class="st-ro-ticks">${ticks.join('')}</g>
        <g class="st-ro-cards">
          <text x="${cx}" y="${cy - g.r - 48}" text-anchor="middle">360</text>
          <text x="${cx + g.r + 41}" y="${cy + 15}">090</text>
          <text x="${cx - g.r - 41}" y="${cy + 15}" text-anchor="end">270</text>
          <text x="${cx}" y="${cy + g.r + 80}" text-anchor="middle">180</text>
        </g>
        <g class="st-ro-nm"><text x="${cx}" y="${cy + g.r / 2 - 12}">5 NM</text><text x="${cx}" y="${cy + g.r - 12}">10 NM</text></g>
        <path class="st-ro-plan" d="M${f1(g.T[0])} ${f1(g.T[1])} L${f1(end[0])} ${f1(end[1])}"/>
        <path class="st-ro-track" d="${track}"/>
        <g class="st-ro-wps">${g.wp.map((w) => `<polygon class="on" points="${tri}" transform="translate(${f1(cx + g.u[0] * w)} ${f1(cy + g.u[1] * w)})"/>`).join('')}</g>
      </svg>
      <canvas class="st-ro-gl" width="${C.width}" height="${C.height}"${model ? ` role="img" aria-label="${esc(model.alt)}"` : ' aria-hidden="true"'}></canvas>
      <div class="st-ro-head">
        <div class="st-ro-k">${ctx.log.t(1, d.label)}</div>
        <h1 class="st-ro-title"><span>${ctx.log.t(1, d.title)}</span></h1>
      </div>
      <ul class="st-ro-legs">
        ${d.objectives
          .map(
            (o) => `<li class="on">${
              o.icon ? `<span class="st-ro-ic">${iconSvg(o.icon)}</span>` : `<svg class="st-ro-mk" viewBox="0 0 44 44" aria-hidden="true"><polygon points="22,6 39,35 5,35"/></svg>`
            }<span>${ctx.log.t(1, o.text)}</span></li>`,
          )
          .join('')}
      </ul>
    </div>`;
  },
});

/* ---------- flight-profile-scene (aviation pack) ---------- */

/** Side view, slide pixels. Ground and cruise levels, and the five phase columns. */
export const FPS = {
  GY: 800,
  CY: 470,
  px: 190,
  phases: [
    [160, 500],
    [500, 860],
    [860, 1180],
    [1180, 1560],
    [1560, 1800],
  ] as [number, number][],
  a: 250,
  b: 1775,
};
const FPS_PATH = `M250 ${FPS.GY} L560 ${FPS.GY} C670 ${FPS.GY} 720 ${FPS.CY} 880 ${FPS.CY} L1170 ${FPS.CY} C1330 ${FPS.CY} 1410 ${FPS.GY} 1530 ${FPS.GY} L1660 ${FPS.GY}`;
const FPS_LABEL_X = [375, 680, 1020, 1370, 1610];

/**
 * The aircraft (live glTF model) flies the profile gate to gate: taxi,
 * take-off and climb, cruise, descent and landing, taxi in. Each phase card
 * shows when the nose enters the phase, and the aircraft stays in the phase
 * as long as it takes to read it. The latent band shows after parking.
 * Gear objects named GEAR_* retract after lift-off and extend on final.
 * Attitude is a real pitch (up to 15 degrees in the climb, about 2 degrees
 * nose down in the descent, a short flare), not the line's angle: the
 * vertical scale is stretched.
 */
export const flightProfileScene = defineTemplate({
  id: 'flight-profile-scene',
  purpose:
    'Aviation pack. Motion version of phase-of-flight: a live 3D aircraft flies gate to gate and each phase value appears as it reaches that phase, paced to reading time. Same data as phase-of-flight (one value per phase, key, optional latent band).',
  schema: z.object({
    phases: z.array(z.object({ value: label(3), key: z.boolean().optional() })).length(FLIGHT_PHASES.length),
    latent: z.object({ label: label(2).default('Latent'), value: label(4) }).optional(),
    /** Asset id of a glTF model (nose along +X, gear objects named GEAR_*). Without it the scene shows the track only. */
    aircraft: z.string().optional(),
    /** Reading pace in words per second. */
    pace: z.number().min(1.5).max(4).default(2.5),
  }),
  needsAssertion: true,
  parts: () => 1,
  fullView: false,
  render: (d, ctx) => {
    const model = d.aircraft ? ctx.assets.get(d.aircraft) : undefined;
    if (d.aircraft && !model) throw new Error(`Unknown asset "${d.aircraft}"`);
    const w = (t: string) => t.trim().split(/\s+/).length;
    const cfg = {
      GY: FPS.GY,
      CY: FPS.CY,
      px: FPS.px,
      x0: FPS.phases.map((p) => p[0]),
      words: d.phases.map((p, i) => w(p.value) + w(FLIGHT_PHASES[i].label)),
      latent: d.latent ? w(d.latent.label) + w(d.latent.value) : 0,
      pace: d.pace,
      model: model?.url ?? null,
    };
    const { GY, CY } = FPS;
    const bands = FPS.phases.map(([a, b]) => `<rect x="${a}" y="410" width="${b - a}" height="${GY - 340}"/>`).join('');
    const seps = FPS.phases.slice(1).map(([a]) => `<line x1="${a}" y1="420" x2="${a}" y2="${GY + 70}"/>`).join('');
    const labels = FLIGHT_PHASES.map((p, i) => `<text x="${FPS_LABEL_X[i]}" y="${GY + 52}">${ctx.log.t(1, p.label)}</text>`).join('');
    const cardHtml = d.phases
      .map((p, i) => {
        const [a, b] = FPS.phases[i];
        return `<div class="st-fps-card${p.key ? ' st-fps-key' : ''}" style="left:${(a + b) / 2}px;width:${Math.min(300, b - a - 28)}px">${ctx.log.t(1, p.value)}</div>`;
      })
      .join('');
    const ab = [
      ['A', FPS.a],
      ['B', FPS.b],
    ]
      .map(([t, x]) => `<g class="st-fps-ab"><circle cx="${x}" cy="${GY}" r="9"/><text x="${x}" y="${GY + 52}">${t}</text></g>`)
      .join('');
    return `
    <div class="st-fps" ${s(1)} data-fp="${esc(JSON.stringify(cfg))}">
      <svg class="st-fps-chart" viewBox="0 0 ${C.width} ${C.height}" aria-hidden="true">
        <g class="st-fps-bands">${bands}</g>
        <g class="st-fps-seps">${seps}</g>
        <line class="st-fps-gnd" x1="160" y1="${GY}" x2="1800" y2="${GY}" pathLength="1"/>
        ${ab}
        <g class="st-fps-alt"><text x="1812" y="${CY + 8}">FL350</text><text x="1812" y="${GY + 8}">GND</text></g>
        <path class="st-fps-plan" d="${FPS_PATH}"/>
        <path class="st-fps-track" d="${FPS_PATH}"/>
        <ellipse class="st-fps-shadow" cx="1660" cy="${GY + 2}" rx="80" ry="7"/>
        <g class="st-fps-ph">${labels}</g>
      </svg>
      <canvas class="st-fps-gl" width="${C.width}" height="${C.height}"${model ? ` role="img" aria-label="${esc(model.alt)}"` : ' aria-hidden="true"'}></canvas>
      <div class="st-fps-cards">${cardHtml}</div>
      ${
        d.latent
          ? `<div class="st-fps-lat"><b>${ctx.log.t(1, d.latent.label)}</b><span>${ctx.log.t(1, d.latent.value)}</span></div>`
          : ''
      }
    </div>`;
  },
});

/** Templates that need the scene player and three.js. */
export const SCENE_TEMPLATES: string[] = ['route-opener', 'flight-profile-scene'];

/** Pinned three.js for the live 3D layer. Override with compile option sceneLib (e.g. a local copy for offline SCORM). */
export const SCENE_LIB = 'https://cdn.jsdelivr.net/npm/three@0.170.0';

export const SCENE_CSS = `
.t-route-opener .st-in{position:absolute;left:0;top:0;right:0;bottom:0}
.st-ro{position:absolute;left:0;top:0;width:${C.width}px;height:${C.height}px}
.st-ro-chart,.st-ro-gl{position:absolute;left:0;top:0;width:${C.width}px;height:${C.height}px}
.st-ro-gl{pointer-events:none}
.st-ro-rings circle{fill:none;stroke:var(--s-ink);stroke-opacity:.5;stroke-width:2.5;stroke-dasharray:1 0}
.st-ro-ticks line{stroke:var(--s-ink);stroke-opacity:.6;stroke-width:2.5}
.st-ro-cards text{font:600 42px var(--s-font-display);fill:var(--s-ink)}
.st-ro-nm text{font:600 36px var(--s-font-display);fill:var(--s-ink);stroke:var(--s-bg);stroke-width:10px;paint-order:stroke;text-anchor:middle}
.st-ro-plan{fill:none;stroke:var(--s-accent);stroke-width:3;stroke-dasharray:2 14;stroke-linecap:round;opacity:.55}
.st-ro-track{fill:none;stroke:var(--s-accent);stroke-width:5;stroke-linecap:round}
.st-ro-wps polygon{fill:var(--s-bg);stroke:var(--s-accent);stroke-width:4;stroke-linejoin:round}
.st-ro-wps polygon.on{fill:var(--s-accent)}
.st-ro-head{position:absolute;left:${C.safe.x}px;top:150px;width:790px}
.st-ro-k{font:600 44px/1 var(--s-font-display);color:var(--s-accent)}
.st-ro-title{font:700 calc(128px*var(--s-dscale))/.92 var(--s-font-display);text-transform:var(--s-head-case);margin:26px 0 0;overflow:hidden;padding-bottom:6px;text-wrap:balance}
.st-ro-title>span{display:block}
.st-ro-legs{position:absolute;left:${C.safe.x}px;top:640px;width:790px;margin:0;padding:0;list-style:none}
.st-ro-legs li{position:relative;padding-left:76px;min-height:76px;display:flex;align-items:center;font:500 36px/1.15 var(--s-font-body);color:var(--s-ink)}
.st-ro-legs li+li:before{content:'';position:absolute;left:20px;top:-18px;height:32px;border-left:4px dashed var(--s-accent);opacity:var(--dash,1)}
.st-ro-mk,.st-ro-ic{position:absolute;left:0;top:16px;width:44px;height:44px}
.st-ro-mk polygon{fill:var(--s-bg);stroke:var(--s-accent);stroke-width:4;stroke-linejoin:round}
.st-ro-legs li.on .st-ro-mk polygon{fill:var(--s-accent)}
.st-ro-ic{color:var(--s-accent)}.st-ro-ic svg{width:44px;height:44px}

.t-flight-profile-scene .st-body{position:static}
.st-fps{position:absolute;left:-${C.safe.x}px;top:-${C.safe.top}px;width:${C.width}px;height:${C.height}px}
.st-fps-chart,.st-fps-gl{position:absolute;left:0;top:0;width:${C.width}px;height:${C.height}px}
.st-fps-gl{pointer-events:none}
.st-fps-bands rect{fill:var(--s-accent);fill-opacity:.07}
.st-fps-seps line{stroke:var(--s-ink);stroke-opacity:.25;stroke-width:2;stroke-dasharray:6 8}
.st-fps-gnd{stroke:var(--s-ink);stroke-opacity:.55;stroke-width:3}
.st-fps-ab circle{fill:var(--s-bg);stroke:var(--s-ink);stroke-width:3}
.st-fps-ab text{font:700 34px var(--s-font-display);fill:var(--s-ink);text-anchor:middle}
.st-fps-alt text{font:500 22px var(--s-font-mono);fill:var(--s-ink-muted)}
.st-fps-plan{fill:none;stroke:var(--s-accent);stroke-width:3;stroke-dasharray:2 14;stroke-linecap:round;opacity:.55}
.st-fps-track{fill:none;stroke:var(--s-accent);stroke-width:5;stroke-linecap:round}
.st-fps-shadow{fill:var(--s-ink);fill-opacity:.22}
.st-fps-ph text{font:600 30px var(--s-font-display);fill:var(--s-ink);text-anchor:middle}
.st-fps-cards{position:absolute;left:0;top:268px;width:${C.width}px}
.st-fps-card{position:absolute;top:0;transform:translateX(-50%);box-sizing:border-box;padding:18px 22px;border:2px solid var(--s-line);border-radius:${STAGE.radius.box}px;
  background:var(--s-card);color:var(--s-ink);font:600 34px/1.1 var(--s-font-body);text-align:center}
.st-fps-card:after{content:'';position:absolute;left:50%;bottom:-13px;width:20px;height:20px;background:inherit;border:inherit;border-top:0;border-left:0;transform:translateX(-50%) rotate(45deg)}
.st-fps-card.st-fps-key{background:var(--s-accent-fill);border-color:var(--s-accent-fill);color:var(--s-bg)}
.st-fps-lat{position:absolute;left:160px;top:892px;width:1640px;height:54px;box-sizing:border-box;display:flex;align-items:center;gap:28px;padding:0 26px;
  border:2px dashed var(--s-line);border-radius:${STAGE.radius.box}px;background:var(--s-accent-tint)}
.st-fps-lat b{font:700 30px var(--s-font-display);color:var(--s-accent);text-transform:uppercase}
.st-fps-lat span{font:600 30px var(--s-font-body);color:var(--s-ink)}
`;

/**
 * Scene player. Plain script; three.js loads on first play by dynamic import,
 * so a deck without WebGL or network still plays the 2D layer.
 */
export function sceneJs(lib = SCENE_LIB): string {
  return `(function(){
var LIB=${JSON.stringify(lib)};
var D2R=Math.PI/180;
function clamp(v,a,b){a=a||0;b=b===undefined?1:b;return Math.min(b,Math.max(a,v));}
function ease(v){v=clamp(v);return 1-Math.pow(1-v,3);}
function smooth(v){v=clamp(v);return v*v*(3-2*v);}
function span(t,s,d){return clamp((t-s)/d);}
var three=null;
function loadThree(){
  if(!three)three=Promise.all([import(LIB+'/build/three.module.js'),import(LIB+'/examples/jsm/loaders/GLTFLoader.js'),import(LIB+'/examples/jsm/environments/RoomEnvironment.js')])
    .then(function(m){return {T:m[0],GLTFLoader:m[1].GLTFLoader,Room:m[2].RoomEnvironment};});
  return three;
}
function Route(el){
  var g=JSON.parse(el.getAttribute('data-ro')),q=function(s){return el.querySelector(s);},qa=function(s){return [].slice.call(el.querySelectorAll(s));};
  var CX=g.C[0],CY=g.C[1],ux=g.u[0],uy=g.u[1],R=g.R;
  var L1=g.entryY-g.S[1],L2=R*g.course*D2R,LT=L1+L2+(g.ED-g.TD);
  function uOfD(d){return L1+L2+(d-g.TD);}
  function pathAt(u){
    if(u<=L1)return [g.S[0],g.entryY-u,0];
    if(u<=L1+L2){var a=(u-L1)/R;return [g.O[0]-R*Math.cos(a),g.O[1]-R*Math.sin(a),a/D2R];}
    var k=u-L1-L2+g.TD;return [CX+ux*k,CY+uy*k,g.course];
  }
  var TL={chart:250,legs:700,fly:1300,entry:3600,exit:900};
  var KN=[[TL.fly,0]],tk=TL.fly+TL.entry;
  g.wp.forEach(function(d,i){KN.push([tk,uOfD(d)]);tk+=500+1000*g.words[i]/g.pace;});
  KN.push([tk,uOfD(g.edge)]);KN.push([tk+TL.exit,LT]);
  var n=KN.length,dd=[],ms=[];
  for(var i=0;i<n-1;i++)dd.push((KN[i+1][1]-KN[i][1])/(KN[i+1][0]-KN[i][0]));
  ms[0]=dd[0];ms[n-1]=dd[n-2];
  for(i=1;i<n-1;i++)ms[i]=dd[i-1]*dd[i]<=0?0:2/(1/dd[i-1]+1/dd[i]);
  function uAt(t){
    if(t<=KN[0][0])return 0;if(t>=KN[n-1][0])return LT;
    var j=0;while(t>KN[j+1][0])j++;
    var t0=KN[j][0],u0=KN[j][1],t1=KN[j+1][0],u1=KN[j+1][1],h=t1-t0,s=(t-t0)/h,s2=s*s,s3=s2*s;
    return (2*s3-3*s2+1)*u0+(s3-2*s2+s)*h*ms[j]+(-2*s3+3*s2)*u1+(s3-s2)*h*ms[j+1];
  }
  var CROSS=g.wp.map(function(_,i){return KN[i+1][0];}),END=KN[n-1][0]+300;
  var rings=qa('.st-ro-rings circle'),ticks=qa('.st-ro-ticks line'),cards=qa('.st-ro-cards text'),nm=qa('.st-ro-nm text');
  var plan=q('.st-ro-plan'),track=q('.st-ro-track'),wps=qa('.st-ro-wps polygon'),legs=qa('.st-ro-legs li');
  var k=q('.st-ro-k'),title=q('.st-ro-title>span'),trackLen=track.getTotalLength();track.style.strokeDasharray=trackLen;
  var gl=null;
  function initGL(){
    if(!g.model||gl)return;gl={};
    loadThree().then(function(m){
      var T=m.T,canvas=q('.st-ro-gl'),r;
      try{r=new T.WebGLRenderer({canvas:canvas,alpha:true,antialias:true,preserveDrawingBuffer:true});}catch(e){return;}
      r.setPixelRatio(Math.min(2,window.devicePixelRatio||1));r.setSize(${C.width},${C.height},false);
      r.outputColorSpace=T.SRGBColorSpace;r.toneMapping=T.NeutralToneMapping;r.shadowMap.enabled=true;r.shadowMap.type=T.VSMShadowMap;
      var sc=new T.Scene(),pm=new T.PMREMGenerator(r);sc.environment=pm.fromScene(new m.Room(),0.04).texture;sc.environmentIntensity=0.75;
      var cam=new T.OrthographicCamera(0,${C.width},0,-${C.height},1,4000);cam.position.set(0,1500,0);cam.up.set(0,0,-1);cam.lookAt(0,0,0);
      cam.left=0;cam.right=${C.width};cam.top=0;cam.bottom=-${C.height};cam.updateProjectionMatrix();
      var sun=new T.DirectionalLight(0xffffff,2.2);sun.position.set(440,1000,20);sun.target.position.set(960,0,540);
      sun.castShadow=true;var sm=window.stShadowMap||4096;sun.shadow.mapSize.set(sm,sm);Object.assign(sun.shadow.camera,{left:-1400,right:1400,top:1400,bottom:-1400,near:10,far:3000});
      sun.shadow.radius=14;sun.shadow.blurSamples=20;sun.shadow.bias=-0.0004;
      sc.add(sun,sun.target,new T.HemisphereLight(0xdfe9ee,0x6f7f86,0.9));
      var ground=new T.Mesh(new T.PlaneGeometry(6000,6000),new T.ShadowMaterial({color:0x0a1a2e,opacity:0.22}));
      ground.rotation.x=-Math.PI/2;ground.position.set(960,-120,540);ground.receiveShadow=true;sc.add(ground);
      var rig=new T.Group();sc.add(rig);
      new m.GLTFLoader().load(g.model,function(res){
        var md=res.scene;md.traverse(function(o){if(o.isMesh)o.castShadow=true;});
        var box=new T.Box3().setFromObject(md),size=box.getSize(new T.Vector3()),c=box.getCenter(new T.Vector3()),s=g.px/size.x;
        md.scale.setScalar(s);md.position.set(-box.max.x*s,-c.y*s,-c.z*s);rig.add(md);
        gl.draw=function(t){var u=uAt(t),p=pathAt(u),b=25*(smooth((u-(L1-90))/90)-smooth((u-(L1+L2-20))/90));
          rig.position.set(p[0],0,p[1]);rig.rotation.set(b*D2R,(90-p[2])*D2R,2.5*D2R,'YZX');rig.visible=t>TL.fly-50&&u<LT;r.render(sc,cam);};
        gl.draw(last);
      });
    }).catch(function(){});
  }
  var last=END;
  function at(t){
    last=t;
    k.style.opacity=ease(span(t,0,400));k.style.transform='translateY('+(1-ease(span(t,0,400)))*18+'px)';
    title.style.transform='translateY('+(1-ease(span(t,120,700)))*105+'%)';
    rings.forEach(function(c,i){c.style.strokeDasharray='1 1';c.style.strokeDashoffset=1-ease(span(t,TL.chart+i*120,900));});
    ticks.forEach(function(l,i){l.style.opacity=ease(span(t,TL.chart+300+i*12,250));});
    cards.forEach(function(e,i){e.style.opacity=ease(span(t,TL.chart+500+i*90,350));});
    nm.forEach(function(e,i){e.style.opacity=ease(span(t,TL.chart+700+i*90,350));});
    plan.style.opacity=0.55*ease(span(t,TL.chart+600,500));
    legs.forEach(function(li,i){var kin=ease(span(t,TL.legs+i*90,450)),on=smooth(span(t,CROSS[i],450));
      li.style.opacity=kin*(0.34+0.66*on);li.style.transform='translateX('+(1-kin)*-24+'px)';li.classList.toggle('on',on>0.5);li.style.setProperty('--dash',0.34+0.66*on);});
    wps.forEach(function(p,i){var kin=ease(span(t,TL.chart+650+i*80,400)),on=span(t,CROSS[i],450),pop=1+0.22*Math.sin(Math.PI*clamp(on));
      p.style.opacity=kin;p.classList.toggle('on',on>0.25);
      p.setAttribute('transform','translate('+(CX+ux*g.wp[i]).toFixed(1)+' '+(CY+uy*g.wp[i]).toFixed(1)+') scale('+(kin*pop).toFixed(3)+')');});
    track.style.strokeDashoffset=trackLen-Math.min(trackLen,uAt(t));
    if(gl&&gl.draw)gl.draw(t);
  }
  var raf=0;
  function play(){
    cancelAnimationFrame(raf);initGL();
    if(document.documentElement.classList.contains('st-still')){at(END);return;}
    var t0=performance.now();(function loop(now){var t=now-t0;at(t);if(t<END)raf=requestAnimationFrame(loop);})(t0);
  }
  el.closest('.st-slide').addEventListener('st:enter',play);
  el.closest('.st-slide').addEventListener('st:leave',function(){cancelAnimationFrame(raf);});
  return {at:at,end:END,init:initGL};
}
function Profile(el){
  var g=JSON.parse(el.getAttribute('data-fp')),q=function(s){return el.querySelector(s);},qa=function(s){return [].slice.call(el.querySelectorAll(s));};
  var GY=g.GY,CY=g.CY,track=q('.st-fps-track'),plan=q('.st-fps-plan'),gnd=q('.st-fps-gnd'),sh=q('.st-fps-shadow'),lat=q('.st-fps-lat');
  var bands=qa('.st-fps-bands rect'),seps=qa('.st-fps-seps line'),ab=qa('.st-fps-ab'),alts=qa('.st-fps-alt text'),labels=qa('.st-fps-ph text'),cards=qa('.st-fps-card');
  var LT=track.getTotalLength();track.style.strokeDasharray=LT;
  function lenAtX(x){var lo=0,hi=LT;for(var i=0;i<30;i++){var m=(lo+hi)/2;if(track.getPointAtLength(m).x<x)lo=m;else hi=m;}return (lo+hi)/2;}
  var ENTER=g.x0.map(function(x,i){return i?lenAtX(x-g.px/2):0;});
  var T0=1500,KN=[],tk=T0;
  g.words.forEach(function(w,i){KN.push([tk,ENTER[i]]);tk+=Math.max(2600,600+1000*w/g.pace);});
  KN.push([tk,LT]);
  var PARK=tk,LAT_T=PARK+300,END=g.latent?LAT_T+Math.max(2600,1000*g.latent/g.pace):PARK+600;
  var n=KN.length,dd=[],ms=[];
  for(var i=0;i<n-1;i++)dd.push((KN[i+1][1]-KN[i][1])/(KN[i+1][0]-KN[i][0]));
  ms[0]=0;ms[n-1]=0;
  for(i=1;i<n-1;i++)ms[i]=dd[i-1]*dd[i]<=0?0:2/(1/dd[i-1]+1/dd[i]);
  for(i=0;i<n-1;i++){if(!dd[i]){ms[i]=ms[i+1]=0;continue;}var a=ms[i]/dd[i],b=ms[i+1]/dd[i],h2=a*a+b*b;if(h2>9){var sc=3/Math.sqrt(h2);ms[i]=sc*a*dd[i];ms[i+1]=sc*b*dd[i];}}
  function uAt(t){
    if(t<=KN[0][0])return 0;if(t>=KN[n-1][0])return LT;
    var j=0;while(t>KN[j+1][0])j++;
    var t0=KN[j][0],u0=KN[j][1],t1=KN[j+1][0],u1=KN[j+1][1],h=t1-t0,s=(t-t0)/h,s2=s*s,s3=s2*s;
    return (2*s3-3*s2+1)*u0+(s3-2*s2+s)*h*ms[j]+(-2*s3+3*s2)*u1+(s3-s2)*h*ms[j+1];
  }
  function phaseAt(t){var k=-1;for(var j=0;j<g.words.length;j++)if(t>=KN[j][0])k=j;return k;}
  var gl=null,last=END;
  function initGL(){
    if(!g.model||gl)return;gl={};
    loadThree().then(function(m){
      var T=m.T,canvas=q('.st-fps-gl'),r;
      try{r=new T.WebGLRenderer({canvas:canvas,alpha:true,antialias:true,preserveDrawingBuffer:true});}catch(e){return;}
      r.setPixelRatio(Math.min(2,window.devicePixelRatio||1));r.setSize(${C.width},${C.height},false);
      r.outputColorSpace=T.SRGBColorSpace;r.toneMapping=T.NeutralToneMapping;
      var sc=new T.Scene();sc.environment=new T.PMREMGenerator(r).fromScene(new m.Room(),0.04).texture;sc.environmentIntensity=0.8;
      /* side view: screen x = world X, screen y = -world Y; the camera looks 9 degrees down so the wing reads */
      var cam=new T.OrthographicCamera(0,${C.width},0,-${C.height},1,6000),tilt=9*D2R;
      cam.position.set(0,Math.sin(tilt)*3000,Math.cos(tilt)*3000);cam.lookAt(0,0,0);
      cam.left=0;cam.right=${C.width};cam.top=0;cam.bottom=-${C.height};cam.updateProjectionMatrix();
      var sun=new T.DirectionalLight(0xffffff,2.4);sun.position.set(-600,900,900);
      sc.add(sun,new T.HemisphereLight(0xe3ecf0,0x6b7b82,1.0));
      var rig=new T.Group(),gear=[];sc.add(rig);
      new m.GLTFLoader().load(g.model,function(res){
        var md=res.scene;md.traverse(function(o){if(o.name&&o.name.indexOf('GEAR_')===0)gear.push(o);});
        var box=new T.Box3().setFromObject(md),size=box.getSize(new T.Vector3()),c=box.getCenter(new T.Vector3()),s=g.px/size.x;
        md.scale.setScalar(s);md.position.set(-c.x*s,-box.min.y*s,-c.z*s);rig.add(md);
        gl.draw=function(t){
          var u=uAt(t),p=track.getPointAtLength(u),p2=track.getPointAtLength(Math.min(LT,u+6)),p1=track.getPointAtLength(Math.max(0,u-6));
          var ang=Math.atan2(p1.y-p2.y,p2.x-p1.x)/D2R,pd=ang>0?Math.min(15,ang*0.3):Math.max(-2.5,ang*0.06),hg=GY-p.y;
          if(ang<0&&hg<60)pd=3*(1-hg/60)*(hg>2?1:0)+pd*hg/60;
          rig.position.set(p.x,-p.y,0);rig.rotation.set(0,0,pd*D2R);
          var up=p.x>600&&p.x<1400;gear.forEach(function(o){o.visible=!up;});
          rig.visible=t>T0-400;r.render(sc,cam);
        };
        gl.draw(last);
      });
    }).catch(function(){});
  }
  function at(t){
    last=t;
    gnd.style.strokeDasharray='1 1';gnd.style.strokeDashoffset=1-ease(span(t,200,800));
    ab.forEach(function(e,i){e.style.opacity=ease(span(t,500+i*150,400));});
    alts.forEach(function(e,i){e.style.opacity=ease(span(t,700+i*120,400));});
    plan.style.opacity=0.55*ease(span(t,600,600));
    seps.forEach(function(e,i){e.style.opacity=ease(span(t,700+i*80,400));});
    var cur=phaseAt(t);
    cards.forEach(function(cd,i){
      var kin=ease(span(t,800+i*90,400)),on=ease(span(t,KN[i][0],500)),act=i===cur&&t<PARK?1:0;
      labels[i].style.opacity=kin*(0.34+0.66*on);
      bands[i].style.fillOpacity=(0.07*smooth(span(t,KN[i][0],500))*(act||t>=PARK?1:0.45)).toFixed(3);
      cd.style.opacity=on;cd.style.transform='translateX(-50%) translateY('+((1-on)*22).toFixed(1)+'px)';
    });
    if(lat){var lk=ease(span(t,LAT_T,600));lat.style.opacity=lk;lat.style.clipPath='inset(0 '+((1-lk)*100).toFixed(1)+'% 0 0)';}
    var u=uAt(t),p=track.getPointAtLength(u),hgt=clamp((GY-p.y)/(GY-CY));
    track.style.strokeDashoffset=LT-u;
    sh.setAttribute('cx',p.x.toFixed(1));sh.setAttribute('rx',(80*(1-0.55*hgt)).toFixed(1));
    sh.style.fillOpacity=(0.22*(1-hgt)).toFixed(3);sh.style.opacity=g.model?ease(span(t,T0-400,400)):0;
    if(gl&&gl.draw)gl.draw(t);
  }
  var raf=0;
  function play(){
    cancelAnimationFrame(raf);initGL();
    if(document.documentElement.classList.contains('st-still')){at(END);return;}
    var t0=performance.now();(function loop(now){var t=now-t0;at(t);if(t<END)raf=requestAnimationFrame(loop);})(t0);
  }
  el.closest('.st-slide').addEventListener('st:enter',play);
  el.closest('.st-slide').addEventListener('st:leave',function(){cancelAnimationFrame(raf);});
  return {at:at,end:END,init:initGL};
}
var players=new Map();
[].slice.call(document.querySelectorAll('.st-ro')).forEach(function(el){players.set(el.closest('.st-slide'),Route(el));});
[].slice.call(document.querySelectorAll('.st-fps')).forEach(function(el){players.set(el.closest('.st-slide'),Profile(el));});
/* The presenter showed the first slide before this script ran: start a scene that is already on screen. */
players.forEach(function(_,sl){if(!sl.hidden){sl._on=true;sl.dispatchEvent(new Event('st:enter'));}});
/* Frame capture for the video stage: window.stScene(slideEl, ms) sets that frame. */
window.stScene=function(slide,ms){var p=players.get(slide);if(!p)return null;p.init();p.at(ms);return p.end;};
})();`;
}
