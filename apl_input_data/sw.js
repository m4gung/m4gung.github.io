const CACHE_NAME = 'apl-input-data';
const assets = ['./', './index.html', 'https://cdn.tailwindcss.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(assets)));
});

self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});