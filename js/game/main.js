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
  var common = TB.createStore('dino-duel');                   // 設定はデバッグでも共通
  var sound = TB.createSound(common);   // 音のオンオフ
  var sfx = DN.createSfx(sound);
  var bgm = DN.createBgm(sound, common);   // BGM のオンオフ
  // 設定：バトルの速さ（1 / 2）・ふるえ・タイミングのずれ（ミリ秒。タップが遅れる人はプラス）
  var prefs = common.get('prefs', null) || {};
  if (prefs.speed !== 2) prefs.speed = 1;
  if (typeof prefs.vibe !== 'boolean') prefs.vibe = true;
  if (typeof prefs.tapOffset !== 'number') prefs.tapOffset = 0;
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
    store: store, i18n: i18n, sound: sound, sfx: sfx, bgm: bgm, debug: debug, prefs: prefs,
    get state() { return state; },
    save: save,
    savePrefs: function () { common.set('prefs', prefs); },
    /** 引き継ぎコードで読みこんだセーブに入れかえる */
    replaceState: function (s) { state = s; save(); },
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
  app.onSettingsClosed = function () {
    var cur = document.querySelector('.screen.active');
    if (cur && cur.id === 'scr-home') DN.Screens.home();
    if (cur && cur.id === 'scr-title') buildTitle();
  };

  /** 練習試合（優勝した大会の相手と1戦だけ） */
  app.startPractice = function (t) {
    DN.Progress.startPractice(state, t);
    save();
    app.startMatch();
  };

  /** 大会の今の試合を始める */
  app.startMatch = function () {
    var s = state, run = s.run, TT = DN.TOURNAMENTS[run.t];
    var before = {};
    s.team.forEach(function (id) { before[id] = { lv: s.owned[id].lv, xp: s.owned[id].xp }; });
    var t = run.t, matchNo = run.m + 1, practice = !!run.practice;
    var isFinal = !practice && matchNo === TT.matches.length;
    var tutorial = !s.tut && t === 0 && !practice;
    show('battle');
    bgm.forBattle(t, isFinal);   // 大会の強さ・決勝で曲が変わる
    DN.BattleView.start({
      team: DN.Progress.teamSpecs(s),
      foes: DN.Progress.opponent(s),
      level: TT.ai,
      arena: t,                  // 大会ごとの背景
      intro: practice ? null : isFinal ? 'final' : (t >= 3 && run.m === 0 ? 'boss' : null),   // 相手が1体ずつ登場する演出
      tutorial: tutorial,
      label: practice ? i18n.t('practiceLabel', { name: i18n.t('lv_' + TT.key) }) : i18n.t('matchLabel', { name: i18n.t('lv_' + TT.key), n: matchNo, m: TT.matches.length }),
      onEnd: function (won, turns, info) {
        info = info || {};
        // バトルの記録（実績に使う）
        s.stats.perfects += info.perfects || 0;
        s.stats.bestChain = Math.max(s.stats.bestChain, info.bestChain || 0);
        if (won && info.combo) s.stats.comboWins++;
        if (tutorial) s.tut = true;
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
  if (DN.Pix) DN.Pix.preload();   // ドット絵（恐竜とエフェクト）を先に読みこむ

  buildTitle();
  show('title');
  bgm.play('title');   // 音は最初に画面をさわったときから鳴る（スマホのきまり）

  // ホーム画面に追加したとき、電波がなくても遊べるように（手元の確認用サーバーでは使わない）
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    global.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () { /* noop */ }); });
  }
})(window);
