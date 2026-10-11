from decimal import Decimal


def convert_amount_core(amount):
    """
    Mengonversi nilai amount ke format core spec:
    Dikalikan 100 (2 digit desimal), diubah ke string tanpa titik desimal,
    dan di-pad dengan angka '0' di sebelah kiri hingga panjang 20 karakter.
    """
    if not amount:
        amount = "0"
    dec_amount = Decimal(str(amount)) * Decimal(100)
    int_str = str(int(dec_amount))
    return int_str.rjust(20, "0")


def generate_commit_pencairan_pokok_deposito(payload):
    """
    Menghasilkan fixed-length string (122 karakter) berdasarkan fungsi:
    DepositoProcess.generateCommitPencairanPokokDeposito(...)
    """
    kode_cabang = str(payload.get("kode_cabang", ""))[:4].ljust(4)
    tipe_deposito = "DPMB "
    kode_bilyet = "  "
    no_bilyet = "".ljust(10)
    no_referensi = str(payload.get("no_rekening_deposito", payload.get("norek", "")))[:20].ljust(20)
    metode_pencairan_pokok = str(payload.get("metode_pencairan_pokok", "1"))[:1].ljust(1)
    alasan_tutup = str(payload.get("alasan_tutup", "001"))[:3].ljust(3)
    kredit_rekening = str(payload.get("no_rekening_tujuan", payload.get("trans_dest_no", "")))[:20].ljust(20)
    nilai_transaksi = convert_amount_core(payload.get("total", payload.get("nilai_transaksi", "0")))
    kurs = "".ljust(13)
    tabel_biaya_lain = "    "
    nilai_biaya_lain = convert_amount_core("0")

    parts = [
        kode_cabang,             # 4
        tipe_deposito,           # 5
        kode_bilyet,             # 2
        no_bilyet,               # 10
        no_referensi,            # 20
        metode_pencairan_pokok,  # 1
        alasan_tutup,            # 3
        kredit_rekening,         # 20
        nilai_transaksi,         # 20
        kurs,                    # 13
        tabel_biaya_lain,        # 4
        nilai_biaya_lain,        # 20
    ]

    return "".join(parts)


def parse_commit_pencairan_pokok_deposito_data(data_string):
    """
    Definisi skema pemotongan data string berdasarkan fungsi:
    DepositoProcess.generateCommitPencairanPokokDeposito(...)
    Total panjang yang diharapkan: 122 karakter.
    """
    fields = [
        {"name": "Kode Cabang", "length": 4},
        {"name": "Tipe Deposito", "length": 5},
        {"name": "Kode Bilyet", "length": 2},
        {"name": "No Bilyet", "length": 10},
        {"name": "No Referensi", "length": 20},
        {"name": "Metode Pencairan Pokok", "length": 1},
        {"name": "Alasan Tutup", "length": 3},
        {"name": "Kredit Rekening", "length": 20},
        {"name": "Nilai Transaksi", "length": 20},
        {"name": "Kurs", "length": 13},
        {"name": "Tabel Biaya Lain", "length": 4},
        {"name": "Nilai Biaya Lain", "length": 20},
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
        "kode_cabang": "0058",
        "no_rekening_deposito": "2540189317",
        "no_rekening_tujuan": "0110094436",
        "total": "30000000",
        "biaya_lain": "0",
    }

    print("=== TESTING GENERATOR ===")
    generated_string = "0058DPMB             2540189317          10010110094436          00000000003000000000                 00000000000000000000"#generate_commit_pencairan_pokok_deposito(sample_payload)
    print(f"Hasil Generate: '{generated_string}'")
    print(f"Panjang Hasil: {len(generated_string)} karakter\n")

    print("=== TESTING PARSER ===")
    parse_commit_pencairan_pokok_deposito_data(generated_string)
