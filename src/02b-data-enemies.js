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
