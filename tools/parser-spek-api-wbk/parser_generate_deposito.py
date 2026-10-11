from datetime import datetime
from decimal import Decimal


def convert_rate_core(rate):
    """
    Mengonversi rate suku bunga ke format core spec:
    Dikalikan 1.000.000, dipotong bagian desimal jika ada,
    dan di-pad dengan angka '0' di sebelah kiri hingga panjang 9 digit.
    Contoh: '5.25' -> '005250000'
    """
    if not rate:
        rate = "0"
    dec_rate = Decimal(str(rate)) * Decimal(1000000)
    int_str = str(int(dec_rate))
    return int_str.rjust(9, "0")


def convert_amount_nominal(amount):
    """
    Mengonversi amount deposito ke nominal core:
    Di Java: Utility.str_pad(amount + "00", 20, "0", Utility.STR_PAD_LEFT)
    """
    if not amount:
        amount = "0"
    # Dukung input desimal maupun string integer polos
    if "." in str(amount):
        dec_amount = Decimal(str(amount)) * Decimal(100)
        int_str = str(int(dec_amount))
    else:
        int_str = str(amount) + "00"
    return int_str.rjust(20, "0")


def generate_deposito(payload):
    """
    Menghasilkan fixed-length string (315 karakter) berdasarkan fungsi:
    DepositoProcess.generateDeposito(...)
    """
    today_str = datetime.now().strftime("%Y%m%d")
    today_day = datetime.now().strftime("%d")

    deposit_date = str(payload.get("deposit_date", today_str)).replace("-", "")[:8].ljust(8)
    default_freq = "1M0" + deposit_date[6:8] if len(deposit_date) >= 8 else ("1M0" + today_day)
    freq_bayar_bunga = str(payload.get("freq_bayar_bunga", default_freq))[:5].ljust(5)

    kode_cabang = str(payload.get("kode_cabang", ""))[:4].ljust(4)
    kode_bilyet = "  "
    no_bilyet = "".ljust(10)
    no_referensi = "".ljust(20)
    tipe_deposito = "DPMB "
    mata_uang = "IDR"
    nominal_deposito = convert_amount_nominal(payload.get("amount", "0"))

    jangka_waktu_val = str(payload.get("jangka_waktu", "")) + "M"
    jangka_waktu = jangka_waktu_val.rjust(5, "0")

    tgl_kontrak = deposit_date
    tgl_mulai = deposit_date
    tgl_jatuh_tempo = "".ljust(8)
    kantor_kas = "".ljust(3)
    ref_ao = str(payload.get("ref_ao", ""))[:3].ljust(3)
    kode_bonus_bunga = "".ljust(4)
    status_penempatan = "001"
    kelompok = "".ljust(10)
    insentif = "".ljust(4)
    no_nasabah = str(payload.get("cif", payload.get("no_nasabah", "")))[:8].ljust(8)
    nama = str(payload.get("nama", ""))[:50].ljust(50)
    kode_alamat = "01"
    suku_bunga = str(payload.get("suku_bunga", ""))[:3].ljust(3)
    persentase_bunga = convert_rate_core(payload.get("persentase_bunga", "0"))
    pajak = "TD1"

    flag_aro = str(payload.get("flag_aro", "1"))[:1].ljust(1)
    pencairan_pokok = " "

    # Sesuai logika Java: intFlagAro == API.FLAG_DEPOSITO_ARO (1) -> "1", else " "
    if "pencairan_bunga" in payload:
        pencairan_bunga = str(payload["pencairan_bunga"])[:1].ljust(1)
    elif flag_aro == "1":
        pencairan_bunga = "1"
    else:
        pencairan_bunga = " "

    rekening_sumber = str(payload.get("rekening_sumber", ""))[:20].ljust(20)
    rekening_kredit_bunga = str(payload.get("rekening_kredit_bunga", ""))[:20].ljust(20)
    no_warkat = "".ljust(12)
    kurs = "".ljust(13)
    currency_biaya = "".ljust(3)
    kode_fbi = "".ljust(4)
    nilai = "".ljust(20)
    rekening_biaya = "".ljust(20)

    parts = [
        kode_cabang,            # 4
        kode_bilyet,            # 2
        no_bilyet,              # 10
        no_referensi,           # 20
        tipe_deposito,          # 5
        mata_uang,              # 3
        nominal_deposito,       # 20
        jangka_waktu,           # 5
        tgl_kontrak,            # 8
        tgl_mulai,              # 8
        tgl_jatuh_tempo,        # 8
        kantor_kas,             # 3
        ref_ao,                 # 3
        kode_bonus_bunga,       # 4
        status_penempatan,      # 3
        kelompok,               # 10
        insentif,               # 4
        no_nasabah,             # 8
        nama,                   # 50
        kode_alamat,            # 2
        suku_bunga,             # 3
        persentase_bunga,       # 9
        freq_bayar_bunga,       # 5
        pajak,                  # 3
        flag_aro,               # 1
        pencairan_pokok,        # 1
        pencairan_bunga,        # 1
        rekening_sumber,        # 20
        rekening_kredit_bunga,  # 20
        no_warkat,              # 12
        kurs,                   # 13
        currency_biaya,         # 3
        kode_fbi,               # 4
        nilai,                  # 20
        rekening_biaya,         # 20
    ]

    return "".join(parts)


def parse_deposito_data(data_string):
    """
    Definisi skema pemotongan data string berdasarkan fungsi:
    DepositoProcess.generateDeposito(...)
    Total panjang yang diharapkan: 315 karakter.
    """
    fields = [
        {"name": "Kode Cabang", "length": 4},
        {"name": "Kode Bilyet", "length": 2},
        {"name": "No Bilyet", "length": 10},
        {"name": "No Referensi", "length": 20},
        {"name": "Tipe Deposito", "length": 5},
        {"name": "Mata Uang", "length": 3},
        {"name": "Nominal Deposito", "length": 20},
        {"name": "Jangka Waktu", "length": 5},
        {"name": "Tgl Kontrak", "length": 8},
        {"name": "Tgl Mulai", "length": 8},
        {"name": "Tgl Jatuh Tempo", "length": 8},
        {"name": "Kantor Kas", "length": 3},
        {"name": "Referensi AO", "length": 3},
        {"name": "Kode Bonus Bunga", "length": 4},
        {"name": "Status Penempatan", "length": 3},
        {"name": "Kelompok", "length": 10},
        {"name": "Insentif", "length": 4},
        {"name": "No Nasabah", "length": 8},
        {"name": "Nama", "length": 50},
        {"name": "Kode Alamat", "length": 2},
        {"name": "Suku Bunga", "length": 3},
        {"name": "Persentase Bunga", "length": 9},
        {"name": "Freq Bayar Bunga", "length": 5},
        {"name": "Pajak", "length": 3},
        {"name": "Flag ARO", "length": 1},
        {"name": "Pencairan Pokok", "length": 1},
        {"name": "Pencairan Bunga", "length": 1},
        {"name": "Rekening Sumber Dana", "length": 20},
        {"name": "Kredit Rekening Bunga", "length": 20},
        {"name": "No Warkat", "length": 12},
        {"name": "Kurs", "length": 13},
        {"name": "Currency Biaya", "length": 3},
        {"name": "Kode FBI", "length": 4},
        {"name": "Nilai", "length": 20},
        {"name": "Rekening Biaya", "length": 20},
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
        "amount": "10000000",
        "jangka_waktu": "1",
        "cif": "00008338",
        "nama": "TEST NASABAH DEPOSITO",
        "suku_bunga": "001",
        "persentase_bunga": "5.25",
        "flag_aro": "1",
        "rekening_sumber": "010010000098",
        "rekening_kredit_bunga": "010010000098",
        "ref_ao": "999",
        "deposit_date": "20261005",
        "freq_bayar_bunga": "1M005",
    }

    print("=== TESTING GENERATOR ===")
    generated_string = generate_deposito(sample_payload)
    print(f"Hasil Generate: '{generated_string}'")
    print(f"Panjang Hasil: {len(generated_string)} karakter\n")

    print("=== TESTING PARSER ===")
    parse_deposito_data(generated_string)
