/*
 * DINO DUEL オフラインで遊ぶための仕組み（サービスワーカー）
 * ・ページ（index.html）は、つながっていればいつも新しいものを取りにいく（更新がすぐ届く）
 * ・js・css・画像・フォントは、一度読んだものを手元に残して使う（index.html の ?v= が変わると新しいものを取る）
 * ・ホーム画面に追加したとき、電波がなくても遊べる
 */
var CACHE = 'dino-duel-1';

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function keep(req, res) {
  if (res && (res.ok || res.type === 'opaque')) {
    var copy = res.clone();
    caches.open(CACHE).then(function (c) { c.put(req, copy); });
  }
  return res;
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function (res) { return keep(req, res); }).catch(function () {
      return caches.match(req).then(function (hit) { return hit || caches.match('./'); });
    }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) {
    return hit || fetch(req).then(function (res) { return keep(req, res); });
  }));
});
