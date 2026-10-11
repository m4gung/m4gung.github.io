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


def generate_commit_pencairan_bunga(payload):
    """
    Menghasilkan fixed-length string (204 karakter) berdasarkan fungsi:
    DepositoProcess.generateCommitPencairanBunga(...)
    """
    kode_cabang = str(payload.get("kode_cabang", ""))[:4].ljust(4)
    tipe_deposito = "DPMB "
    kode_bilyet = "  "
    no_bilyet = "".ljust(10)
    no_referensi = str(payload.get("no_rekening_deposito", payload.get("norek", "")))[:20].ljust(20)
    metode_pencairan_bunga = "1"

    nominal_deposito = convert_amount_core(payload.get("nominal_deposito", "0"))
    nominal_deposito_sign = str(payload.get("nominal_deposito_sign", "+"))[:1].ljust(1)

    bunga_jatuh_tempo = convert_amount_core(payload.get("bunga_jatuh_tempo", "0"))
    bunga_jatuh_tempo_sign = str(payload.get("bunga_jatuh_tempo_sign", "+"))[:1].ljust(1)

    nilai_adjustment = convert_amount_core(payload.get("nilai_adjustment", "0"))
    nilai_adjustment_sign = str(payload.get("nilai_adjustment_sign", "+"))[:1].ljust(1)

    pajak_atas_bunga = convert_amount_core(payload.get("pajak_atas_bunga", "0"))
    pajak_atas_bunga_sign = str(payload.get("pajak_atas_bunga_sign", "+"))[:1].ljust(1)

    bunga_netto = convert_amount_core(payload.get("bunga_netto", "0"))
    bunga_netto_sign = str(payload.get("bunga_netto_sign", "+"))[:1].ljust(1)

    tabel_biaya_lain = "    "
    nilai_biaya_lain = convert_amount_core("0")

    kredit_rekening = str(payload.get("no_rekening_tujuan", payload.get("trans_dest_no", "")))[:20].ljust(20)
    kurs = "".ljust(13)

    parts = [
        kode_cabang,             # 4
        tipe_deposito,           # 5
        kode_bilyet,             # 2
        no_bilyet,               # 10
        no_referensi,            # 20
        metode_pencairan_bunga,  # 1
        nominal_deposito,        # 20
        nominal_deposito_sign,   # 1
        bunga_jatuh_tempo,       # 20
        bunga_jatuh_tempo_sign,  # 1
        nilai_adjustment,        # 20
        nilai_adjustment_sign,   # 1
        pajak_atas_bunga,        # 20
        pajak_atas_bunga_sign,   # 1
        bunga_netto,             # 20
        bunga_netto_sign,        # 1
        tabel_biaya_lain,        # 4
        nilai_biaya_lain,        # 20
        kredit_rekening,         # 20
        kurs,                    # 13
    ]

    return "".join(parts)


def parse_commit_pencairan_bunga_data(data_string):
    """
    Definisi skema pemotongan data string berdasarkan fungsi:
    DepositoProcess.generateCommitPencairanBunga(...)
    Total panjang yang diharapkan: 204 karakter.
    """
    fields = [
        {"name": "Kode Cabang", "length": 4},
        {"name": "Tipe Deposito", "length": 5},
        {"name": "Kode Bilyet", "length": 2},
        {"name": "No Bilyet", "length": 10},
        {"name": "No Referensi", "length": 20},
        {"name": "Metode Pencairan Bunga", "length": 1},
        {"name": "Nominal Deposito", "length": 20},
        {"name": "Nominal Deposito Sign", "length": 1},
        {"name": "Bunga Jatuh Tempo", "length": 20},
        {"name": "Bunga Jatuh Tempo Sign", "length": 1},
        {"name": "Nilai Adjustment", "length": 20},
        {"name": "Nilai Adjustment Sign", "length": 1},
        {"name": "Pajak Atas Bunga", "length": 20},
        {"name": "Pajak Atas Bunga Sign", "length": 1},
        {"name": "Bunga Netto", "length": 20},
        {"name": "Bunga Netto Sign", "length": 1},
        {"name": "Tabel Biaya Lain", "length": 4},
        {"name": "Nilai Biaya Lain", "length": 20},
        {"name": "Kredit Rekening", "length": 20},
        {"name": "Kurs", "length": 13},
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
        "nominal_deposito": "30000000",
        "nominal_deposito_sign": "+",
        "bunga_jatuh_tempo": "103758",
        "bunga_jatuh_tempo_sign": "+",
        "nilai_adjustment": "0",
        "nilai_adjustment_sign": "+",
        "pajak_atas_bunga": "20752",
        "pajak_atas_bunga_sign": "-",
        "bunga_netto": "83006",
        "bunga_netto_sign": "+",
    }

    print("=== TESTING GENERATOR ===")
    # generated_string = generate_commit_pencairan_bunga(sample_payload)
    generated_string = "0058DPMB             2540189317          1+000000000030000000+0000000000103758+0000000000000000+000000000020752-0000000000083006+    000000000000000001100094436          "
    print(f"Hasil Generate: '{generated_string}'")
    print(f"Panjang Hasil: {len(generated_string)} karakter\n")

    print("=== TESTING PARSER ===")
    parse_commit_pencairan_bunga_data(generated_string)
