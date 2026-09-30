/*
 * DINO DUEL シェア用の画像（大会で優勝・EX を引いたとき）
 * チームの絵を 1200×675 の1枚の画像にして、スマホは「共有」（写真に保存・X に貼る）、PC はダウンロード。
 *
 *   DN.saveImage({ kind: 'champ' | 'ex', title: '…', team: [{ id, own: { lv, stack } }] });
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};

  function T(k, p) { return DN.app.i18n.t(k, p); }
  function L(o) { return o[DN.app.i18n.lang] || o.en; }
  var W = 1200, H = 675;
  var RC = { N: '#c9d0da', R: '#6fb4ff', SR: '#d59cff', SSR: '#ffd23a', EX: '#ff7ae0' };

  /** 恐竜の絵を、大きさを決めた画像として読みこむ（ぼやけないように、SVG に幅と高さを書く） */
  function loadDino(id, w) {
    var svg = DN.art.svg(DN.dino(id)).replace('<svg ', '<svg width="' + w + '" height="' + Math.round(w * 0.75) + '" ');
    return new Promise(function (ok) {
      var img = new Image();
      img.onload = function () { ok(img); };
      img.onerror = function () { ok(null); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }

  function outlined(ctx, text, x, y, size, fill, stroke, lw) {
    ctx.font = size + 'px "Mochiy Pop One", "M PLUS Rounded 1c", sans-serif';
    ctx.lineJoin = 'round';
    ctx.lineWidth = lw || size * 0.18;
    ctx.strokeStyle = stroke || '#2b1b12';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = fill;
    ctx.fillText(text, x, y);
  }

  async function draw(o) {
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    var ctx = c.getContext('2d');
    try { await document.fonts.load('60px "Mochiy Pop One"'); } catch (e) { /* noop */ }
    // 背景：優勝は金色、EX は虹色の光
    var g = ctx.createRadialGradient(W / 2, H * 0.42, 40, W / 2, H * 0.42, W * 0.75);
    if (o.kind === 'ex') { g.addColorStop(0, '#fff6ff'); g.addColorStop(0.35, '#ff9ae8'); g.addColorStop(0.7, '#7a4ad8'); g.addColorStop(1, '#1d1440'); }
    else { g.addColorStop(0, '#fff4a0'); g.addColorStop(0.4, '#f0a820'); g.addColorStop(1, '#5a2a06'); }
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // 放射状の光の筋
    ctx.save(); ctx.translate(W / 2, H * 0.42);
    var cols = o.kind === 'ex' ? ['#ff5a5a', '#ffcf40', '#5aff8a', '#40c8ff', '#b070ff'] : ['#ffffff'];
    for (var i = 0; i < 24; i++) {
      ctx.rotate(Math.PI * 2 / 24);
      ctx.fillStyle = cols[i % cols.length]; ctx.globalAlpha = o.kind === 'ex' ? 0.28 : 0.16;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, -40); ctx.lineTo(W, 40); ctx.closePath(); ctx.fill();
    }
    ctx.restore(); ctx.globalAlpha = 1;
    // 地面
    ctx.fillStyle = '#6c9a3c'; ctx.strokeStyle = '#2b1b12'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.ellipse(W / 2, H + 120, W * 0.75, 260, 0, Math.PI, 0); ctx.fill(); ctx.stroke();
    // タイトル
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    outlined(ctx, 'DINO DUEL', 128, 52, 32, '#ffd23a', '#2b1b12', 8);
    outlined(ctx, o.title, W / 2, 148, o.title.length > 14 ? 54 : 70, '#ffffff', '#2b1b12', 14);
    // 恐竜
    var team = o.team, n = team.length;
    var w = n === 1 ? 640 : 400, y = n === 1 ? 170 : 240;
    var imgs = await Promise.all(team.map(function (t) { return loadDino(t.id, w); }));
    team.forEach(function (t, k) {
      var cx = n === 1 ? W / 2 : W / 2 + (k - 1) * 380, img = imgs[k], d = DN.dino(t.id);
      if (img) ctx.drawImage(img, cx - w / 2, y, w, w * 0.75);
      var name = L(d.name), lv = (t.own ? 'Lv' + t.own.lv + (t.own.stack ? ' +' + t.own.stack : '') : '');
      var ny = y + w * 0.75 + (n === 1 ? -6 : 10);
      ctx.fillStyle = 'rgba(20,26,48,0.82)';
      var tw = Math.max(200, name.length * (n === 1 ? 34 : 26) + 110);
      roundRect(ctx, cx - tw / 2, ny - (n === 1 ? 40 : 32), tw, n === 1 ? 56 : 46, 23); ctx.fill();
      ctx.font = (n === 1 ? 30 : 23) + 'px "M PLUS Rounded 1c", sans-serif';
      ctx.fillStyle = RC[d.rarity]; ctx.textAlign = 'center';
      ctx.fillText(d.rarity + '  ' + name + (lv ? '  ' + lv : ''), cx, ny);
    });
    // 下の文字
    ctx.font = '24px "M PLUS Rounded 1c", sans-serif'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'right';
    ctx.fillText('#DINODUEL  tanukibox.github.io/DINO-DUEL', W - 28, H - 24);
    return c;
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  DN.drawShareImage = draw;   // 確認用
  DN.saveImage = async function (o) {
    var c = await draw(o);
    var blob = await new Promise(function (ok) { c.toBlob(ok, 'image/png'); });
    if (!blob) return;
    var file = null;
    try { file = new File([blob], 'dino-duel.png', { type: 'image/png' }); } catch (e) { file = null; }
    // スマホ：共有の画面（写真に保存・X などに送る）
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], text: '#DINODUEL' }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    // PC など：ダウンロード
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'dino-duel.png';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    toast(T('imageSaved'));
  };
  function toast(text) {
    var d = document.createElement('div');
    d.className = 'toast'; d.textContent = text;
    document.getElementById('app').appendChild(d);
    setTimeout(function () { d.remove(); }, 1800);
  }
})(window);
