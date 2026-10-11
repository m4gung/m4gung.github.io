/**
 * Google Apps Script Web App Endpoint untuk Barbershop Management System
 * Cara Penggunaan:
 * 1. Buka Google Sheets baru di https://sheets.google.com
 * 2. Klik menu 'Extensions' -> 'Apps Script'
 * 3. Hapus kode default, lalu Paste seluruh isi file ini ke file 'Code.gs'
 * 4. Klik tombol 'Deploy' -> 'New deployment' -> Pilih type 'Web app'
 *    - Execute as: 'Me'
 *    - Who has access: 'Anyone' (atau dengan token rahasia)
 * 5. Salin URL Web App yang dihasilkan, lalu masukkan ke menu Pengaturan di aplikasi Barbershop.
 */

const SHEET_NAMES = {
  SETTINGS: 'Settings',
  SERVICES: 'Services',
  PRODUCTS: 'Products',
  BARBERS: 'Barbers',
  CUSTOMERS: 'Customers',
  ATTENDANCES: 'Attendances',
  STAFF_ALLOWANCES: 'StaffAllowances',
  TRANSACTIONS: 'Transactions',
  EXPENSES: 'Expenses'
};

function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function handleRequest(e, method) {
  const lock = LockService.getScriptLock();
  lock.tryLock(30000); // 30 detik lock untuk mencegah race condition

  try {
    initSheetsIfNeeded();
    let action = '';
    let payload = {};

    if (method === 'GET') {
      action = e && e.parameter ? e.parameter.action : 'ping';
      payload = e && e.parameter ? e.parameter : {};
    } else {
      if (e && e.postData && e.postData.contents) {
        try {
          const body = JSON.parse(e.postData.contents);
          action = body.action || '';
          payload = body.payload || body;
        } catch (err) {
          action = e.parameter ? e.parameter.action : '';
          payload = e.parameter || {};
        }
      }
    }

    let result = {};

    switch (action) {
      case 'ping':
        result = { status: 'success', message: 'Koneksi ke Google Spreadsheet berhasil!', timestamp: new Date().toISOString() };
        break;

      case 'sync_all':
        result = handleSyncAll(payload);
        break;

      case 'get_all_data':
        result = handleGetAllData();
        break;

      case 'create_transaction':
        result = handleCreateTransaction(payload);
        break;

      case 'create_attendance':
        result = handleCreateAttendance(payload);
        break;

      case 'update_stock':
        result = handleUpdateStock(payload);
        break;

      default:
        result = { status: 'error', message: 'Aksi tidak dikenal: ' + action };
        break;
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function initSheetsIfNeeded() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const schemas = {
    [SHEET_NAMES.SETTINGS]: ['key', 'value', 'updated_at'],
    [SHEET_NAMES.SERVICES]: ['id', 'name', 'category', 'price', 'duration_minutes', 'is_active', 'updated_at'],
    [SHEET_NAMES.PRODUCTS]: ['id', 'sku', 'name', 'category', 'cost_price', 'selling_price', 'stock', 'min_stock', 'is_active', 'updated_at'],
    [SHEET_NAMES.BARBERS]: ['id', 'name', 'phone', 'commission_type', 'commission_value', 'daily_meal_allowance', 'is_active', 'updated_at'],
    [SHEET_NAMES.CUSTOMERS]: ['id', 'name', 'phone', 'haircut_notes', 'total_visits', 'total_spent', 'last_visit_at', 'created_at'],
    [SHEET_NAMES.ATTENDANCES]: ['id', 'barber_id', 'barber_name', 'date', 'check_in_time', 'check_out_time', 'status', 'meal_allowance_granted', 'notes', 'created_at'],
    [SHEET_NAMES.STAFF_ALLOWANCES]: ['id', 'barber_id', 'barber_name', 'date', 'type', 'amount', 'notes', 'created_at'],
    [SHEET_NAMES.TRANSACTIONS]: ['id', 'idempotency_key', 'invoice_number', 'created_at', 'customer_name', 'customer_phone', 'cashier_name', 'items_summary', 'subtotal', 'discount', 'total_amount', 'payment_method', 'status', 'raw_items_json'],
    [SHEET_NAMES.EXPENSES]: ['id', 'date', 'category', 'amount', 'description', 'recorded_by', 'created_at']
  };

  for (const sheetName in schemas) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(schemas[sheetName]);
      sheet.setFrozenRows(1);
    }
  }
}

function handleGetAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = {};

  for (const key in SHEET_NAMES) {
    const sheetName = SHEET_NAMES[key];
    const sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      const rows = sheet.getDataRange().getValues();
      if (rows.length > 1) {
        const headers = rows[0];
        const items = [];
        for (let i = 1; i < rows.length; i++) {
          const item = {};
          for (let j = 0; j < headers.length; j++) {
            item[headers[j]] = rows[i][j];
          }
          items.push(item);
        }
        data[sheetName] = items;
      } else {
        data[sheetName] = [];
      }
    }
  }

  return { status: 'success', data: data };
}

function handleCreateTransaction(tx) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.TRANSACTIONS);

  // Cek apakah invoice_number atau idempotency_key sudah pernah ada (mencegah duplikasi)
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === tx.id || rows[i][1] === tx.idempotency_key || rows[i][2] === tx.invoice_number) {
      return { status: 'success', message: 'Transaksi sudah ada sebelumnya (idempotent)', id: tx.id };
    }
  }

  const itemsSummary = (tx.items || []).map(function(it) {
    return (it.quantity || 1) + 'x ' + (it.name || it.item_name_snapshot) + ' (@' + (it.price || it.price_snapshot) + ')';
  }).join(', ');

  sheet.appendRow([
    tx.id || Utilities.getUuid(),
    tx.idempotency_key || '',
    tx.invoice_number || '',
    tx.created_at || new Date().toISOString(),
    tx.customer_name || 'Pelanggan Umum',
    tx.customer_phone || '-',
    tx.cashier_name || 'Kasir',
    itemsSummary,
    tx.subtotal || 0,
    tx.discount_amount || 0,
    tx.total_amount || 0,
    tx.payment_method || 'TUNAI',
    tx.status || 'COMPLETED',
    JSON.stringify(tx.items || [])
  ]);

  return { status: 'success', message: 'Transaksi berhasil disimpan', id: tx.id };
}

function handleCreateAttendance(att) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.ATTENDANCES);

  // Cek apakah id atau (barber_id + date) sudah ada
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === att.id || (rows[i][1] === att.barber_id && rows[i][3] === att.date)) {
      // Update baris jika sudah ada
      sheet.getRange(i + 1, 5, 1, 5).setValues([[
        att.check_in_time || '',
        att.check_out_time || '',
        att.status || 'PRESENT',
        att.meal_allowance_granted ? true : false,
        att.notes || ''
      ]]);
      return { status: 'success', message: 'Absensi diperbarui', id: att.id };
    }
  }

  sheet.appendRow([
    att.id || Utilities.getUuid(),
    att.barber_id,
    att.barber_name || '-',
    att.date,
    att.check_in_time || '',
    att.check_out_time || '',
    att.status || 'PRESENT',
    att.meal_allowance_granted ? true : false,
    att.notes || '',
    new Date().toISOString()
  ]);

  return { status: 'success', message: 'Absensi berhasil dicatat', id: att.id };
}

function handleSyncAll(payload) {
  const results = {
    transactions_synced: 0,
    attendances_synced: 0,
    customers_synced: 0
  };

  if (payload.transactions && Array.isArray(payload.transactions)) {
    for (let i = 0; i < payload.transactions.length; i++) {
      handleCreateTransaction(payload.transactions[i]);
      results.transactions_synced++;
    }
  }

  if (payload.attendances && Array.isArray(payload.attendances)) {
    for (let i = 0; i < payload.attendances.length; i++) {
      handleCreateAttendance(payload.attendances[i]);
      results.attendances_synced++;
    }
  }

  return { status: 'success', results: results, message: 'Sinkronisasi selesai' };
}
