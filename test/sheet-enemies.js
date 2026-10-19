(() => {
  document.body.innerHTML = ''; document.body.style.cssText = 'margin:0;background:#35502e';
  const ids = Object.keys(TYPES);
  const cols = 14, cw = 114, ch = 120, rows = Math.ceil(ids.length / cols);
  const cv = document.createElement('canvas'); cv.width = cols * cw; cv.height = rows * ch; document.body.appendChild(cv);
  const g = cv.getContext('2d'); g.fillStyle = '#4a6a40'; g.fillRect(0, 0, cv.width, cv.height);
  const errs = [];
  ids.forEach((id, i) => {
    const T = TYPES[id], x = (i % cols) * cw + cw / 2, y = Math.floor(i / cols) * ch + ch - 28;
    g.save(); g.translate(x, y); g.scale(1.6, 1.6);
    try { drawEnemy(g, { type: T, face: 0.3 + (i % 3) * 0.9, ph: 1 + i, mv: .5, atkA: 0, windA: 0, hurt: 0, r: T.r, seed: i * 7.3, z: 0, bossPhase: 0, boss: false, flyer: T.arch === 'flyer' }, 3.2); } catch (e) { errs.push(id + ': ' + e.message); g.fillStyle = 'red'; g.fillRect(-10, -20, 20, 20); }
    g.restore(); g.fillStyle = '#fff'; g.font = '9px monospace'; g.textAlign = 'center'; g.fillText(id, x, y + 18);
  });
  return { n: ids.length, errs };
})();
