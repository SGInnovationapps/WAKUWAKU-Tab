// わくわくタブレット Service Worker
// 初回アクセスで全ファイルをキャッシュし、以降はキャッシュ優先でオフライン動作する。
// ファイルを更新したら CACHE_NAME の番号を上げること（古いキャッシュは自動で削除）。
const CACHE_NAME = 'wakuwaku-tablet-v10';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/effects.js',
  './js/app.js',
  './js/tracing.js',
  './js/memory.js',
  './js/numbers.js',
  './js/puzzle.js',
  './assets/fonts/ZenMaruGothic-500.woff2',
  './assets/fonts/ZenMaruGothic-700.woff2',
  './assets/fonts/ZenMaruGothic-900.woff2',
  './assets/images/icon-180.png',
  './assets/images/icon-192.png',
  './assets/images/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((response) => {
      if (response) return response;
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') return caches.match('./index.html');
        return undefined;
      });
    })
  );
});
