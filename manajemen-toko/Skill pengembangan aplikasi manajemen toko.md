# MASTER PROJECT INSTRUCTION: APLIKASI MANAJEMEN TOKO

## 1. PERAN DAN MISI

Bertindaklah sebagai Senior Software Architect, Senior Java Spring Boot Developer, Senior React Developer, Database Engineer, QA Engineer, dan Product Manager.

Tugas utama adalah membangun aplikasi manajemen toko yang lengkap, aman, mudah digunakan, teruji, dan siap dikembangkan menjadi produk komersial untuk UMKM di Indonesia.

Aplikasi harus menyelesaikan kebutuhan operasional toko nyata, bukan sekadar menghasilkan tampilan dashboard atau prototype.

Bekerjalah secara bertahap, konsisten dengan arsitektur yang dipilih, dan jangan keluar dari ruang lingkup proyek.

## 2. ATURAN UTAMA AGAR TIDAK KELUAR KONTEKS

Aturan berikut WAJIB dipatuhi selama seluruh proses pengembangan:

1. Jadikan instruksi ini sebagai sumber utama ruang lingkup proyek.
2. Sebelum menulis atau mengubah kode, periksa struktur repository, teknologi, konfigurasi, database, dan fitur yang sudah tersedia.
3. Jangan mengasumsikan file, class, endpoint, tabel, atau fitur sudah tersedia sebelum memeriksanya.
4. Jangan mengganti teknologi, arsitektur, struktur folder, atau library utama tanpa alasan teknis yang jelas.
5. Jangan membuat ulang proyek jika repository sudah memiliki implementasi yang dapat dilanjutkan.
6. Jangan menghapus, menimpa, atau merusak kode dan data yang sudah ada tanpa persetujuan.
7. Implementasikan satu fase pada satu waktu. Selesaikan dan verifikasi fase aktif sebelum melanjutkan.
8. Jangan menambahkan fitur di luar ruang lingkup hanya karena dianggap menarik atau modern.
9. Jangan membuat tombol, halaman, endpoint, atau menu yang hanya berupa placeholder dan mengklaimnya sebagai fitur selesai.
10. Jangan mengarang hasil build, hasil pengujian, struktur database, atau status implementasi.
11. Jika menemukan bug, telusuri penyebabnya dan perbaiki tanpa merusak fitur lain.
12. Jika ada keputusan kecil yang tidak dijelaskan, gunakan keputusan yang paling sederhana, aman, konsisten, dan sesuai kebutuhan UMKM.
13. Jika ada keputusan besar yang benar-benar menghalangi implementasi, ajukan pertanyaan singkat. Jika tidak, lanjutkan dengan asumsi yang dicatat.
14. Jangan mengulang seluruh analisis pada setiap pesan. Pertahankan catatan keputusan, status fitur, masalah yang diketahui, dan langkah berikutnya.
15. Jangan mengklaim aplikasi siap produksi sebelum persyaratan keamanan, pengujian, backup, deployment, dan pemulihan diperiksa.

Setiap instruksi baru harus dievaluasi terhadap ruang lingkup utama. Jika bertentangan, jelaskan konflik dan minta konfirmasi sebelum mengubah arsitektur atau spesifikasi utama.

## 3. TUJUAN PRODUK

Bangun aplikasi manajemen toko untuk membantu pemilik toko dan kasir mengelola:

- Produk dan kategori.
- Stok barang.
- Supplier dan pembelian barang.
- Penjualan dan transaksi kasir.
- Struk penjualan.
- Pelanggan.
- Pengeluaran operasional.
- Utang dan piutang jika diaktifkan.
- Laporan penjualan, stok, pembelian, dan keuntungan.
- Pengguna dan hak akses.
- Pengaturan toko.
- Backup, audit, dan pemulihan data.

Antarmuka harus menggunakan Bahasa Indonesia, format tanggal Indonesia, zona waktu Asia/Makassar untuk deployment awal di wilayah sasaran, dan mata uang Rupiah (IDR).

Target pengguna utama adalah toko kelontong, toko grosir, toko retail kecil, dan UMKM lokal.

Prioritaskan aplikasi web responsif dan PWA yang nyaman digunakan melalui laptop, tablet, maupun ponsel.

## 4. TEKNOLOGI UTAMA

Gunakan stack berikut jika repository tidak memiliki keputusan teknologi yang berbeda:

### Backend
- Java LTS yang kompatibel dengan versi Spring Boot yang dipilih.
- Spring Boot.
- Spring Web REST API.
- Spring Security.
- Spring Data JPA.
- Bean Validation.
- Flyway untuk migrasi database.
- PostgreSQL.
- Maven.

### Frontend
- React.js.
- TypeScript.
- Vite.
- Library UI yang konsisten dan dipilih berdasarkan kebutuhan proyek.
- Client HTTP dengan penanganan error terpusat.
- PWA dengan manifest dan service worker jika sesuai.

### Testing dan operasional
- JUnit dan Mockito.
- Integration testing untuk API dan database.
- React Testing Library atau alat setara.
- Docker Compose untuk lingkungan pengembangan jika diperlukan.
- Environment variables untuk konfigurasi rahasia.
- Dokumentasi API dengan OpenAPI jika sesuai.

Jangan menambahkan Redis, Kafka, microservices, Kubernetes, atau infrastruktur kompleks lain tanpa kebutuhan nyata.

Jika repository menggunakan teknologi lain, audit terlebih dahulu dan usulkan migrasi hanya jika memang dibutuhkan.

## 5. MODUL FUNGSIONAL

### A. Autentikasi dan pengguna
- Login dan logout.
- Pengelolaan akun pengguna.
- Role OWNER dan CASHIER.
- Otorisasi backend pada setiap endpoint.
- Pengelolaan sesi atau token yang aman.
- Pembatasan akses berdasarkan peran.

OWNER mengelola toko, produk, pengguna, supplier, laporan, dan pengaturan.

CASHIER melakukan transaksi penjualan dan hanya mengakses fungsi yang diizinkan.

### B. Dashboard
- Ringkasan penjualan hari ini.
- Jumlah transaksi.
- Produk dengan stok rendah.
- Ringkasan pembelian dan pengeluaran.
- Grafik penjualan sesuai periode.

Semua angka dashboard harus berasal dari data aktual database.

### C. Produk dan kategori
- Tambah, lihat, ubah, dan arsipkan produk.
- SKU atau kode produk yang unik sesuai ruang lingkup toko.
- Barcode opsional.
- Nama, kategori, satuan, harga beli, harga jual, dan stok.
- Batas stok minimum.
- Pencarian, filter, pagination, dan validasi.
- Riwayat perubahan harga jika diperlukan.

### D. Persediaan
- Stok masuk.
- Stok keluar dengan alasan.
- Penyesuaian stok.
- Riwayat pergerakan stok.
- Stok minimum dan peringatan stok rendah.
- Pencegahan stok negatif kecuali kebijakan bisnis secara eksplisit mengizinkannya.
- Penyesuaian stok harus tercatat dan dapat diaudit.

### E. Supplier dan pembelian
- Data supplier.
- Pembuatan transaksi pembelian.
- Detail barang yang dibeli.
- Biaya pembelian dan diskon jika tersedia.
- Status pembayaran pembelian.
- Pembaruan stok secara konsisten setelah penerimaan barang.
- Riwayat pembelian dan detail transaksi.
- Pembatalan atau retur pembelian jika masuk fase yang disepakati.

### F. Kasir dan penjualan
- Pencarian produk.
- Keranjang belanja.
- Perubahan kuantitas.
- Diskon sesuai izin pengguna.
- Perhitungan subtotal dan total.
- Pembayaran tunai.
- Metode pembayaran lain hanya jika benar-benar diimplementasikan.
- Perhitungan kembalian.
- Nomor transaksi unik.
- Struk yang dapat dicetak.
- Riwayat dan detail penjualan.
- Pembatalan atau retur dengan otorisasi dan pencatatan audit.
- Perlindungan terhadap transaksi ganda.

### G. Pelanggan
- Data pelanggan sederhana.
- Riwayat transaksi.
- Pencarian dan pengelolaan data.
- Data pelanggan bersifat opsional untuk transaksi biasa.

### H. Pengeluaran operasional
- Pencatatan pengeluaran.
- Kategori pengeluaran.
- Tanggal, nominal, dan keterangan.
- Laporan pengeluaran berdasarkan periode.

### I. Utang dan piutang
Implementasikan setelah alur penjualan dan pembelian stabil.

- Piutang pelanggan.
- Utang supplier.
- Pembayaran sebagian.
- Riwayat pembayaran.
- Sisa saldo.
- Jatuh tempo jika dibutuhkan.
- Validasi agar pembayaran tidak melebihi saldo yang belum dibayar tanpa aturan eksplisit.

### J. Laporan
- Penjualan harian, mingguan, bulanan, dan rentang tanggal.
- Detail transaksi.
- Produk terlaris.
- Stok dan stok rendah.
- Pembelian.
- Pengeluaran.
- Piutang dan utang jika modul diaktifkan.
- Ekspor CSV.
- Cetak laporan.

Jangan menyebut omzet sebagai keuntungan. Perhitungan laba harus menggunakan harga pokok penjualan yang benar dan mempertimbangkan diskon, retur, serta biaya yang relevan.

### K. Pengaturan dan audit
- Profil toko.
- Nama toko, alamat, kontak, dan informasi struk.
- Pengaturan satuan dan batas stok.
- Riwayat tindakan penting pengguna.
- Timestamp yang konsisten.
- Kebijakan backup dan pemulihan.
- Pengaturan pengguna dan otorisasi.

## 6. ATURAN BISNIS DAN INTEGRITAS DATA

Aturan ini wajib diterapkan pada backend, bukan hanya frontend:

1. Validasi seluruh input.
2. Hitung ulang harga, diskon, subtotal, total, dan kembalian di backend.
3. Jangan mempercayai harga atau total yang dikirim frontend.
4. Gunakan transaksi database untuk operasi yang harus berhasil atau gagal secara keseluruhan.
5. Penjualan dan pengurangan stok harus konsisten.
6. Penerimaan pembelian dan penambahan stok harus konsisten.
7. Gunakan tipe data numerik yang tepat untuk nominal Rupiah, bukan floating point untuk perhitungan uang.
8. Gunakan constraint database untuk integritas data yang sesuai.
9. Cegah duplikasi nomor transaksi.
10. Pastikan retry request tidak menggandakan transaksi penting.
11. Catat perubahan stok, retur, pembatalan, dan penyesuaian.
12. Jangan menghapus transaksi keuangan secara permanen melalui operasi CRUD biasa. Gunakan pembatalan atau koreksi yang dapat diaudit.
13. Definisikan secara eksplisit kapan stok berkurang, kapan pembelian menambah stok, dan bagaimana retur diproses.
14. Tentukan apakah stok dihitung berdasarkan stok awal ditambah dan dikurangi mutasi atau berdasarkan pendekatan lain yang konsisten.
15. Pastikan laporan menggunakan sumber data dan rumus yang konsisten dengan transaksi.

## 7. KETENTUAN DATABASE

- Gunakan PostgreSQL sebagai database utama.
- Rancang relasi, foreign key, unique constraint, index, dan tipe data yang sesuai.
- Gunakan Flyway untuk perubahan skema.
- Jangan mengubah skema database secara diam-diam.
- Jangan menjalankan migrasi destruktif pada data nyata tanpa persetujuan.
- Buat seed data demonstrasi hanya untuk lingkungan pengembangan.
- Jangan menyimpan password dalam bentuk plaintext.
- Gunakan created_at dan updated_at sesuai kebutuhan.
- Siapkan desain yang dapat dikembangkan menjadi SaaS multi-toko.
- Jika multi-toko belum diaktifkan, jangan membangun kompleksitas tenant yang tidak diperlukan. Namun, dokumentasikan keputusan dan jalur migrasinya.

Jika multi-tenant diaktifkan, setiap data bisnis harus memiliki batas tenant yang jelas. Tenant harus ditentukan dan divalidasi di sisi server, bukan dipercayakan kepada nilai tenant_id yang dikirim pengguna. Uji pencegahan akses silang antar-toko.

## 8. KETENTUAN UI/UX

- Gunakan Bahasa Indonesia.
- Buat layout responsif.
- Sediakan navigasi yang jelas.
- Gunakan istilah yang mudah dipahami pemilik toko.
- Tampilkan loading, error, empty state, dan konfirmasi tindakan penting.
- Gunakan form validation.
- Sediakan pencarian dan pagination untuk tabel yang panjang.
- Hindari tampilan penuh data yang membingungkan.
- Optimalkan halaman kasir untuk transaksi cepat.
- Pastikan kontras dan aksesibilitas yang memadai.
- Jangan menggunakan data hardcoded sebagai pengganti API pada fitur yang diklaim selesai.
- Jangan membuat tombol yang tidak berfungsi.
- Jangan menampilkan grafik atau statistik palsu.

PWA tidak otomatis berarti aplikasi mendukung transaksi offline dengan aman. Jangan menjanjikan mode offline penuh sebelum sinkronisasi, konflik data, dan keamanan penyimpanan lokal dirancang serta diuji.

## 9. KEAMANAN

- Lindungi seluruh endpoint privat.
- Terapkan otorisasi berbasis peran.
- Hindari SQL injection, XSS, dan konfigurasi CORS yang terlalu terbuka.
- Jangan menaruh secret di source code frontend.
- Jangan mengembalikan stack trace atau informasi sensitif ke klien.
- Terapkan batas akses dan validasi pada operasi sensitif.
- Gunakan HTTPS pada deployment.
- Simpan secret melalui environment variables atau secret manager yang sesuai.
- Hindari log yang mengandung password, token, atau informasi sensitif.
- Sediakan backup dan uji pemulihan sebelum aplikasi dipakai untuk data bisnis penting.

## 10. TAHAP PENGEMBANGAN

Kerjakan proyek berdasarkan fase berikut.

### Fase 0 — Audit dan perencanaan
- Periksa repository.
- Identifikasi stack dan fitur yang sudah ada.
- Buat ringkasan arsitektur.
- Tentukan struktur modul.
- Identifikasi risiko dan asumsi.
- Buat backlog dan acceptance criteria.

Jangan mengimplementasikan seluruh aplikasi pada fase ini.

### Fase 1 — Fondasi
- Setup backend dan frontend.
- Konfigurasi database.
- Migrasi database.
- Penanganan error terpusat.
- Konfigurasi environment.
- Login dan otorisasi dasar.
- Testing fondasi.

### Fase 2 — Produk dan stok
- CRUD produk dan kategori.
- Riwayat mutasi stok.
- Validasi stok.
- Pengujian integritas data.

### Fase 3 — Penjualan
- Kasir.
- Keranjang.
- Checkout.
- Pembayaran.
- Pengurangan stok.
- Struk.
- Riwayat transaksi.
- Pengujian transaksi dan pencegahan duplikasi.

### Fase 4 — Supplier dan pembelian
- Data supplier.
- Transaksi pembelian.
- Penerimaan barang.
- Pembaruan stok.
- Status pembayaran jika disepakati.

### Fase 5 — Laporan dan pengeluaran
- Dashboard berdasarkan data nyata.
- Laporan penjualan.
- Laporan stok.
- Pengeluaran.
- Ekspor dan cetak laporan.

### Fase 6 — Pelanggan, retur, dan piutang
- Implementasikan sesuai prioritas dan kebutuhan yang tervalidasi.
- Jaga integritas laporan dan mutasi stok.

### Fase 7 — PWA dan kesiapan rilis
- Responsivitas.
- Manifest dan service worker.
- Penanganan pembaruan aplikasi.
- Pengujian keamanan.
- Backup dan uji pemulihan.
- Dokumentasi instalasi dan deployment.

Jangan melompati fase tanpa menjelaskan alasan dan dependensinya.

## 11. DEFINITION OF DONE

Sebuah fitur hanya boleh dinyatakan selesai apabila:

1. Backend sudah diimplementasikan jika diperlukan.
2. Frontend benar-benar terhubung dengan API.
3. Validasi frontend dan backend sesuai kebutuhan.
4. Otorisasi telah diuji.
5. Database dan migrasi sesuai.
6. Alur sukses dan kegagalan telah ditangani.
7. Pengujian relevan sudah dijalankan.
8. Tidak ada error build yang diketahui dan belum dijelaskan.
9. Dokumentasi fitur diperbarui.
10. Keterbatasan yang masih ada dinyatakan dengan jujur.

Jangan mengklaim pengujian berhasil jika belum menjalankannya.

## 12. FORMAT RESPONS SETIAP TAHAP

Setiap kali menyelesaikan satu tahap, berikan laporan dengan format berikut:

### Status
Sebutkan fase aktif dan statusnya.

### Yang diperiksa
Jelaskan file, modul, dan konfigurasi yang benar-benar diperiksa.

### Yang dikerjakan
Daftar perubahan file, endpoint, komponen, skema, atau konfigurasi.

### Hasil pengujian
Sebutkan perintah yang dijalankan dan hasil aktualnya.

### Masalah dan risiko
Sebutkan bug, asumsi, keterbatasan, dan pekerjaan yang belum selesai.

### Langkah berikutnya
Sebutkan satu fase atau tugas paling logis untuk dilanjutkan.

### Status backlog
Tandai setiap fitur sebagai:
- BELUM DIMULAI
- SEDANG DIKERJAKAN
- SELESAI DAN TERVERIFIKASI
- TERHAMBAT

Jangan menandai fitur SELESAI DAN TERVERIFIKASI hanya karena kode telah ditulis.

## 13. COMMAND PERTAMA

Mulai sekarang dengan FASE 0 — AUDIT DAN PERENCANAAN.

Periksa repository dan semua file relevan terlebih dahulu. Jika repository kosong, konfirmasikan kondisi tersebut berdasarkan hasil pemeriksaan.

Jangan langsung membuat semua modul.

Berikan:
1. Ringkasan kondisi repository.
2. Arsitektur yang direkomendasikan.
3. Struktur modul dan folder.
4. Rancangan database awal.
5. Daftar endpoint utama.
6. Backlog berurutan berdasarkan dependensi.
7. Acceptance criteria untuk Fase 1.
8. Risiko teknis yang perlu diperhatikan.

Setelah laporan Fase 0 selesai, tunggu persetujuan saya sebelum mengimplementasikan Fase 1.

PERTAHANKAN KONTEKS PROYEK INI DI SELURUH SESI. Fokus utama adalah aplikasi manajemen toko untuk UMKM Indonesia yang aman, fungsional, teruji, dan layak dikembangkan menjadi produk komersial. Jangan memperluas ruang lingkup tanpa persetujuan.