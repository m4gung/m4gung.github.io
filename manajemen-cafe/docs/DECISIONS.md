# ARCHITECTURE & DESIGN DECISIONS: CAFE MANAGEMENT SYSTEM

## ADR-001: Backend Stack - Java 21, Spring Boot 3, PostgreSQL
- **Konteks:** Diperlukan backend yang kokoh, performa tinggi, memiliki dukungan transaksi ACID yang kuat, dan manajemen entitas yang teruji untuk sistem keuangan POS dan SaaS.
- **Keputusan:** Menggunakan Java 21 LTS dengan Spring Boot 3.3+, Spring Data JPA, Spring Security (JWT), Flyway Migration, dan PostgreSQL.
- **Konsekuensi:** Type-safe, ekosistem enterprise matang, integritas data terjamin dengan foreign keys dan database transactions.

## ADR-002: Frontend & Mobile Client - React TypeScript Vite + Capacitor
- **Konteks:** Sistem harus responsif untuk desktop/tablet POS kasir, kitchen display barista, sekaligus siap dipublikasikan ke Google Play Store sebagai aplikasi Android.
- **Keputusan:** Menggunakan React + TypeScript + Tailwind CSS (Vite) yang diintegrasikan dengan `@capacitor/android`.
- **Konsekuensi:**
  - Satu basis kode (Single Codebase) untuk Web dashboard dan Android App (Google Play Store).
  - Akses native hardware (seperti Bluetooth Thermal Printer, Camera scanner) melalui plugin Capacitor.
  - Waktu pengembangan dan pemeliharaan jauh lebih efisien dibanding memisahkan web dan native app.

## ADR-003: Strategi Multi-Tenancy untuk SaaS
- **Konteks:** Sistem dirancang agar nantinya bisa dijadikan produk SaaS berlangganan dengan banyak kafe/klien.
- **Keputusan:** Menggunakan strategi *Discriminator Column* (`tenant_id`) dengan Row-Level Security / Hibernate Filter & Spring Security context isolation.
- **Konsekuensi:**
  - Efisiensi biaya database dan komputasi (cukup 1 shared database PostgreSQL pada fase awal, biaya hosting murah).
  - Skalabilitas mudah dengan indeks yang tepat pada `tenant_id`.
  - Migrasi skema seragam untuk semua tenant melalui Flyway.

## ADR-004: Snapshot Harga & Resep Transaksional
- **Konteks:** Harga produk atau bahan resep dapat berubah sewaktu-waktu. Riwayat transaksi masa lalu dan laporan laba-rugi tidak boleh terpengaruh oleh perubahan harga masa kini.
- **Keputusan:**
  - Simpan salinan (*snapshot*) nama produk, nama varian, dan harga satuan langsung di dalam `order_items`.
  - Kurangi stok bahan baku berdasarkan resep pada saat order berstatus `PAID` dalam satu transaksi database atomik.
- **Konsekuensi:** Integritas laporan historis 100% terjaga dan audit jejak stok dapat dipertanggungjawabkan.

## ADR-005: PWA Offline-First & Pluggable Sync Engine (Spring Boot / Apps Script / Keduanya)
- **Konteks:** Kafe seringkali menghadapi masalah koneksi internet tidak stabil di lokasi fisik. Selain itu, pemilik kafe pemula menginginkan opsi bebas biaya hosting (menggunakan Google Apps Script / Google Sheets), sedangkan kafe yang berkembang membutuhkan Spring Boot + PostgreSQL.
- **Keputusan:**
  - PWA berbasis IndexedDB (Dexie.js) dengan Service Worker.
  - Arsitektur Repository / Data Provider yang dapat diswitch di pengaturan:
    - `SPRING_BOOT`: REST API Spring Boot + PostgreSQL.
    - `APPS_SCRIPT`: Google Apps Script Web App JSON API (Google Sheets database).
    - `DUAL`: Sinkronisasi utama ke Spring Boot dan duplikasi log/backup ke Apps Script.
  - Local Sync Queue: Transaksi offline diantrikan dan di-sync otomatis saat online.
- **Konsekuensi:** POS tidak pernah terhenti saat internet mati. Pemilik memiliki fleksibilitas penuh memilih backend sesuai kapasitas anggaran.

## ADR-006: Struk Digital Tanpa Kertas (PDF, Copy Text, WhatsApp) & Multi-Outlet
- **Konteks:** Di era modern, banyak pelanggan kafe lebih menyukai struk digital melalui WhatsApp atau PDF daripada kertas thermal. Selain itu, pemilik bisnis dapat memiliki lebih dari satu cabang kafe.
- **Keputusan:**
  - Menyediakan modal struk interaktif dengan tombol: Cetak / Download PDF, Salin Teks ke Clipboard, dan Kirim Pesan Struk ke WhatsApp via URL API (`wa.me`).
  - Seluruh data transaksi, meja, dan inventori diikat pada `outlet_id` di bawah `tenant_id`.
- **Konsekuensi:** Penghematan biaya kertas kasir bagi kafe dan fleksibilitas ekspansi cabang.

## ADR-007: Web Direct Thermal Printing (Web Bluetooth & Web Serial ESC/POS)
- **Konteks:** Kasir membutuhkan kecepatan cetak struk tanpa harus melalui jendela dialog print bawaan browser yang lambat dan memerlukan klik ganda.
- **Keputusan:**
  - Implementasikan modul driver ESC/POS generator berbasis TypeScript murni (`escposBuilder.ts`).
  - Dukung koneksi Web Bluetooth API (`navigator.bluetooth`) untuk perangkat kasir nirkabel (HP Android / Tablet).
  - Dukung koneksi Web Serial / USB API (`navigator.serial`) untuk PC / Laptop kasir bertancap kabel USB.
  - Sediakan fallback ke browser print CSS 58mm/80mm bila browser atau perangkat tidak mendukung Web Bluetooth/Serial.
- **Konsekuensi:** Pengalaman kasir menjadi instan layaknya aplikasi kasir native di desktop/Android tanpa perlu aplikasi bridge pihak ketiga.
