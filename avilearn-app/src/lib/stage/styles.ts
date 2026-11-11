import { STAGE, themeCssVars } from './tokens';

/**
 * CSS for the slide canvas (1920 x 1080 px) and the presenter chrome.
 * Every colour is a token variable; the QA colour audit relies on that.
 */

const T = STAGE.type;
const F = STAGE.fonts;
const C = STAGE.canvas;
const M = STAGE.motion;

export function themeBlocks(scope = ':root'): string {
  return (
    `${scope},${scope}[data-theme="light"]{${themeCssVars('light')}}` +
    `${scope}[data-theme="dark"]{${themeCssVars('dark')}}`
  );
}

export const SLIDE_CSS = `
.st-slide{position:absolute;left:0;top:0;width:${C.width}px;height:${C.height}px;overflow:hidden;box-sizing:border-box;
  background-color:var(--s-bg);color:var(--s-ink);font-family:${F.body};font-size:${T.body}px;line-height:1.2;
  background-image:linear-gradient(var(--s-grid) 1px,transparent 1px),linear-gradient(90deg,var(--s-grid) 1px,transparent 1px);
  background-size:${C.gridStep}px ${C.gridStep}px}
.st-slide *,.st-slide *::before,.st-slide *::after{box-sizing:border-box}
.st-in{position:absolute;left:${C.safe.x}px;right:${C.safe.x}px;top:${C.safe.top}px;bottom:${C.safe.bottom}px;display:flex;flex-direction:column;gap:28px}
.st-eyebrow{font:600 ${T.eyebrow}px/1 ${F.mono};letter-spacing:.12em;text-transform:uppercase;color:var(--s-teal)}
.st-h{font:600 ${T.headline}px/1.06 ${F.display};text-transform:uppercase;letter-spacing:.005em;margin:0;max-width:1450px;text-wrap:balance}
.st-body{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;position:relative}
.st-foot{position:absolute;left:${C.safe.x}px;right:${C.safe.x}px;bottom:48px;display:flex;justify-content:space-between;align-items:center;
  font:500 ${T.footer}px/1 ${F.mono};letter-spacing:.06em;color:var(--s-ink-muted)}
.st-mark{display:flex;align-items:center;gap:12px;font:600 24px/1 ${F.body};letter-spacing:0;color:var(--s-ink)}
.st-mark-ico{width:34px;height:34px}

/* step states: future hidden, active 100%, past 30%. With no script, everything shows (full view). */
.st-slide [data-s]{transition:opacity ${M.step}ms ${M.ease},transform ${M.step}ms ${M.ease}}
.st-slide .st-fut{opacity:${STAGE.steps.future};transform:translateY(15px)}
.st-slide .st-act{opacity:${STAGE.steps.active}}
.st-slide .st-past{opacity:${STAGE.steps.past}}
.st-slide .st-past[data-keep]{opacity:${STAGE.steps.structurePast}}

/* shared parts */
.st-hot{background:var(--s-teal-tint)!important;border-color:var(--s-teal)!important}
.st-hot .st-row-k,.st-hot .st-box-n,.st-hot .st-box-k,.st-hot-text,.st-hot-text *{color:var(--s-teal)}
.st-box{position:relative;border:${STAGE.stroke.box}px solid var(--s-line);background:var(--s-card);border-radius:${STAGE.radius.box}px;padding:28px 26px;display:flex;flex-direction:column;gap:14px}
.st-box-n{font:700 76px/1 ${F.display};color:var(--s-ink-muted)}
.st-box-k{font:600 24px/1.1 ${F.mono};letter-spacing:.08em;text-transform:uppercase;color:var(--s-ink-muted)}
.st-box-t{font:500 ${T.body}px/1.15 ${F.body}}
.st-cb{fill:none;stroke:var(--s-teal);stroke-width:2.5}
.st-tk{fill:none;stroke:var(--s-teal);stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round}
.st-chip{font:600 30px/1 ${F.mono};padding:12px 26px;border:${STAGE.stroke.box}px solid var(--s-line);border-radius:999px}
.st-chip.st-hot{color:var(--s-teal)}

/* title-bumper */
.st-rose{position:absolute;right:${C.safe.x}px;top:${C.safe.top}px;width:420px;height:420px}
.st-rose-needle{transform-box:view-box;transform-origin:100px 100px}
.st-play .st-rose-needle{animation:st-north ${M.bumper}ms ${M.ease} both}
@keyframes st-north{from{transform:rotate(-140deg)}to{transform:rotate(0)}}
.st-tone-sober .st-rose{display:none}
.t-title-bumper .st-body{justify-content:flex-end;padding-bottom:40px}
.st-tb{display:flex;flex-direction:column;gap:28px;max-width:1300px}
.st-tb-meta{font:600 ${T.eyebrow}px/1 ${F.mono};letter-spacing:.12em;text-transform:uppercase;color:var(--s-teal)}
.st-tb-title{font:700 ${T.title}px/.95 ${F.display};text-transform:uppercase;margin:0;text-wrap:balance}
.st-tb-sub{font:500 44px/1.2 ${F.body};color:var(--s-ink-muted);margin:0;max-width:1100px}

/* section-divider */
.st-sd{display:flex;flex-direction:column;gap:12px}
.st-sd-num{font:700 220px/1 ${F.display};color:var(--s-teal)}
.st-sd-title{font:600 110px/1 ${F.display};text-transform:uppercase;margin:0;max-width:1450px;text-wrap:balance}

/* lists: agenda, objectives, summary */
.st-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:16px}
.st-agenda{display:grid;grid-template-columns:1fr 1fr;gap:16px 32px}
.st-row{display:flex;align-items:center;gap:28px;padding:20px 28px;border:${STAGE.stroke.box}px solid var(--s-line);background:var(--s-card);border-radius:${STAGE.radius.box}px}
.st-row-k{font:600 32px/1 ${F.mono};color:var(--s-teal);min-width:56px;display:flex}
.st-row-k svg{width:48px;height:48px}
.st-row-v{font:500 42px/1.15 ${F.body}}

/* questions */
.st-q{display:flex;flex-direction:column;gap:24px}
.st-q-big{font:700 220px/1 ${F.display};text-transform:uppercase}
.st-q-sub{font:500 44px/1.2 ${F.body};color:var(--s-ink-muted);margin:0}

/* images */
.st-img{margin:0;flex:1;min-height:0;display:flex;flex-direction:column;gap:16px}
.st-img img{flex:1;min-height:0;width:100%;object-fit:contain;border-radius:6px}
.st-img figcaption{font:600 ${T.eyebrow}px/1.2 ${F.mono};color:var(--s-ink-muted)}
.st-ann{flex:1;min-height:0;display:grid;grid-template-columns:1fr 560px;gap:56px;align-items:center}
.st-ann-frame{position:relative;justify-self:center;line-height:0}
.st-ann-frame img{display:block;max-width:100%;max-height:600px;border-radius:6px}
.st-ann-pin{position:absolute;transform:translate(-50%,-50%);line-height:1}
.st-ann-dot{display:inline-flex;flex:none;width:58px;height:58px;border-radius:50%;background:var(--s-teal-fill);color:var(--s-bg);font:700 30px/1 ${F.mono};align-items:center;justify-content:center;box-shadow:0 0 0 5px var(--s-bg)}
.st-ann-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:28px}
.st-ann-list li{display:flex;align-items:center;gap:24px;font:600 40px/1.15 ${F.body}}

/* hero-number, split-contrast */
.st-hero{display:flex;flex-direction:column;gap:20px}
.st-hero-v{font:700 ${T.hero * 1.4}px/1 ${F.display};color:var(--s-teal);font-variant-numeric:tabular-nums}
.st-hero-u{font-size:.38em;color:var(--s-ink-muted);margin-left:16px}
.st-hero-l{font:500 48px/1.2 ${F.body}}
.st-split{display:grid;grid-template-columns:1fr 4px 1fr;gap:80px;align-items:center}
.st-split-rule{align-self:stretch;background:var(--s-line);opacity:.35}
.st-split-v{font:700 ${T.hero}px/1 ${F.display};font-variant-numeric:tabular-nums}
.st-split-l{font:500 44px/1.2 ${F.body};margin-top:16px}

/* quote-reference */
.st-quote{margin:0;border-left:10px solid var(--s-teal-fill);padding:8px 0 8px 48px}
.st-quote p{font:500 52px/1.25 ${F.body};margin:0;max-width:1400px}
.st-quote cite{display:block;margin-top:28px;font:600 28px/1 ${F.mono};font-style:normal;letter-spacing:.06em;color:var(--s-teal)}

/* procedure-flow, cause-chain */
.st-flow{display:grid;grid-template-columns:repeat(var(--n),1fr);gap:48px;align-items:stretch}
.st-flow-node{min-height:340px}
.st-flow-node:not(:last-child)::after{content:"";position:absolute;right:-36px;top:50%;width:22px;height:22px;
  border-top:5px solid var(--s-line);border-right:5px solid var(--s-line);transform:translateY(-50%) rotate(45deg)}

/* checklist */
.st-checks{display:grid;grid-template-columns:1fr 1fr;gap:32px}
.st-checks-3{grid-template-columns:1fr 1fr 1fr}
.st-check{display:flex;align-items:center;gap:32px;border:${STAGE.stroke.box}px solid var(--s-line);background:var(--s-card);border-radius:${STAGE.radius.box}px;padding:40px 40px}
.st-check svg{flex:none;width:64px;height:64px}
.st-check span{font:600 56px/1.05 ${F.display};text-transform:uppercase}
.st-checks-3 .st-check{padding:36px 28px;gap:24px}
.st-checks-3 .st-check span{font-size:44px}

/* flight-timeline */
.st-tl{position:relative;height:520px}
.st-tl-axis{position:absolute;left:0;right:0;top:50%;height:${STAGE.stroke.main}px;margin-top:-2px;background:var(--s-line)}
.st-tl-pin{position:absolute;top:50%;width:340px;margin-left:-170px;text-align:center}
.st-tl-dot{position:absolute;left:50%;top:-16px;margin-left:-16px;width:32px;height:32px;border-radius:50%;background:var(--s-bg);border:6px solid var(--s-teal-fill)}
.st-tl-at,.st-tl-l{position:absolute;left:0;right:0}
.st-tl-at{font:600 28px/1 ${F.mono};color:var(--s-ink-muted)}
.st-tl-l{font:600 38px/1.12 ${F.body}}
.st-up .st-tl-l{bottom:44px}.st-up .st-tl-at{top:44px}
.st-down .st-tl-l{top:44px}.st-down .st-tl-at{bottom:44px}

/* knowledge-check */
.st-kc{display:flex;flex-direction:column;gap:44px}
.st-kc-q{font:600 54px/1.15 ${F.body};margin:0;max-width:1500px}
.st-kc-opts{display:grid;grid-template-columns:1fr 1fr;gap:28px}
.st-kc-opt{flex-direction:row;align-items:center;gap:28px}
.st-kc-k{font:600 40px/1 ${F.mono};color:var(--s-teal);width:44px;flex:none}
.st-kc-mark{position:absolute;inset:-${STAGE.stroke.box}px;border:6px solid var(--s-teal);background:var(--s-teal-tint);border-radius:${STAGE.radius.box}px;pointer-events:none}

/* exercise-launch */
.st-ex{display:flex;flex-direction:column;gap:30px}
.st-ex-k{font:600 26px/1 ${F.mono};letter-spacing:.12em;text-transform:uppercase;color:var(--s-teal)}
.st-ex-title{font:700 110px/1 ${F.display};text-transform:uppercase;margin:0;max-width:1500px;text-wrap:balance}
.st-ex-task{font:500 46px/1.2 ${F.body};margin:0;max-width:1400px}
.st-ex-facts{display:flex;gap:20px;flex-wrap:wrap}
.st-ex-url{font:600 34px/1 ${F.mono};color:var(--s-ink)}

/* illustrations (code-drawn, token colours) */
.st-illo{display:block;width:100%;height:auto}
.st-img .st-illo{flex:1;min-height:0;height:100%}
.st-ann-frame{width:100%;max-width:1060px}

/* shared numbered boxes */
.st-boxes{display:grid;grid-template-columns:repeat(var(--n),1fr);gap:32px;align-items:stretch}
.st-box-h{font:600 50px/1.02 ${F.display};text-transform:uppercase}

/* course-title */
.t-course-title .st-body,.t-module-opener .st-body,.t-break .st-body,.t-day-close .st-body,.t-facilitator .st-body{justify-content:center}
.st-ct{display:grid;grid-template-columns:1fr 1.3fr;gap:56px;align-items:center}
.st-ct-art{margin-right:-${C.safe.x}px}
.st-ct-org{font:600 ${T.eyebrow}px/1 ${F.mono};letter-spacing:.12em;text-transform:uppercase;color:var(--s-teal)}
.st-ct-title{font:700 116px/.95 ${F.display};text-transform:uppercase;margin:28px 0 0;text-wrap:balance}
.st-ct-sub{font:500 44px/1.2 ${F.body};color:var(--s-ink-muted);margin:28px 0 0}
.st-ct-client{font:600 42px/1.2 ${F.body};margin:14px 0 0}
.st-ct-facts{display:flex;flex-direction:column;gap:14px;margin-top:48px;font:600 30px/1.2 ${F.mono};color:var(--s-ink-muted)}

/* facilitator */
.st-fac{display:grid;grid-template-columns:1fr 1fr;gap:88px;align-items:center}
.st-fac-photo{display:block;width:240px;height:240px;border-radius:50%;object-fit:cover;margin-bottom:32px;border:5px solid var(--s-teal-fill)}
.st-fac-k{font:600 ${T.eyebrow}px/1 ${F.mono};letter-spacing:.12em;text-transform:uppercase;color:var(--s-teal)}
.st-fac-name{font:700 116px/.95 ${F.display};text-transform:uppercase;margin-top:24px}
.st-fac-role{font:500 42px/1.2 ${F.body};color:var(--s-ink-muted);margin-top:24px}
.st-fac-list .st-row-v{font-size:38px}

/* course-materials */
.st-mat{display:flex;gap:88px;align-items:center}
.st-qr{width:440px;height:440px;flex:none;border:${STAGE.stroke.box}px solid var(--s-line)}
[data-theme="dark"] .st-qr{filter:invert(1) hue-rotate(180deg)}
.st-mat-url{font:600 66px/1.1 ${F.mono};color:var(--s-teal);word-break:break-all}
.st-mat-codes{display:flex;gap:28px;margin-top:56px;flex-wrap:wrap}
.st-mat-code{display:flex;flex-direction:column;gap:12px;padding:24px 32px;border:${STAGE.stroke.box}px solid var(--s-line);background:var(--s-card);border-radius:${STAGE.radius.box}px}
.st-mat-code span{font:600 24px/1 ${F.mono};letter-spacing:.1em;text-transform:uppercase;color:var(--s-ink-muted)}
.st-mat-code b{font:700 60px/1 ${F.display}}

/* module-opener */
.st-mo{display:grid;grid-template-columns:520px 1fr;gap:96px;align-items:center}
.t-module-opener::before{content:"";position:absolute;left:0;top:0;bottom:0;width:610px;background:var(--s-teal-tint);border-right:4px solid var(--s-teal-fill)}
.st-mo-panel{position:absolute;left:-${C.safe.x}px;top:-${C.safe.top}px;bottom:0;width:610px;display:flex;align-items:center;justify-content:center;padding:48px}
.st-mo-panel.st-mo-wide{justify-content:flex-end;overflow:hidden;padding:48px 32px 48px 0}
.st-mo-wide .st-illo{flex:none;width:175%}
.st-mo-text{grid-column:2}
.st-mo-k{font:600 32px/1 ${F.mono};letter-spacing:.12em;text-transform:uppercase;color:var(--s-teal)}
.st-mo-title{font:700 100px/.98 ${F.display};text-transform:uppercase;margin:22px 0 44px;text-wrap:balance}
.st-mo-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:24px}
.st-mo-list li{position:relative;padding-left:48px;font:500 38px/1.2 ${F.body}}
.st-mo-list li::before{content:"";position:absolute;left:2px;top:.42em;width:18px;height:18px;background:var(--s-teal-fill);transform:rotate(45deg)}

/* key-points */
.st-kp-lead{margin:0 0 44px;border-left:8px solid var(--s-teal-fill);padding-left:28px;font:500 44px/1.2 ${F.body};color:var(--s-ink-muted)}
.t-key-points .st-box{min-height:250px;justify-content:flex-start}

/* break */
.st-brk-kind{font:700 240px/.9 ${F.display};text-transform:uppercase}
.st-brk-time{font:600 56px/1 ${F.mono};color:var(--s-teal);margin-top:32px}
.st-brk-line{font:500 44px/1.3 ${F.body};color:var(--s-ink-muted);margin:24px 0 0;max-width:1400px}
.st-brk-line + .st-brk-line{margin-top:6px}

/* day-close */
.st-dc{display:flex;flex-direction:column;gap:56px}
.st-dc-title{font:700 160px/.92 ${F.display};text-transform:uppercase;margin:0}
.st-dc-sub{font:500 48px/1.2 ${F.body};color:var(--s-ink-muted);margin:18px 0 0}
.st-dc-mods{display:grid;grid-template-columns:repeat(var(--n),1fr);gap:24px}
.st-dc-mod{display:flex;flex-direction:column;gap:12px;padding:24px 26px;border:${STAGE.stroke.box}px solid var(--s-line);background:var(--s-card);border-radius:${STAGE.radius.box}px;font:600 36px/1.1 ${F.body}}
.st-dc-mod span{font:600 28px/1 ${F.mono};color:var(--s-teal)}
.st-dc-next{font:500 44px/1.25 ${F.body};margin:0;max-width:1400px;border-left:8px solid var(--s-teal-fill);padding-left:28px}

[data-theme="dark"] .st-line-art{filter:invert(1) hue-rotate(180deg) brightness(1.1)}
@media (prefers-reduced-motion: reduce){.st-slide [data-s]{transition:none}.st-slide .st-fut{transform:none}.st-play .st-rose-needle{animation:none}}
`;

export const PRESENTER_CSS = `
html,body{margin:0;height:100%;background:var(--s-bg);overflow:hidden}
.st-stage{position:fixed;inset:0;overflow:hidden;background:var(--s-bg);cursor:pointer}
.st-deck{position:absolute;left:50%;top:50%;width:${C.width}px;height:${C.height}px;transform:translate(-50%,-50%) scale(var(--k,1));transform-origin:center}
.st-deck .st-slide{transition:opacity ${M.slide}ms ${M.ease}}
.st-deck .st-slide.st-enter{opacity:0}
.st-hud{position:fixed;left:12px;bottom:12px;display:flex;gap:6px;align-items:center;font:500 13px/1 ${F.mono};color:var(--s-ink-muted);
  background:var(--s-bg);border:1px solid var(--s-line);border-radius:4px;padding:6px 8px;opacity:0;transition:opacity .3s;z-index:3}
.st-hud.on,.st-hud:focus-within{opacity:1}
.st-hud button{font:600 13px/1 ${F.mono};color:var(--s-ink);background:transparent;border:1px solid var(--s-line);border-radius:3px;padding:6px 9px;cursor:pointer}
.st-hud button:focus-visible{outline:2px solid var(--s-teal);outline-offset:2px}
.st-notes{position:fixed;left:0;right:0;bottom:0;max-height:34vh;overflow:auto;z-index:2;background:var(--s-bg);border-top:2px solid var(--s-teal);
  color:var(--s-ink);font:500 20px/1.45 ${F.body};padding:16px max(20px,4vw) 56px}
.st-notes b{font:600 13px/1 ${F.mono};letter-spacing:.1em;text-transform:uppercase;color:var(--s-teal);display:block;margin-bottom:8px}
`;
