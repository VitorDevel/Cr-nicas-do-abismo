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
