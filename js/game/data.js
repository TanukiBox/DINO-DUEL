/*
 * DINO DUEL ゲームデータ（恐竜・技）
 * 数字を変えるとそのままゲームとシミュレーション（tools/sim.js）に反映される。
 *
 * 恐竜 1体の書き方：
 *   id, name {ja, en}, rarity 'N'|'R'|'SR'|'SSR'|'EX',
 *   era 'triassic'|'jurassic'|'cretaceous'（三畳紀／ジュラ紀／白亜紀）,
 *   clan 'carnivore'|'herbivore'|'skysea'（肉食／草食／空と海）,
 *   hp 体力, atk 攻撃力, def 防御力, spd 素早さ（行動順）, dex 器用さ（クリティカル率 %）,
 *   moves [技id, 技id], art { 絵の型と色（js/game/art.js）}
 *
 * 技 1つの書き方：
 *   name {ja, en}, power 威力, acc 命中（%）, effect 効果（なし＝null）, anim 攻撃の動き（js/game/anims.js）
 *   効果：atkUp 攻撃アップ / defDown 防御ダウン / spdDown 素早さダウン / drain 回復 /
 *         aoe 全体攻撃 / priority 先制 / double 2回攻撃 / recoil 反動ダメージ
 *
 * ※段階1（バトル1戦）では9種だけ。段階2で40種にする。
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};

  DN.MOVES = {
    crush_fang:     { name: { ja: 'クラッシュファング', en: 'Crush Fang' },      power: 82, acc: 85,  effect: null, anim: 'crushBite' },
    tyrant_roar:    { name: { ja: '暴君のおたけび',     en: 'Tyrant Roar' },     power: 42, acc: 100, effect: 'atkUp', anim: 'roar' },
    sickle_flurry:  { name: { ja: 'かぎづめ連撃',       en: 'Sickle Flurry' },   power: 34, acc: 90,  effect: 'double', anim: 'flurry' },
    quick_nip:      { name: { ja: 'すばやいかみつき',   en: 'Quick Nip' },       power: 40, acc: 100, effect: 'priority', anim: 'quick' },
    trihorn_rush:   { name: { ja: 'トライホーン突進',   en: 'Tri-Horn Rush' },   power: 74, acc: 90,  effect: null, anim: 'charge' },
    horn_hoist:     { name: { ja: 'つのかちあげ',       en: 'Horn Hoist' },      power: 46, acc: 100, effect: 'defDown', anim: 'hoist' },
    tail_hammer:    { name: { ja: 'しっぽハンマー',     en: 'Tail Hammer' },     power: 80, acc: 80,  effect: null, anim: 'tailSmash' },
    armor_bash:     { name: { ja: 'よろいタックル',     en: 'Armor Bash' },      power: 44, acc: 100, effect: 'spdDown', anim: 'tackle' },
    spike_tail:     { name: { ja: 'スパイクテール',     en: 'Spike Tail' },      power: 72, acc: 85,  effect: null, anim: 'tailSmash' },
    plate_flash:    { name: { ja: '背板フラッシュ',     en: 'Plate Flash' },     power: 42, acc: 100, effect: 'defDown', anim: 'flash' },
    giga_stomp:     { name: { ja: 'ギガストンプ',       en: 'Giga Stomp' },      power: 32, acc: 100, effect: 'aoe', anim: 'stomp' },
    longneck_whip:  { name: { ja: 'ロングネックウィップ', en: 'Long-Neck Whip' }, power: 74, acc: 85,  effect: null, anim: 'whip' },
    sky_dive:       { name: { ja: '急降下ダイブ',       en: 'Sky Dive' },        power: 70, acc: 85,  effect: null, anim: 'dive' },
    wing_gust:      { name: { ja: 'つばさ突風',         en: 'Wing Gust' },       power: 30, acc: 100, effect: 'aoe', anim: 'gust' },
    longneck_bite:  { name: { ja: 'ロングネックバイト', en: 'Long-Neck Bite' },  power: 56, acc: 95,  effect: 'drain', anim: 'bite' },
    riptide_swirl:  { name: { ja: 'うずしおアタック',   en: 'Riptide Swirl' },   power: 30, acc: 100, effect: 'aoe', anim: 'swirl' },
    body_press:     { name: { ja: 'ボディプレス',       en: 'Body Press' },      power: 90, acc: 90,  effect: 'recoil', anim: 'press' },
    thumb_spike:    { name: { ja: '親指スパイク',       en: 'Thumb Spike' },     power: 46, acc: 100, effect: 'defDown', anim: 'stab' }
  };

  DN.DINOS = [
    {
      id: 'tyranno', name: { ja: 'ティラノサウルス', en: 'Tyrannosaurus' },
      rarity: 'SSR', era: 'cretaceous', clan: 'carnivore',
      hp: 250, atk: 98, def: 70, spd: 55, dex: 22,
      moves: ['crush_fang', 'tyrant_roar'],
      art: { type: 'theropod', head: 'big', body: '#9a6440', belly: '#efcf9c', mark: '#5e3a22', pattern: 'stripes', eye: '#f2c230' }
    },
    {
      id: 'raptor', name: { ja: 'ヴェロキラプトル', en: 'Velociraptor' },
      rarity: 'N', era: 'cretaceous', clan: 'carnivore',
      hp: 160, atk: 66, def: 50, spd: 96, dex: 34,
      moves: ['sickle_flurry', 'quick_nip'],
      art: { type: 'theropod', head: 'slim', body: '#c99a4e', belly: '#f6e4b6', mark: '#7a4f28', pattern: 'spots', size: 0.82, extras: ['feathers'], accent: '#6a8fb8', eye: '#e8d040' }
    },
    {
      id: 'triceratops', name: { ja: 'トリケラトプス', en: 'Triceratops' },
      rarity: 'SR', era: 'cretaceous', clan: 'herbivore',
      hp: 245, atk: 80, def: 88, spd: 38, dex: 12,
      moves: ['trihorn_rush', 'horn_hoist'],
      art: { type: 'ceratops', horns: 'tri', body: '#6f935a', belly: '#dfdca4', mark: '#46623a', pattern: 'bands', accent: '#e07a3a' }
    },
    {
      id: 'ankylo', name: { ja: 'アンキロサウルス', en: 'Ankylosaurus' },
      rarity: 'R', era: 'cretaceous', clan: 'herbivore',
      hp: 225, atk: 64, def: 100, spd: 26, dex: 10,
      moves: ['tail_hammer', 'armor_bash'],
      art: { type: 'armored', body: '#9a8660', belly: '#e2d3a8', mark: '#6b5a3e', pattern: 'none', accent: '#5a4a36' }
    },
    {
      id: 'stego', name: { ja: 'ステゴサウルス', en: 'Stegosaurus' },
      rarity: 'N', era: 'jurassic', clan: 'herbivore',
      hp: 205, atk: 70, def: 72, spd: 36, dex: 12,
      moves: ['spike_tail', 'plate_flash'],
      art: { type: 'plated', body: '#7d9c4a', belly: '#ebe4ac', mark: '#56722e', pattern: 'spots', accent: '#dc5a3a' }
    },
    {
      id: 'brachio', name: { ja: 'ブラキオサウルス', en: 'Brachiosaurus' },
      rarity: 'SR', era: 'jurassic', clan: 'herbivore',
      hp: 300, atk: 74, def: 74, spd: 22, dex: 8,
      moves: ['longneck_whip', 'giga_stomp'],
      art: { type: 'sauropod', body: '#6f8fa6', belly: '#dfe3d2', mark: '#4c6679', pattern: 'spots' }
    },
    {
      id: 'iguano', name: { ja: 'イグアノドン', en: 'Iguanodon' },
      rarity: 'N', era: 'cretaceous', clan: 'herbivore',
      hp: 200, atk: 70, def: 62, spd: 50, dex: 15,
      moves: ['body_press', 'thumb_spike'],
      art: { type: 'ornithopod', body: '#84904e', belly: '#e6dfa8', mark: '#5a6236', pattern: 'stripes', accent: '#d9b458' }
    },
    {
      id: 'pterano', name: { ja: 'プテラノドン', en: 'Pteranodon' },
      rarity: 'R', era: 'cretaceous', clan: 'skysea',
      hp: 175, atk: 70, def: 55, spd: 92, dex: 26,
      moves: ['sky_dive', 'wing_gust'],
      art: { type: 'pterosaur', body: '#b86a4c', belly: '#f4d6b4', mark: '#7c4230', pattern: 'none', accent: '#e24a3a', wing: '#d9925e' }
    },
    {
      id: 'elasmo', name: { ja: 'エラスモサウルス', en: 'Elasmosaurus' },
      rarity: 'R', era: 'cretaceous', clan: 'skysea',
      hp: 200, atk: 74, def: 60, spd: 62, dex: 20,
      moves: ['longneck_bite', 'riptide_swirl'],
      art: { type: 'plesiosaur', body: '#3f8090', belly: '#d2eadc', mark: '#285866', pattern: 'spots' }
    }
  ];

  DN.RARITIES = ['N', 'R', 'SR', 'SSR', 'EX'];

  var byId = {};
  DN.DINOS.forEach(function (d) { byId[d.id] = d; });
  DN.dino = function (id) { return byId[id]; };
  DN.move = function (id) { return DN.MOVES[id]; };
})(typeof window !== 'undefined' ? window : globalThis);
