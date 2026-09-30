/*
 * DINO DUEL 調整用の数値
 * バトルの手ざわり・強さのつり合いは、ほぼここの数字で決まる。
 * tools/sim.js（バランス確認用シミュレーション）も同じ数字を読む。
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};

  DN.CFG = {
    SHARE_URL: 'https://tanukibox.github.io/DINO-DUEL/',

    // ---- ダメージ ----
    // ダメージ = 威力 × (攻撃力 ÷ 相手の防御力) × DMG_K × 乱数 × クリティカル × タイミング倍率
    DMG_K: 0.86,
    RAND_MIN: 0.9,
    RAND_MAX: 1.1,
    CRIT_MUL: 1.5,
    DEX_MIN: 5,               // 器用さ＝クリティカル率（%）の範囲
    DEX_MAX: 40,
    // 仲間の相性：肉食 → 草食 → 空と海 → 肉食（有利な相手へのダメージ・不利な相手へのダメージ）
    CLAN_ADV: 1.06,           // 3体対3体なので小さい倍率でも効く（同じ強さなら、有利な側の勝率が約15ポイント上がる）
    CLAN_DIS: 0.97,

    // ---- タイミング ----
    ATK_TIMING: { perfect: 1.5, good: 1.2, miss: 1.0 }, // 自分の攻撃：ぴったり／おしい／外れ
    DEF_TIMING: { perfect: 0.6, good: 0.8, miss: 1.0 }, // 相手の攻撃：受けるダメージ
    PERFECT_MS: 85,           // 当たる瞬間から ±この時間（ミリ秒）なら「ぴったり」
    GOOD_MS: 200,             // ±この時間なら「おしい」
    RING_SEC: 1.05,           // 輪が縮みきるまでの時間（秒）
    RING_START: 3.2,          // 輪の大きさ（はじめ）＝的の何倍か

    // ---- 技の効果 ----
    FX: {
      atkUp: 0.25,            // 攻撃アップ：1段ごとに +25%
      defDown: 0.2,           // 防御ダウン：1段ごとに -20%
      spdDown: 0.3,           // 素早さダウン：1段ごとに -30%
      stageMax: 2,            // 上げ下げは2段まで
      drain: 0.5,             // 回復：与えたダメージの50%
      recoil: 0.25            // 反動：与えたダメージの25%
    },

    // ---- 成長 ----
    // 能力の上乗せ = 元の能力 ×（LV_PCT ×（レベル−1）＋ STACK_PCT × 重ねた枚数）。体力・攻撃・防御・素早さに効く
    LV_MAX: 10,
    LV_PCT: 0.04,             // レベル1つごとに +4%（レベル10で +36%）
    STACK_PCT: 0.05,          // 1枚重ねるごとに +5%（上限なし）
    XP_NEXT: 60,              // 次のレベルまでの経験値 = XP_NEXT × 今のレベル（1→2 は 60、9→10 は 540）
    XP_WIN: [40, 55, 70, 90, 110],  // 勝ったとき（大会ごと）
    XP_LOSE: 15,              // 負けたとき

    // ---- お金とパック ----
    START_MONEY: 240,         // はじめの賞金（パック2回ぶん）
    STARTERS: ['raptor', 'stego', 'rhampho'],  // はじめから持っている3体（肉食・草食・空と海から1体ずつ）
    PITY: 30,                 // 天井：SR 以上が出ないまま、この回数目は SR 以上が確定（出たら数えなおし）
    // 化石ポイント：持っている恐竜がかぶったら、重ね強化に加えてもらえる。図鑑でほしい恐竜と交換できる
    FOSSIL_GAIN: { N: 2, R: 5, SR: 12, SSR: 30, EX: 60 },
    FOSSIL_COST: { N: 20, R: 50, SR: 120, SSR: 300, EX: 600 },
    PRACTICE_PRIZE: 0.5,      // 練習試合（優勝した大会の相手と1戦）の賞金 = ふつうの何倍か。経験値はふつうと同じ

    // ---- 相手AIのうまさ（大会ごと）----
    // atk / def：AI がタイミングを「ぴったり」「おしい」にする確率。残りは「外れ」
    // statMul：相手の強さの倍率（大会の相手はレベルと重ね強化で強くするので 1 のまま）
    AI_LEVELS: [
      { key: 'beginner', atk: { perfect: 0.05, good: 0.20 }, def: { perfect: 0.03, good: 0.15 }, statMul: 1 },
      { key: 'novice',   atk: { perfect: 0.12, good: 0.30 }, def: { perfect: 0.08, good: 0.25 }, statMul: 1 },
      { key: 'advance',  atk: { perfect: 0.22, good: 0.38 }, def: { perfect: 0.15, good: 0.32 }, statMul: 1 },
      { key: 'master',   atk: { perfect: 0.38, good: 0.40 }, def: { perfect: 0.22, good: 0.38 }, statMul: 1 },
      { key: 'legend',   atk: { perfect: 0.55, good: 0.35 }, def: { perfect: 0.32, good: 0.38 }, statMul: 1 }
    ],

    // ---- 演出の速さ（秒）----
    ANIM: {
      banner: 0.55,           // 技名を見せる時間
      lunge: 0.16,            // 飛びかかる時間
      back: 0.28,             // 元の位置に戻る時間
      between: 0.22,          // 次の恐竜が動くまでの間
      hitStop: 0.07           // 当たった瞬間に止まる時間
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
