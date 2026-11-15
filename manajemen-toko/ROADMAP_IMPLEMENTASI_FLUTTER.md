# Roadmap Langkah-demi-Langkah: Implementasi Flutter POS & Manajemen Toko
**Urutan Platform:** Android HP $\rightarrow$ Tablet Android $\rightarrow$ iOS (iPhone) $\rightarrow$ iPad (iPadOS)  
**Dokumen Terkait:** [`PROSES_DAN_PROJECT_CONTEXT_FLUTTER.md`](file:///Users/agungmaulana/Projects/MY-PROJECTS/m4gung.github.io/manajemen-toko/PROSES_DAN_PROJECT_CONTEXT_FLUTTER.md)  
**Tujuan Utama:** Membangun aplikasi kasir dan manajemen toko UMKM yang super mudah digunakan, dimulai dari perangkat paling banyak dipakai (HP Android), lalu diskalakan ke layar besar dan ekosistem Apple.

---

## 🧭 Ikhtisar Urutan Implementasi

```
+---------------------------------------------------------------------------------------+
| FASE 1: ANDROID SMARTPHONE (Fokus Utama: HP Pedagang & Kasir Satu Tangan)             |
| Pondasi Offline DB, Katalog, Kasir Cepat, Bluetooth Struk 58mm, WhatsApp, Buku Kas   |
+---------------------------------------------------------------------------------------+
                                           │
                                           ▼
+---------------------------------------------------------------------------------------+
| FASE 2: TABLET ANDROID (Fokus: Meja Kasir / Stand POS Toko)                           |
| Responsive Dual-Pane (Katalog Kiri + Keranjang Kanan), Scanner Gun USB/BT, Multi-Kolom|
+---------------------------------------------------------------------------------------+
                                           │
                                           ▼
+---------------------------------------------------------------------------------------+
| FASE 3: iOS iPHONE (Fokus: Ekosistem Apple & Pengguna iPhone)                         |
| Safe Area / Dynamic Island, iOS Permissions (Camera & Bluetooth Core), Apple Pay/QRIS|
+---------------------------------------------------------------------------------------+
                                           │
                                           ▼
+---------------------------------------------------------------------------------------+
| FASE 4: iPAD & iPadOS (Fokus: Mesin Kasir Premium Meja Kasir)                         |
| iPad Multitasking (Split View & Slide Over), AirPrint / WiFi Printer, High-Res Retina |
+---------------------------------------------------------------------------------------+
                                           │
                                           ▼
+---------------------------------------------------------------------------------------+
| FASE 5: SINKRONISASI CLOUD, BACKUP & DISTRIBUSI (Release Readiness)                   |
| Ekspor Excel/PDF, Sinkron Google Sheets / REST API, Backup Restore, Rilis APK & IPA   |
+---------------------------------------------------------------------------------------+
```

---

## 📱 FASE 1: Android Smartphone (Pondasi & Core MVP)

> **Sasaran:** Pedagang warung/toko kelontong bisa langsung bertransaksi dari HP Android murah (RAM 2GB–4GB), cetak struk via printer Bluetooth kecil Rp 150rb-an, dan mencatat kas tanpa koneksi internet.

### Langkah 1.1 — Inisialisasi Proyek & Setup Material 3 UMKM
- [x] Buat proyek Flutter baru dengan identifier ID toko (`com.tokomanajemen.toko_pos` di folder `mobile/`).
- [x] Konfigurasi `pubspec.yaml` dengan dependensi inti:
  - `flutter_riverpod` (State management modern)
  - `sqflite` + `sqflite_common_ffi` (Database lokal offline ACID)
  - `intl` (Format mata uang Rupiah & tanggal Indonesia)
  - `mobile_scanner` (Scan barcode pakai kamera HP)
  - `print_bluetooth_thermal` + `esc_pos_utils_plus` (Cetak struk thermal 58mm)
  - `url_launcher` (Kirim struk WA langsung)
- [x] Atur tema visual Material 3:
  - Warna Utama: Hijau Zamrud Toko (`#059669`) — ramah mata, identik dengan uang dan kesuksesan.
  - Warna Aksen/Peringatan: Merah Koral (`#DC2626`) untuk hutang/stok menipis.
  - Tipografi: Ukuran teks minimal 14sp, label harga dan uang kembalian 24sp–32sp bold.

### Langkah 1.2 — Database Lokal Offline-First (SQLite)
- [x] Buat skema tabel SQLite lokal:
  - `products`: Barcode, nama barang, kategori, harga modal, harga jual, stok fisik, batas stok minimum.
  - `categories`: Kategori produk (Makanan, Minuman, Sembako, Rokok, dll).
  - `sales` & `sale_items`: Riwayat faktur penjualan kasir.
  - `customers`: Data pembeli & batas plafon hutang (limit kredit).
  - `cash_movements`: Catatan Uang Masuk & Uang Keluar toko.
- [x] Buat seed awal (sample data): 6 produk sembako & minuman, 5 kategori dasar, modal kas awal Rp 250.000.

### Langkah 1.3 — Modul Master Produk & Stok Cepat (HP Layout)
- [x] Tampilan Daftar Produk berbentuk Card dengan margin laba bersih/pcs, stok sisa dengan badge warna (hijau = aman, kuning = menipis, merah = habis).
- [x] Fitur Tambah/Edit Produk dengan input uang cerdas:
  - Otomatis format titik ribuan (`Rp 15.000`).
  - Scan barcode kamera langsung mengisi kolom barcode produk.
- [x] Fitur **Koreksi Stok Cepat** (Stok Opname versi awam):
  - Ubah stok fisik langsung dari menu opsi tanpa prosedur akuntansi rumit.

### Langkah 1.4 — Modul Kasir Cepat HP (One-Handed POS)
- [x] Header: Kolom pencarian teks + Tombol Scanner Kamera instan di pojok kanan.
- [x] Horizontal Category Chips: Filter jenis barang yang bisa di-scroll jari.
- [x] Grid Produk 2 Kolom dengan foto, badge stok, dan tombol `+ Tambah` cepat.
- [x] **Floating Bottom Cart Bar**:
  - Menampilkan: `3 Barang Terpilih • Rp 45.000` dengan tombol hijau terang `[BAYAR]`.
- [x] **Halaman Pembayaran (Bottom Sheet Layar Penuh)**:
  - Total tagihan besar di atas.
  - Pilihan metode bayar: `[Tunai (Cash)]`, `[QRIS Toko]`, `[Transfer Bank]`, `[Tempo (Hutang)]`.
  - **Chips Uang Pas**: `[Uang Pas]`, `[+10 rb]`, `[+20 rb]`, `[+50 rb]`, `[+100 rb]`.
  - Kalkulasi Kembalian otomatis font raksasa: **Kembalian: Rp 5.000** (Hijau bold) / **Uang Kurang** (Merah).
  - Jika metode **Tempo (Hutang)**: Validasi otomatis batas limit kredit pelanggan; jika limit Rp 0 atau lewat limit, muncul peringatan merah ramah.

### Langkah 1.5 — Integrasi Printer Thermal Bluetooth & Kirim WA (Android)
- [x] Layar Pengaturan Printer: Scan Bluetooth perangkat sekitar, tombol hubungkan & tes cetak.
- [x] Cetak Struk 58mm otomatis via Bluetooth ESC/POS.
- [x] Tombol **Kirim Struk WhatsApp**: Otomatis buka WhatsApp dengan draft teks terformat rapi jika pembeli tidak minta kertas.
- [x] Efek Haptic Feedback saat scan barang dan transaksi sukses.

### 🔍 Kriteria Selesai Fase 1 (Definition of Done)
1. Proyek Flutter bersih tanpa error analisa (`flutter analyze` lolos 0 issue).
2. Seluruh unit test dan widget test lolos (5/5 tests passed).
3. Transaksi kasir dari pilih barang hingga cetak struk Bluetooth dan share WA siap jalan 100% offline.
2. Transaksi kasir dari pilih barang hingga cetak struk Bluetooth selesai dalam < 10 detik.
3. Seluruh fitur berjalan 100% tanpa koneksi internet (airplane mode).

---

## 📟 FASE 2: Tablet Android (Mode Meja Kasir / Stand POS)

> **Sasaran:** Toko yang mulai berkembang dan meletakkan tablet Android (7" - 11", misal Samsung Galaxy Tab, Advan Tab, Xiaomi Pad, atau mesin Sunmi POS) di meja kasir. Layar lebar dimaksimalkan tanpa buang-buang ruang.

### Langkah 2.1 — Implementasi Adaptive Layout Engine
- [x] Buat widget pembungkus `AdaptiveLayout` & `AdaptiveBuilder` (`core/widgets/adaptive_layout.dart`):
  - Jika lebar layar $< 600\text{ dp}$: Gunakan UI Smartphone (Fase 1) dengan `NavigationBar`.
  - Jika lebar layar $\ge 600\text{ dp}$ (Tablet): Aktifkan `NavigationRail` dan layout meja kasir terbelah dua (*Dual-Pane*).
- [x] Mendukung orientasi Landscape (*Default kasir meja*) maupun Portrait secara responsif.

### Langkah 2.2 — Antarmuka Kasir Meja (Dual-Pane Split POS)
- [x] **Sisi Kiri (60% Lebar Layar — Area Katalog Toko)**:
  - Grid barang responsif 3 sampai 4 kolom dengan harga kontras & badge sisa stok.
  - Baris kategori produk tetap terlihat di bagian atas.
  - Barcode scanner gun eksternal (USB OTG atau Bluetooth HID) terdeteksi otomatis via `Focus` + `onKeyEvent` (`_onHardwareKeyEvent`).
- [x] **Sisi Kanan (40% Lebar Layar — Keranjang Kasir Statis `TabletCartPanel`)**:
  - Keranjang selalu terbuka di samping tanpa perlu modal pop-up.
  - Baris daftar belanja: nama barang, jumlah (`-` / `+`), harga satuan, subtotal.
  - Dropdown pilihan Pelanggan (Umum / Langganan) langsung terlihat.
  - Keypad Angka Kasir (*Integrated POS Numpad*) untuk input uang tunai tanpa memunculkan keyboard virtual OS.

### Langkah 2.3 — Layout Master-Detail untuk Halaman Lain di Tablet
- [x] **Daftar Hutang / Piutang (`DebtListScreen`)**:
  - Kolom Kiri: Daftar nama pelanggan berhutang & total piutang toko.
  - Kolom Kanan: Rincian plafon/hutang pelanggan terpilih + tombol langsung `[Catat Pembayaran Cicilan / Lunas]` dan `[Kirim Pengingat Tagihan via WhatsApp]`.
- [x] **Buku Kas & Pengeluaran Toko (`CashbookScreen`)**:
  - Kolom Kiri: Ringkasan arus kas harian & riwayat mutasi kas.
  - Kolom Kanan: Formulir inline tambah uang masuk / pengeluaran operasional (dengan quick chips Listrik, Plastik, Gaji, Sewa, Transport).

### Langkah 2.4 — Dukungan Printer Thermal 80mm & Cash Drawer
- [x] Opsi ukuran kertas struk di Pengaturan (`ReceiptPaperSize.mm58` dan `ReceiptPaperSize.mm80`).
- [x] Perintah kick cash drawer ESC/POS (`[0x1B, 0x70, 0x00, 0x19, 0xFA]` / `ESC p 0 25 250`) otomatis saat cetak struk maupun tombol manual `[Buka Laci Kasir]`.

### 🔍 Kriteria Selesai Fase 2 (Definition of Done)
1. Tampilan tablet landscape terisi padat dan ergonomis tanpa overflow (`Tablet Dual-Pane POS Render Test` lolos).
2. Kasir dapat melayani pelanggan berturut-turut tanpa berpindah halaman sama sekali.
3. Scanner barcode eksternal (USB/Bluetooth) langsung menambah barang ke keranjang saat di-tembak.

---

## 🍏 FASE 3: iOS (iPhone)

> **Sasaran:** Pemilik toko atau kasir yang menggunakan iPhone (dari iPhone SE layar kecil hingga iPhone 16 Pro Max dengan Dynamic Island).

### Langkah 3.1 — Konfigurasi Lingkungan iOS & Xcode
- [x] Konfigurasi bundle identifier iOS di `ios/Runner.xcodeproj` (`com.tokomanajemen.tokoPos`).
- [x] Atur izin privasi pengguna di `ios/Runner/Info.plist`:
  - `NSCameraUsageDescription`: *"Aplikasi membutuhkan akses kamera untuk memindai barcode produk di kasir."*
  - `NSBluetoothAlwaysUsageDescription` & `NSBluetoothPeripheralUsageDescription`: *"Aplikasi membutuhkan Bluetooth untuk menghubungkan dan mencetak struk via printer thermal."*
  - `NSPhotoLibraryAddUsageDescription` & `LSApplicationQueriesSchemes` (`whatsapp`, `https`).
- [x] Deployment target iOS minimal `15.0` terverifikasi di `project.pbxproj`.

### Langkah 3.2 — Adaptasi Desain Khas iOS (Human Interface Guidelines)
- [x] Penanganan **Safe Area, Home Indicator, dan Dynamic Island/Notch**:
  - Floating bottom cart bar dibungkus `SafeArea` agar tidak tertutup gesture home bar iPhone.
- [x] Keyboard Dismiss & Avoidance:
  - Global `KeyboardDismisser` di `main.dart` (tap di luar input langsung menutup keyboard iOS).
  - Input field modal checkout menyesuaikan `MediaQuery.of(context).viewInsets.bottom`.
- [x] Haptic Feedback:
  - `AudioFeedbackService` dilengkapi `HapticFeedback.selectionClick()`, `lightImpact()`, `mediumImpact()`, dan `heavyImpact()` khas Taptic Engine iPhone.

### Langkah 3.3 — Integrasi Bluetooth Low Energy (BLE) di iOS
- [x] Dukungan BLE via `print_bluetooth_thermal` & pengecekan status Bluetooth (`PrinterService.isBluetoothEnabled()`).
- [x] Dialog **Panduan Koneksi Printer Bluetooth** di Pengaturan (petunjuk nyalakan Bluetooth di Control Center iPhone & daftar printer BLE populer: Iware, VSC, Panda, Eppos, BellaV).

### Langkah 3.4 — Integrasi Pembayaran QRIS & Berbagi Gambar
- [x] Widget **Tampilkan QRIS Toko (`QrisDisplayWidget` via `qr_flutter`)**: Kode QRIS tajam di layar Retina iPhone/iPad agar pembeli dapat langsung scan m-Banking / e-Wallet.
- [x] Fitur **Simpan / Bagikan Gambar Struk** (`RepaintBoundary` PNG + `share_plus`) untuk kirim via AirDrop, iMessage, WhatsApp, atau simpan ke Photos.

### 🔍 Kriteria Selesai Fase 3 (Definition of Done)
1. Konfigurasi `Info.plist`, target iOS 15.0, dan izin kamera/Bluetooth/Photos lengkap.
2. `flutter analyze` lolos 0 issue dan seluruh unit/widget test lolos (10/10 tests passed).
3. Keyboard virtual tidak menutupi tombol bayar dan dapat ditutup dengan tap di luar input.

---

## 🪟 FASE 4: iPad & iPadOS (Mesin Kasir Meja Premium)

> **Sasaran:** Toko modern, butik, minimarket, atau kafe UMKM yang menggunakan iPad di atas meja kasir (*stand mount*).

### Langkah 4.1 — Konfigurasi Target iPad di Xcode
- [x] Aktifkan dukungan perangkat iPad di Xcode (`Target Device Families: iPhone, iPad`).
- [x] Aktifkan semua orientasi untuk iPad: Landscape Left, Landscape Right, Portrait, Portrait Upside Down.
- [x] Konfigurasi dukungan iPadOS Multitasking:
  - Dukungan **Split View** (iPad terbagi dua dengan aplikasi lain, misal buka WhatsApp toko di samping kasir).
  - Dukungan **Slide Over** (aplikasi kasir tetap responsif saat dibuka dalam jendela mengambang ramping).

### Langkah 4.2 — Optimalisasi Resolusi Tinggi Retina & Touch Target iPad
- [x] Skalakan grid produk: Pada layar iPad 10.9" / 12.9" Pro, grid katalog otomatis memuat 4 hingga 6 kolom produk.
- [x] Foto produk menggunakan cache resolusi tinggi agar tidak buram di layar tajam Liquid Retina iPad.
- [x] Dialog dan pop-up tidak boleh membesar berlebihan: Gunakan batas lebar maksimal (`maxWidth: 500dp`) di tengah layar untuk dialog pembayaran dan edit produk.

### Langkah 4.3 — Dukungan AirPrint & Printer Jaringan (WiFi / LAN)
- [x] Selain Bluetooth, kasir iPad sering menggunakan printer thermal jaringan (kabel LAN / WiFi) yang tersambung ke router toko.
- [x] Tambahkan opsi cetak via IP Address (`192.168.1.xxx`) port 9100.
- [x] Dukungan cetak dokumen laporan keuangan ke printer kertas HVS standar via **Apple AirPrint**.

### Langkah 4.4 — Dukungan Pointer & Keyboard Fisik iPad
- [x] Tambahkan efek *Hover* halus saat kursor trackpad/mouse iPad mengarah ke tombol produk.
- [x] Dukungan tombol shortcut keyboard fisik (misal Magic Keyboard):
  - `F1` atau `Space`: Buka scanner barcode.
  - `F12` atau `Enter`: Buka dialog pembayaran langsung.
  - `Esc`: Batal atau tutup modal keranjang.

### 🔍 Kriteria Selesai Fase 4 (Definition of Done)
1. Aplikasi berjalan sempurna di iPad dalam mode Fullscreen, 50:50 Split View, dan Slide Over tanpa layout overflow/error.
2. Mendukung printer thermal via WiFi/LAN maupun Bluetooth BLE.
3. Kerapian visual di layar besar iPad Pro tanpa ada tombol yang terlalu renggang atau buram.

---

## ☁️ FASE 5: Sinkronisasi Cloud, Backup & Peluncuran Rilis

> **Sasaran:** Pengamanan data toko, ekspor laporan ke Excel/PDF, sinkronisasi antar perangkat, dan distribusi ke Google Play Store & Apple App Store.

### Langkah 5.1 — Fitur Backup & Restore Data Toko (Tanpa Server Rumit)
- [x] **Ekspor Backup Lokal (.json / .zip terenkripsi)**:
  - Pemilik toko bisa backup seluruh data produk, riwayat penjualan, dan kas ke file lokal dengan 1 tombol.
  - Bisa dikirim ke Google Drive atau WhatsApp pemilik.
- [x] **Pulihkan Data (Restore)**:
  - Jika pemilik ganti HP/tablet, cukup impor file backup dan seluruh toko langsung kembali normal.

### Langkah 5.2 — Sinkronisasi Google Sheets (Gratis untuk UMKM)
- [x] Menggunakan engine Google Apps Script dari proyek web sebelumnya (`google-apps-script/Code.gs`):
  - Setiap sore/tutup toko, ada tombol **"Kirim Data Hari Ini ke Google Sheets"**.
  - Pemilik toko bisa melihat rekap penjualan di laptop via spreadsheet Google gratis tanpa bayar server bulanan.

### Langkah 5.3 — Laporan Keuangan Sederhana & Ekspor Excel (CSV)
- [x] **Laporan Penjualan Harian & Bulanan**: Total omzet kotor, keuntungan bersih, dan barang paling laris.
- [x] **Buku Kas Toko**: Total uang masuk vs uang keluar hari ini.
- [x] **Daftar Hutang Jatuh Tempo**: Tombol cepat untuk kirim pesan pengingat tagihan ke WhatsApp pelanggan.
- [x] Fitur unduh laporan ke format Excel (`.csv` / `.xlsx`) dan cetak PDF rangkuman harian.

### Langkah 5.4 — Final Hardening & Build Rilis
- [x] Pengujian offline ketat (simulasi 50 transaksi offline + backup/restore roundtrip tanpa data hilang pada automated test).
- [ ] Build Android (siap dijalankan saat rilis):
  - `flutter build appbundle` (untuk Google Play Store).
  - `flutter build apk --split-per-abi` (untuk instalasi manual / sideload langsung tanpa Play Store).
- [ ] Build iOS (siap dijalankan dengan Apple Developer Signing):
  - `flutter build ipa` (untuk distribusi Apple TestFlight dan App Store).

---

## 📊 Matriks Pelacakan Kemajuan Proyek (Progress Tracker)

Gunakan tabel ini untuk mencatat status pengerjaan setiap tahapan:

| Fase | Fokus Perangkat | Status | Catatan Teknis / Tanggal |
|---|---|---|---|
| **Fase 1** | Android Smartphone (Core POS & Offline DB) | `[SELESAI ✅]` | SQLite Offline DB, Kasir 1-tangan, BT 58mm, WA, 5/5 Test Passed |
| **Fase 2** | Tablet Android (Dual-Pane Stand POS) | `[SELESAI ✅]` | AdaptiveLayout, Dual-Pane 60:40, Numpad POS, USB/BT Scanner Gun, 80mm & Cash Drawer (8/8 Test Passed) |
| **Fase 3** | iOS iPhone (Apple Ecosystem Adaptations) | `[SELESAI ✅]` | Info.plist BLE/Kamera/Photos, KeyboardDismisser, Haptic, QRIS Retina, Share Gambar Struk (10/10 Test Passed) |
| **Fase 4** | iPad & iPadOS (Multitasking & AirPrint) | `[SELESAI ✅]` | Multitasking Split View/Slide Over, Grid 4–6 Kolom, WiFi/LAN Port 9100, Apple AirPrint PDF, Hover & Shortcut Keyboard (12/12 Test Passed) |
| **Fase 5** | Backup, Cloud Sync & Peluncuran Store | `[SELESAI ✅]` | Backup/Restore JSON, Sinkron Google Sheets (`Code.gs`), Laporan Harian/Bulanan, Ekspor CSV & PDF, Hardening 50 Transaksi Offline (15/15 Test Passed) |

---

## 💡 Rekomendasi Mulai Eksekusi
Langkah berikutnya yang dapat kita jalankan:
1. **Membuat folder proyek Flutter baru** (misalnya `manajemen_toko_app` atau `pos_umkm_flutter`).
2. **Setup arsitektur data lokal (Fase 1.1 & 1.2)**: Menginisialisasi schema SQLite Drift yang mengadopsi data dari sistem web saat ini.
3. **Membuat antarmuka Kasir Smartphone Android**: Menampilkan grid produk dengan tombol tambah cepat dan drawer pembayaran.
