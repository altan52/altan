'use strict';

/* Uygulama / oyun kataloğu */
const APPS = {
  snake: {
    id: 'snake', name: 'Neon Yılan', publisher: 'Altan Studios', genre: 'Arcade', size: '1,2 GB',
    colors: ['#00e6b8', '#003a5c'], glyph: 'snake', preinstalled: true,
    desc: 'Neon ızgarada büyü, kendi kuyruğuna ve duvarlara çarpma! Klasik yılan oyununun parlak bir yorumu.',
    controls: 'Yön tuşları / WASD / sol çubuk: Hareket',
    trophies: [
      { id: 'first', name: 'İlk Lokma', desc: 'İlk yemi ye.', grade: 'bronze' },
      { id: 'ten', name: 'Uzayan Kuyruk', desc: 'Tek oyunda 10 puan topla.', grade: 'bronze' },
      { id: 'twentyfive', name: 'Neon Avcısı', desc: 'Tek oyunda 25 puan topla.', grade: 'silver' },
      { id: 'forty', name: 'Yılanların Efendisi', desc: 'Tek oyunda 40 puan topla.', grade: 'gold' },
      { id: 'plat', name: 'Neon Efsanesi', desc: 'Neon Yılan\'daki tüm kupaları kazan.', grade: 'platinum' }
    ]
  },
  breakout: {
    id: 'breakout', name: 'Blok Kırıcı', publisher: 'Altan Studios', genre: 'Aksiyon', size: '2,4 GB',
    colors: ['#ff5f6d', '#4a0d82'], glyph: 'breakout', preinstalled: true,
    desc: 'Raketi kaydır, topu sektir ve tüm blokları parçala. Her seviyede bloklar daha dayanıklı!',
    controls: 'Sol/Sağ: Raket  ·  ✕ (Enter): Topu fırlat',
    trophies: [
      { id: 'first', name: 'İlk Çatlak', desc: 'İlk bloğu kır.', grade: 'bronze' },
      { id: 'clear', name: 'Temiz Sayfa', desc: 'Bir seviyeyi tamamla.', grade: 'bronze' },
      { id: 'flawless', name: 'Kusursuz', desc: 'Can kaybetmeden bir seviyeyi tamamla.', grade: 'silver' },
      { id: 'level3', name: 'Usta Kırıcı', desc: '3. seviyeye ulaş.', grade: 'gold' },
      { id: 'plat', name: 'Yıkım Ustası', desc: 'Blok Kırıcı\'daki tüm kupaları kazan.', grade: 'platinum' }
    ]
  },
  mice: {
    id: 'mice', name: 'Peynir Avcıları', publisher: 'Altan Studios', genre: 'Platform · Parti', size: '1,8 GB',
    colors: ['#8fd3ff', '#2a5aa8'], glyph: 'mouse', preinstalled: true,
    desc: 'Transformice tarzı fare yarışı: peyniri kap, yuvaya ilk sen gir! 8 farklı haritada 6 fareye karşı yarış. Şaman olduğun turlarda tahta, kutu ve trambolin yerleştirip diğer farelerin geçmesine yardım et.',
    controls: 'Sol/Sağ: Koş  ·  ✕ / Yukarı: Zıpla  ·  Şamanken: Yön tuşları imleç, ✕ yerleştir, △ (T) eşya değiştir',
    trophies: [
      { id: 'cheese', name: 'Peynir Kokusu', desc: 'İlk kez peynir kap.', grade: 'bronze' },
      { id: 'hole', name: 'Yuvaya Dönüş', desc: 'Peynirle birlikte yuvaya gir.', grade: 'bronze' },
      { id: 'first', name: 'En Hızlı Fare', desc: 'Bir turda yuvaya ilk sen gir.', grade: 'silver' },
      { id: 'shaman', name: 'Kurtarıcı Şaman', desc: 'Şamanken bir turda en az 4 fare kurtar.', grade: 'silver' },
      { id: 'champ', name: 'Peynir Kralı', desc: '8 turluk bir oyunu birinci bitir.', grade: 'gold' },
      { id: 'plat', name: 'Efsanevi Fare', desc: 'Peynir Avcıları\'ndaki tüm kupaları kazan.', grade: 'platinum' }
    ]
  },
  asteroids: {
    id: 'asteroids', name: 'Asteroid Kaçışı', publisher: 'Nova Interactive', genre: 'Hayatta Kalma', size: '3,1 GB',
    colors: ['#f7971e', '#2e1065'], glyph: 'asteroids', store: true, price: 'Ücretsiz',
    desc: 'Asteroid yağmurunun ortasında gemini hayatta tut. Zaman geçtikçe gökyüzü daha da kalabalıklaşır.',
    controls: 'Yön tuşları / WASD / sol çubuk: Gemiyi yönlendir',
    trophies: [
      { id: 't15', name: 'Isınma Turu', desc: '15 saniye hayatta kal.', grade: 'bronze' },
      { id: 't45', name: 'Göktaşı Dansçısı', desc: '45 saniye hayatta kal.', grade: 'silver' },
      { id: 't90', name: 'Yıldız Pilotu', desc: '90 saniye hayatta kal.', grade: 'gold' }
    ]
  },
  pong: {
    id: 'pong', name: 'Retro Pong', publisher: 'Nova Interactive', genre: 'Spor', size: '650 MB',
    colors: ['#a855f7', '#111133'], glyph: 'pong', store: true, price: 'Ücretsiz',
    desc: 'Yapay zekâya karşı klasik masa tenisi. 7 sayıya ilk ulaşan kazanır.',
    controls: 'Yukarı/Aşağı: Raket',
    trophies: [
      { id: 'point', name: 'İlk Sayı', desc: 'Rakibe karşı bir sayı al.', grade: 'bronze' },
      { id: 'win', name: 'Şampiyon', desc: 'Bir maç kazan.', grade: 'silver' },
      { id: 'wall', name: 'Aşılmaz Duvar', desc: 'En fazla 2 sayı yiyerek bir maç kazan.', grade: 'gold' }
    ]
  }
};

const GRADE_NAMES = { bronze: 'Bronz', silver: 'Gümüş', gold: 'Altın', platinum: 'Platin' };
const GRADE_COLORS = { bronze: '#d08a4f', silver: '#cfd6de', gold: '#ffcf3f', platinum: '#a8dcff' };
const GRADE_POINTS = { bronze: 15, silver: 30, gold: 90, platinum: 180 };

/* Temalar (arka plan) */
const THEMES = {
  blue:   { name: 'Klasik Mavi', top: '#0b48a8', bottom: '#020d2b', wave: '120,190,255', particle: '190,225,255', accent: '#2f8cff' },
  black:  { name: 'Gece Siyahı', top: '#24242c', bottom: '#040406', wave: '200,205,230', particle: '255,255,255', accent: '#8aa4ff' },
  red:    { name: 'Kızıl', top: '#8a1022', bottom: '#1a0206', wave: '255,140,150', particle: '255,205,205', accent: '#ff4d6a' },
  green:  { name: 'Zümrüt', top: '#077257', bottom: '#011a14', wave: '120,255,200', particle: '200,255,230', accent: '#1fd4a0' },
  sunset: { name: 'Gün Batımı', store: true, top: '#c24d2c', bottom: '#2b0b3a', wave: '255,190,120', particle: '255,225,175', accent: '#ff8a3d' },
  space:  { name: 'Derin Uzay', store: true, top: '#160c3d', bottom: '#000000', wave: '160,120,255', particle: '255,255,255', accent: '#9b7bff', stars: true }
};

/* Mağaza */
const STORE_ITEMS = [
  { key: 'asteroids', kind: 'game' },
  { key: 'pong', kind: 'game' },
  { key: 'sunset', kind: 'theme' },
  { key: 'space', kind: 'theme' }
];

/* Avatarlar: [renk1, renk2, yüz] */
const AVATARS = [
  ['#4facfe', '#0047b3', 'robot'],
  ['#ff9a44', '#fc4f6c', 'cat'],
  ['#43e97b', '#0f8f6a', 'alien'],
  ['#a18cd1', '#5a3d9a', 'ghost'],
  ['#f6d365', '#e8743b', 'cat'],
  ['#30cfd0', '#330867', 'robot'],
  ['#ff0844', '#7a0420', 'ghost'],
  ['#667eea', '#2b1a5c', 'alien']
];

/* Sahte arkadaş listesi ve mesajlar */
const FRIENDS = [
  { name: 'KaraKartal_34', avatar: 1, status: 'online', activity: 'Neon Yılan oynuyor' },
  { name: 'Ayse_Gamer', avatar: 3, status: 'online', activity: 'Ana ekranda' },
  { name: 'Elif_77', avatar: 4, status: 'online', activity: 'Blok Kırıcı oynuyor' },
  { name: 'MehmetPro', avatar: 5, status: 'away', activity: 'Uzakta' },
  { name: 'Zeynep.exe', avatar: 6, status: 'offline', activity: 'Son çevrimiçi: 2 saat önce' },
  { name: 'CanTR', avatar: 7, status: 'offline', activity: 'Son çevrimiçi: 3 gün önce' }
];

const MESSAGES = [
  { id: 'm1', from: 'Ayse_Gamer', avatar: 3, text: 'Bu akşam parti kuralım mı? Retro Pong turnuvası yapalım!', ago: '10 dk önce' },
  { id: 'm2', from: 'KaraKartal_34', avatar: 1, text: 'Neon Yılan\'da 38 puan yaptım, geçebilir misin?', ago: '1 sa önce' },
  { id: 'm3', from: 'MehmetPro', avatar: 5, text: 'Blok Kırıcı 3. seviye çok zor, taktik var mı?', ago: 'Dün' }
];

/* Kayıt sistemi (localStorage) */
const Save = {
  KEY: 'ps4emu.save.v1',
  data: null,
  defaults() {
    return {
      user: { name: 'Oyuncu', avatar: 0 },
      settings: { theme: 'blue', music: true, sfx: true, clock24: true },
      installed: Object.keys(APPS).filter(id => APPS[id].preinstalled),
      themes: [],
      trophies: {},
      highscores: {},
      lastPlayed: {},
      msgRead: [],
      knownApps: Object.keys(APPS),
      notifications: [
        { type: 'info', title: 'Hoş geldiniz!', text: 'PS4 Arayüz Emülatörü kullanıma hazır.', time: Date.now(), read: false }
      ]
    };
  },
  load() {
    const def = this.defaults();
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(this.KEY) || 'null'); } catch (e) { raw = null; }
    this.data = Object.assign(def, raw || {});
    this.data.settings = Object.assign(this.defaults().settings, this.data.settings || {});
    this.data.user = Object.assign(this.defaults().user, this.data.user || {});
    this.data.installed = this.data.installed.filter(id => APPS[id]);
    // Güncellemeyle gelen yeni hazır uygulamaları eski kayıtlara da ekle
    // (knownApps alanı olmayan kayıtlar 1.0.0 sürümündendir)
    if (raw && !raw.knownApps) this.data.knownApps = ['snake', 'breakout', 'asteroids', 'pong'];
    const known = this.data.knownApps;
    for (const id of Object.keys(APPS)) {
      if (known.includes(id)) continue;
      if (APPS[id].preinstalled && !this.data.installed.includes(id)) this.data.installed.push(id);
      known.push(id);
    }
    this.data.knownApps = known;
    if (!THEMES[this.data.settings.theme]) this.data.settings.theme = 'blue';
  },
  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) { /* yoksay */ }
  },
  reset() {
    this.data = this.defaults();
    this.save();
  }
};

const Trophies = {
  earned(app, id) { return !!(Save.data.trophies[app] || {})[id]; },
  progress(app) {
    const list = APPS[app].trophies;
    if (!list.length) return { got: 0, total: 0, pct: 0 };
    const got = list.filter(t => this.earned(app, t.id)).length;
    return { got, total: list.length, pct: Math.round(got / list.length * 100) };
  },
  totals() {
    const r = { bronze: 0, silver: 0, gold: 0, platinum: 0, points: 0, all: 0 };
    for (const app of Object.keys(APPS)) {
      for (const t of APPS[app].trophies) {
        if (this.earned(app, t.id)) { r[t.grade]++; r.points += GRADE_POINTS[t.grade]; r.all++; }
      }
    }
    return r;
  },
  level() {
    const p = this.totals().points;
    return { level: 1 + Math.floor(p / 60), pct: Math.round((p % 60) / 60 * 100) };
  }
};
