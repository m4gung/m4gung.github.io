# Aplikasi Manajemen Toko, POS Kasir & Akuntansi SAK EMKM (PWA Offline-First)

Aplikasi manajemen operasional toko ritel dan grosir untuk UMKM Indonesia dengan arsitektur **Offline-First Progressive Web App (PWA)** dan **Pluggable Dual-Engine Storage Pattern** (Lokal IndexedDB, Google Sheets Serverless Web App API, atau Backend Spring Boot 3 + PostgreSQL).

---

## 🌟 Fitur Unggulan

### 1. Katalog Produk, Kategori & Manajemen Stok Fisik
- **Katalog Terpadu**: SKU, Barcode scanner gun input, nama produk, kategori, harga modal, harga jual, dan stok minimum.
- **Kartu Stok & Audit Mutasi**: Melacak histori keluar-masuk barang (`IN_PURCHASE`, `OUT_SALE`, `ADJUSTMENT`, `RETURN`).
- **Stok Opname / Penyesuaian**: Penyesuaian stok fisik toko dengan alasan (Rusak, Hilang, Koreksi Opname, Salah Input) yang otomatis terjurnal ke akuntansi.

### 2. Kasir POS (Point of Sale) & Multi-Metode Pembayaran
- **Pencarian Cepat & Barcode Gun Scanner**: Deteksi barcode otomatis (`Enter to add`) atau pencarian nama produk.
- **Keranjang Belanja Interaktif**: Validasi sisa stok toko, kalkulasi diskon, subtotal, dan total belanja otomatis.
- **Multi-Metode Pembayaran UMKM**:
  1. **Tunai (Cash)**: Tombol pecahan uang pas (`Uang Pas`, `+Rp 10.000`, `+Rp 50.000`, `+Rp 100.000`) dan kalkulasi kembalian otomatis.
  2. **QRIS Statis Toko**: Menampilkan foto/kode QRIS statis yang diunggah pemilik toko di Pengaturan.
  3. **Transfer Rekening Bank**: Menampilkan No Rekening toko (BCA, Mandiri, BRI, BNI) dengan tombol *Salin No Rek*.
  4. **Tempo / Piutang Usaha**: Penjualan kredit dengan verifikasi limit plafon utang pelanggan dan pemilihan tanggal jatuh tempo.
- **Cetak Struk Thermal**: Format struk kasir termal (58mm / 80mm) siap cetak via printer Bluetooth atau USB (`window.print()`).

### 3. Pengadaan Barang (Purchase Order) & Mitra Supplier
- **Master Data Supplier**: Nama mitra, kontak WhatsApp/HP, alamat gudang.
- **Transaksi Faktur PO**: Multi-item pengadaan barang, penambahan stok fisik otomatis, update harga modal terbaru, dan pencatatan utang usaha jika tempo.

### 4. Piutang Kompleks (*Accounts Receivable*) & Aging Schedule
- **Analisis Umur Piutang (*Aging Schedule Breakdown*)**:
  - **Lancar (*Current*)**: Belum jatuh tempo.
  - **1 – 30 Hari**: Terlambat 1 s.d. 30 hari.
  - **31 – 60 Hari**: Terlambat 31 s.d. 60 hari.
  - **> 60 Hari (*Kritis / Risiko Macet*)**: Terlambat lebih dari 60 hari.
- **Pelunasan & Cicilan Piutang**: Pembayaran cicilan parsial atau pelunasan 100% via Kas/Bank yang otomatis memotong saldo piutang dan utang berjalan pelanggan.
- **Master Pelanggan & Pemantauan Limit Kredit**: Kontrol batas kredit pelanggan dengan visualisasi status *OVER LIMIT*.

### 5. Sistem Akuntansi Lengkap SAK EMKM (*Double-Entry Bookkeeping*)
- **10 Bagan Akun Baku (COA)**: Kas Toko (`1101`), Bank (`1102`), Piutang (`1103`), Persediaan (`1201`), Utang (`2101`), Modal (`3101`), Laba Ditahan (`3201`), Penjualan (`4101`), HPP (`5101`), Beban Operasional (`6101`).
- **Jurnal Umum (*General Journal*)**: Auto-journaling dari kasir POS, pembelian, retur, dan stok opname.
- **Jurnal Manual Dinamis**: Pencatatan biaya operasional toko (listrik, sewa, gaji, internet) dengan kalkulator keseimbangan otomatis (*Debet wajib sama dengan Kredit*).
- **Buku Besar (*General Ledger*)**: Mutasi per akun dengan saldo berjalan (*running balance*).
- **Laporan Laba Rugi (*Income Statement*)**: Pendapatan - HPP = Laba Kotor, Laba Kotor - Beban = Laba Bersih.
- **Laporan Neraca (*Balance Sheet*)**: Verifikasi keseimbangan `Total Aset = Total Kewajiban + Total Ekuitas`.

### 6. Dashboard Analitik Operasional & Ekspor Spreadsheet
- 5 Kartu KPI: Omzet Hari Ini, Omzet Bulan Ini, Estimasi Laba Kotor, Valuasi Aset Stok Toko, dan Piutang Tertagih.
- Peringatan Cepat: Produk Stok Kritis & Tagihan Piutang Menunggak.
- Analisis 5 Produk Paling Laris (*Top Selling Best Sellers*).
- Riwayat transaksi kasir terkini dan cetak ulang struk.
- **Ekspor Data (CSV)**: Unduh Laporan Penjualan dan Jurnal Akuntansi langsung ke format spreadsheet Excel/Google Sheets.

### 7. PWA Offline-First & Arsitektur Dual-Engine
- **Offline PWA**: Aplikasi dapat di-install di Android, iOS, Windows, Mac, dan tetap dapat digunakan bertransaksi saat sinyal internet mati (cache-first service worker & IndexedDB via Dexie.js).
- **Pluggable Storage Switcher**:
  1. `IndexedDB`: Berjalan 100% lokal di browser tanpa server.
  2. `Google Sheets`: Serverless gratis menggunakan Google Apps Script Web App (`Code.gs`).
  3. `Spring Boot 3 + PostgreSQL`: Backend REST API kelas enterprise.

---

## 🚀 Panduan Memulai Cepat

### A. Menjalankan Frontend PWA

1. Pastikan Anda memiliki **Node.js v18+**.
2. Masuk ke direktori `frontend`:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. Buka browser di `http://localhost:3000`.

---

### B. Menghubungkan ke Google Sheets (Opsi Serverless Gratis)

1. Buat Google Spreadsheet baru di Google Drive Anda.
2. Buka menu **Extensions > Apps Script**.
3. Salin seluruh isi file [`google-apps-script/Code.gs`](file:///Users/agungmaulana/Projects/MY-PROJECTS/m4gung.github.io/manajemen-toko/google-apps-script/Code.gs) ke editor Apps Script.
4. Klik **Deploy > New deployment**:
   - Select type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Salin URL Web App yang dihasilkan (contoh: `https://script.google.com/macros/s/.../exec`).
6. Buka aplikasi, masuk ke menu **Pengaturan**:
   - Pilih Mode Database: **Google Sheets**
   - Masukkan URL Web App tersebut.
   - Klik **Uji Koneksi** lalu **Simpan Pengaturan**.

---

### C. Menjalankan Backend Spring Boot 3 + PostgreSQL (Opsi Enterprise)

1. Pastikan Anda memiliki **Java 21 LTS** dan **PostgreSQL**.
2. Buat database:
   ```sql
   CREATE DATABASE db_manajemen_toko;
   ```
3. Sesuaikan konfigurasi di `backend/src/main/resources/application.properties` jika diperlukan (username/password DB).
4. Jalankan backend:
   ```bash
   cd backend
   mvn spring-boot:run
   ```
5. Backend berjalan di `http://localhost:8080`.
6. Di menu Pengaturan aplikasi frontend, pilih Mode Database: **Backend Java (Spring Boot)**.

---

## 🧪 Menjalankan Pengujian (Testing)

### Pengujian Frontend:
```bash
cd frontend
npm run build
```

### Pengujian Backend:
```bash
cd backend
mvn test
```
*Hasil: 21/21 Unit & Integration Tests Lolos.*

---

## 📁 Struktur Direktori

```
├── frontend/                     # Progressive Web App (React 18 + TypeScript + Vite + Tailwind)
│   ├── public/                   # PWA Manifest & Service Worker (sw.js)
│   └── src/
│       ├── adapters/             # Pluggable Data Providers (IndexedDB, Google Sheets, Spring Boot)
│       ├── components/           # UI Components & Navigation
│       ├── context/              # StoreContext (Global state & switcher)
│       ├── db/                   # Dexie.js Schema & Seeds
│       ├── pages/                # Modul Kasir, Produk, Pembelian, Piutang, Akuntansi, Dashboard
│       └── types/                # Kontrak Data TypeScript
├── backend/                      # Spring Boot 3 + Java 21 REST API
│   ├── src/main/java/com/tokomanajemen/
│   │   ├── config/               # Security & CORS Config
│   │   ├── modules/              # Auth, Product, POS, Inventory, Purchase, Accounting
│   │   └── security/             # JWT Token Provider
│   └── src/main/resources/db/migration/ # Flyway Database Migrations (V1, V2, V3)
└── google-apps-script/           # Google Sheets Backend
    ├── Code.gs                   # Apps Script Web App Engine
    └── README.md                 # Petunjuk Setup Google Sheets
```
