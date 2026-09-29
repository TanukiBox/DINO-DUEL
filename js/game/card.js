/*
 * DINO DUEL カードの見た目（レア度で枠の色が変わる。EX は虹色に光る）と、恐竜のくわしい情報
 *
 *   DN.Card.html('tyranno', { own: { lv, stack }, size: 's' | 'm' | 'l', silhouette, isNew })
 *   DN.Card.detail('tyranno', state)   … 図鑑・チーム編成で見せる、能力・技・説明
 */
(function (global) {
  'use strict';
  var DN = global.DN = global.DN || {};

  function T(k, p) { return DN.app.i18n.t(k, p); }
  function L(o) { return o[DN.app.i18n.lang] || o.en; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var C = DN.Card = {};

  C.html = function (id, o) {
    o = o || {};
    var d = DN.dino(id), sil = !!o.silhouette;
    var art = DN.art.img(d, sil ? { silhouette: true } : null);
    var h = '<div class="card r-' + d.rarity + ' sz-' + (o.size || 'm') + (sil ? ' sil' : '') + (o.cls ? ' ' + o.cls : '') + '" data-id="' + id + '">' +
      '<div class="card-in">' +
      '<div class="card-top"><span class="rar">' + d.rarity + '</span>' + (o.own && !sil ? '<span class="lv">Lv' + o.own.lv + '</span>' : '') + '</div>' +
      '<div class="card-art">' + art + '</div>' +
      '<div class="card-name">' + (sil ? '？？？' : esc(L(d.name))) + '</div>' +
      (sil ? '' : '<div class="card-sub"><span class="era">' + T('era_' + d.era) + '</span><span class="clan c-' + d.clan + '">' + T('clan_' + d.clan) + '</span></div>') +
      '</div>' +
      (o.own && o.own.stack > 0 && !sil ? '<span class="stack">+' + o.own.stack + '</span>' : '') +
      (o.isNew ? '<span class="new-badge">NEW</span>' : '') +
      '</div>';
    return h;
  };

  /** 能力のバー（base = 元の値、now = 強化後の値、max = バーの右端） */
  function bar(label, base, now, max) {
    var w1 = Math.min(100, base / max * 100), w2 = Math.min(100, now / max * 100);
    return '<div class="stat"><span class="sl">' + label + '</span><span class="sb"><i class="grow" style="width:' + w2.toFixed(1) + '%"></i><i class="base" style="width:' + w1.toFixed(1) + '%"></i></span>' +
      '<span class="sv">' + now + (now > base ? '<small>+' + (now - base) + '</small>' : '') + '</span></div>';
  }

  /** くわしい情報（持っていないときは、どのパックから出るかのヒントだけ） */
  C.detail = function (id, s) {
    var d = DN.dino(id), own = s && s.owned[id];
    if (!own) {
      var packs = DN.PACKS.filter(function (p) { return p.price !== null && (!p.clan || p.clan === d.clan); }).map(function (p) { return L(p.name); }).join('・');
      return '<div class="detail unknown">' +
        '<div class="dt-art">' + DN.art.img(d, { silhouette: true }) + '</div>' +
        '<div class="dt-head"><span class="rar-chip r-' + d.rarity + '">' + d.rarity + '</span><b>？？？</b></div>' +
        '<p class="dt-hint">' + T('dexHint', { packs: packs }) + '</p></div>';
    }
    var st = DN.Progress.stats(s, id), next = DN.Progress.xpNext(own.lv);
    var moves = d.moves.map(function (mid) {
      var mv = DN.move(mid), accTxt = mv.acc < 100 ? T('acc', { n: mv.acc }) : '';
      var desc = mv.desc ? L(mv.desc) : mv.effect ? T('desc_' + mv.effect) : T('desc_none', { acc: accTxt });
      return '<div class="dt-move"><div class="mvh"><b>' + esc(L(mv.name)) + '</b><span>' + T('power', { n: mv.power }) + (accTxt ? '・' + accTxt : '') + '</span>' +
        (mv.effect ? '<span class="tag ' + mv.effect + '">' + T('eff_' + mv.effect) + '</span>' : '') + '</div><p>' + esc(desc) + '</p></div>';
    }).join('');
    return '<div class="detail">' +
      '<div class="dt-art r-' + d.rarity + '">' + DN.art.img(d) + '</div>' +
      '<div class="dt-head"><span class="rar-chip r-' + d.rarity + '">' + d.rarity + '</span><b>' + esc(L(d.name)) + '</b>' +
      (own.stack ? '<span class="stack-chip">+' + own.stack + '</span>' : '') + '</div>' +
      '<div class="dt-tags"><span class="era">' + T('era_' + d.era) + '</span><span class="clan c-' + d.clan + '">' + T('clan_' + d.clan) + '</span>' +
      '<span class="lvtag">Lv ' + own.lv + (own.lv < DN.CFG.LV_MAX ? ' <i class="xp"><b style="width:' + (own.xp / next * 100).toFixed(0) + '%"></b></i>' : ' MAX') + '</span></div>' +
      '<div class="dt-stats">' +
      bar(T('st_hp'), d.hp, st.hp, 420) + bar(T('st_atk'), d.atk, st.atk, 160) + bar(T('st_def'), d.def, st.def, 160) +
      bar(T('st_spd'), d.spd, st.spd, 150) + bar(T('st_dex'), d.dex, st.dex, 40) +
      '</div>' +
      '<div class="dt-moves">' + moves + '</div></div>';
  };

  /** コンボの小さな札 */
  C.comboChips = function (ids) {
    var list = DN.combosFor(ids);
    if (!list.length) return '<div class="combos none">' + T('noCombo') + '</div>';
    return '<div class="combos">' + list.map(function (c) {
      var ups = Object.keys(c.up).map(function (k) { return T('st_' + k) + '+' + Math.round(c.up[k] * 100) + '%'; }).join(' ');
      return '<span class="combo-chip"><b>' + esc(L(c.name)) + '</b><small>' + ups + '</small></span>';
    }).join('') + '</div>';
  };
})(window);
