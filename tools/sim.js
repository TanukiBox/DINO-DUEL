/*
 * DINO DUEL バランス確認用シミュレーション
 * ゲームと同じルール・データ（js/game/config.js, data.js, battle.js）で、自動でたくさんバトルを回す。
 *
 *   node tools/sim.js            … 大会の強さごとに 3000 戦ずつ
 *   node tools/sim.js 10000      … 回数を変える
 *
 * プレイヤーのタイミングは「ふつうの人」を想定（PLAYER の確率）。
 */
'use strict';
var path = require('path');
['config.js', 'data.js', 'battle.js'].forEach(function (f) {
  require(path.join(__dirname, '..', 'js', 'game', f));
});
var DN = globalThis.DN, B = DN.Battle, CFG = DN.CFG;

var N = parseInt(process.argv[2], 10) || 3000;
// ふつうのプレイヤーのタイミング（ぴったり／おしいの確率）
var PLAYER = { atk: { perfect: 0.35, good: 0.4 }, def: { perfect: 0.25, good: 0.4 } };

function pick3(pool) {
  var a = pool.slice(), out = [];
  for (var i = 0; i < 3; i++) out.push(a.splice(Math.floor(Math.random() * a.length), 1)[0]);
  return out;
}

function run(levelIdx) {
  var lv = CFG.AI_LEVELS[levelIdx];
  var ids = DN.DINOS.map(function (d) { return d.id; });
  var wins = 0, turns = 0, turnHist = {};
  for (var n = 0; n < N; n++) {
    var st = B.create(pick3(ids), pick3(ids), { b: { statMul: lv.statMul } });
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
        var atk = mine ? CFG.ATK_TIMING[B.aiTiming(st, PLAYER.atk)] : CFG.ATK_TIMING[B.aiTiming(st, lv.atk)];
        var defP = mine ? lv.def : PLAYER.def;
        B.execute(st, a, { atk: atk, def: function () { return CFG.DEF_TIMING[B.aiTiming(st, defP)]; } });
        w = B.winner(st);
      }
    }
    if (w === 0) wins++;
    turns += st.turn;
    turnHist[st.turn] = (turnHist[st.turn] || 0) + 1;
  }
  var hist = Object.keys(turnHist).map(Number).sort(function (a, b) { return a - b; })
    .map(function (t) { return t + ':' + Math.round(turnHist[t] / N * 100) + '%'; }).join(' ');
  console.log(lv.key.padEnd(9) + ' 勝率 ' + (wins / N * 100).toFixed(1).padStart(5) + '%  平均ターン ' + (turns / N).toFixed(2) + '  [' + hist + ']');
}

console.log('DINO DUEL シミュレーション（' + N + ' 戦ずつ・チームはランダム）');
for (var i = 0; i < CFG.AI_LEVELS.length; i++) run(i);
