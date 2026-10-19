/* ---------- áudio: efeitos e música procedural ---------- */
let audioCtx = null, masterGain = null, sfxGain = null, musicGain = null, noiseBuf = null, lastSfx = {};
function ac() {
  if (!audioCtx) {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    audioCtx = new C();
    masterGain = audioCtx.createGain(); sfxGain = audioCtx.createGain(); musicGain = audioCtx.createGain();
    sfxGain.connect(masterGain); musicGain.connect(masterGain); masterGain.connect(audioCtx.destination);
    applyVolumes();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function applyVolumes() {
  if (!audioCtx) return;
  masterGain.gain.value = settings.master; sfxGain.gain.value = settings.sfx; musicGain.gain.value = settings.music * .55;
}
function tone(f0, f1, dur, type = 'sine', vol = .1, delay = 0, dest) {
  const a = ac(); if (!a) return;
  const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(dest || sfxGain); o.start(t); o.stop(t + dur + .03);
}
function noise(dur, vol = .08, freq = 1800, delay = 0, q = 1) {
  const a = ac(); if (!a) return;
  if (!noiseBuf) { noiseBuf = a.createBuffer(1, a.sampleRate, a.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const t = a.currentTime + delay, s = a.createBufferSource(); s.buffer = noiseBuf;
  const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  const g = a.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(sfxGain); s.start(t); s.stop(t + dur + .02);
}
const SFX = {
  swing: () => { noise(.12, .06, 2400); tone(420, 180, .1, 'triangle', .04); },
  swing2: () => { noise(.16, .08, 1800); tone(320, 120, .14, 'triangle', .05); },
  hit: () => { tone(190, 60, .12, 'square', .08); noise(.07, .07, 900); },
  crit: () => { tone(300, 70, .18, 'sawtooth', .09); tone(900, 1300, .1, 'sine', .06, .02); noise(.1, .08, 1400); },
  hurt: () => tone(140, 45, .25, 'sawtooth', .12),
  coin: () => { tone(880, 880, .07, 'sine', .05); tone(1320, 1320, .12, 'sine', .05, .06); },
  potion: () => { tone(400, 800, .25, 'sine', .08); tone(600, 1000, .25, 'sine', .05, .08); },
  dash: () => noise(.2, .07, 700),
  skill: () => { tone(220, 660, .3, 'sawtooth', .06); noise(.28, .08, 1200); },
  slam: () => { tone(90, 30, .4, 'sine', .2); noise(.3, .12, 300); },
  boom: () => { tone(70, 25, .6, 'sine', .25); noise(.5, .15, 200); },
  level: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, f, .22, 'triangle', .08, i * .1)),
  quest: () => [392, 523, 659].forEach((f, i) => tone(f, f, .25, 'sine', .08, i * .12)),
  death: () => tone(240, 40, .9, 'sawtooth', .12),
  shoot: () => { tone(900, 300, .1, 'triangle', .05); noise(.06, .04, 3000); },
  magic: () => { tone(500, 1200, .2, 'sine', .06); tone(700, 1500, .25, 'triangle', .03, .04); },
  zap: () => { noise(.15, .1, 3500, 0, 4); tone(1200, 200, .12, 'sawtooth', .05); },
  click: () => tone(660, 660, .05, 'square', .035),
  open: () => { tone(300, 500, .1, 'triangle', .05); tone(500, 800, .12, 'triangle', .04, .06); },
  chest: () => { [523, 659, 784, 988].forEach((f, i) => tone(f, f, .18, 'triangle', .07, i * .07)); },
  portal: () => { tone(160, 620, .6, 'sine', .09); noise(.5, .05, 900); },
  roar: () => { tone(110, 60, .7, 'sawtooth', .16); tone(90, 40, .8, 'square', .08, .05); noise(.6, .09, 400); },
  step: () => noise(.04, .015, 500),
  warn: () => { tone(300, 300, .08, 'square', .04); tone(260, 260, .1, 'square', .04, .1); },
  ice: () => { tone(1500, 900, .2, 'sine', .05); noise(.18, .05, 5000, 0, 3); },
  fire: () => { noise(.3, .08, 600, 0, 2); tone(180, 90, .3, 'sawtooth', .04); },
  heal: () => { tone(600, 900, .3, 'sine', .06); tone(800, 1200, .3, 'sine', .04, .1); }
};
function sfx(name) {
  if (settings.sfx <= 0 || !SFX[name]) return;
  const now = performance.now(); if (now - (lastSfx[name] || 0) < 35) return; lastSfx[name] = now;
  try { SFX[name](); } catch (e) { /* áudio indisponível */ }
}

/* ---- música gerativa ---- */
const SCALES = { maior: [0, 2, 4, 7, 9], menor: [0, 3, 5, 7, 10], frigio: [0, 1, 5, 7, 8], lidio: [0, 2, 4, 6, 7, 9], exo: [0, 2, 3, 6, 7, 9] };
const MOODS = {
  menu: { root: 45, scale: 'menor', tempo: 62, pad: 'sawtooth', arp: .5, drums: 0 },
  campos: { root: 50, scale: 'maior', tempo: 78, pad: 'triangle', arp: .8, drums: 0 },
  floresta: { root: 47, scale: 'lidio', tempo: 70, pad: 'triangle', arp: .7, drums: 0 },
  selva: { root: 52, scale: 'exo', tempo: 92, pad: 'triangle', arp: .9, drums: .3 },
  pantano: { root: 43, scale: 'frigio', tempo: 56, pad: 'sine', arp: .35, drums: 0 },
  deserto: { root: 46, scale: 'frigio', tempo: 74, pad: 'sawtooth', arp: .6, drums: .2 },
  gelo: { root: 55, scale: 'lidio', tempo: 58, pad: 'sine', arp: .55, drums: 0 },
  fogo: { root: 41, scale: 'frigio', tempo: 88, pad: 'sawtooth', arp: .7, drums: .5 },
  tempestade: { root: 48, scale: 'menor', tempo: 84, pad: 'square', arp: .8, drums: .4 },
  cristal: { root: 57, scale: 'lidio', tempo: 66, pad: 'sine', arp: 1, drums: 0 },
  arcano: { root: 51, scale: 'exo', tempo: 64, pad: 'triangle', arp: .9, drums: 0 },
  sombra: { root: 40, scale: 'menor', tempo: 52, pad: 'sawtooth', arp: .3, drums: 0 },
  masmorra: { root: 38, scale: 'menor', tempo: 60, pad: 'sawtooth', arp: .35, drums: .15 },
  chefe: { root: 38, scale: 'frigio', tempo: 112, pad: 'sawtooth', arp: .9, drums: 1 },
  oni: { root: 36, scale: 'exo', tempo: 124, pad: 'sawtooth', arp: 1, drums: 1.2 },
  noite: { root: 45, scale: 'menor', tempo: 54, pad: 'sine', arp: .4, drums: 0 }
};
const music = { mood: null, next: 0, step: 0, timer: 0, cur: null };
function setMood(name) {
  if (music.mood === name) return;
  music.mood = name; music.cur = MOODS[name] || MOODS.campos; music.step = 0;
}
function musicTick() {
  if (!audioCtx || settings.music <= 0 || !music.cur) return;
  const a = audioCtx, m = music.cur, beat = 60 / m.tempo;
  if (music.next < a.currentTime) music.next = a.currentTime + .05;
  while (music.next < a.currentTime + .6) {
    const t = music.next - a.currentTime, st = music.step, sc = SCALES[m.scale];
    const note = (deg, oct = 0) => 440 * Math.pow(2, (m.root + sc[((deg % sc.length) + sc.length) % sc.length] + 12 * (oct + Math.floor(deg / sc.length)) - 69) / 12);
    if (st % 8 === 0) {
      const chord = [0, 2, 4][(st / 8 | 0) % 3] + ((st / 32 | 0) % 2 ? 1 : 0);
      for (const d of [0, 2, 4]) tone(note(chord + d, -1), note(chord + d, -1) * 1.003, beat * 8.2, m.pad, .018, t, musicGain);
      tone(note(chord, -2), note(chord, -2), beat * 4, 'sine', .04, t, musicGain);
    }
    if (Math.random() < m.arp * (st % 2 ? .35 : .75)) { const d = Math.floor(Math.random() * 7) + (st % 4 === 0 ? 0 : 2); tone(note(d, 1), note(d, 1) * .998, beat * 1.4, 'triangle', .02, t, musicGain); }
    if (m.drums && st % 4 === 0) { tone(110, 40, .25, 'sine', .08 * m.drums, t, musicGain); }
    if (m.drums > .6 && st % 4 === 2) { const g = ac(); noise(.08, .03 * m.drums, 4000, t); }
    music.next += beat * .5; music.step++;
  }
}
setInterval(musicTick, 250);
