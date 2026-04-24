// firebase-messaging-sw.js for Firebase Cloud Messaging
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD2JZUkRvMtgt1FB8mM9d6UioDQxMN_wBU",
  authDomain: "booking-barbershop-a9dc4.firebaseapp.com",
  projectId: "booking-barbershop-a9dc4",
  storageBucket: "booking-barbershop-a9dc4.firebasestorage.app",
  messagingSenderId: "17452579985",
  appId: "1:17452579985:web:6a6dd111f88d9e85235330"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message', payload);
  
  const notificationTitle = payload.notification.title || 'Booking Baru!';
  const notificationOptions = {
    body: payload.notification.body || 'Ada booking baru masuk',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: 'booking-notification',
    renotify: true,
    data: payload.data
  };
  
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('admin') && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow('/barbershop-booking/admin/');
    })
  );
});