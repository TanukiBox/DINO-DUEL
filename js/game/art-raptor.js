/*
 * DINO DUEL 描きこみ版：ヴェロキラプトル
 * 羽毛のある小型の肉食。低く身をかがめて飛びかかる直前の構え。
 * 長くまっすぐなしっぽ（先に羽の房）、細長い鼻先、腕の羽、第2指の大きなかぎ爪を持ち上げている。
 * 部品：p-tail / p-body / p-legF・p-legB / p-armF・p-armB / p-head（中に p-jaw）
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};
  var CUSTOM = DN.ART_CUSTOM = DN.ART_CUSTOM || {};

  var C = {
    body: '#d8a24a', shade: '#9c6a2a', dark: '#7a4e22', stripe: '#4a2c14', belly: '#f4e4ba',
    far: '#a8762e', farShade: '#7a5220',
    feather: '#2f86b0', featherDark: '#1d5676', featherTip: '#e8f2f6',
    mouth: '#6a1a1c', claw: '#241410', eye: '#ffb21e', ink: '#2a1a0e'
  };

  var LEG_F = 'M76 80 C78 68 96 66 102 78 C106 88 104 98 100 104 C96 110 92 114 90 118 C94 124 100 132 106 137 C109 140 111 142 112 144 L112 146 L91 146 C89 144 88 141 88 137 C88 131 87 126 86 120 C79 113 74 97 76 80 Z';
  var LEG_B = 'M64 78 C66 66 84 64 89 76 C92 86 90 95 86 101 C80 107 74 111 68 115 C70 123 74 131 78 137 C80 140 82 143 83 146 L65 146 C63 144 62 141 62 138 C61 132 60 126 60 120 C57 110 59 93 64 78 Z';

  CUSTOM.raptor = function (p) {
    var K = DN.artKit(p, C, 2.2);

    // ---- しっぽ（先の羽の房は、しっぽの後ろ）----
    p.open('p-tail', 82, 74);
    p.part('M20 58 L2 50 L9 57 L-3 59 L9 62 L1 70 L22 64 Z', C.feather, { lw: 1.6, ol: C.ink, ink: true });
    p.part('M90 64 C70 62 40 60 14 58 C8 57.6 3 58.4 2 60 C4 62 9 63 15 63.4 C40 66 64 72 86 84 Z', C.body, K.flat({
      belly: 'M90 80 C70 72 44 66 12 62 L0 90 L92 90 Z',
      inner: '<path d="M0 58 C30 60 60 61 92 64" fill="none" stroke="' + C.dark + '" stroke-width="6" stroke-linecap="round" opacity="0.6"/>' +
        K.stripe(24, 60, 3, -1, 2.4) + K.stripe(36, 60.6, 4, -1, 2.8) + K.stripe(48, 61.2, 5, -1.2, 3.2) + K.stripe(60, 62, 6, -1.4, 3.6) + K.stripe(72, 63, 8, -1.6, 4),
      auto: K.auto(1.6, 2.4)
    }));
    p.close();

    // ---- 奥の脚 ----
    p.open('p-legB', 76, 76);
    p.part(LEG_B, C.far, K.flat({ auto: K.auto(2.6, 3.4, 0.8, C.farShade), inner: K.lines('M64 98 C70 104 80 104 86 99', 1, 0.45) }));
    p.detail(K.claw(83, 145, 0.8) + K.claw(77, 145.4, 0.7));
    p.detail('<path d="M69 138 C68 131 74 128 79 131 C75 131 72 133 71 139 Z" fill="' + C.claw + '" stroke="' + C.ink + '" stroke-width="0.9"/>');
    p.close();

    // ---- 奥の腕（羽つき）----
    p.open('p-armB', 118, 80);
    p.part('M114 82 C118 90 124 96 130 99 L126 103 L122 99 L118 102 L115 97 L111 98 Z', C.featherDark, { lw: 1.4, ol: C.ink, ink: true });
    p.part('M116 78 C122 79 127 84 130 90 L135 93 C136 95 134 97 132 96 L129 95 L130 99 C129 101 126 100 126 98 L124 94 C120 90 116 86 116 78 Z', C.farShade, { lw: 1.6, ol: C.ink, ink: true });
    p.close();

    // ---- 胴と首 ----
    p.open('p-body', 104, 96);
    p.part('M78 70 C86 60 104 58 118 62 C124 62 130 60 134 56 L142 48 L154 62 C148 68 142 76 136 84 C130 92 120 99 106 100 C93 101 83 97 77 89 C73 83 72 76 78 70 Z', C.body, K.flat({
      belly: 'M158 58 C150 70 142 82 132 92 C122 99 108 102 94 99 L90 130 L170 130 Z',
      inner: '<path d="M72 68 C88 58 110 57 124 60 C132 58 138 52 144 46" fill="none" stroke="' + C.dark + '" stroke-width="9" stroke-linecap="round" opacity="0.65"/>' +
        K.rot(6, 90, 64, K.stripe(90, 64, 10, -2, 4)) + K.rot(0, 101, 62, K.stripe(101, 62, 12, -2, 4.4)) + K.rot(-6, 112, 62, K.stripe(112, 62, 11, -1.6, 4.2)) +
        K.rot(-30, 124, 60, K.stripe(124, 60, 8, -1, 3.6)) +
        // 背中の羽毛（ふち）
        '<path d="M92 60 l-3 -4 l5 2 l-1 -5 l5 4 l0 -5 l4 5 l2 -5 l3 6 l3 -5 l2 6 l4 -4 l0 6 Z" fill="' + C.feather + '" opacity="0.9"/>' +
        K.lines('M140 66 C142 70 142 74 140 78', 1, 0.4),
      auto: K.auto(3, 4.4, 0.7)
    }));
    p.close();

    // ---- 手前の脚（第2指のかぎ爪を持ち上げている）----
    p.open('p-legF', 88, 76);
    p.part(LEG_F, C.body, K.flat({
      inner: K.rot(20, 86, 72, K.stripe(86, 72, 9, -2, 3.6)) + K.lines('M80 100 C86 106 96 107 101 102', 1.1, 0.5) +
        K.lines('M94 124 l2.4 -1.6 M98 128 l2.4 -1.6 M102 132 l2.4 -1.4', 0.8, 0.5),
      auto: K.auto(3, 3.8)
    }));
    p.detail(K.claw(111, 145, 0.85) + K.claw(104, 145.6, 0.75));
    // 大きなかぎ爪
    p.detail('<path d="M92 138 C90 128 98 122 106 126 C100 126 96 130 95 139 Z" fill="' + C.claw + '" stroke="' + C.ink + '" stroke-width="1" stroke-linejoin="round"/>' +
      '<path d="M94 133 C95 128 99 126 103 126" fill="none" stroke="#8a6a5a" stroke-width="0.6" stroke-linecap="round"/>');
    p.close();

    // ---- 頭 ----
    p.open('p-head', 144, 58);
    p.part('M150 60 L195 58 L186 68 L150 66 Z', C.mouth, { lw: 1.2, ol: C.ink });
    p.open('p-jaw', 148, 62);
    p.part('M148 62 L186 71 L190 56 L152 54 Z', C.mouth, { lw: 1.2, ol: C.ink });
    p.detail('<path d="M152 64 C162 65 172 67 180 70 C172 71 160 69 153 67 Z" fill="#c44c58" stroke="' + C.ink + '" stroke-width="0.8"/>');
    p.detail(K.teethRow(155, 64.4, 182, 70.2, 6, 2.6, 3.2, -1));
    p.part('M147 61 L186 70.6 C189 71.4 189.6 74 187 75.4 L163 77 C154 77.4 148 71 147 61 Z', C.body, K.flat({ lw: 1.9, belly: 'M140 74 L196 72 L196 86 L140 86 Z', bellyFill: '#e8cf98', auto: K.auto(1, 1.6, 0.5) }));
    p.close();
    p.detail(K.teethRow(153, 59.6, 191, 58.2, 8, 2.6, 3.6, 1));
    // 頭の骨（細長い）
    p.part('M138 52 C141 45 150 42 160 43 C172 44 184 48 194 53 C198 55 198 58 195 59.4 L166 60.6 L152 62 C146 62 140 58 138 52 Z', C.body, K.flat({
      lw: 2,
      inner: '<path d="M136 48 C150 40 176 44 198 54" fill="none" stroke="' + C.dark + '" stroke-width="5" stroke-linecap="round" opacity="0.6"/>' +
        K.lines('M168 50 C176 50 184 52 190 54', 0.9, 0.35) +
        '<ellipse cx="172" cy="52" rx="6" ry="2.4" fill="' + C.ink + '" opacity="0.15"/>',
      auto: K.auto(1.8, 2.6, 0.7)
    }));
    // 頭の羽の房
    p.part('M141 46 L130 38 L138 44 L131 34 L143 42 L140 33 L148 43 Z', C.feather, { lw: 1.4, ol: C.ink, ink: true });
    p.raw(K.eye({ x: 157, y: 50, rx: 3.4, ry: 2.6, iris: C.eye, pupil: 'slit', glow: '#ffcc40' }));
    if (!p.sil) {
      p.raw('<path d="M151.4 47.6 C155 45.4 160 45.4 164 47.8 L164.4 49.4 C160 48 156 48.2 152 50 Z" fill="' + C.dark + '" stroke="' + C.ink + '" stroke-width="0.9" stroke-linejoin="round"/>');
      p.raw('<path d="M190 52.6 C191.4 51.8 193.4 52 194 53.2 C192.8 53.8 191.2 53.8 190 52.6 Z" fill="' + C.ink + '"/>');
    }
    p.close();

    // ---- 手前の腕（羽つき）----
    p.open('p-armF', 128, 80);
    // 腕のうしろに並ぶ風切り羽（下向きの羽を重ねる）
    p.part('M123 80 C129 86 135 90 141 92 L139 97 L136 95 L135 101 L131 97 L129 103 L126 97 L122 101 L121 94 L117 96 Z', C.feather, K.flat({
      lw: 1.5, inner: K.lines('M127 88 L126 98 M132 91 L131 100 M137 92 L136 97', 1, 0.6, C.featherDark) +
        '<path d="M117 96 L121 94 L122 101 Z M126 97 L129 103 L131 97 Z" fill="' + C.featherDark + '"/>'
    }));
    p.part('M124 78 C131 79 136 84 139 90 L145 93 C146.6 95 145 97.4 143 96.6 L139.6 95 L140.6 99 C140 101.4 137 101 136.6 99 L134.6 94.6 C130 91 125 86 124 78 Z', C.body, K.flat({ lw: 1.7, auto: K.auto(1.4, 2) }));
    p.detail(K.claw(144.6, 95.4, 0.5) + K.claw(139.6, 99.4, 0.5));
    p.close();
  };
  CUSTOM.raptor.box = [132, 30, 66];
  CUSTOM.raptor.rig = { jawOpen: 12, jawClose: -14 };
})(window);
