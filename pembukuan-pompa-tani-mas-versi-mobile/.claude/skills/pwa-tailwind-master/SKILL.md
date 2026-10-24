---
name: pwa-tailwind-expert
description: Skill untuk membangun aplikasi PWA modern menggunakan Tailwind CSS dan Vanilla JavaScript. Gunakan saat membuat UI responsif, Service Workers, atau Manifest file.
---

# PWA & Frontend Guidelines

Saat menggunakan skill ini, ikuti aturan ketat berikut:

### 1. Struktur PWA
- **Manifest:** Selalu siapkan struktur `manifest.json` yang valid (icons, theme_color, background_color, display: standalone).
- **Service Worker:** Buat script `sw.js` sederhana untuk caching aset statis (Offline First approach).
- **Registration:** Sertakan script registrasi Service Worker di `index.html` sebelum penutup body.

### 2. Styling (Tailwind CSS)
- **Mobile First:** Gunakan utility classes Tailwind dengan pendekatan mobile-first (gunakan prefix `md:`, `lg:` hanya untuk penyesuaian layar besar).
- **Modern UI:** Implementasikan sistem warna yang konsisten dan spasi yang lega (`p-`, `m-`, `gap-`).
- **Icons:** Gunakan SVG inline atau Lucide icons untuk menjaga performa tetap ringan.

### 3. Logic (JavaScript)
- **Modular:** Gunakan ES6 Modules jika memungkinkan.
- **DOM Manipulation:** Gunakan Vanilla JS yang bersih (querySelector, addEventListener).
- **PWA Features:** Sertakan logika untuk deteksi status "Offline" dan tombol "Install App" (BeforeInstallPrompt event).

### 4. Boilerplate Template
Jika diminta membuat project baru, selalu sertakan file `index.html`, `style.css` (input Tailwind), dan `app.js` sebagai entry point.
