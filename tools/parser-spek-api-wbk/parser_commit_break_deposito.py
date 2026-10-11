def parse_commit_break_deposito_data(data_string):
    # Definisi skema berdasarkan fungsi generateCommitBreakDeposito
    fields = [
        {"name": "Kode Cabang", "length": 4},
        {"name": "Tipe Deposito", "length": 5},
        {"name": "Kode Bilyet", "length": 2},
        {"name": "No Bilyet", "length": 10},
        {"name": "No Referensi", "length": 20},
        {"name": "Bunga Break", "length": 9},
        {"name": "Alasan Tutup", "length": 3},
        {"name": "Ket Break", "length": 50},
        {"name": "Outstanding deposito", "length": 20},
        {"name": "Bunga Belum Dibayar", "length": 20},
        {"name": "Accrue Saat ini", "length": 20},
        {"name": "Nilai Adjustment", "length": 20},
        {"name": "Sign Adjustment", "length": 1},
        {"name": "Pajak Atas Bunga", "length": 20},
        {"name": "Total", "length": 20},
        {"name": "Tabel Denda", "length": 4},
        {"name": "Nilai Denda", "length": 20},
        {"name": "Pencairan Pokok", "length": 1},
        {"name": "Kurs", "length": 13},
        {"name": "Kredit Rekening", "length": 20},
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
    # Data dummy sesuai panjang total (282 karakter)
#     inq close *Response*

# {"rc":"00","data":{"trans.dest_no":"0110094436","nilai_adjustment":"0","type_trigger":"1","accrue_saat_ini":"103758","deposit.id":"94562","trans.dest_id":"vJO+Fa+6a7f+ZuUOcpc30Ze6fJKaSGPvSokPmkYZDxk=","user.rekening_id":"q1mLGW6+cCGdHKo7UE3Cj\/yNvylR6aJ\/aC8AahvhoI4=","pajak_atas_bunga":"0","deposit.amount":"29950000","user.corp_id":"-1","user.accounts":{"total":"103758","nilai_adjustment":"0","accrue_saat_ini":"103758","pajak_atas_bunga":"0","type_closing":"0","outstanding_deposito":"30056835","bunga_belum_dibayar":"103758","deposit.break":"0"},"outstanding_deposito":"30056835","bunga_belum_dibayar":"103758","total":"103758","api.channel":"8003","nama":"NI PUTU NIKEN DIAH PRASTIKA","kode_cabang":"0058","norek":"2540189317","total_dibayar":30160593,"type_closing":"0","deposit.break":0.0},"success":true,"logId":null,"message":"SUCCESS","statusCode":200,"rcDetail":"SUCCESS"}


# *break depo*
# req
# {"access_token":"LtnXDrNSf7akMpOcEgeSVA==","data":"0058DPMB             2540189317          000000000001COMMIT BREAK DP MBANKING                          00000000003005683500000000000000103758000000000000001037580000000000000000000000-0000000000000000000000000000000010375800    000000000000000000001             0110094436          ","access_id":"ALTOMOBIL2","trace_no":"20261005122955860034"}

# resp
# {"error_code":"WE36AMT003","error_desc":"WE36AMT003- Error Not Found"}
# Data Input: '0058DPMB             2540189317          000000000001COMMIT BREAK DP MBANKING                          00000000003005683500000000000000103758000000000000001037580000000000000000000000-0000000000000000000000000000000010375800    000000000000000000001             0110094436          '

# -----------------------------------------------------------------
# Nama Field                | Panjang | Nilai (Value)
# -----------------------------------------------------------------
# Kode Cabang               | 4       | '0058'
# Tipe Deposito             | 5       | 'DPMB '
# Kode Bilyet               | 2       | '  '
# No Bilyet                 | 10      | '          '
# No Referensi              | 20      | '2540189317          '
# Bunga Break               | 9       | '000000000'
# Alasan Tutup              | 3       | '001'
# Ket Break                 | 50      | 'COMMIT BREAK DP MBANKING                          '
# Outstanding deposito      | 20      | '00000000003005683500'
# Bunga Belum Dibayar       | 20      | '00000000000010375800'
# Accrue Saat ini           | 20      | '00000000000010375800'
# Nilai Adjustment          | 20      | '00000000000000000000'
# Sign Adjustment           | 1       | '-'
# Pajak Atas Bunga          | 20      | '00000000000000000000'
# Total                     | 20      | '00000000000010375800'
# Tabel Denda               | 4       | '    '
# Nilai Denda               | 20      | '00000000000000000000'
# Pencairan Pokok           | 1       | '1'
# Kurs                      | 13      | '             '
# Kredit Rekening           | 20      | '0110094436          '
# -----------------------------------------------------------------
    # data_tes = ("0058DPMB             2540189317          000000000001COMMIT BREAK DP MBANKING                          00000000003005683500000000000000103758000000000000001037580000000000000000000000-0000000000000000000000000000000010375800    000000000000000000001             0110094436          ")


    # inq detil
# {"nomor_referensi":"2540132382","nama":"SUNARYO","nominal_deposito":"915814601","suku_bunga":"6","akrual_bunga":"0","jangka_waktu":"0003M","aro":"2","tanggal_mulai":"20260807","tanggal_akhir":"20261107","aro_ke":"00012","cust_no":"00017594","kode_cabang_deposito":"0058","tanggal_kontrak":"20230807","status_blokir":"D","status_deposito":"A","return_code":"","return_desc":"","error_code":0,"error_desc":""}

# inqbreak
# {"kode_cabang":"0058","tipe_deposito":"DPMB","kode_bilyet":"","nomor_bilyet":"","no_referensi":"2540132382","outstanding_deposito":"915814601","bunga_belum_dibayar":"3613077","accrue_saat_ini":"0","nilai_adjustment":"0","pajak_atas_bunga":"0","total":"3613077","return_code":"","return_desc":"","error_code":0,"error_desc":""}


# data hit break
# {"access_token":"5FyVdgkMT8Uazh2YCl7jkQ==","data":"0058DPMB             2540132382          000000000001COMMIT BREAK DP MBANKING                          00000000091581460100000000000003613077000000000000036130770000000000000000000000-0000000000000000000000000000000361307700    000000000000000000001             0110062639          ","access_id":"ALTOMOBIL2","trace_no":"20261007101431638864"}
    data_tes = ("0058DPMB             2540132382          000000000001COMMIT BREAK DP MBANKING                          00000000091581460100000000000003613077000000000000036130770000000000000000000000-0000000000000000000000000000000361307700    000000000000000000001             0110062639          ")
    parse_commit_break_deposito_data(data_tes)
