/*
 * DINO DUEL 描きこみ版：肉食恐竜（ティラノサウルスとヴェロキラプトル以外）
 *
 * 大型（bigTheropod）：ギガノトサウルス・アロサウルス・カルノタウルス・スピノサウルス・バリオニクス・ディロフォサウルス・ヘレラサウルス・ティラノケラス（EX）
 *   体・脚・しっぽはティラノと同じ骨格（両脚は腰の一点から）。頭の形・帆・腕・模様・色・目で描き分ける。
 *   頭：long（長い頭）/ croc（ワニのような細長い口）/ bull（角のある短い頭）/ crest（2枚のトサカ）/ rexHorn（ティラノの頭に角とえり飾り）
 * 小型（smallTheropod）：デイノニクス・ユタラプトル・コエロフィシス・コンプソグナトゥス
 *   ヴェロキラプトルと同じ骨格。羽毛・大きなかぎ爪・模様・色・目で描き分ける。
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};
  var CUSTOM = DN.ART_CUSTOM = DN.ART_CUSTOM || {};
  var LIB = DN.artLib = DN.artLib || {};

  // ================= 大型の肉食 =================
  var BIG = {
    tail: 'M84 48 C62 45 36 42 12 38 C7 37.4 3 37.4 1 38.6 C3 41 8 42.6 14 44.4 C34 50.6 54 60 70 74 C74 78 78 82 82 86 Z',
    body: 'M64 60 C68 50 76 46 86 46 C98 46 108 48 118 50 C124 46 130 40 134 32 L150 46 C150 58 146 70 140 80 C136 90 130 98 120 104 C108 110 92 112 80 106 C70 101 63 92 61 80 C60 72 61 65 64 60 Z',
    bodySlim: 'M66 62 C72 52 82 48 92 48 C104 48 112 49 120 50 C126 46 131 40 134 32 L150 46 C149 58 145 68 139 76 C134 84 126 92 114 96 C102 100 88 100 78 96 C68 92 63 84 62 76 C61 70 63 65 66 62 Z',
    legF: 'M60 72 C60 56 86 50 98 64 C107 76 110 92 104 104 C100 111 94 116 91 121 C96 127 104 133 112 137 C118 139 123 141 125 144 L125 146 L88 146 C85 143 84 139 84 134 C84 128 85 123 86 118 C74 111 62 96 60 72 Z',
    legB: 'M56 70 C57 56 80 52 90 66 C96 76 96 88 91 97 C85 106 74 113 64 119 C66 127 72 135 79 140 C82 142 85 144 86 146 L64 146 C61 145 59 142 58 139 C55 132 53 126 53 120 C49 110 50 96 51 88 C52 80 53 75 56 70 Z',
    armF: 'M121 83 C127 83 131 88 133 94 L138.6 97.4 C140 99.6 138.4 102 136.2 101 L133 99.4 L133.8 103.6 C133 106 129.8 105.6 129.6 103.4 L127.6 99 C123.6 95 120.6 90 121 83 Z',
    armB: 'M114 86 C119 86 123 90 125 96 L130 99 C131 101 129 103 127 102 L124 101 L125 105 C124 107 121 106 121 104 L119 100 C116 96 113 92 114 86 Z',
    armBig: 'M117 80 C125 80 133 86 137 94 L145 97 C147.4 98.6 146.6 102 144 102 L140 101.4 L141.6 106 C141 108.4 137.6 108.4 137 106 L134 100.6 C127 96 119 90 117 80 Z'
  };

  /** 模様（tiger しま / spots まだら / bands 太い帯 / none）。where = tail / body / leg / head */
  function pattern(K, C, kind, where) {
    var st = K.stripe, R = K.rot;
    if (kind === 'tiger') {
      if (where === 'tail') return R(8, 16, 39, st(16, 39, 5, -1.4, 3)) + R(10, 28, 40.6, st(28, 40.6, 7, -1.8, 3.6)) + R(12, 40, 42, st(40, 42, 9, -2.2, 4.2)) + R(14, 52, 43.6, st(52, 43.6, 11, -2.6, 4.8)) + R(16, 64, 45.2, st(64, 45.2, 13, -3, 5.2)) + R(18, 76, 47, st(76, 47, 14, -3, 5.6));
      if (where === 'body') return R(8, 84, 50, st(84, 50, 16, -3, 5.6)) + R(2, 96, 49, st(96, 49, 19, -3, 6.2)) + R(-4, 108, 50, st(108, 50, 18, -2, 6)) + R(-24, 120, 48, st(120, 48, 14, -1, 5.2)) + R(-38, 128, 40, st(128, 40, 10, -1, 4.4));
      if (where === 'leg') return R(20, 76, 62, st(76, 62, 14, -3, 5)) + R(10, 88, 58, st(88, 58, 15, -2, 5.2));
      if (where === 'head') return R(-10, 136, 22, st(136, 22, 8, -2, 4)) + R(-4, 144, 19, st(144, 19, 7, -1.6, 3.6));
    }
    if (kind === 'spots') {
      if (where === 'tail') return K.spots([[20, 41, 2, 1.4], [32, 44, 2.4, 1.6], [44, 46, 2.6, 1.8], [56, 50, 3, 2], [68, 54, 3, 2], [40, 51, 1.8], [62, 60, 2]], C.stripe, 0.75);
      if (where === 'body') return K.spots([[84, 56, 3.6, 2.4], [98, 54, 3.4, 2.4], [112, 56, 3, 2.2], [124, 52, 2.6, 2], [90, 68, 2.6, 2], [106, 66, 2.8, 2], [120, 64, 2.4, 1.8], [132, 46, 2.2, 1.6], [138, 38, 2, 1.4]], C.stripe, 0.75);
      if (where === 'leg') return K.spots([[74, 66, 3, 2], [88, 64, 3, 2.2], [80, 78, 2.4, 1.8], [96, 76, 2.4, 1.6]], C.stripe, 0.75);
      if (where === 'head') return K.spots([[140, 24, 2, 1.4], [150, 21, 2.2, 1.4], [134, 32, 1.8, 1.2]], C.stripe, 0.7);
    }
    if (kind === 'bands') {
      if (where === 'tail') return R(12, 30, 40, st(30, 40, 9, -2, 6)) + R(14, 52, 43, st(52, 43, 12, -3, 8)) + R(16, 72, 46, st(72, 46, 14, -3, 9));
      if (where === 'body') return R(4, 92, 49, st(92, 49, 22, -4, 10)) + R(-10, 114, 49, st(114, 49, 20, -3, 10));
      if (where === 'leg') return R(14, 82, 60, st(82, 60, 16, -3, 8));
      if (where === 'head') return R(-8, 142, 20, st(142, 20, 9, -2, 6));
    }
    return '';
  }

  // ---- 頭 ----
  // どの頭も、首の付け根と下あごの付け根は同じ位置（p-head の中心 136,44、p-jaw の中心 138,52）
  var HEADS = {
    long: {
      interior: 'M139 53 L190 44 L180 63 L140 59 Z', flap: 'M136 51 L178 68 L182 46 L142 38 Z',
      tongue: 'M143 56 C154 57 165 61 174 66 C165 68 152 65 145 61 Z',
      jaw: 'M136 51 L178 68 C182 69 184 72 181 75 C170 79 156 80 146 77 C138 74 134 64 136 51 Z', jawBelly: 'M130 70 C146 77 164 79 188 72 L188 96 L130 96 Z',
      lowT: [146, 55, 174, 66.6, 6, 4, 5.4], upT: [150, 48.4, 190, 43.6, 8, 4.2, 7],
      skull: 'M126 34 C129 24 140 19 152 19 C166 19 180 23 192 29 C198 32 200 37 198 41 C196 44 192 45 188 45 L168 47 L150 49 C146 50 142 52 140 55 C132 52 127 46 126 40 C125 37 125 35 126 34 Z',
      skullBelly: 'M122 44 C146 46 172 43 202 38 L202 60 L122 60 Z', dorsal: 'M124 30 C140 18 172 18 198 34',
      eye: [156, 29], brow: 'M148 26 C152 21 162 20 169 23 L170 27 C164 25 156 25 150 28 Z', nostril: [190, 31], fossa: [176, 35],
      rig: { jawOpen: 12, jawClose: -24 }
    },
    croc: {
      interior: 'M139 53 L195 45.4 L186 57 L140 58 Z', flap: 'M136 51 L186 59 L190 47 L142 42 Z',
      tongue: 'M143 55 C156 56 170 57 180 58 C170 60 154 59 145 58 Z',
      jaw: 'M136 51 L186 59 C190 60 191 62.4 189 64.4 C176 67.6 158 68 146 65.6 C138 62 134 57 136 51 Z', jawBelly: 'M130 63 C150 66 172 66 194 62 L194 90 L130 90 Z',
      lowT: [146, 53.4, 184, 58.8, 9, 3, 4], upT: [150, 49.4, 194, 46, 11, 3.2, 5],
      skull: 'M128 34 C131 26 140 22 150 22 C160 22 168 25 176 29 C186 33 194 37 198 41 C199 44 197 46 194 46 L170 47.5 L150 49.5 C146 50 142 52 140 55 C132 52 128 46 128 40 Z',
      skullBelly: 'M124 45 C150 47 176 45 202 41 L202 60 L124 60 Z', dorsal: 'M126 32 C144 20 176 26 198 40',
      eye: [153, 31], brow: 'M146 28.6 C150 25 158 24.6 163 27 L163.6 30 C158 28.6 152 28.8 148 31 Z', nostril: [180, 33.4], fossa: [168, 37],
      rig: { jawOpen: 10, jawClose: -12 }
    },
    bull: {
      interior: 'M139 53 L186 43.4 L178 60 L140 59 Z', flap: 'M136 51 L176 63 L180 44 L142 40 Z',
      tongue: 'M143 56 C152 57 162 59 170 62 C162 64 151 62 145 60 Z',
      jaw: 'M136 51 L176 63 C180 64 181 67 179 70 C168 75 153 76 145 72 C138 68 134 60 136 51 Z', jawBelly: 'M130 68 C146 74 164 74 186 66 L186 96 L130 96 Z',
      lowT: [146, 54.6, 172, 62, 5, 4.4, 5.6], upT: [150, 47.4, 184, 43.6, 6, 4.8, 7.4],
      skull: 'M130 34 C132 24 142 17 154 17 C166 17 178 21 186 28 C190 32 190 39 186 43 L168 46 L152 48 C146 49 142 52 140 55 C132 52 128 44 130 34 Z',
      skullBelly: 'M124 43 C146 45 168 43 192 39 L192 60 L124 60 Z', dorsal: 'M128 28 C140 16 168 14 188 30',
      eye: [158, 30], brow: 'M150 27 C154 22 164 21 170 24.6 L170.6 28.6 C164 26.6 157 26.6 152 29.6 Z', nostril: [182, 30], fossa: [172, 35],
      rig: { jawOpen: 14, jawClose: -24 }
    },
    crest: {
      interior: 'M139 53 L188 45 L178 62 L140 59 Z', flap: 'M136 51 L176 66 L180 46 L142 40 Z',
      tongue: 'M143 56 C153 57 163 60 171 64 C163 66 151 64 145 60 Z',
      jaw: 'M136 51 L176 66 C179.6 67 181 70 178.6 72.6 C168 76 155 77 146 74 C138 71 134 62 136 51 Z', jawBelly: 'M130 68 C146 74 164 76 186 70 L186 96 L130 96 Z',
      lowT: [146, 55, 172, 64.6, 6, 3.4, 4.6], upT: [150, 48.6, 188, 44.6, 8, 3.6, 5.6],
      skull: 'M128 36 C131 28 140 24 150 24 C162 24 176 28 188 34 C194 37 197 41 195 44 C193 46 190 46 186 46 L168 47.4 L150 49 C146 50 142 52 140 55 C132 52 128 46 128 40 Z',
      skullBelly: 'M124 45 C148 47 172 45 200 41 L200 60 L124 60 Z', dorsal: 'M126 34 C142 22 172 26 196 40',
      eye: [154, 32], brow: 'M147 29.6 C151 26 159 25.6 164 28 L164.4 31 C159 29.6 153 29.8 149 32 Z', nostril: [186, 38], fossa: [172, 38],
      rig: { jawOpen: 14, jawClose: -18 }
    },
    rex: {
      interior: 'M139 52 L190 41 L181 64 L140 60 Z', flap: 'M136 50 L180 71 L184 47 L142 38 Z',
      tongue: 'M143 56 C155 57 167 62 177 68 C167 70 153 67 145 62 Z',
      jaw: 'M136 50 L180 71 C184 72 186 76 183 79 C172 83 156 84 146 80 C138 76 134 66 136 50 Z', jawBelly: 'M130 72 C146 80 166 82 190 74 L190 96 L130 96 Z',
      lowT: [146, 55.8, 177.6, 70.6, 6, 4.6, 6.6], upT: [149, 47.4, 189.6, 40.4, 8, 4.6, 9],
      skull: 'M128 30 C132 20 142 14 152 14 C158 14 162 16 166 18 C174 16 186 18 194 24 C198 27 199 32 198 36 C197 39 194 40 190 41 L168 44 L150 48 C146 49 142 51 140 54 C134 52 128 46 126 40 C125 36 126 33 128 30 Z',
      skullBelly: 'M122 45 C146 47 172 43 202 37 L202 60 L122 60 Z', dorsal: 'M124 26 C138 12 170 12 198 30',
      eye: [158.6, 26.8], brow: 'M146 22.6 C150 17.4 160 16.4 169 19.8 L171 24.6 C164 22.4 156 22.2 150 25.6 Z', nostril: [191, 27.6], fossa: [180, 32],
      rig: { jawOpen: 10, jawClose: -34 }
    }
  };

  function drawHead(p, K, C, o) {
    var H = HEADS[o.head];
    p.open('p-head', 136, 44);
    // えり飾り（EX）：頭のうしろ
    if (o.frill) {
      p.part('M118 44 C110 24 122 4 142 2 C158 2 166 14 164 30 C160 44 150 54 138 56 C128 56 120 52 118 44 Z', o.frill, K.flat({
        lw: 2.2, inner: K.lines('M126 40 C122 26 132 12 146 10 M134 44 C132 32 138 20 150 16', 1.4, 0.6, C.stripe) +
          '<path d="M120 42 C114 24 126 6 142 5 C156 5 163 16 161 30" fill="none" stroke="' + C.stripe + '" stroke-width="3" opacity="0.9"/>',
        auto: K.auto(2.4, 3.2, 0.6, C.shade)
      }));
    }
    // 帆のように高いトサカ（ディロフォサウルス）：奥の1枚
    if (o.head === 'crest') p.part('M152 28 C154 14 166 8 180 12 C176 16 170 22 166 30 Z', C.crestFar || C.shade, { lw: 1.6, ol: C.ink, ink: true });
    p.part(H.interior, C.mouth, { lw: 1.4, ol: C.ink });
    p.open('p-jaw', 138, 52);
    p.part(H.flap, C.mouth, { lw: 1.4, ol: C.ink });
    p.detail('<path d="' + H.tongue + '" fill="' + (C.tongue || '#c44c58') + '" stroke="' + C.ink + '" stroke-width="1"/>');
    var lt = H.lowT;
    p.detail(K.teethRow(lt[0], lt[1], lt[2], lt[3], lt[4], lt[5], lt[6], -1));
    p.part(H.jaw, C.body, K.flat({ belly: H.jawBelly, bellyFill: C.lip || C.belly, auto: K.auto(1.8, 2.8, 0.6) }));
    p.close();
    var ut = H.upT;
    p.detail(K.teethRow(ut[0], ut[1], ut[2], ut[3], ut[4], ut[5], ut[6], 1));
    p.part(H.skull, C.body, K.flat({
      belly: H.skullBelly, bellyFill: C.lip || C.body,
      inner: '<path d="' + H.dorsal + '" fill="none" stroke="' + C.dark + '" stroke-width="8" stroke-linecap="round" opacity="0.7"/>' +
        pattern(K, C, o.pattern, 'head') +
        '<ellipse cx="' + H.fossa[0] + '" cy="' + H.fossa[1] + '" rx="8" ry="3.6" transform="rotate(10 ' + H.fossa[0] + ' ' + H.fossa[1] + ')" fill="' + C.ink + '" opacity="0.18"/>' +
        K.lines('M131 40 C134 46 138 50 144 51', 1.2, 0.5) + (o.scar ? '<path d="' + o.scar + '" stroke="' + (C.scar || '#f0c9a0') + '" stroke-width="1.2" stroke-linecap="round" opacity="0.9"/>' : ''),
      auto: K.auto(3.2, 4.6, 0.75)
    }));
    // 目・まゆの骨・飾り
    var ex = H.eye[0], ey = H.eye[1];
    if (!p.sil) {
      p.raw('<ellipse cx="' + (ex - 0.6) + '" cy="' + (ey - 1) + '" rx="10" ry="6" fill="' + C.ink + '" opacity="0.35"/>');
    }
    p.raw(K.eye(Object.assign({ x: ex, y: ey, rx: 3.6, ry: 2.8, iris: C.eye, pupil: 'slit' }, o.eye || {})));
    if (!p.sil) {
      p.raw('<path d="' + H.brow + '" fill="' + C.dark + '" stroke="' + C.ink + '" stroke-width="1" stroke-linejoin="round"/>');
      p.raw('<ellipse cx="' + H.nostril[0] + '" cy="' + H.nostril[1] + '" rx="2.2" ry="1.2" transform="rotate(20 ' + H.nostril[0] + ' ' + H.nostril[1] + ')" fill="' + C.ink + '"/>');
    }
    if (o.head === 'long' && o.horn) {
      p.part('M163 22 C164.6 16 168.6 12 173.6 11 C173.4 15 171.6 19.4 168.6 23 Z', C.dark, { lw: 1.2, ol: C.ink, ink: true });
      p.detail(K.spots([[178, 22.6, 2, 1.2, 20], [184, 24.4, 1.8, 1.1, 22], [189, 27, 1.6, 1, 30]], C.dark, 1));
    }
    if (o.head === 'long' && o.ridge) p.detail(K.spots([[166, 20.6, 2.2, 1.3], [174, 21.4, 2.2, 1.3], [182, 23.6, 2, 1.2], [188, 26.4, 1.8, 1.1]], C.dark, 1));
    if (o.head === 'croc' && o.crestTop) p.part('M154 25 C158 18 168 17 173 22 C168 24 162 25.6 158 27.4 Z', C.accent, { lw: 1.2, ol: C.ink, ink: true });
    if (o.head === 'bull') {
      p.part('M143 22 C140 14 134 9 126 8 C130 13 134 19 137 26 Z', C.hornFar || C.shade, { lw: 1.4, ol: C.ink, ink: true });
      p.part('M152 21 C151 12 147 6 140 2 C142 9 144 16 146 24 Z', C.horn, K.flat({ lw: 1.6, auto: K.auto(1, 1.2, 0.5) }));
    }
    if (o.head === 'crest') {
      p.part('M146 30 C148 16 160 6 176 8 C172 13 166 20 162 30 Z', C.accent, K.flat({ lw: 1.8, inner: K.lines('M150 28 C153 18 162 12 172 10', 1.2, 0.6, C.stripe), auto: K.auto(1.2, 1.6, 0.5) }));
      p.stroke('M184 45.6 C185 43 186.4 42 188 42', 1.4, C.ink);
    }
    if (o.head === 'rex' && o.hornsEX) {
      p.part('M150 22 C158 12 174 4 194 2 C182 10 170 18 160 26 Z', C.horn, K.flat({ lw: 1.8, inner: '<path d="M152 24 C162 14 176 7 194 2 L194 6 L154 26 Z" fill="' + (C.hornShade || '#c9b58c') + '"/>' }));
      p.part('M186 22 C188 16 191 12 195 10 C195 15 193 19 191 23 Z', C.horn, { lw: 1.4, ol: C.ink, ink: true });
    }
    p.close();
  }

  /** 大型の肉食。o = { C 色, head, slim, sail, arm: 'small'|'big', pattern, eye, scar, horn, ridge, crestTop, frill, hornsEX } */
  LIB.bigTheropod = function (p, o) {
    var C = o.C, K = DN.artKit(p, C, o.lw || 2.5);
    var BODY = o.slim ? BIG.bodySlim : BIG.body;

    // 奥の脚
    p.open('p-legB', 72, 72);
    p.part(BIG.legB, C.far, K.flat({ inner: K.lines('M64 96 C72 102 84 102 92 96', 1.1, 0.5), auto: K.auto(3.5, 4.5, 0.8, C.farShade) }));
    p.detail(K.claw(84, 145, 1) + K.claw(76, 145.4, 0.85));
    p.close();
    // 奥の腕
    if (o.arm !== 'none') {
      p.open('p-armB', 118, 88);
      var ab = o.arm === 'big' ? BIG.armBig : BIG.armB;
      p.raw(o.arm === 'small' ? '<g transform="translate(118 88) scale(0.6) translate(-118 -88)">' : o.arm === 'big' ? '<g transform="translate(-6 3)">' : '<g>');
      p.part(ab, C.farShade, { lw: 1.8, ol: C.ink, ink: true });
      p.raw('</g>');
      p.close();
    }
    // 帆（スピノサウルス）：背中の後ろ
    if (o.sail) {
      p.open('p-body', 96, 100);
      p.part('M66 56 C66 34 78 12 98 8 C118 5 132 22 134 44 C128 46 120 48 110 48 C96 47 80 50 66 56 Z', C.sail || C.accent, K.flat({
        inner: K.lines('M76 52 C76 40 80 26 86 16 M88 49 C88 36 92 22 98 10 M100 48 C102 34 106 20 110 10 M112 48 C114 36 118 24 122 16 M122 46 C124 38 126 30 128 24', 1.4, 0.5, C.stripe) +
          '<path d="M68 50 C68 32 80 14 98 11 C116 9 128 24 131 42" fill="none" stroke="' + (C.sailEdge || '#ffd060') + '" stroke-width="4" opacity="0.8"/>',
        auto: K.auto(2.4, 3.2, 0.5, C.shade)
      }));
      p.close();
    }
    // しっぽ
    p.open('p-tail', 78, 64);
    p.part(BIG.tail, C.body, K.flat({
      belly: 'M86 80 C74 70 58 60 40 52 C28 47 16 43 4 41 L0 90 L90 90 Z',
      inner: '<path d="M0 37 C30 40 60 43 90 47" fill="none" stroke="' + C.dark + '" stroke-width="10" stroke-linecap="round" opacity="0.7"/>' + pattern(K, C, o.pattern, 'tail'),
      auto: K.auto(2.4, 3.6)
    }));
    p.close();
    // 胴と首
    p.open('p-body', 96, 100);
    p.part(BODY, C.body, K.flat({
      joinWith: [BIG.tail],
      belly: 'M156 44 C152 60 146 74 138 86 C130 98 116 106 100 107 C90 108 82 105 76 100 L70 140 L170 140 Z',
      inner: '<path d="M58 56 C70 46 90 43 110 46 C120 47 128 42 136 32" fill="none" stroke="' + C.dark + '" stroke-width="15" stroke-linecap="round" opacity="0.7"/>' +
        pattern(K, C, o.pattern, 'body') +
        K.lines('M140 52 C144 58 145 64 144 70 M134 56 C138 62 139 68 138 74', 1.1, 0.45) +
        (o.bumps ? K.spots([[92, 60, 1.6], [104, 58, 1.6], [116, 60, 1.6], [98, 70, 1.4], [110, 70, 1.4], [124, 58, 1.4], [132, 50, 1.4]], C.bumps || '#f0d8b0', 0.8) : ''),
      after: '<path d="M126 44 C136 54 146 60 152 56 L154 40 Z" fill="' + C.ink + '" opacity="0.3"/>',
      auto: K.auto(5.5, 7.5, 0.7)
    }));
    p.close();
    // 手前の脚
    p.open('p-legF', 76, 72);
    p.part(BIG.legF, C.body, K.flat({
      inner: '<path d="M54 66 C66 52 92 48 104 64" fill="none" stroke="' + C.dark + '" stroke-width="9" stroke-linecap="round" opacity="0.6"/>' +
        pattern(K, C, o.pattern, 'leg') +
        K.lines('M66 94 C74 104 88 108 100 104', 1.3, 0.55) + K.lines('M94 124 l3 -2 M99 128 l3 -2 M104 131 l3 -1.8 M109 134 l3 -1.6', 0.9, 0.5) +
        K.lines('M112 138 C113 141 113 144 113 146 M102 135 C102 139 103 143 103 146', 1, 0.5),
      auto: K.auto(4.5, 5.5)
    }));
    p.detail(K.claw(124, 145) + K.claw(114, 145.6, 0.9) + K.claw(104, 145.8, 0.8) + K.claw(86, 139, 0.6));
    p.close();
    // 頭
    drawHead(p, K, C, o);
    // 手前の腕
    if (o.arm !== 'none') {
      p.open('p-armF', 126, 86);
      p.raw(o.arm === 'small' ? '<g transform="translate(124 86) scale(0.6) translate(-124 -86)">' : '<g>');
      if (o.arm === 'big') {
        p.part(BIG.armBig, C.body, K.flat({ lw: 2, auto: K.auto(1.6, 2.2) }));
        p.detail('<path d="M143 99 C149 96 156 98 158 104 C153 102 148 102 144 103.6 Z" fill="' + C.claw + '" stroke="' + C.ink + '" stroke-width="1" stroke-linejoin="round"/>' + K.claw(139.6, 106.4, 0.6));
      } else {
        p.part(BIG.armF, C.body, K.flat({ lw: 1.9, auto: K.auto(1.6, 2.2) }));
        p.detail(K.claw(138.6, 99.6, 0.55) + K.claw(133.4, 104.4, 0.55));
      }
      p.raw('</g>');
      p.close();
    }
  };

  function big(id, o) {
    CUSTOM[id] = function (p) { LIB.bigTheropod(p, o); };
    CUSTOM[id].box = [124, 4, 78];
    CUSTOM[id].rig = HEADS[o.head].rig;
  }

  big('giga', { head: 'long', ridge: true, pattern: 'bands', scar: 'M168 28 l6 8 M172 26.6 l6 8',
    eye: { iris: '#c8ff5a', glow: '#b8ff40' },
    C: { body: '#8c8474', shade: '#5e574a', dark: '#4a443a', stripe: '#2e2a22', belly: '#eee6d0', lip: '#b4aa94', far: '#6a6356', farShade: '#4c463c',
      mouth: '#56141a', tongue: '#b8505a', claw: '#221a14', eye: '#c8ff5a', ink: '#1e1a14' } });
  big('allo', { head: 'long', horn: true, slim: true, pattern: 'tiger',
    eye: { iris: '#ff8a1a', white: true, pupil: 'round', pr: 0.55, rx: 3.4, ry: 3 },
    C: { body: '#c68c48', shade: '#8e5a26', dark: '#7a4a1e', stripe: '#5a2c10', belly: '#f6e2b8', lip: '#d8a66a', far: '#9a6a34', farShade: '#6e4a22',
      mouth: '#5e1418', tongue: '#c8505a', claw: '#261610', eye: '#ff8a1a', ink: '#2a160a' } });
  big('carno', { head: 'bull', arm: 'small', slim: true, pattern: 'none', bumps: true,
    eye: { iris: '#ff3a2a', glow: '#ff5a3a' },
    C: { body: '#b8402c', shade: '#7a2416', dark: '#6a1c10', stripe: '#3a0e08', belly: '#f2d4aa', lip: '#c86a4a', far: '#8a2e1e', farShade: '#5e1c12',
      mouth: '#4a0c10', tongue: '#c44c58', horn: '#2e1a14', hornFar: '#1e100c', claw: '#1e100c', bumps: '#f4c89a', eye: '#ff3a2a', ink: '#240c06' } });
  big('spino', { head: 'croc', sail: true, crestTop: true, pattern: 'spots', lw: 2.4,
    eye: { iris: '#ffe24a', white: false, pupil: 'round', pr: 0.5, rx: 3, ry: 2.6 },
    C: { body: '#4e7c8e', shade: '#2e5060', dark: '#23404c', stripe: '#16303a', belly: '#e8e4c8', lip: '#8ab0b8', far: '#3a6070', farShade: '#284654',
      sail: '#e0582c', sailEdge: '#ffd050', accent: '#e0582c', mouth: '#4e1418', tongue: '#c8505a', claw: '#161c20', eye: '#ffe24a', ink: '#0e1c22' } });
  big('baryonyx', { head: 'croc', arm: 'big', slim: true, pattern: 'tiger',
    eye: { iris: '#e8f07a', white: true, pupil: 'round', pr: 0.55, rx: 3, ry: 2.6 },
    C: { body: '#5c7c58', shade: '#34503a', dark: '#2e4a32', stripe: '#1c3020', belly: '#e6ecd0', lip: '#9ab48a', far: '#48664a', farShade: '#324a36',
      mouth: '#4e1418', tongue: '#c8505a', claw: '#1c1a14', eye: '#e8f07a', ink: '#12200e' } });
  big('dilo', { head: 'crest', slim: true, pattern: 'spots', lw: 2.3,
    eye: { iris: '#6aff5a', pupil: 'slit', glow: '#6aff5a' },
    C: { body: '#8ca444', shade: '#5a6e24', dark: '#4a5c1c', stripe: '#2e3a10', belly: '#f2eebc', lip: '#bcc47a', far: '#6e8434', farShade: '#4e6024',
      accent: '#e8582a', crestFar: '#a83a1c', mouth: '#56141a', tongue: '#c8505a', claw: '#1e1a0e', eye: '#6aff5a', ink: '#1c220a' } });
  big('tyranoceras', { head: 'rex', hornsEX: true, pattern: 'tiger', lw: 2.6,
    frill: '#3a2a5a',
    eye: { iris: '#ffe066', glow: '#ffd23a', rx: 3.8, ry: 2.8 },
    C: { body: '#3e2e52', shade: '#241a34', dark: '#1e1430', stripe: '#ffcf40', belly: '#ecdca4', lip: '#6a5484', far: '#2e2240', farShade: '#1c1428',
      horn: '#fff2c8', hornShade: '#d8b870', mouth: '#4a0c20', tongue: '#d85a78', claw: '#ffcf40', eye: '#ffe066', ink: '#120a1c', scar: '#ffcf40' } });

  // ================= 小型の肉食 =================
  var SMALL = {
    legF: 'M76 80 C78 68 96 66 102 78 C106 88 104 98 100 104 C96 110 92 114 90 118 C94 124 100 132 106 137 C109 140 111 142 112 144 L112 146 L91 146 C89 144 88 141 88 137 C88 131 87 126 86 120 C79 113 74 97 76 80 Z',
    legB: 'M64 78 C66 66 84 64 89 76 C92 86 90 95 86 101 C80 107 74 111 68 115 C70 123 74 131 78 137 C80 140 82 143 83 146 L65 146 C63 144 62 141 62 138 C61 132 60 126 60 120 C57 110 59 93 64 78 Z',
    tail: 'M90 64 C70 62 40 60 14 58 C8 57.6 3 58.4 2 60 C4 62 9 63 15 63.4 C40 66 64 72 86 84 Z',
    body: 'M78 70 C86 60 104 58 118 62 C124 62 130 60 134 56 L142 48 L154 62 C148 68 142 76 136 84 C130 92 120 99 106 100 C93 101 83 97 77 89 C73 83 72 76 78 70 Z'
  };

  /** 小型の肉食。o = { C, feathers, sickle, pattern: 'stripes'|'spots', eye, big（頭を大きめに） } */
  LIB.smallTheropod = function (p, o) {
    var C = o.C, K = DN.artKit(p, C, 2.2);
    var pat = o.pattern === 'spots'
      ? function (w) {
        if (w === 'tail') return K.spots([[26, 60, 1.6], [38, 61, 1.8], [50, 62.4, 2], [62, 64, 2.2], [74, 67, 2.2]], C.stripe, 0.8);
        if (w === 'body') return K.spots([[92, 66, 2.6, 1.8], [104, 64, 2.6, 1.8], [116, 66, 2.4, 1.6], [98, 76, 2, 1.4], [110, 76, 2, 1.4], [128, 62, 2, 1.4]], C.stripe, 0.8);
        return K.spots([[86, 76, 2.2, 1.6], [94, 86, 1.8, 1.3]], C.stripe, 0.8);
      }
      : function (w) {
        if (w === 'tail') return K.stripe(24, 60, 3, -1, 2.4) + K.stripe(36, 60.6, 4, -1, 2.8) + K.stripe(48, 61.2, 5, -1.2, 3.2) + K.stripe(60, 62, 6, -1.4, 3.6) + K.stripe(72, 63, 8, -1.6, 4);
        if (w === 'body') return K.rot(6, 90, 64, K.stripe(90, 64, 10, -2, 4)) + K.rot(0, 101, 62, K.stripe(101, 62, 12, -2, 4.4)) + K.rot(-6, 112, 62, K.stripe(112, 62, 11, -1.6, 4.2)) + K.rot(-30, 124, 60, K.stripe(124, 60, 8, -1, 3.6));
        return K.rot(20, 86, 72, K.stripe(86, 72, 9, -2, 3.6));
      };

    // しっぽ（羽の房）
    p.open('p-tail', 82, 74);
    if (o.feathers) p.part('M20 58 L2 50 L9 57 L-3 59 L9 62 L1 70 L22 64 Z', C.feather, { lw: 1.6, ol: C.ink, ink: true });
    p.part(SMALL.tail, C.body, K.flat({
      belly: 'M90 80 C70 72 44 66 12 62 L0 90 L92 90 Z',
      inner: '<path d="M0 58 C30 60 60 61 92 64" fill="none" stroke="' + C.dark + '" stroke-width="6" stroke-linecap="round" opacity="0.6"/>' + pat('tail'),
      auto: K.auto(1.6, 2.4)
    }));
    p.close();
    // 奥の脚
    p.open('p-legB', 76, 76);
    p.part(SMALL.legB, C.far, K.flat({ auto: K.auto(2.6, 3.4, 0.8, C.farShade), inner: K.lines('M64 98 C70 104 80 104 86 99', 1, 0.45) }));
    p.detail(K.claw(83, 145, 0.8) + K.claw(77, 145.4, 0.7));
    if (o.sickle) p.detail('<path d="M69 138 C68 131 74 128 79 131 C75 131 72 133 71 139 Z" fill="' + C.claw + '" stroke="' + C.ink + '" stroke-width="0.9"/>');
    p.close();
    // 奥の腕
    p.open('p-armB', 118, 80);
    if (o.feathers) p.part('M114 82 C118 90 124 96 130 99 L126 103 L122 99 L118 102 L115 97 L111 98 Z', C.featherDark, { lw: 1.4, ol: C.ink, ink: true });
    p.part('M116 78 C122 79 127 84 130 90 L135 93 C136 95 134 97 132 96 L129 95 L130 99 C129 101 126 100 126 98 L124 94 C120 90 116 86 116 78 Z', C.farShade, { lw: 1.6, ol: C.ink, ink: true });
    p.close();
    // 胴と首
    p.open('p-body', 104, 96);
    p.part(SMALL.body, C.body, K.flat({
      joinWith: [SMALL.tail],
      belly: 'M158 58 C150 70 142 82 132 92 C122 99 108 102 94 99 L90 130 L170 130 Z',
      inner: '<path d="M72 68 C88 58 110 57 124 60 C132 58 138 52 144 46" fill="none" stroke="' + C.dark + '" stroke-width="9" stroke-linecap="round" opacity="0.65"/>' + pat('body') +
        (o.feathers ? '<path d="M92 60 l-3 -4 l5 2 l-1 -5 l5 4 l0 -5 l4 5 l2 -5 l3 6 l3 -5 l2 6 l4 -4 l0 6 Z" fill="' + C.feather + '" opacity="0.9"/>' : '') +
        K.lines('M140 66 C142 70 142 74 140 78', 1, 0.4),
      auto: K.auto(3, 4.4, 0.7)
    }));
    p.close();
    // 手前の脚
    p.open('p-legF', 88, 76);
    p.part(SMALL.legF, C.body, K.flat({
      inner: pat('leg') + K.lines('M80 100 C86 106 96 107 101 102', 1.1, 0.5) + K.lines('M94 124 l2.4 -1.6 M98 128 l2.4 -1.6 M102 132 l2.4 -1.4', 0.8, 0.5),
      auto: K.auto(3, 3.8)
    }));
    p.detail(K.claw(111, 145, 0.85) + K.claw(104, 145.6, 0.75));
    if (o.sickle) p.detail('<path d="M92 138 C90 128 98 122 106 126 C100 126 96 130 95 139 Z" fill="' + C.claw + '" stroke="' + C.ink + '" stroke-width="1" stroke-linejoin="round"/>');
    else p.detail(K.claw(96, 145.8, 0.7));
    p.close();
    // 頭
    p.open('p-head', 144, 58);
    p.part('M150 60 L195 58 L186 68 L150 66 Z', C.mouth, { lw: 1.2, ol: C.ink });
    p.open('p-jaw', 148, 62);
    p.part('M148 62 L186 71 L190 56 L152 54 Z', C.mouth, { lw: 1.2, ol: C.ink });
    p.detail('<path d="M152 64 C162 65 172 67 180 70 C172 71 160 69 153 67 Z" fill="#c44c58" stroke="' + C.ink + '" stroke-width="0.8"/>');
    p.detail(K.teethRow(155, 64.4, 182, 70.2, 6, 2.6, 3.2, -1));
    p.part('M147 61 L186 70.6 C189 71.4 189.6 74 187 75.4 L163 77 C154 77.4 148 71 147 61 Z', C.body, K.flat({ lw: 1.9, belly: 'M140 74 L196 72 L196 86 L140 86 Z', bellyFill: C.belly, auto: K.auto(1, 1.6, 0.5) }));
    p.close();
    p.detail(K.teethRow(153, 59.6, 191, 58.2, 8, 2.6, 3.6, 1));
    p.part('M138 52 C141 45 150 42 160 43 C172 44 184 48 194 53 C198 55 198 58 195 59.4 L166 60.6 L152 62 C146 62 140 58 138 52 Z', C.body, K.flat({
      lw: 2,
      inner: '<path d="M136 48 C150 40 176 44 198 54" fill="none" stroke="' + C.dark + '" stroke-width="5" stroke-linecap="round" opacity="0.6"/>' +
        '<ellipse cx="172" cy="52" rx="6" ry="2.4" fill="' + C.ink + '" opacity="0.15"/>',
      auto: K.auto(1.8, 2.6, 0.7)
    }));
    if (o.feathers) p.part('M141 46 L130 38 L138 44 L131 34 L143 42 L140 33 L148 43 Z', C.feather, { lw: 1.4, ol: C.ink, ink: true });
    if (o.crest) p.part('M146 45 C150 38 160 36 168 40 C162 42 156 44 150 47 Z', C.accent, { lw: 1.2, ol: C.ink, ink: true });
    p.raw(K.eye(Object.assign({ x: 157, y: 50, rx: 3.4, ry: 2.6, iris: C.eye, pupil: 'slit' }, o.eye || {})));
    if (!p.sil) {
      p.raw('<path d="M151.4 47.6 C155 45.4 160 45.4 164 47.8 L164.4 49.4 C160 48 156 48.2 152 50 Z" fill="' + C.dark + '" stroke="' + C.ink + '" stroke-width="0.9" stroke-linejoin="round"/>');
      p.raw('<path d="M190 52.6 C191.4 51.8 193.4 52 194 53.2 C192.8 53.8 191.2 53.8 190 52.6 Z" fill="' + C.ink + '"/>');
    }
    p.close();
    // 手前の腕
    p.open('p-armF', 128, 80);
    if (o.feathers) p.part('M123 80 C129 86 135 90 141 92 L139 97 L136 95 L135 101 L131 97 L129 103 L126 97 L122 101 L121 94 L117 96 Z', C.feather, K.flat({
      lw: 1.5, inner: K.lines('M127 88 L126 98 M132 91 L131 100 M137 92 L136 97', 1, 0.6, C.featherDark)
    }));
    p.part('M124 78 C131 79 136 84 139 90 L145 93 C146.6 95 145 97.4 143 96.6 L139.6 95 L140.6 99 C140 101.4 137 101 136.6 99 L134.6 94.6 C130 91 125 86 124 78 Z', C.body, K.flat({ lw: 1.7, auto: K.auto(1.4, 2) }));
    p.detail(K.claw(144.6, 95.4, 0.5) + K.claw(139.6, 99.4, 0.5));
    p.close();
  };

  function small(id, o) {
    CUSTOM[id] = function (p) { LIB.smallTheropod(p, o); };
    CUSTOM[id].box = [132, 30, 66];
    CUSTOM[id].rig = { jawOpen: 12, jawClose: -14 };
  }

  small('deinony', { feathers: true, sickle: true, pattern: 'stripes', eye: { iris: '#ff4a2a', glow: '#ff5a3a' },
    C: { body: '#6c6c74', shade: '#3e3e46', dark: '#34343c', stripe: '#1e1e24', belly: '#e8e8e2', far: '#52525a', farShade: '#3a3a40',
      feather: '#d83a2a', featherDark: '#8a1e16', mouth: '#5a1418', claw: '#18141a', eye: '#ff4a2a', ink: '#141418' } });
  small('utah', { feathers: true, sickle: true, pattern: 'stripes', eye: { iris: '#ffb21e', glow: '#ffcc40', rx: 3.8, ry: 2.8 },
    C: { body: '#6c5c8e', shade: '#403460', dark: '#3a2e56', stripe: '#221a38', belly: '#ece4f4', far: '#54467a', farShade: '#3a3056',
      feather: '#f0a030', featherDark: '#b0661a', mouth: '#56141e', claw: '#1a1426', eye: '#ffb21e', ink: '#140e22' } });
  small('coelo', { feathers: false, sickle: false, crest: true, pattern: 'stripes', eye: { iris: '#ff7a1a', white: true, pupil: 'round', pr: 0.55, rx: 3.2, ry: 2.8 },
    C: { body: '#dab04a', shade: '#a07a24', dark: '#8a5a1a', stripe: '#6a3e10', belly: '#faeec4', far: '#b08a34', farShade: '#86661e',
      accent: '#e05a2a', mouth: '#5e161a', claw: '#221608', eye: '#ff7a1a', ink: '#2a1a08' } });
  small('compy', { feathers: false, sickle: false, pattern: 'spots', eye: { iris: '#3a2a10', white: true, pupil: 'round', pr: 0.7, rx: 3.8, ry: 3.6 },
    C: { body: '#7aaa4c', shade: '#4a7428', dark: '#3a5a1c', stripe: '#2a4412', belly: '#f0f6cc', far: '#5e8a3a', farShade: '#446828',
      mouth: '#5a161a', claw: '#1a220e', eye: '#3a2a10', ink: '#16220a' } });
  // ヘレラサウルス：三畳紀の古い肉食。大型の骨格を細身に、頭は長め
  big('herrera', { head: 'long', slim: true, pattern: 'spots',
    eye: { iris: '#ffcc3a', white: true, pupil: 'round', pr: 0.5, rx: 3.2, ry: 2.8 },
    C: { body: '#aa5a3a', shade: '#723620', dark: '#6a2e18', stripe: '#46180a', belly: '#f2d6b2', lip: '#c8805e', far: '#86442a', farShade: '#5e2e1a',
      mouth: '#56141a', tongue: '#c8505a', claw: '#221008', eye: '#ffcc3a', ink: '#240e06' } });
})(window);
