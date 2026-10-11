const SPECS = {
  "check_nasabah": {
    "id": "check_nasabah",
    "title": "Check Nasabah",
    "totalLength": 130,
    "sample": "5171010101900001              081234567890                                      nasabah@example.com                               ",
    "fields": [
      {
        "name": "NIK",
        "length": 30
      },
      {
        "name": "Nomor HP",
        "length": 50
      },
      {
        "name": "Email",
        "length": 50
      }
    ]
  },
  "generate_account": {
    "id": "generate_account",
    "title": "Generate Account / Rekening",
    "totalLength": 140,
    "sample": "001000008338221IDR   N999          BUDI SANTOSO                                      BUDI SANTOSO   01TR1N                    20261005010101",
    "fields": [
      {
        "name": "Kode Cabang",
        "length": 4
      },
      {
        "name": "No. Nasabah",
        "length": 8
      },
      {
        "name": "Jenis Rekening",
        "length": 3
      },
      {
        "name": "Kode Mata Uang",
        "length": 3
      },
      {
        "name": "Kantor Kas",
        "length": 3
      },
      {
        "name": "Join Account",
        "length": 1
      },
      {
        "name": "Referensi AO",
        "length": 3
      },
      {
        "name": "Kode Kolektor",
        "length": 10
      },
      {
        "name": "Nama",
        "length": 50
      },
      {
        "name": "Nama Singkat",
        "length": 15
      },
      {
        "name": "Kode Alamat",
        "length": 2
      },
      {
        "name": "Pajak",
        "length": 3
      },
      {
        "name": "Restitusi",
        "length": 1
      },
      {
        "name": "Saldo Minimum",
        "length": 20
      },
      {
        "name": "Tanggal Buka",
        "length": 8
      },
      {
        "name": "Tujuan Pembukaan",
        "length": 2
      },
      {
        "name": "Sumber Dana",
        "length": 2
      },
      {
        "name": "Penggunaan Dana",
        "length": 2
      }
    ]
  },
  "generate_cif": {
    "id": "generate_cif",
    "title": "Generate CIF",
    "totalLength": 1382,
    "sample": "001001   BUDI SANTOSO                                      BUDI SANTOSO   0104                                      123456789012345     2NID 999999                                                  0361081234567890        NNbudi.santoso@example.com                                                                                                                              081234567890                                      01JL. MERDEKA NO. 45                                                                                                                                    80111  01001  002  0001    0002    0003    01  01  01  ID 0361081234567890                            01  101  -                                                 19900101        1201501015171010101900001              209912319-                                                 101999101PT SUKSES MAKMUR                                  041001SITI AMINAH                                                 876999900NN99010101039 99990       99N9000NN-                                                 -                                                 1M018  03JL. MERDEKA NO. 45                                                                                                                                    80111  01001  002  0001    0002    0003    01  01  01  ID 0361081234567890                            00",
    "fields": [
      {
        "name": "Kode Cabang",
        "length": 4
      },
      {
        "name": "Jenis Nasabah",
        "length": 2
      },
      {
        "name": "Kantor Kas",
        "length": 3
      },
      {
        "name": "Nama",
        "length": 50
      },
      {
        "name": "Nama Singkat",
        "length": 15
      },
      {
        "name": "Title",
        "length": 4
      },
      {
        "name": "Keterangan title",
        "length": 30
      },
      {
        "name": "Nasabah Induk",
        "length": 8
      },
      {
        "name": "NPWP",
        "length": 20
      },
      {
        "name": "Terkait dengan Bank",
        "length": 1
      },
      {
        "name": "Nasabah Bank",
        "length": 1
      },
      {
        "name": "Kewarganegaraan",
        "length": 3
      },
      {
        "name": "Referensi AO",
        "length": 3
      },
      {
        "name": "Kode Analisa",
        "length": 3
      },
      {
        "name": "Kontak Person",
        "length": 50
      },
      {
        "name": "Kode Area",
        "length": 4
      },
      {
        "name": "No Telp Kontak Person",
        "length": 20
      },
      {
        "name": "Restitusi",
        "length": 1
      },
      {
        "name": "Cetak Advis Pajak",
        "length": 1
      },
      {
        "name": "Email Nasabah",
        "length": 50
      },
      {
        "name": "Informasi Lainnya 1",
        "length": 50
      },
      {
        "name": "Informasi Lainnya 2",
        "length": 50
      },
      {
        "name": "Informasi Lainnya 3",
        "length": 50
      },
      {
        "name": "Kode Alamat Berdasarkan KTP",
        "length": 2
      },
      {
        "name": "Alamat KTP",
        "length": 50
      },
      {
        "name": "Alamat2 KTP",
        "length": 50
      },
      {
        "name": "Alamat3 KTP",
        "length": 50
      },
      {
        "name": "Kode Pos KTP",
        "length": 7
      },
      {
        "name": "Status Rumah KTP",
        "length": 2
      },
      {
        "name": "RT KTP",
        "length": 5
      },
      {
        "name": "RW KTP",
        "length": 5
      },
      {
        "name": "Kelurahan KTP",
        "length": 8
      },
      {
        "name": "Kecamatan KTP",
        "length": 8
      },
      {
        "name": "Kampung KTP",
        "length": 8
      },
      {
        "name": "Kota KTP",
        "length": 4
      },
      {
        "name": "DATI KTP",
        "length": 4
      },
      {
        "name": "Provinsi KTP",
        "length": 4
      },
      {
        "name": "Negara KTP",
        "length": 3
      },
      {
        "name": "Kode Area KTP",
        "length": 4
      },
      {
        "name": "No. Telepon KTP",
        "length": 20
      },
      {
        "name": "No. Fax KTP",
        "length": 20
      },
      {
        "name": "Bidang Usaha",
        "length": 4
      },
      {
        "name": "Jenis Kelamin",
        "length": 1
      },
      {
        "name": "Tempat Lahir",
        "length": 4
      },
      {
        "name": "Daerah Tempat Lahir",
        "length": 50
      },
      {
        "name": "Tanggal Lahir",
        "length": 8
      },
      {
        "name": "Tanggal Lahir Anak",
        "length": 8
      },
      {
        "name": "Jns. ID.",
        "length": 1
      },
      {
        "name": "Tanggal Mulai ID",
        "length": 8
      },
      {
        "name": "No.Bukti ID Diri/KTP",
        "length": 30
      },
      {
        "name": "Tgl. Kadaluarsa Id",
        "length": 8
      },
      {
        "name": "Nilai Transaksi",
        "length": 1
      },
      {
        "name": "Hobby",
        "length": 50
      },
      {
        "name": "Agama",
        "length": 1
      },
      {
        "name": "Pekerjaan",
        "length": 2
      },
      {
        "name": "Bagian Pekerjaan",
        "length": 3
      },
      {
        "name": "Lokasi Pekerjaan",
        "length": 1
      },
      {
        "name": "Pangkat Pekerjaan",
        "length": 2
      },
      {
        "name": "Tempat Kerja",
        "length": 50
      },
      {
        "name": "Pendidikan Terakhir",
        "length": 2
      },
      {
        "name": "Status Perkawinan",
        "length": 1
      },
      {
        "name": "Jumlah Tanggungan",
        "length": 3
      },
      {
        "name": "Nama Ibu Kandung",
        "length": 50
      },
      {
        "name": "Grup Nasabah",
        "length": 10
      },
      {
        "name": "Golongan Pemilik",
        "length": 3
      },
      {
        "name": "Kode Hukum",
        "length": 2
      },
      {
        "name": "Hub. Dengan Bank",
        "length": 4
      },
      {
        "name": "Red Flag",
        "length": 1
      },
      {
        "name": "Black List",
        "length": 1
      },
      {
        "name": "Kode Risiko",
        "length": 2
      },
      {
        "name": "Tujuan Pembukaan",
        "length": 2
      },
      {
        "name": "Sumber Dana",
        "length": 2
      },
      {
        "name": "Penggunaan Dana",
        "length": 2
      },
      {
        "name": "Penghasilan",
        "length": 2
      },
      {
        "name": "Status Pemilik",
        "length": 2
      },
      {
        "name": "Lembaga Rating",
        "length": 2
      },
      {
        "name": "Rating Nasabah",
        "length": 2
      },
      {
        "name": "Tanggal Rating Nasabah",
        "length": 8
      },
      {
        "name": "Rating Negara Asal",
        "length": 2
      },
      {
        "name": "Daftar Hitam BI",
        "length": 1
      },
      {
        "name": "Golongan Pemilik Basel",
        "length": 4
      },
      {
        "name": "Pelampauan BMPK",
        "length": 1
      },
      {
        "name": "Pelanggaran BMPK",
        "length": 1
      },
      {
        "name": "Informasi Lainnya",
        "length": 50
      },
      {
        "name": "Produk Lainnya",
        "length": 50
      },
      {
        "name": "Frekwensi Review",
        "length": 5
      },
      {
        "name": "Kelengkapan Nasabah",
        "length": 2
      },
      {
        "name": "Kode Alamat Berdasarkan Domisili",
        "length": 2
      },
      {
        "name": "Alamat Domisili",
        "length": 50
      },
      {
        "name": "Alamat2 Domisili",
        "length": 50
      },
      {
        "name": "Alamat3 Domisili",
        "length": 50
      },
      {
        "name": "Kode Pos Domisili",
        "length": 7
      },
      {
        "name": "Status Rumah Domisili",
        "length": 2
      },
      {
        "name": "RT Domisili",
        "length": 5
      },
      {
        "name": "RW Domisili",
        "length": 5
      },
      {
        "name": "Kelurahan Domisili",
        "length": 8
      },
      {
        "name": "Kecamatan Domisili",
        "length": 8
      },
      {
        "name": "Kampung Domisili",
        "length": 8
      },
      {
        "name": "Kota Domisili",
        "length": 4
      },
      {
        "name": "DATI Domisili",
        "length": 4
      },
      {
        "name": "Provinsi Domisili",
        "length": 4
      },
      {
        "name": "Negara Domisili",
        "length": 3
      },
      {
        "name": "Kode Area Domisili",
        "length": 4
      },
      {
        "name": "No. Telepon Domisili",
        "length": 20
      },
      {
        "name": "No. Fax Domisili",
        "length": 20
      },
      {
        "name": "Kode BMPK",
        "length": 2
      }
    ]
  },
  "generate_deposito": {
    "id": "generate_deposito",
    "title": "Generate Deposito",
    "totalLength": 315,
    "sample": "0058                                DPMB IDR000000000010000000000001M2026100520261005           999    001              00008338TEST NASABAH DEPOSITO                             010010052500001M005TD11 1010010000098        010010000098                                                                                ",
    "fields": [
      {
        "name": "Kode Cabang",
        "length": 4
      },
      {
        "name": "Kode Bilyet",
        "length": 2
      },
      {
        "name": "No Bilyet",
        "length": 10
      },
      {
        "name": "No Referensi",
        "length": 20
      },
      {
        "name": "Tipe Deposito",
        "length": 5
      },
      {
        "name": "Mata Uang",
        "length": 3
      },
      {
        "name": "Nominal Deposito",
        "length": 20
      },
      {
        "name": "Jangka Waktu",
        "length": 5
      },
      {
        "name": "Tgl Kontrak",
        "length": 8
      },
      {
        "name": "Tgl Mulai",
        "length": 8
      },
      {
        "name": "Tgl Jatuh Tempo",
        "length": 8
      },
      {
        "name": "Kantor Kas",
        "length": 3
      },
      {
        "name": "Referensi AO",
        "length": 3
      },
      {
        "name": "Kode Bonus Bunga",
        "length": 4
      },
      {
        "name": "Status Penempatan",
        "length": 3
      },
      {
        "name": "Kelompok",
        "length": 10
      },
      {
        "name": "Insentif",
        "length": 4
      },
      {
        "name": "No Nasabah",
        "length": 8
      },
      {
        "name": "Nama",
        "length": 50
      },
      {
        "name": "Kode Alamat",
        "length": 2
      },
      {
        "name": "Suku Bunga",
        "length": 3
      },
      {
        "name": "Persentase Bunga",
        "length": 9
      },
      {
        "name": "Freq Bayar Bunga",
        "length": 5
      },
      {
        "name": "Pajak",
        "length": 3
      },
      {
        "name": "Flag ARO",
        "length": 1
      },
      {
        "name": "Pencairan Pokok",
        "length": 1
      },
      {
        "name": "Pencairan Bunga",
        "length": 1
      },
      {
        "name": "Rekening Sumber Dana",
        "length": 20
      },
      {
        "name": "Kredit Rekening Bunga",
        "length": 20
      },
      {
        "name": "No Warkat",
        "length": 12
      },
      {
        "name": "Kurs",
        "length": 13
      },
      {
        "name": "Currency Biaya",
        "length": 3
      },
      {
        "name": "Kode FBI",
        "length": 4
      },
      {
        "name": "Nilai",
        "length": 20
      },
      {
        "name": "Rekening Biaya",
        "length": 20
      }
    ]
  },
  "recurring_deposit": {
    "id": "recurring_deposit",
    "title": "Recurring Deposit Account",
    "totalLength": 222,
    "sample": "001000008338226IDR   N999          TEST 3                                            TEST 3         01TR1N0000000000001000000020211223020505            0020M1M023010010000098        0000000000002500000000000000000050000000",
    "fields": [
      {
        "name": "Kode Cabang",
        "length": 4
      },
      {
        "name": "No. Nasabah",
        "length": 8
      },
      {
        "name": "Jenis Rekening",
        "length": 3
      },
      {
        "name": "Kode Mata Uang",
        "length": 3
      },
      {
        "name": "Kantor Kas",
        "length": 3
      },
      {
        "name": "Join Account",
        "length": 1
      },
      {
        "name": "Referensi AO",
        "length": 3
      },
      {
        "name": "Kode Kolektor",
        "length": 10
      },
      {
        "name": "Nama",
        "length": 50
      },
      {
        "name": "Nama Singkat",
        "length": 15
      },
      {
        "name": "Kode Alamat",
        "length": 2
      },
      {
        "name": "Pajak",
        "length": 3
      },
      {
        "name": "Restitusi",
        "length": 1
      },
      {
        "name": "Saldo Minimum",
        "length": 20
      },
      {
        "name": "Tanggal Buka",
        "length": 8
      },
      {
        "name": "Tujuan Pembukaan",
        "length": 2
      },
      {
        "name": "Sumber Dana",
        "length": 2
      },
      {
        "name": "Penggunaan Dana",
        "length": 2
      },
      {
        "name": "Passbook Code",
        "length": 2
      },
      {
        "name": "Passbook Number",
        "length": 10
      },
      {
        "name": "Jangka Waktu",
        "length": 5
      },
      {
        "name": "Frekuensi",
        "length": 5
      },
      {
        "name": "No. Rek. Debet",
        "length": 20
      },
      {
        "name": "Cicilan",
        "length": 20
      },
      {
        "name": "First Deposit Amount",
        "length": 20
      }
    ]
  },
  "inq_close_deposito": {
    "id": "inq_close_deposito",
    "title": "Inquiry Close Deposito",
    "totalLength": 103,
    "sample": "0058DPMB             2540189317          000000000001INQUIRY BREAK DP MBANKING                         ",
    "fields": [
      {
        "name": "Kode Cabang",
        "length": 4
      },
      {
        "name": "Tipe Deposito",
        "length": 5
      },
      {
        "name": "Kode Bilyet",
        "length": 2
      },
      {
        "name": "No Bilyet",
        "length": 10
      },
      {
        "name": "No Referensi",
        "length": 20
      },
      {
        "name": "Bunga Break",
        "length": 9
      },
      {
        "name": "Alasan Tutup",
        "length": 3
      },
      {
        "name": "Ket Break",
        "length": 50
      }
    ]
  },
  "inq_pencairan_bunga": {
    "id": "inq_pencairan_bunga",
    "title": "Inquiry Pencairan Bunga Deposito",
    "totalLength": 42,
    "sample": "0035DPMB             2540183107          1",
    "fields": [
      {
        "name": "Kode Cabang",
        "length": 4
      },
      {
        "name": "Tipe Deposito",
        "length": 5
      },
      {
        "name": "Kode Bilyet",
        "length": 2
      },
      {
        "name": "No Bilyet",
        "length": 10
      },
      {
        "name": "No Referensi",
        "length": 20
      },
      {
        "name": "Metode Pencairan Bunga",
        "length": 1
      }
    ]
  },
  "inq_pencairan_pokok_deposito": {
    "id": "inq_pencairan_pokok_deposito",
    "title": "Inquiry Pencairan Pokok Deposito",
    "totalLength": 45,
    "sample": "0035DPMB             2540183107          1001",
    "fields": [
      {
        "name": "Kode Cabang",
        "length": 4
      },
      {
        "name": "Tipe Deposito",
        "length": 5
      },
      {
        "name": "Kode Bilyet",
        "length": 2
      },
      {
        "name": "No Bilyet",
        "length": 10
      },
      {
        "name": "No Referensi",
        "length": 20
      },
      {
        "name": "Metode Pencairan Pokok",
        "length": 1
      },
      {
        "name": "Alasan Tutup",
        "length": 3
      }
    ]
  },
  "commit_break_deposito": {
    "id": "commit_break_deposito",
    "title": "Commit Break Deposito",
    "totalLength": 282,
    "sample": "0058DPMB             2540189317          000000000001Pencairan deposito sebelum jatuh tempo            0000000000000000000000000000000000000000                    00000000000000000000+0000000000000000000000000000000000000000    000000000000000000001                                 ",
    "fields": [
      {
        "name": "Kode Cabang",
        "length": 4
      },
      {
        "name": "Tipe Deposito",
        "length": 5
      },
      {
        "name": "Kode Bilyet",
        "length": 2
      },
      {
        "name": "No Bilyet",
        "length": 10
      },
      {
        "name": "No Referensi",
        "length": 20
      },
      {
        "name": "Bunga Break",
        "length": 9
      },
      {
        "name": "Alasan Tutup",
        "length": 3
      },
      {
        "name": "Ket Break",
        "length": 50
      },
      {
        "name": "Outstanding deposito",
        "length": 20
      },
      {
        "name": "Bunga Belum Dibayar",
        "length": 20
      },
      {
        "name": "Accrue Saat ini",
        "length": 20
      },
      {
        "name": "Nilai Adjustment",
        "length": 20
      },
      {
        "name": "Sign Adjustment",
        "length": 1
      },
      {
        "name": "Pajak Atas Bunga",
        "length": 20
      },
      {
        "name": "Total",
        "length": 20
      },
      {
        "name": "Tabel Denda",
        "length": 4
      },
      {
        "name": "Nilai Denda",
        "length": 20
      },
      {
        "name": "Pencairan Pokok",
        "length": 1
      },
      {
        "name": "Kurs",
        "length": 13
      },
      {
        "name": "Kredit Rekening",
        "length": 20
      }
    ]
  },
  "commit_pencairan_bunga": {
    "id": "commit_pencairan_bunga",
    "title": "Commit Pencairan Bunga Deposito",
    "totalLength": 204,
    "sample": "0058DPMB             2540189317          100000000003000000000+00000000000010375800+00000000000000000000+00000000000002075200-00000000000008300600+    000000000000000000000110094436                       ",
    "fields": [
      {
        "name": "Kode Cabang",
        "length": 4
      },
      {
        "name": "Tipe Deposito",
        "length": 5
      },
      {
        "name": "Kode Bilyet",
        "length": 2
      },
      {
        "name": "No Bilyet",
        "length": 10
      },
      {
        "name": "No Referensi",
        "length": 20
      },
      {
        "name": "Metode Pencairan Bunga",
        "length": 1
      },
      {
        "name": "Nominal Deposito",
        "length": 20
      },
      {
        "name": "Nominal Deposito Sign",
        "length": 1
      },
      {
        "name": "Bunga Jatuh Tempo",
        "length": 20
      },
      {
        "name": "Bunga Jatuh Tempo Sign",
        "length": 1
      },
      {
        "name": "Nilai Adjustment",
        "length": 20
      },
      {
        "name": "Nilai Adjustment Sign",
        "length": 1
      },
      {
        "name": "Pajak Atas Bunga",
        "length": 20
      },
      {
        "name": "Pajak Atas Bunga Sign",
        "length": 1
      },
      {
        "name": "Bunga Netto",
        "length": 20
      },
      {
        "name": "Bunga Netto Sign",
        "length": 1
      },
      {
        "name": "Tabel Biaya Lain",
        "length": 4
      },
      {
        "name": "Nilai Biaya Lain",
        "length": 20
      },
      {
        "name": "Kredit Rekening",
        "length": 20
      },
      {
        "name": "Kurs",
        "length": 13
      }
    ]
  },
  "commit_pencairan_pokok_deposito": {
    "id": "commit_pencairan_pokok_deposito",
    "title": "Commit Pencairan Pokok Deposito",
    "totalLength": 122,
    "sample": "0058DPMB             2540189317          10010110094436          00000000003000000000                 00000000000000000000",
    "fields": [
      {
        "name": "Kode Cabang",
        "length": 4
      },
      {
        "name": "Tipe Deposito",
        "length": 5
      },
      {
        "name": "Kode Bilyet",
        "length": 2
      },
      {
        "name": "No Bilyet",
        "length": 10
      },
      {
        "name": "No Referensi",
        "length": 20
      },
      {
        "name": "Metode Pencairan Pokok",
        "length": 1
      },
      {
        "name": "Alasan Tutup",
        "length": 3
      },
      {
        "name": "Kredit Rekening",
        "length": 20
      },
      {
        "name": "Nilai Transaksi",
        "length": 20
      },
      {
        "name": "Kurs",
        "length": 13
      },
      {
        "name": "Tabel Biaya Lain",
        "length": 4
      },
      {
        "name": "Nilai Biaya Lain",
        "length": 20
      }
    ]
  }
};
