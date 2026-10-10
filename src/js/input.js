'use strict';

/* Klavye + Gamepad API girişlerini PS4 tuş eylemlerine dönüştürür. */
const Input = (() => {
  const KEYS = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
    Enter: 'x', NumpadEnter: 'x', Space: 'x',
    Escape: 'o', Backspace: 'o',
    KeyT: 'triangle', KeyF: 'square',
    KeyM: 'options', KeyH: 'ps', Home: 'ps', KeyQ: 'quick'
  };
  // Standart gamepad eşlemesi (DualShock 4 / DualSense / Xbox)
  const PAD = { 0: 'x', 1: 'o', 2: 'square', 3: 'triangle', 8: 'quick', 9: 'options', 12: 'up', 13: 'down', 14: 'left', 15: 'right' };
  const PS_BUTTON = 16;
  const REPEATABLE = new Set(['up', 'down', 'left', 'right']);
  const ACTIONS = ['up', 'down', 'left', 'right', 'x', 'o', 'square', 'triangle', 'options', 'quick'];

  const kbHeld = {}, padHeld = {};
  const padState = {};
  let psDownAt = 0, psQuickFired = false;
  let handler = null;
  let padCount = 0;

  function emit(a, repeat) {
    Sound.unlock();
    if (handler) handler(a, !!repeat);
  }

  window.addEventListener('keydown', e => {
    if (api.textMode) return;
    const a = KEYS[e.code];
    if (!a) return;
    e.preventDefault();
    if (e.repeat && !REPEATABLE.has(a)) return;
    kbHeld[a] = true;
    emit(a, e.repeat);
  });
  window.addEventListener('keyup', e => {
    const a = KEYS[e.code];
    if (a) kbHeld[a] = false;
  });
  window.addEventListener('blur', () => { for (const k in kbHeld) kbHeld[k] = false; });

  window.addEventListener('gamepadconnected', e => {
    padCount++;
    api.onPad && api.onPad(true, e.gamepad.id);
  });
  window.addEventListener('gamepaddisconnected', e => {
    padCount = Math.max(0, padCount - 1);
    api.onPad && api.onPad(false, e.gamepad.id);
  });

  function poll(t) {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const now = {};
    let psPressed = false;
    for (const p of pads) {
      if (!p) continue;
      for (const i in PAD) if (p.buttons[i] && p.buttons[i].pressed) now[PAD[i]] = true;
      if (p.buttons[PS_BUTTON] && p.buttons[PS_BUTTON].pressed) psPressed = true;
      const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
      if (ax < -0.55) now.left = true;
      if (ax > 0.55) now.right = true;
      if (ay < -0.55) now.up = true;
      if (ay > 0.55) now.down = true;
    }
    for (const a of ACTIONS) {
      const s = padState[a] || (padState[a] = { down: false, next: 0 });
      if (now[a]) {
        if (!s.down) {
          s.down = true; s.next = t + 380; padHeld[a] = true;
          emit(a, false);
        } else if (REPEATABLE.has(a) && t >= s.next) {
          s.next = t + 110;
          emit(a, true);
        }
      } else if (s.down) {
        s.down = false; padHeld[a] = false;
      }
    }
    // PS tuşu: kısa basış = ana ekran, uzun basış = hızlı menü
    if (psPressed) {
      if (!psDownAt) { psDownAt = t; psQuickFired = false; }
      else if (!psQuickFired && t - psDownAt > 600) { psQuickFired = true; emit('quick'); }
    } else if (psDownAt) {
      if (!psQuickFired) emit('ps');
      psDownAt = 0;
    }
    requestAnimationFrame(poll);
  }
  requestAnimationFrame(poll);

  const api = {
    textMode: false,
    onPad: null,
    setHandler(fn) { handler = fn; },
    held(a) { return !!(kbHeld[a] || padHeld[a]); },
    padConnected() { return padCount > 0; }
  };
  return api;
})();
