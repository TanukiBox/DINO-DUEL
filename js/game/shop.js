/*
 * DINO DUEL カードパック（アーケードの筐体からカードが1枚出てくる）
 * レア度が高いほど演出が派手：N 白 / R 青い光 / SR 紫の稲妻とゆれ / SSR 金の光の筋と大きなゆれ / EX 虹色・画面いっぱいの光。
 * 排出率はパックごとに表示（data.js の rates と同じ数字で引いている）。
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};

  function $(id) { return document.getElementById(id); }
  function T(k, p) { return DN.app.i18n.t(k, p); }
  function L(o) { return o[DN.app.i18n.lang] || o.en; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function st() { return DN.app.state; }
  function num(n) { return Number(n).toLocaleString('en-US'); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  var RANK = { N: 0, R: 1, SR: 2, SSR: 3, EX: 4 };
  var GLOW = { N: '#ffffff', R: '#5aa8ff', SR: '#c070ff', SSR: '#ffd23a', EX: '#ff5ad0' };

  // 筐体（静止した絵は SVG、光る部分は CSS で点滅）
  var MACHINE =
    '<svg class="mc-svg" viewBox="0 0 220 240" aria-hidden="true">' +
      '<defs><linearGradient id="mcb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a1f5e"/><stop offset="0.5" stop-color="#4a36a8"/><stop offset="1" stop-color="#2a1f5e"/></linearGradient>' +
      '<linearGradient id="mcs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1430"/><stop offset="1" stop-color="#1c2a5a"/></linearGradient>' +
      '<linearGradient id="mcm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf40"/><stop offset="1" stop-color="#ff8a1a"/></linearGradient></defs>' +
      // 本体
      '<path d="M30 40 H190 L200 228 C200 234 196 238 190 238 H30 C24 238 20 234 20 228 Z" fill="url(#mcb)" stroke="#120c2a" stroke-width="5" stroke-linejoin="round"/>' +
      // 看板
      '<rect x="18" y="8" width="184" height="42" rx="12" fill="url(#mcm)" stroke="#120c2a" stroke-width="5"/>' +
      '<text x="110" y="37" text-anchor="middle" font-family="Mochiy Pop One, sans-serif" font-size="21" fill="#fff" stroke="#120c2a" stroke-width="5" paint-order="stroke">DINO PACK</text>' +
      // 画面
      '<rect x="44" y="62" width="132" height="84" rx="10" fill="url(#mcs)" stroke="#120c2a" stroke-width="4"/>' +
      '<path d="M56 132 C70 110 96 104 118 112 C128 104 142 98 156 102 C150 110 146 118 150 126 C140 124 132 128 126 134 Z" fill="#2a3a7a" opacity="0.8"/>' +
      '<text x="110" y="100" text-anchor="middle" font-family="Mochiy Pop One, sans-serif" font-size="30" fill="#ffd23a" stroke="#120c2a" stroke-width="4" paint-order="stroke" class="mc-q">?</text>' +
      // コインの口・ボタン
      '<rect x="150" y="160" width="26" height="30" rx="5" fill="#1c1440" stroke="#120c2a" stroke-width="3"/><rect x="161" y="166" width="4" height="18" rx="2" fill="#ffd23a"/>' +
      '<circle cx="72" cy="176" r="14" fill="#ff5a36" stroke="#120c2a" stroke-width="4"/><circle cx="68" cy="172" r="4" fill="#fff" opacity="0.6"/>' +
      '<circle cx="110" cy="176" r="10" fill="#36c8ff" stroke="#120c2a" stroke-width="4"/>' +
      // カードの出口
      '<rect x="60" y="206" width="100" height="14" rx="6" fill="#06040e" stroke="#120c2a" stroke-width="3"/>' +
    '</svg>';
  function lights() {
    var h = '';
    for (var i = 0; i < 9; i++) h += '<i class="lt" style="left:' + (12 + i * 9.5) + '%;animation-delay:' + (i * 0.12) + 's"></i>';
    return '<div class="mc-lights">' + h + '</div>';
  }

  var S = DN.Screens = DN.Screens || {};
  var busy = false;

  S.shop = function (args) {
    var s = st(), el = $('scr-shop');
    var buyable = DN.PACKS.filter(function (p) { return p.price !== null; });
    var prizes = DN.PACKS.filter(function (p) { return p.price === null && s.packs[p.id]; });
    el.innerHTML =
      '<div class="scr-top shop-top">' +
        '<div class="top-bar"><span class="scr-title">' + T('menuShop') + '</span><span class="coin-chip">' + DN.ICON.coin + '<b id="shop-money">' + num(s.money) + '</b></span></div>' +
        '<div class="machine" id="machine">' + lights() + MACHINE + '<div class="mc-slot"><div class="mc-card" id="mc-card"></div></div></div>' +
      '</div>' +
      '<div class="scr-bot shop-bot">' +
        (prizes.length ? '<div class="pk-prizes">' + prizes.map(function (p) {
          return '<button class="pk prize" data-p="' + p.id + '" style="--pc:' + p.color + '"><b>' + esc(L(p.name)) + '</b><span class="pk-cnt">× ' + s.packs[p.id] + '</span><small>' + T('openFree') + '</small></button>';
        }).join('') + '</div>' : '') +
        '<div class="pk-list">' + buyable.map(function (p) {
          return '<button class="pk" data-p="' + p.id + '" style="--pc:' + p.color + '"' + (s.money < p.price ? ' disabled' : '') + '><b>' + esc(L(p.name)) + '</b>' +
            '<span class="pk-price">' + DN.ICON.coin + num(p.price) + '</span><small>' + T('packOne') + '</small></button>';
        }).join('') + '</div>' +
        '<div class="row-btns"><button class="btn" id="sh-back">' + T('back') + '</button><button class="btn" id="sh-rates">' + T('rates') + '</button></div>' +
      '</div>';
    el.querySelectorAll('.pk').forEach(function (b) {
      b.addEventListener('click', function () { if (!busy) pull(b.dataset.p); });
    });
    $('sh-back').addEventListener('click', function () { if (busy) return; DN.app.sfx.tap(); DN.app.go('home'); });
    $('sh-rates').addEventListener('click', function () { DN.app.sfx.tap(); showRates(); });
    if (args && args.open && s.packs[args.open]) setTimeout(function () { pull(args.open); }, 400);
  };

  /** 排出率の表 */
  function showRates() {
    var rows = DN.PACKS.filter(function (p) { return p.price !== null || st().packs[p.id] || st().cleared[DN.TOURNAMENTS.map(function (t) { return t.pack; }).indexOf(p.id)]; }).map(function (p) {
      return '<tr><th>' + esc(L(p.name)) + '</th>' + DN.RARITIES.map(function (r) { return '<td class="r-' + r + '">' + p.rates[r] + '%</td>'; }).join('') + '</tr>';
    }).join('');
    overlay('<div class="rates"><h3>' + T('rates') + '</h3><p>' + T('ratesNote') + '</p><table><tr><th></th>' + DN.RARITIES.map(function (r) { return '<th class="r-' + r + '">' + r + '</th>'; }).join('') + '</tr>' + rows + '</table></div>',
      [{ label: T('close'), fn: closeOverlay }]);
  }

  function overlay(html, buttons) {
    var o = $('overlay');
    o.innerHTML = '<div class="ov-body">' + html + '</div><div class="ov-btns">' + buttons.map(function (b, i) { return '<button class="btn' + (b.big ? ' big' : '') + (b.cls ? ' ' + b.cls : '') + '" data-i="' + i + '">' + b.label + '</button>'; }).join('') + '</div>';
    o.classList.add('on');
    o.querySelectorAll('.ov-btns button').forEach(function (btn) {
      btn.addEventListener('click', function () { DN.app.sfx.tap(); buttons[+btn.dataset.i].fn(); });
    });
  }
  function closeOverlay() { var o = $('overlay'); o.classList.remove('on'); o.innerHTML = ''; }
  DN.overlay = overlay;
  DN.closeOverlay = closeOverlay;

  /** 1枚引く：お金を払う → 筐体が動く → カードが出る → めくる */
  async function pull(packId) {
    var s = st(), pack = DN.pack(packId);
    var r = pack.price === null ? DN.Progress.openPrize(s, packId) : DN.Progress.buy(s, packId);
    if (!r) return;
    busy = true;
    DN.app.save();
    var d = DN.dino(r.id), rank = RANK[d.rarity];
    var m = $('machine'), card = $('mc-card');
    $('shop-money').textContent = num(s.money);
    document.querySelectorAll('#scr-shop .pk, #sh-back').forEach(function (b) { b.disabled = true; });
    // 1. コインを入れる → 筐体が動きだす（高いレア度ほど光が強く、ゆれる）
    DN.app.sfx.coin();
    m.className = 'machine run g' + rank;
    m.style.setProperty('--glow', GLOW[d.rarity]);
    await wait(450);
    DN.app.sfx.whirr(rank);
    if (rank >= 2) m.classList.add('shake');
    if (rank >= 3) { await wait(500); m.classList.add('shake-hard'); DN.app.sfx.charge(3); }
    await wait(700 + rank * 180);
    // 2. カードが出口から出てくる（カードの裏に、レア度の色がにじむ）
    card.className = 'mc-card out g' + rank;
    card.style.setProperty('--glow', GLOW[d.rarity]);
    DN.app.sfx.card(rank);
    await wait(900);
    // 3. めくる
    reveal(r, pack);
  }

  function reveal(r, pack) {
    var s = st(), d = DN.dino(r.id), rank = RANK[d.rarity];
    var burst = '';
    for (var i = 0; i < 10 + rank * 8; i++) {
      var a = Math.random() * 360, dist = 90 + Math.random() * 120 + rank * 20;
      burst += '<i class="rv-p" style="--a:' + a.toFixed(0) + 'deg;--d:' + dist.toFixed(0) + 'px;--c:' + GLOW[d.rarity] + ';animation-delay:' + (Math.random() * 0.2).toFixed(2) + 's"></i>';
    }
    var label = r.isNew ? '<div class="rv-new">NEW!</div>' : '<div class="rv-stack">' + T('stackUp', { n: r.stack }) + '<small>' + T('stackNote', { p: Math.round(DN.CFG.STACK_PCT * 100) }) + '</small></div>';
    var buttons = [];
    var again = pack.price !== null ? s.money >= pack.price : !!s.packs[pack.id];
    if (again) buttons.push({ label: pack.price !== null ? T('pullAgain', { n: num(pack.price) }) : T('openNext'), big: true, fn: function () { closeOverlay(); resetMachine(); pull(pack.id); } });
    if (d.rarity === 'EX') buttons.push({ label: T('share'), cls: 'x', fn: function () { DN.shareOnX(T('shareEx', { name: L(d.name) }) + '\n' + T('shareTags')); } });
    buttons.push({ label: T('close'), fn: function () { closeOverlay(); resetMachine(); busy = false; S.shop(); } });
    overlay(
      '<div class="reveal g' + rank + '" style="--glow:' + GLOW[d.rarity] + '">' +
        '<div class="rv-rays"></div>' + (rank >= 4 ? '<div class="rv-rainbow"></div>' : '') +
        '<div class="rv-rar r-' + d.rarity + '">' + d.rarity + (rank >= 3 ? '!!' : rank >= 2 ? '!' : '') + '</div>' +
        '<div class="rv-flip"><div class="rv-back"></div><div class="rv-front">' + DN.Card.html(d.id, { own: s.owned[d.id], size: 'l' }) + '</div></div>' +
        '<div class="rv-burst">' + burst + '</div>' +
        label +
      '</div>', buttons);
    busy = false;
    if (rank >= 4) { DN.app.sfx.victory(); setTimeout(function () { DN.app.sfx.roarBig(); }, 300); }
    else if (rank >= 3) DN.app.sfx.victory();
    else if (rank >= 2) DN.app.sfx.perfect();
    else DN.app.sfx.good();
  }

  function resetMachine() {
    var m = $('machine'), c = $('mc-card');
    if (m) m.className = 'machine';
    if (c) c.className = 'mc-card';
  }
})(window);
