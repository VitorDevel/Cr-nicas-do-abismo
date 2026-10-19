/* ---------- pedaços do mundo: terreno pintado sob demanda ---------- */
const CH = 600, CWN = WORLD_W / CH, CHN = WORLD_H / CH;
const chunks = new Map(), chunkQueue = [];
const staticObjs = [];            // objetos de pontos de interesse (casas, portões…)
const taken = new Set();          // baús abertos / ninhos limpos (persistente)
const campsCleared = new Set();
const ckey = (cx, cy) => cx * 64 + cy;
const BRGB = {};
for (const b of BIOME_LIST) { const d = BIOMES[b]; BRGB[b] = { g: hexToRgb(d.g), g2: hexToRgb(d.g2), g3: hexToRgb(d.g3) }; }
const tmpGround = document.createElement('canvas');
const PXS = 4, PXN = CH / PXS + 2;
tmpGround.width = tmpGround.height = PXN;
const tmpCtx = tmpGround.getContext('2d');
const tmpImg = tmpCtx.createImageData(PXN, PXN);
const LAT = CH / GRID + 2;   // reticulado de células por pedaço
const latR = new Float32Array(LAT * LAT * 3), latLq = new Float32Array(LAT * LAT), latBA = new Uint8Array(LAT * LAT), latBB = new Uint8Array(LAT * LAT), latW = new Float32Array(LAT * LAT), latK = new Uint8Array(LAT * LAT);

function getChunk(cx, cy) {
  if (cx < 0 || cy < 0 || cx >= CWN || cy >= CHN) return null;
  const k = ckey(cx, cy); let c = chunks.get(k);
  if (!c) { c = { cx, cy, x: cx * CH, y: cy * CH, canvas: null, objs: [], solids: [], feats: [], npcs: [], gen: false, last: 0 }; chunks.set(k, c); generateChunkObjects(c); }
  return c;
}
function paintChunk(c) {
  if (c.canvas) return;
  const cv = document.createElement('canvas'); cv.width = cv.height = CH; const g = cv.getContext('2d');
  const gx0 = Math.floor(c.x / GRID) - 1, gy0 = Math.floor(c.y / GRID) - 1;
  for (let j = 0; j < LAT; j++) for (let i = 0; i < LAT; i++) {
    const ci = clamp(gy0 + j, 0, GH - 1) * GW + clamp(gx0 + i, 0, GW - 1), li = j * LAT + i;
    const A = BIOME_LIST[gBiomeA[ci]], B = BIOME_LIST[gBiomeB[ci]], w = gBlend[ci] / 255, a = BRGB[A].g, b = BRGB[B].g;
    latR[li * 3] = mix(a[0], b[0], w); latR[li * 3 + 1] = mix(a[1], b[1], w); latR[li * 3 + 2] = mix(a[2], b[2], w);
    latLq[li] = gLiq[ci]; latBA[li] = gBiomeA[ci]; latBB[li] = gBiomeB[ci]; latW[li] = w; latK[li] = gKind[ci];
  }
  const data = tmpImg.data;
  for (let j = 0; j < PXN; j++) {
    const y = c.y + (j - 1 + .5) * PXS, fy = (y - (gy0 + .5) * GRID) / GRID, jy = clamp(Math.floor(fy), 0, LAT - 2), ty = clamp(fy - jy, 0, 1);
    for (let i = 0; i < PXN; i++) {
      const x = c.x + (i - 1 + .5) * PXS, fx = (x - (gx0 + .5) * GRID) / GRID, ix = clamp(Math.floor(fx), 0, LAT - 2), tx = clamp(fx - ix, 0, 1);
      const l00 = jy * LAT + ix, l10 = l00 + 1, l01 = l00 + LAT, l11 = l01 + 1;
      const w00 = (1 - tx) * (1 - ty), w10 = tx * (1 - ty), w01 = (1 - tx) * ty, w11 = tx * ty;
      let r = latR[l00 * 3] * w00 + latR[l10 * 3] * w10 + latR[l01 * 3] * w01 + latR[l11 * 3] * w11;
      let gC = latR[l00 * 3 + 1] * w00 + latR[l10 * 3 + 1] * w10 + latR[l01 * 3 + 1] * w01 + latR[l11 * 3 + 1] * w11;
      let bl = latR[l00 * 3 + 2] * w00 + latR[l10 * 3 + 2] * w10 + latR[l01 * 3 + 2] * w01 + latR[l11 * 3 + 2] * w11;
      const li = ty < .5 ? (tx < .5 ? l00 : l10) : (tx < .5 ? l01 : l11);
      const dom = BIOME_LIST[latW[li] > .5 ? latBB[li] : latBA[li]], pal = BRGB[dom];
      const n1 = vnoise(x * .0055, y * .0055, 3) * .65 + vnoise(x * .021, y * .021, 4) * .35;
      // variação geral do solo
      if (n1 > .52) { const t = (n1 - .52) * 2.4; r += (pal.g2[0] - r) * t; gC += (pal.g2[1] - gC) * t; bl += (pal.g2[2] - bl) * t; }
      else if (n1 < .42) { const t = (.42 - n1) * 2.8; r += (pal.g3[0] - r) * t; gC += (pal.g3[1] - gC) * t; bl += (pal.g3[2] - bl) * t; }
      const mn = (hash2(i, j, c.cx * 91 + c.cy * 17) - .5) * 9; r += mn; gC += mn; bl += mn;
      // efeitos próprios de cada bioma
      switch (dom) {
        case 'dunes': { const rp = .5 + .5 * Math.sin(x * .05 + n1 * 9 + y * .012); const k = (rp - .5) * 26; r += k; gC += k * .9; bl += k * .7; break; }
        case 'canyon': { const st = Math.sin(y * .045 + n1 * 7) * 18; r += st; gC += st * .6; bl += st * .4; break; }
        case 'volcano': { const rr = Math.abs(vnoise(x * .011, y * .011, 5) - .5); if (rr < .03) { const k = (1 - rr / .03); r += 255 * k * .9; gC += 90 * k; bl += 20 * k; } break; }
        case 'frost': { const k = (vnoise(x * .03, y * .03, 8) - .5) * 20; r += k * .5; gC += k * .8; bl += k; break; }
        case 'crystal': { const q = Math.floor(n1 * 7) / 7; const k = (q - .5) * 40; r += k * .6; gC += k * .8; bl += k; break; }
        case 'arcane': { if (hash2(i, j, 99) > .992) { r = 230; gC = 215; bl = 255; } else { const k = Math.sin(x * .012 + y * .016 + n1 * 5) * 10; r += k; bl += k * 1.4; } break; }
        case 'abyss': { const a = Math.atan2(y - ABYSS.y, x - ABYSS.x), d = Math.hypot(x - ABYSS.x, y - ABYSS.y), s = Math.sin(a * 5 + d * .03 + n1 * 6); if (s > .93) { r += 120; bl += 90; gC -= 10; } else { const k = s * 10; r += k; bl += k * 1.4; } break; }
        case 'marsh': { if (n1 < .36) { r -= 14; gC -= 6; bl += 10; } break; }
        case 'ash': { const k = (vnoise(x * .04, y * .04, 7) - .5) * 24; r += k; gC += k; bl += k * 1.1; break; }
        case 'storm': { const k = Math.sin(x * .03 - y * .02 + n1 * 6) * 8; r += k * .6; gC += k; bl += k; break; }
        case 'coast': { const k = Math.sin(x * .06 + y * .03 + n1 * 5) * 10; r += k; gC += k * .9; bl += k * .6; break; }
        default: break;
      }
      // líquidos
      const v = latLq[l00] * w00 + latLq[l10] * w10 + latLq[l01] * w01 + latLq[l11] * w11;
      if (v > 0) {
        const kd = LIQ_KINDS[latK[li] || latK[l00] || latK[l11] || 1] || 'water', L = LIQUIDS[kd];
        const sh = hexToRgb(L.shallow), md = hexToRgb(L.mid), dp = hexToRgb(L.deep), fm = hexToRgb(L.foam);
        let t = clamp(v / .5, 0, 1); t = t * t * (3 - 2 * t);
        let wr = mix(sh[0], md[0], t), wg = mix(sh[1], md[1], t), wb = mix(sh[2], md[2], t);
        if (v > .5) { const u = clamp((v - .5) / .35, 0, 1); wr = mix(wr, dp[0], u); wg = mix(wg, dp[1], u); wb = mix(wb, dp[2], u); }
        const wv = (vnoise(x * .02 + 3, y * .02, 33) - .5) * 16; wr += wv; wg += wv; wb += wv * 1.2;
        if (v < .07) { const f = (1 - v / .07) * .75; wr = mix(wr, fm[0], f); wg = mix(wg, fm[1], f); wb = mix(wb, fm[2], f); }
        const edge = smooth(0, .012, v); r = mix(r * .62, wr, edge); gC = mix(gC * .62, wg, edge); bl = mix(bl * .62, wb, edge);
      }
      const o = (j * PXN + i) * 4; data[o] = r; data[o + 1] = gC; data[o + 2] = bl; data[o + 3] = 255;
    }
  }
  tmpCtx.putImageData(tmpImg, 0, 0);
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(tmpGround, 0, 0, PXN, PXN, -PXS, -PXS, PXN * PXS, PXN * PXS);
  g.translate(-c.x, -c.y);
  paintGroundDecor(g, c);
  paintRoadsOnChunk(g, c);
  paintPoiGround(g, c);
  c.canvas = cv;
}
function paintRoadsOnChunk(g, c) {
  const x0 = c.x - 120, y0 = c.y - 120, x1 = c.x + CH + 120, y1 = c.y + CH + 120;
  g.lineCap = 'round'; g.lineJoin = 'round';
  const biome = biomeAt(c.x + CH / 2, c.y + CH / 2), pal = BIOMES[biome];
  const pass = (w, col, dash) => {
    g.lineWidth = w; g.strokeStyle = col; g.setLineDash(dash || []);
    for (const pts of roadPolys) {
      let on = false;
      for (let i = 0; i < pts.length - 1; i++) {
        const p = pts[i], q = pts[i + 1];
        if ((p.x < x0 && q.x < x0) || (p.x > x1 && q.x > x1) || (p.y < y0 && q.y < y0) || (p.y > y1 && q.y > y1)) { if (on) { g.stroke(); on = false; } continue; }
        if (!on) { g.beginPath(); g.moveTo(p.x, p.y); on = true; }
        const m = pts[i + 1], n = pts[i + 2] || m;
        g.quadraticCurveTo(q.x, q.y, (q.x + n.x) / 2, (q.y + n.y) / 2);
      }
      if (on) g.stroke();
    }
    g.setLineDash([]);
  };
  pass(78, mixHex(pal.path, '#1a1a14', .55));
  pass(66, pal.path);
  pass(52, shade(pal.path, .08));
  pass(5, shade(pal.path, -.22), [34, 22]);
  g.globalAlpha = .5; pass(2, shade(pal.path, .4), [4, 16]); g.globalAlpha = 1;
  // tábuas das pontes sobre a água
  for (const pts of roadPolys) for (let i = 0; i < pts.length - 1; i++) {
    const p = pts[i], q = pts[i + 1], mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
    if (mx < x0 || mx > x1 || my < y0 || my > y1 || liqRaw(mx, my) <= .02) continue;
    const a = Math.atan2(q.y - p.y, q.x - p.x), L = Math.hypot(q.x - p.x, q.y - p.y);
    g.save(); g.translate(mx, my); g.rotate(a);
    g.fillStyle = '#4a3420'; g.fillRect(-L / 2 - 4, -36, L + 8, 72);
    g.fillStyle = '#8a6a44'; g.fillRect(-L / 2 - 4, -32, L + 8, 64);
    g.fillStyle = '#a58458'; for (let x = -L / 2; x < L / 2; x += 11) g.fillRect(x, -32, 7, 64);
    g.fillStyle = '#5a4026'; g.fillRect(-L / 2 - 4, -38, L + 8, 6); g.fillRect(-L / 2 - 4, 32, L + 8, 6);
    g.restore();
  }
}
/* fila de pintura: um pedaço por quadro */
function requestChunkPaint(c) { if (!c.canvas && !c.queued) { c.queued = true; chunkQueue.push(c); } }
function processChunkQueue(budgetMs = 7) {
  const t0 = performance.now();
  while (chunkQueue.length && performance.now() - t0 < budgetMs) {
    chunkQueue.sort((a, b) => (Math.hypot(a.x + CH / 2 - camera.cx, a.y + CH / 2 - camera.cy) - Math.hypot(b.x + CH / 2 - camera.cx, b.y + CH / 2 - camera.cy)));
    const c = chunkQueue.shift(); c.queued = false; if (chunks.get(ckey(c.cx, c.cy)) === c) paintChunk(c);
  }
}
function updateChunksAround(x, y, radius = 2, sync = false) {
  const cx = Math.floor(x / CH), cy = Math.floor(y / CH);
  for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
    const c = getChunk(cx + dx, cy + dy); if (!c) continue; c.last = G.sceneT;
    if (!c.canvas) { if (sync || (Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && !c.queued && chunkQueue.length < 3)) paintChunk(c); else requestChunkPaint(c); }
  }
  for (const [k, c] of chunks) if (Math.abs(c.cx - cx) > radius + 2 || Math.abs(c.cy - cy) > radius + 2) { chunks.delete(k); }
}
function drawChunks(vx, vy, vw, vh) {
  const c0x = Math.max(0, Math.floor(vx / CH)), c1x = Math.min(CWN - 1, Math.floor((vx + vw) / CH)), c0y = Math.max(0, Math.floor(vy / CH)), c1y = Math.min(CHN - 1, Math.floor((vy + vh) / CH));
  for (let cy = c0y; cy <= c1y; cy++) for (let cx = c0x; cx <= c1x; cx++) {
    const c = chunks.get(ckey(cx, cy)); if (!c) continue;
    if (c.canvas) ctx.drawImage(c.canvas, c.x, c.y);
    else { const b = BIOMES[biomeAt(c.x + CH / 2, c.y + CH / 2)]; ctx.fillStyle = b.g; ctx.fillRect(c.x, c.y, CH + 1, CH + 1); requestChunkPaint(c); }
  }
  // oceano profundo fora do mundo
  ctx.fillStyle = '#12485f';
  if (vx < 0) ctx.fillRect(vx, vy, -vx, vh); if (vy < 0) ctx.fillRect(vx, vy, vw, -vy);
  if (vx + vw > WORLD_W) ctx.fillRect(WORLD_W, vy, vx + vw - WORLD_W, vh); if (vy + vh > WORLD_H) ctx.fillRect(vx, WORLD_H, vw, vy + vh - WORLD_H);
}

/* ---------- colisão com objetos estáticos ---------- */
function collideWorld(e, r) {
  const cx = Math.floor(e.x / CH), cy = Math.floor(e.y / CH);
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const c = chunks.get(ckey(cx + dx, cy + dy)); if (!c) continue;
    for (const o of c.solids) {
      const ox = e.x - o.x, oy = e.y - o.y, m = o.r + r;
      if (ox > m || ox < -m || oy > m || oy < -m) continue;
      const d2 = ox * ox + oy * oy; if (d2 >= m * m) continue;
      const d = Math.sqrt(d2) || .01; e.x = o.x + ox / d * m; e.y = o.y + oy / d * m;
    }
  }
  for (const o of staticObjs) {
    if (!o.cr) continue;
    const ox = e.x - o.x, oy = e.y - o.y, m = o.cr + r;
    if (ox > m || ox < -m || oy > m || oy < -m) continue;
    if (o.rect) { // retângulo (casas): centro da pegada = base - profundidade/2
      const hx = o.rect[0] / 2 + r, hy = o.rect[1] / 2 + r, cy = o.y - o.rect[1] / 2, py = e.y - cy;
      if (Math.abs(ox) < hx && Math.abs(py) < hy) { if (hx - Math.abs(ox) < hy - Math.abs(py)) e.x = o.x + sgn(ox) * hx; else e.y = cy + sgn(py) * hy; }
      continue;
    }
    const d2 = ox * ox + oy * oy; if (d2 >= m * m) continue;
    const d = Math.sqrt(d2) || .01; e.x = o.x + ox / d * m; e.y = o.y + oy / d * m;
  }
}
