'use strict';

window.Home = null;

/* ================= DİNAMİK ARKA PLAN (dalgalar + parçacıklar) ================= */
function hexRGB(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const BG = {
  init() {
    this.c = $('#bg');
    this.x = this.c.getContext('2d');
    this.t = 0;
    this.parts = Array.from({ length: 55 }, () => this.newPart(true));
    this.stars = Array.from({ length: 170 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.4 + 0.4, tw: Math.random() * 6 }));
    this.tint = [0, 0, 0]; this.tintT = [0, 0, 0]; this.tintA = 0; this.tintAT = 0;
    window.addEventListener('resize', () => this.resize());
    this.resize();
    let last = performance.now();
    const loop = t => {
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      this.draw(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  },
  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.c.width = Math.floor(innerWidth * this.dpr);
    this.c.height = Math.floor(innerHeight * this.dpr);
  },
  newPart(init) {
    return { x: Math.random(), y: init ? Math.random() : 1.05, r: Math.random() * 2.6 + 0.8, s: Math.random() * 0.018 + 0.006, a: Math.random() * 0.5 + 0.25, ph: Math.random() * 6.28 };
  },
  setTheme(key) {
    const th = THEMES[key] || THEMES.blue;
    this.target = {
      top: hexRGB(th.top), bottom: hexRGB(th.bottom),
      wave: th.wave.split(',').map(Number), part: th.particle.split(',').map(Number),
      stars: th.stars ? 1 : 0
    };
    if (!this.cur) this.cur = JSON.parse(JSON.stringify(this.target));
    document.documentElement.style.setProperty('--accent', th.accent);
  },
  setTint(hex) {
    if (!hex) { this.tintAT = 0; return; }
    this.tintT = hexRGB(hex); this.tintAT = 0.3;
  },
  draw(dt) {
    this.t += dt;
    if (!this.cur) return;
    // Arka plan oyun sırasında görünmüyorsa çizim maliyetinden kaçın
    if (Games.visible && Games.state !== 'splash') return;
    const k = 1 - Math.exp(-dt * 2.5);
    const lerpArr = (a, b) => { for (let i = 0; i < a.length; i++) a[i] += (b[i] - a[i]) * k; };
    const c = this.cur, tg = this.target;
    lerpArr(c.top, tg.top); lerpArr(c.bottom, tg.bottom); lerpArr(c.wave, tg.wave); lerpArr(c.part, tg.part);
    c.stars += (tg.stars - c.stars) * k;
    lerpArr(this.tint, this.tintT);
    this.tintA += (this.tintAT - this.tintA) * k;

    const ctx = this.x, W = this.c.width, H = this.c.height, sc = H / 1080;
    const rgb = a => `rgb(${a[0] | 0},${a[1] | 0},${a[2] | 0})`;
    const g = ctx.createLinearGradient(0, 0, W * 0.3, H);
    g.addColorStop(0, rgb(c.top)); g.addColorStop(1, rgb(c.bottom));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    if (this.tintA > 0.005) {
      const rg = ctx.createRadialGradient(W * 0.2, H * 0.4, 0, W * 0.2, H * 0.4, W * 0.75);
      const [r, gg, b] = this.tint.map(v => v | 0);
      rg.addColorStop(0, `rgba(${r},${gg},${b},${this.tintA})`);
      rg.addColorStop(1, `rgba(${r},${gg},${b},0)`);
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    }

    if (c.stars > 0.01) {
      for (const s of this.stars) {
        const a = c.stars * (0.35 + 0.65 * Math.abs(Math.sin(this.t * 0.7 + s.tw)));
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fillRect(s.x * W, s.y * H * 0.8, s.r * this.dpr, s.r * this.dpr);
      }
    }

    // Dalga şeritleri
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = Math.max(1, 1.3 * sc);
    const [w0, w1, w2] = c.wave.map(v => v | 0);
    const ribbons = [
      { y: 0.60, amp: 95, f: 0.0016, sp: 0.22, lines: 18, gap: 4.5, ph: 0 },
      { y: 0.66, amp: 130, f: 0.0010, sp: -0.15, lines: 14, gap: 6, ph: 2.1 },
      { y: 0.74, amp: 60, f: 0.0023, sp: 0.3, lines: 10, gap: 4, ph: 4.2 }
    ];
    const step = 16 * this.dpr;
    for (const r of ribbons) {
      for (let j = 0; j < r.lines; j++) {
        const alpha = 0.035 + 0.075 * Math.sin((j + 0.5) / r.lines * Math.PI);
        ctx.strokeStyle = `rgba(${w0},${w1},${w2},${alpha})`;
        ctx.beginPath();
        const twist = Math.sin(this.t * 0.12 + j * 0.11 + r.ph);
        for (let px = 0; px <= W + step; px += step) {
          const xx = px / sc;
          const y = r.y * 1080 +
            Math.sin(xx * r.f + this.t * r.sp + r.ph) * r.amp * twist +
            Math.sin(xx * r.f * 2.3 - this.t * r.sp * 1.3 + j * 0.07) * r.amp * 0.3 +
            (j - r.lines / 2) * r.gap;
          if (px === 0) ctx.moveTo(px, y * sc); else ctx.lineTo(px, y * sc);
        }
        ctx.stroke();
      }
    }

    // Parçacıklar (bokeh)
    const [p0, p1, p2] = c.part.map(v => v | 0);
    for (const p of this.parts) {
      p.y -= p.s * dt;
      p.x += Math.sin(this.t * 0.4 + p.ph) * 0.00025;
      if (p.y < -0.05) Object.assign(p, this.newPart(false));
      const a = p.a * (0.55 + 0.45 * Math.sin(this.t * 1.3 + p.ph));
      const px = p.x * W, py = p.y * H, rr = p.r * sc * 1.2;
      ctx.fillStyle = `rgba(${p0},${p1},${p2},${a * 0.12})`;
      ctx.beginPath(); ctx.arc(px, py, rr * 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(${p0},${p1},${p2},${a})`;
      ctx.beginPath(); ctx.arc(px, py, rr, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }
};

/* ================= SAAT ================= */
function fmtTime(d) {
  const h = d.getHours(), m = String(d.getMinutes()).padStart(2, '0');
  if (Save.data.settings.clock24) return `${String(h).padStart(2, '0')}:${m}`;
  return `${h % 12 || 12}:${m} ${h < 12 ? 'ÖÖ' : 'ÖS'}`;
}
function updateClocks() {
  const s = fmtTime(new Date());
  document.querySelectorAll('.clock').forEach(e => { if (e.textContent !== s) e.textContent = s; });
}

/* ================= SİSTEM ================= */
const Sys = {
  loggedIn: false, locked: false, restMode: false, powerOff: false,

  boot() {
    this.loggedIn = false;
    UI.closeAll();
    Nav.replaceAll(new BootScreen());
    this.musicUpdate();
  },
  login() {
    this.loggedIn = true;
    Sound.login();
    Nav.replaceAll(new HomeScreen());
    const u = Save.data.user;
    setTimeout(() => UI.toast({ iconHTML: avatarSVG(u.avatar), title: u.name, text: 'oturum açtı.' }), 500);
    this.musicUpdate();
  },
  logout() {
    Games.close();
    this.loggedIn = false;
    Nav.replaceAll(new UserSelectScreen());
    this.musicUpdate();
  },
  musicUpdate() {
    if (this.loggedIn && Save.data.settings.music && !Games.visible && !this.restMode && !this.locked) Sound.startMusic();
    else Sound.stopMusic();
  },
  applySettings() {
    const s = Save.data.settings;
    BG.setTheme(s.theme);
    Sound.enabled = s.sfx;
    this.musicUpdate();
    updateClocks();
  },
  trophy(app, id) {
    const t = APPS[app].trophies.find(x => x.id === id);
    if (!t) return;
    const tr = Save.data.trophies[app] || (Save.data.trophies[app] = {});
    if (tr[id]) return;
    tr[id] = Date.now();
    Save.save();
    Sound.trophy();
    UI.toast({ iconHTML: trophySVG(t.grade), title: 'Bir kupa kazandınız!', text: `${t.name} (${GRADE_NAMES[t.grade]})`, cls: 'trophy' });
    this.notify({ type: 'trophy', title: `Kupa kazanıldı: ${t.name}`, text: `${APPS[app].name} · ${GRADE_NAMES[t.grade]}` }, false);
    const list = APPS[app].trophies;
    const plat = list.find(x => x.grade === 'platinum');
    if (plat && !tr[plat.id] && list.filter(x => x.grade !== 'platinum').every(x => tr[x.id])) {
      setTimeout(() => this.trophy(app, plat.id), 1800);
    }
  },
  notify(n, toast) {
    Save.data.notifications.unshift(Object.assign({ time: Date.now(), read: false }, n));
    Save.data.notifications.length = Math.min(Save.data.notifications.length, 40);
    Save.save();
    if (toast !== false) {
      Sound.notify();
      UI.toast({ iconHTML: icon(n.type === 'download' ? 'download' : 'bell'), title: n.title, text: n.text });
    }
    if (window.Home) Home.refreshBadges();
  },
  toggleFullscreen() {
    if (window.desktop) { window.desktop.toggleFullscreen(); return; }
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
  },
  quickMenu() {
    if (!this.loggedIn || UI.dialogs.some(d => d.o.cls === 'quick')) return;
    const s = Save.data.settings;
    const opts = [];
    if (Games.current) opts.push({ label: `${APPS[Games.current.id].name} uygulamasını kapat`, icon: 'close', action: () => Games.close() });
    opts.push(
      { label: `Müzik: ${s.music ? 'Açık' : 'Kapalı'}`, icon: 'music', action: () => { s.music = !s.music; Save.save(); this.applySettings(); } },
      { label: `Ses efektleri: ${s.sfx ? 'Açık' : 'Kapalı'}`, icon: 'volume', action: () => { s.sfx = !s.sfx; Save.save(); this.applySettings(); } },
      { label: 'Bildirimler', icon: 'bell', action: () => { if (Games.visible) Games.suspend(true); Nav.toRoot(); Nav.push(notificationsScreen()); } },
      { label: 'Tam ekran', icon: 'monitor', action: () => this.toggleFullscreen() },
      { label: 'Güç', icon: 'power', action: () => this.powerMenu() }
    );
    UI.dialog({ cls: 'quick', title: 'Hızlı Menü', options: opts });
  },
  powerMenu() {
    UI.dialog({
      title: 'Güç Seçenekleri',
      options: [
        { label: 'Dinlenme Moduna Gir', icon: 'moon', action: () => this.rest() },
        { label: 'PS4\'ü Kapat', icon: 'power', action: () => this.shutdown(false) },
        { label: 'PS4\'ü Yeniden Başlat', icon: 'reset', action: () => this.shutdown(true) },
        { label: 'Oturumu Kapat', icon: 'exit', action: () => this.logout() },
        { label: 'İptal' }
      ]
    });
  },
  rest() {
    UI.closeAll();
    if (Games.visible) Games.suspend(true);
    this.restMode = true;
    this.musicUpdate();
    Sound.shutdown();
    const r = $('#rest');
    r.className = 'rest';
    r.innerHTML = `<div class="rest-msg">Dinlenme modu<br><small>Uyandırmak için herhangi bir tuşa basın</small></div><div class="led"></div>`;
  },
  wake() {
    this.restMode = false;
    const r = $('#rest');
    r.className = 'hidden'; r.innerHTML = '';
    this.loggedIn = false;
    Sound.select();
    Nav.replaceAll(new PressStartScreen());
  },
  shutdown(restart) {
    this.locked = true;
    UI.closeAll();
    Games.close();
    this.loggedIn = false;
    this.musicUpdate();
    Sound.shutdown();
    const r = $('#rest');
    r.className = 'power';
    r.innerHTML = `<div class="pw-msg"><div class="spinner"></div>${restart ? 'PS4 yeniden başlatılıyor…' : 'PS4 kapatılıyor…'}<br><small>Elektrik kablosunu çıkarmayın.</small></div>`;
    setTimeout(() => {
      if (restart) {
        r.className = 'hidden'; r.innerHTML = '';
        this.locked = false;
        this.boot();
      } else if (window.desktop) {
        window.desktop.quit();
      } else {
        r.innerHTML = '<div class="pw-msg dim">Sistem kapatıldı.<br><small>Yeniden açmak için herhangi bir tuşa basın.</small></div>';
        this.locked = false;
        this.powerOff = true;
      }
    }, 3000);
  }
};

/* ================= GİRİŞ YÖNLENDİRMESİ ================= */
function route(a, repeat) {
  if (Sys.locked) return;
  if (Sys.powerOff) {
    Sys.powerOff = false;
    const r = $('#rest'); r.className = 'hidden'; r.innerHTML = '';
    Sys.boot();
    return;
  }
  if (Sys.restMode) { if (!repeat) Sys.wake(); return; }
  const d = UI.topDialog();
  if (d) { d.input(a); return; }
  if (Games.visible) { Games.input(a); return; }
  if (Sys.loggedIn) {
    if (a === 'ps') {
      if (Nav.stack.length > 1) { Sound.back(); Nav.toRoot(); }
      else if (Games.current) Games.show();
      return;
    }
    if (a === 'quick') { Sys.quickMenu(); return; }
  }
  const s = Nav.top();
  if (s) s.input(a, repeat);
}

/* ================= SAHNE ÖLÇEKLEME ================= */
function fitStage() {
  const s = Math.min(innerWidth / 1920, innerHeight / 1080);
  $('#stage').style.setProperty('--scale', s);
}

/* ================= BAŞLAT ================= */
window.addEventListener('DOMContentLoaded', () => {
  Save.load();
  fitStage();
  window.addEventListener('resize', fitStage);
  BG.init();
  Games.init();
  Sys.applySettings();
  Input.setHandler(route);
  Input.onPad = (on) => {
    UI.toast({ iconHTML: icon('gamepad'), title: on ? 'Kablosuz kumanda bağlandı' : 'Kumandanın bağlantısı kesildi' });
    if (window.Home) Home.refresh();
  };
  setInterval(updateClocks, 1000);

  // Fare imlecini hareketsizken gizle
  let cursorT = null;
  window.addEventListener('mousemove', () => {
    document.body.classList.remove('hide-cursor');
    clearTimeout(cursorT);
    cursorT = setTimeout(() => document.body.classList.add('hide-cursor'), 2000);
  });
  document.body.classList.add('hide-cursor');

  Sys.boot();
});
