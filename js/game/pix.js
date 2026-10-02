/*
 * DINO DUEL ドット絵の恐竜とエフェクト（Blender の3Dモデルから自動で作った絵。art/ の README を見る）
 * 絵の一覧は art/output/pix.js（window.DN_PIX）。ドット絵のある恐竜は、バトルで この絵と動きを使う。
 *
 * ・コマの切りかえは「時刻」で決める（何ミリ秒にどのコマ）。タイマーが遅れても、当たる瞬間のコマは
 *   タイミングの輪が縮みきる時刻にそろう
 * ・ドットがにじまないよう、1ドットの大きさは端末のピクセルの整数倍にそろえる（P.fit）
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};
  var M = global.DN_PIX || { dinos: {}, fx: {} };
  var P = DN.Pix = {};

  P.has = function (id) { return !!M.dinos[id]; };
  P.info = function (id) { return M.dinos[id]; };
  P.scale = 1;        // 1ドット = 何 CSS px（場の大きさから決める）
  function now() { return performance.now(); }
  function speed() { return DN.timeScale || 1; }

  // 絵を先に読みこんでおく（はじめて見せるときに一瞬消えないように）
  var cache = {};
  P.preload = function (ids) {
    var urls = [];
    (ids || Object.keys(M.dinos)).forEach(function (id) { var d = M.dinos[id]; if (d) urls.push(d.sheet, d.face); });
    Object.keys(M.fx).forEach(function (k) { urls.push(M.fx[k].sheet); });
    urls.forEach(function (u) { if (!cache[u]) { var im = new Image(); im.src = u; cache[u] = im; } });
  };

  // ---------------- 恐竜の絵 ----------------
  /** バトルの .body に入れる絵 */
  P.html = function (id) {
    var d = M.dinos[id];
    var gy = d.h - d.anims.idle.pts[0].feet[1];   // 足の下の空き（地面の高さをそろえる）
    return '<div class="pix" data-pix="' + id + '" style="--fw:' + d.w + ';--fh:' + d.h + ';--n:' + d.n + ';--gy:' + gy.toFixed(1) + ';--f:0;background-image:url(' + d.sheet + ')"></div>';
  };
  // 恐竜の絵が実際に入っている大きさ（ドット）。コマの枠（128×96）には動くための余白があるので、
  // 枠ではなくこの大きさが場の1マスに収まるように、1ドットの大きさを決める。全種で同じ値（ドットの大きさをそろえる）
  var REF = { w: 112, h: 62 };
  /** 1ドットの大きさを、場の1マスの大きさに合わせて決める（端末のピクセルの整数倍） */
  P.fit = function (field, availW, availH) {
    var dpr = global.devicePixelRatio || 1;
    var k = Math.min(availW / REF.w, availH / REF.h);
    P.scale = Math.max(1, Math.floor(k * dpr)) / dpr;
    field.style.setProperty('--ps', P.scale);
  };

  // 動いている絵の一覧。1本のタイマーで、時刻に合うコマにする
  var live = [];
  function setFrame(s, f) {
    if (s.f === f) return;
    s.f = f;
    s.el.style.setProperty('--f', f);
    if (P.onFrame) P.onFrame(s.el, f, now());   // 確認用（コマが変わった時刻を調べる）
  }
  function tick() {
    var t = now();
    live = live.filter(function (s) { return s.el.isConnected; });
    live.forEach(function (s) {
      var a = s.info.anims;
      if (s.seq) {
        var cur = null;
        for (var i = 0; i < s.seq.length; i++) if (s.seq[i].t <= t) cur = s.seq[i];
        if (cur) setFrame(s, cur.f);
        if (s.seqEnd !== null && t >= s.seqEnd) {
          s.seq = null;
          if (s.then === 'hold') { s.hold = true; } else { s.idle0 = t; }
          if (s.done) { var d = s.done; s.done = null; d(); }
        }
        return;
      }
      if (s.hold) return;
      // 待機：くり返し
      var id = a.idle, tot = 0;
      id.ms.forEach(function (m) { tot += m; });
      var e = (t - s.idle0 + s.phase) % tot, k = 0;
      while (k < id.n - 1 && e >= id.ms[k]) { e -= id.ms[k]; k++; }
      setFrame(s, id.s + k);
    });
  }
  // 画面の書きかえごとにコマを合わせる（画面が止まっている間も進むよう、タイマーでも）
  (function loop() { tick(); requestAnimationFrame(loop); })();
  setInterval(tick, 50);

  function state(el) {
    for (var i = 0; i < live.length; i++) if (live[i].el === el) return live[i];
    return null;
  }
  /** 絵を動かしはじめる（待機のくり返し） */
  P.mount = function (el) {
    var id = el.getAttribute('data-pix');
    var s = { el: el, id: id, info: M.dinos[id], f: -1, seq: null, seqEnd: null, idle0: now(), phase: Math.random() * 800, hold: false };
    live.push(s);
    tick();
    return s;
  };
  /**
   * コマの予定を入れる。list = [{ f: 動きの中のコマ番号, t: 見せはじめる時刻 }, ...]、end = 終わる時刻。
   * then = 'idle'（待機にもどる）/ 'hold'（最後のコマのまま）
   */
  P.seq = function (el, anim, list, end, then) {
    var s = state(el);
    if (!s) return Promise.resolve();
    var a = s.info.anims[anim];
    s.hold = false;
    s.seq = list.map(function (x) { return { f: a.s + x.f, t: x.t }; });
    s.seqEnd = end === undefined ? null : end;
    s.then = then || 'idle';
    tick();
    return new Promise(function (res) { s.done = res; });
  };
  /** 動きを最初から、ms どおりに再生（被弾・倒れるなど）。from = 何コマ目から */
  P.play = function (el, anim, then, frames) {
    var s = state(el);
    if (!s) return Promise.resolve();
    var a = s.info.anims[anim];
    if (!a) return Promise.resolve();
    var t = now(), list = [], idx = frames || seqRange(a.n);
    idx.forEach(function (f) { list.push({ f: f, t: t }); t += a.ms[f] / speed(); });
    return P.seq(el, anim, list, t, then);
  };
  function seqRange(n) { var r = []; for (var i = 0; i < n; i++) r.push(i); return r; }
  P.stop = function (el) { var s = state(el); if (s) { s.seq = null; s.hold = false; s.idle0 = now(); } };

  /** 絵の中の位置（口・頭・体・足）→ 場の中の位置。いま見せているコマの位置を使う */
  P.point = function (el, name, field) {
    var s = state(el);
    var r = el.getBoundingClientRect(), f = field.getBoundingClientRect();
    if (!s) return { x: r.left - f.left + r.width / 2, y: r.top - f.top + r.height / 2 };
    var a = s.info.anims, fi = s.f < 0 ? 0 : s.f, pt = null;
    Object.keys(a).forEach(function (k) { var x = a[k]; if (fi >= x.s && fi < x.s + x.n) pt = x.pts[fi - x.s][name]; });
    if (!pt) pt = a.idle.pts[0][name];
    var flip = el.closest('.slot.foe') !== null;
    var px = pt[0] / s.info.w, py = pt[1] / s.info.h;
    return { x: r.left - f.left + r.width * (flip ? 1 - px : px), y: r.top - f.top + r.height * py };
  };
  /** 動きの情報（コマ数・時間・当たる瞬間のコマ） */
  P.anim = function (id, name) { return M.dinos[id] && M.dinos[id].anims[name]; };
  P.moveAnim = function (id, moveId) { var d = M.dinos[id]; return d && d.moves && d.moves[moveId]; };

  /** 残像（いまのコマを写して、うすくして消す） */
  P.ghost = function (el, fxLayer, field) {
    var r = el.getBoundingClientRect(), f = field.getBoundingClientRect();
    var g = el.cloneNode(true);
    g.className = 'pix pix-ghost' + (el.closest('.slot.foe') ? ' flip' : '');
    g.style.left = (r.left - f.left) + 'px';
    g.style.top = (r.top - f.top) + 'px';
    fxLayer.appendChild(g);
    g.animate([{ opacity: 0.5 }, { opacity: 0 }], { duration: 260, easing: 'ease-out', fill: 'forwards' });
    setTimeout(function () { g.remove(); }, 300);
  };

  // ---------------- エフェクト ----------------
  /**
   * エフェクトを場に出す。x, y = 中心（場の中の位置）
   * o = { at: 1コマ目を見せる時刻, ms: 1コマの時間, flip: 左右反転, to: {x, y} 飛んでいく先, travel: 飛ぶ時間, loops: くり返す回数, size: 大きさの倍率（整数） }
   */
  P.fx = function (name, x, y, o) {
    o = o || {};
    var d = M.fx[name], layer = document.getElementById('fx');
    if (!d || !layer) return null;
    var ps = P.scale * (o.size || 1);
    var el = document.createElement('div');
    el.className = 'pix-fx' + (o.flip ? ' flip' : '');
    el.style.cssText = 'width:' + d.w * ps + 'px;height:' + d.h * ps + 'px;left:' + (x - d.w * ps / 2) + 'px;top:' + (y - d.h * ps / 2) + 'px;' +
      'background-image:url(' + d.sheet + ');background-size:' + d.w * d.n * ps + 'px ' + d.h * ps + 'px;background-position:0 0;visibility:hidden';
    layer.appendChild(el);
    var ms = (o.ms || 70), at = o.at === undefined ? now() : o.at, loops = o.loops || 1;
    var total = d.n * loops, endT = at + total * ms;
    var timer = setInterval(step, 25);
    function step() {
      var t = now();
      if (t < at) return;
      if (t >= endT) { clearInterval(timer); el.remove(); return; }
      var k = Math.floor((t - at) / ms) % d.n;
      el.style.visibility = 'visible';
      el.style.backgroundPosition = (-k * d.w * ps) + 'px 0';
    }
    step();
    if (o.to) {
      var dx = o.to.x - x, dy = o.to.y - y, flip = o.flip ? -1 : 1;
      el.animate([{ transform: 'translate(0,0)' + (o.flip ? ' scaleX(-1)' : '') }, { transform: 'translate(' + dx + 'px,' + dy + 'px)' + (o.flip ? ' scaleX(-1)' : '') }],
        { duration: o.travel || total * ms, delay: Math.max(0, at - now()), easing: 'linear', fill: 'both' });
      void flip;
    }
    return el;
  };

  // ---------------- 丸いアイコンの顔（行動順・技えらび・試合の結果など） ----------------
  if (DN.art && DN.art.img) {
    var baseImg = DN.art.img;
    DN.art.img = function (dino, opt, cls) {
      if (opt && opt.crop && M.dinos[dino.id]) {
        return '<img class="dino-img pix-face' + (cls ? ' ' + cls : '') + '" src="' + M.dinos[dino.id].face + '" alt="" draggable="false">';
      }
      return baseImg.apply(this, arguments);
    };
  }
})(window);
