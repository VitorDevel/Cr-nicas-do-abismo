/* ===== src/00-core.js ===== */
/* ============================================================
   Crônicas do Abismo — Ascensão Elemental (v3)
   Mundo aberto gigante · 15 biomas · 14 masmorras · Oni do Abismo
   ============================================================ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[(Math.random() * arr.length) | 0];
const pad2 = n => String(n).padStart(2, '0');
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angNorm = a => Math.atan2(Math.sin(a), Math.cos(a));
const angDiff = (a, b) => Math.abs(angNorm(a - b));
const angLerp = (a, b, t) => a + angNorm(b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const easeOut = t => 1 - (1 - t) * (1 - t);
const easeInOut = t => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const mix = (a, b, t) => a + (b - a) * t;
const sgn = v => (v < 0 ? -1 : 1);

/* ---------- RNG e ruído determinísticos ---------- */
function mulberry(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function hash2(x, y, s = 0) {
  let n = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1442695041);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x, y, s = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, s = 0, oct = 3) {
  let amp = .5, f = 1, sum = 0, norm = 0;
  for (let i = 0; i < oct; i++) { sum += vnoise(x * f, y * f, s + i * 17) * amp; norm += amp; amp *= .5; f *= 2.03; }
  return sum / norm;
}

/* ---------- cores ---------- */
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

/* ---------- configurações ---------- */
const SETTINGS_KEY = 'abismo-ow3-settings';
const SLOT_KEY = n => `abismo-ow3-slot-${n}`;
const SLOT_COUNT = 3;
const defaultSettings = {
  master: .8, sfx: 1, music: .55, shake: 1, damageNumbers: true, quality: 'alta', particles: 1, minimap: true,
  hudScale: 1, joyMode: 'flutuante', joySize: 1, joySide: 'esquerda', btnSize: 1, btnOpacity: .92, haptics: true,
  difficulty: 'normal', autoAim: true, autoAttack: false, controlMode: 'auto', showHints: true, showEnemyBars: true, lightFx: true, weather: true
};
const settings = Object.assign({}, defaultSettings);
try { Object.assign(settings, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); } catch (e) { /* sem storage */ }
const saveSettings = () => { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) { /* sem storage */ } };

const DIFFICULTY = {
  facil: { n: 'Explorador', d: 'Inimigos 25% mais fracos. Ideal para conhecer o mundo.', hp: .75, dmg: .7, xp: .9, coin: 1 },
  normal: { n: 'Aventureiro', d: 'A experiência equilibrada.', hp: 1, dmg: 1, xp: 1, coin: 1 },
  dificil: { n: 'Veterano', d: 'Inimigos mais resistentes e perigosos. +20% XP.', hp: 1.3, dmg: 1.3, xp: 1.2, coin: 1.15 },
  pesadelo: { n: 'Pesadelo', d: 'Para lendas. +45% XP e moedas, golpes brutais.', hp: 1.65, dmg: 1.75, xp: 1.45, coin: 1.45 }
};

/* ---------- elementos da interface ---------- */
const explorer = $('#explorer');
const canvas = $('#world');
const ctx = canvas.getContext('2d');
const mini = $('#minimap');
const miniCtx = mini.getContext('2d');
const el = {
  hud: $('#hud'), touch: $('#touchControls'), toast: $('#toast'), banner: $('#banner'), locBanner: $('#locBanner'),
  healthFill: $('#healthFill'), manaFill: $('#manaFill'), staminaFill: $('#staminaFill'), xpFill: $('#xpFill'),
  healthText: $('#healthText'), manaText: $('#manaText'), staminaText: $('#staminaText'), xpText: $('#xpText'),
  statusLevel: $('#statusLevel'), heroName: $('#heroName'), heroClass: $('#heroClass'), coins: $('#coins'), potionText: $('#potionText'), potionBadge: $('#potionBadge'),
  clock: $('#clock'), locationName: $('#locationName'), distance: $('#distance'), objective: $('#objectiveText'), objectiveTitle: $('#objectiveTitle'),
  enemyLabel: $('#enemyLabel'), enemyName: $('#enemyName'), enemyHealth: $('#enemyHealth'),
  bossBar: $('#bossBar'), bossName: $('#bossName'), bossHealth: $('#bossHealth'), bossGhost: $('#bossGhost'), bossPhase: $('#bossPhase'),
  statusEffects: $('#statusEffects'), dialog: $('#npcDialogue'), hint: $('#controlsHint'), portrait: $('#portrait'),
  attack: $('#attackButton'), skill: $('#skillButton'), skill2: $('#skill2Button'), ultimate: $('#ultimateButton'), dodge: $('#dodgeButton'), heal: $('#healButton'), interact: $('#interactButton'),
  btnAuto: $('#btnAuto'), loading: $('#loading'), loadingText: $('#loadingText'), loadBar: $('#loadBar')
};
const screens = {};
for (const id of ['mainMenu', 'loadScreen', 'settingsScreen', 'createScreen', 'pauseScreen', 'levelPanel', 'mapScreen', 'journalScreen', 'charScreen', 'shopScreen', 'resultScreen', 'helpScreen']) screens[id] = $('#' + id);

const domCache = new Map();
function setText(key, node, value) { const v = String(value); if (domCache.get(key) !== v) { domCache.set(key, v); node.textContent = v; } }
function setWidth(key, node, pct) { const v = `${clamp(pct, 0, 100).toFixed(1)}%`; if (domCache.get(key) !== v) { domCache.set(key, v); node.style.width = v; } }
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- estado global ---------- */
const G = {
  state: 'boot',            // boot | menu | play | dialog | ui
  paused: false, ui: null,  // tela aberta
  time: 0, playtime: 0, slot: 1, legend: false, hitstop: 0, uiBlock: 0,
  inDungeon: null, fade: null, splash: null, sceneT: 0
};
const camera = { x: 0, y: 0, cx: 0, cy: 0, w: 960, h: 540, scale: 1, shake: 0, lookX: 0, lookY: 0, zoom: 1 };
const keys = new Set();
const mouse = { x: 0, y: 0, wx: 0, wy: 0, down: false, active: false, moved: 0 };
const joy = { x: 0, y: 0, mag: 0, active: false, id: null };
const touch = { fire: false };
const isTouchDevice = () => (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window;
const bus = {};
const on = (n, f) => (bus[n] = bus[n] || []).push(f);
const emit = (n, ...a) => { for (const f of bus[n] || []) f(...a); };
const updateList = (list, fn) => { let j = 0; for (let i = 0; i < list.length; i++) { const o = list[i]; if (fn(o) !== false) list[j++] = o; } list.length = j; };

/* ===== src/01-audio.js ===== */
/* ---------- áudio: efeitos e música procedural ---------- */
let audioCtx = null, masterGain = null, sfxGain = null, musicGain = null, noiseBuf = null, lastSfx = {};
function ac() {
  if (!audioCtx) {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    audioCtx = new C();
    masterGain = audioCtx.createGain(); sfxGain = audioCtx.createGain(); musicGain = audioCtx.createGain();
    sfxGain.connect(masterGain); musicGain.connect(masterGain); masterGain.connect(audioCtx.destination);
    applyVolumes();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function applyVolumes() {
  if (!audioCtx) return;
  masterGain.gain.value = settings.master; sfxGain.gain.value = settings.sfx; musicGain.gain.value = settings.music * .55;
}
function tone(f0, f1, dur, type = 'sine', vol = .1, delay = 0, dest) {
  const a = ac(); if (!a) return;
  const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(dest || sfxGain); o.start(t); o.stop(t + dur + .03);
}
function noise(dur, vol = .08, freq = 1800, delay = 0, q = 1) {
  const a = ac(); if (!a) return;
  if (!noiseBuf) { noiseBuf = a.createBuffer(1, a.sampleRate, a.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const t = a.currentTime + delay, s = a.createBufferSource(); s.buffer = noiseBuf;
  const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  const g = a.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(sfxGain); s.start(t); s.stop(t + dur + .02);
}
const SFX = {
  swing: () => { noise(.12, .06, 2400); tone(420, 180, .1, 'triangle', .04); },
  swing2: () => { noise(.16, .08, 1800); tone(320, 120, .14, 'triangle', .05); },
  hit: () => { tone(190, 60, .12, 'square', .08); noise(.07, .07, 900); },
  crit: () => { tone(300, 70, .18, 'sawtooth', .09); tone(900, 1300, .1, 'sine', .06, .02); noise(.1, .08, 1400); },
  hurt: () => tone(140, 45, .25, 'sawtooth', .12),
  coin: () => { tone(880, 880, .07, 'sine', .05); tone(1320, 1320, .12, 'sine', .05, .06); },
  potion: () => { tone(400, 800, .25, 'sine', .08); tone(600, 1000, .25, 'sine', .05, .08); },
  dash: () => noise(.2, .07, 700),
  skill: () => { tone(220, 660, .3, 'sawtooth', .06); noise(.28, .08, 1200); },
  slam: () => { tone(90, 30, .4, 'sine', .2); noise(.3, .12, 300); },
  boom: () => { tone(70, 25, .6, 'sine', .25); noise(.5, .15, 200); },
  level: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, f, .22, 'triangle', .08, i * .1)),
  quest: () => [392, 523, 659].forEach((f, i) => tone(f, f, .25, 'sine', .08, i * .12)),
  death: () => tone(240, 40, .9, 'sawtooth', .12),
  shoot: () => { tone(900, 300, .1, 'triangle', .05); noise(.06, .04, 3000); },
  magic: () => { tone(500, 1200, .2, 'sine', .06); tone(700, 1500, .25, 'triangle', .03, .04); },
  zap: () => { noise(.15, .1, 3500, 0, 4); tone(1200, 200, .12, 'sawtooth', .05); },
  click: () => tone(660, 660, .05, 'square', .035),
  open: () => { tone(300, 500, .1, 'triangle', .05); tone(500, 800, .12, 'triangle', .04, .06); },
  chest: () => { [523, 659, 784, 988].forEach((f, i) => tone(f, f, .18, 'triangle', .07, i * .07)); },
  portal: () => { tone(160, 620, .6, 'sine', .09); noise(.5, .05, 900); },
  roar: () => { tone(110, 60, .7, 'sawtooth', .16); tone(90, 40, .8, 'square', .08, .05); noise(.6, .09, 400); },
  step: () => noise(.04, .015, 500),
  warn: () => { tone(300, 300, .08, 'square', .04); tone(260, 260, .1, 'square', .04, .1); },
  ice: () => { tone(1500, 900, .2, 'sine', .05); noise(.18, .05, 5000, 0, 3); },
  fire: () => { noise(.3, .08, 600, 0, 2); tone(180, 90, .3, 'sawtooth', .04); },
  heal: () => { tone(600, 900, .3, 'sine', .06); tone(800, 1200, .3, 'sine', .04, .1); }
};
function sfx(name) {
  if (settings.sfx <= 0 || !SFX[name]) return;
  const now = performance.now(); if (now - (lastSfx[name] || 0) < 35) return; lastSfx[name] = now;
  try { SFX[name](); } catch (e) { /* áudio indisponível */ }
}

/* ---- música gerativa ---- */
const SCALES = { maior: [0, 2, 4, 7, 9], menor: [0, 3, 5, 7, 10], frigio: [0, 1, 5, 7, 8], lidio: [0, 2, 4, 6, 7, 9], exo: [0, 2, 3, 6, 7, 9] };
const MOODS = {
  menu: { root: 45, scale: 'menor', tempo: 62, pad: 'sawtooth', arp: .5, drums: 0 },
  campos: { root: 50, scale: 'maior', tempo: 78, pad: 'triangle', arp: .8, drums: 0 },
  floresta: { root: 47, scale: 'lidio', tempo: 70, pad: 'triangle', arp: .7, drums: 0 },
  selva: { root: 52, scale: 'exo', tempo: 92, pad: 'triangle', arp: .9, drums: .3 },
  pantano: { root: 43, scale: 'frigio', tempo: 56, pad: 'sine', arp: .35, drums: 0 },
  deserto: { root: 46, scale: 'frigio', tempo: 74, pad: 'sawtooth', arp: .6, drums: .2 },
  gelo: { root: 55, scale: 'lidio', tempo: 58, pad: 'sine', arp: .55, drums: 0 },
  fogo: { root: 41, scale: 'frigio', tempo: 88, pad: 'sawtooth', arp: .7, drums: .5 },
  tempestade: { root: 48, scale: 'menor', tempo: 84, pad: 'square', arp: .8, drums: .4 },
  cristal: { root: 57, scale: 'lidio', tempo: 66, pad: 'sine', arp: 1, drums: 0 },
  arcano: { root: 51, scale: 'exo', tempo: 64, pad: 'triangle', arp: .9, drums: 0 },
  sombra: { root: 40, scale: 'menor', tempo: 52, pad: 'sawtooth', arp: .3, drums: 0 },
  masmorra: { root: 38, scale: 'menor', tempo: 60, pad: 'sawtooth', arp: .35, drums: .15 },
  chefe: { root: 38, scale: 'frigio', tempo: 112, pad: 'sawtooth', arp: .9, drums: 1 },
  oni: { root: 36, scale: 'exo', tempo: 124, pad: 'sawtooth', arp: 1, drums: 1.2 },
  noite: { root: 45, scale: 'menor', tempo: 54, pad: 'sine', arp: .4, drums: 0 }
};
const music = { mood: null, next: 0, step: 0, timer: 0, cur: null };
function setMood(name) {
  if (music.mood === name) return;
  music.mood = name; music.cur = MOODS[name] || MOODS.campos; music.step = 0;
}
function musicTick() {
  if (!audioCtx || settings.music <= 0 || !music.cur) return;
  const a = audioCtx, m = music.cur, beat = 60 / m.tempo;
  if (music.next < a.currentTime) music.next = a.currentTime + .05;
  while (music.next < a.currentTime + .6) {
    const t = music.next - a.currentTime, st = music.step, sc = SCALES[m.scale];
    const note = (deg, oct = 0) => 440 * Math.pow(2, (m.root + sc[((deg % sc.length) + sc.length) % sc.length] + 12 * (oct + Math.floor(deg / sc.length)) - 69) / 12);
    if (st % 8 === 0) {
      const chord = [0, 2, 4][(st / 8 | 0) % 3] + ((st / 32 | 0) % 2 ? 1 : 0);
      for (const d of [0, 2, 4]) tone(note(chord + d, -1), note(chord + d, -1) * 1.003, beat * 8.2, m.pad, .018, t, musicGain);
      tone(note(chord, -2), note(chord, -2), beat * 4, 'sine', .04, t, musicGain);
    }
    if (Math.random() < m.arp * (st % 2 ? .35 : .75)) { const d = Math.floor(Math.random() * 7) + (st % 4 === 0 ? 0 : 2); tone(note(d, 1), note(d, 1) * .998, beat * 1.4, 'triangle', .02, t, musicGain); }
    if (m.drums && st % 4 === 0) { tone(110, 40, .25, 'sine', .08 * m.drums, t, musicGain); }
    if (m.drums > .6 && st % 4 === 2) { const g = ac(); noise(.08, .03 * m.drums, 4000, t); }
    music.next += beat * .5; music.step++;
  }
}
setInterval(musicTick, 250);

/* ===== src/02a-data-biomes.js ===== */
/* ---------- biomas ---------- */
const BIOME_LIST = ['meadow', 'forest', 'jungle', 'marsh', 'dunes', 'canyon', 'frost', 'mountain', 'volcano', 'storm', 'crystal', 'arcane', 'ash', 'coast', 'abyss'];
const BIOME_IDX = {}; BIOME_LIST.forEach((b, i) => (BIOME_IDX[b] = i));
const BIOMES = {
  meadow: { name: 'Campos de Aurora', icon: '❀', g: '#5d9a47', g2: '#8cc863', g3: '#3f7a3c', acc: ['#f4e18c', '#f0f0f0', '#e98fb0', '#9bc4f0'], path: '#c2b27f', liq: 'water', element: 'natureza', mood: 'campos', amb: 'pollen', sky: '#bfe3ff', hint: 'Prados floridos, aldeias e criaturas dóceis' },
  forest: { name: 'Floresta Esmeralda', icon: '🌲', g: '#3c7241', g2: '#6aa95e', g3: '#235235', acc: ['#e6cf85', '#e8a2cc', '#c9e8ff', '#ff9d7a'], path: '#a89f78', liq: 'water', element: 'natureza', mood: 'floresta', amb: 'leaf', sky: '#9fd0b5', hint: 'Bosques antigos, raízes e feras' },
  jungle: { name: 'Selva Sussurrante', icon: '🌴', g: '#2f7a3a', g2: '#59b04a', g3: '#17512c', acc: ['#ff6f91', '#ffd25e', '#7cf0c9', '#ff9b45'], path: '#9a8a58', liq: 'water', element: 'natureza', mood: 'selva', amb: 'leaf', sky: '#7fd1a0', hint: 'Cipós, flores gigantes e predadores' },
  marsh: { name: 'Pântano Tóxico', icon: '☠', g: '#47705a', g2: '#80a978', g3: '#264b47', acc: ['#a5c970', '#d5a5df', '#e9e49a'], path: '#86916a', liq: 'water', element: 'natureza', mood: 'pantano', amb: 'spore', sky: '#6f9c8e', hint: 'Musgos, cogumelos e águas venenosas' },
  dunes: { name: 'Mar de Dunas', icon: '☀', g: '#d9b878', g2: '#f1d6a2', g3: '#b28650', acc: ['#ffdf9b', '#e8a76b'], path: '#e3c593', liq: null, element: 'fogo', mood: 'deserto', amb: 'sand', sky: '#f2d7a6', hint: 'Areia, cactos e escorpiões' },
  canyon: { name: 'Cânion Rubro', icon: '⛏', g: '#b4694a', g2: '#d88a62', g3: '#8a4a38', acc: ['#e8c07a', '#7a4a38'], path: '#cf9f72', liq: null, element: 'fogo', mood: 'deserto', amb: 'sand', sky: '#e8b08a', hint: 'Mesas de rocha, minas e bandidos' },
  frost: { name: 'Tundra Glacial', icon: '❄', g: '#b8dbe0', g2: '#eef9f6', g3: '#7ea8ba', acc: ['#ffffff', '#a6e4ff'], path: '#c7d8da', liq: 'ice', element: 'gelo', mood: 'gelo', amb: 'snow', sky: '#d7f0ff', hint: 'Geada, aurora e predadores brancos' },
  mountain: { name: 'Picos Ventosos', icon: '⛰', g: '#7f8a7c', g2: '#a8b3a2', g3: '#566358', acc: ['#d8dccd', '#9aa6a0'], path: '#a7a591', liq: 'water', element: 'raio', mood: 'floresta', amb: 'wind', sky: '#b9ccd8', hint: 'Penhascos, ninhos e dragões' },
  volcano: { name: 'Vulcão Carmesim', icon: '🔥', g: '#3a3236', g2: '#6a5350', g3: '#211c26', acc: ['#ff7c35', '#ffb24a'], path: '#7a665c', liq: 'lava', element: 'fogo', mood: 'fogo', amb: 'ember', sky: '#6e3c3a', hint: 'Magma, basalto e demônios' },
  storm: { name: 'Planícies da Tempestade', icon: '⚡', g: '#46757a', g2: '#7bb0ad', g3: '#264a5a', acc: ['#c3ece2', '#f7e676'], path: '#94a5a3', liq: 'water', element: 'raio', mood: 'tempestade', amb: 'rain', sky: '#5d7f90', hint: 'Campos elétricos e espíritos do trovão' },
  crystal: { name: 'Jardins de Cristal', icon: '💎', g: '#556f93', g2: '#92b5cd', g3: '#34497c', acc: ['#aee8fa', '#bc9af5', '#f2a6e8'], path: '#8aa1c2', liq: 'crystal', element: 'arcano', mood: 'cristal', amb: 'mote', sky: '#8fa8e0', hint: 'Cristais luminosos e construtos' },
  arcane: { name: 'Terras Astrais', icon: '✦', g: '#524a7c', g2: '#9d86c9', g3: '#2c315f', acc: ['#c4a2ff', '#8fe7ff', '#ffd27a'], path: '#8681ad', liq: 'ink', element: 'arcano', mood: 'arcano', amb: 'star', sky: '#6a5aa0', hint: 'Runas, portais e magia instável' },
  ash: { name: 'Ermos da Sombra', icon: '☾', g: '#4f5167', g2: '#7a7792', g3: '#2a2d46', acc: ['#b2a5de', '#8a8aa8'], path: '#777581', liq: 'ink', element: 'arcano', mood: 'sombra', amb: 'ash', sky: '#4a4866', hint: 'Névoa, túmulos e espectros' },
  coast: { name: 'Costa Marinha', icon: '🐚', g: '#e6d3a0', g2: '#f8ecc4', g3: '#c4ab74', acc: ['#f0a3a3', '#ffffff', '#9bd3e6'], path: '#d6c18a', liq: 'water', element: 'gelo', mood: 'campos', amb: 'gull', sky: '#9fdcf0', hint: 'Praias, recifes e piratas fantasmas' },
  abyss: { name: 'Fenda do Abismo', icon: '👁', g: '#20142e', g2: '#4b2a66', g3: '#0e0916', acc: ['#d23cff', '#ff3c6e'], path: '#4a3a5c', liq: 'ink', element: 'arcano', mood: 'oni', amb: 'void', sky: '#1a0f26', hint: 'O fim de todas as coisas' }
};
const LIQUIDS = {
  water: { deep: '#1e5f7d', mid: '#2b86a0', shallow: '#58b8c0', foam: '#e8fffb', tint: '#a6ece1', fx: null },
  ice: { deep: '#7fb4d6', mid: '#a6d4ea', shallow: '#d4f0fa', foam: '#ffffff', tint: '#ffffff', fx: 'slide' },
  lava: { deep: '#a82a10', mid: '#e0551a', shallow: '#ff8a2a', foam: '#ffd27a', tint: '#ffcf70', fx: 'burn' },
  ink: { deep: '#150d2b', mid: '#271a4a', shallow: '#42306e', foam: '#a58ce8', tint: '#c4a2ff', fx: null },
  crystal: { deep: '#3a5fb0', mid: '#5d8ad6', shallow: '#9cc4f0', foam: '#e0f6ff', tint: '#bdeaff', fx: null }
};

/* ---------- elementos ---------- */
const ELEMENTS = {
  fogo: { n: 'Fogo', color: '#ff815b', icon: '🔥', d: 'Queima os alvos ao longo do tempo.' },
  gelo: { n: 'Gelo', color: '#9de8ff', icon: '❄', d: 'Desacelera e pode congelar.' },
  raio: { n: 'Raio', color: '#ffe36d', icon: '⚡', d: 'Salta entre inimigos e atordoa.' },
  natureza: { n: 'Natureza', color: '#8ee28b', icon: '❋', d: 'Envenena e recupera um pouco de vida.' },
  arcano: { n: 'Arcano', color: '#c4a2ff', icon: '✦', d: 'Marca alvos e recupera mana.' }
};
const ELEMENT_RESIST = { fogo: { fogo: .5, gelo: 1.4 }, gelo: { gelo: .5, fogo: 1.4 }, natureza: { natureza: .6, fogo: 1.3 }, raio: { raio: .6, natureza: 1.25 }, arcano: { arcano: .65, raio: 1.15 } };

/* ---------- raças ---------- */
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

/* ---------- classes e armas ---------- */
const CLASSES = {
  guerreiro: { n: 'Guerreiro', icon: '⚔', d: 'Combo corpo a corpo de 3 golpes. Resistente e versátil.', hp: 1.12, fo: 1, sp: 1, dm: 1, atk: 1, rng: 1, melee: true,
    skills: [{ n: 'Redemoinho', icon: '✦', cost: 20, cd: 4, lv: 1, d: 'Gira a lâmina ferindo todos ao redor.' }, { n: 'Investida Brutal', icon: '➤', cost: 26, cd: 7, lv: 8, d: 'Avança atordoando quem estiver no caminho.' }],
    ult: { n: 'Lâmina Celestial', icon: '✹', cd: 45, d: 'Um golpe colossal que cai sobre a área à frente.' } },
  mago: { n: 'Mago', icon: '✺', d: 'Magias à distância. Frágil, mas devastador.', hp: .82, fo: 1.4, sp: 1, dm: 1.02, atk: 1, rng: 1, melee: false,
    skills: [{ n: 'Nova Arcana', icon: '✺', cost: 22, cd: 4.5, lv: 1, d: 'Explosão de energia ao seu redor.' }, { n: 'Orbe Elemental', icon: '◉', cost: 28, cd: 7, lv: 8, d: 'Esfera lenta que explode em área.' }],
    ult: { n: 'Chuva de Meteoros', icon: '☄', cd: 45, d: 'Meteoros caem do céu sobre os inimigos.' } },
  arqueiro: { n: 'Arqueiro', icon: '➶', d: 'Flechas rápidas que perfuram. Muito ágil.', hp: .92, fo: 1.1, sp: 1.08, dm: 1, atk: 1, rng: 1, melee: false,
    skills: [{ n: 'Leque de Flechas', icon: '➶', cost: 20, cd: 4, lv: 1, d: 'Dispara sete flechas em leque.' }, { n: 'Armadilha Explosiva', icon: '✱', cost: 24, cd: 8, lv: 8, d: 'Planta uma armadilha que lentifica e explode.' }],
    ult: { n: 'Tempestade de Flechas', icon: '⇊', cd: 45, d: 'Uma tempestade de flechas cobre a área alvo.' } },
  paladino: { n: 'Paladino', icon: '☀', d: 'Golpes lentos e devastadores. Cura e protege.', hp: 1.3, fo: 1, sp: .96, dm: 1, atk: 1.55, rng: 1.1, melee: true,
    skills: [{ n: 'Julgamento', icon: '☀', cost: 25, cd: 6, lv: 1, d: 'Explosão sagrada: fere inimigos e cura você.' }, { n: 'Escudo Sagrado', icon: '⬡', cost: 30, cd: 12, lv: 8, d: 'Barreira que absorve dano por alguns segundos.' }],
    ult: { n: 'Santuário Divino', icon: '✚', cd: 50, d: 'Zona sagrada que cura aliados e queima inimigos.' } },
  druida: { n: 'Druida', icon: '❋', d: 'Espinhos vivos. Controla o campo de batalha.', hp: 1, fo: 1.25, sp: 1, dm: 1.04, atk: 1, rng: 1, melee: false,
    skills: [{ n: 'Ciclo Vital', icon: '❋', cost: 24, cd: 5, lv: 1, d: 'Pulso de vida que cura você e fere ao redor.' }, { n: 'Raízes Prisioneiras', icon: '♣', cost: 26, cd: 8, lv: 8, d: 'Prende e fere inimigos na área alvo.' }],
    ult: { n: 'Fúria da Floresta', icon: '♠', cd: 45, d: 'Espinhos colossais brotam do chão por 7 segundos.' } },
  assassino: { n: 'Assassino', icon: '✧', d: 'Golpes rápidos e críticos. Mestre da furtividade.', hp: .88, fo: .95, sp: 1.16, dm: 1.1, atk: .72, rng: .85, melee: true,
    skills: [{ n: 'Passo Sombrio', icon: '✧', cost: 18, cd: 3.2, lv: 1, d: 'Investida cortante que atravessa inimigos.' }, { n: 'Bomba de Fumaça', icon: '☁', cost: 22, cd: 9, lv: 8, d: 'Fica invisível e prepara um golpe crítico.' }],
    ult: { n: 'Dança das Sombras', icon: '☾', cd: 45, d: 'Teleporta entre inimigos desferindo cortes mortais.' } }
};
const WEAPONS = {
  espada: { n: 'Espada Longa', cls: 'guerreiro', dmg: 1, rate: 1, range: 1, kind: 'sword' },
  machado: { n: 'Machado de Guerra', cls: 'guerreiro', dmg: 1.22, rate: .82, range: 1.06, kind: 'axe' },
  lanca: { n: 'Lança do Sentinela', cls: 'guerreiro', dmg: .94, rate: 1.06, range: 1.3, kind: 'spear' },
  katana: { n: 'Katana Oni', cls: 'guerreiro', dmg: 1.08, rate: 1.1, range: 1.05, kind: 'katana' },
  cajado: { n: 'Cajado Arcano', cls: 'mago', dmg: 1.06, rate: .96, range: 1.18, kind: 'staff' },
  grimorio: { n: 'Grimório Astral', cls: 'mago', dmg: 1.2, rate: .84, range: 1.08, kind: 'tome' },
  varinha: { n: 'Varinha Prismática', cls: 'mago', dmg: .88, rate: 1.2, range: .96, kind: 'wand' },
  orbe: { n: 'Orbe Flutuante', cls: 'mago', dmg: 1.1, rate: 1, range: 1.1, kind: 'orb' },
  arco: { n: 'Arco Longo', cls: 'arqueiro', dmg: 1.12, rate: .94, range: 1.24, kind: 'bow' },
  besta: { n: 'Besta Repetidora', cls: 'arqueiro', dmg: 1.28, rate: .76, range: 1.12, kind: 'crossbow' },
  arcocurto: { n: 'Arco do Caçador', cls: 'arqueiro', dmg: .92, rate: 1.2, range: 1, kind: 'bow' },
  martelo: { n: 'Martelo Sagrado', cls: 'paladino', dmg: 1.16, rate: .92, range: 1.12, kind: 'hammer' },
  maca: { n: 'Maça do Juramento', cls: 'paladino', dmg: 1.32, rate: .78, range: .98, kind: 'mace' },
  espadaluz: { n: 'Espada de Luz', cls: 'paladino', dmg: 1.05, rate: 1.05, range: 1.1, kind: 'sword' },
  totem: { n: 'Totem Vivo', cls: 'druida', dmg: 1.02, rate: 1, range: 1.2, kind: 'totem' },
  luaclara: { n: 'Cajado da Lua', cls: 'druida', dmg: 1.18, rate: .88, range: 1.1, kind: 'moon' },
  foice: { n: 'Foice de Cipó', cls: 'druida', dmg: 1.1, rate: .95, range: 1.15, kind: 'scythe' },
  adagas: { n: 'Adagas Gêmeas', cls: 'assassino', dmg: 1, rate: 1.08, range: .92, kind: 'daggers' },
  katars: { n: 'Katars Sombrios', cls: 'assassino', dmg: 1.16, rate: .92, range: 1.04, kind: 'katars' },
  kunai: { n: 'Kunais Venenosos', cls: 'assassino', dmg: .94, rate: 1.18, range: 1, kind: 'kunai' }
};
const DEFAULT_WEAPON = { guerreiro: 'espada', mago: 'cajado', arqueiro: 'arco', paladino: 'martelo', druida: 'totem', assassino: 'adagas' };
const ARMORS = {
  couro: { n: 'Couro de Caçador', hp: .96, speed: 1.08, guard: .06 },
  cota: { n: 'Cota do Viajante', hp: 1, speed: 1, guard: .12 },
  placas: { n: 'Placas do Bastião', hp: 1.2, speed: .9, guard: .22 },
  runica: { n: 'Manto Rúnico', hp: 1.04, speed: 1.02, guard: .1 },
  samurai: { n: 'Armadura Samurai', hp: 1.1, speed: .98, guard: .17 },
  escamas: { n: 'Escamas de Dragão', hp: 1.14, speed: .95, guard: .19 }
};
const BLESSINGS = {
  vitality: { icon: '♥', name: 'Vigor Ancestral', detail: '+25% de vida máxima' },
  fury: { icon: '⚔', name: 'Fúria Solar', detail: '+12% de dano causado' },
  stride: { icon: '➶', name: 'Passos do Vento', detail: '+10% velocidade' },
  shield: { icon: '⬡', name: 'Proteção do Guardião', detail: '−12% dano recebido' },
  focus: { icon: '✦', name: 'Fonte dos Magos', detail: '+30% de mana' },
  fortune: { icon: '◈', name: 'Sorte do Viajante', detail: '+30% moedas e XP no início' }
};
const BOONS = [
  { id: 'health', n: 'Coração de Ferro', icon: '♥', d: '+22 de vida máxima e cura total.', rar: 'COMUM', max: 99 },
  { id: 'stamina', n: 'Fôlego Infinito', icon: '↯', d: '+20 de vigor máximo e regeneração.', rar: 'COMUM', max: 30 },
  { id: 'mana', n: 'Fonte Arcana', icon: '✦', d: '+18 de mana máxima.', rar: 'COMUM', max: 99 },
  { id: 'fury', n: 'Lâminas Famintas', icon: '⚔', d: '+4% de dano e +1,5% de crítico.', rar: 'RARO', max: 15 },
  { id: 'haste', n: 'Passos do Vento', icon: '➶', d: '+4% de velocidade de movimento.', rar: 'RARO', max: 10 },
  { id: 'arcana', n: 'Sintonia Elemental', icon: '✺', d: 'Efeitos elementais mais longos; mana regenera mais rápido.', rar: 'ÉPICO', max: 10 },
  { id: 'vampire', n: 'Sede de Sangue', icon: '☽', d: 'Chance de roubar vida ao atingir.', rar: 'ÉPICO', max: 10 },
  { id: 'cryo', n: 'Geada Perpétua', icon: '❄', d: 'Congelamentos mais longos.', rar: 'RARO', max: 10 },
  { id: 'storm', n: 'Arco Voltaico', icon: '⚡', d: 'Raios saltam para mais alvos.', rar: 'ÉPICO', max: 8 },
  { id: 'venom', n: 'Esporos Nocivos', icon: '❋', d: 'Golpes podem envenenar além do elemento.', rar: 'RARO', max: 10 },
  { id: 'magnet', n: 'Ímã de Tesouros', icon: '◈', d: 'Maior alcance de coleta de itens.', rar: 'COMUM', max: 8 },
  { id: 'ward', n: 'Pele Endurecida', icon: '⬡', d: 'Reduz todo dano recebido em 4%.', rar: 'RARO', max: 10 },
  { id: 'swift', n: 'Mãos Ágeis', icon: '≫', d: 'Ataca 4% mais rápido e reduz recargas.', rar: 'RARO', max: 10 },
  { id: 'thorns', n: 'Espinhos Rubros', icon: '✹', d: 'Devolve parte do dano de quem te atinge.', rar: 'ÉPICO', max: 8 }
];

/* ---------- opções de aparência ---------- */
const HAIR_STYLES = { careca: 'Careca', curto: 'Curto', longo: 'Longo', moicano: 'Moicano', tranca: 'Trança', coque: 'Coque', rabo: 'Rabo de cavalo', selvagem: 'Selvagem' };
const BEARDS = { nenhuma: 'Nenhuma', bigode: 'Bigode', cavanhaque: 'Cavanhaque', cheia: 'Barba cheia', longa: 'Barba longa' };
const HEADGEARS = { nenhum: 'Nenhum', capuz: 'Capuz', elmo: 'Elmo', coroa: 'Coroa', chapeu: 'Chapéu de mago', bandana: 'Bandana', oni: 'Máscara Oni', cornos: 'Elmo com chifres' };
const CAPES = { longa: 'Longa', curta: 'Curta', esfarrapada: 'Esfarrapada', sem: 'Sem capa' };
const MARKS = { nenhuma: 'Nenhuma', guerra: 'Cicatriz de guerra', antiga: 'Cicatriz antiga', tribal: 'Pintura tribal', runas: 'Runas brilhantes', lagrima: 'Lágrima', sardas: 'Sardas' };
const SHOULDERS = { nenhum: 'Nenhum', couro: 'Ombreiras de couro', aco: 'Ombreiras de aço', espinhos: 'Ombreiras de espinhos', pele: 'Gola de pele' };
const AURAS = { nenhuma: 'Nenhuma', elemental: 'Elemental', fogo: 'Brasas', estrelas: 'Estrelas', sombra: 'Sombra' };
const BODIES = { medio: 'Média', robusto: 'Robusta', esguio: 'Esguia' };
const EMBLEMS = { sol: 'Sol', lua: 'Lua', runa: 'Runa', dragao: 'Dragão', nenhum: 'Nenhum' };
const PAL = {
  armor: ['#425f69', '#6b4a8f', '#8a3b3b', '#3f6b45', '#7a6a3a', '#555b66', '#2c3e6b', '#d8d4c8', '#1f2230', '#a8552d'],
  cape: ['#8c3a3a', '#785c38', '#3a5f8c', '#5a3a8c', '#2f6b4a', '#c9a13b', '#1d1d26', '#e6e2d2', '#b04a8c'],
  hair: ['#3b2a20', '#d9b66a', '#a8402a', '#e8e8e8', '#1b1b1b', '#6a4fa8', '#2e7d8c', '#e24a7a', '#8a5a34'],
  eyes: ['#3a2a1c', '#2f6f9a', '#3a8a4c', '#8a4ac8', '#d94a3a', '#e8c24a', '#40e0d0', '#f5f5f5'],
  glow: ['#9fe8ff', '#ffd27a', '#ff8a7a', '#b69cff', '#9fffa8', '#ffffff', '#ff6ad0'],
  trim: ['#c7a65c', '#e0e2e5', '#bd7955', '#62bbaf', '#a97bdb', '#444951', '#e0463a']
};
const PAL_LABEL = { armor: 'Armadura', cape: 'Capa', hair: 'Cabelo / barba', eyes: 'Olhos', glow: 'Brilho da arma', trim: 'Acabamento / metal' };

/* ===== src/02b-data-enemies.js ===== */
/* ---------- inimigos: arquétipo + paleta + comportamento ---------- */
/* pal: [corpo, sombra, detalhe, olho]  ·  ai: melee|skirmish|ranged|charger|stationary|flyer|swarm|caster|guard  */
const TYPES = {};
function T(id, name, arch, biome, o) {
  TYPES[id] = Object.assign({ id, name, arch, biome, hp: 50, dmg: 9, speed: 100, r: 15, aggro: 380, ai: 'melee', atk: ['melee'], el: null, pal: ['#888', '#444', '#ccc', '#ff4'], f: {}, hostile: true, xp: 1, coin: 1, weight: 1 }, o);
}
/* --- Campos de Aurora --- */
T('slime', 'Gosma Verde', 'blob', 'meadow', { hp: 34, dmg: 6, speed: 70, r: 14, ai: 'melee', atk: ['lunge'], pal: ['#6fd49a', '#3f9d73', '#d6ffe6', '#14301f'], el: 'natureza', f: { kind: 'slime' } });
T('boar', 'Javali Selvagem', 'quad', 'meadow', { hp: 52, dmg: 9, speed: 120, r: 16, ai: 'charger', atk: ['charge'], pal: ['#8a6a4a', '#4e3a2a', '#f1e6c8', '#ff6a3a'], f: { kind: 'boar' } });
T('bandit', 'Bandoleiro', 'human', 'meadow', { hp: 58, dmg: 10, speed: 108, r: 15, ai: 'skirmish', atk: ['melee'], pal: ['#7a5a3a', '#3d2c1c', '#c9a458', '#201510'], f: { head: 'hood', weapon: 'dagger', skin: '#d9b99b', outfit: '#6a4a2a', mask: true } });
T('wasp', 'Vespa Gigante', 'flyer', 'meadow', { hp: 30, dmg: 7, speed: 150, r: 12, ai: 'flyer', atk: ['swoop'], pal: ['#f2c43a', '#2a2418', '#fff7c0', '#d02020'], el: 'natureza', f: { kind: 'wasp' } });
T('scarecrow', 'Espantalho Maldito', 'human', 'meadow', { hp: 70, dmg: 11, speed: 72, r: 16, ai: 'ranged', atk: ['crows'], pal: ['#b8924a', '#5b4222', '#e6c878', '#ff7a1a'], el: 'arcano', f: { head: 'sack', weapon: 'pitchfork', skin: '#c9a35a', outfit: '#8a6a3a', patch: true } });
T('rabid', 'Coelho Raivoso', 'quad', 'meadow', { hp: 26, dmg: 6, speed: 140, r: 11, ai: 'skirmish', atk: ['lunge'], pal: ['#cfc8bc', '#8a8478', '#f6a0a0', '#e02020'], f: { kind: 'rabbit' } });
/* --- Floresta --- */
T('wolf', 'Lobo Sombrio', 'quad', 'forest', { hp: 62, dmg: 12, speed: 150, r: 15, ai: 'skirmish', atk: ['lunge'], pal: ['#6a7488', '#2d3442', '#aab4c8', '#ff5b4a'], f: { kind: 'wolf' } });
T('spider', 'Aranha da Névoa', 'bug', 'forest', { hp: 66, dmg: 11, speed: 122, r: 16, ai: 'skirmish', atk: ['lunge', 'web'], pal: ['#5a6a3a', '#2a3320', '#c8e08a', '#ff3030'], el: 'natureza', f: { kind: 'spider' } });
T('stag', 'Cervo Corrompido', 'quad', 'forest', { hp: 96, dmg: 14, speed: 130, r: 19, ai: 'charger', atk: ['charge'], pal: ['#8a6038', '#3a2a1a', '#e8dcb0', '#9aff7a'], el: 'natureza', f: { kind: 'stag' } });
T('thornling', 'Espinho Andante', 'plant', 'forest', { hp: 80, dmg: 12, speed: 84, r: 16, ai: 'guard', atk: ['melee', 'thorns'], pal: ['#4a8a3a', '#245520', '#e8d070', '#ffe07a'], el: 'natureza', f: { kind: 'thorn' } });
T('dryad', 'Dríade Sombria', 'human', 'forest', { hp: 84, dmg: 13, speed: 90, r: 15, ai: 'caster', atk: ['lob', 'heal'], pal: ['#4a8a5a', '#1e4a34', '#c8ff9a', '#ffee66'], el: 'natureza', f: { head: 'leafcrown', weapon: 'branch', skin: '#9ac88a', outfit: '#2f6a44', dress: true } });
T('mossgolem', 'Golem de Musgo', 'golem', 'forest', { hp: 190, dmg: 18, speed: 62, r: 24, ai: 'guard', atk: ['slam'], pal: ['#6a7a5a', '#3a4430', '#7acb5a', '#d0ff7a'], el: 'natureza', f: { kind: 'moss' } });
T('ent', 'Ent Jovem', 'plant', 'forest', { hp: 150, dmg: 16, speed: 70, r: 22, ai: 'guard', atk: ['slam', 'summon'], pal: ['#6a4a2e', '#33210f', '#5ab04a', '#ffcf5a'], el: 'natureza', f: { kind: 'ent' }, weight: .5 });
/* --- Selva --- */
T('viper', 'Víbora Esmeralda', 'serpent', 'jungle', { hp: 70, dmg: 13, speed: 125, r: 15, ai: 'skirmish', atk: ['lunge', 'spit'], pal: ['#3fae5a', '#1c5a2c', '#f0ff8a', '#ffd23a'], el: 'natureza', f: { kind: 'viper' } });
T('panther', 'Pantera Venenosa', 'quad', 'jungle', { hp: 98, dmg: 17, speed: 160, r: 17, ai: 'skirmish', atk: ['lunge'], pal: ['#2a2a3a', '#101018', '#8a6ae0', '#7aff5a'], el: 'natureza', f: { kind: 'panther' } });
T('tribal', 'Guerreiro Tribal', 'human', 'jungle', { hp: 112, dmg: 16, speed: 104, r: 16, ai: 'melee', atk: ['melee', 'lunge'], pal: ['#a8683f', '#5a3a22', '#e8c24a', '#201510'], f: { head: 'tribalmask', weapon: 'spear', skin: '#b4784a', outfit: '#4a8a3a', paint: true } });
T('devourer', 'Planta Devoradora', 'plant', 'jungle', { hp: 120, dmg: 19, speed: 0, r: 20, ai: 'stationary', atk: ['bite', 'spit'], pal: ['#d23a6a', '#7a1a3a', '#fff0b0', '#ffe05a'], el: 'natureza', f: { kind: 'maw' }, aggro: 260 });
T('witchdoc', 'Xamã da Praga', 'human', 'jungle', { hp: 96, dmg: 14, speed: 84, r: 15, ai: 'caster', atk: ['lob', 'summon'], pal: ['#6a3a8a', '#2a1440', '#c8ff6a', '#b8ff4a'], el: 'natureza', f: { head: 'tribalmask', weapon: 'skullstaff', skin: '#8a5a3a', outfit: '#5a2a7a', feathers: true } });
T('beetle', 'Besouro Titã', 'bug', 'jungle', { hp: 170, dmg: 20, speed: 90, r: 21, ai: 'charger', atk: ['charge'], pal: ['#2a6a4a', '#0e2a20', '#9affc8', '#ff8a2a'], f: { kind: 'beetle' } });
/* --- Pântano --- */
T('toad', 'Sapo Tóxico', 'blob', 'marsh', { hp: 64, dmg: 11, speed: 90, r: 16, ai: 'skirmish', atk: ['lunge', 'spit'], pal: ['#7a9a3a', '#3a4a1a', '#d8ff7a', '#ffe030'], el: 'natureza', f: { kind: 'toad' } });
T('croc', 'Devorador do Brejo', 'quad', 'marsh', { hp: 150, dmg: 21, speed: 96, r: 22, ai: 'charger', atk: ['charge', 'bite'], pal: ['#4a6a3a', '#1e3318', '#d8e08a', '#ffd030'], f: { kind: 'croc' } });
T('shroom', 'Cogumelo Tóxico', 'plant', 'marsh', { hp: 78, dmg: 12, speed: 0, r: 16, ai: 'stationary', atk: ['spores'], pal: ['#c05a8a', '#6a2a4a', '#ffe0f0', '#fff0a0'], el: 'natureza', f: { kind: 'shroom' }, aggro: 300 });
T('wisp', 'Fogo-Fátuo', 'spirit', 'marsh', { hp: 52, dmg: 12, speed: 112, r: 12, ai: 'flyer', atk: ['bolt'], pal: ['#7affb0', '#1a8a5a', '#e0fff0', '#ffffff'], el: 'natureza', f: { kind: 'wisp' } });
T('mosquito', 'Mosquito Gigante', 'flyer', 'marsh', { hp: 34, dmg: 8, speed: 165, r: 11, ai: 'flyer', atk: ['swoop'], pal: ['#6a6a5a', '#2a2a22', '#c8e0ff', '#e02020'], el: 'natureza', f: { kind: 'mosquito' } });
T('bogwitch', 'Bruxa do Brejo', 'human', 'marsh', { hp: 100, dmg: 15, speed: 86, r: 15, ai: 'caster', atk: ['lob', 'curse'], pal: ['#4a5a8a', '#1a2040', '#a0ff7a', '#b0ff40'], el: 'arcano', f: { head: 'witch', weapon: 'staff', skin: '#8aa870', outfit: '#3a2a5a', cloak: true } });
/* --- Dunas --- */
T('scorpion', 'Escorpião das Dunas', 'bug', 'dunes', { hp: 110, dmg: 18, speed: 130, r: 17, ai: 'skirmish', atk: ['lunge', 'sting'], pal: ['#c8883a', '#6a4418', '#ffe0a0', '#ff3a1a'], el: 'fogo', f: { kind: 'scorpion' } });
T('scarab', 'Escaravelho de Ouro', 'bug', 'dunes', { hp: 66, dmg: 12, speed: 150, r: 12, ai: 'swarm', atk: ['lunge'], pal: ['#e0b030', '#7a5a10', '#fff0a0', '#2a1a00'], f: { kind: 'scarab' } });
T('raider', 'Saqueador do Deserto', 'human', 'dunes', { hp: 130, dmg: 18, speed: 104, r: 16, ai: 'melee', atk: ['melee', 'lunge'], pal: ['#d8b070', '#7a5a30', '#c0402a', '#201510'], f: { head: 'turban', weapon: 'scimitar', skin: '#c08a5a', outfit: '#a8402a', veil: true } });
T('mummy', 'Múmia Amaldiçoada', 'human', 'dunes', { hp: 160, dmg: 19, speed: 72, r: 17, ai: 'guard', atk: ['melee', 'curse'], pal: ['#d8d0b0', '#8a8060', '#7affc0', '#7affc0'], el: 'arcano', f: { head: 'wrap', weapon: 'none', skin: '#d8d0b0', outfit: '#d8d0b0', wraps: true } });
T('naja', 'Naja Dourada', 'serpent', 'dunes', { hp: 96, dmg: 16, speed: 118, r: 15, ai: 'skirmish', atk: ['lunge', 'spit'], pal: ['#c8a04a', '#6a4a1a', '#ffe8a0', '#ff3a1a'], el: 'fogo', f: { kind: 'cobra' } });
T('sandwisp', 'Djinn de Areia', 'spirit', 'dunes', { hp: 90, dmg: 17, speed: 100, r: 17, ai: 'caster', atk: ['lob', 'nova'], pal: ['#f0c870', '#a07a30', '#fff6d0', '#ff8a30'], el: 'fogo', f: { kind: 'djinn' } });
/* --- Cânion --- */
T('coyote', 'Coiote Faminto', 'quad', 'canyon', { hp: 78, dmg: 15, speed: 160, r: 14, ai: 'skirmish', atk: ['lunge'], pal: ['#b08a5a', '#5a4020', '#f0dcb0', '#ffd030'], f: { kind: 'wolf' } });
T('outlaw', 'Bandido do Cânion', 'human', 'canyon', { hp: 118, dmg: 18, speed: 100, r: 15, ai: 'ranged', atk: ['shoot', 'volley'], pal: ['#8a4a3a', '#3a1c14', '#e8c060', '#201510'], f: { head: 'hat', weapon: 'crossbow', skin: '#c9a07a', outfit: '#7a3a2a', bandana: true } });
T('armadillo', 'Tatu de Rocha', 'blob', 'canyon', { hp: 150, dmg: 18, speed: 110, r: 18, ai: 'charger', atk: ['charge'], pal: ['#9a8a7a', '#4a4036', '#d8c8a8', '#ff8a2a'], f: { kind: 'armadillo' } });
T('minegolem', 'Golem de Minério', 'golem', 'canyon', { hp: 240, dmg: 24, speed: 62, r: 25, ai: 'guard', atk: ['slam'], pal: ['#8a5a44', '#3a241a', '#ffb24a', '#ffd070'], el: 'fogo', f: { kind: 'ore' } });
T('vulture', 'Abutre Carniceiro', 'flyer', 'canyon', { hp: 90, dmg: 16, speed: 150, r: 15, ai: 'flyer', atk: ['swoop'], pal: ['#4a3a3a', '#1a1414', '#d8b0a0', '#ffd030'], f: { kind: 'vulture' } });
/* --- Tundra --- */
T('frostling', 'Duende de Geada', 'human', 'frost', { hp: 60, dmg: 13, speed: 140, r: 12, ai: 'skirmish', atk: ['lunge', 'shoot'], pal: ['#8ac8e8', '#3a6a8a', '#ffffff', '#ffffff'], el: 'gelo', f: { head: 'iceimp', weapon: 'icicle', skin: '#a8d8f0', outfit: '#4a8ab0', size: .8 } });
T('snowstalker', 'Predador Albino', 'quad', 'frost', { hp: 150, dmg: 22, speed: 150, r: 20, ai: 'skirmish', atk: ['lunge'], pal: ['#e8f0f4', '#8aa4b4', '#a6e4ff', '#4ad0ff'], el: 'gelo', f: { kind: 'bear' } });
T('icegolem', 'Golem de Gelo', 'golem', 'frost', { hp: 250, dmg: 25, speed: 64, r: 25, ai: 'guard', atk: ['slam', 'nova'], pal: ['#9ad4ee', '#4a7a9a', '#e8fcff', '#ffffff'], el: 'gelo', f: { kind: 'ice' } });
T('banshee', 'Espectro Gelado', 'spirit', 'frost', { hp: 120, dmg: 20, speed: 112, r: 17, ai: 'caster', atk: ['bolt', 'nova'], pal: ['#b8e8ff', '#4a8ab0', '#ffffff', '#40d0ff'], el: 'gelo', f: { kind: 'banshee' } });
T('yeti', 'Yeti das Neves', 'human', 'frost', { hp: 220, dmg: 26, speed: 100, r: 22, ai: 'melee', atk: ['melee', 'slam'], pal: ['#f4f8fa', '#9ab4c4', '#a6e4ff', '#2a2a40'], el: 'gelo', f: { head: 'yeti', weapon: 'none', skin: '#f4f8fa', outfit: '#e8f0f4', size: 1.35, fur: true } });
T('icemage', 'Mago do Gelo', 'human', 'frost', { hp: 120, dmg: 21, speed: 86, r: 15, ai: 'caster', atk: ['lob', 'shoot'], pal: ['#4a7ac8', '#1a2a5a', '#c8f0ff', '#a0f0ff'], el: 'gelo', f: { head: 'hood', weapon: 'crystalstaff', skin: '#c8dcf0', outfit: '#3a5aa0', cloak: true } });
/* --- Picos --- */
T('gargoyle', 'Gárgula', 'flyer', 'mountain', { hp: 150, dmg: 22, speed: 120, r: 19, ai: 'flyer', atk: ['swoop', 'slam'], pal: ['#7a808a', '#3a3e48', '#d0d8e0', '#ff5a3a'], f: { kind: 'gargoyle' } });
T('granite', 'Golem de Granito', 'golem', 'mountain', { hp: 280, dmg: 27, speed: 60, r: 26, ai: 'guard', atk: ['slam'], pal: ['#8a8a8a', '#44444a', '#c8c8c8', '#ffd070'], f: { kind: 'stone' } });
T('harpy', 'Harpia das Rochas', 'flyer', 'mountain', { hp: 104, dmg: 19, speed: 175, r: 15, ai: 'flyer', atk: ['swoop', 'shoot'], pal: ['#a8784a', '#5a3a22', '#f1d08f', '#ffe040'], el: 'raio', f: { kind: 'harpy' } });
T('troll', 'Troll das Pedras', 'human', 'mountain', { hp: 280, dmg: 29, speed: 80, r: 24, ai: 'melee', atk: ['melee', 'slam'], pal: ['#6a8a6a', '#2a3a2a', '#8a7a5a', '#ffd030'], f: { head: 'troll', weapon: 'club', skin: '#6a8a6a', outfit: '#6a5a3a', size: 1.45 } });
T('ram', 'Carneiro Ferroso', 'quad', 'mountain', { hp: 170, dmg: 24, speed: 130, r: 19, ai: 'charger', atk: ['charge'], pal: ['#d8d0c0', '#7a7468', '#8a8a96', '#ffb040'], f: { kind: 'ram' } });
T('lizard', 'Dracônico Guerreiro', 'human', 'mountain', { hp: 210, dmg: 25, speed: 100, r: 17, ai: 'melee', atk: ['melee', 'lunge'], pal: ['#c0503a', '#6a2418', '#ffd070', '#ffe030'], el: 'fogo', f: { head: 'lizard', weapon: 'spear', skin: '#c0503a', outfit: '#6a3a2a', tail: true } });
/* --- Vulcão --- */
T('ember', 'Elemental de Brasa', 'elemental', 'volcano', { hp: 100, dmg: 21, speed: 138, r: 15, ai: 'skirmish', atk: ['lunge', 'bolt'], pal: ['#ff7a2a', '#7a1a08', '#ffe07a', '#ffffff'], el: 'fogo', f: { kind: 'fire' } });
T('lavagolem', 'Golem Magmático', 'golem', 'volcano', { hp: 320, dmg: 32, speed: 66, r: 27, ai: 'guard', atk: ['slam', 'nova'], pal: ['#4a3a3a', '#1a1214', '#ff7a2a', '#ffd070'], el: 'fogo', f: { kind: 'lava' } });
T('pyromancer', 'Piromante Exilado', 'human', 'volcano', { hp: 130, dmg: 26, speed: 90, r: 15, ai: 'caster', atk: ['lob', 'shoot'], pal: ['#a8402a', '#3a1008', '#ffd070', '#ffd070'], el: 'fogo', f: { head: 'horns', weapon: 'flamestaff', skin: '#8a4a3a', outfit: '#7a2a1a', cloak: true } });
T('hellhound', 'Cão Infernal', 'quad', 'volcano', { hp: 150, dmg: 27, speed: 165, r: 17, ai: 'skirmish', atk: ['lunge', 'cone'], pal: ['#2a1a1a', '#0a0606', '#ff7a2a', '#ffd030'], el: 'fogo', f: { kind: 'hound' } });
T('imp', 'Diabrete', 'flyer', 'volcano', { hp: 70, dmg: 18, speed: 160, r: 12, ai: 'flyer', atk: ['bolt', 'swoop'], pal: ['#c8302a', '#5a1010', '#ffd070', '#ffee40'], el: 'fogo', f: { kind: 'imp' } });
T('salamander', 'Salamandra de Lava', 'serpent', 'volcano', { hp: 180, dmg: 26, speed: 110, r: 20, ai: 'skirmish', atk: ['lunge', 'cone'], pal: ['#e0602a', '#6a1c0a', '#ffd070', '#ffee40'], el: 'fogo', f: { kind: 'salamander' } });
/* --- Tempestade --- */
T('thunderhawk', 'Falcão Elétrico', 'flyer', 'storm', { hp: 120, dmg: 24, speed: 185, r: 15, ai: 'flyer', atk: ['swoop', 'bolt'], pal: ['#e8d870', '#6a5a20', '#ffffff', '#40ffff'], el: 'raio', f: { kind: 'hawk' } });
T('stormwisp', 'Fóton da Tempestade', 'spirit', 'storm', { hp: 90, dmg: 22, speed: 130, r: 12, ai: 'flyer', atk: ['bolt', 'chain'], pal: ['#fff08a', '#c8a020', '#ffffff', '#ffffff'], el: 'raio', f: { kind: 'wisp' } });
T('shockhound', 'Cão do Trovão', 'quad', 'storm', { hp: 170, dmg: 26, speed: 160, r: 17, ai: 'skirmish', atk: ['lunge', 'chain'], pal: ['#6a8a9a', '#2a3a4a', '#ffee70', '#ffee70'], el: 'raio', f: { kind: 'hound' } });
T('stormknight', 'Cavaleiro da Tempestade', 'human', 'storm', { hp: 260, dmg: 30, speed: 96, r: 18, ai: 'melee', atk: ['melee', 'chain'], pal: ['#6a7a9a', '#2a3248', '#fff08a', '#fff08a'], el: 'raio', f: { head: 'helm', weapon: 'sword', skin: '#c8d0e0', outfit: '#5a6a8a', cape: true, plate: true } });
T('cloud', 'Elemental das Nuvens', 'elemental', 'storm', { hp: 180, dmg: 24, speed: 90, r: 20, ai: 'caster', atk: ['rain', 'chain'], pal: ['#9ab0c4', '#4a5a6a', '#fff08a', '#fff08a'], el: 'raio', f: { kind: 'cloud' } });
/* --- Cristal --- */
T('prismite', 'Prismático Vivo', 'elemental', 'crystal', { hp: 120, dmg: 24, speed: 128, r: 14, ai: 'skirmish', atk: ['lunge', 'bolt'], pal: ['#9adbf3', '#3a5aa0', '#ffffff', '#ffffff'], el: 'arcano', f: { kind: 'prism' } });
T('crystalguard', 'Sentinela Cristalina', 'golem', 'crystal', { hp: 340, dmg: 32, speed: 62, r: 26, ai: 'guard', atk: ['slam', 'nova'], pal: ['#7a9ad8', '#2a3a78', '#e0f0ff', '#ffffff'], el: 'arcano', f: { kind: 'crystal' } });
T('shardmage', 'Magista dos Fragmentos', 'human', 'crystal', { hp: 150, dmg: 28, speed: 88, r: 15, ai: 'caster', atk: ['shoot', 'volley'], pal: ['#a070d8', '#3a2060', '#e0c8ff', '#aef'], el: 'arcano', f: { head: 'crown', weapon: 'crystalstaff', skin: '#e0d0f0', outfit: '#6a3a9a', cloak: true } });
T('cryspider', 'Aranha de Cristal', 'bug', 'crystal', { hp: 180, dmg: 28, speed: 130, r: 17, ai: 'skirmish', atk: ['lunge', 'volley'], pal: ['#8ab0f0', '#2a3a80', '#e0f8ff', '#ff6ad0'], el: 'arcano', f: { kind: 'spider', crystal: true } });
T('geode', 'Geodo Rastejante', 'blob', 'crystal', { hp: 200, dmg: 26, speed: 80, r: 19, ai: 'guard', atk: ['slam', 'bolt'], pal: ['#6a5a8a', '#2a2040', '#f0a8ff', '#f0a8ff'], el: 'arcano', f: { kind: 'geode' } });
/* --- Terras Astrais --- */
T('astraleye', 'Olho do Vazio', 'elemental', 'arcane', { hp: 130, dmg: 28, speed: 100, r: 17, ai: 'caster', atk: ['beam', 'bolt'], pal: ['#6a4ab0', '#241450', '#e8d0ff', '#ff6ad0'], el: 'arcano', f: { kind: 'eye' } });
T('voidwalker', 'Caminhante do Vazio', 'human', 'arcane', { hp: 210, dmg: 31, speed: 112, r: 16, ai: 'skirmish', atk: ['melee', 'blink'], pal: ['#3a2a6a', '#120a30', '#b090ff', '#ff6ad0'], el: 'arcano', f: { head: 'void', weapon: 'voidblade', skin: '#2a1a4a', outfit: '#241450', cloak: true } });
T('runebot', 'Autômato Rúnico', 'golem', 'arcane', { hp: 360, dmg: 34, speed: 70, r: 25, ai: 'guard', atk: ['slam', 'beam'], pal: ['#7a6aa8', '#2a2450', '#c4a2ff', '#c4a2ff'], el: 'arcano', f: { kind: 'rune' } });
T('astralserp', 'Serpente Astral', 'serpent', 'arcane', { hp: 190, dmg: 29, speed: 125, r: 17, ai: 'skirmish', atk: ['lunge', 'bolt'], pal: ['#5a4ab0', '#1a1450', '#e8d0ff', '#ffd27a'], el: 'arcano', f: { kind: 'astral' } });
T('starfae', 'Fada Estelar', 'flyer', 'arcane', { hp: 80, dmg: 22, speed: 150, r: 11, ai: 'flyer', atk: ['bolt', 'volley'], pal: ['#c8a0ff', '#5a3aa0', '#ffffff', '#ffd27a'], el: 'arcano', f: { kind: 'fae' } });
/* --- Ermos da Sombra --- */
T('skeleton', 'Sentinela Esquelética', 'human', 'ash', { hp: 84, dmg: 15, speed: 92, r: 16, ai: 'melee', atk: ['melee'], pal: ['#d9d6c3', '#6a6a5a', '#8a9ab0', '#7affc0'], f: { head: 'skull', weapon: 'sword', skin: '#d9d6c3', outfit: '#d9d6c3', bones: true, shield: true } });
T('zombie', 'Morto-vivo', 'human', 'ash', { hp: 110, dmg: 14, speed: 60, r: 16, ai: 'melee', atk: ['melee'], pal: ['#7a9a6a', '#2a3a2a', '#c8d0a0', '#ff4a4a'], f: { head: 'rotten', weapon: 'none', skin: '#7a9a6a', outfit: '#5a4a3a', ragged: true } });
T('ghost', 'Fantasma Errante', 'spirit', 'ash', { hp: 80, dmg: 16, speed: 100, r: 15, ai: 'flyer', atk: ['bolt'], pal: ['#c8d0e8', '#6a728a', '#ffffff', '#40c0ff'], el: 'arcano', f: { kind: 'ghost' } });
T('nightstalker', 'Caçador Noturno', 'human', 'ash', { hp: 140, dmg: 22, speed: 150, r: 15, ai: 'skirmish', atk: ['melee', 'blink'], pal: ['#2a2a40', '#0a0a18', '#b090ff', '#ff3a6a'], el: 'arcano', f: { head: 'hood', weapon: 'daggers', skin: '#3a3a50', outfit: '#1a1a2a', shadow: true } });
T('graveknight', 'Cavaleiro Funeral', 'human', 'ash', { hp: 280, dmg: 28, speed: 80, r: 19, ai: 'guard', atk: ['melee', 'slam'], pal: ['#4a4a5a', '#1a1a24', '#7affc0', '#7affc0'], el: 'arcano', f: { head: 'helm', weapon: 'greatsword', skin: '#3a3a4a', outfit: '#3a3a4a', cape: true, plate: true, size: 1.15 } });
T('necro', 'Necromante', 'human', 'ash', { hp: 150, dmg: 24, speed: 84, r: 15, ai: 'caster', atk: ['summon', 'lob'], pal: ['#4a2a6a', '#14081e', '#7affc0', '#7affc0'], el: 'arcano', f: { head: 'skullhood', weapon: 'skullstaff', skin: '#c8c8b8', outfit: '#3a1a5a', cloak: true } });
T('bat', 'Morcego Sombrio', 'flyer', 'ash', { hp: 36, dmg: 9, speed: 170, r: 11, ai: 'swarm', atk: ['swoop'], pal: ['#6a4a8a', '#2a1a3a', '#c8a0ff', '#ff4a4a'], f: { kind: 'bat' } });
/* --- Costa --- */
T('crab', 'Caranguejo Gigante', 'bug', 'coast', { hp: 88, dmg: 14, speed: 100, r: 17, ai: 'melee', atk: ['melee', 'lunge'], pal: ['#d85a3a', '#7a2a18', '#ffd0b0', '#201010'], f: { kind: 'crab' } });
T('jelly', 'Água-viva Venenosa', 'elemental', 'coast', { hp: 70, dmg: 13, speed: 70, r: 15, ai: 'caster', atk: ['bolt', 'nova'], pal: ['#c87ae8', '#6a2a8a', '#ffe0ff', '#ffffff'], el: 'natureza', f: { kind: 'jelly' } });
T('siren', 'Sereia Corrompida', 'human', 'coast', { hp: 120, dmg: 17, speed: 90, r: 15, ai: 'caster', atk: ['lob', 'curse'], pal: ['#3a9ac8', '#14405a', '#a0ffe0', '#a0ffe0'], el: 'gelo', f: { head: 'siren', weapon: 'trident', skin: '#a0d0c8', outfit: '#2a8aa8', fins: true } });
T('pirate', 'Pirata Fantasma', 'human', 'coast', { hp: 130, dmg: 19, speed: 98, r: 16, ai: 'melee', atk: ['melee', 'shoot'], pal: ['#7ab0c8', '#2a4a5a', '#e8d070', '#a0ffe0'], el: 'arcano', f: { head: 'piratehat', weapon: 'cutlass', skin: '#a8d0c8', outfit: '#3a5a7a', ghostly: true } });
T('gull', 'Gaivota Furiosa', 'flyer', 'coast', { hp: 38, dmg: 8, speed: 165, r: 11, ai: 'swarm', atk: ['swoop'], pal: ['#f0f0f0', '#9aa4ac', '#ffb040', '#201010'], f: { kind: 'gull' } });
/* --- Fenda do Abismo --- */
T('voidspawn', 'Cria do Abismo', 'elemental', 'abyss', { hp: 160, dmg: 34, speed: 120, r: 17, ai: 'skirmish', atk: ['lunge', 'bolt'], pal: ['#4a1a6a', '#14061e', '#ff3c8e', '#ff3c8e'], el: 'arcano', f: { kind: 'voidspawn' } });
T('oniguard', 'Guarda Oni', 'human', 'abyss', { hp: 340, dmg: 38, speed: 96, r: 21, ai: 'melee', atk: ['melee', 'slam'], pal: ['#a8322a', '#3a0a0a', '#ffd070', '#ffe030'], el: 'fogo', f: { head: 'oni', weapon: 'club', skin: '#b8362e', outfit: '#3a2a4a', size: 1.3, horns: true } });
T('abyssbat', 'Morcego do Abismo', 'flyer', 'abyss', { hp: 90, dmg: 28, speed: 175, r: 13, ai: 'swarm', atk: ['swoop'], pal: ['#3a1a5a', '#10061a', '#ff3c8e', '#ff3c8e'], el: 'arcano', f: { kind: 'bat' } });
/* --- especiais --- */
T('dummy', 'Boneco de Treino', 'dummy', 'meadow', { hp: 120, dmg: 0, speed: 0, r: 16, ai: 'stationary', atk: [], pal: ['#c9a35a', '#6a4a22', '#e8c45d', '#e66562'], hostile: false, xp: 0 });
T('lich_minion', 'Esqueleto Convocado', 'human', 'ash', { hp: 50, dmg: 12, speed: 110, r: 14, ai: 'melee', atk: ['melee'], pal: ['#d9d6c3', '#6a6a5a', '#8a9ab0', '#7affc0'], f: { head: 'skull', weapon: 'dagger', skin: '#d9d6c3', outfit: '#d9d6c3', bones: true }, weight: 0 });

/* --- bioma → lista de monstros (tipo, nível mínimo, peso) --- */
const POOLS = {
  meadow: [['slime', 1, 5], ['rabid', 1, 3], ['boar', 2, 4], ['wasp', 3, 3], ['bandit', 4, 3], ['scarecrow', 6, 2]],
  forest: [['wolf', 3, 5], ['spider', 4, 4], ['stag', 6, 3], ['thornling', 5, 3], ['dryad', 8, 2], ['mossgolem', 9, 2], ['ent', 12, 1]],
  jungle: [['viper', 8, 4], ['panther', 9, 3], ['tribal', 10, 4], ['devourer', 11, 2], ['witchdoc', 12, 2], ['beetle', 13, 2]],
  marsh: [['toad', 6, 4], ['mosquito', 6, 3], ['wisp', 7, 3], ['shroom', 8, 2], ['croc', 10, 3], ['bogwitch', 12, 2]],
  dunes: [['scarab', 13, 4], ['scorpion', 14, 4], ['naja', 15, 3], ['raider', 16, 3], ['mummy', 18, 2], ['sandwisp', 20, 2]],
  canyon: [['coyote', 12, 4], ['outlaw', 13, 3], ['armadillo', 14, 3], ['vulture', 15, 3], ['minegolem', 18, 2]],
  frost: [['frostling', 14, 4], ['banshee', 16, 3], ['snowstalker', 17, 3], ['icemage', 18, 2], ['icegolem', 20, 2], ['yeti', 22, 2]],
  mountain: [['ram', 14, 3], ['harpy', 16, 3], ['gargoyle', 18, 3], ['lizard', 20, 3], ['granite', 22, 2], ['troll', 23, 2]],
  volcano: [['imp', 18, 4], ['ember', 19, 4], ['hellhound', 21, 3], ['pyromancer', 22, 2], ['salamander', 24, 2], ['lavagolem', 26, 2]],
  storm: [['stormwisp', 20, 4], ['thunderhawk', 21, 3], ['shockhound', 23, 3], ['cloud', 25, 2], ['stormknight', 27, 2]],
  crystal: [['prismite', 22, 4], ['cryspider', 24, 3], ['geode', 25, 2], ['shardmage', 26, 2], ['crystalguard', 28, 2]],
  arcane: [['starfae', 24, 4], ['astraleye', 26, 3], ['astralserp', 27, 3], ['voidwalker', 29, 2], ['runebot', 31, 2]],
  ash: [['bat', 4, 4], ['skeleton', 6, 4], ['zombie', 6, 3], ['ghost', 8, 3], ['nightstalker', 11, 2], ['necro', 13, 2], ['graveknight', 15, 2]],
  coast: [['crab', 2, 5], ['gull', 3, 3], ['jelly', 5, 3], ['pirate', 8, 3], ['siren', 10, 2]],
  abyss: [['voidspawn', 30, 4], ['abyssbat', 30, 3], ['oniguard', 32, 2]]
};

/* --- afixos de elite --- */
const AFFIXES = {
  veloz: { n: 'Veloz', col: '#7affc0', spd: 1.35, d: 'Move-se muito rápido' },
  blindado: { n: 'Blindado', col: '#cfd6e6', hp: 1.5, arm: .35, d: 'Reduz dano recebido' },
  vampiro: { n: 'Vampírico', col: '#ff4a6a', leech: .3, d: 'Rouba vida' },
  explosivo: { n: 'Explosivo', col: '#ffb24a', boom: true, d: 'Explode ao morrer' },
  congelante: { n: 'Gélido', col: '#9de8ff', el: 'gelo', d: 'Golpes congelam' },
  flamejante: { n: 'Flamejante', col: '#ff815b', el: 'fogo', d: 'Golpes queimam' },
  venenoso: { n: 'Peçonhento', col: '#8ee28b', el: 'natureza', d: 'Golpes envenenam' },
  furioso: { n: 'Furioso', col: '#ff7a3a', dmg: 1.4, d: 'Causa muito mais dano' }
};

/* ===== src/02c-data-bosses.js ===== */
/* ---------- chefes ---------- */
/* ataques: slam fan nova charge summon rain beam leap pulse spiral cone chain trap sweep teleport quake meteor drum */
function B(id, name, o) {
  TYPES[id] = Object.assign({ id, name, arch: 'boss', boss: true, hostile: true, hp: 1500, dmg: 20, speed: 100, r: 36, aggro: 900, ai: 'boss', el: null, pal: ['#888', '#444', '#ccc', '#ff4'], f: {}, xp: 1, coin: 1,
    phases: [{ at: 1, atk: ['slam', 'nova', 'charge'], spd: 1, cd: 1.6 }] }, o);
}
B('guardian', 'Guardião do Abismo', { hpm: .75, dmg: 22, speed: 96, r: 38, el: 'arcano', pal: ['#7b4fa8', '#2a1736', '#d8b0ff', '#ffd84a'], f: { kind: 'guardian' }, title: 'Sentinela da Fenda',
  phases: [{ at: 1, atk: ['slam', 'charge', 'nova'], spd: 1, cd: 1.8 }, { at: .5, atk: ['slam', 'charge', 'nova', 'rain', 'summon'], spd: 1.2, cd: 1.3 }] });
B('ent_anc', 'Ent Ancestral', { hpm: .95, dmg: 23, speed: 78, r: 44, el: 'natureza', pal: ['#6a4a2e', '#2a1a0c', '#5ab04a', '#ffcf5a'], f: { kind: 'entboss' }, title: 'Guardião das Raízes',
  phases: [{ at: 1, atk: ['slam', 'rain', 'spiral'], spd: 1, cd: 1.9 }, { at: .55, atk: ['slam', 'rain', 'summon', 'quake', 'spiral'], spd: 1.15, cd: 1.4 }] });
B('lorde', 'Lorde Ossário', { hpm: 1, dmg: 24, speed: 96, r: 34, el: 'arcano', pal: ['#d8d2b0', '#6f6a58', '#c08aff', '#c08aff'], f: { kind: 'lich' }, title: 'Rei dos Mortos',
  phases: [{ at: 1, atk: ['sweep', 'charge', 'rain'], spd: 1, cd: 1.7 }, { at: .6, atk: ['sweep', 'summon', 'nova', 'rain'], spd: 1.1, cd: 1.4 }, { at: .3, atk: ['sweep', 'summon', 'nova', 'charge', 'spiral'], spd: 1.25, cd: 1.1 }] });
B('hidra', 'Hidra do Brejo', { hpm: 1.1, dmg: 24, speed: 80, r: 40, el: 'natureza', pal: ['#3f8a5a', '#143a2a', '#c8ff7a', '#ffe03a'], f: { kind: 'hydra' }, title: 'Mãe das Cabeças',
  phases: [{ at: 1, atk: ['fan', 'cone', 'slam'], spd: 1, cd: 1.7 }, { at: .6, atk: ['fan', 'cone', 'slam', 'summon', 'rain'], spd: 1.1, cd: 1.4 }, { at: .3, atk: ['fan', 'cone', 'rain', 'spiral', 'charge'], spd: 1.25, cd: 1.1 }] });
B('matriarca', 'Matriarca Venenosa', { hpm: 1, dmg: 25, speed: 104, r: 38, el: 'natureza', pal: ['#58c27a', '#1a4a2c', '#f7ffb0', '#ff3a5a'], f: { kind: 'queen' }, title: 'Rainha das Teias',
  phases: [{ at: 1, atk: ['fan', 'leap', 'trap'], spd: 1, cd: 1.6 }, { at: .55, atk: ['fan', 'leap', 'trap', 'summon', 'rain'], spd: 1.2, cd: 1.3 }] });
B('arquimago', 'Arquimago Astral', { hpm: .95, dmg: 27, speed: 90, r: 30, el: 'arcano', pal: ['#8fb8ff', '#1d2250', '#ffffff', '#ffffff'], f: { kind: 'archmage' }, title: 'Tecelão das Estrelas',
  phases: [{ at: 1, atk: ['beam', 'nova', 'spiral'], spd: 1, cd: 1.6 }, { at: .6, atk: ['beam', 'teleport', 'rain', 'spiral'], spd: 1.15, cd: 1.3 }, { at: .3, atk: ['beam', 'teleport', 'rain', 'nova', 'summon'], spd: 1.3, cd: 1.05 }] });
B('soberana', 'Soberana Geada', { hpm: 1.05, dmg: 28, speed: 92, r: 36, el: 'gelo', pal: ['#bfe8ff', '#3a6a9a', '#ffffff', '#40e0ff'], f: { kind: 'frostqueen' }, title: 'Rainha do Inverno Eterno',
  phases: [{ at: 1, atk: ['fan', 'nova', 'rain'], spd: 1, cd: 1.6 }, { at: .6, atk: ['fan', 'cone', 'rain', 'charge', 'summon'], spd: 1.15, cd: 1.3 }, { at: .3, atk: ['nova', 'cone', 'rain', 'spiral', 'teleport'], spd: 1.3, cd: 1.05 }] });
B('titan', 'Titã da Forja', { hpm: 1.25, dmg: 30, speed: 90, r: 46, el: 'fogo', pal: ['#4a2f36', '#1a0e12', '#ff8a4a', '#ffb35a'], f: { kind: 'titan' }, title: 'Coração em Chamas',
  phases: [{ at: 1, atk: ['slam', 'quake', 'cone'], spd: 1, cd: 1.8 }, { at: .6, atk: ['slam', 'quake', 'meteor', 'cone', 'nova'], spd: 1.12, cd: 1.4 }, { at: .3, atk: ['slam', 'meteor', 'quake', 'charge', 'spiral'], spd: 1.25, cd: 1.1 }] });
B('colosso', 'Faraó Escorpião', { hpm: 1.1, dmg: 31, speed: 110, r: 42, el: 'fogo', pal: ['#d8a84a', '#6a4418', '#ffe8a0', '#ff3a1a'], f: { kind: 'pharaoh' }, title: 'Rei das Areias',
  phases: [{ at: 1, atk: ['charge', 'rain', 'fan'], spd: 1, cd: 1.6 }, { at: .6, atk: ['charge', 'rain', 'summon', 'pulse', 'leap'], spd: 1.15, cd: 1.3 }, { at: .3, atk: ['charge', 'rain', 'pulse', 'leap', 'spiral'], spd: 1.3, cd: 1.0 }] });
B('verme', 'Verme das Profundezas', { hpm: 1.15, dmg: 30, speed: 105, r: 44, el: null, pal: ['#a8785a', '#4a2c1e', '#ffd8b0', '#ffe030'], f: { kind: 'worm' }, title: 'Terror Subterrâneo',
  phases: [{ at: 1, atk: ['leap', 'charge', 'rain'], spd: 1, cd: 1.7 }, { at: .55, atk: ['leap', 'charge', 'rain', 'cone', 'quake'], spd: 1.2, cd: 1.3 }] });
B('raijin', 'Raijin, Senhor da Tempestade', { hpm: 1.15, dmg: 32, speed: 112, r: 36, el: 'raio', pal: ['#ffe371', '#4a3a10', '#ffffff', '#40ffff'], f: { kind: 'raijin' }, title: 'Deus do Trovão',
  phases: [{ at: 1, atk: ['chain', 'rain', 'nova'], spd: 1, cd: 1.5 }, { at: .6, atk: ['chain', 'rain', 'beam', 'drum', 'teleport'], spd: 1.2, cd: 1.2 }, { at: .3, atk: ['chain', 'rain', 'beam', 'drum', 'spiral', 'charge'], spd: 1.35, cd: .95 }] });
B('prisma', 'Imperatriz dos Cristais', { hpm: 1.2, dmg: 33, speed: 94, r: 36, el: 'arcano', pal: ['#c2b7ff', '#2a2060', '#ffffff', '#ff6ad0'], f: { kind: 'empress' }, title: 'Mil Reflexos',
  phases: [{ at: 1, atk: ['beam', 'fan', 'nova'], spd: 1, cd: 1.6 }, { at: .6, atk: ['beam', 'fan', 'summon', 'rain', 'spiral'], spd: 1.15, cd: 1.3 }, { at: .3, atk: ['beam', 'nova', 'rain', 'teleport', 'spiral'], spd: 1.3, cd: 1.05 }] });
B('rei_sombras', 'Rei das Sombras', { hpm: 1.15, dmg: 36, speed: 128, r: 35, el: 'arcano', pal: ['#a287cb', '#1a1030', '#e0c8ff', '#ff3a6a'], f: { kind: 'shadowking' }, title: 'Trono da Noite',
  phases: [{ at: 1, atk: ['teleport', 'charge', 'sweep'], spd: 1, cd: 1.5 }, { at: .6, atk: ['teleport', 'charge', 'sweep', 'summon', 'nova'], spd: 1.2, cd: 1.2 }, { at: .3, atk: ['teleport', 'charge', 'sweep', 'rain', 'spiral'], spd: 1.35, cd: .95 }] });
B('kraken', 'Kraken Ancião', { hpm: 1.1, dmg: 26, speed: 70, r: 46, el: 'gelo', pal: ['#4a6ac8', '#14204a', '#a0ffe0', '#ffe03a'], f: { kind: 'kraken' }, title: 'Terror das Marés',
  phases: [{ at: 1, atk: ['slam', 'cone', 'rain'], spd: 1, cd: 1.8 }, { at: .6, atk: ['slam', 'cone', 'rain', 'summon', 'pulse'], spd: 1.12, cd: 1.4 }, { at: .3, atk: ['slam', 'rain', 'pulse', 'spiral', 'quake'], spd: 1.25, cd: 1.1 }] });
B('dragao', 'Dragão Ancião', { hpm: 1.3, dmg: 34, speed: 105, r: 48, el: 'fogo', pal: ['#c0402a', '#4a1008', '#ffd070', '#ffe030'], f: { kind: 'dragon' }, title: 'Flagelo das Montanhas',
  phases: [{ at: 1, atk: ['cone', 'rain', 'charge'], spd: 1, cd: 1.6 }, { at: .6, atk: ['cone', 'meteor', 'charge', 'nova', 'leap'], spd: 1.15, cd: 1.3 }, { at: .3, atk: ['cone', 'meteor', 'charge', 'quake', 'spiral'], spd: 1.3, cd: 1.0 }] });
B('oni', 'Oni do Abismo', { hpm: 2.4, dmg: 40, speed: 118, r: 54, el: 'fogo', pal: ['#b8322a', '#2a0a14', '#ffd070', '#ffe030'], f: { kind: 'oni' }, title: 'O Fim de Todas as Coisas', final: true,
  phases: [{ at: 1, atk: ['slam', 'sweep', 'charge', 'nova'], spd: 1, cd: 1.5 },
           { at: .66, atk: ['slam', 'drum', 'chain', 'meteor', 'summon', 'cone'], spd: 1.15, cd: 1.2 },
           { at: .33, atk: ['slam', 'meteor', 'beam', 'quake', 'spiral', 'chain', 'teleport', 'charge'], spd: 1.3, cd: .9 }] });

/* ---------- masmorras ---------- */
/* theme: crypt sewer temple forge ice sand roots storm crystal shadow reef mine dragon oni */
const DUNGEONS = [
  { id: 'raizes', name: 'Raízes Antigas', sub: 'A floresta guarda um coração adormecido', x: 6600, y: 6200, biome: 'forest', theme: 'roots', boss: 'ent_anc', mix: ['wolf', 'spider', 'thornling', 'dryad', 'mossgolem'], acc: '#8fe28b', floor: '#3a4a30', wall: '#1e2a1a', rooms: 5 },
  { id: 'catacumbas', name: 'Catacumbas Esquecidas', sub: 'Os mortos não descansam', x: 3500, y: 6600, biome: 'ash', theme: 'crypt', boss: 'lorde', mix: ['skeleton', 'zombie', 'ghost', 'nightstalker', 'bat'], acc: '#ffb45a', floor: '#4a4338', wall: '#2b2620', rooms: 6 },
  { id: 'cisterna', name: 'Cisterna Esmeralda', sub: 'Algo se move sob a água', x: 6300, y: 9900, biome: 'marsh', theme: 'sewer', boss: 'hidra', mix: ['toad', 'croc', 'shroom', 'wisp', 'bogwitch'], acc: '#7dffb0', floor: '#2f4a42', wall: '#16261f', rooms: 6 },
  { id: 'ninho', name: 'Ninho da Matriarca', sub: 'Teias cobrem cada passagem', x: 3000, y: 9800, biome: 'jungle', theme: 'roots', boss: 'matriarca', mix: ['spider', 'viper', 'devourer', 'witchdoc', 'beetle'], acc: '#b7ff6a', floor: '#2f4a2c', wall: '#102014', rooms: 6 },
  { id: 'templo', name: 'Templo Astral', sub: 'O céu se partiu aqui', x: 6800, y: 2600, biome: 'arcane', theme: 'temple', boss: 'arquimago', mix: ['starfae', 'astraleye', 'voidwalker', 'runebot', 'astralserp'], acc: '#8fb8ff', floor: '#3b3a66', wall: '#1a1838', rooms: 7 },
  { id: 'prismatico', name: 'Palácio Prismático', sub: 'Um coração de cristal desperta', x: 2800, y: 3000, biome: 'crystal', theme: 'crystal', boss: 'prisma', mix: ['prismite', 'crystalguard', 'shardmage', 'cryspider', 'geode'], acc: '#b6e7fd', floor: '#43567e', wall: '#202b51', rooms: 7 },
  { id: 'forja', name: 'Forja do Abismo', sub: 'O fogo guarda um segredo', x: 10800, y: 6800, biome: 'volcano', theme: 'forge', boss: 'titan', mix: ['ember', 'lavagolem', 'pyromancer', 'hellhound', 'imp'], acc: '#ff8a4a', floor: '#4d3640', wall: '#24121a', rooms: 7 },
  { id: 'recife', name: 'Templo das Marés', sub: 'As ondas guardam cadáveres', x: 1500, y: 10900, biome: 'coast', theme: 'reef', boss: 'kraken', mix: ['crab', 'jelly', 'siren', 'pirate', 'gull'], acc: '#6af0e0', floor: '#2c5a68', wall: '#102a38', rooms: 6 },
  { id: 'minas', name: 'Minas do Cânion', sub: 'Algo cavou fundo demais', x: 12000, y: 11000, biome: 'canyon', theme: 'mine', boss: 'verme', mix: ['coyote', 'outlaw', 'armadillo', 'minegolem', 'vulture'], acc: '#ffc15a', floor: '#6a4a3a', wall: '#33201a', rooms: 6 },
  { id: 'trono', name: 'Trono das Sombras', sub: 'A noite esconde seu rei', x: 9700, y: 1700, biome: 'ash', theme: 'shadow', boss: 'rei_sombras', mix: ['nightstalker', 'graveknight', 'necro', 'ghost', 'voidwalker'], acc: '#bb9dff', floor: '#3e394f', wall: '#211d30', rooms: 7 },
  { id: 'trovao', name: 'Pico do Trovão', sub: 'O céu ruge sobre as pedras', x: 12800, y: 9000, biome: 'storm', theme: 'storm', boss: 'raijin', mix: ['stormwisp', 'thunderhawk', 'shockhound', 'stormknight', 'cloud'], acc: '#f7df77', floor: '#3b5864', wall: '#182932', rooms: 7 },
  { id: 'dragao', name: 'Ninho do Dragão', sub: 'Ossos e ouro derretido', x: 14000, y: 5400, biome: 'mountain', theme: 'dragon', boss: 'dragao', mix: ['lizard', 'gargoyle', 'harpy', 'troll', 'salamander'], acc: '#ff9a4a', floor: '#5a4a46', wall: '#2a201e', rooms: 7 },
  { id: 'observatorio', name: 'Observatório Glacial', sub: 'O frio preserva os segredos', x: 11500, y: 1900, biome: 'frost', theme: 'ice', boss: 'soberana', mix: ['frostling', 'icegolem', 'snowstalker', 'banshee', 'icemage', 'yeti'], acc: '#9de8ff', floor: '#465b68', wall: '#1b2935', rooms: 7 },
  { id: 'colosso', name: 'Colosso das Dunas', sub: 'A areia se ergue contra você', x: 15800, y: 9800, biome: 'dunes', theme: 'sand', boss: 'colosso', mix: ['scorpion', 'scarab', 'raider', 'mummy', 'sandwisp', 'naja'], acc: '#ffbd69', floor: '#8a6a44', wall: '#44301e', rooms: 7 }
];
const ONI_DUNGEON = { id: 'abismo', name: 'Coração do Abismo', sub: 'Onde todas as coisas terminam', x: 9000, y: 6600, biome: 'abyss', theme: 'oni', boss: 'oni', mix: ['voidspawn', 'oniguard', 'abyssbat'], acc: '#ff3c8e', floor: '#2a1838', wall: '#0e0816', rooms: 0, final: true };
const DUNGEON_BY_ID = {}; for (const d of DUNGEONS) DUNGEON_BY_ID[d.id] = d; DUNGEON_BY_ID.abismo = ONI_DUNGEON;
const FIELD_BOSS = { id: 'guardian', x: 7700, y: 7900, r: 260 };

/* ---------- aldeias ---------- */
const VILLAGES = [
  { id: 'aurora', name: 'Vila Aurora', x: 5400, y: 7500, biome: 'meadow', start: true, npcs: ['elder', 'merchant', 'healer', 'blacksmith', 'alchemist', 'bard', 'inn', 'guard'], houses: 8 },
  { id: 'salgado', name: 'Porto Salgado', x: 1750, y: 8100, biome: 'coast', npcs: ['merchant', 'hunter', 'inn', 'scout'], houses: 6 },
  { id: 'raiz', name: 'Acampamento Raiz', x: 8500, y: 5300, biome: 'forest', npcs: ['healer', 'scout', 'merchant'], houses: 4 },
  { id: 'palafita', name: 'Aldeia Palafita', x: 3700, y: 10900, biome: 'jungle', npcs: ['alchemist', 'sage', 'inn', 'hunter'], houses: 5 },
  { id: 'pantano', name: 'Povoado do Brejo', x: 7300, y: 10800, biome: 'marsh', npcs: ['alchemist', 'healer', 'scout'], houses: 4 },
  { id: 'vigilia', name: 'Vigília Sombria', x: 2500, y: 7700, biome: 'ash', npcs: ['guard', 'blacksmith', 'sage'], houses: 4 },
  { id: 'cristalina', name: 'Vila Cristalina', x: 3900, y: 3700, biome: 'crystal', npcs: ['merchant', 'sage', 'inn', 'cartographer'], houses: 5 },
  { id: 'torre', name: 'Torre dos Sábios', x: 7700, y: 3300, biome: 'arcane', npcs: ['sage', 'cartographer', 'alchemist'], houses: 3 },
  { id: 'posto', name: 'Posto Gélido', x: 13700, y: 2900, biome: 'frost', npcs: ['inn', 'blacksmith', 'hunter', 'healer'], houses: 5 },
  { id: 'cume', name: 'Forte Cume', x: 12700, y: 5600, biome: 'mountain', npcs: ['guard', 'blacksmith', 'merchant', 'inn'], houses: 5 },
  { id: 'brasa', name: 'Forjaria Brasa', x: 11700, y: 7600, biome: 'volcano', npcs: ['blacksmith', 'merchant', 'healer'], houses: 4 },
  { id: 'estacao', name: 'Estação Tempestade', x: 11400, y: 9700, biome: 'storm', npcs: ['scout', 'alchemist', 'inn'], houses: 4 },
  { id: 'mercado', name: 'Mercado do Cânion', x: 12900, y: 10500, biome: 'canyon', npcs: ['merchant', 'hunter', 'inn', 'blacksmith'], houses: 6 },
  { id: 'oasis', name: 'Oásis Miragem', x: 15900, y: 8500, biome: 'dunes', npcs: ['merchant', 'healer', 'sage', 'inn'], houses: 5 }
];
const VILLAGE_BY_ID = {}; for (const v of VILLAGES) VILLAGE_BY_ID[v.id] = v;

/* ---------- NPCs ---------- */
const NPC_ROLES = {
  elder: { title: 'Ancião', names: ['Orin'], col: '#e8d9a8', skin: '#e0c4a4', outfit: '#8a6a3a', hair: '#e8e8e8', head: 'bald', beard: 'longa', staff: true, svc: 'quest' },
  merchant: { title: 'Mercador', names: ['Dorin', 'Salma', 'Bartol', 'Jeruza', 'Kaleb'], col: '#ebce85', skin: '#d4a87a', outfit: '#a8582a', hair: '#3a2a1a', head: 'hat', pack: true, svc: 'shop' },
  healer: { title: 'Curandeiro', names: ['Elyra', 'Mirel', 'Aziel', 'Sorrel'], col: '#8fe4af', skin: '#f1d2b5', outfit: '#e8f0e0', hair: '#c9a05a', head: 'hood', cross: true, svc: 'heal' },
  blacksmith: { title: 'Ferreiro', names: ['Brakka', 'Thorgal', 'Hilda', 'Rurik'], col: '#f6a781', skin: '#b4784a', outfit: '#5a4a3a', hair: '#2a1a10', head: 'bald', beard: 'cheia', apron: true, svc: 'smith' },
  alchemist: { title: 'Alquimista', names: ['Ivara', 'Zeno', 'Pomona', 'Quill'], col: '#d2a3fa', skin: '#e6d2b8', outfit: '#5a3a7a', hair: '#8a5aa8', head: 'goggles', svc: 'alchemy' },
  bard: { title: 'Menestrel', names: ['Nim', 'Lysandra', 'Fenn'], col: '#c9b5f8', skin: '#e8c4a2', outfit: '#3a6aa8', hair: '#e8a05a', head: 'feather', lute: true, svc: 'bard' },
  sage: { title: 'Sábio', names: ['Orryn', 'Cassiel', 'Yara', 'Meldor'], col: '#acd5f0', skin: '#d8c0a0', outfit: '#4a5aa8', hair: '#d8d8e8', head: 'hat', beard: 'longa', book: true, svc: 'sage' },
  scout: { title: 'Batedor', names: ['Kael', 'Tarek', 'Rhea', 'Finn'], col: '#9cc4ee', skin: '#d0a07a', outfit: '#3a6a3a', hair: '#5a3a1a', head: 'hood', bow: true, svc: 'scout' },
  inn: { title: 'Estalajadeiro', names: ['Mara', 'Bruno', 'Odalys', 'Pietro'], col: '#f0b87a', skin: '#e0b890', outfit: '#a85a3a', hair: '#7a4a2a', head: 'bald', apron: true, mug: true, svc: 'inn' },
  guard: { title: 'Guarda', names: ['Torvi', 'Alric', 'Brenna', 'Cassian'], col: '#b8c4d8', skin: '#d0a888', outfit: '#6a7a98', hair: '#3a2a20', head: 'helm', spear: true, svc: 'guard' },
  hunter: { title: 'Caçador de Recompensas', names: ['Vex', 'Dara', 'Mogg', 'Sable'], col: '#e0907a', skin: '#c89870', outfit: '#6a3a2a', hair: '#1a1a1a', head: 'hood', bow: true, svc: 'bounty' },
  cartographer: { title: 'Cartógrafo', names: ['Lenna', 'Ostin', 'Veya'], col: '#e8d890', skin: '#e0c4a0', outfit: '#7a6a3a', hair: '#a88a4a', head: 'hat', scroll: true, svc: 'maps' }
};
const NPC_LINES = {
  elder: ['Há tempos o Abismo dorme sob estas terras. Quatorze selos o mantêm preso.', 'Cada masmorra guarda um dos selos. Purifique todos, e a Fenda se abrirá.', 'Descanse no santuário antes de partir. Ele cura e guarda o seu caminho.'],
  merchant: ['As estradas mudam, os preços não!', 'Poções, elixires, pergaminhos... o que precisar!', 'Dizem que o cânion tem os melhores minérios.'],
  healer: ['O abismo cobra caro de quem não se cuida.', 'Deixe-me ver esses ferimentos.', 'A luz cura o corpo; o descanso, a alma.'],
  blacksmith: ['Um bom fio vale mais que cem promessas.', 'Traga-me suas armas e eu as farei cantar.', 'Armadura fraca é caixão com dobradiças.'],
  alchemist: ['Cada bioma tem seus venenos... e seus antídotos.', 'Misturei uma coisinha nova. Só não pergunte do cheiro.', 'Elixires fortalecem por pouco tempo, mas fazem milagres.'],
  bard: ['Que sua lenda atravesse estas dunas!', 'Por algumas moedas, uma canção de coragem!', 'Já ouviu a balada do Oni? Ninguém sobreviveu para cantar.'],
  sage: ['Quatorze selos, quatorze guardiões, e um senhor acima de todos: o Oni do Abismo.', 'Elementos têm fraquezas. Fogo derrete gelo; gelo apaga fogo.', 'O mapa do mundo é vasto, mas o cartógrafo pode ajudar.'],
  scout: ['Cada terreno tem suas feras. Observe os sinais.', 'Vi algo enorme voando para o leste, perto dos picos.', 'À noite, os monstros ficam mais audaciosos.'],
  inn: ['Uma cama quente e uma sopa farta!', 'Descanse. O mundo estará aqui amanhã.', 'Aqui você pode dormir e salvar o jogo com segurança.'],
  guard: ['Estamos de olho nas estradas.', 'Se vir algo estranho na Fenda, avise.', 'Esta aldeia está segura, forasteiro.'],
  hunter: ['Contratos abertos! Há sempre algo para caçar.', 'A caça paga bem. Traga provas.', 'Elites aparecem com marcas douradas. Não as subestime.'],
  cartographer: ['Posso revelar o que ainda não foi explorado.', 'Mapas são ouro para quem se perde.', 'Cada região tem seus segredos escondidos.']
};

/* ===== src/03a-world-terrain.js ===== */
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

/* ===== src/03b-world-chunks.js ===== */
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

/* ===== src/03c-world-decor.js ===== */
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

/* ===== src/04a-sprites-core.js ===== */
/* ============================================================
   FÁBRICA DE SPRITES — desenha cada objeto uma vez num canvas
   e reutiliza. Origem (0,0) = base do objeto no chão.
   ============================================================ */
const SPR = {};                     // tipo -> (g, s, v, r, pal)
const SWAY = new Set(['oak', 'birch', 'pine', 'jtree', 'palm', 'willow', 'snowpine', 'bamboo', 'reeds', 'fern', 'bigleaf', 'stormtree', 'frozentree', 'arctree', 'crystaltree', 'eyestalk', 'banner', 'bush', 'flowerbush', 'bushflower', 'deadbush']);
const spriteCache = new Map();
const BK = 1.5;
function spriteFor(kind, v, s, b) {
  const sq = Math.max(6, Math.round(s / 3) * 3), key = kind + '|' + v + '|' + sq + '|' + b;
  let sp = spriteCache.get(key); if (sp) return sp;
  const fn = SPR[kind]; const W = Math.ceil(sq * 3.1 + 24), H = Math.ceil(sq * 3.4 + 24), pad = 14;
  const cv = document.createElement('canvas'); cv.width = Math.ceil(W * BK); cv.height = Math.ceil((H + pad) * BK);
  const g = cv.getContext('2d'); g.scale(BK, BK); g.translate(W / 2, H);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const r = mulberry((hash2(v * 31 + sq, kind.length * 7 + kind.charCodeAt(0), 5) * 4294967296) | 0);
  if (fn) { try { fn(g, sq, v, r, BIOMES[b] || BIOMES.meadow); } catch (e) { console.warn('sprite', kind, e); } }
  else { g.fillStyle = '#f0f'; g.fillRect(-6, -12, 12, 12); }
  sp = { cv, w: W, h: H + pad, ox: W / 2, oy: H };
  spriteCache.set(key, sp);
  if (spriteCache.size > 2600) { const k0 = spriteCache.keys().next().value; spriteCache.delete(k0); }
  return sp;
}
function drawSprite(c, kind, v, s, b, x, y, sway = 0, flip = false, a = 1) {
  const sp = spriteFor(kind, v, s, b), sc = s / Math.max(6, Math.round(s / 3) * 3);
  c.save(); c.translate(x, y);
  if (sway) c.transform(1, 0, sway, 1, 0, 0);
  if (flip) c.scale(-1, 1);
  if (sc !== 1) c.scale(sc, sc);
  if (a < 1) c.globalAlpha = a;
  c.drawImage(sp.cv, -sp.ox, -sp.oy, sp.w, sp.h);
  c.restore();
}

/* ---------- ferramentas de desenho ---------- */
const circ = (g, x, y, r) => { g.beginPath(); g.arc(x, y, Math.max(.1, r), 0, TAU); g.fill(); };
const ell = (g, x, y, rx, ry, rot = 0) => { g.beginPath(); g.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot, 0, TAU); g.fill(); };
function poly(g, pts, fill, stroke, lw = 1) {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}
function shadowE(g, rx, ry, a = .3, dx = 0) { g.fillStyle = `rgba(8,10,16,${a})`; ell(g, dx, ry * .25, rx, ry); g.fillStyle = `rgba(8,10,16,${a * .6})`; ell(g, dx, ry * .25, rx * .7, ry * .7); }
function grad(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c)); return gr; }
function glowDot(g, x, y, r, col) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; circ(g, x, y, r); }
function trunk(g, h, w, col, dk, r, lean = 0) {
  const hl = shade(col, .22);
  g.beginPath(); g.moveTo(-w * .9, 0); g.quadraticCurveTo(-w * .5, -h * .4, -w * .42 + lean, -h); g.lineTo(w * .42 + lean, -h); g.quadraticCurveTo(w * .5, -h * .4, w * .9, 0);
  g.quadraticCurveTo(w * .3, 3, 0, 2); g.quadraticCurveTo(-w * .3, 3, -w * .9, 0); g.closePath();
  g.fillStyle = grad(g, -w, 0, w, 0, [dk, col, col, hl]); g.fill(); g.strokeStyle = 'rgba(10,6,4,.45)'; g.lineWidth = 1; g.stroke();
  g.strokeStyle = 'rgba(10,6,4,.35)'; g.lineWidth = 1;
  for (let i = 0; i < 4; i++) { const yy = -h * (.12 + r() * .75), xx = (r() - .5) * w * .8; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + (r() - .5) * 2, yy - 5 - r() * 5); g.stroke(); }
  g.fillStyle = dk; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * w * .5, -1); g.quadraticCurveTo(sx * w * 1.5, 1, sx * w * 1.9, 4); g.quadraticCurveTo(sx * w * 1.1, 4, sx * w * .5, 4); g.fill(); }
}
function crown(g, cx, cy, R, cols, r, n = 9, squash = .86) {
  const P = []; for (let i = 0; i < n; i++) { const a = i / n * TAU + r() * .6, d = R * (.42 + r() * .42); P.push({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d * squash, rr: R * (.42 + r() * .26) }); }
  g.fillStyle = cols[0]; for (const p of P) circ(g, p.x, p.y + R * .13, p.rr); circ(g, cx, cy + R * .12, R * .72);
  g.strokeStyle = 'rgba(6,16,8,.35)'; g.lineWidth = 1.2; g.beginPath(); g.arc(cx, cy + R * .12, R * .72, 0, TAU); g.stroke();
  g.fillStyle = cols[1]; for (const p of P) circ(g, p.x, p.y, p.rr * .93); circ(g, cx, cy, R * .62);
  g.fillStyle = cols[2]; for (const p of P) if (p.y < cy + R * .15) circ(g, p.x - R * .07, p.y - R * .1, p.rr * .55);
  g.fillStyle = cols[3]; for (let i = 0; i < 16; i++) { const a = r() * TAU, d = r() * R * .85; ell(g, cx + Math.cos(a) * d - R * .08, cy + Math.sin(a) * d * squash - R * .12, R * .09, R * .05, a); }
  g.fillStyle = 'rgba(8,24,10,.28)'; for (let i = 0; i < 9; i++) { const a = r() * TAU, d = R * (.25 + r() * .6); ell(g, cx + Math.cos(a) * d + R * .06, cy + R * .1 + Math.abs(Math.sin(a)) * d * .6, R * .09, R * .05, a); }
}
function rockShape(g, rx, ry, col, r, mossy, snow) {
  const n = 8, pts = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, k = .78 + r() * .3; pts.push([Math.cos(a) * rx * k, -ry * .55 + Math.sin(a) * ry * .55 * k]); }
  g.fillStyle = 'rgba(8,10,16,.3)'; ell(g, 0, 2, rx * 1.05, ry * .32);
  poly(g, pts, col, 'rgba(8,8,12,.55)', 1.2);
  poly(g, [pts[4], pts[5], pts[6], pts[7], pts[0]], shade(col, -.2)); // face inferior sombreada
  poly(g, [pts[1], pts[2], pts[3], pts[4], [0, -ry * .5]], shade(col, .12));
  poly(g, [pts[6], pts[7], pts[0], pts[1], [0, -ry * .55]], shade(col, .24));
  g.strokeStyle = 'rgba(6,6,10,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(pts[3][0], pts[3][1]); g.lineTo(0, -ry * .5); g.lineTo(pts[0][0], pts[0][1]); g.moveTo(0, -ry * .5); g.lineTo(pts[5][0], pts[5][1]); g.stroke();
  if (mossy) { g.fillStyle = 'rgba(86,140,64,.8)'; for (let i = 0; i < 5; i++) ell(g, (r() - .5) * rx * 1.1, -ry * (.85 + r() * .4), rx * .24, ry * .1, 0); }
  if (snow) { g.fillStyle = 'rgba(250,252,255,.92)'; g.beginPath(); g.moveTo(pts[6][0], pts[6][1]); for (const i of [7, 0, 1, 2]) g.lineTo(pts[i][0], pts[i][1] * .9 - 2); g.quadraticCurveTo(0, -ry * .5, pts[6][0], pts[6][1]); g.fill(); }
}
function crystalShape(g, x, y, h, w, col, ang = 0, glow = true) {
  g.save(); g.translate(x, y); g.rotate(ang);
  if (glow) glowDot(g, 0, -h * .5, h * .9, alpha(col, .25));
  const lt = shade(col, .55), dk = shade(col, -.45), md = col;
  poly(g, [[-w, 0], [-w * .8, -h * .72], [0, -h], [0, 0]], lt); poly(g, [[0, 0], [0, -h], [w * .8, -h * .72], [w, 0]], dk);
  poly(g, [[-w * .8, -h * .72], [0, -h], [0, -h * .62]], '#ffffffaa'); poly(g, [[-w * .3, 0], [-w * .45, -h * .6], [0, -h * .62], [0, 0]], md);
  g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-w, 0); g.lineTo(-w * .8, -h * .72); g.lineTo(0, -h); g.lineTo(w * .8, -h * .72); g.lineTo(w, 0); g.moveTo(0, -h); g.lineTo(0, 0); g.stroke();
  g.restore();
}
const GREENS = [['#1f4a29', '#2f6a35', '#4f9a4a', '#8ccf70'], ['#265630', '#3a7a3c', '#62a850', '#a4d878'], ['#244e3a', '#2f7a58', '#52aa78', '#98e0b0'], ['#5e3218', '#a0541e', '#d8862e', '#f4c458']];
const BARK = [['#6a4a2a', '#41301c'], ['#7a5a38', '#4a3622'], ['#5a4030', '#35261a']];
const gPal = (v, s) => GREENS[v === 3 ? ((s * 7) | 0) % 3 === 0 ? 3 : 0 : v % 3];
const bPal = v => BARK[v % 3];

/* ---------- campo / floresta ---------- */
SPR.oak = (g, s, v, r) => { const [c, d] = bPal(v); shadowE(g, s * .75, s * .24); trunk(g, s * .95, s * .26, c, d, r); const gp = gPal(v, s); crown(g, 0, -s * 1.35, s * .8, gp, r, 10); g.strokeStyle = d; g.lineWidth = s * .07; g.beginPath(); g.moveTo(0, -s * .8); g.lineTo(-s * .22, -s * 1.05); g.moveTo(0, -s * .75); g.lineTo(s * .2, -s * 1.0); g.stroke(); };
SPR.birch = (g, s, v, r) => {
  shadowE(g, s * .55, s * .18); const w = s * .16; g.fillStyle = grad(g, -w, 0, w, 0, ['#cfcab8', '#f2efe4', '#fffef6']); g.beginPath(); g.moveTo(-w, 0); g.lineTo(-w * .6, -s * 1.5); g.lineTo(w * .6, -s * 1.5); g.lineTo(w, 0); g.closePath(); g.fill();
  g.fillStyle = '#2a2a28'; for (let i = 0; i < 8; i++) g.fillRect(-w * .9 + r() * w, -s * (.1 + i * .17), w * (.5 + r() * .7), 2);
  const gp = v % 2 ? ['#6a8a2a', '#92b838', '#bcd852', '#e8f08a'] : ['#3f7a3a', '#62a850', '#92cf6a', '#c8ee98']; crown(g, 0, -s * 1.7, s * .55, gp, r, 8, 1.15);
};
SPR.pine = (g, s, v, r) => {
  shadowE(g, s * .55, s * .2); g.fillStyle = '#4a3220'; g.fillRect(-s * .08, -s * .35, s * .16, s * .4);
  const cols = [['#173a2a', '#225540', '#3a8060'], ['#1c3f26', '#2a6334', '#48924e'], ['#163d36', '#215a50', '#3a8a7a']][v % 3];
  for (let i = 0; i < 5; i++) {
    const y = -s * (.25 + i * .36), w = s * (.7 - i * .115), h = s * .56;
    poly(g, [[-w, y], [0, y - h], [w, y]], cols[0]); poly(g, [[0, y - h], [w, y], [w * .1, y - h * .05]], cols[1]); poly(g, [[0, y - h], [-w, y], [-w * .6, y - h * .1], [-w * .1, y - h * .55]], cols[2]);
    g.strokeStyle = 'rgba(6,16,10,.4)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-w, y); g.quadraticCurveTo(0, y + 4, w, y); g.stroke();
  }
};
SPR.bush = (g, s, v, r) => { shadowE(g, s * .75, s * .22); const gp = gPal(v, s); crown(g, 0, -s * .5, s * .62, gp, r, 6, .75); if (v % 2) { g.fillStyle = '#d83a4a'; for (let i = 0; i < 6; i++) circ(g, (r() - .5) * s * .9, -s * (.3 + r() * .5), s * .06); g.fillStyle = '#ffffff88'; for (let i = 0; i < 3; i++) circ(g, (r() - .5) * s * .9, -s * (.4 + r() * .4), s * .02); } };
SPR.flowerbush = (g, s, v, r) => { SPR.bush(g, s, 0, r); const cs = [['#f6a6c8', '#ffe0ee'], ['#ffd25a', '#fff2b0'], ['#b89cff', '#e8dcff'], ['#ff8a7a', '#ffd0c8']][v % 4]; for (let i = 0; i < 8; i++) { const x = (r() - .5) * s * 1.0, y = -s * (.3 + r() * .6); g.fillStyle = cs[0]; for (let k = 0; k < 5; k++) { const a = k * TAU / 5; ell(g, x + Math.cos(a) * s * .075, y + Math.sin(a) * s * .075, s * .06, s * .04, a); } g.fillStyle = cs[1]; circ(g, x, y, s * .035); } };
SPR.rock = (g, s, v, r, pal) => rockShape(g, s * .7, s * .62, mixHex(pal.g3.length === 7 ? pal.g3 : '#6a6a60', '#8a8a82', .65), r, v % 2 === 0 && (pal === BIOMES.meadow || pal === BIOMES.forest || pal === BIOMES.jungle || pal === BIOMES.marsh));
SPR.stump = (g, s, v, r) => { const [c, d] = bPal(v); shadowE(g, s * .7, s * .2); g.fillStyle = grad(g, -s * .5, 0, s * .5, 0, [d, c, shade(c, .2)]); g.beginPath(); g.moveTo(-s * .5, 0); g.lineTo(-s * .4, -s * .55); g.lineTo(s * .4, -s * .55); g.lineTo(s * .5, 0); g.quadraticCurveTo(0, s * .12, -s * .5, 0); g.fill(); ell(g, 0, -s * .55, s * .4, s * .16); g.fillStyle = '#d9b27a'; ell(g, 0, -s * .55, s * .34, s * .12); g.strokeStyle = '#a07a46'; g.lineWidth = 1; for (const k of [.26, .16, .07]) { g.beginPath(); g.ellipse(0, -s * .55, s * k, s * k * .36, 0, 0, TAU); g.stroke(); } g.fillStyle = '#5a9a4a'; ell(g, s * .3, -s * .05, s * .15, s * .05); };
SPR.haystack = (g, s, v, r) => { shadowE(g, s * .8, s * .22); g.fillStyle = grad(g, -s, 0, s, 0, ['#b08a2a', '#e0bc52', '#f4dc86']); g.beginPath(); g.moveTo(-s * .75, 0); g.quadraticCurveTo(-s * .8, -s * .9, 0, -s * 1.05); g.quadraticCurveTo(s * .8, -s * .9, s * .75, 0); g.quadraticCurveTo(0, s * .15, -s * .75, 0); g.fill(); g.strokeStyle = 'rgba(120,80,10,.5)'; g.lineWidth = 1; for (let i = 0; i < 14; i++) { const x = (r() - .5) * s * 1.3; g.beginPath(); g.moveTo(x * .6, -s * .95 + r() * 8); g.lineTo(x, -r() * s * .4); g.stroke(); } };
SPR.mushroom = (g, s, v, r) => { shadowE(g, s * .8, s * .2); const cs = [['#d63a3a', '#ff7a6a'], ['#a8662a', '#d89a5a'], ['#8a4ac8', '#c89aff']][v % 3]; for (let i = 0; i < 3; i++) { const x = (i - 1) * s * .42, h = s * (.55 + r() * .4), rr = s * (.3 + r() * .12); g.fillStyle = '#efe6d0'; g.fillRect(x - rr * .22, -h, rr * .44, h); g.fillStyle = cs[0]; g.beginPath(); g.ellipse(x, -h, rr, rr * .7, 0, Math.PI, 0); g.quadraticCurveTo(x, -h + rr * .3, x - rr, -h); g.fill(); g.fillStyle = cs[1]; ell(g, x - rr * .3, -h - rr * .35, rr * .35, rr * .15); g.fillStyle = '#fff'; circ(g, x + rr * .35, -h - rr * .3, rr * .12); circ(g, x - rr * .1, -h - rr * .5, rr * .09); } };
SPR.log = (g, s, v, r) => { const [c, d] = bPal(v); shadowE(g, s * 1.1, s * .22); g.fillStyle = grad(g, 0, -s * .55, 0, 0, [shade(c, .2), c, d]); g.beginPath(); g.roundRect(-s * 1.05, -s * .5, s * 2.1, s * .5, s * .2); g.fill(); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-s + r() * s * 2, -s * .45); g.lineTo(-s + r() * s * 2, -s * .05); g.stroke(); } g.fillStyle = '#d9b27a'; ell(g, s * 1.02, -s * .25, s * .12, s * .25); g.strokeStyle = '#a07a46'; g.beginPath(); g.ellipse(s * 1.02, -s * .25, s * .06, s * .13, 0, 0, TAU); g.stroke(); g.fillStyle = '#5a9a4a'; ell(g, -s * .3, -s * .5, s * .35, s * .07); };
SPR.fern = (g, s, v, r) => { const gp = gPal(v, s); for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * .36 + (r() - .5) * .2, L = s * (.7 + r() * .4); g.strokeStyle = gp[1]; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); const ex = Math.cos(a) * L, ey = Math.sin(a) * L; g.quadraticCurveTo(ex * .4, ey * .6 - 4, ex, ey + L * .15); g.stroke(); g.fillStyle = i % 2 ? gp[2] : gp[1]; for (let k = 1; k < 7; k++) { const t = k / 7, px = ex * t, py = ey * t * (1 - .12 * t) - 3 * (1 - t); ell(g, px, py, s * .13 * (1 - t * .6), s * .05, a + 1.2); ell(g, px, py, s * .13 * (1 - t * .6), s * .05, a - 1.2); } } };
SPR.jtree = (g, s, v, r) => { shadowE(g, s * .95, s * .28); const [c, d] = bPal(v); trunk(g, s * 1.15, s * .3, c, d, r, s * .06); const gp = [['#14472c', '#1d6638', '#34964a', '#76d070'], ['#17503a', '#22745a', '#3ca47a', '#84e0b0'], ['#1c4a20', '#2c7a30', '#48ac3e', '#98e060']][v % 3];
  crown(g, -s * .35, -s * 1.55, s * .62, gp, r, 7); crown(g, s * .4, -s * 1.5, s * .6, gp, r, 7); crown(g, 0, -s * 1.95, s * .66, gp, r, 8);
  g.strokeStyle = '#2a8a3a'; g.lineWidth = 2; for (let i = 0; i < 5; i++) { const x = (r() - .5) * s * 1.2; g.beginPath(); g.moveTo(x, -s * 1.4); g.bezierCurveTo(x + 4, -s * 1.1, x - 4, -s * .8, x + 2, -s * (.5 + r() * .3)); g.stroke(); }
  g.fillStyle = ['#ff5a8a', '#ffb23a', '#ff7a3a'][v % 3]; for (let i = 0; i < 4; i++) { circ(g, (r() - .5) * s * 1.2, -s * (1.5 + r() * .7), s * .06); } };
SPR.palm = (g, s, v, r) => { shadowE(g, s * .8, s * .22, .25, s * .2); const lean = s * (.18 + r() * .12) * (v % 2 ? -1 : 1), top = -s * 1.6;
  g.strokeStyle = '#6a4a2a'; g.lineWidth = s * .2; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(lean * .2, top * .5, lean, top); g.stroke();
  g.strokeStyle = '#8a6a3e'; g.lineWidth = s * .12; g.beginPath(); g.moveTo(-s * .03, 0); g.quadraticCurveTo(lean * .2 - s * .03, top * .5, lean - s * .03, top); g.stroke();
  g.strokeStyle = 'rgba(30,20,10,.5)'; g.lineWidth = 1.2; for (let i = 1; i < 9; i++) { const t = i / 9, x = lean * t * t, y = top * t; g.beginPath(); g.moveTo(x - s * .1, y); g.lineTo(x + s * .1, y + 1); g.stroke(); }
  const gp = v % 3 === 1 ? ['#2a6a2a', '#45a43a', '#82d055'] : ['#1f6a3a', '#35a050', '#74d078'];
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + .2, L = s * (.85 + r() * .25); g.save(); g.translate(lean, top); g.rotate(a); g.fillStyle = gp[i % 2]; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(L * .5, -s * .35, L, s * .28); g.quadraticCurveTo(L * .5, -s * .02, 0, 0); g.fill(); g.strokeStyle = gp[2]; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(L * .5, -s * .2, L * .95, s * .22); g.stroke(); g.restore(); }
  g.fillStyle = '#6a4220'; circ(g, lean - 3, top + 5, s * .08); circ(g, lean + 4, top + 6, s * .08); };
SPR.bigleaf = (g, s, v, r) => { const gp = gPal(v + 1, s); for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * .5, L = s * (.9 + r() * .4); g.save(); g.rotate(a + Math.PI / 2); g.fillStyle = gp[i % 2 ? 1 : 2]; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-s * .5, -L * .35, -s * .35, -L * .85, 0, -L); g.bezierCurveTo(s * .35, -L * .85, s * .5, -L * .35, 0, 0); g.fill(); g.strokeStyle = gp[0]; g.lineWidth = 1.3; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -L * .95); for (let k = 1; k < 5; k++) { g.moveTo(0, -L * k * .2); g.lineTo(-s * .22, -L * k * .2 - s * .1); g.moveTo(0, -L * k * .2); g.lineTo(s * .22, -L * k * .2 - s * .1); } g.stroke(); g.restore(); } };
SPR.bamboo = (g, s, v, r) => { shadowE(g, s * .6, s * .16); for (let i = 0; i < 4; i++) { const x = (i - 1.5) * s * .22, h = s * (1.5 + r() * .8), w = s * .07; g.fillStyle = grad(g, x - w, 0, x + w, 0, ['#4a8a2a', '#8cc84a', '#c4ec78']); g.fillRect(x - w, -h, w * 2, h); g.fillStyle = '#2a5a1a'; for (let k = 1; k < 7; k++) g.fillRect(x - w - 1, -h * k / 7, w * 2 + 2, 2); g.fillStyle = '#5aa83a'; for (let k = 0; k < 3; k++) { g.save(); g.translate(x, -h * (.55 + k * .15)); g.rotate((k % 2 ? 1 : -1) * 1.0); ell(g, s * .2, 0, s * .22, s * .045); g.restore(); } } };
SPR.bushflower = (g, s, v, r) => { SPR.bush(g, s, 2, r); const col = ['#ff4a6a', '#ff9a2a', '#fff05a'][v % 3]; for (let i = 0; i < 4; i++) { const x = (r() - .5) * s * .9, y = -s * (.4 + r() * .5); for (let k = 0; k < 5; k++) { g.fillStyle = col; const a = k * TAU / 5; ell(g, x + Math.cos(a) * s * .1, y + Math.sin(a) * s * .1, s * .1, s * .06, a); } g.fillStyle = '#ffe36a'; circ(g, x, y, s * .05); } };
SPR.willow = (g, s, v, r) => { shadowE(g, s * .9, s * .24); trunk(g, s * .9, s * .28, '#5a4a38', '#352a20', r, s * .05); const gp = ['#34553a', '#4a7a50', '#6ea46e', '#a8d8a0']; crown(g, 0, -s * 1.25, s * .72, gp, r, 8, .7);
  for (let i = 0; i < 26; i++) { const a = -Math.PI * .95 + i / 25 * Math.PI * .9, x0 = Math.cos(a) * s * .8, y0 = -s * 1.25 + Math.sin(a) * s * .5 * .0 + s * .15; g.strokeStyle = i % 3 ? gp[1] : gp[2]; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + (r() - .5) * 6, y0 + s * .5, x0 + (r() - .5) * 8, y0 + s * (.8 + r() * .6)); g.stroke(); } };
SPR.deadtree = (g, s, v, r, pal) => { shadowE(g, s * .6, s * .2); const col = pal === BIOMES.frost ? '#5a5a66' : pal === BIOMES.ash ? '#3a3238' : '#4a3a30', hi = shade(col, .25); g.strokeStyle = col; g.lineCap = 'round';
  const br = (x, y, a, L, w, d) => { g.lineWidth = w; g.strokeStyle = col; g.beginPath(); g.moveTo(x, y); const ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L; g.quadraticCurveTo((x + ex) / 2 + (r() - .5) * L * .3, (y + ey) / 2, ex, ey); g.stroke(); g.lineWidth = w * .35; g.strokeStyle = hi; g.beginPath(); g.moveTo(x - w * .2, y); g.lineTo(ex - w * .2, ey); g.stroke(); if (d > 0) { br(ex, ey, a - .5 - r() * .4, L * .72, w * .66, d - 1); br(ex, ey, a + .5 + r() * .4, L * .68, w * .62, d - 1); } };
  br(0, 2, -Math.PI / 2 + (r() - .5) * .25, s * .75, s * .22, 3); g.fillStyle = col; g.beginPath(); g.moveTo(-s * .26, 2); g.quadraticCurveTo(0, -s * .1, s * .26, 2); g.fill(); };
SPR.giantmush = (g, s, v, r) => { shadowE(g, s * .8, s * .22); const cs = [['#6a3aa8', '#a06aeb', '#d8b0ff'], ['#2a7a8a', '#4ab8c8', '#a0ecf4'], ['#b83a5a', '#ee6a8a', '#ffb0c4']][v % 3]; const h = s * 1.1; g.fillStyle = grad(g, -s * .2, 0, s * .2, 0, ['#c8bea4', '#f0e8d0', '#fff8e8']); g.beginPath(); g.moveTo(-s * .24, 0); g.quadraticCurveTo(-s * .1, -h * .5, -s * .14, -h); g.lineTo(s * .14, -h); g.quadraticCurveTo(s * .1, -h * .5, s * .24, 0); g.fill();
  g.fillStyle = cs[0]; g.beginPath(); g.ellipse(0, -h, s * .78, s * .5, 0, Math.PI, 0); g.quadraticCurveTo(0, -h + s * .22, -s * .78, -h); g.fill(); g.fillStyle = cs[1]; g.beginPath(); g.ellipse(0, -h, s * .72, s * .45, 0, Math.PI * 1.02, Math.PI * 1.98); g.quadraticCurveTo(0, -h - s * .1, -s * .72, -h); g.fill();
  g.fillStyle = cs[2]; ell(g, -s * .26, -h - s * .28, s * .22, s * .09, -.4); for (const [x, y, rr] of [[.3, .3, .1], [-.05, .38, .07], [.5, .12, .07], [-.45, .2, .06]]) { g.fillStyle = '#ffffffcc'; circ(g, s * x, -h - s * y, s * rr); } glowDot(g, 0, -h, s * 1.1, alpha(cs[1].length === 7 ? cs[1] : '#a06aeb', .16)); };
SPR.reeds = (g, s, v, r) => { for (let i = 0; i < 7; i++) { const x = (i - 3) * s * .13 + (r() - .5) * 3, h = s * (.9 + r() * .7); g.strokeStyle = i % 2 ? '#5a8a3a' : '#3f6a2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 0); g.quadraticCurveTo(x + (r() - .5) * 6, -h * .6, x + (r() - .5) * 8, -h); g.stroke(); if (i % 3 === 0) { g.fillStyle = '#6a3e1e'; g.beginPath(); g.roundRect(x - 2.2, -h - 6, 4.4, 12, 2); g.fill(); } } };
SPR.skullpile = (g, s, v, r) => { shadowE(g, s * .9, s * .2); for (let i = 0; i < 5; i++) { const x = (i - 2) * s * .38 + (r() - .5) * 4, y = -(i % 2) * s * .35 - 1, rr = s * (.3 + r() * .1); g.fillStyle = '#ddd6bd'; circ(g, x, y - rr * .6, rr); g.fillStyle = '#b8b098'; ell(g, x, y - rr * .1, rr * .6, rr * .4); g.fillStyle = '#1a1612'; circ(g, x - rr * .35, y - rr * .6, rr * .22); circ(g, x + rr * .35, y - rr * .6, rr * .22); g.fillRect(x - 1, y - rr * .2, 2, rr * .3); } };

/* ===== src/04b-sprites-biomes.js ===== */
/* ---------- deserto / cânion ---------- */
SPR.cactus = (g, s, v, r) => { shadowE(g, s * .7, s * .2); const cg = [['#2a6a3a', '#3f9a50', '#7ad088'], ['#3a7a3a', '#58b050', '#9ae080']][v % 2];
  const arm = (x, y0, y1, dir) => { g.strokeStyle = cg[0]; g.lineWidth = s * .26; g.beginPath(); g.moveTo(x, y0); g.lineTo(x + dir * s * .38, y0); g.lineTo(x + dir * s * .38, y1); g.stroke(); g.strokeStyle = cg[1]; g.lineWidth = s * .2; g.beginPath(); g.moveTo(x, y0); g.lineTo(x + dir * s * .38, y0); g.lineTo(x + dir * s * .38, y1); g.stroke(); };
  g.fillStyle = grad(g, -s * .24, 0, s * .24, 0, [cg[0], cg[1], cg[2], cg[1]]); g.beginPath(); g.roundRect(-s * .24, -s * 1.5, s * .48, s * 1.5, s * .24); g.fill();
  arm(-s * .15, -s * .6, -s * 1.05, -1); if (v % 3 !== 1) arm(s * .15, -s * .85, -s * 1.3, 1);
  g.strokeStyle = 'rgba(10,40,20,.5)'; g.lineWidth = 1; for (const x of [-.1, 0, .1]) { g.beginPath(); g.moveTo(s * x, -s * 1.4); g.lineTo(s * x, -s * .05); g.stroke(); }
  g.fillStyle = '#f4f0c8'; for (let i = 0; i < 14; i++) circ(g, (r() - .5) * s * .4, -r() * s * 1.4, 1); if (v % 2) { g.fillStyle = '#ff6a9a'; circ(g, 0, -s * 1.52, s * .1); g.fillStyle = '#ffe28a'; circ(g, 0, -s * 1.52, s * .04); } };
SPR.dunerock = (g, s, v, r) => rockShape(g, s * .72, s * .55, '#b89464', r, false);
SPR.redrock = (g, s, v, r) => rockShape(g, s * .66, s * .72, '#a8523a', r, false);
SPR.deadbush = (g, s, v, r, pal) => { g.strokeStyle = pal === BIOMES.canyon ? '#6a4228' : '#7a6240'; g.lineWidth = 1.6; for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * .3 + (r() - .5) * .2, L = s * (.7 + r() * .5); g.beginPath(); g.moveTo(0, 0); const ex = Math.cos(a) * L, ey = Math.sin(a) * L; g.quadraticCurveTo(ex * .5, ey * .5 - 2, ex, ey); g.stroke(); g.beginPath(); g.moveTo(ex * .6, ey * .6); g.lineTo(ex * .6 + (r() - .5) * s * .4, ey * .6 - s * .2); g.stroke(); } };
SPR.bones = (g, s, v, r) => { shadowE(g, s * .9, s * .18, .2); g.fillStyle = '#e8e0c8'; g.strokeStyle = '#a89c80'; g.lineWidth = 1;
  g.beginPath(); g.ellipse(0, -s * .3, s * .7, s * .34, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); for (let i = -3; i <= 3; i++) { g.lineWidth = 2.4; g.strokeStyle = '#e8e0c8'; g.beginPath(); g.moveTo(i * s * .18, 0); g.quadraticCurveTo(i * s * .2, -s * .6, i * s * .12, -s * .66); g.stroke(); }
  g.fillStyle = '#e8e0c8'; circ(g, s * .8, -s * .15, s * .22); g.fillStyle = '#1a1612'; circ(g, s * .74, -s * .2, s * .06); circ(g, s * .88, -s * .2, s * .06); g.fillRect(s * .96, -s * .12, s * .22, s * .1); };
SPR.obelisk = (g, s, v, r) => { shadowE(g, s * .75, s * .22); poly(g, [[-s * .5, 0], [-s * .38, -s * 1.9], [0, -s * 2.3], [0, 0]], '#7a7a86', '#101018'); poly(g, [[0, 0], [0, -s * 2.3], [s * .38, -s * 1.9], [s * .5, 0]], '#4a4a58', '#101018'); poly(g, [[-s * .38, -s * 1.9], [0, -s * 2.3], [s * .38, -s * 1.9]], '#a8a8b6');
  g.fillStyle = '#5a5a68'; g.fillRect(-s * .62, -s * .12, s * 1.24, s * .12); g.fillRect(-s * .56, -s * .24, s * 1.12, s * .12);
  g.strokeStyle = '#7ad6ff'; g.lineWidth = 1.8; g.shadowColor = '#7ad6ff'; g.shadowBlur = 6; for (let i = 0; i < 4; i++) { const y = -s * (.5 + i * .4); g.beginPath(); g.moveTo(-s * .14, y); g.lineTo(0, y - s * .13); g.lineTo(s * .14, y); g.stroke(); } g.shadowBlur = 0; };
SPR.mesa = (g, s, v, r) => { shadowE(g, s * 1.1, s * .3); const w = s * 1.0, h = s * 1.2; poly(g, [[-w, 0], [-w * .88, -h], [-w * .55, -h * 1.05], [w * .5, -h * 1.05], [w * .9, -h], [w, 0]], '#b4623e', '#40180e');
  const bands = ['#c4744a', '#9a4a2e', '#d48a5a', '#a85a38']; for (let i = 0; i < 5; i++) { g.fillStyle = bands[i % 4]; const y0 = -h * (i / 5), y1 = -h * ((i + 1) / 5); g.beginPath(); g.moveTo(-w * (1 - i * .02), y0); g.lineTo(-w * (.9 - i * .02), y1); g.lineTo(w * (.9 - i * .02), y1); g.lineTo(w * (1 - i * .02), y0); g.closePath(); g.fill(); }
  poly(g, [[0, 0], [w, 0], [w * .9, -h], [w * .5, -h * 1.05], [w * .2, -h * 1.0]], 'rgba(30,10,6,.3)'); g.fillStyle = '#d8a470'; g.beginPath(); g.moveTo(-w * .88, -h); g.lineTo(-w * .55, -h * 1.05); g.lineTo(w * .5, -h * 1.05); g.lineTo(w * .9, -h); g.lineTo(0, -h * .94); g.fill(); g.strokeStyle = 'rgba(30,10,6,.4)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-w * .88, -h); g.lineTo(-w * .55, -h * 1.05); g.lineTo(w * .5, -h * 1.05); g.lineTo(w * .9, -h); g.stroke(); };
SPR.spire = (g, s, v, r, pal) => { shadowE(g, s * .6, s * .2); const c = pal === BIOMES.mountain ? '#7e8794' : '#a4583a', w = s * .42; poly(g, [[-w, 0], [-w * .8, -s * 1.1], [-w * .2, -s * 1.9], [w * .1, -s * 2.2], [w * .55, -s * 1.1], [w, 0]], c, 'rgba(10,10,14,.6)', 1.3); poly(g, [[0, 0], [w, 0], [w * .55, -s * 1.1], [w * .1, -s * 2.2], [w * .05, -s * 1.0]], shade(c, -.28)); poly(g, [[-w * .8, -s * 1.1], [-w * .2, -s * 1.9], [w * .1, -s * 2.2], [-w * .1, -s * 1.2]], shade(c, .22)); if (pal === BIOMES.mountain) poly(g, [[-w * .2, -s * 1.9], [w * .1, -s * 2.2], [w * .3, -s * 1.7], [0, -s * 1.8]], '#f4f8ff'); };
SPR.minecart = (g, s, v, r) => { shadowE(g, s * .8, s * .2); g.strokeStyle = '#4a3a2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(-s, 2); g.lineTo(s, 2); g.stroke(); poly(g, [[-s * .6, -s * .85], [s * .6, -s * .85], [s * .45, -s * .15], [-s * .45, -s * .15]], '#6a5a4a', '#1a1410', 1.4); g.fillStyle = '#d89a3a'; for (let i = 0; i < 6; i++) circ(g, (r() - .5) * s * .9, -s * .88 - r() * 4, s * .12); g.fillStyle = '#2a2420'; circ(g, -s * .32, -s * .06, s * .12); circ(g, s * .32, -s * .06, s * .12); g.fillStyle = '#8a7a6a'; g.fillRect(-s * .6, -s * .9, s * 1.2, 3); };
/* ---------- gelo / montanha ---------- */
SPR.snowpine = (g, s, v, r) => { shadowE(g, s * .55, s * .2); g.fillStyle = '#4a3a2a'; g.fillRect(-s * .08, -s * .3, s * .16, s * .35);
  for (let i = 0; i < 5; i++) { const y = -s * (.22 + i * .36), w = s * (.68 - i * .11), h = s * .54; poly(g, [[-w, y], [0, y - h], [w, y]], '#1f4a44'); poly(g, [[0, y - h], [w, y], [w * .1, y - h * .05]], '#2a6058'); poly(g, [[-w, y], [0, y - h], [w, y], [w * .6, y - h * .25], [w * .25, y - h * .05], [-w * .25, y - h * .3], [-w * .6, y - h * .12]], '#f0f6fc'); poly(g, [[w * .1, y - h * .05], [w * .6, y - h * .25], [w, y], [w * .3, y]], 'rgba(150,180,210,.55)'); } };
SPR.icecrystal = (g, s, v, r) => { shadowE(g, s * .8, s * .2); const cols = ['#8ad8ff', '#b4e8ff', '#6ab8f0']; crystalShape(g, -s * .38, 0, s * .9, s * .24, cols[0], -.25, false); crystalShape(g, s * .4, 0, s * .8, s * .22, cols[2], .3, false); crystalShape(g, 0, 2, s * 1.5, s * .32, cols[1], 0, true); };
SPR.snowrock = (g, s, v, r) => rockShape(g, s * .68, s * .55, '#7a8ca0', r, false, true);
SPR.frozentree = (g, s, v, r) => { shadowE(g, s * .6, s * .2); g.strokeStyle = '#6a7a8c'; g.lineWidth = s * .22; g.beginPath(); g.moveTo(0, 2); g.lineTo(0, -s * .8); g.stroke(); const br = (x, y, a, L, w, d) => { g.lineWidth = w; g.strokeStyle = '#7a8ca0'; g.beginPath(); g.moveTo(x, y); const ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L; g.lineTo(ex, ey); g.stroke(); g.strokeStyle = 'rgba(230,246,255,.85)'; g.lineWidth = w * .4; g.beginPath(); g.moveTo(x, y - w * .25); g.lineTo(ex, ey - w * .25); g.stroke(); if (d > 0) { br(ex, ey, a - .55, L * .7, w * .65, d - 1); br(ex, ey, a + .55, L * .7, w * .65, d - 1); } else { g.fillStyle = '#d8f0ff'; circ(g, ex, ey, 3); } };
  br(0, -s * .7, -Math.PI / 2, s * .75, s * .16, 3); g.fillStyle = 'rgba(190,230,255,.28)'; circ(g, 0, -s * 1.3, s * .9); };
SPR.snowbush = (g, s, v, r) => { shadowE(g, s * .7, s * .2); crown(g, 0, -s * .45, s * .6, ['#2a4a50', '#3a6a68', '#5a9a90', '#9acfc4'], r, 6, .7); g.fillStyle = 'rgba(248,252,255,.95)'; for (let i = 0; i < 4; i++) ell(g, (r() - .5) * s * .8, -s * (.7 + r() * .2), s * .26, s * .1); };
SPR.snowman = (g, s, v, r) => { shadowE(g, s * .7, s * .2); g.fillStyle = grad(g, -s, 0, s, 0, ['#d0dcea', '#fbfdff', '#e4eef8']); circ(g, 0, -s * .38, s * .45); circ(g, 0, -s * .98, s * .33); circ(g, 0, -s * 1.46, s * .24); g.fillStyle = '#1a1a1e'; circ(g, -s * .08, -s * 1.5, 1.6); circ(g, s * .08, -s * 1.5, 1.6); circ(g, 0, -s * .9, 1.6); circ(g, 0, -s * .75, 1.6); g.fillStyle = '#ff8a2a'; poly(g, [[0, -s * 1.44], [s * .3, -s * 1.4], [0, -s * 1.38]], '#ff8a2a'); g.fillStyle = '#c8302a'; g.fillRect(-s * .26, -s * 1.28, s * .52, s * .08); g.fillRect(s * .12, -s * 1.28, s * .1, s * .3); g.fillStyle = '#2a2a30'; g.fillRect(-s * .18, -s * 1.7, s * .36, s * .1); g.fillRect(-s * .12, -s * 1.9, s * .24, s * .22); g.strokeStyle = '#5a3a1e'; g.lineWidth = 2; g.beginPath(); g.moveTo(-s * .3, -s * 1.0); g.lineTo(-s * .7, -s * 1.3); g.moveTo(s * .3, -s * 1.0); g.lineTo(s * .7, -s * 1.25); g.stroke(); };
SPR.boulder = (g, s, v, r) => { rockShape(g, s * .85, s * .85, '#6c7480', r, v % 2 === 0); rockShape(g, s * .38, s * .3, '#7a8290', r, false); };
/* ---------- vulcão / tempestade ---------- */
SPR.basalt = (g, s, v, r) => { shadowE(g, s * .8, s * .22); for (let i = 0; i < 5; i++) { const x = (i - 2) * s * .26, h = s * (.6 + r() * .9), w = s * .15; poly(g, [[x - w, 0], [x - w, -h], [x, -h - w * .6], [x + w, -h], [x + w, 0]], '#2c2830', '#08060a'); poly(g, [[x, -h - w * .6], [x + w, -h], [x, -h + w * .6], [x - w, -h]], '#4a4450'); poly(g, [[x, 0], [x + w, 0], [x + w, -h], [x, -h + w * .6]], 'rgba(0,0,0,.28)'); } g.strokeStyle = '#ff7a2a'; g.lineWidth = 1.5; g.shadowColor = '#ff7a2a'; g.shadowBlur = 5; g.beginPath(); g.moveTo(-s * .4, -2); g.lineTo(s * .3, -3); g.stroke(); g.shadowBlur = 0; };
SPR.charredtree = (g, s, v, r) => { SPR.deadtree(g, s, v, r, BIOMES.ash); g.fillStyle = '#ff7a2a'; for (let i = 0; i < 5; i++) circ(g, (r() - .5) * s * .5, -s * (.2 + r() * 1.0), 1.4); glowDot(g, 0, -s * .5, s * .6, 'rgba(255,100,30,.12)'); };
SPR.lavarock = (g, s, v, r) => { rockShape(g, s * .66, s * .55, '#3a3238', r, false); g.strokeStyle = '#ff8a2a'; g.lineWidth = 1.6; g.shadowColor = '#ff8a2a'; g.shadowBlur = 6; g.beginPath(); g.moveTo(-s * .35, -s * .2); g.lineTo(-s * .05, -s * .35); g.lineTo(s * .2, -s * .22); g.lineTo(s * .4, -s * .4); g.stroke(); g.shadowBlur = 0; };
SPR.vent = (g, s, v, r) => { g.fillStyle = 'rgba(8,6,6,.5)'; ell(g, 0, 2, s * .9, s * .3); poly(g, [[-s * .7, 2], [-s * .35, -s * .5], [s * .35, -s * .5], [s * .7, 2]], '#2a2428', '#08060a'); ell(g, 0, -s * .5, s * .35, s * .14); g.fillStyle = '#ffb040'; ell(g, 0, -s * .5, s * .26, s * .09); glowDot(g, 0, -s * .6, s * 1.1, 'rgba(255,120,30,.35)'); };
SPR.obsidian = (g, s, v, r) => { shadowE(g, s * .7, s * .2); for (const [x, h, w, a] of [[-s * .3, s * 1.0, s * .22, -.2], [s * .3, s * .8, s * .2, .25], [0, s * 1.5, s * .3, 0]]) crystalShape(g, x, 0, h, w, '#2a1a3a', a, false); g.strokeStyle = 'rgba(190,140,255,.7)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-s * .06, -s * 1.3); g.lineTo(-s * .12, -s * .4); g.stroke(); };
SPR.stormtree = (g, s, v, r) => { shadowE(g, s * .6, s * .2); const col = '#5a6a60'; g.strokeStyle = col; g.lineWidth = s * .2; g.beginPath(); g.moveTo(0, 2); g.quadraticCurveTo(s * .3, -s * .5, s * .5, -s * 1.1); g.stroke(); g.strokeStyle = '#8a9a90'; g.lineWidth = s * .06; g.beginPath(); g.moveTo(-s * .05, 2); g.quadraticCurveTo(s * .25, -s * .5, s * .45, -s * 1.1); g.stroke(); const gp = ['#3a5a58', '#4a8a80', '#7ac8b8', '#c8f4e8']; crown(g, s * .45, -s * 1.3, s * .5, gp, r, 7, .6);
  g.strokeStyle = '#ffee80'; g.lineWidth = 1.5; g.shadowColor = '#ffee80'; g.shadowBlur = 6; g.beginPath(); g.moveTo(s * .6, -s * 1.8); g.lineTo(s * .5, -s * 1.5); g.lineTo(s * .62, -s * 1.5); g.lineTo(s * .5, -s * 1.15); g.stroke(); g.shadowBlur = 0; };
SPR.rod = (g, s, v, r) => { shadowE(g, s * .6, s * .2); g.fillStyle = '#4a5058'; poly(g, [[-s * .25, 0], [-s * .1, -s * 1.2], [s * .1, -s * 1.2], [s * .25, 0]], '#5a626c', '#0a0c10'); g.fillStyle = '#c8d0d8'; g.fillRect(-s * .18, -s * .5, s * .36, 3); g.fillRect(-s * .14, -s * .9, s * .28, 3); g.strokeStyle = '#a8b0b8'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -s * 1.2); g.lineTo(0, -s * 1.9); g.stroke(); g.fillStyle = '#ffef7a'; glowDot(g, 0, -s * 1.95, s * .5, 'rgba(255,240,120,.7)'); circ(g, 0, -s * 1.95, s * .1); g.strokeStyle = 'rgba(255,240,140,.85)'; g.lineWidth = 1.2; for (let i = 0; i < 3; i++) { const a = r() * TAU; g.beginPath(); g.moveTo(0, -s * 1.95); g.lineTo(Math.cos(a) * s * .3, -s * 1.95 + Math.sin(a) * s * .3); g.lineTo(Math.cos(a + .4) * s * .5, -s * 1.95 + Math.sin(a + .4) * s * .5); g.stroke(); } };
SPR.pylon = (g, s, v, r) => { shadowE(g, s * .8, s * .24); poly(g, [[-s * .5, 0], [-s * .3, -s * .3], [s * .3, -s * .3], [s * .5, 0]], '#4a5058', '#0a0c10'); poly(g, [[-s * .22, -s * .3], [-s * .14, -s * 1.5], [s * .14, -s * 1.5], [s * .22, -s * .3]], '#6a727c', '#0a0c10'); poly(g, [[s * .02, -s * .3], [s * .22, -s * .3], [s * .14, -s * 1.5], [s * .02, -s * 1.5]], 'rgba(0,0,0,.28)'); g.strokeStyle = '#7ae6ff'; g.lineWidth = 2; g.shadowColor = '#7ae6ff'; g.shadowBlur = 6; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(0, -s * (.55 + i * .3), s * .13, 0, TAU); g.stroke(); } g.shadowBlur = 0; glowDot(g, 0, -s * 1.6, s * .6, 'rgba(120,230,255,.6)'); g.fillStyle = '#e8fcff'; circ(g, 0, -s * 1.6, s * .12); };
/* ---------- cristal / arcano ---------- */
SPR.crystalcluster = (g, s, v, r) => { shadowE(g, s * .8, s * .2); const sets = [['#ff6ad8', '#ffa0f0', '#c040a8'], ['#6ad8ff', '#a0f0ff', '#40a8c8'], ['#b86aff', '#d8a0ff', '#8040c8'], ['#6affc0', '#a0ffe0', '#40c890']][v % 4]; glowDot(g, 0, -s * .4, s * 1.1, alpha(sets[0], .18));
  const L = [[-.55, .75, .2, -.35], [.55, .65, .18, .4], [-.25, 1.1, .24, -.12], [.25, 1.3, .26, .1], [0, 1.7, .32, 0]]; for (const [x, h, w, a] of L) crystalShape(g, s * x, 2 - (Math.abs(x) < .3 ? 0 : 0), s * h, s * w, sets[(Math.abs(x * 10) | 0) % 3], a, false); };
SPR.crystaltree = (g, s, v, r) => { shadowE(g, s * .7, s * .22); const sets = ['#ff8ae8', '#8ae8ff', '#c08aff'], c = sets[v % 3]; g.strokeStyle = '#6a5a8a'; g.lineWidth = s * .2; g.beginPath(); g.moveTo(0, 2); g.quadraticCurveTo(-s * .1, -s * .6, 0, -s * 1.0); g.stroke(); g.strokeStyle = '#9a8aba'; g.lineWidth = s * .06; g.beginPath(); g.moveTo(-s * .04, 2); g.quadraticCurveTo(-s * .14, -s * .6, -s * .04, -s * 1.0); g.stroke();
  glowDot(g, 0, -s * 1.5, s * 1.1, alpha(c, .22)); for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * .5, d = s * (.45 + r() * .3); crystalShape(g, Math.cos(a) * d * .8, -s * 1.1 + Math.sin(a) * d * .7, s * (.5 + r() * .35), s * .13, c, a + Math.PI / 2, false); } };
SPR.glowshroom = (g, s, v, r) => { const cs = ['#60ffd0', '#ff7ae0', '#80b0ff'][v % 3]; glowDot(g, 0, -s * .5, s * 1.4, alpha(cs, .28)); for (let i = 0; i < 3; i++) { const x = (i - 1) * s * .45, h = s * (.5 + r() * .5), rr = s * (.28 + r() * .12); g.fillStyle = '#d8e8e4'; g.fillRect(x - rr * .2, -h, rr * .4, h); g.fillStyle = cs; g.beginPath(); g.ellipse(x, -h, rr, rr * .7, 0, Math.PI, 0); g.fill(); g.fillStyle = '#ffffffaa'; ell(g, x - rr * .3, -h - rr * .35, rr * .3, rr * .12); g.fillStyle = shade(cs, -.3); circ(g, x + rr * .4, -h - rr * .25, rr * .1); } };
SPR.monolith = (g, s, v, r) => { shadowE(g, s * .8, s * .24); poly(g, [[-s * .5, 0], [-s * .42, -s * 1.9], [s * .35, -s * 2.0], [s * .5, 0]], '#4a3a6a', '#0a0612', 1.4); poly(g, [[0, 0], [s * .5, 0], [s * .35, -s * 2.0], [0, -s * 1.95]], 'rgba(0,0,0,.3)'); poly(g, [[-s * .42, -s * 1.9], [s * .35, -s * 2.0], [s * .3, -s * 1.8], [-s * .36, -s * 1.7]], '#8a7ab8');
  g.strokeStyle = '#d8b0ff'; g.lineWidth = 1.6; g.shadowColor = '#c890ff'; g.shadowBlur = 8; g.beginPath(); g.arc(0, -s * 1.2, s * .2, 0, TAU); g.moveTo(-s * .14, -s * .8); g.lineTo(0, -s * .55); g.lineTo(s * .14, -s * .8); g.moveTo(-s * .18, -s * 1.7); g.lineTo(s * .18, -s * 1.7); g.stroke(); g.shadowBlur = 0; glowDot(g, 0, -s * 1.2, s * .9, 'rgba(200,150,255,.2)'); };
SPR.floatrock = (g, s, v, r) => { g.fillStyle = 'rgba(8,6,16,.22)'; ell(g, 0, 0, s * .55, s * .16); const y = -s * 1.1 + 0; poly(g, [[-s * .6, y], [-s * .35, y - s * .38], [s * .35, y - s * .4], [s * .6, y], [s * .2, y + s * .55], [-s * .2, y + s * .4]], '#6a5a8a', '#0a0612'); poly(g, [[0, y + s * .55], [s * .2, y + s * .55], [s * .6, y], [s * .1, y - s * .05]], 'rgba(0,0,0,.3)'); poly(g, [[-s * .6, y], [-s * .35, y - s * .38], [s * .35, y - s * .4], [0, y - s * .05]], '#9a8ac0'); glowDot(g, 0, y + s * .6, s * .5, 'rgba(180,140,255,.3)'); g.fillStyle = '#c8a8ff'; circ(g, 0, y + s * .7, 2); };
SPR.arctree = (g, s, v, r) => { shadowE(g, s * .7, s * .22); trunk(g, s * 1.1, s * .2, '#5a4a7a', '#2e2444', r); const gp = [['#3a2a6a', '#5a4aa0', '#8a7ad0', '#c8b8ff'], ['#2a3a7a', '#4a62b0', '#7a98e0', '#b8d0ff']][v % 2]; crown(g, 0, -s * 1.5, s * .7, gp, r, 9); g.fillStyle = '#fff'; for (let i = 0; i < 9; i++) circ(g, (r() - .5) * s * 1.4, -s * (1.0 + r() * 1.0), 1.1); glowDot(g, 0, -s * 1.5, s * .9, alpha(gp[2], .18)); };
SPR.runestone = (g, s, v, r) => { rockShape(g, s * .6, s * .8, '#5a5070', r, false); g.strokeStyle = '#e0c0ff'; g.lineWidth = 1.5; g.shadowColor = '#c890ff'; g.shadowBlur = 5; g.beginPath(); g.moveTo(-s * .15, -s * .55); g.lineTo(s * .0, -s * .75); g.lineTo(s * .15, -s * .55); g.moveTo(0, -s * .75); g.lineTo(0, -s * .3); g.moveTo(-s * .12, -s * .4); g.lineTo(s * .12, -s * .4); g.stroke(); g.shadowBlur = 0; };
SPR.starflower = (g, s, v, r) => { g.strokeStyle = '#4a6ab0'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(2, -s * .5, 0, -s); g.stroke(); const c = ['#ffe6ff', '#c8e6ff', '#fff2b0'][v % 3]; glowDot(g, 0, -s, s * .9, alpha('#c8a0ff', .4)); for (let k = 0; k < 6; k++) { const a = k * TAU / 6; g.fillStyle = c; ell(g, Math.cos(a) * s * .24, -s + Math.sin(a) * s * .24, s * .2, s * .07, a); } g.fillStyle = '#ffffff'; circ(g, 0, -s, s * .1); };
/* ---------- cinzas / cemitério ---------- */
SPR.gravestone = (g, s, v, r) => { shadowE(g, s * .7, s * .18); const w = s * .5, h = s * 1.1; if (v % 3 === 0) { poly(g, [[-w * .4, 0], [-w * .4, -h * .65], [-w * 1.1, -h * .65], [-w * 1.1, -h * .85], [-w * .4, -h * .85], [-w * .4, -h * 1.15], [w * .4, -h * 1.15], [w * .4, -h * .85], [w * 1.1, -h * .85], [w * 1.1, -h * .65], [w * .4, -h * .65], [w * .4, 0]], '#78788a', '#0e0e14', 1.3); poly(g, [[0, 0], [w * .4, 0], [w * .4, -h * 1.15], [0, -h * 1.15]], 'rgba(0,0,0,.25)'); }
  else { g.fillStyle = grad(g, -w, 0, w, 0, ['#6a6a7a', '#8a8a9c', '#5a5a6a']); g.beginPath(); g.moveTo(-w, 0); g.lineTo(-w, -h * .7); g.quadraticCurveTo(-w, -h, 0, -h); g.quadraticCurveTo(w, -h, w, -h * .7); g.lineTo(w, 0); g.closePath(); g.fill(); g.strokeStyle = '#0e0e14'; g.lineWidth = 1.2; g.stroke(); g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-w * .4, -h * .7); g.lineTo(w * .4, -h * .7); g.moveTo(0, -h * .85); g.lineTo(0, -h * .45); g.stroke(); }
  g.fillStyle = 'rgba(80,120,70,.7)'; ell(g, -w * .5, -2, w * .5, 3); g.fillStyle = '#4a4a56'; ell(g, 0, 2, w * 1.1, s * .1); };
SPR.bonepile = (g, s, v, r) => { shadowE(g, s * .8, s * .18); for (let i = 0; i < 6; i++) { const a = r() * Math.PI, x = (r() - .5) * s * .9, y = -r() * s * .25; g.strokeStyle = '#e4dcc4'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - Math.cos(a) * s * .35, y - Math.sin(a) * s * .1); g.lineTo(x + Math.cos(a) * s * .35, y + Math.sin(a) * s * .1); g.stroke(); g.fillStyle = '#e4dcc4'; circ(g, x + Math.cos(a) * s * .35, y + Math.sin(a) * s * .1, 2.4); } g.fillStyle = '#dcd4bc'; circ(g, 0, -s * .38, s * .26); g.fillStyle = '#a8a088'; ell(g, 0, -s * .22, s * .15, s * .1); g.fillStyle = '#12100e'; circ(g, -s * .09, -s * .4, s * .07); circ(g, s * .09, -s * .4, s * .07); };
SPR.torchpost = (g, s, v, r) => { shadowE(g, s * .4, s * .14); g.fillStyle = '#3a2a20'; g.fillRect(-s * .06, -s * 1.5, s * .12, s * 1.5); g.fillStyle = '#5a4a40'; g.fillRect(-s * .14, -s * 1.5, s * .28, s * .1); glowDot(g, 0, -s * 1.7, s * 1.6, 'rgba(255,150,50,.38)'); g.fillStyle = '#ff7a20'; g.beginPath(); g.moveTo(-s * .1, -s * 1.5); g.quadraticCurveTo(-s * .16, -s * 1.8, 0, -s * 2.1); g.quadraticCurveTo(s * .16, -s * 1.8, s * .1, -s * 1.5); g.fill(); g.fillStyle = '#ffd24a'; g.beginPath(); g.moveTo(-s * .05, -s * 1.52); g.quadraticCurveTo(-s * .08, -s * 1.75, 0, -s * 1.92); g.quadraticCurveTo(s * .08, -s * 1.75, s * .05, -s * 1.52); g.fill(); };
SPR.crypt = (g, s, v, r) => { shadowE(g, s * 1.1, s * .3); poly(g, [[-s * .9, 0], [-s * .9, -s * .9], [0, -s * 1.5], [s * .9, -s * .9], [s * .9, 0]], '#6a6a7c', '#0c0c14', 1.5); poly(g, [[0, 0], [s * .9, 0], [s * .9, -s * .9], [0, -s * 1.5]], 'rgba(0,0,0,.28)'); poly(g, [[-s * .4, 0], [-s * .4, -s * .6], [0, -s * .85], [s * .4, -s * .6], [s * .4, 0]], '#0a0810'); glowDot(g, 0, -s * .3, s * .5, 'rgba(160,100,255,.35)'); g.fillStyle = '#4a4a5a'; g.fillRect(-s * 1.0, -s * .1, s * 2.0, s * .1); g.strokeStyle = '#8a8a9c'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(-s * .9, -s * .9); g.lineTo(0, -s * 1.5); g.lineTo(s * .9, -s * .9); g.stroke(); g.fillStyle = '#c0c0d0'; g.fillRect(-1.5, -s * 1.85, 3, s * .35); g.fillRect(-s * .12, -s * 1.72, s * .24, 3); };
/* ---------- costa ---------- */
SPR.driftwood = (g, s, v, r) => { shadowE(g, s * .9, s * .16, .2); g.strokeStyle = '#a8947a'; g.lineWidth = s * .2; g.beginPath(); g.moveTo(-s * .9, -s * .1); g.quadraticCurveTo(-s * .2, -s * .35, s * .8, -s * .08); g.stroke(); g.strokeStyle = '#d4c4a8'; g.lineWidth = s * .07; g.beginPath(); g.moveTo(-s * .8, -s * .18); g.quadraticCurveTo(-s * .2, -s * .42, s * .7, -s * .16); g.stroke(); g.strokeStyle = '#a8947a'; g.lineWidth = s * .09; g.beginPath(); g.moveTo(-s * .1, -s * .28); g.lineTo(s * .05, -s * .6); g.stroke(); };
SPR.coastrock = (g, s, v, r) => rockShape(g, s * .7, s * .6, '#8a8678', r, false);
SPR.shell = (g, s, v, r) => { const c = ['#f4c8c0', '#f8e8c8', '#c8e0f4'][v % 3]; g.fillStyle = c; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-s * .8, -s * .2, -s * .6, -s * 1.0, 0, -s * .9); g.bezierCurveTo(s * .6, -s * 1.0, s * .8, -s * .2, 0, 0); g.fill(); g.strokeStyle = shade(c, -.25); g.lineWidth = 1; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(0, -1); g.lineTo(i * s * .26, -s * .8); g.stroke(); } };
SPR.umbrella = (g, s, v, r) => { shadowE(g, s * .9, s * .2); g.strokeStyle = '#6a4a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(s * .1, -s * 1.6); g.stroke(); const c = ['#e83a4a', '#3a8ae8'][v % 2]; for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? c : '#fff6e0'; g.beginPath(); g.moveTo(s * .1, -s * 1.7); g.lineTo(s * (-1.0 + i * .33), -s * 1.1); g.lineTo(s * (-1.0 + (i + 1) * .33), -s * 1.1); g.fill(); } g.fillStyle = '#f4d8a0'; ell(g, s * .5, -s * .1, s * .5, s * .12); };
/* ---------- abismo ---------- */
SPR.voidspire = (g, s, v, r) => { shadowE(g, s * .7, s * .22, .4); poly(g, [[-s * .5, 0], [-s * .3, -s * 1.3], [-s * .05, -s * 2.2], [s * .35, -s * 1.1], [s * .5, 0]], '#1a1226', '#080410', 1.3); poly(g, [[0, 0], [s * .5, 0], [s * .35, -s * 1.1], [-s * .05, -s * 2.2], [0, -s * 1.0]], 'rgba(0,0,0,.4)'); poly(g, [[-s * .3, -s * 1.3], [-s * .05, -s * 2.2], [-s * .08, -s * 1.1]], '#3a2a5a'); g.strokeStyle = '#ff3c8e'; g.lineWidth = 1.5; g.shadowColor = '#ff3c8e'; g.shadowBlur = 8; g.beginPath(); g.moveTo(-s * .12, -s * .2); g.lineTo(-s * .05, -s * .9); g.lineTo(-s * .12, -s * 1.6); g.stroke(); g.shadowBlur = 0; };
SPR.voidrock = (g, s, v, r) => { rockShape(g, s * .66, s * .55, '#2a2038', r, false); g.fillStyle = '#ff3c8e'; glowDot(g, s * .1, -s * .3, s * .3, 'rgba(255,60,142,.5)'); };
SPR.eyestalk = (g, s, v, r) => { shadowE(g, s * .5, s * .16, .4); g.strokeStyle = '#2a1a3a'; g.lineWidth = s * .2; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(s * .3, -s * .6, -s * .3, -s * 1.0, 0, -s * 1.5); g.stroke(); g.strokeStyle = '#4a2a6a'; g.lineWidth = s * .08; g.beginPath(); g.moveTo(-s * .03, 0); g.bezierCurveTo(s * .27, -s * .6, -s * .33, -s * 1.0, -s * .03, -s * 1.5); g.stroke(); g.fillStyle = '#f0e0f0'; circ(g, 0, -s * 1.6, s * .3); g.fillStyle = '#ff3c8e'; circ(g, 0, -s * 1.6, s * .17); g.fillStyle = '#10020a'; ell(g, 0, -s * 1.6, s * .05, s * .14); glowDot(g, 0, -s * 1.6, s * .8, 'rgba(255,60,142,.3)'); };
/* ---------- acampamento e itens ---------- */
SPR.tent = (g, s, v, r) => { shadowE(g, s * 1.1, s * .3); const c = v ? ['#8a2a2a', '#b84040', '#d86a6a'] : ['#6a5a3a', '#9a8456', '#c4ac74']; poly(g, [[-s * 1.0, 0], [0, -s * 1.3], [s * 1.0, 0]], c[1], 'rgba(10,6,4,.7)', 1.4); poly(g, [[0, -s * 1.3], [s * 1.0, 0], [s * .1, 0]], c[0]); poly(g, [[-s * .3, 0], [0, -s * .8], [s * .3, 0]], '#1c1410'); g.strokeStyle = c[2]; g.lineWidth = 1.4; g.beginPath(); g.moveTo(0, -s * 1.3); g.lineTo(-s * .3, 0); g.moveTo(0, -s * 1.3); g.lineTo(-s * .65, 0); g.stroke(); g.strokeStyle = '#3a2a1a'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -s * 1.3); g.lineTo(0, -s * 1.55); g.stroke(); g.fillStyle = v ? '#ffd23a' : '#f8f2e0'; poly(g, [[0, -s * 1.55], [s * .4, -s * 1.45], [0, -s * 1.38]], g.fillStyle); };
SPR.campfire = (g, s, v, r, pal, t = 0) => { g.fillStyle = 'rgba(8,8,10,.35)'; ell(g, 0, 3, s * 1.2, s * .4); g.fillStyle = '#5a5a58'; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; ell(g, Math.cos(a) * s * .9, Math.sin(a) * s * .4, s * .22, s * .14); } g.strokeStyle = '#4a2e16'; g.lineWidth = s * .2; g.beginPath(); g.moveTo(-s * .6, 0); g.lineTo(s * .5, -s * .3); g.moveTo(s * .6, 0); g.lineTo(-s * .5, -s * .3); g.stroke(); glowDot(g, 0, -s * .6, s * 2.6, 'rgba(255,150,50,.3)'); g.fillStyle = '#ff6a1a'; g.beginPath(); g.moveTo(-s * .45, -s * .15); g.quadraticCurveTo(-s * .6, -s * 1.1, 0, -s * 1.7); g.quadraticCurveTo(s * .6, -s * 1.1, s * .45, -s * .15); g.fill(); g.fillStyle = '#ffb02a'; g.beginPath(); g.moveTo(-s * .26, -s * .2); g.quadraticCurveTo(-s * .34, -s * .9, 0, -s * 1.3); g.quadraticCurveTo(s * .34, -s * .9, s * .26, -s * .2); g.fill(); g.fillStyle = '#fff2a0'; g.beginPath(); g.moveTo(-s * .1, -s * .22); g.quadraticCurveTo(-s * .12, -s * .6, 0, -s * .8); g.quadraticCurveTo(s * .12, -s * .6, s * .1, -s * .22); g.fill(); };
SPR.crate = (g, s, v, r) => { shadowE(g, s * .8, s * .22); const w = s * .7; g.fillStyle = '#9a6a38'; g.fillRect(-w, -w * 1.7, w * 2, w * 1.7); g.fillStyle = '#b88448'; g.fillRect(-w + 2, -w * 1.7 + 2, w * 2 - 4, w * 1.7 - 4); g.fillStyle = '#7a4e26'; g.fillRect(-w, -w * 1.7, w * 2, 4); g.fillRect(-w, -4, w * 2, 4); g.fillRect(-w, -w * 1.7, 4, w * 1.7); g.fillRect(w - 4, -w * 1.7, 4, w * 1.7); g.strokeStyle = '#6a4220'; g.lineWidth = 3; g.beginPath(); g.moveTo(-w + 2, -w * 1.7 + 3); g.lineTo(w - 2, -4); g.moveTo(w - 2, -w * 1.7 + 3); g.lineTo(-w + 2, -4); g.stroke(); g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 1; g.strokeRect(-w, -w * 1.7, w * 2, w * 1.7); };
SPR.barrel = (g, s, v, r) => { shadowE(g, s * .75, s * .22); const w = s * .62, h = s * 1.3; g.fillStyle = grad(g, -w, 0, w, 0, ['#5a3a1c', '#9a6a38', '#c4924e', '#8a5a2e']); g.beginPath(); g.moveTo(-w * .85, 0); g.quadraticCurveTo(-w * 1.25, -h * .5, -w * .85, -h); g.lineTo(w * .85, -h); g.quadraticCurveTo(w * 1.25, -h * .5, w * .85, 0); g.quadraticCurveTo(0, s * .18, -w * .85, 0); g.fill(); g.fillStyle = '#4a4a50'; for (const y of [-h * .2, -h * .8]) { g.fillRect(-w * 1.05, y - 2, w * 2.1, 4); } g.fillStyle = '#c4924e'; ell(g, 0, -h, w * .85, s * .2); g.fillStyle = '#9a6a38'; ell(g, 0, -h, w * .7, s * .15); g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 1; g.strokeRect(-w * .1, -h - 2, 0, 0); };
SPR.banner = (g, s, v, r) => { g.fillStyle = '#4a3622'; g.fillRect(-1.5, -s * 2.2, 3, s * 2.2); g.fillStyle = '#6a4e30'; g.fillRect(-s * .5, -s * 2.2, s, 3); poly(g, [[-s * .45, -s * 2.15], [s * .45, -s * 2.15], [s * .45, -s * 1.1], [0, -s * 1.3], [-s * .45, -s * 1.1]], '#a8222a', '#3a0a0c'); g.fillStyle = '#e8c040'; g.beginPath(); g.arc(0, -s * 1.8, s * .17, 0, TAU); g.fill(); g.fillStyle = '#a8222a'; g.beginPath(); g.arc(s * .05, -s * 1.8, s * .13, 0, TAU); g.fill(); };
SPR.chest = (g, s, v, r, pal, open = false) => { shadowE(g, s * .95, s * .25); const w = s * .9, h = s * .55, c = v ? ['#4a3a6a', '#6a5a9a', '#c8b040'] : ['#7a4a22', '#a8683a', '#e8c04a'];
  g.fillStyle = c[0]; g.beginPath(); g.roundRect(-w, -h, w * 2, h, 3); g.fill(); g.fillStyle = c[1]; g.beginPath(); g.roundRect(-w + 2, -h + 2, w * 2 - 4, h - 4, 2); g.fill();
  g.fillStyle = c[0]; g.beginPath(); g.moveTo(-w, -h); g.quadraticCurveTo(-w, -h * 1.75, 0, -h * 1.75); g.quadraticCurveTo(w, -h * 1.75, w, -h); g.closePath(); g.fill(); g.fillStyle = c[1]; g.beginPath(); g.moveTo(-w + 2, -h); g.quadraticCurveTo(-w + 2, -h * 1.68, 0, -h * 1.68); g.quadraticCurveTo(w - 2, -h * 1.68, w - 2, -h); g.closePath(); g.fill();
  g.fillStyle = c[2]; g.fillRect(-w, -h * .55, w * 2, 3); g.fillRect(-w * .55, -h * 1.7, 4, h * 1.7); g.fillRect(w * .55 - 4, -h * 1.7, 4, h * 1.7); g.fillRect(-4, -h * .85, 8, 10); g.fillStyle = '#1a1208'; g.fillRect(-1.5, -h * .72, 3, 5); g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 1; g.strokeRect(-w, -h, w * 2, h); };
SPR.pillar = (g, s, v, r) => { shadowE(g, s * .6, s * .2); const w = s * .3, h = s * 1.8, broken = v % 2; g.fillStyle = '#7a7a76'; g.fillRect(-w * 1.3, -s * .18, w * 2.6, s * .18); g.fillStyle = grad(g, -w, 0, w, 0, ['#8a8a84', '#c0beb0', '#a4a298']); g.beginPath(); g.moveTo(-w, -s * .18); g.lineTo(-w * .9, broken ? -h * .6 : -h); g.lineTo(w * .9, broken ? -h * .45 : -h); g.lineTo(w, -s * .18); g.fill(); g.strokeStyle = 'rgba(40,40,36,.4)'; g.lineWidth = 1; for (const x of [-.4, 0, .4]) { g.beginPath(); g.moveTo(w * x, -s * .2); g.lineTo(w * x * .9, broken ? -h * .5 : -h + 2); g.stroke(); } if (!broken) { g.fillStyle = '#9a9a92'; g.fillRect(-w * 1.3, -h - s * .14, w * 2.6, s * .14); } else { g.fillStyle = '#a4a298'; g.beginPath(); g.moveTo(-w * .9, -h * .6); g.lineTo(-w * .3, -h * .7); g.lineTo(w * .2, -h * .5); g.lineTo(w * .9, -h * .45); g.lineTo(-w * .9, -h * .58); g.fill(); g.fillStyle = 'rgba(70,120,60,.7)'; ell(g, -w * .4, -h * .1, w * .6, 4); } };
SPR.altar = (g, s, v, r) => { shadowE(g, s * 1.1, s * .3); poly(g, [[-s * .9, 0], [-s * .75, -s * .35], [s * .75, -s * .35], [s * .9, 0]], '#6a6a72', '#10101a'); poly(g, [[-s * .65, -s * .35], [-s * .55, -s * .8], [s * .55, -s * .8], [s * .65, -s * .35]], '#8a8a96', '#10101a'); ell(g, 0, -s * .8, s * .6, s * .16); g.fillStyle = '#a8a8b6'; ell(g, 0, -s * .8, s * .52, s * .12); g.strokeStyle = '#7ad6ff'; g.lineWidth = 1.4; g.shadowColor = '#7ad6ff'; g.shadowBlur = 6; g.beginPath(); g.ellipse(0, -s * .8, s * .34, s * .08, 0, 0, TAU); g.stroke(); g.shadowBlur = 0; glowDot(g, 0, -s * 1.1, s * .8, 'rgba(120,214,255,.3)'); };
SPR.node = (g, s, v, r, pal, mat = 'herb') => { const M = MATERIALS[mat] || MATERIALS.herb; shadowE(g, s * .8, s * .2, .22);
  if (mat === 'herb') { for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * .45; g.strokeStyle = '#3f8a46'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(Math.cos(a) * s * .4, Math.sin(a) * s * .5, Math.cos(a) * s * .8, Math.sin(a) * s * 1.0); g.stroke(); g.fillStyle = i % 2 ? '#8fe28b' : '#c8ffb0'; ell(g, Math.cos(a) * s * .85, Math.sin(a) * s * 1.05, s * .2, s * .09, a); } glowDot(g, 0, -s * .6, s * .9, 'rgba(160,255,150,.3)'); g.fillStyle = '#fff6a0'; circ(g, 0, -s * .55, s * .1); }
  else if (mat === 'ore') { rockShape(g, s * .55, s * .5, '#5a5a62', r, false); g.fillStyle = '#e8a050'; for (const [x, y] of [[-.2, -.35], [.15, -.5], [.25, -.2]]) { poly(g, [[s * x - 3, -s * -y * 0 + y * s], [s * x, y * s - 5], [s * x + 3, y * s]], '#e8a050'); } glowDot(g, 0, -s * .4, s * .7, 'rgba(255,170,80,.28)'); }
  else if (mat === 'bone') { SPR.bonepile(g, s * .8, v, r); }
  else if (mat === 'pearl') { g.fillStyle = '#efe0c8'; g.beginPath(); g.ellipse(0, -s * .2, s * .6, s * .3, 0, 0, TAU); g.fill(); g.fillStyle = '#c8b898'; g.beginPath(); g.ellipse(0, -s * .1, s * .6, s * .2, 0, 0, Math.PI); g.fill(); g.fillStyle = '#fff'; circ(g, 0, -s * .35, s * .22); glowDot(g, 0, -s * .35, s * .7, 'rgba(160,240,255,.4)'); }
  else { crystalShape(g, -s * .2, 0, s * .8, s * .2, M.col, -.2, false); crystalShape(g, s * .22, 0, s * .6, s * .18, M.col, .25, false); glowDot(g, 0, -s * .4, s * .9, alpha(M.col, .3)); } };

/* ===== src/04c-sprites-poi.js ===== */
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

/* ===== src/05a-humanoid-body.js ===== */
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

/* ===== src/05b-humanoid-head.js ===== */
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

/* ===== src/05c-humanoid-face.js ===== */
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
    const mz = r === 'minotauro' ? [4.4, 3.8, 3.6] : r === 'draconato' ? [3.2, 2.6, 2.8] : [0, 0, 0]; if (mz[0]) { g.fillStyle = fur ? shade(st.skin, .2) : st.skinHi; g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = .9; g.beginPath(); g.ellipse(side ? cx + rx * .62 : 0, hy + 4.2, side ? mz[0] * 1.15 : mz[0] + 1.4, mz[1], 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#1a0a0a'; if (side) { g.beginPath(); g.ellipse(cx + rx * .62 + mz[0] * .8, hy + 3.4, .8, 1, 0, 0, TAU); g.fill(); } else { g.beginPath(); g.ellipse(-1.4, hy + 3.6, .8, 1.1, 0, 0, TAU); g.ellipse(1.4, hy + 3.6, .8, 1.1, 0, 0, TAU); g.fill(); } if (r === 'minotauro') { g.strokeStyle = '#e8c860'; g.lineWidth = 1.2; g.beginPath(); g.arc(side ? cx + rx * .62 + 3.6 : 0, hy + 6.2, 2.4, .1, Math.PI - .1); g.stroke(); } }
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

/* ===== src/05d-humanoid-main.js ===== */
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
  const wk = (WEAPONS[st.weapon] || WEAPONS.espada).kind, restAng = HAND_REST[wk] != null ? HAND_REST[wk] : -1.1;
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

