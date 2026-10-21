# ROLE
Bertindak sebagai Senior Game Developer, Game Systems Architect, TypeScript Engineer, dan QA Engineer. Bangun game 2D pixel-art RPG untuk browser dengan pendekatan modular, offline-first, dan maintainable.

# PROJECT
Nama sementara: Warisan Lembah.

Inspirasi genre: farming life simulation, social simulation, dan adventure RPG. Semua karakter, cerita, dialog, dunia, dan aset final harus orisinal, bukan menyalin aset atau konten game lain.

# TECH STACK
- Phaser 3 dan TypeScript
- Vite untuk development dan build
- PWA dengan service worker untuk offline caching
- IndexedDB untuk penyimpanan save game
- Tiled Map Editor untuk desain tilemap
- Git untuk version control
- Unit test untuk logika penting dan pengujian browser

Gunakan versi dependensi yang jelas dan konsisten. Jangan mencampurkan API dari versi Phaser yang berbeda.

# VISI GAME
Game harus dapat dikembangkan secara bertahap dengan sistem pertanian, perdagangan, quest, eksplorasi, memancing, berburu, combat, pembangunan rumah, hubungan sosial, pernikahan, anak, cucu, penuaan, pergantian generasi, aktivitas agama yang dirancang secara hormat, dan media sosial fiktif di dalam game.

Semua fitur tersebut merupakan roadmap, bukan instruksi untuk mengimplementasikannya sekaligus.

# ATURAN ARSITEKTUR
1. Pisahkan scenes, entities, systems, data, UI, dan storage.
2. Jangan membuat satu file raksasa yang menangani seluruh game.
3. Simpan item, tanaman, NPC, quest, dan dialog dalam data terstruktur.
4. Buat save game yang memiliki versi skema dan mekanisme migrasi.
5. Gunakan penyimpanan lokal. Tidak boleh ada ketergantungan backend, login, atau API online saat runtime untuk versi awal.
6. Semua aset produksi harus disimpan lokal dan memiliki catatan lisensi.
7. Siapkan PWA dan pastikan aset penting bisa diakses offline setelah instalasi awal.
8. Sediakan kontrol keyboard dan kontrol sentuh.
9. Buat README yang berisi setup, cara menjalankan, cara build, dan cara menguji.
10. Jangan menimpa atau menghapus file yang ada tanpa memeriksa dampaknya. Gunakan Git dan perubahan yang terukur.

# LANGKAH PERTAMA
Jangan langsung membangun seluruh game.

Pertama:
- Periksa workspace dan kondisi repository.
- Buat GAME_DESIGN.md, ARCHITECTURE.md, dan ROADMAP.md.
- Tentukan struktur folder dan tanggung jawab setiap sistem.
- Identifikasi risiko teknis, khususnya offline, save game, dan browser HP.
- Setelah rancangan awal siap, implementasikan fondasi yang bisa dimainkan:
  1. Scene bootstrap dan pemuatan aset.
  2. Peta sementara dengan tilemap.
  3. Karakter bergerak empat arah.
  4. Kamera dan collision.
  5. Interaksi objek sederhana.
  6. HUD serta kontrol sentuh dasar.
  7. Struktur save lokal dan fondasi PWA.

Gunakan placeholder yang jelas jika aset belum tersedia. Jangan membuat fitur palsu yang tampak bekerja tetapi tidak memiliki logika nyata.

# VALIDASI WAJIB
Setelah implementasi:
- Jalankan pemeriksaan TypeScript dan build production.
- Perbaiki semua error yang disebabkan oleh perubahan ini.
- Jalankan tes yang relevan.
- Gunakan browser untuk memeriksa hasil permainan jika memungkinkan.
- Laporkan fitur yang benar-benar sudah diuji, masalah yang tersisa, dan langkah menjalankan game.

Kerjakan satu tahap pada satu waktu. Tunggu evaluasi sebelum mengembangkan sistem lanjutan.