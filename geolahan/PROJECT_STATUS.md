# GEO LAHAN PRO — STATUS PROYEK

Dokumen pelacak progres aktual implementasi GeoLahan Pro. Master requirement tetap mengacu pada `PROJECT_CONTEXT.md` dan `PROJECT_CONTEXT2.md`.

---

## 1. Status Fase

- [x] **Fase 1 — Fondasi** (Selesai pada 20 Oktober 2026)
  - Scaffold React 19 + Vite 8 + TypeScript (~6.0) + Tailwind CSS v4.
  - Integrasi Leaflet 1.9.4 dengan layer Satelit (Esri World Imagery), Hybrid (Esri Imagery + Transportation + Boundaries/Places), dan Peta Jalan (OSM).
  - LayerSwitcher mengambang di kanan atas peta dengan penyimpanan preferensi (`geolahan:baseLayer`).
  - Layout dashboard responsif: Header, Sidebar desktop collapsible, mobile drawer overlay.
  - ThemeProvider (light / dark / system) dengan persistensi `localStorage` dan zero-flash script di HTML.
  - Pencarian lokasi via Nominatim (debounce, throttle 1.1s, in-memory cache, validasi koordinat WGS 84, abort controller).
  - Skala peta metrik, kontrol zoom di kanan bawah, atribusi resmi dipertahankan.
  - Halaman Dashboard, Peta, Daftar Lahan, Detail Lahan, Laporan, Pengaturan.
- [x] **Fase 2 — Pengukuran & Geometri** (Selesai pada 20 Oktober 2026)
  - Integrasi `@geoman-io/leaflet-geoman-free` (2.20.3) & `@turf/turf` (7.4.0).
  - Mesin kalkulasi geodesik di `src/features/measurement/geometry.service.ts`:
    - Luas Geodesik ($m^2$, Are, Hektare: 1 are = $100 m^2$, 1 ha = $10.000 m^2$).
    - Keliling total (meter) dari keliling poligon tertutup.
    - Titik patok terurut $P_1, P_2, \dots, P_n$ dengan jarak antar-patok berturutan (P1 ke P2, Pn ke P1).
    - Titik pusat poligon (Centroid WGS 84).
    - Deteksi poligon tidak valid (< 3 titik unik, titik bertumpuk, batas saling silang / self-intersect).
  - Floating MeasurementToolbar: Tombol Ukur Lahan (drawing polygon), Edit Patok (vertex edit), Pemilih warna batas poligon (5 palet warna), dan Hapus/Reset.
  - Visualisasi di atas peta: Marker label patok ($P_1, P_2, \dots$) dan label jarak sisi di setiap segmen garis batas.
  - MeasurementPanel responsif: Menampilkan ringkasan luas, keliling, tabel patok (No, Lat, Lon, Jarak), tombol Salin Koordinat ke clipboard, serta tombol ciutkan/perluas panel.
  - 35 unit test Vitest (100% lulus) & 17 Playwright E2E browser tests (100% lulus).
- [x] **Fase 3 — Manajemen Data Lahan (CRUD)** (Selesai pada 21 Oktober 2026)
  - IndexedDB storage lokal via Dexie.js 4.4.6 & reactive hooks dexie-react-hooks 4.4.0.
  - Skema data `Parcel` lengkap: metadata lahan, GeoJSON Polygon, luas m²/are/ha, keliling, centroid, array patok berturutan P1..Pn, warna batas, keterangan, dan tanggal pengukuran.
  - Lapisan Repository `DexieParcelRepository` & hooks `useParcels`, `useParcel(id)`.
  - Floating action "Simpan Lahan" pada peta Leaflet saat pengukuran aktif.
  - Dialog Form Simpan Lahan (`SaveParcelModal.tsx`) dengan validasi input (nama, pemilik, tanggal, metode, warna, catatan).
  - Integrasi Sidebar dengan daftar lahan aktif dan klik instan untuk memusatkan peta (`fitBounds`).
  - Halaman Daftar Lahan (`/lahan`): Pencarian instan, filter pemilik, sorting (terbaru, terlama, luas, nama), aksi buka peta, edit, dan hapus.
  - Halaman Detail Lahan (`/lahan/:parcelId`): Ringkasan metrik, tabel koordinat patok WGS 84, ekspor koordinat ke CSV, salin patok, serta hapus lahan.
  - Halaman Dashboard (`/dashboard`): Widget statistik dinamis (total bidang terdaftar, total luas m², total luas Hektare, bidang terbaru).
  - 39 unit test Vitest (100% lulus) & 20 Playwright E2E browser tests (100% lulus).
- [x] **Fase 4 — Fitur Lokasi Lapangan & GPS** (Selesai pada 21 Oktober 2026)
  - `src/features/gps/gps.service.ts`: opsi geolocation (high accuracy, timeout 20 dtk), pemetaan error (izin ditolak / tidak tersedia / timeout / tidak didukung), ambang peringatan akurasi (20 m), penyaring titik lintasan (akurasi ≤ 30 m, jarak minimum 3 m, maks 500 titik).
  - `src/features/gps/useGps.ts`: hook `locate` (satu posisi, `fresh` tanpa cache untuk patok), `startTracking`/`stopTracking` via `watchPosition`.
  - `GpsControls.tsx`: Lokasi Saya, Tambah Patok GPS, Rekam Lintasan, kartu status (lat/lon 6 desimal, akurasi, waktu, status, peringatan, disclaimer).
  - Marker posisi + lingkaran akurasi, draft patok GPS, polyline lintasan; konfirmasi pengguna sebelum lintasan menjadi bidang, lalu luas/keliling/jarak sisi dihitung ulang oleh mesin Fase 2.
  - Lahan dari GPS otomatis menyarankan metode `gps_mobile` pada form simpan.
  - 48 unit test & Playwright E2E (geolocation dimock) lulus.
- [x] **Fase 5 — Ekspor Data & Laporan PDF** (Selesai pada 21 Oktober 2026)
  - `export.service.ts`: GeoJSON per lahan (Feature) dan semua lahan (FeatureCollection), nama file aman, impor GeoJSON dengan validasi & hitung ulang metrik.
  - `backup.service.ts`: backup JSON berversi (`geolahan-backup-YYYY-MM-DD.json`), validasi ketat per record, batas 10 MB, restore transaksional Dexie dengan strategi gabungkan / lewati duplikat / ganti; data lama tidak dihapus.
  - `pdf.service.ts` + `map-capture.service.ts`: PDF A4 portrait (header, ringkasan, peta + panah utara + bingkai + atribusi Esri, tabel koordinat multi-halaman, kolom tanda tangan, catatan WGS 84 & disclaimer, nomor halaman). Peta ditangkap dari peta cetak terpisah via `html2canvas-pro` (`useCORS`, tanpa `allowTaint`), menunggu tile dengan timeout, memeriksa isi citra; bila gagal tersedia "Coba lagi" / "Cetak tanpa peta". Zoom cetak dibatasi 17 karena Esri menampilkan placeholder di zoom tinggi pada banyak area.
  - UI: halaman Laporan (ekspor/impor/backup/restore + cetak per lahan) dan tombol GeoJSON/PDF di Detail Lahan.
  - PDF dimuat lazy (chunk terpisah). Catatan: `html2canvas` standar tidak mendukung warna `oklch` Tailwind v4, sehingga dipakai `html2canvas-pro`.
- [ ] **Fase 6 — PWA & Kualitas Akhir** (Service Worker, Web App Manifest, audit responsivitas menyeluruh, final verification).

---

## 2. Tech Stack & Versi Aktual

| Komponen | Library / Versi | Catatan |
|---|---|---|
| Runtime | Node.js v26.0.0, npm 11.12.1 | OS: macOS (Darwin arm64) |
| UI Library | React 19.3.1 & React DOM 19.3.1 | StrictMode enabled |
| Bundler & Tooling | Vite 8.3.4, @vitejs/plugin-react 6.1.2 | Base: `./`, Code splitting vendor |
| Bahasa | TypeScript 6.0.3 | Strict mode, noUncheckedIndexedAccess |
| Styling | Tailwind CSS 4.3.3 + @tailwindcss/vite | Dark mode class-based |
| Peta Interaktif | Leaflet 1.9.4 (pinned) | Vanilla ref inside MapView |
| Geometri & Gambar | @geoman-io/leaflet-geoman-free 2.20.3 | Polygon drawing & editing |
| Kalkulasi Geospasial | @turf/turf 7.4.0 | Geodesic area, perimeter, distance, centroid |
| Ikonografi | Lucide React 1.60.0 | SVG icons |
| Routing | React Router 8.5.0 | HashRouter (`createHashRouter`) |
| Pengujian Unit | Vitest 5.0.5, jsdom 30.1.3 | 35 test cases (100% pass) |
| Pengujian E2E | Playwright 1.64.1 | 17 pass, 1 skip (Google Chrome channel) |

---

## 3. Hasil Pengujian Terakhir (Fase 2)

1. **Linting (`npm run lint`):** Lolos bersih tanpa warning atau error.
2. **Typecheck (`npm run typecheck`):** Lolos bersih (`tsc -b --noEmit`).
3. **Unit Tests (`npm run test:unit`):**
   - 35/35 tes lulus di `tests/unit/geocoding.service.test.ts`, `tests/unit/map.config.test.ts`, dan `tests/unit/geometry.service.test.ts`.
4. **End-to-End Tests (`npm run test:e2e`):**
   - 17 passed, 1 skipped (skip pada 1 mobile Nominatim check untuk throttle).
   - Pengujian menggambar poligon, pengaktifan mode gambar, verifikasi kemunculan tabel patok & ringkasan luas di layar browser nyata.
5. **Build Produksi (`npm run build`):**
   - Sukses dan terkompilasi bersih ke folder `dist/`.
