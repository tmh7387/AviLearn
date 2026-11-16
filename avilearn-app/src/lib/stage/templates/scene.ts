import { z } from 'zod';
import { esc, s } from '../html';
import { label } from '../schema';
import { IconSchema, iconSvg } from '../icons';
import { STAGE } from '../tokens';
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
      sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);Object.assign(sun.shadow.camera,{left:-1400,right:1400,top:1400,bottom:-1400,near:10,far:3000});
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
var players=new Map();
[].slice.call(document.querySelectorAll('.st-ro')).forEach(function(el){players.set(el.closest('.st-slide'),Route(el));});
/* The presenter showed the first slide before this script ran: start a scene that is already on screen. */
players.forEach(function(_,sl){if(!sl.hidden){sl._on=true;sl.dispatchEvent(new Event('st:enter'));}});
/* Frame capture for the video stage: window.stScene(slideEl, ms) sets that frame. */
window.stScene=function(slide,ms){var p=players.get(slide);if(!p)return null;p.init();p.at(ms);return p.end;};
})();`;
}
