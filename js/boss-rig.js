/* boss-rig.js — motor de chefes 360° + Dragão detalhado. Carregar DEPOIS de enemy-art.js e ANTES de open-world.js */
(function(){'use strict';
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const mix = (a, b, t) => a + (b - a) * t;
function mulberry(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function hexToRgb(h) {
  if (h[0] === '#') h = h.slice(1);
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgbStr = (r, g, b, a = 1) => (a >= 1 ? `rgb(${r | 0},${g | 0},${b | 0})` : `rgba(${r | 0},${g | 0},${b | 0},${a})`);
function shade(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  const f = v => clamp(Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt)), 0, 255);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
function alpha(hex, a) { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }
function mixHex(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); return rgbStr(mix(A[0], B[0], t), mix(A[1], B[1], t), mix(A[2], B[2], t)); }
const circ = (g, x, y, r) => { g.beginPath(); g.arc(x, y, Math.max(.1, r), 0, TAU); g.fill(); };
let GLOWQ = null;
function clearOf(col) { let m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(col); if (m) return `rgba(${m[1]},${m[2]},${m[3]},0)`; if (typeof col === 'string' && col[0] === '#') return alpha(col, 0); return 'rgba(0,0,0,0)'; }
function glowDot(g, x, y, r, col) { if (GLOWQ) { GLOWQ.push([g.getTransform(), x, y, r, col]); return; } const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, clearOf(col)); g.fillStyle = gr; circ(g, x, y, r); }
const hexOf = c => { const m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(c); return m ? '#' + [m[1], m[2], m[3]].map(v => (+v).toString(16).padStart(2, '0')).join('') : c; };
function grad(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c)); return gr; }
const FIN = {};
function finishDraw(g, W, H, ox, oy, drawFn, opt = {}) {
  const m = g.getTransform ? g.getTransform() : { a: 1 }, res = clamp(Math.ceil(Math.abs(m.a) * (opt.q || 1.15)), 2, 5), w = Math.ceil(W * res), h = Math.ceil(H * res);
  const P = FIN[opt.slot || 'h'] || (FIN[opt.slot || 'h'] = { a: document.createElement('canvas'), b: document.createElement('canvas') });
  const A = P.a, B = P.b; if (A.width !== w || A.height !== h) { A.width = B.width = w; A.height = B.height = h; }
  const a = A.getContext('2d'), b = B.getContext('2d');
  a.setTransform(1, 0, 0, 1, 0, 0); a.globalCompositeOperation = 'source-over'; a.clearRect(0, 0, w, h);
  if (!A.__ns) { A.__ns = 1; const a0 = A.getContext('2d'); try { Object.defineProperty(a0, 'shadowBlur', { get() { return 0; }, set() { } }); } catch (e) { /* sem suporte */ } }
  a.setTransform(res, 0, 0, res, ox * res, oy * res); const q = GLOWQ = []; try { drawFn(a); } finally { GLOWQ = null; } a.setTransform(1, 0, 0, 1, 0, 0);
  a.globalCompositeOperation = 'source-atop';
  let gr = a.createLinearGradient(0, 0, w * .85, h * .9); gr.addColorStop(0, 'rgba(255,244,214,.20)'); gr.addColorStop(.45, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(14,6,44,.30)'); a.fillStyle = gr; a.fillRect(0, 0, w, h);
  gr = a.createLinearGradient(0, (oy - 16) * res, 0, oy * res); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(8,4,20,.28)'); a.fillStyle = gr; a.fillRect(0, (oy - 16) * res, w, 16 * res + 2);
  a.globalCompositeOperation = 'source-over';
  b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, w, h);
  const o = (opt.line || 1.05) * res * .5 * 2;
  for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4; b.drawImage(A, Math.cos(an) * o, Math.sin(an) * o); }
  b.globalCompositeOperation = 'source-in'; b.fillStyle = opt.col || '#0a0612'; b.fillRect(0, 0, w, h); b.globalCompositeOperation = 'source-over';
  g.save(); g.scale(1 / res, 1 / res); g.drawImage(B, -ox * res, -oy * res); g.drawImage(A, -ox * res, -oy * res); g.restore();
  if (q.length) { const bi = new DOMMatrix([res, 0, 0, res, ox * res, oy * res]).inverse(); for (const [m, x, y, r, col] of q) { const rel = bi.multiply(m); g.save(); g.transform(rel.a, rel.b, rel.c, rel.d, rel.e, rel.f); glowDot(g, x, y, r, col); g.restore(); } }
}
/* ============================================================
   MOTOR DE MODELOS PARA CHEFES — peças 3D projetadas em qualquer ângulo (giro contínuo de 360°)
   Eixos do mundo do chefe: x = direita, y = altura, z = frente (para onde ele olha).
   ============================================================ */
const BOSS_DRAW = {};
const RG = { list: [], yaw: 0, c: 1, s: 0, ce: .95, se: .31, k: null };
const RG_OUT = 'rgba(8,4,14,.62)';
const sh = (c, a) => shade(hexOf(c), a);
const mh = (a, b, t) => hexOf(mixHex(hexOf(a), hexOf(b), t));
function rgBegin(yaw, k, elev = .32) { RG.yaw = yaw; RG.c = Math.cos(yaw); RG.s = Math.sin(yaw); RG.ce = Math.cos(elev); RG.se = Math.sin(elev); RG.list.length = 0; RG.k = k; }
const rgP = p => { const d = p[2] * RG.c - p[0] * RG.s; return [p[0] * RG.c + p[2] * RG.s, -p[1] * RG.ce + d * RG.se, d]; };
const rgV = (x, y, z) => { const d = z * RG.c - x * RG.s; return [x * RG.c + z * RG.s, -y * RG.ce + d * RG.se]; };
const rgFace = n => -n[0] * RG.s + n[2] * RG.c;   // > 0: a normal aponta para o observador
const V3 = (x, y, z) => [x, y, z];
const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const vmul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const vlerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function rotV(v, pit, yw, rl) {
  let [x, y, z] = v;
  if (rl) { const c = Math.cos(rl), s = Math.sin(rl); [x, y] = [x * c - y * s, x * s + y * c]; }
  if (pit) { const c = Math.cos(pit), s = Math.sin(pit); [y, z] = [y * c - z * s, y * s + z * c]; }
  if (yw) { const c = Math.cos(yw), s = Math.sin(yw); [x, z] = [x * c + z * s, -x * s + z * c]; }
  return [x, y, z];
}
const visOk = o => !o.vis || rgFace(o.vis) > -.12;

/* ---------- texturas (no referencial da elipse; clip já aplicado) ---------- */
const RTEX = {
  scales(g, rx, ry, col, o) {
    const sz = Math.max(3.4, Math.min(rx, ry) * (o.ts || .3)), ph = (RG.yaw * rx * .7) % sz; g.lineWidth = Math.max(.6, sz * .08);
    for (let y = -ry, r = 0; y < ry + sz; y += sz * .6, r++) for (let x = -rx - sz + ph + (r & 1) * sz * .5; x < rx + sz; x += sz) {
      g.strokeStyle = 'rgba(0,0,0,.34)'; g.beginPath(); g.arc(x, y, sz * .52, .05, Math.PI - .05); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.13)'; g.beginPath(); g.arc(x, y - sz * .1, sz * .4, Math.PI * 1.12, Math.PI * 1.88); g.stroke();
    }
  },
  bands(g, rx, ry, col, o) { const n = o.bn || 7; g.lineWidth = 1.1; for (let i = -n; i <= n; i++) { const y = i * ry / (n * .95); g.strokeStyle = 'rgba(0,0,0,.34)'; g.beginPath(); g.moveTo(-rx, y); g.quadraticCurveTo(0, y + ry * .16, rx, y); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.moveTo(-rx, y + 1.2); g.quadraticCurveTo(0, y + ry * .16 + 1.2, rx, y + 1.2); g.stroke(); } },
  plates(g, rx, ry, col, o) { const sz = Math.max(5, Math.min(rx, ry) * .4); g.lineWidth = .9; g.strokeStyle = 'rgba(0,0,0,.4)'; for (let y = -ry; y < ry; y += sz) { g.beginPath(); g.moveTo(-rx, y); g.lineTo(rx, y); g.stroke(); for (let x = -rx + ((y / sz) & 1) * sz * .5; x < rx; x += sz * 1.4) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + sz); g.stroke(); } } g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(-rx, -ry, rx * .5, ry * 2); },
  cracks(g, rx, ry, col, o) { const rnd = mulberry(((RG.k && RG.k.seed) | 0) + (o.cs || 5)); g.lineCap = 'round'; for (let i = 0; i < (o.cn || 7); i++) { let x = (rnd() - .5) * rx * 1.6, y = (rnd() - .5) * ry * 1.6; g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 5; j++) { x += (rnd() - .5) * rx * .55; y += (rnd() - .3) * ry * .4; g.lineTo(x, y); } g.strokeStyle = 'rgba(255,90,20,.35)'; g.lineWidth = 3.4; g.stroke(); g.strokeStyle = o.cc || '#ffc060'; g.lineWidth = 1.2; g.stroke(); } },
  fur(g, rx, ry, col, o) { const rnd = mulberry(11); g.lineWidth = .9; for (let i = 0; i < (o.fn || 80); i++) { const x = (rnd() * 2 - 1) * rx, y = (rnd() * 2 - 1) * ry; g.strokeStyle = rnd() > .5 ? 'rgba(0,0,0,.28)' : 'rgba(255,255,255,.16)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 2, y + 5); g.stroke(); } },
  bark(g, rx, ry, col, o) { g.lineWidth = 1.3; for (let i = -9; i <= 9; i++) { const x = i * rx / 8.5; g.strokeStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.moveTo(x, -ry); g.bezierCurveTo(x + 4, -ry * .4, x - 4, ry * .3, x + 2, ry); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.moveTo(x + 1.5, -ry); g.bezierCurveTo(x + 5.5, -ry * .4, x - 2.5, ry * .3, x + 3.5, ry); g.stroke(); } },
  feather(g, rx, ry, col, o) { const sz = Math.max(4, Math.min(rx, ry) * .3); g.lineWidth = .8; for (let y = -ry; y < ry + sz; y += sz * .7) for (let x = -rx + ((y / sz) & 1) * sz * .5; x < rx + sz; x += sz) { g.strokeStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.moveTo(x - sz * .4, y); g.quadraticCurveTo(x, y + sz * 1.1, x + sz * .4, y); g.stroke(); } },
  rivets(g, rx, ry, col, o) { g.fillStyle = 'rgba(255,255,255,.35)'; const sz = Math.max(6, Math.min(rx, ry) * .45); for (let y = -ry + sz / 2; y < ry; y += sz) for (let x = -rx + sz / 2; x < rx; x += sz) { g.beginPath(); g.arc(x, y, 1, 0, TAU); g.fill(); } },
  runes(g, rx, ry, col, o) { const rnd = mulberry(7 + (o.cs || 0)); g.strokeStyle = o.cc || '#9fe8ff'; g.lineWidth = 1.1; g.shadowBlur = 0; for (let i = 0; i < (o.cn || 6); i++) { const x = (rnd() - .5) * rx * 1.5, y = (rnd() - .5) * ry * 1.5, s = 2.6 + rnd() * 2; g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s * .6, y); g.lineTo(x, y + s); g.lineTo(x - s * .6, y); g.closePath(); g.moveTo(x, y - s * .4); g.lineTo(x, y + s * .4); g.stroke(); } },
  stripes(g, rx, ry, col, o) { g.fillStyle = 'rgba(0,0,0,.28)'; for (let i = -6; i <= 6; i += 2) { g.beginPath(); g.moveTo(i * rx / 6 - rx * .08, -ry); g.quadraticCurveTo(i * rx / 6 + rx * .1, 0, i * rx / 6 - rx * .08, ry); g.lineTo(i * rx / 6 + rx * .08, ry); g.quadraticCurveTo(i * rx / 6 + rx * .26, 0, i * rx / 6 + rx * .08, -ry); g.closePath(); g.fill(); } }
};
function applyTex(g, rx, ry, col, o) { const t = o.tex; if (!t) return; for (const n of (Array.isArray(t) ? t : [t])) if (RTEX[n]) RTEX[n](g, rx, ry, col, o); }

/* ---------- elipsoide ---------- */
function rgEll(p, r, col, o = {}) {
  if (!visOk(o)) return;
  const cp = rgP(p), ax = [[r[0], 0, 0], [0, r[1], 0], [0, 0, r[2]]].map(v => { const w = rotV(v, o.pit, o.yw, o.rl); return rgV(w[0], w[1], w[2]); });
  let a = 0, b = 0, c = 0; for (const [x, y] of ax) { a += x * x; b += x * y; c += y * y; }
  const ang = .5 * Math.atan2(2 * b, a - c), m = (a + c) / 2, dd = Math.sqrt(((a - c) / 2) ** 2 + b * b), rx = Math.sqrt(m + dd), ry = Math.sqrt(Math.max(.25, m - dd));
  RG.list.push({ d: cp[2] + (o.bias || 0), f: g => {
    g.save(); g.translate(cp[0], cp[1]); g.rotate(ang);
    const R = Math.max(rx, ry), ca = Math.cos(-ang), sa = Math.sin(-ang), lx = -.34 * R * ca + .44 * R * sa, ly = -.34 * R * sa - .44 * R * ca;
    g.save(); g.scale(1, ry / rx); const gr = g.createRadialGradient(lx * .8, ly * (rx / ry) * .8, rx * .06, 0, 0, rx * 1.08);
    gr.addColorStop(0, o.hi || sh(col, .42)); gr.addColorStop(.5, col); gr.addColorStop(1, o.dk || sh(col, -.55)); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore();
    if (o.tex) { g.save(); g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, TAU); g.clip(); applyTex(g, rx, ry, col, o); g.restore(); }
    if (o.glow) { g.save(); g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, TAU); g.clip(); const gg = g.createRadialGradient(0, 0, 0, 0, 0, R); gg.addColorStop(0, alpha(o.glow, .85)); gg.addColorStop(1, alpha(o.glow, 0)); g.fillStyle = gg; g.fillRect(-rx, -ry, rx * 2, ry * 2); g.restore(); }
    g.strokeStyle = o.line || RG_OUT; g.lineWidth = o.lw || 1.1; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, TAU); g.stroke();
    g.restore();
  } });
}
/* ---------- tubo cônico suave (pescoço, cauda, braços, chifres, tentáculos) ---------- */
function crPt(p0, p1, p2, p3, t) { const t2 = t * t, t3 = t2 * t; return [0, 1, 2].map(i => .5 * ((2 * p1[i]) + (-p0[i] + p2[i]) * t + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t2 + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * t3)); }
function rgSmooth(pts, ws, sub) {
  const P = [], W = [], n = pts.length;
  for (let i = 0; i < n - 1; i++) for (let s = 0; s < sub; s++) { const t = s / sub; P.push(crPt(pts[Math.max(0, i - 1)], pts[i], pts[i + 1], pts[Math.min(n - 1, i + 2)], t)); W.push(ws[i] + (ws[i + 1] - ws[i]) * t); }
  P.push(pts[n - 1]); W.push(ws[n - 1]); return { P, W };
}
function rgTube(pts, ws, col, o = {}) {
  if (!visOk(o)) return;
  const sm = rgSmooth(pts, ws, o.sub || 4), Q = sm.P.map(rgP), W = sm.W, n = Q.length; let dsum = 0; for (const q of Q) dsum += q[2];
  RG.list.push({ d: dsum / n + (o.bias || 0), f: g => {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const pass = (c, wm, ox, oy, add) => { g.strokeStyle = c; for (let i = 0; i < n - 1; i++) { g.lineWidth = Math.max(.5, (W[i] + W[i + 1]) / 2 * wm + (add || 0)); g.beginPath(); g.moveTo(Q[i][0] + ox * W[i], Q[i][1] + oy * W[i]); g.lineTo(Q[i + 1][0] + ox * W[i + 1], Q[i + 1][1] + oy * W[i + 1]); g.stroke(); } };
    pass(o.line || RG_OUT, 1, 0, 0, 2.2); pass(o.dk || sh(col, -.5), 1, 0, 0, 0); pass(col, .84, -.05, -.05, 0); pass(o.hi || sh(col, .32), .34, -.2, -.22, 0);
    if (o.rings) { g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 1; for (let i = 2; i < n - 2; i += o.rings) { const dx = Q[i + 1][0] - Q[i - 1][0], dy = Q[i + 1][1] - Q[i - 1][1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, w = W[i] * .48; g.beginPath(); g.moveTo(Q[i][0] - nx * w, Q[i][1] - ny * w); g.lineTo(Q[i][0] + nx * w, Q[i][1] + ny * w); g.stroke(); } }
    if (o.dots) { g.fillStyle = o.dots; for (let i = 3; i < n - 2; i += 3) { const dx = Q[i + 1][0] - Q[i - 1][0], dy = Q[i + 1][1] - Q[i - 1][1], l = Math.hypot(dx, dy) || 1; g.beginPath(); g.arc(Q[i][0] - dy / l * W[i] * .22, Q[i][1] + dx / l * W[i] * .22, Math.max(.8, W[i] * .1), 0, TAU); g.fill(); } }
  } });
}
/* ---------- espinho / garra / presa ---------- */
function rgSpike(a, b, w, col, o = {}) {
  if (!visOk(o)) return; const A = rgP(a), B = rgP(b);
  RG.list.push({ d: (A[2] + B[2]) / 2 + (o.bias || 0), f: g => {
    const dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l * w / 2, ny = dx / l * w / 2;
    g.fillStyle = grad(g, A[0] + nx, A[1] + ny, A[0] - nx, A[1] - ny, [sh(col, .3), col, sh(col, -.45)]); g.beginPath(); g.moveTo(A[0] + nx, A[1] + ny); g.quadraticCurveTo((A[0] + B[0]) / 2 + nx * .35 + (o.cx || 0), (A[1] + B[1]) / 2 + ny * .35 + (o.cy || 0), B[0], B[1]); g.quadraticCurveTo((A[0] + B[0]) / 2 - nx * .35 + (o.cx || 0), (A[1] + B[1]) / 2 - ny * .35 + (o.cy || 0), A[0] - nx, A[1] - ny); g.closePath(); g.fill(); g.strokeStyle = RG_OUT; g.lineWidth = .9; g.stroke();
    if (o.ridge) { g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = .8; for (let i = 1; i < 4; i++) { const t = i / 4.4, px = A[0] + dx * t, py = A[1] + dy * t, ww = (1 - t) * .5; g.beginPath(); g.moveTo(px + nx * ww, py + ny * ww); g.lineTo(px - nx * ww, py - ny * ww); g.stroke(); } }
  } });
}
/* ---------- polígono plano 3D (asas, membranas, capas, bandeiras) ---------- */
function rgPoly(pts, col, o = {}) {
  if (!visOk(o)) return; const Q = pts.map(rgP); let dsum = 0; for (const q of Q) dsum += q[2];
  RG.list.push({ d: dsum / Q.length + (o.bias || 0), f: g => {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const q of Q) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); }
    g.save(); g.globalAlpha = o.a == null ? 1 : o.a; g.beginPath(); g.moveTo(Q[0][0], Q[0][1]); for (let i = 1; i < Q.length; i++) g.lineTo(Q[i][0], Q[i][1]); g.closePath();
    g.fillStyle = grad(g, x0, y0, x1, y1, o.stops || [sh(col, .22), col, sh(col, -.42)]); g.fill(); g.globalAlpha = 1;
    if (o.veins) { g.strokeStyle = o.vc || 'rgba(0,0,0,.28)'; g.lineWidth = .9; for (const [i, j] of o.veins) { g.beginPath(); g.moveTo(Q[i][0], Q[i][1]); g.lineTo(Q[j][0], Q[j][1]); g.stroke(); } }
    g.strokeStyle = o.line || RG_OUT; g.lineWidth = o.lw || 1.2; g.stroke(); g.restore();
  } });
}
/* ---------- olho ---------- */
function rgEye(p, r, col, n = [0, 0, 1], o = {}) {
  const f = rgFace(n); if (f < .06) return; const A = rgP(p);
  RG.list.push({ d: A[2] + (o.bias == null ? 8 : o.bias), f: g => {
    g.save(); g.translate(A[0], A[1]); const w = Math.max(.3, f);
    if (o.socket !== false) { g.fillStyle = 'rgba(10,4,12,.75)'; g.beginPath(); g.ellipse(0, 0, r * 1.28 * w, r * 1.16, 0, 0, TAU); g.fill(); }
    g.fillStyle = o.white || '#f6f0d8'; g.beginPath(); g.ellipse(0, 0, r * w, r * .95, 0, 0, TAU); g.fill();
    g.fillStyle = col; g.beginPath(); g.ellipse(0, 0, r * .78 * w, r * .8, 0, 0, TAU); g.fill();
    g.fillStyle = o.pupil || '#10060a'; g.beginPath(); if (o.round) g.ellipse(0, 0, r * .34 * w, r * .34, 0, 0, TAU); else g.ellipse(0, 0, r * .17 * w, r * .76, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(-r * .26 * w, -r * .3, r * .17, 0, TAU); g.fill();
    g.strokeStyle = RG_OUT; g.lineWidth = .8; g.beginPath(); g.ellipse(0, 0, r * w, r * .95, 0, 0, TAU); g.stroke(); g.restore(); glowDot(g, A[0], A[1], r * 2.8, alpha(col.length === 7 ? col : '#ffe030', .35));
  } });
}
function rgGlow(p, r, col, bias = 20) { const A = rgP(p); RG.list.push({ d: A[2] + bias, f: g => glowDot(g, A[0], A[1], r, col) }); }
function rgShadow(rx, rz) { RG.shadow = [rx, rz]; }
function rgFlush(g) { RG.list.sort((a, b) => a.d - b.d); for (const it of RG.list) { g.save(); it.f(g); g.restore(); } }
/* chama a construção do modelo e aplica o acabamento */
function bossRig(g, k, build, box) {
  const u = k.R / 40, yaw = Math.PI / 2 - (k.ang || 0), b = box || [440, 360, 220, 290];
  g.save(); g.scale(u, u); rgBegin(yaw, k); RG.shadow = null; build(k);
  if (RG.shadow) { const [rx, rz] = RG.shadow, A = rgP([0, 0, 0]); g.fillStyle = 'rgba(6,6,12,.3)'; g.beginPath(); g.ellipse(A[0], A[1] + 3, Math.hypot(rx * RG.c, rz * RG.s) * .8, (Math.hypot(rx * RG.s, rz * RG.c) * .8) * .3 + 6, 0, 0, TAU); g.fill(); }
  finishDraw(g, b[0], b[1], b[2], b[3], c => rgFlush(c), { slot: 'boss', line: 1.5 });
  g.restore();
}
function defBoss(kind, build, box) { BOSS_DRAW[kind] = (g, k) => bossRig(g, k, build, box); }
/* ============================================================
   DRAGÃO ANCIÃO — modelo completo (qualquer ângulo)
   ============================================================ */
defBoss('dragon', k => {
  const t = k.t, [c0, d0, a0, ey] = k.pal, ph = k.phase, wind = k.wind, atk = k.atk, mv = Math.min(1, k.mv || 0);
  const col = c0, dk = d0, bone = '#e9dfc4', belly = mh(a0, c0, .38), mem = mh(c0, d0, .55), memHi = mh(c0, '#ff9a4a', .3);
  const br = Math.sin(t * 1.8) * 1.4, sw = Math.sin(t * 1.3);
  const tex = ph >= 1 ? ['scales', 'cracks'] : 'scales';
  rgShadow(120, 130);

  /* ---- cauda ---- */
  const tail = []; const TL = [[0, 66, -86], [0, 58, -130], [0, 44, -172], [0, 34, -212], [0, 28, -246], [0, 26, -274]];
  TL.forEach((p, i) => tail.push([p[0] + sw * (i * i) * 1.5 + Math.sin(t * 2.2 + i) * i * .8, p[1] - (i > 3 ? 0 : 0) + (wind > 0 ? wind * i * 4 : 0), p[2] - atk * i * 3]));
  rgTube(tail, [34, 28, 21, 14, 8, 2.5], col, { rings: 0, dk: sh(col, -.55) });
  for (let i = 0; i < 6; i++) { const p = vlerp(tail[Math.floor(i * .8)], tail[Math.min(5, Math.floor(i * .8) + 1)], (i * .8) % 1), h = 16 - i * 2; rgSpike(vadd(p, [0, 12 - i, 0]), vadd(p, [0, 12 - i + h, -4]), 9 - i, dk); }
  const tp = tail[5]; rgSpike(tp, vadd(tp, [0, 0, -30]), 15, bone, { bias: 1 }); rgSpike(vadd(tp, [0, 0, -6]), vadd(tp, [22, 4, -22]), 10, bone); rgSpike(vadd(tp, [0, 0, -6]), vadd(tp, [-22, 4, -22]), 10, bone);

  /* ---- asas ---- */
  const flap = Math.sin(t * (mv > .2 ? 5.2 : 2.3)) * .26 + wind * .34 - atk * .2;
  for (const sd of [-1, 1]) {
    const S = [sd * 34, 112 + br, 8], ca = Math.cos(.95 + flap), sa = Math.sin(.95 + flap), sweep = .32 - flap * .35 + (mv > .2 ? .1 : 0);
    const E = vadd(S, [sd * ca * 62 * Math.cos(sweep), sa * 62, -ca * 62 * Math.sin(sweep) - 4]);
    const a2 = .5 + flap * 1.15, c2 = Math.cos(a2), s2 = Math.sin(a2), sw2 = .5 + sweep * .4;
    const W = vadd(E, [sd * c2 * 92 * Math.cos(sw2), s2 * 92, -c2 * 92 * Math.sin(sw2)]);
    const fl = [152, 160, 132, 102], ga = [.62, .12, -.38, -.86], gb = [.18, .42, .66, .9];
    const F = fl.map((L, i) => { const g2 = ga[i] + flap * (.9 - i * .15), cg = Math.cos(g2); return vadd(W, [sd * cg * L * Math.cos(gb[i] - flap * .2), Math.sin(g2) * L, -cg * L * Math.sin(gb[i] - flap * .2)]); });
    const H = [sd * 24, 82 + br, -40]; const pts = [S, E, W, F[0]]; const veins = [];
    const edge = [F[0]]; for (let i = 0; i < 3; i++) { const m = vlerp(F[i], F[i + 1], .5), v = vlerp(m, W, .27); for (let s2i = 1; s2i <= 4; s2i++) { const tt = s2i / 5, a = vlerp(F[i], v, tt), b = vlerp(v, F[i + 1], tt); edge.push(vlerp(a, b, tt)); } edge.push(F[i + 1]); }
    const poly = [S, E, W, ...edge, H]; const idx = {}; poly.forEach((p, i) => { idx[i] = 1; }); const vein = []; for (let i = 0; i < 4; i++) vein.push([2, 3 + (i === 0 ? 0 : 1 + (i - 1) * 6 + (i > 0 ? 0 : 0))]);
    rgPoly(poly, mem, { stops: [sh(mem, .05), memHi, sh(mem, -.1)], a: .96, bias: -2, veins: vein, vc: 'rgba(40,6,4,.45)', lw: 1.4 });
    // membrana secundária (mais clara perto dos ossos)
    rgPoly([S, E, W, vlerp(W, F[3], .5), vlerp(S, H, .5)], sh(mem, .12), { a: .5, bias: -1.9, line: 'rgba(0,0,0,0)' });
    rgTube([S, E, W], [11, 8, 6], col, { bias: 0, dk: sh(col, -.5) });
    for (let i = 0; i < 4; i++) rgTube([W, vlerp(W, F[i], .55), F[i]], [5, 3.2, .8], bone, { bias: 0 });
    rgEll(E, [7, 7, 7], sh(col, .1), { tex: 'scales', ts: .5, bias: 1 }); rgEll(W, [8, 8, 8], sh(col, .05), { tex: 'scales', ts: .5, bias: 1 });
    rgSpike(vadd(W, [0, 4, 2]), vadd(W, [sd * 6, 30, 10]), 8, bone, { bias: 2 });
    for (let i = 0; i < 3; i++) rgSpike(vlerp(S, E, .25 + i * .3), vadd(vlerp(S, E, .25 + i * .3), [0, 12, -6]), 6, dk);
  }

  /* ---- corpo ---- */
  rgEll([0, 76 + br, -8], [41, 41, 76], col, { tex, pit: -.05 });
  rgEll([0, 86 + br, 36], [43, 43, 38], col, { tex, bias: 0 });
  rgEll([0, 74 + br, -60], [43, 43, 40], col, { tex });
  rgEll([0, 74 + br, 56], [24, 38, 20], belly, { tex: 'bands', bn: 6, vis: [0, 0, 1], bias: 3 });
  rgEll([0, 38, 0], [28, 13, 74], belly, { tex: 'bands', bn: 8, bias: 1, vis: [0, -1, 0.0001] });
  rgEll([0, 52 + br, 30], [30, 26, 34], belly, { tex: 'bands', bn: 6, bias: 1, vis: [0, -.2, 1] });
  // espinhos dorsais
  for (let i = 0; i < 12; i++) { const z = 52 - i * 12, y = 77 + br + 41 * Math.sqrt(Math.max(0, 1 - (Math.min(76, Math.abs(z + 8)) / 76) ** 2)) + (z > 20 ? 6 : 0), h = 20 - i * .8 + (i === 0 ? 4 : 0); rgSpike([0, y - 2, z], [0, y + h, z - 7], 10 - i * .4, dk, { bias: 2, ridge: true }); }

  /* ---- patas traseiras ---- */
  for (const sd of [-1, 1]) {
    const lift = Math.max(0, Math.sin(k.ph + (sd > 0 ? 0 : Math.PI))) * mv * 14, fz = -40 - mv * Math.sin(k.ph + (sd > 0 ? 0 : Math.PI)) * 12;
    rgEll([sd * 46, 62, -58], [22, 34, 30], col, { tex, bias: 1 });
    rgTube([[sd * 46, 68, -58], [sd * 48, 38, -38 + fz * .1], [sd * 46, 18 + lift * .4, -62 + fz * .1], [sd * 46, 6 + lift, fz - 10]], [24, 18, 12, 11], col, { tex: null, bias: 2 });
    rgEll([sd * 46, 5 + lift, fz - 2], [14, 6.5, 22], sh(col, -.05), { tex: 'scales', ts: .5, bias: 3 });
    for (let i = -1; i <= 1; i++) { rgSpike([sd * 46 + i * 8, 5 + lift, fz + 14], [sd * 46 + i * 9.5, 1 + lift, fz + 34], 7, bone, { bias: 4 }); }
    rgSpike([sd * 46, 16 + lift * .4, -68], [sd * 46, 4 + lift * .4, -86], 6, bone, { bias: 1 });
  }
  /* ---- patas dianteiras ---- */
  for (const sd of [-1, 1]) {
    const sp = Math.sin(k.ph + (sd > 0 ? Math.PI : 0)), lift = Math.max(0, sp) * mv * 16 + wind * 20, fz = 58 + sp * mv * 10 + atk * 12;
    rgTube([[sd * 40, 88 + br, 30], [sd * 52, 58, 22], [sd * 46, 28 + lift * .5, 42], [sd * 46, 8 + lift, fz]], [24, 19, 13, 13], col, { bias: 2 });
    rgEll([sd * 48, 58, 22], [10, 10, 10], sh(col, .08), { tex: 'scales', ts: .5, bias: 3 });
    rgEll([sd * 46, 6 + lift, fz + 4], [15, 6.5, 18], sh(col, -.05), { tex: 'scales', ts: .5, bias: 4 });
    for (let i = -1; i <= 1; i++) rgSpike([sd * 46 + i * 8.5, 6 + lift, fz + 16], [sd * 46 + i * 10, 1 + lift, fz + 36], 7.5, bone, { bias: 5 });
  }

  /* ---- pescoço ---- */
  const lunge = atk * 1, pull = wind;
  const hb = [0, 172 + br - lunge * 34 + pull * 14, 108 + lunge * 52 - pull * 22];
  const neck = [[0, 104 + br, 50], [0, 126 + br, 68 - pull * 6], [0, 150 + br - lunge * 12, 80 + lunge * 20 - pull * 12], [0, 164 + br - lunge * 22 + pull * 8, 96 + lunge * 36 - pull * 18], hb];
  rgTube(neck, [38, 33, 28, 25, 22], col, { bias: 1 });
  rgTube(neck.map(p => vadd(p, [0, -5, 8])), [20, 17, 14, 13, 11], belly, { rings: 3, vis: [0, -.3, 1], bias: 2 });
  for (let i = 0; i < 6; i++) { const q = crPt(neck[Math.max(0, Math.min(3, Math.floor(i * .75) - 1))], neck[Math.min(3, Math.floor(i * .75))], neck[Math.min(4, Math.floor(i * .75) + 1)], neck[4], (i * .75) % 1); rgSpike(vadd(q, [0, 11, 0]), vadd(q, [0, 24 - i, -8]), 8, dk, { bias: 3 }); }

  /* ---- cabeça ---- */
  const open = Math.max(wind * .8, atk, .06 + Math.sin(t * 1.5) * .04), H = hb;
  rgEll(vadd(H, [0, 0, 0]), [18, 16, 23], col, { tex, bias: 2 });
  rgEll(vadd(H, [0, -3, 25]), [12, 9, 20], sh(col, .04), { tex: 'scales', ts: .5, pit: .1 + open * .05, bias: 3 });
  rgEll(vadd(H, [0, 3, 42]), [8, 5, 7], sh(col, .1), { bias: 4 });                // ponta do focinho
  rgEll(vadd(H, [0, -12 - open * 14, 17]), [10.5, 5, 22], sh(col, -.08), { pit: open * .5, tex: 'scales', ts: .5, bias: 2 }); // mandíbula
  rgEll(vadd(H, [0, -8 - open * 7, 14]), [8.5, 3 + open * 3, 20], '#2a0608', { bias: 1, pit: open * .2 });                      // boca
  rgEll(vadd(H, [0, -9 - open * 8, 18]), [5, 2.4, 13], '#d0506a', { bias: 1.5 });                                               // língua
  for (const sd of [-1, 1]) {
    rgEll(vadd(H, [sd * 4.6, 5, 47]), [2.6, 2, 3], '#10050a', { bias: 5 });
    rgEye(vadd(H, [sd * 11, 5, 13]), 5.4, ey, [sd * .6, .1, .8]);
    rgTube([vadd(H, [sd * 15, 9, 3]), vadd(H, [sd * 11, 11, 14]), vadd(H, [sd * 5, 8, 26])], [6, 5, 2], sh(col, -.12), { bias: 6 });
    // chifres principais
    rgTube([vadd(H, [sd * 12, 12, -6]), vadd(H, [sd * 22, 28, -22]), vadd(H, [sd * 36, 40, -46]), vadd(H, [sd * 46, 42, -68]), vadd(H, [sd * 49, 38, -82])], [9, 8, 6, 3.4, 0.4], bone, { bias: 1, dk: sh(bone, -.35), rings: 4 });
    rgTube([vadd(H, [sd * 15, 2, -8]), vadd(H, [sd * 30, 6, -22]), vadd(H, [sd * 40, 16, -32])], [6, 4, .5], bone, { bias: 1 });
    // espinhos da bochecha / queixo
    rgSpike(vadd(H, [sd * 13, -1, 4]), vadd(H, [sd * 34, -5, -12]), 8, bone, { bias: 1 }); rgSpike(vadd(H, [sd * 12, -7, 8]), vadd(H, [sd * 27, -15, 2]), 6, bone, { bias: 1 });
    // dentes superiores e inferiores
    for (let i = 0; i < 6; i++) { const z = 14 + i * 5.4; rgSpike(vadd(H, [sd * (8.5 - i * .5), -9, z]), vadd(H, [sd * (8.5 - i * .5), -17 - (i % 2) * 2, z + 1]), 3.2, '#f4efe0', { bias: 6 }); rgSpike(vadd(H, [sd * (7.5 - i * .4), -12 - open * 14 + 3, z - 2]), vadd(H, [sd * (7.5 - i * .4), -12 - open * 14 + 10 + (i % 2), z - 1]), 3, '#f4efe0', { bias: 6 }); }
    // franja atrás da cabeça
    rgPoly([vadd(H, [sd * 8, 12, -10]), vadd(H, [sd * 26, 18, -26]), vadd(H, [sd * 20, 4, -30]), vadd(H, [sd * 30, -2, -36]), vadd(H, [sd * 12, -6, -14])], memHi, { a: .92, bias: -1, veins: [[0, 2], [0, 3]] });
  }
  rgSpike(vadd(H, [0, 15, 2]), vadd(H, [0, 29, -12]), 9, dk, { bias: 3 });
  if (ph >= 1) for (const sd of [-1, 1]) rgGlow(vadd(H, [sd * 4.6, 5, 47]), 10, 'rgba(255,120,40,.5)', 9);
  if (wind > .05 || atk > 0) { const m = vadd(H, [0, -6, 44]); rgGlow(m, 34 + wind * 26, 'rgba(255,176,60,.95)', 30); for (let i = 1; i < 9 * atk + 1; i++) rgGlow(vadd(m, [Math.sin(t * 20 + i) * 4, -4 * i * .35, 18 + i * 26]), 16 + i * 6, `rgba(255,${150 - i * 8},40,${.55 * (1 - i / 11)})`, 30); }
}, [520, 430, 260, 320]);
/* ============================================================
   GIGANTES — Yeti Glacial e Ciclope do Ermo
   ============================================================ */
defBoss('yeti_giant', k => {
  const [fur, shade, ice, eye] = k.pal, breath = Math.sin(k.t * 1.8) * 2.5;
  const step = Math.sin(k.ph) * (k.mv || 0) * 15, slam = k.atk * 25 + k.wind * 12;
  rgShadow(112, 86);
  for (const side of [-1, 1]) {
    const lift = Math.max(0, Math.sin(k.ph + (side < 0 ? Math.PI : 0))) * (k.mv || 0) * 13;
    rgTube([[side * 28, 50, -8], [side * 31, 28, -2], [side * 32, 11 + lift, 13]], [24, 19, 15], fur, { tex: 'fur', fn: 95 });
    rgEll([side * 32, 8 + lift, 19], [20, 10, 25], shade, { tex: 'fur', fn: 35, bias: 2 });
    for (let claw = -1; claw <= 1; claw++) rgSpike([side * 32 + claw * 8, 7 + lift, 37], [side * 32 + claw * 9, 3 + lift, 48], 5, ice, { bias: 4 });
    const armX = side * (56 + slam * .25), handZ = 35 + slam;
    rgEll([side * 39, 117 + breath, 1], [27, 31, 27], fur, { tex: 'fur', fn: 60, bias: 1 });
    rgTube([[side * 39, 118 + breath, 2], [armX, 95 + breath + slam * .55, 15], [side * 59, 67 + slam, handZ]], [24, 20, 19], fur, { tex: 'fur', fn: 70, bias: 2 });
    rgEll([side * 59, 65 + slam, handZ], [22, 19, 20], shade, { tex: 'fur', fn: 30, bias: 4 });
    for (let claw = -1; claw <= 1; claw++) rgSpike([side * 59 + claw * 10, 62 + slam, handZ + 13], [side * 59 + claw * 12, 55 + slam, handZ + 26], 6, ice, { bias: 7 });
    rgEll([side * 52, 153 + breath, 10], [22, 18, 25], fur, { tex: 'fur', fn: 38, bias: 2 });
    rgSpike([side * 60, 151 + breath, 10], [side * 75, 171 + breath, 7], 13, shade, { bias: 5 });
  }
  rgEll([0, 91 + breath, -2], [57, 61, 43], fur, { tex: ['fur', 'scales'], fn: 170, ts: .22 });
  rgEll([0, 85 + breath, 34], [39, 44, 20], ice, { tex: 'bands', bn: 8, vis: [0, -.2, 1], bias: 3 });
  rgTube([[-37, 113 + breath, 38], [0, 97 + breath, 53], [37, 113 + breath, 38]], [7, 5, 7], shade, { bias: 5 });
  rgEll([0, 151 + breath, 24], [43, 39, 38], fur, { tex: 'fur', fn: 100, bias: 5 });
  rgEll([0, 137 + breath, 53], [23, 18, 18], ice, { bias: 7 });
  rgEll([0, 143 + breath, 68], [8, 6, 5], shade, { bias: 10 });
  for (const side of [-1, 1]) {
    rgEye([side * 16, 158 + breath, 55], 7, eye, [0, 0, 1], { round: true, bias: 11 });
    rgTube([[side * 5, 169 + breath, 56], [side * 17, 173 + breath, 54], [side * 29, 169 + breath, 49]], [7, 8, 5], shade, { bias: 10 });
    rgSpike([side * 13, 132 + breath, 65], [side * 17, 120 + breath, 69], 7, '#fffdf0', { bias: 11 });
    rgSpike([side * 30, 173 + breath, 25], [side * 37, 189 + breath, 16], 10, ice, { bias: 6 });
  }
  for (let i = -3; i <= 3; i++) rgSpike([i * 10, 181 + breath, 28], [i * 12, 196 + breath + Math.abs(i) * 2, 19], 9, fur, { bias: 8 });
  if (k.wind > .1 || k.atk > .1) rgGlow([0, 65, 65], 42 + slam, 'rgba(120,220,255,.6)', 30);
}, [560, 500, 280, 370]);

defBoss('cyclops', k => {
  const [skin, shade, bronze, eye] = k.pal, breath = Math.sin(k.t * 1.5) * 2;
  const step = Math.sin(k.ph) * (k.mv || 0) * 15, strike = k.atk * 38 + k.wind * 18;
  rgShadow(120, 90);
  for (const side of [-1, 1]) {
    const lift = Math.max(0, Math.sin(k.ph + (side < 0 ? Math.PI : 0))) * (k.mv || 0) * 15;
    rgTube([[side * 29, 56, 0], [side * 34, 28, -4], [side * 37, 10 + lift, 17]], [27, 20, 16], skin, { tex: 'plates', bias: 1 });
    rgEll([side * 38, 8 + lift, 24], [25, 11, 28], shade, { bias: 3 });
    rgSpike([side * 29, 9 + lift, 44], [side * 31, 3 + lift, 58], 7, '#e7d9b4', { bias: 5 });
  }
  rgEll([0, 91 + breath, -4], [65, 72, 48], skin, { tex: 'plates', ts: .55 });
  rgEll([0, 80 + breath, 39], [41, 42, 18], shade, { vis: [0, 0, 1], bias: 3 });
  rgPoly([[-48, 72, 46], [48, 72, 46], [36, 20, 47], [-35, 20, 47]], '#594a35', { bias: 6, veins: [[0, 2], [1, 3]], vc: '#a68b57' });
  rgTube([[-43, 117 + breath, 31], [0, 104 + breath, 51], [43, 117 + breath, 31]], [11, 9, 11], bronze, { bias: 7 });
  for (const side of [-1, 1]) {
    rgEll([side * 48, 128 + breath, 4], [29, 27, 30], bronze, { tex: 'rivets', bias: 5 });
    rgTube([[side * 48, 127 + breath, 4], [side * 61, 96 + breath + strike * .55, 22], [side * 64, 64 + strike, 30]], [24, 19, 18], skin, { bias: 7 });
    rgEll([side * 64, 62 + strike, 35], [21, 18, 20], skin, { bias: 9 });
  }
  // A chipped stone maul follows the striking arm.
  const club = [66, 61 + strike, 45];
  rgTube([[66, 61 + strike, 38], [77, 85 + strike, 43], [89, 112 + strike, 47]], [8, 7, 6], '#654a31', { bias: 10 });
  rgEll([91, 120 + strike, 48], [22, 32, 24], '#7f8275', { tex: 'cracks', cc: '#d6b86d', cn: 5, bias: 11 });
  for (const side of [-1, 1]) rgSpike([91 + side * 13, 125 + strike, 47], [91 + side * 21, 141 + strike, 43], 10, '#c4c2ad', { bias: 13 });
  rgEll([0, 160 + breath, 26], [49, 48, 40], skin, { tex: 'plates', ts: .7, bias: 8 });
  rgEye([0, 164 + breath, 62], 13, eye, [0, 0, 1], { round: true, bias: 15 });
  rgTube([[-27, 183 + breath, 58], [0, 190 + breath, 65], [27, 183 + breath, 58]], [11, 12, 10], shade, { bias: 14 });
  rgEll([0, 143 + breath, 60], [15, 8, 8], shade, { bias: 13 });
  for (const side of [-1, 1]) {
    rgSpike([side * 29, 178 + breath, 32], [side * 45, 194 + breath, 22], 13, bronze, { bias: 10 });
    rgSpike([side * 9, 127 + breath, 64], [side * 7, 116 + breath, 72], 7, '#eee5cc', { bias: 14 });
  }
  rgGlow([0, 164 + breath, 67], 30, 'rgba(255,208,72,.55)', 24);
  if (k.wind > .1 || k.atk > .1) rgGlow([90, 120 + strike, 48], 38 + strike, 'rgba(255,190,75,.55)', 25);
}, [580, 520, 290, 390]);

/* ---------- chefes de masmorra — rigs 3D projetados leves ---------- */
function humanoidBoss(k, cfg) {
  const p = k.pal, skin = cfg.skin || p[0], armor = cfg.armor || p[1], trim = cfg.trim || p[2], eye = cfg.eye || p[3];
  const bob = Math.sin(k.t * 1.7) * 2.2, swing = Math.sin(k.ph) * (k.mv || 0) * 10;
  const strike = k.atk * 30 + k.wind * 12, bulk = cfg.bulk || 1;
  const front = [0, 0, 1], plate = cfg.tex || 'plates';
  rgShadow(88 * bulk, 72);
  if (cfg.cape) rgPoly([[-34 * bulk, 143 + bob, -24], [34 * bulk, 143 + bob, -24], [55 * bulk, 15, -28], [0, 1, -34], [-55 * bulk, 15, -28]], cfg.cape, { bias: -16, a: .96, veins: [[0, 2], [1, 3]], vc: 'rgba(255,255,255,.12)' });
  if (cfg.wings) for (const side of [-1, 1]) {
    rgPoly([[side * 26, 136 + bob, -12], [side * 62, 183 + bob, -20], [side * 98, 165 + bob, -25], [side * 72, 108 + bob, -24], [side * 34, 91 + bob, -18]], cfg.wings, { bias: -10, a: .92, veins: [[0, 2], [0, 3], [0, 4]], vc: 'rgba(255,255,255,.28)' });
    rgTube([[side * 28, 132 + bob, -10], [side * 58, 164 + bob, -18], [side * 94, 168 + bob, -24]], [6, 4, 1], trim, { bias: -8 });
  }
  // Layered skirt, boots, and articulated greaves establish a readable full-body silhouette.
  rgPoly([[-35 * bulk, 78, 31], [35 * bulk, 78, 31], [48 * bulk, 24, 23], [0, 12, 36], [-48 * bulk, 24, 23]], cfg.skirt || armor, { bias: 3, veins: [[0, 2], [1, 3], [0, 4]], vc: 'rgba(255,255,255,.18)' });
  for (const side of [-1, 1]) {
    const lift = Math.max(0, Math.sin(k.ph + (side < 0 ? Math.PI : 0))) * (k.mv || 0) * 10;
    rgTube([[side * 17, 47, 0], [side * 20, 27, 2], [side * 22, 7 + lift, 12]], [17 * bulk, 13 * bulk, 12 * bulk], skin, { tex: plate, bias: 1 });
    rgEll([side * 22, 7 + lift, 16], [19 * bulk, 9, 25], cfg.boot || armor, { tex: 'rivets', bias: 3 });
    rgTube([[side * 31 * bulk, 128 + bob, 2], [side * 44 * bulk, 106 + bob + strike * .3 + swing * .2, 18], [side * (55 * bulk + swing * side * .2), 78 + bob + strike + swing * side * .45, 34]], [19 * bulk, 16 * bulk, 13 * bulk], skin, { tex: plate, bias: 2 });
    rgEll([side * (56 * bulk + swing * side * .2), 75 + bob + strike + swing * side * .45, 37], [17 * bulk, 16, 17], cfg.glove || armor, { tex: 'rivets', bias: 4 });
    rgEll([side * 40 * bulk, 136 + bob, 1], [24 * bulk, 19, 25], cfg.pauldron || trim, { tex: 'plates', bias: 4 });
    if (cfg.spikes) for (let i = 0; i < 2; i++) rgSpike([side * (37 + i * 9) * bulk, 145 + bob, -2], [side * (57 + i * 10) * bulk, 167 + bob + i * 5, -10], 11 - i * 2, trim, { bias: 6 });
    for (let i = 0; i < 3; i++) rgSpike([side * (17 + i * 7) * bulk, 7 + lift, 31], [side * (19 + i * 8) * bulk, 2 + lift, 43], 6, cfg.claw || trim, { bias: 5 });
  }
  rgEll([0, 88 + bob, -2], [44 * bulk, 50, 35], skin, { tex: cfg.bodyTex || plate });
  rgEll([0, 105 + bob, 28], [43 * bulk, 46, 22], cfg.chest || armor, { tex: cfg.chestTex || 'plates', bias: 3 });
  rgPoly([[-30 * bulk, 132 + bob, 37], [30 * bulk, 132 + bob, 37], [24 * bulk, 82 + bob, 47], [0, 70 + bob, 50], [-24 * bulk, 82 + bob, 47]], cfg.panel || armor, { bias: 7, veins: [[0, 2], [1, 2], [2, 3], [3, 4], [4, 0]], vc: trim });
  for (const side of [-1, 1]) {
    rgTube([[side * 8, 121 + bob, 49], [side * 17, 108 + bob, 51], [side * 8, 95 + bob, 50]], [2.4, 1.8, 2], trim, { bias: 10 });
    rgEye([side * 13, 166 + bob, 34], 5.6, eye, front, { bias: 12 });
    rgSpike([side * 13, 151 + bob, 39], [side * 17, 146 + bob, 44], 5, trim, { bias: 9 });
  }
  // Chest focus and engraved trim give the armor a focal point without costly particle effects.
  rgEll([0, 105 + bob, 51], [12, 15, 5], cfg.core || trim, { glow: cfg.core || trim, bias: 9 });
  rgEll([0, 105 + bob, 56], [5, 8, 2], eye, { bias: 12 });
  rgEll([0, 157 + bob, 18], [30, 29, 27], cfg.face || skin, { tex: cfg.headTex || plate, bias: 7 });
  rgEll([0, 146 + bob, 37], [20, 12, 14], cfg.mask || armor, { bias: 9 });
  if (cfg.helm === 'crown') {
    rgPoly([[-28, 178 + bob, 29], [28, 178 + bob, 29], [21, 190 + bob, 30], [10, 182 + bob, 30], [0, 199 + bob, 30], [-10, 182 + bob, 30], [-21, 190 + bob, 30]], trim, { bias: 12 });
    rgEll([0, 179 + bob, 32], [7, 8, 3], eye, { glow: eye, bias: 13 });
  } else if (cfg.helm === 'horns') {
    for (const side of [-1, 1]) rgTube([[side * 20, 169 + bob, 15], [side * 37, 190 + bob, 4], [side * 51, 196 + bob, -5]], [8, 5, .5], cfg.horn || trim, { bias: 9, rings: 3 });
  } else if (cfg.helm === 'hat') {
    rgEll([0, 184 + bob, 13], [47, 6, 34], cfg.hat || armor, { bias: 9 });
    rgPoly([[-23, 184 + bob, 12], [23, 184 + bob, 12], [14, 224 + bob, 3], [0, 232 + bob, 1], [-14, 224 + bob, 3]], cfg.hat || armor, { bias: 10 });
  } else if (cfg.helm === 'mask') {
    for (const side of [-1, 1]) rgTube([[side * 16, 168 + bob, 20], [side * 24, 183 + bob, 5], [side * 33, 188 + bob, -8]], [7, 4, .4], trim, { bias: 9 });
  } else {
    rgEll([0, 177 + bob, 19], [32, 14, 28], cfg.helmColor || armor, { tex: 'rivets', bias: 9 });
    for (const side of [-1, 1]) rgSpike([side * 19, 177 + bob, 22], [side * 27, 194 + bob, 7], 8, trim, { bias: 10 });
  }
  if (cfg.beard) rgTube([[-11, 145 + bob, 38], [0, 130 + bob, 46], [11, 145 + bob, 38]], [6, 9, 6], cfg.beard, { bias: 11 });
  if (cfg.orbit) {
    const ring = [];
    for (let i = 0; i <= 12; i++) { const a = i / 12 * TAU + k.t * .18; ring.push([Math.cos(a) * 73, 156 + bob + Math.sin(a) * 14, -24]); }
    rgTube(ring, ring.map((_, i) => i === 0 || i === 12 ? 1 : 2), cfg.orbit, { bias: -4, sub: 1 });
    for (let i = 0; i < 3; i++) { const a = k.t * .7 + i * TAU / 3; rgEll([Math.cos(a) * 73, 156 + bob + Math.sin(a) * 14, -22], [7, 9, 7], cfg.orbit, { glow: cfg.orbit, bias: 6 }); }
  }
  // A distinct weapon silhouette is part of each boss identity.
  const side = 1, wx = 72 * bulk, wz = 42;
  if (cfg.weapon === 'staff') {
    rgTube([[wx, 22, wz], [wx + 2, 105 + bob, wz - 4], [wx - 2, 201 + bob, wz - 8]], [5, 4, 3], cfg.handle || '#634c37', { bias: 9 });
    rgEll([wx - 2, 207 + bob, wz - 8], [12, 15, 10], cfg.focus || trim, { glow: cfg.focus || trim, bias: 12 });
    rgTube([[wx - 15, 207 + bob, wz - 8], [wx - 4, 221 + bob, wz - 8], [wx + 10, 207 + bob, wz - 8]], [2, 2, 2], trim, { bias: 13 });
  } else if (cfg.weapon === 'hammer') {
    rgTube([[wx, 23, wz], [wx + 3, 100 + strike, wz], [wx + 9, 164 + strike, wz - 3]], [7, 6, 5], cfg.handle || '#503b32', { bias: 8 });
    rgEll([wx + 9, 174 + strike, wz - 3], [25, 20, 19], cfg.weaponColor || trim, { tex: 'cracks', cc: cfg.core || eye, cn: 4, bias: 11 });
    for (const s of [-1, 1]) rgSpike([wx + 9 + s * 19, 174 + strike, wz - 3], [wx + 9 + s * 28, 174 + strike, wz - 3], 9, trim, { bias: 12 });
  } else if (cfg.weapon === 'sword') {
    rgTube([[wx - 4, 32, wz + 5], [wx + 3, 65, wz + 7]], [6, 5], cfg.handle || '#60452f', { bias: 8 });
    rgTube([[wx - 14, 66, wz + 8], [wx + 15, 66, wz + 8]], [4, 4], trim, { bias: 9 });
    rgPoly([[wx - 8, 68, wz + 9], [wx + 8, 68, wz + 9], [wx + 17, 146, wz + 4], [wx, 185 + strike, wz + 2], [wx - 17, 146, wz + 4]], cfg.weaponColor || '#d9e2ec', { bias: 10, veins: [[0, 2], [1, 3], [2, 3], [3, 4]], vc: '#ffffff' });
  } else if (cfg.weapon === 'claw') {
    for (let i = -1; i <= 1; i++) rgSpike([wx + i * 8, 63, wz + 8], [wx + i * 14, 28, wz + 20], 8, trim, { bias: 8 });
  }
  if (cfg.aura) {
    const ring = [];
    for (let i = 0; i <= 10; i++) { const a = Math.PI * (i / 10); ring.push([Math.cos(a) * 47, 179 + bob + Math.sin(a) * 18, -19]); }
    rgTube(ring, ring.map(() => 2.2), cfg.aura, { bias: -5, sub: 1 });
  }
  if (k.wind > .05 || k.atk > .05) rgGlow([0, 106 + bob, 56], 32 + strike * .5, cfg.glow || 'rgba(255,190,70,.6)', 24);
}

const HUMANOID_RIGS = {
  guardian: { helm: 'helm', weapon: 'sword', bulk: 1.05, skin: '#76559b', armor: '#2a1736', trim: '#d8b0ff', core: '#c99bff', cape: '#241532', aura: '#d8b0ff', spikes: true },
  lich: { helm: 'crown', weapon: 'staff', skin: '#d8d2b0', face: '#d8d2b0', armor: '#554b60', trim: '#c08aff', core: '#c08aff', cape: '#241a35', orbit: '#c08aff', beard: '#eee7d2', bodyTex: 'cracks' },
  archmage: { helm: 'hat', weapon: 'staff', skin: '#e0c8a8', armor: '#1d2250', trim: '#ffffff', core: '#9ac8ff', cape: '#273977', focus: '#a8dcff', orbit: '#86baff', beard: '#e8e8f4', skirt: '#252d5d' },
  frostqueen: { helm: 'crown', weapon: 'staff', skin: '#dce8f4', armor: '#3a6a9a', trim: '#cfeeff', core: '#40e0ff', cape: '#508cb2', wings: '#8bdfff', focus: '#bff7ff', orbit: '#7ad8ff', skirt: '#7eb7d8' },
  titan: { helm: 'helm', weapon: 'hammer', bulk: 1.28, skin: '#3a2a30', armor: '#1a0e12', trim: '#ff8a4a', core: '#ffb35a', cape: '#351b21', spikes: true, tex: 'cracks', bodyTex: 'cracks', weaponColor: '#66515a', glow: 'rgba(255,120,40,.7)' },
  pharaoh: { helm: 'crown', weapon: 'sword', skin: '#d8a84a', armor: '#6a4418', trim: '#ffe8a0', core: '#ff3a1a', cape: '#8e6029', skirt: '#be8c3d', weaponColor: '#f0c968', aura: '#ff8a3a' },
  raijin: { helm: 'horns', weapon: 'claw', skin: '#e8d8a0', armor: '#4a3a10', trim: '#ffe371', core: '#40ffff', cape: '#382e16', wings: '#b29a45', aura: '#ffe371', glow: 'rgba(64,255,255,.65)' },
  empress: { helm: 'crown', weapon: 'staff', skin: '#efe8ff', armor: '#2a2060', trim: '#ffffff', core: '#ff6ad0', cape: '#6254bd', wings: '#d3bfff', focus: '#ff9ae8', orbit: '#c2b7ff', skirt: '#8a78d4' },
  shadowking: { helm: 'crown', weapon: 'sword', skin: '#3a2a52', armor: '#1a1030', trim: '#8a50d0', core: '#ff3a6a', cape: '#100919', weaponColor: '#9d79d0', aura: '#c08aff', spikes: true },
  oni: { helm: 'horns', weapon: 'hammer', bulk: 1.32, skin: '#b8322a', armor: '#2a0a14', trim: '#ffd070', core: '#ff3c8e', cape: '#3b0d18', horn: '#f2d6a2', spikes: true, weaponColor: '#3a3038', glow: 'rgba(255,60,142,.7)' }
};
for (const [id, cfg] of Object.entries(HUMANOID_RIGS)) defBoss(id, k => humanoidBoss(k, cfg), [580, 520, 290, 390]);

defBoss('entboss', k => {
  const [bark, dark, leaf, eye] = k.pal, sway = Math.sin(k.t * 1.2) * 5, slam = k.atk * 24 + k.wind * 12;
  rgShadow(115, 92);
  for (const side of [-1, 1]) {
    const lift = Math.max(0, Math.sin(k.ph + (side < 0 ? Math.PI : 0))) * (k.mv || 0) * 9;
    rgTube([[side * 23, 61, 0], [side * 30, 34, 4], [side * 35, 8 + lift, 22]], [23, 17, 13], bark, { tex: 'bark' });
    rgEll([side * 35, 8 + lift, 26], [18, 8, 23], dark, { bias: 3 });
    rgTube([[side * 33, 130, 0], [side * (48 + slam), 107, 19], [side * (69 + slam), 72 + slam, 40]], [20, 16, 14], bark, { tex: 'bark', bias: 2 });
    for (let i = -1; i <= 1; i++) rgTube([[side * (69 + slam), 72 + slam, 40], [side * (79 + slam), 55 + i * 10, 48], [side * (86 + slam), 44 + i * 12, 48]], [7, 5, 1], leaf, { bias: 5 });
  }
  rgEll([0, 92, -3], [54, 62, 42], bark, { tex: 'bark' });
  rgEll([0, 95, 34], [40, 45, 20], dark, { tex: 'bark', bias: 2 });
  rgEll([0, 154, 13], [41, 38, 35], bark, { tex: 'bark', bias: 4 });
  rgEll([0, 113, 51], [14, 18, 5], '#ffcf5a', { glow: '#ffcf5a', bias: 8 });
  for (const side of [-1, 1]) {
    rgEye([side * 15, 158, 40], 6, eye, [0, 0, 1], { bias: 10 });
    rgTube([[side * 8, 176, 12], [side * 25, 204, 0], [side * 48, 211, -7]], [10, 6, 1], dark, { bias: 3 });
    rgPoly([[side * 12, 183, 15], [side * 32, 199, 5], [side * 18, 168, 18]], leaf, { bias: 5 });
  }
  for (let i = -3; i <= 3; i++) rgSpike([i * 11, 189, 8], [i * 15, 218 + Math.abs(i) * 2, 0], 10, dark, { bias: 7 });
  if (k.wind > .1 || k.atk > .1) rgGlow([0, 113, 53], 42 + slam, 'rgba(138,255,99,.58)', 20);
}, [580, 520, 290, 390]);

defBoss('hydra', k => {
  const [hide, dark, belly, eye] = k.pal, pulse = Math.sin(k.t * 1.8) * 2;
  rgShadow(120, 92);
  rgEll([0, 66 + pulse, -5], [58, 40, 72], hide, { tex: 'scales' });
  rgEll([0, 54, 31], [48, 26, 40], belly, { tex: 'bands', bn: 5, bias: 2 });
  for (const side of [-1, 1]) {
    const lift = Math.max(0, Math.sin(k.ph + (side < 0 ? Math.PI : 0))) * (k.mv || 0) * 12;
    rgTube([[side * 41, 45, -34], [side * 45, 22, -15], [side * 42, 7 + lift, 17]], [24, 17, 13], hide, { tex: 'scales' });
    rgEll([side * 43, 8 + lift, 23], [18, 8, 24], dark, { bias: 2 });
  }
  for (let i = -1; i <= 1; i++) {
    const hx = i * 39, sway = Math.sin(k.t * 2.1 + i) * 9, hy = 174 + Math.sin(k.t * 2 + i * 1.8) * 4 + (k.atk ? 12 : 0);
    rgTube([[i * 23, 82, 15], [hx * .8 + sway, 111, 30], [hx + sway, 147, 34], [hx + sway, hy - 12, 37]], [17, 13, 10, 9], hide, { tex: 'scales', rings: 3 });
    rgEll([hx + sway, hy, 42], [16, 14, 24], hide, { tex: 'scales', bias: 4 });
    rgEll([hx + sway, hy - 7, 61], [11, 8, 13], dark, { bias: 5 });
    rgEye([hx + sway - 7, hy + 4, 55], 4, eye, [0, 0, 1], { bias: 8 });
    rgEye([hx + sway + 7, hy + 4, 55], 4, eye, [0, 0, 1], { bias: 8 });
    for (const side of [-1, 1]) rgSpike([hx + sway + side * 9, hy + 10, 38], [hx + sway + side * 15, hy + 27, 29], 6, belly, { bias: 7 });
  }
  for (let i = -4; i <= 4; i++) rgSpike([i * 12, 84 + pulse, -60 + Math.abs(i) * 3], [i * 13, 106 + pulse, -71 + Math.abs(i) * 3], 9, dark, { bias: 3 });
  if (k.wind > .1 || k.atk > .1) rgGlow([0, 94, 53], 39 + k.atk * 24, 'rgba(200,255,90,.55)', 20);
}, [600, 540, 300, 400]);

defBoss('queen', k => {
  const [hide, dark, silk, eye] = k.pal, pulse = Math.sin(k.t * 2.1) * 2, lunge = k.atk * 14;
  rgShadow(112, 92);
  for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
    const hipX = side * (24 + (i % 2) * 15), hipZ = 6 - Math.floor(i / 2) * 25, kneeX = side * (58 + (i % 2) * 17), footX = side * (83 + (i % 2) * 18);
    rgTube([[hipX, 93 + pulse, hipZ], [side * 43, 78 + (i - 1.5) * 12, hipZ + 5], [kneeX, 44 + (i - 1.5) * 17, 18], [footX, 12, 32]], [12, 9, 6, 2], hide, { bias: i });
    rgEll([kneeX, 44 + (i - 1.5) * 17, 18], [7, 7, 7], silk, { bias: 3 });
  }
  rgEll([0, 79 + pulse, -18], [42, 42, 51], hide, { tex: 'scales' });
  rgEll([0, 111 + pulse, 26], [30, 32, 28], hide, { tex: 'plates', bias: 2 });
  rgEll([0, 138 + pulse, 42], [25, 23, 25], dark, { bias: 4 });
  for (const side of [-1, 1]) {
    rgEye([side * 12, 143 + pulse, 61], 6, eye, [0, 0, 1], { bias: 9 });
    rgTube([[side * 19, 125, 20], [side * (31 + lunge), 100, 44], [side * (45 + lunge), 78, 63]], [11, 9, 7], hide, { bias: 3 });
    for (let j = 0; j < 3; j++) rgSpike([side * (45 + lunge), 78 + j * 4, 60], [side * (49 + lunge), 58 + j * 8, 68], 5, silk, { bias: 5 });
  }
  for (let i = -2; i <= 2; i++) rgSpike([i * 10, 159 + pulse, 31], [i * 12, 180 + pulse + Math.abs(i) * 3, 20], 8, silk, { bias: 6 });
  const web = [];
  for (let i = 0; i <= 12; i++) { const a = i / 12 * TAU; web.push([Math.cos(a) * 105, 100 + Math.sin(a) * 18, -26]); }
  rgTube(web, web.map(() => 1.5), silk, { bias: -6, sub: 1 });
  if (k.wind > .1 || k.atk > .1) rgGlow([0, 118, 58], 35 + lunge, 'rgba(255,80,130,.55)', 20);
}, [600, 540, 300, 400]);

defBoss('worm', k => {
  const [hide, dark, bone, eye] = k.pal, wave = Math.sin(k.t * 2.1) * 13, lunge = k.atk * 35 + k.wind * 14;
  rgShadow(118, 96);
  const coil = [[-8, 30, -98], [-55, 24, -67], [-76, 35, -27], [-56, 47, 15], [-8, 52, 27], [40, 67, 8], [57, 99, -8], [38, 131 + wave, 9], [10, 153 + wave, 34]];
  rgTube(coil, [26, 28, 31, 32, 31, 28, 24, 20, 17], hide, { tex: 'scales', rings: 3, sub: 3 });
  for (let i = 0; i < 8; i++) {
    const p = vlerp(coil[i], coil[i + 1], .55);
    for (const side of [-1, 1]) rgSpike([p[0], p[1] + 10, p[2]], [p[0] + side * 6, p[1] + 26, p[2] - 3], 7, dark, { bias: 2 });
  }
  const hx = 8 + lunge * .35, hy = 179 + wave + lunge * .42;
  rgEll([hx, hy, 42], [26, 21, 30], hide, { tex: 'scales', bias: 5 });
  rgEll([hx, hy - 11, 65], [21, 9, 13], '#21100b', { bias: 7 });
  rgEll([hx, hy - 13, 68], [15, 3, 7], '#d84b3d', { bias: 8 });
  for (const side of [-1, 1]) {
    rgEye([hx + side * 16, hy + 5, 59], 5, eye, [0, 0, 1], { bias: 9 });
    rgTube([[hx + side * 17, hy + 13, 38], [hx + side * 28, hy + 30, 24], [hx + side * 36, hy + 35, 8]], [8, 6, 1], bone, { bias: 7 });
  }
  for (let i = 0; i < 5; i++) rgSpike([hx - 20 + i * 10, hy + 13, 35], [hx - 22 + i * 11, hy + 30 + (i % 2) * 7, 23], 7, dark, { bias: 8 });
  if (k.wind > .1 || k.atk > .1) rgGlow([hx, hy - 8, 66], 40 + lunge, 'rgba(255,195,90,.55)', 20);
}, [600, 540, 300, 400]);

defBoss('kraken', k => {
  const [hide, dark, glow, eye] = k.pal, pulse = Math.sin(k.t * 1.8) * 4, attack = k.atk * 20 + k.wind * 10;
  rgShadow(125, 100);
  for (let sideIndex = 0; sideIndex < 6; sideIndex++) {
    const side = sideIndex < 3 ? -1 : 1, row = sideIndex % 3, sway = Math.sin(k.t * 1.7 + sideIndex * 1.4) * 12 + attack;
    const startX = side * (18 + row * 7), endX = side * (75 + row * 22);
    const pts = [[startX, 58 + pulse, 10], [side * 35, 29 + row * 21, 17], [side * 52, 18 + row * 24, 32], [endX + sway, 45 + row * 27, 50], [endX + sway * 1.2, 76 + row * 20, 62]];
    rgTube(pts, [17, 13, 9, 5, 1], hide, { bias: 1, dots: glow, rings: 5, sub: 3 });
    for (let j = 1; j <= 3; j++) {
      const pt = vlerp(pts[1], pts[3], j / 4);
      rgEll([pt[0] + side * 7, pt[1] + 5, pt[2] + 3], [3, 5, 3], glow, { glow, bias: 4 });
    }
  }
  rgEll([0, 82 + pulse, -5], [50, 42, 45], hide, { tex: 'scales' });
  rgEll([0, 104 + pulse, 25], [35, 35, 29], hide, { tex: 'scales', bias: 3 });
  rgEll([0, 94 + pulse, 49], [24, 15, 10], dark, { bias: 6 });
  for (const side of [-1, 1]) rgEye([side * 15, 113 + pulse, 46], 7, eye, [0, 0, 1], { round: true, bias: 10 });
  for (let i = -3; i <= 3; i++) rgSpike([i * 12, 130 + pulse, 8], [i * 15, 154 + pulse + Math.abs(i) * 2, -3], 8, dark, { bias: 5 });
  if (k.wind > .1 || k.atk > .1) rgGlow([0, 77, 48], 42 + attack, 'rgba(120,255,225,.58)', 22);
}, [640, 560, 320, 420]);

defBoss('crystalgolem', k => {
  const [crystal, dark, shine, core] = k.pal, pulse = Math.sin(k.t * 2.2) * 3;
  const step = Math.sin(k.ph) * (k.mv || 0) * 13, smash = k.atk * 30 + k.wind * 14;
  rgShadow(122, 92);
  for (const side of [-1, 1]) {
    const lift = Math.max(0, Math.sin(k.ph + (side < 0 ? Math.PI : 0))) * (k.mv || 0) * 12;
    rgTube([[side*25,58,0],[side*29,31,-1],[side*30,10+lift,18]],[22,17,13],dark,{tex:'cracks',cc:shine});
    rgEll([side*30,8+lift,23],[18,9,22],crystal,{tex:'cracks',cc:shine,bias:3});
    for(let i=-1;i<=1;i++)rgSpike([side*30+i*7,8+lift,34],[side*32+i*9,2+lift,50],6,shine,{bias:5});
    rgEll([side*40,130+pulse,0],[28,27,30],dark,{tex:'cracks',cc:shine,bias:3});
    rgTube([[side*40,130+pulse,0],[side*50,99+pulse+smash*.5,18],[side*57,66+smash,34]],[22,18,15],crystal,{tex:'cracks',cc:shine,bias:5});
    rgEll([side*57,63+smash,37],[18,16,20],dark,{tex:'cracks',cc:shine,bias:7});
    for(let i=-1;i<=1;i++)rgSpike([side*57+i*8,61+smash,49],[side*59+i*10,56+smash,62],5,shine,{bias:9});
  }
  rgEll([0,87+pulse,-2],[56,60,43],dark,{tex:'cracks',cc:shine,cn:13});
  rgPoly([[-37,112+pulse,39],[0,137+pulse,45],[37,112+pulse,39],[27,67,46],[0,51,48],[-27,67,46]],crystal,{bias:5,veins:[[0,3],[1,4],[2,3],[2,4]],vc:shine,lw:2});
  rgEll([0,91+pulse,49],[23,26,8],core,{glow:core,bias:10});
  rgEll([0,151+pulse,15],[36,31,32],crystal,{tex:'cracks',cc:shine,bias:7});
  rgPoly([[-31,156+pulse,32],[-19,178+pulse,27],[0,164+pulse,38],[19,178+pulse,27],[31,156+pulse,32],[17,141+pulse,42],[0,147+pulse,48],[-17,141+pulse,42]],dark,{bias:9,veins:[[0,2],[1,2],[2,4],[3,4]],vc:shine});
  rgEll([0,151+pulse,47],[18,14,12],shine,{glow:core,bias:11});
  rgEll([0,145+pulse,57],[12,4,5],dark,{bias:12});
  for(const side of [-1,1])rgEye([side*8,154+pulse,58],4,core,[0,0,1],{glow:core,bias:13});
  for(let i=-2;i<=2;i++)rgSpike([i*11,176+pulse,18],[i*15,198+pulse+Math.abs(i)*2,10],8,shine,{bias:9});
  if(k.wind>.1||k.atk>.1)rgGlow([0,91,58],42+smash,'rgba(150,245,255,.65)',25);
}, [600, 560, 300, 420]);

defBoss('mimic', k => {
  const [wood, dark, gold, eye] = k.pal, open = Math.max(k.atk, k.wind*.8, .08+Math.sin(k.t*2)*.04), bob = Math.sin(k.t*2)*2;
  rgShadow(105,76);
  rgEll([0,47+bob,-2],[57,35,42],dark,{tex:'bark'});
  rgPoly([[-53,53+bob,34],[53,53+bob,34],[48,92+bob,20],[-48,92+bob,20]],wood,{bias:4,veins:[[0,2],[1,3]],vc:gold});
  rgEll([0,64+bob,34],[47,24,13],wood,{tex:'bands',bn:5,bias:5});
  rgEll([0,89+bob-open*10,29],[47,12,23],dark,{bias:6,pit:-open*.2});
  rgEll([0,69+bob+open*18,43],[46,10,19],wood,{bias:8,pit:open*.32});
  for(let i=-5;i<=5;i++){rgSpike([i*8,72+bob+open*12,58],[i*8,62+bob+open*12,61],3,'#fff1d0',{bias:11});rgSpike([i*8,78+bob-open*7,58],[i*8,88+bob-open*7,60],3,'#fff1d0',{bias:11});}
  rgEll([0,53+bob,54],[10,8,6],gold,{glow:gold,bias:12});
  for(const side of [-1,1]){rgTube([[side*38,58+bob,5],[side*70,50+bob,8],[side*82,24+bob,22]],[12,9,1],wood,{bias:4});rgEll([side*82,22+bob,23],[7,7,7],eye,{glow:eye,bias:8});}
  if(k.wind>.1||k.atk>.1)rgGlow([0,67,58],28+open*20,'rgba(255,210,80,.7)',18);
}, [520, 420, 260, 320]);

defBoss('vulture', k => {
  const [feather,dark,gold,eye] = k.pal, flap=Math.sin(k.t*(k.mv?5:2)+k.ph*.2)*.24+k.wind*.3-k.atk*.15, bob=Math.sin(k.t*2)*3;
  rgShadow(132,88);
  for(const side of [-1,1]){
    const lift=Math.max(0,Math.sin(k.ph+(side<0?Math.PI:0)))*(k.mv||0)*12;
    const shoulder=[side*18,111+bob,0], elbow=[side*(70+flap*24),142+bob+flap*18,0], tip=[side*(148+flap*34),126+bob+flap*52,-5];
    rgPoly([shoulder,elbow,tip,[side*114,73+bob+flap*25,8],[side*45,82+bob,14]],feather,{bias:-2,veins:[[0,2],[1,3]],vc:gold,a:.95});
    rgTube([shoulder,elbow,tip],[13,8,2],dark,{bias:2});
    for(let i=0;i<5;i++){const x=side*(49+i*19);rgPoly([[x,111+bob,8],[x+side*8,94+bob-i*2,8],[x+side*20,44+bob-i*5,8],[x-side*3,83+bob,7]],i%2?feather:dark,{bias:1,veins:[[0,2]],vc:gold});}
    rgTube([[side*28,79,0],[side*33,48,4],[side*34,13+lift,22]],[14,11,8],dark,{bias:2});
    rgEll([side*34,9+lift,25],[12,7,17],gold,{bias:4});
    for(let i=-1;i<=1;i++)rgSpike([side*34+i*5,9+lift,35],[side*34+i*6,2+lift,47],4,gold,{bias:6});
  }
  rgEll([0,84+bob,-6],[38,40,37],dark,{tex:'feather',bias:1});
  rgEll([0,96+bob,24],[29,34,27],feather,{tex:'feather',bias:4});
  rgTube([[0,109+bob,23],[0,133+bob,40],[0,153+bob,51]],[18,15,12],feather,{bias:4});
  rgEll([0,156+bob,58],[20,17,20],dark,{bias:7});
  rgEll([0,151+bob,76],[10,7,12],gold,{bias:9});
  rgSpike([0,153+bob,89],[0,147+bob,110],7,gold,{bias:11});
  for(const side of [-1,1]){rgEye([side*12,162+bob,70],5,eye,[0,0,1],{glow:eye,bias:12});rgSpike([side*14,168+bob,56],[side*29,182+bob,43],6,gold,{bias:9});}
  if(k.wind>.1||k.atk>.1)rgGlow([0,141,66],28+k.atk*18,'rgba(255,215,110,.55)',18);
}, [640, 520, 320, 390]);

/* ---- integração com ABISMO_ENEMY_ART ---- */
const RIG_IDS = {
  dragao:'dragon', young_dragon:'dragon', infernal_dragon:'dragon', dragon:'dragon',
  yeti_giant:'yeti_giant', ice_titan:'titan', cyclops:'cyclops', tree_sentinel:'entboss',
  dune_colossus:'pharaoh', marsh_hydra:'hydra', bone_colossus:'lich', flame_titan:'titan',
  storm_titan:'raijin', crystal_golem:'crystalgolem', astral_colossus:'archmage',
  guardian:'guardian', boss:'guardian', ent_anc:'entboss', forest_lord:'entboss',
  lorde:'lich', hidra:'hydra', matriarca:'queen', thorn_queen:'queen', arquimago:'archmage',
  soberana:'frostqueen', ice_archon:'frostqueen', titan:'titan', mae_cinzas:'titan', red_guardian:'titan',
  colosso:'pharaoh', verme:'worm', raijin:'raijin', tempestade:'raijin', lightning_lord:'raijin',
  prisma:'empress', rei_sombras:'shadowking', kraken:'kraken', devorador_astral:'kraken',
  astral_devourer:'kraken', oni:'oni', mimic_boss:'mimic', celestial_vulture:'vulture', vulture:'vulture'
};
function fallbackBossRig(e) {
  const t=e.t||{}, key=String(t.artId||'');
  if(BOSS_DRAW[key])return key;
  if(t.element==='gelo')return 'yeti_giant';
  if(t.element==='fogo')return 'titan';
  if(t.element==='natureza')return 'entboss';
  if(t.element==='raio')return 'raijin';
  if(t.element==='arcano')return 'archmage';
  return 'guardian';
}
const A0 = window.ABISMO_ENEMY_ART;
if (A0 && A0.draw) {
  const orig = A0.draw;
  const rigCache = new Map();
  const rigInterval = 1 / 15;
  const cacheKeyFor = (kind, e, k, rasterScale) => `${kind}|${e.t.r || 40}|${e.state}|${k.phase}|${rasterScale}|${k.pal.join(',')}`;
  function trimRigCache() {
    while (rigCache.size > 12) rigCache.delete(rigCache.keys().next().value);
  }
  A0.draw = function (ctx, e, now) {
    const kind = e && e.t && (RIG_IDS[e.artOverride] || RIG_IDS[e.type] || RIG_IDS[e.t.artId] || (e.t.boss ? fallbackBossRig(e) : null));
    if (!kind || !BOSS_DRAW[kind]) return orig(ctx, e, now);
    if (kind === 'dragon' && !e.t.boss) return orig(ctx, e, now);
    const t = e.t, r = t.r || 40, moving = e.state === 'chase' || e.state === 'attack';
    const pal = (t.pal && t.pal.length >= 4) ? t.pal : ['#c0402a', '#4a1008', '#ffd070', '#ffe030'];
    const wind = e.state === 'windup' ? Math.max(0, 1 - (e.timer || 0) / (e.maxTimer || 1)) : 0;
    const k = { t: now, ph: now * (moving ? 9 : 3) + (e.bob || 0), mv: moving ? 1 : 0, atk: e.state === 'attack' ? 1 : 0, wind, hurt: e.hit || 0, R: r, pal, el: t.el || 'fogo', kind, seed: ((e.bob || 1) * 1000) | 0, z: 0, type: t, ang: e.face || 0, phase: e.bossPhase || 0, enraged: (e.bossPhase || 0) >= 2 };
    const box = kind === 'dragon' ? [520, 430, 260, 320] : (kind === 'yeti_giant' || kind === 'crystalgolem' ? [600, 560, 300, 420] : (kind === 'vulture' ? [640, 520, 320, 390] : [580, 520, 290, 390]));
    const rasterScale = 1.5;
    const cacheKey = cacheKeyFor(kind, e, k, rasterScale);
    let cached = rigCache.get(cacheKey);
    if (cached) { rigCache.delete(cacheKey); rigCache.set(cacheKey, cached); }
    if (!cached) {
      cached = { a: document.createElement('canvas'), b: document.createElement('canvas'), front: null, previous: null, at: 0, warm: false };
      rigCache.set(cacheKey, cached);
      trimRigCache();
    }
    if (!cached.front || (!cached.warm && now - cached.at >= rigInterval)) {
      const u = 1;
      const width = Math.max(1, Math.ceil(box[0] * u * rasterScale));
      const height = Math.max(1, Math.ceil(box[1] * u * rasterScale));
      const target = cached.front === cached.a ? cached.b : cached.a;
      if (target.width !== width) target.width = width;
      if (target.height !== height) target.height = height;
      const spriteCtx = target.getContext('2d');
      spriteCtx.setTransform(1, 0, 0, 1, 0, 0);
      spriteCtx.clearRect(0, 0, width, height);
      spriteCtx.setTransform(rasterScale, 0, 0, rasterScale, box[2] * rasterScale, box[3] * rasterScale);
      const normalized = { ...k, R: 40 };
      BOSS_DRAW[kind](spriteCtx, normalized);
      cached.previous = cached.front;
      cached.front = target;
      cached.at = now;
      cached.warm = false;
    } else if (cached.warm) {
      cached.at = now;
      cached.warm = false;
    }
    const blend = cached.previous ? clamp((now - cached.at) / rigInterval, 0, 1) : 1;
    const u = r / 40, width = box[0] * u, height = box[1] * u;
    ctx.save();
    if (cached.previous && blend < 1) {
      ctx.globalAlpha = 1 - blend;
      ctx.drawImage(cached.previous, e.x - box[2] * u, e.y - box[3] * u, width, height);
    }
    ctx.globalAlpha = blend;
    ctx.drawImage(cached.front, e.x - box[2] * u, e.y - box[3] * u, width, height);
    ctx.globalAlpha = 1;
    ctx.translate(e.x, e.y);
    if (e.hit > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,246,208,${Math.min(.45, e.hit * 3)})`; ctx.beginPath(); ctx.ellipse(0, -r * .6, r * 1.1, r * .8, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
    if (e.elite) { ctx.strokeStyle = '#ffdc89'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(e.x, e.y - 3, r * 1.5, r * 1.18, 0, 0, TAU); ctx.stroke(); }
    if (e.hp < e.maxHp && !t.boss && e.hp > 0) { const w = 34, x = e.x - w / 2, y = e.y - r * 1.6; ctx.fillStyle = 'rgba(10,18,14,.78)'; ctx.fillRect(x - 1, y - 1, w + 2, 6); ctx.fillStyle = '#e66562'; ctx.fillRect(x, y, w * e.hp / e.maxHp, 4); }
  };
  function prewarmDragon(type) {
    if (!type || !type.boss) return;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d');
    const states = ['idle', 'chase', 'windup', 'attack'];
    let index = 0;
    const warmNext = () => {
      const state = states[index++];
      const now = performance.now() / 1000;
      const enemy = { type: 'dragao', t: type, x: 0, y: 0, state, timer: .25, maxTimer: 1, bossPhase: 0, face: 0, bob: 0, hit: 0, hp: type.hp, maxHp: type.hp, elite: false };
      ctx.setTransform(1.5, 0, 0, 1.5, 0, 0);
      A0.draw(ctx, enemy, now);
      const pal = type.pal && type.pal.length >= 4 ? type.pal : ['#c0402a', '#4a1008', '#ffd070', '#ffe030'];
      const key = cacheKeyFor('dragon', enemy, { phase: 0, pal }, 1.5);
      const cached = rigCache.get(key);
      if (cached) { cached.warm = true; cached.at = now; }
      if (index < states.length) {
        if (window.requestIdleCallback) window.requestIdleCallback(warmNext, { timeout: 500 });
        else window.setTimeout(warmNext, 80);
      }
    };
    if (window.requestIdleCallback) window.requestIdleCallback(warmNext, { timeout: 500 });
    else window.setTimeout(warmNext, 80);
  }
  window.ABISMO_BOSS_RIG = { BOSS_DRAW, defBoss, RIG_IDS, prewarmDragon };
}
})();
