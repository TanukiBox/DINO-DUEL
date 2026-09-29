/*
 * DINO DUEL 進み具合（持っている恐竜・重ね数・レベル・賞金・大会）
 * 画面を使わない計算だけ。ゲーム（main.js など）とシミュレーション（tools/sim.js）の両方が使う。
 *
 * 状態（セーブされる中身）：
 *   { v, money, owned: { id: { stack, lv, xp } }, team: [id, id, id], cleared: [大会ごとの優勝], run: { t, m } | null,
 *     packs: { 優勝パックid: 未開封の数 }, stats: { wins, losses, pulls } }
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};
  var CFG = DN.CFG;
  var P = DN.Progress = {};
  var SAVE_VER = 2;

  P.newState = function () {
    var s = { v: SAVE_VER, money: CFG.START_MONEY, owned: {}, team: CFG.STARTERS.slice(), cleared: [false, false, false, false, false],
      run: null, packs: {}, stats: { wins: 0, losses: 0, pulls: 0 }, seenEx: {} };
    CFG.STARTERS.forEach(function (id) { s.owned[id] = { stack: 0, lv: 1, xp: 0 }; });
    return s;
  };
  /** 古いセーブや壊れたセーブを直す */
  P.fix = function (s) {
    if (!s || s.v !== SAVE_VER || !s.owned) return P.newState();
    var n = P.newState();
    Object.keys(n).forEach(function (k) { if (s[k] === undefined) s[k] = n[k]; });
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

  /** カードを1枚入れる。すでに持っていれば重ねる（+1） */
  P.addCard = function (s, id) {
    var o = s.owned[id];
    if (o) { o.stack++; return { id: id, isNew: false, stack: o.stack }; }
    s.owned[id] = { stack: 0, lv: 1, xp: 0 };
    return { id: id, isNew: true, stack: 0 };
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
  /** 1枚引く（rand = 0〜1 の乱数を返す関数） */
  P.draw = function (packId, rand) {
    rand = rand || Math.random;
    var pack = DN.pack(packId), r = rand() * 100, acc = 0, rarity = 'N';
    for (var i = 0; i < DN.RARITIES.length; i++) {
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
    s.stats.pulls++;
    var id = P.draw(packId, rand);
    return P.addCard(s, id);
  };
  /** もらった優勝パックを開ける */
  P.openPrize = function (s, packId, rand) {
    if (!s.packs[packId]) return null;
    s.packs[packId]--;
    s.stats.pulls++;
    return P.addCard(s, P.draw(packId, rand));
  };

  // ---------------- 大会 ----------------
  P.unlocked = function (s, t) { return !!s.debug || t === 0 || s.cleared[t - 1]; };
  /** 大会を始める（最初の試合から） */
  P.startRun = function (s, t) { s.run = { t: t, m: 0 }; return s.run; };
  /** 今の試合の相手 */
  P.opponent = function (s) { return s.run ? DN.TOURNAMENTS[s.run.t].matches[s.run.m] : null; };

  /**
   * 試合の結果を入れる。賞金・経験値はいつも残る（負けても）。
   * 返り値：{ won, prize, xp, levelUps: { id: 上がった数 }, champion, pack, next }
   */
  P.finishMatch = function (s, won) {
    var t = s.run.t, T = DN.TOURNAMENTS[t];
    var res = { won: won, prize: 0, xp: won ? CFG.XP_WIN[t] : CFG.XP_LOSE, levelUps: {}, champion: false, pack: null, first: false };
    s.team.forEach(function (id) { var n = P.gainXp(s, id, res.xp); if (n) res.levelUps[id] = n; });
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
})(typeof window !== 'undefined' ? window : globalThis);
