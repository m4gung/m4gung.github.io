# My Photobooth

Sistem Photobooth DIY yang berjalan 100% di jaringan WiFi lokal (tanpa internet).

## Fitur

- **Live Preview Zero Lag** - Video streaming real-time dari iPhone ke iPad via WebRTC
- **Koneksi Offline** - Tidak membutuhkan internet saat acara berlangsung
- **Edit Foto** - Tambah bingkai dan editing dasar langsung dari iPad
- **Penyimpanan Otomatis** - Foto otomatis tersimpan ke hard drive laptop
- **PWA Compatible** - Bisa di-install sebagai aplikasi di perangkat iOS

## Struktur Folder

```
my-photobooth/
├── backend-server/          # Server Node.js (berjalan di Laptop)
│   ├── uploads/             # Folder penyimpanan foto
│   ├── server.js            # Kode server Express + Socket.io
│   └── package.json
└── frontend-pwa/           # Frontend statis (UI untuk iPhone/iPad)
    ├── index.html          # Halaman utama
    ├── camera.html         # Mode Kamera (iPhone)
    ├── preview.html        # Mode Preview (iPad)
    ├── js/                # JavaScript modules
    ├── css/               # Stylesheet
    └── assets/            # Bingkai dan ikon
```

## Langkah Setup

### 1. Setup Server (Laptop)

```bash
# Masuk ke folder backend
cd backend-server

# Install dependencies
npm install

# Jalankan server
npm start
```

Server akan berjalan di `http://localhost:3000`

### 2. Setup HTTPS dengan mkcert (Recommended untuk iOS)

```bash
# Install mkcert (jika belum terinstall)
npm install -g mkcert

# Install CA lokal
mkcert -install

# Generate sertifikat untuk IP lokal
# Ganti 192.168.1.10 dengan IP laptop Anda di jaringan lokal
mkcert 192.168.1.10 localhost 127.0.0.1

# File cert.pem dan key.pem akan digenerate di folder saat ini
```

### 3. Hubungkan Perangkat

1. Pastikan semua perangkat (Laptop, iPhone, iPad) tersambung ke WiFi yang sama
2. Buka browser Safari di iPhone ke `http://[IP-LAPTOP]:3000`
3. Buka browser Safari di iPad ke `http://[IP-LAPTOP]:3000`
4. Pilih **Mode Kamera** di iPhone
5. Pilih **Mode Preview** di iPad

### 4. Penggunaan

1. **Di iPhone (Kamera)**
   - Izinkan akses kamera ketika diminta
   - Kamera siap menerima perintah "Jepret" dari iPad

2. **Di iPad (Preview)**
   - Tekan tombol **Jepret!** untuk mengambil foto
   - Pilih **Bingkai** yang diinginkan
   - Gunakan **Tools Edit** untuk penyesuaian
   - Tekan **Selesai** untuk menyimpan foto

## API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|----------|
| GET | `/` | Status server |
| POST | `/upload` | Upload file foto |
| POST | `/upload-base64` | Upload foto format Base64 |
| GET | `/photos` | List semua foto |
| GET | `/uploads/:filename` | Download foto |

## Socket.io Events

| Event | Arah | Deskripsi |
|-------|------|-----------|
| `register` | Client → Server | Register tipe perangkat |
| `take_photo` | Preview → Camera | Permintaan jepret foto |
| `photo_ready` | Camera → Preview | Foto siap dikirim |
| `photo_saved` | Server → Client | Foto berhasil disimpan |
| `webrtc_signal` | Bidirectional | Sinyal WebRTC |

## Troubleshooting

### Kamera tidak bisa diakses
- Pastikan menggunakan protokol HTTPS (httpS://)
- Install sertifikat mkcert di iOS dengan membuka `http://[IP]:[PORT]/cert.pem`

### Koneksi terputus
- Pastikan semua perangkat tersambung ke WiFi yang sama
- Cek firewall tidak memblokir port yang digunakan
- Restart server: `npm start`

### Foto tidak tersimpan
- Cek folder `uploads/` memiliki izin tulis
- Cek disk laptop tidak penuh

## Kustomisasi

### Mengganti Bingkai
Ganti file SVG di folder `frontend-pwa/assets/`:
- `frame-classic.svg` - Bingkai klasik emas
- `frame-modern.svg` - Bingkai modern neon
- `frame-festive.svg` - Bingkai pesta warna-warni

### Mengubah Server IP
Ubah di `frontend-pwa/js/app.js` atau melalui settings di iPad

## Lisensi

MIT License - Bebas digunakan untuk keperluan apapun