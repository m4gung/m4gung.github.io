// Firebase configuration
// Replace these values with your Firebase project settings
const firebaseConfig = {
  apiKey: "AIzaSyD2JZUkRvMtgt1FB8mM9d6UioDQxMN_wBU",
  authDomain: "booking-barbershop-a9dc4.firebaseapp.com",
  projectId: "booking-barbershop-a9dc4",
  storageBucket: "booking-barbershop-a9dc4.firebasestorage.app",
  messagingSenderId: "17452579985",
  appId: "1:17452579985:web:6a6dd111f88d9e85235330",
  measurementId: "G-0QKZ0DC7J7"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Enable persistence if available (optional)
db.enablePersistence()
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            // Multiple tabs open, persistence can only be enabled in one tab at a time.
            console.warn("Persistence failed: multiple tabs open");
        } else if (err.code === 'unimplemented') {
            // The current browser does not support all of the features needed to enable persistence
            console.warn("Persistence not available in this browser");
        }
    });

// Export for use in other files
window.firebase = firebase;
window.auth = auth;
window.db = db;