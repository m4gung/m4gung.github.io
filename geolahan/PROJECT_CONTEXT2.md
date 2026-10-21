# GEO LAHAN PRO — IMPLEMENTATION DIRECTIVE V2

Kamu melanjutkan pengembangan project GeoLahan Pro sesuai master command sebelumnya.

## KEPUTUSAN PRODUK FINAL

Target:
- Penggunaan pribadi terlebih dahulu.
- Dikembangkan menjadi aplikasi untuk pelanggan dan layanan pengukuran lahan.
- Platform web responsif/PWA.
- Metode pengukuran mencakup digitasi peta satelit dan pengambilan titik GPS di lapangan.

## ARSITEKTUR FINAL

Frontend:
- React + Vite + TypeScript.
- Tailwind CSS + Lucide React.
- Leaflet 1.9.4 + Leaflet-Geoman Free.
- Turf.js.
- IndexedDB dengan Dexie.
- jsPDF + jspdf-autotable + html2canvas.
- PWA manifest, service worker, HTTPS, serta dukungan penggunaan offline yang realistis.

Backend masa depan:
- Spring Boot REST API.
- PostgreSQL + PostGIS.
- Autentikasi dan otorisasi.
- Sinkronisasi perubahan lokal dan server.
- Pemisahan data antar pengguna.
- Riwayat perubahan dan strategi konflik sinkronisasi.

Jangan implementasikan backend secara prematur jika MVP lokal belum stabil. Namun, desain repository, model data, dan service agar dapat menggunakan backend pada fase berikutnya.

## ATURAN DATA DAN GEOMETRI

- Gunakan GeoJSON dengan koordinat longitude, latitude.
- Gunakan WGS 84.
- Simpan koordinat sumber dengan presisi aslinya.
- Tampilkan koordinat dengan enam angka desimal.
- Hitung luas geodesik, keliling, jarak sisi, dan centroid menggunakan Turf.js.
- Jangan menganggap centroid selalu berada di dalam poligon.
- Validasi poligon dan hindari geometri tidak valid.
- Setiap perubahan geometri harus memperbarui hasil pengukuran.
- Gunakan satu mesin kalkulasi untuk digitasi peta maupun GPS.
- Simpan metode pengukuran dan metadata akurasi yang relevan.
- Bedakan hasil digitasi, hasil GPS ponsel, dan hasil survei dengan alat profesional.

## ALUR GPS

Implementasikan:
1. Lokasi Saya.
2. Tambah Patok GPS.
3. Rekam lintasan ketika pengguna berjalan mengelilingi lahan.
4. Mulai, jeda, lanjutkan, dan akhiri rekaman.
5. Tampilkan jumlah titik dan akurasi GPS.
6. Filter titik yang tidak valid dengan aturan yang transparan.
7. Pratinjau poligon sebelum menyimpan.
8. Konfirmasi pengguna sebelum hasil lintasan dijadikan bidang tanah.
9. Hitung ulang luas, keliling, dan jarak sisi setelah lintasan selesai.

Jangan mengambil titik berulang tanpa batas atau menganggap GPS berakurasi tinggi selalu akurat. Tangani izin ditolak, sinyal buruk, timeout, dan kehilangan koneksi.

## PWA DAN OFFLINE

Implementasikan:
- Manifest dan ikon PWA.
- Service worker.
- Penyimpanan lahan lokal.
- Akses terhadap data tersimpan saat offline.
- Akses ke fitur pengukuran yang dapat berjalan tanpa internet.
- Status koneksi.
- Penjelasan bahwa pencarian online dan tile satelit mungkin tidak tersedia saat offline.
- Backup lokal yang dapat diunduh.
- Mekanisme update aplikasi yang tidak menghilangkan data pengguna.

Jangan menyimpan seluruh tile satelit secara otomatis. Hormati kebijakan provider.

## PDF DAN PROVIDER PETA

- Implementasikan adapter layer peta.
- Periksa izin penggunaan dan ekspor provider.
- Uji CORS dan capture secara nyata.
- Gunakan html2canvas dengan useCORS: true dan allowTaint: false.
- Tunggu tile selesai atau timeout yang terukur.
- Validasi gambar hasil capture sebelum memasukkannya ke PDF.
- Sediakan mode laporan tanpa citra jika capture gagal.
- Jangan mengklaim hasil capture berhasil tanpa verifikasi.
- Sertakan atribusi dan catatan keterbatasan akurasi.

## STRATEGI PELUNCURAN

Tahap A:
- MVP lokal yang dapat mengukur dan menyimpan lahan.
- PDF dan ekspor data.
- Uji lapangan pribadi.

Tahap B:
- Perbaikan berdasarkan hasil pengukuran referensi.
- Uji pada berbagai ukuran dan bentuk lahan.
- Uji di beberapa perangkat HP.
- Perbaikan performa dan dokumentasi.

Tahap C:
- Uji coba terbatas dengan pengguna lain.
- Kumpulkan feedback.
- Evaluasi kebutuhan akun dan sinkronisasi.

Tahap D:
- Backend Spring Boot dan PostgreSQL/PostGIS.
- Autentikasi dan hak akses.
- Sinkronisasi.
- Multi-pengguna.
- Persiapan monetisasi.

## ATURAN PENGERJAAN

Sebelum coding:
1. Periksa repository dan konteks project.
2. Baca PROJECT_CONTEXT.md jika tersedia.
3. Identifikasi fitur yang sudah selesai.
4. Jangan mengganti arsitektur tanpa alasan yang kuat.
5. Pertahankan seluruh fitur yang sudah berfungsi.

Setelah coding:
1. Jalankan lint.
2. Jalankan typecheck.
3. Jalankan unit test.
4. Jalankan build.
5. Uji alur utama secara nyata bila lingkungan mendukung.
6. Laporkan hasil aktual dan masalah yang belum terselesaikan.
7. Perbarui PROJECT_CONTEXT.md.

Mulai dari fitur yang paling penting dan implementasikan secara berurutan. Jangan hanya membuat mockup. Jangan mengklaim pengujian berhasil jika belum dijalankan.

TUGAS PERTAMA:
Audit project yang tersedia. Jika belum ada project, buat fondasi aplikasi GeoLahan Pro sesuai arsitektur di atas dan implementasikan fase PWA serta peta interaktif. Jika project sudah ada, lanjutkan dari implementasi terakhir tanpa merusak fitur yang sudah berfungsi.