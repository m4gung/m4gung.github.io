/*
  Google Apps Script - Auto Save ke Google Sheets
  ================================================
  
  CARA PENGGUNAAN:
  1. Buka https://script.google.com
  2. Buat project baru
  3. Copy semua kode ini ke Code.gs
  4. Edit SPREADSHEET_ID di bawah dengan ID spreadsheet Anda
  5. Deploy as Web App (Execute as: Me, Who has access: Anyone)
  6. Copy URL Web App dan masukkan ke pengaturan aplikasi
  
  CARA DAPATKAN SPREADSHEET ID:
  - Buka Google Sheets yang ingin digunakan
  - Copy ID dari URL: docs.google.com/spreadsheets/d/INI_ID/edit
  
*/

// PASTE SPREADSHEET ID ANDA DISINI (Contoh: 1abc123...):
var SPREADSHEET_ID = '';  // <-- ISI DISINI

// Sheet names
var SHEET_NAMES = {
  produk: "Produk",
  transaksi: "Transaksi",
  logStok: "Log_Stok"
};

function doGet(e) {
  try {
    Logger.log('Received GET');
    Logger.log('Parameters: ' + JSON.stringify(e.parameter));
    
    var action = e.parameter.action;
    var dataStr = e.parameter.data;
    var spreadsheetId = e.parameter.spreadsheetId;
    
    // Setup action - create new spreadsheet and return ID
    if (action === 'setup') {
      var newSs = SpreadsheetApp.create("Data Penjualan App - " + new Date().getTime());
      
      // Create sheets
      newSs.insertSheet(SHEET_NAMES.produk);
      newSs.insertSheet(SHEET_NAMES.transaksi);
      newSs.insertSheet(SHEET_NAMES.logStok);
      
      return ContentService.createTextOutput(JSON.stringify({ 
        success: true, 
        spreadsheetId: newSs.getId(),
        spreadsheetUrl: newSs.getUrl(),
        message: "Spreadsheet created! ID: " + newSs.getId()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Save actions
    if (action && action.startsWith('save')) {
      var data = [];
      var dataStrRaw = e.parameter.data;
      
      Logger.log('Raw data string length: ' + (dataStrRaw ? dataStrRaw.length : 0));
      
      if (dataStrRaw) {
        try {
          // Decode URL encoding first
          var decoded = decodeURIComponent(dataStrRaw);
          // Then base64 decode
          data = JSON.parse(Utilities.newBlob(Utilities.base64Decode(decoded)).getDataAsString());
          Logger.log('Parsed data count: ' + data.length);
        } catch (e) {
          Logger.log('Data parse error method 1: ' + e.toString());
          
          // Try alternative method
          try {
            data = JSON.parse(decodeURIComponent(escape(Utilities.newBlob(Utilities.base64Decode(dataStrRaw)).getDataAsString())));
            Logger.log('Parsed data count (method 2): ' + data.length);
          } catch (e2) {
            Logger.log('Data parse error method 2: ' + e2.toString());
          }
        }
      }
      
      if (action === 'saveProduk') {
        return saveProduk(data, spreadsheetId);
      } else if (action === 'saveTransaksi') {
        return saveTransaksi(data, spreadsheetId);
      } else if (action === 'saveLogStok') {
        return saveLogStok(data, spreadsheetId);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Unknown action" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log('Error: ' + err.toString());
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    // Log incoming request
    Logger.log('Received POST');
    Logger.log('PostData: ' + e.postData.contents);
    
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    
    Logger.log('Action: ' + action);
    
    if (action === "saveProduk") {
      return saveProduk(data.data);
    } else if (action === "saveTransaksi") {
      return saveTransaksi(data.data);
    } else if (action === "saveLogStok") {
      return saveLogStok(data.data);
    } else if (action === "getAll") {
      return getAllData();
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Unknown action: " + action }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log('Error: ' + err.toString());
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function saveProduk(produkArray, spreadsheetId) {
  try {
    Logger.log('saveProduk called, data: ' + (produkArray ? produkArray.length : 0));
    
    if (!produkArray || produkArray.length === 0) {
      Logger.log('No produk data to save');
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "No data" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var sheet = getOrCreateSheet(SHEET_NAMES.produk, spreadsheetId);
    Logger.log('Sheet: ' + sheet.getName());
    
    // Clear existing data (except header)
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    }
    
    // Header
    var headers = ["id", "nama", "modal_total", "modal_per_pcs", "stok", "harga_jual"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Data
    if (produkArray && produkArray.length > 0) {
      var rows = produkArray.map(function(p) {
        return [
          p.id || "",
          p.nama || "",
          p.modal_total || 0,
          p.modal_per_pcs || 0,
          p.stok || 0,
          p.harga_jual || 0
        ];
      });
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
    
    Logger.log('Produk saved: ' + (produkArray ? produkArray.length : 0) + ' items');
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Produk saved!" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log('Error saving produk: ' + err.toString());
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function saveTransaksi(transaksiArray, spreadsheetId) {
  try {
    var sheet = getOrCreateSheet(SHEET_NAMES.transaksi, spreadsheetId);
    
    // Clear existing data
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    }
    
    // Header
    var headers = ["pembeli", "id_produk", "nama", "harga_modal_per_pcs", "harga_jual_per_pcs", "qty", "total_modal", "total_jual", "laba", "tanggal", "status_pembayaran", "metode_pembayaran"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Data
    if (transaksiArray && transaksiArray.length > 0) {
      var rows = transaksiArray.map(function(t) {
        return [
          t.pembeli || "",
          t.id_produk || "",
          t.nama || "",
          t.harga_modal_per_pcs || 0,
          t.harga_jual_per_pcs || 0,
          t.qty || 0,
          t.total_modal || 0,
          t.total_jual || 0,
          t.laba || 0,
          t.tanggal || "",
          t.status_pembayaran || "",
          t.metode_pembayaran || ""
        ];
      });
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
    
    Logger.log('Transaksi saved: ' + (transaksiArray ? transaksiArray.length : 0) + ' items');
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Transaksi saved!" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log('Error saving transaksi: ' + err.toString());
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function saveLogStok(logArray, spreadsheetId) {
  try {
    var sheet = getOrCreateSheet(SHEET_NAMES.logStok, spreadsheetId);
    
    // Header
    var headers = ["tanggal", "jenis", "id_produk", "produk", "qty", "stok_awal", "stok_akhir", "keterangan"];
    
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    
    // Append new data
    if (logArray && logArray.length > 0) {
      var rows = logArray.slice(-50).map(function(l) { // Max 50 recent logs
        return [
          l.tanggal || "",
          l.jenis || "",
          l.id_produk || "",
          l.produk || "",
          l.qty || 0,
          l.stok_awal || 0,
          l.stok_akhir || 0,
          l.keterangan || ""
        ];
      });
      var startRow = sheet.getLastRow() + 1;
      sheet.getRange(startRow, 1, rows.length, headers.length).setValues(rows);
    }
    
    Logger.log('LogStok saved');
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "LogStok saved!" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log('Error saving logStok: ' + err.toString());
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getAllData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var result = {};
    
    // Get Produk
    var produkSheet = ss.getSheetByName(SHEET_NAMES.produk);
    if (produkSheet && produkSheet.getLastRow() > 1) {
      result.produk = produkSheet.getDataRange().getValues().slice(1).map(function(row) {
        return {
          id: row[0],
          nama: row[1],
          modal_total: row[2],
          modal_per_pcs: row[3],
          stok: row[4],
          harga_jual: row[5]
        };
      });
    } else {
      result.produk = [];
    }
    
    // Get Transaksi
    var trxSheet = ss.getSheetByName(SHEET_NAMES.transaksi);
    if (trxSheet && trxSheet.getLastRow() > 1) {
      result.transaksi = trxSheet.getDataRange().getValues().slice(1).map(function(row) {
        return {
          pembeli: row[0],
          id_produk: row[1],
          nama: row[2],
          harga_modal_per_pcs: row[3],
          harga_jual_per_pcs: row[4],
          qty: row[5],
          total_modal: row[6],
          total_jual: row[7],
          laba: row[8],
          tanggal: row[9],
          status_pembayaran: row[10],
          metode_pembayaran: row[11]
        };
      });
    } else {
      result.transaksi = [];
    }
    
    return JSON.stringify({ success: true, data: result });
  } catch (err) {
    return JSON.stringify({ success: false, message: err.toString() });
  }
}

function getOrCreateSheet(name, spreadsheetId) {
  var ss;
  
  // Use provided spreadsheet ID if available
  if (spreadsheetId && spreadsheetId !== '') {
    try {
      ss = SpreadsheetApp.openById(spreadsheetId);
      Logger.log('Opened spreadsheet by ID: ' + spreadsheetId);
    } catch (e) {
      Logger.log('Error opening spreadsheet by ID: ' + e.toString());
      // Try default ID
      if (SPREADSHEET_ID && SPREADSHEET_ID !== '') {
        try {
          ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        } catch (e2) {
          Logger.log('Error opening default spreadsheet: ' + e2.toString());
          ss = SpreadsheetApp.getActiveSpreadsheet();
        }
      } else {
        ss = SpreadsheetApp.getActiveSpreadsheet();
      }
    }
  } else if (SPREADSHEET_ID && SPREADSHEET_ID !== '') {
    // Use default spreadsheet ID
    try {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }
  } else {
    // Use active spreadsheet or create new one
    ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss || ss.getId() === '') {
      ss = SpreadsheetApp.create("Data Penjualan App");
    }
  }
  
  var sheet = ss.getSheetByName(name);
  
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  
  return sheet;
}

// Setup function to create spreadsheet and return ID
function setupSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (!ss || ss.getId() === '') {
    ss = SpreadsheetApp.create("Data Penjualan App");
  }
  
  // Create sheets
  getOrCreateSheet(SHEET_NAMES.produk);
  getOrCreateSheet(SHEET_NAMES.transaksi);
  getOrCreateSheet(SHEET_NAMES.logStok);
  
  return {
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl()
  };
}
