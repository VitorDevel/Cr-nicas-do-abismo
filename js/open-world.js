(() => {
  'use strict';

  /* ============================================================
     Crônicas do Abismo — Terras Livres
     Mundo aberto com combate, inimigos, missões, dia/noite e save.
     ============================================================ */

  const $ = s => document.querySelector(s);
  const canvas = $('#world');
  const ctx = canvas.getContext('2d');
  const mini = $('#minimap');
  const miniCtx = mini.getContext('2d');

  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const angDiff = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  const pad2 = n => String(n).padStart(2, '0');

  const world = { width: 4200, height: 2800 };
  const SHRINE = { x: 1630, y: 862 };
  const SPAWN = { x: 1300, y: 1070 };
  const DUMMY_HOME = { x: 1475, y: 1000 };
  const BOSS_HOME = { x: 2150, y: 560 };
  const SAFE_RADIUS = 200;
  const START_MIN = 624; // 10:24
  const MIN_PER_SEC = 1.35;

  const SAVE_KEY = 'abismo-open-world-save';
  const controlModeKey = 'abismo-open-world-controls';
  const mutedKey = 'abismo-open-world-muted';

  /* ---------- elementos ---------- */
  const el = {
    explorer: $('#explorer'),
    level: $('#level'), statusLevel: $('#statusLevel'), coins: $('#coins'), clock: $('#clock'),
    healthFill: $('#healthFill'), manaFill: $('#manaFill'), staminaFill: $('#staminaFill'), xpFill: $('#xpFill'),
    healthText: $('#healthText'), manaText: $('#manaText'), staminaText: $('#staminaText'), xpText: $('#xpText'), potionText: $('#potionText'),
    potionBadge: $('#potionBadge'),
    enemyLabel: $('#enemyLabel'), enemyName: $('#enemyName'), enemyHealth: $('#enemyHealth'),
    distance: $('#distance'), objective: $('#objectiveText'), kills: $('#kills'),
    toast: $('#toast'), banner: $('#banner'), worldMessage: $('#worldMessage'), hint: $('.controls-hint'),
    keyboardMode: $('#keyboardMode'), touchMode: $('#touchMode'), soundToggle: $('#soundToggle'),
    skillButton: $('#skillButton'), ultimateButton: $('#ultimateButton'), dodgeButton: $('#dodgeButton'), blockButton: $('#blockButton'), healButton: $('#healButton'), attackButton: $('#attackButton'),
    levelPanel: $('#levelPanel'), levelPanelTitle: $('#levelPanelTitle'), levelChoices: $('#levelChoices'), wave: $('#wave'), locationName: $('#locationName')
  };
  const cache = new Map();
  function setText(key, node, value) {
    const v = String(value);
    if (cache.get(key) !== v) { cache.set(key, v); node.textContent = v; }
  }
  function setWidth(key, node, pct) {
    const v = `${clamp(pct, 0, 100).toFixed(1)}%`;
    if (cache.get(key) !== v) { cache.set(key, v); node.style.width = v; }
  }

  /* ---------- estado ---------- */
  const keys = new Set();
  const joystick = { x: 0, y: 0, active: false, pointer: null };
  const camera = { x: 0, y: 0, width: 0, height: 0, scale: 1, shake: 0 };
  const heroImage = new Image();
  heroImage.src = 'assets/character creation bg.jpg';

  const player = {
    x: SPAWN.x, y: SPAWN.y, angle: -Math.PI / 2, kx: 0, ky: 0,
    hp: 100, focus: 65, stamina: 100, level: 15, xp: 0, coins: 500, potions: 3, kills: 0,
    healthRanks: 0, staminaRanks: 0, manaRanks: 0, ultimateCd: 0, ultimateTime: 0,
    attackCd: 0, combo: 0, comboTimer: 0, dashT: 0, dashCd: 0, dashX: 0, dashY: -1, skillCd: 0,
    invuln: 0, flash: 0, hurt: 0, walk: 0, stepDist: 0, aimLock: 0,
    swing: null, spin: null, blocking: false, dead: false, deadT: 0, motion: 0, facing: -Math.PI / 2,
    burn: 0, poison: 0, chill: 0, shock: 0, curse: 0, effectTick: 0, relics: {}, buff: 0
  };
  const rankOf = () => Math.max(1, player.level - 14);
  const maxHpOf = () => Math.round((100 + player.healthRanks * 24) * hpMul());
  const maxFocusOf = () => Math.round((65 + player.manaRanks * 20) * foMul());
  const maxStaminaOf = () => 100 + player.staminaRanks * 25;
  const damageOf = () => Math.round((24 + (player.relics?.fury || 0) * 5) * dmMul() * (player.ultimateTime > 0 && cust.ultimate === 'tempestade' ? 1.5 : 1) * (player.buff > 0 ? 1.18 : 1));
  const xpNeed = level => 60 + (level - 14) * 35;

  const enemies = [];
  const loot = [];
  const particles = [];
  const floaters = [];
  const delayed = [];
  const drawList = [];
  const pendingLevelChoices = [];

  let autoAttack = false;
  let gameTime = 0;
  let visualTime = 0;
  let dialogueActive = false;
  let lastFrame = performance.now();
  let toastTimer = 0;
  let bannerTimer = 0;
  let hitstop = 0;
  let paused = false;
  let attackHeld = false;
  let spawnTimer = 1;
  let wave = 1, waveTimer = 0, finalBossActive = false, mimicBossTimer = rand(105, 185);
  let saveTimer = 4;
  let targetEnemy = null;
  let muted = false;
  try { muted = localStorage.getItem(mutedKey) === '1'; } catch (e) { /* sem storage */ }

  /* ---------- missões ---------- */
  const quests = [
    { text: 'Encontre o boneco de treino', goal: 1, reward: { xp: 40, coins: 25 }, title: 'Primeiros passos', msg: 'Siga a trilha. O abismo guarda mais do que ruínas.' },
    { text: 'Derrote criaturas do abismo', goal: 5, reward: { xp: 120, coins: 60, potions: 1 }, title: 'Caçada iniciada', msg: 'Criaturas vagam pelas terras. Fique atento aos sinais vermelhos no chão.' },
    { text: 'Descubra as ruínas do santuário', goal: 1, reward: { xp: 90, coins: 40 }, title: 'Rumo ao santuário', msg: 'Há um santuário antigo a leste. Ele restaura a vida dos viajantes.' },
    { text: 'Derrote o Guardião do Abismo', goal: 1, reward: { xp: 400, coins: 250, potions: 2 }, title: 'O Guardião desperta', msg: 'Algo enorme desperta ao leste... prepare-se e leve poções.' },
    { text: 'Limpe as Catacumbas Esquecidas', goal: 1, dun: 'cat', reward: { xp: 300, coins: 150, potions: 1 }, title: 'Os mortos inquietos', msg: 'Uma entrada de pedra a noroeste exala frio. Entre nas Catacumbas.' },
    { text: 'Limpe a Cisterna Esmeralda', goal: 1, dun: 'cis', reward: { xp: 420, coins: 200, potions: 1 }, title: 'Águas envenenadas', msg: 'Ao sul, uma cisterna antiga pulsa em verde.' },
    { text: 'Limpe o Templo Astral', goal: 1, dun: 'ast', reward: { xp: 600, coins: 280, potions: 2 }, title: 'Fenda nas estrelas', msg: 'Ao norte, o céu sangra luz azul sobre um templo.' },
    { text: 'Limpe a Forja do Abismo', goal: 1, dun: 'forja', reward: { xp: 900, coins: 400, potions: 2 }, title: 'O coração em chamas', msg: 'A sudeste, a forja final aguarda. Leve todas as poções.' },
    { text: 'Explore o Observatório Glacial', goal: 1, dun: 'gelo', reward: { xp: 1100, coins: 500, potions: 2 }, title: 'Sob o céu congelado', msg: 'Uma torre antiga desaparece na neve, muito ao nordeste.' },
    { text: 'Desperte o Colosso das Dunas', goal: 1, dun: 'dunas', reward: { xp: 1400, coins: 650, potions: 2 }, title: 'Areia e cinzas', msg: 'Siga a estrada para o extremo sudeste.' },
    { text: 'Purifique o Bosque Profundo', goal: 1, dun: 'bosque', reward: { xp: 1200, coins: 580, potions: 2 }, title: 'Raízes do abismo', msg: 'O bosque antigo esconde uma presença corrompida ao sul.' },
    { text: 'Terras livres: explore e cace', goal: 0, reward: null, title: 'Lenda das Terras Livres', msg: 'As terras são suas. A noite traz mais criaturas.' }
  ];
  const quest = { stage: 0, progress: 0 };

  /* ---------- salvar / carregar ---------- */
  function saveGame() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        level: player.level, xp: Math.floor(player.xp), coins: player.coins, potions: player.potions, kills: player.kills,
        healthRanks: player.healthRanks, staminaRanks: player.staminaRanks, manaRanks: player.manaRanks, stamina: player.stamina,
        wave, waveTimer, pendingLevelChoices, relics: player.relics,
        companions: companions.map(n => ({ role: n.role, seed: n.seed, x: Math.round(n.x), y: Math.round(n.y) })),
        stage: quest.stage, progress: quest.progress, x: Math.round(dun ? ow.x : player.x), y: Math.round(dun ? ow.y : player.y), time: clockMinutes()
      }));
    } catch (e) { /* sem storage */ }
  }
  function loadSave() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      if (!s || typeof s !== 'object') return;
      const num = (v, d) => (Number.isFinite(v) ? v : d);
      player.level = clamp(Math.floor(num(s.level, 15)), 15, 99);
      player.xp = Math.max(0, num(s.xp, 0));
      player.healthRanks = clamp(Math.floor(num(s.healthRanks, Math.floor((player.level - 15) / 2))), 0, 99);
      player.staminaRanks = clamp(Math.floor(num(s.staminaRanks, 0)), 0, 99);
      player.manaRanks = clamp(Math.floor(num(s.manaRanks, Math.floor((player.level - 15) / 5))), 0, 99);
       player.stamina = clamp(num(s.stamina, maxStaminaOf()), 0, maxStaminaOf());
       if (s.relics && typeof s.relics === 'object') for (const [id, value] of Object.entries(s.relics)) if (['fury','haste','arcana','vampire','cryo','storm','venom','magnet','ward','boneVolley','crystalShards','firebrand'].includes(id)) player.relics[id] = clamp(Math.floor(num(value, 0)), 0, 15);
      wave = clamp(Math.floor(num(s.wave, 1)), 1, 999999);
      waveTimer = Math.max(0, num(s.waveTimer, 0));
       if (Array.isArray(s.pendingLevelChoices)) pendingLevelChoices.push(...s.pendingLevelChoices.filter(c => c && Number.isFinite(c.rank) && typeof c.statChosen === 'boolean'));
       if (Array.isArray(s.companions)) for (const saved of s.companions) {
         const n = homeNpcs.find(candidate => candidate.role === saved.role && candidate.seed === saved.seed)
           || [...worldChunks.values()].flatMap(chunk => chunk.npcs).find(candidate => candidate.role === saved.role && candidate.seed === saved.seed)
           || (Number.isFinite(saved.x) && Number.isFinite(saved.y) && NPC_ROLES[saved.role] ? { role: saved.role, seed: saved.seed, x: saved.x, y: saved.y } : null);
         if (n && companions.length < 3) { n.hired = true; n.companion = true; companions.push(n); }
       }
      player.coins = Math.max(0, Math.floor(num(s.coins, 500)));
      player.potions = clamp(Math.floor(num(s.potions, 3)), 0, 9);
      player.kills = Math.max(0, Math.floor(num(s.kills, 0)));
      quest.stage = clamp(Math.floor(num(s.stage, 0)), 0, quests.length - 1);
      quest.progress = Math.max(0, Math.floor(num(s.progress, 0)));
      player.x = num(s.x, SPAWN.x);
      player.y = num(s.y, SPAWN.y);
      gameTime = (num(s.time, START_MIN) - START_MIN) / MIN_PER_SEC;
    } catch (e) { /* save corrompido: ignora */ }
  }

  /* ---------- geração do mundo ---------- */
  let seed = 191;
  function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }
  function riverX(y) { return 1140 + Math.sin(y / 255) * 112 + Math.sin(y / 104) * 25; }
  function onBridge(x, y) { return (Math.abs(y - 925) < 46 || Math.abs(y - 1470) < 46) && Math.abs(riverX(y) - x) < 135; }
  function inRiver(x, y) { return Math.abs(riverX(y) - x) < 118 && !onBridge(x, y); }

  const roadSegs = [
    [{ x: 180, y: 1440 }, { x: 570, y: 1280 }, { x: 560, y: 990 }, { x: 910, y: 914 }],
    [{ x: 910, y: 914 }, { x: 1240, y: 840 }, { x: 1505, y: 1100 }, { x: 1880, y: 855 }],
    [{ x: 1880, y: 855 }, { x: 2110, y: 705 }, { x: 2145, y: 490 }, { x: 2440, y: 390 }],
    [{ x: 2440, y: 390 }, { x: 2780, y: 330 }, { x: 3070, y: 560 }, { x: 3490, y: 610 }],
    [{ x: 1880, y: 855 }, { x: 2200, y: 1120 }, { x: 2690, y: 1440 }, { x: 3210, y: 1710 }],
    [{ x: 3210, y: 1710 }, { x: 3450, y: 1830 }, { x: 3570, y: 1950 }, { x: 3700, y: 2110 }],
    [{ x: 910, y: 914 }, { x: 610, y: 1460 }, { x: 620, y: 2050 }, { x: 1040, y: 2470 }],
    [{ x: 1040, y: 2470 }, { x: 1510, y: 2650 }, { x: 1900, y: 2510 }, { x: 2280, y: 2440 }]
  ];
  const roadPts = [];
  for (const [a, b, c, d] of roadSegs) {
    for (let i = 0; i <= 40; i++) {
      const t = i / 40, u = 1 - t;
      roadPts.push({
        x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
        y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y
      });
    }
  }
  function roadDist(x, y) {
    let m = 1e12;
    for (const p of roadPts) { const d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < m) m = d; }
    return Math.sqrt(m);
  }

  const trees = [], bushes = [], stones = [], flowers = [], tufts = [], pillars = [], solids = [];
  const keepClear = [
    [SPAWN.x, SPAWN.y, 130], [DUMMY_HOME.x, DUMMY_HOME.y, 90],
    [SHRINE.x, SHRINE.y + 30, 260], [BOSS_HOME.x, BOSS_HOME.y, 230],
    [420, 640, 120], [780, 1580, 120], [1500, 330, 120], [2060, 1500, 120],
    [760, 1190, 170], [1900, 1280, 140], [500, 820, 100], [2350, 1050, 100], [1650, 1495, 110],
    [3490, 610, 150], [3700, 2110, 170], [1040, 2470, 150]
  ];
  function clearSpot(x, y, padding) {
    if (Math.abs(riverX(y) - x) < 132 + padding) return false;
    if (roadDist(x, y) < 64 + padding) return false;
    for (const [cx, cy, cr] of keepClear) if (Math.hypot(x - cx, y - cy) < cr + padding) return false;
    return true;
  }
  (function generate() {
    let attempts = 0;
    while (trees.length + bushes.length < 675 && attempts++ < 12000) {
      const x = random() * world.width, y = random() * world.height, radius = 9 + random() * 17;
      const isTree = random() > .23, shade = Math.floor(random() * 4);
      if (!clearSpot(x, y, radius)) continue;
      const item = { x, y, radius, shade, type: isTree ? 'tree' : 'bush', phase: random() * 6 };
      if (isTree) { trees.push(item); solids.push({ x, y: y + radius * .35, cr: radius * .38 }); } else bushes.push(item);
    }
    attempts = 0;
    while (stones.length < 240 && attempts++ < 5000) {
      const x = random() * world.width, y = random() * world.height, radius = 4 + random() * 11, shade = Math.floor(random() * 3);
      if (!clearSpot(x, y, 4)) continue;
      stones.push({ x, y, radius, shade });
      if (radius > 7) solids.push({ x, y, cr: radius * .85 });
    }
    for (let i = 0; i < 1050; i++) {
      const x = random() * world.width, y = random() * world.height, c = Math.floor(random() * 4);
      if (Math.abs(riverX(y) - x) < 130 || roadDist(x, y) < 50) continue;
      flowers.push({ x, y, c });
    }
    for (let i = 0; i < 1750; i++) {
      const x = random() * world.width, y = random() * world.height;
      if (Math.abs(riverX(y) - x) < 125) continue;
      tufts.push({ x, y, h: 3 + random() * 5, s: random() > .5 ? 1 : -1 });
    }
    for (let i = 0; i < 9; i++) {
      const a = i * TAU / 9 + .2;
      const x = SHRINE.x + Math.cos(a) * (225 + (i % 2) * 20), y = SHRINE.y + 45 + Math.sin(a) * 135;
      pillars.push({ x, y, h: 34 + random() * 30, broken: random() > .45 });
      solids.push({ x, y, cr: 13 });
    }
  })();

  /* ---------- detalhes do mapa ---------- */
  function mapDetail(g) {
    let s = 4242; const R = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    const E = (x, y, rx, ry, col, rot = 0) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fill(); };
    E(1950, 300, 560, 340, 'rgba(200,120,40,.15)'); E(700, 1560, 540, 300, 'rgba(30,80,90,.2)'); E(2150, 1550, 420, 260, 'rgba(70,40,60,.15)'); E(430, 280, 430, 260, 'rgba(210,235,250,.12)');
    E(3470, 620, 620, 430, 'rgba(150,205,235,.25)'); E(3620, 1980, 650, 480, 'rgba(205,126,55,.2)'); E(1110, 2450, 620, 410, 'rgba(45,115,90,.24)');
    E(3480, 620, 490, 300, 'rgba(236,246,245,.14)');
    const pond = (x, y, rx, ry) => {
      E(x, y, rx + 14, ry + 11, '#b7a574'); E(x, y, rx + 4, ry + 3, '#223c33'); E(x, y, rx, ry, '#2e7c88'); E(x - rx * .2, y - ry * .2, rx * .6, ry * .5, 'rgba(160,230,225,.25)');
      g.strokeStyle = 'rgba(220,255,250,.35)'; g.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(x + (R() - .5) * rx, y + (R() - .5) * ry, 8 + R() * 10, 3 + R() * 4, 0, 0, TAU); g.stroke(); }
      for (let i = 0; i < 5; i++) { const a = R() * TAU, d = R() * .7, px = x + Math.cos(a) * rx * d, py = y + Math.sin(a) * ry * d; E(px, py, 6, 4, '#4f8f4a'); E(px - 1, py - 1, 2, 1.5, '#f2a6c4'); }
      g.strokeStyle = '#4d7a3a'; g.lineWidth = 1.6;
      for (let i = 0; i < 14; i++) { const a = R() * TAU, px = x + Math.cos(a) * (rx + 8), py = y + Math.sin(a) * (ry + 6); g.beginPath(); g.moveTo(px, py); g.lineTo(px + 1, py - 10 - R() * 6); g.stroke(); }
    };
    pond(1900, 1280, 120, 70); pond(500, 820, 70, 45); pond(2350, 1050, 80, 50);
    // aldeia
    E(770, 1185, 175, 115, 'rgba(181,164,119,.55)'); E(770, 1185, 150, 95, 'rgba(160,142,100,.4)');
    const house = (x, y, w, h, rc) => {
      E(x + 8, y + h / 2 + 6, w * .62, h * .28, 'rgba(15,25,18,.4)');
      g.fillStyle = '#d9c9a0'; g.fillRect(x - w / 2, y - h / 2, w, h); g.fillStyle = '#b39b6c'; g.fillRect(x - w / 2, y + h / 2 - 8, w, 8);
      g.strokeStyle = '#6b4f33'; g.lineWidth = 3; g.strokeRect(x - w / 2, y - h / 2, w, h);
      g.fillStyle = rc; g.beginPath(); g.moveTo(x - w / 2 - 9, y - h / 2 + 5); g.lineTo(x, y - h / 2 - h * .75); g.lineTo(x + w / 2 + 9, y - h / 2 + 5); g.closePath(); g.fill();
      g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.moveTo(x, y - h / 2 - h * .75); g.lineTo(x + w / 2 + 9, y - h / 2 + 5); g.lineTo(x, y - h / 2 + 5); g.closePath(); g.fill();
      g.fillStyle = '#5a3d24'; g.fillRect(x - 6, y + h / 2 - 22, 12, 22); g.fillStyle = '#ffd77f'; g.fillRect(x + w / 2 - 17, y - 8, 10, 10); g.fillStyle = '#6b4f33'; g.fillRect(x - w / 2 + 6, y - h / 2 - h * .5, 7, 16);
      solids.push({ x, y: y + h / 2 - 12, cr: w * .55 });
    };
    house(690, 1120, 78, 62, '#a4533f'); house(830, 1105, 92, 70, '#5f7a4a'); house(850, 1250, 72, 58, '#7a5a8a');
    E(760, 1170, 17, 12, '#7f7e72'); E(760, 1170, 12, 8, '#1f3a44'); solids.push({ x: 760, y: 1170, cr: 15 });
    g.strokeStyle = '#7a5a36'; g.lineWidth = 3;
    for (let i = 0; i < 8; i++) { const x = 640 + i * 18; g.beginPath(); g.moveTo(x, 1215); g.lineTo(x, 1197); g.stroke(); } g.beginPath(); g.moveTo(640, 1203); g.lineTo(760, 1203); g.stroke();
    for (const [cx, cy] of [[705, 1190], [722, 1196], [820, 1175]]) { g.fillStyle = '#9a7040'; g.fillRect(cx - 7, cy - 6, 14, 12); g.fillStyle = '#6b4a28'; g.fillRect(cx - 7, cy - 1, 14, 2); }
    // fogueiras e acampamento
    for (const [x, y] of [[740, 1240], [1650, 1500]]) { E(x, y + 3, 17, 10, '#2a2622'); for (let i = 0; i < 8; i++) E(x + Math.cos(i * .8) * 15, y + Math.sin(i * .8) * 9 + 2, 4, 3, i % 2 ? '#8a877a' : '#6c6a60'); }
    for (const [x, y] of [[1610, 1462], [1696, 1470]]) { g.fillStyle = '#8a5a3a'; g.beginPath(); g.moveTo(x - 28, y + 20); g.lineTo(x, y - 28); g.lineTo(x + 28, y + 20); g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.moveTo(x, y - 28); g.lineTo(x + 28, y + 20); g.lineTo(x, y + 20); g.closePath(); g.fill(); g.fillStyle = '#2a1c14'; g.beginPath(); g.moveTo(x - 7, y + 20); g.lineTo(x, y - 6); g.lineTo(x + 7, y + 20); g.fill(); }
    for (const [x, y, r] of [[1620, 1520, 0], [1690, 1525, 2.6], [715, 1262, 1], [768, 1255, 2]]) { g.save(); g.translate(x, y); g.rotate(r); g.fillStyle = '#6b4f33'; g.fillRect(-14, -4, 28, 8); g.fillStyle = '#a07c52'; g.fillRect(-14, -4, 28, 2); g.restore(); }
    // lanternas na estrada
    for (let i = 6; i < roadPts.length - 2; i += 14) {
      const p = roadPts[i], q = roadPts[i + 1], a = Math.atan2(q.y - p.y, q.x - p.x) + Math.PI / 2 * (i % 28 ? 1 : -1), x = p.x + Math.cos(a) * 60, y = p.y + Math.sin(a) * 60;
      if (Math.abs(riverX(y) - x) < 150) continue;
      g.fillStyle = 'rgba(15,25,18,.35)'; g.fillRect(x - 2, y + 2, 10, 3); g.fillStyle = '#5a4630'; g.fillRect(x - 1.5, y - 16, 3, 18); E(x, y - 19, 5, 5, 'rgba(255,214,120,.35)'); E(x, y - 19, 2.6, 2.6, '#ffd77f');
    }
    // detalhes espalhados
    for (let i = 0; i < 400; i++) {
      const x = R() * world.width, y = R() * world.height; if (!clearSpot(x, y, 14)) continue; const k = R();
      if (k < .3) { g.save(); g.translate(x, y); g.rotate(R() * 3); g.fillStyle = 'rgba(20,30,20,.3)'; g.fillRect(-18, 2, 36, 7); g.fillStyle = '#6b4f33'; g.fillRect(-18, -4, 36, 9); g.fillStyle = '#a07c52'; g.beginPath(); g.ellipse(18, 0, 3, 4.5, 0, 0, TAU); g.fill(); g.fillStyle = '#4f7a3c'; g.fillRect(-10, -5, 12, 3); g.restore(); }
      else if (k < .58) { for (let j = 0; j < 4; j++) { const a = j * 1.6, mx = x + Math.cos(a) * 9, my = y + Math.sin(a) * 6; g.fillStyle = '#efe6d0'; g.fillRect(mx - 1, my, 2, 4); E(mx, my, 3.5, 2.6, j % 2 ? '#d84b4b' : '#e8b04a'); } }
      else if (k < .86) { for (let j = 0; j < 9; j++) { const fx = x + (R() - .5) * 26, fy = y + (R() - .5) * 16; g.strokeStyle = '#3f6c34'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx, fy - 9); g.stroke(); E(fx, fy - 10, 2.4, 2.4, ['#b69cff', '#f4e18c', '#f0f0f0', '#e98fb0'][j % 4]); } }
      else if (x > 1300 || y < 700) { E(x + 3, y + 10, 10, 3, 'rgba(20,28,20,.3)'); g.fillStyle = '#8d8c82'; g.beginPath(); g.moveTo(x - 7, y + 9); g.lineTo(x - 7, y - 6); g.arc(x, y - 6, 7, Math.PI, 0); g.lineTo(x + 7, y + 9); g.fill(); g.fillStyle = '#6a6a62'; g.fillRect(x - 1, y - 9, 2, 10); g.fillRect(x - 4, y - 6, 8, 2); }
    }
  }

  /* ---------- pré-renderização do cenário ---------- */
  const ground = document.createElement('canvas');
  // Pixel-atlas inspired landmark accents: compact props keep the overworld readable at gameplay scale.
  function addAtlasProps() {
    let seed = 7319; const R = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const props = [];
    for (let i = 0; i < 42; i++) { const x = 90 + R() * (world.width - 180), y = 90 + R() * (world.height - 180); if (clearSpot(x, y, 18)) props.push({ x, y, k: 'mushroom', c: i % 3 }); }
    for (let i = 0; i < 30; i++) { const x = 120 + R() * (world.width - 240), y = 120 + R() * (world.height - 240); if (clearSpot(x, y, 20)) props.push({ x, y, k: 'crystal', c: i % 4 }); }
    for (let i = 0; i < 24; i++) { const x = 100 + R() * (world.width - 200), y = 100 + R() * (world.height - 200); if (clearSpot(x, y, 22)) props.push({ x, y, k: i % 2 ? 'crate' : 'banner', c: i % 4 }); }
    const g = ground.getContext('2d'); g.setTransform(1.25, 0, 0, 1.25, 0, 0);
    for (const p of props) {
      g.save(); g.translate(p.x, p.y);
      g.fillStyle = 'rgba(14,22,16,.3)'; g.beginPath(); g.ellipse(0, 7, 15, 5, 0, 0, TAU); g.fill();
      if (p.k === 'mushroom') { const col = ['#d84b4b', '#e8b04a', '#b69cff'][p.c % 3]; g.strokeStyle = '#e7dfc0'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 7); g.lineTo(0, -2); g.stroke(); g.fillStyle = col; g.beginPath(); g.arc(0, -4, 6, Math.PI, 0); g.fill(); g.fillStyle = '#fff0c8'; for (const x of [-3, 0, 3]) g.fillRect(x - .8, -5, 1.6, 1.6); }
      else if (p.k === 'crystal') { const col = ['#7bd7e8', '#b69cff', '#9fe8b5', '#ffbd69'][p.c]; g.fillStyle = col; g.beginPath(); g.moveTo(-8, 7); g.lineTo(-4, -9); g.lineTo(0, -15); g.lineTo(4, -6); g.lineTo(8, 7); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.moveTo(-3, -8); g.lineTo(0, -13); g.lineTo(0, 4); g.lineTo(-3, 5); g.closePath(); g.fill(); }
      else if (p.k === 'crate') { g.fillStyle = '#8b633e'; g.fillRect(-9, -8, 18, 16); g.strokeStyle = '#4f3424'; g.lineWidth = 1.5; g.strokeRect(-9, -8, 18, 16); g.beginPath(); g.moveTo(-8, -7); g.lineTo(8, 7); g.moveTo(8, -7); g.lineTo(-8, 7); g.stroke(); }
      else { g.fillStyle = '#6a4935'; g.fillRect(-1, -15, 2, 22); g.fillStyle = ['#d85b54', '#5c9ed6', '#c9a13b', '#8f6cc4'][p.c]; g.beginPath(); g.moveTo(1, -14); g.lineTo(13, -11); g.lineTo(1, -5); g.closePath(); g.fill(); }
      g.restore();
    }
  }
  const GS = 1.25;
  ground.width = Math.round(world.width * GS);
  ground.height = Math.round(world.height * GS);
  const miniBase = document.createElement('canvas');
  miniBase.width = 272; miniBase.height = 272;

  function riverPath(g, padding, fill) {
    g.beginPath();
    for (let y = -60; y <= world.height + 60; y += 24) {
      const x = riverX(y) - padding;
      if (y === -60) g.moveTo(x, y); else g.lineTo(x, y);
    }
    for (let y = world.height + 60; y >= -60; y -= 24) g.lineTo(riverX(y) + padding, y);
    g.closePath();
    g.fillStyle = fill;
    g.fill();
  }
  function roadPath(g) {
    g.beginPath();
    g.moveTo(roadSegs[0][0].x, roadSegs[0][0].y);
    for (const s of roadSegs) g.bezierCurveTo(s[1].x, s[1].y, s[2].x, s[2].y, s[3].x, s[3].y);
  }
  function drawBridge(g, y) {
    const x = riverX(y);
    g.save();
    g.translate(x, y);
    g.fillStyle = 'rgba(15,25,20,.35)';
    g.fillRect(-124, -38, 256, 94);
    g.fillStyle = '#384034';
    g.fillRect(-127, -44, 254, 88);
    g.fillStyle = '#a58a5d';
    g.fillRect(-118, -37, 236, 74);
    for (let bx = -105; bx <= 105; bx += 30) {
      g.fillStyle = (bx / 30) % 2 ? '#b69a68' : '#967c54';
      g.fillRect(bx, -35, 5, 70);
    }
    g.fillStyle = '#5f543f';
    g.fillRect(-132, -48, 9, 96);
    g.fillRect(123, -48, 9, 96);
    g.restore();
  }
  const bushColors = ['#7a9b4d', '#9b9e51', '#788e47', '#b18f58'];
  const stoneColors = ['#86836c', '#716f60', '#a09b7d'];
  const flowerColors = ['#f4e18c', '#f0f0f0', '#e98fb0', '#9bc4f0'];

  function buildGround() {
    const g = ground.getContext('2d');
    g.setTransform(GS, 0, 0, GS, 0, 0);
    g.fillStyle = '#527a42';
    g.fillRect(0, 0, world.width, world.height);
    let textureSeed = 8231;
    const textureRandom = () => { textureSeed = textureSeed * 16807 % 2147483647; return (textureSeed - 1) / 2147483646; };
    const groundTones = ['rgba(190,209,122,.12)', 'rgba(24,54,37,.11)', 'rgba(218,196,128,.09)', 'rgba(70,113,67,.14)'];
    for (let i = 0; i < 18000; i++) {
      const x = textureRandom() * world.width, y = textureRandom() * world.height;
      const snow = x > 3100 && y < 1100, dunes = x > 3100 && y > 1400, deepwood = x < 1500 && y > 2100;
      g.globalAlpha = .45 + textureRandom() * .55;
      g.fillStyle = snow ? (i % 2 ? 'rgba(220,239,234,.14)' : 'rgba(46,91,111,.1)')
        : dunes ? (i % 2 ? 'rgba(243,201,130,.13)' : 'rgba(83,51,29,.1)')
          : deepwood ? (i % 2 ? 'rgba(113,173,111,.12)' : 'rgba(15,53,43,.14)')
            : groundTones[(textureRandom() * groundTones.length) | 0];
      g.beginPath();
      g.ellipse(x, y, 1 + textureRandom() * 4, .7 + textureRandom() * 2.2, textureRandom() * TAU, 0, TAU);
      g.fill();
    }
    g.fillStyle = '#668c4c';
    for (let x = 30; x < world.width; x += 185) {
      for (let y = 35; y < world.height; y += 166) {
        g.globalAlpha = .14;
        g.beginPath();
        g.ellipse(x + Math.sin(y) * 22, y + Math.cos(x) * 15, 78, 52, .2, 0, TAU);
        g.fill();
      }
    }
    g.fillStyle = '#42683a';
    for (let x = 90; x < world.width; x += 240) {
      for (let y = 80; y < world.height; y += 210) {
        g.globalAlpha = .12;
        g.beginPath();
        g.ellipse(x + Math.cos(y * 2) * 40, y + Math.sin(x * 2) * 30, 60, 38, -.3, 0, TAU);
        g.fill();
      }
    }
    g.globalAlpha = 1;
    // praça do santuário
    g.fillStyle = 'rgba(122,128,104,.5)';
    g.beginPath(); g.ellipse(SHRINE.x, SHRINE.y + 45, 262, 175, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(190,184,142,.35)'; g.lineWidth = 3;
    g.beginPath(); g.ellipse(SHRINE.x, SHRINE.y + 45, 244, 160, 0, 0, TAU); g.stroke();
    // arena do guardião
    g.fillStyle = 'rgba(52,34,66,.35)';
    g.beginPath(); g.ellipse(BOSS_HOME.x, BOSS_HOME.y, 200, 150, 0, 0, TAU); g.fill();
    // estrada
    g.lineCap = 'round'; g.lineJoin = 'round';
    roadPath(g); g.strokeStyle = '#465638'; g.lineWidth = 112; g.stroke();
    roadPath(g); g.strokeStyle = '#b5a477'; g.lineWidth = 88; g.stroke();
    roadPath(g); g.strokeStyle = 'rgba(150,132,92,.55)'; g.lineWidth = 8; g.setLineDash([60, 26]); g.stroke();
    roadPath(g); g.strokeStyle = '#c8b88b'; g.lineWidth = 3; g.setLineDash([5, 17]); g.stroke();
    g.setLineDash([]);
    // rio
    riverPath(g, 128, '#a99b6b');
    riverPath(g, 116, '#283f33');
    riverPath(g, 110, '#32818a');
    riverPath(g, 62, '#2b6f7c');
    g.globalAlpha = .2;
    for (let y = 35; y < world.height; y += 58) {
      g.strokeStyle = '#a6ece1'; g.lineWidth = 2;
      g.beginPath();
      g.moveTo(riverX(y) - 65, y);
      g.quadraticCurveTo(riverX(y), y - 12, riverX(y) + 66, y + 3);
      g.stroke();
    }
    g.globalAlpha = 1;
    drawBridge(g, 925);
    drawBridge(g, 1470);
    drawBridge(g, 2315);
    // detalhes
    for (const f of flowers) {
      g.fillStyle = flowerColors[f.c];
      g.beginPath(); g.arc(f.x, f.y, 1.8, 0, TAU); g.fill();
    }
    g.lineWidth = 1.4; g.strokeStyle = 'rgba(52,86,40,.8)';
    for (const t of tufts) {
      g.beginPath();
      g.moveTo(t.x, t.y); g.lineTo(t.x + t.s * 2, t.y - t.h);
      g.moveTo(t.x + 2, t.y); g.lineTo(t.x - t.s * 1.5, t.y - t.h * .8);
      g.stroke();
    }
    mapDetail(g);
    for (const b of bushes) {
      g.fillStyle = 'rgba(25,40,26,.35)';
      g.beginPath(); g.ellipse(b.x + 3, b.y + 5, b.radius * 1.25, b.radius * .6, .4, 0, TAU); g.fill();
      g.fillStyle = bushColors[b.shade];
      g.beginPath(); g.ellipse(b.x, b.y, b.radius * 1.25, b.radius * .72, .4, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,220,.15)';
      g.beginPath(); g.ellipse(b.x - 3, b.y - 3, b.radius * .6, b.radius * .3, .4, 0, TAU); g.fill();
      if (b.shade === 3) {
        g.fillStyle = '#d94f5b';
        for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(b.x + Math.cos(i * 1.7 + b.phase) * b.radius * .6, b.y + Math.sin(i * 2.3 + b.phase) * b.radius * .3, 1.8, 0, TAU); g.fill(); }
      }
    }
    for (const s of stones) {
      g.fillStyle = 'rgba(20,30,22,.3)';
      g.beginPath(); g.ellipse(s.x + 2, s.y + 4, s.radius * 1.25, s.radius * .7, .4, 0, TAU); g.fill();
      g.fillStyle = stoneColors[s.shade];
      g.beginPath(); g.ellipse(s.x, s.y, s.radius * 1.25, s.radius * .8, .4, 0, TAU); g.fill();
      g.fillStyle = 'rgba(234,224,184,.18)';
      g.fillRect(s.x - s.radius / 2, s.y - s.radius / 2, s.radius, 2);
    }
  }

  function buildMini() {
    const m = miniBase.getContext('2d');
    const w = miniBase.width, h = miniBase.height;
    const mx = x => x / world.width * w, my = y => y / world.height * h;
    m.fillStyle = '#5b7947'; m.fillRect(0, 0, w, h);
    m.fillStyle = 'rgba(52,34,66,.5)';
    m.beginPath(); m.ellipse(mx(BOSS_HOME.x), my(BOSS_HOME.y), mx(200), my(150), 0, 0, TAU); m.fill();
    m.strokeStyle = '#c5b886'; m.lineWidth = 7; m.lineCap = 'round'; m.lineJoin = 'round';
    m.beginPath();
    roadPts.forEach((p, i) => (i ? m.lineTo(mx(p.x), my(p.y)) : m.moveTo(mx(p.x), my(p.y))));
    m.stroke();
    m.beginPath();
    for (let y = 0; y <= h; y += 4) {
      const x = mx(riverX(y / h * world.height));
      if (!y) m.moveTo(x - 9, y); else m.lineTo(x - 9, y);
    }
    for (let y = h; y >= 0; y -= 4) m.lineTo(mx(riverX(y / h * world.height)) + 9, y);
    m.closePath(); m.fillStyle = '#39838a'; m.fill();
    m.fillStyle = '#d8c387';
    m.beginPath(); m.arc(mx(SHRINE.x), my(SHRINE.y), 6, 0, TAU); m.fill();
  }

  /* ---------- biomas vivos: terreno determinístico e vegetação característica ---------- */
  const CHUNK_SIZE = 720;
  const worldChunks = new Map();
  const chunkPalettes = {
    forest:  { name:'Floresta Esmeralda', icon:'🌳', ground:'#386842',light:'#68a65e',dark:'#214e3b',path:'#a89f78',element:'natureza',hint:'Bosques floridos, raízes e feras' },
    frost:   { name:'Tundra Glacial',icon:'❄',ground:'#b5d9d7',light:'#edf8ef',dark:'#7ca6b9',path:'#c3d4d2',element:'gelo',hint:'Geada, cristais e predadores congelados' },
    dunes:   { name:'Mar de Dunas',icon:'☀',ground:'#d8b777',light:'#f0d5a0',dark:'#ae814c',path:'#dfc18e',element:'fogo',hint:'Areia, cactos e escorpiões' },
    marsh:   { name:'Pântano Tóxico',icon:'☠',ground:'#426f5d',light:'#80a978',dark:'#234c48',path:'#86916a',element:'natureza',hint:'Musgos, cogumelos e águas venenosas' },
    ash:     { name:'Ermos da Sombra',icon:'☾',ground:'#525369',light:'#7b7894',dark:'#2c3049',path:'#777581',element:'arcano',hint:'Névoa, túmulos e espectros' },
    volcano: { name:'Vulcão Carmesim',icon:'🔥',ground:'#363337',light:'#625150',dark:'#211f2b',path:'#76645b',element:'fogo',hint:'Magma, basalto e demônios' },
    storm:   { name:'Planícies da Tempestade',icon:'⚡',ground:'#456f73',light:'#77a9a7',dark:'#264957',path:'#94a5a3',element:'raio',hint:'Campos elétricos e espíritos do trovão' },
    crystal: { name:'Jardins de Cristal',icon:'💎',ground:'#526f8f',light:'#8fb1c7',dark:'#344b78',path:'#839bbd',element:'arcano',hint:'Cristais luminosos e construtos' },
    arcane:  { name:'Terras Astrais',icon:'✦',ground:'#514877',light:'#9b82c5',dark:'#2c315b',path:'#807ba7',element:'arcano',hint:'Runas, portais e magia instável' }
  };
  const biomeAnchors = [
    ['forest',1.9,1.6],['marsh',1,2.55],['frost',4.85,.8],['dunes',5.1,3],['volcano',3,2.1],
    ['arcane',2.1,-.1],['ash',-.2,.75],['forest',1.1,3.7],
    ['ash',-3.2,1.2],['storm',3.9,-3.1],['crystal',-2.4,-2.2],
    ['volcano',7.7,-1.5],['frost',1.7,-4.2],['marsh',-1.7,5.9],
    ['forest',-5,4.2],['arcane',-6.5,-3.6],['dunes',9,2.8],['storm',9,-5]
  ];
  const hashCoord=(x,y,seed=13)=>{
    let n=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(seed,1442695041);
    n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;
  };
  function biomeForChunk(cx,cy){
    // Anchored regions around story entrances, then repeating domain-warped climate indefinitely.
    if(cx===2&&cy===2)return 'volcano';
    if(cx===1&&cy===3)return 'forest';
    if(Math.abs(cx)>12||Math.abs(cy)>10){
      const v=Math.sin(cx*.22+Math.cos(cy*.14)*1.6)+Math.cos(cy*.22-cx*.09);
      const n=hashCoord(Math.floor(cx/4),Math.floor(cy/4));
      return Object.keys(chunkPalettes)[Math.floor((v+2)*1.45+n*3)%9];
    }
    let winner='forest',score=Infinity;
    for(const [type,ax,ay] of biomeAnchors){
      const warpX=Math.sin(cx*.8+cy*.6)*.25,warpY=Math.cos(cy*.7-cx*.42)*.27;
      const d=Math.hypot((cx+warpX-ax)*.93,cy+warpY-ay)+hashCoord(Math.floor(ax*10),Math.floor(ay*10))*.03;
      if(d<score){score=d;winner=type;}
    }
    return winner;
  }
  function biomeAt(x,y){return biomeForChunk(Math.floor(x/CHUNK_SIZE),Math.floor(y/CHUNK_SIZE));}
  function worldRegionName(x,y){return dun?dun.def.name:chunkPalettes[biomeAt(x,y)].name;}
  function buildWorldChunk(cx,cy){
    let seed=(Math.imul(cx,374761393)^Math.imul(cy,668265263)^0x5f356495)>>>0;
    const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const biome=biomeForChunk(cx,cy), col=chunkPalettes[biome], tile=document.createElement('canvas');
    tile.width=CHUNK_SIZE;tile.height=CHUNK_SIZE;
    const g=tile.getContext('2d'),ox=cx*CHUNK_SIZE,oy=cy*CHUNK_SIZE, S=CHUNK_SIZE;
    g.fillStyle=col.ground;g.fillRect(0,0,S,S);
    const oval=(x,y,rx,ry,c,a=1)=>{g.globalAlpha=a;g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,0,0,TAU);g.fill();g.globalAlpha=1;};
    // Soft overlapping vegetation fields replace the old dry, dotted terrain.
    for(let i=0;i<165;i++){
      const x=next()*S,y=next()*S,r=23+next()*112;
      oval(x,y,r,r*(.3+next()*.43),next()>.5?col.light:col.dark,.035+next()*.105);
    }
    // Thick grass, frost, dunes, spores or sparks: biome-specific microtextures.
    for(let i=0;i<1900;i++){
      const x=next()*S,y=next()*S, v=next(), size=.7+next()*3.4;
      g.globalAlpha=.22+next()*.35;
      g.strokeStyle=v>.50?col.light:col.dark;
      g.lineWidth=.65+next()*.9;
      g.beginPath();g.moveTo(x,y);
      if(biome==='dunes') g.lineTo(x+3+next()*13,y-1-next()*2);
      else if(biome==='frost')g.lineTo(x+next()*2,y-2-size);
      else g.lineTo(x+(next()-.5)*3,y-3-size);
      g.stroke();
    }
    g.globalAlpha=1;
    // Clearings and natural ponds appear only in appropriate biomes.
    if(['forest','marsh','frost','storm'].includes(biome))for(let i=0;i<3;i++){
      const x=85+next()*550,y=85+next()*550,r=25+next()*46;
      if(biome==='marsh'||biome==='storm'){
        oval(x,y,r+6,r*.6+5,col.dark,.65);oval(x,y,r,r*.6,biome==='marsh'?'#27576a':'#4cabb8',.9);
        oval(x-7,y-6,r*.5,r*.19,'#8ac2bc',.28);
      }else oval(x,y,r,r*.5,biome==='frost'?'#effdf9':'#87a96a',.25);
    }
    // Distinct landmarks: frozen vents, volcanic fissures, lightning, rune stones and flowers.
    for(let i=0;i<110;i++){
      const x=next()*S,y=next()*S,rad=2+next()*6;
      if(biome==='forest'){oval(x,y,rad*1.6,rad*.65,'#28563b',.35);oval(x-2,y-2,rad*.45,rad*.5,['#e6cf85','#e8a2cc','#c9e8ff'][i%3]);}
      else if(biome==='frost'){g.strokeStyle=i%3?'#f4ffff':'#96cdda';g.lineWidth=1.5;g.beginPath();g.moveTo(x-rad,y);g.lineTo(x+rad,y);g.moveTo(x,y-rad);g.lineTo(x,y+rad);g.stroke();}
      else if(biome==='dunes'){g.strokeStyle='#ffdf9b';g.lineWidth=1+rad*.2;g.beginPath();g.arc(x,y,rad,0,Math.PI);g.stroke();}
      else if(biome==='marsh'){oval(x,y,rad*1.8,rad,'#203d43',.6);oval(x,y-3,rad*.9,rad*.6,i%4?'#a5c970':'#d5a5df',.85);}
      else if(biome==='volcano'){g.strokeStyle=i%3?'#a54d36':'#ff7c35';g.lineWidth=2;g.beginPath();g.moveTo(x-rad,y-rad);g.lineTo(x,y);g.lineTo(x+rad,y+rad*.7);g.stroke();}
      else if(biome==='storm'){g.strokeStyle='#c3ece2';g.globalAlpha=.35+next()*.4;g.lineWidth=1.6;g.beginPath();g.moveTo(x,y-rad);g.lineTo(x-3,y);g.lineTo(x+1,y);g.lineTo(x-3,y+rad);g.stroke();g.globalAlpha=1;}
      else if(biome==='crystal'||biome==='arcane'){g.fillStyle=i%2?'#aee8fa':'#bc9af5';g.globalAlpha=.25+next()*.45;g.beginPath();g.moveTo(x,y-rad*2);g.lineTo(x+rad,y);g.lineTo(x,y+rad);g.lineTo(x-rad,y);g.closePath();g.fill();g.globalAlpha=1;}
      else {oval(x,y,rad*2,rad,'#313044',.35);oval(x,y,rad*.45,rad*.45,'#b2a5de',.65);}
    }
    // Transition strips: adjacent biomes meet gradually instead of forming square walls.
    const edge=135;
    for(const [nx,ny,side] of [[cx-1,cy,'left'],[cx+1,cy,'right'],[cx,cy-1,'top'],[cx,cy+1,'bottom']]){
      const other=biomeForChunk(nx,ny);
      if(other===biome)continue;
      const c=chunkPalettes[other].ground+'88';
      let grad;
      if(side==='left'){grad=g.createLinearGradient(0,0,edge,0);grad.addColorStop(0,c);grad.addColorStop(1,'#00000000');g.fillStyle=grad;g.fillRect(0,0,edge,S);}
      if(side==='right'){grad=g.createLinearGradient(S,0,S-edge,0);grad.addColorStop(0,c);grad.addColorStop(1,'#00000000');g.fillStyle=grad;g.fillRect(S-edge,0,edge,S);}
      if(side==='top'){grad=g.createLinearGradient(0,0,0,edge);grad.addColorStop(0,c);grad.addColorStop(1,'#00000000');g.fillStyle=grad;g.fillRect(0,0,S,edge);}
      if(side==='bottom'){grad=g.createLinearGradient(0,S,0,S-edge);grad.addColorStop(0,c);grad.addColorStop(1,'#00000000');g.fillStyle=grad;g.fillRect(0,S-edge,S,edge);}
    }
    const trees=[],landmarks=[],npcs=[],features=[];
    const treeCount={forest:57,frost:30,dunes:13,marsh:38,ash:24,volcano:22,storm:32,crystal:35,arcane:27}[biome];
    for(let i=0;i<treeCount;i++){
      const x=ox+38+next()*(S-76),y=oy+38+next()*(S-76);
      if(Math.hypot(x-SPAWN.x,y-SPAWN.y)<660)continue;
      trees.push({x,y,radius:14+next()*18,shade:Math.floor(next()*4),phase:next()*TAU,biome});
    }
    for(let i=0;i<16;i++){
      const x=ox+48+next()*(S-96),y=oy+48+next()*(S-96);
      if(Math.hypot(x-SPAWN.x,y-SPAWN.y)<620)continue;
      features.push({x,y,size:9+next()*20,kind:biome,phase:next()*TAU});
    }
    if(next()>.28&&Math.hypot(ox+360-SPAWN.x,oy+360-SPAWN.y)>750){
      const x=ox+130+next()*460,y=oy+130+next()*450;
      const kind=next()>.35?'camp':'altar';
      landmarks.push({x,y,kind});features.push({x,y,size:38,kind:kind==='camp'?'camp':'altar',phase:next()*TAU});
      if(kind==='camp'){
        const roles=['healer','merchant','scout','blacksmith','bard','alchemist','ranger','sage','guardian','mage'];
        npcs.push({x:x+43,y:y+16,role:roles[Math.floor(next()*roles.length)],seed:next()*TAU,cx,cy});
      }
    }
    return {x:ox,y:oy,tile,trees,landmarks,npcs,features,biome};
  }
  function ensureWorldChunks(x,y){
    const cx=Math.floor(x/CHUNK_SIZE),cy=Math.floor(y/CHUNK_SIZE);
    for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
      const key=`${cx+dx},${cy+dy}`;
      if(!worldChunks.has(key))worldChunks.set(key,buildWorldChunk(cx+dx,cy+dy));
    }
    for(const key of worldChunks.keys()){
      const [tx,ty]=key.split(',').map(Number);
      if(Math.abs(tx-cx)>2||Math.abs(ty-cy)>2)worldChunks.delete(key);
    }
  }
  function drawWorldChunks(vx,vy,vw,vh){
    ensureWorldChunks(player.x,player.y);
    for(const chunk of worldChunks.values()){
      if(chunk.x>vx+vw||chunk.x+CHUNK_SIZE<vx||chunk.y>vy+vh||chunk.y+CHUNK_SIZE<vy)continue;
      ctx.drawImage(chunk.tile,chunk.x,chunk.y);
    }
  }
  function drawBiomeFeature(f){
    const {x,y,size:r,kind:k}=f,t=gameTime+f.phase;
    ctx.save();ctx.translate(x,y);
    ctx.fillStyle='#10192255';ctx.beginPath();ctx.ellipse(1,6,r*.7,r*.32,0,0,TAU);ctx.fill();
    if(k==='camp'){ctx.fillStyle='#906947';ctx.beginPath();ctx.moveTo(-r,12);ctx.lineTo(0,-r*.7);ctx.lineTo(r,12);ctx.closePath();ctx.fill();ctx.fillStyle='#493726';ctx.beginPath();ctx.moveTo(-9,12);ctx.lineTo(0,-7);ctx.lineTo(9,12);ctx.fill();}
    else if(k==='altar'){ctx.fillStyle='#5d6b77';ctx.fillRect(-r*.32,-r*.9,r*.64,r*1.2);ctx.fillStyle='#ace8ef';ctx.fillRect(-4,-r-5,8,13);}
    else if(k==='dunes'){ctx.fillStyle='#389268';ctx.fillRect(-4,-r,8,r+12);ctx.fillRect(-r*.4,-r*.5,5,r*.35);ctx.fillRect(r*.25,-r*.75,5,r*.38);ctx.fillStyle='#c7d79b';ctx.fillRect(-2,-r,2,r);}
    else if(k==='frost'){ctx.fillStyle='#dff5f8';ctx.beginPath();ctx.moveTo(0,-r*1.8);ctx.lineTo(r*.65,4);ctx.lineTo(-r*.6,5);ctx.fill();ctx.fillStyle='#8ac3da';ctx.beginPath();ctx.moveTo(0,-r*1.8);ctx.lineTo(r*.65,4);ctx.lineTo(0,-4);ctx.fill();}
    else if(k==='volcano'){ctx.fillStyle='#161b23';ctx.beginPath();ctx.moveTo(-r*.7,6);ctx.lineTo(-r*.2,-r*1.35);ctx.lineTo(r*.8,4);ctx.fill();ctx.fillStyle='#fb733d';ctx.beginPath();ctx.moveTo(-r*.25,0);ctx.lineTo(-r*.2,-r*.8);ctx.lineTo(r*.22,0);ctx.fill();}
    else if(k==='crystal'||k==='arcane'){for(let q=0;q<3;q++){const xx=(q-1)*r*.33;ctx.fillStyle=q%2?'#73e8ec':'#a996ff';ctx.beginPath();ctx.moveTo(xx,-r*(1+q*.24));ctx.lineTo(xx+r*.3,4);ctx.lineTo(xx-r*.3,4);ctx.fill();}ctx.globalAlpha=.35+.2*Math.sin(t*2);ctx.fillStyle='#bbf3ff';ctx.beginPath();ctx.arc(0,-r*.5,r*.55,0,TAU);ctx.fill();}
    else if(k==='storm'){ctx.strokeStyle='#bbe8ee';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-r*1.3);ctx.lineTo(-r*.3,-r*.3);ctx.lineTo(r*.1,-r*.3);ctx.lineTo(-r*.2,r*.6);ctx.stroke();ctx.fillStyle='#c0faff';ctx.beginPath();ctx.arc(0,-r,4+2*Math.sin(t*4),0,TAU);ctx.fill();}
    else if(k==='marsh'){ctx.fillStyle='#295d50';ctx.fillRect(-4,-r*.6,8,r);ctx.fillStyle='#ca6e8c';ctx.beginPath();ctx.ellipse(0,-r*.7,r*.8,r*.3,0,0,TAU);ctx.fill();ctx.fillStyle='#eec0ca';ctx.beginPath();ctx.arc(-r*.2,-r*.75,3,0,TAU);ctx.fill();}
    else if(k==='forest'){ctx.fillStyle='#4d8b45';for(let q=0;q<5;q++){const a=q*TAU/5;ctx.beginPath();ctx.ellipse(Math.cos(a)*r*.4,Math.sin(a)*r*.4,r*.5,r*.33,a,0,TAU);ctx.fill();}ctx.fillStyle='#ecc275';ctx.beginPath();ctx.arc(0,0,r*.16,0,TAU);ctx.fill();}
    else{ctx.fillStyle='#282837';ctx.fillRect(-r*.4,-r*.55,r*.8,r*.8);ctx.fillStyle='#bca8d9';ctx.beginPath();ctx.arc(0,-r*.45,r*.2,0,TAU);ctx.fill();}
    ctx.restore();
  }
  function drawBiomeTree(t){
    if(t.biome==='forest'||t.biome==='marsh'||t.biome==='storm'){
      if(t.biome==='forest')return drawTree(t);
      ctx.save();ctx.translate(t.x,t.y);ctx.fillStyle=t.biome==='marsh'?'#394935':'#3c5458';ctx.fillRect(-3,-8,6,22);
      for(let i=0;i<4;i++){ctx.fillStyle=t.biome==='marsh'?['#2b5246','#4c7954','#718d4e'][i%3]:['#457a7b','#70aaa2','#8fb9bb'][i%3];ctx.beginPath();ctx.arc((i%2?1:-1)*t.radius*.33,-t.radius*.45-i*3,t.radius*(.35+i*.06),0,TAU);ctx.fill();}ctx.restore();return;
    }
    ctx.save();ctx.translate(t.x,t.y);const r=t.radius;
    ctx.fillStyle='#0e182366';ctx.beginPath();ctx.ellipse(1,7,r*.6,r*.25,0,0,TAU);ctx.fill();
    if(t.biome==='frost'){ctx.fillStyle='#486b74';ctx.fillRect(-3,-r*.8,6,r);for(let i=2;i>=0;i--){ctx.fillStyle=['#a7d3d7','#dff7f4','#effffd'][i];ctx.beginPath();ctx.moveTo(0,-r*2+i*r*.42);ctx.lineTo(-r*(.85-i*.15),-r*.2+i*r*.38);ctx.lineTo(r*(.85-i*.15),-r*.2+i*r*.38);ctx.fill();}}
    else if(t.biome==='dunes'){ctx.fillStyle='#447f54';ctx.fillRect(-5,-r,10,r+8);ctx.fillRect(-r*.55,-r*.5,6,r*.4);ctx.fillRect(r*.28,-r*.82,6,r*.5);}
    else if(t.biome==='volcano'||t.biome==='ash'){ctx.fillStyle=t.biome==='volcano'?'#212129':'#383449';ctx.beginPath();ctx.moveTo(-r*.65,6);ctx.lineTo(-r*.18,-r*1.7);ctx.lineTo(r*.16,-r*.6);ctx.lineTo(r*.6,6);ctx.fill();ctx.strokeStyle=t.biome==='volcano'?'#fa7138':'#9d8dcb';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-r*.15,-r);ctx.lineTo(r*.08,-r*.5);ctx.stroke();}
    else {ctx.fillStyle='#33405e';ctx.fillRect(-4,-r,8,r+8);ctx.fillStyle=t.biome==='crystal'?'#9adbf3':'#b2a0e7';for(let i=0;i<5;i++){const a=i*TAU/5;ctx.beginPath();ctx.moveTo(0,-r*.8);ctx.lineTo(Math.cos(a)*r,-r*.9+Math.sin(a)*r);ctx.lineTo(Math.cos(a+.4)*r*.5,-r*.8+Math.sin(a+.4)*r*.5);ctx.fill();}}
    ctx.restore();
  }

  buildGround();
  addAtlasProps();
  buildMini();
  heroImage.addEventListener('load', () => { /* o santuário é desenhado em tempo real */ });

  /* ---------- redimensionar ---------- */
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    camera.width = rect.width;
    camera.height = rect.height;
    camera.scale = Math.max(.65, Math.min(1.15, Math.min(rect.width / 900, rect.height / 570)));
  }
  window.addEventListener('resize', resize);
  resize();
  mini.width = 272; mini.height = 272;

  /* ---------- modo de controle ---------- */
  function setControlMode(mode) {
    const selected = mode === 'keyboard' ? 'keyboard' : 'touch';
    el.explorer.dataset.controlMode = selected;
    el.keyboardMode.setAttribute('aria-pressed', String(selected === 'keyboard'));
    el.touchMode.setAttribute('aria-pressed', String(selected === 'touch'));
    el.hint.textContent = selected === 'keyboard'
      ? 'WASD mover · Espaço atacar · Q habilidade · R ultimate · Shift esquivar · H poção · E conversar · T autoataque · P pausa'
      : 'Use o direcional e os botões na tela';
    try { localStorage.setItem(controlModeKey, selected); } catch (e) { /* sem storage */ }
  }
  let savedMode;
  try { savedMode = localStorage.getItem(controlModeKey); } catch (e) { /* sem storage */ }
  setControlMode(savedMode === 'keyboard' || savedMode === 'touch' ? savedMode : (window.matchMedia('(pointer: coarse)').matches ? 'touch' : 'keyboard'));
  el.keyboardMode.addEventListener('click', () => setControlMode('keyboard'));
  el.touchMode.addEventListener('click', () => setControlMode('touch'));

  /* ---------- áudio ---------- */
  let audioCtx = null, noiseBuf = null, lastCoinSfx = 0;
  function ac() {
    if (!audioCtx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      audioCtx = new C();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  function tone(f0, f1, dur, type = 'sine', vol = .1, delay = 0) {
    const a = ac(); if (!a) return;
    const t = a.currentTime + delay;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(a.destination);
    o.start(t); o.stop(t + dur + .03);
  }
  function noise(dur, vol = .08, freq = 1800, delay = 0) {
    const a = ac(); if (!a) return;
    if (!noiseBuf) {
      noiseBuf = a.createBuffer(1, a.sampleRate, a.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = a.currentTime + delay;
    const s = a.createBufferSource(); s.buffer = noiseBuf;
    const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq;
    const g = a.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(a.destination);
    s.start(t); s.stop(t + dur + .02);
  }
  function sfx(name) {
    if (muted) return;
    try {
      switch (name) {
        case 'swing': noise(.12, .06, 2400); tone(420, 180, .1, 'triangle', .04); break;
        case 'hit': tone(190, 60, .12, 'square', .09); noise(.07, .07, 900); break;
        case 'crit': tone(300, 70, .18, 'sawtooth', .1); tone(900, 1300, .1, 'sine', .06, .02); noise(.1, .08, 1400); break;
        case 'hurt': tone(140, 45, .25, 'sawtooth', .13); break;
        case 'coin': tone(880, 880, .07, 'sine', .06); tone(1320, 1320, .12, 'sine', .06, .06); break;
        case 'potion': tone(400, 800, .25, 'sine', .09); tone(600, 1000, .25, 'sine', .06, .08); break;
        case 'dash': noise(.2, .07, 700); break;
        case 'skill': tone(220, 660, .3, 'sawtooth', .07); noise(.28, .08, 1200); break;
        case 'slam': tone(90, 30, .4, 'sine', .22); noise(.3, .12, 300); break;
        case 'level': [523, 659, 784, 1046].forEach((f, i) => tone(f, f, .22, 'triangle', .09, i * .1)); break;
        case 'quest': [392, 523, 659].forEach((f, i) => tone(f, f, .25, 'sine', .09, i * .12)); break;
        case 'death': tone(240, 40, .9, 'sawtooth', .12); break;
        default: break;
      }
    } catch (e) { /* áudio indisponível */ }
  }
  function refreshSoundButton() {
    el.soundToggle.classList.toggle('off', muted);
    el.soundToggle.setAttribute('aria-pressed', String(!muted));
    el.soundToggle.textContent = muted ? '♪̸' : '♪';
  }
  function toggleMute() {
    muted = !muted;
    try { localStorage.setItem(mutedKey, muted ? '1' : '0'); } catch (e) { /* sem storage */ }
    refreshSoundButton();
    showToast(muted ? 'Som desligado' : 'Som ligado');
  }
  el.soundToggle.addEventListener('click', toggleMute);
  refreshSoundButton();

  /* ---------- efeitos ---------- */
  function updateList(list, fn) {
    let j = 0;
    for (let i = 0; i < list.length; i++) { const o = list[i]; if (fn(o) !== false) list[j++] = o; }
    list.length = j;
  }
  function addParticle(p) { if (particles.length < 600) particles.push(p); }
  function burst(x, y, n, o = {}) {
    const L = o.life || .5;
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), s = rand(.35, 1) * (o.speed || 120), life = rand(.6, 1) * L;
      addParticle({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life,
        size: rand(.6, 1) * (o.size || 3),
        color: Array.isArray(o.color) ? o.color[(Math.random() * o.color.length) | 0] : (o.color || '#fff'),
        drag: o.drag ?? 3, glow: !!o.glow, shrink: o.shrink !== false
      });
    }
  }
  function ring(x, y, color, count = 28, speed = 260) {
    for (let i = 0; i < count; i++) {
      const a = i / count * TAU;
      addParticle({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed * .75, life: .45, max: .45, size: 3.2, color, drag: 5, glow: true, shrink: true });
    }
  }
  function floatText(x, y, text, color = '#fff', size = 16) {
    floaters.push({ x: x + rand(-8, 8), y, text: String(text), color, size, life: .95, max: .95, vy: -46 });
  }
  function shake(amount) { camera.shake = Math.max(camera.shake, amount); }
  function showToast(message) {
    el.toast.textContent = message;
    el.toast.classList.add('visible');
    toastTimer = 2.2;
  }
  function showBanner(title, sub = '') {
    el.banner.innerHTML = `<strong>${title}</strong><small>${sub}</small>`;
    el.banner.classList.add('visible');
    bannerTimer = 2.8;
  }

  /* ---------- tempo ---------- */
  function clockMinutes() { return (START_MIN + gameTime * MIN_PER_SEC) % 1440; }
  function sunValue() { return Math.sin((clockMinutes() - 360) / 1440 * TAU); }
  function daylight() { return clamp(sunValue() * 1.5 + .35, 0, 1); }

  /* ---------- colisão ---------- */
  function collide(e, r) {
    const nearbyObstacles = solids;
    for (const o of nearbyObstacles) {
      const dx = e.x - o.x, dy = e.y - o.y, min = o.cr + r;
      if (Math.abs(dx) > min || Math.abs(dy) > min) continue;
      const d2 = dx * dx + dy * dy;
      if (d2 < min * min) {
        const d = Math.sqrt(d2) || .01;
        e.x = o.x + dx / d * min;
        e.y = o.y + dy / d * min;
      }
    }
    if (!dun && (e.x < 0 || e.y < 0 || e.x > world.width || e.y > world.height)) {
      for (const chunk of worldChunks.values()) for (const tree of chunk.trees) {
        const ox = e.x - tree.x, oy = e.y - tree.y, min = tree.radius * .45 + r;
        if (Math.abs(ox) > min || Math.abs(oy) > min) continue;
        const d = Math.hypot(ox,oy) || .01;
        if (d < min) { e.x = tree.x + ox / d * min; e.y = tree.y + oy / d * min; }
      }
    }
  }
  const inSafeZone = (x, y) => !dun && Math.hypot(x - SHRINE.x, y - (SHRINE.y + 20)) < SAFE_RADIUS;

  /* ---------- inimigos ---------- */
  const TYPES = {
    dummy: { name: 'ALVO DE TREINO', hp: 100, r: 16, speed: 0, dmg: 0, xp: 0, coin: [25, 25], hostile: false, color: '#e8c45d' },
    slime: { name: 'GOSMA DO ABISMO', hp: 46, r: 15, speed: 72, dmg: 9, reach: 38, trigger: 82, windup: .5, recover: .7, lunge: 260, aggro: 300, xp: 18, coin: [3, 8], hostile: true, color: '#6fd4a0' },
    wolf: { name: 'LOBO SOMBRIO', hp: 62, r: 15, speed: 150, dmg: 12, reach: 40, trigger: 125, windup: .38, recover: .75, lunge: 420, aggro: 420, xp: 26, coin: [5, 11], hostile: true, color: '#6a7488' },
    skeleton: { name: 'SENTINELA ESQUELÉTICA', hp: 110, r: 17, speed: 88, dmg: 17, reach: 58, trigger: 56, windup: .75, recover: .95, lunge: 0, aggro: 360, xp: 42, coin: [9, 18], hostile: true, color: '#d9d6c3' },
    boss: { name: 'GUARDIÃO DO ABISMO', hp: 720, r: 36, speed: 100, dmg: 26, reach: 135, trigger: 120, windup: 1, recover: 1.1, lunge: 560, aggro: 720, xp: 400, coin: [120, 120], hostile: true, boss: true, color: '#7b4fa8' }
  };

  // Factions and different combat roles: skirmisher, pack hunter, artillery, guardian and supporter.
  Object.assign(TYPES, {
    spider: { name: 'ARANHA DA NÉVOA', hp: 84, r: 16, speed: 122, dmg: 12, reach: 40, trigger: 85, windup: .5, recover: .76, lunge: 335, aggro: 440, xp: 35, coin: [8,16], hostile: true, ai: 'flank', element: 'natureza', color: '#9ac96a' },
    wraith: { name: 'ESPECTRO GELADO', hp: 88, r: 18, speed: 116, dmg: 15, reach: 45, trigger: 82, windup: .52, recover: .78, lunge: 290, aggro: 490, xp: 49, coin: [11,20], hostile: true, ai: 'stalker', element: 'gelo', color: '#a2dff7' },
    cultist: { name: 'CULTISTA DA BRASA', hp: 70, r: 15, speed: 88, dmg: 13, reach: 0, trigger: 310, windup: .7, recover: 1.35, ranged: true, aggro: 620, xp: 48, coin: [10,22], hostile: true, ai: 'kite', element: 'fogo', color: '#f38e64' },
    guardian: { name: 'AUTÔMATO RÚNICO', hp: 235, r: 25, speed: 61, dmg: 23, reach: 88, trigger: 90, windup: .84, recover: 1.05, aggro: 470, xp: 84, coin: [16,38], hostile: true, ai: 'guard', element: 'arcano', color: '#c5a5fa' },
    shaman: { name: 'XAMÃ DA PRAGA', hp: 100, r: 17, speed: 83, dmg: 11, reach: 0, trigger: 285, windup: .8, recover: 1.4, ranged: true, aggro: 600, xp: 67, coin: [16,32], hostile: true, ai: 'support', element: 'natureza', color: '#b4d66f' },
    harpy: { name: 'HARPIA DAS DUNAS', hp: 72, r: 15, speed: 195, dmg: 15, reach: 38, trigger: 112, windup: .32, recover: .64, lunge: 430, aggro: 590, xp: 39, coin: [9,18], hostile: true, ai: 'flank', element: 'raio', color: '#e5be7a' },
    mimic: { name: 'MÍMICO DE OBSIDIANA', hp: 165, r: 20, speed: 112, dmg: 19, reach: 60, trigger: 72, windup: .55, recover: 1.05, lunge: 380, aggro: 360, xp: 95, coin: [28,55], hostile: true, ai: 'stalker', element: 'arcano', color: '#ad7cde' }
  });
  const SPEECH = {
    slime: ['Glrrrk!', 'A terra é nossa!'], wolf: ['Grrrr!', 'Cacemos em bando!'], skeleton: ['Ossos por ossos...', 'Ninguém passa!'],
    bat: ['Kriiik!', 'A noite está viva!'], mage: ['Sinta as estrelas!', 'Não escape do meu selo.'], brute: ['EU ESMAGO!', 'Herde minha fúria!'],
    spider: ['Preso na teia!', 'Cercar a presa!'], wraith: ['O frio te levará...', 'Ouço seu coração.'], cultist: ['Tudo virará cinzas!', 'Arda em silêncio!'],
    guardian: ['PROTOCOLO: ELIMINAR.', 'Defesas ativadas.'], shaman: ['A praga floresce!', 'Meu bando resistirá!'],
    harpy: ['Minha presa!', 'O vento me obedece!'], mimic: ['Venha buscar tesouro...', 'SURPRESA!'],
    boss: ['O abismo te conhece.', 'Sua coragem acabará.'], lorde: ['Curve-se aos mortos!'], matriarca: ['Minhas crias têm fome.'],
    arquimago: ['A realidade se dobra!'], titan: ['QUEIME, INTRUSO!']
  };
  function speakEnemy(e, force = false) {
    if (!force && (gameTime < (e.nextSpeech || 0) || Math.random() > .36)) return;
    const lines = SPEECH[e.type] || ['Eu vou te encontrar!'];
    const tactical = e.hp < e.maxHp * .30 ? ['Recuar!', 'Não vou cair!', 'Protejam-me!'] :
      wave > 7 && e.elite ? ['O abismo me fortalece!', 'Você não sobreviverá!'] : lines;
    e.speech = tactical[Math.floor(Math.random()*tactical.length)]; e.speechT = 2.25;
    e.nextSpeech = gameTime + (e.t.boss ? 3 : 5) + Math.random()*5;
  }
  const ELEMENT_RESIST = {
    fogo: { fogo: .50, gelo: 1.45 }, gelo: { gelo: .5, fogo: 1.4 },
    natureza: { natureza: .6, fogo: 1.3 }, raio: { raio: .6, natureza: 1.2 },
    arcano: { arcano: .68, raio: 1.15 }
  };
  function enemyElement(e) { return e.element || e.t.element || (e.type === 'mage' || e.type === 'arquimago' ? 'arcano' : e.type === 'matriarca' ? 'natureza' : e.type === 'titan' ? 'fogo' : null); }

  function spawnEnemy(type, x, y) {
    const t = TYPES[type];
    const elite = type !== 'dummy' && !t.boss && wave >= 3 && Math.random() < Math.min(.33, .06 + wave * .017);
    const scale = 1 + Math.pow(Math.max(0, wave - 1), 1.19) * .18;
    const m = type === 'dummy' ? 1 : (t.boss ? 1 + wave * .075 : 1.25 + (rankOf() - 1) * .045) * scale * (elite ? 2.35 : 1);
    const e = {
      type, t, x, y, hp: t.hp * m, maxHp: t.hp * m, dmgMul: Math.min(5.5, (1 + (wave - 1) * .105) * (elite ? 1.55 : 1)), kx: 0, ky: 0, lx: 0, ly: 0,
      state: 'idle', timer: rand(.4, 2), hit: 0, face: rand(0, TAU), home: { x, y }, wander: { x, y }, burn: 0, burnTick: 0, slow: 0,
      bob: rand(0, 6), atkDone: false, pattern: 0, charge: false, lastHit: -99, dead: false,
      elite, element: t.element, burn: 0, poison: 0, freeze: 0, stun: 0, mark: 0, effectsClock: 0,
      speech: '', speechT: 0, nextSpeech: gameTime + rand(2, 6), aiTimer: rand(.5, 1.5),
      strafe: Math.random() > .5 ? 1 : -1, healCd: rand(5,8), dmgMulBase: 1
    };
    enemies.push(e);
    if (elite) e.speech = '✦ ELITE ✦', e.speechT = 2;
    return e;
  }
  function spawnBoss() {
    if (finalBossActive) return;
    if (enemies.some(e => e.type === 'boss' && !e.dead)) return;
    spawnEnemy('boss', BOSS_HOME.x, BOSS_HOME.y);
    ring(BOSS_HOME.x, BOSS_HOME.y, '#b27cf0', 40, 320);
  }
  function typeForXOld(x) {
    const r = Math.random();
    if (x < 900) return r < .62 ? 'slime' : (r < .92 ? 'wolf' : 'skeleton');
    if (x < 1750) return r < .3 ? 'slime' : (r < .75 ? 'wolf' : 'skeleton');
    return r < .15 ? 'slime' : (r < .45 ? 'wolf' : 'skeleton');
  }
  function validSpawn(x, y) {
    const onHomeMap = x > -100 && y > -100 && x < world.width + 100 && y < world.height + 100;
    // Travessia livre: sem parede invisível na borda do mapa original.
    if (onHomeMap && (inRiver(x, y) || Math.abs(riverX(y) - x) < 130)) return false;
    if (Math.hypot(x - SHRINE.x, y - SHRINE.y) < 310) return false;
    for (const o of solids) if (Math.hypot(x - o.x, y - o.y) < o.cr + 24) return false;
    return true;
  }
  function trySpawnRandom(minDist, maxDist) {
    if (finalBossActive) return false;
    for (let i = 0; i < 14; i++) {
      const a = rand(0, TAU), d = rand(minDist, maxDist);
      const x = player.x + Math.cos(a) * d, y = player.y + Math.sin(a) * d;
      if (!validSpawn(x, y)) continue;
      spawnEnemy(typeForX(x, y), x, y);
      return true;
    }
    return false;
  }
  function trySpawnMimicBoss() {
    if(finalBossActive||dun||enemies.some(e=>!e.dead&&e.type==='mimic_boss'))return false;
    for(let i=0;i<18;i++){
      const a=rand(0,TAU),d=rand(340,500),x=player.x+Math.cos(a)*d,y=player.y+Math.sin(a)*d;
      if(!validSpawn(x,y))continue;
      const e=spawnEnemy('mimic_boss',x,y);e.bossRewardDrop=true;e.state='idle';e.speech='Um tesouro lendário...';e.speechT=3;
      targetEnemy=e;ring(x,y,'#f3c960',36,260);showBanner('CHEFE ERRANTE','Um Mímico lendário apareceu em algum lugar próximo.');sfx('slam');return true;
    }
    return false;
  }
  const isRegular = e => e.type !== 'dummy' && !e.t.boss;

  function aoeOf(e) {
    const t = e.t;
    if (e.type === 'boss') return { x: e.x, y: e.y, r: t.reach };
    return { x: e.x + Math.cos(e.face) * t.reach * .55, y: e.y + Math.sin(e.face) * t.reach * .55, r: t.reach * .8 };
  }

  function statusToPlayer(kind, duration) {
    if (!kind || player.dead || inSafeZone(player.x, player.y)) return;
    if (kind === 'fogo') player.burn = Math.max(player.burn, duration * .8);
    if (kind === 'natureza') player.poison = Math.max(player.poison, duration * 1.5);
    if (kind === 'gelo') player.chill = Math.max(player.chill, duration);
    if (kind === 'raio') player.shock = Math.max(player.shock, duration * .65);
    if (kind === 'arcano') player.curse = Math.max(player.curse, duration);
  }
  function tickPlayerStatus(dt) {
    for (const key of ['burn','poison','chill','shock','curse']) player[key] = Math.max(0, player[key] - dt);
    player.effectTick -= dt;
    if (player.effectTick > 0 || player.dead || inSafeZone(player.x, player.y)) return;
    player.effectTick = .55;
    const raw = (player.burn > 0 ? 3.2 + wave * .25 : 0) + (player.poison > 0 ? 2.1 + wave * .22 : 0);
    if (raw > 0) {
      const dmg = Math.max(1, Math.ceil(raw * (1 - ARMORS[cust.armorType].guard) * (starterBoon('shield') ? .85 : 1) * (1 - (player.relics.ward || 0) * .055)));
      player.hp -= dmg; floatText(player.x, player.y - 36, `-${dmg} DoT`, '#f4a66d', 12);
      if (player.hp <= 0) die();
    }
  }
  function applyEnemyEffect(e, kind, duration, force = 1) {
    if (e.dead || kind === 'none') return;
    const modifier = e.t.boss ? .55 : 1;
    if (kind === 'fogo') { e.burn = Math.max(e.burn, duration * modifier); e.burnTick = 0; }
    if (kind === 'gelo') { e.slow = Math.max(e.slow, duration * modifier); e.freeze = Math.max(e.freeze || 0, .42 * modifier * force); }
    if (kind === 'natureza') { e.poison = Math.max(e.poison, duration * modifier); }
    if (kind === 'raio') { e.stun = Math.max(e.stun, .33 * modifier * force); }
    if (kind === 'arcano') { e.mark = Math.max(e.mark, duration * modifier); }
  }
  function hurtPlayer(amount, fromX, fromY, heavy = false, element = null) {
    if (player.dead || player.invuln > 0 || inSafeZone(player.x, player.y)) return;
    let dmg = Math.max(1, Math.round(amount * (1 - ARMORS[cust.armorType].guard) * (starterBoon('shield') ? .85 : 1) * (1 - (player.relics.ward || 0) * .055) * (player.curse > 0 ? 1.25 : 1) * rand(.9, 1.1)));
    if (cust.cls === 'tanke' && player.blocking && player.focus > 0) {
      player.focus = Math.max(0, player.focus - dmg);
      floatText(player.x, player.y - 43, `-${dmg} MANA`, '#8fe8ff', 15);
      burst(player.x, player.y, 7, { color: ['#d9f5ff', '#7cdcff'], speed: 110, life: .3, size: 2.5, glow: true });
      sfx('skill');
      if (player.focus === 0) setBlocking(false);
      return;
    }
    player.invuln = .6;
    player.hurt = .35;
    if (dmg <= 0) { sfx('skill'); burst(player.x, player.y, 8, { color: ['#d9f5ff', '#7cdcff'], speed: 140, life: .36, size: 3, glow: true }); return; }
    player.hp -= dmg;
    if (element && Math.random() < .48) statusToPlayer(element, 2.8);
    const a = Math.atan2(player.y - fromY, player.x - fromX);
    const kb = heavy ? 520 : 300;
    player.kx += Math.cos(a) * kb; player.ky += Math.sin(a) * kb;
    shake(heavy ? 12 : 7);
    hitstop = Math.max(hitstop, .06);
    sfx('hurt');
    floatText(player.x, player.y - 30, `-${dmg}`, '#ff7b6e', 20);
    burst(player.x, player.y, 10, { color: ['#d9534f', '#ff8a7a'], speed: 180, life: .4, size: 3 });
    if (player.hp <= 0) die();
  }
  function die() {
    player.hp = 0;
    player.dead = true;
    player.deadT = 0;
    attackHeld = false;
    const lost = Math.floor(player.coins * .1);
    player.coins -= lost;
    sfx('death');
    showBanner('VOCÊ CAIU', 'Sua jornada acabou. Crie um novo aventureiro.');
    for (const e of enemies) if (!e.dead && e.type !== 'dummy') { e.state = 'idle'; e.timer = 1.5; }
  }
  function respawnPlayer() {
    if (dun) leaveDungeon(true);
    player.dead = false;
    player.x = SHRINE.x; player.y = SHRINE.y + 130;
    player.hp = maxHpOf(); player.focus = maxFocusOf();
    player.invuln = 2; player.kx = player.ky = 0;
    player.burn = player.poison = player.chill = player.shock = player.curse = 0;
    player.swing = null; player.spin = null;
    ring(player.x, player.y, '#9fe8b5', 30, 220);
    showToast('Renascido no santuário');
  }

  function updateEnemy(e, dt) {
    const t = e.t;
    e.hit = Math.max(0, e.hit - dt);
    e.speechT = Math.max(0, (e.speechT || 0) - dt);
    e.stun = Math.max(0, (e.stun || 0) - dt);
    e.freeze = Math.max(0, (e.freeze || 0) - dt);
    e.mark = Math.max(0, (e.mark || 0) - dt);
    e.poison = Math.max(0, (e.poison || 0) - dt);
    e.aiTimer -= dt;
    if (e.aiTimer <= 0) { e.aiTimer = rand(1.2, 2.2); e.strafe *= -1; }
    e.slow = Math.max(0, e.slow - dt);
    e.burn = Math.max(0, e.burn - dt);
    if (e.finalBoss && e.emerging > 0) {
      e.emerging = Math.max(0, e.emerging - dt);
      e.state = 'idle';
      e.kx = e.ky = 0;
      return;
    }
    if (e.finalBoss && (e.summonTimer -= dt) <= 0) {
      e.summonTimer = 10;
      const minions = ['oniguard','voidspawn','abyssbat'];
      for (let i=0;i<3;i++) {
        const a=i/3*TAU+gameTime*.22,x=e.x+Math.cos(a)*105,y=e.y+Math.sin(a)*105;
        const minion=spawnEnemy(minions[i],x,y);
        minion.home={x,y};minion.wander={x,y};minion.state='chase';minion.face=Math.atan2(player.y-y,player.x-x);
      }
      showBanner('O ONI CONVOCA O ABISMO','Três criaturas foram chamadas para a arena.');
      ring(e.x,e.y,'#ba65ff',38,270);sfx('slam');
    }
    if (e.burn > 0 && (e.burnTick -= dt) <= 0) {
      e.burnTick = .45;
      e.hp -= Math.max(2, Math.round((3 + (player.relics.fury || 0) * .8) * (1 + wave * .09)));
      burst(e.x, e.y, 3, { color: ELEMENTS.fogo.color, speed: 55, life: .25, size: 2, glow: true });
      if (e.hp <= 0) { killEnemy(e); return; }
    }
    if (e.poison > 0 && (e.effectsClock -= dt) <= 0) {
      e.effectsClock = .7;
      e.hp -= Math.max(2, Math.round(4 + wave * .65 + (player.relics.venom || 0) * 3));
      burst(e.x, e.y, 3, { color: '#82e48b', speed: 50, life: .25, size: 2 });
      if (e.hp <= 0) { killEnemy(e); return; }
    }
    e.x += e.kx * dt; e.y += e.ky * dt;
    const kd = Math.exp(-9 * dt); e.kx *= kd; e.ky *= kd;
    if (t.speed === 0) { collide(e, t.r); return; }
    if (e.stun > 0 || e.freeze > 0) { collide(e, t.r * .8); return; }
    const moveSpeed = t.speed * Math.min(1.48, 1 + (wave - 1) * .018) * (e.slow > 0 ? .43 : 1) * (e.poison > 0 ? .90 : 1);

    const dx = player.x - e.x, dy = player.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    const safe = player.dead || inSafeZone(player.x, player.y);

    switch (e.state) {
      case 'idle': {
        e.timer -= dt;
        if (!safe && dist < t.aggro * (1 + Math.min(wave,16) *.018)) { e.state = 'chase'; speakEnemy(e, !!t.boss); if (t.boss) { showToast('O Guardião do Abismo te encontrou!'); sfx('slam'); } break; }
        if (e.timer <= 0) {
          e.wander = { x: e.home.x + rand(-130, 130), y: e.home.y + rand(-130, 130) };
          e.timer = rand(2, 4.5);
        }
        const wx = e.wander.x - e.x, wy = e.wander.y - e.y, wd = Math.hypot(wx, wy);
        if (wd > 10) {
          e.x += wx / wd * moveSpeed * .35 * dt; e.y += wy / wd * moveSpeed * .35 * dt;
          e.face = Math.atan2(wy, wx);
        }
        break;
      }
      case 'chase': {
        if (safe || dist > t.aggro * 1.8) { e.state = 'idle'; e.timer = 1; break; }
        e.face = Math.atan2(dy, dx);
        const trigger = t.boss && t.lunge && e.pattern % 2 === 1 ? 360 : (t.nova && e.pattern % 2 === 0 ? 330 : t.trigger);
        // Kite / flank / pack / escort AI; enemies no longer follow a single line.
        const ai = t.ai || (e.type === 'wolf' || e.type === 'bat' ? 'flank' : t.ranged ? 'kite' : 'chase');
        if (ai === 'support' && e.healCd <= 0) {
          const ally = enemies.filter(a => a !== e && !a.dead && a.type !== 'dummy' && Math.hypot(a.x-e.x,a.y-e.y)<230).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
          if (ally && ally.hp < ally.maxHp * .75) { ally.hp = Math.min(ally.maxHp, ally.hp + ally.maxHp * .22); ring(ally.x,ally.y,'#a5f092',14,95); speakEnemy(e,true); e.healCd = 9; }
        }
        e.healCd -= dt;
        if (ai === 'kite' || ai === 'support') {
          const desired = t.trigger * .80;
          if (dist < desired) { e.x -= dx/dist * moveSpeed * .8 * dt; e.y -= dy/dist * moveSpeed * .8 * dt; }
          e.x += -dy/dist * moveSpeed * .3 * dt * e.strafe;
          e.y += dx/dist * moveSpeed * .3 * dt * e.strafe;
        }
        if (dist > trigger) {
          const hop = e.type === 'slime' ? .35 + .65 * Math.max(0, Math.sin(gameTime * 5 + e.bob)) : 1;
          const flank = (ai === 'flank' || ai === 'stalker') ? Math.min(.65, dist / 300) * e.strafe : 0;
          const pace = ai === 'stalker' && dist > 150 ? .67 : 1;
          e.x += (dx / dist - dy / dist * flank) * moveSpeed * hop * pace * dt;
          e.y += (dy / dist + dx / dist * flank) * moveSpeed * hop * pace * dt;
        } else {
          e.charge = !!t.boss && !!t.lunge && e.pattern % 2 === 1;
          e.state = 'windup';
          speakEnemy(e);
          e.timer = e.charge ? .7 : t.windup;
          e.maxTimer = e.timer;
        }
        break;
      }
      case 'windup': {
        e.timer -= dt;
        if (!e.charge || e.timer > .25) {
          const target = Math.atan2(dy, dx);
          const diff = Math.atan2(Math.sin(target - e.face), Math.cos(target - e.face));
          e.face += diff * Math.min(1, dt * (t.lunge ? 5 : 3));
        }
        if (e.timer <= 0) startAttack(e);
        break;
      }
      case 'attack': {
        e.timer -= dt;
        e.x += e.lx * dt; e.y += e.ly * dt;
        if (!e.atkDone && Math.hypot(player.x - e.x, player.y - e.y) < t.r + 14 + (e.charge ? 18 : t.reach * .4)) {
          e.atkDone = true;
          hurtPlayer(t.dmg * e.dmgMul * (e.charge ? 1.2 : 1), e.x, e.y, !!t.boss, enemyElement(e));
        }
        if (e.timer <= 0) { e.state = 'recover'; e.timer = t.recover; e.pattern++; }
        break;
      }
      case 'recover':
        e.timer -= dt;
        if (e.timer <= 0) e.state = 'chase';
        break;
      default: break;
    }
    // não ficar em cima do herói
    if (e.state !== 'attack') {
      const minD = t.r + 11;
      if (dist < minD) { e.x -= dx / dist * (minD - dist) * .6; e.y -= dy / dist * (minD - dist) * .6; }
    }
    if (dun) {
      e.x = clamp(e.x, 30, world.width - 30);
      e.y = clamp(e.y, FLOOR_TOP, world.height - 30);
    }
    collide(e, t.r * .8);
  }
  function startAttack(e) {
    const t = e.t;
    e.atkDone = false;
    if (t.ranged || (t.boss && e.pattern % 2 === 0) || (t.nova && e.pattern % 2 === 0)) { fireFor(e); e.state = 'recover'; e.timer = t.recover; e.pattern++; return; }
    if (t.lunge) {
      const speed = e.charge ? 560 : t.lunge;
      e.state = 'attack';
      e.timer = e.charge ? .5 : .22;
      e.lx = Math.cos(e.face) * speed; e.ly = Math.sin(e.face) * speed;
    } else {
      const a = aoeOf(e);
      if (Math.hypot(player.x - a.x, player.y - a.y) < a.r + 10) hurtPlayer(t.dmg * e.dmgMul, e.x, e.y, !!t.boss, enemyElement(e));
      burst(a.x, a.y, t.boss ? 26 : 10, { color: ['#c9b98a', '#8b7d5b', '#5d6b45'], speed: t.boss ? 280 : 150, life: .5, size: 3.5, drag: 4 });
      if (t.boss) { shake(14); sfx('slam'); ring(a.x, a.y, '#b27cf0', 36, 330); }
      e.state = 'recover'; e.timer = t.recover; e.pattern++;
    }
  }

  function killEnemy(e) {
    e.dead = true;
    onKillExt(e);
    const t = e.t;
    player.kills++;
    burst(e.x, e.y, t.boss ? 50 : 20, { color: [t.color, '#ffffff', '#f4cf79'], speed: t.boss ? 340 : 220, life: .7, size: 3.4, drag: 4, glow: true });
    const total = Math.round(rand(t.coin[0], t.coin[1]));
    const n = Math.min(t.boss ? 14 : 6, Math.max(1, Math.ceil(total / 5)));
    for (let i = 0; i < n; i++) dropLoot(e.x, e.y, 'coin', Math.max(1, Math.round(total / n)));
    if (isRegular(e) && Math.random() < .14) dropLoot(e.x, e.y, 'potion', 1);
    if (t.boss) { dropLoot(e.x, e.y, 'potion', 1); dropLoot(e.x, e.y, 'potion', 1); }
    if (t.xp) dropLoot(e.x, e.y, 'xp', Math.round(t.xp * (1 + (e.dmgMul - 1) * .5)));
    if(e.bossRewardDrop){
      const names={guerreiro:'Lâmina Dente-de-Ouro',mago:'Códice do Cofre Faminto',arqueiro:'Arco da Fortuna Voraz',paladino:'Martelo da Cidadela Perdida',druida:'Totem do Tesouro Vivo',assassino:'Presas da Moeda Negra',tanke:'Quebra-Muralha do Mímico'};
      dropLoot(e.x,e.y,'legendary',names[cust.cls]||'Arma do Cofre Faminto');
      showBanner('O MÍMICO CAIU','Ele deixou uma arma lendária.');
    }
    hitstop = Math.max(hitstop, t.boss ? .2 : .1);
    shake(t.boss ? 18 : 6);
    sfx(t.boss ? 'slam' : 'crit');
    if (targetEnemy === e) targetEnemy = null;

    if (e.finalBoss) {
      finalBossActive = false;
      showBanner('O ONI DO ABISMO FOI DERROTADO','As fendas se fecharam.');
      delayed.push({t:1.8,fn:()=>showRunEnd(true)});
      return;
    }

    if (quest.stage === 0 && e.type === 'dummy') completeQuest();
    else if (quest.stage === 1 && t.hostile && !t.boss) {
      quest.progress++;
      if (quest.progress >= quests[1].goal) completeQuest(); else showToast(`Criatura derrotada (${quest.progress}/${quests[1].goal})`);
    } else if (quest.stage === 3 && e.type === 'boss') completeQuest();
    else if (e.type === 'boss') showBanner('GUARDIÃO DERROTADO', 'Ele retornará em alguns minutos');

    if (e.type === 'dummy') delayed.push({ t: 1.8, fn: () => spawnEnemy('dummy', 1260 + Math.random() * 460, 880 + Math.random() * 380) });
    if (e.type === 'boss') delayed.push({ t: 240, fn: () => { if (quest.stage >= 4) { spawnBoss(); showToast('O Guardião do Abismo retornou...'); } } });
  }

  /* ---------- progressão ---------- */
  function addXp(n) {
    n = Math.round(n * xpMul());
    player.xp += n;
    floatText(player.x, player.y - 44, `+${n} XP`, '#9fe8b5', 13);
    let leveled = false;
    while (player.xp >= xpNeed(player.level)) {
      player.xp -= xpNeed(player.level);
      player.level++;
      pendingLevelChoices.push({ rank: rankOf(), statChosen: false });
      leveled = true;
    }
    if (leveled) {
      player.hp = Math.min(player.hp, maxHpOf()); player.focus = Math.min(player.focus, maxFocusOf());
      ring(player.x, player.y, '#ffe28a', 40, 300);
      burst(player.x, player.y, 30, { color: ['#ffe28a', '#fff4c4'], speed: 260, life: .9, size: 3.4, glow: true });
      showBanner(`NÍVEL ${rankOf()}`, 'Escolha como fortalecer seu herói');
      sfx('level');
      renderLevelChoice();
      saveGame();
    }
  }
  const BOONS = [
    {id:'health',n:'Coração de Ferro',icon:'♥',d:'+24 de vida máxima e cura total.',rar:'COMUM'},
    {id:'stamina',n:'Fôlego Infinito',icon:'↯',d:'+25 de vigor máximo.',rar:'COMUM'},
    {id:'mana',n:'Fonte Arcana',icon:'✦',d:'+20 de mana máxima.',rar:'COMUM'},
    {id:'fury',n:'Lâminas Famintas',icon:'⚔',d:'+5 de dano base por nível.',rar:'RARO'},
    {id:'haste',n:'Passos do Vento',icon:'➶',d:'+5,5% de velocidade por nível.',rar:'RARO'},
    {id:'arcana',n:'Sintonia Elemental',icon:'✺',d:'Debuffs duram mais e mana regenera mais rápido.',rar:'ÉPICO'},
    {id:'vampire',n:'Sede de Sangue',icon:'☽',d:'Chance de roubar vida ao atingir inimigos.',rar:'ÉPICO'},
    {id:'cryo',n:'Geada Perpétua',icon:'❄',d:'Ataques glaciais congelam por mais tempo.',rar:'RARO'},
    {id:'storm',n:'Arco Voltaico',icon:'⚡',d:'Relâmpagos saltam a mais alvos e têm maior alcance.',rar:'ÉPICO'},
    {id:'venom',n:'Esporos Nocivos',icon:'❋',d:'Seus golpes podem aplicar veneno além do elemento.',rar:'RARO'},
    {id:'magnet',n:'Ímã de Tesouros',icon:'◈',d:'Maior distância de coleta de moedas.',rar:'COMUM'},
    {id:'ward',n:'Pele Endurecida',icon:'⬡',d:'Reduz todo o dano recebido em 5,5%.',rar:'RARO'},
    {id:'boneVolley',n:'Aljava Ossária',icon:'☠',d:'Cada ataque dispara um osso perfurante adicional.',rar:'RARO'},
    {id:'crystalShards',n:'Fragmentos Orbitais',icon:'✦',d:'Cada ataque lança três estilhaços em leque.',rar:'ÉPICO'},
    {id:'firebrand',n:'Marca Ígnea',icon:'✹',d:'Cada ataque dispara uma bola de fogo explosiva.',rar:'ÉPICO'}
  ];
  function rollOffers(pending) {
    if (Array.isArray(pending.offers) && pending.offers.length === 3) return pending.offers;
    const pool = BOONS.filter(b => ['health','stamina','mana'].includes(b.id) || (player.relics[b.id] || 0) < 12);
    const rolls=[];
    while (rolls.length < 3 && pool.length) {
      const n = Math.floor(Math.random()*pool.length), offer=pool.splice(n,1)[0];
      rolls.push(offer.id);
    }
    pending.offers = rolls;
    return rolls;
  }
  function renderLevelChoice() {
    const pending = pendingLevelChoices[0];
    if (!pending) { el.levelPanel.hidden = true; paused = false; return; }
    paused = true; el.levelPanel.hidden = false;
    if (pending.rank === 5 && pending.statChosen && !cust.ultimate) {
      el.levelPanelTitle.textContent = 'ESCOLHA SUA ULTIMATE';
      el.levelChoices.innerHTML = Object.entries(ULTIMATES).map(([id, ult]) => `<button class="level-choice ultimate-choice" type="button" data-ultimate="${id}"><span class="choice-icon">${ult.icon}</span><strong>${ult.name}</strong><small>${ult.description}</small></button>`).join('');
      return;
    }
    el.levelPanelTitle.textContent = `NÍVEL ${pending.rank} · 3 PODERES ALEATÓRIOS`;
    el.levelChoices.innerHTML = rollOffers(pending).map(id => {
      const b=BOONS.find(b=>b.id===id);
      return `<button class="level-choice ${b.rar==='ÉPICO'?'choice-epic':''}" type="button" data-boon="${id}"><span class="choice-icon">${b.icon}</span><strong>${b.n}</strong><small>${b.rar} · ${b.d}</small></button>`;
    }).join('');
  }
  el.levelPanel.addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button) return;
    const pending = pendingLevelChoices[0]; if (!pending) return;
    if (button.dataset.boon && !pending.statChosen && pending.offers?.includes(button.dataset.boon)) {
      const id=button.dataset.boon;
      if (id==='health') { player.healthRanks++; player.hp=maxHpOf(); }
      else if (id==='stamina') { player.staminaRanks++; player.stamina=maxStaminaOf(); }
      else if (id==='mana') { player.manaRanks++; player.focus=maxFocusOf(); }
      else player.relics[id]=(player.relics[id]||0)+1;
      pending.statChosen = true;
      if (pending.rank !== 5 || cust.ultimate) pendingLevelChoices.shift();
    } else if (button.dataset.ultimate && pending.rank === 5 && pending.statChosen && !cust.ultimate) {
      cust.ultimate = button.dataset.ultimate; saveExp(); pendingLevelChoices.shift();
      showToast(`Ultimate desbloqueada: ${ULTIMATES[cust.ultimate].name}`);
    } else return;
    saveGame(); renderLevelChoice();
  });
  function completeQuest() {
    const q = quests[quest.stage];
    const guardianAwakens = quest.stage === 2;
    const r = q.reward;
    if (r) {
      player.coins += r.coins || 0;
      if (r.potions) player.potions = Math.min(9, player.potions + r.potions);
      addXp(r.xp || 0);
    }
    sfx('quest');
    showBanner('MISSÃO CONCLUÍDA', r ? `+${r.xp} XP · +${r.coins} moedas${r.potions ? ` · +${r.potions} poção` : ''}` : '');
    quest.stage = Math.min(quests.length - 1, quest.stage + 1);
    quest.progress = 0;
    if (guardianAwakens) {
      spawnBoss();
      showCutscene('O GUARDIÃO DESPERTA', 'As ruínas estremecem. Uma presença antiga abriu os olhos no coração da floresta.', 'CAPÍTULO I · O PRIMEIRO SELO');
    }
    el.worldMessage.textContent = 'Purifique todas as masmorras · Abismo por Abismo.';
    saveGame();
  }
  function questTargetOld() {
    switch (quest.stage) {
      case 0: return enemies.find(e => e.type === 'dummy' && !e.dead) || null;
      case 1: {
        let best = null, bd = 1e12;
        for (const e of enemies) {
          if (e.dead || !isRegular(e)) continue;
          const d = (e.x - player.x) ** 2 + (e.y - player.y) ** 2;
          if (d < bd) { bd = d; best = e; }
        }
        return best;
      }
      case 2: return SHRINE;
      case 3: return enemies.find(e => e.type === 'boss' && !e.dead) || BOSS_HOME;
      default: return null;
    }
  }
  function objectiveLabel(target, dist) {
    const q = quests[quest.stage];
    if (quest.stage === 0) return dist < 160 ? 'Ataque o boneco de treino' : q.text;
    if (quest.stage === 1) return `${q.text} (${quest.progress}/${q.goal})`;
    return q.text;
  }

  /* ---------- loot ---------- */
  function dropLoot(x, y, type, value = 1) {
    const a = rand(0, TAU), s = rand(60, 160);
    loot.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, type, value, age: 0, bob: rand(0, 6) });
  }
  function pickup(l) {
    if (l.type === 'coin') {
      player.coins += l.value;
      floatText(player.x, player.y - 32, `+${l.value}`, '#ffd77f', 13);
      if (gameTime - lastCoinSfx > .06) { sfx('coin'); lastCoinSfx = gameTime; }
    } else if (l.type === 'xp') {
      addXp(l.value);
      sfx('coin');
    } else if (l.type === 'legendary') {
      player.relics.mimicWeapon = 1;
      player.legendaryWeapon = String(l.value || 'Arma do Cofre Faminto');
      cust.glow = '#ffd27a';
      showBanner('ARMA LENDÁRIA', `${player.legendaryWeapon} · +28% de dano`);
      sfx('level');
    } else {
      if (player.potions >= 9) { showToast('Mochila de poções cheia'); player.coins += 15; return; }
      player.potions++;
      showToast('Poção encontrada');
      sfx('potion');
    }
    burst(l.x, l.y, 5, { color: l.type === 'coin' ? '#ffd77f' : l.type === 'xp' ? '#88cdff' : l.type === 'legendary' ? '#ffd27a' : '#ff8a7a', speed: 90, life: .3, size: 2.4, glow: true });
  }

  /* ---------- ações do herói ---------- */
  function autoAim() {
    if (player.aimLock > 0) return;
    let best = null, bd = (cust.cls === 'mago' || cust.cls === 'arqueiro') ? 420 : 170;
    for (const e of enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - player.x, e.y - player.y) - e.t.r;
      if (d >= bd) continue;
      if (angDiff(Math.atan2(e.y - player.y, e.x - player.x), player.angle) > Math.PI * .55) continue;
      bd = d; best = e;
    }
    if (best) player.angle = Math.atan2(best.y - player.y, best.x - player.x);
  }
  function damageEnemy(e, base, o = {}) {
    if (e.dead || (e.finalBoss && e.emerging > 0)) return;
    const element = ELEMENTS[cust.element];
    const resistance = ELEMENT_RESIST[enemyElement(e)]?.[cust.element] ?? 1;
    const empowered = element.strong.includes(e.type) || resistance > 1.05;
    const crit = Math.random() < .12 + (player.relics.fury || 0) * .015;
    const exposed = e.mark > 0 ? 1.28 + (player.relics.arcana || 0) * .06 : 1;
    const physical = base * .70, elemental = base * .30 * resistance;
    const dmg = Math.max(1, Math.round((physical + elemental) * exposed * rand(.91, 1.09) * (crit ? 1.75 : 1) * (empowered ? 1.13 : 1)));
    e.hp -= dmg; e.hit = .17; e.lastHit = gameTime;
    applyEnemyEffect(e, cust.element, (1.7 + (player.relics.arcana || 0) * .14), o.skill ? 1.5 : 1);
    if (cust.element === 'natureza') player.hp = Math.min(maxHpOf(), player.hp + .8 + (player.relics.vampire || 0) * .5);
    else if (cust.element === 'arcano') player.focus = Math.min(maxFocusOf(), player.focus + 1.5);
    if (cust.element === 'gelo' && player.relics.cryo) e.freeze = Math.max(e.freeze, .18 + player.relics.cryo * .06);
    if (cust.element === 'raio') {
      const chained = enemies.filter(other => other !== e && !other.dead && Math.hypot(other.x-e.x, other.y-e.y) < 155 + (player.relics.storm || 0) * 25).slice(0, 1 + (player.relics.storm || 0));
      for (const target of chained) {
        const chainDamage = Math.max(1, Math.round(dmg * (.24 + (player.relics.storm || 0) * .04)));
        target.hp -= chainDamage; target.hit = .13; target.lastHit = gameTime;
        applyEnemyEffect(target, 'raio', .6);
        burst(target.x,target.y,7,{color:element.color,speed:130,life:.3,size:2.5,glow:true});
        floatText(target.x,target.y-target.t.r-10,`⚡${chainDamage}`,element.color,13);
        if (target.hp <= 0) killEnemy(target);
      }
    }
    if (player.relics.venom && Math.random() < .17 * player.relics.venom) applyEnemyEffect(e, 'natureza', 2.8);
    if (player.relics.vampire && Math.random() < .11 * player.relics.vampire) player.hp = Math.min(maxHpOf(),player.hp + dmg * .12);
    const a = Math.atan2(e.y - player.y, e.x - player.x);
    const kb = o.kb ?? 235, resist = e.t.boss ? .23 : (e.elite ? .62 : 1);
    e.kx += Math.cos(a) * kb * resist; e.ky += Math.sin(a) * kb * resist;
    if (!e.t.boss && !e.elite && e.state === 'windup') { e.state = 'recover'; e.timer = .39; }
    if (e.t.speed > 0 && e.state === 'idle') e.state = 'chase';
    burst(e.x, e.y, crit ? 12 : 7, { color: [element.color, crit ? '#fff4c4' : '#fff3c6'], speed: crit ? 270 : 165, life: .35, size: 2.6, glow: true });
    floatText(e.x, e.y-e.t.r-8, `${crit?'✦ ':''}${dmg}${empowered?' VANTAGEM':''}`, empowered ? element.color : crit ? '#ffd45e' : '#ffffff', crit ? 18 : 15);
    if (!o.skill) player.focus = Math.min(maxFocusOf(), player.focus + 3);
    hitstop = Math.max(hitstop, crit || o.finisher ? .075 : .035);
    shake(crit || o.finisher ? 5 : 2);
    sfx(crit ? 'crit' : 'hit'); targetEnemy = e;
    if (e.hp <= 0) killEnemy(e);
    else if (e.hp < e.maxHp*.30 && e.speechT <= 0 && Math.random() < .15) speakEnemy(e,true);
  }
  function ninjaKatanaAttack() {
    if (cust.cls !== 'ninja' || player.dead || player.attackCd > 0 || paused || dialogueActive) return;
    const range = 132 * rangeMul(), arc = Math.PI * .68;
    player.attackCd = .24 * atkMul();
    player.swing = { t: 0, dur: .22, angle: player.angle, range, arc, finisher: false, dir: 1, style: 'katana' };
    player.kx += Math.cos(player.angle) * 55; player.ky += Math.sin(player.angle) * 55;
    const damage = damageOf() * 1.35 * dmgClass();
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      const dx = enemy.x - player.x, dy = enemy.y - player.y, distance = Math.hypot(dx, dy);
      if (distance > range + enemy.t.r) continue;
      if (angDiff(Math.atan2(dy, dx), player.angle) > arc / 2 + Math.atan2(enemy.t.r, Math.max(distance, 1))) continue;
      damageEnemy(enemy, damage, { kb: 320 });
    }
    sfx('swing');
  }
  function playerAttack() {
    if (player.dead || player.attackCd > 0 || paused) return;
    if (classAttack()) return;
    autoAim();
    player.combo = player.comboTimer > 0 ? (player.combo % 3) + 1 : 1;
    player.comboTimer = .8;
    const finisher = player.combo === 3;
    player.attackCd = (finisher ? .5 : .3) * atkMul();
    const range = (finisher ? 118 : 96) * rangeMul(), arc = finisher ? Math.PI * .95 : Math.PI * .72;
    player.swing = { t: 0, dur: finisher ? .26 : .2, angle: player.angle, range, arc, finisher, dir: player.combo % 2 ? 1 : -1 };
    player.kx += Math.cos(player.angle) * (finisher ? 260 : 170);
    player.ky += Math.sin(player.angle) * (finisher ? 260 : 170);
    relicProjectiles();
    sfx('swing');
    const base = damageOf() * (finisher ? 1.5 : 1) * dmgClass();
    for (const e of enemies) {
      if (e.dead) continue;
      const dx = e.x - player.x, dy = e.y - player.y, d = Math.hypot(dx, dy);
      if (d > range + e.t.r) continue;
      if (angDiff(Math.atan2(dy, dx), player.angle) > arc / 2 + Math.atan2(e.t.r, Math.max(d, 1))) continue;
      damageEnemy(e, base, { kb: finisher ? 460 : 280, finisher });
    }
  }
  function useSkill() {
    if (player.dead || paused) return;
    if (cust.cls !== 'guerreiro') { classSkill(); return; }
    if (player.skillCd > 0) return;
    if (player.focus < 20) { showToast('Foco insuficiente'); return; }
    player.focus -= 20;
    player.skillCd = 4;
    player.spin = { t: 0, dur: .5 };
    player.invuln = Math.max(player.invuln, .3);
    sfx('skill'); shake(6);
    ring(player.x, player.y, '#8ee0ff', 36, 340);
    for (const e of enemies) {
      if (e.dead) continue;
      if (Math.hypot(e.x - player.x, e.y - player.y) < 130 + e.t.r) damageEnemy(e, damageOf() * 1.9, { kb: 560, skill: true });
    }
  }
  function useUltimate() {
    if (player.dead || paused) return;
    if (!cust.ultimate) { showToast('Desbloqueie uma ultimate no nível 5'); return; }
    if (player.ultimateCd > 0) { showToast(`Ultimate: ${Math.ceil(player.ultimateCd)} s`); return; }
    player.ultimateCd = 40;
    if (cust.ultimate === 'tempestade') {
      player.ultimateTime = 8;
      ring(player.x, player.y, '#c4a2ff', 44, 400);
      burst(player.x, player.y, 36, { color: ['#c4a2ff', '#fff'], speed: 320, life: .8, size: 4, glow: true });
      showBanner('TEMPESTADE ASTRAL', 'Poder amplificado');
    } else if (cust.ultimate === 'guardiao') {
      player.hp = Math.min(maxHpOf(), player.hp + Math.round(maxHpOf() * .6));
      player.invuln = Math.max(player.invuln, 3);
      ring(player.x, player.y, '#9fe8b5', 48, 360);
      burst(player.x, player.y, 30, { color: ['#9fe8b5', '#fff4c4'], speed: 250, life: .8, size: 3.5, glow: true });
      showBanner('BASTIÃO IMORTAL', 'Vida restaurada · dano bloqueado');
    } else {
      ring(player.x, player.y, ELEMENTS[cust.element].color, 64, 520);
      for (const e of enemies) if (!e.dead && Math.hypot(e.x - player.x, e.y - player.y) < 300 + e.t.r) damageEnemy(e, damageOf() * 4.5, { kb: 760, skill: true });
      shake(18); showBanner('CATACLISMO', 'A terra treme sob sua força');
    }
    sfx('skill'); saveGame();
  }
  function dash() {
    if (player.dead || player.dashCd > 0 || paused) return;
    if (player.stamina < 30) { showToast('Vigor insuficiente'); return; }
    let dx = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0) + joystick.x;
    let dy = (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0) + joystick.y;
    let m = Math.hypot(dx, dy);
    if (m < .1) { dx = Math.cos(player.angle); dy = Math.sin(player.angle); m = 1; }
    player.dashX = dx / m; player.dashY = dy / m;
    player.dashT = .2; player.dashCd = .8;
    player.stamina -= 30;
    player.invuln = Math.max(player.invuln, .32);
    player.flash = .2;
    sfx('dash');
    burst(player.x, player.y, 10, { color: ['#c9b98a', '#a6ece1'], speed: 120, life: .35, size: 3, drag: 4 });
  }
  function heal() {
    if (player.dead || paused) return;
    if (player.hp >= maxHpOf()) { showToast('Sua vida já está cheia'); return; }
    if (player.potions <= 0) { showToast('Você não tem poções'); return; }
    player.potions--;
    const amount = Math.round(maxHpOf() * .4);
    player.hp = Math.min(maxHpOf(), player.hp + amount);
    floatText(player.x, player.y - 34, `+${amount}`, '#9fe8b5', 18);
    burst(player.x, player.y, 16, { color: ['#9fe8b5', '#d4ffd8'], speed: 120, life: .7, size: 3, glow: true, drag: 2 });
    sfx('potion');
    showToast('Poção usada');
  }

  /* ---------- entrada ---------- */
  document.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
    if (dialogueActive) return;
    if (key === 'p' || key === 'escape') { if (!event.repeat && el.levelPanel.hidden) paused = !paused; setBlocking(false); return; }
    if (key === 'm') { if (!event.repeat) toggleMute(); return; }
    keys.add(key);
    if (event.repeat) return;
    if (key === ' ' || key === 'j') playerAttack();
    if (key === 'q') useSkill();
    if (key === 'r') useUltimate();
    if (key === 'shift') dash();
    if (key === 'b' && cust.cls === 'tanke') setBlocking(true);
    if (key === 'h') heal();
  });
  document.addEventListener('keyup', event => { keys.delete(event.key.toLowerCase()); if (event.key.toLowerCase() === 'b') setBlocking(false); });
  window.addEventListener('blur', () => { keys.clear(); attackHeld = false; setBlocking(false); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { paused = true; saveGame(); } });
  window.addEventListener('pagehide', saveGame);

  canvas.addEventListener('pointerdown', event => {
    if (dialogueActive) return;
    if (event.pointerType === 'touch') {
      if (paused) paused = false;
      return;
    }
    if (paused) { paused = false; return; }
    if (event.button === 2) {
      event.preventDefault();
      if (cust.cls === 'ninja') {
        const rect = canvas.getBoundingClientRect();
        const wx = (event.clientX - rect.left) / camera.scale + camera.x;
        const wy = (event.clientY - rect.top) / camera.scale + camera.y;
        player.angle = Math.atan2(wy - player.y, wx - player.x);
        player.aimLock = .3;
        ninjaKatanaAttack();
      } else if (cust.cls === 'tanke') {
        setBlocking(true);
      }
      return;
    }
    if (event.button !== 0) return;
    const rect = canvas.getBoundingClientRect();
    const wx = (event.clientX - rect.left) / camera.scale + camera.x;
    const wy = (event.clientY - rect.top) / camera.scale + camera.y;
    player.angle = Math.atan2(wy - player.y, wx - player.x);
    player.aimLock = .3;
    attackHeld = true;
    playerAttack();
  });
  canvas.addEventListener('contextmenu', event => event.preventDefault());

  const bindButton = (node, fn, hold) => {
    node.addEventListener('pointerdown', event => { event.preventDefault(); if (dialogueActive) return; if (hold) attackHeld = true; fn(); });
  };
  bindButton(el.attackButton, playerAttack, true);
  bindButton(el.skillButton, useSkill);
  bindButton(el.ultimateButton, useUltimate);
  bindButton(el.dodgeButton, dash);
  bindButton(el.healButton, heal);
  const setBlocking = active => {
    player.blocking = !!active && cust.cls === 'tanke' && player.focus > 0 && !paused && !dialogueActive && !player.dead;
    if (el.blockButton) el.blockButton.classList.toggle('active', player.blocking);
  };
  if (el.blockButton) {
    el.blockButton.hidden = true;
    el.blockButton.addEventListener('pointerdown', event => { event.preventDefault(); el.blockButton.setPointerCapture?.(event.pointerId); setBlocking(true); });
    const releaseBlock = () => setBlocking(false);
    el.blockButton.addEventListener('pointerup', releaseBlock);
    el.blockButton.addEventListener('pointercancel', releaseBlock);
    el.blockButton.addEventListener('lostpointercapture', releaseBlock);
  }
  const releaseAttack = () => { attackHeld = false; };
  window.addEventListener('pointerup', releaseAttack);
  window.addEventListener('pointerup', event => { if (event.button === 2) setBlocking(false); });
  window.addEventListener('pointercancel', releaseAttack);

  const stick = $('#joystick');
  const knob = $('#joyKnob');
  function moveStick(event) {
    const rect = stick.getBoundingClientRect();
    const max = rect.width * .29;
    let x = event.clientX - (rect.left + rect.width / 2);
    let y = event.clientY - (rect.top + rect.height / 2);
    const length = Math.hypot(x, y);
    if (length > max) { x *= max / length; y *= max / length; }
    joystick.x = x / max;
    joystick.y = y / max;
    knob.style.transform = `translate(${x}px,${y}px)`;
  }
  function releaseStick(event) {
    if (event.pointerId !== joystick.pointer) return;
    joystick.active = false; joystick.pointer = null; joystick.x = 0; joystick.y = 0;
    knob.style.transform = '';
  }
  stick.addEventListener('pointerdown', event => {
    event.preventDefault();
    joystick.active = true; joystick.pointer = event.pointerId;
    stick.setPointerCapture(event.pointerId);
    moveStick(event);
  });
  stick.addEventListener('pointermove', event => { if (joystick.active && event.pointerId === joystick.pointer) moveStick(event); });
  stick.addEventListener('pointerup', releaseStick);
  stick.addEventListener('pointercancel', releaseStick);

  let biomeExposure=0;
  function updateBiomeHazards(dt){
    if(inSafeZone(player.x,player.y)||player.dead)return;
    if(dun && player.x<540)return;
    const biome=dun?dun.def.biome:biomeAt(player.x,player.y);
    if(!['frost','marsh','volcano','storm','ash','arcane','crystal'].includes(biome))return;
    biomeExposure+=dt;
    if(biomeExposure<9.5)return;
    biomeExposure=0;
    const resistance=starterBoon('shield') ? .35 : 1;
    if(Math.random()>.58*resistance)return;
    const element=chunkPalettes[biome].element;
    statusToPlayer(element,biome==='volcano'?3.8:2.2);
    const msgs={frost:'O frio atravessa sua armadura',marsh:'Esporos tóxicos no ar',volcano:'Cinzas incandescentes',storm:'Descarga elétrica no solo',ash:'A sombra sussurra',arcane:'Fluxo arcano instável',crystal:'Cristais vibram com energia'};
    showToast('☁ '+msgs[biome]);
  }

  /* ---------- atualização ---------- */
  function update(rawDt) {
    if (paused || dialogueActive) return;
    updateFx(rawDt);
    interactCooldown=Math.max(0,interactCooldown-rawDt);
    if (splash && splash.t < 1.8) return;
    hitstop = Math.max(0, hitstop - rawDt);
    const dt = hitstop > 0 ? rawDt * .08 : rawDt;
    gameTime += rawDt;
    const dark = dun ? .55 : 1 - daylight();

    if (toastTimer > 0 && (toastTimer -= rawDt) <= 0) el.toast.classList.remove('visible');
    if (bannerTimer > 0 && (bannerTimer -= rawDt) <= 0) el.banner.classList.remove('visible');

    // temporizadores do herói
    player.attackCd = Math.max(0, player.attackCd - dt);
    player.comboTimer = Math.max(0, player.comboTimer - dt);
    player.dashCd = Math.max(0, player.dashCd - dt);
    player.skillCd = Math.max(0, player.skillCd - dt);
    player.ultimateCd = Math.max(0, player.ultimateCd - dt);
    player.ultimateTime = Math.max(0, player.ultimateTime - dt);
    player.invuln = Math.max(0, player.invuln - dt);
    player.flash = Math.max(0, player.flash - dt);
    player.hurt = Math.max(0, player.hurt - dt);
    player.aimLock = Math.max(0, player.aimLock - dt);
    player.buff = Math.max(0, player.buff - dt);
    tickPlayerStatus(dt);updateBiomeHazards(dt);
    if (player.swing && (player.swing.t += dt) >= player.swing.dur) player.swing = null;
    if (player.spin && (player.spin.t += dt) >= player.spin.dur) player.spin = null;

    if (player.dead) {
      player.deadT += dt;
      if(player.deadT>2.2){restartToCreation();return;}
    } else {
      if ((keys.has(' ') || keys.has('j') || attackHeld) && !paused) playerAttack();
      else if (autoAttack && player.attackCd <= 0) {
        const maxRange = ['mago','arqueiro','druida'].includes(cust.cls) ? 390 : 130;
        let nearest=null, nd=maxRange;
        for (const e of enemies) {
          if(e.dead || e.type==='dummy' && quest.stage>0) continue;
          const d=Math.hypot(e.x-player.x,e.y-player.y)-e.t.r;
          if(d<nd){nd=d;nearest=e;}
        }
        if(nearest){player.angle=Math.atan2(nearest.y-player.y,nearest.x-player.x);playerAttack();}
      }
      let dx = (keys.has('arrowright') || keys.has('d') ? 1 : 0) - (keys.has('arrowleft') || keys.has('a') ? 1 : 0) + joystick.x;
      let dy = (keys.has('arrowdown') || keys.has('s') ? 1 : 0) - (keys.has('arrowup') || keys.has('w') ? 1 : 0) + joystick.y;
      const mag = Math.hypot(dx, dy);
      if (mag > 1) { dx /= mag; dy /= mag; }
      const moving = mag > .05;
      player.motion += ((moving ? 1 : 0) - player.motion) * Math.min(1,dt * 12);
      const water = !dun && player.x >= 0 && player.y >= 0 && player.x <= world.width && player.y <= world.height && Math.hypot(player.x-SPAWN.x,player.y-SPAWN.y)<640 && inRiver(player.x, player.y);
      let vx = 0, vy = 0;
      if (player.dashT > 0) {
        player.dashT -= dt;
        vx = player.dashX * 700; vy = player.dashY * 700;
        if (Math.random() < .6) addParticle({ x: player.x, y: player.y + 6, vx: 0, vy: 0, life: .3, max: .3, size: 9, color: 'rgba(166,236,225,.35)', drag: 0, shrink: true });
      } else if (moving) {
        if (!player.swing || player.aimLock <= 0) {
          const wanted = Math.atan2(dy, dx);
          player.angle += Math.atan2(Math.sin(wanted-player.angle), Math.cos(wanted-player.angle)) * Math.min(1,dt * 18);
        }
        let speed = 235 * spMul() * (1 + (player.relics.haste || 0) * .055) * (player.ultimateTime > 0 && cust.ultimate === 'tempestade' ? 1.12 : 1);
        if (roadDist(player.x, player.y) < 44) speed *= 1.1;
        if (water) speed *= .62;
        if (player.chill > 0) speed *= .68;
        if (player.shock > 0) speed *= .77;
        if (player.swing) speed *= .55;
        vx = dx * speed * (Math.abs(dx) > 0 ? 1 : 1); vy = dy * speed;
        player.walk += dt * 9.6 * Math.min(1.4,speed/235);
      }
      const kd = Math.exp(-10 * dt);
      player.x += (vx + player.kx) * dt;
      player.y += (vy + player.ky) * dt;
      player.kx *= kd; player.ky *= kd;
      if (dun) {
        player.x = clamp(player.x, 24, world.width - 24);
        player.y = clamp(player.y, FLOOR_TOP, world.height - 24);
      }
      collide(player, 11);
      if(!dun) for(const chunk of worldChunks.values()) for(const point of chunk.landmarks) {
        if(point.kind==='altar' && Math.hypot(player.x-point.x,player.y-point.y)<36) {
          player.hp=Math.min(maxHpOf(),player.hp + 11*dt);
          player.focus=Math.min(maxFocusOf(),player.focus+9*dt);
        }
      }
      if (moving || player.dashT > 0) {
        player.stepDist += Math.hypot(vx, vy) * dt;
        if (player.stepDist > 34) {
          player.stepDist = 0;
          if (water) burst(player.x, player.y + 8, 5, { color: ['#a6ece1', '#e8fffb'], speed: 70, life: .45, size: 2.4, drag: 2 });
          else addParticle({ x: player.x, y: player.y + 10, vx: rand(-12, 12), vy: rand(-12, 0), life: .5, max: .5, size: 3, color: 'rgba(190,176,130,.45)', drag: 2, shrink: true });
        }
      }
      // regeneração
      player.focus = Math.min(maxFocusOf(), player.focus + (3 + (player.relics.arcana || 0) * .65) * dt);
      player.stamina = Math.min(maxStaminaOf(), player.stamina + (12 + player.staminaRanks * 3) * dt);
      if (inSafeZone(player.x, player.y)) {
        player.hp = Math.min(maxHpOf(), player.hp + 7 * dt);
        player.burn = player.poison = player.chill = player.shock = player.curse = 0;
        player.focus = Math.min(maxFocusOf(), player.focus + 9 * dt);
        player.stamina = Math.min(maxStaminaOf(), player.stamina + 18 * dt);
        if (Math.random() < dt * 6) addParticle({ x: player.x + rand(-16, 16), y: player.y + rand(-4, 14), vx: 0, vy: -30, life: 1, max: 1, size: 2.6, color: '#9fe8b5', drag: 0, glow: true, shrink: true });
      }
      if (quest.stage === 2 && Math.hypot(player.x - SHRINE.x, player.y - SHRINE.y) < SAFE_RADIUS - 10) completeQuest();
    }

    // loot
    updateList(loot, l => {
      l.age += dt;
      l.x += l.vx * dt; l.y += l.vy * dt;
      const k = Math.exp(-5 * dt); l.vx *= k; l.vy *= k;
      if (!player.dead && l.age > .25) {
        const dx = player.x - l.x, dy = player.y - l.y, d = Math.hypot(dx, dy) || 1;
        const magnet = l.type === 'xp' ? 140 + (player.relics.magnet || 0)*40 : l.type === 'coin' ? 125 + (player.relics.magnet || 0)*55 : 70;
        if (l.age > .35 && d < magnet) { const sp = (1 - d / magnet) * 520 + 120; l.x += dx / d * sp * dt; l.y += dy / d * sp * dt; }
        if (d < 24) { pickup(l); return false; }
      }
      return l.age < 60;
    });

    // aliados contratados
    updateCompanions(dt);

    // inimigos
    for (const e of enemies) if (!e.dead) updateEnemy(e, dt);
    for (let i = 0; i < enemies.length; i++) {
      const a = enemies[i]; if (a.dead || a.t.speed === 0) continue;
      for (let j = i + 1; j < enemies.length; j++) {
        const b = enemies[j]; if (b.dead || b.t.speed === 0) continue;
        if (Math.abs(b.x-a.x) > 70 || Math.abs(b.y-a.y) > 70) continue;
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, min = a.t.r + b.t.r;
        if (d < min) { const push = (min - d) * .5; a.x -= dx / d * push; a.y -= dy / d * push; b.x += dx / d * push; b.y += dy / d * push; }
      }
    }
    updateList(enemies, e => {
      if (e.dead) return false;
      if (isRegular(e) && Math.hypot(e.x - player.x, e.y - player.y) > 1750) return false;
      return true;
    });
    if(!dun&&!finalBossActive&&gameTime>55){
      mimicBossTimer-=rawDt;
      if(mimicBossTimer<=0){mimicBossTimer=rand(145,245);trySpawnMimicBoss();}
    }
    if (!dun && !finalBossActive) {
      waveTimer += rawDt;
      if (waveTimer >= 38) {
        waveTimer -= 38;
        wave++;
        showBanner(`ONDA ${wave} · AMEAÇA ${Math.round(100*Math.pow(1+.17*(wave-1),1.10))}%`, 'Vida, dano, velocidade e elites aumentaram');
        sfx('slam'); shake(9);
        const pack = Math.min(20, 3 + wave * 2);
        for (let i = 0; i < pack; i++) trySpawnRandom(430, 780);
        saveGame();
      }
    }
    spawnTimer -= dt;
    if (spawnTimer <= 0 && !dun && !finalBossActive) {
      spawnTimer = Math.max(.21, 1.30 - wave * .06);
      const max = Math.min(96, 15 + wave * 5 + (dark > .6 ? 6 : 0));
      if (enemies.filter(e=>!e.dead && isRegular(e)).length < max) { const n = wave > 5 ? 2 : 1; for (let i=0;i<n;i++) trySpawnRandom(440, 850); }
    }
    if (targetEnemy && (targetEnemy.dead || gameTime - targetEnemy.lastHit > 5)) targetEnemy = null;

    // partículas ambientais
    const viewW = camera.width / camera.scale, viewH = camera.height / camera.scale;
    if (Math.random() < dt * 3) addParticle({ x: camera.x + rand(0, viewW), y: camera.y - 10, vx: rand(18, 45), vy: rand(18, 35), life: 6, max: 6, size: rand(1.6, 2.8), color: ['#c9b24a', '#8fb04d', '#d58a48'][(Math.random() * 3) | 0], drag: 0, shrink: false });
    if (dark > .25 && particles.length < 380 && Math.random() < dt * 9 * dark) {
      addParticle({ x: camera.x + rand(0, viewW), y: camera.y + rand(0, viewH), vx: 0, vy: 0, life: 6, max: 6, size: 2.4, color: '#e8ff9a', drag: 0, glow: true, shrink: false, wander: true });
    }
    updateList(particles, p => {
      p.life -= dt;
      if (p.life <= 0) return false;
      if (p.wander) { p.vx = clamp(p.vx + rand(-1, 1) * 70 * dt, -22, 22); p.vy = clamp(p.vy + rand(-1, 1) * 70 * dt, -22, 22); }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.drag) { const k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; }
      return true;
    });
    updateList(floaters, f => { f.life -= dt; f.y += f.vy * dt; f.vy *= Math.exp(-2 * dt); return f.life > 0; });
    updateList(delayed, d => { if (dun) return true; d.t -= rawDt; if (d.t <= 0) { d.fn(); return false; } return true; });

    updateExt(dt);
    // câmera
    const targetX = dun ? clamp(player.x - viewW / 2, 0, Math.max(0, world.width - viewW)) : player.x - viewW / 2;
    const targetY = dun ? clamp(player.y - viewH / 2, FLOOR_TOP, Math.max(FLOOR_TOP, world.height - viewH)) : player.y - viewH / 2;
    const follow = 1 - Math.exp(-9 * rawDt);
    camera.x += (targetX - camera.x) * follow;
    camera.y += (targetY - camera.y) * follow;
    camera.shake *= Math.exp(-10 * rawDt);
    if (camera.shake < .1) camera.shake = 0;

    saveTimer -= rawDt;
    if (saveTimer <= 0) { saveTimer = 4; saveGame(); }
  }

  /* ---------- desenho: entidades ---------- */
  const treeColors = ['#244b35', '#2e5839', '#385e39', '#466b3d'];
  function drawTree(t) {
    const under = player.y < t.y + 4 && Math.hypot(player.x - t.x, player.y - t.y) < t.radius + 8;
    const sway = Math.sin(gameTime * 1.3 + t.phase) * 1.3;
    if (under) ctx.globalAlpha = .5;
    ctx.fillStyle = 'rgba(26,38,26,.4)';
    ctx.beginPath(); ctx.ellipse(t.x + 5, t.y + t.radius * .55, t.radius * .95, t.radius * .55, .2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5a4630';
    ctx.fillRect(t.x - t.radius * .13, t.y + t.radius * .1, t.radius * .26, t.radius * .62);
    ctx.fillStyle = treeColors[t.shade];
    ctx.beginPath(); ctx.arc(t.x + sway, t.y - 2, t.radius, 0, TAU); ctx.fill();
    ctx.fillStyle = treeColors[Math.min(treeColors.length - 1, t.shade + 1)];
    ctx.beginPath();
    ctx.arc(t.x + sway - t.radius * .38, t.y - t.radius * .16, t.radius * .58, 0, TAU);
    ctx.arc(t.x + sway + t.radius * .37, t.y - t.radius * .12, t.radius * .62, 0, TAU);
    ctx.arc(t.x + sway, t.y - t.radius * .56, t.radius * .54, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.12)';
    ctx.beginPath(); ctx.arc(t.x + sway + t.radius * .25, t.y + t.radius * .2, t.radius * .62, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(183,204,112,.16)';
    ctx.beginPath(); ctx.arc(t.x + sway - t.radius * .28, t.y - t.radius * .38, t.radius * .5, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(222,239,163,.3)';
    for (let i = 0; i < 4; i++) {
      const a = t.phase + i * TAU / 4;
      ctx.beginPath(); ctx.ellipse(t.x + sway + Math.cos(a) * t.radius * .52, t.y - t.radius * .3 + Math.sin(a) * t.radius * .42, t.radius * .1, t.radius * .06, a, 0, TAU); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(19,48,31,.25)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(t.x + sway, t.y - 2, t.radius, -.15, Math.PI * .95); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  function drawPillar(p) {
    ctx.fillStyle = 'rgba(20,30,22,.4)';
    ctx.beginPath(); ctx.ellipse(p.x + 6, p.y + 6, 20, 9, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#7a7966'; ctx.fillRect(p.x - 16, p.y - 6, 32, 12);
    ctx.fillStyle = '#9b9a82'; ctx.fillRect(p.x - 11, p.y - p.h, 22, p.h);
    ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.fillRect(p.x + 3, p.y - p.h, 8, p.h);
    ctx.fillStyle = '#b3b199';
    if (p.broken) {
      ctx.beginPath(); ctx.moveTo(p.x - 11, p.y - p.h); ctx.lineTo(p.x - 3, p.y - p.h - 8); ctx.lineTo(p.x + 4, p.y - p.h - 2); ctx.lineTo(p.x + 11, p.y - p.h - 6); ctx.lineTo(p.x + 11, p.y - p.h); ctx.fill();
    } else ctx.fillRect(p.x - 15, p.y - p.h - 6, 30, 7);
    ctx.fillStyle = 'rgba(94,140,70,.55)'; ctx.fillRect(p.x - 11, p.y - p.h * .35, 9, p.h * .35);
  }
  function drawHeroOld() {
    if (player.dead) return;
    const stride = Math.sin(player.walk) * .06;
    ctx.save();
    ctx.translate(player.x, player.y);
    if (player.hurt > 0 && Math.floor(gameTime * 24) % 2) ctx.globalAlpha = .55;
    else if (player.dashT > 0) ctx.globalAlpha = .75;
    ctx.fillStyle = 'rgba(20,35,27,.76)';
    ctx.beginPath(); ctx.ellipse(2, 7, 21, 14, 0, 0, TAU); ctx.fill();
    ctx.rotate(player.angle + Math.PI / 2 + stride);
    ctx.fillStyle = '#785c38';
    ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(-11, 15); ctx.lineTo(0, 11); ctx.lineTo(11, 15); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#425f69';
    ctx.beginPath(); ctx.ellipse(0, 1, 10, 13, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#b5b9a1';
    ctx.beginPath(); ctx.ellipse(0, -11, 8, 8, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#d4b76f'; ctx.fillRect(-9, -2, 18, 3);
    ctx.strokeStyle = '#d9e4dd'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(11, 0); ctx.lineTo(13, -20); ctx.stroke();
    ctx.strokeStyle = '#b78a46'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(10, -2); ctx.lineTo(13, 3); ctx.stroke();
    if (player.flash > 0) {
      ctx.globalAlpha = Math.min(1, player.flash * 3);
      ctx.fillStyle = '#fff1b2';
      ctx.beginPath(); ctx.arc(0, 0, 22, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  function drawSwing() {
    const s = player.swing;
    if (s) {
      const p = clamp(s.t / s.dur, 0, 1), ease = 1 - (1 - p) * (1 - p);
      const start = s.angle - s.dir * s.arc / 2, end = start + s.dir * s.arc * ease;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.globalCompositeOperation = 'lighter';
      for (const [w, a, col] of [[s.finisher ? 22 : 16, .22, s.finisher ? '255,210,110' : '170,230,240'], [s.finisher ? 9 : 6, .8, '255,248,220']]) {
        ctx.strokeStyle = `rgba(${col},${a * (1 - p * .6)})`;
        ctx.lineWidth = w * (1 - p * .4);
        ctx.beginPath(); ctx.arc(player.x, player.y, s.range * .72, start, end, s.dir < 0); ctx.stroke();
      }
      ctx.restore();
    }
    const sp = player.spin;
    if (sp) {
      const p = clamp(sp.t / sp.dur, 0, 1);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      ctx.strokeStyle = `rgba(142,224,255,${.9 * (1 - p)})`;
      ctx.lineWidth = 9 * (1 - p * .5);
      for (let i = 0; i < 3; i++) {
        const a = p * TAU * 2.2 + i * TAU / 3;
        ctx.beginPath(); ctx.arc(player.x, player.y, 118 * (.4 + .6 * Math.min(1, p * 2.2)), a, a + 1.25); ctx.stroke();
      }
      ctx.strokeStyle = `rgba(220,248,255,${.45 * (1 - p)})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(player.x, player.y, 130 * Math.min(1, p * 2.4), 0, TAU); ctx.stroke();
      ctx.restore();
    }
  }
  function drawEnemyOld(e) {
    const t = e.t, bob = Math.sin(gameTime * 5 + e.bob);
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.fillStyle = 'rgba(12,22,16,.42)';
    ctx.beginPath(); ctx.ellipse(0, t.r * .55, t.r * 1.05, t.r * .6, 0, 0, TAU); ctx.fill();
    if (e.state === 'windup') {
      const pulse = .35 + .35 * Math.sin(gameTime * 30);
      ctx.fillStyle = `rgba(255,80,60,${pulse * .5})`;
      ctx.beginPath(); ctx.arc(0, 0, t.r * 1.5, 0, TAU); ctx.fill();
    }
    const dirX = Math.cos(e.face) >= 0 ? 1 : -1;
    if(additionalMobs[e.type] || ['tempestade','prisma','rei_sombras'].includes(e.type)){
      const ele=enemyElement(e),r=t.r,large=t.boss;
      ctx.fillStyle=ele==='fogo'?'#42312c':ele==='gelo'?'#3f6974':ele==='raio'?'#4c6567':ele==='natureza'?'#315a41':'#36304c';
      if(['stag','snowstalker','shockhound','sandscorpion','thunderhawk'].includes(e.type)){
        ctx.beginPath();ctx.ellipse(0,0,r*.85,r*.6,0,0,TAU);ctx.fill();
        ctx.fillStyle=t.color;ctx.beginPath();ctx.ellipse(-r*.2,-r*.4,r*.6,r*.5,-.3,0,TAU);ctx.fill();
        for(const side of [-1,1]){ctx.strokeStyle=t.color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(side*r*.6,-3);ctx.lineTo(side*r*.8,r*.6);ctx.stroke();}
      }else{
        ctx.beginPath();ctx.moveTo(0,-r*1.65);ctx.lineTo(-r*.9,r*.6);ctx.lineTo(r*.9,r*.6);ctx.closePath();ctx.fill();
        ctx.fillStyle=t.color;ctx.globalAlpha=.85;ctx.beginPath();ctx.ellipse(0,-r*.4,r*.65,r*.78,0,0,TAU);ctx.fill();ctx.globalAlpha=1;
        if(['crystalguard','prismite','prisma','icegolem','lavagolem','mossbeast'].includes(e.type)){
          for(let q=0;q<5;q++){const xx=(q-2)*r*.33;ctx.fillStyle=q%2?t.color:'#e4dff9';ctx.beginPath();ctx.moveTo(xx,-r*(1.4+Math.sin(q)*.22));ctx.lineTo(xx+r*.25,-r*.45);ctx.lineTo(xx-r*.25,-r*.45);ctx.fill();}
        }
      }
      ctx.fillStyle='#fff9cb';for(const side of [-1,1]){ctx.beginPath();ctx.arc(side*r*.22,-r*.42,Math.max(1.8,r*.09),0,TAU);ctx.fill();}
      if(large){ctx.strokeStyle=t.color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-r*.3,r*1.35,gameTime,gameTime+Math.PI*1.3);ctx.stroke();}
    } else switch (e.type) {
      case 'slime': {
        const sq = 1 + bob * .08 + (e.state === 'windup' ? -.18 : 0);
        ctx.fillStyle = '#3f9d73';
        ctx.beginPath(); ctx.ellipse(0, -1, t.r * 1.12 * sq, t.r * .95 / sq, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = t.color;
        ctx.beginPath(); ctx.ellipse(0, -3, t.r * 1.0 * sq, t.r * .82 / sq, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.35)';
        ctx.beginPath(); ctx.ellipse(-t.r * .35, -t.r * .55, t.r * .3, t.r * .16, -.5, 0, TAU); ctx.fill();
        ctx.fillStyle = '#12261d';
        ctx.beginPath(); ctx.arc(-t.r * .3 + dirX * 2, -t.r * .15, 2.6, 0, TAU); ctx.arc(t.r * .3 + dirX * 2, -t.r * .15, 2.6, 0, TAU); ctx.fill();
        break;
      }
      case 'wolf': {
        ctx.rotate(e.face);
        const run = Math.sin(gameTime * 14 + e.bob) * 2;
        ctx.fillStyle = '#3d4658';
        ctx.beginPath(); ctx.ellipse(-3, 0, t.r * 1.3, t.r * .75, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = t.color;
        ctx.beginPath(); ctx.ellipse(-2, -1, t.r * 1.2, t.r * .62, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(t.r * 1.1, run * .3, t.r * .55, 0, TAU); ctx.fill();
        ctx.fillStyle = '#2d3442';
        ctx.beginPath(); ctx.moveTo(t.r * .9, -t.r * .45); ctx.lineTo(t.r * .7, -t.r * .95); ctx.lineTo(t.r * 1.2, -t.r * .55); ctx.fill();
        ctx.beginPath(); ctx.moveTo(t.r * .9, t.r * .45); ctx.lineTo(t.r * .7, t.r * .95); ctx.lineTo(t.r * 1.2, t.r * .55); ctx.fill();
        ctx.strokeStyle = '#4b5568'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-t.r * 1.2, 0); ctx.lineTo(-t.r * 1.9, run); ctx.stroke();
        ctx.fillStyle = '#ff5b4a';
        ctx.beginPath(); ctx.arc(t.r * 1.35, -3, 1.9, 0, TAU); ctx.arc(t.r * 1.35, 3, 1.9, 0, TAU); ctx.fill();
        break;
      }
      case 'skeleton': {
        const raise = e.state === 'windup' ? 1 - e.timer / (e.maxTimer || 1) : (e.state === 'recover' ? -.2 : 0);
        ctx.fillStyle = '#b8b5a2'; ctx.fillRect(-9, -14, 18, 24);
        ctx.fillStyle = '#4a4a42'; for (let i = 0; i < 3; i++) ctx.fillRect(-7, -9 + i * 6, 14, 1.6);
        ctx.fillStyle = t.color;
        ctx.beginPath(); ctx.arc(0, -20, 9, 0, TAU); ctx.fill();
        ctx.fillStyle = '#1a1a18';
        ctx.beginPath(); ctx.arc(-3, -21, 2.2, 0, TAU); ctx.arc(3, -21, 2.2, 0, TAU); ctx.fill();
        ctx.save();
        ctx.translate(dirX * 11, -6);
        ctx.rotate(dirX * (.5 - raise * 2.2));
        ctx.strokeStyle = '#8a8d94'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -28); ctx.stroke();
        ctx.strokeStyle = '#6a4a30'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 5); ctx.stroke();
        ctx.restore();
        break;
      }
      case 'boss': {
        const raise = e.state === 'windup' ? 1 - e.timer / (e.maxTimer || 1) : 0;
        const s = 1 + bob * .02 + raise * .1;
        ctx.scale(s, s);
        ctx.fillStyle = 'rgba(178,124,240,.18)';
        ctx.beginPath(); ctx.arc(0, -4, t.r * 1.5, 0, TAU); ctx.fill();
        ctx.fillStyle = '#36203f';
        ctx.beginPath(); ctx.ellipse(0, 0, t.r * 1.05, t.r * 1.15, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = t.color;
        ctx.beginPath(); ctx.ellipse(0, -3, t.r * .95, t.r * 1.0, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#2a1736';
        ctx.beginPath(); ctx.moveTo(-t.r * .55, -t.r * .85); ctx.lineTo(-t.r * .95, -t.r * 1.6); ctx.lineTo(-t.r * .15, -t.r * .95); ctx.fill();
        ctx.beginPath(); ctx.moveTo(t.r * .55, -t.r * .85); ctx.lineTo(t.r * .95, -t.r * 1.6); ctx.lineTo(t.r * .15, -t.r * .95); ctx.fill();
        ctx.fillStyle = '#ffd84a';
        ctx.beginPath(); ctx.ellipse(-t.r * .32, -t.r * .35, 5, 3.4, .3, 0, TAU); ctx.ellipse(t.r * .32, -t.r * .35, 5, 3.4, -.3, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(255,216,74,.7)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-10, t.r * .15); ctx.lineTo(10, t.r * .15); ctx.moveTo(0, t.r * .15); ctx.lineTo(0, t.r * .5); ctx.stroke();
        ctx.strokeStyle = '#4a2b5c'; ctx.lineWidth = 9; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-t.r * .9, 0); ctx.lineTo(-t.r * 1.25, t.r * .5 - raise * t.r * 1.4); ctx.moveTo(t.r * .9, 0); ctx.lineTo(t.r * 1.25, t.r * .5 - raise * t.r * 1.4); ctx.stroke();
        break;
      }
      default: { // dummy
        ctx.fillStyle = '#a9714b'; ctx.fillRect(-11, -16, 22, 27);
        ctx.fillStyle = '#d8b37a'; ctx.beginPath(); ctx.arc(0, -19, 9, 0, TAU); ctx.fill();
        ctx.fillStyle = '#614431'; ctx.fillRect(-10, -26, 20, 5);
        ctx.fillStyle = '#e8c45d'; ctx.fillRect(-14, -4, 28, 4);
        ctx.fillStyle = '#e66562';
        ctx.beginPath(); ctx.arc(0, -5, 3.5, 0, TAU); ctx.fill();
      }
    }
    if (e.hit > 0) {
      ctx.globalAlpha = Math.min(1, e.hit * 5);
      ctx.fillStyle = '#fff5cb';
      ctx.beginPath(); ctx.arc(0, -4, t.r * 1.25, 0, TAU); ctx.fill();
    }
    ctx.restore();
    if (e.hp < e.maxHp && !t.boss && e.hp > 0) {
      const w = 34, x = e.x - w / 2, y = e.y - t.r - 26;
      ctx.fillStyle = 'rgba(10,18,14,.75)'; ctx.fillRect(x - 1, y - 1, w + 2, 6);
      ctx.fillStyle = '#e66562'; ctx.fillRect(x, y, w * e.hp / e.maxHp, 4);
    }
  }
  function drawTelegraph(e) {
    if (e.dead || e.state !== 'windup' || e.t.ranged) return;
    const t = e.t, p = clamp(1 - e.timer / (e.maxTimer || 1), 0, 1);
    ctx.save();
    if (t.lunge) {
      const dist = e.charge ? 290 : t.lunge * .22 + t.reach * .6, w = e.charge ? 36 : 24;
      ctx.translate(e.x, e.y); ctx.rotate(e.face);
      ctx.fillStyle = `rgba(255,70,50,${.12 + p * .22})`;
      ctx.fillRect(0, -w / 2, dist, w);
      ctx.fillStyle = `rgba(255,90,60,${.2 + p * .3})`;
      ctx.fillRect(0, -w / 2, dist * p, w);
    } else {
      const a = aoeOf(e);
      ctx.fillStyle = `rgba(255,70,50,${.1 + p * .14})`;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(255,90,60,${.2 + p * .25})`;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r * p, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,120,90,.7)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }
  function drawLoot(l) {
    const bob = Math.sin(gameTime * 5 + l.bob) * 2;
    ctx.fillStyle = 'rgba(15,25,18,.35)';
    ctx.beginPath(); ctx.ellipse(l.x, l.y + 6, 6, 3, 0, 0, TAU); ctx.fill();
    if (l.type === 'coin') {
      const sx = Math.abs(Math.cos(gameTime * 4 + l.bob));
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255,215,127,.2)'; ctx.beginPath(); ctx.arc(l.x, l.y + bob - 2, 11, 0, TAU); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#d9a63b'; ctx.beginPath(); ctx.ellipse(l.x, l.y + bob - 2, 5.5 * Math.max(.25, sx), 5.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffe28a'; ctx.beginPath(); ctx.ellipse(l.x, l.y + bob - 2, 3.2 * Math.max(.2, sx), 3.4, 0, 0, TAU); ctx.fill();
    } else if (l.type === 'xp') {
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle='#6badff55';ctx.beginPath();ctx.arc(l.x,l.y+bob-4,12,0,TAU);ctx.fill();ctx.restore();
      ctx.fillStyle='#91dcff';ctx.beginPath();ctx.moveTo(l.x,l.y+bob-14);ctx.lineTo(l.x+7,l.y+bob-4);ctx.lineTo(l.x,l.y+bob+7);ctx.lineTo(l.x-7,l.y+bob-4);ctx.closePath();ctx.fill();
      ctx.fillStyle='#e3ffff';ctx.beginPath();ctx.moveTo(l.x,l.y+bob-12);ctx.lineTo(l.x+3,l.y+bob-4);ctx.lineTo(l.x,l.y+bob+4);ctx.closePath();ctx.fill();
    } else if(l.type==='legendary'){
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle='#ffd27a44';ctx.beginPath();ctx.arc(l.x,l.y+bob-5,20,0,TAU);ctx.fill();ctx.restore();
      ctx.save();ctx.translate(l.x,l.y+bob-4);ctx.rotate(-.52);ctx.strokeStyle='#5b351e';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,10);ctx.lineTo(0,-9);ctx.stroke();ctx.strokeStyle='#e8bd5b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,8);ctx.lineTo(0,-7);ctx.stroke();ctx.fillStyle='#fff0b0';ctx.strokeStyle='#775524';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-3,-7);ctx.lineTo(-5,-14);ctx.lineTo(0,-22);ctx.lineTo(5,-14);ctx.lineTo(3,-7);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle='#f8dc8c';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-8,-4);ctx.lineTo(8,-4);ctx.stroke();ctx.restore();
    } else {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255,120,110,.22)'; ctx.beginPath(); ctx.arc(l.x, l.y + bob - 4, 13, 0, TAU); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#d9d6c3'; ctx.fillRect(l.x - 2.5, l.y + bob - 12, 5, 5);
      ctx.fillStyle = '#d4504a'; ctx.beginPath(); ctx.arc(l.x, l.y + bob - 3, 6.5, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.arc(l.x - 2, l.y + bob - 5, 2, 0, TAU); ctx.fill();
    }
  }
  function drawShrine() {
    const x = SHRINE.x, y = 800;
    ctx.save();
    // zona segura pulsante
    const inside = inSafeZone(player.x, player.y);
    const pulse = .5 + .5 * Math.sin(gameTime * 2);
    ctx.strokeStyle = `rgba(159,232,181,${(inside ? .45 : .2) + pulse * .12})`;
    ctx.lineWidth = 3; ctx.setLineDash([14, 12]);
    ctx.beginPath(); ctx.ellipse(SHRINE.x, SHRINE.y + 20, SAFE_RADIUS, SAFE_RADIUS * .72, 0, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#283a2d';
    ctx.beginPath(); ctx.ellipse(x, y + 73, 194, 45, 0, 0, TAU); ctx.fill();
    if (heroImage.complete && heroImage.naturalWidth) {
      ctx.globalAlpha = .92;
      ctx.drawImage(heroImage, x - 170, y - 4, 340, 133);
    } else {
      ctx.fillStyle = '#889077';
      ctx.fillRect(x - 122, y - 40, 244, 114);
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#b9aa72'; ctx.lineWidth = 5;
    ctx.strokeRect(x - 174, y - 8, 348, 141);
    ctx.restore();
  }
  function drawBossArena() {
    if (quest.stage < 3 && !enemies.some(e => e.type === 'boss' && !e.dead)) return;
    const pulse = .5 + .5 * Math.sin(gameTime * 1.6);
    ctx.save();
    ctx.strokeStyle = `rgba(178,124,240,${.28 + pulse * .2})`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(BOSS_HOME.x, BOSS_HOME.y, 190, 140, 0, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(BOSS_HOME.x, BOSS_HOME.y, 130, 95, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  }

  /* ---------- desenho: minimapa ---------- */
  function drawMap(target) {
    const w = mini.width, h = mini.height;
    const span = dun ? world.width : CHUNK_SIZE * 5;
    const mx = x => w / 2 + (x - player.x) / span * w, my = y => h / 2 + (y - player.y) / span * h;
    miniCtx.fillStyle = dun ? '#1a1620' : '#304b39'; miniCtx.fillRect(0, 0, w, h);
    if (!dun) {
      miniCtx.drawImage(miniBase, mx(0), my(0), world.width / span * w, world.height / span * h);
      for (const chunk of worldChunks.values()) miniCtx.drawImage(chunk.tile, mx(chunk.x), my(chunk.y), CHUNK_SIZE / span * w, CHUNK_SIZE / span * h);
    }
    if (!dun) for (const npc of [...homeNpcs, ...Array.from(worldChunks.values()).flatMap(c=>c.npcs)]) {
      miniCtx.fillStyle='#a5f5c2';miniCtx.beginPath();miniCtx.arc(mx(npc.x),my(npc.y),3.4,0,TAU);miniCtx.fill();
    }
    for (const l of loot) { miniCtx.fillStyle = l.type === 'coin' ? '#ffd77f' : l.type === 'xp' ? '#91dcff' : '#ff8a7a'; miniCtx.fillRect(mx(l.x) - 1.5, my(l.y) - 1.5, 3, 3); }
    for (const e of enemies) {
      if (e.dead) continue;
      miniCtx.fillStyle = e.type === 'boss' ? '#b27cf0' : (e.type === 'dummy' ? '#e8c45d' : '#ef7168');
      miniCtx.beginPath(); miniCtx.arc(mx(e.x), my(e.y), e.type === 'boss' ? 7 : 4, 0, TAU); miniCtx.fill();
    }
    mapExt(mx, my);
    if (target) {
      const p = .5 + .5 * Math.sin(gameTime * 5);
      miniCtx.strokeStyle = `rgba(244,207,121,${.5 + p * .5})`; miniCtx.lineWidth = 2.5;
      miniCtx.beginPath(); miniCtx.arc(mx(target.x), my(target.y), 8 + p * 5, 0, TAU); miniCtx.stroke();
    }
    miniCtx.save();
    miniCtx.translate(mx(player.x), my(player.y)); miniCtx.rotate(player.angle + Math.PI / 2);
    miniCtx.fillStyle = '#e9f5c8';
    miniCtx.beginPath(); miniCtx.moveTo(0, -8); miniCtx.lineTo(6, 6); miniCtx.lineTo(0, 3); miniCtx.lineTo(-6, 6); miniCtx.closePath(); miniCtx.fill();
    miniCtx.restore();
    miniCtx.strokeStyle = 'rgba(242,232,199,.47)'; miniCtx.lineWidth = 2;
    miniCtx.strokeRect(mx(camera.x), my(camera.y), camera.width / camera.scale / span * w, camera.height / camera.scale / span * h);
  }

  /* ---------- desenho: cena ---------- */
  function draw() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, camera.width, camera.height);
    const viewW = camera.width / camera.scale, viewH = camera.height / camera.scale;
    const sxo = (Math.random() - .5) * camera.shake * 2, syo = (Math.random() - .5) * camera.shake * 2;
    const sx = camera.x + sxo, sy = camera.y + syo;
    const dark = dun ? .55 : 1 - daylight();
    const vis = (x, y, m = 70) => x > sx - m && x < sx + viewW + m && y > sy - m && y < sy + viewH + m;

    ctx.save();
    ctx.scale(camera.scale, camera.scale);
    ctx.translate(-sx, -sy);

    if (dun) drawDungeonBg(); else {
    // chão original apenas como base dos monumentos e rios do mapa inicial
    // chão pré-renderizado
    const x0 = Math.max(0, Math.floor(sx)), y0 = Math.max(0, Math.floor(sy));
    const x1 = Math.min(world.width, Math.ceil(sx + viewW)), y1 = Math.min(world.height, Math.ceil(sy + viewH));
    if (x1 > x0 && y1 > y0) ctx.drawImage(ground, x0 * GS, y0 * GS, (x1 - x0) * GS, (y1 - y0) * GS, x0, y0, x1 - x0, y1 - y0);
    drawWorldChunks(sx, sy, viewW, viewH);
    // Clareira inicial preservada, sem a camada de terreno procedural.
    if(x1>x0&&y1>y0){ctx.save();ctx.beginPath();ctx.arc(SPAWN.x,SPAWN.y,640,0,TAU);ctx.clip();ctx.drawImage(ground,x0*GS,y0*GS,(x1-x0)*GS,(y1-y0)*GS,x0,y0,x1-x0,y1-y0);ctx.restore();}

    // brilho da água
    ctx.strokeStyle = 'rgba(200,255,248,.28)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let y = Math.max(0, Math.floor(sy / 46) * 46); y < Math.min(world.height, sy + viewH + 46); y += 46) {
      const off = Math.sin(gameTime * .9 + y * .05) * 46, rx = riverX(y) + off;
      const len = 14 + Math.sin(gameTime * 1.4 + y) * 6;
      ctx.beginPath(); ctx.moveTo(rx - len, y); ctx.lineTo(rx + len, y + 2); ctx.stroke();
    }

    drawBossArena();
    drawShrine();
    }
    for (const l of loot) if (vis(l.x, l.y, 24)) drawLoot(l);
    for (const e of enemies) if (!e.dead && e.state === 'windup' && vis(e.x, e.y, 600)) drawTelegraph(e);

    drawList.length = 0;
    for(const t of trees)if(!dun&&vis(t.x,t.y)){
      const oldZone=Math.hypot(t.x-SPAWN.x,t.y-SPAWN.y)<640;
      drawList.push({y:t.y+t.radius*.45,k:oldZone?0:5,o:oldZone?t:{...t,biome:biomeAt(t.x,t.y)}});
    }
    if (!dun) for (const chunk of worldChunks.values()) {
      for (const t of chunk.trees) if (vis(t.x,t.y)) drawList.push({y:t.y+t.radius*.45,k:5,o:t});
      for (const f of chunk.features) if(vis(f.x,f.y))drawList.push({y:f.y+f.size*.5,k:6,o:f});
    }
    for (const p of (dun ? dun.pillars : pillars)) if (vis(p.x, p.y)) drawList.push({ y: p.y + 8, k: 1, o: p });
    for (const e of enemies) if (!e.dead && vis(e.x, e.y)) drawList.push({ y: e.y, k: 2, o: e });
    if (!dun) {
      for (const npc of homeNpcs) if(!npc.companion&&vis(npc.x,npc.y)) drawList.push({y:npc.y,k:4,o:npc});
      for (const chunk of worldChunks.values()) for (const npc of chunk.npcs) if (!npc.companion&&vis(npc.x,npc.y)) drawList.push({y:npc.y,k:4,o:npc});
    }
    for (const companion of companions) if (vis(companion.x, companion.y)) drawList.push({y:companion.y,k:4,o:companion});
    drawList.push({ y: player.y, k: 3, o: player });
    drawList.sort((a, b) => a.y - b.y);
    for (const d of drawList) {
      if (d.k === 0) drawTree(d.o);
      else if (d.k === 1) drawPillar(d.o);
      else if (d.k === 5) drawBiomeTree(d.o);
      else if (d.k === 6) drawBiomeFeature(d.o);
      else if (d.k === 2) drawEnemy(d.o);
      else if (d.k === 4) drawNpc(d.o);
      else { drawHero(); drawSwing(); }
    }

    drawExt();
    drawConversations();
    // luz de lanterna
    if (dark > .15 && !player.dead) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(player.x, player.y, 10, player.x, player.y, 190);
      g.addColorStop(0, `rgba(255,210,120,${.28 * dark})`); g.addColorStop(1, 'rgba(255,210,120,0)');
      ctx.fillStyle = g; ctx.fillRect(player.x - 190, player.y - 190, 380, 380);
      ctx.restore();
    }

    // partículas
    for (const p of particles) {
      const a = clamp(p.life / p.max * 1.5, 0, 1);
      const r = p.size * (p.shrink ? p.life / p.max : 1);
      if (r < .2) continue;
      ctx.globalAlpha = a;
      ctx.globalCompositeOperation = p.glow ? 'lighter' : 'source-over';
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';

    // números de dano
    ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    for (const f of floaters) {
      ctx.globalAlpha = clamp(f.life / f.max * 1.6, 0, 1);
      ctx.font = `800 ${f.size}px Rajdhani, Inter, sans-serif`;
      ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(10,18,14,.85)';
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    drawScreenFx(sx, sy, dark);
    drawOverlayExt();
  }

  const target = { cur: null };
  function drawScreenFx(sx, sy, dark) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = camera.width, h = camera.height, s = camera.scale;
    const px = (player.x - sx) * s, py = (player.y - sy) * s;

    // noite / entardecer
    if (dark > .02) {
      const g = ctx.createRadialGradient(px, py, 80 * s, px, py, 400 * s);
      g.addColorStop(0, 'rgba(8,14,40,0)');
      g.addColorStop(1, `rgba(8,14,40,${dark * .74})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    const dusk = dun ? 0 : clamp(1 - Math.abs(sunValue()) * 3.2, 0, 1);
    if (dusk > .02) { ctx.fillStyle = `rgba(255,130,60,${dusk * .12})`; ctx.fillRect(0, 0, w, h); }

    // dano / vida baixa
    const low = player.hp / maxHpOf() < .3 && !player.dead ? (.5 + .5 * Math.sin(gameTime * 6)) * .35 : 0;
    const hurtA = Math.max(player.hurt * 1.4, low);
    if (hurtA > .01) {
      const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .25, w / 2, h / 2, Math.max(w, h) * .75);
      g.addColorStop(0, 'rgba(200,30,30,0)'); g.addColorStop(1, `rgba(200,30,30,${clamp(hurtA, 0, .6)})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }

    // seta do objetivo fora da tela
    const t = target.cur;
    if (t && !player.dead) {
      const tx = (t.x - sx) * s, ty = (t.y - sy) * s, pad = 54;
      if (tx < pad || tx > w - pad || ty < pad || ty > h - pad) {
        const cx = w / 2, cy = h / 2, a = Math.atan2(ty - cy, tx - cx);
        const k = Math.min((w / 2 - pad) / Math.max(.001, Math.abs(Math.cos(a))), (h / 2 - pad) / Math.max(.001, Math.abs(Math.sin(a))));
        const ax = cx + Math.cos(a) * k, ay = cy + Math.sin(a) * k;
        ctx.save();
        ctx.translate(ax, ay); ctx.rotate(a);
        ctx.fillStyle = 'rgba(244,207,121,.95)'; ctx.strokeStyle = 'rgba(10,18,14,.8)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-9, -10); ctx.lineTo(-4, 0); ctx.lineTo(-9, 10); ctx.closePath(); ctx.stroke(); ctx.fill();
        ctx.restore();
      }
    }

    if (player.dead) {
      ctx.fillStyle = `rgba(10,5,8,${clamp(player.deadT / 1.2, 0, .78)})`;
      ctx.fillRect(0, 0, w, h);
    }
    if (paused) {
      ctx.fillStyle = 'rgba(8,16,12,.62)'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f4cf79'; ctx.textAlign = 'center';
      ctx.font = '800 34px Rajdhani, Inter, sans-serif'; ctx.fillText('PAUSADO', w / 2, h / 2 - 4);
      ctx.fillStyle = '#d6e4d5'; ctx.font = '600 13px Inter, sans-serif';
      ctx.fillText('Pressione P ou clique para continuar', w / 2, h / 2 + 22);
    }
  }

  /* ---------- HUD ---------- */
  function updateHud(sx, sy) {
    const maxHp = maxHpOf(), maxF = maxFocusOf(), maxSt = maxStaminaOf(), need = xpNeed(player.level);
    setWidth('hp', el.healthFill, player.hp / maxHp * 100);
    setWidth('fo', el.manaFill, player.focus / maxF * 100);
    setWidth('st', el.staminaFill, player.stamina / maxSt * 100);
    setWidth('xp', el.xpFill, player.xp / need * 100);
    setText('hpT', el.healthText, `${Math.ceil(player.hp)} / ${maxHp}`);
    setText('foT', el.manaText, `${Math.floor(player.focus)} / ${maxF}`);
    setText('stT', el.staminaText, `${Math.floor(player.stamina)} / ${maxSt}`);
    setText('xpT', el.xpText, `${Math.floor(player.xp)} / ${need}`);
    setText('potT', el.potionText, player.potions);
    setText('potB', el.potionBadge, player.potions);
    setText('lv', el.level, rankOf());
    setText('lv2', el.statusLevel, rankOf());
    setText('coins', el.coins, player.coins);
    setText('kills', el.kills, player.kills);
    setText('wave', el.wave, wave);
    const waveCountdown=$('#nextWave');if(waveCountdown)waveCountdown.textContent=Math.max(0,Math.ceil(38-waveTimer))+'s';
    const icons = [['🔥',player.burn],['☠',player.poison],['❄',player.chill],['⚡',player.shock],['✦',player.curse]].filter(x=>x[1]>0).map(x=>x[0]).join(' ');
    const statusEl=$('#statusEffects'); if (statusEl) statusEl.textContent=icons ? 'EFEITOS: '+icons : `PODERES: ${Object.values(player.relics).reduce((a,b)=>a+b,0)} · ONDA +${Math.round((Math.pow(1 + (wave-1)*.17,1.10)-1)*100)}%`;
    const near = nearestNpc(); const ib = $('#interactButton'); if (ib) {ib.hidden=!near;ib.title=near?`Falar com ${NPC_ROLES[near.role].name}`:'';}
    setText('location', el.locationName, worldRegionName(player.x, player.y));
    const mm = Math.floor(clockMinutes());
    setText('clock', el.clock, `${pad2(Math.floor(mm / 60))}:${pad2(mm % 60)}`);

    const t=campaignTarget();target.cur=t;
    const total=DUNS.length, done=DUNS.filter(d=>cleared[d.id]).length;
    const dist=t?Math.hypot(player.x-t.x,player.y-t.y):0;
    const targetTitle=dun?(dun.boss?'Derrote o guardião do bioma':'Explore até o guardião'):(t?t.name:'TODAS CONCLUÍDAS!');
    setText('obj',el.objective,`${done}/${total} MASMORRAS · ${targetTitle}`);
    setText('dist',el.distance,t?`${Math.round(dist/30)} m`:'✓');
    const progress=$('#campaignCount');if(progress)progress.textContent=`${done}/${total}`;

    el.skillButton.classList.toggle('cooling', player.skillCd > 0 || player.focus < CLASSES[cust.cls].cost);
    el.dodgeButton.classList.toggle('cooling', player.dashCd > 0 || player.stamina < 30);
    el.healButton.classList.toggle('cooling', player.potions <= 0);
    el.ultimateButton.hidden = !cust.ultimate;
    el.ultimateButton.classList.toggle('cooling', player.ultimateCd > 0);
    el.ultimateButton.setAttribute('aria-label', cust.ultimate ? `Usar ultimate: ${ULTIMATES[cust.ultimate].name}` : 'Ultimate bloqueada até o nível 5');

    // alvo
    const boss = enemies.find(e => e.t.boss && !e.dead && (e.finalBoss || e.state !== 'idle'));
    const tg = boss || (targetEnemy && !targetEnemy.dead ? targetEnemy : null);
    if (tg) {
      setText('en', el.enemyName, tg.t.name);
      setWidth('eh', el.enemyHealth, tg.hp / tg.maxHp * 100);
      const screenX = (tg.x - sx) * camera.scale, screenY = (tg.y - sy) * camera.scale;
      el.enemyLabel.style.left = `${screenX}px`;
      el.enemyLabel.style.top = `${screenY - (tg.t.r + 26) * camera.scale}px`;
      el.enemyLabel.classList.toggle('visible', screenX > -80 && screenX < camera.width + 80 && screenY > 0 && screenY < camera.height + 70);
    } else el.enemyLabel.classList.remove('visible');
  }

  /* ---------- laço principal ---------- */
  let hudTimer = 0, mapTimer = 0;
  function tick(now) {
    const dt = Math.min((now - lastFrame) / 1000, .04);
    lastFrame = now;
    visualTime += dt;
    update(dt);
    draw();
    hudTimer += dt;
    mapTimer += dt;
    if (hudTimer >= .1) { hudTimer %= .1; updateHud(camera.x, camera.y); }
    if (mapTimer >= 1 / 12) { mapTimer %= 1 / 12; drawMap(target.cur); }
    requestAnimationFrame(tick);
  }

  /* ============================================================
     EXPANSÃO 2.0 — masmorras, novos inimigos e chefes, personalização
     ============================================================ */
  const EXP_KEY = 'abismo-open-world-v2';
  const cust = { name: 'Aventureiro', armor: '#425f69', cape: '#8c3a3a', hair: '#3b2a20', skin: '#d9b99b', eye: '#3a2a1c', glow: '#9fe8ff', style: 1, race: 'humano', cls: 'guerreiro', armorType: 'cota', weapon: 'espada', element: 'fogo', hairStyle: 'curto', beard: 'nenhuma', trim: '#c7a65c', emblem: 'sol', capeStyle: 'longa', scars: 'nenhuma', body: 'medio', boons: [] };
  const cleared = {};
  try { const s = JSON.parse(localStorage.getItem(EXP_KEY) || 'null'); if (s) { Object.assign(cust, s.cust); Object.assign(cleared, s.cleared); } } catch (e) { /* sem storage */ }
  const saveExp = () => { try { localStorage.setItem(EXP_KEY, JSON.stringify({ cust, cleared })); } catch (e) { /* sem storage */ } };
  $('#heroName').textContent = cust.name;
  const shade = (hex, amt) => { const n = parseInt(hex.slice(1), 16), f = v => clamp(v + amt, 0, 255); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
  const sfx2 = (a, b, d, type, v) => { if (!muted) try { tone(a, b, d, type, v); noise(d * .6, v * .6, 900); } catch (e) { /* sem áudio */ } };

  /* ---------- novos inimigos e chefes ---------- */
  Object.assign(TYPES, {
    bat: { name: 'MORCEGO SOMBRIO', hp: 30, r: 11, speed: 185, dmg: 7, reach: 30, trigger: 90, windup: .3, recover: .6, lunge: 400, aggro: 380, xp: 16, coin: [2, 6], hostile: true, color: '#8a6bb5' },
    mage: { name: 'FEITICEIRO ASTRAL', hp: 58, r: 15, speed: 72, dmg: 13, reach: 0, trigger: 270, windup: .7, recover: 1.3, lunge: 0, ranged: true, aggro: 440, xp: 44, coin: [10, 20], hostile: true, color: '#7aa7ff' },
    brute: { name: 'BRUTAMONTES', hp: 190, r: 22, speed: 72, dmg: 26, reach: 80, trigger: 70, windup: .9, recover: 1.1, lunge: 0, aggro: 340, xp: 70, coin: [16, 30], hostile: true, color: '#a0603c' },
    lorde: { name: 'LORDE OSSÁRIO', hp: 900, r: 30, speed: 96, dmg: 24, reach: 120, trigger: 110, windup: .9, recover: 1, lunge: 520, aggro: 900, xp: 500, coin: [150, 150], hostile: true, boss: true, color: '#d8d2b0' },
    matriarca: { name: 'MATRIARCA VENENOSA', hp: 1100, r: 34, speed: 85, dmg: 26, reach: 140, trigger: 100, windup: 1, recover: 1.1, lunge: 0, nova: true, aggro: 900, xp: 650, coin: [200, 200], hostile: true, boss: true, color: '#58c27a' },
    arquimago: { name: 'ARQUIMAGO ASTRAL', hp: 1000, r: 28, speed: 80, dmg: 20, reach: 0, trigger: 300, windup: .8, recover: 1.1, lunge: 0, ranged: true, nova: true, aggro: 900, xp: 800, coin: [250, 250], hostile: true, boss: true, color: '#8fb8ff' },
    titan: { name: 'TITÃ DA FORJA', hp: 1800, r: 42, speed: 88, dmg: 34, reach: 160, trigger: 120, windup: 1.1, recover: 1.1, lunge: 0, nova: true, aggro: 900, xp: 1200, coin: [400, 400], hostile: true, boss: true, color: '#ff8a4a' },
    yeti_giant: { name: 'YETI COLOSSAL', hp: 2600, r: 58, speed: 64, dmg: 44, reach: 164, trigger: 138, windup: 1.05, recover: 1.15, lunge: 460, nova: true, aggro: 940, xp: 1800, coin: [420, 480], hostile: true, boss: true, element: 'gelo', color: '#d8eef5', pal: ['#e3f5fb', '#718b9b', '#d1eaff', '#8bfcff'] },
    ice_titan: { name: 'TITÃ GLACIAL', hp: 3400, r: 66, speed: 58, dmg: 52, reach: 184, trigger: 154, windup: 1.2, recover: 1.3, lunge: 420, nova: true, aggro: 980, xp: 2400, coin: [520, 620], hostile: true, boss: true, element: 'gelo', color: '#a8e5f2', pal: ['#c8f2f5', '#4f899b', '#a6efff', '#e7ffff'], artId: 'yeti_giant' },
    cyclops: { name: 'CICLOPE, O DE UM OLHO', hp: 3200, r: 62, speed: 70, dmg: 50, reach: 188, trigger: 160, windup: 1.2, recover: 1.3, lunge: 560, nova: true, aggro: 960, xp: 2100, coin: [480, 560], hostile: true, boss: true, element: 'arcano', color: '#a9a96c', pal: ['#8e9b69', '#3c4938', '#c6b47d', '#ffd867'] }
  });
  const BIOME_MOBS = {
    forest:['wolf','spider','slime','stag','thornling','dryad','mossbeast','direboar'],
    frost:['wraith','icegolem','frostling','snowstalker','mage','wolf','yeti_giant','ice_titan'],
    dunes:['harpy','sandscorpion','scarab','duneraider','brute','mimic','hyena','cyclops'],
    marsh:['spider','slime','boglurker','plagueshroom','shaman','mossbeast','mirewitch'],
    ash:['skeleton','wraith','nightstalker','graveknight','guardian','bat','bonearcher'],
    volcano:['cultist','brute','emberling','lavagolem','pyromancer','guardian','flamewisp'],
    storm:['thunderhawk','stormwisp','shockhound','guardian','mage','harpy'],
    crystal:['prismite','crystalguard','shardmage','guardian','mage','mimic','crystalspider','ironbeetle'],
    arcane:['mage','astraleye','voidwalker','shardmage','guardian','wraith','mirewitch']
  };
  const PLAYABLE_BIOME = { meadow: 'forest', jungle: 'forest', canyon: 'dunes', mountain: 'frost', coast: 'marsh', abyss: 'ash' };
  for (const [id, source] of Object.entries(window.ABISMO_PARTIAL_CATALOG || {})) {
    if (source.boss || id === 'dummy') continue;
    const biome = PLAYABLE_BIOME[source.biome] || source.biome;
    const pool = BIOME_MOBS[biome] || (BIOME_MOBS[biome] = []);
    if (!pool.includes(id)) pool.push(id);
  }
  const additionalMobs = {
    stag:['CERVO CORROMPIDO',85,136,14,'natureza','flank'],
    thornling:['ESPINHO ANDANTE',72,100,13,'natureza','guard'],
    dryad:['DRÍADE SOMBRIA',108,90,17,'natureza','support'],
    mossbeast:['GOLEM DE MUSGO',225,63,26,'natureza','guard'],
    icegolem:['GOLEM DE GELO',245,67,27,'gelo','guard'],
    frostling:['DUENDE DE GEADA',48,145,10,'gelo','flank'],
    snowstalker:['PREDADOR ALBINO',118,155,20,'gelo','stalker'],
    sandscorpion:['ESCORPIÃO DAS DUNAS',110,132,18,'fogo','flank'],
    scarab:['ESCARAVELHO DE OURO',58,158,13,'fogo','stalker'],
    duneraider:['SAQUEADOR DO DESERTO',155,102,19,'fogo','kite'],
    boglurker:['DEVORADOR DO BREJO',175,82,22,'natureza','stalker'],
    plagueshroom:['COGUMELO TÓXICO',75,62,15,'natureza','support'],
    nightstalker:['CAÇADOR NOTURNO',98,153,18,'arcano','stalker'],
    graveknight:['CAVALEIRO FUNERAL',260,84,25,'arcano','guard'],
    emberling:['ELEMENTAL DE BRASA',64,148,13,'fogo','flank'],
    lavagolem:['GOLEM MAGMÁTICO',300,69,29,'fogo','guard'],
    pyromancer:['PIROMANTE EXILADO',94,91,16,'fogo','kite'],
    thunderhawk:['FALCÃO ELÉTRICO',86,179,17,'raio','flank'],
    stormwisp:['FÓTON DA TEMPESTADE',59,132,13,'raio','kite'],
    shockhound:['CÃO DO TROVÃO',119,149,19,'raio','stalker'],
    prismite:['PRISMÁTICO VIVO',86,126,15,'arcano','flank'],
    crystalguard:['SENTINELA CRISTALINA',285,67,27,'arcano','guard'],
    shardmage:['MAGISTA DOS FRAGMENTOS',104,87,16,'arcano','kite'],
    astraleye:['OLHO DO VAZIO',98,117,20,'arcano','kite'],
    voidwalker:['CAMINHANTE DO VAZIO',150,117,20,'arcano','stalker'],
    hyena:['HIENA DA FOME',92,164,17,'fogo','stalker'],
    direboar:['JAVALI DE PRESAS NEGRAS',146,112,22,'natureza','flank'],
    crystalspider:['ARANHA PRISMATICA',126,138,20,'arcano','flank'],
    bonearcher:['ARQUEIRO OSSUDO',92,96,18,'arcano','kite'],
    flamewisp:['FANTASMA DE BRASA',78,128,16,'fogo','kite'],
    mirewitch:['BRUXA DO BREJO',132,76,15,'natureza','support'],
    ironbeetle:['BESOURO DE FERRO',188,92,24,'raio','guard']
  };
  Object.assign(SPEECH,{
    stag:['A mata está acordando!','Nenhum caçador passará!'],thornling:['Raízes!','A floresta nos protege!'],dryad:['O bosque é eterno!'],mossbeast:['GROOOOM!'],
    icegolem:['SILÊNCIO GELADO!'],frostling:['Congele, forasteiro!'],snowstalker:['Sinto seu calor!'],
    sandscorpion:['Tsssss!'],scarab:['O ouro é meu!'],duneraider:['Solte suas moedas!'],
    boglurker:['Venha afundar comigo!'],plagueshroom:['Esporos para todos!'],
    nightstalker:['A sombra chegou!'],graveknight:['Seu nome será esquecido!'],
    emberling:['Arda! Arda!'],lavagolem:['CORAÇÃO DE MAGMA!'],pyromancer:['Cinzas ao vento!'],
    thunderhawk:['O céu é minha caça!'],stormwisp:['⚡ CHOQUE!'],shockhound:['Grr... faíscas!'],
    prismite:['Mil reflexos!'],crystalguard:['NÃO QUEBRE O SELO.'],shardmage:['Fragmentos cortantes!'],
    astraleye:['Eu vejo o impossível.'],voidwalker:['O vazio chama...'],
    tempestade:['O TROVÃO TE JULGARÁ!','CURVE-SE À TEMPESTADE!'],prisma:['DEZ MIL REFLEXOS DE PODER!'],rei_sombras:['O ABISMO É MEU TRONO!'],
    yeti_giant:['MEU INVERNO NÃO TERMINA!','SINTA A FÚRIA DA GEADA!'],cyclops:['O ERMO VAI TE ESMAGAR!','UM OLHO. NENHUMA MISERICÓRDIA.']
  });
  for(const [id,[name,hp,speed,dmg,element,ai]] of Object.entries(additionalMobs)) {
    const ranged=['kite','support'].includes(ai);
    const colors={fogo:'#f67c49',gelo:'#a7e9fc',natureza:'#83d486',raio:'#f8dd70',arcano:'#bb9af2'};
    TYPES[id]={name,hp,r:Math.min(29,12+hp/21),speed,dmg,reach:ranged?0:55,trigger:ranged?255:90,windup:.5,recover:ranged?1.35:.86,lunge:ranged?0:(ai==='flank'?330:180),aggro:530,xp:Math.round(hp*.36),coin:[6,20],hostile:true,ai,ranged,element,color:colors[element]};
  }
  Object.assign(TYPES,{
    tempestade:{name:'RAIJIN, SENHOR DA TEMPESTADE',hp:1900,r:36,speed:112,dmg:30,reach:0,trigger:290,windup:.6,recover:.85,aggro:900,ranged:true,nova:true,xp:1500,coin:[400,450],hostile:true,boss:true,element:'raio',color:'#ffe371'},
    prisma:{name:'IMPERATRIZ DOS CRISTAIS',hp:2300,r:36,speed:94,dmg:33,reach:0,trigger:330,windup:.7,recover:1,aggro:900,ranged:true,nova:true,xp:1700,coin:[430,480],hostile:true,boss:true,element:'arcano',color:'#c2b7ff'},
    rei_sombras:{name:'REI DAS SOMBRAS',hp:2200,r:35,speed:135,dmg:37,reach:143,trigger:155,windup:.8,recover:.95,lunge:600,aggro:900,xp:1650,coin:[450,500],hostile:true,boss:true,element:'arcano',color:'#a287cb'}
  });
  const importedEnemies = window.ABISMO_PARTIAL_CATALOG || {};
  for (const [id, source] of Object.entries(importedEnemies)) {
    if (id === 'dummy' || TYPES[id]) continue;
    const boss = !!source.boss || source.arch === 'boss';
    const attacks = (source.phases || []).flatMap(phase => phase.atk || []);
    const ranged = ['kite', 'support', 'artillery', 'ranged'].includes(source.ai) || attacks.some(a => ['beam', 'rain', 'nova', 'meteor', 'chain'].includes(a));
    const hp = Math.max(30, Number(source.hp) || (boss ? 1000 : 80));
    const radius = Math.max(boss ? 28 : 11, Math.min(boss ? 58 : 28, Number(source.r) || 16));
    const baseColor = source.pal?.[0] || '#9b8db8';
    TYPES[id] = {
      name: String(source.name || id).toLocaleUpperCase('pt-BR'), hp, r: radius,
      speed: Number(source.speed) || (boss ? 90 : 90), dmg: Number(source.dmg) || (boss ? 24 : 12),
      reach: ranged ? 0 : radius * 3.2, trigger: ranged ? 280 : radius * 4.5,
      windup: boss ? .82 : .52, recover: ranged ? 1.22 : .86,
      lunge: ['charger', 'charge', 'flank'].includes(source.ai) ? 360 : 0,
      aggro: Number(source.aggro) || (boss ? 900 : 460), xp: boss ? 600 : Math.max(18, Math.round(hp * .36)),
      coin: boss ? [180, 240] : [6, 22], hostile: true, boss, ranged,
      nova: attacks.includes('nova') || attacks.includes('rain'), element: source.el || null,
      color: baseColor, arch: source.arch, artId: id, sourcePhases: source.phases || null
    };
  }
  if (TYPES.boss) TYPES.boss.artId = 'guardian';
  if (TYPES.guardian) TYPES.guardian.artId = 'runebot';
  if (TYPES.tempestade) TYPES.tempestade.artId = 'raijin';
  function typeForX(x,y=player.y){
    const biome=biomeAt(x,y),pool=BIOME_MOBS[biome];
    // Later waves unlock the rarer threats of THAT biome, not random mobs from elsewhere.
    const access=wave<3?Math.min(3,pool.length):wave<7?Math.min(5,pool.length):pool.length;
    return pool[Math.floor(Math.random()*access)];
  }

  /* ---------- projéteis ---------- */
  const shots = [];
  function shoot(e, ang, spd, mul) { shots.push({ x: e.x, y: e.y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, life: 3.2, dmg: e.t.dmg * e.dmgMul * mul, col: e.t.color, boss: !!e.t.boss, element: enemyElement(e) }); }
  function fireFor(e) {
    const t=e.t,a=Math.atan2(player.y-e.y,player.x-e.x),id=e.type;
    if(id==='lorde'){
      for(let k=-2;k<=2;k++){shoot(e,a+k*.32,230,Math.abs(k)===2?.65:1);shoot(e,a+k*.32+Math.PI/2,170,.48)}ring(e.x,e.y,'#d9d2ba',25,210);sfx('slam');
    }else if(id==='colosso'){
      for(let i=0;i<8;i++)shoot(e,a+i/8*TAU,155,.75);for(let k=-1;k<=1;k++)shoot(e,a+k*.5,340,1.1);ring(e.x,e.y,'#c9a46a',32,260);shake(9);sfx('slam');
    }else if(id==='prisma'){
      for(let i=0;i<6;i++){const q=a+i/6*TAU;shoot(e,q,270,.9);shoot(e,q+.12,180,.55)}ring(e.x,e.y,'#b6e7fd',27,255);sfx('skill');
    }else if(id==='rei_sombras'){
      for(let k=-2;k<=2;k++){shoot(e,a+k*.12,390,Math.abs(k)===0?1:.72);shoot(e,a+Math.PI/2+k*.15,250,.58)}ring(e.x,e.y,'#a884dc',28,230);sfx('skill');
    }else if(id==='yeti_giant'||id==='ice_titan'){
      for(let i=0;i<12;i++)shoot(e,a+i/12*TAU,185,.7);ring(e.x,e.y,'#aeeaff',38,300);shake(10);sfx('slam');
    }else if(id==='cyclops'){
      for(let i=0;i<10;i++)shoot(e,a+i/10*TAU,205,.82);for(let k=-1;k<=1;k++)shoot(e,a+k*.18,350,k===0?1.15:.8);ring(e.x,e.y,'#e7cc75',36,285);shake(12);sfx('slam');
    }else if(id==='dragao'){
      for(let k=-4;k<=4;k++)shoot(e,a+k*.13,330,Math.abs(k)<2?1:.52);for(let i=0;i<6;i++)shoot(e,a+i/6*TAU+e.pattern*.08,150,.4);ring(e.x,e.y,'#ff7141',26,245);sfx('slam');
    }else if(id==='arquimago'){
      for(let k=-3;k<=3;k++)shoot(e,a+k*.26,215,Math.abs(k)===3?.45:.82);for(let i=0;i<4;i++)shoot(e,a+i/4*TAU+e.pattern*.2,150,.45);ring(e.x,e.y,'#a4baff',24,210);sfx('skill');
    }else if(id==='hidra'){
      for(let h=-1;h<=1;h++)for(let k=-1;k<=1;k++)shoot(e,a+h*.48+k*.13,245,h===0?1:.72);ring(e.x,e.y,'#8ee28b',20,190);sfx('swing');
    }else if(id==='verme'){
      for(let i=0;i<3;i++){const q=a+(i-1)*.42;for(let k=-1;k<=1;k++)shoot(e,q+k*.13,290,i===1?1:.72)}ring(player.x,player.y,'#d6a46c',25,180);shake(7);sfx('slam');
    }else if(id==='kraken'){
      for(let arm=0;arm<4;arm++){const q=a+arm*Math.PI/2+e.pattern*.12;for(let k=-1;k<=1;k++)shoot(e,q+k*.20,215,.7)}ring(e.x,e.y,'#55c8d6',25,230);sfx('skill');
    }else if(id==='thorn_queen'||id==='matriarca'){
      for(let k=-4;k<=4;k++)shoot(e,a+k*.18,190,Math.abs(k)%2?.65:.95);ring(e.x,e.y,'#b86be1',26,215);sfx('skill');
    }else if(id==='mae_cinzas'){
      for(let i=0;i<3;i++)for(let k=-2;k<=2;k++)shoot(e,a+(i-1)*.38+k*.11,290-i*35,.88);ring(e.x,e.y,'#ff7546',30,245);sfx('slam');
    }else if(id==='ent_anc'||id==='forest_lord'){
      for(let i=0;i<8;i++)shoot(e,a+i/8*TAU+e.pattern*.09,175,.64);
      for(let k=-1;k<=1;k++)shoot(e,a+k*.2,305,.82);
      ring(e.x,e.y,'#8ad875',31,240);sfx('skill');
    }else if(id==='soberana'||id==='ice_archon'){
      for(let i=0;i<7;i++){const q=a+i/7*TAU+e.pattern*.13;shoot(e,q,250,.67);shoot(e,q+.16,165,.4)}
      for(let k=-1;k<=1;k++)shoot(e,a+k*.38,335,.76);
      ring(e.x,e.y,'#9de8ff',27,225);sfx('skill');
    }else if(id==='tempestade'||id==='raijin'||id==='lightning_lord'){
      for(let i=0;i<3;i++){const q=a+(i-1)*.56+Math.sin(e.pattern+i)*.08;for(let k=-1;k<=1;k++)shoot(e,q+k*.075,390-i*40,k===0?1:.58)}
      ring(player.x,player.y,'#8edaff',25,190);sfx('swing');
    }else if(id==='devorador_astral'||id==='astral_devourer'){
      for(let arm=0;arm<2;arm++)for(let i=0;i<7;i++)shoot(e,a+arm*Math.PI+i/7*TAU+e.pattern*(arm?-.16:.16),225,.58);
      shoot(e,a,365,1.15);ring(e.x,e.y,'#c68cff',34,275);sfx('skill');
    }else if(id==='titan'||id==='red_guardian'){
      for(let wave=0;wave<3;wave++)for(let k=-2;k<=2;k++)shoot(e,a+k*(.19+wave*.035)+Math.PI*wave,235+wave*45,Math.abs(k)===2?.55:.92);
      ring(e.x,e.y,'#ff6749',34,250);shake(9);sfx('slam');
    }else if(id==='mimic_boss'){
      for(let i=0;i<9;i++)shoot(e,a+(i-4)*.13,245+(i%3)*45,i===4?1.05:.66);
      for(const side of[-1,1])shoot(e,a+side*.82,340,.82);
      ring(e.x,e.y,'#f3c960',24,205);sfx('slam');
    }else if(id==='celestial_vulture'){
      for(let k=-2;k<=2;k++)shoot(e,a+k*.24,330,k===0?1:.65);ring(e.x,e.y,'#b996ff',18,150);sfx('swing');
    }else if(id==='lightning_elemental'){
      for(let k=-2;k<=2;k++)shoot(e,a+k*.17,380,k===0?1:.72);ring(e.x,e.y,'#8edaff',22,180);sfx('swing');
    }else if(id==='leviathan'){
      for(let k=-2;k<=2;k++)shoot(e,a+k*.28,245,Math.abs(k)===2?.62:1);sfx('swing');
    }else if(['fire_elemental','infernal_dragon'].includes(id)){
      for(let k=-3;k<=3;k++)shoot(e,a+k*.19,250,Math.abs(k)<2?1:.62);ring(e.x,e.y,'#ff7546',28,220);sfx('slam');
    }else if(id==='oni'&&e.finalBoss){
      if(e.pattern%2===0){for(let i=0;i<16;i++)shoot(e,a+i/16*TAU,220,.72);ring(e.x,e.y,'#c071ff',36,280)}
      else for(let k=-2;k<=2;k++)shoot(e,a+k*.15,360,k===0?1.15:.8);
      sfx('slam');shake(12);
    }else if (t.nova && e.pattern % 2 === 0) {
      const n = t.boss ? 16 : 10;
      for (let i = 0; i < n; i++) shoot(e, a + i / n * TAU, 210, .8);
      ring(e.x, e.y, t.color, 30, 260); shake(8); sfx('slam');
    } else if (t.boss) { for (let k = -1; k <= 1; k++) shoot(e, a + k * .22, 300, 1); sfx('swing'); }
    else { shoot(e, a, 300, 1); sfx('swing'); }
  }

  /* ---------- masmorras ---------- */
  const WALL_H = 330, FLOOR_TOP = 350;
  const OW = { w: world.width, h: world.height };
  const DUNS = [
    { id: 'cat', name: 'Catacumbas Esquecidas', sub: 'Os mortos não descansam', x: 420, y: 640, lv: 15, bg: ['360_F_589592494_xjem0JGmU7Sc1GKgQ2Fo9LlwjYY6WIZi.jpg', 'medieval-dungeon-corridor-stockcake.jpg'], floor: '#4a4338', wall: '#2b2620', acc: '#ffb45a', mix: ['nightstalker','graveknight','skeleton','wraith'], boss: 'lorde' },
    { id: 'cis', name: 'Cisterna Esmeralda', sub: 'Algo se move sob a água', x: 780, y: 1580, lv: 17, bg: ['images (2).jpg'], floor: '#2f4a42', wall: '#16261f', acc: '#7dffb0', mix: ['boglurker','plagueshroom','spider','shaman'], boss: 'hidra' },
    { id: 'ast', name: 'Templo Astral', sub: 'O céu se partiu aqui', x: 1500, y: 330, lv: 19, bg: ['3311e8dcf9f658e9a595b633eed77671.jpg'], floor: '#3b3a66', wall: '#1a1838', acc: '#8fb8ff', mix: ['astraleye','voidwalker','shardmage','mage'], boss: 'devorador_astral', bossArt:'astral_devourer' },
    { id: 'forja', name: 'Forja do Abismo', sub: 'O fogo guarda o último segredo', x: 2060, y: 1500, lv: 22, bg: ['boss arena.jpg'], floor: '#4d3640', wall: '#24121a', acc: '#ff8a4a', mix: ['emberling','lavagolem','pyromancer','cultist'], boss: 'mae_cinzas' },
    { id: 'gelo', name: 'Observatório Glacial', sub: 'O frio preserva os segredos', x: 3490, y: 610, lv: 25, bg: ['dungeons-palace-background-260nw-181416236.webp'], floor: '#465b68', wall: '#1b2935', acc: '#9de8ff', mix: ['frostling','icegolem','snowstalker','wraith'], boss: 'soberana', bossArt:'ice_archon' },
    { id: 'dunas', name: 'Colosso das Dunas', sub: 'A areia se ergue contra você', x: 3700, y: 2110, lv: 27, bg: ['boss arena.jpg'], floor: '#765b3c', wall: '#38271d', acc: '#ffbd69', mix: ['sandscorpion','scarab','duneraider','harpy'], boss: 'colosso' },
    { id: 'bosque', name: 'Bosque Profundo', sub: 'As raízes sentem sua presença', x: 1040, y: 2470, lv: 26, bg: ['images (1).jpg'], floor: '#354c3a', wall: '#17261b', acc: '#a5eb83', mix: ['thornling','dryad','mossbeast','stag'], boss: 'ent_anc', bossArt:'forest_lord',biome:'forest' },
    { id: 'temporal', name:'Pico do Trovão',sub:'O céu ruge sobre as pedras',x:2800,y:-2100,lv:28,bg:[],floor:'#3b5864',wall:'#182932',acc:'#f7df77',mix:['stormwisp','thunderhawk','shockhound','stormwisp'],boss:'tempestade',bossArt:'lightning_lord',biome:'storm' },
    { id: 'prismatico', name:'Palácio Prismático',sub:'Um coração de cristal desperta',x:-1600,y:-1510,lv:30,bg:[],floor:'#43567e',wall:'#202b51',acc:'#b6e7fd',mix:['prismite','crystalguard','shardmage','prismite'],boss:'prisma',biome:'crystal' },
    { id: 'sombras', name:'Trono das Sombras',sub:'A noite esconde seu rei',x:-2300,y:830,lv:31,bg:[],floor:'#3e394f',wall:'#211d30',acc:'#bb9dff',mix:['nightstalker','graveknight','voidwalker','wraith'],boss:'rei_sombras',biome:'ash' },
    { id:'raizes',name:'Jardim da Rainha Espinhosa',sub:'As raízes fecham a passagem',x:2380,y:2660,lv:26,bg:[],floor:'#344b3b',wall:'#16271e',acc:'#b86be1',mix:['thornling','dryad','mossbeast','stag'],boss:'matriarca',bossArt:'thorn_queen',biome:'marsh'},
    { id:'oraculo',name:'Observatório do Arquimago',sub:'O firmamento obedece ao mago',x:2040,y:-2350,lv:28,bg:[],floor:'#3d3c69',wall:'#181a3b',acc:'#9dbaff',mix:['astraleye','starfae','voidwalker','runebot'],boss:'arquimago',biome:'arcane'},
    { id:'cratera',name:'Cratera do Guardião Rubro',sub:'O núcleo da montanha ainda arde',x:4550,y:2450,lv:29,bg:[],floor:'#52343a',wall:'#251a25',acc:'#ff794d',mix:['ember','hellhound','lavagolem','fire_elemental'],boss:'titan',bossArt:'red_guardian',biome:'volcano'},
    { id:'profundezas',name:'Fenda do Verme',sub:'Algo enorme atravessa a areia',x:-3400,y:2050,lv:30,bg:[],floor:'#60503c',wall:'#2a241e',acc:'#d6a46c',mix:['scorpion','naja','sandwisp','coyote'],boss:'verme',biome:'dunes'},
    { id:'mare',name:'Abismo da Maré',sub:'As águas escondem tentáculos antigos',x:4420,y:-1690,lv:31,bg:[],floor:'#345767',wall:'#152833',acc:'#55c8d6',mix:['crab','jelly','siren','gull'],boss:'kraken',biome:'marsh'},
    { id:'wyrm',name:'Ninho do Dragão Ancião',sub:'As chamas cobrem o céu',x:4860,y:170,lv:32,bg:[],floor:'#483840',wall:'#211a26',acc:'#ff8654',mix:['young_dragon','infernal_dragon','hellhound','phoenix'],boss:'dragao',biome:'volcano'},
    { id:'ceu',name:'Ninho do Abutre Celestial',sub:'As asas cobrem o firmamento',x:5200,y:-1680,lv:33,bg:[],floor:'#354a67',wall:'#18273c',acc:'#b48af4',mix:['thunderhawk','gull','phoenix','harpy'],boss:'celestial_vulture',biome:'storm'}
  ];
  const DUNGEON_BIOMES={cat:'ash',cis:'marsh',ast:'arcane',forja:'volcano',gelo:'frost',dunas:'dunes',bosque:'forest',temporal:'storm',prismatico:'crystal',sombras:'ash',raizes:'marsh',oraculo:'arcane',cratera:'volcano',profundezas:'dunes',mare:'marsh',wyrm:'volcano',ceu:'storm'};
  DUNS.forEach(d=>{d.biome=d.biome||DUNGEON_BIOMES[d.id];d.imgs=d.bg.map(f=>{const i=new Image();i.src='assets/'+f;return i;});});
  function summonFinalOni(x,y){
    if(finalBossActive||player.dead)return;
    finalBossActive=true;waveTimer=0;
    for(const enemy of enemies)if(!enemy.dead&&enemy.type!=='dummy'){enemy.dead=true;burst(enemy.x,enemy.y,10,{color:[enemy.t.color,'#b77aff'],speed:140,life:.45,size:2.8,glow:true});}
    shots.length=0;
    const oni=spawnEnemy('oni',x,y);
    oni.finalBoss=true;oni.emerging=4;oni.summonTimer=10;oni.state='idle';oni.face=Math.atan2(player.y-y,player.x-x);
    targetEnemy=oni;ring(x,y,'#9d54d8',60,430);shake(18);sfx('slam');
    showBanner('O ABISMO SE ABRIU','O Oni do Abismo está emergindo.');
    showCutscene('O ONI DO ABISMO', 'Os últimos selos se partem. Do outro lado da fenda, algo que conhece seu nome começa a atravessar.', 'CINEMÁTICA · O FIM SE APROXIMA');
  }
  function campaignTarget(){
    if(dun)return questTarget();
    return DUNS.filter(d=>!cleared[d.id]).sort((a,b)=>Math.hypot(player.x-a.x,player.y-a.y)-Math.hypot(player.x-b.x,player.y-b.y))[0]||null;
  }
  let dun = null, ow = null, owEnemies = [], owSolids = [], splash = null, fadeSt = null, portalCd = 0;

  function startFade(fn, instant) { if (instant) { fn(); return; } if (!fadeSt) fadeSt = { t: 0, fn, ran: false }; }
  function snapCamera() {
    const vw = camera.width / camera.scale, vh = camera.height / camera.scale;
    camera.x = dun ? clamp(player.x - vw / 2, 0, Math.max(0, world.width - vw)) : player.x - vw / 2;
    camera.y = dun ? clamp(player.y - vh / 2, FLOOR_TOP, Math.max(FLOOR_TOP, world.height - vh)) : player.y - vh / 2;
  }
  function enterDungeon(d) {
    if (dun || fadeSt) return;
    if (player.level < d.lv - 3) showToast(`Perigoso! Nível recomendado: ${d.lv}`);
    sfx2(160, 620, .6, 'sine', .1);
    startFade(() => {
      ow = { x: player.x, y: player.y };
      owEnemies = enemies.splice(0); owSolids = solids.splice(0); loot.length = 0; shots.length = 0;
      world.width = 1700; world.height = 900;
      dun = { def: d, pillars: [], boss: null, done: false, exit: { x: 90, y: 620 }, exit2: null };
      for (let i = 0; i < 6; i++) { const p = { x: 520 + (i % 3) * 400, y: i < 3 ? 480 : 760, h: 64, broken: i % 2 === 0 }; dun.pillars.push(p); solids.push({ x: p.x, y: p.y, cr: 13 }); }
      player.x = 170; player.y = 620; player.angle = 0; player.kx = player.ky = 0;
      const n = 10 + Math.min(12, Math.floor(wave * .55)) + ((Math.random() * 3) | 0);
      for (let i = 0; i < n; i++) spawnEnemy(d.mix[i % d.mix.length], rand(560, 1250), rand(400, 850));
      snapCamera(); splash = { d, t: 0 }; portalCd = 1.5;
      if (d.id === 'wyrm') window.ABISMO_BOSS_RIG?.prewarmDragon(TYPES.dragao);
    });
  }
  function leaveDungeon(dead) {
    startFade(() => {
      const d = dun.def;
      enemies.length = 0; enemies.push(...owEnemies); owEnemies = [];
      solids.length = 0; solids.push(...owSolids); owSolids = [];
      loot.length = 0; shots.length = 0;
      world.width = OW.w; world.height = OW.h; dun = null; ow = null;
      if (dead) { player.x = SHRINE.x; player.y = SHRINE.y + 130; } else { player.x = d.x; player.y = d.y + 80; }
      portalCd = 2; player.kx = player.ky = 0; snapCamera();
    }, dead);
  }
  function onKillExt(e) {
    if (!dun || e !== dun.boss) return;
    const d = dun.def, first = !cleared[d.id];
    dun.done = true; dun.exit2 = { x: e.x, y: e.y };
    for (let i = 0; i < 16; i++) dropLoot(e.x, e.y, 'coin', Math.round(rand(8, 16) * (first ? 2 : 1)));
    for (let i = 0; i < 3; i++) dropLoot(e.x, e.y, 'potion', 1);
    cleared[d.id] = true; saveExp(); updateCampaignBoard();
    const allDungeonsCleared=DUNS.every(door=>cleared[door.id]);
    if(allDungeonsCleared)setTimeout(()=>summonFinalOni(player.x+115,player.y),1800);
    showBanner(allDungeonsCleared?'O ÚLTIMO SELO CAIU':'MASMORRA CONCLUÍDA',allDungeonsCleared?'O Oni do Abismo despertará em instantes.':first?`${d.name} · recompensa dobrada`:d.name);
    const q = quests[quest.stage];
    if (q && q.dun === d.id) delayed.push({ t: .1, fn: completeQuest });
  }
  function questTarget() {
    if (dun) return dun.boss && !dun.boss.dead ? dun.boss : (dun.exit2 || (dun.boss ? dun.exit : { x: 1500, y: 640 }));
    const q = quests[quest.stage];
    return q && q.dun ? DUNS.find(d => d.id === q.dun) : questTargetOld();
  }

  function updateFx(dt) {
    portalCd = Math.max(0, portalCd - dt);
    if (fadeSt) { fadeSt.t += dt; if (!fadeSt.ran && fadeSt.t >= .35) { fadeSt.ran = true; fadeSt.fn(); } if (fadeSt.t >= .75) fadeSt = null; }
    if (splash && (splash.t += dt) > 2.5) splash = null;
  }
  function updateExt(dt) {
    updatePShots(dt);
    if (!player.dead && portalCd <= 0 && !fadeSt) {
      if (!dun) { for (const d of DUNS) if (Math.hypot(player.x - d.x, player.y - d.y) < 42) { enterDungeon(d); break; } }
      else {
        for (const p of [dun.exit, dun.exit2]) if (p && Math.hypot(player.x - p.x, player.y - p.y) < 42) { leaveDungeon(false); break; }
        if (dun && !dun.boss && player.x > 1280) {
          dun.boss = spawnEnemy(dun.def.boss, 1500, 640);
          if(dun.def.bossArt)dun.boss.artOverride=dun.def.bossArt;
          showBanner(dun.boss.t.name, dun.def.sub); sfx('slam'); shake(10); ring(1500, 640, dun.def.acc, 40, 320);
        }
      }
    }
    updateList(shots, s => {
      s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.life <= 0 || (dun && (s.x < 0 || s.x > world.width || s.y > world.height || s.y < FLOOR_TOP - 20))) return false;
      if (!player.dead && Math.hypot(player.x - s.x, player.y - s.y) < 18) {
        hurtPlayer(s.dmg, s.x - s.vx, s.y - s.vy, s.boss, s.element);
        burst(s.x, s.y, 8, { color: [s.col, '#fff'], speed: 150, life: .3, size: 2.6, glow: true });
        return false;
      }
      if (Math.random() < dt * 30) addParticle({ x: s.x, y: s.y, vx: 0, vy: 0, life: .3, max: .3, size: 4, color: s.col, drag: 0, glow: true, shrink: true });
      return true;
    });
  }

  /* ---------- cenário das masmorras ---------- */
  function buildDunBg(d) {
    const W = world.width, H = world.height, c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d'), ready = d.imgs.filter(i => i.complete && i.naturalWidth);
    g.fillStyle = d.wall; g.fillRect(0, 0, W, WALL_H);
    if (ready.length) {
      for (let x = 0, k = 0; x < W; k++) {
        const im = ready[k % ready.length], tw = im.naturalWidth * WALL_H / im.naturalHeight;
        g.save(); if (k % 2) { g.translate(x + tw, 0); g.scale(-1, 1); } else g.translate(x, 0);
        g.drawImage(im, 0, 0, tw, WALL_H); g.restore(); x += tw;
      }
    }
    g.fillStyle = 'rgba(6,4,10,.45)'; g.fillRect(0, 0, W, WALL_H);
    const gr = g.createLinearGradient(0, 0, 0, WALL_H);
    gr.addColorStop(0, 'rgba(0,0,0,.7)'); gr.addColorStop(.7, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.6)');
    g.fillStyle = gr; g.fillRect(0, 0, W, WALL_H);
    g.fillStyle = d.wall; g.fillRect(0, WALL_H - 10, W, 26);
    g.fillStyle = 'rgba(255,255,255,.09)'; g.fillRect(0, WALL_H - 10, W, 2);
    g.fillStyle = d.floor; g.fillRect(0, WALL_H + 16, W, H);
    for (let y = WALL_H + 16, r = 0; y < H; y += 56, r++) {
      for (let x = (r % 2) * 40 - 40; x < W; x += 80) {
        const h = Math.abs((x * 13 + y * 7) % 11);
        g.fillStyle = h % 2 ? `rgba(255,255,255,${.02 + h / 200})` : `rgba(0,0,0,${.04 + h / 160})`;
        g.fillRect(x + 1, y + 1, 78, 54);
      }
    }
    // Distinct elemental dungeon architecture over the old stone floor.
    let rx=1002748;
    const rnd=()=>{rx=(Math.imul(rx,1664525)+1013904223)>>>0;return rx/4294967296;};
    for(let i=0;i<105;i++){
      const x=180+rnd()*(W-260),y=WALL_H+32+rnd()*(H-WALL_H-45),sz=5+rnd()*18;
      if(d.biome==='volcano'){
        g.strokeStyle=i%3?'#b25236':'#fc8944';g.lineWidth=1.3+rnd()*3;g.beginPath();g.moveTo(x-sz,y-8);g.lineTo(x,y);g.lineTo(x+sz*.5,y+5);g.stroke();
      }else if(d.biome==='frost'){
        g.fillStyle=i%3?'#8bbad5':'#e9f9fc';g.beginPath();g.moveTo(x,y-sz*1.6);g.lineTo(x+sz*.48,y+4);g.lineTo(x-sz*.42,y+4);g.fill();
      }else if(d.biome==='storm'){
        g.strokeStyle='#aadbe7';g.lineWidth=2;g.beginPath();g.moveTo(x,y-sz);g.lineTo(x-4,y);g.lineTo(x+3,y);g.lineTo(x-4,y+sz);g.stroke();
      }else if(d.biome==='crystal'||d.biome==='arcane'){
        g.fillStyle=i%2?'#9ce8f5':'#b393f9';g.globalAlpha=.38;g.beginPath();g.moveTo(x,y-sz*1.4);g.lineTo(x+sz*.5,y);g.lineTo(x,y+sz*.6);g.lineTo(x-sz*.5,y);g.fill();g.globalAlpha=1;
      }else if(d.biome==='forest'||d.biome==='marsh'){
        g.fillStyle=d.biome==='forest'?'#609969':'#558e70';g.globalAlpha=.3;g.beginPath();g.ellipse(x,y,sz*1.3,sz*.6,0,0,TAU);g.fill();g.globalAlpha=1;
      }else if(d.biome==='dunes'){
        g.strokeStyle='#d4b179';g.lineWidth=2;g.beginPath();g.arc(x,y,sz,.1,Math.PI);g.stroke();
      }else{g.fillStyle='#9081b9';g.globalAlpha=.15;g.fillRect(x,y,sz*.7,sz*.7);g.globalAlpha=1;}
    }
    // A themed ceremonial insignia makes the boss end of the arena readable.
    g.save();g.translate(1500,640);g.strokeStyle=d.acc+'b5';g.lineWidth=4;
    for(let i=0;i<8;i++){g.save();g.rotate(i*Math.PI/4);g.beginPath();g.moveTo(0,100);g.lineTo(-15,126);g.lineTo(15,126);g.closePath();g.stroke();g.restore();}
    g.restore();
    g.strokeStyle = d.acc + '55'; g.lineWidth = 3;
    for (const rr of [150, 105]) { g.beginPath(); g.ellipse(1500, 640, rr * 1.3, rr * .8, 0, 0, TAU); g.stroke(); }
    const sh = g.createLinearGradient(0, 0, 160, 0); sh.addColorStop(0, 'rgba(0,0,0,.6)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = sh; g.fillRect(0, 0, 160, H);
    return c;
  }
  function drawDungeonBg() {
    const d = dun.def, ok = d.imgs.every(i => i.complete && i.naturalWidth);
    if (!dun.bg || (ok && !dun.bgOk)) { dun.bg = buildDunBg(d); dun.bgOk = ok; }
    ctx.drawImage(dun.bg, 0, 0);
  }
  function drawPortalAt(x, y, col, label) {
    const p = .5 + .5 * Math.sin(gameTime * 3);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(x, y + 22, 34, 11, 0, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 4, x, y, 52 + p * 8);
    g.addColorStop(0, col + 'cc'); g.addColorStop(1, col + '00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 60, 0, TAU); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) { const a = gameTime * 2 + i * TAU / 3; ctx.beginPath(); ctx.ellipse(x, y, 26, 36, 0, a, a + 1.6); ctx.stroke(); }
    ctx.restore();
    if (label) { ctx.textAlign = 'center'; ctx.font = '800 11px Rajdhani, sans-serif'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(8,10,12,.85)'; ctx.strokeText(label, x, y - 46); ctx.fillStyle = '#f4efe0'; ctx.fillText(label, x, y - 46); }
  }
  function drawGate(d) {
    const vw = camera.width / camera.scale, vh = camera.height / camera.scale;
    if (d.x < camera.x - 120 || d.x > camera.x + vw + 120 || d.y < camera.y - 140 || d.y > camera.y + vh + 120) return;
    const x = d.x, y = d.y, pulse = .5 + .5 * Math.sin(gameTime * 2.4);
    ctx.save();
    ctx.fillStyle = 'rgba(12,20,14,.45)'; ctx.beginPath(); ctx.ellipse(x, y + 26, 62, 16, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6f6c5d'; ctx.fillRect(x - 46, y - 56, 18, 80); ctx.fillRect(x + 28, y - 56, 18, 80);
    ctx.fillStyle = '#8c8a76'; ctx.fillRect(x - 52, y - 66, 104, 16);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x + 28, y - 56, 8, 80);
    ctx.fillStyle = '#0b0a10'; ctx.fillRect(x - 28, y - 50, 56, 74);
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y - 8, 4, x, y - 8, 70);
    g.addColorStop(0, d.acc + (cleared[d.id] ? '44' : 'aa')); g.addColorStop(1, d.acc + '00');
    ctx.fillStyle = g; ctx.globalAlpha = .55 + pulse * .35; ctx.fillRect(x - 80, y - 90, 160, 130);
    ctx.restore();
    ctx.save(); ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(8,10,12,.85)';
    ctx.font = '800 12px Rajdhani, sans-serif'; const t1 = d.name.toUpperCase() + (cleared[d.id] ? ' ✓' : '');
    ctx.strokeText(t1, x, y - 78); ctx.fillStyle = d.acc; ctx.fillText(t1, x, y - 78);
    ctx.font = '700 10px Rajdhani, sans-serif'; ctx.strokeText(`MASMORRA · NV ${d.lv}`, x, y - 66); ctx.fillStyle = '#e8eee6'; ctx.fillText(`MASMORRA · NV ${d.lv}`, x, y - 66);
    ctx.restore();
  }
  function drawExt() {
    if (!dun) for (const d of DUNS) drawGate(d);
    else {
      for (let x = 170; x < world.width; x += 340) {
        const fl = .75 + .25 * Math.sin(gameTime * 9 + x);
        ctx.fillStyle = '#2f2823'; ctx.fillRect(x - 3, 262, 6, 38);
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = dun.def.acc; ctx.beginPath(); ctx.ellipse(x, 252, 5 * fl, 11 * fl, 0, 0, TAU); ctx.fill();
        const g = ctx.createRadialGradient(x, 360, 6, x, 360, 190);
        g.addColorStop(0, dun.def.acc + '38'); g.addColorStop(1, dun.def.acc + '00');
        ctx.fillStyle = g; ctx.fillRect(x - 190, 170, 380, 380);
        ctx.restore();
      }
      drawPortalAt(dun.exit.x, dun.exit.y, '#8ee0ff', 'SAÍDA');
      if (dun.exit2) drawPortalAt(dun.exit2.x, dun.exit2.y, '#ffe28a', 'SAÍDA');
    }
    drawFires(); drawPShots();
    for (const s of shots) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = s.col + '55'; ctx.beginPath(); ctx.arc(s.x, s.y, 13, 0, TAU); ctx.fill();
      ctx.fillStyle = s.col; ctx.beginPath(); ctx.arc(s.x, s.y, 6.5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x, s.y, 3, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }
  function coverImg(im, w, h) { const s = Math.max(w / im.naturalWidth, h / im.naturalHeight), iw = im.naturalWidth * s, ih = im.naturalHeight * s; ctx.drawImage(im, (w - iw) / 2, (h - ih) / 2, iw, ih); }
  function drawOverlayExt() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = camera.width, h = camera.height;
    if (splash) {
      const t = splash.t, a = clamp(Math.min(t / .4, (2.5 - t) / .7), 0, 1), im = splash.d.imgs[0];
      ctx.globalAlpha = a; ctx.fillStyle = '#050308'; ctx.fillRect(0, 0, w, h);
      if (im && im.complete && im.naturalWidth) { ctx.globalAlpha = a * .8; coverImg(im, w, h); }
      const g = ctx.createRadialGradient(w / 2, h / 2, h * .2, w / 2, h / 2, h * .95);
      g.addColorStop(0, 'rgba(0,0,0,.15)'); g.addColorStop(1, 'rgba(0,0,0,.85)');
      ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.textAlign = 'center'; ctx.fillStyle = splash.d.acc; ctx.font = '700 12px Rajdhani, sans-serif';
      ctx.fillText(`MASMORRA · NÍVEL RECOMENDADO ${splash.d.lv}`, w / 2, h / 2 - 34);
      ctx.fillStyle = '#f4efe0'; ctx.font = `800 ${Math.min(46, w / 12)}px Rajdhani, sans-serif`; ctx.fillText(splash.d.name.toUpperCase(), w / 2, h / 2 + 8);
      ctx.fillStyle = '#cfd8cf'; ctx.font = '600 14px Inter, sans-serif'; ctx.fillText(splash.d.sub, w / 2, h / 2 + 36);
      ctx.globalAlpha = 1;
    }
    if (fadeSt) { const t = fadeSt.t, a = t < .35 ? t / .35 : 1 - (t - .35) / .4; ctx.fillStyle = `rgba(5,3,9,${clamp(a, 0, 1)})`; ctx.fillRect(0, 0, w, h); }
  }
  function mapExt(mx, my) {
    if (!dun) for (const d of DUNS) { miniCtx.save(); miniCtx.translate(mx(d.x), my(d.y)); miniCtx.rotate(Math.PI / 4); miniCtx.fillStyle = cleared[d.id] ? '#7a8f7a' : d.acc; miniCtx.fillRect(-4, -4, 8, 8); miniCtx.restore(); }
    else for (const p of [dun.exit, dun.exit2]) if (p) { miniCtx.fillStyle = '#8ee0ff'; miniCtx.fillRect(mx(p.x) - 4, my(p.y) - 4, 8, 8); }
  }

  /* ---------- desenho dos novos inimigos ---------- */
  const NEW_TYPES = ['bat', 'mage', 'brute', 'lorde', 'matriarca', 'arquimago', 'titan','spider','wraith','cultist','guardian','shaman','harpy','mimic','yeti_giant','cyclops'];
  function drawEnemy(e) {
    if (window.ABISMO_ENEMY_ART?.draw) {
      const artId = e.artOverride || e.t.artId || (e.type === 'boss' ? 'guardian' : e.type);
      return window.ABISMO_ENEMY_ART.draw(ctx, artId === e.type ? e : { ...e, type: artId }, gameTime);
    }
    if (!NEW_TYPES.includes(e.type)) return drawEnemyOld(e);
    const t = e.t, r = t.r, bob = Math.sin(gameTime * 5 + e.bob), dx = Math.cos(e.face) >= 0 ? 1 : -1;
    const raise = e.state === 'windup' ? 1 - e.timer / (e.maxTimer || 1) : 0;
    ctx.save(); ctx.translate(e.x, e.y);
    ctx.fillStyle = 'rgba(12,22,16,.42)'; ctx.beginPath(); ctx.ellipse(0, r * .6, r * 1.05, r * .55, 0, 0, TAU); ctx.fill();
    if (e.state === 'windup') { ctx.fillStyle = `rgba(255,80,60,${(.35 + .35 * Math.sin(gameTime * 30)) * .5})`; ctx.beginPath(); ctx.arc(0, 0, r * 1.5, 0, TAU); ctx.fill(); }
    if (t.boss) { ctx.fillStyle = t.color + '2a'; ctx.beginPath(); ctx.arc(0, -4, r * 1.6 + bob * 2, 0, TAU); ctx.fill(); }
    const eyes = (y, col, s = 2) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(-r * .3, y, s, 0, TAU); ctx.arc(r * .3, y, s, 0, TAU); ctx.fill(); };
    switch (e.type) {
      case 'bat': {
        const f = Math.sin(gameTime * 22 + e.bob); ctx.translate(0, -8 + bob * 3);
        ctx.fillStyle = '#4a3868';
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 3, 0); ctx.quadraticCurveTo(s * 20, -12 - f * 8, s * 25, 4 + f * 5); ctx.quadraticCurveTo(s * 15, 2, s * 11, 9); ctx.quadraticCurveTo(s * 6, 3, s * 3, 9); ctx.fill(); }
        ctx.fillStyle = t.color; ctx.beginPath(); ctx.ellipse(0, 2, 6, 8, 0, 0, TAU); ctx.fill();
        eyes(0, '#ff5b4a', 1.6); break;
      }
      case 'mage': {
        ctx.translate(0, bob * 1.5);
        ctx.fillStyle = '#26356b'; ctx.beginPath(); ctx.moveTo(0, -25); ctx.lineTo(-15, 13); ctx.lineTo(15, 13); ctx.closePath(); ctx.fill();
        ctx.fillStyle = t.color; ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(-10, 10); ctx.lineTo(10, 10); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#10142e'; ctx.beginPath(); ctx.arc(0, -16, 7, 0, TAU); ctx.fill();
        eyes(-16, '#bfe0ff', 1.5);
        ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(dx * 15, 11); ctx.lineTo(dx * 15, -20); ctx.stroke();
        ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = t.color; ctx.beginPath(); ctx.arc(dx * 15, -24, 5 + raise * 6, 0, TAU); ctx.fill(); break;
      }
      case 'brute': {
        ctx.fillStyle = '#5b3a28'; ctx.beginPath(); ctx.ellipse(0, -2, r * 1.05, r * 1.1, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = t.color; ctx.beginPath(); ctx.ellipse(0, -4, r * .92, r * .95, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#d2a47c'; ctx.beginPath(); ctx.arc(0, -r * .95, r * .45, 0, TAU); ctx.fill();
        ctx.fillStyle = '#e8e0c0'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * r * .3, -r * 1.25); ctx.lineTo(s * r * .65, -r * 1.75); ctx.lineTo(s * r * .1, -r * 1.35); ctx.fill(); }
        eyes(-r * 1.0, '#1a1210', 2);
        ctx.save(); ctx.translate(dx * r, -4); ctx.rotate(dx * (.6 - raise * 2.4));
        ctx.fillStyle = '#6a4a30'; ctx.fillRect(-3, -34, 6, 36); ctx.fillStyle = '#4a3322'; ctx.fillRect(-7, -42, 14, 14); ctx.restore(); break;
      }
      case 'lorde': {
        ctx.fillStyle = '#6f6a58'; ctx.beginPath(); ctx.ellipse(0, 0, r * .95, r * 1.1, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = t.color; ctx.beginPath(); ctx.ellipse(0, -3, r * .85, r * 1.0, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#4a4638'; for (let i = 0; i < 4; i++) ctx.fillRect(-r * .6, -r * .3 + i * 7, r * 1.2, 2);
        ctx.fillStyle = '#efe9d0'; ctx.beginPath(); ctx.arc(0, -r * .95, r * .5, 0, TAU); ctx.fill();
        ctx.fillStyle = '#f2c94c'; ctx.beginPath(); ctx.moveTo(-r * .5, -r * 1.25); for (let i = 0; i < 5; i++) { ctx.lineTo(-r * .5 + i * r * .25, i % 2 ? -r * 1.45 : -r * 1.75); ctx.lineTo(-r * .5 + i * r * .25 + r * .125, -r * 1.3); } ctx.lineTo(r * .5, -r * 1.25); ctx.fill();
        ctx.globalCompositeOperation = 'lighter'; eyes(-r * 1.0, '#c08aff', 3.2); ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = '#b7bcc4'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(dx * r, 0); ctx.lineTo(dx * (r + 8), -r * 1.5 + raise * r * 1.3); ctx.stroke(); break;
      }
      case 'matriarca': {
        ctx.strokeStyle = '#2f7a4a'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + Math.sin(gameTime * 4 + i) * .1; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * .6, Math.sin(a) * r * .5); ctx.lineTo(Math.cos(a) * r * 1.5, Math.sin(a) * r * 1.2 + 6); ctx.stroke(); }
        ctx.fillStyle = '#2f7a4a'; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.05 * (1 + bob * .03 + raise * .12), r * .95, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = t.color; ctx.beginPath(); ctx.ellipse(0, -3, r * .92, r * .82, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.ellipse(-r * .3, -r * .5, r * .3, r * .15, -.5, 0, TAU); ctx.fill();
        for (const [ex, ey, es] of [[-.35, -.15, 4], [.35, -.15, 4], [0, -.4, 3], [-.15, .1, 2.5], [.15, .1, 2.5]]) { ctx.fillStyle = '#f7ffb0'; ctx.beginPath(); ctx.arc(ex * r, ey * r, es, 0, TAU); ctx.fill(); ctx.fillStyle = '#10261a'; ctx.beginPath(); ctx.arc(ex * r, ey * r, es * .45, 0, TAU); ctx.fill(); } break;
      }
      case 'arquimago': {
        ctx.translate(0, -10 + bob * 4);
        ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = t.color; ctx.lineWidth = 2;
        for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.ellipse(0, -4, r * 1.5, r * .5, gameTime * (i ? -1 : 1) * 1.2, 0, TAU); ctx.stroke(); }
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#1d2250'; ctx.beginPath(); ctx.moveTo(0, -r * 1.2); ctx.lineTo(-r * 1.05, r * .9); ctx.lineTo(r * 1.05, r * .9); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#3a4fa0'; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(-r * .7, r * .7); ctx.lineTo(r * .7, r * .7); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#0c0e24'; ctx.beginPath(); ctx.arc(0, -r * .8, r * .38, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'lighter'; eyes(-r * .8, '#ffffff', 2.6);
        ctx.fillStyle = t.color; ctx.beginPath(); ctx.arc(dx * r * 1.1, -r * .5, 7 + raise * 8, 0, TAU); ctx.fill(); break;
      }
      case 'titan': {
        const s = 1 + bob * .02 + raise * .1; ctx.scale(s, s);
        ctx.fillStyle = '#2a1a1e'; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.1, r * 1.15, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#4a2f36'; ctx.beginPath(); ctx.ellipse(0, -3, r * .98, r * 1.02, 0, 0, TAU); ctx.fill();
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = t.color; ctx.lineWidth = 2.5;
        ctx.globalAlpha = .65 + .35 * Math.sin(gameTime * 4);
        ctx.beginPath(); ctx.moveTo(-r * .6, -r * .5); ctx.lineTo(-r * .2, -r * .1); ctx.lineTo(-r * .5, r * .4); ctx.moveTo(r * .5, -r * .6); ctx.lineTo(r * .15, -r * .05); ctx.lineTo(r * .45, r * .5); ctx.moveTo(0, r * .1); ctx.lineTo(r * .1, r * .7); ctx.stroke(); ctx.restore();
        ctx.fillStyle = '#35222a'; ctx.beginPath(); ctx.arc(0, -r * 1.0, r * .5, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#ffb35a'; ctx.fillRect(-r * .35, -r * 1.05, r * .7, 5); ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = '#4a2f36'; ctx.lineWidth = 14; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-r * .95, 0); ctx.lineTo(-r * 1.3, r * .6 - raise * r * 1.6); ctx.moveTo(r * .95, 0); ctx.lineTo(r * 1.3, r * .6 - raise * r * 1.6); ctx.stroke();
        ctx.fillStyle = t.color; ctx.beginPath(); ctx.arc(-r * 1.3, r * .6 - raise * r * 1.6, 8, 0, TAU); ctx.arc(r * 1.3, r * .6 - raise * r * 1.6, 8, 0, TAU); ctx.fill(); break;
      }
      case 'spider': case 'wraith': case 'cultist': case 'guardian': case 'shaman': case 'harpy': case 'mimic': {
        const limb = Math.sin(gameTime * (e.type === 'harpy' ? 13 : 6) + e.bob);
        ctx.save(); ctx.rotate(e.face + Math.PI/2); ctx.translate(0,-4);
        if (e.type === 'spider') {
          ctx.strokeStyle='#31432b';ctx.lineWidth=3;
          for (const side of [-1,1]) for (let i=0;i<4;i++) { ctx.beginPath();ctx.moveTo(side*7,-6+i*5);ctx.lineTo(side*(16+i),-14+i*8+limb*(i%2?3:-3));ctx.lineTo(side*(23+i),-8+i*8);ctx.stroke(); }
          ctx.fillStyle='#50643e';ctx.beginPath();ctx.ellipse(0,5,11,13,0,0,TAU);ctx.fill();
          ctx.fillStyle=t.color;ctx.beginPath();ctx.arc(0,-8,10,0,TAU);ctx.fill();
        } else if (e.type === 'harpy') {
          ctx.fillStyle='#896b48';
          for (const side of [-1,1]) {ctx.beginPath();ctx.moveTo(side*6,-4);ctx.quadraticCurveTo(side*33,-23-limb*9,side*28,16);ctx.lineTo(side*8,8);ctx.fill();}
          ctx.fillStyle=t.color;ctx.beginPath();ctx.ellipse(0,0,9,15,0,0,TAU);ctx.fill();
          ctx.fillStyle='#f1d08f';ctx.beginPath();ctx.moveTo(0,-18);ctx.lineTo(-7,-7);ctx.lineTo(7,-7);ctx.fill();
        } else if (e.type === 'wraith') {
          ctx.fillStyle='#294c60';ctx.beginPath();ctx.moveTo(0,-24);ctx.quadraticCurveTo(-24,0,-15,18);ctx.lineTo(-4,11+limb*3);ctx.lineTo(6,17-limb*3);ctx.lineTo(17,12);ctx.quadraticCurveTo(23,-8,0,-24);ctx.fill();
          ctx.fillStyle='#a2dff7';ctx.globalAlpha=.7;ctx.beginPath();ctx.arc(0,-10,8,0,TAU);ctx.fill();ctx.globalAlpha=1;
        } else if (e.type === 'guardian') {
          ctx.fillStyle='#454654';ctx.fillRect(-15,-12,30,30);ctx.fillStyle='#857b91';ctx.fillRect(-11,-17,22,24);
          ctx.strokeStyle=t.color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-7,-9);ctx.lineTo(0,0);ctx.lineTo(7,-9);ctx.moveTo(-7,7);ctx.lineTo(0,0);ctx.lineTo(7,7);ctx.stroke();
          ctx.fillStyle='#373743';ctx.fillRect(-17,8,8,13);ctx.fillRect(9,8,8,13);
        } else if (e.type === 'mimic') {
          ctx.fillStyle='#3b273d';ctx.fillRect(-16,-13,32,29);ctx.fillStyle='#8d5b99';ctx.fillRect(-16,-17,32,12);
          ctx.strokeStyle='#d7ae5e';ctx.lineWidth=3;ctx.strokeRect(-16,-17,32,32);
          ctx.fillStyle='#fff0be';for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(-14+i*6,-5);ctx.lineTo(-11+i*6,3);ctx.lineTo(-8+i*6,-5);ctx.fill();}
        } else {
          ctx.fillStyle=e.type==='cultist'?'#6a3130':'#455538';ctx.beginPath();ctx.moveTo(0,-23);ctx.lineTo(-13,13);ctx.lineTo(13,13);ctx.closePath();ctx.fill();
          ctx.fillStyle='#181d1d';ctx.beginPath();ctx.arc(0,-13,8,0,TAU);ctx.fill();
          ctx.strokeStyle='#6d5a3e';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(16,9);ctx.lineTo(17,-22);ctx.stroke();
          ctx.fillStyle=t.color;ctx.beginPath();ctx.arc(17,-24,6+raise*4,0,TAU);ctx.fill();
        }
        ctx.fillStyle='#f2de8a';ctx.beginPath();ctx.arc(-3,-10,1.6,0,TAU);ctx.arc(3,-10,1.6,0,TAU);ctx.fill();
        ctx.restore();break;
      }
      default: break;
    }
    if (e.hit > 0) { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = Math.min(1, e.hit * 5); ctx.fillStyle = '#fff5cb'; ctx.beginPath(); ctx.arc(0, -4, r * 1.2, 0, TAU); ctx.fill(); }
    ctx.restore();
    if (e.elite) { ctx.strokeStyle='#ffda80';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y-4,t.r*1.3,0,TAU);ctx.stroke(); }
    const statuses = [[e.burn,'🔥'],[e.poison,'☠'],[e.slow,'❄'],[e.stun,'⚡'],[e.mark,'✦']].filter(([time])=>time>0).map(([,symbol])=>symbol).join('');
    if (statuses) {ctx.textAlign='center';ctx.font='bold 13px system-ui';ctx.fillStyle='#fff';ctx.fillText(statuses,e.x,e.y-t.r-30);}
    if (e.hp < e.maxHp && !t.boss && e.hp > 0) {
      const w = 34, x = e.x - w / 2, y = e.y - r - 26;
      ctx.fillStyle = 'rgba(10,18,14,.75)'; ctx.fillRect(x - 1, y - 1, w + 2, 6); ctx.fillStyle = '#e66562'; ctx.fillRect(x, y, w * e.hp / e.maxHp, 4);
    }
  }

  /* ---------- herói personalizável ---------- */
  /* ---------- raças, classes e criação de personagem ---------- */
  const RACES = {
    humano: { n: 'Humano', d: 'Versátil e determinado. +10% de XP.', hp: 1, sp: 1, fo: 1, dm: 1, xp: 1.1, skin: ['#f1d2b5', '#d9b99b', '#b98a68', '#8a5a3c'] },
    elfo: { n: 'Elfo', d: 'Ágil e arcano. +10% velocidade, +20% foco, −15% vida.', hp: .85, sp: 1.1, fo: 1.2, dm: 1, xp: 1, skin: ['#f3e3d0', '#e6d2b8', '#c9e0c0', '#b8c8e8'] },
    anao: { n: 'Anão', d: 'Robusto e teimoso. +25% vida, +5% dano, −8% velocidade.', hp: 1.25, sp: .92, fo: 1, dm: 1.05, xp: 1, skin: ['#e0b894', '#c99b74', '#a8643c', '#7a4a2e'] },
    orc: { n: 'Orc', d: 'Brutal. +15% dano, −15% foco.', hp: 1.1, sp: 1, fo: .85, dm: 1.15, xp: 1, skin: ['#7fae5a', '#5f9150', '#8fa070', '#6a7f9a'] },
    tiefling: { n: 'Tiefling', d: 'Sangue infernal. +15% foco, +10% dano, −8% vida.', hp: .92, sp: 1, fo: 1.15, dm: 1.1, xp: 1, skin: ['#b74950','#8b4a91','#d77f6a','#6a617f'] },
    minotauro: { n: 'Minotauro', d: 'Força taurina. +35% vida, +12% dano, −13% velocidade.', hp: 1.35, sp: .87, fo: .85, dm: 1.12, xp: 1, skin: ['#ae8464','#644737','#c6a088','#8d6764'] },
    kitsune: { n: 'Kitsune', d: 'Raposa espiritual. +12% foco, +10% velocidade e magia ilusória.', hp: .94, sp: 1.1, fo: 1.12, dm: 1.04, xp: 1, skin: ['#f0d7c4','#dca977','#8b5c48','#edc5a2'] },
    draconato: { n: 'Draconato', d: 'Escamas ancestrais. +18% vida e resistência, com passo mais pesado.', hp: 1.18, sp: .94, fo: .96, dm: 1.08, xp: 1, skin: ['#a75b49','#4e7897','#56815c','#444650'] }
  };
  const CLASSES = {
    guerreiro: { n: 'Guerreiro', w: 'Espada Longa', d: 'Combo de 3 golpes em arco. Habilidade: Redemoinho de lâminas.', hp: 1.1, fo: 1, sp: 1, dm: 1, atk: 1, rng: 1, dc: 1, cost: 20, cd: 4, icon: '✦' },
    mago: { n: 'Mago', w: 'Cajado Arcano', d: 'Raios arcanos à distância. Habilidade: Nova Arcana (explosão em área).', hp: .8, fo: 1.4, sp: 1, dm: 1, atk: 1, rng: 1, dc: 1, cost: 22, cd: 4.5, icon: '✺' },
    arqueiro: { n: 'Arqueiro', w: 'Arco Curto', d: 'Flechas rápidas que perfuram. Habilidade: Leque de 7 flechas.', hp: .9, fo: 1.1, sp: 1.08, dm: 1, atk: 1, rng: 1, dc: 1, cost: 20, cd: 4, icon: '➶' },
    paladino: { n: 'Paladino', w: 'Martelo Sagrado', d: 'Golpes lentos e devastadores. Habilidade: Julgamento (cura + explosão).', hp: 1.3, fo: 1, sp: .96, dm: 1, atk: 1.7, rng: 1.1, dc: 1.7, cost: 25, cd: 6, icon: '☀' },
    druida: { n: 'Druida', w: 'Cajado das Raízes', d: 'Dispara espinhos vivos. Habilidade: Ciclo Vital, cura e fere ao redor.', hp: 1, fo: 1.25, sp: 1, dm: 1.05, atk: 1, rng: 1, dc: 1, cost: 24, cd: 5, icon: '❋' },
    assassino: { n: 'Assassino', w: 'Lâmina Oculta', d: 'Capuz, couro escuro e lâmina de pulso: ataques velozes e Passo Sombrio para eliminar alvos.', hp: .88, fo: .95, sp: 1.18, dm: 1.12, atk: .72, rng: .82, dc: 1.1, cost: 18, cd: 3.2, icon: '✧' },
    ninja: { n: 'Ninja', w: 'Kunai e Katana', d: 'Lança kunais e shurikens. Habilidade: chuva de sete shurikens.', hp: .9, fo: 1, sp: 1.18, dm: 1.08, atk: .78, rng: 1, dc: 1.08, cost: 18, cd: 3.4, icon: '✧' },
    tanke: { n: 'Tanke', w: 'Baluarte Colossal', d: 'Armadura pesada e golpes poderosos. Bloqueie segurando o botão direito ou B para converter dano em mana.', hp: 1.48, fo: 1.05, sp: .82, dm: 1.12, atk: 1.2, rng: 1.18, dc: 1.3, cost: 18, cd: 5.5, icon: '⬡' }
  };
  const ARMORS = {
    couro: { n: 'Couro de Caçador', hp: .96, speed: 1.08, guard: .06 },
    cota: { n: 'Cota do Viajante', hp: 1, speed: 1, guard: .12 },
    placas: { n: 'Placas do Bastião', hp: 1.22, speed: .9, guard: .24 },
    runica: { n: 'Manto Rúnico', hp: 1.04, speed: 1.02, guard: .1 }
  };
  const WEAPONS = {
    espada: { n: 'Espada longa', cls: 'guerreiro', damage: 1, rate: 1, range: 1 },
    machado: { n: 'Machado de guerra', cls: 'guerreiro', damage: 1.24, rate: .82, range: 1.08 },
    machado_duplo: { n: 'Machado duplo', cls: 'guerreiro', damage: 1.3, rate: .74, range: 1.14 },
    machado_gancho: { n: 'Machado gancho', cls: 'guerreiro', damage: 1.16, rate: .9, range: 1.18 },
    montante: { n: 'Montante runico', cls: 'guerreiro', damage: 1.28, rate: .78, range: 1.2 },
    lanca: { n: 'Lança do sentinela', cls: 'guerreiro', damage: .92, rate: 1.08, range: 1.32 },
    cajado: { n: 'Cajado arcano', cls: 'mago', damage: 1.06, rate: .96, range: 1.18 },
    grimorio: { n: 'Grimório astral', cls: 'mago', damage: 1.22, rate: .84, range: 1.08 },
    varinha: { n: 'Varinha prismática', cls: 'mago', damage: .86, rate: 1.2, range: .94 },
    arco: { n: 'Arco longo', cls: 'arqueiro', damage: 1.14, rate: .94, range: 1.24 },
    besta: { n: 'Besta repetidora', cls: 'arqueiro', damage: 1.3, rate: .76, range: 1.12 },
    arco_runico: { n: 'Arco runico', cls: 'arqueiro', damage: 1.18, rate: .88, range: 1.3 },
    besta_pesada: { n: 'Besta pesada', cls: 'arqueiro', damage: 1.42, rate: .64, range: 1.16 },
    martelo: { n: 'Martelo sagrado', cls: 'paladino', damage: 1.18, rate: .92, range: 1.12 },
    mangual: { n: 'Mangual sagrado', cls: 'paladino', damage: 1.28, rate: .8, range: 1.16 },
    maça: { n: 'Maça do juramento', cls: 'paladino', damage: 1.34, rate: .78, range: .98 },
    totem: { n: 'Totem vivo', cls: 'druida', damage: 1.02, rate: 1, range: 1.2 },
    ramo_ancestral: { n: 'Ramo ancestral', cls: 'druida', damage: 1.08, rate: .98, range: 1.28 },
    lunaclara: { n: 'Cajado da lua', cls: 'druida', damage: 1.2, rate: .88, range: 1.1 },
    adagas: { n: 'Adagas gêmeas', cls: 'assassino', damage: 1, rate: 1.08, range: .92 },
    hidden_blade: { n: 'Lâmina Oculta', cls: 'assassino', damage: 1.08, rate: 1.14, range: .98, weaponType: 'hiddenblade' },
    katars: { n: 'Katars sombrios', cls: 'assassino', damage: 1.18, rate: .92, range: 1.04 },
    garras: { n: 'Garras da sombra', cls: 'assassino', damage: 1.12, rate: 1, range: 1.08 },
    ninja_katana: { n: 'Katana do Ninja', cls: 'ninja', damage: 1.08, rate: 1.06, range: 1.12, weaponType: 'katana' },
    tank_escudotorre: { n: 'Escudo-Torre do Sentinela', cls: 'tanke', damage: 1.05, rate: .9, range: 1.12, weaponType: 'shield', shieldModel: 17, large: true },
    tank_bulwark: { n: 'Escudo Colossal do Baluarte', cls: 'tanke', damage: 1.08, rate: .86, range: 1.08, weaponType: 'shield', shieldModel: 18, large: true },
    tank_citadel: { n: 'Escudo da Cidadela', cls: 'tanke', damage: 1.13, rate: .8, range: 1.14, weaponType: 'shield', shieldModel: 20, large: true },
    tank_maul: { n: 'Marreta de Cerco', cls: 'tanke', damage: 1.28, rate: .74, range: 1.2, weaponType: 'hammer', hammerModel: 11, large: true },
    tank_montante: { n: 'Montante Colossal', cls: 'tanke', damage: 1.25, rate: .78, range: 1.25, weaponType: 'sword', swordModel: 24, large: true }
  };
  const ELEMENTS = {
    fogo: { n: 'Fogo', color: '#ff815b', strong: ['skeleton', 'brute', 'lorde', 'titan'] },
    gelo: { n: 'Gelo', color: '#9de8ff', strong: ['wolf', 'bat', 'brute'] },
    raio: { n: 'Raio', color: '#ffe36d', strong: ['bat', 'mage', 'arquimago'] },
    natureza: { n: 'Natureza', color: '#8ee28b', strong: ['slime', 'wolf', 'matriarca'] },
    arcano: { n: 'Arcano', color: '#c4a2ff', strong: ['skeleton', 'mage', 'boss'] }
  };
  const ULTIMATES = {
    tempestade: { name: 'Tempestade Astral', icon: '✧', description: 'Dobra o dano por 8 segundos. Recarga: 40 segundos.' },
    guardiao: { name: 'Bastião Imortal', icon: '⬡', description: 'Recupera 60% da vida e bloqueia dano por 3 segundos.' },
    cataclismo: { name: 'Cataclismo', icon: '✹', description: 'Desfere uma explosão elemental devastadora ao redor.' }
  };
  if (!RACES[cust.race]) cust.race = 'humano';
  if (!CLASSES[cust.cls]) cust.cls = 'guerreiro';
  const defaultWeapon = cls => ({ guerreiro: 'espada', mago: 'cajado', arqueiro: 'arco', paladino: 'martelo', druida: 'totem', assassino: 'hidden_blade', ninja: 'ninja_katana', tanke: 'tank_bulwark' }[cls]);
  const CLASS_STARTING_LOOK = {
    guerreiro: { armorType: 'cota', armor: '#425f69', cape: '#8c3a3a', trim: '#c7a65c', style: 1, capeStyle: 'longa', emblem: 'sol' },
    mago: { armorType: 'runica', armor: '#3d4d7b', cape: '#352e62', trim: '#b69cff', style: 0, capeStyle: 'longa', emblem: 'runa' },
    arqueiro: { armorType: 'couro', armor: '#3f6b45', cape: '#294738', trim: '#a6c77a', style: 4, capeStyle: 'curta', emblem: 'lua' },
    paladino: { armorType: 'placas', armor: '#b69b55', cape: '#e6dfc9', trim: '#f4cf79', style: 1, capeStyle: 'longa', emblem: 'sol' },
    druida: { armorType: 'runica', armor: '#496a42', cape: '#2f5738', trim: '#a6c77a', style: 0, capeStyle: 'esfarrapada', emblem: 'runa' },
    assassino: { armorType: 'couro', armor: '#4a3025', cape: '#e4e0d6', trim: '#9d2633', style: 0, capeStyle: 'longa', emblem: 'lua', scars: 'guerra' },
    ninja: { armorType: 'couro', armor: '#111318', cape: '#090b0f', trim: '#b52e3b', style: 4, capeStyle: 'curta', emblem: 'nenhum' },
    tanke: { armorType: 'placas', armor: '#555b66', cape: '#2c3e6b', trim: '#c7a65c', style: 1, capeStyle: 'curta', emblem: 'sol' }
  };
  if (!ARMORS[cust.armorType]) cust.armorType = 'cota';
  if (!WEAPONS[cust.weapon] || WEAPONS[cust.weapon].cls !== cust.cls) cust.weapon = defaultWeapon(cust.cls);
  if (!ELEMENTS[cust.element]) cust.element = 'fogo';
  if (!ULTIMATES[cust.ultimate]) cust.ultimate = null;
  const STARTER_BLESSINGS = {
    vitality:{icon:'♥',name:'Vigor Ancestral',detail:'+30% de vida máxima'},
    fury:{icon:'⚔',name:'Fúria Solar',detail:'+15% de dano causado'},
    stride:{icon:'➶',name:'Passos do Vento',detail:'+12% velocidade de corrida'},
    shield:{icon:'⬡',name:'Proteção do Guardião',detail:'-15% dano e exposição elemental'},
    focus:{icon:'✦',name:'Fonte dos Magos',detail:'+35% de mana máxima'}
  };
  if(!Array.isArray(cust.boons))cust.boons=[];
  const starterBoon=id=>cust.boons.includes(id);

  const hpMul = () => RACES[cust.race].hp * CLASSES[cust.cls].hp * ARMORS[cust.armorType].hp * (starterBoon('vitality') ? 1.30 : 1);
  const foMul = () => RACES[cust.race].fo * CLASSES[cust.cls].fo * (starterBoon('focus') ? 1.35 : 1);
  const dmMul = () => RACES[cust.race].dm * CLASSES[cust.cls].dm * WEAPONS[cust.weapon].damage * (starterBoon('fury') ? 1.15 : 1) * (player.relics.mimicWeapon ? 1.28 : 1);
  const spMul = () => RACES[cust.race].sp * CLASSES[cust.cls].sp * ARMORS[cust.armorType].speed * (starterBoon('stride') ? 1.12 : 1);
  const xpMul = () => RACES[cust.race].xp;
  const atkMul = () => CLASSES[cust.cls].atk * WEAPONS[cust.weapon].rate, rangeMul = () => CLASSES[cust.cls].rng * WEAPONS[cust.weapon].range, dmgClass = () => CLASSES[cust.cls].dc;

  const pShots = [];
  function pShoot(a, spd, dmg, kind, pierce, life) {
    pShots.push({ x: player.x + Math.cos(a) * 14, y: player.y + Math.sin(a) * 14, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, a, dmg, kind, pierce, life, hit: new Set() });
  }
  function relicProjectiles() {
    const a = player.angle, level = player.relics;
    if (level.boneVolley) pShoot(a, 680, damageOf() * (.34 + level.boneVolley * .08), 'bone', 2 + level.boneVolley, .95);
    if (level.crystalShards) for (const offset of [-.16, 0, .16]) pShoot(a + offset, 620, damageOf() * (.24 + level.crystalShards * .05), 'shard', 0, .85);
    if (level.firebrand) pShoot(a, 430, damageOf() * (.55 + level.firebrand * .1), 'fireball', 0, 1.45);
  }
  function classAttack() {
    const c = cust.cls;
    if (c !== 'mago' && c !== 'arqueiro' && c !== 'druida' && c !== 'ninja') return false;
    if (player.dead || player.attackCd > 0 || paused) return true;
    if (c !== 'ninja') autoAim();
    const weapon = WEAPONS[cust.weapon];
    player.attackCd = (c === 'mago' ? .42 : (c === 'druida' ? .38 : c === 'ninja' ? .36 : .27)) / weapon.rate;
    player.kx -= Math.cos(player.angle) * 70; player.ky -= Math.sin(player.angle) * 70;
    if (c === 'mago') pShoot(player.angle, 540, damageOf() * 1.1, 'mago', 0, 1.1 * weapon.range);
    else if (c === 'druida') pShoot(player.angle, 600, damageOf() * .96, 'druida', 0, 1.05 * weapon.range);
    else if (c === 'ninja') {
      pShoot(player.angle, 820, damageOf() * .9, 'kunai', 0, 1.2 * weapon.range);
      pShoot(player.angle - .12, 680, damageOf() * .62, 'shuriken', 0, 1.05 * weapon.range);
      pShoot(player.angle + .12, 680, damageOf() * .62, 'shuriken', 0, 1.05 * weapon.range);
    }
    else pShoot(player.angle, 740, damageOf() * .85, 'arqueiro', 1, .8 * weapon.range);
    relicProjectiles();
    sfx('swing'); return true;
  }
  function classSkill() {
    const K = CLASSES[cust.cls];
    if (player.skillCd > 0) return;
    if (player.focus < K.cost) { showToast('Foco insuficiente'); return; }
    player.focus -= K.cost; player.skillCd = K.cd; player.invuln = Math.max(player.invuln, .25);
    autoAim();
    const d = damageOf(), hitAll = (rad, mul, kb) => { for (const e of enemies) if (!e.dead && Math.hypot(e.x - player.x, e.y - player.y) < rad + e.t.r) damageEnemy(e, d * mul, { kb, skill: true }); };
    if (cust.cls === 'mago') { ring(player.x, player.y, '#b69cff', 44, 380); burst(player.x, player.y, 26, { color: ['#b69cff', '#fff'], speed: 300, life: .7, size: 3.4, glow: true }); shake(9); sfx('skill'); hitAll(190, 2.2, 640); }
    else if (cust.cls === 'arqueiro') { for (let k = -3; k <= 3; k++) pShoot(player.angle + k * .13, 760, d * .9, 'arqueiro', 3, .9); sfx('skill'); }
    else if (cust.cls === 'druida') {
      const healAmount = Math.round(maxHpOf() * .18);
      player.hp = Math.min(maxHpOf(), player.hp + healAmount);
      floatText(player.x, player.y - 34, `+${healAmount}`, '#9fe8b5', 18);
      ring(player.x, player.y, '#8ee28b', 42, 330); burst(player.x, player.y, 24, { color: ['#8ee28b', '#d7ffc8'], speed: 240, life: .7, size: 3, glow: true });
      sfx('skill'); hitAll(165, 1.55, 520);
    }
    else if (cust.cls === 'ninja') {
      for (let k = -3; k <= 3; k++) pShoot(player.angle + k * .12, 780, d * .72, 'shuriken', 0, 1.1);
      ring(player.x, player.y, '#d9e7ee', 24, 170); sfx('skill');
    }
    else if (cust.cls === 'assassino') {
      player.dashX = Math.cos(player.angle); player.dashY = Math.sin(player.angle); player.dashT = .16;
      player.invuln = Math.max(player.invuln, .5); burst(player.x, player.y, 18, { color: ['#c4a2ff', '#fff'], speed: 210, life: .45, size: 3, glow: true });
      for (const e of enemies) {
        if (e.dead) continue;
        const dx = e.x - player.x, dy = e.y - player.y, dist = Math.hypot(dx, dy);
        if (dist < 205 + e.t.r && angDiff(Math.atan2(dy, dx), player.angle) < .62) damageEnemy(e, d * 2.05, { kb: 480, skill: true, finisher: true });
      }
      shake(8); sfx('skill');
    }
    else { const h = Math.round(maxHpOf() * .28); player.hp = Math.min(maxHpOf(), player.hp + h); floatText(player.x, player.y - 34, `+${h}`, '#9fe8b5', 18); ring(player.x, player.y, '#ffe28a', 40, 330); burst(player.x, player.y, 24, { color: ['#ffe28a', '#fff4c4'], speed: 260, life: .8, size: 3.4, glow: true }); shake(10); sfx('level'); hitAll(150, 1.7, 620); }
  }
  function updatePShots(dt) {
    updateList(pShots, s => {
      s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.life <= 0 || (dun && (s.x < 0 || s.x > world.width || s.y > world.height || s.y < FLOOR_TOP - 20))) return false;
      for (const e of enemies) {
        if (e.dead || s.hit.has(e) || Math.hypot(e.x - s.x, e.y - s.y) > e.t.r + 8) continue;
        s.hit.add(e); damageEnemy(e, s.dmg, { kb: 220 });
        if (s.kind !== 'arqueiro') { burst(s.x, s.y, 10, { color: [ELEMENTS[cust.element].color, '#fff'], speed: 160, life: .3, size: 3, glow: true }); return false; }
        if (s.pierce-- <= 0) return false;
      }
      if (Math.random() < dt * 40) addParticle({ x: s.x, y: s.y, vx: 0, vy: 0, life: .25, max: .25, size: 3, color: s.kind === 'mago' ? '#b69cff' : '#e8e0c0', drag: 0, glow: s.kind === 'mago', shrink: true });
      return true;
    });
  }
  function drawPShots() {
    for (const s of pShots) {
      ctx.save();
      if (s.kind === 'bone') {
        ctx.translate(s.x, s.y); ctx.rotate(s.a); ctx.strokeStyle = '#e8dfc8'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-13, 0); ctx.quadraticCurveTo(-5, -3, 4, 0); ctx.quadraticCurveTo(10, 3, 14, 0); ctx.stroke();
        ctx.fillStyle = '#fff6df'; ctx.beginPath(); ctx.arc(-11, 0, 3.2, 0, TAU); ctx.arc(13, 0, 2.5, 0, TAU); ctx.fill();
      } else if (s.kind === 'shard') {
        ctx.translate(s.x, s.y); ctx.rotate(s.a); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#b6e7fd'; ctx.shadowColor = '#8edaff'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.moveTo(11, 0); ctx.lineTo(-5, -4); ctx.lineTo(-10, 0); ctx.lineTo(-5, 4); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(-2, -1, 8, 2);
      } else if (s.kind === 'fireball') {
        ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#ff7546aa'; ctx.beginPath(); ctx.arc(s.x, s.y, 16, 0, TAU); ctx.fill();
        ctx.fillStyle = '#ff8a3d'; ctx.beginPath(); ctx.arc(s.x, s.y, 7, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff2a0'; ctx.beginPath(); ctx.arc(s.x - 2, s.y - 2, 3, 0, TAU); ctx.fill();
      } else if (s.kind === 'kunai') {
        ctx.translate(s.x, s.y); ctx.rotate(s.a); ctx.shadowColor = '#b5d5e4'; ctx.shadowBlur = 7;
        ctx.fillStyle = '#dce8ed'; ctx.strokeStyle = '#384b58'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(-5, -4); ctx.lineTo(-10, 0); ctx.lineTo(-5, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#8c3038'; ctx.beginPath(); ctx.arc(-12, 0, 3, 0, TAU); ctx.fill();
      } else if (s.kind === 'shuriken') {
        ctx.translate(s.x, s.y); ctx.rotate(s.a + visualTime * 5); ctx.shadowColor = '#d8e8ef'; ctx.shadowBlur = 6;
        ctx.fillStyle = '#d7e1e5'; ctx.strokeStyle = '#41525c'; ctx.lineWidth = 1.2; ctx.beginPath();
        for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 3 : 11; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#7a2931'; ctx.beginPath(); ctx.arc(0, 0, 2, 0, TAU); ctx.fill();
      } else if (s.kind !== 'arqueiro') {
        ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = ELEMENTS[cust.element].color + '66'; ctx.beginPath(); ctx.arc(s.x, s.y, 13, 0, TAU); ctx.fill();
        ctx.fillStyle = ELEMENTS[cust.element].color; ctx.beginPath(); ctx.arc(s.x, s.y, 6, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x, s.y, 3, 0, TAU); ctx.fill();
      } else {
        ctx.translate(s.x, s.y); ctx.rotate(s.a); ctx.strokeStyle = '#d9cfa8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(8, 0); ctx.stroke();
        ctx.fillStyle = '#e8eef0'; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(6, -3.5); ctx.lineTo(6, 3.5); ctx.fill();
        ctx.fillStyle = '#c0504a'; ctx.fillRect(-16, -2.5, 4, 5);
      }
      ctx.restore();
    }
  }
  const FIRE_POS = [[740, 1240], [1650, 1500]];
  function drawFires() {
    if (dun) return;
    for (const [x, y] of FIRE_POS) {
      if (x < camera.x - 150 || x > camera.x + camera.width / camera.scale + 150 || y < camera.y - 150 || y > camera.y + camera.height / camera.scale + 150) continue;
      const fl = .75 + .25 * Math.sin(gameTime * 10 + x);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(x, y, 4, x, y, 150); g.addColorStop(0, 'rgba(255,170,70,.32)'); g.addColorStop(1, 'rgba(255,170,70,0)');
      ctx.fillStyle = g; ctx.fillRect(x - 150, y - 150, 300, 300);
      ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.ellipse(x, y - 6, 7 * fl, 14 * fl, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffe28a'; ctx.beginPath(); ctx.ellipse(x, y - 4, 3.5 * fl, 8 * fl, 0, 0, TAU); ctx.fill();
      ctx.restore();
      if (Math.random() < .12) addParticle({ x: x + rand(-4, 4), y: y - 12, vx: rand(-8, 8), vy: -50, life: 1, max: 1, size: 1.8, color: '#ffb14a', drag: .5, glow: true, shrink: true });
    }
  }
  function syncHeroTag() {
    const t = document.querySelector('.hero-title small'); if (t) t.textContent = `${RACES[cust.race].n} ${CLASSES[cust.cls].n}`;
    if (el.hint) el.hint.textContent = cust.cls === 'ninja'
      ? 'WASD · mover  |  Clique esquerdo · kunai  |  Direito · katana  |  Q · habilidade  |  R · ultimate'
      : cust.cls === 'tanke'
        ? 'WASD · mover  |  Clique esquerdo · atacar  |  Segure direito ou B · bloquear com mana  |  Q · habilidade  |  R · ultimate'
        : 'WASD · mover  |  Clique esquerdo · atacar  |  Q · habilidade  |  R · ultimate';
    const sp = el.skillButton.querySelector('span'); if (sp) sp.textContent = CLASSES[cust.cls].icon;
    el.skillButton.setAttribute('aria-label', 'Habilidade: ' + CLASSES[cust.cls].n);
    if (el.blockButton) {
      el.blockButton.hidden = cust.cls !== 'tanke';
      el.blockButton.setAttribute('aria-label', 'Bloquear com mana (Tanke)');
      if (cust.cls !== 'tanke') setBlocking(false);
    }
  }

  /* ---------- herói: raça, classe e armas ---------- */
  const worldArtCache = new WeakMap();
  function paintHero(c, x, y, ang, walk) {
    const cs=cust;
    const sig=[cs.race,cs.cls,cs.skin,cs.hair,cs.hairStyle,cs.armor,cs.cape,cs.capeStyle,cs.armorType,cs.weapon,cs.trim,cs.glow,cs.emblem,cs.body,cs.style].join('|');
    let cached=worldArtCache.get(cs);
    if(!cached||cached.sig!==sig){
      const weapon=WEAPONS[cs.weapon]||{};
      const headMap={0:'capuz',1:'elmo',2:'nenhum',3:'coroa',4:'bandana',5:'chapeu'};
      const head=cs.cls==='ninja'&&cs.style===4?'ninja_mask':cs.cls==='assassino'&&cs.style===0?'assassin_hood_ref':headMap[cs.style]||'nenhum';
      const look={race:cs.race,cls:cs.cls,skin:cs.skin,hairColor:cs.hair,hairStyle:cs.hairStyle||'curto',beard:cs.beard||'nenhuma',head,capeStyle:cs.capeStyle,capeColor:cs.cape,armorType:cs.armorType,armorColor:cs.armor,trim:cs.trim,glow:cs.glow,eye:cs.eye,weapon:cs.weapon,body:cs.body,emblem:cs.emblem,mark:cs.scars,shoulders:cs.cls==='paladino'||cs.cls==='tanke'?'aco':'nenhum'};
      cached={sig,model:CharacterArt.makeModel(look,{race:cs.race,class:cs.cls,weaponKey:cs.weapon,weaponName:weapon.n,weaponType:weapon.weaponType,shieldModel:weapon.shieldModel,hammerModel:weapon.hammerModel,swordModel:weapon.swordModel,large:weapon.large})};worldArtCache.set(cs,cached);
    }
    const dir=CharacterArt.viewAngle(ang);
    c.save();c.translate(x,y+20);c.scale(.78,.78);
    const swing=player.swing;
    const swingProgress=swing?Math.max(0,Math.min(1,swing.t/Math.max(.01,swing.dur||.3))):0;
    const swingWave=swing?Math.sin(swingProgress*Math.PI):0;
    CharacterArt.draw(c,cached.model,{t:visualTime,ph:walk,mv:Math.min(1,Math.abs(player.motion??1)),view:dir.view,flip:dir.flip,seed:player.level||1,blocking:player.blocking,atkP:swing?1-swingProgress:0,wa:swing?-1.35+swingWave*(swing.dir||1)*2.05:null,reach:swing?11+swingWave*4:null});
    c.restore();
  }

  function drawHero() {
    if (player.dead) return;
    ctx.save();
    if (player.hurt > 0 && Math.floor(gameTime * 24) % 2) ctx.globalAlpha = .55; else if (player.dashT > 0) ctx.globalAlpha = .75;
    const shadow = ctx.createRadialGradient(player.x + 2, player.y + 8, 2, player.x + 2, player.y + 8, 23);
    shadow.addColorStop(0, 'rgba(11,25,19,.58)'); shadow.addColorStop(1, 'rgba(11,25,19,0)');
    ctx.fillStyle = shadow; ctx.beginPath(); ctx.ellipse(player.x + 2, player.y + 9, 23, 14, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const aura = ctx.createRadialGradient(player.x, player.y, 3, player.x, player.y, 34);
    aura.addColorStop(0, ELEMENTS[cust.element].color + '20'); aura.addColorStop(1, ELEMENTS[cust.element].color + '00');
    ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(player.x, player.y, 34, 0, TAU); ctx.fill(); ctx.restore();
    ctx.save();ctx.translate(player.x,player.y);ctx.scale(1.28,1.28);paintHero(ctx,0,0,player.angle,player.walk);ctx.restore();
    if (player.blocking) {
      ctx.strokeStyle = `rgba(143,232,255,${.48 + .16 * Math.sin(gameTime * 8)})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(player.x, player.y, 34 + Math.sin(gameTime * 8) * 2, 0, TAU); ctx.stroke();
    }
    if (player.flash > 0) { ctx.globalAlpha = Math.min(1, player.flash * 3); ctx.fillStyle = '#fff1b2'; ctx.beginPath(); ctx.arc(player.x, player.y, 22, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = .85; ctx.textAlign = 'center'; ctx.font = '700 11px Rajdhani, sans-serif'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(8,12,10,.8)';
    ctx.strokeText(cust.name, player.x, player.y - 50); ctx.fillStyle = '#f4efe0'; ctx.fillText(cust.name, player.x, player.y - 50);
    ctx.restore();
  }

  /* ---------- painel: criação de personagem ---------- */
  const PAL = {
    armor: ['#425f69', '#6b4a8f', '#8a3b3b', '#3f6b45', '#7a6a3a', '#555b66', '#2c3e6b'],
    cape: ['#8c3a3a', '#785c38', '#3a5f8c', '#5a3a8c', '#2f6b4a', '#c9a13b', '#1d1d26'],
    hair: ['#3b2a20', '#d9b66a', '#a8402a', '#e8e8e8', '#1b1b1b', '#6a4fa8', '#2e7d8c'],
    eye: ['#3a2a1c', '#273b7a', '#5a1b24', '#7a4a1d', '#91e6d0', '#e8e8e8'],
    glow: ['#9fe8ff', '#ffd27a', '#ff8a7a', '#b69cff', '#9fffa8', '#ffffff']
  };
  const PAL_LABEL = { armor: 'Armadura', cape: 'Capa', hair: 'Cabelo / barba', glow: 'Brilho da arma', trim: 'Acabamento / metal' };
  PAL_LABEL.eye = 'Olhos';
  PAL.trim=['#c7a65c','#e0e2e5','#bd7955','#62bbaf','#a97bdb','#444951'];
  const sws = (k, list) => list.map(c => `<button type="button" class="sw" data-k="${k}" data-c="${c}" style="background:${c}" aria-label="${k} ${c}"></button>`).join('');
  const panel = $('#customPanel');
  panel.innerHTML = `<div class="cp-card" role="dialog" aria-label="Criação de personagem"><div class="cp-head"><strong>CRIAÇÃO DE PERSONAGEM</strong><button type="button" id="cpClose">Confirmar ✓</button></div><div class="cp-body"><div class="cp-left"><canvas id="cpPreview" width="180" height="200"></canvas><div class="cp-stats" id="cpStats"></div></div><div class="cp-opts"><label>Nome<input id="cpName" maxlength="14" autocomplete="off"></label><div class="cp-row"><span>Raça</span><div class="cards">${Object.keys(RACES).map(k => `<button type="button" class="card" data-race="${k}"><b>${RACES[k].n}</b><small>${RACES[k].d}</small></button>`).join('')}</div></div><div class="cp-row"><span>Classe e arma</span><div class="cards">${Object.keys(CLASSES).map(k => `<button type="button" class="card" data-cls="${k}"><b>${CLASSES[k].n} · ${CLASSES[k].w}</b><small>${CLASSES[k].d}</small></button>`).join('')}</div></div><div class="cp-row"><span>Pele</span><div id="skinSw"></div></div>${Object.keys(PAL).map(k => `<div class="cp-row"><span>${PAL_LABEL[k]}</span><div>${sws(k, PAL[k])}</div></div>`).join('')}<div class="cp-row"><span>Visual da cabeça</span><div>${['Capuz', 'Elmo', 'Cabelo'].map((n, i) => `<button type="button" class="st" data-s="${i}">${n}</button>`).join('')}</div></div></div></div></div>`;
  const cpName = $('#cpName'), cpCtx = $('#cpPreview').getContext('2d');
    panel.querySelector('.cp-opts').insertAdjacentHTML('beforeend', '<div class="cp-row gear-row"><label>Armadura<select id="cpArmor"></select></label><label>Arma<select id="cpWeapon"></select></label><label>Elemento<select id="cpElement"></select></label></div>');
    panel.querySelector('.cp-opts').insertAdjacentHTML('beforeend', `<div class="gear-row detail-row">
    <label>Penteado<select id="cpHairStyle"><option value="curto">Curto</option><option value="longo">Longo</option><option value="moicano">Moicano</option><option value="tranca">Trança</option></select></label>
    <label>Barba<select id="cpBeard"><option value="nenhuma">Nenhuma</option><option value="bigode">Bigode</option><option value="cavanhaque">Cavanhaque</option><option value="cheia">Cheia</option><option value="longa">Longa</option></select></label>
    <label>Capa<select id="cpCapeStyle"><option value="longa">Longa</option><option value="curta">Curta</option><option value="esfarrapada">Esfarrapada</option><option value="sem">Sem capa</option></select></label>
    <label>Constituição<select id="cpBody"><option value="medio">Média</option><option value="robusto">Robusta</option><option value="esguio">Esbelta</option></select></label>
    <label>Emblema<select id="cpEmblem"><option value="sol">Sol</option><option value="lua">Lua</option><option value="runa">Runa</option><option value="dragao">Dragao</option><option value="nenhum">Nenhum</option></select></label>
    <label>Cicatrizes<select id="cpScars"><option value="nenhuma">Nenhuma</option><option value="guerra">Batalha</option><option value="antiga">Antiga</option><option value="runas">Runas</option><option value="tribal">Tribal</option><option value="sardas">Sardas</option></select></label>
    </div>`);
    panel.querySelector('.cp-opts').insertAdjacentHTML('beforeend',`<div class="cp-row cp-blessing"><span>✦ BÊNÇÃOS OPCIONAIS · escolha até 2</span><div class="blessing-list" id="cpBlessings">${Object.entries(STARTER_BLESSINGS).map(([id,b])=>`<button class="blessing-btn" type="button" data-blessing="${id}"><span>${b.icon}</span><strong>${b.name}</strong><small>${b.detail}</small></button>`).join('')}</div></div>`);

    const cpArmor = $('#cpArmor'), cpWeapon = $('#cpWeapon'), cpElement = $('#cpElement');
    cpArmor.innerHTML = Object.entries(ARMORS).map(([id, item]) => `<option value="${id}">${item.n}</option>`).join('');
    cpElement.innerHTML = Object.entries(ELEMENTS).map(([id, item]) => `<option value="${id}">${item.n}</option>`).join('');
  function drawPreview(now) {
    if (panel.hidden) { panel.dataset.previewRunning=''; return; }
    const c = cpCtx; c.clearRect(0, 0, 180, 200);
    const g = c.createRadialGradient(90, 120, 10, 90, 120, 100); g.addColorStop(0, 'rgba(244,207,121,.22)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, 180, 200);
    c.save(); c.translate(90, 128); c.scale(2.6, 2.6);
    c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(1, 9, 16, 8, 0, 0, TAU); c.fill();
     // The preview should face the player; keep the angle inside the front-view band.
     paintHero(c, 0, 0, Math.PI / 2 + Math.sin(now / 900) * .22, now / 140);
    c.restore();
    if (!panel.hidden) requestAnimationFrame(drawPreview);
  }
  function refreshPanel() {
    cpName.value = cust.name;
    $('#skinSw').innerHTML = sws('skin', RACES[cust.race].skin);
    panel.querySelectorAll('.sw').forEach(b => b.classList.toggle('on', cust[b.dataset.k] === b.dataset.c));
    panel.querySelectorAll('.st').forEach(b => b.classList.toggle('on', cust.style === +b.dataset.s));
    panel.querySelectorAll('[data-race]').forEach(b => b.classList.toggle('on', cust.race === b.dataset.race));
    panel.querySelectorAll('[data-cls]').forEach(b => b.classList.toggle('on', cust.cls === b.dataset.cls));
    cpArmor.value = cust.armorType;
    for (const [id,key] of [['cpHairStyle','hairStyle'],['cpBeard','beard'],['cpCapeStyle','capeStyle'],['cpBody','body'],['cpEmblem','emblem'],['cpScars','scars']]) {
      const field=$('#'+id); if (field) field.value=cust[key] || field.options[0].value;
    }
    cpElement.value = cust.element;
    cpWeapon.innerHTML = Object.entries(WEAPONS).filter(([, item]) => item.cls === cust.cls).map(([id, item]) => `<option value="${id}">${item.n}</option>`).join('');
    cpWeapon.value=cust.weapon;
    panel.querySelectorAll('[data-blessing]').forEach(b=>{const active=starterBoon(b.dataset.blessing);b.classList.toggle('on',active);b.setAttribute('aria-pressed',String(active));});
    $('#cpStats').innerHTML = `<b>${RACES[cust.race].n} ${CLASSES[cust.cls].n}</b><span>${WEAPONS[cust.weapon].n} · ${ARMORS[cust.armorType].n}</span><span>Vida ${maxHpOf()} · Foco ${maxFocusOf()}</span><span>Dano ${damageOf()} · Vel. ${Math.round(235 * spMul())} · Defesa ${Math.round(ARMORS[cust.armorType].guard * 100)}%</span><span>${ELEMENTS[cust.element].n}: ${cust.element === 'fogo' ? 'queima' : cust.element === 'gelo' ? 'desacelera' : cust.element === 'raio' ? 'salta entre alvos' : cust.element === 'natureza' ? 'recupera vida' : 'recupera foco'}</span><span>Habilidade: ${CLASSES[cust.cls].icon} (${CLASSES[cust.cls].cost} foco)</span>`;
    syncHeroTag();
  }
  function togglePanel(open) {
    panel.hidden = !open;
    if (open) { paused = true; refreshPanel(); if (!panel.dataset.previewRunning) { panel.dataset.previewRunning='1';requestAnimationFrame(drawPreview); } }
    else { paused = pendingLevelChoices.length > 0; cust.created = true; saveExp(); }
  }
  panel.addEventListener('click', ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.id === 'cpClose') { togglePanel(false); return; }
    if(b.dataset.blessing){
      if(cust.created){showToast('Bênçãos iniciais só podem ser trocadas entre jornadas');return;}
      const id=b.dataset.blessing;
      if(starterBoon(id))cust.boons=cust.boons.filter(x=>x!==id);
      else if(cust.boons.length<2)cust.boons.push(id);
      else{showToast('Máximo de duas bênçãos iniciais');return;}
      player.hp=maxHpOf();player.focus=maxFocusOf();refreshPanel();saveExp();return;
    }
    if (b.dataset.race) { cust.race = b.dataset.race; cust.skin = RACES[cust.race].skin[0]; }
    else if (b.dataset.cls) {
      cust.cls = b.dataset.cls;
      cust.weapon = defaultWeapon(cust.cls);
      Object.assign(cust, CLASS_STARTING_LOOK[cust.cls]);
    }
    else if (b.classList.contains('sw')) cust[b.dataset.k] = b.dataset.c;
    else if (b.classList.contains('st')) cust.style = +b.dataset.s;
    else return;
    player.hp = Math.min(player.hp, maxHpOf()); player.focus = Math.min(player.focus, maxFocusOf());
    refreshPanel(); saveExp();
  });
  cpArmor.addEventListener('change', () => { cust.armorType = cpArmor.value; player.hp = Math.min(player.hp, maxHpOf()); refreshPanel(); saveExp(); });
  cpWeapon.addEventListener('change', () => { cust.weapon = cpWeapon.value; refreshPanel(); saveExp(); });
  cpElement.addEventListener('change', () => { cust.element = cpElement.value; refreshPanel(); saveExp(); });
  for (const [id,key] of [['cpHairStyle','hairStyle'],['cpBeard','beard'],['cpCapeStyle','capeStyle'],['cpBody','body'],['cpEmblem','emblem'],['cpScars','scars']]) {
    $('#'+id).addEventListener('change', ev => {cust[key]=ev.target.value;refreshPanel();saveExp();});
  }
  cpName.addEventListener('input', () => { cust.name = cpName.value.trim() || 'Aventureiro'; $('#heroName').textContent = cust.name; });
  panel.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Escape' && cust.created) togglePanel(false); });
  $('#customBtn').addEventListener('click', () => togglePanel(panel.hidden));
  syncHeroTag();
  if (!cust.created) togglePanel(true);


  /* ---------- NPCs, comportamento, diálogos e explorações infinitas ---------- */
  const NPC_ROLES = {
    healer: { name:'Elyra, Curandeira',col:'#8fe4af',lines:['O abismo cresce a cada onda.','#LIGHT','Posso curar suas feridas por 40 moedas.'] },
    merchant: { name:'Dorin, Mercador',col:'#ebce85',lines:['As estradas mudam, os preços não!','Poção por 55 moedas.'] },
    scout: { name:'Kael, Explorador',col:'#9cc4ee',lines:['Estas terras não têm fim.','Inimigos distantes possuem resistências elementais.','Cada nova onda traz elites mais perigosas.'] },
    blacksmith: { name:'Brakka, Ferreira',col:'#f6a781',lines:['Venha, afio sua arma por 80 moedas.','Um fio bom vale mais do que cem promessas.'] },
    bard: { name:'Nim, Menestrel',col:'#c9b5f8',lines:['Que sua lenda atravesse estas dunas!','Por 30 moedas, lhe dou uma canção de poder.'] },
    alchemist:{name:'Ivara, Alquimista',col:'#d2a3fa',lines:['As águas mudam entre os biomas.','Uma poção por 50 moedas.']},
    ranger:{name:'Tarek, Batedor',col:'#aedf8e',lines:['Cada terreno tem os seus próprios monstros.','Confira no diário onde estão as masmorras.']},
    sage:{name:'Orryn, Sábio',col:'#acd5f0',lines:['Existem nove biomas; cada um esconde perigos únicos.','Não subestime o poder de uma bênção inicial.']},
    guardian:{name:'Dagna, Guardiã',col:'#e0bd82',lines:['Minha armadura segura a linha de frente.','Vou proteger sua jornada por 120 moedas.']},
    mage:{name:'Lio, Arcanista',col:'#c4a2ff',lines:['Meus feitiços alcançam inimigos distantes.','Uma boa companhia também precisa de magia.']}
  };
  const homeNpcs = [
    {x:785,y:1194,role:'merchant',seed:1}, {x:707,y:1175,role:'bard',seed:2},
    {x:1692,y:985,role:'healer',seed:3}, {x:1650,y:1474,role:'scout',seed:4},
    {x:1702,y:1464,role:'blacksmith',seed:5}, {x:995,y:2052,role:'scout',seed:6},
    {x:2675,y:1550,role:'merchant',seed:7}, {x:3070,y:567,role:'healer',seed:8},
    {x:1020,y:835,role:'guardian',seed:9}, {x:1050,y:925,role:'mage',seed:10}
  ];
  const companions = [];
  const recruitableRoles = new Set(['scout','ranger','blacksmith','healer','bard','sage','guardian','mage']);
  const rangedCompanionRoles = new Set(['scout','ranger','sage','mage']);
  const companionLimit = 3;
  const companionCost = 120;
  let npcSpeakUntil=0, npcSpeakText='', npcSpeakNpc=null, interactCooldown=0;
  function openDialogue(speaker, text, caption, cutscene = false) {
    const dialog = $('#npcDialogue');
    if (!dialog) return;
    dialog.querySelector('.dialogue-eyebrow').textContent = cutscene ? 'CENA DE HISTÓRIA' : 'TERRAS LIVRES · ENCONTRO';
    dialog.querySelector('strong').textContent = speaker;
    dialog.querySelector('p').textContent = text;
    dialog.querySelector('.dialogue-caption').textContent = caption;
    dialog.dataset.cutscene = String(cutscene);
    dialog.hidden = false;
    dialogueActive = true;
    el.explorer.classList.add('in-dialogue');
  }
  function showCutscene(speaker, text, caption) {
    openDialogue(speaker, text, caption, true);
  }
  function closeDialogue() {
    const dialog = $('#npcDialogue');
    if (!dialog || dialog.hidden) return;
    dialog.hidden = true;
    dialogueActive = false;
    el.explorer.classList.remove('in-dialogue');
  }
  function nearestNpc() {
    if (dun) return null;
    let nearest=null, dist=75;
    for (const n of [...homeNpcs, ...Array.from(worldChunks.values()).flatMap(c=>c.npcs)]) {
      const d=Math.hypot(n.x-player.x,n.y-player.y);
      if (d<dist) {dist=d;nearest=n;}
    }
    return nearest;
  }
  function npcMessage(n) {
    const info=NPC_ROLES[n.role], foes=enemies.filter(e=>!e.dead&&isRegular(e)&&Math.hypot(e.x-n.x,e.y-n.y)<380).length;
    if (foes>3) return 'Cuidado! Há '+foes+' criaturas por perto!';
    if (player.hp<maxHpOf()*.45) return 'Está ferido! Tenha cuidado em sua jornada.';
    if (wave>8) return 'Onda '+wave+'! Os monstros estão ficando mais ferozes.';
    return info.lines[Math.floor((Math.sin(gameTime/4+n.seed)+1)/2*info.lines.length)]?.replace('#LIGHT','A fogueira ilumina até as noites mais escuras.') || info.lines[0];
  }
  function updateCompanions(dt) {
    if (player.dead) return;
    for (let i = 0; i < companions.length; i++) {
      const n = companions[i], role = NPC_ROLES[n.role];
      n.attackCd = Math.max(0, (n.attackCd || 0) - dt);
      n.supportCd = Math.max(0, (n.supportCd || 0) - dt);
      if (n.swing) { n.swing.t += dt; if (n.swing.t >= n.swing.dur) n.swing = null; }
      const orbit = gameTime * .7 + i * TAU / companions.length;
      const anchorX = player.x + Math.cos(orbit) * 34, anchorY = player.y + Math.sin(orbit) * 25;
      const dx = anchorX - n.x, dy = anchorY - n.y, distance = Math.hypot(dx, dy) || 1;
      if (distance > 8) {
        const speed = distance > 150 ? 260 : 125;
        const step = Math.min(distance, speed * dt);
        n.x += dx / distance * step; n.y += dy / distance * step;
        n.angle = Math.atan2(dy, dx); n.walk = (n.walk || 0) + dt * (distance > 150 ? 11 : 7.5);
        n.motion = Math.min(1, speed / 235);
      } else { n.motion = 0; n.walk = (n.walk || 0) + dt * 1.5; }
      if (n.role === 'healer' && player.hp < maxHpOf() * .82 && n.supportCd <= 0 && Math.hypot(n.x-player.x,n.y-player.y) < 180) {
        const amount = Math.max(1, Math.round(maxHpOf() * .09));
        player.hp = Math.min(maxHpOf(), player.hp + amount);
        n.supportCd = 7;
        floatText(player.x, player.y - 36, `+${amount}`, '#9fe8b5', 15);
        burst(player.x, player.y, 9, { color: [role.col, '#e7ffe9'], speed: 100, life: .45, size: 2.8, glow: true });
      }
      const ranged = rangedCompanionRoles.has(n.role);
      let target = null, targetDistance = ranged ? 300 : 115;
      for (const enemy of enemies) {
        if (enemy.dead || enemy.type === 'dummy') continue;
        const d = Math.hypot(enemy.x - n.x, enemy.y - n.y);
        if (d < targetDistance) { targetDistance = d; target = enemy; }
      }
      if (target && n.attackCd <= 0) {
        n.attackCd = ranged ? 1.05 : 1.25;
        n.angle = Math.atan2(target.y - n.y, target.x - n.x);
        n.swing = { t: 0, dur: ranged ? .28 : .22, dir: i % 2 ? 1 : -1 };
        const companionDamage = damageOf() * (ranged ? .42 : .38);
        if (ranged) {
          const a = Math.atan2(target.y - n.y, target.x - n.x);
          const projectileKind = n.role === 'sage' || n.role === 'alchemist' ? 'mago' : 'arqueiro';
          pShots.push({ x: n.x + Math.cos(a) * 12, y: n.y + Math.sin(a) * 12 - 13, vx: Math.cos(a) * 760, vy: Math.sin(a) * 760, a, dmg: companionDamage, kind: projectileKind, pierce: 1, life: 1.2, hit: new Set(), companion: true });
        } else damageEnemy(target, companionDamage, { kb: 150, skill: true });
        burst(target.x, target.y, 6, { color: [role.col, '#fff3c6'], speed: 130, life: .3, size: 2.4, glow: true });
        if (ranged) { const a = Math.atan2(target.y - n.y, target.x - n.x); for (let k = -1; k <= 1; k++) addParticle({ x: n.x, y: n.y - 13, vx: Math.cos(a + k * .12) * 140, vy: Math.sin(a + k * .12) * 140, life: .35, max: .35, size: 2.2, color: role.col, drag: 3, glow: true, shrink: true }); }
      }
    }
  }
  function interactNpc() {
    if (paused || player.dead || interactCooldown>0) return;
    const n=nearestNpc(); if (!n) return;
    const info=NPC_ROLES[n.role]; interactCooldown=.5;
    let line=npcMessage(n);
    if (n.hired) {
      line = `${info.name.split(',')[0]} já está ao seu lado. Limite: ${companions.length}/${companionLimit} aliados.`;
    } else if (recruitableRoles.has(n.role) && companions.length < companionLimit && player.coins >= companionCost) {
      player.coins -= companionCost; n.hired = true; n.companion = true; n.attackCd = 1.2; companions.push(n);
      line = `${info.name.split(',')[0]} entrou para sua companhia! ${companions.length}/${companionLimit} aliados.`; sfx('level'); saveGame();
    } else if (recruitableRoles.has(n.role) && companions.length >= companionLimit) {
      line = `Sua companhia já tem ${companionLimit} aliados. Eles lutarão ao seu lado.`;
    } else if (recruitableRoles.has(n.role) && player.coins < companionCost) {
      line = `Para contratar ${info.name.split(',')[0]}, você precisa de ${companionCost} moedas.`;
    }
    const costs={healer:40,merchant:55,blacksmith:80,bard:30,alchemist:50};
    const price=costs[n.role];
    if (!n.hired && !recruitableRoles.has(n.role) && price && player.coins >= price) {
      if (n.role==='healer' && player.hp<maxHpOf()*.85) {player.coins-=price;player.hp=Math.min(maxHpOf(),player.hp+maxHpOf()*.7);line='Curado! As suas feridas estão fechadas.';sfx('potion');}
      else if (['merchant','alchemist'].includes(n.role) && player.potions<9) {player.coins-=price;player.potions++;line='Negócio feito! Uma poção para seu caminho.';sfx('coin');}
      else if (n.role==='blacksmith') {player.coins-=price;player.buff=Math.max(player.buff,90);line='Sua arma causa +18% de dano por 90 segundos.';sfx('crit');}
      else if (n.role==='bard') {player.coins-=price;player.buff=Math.max(player.buff,60);line='Uma canção de coragem! +18% dano por 60 segundos.';sfx('level');}
    } else if (!recruitableRoles.has(n.role) && price && player.coins<price) line='Sem moedas suficientes. Precisa de '+price+' moedas.';
    npcSpeakNpc=n;npcSpeakText=line;npcSpeakUntil=gameTime+4.5;
    const caption=n.hired?'ALIADO · acompanha e combate':recruitableRoles.has(n.role)?`Contratar: ${companionCost} ◈ · limite ${companionLimit}`:(price?`Serviço: ${price} ◈ · E para continuar`:'Explore e siga as trilhas');
    openDialogue(info.name,line,caption);
  }
  const npcArtCache = new WeakMap();
  function drawNpc(n) {
    const role=NPC_ROLES[n.role];
    ctx.save();ctx.translate(n.x,n.y);
    ctx.fillStyle='#081c16aa';ctx.beginPath();ctx.ellipse(0,10,16,7,0,0,TAU);ctx.fill();
    const profiles={
      healer:{race:'elfo',class:'Clérigo',armor:'runica',armorColor:'#e6e9db',capeColor:'#f1eee0',hairColor:'#d7c98e',hairStyle:'longo',head:'capuz',weapon:'maca',glow:'#a4f0c0'},
      merchant:{race:'humano',class:'guerreiro',armor:'couro',armorColor:'#765239',capeColor:'#6b4935',hairColor:'#4d3528',beard:'cheia',head:'capuz',weapon:'espada',glow:'#ffd27a'},
      scout:{race:'draconato',class:'arqueiro',armor:'couro',armorColor:'#466848',capeColor:'#294738',hairColor:'#477b68',head:'nenhum',weapon:'arco',glow:'#a5e18e'},
      blacksmith:{race:'anao',class:'Fighter',armor:'placas',armorColor:'#675d54',capeColor:'#513d30',hairColor:'#5b3927',beard:'cheia',head:'elmo',weapon:'machado',glow:'#ffac70'},
      guardian:{race:'anao',class:'Tanke',armor:'placas',armorColor:'#626a73',capeColor:'#344866',hairColor:'#5b3927',beard:'cheia',head:'elmo',weapon:'tank_bulwark',glow:'#b9e5ff'},
      mage:{race:'elfo',class:'Mago',armor:'runica',armorColor:'#66518f',capeColor:'#33294d',hairColor:'#d5d9de',head:'capuz',weapon:'cajado',glow:'#c4a2ff'},
      bard:{race:'humano',class:'druida',armor:'couro',armorColor:'#634b77',capeColor:'#49345f',hairColor:'#6a4b3b',head:'nenhum',weapon:'totem',glow:'#d0b7fa'},
      alchemist:{race:'tiefling',class:'Mago',armor:'runica',armorColor:'#59416d',capeColor:'#352840',hairColor:'#372b38',head:'capuz',weapon:'cajado',glow:'#d6a3fa'},
      ranger:{race:'kitsune',class:'arqueiro',armor:'couro',armorColor:'#4b6844',capeColor:'#334d36',hairColor:'#b87e4b',head:'nenhum',weapon:'arco',glow:'#b8e58e'},
      sage:{race:'elfo',class:'Mago',armor:'runica',armorColor:'#71879c',capeColor:'#41536f',hairColor:'#d5d9de',head:'capuz',weapon:'cajado',glow:'#acd5f0'}
    };
    let look=npcArtCache.get(n);if(!look){const profile=profiles[n.role]||profiles.scout;look=CharacterArt.makeModel(profile,{race:profile.race||'humano',class:profile.class||'arqueiro',seed:n.seed||1});npcArtCache.set(n,look)}
    const dir=CharacterArt.viewAngle(n.angle == null ? Math.PI / 2 : n.angle);
    const swing=n.swing;
    const swingProgress=swing?Math.max(0,Math.min(1,swing.t/Math.max(.01,swing.dur||.25))):0;
    const swingWave=swing?Math.sin(swingProgress*Math.PI):0;
    ctx.save();ctx.translate(0,20);ctx.scale(.82,.82);CharacterArt.draw(ctx,look,{t:visualTime,ph:n.walk||0,mv:n.motion||0,view:dir.view,flip:dir.flip,seed:n.seed||1,atkP:swing?1-swingProgress:0,wa:swing?-1.35+swingWave*(swing.dir||1)*2.05:null});ctx.restore();
    ctx.textAlign='center';ctx.font='bold 10px system-ui';ctx.fillStyle=n.companion?'#ffe29a':'#d9ffe1';ctx.fillText(n.companion?'⚔ ALIADO · '+role.name:'◆ '+role.name,0,-53);
    if (!n.companion && Math.hypot(player.x-n.x,player.y-n.y)<75) {ctx.font='bold 11px system-ui';ctx.fillStyle='#ffe29a';ctx.fillText('[E] CONVERSAR',0,-64);}
    ctx.restore();
  }
  function drawBubble(x,y,text,color) {
    if (!text) return;
    ctx.save();ctx.font='600 11px system-ui';ctx.textAlign='center';
    const width=Math.min(240,Math.max(54,ctx.measureText(text).width+20));
    ctx.fillStyle='rgba(12,20,24,.88)';ctx.strokeStyle=color;ctx.lineWidth=1;
    ctx.beginPath();ctx.roundRect(x-width/2,y-22,width,25,7);ctx.fill();ctx.stroke();
    ctx.fillStyle='#f5f2e8';ctx.fillText(text.slice(0,42),x,y-5);ctx.restore();
  }
  function drawConversations() {
    for (const e of enemies) if (!e.dead && e.speechT>0 && e.speech && Math.abs(e.x-player.x)<680 && Math.abs(e.y-player.y)<430) drawBubble(e.x,e.y-e.t.r-35,e.speech,e.elite?'#f8d375':e.t.color);
    if (npcSpeakUntil>gameTime && npcSpeakNpc) drawBubble(npcSpeakNpc.x,npcSpeakNpc.y-58,npcSpeakText.slice(0,40),NPC_ROLES[npcSpeakNpc.role].col);
  }
  function toggleAutoAttack() {
    if (dialogueActive) return;
    autoAttack=!autoAttack;
    const btn=$('#autoAttackBtn');if(btn){btn.setAttribute('aria-pressed',String(autoAttack));btn.textContent=autoAttack?'AUTO ✓':'AUTO ⚔';}
    showToast(autoAttack?'Ataque automático ativado':'Ataque automático desativado');
  }
  const autoBtn=$('#autoAttackBtn');if(autoBtn)autoBtn.addEventListener('click',toggleAutoAttack);
  window.addEventListener('keydown', ev => {
    if (dialogueActive) {
      if (['e','enter','escape'].includes(ev.key.toLowerCase())) { ev.preventDefault(); closeDialogue(); }
      return;
    }
    if(ev.key.toLowerCase()==='t' && !ev.repeat && panel.hidden && !paused) toggleAutoAttack();
    if(ev.key.toLowerCase()==='e' && !ev.repeat && panel.hidden && !paused) interactNpc();
  });
  const npcBtn=$('#interactButton');if(npcBtn) npcBtn.addEventListener('pointerdown',ev=>{ev.preventDefault();interactNpc();});
  const dialogClose=$('#dialogClose');if(dialogClose)dialogClose.addEventListener('click',closeDialogue);

  /* ---------- campanha / diário dos nove biomas ---------- */
  const journal=$('#biomeJournal'), resultOverlay=$('#runResult');
  function updateCampaignBoard(){
    const count=DUNS.filter(d=>cleared[d.id]).length;
    const total=$('#campaignCount');if(total)total.textContent=`${count}/${DUNS.length}`;
    const list=$('#biomeList');if(!list)return;
    list.innerHTML=DUNS.map(d=>`<div class="biome-entry ${cleared[d.id]?'done':''}"><span class="biome-icon">${chunkPalettes[d.biome].icon}</span><div><strong>${d.name}</strong><small>${chunkPalettes[d.biome].name} · Nv ${d.lv}${cleared[d.id]?' · PURIFICADA':' · PENDENTE'}</small></div><button type="button" data-travel="${d.id}" ${cleared[d.id]?'disabled':''}>${cleared[d.id]?'✓':'Viajar ↗'}</button></div>`).join('');
    const caption=$('#biomeSummary');if(caption)caption.textContent=`${count} de ${DUNS.length} masmorras purificadas · ${Object.keys(chunkPalettes).length} biomas`;
  }
  function showRunEnd(victory=false){
    if(!resultOverlay)return;
    paused=true;resultOverlay.hidden=false;
    $('#runTitle').textContent=victory?'LENDÁRIO · O ABISMO CAIU':'SUA JORNADA TERMINOU';
    $('#runDesc').textContent=victory?`Todos os ${DUNS.length} santuários purificados. Uma nova lenda nasceu!`:`Você chegou à onda ${wave} e purificou ${DUNS.filter(d=>cleared[d.id]).length} masmorras. Cada morte encerra a campanha.`;
  }
  function restartToCreation(){
    if(dun){enemies.length=0;solids.length=0;solids.push(...owSolids);owSolids=[];owEnemies=[];world.width=OW.w;world.height=OW.h;dun=null;ow=null;}
    for(const key of Object.keys(cleared))delete cleared[key];
    Object.assign(player,{x:SPAWN.x,y:SPAWN.y,angle:-Math.PI/2,hp:100,focus:65,stamina:100,level:15,xp:0,coins:500,potions:3,kills:0,healthRanks:0,staminaRanks:0,manaRanks:0,ultimateCd:0,ultimateTime:0,attackCd:0,combo:0,comboTimer:0,charge:0,dashT:0,dashCd:0,skillCd:0,invuln:2,flash:0,hurt:0,walk:0,stepDist:0,aimLock:0,dead:false,deadT:0,burn:0,poison:0,chill:0,shock:0,curse:0,buff:0,kx:0,ky:0,relics:{},motion:0,swing:null,spin:null});
     companions.length=0;for(const n of homeNpcs){n.hired=false;n.companion=false;}
     quest.stage=0;quest.progress=0;wave=1;waveTimer=0;spawnTimer=1;finalBossActive=false;mimicBossTimer=rand(105,185);delete player.legendaryWeapon;gameTime=0;biomeExposure=0;fadeSt=null;splash=null;portalCd=0;
    enemies.length=0;loot.length=0;shots.length=0;pShots.length=0;particles.length=0;delayed.length=0;pendingLevelChoices.length=0;
    targetEnemy=null;attackHeld=false;autoAttack=false;$('#autoAttackBtn').setAttribute('aria-pressed','false');$('#autoAttackBtn').textContent='AUTO ⚔';
    cust.created=false;cust.ultimate=null;cust.boons=[];player.hp=maxHpOf();player.focus=maxFocusOf();player.stamina=maxStaminaOf();
    try{localStorage.removeItem(SAVE_KEY);localStorage.removeItem(EXP_KEY);}catch(e){}
    spawnEnemy('dummy',DUMMY_HOME.x,DUMMY_HOME.y);for(let i=0;i<10;i++)trySpawnRandom(440,850);
    snapCamera();if(resultOverlay)resultOverlay.hidden=true;saveExp();saveGame();updateCampaignBoard();
    togglePanel(true);showBanner('NOVA JORNADA','Escolha sua raça, classe, elemento e bênçãos.');
  }
  $('#campaignBtn')?.addEventListener('click',()=>{if(player.dead)return;journal.hidden=false;paused=true;updateCampaignBoard();});
  $('#journalClose')?.addEventListener('click',()=>{journal.hidden=true;paused=false;});
  $('#biomeList')?.addEventListener('click',ev=>{
    const btn=ev.target.closest('[data-travel]');if(!btn||btn.disabled)return;
    const d=DUNS.find(x=>x.id===btn.dataset.travel);if(!d||dun)return;
    player.x=d.x-95;player.y=d.y+90;player.kx=player.ky=0;portalCd=1.2;
    ensureWorldChunks(player.x,player.y);snapCamera();journal.hidden=true;paused=false;
    showBanner(chunkPalettes[d.biome].icon+' '+chunkPalettes[d.biome].name,`Procure a masmorra: ${d.name}`);
  });
  $('#runRestart')?.addEventListener('click',restartToCreation);

  /* ---------- início ---------- */
  loadSave();
  player.hp = maxHpOf();
  player.focus = maxFocusOf();
  player.stamina = maxStaminaOf();
  camera.x = player.x - camera.width / camera.scale / 2;
  camera.y = player.y - camera.height / camera.scale / 2;
  spawnEnemy('dummy', DUMMY_HOME.x, DUMMY_HOME.y);
  for (let i = 0; i < 9; i++) {
    for (let tries = 0; tries < 30; tries++) {
      const x = rand(120, world.width - 120), y = rand(120, world.height - 120);
      if (Math.hypot(x - player.x, y - player.y) < 450 || !validSpawn(x, y)) continue;
      spawnEnemy(typeForX(x, y), x, y);
      break;
    }
  }
  if (quest.stage === 3) spawnBoss();
  if (rankOf() >= 5 && !cust.ultimate && !pendingLevelChoices.some(choice => choice.rank === 5)) pendingLevelChoices.unshift({ rank: 5, statChosen: true });
  if (pendingLevelChoices.length) renderLevelChoice();
  el.worldMessage.textContent = 'OBJETIVO: Purifique todas as masmorras de todos os biomas. A morte encerra a jornada.';
  updateCampaignBoard();
  if (quest.stage === 0 && player.level === 15 && player.kills === 0) showToast('Bem-vindo às Terras Livres');
  else showToast('Progresso carregado');
  requestAnimationFrame(tick);
})();
