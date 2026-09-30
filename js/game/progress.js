/*
 * DINO DUEL 進み具合（持っている恐竜・重ね数・レベル・賞金・大会）
 * 画面を使わない計算だけ。ゲーム（main.js など）とシミュレーション（tools/sim.js）の両方が使う。
 *
 * 状態（セーブされる中身）：
 *   { v, money, owned: { id: { stack, lv, xp } }, team: [id, id, id], cleared: [大会ごとの優勝], run: { t, m, practice } | null,
 *     packs: { 優勝パックid: 未開封の数 }, stats: { wins, losses, pulls, perfects, bestChain, exGot, comboWins, practice },
 *     pity: SR 以上が出ていない回数, fossils: 化石ポイント, ach: { 受け取った実績: true }, tut: チュートリアルを終えた }
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};
  var CFG = DN.CFG;
  var P = DN.Progress = {};
  var SAVE_VER = 2;

  P.newState = function () {
    var s = { v: SAVE_VER, money: CFG.START_MONEY, owned: {}, team: CFG.STARTERS.slice(), cleared: [false, false, false, false, false],
      run: null, packs: {}, stats: { wins: 0, losses: 0, pulls: 0, perfects: 0, bestChain: 0, exGot: 0, comboWins: 0, practice: 0 }, seenEx: {},
      pity: 0, fossils: 0, ach: {}, tut: false };
    CFG.STARTERS.forEach(function (id) { s.owned[id] = { stack: 0, lv: 1, xp: 0 }; });
    return s;
  };
  /** 古いセーブや壊れたセーブを直す */
  P.fix = function (s) {
    if (!s || s.v !== SAVE_VER || !s.owned) return P.newState();
    var n = P.newState();
    Object.keys(n).forEach(function (k) { if (s[k] === undefined) s[k] = n[k]; });
    Object.keys(n.stats).forEach(function (k) { if (s.stats[k] === undefined) s.stats[k] = 0; });
    // 前の版のセーブ（もう大会で勝っている人）は、チュートリアルを出さない
    if (s.stats.wins > 0) s.tut = true;
    s.team = (s.team || []).filter(function (id) { return s.owned[id]; });
    Object.keys(s.owned).forEach(function (id) { if (!DN.dino(id)) delete s.owned[id]; });
    if (s.team.length < 3) s.team = P.bestTeam(s);
    return s;
  };

  // ---------------- 恐竜 ----------------
  P.has = function (s, id) { return !!s.owned[id]; };
  P.spec = function (s, id) { var o = s.owned[id] || { lv: 1, stack: 0 }; return { id: id, lv: o.lv, stack: o.stack }; };
  P.teamSpecs = function (s) { return s.team.map(function (id) { return P.spec(s, id); }); };
  P.ownedIds = function (s) { return DN.DINOS.map(function (d) { return d.id; }).filter(function (id) { return s.owned[id]; }); };

  /** 今の能力（レベル・重ね強化を入れた値。コンボは入れない） */
  P.stats = function (s, id) {
    var d = DN.dino(id), o = s.owned[id] || { lv: 1, stack: 0 }, g = DN.Battle.growth(o.lv, o.stack);
    return { hp: Math.round(d.hp * g), atk: Math.round(d.atk * g), def: Math.round(d.def * g), spd: Math.round(d.spd * g), dex: d.dex };
  };
  /** 強さのめやす（チームを自動で組むときに使う） */
  P.power = function (s, id) {
    var st = P.stats(s, id);
    return st.hp * 0.4 + st.atk * 1.2 + st.def + st.spd * 0.8 + st.dex * 0.5;
  };

  /** カードを1枚入れる。すでに持っていれば重ねる（+1）。かぶったときは化石ポイントも（noFossil で、なし） */
  P.addCard = function (s, id, noFossil) {
    var o = s.owned[id], d = DN.dino(id);
    if (d.rarity === 'EX') s.stats.exGot++;
    if (o) {
      o.stack++;
      var f = noFossil ? 0 : CFG.FOSSIL_GAIN[d.rarity];
      s.fossils += f;
      return { id: id, isNew: false, stack: o.stack, fossil: f };
    }
    s.owned[id] = { stack: 0, lv: 1, xp: 0 };
    return { id: id, isNew: true, stack: 0, fossil: 0 };
  };

  // ---------------- 化石ポイントで交換 ----------------
  P.exchangeCost = function (id) { return CFG.FOSSIL_COST[DN.dino(id).rarity]; };
  /** 化石ポイントで1枚もらう（持っていれば重ね +1）。足りなければ null */
  P.exchange = function (s, id) {
    var c = P.exchangeCost(id);
    if (s.fossils < c) return null;
    s.fossils -= c;
    return P.addCard(s, id, true);
  };

  P.xpNext = function (lv) { return CFG.XP_NEXT * lv; };
  /** 経験値を入れる。上がったレベルの数を返す（最大レベルで止まる） */
  P.gainXp = function (s, id, xp) {
    var o = s.owned[id];
    if (!o || o.lv >= CFG.LV_MAX) return 0;
    var up = 0;
    o.xp += xp;
    while (o.lv < CFG.LV_MAX && o.xp >= P.xpNext(o.lv)) { o.xp -= P.xpNext(o.lv); o.lv++; up++; }
    if (o.lv >= CFG.LV_MAX) o.xp = 0;
    return up;
  };

  /** いちばん強い3体（コンボも考える） */
  P.bestTeam = function (s) {
    var ids = P.ownedIds(s);
    if (ids.length <= 3) return ids.slice(0, 3);
    ids.sort(function (a, b) { return P.power(s, b) - P.power(s, a); });
    var cand = ids.slice(0, 12), best = null, bestScore = -1;
    for (var i = 0; i < cand.length; i++) for (var j = i + 1; j < cand.length; j++) for (var k = j + 1; k < cand.length; k++) {
      var t = [cand[i], cand[j], cand[k]];
      var bonus = 1 + DN.combosFor(t).reduce(function (a, c) { return a + Object.keys(c.up).reduce(function (x, key) { return x + c.up[key]; }, 0) / 4; }, 0);
      var sc = (P.power(s, t[0]) + P.power(s, t[1]) + P.power(s, t[2])) * bonus;
      if (sc > bestScore) { bestScore = sc; best = t; }
    }
    return best;
  };

  // ---------------- カードパック ----------------
  /** そのパックから出る恐竜（レア度ごと） */
  P.packPool = function (pack, rarity) {
    return DN.DINOS.filter(function (d) { return d.rarity === rarity && (!pack.clan || d.clan === pack.clan); });
  };
  /**
   * 1枚引く（rand = 0〜1 の乱数を返す関数）。floor = 'SR' なら SR 以上だけで引く（天井。SR 以上の中の比率はそのまま）
   */
  P.draw = function (packId, rand, floor) {
    rand = rand || Math.random;
    var pack = DN.pack(packId), from = floor ? DN.RARITIES.indexOf(floor) : 0, total = 0;
    for (var q = from; q < DN.RARITIES.length; q++) total += pack.rates[DN.RARITIES[q]] || 0;
    var r = rand() * total, acc = 0, rarity = DN.RARITIES[from];
    for (var i = from; i < DN.RARITIES.length; i++) {
      var k = DN.RARITIES[i];
      acc += pack.rates[k] || 0;
      if (r < acc) { rarity = k; break; }
      rarity = k;
    }
    var pool = P.packPool(pack, rarity);
    for (var j = DN.RARITIES.indexOf(rarity); !pool.length && j > 0; j--) pool = P.packPool(pack, DN.RARITIES[j - 1]);
    return pool[Math.floor(rand() * pool.length)].id;
  };
  /** 買って引く。お金が足りなければ null */
  P.buy = function (s, packId, rand) {
    var pack = DN.pack(packId);
    if (pack.price === null || s.money < pack.price) return null;
    s.money -= pack.price;
    return pullOne(s, packId, rand);
  };
  /** 天井まであと何回（この回数目で SR 以上が確定） */
  P.pityLeft = function (s) { return CFG.PITY - s.pity; };
  function pullOne(s, packId, rand) {
    s.stats.pulls++;
    var sure = s.pity >= CFG.PITY - 1;
    var id = P.draw(packId, rand, sure ? 'SR' : null), rk = DN.RARITIES.indexOf(DN.dino(id).rarity);
    s.pity = rk >= 2 ? 0 : s.pity + 1;
    var r = P.addCard(s, id);
    r.pity = sure;
    return r;
  }
  /** もらった優勝パックを開ける */
  P.openPrize = function (s, packId, rand) {
    if (!s.packs[packId]) return null;
    s.packs[packId]--;
    return pullOne(s, packId, rand);
  };

  // ---------------- 大会 ----------------
  P.unlocked = function (s, t) { return !!s.debug || t === 0 || s.cleared[t - 1]; };
  /** 大会を始める（最初の試合から） */
  P.startRun = function (s, t) { s.run = { t: t, m: 0 }; return s.run; };
  /** 練習試合：優勝した大会の相手の中から1チームと1戦だけ（賞金は少なめ・経験値はふつう） */
  P.startPractice = function (s, t, rand) {
    var n = DN.TOURNAMENTS[t].matches.length;
    s.run = { t: t, m: Math.floor((rand || Math.random)() * n), practice: true };
    return s.run;
  };
  /** 今の試合の相手 */
  P.opponent = function (s) { return s.run ? DN.TOURNAMENTS[s.run.t].matches[s.run.m] : null; };

  /**
   * 試合の結果を入れる。賞金・経験値はいつも残る（負けても）。
   * 返り値：{ won, prize, xp, levelUps: { id: 上がった数 }, champion, pack, next }
   */
  P.finishMatch = function (s, won) {
    var t = s.run.t, T = DN.TOURNAMENTS[t];
    var res = { won: won, prize: 0, xp: won ? CFG.XP_WIN[t] : CFG.XP_LOSE, levelUps: {}, champion: false, pack: null, first: false, practice: !!s.run.practice };
    s.team.forEach(function (id) { var n = P.gainXp(s, id, res.xp); if (n) res.levelUps[id] = n; });
    if (res.practice) {
      s.stats.practice++;
      if (won) { s.stats.wins++; res.prize = Math.round(T.prize * CFG.PRACTICE_PRIZE); s.money += res.prize; } else s.stats.losses++;
      s.run = null;
      return res;
    }
    if (won) {
      s.stats.wins++;
      res.prize = T.prize;
      s.money += res.prize;
      s.run.m++;
      if (s.run.m >= T.matches.length) {
        res.champion = true;
        res.first = !s.cleared[t];
        s.cleared[t] = true;
        res.pack = T.pack;
        s.packs[T.pack] = (s.packs[T.pack] || 0) + 1;
        s.run = null;
      }
    } else {
      s.stats.losses++;
      s.run = null;          // 負けたら大会の最初から（賞金・経験値は残る）
    }
    return res;
  };

  // ---------------- 実績（目標とごほうび） ----------------
  // test(s) が true になったら「受け取る」を押せる。reward = { money, pack }
  function maxOf(s, f) { return P.ownedIds(s).reduce(function (m, id) { return Math.max(m, f(s.owned[id])); }, 0); }
  P.ACHIEVEMENTS = [
    { id: 'win1', test: function (s) { return s.stats.wins >= 1; }, reward: { money: 100 } },
    { id: 'perfect1', test: function (s) { return s.stats.perfects >= 1; }, reward: { money: 50 } },
    { id: 'dex10', goal: 10, prog: function (s) { return P.ownedIds(s).length; }, reward: { money: 300 } },
    { id: 'tour0', test: function (s) { return s.cleared[0]; }, reward: { money: 150 } },
    { id: 'chain5', goal: 5, prog: function (s) { return s.stats.bestChain; }, reward: { money: 200 } },
    { id: 'combo', test: function (s) { return s.stats.comboWins >= 1; }, reward: { money: 200 } },
    { id: 'tour1', test: function (s) { return s.cleared[1]; }, reward: { money: 300 } },
    { id: 'dex20', goal: 20, prog: function (s) { return P.ownedIds(s).length; }, reward: { money: 600 } },
    { id: 'pulls50', goal: 50, prog: function (s) { return s.stats.pulls; }, reward: { money: 300 } },
    { id: 'lv10', goal: 10, prog: function (s) { return maxOf(s, function (o) { return o.lv; }); }, reward: { money: 500 } },
    { id: 'tour2', test: function (s) { return s.cleared[2]; }, reward: { money: 500 } },
    { id: 'perfect100', goal: 100, prog: function (s) { return s.stats.perfects; }, reward: { money: 500 } },
    { id: 'wins50', goal: 50, prog: function (s) { return s.stats.wins; }, reward: { money: 600 } },
    { id: 'chain10', goal: 10, prog: function (s) { return s.stats.bestChain; }, reward: { money: 600 } },
    { id: 'ex1', goal: 1, prog: function (s) { return s.stats.exGot; }, reward: { money: 800 } },
    { id: 'stack5', goal: 5, prog: function (s) { return maxOf(s, function (o) { return o.stack; }); }, reward: { money: 800 } },
    { id: 'dex30', goal: 30, prog: function (s) { return P.ownedIds(s).length; }, reward: { money: 1000 } },
    { id: 'tour3', test: function (s) { return s.cleared[3]; }, reward: { money: 1500 } },
    { id: 'pulls200', goal: 200, prog: function (s) { return s.stats.pulls; }, reward: { money: 1000 } },
    { id: 'wins200', goal: 200, prog: function (s) { return s.stats.wins; }, reward: { money: 1500 } },
    { id: 'dex40', goal: 40, prog: function (s) { return P.ownedIds(s).length; }, reward: { money: 2000, pack: 'win_legend' } },
    { id: 'tour4', test: function (s) { return s.cleared[4]; }, reward: { money: 3000 } }
  ];
  /** 実績の今の状態：{ a, done（条件を満たした）, got（受け取った）, now, goal } の一覧 */
  P.achList = function (s) {
    return P.ACHIEVEMENTS.map(function (a) {
      var now = a.prog ? a.prog(s) : (a.test(s) ? 1 : 0), goal = a.goal || 1;
      return { a: a, now: Math.min(now, goal), goal: goal, done: now >= goal, got: !!s.ach[a.id] };
    });
  };
  /** 受け取れる実績の数 */
  P.achReady = function (s) { return P.achList(s).filter(function (x) { return x.done && !x.got; }).length; };
  /** ごほうびを受け取る */
  P.claimAch = function (s, id) {
    var x = P.achList(s).filter(function (y) { return y.a.id === id; })[0];
    if (!x || !x.done || x.got) return null;
    s.ach[id] = true;
    var r = x.a.reward;
    if (r.money) s.money += r.money;
    if (r.pack) s.packs[r.pack] = (s.packs[r.pack] || 0) + 1;
    return r;
  };

  // ---------------- 引き継ぎコード ----------------
  /** セーブを、コピーして貼れる文字の並びにする */
  P.exportCode = function (s) {
    var json = JSON.stringify(s);
    var b64 = typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(json))) : Buffer.from(json, 'utf8').toString('base64');
    return 'DD1-' + b64;
  };
  /** 引き継ぎコードからセーブを作る。読めなければ null */
  P.importCode = function (code) {
    try {
      var b64 = String(code).trim().replace(/^DD1-/, '').replace(/\s+/g, '');
      var json = typeof atob === 'function' ? decodeURIComponent(escape(atob(b64))) : Buffer.from(b64, 'base64').toString('utf8');
      var s = JSON.parse(json);
      if (!s || !s.owned || s.v !== SAVE_VER) return null;
      return P.fix(s);
    } catch (e) { return null; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
