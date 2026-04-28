/* 
  COPY & PASTE KODE INI KE GOOGLE APPS SCRIPT (script.google.com)
  -------------------------------------------------------------
  1. Buka script.google.com
  2. Buat proyek baru
  3. Ganti semua kode di editor dengan kode di bawah ini
  4. Ganti 'YOUR_SHEET_ID_HERE' dengan ID Google Sheet Anda
  5. Klik 'Deploy' -> 'New Deployment'
  6. Pilih type 'Web App'
  7. Set 'Who has access' ke 'Anyone' (atau 'Anyone with Google account')
  8. Copy Web App URL dan masukkan ke aplikasi Pembukuan.
*/

const SHEET_ID = 'YOUR_SHEET_ID_HERE';

function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const data = {
      petani: getSheetData(ss, 'petani', ['id', 'nama', 'catatan']),
      pengepul: getSheetData(ss, 'pengepul', ['id', 'nama', 'catatan']),
      transaksiPetani: getSheetData(ss, 'transaksi_petani', ['id', 'tanggal', 'petaniId', 'jumlahKarungPanen', 'jumlahPupuk', 'hasilPompaKarung', 'hasilPetaniKarung', 'keterangan']),
      penjualanPengepul: getSheetData(ss, 'penjualan_pengepul', ['id', 'tanggal', 'pengepulId', 'jumlahKarung', 'totalKg', 'hargaPerKg', 'totalHarga', 'statusPembayaran', 'metodePembayaran', 'keterangan']),
      biaya: getSheetData(ss, 'biaya', ['id', 'tanggal', 'kategori', 'deskripsi', 'nominal'])
    };

    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheetData(ss, sheetName, headers) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  const tz = ss.getSpreadsheetTimeZone();
  
  return values.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      let val = row[i];
      // Jika kolom tanggal, paksa format yyyy-MM-dd
      if (header === 'tanggal') {
        if (val instanceof Date) {
          val = Utilities.formatDate(val, tz, "yyyy-MM-dd");
        } else if (typeof val === 'string' && val.trim() !== '') {
          // Coba tangani format dd/mm/yyyy string jika ada
          const parts = val.split('/');
          if (parts.length === 3) {
            const d = parts[0].padStart(2, '0');
            const m = parts[1].padStart(2, '0');
            const y = parts[2];
            val = `${y}-${m}-${d}`;
          }
        }
      }
      obj[header] = val;
    });
    return obj;
  });
}

function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    
    // Update Master Petani
    updateSheet(ss, 'petani', contents.petani, ['id', 'nama', 'catatan']);
    
    // Update Master Pengepul
    updateSheet(ss, 'pengepul', contents.pengepul, ['id', 'nama', 'catatan']);
    
    // Update Transaksi Petani
    updateSheet(ss, 'transaksi_petani', contents.transaksiPetani, ['id', 'tanggal', 'petaniId', 'jumlahKarungPanen', 'jumlahPupuk', 'hasilPompaKarung', 'hasilPetaniKarung', 'keterangan']);
    
    // Update Penjualan Pengepul
    updateSheet(ss, 'penjualan_pengepul', contents.penjualanPengepul, ['id', 'tanggal', 'pengepulId', 'jumlahKarung', 'totalKg', 'hargaPerKg', 'totalHarga', 'statusPembayaran', 'metodePembayaran', 'keterangan']);
    
    // Update Biaya
    updateSheet(ss, 'biaya', contents.biaya, ['id', 'tanggal', 'kategori', 'deskripsi', 'nominal']);

    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function updateSheet(ss, sheetName, data, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
  }
  
  // Clear existing data (optional, but ensures sheet matches app data)
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).clear();
  }
  
  if (data && data.length > 0) {
    const values = data.map(item => headers.map(h => item[h] || ''));
    sheet.getRange(2, 1, values.length, headers.length).setValues(values);
  }
}
