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

/* ---- integração com ABISMO_ENEMY_ART ---- */
const RIG_IDS = {dragao:'dragon', young_dragon:'dragon', infernal_dragon:'dragon', yeti_giant:'yeti_giant', cyclops:'cyclops'};
const A0 = window.ABISMO_ENEMY_ART;
if (A0 && A0.draw) {
  const orig = A0.draw;
  A0.draw = function (ctx, e, now) {
    const kind = e && e.t && RIG_IDS[e.type];
    if (!kind || !BOSS_DRAW[kind]) return orig(ctx, e, now);
    const t = e.t, r = t.r || 40, moving = e.state === 'chase' || e.state === 'attack';
    const pal = (t.pal && t.pal.length >= 4) ? t.pal : ['#c0402a', '#4a1008', '#ffd070', '#ffe030'];
    const wind = e.state === 'windup' ? Math.max(0, 1 - (e.timer || 0) / (e.maxTimer || 1)) : 0;
    const k = { t: now, ph: now * (moving ? 9 : 3) + (e.bob || 0), mv: moving ? 1 : 0, atk: e.state === 'attack' ? 1 : 0, wind, hurt: e.hit || 0, R: r, pal, el: t.el || 'fogo', kind, seed: ((e.bob || 1) * 1000) | 0, z: 0, type: t, ang: e.face || 0, phase: e.bossPhase || 0, enraged: (e.bossPhase || 0) >= 2 };
    ctx.save(); ctx.translate(e.x, e.y); BOSS_DRAW[kind](ctx, k);
    if (e.hit > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,246,208,${Math.min(.45, e.hit * 3)})`; ctx.beginPath(); ctx.ellipse(0, -r * .6, r * 1.1, r * .8, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
    if (e.elite) { ctx.strokeStyle = '#ffdc89'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(e.x, e.y - 3, r * 1.5, r * 1.18, 0, 0, TAU); ctx.stroke(); }
    if (e.hp < e.maxHp && !t.boss && e.hp > 0) { const w = 34, x = e.x - w / 2, y = e.y - r * 1.6; ctx.fillStyle = 'rgba(10,18,14,.78)'; ctx.fillRect(x - 1, y - 1, w + 2, 6); ctx.fillStyle = '#e66562'; ctx.fillRect(x, y, w * e.hp / e.maxHp, 4); }
  };
  window.ABISMO_BOSS_RIG = { BOSS_DRAW, defBoss, RIG_IDS };
}
})();
