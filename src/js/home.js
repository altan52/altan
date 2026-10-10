'use strict';

/* ================= AÇILIŞ EKRANLARI ================= */
class BootScreen extends Screen {
  constructor() {
    super('boot');
    this.el.innerHTML = `<div class="logo-wrap"><div class="logo">PS4</div><div class="logo-sub">ARAYÜZ EMÜLATÖRÜ</div></div>`;
  }
  onShow() {
    Sys.locked = true;
    setTimeout(() => Sound.boot(), 300);
    setTimeout(() => { Sys.locked = false; Nav.replaceAll(new PressStartScreen()); }, 3800);
  }
}

class PressStartScreen extends Screen {
  constructor() {
    super('press-start');
    this.el.innerHTML =
      `<div class="ps-msg"><div class="ps-btn">PS</div>` +
      `<p>Kumandanızı kullanmak için PS tuşuna basın.</p>` +
      `<small>Klavye: Enter veya H</small></div>`;
  }
  input(a) {
    if (a === 'x' || a === 'ps') { Sound.select(); Nav.replaceAll(new UserSelectScreen()); }
  }
}

class UserSelectScreen extends Screen {
  constructor() {
    super('user-select');
    const u = Save.data.user;
    this.el.innerHTML =
      `<h1>Bu PS4'ü kim kullanıyor?</h1>` +
      `<div class="users"><div class="user sel"><div class="ua">${avatarSVG(u.avatar)}</div><b>${esc(u.name)}</b></div></div>` +
      `<div class="hints">${hintsHTML([['x', 'Oturum Aç']])}</div>`;
  }
  input(a) {
    if (a === 'x') Sys.login();
  }
}

/* ================= ANA EKRAN ================= */
const FUNCS = [
  ['store', 'Mağaza', () => Nav.push(storeScreen())],
  ['bell', 'Bildirimler', () => Nav.push(notificationsScreen())],
  ['friends', 'Arkadaşlar', () => Nav.push(friendsScreen())],
  ['messages', 'Mesajlar', () => Nav.push(messagesScreen())],
  ['party', 'Parti', () => Nav.push(partyScreen())],
  ['profile', 'Profil', () => Nav.push(profileScreen())],
  ['trophy', 'Kupalar', () => Nav.push(trophiesScreen())],
  ['settings', 'Ayarlar', () => Nav.push(settingsScreen())],
  ['power', 'Güç', () => Sys.powerMenu()]
];

const TILE = { BASE: 180, BIG: 340, SMALL: 200, GAP: 22, TOP: 300 };

class HomeScreen extends Screen {
  constructor() {
    super('home zone-content');
    this.zone = 'content';
    this.sel = 0; this.funcSel = 0; this.actSel = 0;
    this.keys = '';
    this.el.innerHTML =
      `<div class="func-row">${FUNCS.map(f => `<div class="func-item">${icon(f[0])}<div class="badge hidden"></div></div>`).join('')}</div>` +
      `<div class="func-label"></div>` +
      `<div class="status"><div class="pad-ind hidden">${icon('gamepad')}</div><div class="avatar"></div><div class="uname"></div><div class="clock"></div></div>` +
      `<div class="content-row"></div>` +
      `<div class="tile-title"><b></b><span></span></div>` +
      `<div class="tile-actions"></div>` +
      `<div class="tile-desc"></div>` +
      `<div class="hints"></div>`;
    this.q = s => this.el.querySelector(s);
    window.Home = this;
    this.refresh();
  }
  onShow() { this.refresh(); }
  onClose() { if (window.Home === this) window.Home = null; }

  items() {
    const games = Save.data.installed.filter(id => APPS[id])
      .sort((a, b) => (Save.data.lastPlayed[b] || 0) - (Save.data.lastPlayed[a] || 0));
    // çalışan oyun her zaman en başta
    if (Games.current) {
      const i = games.indexOf(Games.current.id);
      if (i > 0) { games.splice(i, 1); games.unshift(Games.current.id); }
    }
    return [
      { kind: 'whatsnew', key: 'whatsnew', name: 'Neler Yeni', sub: 'Arkadaşlarının son etkinlikleri', colors: ['#2e7cf6', '#0b2e6b'], icon: 'whatsnew',
        desc: 'Arkadaşlarının ne oynadığını, kazandıkları kupaları ve mağazadaki yenilikleri gör.' },
      ...games.map(id => ({ kind: 'game', key: id, id, name: APPS[id].name, app: APPS[id], colors: APPS[id].colors, desc: APPS[id].desc })),
      { kind: 'store', key: 'store', name: 'Mağaza', sub: 'Yeni oyunlar ve temalar', colors: ['#1a6fd6', '#04245c'], icon: 'store',
        desc: 'Ücretsiz oyunları ve temaları indir.' },
      { kind: 'library', key: 'library', name: 'Kütüphane', sub: 'Tüm uygulamalar', colors: ['#5c6470', '#23272e'], icon: 'library',
        desc: 'Sistemde yüklü tüm oyun ve uygulamalar.' }
    ];
  }

  refresh() {
    const cur = this.list && this.list[this.sel] ? this.list[this.sel].key : null;
    this.list = this.items();
    const keys = this.list.map(i => i.key).join('|');
    if (cur) {
      const i = this.list.findIndex(x => x.key === cur);
      this.sel = i >= 0 ? i : Math.min(this.sel, this.list.length - 1);
    }
    if (keys !== this.keys) {
      this.keys = keys;
      const row = this.q('.content-row');
      row.innerHTML = this.list.map(it =>
        `<div class="tile">${it.kind === 'game' ? coverSVG(it.app) : sysTileSVG(it.icon, it.colors, it.name)}<div class="run-badge">${icon('play')}</div></div>`
      ).join('');
      this.tiles = [...row.children];
    }
    this.tiles.forEach((t, i) => t.classList.toggle('running', this.list[i].kind === 'game' && Games.isRunning(this.list[i].id)));
    const u = Save.data.user;
    this.q('.avatar').innerHTML = avatarSVG(u.avatar);
    this.q('.uname').textContent = u.name;
    this.q('.pad-ind').classList.toggle('hidden', !Input.padConnected());
    this.refreshBadges();
    updateClocks();
    this.layout();
  }

  select(key) {
    const i = this.list.findIndex(x => x.key === key);
    if (i < 0) return;
    this.sel = i; this.zone = 'content';
    this.layout();
  }

  refreshBadges() {
    const unreadN = Save.data.notifications.filter(n => !n.read).length;
    const unreadM = MESSAGES.filter(m => !Save.data.msgRead.includes(m.id)).length;
    const badges = this.el.querySelectorAll('.func-item .badge');
    const set = (i, n) => { badges[i].textContent = n; badges[i].classList.toggle('hidden', !n); };
    set(1, unreadN);
    set(3, unreadM);
  }

  actions(it) {
    switch (it.kind) {
      case 'game': {
        const run = Games.isRunning(it.id);
        const arr = [{ label: run ? 'Devam Et' : 'Başlat', fn: () => Games.launch(it.id) }];
        if (it.app.trophies.length) arr.push({ label: 'Kupalar', fn: () => Nav.push(gameTrophiesScreen(it.id)) });
        arr.push({ label: 'Bilgi', fn: () => showGameInfo(it.id) });
        if (run) arr.push({ label: 'Uygulamayı Kapat', fn: () => Games.close() });
        return arr;
      }
      case 'whatsnew': return [{ label: 'Aç', fn: () => Nav.push(whatsNewScreen()) }];
      case 'store': return [{ label: 'Mağazayı Aç', fn: () => Nav.push(storeScreen()) }];
      case 'library': return [{ label: 'Aç', fn: () => Nav.push(libraryScreen()) }];
    }
    return [];
  }

  layout() {
    const { BASE, BIG, SMALL, GAP } = TILE;
    const sel = this.sel;
    this.tiles.forEach((t, i) => {
      let x, size;
      if (i === sel) { x = BASE; size = BIG; }
      else if (i > sel) { x = BASE + BIG + GAP + (i - sel - 1) * (SMALL + GAP); size = SMALL; }
      else { x = BASE - (sel - i) * (SMALL + GAP); size = SMALL; }
      t.style.width = size + 'px';
      t.style.height = size + 'px';
      t.style.transform = `translate(${x}px, ${BIG - size}px)`;
      t.style.opacity = i < sel ? 0 : 1;
      t.classList.toggle('sel', i === sel);
    });

    const it = this.list[sel];
    const running = it.kind === 'game' && Games.isRunning(it.id);
    this.q('.tile-title b').textContent = it.name;
    this.q('.tile-title span').textContent = running ? 'Çalışıyor' : (it.kind === 'game' ? it.app.publisher : it.sub);
    this.q('.tile-title').classList.toggle('running', running);

    const acts = this.actions(it);
    if (this.actSel >= acts.length) this.actSel = 0;
    this.q('.tile-actions').innerHTML = acts.map((a, i) =>
      `<div class="act ${this.zone === 'actions' && i === this.actSel ? 'sel' : ''} ${i === 0 ? 'primary' : ''}">${esc(a.label)}</div>`).join('');
    this.q('.tile-desc').textContent = it.desc || '';

    this.el.classList.remove('zone-content', 'zone-func', 'zone-actions');
    this.el.classList.add('zone-' + this.zone);

    this.el.querySelectorAll('.func-item').forEach((f, i) => f.classList.toggle('sel', this.zone === 'func' && i === this.funcSel));
    const lbl = this.q('.func-label');
    lbl.textContent = FUNCS[this.funcSel][1];
    lbl.style.left = (TILE.BASE + this.funcSel * 108 + 32) + 'px';

    let hints;
    if (this.zone === 'func') hints = [['x', 'Seç'], ['o', 'Geri']];
    else if (this.zone === 'actions') hints = [['x', 'Seç'], ['o', 'Geri']];
    else hints = it.kind === 'game' ? [['x', running ? 'Devam Et' : 'Başlat'], ['options', 'Seçenekler']] : [['x', 'Aç']];
    this.q('.hints').innerHTML = hintsHTML(hints);

    BG.setTint(this.zone === 'func' ? null : it.colors[0]);
  }

  input(a) {
    const n = this.list.length;
    const it = this.list[this.sel];
    if (this.zone === 'content') {
      if (a === 'left' && this.sel > 0) { this.sel--; Sound.nav(); }
      else if (a === 'right' && this.sel < n - 1) { this.sel++; Sound.nav(); }
      else if (a === 'up') { this.zone = 'func'; Sound.nav(); }
      else if (a === 'down') { this.zone = 'actions'; this.actSel = 0; Sound.nav(); }
      else if (a === 'x') { Sound.select(); this.actions(it)[0].fn(); }
      else if (a === 'options' && it.kind === 'game') { Sound.select(); gameOptions(it.id); }
      else return;
    } else if (this.zone === 'func') {
      if (a === 'left' && this.funcSel > 0) { this.funcSel--; Sound.nav(); }
      else if (a === 'right' && this.funcSel < FUNCS.length - 1) { this.funcSel++; Sound.nav(); }
      else if (a === 'down' || a === 'o') { this.zone = 'content'; a === 'o' ? Sound.back() : Sound.nav(); }
      else if (a === 'x') { Sound.select(); FUNCS[this.funcSel][2](); }
      else return;
    } else {
      const acts = this.actions(it);
      if (a === 'left' && this.actSel > 0) { this.actSel--; Sound.nav(); }
      else if (a === 'right' && this.actSel < acts.length - 1) { this.actSel++; Sound.nav(); }
      else if (a === 'up' || a === 'o') { this.zone = 'content'; a === 'o' ? Sound.back() : Sound.nav(); }
      else if (a === 'x') { Sound.select(); acts[this.actSel].fn(); }
      else return;
    }
    this.layout();
  }
}

/* ================= YARDIMCI DİYALOGLAR ================= */
function showGameInfo(id) {
  const app = APPS[id];
  const p = Trophies.progress(id);
  UI.dialog({
    title: app.name,
    text: `${app.desc}\n\nYayıncı: ${app.publisher}\nTür: ${app.genre}\nBoyut: ${app.size}\nKontroller: ${app.controls}\n` +
      `En yüksek skor: ${Save.data.highscores[id] || 0}\nKupalar: ${p.got}/${p.total} (%${p.pct})`,
    options: [{ label: 'Kapat' }]
  });
}

function gameOptions(id) {
  const app = APPS[id];
  const opts = [];
  if (Games.isRunning(id)) opts.push({ label: 'Uygulamayı Kapat', icon: 'close', action: () => Games.close() });
  opts.push({ label: 'Bilgi', icon: 'info', action: () => showGameInfo(id) });
  if (app.trophies.length) opts.push({ label: 'Kupalar', icon: 'trophy', action: () => Nav.push(gameTrophiesScreen(id)) });
  if (app.store) {
    opts.push({
      label: 'Sil', icon: 'trash', action: () => UI.dialog({
        title: 'Sil', text: `${app.name} silinsin mi? Kupaların ve rekorların korunur.`,
        options: [
          { label: 'Sil', action: () => {
            if (Games.isRunning(id)) Games.close();
            Save.data.installed = Save.data.installed.filter(x => x !== id);
            Save.save();
            if (window.Home) Home.refresh();
            const top = Nav.top();
            if (top !== window.Home && top.refresh) top.refresh();
            UI.toast({ iconHTML: icon('trash'), title: 'Silindi', text: app.name });
          } },
          { label: 'İptal' }
        ]
      })
    });
  }
  UI.dialog({ title: app.name, options: opts });
}

/* ================= ALT EKRANLAR ================= */
function whatsNewScreen() {
  return new ListScreen({
    title: 'Neler Yeni', icon: 'whatsnew',
    build: () => {
      const mine = [];
      for (const app of Object.keys(Save.data.trophies)) {
        for (const [tid, ts] of Object.entries(Save.data.trophies[app])) {
          const t = APPS[app] && APPS[app].trophies.find(x => x.id === tid);
          if (t) mine.push({ ts, icon: trophySVG(t.grade), title: `${Save.data.user.name} bir kupa kazandı: ${t.name}`, sub: `${APPS[app].name} · ${timeAgo(ts)}` });
        }
      }
      mine.sort((a, b) => b.ts - a.ts);
      const friends = [
        { icon: avatarSVG(1), title: 'KaraKartal_34 "Neon Avcısı" kupasını kazandı', sub: 'Neon Yılan · 25 dk önce' },
        { icon: avatarSVG(4), title: 'Elif_77 Blok Kırıcı oynamaya başladı', sub: '1 sa önce' },
        { icon: sysTileSVG('store', ['#1a6fd6', '#04245c']), title: 'Mağazada yeni: Asteroid Kaçışı', sub: 'Ücretsiz indir', onX: () => Nav.push(storeScreen()) },
        { icon: avatarSVG(3), title: 'Ayse_Gamer ile MehmetPro artık arkadaş', sub: '3 sa önce' },
        { icon: sysTileSVG('palette', ['#c24d2c', '#2b0b3a']), title: 'Yeni tema: Gün Batımı', sub: 'Mağazada ücretsiz', onX: () => Nav.push(storeScreen()) }
      ];
      return [...mine.slice(0, 5), ...friends];
    }
  });
}

function notificationsScreen() {
  const s = new ListScreen({
    title: 'Bildirimler', icon: 'bell', empty: 'Yeni bildirim yok.',
    build: () => Save.data.notifications.map(n => ({
      icon: icon(n.type === 'trophy' ? 'trophy' : n.type === 'download' ? 'download' : 'bell'),
      title: n.title, sub: n.text, right: timeAgo(n.time), cls: n.read ? '' : 'unread'
    }))
  });
  Save.data.notifications.forEach(n => { n.read = true; });
  Save.save();
  if (window.Home) Home.refreshBadges();
  return s;
}

function friendsScreen() {
  const ST = { online: 'Çevrimiçi', away: 'Uzakta', offline: 'Çevrimdışı' };
  return new ListScreen({
    title: 'Arkadaşlar', icon: 'friends',
    build: () => FRIENDS.map(f => ({
      icon: `<div class="fav">${avatarSVG(f.avatar)}<i class="dot ${f.status}"></i></div>`,
      title: f.name, sub: f.activity, right: ST[f.status],
      onX: () => UI.dialog({
        title: f.name, text: `${ST[f.status]} · ${f.activity}`,
        options: [
          { label: 'Mesaj Gönder', icon: 'send', action: () => UI.prompt({ title: `${f.name} kullanıcısına mesaj`, max: 60, onDone: v => { if (v) UI.toast({ iconHTML: icon('send'), title: 'Mesaj gönderildi', text: f.name }); } }) },
          { label: 'Partiye Davet Et', icon: 'party', action: () => inviteToParty(f) },
          { label: 'Kapat' }
        ]
      })
    })),
    side: f => f ? `<div class="side-card"><div class="side-av">${avatarSVG(FRIENDS.find(x => x.name === f.title).avatar)}</div><h3>${esc(f.title)}</h3><p>${esc(f.sub)}</p></div>` : ''
  });
}

function messagesScreen() {
  return new ListScreen({
    title: 'Mesajlar', icon: 'messages',
    build: () => MESSAGES.map(m => ({
      icon: avatarSVG(m.avatar), title: m.from, sub: m.text, right: m.ago,
      cls: Save.data.msgRead.includes(m.id) ? '' : 'unread',
      onX: (scr) => {
        if (!Save.data.msgRead.includes(m.id)) { Save.data.msgRead.push(m.id); Save.save(); scr.refresh(); if (window.Home) Home.refreshBadges(); }
        UI.dialog({
          title: m.from, text: m.text,
          options: [
            { label: 'Yanıtla', icon: 'send', action: () => UI.prompt({ title: 'Yanıtın', max: 60, onDone: v => { if (v) UI.toast({ iconHTML: icon('send'), title: 'Mesaj gönderildi', text: m.from }); } }) },
            { label: 'Kapat' }
          ]
        });
      }
    }))
  });
}

const Party = { members: null };
function inviteToParty(f) {
  if (!Party.members) Party.members = [];
  if (f.status !== 'online') { UI.toast({ iconHTML: icon('party'), title: 'Davet gönderildi', text: `${f.name} şu an çevrimdışı.` }); return; }
  if (Party.members.includes(f)) return;
  UI.toast({ iconHTML: icon('party'), title: 'Davet gönderildi', text: f.name });
  setTimeout(() => {
    if (!Party.members || Party.members.includes(f)) return;
    Party.members.push(f);
    Sound.notify();
    UI.toast({ iconHTML: avatarSVG(f.avatar), title: `${f.name} partiye katıldı`, text: 'Sesli sohbet başladı' });
    const t = Nav.top(); if (t && t.isParty) t.refresh();
  }, 2500);
}
function partyScreen() {
  const s = new ListScreen({
    title: 'Parti', icon: 'party',
    build: () => {
      if (!Party.members) return [{ icon: icon('party'), title: 'Parti Başlat', sub: 'Arkadaşlarınla sesli sohbet et', onX: (scr) => { Party.members = []; scr.refresh(); } }];
      const u = Save.data.user;
      return [
        { icon: avatarSVG(u.avatar), title: u.name, sub: 'Parti lideri · Konuşuyor', right: 'Sen' },
        ...Party.members.map(f => ({ icon: avatarSVG(f.avatar), title: f.name, sub: 'Bağlı', right: '' })),
        { icon: icon('userplus'), title: 'Arkadaş Davet Et', sub: 'Çevrimiçi arkadaşlarını çağır', onX: () => {
          const free = FRIENDS.filter(f => f.status === 'online' && !Party.members.includes(f));
          if (!free.length) { UI.toast({ iconHTML: icon('party'), title: 'Davet edilecek kimse yok' }); return; }
          UI.dialog({ title: 'Davet Et', options: free.map(f => ({ label: f.name, action: () => inviteToParty(f) })) });
        } },
        { icon: icon('exit'), title: 'Partiden Ayrıl', onX: (scr) => { Party.members = null; scr.refresh(); } }
      ];
    }
  });
  s.isParty = true;
  return s;
}

function profileScreen() {
  return new ListScreen({
    title: 'Profil', icon: 'profile', cls: 'profile-screen',
    build: () => {
      const u = Save.data.user;
      return [
        { icon: avatarSVG(u.avatar), title: 'Avatar', sub: 'Sol/sağ ile değiştir', right: `${u.avatar + 1} / ${AVATARS.length}`,
          lr: d => { u.avatar = (u.avatar + d + AVATARS.length) % AVATARS.length; Save.save(); if (window.Home) Home.refresh(); },
          hints: [['x', 'Seç'], ['o', 'Geri']] },
        { icon: icon('edit'), title: 'Çevrimiçi Kimlik', sub: 'Kullanıcı adını değiştir', right: u.name,
          onX: (scr) => UI.prompt({ title: 'Yeni çevrimiçi kimlik', value: u.name, max: 16, onDone: v => {
            if (v) { u.name = v; Save.save(); scr.refresh(); if (window.Home) Home.refresh(); }
          } }) },
        { icon: icon('trophy'), title: 'Kupalar', sub: 'Tüm kupalarını görüntüle', onX: () => Nav.push(trophiesScreen()) }
      ];
    },
    side: () => {
      const u = Save.data.user, t = Trophies.totals(), lv = Trophies.level();
      return `<div class="side-card big"><div class="side-av">${avatarSVG(u.avatar)}</div><h3>${esc(u.name)}</h3>` +
        `<div class="lvl"><span>${icon('star')} Seviye ${lv.level}</span><div class="bar"><i style="width:${lv.pct}%"></i></div></div>` +
        `<div class="tcounts">${['platinum', 'gold', 'silver', 'bronze'].map(g => `<span>${trophySVG(g)}${t[g]}</span>`).join('')}</div></div>`;
    }
  });
}

function trophiesScreen() {
  return new ListScreen({
    title: 'Kupalar', icon: 'trophy',
    build: () => Object.keys(APPS).filter(id => APPS[id].trophies.length && (Save.data.installed.includes(id) || Save.data.trophies[id])).map(id => {
      const p = Trophies.progress(id);
      return { icon: coverSVG(APPS[id], { noTitle: true }), title: APPS[id].name, sub: `${p.got} / ${p.total} kupa`, right: `%${p.pct}`, id,
        onX: () => Nav.push(gameTrophiesScreen(id)) };
    }),
    side: () => {
      const t = Trophies.totals(), lv = Trophies.level();
      return `<div class="side-card"><h3>Seviye ${lv.level}</h3><div class="lvl"><div class="bar"><i style="width:${lv.pct}%"></i></div></div>` +
        `<div class="tcounts">${['platinum', 'gold', 'silver', 'bronze'].map(g => `<span>${trophySVG(g)}${t[g]}</span>`).join('')}</div>` +
        `<p>Toplam ${t.all} kupa</p></div>`;
    }
  });
}

function gameTrophiesScreen(id) {
  const app = APPS[id];
  return new ListScreen({
    title: `${app.name} — Kupalar`, icon: 'trophy',
    build: () => app.trophies.map(t => {
      const ts = (Save.data.trophies[id] || {})[t.id];
      return { icon: trophySVG(t.grade, !ts), title: t.name, sub: t.desc,
        right: ts ? new Date(ts).toLocaleDateString('tr-TR') : 'Kilitli', cls: ts ? 'earned' : 'locked', grade: t.grade };
    }),
    side: it => it ? `<div class="side-card"><div class="side-trophy">${trophySVG(it.grade, it.cls === 'locked')}</div><h3>${esc(it.title)}</h3>` +
      `<p>${esc(it.sub)}</p><p class="muted">${GRADE_NAMES[it.grade]} kupa · ${it.cls === 'locked' ? 'Henüz kazanılmadı' : 'Kazanıldı: ' + esc(it.right)}</p></div>` : ''
  });
}

function settingsScreen() {
  const s = Save.data.settings;
  const onoff = v => v ? 'Açık' : 'Kapalı';
  const themeKeys = () => Object.keys(THEMES).filter(k => !THEMES[k].store || Save.data.themes.includes(k));
  return new ListScreen({
    title: 'Ayarlar', icon: 'settings',
    build: () => [
      { icon: icon('palette'), title: 'Tema', sub: 'Ana ekran arka planı', right: THEMES[s.theme].name,
        lr: d => { const ks = themeKeys(); s.theme = ks[(ks.indexOf(s.theme) + d + ks.length) % ks.length]; Save.save(); Sys.applySettings(); },
        onX: scr => { const ks = themeKeys(); s.theme = ks[(ks.indexOf(s.theme) + 1) % ks.length]; Save.save(); Sys.applySettings(); scr.refresh(); },
        detail: 'Mağazadan yeni temalar indirebilirsin.' },
      { icon: icon('music'), title: 'Arka Plan Müziği', sub: 'Ana ekran ortam müziği', right: onoff(s.music),
        lr: () => { s.music = !s.music; Save.save(); Sys.applySettings(); },
        onX: scr => { s.music = !s.music; Save.save(); Sys.applySettings(); scr.refresh(); } },
      { icon: icon('volume'), title: 'Ses Efektleri', sub: 'Menü ve oyun sesleri', right: onoff(s.sfx),
        lr: () => { s.sfx = !s.sfx; Save.save(); Sys.applySettings(); },
        onX: scr => { s.sfx = !s.sfx; Save.save(); Sys.applySettings(); scr.refresh(); } },
      { icon: icon('clock'), title: 'Saat Biçimi', sub: 'Durum çubuğundaki saat', right: s.clock24 ? '24 saat' : '12 saat',
        lr: () => { s.clock24 = !s.clock24; Save.save(); updateClocks(); },
        onX: scr => { s.clock24 = !s.clock24; Save.save(); updateClocks(); scr.refresh(); } },
      { icon: icon('monitor'), title: 'Tam Ekran', sub: 'Pencere / tam ekran arasında geçiş (F11)', onX: () => Sys.toggleFullscreen() },
      { icon: icon('keyboard'), title: 'Kontroller', sub: 'Klavye ve kumanda tuşları', onX: () => showControls() },
      { icon: icon('info'), title: 'Sistem Bilgisi', sub: 'Sürüm ve donanım', onX: () => UI.dialog({
        title: 'Sistem Bilgisi',
        text: `PS4 Arayüz Emülatörü\nSistem yazılımı: 1.0.0 (hayran yapımı)\nPlatform: ${window.desktop ? 'Masaüstü (' + window.desktop.platform + ')' : 'Tarayıcı'}\n` +
          `Kumanda: ${Input.padConnected() ? 'Bağlı' : 'Bağlı değil'}\n\nBu yazılım Sony Interactive Entertainment ile bağlantılı değildir.`
      }) },
      { icon: icon('reset'), title: 'Varsayılan Ayarlara Sıfırla', sub: 'Tüm kayıtlar, kupalar ve indirmeler silinir', onX: () => UI.dialog({
        title: 'Sistemi Sıfırla', text: 'Tüm veriler silinecek ve sistem yeniden başlatılacak. Emin misin?',
        options: [{ label: 'Sıfırla', action: () => { Save.reset(); Sys.applySettings(); Sys.shutdown(true); } }, { label: 'İptal' }]
      }) }
    ]
  });
}

function showControls() {
  UI.dialog({
    title: 'Kontroller',
    html: `<table class="ctrl">` +
      [['x', 'Enter / Boşluk', 'Seç / Onayla'], ['o', 'Esc / Backspace', 'Geri'], ['triangle', 'T', 'Üçgen'], ['square', 'F', 'Kare'],
       ['options', 'M', 'Seçenekler / Duraklat'], ['ps', 'H / Home', 'Ana ekran (oyunu askıya alır)']]
        .map(r => `<tr><td>${glyph(r[0])}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('') +
      `<tr><td><span class="g-pill">YÖN</span></td><td>Ok tuşları / WASD</td><td>Gezinme</td></tr>` +
      `<tr><td><span class="g-pill">HIZLI</span></td><td>Q</td><td>Hızlı menü (kumandada PS'ye basılı tut)</td></tr>` +
      `<tr><td><span class="g-pill">F11</span></td><td>F11</td><td>Tam ekran</td></tr></table>`,
    options: [{ label: 'Kapat' }]
  });
}

/* Mağaza */
const Downloads = {};
function storeScreen() {
  const owned = it => it.kind === 'game' ? Save.data.installed.includes(it.key) : Save.data.themes.includes(it.key);
  const nameOf = it => it.kind === 'game' ? APPS[it.key].name : THEMES[it.key].name + ' Teması';
  const scr = new GridScreen({
    title: 'Mağaza', icon: 'store', cols: 4,
    build: () => STORE_ITEMS,
    card: it => {
      const dl = Downloads[it.key];
      let state;
      if (dl) state = `<div class="prog"><i style="width:${Math.floor(dl.p)}%"></i></div><small>İndiriliyor… %${Math.floor(dl.p)}</small>`;
      else if (owned(it)) state = `<small class="ok">${icon('check')} ${it.kind === 'game' ? 'Yüklü' : 'Sahipsin'}</small>`;
      else state = `<small>${icon('download')} Ücretsiz</small>`;
      return `<div class="cover">${it.kind === 'game' ? coverSVG(APPS[it.key]) : themeSVG(it.key)}</div>` +
        `<div class="info"><b>${esc(nameOf(it))}</b><span>${it.kind === 'game' ? 'Oyun · ' + esc(APPS[it.key].genre) : 'Dinamik Tema'}</span>${state}</div>`;
    },
    detail: it => `<b>${esc(nameOf(it))}</b><span>${esc(it.kind === 'game' ? APPS[it.key].desc : 'Ana ekranın için yeni bir arka plan ve vurgu rengi.')}</span>`,
    hints: it => [['x', Downloads[it.key] ? 'İndiriliyor' : owned(it) ? (it.kind === 'game' ? 'Oyna' : 'Uygula') : 'İndir'], ['o', 'Geri']],
    onX: (it, s, i) => {
      if (Downloads[it.key]) return;
      if (owned(it)) {
        if (it.kind === 'game') { Nav.toRoot(); Games.launch(it.key); }
        else { Save.data.settings.theme = it.key; Save.save(); Sys.applySettings(); UI.toast({ iconHTML: icon('palette'), title: 'Tema uygulandı', text: THEMES[it.key].name }); }
        return;
      }
      Downloads[it.key] = { p: 0 };
      s.updateCard(i);
      const timer = setInterval(() => {
        const d = Downloads[it.key];
        d.p = Math.min(100, d.p + 2 + Math.random() * (it.kind === 'game' ? 4 : 9));
        if (d.p >= 100) {
          clearInterval(timer);
          delete Downloads[it.key];
          if (it.kind === 'game') Save.data.installed.push(it.key); else Save.data.themes.push(it.key);
          Save.save();
          Sys.notify({ type: 'download', title: 'İndirme tamamlandı', text: nameOf(it) });
          if (window.Home) Home.refresh();
        }
        if (s.el.isConnected) s.updateCard(i);
      }, 120);
    }
  });
  return scr;
}

/* Kütüphane */
function libraryScreen() {
  return new GridScreen({
    title: 'Kütüphane', icon: 'library', cols: 5, empty: 'Yüklü oyun yok. Mağazadan indirebilirsin.',
    build: () => Save.data.installed.filter(id => APPS[id]).sort((a, b) => APPS[a].name.localeCompare(APPS[b].name, 'tr')),
    card: id => `<div class="cover">${coverSVG(APPS[id])}${Games.isRunning(id) ? `<div class="run-badge on">${icon('play')}</div>` : ''}</div>` +
      `<div class="info"><b>${esc(APPS[id].name)}</b><span>${esc(APPS[id].publisher)}</span></div>`,
    detail: id => `<b>${esc(APPS[id].name)}</b><span>${esc(APPS[id].desc)}</span>`,
    hints: id => [['x', Games.isRunning(id) ? 'Devam Et' : 'Başlat'], ['options', 'Seçenekler'], ['o', 'Geri']],
    onX: id => { Nav.toRoot(); Games.launch(id); },
    onOptions: id => gameOptions(id)
  });
}
