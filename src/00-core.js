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
