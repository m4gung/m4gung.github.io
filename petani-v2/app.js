// Database Inisialisasi
const db = new Dexie("TaniPintarDB");
db.version(2).stores({
    lahan: '++id, nama, status',
    transaksi: '++id, lahanId, desc, amount, type, date, syncStatus',
    utang: '++id, nama, amount, type, status',
    settings: 'id, value'
});
db.version(3).stores({
    lahan: '++id, nama, status, luas, lokasi',
    utang: '++id, nama, amount, type, status, date'
});

// --- Monitoring Koneksi ---
function updateOnlineStatus() {
    const status = document.getElementById('online-status');
    if (navigator.onLine) {
        status.classList.remove('bg-gray-400');
        status.classList.add('bg-green-400');
    } else {
        status.classList.remove('bg-green-400');
        status.classList.add('bg-gray-400');
    }
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// --- Navigasi Sederhana ---
function showSection(id) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.getElementById('sec-' + id).classList.remove('hidden');

    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active-tab'));
    const activeBtn = document.getElementById('nav-' + id);
    if (activeBtn) activeBtn.classList.add('active-tab');

    if (id === 'home') refreshDashboard();
    if (id === 'lahan') renderLahan();
    if (id === 'transaksi' || id === 'bagi-hasil') {
        updateLahanDropdown();
        if (id === 'transaksi') renderTransaksi();
    }
    if (id === 'utang') renderUtang();
    if (id === 'settings') loadSettings();
}

async function loadSettings() {
    const urlSet = await db.settings.get('sheet_url');
    if (urlSet) document.getElementById('sheet-url').value = urlSet.value;
}

function showSectionTransaksi(type) {
    showSection('transaksi');
    document.getElementById('trans-type').value = type;
    document.getElementById('trans-date').value = new Date().toISOString().split('T')[0];
}

// --- Manajemen Lahan ---
document.getElementById('form-lahan').onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('lahan-edit-id').value;
    const data = {
        nama: document.getElementById('nama-lahan').value,
        luas: document.getElementById('luas-lahan').value,
        lokasi: document.getElementById('lokasi-lahan').value,
        status: document.getElementById('status-lahan').value
    };
    if (id) {
        await db.lahan.update(parseInt(id), data);
        batalEditLahan();
    } else {
        await db.lahan.add(data);
    }
    renderLahan();
    if (e && e.target) e.target.reset();
};

function batalEditLahan() {
    document.getElementById('lahan-edit-id').value = '';
    document.getElementById('form-lahan').reset();
    document.getElementById('btn-save-lahan').innerText = 'Tambah Lahan';
    document.getElementById('btn-cancel-lahan').classList.add('hidden');
}

async function editLahan(id) {
    const l = await db.lahan.get(id);
    document.getElementById('lahan-edit-id').value = l.id;
    document.getElementById('nama-lahan').value = l.nama;
    document.getElementById('luas-lahan').value = l.luas || '';
    document.getElementById('lokasi-lahan').value = l.lokasi || '';
    document.getElementById('status-lahan').value = l.status;
    document.getElementById('btn-save-lahan').innerText = 'Simpan Edit';
    document.getElementById('btn-cancel-lahan').classList.remove('hidden');
}

async function renderLahan() {
    const data = await db.lahan.toArray();
    document.getElementById('list-lahan').innerHTML = data.map(l => `
        <div class="bg-white p-3 rounded-lg shadow-sm">
            <div class="flex justify-between items-center mb-1">
                <span class="font-bold">${l.nama} <span class="text-[10px] font-normal text-gray-500">(${l.status})</span></span>
                <div>
                    <button type="button" onclick="editLahan(${l.id})" class="text-blue-500 text-xs bg-blue-50 px-2 py-1 rounded mr-1">Edit</button>
                    <button type="button" onclick="hapusLahan(${l.id})" class="text-red-500 text-xs bg-red-50 px-2 py-1 rounded">Hapus</button>
                </div>
            </div>
            <div class="text-[11px] text-gray-500">
                <span>Luas: ${l.luas || '-'} are</span> | 
                <span>Lokasi: ${l.lokasi || '-'}</span>
            </div>
        </div>
    `).join('');
}

async function hapusLahan(id) {
    if (confirm("Hapus lahan ini?")) {
        await db.lahan.delete(id);
        renderLahan();
    }
}

async function updateLahanDropdown() {
    const data = await db.lahan.toArray();
    const options = '<option value="">-- Tanpa Lahan --</option>' + data.map(l => `<option value="${l.id}">${l.nama}</option>`).join('');
    document.getElementById('lahan-id').innerHTML = options;
    document.getElementById('bagi-lahan-id').innerHTML = options;
}

// --- Keuangan & Transaksi ---
document.getElementById('form-transaksi').onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('trans-edit-id').value;
    const lahanVal = document.getElementById('lahan-id').value;
    const data = {
        lahanId: lahanVal ? parseInt(lahanVal) : null,
        desc: document.getElementById('trans-desc').value,
        amount: parseInt(document.getElementById('trans-amount').value),
        type: document.getElementById('trans-type').value,
        date: document.getElementById('trans-date').value,
        syncStatus: 'pending'
    };

    if (id) {
        await db.transaksi.update(parseInt(id), data);
        batalEditTransaksi();
        alert("Transaksi diperbarui!");
    } else {
        await db.transaksi.add(data);
        alert("Transaksi tersimpan!");
    }
    
    if(e && e.target) e.target.reset();
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
    document.getElementById('lahan-id').value = t.lahanId;
    document.getElementById('trans-date').value = t.date;
    document.getElementById('trans-desc').value = t.desc;
    document.getElementById('trans-amount').value = t.amount;
    document.getElementById('trans-type').value = t.type;
    
    document.getElementById('btn-save-trans').innerText = 'Simpan Edit';
    document.getElementById('btn-cancel-trans').classList.remove('hidden');
}

async function renderTransaksi() {
    const data = await db.transaksi.toArray();
    data.sort((a, b) => new Date(b.date) - new Date(a.date)); // Urutkan terbaru di atas
    
    const lahanData = await db.lahan.toArray();
    const lahanMap = {};
    lahanData.forEach(l => lahanMap[l.id] = l.nama);
    
    if (data.length === 0) {
        document.getElementById('list-transaksi').innerHTML = '<p class="text-xs text-gray-500 italic">Belum ada transaksi</p>';
        return;
    }

    document.getElementById('list-transaksi').innerHTML = data.map(t => `
        <div class="bg-white p-3 rounded-lg shadow-sm border-l-4 ${t.type === 'masuk' ? 'border-green-500' : 'border-red-500'}">
            <div class="flex justify-between items-center">
                <div>
                    <div class="font-bold text-sm">${t.desc}</div>
                    <div class="text-[10px] text-gray-500">${t.date} • ${lahanMap[t.lahanId] || 'Umum / Tanpa Lahan'}</div>
                </div>
                <div class="text-right">
                    <div class="font-bold ${t.type === 'masuk' ? 'text-green-600' : 'text-red-600'}">Rp ${t.amount.toLocaleString()}</div>
                    <div class="mt-1 flex justify-end gap-1">
                        <button type="button" onclick="editTransaksi(${t.id})" class="text-[10px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded">Edit</button>
                        <button type="button" onclick="hapusTransaksi(${t.id})" class="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded">Hapus</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

async function hapusTransaksi(id) {
    if (confirm("Hapus transaksi ini?")) {
        await db.transaksi.delete(id);
        renderTransaksi();
        refreshDashboard();
    }
}

// --- Logika Bagi Hasil ---
async function hitungBagiHasil() {
    const lahanId = parseInt(document.getElementById('bagi-lahan-id').value);
    const pPemilik = parseInt(document.getElementById('persen-pemilik').value) / 100;
    const pPenggarap = parseInt(document.getElementById('persen-penggarap').value) / 100;
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
        <p class="text-xs">Keuntungan Bersih: <b>Rp ${untungBersih.toLocaleString()}</b></p>
        <p class="text-green-700">Jatah Pemilik: Rp ${jatahPemilik.toLocaleString()}</p>
        <p class="text-blue-700">Jatah Penggarap: Rp ${jatahPenggarap.toLocaleString()}</p>
    `;
}

function hitungBagiHasilManual() {
    const pemasukan = parseInt(document.getElementById('manual-pemasukan').value) || 0;
    const pengeluaran = parseInt(document.getElementById('manual-pengeluaran').value) || 0;
    const pPemilik = (parseInt(document.getElementById('manual-persen-pemilik').value) || 0) / 100;
    const pPenggarap = (parseInt(document.getElementById('manual-persen-penggarap').value) || 0) / 100;

    const untungBersih = pemasukan - pengeluaran;
    const jatahPemilik = untungBersih * pPemilik;
    const jatahPenggarap = untungBersih * pPenggarap;

    const div = document.getElementById('hasil-kalkulasi-manual');
    div.classList.remove('hidden');
    div.innerHTML = `
        <p class="text-xs font-bold mb-1">Hasil Perhitungan Manual:</p>
        <p class="text-xs">Keuntungan Bersih: <b>Rp ${untungBersih.toLocaleString()}</b></p>
        <p class="text-green-700">Jatah Pemilik: Rp ${jatahPemilik.toLocaleString()}</p>
        <p class="text-blue-700">Jatah Penggarap: Rp ${jatahPenggarap.toLocaleString()}</p>
    `;
}

// --- Utang Piutang ---
document.getElementById('form-utang').onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('utang-edit-id').value;
    const data = {
        nama: document.getElementById('nama-orang').value,
        amount: parseInt(document.getElementById('utang-amount').value),
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
    if (e && e.target) e.target.reset();
};

function batalEditUtang() {
    document.getElementById('utang-edit-id').value = '';
    document.getElementById('form-utang').reset();
    document.getElementById('btn-save-utang').innerText = 'Catat Utang';
    document.getElementById('btn-cancel-utang').classList.add('hidden');
}

async function editUtang(id) {
    const u = await db.utang.get(id);
    document.getElementById('utang-edit-id').value = u.id;
    document.getElementById('nama-orang').value = u.nama;
    document.getElementById('utang-amount').value = u.amount;
    document.getElementById('utang-type').value = u.type;
    document.getElementById('utang-desc').value = u.desc || '';
    document.getElementById('utang-date').value = u.date || '';
    document.getElementById('btn-save-utang').innerText = 'Simpan Edit';
    document.getElementById('btn-cancel-utang').classList.remove('hidden');
}

async function hapusUtang(id) {
    if (confirm("Hapus utang ini?")) {
        await db.utang.delete(id);
        renderUtang();
        refreshDashboard();
    }
}

async function toggleStatusUtang(id) {
    const u = await db.utang.get(id);
    await db.utang.update(id, { status: u.status === 'lunas' ? 'belum_lunas' : 'lunas' });
    renderUtang();
    refreshDashboard();
}

async function renderUtang() {
    const data = await db.utang.toArray();
    document.getElementById('list-utang').innerHTML = data.map(u => `
        <div class="bg-white p-3 rounded-lg shadow-sm border-l-4 border-gray-400 mb-2">
            <div class="flex justify-between items-center mb-2">
                <div>
                    <div class="font-bold flex items-center gap-2 text-sm">
                        ${u.nama} 
                        <span class="text-[10px] px-2 py-0.5 rounded-full ${u.status === 'lunas' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                            ${u.status === 'lunas' ? 'Lunas' : 'Belum Lunas'}
                        </span>
                    </div>
                    <div class="text-[10px] text-gray-400">${u.type || ''} ${u.desc ? '- ' + u.desc : ''} • ${u.date || ''}</div>
                </div>
                <div class="font-bold text-sm">Rp ${u.amount.toLocaleString()}</div>
            </div>
            <div class="flex gap-2 justify-end mt-2">
                <button type="button" onclick="toggleStatusUtang(${u.id})" class="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded">Ubah Status</button>
                <button type="button" onclick="editUtang(${u.id})" class="text-[10px] bg-gray-100 text-gray-700 px-2 py-1 rounded">Edit</button>
                <button type="button" onclick="hapusUtang(${u.id})" class="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded">Hapus</button>
            </div>
        </div>
    `).join('');
}

// --- Dashboard & Chart ---
let myChart;
async function refreshDashboard() {
    const startDate = document.getElementById('filter-start').value;
    const endDate = document.getElementById('filter-end').value;

    let allTrans = await db.transaksi.toArray();
    let allUtang = await db.utang.toArray();
    let lahanData = await db.lahan.toArray();
    const lahanMap = {};
    lahanData.forEach(l => lahanMap[l.id] = l.nama);

    let totalUntung = 0;
    const reportData = {};
    let filteredTrans = [];

    allTrans.forEach(t => {
        if (startDate && t.date < startDate) return;
        if (endDate && t.date > endDate) return;

        filteredTrans.push(t);

        if (t.type === 'masuk') totalUntung += t.amount;
        else totalUntung -= t.amount;

        reportData[t.date] = (reportData[t.date] || 0) + (t.type === 'masuk' ? t.amount : -t.amount);
    });

    allUtang.forEach(u => {
        if (!u.date) return;
        if (startDate && u.date < startDate) return;
        if (endDate && u.date > endDate) return;

        // Utang dianggap sebagai pengeluaran/beban (-), kecuali dikelola khusus
        let amt = -u.amount;
        totalUntung += amt;
        reportData[u.date] = (reportData[u.date] || 0) + amt;
    });

    document.getElementById('total-profit').innerText = "Rp " + totalUntung.toLocaleString();

    // Render list transaksi beranda
    filteredTrans.sort((a, b) => new Date(b.date) - new Date(a.date)); // Terbaru di atas
    const listBeranda = document.getElementById('list-transaksi-beranda');
    if (filteredTrans.length === 0) {
        listBeranda.innerHTML = '<p class="text-xs text-gray-500 italic">Belum ada transaksi</p>';
    } else {
        listBeranda.innerHTML = filteredTrans.map(t => `
            <div class="bg-gray-50 p-2 rounded border-l-4 ${t.type === 'masuk' ? 'border-green-500' : 'border-red-500'}">
                <div class="flex justify-between items-center">
                    <div>
                        <div class="font-bold text-xs">${t.desc}</div>
                        <div class="text-[10px] text-gray-500">${t.date} • ${lahanMap[t.lahanId] || 'Umum'}</div>
                    </div>
                    <div class="text-right">
                        <div class="font-bold text-sm ${t.type === 'masuk' ? 'text-green-600' : 'text-red-600'}">Rp ${t.amount.toLocaleString()}</div>
                        <div class="mt-1 flex justify-end gap-1">
                            <button type="button" onclick="editTransaksi(${t.id})" class="text-[10px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded">Edit</button>
                            <button type="button" onclick="hapusTransaksi(${t.id})" class="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded">Hapus</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Chart.js
    const ctx = document.getElementById('profitChart').getContext('2d');
    if (myChart) myChart.destroy();

    const sortedDates = Object.keys(reportData).sort();
    const sortedValues = sortedDates.map(d => reportData[d]);

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedDates,
            datasets: [{ label: 'Profit harian', data: sortedValues, borderColor: '#15803d', tension: 0.1 }]
        }
    });
}

// Sinkronisasi (Opsional)
async function saveSettings() {
    const val = document.getElementById('sheet-url').value;
    await db.settings.put({ id: 'sheet_url', value: val });
    alert("Konfigurasi tersimpan");
}

async function syncData() {
    if (!navigator.onLine) {
        alert("Anda sedang offline. Sinkronisasi akan dilakukan saat internet tersedia.");
        return;
    }

    const urlSet = await db.settings.get('sheet_url');
    if (!urlSet || !urlSet.value) {
        alert("Silakan masukkan Apps Script URL di menu Pengaturan terlebih dahulu.");
        showSection('settings');
        return;
    }
    const url = urlSet.value;

    const btn = document.getElementById('sync-btn');
    const originalText = btn.innerText;
    btn.innerText = "Syncing...";
    btn.disabled = true;
    
    try {
        const trans = await db.transaksi.toArray();
        const lahan = await db.lahan.toArray();
        const utang = await db.utang.toArray();

        const payload = {
            transactions: trans,
            lahan: lahan,
            utang: utang,
            timestamp: new Date().toISOString()
        };

        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            }
        });

        if (!response.ok) throw new Error("Server response not OK");
        
        const result = await response.text();
        alert("Berhasil dicadangkan ke Cloud: " + result);
    } catch (e) {
        console.error(e);
        alert("Gagal sinkronisasi: Pastikan URL Apps Script benar dan internet stabil.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

async function forceDownload() {
    if (!navigator.onLine) {
        alert("Perlu koneksi internet untuk Force Download.");
        return;
    }

    const urlSet = await db.settings.get('sheet_url');
    if (!urlSet || !urlSet.value) {
        alert("Silakan isi URL Apps Script dahulu.");
        return;
    }
    
    if(!confirm("Peringatan: Ini akan menghapus data lokal dan menggantinya dengan data dari Google Sheets. Lanjutkan?")) return;
    
    try {
        const response = await fetch(urlSet.value + "?action=get_all");
        if (!response.ok) throw new Error("Gagal mengambil data dari server.");
        
        const data = await response.json();
        
        // Gunakan transaksi Dexie agar lebih aman
        await db.transaction('rw', [db.lahan, db.transaksi, db.utang], async () => {
            await db.lahan.clear();
            if (data.lahan && data.lahan.length > 0) await db.lahan.bulkAdd(data.lahan);
            
            await db.transaksi.clear();
            if (data.transaksi && data.transaksi.length > 0) await db.transaksi.bulkAdd(data.transaksi);
            
            await db.utang.clear();
            if (data.utang && data.utang.length > 0) await db.utang.bulkAdd(data.utang);
        });
        
        alert("Data berhasil diperbarui dari Cloud. Aplikasi akan direfresh.");
        location.reload();
    } catch (e) {
        alert("Gagal ambil data: " + e.message);
    }
}

// Jalankan saat start
showSection('home');