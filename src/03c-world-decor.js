/* ---------- decoração do chão (vetorial, sobre o terreno pintado) ---------- */
function paintGroundDecor(g, c) {
  const rng = mulberry((hash2(c.cx, c.cy, 777) * 4294967296) | 0);
  const R = (a, b) => a + rng() * (b - a);
  const N = 340;
  g.lineCap = 'round';
  for (let n = 0; n < N; n++) {
    const x = c.x + rng() * CH, y = c.y + rng() * CH, q = rng(), b = biomeAt(x, y), pal = BIOMES[b];
    const lq = liqRaw(x, y);
    if (lq > .02) { // detalhes na água
      if (lq < .35 && q < .22 && (b === 'marsh' || b === 'forest' || b === 'jungle' || b === 'meadow')) {
        g.fillStyle = '#3f8a46'; g.beginPath(); g.ellipse(x, y, 8, 5, R(0, 3), 0, TAU); g.fill();
        g.fillStyle = '#ffffff55'; g.beginPath(); g.ellipse(x - 2, y - 1, 3, 1.6, 0, 0, TAU); g.fill();
        if (q < .06) { g.fillStyle = '#f2a6c4'; g.beginPath(); g.arc(x, y - 1, 2.6, 0, TAU); g.fill(); }
      } else if (lq < .4 && q > .7) { g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(x, y, R(8, 18), R(2, 5), 0, 0, TAU); g.stroke(); }
      continue;
    }
    if (roadDist(x, y) < 40) continue;
    switch (b) {
      case 'meadow': case 'forest': case 'jungle': {
        const dk = b === 'forest' ? pal.g3 : pal.g2;
        if (q < .62) { g.strokeStyle = q < .3 ? pal.g3 : pal.g2; g.lineWidth = 1.3; g.beginPath(); const h = R(5, 11); g.moveTo(x, y); g.quadraticCurveTo(x + R(-2, 2), y - h * .6, x + R(-4, 4), y - h); g.moveTo(x + 3, y); g.quadraticCurveTo(x + 4, y - h * .5, x + R(0, 7), y - h * .85); g.stroke(); }
        else if (q < .78) { const col = pal.acc[(rng() * pal.acc.length) | 0]; g.strokeStyle = '#3d6a34'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 7); g.stroke(); g.fillStyle = col; for (let k = 0; k < 5; k++) { const a = k * TAU / 5; g.beginPath(); g.ellipse(x + Math.cos(a) * 2.4, y - 8 + Math.sin(a) * 2.4, 2, 1.4, a, 0, TAU); g.fill(); } g.fillStyle = '#fff3a0'; g.beginPath(); g.arc(x, y - 8, 1.1, 0, TAU); g.fill(); }
        else if (q < .88) { g.fillStyle = 'rgba(20,40,20,.18)'; g.beginPath(); g.ellipse(x, y + 2, R(10, 22), R(5, 9), 0, 0, TAU); g.fill(); g.fillStyle = dk; g.globalAlpha = .6; g.beginPath(); g.ellipse(x, y, R(8, 18), R(4, 8), 0, 0, TAU); g.fill(); g.globalAlpha = 1; }
        else if (q < .95) { g.fillStyle = b === 'jungle' ? '#2a7a3a' : '#8a6a3a'; g.globalAlpha = .75; g.beginPath(); g.ellipse(x, y, R(3, 6), R(1.6, 3), R(0, 3), 0, TAU); g.fill(); g.globalAlpha = 1; }
        else { g.fillStyle = '#8a8776'; g.beginPath(); g.ellipse(x, y, R(2, 4.5), R(1.5, 3), 0, 0, TAU); g.fill(); g.fillStyle = '#c8c6b2'; g.beginPath(); g.ellipse(x - 1, y - 1, 1.4, 1, 0, 0, TAU); g.fill(); }
        break;
      }
      case 'marsh': {
        if (q < .4) { g.strokeStyle = '#4d7a3a'; g.lineWidth = 1.5; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x + k * 3, y); g.lineTo(x + k * 3 + R(-2, 2), y - R(8, 16)); g.stroke(); } g.fillStyle = '#6a4a2a'; g.fillRect(x + 4, y - 14, 3, 6); }
        else if (q < .65) { g.fillStyle = 'rgba(30,60,60,.45)'; g.beginPath(); g.ellipse(x, y, R(10, 24), R(4, 10), 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(160,220,200,.2)'; g.beginPath(); g.ellipse(x - 3, y - 1, 6, 2, 0, 0, TAU); g.fill(); }
        else if (q < .85) { g.fillStyle = pal.acc[(rng() * 3) | 0]; g.beginPath(); g.arc(x, y - 4, 2.4, 0, TAU); g.fill(); g.strokeStyle = '#2a4a32'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 4); g.stroke(); }
        else { g.fillStyle = '#3a5a3a'; g.globalAlpha = .6; g.beginPath(); g.ellipse(x, y, R(8, 16), R(4, 7), 0, 0, TAU); g.fill(); g.globalAlpha = 1; }
        break;
      }
      case 'dunes': case 'canyon': {
        if (q < .45) { g.strokeStyle = shade(pal.g, q < .22 ? -.14 : .12); g.lineWidth = 1.6; g.beginPath(); g.arc(x, y, R(6, 18), R(3.4, 4.2), R(5.6, 6.2)); g.stroke(); }
        else if (q < .7) { g.fillStyle = pal.g3; g.beginPath(); g.ellipse(x, y, R(2, 5), R(1.5, 3), R(0, 3), 0, TAU); g.fill(); g.fillStyle = shade(pal.g2, .2); g.beginPath(); g.ellipse(x - 1, y - 1, 1.5, 1, 0, 0, TAU); g.fill(); }
        else if (q < .85 && b === 'canyon') { g.strokeStyle = 'rgba(60,24,16,.5)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + R(8, 20), y + R(-3, 5)); g.lineTo(x + R(20, 34), y + R(-5, 8)); g.stroke(); }
        else if (q < .93) { g.strokeStyle = '#7a8a3a'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y - 7); g.moveTo(x, y); g.lineTo(x + 3, y - 8); g.moveTo(x, y); g.lineTo(x, y - 9); g.stroke(); }
        break;
      }
      case 'frost': {
        if (q < .3) { g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(x, y, R(10, 26), R(4, 9), 0, 0, TAU); g.fill(); }
        else if (q < .55) { g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1.2; const s = R(2, 4.5); g.beginPath(); g.moveTo(x - s, y); g.lineTo(x + s, y); g.moveTo(x, y - s); g.lineTo(x, y + s); g.moveTo(x - s * .7, y - s * .7); g.lineTo(x + s * .7, y + s * .7); g.stroke(); }
        else if (q < .75) { g.strokeStyle = 'rgba(120,170,200,.55)'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + R(8, 22), y + R(-6, 8)); g.lineTo(x + R(20, 40), y + R(-8, 12)); g.stroke(); }
        else { g.fillStyle = '#bde4f2'; g.beginPath(); g.moveTo(x, y - R(5, 10)); g.lineTo(x + 3, y); g.lineTo(x - 3, y); g.fill(); }
        break;
      }
      case 'mountain': case 'ash': {
        if (q < .4) { g.fillStyle = pal.g3; g.beginPath(); g.ellipse(x, y, R(2, 6), R(1.5, 4), R(0, 3), 0, TAU); g.fill(); g.fillStyle = shade(pal.g2, .15); g.beginPath(); g.ellipse(x - 1, y - 1, 1.6, 1, 0, 0, TAU); g.fill(); }
        else if (q < .6) { g.fillStyle = b === 'ash' ? '#6a6a7a' : '#7a8a52'; g.globalAlpha = .45; g.beginPath(); g.ellipse(x, y, R(8, 20), R(3, 7), 0, 0, TAU); g.fill(); g.globalAlpha = 1; }
        else if (q < .78) { g.strokeStyle = 'rgba(20,20,30,.4)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + R(6, 16), y + R(-4, 6)); g.stroke(); }
        else if (b === 'ash' && q < .88) { g.fillStyle = '#e0dccb'; g.beginPath(); g.ellipse(x, y, 3, 2.2, 0, 0, TAU); g.fill(); g.fillStyle = '#2a2a30'; g.fillRect(x - 1.6, y - .6, 1.1, 1.1); g.fillRect(x + .6, y - .6, 1.1, 1.1); }
        else { g.strokeStyle = b === 'ash' ? '#5a5a4a' : '#6a7a4a'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + R(-3, 3), y - R(4, 8)); g.stroke(); }
        break;
      }
      case 'volcano': {
        if (q < .35) { const gl = ctxGlow(g, x, y, R(10, 18), 'rgba(255,120,40,.4)'); g.strokeStyle = '#ff9a3a'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + R(6, 14), y + R(-4, 6)); g.lineTo(x + R(14, 26), y + R(-8, 10)); g.stroke(); }
        else if (q < .6) { g.fillStyle = '#17131a'; g.beginPath(); g.ellipse(x, y, R(3, 8), R(2, 5), R(0, 3), 0, TAU); g.fill(); g.fillStyle = '#4a3a3a'; g.beginPath(); g.ellipse(x - 1, y - 1, 2, 1.2, 0, 0, TAU); g.fill(); }
        else { g.fillStyle = 'rgba(40,36,40,.5)'; g.beginPath(); g.ellipse(x, y, R(6, 16), R(3, 7), 0, 0, TAU); g.fill(); }
        break;
      }
      case 'storm': {
        if (q < .3) { g.strokeStyle = 'rgba(210,240,240,.4)'; g.lineWidth = 1.4; g.beginPath(); g.arc(x, y, R(6, 14), R(3.6, 4.4), R(5.4, 6)); g.stroke(); }
        else if (q < .6) { g.strokeStyle = pal.g3; g.lineWidth = 1.3; const h = R(6, 12), lean = R(4, 9); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + lean * .3, y - h * .7, x + lean, y - h); g.stroke(); }
        else if (q < .75) { g.fillStyle = 'rgba(180,230,240,.28)'; g.beginPath(); g.ellipse(x, y, R(8, 18), R(3, 7), 0, 0, TAU); g.fill(); }
        else if (q < .82) { g.strokeStyle = 'rgba(255,240,140,.55)'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(x, y - 8); g.lineTo(x - 3, y); g.lineTo(x + 1, y); g.lineTo(x - 3, y + 8); g.stroke(); }
        break;
      }
      case 'crystal': case 'arcane': case 'abyss': {
        const cols = pal.acc;
        if (q < .35) { g.globalAlpha = .55; g.fillStyle = cols[(rng() * cols.length) | 0]; const s = R(2, 6); g.beginPath(); g.moveTo(x, y - s * 2); g.lineTo(x + s * .6, y); g.lineTo(x, y + s * .5); g.lineTo(x - s * .6, y); g.closePath(); g.fill(); g.globalAlpha = 1; }
        else if (q < .55) { ctxGlow(g, x, y, R(5, 10), alpha(cols[0].length === 7 ? cols[0] : '#c4a2ff', .35)); }
        else if (q < .7 && b !== 'crystal') { g.strokeStyle = alpha(cols[(rng() * cols.length) | 0], .35); g.lineWidth = 1.3; const r = R(10, 22); g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); g.beginPath(); for (let k = 0; k < 5; k++) { const a = k * TAU * 2 / 5; g.lineTo(x + Math.cos(a) * r * .8, y + Math.sin(a) * r * .8); } g.closePath(); g.stroke(); }
        else if (q < .85) { g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(x, y, R(.8, 1.8), 0, TAU); g.fill(); }
        break;
      }
      case 'coast': {
        if (q < .25) { g.fillStyle = pal.acc[(rng() * 3) | 0]; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - 4, y - 5, x, y - 7); g.quadraticCurveTo(x + 4, y - 5, x, y); g.fill(); g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 7); g.stroke(); }
        else if (q < .45) { g.fillStyle = '#f0a8a0'; for (let k = 0; k < 5; k++) { const a = k * TAU / 5 - 1.57; g.beginPath(); g.ellipse(x + Math.cos(a) * 2.5, y + Math.sin(a) * 2.5, 2.6, 1.2, a, 0, TAU); g.fill(); } }
        else if (q < .7) { g.fillStyle = shade(pal.g, -.12); g.beginPath(); g.ellipse(x, y, R(2, 5), R(1.5, 3), 0, 0, TAU); g.fill(); }
        else { g.strokeStyle = shade(pal.g, -.18); g.lineWidth = 1.3; g.beginPath(); g.arc(x, y, R(8, 20), R(3.4, 4.2), R(5.6, 6.2)); g.stroke(); }
        break;
      }
      default: break;
    }
  }
}
function ctxGlow(g, x, y, r, col) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }

/* ---------- chão dos pontos de interesse ---------- */
function paintPoiGround(g, c) {
  for (const p of POIS) {
    if (p.x < c.x - 700 || p.x > c.x + CH + 700 || p.y < c.y - 700 || p.y > c.y + CH + 700) continue;
    const pal = BIOMES[p.biome || biomeAt(p.x, p.y)];
    g.save(); g.translate(p.x, p.y);
    if (p.type === 'village') {
      const rr = p.village.start ? 330 : 250;
      g.fillStyle = mixHex(pal.path, '#2a2418', .35); g.globalAlpha = .55; g.beginPath(); g.ellipse(0, 0, rr + 30, (rr + 30) * .72, 0, 0, TAU); g.fill(); g.globalAlpha = 1;
      g.fillStyle = pal.path; g.beginPath(); g.ellipse(0, 0, rr, rr * .7, 0, 0, TAU); g.fill();
      g.fillStyle = shade(pal.path, .12); g.beginPath(); g.ellipse(0, 0, rr * .8, rr * .56, 0, 0, TAU); g.fill();
      const rn = mulberry((p.x * 7 + p.y) | 0);
      for (let i = 0; i < 60; i++) { const a = rn() * TAU, d = Math.sqrt(rn()) * rr * .9; g.fillStyle = rn() < .5 ? shade(pal.path, -.14) : shade(pal.path, .22); g.beginPath(); g.ellipse(Math.cos(a) * d, Math.sin(a) * d * .7, rn() * 5 + 2, rn() * 3 + 1.5, rn() * 3, 0, TAU); g.fill(); }
      // praça de pedra central
      g.fillStyle = '#7d8070'; g.beginPath(); g.ellipse(0, 0, 92, 64, 0, 0, TAU); g.fill();
      g.fillStyle = '#9a9c88'; g.beginPath(); g.ellipse(0, 0, 84, 58, 0, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(40,44,36,.5)'; g.lineWidth = 1.4;
      for (let i = 0; i < 12; i++) { const a = i * TAU / 12; g.beginPath(); g.moveTo(Math.cos(a) * 20, Math.sin(a) * 14); g.lineTo(Math.cos(a) * 84, Math.sin(a) * 58); g.stroke(); }
      for (const k of [30, 56, 80]) { g.beginPath(); g.ellipse(0, 0, k, k * .69, 0, 0, TAU); g.stroke(); }
    } else if (p.type === 'dungeon' || p.type === 'abyss') {
      const col = p.dungeon.acc;
      g.fillStyle = 'rgba(10,10,16,.45)'; g.beginPath(); g.ellipse(0, 20, 210, 120, 0, 0, TAU); g.fill();
      g.fillStyle = '#56564e'; g.beginPath(); g.ellipse(0, 20, 190, 106, 0, 0, TAU); g.fill();
      g.fillStyle = '#6f6f64'; g.beginPath(); g.ellipse(0, 20, 176, 98, 0, 0, TAU); g.fill();
      g.strokeStyle = alpha(col, .6); g.lineWidth = 3; g.beginPath(); g.ellipse(0, 20, 150, 82, 0, 0, TAU); g.stroke(); g.lineWidth = 1.5; g.beginPath(); g.ellipse(0, 20, 120, 64, 0, 0, TAU); g.stroke();
      for (let i = 0; i < 10; i++) { const a = i * TAU / 10; g.save(); g.translate(Math.cos(a) * 135, 20 + Math.sin(a) * 74); g.rotate(a); g.strokeStyle = alpha(col, .7); g.lineWidth = 2; g.beginPath(); g.moveTo(-5, -6); g.lineTo(0, 6); g.lineTo(5, -6); g.stroke(); g.restore(); }
    } else if (p.type === 'arena') {
      g.fillStyle = 'rgba(50,30,70,.38)'; g.beginPath(); g.ellipse(0, 0, 300, 220, 0, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(190,140,255,.5)'; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 0, 270, 195, 0, 0, TAU); g.stroke(); g.beginPath(); g.ellipse(0, 0, 190, 138, 0, 0, TAU); g.stroke();
      for (let i = 0; i < 8; i++) { const a = i * TAU / 8; g.beginPath(); g.moveTo(Math.cos(a) * 190, Math.sin(a) * 138); g.lineTo(Math.cos(a) * 270, Math.sin(a) * 195); g.stroke(); }
    }
    g.restore();
  }
  // trilha ao redor do ponto de nascimento
  if (Math.abs(SPAWN.x - (c.x + CH / 2)) < 700) { /* gravado pela aldeia inicial */ }
}

/* ---------- objetos do mundo por pedaço ---------- */
/* [tipo, peso, tamMin, tamMax, fator de colisão] */
const OBJ_TABLE = {
  meadow: { n: 70, dens: .0, list: [['oak', 3, 22, 34, .3], ['birch', 1.4, 18, 26, .26], ['bush', 3, 12, 20, 0], ['flowerbush', 2.4, 11, 18, 0], ['rock', 1.2, 10, 20, .8], ['stump', .4, 10, 15, .6], ['haystack', .3, 16, 22, .8]] },
  forest: { n: 190, dens: .32, list: [['pine', 3.2, 26, 44, .26], ['oak', 3, 26, 40, .3], ['bush', 2, 12, 20, 0], ['mushroom', 1.1, 9, 15, 0], ['log', .7, 16, 24, .7], ['stump', .5, 11, 16, .6], ['fern', 2.4, 10, 17, 0], ['rock', 1, 11, 20, .8]] },
  jungle: { n: 200, dens: .3, list: [['jtree', 3.2, 32, 50, .24], ['palm', 2, 26, 38, .2], ['fern', 2.6, 12, 20, 0], ['bigleaf', 2.2, 14, 22, 0], ['bamboo', 1.6, 18, 26, .25], ['bushflower', 1.2, 12, 18, 0], ['rock', .6, 10, 18, .8]] },
  marsh: { n: 120, dens: .3, list: [['willow', 2, 28, 42, .22], ['deadtree', 1.6, 22, 34, .2], ['giantmush', 1.6, 18, 30, .35], ['reeds', 3.2, 12, 20, 0], ['rock', .6, 10, 18, .8], ['skullpile', .25, 12, 16, 0], ['bush', .9, 11, 18, 0]] },
  dunes: { n: 50, dens: 0, list: [['cactus', 2.2, 18, 30, .35], ['palm', .7, 26, 36, .2], ['dunerock', 1.6, 14, 28, .8], ['deadbush', 2.2, 10, 16, 0], ['bones', .6, 14, 22, 0], ['obelisk', .12, 26, 34, .5]] },
  canyon: { n: 60, dens: 0, list: [['mesa', 1.1, 38, 62, .8], ['redrock', 2.4, 16, 32, .8], ['cactus', 1, 18, 28, .35], ['deadbush', 1.2, 10, 15, 0], ['spire', .9, 30, 48, .5], ['minecart', .12, 18, 22, .6]] },
  frost: { n: 110, dens: .15, list: [['snowpine', 3.4, 28, 46, .26], ['icecrystal', 1.4, 16, 30, .5], ['snowrock', 1.6, 12, 24, .8], ['frozentree', 1.1, 24, 34, .22], ['snowbush', 1.2, 11, 17, 0], ['snowman', .14, 18, 22, .6]] },
  mountain: { n: 75, dens: 0, list: [['boulder', 3.2, 20, 46, .85], ['pine', 1.5, 26, 40, .26], ['spire', 1.1, 32, 56, .5], ['snowrock', .8, 12, 24, .8], ['deadtree', .6, 22, 32, .2]] },
  volcano: { n: 75, dens: 0, list: [['basalt', 3.2, 22, 44, .6], ['charredtree', 1.6, 24, 34, .2], ['lavarock', 1.6, 12, 22, .8], ['vent', .8, 14, 20, 0], ['obsidian', 1.1, 16, 30, .55]] },
  storm: { n: 65, dens: 0, list: [['stormtree', 1.8, 26, 38, .22], ['rod', 1.5, 28, 40, .3], ['rock', 1.2, 12, 22, .8], ['pylon', .4, 34, 46, .45]] },
  crystal: { n: 95, dens: .1, list: [['crystalcluster', 3.4, 20, 40, .5], ['crystaltree', 1.6, 28, 40, .25], ['glowshroom', 1.8, 12, 22, 0], ['rock', .9, 11, 20, .8]] },
  arcane: { n: 65, dens: 0, list: [['monolith', 1.6, 30, 46, .5], ['floatrock', 2.2, 14, 28, 0], ['arctree', 2, 26, 38, .22], ['runestone', 1, 16, 24, .6], ['starflower', 1.3, 10, 16, 0]] },
  ash: { n: 110, dens: .12, list: [['deadtree', 3, 24, 38, .2], ['gravestone', 3, 12, 20, .45], ['bonepile', 1, 12, 18, 0], ['rock', 1, 11, 20, .8], ['torchpost', .3, 20, 26, .2], ['crypt', .1, 34, 44, .6]] },
  coast: { n: 45, dens: 0, list: [['palm', 2, 26, 38, .2], ['driftwood', 1, 18, 28, .5], ['coastrock', 1.6, 14, 30, .8], ['shell', 2, 8, 12, 0], ['umbrella', .1, 24, 30, 0]] },
  abyss: { n: 55, dens: 0, list: [['voidspire', 2.4, 28, 52, .5], ['voidrock', 2, 14, 28, .8], ['eyestalk', 1, 18, 26, .3]] }
};
function generateChunkObjects(c) {
  const rng = mulberry((hash2(c.cx, c.cy, WSEED) * 4294967296) | 0);
  const cx0 = c.x + CH / 2, cy0 = c.y + CH / 2, bMain = biomeAt(cx0, cy0);
  const objs = c.objs, solids = c.solids;
  const tryAdd = (o) => {
    for (const q of objs) { const m = (o.s + q.s) * .52; if (Math.abs(q.x - o.x) < m && Math.abs(q.y - o.y) < m && Math.hypot(q.x - o.x, q.y - o.y) < m) return false; }
    objs.push(o); if (o.cr) solids.push({ x: o.x, y: o.y + o.s * .18, r: o.cr }); return true;
  };
  // 1) vegetação e rochas por bioma
  const tries = 360;
  for (let n = 0; n < tries; n++) {
    const x = c.x + 20 + rng() * (CH - 40), y = c.y + 20 + rng() * (CH - 40), b = biomeAt(x, y), tab = OBJ_TABLE[b];
    if (n >= tab.n * 2) { continue; }
    if (rng() > clamp(tab.n / 190, .08, 1) * 1.25) continue;
    if (liquidAt(x, y) !== 0 && liqRaw(x, y) > .02) { if (!(b === 'marsh' && rng() < .1)) continue; }
    if (roadDist(x, y) < 78 || poiClearance(x, y) < 40) continue;
    if (tab.dens > 0) { const dn = fbm(x * .0024, y * .0024, 61, 2); if (dn < .5 - tab.dens * 1.3 + rng() * .35) { if (rng() < .85) continue; } }
    let tot = 0; for (const e of tab.list) tot += e[1]; let r = rng() * tot, pick = tab.list[0];
    for (const e of tab.list) { r -= e[1]; if (r <= 0) { pick = e; break; } }
    const s = pick[2] + rng() * (pick[3] - pick[2]);
    tryAdd({ k: pick[0], v: (rng() * 4) | 0, x, y, s, cr: pick[4] ? s * pick[4] * .55 : 0, ph: rng() * TAU, b });
  }
  const free = () => { for (let t = 0; t < 14; t++) { const x = c.x + 60 + rng() * (CH - 120), y = c.y + 60 + rng() * (CH - 120); if (liquidAt(x, y) === 0 && liqRaw(x, y) <= .02 && roadDist(x, y) > 90 && poiClearance(x, y) > 120) return { x, y }; } return null; };
  // 2) características: acampamentos, ruínas, obeliscos
  const fr = rng(), pos = free();
  if (pos && fr < .42 && poiClearance(pos.x, pos.y) > 220) {
    const b = biomeAt(pos.x, pos.y), id = `f${c.cx}_${c.cy}`, lv = zoneLevel(pos.x, pos.y);
    if (fr < .22 && b !== 'abyss') {
      c.feats.push({ type: 'camp', x: pos.x, y: pos.y, id, biome: b, lv, r: 120 });
      objs.push({ k: 'tent', v: 0, x: pos.x - 54, y: pos.y + 6, s: 30, cr: 20, ph: 0, b }, { k: 'tent', v: 1, x: pos.x + 52, y: pos.y - 4, s: 26, cr: 18, ph: 0, b }, { k: 'campfire', v: 0, x: pos.x, y: pos.y + 14, s: 16, cr: 8, ph: rng() * 6, b });
      solids.push({ x: pos.x - 54, y: pos.y + 10, r: 20 }, { x: pos.x + 52, y: pos.y, r: 18 });
      objs.push({ k: 'crate', v: 0, x: pos.x - 18, y: pos.y - 34, s: 14, cr: 9, ph: 0, b, id: id + 'c1', brk: true });
      objs.push({ k: 'banner', v: 0, x: pos.x + 8, y: pos.y - 58, s: 26, cr: 4, ph: rng() * 6, b });
      if (!taken.has(id + 'chest')) objs.push({ k: 'chest', v: 0, x: pos.x + 18, y: pos.y - 24, s: 17, cr: 9, ph: 0, b, id: id + 'chest', lv, camp: id });
    } else if (fr < .36) {
      c.feats.push({ type: 'ruin', x: pos.x, y: pos.y, id, biome: b, lv, r: 140 });
      for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + .3; objs.push({ k: 'pillar', v: i % 2, x: pos.x + Math.cos(a) * 82, y: pos.y + Math.sin(a) * 58, s: 24 + rng() * 10, cr: 9, ph: 0, b }); solids.push({ x: pos.x + Math.cos(a) * 82, y: pos.y + Math.sin(a) * 58, r: 10 }); }
      objs.push({ k: 'altar', v: 0, x: pos.x, y: pos.y, s: 26, cr: 16, ph: 0, b }); solids.push({ x: pos.x, y: pos.y + 4, r: 16 });
      if (!taken.has(id + 'chest')) objs.push({ k: 'chest', v: 1, x: pos.x + 24, y: pos.y + 50, s: 17, cr: 9, ph: 0, b, id: id + 'chest', lv });
    } else {
      const wid = 'o_' + id; c.feats.push({ type: 'obelisk', x: pos.x, y: pos.y, id: wid, biome: b, lv, r: 90, name: 'Obelisco · ' + BIOMES[b].name });
      objs.push({ k: 'obelisk', v: 0, x: pos.x, y: pos.y, s: 34, cr: 14, ph: rng() * 6, b, id: wid }); solids.push({ x: pos.x, y: pos.y + 4, r: 14 });
    }
  }
  // 3) baús isolados e nós de coleta
  if (rng() < .5) { const p = free(); if (p) { const id = `c${c.cx}_${c.cy}`; if (!taken.has(id)) objs.push({ k: 'chest', v: 0, x: p.x, y: p.y, s: 17, cr: 9, ph: 0, b: biomeAt(p.x, p.y), id, lv: zoneLevel(p.x, p.y) }); } }
  const nn = 2 + ((rng() * 4) | 0);
  for (let i = 0; i < nn; i++) {
    const p = free(); if (!p) break; const b = biomeAt(p.x, p.y), mat = NODE_BY_BIOME[b] || 'herb';
    objs.push({ k: 'node', v: 0, x: p.x, y: p.y, s: 13, cr: 0, ph: rng() * 6, b, id: `n${c.cx}_${c.cy}_${i}`, mat });
  }
  if (rng() < .25) { const p = free(); if (p) { const b = biomeAt(p.x, p.y); for (let i = 0; i < 3; i++) objs.push({ k: i % 2 ? 'barrel' : 'crate', v: 0, x: p.x + i * 22 - 20, y: p.y + (i % 2) * 14, s: 14, cr: 9, ph: 0, b, id: `bk${c.cx}_${c.cy}_${i}`, brk: true }); } }
  c.gen = true;
}
const NODE_BY_BIOME = { meadow: 'herb', forest: 'herb', jungle: 'herb', marsh: 'herb', dunes: 'ore', canyon: 'ore', mountain: 'ore', volcano: 'ore', ash: 'bone', storm: 'ore', frost: 'shard', crystal: 'shard', arcane: 'shard', coast: 'pearl', abyss: 'shard' };
const MATERIALS = { herb: { n: 'Erva Luminosa', icon: '❀', price: 6, col: '#8fe28b' }, ore: { n: 'Minério Bruto', icon: '◆', price: 9, col: '#e0a06a' }, shard: { n: 'Fragmento Arcano', icon: '✦', price: 12, col: '#bba0ff' }, bone: { n: 'Osso Antigo', icon: '☠', price: 7, col: '#e8e2cc' }, pearl: { n: 'Pérola Marinha', icon: '●', price: 11, col: '#9fe8f0' } };
