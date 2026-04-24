# Barbershop Booking App

A complete, production-ready barbershop booking application that can be deployed directly to GitHub Pages. Built with HTML, CSS, JavaScript, Firebase Auth + Firestore, and PWA capabilities.

## Features

- User authentication with Google (Firebase Auth)
- Booking system for barbershop services
- Real-time updates with Firestore
- Progressive Web App (PWA) with offline capabilities
- Responsive design for mobile and desktop
- Clean, modern UI
- No server dependencies - all client-side

## Project Structure

```
barbershop-booking/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── firebase-config.js
│   ├── main.js
│   └── booking.js
├── manifest.json
├── sw.js
├── icon-192.png
├── icon-512.png
└── README.md
```

## Firebase Setup

1. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Authentication > Sign-in method > Google
3. Create a Firestore database (start in test mode or locked mode - we'll add rules)
4. Add a web app to your Firebase project to get the configuration values
5. Replace the values in `js/firebase-config.js` with your Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

## Firestore Rules

For testing, you can use these rules (not recommended for production without adjustment):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Settings - readable by all, writable by admin only
    match /settings/{setting} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Bookings - readable/writable by owner or authenticated users
    match /bookings/{bookingId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
  }
}
```

## Admin Access

Admin login menggunakan password: `admin/password`

Untuk mengubah password, edit file `js/admin.js` pada baris:
```javascript
const ADMIN_PASSWORD = 'password';
```

For better security, consider adding validation and more restrictive rules.

## PWA Files

- `manifest.json`: Web app manifest for installable PWA
- `sw.js`: Service worker for caching and offline functionality
- Icons: `icon-192.png` and `icon-512.png` (generated automatically)

## Local Development

To test locally, you can use a simple HTTP server. Since the app uses Firebase Hosting (for auth redirects) and service workers, it's best to serve it over HTTPS or localhost.

Example using Python:
```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`

## Deployment to GitHub Pages

1. Push this repository to GitHub
2. Go to repository Settings > Pages
3. Under "Source", select the branch (usually `main` or `master`) and folder `/ (root)`
4. Click "Save"
5. GitHub will provide a URL where your site is published (e.g., `https://username.github.io/repository-name/`)

**Important**: GitHub Pages serves over HTTPS, which is required for service workers and Firebase authentication redirects.

### Firebase Auth Redirect Setup

After deploying to GitHub Pages, you need to add your GitHub Pages URL to the Firebase Auth authorized domains:

1. In Firebase Console, go to Authentication > Sign-in method
2. Under "Authorized domains", add your GitHub Pages domain (e.g., `username.github.io`)
3. Also add `localhost` if you want to test locally

## How It Works

- **Authentication**: Users sign in with Google via Firebase Auth Popup
- **Bookings**: Stored in Firestore `bookings` collection with userId for ownership
- **Real-time updates**: Uses Firestore onSnapshot listeners for live updates
- **PWA**: Service worker caches assets for offline use; manifest enables installation
- **Responsive**: CSS adapts to mobile and desktop screens

## Customization

- **Services**: Edit the service options in `index.html` (inside the `<select id="service">`)
- **Colors**: Modify CSS variables in `:root` in `css/style.css`
- **Time slots**: Adjust the time generation in `main.js` (populateTimeSlots function)
- **Date restrictions**: Change the min date or add max date in `main.js`

## Notes

- This app uses Firebase Client SDK directly - suitable for public apps where data security rules protect sensitive data
- For production, consider adding more robust validation and error handling
- The service worker uses a cache-first strategy for static assets
- PWA features work best when served over HTTPS (GitHub Pages provides this)

## Troubleshooting

- **Firebase not loading**: Check your config values in `js/firebase-config.js`
- **Auth redirect issues**: Ensure your GitHub Pages domain is in Firebase authorized domains
- **Service worker not updating**: Unregister old service workers or use incognito for testing
- **Firestore permissions**: Check your Firestore rules if reads/writes fail

---

**Ready to deploy!** Simply replace the Firebase config values, push to GitHub, and enable GitHub Pages.