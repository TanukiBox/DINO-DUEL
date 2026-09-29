/*
 * DINO DUEL バランス確認用シミュレーション
 * ゲームと同じルール・データ（js/game/config.js, data.js, battle.js, progress.js）で、自動でたくさん遊ぶ。
 *
 *   node tools/sim.js            … 3つとも
 *   node tools/sim.js battle     … 1. バトル：大会の試合ごとの平均ターン数と勝率
 *   node tools/sim.js career     … 2. はじめからアドバンス優勝まで：バトル回数・パック回数・プレイ時間
 *   node tools/sim.js growth     … 3. マスター・レジェンドに勝つのに必要な強化のめやす
 *
 * プレイヤーのタイミングは「ふつうの人」（PLAYER の確率）。1戦・1パックの時間は TIME のめやす。
 */
'use strict';
var path = require('path');
['config.js', 'data.js', 'battle.js', 'progress.js'].forEach(function (f) {
  require(path.join(__dirname, '..', 'js', 'game', f));
});
var DN = globalThis.DN, B = DN.Battle, CFG = DN.CFG, P = DN.Progress;

var mode = process.argv[2] || 'all';
var PLAYER = { atk: { perfect: 0.35, good: 0.4 }, def: { perfect: 0.25, good: 0.4 } };
// 時間のめやす（秒）：1ターン = 技えらび＋6体の行動、1戦の前後の画面、パック1回（筐体の演出＋カードを見る）
var TIME = { turn: 18, battleExtra: 25, pack: 12 };

/** 1戦を自動で戦う。返り値 { won, turns } */
function battle(teamA, teamB, aiIdx, player) {
  var lv = CFG.AI_LEVELS[aiIdx];
  player = player || PLAYER;
  var st = B.create(teamA, teamB, {});
  var w = null;
  while (w === null && st.turn < 40) {
    st.turn++;
    var ch = {};
    st.units.forEach(function (u) { if (u.alive) ch[u.uid] = B.aiChoose(st, u); });
    var acts = B.order(st, ch);
    for (var i = 0; i < acts.length && w === null; i++) {
      var a = acts[i];
      if (!a.unit.alive) continue;
      var mine = a.unit.side === 0;
      var atk = mine ? CFG.ATK_TIMING[B.aiTiming(st, player.atk)] : CFG.ATK_TIMING[B.aiTiming(st, lv.atk)];
      var defP = mine ? lv.def : player.def;
      B.execute(st, a, { atk: atk, def: function () { return CFG.DEF_TIMING[B.aiTiming(st, defP)]; } });
      w = B.winner(st);
    }
  }
  return { won: w === 0, turns: st.turn };
}

function pct(x) { return (x * 100).toFixed(0).padStart(3) + '%'; }

// ---------------- 1. バトル ----------------
function simBattles() {
  console.log('\n■ 1. バトル（同じくらいの強さのチーム同士・各2000戦）');
  var N = 2000, ids = DN.DINOS.map(function (d) { return d.id; });
  DN.TOURNAMENTS.forEach(function (T, ti) {
    // 相手と同じレア度・レベルのランダムなチーム
    var wins = 0, turns = 0;
    for (var n = 0; n < N; n++) {
      var m = T.matches[n % T.matches.length];
      var mine = m.map(function (e) {
        var same = ids.filter(function (id) { return DN.dino(id).rarity === DN.dino(e.id).rarity; });
        return { id: same[Math.floor(Math.random() * same.length)], lv: e.lv, stack: e.stack };
      });
      var r = battle(mine, m, T.ai);
      if (r.won) wins++;
      turns += r.turns;
    }
    console.log('  ' + T.key.padEnd(9) + ' 平均ターン ' + (turns / N).toFixed(2) + '  勝率 ' + pct(wins / N) + '（相手AIのうまさだけ差がある）');
  });
}

// ---------------- 2. はじめからアドバンス優勝まで ----------------
function career(goal) {
  var s = P.newState();
  var battles = 0, turns = 0, packs = 0, byTour = [];
  var guard = 0;
  while (!s.cleared[goal] && guard++ < 2000) {
    // お金があるだけ全種パックを引き、優勝パックは開ける
    Object.keys(s.packs).forEach(function (k) { while (s.packs[k]) { P.openPrize(s, k); packs++; } });
    while (s.money >= DN.pack('all').price) { P.buy(s, 'all'); packs++; }
    s.team = P.bestTeam(s);
    // まだ優勝していない、いちばん上の大会に出る
    var t = s.cleared.indexOf(false);
    P.startRun(s, t);
    while (s.run) {
      var r = battle(P.teamSpecs(s), P.opponent(s), DN.TOURNAMENTS[t].ai);
      battles++; turns += r.turns;
      var res = P.finishMatch(s, r.won);
      if (res.champion) byTour[t] = { battles: battles, packs: packs, turns: turns };
    }
  }
  var min = (turns * TIME.turn + battles * TIME.battleExtra + packs * TIME.pack) / 60;
  return { battles: battles, packs: packs, minutes: min, byTour: byTour, state: s };
}

function simCareer() {
  console.log('\n■ 2. はじめからアドバンス優勝まで（ふつうのプレイヤー・300回の平均）');
  var N = 300, sum = { battles: 0, packs: 0, minutes: 0 }, mins = [], tours = [[], [], []];
  var lv = 0, stack = 0, owned = 0;
  for (var i = 0; i < N; i++) {
    var c = career(2);
    sum.battles += c.battles; sum.packs += c.packs; sum.minutes += c.minutes; mins.push(c.minutes);
    c.byTour.forEach(function (b, t) {
      tours[t].push((b.turns * TIME.turn + b.battles * TIME.battleExtra + b.packs * TIME.pack) / 60);
    });
    var tm = P.teamSpecs(c.state);
    tm.forEach(function (x) { lv += x.lv; stack += x.stack; });
    owned += P.ownedIds(c.state).length;
  }
  mins.sort(function (a, b) { return a - b; });
  console.log('  バトル ' + (sum.battles / N).toFixed(1) + ' 回・パック ' + (sum.packs / N).toFixed(1) + ' 回・プレイ時間 ' + (sum.minutes / N).toFixed(0) + ' 分' +
    '（早い人 ' + mins[Math.floor(N * 0.1)].toFixed(0) + ' 分〜遅い人 ' + mins[Math.floor(N * 0.9)].toFixed(0) + ' 分）');
  ['ビギナー', 'ノービス', 'アドバンス'].forEach(function (name, t) {
    var a = tours[t]; a.sort(function (x, y) { return x - y; });
    console.log('    ' + name + '優勝まで：約 ' + (a.reduce(function (x, y) { return x + y; }, 0) / a.length).toFixed(0) + ' 分');
  });
  console.log('  アドバンス優勝時のチーム：平均レベル ' + (lv / N / 3).toFixed(1) + '・平均重ね ' + (stack / N / 3).toFixed(1) + '・集めた種類 ' + (owned / N).toFixed(1) + ' / 40');
}

// ---------------- 3. マスター・レジェンドに必要な強化 ----------------
function simGrowth() {
  console.log('\n■ 3. マスター・レジェンドに必要な強化のめやす（チーム = SSR/SR の強い3体、各試合400戦）');
  var team = ['tyranno', 'spino', 'quetzal'];
  [3, 4].forEach(function (t) {
    var T = DN.TOURNAMENTS[t];
    console.log('  ' + T.key + '：');
    [[8, 0], [10, 0], [10, 2], [10, 4], [10, 6], [10, 8], [10, 10], [10, 12]].forEach(function (g) {
      var mine = team.map(function (id) { return { id: id, lv: g[0], stack: g[1] }; });
      var line = '    レベル' + String(g[0]).padStart(2) + '・重ね+' + String(g[1]).padEnd(2) + ' → 1戦ごとの勝率 ';
      var all = 1;
      T.matches.forEach(function (m) {
        var w = 0;
        for (var n = 0; n < 400; n++) if (battle(mine, m, T.ai).won) w++;
        line += pct(w / 400) + ' ';
        all *= w / 400;
      });
      console.log(line + '／ 通しで優勝 ' + pct(all));
    });
  });
  // アドバンス優勝時点のふつうのチームで挑んだら
  var c = career(2), tm = P.teamSpecs(c.state);
  console.log('  （参考）アドバンス優勝時点のチーム ' + tm.map(function (x) { return x.id + ' Lv' + x.lv + '+' + x.stack; }).join(', '));
  [3, 4].forEach(function (t) {
    var T = DN.TOURNAMENTS[t], all = 1, line = '    ' + T.key + ' ';
    T.matches.forEach(function (m) {
      var w = 0;
      for (var n = 0; n < 300; n++) if (battle(tm, m, T.ai).won) w++;
      line += pct(w / 300) + ' ';
      all *= w / 300;
    });
    console.log(line + '／ 通しで優勝 ' + pct(all));
  });
}

console.log('DINO DUEL シミュレーション');
if (mode === 'all' || mode === 'battle') simBattles();
if (mode === 'all' || mode === 'career') simCareer();
if (mode === 'all' || mode === 'growth') simGrowth();
