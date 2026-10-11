from decimal import Decimal


def convert_rate_core(rate):
    """
    Mengonversi rate bunga ke format core spec:
    Dikalikan 1.000.000, dipotong bagian desimal jika ada,
    dan di-pad dengan angka '0' di sebelah kiri hingga panjang 9 digit.
    Contoh:
      - '0'     -> '000000000'
      - '5'     -> '005000000'
      - '5.25'  -> '005250000'
      - '0.05'  -> '000050000'
    """
    if not rate:
        rate = "0"
    dec_rate = Decimal(str(rate)) * Decimal(1000000)
    int_str = str(int(dec_rate))
    return int_str.rjust(9, "0")


def generate_inq_close_deposito(payload):
    """
    Menghasilkan fixed-length string (103 karakter) berdasarkan fungsi:
    DepositoProcess.generateInqCloseDeposito(...)
    """
    kode_cabang = str(payload.get("kode_cabang", ""))[:4].ljust(4)
    tipe_deposito = "DPMB "
    kode_bilyet = "  "
    no_bilyet = "".ljust(10)
    no_referensi = str(payload.get("no_rekening_deposito", payload.get("norek", "")))[:20].ljust(20)
    bunga_break = convert_rate_core(payload.get("bunga_break", "0"))
    alasan_tutup = str(payload.get("alasan_tutup", "001"))[:3].ljust(3)
    ket_break = str(payload.get("ket_break", "INQUIRY BREAK DP MBANKING"))[:50].ljust(50)

    parts = [
        kode_cabang,    # 4
        tipe_deposito,  # 5
        kode_bilyet,    # 2
        no_bilyet,      # 10
        no_referensi,   # 20
        bunga_break,    # 9
        alasan_tutup,   # 3
        ket_break,      # 50
    ]

    return "".join(parts)


def parse_inq_close_deposito_data(data_string):
    """
    Definisi skema pemotongan data string berdasarkan fungsi:
    DepositoProcess.generateInqCloseDeposito(...)
    Total panjang yang diharapkan: 103 karakter.
    """
    fields = [
        {"name": "Kode Cabang", "length": 4},
        {"name": "Tipe Deposito", "length": 5},
        {"name": "Kode Bilyet", "length": 2},
        {"name": "No Bilyet", "length": 10},
        {"name": "No Referensi", "length": 20},
        {"name": "Bunga Break", "length": 9},
        {"name": "Alasan Tutup", "length": 3},
        {"name": "Ket Break", "length": 50},
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
        "bunga_break": "0",  # bisa juga dites dengan "5.25", "0.00", dll.
    }

    print("=== TESTING GENERATOR ===")
    generated_string = generate_inq_close_deposito(sample_payload)
    print(f"Hasil Generate: '{generated_string}'")
    print(f"Panjang Hasil: {len(generated_string)} karakter\n")

    print("=== TESTING PARSER ===")
    parse_inq_close_deposito_data(generated_string)

    print("\n=== TESTING BUNGA BREAK VARIATIONS ===")
    for rate_test in ["0", "0.0", "5", "5.25", "7.5", "0.05"]:
        print(f"Rate: {rate_test:<6} -> Core Spec (9 digit): '{convert_rate_core(rate_test)}'")
