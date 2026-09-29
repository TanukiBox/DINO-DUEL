/*
 * DINO DUEL 恐竜のイラスト（オリジナルの SVG をその場で組み立てる）
 *
 * 体型の型（type）ごとに形を決め、同じ型の恐竜は
 * 色（body / belly / mark / accent）・模様（pattern）・頭の形（head / horns / extras）・大きさ（size）で描き分ける。
 * 絵はすべて右向き。相手側は CSS で左右反転する。
 *
 *   DN.art.svg(DN.dino('tyranno'))           → '<svg …>…</svg>'
 *   DN.art.svg(dino, { silhouette: true })   → 図鑑の「まだ持っていない」用の影
 *
 * 型：theropod（二足の肉食）/ ceratops（角のある四足）/ armored（鎧の四足）/ sauropod（首の長い大型）/
 *     plated（背中に板）/ ornithopod（二足の草食）/ pterosaur（翼竜）/ plesiosaur（首長竜）
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};

  var OL = '#2b1b12';   // 輪郭線の色
  var LW = 3.4;         // 輪郭線の太さ
  var uid = 0;

  // ---- 色 ----
  function hex2rgb(h) {
    h = h.replace('#', '');
    return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
  }
  /** amt > 0 で明るく、< 0 で暗く */
  function shade(h, amt) {
    var c = hex2rgb(h);
    var t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    return 'rgb(' + c.map(function (v) { return Math.round(v + (t - v) * p); }).join(',') + ')';
  }

  /** 決まった並びの乱数（恐竜ごとに模様の位置を固定する） */
  function seeded(str) {
    var s = 0;
    for (var i = 0; i < str.length; i++) s = (s * 31 + str.charCodeAt(i)) >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---- 手描き風の線（入り抜き・線の強弱） ----
  // 輪郭をブラウザで細かく点に分け、光の当たらない側（右下）ほど外側に太らせる。
  // 開いた線（しわ・まゆ など）は両端を細く抜く。結果は形ごとに覚えておく（2回目からは計算しない）。
  var INK = {
    light: [-0.55, -0.83],   // 光の来る向き（左上）
    extra: 1.5,              // 影の側で太らせる量（線の太さに対する割合）
    thin: 0.62,              // 光の側の線の太さ（元の太さに対する割合）
    step: 1.6                // 点の間隔
  };
  var inkCache = {};
  var probe = null;
  function samplePath(d) {
    if (typeof document === 'undefined' || !document.createElementNS) return null;
    if (!probe) probe = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    probe.setAttribute('d', d);
    var len = 0;
    try { len = probe.getTotalLength(); } catch (e) { return null; }
    if (!len) return null;
    var n = Math.max(10, Math.ceil(len / INK.step)), pts = [];
    for (var i = 0; i <= n; i++) { var q = probe.getPointAtLength(len * i / n); pts.push([q.x, q.y]); }
    return pts;
  }
  function f1(v) { return v.toFixed(2); }
  function ptsToPath(a, b) {
    return 'M' + a.map(function (q) { return f1(q[0]) + ' ' + f1(q[1]); }).join(' L') +
      ' L' + b.reverse().map(function (q) { return f1(q[0]) + ' ' + f1(q[1]); }).join(' L') + 'Z';
  }
  /** 閉じた輪郭：影の側に足す太り（リボン状の形） */
  function inkWeight(d, lw, color) {
    var key = 'w|' + lw + '|' + d;
    if (inkCache[key] === undefined) {
      var pts = samplePath(d), out = '';
      if (pts && (d.match(/M/gi) || []).length === 1) {
        var n = pts.length - 1, cx = 0, cy = 0, i;
        for (i = 0; i < n; i++) { cx += pts[i][0]; cy += pts[i][1]; }
        cx /= n; cy /= n;
        var nor = [], sgn = 0;
        for (i = 0; i <= n; i++) {
          var a = pts[i === 0 ? n - 1 : i - 1], b = pts[i === n ? 1 : i + 1];
          var tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.sqrt(tx * tx + ty * ty) || 1;
          var nx = ty / tl, ny = -tx / tl;
          nor.push([nx, ny]);
          sgn += nx * (pts[i][0] - cx) + ny * (pts[i][1] - cy);
        }
        var k = sgn < 0 ? -1 : 1, outer = [], inner = [];
        for (i = 0; i <= n; i++) {
          var mx = nor[i][0] * k, my = nor[i][1] * k;
          var sh = Math.max(0, -(mx * INK.light[0] + my * INK.light[1]));
          var wob = 1 + 0.12 * Math.sin(i * 0.9) * Math.sin(i * 0.23);
          var e = lw * INK.extra * sh * sh * (3 - 2 * sh) * wob;
          var r0 = lw * INK.thin / 2 - 0.15;
          inner.push([pts[i][0] + mx * r0, pts[i][1] + my * r0]);
          outer.push([pts[i][0] + mx * (r0 + e), pts[i][1] + my * (r0 + e)]);
        }
        out = ptsToPath(outer, inner);
      }
      inkCache[key] = out;
    }
    return inkCache[key] ? '<path d="' + inkCache[key] + '" fill="' + color + '"/>' : null;
  }
  /** 開いた線：両端を細く抜いた線（塗りの形） */
  function inkStroke(d, lw, color) {
    var key = 's|' + lw + '|' + d;
    if (inkCache[key] === undefined) {
      var pts = samplePath(d), out = '';
      if (pts && (d.match(/M/gi) || []).length === 1) {
        var n = pts.length - 1, L = [], R = [];
        for (var i = 0; i <= n; i++) {
          var a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)];
          var tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.sqrt(tx * tx + ty * ty) || 1;
          var nx = ty / tl, ny = -tx / tl, t = i / n;
          var w = lw * (0.18 + 0.95 * Math.pow(Math.sin(Math.PI * t), 0.55)) * (1 + 0.1 * Math.sin(i * 1.3)) / 2;
          L.push([pts[i][0] + nx * w, pts[i][1] + ny * w]);
          R.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
        }
        out = ptsToPath(L, R);
      }
      inkCache[key] = out;
    }
    return inkCache[key] ? '<path d="' + inkCache[key] + '" fill="' + color + '"/>' : null;
  }

  // ---- 部品を描く道具 ----
  function Pen(dino, opt) {
    this.id = 'dz' + (++uid);
    this.n = 0;
    this.a = dino.art;
    this.sil = !!(opt && opt.silhouette);
    this.noInk = !!(opt && opt.noInk) || this.sil;       // 手描き風の線を使わない（比べる用）
    this.noAuto = !!(opt && opt.noAuto) || this.sil;     // 自動の影を使わない（比べる用）
    this.rnd = seeded(dino.id);
    this.defs = '';
    this.out = '';
    this.col = {
      body: this.a.body,
      belly: this.a.belly || shade(this.a.body, 0.5),
      mark: this.a.mark || shade(this.a.body, -0.35),
      accent: this.a.accent || shade(this.a.body, -0.2),
      far: shade(this.a.body, -0.3)
    };
    this.pattern = this.makePattern(this.a.pattern);
  }

  Pen.prototype.fillOf = function (c) { return this.sil ? '#3a3040' : c; };

  /** 輪郭の線（o.ink なら手描き風） */
  Pen.prototype.outline = function (d, o, filled) {
    var col = o.ol || OL, lw = o.lw || LW;
    var weight = (o.ink && !this.noInk) ? inkWeight(d, lw, col) : null;
    var w = weight ? lw * INK.thin : lw;
    this.out += '<path d="' + d + '" fill="' + (filled || 'none') + '" stroke="' + col + '" stroke-width="' + w + '" stroke-linejoin="round" stroke-linecap="round"/>';
    if (weight) this.out += weight;
  };

  /** 自動の影：形を光の向きにずらして、重ならないところに影・反対側に照り返し */
  Pen.prototype.autoShade = function (d, a) {
    var m1 = this.id + 'm' + (this.n++), m2 = this.id + 'm' + (this.n++);
    var box = 'x="-40" y="-40" width="280" height="230"';
    this.defs += '<mask id="' + m1 + '" maskUnits="userSpaceOnUse" ' + box + '><rect ' + box + ' fill="#fff"/><path d="' + d + '" fill="#000" transform="translate(' + (-a.dx) + ' ' + (-a.dy) + ')"/></mask>';
    this.out += '<rect ' + box + ' fill="' + a.color + '" opacity="' + (a.op || 0.55) + '" mask="url(#' + m1 + ')"/>';
    if (a.hl !== false) {
      var h = a.hl || 0.6;
      this.defs += '<mask id="' + m2 + '" maskUnits="userSpaceOnUse" ' + box + '><rect ' + box + ' fill="#fff"/><path d="' + d + '" fill="#000" transform="translate(' + (a.dx * h) + ' ' + (a.dy * h) + ')"/></mask>';
      this.out += '<rect ' + box + ' fill="#fff5e0" opacity="' + (a.hlOp || 0.28) + '" mask="url(#' + m2 + ')"/>';
    }
  };

  /** 輪郭つきのかたまり（模様・おなか・陰は skin:true のときだけ） */
  Pen.prototype.part = function (d, fill, o) {
    o = o || {};
    var f = this.fillOf(fill || this.col.body);
    if (this.sil || !o.skin) {
      this.outline(d, o, f);
      return;
    }
    var cid = this.id + 'c' + (this.n++);
    this.defs += '<clipPath id="' + cid + '"><path d="' + d + '"/></clipPath>';
    this.out += '<path d="' + d + '" fill="' + f + '"/>';
    this.out += '<g clip-path="url(#' + cid + ')">';
    if (o.belly) this.out += '<path d="' + o.belly + '" fill="' + (o.bellyFill || this.col.belly) + '"/>';
    if (o.pattern !== false) this.out += this.pattern;
    if (o.inner) this.out += o.inner;
    if (o.auto && !this.noAuto) this.autoShade(d, o.auto);
    else if (o.innerFlat) this.out += o.innerFlat;
    if (o.tex) {
      var tid = this.tex();
      this.out += '<rect x="-20" y="-20" width="240" height="190" fill="url(#' + tid + 'b)"/><rect x="-20" y="-20" width="240" height="190" fill="url(#' + tid + ')"/>';
    }
    if (o.shade !== false) this.out += '<rect x="-20" y="-20" width="240" height="190" fill="url(#' + this.id + 'g)"/>';
    if (o.after) this.out += o.after;
    this.out += '</g>';
    this.outline(d, o);
  };

  /** 開いた線（しわ・まゆ など）。手描き風なら両端を細く抜く */
  Pen.prototype.stroke = function (d, lw, color) {
    if (this.sil) return;
    var r = this.noInk ? null : inkStroke(d, lw, color);
    this.out += r || '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + lw + '" stroke-linecap="round" stroke-linejoin="round"/>';
  };

  /** うろこの模様（くり返しの柄）。id を返す */
  Pen.prototype.tex = function () {
    var tid = this.id + 'sc';
    if (!this.hasTex) {
      this.hasTex = true;
      // 小石を敷きつめたようなうろこ（段ごとに半分ずらす）＋ まだらのしみ
      this.defs += '<pattern id="' + tid + '" width="4.4" height="3.8" patternUnits="userSpaceOnUse" patternTransform="rotate(-14)">' +
        '<ellipse cx="1.1" cy="0.95" rx="1.05" ry="0.85" fill="#fff" fill-opacity="0.07" stroke="#1a0f08" stroke-opacity="0.16" stroke-width="0.35"/>' +
        '<ellipse cx="3.3" cy="2.85" rx="1.05" ry="0.85" fill="#fff" fill-opacity="0.07" stroke="#1a0f08" stroke-opacity="0.16" stroke-width="0.35"/></pattern>';
      var r = this.rnd, blot = '';
      for (var i = 0; i < 26; i++) {
        blot += '<ellipse cx="' + (r() * 60).toFixed(1) + '" cy="' + (r() * 50).toFixed(1) + '" rx="' + (1.5 + r() * 4).toFixed(1) + '" ry="' + (1 + r() * 2.4).toFixed(1) + '" fill="#1a0f08" fill-opacity="' + (0.05 + r() * 0.08).toFixed(2) + '"/>';
      }
      this.defs += '<pattern id="' + tid + 'b" width="60" height="50" patternUnits="userSpaceOnUse">' + blot + '</pattern>';
    }
    return tid;
  };

  /** 動かせる部品のまとまり（技のアニメーションで回したり動かしたりする）。ox, oy = 回転の中心 */
  Pen.prototype.open = function (cls, ox, oy) {
    this.out += '<g class="' + cls + '" style="transform-origin:' + ox + 'px ' + oy + 'px">';
  };
  Pen.prototype.close = function () { this.out += '</g>'; };

  /** 線だけ（しわ・口・指など） */
  Pen.prototype.line = function (d, w, color) {
    if (this.sil) return;
    this.out += '<path d="' + d + '" fill="none" stroke="' + (color || OL) + '" stroke-width="' + (w || 2.4) + '" stroke-linecap="round" stroke-linejoin="round"/>';
  };
  Pen.prototype.raw = function (s) { this.out += s; };
  /** 細部（シルエットのときは描かない） */
  Pen.prototype.detail = function (s) { if (!this.sil) this.out += s; };

  Pen.prototype.eye = function (x, y, r, fierce) {
    if (this.sil) return;
    var iris = this.a.eye || '#f0c43a';
    this.out += '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#fffaf0" stroke="' + OL + '" stroke-width="2.4"/>';
    this.out += '<circle cx="' + (x + r * 0.25) + '" cy="' + y + '" r="' + (r * 0.62) + '" fill="' + iris + '"/>';
    this.out += '<circle cx="' + (x + r * 0.32) + '" cy="' + y + '" r="' + (r * 0.34) + '" fill="#1d1410"/>';
    this.out += '<circle cx="' + (x + r * 0.05) + '" cy="' + (y - r * 0.35) + '" r="' + (r * 0.22) + '" fill="#fff"/>';
    if (fierce) this.line('M' + (x - r * 1.2) + ' ' + (y - r * 1.25) + ' L' + (x + r * 1.3) + ' ' + (y - r * 0.55), 3.2);
    else this.line('M' + (x - r * 0.9) + ' ' + (y - r * 1.35) + ' Q' + x + ' ' + (y - r * 1.75) + ' ' + (x + r * 0.9) + ' ' + (y - r * 1.2), 2.2);
  };

  /** 歯（x0 から x1 まで、y の線から dir の向きへ） */
  Pen.prototype.teeth = function (x0, x1, y, size, dir) {
    if (this.sil) return;
    var d = '', step = size * 1.35;
    for (var x = x0; x + size <= x1; x += step) d += 'M' + x + ' ' + y + ' L' + (x + size / 2) + ' ' + (y + size * dir) + ' L' + (x + size) + ' ' + y + 'Z';
    this.out += '<path d="' + d + '" fill="#fffaf0" stroke="' + OL + '" stroke-width="1.4" stroke-linejoin="round"/>';
  };

  /** 爪（小さな白い三角） */
  Pen.prototype.claws = function (pts) {
    if (this.sil) return;
    var d = '';
    pts.forEach(function (p) { d += 'M' + p[0] + ' ' + p[1] + ' l4 -1 l-1 5 Z'; });
    this.out += '<path d="' + d + '" fill="#fff4e0" stroke="' + OL + '" stroke-width="1.3" stroke-linejoin="round"/>';
  };

  Pen.prototype.makePattern = function (kind) {
    var c = this.col.mark, r = this.rnd, s = '';
    if (kind === 'stripes') {
      for (var x = 14; x < 190; x += 17) {
        var w = 5 + r() * 3, lean = 6 + r() * 4;
        s += '<path d="M' + x + ' 16 L' + (x + w) + ' 16 L' + (x + w * 0.4 - lean) + ' ' + (70 + r() * 18) + ' Z" fill="' + c + '" opacity="0.85"/>';
      }
    } else if (kind === 'spots') {
      for (var i = 0; i < 34; i++) {
        s += '<ellipse cx="' + (8 + r() * 184).toFixed(1) + '" cy="' + (18 + r() * 72).toFixed(1) + '" rx="' + (2.5 + r() * 4).toFixed(1) + '" ry="' + (2 + r() * 3).toFixed(1) + '" fill="' + c + '" opacity="0.85"/>';
      }
    } else if (kind === 'bands') {
      for (var b = 20; b < 190; b += 26) {
        s += '<path d="M' + b + ' 10 C' + (b + 10) + ' 40 ' + (b - 4) + ' 70 ' + (b + 6) + ' 100 L' + (b + 16) + ' 100 C' + (b + 6) + ' 70 ' + (b + 20) + ' 40 ' + (b + 12) + ' 10 Z" fill="' + c + '" opacity="0.7"/>';
      }
    } else if (kind === 'saddle') {
      s += '<ellipse cx="96" cy="46" rx="58" ry="22" fill="' + c + '" opacity="0.8"/>';
    }
    return s;
  };

  // 顔のあたり（行動順の丸いアイコン用）。[x, y, 幅] ※大きさ 1 のときの位置
  var HEAD_BOX = {
    theropod: [118, 10, 84], ceratops: [118, 12, 86], armored: [128, 50, 72], sauropod: [134, -8, 68],
    plated: [146, 58, 56], ornithopod: [122, 4, 78], pterosaur: [108, 20, 92], plesiosaur: [144, 0, 58]
  };

  Pen.prototype.finish = function (crop) {
    var size = this.a.size || 1;
    var vb = '0 0 200 150';
    if (crop) {
      var b = this.headBox || HEAD_BOX[this.a.type] || [100, 20, 100];
      var x = 100 + (b[0] - 100) * size, y = 146 + (b[1] - 146) * size, w = b[2] * size;
      vb = x.toFixed(1) + ' ' + y.toFixed(1) + ' ' + w.toFixed(1) + ' ' + w.toFixed(1);
    }
    var grad = '<linearGradient id="' + this.id + 'g" gradientUnits="userSpaceOnUse" x1="0" y1="10" x2="0" y2="146">' +
      '<stop offset="0" stop-color="#fff" stop-opacity="0.28"/><stop offset="0.42" stop-color="#fff" stop-opacity="0"/>' +
      '<stop offset="0.7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.28"/></linearGradient>';
    var body = '<g transform="translate(100 146) scale(' + size + ') translate(-100 -146)">' + this.out + '</g>';
    var shadow = this.a.type === 'pterosaur' || crop ? '' : '<ellipse cx="100" cy="146" rx="' + (70 * size) + '" ry="5" fill="#000" opacity="0.18"/>';
    return '<svg class="dino-svg" viewBox="' + vb + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>' + grad + this.defs + '</defs>' + shadow + body + '</svg>';
  };

  // ================= 型ごとの形 =================
  var TYPES = {};

  // ---- 二足の肉食（ティラノ・ラプトルなど）----
  TYPES.theropod = function (p) {
    var a = p.a, slim = a.head === 'slim';
    var ex = a.extras || [];
    // 奥の足
    p.part('M82 90 C96 88 104 100 101 114 L97 132 L110 138 L108 142 L82 142 L85 120 C78 110 76 98 82 90Z', p.col.far);
    if (ex.indexOf('sail') >= 0) p.part('M58 56 C66 20 88 8 112 18 C120 26 122 40 124 48 C104 54 80 56 58 56Z', a.accent);
    // しっぽ・胴・首
    p.part('M4 70 C28 62 56 51 84 50 C102 50 116 46 126 38 L148 36 L152 62 C143 70 138 84 134 94 C127 107 114 113 98 113 C78 113 62 105 48 93 C34 84 20 76 4 70Z',
      null, { skin: true, belly: 'M40 110 C70 92 110 88 150 70 L160 130 L40 130Z' });
    // 奥の腕
    p.part('M132 92 C140 95 145 100 144 107 L139 106 C138 102 134 100 130 99Z', p.col.far, { lw: 2.6 });
    // 手前の足
    p.part('M90 82 C110 78 124 94 116 112 L112 130 L126 137 L124 142 L98 142 L101 120 C88 112 82 94 90 82Z', null, { skin: true });
    p.claws([[112, 139], [118, 139], [104, 139]]);
    // 頭
    if (slim) {
      p.part('M134 40 C140 31 152 28 164 31 C177 34 188 40 195 47 L195 52 C185 54 172 54 160 53 L159 56 C170 57 180 58 187 59 C182 65 166 67 150 64 C140 62 134 56 132 50 C131 46 132 43 134 40Z',
        null, { skin: true, pattern: false, belly: 'M130 58 L196 56 L196 70 L130 70Z' });
      p.teeth(163, 191, 53.5, 3.2, 1);
      p.eye(153, 40, 4.4, true);
    } else {
      p.part('M132 36 C138 24 154 19 171 22 C184 25 193 33 196 44 L196 53 C186 56 172 57 160 57 L158 61 C170 62 180 63 187 65 C184 74 168 78 150 75 C140 73 132 65 130 55 C129 47 129 41 132 36Z',
        null, { skin: true, pattern: false, belly: 'M128 62 L198 60 L198 80 L128 80Z' });
      p.teeth(161, 193, 57, 4.2, 1);
      p.teeth(162, 184, 62, 3.4, -1);
      p.eye(156, 36, 5.2, true);
      p.line('M186 34 l3 1', 2.2);
    }
    // 手前の腕
    p.part('M128 90 C138 91 146 97 146 105 L140 105 C139 101 135 98 128 98Z', null, { lw: 2.6 });
    p.claws([[143, 104]]);
    if (ex.indexOf('feathers') >= 0) {
      p.part('M4 70 L-4 62 L6 66 L0 56 L12 64 L10 54 L20 64Z', a.accent, { lw: 2.2 });
      p.part('M134 40 L126 30 L136 34 L132 24 L142 32Z', a.accent, { lw: 2.2 });
      p.part('M88 52 L80 42 L92 48 L90 38 L100 48Z', a.accent, { lw: 2.2 });
    }
    if (ex.indexOf('crest') >= 0) {
      p.part('M140 28 C144 12 160 8 168 14 C160 18 152 22 150 30Z', a.accent, { lw: 2.4 });
      p.part('M152 26 C158 10 176 10 180 18 C172 20 164 24 162 30Z', a.accent, { lw: 2.4 });
    }
    if (ex.indexOf('horns') >= 0) {
      p.part('M146 26 L140 12 L156 24Z', a.accent, { lw: 2.4 });
    }
  };

  // ---- 角のある四足（トリケラトプスなど）----
  TYPES.ceratops = function (p) {
    var a = p.a;
    // 奥の足
    p.part('M62 96 L60 140 L80 140 L82 104Z', p.col.far);
    p.part('M118 100 L118 140 L136 140 L138 100Z', p.col.far);
    // 胴・しっぽ
    p.part('M10 88 C24 80 44 68 66 62 C92 54 120 56 136 66 L140 104 C128 116 100 118 78 116 C58 114 44 106 34 98 C26 94 18 92 10 88Z',
      null, { skin: true, belly: 'M20 118 C60 100 110 100 150 108 L150 130 L20 130Z' });
    // 手前の足
    p.part('M70 96 C84 94 92 102 90 112 L90 142 L66 142 L66 110Z', null, { skin: true });
    p.part('M126 98 C140 96 148 104 146 114 L146 142 L122 142 L122 110Z', null, { skin: true });
    p.claws([[70, 140], [78, 140], [126, 140], [134, 140]]);
    // えり飾り
    p.part('M124 58 C122 30 142 14 162 22 C174 28 176 44 170 60 C164 74 150 86 138 88 C128 86 124 72 124 58Z', a.accent, { lw: 3 });
    if (!p.sil) {
      p.line('M132 36 C140 46 146 56 150 70', 2, 'rgba(0,0,0,0.25)');
      p.line('M146 24 C150 40 154 52 156 66', 2, 'rgba(0,0,0,0.25)');
      p.raw('<circle cx="140" cy="30" r="3" fill="' + p.col.belly + '"/><circle cx="156" cy="24" r="3" fill="' + p.col.belly + '"/><circle cx="167" cy="34" r="3" fill="' + p.col.belly + '"/>');
    }
    // 顔
    p.part('M138 62 C150 52 168 54 178 60 C188 66 194 76 192 86 L182 94 C172 96 158 94 148 88 C138 82 134 72 138 62Z',
      null, { skin: true, pattern: false, belly: 'M130 86 L200 80 L200 100 L130 100Z' });
    // くちばし
    p.part('M184 70 C192 72 198 80 196 88 C192 92 186 94 180 92Z', '#d9c9a0', { lw: 2.6 });
    // 角
    var horns = a.horns || 'tri';
    if (horns === 'tri' || horns === 'brow') {
      p.part('M160 58 C166 44 180 30 196 24 C186 36 176 50 170 62Z', '#f3ead2', { lw: 2.6 });
      p.part('M150 56 C154 42 164 30 176 24 C170 36 164 48 160 58Z', '#e2d6b6', { lw: 2.4 });
    }
    if (horns === 'tri' || horns === 'nose') {
      var big = horns === 'nose';
      p.part(big ? 'M178 66 C180 50 186 36 194 28 C194 44 190 58 188 68Z' : 'M180 68 C182 60 186 54 190 50 C190 58 190 64 188 70Z', '#f3ead2', { lw: 2.4 });
    }
    if (horns === 'spiky') {
      p.part('M130 40 L112 26 L128 30 L118 12 L136 26 L136 8 L146 22 L152 6 L156 22 L166 10 L166 28Z', '#f3ead2', { lw: 2.4 });
      p.part('M178 66 C180 50 186 36 194 28 C194 44 190 58 188 68Z', '#f3ead2', { lw: 2.4 });
    }
    p.eye(164, 68, 4.4, false);
    p.line('M180 86 C174 88 168 88 162 86', 2.2);
  };

  // ---- 鎧のある四足（アンキロサウルスなど）----
  TYPES.armored = function (p) {
    var a = p.a;
    // 奥の足
    p.part('M58 104 L56 140 L74 140 L76 106Z', p.col.far);
    p.part('M124 104 L124 140 L140 140 L142 104Z', p.col.far);
    // しっぽとこぶ
    var club = !(a.extras && a.extras.indexOf('noclub') >= 0);
    p.part('M40 98 C26 94 16 90 8 86 L10 80 C20 82 32 84 44 88Z', null, { skin: true });
    if (club) p.part('M-4 84 C-4 74 10 70 18 76 C24 82 20 92 10 94 C2 95 -4 90 -4 84Z', a.accent, { lw: 3 });
    // 胴（低くて幅広い）
    p.part('M30 100 C32 76 60 58 98 58 C132 58 154 72 160 94 L160 106 C140 116 108 118 80 116 C56 116 38 110 30 100Z',
      null, { skin: true, belly: 'M20 122 C60 104 120 104 170 112 L170 130 L20 130Z' });
    // よろい（トゲとこぶ）
    if (!p.sil) {
      var rows = [[44, 86], [56, 74], [72, 66], [90, 62], [108, 62], [126, 66], [142, 74], [152, 86]];
      var s = '';
      rows.forEach(function (r0, i) {
        s += '<path d="M' + (r0[0] - 7) + ' ' + (r0[1] + 3) + ' L' + r0[0] + ' ' + (r0[1] - 9) + ' L' + (r0[0] + 7) + ' ' + (r0[1] + 3) + 'Z" fill="' + shade(a.belly, 0.2) + '" stroke="' + OL + '" stroke-width="2" stroke-linejoin="round"/>';
        if (i > 0 && i < rows.length - 1) {
          s += '<ellipse cx="' + (r0[0] + 2) + '" cy="' + (r0[1] + 16) + '" rx="7" ry="5" fill="' + a.accent + '" stroke="' + OL + '" stroke-width="1.8"/>';
          s += '<ellipse cx="' + (r0[0] - 4) + '" cy="' + (r0[1] + 30) + '" rx="6" ry="4.4" fill="' + a.accent + '" stroke="' + OL + '" stroke-width="1.6"/>';
        }
      });
      p.raw(s);
    }
    // 手前の足
    p.part('M66 100 C80 98 88 106 86 116 L86 142 L62 142 L62 112Z', null, { skin: true });
    p.part('M132 100 C146 98 152 106 150 116 L150 142 L128 142 L128 112Z', null, { skin: true });
    p.claws([[64, 140], [72, 140], [130, 140], [138, 140]]);
    // 頭
    p.part('M150 80 C162 72 178 74 186 84 C190 90 190 98 184 102 L156 104 C150 98 148 88 150 80Z', null, { skin: true, pattern: false, belly: 'M140 98 L200 96 L200 110 L140 110Z' });
    p.part('M154 80 L148 70 L162 76Z', shade(a.belly, 0.2), { lw: 2 });
    p.part('M172 76 L174 66 L180 78Z', shade(a.belly, 0.2), { lw: 2 });
    p.eye(170, 86, 3.8, false);
    p.line('M186 98 C180 99 174 99 168 98', 2);
  };

  // ---- 首の長い大型（ブラキオサウルスなど）----
  TYPES.sauropod = function (p) {
    var a = p.a;
    // 奥の足
    p.part('M52 100 L50 140 L70 140 L72 104Z', p.col.far);
    p.part('M116 96 L118 140 L138 140 L136 96Z', p.col.far);
    // しっぽ・胴・首
    p.part('M2 104 C24 98 40 86 58 76 C78 64 106 60 124 66 C132 52 140 36 148 24 C154 14 162 10 172 12 L178 26 C170 28 166 36 162 48 C156 66 152 86 146 102 C132 116 106 120 84 116 C60 112 36 108 2 104Z',
      null, { skin: true, belly: 'M20 120 C60 104 120 100 160 96 L160 130 L20 130Z' });
    // 手前の足（前足が長い）
    p.part('M64 98 C78 96 86 104 84 114 L84 142 L60 142 L60 110Z', null, { skin: true });
    p.part('M124 86 C140 84 148 94 146 106 L146 142 L122 142 L122 100Z', null, { skin: true });
    p.claws([[62, 140], [70, 140], [124, 140], [132, 140]]);
    // 頭
    p.part('M158 14 C164 4 182 2 190 10 C196 16 194 26 186 28 L168 30 C160 28 156 22 158 14Z', null, { skin: true, pattern: false, belly: 'M150 24 L200 22 L200 40 L150 40Z' });
    if (a.head !== 'flat') p.part('M162 12 C164 2 174 -2 180 4 C176 6 172 8 170 12Z', a.accent || p.col.mark, { lw: 2.2 });
    p.eye(174, 12, 3.4, false);
    p.line('M190 24 C184 25 178 25 172 24', 2);
    if (!p.sil) p.line('M156 44 C152 56 150 66 148 80', 1.8, 'rgba(0,0,0,0.18)');
  };

  // ---- 背中に板（ステゴサウルスなど）----
  TYPES.plated = function (p) {
    var a = p.a;
    // 板（胴の後ろに描く）
    var plates = [[34, 70, 12], [52, 58, 16], [72, 48, 20], [94, 44, 22], [116, 48, 20], [136, 58, 15], [152, 70, 11]];
    plates.forEach(function (q) {
      var x = q[0], y = q[1], h = q[2];
      p.part('M' + (x - h * 0.6) + ' ' + (y + 8) + ' L' + (x - h * 0.45) + ' ' + (y - h * 0.5) + ' L' + x + ' ' + (y - h) + ' L' + (x + h * 0.45) + ' ' + (y - h * 0.5) + ' L' + (x + h * 0.6) + ' ' + (y + 8) + 'Z', a.accent, { lw: 2.6 });
    });
    // しっぽのトゲ
    p.part('M14 80 L2 60 L20 76Z', '#f3ead2', { lw: 2.2 });
    p.part('M24 76 L18 54 L30 72Z', '#f3ead2', { lw: 2.2 });
    // 奥の足
    p.part('M62 100 L60 140 L80 140 L82 104Z', p.col.far);
    p.part('M136 100 L138 140 L154 140 L152 100Z', p.col.far);
    // 胴
    p.part('M6 86 C22 82 38 74 54 66 C74 52 104 50 122 60 C134 68 142 80 152 88 C160 92 168 94 176 92 L180 104 C168 108 154 108 142 106 C122 114 96 118 76 114 C54 110 34 100 6 86Z',
      null, { skin: true, belly: 'M20 118 C60 100 120 98 170 100 L170 130 L20 130Z' });
    // 手前の足（後ろ足が長い）
    p.part('M68 92 C86 88 96 100 92 114 L92 142 L68 142 L66 112Z', null, { skin: true });
    p.part('M142 98 C154 96 160 104 158 114 L158 142 L138 142 L138 110Z', null, { skin: true });
    p.claws([[70, 140], [78, 140], [140, 140], [148, 140]]);
    // 頭（小さい）
    p.part('M168 86 C174 78 188 80 194 88 C198 94 194 102 186 102 L172 102 C166 98 164 92 168 86Z', null, { skin: true, pattern: false, belly: 'M160 98 L200 96 L200 110 L160 110Z' });
    p.eye(180, 88, 3.4, false);
    p.line('M194 98 C188 99 184 99 180 98', 2);
  };

  // ---- 二足の草食（イグアノドン・パラサウロロフスなど）----
  TYPES.ornithopod = function (p) {
    var a = p.a, ex = a.extras || [];
    // 奥の足
    p.part('M80 86 C94 84 102 96 98 110 L96 132 L108 138 L106 142 L82 142 L84 118 C76 108 74 94 80 86Z', p.col.far);
    // 胴
    p.part('M4 80 C28 72 54 62 80 60 C98 58 112 50 122 40 L142 36 L146 60 C140 74 136 88 128 98 C120 110 106 115 90 114 C72 112 58 104 46 96 C32 88 18 84 4 80Z',
      null, { skin: true, belly: 'M40 116 C70 96 110 90 150 70 L160 130 L40 130Z' });
    // 奥の腕
    p.part('M126 84 C136 88 144 96 146 106 L140 108 C136 100 130 96 124 94Z', p.col.far, { lw: 2.6 });
    // 手前の足
    p.part('M86 78 C106 74 120 90 112 108 L108 130 L122 137 L120 142 L94 142 L97 118 C84 110 78 90 86 78Z', null, { skin: true });
    p.claws([[108, 139], [114, 139], [100, 139]]);
    // 頭（くちばしのある顔）
    p.part('M130 34 C136 22 150 18 162 22 C172 26 182 32 188 40 C191 46 188 53 180 54 L162 56 C150 58 138 52 133 45 C130 41 129 37 130 34Z',
      null, { skin: true, pattern: false, belly: 'M126 50 L200 46 L200 62 L126 62Z' });
    p.part('M180 38 C188 38 196 44 196 50 C194 54 186 56 180 54Z', a.accent, { lw: 2.4 });
    p.eye(152, 32, 4.4, false);
    p.line('M180 50 C172 52 164 52 158 50', 2);
    if (a.head === 'tube') p.part('M138 26 C124 16 108 6 92 2 C94 8 100 12 110 16 C120 22 128 30 136 36Z', a.accent, { lw: 2.6 });
    if (a.head === 'dome') p.part('M132 30 C132 12 150 6 160 14 C164 18 164 24 160 28 C150 26 140 28 132 30Z', a.accent, { lw: 2.6 });
    if (a.head === 'fan') p.part('M140 26 C136 10 146 0 160 4 C156 12 152 20 150 28Z', a.accent, { lw: 2.6 });
    // 手前の腕（親指のトゲ）
    p.part('M124 86 C136 88 146 96 150 106 L144 110 C140 102 132 98 122 96Z', null, { lw: 2.6 });
    if (ex.indexOf('thumb') >= 0 || a.head === undefined) p.part('M146 100 L154 92 L150 104Z', '#f3ead2', { lw: 1.8 });
  };

  // ---- 翼竜（プテラノドンなど）----
  TYPES.pterosaur = function (p) {
    var a = p.a, wing = a.wing || shade(a.body, 0.25);
    p.raw('<g transform="translate(0 -14)">');
    // 奥の翼
    p.part('M96 76 C84 56 66 36 40 18 C62 26 84 30 104 30 C108 48 112 62 114 76Z', shade(wing, -0.25), { lw: 2.8 });
    // 足
    p.part('M86 94 L80 112 L88 112 L92 96Z', p.col.far, { lw: 2.4 });
    p.part('M98 96 L96 116 L104 116 L104 96Z', null, { lw: 2.4 });
    // 胴
    p.part('M68 84 C76 70 100 66 120 70 C134 72 140 80 136 88 C128 98 104 100 88 98 C76 96 68 92 68 84Z',
      null, { skin: true, belly: 'M60 96 C90 86 120 86 150 90 L150 110 L60 110Z' });
    // 頭と首
    p.part('M124 76 C130 64 146 60 158 64 L199 74 C188 78 172 80 158 80 C146 84 132 84 124 80Z',
      null, { skin: true, pattern: false, belly: 'M120 78 L200 76 L200 90 L120 90Z' });
    // とさか
    if (a.head !== 'nocrest') p.part('M136 66 C122 58 106 50 90 46 C104 56 118 66 132 72Z', a.accent, { lw: 2.6 });
    p.eye(146, 69, 3.6, true);
    p.line('M160 78 L196 75', 1.8);
    // 手前の翼
    p.part('M104 78 C90 60 60 40 12 30 C34 50 56 70 70 84 C84 92 96 92 106 90Z', wing, { lw: 3 });
    if (!p.sil) {
      p.line('M104 80 C84 64 52 46 16 32', 2.2, shade(wing, -0.35));
      p.line('M70 62 C72 70 72 78 70 84', 1.6, shade(wing, -0.2));
      p.line('M48 48 C52 58 58 68 64 78', 1.6, shade(wing, -0.2));
    }
    p.claws([[104, 76]]);
    p.raw('</g>');
    // 地面の影（浮いている）
    p.raw('<ellipse cx="100" cy="146" rx="46" ry="4" fill="#000" opacity="0.14"/>');
  };

  // ---- 首長竜（エラスモサウルスなど）----
  TYPES.plesiosaur = function (p) {
    var a = p.a;
    // 奥のヒレ
    p.part('M66 104 C54 112 40 120 28 122 C38 112 52 104 62 98Z', p.col.far, { lw: 2.6 });
    p.part('M124 104 C130 116 140 124 152 126 C146 114 136 104 128 98Z', p.col.far, { lw: 2.6 });
    // しっぽ・胴・首
    p.part('M4 100 C16 96 28 92 38 88 C50 76 76 70 100 72 C114 73 124 78 132 84 C140 70 146 52 152 38 C156 28 164 22 172 22 L178 36 C170 38 166 46 162 58 C158 74 154 90 146 104 C132 116 110 120 86 118 C62 116 44 110 34 104 C24 104 14 104 4 100Z',
      null, { skin: true, belly: 'M20 120 C60 104 120 100 170 96 L170 130 L20 130Z' });
    // 手前のヒレ
    p.part('M76 106 C66 118 50 130 34 134 C44 120 58 108 72 100Z', null, { skin: true, pattern: false });
    p.part('M132 104 C142 118 154 128 170 132 C162 118 150 106 138 98Z', null, { skin: true, pattern: false });
    // 頭
    p.part('M162 26 C166 16 180 12 190 18 C196 22 198 28 196 32 L176 36 C168 36 162 32 162 26Z', null, { skin: true, pattern: false, belly: 'M156 30 L200 28 L200 44 L156 44Z' });
    p.teeth(178, 196, 31, 2.8, 1);
    p.eye(176, 22, 3.4, true);
    // 水しぶき
    if (!p.sil) {
      p.raw('<path d="M14 138 C30 132 44 132 58 138 C72 144 86 144 100 138 C114 132 128 132 142 138 C156 144 170 144 186 138" fill="none" stroke="#e8f6ff" stroke-width="4" stroke-linecap="round" opacity="0.9"/>');
      p.raw('<path d="M24 144 C40 140 56 140 72 144 M110 144 C126 140 142 140 158 144" fill="none" stroke="#bfe6ff" stroke-width="3" stroke-linecap="round" opacity="0.8"/>');
    }
  };

  // ================= 1体ずつ描きこんだ恐竜 =================
  var CUSTOM = DN.ART_CUSTOM = DN.ART_CUSTOM || {};

  DN.art = {
    types: Object.keys(TYPES),
    shade: shade,
    /** 頭のあたりの位置（絵の幅・高さに対する割合、右向き） */
    headPoint: function (dino) {
      var b = (CUSTOM[dino.id] && CUSTOM[dino.id].box) || HEAD_BOX[dino.art.type] || [100, 20, 100];
      var size = dino.art.size || 1;
      var cx = 100 + (b[0] + b[2] / 2 - 100) * size, cy = 146 + (b[1] + b[2] / 2 - 146) * size;
      return [cx / 200, cy / 150];
    },
    svg: function (dino, opt) {
      var p = new Pen(dino, opt);
      ((opt && opt.plain ? null : CUSTOM[dino.id]) || TYPES[dino.art.type] || TYPES.theropod)(p);
      return p.finish(opt && opt.crop);
    }
  };
})(window);
