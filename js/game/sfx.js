/*
 * DINO DUEL 効果音（Web Audio で作る。音声ファイルは使わない）
 * 共通土台の TB.createSound を使う。ミュートはセーブに覚える。
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};

  DN.createSfx = function (sound) {
    var S = sound;
    function notes(list, o) {
      list.forEach(function (n) {
        S.synth({ f: n[0], dur: n[2] || 0.12, delay: n[1], vol: (o && o.vol) || 0.09,
          osc: [{ type: 'square', detune: -6 }, { type: 'triangle', detune: 6, mul: 2, gain: 0.5 }],
          env: { a: 0.005, d: 0.08, s: 0.5, r: 0.12 }, reverb: 0.25 });
      });
    }
    return {
      /** ボタンを押した */
      tap: function () { S.tone({ type: 'square', f0: 880, f1: 1320, dur: 0.05, vol: 0.06 }); },
      /** 技をえらんだ */
      pick: function () { S.tone({ type: 'triangle', f0: 660, f1: 990, dur: 0.08, vol: 0.12 }); },
      /** ターン開始 */
      turn: function () {
        S.noise({ dur: 0.35, vol: 0.12, f0: 400, f1: 2400, q: 2 });
        notes([[523, 0.05], [784, 0.12, 0.2]], { vol: 0.07 });
      },
      /** 技名が出た（ほえ声っぽい低い音） */
      roar: function (big) {
        S.synth({ f: big ? 110 : 150, f1: big ? 70 : 100, dur: 0.35, vol: 0.12, glide: 0.35,
          osc: [{ type: 'sawtooth', detune: -12 }, { type: 'sawtooth', detune: 10 }],
          filter: { f: 900, f1: 300, q: 3 }, vib: { rate: 22, depth: 40, delay: 0 }, env: { a: 0.03, d: 0.2, s: 0.6, r: 0.15 } });
      },
      /** 飛びかかる */
      swing: function () { S.noise({ dur: 0.18, vol: 0.14, f0: 600, f1: 3200, q: 1.5 }); },
      /** 当たった（crit で大きく） */
      hit: function (crit) {
        S.noise({ dur: crit ? 0.3 : 0.18, vol: crit ? 0.32 : 0.24, f0: crit ? 1600 : 1100, f1: 120, type: 'lowpass', q: 1 });
        S.tone({ type: 'sine', f0: crit ? 180 : 150, f1: 45, dur: crit ? 0.28 : 0.18, vol: crit ? 0.45 : 0.32 });
        if (crit) S.tone({ type: 'square', f0: 1400, f1: 700, dur: 0.12, vol: 0.06, delay: 0.02 });
      },
      /** ガードで受けた */
      guard: function () {
        S.tone({ type: 'triangle', f0: 1200, f1: 900, dur: 0.14, vol: 0.12 });
        S.noise({ dur: 0.1, vol: 0.1, f0: 3000, f1: 1500, q: 4 });
      },
      /** ぴったり判定 */
      perfect: function () { notes([[1047, 0], [1319, 0.05], [1568, 0.1], [2093, 0.15, 0.2]], { vol: 0.08 }); },
      /** おしい判定 */
      good: function () { notes([[880, 0], [1175, 0.06, 0.14]], { vol: 0.07 }); },
      /** 外れ */
      miss: function () { S.tone({ type: 'square', f0: 220, f1: 160, dur: 0.14, vol: 0.06 }); },
      /** かわされた */
      dodge: function () { S.noise({ dur: 0.22, vol: 0.1, f0: 2500, f1: 500, q: 2 }); },
      /** 能力が上がった・下がった */
      buff: function (up) {
        var f = up ? [523, 659, 784] : [784, 622, 494];
        notes(f.map(function (x, i) { return [x, i * 0.06]; }), { vol: 0.06 });
      },
      heal: function () { notes([[784, 0], [988, 0.07], [1175, 0.14, 0.2]], { vol: 0.06 }); },
      /** たおれた */
      faint: function () {
        S.tone({ type: 'sawtooth', f0: 400, f1: 60, dur: 0.6, vol: 0.12, filter: { type: 'lowpass', f: 1200 } });
        S.noise({ dur: 0.4, vol: 0.14, f0: 500, f1: 80, type: 'lowpass', delay: 0.25 });
      },
      /** 勝利のファンファーレ */
      victory: function () {
        notes([[523, 0], [659, 0.12], [784, 0.24], [1047, 0.36, 0.3], [784, 0.7], [1047, 0.82, 0.5]], { vol: 0.1 });
        notes([[262, 0.36, 0.3], [392, 0.82, 0.5]], { vol: 0.07 });
      },
      defeat: function () { notes([[392, 0, 0.2], [330, 0.22, 0.2], [262, 0.44, 0.5]], { vol: 0.08 }); },
      /** カードが出てくる（段階2で使う） */
      card: function (rank) {
        S.noise({ dur: 0.5, vol: 0.1, f0: 800, f1: 3000, q: 1 });
        notes([[784, 0.3], [1047, 0.4], [1319, 0.5, rank > 2 ? 0.5 : 0.2]], { vol: 0.08 });
      }
    };
  };
})(window);
