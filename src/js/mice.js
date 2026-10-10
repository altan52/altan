'use strict';

/* ================= PEYNİR AVCILARI (Transformice tarzı fare yarışı) =================
 * Kurallar: peyniri kap, yuvaya gir. İlk giren en çok puanı alır.
 * Her turda bir fare şamandır; şaman koşmaz, eşya yerleştirip diğerlerine yol açar.
 */
const TF = {
  G: 2200, JUMP: 880, RUN: 340, SPRING: 1380, MAXFALL: 1500,
  W: 34, H: 24, STEP: 20, ROUND_TIME: 120, ROUNDS: 8,
  FINISH_POINTS: [16, 14, 12, 10, 10, 10, 10], SHAMAN_POINTS: 4
};

const TF_ITEMS = {
  plank: { name: 'Tahta', w: 380, h: 18 },
  box: { name: 'Kutu', w: 60, h: 60 },
  spring: { name: 'Trambolin', w: 90, h: 22 }
};

/* Haritalar: solids/hazards = [x, y, w, h]; yollar = yapay zekâ için ara noktalar [x, ayakY] */
const TF_MAPS = [
  { code: '@101', name: 'Çayır',
    solids: [[0, 960, 1920, 120], [700, 880, 160, 80], [1150, 820, 200, 140]],
    hazards: [], cheese: [1600, 925], hole: [420, 960],
    pathA: [[1600, 960]], pathB: [[420, 960]] },
  { code: '@102', name: 'Basamaklar',
    solids: [[0, 960, 1920, 120], [500, 860, 200, 100], [700, 760, 200, 200], [900, 660, 200, 300], [1100, 560, 400, 400]],
    hazards: [], cheese: [1420, 525], hole: [1750, 960],
    pathA: [[1420, 560]], pathB: [[1750, 960]] },
  { code: '@103', name: 'Uçurum',
    solids: [[0, 960, 800, 120], [1020, 960, 900, 120]],
    hazards: [[800, 1030, 220, 50]], cheese: [1500, 925], hole: [300, 960],
    pathA: [[1500, 960]], pathB: [[300, 960]],
    help: [{ type: 'plank', x: 910, y: 300 }] },
  { code: '@104', name: 'Büyük Boşluk', needsShaman: true,
    solids: [[0, 960, 700, 120], [1040, 960, 880, 120]],
    hazards: [[700, 1030, 340, 50]], cheese: [1450, 925], hole: [1800, 960],
    pathA: [[1450, 960]], pathB: [[1800, 960]],
    tip: 'Boşluğun üstüne bir tahta bırak!' },
  { code: '@105', name: 'Duvar', needsShaman: true,
    solids: [[0, 960, 1920, 120], [960, 620, 60, 340]],
    hazards: [], cheese: [1450, 925], hole: [1750, 960],
    pathA: [[1450, 960]], pathB: [[1750, 960]],
    tip: 'Duvarın önüne bir trambolin koy!' },
  { code: '@106', name: 'Lav Gölü',
    solids: [[0, 960, 480, 120], [600, 940, 220, 30], [940, 940, 220, 30], [1280, 940, 220, 30], [1620, 960, 300, 120]],
    hazards: [[480, 1010, 1140, 70]], cheese: [1760, 925], hole: [200, 960],
    pathA: [[1760, 960]], pathB: [[200, 960]] },
  { code: '@107', name: 'Kule',
    solids: [[0, 960, 1920, 120], [1050, 820, 300, 30], [650, 690, 300, 30], [1050, 560, 300, 30], [650, 430, 300, 30]],
    hazards: [], cheese: [800, 395], hole: [1700, 960],
    pathA: [[1200, 820], [800, 690], [1200, 560], [800, 430]], pathB: [[1700, 960]] },
  { code: '@108', name: 'Peynir Mağarası',
    solids: [[0, 960, 1100, 120], [1260, 960, 660, 120], [400, 880, 500, 40]],
    hazards: [[1100, 1030, 160, 50]], cheese: [1550, 925], hole: [150, 960],
    pathA: [[1550, 960]], pathB: [[150, 960]] }
];
const TF_ORDER = [0, 1, 2, 3, 5, 6, 4, 7];

const TF_BOTS = [
  ['KaraKartal_34', '#9b7653'], ['Ayse_Gamer', '#c4a27a'], ['Elif_77', '#7d6a5a'],
  ['MehmetPro', '#8a6d4b'], ['Zeynep.exe', '#b08968'], ['CanTR', '#6f5847']
];

function tfOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

class MiceGame {
  constructor(sys) {
    this.sys = sys;
    this.clouds = Array.from({ length: 6 }, (_, i) => ({ x: i * 340 + Math.random() * 200, y: 110 + Math.random() * 200, s: 0.6 + Math.random() * 0.6 }));
    this.reset();
  }

  /* ---------- Oyun / tur akışı ---------- */
  reset() {
    this.parts = [];
    this.t = 0;
    this.ending = 0; this.overCalled = false;
    const me = Save.data.user.name;
    this.mice = [this.makeMouse(me, '#e0b77c', true)]
      .concat(TF_BOTS.map(([n, c]) => this.makeMouse(n, c, false)));
    this.round = 0;
    this.startRound();
  }
  makeMouse(name, fur, isPlayer) {
    return { name, fur, isPlayer, score: 0, w: TF.W, h: TF.H, x: 0, y: 0, vx: 0, vy: 0, face: 1, ai: {} };
  }
  get player() { return this.mice[0]; }

  startRound() {
    const map = TF_MAPS[TF_ORDER[this.round % TF_MAPS.length]];
    this.map = map;
    this.statics = map.solids.map(([x, y, w, h]) => ({ x, y, w, h }));
    this.hazards = map.hazards.map(([x, y, w, h]) => ({ x, y, w, h }));
    this.items = [];
    this.cheese = { x: map.cheese[0], y: map.cheese[1] };
    this.hole = { x: map.hole[0], y: map.hole[1] };
    this.finished = 0;
    this.helpQueue = [];
    this.banner = null;

    // Şaman seçimi: yardım gerektiren haritalarda şaman sensin
    const bots = this.mice.slice(1);
    this.shaman = map.needsShaman ? this.player : bots[this.round % bots.length];
    this.mice.forEach((m, i) => {
      Object.assign(m, {
        x: 50 + i * 30, y: 960 - TF.H, vx: 0, vy: 0, face: 1, onGround: true,
        hasCheese: false, done: false, dead: false, rank: 0, shaman: m === this.shaman,
        runPhase: 0, jumpBuf: 0, squash: 0
      });
      m.ai = {
        wpi: 0, delay: 0.25 + Math.random() * 0.9, speedK: 0.86 + Math.random() * 0.12,
        stuckT: 0, lastX: m.x, retreat: 0, hold: 0, jumpCD: 0, wait: false
      };
    });
    if (this.shaman) this.shaman.x = 20;
    if (!map.needsShaman && map.help) this.helpQueue = map.help.map((h, i) => ({ ...h, at: 2.2 + i * 1.2 }));
    this.inv = { plank: 2, box: 2, spring: 1 };
    this.itemSel = map.name === 'Duvar' ? 'spring' : 'plank';
    this.cursor = { x: 960, y: 320 };
    this.phase = 'intro'; this.phaseT = 2.8;
    this.timeLeft = TF.ROUND_TIME;
  }

  endRound() {
    const runners = this.mice.filter(m => !m.shaman);
    const saved = runners.filter(m => m.done).length;
    if (this.shaman) this.shaman.score += saved * TF.SHAMAN_POINTS;
    if (this.shaman === this.player && saved >= 4) this.sys.trophy('shaman');
    const finishers = runners.filter(m => m.done).sort((a, b) => a.rank - b.rank);
    this.results = { finishers, saved };
    this.phase = 'results'; this.phaseT = 3.8;
  }

  nextRound() {
    this.round++;
    if (this.round >= TF.ROUNDS) {
      this.phase = 'final'; this.phaseT = 4.5;
      const rank = this.standings().indexOf(this.player) + 1;
      if (rank === 1) this.sys.trophy('champ');
      return;
    }
    this.startRound();
  }

  standings() { return [...this.mice].sort((a, b) => b.score - a.score); }

  say(text, color) { this.banner = { text, color: color || '#fff', t: 2.2 }; }

  /* ---------- Giriş ---------- */
  input(a) {
    if (this.phase !== 'run' && this.phase !== 'intro') return;
    const p = this.player;
    if (p.shaman) {
      if (a === 'triangle' || a === 'square') {
        const keys = Object.keys(TF_ITEMS);
        this.itemSel = keys[(keys.indexOf(this.itemSel) + 1) % keys.length];
        Sound.nav();
      } else if (a === 'x' && this.phase === 'run') {
        this.tryPlace(this.itemSel, this.cursor.x, this.cursor.y, true);
      }
      return;
    }
    if (a === 'x' || a === 'up') p.jumpBuf = 0.14;
  }

  /* ---------- Dünya sorguları ---------- */
  solidsAll() { return this.statics.concat(this.items); }

  // x noktasında, yFrom'dan aşağı doğru en yakın yüzey (katı veya tehlike)
  surfaceAt(x, yFrom, depth) {
    let best = null;
    for (const s of this.solidsAll()) {
      if (x >= s.x && x <= s.x + s.w && s.y >= yFrom && s.y <= yFrom + depth && (!best || s.y < best.y)) best = { y: s.y, hazard: false };
    }
    for (const h of this.hazards) {
      if (x >= h.x && x <= h.x + h.w && h.y >= yFrom && h.y <= yFrom + depth && (!best || h.y < best.y)) best = { y: h.y, hazard: true };
    }
    return best;
  }

  tryPlace(type, cx, cy, byPlayer) {
    const d = TF_ITEMS[type];
    if (byPlayer && this.inv[type] <= 0) { Sound.error(); return false; }
    const it = { type, x: cx - d.w / 2, y: cy - d.h / 2, w: d.w, h: d.h, vy: 0, rest: false, squash: 0 };
    if (this.solidsAll().some(s => tfOverlap(it, s))) { if (byPlayer) Sound.error(); return false; }
    this.items.push(it);
    if (byPlayer) this.inv[type]--;
    Sound.select();
    burst(this.parts, cx, cy, '#bfe6ff', 16, 260);
    return true;
  }

  /* ---------- Güncelleme ---------- */
  update(dt) {
    this.t += dt;
    updateParticles(this.parts, dt);
    if (this.banner && (this.banner.t -= dt) <= 0) this.banner = null;
    for (const it of this.items) it.squash = Math.max(0, it.squash - dt);

    if (this.phase === 'intro') {
      this.moveCursor(dt);
      if ((this.phaseT -= dt) <= 0) { this.phase = 'run'; Sound.select(); }
      return;
    }
    if (this.phase === 'results') {
      if ((this.phaseT -= dt) <= 0) this.nextRound();
      return;
    }
    if (this.phase === 'final') {
      if ((this.phaseT -= dt) <= 0 && !this.overCalled) {
        this.overCalled = true;
        const rank = this.standings().indexOf(this.player) + 1;
        this.sys.over(this.player.score, rank === 1 ? 'PEYNİR KRALI SENSİN!' : `${rank}. SIRADA BİTİRDİN`, `Toplam puan: ${this.player.score}`);
      }
      return;
    }

    // run
    this.timeLeft -= dt;
    this.moveCursor(dt);
    for (const h of this.helpQueue) {
      if (!h.done && TF.ROUND_TIME - this.timeLeft >= h.at) {
        h.done = true;
        if (this.tryPlace(h.type, h.x, h.y, false)) this.say(`Şaman ${this.shaman.name} bir ${TF_ITEMS[h.type].name.toLocaleLowerCase('tr-TR')} yerleştirdi`, '#8fd3ff');
      }
    }
    const N = Math.max(1, Math.ceil(dt / (1 / 120)));
    for (let i = 0; i < N; i++) this.step(dt / N);

    const runners = this.mice.filter(m => !m.shaman);
    const active = runners.filter(m => !m.done && !m.dead);
    const p = this.player;
    if (!p.shaman && (p.done || p.dead) && this.timeLeft > 12) this.timeLeft = 12;
    if (!active.length || this.timeLeft <= 0) this.endRound();
  }

  moveCursor(dt) {
    if (!this.player.shaman) return;
    const h = this.sys.held;
    const mx = (h('right') ? 1 : 0) - (h('left') ? 1 : 0);
    const my = (h('down') ? 1 : 0) - (h('up') ? 1 : 0);
    this.cursor.x = clamp(this.cursor.x + mx * 950 * dt, 40, 1880);
    this.cursor.y = clamp(this.cursor.y + my * 950 * dt, 90, 1040);
  }

  step(h) {
    // Düşen eşyalar
    for (const it of this.items) {
      if (it.rest) continue;
      it.vy = Math.min(it.vy + TF.G * h, TF.MAXFALL);
      it.y += it.vy * h;
      for (const s of this.statics.concat(this.items.filter(o => o !== it && o.rest))) {
        if (tfOverlap(it, s)) { it.y = s.y - it.h; it.vy = 0; it.rest = true; Sound.tick(); break; }
      }
    }
    this.items = this.items.filter(it => it.y < 1150);

    for (const m of this.mice) {
      if (m.shaman || m.done || m.dead) continue;
      if (m.isPlayer) this.controlPlayer(m, h); else this.controlBot(m, h);
      this.physics(m, h);
      this.checkMouse(m);
    }
  }

  controlPlayer(m, h) {
    const held = this.sys.held;
    const mv = (held('right') ? 1 : 0) - (held('left') ? 1 : 0);
    this.accel(m, mv * TF.RUN, h);
    if (mv) m.face = mv;
    if (m.jumpBuf > 0 && m.onGround) { this.jump(m); m.jumpBuf = 0; Sound.tick(); }
    m.jumpBuf -= h;
    // Tuş bırakılırsa daha kısa zıpla
    if (m.vy < 0 && !(held('x') || held('up'))) m.vy += TF.G * h * 1.3;
  }

  accel(m, target, h) {
    m.vx += (target - m.vx) * Math.min(1, h * (m.onGround ? 18 : 9));
  }
  jump(m) { m.vy = -TF.JUMP; m.onGround = false; }

  /* Yapay zekâ: ara noktaları takip eder; duvar, çıkıntı ve boşlukları değerlendirir */
  controlBot(m, h) {
    const ai = m.ai;
    if (ai.delay > 0) { ai.delay -= h; this.accel(m, 0, h); return; }
    ai.jumpCD -= h;
    const path = m.hasCheese ? this.map.pathB : this.map.pathA;
    const cx = m.x + m.w / 2, by = m.y + m.h;
    ai.wpi = Math.min(ai.wpi, path.length - 1);
    let wp = path[ai.wpi];
    if (m.onGround) {
      // Ara noktaya varınca sonrakine geç; çok aşağı düştüyse yolu baştan al
      if (Math.abs(wp[0] - cx) < 24 && Math.abs(wp[1] - by) < 30 && ai.wpi < path.length - 1) ai.wpi++;
      else if (ai.wpi > 0 && by - wp[1] > 200) ai.wpi = 0;
      wp = path[ai.wpi];
    }
    let dir = Math.abs(wp[0] - cx) < 8 ? 0 : Math.sign(wp[0] - cx);
    ai.wait = false;

    // Hedef yukarıdayken bir platformun altında kaldıysa en yakın kenardan dışarı çık
    if (m.onGround && ai.retreat <= 0 && ai.hold <= 0 && wp[1] < by - 40) {
      const over = this.solidsAll().find(s => s.x < m.x + m.w && s.x + s.w > m.x && s.y + s.h <= m.y + 1 && s.y + s.h >= by - 200);
      if (over) {
        const exitDir = (cx - over.x) < (over.x + over.w - cx) ? -1 : 1;
        const dist = (exitDir < 0 ? cx - over.x : over.x + over.w - cx) + 60;
        ai.retreat = dist / (TF.RUN * ai.speedK); ai.retreatDir = -exitDir;
      }
    }

    if (ai.hold > 0) { ai.hold -= h; dir = 0; }
    else if (ai.retreat > 0) {
      ai.retreat -= h; dir = -ai.retreatDir;
      // Geri çekilirken önüne çıkan alçak engelin (ör. trambolin) üstüne zıpla
      const back = m.onGround ? this.blockAhead(m, dir) : { wall: null };
      if (back.wall !== null && by - back.wall > TF.STEP && by - back.wall <= 145 && ai.jumpCD <= 0) { this.jump(m); ai.jumpCD = 0.3; }
    }
    else if (m.onGround && dir !== 0) {
      const blk = this.blockAhead(m, dir);
      if (blk.wall !== null) {
        const wh = by - blk.wall;
        if (wh > TF.STEP && wh <= 145) { if (ai.jumpCD <= 0) { this.jump(m); ai.jumpCD = 0.3; } }
        else if (wh > 145) { ai.retreat = 0.35 + Math.random() * 0.3; ai.retreatDir = dir; dir = -dir; ai.wait = true; }
      } else if (blk.ledge !== null && wp[1] < by - 40 && by - blk.ledge <= 155 && ai.jumpCD <= 0) {
        // Havadaki platforma: önce dikey yüksel, sonra üstüne geç (altına kaymasın)
        this.jump(m); ai.jumpCD = 0.3; m.vx = 0; ai.hold = 0.26; dir = 0;
      } else {
        const under = this.surfaceAt(cx + dir * (m.w / 2 + 6), by - 2, 40);
        if (!under || under.hazard) {
          const c = this.edgeChoice(m, dir, wp);
          if (c === 'jump' && ai.jumpCD <= 0) { this.jump(m); ai.jumpCD = 0.3; }
          else if (c === 'wait') { dir = 0; ai.wait = true; }
        }
      }
    }
    this.accel(m, dir * TF.RUN * ai.speedK, h);
    if (dir) m.face = dir;

    // Takılma tespiti
    if (dir !== 0 && !ai.wait && m.onGround) {
      if (Math.abs(m.x - ai.lastX) < 2) {
        ai.stuckT += h;
        if (ai.stuckT > 0.8 && ai.jumpCD <= 0) { this.jump(m); ai.jumpCD = 0.4; ai.stuckT = 0; }
      } else ai.stuckT = 0;
    }
    ai.lastX = m.x;
  }

  blockAhead(m, dir) {
    const by = m.y + m.h;
    const x0 = dir > 0 ? m.x + m.w : m.x - 14, x1 = x0 + 14;
    let wall = null, ledge = null;
    for (const s of this.solidsAll()) {
      if (s.x + s.w <= x0 || s.x >= x1) continue;
      if (s.y < by - 2 && s.y + s.h > by - m.h + 2) { if (wall === null || s.y < wall) wall = s.y; }
      else if (s.y + s.h <= by - m.h + 2 && s.y >= by - 175) {
        // Çıkıntının kenarı önümüzde olmalı (zaten altındaysak sayma)
        const ahead = dir > 0 ? s.x >= m.x + m.w - 1 : s.x + s.w <= m.x + 1;
        if (ahead && (ledge === null || s.y > ledge)) ledge = s.y;
      }
    }
    return { wall, ledge };
  }

  edgeChoice(m, dir, wp) {
    const cx = m.x + m.w / 2, by = m.y + m.h;
    let landing = false;
    for (let d = 40; d <= 250; d += 10) {
      const s = this.surfaceAt(cx + dir * d, by - 140, 260);
      if (s && !s.hazard) { landing = true; break; }
    }
    const drop = this.surfaceAt(cx + dir * (m.w / 2 + 18), by, 900);
    const dropSafe = !!(drop && !drop.hazard);
    if (wp[1] > by + 60 && dropSafe) return 'drop';
    if (landing) return 'jump';
    if (dropSafe) return 'drop';
    return 'wait';
  }

  physics(m, h) {
    m.vy = Math.min(m.vy + TF.G * h, TF.MAXFALL);
    const solids = this.solidsAll();
    // Yatay
    m.x += m.vx * h;
    for (const s of solids) {
      if (!tfOverlap(m, s)) continue;
      const rise = m.y + m.h - s.y;
      if (m.onGround && rise > 0 && rise <= TF.STEP) { m.y = s.y - m.h; continue; }
      if (m.vx > 0) m.x = s.x - m.w; else if (m.vx < 0) m.x = s.x + s.w;
      m.vx = 0;
    }
    m.x = clamp(m.x, 0, 1920 - m.w);
    // Dikey
    m.y += m.vy * h;
    m.onGround = false;
    let landed = null;
    for (const s of solids) {
      if (!tfOverlap(m, s)) continue;
      if (m.vy >= 0) { m.y = s.y - m.h; m.vy = 0; m.onGround = true; landed = s; }
      else { m.y = s.y + s.h; m.vy = 0; }
    }
    if (landed && landed.type === 'spring') {
      m.vy = -TF.SPRING; m.onGround = false; landed.squash = 0.25;
      if (m.isPlayer) Sound.blip();
    }
    if (m.onGround && Math.abs(m.vx) > 20) m.runPhase += h * Math.abs(m.vx) * 0.06;
  }

  checkMouse(m) {
    const cx = m.x + m.w / 2, cy = m.y + m.h / 2, by = m.y + m.h;
    if (m.y > 1100 || this.hazards.some(z => tfOverlap(m, z))) {
      m.dead = true;
      burst(this.parts, cx, Math.min(cy, 1060), '#ff7a3c', 22, 380);
      if (m.isPlayer) { Sound.crash(); this.say('Elendin! Diğer fareleri izliyorsun…', '#ff8a8a'); }
      return;
    }
    if (!m.hasCheese && Math.hypot(cx - this.cheese.x, cy - this.cheese.y) < 44) {
      m.hasCheese = true;
      m.ai.wpi = 0;
      if (m.isPlayer) { Sound.blip(); this.say('Peyniri kaptın! Şimdi yuvaya koş!', '#ffd23f'); this.sys.trophy('cheese'); }
    }
    if (m.hasCheese && Math.abs(cx - this.hole.x) < 34 && by > this.hole.y - 40 && by <= this.hole.y + 2) {
      m.done = true;
      m.rank = ++this.finished;
      m.score += TF.FINISH_POINTS[Math.min(m.rank - 1, TF.FINISH_POINTS.length - 1)];
      burst(this.parts, this.hole.x, this.hole.y - 20, '#ffe680', 18, 300);
      if (m.isPlayer) {
        Sound.levelUp();
        this.say(m.rank === 1 ? 'Yuvaya İLK sen girdin! +16' : `Yuvaya ${m.rank}. girdin!`, '#7dff9a');
        this.sys.trophy('hole');
        if (m.rank === 1) this.sys.trophy('first');
      }
    }
  }

  /* ---------- Çizim ---------- */
  draw(ctx) {
    const t = this.t;
    // Gökyüzü
    const sky = ctx.createLinearGradient(0, 0, 0, 1080);
    sky.addColorStop(0, '#6f9fd0'); sky.addColorStop(1, '#cfe2ef');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, 1920, 1080);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (const c of this.clouds) {
      const x = ((c.x + t * 12 * c.s) % 2200) - 140;
      ctx.beginPath();
      ctx.ellipse(x, c.y, 70 * c.s, 26 * c.s, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 45 * c.s, c.y - 14 * c.s, 50 * c.s, 24 * c.s, 0, 0, Math.PI * 2);
      ctx.ellipse(x - 45 * c.s, c.y - 6 * c.s, 40 * c.s, 20 * c.s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(90,130,120,0.35)';
    ctx.beginPath(); ctx.moveTo(0, 960);
    for (let x = 0; x <= 1920; x += 40) ctx.lineTo(x, 860 + Math.sin(x * 0.004) * 50 + Math.sin(x * 0.011) * 20);
    ctx.lineTo(1920, 960); ctx.fill();

    // Lav
    for (const z of this.hazards) {
      const g = ctx.createLinearGradient(0, z.y, 0, z.y + z.h);
      g.addColorStop(0, '#ffb13b'); g.addColorStop(1, '#d42a00');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(z.x, z.y + z.h);
      for (let x = z.x; x <= z.x + z.w; x += 10) ctx.lineTo(x, z.y + Math.sin(x * 0.05 + t * 4) * 4);
      ctx.lineTo(z.x + z.w, z.y + z.h); ctx.fill();
      ctx.fillStyle = 'rgba(255,200,80,0.25)'; ctx.fillRect(z.x, z.y - 30, z.w, 30);
    }

    // Zemin ve platformlar
    for (const s of this.statics) {
      const ground = s.h >= 60;
      ctx.fillStyle = ground ? '#7a5534' : '#a0703f';
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.fillStyle = ground ? '#5e4027' : '#80562f';
      for (let x = s.x + 20; x < s.x + s.w - 10; x += 46) ctx.fillRect(x, s.y + 22, 14, 6);
      ctx.fillStyle = ground ? '#6dbb45' : '#c08a52';
      ctx.fillRect(s.x, s.y, s.w, ground ? 10 : 6);
      ctx.strokeStyle = 'rgba(40,25,10,0.55)'; ctx.lineWidth = 2;
      ctx.strokeRect(s.x + 1, s.y + 1, s.w - 2, s.h - 2);
    }

    this.drawHole(ctx);
    for (const it of this.items) this.drawItem(ctx, it, 1);
    this.drawCheese(ctx, this.cheese.x, this.cheese.y + Math.sin(t * 3) * 4, 1);

    // Fareler (oyuncu en üstte)
    for (const m of this.mice.slice(1)) this.drawMouse(ctx, m);
    this.drawMouse(ctx, this.player);
    drawParticles(ctx, this.parts);

    // Şaman imleci
    if (this.player.shaman && (this.phase === 'run' || this.phase === 'intro')) {
      const d = TF_ITEMS[this.itemSel];
      const ghost = { type: this.itemSel, x: this.cursor.x - d.w / 2, y: this.cursor.y - d.h / 2, w: d.w, h: d.h, squash: 0 };
      const ok = this.inv[this.itemSel] > 0 && !this.solidsAll().some(s => tfOverlap(ghost, s));
      ctx.globalAlpha = 0.55; this.drawItem(ctx, ghost, 1); ctx.globalAlpha = 1;
      ctx.strokeStyle = ok ? '#7dff9a' : '#ff6b6b'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
      ctx.strokeRect(ghost.x - 4, ghost.y - 4, ghost.w + 8, ghost.h + 8); ctx.setLineDash([]);
    }

    this.drawHUD(ctx);
  }

  drawHole(ctx) {
    const { x, y } = this.hole;
    ctx.fillStyle = '#8a5a2b';
    ctx.beginPath(); ctx.arc(x, y, 40, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#20140b';
    ctx.beginPath(); ctx.arc(x, y, 31, Math.PI, 0); ctx.fill();
    ctx.fillStyle = 'rgba(255,230,120,' + (0.25 + 0.2 * Math.sin(this.t * 4)) + ')';
    ctx.beginPath(); ctx.arc(x, y - 52, 6, 0, Math.PI * 2); ctx.fill();
  }

  drawCheese(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.shadowColor = 'rgba(255,220,80,0.8)'; ctx.shadowBlur = 18;
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath(); ctx.moveTo(-22, 14); ctx.lineTo(22, 14); ctx.lineTo(22, -6); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffe680';
    ctx.beginPath(); ctx.moveTo(-22, 14); ctx.lineTo(22, -6); ctx.lineTo(22, -12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8a800';
    ctx.beginPath(); ctx.arc(10, 6, 3.5, 0, Math.PI * 2); ctx.arc(-4, 10, 2.5, 0, Math.PI * 2); ctx.arc(17, 0, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  drawItem(ctx, it) {
    const { x, y, w, h } = it;
    if (it.type === 'plank') {
      ctx.fillStyle = '#b5793f'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 4); ctx.fill();
      ctx.strokeStyle = '#7d4f24'; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); for (let i = 1; i < 4; i++) { ctx.moveTo(x + w * i / 4, y + 3); ctx.lineTo(x + w * i / 4, y + h - 3); } ctx.stroke();
    } else if (it.type === 'box') {
      ctx.fillStyle = '#c28b4e'; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#7d4f24'; ctx.lineWidth = 4; ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
      ctx.beginPath(); ctx.moveTo(x + 6, y + 6); ctx.lineTo(x + w - 6, y + h - 6); ctx.moveTo(x + w - 6, y + 6); ctx.lineTo(x + 6, y + h - 6); ctx.stroke();
    } else {
      const sq = it.squash > 0 ? 6 : 0;
      ctx.fillStyle = '#56606e'; ctx.fillRect(x + 4, y + h - 6, w - 8, 6);
      ctx.strokeStyle = '#9aa6b5'; ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i <= 6; i++) { const px = x + 10 + i * (w - 20) / 6; ctx.lineTo(px, i % 2 ? y + 8 + sq : y + h - 6); }
      ctx.stroke();
      ctx.fillStyle = '#e8453c'; ctx.beginPath(); ctx.roundRect(x, y + sq, w, 8, 4); ctx.fill();
    }
  }

  drawMouse(ctx, m) {
    if (m.done || m.dead) return;
    const cx = m.x + m.w / 2, fy = m.y + m.h;
    const fur = m.fur, dark = 'rgba(60,40,25,0.85)';
    const moving = m.onGround && Math.abs(m.vx) > 20;
    const leg = moving ? Math.sin(m.runPhase) * 4 : 0;
    const bob = m.shaman ? Math.sin(this.t * 2) * 1.5 : 0;
    ctx.save();
    ctx.translate(cx, fy + bob);
    ctx.scale(m.face, 1);
    // kuyruk
    ctx.strokeStyle = dark; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-14, -10); ctx.quadraticCurveTo(-30, -22 + Math.sin(this.t * 6 + cx) * 4, -38, -6); ctx.stroke();
    // bacaklar
    ctx.strokeStyle = dark; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-6, -3); ctx.lineTo(-6 + leg, 0); ctx.moveTo(7, -3); ctx.lineTo(7 - leg, 0); ctx.stroke();
    // gövde + kafa
    ctx.fillStyle = fur;
    ctx.beginPath(); ctx.ellipse(-1, -11, 17, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(13, -16, 9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(8, -25, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2b8c6'; ctx.beginPath(); ctx.arc(8, -25, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1d1410'; ctx.beginPath(); ctx.arc(16, -18, 1.9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff7a9a'; ctx.beginPath(); ctx.arc(22, -15, 2.2, 0, Math.PI * 2); ctx.fill();
    // şaman tüyü
    if (m.shaman) {
      ctx.fillStyle = '#5fb7ff';
      ctx.beginPath(); ctx.ellipse(4, -34, 4, 11, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#e6f4ff'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(9, -26); ctx.lineTo(0, -42); ctx.stroke();
    }
    ctx.restore();
    if (m.hasCheese) this.drawCheese(ctx, cx - m.face * 4, fy - 34, 0.55);
    // isim
    ctx.font = '600 15px "Segoe UI", Roboto, Arial, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    const label = m.name.length > 14 ? m.name.slice(0, 13) + '…' : m.name;
    const ly = fy - (m.hasCheese ? 50 : m.shaman ? 50 : 34);
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillText(label, cx + 1, ly + 1);
    ctx.fillStyle = m.shaman ? '#9fdcff' : m.isPlayer ? '#ffd23f' : '#ffffff';
    ctx.fillText(label, cx, ly);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  drawHUD(ctx) {
    const font = w => `${w} "Segoe UI", Roboto, Arial, sans-serif`;
    // Üst çubuk
    ctx.fillStyle = 'rgba(28,40,58,0.9)'; ctx.fillRect(0, 0, 1920, 56);
    ctx.fillStyle = '#ffd23f'; ctx.font = font('700 26px'); ctx.textBaseline = 'middle';
    ctx.fillText('PEYNİR AVCILARI', 24, 29);
    ctx.fillStyle = '#dfe8f3'; ctx.font = font('500 24px'); ctx.textAlign = 'center';
    ctx.fillText(`Tur ${Math.min(this.round + 1, TF.ROUNDS)}/${TF.ROUNDS}   ·   ${this.map.code} ${this.map.name}   ·   Şaman: ${this.shaman ? this.shaman.name : '-'}`, 960, 29);
    ctx.textAlign = 'right';
    const tl = Math.max(0, Math.ceil(this.timeLeft));
    ctx.fillStyle = tl <= 15 && this.phase === 'run' ? '#ff8a8a' : '#dfe8f3';
    ctx.fillText(`${Math.floor(tl / 60)}:${String(tl % 60).padStart(2, '0')}`, 1890, 29);
    ctx.textAlign = 'left';

    // Puan tablosu
    const list = this.standings();
    ctx.fillStyle = 'rgba(28,40,58,0.72)';
    ctx.beginPath(); ctx.roundRect(12, 68, 270, 18 + list.length * 28, 6); ctx.fill();
    ctx.font = font('500 18px');
    list.forEach((m, i) => {
      const y = 90 + i * 28;
      ctx.fillStyle = m.isPlayer ? '#ffd23f' : '#e6edf5';
      ctx.fillText(`${i + 1}. ${m.name.length > 13 ? m.name.slice(0, 12) + '…' : m.name}`, 26, y);
      ctx.textAlign = 'right'; ctx.fillText(String(m.score), 270, y); ctx.textAlign = 'left';
      const ix = 200;
      if (m.shaman) { ctx.fillStyle = '#5fb7ff'; ctx.beginPath(); ctx.ellipse(ix, y, 4, 9, -0.5, 0, Math.PI * 2); ctx.fill(); }
      else if (m.done) { ctx.strokeStyle = '#7dff9a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ix - 7, y); ctx.lineTo(ix - 2, y + 5); ctx.lineTo(ix + 7, y - 6); ctx.stroke(); }
      else if (m.dead) { ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ix - 6, y - 6); ctx.lineTo(ix + 6, y + 6); ctx.moveTo(ix + 6, y - 6); ctx.lineTo(ix - 6, y + 6); ctx.stroke(); }
      else if (m.hasCheese) { ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(ix - 8, y + 6); ctx.lineTo(ix + 8, y + 6); ctx.lineTo(ix + 8, y - 6); ctx.fill(); }
    });

    // Şaman eşya çubuğu
    if (this.player.shaman && this.phase !== 'final') {
      const keys = Object.keys(TF_ITEMS);
      const bw = 230, x0 = 960 - (keys.length * bw) / 2;
      ctx.fillStyle = 'rgba(28,40,58,0.85)'; ctx.beginPath(); ctx.roundRect(x0 - 16, 64, keys.length * bw + 32, 104, 8); ctx.fill();
      keys.forEach((k, i) => {
        const x = x0 + i * bw;
        if (k === this.itemSel) { ctx.fillStyle = 'rgba(143,211,255,0.25)'; ctx.beginPath(); ctx.roundRect(x, 72, bw - 10, 54, 6); ctx.fill(); ctx.strokeStyle = '#8fd3ff'; ctx.lineWidth = 2; ctx.stroke(); }
        ctx.fillStyle = this.inv[k] > 0 ? '#ffffff' : '#7d8794';
        ctx.font = font('600 22px'); ctx.fillText(`${TF_ITEMS[k].name}  ×${this.inv[k]}`, x + 18, 100);
      });
      ctx.font = font('400 18px'); ctx.fillStyle = '#dfe8f3'; ctx.textAlign = 'center';
      ctx.fillText('Yön tuşları: imleç   ·   ✕ (Enter): yerleştir   ·   △ (T): eşya değiştir', 960, 150);
      ctx.textAlign = 'left';
    }

    // Duyuru
    if (this.banner && this.phase === 'run') {
      ctx.font = font('700 34px'); ctx.textAlign = 'center';
      ctx.globalAlpha = Math.min(1, this.banner.t * 2);
      const byY = this.player.shaman ? 210 : 112;
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillText(this.banner.text, 962, byY + 2);
      ctx.fillStyle = this.banner.color; ctx.fillText(this.banner.text, 960, byY);
      ctx.globalAlpha = 1; ctx.textAlign = 'left';
    }

    // Tur başı / sonu panelleri
    if (this.phase === 'intro' || this.phase === 'results' || this.phase === 'final') {
      ctx.fillStyle = 'rgba(15,22,34,0.82)';
      ctx.beginPath(); ctx.roundRect(560, 300, 800, 380, 14); ctx.fill();
      ctx.strokeStyle = 'rgba(143,211,255,0.5)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
      if (this.phase === 'intro') {
        ctx.font = font('700 46px'); ctx.fillText(`Tur ${this.round + 1}`, 960, 370);
        ctx.font = font('500 32px'); ctx.fillStyle = '#ffd23f'; ctx.fillText(`${this.map.code}  ${this.map.name}`, 960, 425);
        ctx.fillStyle = '#dfe8f3'; ctx.font = font('400 26px');
        if (this.player.shaman) {
          ctx.fillStyle = '#9fdcff'; ctx.font = font('700 30px'); ctx.fillText('Bu tur ŞAMAN sensin!', 960, 495);
          ctx.fillStyle = '#dfe8f3'; ctx.font = font('400 24px');
          ctx.fillText('Farelerin peynire ve yuvaya ulaşmasına yardım et.', 960, 540);
          if (this.map.tip) ctx.fillText(this.map.tip, 960, 578);
          ctx.fillText(`Kurtardığın her fare +${TF.SHAMAN_POINTS} puan`, 960, 616);
        } else {
          ctx.fillText(`Şaman: ${this.shaman.name}`, 960, 490);
          ctx.fillText('Peyniri kap, yuvaya ilk sen gir!', 960, 540);
          ctx.font = font('400 22px'); ctx.fillStyle = '#aab6c4';
          ctx.fillText('Sol/Sağ: koş   ·   ✕ / Yukarı: zıpla', 960, 600);
        }
      } else if (this.phase === 'results') {
        ctx.font = font('700 42px'); ctx.fillText('Tur bitti!', 960, 365);
        ctx.font = font('500 26px');
        const f = this.results.finishers;
        if (!f.length) { ctx.fillStyle = '#ff9a9a'; ctx.fillText('Hiçbir fare yuvaya ulaşamadı…', 960, 440); }
        f.slice(0, 4).forEach((m, i) => {
          ctx.fillStyle = m.isPlayer ? '#ffd23f' : '#e6edf5';
          ctx.fillText(`${i + 1}. ${m.name}   +${TF.FINISH_POINTS[i]}`, 960, 430 + i * 42);
        });
        ctx.fillStyle = '#9fdcff'; ctx.font = font('400 24px');
        ctx.fillText(`Şaman ${this.shaman.name} ${this.results.saved} fare kurtardı (+${this.results.saved * TF.SHAMAN_POINTS})`, 960, 640);
      } else {
        ctx.font = font('700 42px'); ctx.fillText('Oyun bitti — Sıralama', 960, 365);
        ctx.font = font('500 26px');
        this.standings().slice(0, 5).forEach((m, i) => {
          ctx.fillStyle = m.isPlayer ? '#ffd23f' : '#e6edf5';
          ctx.fillText(`${i + 1}. ${m.name} — ${m.score} puan`, 960, 430 + i * 44);
        });
      }
      ctx.textAlign = 'left';
    }
    ctx.textBaseline = 'alphabetic';
  }
}
