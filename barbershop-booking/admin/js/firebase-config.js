// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD2JZUkRvMtgt1FB8mM9d6UioDQxMN_wBU",
  authDomain: "booking-barbershop-a9dc4.firebaseapp.com",
  projectId: "booking-barbershop-a9dc4",
  storageBucket: "booking-barbershop-a9dc4.firebasestorage.app",
  messagingSenderId: "17452579985",
  appId: "1:17452579985:web:6a6dd111f88d9e85235330",
  measurementId: "G-0QKZ0DC7J7"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
let messaging = null;

if ('firebase.messaging' in window) {
  messaging = firebase.messaging();
  
  // Register service worker for background messages
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./firebase-messaging-sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);
        messaging.useServiceWorker(registration);
      })
      .catch((err) => console.log('Service Worker registration failed:', err));
  }
}



window.firebase = firebase;
window.auth = auth;
window.db = db;
window.messaging = messaging;