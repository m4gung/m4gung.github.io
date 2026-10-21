import { defineConfig, devices } from '@playwright/test';

/**
 * E2E GeoLahan Pro. Menjalankan build produksi via `vite preview`.
 * Memakai Google Chrome yang terpasang (channel 'chrome'); ubah ke Chromium bawaan Playwright
 * dengan `npx playwright install chromium` dan hapus opsi channel bila Chrome tidak tersedia.
 * Catatan: tes peta & pencarian membutuhkan akses internet ke server tile Esri/OSM dan Nominatim.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:4173/',
    channel: 'chrome',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: 'chrome' } },
  ],
  // Bila E2E_BASE_URL diisi (mis. simulasi subfolder GitHub Pages), server eksternal dipakai.
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
