/*
 * DINO DUEL 描きこみ版：プテラノドン
 * 空を飛ぶ翼竜。奥の翼を高く振り上げ、手前の翼を大きく広げて前へ飛ぶ構え。
 * うしろへ長く伸びるとさか、歯のない長いくちばし、翼の指の骨と膜のすじ。目はするどい。
 * 部品：p-wingB（奥の翼） / p-body / p-legF / p-head / p-wingF（手前の翼）
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};
  var CUSTOM = DN.ART_CUSTOM = DN.ART_CUSTOM || {};

  var C = {
    body: '#a8563a', shade: '#6e2e1c', dark: '#6a2e1e', belly: '#f2d4b2',
    wing: '#e89c5e', wingDark: '#b8663a', wingFar: '#b86a40', vein: '#8a4426', bone: '#7a3a22',
    crest: '#d8392b', crestEdge: '#ffcc5a', beak: '#e8b25a', beakDark: '#b88234', claw: '#2b1510', eye: '#ffd23a', ink: '#2a120c'
  };

  CUSTOM.pterano = function (p) {
    var K = DN.artKit(p, C, 2.2);
    p.raw('<g transform="translate(0 -8)">');

    // ---- 奥の翼（高く振り上げる）----
    p.open('p-wingB', 104, 68);
    p.part('M100 66 C92 48 76 28 52 8 C68 12 84 18 98 26 C104 38 108 52 110 66 Z', C.wingFar, K.flat({
      lw: 2, inner: K.lines('M100 64 C94 46 80 28 56 10', 1.6, 0.7, C.bone) + K.lines('M104 60 C100 46 94 36 86 26 M106 52 C104 44 102 38 98 32', 0.9, 0.5, C.vein),
      auto: K.auto(2, 2.6, 0.6, C.wingDark)
    }));
    p.close();

    // ---- 脚（うしろへ流す）----
    p.open('p-legF', 84, 82);
    p.part('M86 80 C82 86 76 92 68 96 L64 94 C70 90 76 84 80 78 Z', C.dark, { lw: 1.6, ol: C.ink, ink: true });
    p.detail(K.claw(64, 95, 0.5, C.claw, true) + K.claw(66, 97, 0.5, C.claw, true));
    p.close();

    // ---- 胴 ----
    p.open('p-body', 98, 76);
    p.part('M78 70 C84 62 100 60 112 64 C120 66 124 72 120 78 C112 84 96 86 86 84 C80 82 76 76 78 70 Z', C.body, K.flat({
      belly: 'M72 80 C90 78 108 76 128 72 L128 96 L72 96 Z',
      inner: '<path d="M78 66 C90 60 106 60 118 66" fill="none" stroke="' + C.dark + '" stroke-width="5" stroke-linecap="round" opacity="0.5"/>' +
        K.lines('M86 72 l2 4 M92 70 l2 4 M98 69 l2 4 M104 69 l2 4', 0.8, 0.3),
      auto: K.auto(2, 2.8, 0.7)
    }));
    p.close();

    // ---- 頭（とさか・長いくちばし）----
    p.open('p-head', 118, 64);
    // とさか（うしろへ長く）
    p.part('M132 55 C120 46 104 38 86 32 C98 42 112 52 126 62 Z', C.crest, K.flat({
      lw: 2, inner: K.lines('M130 56 C118 48 104 40 90 34', 1.4, 0.9, C.crestEdge) + K.lines('M124 56 C116 50 108 46 100 42', 1, 0.5, '#8a1a12'),
      auto: K.auto(1.4, 2, 0.5, '#8a1a12')
    }));
    // 首
    p.part('M110 64 C116 58 124 56 132 58 L130 67 C124 67 118 69 114 73 Z', C.body, K.flat({ joinWith: ['M78 70 C84 62 100 60 112 64 C120 66 124 72 120 78 C112 84 96 86 86 84 C80 82 76 76 78 70 Z'], lw: 2, auto: K.auto(1.2, 1.8, 0.6) }));
    // 下のくちばし
    p.part('M132 62 L196 67 C194 69 190 70 186 70 L146 70 C138 70 132 67 132 62 Z', C.beakDark, K.flat({ lw: 1.8, auto: K.auto(1, 1.4, 0.5) }));
    // 頭と上のくちばし
    p.part('M126 56 C132 51 142 50 150 53 L199 64 C198 66 196 67 193 67 L150 65 C142 67 132 66 126 62 Z', C.body, K.flat({
      lw: 2,
      belly: 'M144 60 L200 64 L200 70 L144 70 Z', bellyFill: C.beak,
      inner: '<path d="M146 54 L199 64 L199 66 L146 60 Z" fill="' + C.beak + '"/>' + K.lines('M152 62 C166 63.6 180 64.4 194 65', 0.9, 0.45),
      auto: K.auto(1.4, 2, 0.6)
    }));
    p.raw(K.eye({ x: 138, y: 57, rx: 2.6, ry: 2, iris: C.eye, pupil: 'slit', glow: '#ffd23a' }));
    if (!p.sil) p.raw('<path d="M133.4 54.6 C136 52.8 140.4 52.8 143.6 54.4 L143.4 55.8 C140.4 55 136.8 55.2 134 56.6 Z" fill="' + C.dark + '" stroke="' + C.ink + '" stroke-width="0.8"/>');
    p.close();

    // ---- 手前の翼（大きく広げる）----
    p.open('p-wingF', 104, 70);
    p.part('M106 70 L84 58 C64 66 38 80 6 100 C18 98 28 96 38 97 C46 93 54 92 62 94 C70 90 78 88 86 88 C94 84 100 78 106 74 Z', C.wing, K.flat({
      inner:
        // 腕と翼の指の骨（前のふち）
        '<path d="M106 70 L84 58 C64 66 38 80 6 100" fill="none" stroke="' + C.bone + '" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>' +
        // 膜のすじ（手首から広がる）
        K.lines('M84 60 C80 70 76 80 74 88 M76 64 C68 74 62 84 58 93 M64 70 C54 80 46 88 40 96 M50 78 C40 86 32 92 24 97', 1, 0.5, C.vein) +
        '<path d="M6 100 C18 98 28 96 38 97 C46 93 54 92 62 94 C70 90 78 88 86 88 C94 84 100 78 106 74 L106 104 L0 104 Z" fill="' + C.wingDark + '" opacity="0.3"/>',
      auto: K.auto(2.2, 3, 0.45, C.wingDark)
    }));
    // 手首のかぎ爪
    p.detail(K.claw(84, 57, 0.6) + K.claw(87, 58.6, 0.5));
    p.close();

    p.raw('</g>');
    // 地面の影（浮いている）
    p.raw('<ellipse cx="92" cy="146" rx="42" ry="3.6" fill="#000" opacity="0.14"/>');
  };
  CUSTOM.pterano.box = [112, 30, 68];
})(window);
