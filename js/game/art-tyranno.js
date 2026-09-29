/*
 * DINO DUEL 描きこみ版：ティラノサウルス
 * 頭を低く前に突き出し、しっぽを上げた前傾の構え。
 * 体を部品に分けて描く（技のアニメーションで、あご・頭・しっぽ・足・腕を別々に動かせる）。
 *   p-tail（しっぽ） / p-body（胴と首） / p-legF・p-legB（手前と奥の足） / p-armF・p-armB（腕）
 *   p-head（頭）の中に p-jaw（下あご）
 * 座標は 200×150、右向き、地面は y=144。
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};
  var CUSTOM = DN.ART_CUSTOM = DN.ART_CUSTOM || {};

  var C = {
    body: '#94683f',
    dark: '#4a3120',
    stripe: '#35220f',
    belly: '#ead0a0',
    lip: '#b88a5a',
    far: '#6a472a',
    farDeep: '#4d331e',
    mouth: '#4e0f14',
    tongue: '#b8414f',
    gum: '#9c2a35',
    tooth: '#fff8e6',
    claw: '#f1e4c8',
    eye: '#ffb31a',
    scar: '#e9cfa6',
    ink: '#22140b'
  };

  /** 下向きのしま（x, y = 付け根の中心、len = 長さ、lean = 先の横ずれ、w = 太さ） */
  function stripe(x, y, len, lean, w) {
    return '<path d="M' + (x - w / 2) + ' ' + (y - 5) + ' L' + (x + w / 2) + ' ' + (y - 5) + ' C' + (x + w * 0.3) + ' ' + (y + len * 0.5) + ' ' +
      (x + lean + 1) + ' ' + (y + len * 0.8) + ' ' + (x + lean) + ' ' + (y + len) + ' C' + (x + lean - 1) + ' ' + (y + len * 0.6) + ' ' + (x - w * 0.6) + ' ' + (y + len * 0.3) + ' ' + (x - w / 2) + ' ' + (y - 5) + 'Z" fill="' + C.stripe + '" opacity="0.8"/>';
  }
  function rot(deg, x, y, s) { return '<g transform="rotate(' + deg + ' ' + x + ' ' + y + ')">' + s + '</g>'; }
  /** 背中のこぶ（小さなうろこの列） */
  function scutes(pts) {
    var s = '';
    pts.forEach(function (q) {
      var r = q[2] || 2.4;
      s += '<path d="M' + (q[0] - r) + ' ' + q[1] + ' C' + (q[0] - r * 0.6) + ' ' + (q[1] - r * 0.9) + ' ' + (q[0] + r * 0.6) + ' ' + (q[1] - r * 0.9) + ' ' + (q[0] + r) + ' ' + q[1] + 'Z" transform="rotate(' + (q[3] || 0) + ' ' + q[0] + ' ' + q[1] + ')" fill="' + C.dark + '" stroke="' + C.ink + '" stroke-width="0.7" stroke-linejoin="round"/>';
    });
    return s;
  }
  /** 歯（x, y = 付け根の左、w = 幅、len = 長さ、dir = 1 下向き / -1 上向き） */
  function tooth(x, y, w, len, dir) {
    var tip = y + len * dir;
    return '<path d="M' + x + ' ' + y + ' C' + (x + w * 0.2) + ' ' + (y + len * 0.55 * dir) + ' ' + (x + w * 0.4) + ' ' + (tip - 0.3 * dir) + ' ' + (x + w * 0.55) + ' ' + tip +
      ' C' + (x + w * 0.75) + ' ' + (y + len * 0.5 * dir) + ' ' + (x + w) + ' ' + (y + len * 0.2 * dir) + ' ' + (x + w) + ' ' + y + 'Z" fill="' + C.tooth + '" stroke="' + C.ink + '" stroke-width="0.8" stroke-linejoin="round"/>' +
      '<path d="M' + (x + w * 0.62) + ' ' + (y + len * 0.15 * dir) + ' L' + (x + w * 0.58) + ' ' + (y + len * 0.7 * dir) + '" stroke="#d9c6a0" stroke-width="0.6" stroke-linecap="round"/>';
  }
  /** かぎ爪 */
  function claw(x, y, s, flip) {
    var k = flip ? -1 : 1;
    return '<path d="M' + x + ' ' + (y - 1.5 * s) + ' C' + (x + 3 * s * k) + ' ' + (y - 1.8 * s) + ' ' + (x + 5 * s * k) + ' ' + (y - 0.2 * s) + ' ' + (x + 5.4 * s * k) + ' ' + (y + 1.6 * s) +
      ' C' + (x + 3.6 * s * k) + ' ' + (y + 0.6 * s) + ' ' + (x + 1.6 * s * k) + ' ' + (y + 0.4 * s) + ' ' + x + ' ' + (y + 0.6 * s) + 'Z" fill="' + C.claw + '" stroke="' + C.ink + '" stroke-width="0.8" stroke-linejoin="round"/>';
  }

  CUSTOM.tyranno = function (p) {
    var LW = 2.6;
    p.raw('<g transform="translate(-7 0)">');
    var T = true; // うろこの模様
    p.headBox = CUSTOM.tyranno.box;
    p.defs += '<filter id="' + p.id + 'bl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter>';
    /** 部品の境目の影（ぼかし） */
    function AO(d, o) { return '<path d="' + d + '" fill="#1a0c04" opacity="' + (o || 0.35) + '" filter="url(#' + p.id + 'bl)"/>'; }
    /** 上のふちの照り返し */
    function RIM(d, w) { return '<path d="' + d + '" fill="none" stroke="#ffe7bf" stroke-width="' + (w || 1.5) + '" stroke-linecap="round" opacity="0.5"/>'; }
    function lines(d, w, o) { return '<path d="' + d + '" fill="none" stroke="' + C.ink + '" stroke-width="' + (w || 1) + '" stroke-linecap="round" opacity="' + (o || 0.4) + '"/>'; }

    // ---- 奥の足（うしろに蹴り出している）----
    p.open('p-legB', 80, 62);
    p.part('M60 64 C64 50 88 48 98 62 C104 72 104 86 98 96 C92 104 84 112 76 118 C78 126 82 134 86 140 C88 141 90 142 90 144 L70 144 C68 142 68 140 68 138 C66 132 64 128 62 124 C58 118 58 110 62 104 C58 96 56 80 60 64 Z',
      C.far, { lw: LW, skin: true, pattern: false, tex: T,
        inner: lines('M64 96 C72 102 84 102 92 96', 1.1, 0.45) + lines('M70 128 l3 -1.4 M72 133 l3 -1.4 M74 138 l3 -1.2', 0.9, 0.45) +
          lines('M80 138 C80 141 81 143 81 144', 0.9, 0.45) });
    p.detail(claw(90, 142.6, 1) + claw(82, 143.4, 0.85));
    p.close();

    // ---- 奥の腕 ----
    p.open('p-armB', 130, 90);
    p.part('M124 90 C130 90 134 94 136 100 C138 103 141 105 144 106 L143 109 L139 108 L141 112 L137 111 C134 108 131 105 128 103 C125 100 123 96 124 90 Z', C.farDeep, { lw: 1.8 });
    p.close();

    // ---- しっぽ（上に反らしている）----
    p.open('p-tail', 82, 62);
    p.part('M84 52 C66 46 36 38 3 33 C1 33.5 0 35 1 36.5 C18 42 40 50 56 60 C66 66 76 74 86 80 Z', C.body, {
      lw: LW, skin: true, pattern: false, tex: T,
      belly: 'M92 78 C78 70 66 62 54 56 C38 48 20 42 0 38 L0 160 L200 160 Z',
      inner:
        '<path d="M0 34 C30 38 60 44 88 52" fill="none" stroke="' + C.dark + '" stroke-width="11" stroke-linecap="round" opacity="0.5"/>' +
        rot(8, 14, 36, stripe(14, 36, 4, -1.5, 2.6)) + rot(10, 26, 38.6, stripe(26, 38.6, 6, -2, 3.2)) + rot(12, 38, 41.4, stripe(38, 41.4, 8, -2.5, 3.8)) +
        rot(14, 50, 44.4, stripe(50, 44.4, 10, -3, 4.4)) + rot(16, 62, 47.4, stripe(62, 47.4, 12, -3.5, 4.8)) + rot(18, 74, 50.4, stripe(74, 50.4, 13, -4, 5.2)) +
        lines('M6 38 C24 44 44 52 58 61', 0.8, 0.35),
      after: RIM('M6 34 C32 37.6 58 43 82 50', 1.3) + AO('M72 54 C80 54 88 56 90 60 L90 82 C82 76 74 70 70 66 Z', 0.3)
    });
    p.detail(scutes([[16, 34.4, 1.5, 8], [28, 36.8, 1.7, 10], [40, 39.4, 1.9, 12], [52, 42.4, 2.1, 14], [64, 45.4, 2.3, 16], [76, 48.6, 2.4, 18]]));
    p.close();

    // ---- 胴と首 ----
    p.open('p-body', 104, 104);
    p.part('M76 54 C90 44 112 42 128 48 C136 50 142 46 148 42 L162 52 C158 62 154 72 150 80 C146 90 140 98 130 104 C118 111 102 112 90 108 C78 104 70 94 68 82 C66 70 68 60 76 54 Z', C.body, {
      lw: LW, skin: true, pattern: false, tex: T,
      belly: 'M166 50 C160 62 156 74 150 84 C144 94 132 101 116 104 C102 106 88 102 78 96 L60 160 L200 160 L200 50 Z',
      inner:
        '<path d="M70 54 C86 44 110 40 128 46 C136 48 144 44 152 38" fill="none" stroke="' + C.dark + '" stroke-width="14" stroke-linecap="round" opacity="0.5"/>' +
        rot(10, 88, 48, stripe(88, 48, 16, -4, 5.4)) + rot(4, 100, 45, stripe(100, 45, 18, -4, 5.8)) + rot(-2, 112, 44.4, stripe(112, 44.4, 17, -3, 5.6)) +
        rot(-8, 124, 46.6, stripe(124, 46.6, 15, -2, 5.2)) + rot(-16, 136, 47, stripe(136, 47, 12, -1, 4.6)) + rot(-22, 146, 44, stripe(146, 44, 9, -1, 4)) +
        // おなかのうろこの段
        lines('M158 64 l-5 -2 M155 72 l-5 -2 M151 80 l-5 -1.6 M146 88 l-5 -1.2 M140 95 l-4 -1.6 M132 100 l-3 -2.4 M122 103 l-1.6 -3 M111 105 l-0.8 -3 M100 105 l0 -3 M89 102 l1 -3', 1, 0.3) +
        // 首のしわ・胸の筋肉
        lines('M152 60 C156 64 157 70 156 76 M146 64 C150 68 151 74 150 80', 1, 0.35) +
        lines('M84 94 C94 102 108 104 120 101', 1.3, 0.3) +
        '<path d="M120 58 C130 62 138 70 140 82" fill="none" stroke="#ffe7bf" stroke-width="3" stroke-linecap="round" opacity="0.18"/>',
      after: AO('M150 52 C162 58 162 72 154 80 C148 72 146 60 150 52 Z', 0.55) + AO('M66 66 C72 54 94 52 104 64 C96 60 80 60 66 74 Z', 0.4) +
        RIM('M80 52 C94 45 112 43.6 127 48.6 C135 50.6 141 47 147 43.4', 1.6)
    });
    p.detail(scutes([[90, 46.4, 2.5, -8], [102, 43.6, 2.6, -3], [114, 43.4, 2.6, 3], [126, 46.4, 2.5, 10], [137, 47.4, 2.3, -14]]));
    p.close();

    // ---- 手前の足（前に踏みこんでいる）----
    p.open('p-legF', 86, 64);
    p.part('M66 70 C70 54 96 50 106 66 C114 78 114 94 108 102 C104 108 100 114 98 120 C104 124 112 130 120 136 C125 138 128 140 129 142 L129 144 L94 144 C90 144 88 141 88 137 C88 130 89 124 90 118 C80 112 70 104 66 94 C64 86 64 78 66 70 Z', C.body, {
      lw: LW, skin: true, pattern: false, tex: T,
      inner:
        '<path d="M60 64 C74 52 98 50 110 66" fill="none" stroke="' + C.dark + '" stroke-width="9" stroke-linecap="round" opacity="0.4"/>' +
        rot(18, 80, 60, stripe(80, 60, 11, -3, 4)) + rot(10, 92, 57, stripe(92, 57, 12, -2, 4.2)) +
        lines('M72 96 C80 104 92 106 102 102', 1.2, 0.45) + lines('M96 66 C102 74 104 84 102 94', 1, 0.3) +
        '<path d="M92 62 C100 68 104 78 104 88" fill="none" stroke="#ffe7bf" stroke-width="2.6" stroke-linecap="round" opacity="0.28"/>' +
        lines('M100 124 l3 -2 M105 127 l3 -2 M110 130 l3 -1.8 M115 133 l3 -1.6 M95 121 l2.6 -2', 0.9, 0.45) +
        lines('M118 137 C119 140 120 142 120 144 M108 133 C108 137 109 141 109 144', 1, 0.45),
      after: RIM('M70 68 C76 58 94 55 102 62', 1.5)
    });
    p.detail(claw(129, 142.5, 1.2) + claw(120, 143.5, 1.05) + claw(109, 143.6, 1) + claw(89, 138, 0.8, true));
    p.close();

    // ---- 頭（首の付け根を中心に少し大きく）----
    p.open('p-head', 148, 52);
    p.raw('<g transform="translate(148 54) scale(1.16) translate(-148 -54)">');
    // 口の中（上あご側：あごを開けると見える）
    p.part('M150 60 L196 58 C195 62 193 66 191 70 L150 72 Z', C.mouth, { lw: 1.2 });
    // 下あご（ふだんから少し開けている）
    p.open('p-jaw', 150, 62);
    p.part('M148 64 L194 60 L193 49 L150 53 Z', C.mouth, { lw: 1.2 });
    p.detail('<path d="M152 62 C164 60 178 58 188 57 C180 61 166 64 154 66 Z" fill="' + C.tongue + '" stroke="' + C.ink + '" stroke-width="0.7"/>');
    p.detail(tooth(158, 61.4, 3, 4.4, -1) + tooth(164, 61, 3.4, 5.4, -1) + tooth(170.4, 60.6, 3.4, 5.6, -1) + tooth(176.8, 60.2, 3.2, 5.2, -1) +
      tooth(183, 59.8, 3, 4.6, -1) + tooth(188.6, 59.4, 2.6, 3.8, -1));
    p.part('M146 58 C160 62 178 61 194 59 C195 62 194 66 191 68 C182 72 168 74 156 74 C150 74 145 70 144 64 C144 61 145 59 146 58 Z', C.body, {
      lw: LW, skin: true, pattern: false, tex: T,
      belly: 'M140 69 C160 70 178 68 198 63 L198 90 L140 90 Z',
      inner: '<path d="M156 62.4 C168 62 180 61 192 59.8" fill="none" stroke="' + C.gum + '" stroke-width="2" opacity="0.85"/>' +
        '<circle cx="164" cy="66.6" r="0.75" fill="' + C.ink + '" opacity="0.55"/><circle cx="170" cy="66.8" r="0.75" fill="' + C.ink + '" opacity="0.55"/>' +
        '<circle cx="176" cy="66.4" r="0.75" fill="' + C.ink + '" opacity="0.55"/><circle cx="182" cy="65.6" r="0.75" fill="' + C.ink + '" opacity="0.55"/>' +
        '<circle cx="187.6" cy="64.4" r="0.7" fill="' + C.ink + '" opacity="0.55"/>' +
        lines('M147 62 C150 67 154 70 160 71.4', 1, 0.4)
    });
    p.close(); // p-jaw

    // 上の歯
    p.detail(tooth(156.4, 61.8, 3.4, 5.6, 1) + tooth(162.6, 61.6, 4.2, 8, 1) + tooth(169.6, 61.2, 4.4, 9.2, 1) + tooth(176.8, 60.8, 4.2, 8.6, 1) +
      tooth(183.6, 60.3, 3.8, 7, 1) + tooth(189.8, 59.6, 3.2, 5.2, 1) + tooth(195, 58.4, 2.4, 3.6, 1));

    // 頭の骨
    p.part('M144 44 C146 36 156 32 166 33 C176 34 186 38 194 44 C198 47 200 51 199 55 C198 58 195 60 191 60 C180 61 168 62 158 63 C154 64 150 65 147 64 C142 60 141 50 144 44 Z', C.body, {
      lw: LW, skin: true, pattern: false, tex: T,
      belly: 'M138 58.4 C160 58.6 180 57.6 202 55 L202 70 L138 70 Z', bellyFill: C.lip,
      inner:
        '<path d="M142 40 C156 30 178 32 198 46" fill="none" stroke="' + C.dark + '" stroke-width="9" stroke-linecap="round" opacity="0.5"/>' +
        rot(-6, 152, 38, stripe(152, 38, 8, -1.5, 3.6)) + rot(-2, 160, 35.4, stripe(160, 35.4, 6, -1, 3.2)) +
        // 鼻の横のくぼみ
        '<ellipse cx="183" cy="49" rx="9" ry="4.4" transform="rotate(12 183 49)" fill="' + C.ink + '" opacity="0.2"/>' +
        '<path d="M174 53 C180 54.6 188 54 194 51" fill="none" stroke="#ffe7bf" stroke-width="1.2" stroke-linecap="round" opacity="0.35"/>' +
        // ほおの筋肉
        lines('M146 54 C149 59 153 61 158 61.6', 1.1, 0.4) +
        '<ellipse cx="152" cy="50" rx="6" ry="5.4" fill="#fff" opacity="0.08"/>' +
        // 上くちびる
        '<path d="M156 61.4 C170 60.6 184 59.8 196 57.6" fill="none" stroke="' + C.gum + '" stroke-width="1.6" opacity="0.7"/>' +
        '<path d="M158 58.4 C170 57.8 182 57 194 55" fill="none" stroke="' + C.ink + '" stroke-width="0.8" stroke-dasharray="2.6 2" opacity="0.35"/>' +
        // 鼻先のしわ
        lines('M188 40.6 l1.6 2.4 M191.6 43 l1.4 2.2 M184.4 38.8 l1.8 2.4', 0.9, 0.45) +
        // 古傷
        '<path d="M175 40 l8 7.6 M178.4 38.6 l6.4 6" stroke="' + C.scar + '" stroke-width="1.2" stroke-linecap="round" opacity="0.9"/>',
      after: RIM('M146 40 C152 34.6 162 33.2 170 34 C180 35 188 39 194 44.4', 1.5)
    });
    if (!p.sil) {
      // 目のまわり（くぼみ・まゆの骨・目の前の角）
      p.raw('<ellipse cx="165.4" cy="43" rx="6.6" ry="4.6" fill="' + C.ink + '" opacity="0.45"/>');
      p.raw('<circle cx="165.4" cy="43.2" r="3.4" fill="' + C.eye + '" stroke="' + C.ink + '" stroke-width="1.1"/>');
      p.defs += '<radialGradient id="' + p.id + 'eg" cx="0.35" cy="0.3" r="0.75"><stop offset="0" stop-color="#fff5a8" stop-opacity="0.95"/><stop offset="0.45" stop-color="#ffb31a" stop-opacity="0"/><stop offset="1" stop-color="#7a2e00" stop-opacity="0.7"/></radialGradient>';
      p.raw('<circle cx="165.4" cy="43.2" r="3.4" fill="url(#' + p.id + 'eg)"/>');
      p.raw('<ellipse cx="166.3" cy="43.3" rx="1.3" ry="2.3" fill="#140a05"/>');
      p.raw('<circle cx="164.6" cy="42" r="0.85" fill="#fff"/>');
      p.raw('<path d="M156 37.4 C160 34.4 168 34.2 175 37.6 C171 39.4 165 39.6 159 40.6 Z" fill="' + C.dark + '" stroke="' + C.ink + '" stroke-width="0.9" stroke-linejoin="round"/>');
      p.raw('<path d="M171 36 C173 32.6 176 30.6 179.4 30 C179 33.2 178 35.8 175.8 37.6 Z" fill="' + C.dark + '" stroke="' + C.ink + '" stroke-width="0.9" stroke-linejoin="round"/>');
      p.raw('<path d="M154 39.4 C155.4 36 158 34.4 160.6 34.8" fill="none" stroke="' + C.ink + '" stroke-width="0.9" stroke-linecap="round"/>');
      p.raw('<path d="M158.4 40.4 L174 40.4" stroke="' + C.ink + '" stroke-width="2" stroke-linecap="round"/>');
      p.raw('<ellipse cx="194" cy="47.4" rx="2.3" ry="1.3" transform="rotate(25 194 47.4)" fill="' + C.ink + '"/>');
    }
    p.raw('</g>');
    p.close(); // p-head

    // ---- 手前の腕 ----
    p.open('p-armF', 134, 90);
    p.part('M131 88 C137 87 141 91 143 97 C145 100 148 102 151 103 L150 106 L146 105 L148 109 L144 108 C141 105 138 102 135 100 C132 97 130 93 131 88 Z', C.body, { lw: 1.9, skin: true, pattern: false, tex: T });
    p.detail(claw(150.4, 104.8, 0.55) + claw(147.6, 108.6, 0.55));
    p.close();
    p.raw('</g>');
  };
  CUSTOM.tyranno.box = [128, 16, 72]; // 顔のあたり（行動順のアイコン・演出の位置）
})(window);
