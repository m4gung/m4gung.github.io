# Panduan Setup Google Sheets Backend (Serverless REST API)

File `Code.gs` menyediakan backend serverless siap pakai untuk Google Sheets tanpa perlu sewa server. 

### Langkah-langkah Setup (1 Kali Saja):
1. Buat Spreadsheet baru di [Google Sheets](https://sheets.new). Beri nama misalnya **"Database Manajemen Toko"**.
2. Klik menu **Extensions (Ekstensi)** > **Apps Script**.
3. Hapus kode default `myFunction()`, lalu **Copy & Paste** seluruh isi file [Code.gs](file:///Users/agungmaulana/Projects/MY-PROJECTS/m4gung.github.io/manajemen-toko/google-apps-script/Code.gs) ke editor Apps Script tersebut.
4. Klik tombol **Deploy (Terapkan)** di pojok kanan atas > **New deployment (Penerapan baru)**.
5. Klik ikon gerigi (Select type) > pilih **Web App**.
6. Atur konfigurasi:
   - **Description**: `API Manajemen Toko v1`
   - **Execute as**: `Me (email Anda)`
   - **Who has access**: `Anyone (Siapa saja)` *(Penting agar aplikasi PWA frontend dapat mengaksesnya)*
7. Klik **Deploy**, beri izin Google Access (Review permissions > Advanced > Go to Untitled project).
8. Salin **Web App URL** yang dihasilkan (contoh format: `https://script.google.com/macros/s/AKfycbx.../exec`).
9. Buka aplikasi PWA toko > masuk ke menu **Pengaturan** > **Sumber Data** > pilih **Google Sheets Direct** > tempelkan URL tersebut > Klik **Simpan & Uji Koneksi**.
10. Semua tab tabel (`PRODUK`, `KATEGORI`, `MUTASI_STOK`, `PENJUALAN`, `PIUTANG`, `BAGAN_AKUN`, `JURNAL_UMUM`, dll.) akan terbuat secara otomatis di spreadsheet Anda!

### link app script
- database_demo1
https://script.google.com/macros/s/AKfycbxckKkKDrUNObx5XZ21yUDVaV3lSposprQPJFwnGOGj463-V9VRNFYifdZfEWvmgu26ig/exec