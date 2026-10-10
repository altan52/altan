'use strict';

/* 24x24 çizgi ikonlar (Sony varlıkları kullanılmamıştır, hepsi el yapımıdır) */
const ICONS = {
  store: '<path d="M5 8h14l-1.2 12.5H6.2L5 8z"/><path d="M9 10V6.5a3 3 0 0 1 6 0V10"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4l2-2z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  friends: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2a5 5 0 0 1 6 4.8"/>',
  messages: '<path d="M4 5h16v11H9.5L4 20V5z"/><path d="M8 9.5h8M8 12.5h5"/>',
  party: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4"/><path d="M12 13v4M8 20.5h8M10 17h4v3.5h-4z"/>',
  settings: '<rect x="3" y="8" width="18" height="12" rx="1.5"/><path d="M9 8V5h6v3M3 13h18M11 12v2.5h2V12"/>',
  power: '<path d="M12 3v9"/><path d="M6.3 6.8a8 8 0 1 0 11.4 0"/>',
  library: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
  whatsnew: '<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>',
  gamepad: '<path d="M7 9h10a4 4 0 0 1 4 4.5l-.6 3.5a2 2 0 0 1-3.5.9L15 16H9l-1.9 1.9a2 2 0 0 1-3.5-.9L3 13.5A4 4 0 0 1 7 9z"/><path d="M8 11.5v3M6.5 13h3"/><circle cx="16" cy="12" r=".5"/><circle cx="17.5" cy="13.8" r=".5"/>',
  play: '<path d="M8 5l11 7-11 7z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.2"/>',
  trash: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.9 1.4-2-.5-1.3.3-2.5 1.7-2.5H18a3 3 0 0 0 3-3A9 9 0 0 0 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="14.5" cy="7" r="1"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  volume: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
  monitor: '<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M8 20h8M12 16v4"/>',
  reset: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/>',
  keyboard: '<rect x="2.5" y="6" width="19" height="12" rx="1.5"/><path d="M6 10h.5M9 10h.5M12 10h.5M15 10h.5M18 10h.5M7 14h10"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  send: '<path d="M4 12l16-8-6 16-2.5-6.5L4 12z"/>',
  userplus: '<circle cx="10" cy="8" r="3.5"/><path d="M3.5 20a6.5 6.5 0 0 1 13 0"/><path d="M19 8v6M16 11h6"/>',
  exit: '<path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>'
};

function icon(name, cls) {
  return `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
}

/* Kumanda tuş simgeleri */
const GLYPH_SVG = {
  x: '<path d="M7.5 7.5l9 9M16.5 7.5l-9 9" stroke="#8ab8ff" stroke-width="2.4" stroke-linecap="round"/>',
  o: '<circle cx="12" cy="12" r="5.3" stroke="#ff7373" stroke-width="2.2" fill="none"/>',
  triangle: '<path d="M12 6.8l5.6 9.7H6.4z" stroke="#4fe3b5" stroke-width="2.1" fill="none" stroke-linejoin="round"/>',
  square: '<rect x="7" y="7" width="10" height="10" rx=".5" stroke="#ff93da" stroke-width="2.1" fill="none"/>'
};

function glyph(a) {
  if (a === 'options') return '<span class="g-pill">OPTIONS</span>';
  if (a === 'ps') return '<span class="g-pill">PS</span>';
  return `<span class="g"><svg viewBox="0 0 24 24">${GLYPH_SVG[a] || ''}</svg></span>`;
}

function hintsHTML(list) {
  return list.map(([a, label]) => `<div class="hint">${glyph(a)}<span>${esc(label)}</span></div>`).join('');
}

/* Oyun kapak çizimleri (100x100) */
const GAME_GLYPHS = {
  snake:
    '<g fill="none" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M16 66 H34 V44 H56 V58 H76 V32" stroke="#fff" stroke-width="7"/>' +
    '<path d="M16 66 H34 V44 H56 V58 H76 V32" stroke="#7fffe4" stroke-width="2.5" opacity=".9"/></g>' +
    '<rect x="70.5" y="24" width="11" height="11" rx="2.5" fill="#fff"/>' +
    '<circle cx="30" cy="24" r="4.5" fill="#ffe66d"/><circle cx="30" cy="24" r="8" fill="#ffe66d" opacity=".25"/>',
  breakout:
    '<g>' +
    [0, 1, 2].map(r => [0, 1, 2, 3, 4].map(c =>
      `<rect x="${12 + c * 15.5}" y="${14 + r * 8}" width="13.5" height="6" rx="1" fill="${['#ffd166', '#ffffff', '#ff9ec7'][r]}" opacity="${(r + c) % 4 === 3 ? 0.25 : 0.95}"/>`
    ).join('')).join('') +
    '</g><circle cx="58" cy="54" r="4" fill="#fff"/><rect x="38" y="68" width="26" height="4.5" rx="2.2" fill="#fff"/>' +
    '<path d="M58 54 L44 42" stroke="#fff" stroke-width="1" stroke-dasharray="2 2" opacity=".6"/>',
  asteroids:
    '<path d="M58 14 l14 4 l8 12 l-3 14 l-12 7 l-13 -3 l-7 -12 l3 -14z" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M22 22 l7 2 l3 6 l-4 5 l-7 -1 l-3 -6z" fill="none" stroke="#ffd29a" stroke-width="2.2" stroke-linejoin="round"/>' +
    '<path d="M32 70 l8 -20 l8 20 l-8 -5z" fill="#fff"/><path d="M37 68 l3 9 l3 -9" fill="#ffb347"/>',
  mouse:
    '<path d="M60 70 L88 58 L88 74 Z" fill="#ffd23f"/><path d="M60 70 L88 58 L84 54 Z" fill="#ffe680"/>' +
    '<circle cx="77" cy="66" r="2.2" fill="#e8a800"/><circle cx="84" cy="69" r="1.5" fill="#e8a800"/>' +
    '<circle cx="29" cy="25" r="11" fill="#c9a27e"/><circle cx="29" cy="25" r="6" fill="#f2b8c6"/>' +
    '<circle cx="61" cy="25" r="11" fill="#c9a27e"/><circle cx="61" cy="25" r="6" fill="#f2b8c6"/>' +
    '<ellipse cx="45" cy="46" rx="22" ry="20" fill="#c9a27e"/>' +
    '<circle cx="37" cy="42" r="3.6" fill="#1d2433"/><circle cx="53" cy="42" r="3.6" fill="#1d2433"/>' +
    '<circle cx="38" cy="41" r="1.1" fill="#fff"/><circle cx="54" cy="41" r="1.1" fill="#fff"/>' +
    '<ellipse cx="45" cy="52" rx="3.4" ry="2.6" fill="#ff7a9a"/>' +
    '<path d="M33 54 h-10 M33 57 l-9 3 M57 54 h10 M57 57 l9 3" stroke="#5a4636" stroke-width="1" stroke-linecap="round"/>',
  pong:
    '<rect x="13" y="26" width="5" height="22" rx="1.5" fill="#fff"/><rect x="82" y="40" width="5" height="22" rx="1.5" fill="#fff"/>' +
    '<path d="M50 12 V74" stroke="#fff" stroke-width="1.6" stroke-dasharray="3.5 3.5" opacity=".55"/>' +
    '<circle cx="62" cy="36" r="3.8" fill="#fff"/><path d="M62 36 L22 50" stroke="#fff" stroke-width="1" opacity=".35"/>'
};

let _uid = 0;
function uid() { return ++_uid; }

function coverSVG(app, opts) {
  opts = opts || {};
  const [c1, c2] = app.colors;
  const id = 'cv' + uid();
  const title = opts.noTitle ? '' :
    `<text x="50" y="89" text-anchor="middle" font-size="8.2" font-weight="700" fill="#fff" letter-spacing=".4">${esc(app.name.toLocaleUpperCase('tr-TR'))}</text>`;
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"><defs>` +
    `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>` +
    `<radialGradient id="${id}r" cx=".25" cy=".2" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>` +
    `</defs><rect width="100" height="100" fill="url(#${id})"/><rect width="100" height="100" fill="url(#${id}r)"/>` +
    `${GAME_GLYPHS[app.glyph] || ''}${title}</svg>`;
}

function sysTileSVG(iconName, colors, label) {
  const id = 'st' + uid();
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"><defs>` +
    `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient>` +
    `</defs><rect width="100" height="100" fill="url(#${id})"/>` +
    `<g transform="translate(29 18) scale(1.75)" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${ICONS[iconName]}</g>` +
    (label ? `<text x="50" y="88" text-anchor="middle" font-size="8.2" font-weight="600" fill="#fff">${esc(label)}</text>` : '') +
    `</svg>`;
}

function themeSVG(key) {
  const th = THEMES[key];
  const id = 'th' + uid();
  const waves = [0, 1, 2, 3, 4, 5].map(i =>
    `<path d="M-5 ${52 + i * 2.2} C 25 ${30 + i * 3}, 60 ${78 - i * 2.5}, 105 ${46 + i * 2}" stroke="rgba(${th.wave},${0.55 - i * 0.07})" stroke-width=".7" fill="none"/>`
  ).join('');
  const stars = th.stars ? Array.from({ length: 24 }, (_, i) =>
    `<circle cx="${(i * 37) % 100}" cy="${(i * 53) % 70}" r=".6" fill="#fff" opacity="${0.4 + (i % 3) * 0.2}"/>`).join('') : '';
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${th.top}"/><stop offset="1" stop-color="${th.bottom}"/></linearGradient></defs>` +
    `<rect width="100" height="100" fill="url(#${id})"/>${stars}${waves}` +
    `<text x="50" y="90" text-anchor="middle" font-size="8" font-weight="700" fill="#fff">${esc(th.name.toLocaleUpperCase('tr-TR'))}</text></svg>`;
}

function avatarSVG(i) {
  const [c1, c2, face] = AVATARS[i % AVATARS.length];
  const id = 'av' + uid();
  const faces = {
    cat: '<path d="M28 42 L31 19 L46 32 Z M72 42 L69 19 L54 32 Z" fill="#fff"/><circle cx="50" cy="54" r="25" fill="#fff"/>' +
      '<circle cx="41" cy="51" r="3.6" fill="#1d2433"/><circle cx="59" cy="51" r="3.6" fill="#1d2433"/><path d="M46.5 59 h7 l-3.5 3.5z" fill="#ff5f8a"/>',
    robot: '<path d="M50 30 V19" stroke="#fff" stroke-width="3"/><circle cx="50" cy="17" r="4.5" fill="#fff"/>' +
      '<rect x="27" y="30" width="46" height="42" rx="9" fill="#fff"/><rect x="36" y="42" width="10" height="10" rx="2" fill="#1d2433"/>' +
      '<rect x="54" y="42" width="10" height="10" rx="2" fill="#1d2433"/><rect x="40" y="60" width="20" height="4" rx="2" fill="#1d2433"/>',
    alien: '<ellipse cx="50" cy="52" rx="23" ry="28" fill="#fff"/>' +
      '<ellipse cx="40.5" cy="52" rx="6.5" ry="10" fill="#1d2433" transform="rotate(-22 40.5 52)"/>' +
      '<ellipse cx="59.5" cy="52" rx="6.5" ry="10" fill="#1d2433" transform="rotate(22 59.5 52)"/>',
    ghost: '<path d="M27 77 V50 a23 23 0 0 1 46 0 V77 l-7.67 -6 l-7.67 6 l-7.67 -6 l-7.67 6 l-7.67 -6 l-7.67 6z" fill="#fff"/>' +
      '<circle cx="42" cy="49" r="4.2" fill="#1d2433"/><circle cx="58" cy="49" r="4.2" fill="#1d2433"/>'
  };
  return `<svg viewBox="0 0 100 100"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>` +
    `<rect width="100" height="100" fill="url(#${id})"/>${faces[face]}</svg>`;
}

function trophySVG(grade, locked) {
  const c = locked ? '#5b6270' : GRADE_COLORS[grade];
  return `<svg viewBox="0 0 24 24" class="trophy-ic"><path d="M8 4h8v5a4 4 0 0 1-8 0V4z" fill="${c}"/>` +
    `<path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4" stroke="${c}" stroke-width="1.6" fill="none"/>` +
    `<rect x="11" y="12.5" width="2" height="4.5" fill="${c}"/><rect x="8" y="17" width="8" height="3.5" rx=".6" fill="${c}"/>` +
    (locked ? '' : '<path d="M10 5.5v3" stroke="#fff" stroke-width="1" opacity=".55" stroke-linecap="round"/>') + '</svg>';
}

/* Yardımcılar */
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function $(sel) { return document.querySelector(sel); }
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'Az önce';
  if (s < 3600) return Math.floor(s / 60) + ' dk önce';
  if (s < 86400) return Math.floor(s / 3600) + ' sa önce';
  return Math.floor(s / 86400) + ' gün önce';
}
