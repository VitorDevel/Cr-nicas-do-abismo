/* Character renderer based on the supplied character sheets and the project's detailed canvas art. */
(function(global){
'use strict';
const TAU=Math.PI*2, clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), mix=(a,b,t)=>a+(b-a)*t;
function hexToRgb(h){if(!h)return[128,128,128];if(h[0]==='#')h=h.slice(1);if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h.slice(0,6),16);return[(n>>16)&255,(n>>8)&255,n&255]}
const rgbStr=(r,g,b,a=1)=>a>=1?`rgb(${r|0},${g|0},${b|0})`:`rgba(${r|0},${g|0},${b|0},${a})`;
function shade(hex,amt){const [r,g,b]=hexToRgb(hex);const f=v=>clamp(Math.round(amt>=0?v+(255-v)*amt:v*(1+amt)),0,255);return rgbStr(f(r),f(g),f(b))}
function alpha(hex,a){const [r,g,b]=hexToRgb(hex);return `rgba(${r},${g},${b},${a})`}
function mixHex(a,b,t){const A=hexToRgb(a),B=hexToRgb(b);return rgbStr(mix(A[0],B[0],t),mix(A[1],B[1],t),mix(A[2],B[2],t))}
function circ(g,x,y,r){g.beginPath();g.arc(x,y,r,0,TAU);g.fill()}
function grad(g,x0,y0,x1,y1,stops){const gr=g.createLinearGradient(x0,y0,x1,y1);stops.forEach((c,i)=>gr.addColorStop(i/(stops.length-1),c));return gr}
function glowDot(g,x,y,r,col){const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,col);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,TAU);g.fill()}
const RACES = {
  humano: { n: 'Humano', d: 'Versátil e determinado. +10% de XP.', hp: 1, sp: 1, fo: 1, dm: 1, xp: 1.1, scale: [1, 1], skin: ['#f6dcc3', '#e8c4a2', '#c99a74', '#9a6a46', '#6e4630'] },
  elfo: { n: 'Elfo', d: 'Ágil e arcano. +8% velocidade, +20% mana, −10% vida.', hp: .9, sp: 1.08, fo: 1.2, dm: 1, xp: 1, scale: [.94, 1.06], skin: ['#f6e8d6', '#e6d2b8', '#d4e6c8', '#c3cfe8', '#a8b4cf'] },
  anao: { n: 'Anão', d: 'Robusto e teimoso. +22% vida, +5% dano, −6% velocidade.', hp: 1.22, sp: .94, fo: 1, dm: 1.05, xp: 1, scale: [1.12, .88], skin: ['#e6bf9a', '#cf9f76', '#a8683f', '#7a4a2e', '#5c3a26'] },
  orc: { n: 'Orc', d: 'Brutal. +14% dano, −12% mana.', hp: 1.1, sp: 1, fo: .88, dm: 1.14, xp: 1, scale: [1.16, 1.06], skin: ['#7fae5a', '#5f9150', '#8fa070', '#6a8a9a', '#a0b05a'] },
  tiefling: { n: 'Tiefling', d: 'Sangue infernal. +15% mana, +8% dano, −8% vida.', hp: .92, sp: 1, fo: 1.15, dm: 1.08, xp: 1, scale: [1, 1.07], skin: ['#c4505a', '#8b4a91', '#d77f6a', '#6a617f', '#4a7a9a'] },
  minotauro: { n: 'Minotauro', d: 'Força taurina. +30% vida, +10% dano, −12% velocidade.', hp: 1.3, sp: .88, fo: .88, dm: 1.1, xp: 1, scale: [1.28, 1.14], skin: ['#ae8464', '#644737', '#c6a088', '#8d6764', '#3a2c28'] },
  kitsune: { n: 'Kitsune', d: 'Espírito-raposa. +12% velocidade, +18% mana, −12% vida.', hp: .88, sp: 1.12, fo: 1.18, dm: 1, xp: 1.04, scale: [.96, 1.04], skin: ['#f4e2cd', '#e8c9a8', '#d9b48a', '#c98a5a', '#eeeef4'] },
  draconato: { n: 'Draconato', d: 'Escamas duras. +12% vida, +8% dano, resiste ao fogo.', hp: 1.12, sp: .98, fo: 1, dm: 1.08, xp: 1, scale: [1.12, 1.1], skin: ['#b8503c', '#4f8a5f', '#3f6fb0', '#b89a3c', '#6a5a8a'] }
};
const WEAPONS = {
  espada: { n: 'Espada Longa', cls: 'guerreiro', dmg: 1, rate: 1, range: 1, kind: 'sword' },
  machado: { n: 'Machado de Guerra', cls: 'guerreiro', dmg: 1.22, rate: .82, range: 1.06, kind: 'axe' },
  machado_duplo: { n: 'Machado Duplo', cls: 'guerreiro', dmg: 1.3, rate: .74, range: 1.12, kind: 'axe' },
  machado_gancho: { n: 'Machado Gancho', cls: 'guerreiro', dmg: 1.16, rate: .9, range: 1.18, kind: 'axe' },
  lanca: { n: 'Lança do Sentinela', cls: 'guerreiro', dmg: .94, rate: 1.06, range: 1.3, kind: 'spear' },
  katana: { n: 'Katana Oni', cls: 'guerreiro', dmg: 1.08, rate: 1.1, range: 1.05, kind: 'katana' },
  montante: { n: 'Montante Runico', cls: 'guerreiro', dmg: 1.28, rate: .78, range: 1.2, kind: 'sword' },
  cajado: { n: 'Cajado Arcano', cls: 'mago', dmg: 1.06, rate: .96, range: 1.18, kind: 'staff' },
  grimorio: { n: 'Grimório Astral', cls: 'mago', dmg: 1.2, rate: .84, range: 1.08, kind: 'tome' },
  varinha: { n: 'Varinha Prismática', cls: 'mago', dmg: .88, rate: 1.2, range: .96, kind: 'wand' },
  orbe: { n: 'Orbe Flutuante', cls: 'mago', dmg: 1.1, rate: 1, range: 1.1, kind: 'orb' },
  cetro: { n: 'Cetro do Eclipse', cls: 'mago', dmg: 1.16, rate: .9, range: 1.2, kind: 'staff' },
  arco: { n: 'Arco Longo', cls: 'arqueiro', dmg: 1.12, rate: .94, range: 1.24, kind: 'bow' },
  besta: { n: 'Besta Repetidora', cls: 'arqueiro', dmg: 1.28, rate: .76, range: 1.12, kind: 'crossbow' },
  arcocurto: { n: 'Arco do Caçador', cls: 'arqueiro', dmg: .92, rate: 1.2, range: 1, kind: 'bow' },
  arco_runico: { n: 'Arco RÃºnico', cls: 'arqueiro', dmg: 1.18, rate: .88, range: 1.3, kind: 'bow' },
  besta_pesada: { n: 'Besta Pesada', cls: 'arqueiro', dmg: 1.42, rate: .64, range: 1.16, kind: 'crossbow' },
  martelo: { n: 'Martelo Sagrado', cls: 'paladino', dmg: 1.16, rate: .92, range: 1.12, kind: 'hammer' },
  maca: { n: 'Maça do Juramento', cls: 'paladino', dmg: 1.32, rate: .78, range: .98, kind: 'mace' },
  espadaluz: { n: 'Espada de Luz', cls: 'paladino', dmg: 1.05, rate: 1.05, range: 1.1, kind: 'sword' },
  mangual: { n: 'Mangual Sagrado', cls: 'paladino', dmg: 1.28, rate: .8, range: 1.16, kind: 'mace' },
  totem: { n: 'Totem Vivo', cls: 'druida', dmg: 1.02, rate: 1, range: 1.2, kind: 'totem' },
  ramo_ancestral: { n: 'Ramo Ancestral', cls: 'druida', dmg: 1.08, rate: .98, range: 1.28, kind: 'staff' },
  luaclara: { n: 'Cajado da Lua', cls: 'druida', dmg: 1.18, rate: .88, range: 1.1, kind: 'moon' },
  foice: { n: 'Foice de Cipó', cls: 'druida', dmg: 1.1, rate: .95, range: 1.15, kind: 'scythe' },
  adagas: { n: 'Adagas Gêmeas', cls: 'assassino', dmg: 1, rate: 1.08, range: .92, kind: 'daggers' },
  garras: { n: 'Garras da Sombra', cls: 'assassino', dmg: 1.12, rate: 1, range: 1.08, kind: 'katars' },
  katars: { n: 'Katars Sombrios', cls: 'assassino', dmg: 1.16, rate: .92, range: 1.04, kind: 'katars' },
  kunai: { n: 'Kunais Venenosos', cls: 'assassino', dmg: .94, rate: 1.18, range: 1, kind: 'kunai' },
  hidden_blade: { n: 'Lâmina Oculta', cls: 'assassino', dmg: 1.08, rate: 1.14, range: .98, kind: 'hiddenblade' }
};
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
const HAND_REST = { sword: -1.15, katana: -1.1, axe: -1.2, spear: -1.45, staff: -1.5, tome: -.6, wand: -1.0, orb: -1.2, bow: -1.57, crossbow: -.4, hammer: -1.2, mace: -1.1, totem: -1.5, moon: -1.5, scythe: -1.35, daggers: -.9, katars: -.5, kunai: -.8, hiddenblade: -.15 };
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
    const p = ph + i * Math.PI, sw = Math.sin(p), lift = Math.max(0, sw) * 5.2 * mv;
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
  // Construction details keep the armor from reading as a flat block of color.
  if (view !== 'b' && k !== 'runica') {
    g.fillStyle = st.trHi; g.strokeStyle = 'rgba(10,10,16,.55)'; g.lineWidth = .55;
    for (const x of [-sW * .62, sW * .62]) { g.beginPath(); g.arc(x, bot - 5.2, .9, 0, TAU); g.fill(); g.stroke(); }
    if (k === 'placas' || k === 'samurai') { g.strokeStyle = st.tr; g.lineWidth = .7; g.beginPath(); g.moveTo(-wW * .7, top + 4); g.lineTo(-wW * .42, bot - 4); g.moveTo(wW * .7, top + 4); g.lineTo(wW * .42, bot - 4); g.stroke(); }
  }
  g.fillStyle = 'rgba(0,0,0,.14)'; if (view === 's') g.fillRect(-sW * .1, top, sW * 1.1, bot - top + 1); else g.fillRect(sW * .45, top + 1, sW * .55, bot - top);
  if (view === 'f' && k !== 'placas') { g.fillStyle = st.skinSh; g.beginPath(); g.moveTo(-2.2, top + .5); g.quadraticCurveTo(0, top + 4.4, 2.2, top + .5); g.fill(); }
  g.restore();
}
/* ---- braços: retorna posição da mão que segura a arma ---- */
function hAccents(g, st, view, A) {
  if (view === 'b') return;
  const bw = st.bw, sway = Math.sin(A.t * 2.2 + (A.seed || 0)) * .35;
  g.save();
  g.strokeStyle = st.tr; g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(-7.2 * bw, -16.8); g.quadraticCurveTo(sway, -14.4, 7.2 * bw, -16.8); g.stroke();
  g.fillStyle = st.trHi; g.beginPath(); g.roundRect(-2.1, -18.2, 4.2, 3.4, .7); g.fill();
  for (const side of [-1, 1]) { g.fillStyle = st.acDk; g.beginPath(); g.roundRect(side * (7.2 * bw) - 2.2, -15.4, 4.4, 4.8, 1); g.fill(); g.strokeStyle = st.trSh; g.lineWidth = .7; g.stroke(); }
  if (st.armor === 'placas' || st.armor === 'samurai') { g.strokeStyle = st.trHi; g.lineWidth = .75; g.beginPath(); g.moveTo(-6 * bw, -27); g.lineTo(-3.5 * bw, -21); g.moveTo(6 * bw, -27); g.lineTo(3.5 * bw, -21); g.stroke(); }
  g.restore();
}
function hArm(g, st, view, A, near) {
  const bw = st.bw, k = st.armor, sx = view === 's' ? 0 : (near ? 1 : -1), shY = -29.2, shX = view === 's' ? (near ? 1 : -1) * 1.0 : sx * (8.6 * bw + 1);
  let hx, hy;
  const sw = Math.sin(A.ph + (near ? Math.PI : 0)) * A.mv + Math.sin(A.t * 2.1 + (near ? 1.4 : 0)) * .55;
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

/* ---- cabeça e rosto ---- */
function hEye(g, st, x, y, s, A, side) {
  if (A.exp === 2) { g.strokeStyle = '#1a0e0a'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - 1.8 * s, y - .6); g.lineTo(x + 1.8 * s, y + .6); g.moveTo(x - 1.8 * s, y + .6); g.lineTo(x + 1.8 * s, y - .6); g.stroke(); return; }
  const slit = st.race === 'draconato' || st.race === 'kitsune', blink = (Math.sin(A.t * .9 + (A.seed || 0)) > .985) ? .25 : 1, big = st.race === 'elfo' ? 1.12 : 1;
  g.fillStyle = '#f6f2ea'; g.beginPath(); g.ellipse(x, y, 2.1 * s * big, 1.7 * s * big * blink, 0, 0, TAU); g.fill();
  g.fillStyle = st.eye; g.beginPath(); g.ellipse(x + (side || 0) * .25, y + .1, 1.35 * s * big, 1.45 * s * big * blink, 0, 0, TAU); g.fill();
  if (st.race === 'tiefling' || st.race === 'kitsune') { g.shadowColor = st.eye; g.shadowBlur = 3; g.fill(); g.shadowBlur = 0; }
  g.fillStyle = '#10080a'; g.beginPath(); if (slit) g.ellipse(x + (side || 0) * .25, y + .1, .45 * s, 1.3 * s * blink, 0, 0, TAU); else g.ellipse(x + (side || 0) * .25, y + .1, .7 * s, .8 * s * blink, 0, 0, TAU); g.fill();
  g.fillStyle = '#fff'; g.fillRect(x - .2 * s + (side || 0) * .1, y - .9 * s * blink, .8 * s, .7 * s * blink);
  g.strokeStyle = 'rgba(20,10,10,.65)'; g.lineWidth = .8; g.beginPath(); g.arc(x, y + .1, 2.1 * s * big, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
}
function hHead(g, st, view, A) {
  const r = st.race, hy = -39; let rx = 7.6, ry = 8;
  if (r === 'elfo') { rx = 7; ry = 8.4; } else if (r === 'anao') { rx = 8.4; ry = 7.6; } else if (r === 'orc') { rx = 8.4; ry = 8; } else if (r === 'minotauro') { rx = 8.2; ry = 8.6; } else if (r === 'draconato') { rx = 7.6; ry = 8.2; }
  const side = view === 's', back = view === 'b', cx = side ? 1.2 : 0, fur = r === 'minotauro';
  // pescoço
  g.fillStyle = st.skinSh; g.fillRect(cx - 2.8, hy + 6, 5.6, 4.4);
  // chifres traseiros (draconato, minotauro, tiefling)
  const horn = (sd, base, L, curl, col, thick) => { g.save(); g.scale(side ? 1 : sd, 1); g.fillStyle = col; g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = .9; g.beginPath(); g.moveTo(base[0], base[1]); g.quadraticCurveTo(base[0] + L * .6, base[1] - L * .1, base[0] + L * .7 + curl, base[1] - L); g.quadraticCurveTo(base[0] + L * .3, base[1] - L * .4, base[0] - thick, base[1] + thick * .6); g.closePath(); g.fill(); g.stroke(); g.fillStyle = shade(col, .45); g.beginPath(); g.moveTo(base[0] + L * .7 + curl, base[1] - L); g.quadraticCurveTo(base[0] + L * .62 + curl * .8, base[1] - L * .6, base[0] + L * .45, base[1] - L * .4); g.quadraticCurveTo(base[0] + L * .62, base[1] - L * .7, base[0] + L * .7 + curl, base[1] - L); g.fill(); g.restore(); };
  if (r === 'minotauro') { const hc = '#e8dcc0'; if (side) horn(1, [-1, hy - 4], 10, 3, hc, 3); else { horn(-1, [-5.6, hy - 5], 11, 4, hc, 3); horn(1, [-5.6, hy - 5], 11, 4, hc, 3); } }
  if (r === 'tiefling') { const hc = shade(st.skin, -.5); if (side) horn(1, [-1.6, hy - 6], 11, -3, hc, 2.2); else { horn(-1, [-3.4, hy - 7], 11, 3, hc, 2.2); horn(1, [-3.4, hy - 7], 11, 3, hc, 2.2); } }
  if (r === 'draconato') { const hc = shade(st.skin, -.35); if (side) horn(-1, [-1, hy - 5], 9, 5, hc, 2.4); else { horn(-1, [-4.4, hy - 6], 9, 5, hc, 2.4); horn(1, [-4.4, hy - 6], 9, 5, hc, 2.4); } }
  // orelhas
  const ear = (sd, kind) => { g.save(); if (!side) g.scale(sd, 1); g.fillStyle = st.skin; g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = .9; const ex = side ? -1.8 : rx - .6, ey = hy + .6; g.beginPath(); if (kind === 'long') { g.moveTo(ex, ey - 1.6); g.quadraticCurveTo(ex + 7.4, ey - 5.4, ex + 11.2, ey - 7.6); g.quadraticCurveTo(ex + 6.4, ey + 1.6, ex, ey + 3.2); } else if (kind === 'point') { g.moveTo(ex, ey - 2); g.quadraticCurveTo(ex + 4, ey - 4, ex + 6.4, ey - 5); g.quadraticCurveTo(ex + 3.8, ey + .8, ex, ey + 2.4); } else if (kind === 'fin') { g.moveTo(ex, ey - 3); g.lineTo(ex + 5.4, ey - 5.4); g.lineTo(ex + 4.2, ey - 1.6); g.lineTo(ex + 6, ey + .6); g.lineTo(ex, ey + 2.6); } else if (kind === 'bull') { g.moveTo(ex, ey - 1.6); g.quadraticCurveTo(ex + 7, ey - 2.6, ex + 8, ey + 1.6); g.quadraticCurveTo(ex + 4, ey + 3, ex, ey + 2.8); } else { g.ellipse(ex + .4, ey + .6, 1.8, 2.6, 0, 0, TAU); } g.closePath(); g.fill(); g.stroke(); if (kind !== 'round') { g.fillStyle = kind === 'bull' ? '#e8a0a0' : st.skinSh; g.beginPath(); g.ellipse(ex + (kind === 'long' ? 3.6 : 2.4), ey - (kind === 'long' ? 2.4 : 1), 2, .9, -.5, 0, TAU); g.fill(); } g.restore(); };
  const earKind = { elfo: 'long', orc: 'point', tiefling: 'point', draconato: 'fin', minotauro: 'bull', humano: 'round', anao: 'round', kitsune: 'round' }[r];
  if (side) ear(1, earKind); else { ear(-1, earKind); ear(1, earKind); }
  // rosto
  g.fillStyle = grad(g, cx - rx, hy - ry, cx + rx, hy + ry, [st.skinHi, st.skin, st.skinSh]); g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 1.1; g.beginPath();
  if (side) { g.moveTo(cx - rx * .9, hy - 2); g.quadraticCurveTo(cx - rx * .9, hy - ry, cx + 1, hy - ry); g.quadraticCurveTo(cx + rx * .95, hy - ry + 1, cx + rx * .9, hy - 2); g.quadraticCurveTo(cx + rx + 1.6, hy - 1, cx + rx * .96, hy + 1); g.quadraticCurveTo(cx + rx * 1.1, hy + 2.6, cx + rx * .9, hy + 3.6); g.quadraticCurveTo(cx + rx * .8, hy + ry - 1.4, cx + 1, hy + ry); g.quadraticCurveTo(cx - rx * .85, hy + ry - 1, cx - rx * .9, hy - 2); }
  else { const jaw = r === 'orc' ? 1.08 : r === 'anao' ? 1.0 : r === 'elfo' ? .62 : .82; g.moveTo(-rx, hy - 1); g.quadraticCurveTo(-rx, hy - ry, 0, hy - ry); g.quadraticCurveTo(rx, hy - ry, rx, hy - 1); g.quadraticCurveTo(rx * jaw + .8, hy + ry - 2, rx * .42, hy + ry); g.quadraticCurveTo(0, hy + ry + 1.2, -rx * .42, hy + ry); g.quadraticCurveTo(-rx * jaw - .8, hy + ry - 2, -rx, hy - 1); }
  g.closePath(); g.fill(); g.stroke();
  if (back) { g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(0, hy, rx - .6, ry - .6, 0, 0, TAU); g.fill(); return; }
  // detalhes raciais no rosto
  if (r === 'minotauro' || r === 'draconato' || r === 'orc') {
    const mz = r === 'minotauro' ? [4.4, 3.8, 3.6] : r === 'draconato' ? [3.2, 2.6, 2.8] : [0, 0, 0]; if (mz[0]) { g.fillStyle = fur ? shade(st.skin, .2) : st.skinHi; g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = .9; g.beginPath(); g.ellipse(side ? cx + rx * .62 : 0, hy + 4.2, side ? mz[0] * 1.15 : mz[0] + 1.4, mz[1], 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#1a0a0a'; if (side) { g.beginPath(); g.ellipse(cx + rx * .62 + mz[0] * .8, hy + 3.4, .8, 1, 0, 0, TAU); g.fill(); } else { g.beginPath(); g.ellipse(-1.4, hy + 3.6, .8, 1.1, 0, 0, TAU); g.ellipse(1.4, hy + 3.6, .8, 1.1, 0, 0, TAU); g.fill(); } if (r === 'minotauro') { g.strokeStyle = '#e8c860'; g.lineWidth = 1.2; g.beginPath(); g.arc(side ? cx + rx * .62 + 3.6 : 0, hy + 6.2, 2.4, .1, Math.PI - .1); g.stroke(); if (!side) { g.strokeStyle = '#f0d47a'; g.lineWidth = .8; g.beginPath(); g.arc(0, hy + 7.1, 2.1, .15, Math.PI - .15); g.stroke(); g.fillStyle = '#28171a'; g.beginPath(); g.ellipse(-1.4, hy + 4.1, .65, .85, 0, 0, TAU); g.ellipse(1.4, hy + 4.1, .65, .85, 0, 0, TAU); g.fill(); } } }
    if (r === 'draconato') { g.fillStyle = st.skinSh; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc((side ? cx - 1 : -4.6) + (i % 3) * 3.2, hy - 5 + Math.floor(i / 3) * 3, 1.3, 0, Math.PI); g.fill(); } }
  }
  if (r === 'anao') { g.fillStyle = shade(st.skin, -.06); g.beginPath(); g.ellipse(side ? cx + rx * .95 : 0, hy + 2.4, 2.1, 1.8, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = .7; g.stroke(); }
  // olhos, sobrancelhas, boca
  const ang = A.exp === 1, eyY = hy - .6;
  if (side) { hEye(g, st, cx + 3.6, eyY, .95, A, 1); g.strokeStyle = st.hairSh; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx + 1.6, eyY - 3.2 + (ang ? 1 : 0)); g.lineTo(cx + 5.4, eyY - 3.4 + (ang ? -.4 : 0)); g.stroke(); g.fillStyle = st.skinDk; g.beginPath(); g.moveTo(cx + rx * .94, hy + .6); g.lineTo(cx + rx + 1.4, hy + 2.4); g.lineTo(cx + rx * .8, hy + 2.8); g.fill(); }
  else { const sp = r === 'elfo' ? 3.4 : r === 'anao' ? 3.4 : 3.2; hEye(g, st, -sp, eyY, 1, A, -1); hEye(g, st, sp, eyY, 1, A, 1); g.strokeStyle = r === 'anao' || r === 'orc' ? st.hairSh : st.hairSh; g.lineWidth = r === 'anao' || r === 'orc' ? 1.9 : 1.4; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * (sp - 2.4), eyY - 3 + (ang ? (sd < 0 ? -1.2 : -1.2) * -1 : 0) * 0 - (ang ? -.6 : 0)); g.lineTo(sd * (sp + 2.4), eyY - 3.4 + (ang ? 1.4 : 0)); g.stroke(); } g.fillStyle = st.skinDk; g.beginPath(); g.moveTo(-.9, hy + 1); g.lineTo(0, hy + 2.6); g.lineTo(.9, hy + 1); g.fill(); }
  const my = hy + 5.8; g.strokeStyle = '#4a1e1e'; g.lineWidth = 1.1; g.beginPath();
  if (A.exp === 1 || A.atk > 0) { g.fillStyle = '#3a0e12'; g.beginPath(); g.ellipse(side ? cx + 3.6 : 0, my, side ? 1.2 : 2.2, 1.2, 0, 0, TAU); g.fill(); } else if (side) { g.moveTo(cx + 2.4, my); g.lineTo(cx + 5, my - .2); g.stroke(); } else { g.moveTo(-2, my); g.quadraticCurveTo(0, my + 1, 2, my); g.stroke(); }
  if (r === 'orc') { g.fillStyle = '#f4efe0'; g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = .7; for (const sd of side ? [1] : [-1, 1]) { const x = side ? cx + 4.4 : sd * 3.4; g.beginPath(); g.moveTo(x - 1, my + .8); g.lineTo(x + (side ? .6 : sd * .3), my - 4); g.lineTo(x + 1.2, my + .8); g.closePath(); g.fill(); g.stroke(); } }
  if (r === 'kitsune' && !side) { g.strokeStyle = st.skinDk; g.lineWidth = .9; for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(sd * (rx - .2), hy + 2 + i * 1.5); g.lineTo(sd * (rx - 3.6), hy + 2.8 + i * 1.5 - .6); g.stroke(); } }
  g.fillStyle = 'rgba(255,120,120,.22)'; if (!side) { g.beginPath(); g.ellipse(-4.8, hy + 3.4, 1.8, 1, 0, 0, TAU); g.ellipse(4.8, hy + 3.4, 1.8, 1, 0, 0, TAU); g.fill(); }
}
/* ---- marcas faciais ---- */
function hMark(g, st, view) {
  if (st.mark === 'nenhuma' || view === 'b') return; const hy = -39, s = view === 's', x0 = s ? 3.2 : -3.2, k = st.mark;
  g.lineCap = 'round';
  if (k === 'guerra') { g.strokeStyle = 'rgba(120,40,40,.85)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x0 - 1.6, hy - 5.4); g.lineTo(x0 + 1.4, hy + 3.2); g.stroke(); g.strokeStyle = 'rgba(255,200,200,.5)'; g.lineWidth = .6; g.beginPath(); g.moveTo(x0 - 1.2, hy - 5.4); g.lineTo(x0 + 1.8, hy + 3.2); g.stroke(); g.strokeStyle = 'rgba(100,30,30,.8)'; g.lineWidth = .8; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(x0 - 2.4 + i * .9, hy - 2.4 + i * 2.4); g.lineTo(x0 + .2 + i * .9, hy - 2.4 + i * 2.4); g.stroke(); } }
  else if (k === 'antiga') { g.strokeStyle = 'rgba(160,100,90,.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(s ? 4.4 : 3.2, hy + 1); g.lineTo(s ? 6 : 5.6, hy + 4.6); g.stroke(); }
  else if (k === 'tribal') { g.strokeStyle = st.tr; g.lineWidth = 1.1; for (const sd of s ? [1] : [-1, 1]) for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(sd * (s ? 2.6 : 3.2) + (s ? 1.4 : 0), hy + 1.2 + i * 1.4); g.lineTo(sd * (s ? 6 : 6.8) + (s ? 1.4 : 0), hy + 1.2 + i * 1.4 + .7); g.stroke(); } g.fillStyle = st.tr; g.beginPath(); g.arc(s ? 2.4 : 0, hy - 6, .9, 0, TAU); g.fill(); }
  else if (k === 'runas') { g.strokeStyle = st.glow; g.lineWidth = 1; g.shadowColor = st.glow; g.shadowBlur = 5; g.beginPath(); g.moveTo(s ? 1.4 : -.8, hy - 6.6); g.lineTo(s ? 2.2 : 0, hy - 5); g.lineTo(s ? 3 : .8, hy - 6.6); g.moveTo(s ? 2.2 : 0, hy - 5); g.lineTo(s ? 2.2 : 0, hy - 3.6); g.moveTo(x0 - .4, hy + 2); g.lineTo(x0 + 1.2, hy + 4); g.lineTo(x0 + 2.4, hy + 2); g.stroke(); g.shadowBlur = 0; }
  else if (k === 'lagrima') { g.fillStyle = '#7ac8ff'; g.beginPath(); g.moveTo(x0 + (s ? .4 : 0), hy + 2); g.quadraticCurveTo(x0 - 1.2, hy + 4.2, x0 + (s ? .4 : 0), hy + 5); g.quadraticCurveTo(x0 + 1.2 + (s ? .4 : 0), hy + 4.2, x0 + (s ? .4 : 0), hy + 2); g.fill(); }
  else if (k === 'sardas') { g.fillStyle = 'rgba(140,80,50,.7)'; for (let i = 0; i < 8; i++) { const sd = i % 2 ? 1 : -1; g.beginPath(); g.arc((s ? 3.4 : sd * (1.6 + (i >> 1) * 1.3)), hy + 2 + ((i * 7) % 3) * .8, .45, 0, TAU); g.fill(); } }
}
/* ---- acessórios de cabeça ---- */
function hHeadgear(g, st, view, A) {
  const kd = st.head, hy = -39, side = view === 's', back = view === 'b', cx = side ? 1.2 : 0; if (kd === 'nenhum') return;
  g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 1;
  if (kd === 'capuz') { const col = st.capeKind === 'sem' ? st.ac : st.cape, dk = shade(col, -.35); g.fillStyle = col; g.beginPath(); g.moveTo(cx - 10.2, hy + 9); g.bezierCurveTo(cx - 12.4, hy - 6, cx - 7, hy - 14.4, cx + 1, hy - 14); g.bezierCurveTo(cx + 9, hy - 13, cx + 12.4, hy - 4, cx + 10.2, hy + 9); g.lineTo(cx + 7, hy + 6.6); g.quadraticCurveTo(cx + 8, hy - 3, cx + 3, hy - 8.4); g.quadraticCurveTo(cx - 4, hy - 8.4, cx - 7, hy - 3); g.quadraticCurveTo(cx - 8, hy + 3, cx - 7, hy + 6.6); g.closePath(); if (back || side) { g.fill(); g.stroke(); } else { g.fill(); g.stroke(); } g.fillStyle = dk; g.beginPath(); g.moveTo(cx - 7, hy - 3); g.quadraticCurveTo(cx, hy - 10.6, cx + 7, hy - 3); g.quadraticCurveTo(cx, hy - 6.6, cx - 7, hy - 3); g.fill(); g.fillStyle = 'rgba(255,255,255,.14)'; g.beginPath(); g.ellipse(cx - 4, hy - 10.4, 3.4, 1.2, -.5, 0, TAU); g.fill(); if (back) { g.fillStyle = col; g.beginPath(); g.ellipse(0, hy + 1, 9, 9.4, 0, 0, TAU); g.fill(); g.stroke(); } }
  else if (kd === 'elmo' || kd === 'cornos') { const steel = '#a8aeb8', dk = '#6a707c', hi = '#e0e4ec'; if (kd === 'cornos') for (const sd of side ? [1] : [-1, 1]) { g.save(); g.scale(sd, 1); g.fillStyle = '#efe6cc'; g.beginPath(); g.moveTo(cx + 7, hy - 4); g.quadraticCurveTo(cx + 13.4, hy - 4.6, cx + 14.4, hy - 13); g.quadraticCurveTo(cx + 10.6, hy - 8, cx + 6, hy - 7.2); g.closePath(); g.fill(); g.stroke(); g.restore(); }
    g.fillStyle = grad(g, cx - 9, 0, cx + 9, 0, [dk, steel, hi, steel, dk]); g.beginPath(); g.moveTo(cx - 8.8, hy + 2); g.bezierCurveTo(cx - 9.6, hy - 11, cx + 9.6, hy - 11, cx + 8.8, hy + 2); g.lineTo(cx + 8.4, hy + 7.4); g.lineTo(cx + 5.4, hy + 9); g.lineTo(cx + 4.6, hy + 2); g.lineTo(cx - 4.6, hy + 2); g.lineTo(cx - 5.4, hy + 9); g.lineTo(cx - 8.4, hy + 7.4); g.closePath(); if (side) { g.fillStyle = steel; g.beginPath(); g.moveTo(cx - 8.8, hy + 8); g.bezierCurveTo(cx - 9.4, hy - 11, cx + 8, hy - 11.4, cx + 8.4, hy - 2); g.lineTo(cx + 5.4, hy - 1.6); g.lineTo(cx + 5, hy + 2.4); g.lineTo(cx + 2, hy + 8.4); g.closePath(); } g.fill(); g.stroke(); g.fillStyle = st.tr; g.fillRect(cx - 8.9, hy - 2.4, 17.8, 1.8); if (!side && !back) { g.fillStyle = steel; g.fillRect(-1.2, hy - 2, 2.4, 8.2); g.strokeRect(-1.2, hy - 2, 2.4, 8.2); g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(-6.6, hy - .4, 4.2, 1.6); g.fillRect(2.4, hy - .4, 4.2, 1.6); } if (kd === 'elmo') { g.fillStyle = st.cape; g.beginPath(); g.moveTo(cx - 1.6, hy - 10.4); g.quadraticCurveTo(cx, hy - 16, cx + 1.6, hy - 10.4); g.fill(); } }
  else if (kd === 'coroa') { g.fillStyle = '#e8c040'; g.beginPath(); g.moveTo(cx - 7, hy - 5.4); g.lineTo(cx - 7.6, hy - 11); g.lineTo(cx - 3.8, hy - 8); g.lineTo(cx, hy - 12.6); g.lineTo(cx + 3.8, hy - 8); g.lineTo(cx + 7.6, hy - 11); g.lineTo(cx + 7, hy - 5.4); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#fff2a0'; g.fillRect(cx - 7, hy - 6.4, 14, 1.4); if (!back) { g.fillStyle = '#e83a5a'; g.beginPath(); g.arc(cx, hy - 7.6, 1.3, 0, TAU); g.fill(); g.fillStyle = '#4ac8ff'; g.beginPath(); g.arc(cx - 4, hy - 7, .9, 0, TAU); g.arc(cx + 4, hy - 7, .9, 0, TAU); g.fill(); } }
  else if (kd === 'chapeu') { const col = st.capeKind === 'sem' ? '#4a3a8a' : st.cape, dk = shade(col, -.35), by = hy - 5.2, sw = Math.sin(A.t * 2) * 1.2; g.fillStyle = dk; g.beginPath(); g.ellipse(cx, by + 1, 13.4, 3.6, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = col; g.beginPath(); g.moveTo(cx - 8.4, by); g.quadraticCurveTo(cx - 6, by - 13, cx - 2 + sw * .4, by - 22); g.quadraticCurveTo(cx + 3 + sw, by - 27, cx + 9 + sw * 1.6, by - 25); g.quadraticCurveTo(cx + 2 + sw, by - 21, cx + 3.4, by - 10); g.quadraticCurveTo(cx + 6, by - 4, cx + 8.4, by); g.quadraticCurveTo(cx, by + 3, cx - 8.4, by); g.closePath(); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.16)'; g.beginPath(); g.moveTo(cx - 6, by - 2); g.quadraticCurveTo(cx - 4.4, by - 12, cx - 1.6, by - 19); g.lineTo(cx - 3.6, by - 12); g.fill(); g.fillStyle = st.tr; g.fillRect(cx - 8.4, by - 3.6, 16.8, 2.2); g.fillStyle = '#f4f0c0'; g.fillRect(cx - 1.4, by - 3.6, 2.8, 2.2); if (!back) { g.fillStyle = '#fff6b0'; g.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5, a2 = a + TAU / 10; g.lineTo(cx - 1.4 + Math.cos(a) * 2.4, by - 14 + Math.sin(a) * 2.4); g.lineTo(cx - 1.4 + Math.cos(a2) * 1, by - 14 + Math.sin(a2) * 1); } g.closePath(); g.fill(); } }
  else if (kd === 'bandana') { g.fillStyle = st.cape; g.beginPath(); g.moveTo(cx - 8.2, hy - 3.6); g.quadraticCurveTo(cx, hy - 7, cx + 8.2, hy - 3.6); g.lineTo(cx + 8, hy - 1); g.quadraticCurveTo(cx, hy - 4.4, cx - 8, hy - 1); g.closePath(); g.fill(); g.stroke(); const sw = Math.sin(A.t * 4) * 1.4 + A.mv * 2; g.fillStyle = st.capeSh; for (const [dy, L] of [[0, 8], [1.6, 6]]) { g.beginPath(); g.moveTo(cx + (side ? -8 : 7), hy - 2.4 + dy); g.quadraticCurveTo(cx + (side ? -12 : 11) + sw, hy + dy + 1, cx + (side ? -8 - L : 7 + L) + sw * 1.4, hy + 5 + dy + sw * .3); g.lineTo(cx + (side ? -8 : 7), hy - .6 + dy); g.fill(); } g.fillStyle = st.tr; g.fillRect(cx - 8, hy - 3, 16, .9); }
  else if (kd === 'oni') { if (back) { g.fillStyle = '#7a1c24'; g.beginPath(); g.ellipse(0, hy + 1, 9, 9.4, 0, Math.PI, 0); g.fill(); return; } const red = '#c0202c', dk = '#6a0e18', gold = '#e8c040';
    for (const sd of side ? [1] : [-1, 1]) { g.save(); g.scale(sd, 1); g.fillStyle = '#f0e6c8'; g.beginPath(); g.moveTo(cx + 3.6, hy - 7.6); g.quadraticCurveTo(cx + 5, hy - 14, cx + 3.2, hy - 17.4); g.quadraticCurveTo(cx + 8.4, hy - 12.8, cx + 7.4, hy - 6.6); g.closePath(); g.fill(); g.stroke(); g.restore(); }
    g.fillStyle = grad(g, cx - 8, 0, cx + 8, 0, [dk, red, '#e8444e', red, dk]); g.beginPath(); if (side) { g.moveTo(cx - 6, hy - 8); g.quadraticCurveTo(cx + 9, hy - 8.4, cx + 9.2, hy + 1); g.quadraticCurveTo(cx + 9.6, hy + 8, cx + 4, hy + 9.4); g.lineTo(cx - 5, hy + 8); g.closePath(); } else { g.moveTo(-8.2, hy - 6); g.quadraticCurveTo(0, hy - 10.4, 8.2, hy - 6); g.lineTo(8.6, hy + 2); g.quadraticCurveTo(8, hy + 8.4, 3.6, hy + 9.6); g.lineTo(-3.6, hy + 9.6); g.quadraticCurveTo(-8, hy + 8.4, -8.6, hy + 2); g.closePath(); } g.fill(); g.stroke();
    g.fillStyle = '#1a0408'; if (side) { g.beginPath(); g.ellipse(cx + 3.6, hy - .8, 2.2, 1.2, .2, 0, TAU); g.fill(); g.fillStyle = '#ffe14a'; g.beginPath(); g.ellipse(cx + 3.8, hy - .8, 1.2, .7, .2, 0, TAU); g.fill(); } else { for (const sd of [-1, 1]) { g.save(); g.translate(sd * 3.6, hy - .8); g.rotate(sd * .4); g.fillStyle = '#1a0408'; g.beginPath(); g.ellipse(0, 0, 2.6, 1.3, 0, 0, TAU); g.fill(); g.fillStyle = '#ffe14a'; g.shadowColor = '#ffb020'; g.shadowBlur = 4; g.beginPath(); g.ellipse(0, 0, 1.5, .8, 0, 0, TAU); g.fill(); g.shadowBlur = 0; g.restore(); } g.strokeStyle = dk; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-7, hy - 4); g.lineTo(-1.6, hy - 2.4); g.moveTo(7, hy - 4); g.lineTo(1.6, hy - 2.4); g.stroke(); }
    g.fillStyle = '#1a0408'; g.beginPath(); if (side) g.ellipse(cx + 4, hy + 5.8, 4, 2.6, 0, 0, TAU); else g.ellipse(0, hy + 6, 5.4, 2.8, 0, 0, TAU); g.fill(); g.fillStyle = '#fff6e0'; for (let i = 0; i < (side ? 3 : 5); i++) { const x = side ? cx + 1.6 + i * 1.8 : -4 + i * 2; g.beginPath(); g.moveTo(x - .8, hy + 4.2); g.lineTo(x, hy + 6.2); g.lineTo(x + .8, hy + 4.2); g.fill(); } g.fillStyle = gold; g.beginPath(); g.arc(side ? cx + 1 : 0, hy - 7, 1.1, 0, TAU); g.fill(); }
}
/* ---- aura ---- */
function hAura(g, st, A) {
  const k = st.aura; if (k === 'nenhuma') return; const t = A.t, col = k === 'elemental' ? st.glow : k === 'fogo' ? '#ff8a3a' : k === 'estrelas' ? '#fff2a0' : '#8a50d0';
  g.save(); g.globalCompositeOperation = 'lighter'; glowDot(g, 0, -22, 30, alpha(col.startsWith('#') ? col : '#ffffff', .12));
  for (let i = 0; i < 10; i++) {
    const ph = (t * (k === 'fogo' ? .7 : .5) + i / 10) % 1, a = i * 2.4 + t * (k === 'estrelas' ? 1.2 : .6);
    if (k === 'elemental') { const rr = 17 + Math.sin(i) * 3; g.fillStyle = alpha(col, .75 * (1 - ph * .3)); g.beginPath(); g.arc(Math.cos(a) * rr, -22 + Math.sin(a) * rr * .45 + Math.sin(a) * 4, 1.2 + (i % 3) * .5, 0, TAU); g.fill(); }
    else if (k === 'fogo') { g.fillStyle = alpha(i % 2 ? '#ffd27a' : '#ff6a2a', .85 * (1 - ph)); g.beginPath(); g.arc(Math.sin(a * 1.7) * 12, -ph * 46, 1.9 * (1 - ph * .6), 0, TAU); g.fill(); }
    else if (k === 'estrelas') { const rr = 18; const x = Math.cos(a) * rr, y = -24 + Math.sin(a) * rr * .6, sz = 1.6 + Math.sin(t * 4 + i) * .8; g.fillStyle = alpha(col, .9); g.beginPath(); g.moveTo(x, y - sz * 2); g.lineTo(x + sz * .5, y - sz * .5); g.lineTo(x + sz * 2, y); g.lineTo(x + sz * .5, y + sz * .5); g.lineTo(x, y + sz * 2); g.lineTo(x - sz * .5, y + sz * .5); g.lineTo(x - sz * 2, y); g.lineTo(x - sz * .5, y - sz * .5); g.closePath(); g.fill(); }
    else { g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(${i % 2 ? '50,20,90' : '20,8,40'},${.42 * (1 - ph)})`; g.beginPath(); g.arc(Math.sin(a * 1.3) * 11, -ph * 30 - 2, 4 + ph * 4, 0, TAU); g.fill(); }
  }
  g.restore();
}

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
    case 'hiddenblade':
      g.fillStyle = '#272a33'; g.beginPath(); g.roundRect(-7, -3.2, 12, 6.4, 2); g.fill(); g.stroke();
      g.fillStyle = tr; g.fillRect(-3, -3.8, 1.5, 7.6); g.fillRect(0, -3.8, 1.5, 7.6);
      g.fillStyle = grad(g, 0, -1.5, 0, 1.5, ['#f4f8ff', steel, steelDk]);
      g.beginPath(); g.moveTo(4, -1.6); g.lineTo(19 + swing * 2, -1.1); g.lineTo(24 + swing * 3, 0); g.lineTo(19 + swing * 2, 1.1); g.lineTo(4, 1.6); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.68)'; g.lineWidth = .65; g.beginPath(); g.moveTo(7, -.5); g.lineTo(20 + swing * 2, 0); g.stroke(); break;
    case 'sword': grip(-5, 3); g.fillStyle = tr; g.beginPath(); g.arc(-6, 0, 2.2, 0, TAU); g.fill(); g.stroke(); g.fillRect(2.6, -5.2, 2.4, 10.4); g.strokeRect(2.6, -5.2, 2.4, 10.4); blade(5, 23, 2.4, steel, 5); g.strokeStyle=alpha(gl.length===7?gl:'#9fe8ff',.55);g.lineWidth=.8;g.beginPath();g.moveTo(8,-1.1);g.lineTo(24,-.4);g.stroke();g.fillStyle=tr;g.beginPath();g.arc(4,0,1.2,0,TAU);g.fill(); if (swing) { g.shadowColor = gl; g.shadowBlur = 8; g.strokeStyle = alpha(gl.length === 7 ? gl : '#9fe8ff', .7); g.lineWidth = 1; g.beginPath(); g.moveTo(6, -2.4); g.lineTo(27, 0); g.stroke(); g.shadowBlur = 0; } break;
    case 'katana': { grip(-8, 3); g.fillStyle = '#c8302a'; for (let x = -8; x < 3; x += 3) g.fillRect(x, -1.6, 1.4, 3.2); g.fillStyle = '#d4a840'; g.beginPath(); g.ellipse(4, 0, 1.4, 4.6, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = grad(g, 0, -3, 0, 3, ['#f4f8ff', steel, steelDk]); g.beginPath(); g.moveTo(5, -1.8); g.quadraticCurveTo(18, -4.4, 31, -2.8); g.lineTo(34, -1.6); g.quadraticCurveTo(20, 1.6, 5, 1.6); g.closePath(); g.fill(); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.65)'; g.lineWidth = .7; g.beginPath(); g.moveTo(8, 0); g.quadraticCurveTo(20, -2, 31, -1.8); g.stroke(); break; }
    case 'axe': {
      const doubleAxe=st.weapon==='machado_duplo', hookAxe=st.weapon==='machado_gancho';
      g.lineCap='round'; g.strokeStyle=shade(wood,-.35); g.lineWidth=4; g.beginPath(); g.moveTo(-7,0); g.lineTo(21,0); g.stroke();
      g.strokeStyle=wood; g.lineWidth=2.7; g.beginPath(); g.moveTo(-7,0); g.lineTo(21,0); g.stroke();
      const blade=(flip)=>{g.save(); if(flip)g.scale(-1,1); g.fillStyle=grad(g,0,-10,0,10,[steelDk,steel,'#f4f8ff',steel,steelDk]); g.strokeStyle=steelDk; g.lineWidth=1.2; g.beginPath(); g.moveTo(16,-2.4); g.quadraticCurveTo(15,-11,24,-11.4); g.quadraticCurveTo(28,-5,22,0); g.quadraticCurveTo(28,5,24,11.4); g.quadraticCurveTo(15,11,16,2.4); g.closePath(); g.fill(); g.stroke(); g.fillStyle=tr; g.fillRect(14,-2.7,3,5.4); g.restore();};
      blade(false);
      if(doubleAxe) blade(true);
      if(hookAxe){g.strokeStyle=steel;g.lineWidth=3;g.beginPath();g.moveTo(19,4);g.quadraticCurveTo(25,10,18,13);g.stroke();g.fillStyle=tr;circ(g,18,13,1.5);}
      g.fillStyle=tr; circ(g,21,0,1.8); break;
    }
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
  const st = hStyle(o), view = A.view || 'f', flip = A.flip ? -1 : 1, bob = -Math.abs(Math.sin(A.ph)) * 1.9 * A.mv;
  const idle = 1 - clamp(A.mv || 0, 0, 1), sway = Math.sin(A.t * 1.7 + (A.seed || 0) * .31) * (.45 * idle + .12);
  g.save(); g.scale(st.sw * flip, st.sh); g.translate(sway, bob);
  let wa = A.wa; if (wa != null && flip < 0) wa = Math.PI - wa; const A2 = Object.assign({}, A, { wa });
  hAura(g, st, A);
  const wk = st.weapon === 'nenhuma' ? 'none' : (WEAPONS[st.weapon] || WEAPONS.espada).kind, restAng = HAND_REST[wk] != null ? HAND_REST[wk] : -1.1, restPose = restAng + Math.sin(A.t * 2.2 + (A.seed || 0)) * .045 * idle;
  const weaponAt = (hand, ang, second) => { g.save(); g.translate(hand.x, hand.y); g.rotate(ang); hWeapon(g, st, second ? wk : wk, A2, hand); g.restore(); };
  if (view === 'f') {
    hTail(g, st, view, A); hCape(g, st, view, A, false); hHairBack(g, st, view, A);
    hLegs(g, st, view, A); hTorso(g, st, view, A); hAccents(g, st, view, A);
    const hf = hArm(g, st, view, A2, false);
    if (DUAL_WEAPONS.has(wk)) weaponAt(hf, A.wa != null ? Math.PI - (wa != null ? wa : 0) + .4 : Math.PI - restPose - .5, true);
    hShoulders(g, st, view); hCape(g, st, view, A, true);
    hHead(g, st, view, A); hMark(g, st, view); hHairFront(g, st, view, A); hBeard(g, st, view, A); hFoxEars(g, st, view, A); hHeadgear(g, st, view, A);
    const h = hArm(g, st, view, A2, true); weaponAt(h, wa != null ? wa : restPose, false); g.fillStyle = st.skin;
  } else if (view === 'b') {
    const h = { x: 10.2 * st.bw, y: -16 }; hTail(g, st, view, A);
    if (wa == null) { const sh = hArm(g, st, view, A2, true); g.save(); g.translate(sh.x, sh.y); g.rotate(restPose); hWeapon(g, st, wk, A2, sh); g.restore(); }
    hLegs(g, st, view, A); hTorso(g, st, view, A); hAccents(g, st, view, A); hArm(g, st, view, A2, false); if (wa != null) { const hh = hArm(g, st, view, A2, true); weaponAt(hh, wa, false); } else hArm(g, st, view, A2, true);
    hShoulders(g, st, view); hCape(g, st, view, A, false); hHead(g, st, view, A); hHairFront(g, st, view, A); hHairBack(g, st, view, A); hFoxEars(g, st, view, A); hHeadgear(g, st, view, A);
  } else {
    hTail(g, st, view, A); hCape(g, st, view, A, false); hHairBack(g, st, view, A);
    const hf = hArm(g, st, view, A2, false); if (DUAL_WEAPONS.has(wk)) weaponAt(hf, A.wa != null ? (wa != null ? wa - .9 : 0) : restPose + .9, true);
    hLegs(g, st, view, A); hTorso(g, st, view, A); hAccents(g, st, view, A);
    const h = hArm(g, st, view, A2, true); weaponAt(h, wa != null ? wa : restPose + .55, false); hShoulders(g, st, view);
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


const raceKeys={Humano:'humano',Humana:'humano',Elfo:'elfo',Elfa:'elfo','Anão':'anao','Anao':'anao',Orc:'orc',Tiefling:'tiefling',Minotauro:'minotauro',Kitsune:'kitsune',Draconato:'draconato',Draconata:'draconato'};
const armorKeys={leather:'couro',light:'couro',leather_armor:'couro',light_leather:'couro',ranger_coat:'couro',large_hide:'couro',couro:'couro',cota:'cota',mail:'cota',chain:'cota',placas:'placas',plate:'placas',plate_common:'placas',plate_royal:'placas',large_plate:'placas',abyss_bulwark:'placas',runica:'runica',robe:'runica',arcane_robe:'runica',holy_vestment:'runica',large_arcane:'runica',large_agile:'couro',samurai:'samurai',escamas:'escamas'};
const artEnums={hair:{undercut:'curto',mohawk:'moicano',trancas:'tranca',guerreiro:'tranca',ondulado:'selvagem',careca:'curto'},beard:{porfazer:'bigode',curta:'cavanhaque',trancada:'longa',mascara:'nenhuma'},head:{nao:'nenhum',nenhum:'nenhum',capuz:'capuz',coroa:'coroa',tiara:'coroa',bandana:'bandana',oculos:'bandana',meiaMascara:'oni'},cape:{nao:'sem',ombro:'curta',rasgada:'esfarrapada'},mark:{nenhuma:'nenhuma',cicatriz:'guerra',runa:'runas',pintura:'tribal',tatuagem:'tribal',queimadura:'antiga'},shoulder:{nenhuma:'nenhum',leves:'couro',medias:'aco',pesadas:'aco',assimetrica:'espinhos'}};
const enumValue=(group,value,fallback)=>artEnums[group]?.[value]||value||fallback;
const modelSelector=value=>{const v=String(value||'');return v==='auto'||v==='0'?'':v};
const weaponNames=[[/adaga|dagger|katar|kunai/i,'adagas'],[/arco|bow/i,'arco'],[/besta|crossbow/i,'besta'],[/lan[cç]a|spear/i,'lanca'],[/machado|axe/i,'machado'],[/cajado|staff|b[aá]culo|grim[oó]rio|tome|c[oó]dice|orbe|orb/i,'cajado'],[/foice|scythe/i,'foice'],[/totem/i,'totem'],[/lua|moon/i,'luaclara'],[/ma[cç]a|mace/i,'maca'],[/martelo|malho|hammer|maul|^tank_/i,'martelo'],[/katana/i,'katana'],[/espada|l[âa]mina|sword/i,'espada']];
function pickWeapon(c,m){let v=m.weaponKey||m.weaponType||c.weapon||m.weaponId||m.weaponName||'';v=String(v);const lower=v.toLowerCase();if(WEAPONS[v])return v;if(/tank|shield|escudo|aegis/i.test(lower))return 'martelo';for(const [re,key] of weaponNames)if(re.test(lower))return key;const cls=String(m.class||c.cls||'').toLowerCase();return ({mago:'cajado',clérigo:'maca',paladino:'martelo',tanke:'martelo',tank:'martelo',assassino:'adagas',arqueiro:'arco',fighter:'espada',guerreiro:'espada',druida:'totem'})[cls]||'espada'}
function skinFor(race,value){if(/^#[0-9a-f]{3,8}$/i.test(String(value||'')))return value;const r=RACES[race]||RACES.humano;const n=Number(value);return r.skin[Number.isFinite(n)?clamp(Math.floor(n),0,r.skin.length-1):1]}
function makeModel(character={},meta={}){const c=character||{},m=meta||{},rawRace=m.race||c.race||c.raceFeature||'Humano',race=raceKeys[rawRace]||raceKeys[String(rawRace).toLowerCase()]||String(rawRace).toLowerCase(),cls=String(m.class||c.class||c.cls||'').toLowerCase();let armor=c.armor||c.armorType||'';if(!armor&&c.armorSet)armor=armorKeys[c.armorSet]||'';if(!armor&&m.armorId)armor=armorKeys[m.armorId]||'';if(!armor&&m.armorStyle)armor=/shadow|shinobi|ranger|couro|leather/i.test(m.armorStyle)?'couro':/sagrado|vest|mago|manto|arcane/i.test(m.armorStyle)?'runica':'placas';if(!armor)armor=(['mago','clérigo','clerigo','druida'].includes(cls))?'runica':(['assassino','arqueiro'].includes(cls)?'couro':'placas');armor=armorKeys[armor]||armor;
const skinValue=c.skin||c.skinTone||c.skinColor||m.skin;
const model={race,skin:skinFor(race,skinValue),hairStyle:enumValue('hair',c.hairStyle,'curto'),hairColor:c.hairColor||c.hair||'#3b2a20',beard:enumValue('beard',c.beard,'nenhuma'),head:c.head||((c.helmet==='sim'||c.helmet==='true'||c.helmet===true)?'elmo':enumValue('head',c.accessory,'nenhum')),cape:c.capeStyle==='sem'||c.cape==='sem'?'sem':enumValue('cape',c.cape||c.capeStyle,'longa'),mark:enumValue('mark',c.mark||c.marking,'nenhuma'),shoulder:enumValue('shoulder',c.shoulder||c.shoulders,'aco'),aura:c.aura||'nenhuma',body:c.body||((c.bodyType==='robusto'||c.bodyType==='forte')?'robusto':c.bodyType==='esguio'?'esguio':'medio'),armor,armorColor:c.armorColor||c.armor||'#425f69',trim:c.trim||c.accentColor||'#c7a65c',capeColor:c.capeColor||c.cape||'#8c3a3a',eye:c.eye||c.eyeColor||'#3a2a1c',glow:c.glow||c.auraColor||'#9fe8ff',weapon:pickWeapon(c,m),emblem:c.emblem||'runa',extra:c.extra||'',class:cls,large:!!m.large||!!c.large,weaponName:m.weaponName||'',tankShield:/escudo|shield|aegis/i.test(String(m.weaponName||m.weaponId||c.weaponId||'')),blocking:!!(m.blocking||m.isBlocking||(m.class==='Tanke'&&m.shield>0)),shieldModel:modelSelector(m.shieldModel||c.shieldModel),hammerModel:modelSelector(m.hammerModel||c.hammerModel),swordModel:modelSelector(m.swordModel||c.swordModel),seed:m.seed||1};
const family=String(m.weaponType||'').toLowerCase(),weaponText=String(m.weaponName||m.weaponId||c.weaponId||'').toLowerCase();model.tankWeapon=family==='sword'||model.swordModel||/montante|espada colossal|greatsword/.test(weaponText)?'sword':family==='hammer'||model.hammerModel||/malho|martelo colossal|ma[cç]a colossal/.test(weaponText)?'hammer':'shield';model.tankShield=model.tankWeapon==='shield'||/escudo|shield|aegis/.test(weaponText);
if(model.class==='tanke'||model.class==='tank') {model.class='tanke'; model.armor='placas';model.body='robusto';model.shoulder='aco';model.weapon='nenhuma';model.armorColor=c.armorColor||'#536878';model.capeColor=c.capeColor||'#273a4a';}
if(model.class==='mago')model.head=model.head==='nenhum'?'chapeu':model.head;
if(model.class==='paladino'||model.class==='fighter')model.head=model.head==='nenhum'?'elmo':model.head;
if(model.class==='druida')model.shoulder='pele';
return model}
function drawShield(g,m,A){
  const view=A.view||'f',x=view==='s'?-7:-9,y=-27,v=String(m.shieldModel||'').toLowerCase();
  const round=/radial|round|circular/.test(v)||['1','2','4','6','11'].includes(v),cross=/cross|cruz|bladebreaker/.test(v)||['3','9','19'].includes(v),
    tower=/tower|torre/.test(v)||['13','17'].includes(v),bulwark=['18'].includes(v),citadel=['20'].includes(v);
  g.save();if(A.flip)g.scale(-1,1);g.translate(x,y);g.scale(m.large?.66:.72,m.large?.66:.72);g.lineJoin='round';g.lineCap='round';
  g.fillStyle='#778998';g.strokeStyle='#111722';g.lineWidth=2;g.beginPath();
  if(round){g.arc(0,0,16,0,TAU);for(let i=0;i<8;i++){const a=i*TAU/8;g.lineTo(Math.cos(a)*21,Math.sin(a)*21);g.lineTo(Math.cos(a+TAU/16)*15,Math.sin(a+TAU/16)*15)}}
  else if(tower){g.moveTo(-10,-21);g.quadraticCurveTo(0,-25,10,-21);g.lineTo(11,11);g.lineTo(0,23);g.lineTo(-11,11)}
  else if(bulwark){g.moveTo(-17,-18);g.lineTo(-11,-23);g.lineTo(-5,-18);g.lineTo(0,-24);g.lineTo(5,-18);g.lineTo(11,-23);g.lineTo(17,-18);g.lineTo(16,7);g.lineTo(10,17);g.lineTo(0,24);g.lineTo(-10,17);g.lineTo(-16,7)}
  else if(citadel){g.moveTo(-17,-17);g.lineTo(-10,-21);g.lineTo(0,-16);g.lineTo(10,-21);g.lineTo(17,-17);g.lineTo(15,8);g.lineTo(0,23);g.lineTo(-15,8)}
  else if(cross){g.moveTo(-6,-18);g.lineTo(6,-18);g.lineTo(6,-7);g.lineTo(15,-13);g.lineTo(20,-5);g.lineTo(10,1);g.lineTo(17,10);g.lineTo(8,16);g.lineTo(0,8);g.lineTo(-8,16);g.lineTo(-17,10);g.lineTo(-10,1);g.lineTo(-20,-5);g.lineTo(-15,-13);g.lineTo(-6,-7)}
  else{g.moveTo(0,-20);g.quadraticCurveTo(14,-17,13,-4);g.lineTo(9,12);g.lineTo(0,22);g.lineTo(-9,12);g.lineTo(-13,-4);g.quadraticCurveTo(-14,-17,0,-20)}
  g.closePath();g.fill();g.stroke();
  g.strokeStyle='#d9b85e';g.lineWidth=1.5;g.beginPath();
  if(round){g.arc(0,0,12,0,TAU);for(let i=0;i<8;i++){const a=i*TAU/8;g.moveTo(Math.cos(a)*8,Math.sin(a)*8);g.lineTo(Math.cos(a)*18,Math.sin(a)*18)}}
  else{g.moveTo(-9,-14);g.lineTo(-9,8);g.lineTo(0,18);g.lineTo(9,8);g.lineTo(9,-14);g.moveTo(-13,-5);g.lineTo(13,-5);g.moveTo(-14,4);g.lineTo(14,4)}
  g.stroke();
  if(bulwark||citadel){g.strokeStyle='#eff5f8';g.lineWidth=1.2;g.beginPath();g.moveTo(0,-20);g.lineTo(0,19);g.moveTo(-12,-12);g.lineTo(0,-7);g.lineTo(12,-12);g.stroke();for(const sx of [-1,1])for(const sy of [-1,1]){g.fillStyle='#e3c476';g.beginPath();g.arc(sx*11,sy*9,1.3,0,TAU);g.fill()}}
  if(cross){g.strokeStyle='#d9b85e';g.lineWidth=1.5;g.beginPath();g.moveTo(-13,-7);g.lineTo(13,8);g.moveTo(13,-7);g.lineTo(-13,8);g.stroke()}
  g.fillStyle='#4c7f91';g.beginPath();g.arc(0,0,4.3,0,TAU);g.fill();g.strokeStyle='#f2e6be';g.lineWidth=1;g.stroke();
  for(const sx of [-1,1]){g.fillStyle='#d9b85e';g.beginPath();g.arc(sx*(bulwark||citadel?12:8),-14,1.4,0,TAU);g.fill()}
  g.strokeStyle='rgba(255,255,255,.45)';g.lineWidth=.8;g.beginPath();g.moveTo(-5,-17);g.lineTo(0,-20);g.lineTo(5,-17);g.stroke();
  g.restore()
}
function drawMaul(g,m,A){const view=A.view||'f',t=A.t||0;g.save();if(A.flip)g.scale(-1,1);const side=view==='s';g.translate(side?8:15,-12+Math.sin(t*3)*.5);g.rotate(A.atkP?-.45*Math.sin(A.atkP*Math.PI):-.16);g.lineCap='round';g.strokeStyle='#241a18';g.lineWidth=5;g.beginPath();g.moveTo(-2,20);g.lineTo(17,-28);g.stroke();g.strokeStyle='#765237';g.lineWidth=3.7;g.stroke();for(let i=0;i<5;i++){g.strokeStyle='#c7a65c';g.lineWidth=1;g.beginPath();g.moveTo(2+i*2.8,8-i*7);g.lineTo(6+i*2.8,9-i*7);g.stroke()}g.fillStyle='#202631';g.strokeStyle='#10131a';g.lineWidth=1.5;g.beginPath();g.roundRect(7,-36,23,15,2);g.fill();g.stroke();g.fillStyle='#aebbc6';g.fillRect(9,-34,19,3);g.fillStyle='#536878';g.fillRect(12,-30,14,7);g.strokeStyle='#d4b669';g.lineWidth=1;g.strokeRect(12,-30,14,7);g.strokeStyle=m.glow;g.lineWidth=1;g.beginPath();g.moveTo(14,-27);g.lineTo(19,-31);g.lineTo(24,-27);g.stroke();g.fillStyle=m.glow;g.globalAlpha=.8;g.beginPath();g.arc(19,-26.5,2.1+Math.sin(t*4)*.3,0,TAU);g.fill();g.globalAlpha=1;g.fillStyle='#8795a0';for(const x of [9,28])for(const y of [-33,-24]){g.beginPath();g.arc(x,y,1.2,0,TAU);g.fill()}g.restore()}
function drawGreatsword(g,m,A){const view=A.view||'f';g.save();if(A.flip)g.scale(-1,1);g.translate(view==='s'?10:18,-13);g.rotate(A.atkP?-.32*Math.sin(A.atkP*Math.PI):-.14);g.lineCap='round';g.strokeStyle='#292126';g.lineWidth=5;g.beginPath();g.moveTo(-5,18);g.lineTo(13,-22);g.stroke();g.strokeStyle='#765237';g.lineWidth=3.5;g.stroke();g.fillStyle='#aebbc6';g.strokeStyle='#141820';g.lineWidth=1.6;g.beginPath();g.moveTo(7,-22);g.lineTo(17,-47);g.lineTo(24,-50);g.lineTo(25,-45);g.lineTo(15,-19);g.closePath();g.fill();g.stroke();g.strokeStyle='#eef5fa';g.lineWidth=1.1;g.beginPath();g.moveTo(15,-43);g.lineTo(10,-25);g.stroke();g.strokeStyle='#d4b669';g.lineWidth=2.6;g.beginPath();g.moveTo(4,-23);g.lineTo(20,-16);g.stroke();g.fillStyle=m.glow;g.beginPath();g.arc(12,-22,2.2,0,TAU);g.fill();g.restore()}
function draw(g,character={},anim={}){const model=character.class!==undefined&&character.weapon!==undefined&&character.armor!==undefined?character:makeModel(character,anim.meta||{});const A=Object.assign({t:0,ph:0,mv:0,view:'f',flip:false,seed:model.seed||1},anim),blocking=A.blocking??model.blocking,hasShield=model.class==='tanke'&&(model.tankWeapon==='shield'||blocking);if(hasShield&&A.view==='b')drawShield(g,model,A);drawHumanoid(g,model,A);if(model.class==='tanke'){if(hasShield&&A.view!=='b')drawShield(g,model,A);else if(!hasShield){if(model.tankWeapon==='sword')drawGreatsword(g,model,A);else drawMaul(g,model,A)}}return model}
function viewAngle(a){return viewFromAngle(a)}
function dataURL(character={},opts={}){const canvas=document.createElement('canvas');canvas.width=420;canvas.height=420;const g=canvas.getContext('2d');g.save();g.translate(150,342);g.scale(4.6,4.6);g.fillStyle='rgba(0,0,0,.38)';g.beginPath();g.ellipse(0,1,14,4,0,0,TAU);g.fill();const m=character.class!==undefined&&character.weapon!==undefined&&character.armor!==undefined?character:makeModel(character,opts.meta||{});draw(g,m,Object.assign({t:performance.now()/1000,ph:0,mv:0,view:opts.view||'f',flip:false,seed:m.seed,blocking:m.blocking},opts));g.restore();const pixels=g.getImageData(0,0,canvas.width,canvas.height).data;let x0=canvas.width,y0=canvas.height,x1=0,y1=0;for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){if(pixels[(y*canvas.width+x)*4+3]>3){if(x<x0)x0=x;if(y<y0)y0=y;if(x>x1)x1=x;if(y>y1)y1=y}}const pad=7;x0=Math.max(0,x0-pad);y0=Math.max(0,y0-pad);x1=Math.min(canvas.width-1,x1+pad);y1=Math.min(canvas.height-1,y1+pad);const out=document.createElement('canvas');out.width=x1-x0+1;out.height=y1-y0+1;out.getContext('2d').drawImage(canvas,x0,y0,out.width,out.height,0,0,out.width,out.height);return out.toDataURL('image/png')}
global.CharacterArt={makeModel,draw,viewAngle,dataURL};
})(window);
