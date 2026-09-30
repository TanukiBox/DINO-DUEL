/*
 * DINO DUEL 実機確認用の表示（?debug=1 のときだけ）
 * 画面の左上に、1秒ごとの 画面の更新回数（fps）・鳴らした音の数・演出の部品の数・速さ を出す。スマホで重さを数字で確かめるため。
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};
  if (!DN.app || !DN.app.debug) return;

  var S = DN.app.sound, notes = 0;
  ['synth', 'tone', 'noise'].forEach(function (k) {
    var f = S[k];
    S[k] = function () { notes++; return f.apply(this, arguments); };
  });

  var box = document.createElement('div');
  box.className = 'debug-hud';
  document.getElementById('app').appendChild(box);
  var frames = 0, last = performance.now(), worst = 0, prev = last;
  (function loop(t) {
    frames++;
    worst = Math.max(worst, t - prev);
    prev = t;
    if (t - last >= 1000) {
      var fps = Math.round(frames * 1000 / (t - last)), fx = document.getElementById('fx');
      box.textContent = fps + ' fps ・ 最長 ' + Math.round(worst) + 'ms ・ 音 ' + notes + '/秒 ・ 部品 ' + (fx ? fx.childElementCount : 0) + ' ・ ×' + (DN.timeScale || 1);
      box.classList.toggle('bad', fps < 45);
      frames = 0; notes = 0; worst = 0; last = t;
    }
    requestAnimationFrame(loop);
  })(performance.now());
})(window);
