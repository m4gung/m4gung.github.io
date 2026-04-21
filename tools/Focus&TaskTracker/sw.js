const CACHE_NAME = 'focus-tracker-v1';
const urlsToCache = [
    './index.html',
    './style.css',
    './script.js',
    './manifest.json'
];

// 1. Install & Simpan file ke Cache
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

// 2. Fetch (Ambil dari cache jika offline)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Kembalikan file dari cache jika ada, jika tidak ambil dari internet
                return response || fetch(event.request);
            })
    );
});