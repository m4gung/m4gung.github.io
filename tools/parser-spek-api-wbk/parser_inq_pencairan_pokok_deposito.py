def generate_inq_pencairan_pokok_deposito(payload):
    """
    Menghasilkan fixed-length string (45 karakter) berdasarkan fungsi:
    DepositoProcess.generateInqPencairanPokokDeposito(...)
    """
    kode_cabang = str(payload.get("kode_cabang", ""))[:4].ljust(4)
    tipe_deposito = "DPMB "
    kode_bilyet = "  "
    no_bilyet = "".ljust(10)
    no_referensi = str(payload.get("no_rekening_deposito", payload.get("norek", "")))[:20].ljust(20)
    metode_pencairan_pokok = str(payload.get("metode_pencairan_pokok", "1"))[:1].ljust(1)
    alasan_tutup = str(payload.get("alasan_tutup", "001"))[:3].ljust(3)

    parts = [
        kode_cabang,             # 4
        tipe_deposito,           # 5
        kode_bilyet,             # 2
        no_bilyet,               # 10
        no_referensi,            # 20
        metode_pencairan_pokok,  # 1
        alasan_tutup,            # 3
    ]

    return "".join(parts)


def parse_inq_pencairan_pokok_deposito_data(data_string):
    """
    Definisi skema pemotongan data string berdasarkan fungsi:
    DepositoProcess.generateInqPencairanPokokDeposito(...)
    Total panjang yang diharapkan: 45 karakter.
    """
    fields = [
        {"name": "Kode Cabang", "length": 4},
        {"name": "Tipe Deposito", "length": 5},
        {"name": "Kode Bilyet", "length": 2},
        {"name": "No Bilyet", "length": 10},
        {"name": "No Referensi", "length": 20},
        {"name": "Metode Pencairan Pokok", "length": 1},
        {"name": "Alasan Tutup", "length": 3},
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
        "kode_cabang": "0035",
        "no_rekening_deposito": "2540183107",
    }

    print("=== TESTING GENERATOR ===")
    generated_string = "0035DPMB             2540183107          1001"
    # generate_inq_pencairan_pokok_deposito(sample_payload)
    print(f"Hasil Generate: '{generated_string}'")
    print(f"Panjang Hasil: {len(generated_string)} karakter\n")

    print("=== TESTING PARSER ===")
    parse_inq_pencairan_pokok_deposito_data(generated_string)
