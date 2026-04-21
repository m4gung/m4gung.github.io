// === ELEMEN DOM ===
const themeToggle = document.getElementById('themeToggle');
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const clearBtn = document.getElementById('clearBtn');
const searchInput = document.getElementById('searchInput');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const exportExcelBtn = document.getElementById('exportExcelBtn');

const tableHead = document.getElementById('tableHead');
const tableBody = document.getElementById('tableBody');
const rowCountBadge = document.getElementById('rowCount');

// === FITUR TEMA ===
const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeToggle.addEventListener('click', () => {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
});
function updateThemeIcon(theme) { themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙'; }

// === STATE MANAGEMENT ===
let globalData = [];      // Menyimpan data asli dari Excel/CSV
let filteredData = [];    // Menyimpan data hasil pencarian
let headers = [];         // Menyimpan daftar nama kolom
let currentSortCol = null;
let currentSortAsc = true;

// === FUNGSI: MEMBACA FILE DENGAN SHEETJS ===
uploadBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    // Gunakan readAsArrayBuffer agar mendukung format Excel (.xlsx) dengan sempurna
    reader.onload = (event) => {
        const data = new Uint8Array(event.target.result);
        try {
            // Membaca workbook menggunakan SheetJS
            const workbook = XLSX.read(data, { type: 'array' });

            // Ambil sheet pertama saja
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Konversi sheet ke JSON (Array of Objects)
            // defval: "" memastikan cell yang kosong tidak hilang dari object
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

            if (jsonData.length === 0) {
                alert("File kosong atau format tidak didukung.");
                return;
            }

            // Simpan ke State
            globalData = jsonData;
            filteredData = [...globalData];

            // Ekstrak nama kolom (headers) dari objek pertama
            headers = Object.keys(jsonData[0]);

            renderTable();

        } catch (err) {
            alert("Gagal membaca file. Pastikan itu adalah file CSV atau Excel yang valid.\nError: " + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
    fileInput.value = ''; // Reset input
});

// === FUNGSI: RENDER TABEL ===
function renderTable() {
    // Render Headers
    let theadHtml = '<tr>';
    headers.forEach(col => {
        // Tentukan panah sorting
        let sortClass = '';
        if (currentSortCol === col) {
            sortClass = currentSortAsc ? 'sort-asc' : 'sort-desc';
        }
        theadHtml += `<th data-col="${col}" class="${sortClass}">${col}</th>`;
    });
    theadHtml += '</tr>';
    tableHead.innerHTML = theadHtml;

    // Render Body
    let tbodyHtml = '';
    if (filteredData.length === 0) {
        tbodyHtml = `<tr><td colspan="${headers.length || 1}" class="empty-state">Tidak ada data untuk ditampilkan.</td></tr>`;
    } else {
        // Optimasi: Jika data lebih dari 1000 baris, render sebagian dulu agar peramban tidak hang
        // (Untuk production, gunakan virtual scrolling. Di sini kita limit 1000 baris untuk contoh)
        const renderLimit = Math.min(filteredData.length, 1000);

        for (let i = 0; i < renderLimit; i++) {
            const row = filteredData[i];
            tbodyHtml += '<tr>';
            headers.forEach(col => {
                // Escape HTML sederhana
                let cellValue = row[col];
                if (typeof cellValue === 'string') {
                    cellValue = cellValue.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                }
                tbodyHtml += `<td>${cellValue}</td>`;
            });
            tbodyHtml += '</tr>';
        }

        if (filteredData.length > 1000) {
            tbodyHtml += `<tr><td colspan="${headers.length}" class="empty-state" style="color:var(--warning)">Menampilkan 1000 baris pertama. Export untuk melihat seluruh data (${filteredData.length} baris).</td></tr>`;
        }
    }
    tableBody.innerHTML = tbodyHtml;

    // Update Status Badge
    rowCountBadge.textContent = `${filteredData.length} Baris`;

    // Pasang Event Listener untuk Sorting di tiap th
    const thElements = tableHead.querySelectorAll('th');
    thElements.forEach(th => {
        th.addEventListener('click', () => handleSort(th.getAttribute('data-col')));
    });
}

// === FUNGSI: SORTING DATA ===
function handleSort(colName) {
    if (!colName) return;

    if (currentSortCol === colName) {
        currentSortAsc = !currentSortAsc; // Balikkan arah jika kolom sama
    } else {
        currentSortCol = colName;
        currentSortAsc = true;
    }

    filteredData.sort((a, b) => {
        let valA = a[colName];
        let valB = b[colName];

        // Paksa ke tipe angka jika memungkinkan, agar urutan 1, 2, 10 benar (bukan 1, 10, 2)
        if (!isNaN(valA) && !isNaN(valB) && valA !== "" && valB !== "") {
            valA = Number(valA);
            valB = Number(valB);
        } else {
            valA = String(valA).toLowerCase();
            valB = String(valB).toLowerCase();
        }

        if (valA < valB) return currentSortAsc ? -1 : 1;
        if (valA > valB) return currentSortAsc ? 1 : -1;
        return 0;
    });

    renderTable();
}

// === FUNGSI: PENCARIAN (FILTER) ===
searchInput.addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();

    if (!keyword) {
        filteredData = [...globalData];
    } else {
        // Cari di seluruh kolom
        filteredData = globalData.filter(row => {
            return headers.some(col => {
                return String(row[col]).toLowerCase().includes(keyword);
            });
        });
    }

    // Reset sort saat mencari
    currentSortCol = null;
    renderTable();
});

// === FUNGSI: EXPORT DATA ===
function exportData(format) {
    if (filteredData.length === 0) {
        alert("Tidak ada data untuk diexport!");
        return;
    }

    // Ubah JSON kembali ke Sheet (Hanya data yang sudah difilter/disort)
    const worksheet = XLSX.utils.json_to_sheet(filteredData);

    // Buat Workbook baru
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data_Export");

    // Unduh File
    const timestamp = new Date().getTime();
    if (format === 'csv') {
        XLSX.writeFile(workbook, `Export_${timestamp}.csv`);
    } else {
        XLSX.writeFile(workbook, `Export_${timestamp}.xlsx`);
    }
}

exportCsvBtn.addEventListener('click', () => exportData('csv'));
exportExcelBtn.addEventListener('click', () => exportData('xlsx'));

clearBtn.addEventListener('click', () => {
    globalData = [];
    filteredData = [];
    headers = [];
    searchInput.value = '';
    currentSortCol = null;

    tableHead.innerHTML = '<tr><th>Menunggu File...</th></tr>';
    tableBody.innerHTML = '<tr><td class="empty-state">Silakan klik "Buka File" atau Drag & Drop file CSV/Excel ke halaman ini.</td></tr>';
    rowCountBadge.textContent = '0 Baris';
});

// Fitur Drag & Drop
const workspace = document.querySelector('.workspace-full');
workspace.addEventListener('dragover', (e) => e.preventDefault());
workspace.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        // Trigger event change secara manual
        const event = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(event);
    }
});