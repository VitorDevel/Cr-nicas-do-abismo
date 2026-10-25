/* Exact front, back, and side cutouts from the supplied character concept sheets. */
(function (global) {
  'use strict';

  const ASSET_ROOT = 'assets/character-reference/';
  const CLASS_KEYS = {
    guerreiro: 'warrior', warrior: 'warrior', fighter: 'warrior',
    paladino: 'paladin', paladin: 'paladin',
    druida: 'druid', druid: 'druid',
    arqueiro: 'archer', archer: 'archer',
    mago: 'mage', mage: 'mage',
    assassino: 'assassin', assassin: 'assassin',
    ninja: 'ninja',
    necromancer: 'necromancer', necromante: 'necromancer',
    tanke: 'tank', tanque: 'tank', tank: 'tank',
    samurai: 'samurai',
    berserker: 'berserker'
  };
  const images = new Map();

  function keyForClass(className, branch = '') {
    const name = String(className || '').trim().toLowerCase();
    const branchName = String(branch || '').trim().toLowerCase();
    if ((name === 'assassino' || name === 'assassin') && /ninja|shinobi/.test(branchName)) return 'ninja';
    return CLASS_KEYS[name] || '';
  }

  function viewName(view) {
    return ({ f: 'front', b: 'back', s: 'side', front: 'front', back: 'back', side: 'side' })[view] || 'front';
  }

  function urlForClass(className, branch = '', view = 'front') {
    const key = keyForClass(className, branch);
    return key ? `${ASSET_ROOT}${key}-${viewName(view)}.webp` : '';
  }

  function getImage(src) {
    let image = images.get(src);
    if (image) return image;
    image = new Image();
    image.src = src;
    images.set(src, image);
    return image;
  }

  function draw(ctx, className, x, y, options = {}) {
    const key = keyForClass(className, options.branch);
    if (!key || !ctx) return false;
    const view = viewName(options.view || 'front');
    const image = getImage(`${ASSET_ROOT}${key}-${view}.webp`);
    if (!image.complete || !image.naturalWidth) return false;

    const height = options.height || 50;
    const width = height * image.naturalWidth / image.naturalHeight;
    const flip = view === 'side' && !options.flip;
    ctx.save();
    if (flip) {
      ctx.translate(x, y + (options.bob || 0));
      ctx.scale(-1, 1);
      ctx.drawImage(image, -width / 2, -height, width, height);
    } else {
      ctx.drawImage(image, x - width / 2, y + (options.bob || 0) - height, width, height);
    }
    ctx.restore();
    return true;
  }

  global.ReferenceCharacterArt = {
    keyForClass,
    hasClass: (className, branch = '') => !!keyForClass(className, branch),
    urlForClass,
    draw
  };
})(window);
