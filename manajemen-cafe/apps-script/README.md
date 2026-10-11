# Panduan Penggunaan Google Apps Script (Backend Gratis)

Skrip ini memungkinkan Anda menjalankan sistem kasir Cafe Management System dengan sinkronisasi ke **Google Sheets** tanpa perlu menyewa VPS/Cloud Server.

## Langkah Instalasi Cepat:
1. Buka [Google Sheets](https://sheets.new) baru di akun Google Anda.
2. Beri nama spreadsheet, misalnya: `Database Kafe Saya`.
3. Klik menu **Extensions** (Ekstensi) -> **Apps Script**.
4. Hapus semua isi file `Code.gs` bawaan, lalu salin seluruh isi file [Code.gs](file:///Users/agungmaulana/Projects/MY-PROJECTS/m4gung.github.io/manajemen-cafe/apps-script/Code.gs).
5. Klik **Save** (ikon disket).
6. Klik tombol **Deploy** (Terapkan) di kanan atas -> pilih **New deployment** (Penerapan baru).
7. Klik ikon gerigi (Select type) -> pilih **Web app**.
8. Konfigurasi:
   - **Execute as:** `Me` (email Anda).
   - **Who has access:** `Anyone` (Siapa saja, agar aplikasi web kasir bisa mengirim data).
9. Klik **Deploy** dan berikan izin (*Authorize access*).
10. Salin **Web App URL** yang dihasilkan (contoh: `https://script.google.com/macros/s/AKfycb.../exec`).
11. Buka menu **Pengaturan** di aplikasi web kasir kami, pilih mode backend **Google Apps Script**, dan tempelkan URL tersebut.
12. Selesai! Semua transaksi penjualan akan otomatis tersinkron ke Google Sheets secara real-time.
