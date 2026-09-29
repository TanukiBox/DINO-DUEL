/*
 * DINO DUEL 描きこみ版：ステゴサウルス
 * 背中は腰がいちばん高く弓なり、そこから小さな頭へ下がる。背中に2列の大きな板（互い違い）、しっぽの先に4本のトゲ。
 * 後ろ脚は長く、前脚は短い。しっぽを持ち上げて身がまえる。目は小さく、おだやかだが油断しない。
 * 部品：p-tail / p-body / p-legF・p-legB（後ろ脚） / p-foreF・p-foreB（前脚） / p-head
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};
  var CUSTOM = DN.ART_CUSTOM = DN.ART_CUSTOM || {};

  var C = {
    body: '#6f9b46', shade: '#426626', dark: '#3f6224', stripe: '#2e4a18', belly: '#e6e0a8',
    far: '#557a34', farShade: '#3c5a22',
    plate: '#e2582c', plateDark: '#9a3018', plateEdge: '#ffc84a', spike: '#f2e6c6', claw: '#ece0bc', eye: '#ffd23a', ink: '#1e2a10'
  };

  /** 背中の板（x, y = 付け根の中心、h = 高さ、w = 幅、r = 傾き） */
  function plate(x, y, h, w, r, far) {
    var fill = far ? C.plateDark : C.plate;
    return '<g transform="rotate(' + (r || 0) + ' ' + x + ' ' + y + ')">' +
      '<path d="M' + (x - w) + ' ' + (y + 4) + ' C' + (x - w * 1.05) + ' ' + (y - h * 0.4) + ' ' + (x - w * 0.5) + ' ' + (y - h * 0.85) + ' ' + x + ' ' + (y - h) +
      ' C' + (x + w * 0.6) + ' ' + (y - h * 0.8) + ' ' + (x + w * 1.05) + ' ' + (y - h * 0.4) + ' ' + (x + w) + ' ' + (y + 4) + ' Z" fill="' + fill + '" stroke="' + C.ink + '" stroke-width="1.6" stroke-linejoin="round"/>' +
      (far ? '' : '<path d="M' + (x - w * 0.8) + ' ' + (y - h * 0.3) + ' C' + (x - w * 0.5) + ' ' + (y - h * 0.75) + ' ' + (x - w * 0.1) + ' ' + (y - h * 0.9) + ' ' + x + ' ' + (y - h * 0.93) + '" fill="none" stroke="' + C.plateEdge + '" stroke-width="1.6" stroke-linecap="round"/>' +
        '<path d="M' + x + ' ' + (y + 2) + ' L' + x + ' ' + (y - h * 0.7) + ' M' + (x - w * 0.5) + ' ' + y + ' L' + (x - w * 0.2) + ' ' + (y - h * 0.5) + ' M' + (x + w * 0.5) + ' ' + y + ' L' + (x + w * 0.2) + ' ' + (y - h * 0.5) + '" stroke="' + C.plateDark + '" stroke-width="0.9" opacity="0.6"/>') +
      '</g>';
  }
  function spike(x, y, len, ang, w) {
    var a = ang * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), nx = -sa, ny = ca;
    var tx = x + ca * len, ty = y + sa * len;
    return '<path d="M' + (x + nx * w).toFixed(1) + ' ' + (y + ny * w).toFixed(1) + ' L' + tx.toFixed(1) + ' ' + ty.toFixed(1) + ' L' + (x - nx * w).toFixed(1) + ' ' + (y - ny * w).toFixed(1) + ' Z" fill="' + C.spike + '" stroke="' + C.ink + '" stroke-width="1.3" stroke-linejoin="round"/>';
  }

  CUSTOM.stego = function (p) {
    var K = DN.artKit(p, C, 2.4);

    // ---- 奥の列の板 ----
    p.detail(plate(46, 66, 14, 7, -30, true) + plate(66, 54, 20, 9, -12, true) + plate(90, 50, 24, 10, 2, true) + plate(114, 58, 20, 9, 18, true) + plate(134, 72, 14, 7, 34, true));

    // ---- 奥の脚 ----
    p.open('p-legB', 70, 90);
    p.part('M54 86 C56 72 78 68 86 82 C90 92 88 104 84 112 L84 134 C86 138 88 142 90 146 L64 146 C64 141 66 137 68 133 L68 118 C58 110 53 98 54 86 Z', C.far, K.flat({ auto: K.auto(3, 4, 0.8, C.farShade) }));
    p.detail(K.hoof(69, 146, 0.8) + K.hoof(77, 146, 0.8) + K.hoof(84.6, 146, 0.75));
    p.close();
    p.open('p-foreB', 138, 104);
    p.part('M130 102 C134 96 144 98 146 106 C147 114 144 120 142 124 L143 138 C145 141 147 144 147 146 L127 146 C127 142 129 139 131 136 L131 124 C128 116 127 108 130 102 Z', C.far, K.flat({ auto: K.auto(2.4, 3, 0.8, C.farShade) }));
    p.detail(K.hoof(131, 146, 0.7) + K.hoof(137.6, 146, 0.7) + K.hoof(143.6, 146, 0.65));
    p.close();

    // ---- しっぽ（持ち上げて、先の4本のトゲ）----
    p.open('p-tail', 34, 84);
    p.detail(spike(12, 58, 18, -110, 2.8) + spike(8, 62, 18, -150, 2.8));
    p.part('M36 80 C26 74 16 66 6 56 L10 52 C20 60 32 68 42 74 Z', C.body, K.flat({
      belly: 'M42 80 C30 74 18 66 6 58 L0 70 L50 90 Z',
      inner: K.stripe(22, 62, 5, -1, 3, C.stripe),
      auto: K.auto(1.6, 2.2)
    }));
    p.detail(spike(14, 58, 20, -95, 3) + spike(10, 62, 20, -135, 3));
    p.close();

    // ---- 胴 ----
    p.open('p-body', 96, 112);
    p.part('M30 86 C40 68 58 54 80 52 C102 50 120 60 136 74 C146 82 156 90 164 96 L168 106 C156 108 144 108 132 110 C112 118 88 118 68 114 C50 110 36 100 30 86 Z', C.body, K.flat({
      belly: 'M24 96 C50 110 90 116 130 108 C146 106 158 104 170 100 L170 130 L24 130 Z',
      inner: '<path d="M26 82 C40 62 66 50 90 50 C112 50 130 62 146 78 C154 86 162 92 168 96" fill="none" stroke="' + C.dark + '" stroke-width="12" stroke-linecap="round" opacity="0.55"/>' +
        K.spots([[56, 76, 3, 2.2], [70, 70, 3.4, 2.4], [86, 68, 3.6, 2.6], [102, 72, 3.4, 2.4], [118, 80, 3, 2.2], [132, 88, 2.6, 2], [64, 88, 2.4], [80, 84, 2.6], [96, 86, 2.8], [112, 92, 2.4], [48, 90, 2.2]], C.stripe, 0.6) +
        K.lines('M60 104 C74 110 94 112 112 108', 1.1, 0.4),
      auto: K.auto(4.5, 6, 0.6)
    }));
    p.close();

    // ---- 手前の列の板 ----
    p.detail(plate(38, 74, 12, 6, -36) + plate(56, 60, 20, 9, -22) + plate(78, 52, 26, 11, -4) + plate(102, 54, 24, 10, 10) + plate(124, 64, 18, 8, 26) + plate(142, 78, 12, 6, 40));

    // ---- 手前の後ろ脚 ----
    p.open('p-legF', 78, 90);
    p.part('M62 88 C64 72 88 68 96 84 C100 94 98 106 94 114 L94 134 C96 138 98 142 100 146 L72 146 C72 141 74 137 76 133 L76 120 C66 112 61 100 62 88 Z', C.body, K.flat({
      inner: K.lines('M68 108 C76 114 86 116 94 112', 1.1, 0.45) + K.lines('M78 128 l10 0 M78 134 l11 0 M78 140 l12 0', 0.8, 0.35),
      auto: K.auto(3.4, 4.2)
    }));
    p.detail(K.hoof(77, 146, 0.9) + K.hoof(86, 146, 0.9) + K.hoof(94.4, 146, 0.85));
    p.close();

    // ---- 手前の前脚 ----
    p.open('p-foreF', 148, 104);
    p.part('M140 102 C144 96 156 98 158 106 C159 114 156 120 154 124 L155 138 C157 141 159 144 159 146 L138 146 C138 142 140 139 142 136 L142 124 C138 116 137 108 140 102 Z', C.body, K.flat({
      inner: K.lines('M143 130 l10 0 M143 136 l11 0', 0.8, 0.35),
      auto: K.auto(2.6, 3.2)
    }));
    p.detail(K.hoof(142, 146, 0.8) + K.hoof(149, 146, 0.8) + K.hoof(155.6, 146, 0.75));
    p.close();

    // ---- 頭（小さく、首の先で低く）----
    p.open('p-head', 164, 100);
    p.part('M162 94 C168 88 182 88 192 94 C197 98 196 104 190 106 L172 108 C165 106 160 100 162 94 Z', C.body, K.flat({
      belly: 'M156 102 L200 100 L200 114 L156 114 Z',
      inner: K.lines('M184 102 C188 103 192 102 194 100', 1, 0.5) + K.spots([[170, 94, 1.4], [176, 92, 1.2]], C.stripe, 0.5),
      auto: K.auto(1.8, 2.4, 0.7)
    }));
    p.part('M188 95 C193 96 197 99 196 103 L190 106 C189 102 189 98 188 95 Z', C.dark, { lw: 1.3, ol: C.ink, ink: true });
    p.raw(K.eye({ x: 176, y: 96, rx: 2.4, ry: 2, iris: C.eye, pupil: 'round', pr: 0.55 }));
    if (!p.sil) p.raw('<path d="M172 93.4 C174.4 91.8 178 91.8 180.6 93.2 L180.6 94.6 C178 93.8 175 94 172.6 95.2 Z" fill="' + C.dark + '" stroke="' + C.ink + '" stroke-width="0.8"/>');
    p.close();
  };
  CUSTOM.stego.box = [150, 78, 50];
})(window);
