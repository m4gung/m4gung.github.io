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
      const randomAd = ads.length > 0 ? ads[Math.floor(Math.random() * ads.length)] : null;
      return res({ produk, transaksi, sponsorAd: randomAd });
    }

    // 2. Simpan Transaksi
    if (action === "saveTransaction") {
      const sheet = ss.getSheetByName("Transaksi");
      sheet.appendRow([
        new Date(), data.id_transaksi, data.cabang, 
        data.items, data.total, data.metode, data.pelanggan
      ]);
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

function res(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}