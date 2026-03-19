function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  
  // 1. LOGIKA DELETE
  if (data.mode === "DELETE") {
    var rows = sheet.getDataRange().getValues();
    for (var i = rows.length - 1; i >= 1; i--) {
      if (rows[i][0].toString() === data.timestamp) {
        sheet.deleteRow(i + 1);
        break;
      }
    }
    return ContentService.createTextOutput("Deleted").setMimeType(ContentService.MimeType.TEXT);
  }

  // 2. LOGIKA EDIT
  if (data.mode === "EDIT") {
    var rows = sheet.getDataRange().getValues();
    var headers = rows[0];
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0].toString() === data.timestamp) {
        var rowNum = i + 1;
        Object.keys(data.updatedData).forEach(function(key) {
          var colIdx = headers.indexOf(key);
          if (colIdx > -1) {
            sheet.getRange(rowNum, colIdx + 1).setValue(data.updatedData[key]);
          }
        });
        break;
      }
    }
    return ContentService.createTextOutput("Updated").setMimeType(ContentService.MimeType.TEXT);
  }

  // 3. LOGIKA INSERT (DEFAULT)
  var headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0].filter(String);
  if (headers.length === 0) { 
    headers = ["Timestamp"]; 
    sheet.getRange(1, 1).setValue("Timestamp"); 
  }

  // Cek kolom baru
  Object.keys(data).forEach(function(key) {
    if (headers.indexOf(key) === -1 && key !== "mode") {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(key);
      headers.push(key);
    }
  });

  var newRow = headers.map(function(header) {
    if (header === "Timestamp") return data.Timestamp || new Date().toISOString();
    return data[header] || "";
  });

  sheet.appendRow(newRow);
  return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
}

function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}