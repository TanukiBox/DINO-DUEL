/*
 * DINO DUEL 描きこみ版：空と海（プテラノドン・エラスモサウルス以外）
 *   翼竜（pterosaur）：ケツァルコアトルス（長い首と大きな頭）/ タペヤラ（帆のようなトサカ）/ ランフォリンクス（長いしっぽとひし形の先）/ ディモルフォドン（大きな頭）
 *   海：モササウルス（トカゲのような体としっぽのひれ）/ リオプレウロドン（大きな頭と4枚のひれ）/ イクチオサウルス（イルカのような体）/ ノトサウルス（細長いあご）
 *   リヴァイアウイング（EX：モササウルスの体に翼）
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};
  var CUSTOM = DN.ART_CUSTOM = DN.ART_CUSTOM || {};

  // ================= 翼竜 =================
  function pterosaur(p, o) {
    var C = o.C, K = DN.artKit(p, C, 2.2), big = o.big || 1;
    p.raw('<g transform="translate(0 -8)">');
    // 奥の翼（高く振り上げる）
    p.open('p-wingB', 104, 68);
    p.part('M100 66 C92 48 76 28 52 8 C68 12 84 18 98 26 C104 38 108 52 110 66 Z', C.wingFar, K.flat({
      lw: 2, inner: K.lines('M100 64 C94 46 80 28 56 10', 1.6, 0.7, C.bone) + K.lines('M104 60 C100 46 94 36 86 26 M106 52 C104 44 102 38 98 32', 0.9, 0.5, C.vein),
      auto: K.auto(2, 2.6, 0.6, C.wingDark)
    }));
    p.close();
    // しっぽ（ランフォリンクス・ディモルフォドン）
    if (o.tail) {
      p.open('p-tail', 80, 76);
      p.part('M82 74 C64 78 44 82 24 86 L24 89 C44 86 64 82 84 80 Z', C.body, { lw: 1.6, ol: C.ink, ink: true });
      p.part('M26 87 L14 78 L4 88 L14 98 Z', o.vane || C.accent, K.flat({ lw: 1.6, inner: K.lines('M14 80 L14 96', 1, 0.5, C.dark) }));
      p.close();
    }
    // 脚
    p.open('p-legF', 84, 82);
    p.part('M86 80 C82 86 76 92 68 96 L64 94 C70 90 76 84 80 78 Z', C.dark, { lw: 1.6, ol: C.ink, ink: true });
    p.detail(K.claw(64, 95, 0.5, C.claw, true) + K.claw(66, 97, 0.5, C.claw, true));
    p.close();
    // 胴
    var BODY = 'M78 70 C84 62 100 60 112 64 C120 66 124 72 120 78 C112 84 96 86 86 84 C80 82 76 76 78 70 Z';
    p.open('p-body', 98, 76);
    p.part(BODY, C.body, K.flat({
      belly: 'M72 80 C90 78 108 76 128 72 L128 96 L72 96 Z',
      inner: '<path d="M78 66 C90 60 106 60 118 66" fill="none" stroke="' + C.dark + '" stroke-width="5" stroke-linecap="round" opacity="0.5"/>' + K.lines('M86 72 l2 4 M92 70 l2 4 M98 69 l2 4 M104 69 l2 4', 0.8, 0.3),
      auto: K.auto(2, 2.8, 0.7)
    }));
    p.close();
    // 頭
    p.open('p-head', 118, 64);
    o.head(p, K, C, BODY);
    p.close();
    // 手前の翼
    p.open('p-wingF', 104, 70);
    p.raw('<g transform="translate(104 70) scale(' + big + ') translate(-104 -70)">');
    p.part('M106 70 L84 58 C64 66 38 80 6 100 C18 98 28 96 38 97 C46 93 54 92 62 94 C70 90 78 88 86 88 C94 84 100 78 106 74 Z', C.wing, K.flat({
      inner: '<path d="M106 70 L84 58 C64 66 38 80 6 100" fill="none" stroke="' + C.bone + '" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>' +
        K.lines('M84 60 C80 70 76 80 74 88 M76 64 C68 74 62 84 58 93 M64 70 C54 80 46 88 40 96 M50 78 C40 86 32 92 24 97', 1, 0.5, C.vein) +
        '<path d="M6 100 C18 98 28 96 38 97 C46 93 54 92 62 94 C70 90 78 88 86 88 C94 84 100 78 106 74 L106 104 L0 104 Z" fill="' + C.wingDark + '" opacity="0.3"/>',
      auto: K.auto(2.2, 3, 0.45, C.wingDark)
    }));
    p.detail(K.claw(84, 57, 0.6) + K.claw(87, 58.6, 0.5));
    p.raw('</g>');
    p.close();
    p.raw('</g>');
    p.raw('<ellipse cx="92" cy="146" rx="42" ry="3.6" fill="#000" opacity="0.14"/>');
  }
  var NECK_SHORT = 'M110 64 C116 58 124 56 132 58 L130 67 C124 67 118 69 114 73 Z';

  CUSTOM.quetzal = function (p) {
    pterosaur(p, {
      big: 1.12,
      C: { body: '#e2e0d6', shade: '#9a988c', dark: '#8a887c', belly: '#f8f8f0', wing: '#c8a070', wingDark: '#8a6a44', wingFar: '#9a7a52', vein: '#7a5a34', bone: '#6a4a2a',
        accent: '#d8382c', beak: '#e8c060', beakDark: '#b88a30', claw: '#2b1510', eye: '#ffd23a', ink: '#221a10' },
      head: function (p, K, C, BODY) {
        // 長い首
        p.part('M108 68 C114 52 124 40 136 30 L145 36 C135 44 126 56 118 74 Z', C.body, K.flat({ joinWith: [BODY], lw: 2, auto: K.auto(1.4, 2, 0.6) }));
        // 小さなとさか
        p.part('M142 25 C138 16 130 10 122 9 C126 16 132 22 139 28 Z', C.accent, { lw: 1.6, ol: C.ink, ink: true });
        // 下のくちばし・頭と長いくちばし
        p.part('M142 34 L199 46 C197 48 193 49 189 48 L152 42 C146 40 142 38 142 34 Z', C.beakDark, K.flat({ lw: 1.6 }));
        p.part('M134 30 C138 23 150 20 160 24 L200 43 C198 45 195 46 191 45 L156 38 C148 39 139 37 134 33 Z', C.body, K.flat({
          lw: 2, inner: '<path d="M154 26 L200 43 L200 46 L154 36 Z" fill="' + C.beak + '"/>', auto: K.auto(1.2, 1.8, 0.6)
        }));
        p.raw(K.eye({ x: 146, y: 27, rx: 2.4, ry: 2, iris: C.eye, pupil: 'slit', glow: '#ffd23a' }));
      }
    });
  };
  CUSTOM.quetzal.box = [110, 4, 90];

  CUSTOM.tapejara = function (p) {
    pterosaur(p, {
      C: { body: '#5c7c4c', shade: '#34502a', dark: '#34462a', belly: '#eef0d8', wing: '#8ab86a', wingDark: '#4e7a36', wingFar: '#5e8a44', vein: '#3a5a24', bone: '#2e4a1c',
        accent: '#e8403a', crest: '#e8403a', crestHi: '#ffd24a', beak: '#e8c86a', claw: '#1a2010', eye: '#ffe24a', ink: '#141c0c' },
      head: function (p, K, C, BODY) {
        p.part(NECK_SHORT, C.body, K.flat({ joinWith: [BODY], lw: 2, auto: K.auto(1.2, 1.8, 0.6) }));
        // 大きな帆のトサカ（上へ高く、うしろにも）
        p.part('M128 58 C116 48 104 44 92 46 C102 52 112 58 124 64 Z', C.crest, { lw: 1.6, ol: C.ink, ink: true });
        p.part('M134 54 C130 32 138 10 160 4 C152 18 152 36 156 52 Z', C.crest, K.flat({
          lw: 2, inner: K.lines('M140 50 C138 34 142 20 154 10 M148 52 C148 38 150 24 156 12', 1.4, 0.8, C.crestHi) + '<path d="M136 50 C134 32 142 14 158 6" fill="none" stroke="' + C.crestHi + '" stroke-width="3" opacity="0.8"/>',
          auto: K.auto(1.6, 2.2, 0.4, '#8a1a14')
        }));
        // 短く下へ曲がったくちばし
        p.part('M126 60 C130 52 142 50 152 52 L180 62 C174 68 162 70 150 68 C140 68 130 66 126 62 Z', C.beak, K.flat({ lw: 2, inner: '<path d="M126 58 C132 52 142 50 150 52 L152 60 L128 62 Z" fill="' + C.body + '"/>', auto: K.auto(1.2, 1.6, 0.5) }));
        p.raw(K.eye({ x: 140, y: 56, rx: 2.6, ry: 2.2, iris: C.eye, pupil: 'round', pr: 0.55 }));
      }
    });
  };
  CUSTOM.tapejara.box = [100, 4, 84];

  CUSTOM.rhampho = function (p) {
    pterosaur(p, {
      tail: true, big: 0.9,
      C: { body: '#8c6c4a', shade: '#5a4228', dark: '#4a3424', belly: '#f2e6d2', wing: '#c89868', wingDark: '#8a6440', wingFar: '#9a7450', vein: '#6a4a2a', bone: '#5a3a20',
        accent: '#e8b040', claw: '#2b1510', eye: '#ffb21e', tooth: '#fffaf0', ink: '#221408' },
      head: function (p, K, C, BODY) {
        p.part(NECK_SHORT, C.body, K.flat({ joinWith: [BODY], lw: 2, auto: K.auto(1.2, 1.8, 0.6) }));
        // 前向きの歯が並ぶ細長いくちばし
        p.detail(K.teethRow(150, 62.4, 184, 61, 6, 2.2, 3.6, 1));
        p.part('M126 58 C132 51 142 50 150 53 L192 60 C190 62 187 63 184 63 L150 64 C140 66 130 64 126 60 Z', C.body, K.flat({ lw: 2, belly: 'M140 60 L196 58 L196 70 L140 70 Z', bellyFill: '#e8b060', auto: K.auto(1.2, 1.8, 0.6) }));
        p.raw(K.eye({ x: 139, y: 55, rx: 2.8, ry: 2.4, iris: C.eye, white: true, pupil: 'round', pr: 0.6 }));
      }
    });
  };
  CUSTOM.rhampho.box = [112, 30, 80];

  CUSTOM.dimorpho = function (p) {
    pterosaur(p, {
      tail: true, vane: '#e8c040',
      C: { body: '#3c3c48', shade: '#22222c', dark: '#1e1e28', belly: '#e8e0d0', wing: '#6c6c7c', wingDark: '#3e3e4c', wingFar: '#4c4c5a', vein: '#2a2a36', bone: '#1c1c26',
        accent: '#e8c040', beak: '#e8c040', beakStripe: '#d8402a', claw: '#1a1a22', eye: '#ff5a2a', tooth: '#fffaf0', ink: '#0e0e14' },
      head: function (p, K, C, BODY) {
        p.part(NECK_SHORT, C.body, K.flat({ joinWith: [BODY], lw: 2, auto: K.auto(1.2, 1.8, 0.6) }));
        // 大きな頭（ツノメドリのような、色つきのくちばし）
        p.detail(K.teethRow(154, 66, 176, 64, 5, 2.6, 3.6, 1));
        p.part('M122 60 C124 46 138 40 152 42 C166 44 178 52 182 60 C178 66 168 70 156 70 C140 70 128 68 122 60 Z', C.body, K.flat({
          lw: 2.1, inner: '<path d="M156 44 C166 46 176 52 182 60 C178 66 168 70 156 70 Z" fill="' + C.beak + '"/>' + K.lines('M164 46 C166 54 166 62 164 69 M172 50 C174 56 174 62 172 67', 2.2, 0.8, C.beakStripe),
          auto: K.auto(1.4, 2, 0.6)
        }));
        p.raw(K.eye({ x: 142, y: 53, rx: 3.2, ry: 2.6, iris: C.eye, pupil: 'slit', glow: '#ff7a3a' }));
      }
    });
  };
  CUSTOM.dimorpho.box = [108, 26, 84];

  // ================= 海 =================
  function water(p) {
    if (p.sil) return;
    p.raw('<path d="M6 136 C22 130 38 130 54 136 C70 142 86 142 102 136 C118 130 134 130 150 136 C166 142 180 142 194 136" fill="none" stroke="#e8f8ff" stroke-width="4" stroke-linecap="round" opacity="0.95"/>');
    p.raw('<path d="M16 143 C32 139 48 139 64 143 M104 143 C120 139 136 139 152 143" fill="none" stroke="#9ad4f2" stroke-width="3" stroke-linecap="round" opacity="0.85"/>');
    p.raw('<circle cx="164" cy="128" r="2" fill="#e8f8ff"/><circle cx="170" cy="122" r="1.4" fill="#e8f8ff"/><circle cx="24" cy="128" r="1.6" fill="#e8f8ff"/>');
  }
  function flipper(p, K, C, d, fill, lines) {
    p.part(d, fill, K.flat({ lw: 2, inner: lines ? K.lines(lines, 1, 0.4) : '', auto: K.auto(1.6, 2.2, 0.7) }));
  }

  /** モササウルス型（トカゲのような長い体・大きな頭・しっぽのひれ）。o.wings でリヴァイアウイング */
  function mosasaur(p, o) {
    var C = o.C, K = DN.artKit(p, C, 2.4);
    var TAIL = 'M40 92 C28 90 18 86 8 80 C12 88 16 92 22 96 C14 104 8 112 6 122 C16 112 26 106 40 104 Z';
    var BODY = 'M30 98 C40 84 64 76 94 76 C120 76 140 82 152 90 C156 94 154 100 148 104 C128 112 98 116 70 114 C48 112 34 106 30 98 Z';
    // 奥のひれ
    p.open('p-finB', 100, 100);
    flipper(p, K, C, 'M122 100 C130 108 136 118 138 128 C132 124 124 116 116 106 Z', C.far);
    flipper(p, K, C, 'M60 104 C62 112 60 122 56 130 C52 122 50 114 52 106 Z', C.far);
    p.close();
    // 翼（EX）：背中から
    if (o.wings) {
      p.open('p-wingB', 104, 80);
      p.part('M96 80 C88 58 72 36 46 18 C66 22 86 30 102 40 C108 54 112 66 112 80 Z', C.wingFar, K.flat({ lw: 2, inner: K.lines('M98 78 C92 58 78 38 52 20', 1.6, 0.8, C.glow), auto: K.auto(2, 2.6, 0.5, C.shade) }));
      p.close();
    }
    p.open('p-tail', 40, 98);
    p.part(TAIL, C.body, K.flat({ inner: K.lines('M10 82 C18 88 26 92 36 94 M8 120 C16 112 24 106 36 102', 1.2, 0.5, C.dark), auto: K.auto(1.6, 2.2) }));
    p.close();
    p.open('p-body', 90, 110);
    p.part(BODY, C.body, K.flat({
      joinWith: [TAIL],
      belly: 'M24 104 C60 114 110 116 158 98 L158 130 L24 130 Z',
      inner: '<path d="M28 94 C44 82 72 74 100 76 C124 78 142 84 154 92" fill="none" stroke="' + C.dark + '" stroke-width="10" stroke-linecap="round" opacity="0.6"/>' +
        K.spots([[56, 86, 2.6, 1.8], [72, 82, 3, 2], [90, 80, 3, 2], [108, 82, 2.8, 1.8], [124, 86, 2.4, 1.6], [64, 96, 2, 1.4], [82, 92, 2.2, 1.4], [100, 92, 2, 1.4]], C.stripe, 0.6) +
        (o.glowLines ? '<path d="M34 100 C60 92 100 88 150 94" fill="none" stroke="' + C.glow + '" stroke-width="2.2" opacity="0.9"/>' : ''),
      auto: K.auto(3.6, 4.8, 0.6)
    }));
    // 背中の小さなひれ
    p.detail('<path d="M64 82 l4 -6 l4 5 l4 -6 l4 5 l4 -6 l4 5 l4 -6 l4 5 l4 -5 l4 5" fill="none" stroke="' + C.dark + '" stroke-width="1.8" stroke-linejoin="round"/>');
    p.close();
    p.open('p-legF', 60, 104);
    flipper(p, K, C, 'M66 104 C70 114 68 126 62 134 C56 126 54 116 56 106 Z', C.fin);
    p.close();
    // 頭（大きなあご）
    p.open('p-head', 146, 86);
    p.part('M150 86 L196 80 L190 92 L150 92 Z', C.mouth, { lw: 1.2, ol: C.ink });
    p.open('p-jaw', 148, 90);
    p.part('M148 90 L192 92 L196 80 L152 82 Z', C.mouth, { lw: 1.2, ol: C.ink });
    p.detail(K.teethRow(154, 91, 188, 92, 7, 3, 4.4, -1));
    p.part('M147 88 L192 92 C195 93 195 96 192 97.6 L166 100 C156 100 149 96 147 88 Z', C.body, K.flat({ lw: 2, belly: 'M140 95 L200 94 L200 106 L140 106 Z', auto: K.auto(1.2, 1.8, 0.5) }));
    p.close();
    p.detail(K.teethRow(152, 86.6, 192, 84.6, 8, 3.2, 5, 1));
    p.part('M138 80 C146 70 166 68 182 72 C194 75 200 80 198 84 C196 86 193 86 190 86 L168 87 L150 88 C144 88 138 86 138 80 Z', C.body, K.flat({
      lw: 2.2, belly: 'M134 84 L202 82 L202 96 L134 96 Z', bellyFill: C.lip || C.body,
      inner: '<path d="M138 76 C150 68 176 68 198 80" fill="none" stroke="' + C.dark + '" stroke-width="5" opacity="0.6"/>',
      auto: K.auto(1.8, 2.4, 0.6)
    }));
    p.raw(K.eye(Object.assign({ x: 160, y: 77, rx: 3, ry: 2.4, iris: C.eye, pupil: 'slit' }, o.eye || {})));
    if (!p.sil) p.raw('<path d="M154 74 C157.6 71.6 163 71.6 167 73.6 L167 75 C163 74 158 74.2 155 76 Z" fill="' + C.dark + '" stroke="' + C.ink + '" stroke-width="0.9"/>');
    p.close();
    // 前のひれ
    p.open('p-armF', 132, 102);
    flipper(p, K, C, 'M134 100 C144 108 150 120 150 132 C142 126 134 116 128 104 Z', C.fin, 'M136 106 C142 114 146 122 148 128');
    p.close();
    if (o.wings) {
      p.open('p-wingF', 110, 84);
      p.part('M114 84 L100 70 C80 70 56 76 28 92 C40 92 52 92 62 94 C72 92 84 92 94 94 C102 92 110 90 116 88 Z', C.wing, K.flat({
        inner: '<path d="M114 84 L100 70 C80 70 56 76 28 92" fill="none" stroke="' + C.glow + '" stroke-width="3" stroke-linecap="round"/>' + K.lines('M98 72 C92 80 88 88 86 94 M84 72 C76 80 70 88 66 94 M68 76 C58 82 50 88 44 92', 1, 0.6, C.glow),
        auto: K.auto(2, 2.6, 0.45, C.shade)
      }));
      p.close();
    }
    water(p);
  }

  CUSTOM.mosa = function (p) {
    mosasaur(p, {
      eye: { iris: '#ffe24a', glow: '#ffd23a' },
      C: { body: '#2c5c8c', shade: '#163a5a', dark: '#163a5a', stripe: '#0e2a44', belly: '#dce8f0', lip: '#5a86b0', far: '#1e4670', fin: '#2a5480',
        mouth: '#4a1018', eye: '#ffe24a', ink: '#081626' }
    });
  };
  CUSTOM.mosa.box = [136, 56, 64];
  CUSTOM.mosa.rig = { jawOpen: 16, jawClose: -8 };

  CUSTOM.leviawing = function (p) {
    mosasaur(p, {
      wings: true, glowLines: true,
      eye: { iris: '#8affff', glow: '#40e0ff' },
      C: { body: '#1c3c6c', shade: '#0e2240', dark: '#0e2240', stripe: '#40e0ff', belly: '#d8f0ff', lip: '#3a6aa0', far: '#142e54', fin: '#1a3a66',
        wing: '#3a7ac8', wingFar: '#2a5a9a', glow: '#8af0ff', mouth: '#3a0c20', eye: '#8affff', ink: '#060e1e' }
    });
  };
  CUSTOM.leviawing.box = [136, 56, 64];
  CUSTOM.leviawing.rig = { jawOpen: 16, jawClose: -8 };

  // リオプレウロドン：大きな頭・短い首・4枚の大きなひれ
  CUSTOM.liopleuro = function (p) {
    var C = { body: '#4c4c6c', shade: '#2a2a44', dark: '#2a2a44', stripe: '#1a1a30', belly: '#e0e0ec', lip: '#7a7a98', far: '#3a3a56', fin: '#44446a',
      mouth: '#4a1018', eye: '#ff5a3a', ink: '#0c0c18' };
    var K = DN.artKit(p, C, 2.4);
    var TAIL = 'M48 94 C34 96 20 100 6 106 C18 108 32 109 48 106 Z';
    var BODY = 'M40 96 C48 80 72 72 100 72 C124 72 140 80 146 90 C148 98 144 106 134 110 C116 118 88 120 64 116 C50 112 40 106 40 96 Z';
    p.open('p-finB', 100, 100);
    flipper(p, K, C, 'M120 100 C130 110 138 122 140 134 C132 128 122 118 114 106 Z', C.far);
    flipper(p, K, C, 'M62 104 C60 114 54 124 44 132 C44 122 48 112 54 104 Z', C.far);
    p.close();
    p.open('p-tail', 46, 100);
    p.part(TAIL, C.body, K.flat({ auto: K.auto(1.4, 2) }));
    p.close();
    p.open('p-body', 92, 110);
    p.part(BODY, C.body, K.flat({
      joinWith: [TAIL],
      belly: 'M34 104 C64 116 110 118 150 100 L150 130 L34 130 Z',
      inner: '<path d="M40 92 C52 78 80 70 106 72 C126 74 140 82 146 90" fill="none" stroke="' + C.dark + '" stroke-width="10" stroke-linecap="round" opacity="0.6"/>' +
        K.spots([[60, 86, 3, 2], [78, 80, 3.4, 2.2], [96, 78, 3.2, 2.2], [114, 80, 3, 2], [70, 96, 2.4, 1.6], [88, 92, 2.4, 1.6], [106, 92, 2.2, 1.4]], C.stripe, 0.6),
      auto: K.auto(3.6, 4.8, 0.6)
    }));
    p.close();
    p.open('p-legF', 64, 106);
    flipper(p, K, C, 'M70 104 C68 116 60 128 48 138 C46 128 52 116 60 106 Z', C.fin);
    p.close();
    p.open('p-head', 140, 84);
    p.part('M150 84 L196 76 L188 92 L150 92 Z', C.mouth, { lw: 1.2, ol: C.ink });
    p.open('p-jaw', 146, 90);
    p.part('M146 90 L190 92 L196 78 L152 80 Z', C.mouth, { lw: 1.2, ol: C.ink });
    p.detail(K.teethRow(152, 91, 186, 92, 6, 4, 6, -1));
    p.part('M144 88 L190 92 C194 93 194 97 190 99 L164 102 C152 102 146 96 144 88 Z', C.body, K.flat({ lw: 2.2, belly: 'M138 96 L200 94 L200 110 L138 110 Z', auto: K.auto(1.4, 2, 0.5) }));
    p.close();
    p.detail(K.teethRow(150, 85.4, 192, 82, 7, 4.4, 7, 1));
    p.part('M134 80 C140 66 162 62 180 66 C192 69 200 76 198 82 C196 84 193 84 190 84 L168 86 L148 88 C140 88 134 86 134 80 Z', C.body, K.flat({
      lw: 2.4, belly: 'M130 84 L202 80 L202 96 L130 96 Z', bellyFill: C.lip,
      inner: '<path d="M134 74 C146 64 176 64 198 78" fill="none" stroke="' + C.dark + '" stroke-width="6" opacity="0.6"/>',
      auto: K.auto(2, 2.8, 0.6)
    }));
    p.raw(K.eye({ x: 156, y: 73, rx: 3, ry: 2.6, iris: C.eye, pupil: 'round', pr: 0.55, glow: '#ff7a5a' }));
    if (!p.sil) p.raw('<path d="M150 70 C154 67.6 160 67.6 164 69.6 L164 71 C160 70 154.6 70.2 151 72 Z" fill="' + C.dark + '" stroke="' + C.ink + '" stroke-width="0.9"/>');
    p.close();
    p.open('p-armF', 128, 104);
    flipper(p, K, C, 'M132 102 C144 110 152 124 154 138 C144 130 134 118 126 106 Z', C.fin, 'M134 108 C142 116 148 126 150 134');
    p.close();
    water(p);
  };
  CUSTOM.liopleuro.box = [130, 52, 70];
  CUSTOM.liopleuro.rig = { jawOpen: 18, jawClose: -8 };

  // イクチオサウルス：イルカのような体・背びれ・三日月のしっぽ・大きな目
  CUSTOM.ichthyo = function (p) {
    var C = { body: '#5c8cb2', shade: '#345a7a', dark: '#2e5474', stripe: '#1a3a54', belly: '#eaf2f6', far: '#46749a', fin: '#4a7aa2', eye: '#2a1a10', ink: '#0c1a26' };
    var K = DN.artKit(p, C, 2.3);
    var TAIL = 'M44 92 C34 80 26 68 20 56 C30 64 38 74 44 84 C38 98 32 110 28 124 C36 116 44 106 50 98 Z';
    var BODY = 'M36 94 C50 78 80 70 110 72 C132 74 150 82 160 90 L198 88 L160 96 C146 104 120 110 92 110 C66 110 46 104 36 94 Z';
    p.open('p-finB', 110, 100);
    flipper(p, K, C, 'M112 100 C118 108 120 116 118 122 C112 116 108 110 106 102 Z', C.far);
    p.close();
    p.open('p-tail', 44, 94);
    p.part(TAIL, C.body, K.flat({ inner: K.lines('M24 60 C32 70 38 80 44 90 M30 120 C36 110 42 102 48 96', 1, 0.5, C.dark), auto: K.auto(1.6, 2.2) }));
    p.close();
    p.open('p-body', 96, 100);
    // 背びれ
    p.part('M86 74 C90 60 100 52 108 50 C106 60 104 68 104 76 Z', C.body, K.flat({ lw: 2, auto: K.auto(1.2, 1.6, 0.6) }));
    p.part(BODY, C.body, K.flat({
      joinWith: [TAIL],
      belly: 'M30 100 C60 108 110 108 164 94 L200 92 L200 130 L30 130 Z',
      inner: '<path d="M36 90 C54 76 86 70 116 72 C136 74 152 82 162 90" fill="none" stroke="' + C.dark + '" stroke-width="9" stroke-linecap="round" opacity="0.55"/>',
      auto: K.auto(3.2, 4.4, 0.6)
    }));
    p.detail(K.teethRow(166, 91.4, 194, 89, 7, 2, 2.4, 1) + K.lines('M160 92 L196 89', 1.2, 0.6));
    p.raw(K.eye({ x: 150, y: 86, rx: 4.6, ry: 4.2, iris: C.eye, white: true, pupil: 'round', pr: 0.75 }));
    p.close();
    p.open('p-armF', 126, 100);
    flipper(p, K, C, 'M128 100 C136 108 140 118 138 126 C130 120 124 110 122 102 Z', C.fin);
    p.close();
    water(p);
  };
  CUSTOM.ichthyo.box = [130, 60, 60];

  // ノトサウルス：細長いあごと針のような歯、少し長い首
  CUSTOM.notho = function (p) {
    var C = { body: '#6c8c5c', shade: '#3e5a30', dark: '#3a5230', stripe: '#24361a', belly: '#e8f0dc', far: '#54704a', fin: '#5a7a4c', mouth: '#4a1418', eye: '#ffcc3a', ink: '#101a0a' };
    var K = DN.artKit(p, C, 2.3);
    var TAIL = 'M46 94 C32 94 18 96 4 100 C16 104 30 106 48 104 Z';
    var BODY = 'M40 96 C48 84 70 78 96 80 C114 82 126 86 132 94 C128 106 110 112 88 112 C64 112 46 108 40 96 Z';
    p.open('p-finB', 100, 100);
    flipper(p, K, C, 'M104 100 C112 108 122 116 132 120 C124 120 114 114 100 106 Z', C.far);
    flipper(p, K, C, 'M58 102 C52 110 44 116 34 120 C38 112 46 106 52 100 Z', C.far);
    p.close();
    p.open('p-tail', 44, 100);
    p.part(TAIL, C.body, K.flat({ auto: K.auto(1.4, 2) }));
    p.close();
    p.open('p-body', 88, 104);
    p.part(BODY, C.body, K.flat({
      joinWith: [TAIL],
      belly: 'M34 102 C60 110 100 112 136 98 L136 130 L34 130 Z',
      inner: '<path d="M40 92 C54 82 80 76 104 80 C118 82 128 88 132 94" fill="none" stroke="' + C.dark + '" stroke-width="8" stroke-linecap="round" opacity="0.55"/>' +
        K.spots([[60, 88, 2.4, 1.6], [76, 84, 2.6, 1.8], [92, 84, 2.6, 1.8], [108, 86, 2.2, 1.6], [68, 98, 1.8, 1.2], [86, 96, 2, 1.3]], C.stripe, 0.6),
      auto: K.auto(3, 4, 0.6)
    }));
    p.close();
    p.open('p-legF', 60, 104);
    flipper(p, K, C, 'M64 104 C58 114 48 122 36 128 C38 120 46 112 56 104 Z', C.fin);
    p.close();
    // 首と細長い頭
    p.open('p-head', 126, 90);
    p.part('M122 86 C132 76 140 64 148 54 C152 50 156 48 160 48 L164 58 C158 60 154 64 150 70 C144 80 138 90 132 100 Z', C.body, K.flat({
      joinWith: [BODY], belly: 'M160 54 C152 62 146 74 140 86 L134 104 L152 104 L170 52 Z', auto: K.auto(1.8, 2.4, 0.6)
    }));
    p.detail(K.teethRow(166, 56, 196, 57, 8, 1.6, 3.4, -1) + K.teethRow(166, 53, 196, 53.4, 8, 1.6, 3.4, 1));
    p.part('M154 50 C158 44 166 43 174 45 L198 52 C198 55 196 56 192 56 L166 57 C158 57 154 55 154 50 Z', C.body, K.flat({ lw: 2, belly: 'M150 54 L202 53 L202 64 L150 64 Z', auto: K.auto(1.2, 1.6, 0.6) }));
    p.raw(K.eye({ x: 164, y: 48, rx: 2.4, ry: 2.2, iris: C.eye, pupil: 'round', pr: 0.55 }));
    p.close();
    p.open('p-armF', 116, 102);
    flipper(p, K, C, 'M118 100 C128 108 140 116 152 120 C144 122 132 118 112 108 Z', C.fin);
    p.close();
    water(p);
  };
  CUSTOM.notho.box = [140, 30, 60];
})(window);
