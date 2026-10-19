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
