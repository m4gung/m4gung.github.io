// Helper Pemformat Angka Rupiah
function formatRupiah(input) {
  let value = input.value.replace(/[^\d]/g, '');
  if (value) {
    input.value = parseInt(value).toLocaleString('id-ID');
  }
}

function getNumericValue(input) {
  if (!input) return 0;
  return parseInt(input.value.replace(/[^\d]/g, '')) || 0;
}

// Inisialisasi Database Dexie Versi 5 (Mendukung custom umur & varietas bibit)
const db = new Dexie("TaniPintarSabbangparuDB");
db.version(5).stores({
  lahan: '++id, nama, status, luas, lokasi, varietas, umurHari, tglTanam',
  transaksi: '++id, lahanId, desc, amount, type, date, syncStatus',
  utang: '++id, nama, amount, type, desc, status, date',
  settings: 'id, value'
});

// Status Jaringan Online / Offline
function updateOnlineStatus() {
  const status = document.getElementById('online-status');
  if (navigator.onLine) {
    status.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white/20';
  } else {
    status.className = 'w-2.5 h-2.5 rounded-full bg-amber-400 border border-white/20';
  }
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// Navigasi Antar Tab
function showSection(id) {
  document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
  const target = document.getElementById('sec-' + id);
  if (target) target.classList.remove('hidden');

  document.querySelectorAll('nav button').forEach(b => {
    b.classList.remove('active-tab');
    b.classList.add('text-slate-400');
  });
  const activeBtn = document.getElementById('nav-' + id);
  if (activeBtn) {
    activeBtn.classList.add('active-tab');
    activeBtn.classList.remove('text-slate-400');
  }

  if (id === 'home') refreshDashboard();
  if (id === 'lahan') renderLahan();
  if (id === 'transaksi') {
    updateLahanDropdown();
    renderTransaksi();
  }
  if (id === 'bagi-hasil') updateLahanDropdown();
  if (id === 'utang') renderUtang();
  if (id === 'settings') loadSettings();
}

function showSectionTransaksi(type) {
  showSection('transaksi');
  document.getElementById('trans-type').value = type;
  document.getElementById('trans-date').value = new Date().toISOString().split('T')[0];
}

// ========================================================
// LOGIKA HST & REKOMENDASI PADI PROPORSIONAL (CUSTOM UMUR)
// ========================================================
function hitungHST(tglTanamStr) {
  if (!tglTanamStr) return 0;
  const tglTanam = new Date(tglTanamStr);
  const hariIni = new Date();
  const diffTime = hariIni - tglTanam;
  return Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
}

function getRekomendasiHST(hst, umurPanen = 115) {
  // Hitung persentase fase hidup tanaman berdasarkan total hari bibit
  const rasio = hst / umurPanen;
  const progress = Math.min(100, Math.round(rasio * 100));

  if (rasio <= 0.15) {
    // Fase Vegetatif Awal (contoh: 0 - 17 hari pada bibit 115 hari)
    return {
      fase: 'Vegetatif Awal (Akar & Pemulihan)',
      tag: 'Pemupukan Dasar',
      progress,
      html: `
        <p class="font-bold text-slate-800">🌱 Pemupukan Dasar (Usia 7–14 HST):</p>
        <ul class="list-disc pl-4 space-y-1 text-slate-600">
          <li>Aplikasikan <b>Urea (75 kg/Ha)</b> + <b>SP-36 / NPK Phonska (100 kg/Ha)</b> untuk memacu pertumbuhan akar.</li>
          <li>Ketinggian air sawah cukup macak-macak (1–2 cm) agar bibit tidak lemas dan anakan leluasa tumbuh.</li>
        </ul>
      `
    };
  } else if (rasio <= 0.35) {
    // Fase Anakan Aktif (contoh: 18 - 40 hari pada bibit 115 hari)
    return {
      fase: 'Vegetatif Aktif (Pembentukan Anakan)',
      tag: 'Pemupukan II & Gulma',
      progress,
      html: `
        <p class="font-bold text-slate-800">🌾 Pemupukan Susulan II:</p>
        <ul class="list-disc pl-4 space-y-1 text-slate-600">
          <li>Taburkan <b>Urea (100 kg/Ha) + NPK (50 kg/Ha)</b> untuk memperbanyak anakan produktif.</li>
          <li>Lakukan penyiangan gulma (matun) sebelum pupuk ditebar agar serapan hara maksimal.</li>
          <li>Waspadai hama penggerek batang (Sundep) pada pucuk pelepah daun.</li>
        </ul>
      `
    };
  } else if (rasio <= 0.60) {
    // Fase Bunting / Generatif Awal (contoh: 41 - 70 hari)
    return {
      fase: 'Fase Bunting (Generatif Awal)',
      tag: 'Kritis Kalium & Air',
      progress,
      html: `
        <p class="font-bold text-slate-800">⚠️ Perhatian Khusus Fase Bunting:</p>
        <ul class="list-disc pl-4 space-y-1 text-slate-600">
          <li>Air wajib tergenang setinggi 3–5 cm. Jangan biarkan sawah kekeringan saat bunting muda.</li>
          <li>Stop pemakaian Urea tunggal. Semprotkan nutrisi daun berkandungan <b>Kalium (K) & Boron</b> agar malai keluar serempak.</li>
          <li>Waspadai serangan jamur wereng dan bercak daun.</li>
        </ul>
      `
    };
  } else if (rasio <= 0.85) {
    // Fase Pengisian Butir (contoh: 71 - 98 hari)
    return {
      fase: 'Pengisian Butir (Fase Masak Susu)',
      tag: 'Proteksi Walang Sangit',
      progress,
      html: `
        <p class="font-bold text-slate-800">🛡️ Proteksi Malai & Butir:</p>
        <ul class="list-disc pl-4 space-y-1 text-slate-600">
          <li>Amati serangan <b>Walang Sangit</b> di pagi dan sore hari. Lakukan pengasapan atau semprot insektisida bila perlu.</li>
          <li>Pertahankan kelembapan tanah sampai bulir padi merunduk dan mulai menguning.</li>
        </ul>
      `
    };
  } else {
    // Fase Pematangan / Panen (> 85% umur)
    return {
      fase: 'Pematangan & Menjelang Panen',
      tag: 'Keringkan Sawah & Booking Alsintan',
      progress: 100,
      html: `
        <p class="font-bold text-slate-800">🚜 Persiapan Panen Raya:</p>
        <ul class="list-disc pl-4 space-y-1 text-slate-600">
          <li><b>Keringkan petak sawah 10–12 hari sebelum panen</b> agar tanah mengeras dan memudahkan manuver roda <i>combine harvester</i>.</li>
          <li>Segera amankan jadwal antrean mesin panen di tab 'Pasar' agar panen tidak molor saat musim hujan.</li>
        </ul>
      `
    };
  }
}

// ========================================================
// MANAJEMEN LAHAN (MENDUKUNG CUSTOM VARIETAS & HARI)
// ========================================================
document.getElementById('form-lahan').onsubmit = async (e) => {
  e.preventDefault();
  const id = document.getElementById('lahan-edit-id').value;
  const data = {
    nama: document.getElementById('nama-lahan').value,
    luas: getNumericValue(document.getElementById('luas-lahan')),
    lokasi: document.getElementById('lokasi-lahan').value,
    status: document.getElementById('status-lahan').value,
    varietas: document.getElementById('varietas-lahan').value.trim() || 'Ciherang',
    umurHari: parseInt(document.getElementById('umur-lahan').value) || 115,
    tglTanam: document.getElementById('tgl-tanam-lahan').value
  };

  if (id) {
    await db.lahan.update(parseInt(id), data);
    batalEditLahan();
  } else {
    await db.lahan.add(data);
  }
  renderLahan();
  refreshDashboard();
  e.target.reset();
  document.getElementById('umur-lahan').value = 115;
};

function batalEditLahan() {
  document.getElementById('lahan-edit-id').value = '';
  document.getElementById('form-lahan').reset();
  document.getElementById('umur-lahan').value = 115;
  document.getElementById('btn-save-lahan').innerText = 'Tambah Lahan';
  document.getElementById('btn-cancel-lahan').classList.add('hidden');
}

async function editLahan(id) {
  const l = await db.lahan.get(id);
  document.getElementById('lahan-edit-id').value = l.id;
  document.getElementById('nama-lahan').value = l.nama;
  document.getElementById('luas-lahan').value = (l.luas || '').toLocaleString('id-ID');
  document.getElementById('lokasi-lahan').value = l.lokasi || '';
  document.getElementById('status-lahan').value = l.status;
  document.getElementById('varietas-lahan').value = l.varietas || 'Ciherang';
  document.getElementById('umur-lahan').value = l.umurHari || 115;
  document.getElementById('tgl-tanam-lahan').value = l.tglTanam || '';

  document.getElementById('btn-save-lahan').innerText = 'Simpan Perubahan';
  document.getElementById('btn-cancel-lahan').classList.remove('hidden');
}

async function hapusLahan(id) {
  if (confirm("Hapus lahan ini dari sistem?")) {
    await db.lahan.delete(id);
    renderLahan();
    refreshDashboard();
  }
}

async function renderLahan() {
  const data = await db.lahan.toArray();
  const container = document.getElementById('list-lahan');
  if (data.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-400 italic">Belum ada lahan tercatat.</p>';
    return;
  }

  container.innerHTML = data.map(l => {
    const umur = l.umurHari || 115;
    const hst = hitungHST(l.tglTanam);
    return `
      <div class="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
        <div class="flex justify-between items-start mb-1">
          <div>
            <div class="flex items-center gap-1.5">
              <span class="font-bold text-xs text-slate-900">${l.nama}</span>
              <span class="text-[9px] font-semibold px-2 py-0.5 rounded ${l.status === 'Milik Sendiri' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}">${l.status}</span>
            </div>
            <p class="text-[11px] text-slate-500 mt-0.5">${l.lokasi || 'Sabbangparu'} • ${l.luas || '-'} are • Bibit: <b>${l.varietas || 'Ciherang'}</b> (${umur} Hari)</p>
          </div>
          <div class="text-right">
            <span class="text-xs font-extrabold text-amber-600">${hst} HST</span>
            <span class="text-[9px] text-slate-400 block">Target: ${umur} H</span>
          </div>
        </div>
        <div class="flex gap-2 justify-end mt-2 pt-2 border-t border-slate-100">
          <button type="button" onclick="editLahan(${l.id})" class="text-[11px] text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">Edit</button>
          <button type="button" onclick="hapusLahan(${l.id})" class="text-[11px] text-red-600 bg-red-50 px-2 py-1 rounded-lg">Hapus</button>
        </div>
      </div>
    `;
  }).join('');
}

async function updateLahanDropdown() {
  const data = await db.lahan.toArray();
  const options = '<option value="">-- Tanpa Lahan (Pos Umum) --</option>' + 
    data.map(l => `<option value="${l.id}">${l.nama} (${l.status})</option>`).join('');
  document.getElementById('lahan-id').innerHTML = options;
  document.getElementById('bagi-lahan-id').innerHTML = options;
}

// ========================================================
// TRANSAKSI KEUANGAN
// ========================================================
document.getElementById('form-transaksi').onsubmit = async (e) => {
  e.preventDefault();
  const id = document.getElementById('trans-edit-id').value;
  const lahanVal = document.getElementById('lahan-id').value;
  const data = {
    lahanId: lahanVal ? parseInt(lahanVal) : null,
    desc: document.getElementById('trans-desc').value,
    amount: getNumericValue(document.getElementById('trans-amount')),
    type: document.getElementById('trans-type').value,
    date: document.getElementById('trans-date').value,
    syncStatus: 'pending'
  };

  if (id) {
    await db.transaksi.update(parseInt(id), data);
    batalEditTransaksi();
  } else {
    await db.transaksi.add(data);
  }

  e.target.reset();
  renderTransaksi();
  refreshDashboard();
};

function batalEditTransaksi() {
  document.getElementById('trans-edit-id').value = '';
  document.getElementById('form-transaksi').reset();
  document.getElementById('btn-save-trans').innerText = 'Simpan Transaksi';
  document.getElementById('btn-cancel-trans').classList.add('hidden');
}

async function editTransaksi(id) {
  showSection('transaksi');
  const t = await db.transaksi.get(id);
  document.getElementById('trans-edit-id').value = t.id;
  document.getElementById('lahan-id').value = t.lahanId || '';
  document.getElementById('trans-date').value = t.date;
  document.getElementById('trans-desc').value = t.desc;
  document.getElementById('trans-amount').value = t.amount.toLocaleString('id-ID');
  document.getElementById('trans-type').value = t.type;

  document.getElementById('btn-save-trans').innerText = 'Simpan Edit';
  document.getElementById('btn-cancel-trans').classList.remove('hidden');
}

async function hapusTransaksi(id) {
  if (confirm("Hapus transaksi ini?")) {
    await db.transaksi.delete(id);
    renderTransaksi();
    refreshDashboard();
  }
}

async function renderTransaksi() {
  const data = await db.transaksi.toArray();
  data.sort((a, b) => new Date(b.date) - new Date(a.date));

  const lahanData = await db.lahan.toArray();
  const lahanMap = {};
  lahanData.forEach(l => lahanMap[l.id] = l.nama);

  const container = document.getElementById('list-transaksi');
  if (data.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-400 italic">Belum ada transaksi tercatat.</p>';
    return;
  }

  container.innerHTML = data.map(t => `
    <div class="bg-white p-3 rounded-xl shadow-sm border-l-4 ${t.type === 'masuk' ? 'border-emerald-500' : 'border-red-500'}">
      <div class="flex justify-between items-center">
        <div>
          <span class="font-bold text-xs text-slate-900">${t.desc}</span>
          <p class="text-[10px] text-slate-400">${t.date} • ${lahanMap[t.lahanId] || 'Pos Umum'}</p>
        </div>
        <div class="text-right">
          <span class="font-bold text-xs ${t.type === 'masuk' ? 'text-emerald-700' : 'text-red-600'}">
            Rp ${t.amount.toLocaleString('id-ID')}
          </span>
          <div class="mt-1 flex justify-end gap-1">
            <button type="button" onclick="editTransaksi(${t.id})" class="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Edit</button>
            <button type="button" onclick="hapusTransaksi(${t.id})" class="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded">Hapus</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// ========================================================
// KALKULATOR BAGI HASIL (TESENG)
// ========================================================
async function hitungBagiHasil() {
  const lahanId = parseInt(document.getElementById('bagi-lahan-id').value);
  const pPemilik = (parseInt(document.getElementById('persen-pemilik').value) || 50) / 100;
  const pPenggarap = (parseInt(document.getElementById('persen-penggarap').value) || 50) / 100;
  const startDate = document.getElementById('bagi-start').value;
  const endDate = document.getElementById('bagi-end').value;

  let trans = await db.transaksi.where('lahanId').equals(lahanId).toArray();
  if (startDate) trans = trans.filter(t => t.date >= startDate);
  if (endDate) trans = trans.filter(t => t.date <= endDate);

  let pemasukan = 0;
  let pengeluaran = 0;

  trans.forEach(t => {
    if (t.type === 'masuk') pemasukan += t.amount;
    else pengeluaran += t.amount;
  });

  const untungBersih = pemasukan - pengeluaran;
  const jatahPemilik = untungBersih * pPemilik;
  const jatahPenggarap = untungBersih * pPenggarap;

  const div = document.getElementById('hasil-kalkulasi');
  div.classList.remove('hidden');
  div.innerHTML = `
    <p>Hasil Panen Bersih: <b>Rp ${untungBersih.toLocaleString('id-ID')}</b></p>
    <p class="text-emerald-700 font-bold">Jatah Pemilik (${pPemilik * 100}%): Rp ${jatahPemilik.toLocaleString('id-ID')}</p>
    <p class="text-blue-700 font-bold">Jatah Penggarap (${pPenggarap * 100}%): Rp ${jatahPenggarap.toLocaleString('id-ID')}</p>
  `;
}

function hitungBagiHasilManual() {
  const pemasukan = getNumericValue(document.getElementById('manual-pemasukan'));
  const pengeluaran = getNumericValue(document.getElementById('manual-pengeluaran'));
  const pPemilik = (parseInt(document.getElementById('manual-persen-pemilik').value) || 50) / 100;
  const pPenggarap = (parseInt(document.getElementById('manual-persen-penggarap').value) || 50) / 100;

  const untungBersih = pemasukan - pengeluaran;
  const jatahPemilik = untungBersih * pPemilik;
  const jatahPenggarap = untungBersih * pPenggarap;

  const div = document.getElementById('hasil-kalkulasi-manual');
  div.classList.remove('hidden');
  div.innerHTML = `
    <p>Hasil Panen Bersih: <b>Rp ${untungBersih.toLocaleString('id-ID')}</b></p>
    <p class="text-emerald-700 font-bold">Jatah Pemilik (${pPemilik * 100}%): Rp ${jatahPemilik.toLocaleString('id-ID')}</p>
    <p class="text-blue-700 font-bold">Jatah Penggarap (${pPenggarap * 100}%): Rp ${jatahPenggarap.toLocaleString('id-ID')}</p>
  `;
}

// ========================================================
// UTANG PIUTANG / KASBON
// ========================================================
document.getElementById('form-utang').onsubmit = async (e) => {
  e.preventDefault();
  const id = document.getElementById('utang-edit-id').value;
  const data = {
    nama: document.getElementById('nama-orang').value,
    amount: getNumericValue(document.getElementById('utang-amount')),
    type: document.getElementById('utang-type').value,
    desc: document.getElementById('utang-desc').value,
    date: document.getElementById('utang-date').value,
    status: 'belum_lunas'
  };

  if (id) {
    const u = await db.utang.get(parseInt(id));
    data.status = u.status;
    await db.utang.update(parseInt(id), data);
    batalEditUtang();
  } else {
    await db.utang.add(data);
  }
  renderUtang();
  e.target.reset();
};

function batalEditUtang() {
  document.getElementById('utang-edit-id').value = '';
  document.getElementById('form-utang').reset();
  document.getElementById('btn-save-utang').innerText = 'Catat Utang / Kasbon';
  document.getElementById('btn-cancel-utang').classList.add('hidden');
}

async function toggleStatusUtang(id) {
  const u = await db.utang.get(id);
  await db.utang.update(id, { status: u.status === 'lunas' ? 'belum_lunas' : 'lunas' });
  renderUtang();
}

async function hapusUtang(id) {
  if (confirm("Hapus catatan ini?")) {
    await db.utang.delete(id);
    renderUtang();
  }
}

async function renderUtang() {
  const data = await db.utang.toArray();
  const container = document.getElementById('list-utang');
  if (data.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-400 italic">Belum ada kasbon/utang.</p>';
    return;
  }

  container.innerHTML = data.map(u => `
    <div class="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200 mb-2">
      <div class="flex justify-between items-center mb-1">
        <div>
          <span class="font-bold text-xs text-slate-900">${u.nama}</span>
          <span class="text-[9px] px-2 py-0.5 rounded-full ${u.status === 'lunas' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
            ${u.status === 'lunas' ? 'Lunas' : 'Belum Lunas'}
          </span>
          <p class="text-[10px] text-slate-400 mt-0.5">${u.type} • ${u.date || '-'}</p>
        </div>
        <span class="font-extrabold text-xs text-slate-800">Rp ${u.amount.toLocaleString('id-ID')}</span>
      </div>
      <div class="flex gap-2 justify-end mt-2 pt-2 border-t border-slate-100">
        <button type="button" onclick="toggleStatusUtang(${u.id})" class="text-[10px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">Ganti Status</button>
        <button type="button" onclick="hapusUtang(${u.id})" class="text-[10px] text-red-600 bg-red-50 px-2 py-1 rounded-lg">Hapus</button>
      </div>
    </div>
  `).join('');
}

// ========================================================
// DASHBOARD BERANDA (STATISTIK, HST, & GRAFIK)
// ========================================================
let myChart;

async function gantiLahanBeranda(id) {
  localStorage.setItem('tani_active_lahan_home', id);
  refreshDashboard();
}

async function refreshDashboard() {
  const lahans = await db.lahan.toArray();
  const selectLahan = document.getElementById('home-lahan-select');

  // 1. Hitung Statistik Kepemilikan Lahan Terpisah
  let jmlMilik = 0;
  let luasMilik = 0;
  let jmlGarap = 0;
  let luasGarap = 0;

  lahans.forEach(l => {
    const luas = Number(l.luas) || 0;
    if (l.status === 'Milik Sendiri') {
      jmlMilik += 1;
      luasMilik += luas;
    } else {
      jmlGarap += 1;
      luasGarap += luas;
    }
  });

  document.getElementById('stat-milik-jumlah').innerText = jmlMilik;
  document.getElementById('stat-milik-luas').innerText = luasMilik.toLocaleString('id-ID');
  document.getElementById('stat-garap-jumlah').innerText = jmlGarap;
  document.getElementById('stat-garap-luas').innerText = luasGarap.toLocaleString('id-ID');

  // 2. Jika Belum Ada Lahan Terdaftar
  if (lahans.length === 0) {
    selectLahan.innerHTML = '<option>Belum ada lahan</option>';
    document.getElementById('home-nama-lahan').innerText = 'Belum Ada Lahan';
    document.getElementById('home-val-hst').innerText = '0';
    document.getElementById('rekomendasi-konten').innerHTML = '<p class="text-slate-500">Silakan daftarkan petak sawah di menu Lahan.</p>';
    return;
  }

  // 3. Populate Selector Lahan Aktif
  let activeId = localStorage.getItem('tani_active_lahan_home') || lahans[0].id;
  selectLahan.innerHTML = lahans.map(l => 
    `<option value="${l.id}" ${l.id == activeId ? 'selected' : ''}>${l.nama} (${l.status})</option>`
  ).join('');

  const currentLahan = lahans.find(l => l.id == activeId) || lahans[0];
  const umurPanen = parseInt(currentLahan.umurHari) || 115;
  const hst = hitungHST(currentLahan.tglTanam);
  const rec = getRekomendasiHST(hst, umurPanen);

  // Estimasi Tanggal Panen Berdasarkan Umur Hari Bibit
  if (currentLahan.tglTanam) {
    const tglPanen = new Date(currentLahan.tglTanam);
    tglPanen.setDate(tglPanen.getDate() + umurPanen);
    document.getElementById('home-tgl-panen').innerText = `Panen: ${tglPanen.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`;
  } else {
    document.getElementById('home-tgl-panen').innerText = 'Panen: -';
  }

  // 4. Update Card HST & Rekomendasi
  document.getElementById('home-nama-lahan').innerText = currentLahan.nama;
  document.getElementById('home-lokasi-lahan').innerText = `${currentLahan.lokasi || 'Sabbangparu'} • ${currentLahan.luas || '-'} are`;
  document.getElementById('home-badge-status').innerText = currentLahan.status;
  document.getElementById('home-badge-varietas').innerText = `${currentLahan.varietas || 'Padi'} (${umurPanen} Hari)`;
  document.getElementById('home-val-hst').innerText = hst;
  document.getElementById('home-fase-nama').innerText = rec.fase;
  document.getElementById('home-progress-bar').style.width = `${rec.progress}%`;

  document.getElementById('rekomendasi-tag').innerText = rec.tag;
  document.getElementById('rekomendasi-konten').innerHTML = rec.html;

  // 5. Render Grafik Profit Keuangan
  const allTrans = await db.transaksi.toArray();
  let profit = 0;
  const report = {};

  allTrans.forEach(t => {
    const val = t.type === 'masuk' ? t.amount : -t.amount;
    profit += val;
    report[t.date] = (report[t.date] || 0) + val;
  });

  document.getElementById('total-profit').innerText = `Rp ${profit.toLocaleString('id-ID')}`;

  const ctx = document.getElementById('profitChart').getContext('2d');
  if (myChart) myChart.destroy();

  const sortedDates = Object.keys(report).sort();
  const sortedValues = sortedDates.map(d => report[d]);

  myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: sortedDates,
      datasets: [{
        label: 'Profit Harian (Rp)',
        data: sortedValues,
        borderColor: '#15803d',
        backgroundColor: 'rgba(21, 128, 61, 0.1)',
        tension: 0.2,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { font: { size: 9 } } },
        y: { ticks: { font: { size: 9 } } }
      }
    }
  });
}

// Update Harga Gabah Prompt
function updateHargaGabahPrompt() {
  const harga = prompt("Masukkan harga gabah sawah (GKP) terbaru per kg (Contoh: 7000):");
  if (harga && !isNaN(harga)) {
    document.getElementById('val-harga-sawah').innerHTML = `Rp${Number(harga).toLocaleString('id-ID')} <span class="text-[10px] font-normal text-slate-500">/kg</span>`;
    alert("Harga gabah berhasil diperbarui!");
  }
}

// ========================================================
// SINKRONISASI GOOGLE APPS SCRIPT
// ========================================================
async function loadSettings() {
  const urlSet = await db.settings.get('sheet_url');
  if (urlSet) document.getElementById('sheet-url').value = urlSet.value;
}

async function saveSettings() {
  const val = document.getElementById('sheet-url').value;
  await db.settings.put({ id: 'sheet_url', value: val });
  alert("Konfigurasi Google Apps Script tersimpan!");
}

async function syncData() {
  if (!navigator.onLine) {
    alert("Anda sedang offline. Sinkronisasi membutuhkan internet.");
    return;
  }

  const urlSet = await db.settings.get('sheet_url');
  if (!urlSet || !urlSet.value) {
    alert("Masukkan Apps Script Web App URL di menu Set terlebih dahulu.");
    showSection('settings');
    return;
  }

  const btn = document.getElementById('sync-btn');
  btn.innerText = "Syncing...";
  btn.disabled = true;

  try {
    const payload = {
      transactions: await db.transaksi.toArray(),
      lahan: await db.lahan.toArray(),
      utang: await db.utang.toArray(),
      timestamp: new Date().toISOString()
    };

    const res = await fetch(urlSet.value, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    });

    const result = await res.text();
    alert("Cadangan Cloud Berhasil: " + result);
  } catch (err) {
    alert("Gagal sinkronisasi: " + err.message);
  } finally {
    btn.innerText = "Sync Cloud";
    btn.disabled = false;
  }
}

async function forceDownload() {
  if (!navigator.onLine) {
    alert("Perlu koneksi internet untuk download cloud.");
    return;
  }

  const urlSet = await db.settings.get('sheet_url');
  if (!urlSet || !urlSet.value) {
    alert("URL Apps Script belum diatur.");
    return;
  }

  if (!confirm("Peringatan: Ini akan menimpa seluruh database lokal dengan data dari Google Sheets. Lanjutkan?")) return;

  try {
    const res = await fetch(urlSet.value + "?action=get_all");
    const data = await res.json();

    await db.transaction('rw', [db.lahan, db.transaksi, db.utang], async () => {
      await db.lahan.clear();
      if (data.lahan?.length) await db.lahan.bulkAdd(data.lahan);

      await db.transaksi.clear();
      if (data.transaksi?.length) await db.transaksi.bulkAdd(data.transaksi);

      await db.utang.clear();
      if (data.utang?.length) await db.utang.bulkAdd(data.utang);
    });

    alert("Data berhasil dipulihkan dari Cloud!");
    location.reload();
  } catch (err) {
    alert("Gagal unduh data: " + err.message);
  }
}

// Mulai aplikasi
showSection('home');