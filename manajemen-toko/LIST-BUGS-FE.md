## Tambah Produk Baru
- [x] Harga Beli / Modal (Rp) *
  - Inputan 0 bisa dihapus bebas, sudah dilengkapi separator ribuan (format: 10.000).
- [x] Harga Jual (Rp) *
  - Inputan 0 bisa dihapus bebas, sudah dilengkapi separator ribuan (format: 15.000).
- [x] Stok Awal
  - Inputan 0 bisa dihapus bebas, sudah dilengkapi separator ribuan (format: 100).
- [x] Batas Minimum Peringatan Stok
  - Inputan 0 bisa dihapus bebas, sudah dilengkapi separator ribuan (format: 5).

## Checkout Pembayaran Kasir
- [x] Pembayaran Tempo (Kredit)
  - **Penjelasan & Root Cause**: Sebelumnya nilai `cashReceived` dikirim sama dengan total tagihan, menyebabkan `remainingAmount` menjadi 0 dan sistem menganggap piutang langsung lunas.
  - **Solusi & Alur**:
    1. Saat kasir memilih metode **Tempo (Kredit)**, sistem otomatis mengeset `cashReceived: 0` dan `changeAmount: 0`.
    2. Status transaksi diset menjadi `UNPAID` (Belum Lunas).
    3. Tagihan 100% dicatat sebagai piutang baru dan menambahkan `currentDebt` pada data pelanggan bersangkutan.
    4. Struk menampilkan informasi jelas: `Status: BELUM LUNAS (UTANG)`, `Jatuh Tempo`, dan akumulasi `Total Utang Pelanggan`.

## Cetak Struk
- [x] Format Struk Thermal Printer (58mm / 80mm)
  - Sudah diintegrasikan via CSS `@media print` murni. Elemen web/antarmuka browser otomatis disembunyikan dan hanya area kertas struk monospace yang dicetak.
- [x] Fitur Salin Teks Struk (Copy Text)
  - Tersedia tombol "Salin Teks" yang memformat isi faktur menjadi teks rapi dan menyalinnya ke clipboard pengguna.
- [x] Fitur Kirim Struk via WhatsApp
  - Tersedia tombol "Kirim WA" yang otomatis membuka WhatsApp dengan teks struk ke nomor telepon pelanggan (jika tersedia) atau membuka dialog kirim WhatsApp. 


## Catat Pengadaan / Pembelian Barang
- [x] QTY masuk
  - Inputan awal bisa dihapus bebas dengan backspace tanpa tersangkut angka 1/0.
- [x] Harga Beli Satuan
  - Dilengkapi separator ribuan otomatis (titik) dan inputan awal bisa dihapus bebas.

## Pengadaan & Pembelian (PO)
- [x] Fitur Edit Data Pembelian
  - Tersedia tombol "Edit" di tabel riwayat pembelian.
  - Membuka formulir dengan data PO yang sudah terisi lengkap.
  - Saat disimpan, sistem otomatis melakukan rollback pada stok lama dan menerapkan stok serta harga beli revisi baru secara akurat.

## Checkout Pembayaran Kasir
- [x] Uang Diterima dari Pelanggan (Rp)
  - Dilengkapi separator ribuan otomatis (format: 50.000). Angka awal bisa dihapus bebas dan tombol pecahan cepat tetap berfungsi optimal.

## Edit Pelanggan
- [x] Batas Limit Kredit (Rp) *
  - Batas limit kredit kini dapat diisi 0 (tidak lagi otomatis kembali ke default 5.000.000).
  - Dilengkapi format separator ribuan.
  - Di Kasir POS, pelanggan dengan limit kredit Rp 0 otomatis dilarang berbelanja dengan metode Tempo/Kredit.

# BUGS BARU
## Edit Data Pengadaan / Pembelian
- gagal edit, KeyPath referenceNo on object store stockMutations is not indexed