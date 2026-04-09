/**
 * Apps Script untuk TaniPintar
 * Menangani sinkronisasi data dari PWA ke Google Sheets
 */

function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Simpan Data Transaksi
    if (contents.transactions) {
      const sheetTrans = ss.getSheetByName("transaksi");
      if (sheetTrans) {
        sheetTrans.clearContents();
        sheetTrans.appendRow(["id", "lahanId", "desc", "amount", "type", "date", "syncStatus"]);
        contents.transactions.forEach(t => {
          sheetTrans.appendRow([t.id, t.lahanId, t.desc, t.amount, t.type, t.date, t.syncStatus || 'ok']);
        });
      }
    }

    // 2. Simpan Data Lahan
    if (contents.lahan) {
      const sheetLahan = ss.getSheetByName("lahan");
      if (sheetLahan) {
        sheetLahan.clearContents();
        sheetLahan.appendRow(["id", "nama", "status", "luas", "lokasi"]);
        contents.lahan.forEach(l => {
          sheetLahan.appendRow([l.id, l.nama, l.status, l.luas || '', l.lokasi || '']);
        });
      }
    }

    // 3. Simpan Data Utang
    if (contents.utang) {
      const sheetUtang = ss.getSheetByName("utang");
      if (sheetUtang) {
        sheetUtang.clearContents();
        sheetUtang.appendRow(["id", "nama", "amount", "type", "desc", "status", "date"]);
        contents.utang.forEach(u => {
          sheetUtang.appendRow([u.id, u.nama, u.amount, u.type, u.desc || '', u.status, u.date || '']);
        });
      }
    }

    return ContentService.createTextOutput("Berhasil Sinkronisasi")
      .setMimeType(ContentService.MimeType.TEXT);

  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.message)
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Fitur Force Download (Mengambil data dari Sheet untuk PWA)
  if (action === "get_all") {
    const data = {
      transaksi: getSheetDataAsJson(ss.getSheetByName("transaksi")),
      lahan: getSheetDataAsJson(ss.getSheetByName("lahan")),
      utang: getSheetDataAsJson(ss.getSheetByName("utang"))
    };
    
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Fungsi pembantu untuk konversi baris sheet menjadi JSON object
 */
function getSheetDataAsJson(sheet) {
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const header = data[0];
  const rows = data.slice(1);
  
  return rows.map(row => {
    let obj = {};
    header.forEach((key, i) => {
      obj[key.toString().toLowerCase()] = row[i];
    });
    return obj;
  });
}