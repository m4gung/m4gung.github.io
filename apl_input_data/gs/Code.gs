function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];

  // 1. CARI INDEX BARIS BERDASARKAN ID
  var idIdx = headers.indexOf("id");
  var rowIndex = -1;
  if (idIdx > -1) {
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][idIdx] == data.id) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  // 2. LOGIKA DELETE
  if (data.mode === "DELETE") {
    if (rowIndex > -1) {
      sheet.deleteRow(rowIndex);
      return ContentService.createTextOutput("Deleted").setMimeType(ContentService.MimeType.TEXT);
    }
  }

  // 3. LOGIKA UPSERT (INSERT atau EDIT)
  if (data.mode === "UPSERT" || data.mode === "INSERT" || !data.mode) {
    // Pastikan header lengkap
    Object.keys(data).forEach(function(key) {
      if (headers.indexOf(key) === -1 && key !== "mode") {
        sheet.getRange(1, sheet.getLastColumn() + 1).setValue(key);
        headers.push(key);
      }
    });

    var rowValues = headers.map(function(h) { return data[h] || ""; });

    if (rowIndex > -1) {
      // Update baris yang ada
      sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      // Tambah baris baru
      sheet.appendRow(rowValues);
    }
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  }
}

function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
