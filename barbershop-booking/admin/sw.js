// Service Worker for Barbershop Booking PWA

const CACHE_NAME = 'barbershop-booking-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Skip caching for Firebase and dynamic content
  if (url.includes('firebase') || 
      url.includes('firestore') || 
      url.includes('googleapis') ||
      url.includes('gstatic.com/firebasejs')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // For other requests, try network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
    ))
  );
});