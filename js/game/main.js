/*
 * DINO DUEL 起動と画面の切りかえ
 * 共通土台（セーブ・日英切替・片手操作・効果音）をここで用意して DN.app にまとめる。
 * 段階1：タイトル → バトル1戦 → 結果（もう一戦／タイトルへ）
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};

  function $(id) { return document.getElementById(id); }

  var store = TB.createStore('dino-duel');
  var i18n = TB.createI18n(DN.TEXT, 'en');
  var sound = TB.createSound(store);
  var sfx = DN.createSfx(sound);
  document.documentElement.lang = i18n.lang;
  document.title = 'DINO DUEL' + (i18n.lang === 'ja' ? '／恐竜カードバトル' : ' — Dino Card Battle');

  // セーブ（段階1は対戦成績と相手の強さだけ。段階2で持ち物・重ね数・レベル・賞金・大会の進み具合を足す）
  var SAVE_VER = 1;
  var save = store.get('save', null);
  if (!save || save.v !== SAVE_VER) save = { v: SAVE_VER, wins: 0, losses: 0, level: 0 };
  function commit() { store.set('save', save); }

  var TEAM = ['tyranno', 'triceratops', 'pterano'];

  DN.app = { store: store, i18n: i18n, sound: sound, sfx: sfx, save: save };

  function show(id) {
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.toggle('active', s.id === id); });
  }

  function applyText(root) {
    root.querySelectorAll('[data-t]').forEach(function (e) { e.textContent = i18n.t(e.dataset.t); });
  }

  // ---- タイトル ----
  function buildTitle() {
    applyText($('title'));
    $('t-dinos').innerHTML = TEAM.map(function (id) { return '<div>' + DN.art.svg(DN.dino(id)) + '</div>'; }).join('');
    var row = $('lv-row');
    row.innerHTML = '';
    DN.CFG.AI_LEVELS.forEach(function (lv, i) {
      var b = document.createElement('button');
      b.textContent = i18n.t('lv_' + lv.key);
      b.className = i === save.level ? 'on' : '';
      b.addEventListener('click', function () {
        save.level = i; commit(); sfx.tap();
        row.querySelectorAll('button').forEach(function (x, k) { x.className = k === i ? 'on' : ''; });
      });
      row.appendChild(b);
    });
    updateSoundBtn();
  }
  function updateSoundBtn() { $('btn-sound').textContent = i18n.t(sound.muted ? 'soundOff' : 'soundOn'); }

  DN.app.showTitle = function () {
    DN.BattleView.stop();
    show('title');
    updateSoundBtn();
  };

  // ---- バトル ----
  function pickFoes() {
    var pool = DN.DINOS.map(function (d) { return d.id; }).filter(function (id) { return TEAM.indexOf(id) < 0; });
    var out = [];
    while (out.length < 3) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    return out;
  }
  function startBattle() {
    show('battle');
    DN.BattleView.start({
      team: TEAM, foes: pickFoes(), level: save.level,
      onEnd: function (won) { if (won) save.wins++; else save.losses++; commit(); },
      onAgain: startBattle
    });
  }

  $('btn-start').addEventListener('click', function () { sfx.go(); startBattle(); });
  $('btn-sound').addEventListener('click', function () { sound.toggle(); sfx.tap(); updateSoundBtn(); });

  // タイミングのタップ：画面のどこを押しても（PC はクリック・スペースキーでも）
  var input = TB.createInput($('tapzone'));
  input.onPress = function () { DN.BattleView.press(); };

  buildTitle();
  show('title');
})(window);
