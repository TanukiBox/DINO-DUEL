/*
 * DINO DUEL 描きこみ版の恐竜を描くための道具（形はそれぞれの恐竜のファイルで描く）
 *
 *   var K = DN.artKit(p, C, 2.4);   // p = 描く道具（art.js の Pen）、C = 色、2.4 = 輪郭の太さ
 *   p.part(d, C.body, K.flat({ belly: …, inner: …, auto: K.auto(3, 4) }));
 *
 * flat：平らな色＋手描き風の線（光の当たらない側が太い）
 * auto：形を光の向きにずらした差分で付ける影と照り返し（dx, dy = ずらす量）
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};

  DN.artKit = function (p, C, LW) {
    var K = {};
    var ink = C.ink || '#2a120c';

    K.flat = function (extra) {
      return Object.assign({ lw: LW, ol: ink, ink: true, skin: true, pattern: false, tex: false, shade: false }, extra || {});
    };
    K.auto = function (dx, dy, op, col) { return { dx: dx, dy: dy, color: col || C.shade, op: op || 0.75, hl: 0.5, hlOp: 0.3 }; };
    K.rot = function (deg, x, y, s) { return '<g transform="rotate(' + deg + ' ' + x + ' ' + y + ')">' + s + '</g>'; };
    K.lines = function (d, w, o, col) {
      return '<path d="' + d + '" fill="none" stroke="' + (col || ink) + '" stroke-width="' + (w || 1) + '" stroke-linecap="round" stroke-linejoin="round" opacity="' + (o || 0.5) + '"/>';
    };
    /** 先のとがったしま（x, y = 付け根、len = 長さ、lean = 先の横ずれ、w = 太さ） */
    K.stripe = function (x, y, len, lean, w, col) {
      return '<path d="M' + (x - w / 2) + ' ' + (y - 6) + ' L' + (x + w / 2) + ' ' + (y - 6) + ' C' + (x + w * 0.3) + ' ' + (y + len * 0.45) + ' ' +
        (x + lean + 0.6) + ' ' + (y + len * 0.85) + ' ' + (x + lean) + ' ' + (y + len) + ' C' + (x + lean - 1) + ' ' + (y + len * 0.6) + ' ' + (x - w * 0.55) + ' ' + (y + len * 0.3) + ' ' + (x - w / 2) + ' ' + (y - 6) + 'Z" fill="' + (col || C.stripe) + '"/>';
    };
    /** まだらの点（[x, y, rx, ry] の並び） */
    K.spots = function (list, col, op) {
      return list.map(function (q) {
        return '<ellipse cx="' + q[0] + '" cy="' + q[1] + '" rx="' + q[2] + '" ry="' + (q[3] || q[2] * 0.7) + '" transform="rotate(' + (q[4] || 0) + ' ' + q[0] + ' ' + q[1] + ')" fill="' + (col || C.stripe) + '" opacity="' + (op || 0.8) + '"/>';
      }).join('');
    };
    /** 歯（x, y = 付け根の左、w = 幅、len = 長さ、dir = 1 下向き / -1 上向き） */
    K.tooth = function (x, y, w, len, dir) {
      var tip = y + len * dir;
      return '<path d="M' + x + ' ' + y + ' C' + (x + w * 0.2) + ' ' + (y + len * 0.55 * dir) + ' ' + (x + w * 0.4) + ' ' + (tip - 0.3 * dir) + ' ' + (x + w * 0.52) + ' ' + tip +
        ' C' + (x + w * 0.66) + ' ' + (y + len * 0.5 * dir) + ' ' + (x + w * 0.88) + ' ' + (y + len * 0.2 * dir) + ' ' + (x + w) + ' ' + y + 'Z" fill="' + (C.tooth || '#fffaf0') + '" stroke="' + ink + '" stroke-width="0.9" stroke-linejoin="round"/>';
    };
    /** 歯を線に沿って並べる（x0,y0 → x1,y1 に n 本、長さ len） */
    K.teethRow = function (x0, y0, x1, y1, n, w, len, dir) {
      var s = '';
      for (var i = 0; i < n; i++) {
        var t = n === 1 ? 0 : i / (n - 1), x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
        var k = 0.7 + 0.3 * Math.sin(Math.PI * (0.25 + 0.6 * t));
        s += K.tooth(x, y, w, len * k, dir);
      }
      return s;
    };
    /** かぎ爪（x, y = 付け根、前向きに曲がって下へ。s = 大きさ、flip で左向き） */
    K.claw = function (x, y, s, col, flip) {
      s = s || 1;
      var k = flip ? -1 : 1;
      return '<path d="M' + x + ' ' + (y - 2.6 * s) + ' C' + (x + 3.4 * s * k) + ' ' + (y - 3 * s) + ' ' + (x + 6.2 * s * k) + ' ' + (y - 1 * s) + ' ' + (x + 7 * s * k) + ' ' + (y + 1.8 * s) +
        ' C' + (x + 4.6 * s * k) + ' ' + (y + 0.6 * s) + ' ' + (x + 2 * s * k) + ' ' + (y + 0.6 * s) + ' ' + x + ' ' + (y + 1 * s) + 'Z" fill="' + (col || C.claw || '#2b1510') + '" stroke="' + ink + '" stroke-width="0.9" stroke-linejoin="round"/>';
    };
    /** 丸い足の爪（草食の足。x = 真ん中、y = 地面） */
    K.hoof = function (x, y, s, col) {
      s = s || 1;
      return '<path d="M' + (x - 4 * s) + ' ' + y + ' C' + (x - 4.2 * s) + ' ' + (y - 3.6 * s) + ' ' + (x - 1 * s) + ' ' + (y - 5 * s) + ' ' + (x + 2 * s) + ' ' + (y - 4.4 * s) +
        ' C' + (x + 4 * s) + ' ' + (y - 3.4 * s) + ' ' + (x + 4.8 * s) + ' ' + (y - 1.2 * s) + ' ' + (x + 5 * s) + ' ' + y + ' Z" fill="' + (col || C.claw || '#efe3c2') + '" stroke="' + ink + '" stroke-width="1.2" stroke-linejoin="round"/>';
    };
    /**
     * 目。o = { x, y, rx, ry, iris, pupil: 'slit'|'round', pr（瞳の大きさの割合）, white（白目を見せる）, glow（光る色）, rot }
     */
    K.eye = function (o) {
      if (p.sil) return '';
      var s = '', rot = o.rot ? ' transform="rotate(' + o.rot + ' ' + o.x + ' ' + o.y + ')"' : '';
      if (o.glow) {
        var gid = p.id + 'eg' + (p.n++);
        p.defs += '<radialGradient id="' + gid + '"><stop offset="0" stop-color="' + o.glow + '" stop-opacity="0.55"/><stop offset="1" stop-color="' + o.glow + '" stop-opacity="0"/></radialGradient>';
        s += '<ellipse cx="' + o.x + '" cy="' + o.y + '" rx="' + (o.rx * 2.2) + '" ry="' + (o.ry * 1.9) + '" fill="url(#' + gid + ')"/>';
      }
      s += '<ellipse cx="' + o.x + '" cy="' + o.y + '" rx="' + o.rx + '" ry="' + o.ry + '"' + rot + ' fill="' + (o.white ? '#fffaf0' : o.iris) + '" stroke="' + ink + '" stroke-width="1.1"/>';
      if (o.white) s += '<circle cx="' + (o.x + o.rx * 0.2) + '" cy="' + o.y + '" r="' + (Math.min(o.rx, o.ry) * 0.8) + '" fill="' + o.iris + '"/>';
      var pr = o.pr || 0.45;
      if (o.pupil === 'slit') s += '<ellipse cx="' + (o.x + o.rx * 0.2) + '" cy="' + o.y + '" rx="' + (o.rx * 0.22) + '" ry="' + (o.ry * 0.85) + '" fill="' + ink + '"/>';
      else s += '<circle cx="' + (o.x + o.rx * 0.25) + '" cy="' + o.y + '" r="' + (Math.min(o.rx, o.ry) * pr) + '" fill="' + ink + '"/>';
      s += '<circle cx="' + (o.x - o.rx * 0.25) + '" cy="' + (o.y - o.ry * 0.35) + '" r="' + (Math.max(0.6, Math.min(o.rx, o.ry) * 0.28)) + '" fill="#fff"/>';
      return s;
    };
    return K;
  };
})(window);
