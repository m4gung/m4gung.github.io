# My Photobooth

## 1. Ringkasan Proyek
Membangun sistem *photobooth* DIY yang berjalan 100% di jaringan WiFi lokal (tanpa internet).
* **Perangkat Utama:** iPhone (sebagai Kamera), iPad (sebagai Layar Preview & Editing), Laptop (sebagai Server Lokal & Penyimpanan File).
* **Tujuan Utama:** *Live preview* tanpa *lag* dari iPhone ke iPad, menjepret foto resolusi tinggi, mengedit di iPad (tambah bingkai), dan menyimpan hasil akhir secara otomatis ke *hard drive* laptop.
* **Syarat Khusus:** Front-end harus berupa file statis (HTML/JS/CSS) agar bisa di-*host* di GitHub Pages untuk kemudahan distribusi, namun saat acara berlangsung, file tersebut dilayani oleh server lokal di laptop. Harus mengatasi masalah HTTPS iOS pada jaringan lokal agar kamera bisa menyala.

## 2. Arsitektur & Teknologi (Stack)
Sistem ini menggunakan pendekatan **Hybrid**. Kode front-end bersifat statis, namun membutuhkan *backend* lokal sebagai perantara.

| Komponen | Perangkat | Teknologi | Peran |
| :--- | :--- | :--- | :--- |
| **Front-End (UI)** | iPhone & iPad | **PWA (HTML5, CSS3, Vanilla JS)**. Statis, kompatibel dengan GitHub Pages. | Tampilan bagi tamu, akses kamera (iPhone), kanvas editing (iPad). |
| **Back-End (Server Lokal)** | Laptop | **Node.js + Express** + **Socket.io**. | Melayani file statis PWA, Signaling WebRTC, menangkap unggahan foto, menyimpan ke disk. |
| **Real-time Stream** | iPhone ➔ iPad | **WebRTC (Native Browser API)**. | *Live feed* video dengan *zero delay*. |
| **Real-time Command** | Antar Perangkat | **Socket.io (WebSockets)**. | Mengirim perintah "Jepret", "Foto Siap", dll. |
| **Keamanan Lokal** | Laptop | **mkcert** (Sangat Penting). | Membuat sertifikat SSL lokal buatan sendiri yang dipercayai oleh iOS, agar server lokal bisa berjalan di HTTPS penuh secara *offline*. |

## 3. Cetak Biru Struktur Folder Proyek

```text
my-photobooth/
├── backend-server/          <-- Berjalan di Laptop
│   ├── uploads/             <-- Folder hasil foto disimpan (bisa dibuka di laptop)
│   ├── server.js            <-- Kode Node.js (Express, Socket.io, File Upload)
│   ├── package.json
│   ├── cert.pem             <-- Dibuat pakai mkcert
│   └── key.pem              <-- Dibuat pakai mkcert
└── frontend-pwa/            <-- Ini yang di-upload ke GitHub Pages (UI)
    ├── index.html           <-- Halaman utama (Pilih mode: Kamera/Preview)
    ├── camera.html          <-- UI untuk iPhone
    ├── preview.html         <-- UI untuk iPad (Preview & Edit Canvas)
    ├── js/
    │   ├── app.js           <-- Logika Socket.io & UI umum
    │   ├── webrtc-handshake.js <-- Logika koneksi video iPhone-iPad
    │   └── edit-canvas.js    <-- Logika editing/tambah bingkai di iPad
    ├── css/
    │   └── style.css
    ├── assets/
    │   └── overlay.png      <-- File bingkai transparan
    └── manifest.json        <-- Agar bisa di-install jadi PWA
```

## 4. Alur Kerja Teknis (Step-by-Step)

### Tahap 1: Setup (Di lokasi acara - Tanpa Internet)
1.  Laptop menyalakan WiFi Router lokal. iPhone dan iPad tersambung ke WiFi tersebut.
2.  Laptop menjalankan Server Node.js (HTTPS) menggunakan sertifikat lokal buatan `mkcert`.
3.  iPhone dan iPad membuka browser Safari ke IP laptop (misal: `https://192.168.1.10:3000`). Karena sertifikat `mkcert` sudah diinstal di iOS, browser menganggap koneksi ini aman (HTTPS Hijau).

### Tahap 2: Koneksi Video (Zero Delay)
1.  iPhone membuka `camera.html` ➔ Berperan sebagai **"Sender"**.
2.  iPad membuka `preview.html` ➔ Berperan sebagai **"Receiver"**.
3.  Keduanya saling bertukar "salam" (SDP/ICE Candidates) via Socket.io di server laptop (Proses Signaling).
4.  Koneksi **WebRTC Peer-to-Peer** terbentuk. Video *live* dari iPhone mengalir langsung ke iPad via WiFi tanpa *lag*.

### Tahap 3: Penjepretan & Penyimpanan
1.  Tamu menekan tombol "Jepret" di iPad.
2.  iPad mengirim sinyal "TAKE_PHOTO" via Socket.io ke iPhone.
3.  iPhone menangkap *frame* video resolusi tinggi, mengubahnya menjadi *Base64* atau *Blob*, dan mengirimkannya ke Server Laptop via HTTP POST.
4.  Server Laptop menyimpan foto mentah tersebut ke folder `uploads/` di *hard drive*.
5.  Server Laptop mengirim sinyal "PHOTO_SAVED" ke iPad beserta URL foto lokalnya.

### Tahap 4: Editing & Hasil Akhir (di iPad)
1.  iPad mengunduh foto mentah dari server laptop dan menggambarnya di HTML5 `<canvas>`.
2.  iPad menumpuk gambar bingkai (`overlay.png`) di atas foto tamu di dalam kanvas.
3.  Tamu menekan "Selesai". iPad mengubah isi kanvas menjadi *Blob* gambar final.
4.  iPad mengunggah gambar final hasil edit ke Server Laptop via HTTP POST.
5.  Server Laptop menyimpan gambar final ke folder `uploads/` dengan nama berbeda.

## 5. Rencana Aksi Pembuatan (Action Plan)

1.  **Backend:** Buat server Node.js dasar (Express + HTTPS + Socket.io).
2.  **SSL Lokal:** Pelajari dan gunakan `mkcert` untuk membuat sertifikat HTTPS lokal agar koneksi dari iOS ke Laptop tidak diblokir. Ini kunci utama sistem *offline* iOS.
3.  **Signaling:** Implementasikan logika bertukar pesan WebRTC dasar via Socket.io.
4.  **Frontend (iPhone):** Buat HTML untuk akses kamera dan *stream* WebRTC.
5.  **Frontend (iPad):** Buat HTML untuk menerima *stream* WebRTC dan menampilkannya di layar penuh.
6.  **Sistem Upload:** Buat fungsi jepret di iPhone dan kirim hasilnya ke laptop.
7.  **Sistem Edit:** Buat logika Canvas di iPad untuk menggabungkan foto dengan bingkai lokal.
8.  **GitHub Pages:** Setelah semua berjalan lancar di server lokal, folder `frontend-pwa/` bisa di-*upload* ke GitHub Pages sebagai cadangan atau untuk distribusi kode, sementara saat acara tetap disajikan oleh server lokal laptop.