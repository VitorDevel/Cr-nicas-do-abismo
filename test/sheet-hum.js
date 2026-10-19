(() => {
  document.body.innerHTML = ''; document.body.style.cssText = 'margin:0;background:#35502e';
  const cv = document.createElement('canvas'); cv.width = 1800; cv.height = 1000; document.body.appendChild(cv);
  const g = cv.getContext('2d'); g.fillStyle = '#4c6a44'; g.fillRect(0, 0, 1800, 1000);
  const races = Object.keys(RACES), armors = Object.keys(ARMORS), heads = Object.keys(HEADGEARS), hairs = Object.keys(HAIR_STYLES), beards = Object.keys(BEARDS), caps = Object.keys(CAPES), marks = Object.keys(MARKS), sh = Object.keys(SHOULDERS), auras = Object.keys(AURAS);
  const wp = ['espada', 'cajado', 'arco', 'martelo', 'totem', 'adagas', 'katana', 'grimorio'];
  races.forEach((r, i) => {
    const o = { race: r, skin: RACES[r].skin[1], hairStyle: hairs[i % hairs.length], hairColor: PAL.hair[i % 9], beard: i % 3 === 0 ? beards[1 + i % 4] : 'nenhuma', head: i % 2 ? 'nenhum' : heads[i % heads.length], cape: caps[i % 3], mark: marks[i % marks.length], shoulder: sh[i % sh.length], aura: i === 3 ? 'fogo' : i === 5 ? 'estrelas' : 'nenhuma', body: ['medio', 'robusto', 'esguio'][i % 3], armor: armors[i % armors.length], armorColor: PAL.armor[i], trim: PAL.trim[i % 6], capeColor: PAL.cape[i % 9], eye: PAL.eyes[i % 8], glow: PAL.glow[i % 7], weapon: wp[i], emblem: ['sol', 'lua', 'runa', 'dragao'][i % 4] };
    ['f', 'b', 's'].forEach((v, j) => {
      g.save(); g.translate(120 + i * 215, 190 + j * 290); g.scale(3.4, 3.4);
      g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 1, 12, 4, 0, 0, TAU); g.fill();
      drawHumanoid(g, o, { t: 1.3, ph: 0.6, mv: j === 2 ? 1 : 0.0, view: v, flip: false, seed: i, wa: null });
      g.restore();
    });
    g.fillStyle = '#fff'; g.font = '14px monospace'; g.fillText(r + ' ' + o.armor, 60 + i * 215, 960);
  });
})();
