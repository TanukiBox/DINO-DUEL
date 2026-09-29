/*
 * DINO DUEL X（旧Twitter）シェア
 * 文章は日英（lang.js）。URL は config.js の SHARE_URL（ゲームの公開先）。
 * 大会優勝時と EX 恐竜獲得時に出す（段階1では勝利画面に出す）。
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};

  DN.shareIntentUrl = function (text, url) {
    var q = 'text=' + encodeURIComponent(text);
    if (url) q += '&url=' + encodeURIComponent(url);
    return 'https://x.com/intent/post?' + q;
  };

  /** X の投稿画面を開く（新しいタブ。開けなければ同じタブで） */
  DN.shareOnX = function (text) {
    var href = DN.shareIntentUrl(text, DN.CFG.SHARE_URL);
    var w = global.open(href, '_blank', 'noopener');
    if (!w) global.location.href = href;
  };
})(window);
