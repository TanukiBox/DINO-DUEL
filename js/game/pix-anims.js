/*
 * DINO DUEL ドット絵の恐竜の技の動き（コマ送り＋ドット絵のエフェクト）
 *
 * 1つの技の進み方は anims.js と同じ（タイミングの輪と同じ時間の流れ）：
 *   windup  … 輪が出た瞬間から：ためるコマ（かがむ・口を開ける・息を吸う）
 *   strike  … 当たる瞬間の lead 秒前から：飛びかかる・ほえるコマ。「当たる瞬間のコマ」は輪が縮みきる時刻 c.tHit に出す
 *   impact  … 判定が出たとき：相手がのけぞる・擬音（タップしなかったときは、判定は輪が縮みきって 0.2秒後）
 *   ※ 当たる瞬間の光・音は、判定を待たずに strike で c.tHit（輪が縮みきる時刻）に予約する。見た目は必ず輪とそろう
 *   after   … 当たったあと（首を振る・ほえつづける）
 *   recover … 元の位置へもどり、待機のコマへ
 * どの技がどの動きか は、art/blender/dinos.py の moves（→ art/output/pix.js）で決める。
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};
  var P = DN.Pix;

  function T(k) { return DN.app.i18n.t(k); }
  function sfx() { return DN.app.sfx; }
  function now() { return performance.now(); }
  function sp() { return DN.timeScale || 1; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms / sp()); }); }
  function field() { return document.getElementById('field'); }
  function layer() { return document.getElementById('fx'); }
  function pixOf(c, unit) { return c.slot(unit || c.u).body.querySelector('.pix'); }
  function pt(c, unit, name) { var e = pixOf(c, unit); return e ? P.point(e, name, field()) : c.center(unit); }
  function info(c, name) { return P.anim(c.u.d.id, name); }
  function ghosts(c, n, gap) {
    var e = pixOf(c);
    for (var i = 0; i < n; i++) setTimeout(function () { if (e.isConnected) P.ghost(e, layer(), field()); }, i * gap);
  }
  /** after・recover のコマを、いまから ms ずつ並べる */
  function chain(frames, ms) {
    var t = now();
    return frames.map(function (f, i) { return { f: f, t: t + i * ms / sp() }; });
  }

  var A = DN.PixAnim = {};
  var LIB = {};
  /** この恐竜のこの技に、ドット絵の動きがあれば返す（なければ null → anims.js の動き） */
  A.get = function (u, moveId) {
    var name = P.moveAnim(u.d.id, moveId);
    return name && LIB[name] ? Object.assign({ pixName: name }, LIB[name]) : null;
  };

  // ---------------- 噛みつき（ティラノ：クラッシュファング）----------------
  // かがむ → 口を大きく開けてのけぞる → 飛びかかる → 当たる瞬間に噛みつく（相手の上で歯がガチン）→ 噛んだまま首を振る
  LIB.bite = {
    lead: 0.22, shake: 3, stop: 110,
    windup: function (c) {
      var a = info(c, 'bite'), ring = c.ringMs;
      P.seq(pixOf(c), 'bite', [{ f: a.windup[0], t: c.t0 }, { f: a.windup[1], t: c.t0 + ring * 0.42 }]);
      c.move([c.cur, c.T(-0.07, 3, 1, 0)], ring * 0.5, 'cubic-bezier(.2,.8,.3,1)');
      setTimeout(function () { sfx().growl(); DN.FX.vignette('rgba(255,30,10,0.4)', 700); }, ring * 0.3);
    },
    strike: function (c) {
      var a = info(c, 'bite'), t = now();
      P.seq(pixOf(c), 'bite', [{ f: a.strike[0], t: t }, { f: a.strike[1], t: c.tHit }]);
      sfx().swing();
      c.move([c.cur, c.T(0.7, 0, 1, 0)], Math.max(60, c.tHit - t), 'cubic-bezier(.6,0,.9,.5)');
      ghosts(c, 3, 55);
      DN.FX.speedLines(c.mine ? 0 : 180, 380);
      // 相手の上で歯が閉じる：閉じきるコマ（3コマ目）と光を、当たる瞬間に
      c.targets.forEach(function (t2) {
        var p = pt(c, t2, 'body');
        P.fx('chomp', p.x, p.y, { at: c.tHit - 3 * 60, ms: 60, flip: !c.mine });
        P.fx('spark', p.x, p.y, { at: c.tHit, ms: 55 });
      });
      setTimeout(function () { sfx().crunch(); }, Math.max(0, c.tHit - now()));
    },
    impact: function (c, t) {
      var p = pt(c, t, 'body');
      DN.FX.sticker(T('sticker_bite'), p.x + c.dir * 26, p.y - 34, { size: 34, cls: 'red' });
      c.knock(t, 14, 5);
    },
    after: function (c) {
      var a = info(c, 'bite');
      P.seq(pixOf(c), 'bite', chain(a.after, 90), undefined, 'hold');
      c.move([c.cur, c.T(0.7, 0, 1, -3), c.T(0.7, 0, 1, 3), c.T(0.7, 0, 1, 0)], a.after.length * 90, 'ease-in-out');
      return wait(a.after.length * 90);
    },
    recover: function (c) {
      var a = info(c, 'bite'), t = now();
      P.seq(pixOf(c), 'bite', [{ f: a.recover[0], t: t }], t + 200 / sp());
      c.move([c.cur, 'translate(0px,0px)'], 300, 'cubic-bezier(.3,.7,.4,1)');
      return wait(300);
    }
  };

  // ---------------- 咆哮（ティラノ：暴君のおたけび）----------------
  // 息を吸って頭を下げる → 頭を上げて口を開く → ほえる：口から音の波が相手へ飛び、当たる瞬間に相手の上で衝撃波 → ほえつづけて、体から赤い炎（攻撃アップ）
  LIB.roar = {
    lead: 0.3, shake: 2, stop: 80,
    windup: function (c) {
      var a = info(c, 'roar'), ring = c.ringMs;
      P.seq(pixOf(c), 'roar', [{ f: a.windup[0], t: c.t0 }, { f: a.windup[1], t: c.t0 + ring * 0.5 }]);
      c.move([c.cur, c.T(-0.05, 0, 1, 0)], ring * 0.45, 'cubic-bezier(.2,.8,.3,1)');
      setTimeout(function () { sfx().growl(); }, ring * 0.12);
    },
    strike: function (c) {
      var a = info(c, 'roar'), t = now(), e = pixOf(c);
      P.seq(e, 'roar', [{ f: a.strike[0], t: t }], undefined, 'hold');
      sfx().roarBig();
      DN.FX.vignette('rgba(255,50,20,0.4)', 800);
      var m = P.point(e, 'mouth', field());
      DN.FX.sticker(T('sticker_roar'), m.x + c.dir * 18, m.y - 30, { size: 30, rot: c.dir * -8, cls: 'red', life: 1000 });
      var travel = Math.max(80, c.tHit - t);
      // 音の波：口から相手へ。1つ目が当たる瞬間に相手に届く
      c.targets.forEach(function (t2) {
        var p = pt(c, t2, 'body');
        for (var i = 0; i < 3; i++) {
          P.fx('wave', m.x + c.dir * 10, m.y, { at: t + i * 90, ms: travel / 5, flip: !c.mine, to: p, travel: travel });
        }
        // 1つ目の波が届く瞬間（= 輪が縮みきる瞬間）に衝撃波
        P.fx('burst', p.x, p.y, { at: c.tHit, ms: 55 });
        P.fx('spark', p.x, p.y, { at: c.tHit, ms: 55 });
      });
      setTimeout(function () { sfx().thud(); }, Math.max(0, c.tHit - now()));
      for (var k = 0; k < 3; k++) setTimeout(function () { DN.FX.shake(1); }, k * 110);
    },
    impact: function (c, t) {
      c.knock(t, 12, 3);
    },
    after: function (c) {
      var a = info(c, 'roar');
      P.seq(pixOf(c), 'roar', chain(a.after, 90), undefined, 'hold');
      var b = pt(c, c.u, 'body');
      P.fx('aura', b.x, b.y - 8, { ms: 80 });   // 攻撃アップの炎
      c.glow('#ff5a1a', 700);
      return wait(a.after.length * 90);
    },
    recover: function (c) {
      var a = info(c, 'roar'), t = now();
      P.seq(pixOf(c), 'roar', [{ f: a.recover[0], t: t }], t + 200 / sp());
      c.move([c.cur, 'translate(0px,0px)'], 300, 'cubic-bezier(.3,.7,.4,1)');
      return wait(300);
    }
  };
})(window);
