/* ============================================================
   MUNDO: terreno, biomas, rios, estradas, pontos de interesse
   ============================================================ */
const WORLD_W = 18000, WORLD_H = 13200, GRID = 40, GW = WORLD_W / GRID, GH = WORLD_H / GRID;
const SPAWN = { x: 5400, y: 7720 };
const ABYSS = { x: 9000, y: 6600, r: 480 };
const WSEED = 7141;

const ANCHORS = [
  ['meadow', 5400, 7600, 1.3], ['meadow', 4300, 8800, .9], ['meadow', 6600, 8700, .8],
  ['forest', 6900, 6000, 1], ['forest', 8800, 9900, 1.1], ['forest', 3200, 4800, .9], ['forest', 9800, 4300, .85],
  ['jungle', 3000, 9900, 1.1], ['jungle', 4300, 11500, .8],
  ['marsh', 6300, 10300, 1], ['marsh', 8600, 11800, .75],
  ['ash', 2800, 6900, .95], ['ash', 9000, 6600, .6], ['ash', 9700, 2000, 1],
  ['crystal', 2400, 2700, 1], ['crystal', 4500, 3400, .7],
  ['arcane', 6300, 2400, 1], ['arcane', 8000, 3700, .7],
  ['frost', 13300, 2100, 1.1], ['frost', 16000, 3400, 1], ['frost', 11800, 3300, .8],
  ['mountain', 14000, 5500, 1], ['mountain', 11600, 5000, .8],
  ['volcano', 11200, 7000, 1], ['volcano', 12400, 7800, .7],
  ['storm', 13200, 9100, 1], ['storm', 10400, 8900, .8],
  ['dunes', 16300, 8800, 1.1], ['dunes', 15900, 10700, 1], ['dunes', 16900, 6300, .8],
  ['canyon', 11800, 11000, 1.1], ['canyon', 13700, 11800, .8]
];

const gBiomeA = new Uint8Array(GW * GH), gBiomeB = new Uint8Array(GW * GH), gBlend = new Uint8Array(GW * GH);
const gLiq = new Float32Array(GW * GH), gKind = new Uint8Array(GW * GH), gNoLiq = new Uint8Array(GW * GH);
const LIQ_KINDS = [null, 'water', 'ice', 'lava', 'ink', 'crystal'];
const LIQ_KIND_IDX = { water: 1, ice: 2, lava: 3, ink: 4, crystal: 5 };

/* ---------- pontos de interesse ---------- */
const POIS = [];          // {id,type,x,y,name,...}
const poiById = {};
function addPoi(p) { POIS.push(p); poiById[p.id] = p; return p; }
for (const v of VILLAGES) addPoi({ id: 'v_' + v.id, type: 'village', x: v.x, y: v.y, name: v.name, village: v, wp: true, r: 560 });
for (const d of DUNGEONS) addPoi({ id: 'd_' + d.id, type: 'dungeon', x: d.x, y: d.y, name: d.name, dungeon: d, wp: true, r: 320 });
addPoi({ id: 'abismo', type: 'abyss', x: ABYSS.x, y: ABYSS.y, name: 'Fenda do Abismo', dungeon: ONI_DUNGEON, r: 520 });
addPoi({ id: 'arena_guardian', type: 'arena', x: FIELD_BOSS.x, y: FIELD_BOSS.y, name: 'Arena do Guardião', r: 320 });

/* ---------- geração dos campos de terreno ---------- */
function generateTerrain(progress) {
  // máscara livre de água em volta de pontos de interesse
  for (const p of POIS) {
    const rr = Math.ceil(p.r / GRID), cx = Math.floor(p.x / GRID), cy = Math.floor(p.y / GRID);
    for (let dy = -rr; dy <= rr; dy++) for (let dx = -rr; dx <= rr; dx++) {
      const x = cx + dx, y = cy + dy; if (x < 0 || y < 0 || x >= GW || y >= GH) continue;
      if (dx * dx + dy * dy <= rr * rr) gNoLiq[y * GW + x] = 1;
    }
  }
  const spawnR = Math.ceil(700 / GRID);
  for (let dy = -spawnR; dy <= spawnR; dy++) for (let dx = -spawnR; dx <= spawnR; dx++) { const x = Math.floor(SPAWN.x / GRID) + dx, y = Math.floor(SPAWN.y / GRID) + dy; if (dx * dx + dy * dy <= spawnR * spawnR) gNoLiq[y * GW + x] = 1; }
  const AN = ANCHORS.map(a => ({ t: BIOME_IDX[a[0]], x: a[1], y: a[2], w: a[3] }));
  const sc = new Float32Array(AN.length);
  const M = 380;
  for (let cy = 0; cy < GH; cy++) {
    for (let cx = 0; cx < GW; cx++) {
      const i = cy * GW + cx, x = (cx + .5) * GRID, y = (cy + .5) * GRID;
      const wx = x + (fbm(x * .00042, y * .00042, 11, 2) - .5) * 1100, wy = y + (fbm(x * .00042, y * .00042, 12, 2) - .5) * 1100;
      let b1 = 1e9, i1 = 0;
      for (let k = 0; k < AN.length; k++) { const a = AN[k]; const s = Math.hypot(wx - a.x, wy - a.y) / a.w; sc[k] = s; if (s < b1) { b1 = s; i1 = k; } }
      let b2 = 1e9, i2 = i1; const t1 = AN[i1].t;
      for (let k = 0; k < AN.length; k++) if (AN[k].t !== t1 && sc[k] < b2) { b2 = sc[k]; i2 = k; }
      let A = t1, Bt = AN[i2].t, wB = .5 * (1 - smooth(0, M, b2 - b1));
      // costa
      const e = Math.min(x, WORLD_W - x, y, WORLD_H - y) + (fbm(x * .0005, y * .0005, 21, 3) - .5) * 900;
      let ocean = 0;
      if (e < 1350) {
        const wc = 1 - smooth(950, 1350, e);   // peso da praia
        if (wc > .02) { Bt = A; A = BIOME_IDX.coast; wB = 1 - wc; if (wB < 0) wB = 0; }
        ocean = (790 - e) / 290;
      }
      // cratera do abismo
      const da = Math.hypot(x - ABYSS.x, y - ABYSS.y);
      if (da < ABYSS.r * 1.3) {
        const wa = 1 - smooth(ABYSS.r * .68, ABYSS.r * 1.25, da);
        if (wa >= .5) { Bt = A; A = BIOME_IDX.abyss; wB = 1 - wa; }
        else if (wa > 0) { Bt = BIOME_IDX.abyss; wB = wa; }
      }
      gBiomeA[i] = A; gBiomeB[i] = Bt; gBlend[i] = Math.round(clamp(wB, 0, 1) * 255);
      // líquidos
      const dom = BIOME_LIST[wB > .5 ? Bt : A], liqName = BIOMES[dom].liq;
      let lq = 0, kind = 0;
      if (liqName && !gNoLiq[i] && dom !== 'abyss') {
        const lake = fbm(x * .00052, y * .00052, 31, 3), river = Math.abs(fbm(x * .00031, y * .00031, 41, 2) - .5);
        const lk = (lake - .685) / .1, rv = 1 - river / .014;
        lq = Math.max(lk > 0 ? lk * .95 : 0, rv > 0 ? Math.min(.42, rv * .6) : 0);
        if (lq > 0) kind = LIQ_KIND_IDX[liqName];
      }
      if (ocean > 0 && !gNoLiq[i]) { if (ocean > lq || !kind) { lq = Math.max(lq, ocean); kind = 1; } }
      gLiq[i] = lq; gKind[i] = kind;
    }
    if (progress && cy % 30 === 0) progress(cy / GH);
  }
}
const cellOf = (x, y) => (clamp(Math.floor(y / GRID), 0, GH - 1) * GW + clamp(Math.floor(x / GRID), 0, GW - 1));
function biomeAt(x, y) { const i = cellOf(x, y); return BIOME_LIST[gBlend[i] > 127 ? gBiomeB[i] : gBiomeA[i]]; }
function liqRaw(x, y) {
  const fx = clamp(x / GRID - .5, 0, GW - 1.001), fy = clamp(y / GRID - .5, 0, GH - 1.001);
  const ix = fx | 0, iy = fy | 0, tx = fx - ix, ty = fy - iy, i = iy * GW + ix;
  return (gLiq[i] * (1 - tx) + gLiq[i + 1] * tx) * (1 - ty) + (gLiq[i + GW] * (1 - tx) + gLiq[i + GW + 1] * tx) * ty;
}
function liqKindAt(x, y) { return LIQ_KINDS[gKind[cellOf(x, y)]]; }
/* 0 seco · 1 raso · 2 profundo (inclui estradas/pontes como seco) */
function liquidAt(x, y) {
  if (x < 0 || y < 0 || x > WORLD_W || y > WORLD_H) return 2;
  const v = liqRaw(x, y); if (v <= 0) return 0;
  if (roadDist(x, y) < 46) return 0;
  const kind = gKind[cellOf(x, y)];
  if (kind === 2) return 1;   // gelo: sempre atravessável
  return v > .5 ? 2 : 1;
}
const blockedAt = (x, y) => liquidAt(x, y) === 2;
function zoneLevel(x, y) {
  if (biomeAt(x, y) === 'abyss') return 38;
  return clamp(Math.round(1 + Math.hypot(x - SPAWN.x, y - SPAWN.y) / 330), 1, 44);
}

/* ---------- estradas ---------- */
const ROAD_EDGES = [
  ['v_aurora', 'v_vigilia'], ['v_aurora', 'v_salgado'], ['v_aurora', 'd_raizes'], ['d_raizes', 'v_raiz'], ['v_aurora', 'v_pantano'], ['v_aurora', 'v_palafita'],
  ['v_aurora', 'arena_guardian'], ['arena_guardian', 'abismo'], ['v_aurora', 'v_cristalina'], ['v_cristalina', 'v_torre'], ['v_torre', 'v_raiz'], ['v_raiz', 'v_cume'],
  ['v_cume', 'v_brasa'], ['v_brasa', 'v_estacao'], ['v_estacao', 'v_mercado'], ['v_mercado', 'v_oasis'], ['v_cume', 'v_posto'], ['v_posto', 'd_observatorio'],
  ['v_torre', 'd_trono'], ['v_cume', 'd_dragao'], ['v_estacao', 'd_trovao'], ['v_mercado', 'd_minas'], ['v_oasis', 'd_colosso'], ['v_cristalina', 'd_prismatico'],
  ['v_vigilia', 'd_catacumbas'], ['v_pantano', 'd_cisterna'], ['v_palafita', 'd_ninho'], ['v_salgado', 'd_recife'], ['v_torre', 'd_templo'], ['v_brasa', 'd_forja'], ['abismo', 'v_brasa']
];
const roadPolys = [], roadHash = new Map(), ROAD_CELL = 320;
function buildRoads() {
  let sid = 0;
  for (const [a, b] of ROAD_EDGES) {
    const A = poiById[a], B = poiById[b]; if (!A || !B) continue;
    const len = Math.hypot(B.x - A.x, B.y - A.y), n = Math.max(6, Math.ceil(len / 110)), nx = -(B.y - A.y) / len, ny = (B.x - A.x) / len, pts = [];
    const amp = Math.min(420, len * .16);
    for (let k = 0; k <= n; k++) {
      const t = k / n, off = (fbm(t * len * .0021 + sid * 7, sid * 3.7, 51, 2) - .5) * 2 * amp * Math.sin(Math.PI * t);
      pts.push({ x: A.x + (B.x - A.x) * t + nx * off, y: A.y + (B.y - A.y) * t + ny * off });
    }
    roadPolys.push(pts); sid++;
    for (let k = 0; k < pts.length - 1; k++) {
      const p = pts[k], q = pts[k + 1], x0 = Math.floor(Math.min(p.x, q.x) / ROAD_CELL), x1 = Math.floor(Math.max(p.x, q.x) / ROAD_CELL), y0 = Math.floor(Math.min(p.y, q.y) / ROAD_CELL), y1 = Math.floor(Math.max(p.y, q.y) / ROAD_CELL);
      for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) { const key = xx * 4096 + yy; let l = roadHash.get(key); if (!l) roadHash.set(key, l = []); l.push(p.x, p.y, q.x, q.y); }
    }
  }
}
function roadDist(x, y) {
  const cx = Math.floor(x / ROAD_CELL), cy = Math.floor(y / ROAD_CELL); let best = 1e9;
  for (let yy = cy - 1; yy <= cy + 1; yy++) for (let xx = cx - 1; xx <= cx + 1; xx++) {
    const l = roadHash.get(xx * 4096 + yy); if (!l) continue;
    for (let i = 0; i < l.length; i += 4) {
      const ax = l[i], ay = l[i + 1], bx = l[i + 2], by = l[i + 3], dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1;
      const t = clamp(((x - ax) * dx + (y - ay) * dy) / L, 0, 1), d = Math.hypot(x - (ax + dx * t), y - (ay + dy * t)); if (d < best) best = d;
    }
  }
  return best;
}
/* distância ao POI "limpo" mais próximo (para não gerar objetos) */
function poiClearance(x, y) {
  let best = 1e9;
  for (const p of POIS) { const d = Math.hypot(x - p.x, y - p.y) - (p.r || 200); if (d < best) best = d; }
  const ds = Math.hypot(x - SPAWN.x, y - SPAWN.y) - 520; if (ds < best) best = ds;
  return best;
}

/* ---------- névoa de exploração ---------- */
const FOG_C = 200, FW = Math.ceil(WORLD_W / FOG_C), FH = Math.ceil(WORLD_H / FOG_C);
let fog = new Uint8Array(FW * FH);
function revealFog(x, y, r) {
  const cx = Math.floor(x / FOG_C), cy = Math.floor(y / FOG_C), rr = Math.ceil(r / FOG_C); let changed = false;
  for (let dy = -rr; dy <= rr; dy++) for (let dx = -rr; dx <= rr; dx++) {
    const gx = cx + dx, gy = cy + dy; if (gx < 0 || gy < 0 || gx >= FW || gy >= FH || dx * dx + dy * dy > rr * rr) continue;
    if (!fog[gy * FW + gx]) { fog[gy * FW + gx] = 1; changed = true; }
  }
  return changed;
}
function fogEncode() {
  let s = '', byte = 0;
  for (let i = 0; i < fog.length; i++) { byte |= fog[i] << (i & 7); if ((i & 7) === 7 || i === fog.length - 1) { s += (byte < 16 ? '0' : '') + byte.toString(16); byte = 0; } }
  return s;
}
function fogDecode(str) {
  fog = new Uint8Array(FW * FH);
  if (typeof str !== 'string') return;
  for (let i = 0; i < fog.length; i++) { const b = parseInt(str.substr((i >> 3) * 2, 2), 16) || 0; fog[i] = (b >> (i & 7)) & 1; }
}
function fogAt(x, y) { return fog[clamp(Math.floor(y / FOG_C), 0, FH - 1) * FW + clamp(Math.floor(x / FOG_C), 0, FW - 1)]; }
