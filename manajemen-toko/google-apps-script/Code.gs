/**
 * Google Apps Script Backend untuk Aplikasi Manajemen Toko (UMKM)
 * 
 * Script ini bertindak sebagai REST API Serverless gratis untuk Google Sheets.
 * Mendukung pembacaan, penulisan transaksi kasir (POS), mutasi stok, piutang, 
 * penjurnalan akuntansi otomatis, dan pengaturan toko (QRIS statis & Rekening Bank).
 */

const SHEET_NAMES = {
  SETTINGS: 'PENGATURAN',
  PRODUCTS: 'PRODUK',
  CATEGORIES: 'KATEGORI',
  STOCK_MUTATIONS: 'MUTASI_STOK',
  SALES: 'PENJUALAN',
  SALE_ITEMS: 'PENJUALAN_ITEM',
  CUSTOMERS: 'PELANGGAN',
  RECEIVABLES: 'PIUTANG',
  RECEIVABLE_PAYMENTS: 'PIUTANG_BAYAR',
  SUPPLIERS: 'SUPPLIER',
  PURCHASES: 'PEMBELIAN',
  PURCHASE_ITEMS: 'PEMBELIAN_ITEM',
  COA: 'BAGAN_AKUN',
  JOURNAL: 'JURNAL_UMUM'
};

function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function handleRequest(e, method) {
  const lock = LockService.getScriptLock();
  try {
    // Kunci eksekusi selama maksimal 30 detik untuk mencegah race condition konkuren
    lock.waitLock(30000);
    
    initSheetsIfNotExist();
    
    const params = e.parameter || {};
    let body = {};
    if (e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (err) {
        body = {};
      }
    }
    
    const action = params.action || body.action || 'ping';
    let result = { success: true, timestamp: new Date().toISOString() };
    
    switch (action) {
      case 'ping':
        result.message = 'Backend Google Sheets Aktif dan Siap Digunakan!';
        break;
        
      case 'getInitialData':
        result.data = {
          settings: getSettings(),
          categories: getTableData(SHEET_NAMES.CATEGORIES),
          products: getTableData(SHEET_NAMES.PRODUCTS),
          customers: getTableData(SHEET_NAMES.CUSTOMERS),
          coa: getTableData(SHEET_NAMES.COA)
        };
        break;
        
      case 'getProducts':
        result.data = getTableData(SHEET_NAMES.PRODUCTS);
        break;
        
      case 'saveProduct':
        result.data = saveProduct(body.payload);
        break;
        
      case 'deleteProduct':
        result.data = deleteRowById(SHEET_NAMES.PRODUCTS, body.payload.id);
        break;
        
      case 'getCategories':
        result.data = getTableData(SHEET_NAMES.CATEGORIES);
        break;

      case 'saveCategory':
        result.data = saveCategory(body.payload);
        break;

      case 'deleteCategory':
        result.data = deleteRowById(SHEET_NAMES.CATEGORIES, body.payload.id);
        break;

      case 'adjustStock':
        result.data = processStockAdjustment(body.payload);
        break;

      case 'getStockMutations':
        result.data = getStockMutations(body.payload ? body.payload.productId : null);
        break;

      case 'getSuppliers':
        result.data = getTableData(SHEET_NAMES.SUPPLIERS);
        break;

      case 'saveSupplier':
        result.data = saveSupplier(body.payload);
        break;

      case 'deleteSupplier':
        result.data = deleteRowById(SHEET_NAMES.SUPPLIERS, body.payload.id);
        break;

      case 'getPurchases':
        result.data = getPurchasesHistory();
        break;

      case 'createPurchase':
        result.data = processPurchaseCheckout(body.payload);
        break;

      case 'checkoutSale':
        result.data = processSaleCheckout(body.payload);
        break;

      case 'getSalesHistory':
        result.data = getSalesHistory();
        break;

      case 'saveCustomer':
        result.data = saveCustomer(body.payload);
        break;

      case 'getReceivables':
        result.data = getTableData(SHEET_NAMES.RECEIVABLES);
        break;

      case 'payReceivable':
        result.data = processReceivablePayment(body.payload);
        break;

      case 'getAccountingReport':
        result.data = getAccountingReport();
        break;

      case 'saveSettings':
        result.data = saveSettings(body.payload);
        break;

      default:
        result = { success: false, error: 'Aksi tidak dikenal: ' + action };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString(),
      stack: err.stack
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Inisialisasi Tab Sheet & Header Kolom Otomatis
function initSheetsIfNotExist() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const headers = {};
  headers[SHEET_NAMES.SETTINGS] = ['Key', 'Value', 'UpdatedAt'];
  headers[SHEET_NAMES.CATEGORIES] = ['id', 'name', 'createdAt'];
  headers[SHEET_NAMES.PRODUCTS] = ['id', 'sku', 'barcode', 'name', 'category', 'unit', 'costPrice', 'sellingPrice', 'stock', 'minStock', 'updatedAt'];
  headers[SHEET_NAMES.STOCK_MUTATIONS] = ['id', 'date', 'productId', 'productName', 'type', 'quantity', 'referenceNo', 'notes'];
  headers[SHEET_NAMES.SALES] = ['invoiceNo', 'date', 'customerName', 'totalAmount', 'discount', 'finalAmount', 'paymentMethod', 'cashReceived', 'changeAmount', 'paymentStatus', 'notes'];
  headers[SHEET_NAMES.SALE_ITEMS] = ['id', 'invoiceNo', 'productId', 'productName', 'costPrice', 'sellingPrice', 'quantity', 'subtotal'];
  headers[SHEET_NAMES.CUSTOMERS] = ['id', 'name', 'phone', 'address', 'creditLimit', 'currentDebt', 'updatedAt'];
  headers[SHEET_NAMES.RECEIVABLES] = ['id', 'invoiceNo', 'customerId', 'customerName', 'totalAmount', 'paidAmount', 'remainingAmount', 'dueDate', 'status', 'createdAt'];
  headers[SHEET_NAMES.RECEIVABLE_PAYMENTS] = ['id', 'receivableId', 'invoiceNo', 'date', 'amount', 'paymentMethod', 'notes'];
  headers[SHEET_NAMES.SUPPLIERS] = ['id', 'name', 'phone', 'address', 'isActive', 'createdAt'];
  headers[SHEET_NAMES.PURCHASES] = ['id', 'purchaseNo', 'supplierId', 'supplierName', 'date', 'totalAmount', 'paymentMethod', 'paymentStatus', 'dueDate', 'notes'];
  headers[SHEET_NAMES.PURCHASE_ITEMS] = ['id', 'purchaseId', 'productId', 'productName', 'quantity', 'costPrice', 'subtotal'];
  headers[SHEET_NAMES.COA] = ['code', 'name', 'type', 'normalBalance'];
  headers[SHEET_NAMES.JOURNAL] = ['id', 'entryNo', 'date', 'refType', 'refNo', 'accountCode', 'accountName', 'debit', 'credit', 'notes'];
  
  Object.keys(headers).forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(headers[sheetName]);
      sheet.setFrozenRows(1);
      
      // Default Seed untuk Pengaturan
      if (sheetName === SHEET_NAMES.SETTINGS) {
        sheet.appendRow(['store_name', 'Toko Berkah Bersama', new Date().toISOString()]);
        sheet.appendRow(['store_phone', '081234567890', new Date().toISOString()]);
        sheet.appendRow(['store_address', 'Jl. Trans Sulawesi No. 12, Kolaka', new Date().toISOString()]);
        sheet.appendRow(['bank_name', 'BCA', new Date().toISOString()]);
        sheet.appendRow(['bank_account_no', '1234567890', new Date().toISOString()]);
        sheet.appendRow(['bank_account_holder', 'Agung Maulana', new Date().toISOString()]);
        sheet.appendRow(['qris_image_url', '', new Date().toISOString()]);
        sheet.appendRow(['qris_string', '', new Date().toISOString()]);
      }
      
      // Default Seed untuk Bagan Akun (COA)
      if (sheetName === SHEET_NAMES.COA) {
        const defaultCOA = [
          ['1101', 'Kas Toko', 'ASET', 'DEBIT'],
          ['1102', 'Bank', 'ASET', 'DEBIT'],
          ['1103', 'Piutang Usaha', 'ASET', 'DEBIT'],
          ['1201', 'Persediaan Barang Dagang', 'ASET', 'DEBIT'],
          ['2101', 'Utang Usaha', 'KEWAJIBAN', 'KREDIT'],
          ['3101', 'Modal Pemilik', 'EKUITAS', 'KREDIT'],
          ['3201', 'Laba Ditahan', 'EKUITAS', 'KREDIT'],
          ['4101', 'Pendapatan Penjualan', 'PENDAPATAN', 'KREDIT'],
          ['5101', 'Beban Pokok Penjualan (HPP)', 'BEBAN_HPP', 'DEBIT'],
          ['6101', 'Beban Operasional Toko', 'BEBAN_OPERASIONAL', 'DEBIT']
        ];
        defaultCOA.forEach(row => sheet.appendRow(row));
      }
    }
  });
}

function getSettings() {
  const rows = getTableData(SHEET_NAMES.SETTINGS);
  const settings = {};
  rows.forEach(r => {
    if (r.Key) settings[r.Key] = r.Value;
  });
  return settings;
}

function saveSettings(settingsObj) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.SETTINGS);
  const data = sheet.getDataRange().getValues();
  const keys = Object.keys(settingsObj);
  const now = new Date().toISOString();
  
  keys.forEach(k => {
    let found = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === k) {
        sheet.getRange(i + 1, 2).setValue(settingsObj[k]);
        sheet.getRange(i + 1, 3).setValue(now);
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([k, settingsObj[k], now]);
    }
  });
  return getSettings();
}

function getTableData(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  const headers = rows[0];
  const result = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    result.push(obj);
  }
  return result;
}

function saveProduct(product) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.PRODUCTS);
  const data = sheet.getDataRange().getValues();
  const now = new Date().toISOString();
  const id = product.id || 'PRD-' + Utilities.getUuid().substring(0, 8);
  
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id || (product.sku && data[i][1] == product.sku)) {
      rowIndex = i + 1;
      break;
    }
  }
  
  const rowData = [
    id,
    product.sku || '',
    product.barcode || '',
    product.name,
    product.category || 'Umum',
    product.unit || 'Pcs',
    Number(product.costPrice || 0),
    Number(product.sellingPrice || 0),
    Number(product.stock || 0),
    Number(product.minStock || 5),
    now
  ];
  
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  return { id: id, ...product, updatedAt: now };
}

function deleteRowById(sheetName, id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i + 1);
      return { deletedId: id };
    }
  }
  return { error: 'Not found' };
}

// Proses Transaksi Penjualan Lengkap (Kasir, Stok, Piutang, Jurnal Otomatis)
function processSaleCheckout(saleData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const salesSheet = ss.getSheetByName(SHEET_NAMES.SALES);
  const itemsSheet = ss.getSheetByName(SHEET_NAMES.SALE_ITEMS);
  const productSheet = ss.getSheetByName(SHEET_NAMES.PRODUCTS);
  const mutationSheet = ss.getSheetByName(SHEET_NAMES.STOCK_MUTATIONS);
  const journalSheet = ss.getSheetByName(SHEET_NAMES.JOURNAL);
  const receivablesSheet = ss.getSheetByName(SHEET_NAMES.RECEIVABLES);
  const customerSheet = ss.getSheetByName(SHEET_NAMES.CUSTOMERS);
  
  const now = new Date().toISOString();
  const invoiceNo = saleData.invoiceNo || 'INV-' + Utilities.formatDate(new Date(), "GMT+8", "yyyyMMddHHmmss");
  
  let totalCost = 0;
  
  // 1. Catat Barang & Kurangi Stok Produk
  const prodData = productSheet.getDataRange().getValues();
  
  (saleData.items || []).forEach(item => {
    const subtotal = Number(item.sellingPrice) * Number(item.quantity);
    const itemCost = Number(item.costPrice || 0) * Number(item.quantity);
    totalCost += itemCost;
    
    // Simpan Item
    itemsSheet.appendRow([
      'SITM-' + Utilities.getUuid().substring(0, 8),
      invoiceNo,
      item.productId,
      item.productName,
      Number(item.costPrice || 0),
      Number(item.sellingPrice),
      Number(item.quantity),
      subtotal
    ]);
    
    // Cari & Kurangi Stok di Tab Produk
    for (let r = 1; r < prodData.length; r++) {
      if (prodData[r][0] == item.productId) {
        const currentStock = Number(prodData[r][8]);
        const newStock = currentStock - Number(item.quantity);
        productSheet.getRange(r + 1, 9).setValue(newStock);
        productSheet.getRange(r + 1, 11).setValue(now);
        break;
      }
    }
    
    // Catat Mutasi Stok
    mutationSheet.appendRow([
      'MUT-' + Utilities.getUuid().substring(0, 8),
      now,
      item.productId,
      item.productName,
      'OUT_SALE',
      Number(item.quantity),
      invoiceNo,
      'Penjualan kasir'
    ]);
  });
  
  // 2. Simpan Header Penjualan
  salesSheet.appendRow([
    invoiceNo,
    now,
    saleData.customerName || 'Umum',
    Number(saleData.totalAmount || 0),
    Number(saleData.discount || 0),
    Number(saleData.finalAmount || 0),
    saleData.paymentMethod || 'CASH',
    Number(saleData.cashReceived || 0),
    Number(saleData.changeAmount || 0),
    saleData.paymentStatus || 'PAID',
    saleData.notes || ''
  ]);
  
  // 3. Tangani Piutang jika Pembayaran Bertempo (KREDIT)
  if (saleData.paymentMethod === 'CREDIT' || saleData.paymentStatus === 'UNPAID' || saleData.paymentStatus === 'PARTIAL') {
    const remaining = Number(saleData.finalAmount) - Number(saleData.cashReceived || 0);
    const recId = 'REC-' + Utilities.getUuid().substring(0, 8);
    receivablesSheet.appendRow([
      recId,
      invoiceNo,
      saleData.customerId || '',
      saleData.customerName || 'Pelanggan',
      Number(saleData.finalAmount),
      Number(saleData.cashReceived || 0),
      remaining,
      saleData.dueDate || '',
      'ACTIVE',
      now
    ]);
    
    // Tambah currentDebt di Customer
    if (saleData.customerId) {
      const custData = customerSheet.getDataRange().getValues();
      for (let c = 1; c < custData.length; c++) {
        if (custData[c][0] == saleData.customerId) {
          const currentDebt = Number(custData[c][5] || 0);
          customerSheet.getRange(c + 1, 6).setValue(currentDebt + remaining);
          break;
        }
      }
    }
  }
  
  // 4. Jurnal Otomatis Double-Entry (Akuntansi Lengkap)
  const entryNo = 'JRN-' + invoiceNo;
  const finalAmount = Number(saleData.finalAmount);
  
  if (saleData.paymentMethod === 'CASH') {
    // Debet: Kas Toko, Kredit: Pendapatan Penjualan
    journalSheet.appendRow(['J1-' + Utilities.getUuid().substring(0, 6), entryNo, now, 'SALE', invoiceNo, '1101', 'Kas Toko', finalAmount, 0, 'Penerimaan Penjualan Kasir Tunai']);
    journalSheet.appendRow(['J2-' + Utilities.getUuid().substring(0, 6), entryNo, now, 'SALE', invoiceNo, '4101', 'Pendapatan Penjualan', 0, finalAmount, 'Penjualan Barang']);
  } else if (saleData.paymentMethod === 'QRIS' || saleData.paymentMethod === 'TRANSFER') {
    // Debet: Bank, Kredit: Pendapatan Penjualan
    journalSheet.appendRow(['J1-' + Utilities.getUuid().substring(0, 6), entryNo, now, 'SALE', invoiceNo, '1102', 'Bank', finalAmount, 0, 'Penerimaan Penjualan Kasir ' + saleData.paymentMethod]);
    journalSheet.appendRow(['J2-' + Utilities.getUuid().substring(0, 6), entryNo, now, 'SALE', invoiceNo, '4101', 'Pendapatan Penjualan', 0, finalAmount, 'Penjualan Barang']);
  } else if (saleData.paymentMethod === 'CREDIT') {
    // Debet: Piutang Usaha, Kredit: Pendapatan Penjualan
    journalSheet.appendRow(['J1-' + Utilities.getUuid().substring(0, 6), entryNo, now, 'SALE', invoiceNo, '1103', 'Piutang Usaha', finalAmount, 0, 'Penjualan Kredit ke ' + (saleData.customerName || '')]);
    journalSheet.appendRow(['J2-' + Utilities.getUuid().substring(0, 6), entryNo, now, 'SALE', invoiceNo, '4101', 'Pendapatan Penjualan', 0, finalAmount, 'Penjualan Barang']);
  }
  
  // HPP Jurnal: Debet Beban HPP, Kredit Persediaan
  if (totalCost > 0) {
    journalSheet.appendRow(['J3-' + Utilities.getUuid().substring(0, 6), entryNo, now, 'COGS', invoiceNo, '5101', 'Beban Pokok Penjualan (HPP)', totalCost, 0, 'Pengakuan HPP Barang Terjual']);
    journalSheet.appendRow(['J4-' + Utilities.getUuid().substring(0, 6), entryNo, now, 'COGS', invoiceNo, '1201', 'Persediaan Barang Dagang', 0, totalCost, 'Pengurangan Nilai Stok']);
  }
  
  return { invoiceNo: invoiceNo, status: 'SUCCESS', finalAmount: finalAmount, timestamp: now };
}

function processReceivablePayment(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const recSheet = ss.getSheetByName(SHEET_NAMES.RECEIVABLES);
  const paySheet = ss.getSheetByName(SHEET_NAMES.RECEIVABLE_PAYMENTS);
  const journalSheet = ss.getSheetByName(SHEET_NAMES.JOURNAL);
  const custSheet = ss.getSheetByName(SHEET_NAMES.CUSTOMERS);
  
  const now = new Date().toISOString();
  const paymentAmount = Number(payload.amount);
  const recId = payload.receivableId;
  
  const recData = recSheet.getDataRange().getValues();
  let remainingAfter = 0;
  let customerId = '';
  let invoiceNo = '';
  
  for (let i = 1; i < recData.length; i++) {
    if (recData[i][0] == recId) {
      invoiceNo = recData[i][1];
      customerId = recData[i][2];
      const currentPaid = Number(recData[i][5] || 0) + paymentAmount;
      remainingAfter = Number(recData[i][4]) - currentPaid;
      
      recSheet.getRange(i + 1, 6).setValue(currentPaid);
      recSheet.getRange(i + 1, 7).setValue(remainingAfter);
      if (remainingAfter <= 0) {
        recSheet.getRange(i + 1, 9).setValue('PAID');
      }
      break;
    }
  }
  
  // Simpan Riwayat Cicilan
  paySheet.appendRow([
    'PAY-' + Utilities.getUuid().substring(0, 8),
    recId,
    invoiceNo,
    now,
    paymentAmount,
    payload.paymentMethod || 'CASH',
    payload.notes || 'Cicilan Piutang'
  ]);
  
  // Kurangi currentDebt Customer
  if (customerId) {
    const cData = custSheet.getDataRange().getValues();
    for (let c = 1; c < cData.length; c++) {
      if (cData[c][0] == customerId) {
        const cur = Number(cData[c][5] || 0);
        custSheet.getRange(c + 1, 6).setValue(Math.max(0, cur - paymentAmount));
        break;
      }
    }
  }
  
  // Jurnal Pelunasan Piutang
  const entryNo = 'JRN-PAY-' + recId;
  const debitAccount = (payload.paymentMethod === 'TRANSFER' || payload.paymentMethod === 'QRIS') ? '1102' : '1101';
  const debitAccountName = (payload.paymentMethod === 'TRANSFER' || payload.paymentMethod === 'QRIS') ? 'Bank' : 'Kas Toko';
  
  journalSheet.appendRow(['JP1-' + Utilities.getUuid().substring(0, 6), entryNo, now, 'PAYMENT', recId, debitAccount, debitAccountName, paymentAmount, 0, 'Penerimaan Pelunasan Piutang ' + invoiceNo]);
  journalSheet.appendRow(['JP2-' + Utilities.getUuid().substring(0, 6), entryNo, now, 'PAYMENT', recId, '1103', 'Piutang Usaha', 0, paymentAmount, 'Pengurangan Piutang ' + invoiceNo]);
  
  return { success: true, remainingAmount: remainingAfter };
}

function saveCustomer(customer) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.CUSTOMERS);
  const data = sheet.getDataRange().getValues();
  const now = new Date().toISOString();
  const id = customer.id || 'CUST-' + Utilities.getUuid().substring(0, 8);
  
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      rowIndex = i + 1;
      break;
    }
  }
  
  const rowData = [
    id,
    customer.name,
    customer.phone || '',
    customer.address || '',
    Number(customer.creditLimit || 5000000),
    Number(customer.currentDebt || 0),
    now
  ];
  
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  return { id: id, ...customer };
}

function getSalesHistory() {
  const sales = getTableData(SHEET_NAMES.SALES);
  const items = getTableData(SHEET_NAMES.SALE_ITEMS);
  return { sales: sales, items: items };
}

function getAccountingReport() {
  const journal = getTableData(SHEET_NAMES.JOURNAL);
  const coa = getTableData(SHEET_NAMES.COA);
  return { journal: journal, coa: coa };
}

function saveCategory(cat) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.CATEGORIES);
  const data = sheet.getDataRange().getValues();
  const id = cat.id || 'CAT-' + Utilities.getUuid().substring(0, 8);
  const now = new Date().toISOString();

  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id || data[i][1] == cat.name) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 2).setValue(cat.name);
  } else {
    sheet.appendRow([id, cat.name, now]);
  }
  return { id: id, name: cat.name, createdAt: now };
}

function processStockAdjustment(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const prodSheet = ss.getSheetByName(SHEET_NAMES.PRODUCTS);
  const mutSheet = ss.getSheetByName(SHEET_NAMES.STOCK_MUTATIONS);
  const journalSheet = ss.getSheetByName(SHEET_NAMES.JOURNAL);
  const now = new Date().toISOString();

  const prodData = prodSheet.getDataRange().getValues();
  let found = false;
  let prodName = '';
  let costPrice = 0;
  let oldStock = 0;

  for (let i = 1; i < prodData.length; i++) {
    if (prodData[i][0] == payload.productId) {
      prodName = prodData[i][3];
      costPrice = Number(prodData[i][6] || 0);
      oldStock = Number(prodData[i][8] || 0);
      prodSheet.getRange(i + 1, 9).setValue(payload.newStock);
      prodSheet.getRange(i + 1, 11).setValue(now);
      found = true;
      break;
    }
  }

  if (!found) throw new Error('Produk tidak ditemukan');

  const diff = Number(payload.newStock) - oldStock;
  mutSheet.appendRow([
    'MUT-' + Utilities.getUuid().substring(0, 8),
    now,
    payload.productId,
    prodName,
    'ADJUSTMENT',
    diff,
    'ADJ-' + (payload.reason || 'OPNAME'),
    (payload.reason || 'Penyesuaian Stok') + ': ' + (payload.notes || '')
  ]);

  // Jurnal penyesuaian nilai persediaan
  const diffVal = Math.abs(diff) * costPrice;
  if (diffVal > 0) {
    const entryNo = 'JRN-ADJ-' + Utilities.getUuid().substring(0, 6);
    if (diff < 0) {
      journalSheet.appendRow(['J1-' + Utilities.getUuid().substring(0, 6), entryNo, now, 'ADJUSTMENT', payload.productId, '6101', 'Beban Operasional Toko', diffVal, 0, 'Kerugian Stok (' + payload.reason + ') ' + prodName]);
      journalSheet.appendRow(['J2-' + Utilities.getUuid().substring(0, 6), entryNo, now, 'ADJUSTMENT', payload.productId, '1201', 'Persediaan Barang Dagang', 0, diffVal, 'Penurunan Nilai Persediaan ' + prodName]);
    } else {
      journalSheet.appendRow(['J1-' + Utilities.getUuid().substring(0, 6), entryNo, now, 'ADJUSTMENT', payload.productId, '1201', 'Persediaan Barang Dagang', diffVal, 0, 'Penambahan Nilai Persediaan ' + prodName]);
      journalSheet.appendRow(['J2-' + Utilities.getUuid().substring(0, 6), entryNo, now, 'ADJUSTMENT', payload.productId, '3201', 'Laba Ditahan', 0, diffVal, 'Penyesuaian Stok Masuk ' + prodName]);
    }
  }

  return { success: true, newStock: payload.newStock };
}

function getStockMutations(productId) {
  const all = getTableData(SHEET_NAMES.STOCK_MUTATIONS);
  if (productId) {
    return all.filter(function(m) { return m.productId == productId; });
  }
  return all;
}

function saveSupplier(supp) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.SUPPLIERS);
  const data = sheet.getDataRange().getValues();
  const id = supp.id || 'SUP-' + Utilities.getUuid().substring(0, 8);
  const now = new Date().toISOString();

  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      rowIndex = i + 1;
      break;
    }
  }

  const rowData = [
    id,
    supp.name || 'Supplier Baru',
    supp.phone || '',
    supp.address || '',
    supp.isActive !== undefined ? supp.isActive : true,
    now
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  return { id: id, ...supp, createdAt: now };
}

function getPurchasesHistory() {
  return getTableData(SHEET_NAMES.PURCHASES);
}

function processPurchaseCheckout(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const purSheet = ss.getSheetByName(SHEET_NAMES.PURCHASES);
  const itemsSheet = ss.getSheetByName(SHEET_NAMES.PURCHASE_ITEMS);
  const prodSheet = ss.getSheetByName(SHEET_NAMES.PRODUCTS);
  const mutSheet = ss.getSheetByName(SHEET_NAMES.STOCK_MUTATIONS);
  const journalSheet = ss.getSheetByName(SHEET_NAMES.JOURNAL);
  const now = new Date().toISOString();

  const purchaseNo = payload.purchaseNo || 'PO-' + Utilities.formatDate(new Date(), "GMT+8", "yyyyMMddHHmmss");
  const purchaseId = 'PUR-' + Utilities.getUuid().substring(0, 8);
  let totalAmount = 0;

  const prodData = prodSheet.getDataRange().getValues();

  (payload.items || []).forEach(item => {
    const cost = Number(item.costPrice);
    const qty = Number(item.quantity);
    const subtotal = cost * qty;
    totalAmount += subtotal;

    itemsSheet.appendRow([
      'PITM-' + Utilities.getUuid().substring(0, 8),
      purchaseId,
      item.productId,
      item.productName,
      qty,
      cost,
      subtotal
    ]);

    // Tambah stok di Tab Produk & Update Modal Terbaru
    for (let r = 1; r < prodData.length; r++) {
      if (prodData[r][0] == item.productId) {
        const currentStock = Number(prodData[r][8]);
        prodSheet.getRange(r + 1, 9).setValue(currentStock + qty);
        if (cost > 0) {
          prodSheet.getRange(r + 1, 7).setValue(cost);
        }
        prodSheet.getRange(r + 1, 11).setValue(now);
        break;
      }
    }

    // Catat Mutasi Masuk
    mutSheet.appendRow([
      'MUT-' + Utilities.getUuid().substring(0, 8),
      now,
      item.productId,
      item.productName,
      'IN_PURCHASE',
      qty,
      purchaseNo,
      'Pengadaan barang dari ' + (payload.supplierName || 'Supplier')
    ]);
  });

  // Simpan Header Pembelian
  purSheet.appendRow([
    purchaseId,
    purchaseNo,
    payload.supplierId || '',
    payload.supplierName || 'Supplier',
    now,
    totalAmount,
    payload.paymentMethod || 'CASH',
    payload.paymentStatus || 'PAID',
    payload.dueDate || '',
    payload.notes || ''
  ]);

  // Jurnal Pembelian Otomatis
  const entryNo = 'JRN-' + purchaseNo;
  const creditAccount = payload.paymentMethod === 'CASH' ? '1101' : (payload.paymentMethod === 'TRANSFER' ? '1102' : '2101');
  const creditName = payload.paymentMethod === 'CASH' ? 'Kas Toko' : (payload.paymentMethod === 'TRANSFER' ? 'Bank' : 'Utang Usaha');

  journalSheet.appendRow(['J1-' + Utilities.getUuid().substring(0, 6), entryNo, now, 'PURCHASE', purchaseNo, '1201', 'Persediaan Barang Dagang', totalAmount, 0, 'Pengadaan barang dari ' + payload.supplierName]);
  journalSheet.appendRow(['J2-' + Utilities.getUuid().substring(0, 6), entryNo, now, 'PURCHASE', purchaseNo, creditAccount, creditName, 0, totalAmount, 'Pembayaran/Utang ' + purchaseNo]);

  return { purchaseNo: purchaseNo, success: true };
}
