'use strict';

/* Ortak parçacık sistemi */
function updateParticles(parts, dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= dt;
    if (p.life <= 0) { parts.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= 0.95; p.vy *= 0.95;
  }
}
function drawParticles(ctx, parts) {
  for (const p of parts) {
    ctx.globalAlpha = Math.min(1, p.life * 2);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
  }
  ctx.globalAlpha = 1;
}
function burst(parts, x, y, color, n, speed) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = (Math.random() * 0.7 + 0.3) * (speed || 600);
    parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.4 + Math.random() * 0.5, color });
  }
}
function hud(ctx, left, right, color) {
  ctx.font = '600 34px "Segoe UI", Roboto, Arial, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color || '#fff';
  ctx.textAlign = 'left'; ctx.fillText(left, 160, 70);
  ctx.textAlign = 'right'; ctx.fillText(right, 1760, 70);
  ctx.textAlign = 'left';
}

/* ================= NEON YILAN ================= */
class SnakeGame {
  constructor(sys) {
    this.sys = sys;
    this.cols = 32; this.rows = 18; this.cell = 50;
    this.ox = 160; this.oy = 130;
    this.reset();
  }
  reset() {
    this.snake = [{ x: 10, y: 9 }, { x: 9, y: 9 }, { x: 8, y: 9 }, { x: 7, y: 9 }];
    this.dir = { x: 1, y: 0 }; this.queue = [];
    this.score = 0; this.acc = 0; this.step = 0.11; this.t = 0;
    this.alive = true; this.ending = 0; this.parts = [];
    this.placeFood();
  }
  placeFood() {
    let p;
    do { p = { x: Math.floor(Math.random() * this.cols), y: Math.floor(Math.random() * this.rows) }; }
    while (this.snake.some(s => s.x === p.x && s.y === p.y));
    this.food = p;
  }
  input(a) {
    const D = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }[a];
    if (!D || !this.alive) return;
    const last = this.queue.length ? this.queue[this.queue.length - 1] : this.dir;
    if ((D.x === -last.x && D.y === -last.y) || (D.x === last.x && D.y === last.y)) return;
    if (this.queue.length < 3) this.queue.push(D);
  }
  update(dt) {
    this.t += dt;
    updateParticles(this.parts, dt);
    if (this.ending > 0) {
      this.ending -= dt;
      if (this.ending <= 0) this.sys.over(this.score);
      return;
    }
    this.acc += dt;
    while (this.acc >= this.step && this.alive) { this.acc -= this.step; this.tick(); }
  }
  cx(x) { return this.ox + (x + 0.5) * this.cell; }
  cy(y) { return this.oy + (y + 0.5) * this.cell; }
  tick() {
    if (this.queue.length) this.dir = this.queue.shift();
    const h = this.snake[0];
    const n = { x: h.x + this.dir.x, y: h.y + this.dir.y };
    const eating = n.x === this.food.x && n.y === this.food.y;
    const body = eating ? this.snake : this.snake.slice(0, -1);
    if (n.x < 0 || n.y < 0 || n.x >= this.cols || n.y >= this.rows || body.some(s => s.x === n.x && s.y === n.y)) {
      this.alive = false; this.ending = 0.9;
      Sound.crash();
      burst(this.parts, this.cx(h.x), this.cy(h.y), '#ff4d6d', 40);
      return;
    }
    this.snake.unshift(n);
    if (eating) {
      this.score++;
      Sound.blip();
      burst(this.parts, this.cx(n.x), this.cy(n.y), '#ffe66d', 18, 450);
      this.step = Math.max(0.05, this.step * 0.975);
      this.placeFood();
      this.sys.trophy('first');
      if (this.score >= 10) this.sys.trophy('ten');
      if (this.score >= 25) this.sys.trophy('twentyfive');
      if (this.score >= 40) this.sys.trophy('forty');
    } else {
      this.snake.pop();
    }
  }
  draw(ctx) {
    const { ox, oy, cell, cols, rows } = this;
    const bg = ctx.createRadialGradient(960, 540, 100, 960, 540, 1100);
    bg.addColorStop(0, '#081a24'); bg.addColorStop(1, '#02050a');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, 1920, 1080);

    ctx.strokeStyle = 'rgba(0,230,184,0.07)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= cols; x++) { ctx.moveTo(ox + x * cell, oy); ctx.lineTo(ox + x * cell, oy + rows * cell); }
    for (let y = 0; y <= rows; y++) { ctx.moveTo(ox, oy + y * cell); ctx.lineTo(ox + cols * cell, oy + y * cell); }
    ctx.stroke();

    ctx.save();
    ctx.shadowColor = '#00e6b8'; ctx.shadowBlur = 24;
    ctx.strokeStyle = '#00e6b8'; ctx.lineWidth = 4;
    ctx.strokeRect(ox - 2, oy - 2, cols * cell + 4, rows * cell + 4);

    // yem
    const pulse = 1 + Math.sin(this.t * 8) * 0.12;
    ctx.shadowColor = '#ffe66d'; ctx.shadowBlur = 30;
    ctx.fillStyle = '#ffe66d';
    ctx.beginPath(); ctx.arc(this.cx(this.food.x), this.cy(this.food.y), cell * 0.3 * pulse, 0, Math.PI * 2); ctx.fill();

    // yılan
    ctx.shadowBlur = 18;
    const n = this.snake.length;
    this.snake.forEach((s, i) => {
      const hue = 165 - Math.min(i * 3, 90);
      const col = this.alive ? `hsl(${hue},100%,${i === 0 ? 70 : 55}%)` : `hsl(350,90%,${60 - i}%)`;
      ctx.shadowColor = col; ctx.fillStyle = col;
      const pad = i === 0 ? 3 : 5 + Math.min(i / n * 6, 6);
      ctx.beginPath();
      ctx.roundRect(ox + s.x * cell + pad, oy + s.y * cell + pad, cell - pad * 2, cell - pad * 2, 10);
      ctx.fill();
    });
    ctx.restore();

    // göz
    const h = this.snake[0];
    ctx.fillStyle = '#04121a';
    const ex = this.dir.y !== 0 ? 9 : 0, ey = this.dir.x !== 0 ? 9 : 0;
    const fx = this.dir.x * 8, fy = this.dir.y * 8;
    ctx.beginPath(); ctx.arc(this.cx(h.x) + fx - ex, this.cy(h.y) + fy - ey, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(this.cx(h.x) + fx + ex, this.cy(h.y) + fy + ey, 5, 0, Math.PI * 2); ctx.fill();

    drawParticles(ctx, this.parts);
    hud(ctx, 'NEON YILAN', `PUAN ${this.score}    EN İYİ ${Math.max(this.sys.best(), this.score)}`, '#7fffe4');
  }
}

/* ================= BLOK KIRICI ================= */
class BreakoutGame {
  constructor(sys) {
    this.sys = sys;
    this.L = 260; this.R = 1660; this.T = 120; this.B = 1080;
    this.reset();
  }
  reset() {
    this.level = 1; this.lives = 3; this.score = 0; this.parts = [];
    this.pw = 210; this.px = (this.L + this.R) / 2; this.py = 1000;
    this.ending = 0; this.flash = 0;
    this.build(); this.serve();
  }
  build() {
    this.bricks = [];
    const cols = 12, rows = Math.min(4 + this.level, 9), gap = 8, bh = 34;
    const bw = (this.R - this.L - gap * (cols + 1)) / cols;
    const colors = ['#ff5f6d', '#ff9f43', '#feca57', '#1dd1a1', '#48dbfb', '#a29bfe', '#ff6b81', '#c8d6e5', '#ee5253'];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.bricks.push({
          x: this.L + gap + c * (bw + gap), y: this.T + 70 + r * (bh + gap), w: bw, h: bh,
          hp: (r < this.level - 1) ? 2 : 1, color: colors[r % colors.length]
        });
      }
    }
    this.cleanLevel = true;
  }
  serve() {
    this.stuck = true; this.br = 12;
    this.speed = 640 + this.level * 70;
    this.vx = 0; this.vy = 0;
  }
  input(a) {
    if (a === 'x' && this.stuck && !this.ending) {
      this.stuck = false;
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 0.7;
      this.vx = Math.cos(ang) * this.speed; this.vy = Math.sin(ang) * this.speed;
      Sound.blip();
    }
  }
  update(dt) {
    updateParticles(this.parts, dt);
    this.flash = Math.max(0, this.flash - dt);
    if (this.ending > 0) {
      this.ending -= dt;
      if (this.ending <= 0) this.sys.over(this.score);
      return;
    }
    const mv = (this.sys.held('right') ? 1 : 0) - (this.sys.held('left') ? 1 : 0);
    this.px = clamp(this.px + mv * 1300 * dt, this.L + this.pw / 2, this.R - this.pw / 2);
    if (this.stuck) { this.bx = this.px; this.by = this.py - this.br - 12; return; }
    const steps = Math.max(1, Math.ceil(Math.hypot(this.vx, this.vy) * dt / 8));
    for (let s = 0; s < steps; s++) {
      this.stepBall(dt / steps);
      if (this.stuck || this.ending) break;
    }
  }
  stepBall(dt) {
    const r = this.br;
    this.bx += this.vx * dt; this.by += this.vy * dt;
    if (this.bx < this.L + r) { this.bx = this.L + r; this.vx = Math.abs(this.vx); Sound.tick(); }
    if (this.bx > this.R - r) { this.bx = this.R - r; this.vx = -Math.abs(this.vx); Sound.tick(); }
    if (this.by < this.T + r) { this.by = this.T + r; this.vy = Math.abs(this.vy); Sound.tick(); }

    // raket
    const ph = 20, top = this.py - ph / 2;
    if (this.vy > 0 && this.by + r >= top && this.by - r <= top + ph &&
        this.bx >= this.px - this.pw / 2 - r && this.bx <= this.px + this.pw / 2 + r) {
      const rel = clamp((this.bx - this.px) / (this.pw / 2), -1, 1);
      const ang = rel * 1.05;
      const sp = Math.hypot(this.vx, this.vy);
      this.vx = Math.sin(ang) * sp; this.vy = -Math.cos(ang) * sp;
      this.by = top - r;
      Sound.tick();
    }

    // bloklar
    for (const b of this.bricks) {
      if (b.hp <= 0) continue;
      const cx = clamp(this.bx, b.x, b.x + b.w), cy = clamp(this.by, b.y, b.y + b.h);
      const dx = this.bx - cx, dy = this.by - cy;
      if (dx * dx + dy * dy > r * r) continue;
      const ox = Math.min(this.bx + r - b.x, b.x + b.w - (this.bx - r));
      const oy = Math.min(this.by + r - b.y, b.y + b.h - (this.by - r));
      if (ox < oy) this.vx = this.bx < b.x + b.w / 2 ? -Math.abs(this.vx) : Math.abs(this.vx);
      else this.vy = this.by < b.y + b.h / 2 ? -Math.abs(this.vy) : Math.abs(this.vy);
      b.hp--;
      this.score += 10;
      if (b.hp <= 0) burst(this.parts, b.x + b.w / 2, b.y + b.h / 2, b.color, 14, 400);
      Sound.blip();
      this.sys.trophy('first');
      const sp = Math.hypot(this.vx, this.vy), ns = Math.min(sp * 1.008, 1350);
      this.vx *= ns / sp; this.vy *= ns / sp;
      break;
    }

    if (this.bricks.every(b => b.hp <= 0)) {
      this.sys.trophy('clear');
      if (this.cleanLevel) this.sys.trophy('flawless');
      this.level++;
      if (this.level >= 3) this.sys.trophy('level3');
      this.score += 250;
      Sound.levelUp();
      this.flash = 0.6;
      this.build(); this.serve();
      return;
    }
    if (this.by - r > this.B) {
      this.lives--; this.cleanLevel = false;
      Sound.crash();
      if (this.lives <= 0) this.ending = 0.8;
      else this.serve();
    }
  }
  draw(ctx) {
    const bg = ctx.createLinearGradient(0, 0, 0, 1080);
    bg.addColorStop(0, '#1a0633'); bg.addColorStop(1, '#05010d');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, 1920, 1080);
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(this.L, this.T, this.R - this.L, this.B - this.T);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(this.L, this.B); ctx.lineTo(this.L, this.T); ctx.lineTo(this.R, this.T); ctx.lineTo(this.R, this.B); ctx.stroke();

    ctx.save();
    for (const b of this.bricks) {
      if (b.hp <= 0) continue;
      ctx.shadowColor = b.color; ctx.shadowBlur = 14;
      ctx.fillStyle = b.color;
      ctx.globalAlpha = b.hp > 1 ? 1 : 0.85;
      ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 6); ctx.fill();
      if (b.hp > 1) {
        ctx.shadowBlur = 0; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(b.x + 3, b.y + 3, b.w - 6, b.h - 6, 4); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.shadowColor = '#ff9ec7'; ctx.shadowBlur = 24; ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.roundRect(this.px - this.pw / 2, this.py - 10, this.pw, 20, 10); ctx.fill();
    ctx.shadowColor = '#fff';
    ctx.beginPath(); ctx.arc(this.bx, this.by, this.br, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    drawParticles(ctx, this.parts);

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.flash * 0.3})`; ctx.fillRect(0, 0, 1920, 1080);
    }
    hud(ctx, `SEVİYE ${this.level}    CAN ${'●'.repeat(Math.max(0, this.lives))}`, `PUAN ${this.score}    EN İYİ ${Math.max(this.sys.best(), this.score)}`, '#ffd1e6');
    if (this.stuck && !this.ending) {
      ctx.font = '400 32px "Segoe UI", Roboto, Arial, sans-serif';
      ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText('Topu fırlatmak için ✕ (Enter) tuşuna bas', 960, 760);
      ctx.textAlign = 'left';
    }
  }
}

/* ================= ASTEROİD KAÇIŞI ================= */
class AsteroidGame {
  constructor(sys) {
    this.sys = sys;
    this.stars = Array.from({ length: 160 }, () => ({ x: Math.random() * 1920, y: Math.random() * 1080, z: Math.random() * 0.8 + 0.2 }));
    this.reset();
  }
  reset() {
    this.sx = 960; this.sy = 880; this.rocks = []; this.time = 0; this.spawnT = 0.5;
    this.alive = true; this.ending = 0; this.parts = [];
  }
  makeRock() {
    const r = 22 + Math.random() * 55;
    const verts = Array.from({ length: 10 }, (_, i) => ({ a: i / 10 * Math.PI * 2, d: 0.72 + Math.random() * 0.35 }));
    return {
      x: Math.random() * 1920, y: -r - 20, r,
      vx: (Math.random() - 0.5) * 160, vy: 260 + Math.random() * 220 + this.time * 6,
      rot: Math.random() * 6, vr: (Math.random() - 0.5) * 2.5, verts
    };
  }
  update(dt) {
    updateParticles(this.parts, dt);
    const speedK = 1 + this.time / 40;
    for (const s of this.stars) { s.y += s.z * 300 * speedK * dt; if (s.y > 1080) { s.y = 0; s.x = Math.random() * 1920; } }
    if (this.ending > 0) {
      this.ending -= dt;
      for (const r of this.rocks) { r.x += r.vx * dt; r.y += r.vy * dt; r.rot += r.vr * dt; }
      if (this.ending <= 0) this.sys.over(Math.floor(this.time), null, `Süre: ${this.time.toFixed(1)} sn`);
      return;
    }
    this.time += dt;
    const h = this.sys;
    const mx = (h.held('right') ? 1 : 0) - (h.held('left') ? 1 : 0);
    const my = (h.held('down') ? 1 : 0) - (h.held('up') ? 1 : 0);
    this.sx = clamp(this.sx + mx * 950 * dt, 40, 1880);
    this.sy = clamp(this.sy + my * 750 * dt, 160, 1040);
    this.tilt = mx;

    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.rocks.push(this.makeRock());
      this.spawnT = Math.max(0.11, 0.65 - this.time * 0.009);
    }
    for (let i = this.rocks.length - 1; i >= 0; i--) {
      const r = this.rocks[i];
      r.x += r.vx * dt; r.y += r.vy * dt; r.rot += r.vr * dt;
      if (r.y - r.r > 1100) { this.rocks.splice(i, 1); continue; }
      if (Math.hypot(r.x - this.sx, r.y - this.sy) < r.r * 0.82 + 20) {
        this.alive = false; this.ending = 1.1;
        Sound.crash();
        burst(this.parts, this.sx, this.sy, '#ffb347', 50, 700);
        burst(this.parts, this.sx, this.sy, '#ffffff', 20, 400);
        return;
      }
    }
    if (this.time >= 15) h.trophy('t15');
    if (this.time >= 45) h.trophy('t45');
    if (this.time >= 90) h.trophy('t90');
  }
  draw(ctx) {
    const bg = ctx.createLinearGradient(0, 0, 0, 1080);
    bg.addColorStop(0, '#0d0221'); bg.addColorStop(1, '#260b3f');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, 1920, 1080);
    for (const s of this.stars) {
      ctx.fillStyle = `rgba(255,255,255,${s.z})`;
      ctx.fillRect(s.x, s.y, 2 * s.z + 1, 2 * s.z + 1 + s.z * 6);
    }
    ctx.save();
    ctx.lineJoin = 'round';
    for (const r of this.rocks) {
      ctx.shadowColor = '#ff9a3c'; ctx.shadowBlur = 16;
      ctx.strokeStyle = '#ffcf99'; ctx.fillStyle = 'rgba(80,40,30,0.9)'; ctx.lineWidth = 3;
      ctx.beginPath();
      r.verts.forEach((v, i) => {
        const x = r.x + Math.cos(v.a + r.rot) * r.r * v.d, y = r.y + Math.sin(v.a + r.rot) * r.r * v.d;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      });
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    if (this.alive) {
      const { sx, sy } = this;
      const tilt = (this.tilt || 0) * 0.18;
      ctx.translate(sx, sy); ctx.rotate(tilt);
      ctx.shadowColor = '#ffb347'; ctx.shadowBlur = 30;
      ctx.fillStyle = '#ffb347';
      const fl = 20 + Math.random() * 16;
      ctx.beginPath(); ctx.moveTo(-10, 18); ctx.lineTo(0, 18 + fl); ctx.lineTo(10, 18); ctx.fill();
      ctx.shadowColor = '#9fd8ff'; ctx.shadowBlur = 20; ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(22, 22); ctx.lineTo(0, 12); ctx.lineTo(-22, 22); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#4fa3ff';
      ctx.beginPath(); ctx.ellipse(0, -4, 5, 9, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    drawParticles(ctx, this.parts);
    hud(ctx, `SÜRE ${this.time.toFixed(1)} sn`, `EN İYİ ${Math.max(this.sys.best(), Math.floor(this.time))} sn`, '#ffd29a');
  }
}

/* ================= RETRO PONG ================= */
class PongGame {
  constructor(sys) { this.sys = sys; this.reset(); }
  reset() {
    this.py = 540; this.ay = 540; this.ph = 170; this.pw = 24;
    this.ps = 0; this.as = 0; this.ending = 0; this.parts = [];
    this.serve(Math.random() < 0.5 ? -1 : 1);
  }
  serve(dir) {
    this.bx = 960; this.by = 540; this.wait = 0.9;
    const ang = (Math.random() - 0.5) * 0.8;
    this.speed = 680;
    this.vx = Math.cos(ang) * this.speed * dir; this.vy = Math.sin(ang) * this.speed;
  }
  update(dt) {
    updateParticles(this.parts, dt);
    if (this.ending > 0) {
      this.ending -= dt;
      if (this.ending <= 0) {
        const won = this.ps > this.as;
        this.sys.over(this.ps, won ? 'KAZANDIN!' : 'KAYBETTİN', `Skor: ${this.ps} - ${this.as}`);
      }
      return;
    }
    const mv = (this.sys.held('down') ? 1 : 0) - (this.sys.held('up') ? 1 : 0);
    this.py = clamp(this.py + mv * 1000 * dt, 60 + this.ph / 2, 1020 - this.ph / 2);

    // yapay zekâ
    const target = this.vx > 0 ? this.by + Math.sin(this.bx / 140) * 40 : 540;
    const d = target - this.ay;
    this.ay = clamp(this.ay + clamp(d, -560 * dt, 560 * dt), 60 + this.ph / 2, 1020 - this.ph / 2);

    if (this.wait > 0) { this.wait -= dt; return; }
    const steps = Math.max(1, Math.ceil(Math.hypot(this.vx, this.vy) * dt / 10));
    for (let i = 0; i < steps; i++) if (this.stepBall(dt / steps)) break;
  }
  stepBall(dt) {
    const r = 13;
    this.bx += this.vx * dt; this.by += this.vy * dt;
    if (this.by < 60 + r) { this.by = 60 + r; this.vy = Math.abs(this.vy); Sound.tick(); }
    if (this.by > 1020 - r) { this.by = 1020 - r; this.vy = -Math.abs(this.vy); Sound.tick(); }
    const hit = (padX, padY, dir) => {
      if (Math.abs(this.bx - padX) < this.pw / 2 + r && Math.abs(this.by - padY) < this.ph / 2 + r) {
        const rel = clamp((this.by - padY) / (this.ph / 2), -1, 1);
        this.speed = Math.min(this.speed * 1.06, 1700);
        const ang = rel * 0.9;
        this.vx = Math.cos(ang) * this.speed * dir; this.vy = Math.sin(ang) * this.speed;
        this.bx = padX + dir * (this.pw / 2 + r + 1);
        Sound.blip();
        burst(this.parts, this.bx, this.by, '#d8b4fe', 8, 300);
      }
    };
    if (this.vx < 0) hit(120, this.py, 1); else hit(1800, this.ay, -1);
    if (this.bx < -30) { this.as++; Sound.crash(); return this.scored(1); }
    if (this.bx > 1950) {
      this.ps++; Sound.levelUp(); this.sys.trophy('point');
      return this.scored(-1);
    }
    return false;
  }
  scored(dir) {
    if (this.ps >= 7 || this.as >= 7) {
      if (this.ps >= 7) { this.sys.trophy('win'); if (this.as <= 2) this.sys.trophy('wall'); }
      this.ending = 1;
    } else this.serve(dir);
    return true;
  }
  draw(ctx) {
    ctx.fillStyle = '#0b0b1e'; ctx.fillRect(0, 0, 1920, 1080);
    ctx.strokeStyle = 'rgba(216,180,254,0.35)'; ctx.lineWidth = 6; ctx.setLineDash([24, 24]);
    ctx.beginPath(); ctx.moveTo(960, 60); ctx.lineTo(960, 1020); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(216,180,254,0.5)'; ctx.lineWidth = 4;
    ctx.strokeRect(20, 60, 1880, 960);
    ctx.font = '700 150px "Segoe UI", Roboto, Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(216,180,254,0.25)';
    ctx.fillText(this.ps, 760, 220); ctx.fillText(this.as, 1160, 220);
    ctx.save();
    ctx.shadowColor = '#c084fc'; ctx.shadowBlur = 26; ctx.fillStyle = '#fff';
    ctx.fillRect(120 - this.pw / 2, this.py - this.ph / 2, this.pw, this.ph);
    ctx.fillRect(1800 - this.pw / 2, this.ay - this.ph / 2, this.pw, this.ph);
    ctx.fillRect(this.bx - 13, this.by - 13, 26, 26);
    ctx.restore();
    drawParticles(ctx, this.parts);
    ctx.textAlign = 'left';
    ctx.font = '600 30px "Segoe UI", Roboto, Arial, sans-serif'; ctx.fillStyle = '#e9d5ff';
    ctx.fillText('SEN', 60, 30);
    ctx.textAlign = 'right'; ctx.fillText('YAPAY ZEKÂ', 1860, 30); ctx.textAlign = 'left';
  }
}

const GAME_CLASSES = { snake: SnakeGame, breakout: BreakoutGame, asteroids: AsteroidGame, pong: PongGame };

/* ================= OYUN ÇALIŞTIRICI ================= */
const Games = {
  current: null, visible: false, state: 'none', menuSel: 0,

  init() {
    this.layer = $('#game-layer');
    this.canvas = $('#game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.ov = $('#game-overlay');
    let last = performance.now();
    const loop = t => {
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      this.frame(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  },
  isRunning(id) { return !!(this.current && this.current.id === id); },

  launch(id) {
    if (this.isRunning(id)) { this.show(); Sound.select(); return; }
    if (this.current) {
      const name = APPS[this.current.id].name;
      UI.dialog({
        title: 'Uygulamayı Kapat',
        text: `${name} kapatılacak. Kaydedilmemiş ilerleme kaybolacak.`,
        options: [
          { label: 'Tamam', action: () => { this.close(); this.launch(id); } },
          { label: 'İptal' }
        ]
      });
      return;
    }
    const sys = {
      trophy: t => Sys.trophy(id, t),
      over: (score, title, line) => this.gameOver(score, title, line),
      held: a => Input.held(a),
      best: () => Save.data.highscores[id] || 0
    };
    this.current = { id, game: new GAME_CLASSES[id](sys) };
    Save.data.lastPlayed[id] = Date.now();
    Save.save();
    this.state = 'splash'; this.splashT = 2.2;
    this.renderOverlay();
    this.show();
    Sound.launch();
    if (window.Home) Home.refresh();
  },
  show() {
    this.visible = true;
    this.layer.classList.remove('hidden');
    requestAnimationFrame(() => requestAnimationFrame(() => this.layer.classList.add('in')));
    Sys.musicUpdate();
  },
  hide() {
    this.visible = false;
    this.layer.classList.remove('in');
    setTimeout(() => { if (!this.visible) this.layer.classList.add('hidden'); }, 320);
    Sys.musicUpdate();
  },
  suspend(silent) {
    if (!this.current) return;
    if (this.state === 'playing') { this.state = 'paused'; this.menuSel = 0; this.renderOverlay(); }
    this.hide();
    if (!silent) Sound.back();
    if (window.Home) Home.refresh();
  },
  close() {
    if (!this.current) return;
    this.current = null;
    this.state = 'none';
    this.ov.innerHTML = '';
    this.hide();
    if (window.Home) Home.refresh();
  },
  gameOver(score, title, line) {
    if (this.state !== 'playing' || !this.current) return;
    const id = this.current.id;
    const best = Save.data.highscores[id] || 0;
    this.newBest = score > best;
    if (this.newBest) { Save.data.highscores[id] = score; Save.save(); }
    this.state = 'over';
    this.over = { score, title: title || 'OYUN BİTTİ', line: line || `Puan: ${score}` };
    this.menuSel = 0;
    this.renderOverlay();
  },
  menuOptions() {
    if (this.state === 'paused') return [['Devam Et', 'resume'], ['Yeniden Başlat', 'restart'], ['Ana Ekrana Dön', 'home'], ['Uygulamayı Kapat', 'quit']];
    if (this.state === 'over') return [['Tekrar Oyna', 'restart'], ['Ana Ekrana Dön', 'home'], ['Uygulamayı Kapat', 'quit']];
    return [];
  },
  renderOverlay() {
    if (!this.current) { this.ov.innerHTML = ''; return; }
    const app = APPS[this.current.id];
    if (this.state === 'splash') {
      this.ov.innerHTML =
        `<div class="g-splash"><div class="g-splash-art">${coverSVG(app)}</div>` +
        `<div class="g-splash-name">${esc(app.name)}</div><div class="g-splash-ctrl">${esc(app.controls)}</div>` +
        `<div class="spinner"></div></div>`;
    } else if (this.state === 'playing') {
      this.ov.innerHTML = `<div class="g-hint">${glyph('options')} Duraklat &nbsp;&nbsp; ${glyph('ps')} (H) Ana Ekran</div>`;
    } else {
      const opts = this.menuOptions();
      const head = this.state === 'paused'
        ? `<h2>DURAKLATILDI</h2><p>${esc(app.name)}</p>`
        : `<h2>${esc(this.over.title)}</h2><p>${esc(this.over.line)}${this.newBest ? ' — <b class="nb">Yeni rekor!</b>' : ''}</p>`;
      this.ov.innerHTML = `<div class="g-menu">${head}<div class="g-opts">${opts.map((o, i) =>
        `<div class="opt ${i === this.menuSel ? 'sel' : ''}">${esc(o[0])}</div>`).join('')}</div>` +
        `<div class="hints">${hintsHTML([['x', 'Seç'], ['o', this.state === 'paused' ? 'Devam' : 'Geri']])}</div></div>`;
    }
  },
  input(a) {
    if (!this.current) return;
    if (a === 'ps') { this.suspend(); return; }
    if (a === 'quick') { Sys.quickMenu(); return; }
    if (this.state === 'splash') return;
    if (this.state === 'playing') {
      if (a === 'options') { this.state = 'paused'; this.menuSel = 0; this.renderOverlay(); Sound.select(); return; }
      if (this.current.game.input) this.current.game.input(a);
      return;
    }
    const opts = this.menuOptions();
    if (a === 'up' && this.menuSel > 0) { this.menuSel--; Sound.nav(); this.renderOverlay(); }
    else if (a === 'down' && this.menuSel < opts.length - 1) { this.menuSel++; Sound.nav(); this.renderOverlay(); }
    else if (a === 'x') { Sound.select(); this.doAction(opts[this.menuSel][1]); }
    else if ((a === 'o' || a === 'options') && this.state === 'paused') { Sound.back(); this.doAction('resume'); }
  },
  doAction(act) {
    if (act === 'resume') { this.state = 'playing'; this.renderOverlay(); }
    else if (act === 'restart') { this.current.game.reset(); this.state = 'playing'; this.renderOverlay(); }
    else if (act === 'home') { this.suspend(true); }
    else if (act === 'quit') { this.close(); }
  },
  frame(dt) {
    if (!this.current || !this.visible) return;
    const g = this.current.game;
    if (this.state === 'splash') {
      this.splashT -= dt;
      if (this.splashT <= 0) { this.state = 'playing'; this.renderOverlay(); }
    } else if (this.state === 'playing' && UI.dialogs.length === 0) {
      g.update(dt);
    }
    g.draw(this.ctx);
  }
};
