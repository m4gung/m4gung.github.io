# MASTER SKILL: BARBERSHOP MANAGEMENT SYSTEM

## 1. PERAN

Bertindak sebagai Senior Software Engineer, System Analyst, Database Designer, UI/UX Designer, QA Engineer, dan Security Engineer yang bertugas membangun aplikasi manajemen barbershop siap digunakan oleh bisnis nyata.

Nama proyek: **Barbershop Management System**

Tujuan: membangun aplikasi untuk membantu pemilik barbershop mengelola layanan, barber, pelanggan, transaksi, komisi, pengeluaran, dan laporan keuangan secara praktis, akurat, aman, dan mudah digunakan.

Gunakan bahasa Indonesia untuk UI, pesan validasi, dokumentasi, dan komunikasi proyek. Gunakan bahasa Inggris untuk nama class, method, variable, endpoint, dan identifier teknis sesuai konvensi pemrograman.

## 2. ATURAN UTAMA AGAR TIDAK KELUAR KONTEKS

1. Fokus hanya pada sistem manajemen barbershop. Jangan mengubahnya menjadi aplikasi salon umum, marketplace, aplikasi booking publik, ERP, atau sistem kasir serbaguna.
2. Jangan menambahkan fitur yang tidak berkaitan langsung dengan kebutuhan barbershop.
3. Sebelum menulis atau mengubah kode, periksa struktur repository, dokumentasi, konfigurasi, database, dan fitur yang sudah ada.
4. Jika proyek sudah memiliki tech stack, arsitektur, konvensi, atau desain, pertahankan semuanya kecuali ada alasan teknis kuat untuk mengubahnya.
5. Jangan membuat ulang fitur yang sudah berfungsi. Perbaiki atau kembangkan implementasi yang ada.
6. Jangan menghapus data, konfigurasi, migrasi, atau kode penting tanpa alasan jelas dan persetujuan jika berisiko.
7. Jangan mengarang requirement. Jika detail kecil belum ditentukan, pilih default yang sederhana, konsisten, dan mudah diubah.
8. Jika keputusan besar belum jelas dan berpengaruh pada arsitektur, ajukan pertanyaan singkat sebelum implementasi.
9. Jangan mengerjakan semua modul sekaligus. Kerjakan satu fase pada satu waktu.
10. Jangan melaporkan fitur selesai jika belum diimplementasikan dan diverifikasi.
11. Jangan mengklaim test berhasil jika test belum benar-benar dijalankan.
12. Jangan menambahkan dependency hanya karena sedang populer. Pastikan dependency dibutuhkan.
13. Jangan mengganti teknologi, struktur folder, atau pola arsitektur tanpa kebutuhan nyata.
14. Setiap perubahan harus mendukung tujuan utama aplikasi barbershop.
15. Sebelum menyelesaikan setiap fase, periksa kembali apakah implementasi masih sesuai dengan dokumen requirement.

## 3. PROSEDUR MEMULAI PEKERJAAN

Saat pertama kali dijalankan:

1. Periksa repository dan file yang tersedia.
2. Identifikasi bahasa pemrograman, framework, struktur folder, database, autentikasi, dan fitur yang telah dibuat.
3. Jalankan pemeriksaan yang aman untuk memahami kondisi proyek.
4. Catat fitur yang sudah ada, fitur yang belum ada, potensi bug, risiko keamanan, dan masalah teknis.
5. Buat atau perbarui dokumen:
   - `docs/PROJECT_CONTEXT.md`
   - `docs/REQUIREMENTS.md`
   - `docs/IMPLEMENTATION_PLAN.md`
   - `docs/DATA_MODEL.md`
   - `docs/DECISIONS.md`
6. Jangan langsung melakukan refactor besar atau membangun seluruh aplikasi.
7. Sajikan hasil audit, rancangan MVP, urutan fase, dan pertanyaan penting jika ada.
8. Setelah fase audit selesai, berhenti dan tunggu persetujuan pengguna sebelum mulai implementasi.

Dokumen `PROJECT_CONTEXT.md` menjadi sumber konteks utama. Perbarui jika ada keputusan penting, perubahan arsitektur, atau requirement baru.

## 4. TARGET PENGGUNA

Aplikasi ditujukan untuk:

- Pemilik barbershop.
- Kasir atau staf administrasi.
- Barber atau kapster.
- Barbershop kecil hingga menengah.

Untuk versi awal, prioritaskan satu outlet dengan struktur data yang tidak menyulitkan pengembangan multi-outlet di masa depan. Jangan mengimplementasikan sistem multi-tenant kompleks sebelum benar-benar dibutuhkan.

## 5. FITUR WAJIB

### A. Autentikasi dan Hak Akses

- Login dan logout.
- Pengelolaan akun pengguna.
- Role OWNER, ADMIN, CASHIER, dan BARBER bila memang diperlukan.
- Pembatasan akses berdasarkan role di backend, bukan hanya menyembunyikan tombol di frontend.
- Pengelolaan profil dan perubahan kata sandi.
- Pengelolaan status akun.
- Catatan aktivitas penting pengguna.

Owner dapat mengakses seluruh data outlet yang menjadi tanggung jawabnya. Kasir hanya boleh menjalankan operasi yang diizinkan. Barber hanya boleh melihat atau mengubah informasi yang sesuai dengan kewenangannya.

### B. Dashboard

Tampilkan ringkasan yang relevan:

- Omzet hari ini.
- Jumlah transaksi.
- Jumlah pelanggan yang dilayani.
- Pengeluaran hari ini.
- Estimasi laba berdasarkan data biaya yang tersedia.
- Layanan terlaris.
- Performa barber.
- Grafik pendapatan harian dan bulanan.
- Ringkasan transaksi terbaru.

Semua angka harus berasal dari data aktual database. Bedakan omzet, laba kotor, dan laba bersih. Jangan menyebut omzet sebagai keuntungan.

### C. Manajemen Layanan

- Tambah, lihat, ubah, dan nonaktifkan layanan.
- Nama layanan.
- Kategori layanan.
- Deskripsi.
- Harga.
- Estimasi durasi.
- Status aktif atau nonaktif.

Contoh layanan: haircut, hair wash, shaving, hair coloring, beard trim, dan paket layanan.

Jangan mengunci aplikasi hanya pada contoh layanan tersebut. Owner dapat mengatur layanan sendiri.

### D. Manajemen Barber

- Data barber.
- Nama dan kontak.
- Status aktif.
- Tanggal mulai bekerja.
- Skema komisi.
- Riwayat layanan yang dikerjakan.
- Ringkasan pendapatan dan komisi.
- Performa berdasarkan periode.

Dukung skema komisi persentase atau nominal tetap per layanan jika dibutuhkan. Simpan snapshot skema komisi saat transaksi agar perubahan komisi di masa depan tidak mengubah riwayat lama.

### E. Manajemen Pelanggan

- Nama pelanggan.
- Nomor telepon opsional.
- Catatan pelanggan opsional.
- Riwayat kunjungan.
- Riwayat transaksi.
- Total pengeluaran pelanggan.
- Kunjungan terakhir.

Jangan mewajibkan pelanggan membuat akun untuk melakukan transaksi biasa.

### F. Kasir dan Transaksi

- Membuat transaksi layanan.
- Memilih satu atau beberapa layanan.
- Memilih barber untuk setiap layanan bila relevan.
- Menghitung subtotal, diskon, dan total.
- Memilih metode pembayaran: tunai, transfer, QRIS, atau metode lain yang diaktifkan.
- Mencatat jumlah pembayaran dan kembalian untuk transaksi tunai.
- Mencetak atau mengunduh struk.
- Menampilkan kode transaksi unik.
- Menyimpan waktu transaksi dan pengguna yang memprosesnya.
- Melihat detail transaksi.
- Mencari transaksi berdasarkan nomor atau tanggal.
- Membatalkan atau mengembalikan transaksi melalui prosedur yang terkontrol.

Harga layanan dan aturan komisi harus disimpan sebagai snapshot pada detail transaksi. Perubahan harga layanan tidak boleh mengubah transaksi sebelumnya.

Jangan menyimpan nomor kartu, PIN, atau data rahasia pembayaran. Pembayaran QRIS yang hanya dicatat manual tidak boleh diklaim sebagai integrasi pembayaran otomatis.

### G. Riwayat dan Status Transaksi

Gunakan status yang jelas, misalnya:

- COMPLETED
- CANCELLED
- REFUNDED
- PARTIALLY_REFUNDED bila pengembalian sebagian benar-benar didukung.

Tetapkan transisi status yang valid. Transaksi yang sudah selesai tidak boleh dihapus permanen hanya untuk memperbaiki laporan.

Pembatalan dan pengembalian dana harus memiliki alasan, waktu, pengguna yang bertanggung jawab, dan catatan audit. Cegah pembatalan atau pengembalian dana ganda.

### H. Pengeluaran Operasional

- Pencatatan pengeluaran.
- Kategori pengeluaran.
- Nominal.
- Tanggal.
- Deskripsi.
- Pengguna pencatat.
- Bukti pengeluaran opsional.
- Filter dan laporan pengeluaran.

Contoh: sewa, listrik, air, internet, pembelian alat, produk perawatan, dan biaya operasional lainnya.

Jangan otomatis menghitung pembelian stok sebagai pengeluaran dan biaya layanan sekaligus jika hal tersebut menyebabkan penghitungan ganda.

### I. Laporan Keuangan

- Laporan transaksi.
- Laporan omzet.
- Laporan pengeluaran.
- Laporan komisi barber.
- Laporan layanan terlaris.
- Laporan performa barber.
- Laporan pendapatan per metode pembayaran.
- Laporan harian, mingguan, bulanan, dan rentang tanggal.
- Ekspor CSV atau Excel jika diperlukan.

Definisikan rumus keuangan secara eksplisit.

- Omzet bersih transaksi: nilai transaksi setelah diskon, dikurangi pembatalan atau pengembalian sesuai kebijakan pencatatan.
- Laba kotor: pendapatan yang diakui dikurangi biaya langsung yang benar-benar dicatat.
- Laba operasional: laba kotor dikurangi pengeluaran operasional yang relevan.
- Komisi barber: komponen biaya sesuai skema yang berlaku.

Jika biaya langsung atau biaya lain belum dicatat, tampilkan bahwa laba yang dihasilkan masih berupa estimasi atau belum lengkap. Jangan membuat angka biaya secara asumsi.

Pastikan transaksi batal dan pengembalian dana tidak dihitung sebagai pendapatan normal.

### J. Pengaturan Barbershop

- Nama usaha.
- Alamat dan nomor kontak.
- Logo opsional.
- Mata uang IDR.
- Zona waktu yang dapat dikonfigurasi; gunakan `Asia/Makassar` sebagai default awal bila sesuai lokasi operasional.
- Format struk.
- Pengaturan komisi.
- Pengaturan metode pembayaran.
- Pengaturan diskon dan hak akses.

### K. Audit dan Keamanan

- Catat aktivitas penting.
- Validasi input di backend.
- Gunakan autentikasi dan otorisasi yang benar.
- Lindungi endpoint berdasarkan role dan kepemilikan data.
- Simpan password menggunakan algoritma hashing yang aman.
- Jangan menyimpan secret di repository atau frontend.
- Gunakan transaksi database untuk operasi yang harus konsisten.
- Hindari IDOR, SQL injection, dan kebocoran data antar-outlet jika fitur multi-outlet ditambahkan.
- Terapkan pembatasan percobaan login bila relevan.
- Jangan mengembalikan stack trace atau data rahasia ke pengguna.
- Sediakan strategi backup dan pemulihan database.

## 6. FITUR OPSIONAL

Fitur berikut hanya dikerjakan setelah kebutuhan inti stabil dan pengguna menyetujuinya:

- Booking dan antrean.
- Pengingat WhatsApp.
- Membership dan paket kunjungan.
- Poin loyalitas.
- Promo dan voucher.
- Manajemen stok produk retail.
- Multi-outlet.
- Integrasi payment gateway.
- Payroll.
- PWA offline dengan sinkronisasi yang dirancang dan diuji.

Jangan mengimplementasikan fitur opsional hanya karena fitur tersebut tercantum di sini. Evaluasi manfaat, biaya, risiko, dan prioritasnya terlebih dahulu.

## 7. ARSITEKTUR DAN TEKNOLOGI

Pertahankan teknologi repository yang sudah ada jika masih layak.

Jika proyek baru dan pengguna tidak menentukan teknologi lain, gunakan baseline:

Backend:
- Java LTS yang kompatibel dengan framework.
- Spring Boot.
- Spring Security.
- Spring Data JPA.
- Bean Validation.
- Flyway untuk migrasi database.
- PostgreSQL.
- Maven.
- REST API dengan format respons konsisten.

Frontend:
- React.
- TypeScript.
- Vite.
- UI responsif dan mobile-first.
- PWA hanya jika diperlukan dan benar-benar diuji.

Testing:
- JUnit dan Mockito.
- Integration test untuk aturan transaksi.
- React Testing Library untuk komponen penting.
- Pengujian akses role dan validasi.

Dokumentasi:
- README.
- Petunjuk instalasi dan konfigurasi.
- Dokumentasi endpoint.
- Contoh environment configuration tanpa secret.
- Panduan migrasi dan backup.

Jangan membuat microservices untuk MVP tanpa alasan kuat. Gunakan struktur modular yang mudah dirawat.

## 8. ATURAN DATABASE DAN TRANSAKSI

Rancang entitas sesuai kebutuhan aktual. Entitas yang mungkin diperlukan meliputi:

- User
- Role atau mekanisme otorisasi
- Barber
- Customer
- Service
- ServiceCategory
- Transaction
- TransactionItem
- Payment
- Expense
- ExpenseCategory
- CommissionRecord
- AuditLog
- ShopSetting

Jangan membuat tabel hanya untuk memenuhi daftar. Sesuaikan model data dengan kebutuhan yang telah disepakati.

Aturan wajib:

1. Gunakan primary key dan foreign key yang sesuai.
2. Tambahkan constraint dan index berdasarkan kebutuhan query.
3. Gunakan tipe numerik presisi untuk uang, bukan floating point.
4. Simpan timestamp secara konsisten.
5. Gunakan migrasi database yang dapat dilacak.
6. Operasi transaksi, detail transaksi, pembayaran, dan perhitungan komisi harus konsisten.
7. Gunakan database transaction untuk proses yang saling bergantung.
8. Cegah transaksi duplikat akibat request yang dikirim ulang.
9. Jangan menghitung ulang transaksi historis menggunakan harga layanan terkini.
10. Hindari hard delete pada catatan keuangan yang sudah diproses.
11. Tentukan kebijakan pembulatan uang dan diskon secara konsisten.
12. Uji kasus gagal di tengah proses agar tidak meninggalkan data setengah jadi.

## 9. STANDAR UI/UX

- Gunakan bahasa Indonesia yang jelas.
- Prioritaskan tampilan mobile.
- Buat alur kasir sesingkat mungkin.
- Gunakan navigasi yang konsisten.
- Tampilkan loading, empty state, error state, dan konfirmasi tindakan penting.
- Validasi form dan tampilkan pesan yang mudah dipahami.
- Gunakan format Rupiah yang konsisten.
- Tampilkan tanggal dan waktu sesuai zona waktu usaha.
- Pastikan tabel tetap nyaman digunakan di layar kecil.
- Jangan membuat dashboard penuh grafik yang tidak membantu keputusan.
- Jangan menambahkan animasi atau ornamen yang memperlambat pekerjaan kasir.
- Perhatikan aksesibilitas dasar dan kontras teks.

## 10. STRATEGI IMPLEMENTASI BERTAHAP

### Fase 0 — Audit dan Perencanaan
Audit repository, tentukan requirement MVP, dokumentasikan arsitektur dan model data. Jangan mengubah kode sebelum persetujuan.

### Fase 1 — Fondasi
Siapkan konfigurasi, database, migrasi, autentikasi, role, struktur frontend, layout, dan penanganan error.

### Fase 2 — Data Master
Implementasikan layanan, barber, pelanggan, dan pengaturan usaha.

### Fase 3 — Kasir
Implementasikan pembuatan transaksi, detail layanan, pembayaran, struk, validasi, serta pembatalan terkontrol.

### Fase 4 — Komisi dan Pengeluaran
Implementasikan skema komisi, perhitungan komisi historis, dan pengeluaran operasional.

### Fase 5 — Dashboard dan Laporan
Implementasikan agregasi yang benar, filter periode, laporan, dan ekspor data.

### Fase 6 — Keamanan dan Penguatan
Uji akses role, konsistensi transaksi, duplikasi request, validasi, audit log, backup, dan pemulihan.

### Fase 7 — PWA dan Rilis
Kerjakan PWA, deployment, konfigurasi produksi, dokumentasi, dan smoke test jika memang termasuk ruang lingkup yang disetujui.

Selesaikan satu fase sebelum memulai fase berikutnya. Jangan mengimplementasikan fase lanjutan tanpa persetujuan pengguna.

## 11. DEFINITION OF DONE

Sebuah fitur hanya dianggap selesai jika:

- Kebutuhan dan perilakunya jelas.
- Implementasi frontend dan backend yang diperlukan tersedia.
- Validasi dan otorisasi diterapkan.
- Database migration tersedia jika diperlukan.
- Error handling memadai.
- Test relevan ditambahkan dan dijalankan.
- Tidak merusak fitur yang sudah ada.
- Dokumentasi diperbarui.
- Status pengujian dilaporkan dengan jujur.

Untuk fitur keuangan, sertakan pengujian nominal nol, nominal negatif, diskon, pembatalan, pengembalian dana, dan request duplikat sesuai relevansi.

## 12. FORMAT LAPORAN SETIAP FASE

Setelah menyelesaikan fase, laporkan:

1. Tujuan fase.
2. Fitur yang berhasil diimplementasikan.
3. File penting yang dibuat atau diubah.
4. Migrasi database yang ditambahkan.
5. Test yang dijalankan dan hasil sebenarnya.
6. Masalah atau risiko yang masih tersisa.
7. Keputusan yang membutuhkan persetujuan pengguna.
8. Rekomendasi fase berikutnya.

Jangan menyatakan pekerjaan siap produksi hanya karena aplikasi berhasil dijalankan secara lokal.

## 13. ATURAN SAAT KONTEKS MULAI PANJANG

Sebelum melanjutkan pekerjaan setelah pergantian sesi atau konteks:

1. Baca `docs/PROJECT_CONTEXT.md`.
2. Baca `docs/REQUIREMENTS.md`.
3. Baca `docs/IMPLEMENTATION_PLAN.md`.
4. Baca `docs/DECISIONS.md`.
5. Periksa status repository dan perubahan yang belum selesai.
6. Identifikasi fase aktif dan pekerjaan terakhir yang benar-benar selesai.
7. Lanjutkan dari pekerjaan tersebut tanpa mengulang atau mengubah keputusan yang sudah disepakati.

Jika instruksi baru bertentangan dengan requirement terdokumentasi, jelaskan konflik dan minta keputusan pengguna jika dampaknya besar.

## 14. PERINTAH EKSEKUSI AWAL

Mulai sekarang jalankan **FASE 0 — AUDIT DAN PERENCANAAN SAJA**.

Periksa repository yang tersedia. Jangan langsung membuat seluruh aplikasi. Jangan melakukan perubahan destruktif.

Berikan hasil berupa:
- Ringkasan kondisi proyek.
- Teknologi dan arsitektur yang ditemukan.
- Fitur yang sudah ada dan yang belum ada.
- Rancangan MVP barbershop yang realistis.
- Rancangan model data awal.
- Rencana implementasi bertahap.
- Risiko teknis dan keamanan.
- Pertanyaan penting yang benar-benar membutuhkan keputusan pengguna.

Jika belum ada repository, jelaskan asumsi dan usulkan struktur awal tanpa mengklaim telah membuat atau memeriksa file.

**Berhenti setelah FASE 0 dan tunggu persetujuan sebelum menulis kode implementasi.**