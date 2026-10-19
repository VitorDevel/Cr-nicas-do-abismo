/* Missing creatures visible in the supplied enemy and boss atlases. */
(() => {
  const catalog = window.ABISMO_PARTIAL_CATALOG || (window.ABISMO_PARTIAL_CATALOG = {});
  const regular = [
    ['goblin','Goblin Saqueador','human','meadow','#89a846','#493e28',58,11,104,'skirmish'],
    ['cultist','Cultista Carmesim','human','ash','#b34642','#351d2c',78,13,82,'support'],
    ['orc','Orc de Guerra','human','mountain','#81934a','#31352a',136,18,78,'charger'],
    ['troll','Troll das Pedras','golem','mountain','#728ca1','#3c4650',225,25,53,'charger'],
    ['fire_elemental','Elemental de Fogo','elemental','volcano','#ff713b','#7d291f',83,16,86,'melee'],
    ['ice_elemental','Elemental de Gelo','elemental','frost','#9ceaff','#3b7395',86,15,78,'melee'],
    ['poison_elemental','Elemental de Veneno','elemental','marsh','#8dd635','#315b28',91,15,69,'support'],
    ['lightning_elemental','Elemental de Raio','elemental','storm','#72c9ff','#375ea9',80,17,104,'kite'],
    ['spectre','Espectro Errante','spirit','ash','#81d9ed','#345267',72,13,95,'kite'],
    ['shaman','Xamã Tribal','human','jungle','#8ea358','#31503c',82,14,74,'support'],
    ['shadow_archer','Arqueiro Sombrio','human','abyss','#8868c4','#251d3d',94,17,91,'artillery'],
    ['abyss_knight','Cavaleiro do Abismo','human','abyss','#745bb0','#242136',148,20,68,'charger'],
    ['mimic','Mímico Ancestral','mimic','canyon','#b8783c','#492c27',112,16,56,'ambush'],
    ['young_dragon','Dragão Jovem','dragon','mountain','#9d74cf','#352a56',162,22,80,'charger'],
    ['crystal_golem','Golem de Cristal','golem','crystal','#a58bdf','#393c69',198,23,57,'guard'],
    ['ancestral_guardian','Guardião Ancestral','golem','forest','#718e52','#31442f',208,24,62,'guard'],
    ['leviathan','Leviatã das Profundezas','serpent','coast','#35a5c8','#18485e',191,22,70,'sweep'],
    ['phoenix','Fênix','flyer','volcano','#ff983b','#8d3023',132,20,106,'swoop'],
    ['infernal_dragon','Dragão Infernal','dragon','volcano','#e34e32','#541e2a',212,27,73,'charger']
  ];
  for (const [id,name,arch,biome,base,shadow,hp,dmg,speed,ai] of regular) {
    if (catalog[id]) continue;
    catalog[id] = { id, name, arch, biome, hp, dmg, speed, r: arch === 'golem' || arch === 'dragon' ? 23 : 16,
      aggro: 460, ai, atk: [ai], el: null, pal: [base,shadow,'#f4dda1','#151820'], hostile: true, xp: Math.round(hp*.35), coin: 14, weight: 1 };
  }
  const bosses = [
    ['forest_lord','Senhor da Floresta','boss','#2d8247','#193b30',1450,29],
    ['ice_archon','Arconte de Gelo','boss','#74c8ef','#243e69',1550,31],
    ['mae_cinzas','Mãe das Cinzas','boss','#dc4a32','#531f27',1680,33],
    ['thorn_queen','Rainha dos Espinhos','boss','#b64fd0','#302346',1510,31],
    ['red_guardian','Guardião Rubro','boss','#ef6238','#582321',1740,35],
    ['celestial_vulture','Abutre Celestial','boss','#b98aff','#33275f',1490,30],
    ['devorador_astral','Devorador Astral','boss','#a765e2','#211b4c',1830,37],
    ['mimic_boss','Mímico, Cofre Faminto','boss','#b8783c','#492c27',650,24]
  ];
  for (const [id,name,arch,base,shadow,hp,dmg] of bosses) {
    if (catalog[id]) continue;
    catalog[id] = { id, name, arch, hp, dmg, speed: id === 'celestial_vulture' ? 112 : 80, r: id === 'mimic_boss' ? 34 : 38,
      aggro: 900, ai: id === 'celestial_vulture' ? 'flyer' : 'boss', atk: id === 'devorador_astral' ? ['beam','nova','chain'] : ['lunge','nova'],
      el: null, pal: [base,shadow,'#f5dd9a','#100f22'], hostile: true, boss: true, xp: 900, coin: 240, weight: 1 };
  }
})();
