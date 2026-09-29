/*
 * BGM の楽譜の確認（node tools/bgm-check.js）
 * ・どのパートも 16升（1小節）の倍数で、同じ曲のパートは同じ長さか（ずれて鳴らないか）
 * ・音名がすべて読めるか
 * ・メロディの拍の頭（1小節に4か所）の音が、その小節の和音（pad の和音）に入っているか。入っていない音を出す
 *   （経過音として入れているものもあるので、多すぎないかを見るめやす）
 */
require('../js/game/bgm.js');
var T = globalThis.DN.BGM_TRACKS, bad = 0;
Object.keys(T).forEach(function (name) {
  var tr = T[name], lens = tr.parts.map(function (p) { return p.ev.length; });
  var okLen = lens.every(function (l) { return l % 16 === 0 && tr.len % l === 0; });
  var badNotes = [];
  tr.parts.forEach(function (p) { p.ev.forEach(function (e) { if (e && e.notes && e.notes.some(function (f) { return !f; })) badNotes.push(p.inst + ':' + e.src); }); });
  var pc = function (f) { return Math.round(12 * Math.log2(f / 440) + 69) % 12; };
  var NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  var pad = tr.parts.filter(function (p) { return p.inst === 'pad'; })[0], off = [];
  if (pad) tr.parts.forEach(function (p) {
    if (!/lead|brass|soft|bell|chip/.test(p.inst)) return;
    p.ev.forEach(function (e, i) {
      if (!e || !e.notes || i % 4) return;
      var bar = Math.floor(i / 16), ch = pad.ev[bar * 16 % pad.ev.length];
      if (!ch || !ch.notes) return;
      var set = ch.notes.map(pc);
      if (set.indexOf(pc(e.notes[0])) < 0) off.push((bar + 1) + '小節' + (i % 16 / 4 + 1) + '拍 ' + e.src + '（和音 ' + ch.notes.map(function (f) { return NAMES[pc(f)]; }).join('') + '）');
    });
  });
  var sec = tr.len / 4 * 60 / tr.bpm;
  console.log((okLen && !badNotes.length ? 'OK  ' : 'NG  ') + name.padEnd(9) + ' bpm ' + tr.bpm + '  ' + (tr.len / 16) + '小節  ' + sec.toFixed(1) + '秒' +
    (tr.loop === false ? '（1回だけ → ' + tr.then + '）' : '（くり返し）') + '  パートの長さ ' + lens.join('/') + (badNotes.length ? '  読めない音: ' + badNotes.join(' ') : ''));
  if (off.length) console.log('      和音の外の音（拍の頭）' + off.length + '個: ' + off.join(' / '));
  if (!okLen || badNotes.length) bad++;
});
process.exit(bad ? 1 : 0);
