/*
 * DINO DUEL バトルのルール（画面を使わない計算だけの部分）
 * 画面（battle-view.js）とシミュレーション（tools/sim.js）の両方がこれを使う。
 *
 *   var st = DN.Battle.create([...自分の3体], [...相手の3体], { aiLevel: 0 });
 *   var acts = DN.Battle.order(st, { 0: 技番号, 1: …, 3: … });   // uid → 0 か 1
 *   var res = DN.Battle.execute(st, act, { atk: 1.5, def: 0.8 });   // タイミング倍率
 *   DN.Battle.winner(st);  // 0 = 自分の勝ち / 1 = 相手の勝ち / null = まだ
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};
  var CFG = DN.CFG;

  var B = DN.Battle = {};

  /**
   * 1体ぶんの戦う恐竜を作る。
   * opts.statMul：全体の倍率（相手の強さ） / opts.bonus：{ hp, atk, def, spd }（レベル・重ね強化の上乗せ。段階2）
   */
  B.makeUnit = function (id, side, lane, opts) {
    opts = opts || {};
    var d = DN.dino(id), mul = opts.statMul || 1, bo = opts.bonus || {};
    var hp = Math.round((d.hp + (bo.hp || 0)) * mul);
    return {
      uid: side * 3 + lane, id: id, d: d, side: side, lane: lane,
      maxHp: hp, hp: hp,
      atk: (d.atk + (bo.atk || 0)) * mul,
      def: (d.def + (bo.def || 0)) * mul,
      spd: (d.spd + (bo.spd || 0)) * mul,
      dex: Math.max(CFG.DEX_MIN, Math.min(CFG.DEX_MAX, d.dex)),
      st: { atkUp: 0, defDown: 0, spdDown: 0 },
      alive: true
    };
  };

  B.create = function (teamA, teamB, opts) {
    opts = opts || {};
    var units = [];
    teamA.forEach(function (id, i) { units.push(B.makeUnit(id, 0, i, opts.a)); });
    teamB.forEach(function (id, i) { units.push(B.makeUnit(id, 1, i, opts.b)); });
    return { units: units, turn: 0, rand: opts.rand || Math.random };
  };

  B.side = function (st, side) { return st.units.filter(function (u) { return u.side === side && u.alive; }); };
  B.winner = function (st) {
    if (!B.side(st, 1).length) return 0;
    if (!B.side(st, 0).length) return 1;
    return null;
  };

  // ---- 能力の今の値（上げ下げを反映）----
  B.atkOf = function (u) { return u.atk * (1 + CFG.FX.atkUp * u.st.atkUp); };
  B.defOf = function (u) { return u.def * (1 - CFG.FX.defDown * u.st.defDown); };
  B.spdOf = function (u) { return u.spd * (1 - CFG.FX.spdDown * u.st.spdDown); };

  /** 攻撃相手：正面の相手を優先。正面が倒れていれば、残りのうち HP が最も低い相手 */
  B.target = function (st, actor) {
    var foes = B.side(st, 1 - actor.side);
    if (!foes.length) return null;
    for (var i = 0; i < foes.length; i++) if (foes[i].lane === actor.lane) return foes[i];
    foes.sort(function (a, b) { return a.hp - b.hp || a.lane - b.lane; });
    return foes[0];
  };
  B.targets = function (st, actor, mv) {
    if (mv.effect === 'aoe') return B.side(st, 1 - actor.side);
    var t = B.target(st, actor);
    return t ? [t] : [];
  };

  /** 行動順：先制技 → 素早さが速い順（同じならランダム） */
  B.order = function (st, choices) {
    var list = [];
    st.units.forEach(function (u) {
      if (!u.alive) return;
      var mi = choices[u.uid] || 0, mvId = u.d.moves[mi], mv = DN.move(mvId);
      // 同じ速さのときの順番：st.ties があればそれ（画面でターン中の予想と実際をそろえる）、なければその場でランダム
      var tie = st.ties ? st.ties[u.uid] : st.rand();
      list.push({ unit: u, moveIndex: mi, moveId: mvId, move: mv, pri: mv.effect === 'priority' ? 1 : 0, spd: B.spdOf(u), tie: tie });
    });
    list.sort(function (a, b) { return b.pri - a.pri || b.spd - a.spd || a.tie - b.tie; });
    return list;
  };

  /** 1回ぶんのダメージ */
  B.damage = function (st, actor, target, mv, atkMul, defMul) {
    var crit = st.rand() * 100 < actor.dex;
    var r = CFG.RAND_MIN + (CFG.RAND_MAX - CFG.RAND_MIN) * st.rand();
    var dmg = mv.power * (B.atkOf(actor) / B.defOf(target)) * CFG.DMG_K * r * (crit ? CFG.CRIT_MUL : 1) * atkMul * defMul;
    return { dmg: Math.max(1, Math.round(dmg)), crit: crit };
  };

  function hurt(u, dmg) {
    u.hp = Math.max(0, u.hp - dmg);
    if (u.hp <= 0) u.alive = false;
  }

  /**
   * 1体の行動を実行する。timing = { atk: 攻撃側の倍率, def: 受ける側の倍率 }
   * 結果：{ targets: [{ unit, miss, hits: [{dmg, crit}], total, fainted, debuff }], heal, recoil, buff, selfFainted }
   */
  B.execute = function (st, act, timing) {
    var u = act.unit, mv = act.move;
    var res = { actor: u, move: mv, targets: [], heal: 0, recoil: 0, buff: null, selfFainted: false };
    if (!u.alive) return res;
    var ts = B.targets(st, u, mv);
    var dealt = 0;
    var tm = timing || {};
    ts.forEach(function (t) {
      var defMul = typeof tm.def === 'function' ? tm.def(t) : (tm.def || 1);
      var r = { unit: t, miss: false, hits: [], total: 0, fainted: false, debuff: null };
      if (st.rand() * 100 >= mv.acc) {
        r.miss = true;
      } else {
        var n = mv.effect === 'double' ? 2 : 1;
        for (var i = 0; i < n && t.alive; i++) {
          var h = B.damage(st, u, t, mv, tm.atk || 1, defMul);
          hurt(t, h.dmg);
          r.hits.push(h); r.total += h.dmg;
        }
        dealt += r.total;
        r.fainted = !t.alive;
        if (t.alive && (mv.effect === 'defDown' || mv.effect === 'spdDown')) {
          if (t.st[mv.effect] < CFG.FX.stageMax) { t.st[mv.effect]++; r.debuff = mv.effect; }
        }
      }
      res.targets.push(r);
    });
    if (mv.effect === 'atkUp' && u.st.atkUp < CFG.FX.stageMax && dealt >= 0) { u.st.atkUp++; res.buff = 'atkUp'; }
    if (mv.effect === 'drain' && dealt > 0) {
      var before = u.hp;
      u.hp = Math.min(u.maxHp, u.hp + Math.round(dealt * CFG.FX.drain));
      res.heal = u.hp - before;
    }
    if (mv.effect === 'recoil' && dealt > 0) {
      res.recoil = Math.max(1, Math.round(dealt * CFG.FX.recoil));
      hurt(u, res.recoil);
      res.selfFainted = !u.alive;
    }
    return res;
  };

  // ---- 相手AI ----

  /** 技の選び方：だいたい強い方を選ぶが、ときどき効果つきの技も使う */
  B.aiChoose = function (st, u) {
    var foes = B.side(st, 1 - u.side);
    var t = B.target(st, u);
    var scores = u.d.moves.map(function (id) {
      var mv = DN.move(id), s = mv.power * mv.acc / 100;
      if (mv.effect === 'aoe') s *= Math.max(1, foes.length) * 0.9;
      if (mv.effect === 'double') s *= 2;
      if (mv.effect === 'recoil') s *= u.hp / u.maxHp > 0.35 ? 0.95 : 0.6;
      if (mv.effect === 'atkUp') s += u.st.atkUp < CFG.FX.stageMax ? 22 : 0;
      if (mv.effect === 'defDown') s += t && t.st.defDown < CFG.FX.stageMax ? 16 : 0;
      if (mv.effect === 'spdDown') s += t && t.st.spdDown < CFG.FX.stageMax ? 10 : 0;
      if (mv.effect === 'drain') s += u.hp / u.maxHp < 0.6 ? 26 : 6;
      if (mv.effect === 'priority') s += t && t.hp < t.maxHp * 0.3 ? 30 : 4;
      return s;
    });
    var best = scores[0] >= scores[1] ? 0 : 1;
    return st.rand() < 0.72 ? best : 1 - best;
  };

  /** AI のタイミング：p = { perfect, good } の確率で決める */
  B.aiTiming = function (st, p) {
    var r = st.rand();
    if (r < p.perfect) return 'perfect';
    if (r < p.perfect + p.good) return 'good';
    return 'miss';
  };
})(typeof window !== 'undefined' ? window : globalThis);
