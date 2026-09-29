/*
 * DINO DUEL 画面（ホーム・大会・試合の結果・チーム編成・図鑑）
 * どの画面も「上半分 = 見るところ」「下半分 = さわるところ」（片手で遊べるように）。
 * カードパックの画面は shop.js、バトルは battle-view.js。
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
  function on(root, sel, fn) { root.querySelectorAll(sel).forEach(function (el) { el.addEventListener('click', function (e) { DN.app.sfx.tap(); fn(el, e); }); }); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  var ICON = {
    coin: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8.5" fill="#ffd23a" stroke="#2b1b12" stroke-width="2"/><circle cx="10" cy="10" r="5" fill="none" stroke="#c88a00" stroke-width="1.6"/><path d="M10 6.6 V13.4" stroke="#c88a00" stroke-width="1.8" stroke-linecap="round"/></svg>',
    trophy: '<svg viewBox="0 0 24 24"><path d="M6 3 H18 V8 C18 12 15 14 12 14 C9 14 6 12 6 8 Z" fill="#ffd23a" stroke="#2b1b12" stroke-width="1.8" stroke-linejoin="round"/><path d="M6 5 H3 C3 9 5 10 7 10 M18 5 H21 C21 9 19 10 17 10" fill="none" stroke="#2b1b12" stroke-width="1.8"/><path d="M10 14 H14 L15 18 H9 Z M7 18 H17 V21 H7 Z" fill="#e8a818" stroke="#2b1b12" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2" fill="#8a93b8" stroke="#2b1b12" stroke-width="1.8"/><path d="M8 10 V7 A4 4 0 0 1 16 7 V10" fill="none" stroke="#2b1b12" stroke-width="2"/></svg>',
    tour: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M6 3 H18 V8 C18 12 15 14 12 14 C9 14 6 12 6 8 Z"/><path d="M10 14 H14 L15 18 H9 Z M7 18 H17 V21 H7 Z"/><path d="M6 5 H3 C3 9 5 10 7 10 M18 5 H21 C21 9 19 10 17 10" fill="none" stroke="#fff" stroke-width="1.8"/></svg>',
    pack: '<svg viewBox="0 0 24 24" fill="#fff"><rect x="4" y="3" width="12" height="17" rx="2" transform="rotate(-10 10 12)" opacity="0.6"/><rect x="8" y="4" width="12" height="17" rx="2"/><path d="M14 8 L15.2 11 L18 11.4 L15.8 13.2 L16.6 16 L14 14.4 L11.4 16 L12.2 13.2 L10 11.4 L12.8 11 Z" fill="#9a5ae0"/></svg>',
    team: '<svg viewBox="0 0 24 24" fill="#fff"><circle cx="7" cy="9" r="3"/><circle cx="17" cy="9" r="3"/><circle cx="12" cy="7" r="3.4"/><path d="M2 20 C2 15 5 13 7 13 C9 13 10 14 10 14 C10.6 12.8 11.4 12 12 12 C12.6 12 13.4 12.8 14 14 C14 14 15 13 17 13 C19 13 22 15 22 20 Z"/></svg>',
    dex: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M4 4 H11 C12 4 12 5 12 5 V21 C12 21 11 20 10 20 H4 Z M20 4 H13 C12 4 12 5 12 5 V21 C12 21 13 20 14 20 H20 Z"/></svg>'
  };
  DN.ICON = ICON;
  function coinChip() { return '<span class="coin-chip">' + ICON.coin + '<b>' + num(st().money) + '</b></span>'; }

  var S = DN.Screens = {};

  // ======================= ホーム =======================
  S.home = function () {
    var s = st(), el = $('scr-home');
    var next = s.cleared.indexOf(false);
    var owned = DN.Progress.ownedIds(s).length;
    var prizePacks = Object.keys(s.packs).reduce(function (a, k) { return a + s.packs[k]; }, 0);
    el.innerHTML =
      '<div class="scr-top sky home-top">' +
        '<div class="top-bar">' + coinChip() + '<span class="dex-chip">' + ICON.dex + '<b>' + owned + '/' + DN.DINOS.length + '</b></span>' + (DN.app.debug ? '<span class="dbg">DEBUG</span>' : '') + '</div>' +
        '<div class="home-team">' + s.team.map(function (id, i) {
          var o = s.owned[id];
          return '<div class="ht ht' + i + '">' + DN.art.img(DN.dino(id)) + '<span class="ht-lv r-' + DN.dino(id).rarity + '">Lv' + o.lv + (o.stack ? ' +' + o.stack : '') + '</span></div>';
        }).join('') + '</div>' +
        DN.Card.comboChips(s.team) +
      '</div>' +
      '<div class="scr-bot home-menu">' +
        '<button class="tile t-tour" data-go="tour">' + ICON.tour + '<b>' + T('menuTour') + '</b><small>' + (next < 0 ? T('allCleared') : T('nextTour', { name: T('lv_' + DN.TOURNAMENTS[next].key) })) + '</small></button>' +
        '<button class="tile t-shop" data-go="shop">' + ICON.pack + '<b>' + T('menuShop') + '</b><small>' + (prizePacks ? T('prizePacksN', { n: prizePacks }) : T('menuShopSub')) + '</small>' + (prizePacks ? '<i class="badge">' + prizePacks + '</i>' : '') + '</button>' +
        '<button class="tile t-team" data-go="team">' + ICON.team + '<b>' + T('menuTeam') + '</b><small>' + T('menuTeamSub') + '</small></button>' +
        '<button class="tile t-dex" data-go="dex">' + ICON.dex + '<b>' + T('menuDex') + '</b><small>' + owned + ' / ' + DN.DINOS.length + '</small></button>' +
        '<div class="home-foot"><button class="btn small" id="h-title">' + T('toTitle') + '</button>' +
        '<span class="h-snd"><button class="btn small" id="h-snd">' + T(DN.app.sound.muted ? 'soundOff' : 'soundOn') + '</button>' +
        '<button class="btn small" id="h-bgm">' + T(DN.app.bgm.on ? 'bgmOn' : 'bgmOff') + '</button></span></div>' +
      '</div>';
    on(el, '[data-go]', function (b) { DN.app.go(b.dataset.go); });
    on(el, '#h-snd', function (b) { DN.app.sound.toggle(); b.textContent = T(DN.app.sound.muted ? 'soundOff' : 'soundOn'); });
    on(el, '#h-bgm', function (b) { DN.app.bgm.toggle(); b.textContent = T(DN.app.bgm.on ? 'bgmOn' : 'bgmOff'); });
    on(el, '#h-title', function () { DN.app.go('title'); });
  };

  // ======================= 大会 =======================
  var selTour = null;
  function tourStatus(s, i) {
    if (!DN.Progress.unlocked(s, i)) return 'locked';
    if (s.run && s.run.t === i) return 'running';
    return s.cleared[i] ? 'cleared' : 'open';
  }
  function enemyRow(team) {
    return '<div class="enemy-row">' + team.map(function (e) {
      var d = DN.dino(e.id);
      return '<div class="en">' + DN.art.img(d, null, 'flip') + '<span class="r-' + d.rarity + '">Lv' + e.lv + (e.stack ? ' +' + e.stack : '') + '</span><small>' + esc(L(d.name)) + '</small></div>';
    }).join('') + '</div>';
  }
  S.tour = function () {
    var s = st(), el = $('scr-tour');
    if (selTour === null || tourStatus(s, selTour) === 'locked') {
      selTour = s.run ? s.run.t : Math.max(0, s.cleared.indexOf(false) < 0 ? DN.TOURNAMENTS.length - 1 : s.cleared.indexOf(false));
    }
    var i = selTour, TT = DN.TOURNAMENTS[i], status = tourStatus(s, i);
    var m = s.run && s.run.t === i ? s.run.m : 0;
    var dots = TT.matches.map(function (_, k) { return '<i class="' + (k < m ? 'done' : k === m ? 'now' : '') + '">' + (k === TT.matches.length - 1 ? '★' : k + 1) + '</i>'; }).join('');
    var stars = ''; for (var k = 0; k <= TT.ai; k++) stars += '★';
    el.innerHTML =
      '<div class="scr-top tour-top t' + i + '">' +
        '<div class="top-bar"><span class="scr-title">' + T('menuTour') + '</span>' + coinChip() + '</div>' +
        '<div class="tour-plate"><div class="tp-name">' + T('tourName', { name: T('lv_' + TT.key) }) + (s.cleared[i] ? ' <span class="won">' + ICON.trophy + '</span>' : '') + '</div>' +
          '<div class="tp-info"><span>' + T('tourMatches', { n: TT.matches.length }) + '</span><span>' + ICON.coin + T('tourPrize', { n: num(TT.prize) }) + '</span><span class="ai">' + T('tourAi') + ' ' + stars + '</span></div>' +
          '<div class="tp-dots">' + dots + '</div></div>' +
        '<div class="tour-next"><div class="tn-label">' + T('nextOpponent', { n: m + 1 }) + '</div>' + enemyRow(TT.matches[m]) + '</div>' +
      '</div>' +
      '<div class="scr-bot tour-bot">' +
        '<div class="tour-list">' + DN.TOURNAMENTS.map(function (x, k) {
          var stt = tourStatus(s, k);
          return '<button class="tl-row ' + stt + (k === i ? ' sel' : '') + '" data-t="' + k + '"' + (stt === 'locked' ? ' disabled' : '') + '>' +
            '<span class="tl-ic">' + (stt === 'locked' ? ICON.lock : stt === 'cleared' ? ICON.trophy : '<i class="tl-num">' + (k + 1) + '</i>') + '</span>' +
            '<b>' + T('tourName', { name: T('lv_' + x.key) }) + '</b><small>' + T('tst_' + stt) + '</small></button>';
        }).join('') + '</div>' +
        '<div class="row-btns"><button class="btn" id="tr-back">' + T('back') + '</button>' +
        '<button class="btn big" id="tr-go">' + (status === 'running' ? T('continueRun', { n: m + 1 }) : T('challenge')) + '</button></div>' +
      '</div>';
    on(el, '.tl-row', function (b) { selTour = +b.dataset.t; S.tour(); });
    on(el, '#tr-back', function () { DN.app.go('home'); });
    el.querySelector('#tr-go').addEventListener('click', function () {
      DN.app.sfx.go();
      if (!s.run || s.run.t !== i) DN.Progress.startRun(s, i);
      DN.app.save();
      DN.app.startMatch();
    });
  };

  // ======================= 試合の結果 =======================
  /** r = finishMatch の結果、before = 試合前のチームの { id: { lv, xp } }、t = 大会の番号 */
  S.result = function (r, before, t, turns) {
    var s = st(), el = $('scr-result'), TT = DN.TOURNAMENTS[t];
    var head = r.champion ? T('champion', { name: T('tourName', { name: T('lv_' + TT.key) }) }) : r.won ? T('win') : T('lose');
    function pct(lv, xp) { return lv >= DN.CFG.LV_MAX ? 100 : Math.round(xp / DN.Progress.xpNext(lv) * 100); }
    var rows = s.team.map(function (id) {
      var o = s.owned[id], b = before[id], d = DN.dino(id);
      var up = r.levelUps[id] || 0;
      return '<div class="xp-row' + (up ? ' up' : '') + '"><span class="xr-ic">' + DN.art.img(d, { crop: true }) + '</span>' +
        '<span class="xr-name">' + esc(L(d.name)) + '</span>' +
        '<span class="xr-lv">Lv <b>' + b.lv + (up ? ' → ' + o.lv : '') + '</b></span>' +
        '<span class="xr-bar"><i style="width:' + pct(b.lv, b.xp) + '%" data-to="' + pct(o.lv, o.xp) + '"></i></span>' +
        (up ? '<span class="lvup">LEVEL UP!</span>' : '') + '</div>';
    }).join('');
    el.innerHTML =
      '<div class="scr-top result-top ' + (r.champion ? 'champ' : r.won ? 'win' : 'lose') + '">' +
        (r.champion ? '<div class="trophy-big">' + ICON.trophy + '</div>' : '') +
        '<h2>' + head + '</h2>' +
        '<div class="res-line">' + (r.won ? T('turnsWon', { n: turns }) : T('loseKeep')) + '</div>' +
        '<div class="res-gain">' + (r.prize ? '<span class="gain-coin">' + ICON.coin + '+' + num(r.prize) + '</span>' : '') + '<span class="gain-xp">EXP +' + r.xp + '</span></div>' +
        (r.champion ? '<div class="prize-pack">' + ICON.pack + T('gotPack', { name: L(DN.pack(r.pack).name) }) + '</div>' : '') +
        // 戦った3体が地面に立つ（勝つと順番に跳ねる）
        '<div class="res-stage"><div class="res-ground"></div>' + s.team.map(function (id, k) {
          return '<div class="rs-d" style="--k:' + k + '">' + DN.art.img(DN.dino(id)) + '</div>';
        }).join('') + '</div>' +
      '</div>' +
      '<div class="scr-bot result-bot">' +
        '<div class="xp-list">' + rows + '</div>' +
        (r.champion ?
          '<button class="btn big" id="rs-open">' + T('openPrize') + '</button>' +
          '<div class="row-btns"><button class="btn x" id="rs-share">' + T('share') + '</button><button class="btn" id="rs-home">' + T('toHome') + '</button></div>'
        : r.won ?
          '<button class="btn big" id="rs-next">' + T('nextMatch', { n: s.run.m + 1 }) + '</button>' +
          '<div class="row-btns"><button class="btn" id="rs-tour">' + T('pauseRun') + '</button><button class="btn" id="rs-team">' + T('menuTeam') + '</button></div>'
        :
          '<button class="btn big" id="rs-retry">' + T('retryRun') + '</button>' +
          '<div class="row-btns"><button class="btn" id="rs-tour">' + T('chooseTour') + '</button><button class="btn" id="rs-shop">' + T('menuShop') + '</button></div>') +
      '</div>';
    // 経験値のバーをのばす。レベルが上がる恐竜は、いっぱいまでのびたら光って「LEVEL UP!」→ 新しいレベルのバーをのばしなおす
    el.querySelectorAll('.xp-row').forEach(function (row, k) {
      var bar = row.querySelector('.xr-bar i'), to = bar.dataset.to + '%', up = row.classList.contains('up');
      setTimeout(function () { bar.style.width = up ? '100%' : to; }, 400 + k * 250);
      if (!up) return;
      setTimeout(function () {
        row.classList.add('pop'); DN.app.sfx.buff(true);
        bar.style.transition = 'none'; bar.style.width = '0%';
        void bar.offsetWidth;
        bar.style.transition = ''; bar.style.width = to;
      }, 1300 + k * 250);
    });
    on(el, '#rs-next', function () { DN.app.startMatch(); });
    on(el, '#rs-retry', function () { DN.Progress.startRun(s, t); DN.app.save(); DN.app.startMatch(); });
    on(el, '#rs-tour', function () { DN.app.go('tour'); });
    on(el, '#rs-team', function () { DN.app.go('team'); });
    on(el, '#rs-shop', function () { DN.app.go('shop'); });
    on(el, '#rs-home', function () { DN.app.go('home'); });
    on(el, '#rs-open', function () { DN.app.go('shop', { open: r.pack }); });
    on(el, '#rs-share', function () {
      DN.shareOnX(T('shareChamp', { name: T('tourName', { name: T('lv_' + TT.key) }), team: s.team.map(function (id) { return L(DN.dino(id).name); }).join('・') }) + '\n' + T('shareTags'));
    });
  };

  // ======================= チーム編成 =======================
  var slotSel = 0;
  function sortedOwned(s) {
    var order = { EX: 0, SSR: 1, SR: 2, R: 3, N: 4 };
    return DN.Progress.ownedIds(s).sort(function (a, b) {
      var da = DN.dino(a), db = DN.dino(b);
      return order[da.rarity] - order[db.rarity] || DN.Progress.power(s, b) - DN.Progress.power(s, a);
    });
  }
  S.team = function () {
    var s = st(), el = $('scr-team');
    var power = s.team.reduce(function (a, id) { return a + DN.Progress.power(s, id); }, 0);
    el.innerHTML =
      '<div class="scr-top team-top">' +
        '<div class="top-bar"><span class="scr-title">' + T('menuTeam') + '</span><span class="power-chip">' + T('teamPower') + ' <b>' + Math.round(power) + '</b></span></div>' +
        '<div class="team-slots">' + s.team.map(function (id, i) {
          return '<div class="slot-card' + (i === slotSel ? ' sel' : '') + '"><span class="slot-no">' + (i + 1) + '</span>' + DN.Card.html(id, { own: s.owned[id], size: 'm' }) + '</div>';
        }).join('') + '</div>' +
        DN.Card.comboChips(s.team) +
      '</div>' +
      '<div class="scr-bot team-bot">' +
        '<div class="slot-pick"><span>' + T('slotPick') + '</span>' + [0, 1, 2].map(function (i) { return '<button class="sp' + (i === slotSel ? ' on' : '') + '" data-s="' + i + '">' + (i + 1) + '</button>'; }).join('') +
        '<button class="btn small" id="tm-auto">' + T('autoTeam') + '</button></div>' +
        '<div class="card-grid">' + sortedOwned(s).map(function (id) {
          var k = s.team.indexOf(id);
          return '<button class="cg' + (k >= 0 ? ' in' : '') + '" data-id="' + id + '">' + DN.Card.html(id, { own: s.owned[id], size: 's' }) + (k >= 0 ? '<i class="in-no">' + (k + 1) + '</i>' : '') + '</button>';
        }).join('') + '</div>' +
        '<div class="row-btns"><button class="btn" id="tm-back">' + T('back') + '</button></div>' +
      '</div>';
    on(el, '.sp', function (b) { slotSel = +b.dataset.s; S.team(); });
    on(el, '#tm-auto', function () { s.team = DN.Progress.bestTeam(s); DN.app.save(); S.team(); });
    on(el, '#tm-back', function () { DN.app.go(DN.app.returnTo || 'home'); });
    el.querySelectorAll('.cg').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.dataset.id, k = s.team.indexOf(id);
        if (k === slotSel) return;
        if (k >= 0) { s.team[k] = s.team[slotSel]; }   // チームの中で入れかえ
        s.team[slotSel] = id;
        DN.app.sfx.press();
        slotSel = (slotSel + 1) % 3;
        DN.app.save();
        var y = el.querySelector('.card-grid').scrollTop;
        S.team();
        el.querySelector('.card-grid').scrollTop = y;
      });
    });
  };

  // ======================= 図鑑 =======================
  var dexSel = null, dexTab = 'dino';
  S.dex = function () {
    var s = st(), el = $('scr-dex'), owned = DN.Progress.ownedIds(s);
    if (!dexSel) dexSel = owned[0] || DN.DINOS[0].id;
    var grid = dexTab === 'dino'
      ? '<div class="card-grid dex-grid">' + DN.DINOS.map(function (d, i) {
          var own = s.owned[d.id];
          return '<button class="cg' + (d.id === dexSel ? ' sel' : '') + '" data-id="' + d.id + '"><i class="no">' + (i + 1) + '</i>' + DN.Card.html(d.id, { own: own, size: 's', silhouette: !own }) + '</button>';
        }).join('') + '</div>'
      : '<div class="combo-list">' + DN.COMBOS.map(function (c) {
          var ups = Object.keys(c.up).map(function (k) { return T('st_' + k) + '+' + Math.round(c.up[k] * 100) + '%'; }).join(' ');
          return '<div class="cl-row"><b>' + esc(L(c.name)) + '</b><span class="hint">' + T('comboHint') + esc(L(DN.COMBO_HINTS[c.id])) + '</span><small>' + ups + '</small></div>';
        }).join('') + '</div>';
    el.innerHTML =
      '<div class="scr-top dex-top">' +
        '<div class="top-bar"><span class="scr-title">' + T('menuDex') + '</span><span class="dex-chip">' + ICON.dex + '<b>' + owned.length + '/' + DN.DINOS.length + '</b></span></div>' +
        DN.Card.detail(dexSel, s) +
      '</div>' +
      '<div class="scr-bot dex-bot">' +
        '<div class="tabs"><button class="tab' + (dexTab === 'dino' ? ' on' : '') + '" data-tab="dino">' + T('dexTabDino', { n: owned.length, m: DN.DINOS.length }) + '</button>' +
        '<button class="tab' + (dexTab === 'combo' ? ' on' : '') + '" data-tab="combo">' + T('dexTabCombo', { n: DN.COMBOS.length }) + '</button></div>' +
        grid +
        '<div class="row-btns"><button class="btn" id="dx-back">' + T('back') + '</button></div>' +
      '</div>';
    on(el, '.tab', function (b) { dexTab = b.dataset.tab; S.dex(); });
    on(el, '#dx-back', function () { DN.app.go('home'); });
    el.querySelectorAll('.cg').forEach(function (b) {
      b.addEventListener('click', function () {
        dexSel = b.dataset.id;
        DN.app.sfx.pick();
        var y = el.querySelector('.card-grid').scrollTop;
        S.dex();
        el.querySelector('.card-grid').scrollTop = y;
      });
    });
  };
  S.dexSelect = function (id) { dexSel = id; dexTab = 'dino'; };
})(window);
