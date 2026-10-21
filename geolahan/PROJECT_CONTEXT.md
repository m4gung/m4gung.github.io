# MASTER COMMAND — GEO LAHAN PRO

## 1. ROLE DAN TANGGUNG JAWAB

Bertindak sebagai Senior Full-Stack Engineer, GIS Developer, Geospatial Engineer, UI/UX Designer, dan Software Architect yang berpengalaman membangun aplikasi WebGIS untuk pengukuran bidang tanah.

Bangun aplikasi bernama **GeoLahan Pro**, yaitu aplikasi WebGIS responsif untuk mengukur, mengelola, memvisualisasikan, menyimpan, dan mencetak laporan pengukuran lahan berdasarkan peta satelit.

Aplikasi harus benar-benar berfungsi, bukan sekadar mockup, prototype visual, atau dashboard dengan tombol yang tidak memiliki fungsi.

Tanggung jawab utama:
- Merancang arsitektur aplikasi yang bersih dan mudah dikembangkan.
- Mengimplementasikan semua fitur inti secara nyata.
- Memastikan perhitungan geospasial konsisten dan dapat diuji.
- Memastikan data lahan tidak hilang saat halaman dimuat ulang.
- Memastikan ekspor GeoJSON dan backup/restore JSON bekerja.
- Menghasilkan PDF A4 yang memuat citra peta dan poligon jika penyedia peta mengizinkan pengambilan citra.
- Menguji seluruh alur utama sebelum menyatakan fitur selesai.
- Tidak mengarang hasil pengujian atau mengklaim fitur berhasil jika belum diuji.

Jangan berhenti pada analisis atau rencana. Implementasikan aplikasi secara bertahap sampai menghasilkan project yang dapat dijalankan.

## 2. TUJUAN PRODUK

Pengguna harus dapat:
1. Membuka peta satelit dan mencari lokasi lahan.
2. Mengukur lahan langsung di atas peta dengan menggambar poligon.
3. Menambahkan titik patok melalui klik peta atau GPS.
4. Menghitung luas, keliling, jarak antarpatok, dan titik pusat.
5. Memberikan nama dan informasi pada setiap bidang tanah.
6. Menyimpan banyak bidang tanah.
7. Melihat kembali poligon dan koordinat yang tersimpan.
8. Mengedit, menghapus, mengekspor, dan mencetak data lahan.
9. Membuat laporan PDF A4 profesional.
10. Melakukan backup dan restore data.
11. Mengembangkan aplikasi di masa mendatang tanpa harus menulis ulang seluruh sistem.

## 3. TECH STACK WAJIB

Gunakan arsitektur React + Vite dengan NPM.

Frontend:
- React.
- Vite.
- TypeScript.
- Tailwind CSS.
- Lucide React untuk ikon.
- Leaflet.js versi 1.9.4.
- Leaflet-Geoman Free untuk menggambar dan mengedit geometri.
- Turf.js untuk kalkulasi geospasial.
- jsPDF untuk PDF.
- jspdf-autotable untuk tabel koordinat.
- html2canvas untuk menangkap tampilan peta.
- React Hook Form dan Zod jika diperlukan untuk formulir dan validasi.

Penyimpanan versi pertama:
- IndexedDB sebagai penyimpanan utama melalui library Dexie.
- localStorage hanya untuk preferensi ringan seperti tema dan pengaturan antarmuka.
- Jangan menjadikan localStorage satu-satunya database untuk seluruh data lahan karena kapasitasnya terbatas.

Peta:
- Esri World Imagery sebagai pilihan layer satelit jika penggunaan diizinkan.
- Sediakan opsi label jalan/hybrid melalui layer referensi yang sesuai.
- Sediakan layer alternatif seperti OpenStreetMap untuk navigasi.
- Konfigurasi URL tile, atribusi, dan batas zoom secara terpusat.
- Gunakan crossOrigin: 'anonymous' pada tile layer yang mendukungnya.
- Jangan mengasumsikan semua provider mengizinkan ekspor citra atau semua tile dapat digunakan tanpa batas.
- Jangan menghapus atribusi penyedia peta.

Seluruh dependensi harus dipasang melalui NPM dengan versi yang kompatibel. Gunakan versi stabil yang benar-benar tersedia, lockfile, dan dokumentasikan versinya.

## 4. ARSITEKTUR DAN STRUKTUR PROJECT

Gunakan struktur modular seperti berikut:

src/
  app/
    App.tsx
    router.tsx
  components/
    layout/
    map/
    forms/
    tables/
    dialogs/
    common/
  features/
    parcels/
      parcel.types.ts
      parcel.schema.ts
      parcel.repository.ts
      parcel.service.ts
      parcel.hooks.ts
      parcel.components.tsx
    measurement/
      measurement.service.ts
      geometry.service.ts
      gps.service.ts
    map/
      map.config.ts
      geocoding.service.ts
      tile.service.ts
    reports/
      pdf.service.ts
      report.template.ts
    backup/
      backup.service.ts
  db/
    database.ts
    migrations.ts
  hooks/
  utils/
  styles/
  main.tsx

public/
  assets/

tests/
  unit/
  integration/
  e2e/

Dokumentasikan struktur final dan boleh sesuaikan bila ada alasan teknis yang kuat.

Ketentuan:
- Pisahkan UI, kalkulasi, penyimpanan, dan pembuatan PDF.
- Jangan menaruh seluruh logika di App.tsx.
- Gunakan TypeScript dengan tipe yang jelas.
- Hindari any jika tipe yang benar dapat ditentukan.
- Gunakan ID unik yang stabil untuk setiap lahan.
- Gunakan repository/service agar perpindahan dari IndexedDB ke backend tidak memerlukan penulisan ulang seluruh UI.
- Tangani error dengan pesan yang dapat dipahami pengguna.
- Jangan menggunakan data dummy sebagai hasil pengukuran sebenarnya.

## 5. DESAIN UI/UX

Buat desain modern, profesional, bersih, dan responsif.

Layout desktop:
- Sidebar kiri untuk menu dan daftar lahan.
- Peta menjadi area kerja utama.
- Panel informasi pengukuran dapat dibuka di sisi kanan atau bawah.
- Toolbar pengukuran mengambang.
- Header berisi nama aplikasi, pencarian, status penyimpanan, tema, dan menu pengguna.

Layout mobile:
- Peta memenuhi area layar utama.
- Sidebar berubah menjadi drawer yang dapat dibuka dan ditutup.
- Panel pengukuran menggunakan bottom sheet atau panel yang nyaman digunakan.
- Tombol menggambar, GPS, simpan, dan batal harus mudah disentuh.
- Tabel koordinat harus bisa digulir horizontal.
- Jangan biarkan toolbar menutupi tombol zoom atau kontrol peta.

Buat halaman:
1. Dashboard.
2. Peta dan Pengukuran.
3. Daftar Lahan.
4. Detail Lahan.
5. Laporan.
6. Pengaturan.

Tambahkan:
- Dark mode dan light mode.
- Toast untuk notifikasi.
- Dialog konfirmasi untuk penghapusan.
- Loading state.
- Empty state.
- Error state.
- Indikator perubahan data yang belum disimpan.
- Validasi formulir.
- Navigasi keyboard yang layak.
- Konfirmasi saat pengguna meninggalkan pengukuran yang belum disimpan.

## 6. PETA INTERAKTIF

Gunakan Leaflet dan Leaflet-Geoman Free.

Fitur wajib:
- Peta satelit.
- Zoom dan pan.
- Pencarian lokasi.
- Tombol lokasi saya.
- Gambar poligon.
- Edit titik sudut.
- Geser titik patok.
- Geser poligon.
- Hapus poligon.
- Pilih warna batas.
- Tampilkan poligon yang tersimpan.
- Fokuskan peta ke lahan terpilih.
- Tampilkan label titik patok.
- Tampilkan jarak sisi antarpatok.
- Tampilkan popup detail lahan.
- Tampilkan legenda dan skala peta.
- Tampilkan atribusi penyedia peta.

Aktifkan kontrol Leaflet-Geoman yang diperlukan, termasuk drawing polygon, editing, dragging, dan removal.

Pastikan event pembuatan, perubahan, dan penghapusan geometri tidak menghasilkan duplikasi listener atau data.

Gunakan satu sumber data geometri yang konsisten. Setelah poligon selesai digambar atau diedit, perbarui hasil kalkulasi dan status perubahan.

Validasi poligon:
- Memiliki minimal tiga titik unik.
- Tidak memiliki koordinat yang tidak valid.
- Tidak memiliki sisi dengan panjang nol.
- Menolak geometri tidak valid, termasuk self-intersection jika terdeteksi.
- Menangani poligon yang melintasi garis bujur secara benar jika didukung.
- Menampilkan pesan kesalahan yang jelas.

Jangan menutup poligon secara manual dengan menduplikasi titik pertama jika library sudah menangani penutupan ring GeoJSON.

## 7. GPS DAN KOORDINAT

Implementasikan navigator.geolocation dengan opsi:
- enableHighAccuracy: true.
- timeout yang wajar.
- maximumAge yang dapat dikonfigurasi.

Tampilkan:
- Latitude.
- Longitude.
- Akurasi GPS dalam meter dari properti accuracy.
- Waktu pengambilan posisi.
- Status GPS.
- Pesan jika izin lokasi ditolak.
- Pesan jika perangkat tidak mendukung GPS.
- Pesan jika lokasi tidak tersedia.

Sediakan dua tindakan terpisah:
1. Lokasi Saya: memusatkan peta ke lokasi pengguna.
2. Tambah Patok GPS: menambahkan koordinat sebagai patok pengukuran.

Jangan menyamakan koordinat GPS dengan akurasi batas tanah. GPS ponsel dapat memiliki galat beberapa meter atau lebih tergantung kondisi.

Tampilkan peringatan jika akurasi GPS berada di atas ambang yang ditentukan. Jangan menjanjikan akurasi survei profesional dari GPS ponsel.

Untuk koordinat yang ditampilkan:
- Gunakan sistem koordinat geografis WGS 84.
- Latitude dan longitude ditampilkan dengan enam angka desimal secara default.
- Simpan koordinat numerik dengan presisi aslinya, jangan membulatkan data sumber hanya demi tampilan.
- Jelaskan bahwa enam angka desimal bukan bukti akurasi enam angka desimal secara fisik.

## 8. PENCARIAN LOKASI

Gunakan Nominatim OpenStreetMap untuk geocoding.

Fitur:
- Pencarian nama desa.
- Pencarian kecamatan.
- Pencarian kabupaten/kota.
- Pencarian alamat atau tempat.
- Daftar hasil pencarian.
- Klik hasil untuk memusatkan peta.
- Tampilkan nama lokasi hasil pencarian.

Ketentuan:
- Gunakan debounce.
- Batasi jumlah hasil.
- Tampilkan loading dan error.
- Patuhi kebijakan penggunaan Nominatim.
- Jangan mengirim permintaan berlebihan.
- Gunakan endpoint yang dapat dikonfigurasi.
- Sediakan abstraction agar provider dapat diganti.
- Jangan membuat API key palsu.
- Jangan menyimpan informasi pribadi pengguna di permintaan pencarian tanpa kebutuhan.

## 9. PERHITUNGAN GEOSPASIAL

Gunakan Turf.js dan GeoJSON sebagai representasi geometri.

Setiap perubahan poligon harus memperbarui:

A. Luas:
- Meter persegi.
- Are.
- Hektare.

Konversi:
- 1 are = 100 m².
- 1 hektare = 10.000 m².

Gunakan perhitungan geodesik Turf.js yang sesuai, misalnya area, bukan luas piksel atau rumus luas bidang datar berdasarkan latitude-longitude mentah.

B. Keliling:
- Hitung panjang seluruh sisi batas.
- Gunakan Turf.js length dengan satuan yang tepat.
- Pastikan satuan konsisten dan tampilkan dalam meter.

C. Jarak antarpatok:
- Nomor patok P1, P2, P3, dan seterusnya.
- Hitung jarak dari patok ke patok berikutnya.
- Patok terakhir terhubung kembali ke patok pertama pada poligon tertutup.
- Jarak sisi harus konsisten dengan perhitungan keliling dalam toleransi numerik yang ditentukan.

D. Titik pusat:
- Hitung centroid dengan Turf.js.
- Tampilkan latitude dan longitude.
- Jika centroid berada di luar poligon cekung, jangan mengklaimnya sebagai titik yang pasti berada di dalam lahan.
- Bila diperlukan, tampilkan pointOnFeature sebagai alternatif titik representatif di dalam geometri.

E. Format tampilan:
- Luas: dua angka desimal.
- Jarak dan keliling: dua angka desimal.
- Koordinat: enam angka desimal.
- Simpan nilai numerik, bukan string yang sudah diformat.

F. Uji perhitungan:
- Poligon persegi sederhana.
- Poligon segitiga.
- Poligon tidak beraturan.
- Poligon dengan banyak titik.
- Poligon dengan koordinat yang mendekati batas antimeridian jika didukung.
- Poligon tidak valid.

Jangan mengasumsikan hasil luas sama dengan pengukuran resmi atau luas sertifikat.

## 10. MANAJEMEN DATA LAHAN — CRUD

Sediakan fungsi:
- Buat lahan.
- Lihat detail lahan.
- Edit metadata.
- Edit poligon.
- Duplikasi lahan jika diperlukan.
- Hapus lahan.
- Cari berdasarkan nama.
- Filter berdasarkan pemilik.
- Urutkan berdasarkan nama, tanggal, dan luas.
- Pilih lahan untuk ditampilkan di peta.
- Ekspor GeoJSON.
- Cetak PDF.

Saat pengguna selesai menggambar, tampilkan form:
- Nama lahan (wajib).
- Nama pemilik.
- Keterangan.
- Warna poligon.
- Tanggal pengukuran.
- Metode pengukuran, misalnya digitasi peta, GPS ponsel, atau kombinasi.
- Catatan akurasi dan kondisi pengukuran.

Simpan data setelah pengguna menekan tombol Simpan.

Jika pengguna membatalkan form, jangan otomatis menyimpan poligon sebagai data permanen. Tawarkan untuk melanjutkan edit atau membuang pengukuran yang belum disimpan.

Gunakan skema data minimal:

Parcel:
- id.
- name.
- owner.
- description.
- color.
- measuredAt.
- createdAt.
- updatedAt.
- geometry: GeoJSON Polygon atau MultiPolygon jika didukung.
- areaM2.
- areaAre.
- areaHa.
- perimeterM.
- centroid.
- measurementMethod.
- gpsAccuracyM jika relevan.
- controlPoints.
- notes.

ControlPoint:
- id.
- number.
- latitude.
- longitude.
- distanceToNextM.

Turunkan ulang nilai luas, keliling, centroid, dan jarak sisi dari geometri saat data dibuka atau diedit. Jangan menganggap nilai hasil kalkulasi lama sebagai sumber kebenaran.

Gunakan IndexedDB melalui Dexie. Pastikan penyimpanan dan pembacaan data berjalan setelah reload.

## 11. DAFTAR DAN DETAIL LAHAN

Sidebar atau halaman daftar harus menampilkan:
- Nama lahan.
- Pemilik.
- Luas.
- Tanggal ukur.
- Warna indikator poligon.

Saat item dipilih:
1. Muat geometri.
2. Tampilkan poligon.
3. Fokuskan peta menggunakan fitBounds dengan padding.
4. Tampilkan ringkasan.
5. Tampilkan tabel titik koordinat.
6. Tampilkan tombol edit.
7. Tampilkan tombol ekspor GeoJSON.
8. Tampilkan tombol cetak PDF.
9. Tampilkan tombol hapus.

Jika ada beberapa poligon yang sedang tampil, sediakan tindakan untuk menyembunyikan lahan lain agar peta tidak membingungkan.

Tabel koordinat:
- Nomor patok.
- Latitude.
- Longitude.
- Jarak ke patok berikutnya.

Sediakan tombol salin koordinat dan ekspor CSV untuk tabel koordinat.

## 12. BACKUP DAN RESTORE JSON

Backup:
- Ekspor semua data lahan.
- Sertakan versi format backup.
- Sertakan waktu ekspor.
- Sertakan metadata yang diperlukan.
- Sertakan seluruh GeoJSON dan titik patok.
- Gunakan nama file yang jelas, misalnya geolahan-backup-YYYY-MM-DD.json.

Restore:
- Pilih file JSON.
- Validasi struktur dan tipe data.
- Validasi koordinat dan geometri.
- Tampilkan ringkasan jumlah lahan yang akan diimpor.
- Deteksi ID yang bertabrakan.
- Sediakan strategi: gabungkan, lewati duplikat, atau ganti data setelah konfirmasi.
- Buat proses restore transaksional bila memungkinkan.
- Jangan menghapus data lama sebelum file baru lolos validasi.
- Tampilkan hasil impor dan daftar kesalahan bila ada.

Jangan mengeksekusi konten file JSON sebagai kode.

## 13. EKSPOR GEOJSON

Setiap lahan dapat diekspor sebagai file GeoJSON yang valid.

Ketentuan:
- Gunakan CRS WGS 84 dengan koordinat longitude, latitude sesuai standar GeoJSON.
- Simpan geometri asli tanpa mengubah urutan koordinat.
- Sertakan properti nama lahan, pemilik, tanggal ukur, luas, keliling, dan ID.
- Jangan menaruh objek metadata yang tidak valid pada struktur GeoJSON.
- Berikan nama file berdasarkan nama lahan.
- Uji hasil ekspor dengan memuat kembali file yang dihasilkan.

Sediakan ekspor satu lahan dan seluruh lahan dalam FeatureCollection.

## 14. CETAK PDF PROFESIONAL

Gunakan jsPDF, jspdf-autotable, dan html2canvas.

Format:
- A4 portrait.
- Margin profesional.
- Bahasa Indonesia.
- Nomor halaman jika laporan terdiri dari beberapa halaman.
- Tipografi mudah dibaca.
- Tata letak konsisten.

Header:
- Judul: LAPORAN HASIL PENGUKURAN BIDANG TANAH.
- Nama aplikasi: GeoLahan Pro.
- ID lahan.
- Tanggal cetak.

Ringkasan:
- Nama lahan.
- Pemilik.
- Keterangan.
- Tanggal pengukuran.
- Luas dalam m², are, dan hektare.
- Keliling dalam meter.
- Titik pusat latitude/longitude.
- Metode pengukuran.
- Catatan akurasi.

Gambar peta:
- Fokuskan peta ke poligon menggunakan fitBounds dan padding yang memadai.
- Pastikan seluruh poligon terlihat.
- Tampilkan citra satelit, garis batas, warna poligon, label patok, dan skala jika memungkinkan.
- Sertakan panah utara.
- Tambahkan bingkai peta.
- Tambahkan atribusi penyedia citra sesuai ketentuan.
- Jangan menyatakan gambar sebagai citra satelit jika yang berhasil ditangkap ternyata layer peta jalan.

Proses pembuatan peta:
1. Pastikan lahan yang dipilih memiliki geometri valid.
2. Fokuskan peta.
3. Tunggu tile yang dibutuhkan selesai dimuat dengan timeout yang terbatas.
4. Gunakan html2canvas dengan useCORS: true dan allowTaint: false.
5. Tangkap elemen peta yang diperlukan tanpa menangkap sidebar atau dialog.
6. Pastikan label, batas poligon, dan marker tampil.
7. Periksa apakah hasil tangkapan benar-benar memuat citra peta.
8. Jika gagal, jangan menghasilkan laporan yang berpura-pura memiliki citra satelit.
9. Tampilkan pesan yang jelas dan sediakan pilihan mencoba kembali atau mencetak laporan tanpa gambar peta.
10. Bersihkan elemen sementara setelah selesai.

Penting:
- crossOrigin: 'anonymous' tidak dapat mengatasi server tile yang tidak mengirim header CORS yang sesuai.
- Jangan menggunakan allowTaint: true sebagai jalan pintas.
- Jangan mengambil gambar tile secara manual untuk melewati kebijakan CORS.
- Jangan menganggap penundaan 800 ms selalu cukup; tunggu tile secara terukur dan gunakan timeout.
- Jika diperlukan, gunakan komponen peta cetak terpisah agar sidebar, animasi, dan kontrol tidak ikut tertangkap.
- Hormati lisensi, atribusi, kebijakan ekspor, dan batas penggunaan provider.
- Jika diperlukan untuk produksi, rancang adapter untuk provider peta yang secara eksplisit mengizinkan penggunaan citra dalam laporan.

Tabel koordinat:
- No. Patok.
- Latitude.
- Longitude.
- Jarak ke titik berikutnya (meter).

Gunakan jspdf-autotable dan hindari tabel terpotong atau teks keluar dari margin.

Footer:
- Kolom tanda tangan pengukur/surveyor.
- Kolom tanda tangan pemilik.
- Tanggal dan tempat.
- Catatan sistem koordinat WGS 84.
- Catatan bahwa hasil pengukuran digital merupakan estimasi dan tidak menggantikan pengukuran atau penetapan batas resmi oleh pihak berwenang.

Nama file:
Laporan-GeoLahan-[nama-lahan]-[tanggal].pdf

Pastikan karakter khusus dan nama file ditangani dengan aman.

## 15. KEAMANAN DAN KEANDALAN

- Jangan menyimpan password atau API key rahasia di frontend.
- Jangan menganggap data IndexedDB tersinkron otomatis ke perangkat lain.
- Jangan mengklaim backup lokal sama dengan backup cloud.
- Berikan konfirmasi sebelum menghapus data.
- Validasi semua input.
- Tangani browser yang tidak mendukung fitur tertentu.
- Jangan menganggap izin lokasi selalu tersedia.
- Jangan membuat data lahan fiktif untuk menggantikan error.
- Hindari kebocoran listener Leaflet saat komponen unmount.
- Batasi ukuran file backup yang diterima dan validasi kontennya.
- Berikan penanganan error pada operasi penyimpanan, kalkulasi, geocoding, dan PDF.

## 16. TESTING WAJIB

Gunakan Vitest untuk unit test dan Playwright untuk end-to-end test jika lingkungan mendukung.

Uji:
1. Membuat lahan dengan poligon.
2. Mengedit titik sudut.
3. Menghitung ulang luas dan keliling.
4. Mengubah nama dan warna lahan.
5. Menyimpan lalu reload halaman.
6. Membuka lahan tersimpan.
7. Menghapus lahan.
8. Mengekspor GeoJSON.
9. Mengimpor kembali GeoJSON.
10. Backup semua lahan.
11. Restore backup.
12. Menangani file backup rusak.
13. Menangani GPS yang ditolak.
14. Menangani kegagalan geocoding.
15. Membuat PDF.
16. Memastikan PDF dapat dibuka dan tabel koordinat lengkap.
17. Memastikan gambar peta benar-benar muncul bila provider mengizinkannya.
18. Memastikan PDF tetap memiliki mode alternatif ketika citra tidak dapat ditangkap.
19. Menguji layout desktop dan mobile.
20. Menguji geometri tidak valid.

Buat fixture geometri untuk pengujian. Jangan menggunakan hasil perhitungan dari fungsi yang sama sebagai satu-satunya expected value test.

Jalankan lint, typecheck, unit test, dan build. Perbaiki seluruh kegagalan yang ditemukan.

## 17. DOKUMENTASI DAN CARA MENJALANKAN

Sediakan README.md yang berisi:
- Deskripsi aplikasi.
- Fitur.
- Tech stack.
- Prasyarat.
- Instalasi.
- Perintah menjalankan mode development.
- Perintah build.
- Perintah testing.
- Konfigurasi penyedia peta.
- Kebijakan penggunaan layer peta.
- Batasan PDF dan CORS.
- Penjelasan akurasi pengukuran.
- Cara backup dan restore.
- Struktur folder.
- Panduan pengembangan fitur baru.

Sediakan file .env.example jika konfigurasi lingkungan diperlukan. Jangan menyimpan rahasia di dalamnya.

Pastikan seluruh aset, CSS, ikon, dan library dimuat dengan benar.

## 18. STRATEGI IMPLEMENTASI

Implementasikan dalam fase yang dapat diverifikasi.

FASE 1 — Fondasi:
- Buat project React + Vite + TypeScript.
- Pasang dependensi.
- Buat layout dashboard responsif.
- Integrasikan Leaflet dan layer satelit.
- Pastikan aplikasi berjalan.

FASE 2 — Pengukuran:
- Integrasikan Leaflet-Geoman.
- Implementasikan gambar, edit, drag, dan hapus poligon.
- Implementasikan perhitungan Turf.js.
- Tampilkan label patok dan jarak sisi.

FASE 3 — Data:
- Implementasikan IndexedDB dan repository.
- Implementasikan form metadata.
- Implementasikan CRUD.
- Implementasikan daftar dan detail lahan.
- Implementasikan pemuatan poligon ke peta.

FASE 4 — Fitur lokasi:
- Implementasikan GPS.
- Implementasikan geocoding.
- Implementasikan validasi dan penanganan error.

FASE 5 — Ekspor:
- Implementasikan GeoJSON.
- Implementasikan backup dan restore.
- Implementasikan PDF A4 beserta tabel koordinat.
- Verifikasi hasil tangkapan citra satelit dan sediakan fallback.

FASE 6 — Kualitas:
- Unit test dan end-to-end test.
- Responsivitas mobile.
- Perbaikan bug.
- Lint, typecheck, build.
- Dokumentasi.

Setiap fase harus menghasilkan kode nyata yang dapat dijalankan, bukan hanya deskripsi.

## 19. ATURAN AGAR TIDAK KELUAR KONTEKS

Pertahankan nama project GeoLahan Pro, arsitektur, skema data, library, dan fitur yang sudah disepakati.

Sebelum mengubah file:
1. Periksa struktur project yang ada.
2. Baca file terkait.
3. Pahami implementasi yang sudah dibuat.
4. Identifikasi dampak perubahan.
5. Pertahankan fitur yang sudah berjalan.
6. Jangan menimpa kode yang tidak berkaitan.
7. Jangan membuat ulang project dari nol kecuali diminta atau memang diperlukan dan disetujui.

Setelah setiap implementasi:
- Jelaskan file yang dibuat atau diubah.
- Jelaskan fitur yang sudah benar-benar berfungsi.
- Jalankan pemeriksaan yang relevan.
- Laporkan hasil pemeriksaan secara jujur.
- Catat masalah yang belum selesai.
- Tentukan langkah berikutnya.

Jika konteks percakapan hampir habis, buat PROJECT_CONTEXT.md yang berisi:
- Tujuan aplikasi.
- Tech stack dan versi.
- Struktur project.
- Fitur selesai.
- Fitur belum selesai.
- File terakhir yang diubah.
- Error yang diketahui.
- Hasil testing terakhir.
- Keputusan arsitektur.
- Langkah implementasi berikutnya.

Saat melanjutkan percakapan, baca PROJECT_CONTEXT.md dan file sumber terkait sebelum mengubah kode.

## 20. KRITERIA SELESAI

Aplikasi baru dapat dinyatakan memenuhi kebutuhan inti jika:
- Peta satelit dapat digunakan.
- Poligon dapat digambar dan diedit.
- Luas, keliling, jarak sisi, dan koordinat dihitung.
- Data lahan dapat disimpan dan dimuat kembali.
- Daftar lahan dan detail koordinat berfungsi.
- GeoJSON valid dapat diekspor dan diimpor.
- Backup dan restore berfungsi.
- PDF A4 dapat dibuat dengan ringkasan dan tabel koordinat.
- Gambar peta muncul pada PDF saat provider mengizinkan proses capture.
- Kegagalan capture ditangani tanpa menghasilkan laporan yang menyesatkan.
- Aplikasi responsif.
- Tidak ada tombol utama yang sekadar menjadi hiasan.
- Lint, typecheck, test, dan build telah dijalankan dengan hasil yang dilaporkan.

MULAI SEKARANG:
Pertama, periksa apakah sudah ada project. Jika belum, buat fondasi project GeoLahan Pro dan implementasikan Fase 1. Setelah itu lanjutkan fase berikutnya secara berurutan, menjaga agar seluruh kode dapat dijalankan dan fitur yang sudah selesai tidak rusak.

Jangan hanya menjawab dengan rencana. Kerjakan implementasi sebenarnya sesuai akses dan kemampuan lingkungan yang tersedia.