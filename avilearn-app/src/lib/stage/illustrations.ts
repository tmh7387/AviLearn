/**
 * AviLearn illustration library.
 *
 * Detailed technical illustrations drawn in code. Every colour is a theme
 * token, so each drawing works on the light and the dark canvas and passes
 * the colour audit. A deck uses one by giving an asset the url
 * `illustration:<id>`, for example `illustration:aircraft-side`.
 *
 * Rules for new drawings:
 * - Real proportions. Trace a reference three-view before you draw.
 * - Opaque fills from the illo tokens, outlines in --s-line, teal for accents only.
 * - No text inside a drawing. Labels come from templates (annotated-image).
 */

const STROKE = 'stroke="var(--s-line)" stroke-linejoin="round" stroke-linecap="round"';
const f = (n: number) => +n.toFixed(1);

function grad(id: string, stops: [number, string][]): string {
  return (
    `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">` +
    stops.map(([o, c]) => `<stop offset="${o}" style="stop-color:var(${c})"/>`).join('') +
    `</linearGradient>`
  );
}

function wheel(cx: number, cy: number, r: number): string {
  return (
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--s-illo-dark)" ${STROKE} stroke-width="3"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${f(r * 0.42)}" fill="var(--s-illo-mid)" ${STROKE} stroke-width="2"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${f(r * 0.12)}" fill="var(--s-illo-dark)"/>`
  );
}

/** Narrow-body twin-engine airliner, left side view, gear down. */
function aircraftSide(ramp: boolean): string {
  const windows: string[] = [];
  for (let x = 304; x <= 1128; x += 23) {
    if ((x > 612 && x < 690) || (x > 1132 && x < 1190)) continue;
    windows.push(`<rect x="${x}" y="209" width="10" height="15" rx="5"/>`);
  }
  const rampKit = ramp
    ? // belt loader at the aft cargo door, chocks and cones (teal: no red or orange on stage)
      `<g ${STROKE} stroke-width="3">` +
      `<path d="M1006,302 L1026,296 L1170,414 L1148,424 Z" fill="var(--s-illo-mid)"/>` +
      `<path d="M1020,300 L1158,418" fill="none" stroke-width="2" stroke-dasharray="6 8"/>` +
      `<path d="M1090,372 L1100,404 M1124,392 L1130,404" fill="none"/>` +
      `<rect x="1060" y="402" width="200" height="22" rx="4" fill="var(--s-illo-light)"/>` +
      `<path d="M1214,402 L1218,360 L1258,360 L1262,402 Z" fill="var(--s-illo-light)"/>` +
      `<path d="M1224,366 L1252,366 L1254,388 L1224,388 Z" fill="var(--s-illo-glass)"/>` +
      `</g>` +
      wheel(1092, 428, 13) +
      wheel(1232, 428, 13) +
      `<g fill="var(--s-teal-fill)" ${STROKE} stroke-width="2.5">` +
      `<path d="M772,440 L780,424 L796,424 L800,440 Z"/><path d="M846,440 L850,424 L866,424 L874,440 Z"/>` +
      `<path d="M120,440 L132,394 L140,394 L152,440 Z"/><path d="M1000,440 L1012,394 L1020,394 L1032,440 Z"/>` +
      `</g>` +
      `<g fill="var(--s-illo-light)"><rect x="129" y="410" width="14" height="6"/><rect x="1009" y="410" width="14" height="6"/></g>`
    : '';

  return (
    `<svg class="st-illo" viewBox="0 0 1600 470" role="img">` +
    `<defs>${grad('sti-body', [[0, '--s-illo-light'], [0.55, '--s-illo-light'], [1, '--s-illo-mid']])}` +
    `${grad('sti-nac', [[0, '--s-illo-light'], [1, '--s-illo-mid']])}</defs>` +
    // ground and shadow
    `<path d="M20,440 L1580,440" stroke="var(--s-line)" stroke-opacity=".35" stroke-width="2"/>` +
    `<ellipse cx="800" cy="446" rx="640" ry="10" fill="var(--s-ink)" fill-opacity=".08"/>` +
    // fin with brand teal and rudder hinge line
    `<path d="M1232,184 C1300,150 1376,74 1416,34 L1488,34 C1484,82 1492,142 1506,192 Z" fill="var(--s-teal-fill)" ${STROKE} stroke-width="3"/>` +
    `<path d="M1452,36 C1452,90 1460,150 1472,190" fill="none" stroke="var(--s-illo-light)" stroke-opacity=".7" stroke-width="2.5"/>` +
    // nose and main gear
    `<g ${STROKE} stroke-width="3" fill="var(--s-illo-mid)">` +
    `<rect x="226" y="316" width="12" height="94" rx="3"/><path d="M226,352 L206,330" fill="none"/>` +
    `<rect x="808" y="312" width="14" height="96" rx="3"/><path d="M822,350 L846,326" fill="none"/>` +
    `</g>` +
    wheel(232, 418, 22) +
    wheel(815, 410, 30) +
    // fuselage
    `<path d="M70,262 C70,222 118,186 200,181 L1200,180 C1320,180 1420,170 1512,190 L1522,206 C1440,218 1300,252 1080,320 L215,320 C140,318 72,300 70,262 Z" fill="url(#sti-body)" ${STROKE} stroke-width="3.5"/>` +
    // cheatline
    `<path d="M128,240 L1240,240 C1330,240 1430,218 1516,198 L1518,204 C1432,226 1332,248 1240,248 L124,248 Z" fill="var(--s-teal-fill)"/>` +
    // tail cone and APU exhaust
    `<path d="M1508,190 L1522,206" ${STROKE} stroke-width="3"/><circle cx="1521" cy="199" r="5" fill="var(--s-illo-dark)"/>` +
    // flight deck windows
    `<g fill="var(--s-illo-dark)" ${STROKE} stroke-width="2">` +
    `<path d="M114,228 C120,215 129,206 140,202 L160,200 L158,226 Z"/>` +
    `<path d="M166,200 L196,199 L194,223 L164,225 Z"/><path d="M202,199 L224,199 L222,221 L200,222 Z"/></g>` +
    // cabin windows
    `<g fill="var(--s-illo-dark)">${windows.join('')}</g>` +
    // doors, over-wing exits, cargo doors
    `<g fill="none" ${STROKE} stroke-width="2.5">` +
    `<rect x="246" y="192" width="34" height="94" rx="9"/><rect x="1146" y="192" width="32" height="90" rx="9"/>` +
    `<rect x="626" y="203" width="22" height="34" rx="6"/><rect x="660" y="203" width="22" height="34" rx="6"/>` +
    `<rect x="372" y="274" width="58" height="40" rx="5"/><rect x="1000" y="270" width="54" height="38" rx="5"/></g>` +
    // horizontal stabiliser
    `<path d="M1332,220 L1444,200 L1494,201 L1462,228 Z" fill="url(#sti-body)" ${STROKE} stroke-width="3"/>` +
    // wing with flap line and sharklet
    `<path d="M556,304 L906,262 L960,264 L862,318 Z" fill="url(#sti-body)" ${STROKE} stroke-width="3"/>` +
    `<path d="M842,310 L946,264" fill="none" ${STROKE} stroke-width="2" stroke-opacity=".55"/>` +
    `<path d="M720,302 L736,318 M780,294 L794,312" fill="none" ${STROKE} stroke-width="2.5"/>` +
    `<path d="M904,262 C908,240 916,222 930,204 L948,204 C944,226 948,246 960,264 Z" fill="var(--s-teal-fill)" ${STROKE} stroke-width="3"/>` +
    // pylon and engine nacelle (fan about half the fuselage height, well ahead of the wing)
    `<path d="M560,318 L700,300 L724,322 L600,336 Z" fill="var(--s-illo-mid)" ${STROKE} stroke-width="3"/>` +
    `<path d="M478,318 C560,310 660,312 712,326 L736,346 C690,366 570,384 478,386 Z" fill="url(#sti-nac)" ${STROKE} stroke-width="3"/>` +
    `<path d="M712,326 L760,340 L736,352 Z" fill="var(--s-illo-dark)" ${STROKE} stroke-width="2.5"/>` +
    `<path d="M548,314 C554,336 554,362 548,384" fill="none" ${STROKE} stroke-width="2" stroke-opacity=".5"/>` +
    `<ellipse cx="478" cy="352" rx="15" ry="34" fill="var(--s-illo-light)" ${STROKE} stroke-width="3"/>` +
    `<ellipse cx="480" cy="352" rx="8" ry="25" fill="var(--s-illo-dark)"/>` +
    rampKit +
    `</svg>`
  );
}

function pfd(x: number, y: number, id: string): string {
  const pitch = [-30, -15, 15, 30]
    .map((d) => `<path d="M${x + 85},${y + 92 + d} h30" stroke="var(--s-illo-light)" stroke-width="2"/>`)
    .join('');
  return (
    `<clipPath id="${id}"><rect x="${x + 50}" y="${y + 28}" width="100" height="126"/></clipPath>` +
    `<g clip-path="url(#${id})"><rect x="${x + 30}" y="${y}" width="140" height="${92 + 6}" fill="var(--s-teal-fill)" fill-opacity=".85"/>` +
    `<rect x="${x + 30}" y="${y + 98}" width="140" height="80" fill="var(--s-ink-muted)"/>` +
    `<path d="M${x + 30},${y + 98} h140" stroke="var(--s-illo-light)" stroke-width="2.5"/>${pitch}</g>` +
    `<path d="M${x + 70},${y + 98} h18 v8 M${x + 130},${y + 98} h-18 v8" fill="none" stroke="var(--s-illo-light)" stroke-width="5"/>` +
    `<rect x="${x + 10}" y="${y + 28}" width="32" height="126" fill="var(--s-illo-mid)" fill-opacity=".35"/>` +
    `<rect x="${x + 158}" y="${y + 28}" width="32" height="126" fill="var(--s-illo-mid)" fill-opacity=".35"/>` +
    `<path d="M${x + 10},${y + 91} h32 M${x + 158},${y + 91} h32" stroke="var(--s-teal)" stroke-width="3"/>` +
    `<path d="M${x + 60},${y + 186} q40,-18 80,0" fill="none" stroke="var(--s-illo-light)" stroke-width="2"/>`
  );
}

function nd(x: number, y: number, id: string): string {
  let ticks = '';
  for (let a = -60; a <= 60; a += 10) {
    const r = (a * Math.PI) / 180;
    const cx = x + 100;
    const cy = y + 176;
    ticks += `<path d="M${f(cx + 128 * Math.sin(r))},${f(cy - 128 * Math.cos(r))} L${f(cx + (a % 30 ? 120 : 112) * Math.sin(r))},${f(cy - (a % 30 ? 120 : 112) * Math.cos(r))}"/>`;
  }
  return (
    `<clipPath id="${id}"><rect x="${x + 6}" y="${y + 6}" width="188" height="188"/></clipPath>` +
    `<g clip-path="url(#${id})">` +
    `<g fill="none" stroke="var(--s-illo-light)" stroke-width="2"><path d="M${x - 28},${y + 176} a128,128 0 0 1 256,0"/>${ticks}</g>` +
    `<path d="M${x + 100},${y + 160} L${x + 128},${y + 96} L${x + 118},${y + 40}" fill="none" stroke="var(--s-teal)" stroke-width="3"/>` +
    `<g fill="var(--s-teal)"><circle cx="${x + 128}" cy="${y + 96}" r="5"/><circle cx="${x + 118}" cy="${y + 40}" r="5"/></g>` +
    `</g>` +
    `<path d="M${x + 100},${y + 152} l-10,24 h20 Z" fill="var(--s-illo-light)"/>`
  );
}

function ecam(x: number, y: number): string {
  const gauge = (cx: number) =>
    `<path d="M${cx - 30},${y + 70} a32,32 0 1 1 52,-6" fill="none" stroke="var(--s-illo-light)" stroke-width="3"/>` +
    `<path d="M${cx - 30},${y + 70} a32,32 0 0 1 40,-36" fill="none" stroke="var(--s-teal)" stroke-width="6"/>`;
  return (
    gauge(x + 60) +
    gauge(x + 142) +
    `<g fill="var(--s-illo-light)" fill-opacity=".6">` +
    [0, 1, 2, 3].map((i) => `<rect x="${x + 22}" y="${y + 118 + i * 16}" width="${60 + (i % 2) * 30}" height="6" rx="3"/>`).join('') +
    `</g><g fill="var(--s-teal)" fill-opacity=".8">` +
    [0, 1, 2].map((i) => `<rect x="${x + 122}" y="${y + 118 + i * 16}" width="56" height="6" rx="3"/>`).join('') +
    `</g>`
  );
}

function screen(x: number, y: number, w: number, h: number, inner: string): string {
  return (
    `<rect x="${x - 8}" y="${y - 8}" width="${w + 16}" height="${h + 16}" rx="8" fill="var(--s-illo-mid)" ${STROKE} stroke-width="2.5"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="var(--s-illo-dark)"/>` +
    inner
  );
}

/** Two-pilot glass flight deck seen from behind the seats, on approach. */
function flightDeck(): string {
  const windows =
    'M330,46 L784,34 L784,282 L380,296 Z M816,34 L1270,46 L1220,296 L816,282 Z M70,104 L300,52 L352,300 L118,334 Z M1530,104 L1300,52 L1248,300 L1482,334 Z';
  const keys = (x: number, y: number) => {
    let k = '';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) k += `<rect x="${x + 10 + c * 18}" y="${y + 60 + r * 13}" width="12" height="8" rx="2"/>`;
    return k;
  };
  return (
    `<svg class="st-illo" viewBox="0 0 1600 900" role="img">` +
    `<defs>${grad('sti-sky', [[0, '--s-illo-glass'], [1, '--s-illo-light']])}${grad('sti-panel', [[0, '--s-illo-mid'], [1, '--s-illo-light']])}` +
    `<clipPath id="sti-win"><path d="${windows}"/></clipPath></defs>` +
    // cockpit structure, overhead edge
    `<rect x="0" y="0" width="1600" height="900" fill="var(--s-illo-mid)"/>` +
    `<path d="M0,0 H1600 V26 C1100,14 500,14 0,26 Z" fill="var(--s-illo-light)" ${STROKE} stroke-width="2.5"/>` +
    // outside view: sky, ground, runway in perspective
    `<g clip-path="url(#sti-win)"><rect x="0" y="0" width="1600" height="186" fill="url(#sti-sky)"/>` +
    `<rect x="0" y="186" width="1600" height="170" fill="var(--s-ink-muted)" fill-opacity=".55"/>` +
    `<path d="M780,186 L820,186 L1090,330 L510,330 Z" fill="var(--s-illo-dark)"/>` +
    `<path d="M800,192 V330" stroke="var(--s-illo-light)" stroke-width="4" stroke-dasharray="10 14"/>` +
    `<path d="M560,300 h70 M970,300 h70 M640,250 h40 M920,250 h40" stroke="var(--s-illo-light)" stroke-width="5"/></g>` +
    `<path d="${windows}" fill="none" ${STROKE} stroke-width="5"/>` +
    // glareshield and flight control unit
    `<path d="M30,300 Q800,254 1570,300 L1570,372 L30,372 Z" fill="var(--s-illo-dark)" ${STROKE} stroke-width="3"/>` +
    `<rect x="560" y="306" width="480" height="48" rx="6" fill="var(--s-illo-mid)" ${STROKE} stroke-width="2.5"/>` +
    `<g fill="var(--s-illo-dark)">${[0, 1, 2, 3].map((i) => `<rect x="${590 + i * 112}" y="316" width="70" height="24" rx="3"/>`).join('')}</g>` +
    `<g fill="var(--s-teal)">${[0, 1, 2, 3].map((i) => `<rect x="${600 + i * 112}" y="325" width="${30 + (i % 2) * 14}" height="6" rx="2"/>`).join('')}</g>` +
    `<g fill="var(--s-illo-mid)" ${STROKE} stroke-width="2"><rect x="150" y="312" width="220" height="40" rx="5"/><rect x="1230" y="312" width="220" height="40" rx="5"/></g>` +
    `<g fill="var(--s-illo-light)">${[0, 1, 2, 3, 4].map((i) => `<circle cx="${178 + i * 40}" cy="332" r="9"/><circle cx="${1258 + i * 40}" cy="332" r="9"/>`).join('')}</g>` +
    // main instrument panel and displays
    `<rect x="30" y="372" width="1540" height="262" fill="url(#sti-panel)" ${STROKE} stroke-width="3"/>` +
    screen(96, 398, 200, 200, pfd(96, 398, 'sti-pfd1')) +
    screen(322, 398, 200, 200, nd(322, 398, 'sti-nd1')) +
    screen(700, 398, 200, 200, ecam(700, 398)) +
    screen(1078, 398, 200, 200, nd(1078, 398, 'sti-nd2')) +
    screen(1304, 398, 200, 200, pfd(1304, 398, 'sti-pfd2')) +
    // centre pedestal: lower display, MCDUs, thrust levers
    `<path d="M600,634 L1000,634 L1060,900 L540,900 Z" fill="url(#sti-panel)" ${STROKE} stroke-width="3"/>` +
    screen(726, 652, 148, 92, `<path d="M748,712 h40 M812,712 h40 M748,692 h104" stroke="var(--s-illo-light)" stroke-width="3" stroke-opacity=".7"/>`) +
    `<g fill="var(--s-illo-mid)" ${STROKE} stroke-width="2"><rect x="610" y="650" width="96" height="124" rx="6"/><rect x="894" y="650" width="96" height="124" rx="6"/></g>` +
    `<g fill="var(--s-illo-dark)"><rect x="620" y="660" width="76" height="40" rx="3"/><rect x="904" y="660" width="76" height="40" rx="3"/></g>` +
    `<g fill="var(--s-illo-dark)" fill-opacity=".7">${keys(610, 650)}${keys(894, 650)}</g>` +
    `<path d="M752,890 L760,790 M848,890 L840,790" ${STROKE} stroke-width="8"/>` +
    `<path d="M722,792 a12,12 0 0 1 12,-12 h52 a12,12 0 0 1 12,12 v10 h-76 Z M802,792 a12,12 0 0 1 12,-12 h52 a12,12 0 0 1 12,12 v10 h-76 Z" fill="var(--s-teal-fill)" ${STROKE} stroke-width="2.5"/>` +
    // pilot seats in the foreground
    `<g fill="var(--s-illo-dark)" ${STROKE} stroke-width="3">` +
    `<path d="M150,900 L176,738 C180,712 200,700 226,700 L384,700 C410,700 430,712 434,738 L460,900 Z"/>` +
    `<rect x="226" y="640" width="158" height="66" rx="24"/>` +
    `<path d="M1140,900 L1166,738 C1170,712 1190,700 1216,700 L1374,700 C1400,700 1420,712 1424,738 L1450,900 Z"/>` +
    `<rect x="1216" y="640" width="158" height="66" rx="24"/></g>` +
    `<g fill="none" stroke="var(--s-illo-mid)" stroke-width="3"><path d="M200,760 C260,780 350,780 410,760 M1190,760 C1250,780 1340,780 1400,760"/></g>` +
    `</svg>`
  );
}

export const ILLUSTRATIONS = {
  'aircraft-side': () => aircraftSide(false),
  'aircraft-ramp': () => aircraftSide(true),
  'flight-deck': flightDeck,
} as const;

export type IllustrationId = keyof typeof ILLUSTRATIONS;

export const ILLUSTRATION_PREFIX = 'illustration:';

/** Inline SVG for an `illustration:<id>` url, or null when the url is a normal image. */
export function illustrationFor(url: string, alt: string): string | null {
  if (!url.startsWith(ILLUSTRATION_PREFIX)) return null;
  const id = url.slice(ILLUSTRATION_PREFIX.length) as IllustrationId;
  const draw = ILLUSTRATIONS[id];
  if (!draw) throw new Error(`Unknown illustration "${id}". Known: ${Object.keys(ILLUSTRATIONS).join(', ')}`);
  const esc = alt.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
  return draw().replace('role="img">', `role="img" aria-label="${esc}">`);
}
