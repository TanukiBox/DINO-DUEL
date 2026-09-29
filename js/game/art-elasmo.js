/*
 * DINO DUEL 描きこみ版：エラスモサウルス
 * 海を泳ぐ首長竜。とても長い首をS字に持ち上げ、小さな頭と針のような歯。4枚の大きなひれで水をかく。
 * 目は丸くつややかで大きめ。体の下は水面と水しぶき。
 * 部品：p-finB（奥のひれ） / p-tail / p-body / p-legF（手前の後ろひれ） / p-armF（手前の前ひれ） / p-head（首ごと、中に p-jaw）
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};
  var CUSTOM = DN.ART_CUSTOM = DN.ART_CUSTOM || {};

  var C = {
    body: '#2f7489', shade: '#184658', dark: '#1d4a5a', stripe: '#15404e', belly: '#d8ecdc',
    far: '#245c6e', farShade: '#173e4a', fin: '#2a6a7e', mouth: '#5a1418', eye: '#101418', water: '#e8f8ff', water2: '#9ad4f2', ink: '#0e2028'
  };

  function paddle(d, fill, K, dx, dy) {
    return [d, fill, K.flat({ lw: 2, auto: K.auto(dx || 1.8, dy || 2.4, 0.7) })];
  }

  CUSTOM.elasmo = function (p) {
    var K = DN.artKit(p, C, 2.3);

    // ---- 奥のひれ ----
    p.open('p-finB', 100, 96);
    p.part('M108 94 C104 104 96 114 84 122 C79 125 76 123 78 119 C84 110 90 102 96 94 Z', C.far, K.flat({ lw: 2, auto: K.auto(1.6, 2.2, 0.7, C.farShade) }));
    p.part('M54 96 C48 106 40 114 28 120 C23 122 21 120 23 116 C30 108 38 100 44 94 Z', C.far, K.flat({ lw: 2, auto: K.auto(1.6, 2.2, 0.7, C.farShade) }));
    p.close();

    // ---- しっぽ ----
    p.open('p-tail', 48, 98);
    p.part('M54 88 C38 90 20 94 4 99 C18 104 34 108 54 108 Z', C.body, K.flat({ belly: 'M46 100 C32 102 18 102 4 100 L0 112 L50 112 Z', auto: K.auto(1.4, 2) }));
    p.close();

    // ---- 胴 ----
    p.open('p-body', 88, 108);
    p.part('M38 96 C46 82 70 74 98 76 C116 78 130 84 136 94 C132 108 112 116 88 116 C64 116 44 110 38 96 Z', C.body, K.flat({ joinWith: ['M54 88 C38 90 20 94 4 99 C18 104 34 108 54 108 Z'],
      belly: 'M30 102 C60 112 100 114 140 98 L140 130 L30 130 Z',
      inner: '<path d="M36 90 C52 78 82 72 110 76 C122 78 130 84 136 92" fill="none" stroke="' + C.dark + '" stroke-width="9" stroke-linecap="round" opacity="0.6"/>' +
        K.spots([[58, 86, 2.4, 1.6], [72, 82, 2.8, 1.8], [88, 80, 2.8, 1.8], [104, 82, 2.4, 1.6], [118, 86, 2.2, 1.4], [66, 94, 1.8, 1.3], [82, 92, 2, 1.3], [98, 91, 1.8, 1.2]], C.stripe, 0.55),
      auto: K.auto(3.4, 4.6, 0.6)
    }));
    p.close();

    // ---- 手前の後ろひれ ----
    p.open('p-legF', 58, 102);
    var hp = paddle('M64 102 C60 114 50 126 34 134 C28 137 24 134 27 130 C36 122 44 112 50 102 Z', C.fin, K);
    p.part(hp[0], hp[1], hp[2]);
    p.close();

    // ---- 首と頭（S字に持ち上げる）----
    p.open('p-head', 128, 88);
    p.part('M122 82 C132 70 138 56 142 42 C146 30 154 20 166 16 L172 28 C164 30 158 36 156 46 C152 60 146 76 138 94 Z', C.body, K.flat({ joinWith: ['M38 96 C46 82 70 74 98 76 C116 78 130 84 136 94 C132 108 112 116 88 116 C64 116 44 110 38 96 Z'],
      belly: 'M160 26 C154 34 152 44 150 54 C146 68 140 82 132 98 L150 100 L176 26 Z',
      inner: '<path d="M120 80 C130 68 136 54 140 40 C144 28 152 20 164 16" fill="none" stroke="' + C.dark + '" stroke-width="6" stroke-linecap="round" opacity="0.55"/>' +
        K.spots([[134, 64, 1.8, 1.2], [138, 52, 1.8, 1.2], [143, 40, 1.6, 1.1], [150, 30, 1.5, 1]], C.stripe, 0.5) +
        K.lines('M150 50 C148 58 146 64 142 72', 1, 0.35),
      auto: K.auto(2.4, 3.2, 0.6)
    }));
    // 下あご
    p.open('p-jaw', 168, 22);
    p.part('M166 22 L194 22 L192 18 L168 16 Z', C.mouth, { lw: 1.1, ol: C.ink });
    p.detail(K.teethRow(172, 22.4, 190, 22.2, 7, 1.6, 3.2, -1));
    p.part('M166 22 L194 22.6 C195 24 193 26 190 26.4 L172 27 C168 27 166 25 166 22 Z', C.body, K.flat({ lw: 1.7, belly: 'M160 25 L198 24 L198 32 L160 32 Z', auto: K.auto(0.8, 1.2, 0.5) }));
    p.close();
    p.detail(K.teethRow(171, 20.6, 193, 20.6, 8, 1.6, 3.6, 1));
    // 頭
    p.part('M162 16 C166 8 178 6 188 10 C194 12 197 16 196 19 C195 21 192 21 189 21 L170 22 C164 22 161 19 162 16 Z', C.body, K.flat({
      lw: 2,
      inner: '<path d="M162 14 C170 6 184 6 196 16" fill="none" stroke="' + C.dark + '" stroke-width="4" opacity="0.5"/>',
      auto: K.auto(1.4, 2, 0.6)
    }));
    p.raw(K.eye({ x: 174, y: 13.6, rx: 3, ry: 2.8, iris: '#1c2e3a', white: false, pupil: 'round', pr: 0.55 }));
    if (!p.sil) p.raw('<circle cx="172.4" cy="12.2" r="1.1" fill="#fff"/><path d="M189 13 C190.4 12.4 192 12.6 192.6 13.6" fill="none" stroke="' + C.ink + '" stroke-width="1" stroke-linecap="round"/>');
    p.close();

    // ---- 手前の前ひれ ----
    p.open('p-armF', 116, 100);
    var fp = paddle('M124 100 C122 114 112 126 96 134 C90 137 86 134 89 130 C98 120 106 110 110 100 Z', C.fin, K);
    p.part(fp[0], fp[1], fp[2]);
    p.detail(K.lines('M118 104 C114 114 106 124 96 130', 1, 0.4) + K.lines('M58 106 C54 116 46 124 36 130', 1, 0.4));
    p.close();

    // ---- 水面と水しぶき ----
    if (!p.sil) {
      p.raw('<path d="M6 136 C22 130 38 130 54 136 C70 142 86 142 102 136 C118 130 134 130 150 136 C166 142 180 142 194 136" fill="none" stroke="' + C.water + '" stroke-width="4" stroke-linecap="round" opacity="0.95"/>');
      p.raw('<path d="M16 143 C32 139 48 139 64 143 M104 143 C120 139 136 139 152 143" fill="none" stroke="' + C.water2 + '" stroke-width="3" stroke-linecap="round" opacity="0.85"/>');
      p.raw('<circle cx="160" cy="128" r="2" fill="' + C.water + '"/><circle cx="166" cy="122" r="1.4" fill="' + C.water + '"/><circle cx="22" cy="128" r="1.6" fill="' + C.water + '"/><circle cx="16" cy="122" r="1.1" fill="' + C.water + '"/>');
    }
  };
  CUSTOM.elasmo.box = [148, 0, 52];
  CUSTOM.elasmo.rig = { jawOpen: 20, jawClose: -6 };
})(window);
