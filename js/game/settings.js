/*
 * DINO DUEL 設定（音・BGM・バトルの速さ・ふるえ・タイミング調整・セーブを守る）
 * 設定そのものは DN.app.prefs に入れて、共通のセーブ（'dino-duel'）に覚える。
 *
 *   DN.openSettings();     // 設定の画面を開く
 *   DN.buzz('perfect');    // スマホをふるわせる（Android など。iPhone はふるえない）
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};

  function T(k, p) { return DN.app.i18n.t(k, p); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function prefs() { return DN.app.prefs; }

  // ---------------- ふるえ ----------------
  var canVibe = !!(global.navigator && navigator.vibrate);
  var BUZZ = { perfect: 18, crit: [28, 40, 28], hurt: 45, faint: 70, pick: 8 };
  DN.buzz = function (kind) {
    if (!canVibe || !prefs().vibe) return;
    try { navigator.vibrate(BUZZ[kind] || 15); } catch (e) { /* noop */ }
  };

  // ---------------- ホーム画面に追加 ----------------
  var installEvt = null;
  global.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEvt = e; });
  function standalone() {
    return (global.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  }
  function isIOS() { return /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }

  // ---------------- 設定の画面 ----------------
  function row(label, html) { return '<div class="set-row"><span class="set-l">' + label + '</span><span class="set-v">' + html + '</span></div>'; }
  function seg(id, opts, cur) {
    return '<span class="seg" data-k="' + id + '">' + opts.map(function (o) {
      return '<button class="' + (o[0] === cur ? 'on' : '') + '" data-v="' + o[0] + '">' + o[1] + '</button>';
    }).join('') + '</span>';
  }

  DN.openSettings = function () {
    var a = DN.app, p = prefs();
    var install = standalone() ? '<p class="set-ok">' + T('set_installed') + '</p>'
      : '<button class="btn small" id="st-install">' + T('set_install') + '</button>';
    DN.overlay('<div class="settings"><h3>' + T('settings') + '</h3>' +
      row(T('set_sound'), seg('sound', [['on', T('on')], ['off', T('off')]], a.sound.muted ? 'off' : 'on')) +
      row(T('set_bgm'), seg('bgm', [['on', T('on')], ['off', T('off')]], a.bgm.on ? 'on' : 'off')) +
      row(T('set_speed'), seg('speed', [['1', T('speed1')], ['2', T('speed2')]], String(p.speed))) +
      (canVibe ? row(T('set_vibe'), seg('vibe', [['on', T('on')], ['off', T('off')]], p.vibe ? 'on' : 'off')) : '') +
      row(T('set_timing'), '<small>' + T('set_timingNow', { n: Math.round(p.tapOffset) }) + '</small><button class="btn small" id="st-cal">' + T('set_timingDo') + '</button>') +
      '<h4>' + T('set_save') + '</h4><p class="set-note">' + T('set_saveNote') + '</p>' +
      '<div class="set-btns">' + install + '<button class="btn small" id="st-export">' + T('set_export') + '</button><button class="btn small" id="st-import">' + T('set_import') + '</button></div>' +
      '</div>', [{ label: T('close'), fn: function () { DN.closeOverlay(); if (DN.app.onSettingsClosed) DN.app.onSettingsClosed(); } }]);
    var o = document.getElementById('overlay');
    o.querySelectorAll('.seg button').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.parentNode.dataset.k, v = b.dataset.v;
        if (k === 'sound' && (v === 'off') !== a.sound.muted) a.sound.toggle();
        if (k === 'bgm' && (v === 'on') !== a.bgm.on) a.bgm.toggle();
        if (k === 'speed') p.speed = +v;
        if (k === 'vibe') { p.vibe = v === 'on'; if (p.vibe) DN.buzz('crit'); }
        a.savePrefs();
        a.sfx.tap();
        b.parentNode.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
      });
    });
    o.querySelector('#st-cal').addEventListener('click', function () { a.sfx.tap(); calibrate(); });
    o.querySelector('#st-export').addEventListener('click', function () { a.sfx.tap(); showCode(); });
    o.querySelector('#st-import').addEventListener('click', function () { a.sfx.tap(); importCode(); });
    var ib = o.querySelector('#st-install');
    if (ib) ib.addEventListener('click', function () {
      a.sfx.tap();
      if (installEvt) { installEvt.prompt(); installEvt = null; return; }
      DN.overlay('<div class="confirm"><p>' + T(isIOS() ? 'set_iosHow' : 'set_otherHow') + '</p></div>', [{ label: T('back'), fn: DN.openSettings }]);
    });
  };

  // ---------------- 引き継ぎコード ----------------
  function showCode() {
    var code = DN.Progress.exportCode(DN.app.state);
    DN.overlay('<div class="code-box"><h3>' + T('codeTitle') + '</h3><p class="set-note">' + T('codeNote') + '</p>' +
      '<textarea readonly id="code-t">' + esc(code) + '</textarea><p class="set-ok" id="code-msg"></p></div>', [
      { label: T('codeCopy'), big: true, fn: function () {
        var t = document.getElementById('code-t');
        t.select();
        var done = function () { document.getElementById('code-msg').textContent = T('codeCopied'); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, function () { try { document.execCommand('copy'); done(); } catch (e) { /* noop */ } });
        else { try { document.execCommand('copy'); done(); } catch (e) { /* noop */ } }
      } },
      { label: T('back'), fn: DN.openSettings }
    ]);
  }
  function importCode() {
    DN.overlay('<div class="code-box"><h3>' + T('importTitle') + '</h3><p class="set-note">' + T('importNote') + '</p>' +
      '<textarea id="code-in" placeholder="DD1-..."></textarea><p class="set-bad" id="code-msg"></p></div>', [
      { label: T('importDo'), big: true, fn: function () {
        var s = DN.Progress.importCode(document.getElementById('code-in').value);
        if (!s) { document.getElementById('code-msg').textContent = T('importBad'); return; }
        DN.app.replaceState(s);
        DN.overlay('<div class="confirm"><p>' + T('importOk') + '</p></div>', [{ label: T('close'), fn: function () { DN.closeOverlay(); DN.app.go('home'); } }]);
      } },
      { label: T('back'), fn: DN.openSettings }
    ]);
  }

  // ---------------- タイミング調整 ----------------
  // 1秒ごとに輪が的に重なる（そのとき「ピッ」）。8回タップして、平均のずれを覚える
  function calibrate() {
    var PERIOD = 1000, N = 8, diffs = [], t0 = performance.now() + 900, running = true, raf = 0;
    DN.overlay('<div class="cal"><h3>' + T('calTitle') + '</h3><p class="set-note">' + T('calNote') + '</p>' +
      '<div class="cal-pad" id="cal-pad"><div class="ring-target cal-t"></div><div class="ring cal-r" id="cal-r"></div><span id="cal-left">' + T('calLeft', { n: N }) + '</span></div></div>', [
      { label: T('calReset'), fn: function () { running = false; prefs().tapOffset = 0; DN.app.savePrefs(); DN.openSettings(); } },
      { label: T('back'), fn: function () { running = false; DN.openSettings(); } }
    ]);
    var ring = document.getElementById('cal-r'), pad = document.getElementById('cal-pad');
    var beeped = -1;
    (function loop() {
      if (!running || !document.getElementById('cal-r')) return;
      var now = performance.now(), k = Math.round((now - t0) / PERIOD), ph = (now - t0) / PERIOD - Math.floor((now - t0) / PERIOD);
      if (now >= t0 + k * PERIOD && k > beeped && k >= 0) { beeped = k; DN.app.sfx.tick(3); }
      var s = 1 + (1 - ph) * 2.2;
      ring.style.transform = 'scale(' + s.toFixed(3) + ')';
      raf = requestAnimationFrame(loop);
    })();
    function tap(e) {
      if (!running) return;
      e.preventDefault();
      var now = performance.now(), k = Math.round((now - t0) / PERIOD), d = now - (t0 + k * PERIOD);
      if (Math.abs(d) > 350) return;       // 大きく外れたタップは数えない
      diffs.push(d);
      DN.app.sfx.tap();
      pad.animate([{ transform: 'scale(1.04)' }, { transform: 'scale(1)' }], { duration: 160 });
      var left = N - diffs.length;
      document.getElementById('cal-left').textContent = left > 0 ? T('calLeft', { n: left }) : '';
      if (left <= 0) {
        running = false;
        cancelAnimationFrame(raf);
        diffs.sort(function (a, b) { return a - b; });
        var mid = diffs.slice(2, N - 2), avg = mid.reduce(function (a, b) { return a + b; }, 0) / mid.length;  // 端の2つずつは捨てる
        prefs().tapOffset = Math.max(-200, Math.min(250, Math.round(avg)));
        DN.app.savePrefs();
        DN.overlay('<div class="confirm"><p>' + T('calDone', { n: prefs().tapOffset }) + '</p></div>', [{ label: T('back'), fn: DN.openSettings }]);
      }
    }
    pad.addEventListener('pointerdown', tap);
  }
})(window);
