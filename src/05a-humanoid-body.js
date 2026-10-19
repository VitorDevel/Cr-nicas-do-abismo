/* ============================================================
   RENDERIZADOR HUMANOIDE (herói, NPCs, inimigos humanos)
   Origem (0,0) = pés. Altura ≈ 48. Vistas: 'f' frente, 'b' costas, 's' lado.
   ============================================================ */
const BODY_W = { medio: 1, robusto: 1.17, esguio: .87 };
function hStyle(o) {
  const sig = [o.race, o.skin, o.hairStyle, o.hairColor, o.beard, o.head, o.cape, o.mark, o.shoulder, o.aura, o.body, o.armor, o.armorColor, o.trim, o.capeColor, o.eye, o.glow, o.weapon, o.emblem, o.extra].join('|');
  if (o._sig === sig) return o._st; o._sig = sig;
  const R = RACES[o.race] || RACES.humano, skin = o.skin || R.skin[1], ac = o.armorColor || '#425f69', tr = o.trim || '#c7a65c', cp = o.capeColor || '#8c3a3a', hr = o.hairColor || '#3b2a20';
  o._st = { race: o.race || 'humano', R, skin, skinSh: shade(skin, -.2), skinDk: shade(skin, -.38), skinHi: shade(skin, .16), ac, acSh: shade(ac, -.28), acHi: shade(ac, .22), acDk: shade(ac, -.5), tr, trSh: shade(tr, -.3), trHi: shade(tr, .35), cape: cp, capeSh: shade(cp, -.32), capeHi: shade(cp, .2), hair: hr, hairSh: shade(hr, -.3), hairHi: shade(hr, .28), eye: o.eye || '#3a2a1c', glow: o.glow || '#9fe8ff',
    bw: BODY_W[o.body] || 1, sw: R.scale[0], sh: R.scale[1], armor: o.armor || 'cota', hairStyle: o.hairStyle || 'curto', beard: o.beard || 'nenhuma', head: o.head || 'nenhum', capeKind: o.cape || 'longa', mark: o.mark || 'nenhuma', shoulder: o.shoulder || 'nenhum', aura: o.aura || 'nenhuma', weapon: o.weapon || 'espada', emblem: o.emblem || 'nenhum' };
  return o._st;
}
const HAND_REST = { sword: -1.15, katana: -1.1, axe: -1.2, spear: -1.45, staff: -1.5, tome: -.6, wand: -1.0, orb: -1.2, bow: -1.57, crossbow: -.4, hammer: -1.2, mace: -1.1, totem: -1.5, moon: -1.5, scythe: -1.35, daggers: -.9, katars: -.5, kunai: -.8 };
function limb(g, x0, y0, x1, y1, w, col, colSh) {
  g.lineCap = 'round'; g.strokeStyle = colSh || shade(col, -.3); g.lineWidth = w + 1.3; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
}
/* ---- pernas e botas ---- */
function hLegs(g, st, view, A) {
  const k = st.armor, robe = k === 'runica', ph = A.ph, mv = A.mv, bw = st.bw;
  const legCol = k === 'couro' ? '#5a4030' : k === 'placas' ? st.acSh : k === 'samurai' ? shade(st.ac, -.45) : k === 'escamas' ? st.acSh : robe ? st.acSh : shade(st.ac, -.35);
  const boot = k === 'placas' ? '#8a8e98' : k === 'samurai' ? '#2a2420' : '#3a2a20', bootHi = shade(boot, .25);
  for (let i = 0; i < 2; i++) {
    const p = ph + i * Math.PI, sw = Math.sin(p), lift = Math.max(0, sw) * 3.8 * mv;
    let x, fx;
    if (view === 's') { x = 0; fx = sw * 5.2 * mv; } else { x = (i ? 1 : -1) * 3.5 * bw; fx = x + (i ? 1 : -1) * Math.max(0, -sw) * .8 * mv; }
    const fy = -lift - (view === 's' ? 0 : sw * 1.3 * mv);
    if (view === 's' && i === 0) g.globalAlpha = .82;
    limb(g, x, -15, fx, fy - 5, 5.6 * bw, legCol, shade(legCol, -.3));
    if (k === 'placas' || k === 'samurai') { g.fillStyle = k === 'placas' ? '#aab0bc' : st.ac; g.beginPath(); g.ellipse((x + fx) / 2, (-15 + fy - 5) / 2 - 1, 3.4 * bw, 2.6, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = .8; g.stroke(); }
    if (k === 'escamas') { g.fillStyle = st.acHi; for (let s = 0; s < 3; s++) { g.beginPath(); g.arc(x + (fx - x) * (s / 3), -13 + (fy - 5 + 13) * (s / 3), 1.6, 0, Math.PI); g.fill(); } }
    // bota
    g.fillStyle = boot; g.beginPath(); if (view === 's') { g.moveTo(fx - 3, fy - 6); g.lineTo(fx + 2, fy - 6); g.lineTo(fx + 5.4, fy - 1.5); g.quadraticCurveTo(fx + 5.6, fy + .6, fx + 3, fy + .8); g.lineTo(fx - 3.2, fy + .8); g.closePath(); } else { g.roundRect(fx - 3.6 * bw, fy - 6, 7.2 * bw, 7, [1.5, 1.5, 3, 3]); }
    g.fill(); g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = .9; g.stroke(); g.fillStyle = bootHi; if (view === 's') g.fillRect(fx - 2.6, fy - 5.6, 4, 1.4); else g.fillRect(fx - 2.6 * bw, fy - 5.6, 5.2 * bw, 1.4);
    if (k === 'samurai' || k === 'placas') { g.fillStyle = st.tr; if (view === 's') g.fillRect(fx - 3, fy - 5.5, 6, 1.2); else g.fillRect(fx - 3.6 * bw, fy - 5.4, 7.2 * bw, 1.3); }
    g.globalAlpha = 1;
  }
}
/* ---- tronco ---- */
function hTorso(g, st, view, A) {
  const bw = st.bw, k = st.armor, br = 1 + Math.sin(A.t * 2.2) * .012, top = -31, bot = -15, sW = (view === 's' ? 6.6 : 8.6) * bw, wW = (view === 's' ? 5.6 : 6.6) * bw;
  g.save(); g.translate(0, bot); g.scale(1, br); g.translate(0, -bot);
  const baseCol = k === 'couro' ? mixHex(st.ac, '#7a5a3a', .55) : k === 'cota' ? st.ac : k === 'placas' ? '#9aa0ac' : k === 'runica' ? st.ac : k === 'samurai' ? st.ac : st.ac;
  const skirt = k === 'runica' ? 12 : k === 'samurai' ? 5.5 : k === 'cota' ? 4 : k === 'escamas' ? 3 : 0;
  g.beginPath(); g.moveTo(-sW, top + 1); g.quadraticCurveTo(0, top - 1.5, sW, top + 1); g.lineTo(wW * 1.04, bot - 1); g.lineTo(wW * 1.14 + skirt * .35, bot + skirt); g.lineTo(-wW * 1.14 - skirt * .35, bot + skirt); g.lineTo(-wW * 1.04, bot - 1); g.closePath();
  g.fillStyle = grad(g, -sW, 0, sW, 0, [shade(baseCol, -.22), baseCol, shade(baseCol, .14), shade(baseCol, -.12)]); g.fill(); g.strokeStyle = 'rgba(4,4,10,.62)'; g.lineWidth = 1.1; g.stroke();
  g.save(); g.clip();
  if (k === 'cota') { g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = .7; for (let y = top; y < bot + skirt; y += 2.6) for (let x = -sW; x < sW; x += 3.2) { g.beginPath(); g.arc(x + ((y / 2.6) & 1) * 1.6, y, 1.4, 0, Math.PI); g.stroke(); } if (view !== 'b') { g.fillStyle = st.tr; g.fillRect(-sW, bot - 3, sW * 2, 1.8); } g.fillStyle = shade(st.ac, -.2); g.beginPath(); g.moveTo(-3.4, top + 2); g.lineTo(3.4, top + 2); g.lineTo(4.4, bot + skirt); g.lineTo(-4.4, bot + skirt); g.fill(); g.strokeStyle = st.tr; g.lineWidth = 1; g.stroke(); }
  else if (k === 'couro') { g.fillStyle = '#4a3222'; g.fillRect(-sW, bot - 3.6, sW * 2, 2.4); g.strokeStyle = '#33220f'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-sW + 1, top + 2); g.lineTo(wW, bot - 2); g.moveTo(sW - 1, top + 2); g.lineTo(-wW, bot - 2); g.stroke(); g.fillStyle = st.tr; g.fillRect(-1.6, bot - 4.2, 3.2, 3.2); g.fillStyle = shade(baseCol, .18); for (let i = 0; i < 4; i++) g.fillRect(-sW + 2 + i * 3.6, top + 5 + (i & 1) * 3, 1.6, 4); }
  else if (k === 'placas') { g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = .9; for (const y of [top + 5, top + 9.5, top + 13]) { g.beginPath(); g.moveTo(-sW, y); g.quadraticCurveTo(0, y + 1.6, sW, y); g.stroke(); } g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(-sW + 1, top + 2, 2.4, 14); g.fillStyle = st.tr; g.fillRect(-sW, bot - 2.6, sW * 2, 2.2); if (view === 'f') { g.fillStyle = st.ac; g.beginPath(); g.moveTo(0, top + 3); g.lineTo(3.6, top + 6.6); g.lineTo(0, top + 12); g.lineTo(-3.6, top + 6.6); g.closePath(); g.fill(); g.strokeStyle = st.tr; g.lineWidth = .9; g.stroke(); } }
  else if (k === 'runica') { g.fillStyle = shade(st.ac, -.25); g.beginPath(); g.moveTo(-1.5, top + 1); g.lineTo(1.5, top + 1); g.lineTo(5, bot + skirt); g.lineTo(-5, bot + skirt); g.fill(); g.strokeStyle = st.glow; g.lineWidth = 1; g.shadowColor = st.glow; g.shadowBlur = 4; g.beginPath(); g.moveTo(-sW, bot + skirt - 1.5); for (let x = -sW; x <= sW; x += 3) g.lineTo(x, bot + skirt - 1.5 + ((x / 3) & 1 ? -1.4 : 0)); g.stroke(); g.beginPath(); g.moveTo(0, top + 3); g.lineTo(0, bot + 2); g.stroke(); g.shadowBlur = 0; g.fillStyle = st.tr; g.fillRect(-sW, bot - 2.2, sW * 2, 2); }
  else if (k === 'samurai') { for (let y = top + 2; y < bot - 1; y += 3.4) { g.fillStyle = (((y - top) / 3.4) | 0) % 2 ? shade(st.ac, -.12) : st.ac; g.fillRect(-sW, y, sW * 2, 3.2); g.fillStyle = st.tr; g.fillRect(-sW + 1.2, y, .9, 3.2); g.fillRect(sW - 2.1, y, .9, 3.2); } g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = .7; for (let y = top + 2; y < bot; y += 3.4) { g.beginPath(); g.moveTo(-sW, y); g.lineTo(sW, y); g.stroke(); } for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? st.ac : shade(st.ac, -.12); g.fillRect(-wW * 1.2 + i * wW * .62, bot - 1, wW * .6, skirt + 1); g.strokeStyle = st.tr; g.lineWidth = .7; g.strokeRect(-wW * 1.2 + i * wW * .62, bot - 1, wW * .6, skirt + 1); } g.fillStyle = '#c8302a'; g.fillRect(-sW, bot - 3.2, sW * 2, 2.4); }
  else if (k === 'escamas') { for (let y = top + 1; y < bot + skirt; y += 2.8) for (let x = -sW - 1; x < sW + 1; x += 3.2) { const xx = x + ((((y - top) / 2.8) | 0) & 1) * 1.6; g.fillStyle = ((xx + y) * 7 | 0) % 3 ? st.ac : st.acHi; g.beginPath(); g.arc(xx, y, 2, 0, Math.PI); g.fill(); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = .6; g.stroke(); } g.fillStyle = st.tr; g.fillRect(-sW, bot - 2.6, sW * 2, 2); g.fillStyle = shade(st.skin, -.1); g.fillRect(-1.5, top + 2, 3, 4); }
  if (view === 'f') { // emblema no peito
    const em = st.emblem; if (em !== 'nenhum' && k !== 'runica') { g.save(); g.translate(0, top + 8); g.fillStyle = st.tr; g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = .7; if (em === 'sol') { g.beginPath(); g.arc(0, 0, 2, 0, TAU); g.fill(); for (let i = 0; i < 8; i++) { const a = i * TAU / 8; g.beginPath(); g.moveTo(Math.cos(a) * 2.6, Math.sin(a) * 2.6); g.lineTo(Math.cos(a) * 4, Math.sin(a) * 4); g.stroke(); } } else if (em === 'lua') { g.beginPath(); g.arc(0, 0, 3.4, 0.5, TAU - .5); g.arc(1.4, 0, 2.6, TAU - .8, .8, true); g.fill(); } else if (em === 'runa') { g.beginPath(); g.moveTo(0, -3.4); g.lineTo(2.4, 0); g.lineTo(0, 3.4); g.lineTo(-2.4, 0); g.closePath(); g.fill(); g.stroke(); } else if (em === 'dragao') { g.beginPath(); g.moveTo(-3.2, 2); g.quadraticCurveTo(-3, -3, 0, -3.6); g.quadraticCurveTo(3, -3, 3.2, 2); g.lineTo(0, 0.6); g.closePath(); g.fill(); } g.restore(); } }
  g.restore(); // clip
  g.fillStyle = 'rgba(0,0,0,.14)'; if (view === 's') g.fillRect(-sW * .1, top, sW * 1.1, bot - top + 1); else g.fillRect(sW * .45, top + 1, sW * .55, bot - top);
  if (view === 'f' && k !== 'placas') { g.fillStyle = st.skinSh; g.beginPath(); g.moveTo(-2.2, top + .5); g.quadraticCurveTo(0, top + 4.4, 2.2, top + .5); g.fill(); }
  g.restore();
}
/* ---- braços: retorna posição da mão que segura a arma ---- */
function hArm(g, st, view, A, near) {
  const bw = st.bw, k = st.armor, sx = view === 's' ? 0 : (near ? 1 : -1), shY = -29.2, shX = view === 's' ? (near ? 1 : -1) * 1.0 : sx * (8.6 * bw + 1);
  let hx, hy;
  const sw = Math.sin(A.ph + (near ? Math.PI : 0)) * A.mv;
  if (near && A.wa != null) { const r = A.reach || 11; hx = shX + Math.cos(A.wa) * r * (view === 's' ? 1 : 1); hy = shY + Math.sin(A.wa) * r * .85 + 1; }
  else if (near && A.hold) { hx = shX + (view === 's' ? 7 : 3.4); hy = shY + 8; }
  else if (view === 's') { hx = shX + sw * 5; hy = shY + 13.5 - Math.abs(sw) * .8; }
  else { hx = shX + sx * 1.6; hy = shY + 13.5 - Math.max(0, sw * (near ? -1 : 1)) * 1.2; if (!near && A.off) { hx = shX - 2; hy = shY + 8; } }
  const sleeve = k === 'runica' ? st.ac : k === 'placas' ? '#9aa0ac' : k === 'couro' ? '#5a4030' : k === 'escamas' ? st.ac : st.ac, bare = k === 'couro' || k === 'cota';
  const ex = (shX + hx) / 2 + (view === 's' ? -1 : sx * 2.2), ey = (shY + hy) / 2 + 1.2;
  if (view === 's' && !near) g.globalAlpha = .85;
  limb(g, shX, shY, ex, ey, 4.6 * bw, bare && k === 'couro' ? st.skin : sleeve, bare && k === 'couro' ? st.skinSh : shade(sleeve, -.3));
  limb(g, ex, ey, hx, hy, 4.1 * bw, k === 'placas' ? '#aab0bc' : k === 'samurai' ? shade(st.ac, -.3) : k === 'runica' ? st.acHi : st.skin, st.skinSh);
  if (k === 'placas' || k === 'samurai' || k === 'escamas') { g.strokeStyle = st.tr; g.lineWidth = 1.2; g.beginPath(); g.moveTo(ex - 2.2, ey); g.lineTo(ex + 2.2, ey); g.stroke(); }
  g.fillStyle = k === 'placas' || k === 'samurai' ? '#2a2420' : st.skin; g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = .9; g.beginPath(); g.arc(hx, hy, 2.5, 0, TAU); g.fill(); g.stroke();
  g.globalAlpha = 1; return { x: hx, y: hy };
}
