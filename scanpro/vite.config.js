import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
    base: '/scanpro/',
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'ScanPro Studio',
                short_name: 'ScanPro',
                description: 'Local-first document scanning, PDF editing, canvas editing, OCR, and printing PWA',
                theme_color: '#2563eb',
                background_color: '#ffffff',
                display: 'standalone',
                start_url: '/scanpro/',
                icons: [
                    {
                        src: '/scanpro/icons/icon-192x192.svg',
                        sizes: '192x192',
                        type: 'image/svg+xml',
                    },
                    {
                        src: '/scanpro/icons/icon-512x512.svg',
                        sizes: '512x512',
                        type: 'image/svg+xml',
                    },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
                navigateFallback: '/scanpro/offline.html',
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\./i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'fonts-cache',
                            expiration: { maxEntries: 10 },
                        },
                    },
                ],
            },
        }),
    ],
});
