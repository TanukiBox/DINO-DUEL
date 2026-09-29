/*
 * DINO DUEL 描きこみ版：ティラノサウルス（イラスト調）
 * 平らな色＋やわらかい茶色の線、クリーム色のおなか、大きな目、大きく開けた口。
 * 体を部品に分けて描く（技のアニメーションで、あご・頭・しっぽ・足・腕を別々に動かせる）。
 *   p-tail（しっぽ） / p-body（胴と首） / p-legF・p-legB（手前と奥の足） / p-armF・p-armB（腕）
 *   p-head（頭）の中に p-jaw（下あご）
 * 座標は 200×150、右向き、地面は y=146。
 * rig：あごの角度（0 = 絵のまま少し開いた口 / jawOpen = 大きく開く / jawClose = 閉じる）
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};
  var CUSTOM = DN.ART_CUSTOM = DN.ART_CUSTOM || {};

  var C = {
    body: '#d39b5f',
    shade: '#b77c48',
    deep: '#a66d3e',
    belly: '#f2d6b4',
    stripe: '#a8723e',
    mouth: '#7c1f22',
    tongue: '#dc7078',
    tooth: '#fffaf0',
    claw: '#f5f2ea',
    iris: '#f0a72e',
    pupil: '#2a120e',
    ink: '#4a1a18'
  };
  var LW = 2.3;

  /** 平らな色のしま（線なし） */
  function stripe(x, y, len, lean, w) {
    return '<path d="M' + (x - w / 2) + ' ' + (y - 6) + ' L' + (x + w / 2) + ' ' + (y - 6) + ' C' + (x + w * 0.3) + ' ' + (y + len * 0.5) + ' ' +
      (x + lean + 1) + ' ' + (y + len * 0.85) + ' ' + (x + lean) + ' ' + (y + len) + ' C' + (x + lean - 1.4) + ' ' + (y + len * 0.6) + ' ' + (x - w * 0.6) + ' ' + (y + len * 0.3) + ' ' + (x - w / 2) + ' ' + (y - 6) + 'Z" fill="' + C.stripe + '"/>';
  }
  /** 歯（x, y = 付け根の左、w = 幅、len = 長さ、dir = 1 下向き / -1 上向き） */
  function tooth(x, y, w, len, dir) {
    var tip = y + len * dir;
    return '<path d="M' + x + ' ' + y + ' C' + (x + w * 0.25) + ' ' + (y + len * 0.5 * dir) + ' ' + (x + w * 0.45) + ' ' + (tip - 0.4 * dir) + ' ' + (x + w * 0.5) + ' ' + tip +
      ' C' + (x + w * 0.6) + ' ' + (y + len * 0.5 * dir) + ' ' + (x + w * 0.85) + ' ' + (y + len * 0.2 * dir) + ' ' + (x + w) + ' ' + y + 'Z" fill="' + C.tooth + '" stroke="' + C.ink + '" stroke-width="1.3" stroke-linejoin="round"/>';
  }
  /** 足の丸い爪（x = 真ん中、y = 地面） */
  function toeClaw(x, y, s) {
    s = s || 1;
    return '<path d="M' + (x - 4.4 * s) + ' ' + y + ' C' + (x - 4.6 * s) + ' ' + (y - 4.2 * s) + ' ' + (x - 1 * s) + ' ' + (y - 6.4 * s) + ' ' + (x + 2.6 * s) + ' ' + (y - 5 * s) +
      ' C' + (x + 4.2 * s) + ' ' + (y - 3.6 * s) + ' ' + (x + 5 * s) + ' ' + (y - 1.4 * s) + ' ' + (x + 5.4 * s) + ' ' + y + ' Z" fill="' + C.claw + '" stroke="' + C.ink + '" stroke-width="1.6" stroke-linejoin="round"/>';
  }
  function ln(d, w) { return '<path d="' + d + '" fill="none" stroke="' + C.ink + '" stroke-width="' + (w || 1.8) + '" stroke-linecap="round" stroke-linejoin="round"/>'; }

  // 足（手前・奥で同じ形）
  var LEG = 'M84 94 C88 80 110 78 118 92 C124 104 118 118 110 124 L113 134 C120 135 127 138 130 142 L130 146 L96 146 C94 140 95 132 98 126 C88 120 80 108 84 94 Z';
  var LEG_SHADE = 'M40 60 L92 80 C84 96 88 112 100 124 C97 132 97 140 99 146 L40 146 Z';

  CUSTOM.tyranno = function (p) {
    var flat = function (extra) { return Object.assign({ lw: LW, ol: C.ink, ink: true, skin: true, pattern: false, tex: false, shade: false }, extra || {}); };
    // 自動の影（形を光の向きにずらした差分）。dx, dy = ずらす量
    var AUTO = function (dx, dy, op) { return { dx: dx, dy: dy, color: C.shade, op: op || 0.95, hl: 0.5, hlOp: 0.32 }; };
    p.headBox = CUSTOM.tyranno.box;

    // ---- 奥の足 ----
    p.open('p-legB', 70, 96);
    p.raw('<g transform="translate(-30 0)">');
    p.part(LEG, C.deep, flat({ auto: { dx: 3.5, dy: 4, color: '#8a5530', op: 0.8, hl: false }, innerFlat: '<path d="' + LEG_SHADE + '" fill="' + C.shade + '" opacity="0.5"/>' }));
    p.detail(toeClaw(109, 146, 0.9) + toeClaw(118, 146, 0.95) + toeClaw(126.4, 146, 0.85));
    p.raw('</g>');
    p.close();

    // ---- 奥の腕 ----
    p.open('p-armB', 128, 90);
    p.part('M124 86 C129 88 133 94 134 100 L139 103 C140 105 138 107 136 106 L133 104 L133 108 C132 110 129 109 129 107 L127 103 C124 98 122 92 124 86 Z', C.deep, { lw: 1.9, ol: C.ink, ink: true });
    p.close();

    // ---- しっぽ ----
    p.open('p-tail', 78, 84);
    p.part('M80 66 C62 66 40 62 24 54 C16 50 10 46 4 42 C5 50 10 60 20 68 C34 80 54 90 76 98 Z', C.body, flat({
      belly: 'M9 45 C11 53 17 61 25 67 C39 77 57 87 79 93 L82 130 L0 130 L0 45 Z',
      inner: stripe(64, 66, 10, -2, 5) + stripe(50, 63, 8, -2, 4.4) + stripe(37, 58.6, 6, -1.6, 3.6),
      auto: AUTO(2.8, 4.2)
    }));
    p.close();

    // ---- 胴と首 ----
    p.open('p-body', 104, 118);
    p.part('M74 66 C84 52 102 44 118 40 L128 26 L150 50 C146 64 144 78 142 90 C140 108 128 122 106 124 C88 125 74 116 68 102 C64 90 66 76 74 66 Z', C.body, flat({
      belly: 'M154 50 C144 64 139 80 133 96 C125 112 104 119 86 115 L84 140 L170 140 Z',
      inner:
        // 頭の下の影
        '<path d="M124 42 C132 54 142 62 152 58 L154 40 Z" fill="' + C.shade + '"/>' +
        // 背中のしま
        stripe(84, 58, 14, -3, 5.4) + stripe(96, 51, 17, -3, 6) + stripe(108, 46, 18, -2, 6) + stripe(119, 42, 14, -1, 5.2),
      auto: AUTO(6, 8, 0.85),
      innerFlat: '<path d="M70 104 C78 118 94 126 112 124 C128 122 138 112 142 98 L150 130 L60 130 Z" fill="' + C.shade + '" opacity="0.35"/>'
    }));
    // 太ももの線（体に食いこむところ）
    p.stroke('M86 90 C92 84 102 82 110 86', 2, C.ink);
    p.close();

    // ---- 手前の足 ----
    p.open('p-legF', 100, 96);
    p.part(LEG, C.body, flat({ auto: AUTO(5, 6), innerFlat: '<path d="' + LEG_SHADE + '" fill="' + C.shade + '"/>' }));
    p.detail(toeClaw(109, 146) + toeClaw(118.4, 146, 1.05) + toeClaw(127, 146, 0.9));
    p.stroke('M104 128 C108 130 110 133 110 136', 1.8, C.ink);
    p.close();

    // ---- 頭 ----
    p.open('p-head', 136, 46);
    // 口の中（上あご側）
    p.part('M137 49 L193 38 L186 50 L140 56 Z', C.mouth, { lw: 1.6, ol: C.ink });

    // 下あご（口の中の下半分と舌も一緒に動く）
    p.open('p-jaw', 139, 52);
    p.part('M136 49 L181 65 L186 30 L142 30 Z', C.mouth, { lw: 1.6, ol: C.ink });
    p.detail('<path d="M143 54 C155 50.6 168 53.4 180 59.6 C170 64 156 61.6 145 58.6 Z" fill="' + C.tongue + '" stroke="' + C.ink + '" stroke-width="1.3"/>' +
      '<path d="M152 55 C160 55.4 167 57 173 59.6" fill="none" stroke="' + C.mouth + '" stroke-width="1" opacity="0.5"/>');
    p.detail(tooth(147.6, 53.4, 5, 6, -1) + tooth(155.6, 56.2, 5.4, 7, -1) + tooth(163.6, 59, 5.4, 7, -1) + tooth(171.4, 61.8, 5, 6.4, -1) + tooth(178.4, 64.2, 4.2, 5, -1));
    p.part('M135 49 L181 65 C185 66 186.4 69.4 184 72.4 C173 78.4 155 79 142 73 C134 68.6 132 58 135 49 Z', C.body, flat({
      belly: 'M128 71 C148 79.6 170 78 192 70 L192 92 L128 92 Z', bellyFill: C.shade,
      auto: AUTO(1.6, 2.6, 0.6)
    }));
    p.close(); // p-jaw

    // 上の歯
    p.detail(tooth(151, 43.7, 5.2, 7, 1) + tooth(158.8, 42.7, 5.8, 8.6, 1) + tooth(166.8, 41.6, 5.8, 8.6, 1) + tooth(174.8, 40.5, 5.6, 7.8, 1) +
      tooth(182.6, 39.4, 5, 6.6, 1) + tooth(189.4, 38.4, 3.8, 4.8, 1));

    // 頭の骨（上あご）
    p.part('M124 34 C122 20 132 8 148 6 C158 5 166 8 172 12 C182 10 194 14 198 24 C200 30 198 36 193 38 L150 44 C144 45 140 48 138 52 C130 50 125 44 124 34 Z', C.body, flat({
      belly: 'M118 42 C140 45 170 41 202 35 L202 60 L118 60 Z', bellyFill: C.shade,
      inner:
        // 頭のうしろの影・しま
        stripe(134, 14, 7, -2, 4) + stripe(142, 10, 6, -1.6, 3.6),
      auto: AUTO(4, 5.4, 0.85),
      innerFlat: '<path d="M118 20 C122 34 128 44 138 52 L110 60 Z" fill="' + C.shade + '" opacity="0.6"/>'
    }));
    if (!p.sil) {
      // 目（大きめ）
      p.raw('<ellipse cx="160" cy="22.5" rx="6.6" ry="7.2" fill="#fff" stroke="' + C.ink + '" stroke-width="1.9"/>');
      p.raw('<circle cx="161.8" cy="23.4" r="4.7" fill="' + C.iris + '"/>');
      p.raw('<circle cx="162.4" cy="23.6" r="3" fill="' + C.pupil + '"/>');
      p.raw('<circle cx="160.4" cy="21" r="1.7" fill="#fff"/>');
      p.raw('<circle cx="164.4" cy="25.8" r="0.8" fill="#fff"/>');
      // まゆ（キリッと）
      p.stroke('M150.4 13.6 C156 12.4 163 14 170.6 18.2', 3.6, C.ink);
      p.stroke('M147 9.6 C150 7.4 154 7 157 8', 1.8, C.ink);
      // 鼻の穴・ほおの線
      p.stroke('M186.6 19.2 C188.6 17.8 191 18 192.2 19.6', 2.2, C.ink);
      p.stroke('M133 40 C136.6 42.6 137.8 46.4 136.4 50', 2, C.ink);
    }
    p.close(); // p-head

    // ---- 手前の腕 ----
    p.open('p-armF', 134, 88);
    p.part('M131 84 C137 86 141 92 142 99 L147 102 C148.6 104 147 106.6 145 105.6 L141.6 103.6 L141.8 107.6 C141 110 138 109.6 137.6 107.4 L136 102 C133 96 130 90 131 84 Z', C.body, flat({
      innerFlat: '<path d="M126 84 C131 90 134 96 136 104 L126 110 Z" fill="' + C.shade + '"/>', lw: 1.9,
      auto: AUTO(1.8, 2.4)
    }));
    p.detail('<path d="M145.6 103.2 L148.6 105.4 L145.2 106.2 Z M139.8 107 L141 110.6 L137.8 109.2 Z" fill="' + C.claw + '" stroke="' + C.ink + '" stroke-width="1" stroke-linejoin="round"/>');
    p.close();
  };
  CUSTOM.tyranno.box = [120, 0, 80];                       // 顔のあたり（行動順のアイコン・演出の位置）
  CUSTOM.tyranno.rig = { jawOpen: 18, jawClose: -21 };    // あごの開け閉めの角度
})(window);
