/* ---- orelhas de raposa (kitsune) ---- */
function hFoxEars(g, st, view, A) {
  if (st.race !== 'kitsune' || view === 'b' && false) return; const hy = -39, tw = Math.sin(A.t * 3 + (A.seed || 0)) * .12 + (A.exp === 1 ? -.18 : 0);
  const sides = view === 's' ? [1] : [-1, 1];
  for (const sd of sides) { g.save(); g.translate(view === 's' ? -1.4 : sd * 4.8, hy - 6.6); g.rotate(sd * (.22 + tw)); g.fillStyle = st.skin === '#eeeef4' ? '#e6e6ee' : shade(st.skin, -.06); g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-3, 1); g.quadraticCurveTo(-3.6, -8, 0, -13); g.quadraticCurveTo(3.8, -8, 3.2, 1); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#f2a0b0'; g.beginPath(); g.moveTo(-1.6, 0); g.quadraticCurveTo(-1.8, -6, 0, -9.4); g.quadraticCurveTo(1.8, -6, 1.6, 0); g.closePath(); g.fill(); g.fillStyle = '#2a2024'; g.beginPath(); g.moveTo(-1, -10); g.lineTo(0, -13); g.lineTo(1.1, -10); g.fill(); g.restore(); }
}
/* ============================================================
   ARMAS — desenhadas no referencial da mão: +x = direção da arma
   ============================================================ */
function hWeapon(g, st, kind, A, hand) {
  const gl = st.glow, tr = st.tr, steel = '#c4cad6', steelDk = '#7a8294', wood = '#7a5230', woodDk = '#4a3018', t = A.t;
  g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = 'rgba(6,6,12,.7)'; g.lineWidth = 1;
  const blade = (x0, L, w, col, tip) => { g.fillStyle = grad(g, 0, -w, 0, w, ['#f4f8ff', col, steelDk]); g.beginPath(); g.moveTo(x0, -w); g.lineTo(x0 + L - (tip || w * 2), -w); g.lineTo(x0 + L, 0); g.lineTo(x0 + L - (tip || w * 2), w); g.lineTo(x0, w); g.closePath(); g.fill(); g.stroke(); g.strokeStyle = 'rgba(80,90,110,.7)'; g.lineWidth = .8; g.beginPath(); g.moveTo(x0 + 1, 0); g.lineTo(x0 + L - 3, 0); g.stroke(); g.strokeStyle = 'rgba(6,6,12,.7)'; g.lineWidth = 1; };
  const grip = (x0, x1) => { g.fillStyle = woodDk; g.fillRect(x0, -1.5, x1 - x0, 3); g.strokeStyle = 'rgba(200,170,120,.5)'; g.lineWidth = .7; for (let x = x0 + 1; x < x1; x += 2) { g.beginPath(); g.moveTo(x, -1.4); g.lineTo(x + 1, 1.4); g.stroke(); } g.strokeStyle = 'rgba(6,6,12,.7)'; g.lineWidth = 1; };
  const glowOrb = (x, y, r, col) => { glowDot(g, x, y, r * 2.6, alpha(col, .45)); g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.arc(x - r * .3, y - r * .3, r * .35, 0, TAU); g.fill(); };
  const swing = A.atkP != null && A.atkP > 0 ? Math.sin(A.atkP * Math.PI) : 0;
  switch (kind) {
    case 'sword': grip(-5, 3); g.fillStyle = tr; g.beginPath(); g.arc(-6, 0, 2.2, 0, TAU); g.fill(); g.stroke(); g.fillRect(2.6, -5.2, 2.4, 10.4); g.strokeRect(2.6, -5.2, 2.4, 10.4); blade(5, 23, 2.4, steel, 5); if (swing) { g.shadowColor = gl; g.shadowBlur = 8; g.strokeStyle = alpha(gl.length === 7 ? gl : '#9fe8ff', .7); g.lineWidth = 1; g.beginPath(); g.moveTo(6, -2.4); g.lineTo(27, 0); g.stroke(); g.shadowBlur = 0; } break;
    case 'katana': { grip(-8, 3); g.fillStyle = '#c8302a'; for (let x = -8; x < 3; x += 3) g.fillRect(x, -1.6, 1.4, 3.2); g.fillStyle = '#d4a840'; g.beginPath(); g.ellipse(4, 0, 1.4, 4.6, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = grad(g, 0, -3, 0, 3, ['#f4f8ff', steel, steelDk]); g.beginPath(); g.moveTo(5, -1.8); g.quadraticCurveTo(18, -4.4, 31, -2.8); g.lineTo(34, -1.6); g.quadraticCurveTo(20, 1.6, 5, 1.6); g.closePath(); g.fill(); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.65)'; g.lineWidth = .7; g.beginPath(); g.moveTo(8, 0); g.quadraticCurveTo(20, -2, 31, -1.8); g.stroke(); break; }
    case 'axe': g.fillStyle = wood; g.fillRect(-6, -1.6, 27, 3.2); g.strokeRect(-6, -1.6, 27, 3.2); g.fillStyle = grad(g, 0, -9, 0, 9, [steelDk, steel, '#f4f8ff', steel, steelDk]); g.beginPath(); g.moveTo(16, -2); g.quadraticCurveTo(15, -11, 24, -11.4); g.quadraticCurveTo(27, -5, 22, 0); g.quadraticCurveTo(27, 5, 24, 11.4); g.quadraticCurveTo(15, 11, 16, 2); g.closePath(); g.fill(); g.stroke(); g.fillStyle = tr; g.fillRect(14, -2.4, 3, 4.8); break;
    case 'spear': g.fillStyle = wood; g.fillRect(-14, -1.4, 40, 2.8); g.strokeRect(-14, -1.4, 40, 2.8); g.fillStyle = steelDk; g.fillRect(24, -2.4, 3, 4.8); g.fillStyle = grad(g, 0, -4, 0, 4, ['#f4f8ff', steel, steelDk]); g.beginPath(); g.moveTo(26, -4.4); g.quadraticCurveTo(33, -3.4, 41, 0); g.quadraticCurveTo(33, 3.4, 26, 4.4); g.quadraticCurveTo(29, 0, 26, -4.4); g.fill(); g.stroke(); g.fillStyle = '#c8302a'; g.beginPath(); g.moveTo(24, 0); g.quadraticCurveTo(21, 4 + Math.sin(t * 5) * 1.4, 17, 5 + Math.sin(t * 5 + 1) * 1.4); g.lineTo(21, 0); g.fill(); break;
    case 'staff': case 'moon': case 'totem': g.fillStyle = wood; g.fillRect(-12, -1.6, 38, 3.2); g.strokeRect(-12, -1.6, 38, 3.2);
      if (kind === 'staff') { g.strokeStyle = tr; g.lineWidth = 2.2; g.beginPath(); g.arc(30, 0, 4.4, Math.PI * .6, Math.PI * 2.4); g.stroke(); glowOrb(30, 0, 2.8, gl); }
      else if (kind === 'moon') { g.fillStyle = '#e8e4ff'; g.beginPath(); g.arc(30, 0, 6.4, -Math.PI / 2 - .2, Math.PI / 2 + .2); g.arc(33, 0, 5, Math.PI / 2 + .3, -Math.PI / 2 - .3, true); g.closePath(); g.shadowColor = gl; g.shadowBlur = 8; g.fill(); g.shadowBlur = 0; g.stroke(); glowOrb(32, 0, 1.6, gl); }
      else { g.fillStyle = wood; g.beginPath(); g.roundRect(22, -4.6, 8, 9.2, 2); g.fill(); g.stroke(); g.fillStyle = '#1a1008'; g.fillRect(24, -2.4, 1.6, 1.6); g.fillRect(24, 1, 1.6, 1.6); g.fillRect(27, -.8, 1.8, 1.6); g.fillStyle = '#4aa84a'; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(30 + i * 1.4, -5 + i * 5, 4, 1.6, i * .5 - .4, 0, TAU); g.fill(); } glowOrb(33, 0, 2.2, gl); } break;
    case 'tome': g.save(); g.rotate(.2); g.fillStyle = '#4a2a6a'; g.beginPath(); g.roundRect(0, -8, 13, 16, 1.5); g.fill(); g.stroke(); g.fillStyle = '#efe6cc'; g.fillRect(1.4, -7, 10.6, 14); g.strokeStyle = '#4a2a6a'; g.lineWidth = .8; g.beginPath(); g.moveTo(6.7, -7); g.lineTo(6.7, 7); g.stroke(); g.strokeStyle = gl; g.shadowColor = gl; g.shadowBlur = 5; g.lineWidth = .9; g.beginPath(); g.arc(3.8, -1, 1.8, 0, TAU); g.moveTo(9.4, -3); g.lineTo(9.4, 3); g.moveTo(8, 0); g.lineTo(10.8, 0); g.stroke(); g.shadowBlur = 0; g.fillStyle = tr; g.fillRect(-.6, -8, 1.6, 16); g.restore(); for (let i = 0; i < 4; i++) { const a = t * 2 + i * 1.6; g.fillStyle = alpha(gl.length === 7 ? gl : '#9fe8ff', .8); g.beginPath(); g.arc(7 + Math.cos(a) * 9, Math.sin(a) * 9 - 2, 1, 0, TAU); g.fill(); } break;
    case 'wand': g.fillStyle = woodDk; g.fillRect(-4, -1.2, 18, 2.4); g.stroke(); g.fillStyle = tr; g.fillRect(-4, -1.8, 4, 3.6); g.fillStyle = gl; g.shadowColor = gl; g.shadowBlur = 8; g.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5, a2 = a + TAU / 10; g.lineTo(18 + Math.cos(a) * 4.6, Math.sin(a) * 4.6); g.lineTo(18 + Math.cos(a2) * 1.8, Math.sin(a2) * 1.8); } g.closePath(); g.fill(); g.shadowBlur = 0; g.stroke(); break;
    case 'orb': { const fy = Math.sin(t * 2.4) * 1.6; glowDot(g, 12, fy, 22, alpha(gl.length === 7 ? gl : '#9fe8ff', .35)); g.fillStyle = grad(g, 6, fy - 7, 18, fy + 7, ['#ffffff', gl, shade(gl, -.5)]); g.beginPath(); g.arc(12, fy, 6.4, 0, TAU); g.fill(); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1; g.beginPath(); g.arc(12, fy, 3.6, t * 3, t * 3 + 2.4); g.stroke(); g.strokeStyle = tr; g.lineWidth = 1.2; g.beginPath(); g.ellipse(12, fy, 10, 3.2, t * 1.6, 0, TAU); g.stroke(); break; }
    case 'bow': { const pull = A.draw || 0; g.strokeStyle = '#2a1a0c'; g.lineWidth = 3.4; g.beginPath(); g.moveTo(1, -15); g.quadraticCurveTo(10 - pull * 2, 0, 1, 15); g.stroke(); g.strokeStyle = '#a8703a'; g.lineWidth = 2.2; g.stroke(); g.strokeStyle = '#efe6cc'; g.lineWidth = .9; g.beginPath(); g.moveTo(1, -15); g.lineTo(-pull * 7, 0); g.lineTo(1, 15); g.stroke(); g.fillStyle = tr; g.fillRect(3, -2, 3, 4); if (pull > .05 || A.nock) { g.strokeStyle = '#7a5230'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-pull * 7, 0); g.lineTo(16, 0); g.stroke(); g.fillStyle = '#e8e8f0'; g.beginPath(); g.moveTo(16, -1.6); g.lineTo(20, 0); g.lineTo(16, 1.6); g.fill(); g.fillStyle = '#c8302a'; g.fillRect(-pull * 7, -1.4, 3, 2.8); } break; }
    case 'crossbow': g.fillStyle = woodDk; g.beginPath(); g.roundRect(-8, -2.4, 24, 4.8, 1.6); g.fill(); g.stroke(); g.strokeStyle = '#3a3a44'; g.lineWidth = 3; g.beginPath(); g.moveTo(10, -11); g.quadraticCurveTo(15, 0, 10, 11); g.stroke(); g.strokeStyle = '#efe6cc'; g.lineWidth = .8; g.beginPath(); g.moveTo(10, -11); g.lineTo(6 - (A.draw || 0) * 2, 0); g.lineTo(10, 11); g.stroke(); g.fillStyle = tr; g.fillRect(-2, -3, 3, 6); g.fillStyle = steel; g.beginPath(); g.moveTo(8, -1); g.lineTo(21, 0); g.lineTo(8, 1); g.fill(); break;
    case 'hammer': g.fillStyle = wood; g.fillRect(-8, -1.8, 28, 3.6); g.strokeRect(-8, -1.8, 28, 3.6); g.fillStyle = grad(g, 0, -8, 0, 8, [steelDk, steel, '#f4f8ff', steel, steelDk]); g.beginPath(); g.roundRect(17, -8.4, 13, 16.8, 2); g.fill(); g.stroke(); g.fillStyle = tr; g.fillRect(17, -8.4, 2.6, 16.8); g.fillRect(27.4, -8.4, 2.6, 16.8); g.strokeStyle = gl; g.shadowColor = gl; g.shadowBlur = 6; g.lineWidth = 1; g.beginPath(); g.arc(23.5, 0, 2.6, 0, TAU); g.moveTo(23.5, -4); g.lineTo(23.5, 4); g.stroke(); g.shadowBlur = 0; break;
    case 'mace': g.fillStyle = wood; g.fillRect(-8, -1.6, 24, 3.2); g.strokeRect(-8, -1.6, 24, 3.2); g.fillStyle = grad(g, 0, -7, 0, 7, [steelDk, steel, '#f4f8ff', steel, steelDk]); g.beginPath(); g.arc(21, 0, 6.4, 0, TAU); g.fill(); g.stroke(); g.fillStyle = steel; for (let i = 0; i < 8; i++) { const a = i * TAU / 8; g.save(); g.translate(21 + Math.cos(a) * 6, Math.sin(a) * 6); g.rotate(a); g.beginPath(); g.moveTo(0, -2); g.lineTo(5, 0); g.lineTo(0, 2); g.fill(); g.stroke(); g.restore(); } g.fillStyle = gl; g.beginPath(); g.arc(21, 0, 1.8, 0, TAU); g.fill(); break;
    case 'scythe': g.fillStyle = wood; g.fillRect(-12, -1.5, 36, 3); g.strokeRect(-12, -1.5, 36, 3); g.strokeStyle = '#3a7a3a'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-8, -1.5); g.bezierCurveTo(-4, -5, 4, 3, 10, -1.5); g.stroke(); g.fillStyle = grad(g, 0, -12, 0, 2, ['#d8f4c8', '#7ac060', '#3a7a3a']); g.beginPath(); g.moveTo(22, -1.5); g.bezierCurveTo(30, -4, 32, -14, 20, -19); g.bezierCurveTo(28, -12, 24, -6, 20, -1); g.closePath(); g.fill(); g.stroke(); g.shadowColor = '#8fe28b'; g.shadowBlur = 6; g.strokeStyle = 'rgba(200,255,190,.7)'; g.lineWidth = .8; g.beginPath(); g.moveTo(22, -3); g.bezierCurveTo(28, -6, 28, -13, 21, -17); g.stroke(); g.shadowBlur = 0; break;
    case 'daggers': case 'katars': case 'kunai': { const L = kind === 'daggers' ? 13 : kind === 'katars' ? 11 : 9; g.fillStyle = woodDk; g.fillRect(-4, -1.4, 7, 2.8); g.stroke(); g.fillStyle = tr; g.fillRect(2.6, -3.4, 2, 6.8);
      if (kind === 'katars') { g.strokeStyle = steelDk; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-3, -4); g.lineTo(3, -4); g.moveTo(-3, 4); g.lineTo(3, 4); g.stroke(); }
      g.fillStyle = grad(g, 0, -2, 0, 2, ['#f4f8ff', steel, '#4a4a60']); g.beginPath(); g.moveTo(5, -2.2); g.lineTo(5 + L - 3, -1.8); g.lineTo(5 + L, 0); g.lineTo(5 + L - 3, 1.8); g.lineTo(5, 2.2); g.closePath(); g.fill(); g.stroke(); if (kind === 'kunai') { g.strokeStyle = '#5ae65a'; g.lineWidth = .9; g.shadowColor = '#5ae65a'; g.shadowBlur = 4; g.beginPath(); g.moveTo(6, 0); g.lineTo(5 + L - 2, 0); g.stroke(); g.shadowBlur = 0; g.strokeStyle = '#c8302a'; g.lineWidth = 1.6; g.beginPath(); g.arc(-5, 0, 2.2, 0, TAU); g.stroke(); } break; }
    default: break;
  }
}
const DUAL_WEAPONS = new Set(['daggers', 'katars', 'kunai']);
/* ============================================================
   FIGURA COMPLETA
   o: aparência. A: animação {t, ph, mv, view, flip, wa, atkP, hold, exp, draw, seed}
   ============================================================ */
function drawHumanoid(g, o, A) {
  const st = hStyle(o), view = A.view || 'f', flip = A.flip ? -1 : 1, bob = -Math.abs(Math.sin(A.ph)) * 1.3 * A.mv;
  g.save(); g.scale(st.sw * flip, st.sh); g.translate(0, bob);
  let wa = A.wa; if (wa != null && flip < 0) wa = Math.PI - wa; const A2 = Object.assign({}, A, { wa });
  hAura(g, st, A);
  const wk = st.weapon === 'nenhuma' ? 'none' : (WEAPONS[st.weapon] || WEAPONS.espada).kind, restAng = HAND_REST[wk] != null ? HAND_REST[wk] : -1.1;
  const weaponAt = (hand, ang, second) => { g.save(); g.translate(hand.x, hand.y); g.rotate(ang); hWeapon(g, st, second ? wk : wk, A2, hand); g.restore(); };
  if (view === 'f') {
    hTail(g, st, view, A); hCape(g, st, view, A, false); hHairBack(g, st, view, A);
    hLegs(g, st, view, A); hTorso(g, st, view, A);
    const hf = hArm(g, st, view, A2, false);
    if (DUAL_WEAPONS.has(wk)) weaponAt(hf, A.wa != null ? Math.PI - (wa != null ? wa : 0) + .4 : Math.PI - restAng - .5, true);
    hShoulders(g, st, view); hCape(g, st, view, A, true);
    hHead(g, st, view, A); hMark(g, st, view); hHairFront(g, st, view, A); hBeard(g, st, view, A); hFoxEars(g, st, view, A); hHeadgear(g, st, view, A);
    const h = hArm(g, st, view, A2, true); weaponAt(h, wa != null ? wa : restAng, false); g.fillStyle = st.skin;
  } else if (view === 'b') {
    const h = { x: 10.2 * st.bw, y: -16 }; hTail(g, st, view, A);
    if (wa == null) { const sh = hArm(g, st, view, A2, true); g.save(); g.translate(sh.x, sh.y); g.rotate(restAng); hWeapon(g, st, wk, A2, sh); g.restore(); }
    hLegs(g, st, view, A); hTorso(g, st, view, A); hArm(g, st, view, A2, false); if (wa != null) { const hh = hArm(g, st, view, A2, true); weaponAt(hh, wa, false); } else hArm(g, st, view, A2, true);
    hShoulders(g, st, view); hCape(g, st, view, A, false); hHead(g, st, view, A); hHairFront(g, st, view, A); hHairBack(g, st, view, A); hFoxEars(g, st, view, A); hHeadgear(g, st, view, A);
  } else {
    hTail(g, st, view, A); hCape(g, st, view, A, false); hHairBack(g, st, view, A);
    const hf = hArm(g, st, view, A2, false); if (DUAL_WEAPONS.has(wk)) weaponAt(hf, A.wa != null ? (wa != null ? wa - .9 : 0) : restAng + .9, true);
    hLegs(g, st, view, A); hTorso(g, st, view, A);
    const h = hArm(g, st, view, A2, true); weaponAt(h, wa != null ? wa : restAng + .55, false); hShoulders(g, st, view);
    hHead(g, st, view, A); hMark(g, st, view); hHairFront(g, st, view, A); hBeard(g, st, view, A); hFoxEars(g, st, view, A); hHeadgear(g, st, view, A);
  }
  g.restore();
}
/* escolhe vista e espelhamento a partir do ângulo de direção (radianos) */
function viewFromAngle(a, prev) {
  const s = Math.sin(a), c = Math.cos(a);
  if (s > .62) return { view: 'f', flip: false }; if (s < -.62) return { view: 'b', flip: false };
  return { view: 's', flip: c < 0 };
}
