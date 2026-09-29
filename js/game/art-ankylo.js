/*
 * DINO DUEL 描きこみ版：アンキロサウルス
 * 低く幅広い体を、キール（稜線）のある骨の板とわきのトゲでおおう。しっぽを持ち上げ、先の大きなこぶを振りかぶる構え。
 * 頭は三角で、うしろの角と頬の角。短く太い4本脚。目は小さくするどい。
 * 部品：p-tail / p-body / p-legF・p-legB（後ろ脚） / p-foreF・p-foreB（前脚） / p-head
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};
  var CUSTOM = DN.ART_CUSTOM = DN.ART_CUSTOM || {};

  var C = {
    body: '#9c8a60', shade: '#6a5a3a', dark: '#5e4e34', stripe: '#4a3c26', belly: '#e0d2a6',
    far: '#7a6a48', farShade: '#56482e',
    armor: '#6e5c40', armorHi: '#cdbb8c', armorDark: '#46382a', spike: '#f0e4c2', club: '#5a4a34',
    claw: '#e9dcb8', eye: '#ff7a1a', ink: '#261c10'
  };

  /** キールのある骨の板（x, y = 中心、w, h = 大きさ、r = 傾き） */
  function scute(x, y, w, h, r) {
    return '<g transform="rotate(' + (r || 0) + ' ' + x + ' ' + y + ')">' +
      '<ellipse cx="' + x + '" cy="' + y + '" rx="' + w + '" ry="' + h + '" fill="' + C.armor + '" stroke="' + C.ink + '" stroke-width="1.2"/>' +
      '<path d="M' + (x - w * 0.8) + ' ' + (y + h * 0.1) + ' C' + (x - w * 0.3) + ' ' + (y - h * 0.9) + ' ' + (x + w * 0.3) + ' ' + (y - h * 0.9) + ' ' + (x + w * 0.8) + ' ' + (y + h * 0.1) + '" fill="none" stroke="' + C.armorHi + '" stroke-width="1.2" stroke-linecap="round"/>' +
      '<ellipse cx="' + x + '" cy="' + (y + h * 0.35) + '" rx="' + (w * 0.8) + '" ry="' + (h * 0.4) + '" fill="' + C.armorDark + '" opacity="0.45"/></g>';
  }
  function spike(x, y, len, ang, w) {
    var a = ang * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), nx = -sa, ny = ca;
    var tx = x + ca * len, ty = y + sa * len;
    return '<path d="M' + (x + nx * w).toFixed(1) + ' ' + (y + ny * w).toFixed(1) + ' L' + tx.toFixed(1) + ' ' + ty.toFixed(1) + ' L' + (x - nx * w).toFixed(1) + ' ' + (y - ny * w).toFixed(1) + ' Z" fill="' + C.spike + '" stroke="' + C.ink + '" stroke-width="1.2" stroke-linejoin="round"/>';
  }

  CUSTOM.ankylo = function (p) {
    var K = DN.artKit(p, C, 2.4);

    // ---- 奥の脚 ----
    p.open('p-legB', 60, 100);
    p.part('M48 100 C50 92 64 90 70 98 C72 106 72 116 70 124 L72 138 C74 141 76 144 76 146 L52 146 C52 142 54 139 56 136 L54 122 C48 114 46 106 48 100 Z', C.far, K.flat({ auto: K.auto(2.4, 3.2, 0.8, C.farShade) }));
    p.detail(K.hoof(58, 146, 0.75) + K.hoof(66, 146, 0.75) + K.hoof(72.6, 146, 0.7));
    p.close();
    p.open('p-foreB', 124, 102);
    p.part('M116 102 C120 96 132 96 134 104 C135 112 132 120 130 126 L132 138 C134 141 136 144 136 146 L114 146 C114 142 116 139 118 136 L118 124 C114 116 113 108 116 102 Z', C.far, K.flat({ auto: K.auto(2.4, 3.2, 0.8, C.farShade) }));
    p.detail(K.hoof(119, 146, 0.7) + K.hoof(126, 146, 0.7) + K.hoof(132.4, 146, 0.65));
    p.close();

    // ---- しっぽ（持ち上げて、先のこぶを振りかぶる）----
    p.open('p-tail', 44, 94);
    p.part('M48 88 C38 80 28 70 20 58 L26 54 C34 64 44 74 54 82 Z', C.body, K.flat({
      inner: scute(34, 68, 3.4, 2.6, -50) + scute(42, 77, 3.8, 2.8, -45) + scute(27, 60, 3, 2.4, -55),
      auto: K.auto(1.6, 2.2)
    }));
    p.detail(spike(30, 62, 7, -150, 2) + spike(38, 72, 7, -140, 2.2) + spike(46, 82, 7, -130, 2.4));
    // こぶ（二つに分かれた骨のかたまり）
    p.part('M8 58 C2 50 6 38 16 36 C24 34 30 40 30 48 C34 50 34 58 28 62 C22 66 12 66 8 58 Z', C.club, K.flat({
      inner: '<path d="M10 50 C12 42 20 40 26 44" fill="none" stroke="' + C.armorHi + '" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M14 60 C20 62 26 60 29 56" fill="none" stroke="' + C.armorDark + '" stroke-width="2" opacity="0.7"/>' +
        K.lines('M17 38 C18 46 19 54 22 62', 1.2, 0.45),
      auto: K.auto(2, 2.6, 0.6, C.armorDark)
    }));
    p.close();

    // ---- 胴（よろいでおおわれた低いドーム）----
    p.open('p-body', 96, 112);
    p.part('M36 98 C38 74 64 58 98 56 C130 55 152 68 158 90 L158 104 C140 114 110 116 84 114 C60 113 42 108 36 98 Z', C.body, K.flat({
      belly: 'M28 104 C60 112 110 116 166 104 L166 130 L28 130 Z',
      inner:
        // よろいの帯（4列）
        [[52, 80, -40], [62, 70, -26], [76, 63, -12], [92, 60, 0], [108, 60, 8], [124, 64, 18], [138, 71, 30], [148, 80, 44]].map(function (q) { return scute(q[0], q[1], 6.4, 4.6, q[2]); }).join('') +
        [[46, 92, -30], [58, 84, -20], [72, 78, -8], [88, 75, 0], [104, 75, 6], [120, 78, 14], [134, 84, 24], [146, 93, 34]].map(function (q) { return scute(q[0], q[1], 6, 4.2, q[2]); }).join('') +
        [[56, 99, -10], [70, 94, -4], [86, 91, 0], [102, 91, 4], [118, 93, 8], [132, 98, 14]].map(function (q) { return scute(q[0], q[1], 5.4, 3.8, q[2]); }).join('') +
        '<path d="M40 102 C70 106 110 108 156 100" fill="none" stroke="' + C.armorDark + '" stroke-width="2" opacity="0.5"/>',
      auto: K.auto(4, 5.4, 0.6)
    }));
    // わきのトゲ（外向き・下向き）
    p.detail(spike(44, 102, 9, 150, 2.6) + spike(60, 106, 10, 125, 2.8) + spike(78, 108, 10, 110, 3) + spike(96, 109, 10, 100, 3) +
      spike(114, 108, 10, 85, 3) + spike(132, 105, 10, 70, 2.8) + spike(148, 99, 9, 55, 2.6));
    // 肩の大きなトゲ
    p.detail(spike(150, 80, 12, -30, 3.2) + spike(144, 72, 11, -55, 3));
    p.close();

    // ---- 手前の後ろ脚 ----
    p.open('p-legF', 70, 100);
    p.part('M56 102 C58 92 76 90 82 100 C85 108 84 118 82 124 L84 138 C86 141 88 144 88 146 L62 146 C62 142 64 139 66 136 L64 122 C58 116 55 108 56 102 Z', C.body, K.flat({
      inner: K.lines('M66 126 l12 0 M66 132 l13 0 M66 138 l14 0', 0.9, 0.35) + K.lines('M60 112 C66 116 76 116 82 112', 1, 0.45),
      auto: K.auto(2.8, 3.4)
    }));
    p.detail(K.hoof(67, 146, 0.85) + K.hoof(75, 146, 0.85) + K.hoof(82.6, 146, 0.8));
    p.close();

    // ---- 手前の前脚 ----
    p.open('p-foreF', 136, 104);
    p.part('M126 104 C130 96 144 96 146 106 C147 114 144 122 142 128 L144 138 C146 141 148 144 148 146 L124 146 C124 142 126 139 128 136 L128 126 C124 118 123 110 126 104 Z', C.body, K.flat({
      inner: K.lines('M130 130 l11 0 M130 136 l12 0', 0.9, 0.35),
      auto: K.auto(2.6, 3.2)
    }));
    p.detail(K.hoof(129, 146, 0.8) + K.hoof(136.6, 146, 0.8) + K.hoof(143.6, 146, 0.75));
    p.close();

    // ---- 頭（三角の頭・角・くちばし）----
    p.open('p-head', 152, 94);
    p.part('M150 84 C160 76 176 76 186 84 C192 90 192 98 186 103 L176 106 L160 106 C152 102 148 92 150 84 Z', C.body, K.flat({
      belly: 'M144 100 L196 96 L196 112 L144 112 Z',
      inner: scute(162, 84, 4.6, 3.2, -8) + scute(174, 83, 4, 2.8, 6) + K.lines('M178 98 C182 100 186 100 190 98', 1, 0.45),
      auto: K.auto(2, 2.8, 0.7)
    }));
    p.part('M184 90 C190 91 194 96 192 101 L186 104 C185 99 185 94 184 90 Z', C.dark, { lw: 1.4, ol: C.ink, ink: true });
    p.detail(spike(152, 84, 8, -150, 2.4) + spike(158, 102, 7, 120, 2.2));
    p.raw(K.eye({ x: 170, y: 92, rx: 2.2, ry: 1.8, iris: C.eye, pupil: 'round', pr: 0.55, glow: '#ff9a3a' }));
    if (!p.sil) p.raw('<path d="M165.6 89.6 C168 88 172 88 175 89.4 L175 91 C172 90.2 168.6 90.4 166 91.6 Z" fill="' + C.armorDark + '" stroke="' + C.ink + '" stroke-width="0.8"/>');
    p.close();
  };
  CUSTOM.ankylo.box = [140, 66, 58];
})(window);
