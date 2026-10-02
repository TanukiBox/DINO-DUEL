/*
 * DINO DUEL バトル画面（場・行動順・下半分の操作パネル・タイミングの輪・演出）
 * ルールの計算は battle.js。ここは見せ方と操作だけ。
 *
 *   DN.BattleView.start({ team: [...3], foes: [...3], level: 0, arena: 0, intro: 'final' | 'boss' | null, tutorial: false,
 *                         onEnd: function (won, turns, info) {} });   // info = { perfects, bestChain, combo, quit }
 *
 * バトルの速さ（設定の ×2）：タイミングの輪は いつも同じ速さ（腕前は変わらない）。それ以外の演出と待ち時間を速くする。
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};
  var CFG = DN.CFG, B = DN.Battle;

  function $(id) { return document.getElementById(id); }
  function T(k, p) { return DN.app.i18n.t(k, p); }
  function L(o) { return o[DN.app.i18n.lang] || o.en; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms / (DN.timeScale || 1)); }); }
  // 演出を速くする／もとに戻す（輪が出ている間は、もとの速さ）
  DN.timeScale = 1;
  function fast(on) { DN.timeScale = on ? (DN.app.prefs.speed || 1) : 1; }
  // 速さを変えている間は、新しく始まる動き（WAAPI）もその速さで再生する
  if (typeof Element !== 'undefined' && !Element.prototype.__dnAnimate) {
    var baseAnimate = Element.prototype.animate;
    Element.prototype.__dnAnimate = baseAnimate;
    Element.prototype.animate = function () {
      var a = baseAnimate.apply(this, arguments);
      if (DN.timeScale > 1) { try { a.playbackRate = DN.timeScale; } catch (e) { /* noop */ } }
      return a;
    };
  }
  function nextFrame() { return new Promise(function (r) { requestAnimationFrame(r); }); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var RC = { N: 'var(--r-N)', R: 'var(--r-R)', SR: 'var(--r-SR)', SSR: 'var(--r-SSR)', EX: '#ff5ad0' };

  var V = DN.BattleView = {};
  var st = null, lv = null, opts = null;
  var slots = {};          // uid → 画面の部品
  var choices = {};        // uid → 技番号
  var acting = false;
  var pendingTap = null;   // タイミング待ちのときだけ関数が入る
  var runId = 0;           // 途中でやめたとき、古い処理を止めるため
  var chain = 0;           // 「ぴったり」の連続回数
  var rec = null;          // この試合の記録（実績用）：{ perfects, bestChain }
  var lastChoices = {};    // 前のターンにえらんだ技（「前回と同じ」ボタン）
  var tut = null;          // チュートリアル中：{ atk: 練習ずみ, def: 練習ずみ }
  function ringSec() { return CFG.RING_SEC * (tut ? 1.5 : 1); }

  // ---------------- 場 ----------------
  function buildField() {
    var lanes = $('lanes');
    lanes.innerHTML = '';
    $('fx').innerHTML = '';
    slots = {};
    for (var lane = 0; lane < 3; lane++) {
      var row = document.createElement('div');
      row.className = 'lane lane' + lane;
      [0, 1].forEach(function (side) {
        var u = st.units.filter(function (x) { return x.side === side && x.lane === lane; })[0];
        var s = document.createElement('div');
        var isPix = DN.Pix && DN.Pix.has(u.d.id);   // ドット絵の恐竜（Blender から作った絵とコマ送り）
        s.className = 'slot ' + (side === 0 ? 'me' : 'foe') + (isPix ? ' pix-slot' : '');
        s.style.setProperty('--rc', RC[u.d.rarity]);
        s.innerHTML =
          '<div class="hud"><span class="lvb">Lv' + u.lv + (u.stack ? '+' + u.stack : '') + '</span><span class="nm">' + esc(L(u.d.name)) + '</span>' +
          '<span class="hpbar"><i></i></span><span class="hpn"></span><span class="buffs"></span></div>' +
          '<div class="sprite"><div class="body" style="animation-delay:-' + (Math.random() * 1.8).toFixed(2) + 's">' + (isPix ? DN.Pix.html(u.d.id) : DN.art.img(u.d)) + '</div></div>';
        row.appendChild(s);
        slots[u.uid] = {
          root: s, hp: s.querySelector('.hpbar i'), hpn: s.querySelector('.hpn'), buffs: s.querySelector('.buffs'),
          sprite: s.querySelector('.sprite'), body: s.querySelector('.body')
        };
        updateHud(u);
      });
      lanes.appendChild(row);
    }
    // ドット絵：1ドットの大きさを場に合わせて決め、待機の動きを始める
    if (DN.Pix && lanes.querySelector('.pix')) {
      var spr = lanes.querySelector('.sprite');
      DN.Pix.fit($('field'), spr.clientWidth, spr.clientHeight);
      lanes.querySelectorAll('.pix').forEach(function (el) { DN.Pix.mount(el); });
    }
  }

  function updateHud(u) {
    var s = slots[u.uid], r = u.hp / u.maxHp;
    s.hp.style.width = (r * 100).toFixed(1) + '%';
    s.hp.className = r > 0.5 ? '' : r > 0.25 ? 'mid' : 'low';
    s.hpn.textContent = u.hp;
    var b = '';
    if (u.st.atkUp) b += '<b class="up">' + T('chip_atkUp') + (u.st.atkUp > 1 ? u.st.atkUp : '') + '</b>';
    if (u.st.defDown) b += '<b>' + T('chip_defDown') + (u.st.defDown > 1 ? u.st.defDown : '') + '</b>';
    if (u.st.spdDown) b += '<b>' + T('chip_spdDown') + (u.st.spdDown > 1 ? u.st.spdDown : '') + '</b>';
    s.buffs.innerHTML = b;
    s.root.classList.toggle('pumped', u.st.atkUp > 0 && u.alive);
    if (!u.alive) s.root.classList.add('dead');
  }

  /** 場の中での位置（演出の文字や光を置く） */
  function spot(u, fy) {
    var f = $('field').getBoundingClientRect(), r = slots[u.uid].body.getBoundingClientRect();
    return { x: r.left - f.left + r.width / 2, y: r.top - f.top + r.height * (fy === undefined ? 0.45 : fy) };
  }

  function fx(cls, html, p) {
    var d = document.createElement('div');
    d.className = cls;
    if (html) d.innerHTML = html;
    if (p) { d.style.left = p.x + 'px'; d.style.top = p.y + 'px'; }
    $('fx').appendChild(d);
    setTimeout(function () { d.remove(); }, 1200);
    return d;
  }
  function floatNum(u, text, cls, fy) { fx('float-num ' + (cls || ''), esc(text), spot(u, fy)); }
  function shake(big) {
    var f = $('field');
    f.classList.remove('shake', 'shake-big');
    void f.offsetWidth;
    f.classList.add(big ? 'shake-big' : 'shake');
  }
  function splash(text) { fx('splash', esc(text)); }

  // ---------------- 行動順 ----------------
  function renderOrder(list, now) {
    var o = $('order');
    var h = '<span class="lbl">' + T('order') + '</span>';
    list.forEach(function (a, i) {
      var u = a.unit;
      var cls = 'oi ' + (u.side ? 'foe' : 'me');
      if (!u.alive) cls += ' dead';
      else if (now !== undefined && i < now) cls += ' done';
      if (i === now) cls += ' now';
      h += '<span class="' + cls + '">' + DN.art.img(u.d, { crop: true }) + '</span>';
    });
    o.innerHTML = h;
  }
  function previewOrder() {
    var ch = {};
    st.units.forEach(function (u) { ch[u.uid] = choices[u.uid] !== undefined ? choices[u.uid] : 0; });
    renderOrder(B.order(st, ch));
  }

  // ---------------- 下半分：技をえらぶ ----------------
  // 技ボタンの色とマーク（技の動きの種類ごと）
  var KIND = {
    crushBite: 'fang', bite: 'fang', roar: 'roar', flurry: 'claw', stab: 'claw', quick: 'quick', charge: 'horn', hoist: 'horn',
    tailSmash: 'tail', whip: 'tail', tackle: 'shield', flash: 'flash', stomp: 'stomp', press: 'stomp', dive: 'wing', gust: 'wing', swirl: 'water'
  };
  var ICON = {
    fang: '<path d="M4 5 H20 L17 9 L15 19 L12.5 9 H11.5 L9 19 L7 9 Z"/>',
    roar: '<path d="M3 9 H7 L12 5 V19 L7 15 H3 Z"/><path d="M15 8 C17 10 17 14 15 16 M18 5 C22 9 22 15 18 19" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>',
    claw: '<path d="M5 3 C9 9 12 14 13 21 M10 2 C14 8 17 13 18 20 M15 2 C18 7 21 11 22 17" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>',
    quick: '<path d="M13 2 L4 14 H11 L9 22 L20 9 H13 Z"/>',
    horn: '<path d="M3 20 C8 18 12 13 14 7 L21 3 C20 10 16 17 8 22 Z"/>',
    tail: '<path d="M3 20 C6 12 12 8 18 8" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/><circle cx="19" cy="7" r="3.6"/>',
    shield: '<path d="M12 2 L21 5 C21 13 18 19 12 22 C6 19 3 13 3 5 Z"/>',
    flash: '<path d="M12 1 L14.5 9 L23 12 L14.5 15 L12 23 L9.5 15 L1 12 L9.5 9 Z"/>',
    stomp: '<path d="M6 3 H18 V9 L21 13 H3 L6 9 Z"/><path d="M4 17 H20 M7 21 H17" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>',
    wing: '<path d="M2 16 C6 6 14 3 22 4 C19 7 18 9 18 11 C15 11 13 13 12 15 C9 14 5 15 2 16 Z"/>',
    water: '<path d="M2 14 C5 10 8 10 11 14 C14 18 17 18 20 14 C21 13 22 13 22 13 V20 H2 Z"/><path d="M12 3 C15 7 16 9 16 11 A4 4 0 0 1 8 11 C8 9 9 7 12 3 Z"/>'
  };
  function kindOf(mv) { return KIND[mv.anim] || 'shield'; }

  function moveButton(u, i) {
    var mv = DN.move(u.d.moves[i]), k = kindOf(mv);
    var tag = mv.effect ? '<span class="tag ' + mv.effect + '">' + T('eff_' + mv.effect) + '</span>' : '';
    var accTxt = mv.acc < 100 ? T('acc', { n: mv.acc }) : '';
    var desc = mv.effect ? T('desc_' + mv.effect) : T('desc_none', { acc: accTxt });
    return '<button class="mv k-' + k + '" data-uid="' + u.uid + '" data-i="' + i + '" title="' + esc(desc) + '" style="--sd:' + (Math.random() * 3).toFixed(2) + 's">' +
      '<span class="mv-ic"><svg viewBox="0 0 24 24" fill="#fff">' + ICON[k] + '</svg></span>' +
      '<span class="mv-main"><span class="nm">' + esc(L(mv.name)) + '</span>' +
      '<span class="st">' + (accTxt ? '<span class="acc">' + accTxt + '</span>' : '') + tag + '</span></span>' +
      '<span class="mv-pow"><small>' + T('powLabel') + '</small><b>' + mv.power + '</b></span></button>';
  }

  function renderCommand() {
    var p = $('panel');
    var h = '';
    for (var lane = 0; lane < 3; lane++) {
      var u = st.units[lane];
      h += '<div class="cmd-row' + (u.alive ? '' : ' dead') + '" data-uid="' + u.uid + '">' +
        '<div class="who" style="--rc:' + RC[u.d.rarity] + '"><span class="ic">' + DN.art.img(u.d, { crop: true }) + '</span>' +
        '<span class="n">' + esc(L(u.d.name)) + '</span></div>' +
        moveButton(u, 0) + moveButton(u, 1) + '</div>';
    }
    var canSame = B.side(st, 0).every(function (u) { return lastChoices[u.uid] !== undefined; });
    h += '<div class="cmd-foot"><button class="btn small" id="b-quit">' + T('retreat') + '</button>' +
      (canSame ? '<button class="btn small same" id="b-same">' + T('sameAgain') + '</button>' : '<span class="hint" id="pick-hint"></span>') +
      '<button class="btn small spd" id="b-spd">' + T(DN.app.prefs.speed > 1 ? 'speed2' : 'speed1') + '</button>' +
      '<button class="btn small" id="b-snd">' + soundLabel() + '</button></div>';
    p.innerHTML = h;
    p.querySelectorAll('.mv').forEach(function (b) {
      b.addEventListener('click', function (e) { pick(+b.dataset.uid, +b.dataset.i, b, e); });
    });
    $('b-quit').addEventListener('click', function () {
      DN.app.sfx.tap();
      DN.overlay('<div class="confirm"><p>' + T('quitConfirm') + '</p></div>', [
        { label: T('quitYes'), fn: function () { DN.closeOverlay(); V.stop(); if (opts.onEnd) opts.onEnd(false, st.turn, { quit: true, perfects: rec.perfects, bestChain: rec.bestChain }); } },
        { label: T('quitNo'), big: true, fn: DN.closeOverlay }
      ]);
    });
    $('b-snd').addEventListener('click', function () { DN.app.sound.toggle(); DN.app.sfx.tap(); $('b-snd').textContent = soundLabel(); });
    $('b-spd').addEventListener('click', function () {
      var pr = DN.app.prefs;
      pr.speed = pr.speed > 1 ? 1 : 2;
      DN.app.savePrefs();
      DN.app.sfx.tap();
      $('b-spd').textContent = T(pr.speed > 1 ? 'speed2' : 'speed1');
      fast(true);
    });
    var same = $('b-same');
    if (same) same.addEventListener('click', function () {
      if (acting) return;
      B.side(st, 0).forEach(function (u) {
        if (choices[u.uid] !== undefined) return;
        var b = document.querySelector('.cmd-row[data-uid="' + u.uid + '"] .mv[data-i="' + lastChoices[u.uid] + '"]');
        pick(u.uid, lastChoices[u.uid], b, null);
      });
    });
    updatePickHint();
  }
  function soundLabel() { return T('sound') + (DN.app.sound.muted ? ' OFF' : ' ON'); }

  function remaining() {
    return B.side(st, 0).filter(function (u) { return choices[u.uid] === undefined; }).length;
  }
  function updatePickHint() {
    var n = remaining(), el = $('pick-hint');
    if (el) el.textContent = n === B.side(st, 0).length ? T('pickHint') : T('pickHintN', { n: n });
  }

  function pick(uid, i, btn, e) {
    if (acting) return;
    choices[uid] = i;
    DN.app.sfx.press();
    DN.buzz('pick');
    var row = document.querySelector('.cmd-row[data-uid="' + uid + '"]');
    row.classList.add('done');
    row.querySelectorAll('.mv').forEach(function (b) { b.classList.toggle('sel', +b.dataset.i === i); });
    // ボタンがはじける ＋ 場の恐竜が「よし！」と身がまえる
    if (btn) {
      var r = btn.getBoundingClientRect();
      var bx = e && e.clientX ? e.clientX - r.left : r.width / 2, by = e && e.clientY ? e.clientY - r.top : r.height / 2;
      var burst = document.createElement('span');
      burst.className = 'mv-burst';
      burst.style.left = bx + 'px'; burst.style.top = by + 'px';
      btn.appendChild(burst);
      setTimeout(function () { burst.remove(); }, 600);
      btn.animate([{ transform: 'translateY(4px) scale(0.94)' }, { transform: 'translateY(2px) scale(1.04)' }, { transform: 'translateY(3px) scale(1)' }], { duration: 260, easing: 'ease-out' });
    }
    var u = st.units[uid], sl = slots[uid];
    if (sl) {
      sl.sprite.animate([{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-12px) scale(1.06)' }, { transform: 'translateY(0) scale(1)' }], { duration: 300, easing: 'cubic-bezier(.3,1.6,.5,1)' });
      sl.body.animate([{ filter: 'drop-shadow(0 0 0 #ffd23a) brightness(1)' }, { filter: 'drop-shadow(0 0 8px #ffd23a) brightness(1.3)' }, { filter: 'drop-shadow(0 0 0 #ffd23a) brightness(1)' }], { duration: 420 });
      var f = $('field').getBoundingClientRect(), rr = sl.body.getBoundingClientRect();
      fx('ready-pop', T('ready'), { x: rr.left - f.left + rr.width / 2, y: rr.top - f.top + rr.height * 0.2 });
      if (u && DN.move(u.d.moves[i]).anim === 'roar' || (u && DN.move(u.d.moves[i]).power >= 80)) { DN.app.sfx.growl(); }
    }
    previewOrder();
    updatePickHint();
    if (remaining() === 0) {
      acting = true;
      var id = runId;
      setTimeout(function () { if (id === runId) runTurn(id); }, 260);
    }
  }

  // ---------------- ターンの進行 ----------------
  function newTurn() {
    st.turn++;
    choices = {};
    st.ties = {};
    st.units.forEach(function (u) { st.ties[u.uid] = Math.random(); });
    acting = false;
    $('turn-badge').textContent = T('turn', { n: st.turn }) + ' ・ ' + (opts.label || T('lv_' + lv.key));
    splash(T('turn', { n: st.turn }));
    DN.app.sfx.turn();
    fast(true);
    renderCommand();
    previewOrder();
    if (tut && st.turn === 1) coach(T('coachPick'));
  }

  // ---------------- チュートリアルの吹き出し ----------------
  function coach(text) {
    var c = $('coach');
    if (!c) { c = document.createElement('div'); c.id = 'coach'; c.className = 'coach'; $('scr-battle').appendChild(c); }
    c.textContent = text;
    c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
  }
  function coachOff() { var c = $('coach'); if (c) c.remove(); }

  /** チュートリアル：はじめての攻撃・防御の前に、輪だけで練習（「おしい」以上が出るまで。4回まで） */
  async function practiceRing(kind, id) {
    for (var k = 0; k < 4; k++) {
      if (id !== runId) return;
      showPad(kind);
      coach(k === 0 ? T(kind === 'atk' ? 'coachAtk' : 'coachDef') : T('coachAgain'));
      var t0 = performance.now(), tHit = t0 + CFG.RING_SEC * 1.8 * 1000;
      var j = await timingRing(kind, t0, tHit, []);
      await untilTime(tHit);
      await wait(650);
      if (j !== 'miss') { coach(T('coachNice')); await wait(700); break; }
    }
    tut[kind] = true;
    if (tut.atk && tut.def) { coach(T('coachDone')); setTimeout(coachOff, 1800); }
  }

  async function runTurn(id) {
    if (tut && st.turn === 1) coachOff();
    B.side(st, 0).forEach(function (u) { lastChoices[u.uid] = choices[u.uid]; });
    st.units.forEach(function (u) { if (u.side === 1 && u.alive) choices[u.uid] = B.aiChoose(st, u); });
    var acts = B.order(st, choices);
    renderOrder(acts, 0);
    showPad('wait');
    $('tapzone').classList.add('on');
    for (var i = 0; i < acts.length; i++) {
      if (id !== runId) return;
      if (!acts[i].unit.alive) { renderOrder(acts, i); continue; }
      renderOrder(acts, i);
      await playAction(acts[i], id);
      if (id !== runId) return;
      acts.forEach(function (a) { updateHud(a.unit); });
      if (B.winner(st) !== null) break;
      await wait(CFG.ANIM.between * 1000);
    }
    if (id !== runId) return;
    renderOrder(acts, acts.length);
    $('tapzone').classList.remove('on');
    var w = B.winner(st);
    if (w !== null) finish(w === 0);
    else newTurn();
  }

  // ---------------- タイミングの輪 ----------------
  function showPad(kind) {
    var p = $('panel');
    p.innerHTML = '<div class="pad ' + kind + '" id="pad">' +
      (kind === 'wait' ? '' :
        '<div class="pad-rays"></div>' +
        '<div class="pad-label">' + T(kind === 'atk' ? 'tapAtk' : 'tapDef') + '</div>' +
        '<div class="ring-zone"></div>' +
        '<div class="ring-target" id="ring-target">' + padIcon(kind) + '</div>' +
        '<div class="ring echo" id="ring2"></div><div class="ring" id="ring"></div>' +
        '<div class="pad-kind">' + T(kind) + '</div>' +
        (chain >= 2 ? '<div class="chain">' + T('chain', { n: chain }) + '</div>' : '')) +
      '</div>';
  }
  function padIcon(kind) {
    return kind === 'atk'
      ? '<svg viewBox="0 0 40 40"><path d="M6 8 L20 22 L34 8 L30 26 L20 34 L10 26Z" fill="#ff5a36" stroke="#2b1b12" stroke-width="3" stroke-linejoin="round"/><path d="M13 22 l3 5 l3 -4 M21 23 l3 4 l3 -5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>'
      : '<svg viewBox="0 0 40 40"><path d="M20 4 L34 9 C34 22 29 31 20 36 C11 31 6 22 6 9Z" fill="#2f9dff" stroke="#2b1b12" stroke-width="3" stroke-linejoin="round"/><path d="M20 10 L28 13 C28 21 25 27 20 30Z" fill="#bfe3ff"/></svg>';
  }

  /** 判定の演出（輪がくだけて飛び散る・光・文字） */
  function judgeFx(j, kind) {
    var pad = $('pad');
    if (!pad) return;
    var r = pad.getBoundingClientRect(), cx = r.width / 2, cy = r.height * 0.52;
    function add(cls, html) { var d = document.createElement('div'); d.className = cls; if (html) d.innerHTML = html; pad.appendChild(d); return d; }
    var jd = add('judge ' + j);
    jd.textContent = T(j);
    if (j === 'miss') {
      var ring = $('ring');
      if (ring) { ring.style.opacity = '1'; ring.classList.add('dead'); }
      pad.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }], { duration: 220 });
      return;
    }
    var big = j === 'perfect';
    add('burst' + (big ? ' big' : ''));
    if (big) { add('burst big late'); add('pad-flash'); add('pad-rays hit'); }
    // 輪のかけら
    var n = big ? 14 : 8, col = big ? '#ffd23a' : (kind === 'atk' ? '#ff8a5a' : '#8accff');
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2 + Math.random() * 0.3, dist = (big ? 120 : 80) + Math.random() * 40;
      var sh = add('shard');
      sh.style.left = cx + 'px'; sh.style.top = cy + 'px';
      sh.style.background = col;
      sh.animate([
        { transform: 'translate(-50%,-50%) rotate(' + (a * 57) + 'deg) translate(46px,0) scale(1)', opacity: 1 },
        { transform: 'translate(-50%,-50%) rotate(' + (a * 57 + 40) + 'deg) translate(' + dist + 'px,0) scale(0.4)', opacity: 0 }
      ], { duration: 520, easing: 'cubic-bezier(.1,.8,.3,1)', fill: 'forwards' });
    }
    pad.animate([{ transform: 'scale(1)' }, { transform: 'scale(' + (big ? 1.04 : 1.02) + ')' }, { transform: 'translate(-4px,2px) scale(1)' }, { transform: 'translate(3px,-2px)' }, { transform: 'none' }],
      { duration: big ? 320 : 220, easing: 'ease-out' });
    if (big && chain >= 2) {
      var ch = add('chain pop');
      ch.textContent = T('chain', { n: chain });
    }
  }

  /** 輪を縮めて、タップの判定を返す（'perfect' | 'good' | 'miss'） */
  function timingRing(kind, t0, tHit, minis) {
    return new Promise(function (resolve) {
      var ring = $('ring'), echo = $('ring2'), tgt = $('ring-target'), pad = $('pad'), done = false;
      // リズムの合図：当たる瞬間の前に3回「ピッ」（だんだん高く）
      var ticks = [3, 2, 1].map(function (k) {
        return setTimeout(function () {
          if (done) return;
          DN.app.sfx.tick(4 - k);
          if (tgt) tgt.animate([{ transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 160, easing: 'ease-out' });
        }, Math.max(0, tHit - performance.now() - k * 190));
      });
      function finish(j) {
        if (done) return;
        done = true;
        pendingTap = null;
        ticks.forEach(clearTimeout);
        if (ring) ring.style.opacity = '0';
        if (echo) echo.style.opacity = '0';
        if (pad) pad.classList.remove('hot');
        minis.forEach(function (m) { m.remove(); });
        chain = j === 'perfect' ? chain + 1 : 0;
        if (j === 'perfect' && rec) { rec.perfects++; rec.bestChain = Math.max(rec.bestChain, chain); }
        judgeFx(j, kind);
        if (j === 'perfect') { DN.app.sfx.perfect(); DN.app.sfx.shatter(); fx('flash gold'); DN.buzz('perfect'); }
        else if (j === 'good') { DN.app.sfx.good(); DN.app.sfx.shatter(true); }
        else DN.app.sfx.miss();
        resolve(j);
      }
      pendingTap = function (t) {
        var dt = Math.abs(t - tHit);
        finish(dt <= CFG.PERFECT_MS ? 'perfect' : dt <= CFG.GOOD_MS ? 'good' : 'miss');
      };
      // 画面の更新が止まっていても（別のタブを見ていた等）、時間が来たら必ず「外れ」で終える
      setTimeout(function () { finish('miss'); }, tHit - performance.now() + CFG.GOOD_MS + 30);
      (function loop() {
        if (done) return;
        var now = performance.now();
        var p = (now - t0) / (tHit - t0);
        var s = CFG.RING_START - (CFG.RING_START - 1) * p;
        if (ring) {
          ring.style.transform = 'scale(' + Math.max(0.5, s).toFixed(3) + ')';
          ring.style.opacity = p > 1 ? String(Math.max(0, 1 - (p - 1) * 4)) : String(Math.min(1, 0.35 + p));
          ring.style.borderWidth = (6 + 6 * Math.min(1, p)).toFixed(1) + 'px';
        }
        if (echo) {
          var s2 = CFG.RING_START - (CFG.RING_START - 1) * Math.max(0, p - 0.12);
          echo.style.transform = 'scale(' + Math.max(0.5, s2).toFixed(3) + ')';
          echo.style.opacity = p > 1 ? '0' : '0.35';
        }
        if (pad) pad.classList.toggle('hot', Math.abs(now - tHit) <= CFG.GOOD_MS);
        minis.forEach(function (m) { m.style.transform = 'scale(' + Math.max(0.5, 1 + (s - 1) * 0.45).toFixed(3) + ')'; });
        if (now > tHit + CFG.GOOD_MS) { finish('miss'); return; }
        requestAnimationFrame(loop);
      })();
    });
  }

  /** タップした場所に波紋 */
  function ripple(pos) {
    if (!pos || pos.x === null || pos.x === undefined) return;
    var d = document.createElement('div');
    d.className = 'tap-ripple';
    d.style.left = pos.x + 'px';
    d.style.top = pos.y + 'px';
    $('app').appendChild(d);
    setTimeout(function () { d.remove(); }, 500);
  }

  function untilTime(t) {
    var d = t - performance.now();
    return d > 0 ? wait(d) : Promise.resolve();
  }

  // ---------------- 1体の行動 ----------------
  function slotOf(unit) {
    var sl = slots[unit.uid];
    return { sprite: sl.sprite, body: sl.body, svg: sl.body.querySelector('svg') || sl.body.querySelector('img'), root: sl.root, unit: unit };
  }
  /** 技を使う恐竜だけ、部品を動かせる本物の SVG にする（終わったら画像に戻す） */
  function toLive(unit) {
    var b = slots[unit.uid].body;
    if (b.querySelector('.pix')) return;   // ドット絵はコマ送りで動く
    if (!b.querySelector('svg')) b.innerHTML = DN.art.svg(unit.d);
  }
  function toImage(unit) {
    var b = slots[unit.uid].body;
    if (b.querySelector('.pix')) return;
    if (b.querySelector('svg')) b.innerHTML = DN.art.img(unit.d);
  }

  async function playAction(act, id) {
    var u = act.unit, mv = act.move, mine = u.side === 0;
    var targets = B.targets(st, u, mv);
    if (!targets.length) return;
    var kind = mine ? 'atk' : 'def';
    // チュートリアル：はじめての攻撃・防御の前に練習
    if (tut && !tut[kind]) { fast(false); await practiceRing(kind, id); if (id !== runId) return; }
    fast(false);   // 輪が出ている間は、もとの速さ

    // 技名
    var ban = fx('banner k-' + kindOf(mv) + (mine ? '' : ' foe'), '<small>' + esc(T('uses', { name: L(u.d.name) })) + '</small>' + esc(L(mv.name)));
    slots[u.uid].root.classList.add('acting');

    // 輪
    showPad(kind);
    var ringColor = mine ? 'var(--atk)' : 'var(--def)';
    var minis = [];
    targets.forEach(function (t) {
      slots[t.uid].root.classList.add('targeted');
      slots[t.uid].root.style.setProperty('--ring', ringColor);
      var p = spot(t, 0.5);
      fx('ring-mini target', '', p);
      minis.push(fx('ring-mini ' + kind, '', p));
    });
    var t0 = performance.now(), tHit = t0 + ringSec() * 1000;

    // 技ごとの動き：ためる → 当たる瞬間に合わせて打ちこむ
    toLive(u);
    var anim = (DN.PixAnim && DN.PixAnim.get(u, act.moveId)) || DN.Anim.get(mv);
    var c = DN.Anim.ctx({ u: u, targets: targets, mv: mv, slot: slotOf, t0: t0, tHit: tHit });
    var myPix = slots[u.uid].body.querySelector('.pix');
    if (myPix) c.ghost = function () { DN.Pix.ghost(myPix, $('fx'), $('field')); };
    anim.windup(c);
    var strikeTimer = setTimeout(function () { anim.strike(c); }, Math.max(0, tHit - performance.now() - anim.lead * 1000));

    var j = await timingRing(kind, t0, tHit, minis);
    await untilTime(tHit);
    if (id !== runId) { clearTimeout(strikeTimer); return; }
    fast(true);    // 当たったあとの演出は、設定の速さで
    ban.remove();

    // タイミング倍率（相手の分は AI が大会の強さで決める）
    var aiAtk = null, aiDef = {};
    var timing = mine
      ? { atk: CFG.ATK_TIMING[j], def: function (t) { var r = B.aiTiming(st, lv.def); aiDef[t.uid] = r; return CFG.DEF_TIMING[r]; } }
      : { atk: CFG.ATK_TIMING[(aiAtk = B.aiTiming(st, lv.atk))], def: CFG.DEF_TIMING[j] };
    var res = B.execute(st, act, timing);

    if (aiAtk === 'perfect') floatNum(u, T('aiPerfect'), 'txt up', 0.05);
    await showResult(res, mine, j, aiDef, c, anim);
    if (id !== runId) return;
    await anim.after(c);

    // 元の位置へ
    targets.forEach(function (t) { slots[t.uid].root.classList.remove('targeted'); });
    await anim.recover(c);
    DN.Anim.reset(c);
    toImage(u);
    slots[u.uid].root.classList.remove('acting');
  }

  async function showResult(res, mine, j, aiDef, c, anim) {
    var u = res.actor;
    var anyCrit = false, maxHits = 0, anyHit = false;
    res.targets.forEach(function (r) { maxHits = Math.max(maxHits, r.hits.length); });
    var strong = (mine && j === 'perfect') || (!mine && j === 'miss');
    // 当たった瞬間（複数回ならずらして）
    for (var h = 0; h < Math.max(1, maxHits); h++) {
      var crit = false;
      res.targets.forEach(function (r) {
        var t = r.unit, s = slots[t.uid];
        if (h === 0 && r.miss) {
          floatNum(t, T('dodged'), 'txt', 0.2);
          s.sprite.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(' + (t.side ? 22 : -22) + 'px,-10px)' }, { transform: 'translate(0,0)' }], { duration: 360, easing: 'ease-out' });
          DN.app.sfx.dodge();
          return;
        }
        var hit = r.hits[h];
        if (!hit) return;
        anyHit = true;
        crit = crit || hit.crit;
        anyCrit = anyCrit || hit.crit;
        anim.impact(c, t, hit, h);
        var tp = s.body.querySelector('.pix');
        if (tp && !(r.fainted && h === r.hits.length - 1)) DN.Pix.play(tp, 'hit');   // ドット絵：のけぞるコマ
        fx('spark' + (hit.crit ? ' crit' : ''), '', spot(t, 0.5));
        s.body.animate([{ filter: 'brightness(4) saturate(0)' }, { filter: 'brightness(1)' }], { duration: 260 });
        s.sprite.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-7px,0)' }, { transform: 'translate(7px,0)' }, { transform: 'translate(-4px,0)' }, { transform: 'translate(0,0)' }], { duration: 300, delay: anim.stop });
        floatNum(t, String(hit.dmg), hit.crit ? 'crit' : (strong ? 'big' : ''), 0.25 - h * 0.15);
        if (hit.crit) floatNum(t, T('critical'), 'txt up', -0.15);
        if (h === 0 && hit.edge) floatNum(t, T(hit.edge > 0 ? 'edgeUp' : 'edgeDown'), 'txt edge ' + (hit.edge > 0 ? 'up' : 'bad'), 0.95);
        if (!mine && h === 0 && j !== 'miss') { DN.app.sfx.guard(); fx('guard-fx', '', spot(t, 0.5)); }
        if (mine && h === 0 && aiDef[t.uid] && aiDef[t.uid] !== 'miss') floatNum(t, T('aiGuard'), 'small', 0.85);
        updateHud(t);
      });
      if (anyHit) {
        DN.app.sfx.hit(crit);
        if (crit) DN.buzz('crit'); else if (!mine && j === 'miss') DN.buzz('hurt');
        var lvl = Math.max(anim.shake, crit ? 3 : 0, strong ? 2 : 0);
        DN.FX.shake(lvl);
        if (crit || (strong && anim.shake >= 2)) DN.FX.flash(crit ? '' : 'gold');
        await DN.FX.hitStop(anim.stop + (crit ? 60 : 0) + (strong ? 30 : 0));
      }
      await wait(maxHits > 1 ? 240 : 160);
    }
    await wait(200);
    // 効果
    var shown = false;
    res.targets.forEach(function (r) {
      if (r.debuff) { floatNum(r.unit, T('debuff_' + r.debuff), 'txt bad', 0.1); shown = true; }
    });
    if (res.buff) { floatNum(u, T('buff_' + res.buff), 'txt up', 0.1); shown = true; }
    if (res.heal) { floatNum(u, '+' + res.heal, 'heal', 0.2); DN.app.sfx.heal(); shown = true; }
    if (res.recoil) { floatNum(u, T('recoil') + ' ' + res.recoil, 'txt bad', 0.2); shown = true; }
    if (res.buff || res.targets.some(function (r) { return r.debuff; })) DN.app.sfx.buff(!!res.buff);
    updateHud(u);
    if (shown) await wait(380);
    // たおれた
    var down = res.targets.filter(function (r) { return r.fainted; }).map(function (r) { return r.unit; });
    if (res.selfFainted) down.push(u);
    if (down.length) {
      down.forEach(function (t) {
        var dp = slots[t.uid].body.querySelector('.pix');
        if (dp) DN.Pix.play(dp, 'faint', 'hold');   // ドット絵：たおれるコマ
        updateHud(t);
        floatNum(t, T('fainted'), 'txt bad', 0.0);
        var p = spot(t, 0.7);
        DN.FX.particles(p.x, p.y, { n: 12, angle: -90, spread: 80, speed: 70, colors: ['#d6bc8e', '#b39068', '#fff'], gravity: 40, size: 10 });
      });
      DN.app.sfx.faint();
      DN.buzz('faint');
      DN.FX.shake(2);
      await wait(560);
    }
  }

  // ---------------- 勝ち負け ----------------
  function finish(won) {
    acting = true;
    pendingTap = null;
    coachOff();
    var endWait = 1800 / (DN.timeScale || 1);
    fast(false);
    $('tapzone').classList.remove('on');
    DN.app.bgm.stop(0.6);
    if (won) DN.app.sfx.victory(); else DN.app.sfx.defeat();
    splash(T(won ? 'win' : 'lose'));
    var turns = st.turn, id = runId;
    $('panel').innerHTML = '<div class="result ' + (won ? 'win' : 'lose') + '"><h2>' + T(won ? 'win' : 'lose') + '</h2>' +
      '<p>' + (won ? T('winSub', { n: turns }) : T('loseSub')) + '</p></div>';
    var info = { perfects: rec.perfects, bestChain: rec.bestChain, combo: (st.combos[0] || []).length > 0 };
    setTimeout(function () { if (id === runId && opts.onEnd) opts.onEnd(won, turns, info); }, endWait);
  }

  /** 決勝・強敵の登場：大きな文字のあと、相手が1体ずつ名前つきで出てくる */
  async function showIntro(id, kind) {
    var foes = B.side(st, 1);
    fx('intro-banner ' + kind, '<b>' + esc(T(kind === 'final' ? 'finalBattle' : 'bossBattle')) + '</b><small>' + esc(opts.label || '') + '</small>');
    DN.app.sfx.charge(3);
    DN.FX.shake(2);
    await wait(1300);
    for (var i = 0; i < foes.length; i++) {
      if (id !== runId) return;
      var u = foes[i], sl = slots[u.uid];
      sl.root.classList.remove('intro-hide');
      sl.sprite.animate([{ transform: 'translateX(80px) scale(1.3)', opacity: 0 }, { transform: 'translateX(-6px) scale(1.05)', opacity: 1, offset: 0.6 }, { transform: 'none', opacity: 1 }],
        { duration: 520, easing: 'cubic-bezier(.2,.9,.3,1)' });
      var p = spot(u, 0.45);
      p.x = $('field').getBoundingClientRect().width * 0.5;   // 名前の札はレーンのまん中（右はしで切れないように）
      fx('intro-name', '<b>' + esc(L(u.d.name)) + '</b><small>' + u.d.rarity + ' ・ Lv' + u.lv + (u.stack ? ' +' + u.stack : '') + '</small>', p);
      if (u.d.rarity === 'SSR' || u.d.rarity === 'EX') DN.app.sfx.roarBig(); else DN.app.sfx.growl();
      DN.FX.shake(u.d.rarity === 'EX' ? 3 : 1);
      await wait(900);
    }
  }

  /** コンボ発動の演出（バトルのはじめ） */
  async function showCombos(id) {
    for (var side = 0; side < 2; side++) {
      var list = st.combos[side] || [];
      for (var k = 0; k < list.length; k++) {
        if (id !== runId) return;
        var c = list[k];
        var ups = Object.keys(c.up).map(function (key) { return T('st_' + key) + '+' + Math.round(c.up[key] * 100) + '%'; }).join(' ');
        fx('combo-banner' + (side ? ' foe' : ''), '<small>' + T('comboOn') + '</small><b>' + esc(L(c.name)) + '</b><span>' + ups + '</span>', null);
        st.units.forEach(function (u) {
          if (u.side !== side) return;
          var sl = slots[u.uid];
          sl.body.animate([{ filter: 'drop-shadow(0 0 0 #ffd23a)' }, { filter: 'drop-shadow(0 0 12px #ffd23a) brightness(1.4)' }, { filter: 'drop-shadow(0 0 0 #ffd23a)' }], { duration: 900 });
          sl.sprite.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-10px)' }, { transform: 'translateY(0)' }], { duration: 400, easing: 'ease-out' });
        });
        DN.app.sfx.buff(true);
        DN.app.sfx.charge(3);
        await wait(1300);
      }
    }
  }

  // ---------------- 外から使う ----------------
  V.start = function (o) {
    runId++;
    opts = o;
    lv = CFG.AI_LEVELS[o.level || 0];
    st = B.create(o.team, o.foes, { b: { statMul: lv.statMul } });
    pendingTap = null;
    chain = 0;
    rec = { perfects: 0, bestChain: 0 };
    lastChoices = {};
    tut = o.tutorial ? { atk: false, def: false } : null;
    coachOff();
    $('field').className = 'field sky arena-' + (o.arena || 0);   // 大会ごとの背景
    buildField();
    acting = true;
    $('panel').innerHTML = '';
    $('turn-badge').textContent = o.label || '';
    var id = runId;
    fast(true);
    if (o.intro) B.side(st, 1).forEach(function (u) { slots[u.uid].root.classList.add('intro-hide'); });
    (o.intro ? showIntro(id, o.intro) : Promise.resolve())
      .then(function () { return id === runId ? showCombos(id) : null; })
      .then(function () { if (id === runId) newTurn(); });
  };
  V.stop = function () {
    runId++;
    pendingTap = null;
    acting = false;
    fast(false);
    coachOff();
    $('tapzone').classList.remove('on');
  };
  /** タップ・クリック・スペースキー（共通土台の片手操作から呼ばれる）。設定のずれ（ミリ秒）を引く */
  V.press = function (pos) {
    if (!pendingTap) return;
    ripple(pos);
    pendingTap(performance.now() - (DN.app.prefs.tapOffset || 0));
  };
  V.state = function () { return st; };
  /** 確認用：1体の技を1回だけ動かす（例：DN.BattleView.demo(0, 0)） */
  V.demo = async function (uid, mi) {
    if (acting) return;
    var u = st.units[uid], mvId = u.d.moves[mi || 0];
    acting = true;
    $('tapzone').classList.add('on');
    await playAction({ unit: u, moveIndex: mi || 0, moveId: mvId, move: DN.move(mvId) }, runId);
    st.units.forEach(updateHud);
    $('tapzone').classList.remove('on');
    renderCommand();
    acting = false;
  };
})(window);
