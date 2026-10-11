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


def generate_recurring_deposit_data_account(payload):
    """
    Menghasilkan fixed-length string (222 karakter) berdasarkan fungsi:
    RequestNewTabBerjangka.generateRecurringDepositDataAccount()
    """
    kode_cabang = str(payload.get("kode_cabang", ""))[:4].ljust(4)
    no_nasabah = str(payload.get("no_nasabah", ""))[:8].ljust(8)
    jenis_rekening = str(payload.get("jenis_rekening", ""))[:3].ljust(3)
    kode_mata_uang = str(payload.get("kode_mata_uang", "IDR"))[:3].ljust(3)
    kantor_kas = "".ljust(3)
    join_account = str(payload.get("join_account", "N"))[:1].ljust(1)
    referensi_ao = str(payload.get("referensi_ao", ""))[:3].ljust(3)
    kode_kolektor = "".ljust(10)

    nama_full = str(payload.get("nama", ""))[:50].ljust(50)
    nama_singkat = str(payload.get("nama", ""))[:15].ljust(15)

    kode_alamat = str(payload.get("kode_alamat", "01"))[:2].ljust(2)
    pajak = str(payload.get("pajak", "TR1"))[:3].ljust(3)
    restitusi = str(payload.get("restitusi", "N"))[:1].ljust(1)
    saldo_minimum = convert_amount_core(payload.get("saldo_minimum", "0"))
    tanggal_buka = str(payload.get("tanggal_buka", "")).replace("-", "")[:8].ljust(8)
    tujuan_pembukaan = str(payload.get("tujuan_pembukaan", "02"))[:2].ljust(2)
    sumber_dana = str(payload.get("sumber_dana", "05"))[:2].ljust(2)
    penggunaan_dana = str(payload.get("penggunaan_dana", "05"))[:2].ljust(2)
    passbook_code = "".ljust(2)
    passbook_number = "".ljust(10)

    jangka_waktu_val = str(payload.get("jangka_waktu", "")) + "M"
    jangka_waktu = jangka_waktu_val.rjust(5, "0")

    frekuensi_val = str(payload.get("frekuensi", ""))
    frekuensi = ("1M0" + frekuensi_val)[:5].ljust(5)

    no_rekening_debet = str(payload.get("no_rekening_debet", ""))[:20].ljust(20)
    cicilan = convert_amount_core(payload.get("cicilan", "0"))
    first_deposit = convert_amount_core(payload.get("first_deposit_amount", payload.get("firstDepositAMount", "0")))

    parts = [
        kode_cabang,        # 4
        no_nasabah,         # 8
        jenis_rekening,     # 3
        kode_mata_uang,     # 3
        kantor_kas,         # 3
        join_account,       # 1
        referensi_ao,       # 3
        kode_kolektor,      # 10
        nama_full,          # 50
        nama_singkat,       # 15
        kode_alamat,        # 2
        pajak,              # 3
        restitusi,          # 1
        saldo_minimum,      # 20
        tanggal_buka,       # 8
        tujuan_pembukaan,   # 2
        sumber_dana,        # 2
        penggunaan_dana,    # 2
        passbook_code,      # 2
        passbook_number,    # 10
        jangka_waktu,       # 5
        frekuensi,          # 5
        no_rekening_debet,  # 20
        cicilan,            # 20
        first_deposit,      # 20
    ]

    return "".join(parts)


def parse_recurring_deposit_data_account(data_string):
    """
    Definisi skema pemotongan data string berdasarkan fungsi:
    RequestNewTabBerjangka.generateRecurringDepositDataAccount()
    Total panjang yang diharapkan: 222 karakter.
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
        {"name": "Passbook Code", "length": 2},
        {"name": "Passbook Number", "length": 10},
        {"name": "Jangka Waktu", "length": 5},
        {"name": "Frekuensi", "length": 5},
        {"name": "No. Rek. Debet", "length": 20},
        {"name": "Cicilan", "length": 20},
        {"name": "First Deposit Amount", "length": 20},
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
    # Contoh data tes dari catatan file RequestNewTabBerjangka.java (panjang 222 karakter)
    # {"access_token":"JVBE9XSqQZYtwqmchS/wFg==","data":"001100053176233IDR   N638          NI PUTU AYU EVY DAMAYANTI                         NI PUTU AYU EVY01TR1N0000000000000000000020261008999999            0048M1M0080110078069          0000000000008840425500000000000345000000","access_id":"ALTOMOBIL2","trace_no":"20261008190922184146"}
    data_tes = (
        "001100053176233IDR   N638          NI PUTU AYU EVY DAMAYANTI                         NI PUTU AYU EVY01TR1N0000000000000000000020261008999999            0048M1M0080110078069          0000000000008840425500000000000345000000"
    )

    print("=== TESTING PARSER ===")
    parse_recurring_deposit_data_account(data_tes)

    # print("\n=== TESTING GENERATOR ===")
    # sample_payload = {
    #     "kode_cabang": "0010",
    #     "no_nasabah": "00008338",
    #     "jenis_rekening": "226",
    #     "kode_mata_uang": "IDR",
    #     "join_account": "N",
    #     "referensi_ao": "999",
    #     "nama": "TEST 3",
    #     "kode_alamat": "01",
    #     "pajak": "TR1",
    #     "restitusi": "N",
    #     "saldo_minimum": "100000",
    #     "tanggal_buka": "2021-12-23",
    #     "tujuan_pembukaan": "02",
    #     "sumber_dana": "05",
    #     "penggunaan_dana": "05",
    #     "jangka_waktu": "20",
    #     "frekuensi": "23",
    #     "no_rekening_debet": "010010000098",
    #     "cicilan": "250000",
    #     "first_deposit_amount": "500000",
    # }
    # generated_string = generate_recurring_deposit_data_account(sample_payload)
    # print(f"Hasil Generate: '{generated_string}'")
    # print(f"Panjang Hasil: {len(generated_string)} karakter")
    # print(f"Apakah sama dengan data_tes? {generated_string == data_tes}")
