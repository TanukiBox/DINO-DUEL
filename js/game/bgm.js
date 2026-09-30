/*
 * DINO DUEL BGM（音楽ファイルは使わず、ブラウザの中で演奏する。曲はすべてオリジナル）
 * ・曲は「16分音符ずつの升目」に音名を並べた楽譜で書く（DUST DASH と同じ書き方）
 *     'A4'  … その升目でラ（4オクターブ目）を鳴らす
 *     '-'   … 前の音をのばす
 *     '.'   … 休み
 *     'A3+C4+E4' … 和音
 *   ドラムは k（バスドラム）・s（スネア）・h（ハイハット）・t（太鼓）・c（シンバル）の組み合わせ（'kh' なら同時）
 * ・1小節 = 16升。| は小節の区切り（見やすくするためだけ）
 *
 * 曲の一覧（場面）
 *   title   タイトル        「恐竜の大地」     ニ短調・太鼓とラッパの勇ましい曲
 *   home    ホーム          「キャンプの朝」   ヘ長調・木琴と笛ののんびりした曲
 *   tour    大会をえらぶ    「大会への道」     ト長調・行進曲
 *   collect チーム・図鑑    「化石の図鑑」     イ短調・オルゴール
 *   shop    カードパック    「パック・アーケード」ハ長調・ピコピコのゲームセンター
 *   battle  ビギナー・ノービスのバトル 「牙と牙」ホ短調・速いロック
 *   battle2 アドバンスのバトル   「大地を揺らせ」ニ短調・太鼓の重い曲
 *   final   決勝（大会の最後の試合）「決勝のゴング」イ短調・いちばん熱い曲
 *   boss    マスター・レジェンドのバトル「覇者の咆哮」ハ短調・速くて重い曲
 *   result  試合の結果      「つぎの一歩」     ハ長調・明るくやさしい曲
 *   win / champion / lose  結果のはじめに1回だけ鳴る短い曲（終わると result へ）
 *
 *   var bgm = DN.createBgm(sound, store);
 *   bgm.play('title');     // 同じ曲がもう流れていたら、そのまま（2つ目に true で頭から）
 *   bgm.stop(0.8);         // 0.8秒でフェードアウト
 *   bgm.duck(2.5);         // 2.5秒だけ小さくする（大きな効果音を聞かせたいとき）
 *   bgm.toggle();          // BGM のオンオフ（効果音は別。セーブに覚える）
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};

  var NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function freq(name) {
    var m = /^([A-G])(#|b)?(-?\d)$/.exec(name);
    if (!m) return null;
    var n = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (parseInt(m[3], 10) + 1) * 12;
    return 440 * Math.pow(2, (n - 69) / 12);
  }

  /** 楽譜の文字列を「升目ごとの出来事」の配列にする */
  function parse(score) {
    var tok = score.replace(/\|/g, ' ').trim().split(/\s+/);
    var out = [];
    for (var i = 0; i < tok.length; i++) {
      var t = tok[i];
      if (t === '-' || t === '.') { out.push(null); continue; }
      var len = 1;
      while (tok[i + len] === '-') len++;
      if (/^[kshtc]+$/.test(t)) { out.push({ drum: t, len: 1 }); continue; }
      out.push({ notes: t.split('+').map(freq), len: len, src: t });
    }
    return out;
  }

  // ---------------- 楽譜を書く補助 ----------------
  function rep(s, n) { var a = []; for (var i = 0; i < n; i++) a.push(s); return a.join(' | '); }
  function bars(list) { return list.join(' | '); }
  var SEMI = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  var ROOT = { C: 0, 'C#': 1, Db: 1, D: 2, Eb: 3, E: 4, F: 5, 'F#': 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 };
  /** 和音の音名。chord('Dm', 3) → 'D3+F3+A3'（m = 短調、ないと長調） */
  function tones(name, oct) {
    var m = /^([A-G][b#]?)(m?)$/.exec(name), r = ROOT[m[1]] + (oct + 1) * 12;
    return [0, m[2] ? 3 : 4, 7].map(function (iv) { var n = r + iv; return SEMI[n % 12] + (Math.floor(n / 12) - 1); });
  }
  function chord(name, oct) { return tones(name, oct).join('+'); }
  /** 1小節ずっと鳴らす和音 */
  function hold(ch) { return ch + ' - - - - - - - - - - - - - - -'; }
  /** 8分の裏で和音をきざむ */
  function stab(ch) { return ['.', '.', ch, '.', '.', '.', ch, '.', '.', '.', ch, '.', '.', '.', ch, '.'].join(' '); }
  /** 3・3・2 のリズムで和音 */
  function push(ch) { return [ch, '.', '.', ch, '.', '.', ch, '.', '.', '.', ch, '.', '.', ch, '.', '.'].join(' '); }
  /** 和音を上下するアルペジオ（8分） */
  function arp(name, oct) { var t = tones(name, oct), hi = tones(name, oct + 1)[0]; return [t[0], '.', t[1], '.', t[2], '.', hi, '.', t[2], '.', t[1], '.', t[0], '.', t[1], '.'].join(' '); }
  /** ピコピコの16分アルペジオ */
  function blip(name, oct) { var t = tones(name, oct), hi = tones(name, oct + 1)[0]; var s = [t[0], t[1], t[2], hi]; return [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1, 0, 1, 2, 3].map(function (i) { return s[i]; }).join(' '); }
  // ベースの形（r = 根音、o = 1オクターブ上）
  function b332(r, o) { return [r, '-', '-', r, '-', '-', r, '-', o, '-', '-', r, '-', '-', r, '-'].join(' '); }
  function b8(r, o) { return [r, '.', r, '.', o, '.', r, '.', r, '.', r, '.', o, '.', r, '.'].join(' '); }
  function march(r, f) { return [r, '.', '.', '.', f, '.', '.', '.', r, '.', '.', '.', f, '.', '.', '.'].join(' '); }
  function halves(r, f) { return r + ' - - - - - - - ' + f + ' - - - - - - -'; }
  function bounce(r, o) { return [r, '.', o, '.', r, '.', o, '.', r, '.', o, '.', r, '.', o, '.'].join(' '); }
  /** 和音の並びからパート全体を作る */
  function each(list, fn) { return bars(list.map(fn)); }
  /** 根音（ベース用）の音名 */
  function rootOf(name, oct) { return tones(name, oct)[0]; }

  // ---------------- 曲 ----------------
  var TITLE_CH = ['Dm', 'Bb', 'C', 'Dm', 'Dm', 'Bb', 'Gm', 'A'];
  var HOME_CH = ['F', 'C', 'Dm', 'Bb', 'F', 'C', 'Bb', 'C'];
  var TOUR_CH = ['G', 'Em', 'C', 'D', 'G', 'Em', 'Am', 'D'];
  var COLL_CH = ['Am', 'F', 'C', 'G', 'Am', 'F', 'Dm', 'E'];
  var SHOP_CH = ['C', 'Am', 'F', 'G', 'C', 'Am', 'Dm', 'G'];
  var BAT_CH = ['Em', 'C', 'D', 'B', 'Em', 'C', 'Am', 'B', 'C', 'D', 'Em', 'Em', 'C', 'D', 'B', 'B'];
  var BAT2_CH = ['Dm', 'Dm', 'Bb', 'C', 'Dm', 'Dm', 'Bb', 'A', 'Gm', 'Gm', 'Dm', 'Dm', 'Bb', 'C', 'A', 'A'];
  var FIN_CH = ['Am', 'F', 'G', 'E', 'Am', 'F', 'Dm', 'E', 'F', 'G', 'Am', 'Am', 'F', 'G', 'E', 'E'];
  var BOSS_CH = ['Cm', 'Ab', 'Bb', 'G', 'Cm', 'Ab', 'Fm', 'G', 'Ab', 'Bb', 'Cm', 'Cm', 'Ab', 'Bb', 'G', 'G'];
  var RES_CH = ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G'];

  // バトル共通のドラム：ふつうの小節と、区切りの「おかず」
  var ROCK = 'kh . h . sh . h . kh . kh . sh . h .';
  var ROCK_FILL = 'kh . h . sh . h . s . s s t . t t';

  var TRACKS = {
    // ---- タイトル「恐竜の大地」：太鼓が鳴りひびく勇ましい曲 ----
    title: {
      bpm: 100, vol: 1,
      parts: [
        { inst: 'bass', score: each(TITLE_CH, function (c) { var o = c === 'Gm' || c === 'A' ? 2 : c === 'Bb' ? 1 : 2; return b332(rootOf(c, o), rootOf(c, o + 1)); }) },
        { inst: 'pad', score: each(TITLE_CH, function (c) { return hold(chord(c, 3)); }) },
        { inst: 'brass', score: bars([
          'A4 - - - - - D5 - - - - - E5 - F5 -', 'F5 - - - E5 - D5 - - - - - . . . .',
          'E5 - - - C5 - - - G4 - - - C5 - E5 -', 'D5 - - - - - - - - - - - . . . .',
          'A4 - - - - - D5 - - - - - E5 - F5 -', 'G5 - - - F5 - D5 - - - - - Bb4 - D5 -',
          'G5 - - - F5 - E5 - D5 - - - Bb4 - - -', 'C#5 - - - - - - - E5 - - - A4 - - -']) },
        { inst: 'drum', score: bars(['kc . . t . . kt . s . . t . . t t', rep('k . . t . . kt . s . . t . . t .', 6), 'k . . t . . kt . s . t . t t t t']) }
      ]
    },
    // ---- ホーム「キャンプの朝」：木琴と笛。のんびり ----
    home: {
      bpm: 104, vol: 0.9,
      parts: [
        { inst: 'bass', score: each(HOME_CH, function (c) { return halves(rootOf(c, 2), tones(c, 2)[2]); }) },
        { inst: 'marimba', score: each(HOME_CH, function (c) { return arp(c, 4); }) },
        { inst: 'soft', score: bars([
          'C5 - - - A4 - - - F4 - G4 - A4 - - -', 'G4 - - - E4 - - - C4 - D4 - E4 - - -',
          'F4 - - - A4 - - - D5 - - - C5 - A4 -', 'Bb4 - - - - - - - F4 - - - - - - -',
          'C5 - - - A4 - C5 - F5 - - - E5 - D5 -', 'E5 - - - C5 - - - G4 - - - A4 - Bb4 -',
          'D5 - - - Bb4 - - - F4 - G4 - Bb4 - D5 -', 'C5 - - - - - - - E4 - - - G4 - - -']) },
        { inst: 'pad', score: each(HOME_CH, function (c) { return hold(chord(c, 3)); }) },
        { inst: 'drum', score: rep('k . h . h . h . s . h . h . h .', 8) }
      ]
    },
    // ---- 大会をえらぶ「大会への道」：行進曲 ----
    tour: {
      bpm: 118, vol: 0.9,
      parts: [
        { inst: 'bass', score: each(TOUR_CH, function (c) { return march(rootOf(c, 2), tones(c, 2)[2]); }) },
        { inst: 'chord', score: each(TOUR_CH, function (c) { return stab(chord(c, 4)); }) },
        { inst: 'brass', score: bars([
          'D5 - - - B4 - D5 - G5 - - - - - D5 -', 'E5 - - - B4 - - - G4 - - - B4 - - -',
          'C5 - - - E5 - G5 - E5 - - - C5 - - -', 'D5 - - - - - - - F#4 - - - A4 - - -',
          'D5 - - - B4 - D5 - G5 - - - A5 - B5 -', 'B5 - - - G5 - E5 - G5 - - - - - - -',
          'A5 - - - E5 - C5 - A4 - B4 - C5 - D5 -', 'D5 - - - - - - - F#5 - - - A5 - - -']) },
        { inst: 'pad', score: each(TOUR_CH, function (c) { return hold(chord(c, 3)); }) },
        { inst: 'drum', score: bars([rep('k . . . s . . s k . k . s . . .', 7), 'k . . . s . s s s . s s t t t t']) }
      ]
    },
    // ---- チーム・図鑑「化石の図鑑」：オルゴール。静か ----
    collect: {
      bpm: 84, vol: 0.85,
      parts: [
        { inst: 'bass', score: each(COLL_CH, function (c) { return halves(rootOf(c, 2), tones(c, 2)[2]); }) },
        { inst: 'bell', score: bars([
          'E5 - - - A5 - - - C6 - - - B5 - A5 -', 'A5 - - - - - - - F5 - - - G5 - A5 -',
          'G5 - - - E5 - - - C5 - - - D5 - E5 -', 'D5 - - - - - - - B4 - - - - - - -',
          'E5 - - - A5 - - - C6 - - - E6 - D6 -', 'C6 - - - A5 - - - F5 - - - A5 - C6 -',
          'D6 - - - C6 - A5 - F5 - - - A5 - - -', 'G#5 - - - - - - - B5 - - - E5 - - -']) },
        { inst: 'arp', score: each(COLL_CH, function (c) { return arp(c, 3); }) },
        { inst: 'pad', score: each(COLL_CH, function (c) { return hold(chord(c, 3)); }) },
        { inst: 'drum', score: rep('k . . . . . h . . . h . . . h .', 8) }
      ]
    },
    // ---- カードパック「パック・アーケード」：ピコピコ。ゲームセンターの楽しい曲 ----
    shop: {
      bpm: 136, vol: 0.85,
      parts: [
        { inst: 'chipbass', score: each(SHOP_CH, function (c) { return bounce(rootOf(c, 2), rootOf(c, 3)); }) },
        { inst: 'blip', score: each(SHOP_CH, function (c) { return blip(c, 4); }) },
        { inst: 'chip', score: bars([
          'E5 . G5 . C6 - - - G5 . E5 . G5 - - -', 'A5 . G5 . E5 - - - C5 . E5 . A5 - - -',
          'F5 . A5 . C6 - - - A5 . F5 . A5 - C6 -', 'B5 - - - A5 - G5 - D5 - - - G5 - - -',
          'E5 . G5 . C6 - - - G5 . E5 . G5 - - -', 'A5 . C6 . E6 - - - C6 . A5 . E5 - - -',
          'F5 - E5 - D5 - F5 - A5 - - - F5 - D5 -', 'G5 - - - B5 - - - D6 - - - B5 - - -']) },
        { inst: 'drum', score: bars([rep('k . h . s . h . k k h . s . h h', 7), 'k . h . s . h . s s s s s . c .']) }
      ]
    },
    // ---- バトル「牙と牙」（ビギナー・ノービス）：速いロック ----
    battle: {
      bpm: 150, vol: 0.8,
      parts: [
        { inst: 'bass', score: each(BAT_CH, function (c) { return b8(rootOf(c, 2), rootOf(c, 3)); }) },
        { inst: 'chord', score: each(BAT_CH, function (c) { return stab(chord(c, 4)); }) },
        { inst: 'pad', score: each(BAT_CH, function (c) { return hold(chord(c, 3)); }) },
        { inst: 'lead', score: bars([
          'E5 - - - B4 - E5 - G5 - - - F#5 - E5 -', 'E5 - - - C5 - E5 - G5 - - - A5 - G5 -',
          'F#5 - - - D5 - F#5 - A5 - - - G5 - F#5 -', 'F#5 - - - - - D#5 - B4 - - - - - - -',
          'E5 - - - B4 - E5 - G5 - - - B5 - - -', 'C6 - - - B5 - G5 - E5 - - - G5 - C6 -',
          'B5 - - - A5 - G5 - F#5 - - - E5 - F#5 -', 'D#5 - - - - - - - F#5 - - - B5 - - -',
          'G5 - - - - - E5 - C5 - - - E5 - G5 -', 'A5 - - - - - F#5 - D5 - - - F#5 - A5 -',
          'B5 - - - - - G5 - E5 - F#5 - G5 - A5 -', 'B5 - - - - - - - E6 - - - D6 - B5 -',
          'C6 - - - B5 - A5 - G5 - - - E5 - G5 -', 'A5 - - - G5 - F#5 - D5 - - - F#5 - A5 -',
          'B5 - - - - - A5 - F#5 - - - D#5 - - -', 'F#5 - - - D#5 - - - B4 - - - D#5 - F#5 -']) },
        { inst: 'drum', score: bars([rep(ROCK, 7), ROCK_FILL, rep(ROCK, 7), ROCK_FILL]) }
      ]
    },
    // ---- バトル「大地を揺らせ」（アドバンス）：太鼓の重い曲 ----
    battle2: {
      bpm: 144, vol: 0.8,
      parts: [
        { inst: 'bass', score: each(BAT2_CH, function (c) { var o = c === 'Bb' ? 1 : 2; return b8(rootOf(c, o), rootOf(c, o + 1)); }) },
        { inst: 'chord', score: each(BAT2_CH, function (c) { return push(chord(c, 4)); }) },
        { inst: 'pad', score: each(BAT2_CH, function (c) { return hold(chord(c, 3)); }) },
        { inst: 'brass', score: bars([
          'D5 - - - - - D5 - Eb5 - - - D5 - - -', 'C5 - - - A4 - - - D5 - - - - - - -',
          'F5 - - - - - D5 - Bb4 - - - D5 - F5 -', 'E5 - - - - - C5 - G4 - - - C5 - E5 -',
          'D5 - - - - - D5 - Eb5 - - - D5 - F5 -', 'A5 - - - G5 - F5 - E5 - - - D5 - - -',
          'D5 - - - F5 - Bb5 - A5 - - - F5 - D5 -', 'C#5 - - - - - - - E5 - - - A5 - - -',
          'G5 - - - - - Bb5 - D6 - - - C6 - Bb5 -', 'A5 - - - G5 - - - D5 - - - G5 - - -',
          'F5 - - - - - A5 - D6 - - - C6 - A5 -', 'F5 - - - E5 - - - D5 - - - - - - -',
          'D5 - - - F5 - - - Bb5 - - - A5 - G5 -', 'G5 - - - E5 - - - C6 - - - Bb5 - G5 -',
          'A5 - - - - - - - G5 - F5 - E5 - - -', 'C#5 - - - - - - - E5 - - - A4 - - -']) },
        { inst: 'drum', score: bars([rep('kt . . k s . t . kt . k . s . t t', 7), 'kt . . k s . t . t t t . t t t t', rep('kt . . k s . t . kt . k . s . t t', 7), 'kt . s . s . s s t t t t t t c .']) }
      ]
    },
    // ---- 決勝「決勝のゴング」（大会の最後の試合）：いちばん熱い曲 ----
    final: {
      bpm: 156, vol: 0.8,
      parts: [
        { inst: 'bass', score: each(FIN_CH, function (c) { return b8(rootOf(c, 2), rootOf(c, 3)); }) },
        { inst: 'chord', score: each(FIN_CH, function (c) { return stab(chord(c, 4)); }) },
        { inst: 'pad', score: each(FIN_CH, function (c) { return hold(chord(c, 3)); }) },
        { inst: 'lead', score: bars([
          'A4 - - - C5 - E5 - A5 - - - G5 - E5 -', 'F5 - - - - - C5 - A4 - - - C5 - F5 -',
          'G5 - - - - - D5 - B4 - - - D5 - G5 -', 'G#5 - - - - - - - E5 - - - B4 - - -',
          'A5 - - - B5 - C6 - B5 - A5 - E5 - - -', 'F5 - - - A5 - C6 - A5 - - - F5 - - -',
          'D5 - - - F5 - A5 - D6 - - - C6 - A5 -', 'B5 - - - - - - - G#5 - - - E5 - - -',
          'C6 - - - - - A5 - F5 - - - A5 - C6 -', 'D6 - - - - - B5 - G5 - - - B5 - D6 -',
          'E6 - - - - - C6 - A5 - - - C6 - E6 -', 'E6 - - - D6 - C6 - B5 - - - A5 - - -',
          'A5 - - - C6 - - - F5 - - - A5 - - -', 'B5 - - - D6 - - - G5 - - - B5 - - -',
          'G#5 - - - B5 - - - E6 - - - D6 - B5 -', 'G#5 - - - - - - - E5 - - - G#5 - B5 -']) },
        { inst: 'drum', score: bars(['kc . h k sh . h . kh k h . sh . h h', rep('kh . h k sh . h . kh k h . sh . h h', 6), 'kh . h k sh . h . s s s . t t t t',
          'kc . h k sh . h . kh k h . sh . h h', rep('kh . h k sh . h . kh k h . sh . h h', 6), 's . s s s . s s t t t t t t c .']) }
      ]
    },
    // ---- マスター・レジェンド「覇者の咆哮」：速くて重い曲 ----
    boss: {
      bpm: 164, vol: 0.8,
      parts: [
        { inst: 'bass', score: each(BOSS_CH, function (c) { return b8(rootOf(c, 2), rootOf(c, 3)); }) },
        { inst: 'chord', score: each(BOSS_CH, function (c) { return push(chord(c, 4)); }) },
        { inst: 'pad', score: each(BOSS_CH, function (c) { return hold(chord(c, 3)); }) },
        { inst: 'lead', score: bars([
          'C5 - - - G4 - C5 - Eb5 - - - D5 - C5 -', 'Eb5 - - - C5 - Eb5 - Ab5 - - - G5 - F5 -',
          'F5 - - - D5 - F5 - Bb5 - - - Ab5 - G5 -', 'G5 - - - - - - - B4 - - - D5 - - -',
          'C6 - - - - - G5 - Eb5 - - - G5 - C6 -', 'Eb6 - - - D6 - C6 - Ab5 - - - C6 - Eb6 -',
          'F6 - - - Eb6 - C6 - Ab5 - - - F5 - Ab5 -', 'G5 - - - - - - - B5 - - - D6 - - -',
          'C6 - - - - - Ab5 - Eb5 - - - Ab5 - C6 -', 'D6 - - - - - Bb5 - F5 - - - Bb5 - D6 -',
          'Eb6 - - - D6 - C6 - G5 - - - C6 - Eb6 -', 'G6 - - - - - - - F6 - Eb6 - D6 - C6 -',
          'C6 - - - Eb6 - - - Ab5 - - - C6 - - -', 'D6 - - - F6 - - - Bb5 - - - D6 - - -',
          'B5 - - - D6 - - - G6 - - - F6 - D6 -', 'B5 - - - - - - - G5 - - - B5 - D6 -']) },
        { inst: 'drum', score: bars(['kc . h k sh . h k kh . h k sh k h .', rep('kh . h k sh . h k kh . h k sh k h .', 6), 'kh . h k sh . h k t t t t t t t t',
          'kc . h k sh . h k kh . h k sh k h .', rep('kh . h k sh . h k kh . h k sh k h .', 6), 's s s s t t t t s s s s t t c .']) }
      ]
    },
    // ---- 試合の結果「つぎの一歩」：明るくやさしい ----
    result: {
      bpm: 96, vol: 0.85,
      parts: [
        { inst: 'bass', score: each(RES_CH, function (c) { return halves(rootOf(c, 2), tones(c, 2)[2]); }) },
        { inst: 'marimba', score: each(RES_CH, function (c) { return arp(c, 4); }) },
        { inst: 'soft', score: bars([
          'E5 - - - G5 - - - C6 - - - G5 - - -', 'D5 - - - G5 - - - B5 - - - A5 - G5 -',
          'C5 - - - E5 - - - A5 - - - G5 - E5 -', 'F5 - - - - - - - A4 - - - C5 - - -',
          'E5 - - - G5 - - - C6 - - - D6 - E6 -', 'D6 - - - B5 - - - G5 - - - B5 - - -',
          'C6 - - - A5 - - - F5 - - - A5 - C6 -', 'B5 - - - - - - - D5 - - - G5 - - -']) },
        { inst: 'pad', score: each(RES_CH, function (c) { return hold(chord(c, 3)); }) },
        { inst: 'drum', score: rep('k . . . h . . . s . . . h . h .', 8) }
      ]
    },
    // ---- 結果のはじめに1回だけ：勝ち ----
    win: {
      bpm: 140, vol: 1, loop: false, then: 'result',
      parts: [
        { inst: 'brass', score: 'G4 . C5 . E5 . G5 - - - E5 . G5 - - - | C6 - - - - - - - - - - - . . . .' },
        { inst: 'pad', score: hold(chord('C', 3)) + ' | ' + hold(chord('C', 3)) },
        { inst: 'bass', score: 'C2 . C2 . C2 . C3 - - - C2 . C3 - - - | C2 - - - - - - - . . . . . . . .' },
        { inst: 'drum', score: 'kc . s . s . kc . . . s . kc . . . | kc . . . . . . . . . . . . . . .' }
      ]
    },
    // ---- 結果のはじめに1回だけ：大会で優勝 ----
    champion: {
      bpm: 120, vol: 1, loop: false, then: 'result',
      parts: [
        { inst: 'brass', score: bars(['C5 . C5 . C5 . E5 - - - G5 - - - C6 -', 'A5 - - - - - F5 - A5 - C6 - - - A5 -',
          'B5 - - - G5 - D5 - G5 - B5 - D6 - - -', 'C6 - - - - - - - - - - - . . . .']) },
        { inst: 'pad', score: bars([hold(chord('C', 3)), hold(chord('F', 3)), hold(chord('G', 3)), hold(chord('C', 3))]) },
        { inst: 'bass', score: bars([march('C2', 'G2'), march('F2', 'C3'), march('G2', 'D3'), 'C2 - - - - - - - . . . . . . . .']) },
        { inst: 'drum', score: bars(['kc . s s s . kc . s . s s s . s s', 'kc . s . s . kc . s . s s s . s s', 'kc . s . s . kc . s s s s t t t t', 'kc . . . . . . . . . . . . . . .']) }
      ]
    },
    // ---- 結果のはじめに1回だけ：負け ----
    lose: {
      bpm: 90, vol: 0.9, loop: false, then: 'result',
      parts: [
        { inst: 'soft', score: 'E5 - - - D5 - - - C5 - - - B4 - - - | A4 - - - - - - - - - - - . . . .' },
        { inst: 'pad', score: hold(chord('Am', 3)) + ' | ' + hold(chord('Am', 3)) },
        { inst: 'bass', score: 'A2 - - - - - - - E2 - - - - - - - | A2 - - - - - - - . . . . . . . .' }
      ]
    }
  };
  for (var name in TRACKS) {
    var tr = TRACKS[name], len = 0;
    for (var i = 0; i < tr.parts.length; i++) { tr.parts[i].ev = parse(tr.parts[i].score); len = Math.max(len, tr.parts[i].ev.length); }
    tr.len = len;
  }
  DN.BGM_TRACKS = TRACKS;   // 確認用（tools/bgm.html・tools/bgm-check.js）
  DN.bgmParse = parse;

  /** 場面ごとの曲。bgm.forScreen('home') など */
  var SCREEN = { title: 'title', home: 'home', tour: 'tour', team: 'collect', dex: 'collect', ach: 'collect', shop: 'shop' };

  DN.createBgm = function (sound, store) {
    var S = sound;
    var cur = null, want = null, step = 0, nextTime = null, timer = null, gen = 0, duckUntil = 0;
    var on = !(store && store.get('bgmOff', false));

    // 楽器の音色（tb-sound.js の synth）
    var M = 'music';
    var SAW3 = [{ type: 'sawtooth', detune: -12 }, { type: 'sawtooth', detune: 0 }, { type: 'sawtooth', detune: 12 }];
    function play1(inst, f, at, dur) {
      switch (inst) {
        case 'bass':    // のこぎり波＋1オクターブ下のサイン波。フィルターで「ボン」と丸く
          S.synth({ f: f, dur: dur * 0.85, vol: 0.19, at: at, bus: M, osc: [{ type: 'sawtooth', detune: -4 }, { type: 'sawtooth', detune: 4 }, { type: 'sine', mul: 0.5, gain: 0.7 }],
            env: { a: 0.004, d: 0.18, s: 0.55, r: 0.06 }, filter: { f: 1100, f1: 320, t: 0.18, q: 2 } });
          break;
        case 'chipbass':   // ピコピコのベース（三角波）
          S.synth({ f: f, dur: dur * 0.8, vol: 0.2, at: at, bus: M, osc: [{ type: 'triangle' }], env: { a: 0.002, d: 0.1, s: 0.8, r: 0.03 } });
          break;
        case 'chord':   // ギターをはじいたような「ジャッ」
          S.synth({ f: f, dur: 0.05, vol: 0.045, at: at, bus: M, osc: SAW3, env: { a: 0.002, d: 0.14, s: 0, r: 0.1 },
            filter: { f: 3000, f1: 700, t: 0.14, q: 1.2 }, reverb: 0.2, pan: f > 330 ? 0.25 : -0.25 });
          break;
        case 'pad':     // うしろで鳴りつづける やわらかい和音
          S.synth({ f: f, dur: dur * 0.95, vol: 0.02, at: at, bus: M, osc: SAW3, env: { a: 0.25, d: 0.5, s: 0.8, r: 0.5 },
            filter: { f: 900, q: 0.6 }, reverb: 0.5, pan: (Math.round(f) % 3 - 1) * 0.4 });
          break;
        case 'arp':     // やわらかい粒
          S.synth({ f: f, dur: 0.06, vol: 0.05, at: at, bus: M, osc: [{ type: 'triangle' }, { type: 'sine', mul: 2, gain: 0.35 }], env: { a: 0.003, d: 0.35, s: 0, r: 0.3 },
            reverb: 0.4, echo: 0.15, pan: 0.2 });
          break;
        case 'marimba': // 木琴：コロンと短く
          S.synth({ f: f, dur: 0.04, vol: 0.085, at: at, bus: M, osc: [{ type: 'sine' }, { type: 'sine', mul: 4, gain: 0.18 }], env: { a: 0.002, d: 0.22, s: 0, r: 0.18 },
            reverb: 0.3, pan: -0.2 });
          break;
        case 'bell':    // オルゴール：キラキラ長くのびる
          S.synth({ f: f, dur: 0.05, vol: 0.07, at: at, bus: M, osc: [{ type: 'sine' }, { type: 'sine', mul: 2.76, gain: 0.3 }, { type: 'sine', mul: 5.4, gain: 0.1 }],
            env: { a: 0.002, d: 0.8, s: 0, r: 0.7 }, reverb: 0.5, echo: 0.2 });
          break;
        case 'soft':    // 笛：やさしいメロディ
          S.synth({ f: f, dur: dur * 0.9, vol: 0.075, at: at, bus: M, osc: [{ type: 'triangle' }, { type: 'sine', mul: 2, gain: 0.2 }], env: { a: 0.03, d: 0.3, s: 0.7, r: 0.25 },
            vib: { rate: 5, depth: 12, delay: 0.25 }, reverb: 0.4, echo: 0.2 });
          break;
        case 'brass':   // ラッパ：音の出だしで明るくなる
          S.synth({ f: f, dur: dur * 0.92, vol: 0.06, at: at, bus: M, osc: SAW3, env: { a: 0.03, d: 0.25, s: 0.75, r: 0.12 },
            filter: { f: 700, f1: 2600, t: 0.1, q: 1.6 }, vib: dur > 0.35 ? { rate: 5.5, depth: 14, delay: 0.2 } : null, reverb: 0.35, echo: 0.12 });
          break;
        case 'chip':    // ピコピコのメロディ（四角い波）
          S.synth({ f: f, dur: dur * 0.85, vol: 0.035, at: at, bus: M, osc: [{ type: 'square', detune: -5 }, { type: 'square', detune: 5 }], env: { a: 0.002, d: 0.1, s: 0.6, r: 0.05 },
            vib: dur > 0.3 ? { rate: 7, depth: 18, delay: 0.12 } : null, echo: 0.15 });
          break;
        case 'blip':    // ピコピコの細かい粒
          S.synth({ f: f, dur: 0.03, vol: 0.02, at: at, bus: M, osc: [{ type: 'square' }], env: { a: 0.001, d: 0.06, s: 0, r: 0.03 }, pan: Math.round(f) % 2 ? 0.35 : -0.35 });
          break;
        default:        // lead：2本のずらしたのこぎり波＋四角い波。やまびこ付き
          S.synth({ f: f, dur: dur * 0.9, vol: 0.05, at: at, bus: M, osc: [{ type: 'sawtooth', detune: -6 }, { type: 'sawtooth', detune: 6 }, { type: 'square', gain: 0.5 }],
            env: { a: 0.008, d: 0.2, s: 0.7, r: 0.1 }, filter: { f: 3400, f1: 2200, t: 0.3, q: 1 },
            vib: dur > 0.3 ? { rate: 6, depth: 14, delay: 0.18 } : null, reverb: 0.25, echo: 0.2 });
      }
    }
    function drum(d, at) {
      if (d.indexOf('k') >= 0) {   // バスドラム：音程がすっと下がる「ドン」＋最初の「カッ」
        S.synth({ f: 170, f1: 50, glide: 0.1, dur: 0.1, vol: 0.24, at: at, bus: M, osc: [{ type: 'sine' }], env: { a: 0.001, d: 0.18, s: 0, r: 0.1 } });
        S.noise({ type: 'highpass', f0: 3000, dur: 0.012, vol: 0.04, at: at, bus: M });
      }
      if (d.indexOf('s') >= 0) {   // スネア：ザッ（響き付き）＋トン
        S.noise({ type: 'bandpass', f0: 2600, f1: 1400, dur: 0.15, vol: 0.11, q: 0.6, at: at, bus: M, reverb: 0.3 });
        S.synth({ f: 220, f1: 150, glide: 0.06, dur: 0.04, vol: 0.08, at: at, bus: M, osc: [{ type: 'triangle' }], env: { a: 0.001, d: 0.08, s: 0, r: 0.05 } });
      }
      if (d.indexOf('t') >= 0) {   // 太鼓：ドゥン
        S.synth({ f: 150, f1: 75, glide: 0.18, dur: 0.12, vol: 0.2, at: at, bus: M, osc: [{ type: 'sine' }, { type: 'triangle', gain: 0.4 }], env: { a: 0.002, d: 0.25, s: 0, r: 0.15 }, reverb: 0.3 });
      }
      if (d.indexOf('c') >= 0) S.noise({ type: 'highpass', f0: 5000, f1: 3000, dur: 0.9, vol: 0.05, at: at, bus: M, reverb: 0.4 });
      if (d.indexOf('h') >= 0) S.noise({ type: 'highpass', f0: 8000, dur: 0.035, vol: 0.035, at: at, bus: M, pan: 0.3 });
    }

    function schedule(at) {
      var sd = 60 / cur.bpm / 4;
      for (var i = 0; i < cur.parts.length; i++) {
        var p = cur.parts[i], e = p.ev[step % p.ev.length];
        if (!e) continue;
        if (e.drum) { drum(e.drum, at); continue; }
        for (var n = 0; n < e.notes.length; n++) if (e.notes[n]) play1(p.inst, e.notes[n], at, e.len * sd);
      }
    }

    function level() { return (S.musicLevel || 0.72) * (cur ? cur.vol || 1 : 1); }

    function tick() {
      if (!cur || !on) return;
      var now = S.now();
      if (now === null) { nextTime = null; return; } // まだ音が使えない・タブが裏にある
      if (nextTime === null || nextTime < now - 0.2) nextTime = now + 0.06; // 止まっていたら、今から続ける
      if (duckUntil && now > duckUntil) { duckUntil = 0; S.musicVolume(level(), 0.6); }
      while (nextTime < now + 0.25) {
        if (step >= cur.len) {
          // 1回だけの曲は、終わったらつぎの曲へ（なければ止まる）
          if (cur.loop === false) { var then = cur.then; cur = null; if (then) start(then, nextTime + 0.3); return; }
          step = 0;
        }
        schedule(nextTime);
        nextTime += 60 / cur.bpm / 4;
        step++;
      }
    }

    function start(name, at) {
      var tr = TRACKS[name];
      if (!tr) return;
      gen++;
      cur = tr; want = name; step = 0; nextTime = at || null; duckUntil = 0;
      S.musicVolume(level(), 0.05);
      if (!timer) timer = global.setInterval(tick, 30);
      tick();
    }

    var api = {
      /** 曲をはじめから流す（同じ曲がもう流れていたら、そのまま。restart = true で頭から） */
      play: function (name, restart) {
        if (!TRACKS[name]) return;
        if (!restart && want === name && (cur || !on)) return;
        want = name;
        if (!on) { cur = null; return; }
        start(name);
      },
      /** 画面の名前から曲をえらんで流す */
      forScreen: function (screen) { if (SCREEN[screen]) api.play(SCREEN[screen]); },
      /** バトルの曲：大会の番号 t（0〜4）と、決勝かどうか */
      forBattle: function (t, isFinal) { api.play(t >= 3 ? 'boss' : isFinal ? 'final' : t === 2 ? 'battle2' : 'battle', true); },
      /** フェードアウトして止める */
      stop: function (fade) {
        want = null;
        if (!cur) return;
        var my = ++gen;
        fade = fade || 0;
        S.musicVolume(0, fade);
        global.setTimeout(function () { if (my === gen) cur = null; }, fade * 1000 + 60);
      },
      /** sec 秒だけ小さくする（めくる演出の音を聞かせたいときなど） */
      duck: function (sec) {
        var now = S.now();
        if (!cur || now === null) return;
        S.musicVolume(level() * 0.25, 0.15);
        duckUntil = now + sec;
      },
      get on() { return on; },
      /** BGM のオンオフ（効果音はそのまま） */
      toggle: function () {
        on = !on;
        if (store) store.set('bgmOff', !on);
        if (on) { var w = want; want = null; if (w) api.play(w, true); }
        else { var keep = want; api.stop(0.3); want = keep; }
        return on;
      },
      get playing() { for (var k in TRACKS) if (TRACKS[k] === cur) return k; return null; }
    };
    return api;
  };
})(typeof window !== 'undefined' ? window : globalThis);
