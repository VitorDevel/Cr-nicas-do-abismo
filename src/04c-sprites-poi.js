/* ---------- variantes de itens do mundo ---------- */
for (const m of Object.keys(MATERIALS)) SPR['node_' + m] = (g, s, v, r, pal) => SPR.node(g, s, v, r, pal, m);
SPR.chest_open = (g, s, v, r) => { shadowE(g, s * .95, s * .25); const w = s * .9, h = s * .55, c = v ? ['#4a3a6a', '#6a5a9a', '#c8b040'] : ['#7a4a22', '#a8683a', '#e8c04a'];
  g.fillStyle = c[0]; g.beginPath(); g.moveTo(-w, -h * 1.1); g.quadraticCurveTo(-w * 1.05, -h * 2.1, -w * .2, -h * 2.15); g.lineTo(w * .2, -h * 1.9); g.quadraticCurveTo(w * .9, -h * 1.8, w, -h * 1.1); g.closePath(); g.fill();
  g.fillStyle = c[0]; g.beginPath(); g.roundRect(-w, -h, w * 2, h, 3); g.fill(); g.fillStyle = '#16100a'; g.fillRect(-w + 3, -h + 2, w * 2 - 6, h * .45); g.fillStyle = c[1]; g.fillRect(-w + 2, -h * .55, w * 2 - 4, h * .55 - 2); g.fillStyle = c[2]; g.fillRect(-w, -h * .55, w * 2, 3); circ(g, -w * .3, -h * .78, 3); circ(g, w * .2, -h * .82, 3.5); g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 1; g.strokeRect(-w, -h, w * 2, h); };
/* ---------- construções ---------- */
const HOUSE_STYLE = {
  meadow: { wall: '#e8dcc0', wall2: '#cbb894', beam: '#6a4a2a', roof: ['#b84a3a', '#8a3a2e', '#d86a52'], kind: 'timber' },
  forest: { wall: '#c4a878', wall2: '#a88a5a', beam: '#4a3220', roof: ['#4a7a4a', '#34603a', '#6aa264'], kind: 'timber' },
  marsh: { wall: '#9a8a64', wall2: '#7a6c4a', beam: '#3a2c1a', roof: ['#6a7a4a', '#4a5a34', '#8a9a62'], kind: 'timber' },
  coast: { wall: '#f0e8d8', wall2: '#d0c4a8', beam: '#7a5a3a', roof: ['#3a78a8', '#2a5a84', '#5a9ac8'], kind: 'timber' },
  jungle: { wall: '#b8a060', wall2: '#8a7a40', beam: '#4a3a1a', roof: ['#6a8a2a', '#4a6a1c', '#98b44a'], kind: 'thatch' },
  dunes: { wall: '#ecd09a', wall2: '#c8aa72', beam: '#8a5a2a', roof: ['#d86a3a', '#b84a28', '#f09258'], kind: 'adobe' },
  canyon: { wall: '#d4906a', wall2: '#a86a48', beam: '#5a2a1a', roof: ['#8a4a32', '#6a3422', '#b0684a'], kind: 'adobe' },
  frost: { wall: '#9a7a58', wall2: '#7a5c3c', beam: '#4a3220', roof: ['#f0f6fc', '#c4d4e4', '#ffffff'], kind: 'snow' },
  mountain: { wall: '#9aa0a8', wall2: '#788088', beam: '#3a3a44', roof: ['#5a6474', '#424c5a', '#7a8698'], kind: 'stone' },
  volcano: { wall: '#4a4248', wall2: '#322c32', beam: '#1a1418', roof: ['#6a2a20', '#4a1c16', '#a8442a'], kind: 'stone' },
  storm: { wall: '#8a98a0', wall2: '#6a7880', beam: '#3a4650', roof: ['#3a8a9a', '#2a6a78', '#62b4c4'], kind: 'stone' },
  ash: { wall: '#6a6a78', wall2: '#4a4a58', beam: '#2a2a34', roof: ['#3a3646', '#2a2636', '#58526a'], kind: 'stone' },
  crystal: { wall: '#e8dcf4', wall2: '#c4b4dc', beam: '#8a6ab0', roof: ['#b070d8', '#8a4eb4', '#e0a0f4'], kind: 'crystal' },
  arcane: { wall: '#c8c4e8', wall2: '#9c98c4', beam: '#4a3a8a', roof: ['#4a4ab4', '#34348a', '#7a7ae0'], kind: 'crystal' }
};
const SIGNS = { 4: ['#e8b04a', 'mug'], 5: ['#8a8a96', 'anvil'], 6: ['#7ad6a0', 'potion'], 7: ['#f4f4f4', 'cross'], 8: ['#b080ff', 'flask'], 9: ['#8ac0ff', 'book'] };
function drawSignIcon(g, kind, x, y, u) {
  g.save(); g.translate(x, y); g.fillStyle = '#2a1c10'; g.strokeStyle = '#2a1c10'; g.lineWidth = 1.5;
  if (kind === 'mug') { g.fillStyle = '#e8c070'; g.fillRect(-u * .5, -u * .55, u, u * 1.0); g.fillStyle = '#fff'; g.fillRect(-u * .5, -u * .6, u, u * .25); g.strokeStyle = '#e8c070'; g.lineWidth = 2; g.beginPath(); g.arc(u * .6, -u * .05, u * .3, -1.4, 1.4); g.stroke(); }
  else if (kind === 'anvil') { g.fillStyle = '#c0c0cc'; g.fillRect(-u * .7, -u * .5, u * 1.4, u * .35); g.fillRect(-u * .3, -u * .15, u * .6, u * .4); g.fillRect(-u * .55, u * .25, u * 1.1, u * .2); }
  else if (kind === 'potion') { g.fillStyle = '#6aeaa8'; g.beginPath(); g.moveTo(-u * .15, -u * .6); g.lineTo(u * .15, -u * .6); g.lineTo(u * .15, -u * .2); g.lineTo(u * .55, u * .5); g.lineTo(-u * .55, u * .5); g.lineTo(-u * .15, -u * .2); g.fill(); g.fillStyle = '#c8a064'; g.fillRect(-u * .18, -u * .8, u * .36, u * .22); }
  else if (kind === 'cross') { g.fillStyle = '#e83a4a'; g.fillRect(-u * .18, -u * .6, u * .36, u * 1.2); g.fillRect(-u * .6, -u * .18, u * 1.2, u * .36); }
  else if (kind === 'flask') { g.fillStyle = '#c090ff'; g.beginPath(); g.arc(0, u * .2, u * .5, 0, TAU); g.fill(); g.fillStyle = '#e8d0ff'; g.fillRect(-u * .14, -u * .6, u * .28, u * .5); }
  else if (kind === 'book') { g.fillStyle = '#4a6ab0'; g.fillRect(-u * .6, -u * .45, u * 1.2, u * .9); g.fillStyle = '#e8e0c8'; g.fillRect(-u * .5, -u * .35, u * 1.0, u * .7); g.fillStyle = '#4a6ab0'; g.fillRect(-u * .04, -u * .35, u * .08, u * .7); }
  g.restore();
}
SPR.house = (g, s, v, r, pal) => {
  const b = Object.keys(BIOMES).find(k => BIOMES[k] === pal) || 'meadow', st = HOUSE_STYLE[b] || HOUSE_STYLE.meadow, w = s * 1.0, wh = s * .78, vv = v % 4, sign = SIGNS[v];
  const roof = st.roof; const rk = st.kind;
  shadowE(g, w * 1.15, s * .3, .32, s * .1);
  if (rk === 'thatch') { g.fillStyle = '#4a3a1a'; for (const x of [-w * .8, -w * .3, w * .3, w * .8]) g.fillRect(x - 3, -s * .3, 6, s * .3); }
  const by = rk === 'thatch' ? -s * .3 : 0;
  g.save(); g.translate(0, by);
  // paredes
  g.fillStyle = grad(g, 0, -wh, 0, 0, [st.wall, st.wall, st.wall2]); g.fillRect(-w, -wh, w * 2, wh); g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(w - s * .22, -wh, s * .22, wh);
  g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 1.4; g.strokeRect(-w, -wh, w * 2, wh);
  if (rk === 'timber' || rk === 'snow' || rk === 'thatch') { g.fillStyle = st.beam; g.fillRect(-w, -wh, 5, wh); g.fillRect(w - 5, -wh, 5, wh); g.fillRect(-w, -wh * .52, w * 2, 4); g.fillRect(-w, -5, w * 2, 5); g.fillRect(-w * .28, -wh, 4, wh); g.fillRect(w * .26, -wh, 4, wh); g.strokeStyle = st.beam; g.lineWidth = 3; g.beginPath(); g.moveTo(-w + 5, -wh * .52); g.lineTo(-w * .28, -wh); g.moveTo(w - 5, -wh * .52); g.lineTo(w * .26, -wh); g.stroke(); }
  if (rk === 'stone' || rk === 'adobe' || rk === 'crystal') { g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = 1; for (let y = 0; y < 6; y++) { g.beginPath(); g.moveTo(-w, -wh + y * wh / 6); g.lineTo(w, -wh + y * wh / 6); g.stroke(); for (let x = -w + ((y % 2) * 12); x < w; x += 24) { g.beginPath(); g.moveTo(x, -wh + y * wh / 6); g.lineTo(x, -wh + (y + 1) * wh / 6); g.stroke(); } } g.fillStyle = st.beam; g.fillRect(-w - 3, -5, w * 2 + 6, 5); }
  // porta
  const dx = (vv % 2 ? -1 : 1) * w * .32; g.fillStyle = '#2a1c10'; g.beginPath(); g.roundRect(dx - s * .2, -s * .52, s * .4, s * .52, [s * .2, s * .2, 0, 0]); g.fill(); g.fillStyle = '#7a4e28'; g.beginPath(); g.roundRect(dx - s * .16, -s * .48, s * .32, s * .48, [s * .16, s * .16, 0, 0]); g.fill(); g.strokeStyle = '#3a2410'; g.lineWidth = 1; g.beginPath(); g.moveTo(dx, -s * .48); g.lineTo(dx, 0); g.stroke(); g.fillStyle = '#e8c040'; circ(g, dx + s * .08, -s * .24, 1.6); g.fillStyle = '#5a5a5a'; g.fillRect(dx - s * .3, 0, s * .6, 4);
  // janelas
  const wx = -dx * 1.4, ww = s * .22; g.fillStyle = st.beam; g.fillRect(wx - ww - 3, -wh * .72 - 3, ww * 2 + 6, wh * .4 + 6); g.fillStyle = grad(g, 0, -wh * .72, 0, -wh * .32, ['#fff0b0', '#ffc860']); g.fillRect(wx - ww, -wh * .72, ww * 2, wh * .4); g.fillStyle = st.beam; g.fillRect(wx - 1, -wh * .72, 2, wh * .4); g.fillRect(wx - ww, -wh * .52 - 1, ww * 2, 2);
  g.fillStyle = '#d84a5a'; g.fillRect(wx - ww - 3, -wh * .3, ww * 2 + 6, 5); g.fillStyle = '#ff8aa8'; for (let i = 0; i < 4; i++) circ(g, wx - ww + i * ww * .66, -wh * .3 - 1, 2.2); g.fillStyle = '#3a6a2a'; for (let i = 0; i < 4; i++) ell(g, wx - ww + i * ww * .66, -wh * .3 + 2, 2.8, 1.6);
  if (sign) { g.fillStyle = '#3a2a1a'; g.fillRect(-w * .05, -wh - 4, 2, 4); g.fillStyle = '#5a3e22'; g.fillRect(w * .5 - 2, -wh * .95, 3, wh * .55); g.fillStyle = '#6a4a2a'; g.fillRect(w * .5, -wh * .95, s * .6, 3); g.fillStyle = '#4a3220'; g.beginPath(); g.roundRect(w * .5 + 2, -wh * .88, s * .52, s * .5, 3); g.fill(); g.fillStyle = sign[0]; g.beginPath(); g.roundRect(w * .5 + 4, -wh * .86, s * .48, s * .46, 2); g.fill(); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(w * .5 + 4, -wh * .86, s * .48, s * .46); drawSignIcon(g, sign[1], w * .5 + 2 + s * .26, -wh * .65, s * .2); }
  g.restore();
  // telhado
  g.save(); g.translate(0, by - wh);
  const rh = rk === 'adobe' ? s * .16 : rk === 'crystal' ? s * .85 : s * .72, ov = s * .16;
  if (rk === 'adobe') { g.fillStyle = roof[1]; g.fillRect(-w - ov, -rh, w * 2 + ov * 2, rh + 3); g.fillStyle = roof[0]; g.fillRect(-w - ov, -rh, w * 2 + ov * 2, rh * .6); g.fillStyle = roof[2]; g.fillRect(-w - ov, -rh, w * 2 + ov * 2, 3); g.fillStyle = st.beam; for (let i = 0; i < 7; i++) g.fillRect(-w + i * w * 2 / 6 - 3, 0, 6, 6);
    g.fillStyle = vv % 2 ? '#d8402a' : '#2a8ad8'; for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#fff4d8' : (vv % 2 ? '#d8402a' : '#2a8ad8'); g.fillRect(-w * .6 + i * w * .15, s * .45, w * .15, s * .22); } }
  else { poly(g, [[-w - ov, 2], [-w * .5, -rh], [w * .5, -rh], [w + ov, 2]], roof[0], 'rgba(0,0,0,.6)', 1.5); poly(g, [[w * .1, 2], [w + ov, 2], [w * .5, -rh], [w * .15, -rh]], 'rgba(0,0,0,.2)');
    g.save(); g.beginPath(); g.moveTo(-w - ov, 2); g.lineTo(-w * .5, -rh); g.lineTo(w * .5, -rh); g.lineTo(w + ov, 2); g.closePath(); g.clip();
    g.strokeStyle = roof[1]; g.lineWidth = 1.4; const rows = rk === 'thatch' ? 9 : 6; for (let i = 1; i < rows; i++) { const y = 2 - i * (rh + 2) / rows; g.beginPath(); g.moveTo(-w - ov, y); g.lineTo(w + ov, y); g.stroke(); const off = (i % 2) * 8; for (let x = -w - ov + off; x < w + ov; x += 16) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + (rh + 2) / rows); g.stroke(); } }
    if (rk === 'snow') { g.fillStyle = '#f8fcff'; g.beginPath(); g.moveTo(-w - ov, 2); g.lineTo(-w * .5, -rh); g.lineTo(w * .5, -rh); g.lineTo(w + ov, 2); g.quadraticCurveTo(w * .6, -rh * .5, w * .2, -rh * .45); g.quadraticCurveTo(-w * .3, -rh * .62, -w * .7, -rh * .3); g.quadraticCurveTo(-w * .95, -rh * .1, -w - ov, 2); g.fill(); }
    g.restore(); g.fillStyle = roof[2]; g.fillRect(-w * .5, -rh - 2, w, 4); g.strokeStyle = roof[2]; g.lineWidth = 2; g.beginPath(); g.moveTo(-w - ov, 2); g.lineTo(-w * .5, -rh); g.stroke();
    if (rk === 'crystal') { crystalShape(g, 0, -rh, s * .75, s * .16, roof[2], 0, true); crystalShape(g, -w * .4, -rh * .6, s * .4, s * .1, roof[2], -.3, false); }
    if (vv < 2 && rk !== 'crystal') { const cx = (vv ? -1 : 1) * w * .52; g.fillStyle = st.wall2; g.fillRect(cx - s * .12, -rh * .98 - s * .26, s * .24, s * .46); g.fillStyle = '#2a2020'; g.fillRect(cx - s * .15, -rh * .98 - s * .3, s * .3, s * .08); } }
  g.restore();
};
SPR.well = (g, s, v, r) => { shadowE(g, s * .95, s * .28); g.fillStyle = '#8a8a82'; ell(g, 0, -s * .1, s * .75, s * .34); g.fillStyle = '#6a6a64'; g.beginPath(); g.moveTo(-s * .75, -s * .1); g.lineTo(-s * .75, -s * .55); g.ellipse(0, -s * .55, s * .75, s * .34, 0, Math.PI, 0, true); g.lineTo(s * .75, -s * .1); g.ellipse(0, -s * .1, s * .75, s * .34, 0, 0, Math.PI); g.closePath(); g.fill(); g.fillStyle = '#a4a49a'; ell(g, 0, -s * .55, s * .75, s * .34); g.fillStyle = '#0e2a3a'; ell(g, 0, -s * .55, s * .58, s * .25); g.fillStyle = 'rgba(120,200,240,.5)'; ell(g, -s * .1, -s * .6, s * .3, s * .08);
  g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1; for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI; g.beginPath(); g.moveTo(Math.cos(a) * s * .75, -s * .1 + Math.sin(a) * s * .34); g.lineTo(Math.cos(a) * s * .75, -s * .55 + Math.sin(a) * s * .34); g.stroke(); }
  g.fillStyle = '#5a3e22'; g.fillRect(-s * .72, -s * 1.5, 5, s * .95); g.fillRect(s * .68, -s * 1.5, 5, s * .95); poly(g, [[-s * .9, -s * 1.5], [0, -s * 1.95], [s * .9, -s * 1.5]], '#a8483a', '#2a0e0a', 1.4); poly(g, [[0, -s * 1.95], [s * .9, -s * 1.5], [s * .1, -s * 1.5]], 'rgba(0,0,0,.2)'); g.strokeStyle = '#e8d8a0'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -s * 1.52); g.lineTo(0, -s * .85); g.stroke(); g.fillStyle = '#7a5a30'; g.fillRect(-s * .1, -s * .88, s * .2, s * .16); };
SPR.stall = (g, s, v, r) => { shadowE(g, s * 1.1, s * .3); const c1 = [['#d8402a', '#fff4d8'], ['#2a7ad8', '#fff4d8'], ['#3aa85a', '#fff4d8'], ['#a84ad8', '#fff4d8']][v % 4];
  g.fillStyle = '#6a4a2a'; g.fillRect(-s * .95, -s * .55, s * 1.9, s * .55); g.fillStyle = '#8a6a3e'; g.fillRect(-s * .95, -s * .6, s * 1.9, s * .12); g.fillStyle = '#4a3220'; g.fillRect(-s * .95, -s * 1.5, 4, s * 1.0); g.fillRect(s * .95 - 4, -s * 1.5, 4, s * 1.0);
  const items = [['#e84a4a', '#ff8a6a'], ['#e8c040', '#fff0a0'], ['#6ad87a', '#b8f4c0'], ['#8a6ae8', '#c8b4ff']]; for (let i = 0; i < 5; i++) { const x = -s * .75 + i * s * .38, it = items[(i + v) % 4]; g.fillStyle = it[0]; circ(g, x, -s * .68, s * .13); g.fillStyle = it[1]; circ(g, x - 2, -s * .72, s * .045); }
  const n = 8; for (let i = 0; i < n; i++) { const x0 = -s * 1.05 + i * s * 2.1 / n, x1 = x0 + s * 2.1 / n; g.fillStyle = c1[i % 2]; g.beginPath(); g.moveTo(x0, -s * 1.5); g.lineTo(x1, -s * 1.5); g.lineTo(x1 + (i - 3.5) * 1.3, -s * 1.02); g.lineTo(x0 + (i - 3.5) * 1.3, -s * 1.02); g.fill(); g.beginPath(); g.arc((x0 + x1) / 2 + (i - 3.5) * 1.3, -s * 1.02, s * 2.1 / n / 2, 0, Math.PI); g.fill(); }
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(-s * 1.05, -s * 1.5, s * 2.1, s * .12); g.fillStyle = '#4a3220'; g.fillRect(-s * 1.05, -s * 1.54, s * 2.1, 4); };
SPR.sign = (g, s, v, r) => { shadowE(g, s * .5, s * .15, .25); g.fillStyle = '#4a3220'; g.fillRect(-2, -s * 1.5, 4, s * 1.5); g.fillStyle = '#7a5630'; g.beginPath(); g.roundRect(-s * .55, -s * 1.5, s * 1.1, s * .5, 3); g.fill(); g.fillStyle = '#9a7240'; g.fillRect(-s * .5, -s * 1.46, s, s * .12); g.fillStyle = '#3a2814'; g.fillRect(-s * .4, -s * 1.22, s * .8, 2); g.fillRect(-s * .3, -s * 1.12, s * .6, 2); g.strokeStyle = '#2a1c10'; g.lineWidth = 1; g.beginPath(); g.roundRect(-s * .55, -s * 1.5, s * 1.1, s * .5, 3); g.stroke(); };
SPR.lamp = (g, s, v, r) => { shadowE(g, s * .4, s * .13, .25); g.fillStyle = '#2e2a30'; g.fillRect(-2.5, -s * 1.9, 5, s * 1.9); g.fillRect(-s * .18, -s * .12, s * .36, s * .12); g.fillRect(-s * .14, -s * 1.95, s * .28, 4); glowDot(g, 0, -s * 2.15, s * 2.2, 'rgba(255,200,110,.32)'); g.fillStyle = '#ffd886'; g.beginPath(); g.roundRect(-s * .12, -s * 2.3, s * .24, s * .34, 3); g.fill(); g.fillStyle = '#fff8d0'; g.fillRect(-s * .05, -s * 2.24, s * .1, s * .2); g.fillStyle = '#2e2a30'; g.beginPath(); g.moveTo(-s * .16, -s * 2.3); g.lineTo(0, -s * 2.5); g.lineTo(s * .16, -s * 2.3); g.fill(); };
SPR.fountain = (g, s, v, r) => { shadowE(g, s * 1.3, s * .45); g.fillStyle = '#8a8c86'; ell(g, 0, -s * .1, s * 1.1, s * .5); g.fillStyle = '#a8aaa2'; g.beginPath(); g.moveTo(-s * 1.1, -s * .1); g.lineTo(-s * 1.1, -s * .4); g.ellipse(0, -s * .4, s * 1.1, s * .5, 0, Math.PI, 0, true); g.lineTo(s * 1.1, -s * .1); g.ellipse(0, -s * .1, s * 1.1, s * .5, 0, 0, Math.PI); g.fill(); g.fillStyle = '#c4c6bc'; ell(g, 0, -s * .4, s * 1.1, s * .5); g.fillStyle = '#3a9ac8'; ell(g, 0, -s * .4, s * .92, s * .4); g.fillStyle = 'rgba(190,240,255,.5)'; ell(g, -s * .2, -s * .46, s * .5, s * .12);
  g.fillStyle = '#a8aaa2'; g.fillRect(-s * .14, -s * 1.3, s * .28, s * .9); ell(g, 0, -s * 1.3, s * .4, s * .15); g.fillStyle = '#c4c6bc'; ell(g, 0, -s * 1.34, s * .34, s * .11); g.fillStyle = '#6ac8f0'; ell(g, 0, -s * 1.36, s * .26, s * .07); g.strokeStyle = 'rgba(190,240,255,.85)'; g.lineWidth = 2; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(0, -s * 1.5); g.quadraticCurveTo(i * s * .35, -s * 1.9, i * s * .55, -s * .55); g.stroke(); } };
SPR.statue = (g, s, v, r) => { shadowE(g, s * .8, s * .25); poly(g, [[-s * .6, 0], [-s * .5, -s * .5], [s * .5, -s * .5], [s * .6, 0]], '#7a7a82', '#10101a'); poly(g, [[-s * .4, -s * .5], [-s * .35, -s * .7], [s * .35, -s * .7], [s * .4, -s * .5]], '#8a8a94', '#10101a'); g.fillStyle = grad(g, -s * .3, 0, s * .3, 0, ['#9a9aa6', '#d4d4de', '#8a8a96']); g.beginPath(); g.moveTo(-s * .26, -s * .7); g.quadraticCurveTo(-s * .3, -s * 1.3, -s * .12, -s * 1.5); g.lineTo(s * .12, -s * 1.5); g.quadraticCurveTo(s * .3, -s * 1.3, s * .26, -s * .7); g.fill(); g.fillStyle = '#c4c4d0'; circ(g, 0, -s * 1.68, s * .2); g.strokeStyle = '#c4c4d0'; g.lineWidth = s * .08; g.beginPath(); g.moveTo(s * .2, -s * 1.3); g.lineTo(s * .55, -s * 2.1); g.stroke(); g.fillStyle = '#e8e8f4'; poly(g, [[s * .5, -s * 2.0], [s * .6, -s * 2.0], [s * .55, -s * 2.4]], g.fillStyle); };
SPR.shrine = (g, s, v, r) => { shadowE(g, s * 1.0, s * .32); g.fillStyle = '#6a6a78'; ell(g, 0, 0, s * .95, s * .36); g.fillStyle = '#8a8a9a'; ell(g, 0, -s * .06, s * .85, s * .3); g.strokeStyle = '#7ae6c8'; g.lineWidth = 1.6; g.shadowColor = '#7ae6c8'; g.shadowBlur = 8; g.beginPath(); g.ellipse(0, -s * .06, s * .65, s * .22, 0, 0, TAU); g.stroke(); g.shadowBlur = 0;
  poly(g, [[-s * .2, -s * .05], [-s * .16, -s * 1.2], [0, -s * 1.5], [s * .16, -s * 1.2], [s * .2, -s * .05]], '#b4b4c8', '#10101a'); poly(g, [[0, -s * .05], [s * .2, -s * .05], [s * .16, -s * 1.2], [0, -s * 1.5]], 'rgba(0,0,0,.25)'); glowDot(g, 0, -s * 1.1, s * 1.2, 'rgba(122,230,200,.4)'); g.fillStyle = '#d8fff4'; circ(g, 0, -s * 1.1, s * .1); for (const sx of [-1, 1]) { g.fillStyle = '#7ae6c8'; circ(g, sx * s * .7, -s * .2, 2); } };
SPR.fence = (g, s, v, r) => { g.fillStyle = 'rgba(8,10,16,.25)'; ell(g, 0, 2, s * 1.1, s * .1); g.fillStyle = '#7a5a34'; for (const x of [-s, 0, s]) { g.fillRect(x - 2.5, -s * .75, 5, s * .75); g.fillStyle = '#9a7444'; g.fillRect(x - 2.5, -s * .75, 2, s * .75); g.fillStyle = '#7a5a34'; } g.fillStyle = '#8a6a3e'; g.fillRect(-s, -s * .58, s * 2, 4); g.fillRect(-s, -s * .3, s * 2, 4); g.fillStyle = '#a88450'; g.fillRect(-s, -s * .58, s * 2, 1.5); g.fillRect(-s, -s * .3, s * 2, 1.5); };
SPR.cart = (g, s, v, r) => { shadowE(g, s * 1.0, s * .26); g.fillStyle = '#6a4a2a'; g.beginPath(); g.moveTo(-s * .8, -s * .4); g.lineTo(s * .8, -s * .4); g.lineTo(s * .65, -s * .95); g.lineTo(-s * .65, -s * .95); g.fill(); g.fillStyle = '#8a6a3e'; g.fillRect(-s * .8, -s * .45, s * 1.6, s * .12); g.fillStyle = '#e0b84a'; for (let i = 0; i < 5; i++) ell(g, -s * .5 + i * s * .25, -s * .98, s * .16, s * .09); g.fillStyle = '#3a2814'; for (const x of [-s * .45, s * .45]) { circ(g, x, -s * .22, s * .28); g.fillStyle = '#6a4a2a'; circ(g, x, -s * .22, s * .2); g.fillStyle = '#3a2814'; circ(g, x, -s * .22, s * .06); } g.strokeStyle = '#4a3220'; g.lineWidth = 3; g.beginPath(); g.moveTo(-s * .8, -s * .5); g.lineTo(-s * 1.4, -s * .1); g.stroke(); };
SPR.haybale = (g, s, v, r) => { shadowE(g, s * .8, s * .2); g.fillStyle = grad(g, 0, -s * .9, 0, 0, ['#f0d070', '#d4aa3a']); g.beginPath(); g.roundRect(-s * .7, -s * .85, s * 1.4, s * .85, 4); g.fill(); g.strokeStyle = '#8a6a1a'; g.lineWidth = 1.5; for (const x of [-.4, .4]) { g.beginPath(); g.moveTo(s * x, -s * .85); g.lineTo(s * x, 0); g.stroke(); } g.strokeStyle = 'rgba(140,100,20,.6)'; g.lineWidth = 1; for (let i = 0; i < 12; i++) { const x = -s * .65 + r() * s * 1.3; g.beginPath(); g.moveTo(x, -s * .8 + r() * 6); g.lineTo(x + (r() - .5) * 6, -r() * s * .5); g.stroke(); } };
SPR.dgate = (g, s, v, r) => {
  const d = v === 99 ? ONI_DUNGEON : (DUNGEONS[v] || DUNGEONS[0]), col = d.acc, wall = v === 99 ? '#2a2038' : '#6a6a70', w = s * 1.1;
  shadowE(g, w * 1.3, s * .4, .4);
  poly(g, [[-w * 1.15, 0], [-w * 1.15, -s * 1.5], [-w * .75, -s * 1.9], [w * .75, -s * 1.9], [w * 1.15, -s * 1.5], [w * 1.15, 0]], wall, '#08080e', 1.6);
  poly(g, [[0, 0], [w * 1.15, 0], [w * 1.15, -s * 1.5], [w * .75, -s * 1.9], [0, -s * 1.9]], 'rgba(0,0,0,.25)');
  g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = 1; for (let y = 0; y < 7; y++) { g.beginPath(); g.moveTo(-w * 1.15, -y * s * .27); g.lineTo(w * 1.15, -y * s * .27); g.stroke(); }
  g.fillStyle = '#0a060e'; g.beginPath(); g.moveTo(-w * .6, 0); g.lineTo(-w * .6, -s * 1.05); g.quadraticCurveTo(-w * .6, -s * 1.65, 0, -s * 1.65); g.quadraticCurveTo(w * .6, -s * 1.65, w * .6, -s * 1.05); g.lineTo(w * .6, 0); g.fill();
  const gr = g.createRadialGradient(0, -s * .6, 0, 0, -s * .6, s * 1.2); gr.addColorStop(0, alpha(col, .55)); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(-w * .6, 0); g.lineTo(-w * .6, -s * 1.05); g.quadraticCurveTo(-w * .6, -s * 1.65, 0, -s * 1.65); g.quadraticCurveTo(w * .6, -s * 1.65, w * .6, -s * 1.05); g.lineTo(w * .6, 0); g.fill();
  g.fillStyle = '#4a4a52'; for (let i = 0; i < 4; i++) g.fillRect(-w * .6 + i * w * .4, -s * .05 - i * 0, w * .4, 4); g.strokeStyle = col; g.lineWidth = 2.4; g.shadowColor = col; g.shadowBlur = 10; g.beginPath(); g.moveTo(-w * .6, 0); g.lineTo(-w * .6, -s * 1.05); g.quadraticCurveTo(-w * .6, -s * 1.65, 0, -s * 1.65); g.quadraticCurveTo(w * .6, -s * 1.65, w * .6, -s * 1.05); g.lineTo(w * .6, 0); g.stroke();
  g.lineWidth = 1.6; g.beginPath(); g.arc(0, -s * 1.78, s * .1, 0, TAU); g.moveTo(-w * .9, -s * 1.1); g.lineTo(-w * .9, -s * .5); g.moveTo(w * .9, -s * 1.1); g.lineTo(w * .9, -s * .5); g.stroke(); g.shadowBlur = 0;
  for (const sx of [-1, 1]) { g.fillStyle = '#3a3a42'; g.fillRect(sx * w * 1.0 - 5, -s * 2.2, 10, s * .55); g.fillStyle = col; circ(g, sx * w * 1.0, -s * 2.25, 4); glowDot(g, sx * w * 1.0, -s * 2.25, s * .9, alpha(col, .4)); }
};
SPR.oniseal = (g, s, v, r) => { g.fillStyle = 'rgba(4,0,10,.5)'; ell(g, 0, 0, s * 2.2, s * .8); const cols = ['#ff3c8e', '#a040ff']; for (let k = 0; k < 3; k++) { g.strokeStyle = cols[k % 2]; g.lineWidth = 2.4 - k * .4; g.shadowColor = cols[k % 2]; g.shadowBlur = 10; g.beginPath(); g.ellipse(0, 0, s * (2.0 - k * .5), s * (.72 - k * .18), 0, 0, TAU); g.stroke(); } g.shadowBlur = 0; g.strokeStyle = '#ff3c8e'; g.lineWidth = 1.6; for (let i = 0; i < 8; i++) { const a = i * TAU / 8; g.beginPath(); g.moveTo(Math.cos(a) * s * .6, Math.sin(a) * s * .22); g.lineTo(Math.cos(a) * s * 2.0, Math.sin(a) * s * .72); g.stroke(); } };

/* ============================================================
   OBJETOS ESTÁTICOS: aldeias, masmorras, arenas
   ============================================================ */
function buildPoiObjects() {
  staticObjs.length = 0;
  const add = (o) => { o.b = o.b || 'meadow'; o.ph = o.ph || 0; o.cr = o.cr || 0; staticObjs.push(o); return o; };
  const roadOk = (x, y, m = 60) => roadDist(x, y) > m && !(liqRaw(x, y) > .02);
  for (const p of POIS) {
    const rng = mulberry((hash2(p.x | 0, p.y | 0, 91) * 4294967296) | 0);
    if (p.type === 'village') {
      const v = p.village, b = v.biome, cx = p.x, cy = p.y, big = !!v.start;
      v.spots = []; v.houseList = [];
      add({ k: big ? 'fountain' : 'well', v: 0, x: cx, y: cy + 24, s: big ? 44 : 30, cr: big ? 46 : 26, b });
      if (big) { add({ k: 'statue', v: 0, x: cx, y: cy - 80, s: 30, cr: 16, b }); }
      const shrine = add({ k: 'shrine', v: 0, x: cx + (big ? 120 : 92), y: cy + 40, s: 26, cr: 16, b, shrine: v.id }); v.shrine = { x: shrine.x, y: shrine.y };
      // casas em anel elíptico
      const n = v.houses, rx = big ? 262 : 214, ry = rx * .66, a0 = rng() * TAU;
      const roles = v.npcs.slice(); const signOf = { inn: 4, blacksmith: 5, merchant: 6, healer: 7, alchemist: 8, sage: 9, cartographer: 9 };
      for (let i = 0; i < n; i++) {
        let a = a0 + i / n * TAU, hx, hy, ok = false;
        for (let t = 0; t < 14 && !ok; t++) { hx = cx + Math.cos(a) * rx * (1 + (i % 2) * .22); hy = cy + Math.sin(a) * ry * (1 + (i % 2) * .22) + 26; if (roadOk(hx, hy - 30, 74)) ok = true; else a += .12; }
        if (!ok) continue;
        const role = roles[i]; const sg = signOf[role]; const s = 54 + rng() * 16 + (role === 'inn' ? 10 : 0);
        const house = add({ k: 'house', v: sg || (i % 4), x: hx, y: hy, s, b, rect: [s * 1.9, s * .55], cr: s * 1.9 / 2 + s * .6 + 8, role }); v.houseList.push(house);
        if (role) v.spots.push({ role, x: hx + (house.v % 2 ? -1 : 1) * -s * .32 * (house.v % 2 ? 1 : 1), y: hy + 38 });
      }
      // barracas, lampiões, cercas, caixas
      const sn = big ? 4 : 2; for (let i = 0; i < sn; i++) { const a = a0 + .4 + i / sn * TAU, sx = cx + Math.cos(a) * 118, sy = cy + Math.sin(a) * 82 + 14; if (roadOk(sx, sy - 20, 50)) { add({ k: 'stall', v: i, x: sx, y: sy, s: 28, cr: 24, rect: [50, 12], b }); } }
      for (let i = 0; i < (big ? 10 : 6); i++) { const a = i / (big ? 10 : 6) * TAU + .2, lx = cx + Math.cos(a) * (rx * .66), ly = cy + Math.sin(a) * (ry * .66) + 10; if (roadOk(lx, ly - 20, 50)) add({ k: 'lamp', v: 0, x: lx, y: ly, s: 20, cr: 5, b, light: true }); }
      for (let i = 0; i < 5; i++) { const a = rng() * TAU, d = rx * (1.25 + rng() * .3), fx = cx + Math.cos(a) * d, fy = cy + Math.sin(a) * d * .7; if (roadOk(fx, fy, 70)) { const t = rng(); add({ k: t < .3 ? 'haybale' : t < .55 ? 'barrel' : t < .8 ? 'crate' : 'cart', v: 0, x: fx, y: fy, s: t > .8 ? 24 : 14, cr: t > .8 ? 20 : 10, b }); } }
      add({ k: 'sign', v: 0, x: cx - (big ? 330 : 262), y: cy + 150, s: 20, cr: 5, b }); add({ k: 'sign', v: 1, x: cx + (big ? 330 : 262), y: cy - 120, s: 20, cr: 5, b });
      // jardim de árvores no entorno
      const tab = OBJ_TABLE[b].list.filter(e => e[4] > 0 || e[0].includes('bush')).slice(0, 4);
      const nt = big ? 34 : 24; for (let i = 0; i < nt; i++) { const a = rng() * TAU, d = (big ? 390 : 330) + rng() * 190, tx = cx + Math.cos(a) * d, ty = cy + Math.sin(a) * d * .78; if (!roadOk(tx, ty, 82) || !tab.length) continue; const e = tab[(rng() * tab.length) | 0], s = e[2] + rng() * (e[3] - e[2]); add({ k: e[0], v: (rng() * 4) | 0, x: tx, y: ty, s, cr: e[4] ? s * e[4] * .55 : 0, b, deco: true }); }
      // pontos de NPC em volta da praça (sem casa)
      v.plaza = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + .4; v.plaza.push({ x: cx + Math.cos(a) * 104, y: cy + Math.sin(a) * 74 + 24 }); }
    } else if (p.type === 'dungeon' || p.type === 'abyss') {
      const d = p.dungeon, b = d.biome, idx = p.type === 'abyss' ? 99 : DUNGEONS.indexOf(d), s = p.type === 'abyss' ? 70 : 52;
      add({ k: 'dgate', v: idx, x: p.x, y: p.y + 40, s, cr: s * 1.2 + 6, rect: [s * 2.3, s * .5], b, dungeon: d.id, noShadow: true });
      if (p.type === 'abyss') { add({ k: 'oniseal', v: 0, x: p.x, y: p.y + 190, s: 120, b, flat: true }); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + .2; add({ k: 'voidspire', v: 0, x: p.x + Math.cos(a) * 360, y: p.y + Math.sin(a) * 250 + 40, s: 54, cr: 16, b }); } }
      else { const decoK = { forest: 'torchpost', ash: 'torchpost', volcano: 'torchpost', frost: 'snowrock', jungle: 'torchpost', dunes: 'obelisk', arcane: 'monolith', crystal: 'crystalcluster', marsh: 'torchpost', canyon: 'torchpost', mountain: 'torchpost', storm: 'rod', coast: 'torchpost', meadow: 'torchpost', abyss: 'voidspire' }[b] || 'torchpost';
        for (const sx of [-1, 1]) add({ k: decoK, v: 0, x: p.x + sx * 128, y: p.y + 72, s: 26, cr: 8, b });
        for (let i = 0; i < 6; i++) { const a = rng() * TAU, dd = 200 + rng() * 100; add({ k: i % 2 ? 'pillar' : 'bonepile', v: i % 2, x: p.x + Math.cos(a) * dd, y: p.y + Math.sin(a) * dd * .6 + 30, s: i % 2 ? 22 : 16, cr: i % 2 ? 8 : 0, b }); } }
    } else if (p.type === 'arena') {
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + .39; add({ k: 'pillar', v: i % 2, x: p.x + Math.cos(a) * 280, y: p.y + Math.sin(a) * 205, s: 30, cr: 10, b: 'ash' }); }
      add({ k: 'altar', v: 0, x: p.x, y: p.y + 6, s: 24, cr: 18, b: 'ash' });
    }
  }
  // objetos prontos são ordenados por y no desenho
}
