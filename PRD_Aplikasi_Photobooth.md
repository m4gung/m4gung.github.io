# Product Requirements Document (PRD): Aplikasi Photobooth Mobile

## 1. Ringkasan Proyek
**Nama Produk:** SnapEase Photobooth (Nama Sementara)
**Tujuan:** Menyediakan solusi photobooth yang simpel, cepat, dan profesional bagi pemilik usaha photobooth dengan memanfaatkan perangkat mobile (smartphone/tablet).
**Masalah:** Pemilik usaha photobooth seringkali kesulitan dengan setup kamera profesional yang rumit dan mahal. Mereka membutuhkan cara yang lebih mudah untuk mengambil foto, menerapkan template, dan mengirimkan hasil foto ke pelanggan secara instan.

---

## 2. Target Audiens & Persona
**Pemilik Usaha Photobooth:** Seseorang yang menjalankan jasa dokumentasi acara (pernikahan, ulang tahun, event korporat). Saat ini mereka mungkin menggunakan kamera DSLR manual yang memerlukan laptop dan kabel yang berantakan. Mereka menginginkan efisiensi dan kemudahan operasional.

---

## 3. Fitur Utama (Prioritas Tinggi)
Berdasarkan kebutuhan pengguna, berikut adalah 3 fitur wajib:

### 3.1 Integrasi Kamera Mobile (iPhone/Android)
* **Deskripsi:** Aplikasi harus dapat mengakses kamera perangkat secara langsung dengan kualitas tinggi.
* **Kebutuhan:** Mendukung autofokus, pengaturan pencahayaan otomatis, dan penggunaan kamera depan/belakang.
* **User Story:** "Sebagai pengguna, saya ingin langsung membuka kamera saat aplikasi dijalankan agar bisa segera melayani tamu."

### 3.2 Manajemen Template Foto
* **Deskripsi:** Kemampuan untuk memilih dan mengganti layout atau overlay foto sesuai tema acara.
* **Kebutuhan:** Mendukung format PNG transparan untuk overlay, pilihan grid (1x1, 2x2, strip), dan preview instan sebelum cetak/bagi.
* **User Story:** "Sebagai pemilik usaha, saya ingin mengganti desain bingkai foto dengan cepat sesuai pesanan klien."

### 3.3 Berbagi Hasil via WhatsApp (Instant Sharing)
* **Deskripsi:** Fitur pengiriman hasil foto langsung ke nomor WhatsApp pelanggan.
* **Kebutuhan:** Integrasi API WhatsApp atau fitur 'Share Sheet' yang memungkinkan pengiriman cepat tanpa harus menyimpan foto di galeri publik terlebih dahulu.
* **User Story:** "Sebagai pelanggan, saya ingin menerima hasil foto saya di WhatsApp dalam hitungan detik agar bisa segera saya unggah ke media sosial."

---

## 4. Alur Pengguna (User Flow)
1.  **Onboarding:** Pemilik usaha membuka aplikasi dan memberikan izin akses kamera.
2.  **Setup:** Memilih template foto yang akan digunakan untuk sesi acara tersebut.
3.  **Capture:** Tamu berdiri di depan kamera, pemilik usaha menekan tombol ambil foto (mendukung timer).
4.  **Preview:** Hasil foto muncul dengan template yang sudah dipilih.
5.  **Distribution:** Muncul opsi "Bagikan ke WhatsApp". Pemilik usaha memasukkan nomor atau scan QR (opsional) untuk mengirim foto.

---

## 5. Keunggulan Kompetitif
* **Kesederhanaan:** Jauh lebih gampang digunakan dibanding setup kamera tradisional.
* **Portabilitas:** Hanya butuh HP/iPad dan tripod, tidak perlu meja besar untuk laptop.
* **Kecepatan:** Dari foto diambil sampai diterima pelanggan hanya butuh beberapa klik.

---

## 6. Persyaratan Non-Fungsional
* **Performa:** Kamera harus terbuka dalam < 2 detik.
* **Stabilitas:** Aplikasi tidak boleh crash saat digunakan terus-menerus selama event (4-6 jam).
* **User Interface:** Desain minimalis agar tamu tidak bingung saat melihat layar.

---

## 7. Rencana Pengembangan Masa Depan (Roadmap)
* Integrasi Printer Bluetooth (Cetak fisik instan).
* Fitur Stiker Lucu dan Filter Warna (Edit warna foto).
* Dashboard laporan jumlah foto yang diambil per event.
* Galeri Cloud untuk download masal via QR Code.
