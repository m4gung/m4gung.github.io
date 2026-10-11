def set_string_length(value, max_len):
    """
    Sesuai Utility.setStringLength di Java:
    Memotong ke max_len jika lebih panjang, atau me-right pad dengan spasi jika lebih pendek.
    """
    if value is None:
        value = ""
    val_str = str(value)
    if len(val_str) >= max_len:
        return val_str[:max_len]
    return val_str.ljust(max_len)


def generate_cif(payload):
    """
    Menghasilkan fixed-length string (1382 karakter) berdasarkan fungsi:
    RegisNewCustomerProccess.generateCIF(...)
    """
    p = payload

    nama = p.get("nama", "")
    telp_kontak_person = p.get("telp_kontak_person", "")

    parts = [
        set_string_length(p.get("Kode_Cabang", p.get("kode_cabang", "")), 4),
        set_string_length("01", 2),
        set_string_length("", 3),
        set_string_length(nama, 50),
        set_string_length(nama, 15),
        set_string_length("0104", 4),
        set_string_length("", 30),
        set_string_length("", 8),
        set_string_length(p.get("npwp", ""), 20),
        set_string_length("2", 1),
        set_string_length("N", 1),
        set_string_length("ID", 3),
        set_string_length(p.get("ref_ao", "999"), 3),
        set_string_length("999", 3),
        set_string_length("", 50),
        set_string_length("0361", 4),
        set_string_length(telp_kontak_person, 20),
        set_string_length("N", 1),
        set_string_length("N", 1),
        set_string_length(p.get("email", ""), 50),
        set_string_length("", 50),
        set_string_length("", 50),
        set_string_length(telp_kontak_person, 50),

        # Alamat KTP
        set_string_length("01", 2),
        set_string_length(p.get("alamat", ""), 50),
        set_string_length("", 50),
        set_string_length("", 50),
        set_string_length(p.get("kodepos_ktp", ""), 7),
        set_string_length(p.get("status_tempat_tinggal", ""), 2),
        set_string_length(p.get("rt_ktp", ""), 5),
        set_string_length(p.get("rw_ktp", ""), 5),
        set_string_length(p.get("kelurahan", ""), 8),
        set_string_length(p.get("kecamatan", ""), 8),
        set_string_length(p.get("kampung", ""), 8),
        set_string_length(p.get("kota", ""), 4),
        set_string_length(p.get("dati", ""), 4),
        set_string_length(p.get("provinsi", ""), 4),
        set_string_length("ID", 3),
        set_string_length("0361", 4),
        set_string_length(telp_kontak_person, 20),
        set_string_length("", 20),

        # Data Pribadi & Pekerjaan
        set_string_length(p.get("bidang_usaha", ""), 4),
        set_string_length(p.get("jenis_kelamin", ""), 1),
        set_string_length(p.get("tempat_lahir", ""), 4),
        set_string_length("-", 50),
        set_string_length(p.get("tanggal_lahir", ""), 8),
        set_string_length("", 8),
        set_string_length(p.get("jenis_ID", "1"), 1),
        set_string_length(p.get("tgl_mulai_ID", ""), 8),
        set_string_length(p.get("id_diri", ""), 30),
        set_string_length(p.get("tgl_kadaluarsa_ID", ""), 8),
        set_string_length("9", 1),
        set_string_length("-", 50),
        set_string_length(p.get("agama", ""), 1),
        set_string_length(p.get("pekerjaan", ""), 2),
        set_string_length("999", 3),
        set_string_length(p.get("lokasi_pekerjaan", ""), 1),
        set_string_length(p.get("jabatan", ""), 2),
        set_string_length(p.get("nama_tempat_kerja", ""), 50),
        set_string_length(p.get("pendidikan_terakhir", ""), 2),
        set_string_length(p.get("status_perkawinan", ""), 1),
        set_string_length("001", 3),
        set_string_length(p.get("nama_ibu", ""), 50),
        set_string_length("", 10),
        set_string_length("876", 3),
        set_string_length("99", 2),
        set_string_length("9900", 4),
        set_string_length("N", 1),
        set_string_length("N", 1),
        set_string_length("99", 2),
        set_string_length(p.get("tujuan_buka_rekening", ""), 2),
        set_string_length(p.get("sumber_penghasilan", ""), 2),
        set_string_length(p.get("tujuan_pemakaian_dana", ""), 2),
        set_string_length(p.get("penghasilan_bulanan", ""), 2),
        set_string_length("9", 2),
        set_string_length("99", 2),
        set_string_length("99", 2),
        set_string_length("0", 8),
        set_string_length("99", 2),
        set_string_length("N", 1),
        set_string_length("9000", 4),
        set_string_length("N", 1),
        set_string_length("N", 1),
        set_string_length("-", 50),
        set_string_length("-", 50),
        set_string_length("1M018", 5),
        set_string_length("", 2),

        # Alamat Domisili
        set_string_length("03", 2),
        set_string_length(p.get("alamat_domisili", ""), 50),
        set_string_length("", 50),
        set_string_length("", 50),
        set_string_length(p.get("kodepos_domisili", ""), 7),
        set_string_length(p.get("status_tempat_tinggal", ""), 2),
        set_string_length(p.get("rt_domisili", ""), 5),
        set_string_length(p.get("rw_domisili", ""), 5),
        set_string_length(p.get("kode_core_kel_dom", ""), 8),
        set_string_length(p.get("kode_core_kec_dom", ""), 8),
        set_string_length(p.get("kampung_dom", ""), 8),
        set_string_length(p.get("kode_core_kab_dom", ""), 4),
        set_string_length(p.get("kode_core_kab_dom", ""), 4),
        set_string_length(p.get("kode_core_prov_dom", ""), 4),
        set_string_length("ID", 3),
        set_string_length("0361", 4),
        set_string_length(telp_kontak_person, 20),
        set_string_length("", 20),
        set_string_length("00", 2),
    ]

    return "".join(parts)


def parse_cif_data(data_string):
    """
    Definisi skema pemotongan data string berdasarkan fungsi:
    RegisNewCustomerProccess.generateCIF(...)
    Total panjang yang diharapkan: 1382 karakter (106 field).
    """
    fields = [
        {"name": "Kode Cabang", "length": 4},
        {"name": "Jenis Nasabah", "length": 2},
        {"name": "Kantor Kas", "length": 3},
        {"name": "Nama", "length": 50},
        {"name": "Nama Singkat", "length": 15},
        {"name": "Title", "length": 4},
        {"name": "Keterangan title", "length": 30},
        {"name": "Nasabah Induk", "length": 8},
        {"name": "NPWP", "length": 20},
        {"name": "Terkait dengan Bank", "length": 1},
        {"name": "Nasabah Bank", "length": 1},
        {"name": "Kewarganegaraan", "length": 3},
        {"name": "Referensi AO", "length": 3},
        {"name": "Kode Analisa", "length": 3},
        {"name": "Kontak Person", "length": 50},
        {"name": "Kode Area", "length": 4},
        {"name": "No Telp Kontak Person", "length": 20},
        {"name": "Restitusi", "length": 1},
        {"name": "Cetak Advis Pajak", "length": 1},
        {"name": "Email Nasabah", "length": 50},
        {"name": "Informasi Lainnya 1", "length": 50},
        {"name": "Informasi Lainnya 2", "length": 50},
        {"name": "Informasi Lainnya 3", "length": 50},
        {"name": "Kode Alamat Berdasarkan KTP", "length": 2},
        {"name": "Alamat KTP", "length": 50},
        {"name": "Alamat2 KTP", "length": 50},
        {"name": "Alamat3 KTP", "length": 50},
        {"name": "Kode Pos KTP", "length": 7},
        {"name": "Status Rumah KTP", "length": 2},
        {"name": "RT KTP", "length": 5},
        {"name": "RW KTP", "length": 5},
        {"name": "Kelurahan KTP", "length": 8},
        {"name": "Kecamatan KTP", "length": 8},
        {"name": "Kampung KTP", "length": 8},
        {"name": "Kota KTP", "length": 4},
        {"name": "DATI KTP", "length": 4},
        {"name": "Provinsi KTP", "length": 4},
        {"name": "Negara KTP", "length": 3},
        {"name": "Kode Area KTP", "length": 4},
        {"name": "No. Telepon KTP", "length": 20},
        {"name": "No. Fax KTP", "length": 20},
        {"name": "Bidang Usaha", "length": 4},
        {"name": "Jenis Kelamin", "length": 1},
        {"name": "Tempat Lahir", "length": 4},
        {"name": "Daerah Tempat Lahir", "length": 50},
        {"name": "Tanggal Lahir", "length": 8},
        {"name": "Tanggal Lahir Anak", "length": 8},
        {"name": "Jns. ID.", "length": 1},
        {"name": "Tanggal Mulai ID", "length": 8},
        {"name": "No.Bukti ID Diri/KTP", "length": 30},
        {"name": "Tgl. Kadaluarsa Id", "length": 8},
        {"name": "Nilai Transaksi", "length": 1},
        {"name": "Hobby", "length": 50},
        {"name": "Agama", "length": 1},
        {"name": "Pekerjaan", "length": 2},
        {"name": "Bagian Pekerjaan", "length": 3},
        {"name": "Lokasi Pekerjaan", "length": 1},
        {"name": "Pangkat Pekerjaan", "length": 2},
        {"name": "Tempat Kerja", "length": 50},
        {"name": "Pendidikan Terakhir", "length": 2},
        {"name": "Status Perkawinan", "length": 1},
        {"name": "Jumlah Tanggungan", "length": 3},
        {"name": "Nama Ibu Kandung", "length": 50},
        {"name": "Grup Nasabah", "length": 10},
        {"name": "Golongan Pemilik", "length": 3},
        {"name": "Kode Hukum", "length": 2},
        {"name": "Hub. Dengan Bank", "length": 4},
        {"name": "Red Flag", "length": 1},
        {"name": "Black List", "length": 1},
        {"name": "Kode Risiko", "length": 2},
        {"name": "Tujuan Pembukaan", "length": 2},
        {"name": "Sumber Dana", "length": 2},
        {"name": "Penggunaan Dana", "length": 2},
        {"name": "Penghasilan", "length": 2},
        {"name": "Status Pemilik", "length": 2},
        {"name": "Lembaga Rating", "length": 2},
        {"name": "Rating Nasabah", "length": 2},
        {"name": "Tanggal Rating Nasabah", "length": 8},
        {"name": "Rating Negara Asal", "length": 2},
        {"name": "Daftar Hitam BI", "length": 1},
        {"name": "Golongan Pemilik Basel", "length": 4},
        {"name": "Pelampauan BMPK", "length": 1},
        {"name": "Pelanggaran BMPK", "length": 1},
        {"name": "Informasi Lainnya", "length": 50},
        {"name": "Produk Lainnya", "length": 50},
        {"name": "Frekwensi Review", "length": 5},
        {"name": "Kelengkapan Nasabah", "length": 2},
        {"name": "Kode Alamat Berdasarkan Domisili", "length": 2},
        {"name": "Alamat Domisili", "length": 50},
        {"name": "Alamat2 Domisili", "length": 50},
        {"name": "Alamat3 Domisili", "length": 50},
        {"name": "Kode Pos Domisili", "length": 7},
        {"name": "Status Rumah Domisili", "length": 2},
        {"name": "RT Domisili", "length": 5},
        {"name": "RW Domisili", "length": 5},
        {"name": "Kelurahan Domisili", "length": 8},
        {"name": "Kecamatan Domisili", "length": 8},
        {"name": "Kampung Domisili", "length": 8},
        {"name": "Kota Domisili", "length": 4},
        {"name": "DATI Domisili", "length": 4},
        {"name": "Provinsi Domisili", "length": 4},
        {"name": "Negara Domisili", "length": 3},
        {"name": "Kode Area Domisili", "length": 4},
        {"name": "No. Telepon Domisili", "length": 20},
        {"name": "No. Fax Domisili", "length": 20},
        {"name": "Kode BMPK", "length": 2},
    ]

    expected_length = sum(f["length"] for f in fields)
    if len(data_string) != expected_length:
        print(f"⚠️ Peringatan: Panjang data string adalah {len(data_string)} karakter.")
        print(f"⚠️ Seharusnya total panjangnya adalah {expected_length} karakter.\n")

    print(f"Data Input: '{data_string}'\n")
    print("-" * 65)
    print(f"{'Nama Field':<35} | {'Panjang':<7} | {'Nilai (Value)'}")
    print("-" * 65)

    result_dict = {}
    current_pos = 0
    for field in fields:
        name = field["name"]
        length = field["length"]

        # Potong string sesuai dengan panjang (length)
        value = data_string[current_pos : current_pos + length]

        print(f"{name:<35} | {length:<7} | '{value}'")
        result_dict[name] = value

        current_pos += length

    print("-" * 65)
    return result_dict


# --- Contoh Penggunaan ---
if __name__ == "__main__":
    sample_payload = {
        "Kode_Cabang": "0010",
        "nama": "BUDI SANTOSO",
        "telp_kontak_person": "081234567890",
        "email": "budi.santoso@example.com",
        "npwp": "123456789012345",
        "alamat": "JL. MERDEKA NO. 45",
        "kodepos_ktp": "80111",
        "status_tempat_tinggal": "01",
        "rt_ktp": "001",
        "rw_ktp": "002",
        "kelurahan": "0001",
        "kecamatan": "0002",
        "kampung": "0003",
        "kota": "01",
        "dati": "01",
        "provinsi": "01",
        "bidang_usaha": "01",
        "jenis_kelamin": "1",
        "tempat_lahir": "01",
        "tanggal_lahir": "19900101",
        "jenis_ID": "1",
        "tgl_mulai_ID": "20150101",
        "id_diri": "5171010101900001",
        "tgl_kadaluarsa_ID": "20991231",
        "agama": "1",
        "pekerjaan": "01",
        "lokasi_pekerjaan": "1",
        "jabatan": "01",
        "nama_tempat_kerja": "PT SUKSES MAKMUR",
        "pendidikan_terakhir": "04",
        "status_perkawinan": "1",
        "nama_ibu": "SITI AMINAH",
        "tujuan_buka_rekening": "01",
        "sumber_penghasilan": "01",
        "tujuan_pemakaian_dana": "01",
        "penghasilan_bulanan": "03",
        "alamat_domisili": "JL. MERDEKA NO. 45",
        "kodepos_domisili": "80111",
        "rt_domisili": "001",
        "rw_domisili": "002",
        "kode_core_kel_dom": "0001",
        "kode_core_kec_dom": "0002",
        "kampung_dom": "0003",
        "kode_core_kab_dom": "01",
        "kode_core_prov_dom": "01",
    }

    print("=== TESTING GENERATOR ===")
    generated_string = generate_cif(sample_payload)
    print(f"Hasil Generate ({len(generated_string)} karakter):\n'{generated_string}'\n")

    print("=== TESTING PARSER ===")
    parse_cif_data(generated_string)
