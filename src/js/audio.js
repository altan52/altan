'use strict';

/* Tüm sesler Web Audio API ile gerçek zamanlı üretilir (ses dosyası yok). */
const Sound = (() => {
  let ctx = null, master, sfx, music, noiseBuf = null;
  let musicOn = false, musicTimer = null, chordIdx = 0;

  function init() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    // Tarayıcıda kullanıcı etkileşimi olmadan ses bağlamı açılamaz (Electron'da serbest)
    if (!window.desktop && navigator.userActivation && !navigator.userActivation.hasBeenActive) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    sfx = ctx.createGain(); sfx.connect(master);
    music = ctx.createGain(); music.gain.value = 0;
    // Müziğe hafif yankı
    const delay = ctx.createDelay(1); delay.delayTime.value = 0.42;
    const fb = ctx.createGain(); fb.gain.value = 0.35;
    const wet = ctx.createGain(); wet.gain.value = 0.5;
    music.connect(master); music.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(master);
    return true;
  }

  function tone(f, dur, o) {
    o = o || {};
    if (!o.music && !api.enabled) return;
    if (!init()) return;
    const t = ctx.currentTime + (o.delay || 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(f, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    const v = o.vol == null ? 0.15 : o.vol;
    const a = o.attack == null ? 0.004 : o.attack;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, a + 0.01));
    osc.connect(g); g.connect(o.music ? music : sfx);
    osc.start(t); osc.stop(t + dur + a + 0.05);
  }

  function noise(dur, o) {
    o = o || {};
    if (!api.enabled || !init()) return;
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.freq || 1200;
    const g = ctx.createGain(); const t = ctx.currentTime;
    g.gain.setValueAtTime(o.vol || 0.3, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(sfx);
    src.start(t); src.stop(t + dur);
  }

  /* Ortam müziği: yavaşça değişen akorlar + parıltı notaları */
  const CHORDS = [
    [220.0, 277.18, 329.63, 415.30],   // Amaj7
    [185.0, 233.08, 277.18, 349.23],   // F#m7 tadında
    [146.83, 220.0, 277.18, 369.99],   // Dmaj9
    [164.81, 207.65, 246.94, 329.63]   // E
  ];
  function pad(freqs, dur) {
    const t = ctx.currentTime;
    freqs.forEach(f => {
      [[f, 'triangle', 0.018], [f * 2.003, 'sine', 0.009]].forEach(([ff, type, vol]) => {
        const o = ctx.createOscillator(); o.type = type; o.frequency.value = ff;
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(vol, t + 3);
        g.gain.linearRampToValueAtTime(vol * 0.8, t + dur - 3);
        g.gain.linearRampToValueAtTime(0.0001, t + dur);
        o.connect(lp); lp.connect(g); g.connect(music);
        o.start(t); o.stop(t + dur + 0.1);
      });
    });
    for (let k = 0; k < 4; k++) {
      const f = freqs[Math.floor(Math.random() * freqs.length)] * (Math.random() < 0.5 ? 4 : 2);
      tone(f, 2.5, { vol: 0.02, attack: 0.03, delay: 0.8 + Math.random() * (dur - 3.5), music: true });
    }
  }
  function musicStep() {
    if (!musicOn) return;
    pad(CHORDS[chordIdx], 10);
    chordIdx = (chordIdx + 1) % CHORDS.length;
  }

  const api = {
    enabled: true,
    unlock() { init(); },
    nav() { tone(1500, 0.045, { vol: 0.045 }); tone(2250, 0.03, { vol: 0.015, delay: 0.008 }); },
    select() { tone(880, 0.09, { vol: 0.09 }); tone(1320, 0.18, { vol: 0.07, delay: 0.045 }); },
    back() { tone(760, 0.08, { vol: 0.07 }); tone(540, 0.13, { vol: 0.06, delay: 0.045 }); },
    error() { tone(200, 0.16, { vol: 0.08, type: 'square' }); },
    launch() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.6, { vol: 0.05, delay: i * 0.07 })); },
    boot() {
      [130.81, 196.0, 261.63, 329.63, 392.0, 523.25].forEach((f, i) =>
        tone(f, 4.6, { vol: 0.045, attack: 0.7 + i * 0.12, delay: i * 0.12, type: i < 2 ? 'triangle' : 'sine' }));
      tone(1046.5, 3.2, { vol: 0.025, attack: 0.6, delay: 1.1 });
      tone(1567.98, 2.6, { vol: 0.015, attack: 0.5, delay: 1.5 });
    },
    login() { [659.25, 783.99, 987.77].forEach((f, i) => tone(f, 0.7, { vol: 0.05, delay: i * 0.1 })); },
    trophy() { [783.99, 987.77, 1174.66, 1567.98].forEach((f, i) => tone(f, 0.4, { vol: 0.06, delay: i * 0.08 })); },
    notify() { tone(987.77, 0.15, { vol: 0.06 }); tone(1318.5, 0.3, { vol: 0.05, delay: 0.08 }); },
    blip() { tone(660, 0.08, { vol: 0.06, type: 'square', to: 990 }); },
    tick() { tone(440, 0.04, { vol: 0.04, type: 'square' }); },
    crash() { noise(0.5, { vol: 0.3, freq: 900 }); tone(160, 0.4, { vol: 0.08, type: 'sawtooth', to: 50 }); },
    levelUp() { [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, 0.2, { vol: 0.05, type: 'square', delay: i * 0.06 })); },
    shutdown() { [783.99, 659.25, 523.25, 392.0].forEach((f, i) => tone(f, 0.7, { vol: 0.045, delay: i * 0.16 })); },
    startMusic() {
      if (musicOn || !init()) return;
      musicOn = true;
      const t = ctx.currentTime;
      music.gain.cancelScheduledValues(t);
      music.gain.setValueAtTime(music.gain.value, t);
      music.gain.linearRampToValueAtTime(1, t + 2.5);
      musicStep();
      musicTimer = setInterval(musicStep, 8500);
    },
    stopMusic() {
      if (!musicOn) return;
      musicOn = false;
      clearInterval(musicTimer); musicTimer = null;
      if (!ctx) return;
      const t = ctx.currentTime;
      music.gain.cancelScheduledValues(t);
      music.gain.setValueAtTime(music.gain.value, t);
      music.gain.linearRampToValueAtTime(0, t + 0.8);
    }
  };
  return api;
})();
