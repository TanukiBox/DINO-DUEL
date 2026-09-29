/*
 * DINO DUEL 描きこみ版：草食恐竜（トリケラトプス・アンキロ・ステゴ・ブラキオ・イグアノドン以外）
 *   角のある四足：スティラコサウルス（長い鼻の角・えり飾りの長いトゲ）/ プロトケラトプス（角なし・小さなえり飾り）
 *   背中に板：ケントロサウルス（前は板、うしろはトゲ）
 *   首の長い大型：ディプロドクス（首としっぽを水平にのばす）/ アマルガサウルス（首に2列の長いトゲ）
 *   二足の草食：パラサウロロフス（筒のトサカ）/ パキケファロサウルス（石頭）/ プラテオサウルス（長い首）/ テリジノサウルス（巨大なかぎ爪）
 *   鎧：ガイアフォートレス（EX：よろいに背中の結晶の板）
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};
  var CUSTOM = DN.ART_CUSTOM = DN.ART_CUSTOM || {};

  function spikeP(C, x, y, len, ang, w, fill) {
    var a = ang * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), nx = -sa, ny = ca;
    return '<path d="M' + (x + nx * w).toFixed(1) + ' ' + (y + ny * w).toFixed(1) + ' L' + (x + ca * len).toFixed(1) + ' ' + (y + sa * len).toFixed(1) + ' L' + (x - nx * w).toFixed(1) + ' ' + (y - ny * w).toFixed(1) + ' Z" fill="' + (fill || C.spike) + '" stroke="' + C.ink + '" stroke-width="1.3" stroke-linejoin="round"/>';
  }

  // ================= 角のある四足（トリケラトプスと同じ骨格） =================
  var CER = {
    legB: 'M40 84 C42 70 62 66 72 78 C76 88 74 100 70 108 L70 134 C72 138 76 142 78 146 L52 146 C52 141 54 136 56 132 L56 114 C46 108 40 98 40 84 Z',
    foreB: 'M100 94 C106 90 118 92 120 102 C121 110 118 116 114 120 L116 134 C119 138 122 142 122 146 L98 146 C98 141 100 137 102 134 L102 120 C98 112 96 100 100 94 Z',
    tail: 'M46 70 C32 74 18 82 6 92 C3 95 5 98 9 97 C22 93 36 89 50 88 Z',
    body: 'M40 72 C44 56 60 46 78 46 C98 46 114 54 126 64 C134 70 140 78 140 90 C138 102 128 112 112 116 C94 120 72 118 58 110 C46 104 38 88 40 72 Z',
    legF: 'M50 84 C52 68 76 62 86 78 C90 88 88 100 84 108 L84 132 C86 136 90 140 92 146 L64 146 C64 141 66 136 68 132 L68 116 C58 110 50 100 50 84 Z',
    foreF: 'M112 92 C120 86 134 90 136 102 C137 110 132 116 128 120 L130 132 C133 136 136 140 137 146 L112 146 C112 141 114 137 116 134 L116 122 C110 114 106 100 112 92 Z',
    frill: 'M120 64 C114 40 130 20 150 22 C166 24 172 42 168 62 C164 78 152 90 140 92 C128 92 122 80 120 64 Z',
    frillSmall: 'M126 70 C122 52 132 38 148 40 C160 42 164 54 162 68 C158 80 150 88 140 90 C132 90 128 82 126 70 Z',
    face: 'M140 66 C150 58 166 60 176 66 C186 72 194 84 196 96 C197 102 194 106 188 106 L178 104 C166 100 152 96 144 90 C136 84 134 74 140 66 Z',
    beak: 'M183 86 C191 88 198 96 197 104 C193 108 187 108 181 104 C182 98 182 92 183 86 Z'
  };

  function ceratops(p, o) {
    var C = o.C, K = DN.artKit(p, C, 2.4);
    p.raw('<g transform="translate(-7 0)">');
    p.open('p-legB', 64, 80);
    p.part(CER.legB, C.far, K.flat({ auto: K.auto(3, 4, 0.8, C.farShade) }));
    p.detail(K.hoof(58, 146, 0.8) + K.hoof(66, 146, 0.8) + K.hoof(73, 146, 0.75));
    p.close();
    p.open('p-foreB', 114, 94);
    p.part(CER.foreB, C.far, K.flat({ auto: K.auto(2.6, 3.4, 0.8, C.farShade) }));
    p.detail(K.hoof(104, 146, 0.75) + K.hoof(111, 146, 0.75) + K.hoof(117, 146, 0.7));
    p.close();
    p.open('p-tail', 40, 80);
    p.part(CER.tail, C.body, K.flat({ belly: 'M52 86 C38 88 22 92 6 96 L0 110 L60 110 Z', auto: K.auto(2, 3) }));
    p.close();
    p.open('p-body', 90, 110);
    p.part(CER.body, C.body, K.flat({
      joinWith: [CER.tail],
      belly: 'M30 100 C56 112 90 116 122 110 C132 106 138 100 142 94 L150 140 L30 140 Z',
      inner: '<path d="M36 70 C48 52 76 44 102 48 C116 50 128 58 138 68" fill="none" stroke="' + C.dark + '" stroke-width="12" stroke-linecap="round" opacity="0.6"/>' + (o.bodyPat || '') +
        K.lines('M56 104 C70 110 90 112 108 108', 1.1, 0.4),
      auto: K.auto(5, 6.5, 0.65)
    }));
    p.close();
    p.open('p-legF', 70, 80);
    p.part(CER.legF, C.body, K.flat({ inner: K.lines('M58 104 C66 110 76 112 84 108', 1.1, 0.45), auto: K.auto(3.4, 4.2) }));
    p.detail(K.hoof(69, 146, 0.95) + K.hoof(78, 146, 0.95) + K.hoof(87, 146, 0.9));
    p.close();
    p.open('p-foreF', 124, 96);
    p.part(CER.foreF, C.body, K.flat({ inner: K.lines('M118 118 C122 120 126 120 129 118', 1, 0.45), auto: K.auto(3, 3.8) }));
    p.detail(K.hoof(117, 146, 0.85) + K.hoof(125, 146, 0.85) + K.hoof(132.6, 146, 0.8));
    p.close();
    // 頭
    p.open('p-head', 134, 80);
    o.head(p, K, C);
    p.close();
    p.raw('</g>');
  }

  CUSTOM.styraco = function (p) {
    var C = { body: '#9a7a4a', shade: '#634a26', dark: '#5a4424', stripe: '#3a2a14', belly: '#ecdcae', far: '#7a5e36', farShade: '#56411f',
      frill: '#c83a2a', frillDark: '#7a1e14', spike: '#f3e8cc', horn: '#f3e8cc', hornShade: '#c9b58c', beak: '#2e2016', claw: '#e9dcb8', eye: '#ffb21e', ink: '#221a0c' };
    ceratops(p, {
      C: C,
      bodyPat: DN.artKit(p, C, 2.4).spots([[64, 70, 3, 2], [80, 64, 3.4, 2.2], [96, 66, 3.2, 2.2], [112, 72, 3, 2], [74, 84, 2.6, 1.8], [92, 82, 2.6, 1.8], [106, 88, 2.2, 1.6]], C.stripe, 0.5),
      head: function (p, K, C) {
        // えり飾りの長いトゲ（6本、外向き）
        if (!p.sil) {
          var cx = 144, cy = 58, s = '';
          [[-150, 30], [-128, 34], [-104, 36], [-80, 34], [-56, 30], [-34, 24]].forEach(function (q) {
            var a = q[0] * Math.PI / 180, bx = cx + Math.cos(a) * 24, by = cy + Math.sin(a) * 30;
            s += spikeP(C, bx, by, q[1] - 16, q[0], 3.2);
          });
          p.raw(s);
        }
        p.part(CER.frill, C.frill, K.flat({
          inner: '<path d="M126 62 C122 44 134 30 150 31 C162 32 166 46 162 62" fill="none" stroke="' + C.frillDark + '" stroke-width="5" opacity="0.7"/>' +
            K.lines('M134 34 L142 64 M148 28 L148 62 M160 34 L154 62', 1.2, 0.35, C.frillDark),
          auto: K.auto(3.4, 4.2, 0.55, C.frillDark)
        }));
        p.part(CER.face, C.body, K.flat({ belly: 'M136 88 C150 96 170 102 196 104 L196 120 L136 120 Z', auto: K.auto(2.6, 3.4, 0.7) }));
        p.part(CER.beak, C.beak, { lw: 1.8, ol: C.ink, ink: true });
        // 長い鼻の角（大きく上へ）
        p.part('M174 80 C174 64 180 48 192 36 C192 52 188 68 184 82 Z', C.horn, K.flat({ lw: 1.8, inner: '<path d="M179 82 C181 66 186 50 192 36 L193 44 L184 84 Z" fill="' + C.hornShade + '"/>' }));
        p.detail(spikeP(C, 160, 70, 6, -70, 2.2) + spikeP(C, 154, 68, 5, -100, 2));
        p.raw(K.eye({ x: 162, y: 78, rx: 2.8, ry: 2.4, iris: C.eye, pupil: 'round', pr: 0.55 }));
        if (!p.sil) p.raw('<path d="M156.6 75 C159 72.6 164 72.4 167 74.4 L167.2 76 C164 75 160 75.2 157.4 76.8 Z" fill="' + C.dark + '" stroke="' + C.ink + '" stroke-width="0.9"/>');
      }
    });
  };
  CUSTOM.styraco.box = [113, 16, 88];

  CUSTOM.proto = function (p) {
    var C = { body: '#c8a86a', shade: '#8e6e3a', dark: '#7a5a2a', stripe: '#5a3e1a', belly: '#f4e8c8', far: '#a2844e', farShade: '#7a6034',
      frill: '#b8704a', frillDark: '#6e3a1e', beak: '#3a2a18', claw: '#ece0c0', eye: '#3a2a10', ink: '#2a1c0a' };
    ceratops(p, {
      C: C,
      bodyPat: DN.artKit(p, C, 2.4).spots([[66, 68, 2.6, 1.8], [82, 62, 3, 2], [100, 64, 2.8, 2], [114, 72, 2.6, 1.8], [78, 80, 2.2, 1.6], [96, 80, 2.4, 1.6]], C.stripe, 0.5),
      head: function (p, K, C) {
        // 小さなえり飾り（トゲなし）
        p.part(CER.frillSmall, C.frill, K.flat({
          inner: '<path d="M130 70 C126 54 136 44 148 45 C156 46 159 56 157 68" fill="none" stroke="' + C.frillDark + '" stroke-width="3.4" opacity="0.6"/>',
          auto: K.auto(2.6, 3.4, 0.5, C.frillDark)
        }));
        p.part(CER.face, C.body, K.flat({ belly: 'M136 88 C150 96 170 102 196 104 L196 120 L136 120 Z', auto: K.auto(2.6, 3.4, 0.7) }));
        // 大きなくちばし
        p.part('M180 82 C190 83 199 92 198 102 C194 108 186 108 178 104 C180 96 180 88 180 82 Z', C.beak, { lw: 1.8, ol: C.ink, ink: true });
        p.detail('<ellipse cx="154" cy="92" rx="4" ry="3" fill="' + C.dark + '" stroke="' + C.ink + '" stroke-width="1"/>');
        p.raw(K.eye({ x: 162, y: 76, rx: 3.4, ry: 3.2, iris: C.eye, white: true, pupil: 'round', pr: 0.7 }));
        if (!p.sil) p.raw('<path d="M157 72.6 C159.6 70.6 164.6 70.6 167.4 72.6" fill="none" stroke="' + C.ink + '" stroke-width="1" stroke-linecap="round"/>');
      }
    });
  };
  CUSTOM.proto.box = [113, 30, 84];

  // ================= ケントロサウルス（前は板、うしろはトゲ） =================
  CUSTOM.kentro = function (p) {
    var C = { body: '#a2904a', shade: '#6a5a26', dark: '#5a4e24', stripe: '#3a3216', belly: '#f0e8c0', far: '#80703a', farShade: '#5e5228',
      plate: '#c8b27a', plateDark: '#7e6a3a', spike: '#f0e6c8', claw: '#ece0bc', eye: '#ffcc3a', ink: '#221e0c' };
    var K = DN.artKit(p, C, 2.4);
    function plate(x, y, h, w, r, far) {
      return '<g transform="rotate(' + (r || 0) + ' ' + x + ' ' + y + ')"><path d="M' + (x - w) + ' ' + (y + 4) + ' C' + (x - w) + ' ' + (y - h * 0.5) + ' ' + (x - w * 0.4) + ' ' + (y - h * 0.9) + ' ' + x + ' ' + (y - h) +
        ' C' + (x + w * 0.4) + ' ' + (y - h * 0.9) + ' ' + (x + w) + ' ' + (y - h * 0.5) + ' ' + (x + w) + ' ' + (y + 4) + ' Z" fill="' + (far ? C.plateDark : C.plate) + '" stroke="' + C.ink + '" stroke-width="1.5" stroke-linejoin="round"/></g>';
    }
    var TAIL = 'M48 70 C38 70 26 66 14 58 C10 55 6 54 5 57 C6 62 12 68 20 74 C30 84 40 92 50 100 Z';
    var BODY = 'M30 86 C40 68 58 54 80 52 C102 50 120 60 136 74 C146 82 156 90 164 96 L168 106 C156 108 144 108 132 110 C112 118 88 118 68 114 C50 110 36 100 30 86 Z';
    // 奥の列：板とトゲ
    p.detail(plate(132, 70, 10, 5, 34, true) + plate(116, 60, 12, 6, 20, true) + spikeP(C, 96, 54, 18, -84, 3, C.plateDark) + spikeP(C, 76, 54, 20, -98, 3, C.plateDark) + spikeP(C, 56, 62, 20, -112, 3, C.plateDark));
    p.open('p-legB', 70, 90);
    p.part('M54 86 C56 72 78 68 86 82 C90 92 88 104 84 112 L84 134 C86 138 88 142 90 146 L64 146 C64 141 66 137 68 133 L68 118 C58 110 53 98 54 86 Z', C.far, K.flat({ auto: K.auto(3, 4, 0.8, C.farShade) }));
    p.detail(K.hoof(69, 146, 0.8) + K.hoof(77, 146, 0.8) + K.hoof(84.6, 146, 0.75));
    p.close();
    p.open('p-foreB', 138, 104);
    p.part('M130 102 C134 96 144 98 146 106 C147 114 144 120 142 124 L143 138 C145 141 147 144 147 146 L127 146 C127 142 129 139 131 136 L131 124 C128 116 127 108 130 102 Z', C.far, K.flat({ auto: K.auto(2.4, 3, 0.8, C.farShade) }));
    p.close();
    p.open('p-tail', 44, 86);
    p.part(TAIL, C.body, K.flat({ belly: 'M52 96 C40 88 28 80 18 72 C12 66 8 62 5 58 L0 70 L0 110 L60 110 Z', auto: K.auto(1.8, 2.6) }));
    p.detail(spikeP(C, 40, 72, 16, -110, 2.8) + spikeP(C, 30, 66, 18, -120, 2.8) + spikeP(C, 20, 60, 18, -130, 2.6) + spikeP(C, 10, 57, 16, -150, 2.6));
    p.close();
    p.open('p-body', 96, 112);
    p.part(BODY, C.body, K.flat({
      joinWith: [TAIL],
      belly: 'M24 96 C50 110 90 116 130 108 C146 106 158 104 170 100 L170 130 L24 130 Z',
      inner: '<path d="M26 82 C40 62 66 50 90 50 C112 50 130 62 146 78 C154 86 162 92 168 96" fill="none" stroke="' + C.dark + '" stroke-width="12" stroke-linecap="round" opacity="0.55"/>' +
        K.rot(-10, 60, 66, K.stripe(60, 66, 20, -3, 8)) + K.rot(0, 84, 58, K.stripe(84, 58, 22, -3, 9)) + K.rot(12, 110, 64, K.stripe(110, 64, 18, -2, 8)),
      auto: K.auto(4.5, 6, 0.6)
    }));
    p.close();
    // 手前の列：前は板、うしろは長いトゲ・肩のトゲ
    p.detail(plate(146, 80, 9, 5, 42) + plate(128, 66, 12, 6, 28) + plate(110, 56, 14, 7, 12) +
      spikeP(C, 90, 52, 22, -88, 3.2) + spikeP(C, 70, 56, 24, -104, 3.2) + spikeP(C, 50, 66, 22, -118, 3.2) + spikeP(C, 104, 96, 20, 160, 3.4));
    p.open('p-legF', 78, 90);
    p.part('M62 88 C64 72 88 68 96 84 C100 94 98 106 94 114 L94 134 C96 138 98 142 100 146 L72 146 C72 141 74 137 76 133 L76 120 C66 112 61 100 62 88 Z', C.body, K.flat({ auto: K.auto(3.4, 4.2) }));
    p.detail(K.hoof(77, 146, 0.9) + K.hoof(86, 146, 0.9) + K.hoof(94.4, 146, 0.85));
    p.close();
    p.open('p-foreF', 148, 104);
    p.part('M140 102 C144 96 156 98 158 106 C159 114 156 120 154 124 L155 138 C157 141 159 144 159 146 L138 146 C138 142 140 139 142 136 L142 124 C138 116 137 108 140 102 Z', C.body, K.flat({ auto: K.auto(2.6, 3.2) }));
    p.detail(K.hoof(142, 146, 0.8) + K.hoof(149, 146, 0.8) + K.hoof(155.6, 146, 0.75));
    p.close();
    p.open('p-head', 164, 100);
    p.part('M162 94 C168 88 182 88 192 94 C197 98 196 104 190 106 L172 108 C165 106 160 100 162 94 Z', C.body, K.flat({ belly: 'M156 102 L200 100 L200 114 L156 114 Z', auto: K.auto(1.8, 2.4, 0.7) }));
    p.part('M188 95 C193 96 197 99 196 103 L190 106 C189 102 189 98 188 95 Z', C.dark, { lw: 1.3, ol: C.ink, ink: true });
    p.raw(K.eye({ x: 176, y: 96, rx: 2.4, ry: 2, iris: C.eye, pupil: 'round', pr: 0.55 }));
    p.close();
  };
  CUSTOM.kentro.box = [150, 78, 50];

  // ================= ディプロドクス（首としっぽを水平にのばす） =================
  CUSTOM.diplo = function (p) {
    var C = { body: '#8e9c6c', shade: '#5a6840', dark: '#4a5a34', stripe: '#2e3a1e', belly: '#eeeed2', far: '#6e7c4e', farShade: '#505c38', claw: '#e8e2c8', eye: '#3a2a14', ink: '#1c220e' };
    var K = DN.artKit(p, C, 2.3);
    var TAIL = 'M60 78 C42 72 22 64 4 56 C1 55 0 57 2 58.4 C20 68 40 82 58 98 Z';
    var BODY = 'M50 86 C56 70 78 62 104 62 C126 62 140 68 148 80 C152 90 148 102 136 108 C118 116 92 118 72 114 C58 110 46 100 50 86 Z';
    p.open('p-legB', 64, 90);
    p.part('M52 88 C54 76 72 72 78 84 C81 94 80 106 78 114 L78 136 C80 139 82 143 82 146 L58 146 C58 142 60 138 62 135 L62 116 C54 108 50 98 52 88 Z', C.far, K.flat({ auto: K.auto(2.6, 3.4, 0.8, C.farShade) }));
    p.close();
    p.open('p-foreB', 124, 96);
    p.part('M116 96 C120 90 132 90 134 100 C135 108 133 116 131 122 L131 138 C133 141 135 144 135 146 L113 146 C113 142 115 139 117 136 L117 122 C113 114 112 104 116 96 Z', C.far, K.flat({ auto: K.auto(2.4, 3, 0.8, C.farShade) }));
    p.close();
    p.open('p-tail', 56, 84);
    p.part(TAIL, C.body, K.flat({ belly: 'M58 92 C42 80 24 70 6 62 L0 90 L60 110 Z', inner: K.rot(20, 30, 64, K.stripe(30, 64, 6, -1, 4)) + K.rot(22, 44, 70, K.stripe(44, 70, 8, -1, 5)), auto: K.auto(1.6, 2.4) }));
    p.close();
    p.open('p-body', 96, 110);
    p.part(BODY, C.body, K.flat({
      joinWith: [TAIL],
      belly: 'M40 100 C64 112 100 116 140 104 L150 130 L40 130 Z',
      inner: '<path d="M48 80 C60 66 84 60 108 60 C128 60 142 68 150 80" fill="none" stroke="' + C.dark + '" stroke-width="12" stroke-linecap="round" opacity="0.55"/>' +
        K.rot(8, 72, 66, K.stripe(72, 66, 20, -2, 9)) + K.rot(0, 96, 64, K.stripe(96, 64, 22, -2, 10)) + K.rot(-8, 120, 66, K.stripe(120, 66, 20, -1, 9)) +
        '<path d="M62 64 l4 -5 l4 5 l4 -5 l4 5 l4 -5 l4 5 l4 -5 l4 5 l4 -5 l4 5 l4 -5 l4 5 l4 -5 l4 5" fill="none" stroke="' + C.dark + '" stroke-width="1.6" opacity="0.7"/>',
      auto: K.auto(4.5, 6, 0.6)
    }));
    p.close();
    p.open('p-legF', 72, 90);
    p.part('M60 88 C62 74 82 70 88 84 C91 94 90 106 88 114 L88 136 C90 139 92 143 92 146 L66 146 C66 142 68 138 70 135 L70 116 C62 108 58 98 60 88 Z', C.body, K.flat({ inner: K.lines('M70 126 l16 0 M70 132 l17 0 M70 138 l18 0', 0.8, 0.3), auto: K.auto(3, 4) }));
    p.detail(K.hoof(70, 146, 0.9) + K.hoof(78.6, 146, 0.9) + K.hoof(86.6, 146, 0.85));
    p.close();
    p.open('p-foreF', 132, 96);
    p.part('M124 96 C128 88 142 88 144 98 C145 106 143 114 141 120 L141 138 C143 141 145 144 145 146 L121 146 C121 142 123 139 125 136 L125 122 C121 114 120 104 124 96 Z', C.body, K.flat({ auto: K.auto(2.6, 3.4) }));
    p.detail(K.hoof(125, 146, 0.8) + K.hoof(132.4, 146, 0.8) + K.hoof(139.4, 146, 0.75));
    p.close();
    // 長い首と小さな頭（ほぼ水平）
    p.open('p-head', 142, 80);
    p.part('M134 70 C150 62 166 52 178 44 C184 40 190 38 194 40 L196 50 C190 50 184 54 178 58 C166 68 154 80 146 92 Z', C.body, K.flat({
      joinWith: [BODY],
      belly: 'M150 88 C162 74 176 62 196 50 L200 70 L150 100 Z',
      inner: '<path d="M134 68 C150 60 166 50 184 40" fill="none" stroke="' + C.dark + '" stroke-width="6" stroke-linecap="round" opacity="0.5"/>' + K.lines('M160 64 l3 4 M168 58 l3 4 M176 52 l3 4', 1, 0.35),
      auto: K.auto(2.2, 3, 0.6)
    }));
    p.part('M184 42 C186 35 194 32 199 36 C201.6 39 201 44 197 45.6 L187 46.6 C183 45.6 182 44 184 42 Z', C.body, K.flat({ lw: 1.9, belly: 'M180 43 L204 41 L204 52 L180 52 Z', auto: K.auto(1, 1.4, 0.6) }));
    p.detail(K.teethRow(189, 45.6, 199, 44.8, 4, 1.4, 2, 1));
    p.raw(K.eye({ x: 191, y: 38.6, rx: 1.9, ry: 1.8, iris: C.eye, white: true, pupil: 'round', pr: 0.7 }));
    p.close();
  };
  CUSTOM.diplo.box = [164, 24, 40];

  // ================= アマルガサウルス（首に2列の長いトゲ） =================
  CUSTOM.amarga = function (p) {
    var C = { body: '#bc8c5a', shade: '#805a30', dark: '#6a4a2a', stripe: '#4a2e14', belly: '#f2e2c2', far: '#946c42', farShade: '#6e4e2e',
      spine: '#4a2e20', spineTip: '#f2e2c2', claw: '#ece0c0', eye: '#2a1a0c', ink: '#22160a' };
    var K = DN.artKit(p, C, 2.4);
    var TAIL = 'M50 78 C36 84 22 94 8 108 C4 112 4 116 9 115 C22 110 36 106 50 104 Z';
    var BODY = 'M30 90 C38 80 54 72 74 68 C92 64 108 60 122 60 C134 60 142 66 144 78 C146 90 142 102 132 108 C114 116 90 118 70 116 C52 114 38 104 30 90 Z';
    function spine(x, y, len, ang, far) {
      var a = ang * Math.PI / 180, tx = x + Math.cos(a) * len, ty = y + Math.sin(a) * len;
      return '<path d="M' + (x - 1.8) + ' ' + y + ' L' + tx.toFixed(1) + ' ' + ty.toFixed(1) + ' L' + (x + 1.8) + ' ' + y + ' Z" fill="' + (far ? C.stripe : C.spine) + '" stroke="' + C.ink + '" stroke-width="1" stroke-linejoin="round"/>' +
        (far ? '' : '<circle cx="' + tx.toFixed(1) + '" cy="' + ty.toFixed(1) + '" r="1.2" fill="' + C.spineTip + '"/>');
    }
    p.open('p-legB', 60, 96);
    p.part('M44 96 C46 84 64 80 72 92 C75 100 74 110 72 118 L72 136 C74 139 76 143 76 146 L50 146 C50 142 52 138 54 135 L54 118 C47 112 43 104 44 96 Z', C.far, K.flat({ auto: K.auto(2.6, 3.4, 0.8, C.farShade) }));
    p.close();
    p.open('p-foreB', 112, 88);
    p.part('M104 86 C108 80 120 80 122 90 C124 98 122 108 120 116 L120 136 C122 139 124 143 124 146 L100 146 C100 142 102 138 104 135 L104 114 C100 104 100 94 104 86 Z', C.far, K.flat({ auto: K.auto(2.6, 3.4, 0.8, C.farShade) }));
    p.close();
    p.open('p-tail', 44, 94);
    p.part(TAIL, C.body, K.flat({ belly: 'M50 100 C36 104 22 108 8 114 L0 130 L60 130 Z', auto: K.auto(1.8, 2.6) }));
    p.close();
    p.open('p-body', 90, 112);
    // 背中の短いトゲ（奥）
    p.detail([[64, 70], [80, 66], [96, 62], [112, 60]].map(function (q, i) { return spine(q[0], q[1], 10 - i, -96, true); }).join(''));
    p.part(BODY, C.body, K.flat({
      joinWith: [TAIL],
      belly: 'M24 100 C50 112 90 118 128 110 C138 104 144 96 148 88 L150 130 L24 130 Z',
      inner: '<path d="M26 86 C40 74 62 68 84 64 C100 60 112 58 126 58" fill="none" stroke="' + C.dark + '" stroke-width="12" stroke-linecap="round" opacity="0.5"/>' +
        K.rot(4, 70, 74, K.stripe(70, 74, 22, -2, 9)) + K.rot(0, 96, 68, K.stripe(96, 68, 24, -2, 10)) + K.rot(-6, 120, 66, K.stripe(120, 66, 20, -1, 8)),
      auto: K.auto(4.5, 6, 0.6)
    }));
    p.close();
    p.open('p-legF', 66, 96);
    p.part('M52 96 C54 82 76 78 84 92 C87 100 86 112 84 120 L84 136 C86 139 88 143 88 146 L60 146 C60 142 62 138 64 135 L64 120 C56 114 51 106 52 96 Z', C.body, K.flat({ auto: K.auto(3, 4) }));
    p.detail(K.hoof(65, 146, 0.9) + K.hoof(73.6, 146, 0.9) + K.hoof(81.6, 146, 0.85));
    p.close();
    p.open('p-foreF', 126, 88);
    p.part('M116 86 C120 78 134 78 136 88 C138 96 136 106 134 114 L134 136 C136 139 138 143 138 146 L112 146 C112 142 114 138 116 135 L116 112 C112 102 112 94 116 86 Z', C.body, K.flat({ auto: K.auto(3, 4) }));
    p.detail(K.hoof(117, 146, 0.9) + K.hoof(125.6, 146, 0.9) + K.hoof(133.6, 146, 0.85));
    p.close();
    // 首（ななめ上）と2列の長いトゲ
    p.open('p-head', 130, 68);
    var NECK = 'M120 64 C128 52 138 42 150 34 C156 30 164 28 170 30 L172 42 C164 42 158 46 152 52 C146 60 144 70 142 80 L124 78 Z';
    if (!p.sil) p.raw([[128, 56, 26, -110], [136, 48, 28, -104], [144, 41, 28, -98], [152, 36, 24, -92], [160, 32, 18, -86]].map(function (q) { return spine(q[0] - 3, q[1] + 1, q[2], q[3] - 6, true); }).join(''));
    p.part(NECK, C.body, K.flat({
      joinWith: [BODY],
      belly: 'M166 38 C158 44 152 54 148 64 C144 74 142 82 142 90 L160 90 L176 36 Z',
      inner: '<path d="M118 62 C128 50 140 40 154 32" fill="none" stroke="' + C.dark + '" stroke-width="7" stroke-linecap="round" opacity="0.5"/>',
      auto: K.auto(2.4, 3.2, 0.6)
    }));
    if (!p.sil) p.raw([[128, 56, 24, -106], [136, 48, 26, -100], [144, 41, 26, -94], [152, 36, 22, -88], [160, 32, 16, -82]].map(function (q) { return spine(q[0], q[1], q[2], q[3]); }).join(''));
    p.part('M164 28 C166 20 178 17 188 21 C194 24 197 29 195 33 C193 36 189 36 184 36 L170 37 C164 35 162 32 164 28 Z', C.body, K.flat({ lw: 2, belly: 'M158 33 L200 31 L200 44 L158 44 Z', auto: K.auto(1.4, 2, 0.6) }));
    p.raw(K.eye({ x: 176, y: 26, rx: 2.4, ry: 2.2, iris: C.eye, white: true, pupil: 'round', pr: 0.7 }));
    p.close();
  };
  CUSTOM.amarga.box = [140, 4, 60];

  // ================= 二足の草食（イグアノドンと同じ骨格） =================
  var ORN = {
    leg: 'M68 84 C70 70 92 66 100 80 C105 90 104 102 99 110 C95 116 92 120 90 124 C95 130 101 136 107 140 C110 142 112 144 112 146 L86 146 C84 143 83 139 83 135 C83 129 84 124 84 120 C74 114 67 100 68 84 Z',
    tail: 'M78 68 C58 66 34 66 10 66 C5 66 2 68 3 70 C6 72 12 72 18 73 C40 76 58 82 74 92 Z',
    body: 'M70 70 C78 58 94 50 112 46 C120 44 128 40 134 34 L150 44 C146 54 140 64 134 74 C128 86 118 96 104 100 C90 104 78 98 72 90 C68 84 66 76 70 70 Z',
    head: 'M134 34 C136 24 146 18 158 18 C170 18 182 22 192 28 C198 32 198 38 192 40 L176 42 C166 44 156 46 148 46 C140 46 134 42 134 34 Z'
  };
  function ornithopod(p, o) {
    var C = o.C, K = DN.artKit(p, C, 2.4);
    p.open('p-legB', 76, 82);
    p.raw('<g transform="translate(-18 0)">');
    p.part(ORN.leg, C.far, K.flat({ auto: K.auto(3, 4, 0.8, C.farShade) }));
    p.detail(K.hoof(92, 146, 0.8) + K.hoof(100, 146, 0.8) + K.hoof(107.4, 146, 0.75));
    p.raw('</g>');
    p.close();
    p.open('p-armB', 120, 66);
    p.part('M116 62 C124 60 132 62 138 66 L144 63 C146 62 148 64 146 66 L142 70 L145 72 C146 74 144 76 142 74 L136 72 C128 72 120 70 116 66 Z', C.farShade, { lw: 1.8, ol: C.ink, ink: true });
    p.close();
    p.open('p-tail', 76, 80);
    p.part(ORN.tail, C.body, K.flat({
      belly: 'M80 88 C62 80 40 76 12 72 L0 100 L90 100 Z',
      inner: '<path d="M0 66 C30 66 56 66 80 68" fill="none" stroke="' + C.dark + '" stroke-width="7" stroke-linecap="round" opacity="0.55"/>' + (o.tailPat || ''),
      auto: K.auto(2, 2.8)
    }));
    p.close();
    p.open('p-body', 96, 104);
    p.part(ORN.body, C.body, K.flat({
      joinWith: [ORN.tail],
      belly: 'M154 42 C148 56 140 70 132 82 C122 94 108 100 94 100 L90 130 L170 130 Z',
      inner: '<path d="M64 70 C76 56 98 46 118 44 C126 42 132 38 138 30" fill="none" stroke="' + C.dark + '" stroke-width="10" stroke-linecap="round" opacity="0.55"/>' + (o.bodyPat || '') +
        K.lines('M78 90 C88 96 102 98 114 94', 1.1, 0.35),
      auto: K.auto(4, 5.5, 0.65)
    }));
    p.close();
    p.open('p-legF', 84, 82);
    p.part(ORN.leg, C.body, K.flat({ inner: K.lines('M74 104 C82 110 92 112 100 108', 1.2, 0.5) + K.lines('M92 128 l3 -2 M97 132 l3 -2 M102 135 l3 -1.8', 0.9, 0.45), auto: K.auto(3.6, 4.4) }));
    p.detail(K.hoof(92, 146, 0.9) + K.hoof(100.6, 146, 0.9) + K.hoof(108.4, 146, 0.85));
    p.close();
    p.open('p-head', 140, 40);
    o.head(p, K, C);
    p.close();
    p.open('p-armF', 124, 62);
    p.raw('<g transform="translate(-2 12) rotate(12 124 62)">');
    p.part('M120 58 C128 56 138 58 146 62 L152 60 C154 60 155 62 153 64 L148 68 L151 70 C152 72 150 74 148 72 L141 70 C132 70 124 68 120 64 Z', C.body, K.flat({ lw: 2, auto: K.auto(1.6, 2.2) }));
    p.raw('</g>');
    p.close();
  }

  CUSTOM.parasaur = function (p) {
    var C = { body: '#5c8ca2', shade: '#345a6e', dark: '#2e5264', stripe: '#1a3644', belly: '#e2eeee', far: '#467488', farShade: '#325466',
      crest: '#e46a34', crestDark: '#9a3a16', beak: '#e8c46a', claw: '#e8e4d4', eye: '#ffb21e', ink: '#0e1e26' };
    var K0 = DN.artKit(p, C, 2.4);
    ornithopod(p, {
      C: C,
      tailPat: K0.stripe(24, 67, 4, -1, 3) + K0.stripe(38, 67, 6, -1.4, 3.8) + K0.stripe(52, 67, 8, -1.8, 4.4) + K0.stripe(66, 68, 10, -2, 5),
      bodyPat: K0.rot(10, 84, 58, K0.stripe(84, 58, 12, -2, 4.6)) + K0.rot(0, 96, 52, K0.stripe(96, 52, 14, -2, 5)) + K0.rot(-10, 108, 48, K0.stripe(108, 48, 13, -1, 4.8)),
      head: function (p, K, C) {
        // うしろへのびる筒のトサカ
        p.part('M148 24 C142 12 128 4 110 2 C104 2 102 6 106 9 C120 12 134 20 140 32 Z', C.crest, K.flat({
          lw: 2, inner: '<path d="M146 22 C140 12 126 6 112 5" fill="none" stroke="' + C.crestDark + '" stroke-width="2.4" opacity="0.7"/>', auto: K.auto(1.4, 2, 0.5, C.crestDark)
        }));
        p.part(ORN.head, C.body, K.flat({
          belly: 'M128 40 C150 42 176 40 202 36 L202 56 L128 56 Z',
          inner: '<path d="M132 28 C144 18 166 18 190 26" fill="none" stroke="' + C.dark + '" stroke-width="6" stroke-linecap="round" opacity="0.5"/>',
          auto: K.auto(2.4, 3.2, 0.7)
        }));
        // 平たいくちばし（カモのよう）
        p.part('M180 27 C191 26 200 31 200 37 C199 41 193 42 185 41 C183 36 182 31 180 27 Z', C.beak, { lw: 1.8, ol: C.ink, ink: true });
        p.raw(K.eye({ x: 154, y: 28, rx: 3, ry: 2.8, iris: C.eye, white: true, pupil: 'round', pr: 0.6 }));
      }
    });
  };
  CUSTOM.parasaur.box = [104, 0, 96];

  CUSTOM.pachy = function (p) {
    var C = { body: '#c47c4a', shade: '#8a4e26', dark: '#6a3a1a', stripe: '#4a220e', belly: '#f6dec2', far: '#9e5e36', farShade: '#724226',
      dome: '#8a4a2a', knob: '#f4d8b4', beak: '#3a2210', claw: '#ecdcc0', eye: '#ff6a1a', ink: '#240e04' };
    var K0 = DN.artKit(p, C, 2.4);
    ornithopod(p, {
      C: C,
      tailPat: K0.spots([[26, 68, 1.8], [40, 69, 2], [54, 71, 2.2], [66, 74, 2.2]], C.stripe, 0.7),
      bodyPat: K0.spots([[86, 58, 3, 2], [100, 54, 3, 2], [114, 52, 2.6, 1.8], [94, 70, 2.4, 1.6], [108, 66, 2.4, 1.6]], C.stripe, 0.7),
      head: function (p, K, C) {
        // 頭を少し下げて、石頭のドームを前へ
        p.raw('<g transform="rotate(14 140 40)">');
        p.part('M134 38 C136 30 144 26 154 26 C166 26 180 28 188 34 C194 38 194 42 188 44 L172 46 C162 47 152 48 146 48 C138 47 134 44 134 38 Z', C.body, K.flat({ belly: 'M128 43 C150 45 176 43 200 40 L200 60 L128 60 Z', auto: K.auto(2, 2.8, 0.7) }));
        p.part('M140 30 C138 14 150 4 164 6 C176 8 182 18 180 30 C170 26 154 26 140 30 Z', C.dome, K.flat({
          inner: '<path d="M146 14 C152 9 162 9 170 12" fill="none" stroke="#fff" stroke-width="2.4" opacity="0.35" stroke-linecap="round"/>', auto: K.auto(1.8, 2.4, 0.6, '#5a2a14')
        }));
        if (!p.sil) p.raw([[138, 30], [142, 26], [178, 24], [182, 30], [186, 34]].map(function (q) { return '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="2.2" fill="' + C.knob + '" stroke="' + C.ink + '" stroke-width="1"/>'; }).join(''));
        p.part('M184 34 C190 35 194 38 193 42 L188 44 C187 40 186 37 184 34 Z', C.beak, { lw: 1.3, ol: C.ink, ink: true });
        p.raw(K.eye({ x: 160, y: 34, rx: 2.8, ry: 2.4, iris: C.eye, pupil: 'round', pr: 0.55, glow: '#ff8a3a' }));
        if (!p.sil) p.raw('<path d="M154 31 C157 29 163 29 166 31" fill="none" stroke="' + C.ink + '" stroke-width="1.6" stroke-linecap="round"/>');
        p.raw('</g>');
      }
    });
  };
  CUSTOM.pachy.box = [128, 4, 72];

  CUSTOM.plateo = function (p) {
    var C = { body: '#bc9e5c', shade: '#80683a', dark: '#6a5230', stripe: '#46341a', belly: '#f4ead0', far: '#967c48', farShade: '#6e5a32',
      beak: '#6a5230', claw: '#ecdcc0', eye: '#ffb21e', ink: '#221a08' };
    var K0 = DN.artKit(p, C, 2.4);
    ornithopod(p, {
      C: C,
      tailPat: K0.rot(0, 40, 68, K0.stripe(40, 68, 7, -1, 6)) + K0.rot(0, 62, 69, K0.stripe(62, 69, 10, -1.6, 7)),
      bodyPat: K0.rot(4, 92, 54, K0.stripe(92, 54, 16, -2, 8)) + K0.rot(-8, 114, 48, K0.stripe(114, 48, 14, -1, 7)),
      head: function (p, K, C) {
        // 長い首（上へ）と小さな頭
        p.part('M132 42 C136 32 144 22 154 14 L164 22 C156 28 150 36 146 48 Z', C.body, K.flat({
          joinWith: [ORN.body], belly: 'M160 20 C154 28 150 38 146 50 L160 50 L168 18 Z', auto: K.auto(1.8, 2.4, 0.6)
        }));
        p.part('M150 14 C152 7 160 4 168 5 C176 6 184 10 188 15 C190 19 187 22 182 22 L166 23 C158 23 150 20 150 14 Z', C.body, K.flat({
          lw: 2, belly: 'M146 19 C160 20 176 19 194 17 L194 30 L146 30 Z', auto: K.auto(1.4, 2, 0.6)
        }));
        p.detail(K.teethRow(170, 22, 184, 21.2, 5, 1.6, 2, 1));
        p.raw(K.eye({ x: 162, y: 11.6, rx: 2.6, ry: 2.4, iris: C.eye, white: true, pupil: 'round', pr: 0.6 }));
      }
    });
  };
  CUSTOM.plateo.box = [140, 0, 58];

  // ================= テリジノサウルス（SSR：巨大な鎌のかぎ爪） =================
  CUSTOM.therizino = function (p) {
    var C = { body: '#8c6c9e', shade: '#5a4270', dark: '#4a3458', stripe: '#2e1e3a', belly: '#f2e6f4', far: '#6c5280', farShade: '#4e3a60',
      feather: '#6a4a82', featherTip: '#e6d4f0', claw: '#f4ead0', clawShade: '#c8b890', beak: '#e8c46a', eye: '#ffd23a', ink: '#1a1022' };
    var K = DN.artKit(p, C, 2.5);
    var TAIL = 'M72 70 C58 70 42 72 26 76 C20 78 19 82 25 83 C42 84 56 88 70 94 Z';
    var BODY = 'M62 72 C66 54 84 44 104 42 C120 40 132 34 140 22 L156 30 C152 44 148 58 144 72 C142 92 132 110 110 116 C90 120 72 112 64 100 C58 92 58 80 62 72 Z';
    var LEG = 'M62 88 C64 74 86 70 94 84 C98 94 98 106 94 114 L94 134 C97 138 101 141 104 142 L104 146 L74 146 C72 142 72 138 74 134 L74 118 C66 112 60 100 62 88 Z';
    function feathers(x0, y0, x1, y1, n, len, col) {
      var s = '';
      for (var i = 0; i <= n; i++) {
        var t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
        s += '<path d="M' + (x - 3) + ' ' + y + ' L' + (x - 1) + ' ' + (y - len) + ' L' + (x + 2) + ' ' + y + ' Z" fill="' + col + '"/>';
      }
      return s;
    }
    p.open('p-legB', 76, 86);
    p.raw('<g transform="translate(-16 0)">');
    p.part(LEG, C.far, K.flat({ auto: K.auto(3, 4, 0.8, C.farShade) }));
    p.detail(K.claw(102, 145, 0.8) + K.claw(95, 145.4, 0.7) + K.claw(88, 145.6, 0.65));
    p.raw('</g>');
    p.close();
    // 奥の腕（かぎ爪）
    p.open('p-armB', 128, 60);
    p.raw('<g transform="translate(-10 -2)">');
    p.part('M126 58 C136 62 146 72 152 84 L150 90 C144 80 136 72 124 68 Z', C.farShade, { lw: 2, ol: C.ink, ink: true });
    p.detail('<path d="M150 86 C162 92 172 104 176 120 C168 110 160 100 148 92 Z M146 88 C154 98 160 112 160 126 C154 114 148 104 142 94 Z" fill="' + C.clawShade + '" stroke="' + C.ink + '" stroke-width="1.2" stroke-linejoin="round"/>');
    p.raw('</g>');
    p.close();
    p.open('p-tail', 70, 80);
    p.part('M30 74 L16 70 L24 76 L12 80 L26 82 L18 88 L32 84 Z', C.feather, { lw: 1.4, ol: C.ink, ink: true });
    p.part(TAIL, C.body, K.flat({ belly: 'M72 90 C56 84 40 82 22 82 L0 100 L80 100 Z', auto: K.auto(1.6, 2.4) }));
    p.close();
    p.open('p-body', 100, 110);
    p.part(BODY, C.body, K.flat({
      joinWith: [TAIL],
      belly: 'M160 30 C152 50 148 68 142 84 C136 102 122 112 104 114 C90 116 78 112 70 104 L64 130 L170 130 Z',
      inner: '<path d="M58 70 C66 54 86 44 106 42 C120 40 132 34 142 20" fill="none" stroke="' + C.dark + '" stroke-width="12" stroke-linecap="round" opacity="0.55"/>' +
        K.rot(10, 84, 54, K.stripe(84, 54, 12, -2, 4.6)) + K.rot(0, 98, 50, K.stripe(98, 50, 14, -2, 5)) + K.rot(-10, 112, 46, K.stripe(112, 46, 12, -1, 4.6)) +
        K.lines('M76 96 C88 106 104 108 118 104', 1.2, 0.35),
      auto: K.auto(5, 6.5, 0.6)
    }));
    // 背中の羽毛
    p.detail(feathers(70, 58, 136, 30, 12, 7, C.feather));
    p.close();
    p.open('p-legF', 80, 86);
    p.part(LEG, C.body, K.flat({ inner: K.lines('M68 104 C76 110 86 112 94 108', 1.2, 0.45), auto: K.auto(3.4, 4.2) }));
    p.detail(K.claw(103, 145, 0.95) + K.claw(95, 145.4, 0.85) + K.claw(87, 145.6, 0.8));
    p.close();
    // 頭（小さく、くちばし）
    p.open('p-head', 148, 26);
    p.part('M140 22 C142 14 152 10 162 12 C172 14 180 18 184 24 C185 28 182 30 176 30 L156 32 C148 32 140 30 140 22 Z', C.body, K.flat({
      lw: 2.2, belly: 'M136 27 C156 28 172 28 190 26 L190 40 L136 40 Z', auto: K.auto(1.6, 2.2, 0.6)
    }));
    p.part('M176 21 C182 21 187 24 187 28 C186 30 182 31 178 30 Z', C.beak, { lw: 1.6, ol: C.ink, ink: true });
    p.part('M144 16 L136 8 L144 12 L140 4 L150 12 Z', C.feather, { lw: 1.2, ol: C.ink, ink: true });
    p.raw(K.eye({ x: 160, y: 19, rx: 2.8, ry: 2.4, iris: C.eye, pupil: 'slit', glow: '#ffd23a' }));
    p.close();
    // 手前の腕：巨大な3本の鎌
    p.open('p-armF', 136, 60);
    p.part('M132 56 C142 60 152 70 158 82 L156 90 C150 80 142 72 130 66 Z', C.body, K.flat({ lw: 2.2, auto: K.auto(1.4, 2) }));
    p.part('M130 58 C138 64 148 74 154 86 L150 90 C146 80 138 72 128 66 Z', C.feather, { lw: 1.4, ol: C.ink, ink: true });
    p.part('M156 84 C170 90 182 104 188 124 C178 112 168 102 154 94 Z', C.claw, K.flat({ lw: 1.6, inner: '<path d="M158 88 C170 94 180 106 188 124 L184 122 L156 92 Z" fill="' + C.clawShade + '"/>' }));
    p.part('M154 88 C164 98 172 112 174 130 C166 118 158 106 150 96 Z', C.claw, K.flat({ lw: 1.6, inner: '<path d="M156 92 C164 102 170 114 174 130 L170 126 L152 96 Z" fill="' + C.clawShade + '"/>' }));
    p.part('M150 90 C156 102 160 116 158 132 C152 120 148 108 146 96 Z', C.claw, K.flat({ lw: 1.6, inner: '<path d="M152 94 C156 104 158 118 158 132 L155 128 L148 98 Z" fill="' + C.clawShade + '"/>' }));
    p.close();
  };
  CUSTOM.therizino.box = [132, 0, 60];

  // ================= ガイアフォートレス（EX：鎧＋結晶の板） =================
  CUSTOM.gaiafort = function (p) {
    var C = { body: '#4a6a5a', shade: '#2a4234', dark: '#2a3a30', stripe: '#1a2a20', belly: '#dce8d0', far: '#3a5648', farShade: '#263c30',
      armor: '#304a3c', armorHi: '#8af0d8', armorDark: '#1a2a22', crystal: '#6ae0c8', crystalHi: '#e8fff8', spike: '#e8f4ec', club: '#2a3a30',
      claw: '#dce8d8', eye: '#6affe8', ink: '#0c1a14' };
    var K = DN.artKit(p, C, 2.5);
    p.defs += '<linearGradient id="' + p.id + 'cr" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#2aa890"/><stop offset="0.6" stop-color="' + C.crystal + '"/><stop offset="1" stop-color="' + C.crystalHi + '"/></linearGradient>';
    var CR = 'url(#' + p.id + 'cr)';
    function crystal(x, y, h, w, r) {
      return '<g transform="rotate(' + r + ' ' + x + ' ' + y + ')"><path d="M' + (x - w) + ' ' + (y + 3) + ' L' + (x - w * 0.6) + ' ' + (y - h * 0.6) + ' L' + x + ' ' + (y - h) + ' L' + (x + w * 0.6) + ' ' + (y - h * 0.6) + ' L' + (x + w) + ' ' + (y + 3) + ' Z" fill="' + CR + '" stroke="' + C.ink + '" stroke-width="1.5" stroke-linejoin="round"/>' +
        '<path d="M' + x + ' ' + (y - h) + ' L' + (x - w * 0.2) + ' ' + (y + 2) + '" stroke="#fff" stroke-width="1" opacity="0.7"/></g>';
    }
    function scute(x, y, w, h, r) {
      return '<g transform="rotate(' + (r || 0) + ' ' + x + ' ' + y + ')"><ellipse cx="' + x + '" cy="' + y + '" rx="' + w + '" ry="' + h + '" fill="' + C.armor + '" stroke="' + C.ink + '" stroke-width="1.2"/>' +
        '<path d="M' + (x - w * 0.8) + ' ' + (y + h * 0.1) + ' C' + (x - w * 0.3) + ' ' + (y - h * 0.9) + ' ' + (x + w * 0.3) + ' ' + (y - h * 0.9) + ' ' + (x + w * 0.8) + ' ' + (y + h * 0.1) + '" fill="none" stroke="' + C.armorHi + '" stroke-width="1.1" stroke-linecap="round" opacity="0.8"/></g>';
    }
    var TAIL = 'M48 88 C38 80 28 70 20 58 L26 54 C34 64 44 74 54 82 Z';
    var BODY = 'M36 98 C38 74 64 58 98 56 C130 55 152 68 158 90 L158 104 C140 114 110 116 84 114 C60 113 42 108 36 98 Z';
    // 奥の結晶
    p.detail(crystal(70, 62, 16, 6, -14) + crystal(104, 56, 20, 7, 2) + crystal(134, 64, 14, 6, 20));
    p.open('p-legB', 60, 100);
    p.part('M48 100 C50 92 64 90 70 98 C72 106 72 116 70 124 L72 138 C74 141 76 144 76 146 L52 146 C52 142 54 139 56 136 L54 122 C48 114 46 106 48 100 Z', C.far, K.flat({ auto: K.auto(2.4, 3.2, 0.8, C.farShade) }));
    p.close();
    p.open('p-foreB', 124, 102);
    p.part('M116 102 C120 96 132 96 134 104 C135 112 132 120 130 126 L132 138 C134 141 136 144 136 146 L114 146 C114 142 116 139 118 136 L118 124 C114 116 113 108 116 102 Z', C.far, K.flat({ auto: K.auto(2.4, 3.2, 0.8, C.farShade) }));
    p.close();
    p.open('p-tail', 44, 94);
    p.part(TAIL, C.body, K.flat({ inner: scute(34, 68, 3.4, 2.6, -50) + scute(42, 77, 3.8, 2.8, -45), auto: K.auto(1.6, 2.2) }));
    p.detail(spikeP(C, 30, 62, 7, -150, 2) + spikeP(C, 38, 72, 7, -140, 2.2));
    // こぶ（結晶のトゲつき）
    p.part('M8 58 C2 50 6 38 16 36 C24 34 30 40 30 48 C34 50 34 58 28 62 C22 66 12 66 8 58 Z', C.club, K.flat({ inner: '<path d="M10 50 C12 42 20 40 26 44" fill="none" stroke="' + C.armorHi + '" stroke-width="1.8" stroke-linecap="round"/>', auto: K.auto(2, 2.6, 0.6, C.armorDark) }));
    p.detail(crystal(12, 38, 12, 4, -30) + crystal(24, 38, 12, 4, 20) + crystal(6, 50, 10, 3.6, -80));
    p.close();
    p.open('p-body', 96, 112);
    p.part(BODY, C.body, K.flat({
      joinWith: [TAIL],
      belly: 'M28 104 C60 112 110 116 166 104 L166 130 L28 130 Z',
      inner: [[52, 80, -40], [62, 70, -26], [76, 63, -12], [92, 60, 0], [108, 60, 8], [124, 64, 18], [138, 71, 30], [148, 80, 44]].map(function (q) { return scute(q[0], q[1], 6.4, 4.6, q[2]); }).join('') +
        [[46, 92, -30], [60, 84, -20], [76, 78, -8], [92, 75, 0], [108, 76, 6], [124, 80, 14], [138, 86, 24]].map(function (q) { return scute(q[0], q[1], 6, 4.2, q[2]); }).join('') +
        '<path d="M44 100 C70 104 110 106 154 98" fill="none" stroke="' + C.crystal + '" stroke-width="2" opacity="0.7"/>',
      auto: K.auto(4, 5.4, 0.6)
    }));
    // 手前の結晶の板・わきのトゲ
    p.detail(crystal(58, 66, 18, 7, -26) + crystal(84, 58, 24, 9, -8) + crystal(112, 58, 22, 8, 10) + crystal(138, 70, 16, 6, 30) +
      spikeP(C, 44, 102, 9, 150, 2.6) + spikeP(C, 62, 106, 10, 125, 2.8) + spikeP(C, 80, 108, 10, 110, 3) + spikeP(C, 98, 109, 10, 100, 3) + spikeP(C, 116, 108, 10, 85, 3) + spikeP(C, 134, 105, 10, 70, 2.8));
    p.close();
    p.open('p-legF', 70, 100);
    p.part('M56 102 C58 92 76 90 82 100 C85 108 84 118 82 124 L84 138 C86 141 88 144 88 146 L62 146 C62 142 64 139 66 136 L64 122 C58 116 55 108 56 102 Z', C.body, K.flat({ auto: K.auto(2.8, 3.4) }));
    p.detail(K.hoof(67, 146, 0.85) + K.hoof(75, 146, 0.85) + K.hoof(82.6, 146, 0.8));
    p.close();
    p.open('p-foreF', 136, 104);
    p.part('M126 104 C130 96 144 96 146 106 C147 114 144 122 142 128 L144 138 C146 141 148 144 148 146 L124 146 C124 142 126 139 128 136 L128 126 C124 118 123 110 126 104 Z', C.body, K.flat({ auto: K.auto(2.6, 3.2) }));
    p.detail(K.hoof(129, 146, 0.8) + K.hoof(136.6, 146, 0.8) + K.hoof(143.6, 146, 0.75));
    p.close();
    p.open('p-head', 152, 94);
    p.part('M150 84 C160 76 176 76 186 84 C192 90 192 98 186 103 L176 106 L160 106 C152 102 148 92 150 84 Z', C.body, K.flat({ belly: 'M144 100 L196 96 L196 112 L144 112 Z', inner: scute(162, 84, 4.6, 3.2, -8) + scute(174, 83, 4, 2.8, 6), auto: K.auto(2, 2.8, 0.7) }));
    p.part('M184 90 C190 91 194 96 192 101 L186 104 C185 99 185 94 184 90 Z', C.dark, { lw: 1.4, ol: C.ink, ink: true });
    p.detail(crystal(154, 82, 12, 3.6, -60) + crystal(166, 78, 10, 3.2, -10));
    p.raw(K.eye({ x: 170, y: 92, rx: 2.6, ry: 2, iris: C.eye, pupil: 'slit', glow: '#6affe8' }));
    p.close();
  };
  CUSTOM.gaiafort.box = [140, 60, 60];
})(window);
