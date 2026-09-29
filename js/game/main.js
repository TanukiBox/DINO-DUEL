/*
 * DINO DUEL 起動と画面の切りかえ
 * 共通土台（セーブ・日英切替・片手操作・効果音）をここで用意して DN.app にまとめる。
 * 画面：タイトル → ホーム（大会・カードパック・チーム・図鑑） → 大会 → バトル → 試合の結果
 *
 * デバッグモード（プレイ動画の撮影用）：URL の最後に ?debug=1
 *   全カード解放・賞金最大・大会を自由に選べる。ふつうのセーブとは別の場所に保存する（ふつうのセーブは変わらない）。
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};

  function $(id) { return document.getElementById(id); }

  var debug = /[?&]debug=1(&|$)/.test(global.location.search);
  var store = TB.createStore(debug ? 'dino-duel-debug' : 'dino-duel');
  var i18n = TB.createI18n(DN.TEXT, 'en');
  var sound = TB.createSound(TB.createStore('dino-duel'));   // 音のオンオフは共通
  var sfx = DN.createSfx(sound);
  var bgm = DN.createBgm(sound, TB.createStore('dino-duel'));   // BGM のオンオフも共通
  document.documentElement.lang = i18n.lang;
  document.title = 'DINO DUEL' + (i18n.lang === 'ja' ? '／恐竜カードバトル' : ' — Dino Card Battle');

  // ---- セーブ（持っている恐竜・重ね数・レベル・賞金・大会の進み具合）----
  var state = DN.Progress.fix(store.get('progress', null));
  if (debug) {
    DN.DINOS.forEach(function (d) { if (!state.owned[d.id]) state.owned[d.id] = { stack: 0, lv: 1, xp: 0 }; });
    state.money = 9999999;
    state.debug = true;
  }
  function save() { store.set('progress', state); }
  save();

  var app = DN.app = {
    store: store, i18n: i18n, sound: sound, sfx: sfx, bgm: bgm, debug: debug,
    get state() { return state; },
    save: save,
    returnTo: 'home'
  };

  function show(id) {
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.toggle('active', s.id === 'scr-' + id); });
  }

  /** 画面を切りかえる（name = title / home / tour / team / dex / shop） */
  app.go = function (name, args) {
    if (DN.closeOverlay) DN.closeOverlay();
    DN.BattleView.stop();
    bgm.forScreen(name);
    if (name === 'title') { buildTitle(); show('title'); return; }
    if (name !== 'team') app.returnTo = name;
    DN.Screens[name](args);
    show(name);
  };
  app.showTitle = function () { app.go('title'); };

  /** 大会の今の試合を始める */
  app.startMatch = function () {
    var s = state, run = s.run, TT = DN.TOURNAMENTS[run.t];
    var before = {};
    s.team.forEach(function (id) { before[id] = { lv: s.owned[id].lv, xp: s.owned[id].xp }; });
    var t = run.t, matchNo = run.m + 1;
    show('battle');
    bgm.forBattle(t, matchNo === TT.matches.length);   // 大会の強さ・決勝で曲が変わる
    DN.BattleView.start({
      team: DN.Progress.teamSpecs(s),
      foes: DN.Progress.opponent(s),
      level: TT.ai,
      label: i18n.t('matchLabel', { name: i18n.t('lv_' + TT.key), n: matchNo, m: TT.matches.length }),
      onEnd: function (won, turns) {
        var r = DN.Progress.finishMatch(s, won);
        save();
        bgm.play(r.champion ? 'champion' : won ? 'win' : 'lose', true);   // 短い曲のあと、結果の曲へ
        DN.Screens.result(r, before, t, turns);
        show('result');
      }
    });
  };

  // ---- タイトル ----
  function buildTitle() {
    var t = $('scr-title');
    t.querySelectorAll('[data-t]').forEach(function (e) { e.textContent = i18n.t(e.dataset.t); });
    $('t-dinos').innerHTML = state.team.map(function (id) { return '<div>' + DN.art.img(DN.dino(id)) + '</div>'; }).join('');
    $('btn-sound').textContent = i18n.t(sound.muted ? 'soundOff' : 'soundOn');
    $('btn-bgm').textContent = i18n.t(bgm.on ? 'bgmOn' : 'bgmOff');
    $('t-debug').style.display = debug ? '' : 'none';
  }
  $('btn-start').addEventListener('click', function () { sfx.go(); app.go('home'); });
  $('btn-sound').addEventListener('click', function () { sound.toggle(); sfx.tap(); $('btn-sound').textContent = i18n.t(sound.muted ? 'soundOff' : 'soundOn'); });
  $('btn-bgm').addEventListener('click', function () { bgm.toggle(); sfx.tap(); $('btn-bgm').textContent = i18n.t(bgm.on ? 'bgmOn' : 'bgmOff'); });

  // タイミングのタップ：画面のどこを押しても（PC はクリック・スペースキーでも）
  var input = TB.createInput($('tapzone'));
  input.onPress = function (e) {
    var r = $('app').getBoundingClientRect(), z = $('tapzone').getBoundingClientRect();
    DN.BattleView.press(e && e.x !== null ? { x: e.x + z.left - r.left, y: e.y + z.top - r.top } : null);
  };

  // 絵は、はじめて使うときに作ると少し時間がかかるので、タイトルが出たあとの空き時間に1体ずつ用意しておく
  var idle = global.requestIdleCallback || function (f) { return setTimeout(f, 40); };
  var warmList = DN.Progress.ownedIds(state).concat(DN.DINOS.map(function (d) { return d.id; }));
  function warm(i) {
    if (i >= warmList.length) return;
    var d = DN.dino(warmList[i]);
    DN.art.url(d); DN.art.url(d, { crop: true }); if (!state.owned[d.id]) DN.art.url(d, { silhouette: true });
    idle(function () { warm(i + 1); });
  }
  setTimeout(function () { warm(0); }, 600);

  buildTitle();
  show('title');
  bgm.play('title');   // 音は最初に画面をさわったときから鳴る（スマホのきまり）
})(window);
