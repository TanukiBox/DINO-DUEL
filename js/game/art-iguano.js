/*
 * DINO DUEL 描きこみ版：イグアノドン
 * どっしりした草食の二足歩行。上体を起こし、親指のトゲを前に突き出して身がまえる。
 * 馬のように長い顔とくちばし、太いしっぽ、ひづめのような足。目は丸くまじめな顔つき。
 * 部品：p-tail / p-body / p-legF・p-legB / p-armF・p-armB / p-head
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};
  var CUSTOM = DN.ART_CUSTOM = DN.ART_CUSTOM || {};

  var C = {
    body: '#8f8c46', shade: '#5c5a26', dark: '#585a26', stripe: '#3c3e18', belly: '#ebe2ae',
    far: '#6e6c34', farShade: '#4c4a22', beak: '#e8b640', spike: '#f3e8c8', claw: '#e8dcb6', eye: '#ff9a2a', ink: '#23240e'
  };

  var LEG = 'M68 84 C70 70 92 66 100 80 C105 90 104 102 99 110 C95 116 92 120 90 124 C95 130 101 136 107 140 C110 142 112 144 112 146 L86 146 C84 143 83 139 83 135 C83 129 84 124 84 120 C74 114 67 100 68 84 Z';

  CUSTOM.iguano = function (p) {
    var K = DN.artKit(p, C, 2.4);

    // ---- 奥の脚 ----
    p.open('p-legB', 76, 82);
    p.raw('<g transform="translate(-18 0)">');
    p.part(LEG, C.far, K.flat({ auto: K.auto(3, 4, 0.8, C.farShade) }));
    p.detail(K.hoof(92, 146, 0.8) + K.hoof(100, 146, 0.8) + K.hoof(107.4, 146, 0.75));
    p.raw('</g>');
    p.close();

    // ---- 奥の腕 ----
    p.open('p-armB', 120, 66);
    p.part('M116 62 C124 60 132 62 138 66 L144 63 C146 62 148 64 146 66 L142 70 L145 72 C146 74 144 76 142 74 L136 72 C128 72 120 70 116 66 Z', C.farShade, { lw: 1.8, ol: C.ink, ink: true });
    p.close();

    // ---- しっぽ ----
    p.open('p-tail', 76, 80);
    p.part('M78 68 C58 66 34 66 10 66 C5 66 2 68 3 70 C6 72 12 72 18 73 C40 76 58 82 74 92 Z', C.body, K.flat({
      belly: 'M80 88 C62 80 40 76 12 72 L0 100 L90 100 Z',
      inner: '<path d="M0 66 C30 66 56 66 80 68" fill="none" stroke="' + C.dark + '" stroke-width="7" stroke-linecap="round" opacity="0.55"/>' +
        K.stripe(24, 67, 4, -1, 3) + K.stripe(38, 67, 6, -1.4, 3.8) + K.stripe(52, 67, 8, -1.8, 4.4) + K.stripe(66, 68, 10, -2, 5),
      auto: K.auto(2, 2.8)
    }));
    p.close();

    // ---- 胴（上体を起こす）----
    p.open('p-body', 96, 104);
    p.part('M70 70 C78 58 94 50 112 46 C120 44 128 40 134 34 L150 44 C146 54 140 64 134 74 C128 86 118 96 104 100 C90 104 78 98 72 90 C68 84 66 76 70 70 Z', C.body, K.flat({
      belly: 'M154 42 C148 56 140 70 132 82 C122 94 108 100 94 100 L90 130 L170 130 Z',
      inner: '<path d="M64 70 C76 56 98 46 118 44 C126 42 132 38 138 30" fill="none" stroke="' + C.dark + '" stroke-width="10" stroke-linecap="round" opacity="0.55"/>' +
        K.rot(10, 84, 58, K.stripe(84, 58, 12, -2, 4.6)) + K.rot(0, 96, 52, K.stripe(96, 52, 14, -2, 5)) + K.rot(-10, 108, 48, K.stripe(108, 48, 13, -1, 4.8)) + K.rot(-28, 122, 44, K.stripe(122, 44, 10, -1, 4)) +
        K.lines('M140 54 C142 60 142 66 140 72', 1, 0.4) + K.lines('M78 90 C88 96 102 98 114 94', 1.1, 0.35),
      auto: K.auto(4, 5.5, 0.65)
    }));
    p.close();

    // ---- 手前の脚 ----
    p.open('p-legF', 84, 82);
    p.part(LEG, C.body, K.flat({
      inner: K.rot(18, 84, 70, K.stripe(84, 70, 10, -2, 4)) + K.lines('M74 104 C82 110 92 112 100 108', 1.2, 0.5) +
        K.lines('M92 128 l3 -2 M97 132 l3 -2 M102 135 l3 -1.8', 0.9, 0.45),
      auto: K.auto(3.6, 4.4)
    }));
    p.detail(K.hoof(92, 146, 0.9) + K.hoof(100.6, 146, 0.9) + K.hoof(108.4, 146, 0.85));
    p.close();

    // ---- 頭（長い顔とくちばし）----
    p.open('p-head', 140, 40);
    p.part('M134 34 C136 24 146 18 158 18 C170 18 182 22 192 28 C198 32 198 38 192 40 L176 42 C166 44 156 46 148 46 C140 46 134 42 134 34 Z', C.body, K.flat({
      belly: 'M128 40 C150 42 176 40 202 36 L202 56 L128 56 Z',
      inner: '<path d="M132 28 C144 18 166 18 190 26" fill="none" stroke="' + C.dark + '" stroke-width="6" stroke-linecap="round" opacity="0.5"/>' +
        K.lines('M140 38 C144 42 150 44 156 44', 1, 0.45) + '<ellipse cx="176" cy="32" rx="6" ry="2.6" fill="' + C.ink + '" opacity="0.15"/>',
      auto: K.auto(2.4, 3.2, 0.7)
    }));
    p.part('M182 26 C190 26 198 31 198 36 C197 40 192 41 186 40 C184 36 183 31 182 26 Z', C.beak, K.flat({ lw: 1.8, inner: K.lines('M186 34 C190 35 194 35 197 34', 0.9, 0.5) }));
    p.stroke('M160 40.4 C168 40.8 176 40 184 38.6', 1.8, C.ink);
    p.raw(K.eye({ x: 152, y: 28, rx: 3.2, ry: 3, iris: C.eye, white: true, pupil: 'round', pr: 0.6 }));
    if (!p.sil) {
      p.raw('<path d="M146.6 24.6 C149.6 22.6 155 22.4 158.6 24.4 L158.4 26 C155 25 150.6 25.4 147.4 26.8 Z" fill="' + C.dark + '" stroke="' + C.ink + '" stroke-width="0.8"/>');
      p.raw('<path d="M188 29.6 C189.6 28.6 191.6 29 192.2 30.2 C190.8 30.8 189.4 30.8 188 29.6 Z" fill="' + C.ink + '"/>');
    }
    p.close();

    // ---- 手前の腕（親指のトゲを前に突き出す）----
    p.open('p-armF', 124, 62);
    p.part('M120 58 C128 56 138 58 146 62 L152 60 C154 60 155 62 153 64 L148 68 L151 70 C152 72 150 74 148 72 L141 70 C132 70 124 68 120 64 Z', C.body, K.flat({ lw: 2, auto: K.auto(1.6, 2.2) }));
    // 親指のトゲ（前向き・上向き）
    p.part('M145 62 C150 54 158 46 168 40 C164 48 158 57 152 65 Z', C.spike, K.flat({ lw: 1.8, inner: '<path d="M149 64 C155 56 161 48 168 40 L168 45 L152 65 Z" fill="#cdbd94"/>' }));
    p.close();
  };
  CUSTOM.iguano.box = [128, 12, 72];
})(window);
