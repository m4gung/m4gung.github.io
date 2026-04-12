/**
 * Apps Script untuk TaniPintar V2
 * Menangani sinkronisasi data dari PWA ke Google Sheets
 */

function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Fungsi pembantu untuk update sheet secara aman
    const updateSheet = (sheetName, header, data, mapper) => {
      let sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }
      sheet.clearContents();
      sheet.appendRow(header);
      
      if (data && data.length > 0) {
        data.forEach(item => {
          sheet.appendRow(mapper(item));
        });
      }
    };

    // 1. Simpan Data Transaksi
    updateSheet("transaksi", ["id", "lahanId", "desc", "amount", "type", "date", "syncStatus"], contents.transactions, t => [
      t.id, t.lahanId, t.desc, t.amount, t.type, t.date, 'ok'
    ]);

    // 2. Simpan Data Lahan
    updateSheet("lahan", ["id", "nama", "status", "luas", "lokasi"], contents.lahan, l => [
      l.id, l.nama, l.status, l.luas || '', l.lokasi || ''
    ]);

    // 3. Simpan Data Utang
    updateSheet("utang", ["id", "nama", "amount", "type", "desc", "status", "date"], contents.utang, u => [
      u.id, u.nama, u.amount, u.type, u.desc || '', u.status, u.date || ''
    ]);

    return ContentService.createTextOutput("Berhasil dicadangkan pada " + new Date().toLocaleString())
      .setMimeType(ContentService.MimeType.TEXT);

  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.message)
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
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

function getSheetDataAsJson(sheet) {
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // Hanya header atau kosong
  
  const header = data[0];
  const rows = data.slice(1);
  
  return rows.map(row => {
    let obj = {};
    header.forEach((key, i) => {
      let val = row[i];
      // Pastikan angka ditangani dengan benar
      if (key === "id" || key === "amount" || key === "lahanId") {
        val = isNaN(val) ? val : Number(val);
      }
      obj[key.toString()] = val;
    });
    return obj;
  });
}