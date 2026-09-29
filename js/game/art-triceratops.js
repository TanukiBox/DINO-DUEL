/*
 * DINO DUEL 描きこみ版：トリケラトプス
 * 頭を下げて3本の角を前に向けた突進の構え。背中は腰がいちばん高く、後ろ脚はまっすぐ・前脚はひじを曲げて踏んばる。
 * 大きなえり飾り（ふちに小さな骨のでこぼこ、目玉もよう）、くちばし、短く太いしっぽ。
 * 部品：p-tail / p-body / p-legF・p-legB（後ろ脚） / p-foreF・p-foreB（前脚） / p-head
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};
  var CUSTOM = DN.ART_CUSTOM = DN.ART_CUSTOM || {};

  var C = {
    body: '#6f913c', shade: '#435e22', dark: '#3f5a22', stripe: '#2c4216', belly: '#e2dca0',
    far: '#557430', farShade: '#3a5220',
    frill: '#dc6a2c', frillDark: '#8e3216', frillSpot: '#f6c64a', rim: '#f4e6c4',
    horn: '#f3e8cc', hornShade: '#c9b58c', beak: '#3a2a1e', claw: '#e9dcb8', eye: '#e8a020', ink: '#1f2a10'
  };

  CUSTOM.triceratops = function (p) {
    var K = DN.artKit(p, C, 2.4);
    p.raw('<g transform="translate(-7 0)">');

    // ---- 奥の脚（後ろ・前）----
    p.open('p-legB', 64, 80);
    p.part('M40 84 C42 70 62 66 72 78 C76 88 74 100 70 108 L70 134 C72 138 76 142 78 146 L52 146 C52 141 54 136 56 132 L56 114 C46 108 40 98 40 84 Z', C.far, K.flat({ auto: K.auto(3, 4, 0.8, C.farShade) }));
    p.detail(K.hoof(58, 146, 0.8) + K.hoof(66, 146, 0.8) + K.hoof(73, 146, 0.75));
    p.close();
    p.open('p-foreB', 114, 94);
    p.part('M100 94 C106 90 118 92 120 102 C121 110 118 116 114 120 L116 134 C119 138 122 142 122 146 L98 146 C98 141 100 137 102 134 L102 120 C98 112 96 100 100 94 Z', C.far, K.flat({ auto: K.auto(2.6, 3.4, 0.8, C.farShade) }));
    p.detail(K.hoof(104, 146, 0.75) + K.hoof(111, 146, 0.75) + K.hoof(117, 146, 0.7));
    p.close();

    // ---- しっぽ ----
    p.open('p-tail', 40, 80);
    p.part('M46 70 C32 74 18 82 6 92 C3 95 5 98 9 97 C22 93 36 89 50 88 Z', C.body, K.flat({
      belly: 'M52 86 C38 88 22 92 6 96 L0 110 L60 110 Z',
      inner: K.rot(-20, 30, 78, K.stripe(30, 78, 6, -1, 3.4)) + K.rot(-22, 20, 84, K.stripe(20, 84, 5, -1, 3)),
      auto: K.auto(2, 3)
    }));
    p.close();

    // ---- 胴 ----
    p.open('p-body', 90, 110);
    p.part('M40 72 C44 56 60 46 78 46 C98 46 114 54 126 64 C134 70 140 78 140 90 C138 102 128 112 112 116 C94 120 72 118 58 110 C46 104 38 88 40 72 Z', C.body, K.flat({
      belly: 'M30 100 C56 112 90 116 122 110 C132 106 138 100 142 94 L150 140 L30 140 Z',
      inner: '<path d="M36 70 C48 52 76 44 102 48 C116 50 128 58 138 68" fill="none" stroke="' + C.dark + '" stroke-width="12" stroke-linecap="round" opacity="0.6"/>' +
        K.rot(-6, 60, 54, K.stripe(60, 54, 16, -3, 6)) + K.rot(0, 74, 50, K.stripe(74, 50, 18, -3, 6.4)) + K.rot(6, 88, 50, K.stripe(88, 50, 18, -2, 6.4)) +
        K.rot(12, 102, 52, K.stripe(102, 52, 16, -1, 6)) + K.rot(18, 115, 57, K.stripe(115, 57, 13, 0, 5.4)) +
        // 皮ふのしわ・うろこ
        K.lines('M56 104 C70 110 90 112 108 108', 1.1, 0.4) + K.lines('M118 72 C124 80 126 90 124 100', 1, 0.35) +
        K.spots([[70, 80, 2.4], [84, 76, 2], [96, 82, 2.6], [78, 92, 1.8], [108, 88, 2.2], [60, 88, 2], [92, 96, 1.6]], C.dark, 0.35),
      auto: K.auto(5, 6.5, 0.65)
    }));
    p.close();

    // ---- 手前の後ろ脚 ----
    p.open('p-legF', 70, 80);
    p.part('M50 84 C52 68 76 62 86 78 C90 88 88 100 84 108 L84 132 C86 136 90 140 92 146 L64 146 C64 141 66 136 68 132 L68 116 C58 110 50 100 50 84 Z', C.body, K.flat({
      inner: K.lines('M58 104 C66 110 76 112 84 108', 1.1, 0.45) + K.lines('M72 126 l8 0 M72 132 l8 0 M72 138 l9 0', 0.8, 0.35),
      auto: K.auto(3.4, 4.2)
    }));
    p.detail(K.hoof(69, 146, 0.95) + K.hoof(78, 146, 0.95) + K.hoof(87, 146, 0.9));
    p.close();

    // ---- 手前の前脚（ひじを曲げて踏んばる）----
    p.open('p-foreF', 124, 96);
    p.part('M112 92 C120 86 134 90 136 102 C137 110 132 116 128 120 L130 132 C133 136 136 140 137 146 L112 146 C112 141 114 137 116 134 L116 122 C110 114 106 100 112 92 Z', C.body, K.flat({
      inner: K.lines('M118 118 C122 120 126 120 129 118', 1, 0.45) + K.lines('M118 128 l9 0 M118 134 l10 0', 0.8, 0.35),
      auto: K.auto(3, 3.8)
    }));
    p.detail(K.hoof(117, 146, 0.85) + K.hoof(125, 146, 0.85) + K.hoof(132.6, 146, 0.8));
    p.close();

    // ---- 頭（えり飾り・顔・角）----
    p.open('p-head', 134, 80);
    // えり飾り（ふちのでこぼこ）
    if (!p.sil) {
      // ふちの三角のトゲ（中心から外向き）
      var cx = 144, cy = 58, spikes = '';
      [-160, -140, -120, -100, -80, -60, -40, -20, 0].forEach(function (deg) {
        var a = deg * Math.PI / 180, r0 = 26, r1 = 34, w = 0.11;
        var x0 = cx + Math.cos(a - w) * r0 * 1.02, y0 = cy + Math.sin(a - w) * r0 * 1.25;
        var x1 = cx + Math.cos(a + w) * r0 * 1.02, y1 = cy + Math.sin(a + w) * r0 * 1.25;
        var xt = cx + Math.cos(a) * r1 * 1.02, yt = cy + Math.sin(a) * r1 * 1.25;
        spikes += '<path d="M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' L' + xt.toFixed(1) + ' ' + yt.toFixed(1) + ' L' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' Z" fill="' + C.rim + '" stroke="' + C.ink + '" stroke-width="1.3" stroke-linejoin="round"/>';
      });
      p.raw(spikes);
    }
    p.part('M120 64 C114 40 130 20 150 22 C166 24 172 42 168 62 C164 78 152 90 140 92 C128 92 122 80 120 64 Z', C.frill, K.flat({
      inner: '<path d="M123 64 C118 42 132 25 150 26 C165 27 170 45 166 63" fill="none" stroke="' + C.frillSpot + '" stroke-width="4" opacity="0.9"/>' +
        '<path d="M127 64 C123 46 135 32 150 33 C161 34 165 48 162 63" fill="none" stroke="' + C.frillDark + '" stroke-width="3" opacity="0.8"/>' +
        K.lines('M128 34 L140 62 M138 28 L144 60 M150 27 L149 60 M160 32 L153 60 M122 50 L138 66 M166 46 L156 64', 1.2, 0.35, C.frillDark),
      auto: K.auto(3.4, 4.2, 0.55, C.frillDark)
    }));
    // 奥の角
    p.part('M154 66 C164 58 178 50 194 46 C184 54 172 62 160 70 Z', C.hornShade, { lw: 1.6, ol: C.ink, ink: true });
    // 顔
    p.part('M140 66 C150 58 166 60 176 66 C186 72 194 84 196 96 C197 102 194 106 188 106 L178 104 C166 100 152 96 144 90 C136 84 134 74 140 66 Z', C.body, K.flat({
      belly: 'M136 88 C150 96 170 102 196 104 L196 120 L136 120 Z',
      inner: '<path d="M140 66 C152 58 170 60 186 72" fill="none" stroke="' + C.dark + '" stroke-width="5" opacity="0.5"/>' +
        K.lines('M150 88 C158 92 168 96 178 98', 1, 0.4) + K.spots([[168, 80, 1.6], [174, 86, 1.4], [162, 84, 1.2]], C.dark, 0.4),
      auto: K.auto(2.6, 3.4, 0.7)
    }));
    // くちばし
    p.part('M183 86 C191 88 198 96 197 104 C193 108 187 108 181 104 C182 98 182 92 183 86 Z', C.beak, { lw: 1.8, ol: C.ink, ink: true });
    // 鼻の角・手前の角
    p.part('M178 82 C180 74 184 68 189 65 C189 72 188 79 185 84 Z', C.horn, { lw: 1.6, ol: C.ink, ink: true });
    p.part('M158 72 C170 64 186 56 204 52 C192 62 178 70 166 78 Z', C.horn, K.flat({ lw: 1.8, inner: '<path d="M160 76 C174 68 188 60 204 52 L204 60 L160 80 Z" fill="' + C.hornShade + '"/>' }));
    p.raw(K.eye({ x: 162, y: 78, rx: 2.8, ry: 2.4, iris: C.eye, pupil: 'round', pr: 0.55 }));
    if (!p.sil) p.raw('<path d="M156.6 75 C159 72.6 164 72.4 167 74.4 L167.2 76 C164 75 160 75.2 157.4 76.8 Z" fill="' + C.dark + '" stroke="' + C.ink + '" stroke-width="0.9"/>');
    p.close();
    p.raw('</g>');
  };
  CUSTOM.triceratops.box = [113, 20, 84];
})(window);
