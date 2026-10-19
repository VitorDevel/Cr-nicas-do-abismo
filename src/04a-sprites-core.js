/* ============================================================
   FÁBRICA DE SPRITES — desenha cada objeto uma vez num canvas
   e reutiliza. Origem (0,0) = base do objeto no chão.
   ============================================================ */
const SPR = {};                     // tipo -> (g, s, v, r, pal)
const SWAY = new Set(['oak', 'birch', 'pine', 'jtree', 'palm', 'willow', 'snowpine', 'bamboo', 'reeds', 'fern', 'bigleaf', 'stormtree', 'frozentree', 'arctree', 'crystaltree', 'eyestalk', 'banner', 'bush', 'flowerbush', 'bushflower', 'deadbush']);
const spriteCache = new Map();
const BK = 1.5;
function spriteFor(kind, v, s, b) {
  const sq = Math.max(6, Math.round(s / 3) * 3), key = kind + '|' + v + '|' + sq + '|' + b;
  let sp = spriteCache.get(key); if (sp) return sp;
  const fn = SPR[kind]; const W = Math.ceil(sq * 3.1 + 24), H = Math.ceil(sq * 3.4 + 24), pad = 14;
  const cv = document.createElement('canvas'); cv.width = Math.ceil(W * BK); cv.height = Math.ceil((H + pad) * BK);
  const g = cv.getContext('2d'); g.scale(BK, BK); g.translate(W / 2, H);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const r = mulberry((hash2(v * 31 + sq, kind.length * 7 + kind.charCodeAt(0), 5) * 4294967296) | 0);
  if (fn) { try { fn(g, sq, v, r, BIOMES[b] || BIOMES.meadow); } catch (e) { console.warn('sprite', kind, e); } }
  else { g.fillStyle = '#f0f'; g.fillRect(-6, -12, 12, 12); }
  sp = { cv, w: W, h: H + pad, ox: W / 2, oy: H };
  spriteCache.set(key, sp);
  if (spriteCache.size > 2600) { const k0 = spriteCache.keys().next().value; spriteCache.delete(k0); }
  return sp;
}
function drawSprite(c, kind, v, s, b, x, y, sway = 0, flip = false, a = 1) {
  const sp = spriteFor(kind, v, s, b), sc = s / Math.max(6, Math.round(s / 3) * 3);
  c.save(); c.translate(x, y);
  if (sway) c.transform(1, 0, sway, 1, 0, 0);
  if (flip) c.scale(-1, 1);
  if (sc !== 1) c.scale(sc, sc);
  if (a < 1) c.globalAlpha = a;
  c.drawImage(sp.cv, -sp.ox, -sp.oy, sp.w, sp.h);
  c.restore();
}

/* ---------- ferramentas de desenho ---------- */
const circ = (g, x, y, r) => { g.beginPath(); g.arc(x, y, Math.max(.1, r), 0, TAU); g.fill(); };
const ell = (g, x, y, rx, ry, rot = 0) => { g.beginPath(); g.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot, 0, TAU); g.fill(); };
function poly(g, pts, fill, stroke, lw = 1) {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}
function shadowE(g, rx, ry, a = .3, dx = 0) { g.fillStyle = `rgba(8,10,16,${a})`; ell(g, dx, ry * .25, rx, ry); g.fillStyle = `rgba(8,10,16,${a * .6})`; ell(g, dx, ry * .25, rx * .7, ry * .7); }
function grad(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c)); return gr; }
function glowDot(g, x, y, r, col) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; circ(g, x, y, r); }
function trunk(g, h, w, col, dk, r, lean = 0) {
  const hl = shade(col, .22);
  g.beginPath(); g.moveTo(-w * .9, 0); g.quadraticCurveTo(-w * .5, -h * .4, -w * .42 + lean, -h); g.lineTo(w * .42 + lean, -h); g.quadraticCurveTo(w * .5, -h * .4, w * .9, 0);
  g.quadraticCurveTo(w * .3, 3, 0, 2); g.quadraticCurveTo(-w * .3, 3, -w * .9, 0); g.closePath();
  g.fillStyle = grad(g, -w, 0, w, 0, [dk, col, col, hl]); g.fill(); g.strokeStyle = 'rgba(10,6,4,.45)'; g.lineWidth = 1; g.stroke();
  g.strokeStyle = 'rgba(10,6,4,.35)'; g.lineWidth = 1;
  for (let i = 0; i < 4; i++) { const yy = -h * (.12 + r() * .75), xx = (r() - .5) * w * .8; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + (r() - .5) * 2, yy - 5 - r() * 5); g.stroke(); }
  g.fillStyle = dk; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * w * .5, -1); g.quadraticCurveTo(sx * w * 1.5, 1, sx * w * 1.9, 4); g.quadraticCurveTo(sx * w * 1.1, 4, sx * w * .5, 4); g.fill(); }
}
function crown(g, cx, cy, R, cols, r, n = 9, squash = .86) {
  const P = []; for (let i = 0; i < n; i++) { const a = i / n * TAU + r() * .6, d = R * (.42 + r() * .42); P.push({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d * squash, rr: R * (.42 + r() * .26) }); }
  g.fillStyle = cols[0]; for (const p of P) circ(g, p.x, p.y + R * .13, p.rr); circ(g, cx, cy + R * .12, R * .72);
  g.strokeStyle = 'rgba(6,16,8,.35)'; g.lineWidth = 1.2; g.beginPath(); g.arc(cx, cy + R * .12, R * .72, 0, TAU); g.stroke();
  g.fillStyle = cols[1]; for (const p of P) circ(g, p.x, p.y, p.rr * .93); circ(g, cx, cy, R * .62);
  g.fillStyle = cols[2]; for (const p of P) if (p.y < cy + R * .15) circ(g, p.x - R * .07, p.y - R * .1, p.rr * .55);
  g.fillStyle = cols[3]; for (let i = 0; i < 16; i++) { const a = r() * TAU, d = r() * R * .85; ell(g, cx + Math.cos(a) * d - R * .08, cy + Math.sin(a) * d * squash - R * .12, R * .09, R * .05, a); }
  g.fillStyle = 'rgba(8,24,10,.28)'; for (let i = 0; i < 9; i++) { const a = r() * TAU, d = R * (.25 + r() * .6); ell(g, cx + Math.cos(a) * d + R * .06, cy + R * .1 + Math.abs(Math.sin(a)) * d * .6, R * .09, R * .05, a); }
}
function rockShape(g, rx, ry, col, r, mossy, snow) {
  const n = 8, pts = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, k = .78 + r() * .3; pts.push([Math.cos(a) * rx * k, -ry * .55 + Math.sin(a) * ry * .55 * k]); }
  g.fillStyle = 'rgba(8,10,16,.3)'; ell(g, 0, 2, rx * 1.05, ry * .32);
  poly(g, pts, col, 'rgba(8,8,12,.55)', 1.2);
  poly(g, [pts[4], pts[5], pts[6], pts[7], pts[0]], shade(col, -.2)); // face inferior sombreada
  poly(g, [pts[1], pts[2], pts[3], pts[4], [0, -ry * .5]], shade(col, .12));
  poly(g, [pts[6], pts[7], pts[0], pts[1], [0, -ry * .55]], shade(col, .24));
  g.strokeStyle = 'rgba(6,6,10,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(pts[3][0], pts[3][1]); g.lineTo(0, -ry * .5); g.lineTo(pts[0][0], pts[0][1]); g.moveTo(0, -ry * .5); g.lineTo(pts[5][0], pts[5][1]); g.stroke();
  if (mossy) { g.fillStyle = 'rgba(86,140,64,.8)'; for (let i = 0; i < 5; i++) ell(g, (r() - .5) * rx * 1.1, -ry * (.85 + r() * .4), rx * .24, ry * .1, 0); }
  if (snow) { g.fillStyle = 'rgba(250,252,255,.92)'; g.beginPath(); g.moveTo(pts[6][0], pts[6][1]); for (const i of [7, 0, 1, 2]) g.lineTo(pts[i][0], pts[i][1] * .9 - 2); g.quadraticCurveTo(0, -ry * .5, pts[6][0], pts[6][1]); g.fill(); }
}
function crystalShape(g, x, y, h, w, col, ang = 0, glow = true) {
  g.save(); g.translate(x, y); g.rotate(ang);
  if (glow) glowDot(g, 0, -h * .5, h * .9, alpha(col, .25));
  const lt = shade(col, .55), dk = shade(col, -.45), md = col;
  poly(g, [[-w, 0], [-w * .8, -h * .72], [0, -h], [0, 0]], lt); poly(g, [[0, 0], [0, -h], [w * .8, -h * .72], [w, 0]], dk);
  poly(g, [[-w * .8, -h * .72], [0, -h], [0, -h * .62]], '#ffffffaa'); poly(g, [[-w * .3, 0], [-w * .45, -h * .6], [0, -h * .62], [0, 0]], md);
  g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-w, 0); g.lineTo(-w * .8, -h * .72); g.lineTo(0, -h); g.lineTo(w * .8, -h * .72); g.lineTo(w, 0); g.moveTo(0, -h); g.lineTo(0, 0); g.stroke();
  g.restore();
}
const GREENS = [['#1f4a29', '#2f6a35', '#4f9a4a', '#8ccf70'], ['#265630', '#3a7a3c', '#62a850', '#a4d878'], ['#244e3a', '#2f7a58', '#52aa78', '#98e0b0'], ['#5e3218', '#a0541e', '#d8862e', '#f4c458']];
const BARK = [['#6a4a2a', '#41301c'], ['#7a5a38', '#4a3622'], ['#5a4030', '#35261a']];
const gPal = (v, s) => GREENS[v === 3 ? ((s * 7) | 0) % 3 === 0 ? 3 : 0 : v % 3];
const bPal = v => BARK[v % 3];

/* ---------- campo / floresta ---------- */
SPR.oak = (g, s, v, r) => { const [c, d] = bPal(v); shadowE(g, s * .75, s * .24); trunk(g, s * .95, s * .26, c, d, r); const gp = gPal(v, s); crown(g, 0, -s * 1.35, s * .8, gp, r, 10); g.strokeStyle = d; g.lineWidth = s * .07; g.beginPath(); g.moveTo(0, -s * .8); g.lineTo(-s * .22, -s * 1.05); g.moveTo(0, -s * .75); g.lineTo(s * .2, -s * 1.0); g.stroke(); };
SPR.birch = (g, s, v, r) => {
  shadowE(g, s * .55, s * .18); const w = s * .16; g.fillStyle = grad(g, -w, 0, w, 0, ['#cfcab8', '#f2efe4', '#fffef6']); g.beginPath(); g.moveTo(-w, 0); g.lineTo(-w * .6, -s * 1.5); g.lineTo(w * .6, -s * 1.5); g.lineTo(w, 0); g.closePath(); g.fill();
  g.fillStyle = '#2a2a28'; for (let i = 0; i < 8; i++) g.fillRect(-w * .9 + r() * w, -s * (.1 + i * .17), w * (.5 + r() * .7), 2);
  const gp = v % 2 ? ['#6a8a2a', '#92b838', '#bcd852', '#e8f08a'] : ['#3f7a3a', '#62a850', '#92cf6a', '#c8ee98']; crown(g, 0, -s * 1.7, s * .55, gp, r, 8, 1.15);
};
SPR.pine = (g, s, v, r) => {
  shadowE(g, s * .55, s * .2); g.fillStyle = '#4a3220'; g.fillRect(-s * .08, -s * .35, s * .16, s * .4);
  const cols = [['#173a2a', '#225540', '#3a8060'], ['#1c3f26', '#2a6334', '#48924e'], ['#163d36', '#215a50', '#3a8a7a']][v % 3];
  for (let i = 0; i < 5; i++) {
    const y = -s * (.25 + i * .36), w = s * (.7 - i * .115), h = s * .56;
    poly(g, [[-w, y], [0, y - h], [w, y]], cols[0]); poly(g, [[0, y - h], [w, y], [w * .1, y - h * .05]], cols[1]); poly(g, [[0, y - h], [-w, y], [-w * .6, y - h * .1], [-w * .1, y - h * .55]], cols[2]);
    g.strokeStyle = 'rgba(6,16,10,.4)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-w, y); g.quadraticCurveTo(0, y + 4, w, y); g.stroke();
  }
};
SPR.bush = (g, s, v, r) => { shadowE(g, s * .75, s * .22); const gp = gPal(v, s); crown(g, 0, -s * .5, s * .62, gp, r, 6, .75); if (v % 2) { g.fillStyle = '#d83a4a'; for (let i = 0; i < 6; i++) circ(g, (r() - .5) * s * .9, -s * (.3 + r() * .5), s * .06); g.fillStyle = '#ffffff88'; for (let i = 0; i < 3; i++) circ(g, (r() - .5) * s * .9, -s * (.4 + r() * .4), s * .02); } };
SPR.flowerbush = (g, s, v, r) => { SPR.bush(g, s, 0, r); const cs = [['#f6a6c8', '#ffe0ee'], ['#ffd25a', '#fff2b0'], ['#b89cff', '#e8dcff'], ['#ff8a7a', '#ffd0c8']][v % 4]; for (let i = 0; i < 8; i++) { const x = (r() - .5) * s * 1.0, y = -s * (.3 + r() * .6); g.fillStyle = cs[0]; for (let k = 0; k < 5; k++) { const a = k * TAU / 5; ell(g, x + Math.cos(a) * s * .075, y + Math.sin(a) * s * .075, s * .06, s * .04, a); } g.fillStyle = cs[1]; circ(g, x, y, s * .035); } };
SPR.rock = (g, s, v, r, pal) => rockShape(g, s * .7, s * .62, mixHex(pal.g3.length === 7 ? pal.g3 : '#6a6a60', '#8a8a82', .65), r, v % 2 === 0 && (pal === BIOMES.meadow || pal === BIOMES.forest || pal === BIOMES.jungle || pal === BIOMES.marsh));
SPR.stump = (g, s, v, r) => { const [c, d] = bPal(v); shadowE(g, s * .7, s * .2); g.fillStyle = grad(g, -s * .5, 0, s * .5, 0, [d, c, shade(c, .2)]); g.beginPath(); g.moveTo(-s * .5, 0); g.lineTo(-s * .4, -s * .55); g.lineTo(s * .4, -s * .55); g.lineTo(s * .5, 0); g.quadraticCurveTo(0, s * .12, -s * .5, 0); g.fill(); ell(g, 0, -s * .55, s * .4, s * .16); g.fillStyle = '#d9b27a'; ell(g, 0, -s * .55, s * .34, s * .12); g.strokeStyle = '#a07a46'; g.lineWidth = 1; for (const k of [.26, .16, .07]) { g.beginPath(); g.ellipse(0, -s * .55, s * k, s * k * .36, 0, 0, TAU); g.stroke(); } g.fillStyle = '#5a9a4a'; ell(g, s * .3, -s * .05, s * .15, s * .05); };
SPR.haystack = (g, s, v, r) => { shadowE(g, s * .8, s * .22); g.fillStyle = grad(g, -s, 0, s, 0, ['#b08a2a', '#e0bc52', '#f4dc86']); g.beginPath(); g.moveTo(-s * .75, 0); g.quadraticCurveTo(-s * .8, -s * .9, 0, -s * 1.05); g.quadraticCurveTo(s * .8, -s * .9, s * .75, 0); g.quadraticCurveTo(0, s * .15, -s * .75, 0); g.fill(); g.strokeStyle = 'rgba(120,80,10,.5)'; g.lineWidth = 1; for (let i = 0; i < 14; i++) { const x = (r() - .5) * s * 1.3; g.beginPath(); g.moveTo(x * .6, -s * .95 + r() * 8); g.lineTo(x, -r() * s * .4); g.stroke(); } };
SPR.mushroom = (g, s, v, r) => { shadowE(g, s * .8, s * .2); const cs = [['#d63a3a', '#ff7a6a'], ['#a8662a', '#d89a5a'], ['#8a4ac8', '#c89aff']][v % 3]; for (let i = 0; i < 3; i++) { const x = (i - 1) * s * .42, h = s * (.55 + r() * .4), rr = s * (.3 + r() * .12); g.fillStyle = '#efe6d0'; g.fillRect(x - rr * .22, -h, rr * .44, h); g.fillStyle = cs[0]; g.beginPath(); g.ellipse(x, -h, rr, rr * .7, 0, Math.PI, 0); g.quadraticCurveTo(x, -h + rr * .3, x - rr, -h); g.fill(); g.fillStyle = cs[1]; ell(g, x - rr * .3, -h - rr * .35, rr * .35, rr * .15); g.fillStyle = '#fff'; circ(g, x + rr * .35, -h - rr * .3, rr * .12); circ(g, x - rr * .1, -h - rr * .5, rr * .09); } };
SPR.log = (g, s, v, r) => { const [c, d] = bPal(v); shadowE(g, s * 1.1, s * .22); g.fillStyle = grad(g, 0, -s * .55, 0, 0, [shade(c, .2), c, d]); g.beginPath(); g.roundRect(-s * 1.05, -s * .5, s * 2.1, s * .5, s * .2); g.fill(); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-s + r() * s * 2, -s * .45); g.lineTo(-s + r() * s * 2, -s * .05); g.stroke(); } g.fillStyle = '#d9b27a'; ell(g, s * 1.02, -s * .25, s * .12, s * .25); g.strokeStyle = '#a07a46'; g.beginPath(); g.ellipse(s * 1.02, -s * .25, s * .06, s * .13, 0, 0, TAU); g.stroke(); g.fillStyle = '#5a9a4a'; ell(g, -s * .3, -s * .5, s * .35, s * .07); };
SPR.fern = (g, s, v, r) => { const gp = gPal(v, s); for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * .36 + (r() - .5) * .2, L = s * (.7 + r() * .4); g.strokeStyle = gp[1]; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); const ex = Math.cos(a) * L, ey = Math.sin(a) * L; g.quadraticCurveTo(ex * .4, ey * .6 - 4, ex, ey + L * .15); g.stroke(); g.fillStyle = i % 2 ? gp[2] : gp[1]; for (let k = 1; k < 7; k++) { const t = k / 7, px = ex * t, py = ey * t * (1 - .12 * t) - 3 * (1 - t); ell(g, px, py, s * .13 * (1 - t * .6), s * .05, a + 1.2); ell(g, px, py, s * .13 * (1 - t * .6), s * .05, a - 1.2); } } };
SPR.jtree = (g, s, v, r) => { shadowE(g, s * .95, s * .28); const [c, d] = bPal(v); trunk(g, s * 1.15, s * .3, c, d, r, s * .06); const gp = [['#14472c', '#1d6638', '#34964a', '#76d070'], ['#17503a', '#22745a', '#3ca47a', '#84e0b0'], ['#1c4a20', '#2c7a30', '#48ac3e', '#98e060']][v % 3];
  crown(g, -s * .35, -s * 1.55, s * .62, gp, r, 7); crown(g, s * .4, -s * 1.5, s * .6, gp, r, 7); crown(g, 0, -s * 1.95, s * .66, gp, r, 8);
  g.strokeStyle = '#2a8a3a'; g.lineWidth = 2; for (let i = 0; i < 5; i++) { const x = (r() - .5) * s * 1.2; g.beginPath(); g.moveTo(x, -s * 1.4); g.bezierCurveTo(x + 4, -s * 1.1, x - 4, -s * .8, x + 2, -s * (.5 + r() * .3)); g.stroke(); }
  g.fillStyle = ['#ff5a8a', '#ffb23a', '#ff7a3a'][v % 3]; for (let i = 0; i < 4; i++) { circ(g, (r() - .5) * s * 1.2, -s * (1.5 + r() * .7), s * .06); } };
SPR.palm = (g, s, v, r) => { shadowE(g, s * .8, s * .22, .25, s * .2); const lean = s * (.18 + r() * .12) * (v % 2 ? -1 : 1), top = -s * 1.6;
  g.strokeStyle = '#6a4a2a'; g.lineWidth = s * .2; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(lean * .2, top * .5, lean, top); g.stroke();
  g.strokeStyle = '#8a6a3e'; g.lineWidth = s * .12; g.beginPath(); g.moveTo(-s * .03, 0); g.quadraticCurveTo(lean * .2 - s * .03, top * .5, lean - s * .03, top); g.stroke();
  g.strokeStyle = 'rgba(30,20,10,.5)'; g.lineWidth = 1.2; for (let i = 1; i < 9; i++) { const t = i / 9, x = lean * t * t, y = top * t; g.beginPath(); g.moveTo(x - s * .1, y); g.lineTo(x + s * .1, y + 1); g.stroke(); }
  const gp = v % 3 === 1 ? ['#2a6a2a', '#45a43a', '#82d055'] : ['#1f6a3a', '#35a050', '#74d078'];
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + .2, L = s * (.85 + r() * .25); g.save(); g.translate(lean, top); g.rotate(a); g.fillStyle = gp[i % 2]; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(L * .5, -s * .35, L, s * .28); g.quadraticCurveTo(L * .5, -s * .02, 0, 0); g.fill(); g.strokeStyle = gp[2]; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(L * .5, -s * .2, L * .95, s * .22); g.stroke(); g.restore(); }
  g.fillStyle = '#6a4220'; circ(g, lean - 3, top + 5, s * .08); circ(g, lean + 4, top + 6, s * .08); };
SPR.bigleaf = (g, s, v, r) => { const gp = gPal(v + 1, s); for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * .5, L = s * (.9 + r() * .4); g.save(); g.rotate(a + Math.PI / 2); g.fillStyle = gp[i % 2 ? 1 : 2]; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-s * .5, -L * .35, -s * .35, -L * .85, 0, -L); g.bezierCurveTo(s * .35, -L * .85, s * .5, -L * .35, 0, 0); g.fill(); g.strokeStyle = gp[0]; g.lineWidth = 1.3; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -L * .95); for (let k = 1; k < 5; k++) { g.moveTo(0, -L * k * .2); g.lineTo(-s * .22, -L * k * .2 - s * .1); g.moveTo(0, -L * k * .2); g.lineTo(s * .22, -L * k * .2 - s * .1); } g.stroke(); g.restore(); } };
SPR.bamboo = (g, s, v, r) => { shadowE(g, s * .6, s * .16); for (let i = 0; i < 4; i++) { const x = (i - 1.5) * s * .22, h = s * (1.5 + r() * .8), w = s * .07; g.fillStyle = grad(g, x - w, 0, x + w, 0, ['#4a8a2a', '#8cc84a', '#c4ec78']); g.fillRect(x - w, -h, w * 2, h); g.fillStyle = '#2a5a1a'; for (let k = 1; k < 7; k++) g.fillRect(x - w - 1, -h * k / 7, w * 2 + 2, 2); g.fillStyle = '#5aa83a'; for (let k = 0; k < 3; k++) { g.save(); g.translate(x, -h * (.55 + k * .15)); g.rotate((k % 2 ? 1 : -1) * 1.0); ell(g, s * .2, 0, s * .22, s * .045); g.restore(); } } };
SPR.bushflower = (g, s, v, r) => { SPR.bush(g, s, 2, r); const col = ['#ff4a6a', '#ff9a2a', '#fff05a'][v % 3]; for (let i = 0; i < 4; i++) { const x = (r() - .5) * s * .9, y = -s * (.4 + r() * .5); for (let k = 0; k < 5; k++) { g.fillStyle = col; const a = k * TAU / 5; ell(g, x + Math.cos(a) * s * .1, y + Math.sin(a) * s * .1, s * .1, s * .06, a); } g.fillStyle = '#ffe36a'; circ(g, x, y, s * .05); } };
SPR.willow = (g, s, v, r) => { shadowE(g, s * .9, s * .24); trunk(g, s * .9, s * .28, '#5a4a38', '#352a20', r, s * .05); const gp = ['#34553a', '#4a7a50', '#6ea46e', '#a8d8a0']; crown(g, 0, -s * 1.25, s * .72, gp, r, 8, .7);
  for (let i = 0; i < 26; i++) { const a = -Math.PI * .95 + i / 25 * Math.PI * .9, x0 = Math.cos(a) * s * .8, y0 = -s * 1.25 + Math.sin(a) * s * .5 * .0 + s * .15; g.strokeStyle = i % 3 ? gp[1] : gp[2]; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + (r() - .5) * 6, y0 + s * .5, x0 + (r() - .5) * 8, y0 + s * (.8 + r() * .6)); g.stroke(); } };
SPR.deadtree = (g, s, v, r, pal) => { shadowE(g, s * .6, s * .2); const col = pal === BIOMES.frost ? '#5a5a66' : pal === BIOMES.ash ? '#3a3238' : '#4a3a30', hi = shade(col, .25); g.strokeStyle = col; g.lineCap = 'round';
  const br = (x, y, a, L, w, d) => { g.lineWidth = w; g.strokeStyle = col; g.beginPath(); g.moveTo(x, y); const ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L; g.quadraticCurveTo((x + ex) / 2 + (r() - .5) * L * .3, (y + ey) / 2, ex, ey); g.stroke(); g.lineWidth = w * .35; g.strokeStyle = hi; g.beginPath(); g.moveTo(x - w * .2, y); g.lineTo(ex - w * .2, ey); g.stroke(); if (d > 0) { br(ex, ey, a - .5 - r() * .4, L * .72, w * .66, d - 1); br(ex, ey, a + .5 + r() * .4, L * .68, w * .62, d - 1); } };
  br(0, 2, -Math.PI / 2 + (r() - .5) * .25, s * .75, s * .22, 3); g.fillStyle = col; g.beginPath(); g.moveTo(-s * .26, 2); g.quadraticCurveTo(0, -s * .1, s * .26, 2); g.fill(); };
SPR.giantmush = (g, s, v, r) => { shadowE(g, s * .8, s * .22); const cs = [['#6a3aa8', '#a06aeb', '#d8b0ff'], ['#2a7a8a', '#4ab8c8', '#a0ecf4'], ['#b83a5a', '#ee6a8a', '#ffb0c4']][v % 3]; const h = s * 1.1; g.fillStyle = grad(g, -s * .2, 0, s * .2, 0, ['#c8bea4', '#f0e8d0', '#fff8e8']); g.beginPath(); g.moveTo(-s * .24, 0); g.quadraticCurveTo(-s * .1, -h * .5, -s * .14, -h); g.lineTo(s * .14, -h); g.quadraticCurveTo(s * .1, -h * .5, s * .24, 0); g.fill();
  g.fillStyle = cs[0]; g.beginPath(); g.ellipse(0, -h, s * .78, s * .5, 0, Math.PI, 0); g.quadraticCurveTo(0, -h + s * .22, -s * .78, -h); g.fill(); g.fillStyle = cs[1]; g.beginPath(); g.ellipse(0, -h, s * .72, s * .45, 0, Math.PI * 1.02, Math.PI * 1.98); g.quadraticCurveTo(0, -h - s * .1, -s * .72, -h); g.fill();
  g.fillStyle = cs[2]; ell(g, -s * .26, -h - s * .28, s * .22, s * .09, -.4); for (const [x, y, rr] of [[.3, .3, .1], [-.05, .38, .07], [.5, .12, .07], [-.45, .2, .06]]) { g.fillStyle = '#ffffffcc'; circ(g, s * x, -h - s * y, s * rr); } glowDot(g, 0, -h, s * 1.1, alpha(cs[1].length === 7 ? cs[1] : '#a06aeb', .16)); };
SPR.reeds = (g, s, v, r) => { for (let i = 0; i < 7; i++) { const x = (i - 3) * s * .13 + (r() - .5) * 3, h = s * (.9 + r() * .7); g.strokeStyle = i % 2 ? '#5a8a3a' : '#3f6a2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 0); g.quadraticCurveTo(x + (r() - .5) * 6, -h * .6, x + (r() - .5) * 8, -h); g.stroke(); if (i % 3 === 0) { g.fillStyle = '#6a3e1e'; g.beginPath(); g.roundRect(x - 2.2, -h - 6, 4.4, 12, 2); g.fill(); } } };
SPR.skullpile = (g, s, v, r) => { shadowE(g, s * .9, s * .2); for (let i = 0; i < 5; i++) { const x = (i - 2) * s * .38 + (r() - .5) * 4, y = -(i % 2) * s * .35 - 1, rr = s * (.3 + r() * .1); g.fillStyle = '#ddd6bd'; circ(g, x, y - rr * .6, rr); g.fillStyle = '#b8b098'; ell(g, x, y - rr * .1, rr * .6, rr * .4); g.fillStyle = '#1a1612'; circ(g, x - rr * .35, y - rr * .6, rr * .22); circ(g, x + rr * .35, y - rr * .6, rr * .22); g.fillRect(x - 1, y - rr * .2, 2, rr * .3); } };
