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

function editProduk(i) {
  var p = load("produk")[i];
  id_produk.value = p.id;
  nama_produk.value = p.nama;
  modal_total.value = p.modal_total;
  stok_produk.value = p.stok;
  harga_jual_satuan.value = p.harga_jual;
}

function hapusProduk(i) {
  if (!confirm("Hapus produk ini?")) return;

  var produk = load("produk");
  produk.splice(i, 1);
  save("produk", produk);

  renderProduk();
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

  if (idx >= 0) produk[idx] = obj;
  else produk.push(obj);

  save("produk", produk);
  clearProdukForm();
  renderProduk();
}

function clearProdukForm() {
  id_produk.value = "";
  nama_produk.value = "";
  modal_total.value = "";
  stok_produk.value = "";
  harga_jual_satuan.value = "";
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

  renderProduk();
  renderTransaksi();
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
      <td>${t.tanggal}</td>
      <td>
        <button class="btn btn-sm btn-warning" onclick="openEdit(${i})">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="hapusTransaksi(${i})">Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}


/* ===========================================================
   HAPUS TRANSAKSI + ROLLBACK STOK
=========================================================== */
function hapusTransaksi(i) {
  if (!confirm("Hapus transaksi ini? Stok produk akan kembali.")) return;

  var trx = load("transaksi");
  var t = trx[i];

  var produk = load("produk");
  var p = produk.find(x => x.id === t.id_produk);

  var stok_awal = p.stok;
  p.stok += t.qty;

  logStok("hapus_transaksi", p.id, p.nama, t.qty, stok_awal, p.stok, "Rollback delete transaksi");

  save("produk", produk);
  trx.splice(i, 1);
  save("transaksi", trx);

  renderProduk();
  renderTransaksi();
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

  var pembeli = modal_pembeli.value.trim();
  var harga = parseFloat(modal_harga.value) || 0;
  var qty = parseInt(modal_qty.value) || 0;
  var status = modal_status.value;
  var metode = modal_metode.value;

  if (!pembeli || harga <= 0 || qty <= 0) {
    alert("Lengkapi semua data edit!");
    return;
  }

  var trx = load("transaksi");
  var row = trx[editIndex];

  var produk = load("produk");
  var p = produk.find(x => x.id === row.id_produk);

  if (p.stok < qty) {
    alert("Stok tidak cukup!\nStok sekarang: " + p.stok);
    return;
  }

  var stok_awal = p.stok;
  p.stok -= qty;
  var stok_akhir = p.stok;

  // hitung ulang total
  var total_modal = p.modal_per_pcs * qty;
  var total_jual = harga * qty;
  var laba = total_jual - total_modal;

  row.pembeli = pembeli;
  row.harga_jual_per_pcs = harga;
  row.qty = qty;
  row.total_modal = total_modal;
  row.total_jual = total_jual;
  row.laba = laba;
  row.tanggal = new Date().toString();
  row.status_pembayaran = status;
  row.metode_pembayaran = metode;

  save("produk", produk);
  save("transaksi", trx);

  logStok("edit_transaksi", p.id, p.nama, qty, stok_awal, stok_akhir, "Simpan edit transaksi");

  renderProduk();
  renderTransaksi();

  editModalEl.hide();
};



/* ===========================================================
   IMPORT PRODUK (EXCEL) — FINAL
=========================================================== */
document.getElementById("importProduk").addEventListener("change", function () {
  var file = this.files[0];
  if (!file) return alert("Pilih file Excel produk dulu!");

  var reader = new FileReader();

  reader.onload = function (e) {
    var wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
    var sheet = wb.Sheets[wb.SheetNames[0]];
    var rows = XLSX.utils.sheet_to_json(sheet);

    if (!rows.length) {
      alert("File Excel tidak berisi data atau format salah.");
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
});


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

  var trx = load("transaksi");
  var result = [];

  var tsMulai = mulai ? new Date(mulai + " 00:00:00").getTime() : -Infinity;
  var tsAkhir = akhir ? new Date(akhir + " 23:59:59").getTime() : Infinity;

  trx.forEach(t => {
    var time = new Date(t.tanggal).getTime();
    if (time >= tsMulai && time <= tsAkhir) {
      if (pid && t.id_produk !== pid) return;
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
};