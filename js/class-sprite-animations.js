/* Class-specific idle, run, and attack frame sets for the playable hero. */
(function (global) {
  'use strict';

  const ASSET_ROOT = 'assets/class-animations/';
  const CLASS_KEYS = {
    guerreiro: 'warrior', warrior: 'warrior', fighter: 'warrior',
    ninja: 'ninja',
    samurai: 'samurai',
    arqueiro: 'archer', archer: 'archer',
    assassino: 'assassin', assassin: 'assassin',
    druida: 'druid', druid: 'druid',
    tanke: 'tank', tanque: 'tank', tank: 'tank',
    paladino: 'paladin', paladin: 'paladin',
    clerigo: 'paladin', 'clérigo': 'paladin',
    necromancer: 'necromancer', necromante: 'necromancer',
    mago: 'mage', mage: 'mage',
    berserker: 'berserker'
  };

  // Impact cells that contain only the slash, spell, or flare hold a nearby pose.
  const ATTACK_SEQUENCES = {
    warrior: [1, 2, 3, 4, 5, 6, 7, 7],
    ninja: [1, 2, 3, 4, 5, 6, 7, 7],
    samurai: [1, 2, 3, 4, 4, 6, 6, 8],
    archer: [1, 2, 3, 4, 5, 6, 6, 6],
    assassin: [1, 2, 3, 4, 5, 6, 7, 7],
    druid: [1, 2, 3, 4, 5, 6, 7, 7],
    paladin: [1, 2, 3, 4, 5, 6, 7, 7],
    necromancer: [1, 2, 3, 4, 5, 6, 6, 6],
    berserker: [1, 1, 3, 4, 4, 6, 6, 8]
  };

  const images = new Map();
  const prepared = new Set();

  function keyForClass(className) {
    return CLASS_KEYS[String(className || '').trim().toLowerCase()] || '';
  }

  function frameUrl(key, action, frame) {
    return `${ASSET_ROOT}${key}/${action}/${action}_${String(frame).padStart(2, '0')}.png`;
  }

  function getImage(src) {
    let image = images.get(src);
    if (image) return image;
    image = new Image();
    image.decoding = 'async';
    image.src = src;
    images.set(src, image);
    return image;
  }

  function prepare(key) {
    if (prepared.has(key)) return;
    prepared.add(key);
    for (const action of ['idle', 'run', 'attack']) {
      for (let frame = 1; frame <= 8; frame++) getImage(frameUrl(key, action, frame));
    }
  }

  function actionReady(key, action) {
    for (let frame = 1; frame <= 8; frame++) {
      const image = getImage(frameUrl(key, action, frame));
      if (!image.complete || !image.naturalWidth) return false;
    }
    return true;
  }

  function draw(ctx, className, x, y, options = {}) {
    const key = keyForClass(className);
    if (!key || !ctx) return false;
    prepare(key);

    const action = ['idle', 'run', 'attack'].includes(options.action) ? options.action : 'idle';
    const time = Number.isFinite(options.time) ? options.time : 0;
    let frame;
    if (action === 'attack') {
      const sequence = ATTACK_SEQUENCES[key] || [1, 2, 3, 4, 5, 6, 7, 8];
      const progress = Math.max(0, Math.min(.999, Number(options.progress) || 0));
      frame = sequence[Math.min(sequence.length - 1, Math.floor(progress * sequence.length))];
    } else {
      const fps = action === 'run' ? 10.5 : 4.8;
      frame = Math.floor(Math.max(0, time) * fps) % 8 + 1;
    }

    if (!actionReady(key, action)) return false;
    const image = getImage(frameUrl(key, action, frame));
    if (!image.complete || !image.naturalWidth) return false;

    const height = Number.isFinite(options.height) ? options.height : image.naturalHeight > 90 ? 76 : 60;
    const width = height * image.naturalWidth / image.naturalHeight;
    const motion = Math.max(0, Math.min(1, Number(options.motion) || 0));
    const bob = action === 'run'
      ? -Math.abs(Math.sin(time * 13)) * (1.5 + motion)
      : action === 'idle'
        ? Math.sin(time * 2.4) * .55
        : -Math.sin(Math.max(0, Math.min(1, Number(options.progress) || 0)) * Math.PI) * 1.1;

    ctx.save();
    ctx.translate(x, y + bob);
    if (options.flip) ctx.scale(-1, 1);
    ctx.drawImage(image, -width / 2, -height, width, height);
    ctx.restore();
    return true;
  }

  global.ClassSpriteAnimations = {
    keyForClass,
    hasClass: className => !!keyForClass(className),
    draw
  };
})(window);
