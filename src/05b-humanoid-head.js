/* ---- caudas (tiefling, kitsune, draconato, minotauro) ---- */
function hTail(g, st, view, A) {
  const r = st.race; if (!['tiefling', 'kitsune', 'draconato', 'minotauro'].includes(r)) return;
  const sw = Math.sin(A.t * 2.6 + 1) * 3 + A.mv * Math.sin(A.ph) * 2, dir = view === 's' ? -1 : 1, y0 = -17;
  g.save(); g.translate(view === 's' ? -3 : 0, y0);
  if (r === 'tiefling') { g.strokeStyle = st.skinSh; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(dir * 9 + sw, 4, dir * 15 + sw, -6, dir * 12 + sw * 1.4, -14); g.stroke(); g.strokeStyle = st.skin; g.lineWidth = 1.8; g.stroke(); g.fillStyle = st.skinSh; g.beginPath(); g.moveTo(dir * 12 + sw * 1.4, -14); g.lineTo(dir * 8 + sw * 1.4, -16.5); g.lineTo(dir * 15 + sw * 1.4, -18); g.lineTo(dir * 15.5 + sw * 1.4, -12); g.closePath(); g.fill(); }
  else if (r === 'minotauro') { g.strokeStyle = st.skinSh; g.lineWidth = 2.4; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(dir * 6 + sw, 6, dir * 5 + sw, 12); g.stroke(); g.fillStyle = st.skinDk; g.beginPath(); g.ellipse(dir * 5 + sw, 13, 2.6, 4, 0, 0, TAU); g.fill(); }
  else if (r === 'kitsune') { const n = 2; for (let i = 0; i < n; i++) { const o2 = (i - .5) * 6 * (view === 's' ? .5 : 1), s2 = sw * (1 + i * .3); g.fillStyle = st.skin === '#eeeef4' ? '#d8d8e4' : shade(st.skin, -.1); g.beginPath(); g.moveTo(o2, 0); g.bezierCurveTo(o2 + dir * 10 + s2, -2, o2 + dir * 16 + s2, -12, o2 + dir * 11 + s2 * 1.5, -22); g.bezierCurveTo(o2 + dir * 6 + s2, -14, o2 + dir * 2, -6, o2 - dir * 2, -2); g.closePath(); g.fill(); g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = .9; g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(o2 + dir * 11 + s2 * 1.5, -22); g.bezierCurveTo(o2 + dir * 14 + s2, -17, o2 + dir * 14 + s2, -13, o2 + dir * 12 + s2, -13); g.bezierCurveTo(o2 + dir * 8 + s2, -15, o2 + dir * 8 + s2, -19, o2 + dir * 11 + s2 * 1.5, -22); g.fill(); } }
  else if (r === 'draconato') { g.strokeStyle = st.skinSh; g.lineWidth = 4.4; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(dir * 9 + sw, 5, dir * 16 + sw, 2, dir * 18 + sw * 1.2, -4); g.stroke(); g.strokeStyle = st.skin; g.lineWidth = 3; g.stroke(); g.fillStyle = st.skinDk; for (let i = 0; i < 4; i++) { const t = (i + 1) / 5, x = dir * (18 * t) + sw * t, y = 4 * Math.sin(t * 3) - 4 * t * t; g.beginPath(); g.moveTo(x - 1.6, y - 1.2); g.lineTo(x, y - 4.4); g.lineTo(x + 1.6, y - 1.2); g.fill(); } }
  g.restore();
}
/* ---- capa ---- */
function hCape(g, st, view, A, front) {
  const kd = st.capeKind; if (kd === 'sem') return; const bw = st.bw;
  const len = kd === 'curta' ? 14 : kd === 'esfarrapada' ? 30 : 33, sh = -30.4;
  const fl = Math.sin(A.t * 3 + A.ph * .5) * (1.4 + A.mv * 2.2) + A.mv * 3.6, ragged = kd === 'esfarrapada';
  if (front) { // gola e fecho (vista frontal)
    g.fillStyle = st.capeSh; g.beginPath(); g.moveTo(-8 * bw, sh + 1); g.quadraticCurveTo(0, sh + 4.4, 8 * bw, sh + 1); g.lineTo(7 * bw, sh - 1.6); g.quadraticCurveTo(0, sh + 1, -7 * bw, sh - 1.6); g.closePath(); g.fill(); g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = .8; g.stroke(); g.fillStyle = st.tr; g.beginPath(); g.arc(0, sh + 2.6, 1.9, 0, TAU); g.fill(); g.fillStyle = st.trHi; g.beginPath(); g.arc(-.5, sh + 2.1, .8, 0, TAU); g.fill(); return;
  }
  const w0 = (view === 's' ? 5 : 8.8) * bw, spread = view === 's' ? 4 : 8, xo = view === 's' ? -3 : 0, trl = 2 + A.mv * 3.4 + Math.sin(A.t * 3 + A.ph * .5) * 1.1;
  g.save(); g.translate(xo, 0);
  g.beginPath();
  if (view === 's') {
    g.moveTo(w0 * .5, sh); g.lineTo(-w0, sh); g.bezierCurveTo(-w0 - trl * .3, sh + len * .4, -w0 - trl * .9, sh + len * .75, -w0 - trl - 1, sh + len);
    if (ragged) { for (let i = 1; i < 5; i++) g.lineTo(-w0 - trl - 1 + i * 2.8, sh + len + (i % 2 ? -4 : 0.5)); }
    g.lineTo(-w0 * .2 - trl * .4 + 4, sh + len - 1); g.quadraticCurveTo(w0 * .3, sh + len * .5, w0 * .5, sh);
  } else {
    const segs = ragged ? 7 : 1, xa = w0 + spread + fl * .5, xb = -w0 - spread + fl * .5;
    g.moveTo(-w0, sh); g.lineTo(w0, sh); g.lineTo(xa, sh + len);
    if (ragged) for (let i = 1; i < segs; i++) { const t = i / segs; g.lineTo(mix(xa, xb, t), sh + len + (i % 2 ? -5 : 1) + Math.sin(A.t * 4 + i) * 1.2); }
    g.lineTo(xb, sh + len);
  }
  g.closePath();
  g.fillStyle = grad(g, -w0, sh, w0, sh + len, [st.capeHi, st.cape, st.capeSh]); g.fill(); g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 1.1; g.stroke();
  g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 1; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * w0 * .4, sh + 2); g.lineTo(i * (w0 + spread) * .45 + fl * .4 * (view === 's' ? 0 : 1), sh + len - 2); g.stroke(); }
  if (view === 'b' && st.emblem !== 'nenhum') { g.fillStyle = st.tr; g.globalAlpha = .85; g.beginPath(); g.arc(0, sh + len * .38, 3.4, 0, TAU); g.fill(); g.globalAlpha = 1; g.strokeStyle = st.capeSh; g.lineWidth = 1; g.beginPath(); g.arc(0, sh + len * .38, 1.7, 0, TAU); g.stroke(); }
  g.fillStyle = st.tr; g.fillRect(-w0, sh - .6, w0 * 2, 1.8); g.restore();
}
/* ---- ombreiras ---- */
function hShoulders(g, st, view) {
  const kd = st.shoulder; if (kd === 'nenhum') return; const bw = st.bw, ys = -30;
  const sides = view === 's' ? [1] : [-1, 1];
  if (kd === 'pele') { g.fillStyle = '#e4dcc8'; g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = .9; g.beginPath(); g.ellipse(0, ys - .4, (view === 's' ? 6.4 : 11.4 * bw), 3.6, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#b8ae98'; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; g.beginPath(); g.moveTo(Math.cos(a) * 9 * bw, ys - .4 + Math.sin(a) * 3); g.lineTo(Math.cos(a) * 11.4 * bw, ys + Math.sin(a) * 3.6 + 1); g.lineTo(Math.cos(a + .18) * 9 * bw, ys + Math.sin(a + .18) * 3); g.fill(); } return; }
  for (const sd of sides) {
    const x = view === 's' ? 1 : sd * (8.8 * bw + 1.2); g.save(); g.translate(x, ys); g.scale(sd, 1); const base = kd === 'couro' ? '#6a4a30' : '#9aa0ac', dk = shade(base, -.32), hi = shade(base, .26);
    g.fillStyle = base; g.beginPath(); g.moveTo(-3.6, 1.4); g.quadraticCurveTo(-4.4, -4.4, 1.4, -5); g.quadraticCurveTo(6.4, -4, 7.2, 2.6); g.quadraticCurveTo(3, 5, -3.6, 1.4); g.closePath(); g.fill(); g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 1; g.stroke();
    g.fillStyle = hi; g.beginPath(); g.ellipse(.6, -2.6, 3, 1.4, -.3, 0, TAU); g.fill(); g.fillStyle = dk; g.beginPath(); g.ellipse(3.4, 2.2, 3, 1.2, .2, 0, TAU); g.fill();
    if (kd === 'couro') { g.strokeStyle = '#33200f'; g.lineWidth = 1; g.beginPath(); g.moveTo(-1.5, -4); g.lineTo(-2, 1.4); g.moveTo(3, -4); g.lineTo(3.6, 2.4); g.stroke(); g.fillStyle = st.tr; circ(g, 1, -1.2, .9); }
    else { g.strokeStyle = st.tr; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-3.4, 1.4); g.quadraticCurveTo(3, 5, 7, 2.6); g.stroke(); if (kd === 'espinhos') { g.fillStyle = shade(base, .1); for (const [px, py, ang, L] of [[1, -4.8, -1.57, 6], [4.6, -3.4, -.9, 5], [-1.8, -3.8, -2.2, 5]]) { g.save(); g.translate(px, py); g.rotate(ang); g.beginPath(); g.moveTo(0, -1.4); g.lineTo(L, 0); g.lineTo(0, 1.4); g.closePath(); g.fill(); g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = .7; g.stroke(); g.restore(); } } else { g.fillStyle = st.tr; circ(g, 1.2, -1.6, 1); } }
    g.restore();
  }
}
/* ---- cabelo ---- */
const HAIR_COVER = new Set(['capuz', 'elmo', 'cornos']);
function hHairBack(g, st, view, A) {
  if (HAIR_COVER.has(st.head)) return; const hs = st.hairStyle, c = st.hair, c2 = st.hairSh, wv = Math.sin(A.t * 2.4) * .8 + A.mv * 1.4, hy = -39;
  g.fillStyle = c; g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = .9;
  if (hs === 'longo') { const L = view === 'b' ? 18 : 15; g.beginPath(); if (view === 's') { g.moveTo(-7, hy - 4); g.quadraticCurveTo(-11 + wv, hy + 6, -9 + wv * 1.5, hy + L); g.lineTo(-2, hy + L - 3); g.lineTo(-1, hy + 4); g.closePath(); } else { g.moveTo(-8.4, hy - 3); g.quadraticCurveTo(-10.4, hy + 8, -8.8 + wv, hy + L); g.lineTo(8.8 + wv, hy + L); g.quadraticCurveTo(10.4, hy + 8, 8.4, hy - 3); g.closePath(); } g.fill(); g.stroke(); g.fillStyle = c2; g.fillRect(view === 's' ? -8 : -5, hy + 6, 1.4, L - 7); g.fillRect(view === 's' ? -5 : 3, hy + 7, 1.4, L - 8); }
  else if (hs === 'rabo') { g.beginPath(); const dir = view === 's' ? -1 : 1; g.moveTo(dir * 1, hy - 5); g.bezierCurveTo(dir * (8 + wv * 2), hy - 3, dir * (11 + wv * 2), hy + 8, dir * (6 + wv * 3), hy + 15); g.bezierCurveTo(dir * (5 + wv * 3), hy + 8, dir * 4, hy + 2, dir * -1, hy - 2); g.closePath(); g.translate(0, 0); if (view !== 'b') { g.fill(); g.stroke(); } else { g.save(); g.translate(0, 4); g.fill(); g.stroke(); g.restore(); } }
  else if (hs === 'tranca') { const bx = view === 'f' ? 8.6 : view === 's' ? -7.6 : 0; for (let i = 0; i < 6; i++) { const y = hy - 3 + i * 3.6; g.fillStyle = i % 2 ? c : c2; g.beginPath(); g.ellipse(bx + Math.sin(i * 1.7 + wv) * 1.1, y, 2.4, 2.2, 0, 0, TAU); g.fill(); g.stroke(); } g.fillStyle = '#c7a65c'; g.fillRect(bx - 1.8, hy + 17, 3.6, 2); }
  else if (hs === 'selvagem') { g.beginPath(); g.moveTo(-9, hy - 2); for (let i = 0; i < 6; i++) { g.lineTo(-10 - (i & 1) * 2, hy + 1 + i * 2.8); g.lineTo(-7, hy + 3 + i * 2.4); } g.lineTo(-4, hy + 4); g.closePath(); g.fill(); g.beginPath(); g.moveTo(9, hy - 2); for (let i = 0; i < 6; i++) { g.lineTo(10 + (i & 1) * 2, hy + 1 + i * 2.8); g.lineTo(7, hy + 3 + i * 2.4); } g.lineTo(4, hy + 4); g.closePath(); g.fill(); }
}
function hHairFront(g, st, view, A) {
  if (HAIR_COVER.has(st.head)) return; const hs = st.hairStyle; if (hs === 'careca') return; const c = st.hair, c2 = st.hairSh, hi = st.hairHi, hy = -39, hat = st.head === 'chapeu';
  g.fillStyle = c; g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = .9;
  const cap = (top, side) => { g.beginPath(); if (view === 'f') { g.moveTo(-8.2, hy + 1.4); g.bezierCurveTo(-9.2, hy - top, 9.2, hy - top, 8.2, hy + 1.4); g.quadraticCurveTo(8, hy - 3.6, 4, hy - 4.4); g.quadraticCurveTo(0, hy - 2.2 + side, -4.4, hy - 4); g.quadraticCurveTo(-7.6, hy - 3.2, -8.2, hy + 1.4); } else if (view === 'b') { g.moveTo(-8.4, hy + 5); g.bezierCurveTo(-9.6, hy - top - 1, 9.6, hy - top - 1, 8.4, hy + 5); g.quadraticCurveTo(0, hy + 6.6, -8.4, hy + 5); } else { g.moveTo(-8, hy + 5); g.bezierCurveTo(-9, hy - top, 7, hy - top - 1, 7.8, hy - 1); g.quadraticCurveTo(4, hy - 4.2, 0, hy - 2.6); g.quadraticCurveTo(-2, hy - 1, -3, hy + 3); g.quadraticCurveTo(-5, hy + 2, -8, hy + 5); } g.closePath(); g.fill(); g.stroke(); };
  if (hs === 'moicano') { g.beginPath(); if (view === 's') { g.moveTo(-5, hy - 6); for (let i = 0; i < 5; i++) { g.lineTo(-5 + i * 2.2, hy - 12 - (i === 2 ? 3 : 0)); g.lineTo(-3.4 + i * 2.2, hy - 7); } } else { g.moveTo(-2.6, hy - 6); for (let i = 0; i < 4; i++) { g.lineTo(-2.6 + i * 1.7, hy - 13 - (i === 1 || i === 2 ? 2.4 : 0)); g.lineTo(-1.7 + i * 1.7, hy - 7); } g.lineTo(2.8, hy - 6); } g.closePath(); g.fill(); g.stroke(); g.fillStyle = hi; if (view !== 's') g.fillRect(-1, hy - 12, 1, 5); return; }
  cap(hat ? 7.6 : 11, 0);
  g.fillStyle = hi; g.beginPath(); if (view === 'f') g.ellipse(-2.6, hy - 5.8, 3.4, 1.2, -.3, 0, TAU); else g.ellipse(view === 's' ? -1 : -2.6, hy - 6.6, 3, 1.1, -.2, 0, TAU); g.fill();
  if (hs === 'curto') { g.fillStyle = c; if (view === 'f') { g.beginPath(); g.moveTo(-8, hy); g.lineTo(-9, hy + 5); g.lineTo(-7.2, hy + 2.8); g.closePath(); g.fill(); g.beginPath(); g.moveTo(8, hy); g.lineTo(9, hy + 5); g.lineTo(7.2, hy + 2.8); g.closePath(); g.fill(); } }
  else if (hs === 'longo') { g.fillStyle = c; if (view === 'f') { for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 8, hy - 2); g.quadraticCurveTo(sd * 10.4, hy + 6, sd * 9, hy + 14); g.lineTo(sd * 6.6, hy + 12); g.quadraticCurveTo(sd * 8, hy + 5, sd * 7.4, hy + 1); g.closePath(); g.fill(); g.stroke(); } } }
  else if (hs === 'coque') { g.fillStyle = c; g.beginPath(); g.arc(view === 's' ? -3 : 0, hy - 13, 4.4, 0, TAU); g.fill(); g.stroke(); g.fillStyle = hi; g.beginPath(); g.arc(view === 's' ? -4 : -1.2, hy - 14.4, 1.4, 0, TAU); g.fill(); g.fillStyle = '#c7a65c'; g.fillRect((view === 's' ? -3 : 0) - 3.6, hy - 9.6, 7.2, 1.6); }
  else if (hs === 'selvagem') { g.fillStyle = c; g.beginPath(); const sp = view === 's' ? [-6, -3, 0, 3, 6] : [-7.6, -4.6, -1.6, 1.6, 4.6, 7.6]; g.moveTo(sp[0] - 1.6, hy - 3); for (let i = 0; i < sp.length; i++) { g.lineTo(sp[i], hy - 11 - (i % 2) * 3.6 - (i === 2 ? 1.6 : 0)); g.lineTo(sp[i] + 1.6, hy - 5); } g.lineTo(sp[sp.length - 1] + 2, hy - 3); g.closePath(); g.fill(); g.stroke(); }
  else if (hs === 'tranca' && view === 'f') { g.fillStyle = c2; g.beginPath(); g.moveTo(0, hy - 8); g.lineTo(0, hy - 3); g.strokeStyle = c2; g.lineWidth = .8; g.stroke(); }
}
/* ---- barba ---- */
function hBeard(g, st, view, A) {
  const bd = st.beard; if (bd === 'nenhuma' || view === 'b') return; const c = st.hair, c2 = st.hairSh, hy = -39; g.fillStyle = c; g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = .8;
  const sx = view === 's' ? 2.4 : 0, wid = view === 's' ? .7 : 1;
  if (bd === 'bigode') { g.beginPath(); g.moveTo(sx - 4.6 * wid, hy + 5); g.quadraticCurveTo(sx - 1.4, hy + 3, sx, hy + 4.6); g.quadraticCurveTo(sx + 1.4, hy + 3, sx + 4.6 * wid, hy + 5); g.quadraticCurveTo(sx + 2.4, hy + 6.6, sx, hy + 5.6); g.quadraticCurveTo(sx - 2.4, hy + 6.6, sx - 4.6 * wid, hy + 5); g.fill(); g.stroke(); return; }
  if (bd === 'cavanhaque') { g.beginPath(); g.moveTo(sx - 2.4, hy + 6.6); g.quadraticCurveTo(sx, hy + 5, sx + 2.4, hy + 6.6); g.quadraticCurveTo(sx + 2.8, hy + 11, sx, hy + 13); g.quadraticCurveTo(sx - 2.8, hy + 11, sx - 2.4, hy + 6.6); g.fill(); g.stroke(); g.beginPath(); g.moveTo(sx - 4, hy + 5); g.quadraticCurveTo(sx, hy + 3.4, sx + 4, hy + 5); g.quadraticCurveTo(sx, hy + 5.6, sx - 4, hy + 5); g.fill(); return; }
  const L = bd === 'longa' ? 15 : 8.4, sw = Math.sin(A.t * 2.4) * .6 + A.mv * .8;
  g.beginPath(); g.moveTo(sx - 8 * wid, hy + 1); g.quadraticCurveTo(sx - 9 * wid, hy + 8, sx - 6 * wid, hy + 8 + L * .5); g.quadraticCurveTo(sx - 2 + sw, hy + 8 + L, sx + sw, hy + 9 + L); g.quadraticCurveTo(sx + 2 + sw, hy + 8 + L, sx + 6 * wid, hy + 8 + L * .5); g.quadraticCurveTo(sx + 9 * wid, hy + 8, sx + 8 * wid, hy + 1); g.quadraticCurveTo(sx + 4, hy + 3.6, sx, hy + 3.4); g.quadraticCurveTo(sx - 4, hy + 3.6, sx - 8 * wid, hy + 1); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = c2; g.lineWidth = .8; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(sx + i * 2, hy + 6); g.quadraticCurveTo(sx + i * 2.2, hy + 8 + L * .5, sx + i * 1.2 + sw, hy + 7 + L); g.stroke(); }
  g.fillStyle = st.hairHi; g.beginPath(); g.ellipse(sx - 2.4, hy + 8, 2.2, 1, -.4, 0, TAU); g.fill();
  g.fillStyle = st.skin; g.beginPath(); g.ellipse(sx, hy + 5.4, 2.4 * wid, 1, 0, 0, TAU); g.fill(); g.fillStyle = '#7a3a3a'; g.fillRect(sx - 1.2 * wid, hy + 5.2, 2.4 * wid, .8);
}
