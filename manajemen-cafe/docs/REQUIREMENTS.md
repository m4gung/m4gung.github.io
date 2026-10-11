# REQUIREMENTS SPECIFICATION: CAFE MANAGEMENT SYSTEM

## 1. Modul Inti (MVP - Fase 1 s/d 7)

### 1.1 Autentikasi, Otorisasi, Multi-Tenancy & Multi-Outlet (SaaS Ready)
- **Multi-Tenancy & Multi-Outlet:** 
  - Setiap tenant (pemilik bisnis) dapat mengelola 1 atau lebih outlet (cabang kafe).
  - Kasir dan staf dapat bertugas di outlet tertentu, atau Owner dapat berpindah (*switch*) outlet secara dinamis.
- **Backend Architecture & Sync Flexibility (PWA Offline-First):**
  - Aplikasi dirancang **Offline-First** menggunakan local database (IndexedDB / Dexie.js).
  - **Pilihan Sinkronisasi di Pengaturan:**
    1. **Spring Boot Backend (REST API):** Sinkronisasi ke server PostgreSQL enterprise.
    2. **Google Apps Script (GAS):** Sinkronisasi ke Google Sheets/Apps Script URL endpoint (solusi hemat/tanpa biaya server bagi kafe pemula).
    3. **Keduanya (Dual Mode):** Sinkronisasi ke Spring Boot sekaligus backup/sheet log ke Google Apps Script.
  - Antrean Sinkronisasi (*Sync Queue*): Transaksi saat offline otomatis tersimpan di antrean lokal dan di-push begitu koneksi pulih.
- **Role:**
  - `OWNER`: Hak akses penuh ke seluruh outlet, pengaturan kafe, laporan laba-rugi, dan staf.
  - `ADMIN`: Pengelolaan operasional cabang/outlet.
  - `CASHIER`: Transaksi POS, meja, riwayat transaksi harian, buka/tutup kasir.
  - `BARISTA`: Tampilan antrean pesanan dapur (Kitchen/Barista Display) dan update status pengerjaan.

### 1.2 Master Data & Pengaturan Toko & Outlet
- **Pengaturan Café & Outlet:**
  - Nama Kafe dan Nama Outlet/Cabang (dapat diubah dinamis dari menu Pengaturan).
  - Alamat outlet, nomor telepon, logo, footer struk.
  - Pengaturan pajak (%) dan service charge (%).
  - Pilihan mode backend & URL endpoint (Spring Boot URL / Google Apps Script Web App URL).
- Manajemen Kategori & Menu Produk (aktif/non-aktif, gambar, harga dasar).
- Varian & Modifier (cth: Ukuran Cup, Hot/Iced, Sweetness Level, Extra Espresso Shot).
- Manajemen Meja (Dine-in table mapping per outlet).

### 1.3 Point of Sale (POS) & Cetak Struk Multifungsi
- Antarmuka kasir cepat (Mobile POS, Tablet, Desktop) dengan status offline/online indicator.
- Manajemen keranjang belanja, modifier, catatan pesanan, Dine-In (pilih meja) atau Takeaway.
- Perhitungan backend & local engine: Subtotal, diskon, pajak/service charge, total, kembalian tunai.
- Pembayaran: Tunai, Transfer Bank, QRIS.
- **Koneksi & Pencetakan Printer Termal Langsung (Web & PWA):**
  - **Web Bluetooth Printing (ESC/POS):** Koneksi langsung dari browser (Chrome Android/PC) ke printer kasir thermal Bluetooth (58mm / 80mm) via `navigator.bluetooth` tanpa driver tambahan.
  - **Web USB / Serial Printing (ESC/POS):** Koneksi kabel langsung via `navigator.usb` / `navigator.serial` untuk kasir desktop/laptop.
  - **CSS Thermal Print & Kiosk Silent Print:** Styling print struk khusus (`58mm` / `80mm`) yang kompatibel dengan browser print dialog atau mode Chrome `--kiosk-printing` (cetak otomatis tanpa pop-up dialog).
  - **Pengaturan Printer:** Pilihan lebar kertas (58mm / 80mm), status koneksi printer, tombol uji coba cetak (*test print*), dan opsi potong kertas otomatis (*auto-cut*).
- **Fitur Struk Pembelian Digital:**
  - **Print / Download PDF:** Render struk kasir rapi ke format PDF siap cetak atau simpan.
  - **Salin Teks (Copy Text):** Format teks terstruktur yang rapi berisi header kafe, item, modifier, total, dan ucapan terima kasih untuk disalin ke clipboard sekali klik.
  - **Kirim ke WhatsApp (Share WA):** Tombol langsung membuka WhatsApp (`https://wa.me/<nomor_pelanggan>?text=<struk_text>`) untuk mengirim e-struk ramah lingkungan tanpa printer kertas fisik.

### 1.4 Modul Barista & Kitchen Order Display
- Tampilan antrean pesanan real-time / live polling.
- Detail pesanan per item, varian, dan catatan barista (cth: "Less Ice, No Sugar").
- Alur status: `PAID` -> `IN_PREPARATION` -> `READY` -> `COMPLETED`.

### 1.5 Inventori, Resep & HPP Otomatis
- Data Bahan Baku (nama, satuan baku: gram, ml, pcs, stok minimum, biaya per satuan).
- Resep / Bill of Materials (BOM) per menu: menghubungkan menu/varian ke bahan baku yang dipakai.
- Pengurangan stok otomatis saat transaksi masuk status `PAID` (atomik, transaksi database, idempotensi).
- Riwayat pergerakan stok (*Stock Movement Audit Trail*): Stok Masuk, Terpakai (Resep), Penyesuaian (Waste/Rusak), Stock Opname.

### 1.6 Pengeluaran Operasional & Pembelian Bahan
- Pencatatan pembelian bahan dari supplier beserta bukti nota.
- Pencatatan beban operasional (listrik, sewa, internet, gaji, perlengkapan).

### 1.7 Dashboard & Laporan Keuangan
- Ringkasan omzet hari ini, minggu ini, bulan ini.
- Produk terlaris & metode pembayaran terfavorit.
- Laporan Penjualan (Harian/Bulanan dengan rentang tanggal).
- Laporan Biaya Bahan Baku (HPP) & Margin Keuntungan Produk.
- Laporan Laba Kotor dan Laba Bersih Sederhana (Omzet - HPP - Beban Operasional).
- Ekspor Laporan ke format Excel (.xlsx) / CSV dan PDF.

---

## 2. Kebutuhan SaaS & Google Play Store (Fase 8 & 9)

### 2.1 SaaS Foundation
- Model langganan/tenant: tabel `tenants` (nama bisnis, paket langganan, status aktif/trial/suspended).
- Isolasi data: setiap query data toko difilter berdasarkan `tenant_id` terotentikasi.
- Halaman registrasi pemilik cafe (Self-service sign-up tenant).

### 2.2 Google Play Store Readiness (Android Client)
- Frontend dibangun mobile-first dengan React, TypeScript, dan Tailwind CSS.
- Integrasi Capacitor (`@capacitor/core`, `@capacitor/android`):
  - Setup konfigurasi `capacitor.config.ts` dan folder proyek Android Studio (`android/`).
  - Dukungan Thermal Receipt Printing melalui Capacitor Bluetooth Serial / USB.
  - Dukungan Offline caching lokal untuk kestabilan UI (PWA service worker + Capacitor).
  - Validasi compliance Google Play Store (Target SDK terbaru, icon adaptif, splash screen, privacy policy URL).
