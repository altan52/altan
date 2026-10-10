'use strict';

/* ---------- Diyaloglar ve bildirim baloncukları ---------- */
class Dialog {
  constructor(o) {
    this.o = o;
    this.sel = 0;
    this.options = o.options && o.options.length ? o.options : [{ label: 'Tamam' }];
    this.el = el('div', 'dialog-backdrop ' + (o.cls || ''));
    this.el.innerHTML =
      `<div class="dialog">` +
      (o.title ? `<h2>${esc(o.title)}</h2>` : '') +
      (o.text ? `<p>${esc(o.text)}</p>` : '') +
      (o.html || '') +
      `<div class="opts">${this.options.map(op =>
        `<div class="opt">${op.icon ? icon(op.icon) : ''}<span>${esc(op.label)}</span></div>`).join('')}</div>` +
      `</div>`;
    $('#overlays').appendChild(this.el);
    requestAnimationFrame(() => this.el.classList.add('show'));
    UI.dialogs.push(this);
    this.update();
  }
  update() {
    this.el.querySelectorAll('.opt').forEach((e, i) => e.classList.toggle('sel', i === this.sel));
  }
  input(a) {
    if (a === 'up' && this.sel > 0) { this.sel--; Sound.nav(); this.update(); }
    else if (a === 'down' && this.sel < this.options.length - 1) { this.sel++; Sound.nav(); this.update(); }
    else if (a === 'x') this.choose(this.sel);
    else if (a === 'o' || (a === 'quick' && this.o.cls === 'quick')) this.cancel();
  }
  choose(i) {
    Sound.select();
    const op = this.options[i];
    this.close();
    if (op && op.action) op.action();
  }
  cancel() {
    Sound.back();
    this.close();
    if (this.o.onCancel) this.o.onCancel();
  }
  close() {
    const i = UI.dialogs.indexOf(this);
    if (i < 0) return;
    UI.dialogs.splice(i, 1);
    this.el.classList.remove('show');
    setTimeout(() => this.el.remove(), 220);
    if (this.onClose) this.onClose();
  }
}

const UI = {
  dialogs: [],
  dialog(o) { return new Dialog(o); },
  topDialog() { return this.dialogs[this.dialogs.length - 1]; },
  closeAll() { while (this.dialogs.length) this.dialogs[this.dialogs.length - 1].close(); },

  prompt({ title, value, max, onDone }) {
    const d = new Dialog({
      title,
      html: `<input class="txt" type="text" maxlength="${max || 16}" value="${esc(value || '')}" spellcheck="false">`,
      options: [
        { label: 'Tamam', action: () => onDone(inp.value.trim()) },
        { label: 'İptal' }
      ]
    });
    const inp = d.el.querySelector('input');
    Input.textMode = true;
    setTimeout(() => { inp.focus(); inp.select(); }, 60);
    inp.addEventListener('keydown', e => {
      e.stopPropagation();
      if (e.key === 'Enter') { e.preventDefault(); d.choose(0); }
      else if (e.key === 'Escape') { e.preventDefault(); d.cancel(); }
    });
    d.onClose = () => { Input.textMode = false; inp.blur(); };
    return d;
  },

  toast({ iconHTML, title, text, cls }) {
    const t = el('div', 'toast ' + (cls || ''),
      `<div class="ti">${iconHTML || icon('bell')}</div><div class="tt"><b>${esc(title)}</b>${text ? `<span>${esc(text)}</span>` : ''}</div>`);
    const box = $('#toasts');
    box.appendChild(t);
    while (box.children.length > 3) box.firstChild.remove();
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 500); }, 4500);
  }
};

/* ---------- Ekran yöneticisi ---------- */
class Screen {
  constructor(cls) { this.el = el('div', 'screen ' + cls); }
  mount() {
    $('#screens').appendChild(this.el);
    requestAnimationFrame(() => requestAnimationFrame(() => this.el.classList.add('in')));
    if (this.onShow) this.onShow();
  }
  unmount() {
    this.el.classList.remove('in');
    this.el.classList.add('out');
    setTimeout(() => this.el.remove(), 350);
  }
  input() {}
}

const Nav = {
  stack: [],
  top() { return this.stack[this.stack.length - 1]; },
  push(s) {
    const top = this.top();
    if (top) { top.el.classList.add('covered'); if (top.onHide) top.onHide(); }
    this.stack.push(s);
    s.mount();
  },
  pop() {
    if (this.stack.length <= 1) return;
    const s = this.stack.pop();
    s.unmount();
    if (s.onClose) s.onClose();
    const top = this.top();
    top.el.classList.remove('covered');
    if (top.onShow) top.onShow();
  },
  toRoot() { while (this.stack.length > 1) this.pop(); },
  replaceAll(s) {
    for (const x of this.stack) { x.unmount(); if (x.onClose) x.onClose(); }
    this.stack = [];
    this.push(s);
  }
};

/* ---------- Liste ekranı (ayarlar, bildirimler, arkadaşlar...) ---------- */
class ListScreen extends Screen {
  constructor(o) {
    super('sub list-screen ' + (o.cls || ''));
    this.o = o;
    this.sel = 0;
    this.el.innerHTML =
      `<div class="sub-header">${icon(o.icon)}<span>${esc(o.title)}</span></div>` +
      `<div class="list"><div class="list-inner"></div></div><div class="side"></div><div class="hints"></div>`;
    this.inner = this.el.querySelector('.list-inner');
    this.sideEl = this.el.querySelector('.side');
    this.refresh();
  }
  refresh() {
    this.items = this.o.build();
    if (this.sel >= this.items.length) this.sel = Math.max(0, this.items.length - 1);
    this.inner.innerHTML = this.items.length ? this.items.map(it =>
      `<div class="row ${it.cls || ''}">` +
      (it.icon ? `<div class="ri">${it.icon}</div>` : '') +
      `<div class="rt"><b>${esc(it.title)}</b>${it.sub ? `<span>${esc(it.sub)}</span>` : ''}</div>` +
      (it.right != null ? `<div class="rr">${it.lr ? '<i>‹</i>' : ''}<em>${esc(it.right)}</em>${it.lr ? '<i>›</i>' : ''}</div>` : '') +
      `</div>`).join('') :
      `<div class="empty">${esc(this.o.empty || 'Burada gösterilecek bir şey yok.')}</div>`;
    this.update();
  }
  update() {
    const rows = this.inner.querySelectorAll('.row');
    rows.forEach((r, i) => r.classList.toggle('sel', i === this.sel));
    const RH = 112, VIS = 7;
    const off = Math.max(0, Math.min(this.sel - 3, this.items.length - VIS));
    this.inner.style.transform = `translateY(${-off * RH}px)`;
    const it = this.items[this.sel];
    this.sideEl.innerHTML = this.o.side ? this.o.side(it) : (it && it.detail ? `<p>${esc(it.detail)}</p>` : '');
    const hints = (it && it.hints) || this.o.hints || [['x', 'Seç'], ['o', 'Geri']];
    this.el.querySelector('.hints').innerHTML = hintsHTML(hints);
  }
  input(a) {
    const n = this.items.length;
    const it = this.items[this.sel];
    if (a === 'up' && this.sel > 0) { this.sel--; Sound.nav(); this.update(); }
    else if (a === 'down' && this.sel < n - 1) { this.sel++; Sound.nav(); this.update(); }
    else if ((a === 'left' || a === 'right') && it && it.lr) { it.lr(a === 'left' ? -1 : 1); Sound.nav(); this.refresh(); }
    else if (a === 'x' && it && it.onX) { Sound.select(); it.onX(this); }
    else if (a === 'options' && it && it.onOptions) { Sound.select(); it.onOptions(this); }
    else if (a === 'o') { Sound.back(); Nav.pop(); }
  }
}

/* ---------- Izgara ekranı (mağaza, kütüphane) ---------- */
class GridScreen extends Screen {
  constructor(o) {
    super('sub grid-screen');
    this.o = o;
    this.sel = 0;
    this.cols = o.cols || 5;
    this.el.innerHTML =
      `<div class="sub-header">${icon(o.icon)}<span>${esc(o.title)}</span></div>` +
      `<div class="grid"><div class="grid-inner"></div></div><div class="grid-detail"></div><div class="hints"></div>`;
    this.inner = this.el.querySelector('.grid-inner');
    this.detailEl = this.el.querySelector('.grid-detail');
    this.refresh();
  }
  refresh() {
    this.items = this.o.build();
    if (this.sel >= this.items.length) this.sel = Math.max(0, this.items.length - 1);
    this.inner.innerHTML = this.items.length
      ? this.items.map(it => `<div class="card">${this.o.card(it)}</div>`).join('')
      : `<div class="empty">${esc(this.o.empty || 'Burada gösterilecek bir şey yok.')}</div>`;
    this.update();
  }
  updateCard(i) {
    const c = this.inner.querySelectorAll('.card')[i];
    if (c) c.innerHTML = this.o.card(this.items[i]);
    if (i === this.sel) this.update();
  }
  update() {
    this.inner.querySelectorAll('.card').forEach((c, i) => c.classList.toggle('sel', i === this.sel));
    const row = Math.floor(this.sel / this.cols);
    this.inner.style.transform = `translateY(${-row * 420}px)`;
    const it = this.items[this.sel];
    this.detailEl.innerHTML = it && this.o.detail ? this.o.detail(it) : '';
    this.el.querySelector('.hints').innerHTML = hintsHTML((it && this.o.hints ? this.o.hints(it) : null) || [['x', 'Seç'], ['o', 'Geri']]);
  }
  input(a) {
    const n = this.items.length, c = this.cols;
    const prev = this.sel;
    if (a === 'left' && this.sel % c > 0) this.sel--;
    else if (a === 'right' && this.sel % c < c - 1 && this.sel < n - 1) this.sel++;
    else if (a === 'up' && this.sel - c >= 0) this.sel -= c;
    else if (a === 'down' && this.sel + c < n) this.sel += c;
    else if (a === 'down' && Math.floor(this.sel / c) < Math.floor((n - 1) / c)) this.sel = n - 1;
    else if (a === 'x' && n) { Sound.select(); this.o.onX(this.items[this.sel], this, this.sel); return; }
    else if (a === 'options' && n && this.o.onOptions) { Sound.select(); this.o.onOptions(this.items[this.sel], this, this.sel); return; }
    else if (a === 'o') { Sound.back(); Nav.pop(); return; }
    if (prev !== this.sel) { Sound.nav(); this.update(); }
  }
}
