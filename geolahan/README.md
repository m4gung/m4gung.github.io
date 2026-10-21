# GeoLahan Pro

Aplikasi WebGIS responsif untuk mengukur, mengelola, memvisualisasikan, menyimpan, dan mencetak laporan pengukuran bidang tanah di atas peta satelit.

> **Status:** Fase 1 (Fondasi) selesai: dashboard responsif, peta satelit/hybrid/jalan, tema gelap/terang, dan pencarian lokasi. Alat ukur poligon, penyimpanan, GPS, dan PDF dikerjakan pada fase berikutnya. Lihat [`PROJECT_STATUS.md`](./PROJECT_STATUS.md).

## Fitur (Fase 1)

- Layout dashboard: header, sidebar (desktop dapat diciutkan, mobile berupa drawer), area peta penuh.
- Peta Leaflet 1.9.4 dengan tiga layer dasar:
  - **Satelit:** Esri World Imagery.
  - **Hybrid:** Esri World Imagery + overlay *World Transportation* + *World Boundaries & Places*.
  - **Peta Jalan:** OpenStreetMap.
- Kontrol zoom, skala metrik, dan atribusi penyedia (tidak dihapus).
- Pencarian lokasi (desa, kecamatan, kabupaten/kota, alamat) via Nominatim, dengan fokus peta ke hasil.
- Mode gelap, mode terang, dan mode ikuti sistem, disimpan di `localStorage`.
- Halaman: Dashboard, Peta & Pengukuran, Daftar Lahan, Detail Lahan, Laporan, Pengaturan.
- Indikator status koneksi online/offline.

## Tech stack

| Paket | Versi |
|---|---|
| React / React DOM | 19.3.x |
| React Router | 8.5.x (`createHashRouter`) |
| Vite | 8.3.x |
| TypeScript | 6.0.x (dipin `~6.0` karena `typescript-eslint` mendukung `<6.1`) |
| Tailwind CSS (+ `@tailwindcss/vite`) | 4.3.x |
| Lucide React | 1.60.x |
| Leaflet | **1.9.4** (dipin persis) |
| Vitest + jsdom | 5.0.x / 30.x |
| Playwright | 1.64.x |
| ESLint + typescript-eslint | 10.x / 8.72.x |

Versi pasti tercatat di `package-lock.json`.

## Prasyarat

- Node.js ≥ 20.19 (diuji dengan Node 26.0.0, npm 11.12.1)
- Untuk E2E: Google Chrome terpasang, atau jalankan `npx playwright install chromium` lalu hapus opsi `channel: 'chrome'` di `playwright.config.ts`.

## Perintah

```bash
npm install          # instal dependensi
npm run dev          # mode development (http://localhost:5173)
npm run build        # typecheck + build produksi ke dist/
npm run preview      # menyajikan hasil build (http://localhost:4173)

npm run lint         # ESLint
npm run typecheck    # TypeScript tanpa emit
npm run test:unit    # Vitest (sekali jalan)
npm run test:e2e     # Playwright (butuh internet untuk tile & Nominatim)
npm run check        # lint + typecheck + unit test + build
```

## Deploy (GitHub Pages)

`vite.config.ts` memakai `base: './'` dan routing memakai hash (`#/peta`), sehingga folder `dist/` dapat disajikan dari subfolder mana pun. Untuk repo `m4gung.github.io`, jalankan `npm run build`, lalu commit `dist/`. Aplikasi dapat diakses di `https://m4gung.github.io/geolahan/dist/`.

## Konfigurasi

Salin `.env.example` menjadi `.env.local` bila perlu. File ini tidak berisi rahasia.

| Variabel | Default | Keterangan |
|---|---|---|
| `VITE_GEOCODER_URL` | `https://nominatim.openstreetmap.org` | Endpoint Nominatim (bisa instance sendiri) |
| `VITE_GEOCODER_COUNTRYCODES` | `id` | Batasi negara; kosongkan untuk global |
| `VITE_GEOCODER_EMAIL` | *(kosong)* | Email kontak opsional sesuai kebijakan Nominatim |

Penyedia tile (URL, atribusi, batas zoom, `crossOrigin`) dikonfigurasi terpusat di [`src/features/map/map.config.ts`](./src/features/map/map.config.ts).

## Kebijakan penyedia peta

- **Esri World Imagery dan layer referensi.** Wajib menampilkan atribusi. Penggunaan komersial atau volume besar dapat memerlukan akun ArcGIS. Lihat [ketentuan Esri](https://www.esri.com/en-us/legal/terms/full-master-agreement). Izin ekspor citra ke laporan PDF ditandai `imageExport: 'unknown'` dan harus diverifikasi sebelum Fase 5.
- **OpenStreetMap tiles.** Mengikuti [Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/). Tidak untuk penggunaan berat atau unduhan massal.
- **Nominatim.** Mengikuti [Usage Policy](https://operations.osmfoundation.org/policies/nominatim/):
  - Maksimal 1 permintaan/detik (throttle 1,1 detik di klien).
  - **Tanpa autocomplete.** Pencarian hanya berjalan saat Enter atau tombol Cari.
  - Hasil di-cache di memori, maksimal 5 hasil, dan atribusi ditampilkan.
- Aplikasi **tidak** menyimpan tile secara massal untuk offline.

## Akurasi

Koordinat memakai WGS 84 (EPSG:4326). Hasil pengukuran digital adalah **estimasi** dan tidak menggantikan pengukuran atau penetapan batas resmi oleh pihak berwenang.

## Struktur folder

```
src/
  app/            App.tsx, router.tsx, navigation.ts
  components/
    common/       EmptyState, ThemeProvider, ThemeToggle, ConnectionStatus
    layout/       AppLayout, Header, Sidebar, PageContainer
    map/          MapView, LayerSwitcher, LocationSearch, map-controller (context)
  features/
    map/          map.config.ts, tile.service.ts, geocoding.service.ts
  hooks/          useLocalStorage, useMediaQuery, useOnlineStatus, useTheme
  pages/          Dashboard, Map, Parcels, ParcelDetail, Reports, Settings, NotFound
  styles/         index.css (Tailwind v4 + gaya Leaflet)
tests/
  unit/           Vitest
  e2e/            Playwright
```

## Panduan pengembangan

- Komponen UI tidak memanggil Leaflet secara langsung kecuali `components/map/*`. Komponen lain memakai `useMapController()`.
- Provider geocoding baru cukup mengimplementasikan interface `GeocodingProvider`.
- Provider tile baru cukup ditambahkan ke `TILE_SOURCES` dan dirujuk dari `BASE_LAYERS`.
- `localStorage` hanya dipakai untuk preferensi ringan. Data lahan akan memakai IndexedDB (Dexie) pada Fase 3.
