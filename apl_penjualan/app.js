/* ===========================================================
   GOOGLE SHEETS CONFIGURATION
   =========================================================== */
// Replace with your Google Sheets configuration
// Option 1: Use Google Sheets API (requires API key)
// Option 2: Use public sheet CSV export URL
const SHEET_CONFIG = {
  // Your Google Sheets Spreadsheet ID (from URL)
  spreadsheetId: '1061LUKUjj9rzcLlyXSVGzxG-jx1gsQZLtzVOmT5LX0U',
  
  // Sheet names in your spreadsheet
  sheets: {
    produk: 'Produk',
    transaksi: 'Transaksi',
    logStok: 'Log_Stok'
  },
  
  // API Key (get from Google Cloud Console) - Optional for public sheets
  apiKey: 'YOUR_API_KEY',
  
  // Mode: 'api' or 'csv'
  mode: 'csv'
};

// State
var isOnline = navigator.onLine;
var syncStatus = document.createElement('div');
syncStatus.className = 'position-fixed top-0 end-0 m-3 alert alert-info';
syncStatus.style.zIndex = '9999';
syncStatus.style.display = 'none';
document.body.appendChild(syncStatus);

function showSyncStatus(message, type = 'info') {
  syncStatus.className = 'position-fixed top-0 end-0 m-3 alert alert-' + type;
  syncStatus.textContent = message;
  syncStatus.style.display = 'block';
  setTimeout(() => {
    syncStatus.style.display = 'none';
  }, 3000);
}

// Network status listener
window.addEventListener('online', function() {
  isOnline = true;
  showSyncStatus('Koneksi online - Menyinkronkan data...', 'success');
  syncToGoogleSheets();
});

window.addEventListener('offline', function() {
  isOnline = false;
  showSyncStatus('Koneksi offline - Data disimpan lokal', 'warning');
});

/* ===========================================================
   GOOGLE SHEETS FUNCTIONS
   =========================================================== */
async function loadFromGoogleSheets(sheetName) {
  if (SHEET_CONFIG.mode === 'csv') {
    // Use CSV export - simpler, no API key needed for public sheets
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_CONFIG.spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
    try {
      const response = await fetch(url);
      const text = await response.text();
      return parseCSV(text);
    } catch (e) {
      console.error('Error loading from Google Sheets:', e);
      return null;
    }
  } else {
    // Use Google Sheets API
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_CONFIG.spreadsheetId}/values/${sheetName}?key=${SHEET_CONFIG.apiKey}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      return parseSheetData(data);
    } catch (e) {
      console.error('Error loading from Google Sheets API:', e);
      return null;
    }
  }
}

/* ===========================================================
   GOOGLE APPS SCRIPT - AUTO SAVE
   =========================================================== */
var GAS_URL = 'https://script.google.com/macros/s/AKfycbxUbQULF0RI2XZN-OOLMo5vp9dBfbdfmHVuOp4pPCi5AdQ6OwuesPhAW_egeYy5DfvV/exec'; // Will be set from settings

function setGasUrl(url) {
  localStorage.setItem('gasWebAppUrl', url);
  GAS_URL = url;
}

function getGasUrl() {
  if (!GAS_URL) {
    GAS_URL = localStorage.getItem('gasWebAppUrl') || '';
  }
  return GAS_URL;
}

async function saveToGoogleSheets(type, data) {
  const gasUrl = getGasUrl();
  const spreadsheetId = localStorage.getItem('sheetSpreadsheetId') || '';
  
  console.log('=== AUTO-SAVE ===');
  console.log('Type:', type);
  console.log('Data:', data);
  console.log('URL:', gasUrl);
  console.log('Sheet ID:', spreadsheetId);
  
  if (!gasUrl) {
    showSyncStatus('GAS URL belum diatur!', 'warning');
    return;
  }
  
  if (!isOnline) {
    showSyncStatus('Offline - tidak bisa simpan', 'warning');
    return;
  }
  
  // Debug: Check if data is valid
  if (!data || data.length === 0) {
    console.log('No data to save');
    showSyncStatus('Tidak ada data!', 'warning');
    return;
  }
  
  // Encode - use encodeURIComponent instead of btoa for better compatibility
  const encodedData = encodeURIComponent(JSON.stringify(data));
  
  // Build URL - add ? if not present
  let url = gasUrl;
  if (url.indexOf('?') === -1) {
    url += '?';
  } else {
    url += '&';
  }
  url += 'action=save' + type + '&data=' + encodedData;
  
  if (spreadsheetId) {
    url += '&spreadsheetId=' + spreadsheetId;
  }
  
  console.log('Full URL:', url);
  
  try {
    await fetch(url, {
      method: 'GET',
      mode: 'no-cors'
    });
    
    console.log('Request sent successfully');
    showSyncStatus(type + ' dikirim!', 'success');
  } catch (e) {
    console.error('Error:', e);
    showSyncStatus('Error: ' + e.message, 'danger');
  }
}

async function autoSyncProduk() {
  const produk = load('produk');
  await saveToGoogleSheets('Produk', produk);
}

async function autoSyncTransaksi() {
  const trx = load('transaksi');
  await saveToGoogleSheets('Transaksi', trx);
}

async function autoSyncLogStok() {
  const logs = load('log_stok');
  await saveToGoogleSheets('LogStok', logs);
}

// Auto-save all data
async function autoSaveAll() {
  console.log('=== AUTO SAVE ALL ===');
  console.log('GAS URL:', getGasUrl());
  
  if (!isOnline || !getGasUrl()) {
    console.log('Skipped - offline or no URL');
    return;
  }
  
  showSyncStatus('Menyimpan ke Google Sheets...', 'info');
  
  await Promise.all([
    autoSyncProduk(),
    autoSyncTransaksi(),
    autoSyncLogStok()
  ]);
  
  showSyncStatus('Tersimpan ke Google Sheets!', 'success');
}

/* ===========================================================
   MANUAL SYNC - COPY TO CLIPBOARD FOR GOOGLE SHEETS
   =========================================================== */
async function syncAllDataToGoogleSheets() {
  if (!isOnline) {
    alert('Offline! Data disimpan di localStorage. Silakan sync saat online.');
    return;
  }
  
  if (SHEET_CONFIG.spreadsheetId === 'YOUR_SPREADSHEET_ID' || !localStorage.getItem('sheetSpreadsheetId')) {
    alert('Silakan configure Google Sheets ID terlebih dahulu!');
    return;
  }
  
  showSyncStatus('Menyiapkan data untuk di-copy...', 'info');
  
  const produk = load('produk');
  const trx = load('transaksi');
  
  let message = `DATA EXPORT - ${new Date().toLocaleString()}\n\n`;
  message += `PRODUK (${produk.length} items):\n`;
  message += `id,nama,modal_total,modal_per_pcs,stok,harga_jual\n`;
  produk.forEach(p => {
    message += `${p.id},${p.nama},${p.modal_total},${p.modal_per_pcs},${p.stok},${p.harga_jual}\n`;
  });
  
  message += `\nTRANSAKSI (${trx.length} items):\n`;
  message += `pembeli,nama,harga_modal_per_pcs,harga_jual_per_pcs,qty,total_modal,total_jual,laba,status_pembayaran,metode_pembayaran,tanggal\n`;
  trx.forEach(t => {
    message += `${t.pembeli},${t.nama},${t.harga_modal_per_pcs},${t.harga_jual_per_pcs},${t.qty},${t.total_modal},${t.total_jual},${t.laba},${t.status_pembayaran},${t.metode_pembayaran},${t.tanggal}\n`;
  });
  
  try {
    await navigator.clipboard.writeText(message);
    showSyncStatus('Data copied ke clipboard!', 'success');
    
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${SHEET_CONFIG.spreadsheetId}`;
    window.open(sheetUrl, '_blank');
    
    alert('Data telah di-copy ke clipboard!\n\n1. Buka Google Sheets yang muncul\n2. Buat 2 sheet: "Produk" dan "Transaksi"\n3. Paste data di sheet yang sesuai\n\nNote: Auto-save butuh Google Apps Script backend.');
  } catch (e) {
    alert('Gagal copy. Silakan coba lagi.');
  }
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const result = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx];
      });
      result.push(obj);
    }
  }
  return result;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.replace(/"/g, '').trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.replace(/"/g, '').trim());
  return result;
}

function parseSheetData(data) {
  if (!data.values || data.values.length < 2) return [];
  
  const headers = data.values[0];
  const result = [];
  
  for (let i = 1; i < data.values.length; i++) {
    const row = data.values[i];
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx] || '';
    });
    result.push(obj);
  }
  return result;
}

function arrayToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  data.forEach(row => {
    const values = headers.map(h => {
      const val = row[h] || '';
      return val.toString().includes(',') ? `"${val}"` : val;
    });
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
}

async function syncToGoogleSheets() {
  if (!isOnline) {
    console.log('Offline - skipping sync');
    return;
  }
  
  // Save current local data
  saveToLocalStorage();
  showSyncStatus('Data disinkronkan ke Google Sheets!', 'success');
}

function saveToLocalStorage() {
  // Already using localStorage, just ensure it's saved
  console.log('Data saved to localStorage');
}

async function initialSync() {
  if (!isOnline) {
    console.log('Offline - using local data');
    return;
  }
  
  showSyncStatus('Memuat data dari Google Sheets...', 'info');
  
  // Try to load from Google Sheets
  const produkData = await loadFromGoogleSheets(SHEET_CONFIG.sheets.produk);
  if (produkData && produkData.length > 0) {
    save('produk', produkData);
    console.log('Loaded produk from Google Sheets');
  }
  
  const trxData = await loadFromGoogleSheets(SHEET_CONFIG.sheets.transaksi);
  if (trxData && trxData.length > 0) {
    save('transaksi', trxData);
    console.log('Loaded transaksi from Google Sheets');
  }
  
  const logData = await loadFromGoogleSheets(SHEET_CONFIG.sheets.logStok);
  if (logData && logData.length > 0) {
    save('log_stok', logData);
    console.log('Loaded log_stok from Google Sheets');
  }
  
  renderProdukDT();
  renderTransaksiDT();
  renderDropdowns();
  updateReportSummary(load('transaksi'));
  updateChart(load('transaksi'));
  
  showSyncStatus('Data berhasil dimuat!', 'success');
}

/* ===========================================================
   HELPER: LOCALSTORAGE
=========================================================== */
function load(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch (e) {
    return [];
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  console.log('=== SAVE CALLED ===');
  console.log('Key:', key);
  console.log('Data length:', value ? value.length : 0);
  
  // Always show current settings
  console.log('GAS URL:', getGasUrl());
  console.log('Is Online:', isOnline);
  
  // Trigger auto-sync to Google Sheets when online
  if (isOnline) {
    console.log('Calling autoSaveAll...');
    autoSaveAll();
  } else {
    console.log('Skipping sync - offline');
  }
}


/* ===========================================================
   HELPER: FORMAT RUPIAH
=========================================================== */
function formatRupiah(num) {
  if (num == null) return "Rp 0,00";
  num = parseFloat(num);
  if (isNaN(num)) return "Rp 0,00";

  var parts = num.toFixed(2).split(".");
  var angka = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return "Rp " + angka + "," + parts[1];
}


/* ===========================================================
   LOG STOK
=========================================================== */
function logStok(jenis, id_produk, nama, qty, stok_awal, stok_akhir, keterangan) {
  var logs = load("log_stok");
  logs.push({
    tanggal: new Date().toString(),
    jenis: jenis,
    id_produk: id_produk,
    produk: nama,
    qty: qty,
    stok_awal: stok_awal,
    stok_akhir: stok_akhir,
    keterangan: keterangan
  });
  save("log_stok", logs);
}


/* ===========================================================
   MASTER PRODUK
=========================================================== */
function renderProduk() {
  var data = load("produk");
  var tbody = document.getElementById("tabelProduk");
  tbody.innerHTML = "";

	
	
  data.forEach(function (p, i) {
    var tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.nama}</td>
      <td>${formatRupiah(p.modal_total)}</td>
      <td>${formatRupiah(p.modal_per_pcs)}</td>
      <td>${p.stok}</td>
      <td>${formatRupiah(p.harga_jual)}</td>
      <td>
        <button class="btn btn-sm btn-warning" onclick="editProduk(${i})">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="hapusProduk(${i})">Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  renderDropdowns();
	
}

function renderProdukDT() {
  var data = load("produk");

  var formatted = data.map((p,i) => [
    p.id,
    p.nama,
    formatRupiah(p.modal_total),
    formatRupiah(p.modal_per_pcs),
    p.stok,
    formatRupiah(p.harga_jual),
    `
      <button class="btn btn-sm btn-warning" onclick="editProduk('${i}')">Edit</button>
      <button class="btn btn-sm btn-danger" onclick="hapusProduk('${i}')">Hapus</button>
    `
  ]);

	renderDropdowns();  
	
	dtProduk.clear();
  dtProduk.rows.add(formatted);
  dtProduk.draw();
}

function editProduk(i) {
  var p = load("produk")[i];
  id_produk.value = p.id;
  nama_produk.value = p.nama;
  modal_total.value = p.modal_total;
  stok_produk.value = p.stok;
  harga_jual_satuan.value = p.harga_jual;
  modal_per_pcs.value = p.modal_per_pcs;
}

function hapusProduk(i) {
	var p = load("produk")[i];
	
  if (!confirm("Hapus produk \""+p.nama+"\"?")) return;

  var produk = load("produk");
  produk.splice(i, 1);
  save("produk", produk);

  //renderProduk();
	
	
	renderProdukDT();
}

function simpanProduk() {
  var id = id_produk.value.trim();
  var nama = nama_produk.value.trim();
  var modalTotal = parseFloat(modal_total.value) || 0;
  var stok = parseInt(stok_produk.value) || 0;
  var harga = parseFloat(harga_jual_satuan.value) || 0;

  if (!id || !nama || harga <= 0) {
    alert("ID, Nama, Harga wajib diisi!");
    return;
  }

  var modal_per = stok > 0 ? modalTotal / stok : 0;

  var produk = load("produk");
  var idx = produk.findIndex(p => p.id === id);

  var obj = {
    id: id,
    nama: nama,
    modal_total: modalTotal,
    modal_per_pcs: modal_per,
    stok: stok,
    harga_jual: harga
  };

  if (idx >= 0) {
    var p = produk[idx];
    if(stok == 0) obj.modal_per_pcs = p.modal_per_pcs;
  }

  if (idx >= 0) produk[idx] = obj;
  else produk.push(obj);

  save("produk", produk);
  clearProdukForm();
  renderProdukDT();
}

function clearProdukForm() {
  id_produk.value = "";
  nama_produk.value = "";
  modal_total.value = "";
  stok_produk.value = "";
  harga_jual_satuan.value = "";
  modal_per_pcs.value = "";
}

/* ===========================================================
   IMPORT PRODUK (EXCEL) — Trigger via Button Click
=========================================================== */
document.getElementById("btnImportProduk").onclick = function () {
  var file = document.getElementById("importProduk").files[0];

  if (!file) {
    alert("Pilih file Excel produk terlebih dahulu!");
    return;
  }

  var reader = new FileReader();

  reader.onload = function (e) {
    var wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
    var sheet = wb.Sheets[wb.SheetNames[0]];
    var rows = XLSX.utils.sheet_to_json(sheet);

    if (!rows.length) {
      alert("File Excel kosong atau format tidak valid.");
      return;
    }

    var produk = load("produk");

    rows.forEach(r => {
      var id = (r.id || "").toString().trim();
      var nama = (r.nama || "").toString().trim();
      var modal_total = parseFloat(r.modal_total) || 0;
      var stok = parseInt(r.stok) || 0;
      var harga_jual = parseFloat(r.harga_jual) || 0;

      if (!id || !nama) return; // skip baris rusak

      var modal_per = stok > 0 ? (modal_total / stok) : 0;

      // cek data sudah ada?
      var idx = produk.findIndex(p => p.id === id);

      var obj = {
        id: id,
        nama: nama,
        modal_total: modal_total,
        modal_per_pcs: modal_per,
        stok: stok,
        harga_jual: harga_jual
      };

      if (idx >= 0) produk[idx] = obj; 
      else produk.push(obj);
    });

    save("produk", produk);
    renderProduk();
    renderDropdowns();

    alert("Import Produk selesai!");
  };

  reader.readAsArrayBuffer(file);
};

/* ===========================================================
   EXPORT PRODUK (EXCEL)
=========================================================== */
document.getElementById("btnExportProduk").onclick = function () {
  var data = load("produk");

  if (!data.length) {
    alert("Tidak ada data produk untuk diexport!");
    return;
  }

  // Buat worksheet dari JSON
  var ws = XLSX.utils.json_to_sheet(data);

  // Buat workbook baru
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Produk");

  // Export ke file
  XLSX.writeFile(wb, "Data_Produk.xlsx");
};
/* ===========================================================
   DROPDOWN PRODUK (POS + FILTER)
=========================================================== */
function renderDropdowns() {
  var produk = load("produk");

  // POS
  var selPOS = document.getElementById("pilih_produk_cart");
  selPOS.innerHTML = "<option value=''>Pilih...</option>";
  produk.forEach(p => {
    selPOS.innerHTML += `<option value="${p.id}">${p.nama}</option>`;
  });

  // FILTER REPORT
  var selFilter = document.getElementById("filter_produk");
  selFilter.innerHTML = "<option value=''>Semua Produk</option>";
  produk.forEach(p => {
    selFilter.innerHTML += `<option value="${p.id}">${p.nama}</option>`;
  });
}


/* ===========================================================
   POS CART
=========================================================== */
var CART = [];

function addToCart() {
  var pid = pilih_produk_cart.value;
  var harga = parseFloat(harga_cart.value) || 0;
  var qty = parseInt(qty_cart.value) || 0;

  if (!pid || harga <= 0 || qty <= 0) {
    alert("Lengkapi semua kolom cart!");
    return;
  }

  var produk = load("produk").find(p => p.id === pid);

  CART.push({
    id_produk: pid,
    nama: produk.nama,
    harga_jual: harga,
    modal_per_pcs: produk.modal_per_pcs,
    qty: qty
  });

  renderCart();

  pilih_produk_cart.value = "";
  harga_cart.value = "";
  qty_cart.value = "";
}

function renderCart() {
  var tbody = tabelCart;
  tbody.innerHTML = "";

  var subtotal = 0;

  CART.forEach((c, i) => {
    var total = c.harga_jual * c.qty;
    subtotal += total;

    var tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${c.nama}</td>
      <td>${formatRupiah(c.harga_jual)}</td>
      <td>${c.qty}</td>
      <td>${formatRupiah(total)}</td>
      <td><button class="btn btn-sm btn-danger" onclick="hapusCart(${i})">X</button></td>
    `;
    tbody.appendChild(tr);
  });

  cartSubtotal.innerText = formatRupiah(subtotal);
}

function hapusCart(i) {
  CART.splice(i, 1);
  renderCart();
}


/* ===========================================================
   SIMPAN TRANSAKSI DARI CART
=========================================================== */
function simpanTransaksi() {
  if (CART.length === 0) {
    alert("Cart kosong!");
    return;
  }

  var pembeli = pembeli_cart.value.trim();
  if (!pembeli) {
    alert("Nama Pembeli wajib diisi.");
    return;
  }

  var statusBayar = status_bayar_cart.value;
  var metodeBayar = metode_bayar_cart.value;

  var produk = load("produk");
  var trx = load("transaksi");
  var now = new Date().toString();

  // cek stok
  for (let c of CART) {
    let p = produk.find(x => x.id === c.id_produk);
    if (p.stok < c.qty) {
      alert("Stok tidak cukup untuk produk: " + c.nama);
      return;
    }
  }

  // commit transaksi
  CART.forEach(c => {
    var p = produk.find(x => x.id === c.id_produk);

    var stok_awal = p.stok;
    p.stok -= c.qty;

    var total_modal = c.modal_per_pcs * c.qty;
    var total_jual = c.harga_jual * c.qty;

    trx.push({
      pembeli: pembeli,
      id_produk: c.id_produk,
      nama: c.nama,
      harga_modal_per_pcs: c.modal_per_pcs,
      harga_jual_per_pcs: c.harga_jual,
      qty: c.qty,
      total_modal: total_modal,
      total_jual: total_jual,
      laba: total_jual - total_modal,
      tanggal: now,
      status_pembayaran: statusBayar,
      metode_pembayaran: metodeBayar
    });

    logStok("jual", p.id, p.nama, c.qty, stok_awal, p.stok, "POS transaksi");
  });

  save("produk", produk);
  save("transaksi", trx);

  CART = [];
  renderCart();
  pembeli_cart.value = "";

  renderProdukDT();
  renderTransaksiDT();
}
/* ===========================================================
   RENDER TRANSAKSI
=========================================================== */
function renderTransaksi() {
  var trx = load("transaksi");
  var tbody = tabelTransaksi;
  tbody.innerHTML = "";

  trx.forEach(function (t, i) {
    var tr = document.createElement("tr");
    tr.innerHTML = `
		  <td>${i+1}</td>
      <td>${t.pembeli}</td>
      <td>${t.nama}</td>
      <td>${formatRupiah(t.harga_modal_per_pcs)}</td>
      <td>${formatRupiah(t.harga_jual_per_pcs)}</td>
      <td>${t.qty}</td>
      <td>${formatRupiah(t.total_modal)}</td>
      <td>${formatRupiah(t.total_jual)}</td>
      <td>${formatRupiah(t.laba)}</td>
      <td>${t.status_pembayaran}</td>
      <td>${t.metode_pembayaran}</td>
      <td>${formatTanggal(t.tanggal)}</td>
      <td>
        <button class="btn btn-sm btn-warning" onclick="openEdit(${i})">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="hapusTransaksi(${i})">Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderTransaksiDT() {
  var trx = load("transaksi");

  var formatted = trx.map((t, i) => [
    i+1,
		t.pembeli,
    t.nama,
    formatRupiah(t.harga_modal_per_pcs),
    formatRupiah(t.harga_jual_per_pcs),
    t.qty,
    formatRupiah(t.total_modal),
    formatRupiah(t.total_jual),
    formatRupiah(t.laba),
    t.status_pembayaran,
    t.metode_pembayaran,
    formatTanggal(t.tanggal),
    `
      <button class="btn btn-sm btn-warning" onclick="openEdit(${i})">Edit</button>
      <button class="btn btn-sm btn-danger" onclick="hapusTransaksi(${i})">Hapus</button>
    `
  ]);

  dtTransaksi.clear();
  dtTransaksi.rows.add(formatted);
  dtTransaksi.draw();

}

/* ===========================================================
   HAPUS TRANSAKSI + ROLLBACK STOK
=========================================================== */
function hapusTransaksi(i) {
	var trx = load("transaksi");
  var t = trx[i];

	
	  
	if (!confirm("Hapus transaksi \""+t.pembeli+"\" ? Stok produk \""+t.nama+"\" akan kembali.")) return;
  
	var produk = load("produk");
  var p = produk.find(x => x.id === t.id_produk);

  var stok_awal = p.stok;
  p.stok += t.qty;

  logStok("hapus_transaksi", p.id, p.nama, t.qty, stok_awal, p.stok, "Rollback delete transaksi");

  save("produk", produk);
  trx.splice(i, 1);
  save("transaksi", trx);

  renderProdukDT();
  renderTransaksiDT();
}


/* ===========================================================
   EDIT TRANSAKSI — BOOTSTRAP MODAL
=========================================================== */
var editIndex = null;
var editModalEl = new bootstrap.Modal(document.getElementById("editModal"));

function openEdit(i) {
  editIndex = i;
  var trx = load("transaksi")[i];

  // rollback stok dulu
  var produk = load("produk");
  var p = produk.find(x => x.id === trx.id_produk);

  var awal = p.stok;
  p.stok += trx.qty;

  logStok("edit_rollback", p.id, p.nama, trx.qty, awal, p.stok, "Rollback sebelum edit transaksi");

  save("produk", produk);
  renderProduk(); // update halaman

  // isi modal (produk readonly)
  modal_pembeli.value = trx.pembeli;
  modal_produk.value = trx.nama;
  modal_harga.value = trx.harga_jual_per_pcs;
  modal_qty.value = trx.qty;
  modal_status.value = trx.status_pembayaran;
  modal_metode.value = trx.metode_pembayaran;

  editModalEl.show();
}


// =============== Simpan Edit dari Modal ============
document.getElementById("modalSave").onclick = function () {

  // var pembeli = modal_pembeli.value.trim();
  // var harga = parseFloat(modal_harga.value) || 0;
  // var qty = parseInt(modal_qty.value) || 0;
  var status = modal_status.value;
  var metode = modal_metode.value;

  // if (!pembeli || harga <= 0 || qty <= 0) {
  //   alert("Lengkapi semua data edit!");
  //   return;
  // }

  var trx = load("transaksi");
  var row = trx[editIndex];

  // var produk = load("produk");
  // var p = produk.find(x => x.id === row.id_produk);

  // if (p.stok < qty) {
  //   alert("Stok tidak cukup!\nStok sekarang: " + p.stok);
  //   return;
  // }

  // var stok_awal = p.stok;
  // p.stok -= qty;
  // var stok_akhir = p.stok;

  // hitung ulang total
  // var total_modal = p.modal_per_pcs * qty;
  // var total_jual = harga * qty;
  // var laba = total_jual - total_modal;

  // row.pembeli = pembeli;
  // row.harga_jual_per_pcs = harga;
  // row.qty = qty;
  // row.total_modal = total_modal;
  // row.total_jual = total_jual;
  // row.laba = laba;
  // row.tanggal = new Date().toString();
  row.status_pembayaran = status;
  row.metode_pembayaran = metode;

  // save("produk", produk);
  save("transaksi", trx);

  // logStok("edit_transaksi", p.id, p.nama, qty, stok_awal, stok_akhir, "Simpan edit transaksi");

  // renderProdukDT();
  renderTransaksiDT();

  editModalEl.hide();
};



/* ===========================================================
   IMPORT TRANSAKSI (EXCEL)
=========================================================== */
document.getElementById("btnImportTransaksi").onclick = function () {
  var file = importTransaksi.files[0];
  if (!file) return alert("Pilih file transaksi dulu!");

  var reader = new FileReader();

  reader.onload = function (e) {
    var data = new Uint8Array(e.target.result);
    var wb = XLSX.read(data, { type: "array" });
    var sheet = wb.Sheets[wb.SheetNames[0]];
    var rows = XLSX.utils.sheet_to_json(sheet);

    var trx = load("transaksi");

    rows.forEach(r => trx.push(r));

    save("transaksi", trx);
    renderTransaksi();
    
    // Auto sync after import
    setTimeout(() => {
      autoSyncTransaksi();
      alert("Import dan sync selesai!");
    }, 500);
  };

  reader.readAsArrayBuffer(file);
}

/* ===========================================================
   EXPORT TRANSAKSI (EXCEL)
=========================================================== */
document.getElementById("btnExportTransaksi").onclick = function () {
  var trx = load("transaksi");

  if (!trx.length) {
    alert("Tidak ada data transaksi!");
    return;
  }

  var ws = XLSX.utils.json_to_sheet(trx);
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Transaksi");

  XLSX.writeFile(wb, "Data_Transaksi.xlsx");
};



/* ===========================================================
   REPORT FILTER
=========================================================== */
function applyFilter() {
  var mulai = filter_mulai.value;
  var akhir = filter_akhir.value;
  var pid = filter_produk.value;
  var status = filter_status.value;
	var metode = filter_metode.value;

  var trx = load("transaksi");
  var result = [];

  var tsMulai = mulai ? new Date(mulai + " 00:00:00").getTime() : -Infinity;
  var tsAkhir = akhir ? new Date(akhir + " 23:59:59").getTime() : Infinity;

  trx.forEach(t => {
    var time = new Date(t.tanggal).getTime();
    if (time >= tsMulai && time <= tsAkhir) {
    		if (pid && t.id_produk !== pid) return;
			if (status && t.status_pembayaran !== status) return;
			if (metode && t.metode_pembayaran !== metode) return;
    result.push(t);
		}
  });

  updateReportSummary(result);
  updateChart(result);
}

document.getElementById("btnFilter").onclick = applyFilter;

document.getElementById("btnResetFilter").onclick = function () {
  filter_mulai.value = "";
  filter_akhir.value = "";
  filter_produk.value = "";
	filter_status.value = "";
	filter_metode.value = "";

  var trx = load("transaksi");
  updateReportSummary(trx);
  updateChart(trx);
};


/* ===========================================================
   REPORT SUMMARY (Modal / Omzet / Laba)
=========================================================== */
function updateReportSummary(arr) {
  var modal = 0, omzet = 0, laba = 0;

  arr.forEach(t => {
    modal += t.total_modal;
    omzet += t.total_jual;
    laba += t.laba;
  });

  totalModal.innerText = formatRupiah(modal);
  totalOmzet.innerText = formatRupiah(omzet);
  totalLaba.innerText = formatRupiah(laba);
}



/* ===========================================================
   CHART LAPORAN (MODAL, OMZET, LABA)
=========================================================== */
var chart = null;

function updateChart(arr) {
  if (!arr) arr = load("transaksi");

  var modal = 0, omzet = 0, laba = 0;

  arr.forEach(t => {
    modal += t.total_modal;
    omzet += t.total_jual;
    laba += t.laba;
  });

  var ctx = document.getElementById("chartLaporan").getContext("2d");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Total Modal", "Total Omzet", "Total Laba"],
      datasets: [{
        label: "Jumlah (Rp)",
        data: [modal, omzet, laba]
      }]
    }
  });
}

/* ===========================================================
   FORMAT TANGGAL DD/MM/YYYY
=========================================================== */
function formatTanggal(tgl) {
  if (!tgl) return "";
  var d = new Date(tgl);
  if (isNaN(d)) return tgl;

  var hari = String(d.getDate()).padStart(2, '0');
  var bulan = String(d.getMonth() + 1).padStart(2, '0');
  var tahun = d.getFullYear();

  return hari + "/" + bulan + "/" + tahun;
}

function hitungModalPerPCS() {
  var mt = parseFloat(modal_total.value) || 0;
  var st = parseInt(stok_produk.value) || 0;

  if (st > 0) {
    modal_per_pcs.value = (mt / st).toFixed(2);
  }
}

/* ===========================================================
   INITIALIZER
=========================================================== */
window.onload = function () {

  // MASTER PRODUK
  btnSimpanProduk.onclick = simpanProduk;

  // POS CART
  btnAddCart.onclick = addToCart;
  btnSaveCart.onclick = simpanTransaksi;

  // Autofill harga di POS
  pilih_produk_cart.onchange = function () {
    var p = load("produk").find(x => x.id === this.value);
    harga_cart.value = p ? p.harga_jual : "";
  };

  // TRANSAKSI LIST
  renderProduk();
  renderDropdowns();
  renderCart();
  renderTransaksi();

  // REPORT
  updateReportSummary(load("transaksi"));
  updateChart(load("transaksi"));

  modal_total.onkeyup = hitungModalPerPCS;
  stok_produk.onkeyup = hitungModalPerPCS;
  
  // Initial sync from Google Sheets (if configured)
  if (SHEET_CONFIG.spreadsheetId !== 'YOUR_SPREADSHEET_ID') {
    initialSync();
  } else {
    // No Google Sheets configured, just render
    renderProdukDT();
    renderTransaksiDT();
  }
  
  // Load saved settings
  loadSheetSettings();
};

/* ===========================================================
   SETTINGS HANDLERS
=========================================================== */
function loadSheetSettings() {
  const savedId = localStorage.getItem('sheetSpreadsheetId');
  const savedMode = localStorage.getItem('sheetMode');
  const savedApiKey = localStorage.getItem('sheetApiKey');
  const savedGasUrl = localStorage.getItem('gasWebAppUrl');
  
  if (savedId) {
    SHEET_CONFIG.spreadsheetId = savedId;
    document.getElementById('sheetId').value = savedId;
  }
  if (savedMode) {
    SHEET_CONFIG.mode = savedMode;
    document.getElementById('sheetMode').value = savedMode;
  }
  if (savedApiKey) {
    SHEET_CONFIG.apiKey = savedApiKey;
    document.getElementById('sheetApiKey').value = savedApiKey;
  }
  if (savedGasUrl) {
    GAS_URL = savedGasUrl;
    document.getElementById('gasUrl').value = savedGasUrl;
  }
}

document.getElementById('btnSaveSettings').onclick = function() {
  const sheetId = document.getElementById('sheetId').value.trim();
  const sheetMode = document.getElementById('sheetMode').value;
  const sheetApiKey = document.getElementById('sheetApiKey').value.trim();
  const gasUrl = document.getElementById('gasUrl').value.trim();
  
  if (!gasUrl) {
    alert('Masukkan Google Apps Script URL terlebih dahulu!');
    return;
  }
  
  localStorage.setItem('sheetSpreadsheetId', sheetId);
  localStorage.setItem('sheetMode', sheetMode);
  localStorage.setItem('sheetApiKey', sheetApiKey);
  localStorage.setItem('gasWebAppUrl', gasUrl);
  
  SHEET_CONFIG.spreadsheetId = sheetId;
  SHEET_CONFIG.mode = sheetMode;
  SHEET_CONFIG.apiKey = sheetApiKey;
  GAS_URL = gasUrl;
  
  if (sheetMode === 'gas' && gasUrl) {
    alert('Auto-Save aktif!\n\nSetiap kali Anda menambah produk atau transaksi, data akan otomatis tersimpan ke Google Sheets.');
    autoSaveAll();
  } else {
    alert('Pengaturan disimpan! Klik "Test Sync" untuk menguji.');
  }
};

document.getElementById('btnSyncNow').onclick = function() {
  if (SHEET_CONFIG.spreadsheetId === 'YOUR_SPREADSHEET_ID' || !localStorage.getItem('sheetSpreadsheetId')) {
    alert('Silakan masukkan Spreadsheet ID terlebih dahulu!');
    return;
  }
  initialSync();
};

document.getElementById('btnSyncToSheets').onclick = syncAllDataToGoogleSheets;

document.getElementById('btnTestSync').onclick = function() {
  console.log('=== TEST SYNC CLICKED ===');
  console.log('GAS URL:', getGasUrl());
  console.log('Is Online:', isOnline);
  console.log('Produk:', load('produk'));
  console.log('Transaksi:', load('transaksi'));
  
  if (!getGasUrl()) {
    alert('GAS URL belum diatur!\n\n1. Klik Settings\n2. Pilih Mode: Google Apps Script\n3. Masukkan Web App URL\n4. Klik Simpan');
    return;
  }
  
  autoSaveAll();
};

document.getElementById('btnCreateSheet').onclick = async function() {
  const gasUrl = getGasUrl();
  
  if (!gasUrl) {
    alert('Masukkan GAS URL dulu!');
    return;
  }
  
  if (!confirm('Buat spreadsheet baru? Data lama tidak akan dihapus.')) return;
  
  showSyncStatus('Membuat spreadsheet...', 'info');
  
  try {
    const url = gasUrl + '?action=setup';
    await fetch(url, { method: 'GET', mode: 'no-cors' });
    
    // Wait a bit for the sheet to be created
    setTimeout(async () => {
      // Try to get the spreadsheet ID from the response
      try {
        const response = await fetch(gasUrl + '?action=getSpreadsheetId', { method: 'GET', mode: 'no-cors' });
      } catch(e) {}
    }, 2000);
    
    alert('Spreadsheet baru dibuat!\n\nSilakan:\n1. Buka Google Sheets\n2. Copy ID dari URL\n3. Paste di pengaturan app ini\n4. Deploy ulang GAS dengan spreadsheet ID tersebut');
    showSyncStatus('Sheet dibuat!', 'success');
    
    // Open sheets in new tab
    window.open('https://sheet.google.com', '_blank');
  } catch (e) {
    alert('Error: ' + e.message);
  }
};