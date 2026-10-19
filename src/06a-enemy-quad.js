/* ============================================================
   INIMIGOS — desenho procedural por arquétipo
   Origem = pés. Eixo +x = frente (o chamador espelha).
   k: {t, ph, mv, atk, wind, hurt, R, pal:[corpo,sombra,detalhe,olho], el, kind, seed, z}
   ============================================================ */
const ENEMY_DRAW = {};
const OUT = 'rgba(6,6,12,.62)';
function eGrad(g, x0, y0, x1, y1, a, b, c) { return grad(g, x0, y0, x1, y1, c ? [a, b, c] : [a, b]); }
function eEye(g, x, y, r, col, slit = false, glow = true) {
  if (glow) { g.shadowColor = col; g.shadowBlur = r * 3; }
  g.fillStyle = col; g.beginPath(); g.ellipse(x, y, r, slit ? r * .75 : r, 0, 0, TAU); g.fill(); g.shadowBlur = 0;
  g.fillStyle = '#0a0406'; g.beginPath(); if (slit) g.ellipse(x + r * .1, y, r * .22, r * .8, 0, 0, TAU); else g.arc(x + r * .15, y, r * .5, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(x - r * .3, y - r * .3, r * .22, 0, TAU); g.fill();
}
function fang(g, x, y, w, h, col = '#f4efe0') { g.fillStyle = col; g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(x, y + h); g.lineTo(x + w / 2, y); g.closePath(); g.fill(); g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = .6; g.stroke(); }
function spikes(g, x0, y0, x1, y1, n, h, col, flip = 1) { g.fillStyle = col; for (let i = 0; i < n; i++) { const t = (i + .5) / n, px = mix(x0, x1, t), py = mix(y0, y1, t), w = Math.hypot(x1 - x0, y1 - y0) / n * .5; g.beginPath(); g.moveTo(px - w, py); g.lineTo(px, py - h * (.7 + .3 * Math.sin(i * 2.3)) * flip); g.lineTo(px + w, py); g.closePath(); g.fill(); g.strokeStyle = OUT; g.lineWidth = .7; g.stroke(); } }
function furTufts(g, x, y, rx, ry, n, col, L, seed = 1) { g.strokeStyle = col; g.lineWidth = 1.1; for (let i = 0; i < n; i++) { const a = hash2(i, seed, 3) * TAU, d = Math.sqrt(hash2(i, seed, 4)); const px = x + Math.cos(a) * rx * d, py = y + Math.sin(a) * ry * d; g.beginPath(); g.moveTo(px, py); g.lineTo(px - L * (.6 + hash2(i, seed, 5) * .6), py + (hash2(i, seed, 6) - .3) * L); g.stroke(); } }
function elementFx(g, k, x, y, r) { // brilho elemental discreto
  const e = k.el; if (!e || k.noFx) return; const c = ELEMENTS[e] ? ELEMENTS[e].color : '#fff';
  glowDot(g, x, y, r * 1.6, alpha(c, .12));
}
function legShape(g, x0, y0, x1, y1, w0, w1, col, dk) { g.fillStyle = col; g.beginPath(); g.moveTo(x0 - w0 / 2, y0); g.lineTo(x0 + w0 / 2, y0); g.lineTo(x1 + w1 / 2, y1); g.lineTo(x1 - w1 / 2, y1); g.closePath(); g.fill(); g.strokeStyle = OUT; g.lineWidth = .9; g.stroke(); g.fillStyle = dk; g.beginPath(); g.moveTo(x0 + w0 * .1, y0); g.lineTo(x0 + w0 / 2, y0); g.lineTo(x1 + w1 / 2, y1); g.lineTo(x1 + w1 * .1, y1); g.fill(); }
/* ---------- BLOBS ---------- */
ENEMY_DRAW.blob = (g, k) => {
  const R = k.R, [c, d, a, ey] = k.pal, sq = 1 + Math.sin(k.t * 3 + k.seed) * .05 + k.wind * -.2 + k.atk * .22, sx = 1 / sq, kd = k.kind;
  g.save(); g.scale(sx, sq); const hop = Math.abs(Math.sin(k.ph)) * R * .35 * k.mv; g.translate(0, -hop);
  if (kd === 'slime') {
    g.fillStyle = 'rgba(8,10,16,.3)'; g.beginPath(); g.ellipse(0, hop + 1, R * 1.1, R * .3, 0, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(-R * 1.05, 0); g.bezierCurveTo(-R * 1.1, -R * 1.2, -R * .4, -R * 1.9, 0, -R * 1.85); g.bezierCurveTo(R * .5, -R * 1.9, R * 1.1, -R * 1.2, R * 1.05, 0); g.quadraticCurveTo(0, R * .25, -R * 1.05, 0); g.closePath();
    g.fillStyle = eGrad(g, 0, -R * 1.9, 0, 0, a + 'cc', c + 'dd', d + 'ee'); g.globalAlpha = .92; g.fill(); g.globalAlpha = 1; g.strokeStyle = OUT; g.lineWidth = 1.3; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(-R * .45, -R * 1.35, R * .3, R * .16, -.6, 0, TAU); g.fill(); g.beginPath(); g.arc(-R * .1, -R * 1.62, R * .07, 0, TAU); g.fill();
    g.fillStyle = 'rgba(20,60,40,.25)'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(Math.sin(i * 2.1 + k.seed) * R * .6, -R * (.35 + (i * .27) % 1), R * (.07 + (i % 3) * .03), 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(30,80,50,.55)'; g.beginPath(); g.ellipse(R * .2, -R * .55, R * .26, R * .22, 0, 0, TAU); g.fill(); // núcleo
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(-R * .35, -R * .95, R * .22, R * .26, 0, 0, TAU); g.ellipse(R * .3, -R * .95, R * .22, R * .26, 0, 0, TAU); g.fill(); g.fillStyle = ey; g.beginPath(); g.arc(-R * .3, -R * .93, R * .12, 0, TAU); g.arc(R * .35, -R * .93, R * .12, 0, TAU); g.fill(); g.strokeStyle = ey; g.lineWidth = 1.4; g.beginPath(); g.arc(R * .02, -R * .6, R * .2 + k.atk * R * .1, .15, Math.PI - .15); g.stroke();
  } else if (kd === 'toad') {
    g.fillStyle = 'rgba(8,10,16,.3)'; g.beginPath(); g.ellipse(0, hop + 1, R * 1.2, R * .3, 0, 0, TAU); g.fill();
    g.fillStyle = eGrad(g, 0, -R * 1.4, 0, 0, c, d); g.beginPath(); g.ellipse(0, -R * .75, R * 1.15, R * .8, 0, 0, TAU); g.fill(); g.strokeStyle = OUT; g.lineWidth = 1.3; g.stroke();
    g.fillStyle = a; g.beginPath(); g.ellipse(0, -R * .35, R * .8, R * .45, 0, 0, TAU); g.fill();
    g.fillStyle = shade(c, -.25); for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(Math.sin(i * 2.7 + k.seed) * R * .9, -R * (.7 + (i % 4) * .22), R * .1, 0, TAU); g.fill(); }
    for (const sx2 of [-1, 1]) { g.fillStyle = c; g.beginPath(); g.ellipse(sx2 * R * .5, -R * 1.45, R * .32, R * .3, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = ey; g.beginPath(); g.arc(sx2 * R * .5, -R * 1.47, R * .22, 0, TAU); g.fill(); g.fillStyle = '#10100a'; g.fillRect(sx2 * R * .5 - R * .17, -R * 1.5, R * .34, R * .08); }
    for (const sx2 of [-1, 1]) { legShape(g, sx2 * R * .7, -R * .35, sx2 * R * 1.1, -R * .02, R * .45, R * .3, c, d); g.fillStyle = c; g.beginPath(); g.ellipse(sx2 * R * 1.2, 0, R * .32, R * .13, 0, 0, TAU); g.fill(); }
    g.strokeStyle = '#2a1a10'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-R * .6, -R * .85); g.quadraticCurveTo(0, -R * (.6 - k.atk * .4), R * .6, -R * .85); g.stroke();
    if (k.atk > .1) { g.strokeStyle = '#e04a6a'; g.lineWidth = 3; g.beginPath(); g.moveTo(R * .5, -R * .8); g.lineTo(R * (.5 + k.atk * 1.6), -R * .85); g.stroke(); }
    g.fillStyle = 'rgba(180,255,90,.5)'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(Math.sin(k.t * 2 + i) * R * .5 + R * .3, -R * 1.9 - (k.t * 14 + i * 7) % 12, 1.4, 0, TAU); g.fill(); }
  } else if (kd === 'armadillo') {
    g.fillStyle = 'rgba(8,10,16,.3)'; g.beginPath(); g.ellipse(0, hop + 1, R * 1.3, R * .3, 0, 0, TAU); g.fill();
    for (const sx2 of [-1, 1]) { g.fillStyle = d; for (const lx of [-.6, .5]) { g.beginPath(); g.ellipse(lx * R + Math.sin(k.ph + (lx > 0 ? 0 : 3)) * R * .15 * k.mv, -R * .12, R * .24, R * .14, 0, 0, TAU); g.fill(); } break; }
    g.fillStyle = eGrad(g, 0, -R * 1.6, 0, 0, a, c, d); g.beginPath(); g.moveTo(-R * 1.25, -R * .15); g.bezierCurveTo(-R * 1.3, -R * 1.5, R * .9, -R * 1.9, R * 1.2, -R * .6); g.lineTo(R * 1.2, -R * .15); g.closePath(); g.fill(); g.strokeStyle = OUT; g.lineWidth = 1.4; g.stroke();
    g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 1.2; for (let i = 0; i < 7; i++) { const x = -R * 1.05 + i * R * .34; g.beginPath(); g.moveTo(x, -R * .15); g.quadraticCurveTo(x + R * .1, -R * 1.1, x - R * .1 + R * (i * .06), -R * 1.7 + i * R * .1); g.stroke(); }
    g.fillStyle = shade(a, .3); for (let i = 0; i < 12; i++) { g.beginPath(); g.arc(-R + (i % 6) * R * .4, -R * (.4 + Math.floor(i / 6) * .5), R * .06, 0, TAU); g.fill(); }
    g.fillStyle = c; g.beginPath(); g.moveTo(R * 1.1, -R * .7); g.quadraticCurveTo(R * 1.8, -R * .8, R * 1.9, -R * .35); g.quadraticCurveTo(R * 1.5, -R * .15, R * 1.1, -R * .2); g.closePath(); g.fill(); g.stroke(); eEye(g, R * 1.5, -R * .5, R * .1, ey, false, false); g.fillStyle = '#1a1210'; g.beginPath(); g.arc(R * 1.88, -R * .4, R * .07, 0, TAU); g.fill(); g.fillStyle = d; g.beginPath(); g.moveTo(R * 1.25, -R * .75); g.lineTo(R * 1.05, -R * 1.05); g.lineTo(R * 1.4, -R * .85); g.fill();
  } else { // geode
    g.fillStyle = 'rgba(8,10,16,.35)'; g.beginPath(); g.ellipse(0, hop + 1, R * 1.2, R * .32, 0, 0, TAU); g.fill();
    const pts = []; for (let i = 0; i < 9; i++) { const an = i / 9 * TAU, rr = R * (.95 + hash2(i, k.seed, 8) * .3); pts.push([Math.cos(an) * rr, -R * .9 + Math.sin(an) * rr * .85]); }
    poly(g, pts, c, OUT, 1.4); poly(g, [pts[3], pts[4], pts[5], pts[6], pts[7]], d); poly(g, [pts[0], pts[1], pts[2], pts[3], [0, -R * .9]], shade(c, .2));
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.moveTo(-R * .2, -R * 1.1); g.lineTo(R * .1, -R * .7); g.lineTo(-R * .3, -R * .3); g.lineTo(-R * .1, -R * .7); g.fill();
    glowDot(g, 0, -R * 1.3, R * 1.6, alpha(a, .35)); for (const [x, h, w, an] of [[-.45, 1.1, .3, -.3], [.1, 1.5, .34, 0], [.55, 1.0, .28, .3]]) crystalShape(g, R * x, -R * 1.15, R * h, R * w, a, an, false);
    for (const sx2 of [-1, 1]) { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(sx2 * R * .4, -R * .7, R * .2, R * .16, 0, 0, TAU); g.fill(); eEye(g, sx2 * R * .4, -R * .7, R * .1, ey, false, true); }
    g.fillStyle = d; for (const sx2 of [-1, 1]) { g.beginPath(); g.ellipse(sx2 * R * .8, -R * .1 - Math.abs(Math.sin(k.ph + (sx2 > 0 ? 1.5 : 0))) * R * .15 * k.mv, R * .26, R * .2, 0, 0, TAU); g.fill(); g.stroke(); }
  }
  g.restore();
};
/* ---------- QUADRÚPEDES ---------- */
const QUAD = {
  boar: { len: 2.7, h: 1.35, leg: .5, head: 1.05, hx: .98, hy: .1, tail: 'curly', ear: 'flop' },
  rabbit: { len: 2.0, h: 1.2, leg: .45, head: .9, hx: .95, hy: .05, tail: 'puff', ear: 'long' },
  wolf: { len: 2.8, h: 1.1, leg: .8, head: .95, hx: 1.0, hy: .05, tail: 'bushy', ear: 'point' },
  stag: { len: 2.7, h: 1.2, leg: 1.1, head: .88, hx: 1.0, hy: -.5, tail: 'short', ear: 'point', neck: true },
  panther: { len: 3.0, h: .95, leg: .72, head: .86, hx: 1.02, hy: .1, tail: 'long', ear: 'round' },
  croc: { len: 3.6, h: .9, leg: .32, head: 1.2, hx: 1.05, hy: .1, tail: 'croc', ear: 'none' },
  bear: { len: 2.6, h: 1.6, leg: .62, head: 1.0, hx: .95, hy: -.1, tail: 'stub', ear: 'round' },
  ram: { len: 2.5, h: 1.3, leg: .85, head: .85, hx: 1.0, hy: -.15, tail: 'stub', ear: 'flop' },
  hound: { len: 2.8, h: 1.15, leg: .85, head: 1.0, hx: 1.0, hy: .05, tail: 'bushy', ear: 'point' }
};
ENEMY_DRAW.quad = (g, k) => {
  const R = k.R, [c, d, a, ey] = k.pal, kd = k.kind === 'rabbit' ? 'rabbit' : k.kind, Q = QUAD[kd] || QUAD.wolf, L = Q.len * R * .5, H = Q.h * R * .5, legL = Q.leg * R, crouch = k.wind * R * .22, by = -legL - H + crouch;
  const hot = kd === 'hound', hellfire = hot && k.el === 'fogo', croc = kd === 'croc';
  const bodyCol = (kd === 'bear') ? c : c, belly = mixHex(c.length === 7 ? c : '#888888', a.length === 7 ? a : '#cccccc', .45);
  g.fillStyle = 'rgba(8,10,16,.32)'; g.beginPath(); g.ellipse(0, 1, L * 1.25, R * .34, 0, 0, TAU); g.fill();
  const stride = (i) => Math.sin(k.ph * (croc ? 1 : 1.25) + i * Math.PI * (i < 2 ? 1 : 1) + (i > 1 ? Math.PI * .5 : 0)) * k.mv;
  const leg = (xo, i, far) => { const s = stride(i), lift = Math.max(0, s) * legL * .3, x1 = xo + s * L * .22, cc = far ? shade(c, -.35) : c, dd = far ? shade(d, -.25) : d; const ky = by + H * .55, kneeX = xo + s * L * .1 + (i > 1 ? -R * .12 : R * .1), kneeY = ky + (-by - H * .55 + 0) * .55 - lift * .6;
    g.fillStyle = cc; g.beginPath(); g.moveTo(xo - R * .24, ky); g.lineTo(kneeX - R * .17, kneeY); g.lineTo(x1 - R * .12, -lift - R * .06); g.lineTo(x1 + R * .12, -lift - R * .06); g.lineTo(kneeX + R * .17, kneeY); g.lineTo(xo + R * .24, ky); g.closePath(); g.fill(); g.strokeStyle = OUT; g.lineWidth = .9; g.stroke();
    g.fillStyle = croc ? '#2a3a20' : kd === 'boar' || kd === 'stag' || kd === 'ram' ? '#2a2018' : dd; g.beginPath(); g.ellipse(x1 + R * .08, -lift - R * .02, R * .19, R * .1, 0, 0, TAU); g.fill(); if (!croc) { g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = .8; g.beginPath(); g.moveTo(x1 + R * .12, -lift - R * .05); g.lineTo(x1 + R * .2, -lift - R * .02); g.stroke(); } };
  // cauda
  g.save(); g.translate(-L * .95, by - H * .2); const tw = Math.sin(k.t * 4 + k.seed) * .25 + k.mv * Math.sin(k.ph) * .15;
  if (Q.tail === 'bushy') { g.rotate(-.3 + tw); g.fillStyle = eGrad(g, 0, 0, -R * 1.5, 0, c, d); g.beginPath(); g.moveTo(0, -R * .1); g.quadraticCurveTo(-R * .9, -R * .6, -R * 1.7, R * .1); g.quadraticCurveTo(-R * .8, R * .35, 0, R * .15); g.fill(); g.strokeStyle = OUT; g.lineWidth = 1; g.stroke(); g.fillStyle = hellfire ? '#ffb040' : a; g.beginPath(); g.moveTo(-R * 1.25, -R * .2); g.quadraticCurveTo(-R * 1.7, 0, -R * 1.7, R * .1); g.quadraticCurveTo(-R * 1.4, R * .2, -R * 1.2, R * .15); g.fill(); }
  else if (Q.tail === 'long') { g.strokeStyle = d; g.lineWidth = R * .26; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-R * .9, -R * .4 + tw * R, -R * 1.4, R * .2, -R * 2.2, -R * .6 + tw * R * 2); g.stroke(); g.strokeStyle = c; g.lineWidth = R * .16; g.stroke(); }
  else if (Q.tail === 'croc') { g.fillStyle = eGrad(g, 0, 0, -R * 2, 0, c, d); g.beginPath(); g.moveTo(0, -H * .5); g.quadraticCurveTo(-R * 1.2, -H * .4 + tw * R, -R * 2.6, R * .3 + tw * R * 2); g.quadraticCurveTo(-R * 1.2, H * .4, 0, H * .5); g.fill(); g.strokeStyle = OUT; g.lineWidth = 1; g.stroke(); spikes(g, -R * .2, -H * .5, -R * 2.2, R * .1, 6, R * .2, a); }
  else if (Q.tail === 'curly') { g.strokeStyle = d; g.lineWidth = R * .14; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-R * .4, -R * .5, -R * .1, -R * .7, -R * .3, -R * .4 + tw * R); g.stroke(); }
  else if (Q.tail === 'puff') { g.fillStyle = '#fff'; g.beginPath(); g.arc(-R * .1, -R * .1, R * .28, 0, TAU); g.fill(); g.strokeStyle = OUT; g.lineWidth = .9; g.stroke(); }
  else { g.fillStyle = d; g.beginPath(); g.ellipse(-R * .15, 0, R * .3, R * .18, -.5 + tw, 0, TAU); g.fill(); }
  g.restore();
  leg(-L * .62, 3, true); leg(L * .55, 1, true);
  // corpo
  g.save(); g.translate(0, by);
  g.beginPath(); g.ellipse(0, 0, L, H, 0, 0, TAU); g.fillStyle = eGrad(g, 0, -H, 0, H, shade(c, .12), c, d); g.fill(); g.strokeStyle = OUT; g.lineWidth = 1.3; g.stroke();
  g.save(); g.clip(); g.fillStyle = belly; g.beginPath(); g.ellipse(L * .1, H * .9, L * .9, H * .5, 0, 0, TAU); g.fill();
  if (kd === 'wolf' || kd === 'hound') furTufts(g, 0, 0, L * .9, H * .8, 24, d, R * .3, k.seed);
  if (kd === 'panther') { g.fillStyle = alpha(a.length === 7 ? a : '#8a6ae0', .35); for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(-L * .7 + i * L * .17, Math.sin(i * 2.1) * H * .4 - H * .1, R * .16, R * .1, .5, 0, TAU); g.fill(); } }
  if (kd === 'boar') { g.strokeStyle = shade(d, -.2); g.lineWidth = 1.2; for (let i = 0; i < 12; i++) { const x = -L * .8 + i * L * .14; g.beginPath(); g.moveTo(x, -H * .95); g.lineTo(x - R * .12, -H * 1.1); g.stroke(); } g.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i < 4; i++) g.fillRect(-L * .5 + i * L * .3, -H, R * .12, H * 1.2); }
  if (croc) { g.fillStyle = shade(c, -.2); for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(-L * .85 + i * L * .2, -H * .6, R * .14, R * .1, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = .7; g.stroke(); } g.fillStyle = shade(c, .12); for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(-L * .85 + i * L * .2, -H * .15, R * .13, R * .09, 0, 0, TAU); g.fill(); } }
  if (kd === 'bear') furTufts(g, 0, 0, L * .9, H * .8, 32, shade(c, -.1), R * .35, k.seed);
  if (kd === 'ram') { g.fillStyle = '#efe6d0'; for (let i = 0; i < 16; i++) { g.beginPath(); g.arc(-L * .6 + (i % 8) * L * .17, -H * .5 + Math.floor(i / 8) * H * .5, R * .22, 0, TAU); g.fill(); } }
  if (hellfire) { g.fillStyle = 'rgba(255,120,30,.3)'; g.fillRect(-L, -H, L * 2, H * 2); g.strokeStyle = '#ff9a3a'; g.lineWidth = 1.4; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-L * .7 + i * L * .3, -H * .3); g.lineTo(-L * .6 + i * L * .3, H * .4); g.stroke(); } }
  if (hot && k.el === 'raio') { g.strokeStyle = '#ffe36d'; g.lineWidth = 1.2; g.shadowColor = '#ffe36d'; g.shadowBlur = 5; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-L * .6 + i * L * .5, -H * .7); g.lineTo(-L * .5 + i * L * .5, -H * .1); g.lineTo(-L * .65 + i * L * .5, -H * .1); g.lineTo(-L * .55 + i * L * .5, H * .5); g.stroke(); } g.shadowBlur = 0; }
  g.restore();
  g.restore();
  // crista/mane
  if (kd === 'wolf' || kd === 'hound' || kd === 'panther') { g.save(); g.translate(0, by); spikes(g, -L * .6, -H * .85, L * .7, -H * .9, 9, R * (hellfire ? .45 : .22), hellfire ? '#ff9a3a' : shade(c, -.2)); g.restore(); }
  if (kd === 'boar') { g.save(); g.translate(0, by); spikes(g, -L * .8, -H * .92, L * .8, -H * 1.0, 10, R * .26, shade(d, -.1)); g.restore(); }
  leg(-L * .5, 2, false); leg(L * .65, 0, false);
  // cabeça
  const hx = L * Q.hx, hy = by + Q.hy * R - (Q.neck ? R * .8 : 0), hr = Q.head * R * .5, bite = k.atk * R * .4, back = k.wind * -R * .25;
  g.save(); g.translate(hx + back, hy - H * .1 + crouch * .2);
  if (Q.neck) { g.fillStyle = c; g.beginPath(); g.moveTo(-R * .5, R * .9); g.lineTo(-R * .1, R * .6); g.lineTo(R * .2, R * .1); g.lineTo(-R * .3, -R * .1); g.closePath(); g.fill(); g.strokeStyle = OUT; g.lineWidth = 1; g.stroke(); }
  g.rotate(-k.wind * .25 + k.atk * .15);
  const snoutL = kd === 'croc' ? R * 1.5 : kd === 'wolf' || kd === 'hound' ? R * .75 : kd === 'panther' ? R * .4 : kd === 'boar' ? R * .7 : kd === 'bear' ? R * .55 : kd === 'stag' ? R * .7 : kd === 'rabbit' ? R * .3 : R * .5;
  // orelhas atrás
  const ear = (dx, back2) => { g.save(); g.translate(dx, -hr * .85); g.fillStyle = back2 ? d : c; g.strokeStyle = OUT; g.lineWidth = .9; g.beginPath(); if (Q.ear === 'long') { g.rotate(-.3 - Math.sin(k.t * 3) * .05 + (back2 ? .25 : 0)); g.moveTo(-R * .12, 0); g.quadraticCurveTo(-R * .3, -R * 1.3, R * .05, -R * 1.4); g.quadraticCurveTo(R * .3, -R * .6, R * .14, 0); g.fill(); g.stroke(); g.fillStyle = '#f2a0a8'; g.beginPath(); g.moveTo(-R * .04, -R * .1); g.quadraticCurveTo(-R * .12, -R * 1.0, R * .04, -R * 1.2); g.quadraticCurveTo(R * .12, -R * .5, R * .08, -R * .1); g.fill(); } else if (Q.ear === 'point') { g.moveTo(-R * .2, 0); g.lineTo(-R * .05, -R * .6); g.lineTo(R * .22, 0); g.closePath(); g.fill(); g.stroke(); g.fillStyle = d; g.beginPath(); g.moveTo(-R * .1, 0); g.lineTo(-R * .03, -R * .38); g.lineTo(R * .12, 0); g.fill(); } else if (Q.ear === 'flop') { g.moveTo(-R * .2, 0); g.quadraticCurveTo(-R * .5, -R * .1, -R * .45, R * .35); g.quadraticCurveTo(-R * .1, R * .1, R * .12, 0); g.fill(); g.stroke(); } else if (Q.ear === 'round') { g.arc(0, 0, R * .2, Math.PI, 0); g.fill(); g.stroke(); } g.restore(); };
  if (Q.ear !== 'none') ear(-hr * .3, true);
  if (kd === 'stag') { // galhada
    for (const bk of [true, false]) { g.save(); g.translate(-hr * .1 + (bk ? -R * .1 : 0), -hr * .9); g.strokeStyle = bk ? '#7a6a48' : '#c8b88a'; g.lineWidth = R * .13; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-R * .3, -R * .8, -R * .1 + (bk ? -R * .2 : 0), -R * 1.5); g.stroke(); for (let i = 0; i < 3; i++) { const t = .25 + i * .26, bx = -R * .3 * t * 1.4, by2 = -R * 1.5 * t; g.lineWidth = R * .08; g.beginPath(); g.moveTo(bx, by2); g.lineTo(bx + R * (.25 + i * .06), by2 - R * (.35 + i * .06)); g.stroke(); } if (!bk) { g.fillStyle = ey; g.shadowColor = ey; g.shadowBlur = 5; g.beginPath(); g.arc(-R * .1, -R * 1.55, R * .07, 0, TAU); g.fill(); g.shadowBlur = 0; g.strokeStyle = '#4aa84a'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, -R * .1); g.bezierCurveTo(-R * .2, -R * .6, R * .1, -R * .8, -R * .1, -R * 1.2); g.stroke(); } g.restore(); } }
  if (kd === 'ram') { g.strokeStyle = '#d8ccae'; g.lineWidth = R * .26; g.lineCap = 'round'; g.beginPath(); g.moveTo(-hr * .1, -hr * .7); g.bezierCurveTo(-R * .9, -hr * .9, -R * 1.0, R * .5, -R * .3, R * .35); g.stroke(); g.strokeStyle = '#a89c80'; g.lineWidth = R * .1; g.stroke(); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(-R * .55, -hr * .1 + R * .1, R * (.32 + i * .15), 3.4, 5.0); g.stroke(); } }
  // crânio
  g.fillStyle = eGrad(g, 0, -hr, 0, hr, shade(c, .1), c, d); g.beginPath(); g.ellipse(0, 0, hr, hr * .85, 0, 0, TAU); g.fill(); g.strokeStyle = OUT; g.lineWidth = 1.2; g.stroke();
  // focinho
  const lowJ = bite * .9; g.fillStyle = kd === 'croc' ? eGrad(g, 0, -hr * .4, 0, hr * .4, c, d) : eGrad(g, 0, -hr * .3, 0, hr * .5, shade(c, .1), shade(c, -.1));
  g.beginPath(); g.moveTo(hr * .3, -hr * .45); g.lineTo(hr * .3 + snoutL, -hr * .3); g.quadraticCurveTo(hr * .3 + snoutL * 1.08, -hr * .05, hr * .3 + snoutL, hr * .12); g.lineTo(hr * .1, hr * .22); g.closePath(); g.fill(); g.stroke();
  if (croc || kd === 'wolf' || kd === 'hound' || kd === 'panther' || kd === 'bear') { g.fillStyle = shade(d, -.5); g.beginPath(); g.moveTo(hr * .2, hr * .22); g.lineTo(hr * .3 + snoutL, hr * .12); g.lineTo(hr * .3 + snoutL * .9 - lowJ * .1, hr * .12 + lowJ + R * .14); g.lineTo(hr * .1, hr * .32 + lowJ); g.closePath(); g.fill(); g.fillStyle = shade(d, -.6); g.beginPath(); g.moveTo(hr * .3, hr * .24); g.lineTo(hr * .3 + snoutL * .9, hr * .14 + lowJ * .9); g.lineTo(hr * .3 + snoutL * .9, hr * .14 + lowJ * .9 + 2); g.lineTo(hr * .3, hr * .28); g.fill(); }
  if (kd === 'wolf' || kd === 'hound' || croc || kd === 'panther' || kd === 'bear' || kd === 'rabbit') { const tn = croc ? 7 : 3, tw2 = snoutL * .8; for (let i = 0; i < tn; i++) fang(g, hr * .35 + i * tw2 / tn, hr * .12, R * .09, R * (croc ? .2 : .25) + k.atk * R * .1); if (kd === 'rabbit') { fang(g, hr * .35 + snoutL * .85, hr * .08, R * .1, R * .3); } }
  if (kd === 'boar') { g.fillStyle = '#efe6cc'; g.strokeStyle = OUT; g.lineWidth = .9; for (const o of [0, 1]) { g.beginPath(); g.moveTo(hr * .6 + o * 2, hr * .1); g.quadraticCurveTo(hr * .5 + snoutL * .5, R * .5, hr * .6 + snoutL * .75, -R * .25 - o * 3); g.lineTo(hr * .6 + snoutL * .55, hr * .15); g.closePath(); g.fill(); g.stroke(); } g.fillStyle = shade(c, .18); g.beginPath(); g.ellipse(hr * .3 + snoutL, -hr * .1, R * .22, R * .3, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#1a0e10'; g.beginPath(); g.ellipse(hr * .3 + snoutL + 1, -hr * .18, R * .05, R * .08, 0, 0, TAU); g.ellipse(hr * .3 + snoutL + 1, -hr * .02, R * .05, R * .08, 0, 0, TAU); g.fill(); }
  g.fillStyle = '#16100e'; if (kd !== 'boar') { g.beginPath(); g.ellipse(hr * .3 + snoutL * 1.02, -hr * .3, R * .09, R * .07, 0, 0, TAU); g.fill(); }
  if (kd === 'rabbit') { g.fillStyle = '#f2a0a8'; g.beginPath(); g.arc(hr * .3 + snoutL, -hr * .22, R * .08, 0, TAU); g.fill(); }
  if (kd === 'panther') { g.strokeStyle = '#e0e0f0'; g.lineWidth = .7; for (const yy of [-.1, .02]) { g.beginPath(); g.moveTo(hr * .6, hr * yy); g.lineTo(hr * .6 + snoutL * 1.4, hr * yy - .5 + (yy < 0 ? -2 : 3)); g.stroke(); } }
  eEye(g, hr * .38, -hr * .22, R * (kd === 'rabbit' ? .17 : .13), ey, kd === 'panther' || croc || kd === 'stag', true);
  g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(hr * .08, -hr * .5 + k.wind * -2); g.lineTo(hr * .6, -hr * .3 + k.wind * 2); g.stroke();
  if (Q.ear !== 'none' && kd !== 'stag') ear(hr * .05, false); if (kd === 'stag') { g.fillStyle = c; ear(hr * .05, false); }
  if (kd === 'bear') { g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.ellipse(hr * .1, -hr * .55, hr * .4, hr * .15, 0, 0, TAU); g.fill(); }
  g.restore();
  elementFx(g, k, 0, by, R * 1.4);
};
