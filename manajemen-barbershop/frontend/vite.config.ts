import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './', // Relatif agar jalan mulus di https://m4gung.github.io/manajemen-barbershop/
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'pwa-icon.svg'],
      manifest: {
        name: 'Barbershop Management System',
        short_name: 'BarberPOS',
        description: 'Aplikasi Manajemen Kasir POS, Layanan Cukur, Produk Retail, & Absensi Barbershop',
        theme_color: '#15110d',
        background_color: '#15110d',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'pwa-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
})
