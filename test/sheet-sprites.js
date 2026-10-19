(() => {
  document.body.innerHTML = ''; document.body.style.cssText = 'margin:0;background:#35502e';
  const cv = document.createElement('canvas'); cv.width = 1600; cv.height = 900; document.body.appendChild(cv);
  const g = cv.getContext('2d'); g.fillStyle = '#4c7a3c'; g.fillRect(0, 0, 1600, 900);
  const BMAP = { cactus: 'dunes', dunerock: 'dunes', obelisk: 'dunes', bones: 'dunes', deadbush: 'dunes', mesa: 'canyon', redrock: 'canyon', spire: 'canyon', minecart: 'canyon', snowpine: 'frost', icecrystal: 'frost', snowrock: 'frost', frozentree: 'frost', snowbush: 'frost', snowman: 'frost', boulder: 'mountain', basalt: 'volcano', charredtree: 'ash', lavarock: 'volcano', vent: 'volcano', obsidian: 'volcano', stormtree: 'storm', rod: 'storm', pylon: 'storm', crystalcluster: 'crystal', crystaltree: 'crystal', glowshroom: 'crystal', monolith: 'arcane', floatrock: 'arcane', arctree: 'arcane', runestone: 'arcane', starflower: 'arcane', gravestone: 'ash', bonepile: 'ash', torchpost: 'ash', crypt: 'ash', driftwood: 'coast', coastrock: 'coast', shell: 'coast', umbrella: 'coast', voidspire: 'abyss', voidrock: 'abyss', eyestalk: 'abyss', palm: 'coast', jtree: 'jungle', bigleaf: 'jungle', bamboo: 'jungle', bushflower: 'jungle', willow: 'marsh', reeds: 'marsh', giantmush: 'marsh', skullpile: 'marsh' };
  const kinds = Object.keys(SPR).filter(k => !k.startsWith('node_') && !['house', 'dgate', 'oniseal'].includes(k));
  let x = 60, y = 110, row = 0;
  kinds.forEach((k, i) => {
    const b = BMAP[k] || 'meadow', s = k === 'mesa' ? 40 : k === 'crypt' ? 30 : 28;
    g.fillStyle = BIOMES[b].g; g.fillRect(x - 38, y - 90, 76, 110);
    drawSprite(g, k, 0, s, b, x, y); g.fillStyle = '#fff'; g.font = '9px monospace'; g.textAlign = 'center'; g.fillText(k, x, y + 14);
    x += 80; if (x > 1560) { x = 60; y += 128; }
  });
  // casas e portões
  y += 150; x = 100;
  for (const b of ['meadow', 'jungle', 'dunes', 'frost', 'stone' === 'x' ? 'x' : 'mountain', 'crystal']) { g.fillStyle = BIOMES[b].g; g.fillRect(x - 110, y - 180, 220, 210); drawSprite(g, 'house', b === 'dunes' ? 5 : 1, 56, b, x, y); x += 250; }
  x = 120; for (const v of [0, 4, 99]) { drawSprite(g, 'dgate', v, 44, 'forest', 1000 + x * 0 + (v === 0 ? 0 : v === 4 ? 150 : 300) + 0, y + 150); }
})();
