/**
 * sw.js - Service Worker untuk Caching & PWA Offline
 */

const CACHE_NAME = 'kalender-hijriah-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/hijri-engine.js',
  './js/ompo-uleng.js',
  './js/primbon-engine.js',
  './js/prayer-engine.js',
  './js/holidays.js',
  './js/events-engine.js',
  './js/app.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) {
            return caches.delete(k);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Cache First, Fallback to Network
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((networkResponse) => {
        // Cek jika response valid dan dari origin yang sama untuk dicache
        if (networkResponse && networkResponse.status === 200 && e.request.url.startsWith(self.location.origin)) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, resClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Jika offline dan tidak ada di cache
        if (e.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
