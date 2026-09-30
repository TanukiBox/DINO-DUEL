/*
 * DINO DUEL 技ごとの攻撃アニメーション
 *
 * 1つの技の動きは次の順に進む（タイミングの輪と同じ時間の流れ）：
 *   windup(c)   … 輪が出た瞬間から。ためる・構える・ほえる
 *   strike(c)   … 当たる瞬間の lead 秒前から。飛びかかる・突進する・振り下ろす
 *   impact(c, t, hit, h) … 当たったとき（相手1体・1ヒットごと）。噛みつき跡・衝撃波・効果音
 *   after(c)    … 全部当たったあと。首を振る・力をためこむ など
 *   recover(c)  … 元の位置へ
 * c（その行動の情報）は DN.Anim.ctx が作る。data.js の技の anim で、どの動きを使うか決める。
 * 描きこみ版の恐竜（art-tyranno.js など）は、あご・頭・しっぽを別々に動かす。ほかの恐竜は体ごと動く。
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};

  function $(id) { return document.getElementById(id); }
  // バトルの速さ（×2）のときは待ち時間も半分（DN.timeScale は battle-view.js が決める）
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms / (DN.timeScale || 1)); }); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function T(k) { return DN.app.i18n.t(k); }
  function sfx() { return DN.app.sfx; }

  // =================== 演出の部品 ===================
  var FX = DN.FX = {};

  FX.fieldRect = function () { return $('field').getBoundingClientRect(); };

  /** 場の上に部品を置く（x, y は場の中の位置） */
  FX.el = function (cls, x, y, html, life) {
    var d = document.createElement('div');
    d.className = cls;
    if (x !== null && x !== undefined) { d.style.left = x + 'px'; d.style.top = y + 'px'; }
    if (html) d.innerHTML = html;
    $('fx').appendChild(d);
    setTimeout(function () { d.remove(); }, life || 1400);
    return d;
  };

  /** 擬音の文字（ガブッ！ など） */
  FX.sticker = function (text, x, y, o) {
    o = o || {};
    var d = FX.el('sticker' + (o.cls ? ' ' + o.cls : ''), x, y, '', o.life || 900);
    d.textContent = text;
    d.style.setProperty('--rot', (o.rot === undefined ? rnd(-12, 8) : o.rot) + 'deg');
    if (o.size) d.style.fontSize = o.size + 'px';
    if (o.color) d.style.color = o.color;
    return d;
  };

  /** 広がる輪（衝撃波） */
  FX.shock = function (x, y, o) {
    o = o || {};
    var d = FX.el('shock', x, y, '', (o.dur || 450) + 100);
    var s = o.size || 120;
    d.style.width = d.style.height = s + 'px';
    d.style.margin = (-s / 2) + 'px 0 0 ' + (-s / 2) + 'px';
    if (o.color) d.style.borderColor = o.color;
    if (o.width) d.style.borderWidth = o.width + 'px';
    if (o.squash) d.style.height = (s * o.squash) + 'px', d.style.marginTop = (-s * o.squash / 2) + 'px';
    d.animate([{ transform: 'scale(0.15)', opacity: 1 }, { transform: 'scale(1)', opacity: 0 }], { duration: o.dur || 450, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' });
    return d;
  };

  /** はじける粒（火花・土・岩・しぶき） */
  FX.particles = function (x, y, o) {
    o = o || {};
    var n = o.n || 10, colors = o.colors || ['#fff4b0', '#ffc94a', '#ff8a2a'];
    for (var i = 0; i < n; i++) {
      var ang = (o.angle === undefined ? rnd(0, 360) : o.angle + rnd(-(o.spread || 60), o.spread || 60)) * Math.PI / 180;
      var sp = rnd(0.5, 1) * (o.speed || 90), sz = rnd(0.6, 1) * (o.size || 7), dur = rnd(0.7, 1) * (o.dur || 520);
      var vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp, g = o.gravity === undefined ? 60 : o.gravity;
      var d = FX.el('ptc ' + (o.shape || 'dot'), x, y, '', dur + 60);
      d.style.width = d.style.height = sz + 'px';
      d.style.margin = (-sz / 2) + 'px 0 0 ' + (-sz / 2) + 'px';
      d.style.background = colors[i % colors.length];
      d.animate([
        { transform: 'translate(0,0) rotate(0deg) scale(1)', opacity: 1 },
        { transform: 'translate(' + (vx * 0.6) + 'px,' + (vy * 0.6 + g * 0.2) + 'px) rotate(' + rnd(-180, 180) + 'deg) scale(0.9)', opacity: 1, offset: 0.55 },
        { transform: 'translate(' + vx + 'px,' + (vy + g) + 'px) rotate(' + rnd(-360, 360) + 'deg) scale(0.4)', opacity: 0 }
      ], { duration: dur, easing: 'cubic-bezier(.15,.7,.4,1)', fill: 'forwards' });
    }
  };

  /** スピード線（dirDeg = 流れる向き[度]、0 = 右へ） */
  FX.speedLines = function (dirDeg, dur, o) {
    o = o || {};
    dur = dur || 400;
    var box = FX.el('speedlines' + (o.cls ? ' ' + o.cls : ''), null, null, '', dur + 400);
    box.style.transform = 'rotate(' + dirDeg + 'deg) scale(1.6)';
    for (var i = 0; i < (o.n || 16); i++) {
      var l = document.createElement('i');
      var w = rnd(60, 190);
      l.style.top = rnd(0, 100) + '%';
      l.style.width = w + 'px';
      l.style.height = rnd(1.5, 4) + 'px';
      box.appendChild(l);
      l.animate([{ transform: 'translateX(-' + (w + 20) + 'px)', opacity: 0 }, { opacity: 1, offset: 0.2 }, { transform: 'translateX(520px)', opacity: 0 }],
        { duration: rnd(0.5, 0.9) * dur, delay: rnd(0, 0.4) * dur, easing: 'linear', fill: 'both' });
    }
    return box;
  };

  /** 残像（svg をその場に写して消していく） */
  FX.ghost = function (svg, o) {
    if (!svg) return;
    o = o || {};
    var f = FX.fieldRect(), r = svg.getBoundingClientRect();
    var g;
    if (o.dino) {
      g = document.createElement('img');
      g.src = DN.art.url(o.dino);
      g.className = 'ghost';
    } else {
      g = svg.cloneNode(true);
      g.classList.add('ghost');
    }
    g.style.left = (r.left - f.left) + 'px';
    g.style.top = (r.top - f.top) + 'px';
    g.style.width = r.width + 'px';
    g.style.height = r.height + 'px';
    if (o.flip) g.style.transform = 'scaleX(-1)';
    if (o.tint) g.style.filter = o.tint;
    $('fx').appendChild(g);
    g.animate([{ opacity: o.op || 0.5 }, { opacity: 0 }], { duration: o.dur || 320, easing: 'ease-out', fill: 'forwards' });
    setTimeout(function () { g.remove(); }, (o.dur || 320) + 50);
  };

  /** 噛みつき跡：上下のキバが閉じる */
  FX.bite = function (x, y, scale, big) {
    var s = scale || 1;
    var fangs = function (up) {
      var h = '', n = big ? 6 : 5, w = 100 / n;
      for (var i = 0; i < n; i++) {
        var x0 = i * w + 2, len = (i === 0 || i === n - 1 ? 22 : 30) * (big ? 1.15 : 1);
        h += up ? '<path d="M' + x0 + ' 0 L' + (x0 + w - 4) + ' 0 L' + (x0 + w / 2 - 1) + ' ' + len + 'Z"/>'
          : '<path d="M' + x0 + ' 80 L' + (x0 + w - 4) + ' 80 L' + (x0 + w / 2 - 1) + ' ' + (80 - len) + 'Z"/>';
      }
      return h;
    };
    var d = FX.el('bite' + (big ? ' big' : ''), x, y,
      '<svg viewBox="-4 -4 108 88"><g class="up">' + fangs(true) + '</g><g class="lo">' + fangs(false) + '</g></svg>', 900);
    d.style.transform = 'translate(-50%,-50%) scale(' + s + ')';
    return d;
  };

  /** 引っかき跡（3本線） */
  FX.slash = function (x, y, ang, o) {
    o = o || {};
    var d = FX.el('slash', x, y,
      '<svg viewBox="0 0 100 100"><path d="M18 8 C40 36 58 60 80 92"/><path d="M34 4 C54 34 70 56 92 82"/><path d="M6 20 C26 46 44 70 64 96"/></svg>', 700);
    d.style.transform = 'translate(-50%,-50%) rotate(' + (ang || 0) + 'deg) scale(' + (o.scale || 1) + ')';
    if (o.color) d.style.setProperty('--sc', o.color);
    return d;
  };

  /** 大きな弧（しっぽ・首のひとふり） */
  FX.swoosh = function (x, y, flip, o) {
    o = o || {};
    var d = FX.el('swoosh', x, y, '<svg viewBox="0 0 120 120"><path d="M14 96 C10 50 50 10 100 16"/></svg>', 600);
    d.style.transform = 'translate(-50%,-50%) scaleX(' + (flip ? -1 : 1) + ') rotate(' + (o.rot || 0) + 'deg) scale(' + (o.scale || 1) + ')';
    if (o.color) d.style.setProperty('--sc', o.color);
    return d;
  };

  /** 光線 */
  FX.beam = function (x1, y1, x2, y2, o) {
    o = o || {};
    var dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy), ang = Math.atan2(dy, dx) * 180 / Math.PI;
    var d = FX.el('beam', x1, y1, '', 700);
    d.style.width = len + 'px';
    d.style.transform = 'rotate(' + ang + 'deg)';
    if (o.color) d.style.setProperty('--bc', o.color);
    d.animate([{ transform: 'rotate(' + ang + 'deg) scaleX(0)', opacity: 1 }, { transform: 'rotate(' + ang + 'deg) scaleX(1)', opacity: 1, offset: 0.35 }, { transform: 'rotate(' + ang + 'deg) scaleX(1) scaleY(0.2)', opacity: 0 }],
      { duration: o.dur || 520, easing: 'ease-out', fill: 'forwards' });
    return d;
  };

  /** 渦（水） */
  FX.vortex = function (x, y, o) {
    o = o || {};
    var d = FX.el('vortex', x, y, '<svg viewBox="0 0 100 100"><path d="M50 50 m0 -6 a6 6 0 1 1 -6 6 a14 14 0 1 1 14 14 a24 24 0 1 1 -24 -24 a34 34 0 1 1 34 34"/></svg>', 900);
    d.animate([{ transform: 'translate(-50%,-50%) scale(0.2) rotate(0deg)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1) rotate(-240deg)', opacity: 1, offset: 0.5 }, { transform: 'translate(-50%,-50%) scale(1.3) rotate(-420deg)', opacity: 0 }],
      { duration: o.dur || 820, easing: 'ease-out', fill: 'forwards' });
  };

  /** 風の線 */
  FX.wind = function (x, y, dirX) {
    for (var i = 0; i < 5; i++) {
      var d = FX.el('windline', x, y + rnd(-50, 50), '<svg viewBox="0 0 120 30"><path d="M2 18 C30 4 60 28 90 12 C100 7 108 8 116 14"/></svg>', 800);
      d.style.transform = 'translate(-50%,-50%) scaleX(' + dirX + ')';
      d.animate([{ transform: 'translate(-50%,-50%) translateX(' + (-60 * dirX) + 'px) scaleX(' + dirX + ')', opacity: 0 },
        { opacity: 1, offset: 0.3 }, { transform: 'translate(-50%,-50%) translateX(' + (90 * dirX) + 'px) scaleX(' + dirX + ')', opacity: 0 }],
        { duration: 520 + i * 60, delay: i * 50, easing: 'ease-out', fill: 'both' });
    }
  };

  /** 光の玉が a から b へ飛ぶ（回復） */
  FX.orbs = function (a, b, o) {
    o = o || {};
    for (var i = 0; i < (o.n || 7); i++) {
      var d = FX.el('orb', a.x + rnd(-14, 14), a.y + rnd(-14, 14), '', 1100);
      if (o.color) d.style.background = o.color;
      d.animate([{ transform: 'translate(0,0) scale(0.4)', opacity: 0 }, { opacity: 1, offset: 0.2 },
        { transform: 'translate(' + (b.x - a.x) + 'px,' + (b.y - a.y) + 'px) scale(1)', opacity: 0.2 }],
        { duration: 620, delay: i * 55, easing: 'cubic-bezier(.5,0,.6,1)', fill: 'both' });
    }
  };

  /** 地面を走る衝撃（ズシン） */
  FX.groundWave = function (x, y, dirX) {
    var d = FX.el('gwave', x, y, '', 800);
    d.animate([{ transform: 'translate(-50%,-50%) scaleX(0.1)', opacity: 1 }, { transform: 'translate(' + (dirX > 0 ? '10%' : '-110%') + ',-50%) scaleX(1)', opacity: 0 }],
      { duration: 620, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' });
  };

  /** 画面のふちが色づく（危険・気合い） */
  FX.vignette = function (color, dur) {
    var d = FX.el('vignette', null, null, '', (dur || 700) + 50);
    d.style.setProperty('--vc', color || 'rgba(255,40,20,0.55)');
    d.animate([{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0 }], { duration: dur || 700, fill: 'forwards' });
  };

  FX.flash = function (cls) { FX.el('flash' + (cls ? ' ' + cls : ''), null, null, '', 400); };

  /** 画面の揺れ（1 小・2 大・3 特大） */
  FX.shake = function (lv) {
    var f = $('field');
    f.classList.remove('shake', 'shake-big', 'shake-huge');
    void f.offsetWidth;
    f.classList.add(lv >= 3 ? 'shake-huge' : lv >= 2 ? 'shake-big' : 'shake');
  };

  /** 場を一瞬寄せる（ズーム） */
  FX.punch = function (s) {
    var l = $('lanes');
    l.animate([{ transform: 'scale(1)' }, { transform: 'scale(' + (s || 1.05) + ')' }, { transform: 'scale(1)' }], { duration: 260, easing: 'ease-out' });
  };

  /** ヒットストップ：動いているものを一瞬止める */
  FX.hitStop = function (ms) {
    var list = document.getAnimations().filter(function (a) { return a.playState === 'running'; });
    list.forEach(function (a) { try { a.pause(); } catch (e) { /* noop */ } });
    return wait(ms).then(function () {
      list.forEach(function (a) { try { if (a.playState === 'paused') a.play(); } catch (e) { /* noop */ } });
    });
  };

  // =================== その行動の情報 ===================
  var A = DN.Anim = {};

  /**
   * o = { u, targets, mv, slot: function (unit) → { sprite, body, svg, root }, t0, tHit }
   */
  A.ctx = function (o) {
    var c = { u: o.u, mv: o.mv, targets: o.targets, t0: o.t0, tHit: o.tHit, slot: o.slot, flags: {} };
    c.mine = o.u.side === 0;
    c.dir = c.mine ? 1 : -1;
    c.s = o.slot(o.u);
    c.ringMs = o.tHit - o.t0;
    // あごの角度（絵ごとに違う。art-tyranno.js の rig）
    var cu = DN.ART_CUSTOM && DN.ART_CUSTOM[o.u.id];
    c.R = (cu && cu.rig) || { jawOpen: 30, jawClose: -3 };
    c.part = function (name) { return c.s.svg ? c.s.svg.querySelector('.' + name) : null; };
    /** 恐竜の絵の中の位置（fx, fy = 右向きの絵での割合）→ 場の中の位置 */
    c.pt = function (unit, fx, fy) {
      var s = o.slot(unit), f = FX.fieldRect(), r = (s.svg || s.body).getBoundingClientRect();
      var ux = unit.side === 0 ? fx : 1 - fx;
      return { x: r.left - f.left + r.width * ux, y: r.top - f.top + r.height * fy };
    };
    c.center = function (unit) { return c.pt(unit, 0.5, 0.58); };
    c.head = function (unit) {
      var hp = DN.art.headPoint(unit.d);
      return c.pt(unit, hp[0], hp[1]);
    };
    // 飛びかかる向きと距離（sprite の中の長さ）
    var sp = c.s.sprite, a = sp.getBoundingClientRect();
    var sc = a.width / (sp.offsetWidth || a.width);
    var tx = 0, ty = 0;
    o.targets.forEach(function (t) { var r = o.slot(t).sprite.getBoundingClientRect(); tx += r.left + r.width / 2; ty += r.top + r.height / 2; });
    tx /= o.targets.length; ty /= o.targets.length;
    c.dx = (tx - (a.left + a.width / 2)) / sc;
    c.dy = (ty - (a.top + a.height / 2)) / sc;
    c.aoe = o.targets.length > 1;
    c.cur = 'translate(0px,0px)';
    /** 相手に向かって k の割合だけ進んだ位置 */
    c.T = function (k, y, s, r, sx) {
      return 'translate(' + (c.dx * k).toFixed(1) + 'px,' + (c.dy * k + (y || 0)).toFixed(1) + 'px) rotate(' + ((r || 0) * c.dir) + 'deg) scale(' + ((sx || 1) * (s || 1)) + ',' + (s || 1) + ')';
    };
    /** 体ごと動かす（frames は transform の文字列の並び） */
    c.move = function (frames, dur, easing, delay) {
      var kf = frames.map(function (f) { return typeof f === 'string' ? { transform: f } : f; });
      if (kf[0].transform === undefined) kf[0].transform = c.cur;
      c.cur = kf[kf.length - 1].transform;
      return sp.animate(kf, { duration: dur, easing: easing || 'ease-out', fill: 'forwards', delay: delay || 0 });
    };
    /** 部品を回す（deg の並び。部品がない恐竜では何もしない） */
    c.rot = function (name, degs, dur, easing, delay) {
      var el = c.part(name);
      if (!el) return null;
      c.partCur = c.partCur || {};
      return el.animate(degs.map(function (d) { return { transform: typeof d === 'string' ? d : 'rotate(' + d + 'deg)' }; }),
        { duration: dur, easing: easing || 'ease-out', fill: 'forwards', delay: delay || 0 });
    };
    /** 体を光らせる */
    c.glow = function (color, dur) {
      c.s.body.animate([{ filter: 'drop-shadow(0 0 0 ' + color + ')' }, { filter: 'drop-shadow(0 0 10px ' + color + ') drop-shadow(0 0 4px ' + color + ') brightness(1.25)' }, { filter: 'drop-shadow(0 0 0 ' + color + ')' }],
        { duration: dur || 600, easing: 'ease-in-out' });
    };
    c.ghost = function (op) { FX.ghost(c.s.svg, { flip: !c.mine, op: op || 0.45, dino: o.u.d }); };
    c.ghosts = function (n, gap, op) { for (var i = 0; i < n; i++) setTimeout(function () { c.ghost(op); }, i * gap); };
    /** 相手をはじき飛ばす */
    c.knock = function (t, dist, up, dur) {
      var sp2 = o.slot(t).sprite, d = c.dir * (dist || 18);
      sp2.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(' + d + 'px,' + (-(up || 0)) + 'px) rotate(' + (c.dir * 8) + 'deg)' }, { transform: 'translate(0,0)' }],
        { duration: dur || 420, easing: 'cubic-bezier(.2,.9,.3,1)' });
    };
    return c;
  };

  /** 元にもどす（動きをすべて消して、ふだんの動きに戻す） */
  A.reset = function (c) {
    c.s.sprite.getAnimations().forEach(function (a) { a.cancel(); });
    if (c.s.svg) c.s.svg.querySelectorAll('g[class^="p-"]').forEach(function (g) { g.getAnimations().forEach(function (a) { if (a instanceof CSSAnimation) return; a.cancel(); }); });
  };

  function backHome(c, dur) {
    c.rot('p-head', [0], dur);
    c.rot('p-jaw', [0], dur);
    c.rot('p-tail', [0], dur);
    c.move([c.cur, 'translate(0px,0px)'], dur || 300, 'cubic-bezier(.3,.7,.4,1)');
    return wait(dur || 300);
  }

  // =================== 技ごとの動き ===================
  var LIB = {};
  function def(name, o) {
    LIB[name] = Object.assign({
      lead: 0.18, shake: 1, stop: 50, sticker: null,
      windup: function (c) { c.move([c.cur, c.T(-0.05, 0, 0.97, -3)], c.ringMs - 200); },
      strike: function (c) { sfx().swing(); c.move([c.cur, c.T(0.68, 0, 1.06)], this.lead * 1000, 'cubic-bezier(.6,0,.9,.5)'); },
      impact: function () {},
      after: function () { return Promise.resolve(); },
      recover: function (c) { return backHome(c, 300); }
    }, o);
  }

  // ---- ティラノ：クラッシュファング（大きく口を開けて飛びかかり、噛み砕く）----
  def('crushBite', {
    lead: 0.22, shake: 3, stop: 120, sticker: 'sticker_bite',
    windup: function (c) {
      var ring = c.ringMs;
      c.move([c.cur, c.T(-0.08, 5, 0.95, -6)], ring * 0.55, 'cubic-bezier(.2,.8,.3,1)');
      c.rot('p-head', [0, -16], ring * 0.55);
      c.rot('p-jaw', [0, c.R.jawOpen], ring * 0.6, 'cubic-bezier(.3,.6,.3,1)');
      c.rot('p-tail', [0, 8], ring * 0.55);
      setTimeout(function () { sfx().growl(); c.glow('#ff3a1a', 700); FX.vignette('rgba(255,30,10,0.5)', 700); }, ring * 0.25);
    },
    strike: function (c) {
      sfx().swing();
      c.move([c.cur, c.T(0.74, 2, 1.14, 8)], 220, 'cubic-bezier(.7,0,.9,.4)');
      c.rot('p-head', [-16, 10], 220);
      c.rot('p-tail', [8, -10], 220);
      c.ghosts(4, 45, 0.4);
      FX.speedLines(c.mine ? 0 : 180, 420);
    },
    impact: function (c, t, hit, h) {
      c.rot('p-jaw', [c.R.jawOpen, c.R.jawClose], 70, 'ease-in');
      var p = c.center(t);
      sfx().crunch();
      FX.bite(p.x, p.y, 1.2, true);
      FX.sticker(T('sticker_bite'), p.x + c.dir * 30, p.y - 36, { size: 38, cls: 'red' });
      FX.particles(p.x, p.y, { n: 16, speed: 120, colors: ['#fff', '#ffe27a', '#ff9a3a'], shape: 'spark' });
      FX.particles(p.x, p.y + 10, { n: 8, speed: 80, colors: ['#8a6a4a', '#5e4630'], shape: 'rock', size: 8, gravity: 90 });
      FX.shock(p.x, p.y, { size: 170, color: '#fff3c0', width: 6 });
      FX.punch(1.07);
      c.knock(t, 16, 6);
    },
    after: function (c) {
      // 噛んだまま首を振る
      c.rot('p-head', [10, -10, 12, -6, 0], 380, 'ease-in-out');
      c.move([c.cur, c.T(0.74, 0, 1.14, -4), c.T(0.74, 0, 1.14, 8), c.T(0.72, 0, 1.12, 0)], 380, 'ease-in-out');
      return wait(380);
    }
  });

  // ---- ティラノ：暴君のおたけび（のけぞってほえ、衝撃波で相手をひるませてから体当たり）----
  def('roar', {
    lead: 0.2, shake: 2, stop: 70, sticker: 'sticker_roar',
    windup: function (c) {
      var ring = c.ringMs;
      c.move([c.cur, c.T(-0.06, 2, 1.02, -9)], ring * 0.35, 'cubic-bezier(.2,.8,.3,1)');
      c.rot('p-head', [0, -26], ring * 0.35, 'cubic-bezier(.2,.8,.3,1)');
      c.rot('p-jaw', [0, c.R.jawOpen + 6], ring * 0.3, 'cubic-bezier(.2,.8,.3,1)');
      c.rot('p-tail', [0, 12], ring * 0.4);
      setTimeout(function () {
        sfx().roarBig();
        var m = c.head(c.u);
        FX.sticker(T('sticker_roar'), m.x + c.dir * 10, m.y - 40, { size: 34, rot: c.dir * -8, cls: 'red', life: 1100 });
        FX.vignette('rgba(255,50,20,0.45)', 900);
        for (var i = 0; i < 4; i++) {
          (function (k) {
            setTimeout(function () {
              var mm = c.head(c.u);
              FX.shock(mm.x + c.dir * 16, mm.y, { size: 90 + k * 60, color: 'rgba(255,240,200,0.9)', width: 5, dur: 480 });
              FX.shake(1);
            }, k * 140);
          })(i);
        }
        c.targets.forEach(function (t) {
          c.slot(t).sprite.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(' + (c.dir * 8) + 'px,0) scale(0.96)' }, { transform: 'translate(0,0)' }], { duration: 500, delay: 150 });
        });
        c.glow('#ff5a1a', 900);
      }, ring * 0.22);
    },
    strike: function (c) {
      sfx().swing();
      c.rot('p-head', [-26, 12], 200);
      c.rot('p-jaw', [c.R.jawOpen + 6, 0], 200);
      c.move([c.cur, c.T(0.6, 0, 1.1, 6)], 200, 'cubic-bezier(.7,0,.9,.4)');
      c.ghosts(3, 50, 0.35);
    },
    impact: function (c, t) {
      var p = c.center(t);
      sfx().thud();
      FX.shock(p.x, p.y, { size: 190, color: '#ffd23a', width: 7 });
      FX.particles(p.x, p.y, { n: 12, speed: 110 });
      FX.sticker(T('sticker_smash'), p.x, p.y - 40, { size: 30 });
      c.knock(t, 14, 4);
    },
    after: function (c) {
      c.move([c.cur, c.T(0.3, 0, 1.04, -6)], 260, 'ease-out');
      c.rot('p-head', [12, -18, 0], 520);
      c.rot('p-jaw', [0, c.R.jawOpen, 0], 520);
      c.glow('#ff3a1a', 600);
      return wait(300);
    }
  });

  // ---- 噛みつき（回復つき）----
  def('bite', {
    lead: 0.2, shake: 2, stop: 70, sticker: 'sticker_bite',
    strike: function (c) {
      sfx().swing();
      c.move([c.cur, c.T(0.7, 0, 1.08, 6)], 200, 'cubic-bezier(.7,0,.9,.4)');
      c.rot('p-jaw', [0, c.R.jawOpen], 150);
      c.ghosts(2, 60);
    },
    impact: function (c, t) {
      var p = c.center(t);
      c.rot('p-jaw', [c.R.jawOpen, c.R.jawClose], 70);
      sfx().crunch();
      FX.bite(p.x, p.y, 0.9);
      FX.sticker(T('sticker_bite'), p.x, p.y - 34);
      FX.particles(p.x, p.y, { n: 10 });
    },
    after: function (c) {
      if (c.mv.effect === 'drain') {
        var a = c.center(c.targets[0]), b = c.center(c.u);
        FX.orbs(a, b, { color: 'radial-gradient(circle,#eaffd0,#5cf07a 60%,transparent 70%)' });
        return wait(420);
      }
      return Promise.resolve();
    }
  });

  // ---- かぎづめ連撃（2回ひっかく）----
  def('flurry', {
    lead: 0.2, shake: 1, stop: 50,
    windup: function (c) { c.move([c.cur, c.T(-0.06, 8, 0.92, -8)], c.ringMs - 200, 'cubic-bezier(.2,.8,.3,1)'); },
    strike: function (c) {
      sfx().swing();
      c.move([c.cur, c.T(0.4, -40, 1.05, 16), c.T(0.72, -6, 1.08, 10)], 220, 'ease-out');
      c.ghosts(3, 40);
    },
    impact: function (c, t, hit, h) {
      var p = c.center(t);
      sfx().slash();
      FX.slash(p.x, p.y, h === 0 ? c.dir * 10 : c.dir * -60, { color: h === 0 ? '#fff' : '#ffd23a', scale: 1.1 });
      FX.sticker(T('sticker_slash'), p.x + (h ? -20 : 20), p.y - 30 - h * 10, { size: 26 });
      FX.particles(p.x, p.y, { n: 8, speed: 90, colors: ['#fff', '#cfe8ff'] });
      c.move([c.cur, c.T(0.66, -10, 1.08, h ? -8 : 16), c.T(0.72, -6, 1.08, 10)], 180, 'ease-out');
    }
  });

  // ---- すばやい一撃（先制）----
  def('quick', {
    lead: 0.1, shake: 1, stop: 40,
    windup: function (c) {
      c.move([c.cur, c.T(-0.03, 2, 0.96, -4)], 300);
      setTimeout(function () { c.glow('#9ad8ff', 500); }, 200);
    },
    strike: function (c) {
      sfx().zip();
      c.ghost(0.6);
      c.move([c.cur, c.T(0.74, 0, 1.05, 4)], 90, 'linear');
      FX.speedLines(c.mine ? 0 : 180, 260, { cls: 'blue' });
    },
    impact: function (c, t) {
      var p = c.center(t);
      FX.slash(p.x, p.y, c.dir * 30, { color: '#9ad8ff', scale: 0.8 });
      FX.sticker(T('sticker_quick'), p.x, p.y - 30, { size: 26, cls: 'blue' });
      FX.particles(p.x, p.y, { n: 8, colors: ['#fff', '#9ad8ff'] });
    }
  });

  // ---- 角で突進 ----
  def('charge', {
    lead: 0.3, shake: 3, stop: 100,
    windup: function (c) {
      var ring = c.ringMs;
      c.move([c.cur, c.T(-0.08, 6, 0.95, 8)], ring * 0.4, 'ease-out');
      var n = 0;
      var iv = setInterval(function () {
        if (++n > 4) { clearInterval(iv); return; }
        var b = c.pt(c.u, 0.25, 0.95);
        FX.particles(b.x, b.y, { n: 5, angle: c.mine ? 200 : -20, spread: 30, speed: 50, colors: ['#c9a36a', '#a88450'], size: 9, gravity: -10 });
        sfx().stamp();
      }, ring * 0.12);
      setTimeout(function () { FX.sticker(T('sticker_charge'), c.center(c.u).x, c.center(c.u).y - 50, { size: 26 }); }, ring * 0.3);
    },
    strike: function (c) {
      sfx().swing();
      c.move([c.cur, c.T(0.8, 0, 1.1, 10)], 300, 'cubic-bezier(.6,0,.9,.6)');
      c.ghosts(5, 50, 0.35);
      FX.speedLines(c.mine ? 0 : 180, 460);
    },
    impact: function (c, t) {
      var p = c.center(t);
      sfx().thud();
      FX.shock(p.x, p.y, { size: 200, color: '#fff', width: 8 });
      FX.particles(p.x, p.y, { n: 18, speed: 140 });
      FX.sticker(T('sticker_smash'), p.x, p.y - 40, { size: 36 });
      FX.punch(1.06);
      c.knock(t, 28, 0, 500);
    }
  });

  // ---- 角でかちあげる ----
  def('hoist', {
    lead: 0.2, shake: 2, stop: 70,
    strike: function (c) { sfx().swing(); c.move([c.cur, c.T(0.72, 4, 1.06, 12), c.T(0.72, -8, 1.06, -14)], 240, 'ease-out'); c.ghosts(2, 60); },
    impact: function (c, t) {
      var p = c.center(t);
      sfx().thud();
      FX.shock(p.x, p.y, { size: 150 });
      FX.sticker(T('sticker_toss'), p.x, p.y - 44, { size: 30 });
      FX.particles(p.x, p.y, { n: 12, angle: -90, spread: 50, speed: 130 });
      c.knock(t, 6, 44, 560);
    }
  });

  // ---- しっぽでなぐる（背中を向けて回転）----
  def('tailSmash', {
    lead: 0.24, shake: 3, stop: 100,
    windup: function (c) {
      c.move([c.cur, c.T(0.3, 0, 1, 0, -1)], c.ringMs * 0.5, 'ease-in-out'); // 背中を向ける
      setTimeout(function () { sfx().swing(); }, c.ringMs * 0.4);
    },
    strike: function (c) {
      c.move([c.cur, c.T(0.62, -4, 1.06, -14, -1)], 240, 'cubic-bezier(.6,0,.9,.5)');
      c.ghosts(3, 50);
    },
    impact: function (c, t) {
      var p = c.center(t);
      sfx().thud();
      FX.swoosh(p.x - c.dir * 20, p.y, !c.mine, { scale: 1.3, color: '#ffe8a0' });
      FX.shock(p.x, p.y, { size: 180, width: 7 });
      FX.particles(p.x, p.y + 10, { n: 10, colors: ['#8a6a4a', '#5e4630', '#b39068'], shape: 'rock', size: 9, gravity: 100, speed: 120 });
      FX.sticker(T('sticker_smash'), p.x, p.y - 44, { size: 36 });
      FX.punch(1.06);
      c.knock(t, 24);
    },
    recover: function (c) { c.move([c.cur, c.T(0.2, 0, 1, 0, 1), 'translate(0px,0px)'], 420, 'ease-in-out'); return wait(420); }
  });

  // ---- 体当たり ----
  def('tackle', {
    lead: 0.2, shake: 2, stop: 70,
    windup: function (c) { c.move([c.cur, c.T(-0.07, 0, 1, -6)], c.ringMs - 200); setTimeout(function () { sfx().stamp(); }, 300); },
    strike: function (c) { sfx().swing(); c.move([c.cur, c.T(0.72, 0, 1.08, -6)], 200, 'cubic-bezier(.7,0,.9,.4)'); c.ghosts(3, 50); },
    impact: function (c, t) {
      var p = c.center(t);
      sfx().thud();
      FX.shock(p.x, p.y, { size: 160 });
      FX.sticker(T('sticker_bash'), p.x, p.y - 40, { size: 30 });
      FX.particles(p.x, p.y, { n: 10 });
      c.knock(t, 20);
    }
  });

  // ---- 背板の光（その場から光線）----
  def('flash', {
    lead: 0.12, shake: 1, stop: 60,
    windup: function (c) {
      var n = 0;
      var iv = setInterval(function () { if (++n > 3) { clearInterval(iv); return; } c.glow('#ffe060', 300); sfx().charge(n); }, c.ringMs * 0.2);
      c.move([c.cur, c.T(-0.03, 2, 1.03, -3)], c.ringMs * 0.6);
    },
    strike: function (c) {
      var a = c.pt(c.u, 0.5, 0.25), b = c.center(c.targets[0]);
      sfx().zap();
      FX.beam(a.x, a.y, b.x, b.y, { color: '#fff6a0' });
      FX.flash('gold');
    },
    impact: function (c, t) {
      var p = c.center(t);
      FX.shock(p.x, p.y, { size: 150, color: '#fff6a0' });
      FX.particles(p.x, p.y, { n: 14, colors: ['#fff', '#fff6a0', '#ffe060'], shape: 'spark' });
      FX.sticker(T('sticker_flash'), p.x, p.y - 40, { size: 30, cls: 'gold' });
    },
    recover: function (c) { return backHome(c, 200); }
  });

  // ---- 全体：ふみならし ----
  def('stomp', {
    lead: 0.14, shake: 3, stop: 90,
    windup: function (c) { c.move([c.cur, c.T(0.1, -26, 1.02, -14)], c.ringMs - 140, 'cubic-bezier(.2,.8,.3,1)'); },
    strike: function (c) { c.move([c.cur, c.T(0.14, 4, 1.04, 4)], 140, 'cubic-bezier(.7,0,1,.5)'); },
    impact: function (c, t) {
      if (!c.flags.wave) {
        c.flags.wave = true;
        var g = c.pt(c.u, 0.6, 0.96);
        sfx().quake();
        FX.groundWave(g.x, g.y, c.dir);
        FX.particles(g.x, g.y, { n: 14, angle: -90, spread: 70, speed: 110, colors: ['#b39068', '#8a6a4a', '#d6bc8e'], shape: 'rock', size: 9, gravity: 120 });
        FX.sticker(T('sticker_stomp'), g.x + c.dir * 60, g.y - 60, { size: 40 });
        FX.punch(1.04);
      }
      var p = c.center(t);
      FX.particles(p.x, p.y + 20, { n: 6, angle: -90, spread: 40, speed: 70, colors: ['#b39068', '#8a6a4a'], shape: 'rock', gravity: 80 });
      c.knock(t, 4, 26, 480);
    }
  });

  // ---- 首のひとふり ----
  def('whip', {
    lead: 0.2, shake: 2, stop: 70,
    windup: function (c) { c.move([c.cur, c.T(0.1, 0, 1, -12)], c.ringMs - 200); },
    strike: function (c) { sfx().swing(); c.move([c.cur, c.T(0.55, 0, 1.06, 16)], 200, 'cubic-bezier(.7,0,.9,.4)'); },
    impact: function (c, t) {
      var p = c.center(t);
      sfx().thud();
      FX.swoosh(p.x, p.y - 10, !c.mine, { scale: 1.2 });
      FX.sticker(T('sticker_whip'), p.x, p.y - 44, { size: 30 });
      FX.particles(p.x, p.y, { n: 10 });
      c.knock(t, 22);
    }
  });

  // ---- 急降下（画面の上へ飛んでから落ちてくる）----
  def('dive', {
    lead: 0.2, shake: 2, stop: 80,
    windup: function (c) {
      c.move([c.cur, c.T(-0.05, -12, 1, -12), c.T(0.25, -260, 0.7, -20)], c.ringMs - 200, 'cubic-bezier(.4,0,.8,.6)');
      setTimeout(function () { sfx().wind(); }, 100);
    },
    strike: function (c) {
      sfx().dive();
      c.move([c.cur, c.T(0.74, 0, 1.12, 34)], 200, 'cubic-bezier(.7,0,.9,.4)');
      c.ghosts(3, 45);
      FX.speedLines(c.mine ? 60 : 120, 360);
    },
    impact: function (c, t) {
      var p = c.center(t);
      sfx().thud();
      FX.shock(p.x, p.y, { size: 180 });
      FX.particles(p.x, p.y, { n: 16, speed: 130 });
      FX.sticker(T('sticker_dive'), p.x, p.y - 44, { size: 34 });
      c.knock(t, 10, -10);
    },
    recover: function (c) { c.move([c.cur, c.T(0.3, -60, 0.95, -10), 'translate(0px,0px)'], 420, 'ease-out'); return wait(420); }
  });

  // ---- 全体：翼の突風 ----
  def('gust', {
    lead: 0.16, shake: 1, stop: 40,
    windup: function (c) {
      c.move([c.cur, c.T(0, -24, 1.04, -6), c.T(0, -14, 0.96, -2), c.T(0, -28, 1.04, -6), c.T(0, -18, 1, -4)], c.ringMs - 160, 'ease-in-out');
    },
    strike: function (c) { sfx().wind(); c.move([c.cur, c.T(0.1, -20, 1.1, 8)], 160); },
    impact: function (c, t) {
      if (!c.flags.w) {
        c.flags.w = true;
        var p0 = c.center(t);
        FX.sticker(T('sticker_gust'), (p0.x + c.center(c.u).x) / 2, 40, { size: 32, cls: 'blue' });
      }
      var p = c.center(t);
      FX.wind(p.x, p.y, c.dir);
      c.knock(t, 14);
    }
  });

  // ---- 全体：うずしお ----
  def('swirl', {
    lead: 0.14, shake: 1, stop: 40,
    windup: function (c) { c.move([c.cur, c.T(0, 0, 1.02, -8), c.T(0, 0, 1.02, 8), c.T(0, 0, 1, -4)], c.ringMs - 140, 'ease-in-out'); },
    strike: function (c) { sfx().splash(); c.move([c.cur, c.T(0.12, 0, 1.06, 6)], 140); },
    impact: function (c, t) {
      var p = c.center(t);
      FX.vortex(p.x, p.y);
      FX.particles(p.x, p.y + 16, { n: 10, angle: -90, spread: 60, speed: 110, colors: ['#e8f8ff', '#9ad8ff', '#4ab0f0'], gravity: 110 });
      if (!c.flags.s) { c.flags.s = true; FX.sticker(T('sticker_splash'), p.x, 40, { size: 32, cls: 'blue' }); }
    }
  });

  // ---- 飛び上がってのしかかる ----
  def('press', {
    lead: 0.16, shake: 3, stop: 110,
    windup: function (c) {
      c.move([c.cur, c.T(-0.04, 6, 0.9, 0), c.T(0.72, -120, 1, 0)], c.ringMs - 160, 'cubic-bezier(.3,.7,.4,1)');
      setTimeout(function () { sfx().swing(); }, 200);
    },
    strike: function (c) { c.move([c.cur, c.T(0.72, -6, 1.14, 0)], 160, 'cubic-bezier(.8,0,1,.6)'); },
    impact: function (c, t) {
      var p = c.center(t);
      sfx().quake();
      FX.shock(p.x, p.y + 20, { size: 220, squash: 0.35, width: 8 });
      FX.particles(p.x, p.y + 20, { n: 14, angle: -90, spread: 80, speed: 120, colors: ['#b39068', '#8a6a4a', '#d6bc8e'], shape: 'rock', size: 9, gravity: 120 });
      FX.sticker(T('sticker_press'), p.x, p.y - 50, { size: 40 });
      FX.punch(1.06);
      c.slot(t).sprite.animate([{ transform: 'scale(1,1)' }, { transform: 'scale(1.15,0.8)' }, { transform: 'scale(1,1)' }], { duration: 360, easing: 'ease-out' });
    }
  });

  // ---- 突き刺す ----
  def('stab', {
    lead: 0.16, shake: 1, stop: 60,
    strike: function (c) { sfx().swing(); c.move([c.cur, c.T(0.7, 0, 1.05, 4)], 160, 'cubic-bezier(.7,0,.9,.4)'); },
    impact: function (c, t) {
      var p = c.center(t);
      sfx().slash();
      FX.slash(p.x, p.y, c.dir * 70, { scale: 0.8 });
      FX.sticker(T('sticker_stab'), p.x, p.y - 36, { size: 28 });
      FX.particles(p.x, p.y, { n: 10, angle: c.mine ? 0 : 180, spread: 40, speed: 110 });
    }
  });

  A.get = function (mv) { return LIB[mv.anim] || LIB.tackle; };
  A.names = Object.keys(LIB);
})(window);
