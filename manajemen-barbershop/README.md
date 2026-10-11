# 💈 BARBERSHOP MANAGEMENT SYSTEM (BARBERPOS)

Aplikasi manajemen operasional Barbershop modern siap pakai untuk bisnis nyata. Dilengkapi dengan antarmuka kasir cepat, manajemen stok produk retail, absensi kehadiran terintegrasi uang makan, struk digital WhatsApp, slip gaji barber, laporan laba rugi bersih, serta arsitektur **Offline-First PWA** dengan pilihan penyimpanan **Google Spreadsheet** atau **Spring Boot Backend**.

---

## 🚀 Fitur Unggulan Sistem

1. **Kasir POS Terintegrasi (Jasa Cukur + Produk Retail)**
   - Satu nota struk dapat menampung layanan jasa potong rambut (lengkap dengan barber yang menangani) **dan** produk retail (pomade, clay, tonic, shampoo).
   - Snapshot harga layanan dan komisi barber tersimpan permanen saat transaksi dibuat (perubahan harga di masa depan tidak mengubah transaksi historis).
   - Pengurangan stok produk otomatis saat transaksi selesai.
   - Proteksi **Anti Double-Click** & Idempotensi: Tombol bayar otomatis terkunci seketika untuk mencegah pembuatan faktur ganda.

2. **Struk Digital WhatsApp (1-Klik) & Struk Thermal Kasir**
   - **Kirim Struk WhatsApp (Gratis tanpa biaya gateway)**: Tombol 1-klik yang otomatis membuka chat WhatsApp pelanggan dengan format pesan struk yang rapi dan profesional.
   - **Cetak Struk Thermal**: Format standar printer struk kasir 58mm/80mm siap print langsung dari browser/tablet.

3. **Absensi Karyawan & Otomatisasi Uang Makan**
   - Check-in & Check-out harian barber dengan status: **Hadir**, **Izin**, **Sakit**, **Alpa/Libur**.
   - Sistem secara otomatis mengalokasikan **Uang Makan Harian** ke akun payroll barber setiap kali status kehadiran tercatat **Hadir**.

4. **Komisi Barber & Rekap Penggajian (Payroll Slip)**
   - Perhitungan komisi akurat dari snapshot layanan yang diselesaikan.
   - Pencatatan bonus target, bonus kerajinan, tips, dan kasbon/potongan.
   - Rekap penerimaan bersih: `Gaji Diterima = Komisi Cukur + Uang Makan (Absensi) + Bonus - Kasbon`.
   - Cetak Slip Gaji perorangan siap cetak.

5. **Manajemen Produk Retail & Stok Barang**
   - Master produk: SKU, Nama, Kategori, Harga Modal (HPP), Harga Jual, Sisa Stok, dan Batas Alert Stok Menipis.
   - Fitur **Quick Restock** saat kulakan barang baru datang.

6. **Dashboard Keuangan & Laba Bersih Operasional**
   - Memisahkan secara presisi:
     - **Omzet Bersih Transaksi** (setelah diskon)
     - **Laba Kotor Produk Retail** = `Omzet Produk - HPP (Modal Produk)`
     - **Laba Kotor Jasa** = `Omzet Jasa - Komisi Barber`
     - **Laba Operasional Bersih Toko** = `(Laba Jasa + Laba Produk) - (Biaya Operasional Toko + Uang Makan & Bonus Staf)`
   - Ekspor seluruh laporan transaksi ke format spreadsheet **CSV / Excel**.

7. **Pilihan Penyimpanan Fleksibel (Dual-Storage Mode)**
   - 🟢 **Mode 1: Google Spreadsheet (via Google Apps Script)**: Serverless, 100% gratis tanpa sewa VPS/hosting database. Data transaksi tersimpan rapi di Google Sheets milik owner.
   - 🔵 **Mode 2: Backend Spring Boot + PostgreSQL**: Enterprise backend tangguh untuk server lokal atau cloud dedicated.

8. **Offline-First & Auto Re-sync (IndexedDB)**
   - Semua data tersimpan di database lokal browser (`IndexedDB` via `Dexie.js`).
   - Kasir tetap bisa transaksi normal meski internet mati atau lambat.
   - Begitu internet terhubung kembali, sistem secara otomatis melakukan sinkronisasi data antrean (*Outbox*) ke server tanpa ada data ganda.

9. **Progressive Web App (PWA)**
   - Dapat diinstall langsung di layar utama (*Add to Home Screen*) di Android, iOS, tablet kasir, maupun PC desktop (tampilan *standalone* layar penuh).

---

## 🛠️ Panduan Instalasi & Menjalankan Aplikasi

### 1. Menjalankan Frontend PWA

Pastikan Node.js telah terpasang:
```bash
cd frontend
npm install
npm run dev
```
Aplikasi akan aktif di `http://localhost:5173`.

---

### 2. Setup Google Spreadsheet (Mode Serverless)

Jika Anda memilih mode **Google Spreadsheet**:
1. Buat spreadsheet baru di [Google Sheets](https://sheets.google.com).
2. Di Google Sheets, buka menu **Extensions** -> **Apps Script**.
3. Buka file `google-apps-script/Code.gs` di repositori ini, salin seluruh isinya, lalu tempel ke editor Apps Script.
4. Klik tombol **Deploy** -> **New deployment** -> Pilih jenis **Web app**:
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
5. Salin Web App URL yang didapatkan (berakhiran `/exec`).
6. Buka aplikasi Barbershop -> Masuk ke menu **Pengaturan** -> Pilih **Google Spreadsheet**, tempel URL tersebut, lalu klik **Uji Koneksi** dan **Simpan Perubahan**.

---

### 3. Menjalankan Backend Spring Boot + PostgreSQL (Opsional)

Jika Anda memilih mode **Spring Boot Backend**:
1. Jalankan PostgreSQL lokal dengan Docker Compose:
   ```bash
   docker compose up -d
   ```
2. Jalankan Spring Boot Backend:
   ```bash
   cd backend
   mvn spring-boot:run
   ```
   Backend REST API akan berjalan di `http://localhost:8080` dan Flyway akan otomatis mengeksekusi skema database `V1__init_schema.sql`.

---

## 📂 Struktur Repositori

```
manajemen-barbershop/
├── frontend/                     # Frontend PWA (React + TypeScript + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/           # UI Components (Button, Layout, Navigation)
│   │   ├── context/              # Global AppContext (Sync state, toast, settings)
│   │   ├── db/                   # Local Database IndexedDB (Dexie.js)
│   │   ├── pages/                # Modul Halaman (POS, Absensi, Layanan, Produk, Barber, Pelanggan, Payroll, Laporan, Setting)
│   │   ├── services/             # SyncEngine, WhatsApp receipt, Audit & Security
│   │   └── types/                # TypeScript Interfaces
│   ├── public/                   # PWA Manifest & App Icons
│   └── vite.config.ts            # Vite PWA Workbox Config
├── backend/                      # Backend Spring Boot 3 (Java 21 LTS)
│   ├── src/main/java/com/barbershop/
│   ├── src/main/resources/
│   │   ├── db/migration/         # Flyway SQL (V1__init_schema.sql)
│   │   └── application.yml
│   └── pom.xml
├── google-apps-script/           # Template Google Apps Script Web App
│   └── Code.gs
├── docker-compose.yml            # PostgreSQL Container
└── README.md
```
