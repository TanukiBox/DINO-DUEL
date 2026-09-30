/*
 * DINO DUEL ゲームデータ（恐竜・技・コンボ・パック・大会）
 * 数字を変えるとそのままゲームとシミュレーション（tools/sim.js）に反映される。
 *
 * 恐竜 1体の書き方：
 *   id, name {ja, en}, rarity 'N'|'R'|'SR'|'SSR'|'EX'（種ごとに固定）,
 *   era 'triassic'|'jurassic'|'cretaceous'（三畳紀／ジュラ紀／白亜紀）,
 *   clan 'carnivore'|'herbivore'|'skysea'（肉食／草食／空と海）,
 *   hp 体力, atk 攻撃力, def 防御力, spd 素早さ（行動順）, dex 器用さ（クリティカル率 %、5〜40）,
 *   moves [技id, 技id], art { 絵の型と色（描きこみ版がない恐竜の予備の絵。js/game/art.js）}
 *
 * 技 1つの書き方：
 *   name {ja, en}, power 威力, acc 命中（%）, effect 効果（なし＝null）, anim 攻撃の動き（js/game/anims.js）
 *   効果：atkUp 攻撃アップ / defDown 防御ダウン / spdDown 素早さダウン / drain 回復 /
 *         aoe 全体攻撃 / priority 先制 / double 2回攻撃 / recoil 反動ダメージ
 *   効果の説明（日英）は lang.js の desc_効果名。技ごとに変えたいときは desc {ja, en} を足す。
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};

  function mv(ja, en, power, acc, effect, anim) { return { name: { ja: ja, en: en }, power: power, acc: acc, effect: effect, anim: anim }; }

  DN.MOVES = {
    // ---- 肉食 ----
    crush_fang:     mv('クラッシュファング', 'Crush Fang', 100, 85, null, 'crushBite'),
    tyrant_roar:    mv('暴君のおたけび', 'Tyrant Roar', 51, 100, 'atkUp', 'roar'),
    sail_slash:     mv('セイルスラッシュ', 'Sail Slash', 95, 88, null, 'whip'),
    river_hunt:     mv('リバーハント', 'River Hunt', 66, 95, 'drain', 'bite'),
    giganto_bite:   mv('ギガントバイト', 'Giganto Bite', 105, 80, null, 'crushBite'),
    rampage:        mv('ランページ', 'Rampage', 112, 90, 'recoil', 'charge'),
    bull_ram:       mv('ブルホーンラム', 'Bull-Horn Ram', 90, 90, null, 'charge'),
    gale_dash:      mv('疾風のひとかみ', 'Gale Bite', 54, 100, 'priority', 'quick'),
    leaping_talon:  mv('ハイジャンプクロー', 'Leaping Talon', 46, 90, 'double', 'flurry'),
    pack_call:      mv('群れの号令', 'Pack Call', 51, 100, 'atkUp', 'roar'),
    hatchet_bite:   mv('ハチェットバイト', 'Hatchet Bite', 95, 85, null, 'bite'),
    rending_rush:   mv('切りさきラッシュ', 'Rending Rush', 41, 90, 'double', 'flurry'),
    crest_butt:     mv('ツインクレスト頭突き', 'Twin-Crest Butt', 83, 90, null, 'tackle'),
    threat_dance:   mv('いかくのステップ', 'Threat Step', 49, 100, 'spdDown', 'roar'),
    fisher_claw:    mv('フィッシャークロー', 'Fisher Claw', 88, 90, null, 'stab'),
    shore_snap:     mv('水辺のひとかみ', 'Shoreline Snap', 61, 95, 'drain', 'bite'),
    sickle_flurry:  mv('かぎづめ連撃', 'Sickle Flurry', 41, 90, 'double', 'flurry'),
    quick_nip:      mv('すばやいかみつき', 'Quick Nip', 49, 100, 'priority', 'quick'),
    twin_kick:      mv('ダブルキック', 'Twin Kick', 39, 90, 'double', 'flurry'),
    pounce:         mv('とびかかり', 'Pounce', 78, 85, null, 'press'),
    speed_snap:     mv('スピードスナップ', 'Speed Snap', 51, 100, 'priority', 'quick'),
    swarm_feint:    mv('群れのかく乱', 'Swarm Feint', 34, 100, 'aoe', 'gust'),
    nip_nip:        mv('チクチクかみつき', 'Nip Nip', 37, 95, 'double', 'bite'),
    zigzag:         mv('ジグザグ走り', 'Zigzag Run', 44, 100, 'spdDown', 'quick'),
    triassic_fang:  mv('太古のキバ', 'Primeval Fang', 83, 88, null, 'bite'),
    low_strike:     mv('低いかまえの一撃', 'Low-Stance Strike', 54, 100, 'defDown', 'stab'),
    horn_crusher:   mv('ホーンクラッシャー', 'Horn Crusher', 115, 85, null, 'charge'),
    kings_thunder:  mv('覇王の雷鳴', 'Thunder of Kings', 56, 100, 'aoe', 'roar'),

    // ---- 草食 ----
    trihorn_rush:   mv('トライホーン突進', 'Tri-Horn Rush', 62, 90, null, 'charge'),
    horn_hoist:     mv('つのかちあげ', 'Horn Hoist', 39, 100, 'defDown', 'hoist'),
    longneck_whip:  mv('ロングネックウィップ', 'Long-Neck Whip', 62, 85, null, 'whip'),
    giga_stomp:     mv('ギガストンプ', 'Giga Stomp', 27, 100, 'aoe', 'stomp'),
    spine_curtain:  mv('トゲのカーテン', 'Spine Curtain', 37, 100, 'defDown', 'flash'),
    neck_sweep:     mv('ネックスイープ', 'Neck Sweep', 29, 100, 'aoe', 'whip'),
    frill_rush:     mv('スパイクフリル突進', 'Spike-Frill Rush', 66, 88, null, 'charge'),
    horn_upper:     mv('角のアッパー', 'Horn Uppercut', 40, 100, 'spdDown', 'hoist'),
    scythe_claws:   mv('サイスクロー', 'Scythe Claws', 34, 90, 'double', 'flurry'),
    scythe_storm:   mv('大鎌旋風', 'Scythe Cyclone', 35, 100, 'aoe', 'gust'),
    tail_hammer:    mv('しっぽハンマー', 'Tail Hammer', 67, 80, null, 'tailSmash'),
    armor_bash:     mv('よろいタックル', 'Armor Bash', 37, 100, 'spdDown', 'tackle'),
    trumpet_call:   mv('トランペットコール', 'Trumpet Call', 25, 100, 'aoe', 'roar'),
    tail_swat:      mv('しっぽはたき', 'Tail Swat', 55, 90, null, 'tailSmash'),
    whip_crack:     mv('ムチしっぽ', 'Whip Crack', 60, 85, null, 'tailSmash'),
    ground_tremor:  mv('大地ゆらし', 'Ground Tremor', 25, 100, 'aoe', 'stomp'),
    dome_slam:      mv('ドームずつき', 'Dome Slam', 71, 90, 'recoil', 'charge'),
    hard_head:      mv('石頭ガード', 'Stonehead Bash', 35, 100, 'defDown', 'tackle'),
    spike_tail:     mv('スパイクテール', 'Spike Tail', 60, 85, null, 'tailSmash'),
    plate_flash:    mv('背板フラッシュ', 'Plate Flash', 35, 100, 'defDown', 'flash'),
    body_press:     mv('ボディプレス', 'Body Press', 76, 90, 'recoil', 'press'),
    thumb_spike:    mv('親指スパイク', 'Thumb Spike', 39, 100, 'defDown', 'stab'),
    beak_bite:      mv('くちばしかみつき', 'Beak Bite', 52, 95, null, 'bite'),
    frill_bash:     mv('えりかざりアタック', 'Frill Bash', 34, 100, 'spdDown', 'tackle'),
    shoulder_spike: mv('肩のトゲ', 'Shoulder Spike', 55, 88, null, 'stab'),
    spike_flail:    mv('トゲしっぽ乱れ打ち', 'Spike Flail', 25, 95, 'double', 'tailSmash'),
    rearing_press:  mv('立ちあがりプレス', 'Rearing Press', 62, 88, null, 'press'),
    leaf_munch:     mv('むしゃむしゃアタック', 'Munch Attack', 35, 100, 'drain', 'bite'),
    fortress_hammer: mv('フォートレスハンマー', 'Fortress Hammer', 77, 85, null, 'tailSmash'),
    bastion_quake:  mv('城壁の大地震', 'Bastion Quake', 37, 100, 'aoe', 'stomp'),

    // ---- 空と海 ----
    sky_dive:       mv('急降下ダイブ', 'Sky Dive', 68, 85, null, 'dive'),
    wing_gust:      mv('つばさ突風', 'Wing Gust', 29, 100, 'aoe', 'gust'),
    longneck_bite:  mv('ロングネックバイト', 'Long-Neck Bite', 54, 95, 'drain', 'bite'),
    riptide_swirl:  mv('うずしおアタック', 'Riptide Swirl', 29, 100, 'aoe', 'swirl'),
    titan_dive:     mv('巨翼の急降下', 'Titan Dive', 81, 85, null, 'dive'),
    sky_tempest:    mv('天空の嵐', 'Sky Tempest', 39, 100, 'aoe', 'gust'),
    abyss_bite:     mv('アビスバイト', 'Abyss Bite', 83, 85, null, 'crushBite'),
    maelstrom:      mv('大渦潮', 'Maelstrom', 41, 100, 'aoe', 'swirl'),
    deep_jaws:      mv('深海の大アゴ', 'Deep Jaws', 60, 95, 'drain', 'bite'),
    flipper_slam:   mv('ヒレの一撃', 'Flipper Slam', 74, 88, null, 'whip'),
    crest_flash:    mv('トサカのきらめき', 'Crest Flash', 39, 100, 'defDown', 'flash'),
    skim_strike:    mv('かすめ飛び', 'Skim Strike', 43, 100, 'priority', 'quick'),
    vane_tail:      mv('ひし形しっぽ', 'Vane Tail', 56, 92, null, 'whip'),
    fishing_dive:   mv('魚とりダイブ', 'Fishing Dive', 29, 95, 'double', 'dive'),
    torpedo_ram:    mv('魚雷タックル', 'Torpedo Ram', 62, 90, null, 'charge'),
    splash_leap:    mv('しぶきジャンプ', 'Splash Leap', 27, 100, 'aoe', 'swirl'),
    bigbeak_chomp:  mv('大くちばしのひとかみ', 'Big-Beak Chomp', 60, 90, null, 'bite'),
    whirlwind:      mv('つむじ風', 'Whirlwind', 27, 100, 'aoe', 'gust'),
    needle_teeth:   mv('針のような歯', 'Needle Teeth', 56, 95, null, 'bite'),
    spray_shot:     mv('水しぶきショット', 'Spray Shot', 39, 100, 'spdDown', 'swirl'),
    skyocean_fang:  mv('天海の牙', 'Sky-Ocean Fang', 89, 85, null, 'dive'),
    levia_storm:    mv('リヴァイアストーム', 'Levia Storm', 45, 100, 'aoe', 'swirl')
  };

  function dino(id, ja, en, rarity, era, clan, st, moves, art) {
    return { id: id, name: { ja: ja, en: en }, rarity: rarity, era: era, clan: clan,
      hp: st[0], atk: st[1], def: st[2], spd: st[3], dex: st[4], moves: moves, art: art };
  }
  var T = 'triassic', J = 'jurassic', K = 'cretaceous';
  var CA = 'carnivore', HE = 'herbivore', SS = 'skysea';

  DN.DINOS = [
    // ================= 肉食 =================
    dino('tyranno', 'ティラノサウルス', 'Tyrannosaurus', 'SSR', K, CA, [260, 100, 72, 56, 22], ['crush_fang', 'tyrant_roar'],
      { type: 'theropod', head: 'big', body: '#b4562d', belly: '#f2d6a2', mark: '#33130b', pattern: 'stripes', eye: '#ffd23a' }),
    dino('spino', 'スピノサウルス', 'Spinosaurus', 'SSR', K, CA, [250, 96, 70, 64, 24], ['sail_slash', 'river_hunt'],
      { type: 'theropod', head: 'slim', body: '#4d7a8c', belly: '#e6e0c4', mark: '#23404c', pattern: 'spots', extras: ['sail'], accent: '#d8542c' }),
    dino('giga', 'ギガノトサウルス', 'Giganotosaurus', 'SR', K, CA, [270, 92, 66, 50, 18], ['giganto_bite', 'rampage'],
      { type: 'theropod', head: 'big', body: '#8a8a7a', belly: '#e8e2cc', mark: '#4a4a3e', pattern: 'stripes' }),
    dino('carno', 'カルノタウルス', 'Carnotaurus', 'SR', K, CA, [220, 86, 62, 78, 20], ['bull_ram', 'gale_dash'],
      { type: 'theropod', head: 'big', body: '#b83c2c', belly: '#f0d0a8', mark: '#5a1a12', pattern: 'spots', extras: ['horns'], accent: '#3a1a12' }),
    dino('utah', 'ユタラプトル', 'Utahraptor', 'SR', K, CA, [215, 84, 60, 86, 32], ['leaping_talon', 'pack_call'],
      { type: 'theropod', head: 'slim', body: '#6a5a8a', belly: '#e8e0f0', mark: '#3a2e54', pattern: 'stripes', extras: ['feathers'], accent: '#e8a030' }),
    dino('allo', 'アロサウルス', 'Allosaurus', 'R', J, CA, [215, 80, 64, 58, 20], ['hatchet_bite', 'rending_rush'],
      { type: 'theropod', head: 'big', body: '#c28a4a', belly: '#f4e0b8', mark: '#6a3e1a', pattern: 'stripes', extras: ['horns'], accent: '#a83a1c' }),
    dino('dilo', 'ディロフォサウルス', 'Dilophosaurus', 'R', J, CA, [190, 74, 56, 70, 26], ['crest_butt', 'threat_dance'],
      { type: 'theropod', head: 'slim', body: '#8aa040', belly: '#f0ecb8', mark: '#4a5a1c', pattern: 'spots', extras: ['crest'], accent: '#e05a2a' }),
    dino('baryonyx', 'バリオニクス', 'Baryonyx', 'R', K, CA, [205, 78, 62, 56, 22], ['fisher_claw', 'shore_snap'],
      { type: 'theropod', head: 'slim', body: '#5a7a5a', belly: '#e4ead0', mark: '#2e4a32', pattern: 'stripes' }),
    dino('raptor', 'ヴェロキラプトル', 'Velociraptor', 'N', K, CA, [160, 66, 50, 96, 34], ['sickle_flurry', 'quick_nip'],
      { type: 'theropod', head: 'slim', body: '#c99a4e', belly: '#f6e4b6', mark: '#7a4f28', pattern: 'spots', size: 0.82, extras: ['feathers'], accent: '#6a8fb8', eye: '#e8d040' }),
    dino('deinony', 'デイノニクス', 'Deinonychus', 'N', K, CA, [165, 64, 52, 88, 30], ['twin_kick', 'pounce'],
      { type: 'theropod', head: 'slim', body: '#6a6a70', belly: '#e6e6e0', mark: '#2e2e34', pattern: 'stripes', size: 0.86, extras: ['feathers'], accent: '#d83a2a' }),
    dino('coelo', 'コエロフィシス', 'Coelophysis', 'N', T, CA, [150, 60, 44, 90, 28], ['speed_snap', 'swarm_feint'],
      { type: 'theropod', head: 'slim', body: '#d8b048', belly: '#f8ecc0', mark: '#8a5a1a', pattern: 'stripes', size: 0.8 }),
    dino('compy', 'コンプソグナトゥス', 'Compsognathus', 'N', J, CA, [140, 56, 42, 98, 36], ['nip_nip', 'zigzag'],
      { type: 'theropod', head: 'slim', body: '#7aa84a', belly: '#eef4c8', mark: '#3a5a1a', pattern: 'spots', size: 0.66 }),
    dino('herrera', 'ヘレラサウルス', 'Herrerasaurus', 'N', T, CA, [175, 68, 50, 70, 24], ['triassic_fang', 'low_strike'],
      { type: 'theropod', head: 'slim', body: '#a8583a', belly: '#f0d4b0', mark: '#5a2a18', pattern: 'spots', size: 0.9 }),
    dino('tyranoceras', 'ティラノケラス', 'Tyranoceras', 'EX', K, CA, [305, 108, 92, 62, 28], ['horn_crusher', 'kings_thunder'],
      { type: 'theropod', head: 'big', body: '#3a2a4a', belly: '#e8d8a0', mark: '#ffcf40', pattern: 'stripes', extras: ['horns'], accent: '#ffcf40' }),

    // ================= 草食 =================
    dino('triceratops', 'トリケラトプス', 'Triceratops', 'SR', K, HE, [245, 80, 88, 38, 12], ['trihorn_rush', 'horn_hoist'],
      { type: 'ceratops', horns: 'tri', body: '#6f935a', belly: '#dfdca4', mark: '#46623a', pattern: 'bands', accent: '#e07a3a' }),
    dino('brachio', 'ブラキオサウルス', 'Brachiosaurus', 'SR', J, HE, [300, 74, 74, 22, 8], ['longneck_whip', 'giga_stomp'],
      { type: 'sauropod', body: '#6f8fa6', belly: '#dfe3d2', mark: '#4c6679', pattern: 'spots' }),
    dino('amarga', 'アマルガサウルス', 'Amargasaurus', 'SR', K, HE, [260, 76, 84, 40, 14], ['spine_curtain', 'neck_sweep'],
      { type: 'sauropod', body: '#b88a5a', belly: '#f0e0c0', mark: '#6a4a2a', pattern: 'bands', accent: '#5a3a2a' }),
    dino('styraco', 'スティラコサウルス', 'Styracosaurus', 'SR', K, HE, [230, 84, 82, 46, 16], ['frill_rush', 'horn_upper'],
      { type: 'ceratops', horns: 'spiky', body: '#9a7a4a', belly: '#ecdcae', mark: '#5a4424', pattern: 'bands', accent: '#c83a2a' }),
    dino('therizino', 'テリジノサウルス', 'Therizinosaurus', 'SSR', K, HE, [280, 94, 80, 42, 26], ['scythe_claws', 'scythe_storm'],
      { type: 'ornithopod', body: '#8a6a9a', belly: '#f0e4f0', mark: '#4a3458', pattern: 'stripes', accent: '#f0e4c8' }),
    dino('ankylo', 'アンキロサウルス', 'Ankylosaurus', 'R', K, HE, [225, 64, 100, 26, 10], ['tail_hammer', 'armor_bash'],
      { type: 'armored', body: '#9a8660', belly: '#e2d3a8', mark: '#6b5a3e', pattern: 'none', accent: '#5a4a36' }),
    dino('parasaur', 'パラサウロロフス', 'Parasaurolophus', 'R', K, HE, [210, 66, 70, 52, 16], ['trumpet_call', 'tail_swat'],
      { type: 'ornithopod', head: 'tube', body: '#5a8aa0', belly: '#e0ecec', mark: '#2e5264', pattern: 'stripes', accent: '#e0703a' }),
    dino('diplo', 'ディプロドクス', 'Diplodocus', 'R', J, HE, [270, 70, 66, 24, 10], ['whip_crack', 'ground_tremor'],
      { type: 'sauropod', head: 'flat', body: '#8a9a6a', belly: '#ececd0', mark: '#4a5a34', pattern: 'bands' }),
    dino('pachy', 'パキケファロサウルス', 'Pachycephalosaurus', 'R', K, HE, [190, 76, 78, 56, 18], ['dome_slam', 'hard_head'],
      { type: 'ornithopod', head: 'dome', body: '#c07a4a', belly: '#f4dcc0', mark: '#6a3a1a', pattern: 'spots', accent: '#8a4a2a' }),
    dino('stego', 'ステゴサウルス', 'Stegosaurus', 'N', J, HE, [205, 70, 72, 36, 12], ['spike_tail', 'plate_flash'],
      { type: 'plated', body: '#7d9c4a', belly: '#ebe4ac', mark: '#56722e', pattern: 'spots', accent: '#dc5a3a' }),
    dino('iguano', 'イグアノドン', 'Iguanodon', 'N', K, HE, [200, 70, 62, 50, 15], ['body_press', 'thumb_spike'],
      { type: 'ornithopod', body: '#84904e', belly: '#e6dfa8', mark: '#5a6236', pattern: 'stripes', accent: '#d9b458' }),
    dino('proto', 'プロトケラトプス', 'Protoceratops', 'N', K, HE, [170, 60, 66, 52, 16], ['beak_bite', 'frill_bash'],
      { type: 'ceratops', horns: 'none', body: '#c8a86a', belly: '#f4e8c8', mark: '#7a5a2a', pattern: 'spots', size: 0.8, accent: '#b8704a' }),
    dino('kentro', 'ケントロサウルス', 'Kentrosaurus', 'N', J, HE, [185, 62, 74, 40, 14], ['shoulder_spike', 'spike_flail'],
      { type: 'plated', body: '#a0904a', belly: '#f0e8c0', mark: '#5a4e24', pattern: 'bands', accent: '#e8dcb0', size: 0.9 }),
    dino('plateo', 'プラテオサウルス', 'Plateosaurus', 'N', T, HE, [195, 60, 58, 44, 12], ['rearing_press', 'leaf_munch'],
      { type: 'ornithopod', body: '#b89a5a', belly: '#f4ead0', mark: '#6a5230', pattern: 'bands', accent: '#d8c090' }),
    dino('gaiafort', 'ガイアフォートレス', 'Gaia Fortress', 'EX', J, HE, [320, 96, 108, 40, 20], ['fortress_hammer', 'bastion_quake'],
      { type: 'armored', body: '#4a6a5a', belly: '#e0e8d0', mark: '#2a3a30', pattern: 'none', accent: '#6ae0c8' }),

    // ================= 空と海 =================
    dino('quetzal', 'ケツァルコアトルス', 'Quetzalcoatlus', 'SSR', K, SS, [240, 92, 64, 90, 28], ['titan_dive', 'sky_tempest'],
      { type: 'pterosaur', body: '#e0e0d8', belly: '#f8f8f0', mark: '#8a8a80', pattern: 'none', accent: '#d8382c', wing: '#c8a070' }),
    dino('mosa', 'モササウルス', 'Mosasaurus', 'SSR', K, SS, [285, 98, 74, 60, 20], ['abyss_bite', 'maelstrom'],
      { type: 'plesiosaur', body: '#2a5a8a', belly: '#dce8f0', mark: '#163a5a', pattern: 'spots' }),
    dino('liopleuro', 'リオプレウロドン', 'Liopleurodon', 'SR', J, SS, [275, 90, 68, 48, 18], ['deep_jaws', 'flipper_slam'],
      { type: 'plesiosaur', body: '#4a4a6a', belly: '#e0e0ec', mark: '#2a2a44', pattern: 'spots' }),
    dino('pterano', 'プテラノドン', 'Pteranodon', 'R', K, SS, [175, 70, 55, 92, 26], ['sky_dive', 'wing_gust'],
      { type: 'pterosaur', body: '#b86a4c', belly: '#f4d6b4', mark: '#7c4230', pattern: 'none', accent: '#e24a3a', wing: '#d9925e' }),
    dino('elasmo', 'エラスモサウルス', 'Elasmosaurus', 'R', K, SS, [200, 74, 60, 62, 20], ['longneck_bite', 'riptide_swirl'],
      { type: 'plesiosaur', body: '#3f8090', belly: '#d2eadc', mark: '#285866', pattern: 'spots' }),
    dino('tapejara', 'タペヤラ', 'Tapejara', 'R', K, SS, [185, 70, 58, 86, 24], ['crest_flash', 'skim_strike'],
      { type: 'pterosaur', body: '#5a7a4a', belly: '#eef0d8', mark: '#34462a', pattern: 'none', accent: '#e8403a', wing: '#8ab86a' }),
    dino('rhampho', 'ランフォリンクス', 'Rhamphorhynchus', 'N', J, SS, [150, 60, 46, 92, 30], ['vane_tail', 'fishing_dive'],
      { type: 'pterosaur', body: '#8a6a4a', belly: '#f0e4d0', mark: '#4a3424', pattern: 'none', accent: '#e8b040', wing: '#c89868' }),
    dino('ichthyo', 'イクチオサウルス', 'Ichthyosaurus', 'N', J, SS, [170, 62, 52, 84, 22], ['torpedo_ram', 'splash_leap'],
      { type: 'plesiosaur', body: '#5a8ab0', belly: '#e8f0f4', mark: '#2e5474', pattern: 'none' }),
    dino('dimorpho', 'ディモルフォドン', 'Dimorphodon', 'N', J, SS, [155, 62, 48, 86, 28], ['bigbeak_chomp', 'whirlwind'],
      { type: 'pterosaur', body: '#3a3a44', belly: '#e8e0d0', mark: '#1a1a22', pattern: 'none', accent: '#e8c040', wing: '#6a6a78' }),
    dino('notho', 'ノトサウルス', 'Nothosaurus', 'N', T, SS, [165, 62, 54, 66, 20], ['needle_teeth', 'spray_shot'],
      { type: 'plesiosaur', body: '#6a8a5a', belly: '#e8f0dc', mark: '#3a5230', pattern: 'spots' }),
    dino('leviawing', 'リヴァイアウイング', 'Leviawing', 'EX', K, SS, [295, 102, 84, 78, 26], ['skyocean_fang', 'levia_storm'],
      { type: 'plesiosaur', body: '#1a3a6a', belly: '#d8f0ff', mark: '#40e0ff', pattern: 'spots' })
  ];

  DN.RARITIES = ['N', 'R', 'SR', 'SSR', 'EX'];
  DN.CLANS = ['carnivore', 'herbivore', 'skysea'];
  DN.ERAS = ['triassic', 'jurassic', 'cretaceous'];

  /**
   * コンボ：チームの3体が条件を満たすと、3体全員の能力が上がる（複数のコンボが同時に発動することもある）
   *   when：{ era: 'triassic' } 同じ時代の3体 / { clan: 'carnivore' } 同じ仲間の3体 / { ids: [...] } 特定の3体
   *   up：上がる能力と割合（0.15 = 15%）
   */
  DN.COMBOS = [
    { id: 'dawn',     name: { ja: '三畳紀の夜明け', en: 'Triassic Dawn' },    when: { era: 'triassic' },   up: { hp: 0.15, atk: 0.15, def: 0.15, spd: 0.15 } },
    { id: 'forest',   name: { ja: 'ジュラの大森林', en: 'Jurassic Forest' },  when: { era: 'jurassic' },   up: { hp: 0.12, def: 0.12 } },
    { id: 'rule',     name: { ja: '白亜の覇道', en: 'Cretaceous Reign' },     when: { era: 'cretaceous' }, up: { atk: 0.1, spd: 0.1 } },
    { id: 'fangs',    name: { ja: '牙の軍団', en: 'Legion of Fangs' },        when: { clan: 'carnivore' }, up: { atk: 0.15 } },
    { id: 'shield',   name: { ja: '草原の盾', en: 'Grassland Shield' },       when: { clan: 'herbivore' }, up: { def: 0.15, hp: 0.1 } },
    { id: 'envoys',   name: { ja: '空と海の使者', en: 'Envoys of Sky & Sea' }, when: { clan: 'skysea' },   up: { spd: 0.15, atk: 0.1 } },
    { id: 'kings',    name: { ja: '暴君たちの宴', en: 'Feast of Tyrants' },    when: { ids: ['tyranno', 'spino', 'giga'] }, up: { atk: 0.2 } },
    { id: 'horns',    name: { ja: '角の三銃士', en: 'Three Horned Musketeers' }, when: { ids: ['triceratops', 'styraco', 'proto'] }, up: { def: 0.2, atk: 0.1 } },
    { id: 'raptors',  name: { ja: 'ラプトル小隊', en: 'Raptor Squad' },        when: { ids: ['raptor', 'deinony', 'utah'] }, up: { spd: 0.2, atk: 0.1 } },
    { id: 'skylords', name: { ja: '翼竜の大空', en: 'Pterosaur Skies' },       when: { ids: ['pterano', 'quetzal', 'tapejara'] }, up: { spd: 0.15, atk: 0.15 } },
    { id: 'deep',     name: { ja: '深海の王たち', en: 'Lords of the Deep' },    when: { ids: ['mosa', 'liopleuro', 'elasmo'] }, up: { hp: 0.2, atk: 0.1 } },
    { id: 'necks',    name: { ja: '首長の一族', en: 'Long-Neck Clan' },         when: { ids: ['brachio', 'diplo', 'amarga'] }, up: { hp: 0.2, def: 0.1 } }
  ];

  /** 図鑑で見せるコンボのヒント（条件をぼかす） */
  DN.COMBO_HINTS = {
    dawn: { ja: 'いちばん古い時代の3体', en: 'Three from the oldest era' },
    forest: { ja: 'まん中の時代の3体', en: 'Three from the middle era' },
    rule: { ja: 'いちばん新しい時代の3体', en: 'Three from the latest era' },
    fangs: { ja: '肉を食べる3体', en: 'Three meat-eaters' },
    shield: { ja: '草を食べる3体', en: 'Three plant-eaters' },
    envoys: { ja: '空と海の3体', en: 'Three from sky and sea' },
    kings: { ja: '大きな肉食恐竜の王たち', en: 'The kings of the big meat-eaters' },
    horns: { ja: '角とえり飾りの仲間', en: 'Friends with horns and frills' },
    raptors: { ja: 'かぎ爪のすばやいハンターたち', en: 'Swift hunters with sickle claws' },
    skylords: { ja: 'とさかのある翼竜たち', en: 'Crested flyers' },
    deep: { ja: '海の大きなハンターたち', en: 'Great hunters of the sea' },
    necks: { ja: '首の長い巨人たち', en: 'Long-necked giants' }
  };

  /**
   * カードパック：clan で絞りこむ（null = 全種）。rates = レア度ごとの出る確率（%）。price = 値段（null = 買えない・優勝の賞品）
   */
  DN.PACKS = [
    { id: 'carnivore', name: { ja: '肉食パック', en: 'Carnivore Pack' },  clan: 'carnivore', price: 150, color: '#e0482c', rates: { N: 56, R: 28, SR: 11, SSR: 4.4, EX: 0.6 } },
    { id: 'herbivore', name: { ja: '草食パック', en: 'Herbivore Pack' },  clan: 'herbivore', price: 150, color: '#5aa83a', rates: { N: 56, R: 28, SR: 11, SSR: 4.4, EX: 0.6 } },
    { id: 'skysea',    name: { ja: '空と海パック', en: 'Sky & Sea Pack' }, clan: 'skysea',   price: 150, color: '#2f8ae0', rates: { N: 56, R: 28, SR: 11, SSR: 4.4, EX: 0.6 } },
    { id: 'all',       name: { ja: '全種パック', en: 'All-Species Pack' }, clan: null,       price: 120, color: '#9a5ae0', rates: { N: 58, R: 27, SR: 10.6, SSR: 4, EX: 0.4 } },
    // 優勝パック（大会ごと。SSR と EX が出やすい）
    { id: 'win_beginner', name: { ja: 'ビギナー優勝パック', en: 'Beginner Champion Pack' }, clan: null, price: null, color: '#f2b418', rates: { N: 30, R: 38, SR: 22, SSR: 9, EX: 1 } },
    { id: 'win_novice',   name: { ja: 'ノービス優勝パック', en: 'Novice Champion Pack' },   clan: null, price: null, color: '#f2b418', rates: { N: 20, R: 36, SR: 28, SSR: 14, EX: 2 } },
    { id: 'win_advance',  name: { ja: 'アドバンス優勝パック', en: 'Advance Champion Pack' }, clan: null, price: null, color: '#f2b418', rates: { N: 10, R: 30, SR: 34, SSR: 22, EX: 4 } },
    { id: 'win_master',   name: { ja: 'マスター優勝パック', en: 'Master Champion Pack' },   clan: null, price: null, color: '#f2b418', rates: { N: 0, R: 24, SR: 38, SSR: 30, EX: 8 } },
    { id: 'win_legend',   name: { ja: 'レジェンド優勝パック', en: 'Legend Champion Pack' }, clan: null, price: null, color: '#f2b418', rates: { N: 0, R: 10, SR: 36, SSR: 40, EX: 14 } }
  ];

  /**
   * 大会：matches = 対戦相手のチーム（{ id, lv, stack }）。prize = 1戦勝つごとの賞金。pack = 優勝パック。ai = 相手 AI のうまさ（config.js の AI_LEVELS）
   */
  function t(ids, lv, stack) { return ids.map(function (id) { return { id: id, lv: lv, stack: stack || 0 }; }); }
  DN.TOURNAMENTS = [
    { key: 'beginner', ai: 0, prize: 100, pack: 'win_beginner', matches: [
      t(['compy', 'proto', 'rhampho'], 1), t(['coelo', 'stego', 'notho'], 2), t(['raptor', 'iguano', 'ichthyo'], 3)] },
    { key: 'novice', ai: 1, prize: 150, pack: 'win_novice', matches: [
      t(['herrera', 'kentro', 'dimorpho'], 4), t(['dilo', 'pachy', 'pterano'], 4), t(['allo', 'parasaur', 'elasmo'], 5)] },
    { key: 'advance', ai: 2, prize: 180, pack: 'win_advance', matches: [
      t(['baryonyx', 'ankylo', 'tapejara'], 5), t(['carno', 'diplo', 'elasmo'], 6), t(['utah', 'styraco', 'liopleuro'], 6), t(['giga', 'triceratops', 'brachio'], 7)] },
    { key: 'master', ai: 3, prize: 260, pack: 'win_master', matches: [
      t(['utah', 'amarga', 'quetzal'], 9), t(['spino', 'styraco', 'liopleuro'], 10, 1), t(['giga', 'therizino', 'mosa'], 10, 2), t(['tyranno', 'triceratops', 'quetzal'], 10, 3)] },
    { key: 'legend', ai: 4, prize: 360, pack: 'win_legend', matches: [
      t(['spino', 'therizino', 'mosa'], 10, 3), t(['tyranoceras', 'amarga', 'liopleuro'], 10, 4), t(['quetzal', 'gaiafort', 'giga'], 10, 4), t(['tyranno', 'leviawing', 'spino'], 10, 5)] }
  ];

  var byId = {};
  DN.DINOS.forEach(function (d) { byId[d.id] = d; });
  DN.dino = function (id) { return byId[id]; };
  DN.move = function (id) { return DN.MOVES[id]; };
  DN.pack = function (id) { return DN.PACKS.filter(function (p) { return p.id === id; })[0]; };

  /** そのチーム（id の並び）で発動するコンボ */
  DN.combosFor = function (ids) {
    if (!ids || ids.length !== 3) return [];
    var ds = ids.map(function (id) { return byId[id]; });
    return DN.COMBOS.filter(function (c) {
      if (c.when.era) return ds.every(function (d) { return d.era === c.when.era; });
      if (c.when.clan) return ds.every(function (d) { return d.clan === c.when.clan; });
      if (c.when.ids) return c.when.ids.every(function (id) { return ids.indexOf(id) >= 0; });
      return false;
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
