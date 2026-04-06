const CACHE_NAME = 'desapos-v1';
const ASSETS = [
  './',
  './index.html',
  'https://cdn.tailwindcss.com'
];

// Install Service Worker & Cache Assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Fetch Assets from Cache if Offline
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request);
    })
  );
});