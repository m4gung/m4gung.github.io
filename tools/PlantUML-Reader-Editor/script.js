// === INISIALISASI SPLIT.JS ===
// Membagi layar default: 40% Editor Kiri, 60% Preview Kanan
Split(['#input-pane', '#output-pane'], {
    sizes: [40, 60],        // Ukuran persentase awal
    minSize: 250,           // Lebar minimal setiap panel agar tidak sampai hilang (250px)
    gutterSize: 8,          // Ketebalan pembatas yang bisa di-drag
    cursor: 'col-resize'    // Bentuk kursor saat diarahkan ke pembatas
});

// === DEKLARASI ELEMEN (Kode kamu sebelumnya tetap di bawah ini) ===
const pumlInput = document.getElementById('pumlInput');
const renderOutput = document.getElementById('renderOutput');
const downloadSvgBtn = document.getElementById('downloadSvg');
const downloadPngBtn = document.getElementById('downloadPng');
const themeToggle = document.getElementById('themeToggle');

let typingTimer;
const doneTypingInterval = 500; // Tunggu 0.5 detik setelah ngetik sebelum render ulang
let currentEncoded = '';

// Template Diagram Bawaan
const DEFAULT_PUML = `@startuml
skinparam style strictuml
skinparam handwritten false
skinparam roundcorner 8

actor User
participant "Web Frontend" as Web
participant "API Server" as API
database "PostgreSQL" as DB

User -> Web : Klik "Simpan Data"
activate Web
Web -> API : POST /api/v1/data
activate API
API -> DB : INSERT INTO table
activate DB
DB --> API : Success
deactivate DB
API --> Web : 200 OK
deactivate API
Web --> User : Tampilkan Notifikasi
deactivate Web
@enduml`;

// === FUNGSI RENDER DIAGRAM ===
function updateDiagram() {
    const code = pumlInput.value.trim();

    if (!code) {
        renderOutput.innerHTML = '<div class="placeholder">Ketik kode PlantUML di sebelah kiri...</div>';
        currentEncoded = '';
        return;
    }

    try {
        // Encode teks menggunakan library
        currentEncoded = plantumlEncoder.encode(code);

        // Buat URL dengan format SVG
        const imgUrl = `https://www.plantuml.com/plantuml/svg/${currentEncoded}`;

        // Render ke layar (menambahkan timestamp agar browser tidak men-cache gambar lama)
        renderOutput.innerHTML = `<img src="${imgUrl}" alt="PlantUML Diagram" />`;
    } catch (err) {
        renderOutput.innerHTML = `<div class="error-msg">Gagal me-render: ${err.message}</div>`;
    }
}

// === EVENT LISTENER INPUT (DEBOUNCE) ===
pumlInput.addEventListener('input', () => {
    // Hapus timer sebelumnya jika pengguna masih mengetik
    clearTimeout(typingTimer);

    // Mulai hitung mundur 0.5 detik, lalu render
    typingTimer = setTimeout(updateDiagram, doneTypingInterval);
});

// === FUNGSI UNDUH (DOWNLOAD) ===
function downloadDiagram(format) {
    if (!currentEncoded) return alert('Tidak ada diagram untuk diunduh.');

    // URL langsung ke server PlantUML
    const url = `https://www.plantuml.com/plantuml/${format}/${currentEncoded}`;

    // Kita gunakan teknik Fetch + Blob untuk memaksa browser mengunduh file
    // ketimbang membuka file tersebut di tab baru.
    fetch(url)
        .then(response => response.blob())
        .then(blob => {
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = blobUrl;
            a.download = `diagram-${Date.now()}.${format}`;
            document.body.appendChild(a);
            a.click();

            // Bersihkan memori
            window.URL.revokeObjectURL(blobUrl);
            a.remove();
        })
        .catch(err => {
            // Jika terkena blokir CORS, fallback dengan membuka URL di tab baru
            window.open(url, '_blank');
        });
}

downloadSvgBtn.addEventListener('click', () => downloadDiagram('svg'));
downloadPngBtn.addEventListener('click', () => downloadDiagram('png'));

// === FITUR TEMA GELAP / TERANG ===
const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
});

// === INISIALISASI SAAT PERTAMA DIBUKA ===
window.addEventListener('DOMContentLoaded', () => {
    pumlInput.value = DEFAULT_PUML;
    updateDiagram();
});