def parse_deposito_data(data_string):
    # Definisi skema berdasarkan fungsi generateInqPencairanPokokDeposito
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

    current_pos = 0
    for field in fields:
        name = field["name"]
        length = field["length"]
        
        # Potong string sesuai dengan panjang (length)
        value = data_string[current_pos : current_pos + length]
        
        print(f"{name:<25} | {length:<7} | '{value}'")
        
        current_pos += length
        
    print("-" * 65)

# --- Contoh Penggunaan ---
if __name__ == "__main__":
    # Data yang ingin Anda test
    data_tes = "0035DPMB             2540183107          1001"
    
    parse_deposito_data(data_tes)
