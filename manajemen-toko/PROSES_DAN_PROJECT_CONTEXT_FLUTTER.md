# Blueprint Migrasi Flutter: Manajemen Toko & POS Kasir UMKM
**Platform Target:** Android (HP & Tablet), iOS (iPhone & iPad)  
**Dokumen:** Panduan Proses, Konteks Proyek, Desain Sistem, dan Arsitektur Responsif  
**Target Pengguna:** Pemilik Toko & Kasir UMKM Awam (Tanpa keahlian teknis/akuntansi rumit)

---

## 📋 DAFTAR ISI
1. [Konteks Proyek & Analisis Kelayakan](#1-konteks-proyek--analisis-kelayakan)
2. [Prinsip Desain UI/UX Khusus UMKM Awam](#2-prinsip-desain-uiux-khusus-umkm-awam)
3. [Arsitektur Responsif: HP (iPhone/Android) vs Tablet (iPad/Tab)](#3-arsitektur-responsif-hp-vs-tablet)
4. [Arsitektur Teknis Flutter & Rekomendasi Stack](#4-arsitektur-teknis-flutter--rekomendasi-stack)
5. [Skema Data & Pemetaan Domain (Dari Web ke Flutter)](#5-skema-data--pemetaan-domain)
6. [Integrasi Hardware POS Asli (Printer Thermal, Scanner, WA)](#6-integrasi-hardware-pos-asli)
7. [Tahapan Proses Implementasi (Roadmap Fase 1 - 6)](#7-tahapan-proses-implementasi)
8. [Struktur Folder Proyek Flutter yang Direkomendasikan](#8-struktur-folder-proyek-flutter)

---

## 1. Konteks Proyek & Analisis Kelayakan

### 1.1 Apakah Bisa Dibuat Menjadi Flutter Project?
**Sangat Bisa dan Sangat Direkomendasikan (100% Feasible).**  
Bahkan, untuk aplikasi POS kasir dan manajemen toko fisik, Flutter memiliki keunggulan jauh lebih besar dibandingkan Progressive Web App (PWA) berbasis browser:

| Fitur Utama | Versi Web/PWA Saat Ini | Versi Flutter Native (Android & iOS) |
|---|---|---|
| **Cetak Struk Thermal** | Terbatas pada `window.print()` browser atau Web Bluetooth (sering disconnect & popup browser mengganggu). | **Koneksi Native Bluetooth BLE / USB OTG**: Struk langsung keluar dalam 0.3 detik tanpa popup dialog browser. |
| **Scanner Barcode/QR** | Mengandalkan input keyboard scanner gun atau kamera web browser (berat & lambat fokus). | **Native Camera Scanner (`mobile_scanner` via ML Kit)**: Auto-focus cepat, deteksi multi-format dalam kondisi minim cahaya toko. |
| **Stabilitas Offline** | Bergantung pada IndexedDB (bisa terhapus jika cache browser dibersihkan oleh OS). | **Database Lokal Native (Isar / Drift / SQLite)**: Data 100% aman, terisolasi, tidak akan terhapus kecuali aplikasi di-uninstall. |
| **Kinerja & Responsivitas** | Tergantung performa browser HP murah UMKM. | **Kompilasi AOT (Ahead-of-Time) 60/120 FPS**: Animasi dan transisi mulus bahkan di HP Android entry-level 2GB RAM. |
| **Dukungan iPad / Tablet POS** | CSS media query sering terpotong address bar browser. | **Native Fullscreen Split-Screen Layout** seperti mesin kasir profesional (Moka, Pawoon, Square). |

### 1.2 Tujuan Transformasi ke Flutter
1. **Mempermudah Pengoperasian Kasir**: Tombol besar, alur kasir tanpa mikir, otomatis hitung kembalian dan batas utang.
2. **Menyederhanakan Istilah Akuntansi**: Mengubah istilah rumit ("Debit/Kredit/Jurnal/Aging") menjadi bahasa sehari-hari warung/toko ("Uang Masuk/Uang Keluar/Catatan Hutang").
3. **Satu Basis Kode untuk Semua Layar**: UI otomatis menyesuaikan apakah dibuka di iPhone kecil, HP Android layar panjang, iPad Mini, iPad Pro 12.9", atau tablet Android kasir (Sunmi / Advan Tab).

---

## 2. Prinsip Desain UI/UX Khusus UMKM Awam

Mayoritas pemilik UMKM, pedagang toko kelontong, dan kasir bukan orang teknis. Mereka membutuhkan aplikasi yang **intuitif, minim teks panjang, tombol besar, dan tidak membingungkan**.

### 2.1 Penyederhanaan Bahasa & Istilah

| Istilah Akuntansi/Teknis Lama | Istilah Baru untuk UMKM Awam | Keterangan & Ikon |
|---|---|---|
| *Chart of Account (COA) / Jurnal Umum* | **Buku Kas / Keluar-Masuk Uang** | 💵 Riwayat uang tunai & bank |
| *Debit / Kredit* | **Uang Masuk (+) / Uang Keluar (-)** | Warna Hijau (+) dan Merah (-) |
| *Aging Schedule Piutang (>60 hari)* | **Hutang Pelanggan (Sudah Lewat Waktu)** | Kartu peringatan warna oranye/merah |
| *Stock Opname / Adjusment* | **Cek Fisik Barang / Koreksi Jumlah** | Tombol cepat: Rusak / Hilang / Koreksi |
| *Purchase Order (PO)* | **Catat Belanja / Kulakan Barang** | Tambah stok dari agen/supplier |
| *General Ledger / Buku Besar* | **Rincian Per Pos Pengeluaran** | List sederhana: Biaya Listrik, Sewa, Gaji |
| *Synchronizing Dual Engine* | **Status Simpan: Tersimpan di HP / Sinkron Cloud** | Ikon centang hijau sederhana |

### 2.2 Desain Interaksi Ramah Kasir
- **Target Sentuh Besar (Min 48x48 dp)**: Tombol kasir dan keranjang tidak boleh mudah salah pencet oleh jari pedagang.
- **Tombol Uang Pas Cepat (Quick Cash Chips)**:
  - Tombol: `[Uang Pas]`, `[+Rp 10.000]`, `[+Rp 20.000]`, `[+Rp 50.000]`, `[+Rp 100.000]`.
  - Nominal kembalian ditampilkan dengan font **sangat besar (32sp Bold Hijau)**.
- **Feedback Suara & Getar (Haptic & Audio)**:
  - Efek suara *"Beep"* saat barcode berhasil di-scan.
  - Efek suara *"Kring"* (mesin kasir) saat pembayaran sukses.
  - Getaran halus (haptic feedback) saat barang masuk keranjang.
- **Warna Kontras Tinggi**:
  - Hijau Zamrud (`#059669`): Transaksi Lunas / Uang Masuk / Stok Aman.
  - Merah Koral (`#DC2626`): Stok Habis / Hutang Jatuh Tempo / Pengeluaran.
  - Biru Lembut (`#2563EB`): Aksi Navigasi / Info Pelanggan.

---

## 3. Arsitektur Responsif: HP vs Tablet

Aplikasi menggunakan pendekatan **Adaptive Layout** berbasis lebar layar (`MediaQuery.sizeOf(context).width` atau `LayoutBuilder`):

```
+---------------------------------------------------------------------------------+
| Breakpoint Layout                                                              |
+---------------------------------------------------------------------------------+
| Compact Phone (< 600 dp)         -> Single Column + Bottom Nav + Floating Cart   |
| Medium Tablet Portrait (600-840) -> 2-Column Responsive Split                    |
| Expanded Tablet/iPad (>= 840 dp) -> Dual-Pane POS Stand (Katalog Kiri + Kasir Kanan)|
+---------------------------------------------------------------------------------+
```

### 3.1 Tampilan Smartphone (Android & iPhone < 600dp)
Fokus pada **kemudahan satu tangan (one-handed operation)**:
- **Navigasi Utama**: `NavigationBar` di bagian bawah (Kasir, Produk, Catat Belanja, Hutang, Laporan).
- **Halaman Kasir**:
  - Bagian atas: Search bar produk + tombol Scanner Kamera mengambang di kanan.
  - Kategori berupa *horizontal chips* yang bisa di-scroll ke samping.
  - Daftar produk berbentuk *List Card* vertikal atau *Grid 2 Kolom* dengan foto/ikon jelas dan tombol `+` cepat.
  - Bagian bawah: **Floating Cart Bar** menampilkan `3 Barang | Rp 45.000 -> [Bayar]`.
  - Halaman Checkout: Tampil sebagai **Bottom Sheet / Modal Layar Penuh** dengan tombol angka besar.

### 3.2 Tampilan Tablet & iPad (>= 840dp)
Fokus pada **mode kasir meja (POS Countertop)** tanpa perlu berpindah-pindah layar:
- **Navigasi Samping**: `NavigationRail` ramping di paling kiri.
- **Dual-Pane (Layar Terbagi Dua)**:
  - **Sisi Kiri (60% lebar)**: Grid Katalog Produk (3-4 kolom barang), filter kategori, dan search bar instant.
  - **Sisi Kanan (40% lebar)**: Keranjang Belanja Statis (selalu terlihat):
    - Daftar barang belanja, tombol +/- jumlah, diskon.
    - Data pelanggan (umum / pilih nama pelanggan).
    - Total tagihan & tombol besar **[PROSES BAYAR (F12 / Tap)]**.
- Tidak perlu buka-tutup keranjang belanja, mempercepat antrean pembeli di toko.

---

## 4. Arsitektur Teknis Flutter & Rekomendasi Stack

### 4.1 Pilihan Library & Arsitektur Utama

```
+------------------------------------------------------------------+
|                     PRESENTATION LAYER                           |
|       Flutter UI Widgets + Responsive LayoutBuilder              |
+------------------------------------------------------------------+
|                      STATE MANAGEMENT                            |
|             Flutter Riverpod (v2) / Bloc / Cubit                 |
+------------------------------------------------------------------+
|                        DOMAIN LAYER                              |
|           Models, Use Cases, Accounting Engine SAK EMKM          |
+------------------------------------------------------------------+
|                         DATA LAYER                               |
|   +--------------------------+    +--------------------------+   |
|   | Local Storage (Offline)  |    | Remote Sync Adapter      |   |
|   | Drift / Isar Database    |    | Google Sheets / REST API |   |
|   +--------------------------+    +--------------------------+   |
+------------------------------------------------------------------+
|                       HARDWARE PLUGINS                           |
|   Bluetooth ESC/POS Thermal  |  Mobile Scanner (Camera Barcode)  |
+------------------------------------------------------------------+
```

| Modul | Rekomendasi Package Flutter | Alasan Pemilihan |
|---|---|---|
| **State Management** | `flutter_riverpod` (v2.x) | Ringan, compile-safe, tidak memerlukan `BuildContext` di mana-mana, mudah untuk testing. |
| **Local Database (Offline-First)** | `drift` (SQLite ORM) atau `isar` | Mendukung transaksi ACID (krusial untuk akuntansi double-entry dan mutasi stok agar tidak korup). |
| **Barcode & QR Scanner** | `mobile_scanner` | Berbasis Google ML Kit (Android) & AVFoundation (iOS), instan fokus dan hemat baterai. |
| **Cetak Struk Bluetooth** | `flutter_pos_printer_platform` + `esc_pos_utils_plus` | Mendukung printer thermal 58mm & 80mm Bluetooth, WiFi, USB secara native. |
| **Integrasi WhatsApp & Share** | `url_launcher` + `share_plus` | Kirim struk teks atau gambar struk langsung ke WhatsApp pelanggan. |
| **Format Mata Uang & Angka** | `intl` | Pemformatan otomatis Rupiah (`Rp 15.000`) dan tanggal bahasa Indonesia. |
| **Koneksi Jaringan / REST API** | `dio` + `connectivity_plus` | Deteksi status offline/online otomatis dan interceptor token JWT. |
| **Desain Antarmuka** | Material 3 (`useMaterial3: true`) | Desain modern, otomatis mengikuti preferensi mode gelap/terang, dan tipografi rapi. |

---

## 5. Skema Data & Pemetaan Domain

Arsitektur database lokal mempertahankan logika bisnis dari PWA saat ini:

### 5.1 Tabel-Tabel Utama (Drift / Isar Schema)
1. **`products`**:
   - `id`, `sku`, `barcode`, `name`, `category_id`, `unit`, `cost_price`, `selling_price`, `stock`, `min_stock`, `image_path`.
2. **`sales` & `sale_items`**:
   - Faktur penjualan, tanggal, metode pembayaran (`CASH`, `QRIS`, `TRANSFER`, `CREDIT`), total, diskon, uang diterima, kembalian, status lunas/tempo.
3. **`customers`**:
   - Nama, no HP/WhatsApp, alamat, plafon limit kredit, saldo hutang berjalan (`current_debt`).
4. **`receivables` & `receivable_payments`**:
   - Catatan piutang pelanggan, tanggal jatuh tempo, histori cicilan bertahap.
5. **`purchases` & `purchase_items`**:
   - Pengadaan kulakan barang dari supplier, update stok otomatis, harga modal baru.
6. **`stock_mutations`**:
   - Riwayat audit stok: Pembelian (`IN_PURCHASE`), Penjualan (`OUT_SALE`), Koreksi Opname (`ADJUSTMENT`), Retur (`RETURN`).
7. **`journal_entries` & `journal_lines`**:
   - Double-entry accounting otomatis untuk Kas Toko, Bank, Persediaan, Piutang, Hutang, Modal, Pendapatan, HPP, dan Beban Operasional.

---

## 6. Integrasi Hardware POS Asli

Salah satu nilai jual terbesar migrasi ke Flutter adalah integrasi perangkat keras fisik toko:

### 6.1 Cetak Struk Thermal Bluetooth (58mm / 80mm)
```dart
// Konsep alur cetak di Flutter:
final profile = await CapabilityProfile.load();
final generator = Generator(PaperSize.mm58, profile);
List<int> bytes = [];

bytes += generator.text('TOKO BERKAH JAYA', styles: PosStyles(align: PosAlign.center, bold: true));
bytes += generator.text('Jl. Raya Pasar No. 12', styles: PosStyles(align: PosAlign.center));
bytes += generator.hr();
bytes += generator.row([
  PosColumn(text: 'Beras 5kg x1', width: 8),
  PosColumn(text: '65.000', width: 4, styles: PosStyles(align: PosAlign.right)),
]);
bytes += generator.hr();
bytes += generator.text('TOTAL: Rp 65.000', styles: PosStyles(bold: true, align: PosAlign.right));
bytes += generator.cut();

await printerService.printBytes(bytes);
```

### 6.2 Kamera Barcode Scanner Built-In
Di smartphone/tablet kasir, kamera perangkat dapat dijadikan scanner pengganti scanner gun USB. Tombol scan dapat dibuka langsung dari layar kasir, dan saat barcode terdeteksi, barang langsung masuk keranjang disertai suara *beep*.

### 6.3 Kirim Struk Digital via WhatsApp
Jika toko tidak memiliki kertas printer thermal atau kehabisan kertas:
- Aplikasi menyediakan tombol **"Kirim Struk WA"**.
- Menggunakan skema URL: `https://wa.me/62812xxx?text=...` dengan teks struk terformat rapi (nama barang, qty, total, status lunas, ucapan terima kasih).

---

## 7. Tahapan Proses Implementasi

Migrasi dibagi menjadi 6 tahap terstruktur untuk memastikan hasil stabil dan mudah dipelihara:

```
[FASE 1] Inisialisasi Proyek, Konfigurasi & Basis Data Lokal (Drift/Isar)
   │
[FASE 2] Modul Master Data (Produk, Kategori, Stok, Supplier, Pelanggan)
   │
[FASE 3] Modul Kasir POS Responsif (Katalog, Keranjang, Multi-Metode Bayar)
   │
[FASE 4] Integrasi Hardware (Printer Bluetooth Thermal & Camera Barcode Scanner)
   │
[FASE 5] Modul Kulakan (PO), Hutang Piutang & Jurnal Akuntansi Otomatis
   │
[FASE 6] Dashboard Finansial, Ekspor Laporan, QA Testing & Rilis Build (APK/IPA)
```

### Rincian Tiap Fase:
- **Fase 1**: Setup Flutter 3.x, theming Material 3 (palet hijau toko), struktur folder, dan tabel SQLite lokal.
- **Fase 2**: CRUD produk dengan input harga berpemisah ribuan (`10.000`), stok opname fisik, dan manajemen kontak pelanggan.
- **Fase 3**: Kasir adaptif (HP single column & Tablet dual-pane), chips uang pas cepat, kalkulasi diskon & kembalian otomatis.
- **Fase 4**: Pairing printer thermal Bluetooth, pencarian printer terdekat, cetak struk 58mm/80mm, serta scan barcode via kamera.
- **Fase 5**: Catat kulakan barang, kartu hutang piutang dengan status lewat jatuh tempo, dan jurnal otomatis tanpa istilah debit/kredit yang membingungkan kasir.
- **Fase 6**: Kartu ringkasan omzet harian/bulanan, ekspor PDF/Excel laporan toko, backup/restore data lokal, serta build release Android APK/AAB dan iOS IPA.

---

## 8. Struktur Folder Proyek Flutter yang Direkomendasikan

Struktur arsitektur fitur (*Feature-First Clean Architecture*):

```
lib/
├── app/
│   ├── app.dart                   # MaterialApp & tema responsif
│   ├── constants/                 # Warna, ukuran font, padding
│   └── routes/                    # GoRouter / Navigasi
├── core/
│   ├── database/                  # Drift SQLite AppDatabase & Migrations
│   ├── hardware/                  # BluetoothPrinterService, AudioFeedbackService
│   ├── utils/                     # CurrencyFormatter, DateFormatter
│   └── widgets/                   # BigButton, AdaptiveLayoutBuilder, QuickCashChips
└── features/
    ├── pos/                       # Kasir Point of Sale
    │   ├── presentation/          # PosPhoneScreen, PosTabletScreen, CartWidget
    │   └── controllers/           # CartNotifier, CheckoutNotifier
    ├── products/                  # Produk & Stok
    │   ├── presentation/          # ProductListScreen, AddProductScreen, StockOpnameScreen
    │   └── controllers/           # ProductListNotifier
    ├── receivables/               # Piutang & Hutang Pelanggan
    │   └── presentation/          # DebtListScreen, PaymentDialog
    ├── purchases/                 # Catat Belanja / Kulakan
    │   └── presentation/          # PurchaseScreen, SupplierListScreen
    ├── accounting/                # Buku Kas & Laporan Finansial
    │   └── presentation/          # CashBookScreen, ProfitLossScreen
    └── settings/                  # Profil Toko, Printer Setting, Backup Database
        └── presentation/          # SettingsScreen, BluetoothPrinterDialog
```

---

## 9. Kesimpulan & Rekomendasi Langkah Selanjutnya

1. **Kelayakan**: Transformasi aplikasi manajemen toko ke Flutter adalah langkah tepat untuk meningkatkan kenyamanan pengguna UMKM dan membuka akses ke integrasi hardware POS native (printer Bluetooth & scanner kamera).
2. **Fleksibilitas Perangkat**: Dengan layout adaptive, aplikasi dapat dipasang di smartphone harian pemilik toko (Android/iPhone) maupun tablet kasir meja (iPad/Android Tab) menggunakan satu codebase yang sama.
3. **Langkah Berikutnya**:
   - Mempersiapkan repositori atau folder project Flutter (misal: `toko_pos_flutter`).
   - Menguji koneksi database lokal Drift dan generator cetak ESC/POS.
   - Mengimplementasikan antarmuka Kasir Tablet Dual-Pane sebagai modul prioritas utama.
