def generate_check_nasabah(payload):
    """
    Menghasilkan fixed-length string (130 karakter) berdasarkan fungsi:
    RegisNewCustomerProccess.generateChackNasabah(nik, hp, email)
    """
    nik = str(payload.get("nik", ""))[:30].ljust(30)
    hp = str(payload.get("hp", payload.get("phone", "")))[:50].ljust(50)
    email = str(payload.get("email", ""))[:50].ljust(50)

    return nik + hp + email


def parse_check_nasabah_data(data_string):
    """
    Definisi skema pemotongan data string berdasarkan fungsi:
    RegisNewCustomerProccess.generateChackNasabah(...)
    Total panjang yang diharapkan: 130 karakter.
    """
    fields = [
        {"name": "NIK", "length": 30},
        {"name": "Nomor HP", "length": 50},
        {"name": "Email", "length": 50},
    ]

    expected_length = sum(f["length"] for f in fields)
    if len(data_string) != expected_length:
        print(f"⚠️ Peringatan: Panjang data string adalah {len(data_string)} karakter.")
        print(f"⚠️ Seharusnya total panjangnya adalah {expected_length} karakter.\n")

    print(f"Data Input: '{data_string}'\n")
    print("-" * 65)
    print(f"{'Nama Field':<20} | {'Panjang':<7} | {'Nilai (Value)'}")
    print("-" * 65)

    result_dict = {}
    current_pos = 0
    for field in fields:
        name = field["name"]
        length = field["length"]

        # Potong string sesuai dengan panjang (length)
        value = data_string[current_pos : current_pos + length]

        print(f"{name:<20} | {length:<7} | '{value}'")
        result_dict[name] = value

        current_pos += length

    print("-" * 65)
    return result_dict


# --- Contoh Penggunaan ---
if __name__ == "__main__":
    sample_payload = {
        "nik": "5171010101900001",
        "hp": "081234567890",
        "email": "nasabah@example.com",
    }

    print("=== TESTING GENERATOR ===")
    generated_string = generate_check_nasabah(sample_payload)
    print(f"Hasil Generate: '{generated_string}'")
    print(f"Panjang Hasil: {len(generated_string)} karakter\n")

    print("=== TESTING PARSER ===")
    parse_check_nasabah_data(generated_string)
