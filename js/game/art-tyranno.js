/*
 * DINO DUEL 描きこみ版：ティラノサウルス（SSR・かっこよさ重視）
 * 骨格の参考：両脚は腰（背中の一番高いところ）の一点から生え、太もも→ひざ（前）→足首（後ろ）→長い足の甲→前向きの指。
 * 構え：頭を低く前に出して吠える。手前の脚は前に踏みこみ、奥の脚は後ろを蹴る。しっぽはまっすぐ後ろへ。
 * 体を部品に分けて描く（技のアニメーションで、あご・頭・しっぽ・足・腕を別々に動かせる）。
 *   p-tail / p-body / p-legF・p-legB / p-armF・p-armB / p-head（中に p-jaw）
 * 座標は 200×150、右向き、地面は y=146。
 * rig：あごの角度（0 = 吠えて開いた口 / jawOpen = さらに開く / jawClose = 閉じる）
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};
  var CUSTOM = DN.ART_CUSTOM = DN.ART_CUSTOM || {};

  var C = {
    body: '#b4562d',
    dark: '#5c2616',
    stripe: '#33130b',
    belly: '#f2d6a2',
    far: '#7a3519',
    farShade: '#5a220f',
    shade: '#7e3419',
    mouth: '#560d12',
    tongue: '#c44c58',
    tooth: '#fffaf0',
    claw: '#2b1510',
    eye: '#ffd23a',
    scar: '#f0c9a0',
    ink: '#2a120c'
  };
  var LW = 2.5;

  /** 先のとがったしま（線なし） */
  function stripe(x, y, len, lean, w) {
    return '<path d="M' + (x - w / 2) + ' ' + (y - 6) + ' L' + (x + w / 2) + ' ' + (y - 6) + ' C' + (x + w * 0.3) + ' ' + (y + len * 0.45) + ' ' +
      (x + lean + 0.6) + ' ' + (y + len * 0.85) + ' ' + (x + lean) + ' ' + (y + len) + ' C' + (x + lean - 1) + ' ' + (y + len * 0.6) + ' ' + (x - w * 0.55) + ' ' + (y + len * 0.3) + ' ' + (x - w / 2) + ' ' + (y - 6) + 'Z" fill="' + C.stripe + '"/>';
  }
  function rot(deg, x, y, s) { return '<g transform="rotate(' + deg + ' ' + x + ' ' + y + ')">' + s + '</g>'; }
  /** 歯（x, y = 付け根の左、w = 幅、len = 長さ、dir = 1 下向き / -1 上向き） */
  function tooth(x, y, w, len, dir) {
    var tip = y + len * dir;
    return '<path d="M' + x + ' ' + y + ' C' + (x + w * 0.2) + ' ' + (y + len * 0.55 * dir) + ' ' + (x + w * 0.4) + ' ' + (tip - 0.3 * dir) + ' ' + (x + w * 0.52) + ' ' + tip +
      ' C' + (x + w * 0.66) + ' ' + (y + len * 0.5 * dir) + ' ' + (x + w * 0.88) + ' ' + (y + len * 0.2 * dir) + ' ' + (x + w) + ' ' + y + 'Z" fill="' + C.tooth + '" stroke="' + C.ink + '" stroke-width="1.1" stroke-linejoin="round"/>';
  }
  /** 足のかぎ爪（x, y = 付け根、前向きに曲がって地面へ） */
  function toeClaw(x, y, s) {
    s = s || 1;
    return '<path d="M' + x + ' ' + (y - 2.6 * s) + ' C' + (x + 3.4 * s) + ' ' + (y - 3 * s) + ' ' + (x + 6.2 * s) + ' ' + (y - 1 * s) + ' ' + (x + 7 * s) + ' ' + (y + 1.8 * s) +
      ' C' + (x + 4.6 * s) + ' ' + (y + 0.6 * s) + ' ' + (x + 2 * s) + ' ' + (y + 0.6 * s) + ' ' + x + ' ' + (y + 1 * s) + 'Z" fill="' + C.claw + '" stroke="' + C.ink + '" stroke-width="1" stroke-linejoin="round"/>' +
      '<path d="M' + (x + 1.6 * s) + ' ' + (y - 1.8 * s) + ' C' + (x + 3.6 * s) + ' ' + (y - 2 * s) + ' ' + (x + 5.2 * s) + ' ' + (y - 0.8 * s) + ' ' + (x + 5.8 * s) + ' ' + (y + 0.6 * s) + '" fill="none" stroke="#8a6a5a" stroke-width="0.7" stroke-linecap="round"/>';
  }

  // 手前の脚（前に踏みこむ）：腰 (74,74) → ひざ (104,104) → 足首 (88,124) → 指先 (124,146)
  var LEG_F = 'M60 72 C60 56 86 50 98 64 C107 76 110 92 104 104 C100 111 94 116 91 121 C96 127 104 133 112 137 C118 139 123 141 125 144 L125 146 L88 146 C85 143 84 139 84 134 C84 128 85 123 86 118 C74 111 62 96 60 72 Z';
  // 奥の脚（後ろを蹴る）：腰 → ひざ (92,98) → 足首 (60,122) → 指先 (84,146)、かかとが浮く
  var LEG_B = 'M56 70 C57 56 80 52 90 66 C96 76 96 88 91 97 C85 106 74 113 64 119 C66 127 72 135 79 140 C82 142 85 144 86 146 L64 146 C61 145 59 142 58 139 C55 132 53 126 53 120 C49 110 50 96 51 88 C52 80 53 75 56 70 Z';

  CUSTOM.tyranno = function (p) {
    var flat = function (extra) { return Object.assign({ lw: LW, ol: C.ink, ink: true, skin: true, pattern: false, tex: false, shade: false }, extra || {}); };
    var AUTO = function (dx, dy, op, col) { return { dx: dx, dy: dy, color: col || C.shade, op: op || 0.75, hl: 0.5, hlOp: 0.3 }; };
    function lines(d, w, o, col) { return '<path d="' + d + '" fill="none" stroke="' + (col || C.ink) + '" stroke-width="' + (w || 1) + '" stroke-linecap="round" opacity="' + (o || 0.5) + '"/>'; }
    p.headBox = CUSTOM.tyranno.box;

    // ---- 奥の脚 ----
    p.open('p-legB', 72, 72);
    p.part(LEG_B, C.far, flat({
      inner: rot(20, 70, 64, stripe(70, 64, 12, -2, 4.6)) + lines('M58 100 C66 106 78 106 86 100', 1.1, 0.5),
      auto: AUTO(3.5, 4.5, 0.8, C.farShade)
    }));
    p.detail(toeClaw(84, 145, 1) + toeClaw(76, 145.4, 0.85));
    p.close();

    // ---- 奥の腕 ----
    p.open('p-armB', 118, 88);
    p.part('M114 86 C119 86 123 90 125 96 L130 99 C131 101 129 103 127 102 L124 101 L125 105 C124 107 121 106 121 104 L119 100 C116 96 113 92 114 86 Z', C.farShade, { lw: 1.8, ol: C.ink, ink: true });
    p.close();

    // ---- しっぽ（まっすぐ後ろへ、少し上向き）----
    p.open('p-tail', 78, 64);
    p.part('M84 48 C62 45 36 42 12 38 C7 37.4 3 37.4 1 38.6 C3 41 8 42.6 14 44.4 C34 50.6 54 60 70 74 C74 78 78 82 82 86 Z', C.body, flat({
      belly: 'M86 80 C74 70 58 60 40 52 C28 47 16 43 4 41 L0 90 L90 90 Z',
      inner:
        '<path d="M0 37 C30 40 60 43 90 47" fill="none" stroke="' + C.dark + '" stroke-width="10" stroke-linecap="round" opacity="0.75"/>' +
        rot(6, 16, 39, stripe(16, 39, 5, -1.4, 3)) + rot(8, 28, 40.6, stripe(28, 40.6, 7, -1.8, 3.6)) + rot(10, 40, 42, stripe(40, 42, 9, -2.2, 4.2)) +
        rot(12, 52, 43.6, stripe(52, 43.6, 11, -2.6, 4.8)) + rot(14, 64, 45.2, stripe(64, 45.2, 13, -3, 5.2)) + rot(16, 76, 47, stripe(76, 47, 14, -3, 5.6)),
      auto: AUTO(2.4, 3.6)
    }));
    p.close();

    // ---- 胴と首 ----
    p.open('p-body', 96, 100);
    p.part('M64 60 C68 50 76 46 86 46 C98 46 108 48 118 50 C124 46 130 40 134 32 L150 46 C150 58 146 70 140 80 C136 90 130 98 120 104 C108 110 92 112 80 106 C70 101 63 92 61 80 C60 72 61 65 64 60 Z', C.body, flat({ joinWith: ['M84 48 C62 45 36 42 12 38 C7 37.4 3 37.4 1 38.6 C3 41 8 42.6 14 44.4 C34 50.6 54 60 70 74 C74 78 78 82 82 86 Z'],
      belly: 'M156 44 C152 60 146 74 138 86 C130 98 116 106 100 107 C90 108 82 105 76 100 L70 140 L170 140 Z',
      inner:
        '<path d="M58 56 C70 46 90 43 110 46 C120 47 128 42 136 32" fill="none" stroke="' + C.dark + '" stroke-width="15" stroke-linecap="round" opacity="0.75"/>' +
        rot(8, 84, 50, stripe(84, 50, 16, -3, 5.6)) + rot(2, 96, 49, stripe(96, 49, 19, -3, 6.2)) + rot(-4, 108, 50, stripe(108, 50, 18, -2, 6)) +
        rot(-24, 120, 48, stripe(120, 48, 14, -1, 5.2)) + rot(-38, 128, 40, stripe(128, 40, 10, -1, 4.4)) +
        // 首のしわ・胸のうろこの段
        lines('M140 52 C144 58 145 64 144 70 M134 56 C138 62 139 68 138 74', 1.1, 0.45) +
        lines('M146 66 l-5 -1.6 M143 74 l-5 -1.4 M139 82 l-5 -1 M134 90 l-4 -1 M127 97 l-3 -2 M118 102 l-1.4 -3 M108 105 l-0.4 -3 M98 106 l0.4 -3', 1, 0.35),
      after: '<path d="M126 44 C136 54 146 60 152 56 L154 40 Z" fill="' + C.ink + '" opacity="0.3"/>',
      auto: AUTO(5.5, 7.5, 0.7)
    }));
    p.close();

    // ---- 手前の脚 ----
    p.open('p-legF', 76, 72);
    p.part(LEG_F, C.body, flat({
      inner:
        '<path d="M54 66 C66 52 92 48 104 64" fill="none" stroke="' + C.dark + '" stroke-width="9" stroke-linecap="round" opacity="0.6"/>' +
        rot(20, 76, 62, stripe(76, 62, 14, -3, 5)) + rot(10, 88, 58, stripe(88, 58, 15, -2, 5.2)) +
        // 太ももの筋肉・すねのうろこ
        lines('M66 94 C74 104 88 108 100 104', 1.3, 0.55) + lines('M92 70 C99 78 102 88 100 98', 1.1, 0.35) +
        lines('M94 124 l3 -2 M99 128 l3 -2 M104 131 l3 -1.8 M109 134 l3 -1.6', 0.9, 0.5) +
        lines('M112 138 C113 141 113 144 113 146 M102 135 C102 139 103 143 103 146', 1, 0.5),
      auto: AUTO(4.5, 5.5)
    }));
    p.detail(toeClaw(124, 145) + toeClaw(114, 145.6, 0.9) + toeClaw(104, 145.8, 0.8) + toeClaw(86, 139, 0.6));
    p.close();

    // ---- 頭 ----
    p.open('p-head', 136, 44);
    // 口の中（上あご側）
    p.part('M139 52 L190 41 L181 64 L140 60 Z', C.mouth, { lw: 1.4, ol: C.ink });

    // 下あご（口の中の下半分・舌・下の歯も一緒に動く）
    p.open('p-jaw', 138, 52);
    p.part('M136 50 L180 71 L184 47 L142 38 Z', C.mouth, { lw: 1.4, ol: C.ink });
    p.detail('<path d="M143 56 C155 57 167 62 177 68 C167 70 153 67 145 62 Z" fill="' + C.tongue + '" stroke="' + C.ink + '" stroke-width="1"/>' +
      '<path d="M152 60 C160 62 166 64 171 67" fill="none" stroke="' + C.mouth + '" stroke-width="0.9" opacity="0.5"/>');
    p.detail(tooth(146, 55.8, 4.4, 5.4, -1) + tooth(152.6, 59, 4.8, 6.6, -1) + tooth(159.4, 62.2, 4.8, 7, -1) + tooth(166.2, 65.4, 4.6, 6.4, -1) +
      tooth(172.6, 68.4, 4, 5.4, -1) + tooth(177.6, 70.6, 3.4, 4.2, -1));
    p.part('M136 50 L180 71 C184 72 186 76 183 79 C172 83 156 84 146 80 C138 76 134 66 136 50 Z', C.body, flat({
      belly: 'M130 72 C146 80 166 82 190 74 L190 96 L130 96 Z',
      inner: '<path d="M140 55 C152 60 166 67 180 72" fill="none" stroke="' + C.dark + '" stroke-width="3" opacity="0.5"/>' +
        '<circle cx="152" cy="67" r="0.8" fill="' + C.ink + '" opacity="0.5"/><circle cx="159" cy="70.4" r="0.8" fill="' + C.ink + '" opacity="0.5"/>' +
        '<circle cx="166" cy="73.4" r="0.8" fill="' + C.ink + '" opacity="0.5"/><circle cx="173" cy="75.8" r="0.7" fill="' + C.ink + '" opacity="0.5"/>',
      auto: AUTO(1.8, 2.8, 0.6)
    }));
    p.close(); // p-jaw

    // 上の歯（大小をつけて並べる）
    p.detail(tooth(149, 47.4, 4, 6, 1) + tooth(154.6, 46.4, 4.8, 8.4, 1) + tooth(160.8, 45.4, 5, 10, 1) + tooth(167.2, 44.2, 4.8, 9, 1) +
      tooth(173.4, 43.2, 4.6, 8, 1) + tooth(179.4, 42.2, 4.2, 7, 1) + tooth(185, 41.2, 3.6, 5.6, 1) + tooth(189.6, 40.4, 2.8, 4, 1));

    // 頭の骨（上あご）
    p.part('M128 30 C132 20 142 14 152 14 C158 14 162 16 166 18 C174 16 186 18 194 24 C198 27 199 32 198 36 C197 39 194 40 190 41 L168 44 L150 48 C146 49 142 51 140 54 C134 52 128 46 126 40 C125 36 126 33 128 30 Z', C.body, flat({
      belly: 'M122 45 C146 47 172 43 202 37 L202 60 L122 60 Z', bellyFill: '#c9794a',
      inner:
        '<path d="M124 26 C138 12 170 12 198 30" fill="none" stroke="' + C.dark + '" stroke-width="9" stroke-linecap="round" opacity="0.75"/>' +
        rot(-10, 136, 20, stripe(136, 20, 8, -2, 4)) + rot(-4, 144, 17, stripe(144, 17, 7, -1.6, 3.6)) +
        // 鼻の横のくぼみ・ほおの筋肉
        '<ellipse cx="180" cy="32" rx="8.6" ry="4" transform="rotate(10 180 32)" fill="' + C.ink + '" opacity="0.18"/>' +
        lines('M130 40 C134 46 138 50 144 51', 1.2, 0.5) +
        // 鼻先の古傷（3本）
        '<path d="M176 22 l7 10 M180 20.4 l7 10 M184 19.6 l5.6 8.4" stroke="' + C.scar + '" stroke-width="1.2" stroke-linecap="round" opacity="0.9"/>' +
        // 上くちびる
        '<path d="M150 46.4 C162 45 176 43 191 40.4" fill="none" stroke="' + C.ink + '" stroke-width="0.8" stroke-dasharray="2.4 2" opacity="0.35"/>',
      auto: AUTO(3.2, 4.6, 0.8)
    }));
    if (!p.sil) {
      // 目：張り出したまゆの骨の影の中で、黄色く光る鋭い目
      p.raw('<path d="M148 25 C152 20.4 162 20 169 23.6 C168 29 162 32 156 31.6 C151 31.2 148 28.6 148 25 Z" fill="' + C.ink + '" opacity="0.55"/>');
      p.raw('<path d="M151.4 26.4 C154 23.6 160.6 23.4 164.6 25.6 C163.6 28.6 159.6 30 156.4 29.8 C153.6 29.6 151.8 28.4 151.4 26.4 Z" fill="' + C.eye + '" stroke="' + C.ink + '" stroke-width="1.1"/>');
      p.raw('<ellipse cx="158.6" cy="26.8" rx="1.05" ry="2.6" fill="' + C.ink + '"/>');
      p.raw('<circle cx="156" cy="25.6" r="0.75" fill="#fff"/>');
      p.defs += '<radialGradient id="' + p.id + 'eg"><stop offset="0" stop-color="#ffe46a" stop-opacity="0.55"/><stop offset="1" stop-color="#ffe46a" stop-opacity="0"/></radialGradient>';
      p.raw('<ellipse cx="158" cy="26.6" rx="11" ry="7" fill="url(#' + p.id + 'eg)"/>');
      // まゆの骨（目にかぶさる）と、目の前の角
      p.raw('<path d="M146 22.6 C150 17.4 160 16.4 169 19.8 L171 24.6 C164 22.4 156 22.2 150 25.6 Z" fill="' + C.dark + '" stroke="' + C.ink + '" stroke-width="1.1" stroke-linejoin="round"/>');
      p.raw('<path d="M165 19.2 C167 14.6 170.6 12 174.6 11.2 C174.4 15 173 18.4 170.8 20.6 Z" fill="' + C.dark + '" stroke="' + C.ink + '" stroke-width="1.1" stroke-linejoin="round"/>');
      p.stroke('M150 24.8 C156 22.2 164 22.4 170.4 24.4', 2.4, C.ink);
      // 鼻の穴
      p.raw('<path d="M189 27.4 C191 26 194 26.4 195 28.2 C193.4 29 191 29 189 27.4 Z" fill="' + C.ink + '"/>');
    }
    p.close(); // p-head

    // ---- 手前の腕 ----
    p.open('p-armF', 126, 86);
    p.part('M121 83 C127 83 131 88 133 94 L138.6 97.4 C140 99.6 138.4 102 136.2 101 L133 99.4 L133.8 103.6 C133 106 129.8 105.6 129.6 103.4 L127.6 99 C123.6 95 120.6 90 121 83 Z', C.body, flat({
      lw: 1.9, auto: AUTO(1.6, 2.2)
    }));
    p.detail('<path d="M137.8 99 C140 99.6 141.4 101.2 141.4 103 C140 102 138.6 101.6 137.2 101.6 Z M132.6 103 C134 104.4 134.4 106.2 133.8 107.6 C133 106.4 131.8 105.6 130.6 105.4 Z" fill="' + C.claw + '" stroke="' + C.ink + '" stroke-width="0.8" stroke-linejoin="round"/>');
    p.close();
  };
  CUSTOM.tyranno.box = [124, 4, 78];                      // 顔のあたり（行動順のアイコン・演出の位置）
  CUSTOM.tyranno.rig = { jawOpen: 10, jawClose: -34 };    // あごの開け閉めの角度
})(window);
