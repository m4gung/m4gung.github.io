function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    // 1. Ambil Data Awal (Produk, Iklan & Transaksi)
    if (action === "getInitialData") {
      const produk = getRows(ss, "Produk").filter(p => p.cabang == data.branch);
      const transaksi = getRows(ss, "Transaksi").filter(t => t.cabang == data.branch);
      const ads = getRows(ss, "SponsorAds");
      return res({ produk, transaksi, sponsorAds: ads });
    }

    // 2. Simpan/Update Transaksi (upsert by id_transaksi) & Update Laporan Otomatis
    if (action === "saveTransaction") {
      const sheet = ss.getSheetByName("Transaksi");
      const values = sheet.getDataRange().getValues();
      let headers = values[0] || [];
      const newCols = ['cash', 'qris', 'tip', 'kembalian'];
      
      if (headers.length > 0) {
        let headerChanged = false;
        newCols.forEach(col => {
          if (!headers.includes(col)) {
             headers.push(col);
             headerChanged = true;
          }
        });
        if (headerChanged) {
           sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        }
      } else {
        headers = ['waktu','id_transaksi','cabang','items','total','cash','qris','tip','kembalian','metode','pelanggan','karyawan','keterangan','status'];
        sheet.getRange(1,1,1,headers.length).setValues([headers]);
      }
      
      let rowIndex = -1;
      for (let i = 1; i < values.length; i++) {
        if (values[i][headers.indexOf('id_transaksi')] == data.id_transaksi) { rowIndex = i + 1; break; }
      }
      const rowData = headers.map(h => {
        if (h === 'waktu') return new Date(data.waktu || new Date());
        return data[h] !== undefined ? data[h] : '';
      });
      if (rowIndex > 0) {
        sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
      }

      // --- OTOMATIS UPDATE SHEET LAPORAN ---
      const reportSheet = ss.getSheetByName("Laporan");
      if (reportSheet) {
        const reportData = reportSheet.getDataRange().getValues();
        
        // Hapus rincian lama untuk ID transaksi ini agar tidak duplikat saat update
        for (let i = reportData.length - 1; i >= 1; i--) {
          if (reportData[i][6] == data.id_transaksi) { // Kolom 6 adalah id_transaksi di Laporan
            reportSheet.deleteRow(i + 1);
          }
        }
        
        // Tambah rincian baru berdasarkan items
        const items = JSON.parse(data.items);
        const waktuStr = data.waktu ? new Date(data.waktu).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        
        items.forEach(it => {
          const komisiTotal = Number(it.komisi_barber || 0) * Number(it.qty || 0);
          reportSheet.appendRow([
            waktuStr,
            data.karyawan || "",
            komisiTotal,
            (it.jenis || "BARBER").toUpperCase(),
            Number(it.komisi_barber || 0),
            data.cabang || "",
            data.id_transaksi
          ]);
        });
      }

      return res({ status: "success" });
    }

    // 3. Tambah/Update Produk
    if (action === "upsertProduct") {
      const sheet = ss.getSheetByName("Produk");
      const rows = sheet.getDataRange().getValues();
      const headers = rows.shift();
      let rowIndex = -1;

      for (let i = 0; i < rows.length; i++) {
        if (rows[i][0] == data.id) { rowIndex = i + 2; break; }
      }

      const rowData = headers.map(h => data[h] || "");
      if (rowIndex > 0) {
        sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
      }
      return res({ status: "success" });
    }

    // 4. Hapus Produk
    if (action === "deleteProduct") {
      const sheet = ss.getSheetByName("Produk");
      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] == data.id) { sheet.deleteRow(i + 1); break; }
      }
      return res({ status: "success" });
    }

    // 5. Upload Laporan
    if (action === "uploadLaporan") {
      uploadLaporan_(ss, data.branch, data.rows || []);
      return res({ status: "success" });
    }

  } catch (f) {
    return res({ status: "error", message: f.toString() });
  } finally {
    lock.releaseLock();
  }
}

function getRows(ss, name) {
  const sheet = ss.getSheetByName(name);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const tz = ss.getSpreadsheetTimeZone();

  return data.map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      let val = row[i];
      // Jika objek Date, ubah ke ISO agar browser paham
      if (val instanceof Date) {
        val = val.toISOString();
      }
      obj[h] = val;
    });
    return obj;
  });
}

function ensureHeaders(sheet, required) {
  const rng = sheet.getDataRange();
  const values = rng.getValues();
  const headers = values.length ? values[0] : [];
  if (headers.length === 0) {
    sheet.getRange(1,1,1,required.length).setValues([required]);
    return required;
  }
  return headers;
}

function findRowIndexById(sheet, idHeader, idValue) {
  const values = sheet.getDataRange().getValues();
  if (!values.length) return -1;
  const headers = values[0];
  const idx = headers.indexOf(idHeader);
  if (idx === -1) return -1;
  for (let i = 1; i < values.length; i++) {
    if (values[i][idx] == idValue) return i + 1;
  }
  return -1;
}

// Upload Laporan (append rows)
function uploadLaporan_(ss, branch, rows) {
  const sheet = ss.getSheetByName('Laporan') || ss.insertSheet('Laporan');
  const headers = ensureHeaders(sheet, ['waktu','karyawan','komisi','jenis_komisi','komisi_barber','cabang','id_transaksi']);
  if (!rows || !rows.length) return;
  const dataRows = rows.map(r => headers.map(h => {
    if (h === 'waktu') return new Date(r.waktu);
    return r[h] !== undefined ? r[h] : '';
  }));
  sheet.getRange(sheet.getLastRow()+1, 1, dataRows.length, headers.length).setValues(dataRows);
}

function res(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
