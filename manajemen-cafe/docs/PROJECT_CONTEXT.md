# PROJECT CONTEXT: CAFE MANAGEMENT SYSTEM (SAAS & PLAY STORE READY)

## 1. Ringkasan Proyek
- **Nama Proyek:** Cafe Management System
- **Target Pengguna:** Pemilik café kecil hingga menengah, coffee shop, kedai kopi, kasir, dan barista.
- **Karakteristik Khusus:**
  - **SaaS-Ready:** Arsitektur multi-tenancy (tenant isolation) sejak awal agar siap dikembangkan menjadi platform multi-cafe/multi-outlet berlangganan.
  - **Play Store Ready:** Frontend mobile-first (React + Vite + TypeScript) yang dikonfigurasi dengan Capacitor (`@capacitor/android`) agar dapat di-build langsung menjadi Android App Bundle (.aab / .apk) untuk Google Play Store, sekaligus dapat diakses via Web/PWA.
- **Bahasa:**
  - Antarmuka, validasi error, dokumen: Bahasa Indonesia.
  - Kode, API, variabel, tabel: Bahasa Inggris.

## 2. Status Saat Ini (Fase 0 - Audit Awal)
- Repository baru diinisialisasi, belum terdapat kode backend maupun frontend.
- Lingkungan kerja lokal:
  - Java: OpenJDK 21 LTS
  - Maven: 3.9.15
  - Node.js: v26.0.0, npm 11.12.1
  - Database: PostgreSQL (berjalan di port 5432)
  - Container: Docker 29.4.1
  - OS: macOS (Apple Silicon arm64)

## 3. Prinsip Kerja & Batasan
- Sesuai panduan `PROJECT_CONTEXT.md` dan `SKILL-LANJUTAN.md`:
  1. Mulai dari Fase 0 (Audit & Perencanaan) dan tunggu persetujuan sebelum menulis kode implementasi.
  2. Kerjakan fase per fase secara terstruktur, tanpa lompat fase.
  3. Tidak membuat placeholder/mock palsu; semua fitur harus memiliki logika backend & frontend nyata.
  4. Backend adalah sumber kebenaran (*single source of truth*) perhitungan harga, diskon, stok, dan hak akses.
  5. Snapshot harga transaksi wajib disimpan agar perubahan menu di masa depan tidak merusak laporan lama.
  6. Idempotensi transaksi dan pengurangan stok untuk mencegah duplikasi data.
