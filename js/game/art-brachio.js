/*
 * DINO DUEL 描きこみ版：ブラキオサウルス
 * 前脚が後ろ脚より長く、肩が高い。首を高く持ち上げ、背中は腰へ向けて下がる。しっぽは短く太い。
 * 頭の上に鼻のアーチ（とさか）。柱のような脚。目はおだやかで大きめ。
 * 部品：p-tail / p-body / p-legF・p-legB（後ろ脚） / p-foreF・p-foreB（前脚） / p-head（首ごと）
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};
  var CUSTOM = DN.ART_CUSTOM = DN.ART_CUSTOM || {};

  var C = {
    body: '#5f89aa', shade: '#3a5c7a', dark: '#3a5a76', stripe: '#2c4660', belly: '#dbe4d6',
    far: '#4a6f8e', farShade: '#33506a', crest: '#3d6080', claw: '#e4ddc6', eye: '#3a2618', ink: '#18222e'
  };

  CUSTOM.brachio = function (p) {
    var K = DN.artKit(p, C, 2.4);

    // ---- 奥の脚 ----
    p.open('p-legB', 60, 96);
    p.part('M44 96 C46 84 64 80 72 92 C75 100 74 110 72 118 L72 136 C74 139 76 143 76 146 L50 146 C50 142 52 138 54 135 L54 118 C47 112 43 104 44 96 Z', C.far, K.flat({ auto: K.auto(2.6, 3.4, 0.8, C.farShade) }));
    p.detail(K.hoof(56, 146, 0.8) + K.hoof(64, 146, 0.8) + K.hoof(71.4, 146, 0.75));
    p.close();
    p.open('p-foreB', 112, 80);
    p.part('M102 76 C106 68 120 68 124 78 C126 88 124 100 122 110 L122 136 C124 139 126 143 126 146 L100 146 C100 142 102 138 104 135 L104 108 C100 96 99 84 102 76 Z', C.far, K.flat({ auto: K.auto(2.6, 3.4, 0.8, C.farShade) }));
    p.detail(K.hoof(106, 146, 0.8) + K.hoof(114, 146, 0.8) + K.hoof(121.4, 146, 0.75));
    p.close();

    // ---- しっぽ ----
    p.open('p-tail', 36, 92);
    p.part('M38 84 C26 90 14 98 3 110 C1 113 3 116 7 114 C18 106 30 100 44 98 Z', C.body, K.flat({
      belly: 'M44 96 C30 100 18 106 6 114 L0 130 L60 130 Z',
      inner: K.spots([[28, 92, 2, 1.4], [20, 98, 1.6, 1.2]], C.stripe, 0.5),
      auto: K.auto(1.8, 2.6)
    }));
    p.close();

    // ---- 胴（肩が高く、腰へ下がる）----
    p.open('p-body', 90, 112);
    p.part('M30 90 C38 80 54 72 74 68 C92 64 108 56 122 56 C134 56 142 64 144 76 C146 88 142 100 132 108 C114 116 90 118 70 116 C52 114 38 104 30 90 Z', C.body, K.flat({
      belly: 'M24 100 C50 112 90 118 128 110 C138 104 144 96 148 88 L150 130 L24 130 Z',
      inner: '<path d="M26 86 C40 74 62 68 84 64 C100 60 112 54 126 54" fill="none" stroke="' + C.dark + '" stroke-width="12" stroke-linecap="round" opacity="0.5"/>' +
        K.spots([[60, 80, 3, 2], [74, 76, 3.4, 2.2], [90, 72, 3.2, 2.2], [104, 68, 3, 2], [118, 66, 2.8, 2], [68, 90, 2.4, 1.8], [84, 86, 2.6, 1.8], [100, 82, 2.4, 1.8], [114, 80, 2.2, 1.6], [128, 76, 2.4, 1.6]], C.stripe, 0.45) +
        K.lines('M56 104 C72 110 92 112 112 108', 1.1, 0.4) + K.lines('M128 70 C134 80 136 92 132 102', 1, 0.35),
      auto: K.auto(4.5, 6, 0.6)
    }));
    p.close();

    // ---- 手前の後ろ脚 ----
    p.open('p-legF', 66, 96);
    p.part('M52 96 C54 82 76 78 84 92 C87 100 86 112 84 120 L84 136 C86 139 88 143 88 146 L60 146 C60 142 62 138 64 135 L64 120 C56 114 51 106 52 96 Z', C.body, K.flat({
      inner: K.lines('M58 112 C66 118 76 118 84 114', 1.1, 0.45) + K.lines('M65 128 l17 0 M65 134 l18 0 M65 140 l19 0', 0.8, 0.3),
      auto: K.auto(3, 4)
    }));
    p.detail(K.hoof(65, 146, 0.9) + K.hoof(73.6, 146, 0.9) + K.hoof(81.6, 146, 0.85));
    p.close();

    // ---- 手前の前脚（長い柱）----
    p.open('p-foreF', 126, 80);
    p.part('M114 76 C118 66 134 66 138 78 C140 88 138 100 136 110 L136 136 C138 139 140 143 140 146 L112 146 C112 142 114 138 116 135 L116 108 C112 96 111 84 114 76 Z', C.body, K.flat({
      inner: K.lines('M118 104 C124 108 130 108 136 104', 1, 0.45) + K.lines('M117 124 l18 0 M117 130 l18 0 M117 136 l19 0', 0.8, 0.3),
      auto: K.auto(3, 4)
    }));
    p.detail(K.hoof(117, 146, 0.9) + K.hoof(125.6, 146, 0.9) + K.hoof(133.6, 146, 0.85));
    p.close();

    // ---- 首と頭（高く持ち上げる）----
    p.open('p-head', 130, 68);
    p.part('M120 62 C126 46 134 32 144 22 C150 16 156 13 164 13 L170 26 C163 28 158 33 154 40 C148 52 144 64 142 78 L124 76 Z', C.body, K.flat({
      belly: 'M160 22 C154 30 150 40 146 52 C142 64 140 74 140 82 L160 82 L170 20 Z',
      inner: '<path d="M118 60 C124 44 134 30 146 20" fill="none" stroke="' + C.dark + '" stroke-width="7" stroke-linecap="round" opacity="0.5"/>' +
        K.lines('M150 44 C148 50 147 56 146 62 M146 36 C150 40 154 42 158 42', 1, 0.35) +
        K.spots([[136, 42, 2, 1.4], [132, 52, 2.2, 1.5], [142, 30, 1.8, 1.3]], C.stripe, 0.45),
      auto: K.auto(2.6, 3.4, 0.6)
    }));
    // 頭
    p.part('M158 14 C160 6 172 3 182 6 C190 9 195 14 193 19 C191 22 187 23 181 23 L166 24 C160 22 157 19 158 14 Z', C.body, K.flat({
      belly: 'M150 20 L200 17 L200 30 L150 30 Z',
      inner: K.lines('M178 19.6 C183 20.6 188 20.4 192 19', 1, 0.5),
      auto: K.auto(1.6, 2.2, 0.6)
    }));
    // 鼻のアーチ（とさか）
    p.part('M162 10 C163 3 170 0 176 1.6 C178 4 177 8 174 10 C170 9 166 9 162 10 Z', C.crest, K.flat({ lw: 1.8, auto: K.auto(1, 1.4, 0.5) }));
    p.raw(K.eye({ x: 170, y: 12.6, rx: 2.6, ry: 2.4, iris: C.eye, white: true, pupil: 'round', pr: 0.7 }));
    if (!p.sil) p.raw('<path d="M166.4 10.2 C168.6 9 172 9 174.2 10.4" fill="none" stroke="' + C.ink + '" stroke-width="1" stroke-linecap="round"/>');
    p.close();
  };
  CUSTOM.brachio.box = [132, 0, 64];
})(window);
