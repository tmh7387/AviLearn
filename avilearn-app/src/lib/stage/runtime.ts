import { STAGE } from './tokens';

/**
 * Presenter runtime, inlined into every compiled deck. Plain ES2017, no
 * dependencies, so the deck runs offline and inside SCORM players.
 *
 * Keys: Space / Right / PageDown / click = next step; Left / PageUp = back;
 * Home / End; F = full screen; D = light/dark; N = speaker notes; M = motion on/off.
 * The address keeps the place as #<slide>-<step>.
 */
export const PRESENTER_JS = `(function(){
var W=${STAGE.canvas.width},H=${STAGE.canvas.height},SLIDE_MS=${STAGE.motion.slide};
var root=document.documentElement,deck=document.querySelector('.st-deck');
var slides=[].slice.call(deck.querySelectorAll('.st-slide'));
var meta=JSON.parse(document.getElementById('st-meta').textContent);
var notesEl=document.querySelector('.st-notes'),notesTx=notesEl.querySelector('p'),pos=document.querySelector('.st-pos'),hud=document.querySelector('.st-hud');
var i=0,k=1,hudTimer=0;
function fit(){deck.style.setProperty('--k',Math.min(innerWidth/W,innerHeight/H));}
function store(key,val){try{if(val===undefined)return localStorage.getItem(key);localStorage.setItem(key,val);}catch(e){return null;}}
function setTheme(t){root.setAttribute('data-theme',t);store('stage-theme',t);}
var MO=${JSON.stringify(STAGE.motion)};
var still=false;
try{still=matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){}
function verbMs(v){return MO.verbs[(v||'reveal').replace(/-[xv]$/,'')]||MO.enter;}
function stateOf(e){return e.classList.contains('st-act')?'act':e.classList.contains('st-past')?'past':'fut';}
/* Count: a number counts up from 0 to its value; text around the number stays. */
function count(e,delay){
  var full=e.getAttribute('data-v');if(full===null){full=e.textContent;e.setAttribute('data-v',full);}
  var m=/^(\\D*?)(\\d[\\d,]*(?:\\.\\d+)?)(.*)$/.exec(full);if(!m||still){e.textContent=full;return;}
  var target=parseFloat(m[2].replace(/,/g,'')),dec=(m[2].split('.')[1]||'').length,dur=MO.verbs.count,t0=0;
  e.textContent=m[1]+(0).toFixed(dec)+m[3];
  function fmt(v){var s=v.toFixed(dec);return m[2].indexOf(',')>=0?Number(s).toLocaleString('en-US',{minimumFractionDigits:dec,maximumFractionDigits:dec}):s;}
  function tick(t){if(!t0)t0=t;var p=Math.min(1,(t-t0-delay)/dur);if(p<0){requestAnimationFrame(tick);return;}
    var q=1-Math.pow(1-p,3);e.textContent=p>=1?full:m[1]+fmt(target*q)+m[3];if(p<1)requestAnimationFrame(tick);}
  requestAnimationFrame(tick);
}
function apply(changed){
  var el=slides[i],n=meta.steps[i],full=meta.full[i]&&k===n,seq=el.getAttribute('data-seq');
  var parts=[].slice.call(el.querySelectorAll('[data-s]'));
  if(changed){parts.forEach(function(e){e.classList.remove('st-act','st-past');e.classList.add('st-fut');});}
  slides.forEach(function(s,j){s.hidden=j!==i;});
  if(changed)void el.getBoundingClientRect();
  var movers=[];
  parts.forEach(function(e){
    var s=+e.getAttribute('data-s'),was=stateOf(e),now=full?'act':s>k?'fut':s===k?'act':'past';
    e.classList.remove('st-fut','st-act','st-past');e.classList.add('st-'+now);
    e.style.transitionDelay='';
    [].forEach.call(e.querySelectorAll('[data-m]'),function(c){c.style.transitionDelay='';});
    if(now==='act'&&was==='fut'){
      var kids=[].slice.call(e.querySelectorAll('[data-m]'));
      if(kids.length){kids.forEach(function(c,j){movers.push({e:c,part:j===0?e:null});});}
      else movers.push({e:e,part:null});
    }
  });
  /* Stagger: 120 ms apart, squeezed so the step ends inside 1200 ms. Branded sequences spread over their own time. */
  var longest=movers.reduce(function(a,mv){return Math.max(a,verbMs(mv.e.getAttribute('data-m')));},MO.enter);
  var gap=movers.length<2?0:seq?Math.min(400,(MO.sequences[seq]-longest)/(movers.length-1)):Math.min(MO.stagger,(MO.maxMove-longest)/(movers.length-1));
  if(!still)movers.forEach(function(mv,j){var d=Math.max(0,Math.round(j*gap))+'ms';mv.e.style.transitionDelay=d;if(mv.part)mv.part.style.transitionDelay=d;});
  movers.forEach(function(mv,j){if(mv.e.getAttribute('data-m')==='count')count(mv.e,still?0:j*gap);});
  if(changed){el.classList.add('st-enter');el.classList.remove('st-play');void el.offsetWidth;el.classList.remove('st-enter');el.classList.add('st-play');}
  notesTx.textContent=meta.notes[i][k-1]||'';
  pos.textContent=(i+1)+'/'+slides.length+' · '+k+'/'+n;
  try{history.replaceState(null,'','#'+(i+1)+'-'+k);}catch(e){}
}
function motion(){still=!still;root.classList.toggle('st-still',still);store('stage-still',still?'1':'0');showHud();}
function next(){if(k<meta.steps[i]){k++;apply(false);}else if(i<slides.length-1){i++;k=1;apply(true);}}
function prev(){if(k>1){k--;apply(false);}else if(i>0){i--;k=meta.steps[i];apply(true);}}
function go(j,s){i=Math.max(0,Math.min(slides.length-1,j));k=Math.max(1,Math.min(meta.steps[i],s||1));apply(true);}
function fs(){try{if(document.fullscreenElement)document.exitFullscreen();else root.requestFullscreen().catch(function(){});}catch(e){}}
function notes(){notesEl.hidden=!notesEl.hidden;}
function theme(){setTheme(root.getAttribute('data-theme')==='dark'?'light':'dark');}
function showHud(){hud.classList.add('on');clearTimeout(hudTimer);hudTimer=setTimeout(function(){hud.classList.remove('on');},2200);}
document.addEventListener('keydown',function(e){
  if(e.altKey||e.ctrlKey||e.metaKey)return;var key=e.key;
  if(key===' '||key==='ArrowRight'||key==='PageDown'||key==='ArrowDown'){e.preventDefault();if(e.target&&e.target.blur)e.target.blur();next();}
  else if(key==='ArrowLeft'||key==='PageUp'||key==='ArrowUp'){e.preventDefault();prev();}
  else if(key==='Home'){go(0,1);}else if(key==='End'){go(slides.length-1,meta.steps[slides.length-1]);}
  else if(key==='f'||key==='F'){fs();}else if(key==='d'||key==='D'){theme();}else if(key==='n'||key==='N'){notes();}else if(key==='m'||key==='M'){motion();}
});
document.querySelector('.st-stage').addEventListener('click',next);
hud.addEventListener('click',function(e){e.stopPropagation();var a=e.target.getAttribute&&e.target.getAttribute('data-a');
  if(a==='prev')prev();else if(a==='next')next();else if(a==='notes')notes();else if(a==='theme')theme();else if(a==='fs')fs();else if(a==='motion')motion();});
document.addEventListener('mousemove',showHud);
addEventListener('resize',fit);
if(store('stage-still')==='1')still=true;root.classList.toggle('st-still',still);
var saved=store('stage-theme');setTheme(saved==='dark'||saved==='light'?saved:meta.theme);
var m=/^#(\\d+)-(\\d+)$/.exec(location.hash);fit();
if(m)go(+m[1]-1,+m[2]);else go(0,1);
})();`;
