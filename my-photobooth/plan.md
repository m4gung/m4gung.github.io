# Prompt Spesifik: Arsitektur "Hybrid Offline Photobooth" (PWA + Local Node.js + WebRTC + 5GHz Network)

## 1. Ringkasan Proyek
Membangun sistem *photobooth* DIY profesional yang berjalan 100% *offline* di jaringan nirkabel lokal dengan latensi sangat rendah (Zero-Delay).
* **Perangkat Utama:** iPhone (Kamera Utama), iPad (Layar Preview/Kaca & Panel Edit), Laptop (Server Lokal & Penyimpanan File), dan Router WiFi 5GHz (Khusus Lokal).
* **Tujuan Utama:** Menghasilkan *live preview* video dari iPhone ke iPad tanpa *lag* (< 150ms), menjepret foto resolusi tinggi dari jarak jauh, mengedit/menambahkan bingkai di iPad, dan menyimpan hasil akhir secara otomatis ke *hard drive* laptop.
* **Syarat Khusus:** Front-end harus berupa file PWA statis (HTML/JS/CSS) agar kompatibel di-host di GitHub Pages (untuk kemudahan pembaruan/distribusi), namun saat acara dilayani oleh server lokal Node.js. Wajib mem-bypass blokir keamanan iOS (harus HTTPS) di jaringan lokal agar kamera iPhone bisa diakses.

## 2. Arsitektur & Teknologi (Software & Hardware)

| Komponen | Perangkat / Alat | Teknologi & Konfigurasi | Peran |
| :--- | :--- | :--- | :--- |
| **Jaringan Utama** | Dedicated Router | **Sinyal 5GHz Saja (WPA2)**. Tanpa koneksi internet, *password* tertutup (hanya untuk alat photobooth). | Memastikan *bandwidth* WebRTC maksimal dan bebas interferensi. |
| **Front-End (UI)** | iPhone & iPad | **PWA (HTML5, CSS3, Vanilla JS)**. | Layar antarmuka pengguna, akses kamera, dan manipulasi HTML5 Canvas. |
| **Back-End (Server)**| Laptop Windows/Mac| **Node.js + Express + Socket.io**. | Melayani file PWA lokal, proses *Signaling* WebRTC, dan API penyimpanan file lokal. |
| **Video Stream** | iPhone ➔ iPad | **WebRTC (Native P2P)**. | *Live feed* P2P. Dioptimalkan untuk koneksi lokal murni (tanpa STUN/TURN server eksternal). |
| **Command & Control**| Antar Perangkat | **WebSockets (Socket.io)**. | Trigger perintah "TAKE_PHOTO", "PHOTO_READY", dll seketika. |
| **Local HTTPS** | Laptop | **mkcert**. | *Certificate Authority* (CA) lokal agar server Node.js berjalan dengan HTTPS hijau yang dipercaya oleh iOS. |

## 3. Cetak Biru Struktur Folder Proyek

```text
my-photobooth/
├── backend-server/          
│   ├── uploads/             <-- Folder hasil foto resolusi tinggi & hasil edit disimpan
│   ├── server.js            <-- Node.js Express (HTTPS), Socket.io, & logika Multer (Upload)
│   ├── package.json
│   ├── cert.pem             <-- Sertifikat mkcert
│   └── key.pem              <-- Kunci mkcert
└── frontend-pwa/            <-- Dapat dipindahkan ke GitHub Pages
    ├── index.html           <-- Landing page (Pilih peran: Mode Kamera / Mode Layar)
    ├── camera.html          <-- UI iPhone (WebRTC Sender, Ambil Frame Resolusi Tinggi)
    ├── preview.html         <-- UI iPad (WebRTC Receiver, UI Shutter, HTML5 Canvas)
    ├── js/
    │   ├── socket-client.js <-- Menangani koneksi ke server laptop
    │   ├── webrtc-core.js   <-- Logika P2P handshake & streaming video
    │   └── canvas-editor.js <-- Logika penggabungan foto mentah dengan bingkai transparan
    ├── css/
    │   └── main.css
    ├── assets/
    │   └── frame-overlay.png <-- File bingkai (ukuran cetak standar, misal 4x6 atau 2x6)
    └── manifest.json        <-- PWA config agar bisa di-install ke Home Screen iOS
```

## 4. Alur Kerja Teknis (Workflow)

### Tahap 1: Setup Lingkungan (Offline)
1. Router 5GHz dinyalakan. Laptop, iPhone, dan iPad terhubung ke SSID router tersebut.
2. Server Node.js (HTTPS) berjalan di laptop di *port* 3000 (contoh: `https://192.168.1.100:3000`).
3. Profil sertifikat `mkcert` sudah diinstal dan dipercaya (Trusted) di pengaturan iOS iPhone & iPad.
4. iPhone dan iPad membuka URL lokal tersebut via Safari dan menginstalnya ke *Home Screen* (PWA).

### Tahap 2: Zero-Delay WebRTC Connection
1. iPhone (`camera.html`) bertindak sebagai WebRTC *Sender*. Meminta akses kamera (`getUserMedia`).
2. iPad (`preview.html`) bertindak sebagai WebRTC *Receiver*.
3. Keduanya melakukan *Signaling* (tukar SDP & ICE Candidates) melalui Socket.io di laptop.
4. Karena berada di jaringan 5GHz lokal, WebRTC akan membentuk koneksi *Host-to-Host* murni. Layar iPad menampilkan tangkapan kamera iPhone dengan jeda < 150ms.

### Tahap 3: Trigger & Simpan Foto
1. Tamu menekan tombol UI di iPad. iPad mengirim sinyal `CAPTURE` ke server via Socket.io, yang diteruskan ke iPhone.
2. iPhone menghentikan video sejenak, menangkap gambar resolusi maksimal via `<canvas>`, lalu mengirim blob gambar via `HTTP POST /upload` ke server laptop.
3. Node.js menyimpan file mentah ke folder `/uploads/raw/` dan menyiarkan sinyal `IMAGE_READY` beserta URL lokal gambar tersebut ke iPad.

### Tahap 4: Rendering Frame & Finalisasi
1. iPad menarik foto mentah tersebut dari URL lokal.
2. Menggunakan HTML5 Canvas, iPad menumpuk foto mentah ke bawah lapisan `frame-overlay.png`.
3. Setelah *preview* akhir disetujui tamu (tekan "Selesai"), iPad mengekstrak Canvas menjadi blob dan mengirimkannya via `HTTP POST /upload/final`.
4. Node.js menyimpan hasil akhir ke folder `/uploads/final/` (folder ini nantinya bisa disinkronisasi ke Google Drive secara otomatis via aplikasi desktop saat ada internet, atau di-print langsung dari laptop).

## 5. Instruksi Khusus untuk Pengembang (Developer Notes)
* **Kamera iPhone:** Pastikan `getUserMedia` menggunakan spesifikasi `facingMode: "environment"` untuk kamera belakang dan set parameter `video: { width: { ideal: 1920 }, height: { ideal: 1080 } }` untuk kejernihan stream maksimal. 
* **Tangkapan Resolusi Tinggi:** Resolusi stream WebRTC (1080p) berbeda dengan resolusi jepretan foto. Saat menerima perintah `CAPTURE`, pastikan logika iPhone mengambil gambar dari sensor penuh menggunakan *ImageCapture API* atau menarik dari kanvas tersembunyi beresolusi tinggi, bukan sekadar men-screenshot *stream* 1080p.
* **CORS:** Atur konfigurasi CORS dengan benar di Express agar tidak memblokir permintaan POST dari PWA.

⏺ Integrasi WebRTC dan WebSocket untuk Streaming Video Real-Time                              
                                                                                              
  Arsitektur Sistem                                                                           
                                                                                              
  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐                       
  │   iPhone (PWA)  │      │   Node.js       │      │   Laptop        │                       
  │                 │      │   Server        │      │   (Viewer)      │                       
  │  ┌───────────┐  │      │                 │      │                 │                       
  │  │ Kamera    │──┼─────▶│  WebSocket      │◀─────│──▶ WebRTC       │                       
  │  │ (Sender)  │  │      │  Signaling      │      │   (Receiver)    │                        
  │  └───────────┘  │      └─────────────────┘      └─────────────────┘                       
  │                 │              │                        │                                 
  │  ┌───────────┐  │      ┌─────────────────┐                                                
  │  │ WebSocket │──┼─────▶│  Room Manager   │                                                 
  │  │ Client    │  │      │  & State        │                                                
  │  └───────────┘  │      └─────────────────┘                                                
  └─────────────────┘                                                                         
                                                                                              
  Alur Kerja                                                                                  
                                                                                              
  1. Fase Koneksi:                                                                            
    - PWA di iPhone terhubung ke server melalui WebSocket
    - Laptop (viewer) juga terhubung ke server yang sama                                      
    - Server menyimpan kedua koneksi dalam "room" yang sama                                   
  2. Fase SDP Offer/answer:                                                                   
    - iPhone membuat SDP Offer dan mengirimkannya ke server                                   
    - Server meneruskan ke laptop                                                             
    - Laptop membuat SDP Answer dan mengirimkannya ke server                                  
    - Server meneruskan ke iPhone                                                             
  3. Fase ICE Candidate Exchange:                                                             
    - iPhone dan laptop bertukar ICE Candidate secara langsung melalui server                 
    - Koneksi peer-to-peer terbentuk                                                          
  4. Fase Streaming:                                                                          
    - Video stream dari iPhone ke laptop melalui WebRTC                                       
    - Kontrol perintah (CAPTURE, ZOOM) dikirim melalui WebSocket                              

⏺ Photo Booth App - Workflow Lengkap

  Alur Aplikasi

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                         PHOTO BOOTH WORKFLOW                                │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │                                                                             │
  │   ┌──────────┐     ┌──────────────┐     ┌─────────────┐                     │
  │   │  1.MULAI │ ──▶ │ 2.AMBIL FOTO │ ──▶ │3.PILIH FRAME│                     │
  │   │          │     │              │     │             │                     │
  │   │  ┌────┐  │     │  ○ ○ ○ ○ ○   │     │  ┌───────┐  │                     │
  │   │  │MULAI│ │     │  1 2 3 4 5   │     │  │ FRAME │  │                     │
  │   │  └────┘  │     │              │     │  │  1    │  │                     │
  │   └──────────┘     │  ⏱️ 3-10dtk  │     │  │  FRAME │  │                    │
  │                    │  🎨 Filter   │     │  │  2     │  │                    │
  │                    └──────────────┘     │  │  ...  │  │                     │
  │                                         └─────────────┘                     │
  │                                                 │                           │
  │                                                 ▼                           │
  │   ┌──────────┐     ┌──────────────┐     ┌─────────────┐                     │
  │   │ 6.UNDUH  │ ◀── │5.TAMBAH STIKER│ ◀─ │4.FILTER     │                     │
  │   │          │     │              │     │             │                     │
  │   │ 📥 Final │     │  ┌───────┐   │     │  ┌───────┐  │                     │
  │   │ 📥 All   │     │  │ STIKER│   │     │  │ COOL  │  │                     │
  │   │   Photos │     │  │  1   │    │     │  │FILTER │  │                     │
  │   └──────────┘     │  │ STIKER│   │     │  │  1    │  │                     │
  │                    │  │  2   │    │     │  │ COOL  │  │                     │
  │                    │  │ ...  │    │     │  │FILTER │  │                     │
  │                    └──────────────┘     │  │  2    │  │                     │
  │                                         └─────────────┘                     │
  └─────────────────────────────────────────────────────────────────────────────┘
