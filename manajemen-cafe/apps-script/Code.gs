/**
 * GOOGLE APPS SCRIPT - CAFE MANAGEMENT SYSTEM SYNC BACKEND
 * 
 * Skrip ini bertindak sebagai backend alternatif gratis berbasis Google Sheets.
 * Dapat dipublikasikan sebagai Web App ("Deploy as Web App" -> Access: "Anyone").
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "health";
  
  if (action === "health") {
    return createJsonResponse({
      success: true,
      message: "Google Apps Script Cafe Backend Online",
      timestamp: new Date().toISOString()
    });
  }
  
  return createJsonResponse({ success: false, message: "Action tidak dikenal" });
}

function doPost(e) {
  try {
    var rawData = e.postData ? e.postData.contents : "{}";
    var data = JSON.parse(rawData);
    var action = data.action || "sync_batch";
    
    if (action === "sync_batch") {
      return handleSyncBatch(data);
    }
    
    return createJsonResponse({ success: false, message: "Action tidak didukung: " + action });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

function handleSyncBatch(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var items = data.items || [];
  var outletId = data.outletId || "1";
  var acknowledgedIds = [];
  
  var ordersSheet = getOrCreateSheet(ss, "Orders", [
    "Sync ID", "Tanggal", "Outlet ID", "Order Number", "Order Type", "Customer", 
    "Total", "Status", "Metode Bayar", "Item Rincian", "Waktu Sync"
  ]);
  
  var syncLogSheet = getOrCreateSheet(ss, "Sync_Log", [
    "Sync ID", "Entity Type", "Outlet ID", "Action", "Payload Raw", "Waktu Sync"
  ]);
  
  var now = new Date().toISOString();
  
  items.forEach(function(item) {
    var syncId = item.clientSyncId;
    if (!syncId) return;
    
    // Simpan ke log
    syncLogSheet.appendRow([
      syncId,
      item.entityType || "ORDER",
      outletId,
      item.action || "CREATE",
      item.payload || "",
      now
    ]);
    
    // Parse order jika entity ORDER
    if (item.entityType === "ORDER" && item.payload) {
      try {
        var orderObj = JSON.parse(item.payload);
        ordersSheet.appendRow([
          syncId,
          orderObj.createdAt || now,
          outletId,
          orderObj.orderNumber || "",
          orderObj.orderType || "DINE_IN",
          orderObj.customerName || "-",
          orderObj.totalAmount || 0,
          orderObj.status || "PAID",
          orderObj.paymentMethod || "CASH",
          orderObj.itemsSummary || "",
          now
        ]);
      } catch (pErr) {
        // Gagal parse payload spesifik, log tetap tersimpan
      }
    }
    
    acknowledgedIds.push(syncId);
  });
  
  return createJsonResponse({
    success: true,
    message: "Sinkronisasi berhasil dicatat ke Google Sheets",
    totalReceived: items.length,
    totalProcessed: acknowledgedIds.length,
    acknowledgedSyncIds: acknowledgedIds
  });
}

function getOrCreateSheet(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f4f6");
    }
  }
  return sheet;
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
