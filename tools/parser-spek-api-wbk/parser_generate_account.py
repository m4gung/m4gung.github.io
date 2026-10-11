from decimal import Decimal


def convert_amount_core(amount):
    """
    Mengonversi nilai amount ke format core spec jika ada:
    Dikalikan 100 (2 digit desimal), diubah ke string tanpa titik desimal,
    dan di-pad dengan angka '0' di sebelah kiri hingga panjang 20 karakter.
    Jika kosong, menghasilkan 20 spasi.
    """
    if not amount or str(amount).strip() == "":
        return "".ljust(20)
    dec_amount = Decimal(str(amount)) * Decimal(100)
    int_str = str(int(dec_amount))
    return int_str.rjust(20, "0")


def generate_account(payload):
    """
    Menghasilkan fixed-length string (140 karakter) berdasarkan fungsi:
    RegisNewCustomerProccess.generateAccount(...)

    Catatan penting tentang 'Jenis Rekening':
    Pada kode Java tertulis: new DT("Jenis Rekening", "", 2, "221", true).
    Karena DT constructor tidak memotong (truncate) nilai default yang lebih panjang dari length,
    maka dt.value tetap bernilai "221" (panjang 3 karakter). Oleh karena itu, panjang aktual
    field Jenis Rekening pada string core banking adalah 3 karakter.
    """
    kode_cabang = str(payload.get("kode_cabang_account", payload.get("kode_cabang", "")))[:4].ljust(4)
    no_nasabah = str(payload.get("no_nasabah", ""))[:8].ljust(8)
    jenis_rekening = str(payload.get("jenis_rekening", "221"))[:3].ljust(3)
    kode_mata_uang = str(payload.get("kode_mata_uang", "IDR"))[:3].ljust(3)
    kantor_kas = str(payload.get("kantor_kas", ""))[:3].ljust(3)
    join_account = str(payload.get("join_account", "N"))[:1].ljust(1)
    referensi_ao = str(payload.get("ref_ao", payload.get("referensi_ao", "")))[:3].ljust(3)
    kode_kolektor = "".ljust(10)

    nama_raw = str(payload.get("nama", ""))
    nama = nama_raw[:50].ljust(50)
    nama_singkat = nama_raw[:15].ljust(15)

    kode_alamat = str(payload.get("kode_alamat", "01"))[:2].ljust(2)
    pajak = str(payload.get("pajak", "TR1"))[:3].ljust(3)
    restitusi = str(payload.get("restitusi", "N"))[:1].ljust(1)

    saldo_min_val = payload.get("saldo_minimum", "")
    saldo_minimum = convert_amount_core(saldo_min_val) if saldo_min_val else "".ljust(20)

    tanggal_buka = str(payload.get("tanggal_buka", "")).replace("-", "")[:8].ljust(8)
    tujuan_pembukaan = str(payload.get("tujuan_pembukaan", "01"))[:2].ljust(2)
    sumber_dana = str(payload.get("sumber_dana", "01"))[:2].ljust(2)
    penggunaan_dana = str(payload.get("penggunaan_dana", "01"))[:2].ljust(2)

    parts = [
        kode_cabang,       # 4
        no_nasabah,        # 8
        jenis_rekening,    # 3
        kode_mata_uang,    # 3
        kantor_kas,        # 3
        join_account,      # 1
        referensi_ao,      # 3
        kode_kolektor,     # 10
        nama,              # 50
        nama_singkat,      # 15
        kode_alamat,       # 2
        pajak,             # 3
        restitusi,         # 1
        saldo_minimum,     # 20
        tanggal_buka,      # 8
        tujuan_pembukaan,  # 2
        sumber_dana,       # 2
        penggunaan_dana,   # 2
    ]

    return "".join(parts)


def parse_account_data(data_string):
    """
    Definisi skema pemotongan data string berdasarkan fungsi:
    RegisNewCustomerProccess.generateAccount(...)
    Total panjang yang diharapkan: 140 karakter (18 field).
    """
    fields = [
        {"name": "Kode Cabang", "length": 4},
        {"name": "No. Nasabah", "length": 8},
        {"name": "Jenis Rekening", "length": 3},
        {"name": "Kode Mata Uang", "length": 3},
        {"name": "Kantor Kas", "length": 3},
        {"name": "Join Account", "length": 1},
        {"name": "Referensi AO", "length": 3},
        {"name": "Kode Kolektor", "length": 10},
        {"name": "Nama", "length": 50},
        {"name": "Nama Singkat", "length": 15},
        {"name": "Kode Alamat", "length": 2},
        {"name": "Pajak", "length": 3},
        {"name": "Restitusi", "length": 1},
        {"name": "Saldo Minimum", "length": 20},
        {"name": "Tanggal Buka", "length": 8},
        {"name": "Tujuan Pembukaan", "length": 2},
        {"name": "Sumber Dana", "length": 2},
        {"name": "Penggunaan Dana", "length": 2},
    ]

    expected_length = sum(f["length"] for f in fields)
    if len(data_string) != expected_length:
        print(f"⚠️ Peringatan: Panjang data string adalah {len(data_string)} karakter.")
        print(f"⚠️ Seharusnya total panjangnya adalah {expected_length} karakter.\n")

    print(f"Data Input: '{data_string}'\n")
    print("-" * 65)
    print(f"{'Nama Field':<25} | {'Panjang':<7} | {'Nilai (Value)'}")
    print("-" * 65)

    result_dict = {}
    current_pos = 0
    for field in fields:
        name = field["name"]
        length = field["length"]

        # Potong string sesuai dengan panjang (length)
        value = data_string[current_pos : current_pos + length]

        print(f"{name:<25} | {length:<7} | '{value}'")
        result_dict[name] = value

        current_pos += length

    print("-" * 65)
    return result_dict


# --- Contoh Penggunaan ---
if __name__ == "__main__":
    sample_payload = {
        "kode_cabang_account": "0010",
        "no_nasabah": "00008338",
        "jenis_rekening": "221",
        "ref_ao": "999",
        "nama": "BUDI SANTOSO",
        "tanggal_buka": "20261005",
        "tujuan_pembukaan": "01",
        "sumber_dana": "01",
        "penggunaan_dana": "01",
        "saldo_minimum": "",  # default kosong (20 spasi) pada generateAccount
    }

    print("=== TESTING GENERATOR ===")
    generated_string = generate_account(sample_payload)
    print(f"Hasil Generate: '{generated_string}'")
    print(f"Panjang Hasil: {len(generated_string)} karakter\n")

    print("=== TESTING PARSER ===")
    parse_account_data(generated_string)
