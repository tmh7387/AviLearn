import { STAGE } from './tokens';

/**
 * Presenter runtime, inlined into every compiled deck. Plain ES2017, no
 * dependencies, so the deck runs offline and inside SCORM players.
 *
 * Keys: Space / Right / PageDown / click = next step; Left / PageUp = back;
 * Home / End; F = full screen; D = light/dark; N = speaker notes.
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
function apply(changed){
  var el=slides[i],n=meta.steps[i],full=meta.full[i]&&k===n;
  slides.forEach(function(s,j){s.hidden=j!==i;});
  [].forEach.call(el.querySelectorAll('[data-s]'),function(e){
    var s=+e.getAttribute('data-s');e.classList.remove('st-fut','st-act','st-past');
    e.classList.add(full?'st-act':s>k?'st-fut':s===k?'st-act':'st-past');});
  if(changed){el.classList.add('st-enter');el.classList.remove('st-play');void el.offsetWidth;el.classList.remove('st-enter');
    if(el.classList.contains('t-title-bumper'))el.classList.add('st-play');}
  notesTx.textContent=meta.notes[i][k-1]||'';
  pos.textContent=(i+1)+'/'+slides.length+' · '+k+'/'+n;
  try{history.replaceState(null,'','#'+(i+1)+'-'+k);}catch(e){}
}
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
  else if(key==='f'||key==='F'){fs();}else if(key==='d'||key==='D'){theme();}else if(key==='n'||key==='N'){notes();}
});
document.querySelector('.st-stage').addEventListener('click',next);
hud.addEventListener('click',function(e){e.stopPropagation();var a=e.target.getAttribute&&e.target.getAttribute('data-a');
  if(a==='prev')prev();else if(a==='next')next();else if(a==='notes')notes();else if(a==='theme')theme();else if(a==='fs')fs();});
document.addEventListener('mousemove',showHud);
addEventListener('resize',fit);
var saved=store('stage-theme');setTheme(saved==='dark'||saved==='light'?saved:meta.theme);
var m=/^#(\\d+)-(\\d+)$/.exec(location.hash);fit();
if(m)go(+m[1]-1,+m[2]);else go(0,1);
})();`;
