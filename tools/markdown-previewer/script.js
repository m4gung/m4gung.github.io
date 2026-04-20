// === DEKLARASI ELEMEN ===
const themeToggle = document.getElementById('themeToggle');
const mdInput = document.getElementById('mdInput');
const mdOutput = document.getElementById('mdOutput');
const clearBtn = document.getElementById('clearBtn');
const pdfBtn = document.getElementById('pdfBtn');
// === FITUR LIGHT / DARK MODE ===
const savedTheme = localStorage.getItem('theme') || 'dark';
const hljsTheme = document.getElementById('hljsTheme'); // Ambil elemen link CSS Highlight.js

document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
    if (theme === 'dark') {
        themeToggle.textContent = '☀️';
        themeToggle.title = 'Ubah ke Terang';
        // Gunakan tema gelap untuk syntax highlighting
        hljsTheme.href = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github-dark.min.css";
    } else {
        themeToggle.textContent = '🌙';
        themeToggle.title = 'Ubah ke Gelap';
        // Gunakan tema terang untuk syntax highlighting
        hljsTheme.href = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github.min.css";
    }
}

// === INISIALISASI SPLIT.JS ===
Split(['#input-pane', '#output-pane'], {
    sizes: [50, 50],
    minSize: 200,
    gutterSize: 8,
    cursor: 'col-resize'
});

// === KONFIGURASI MARKED & HIGHLIGHT.JS ===
marked.setOptions({
    breaks: true,
    highlight: function (code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
    }
});

// === FUNGSI UTAMA: UPDATE PREVIEW ===
function updatePreview() {
    const markdownText = mdInput.value;
    mdOutput.innerHTML = marked.parse(markdownText);
    localStorage.setItem('modernMarkdownSaved', markdownText);
}

mdInput.addEventListener('input', updatePreview);

// === TOMBOL AKSI ===
clearBtn.addEventListener('click', () => {
    if (confirm("Yakin ingin menghapus semua teks?")) {
        mdInput.value = '';
        updatePreview();
    }
});

pdfBtn.addEventListener('click', () => {
    // Membuka dialog print bawaan browser (Gunakan Save as PDF)
    window.print();
});

// === LOAD DATA AWAL ===
window.addEventListener('DOMContentLoaded', () => {
    const savedData = localStorage.getItem('modernMarkdownSaved');

    if (savedData) {
        mdInput.value = savedData;
    } else {
        mdInput.value = `# ✨ Modern Markdown Editor\n\nKetik di kiri, lihat hasilnya di kanan.\n\n## Syntax Highlighting\n\`\`\`javascript\nfunction sayHello(name) {\n    console.log(\`Halo, \${name}!\`);\n}\nsayHello('Developer');\n\`\`\`\n\n> Coba tekan tombol ☀️/🌙 di pojok kanan atas!`;
    }
    updatePreview();
});

// === FITUR DRAG & DROP FILE ===
window.addEventListener('dragover', (e) => {
    e.preventDefault();
    document.body.classList.add('drag-active');
});

window.addEventListener('dragleave', (e) => {
    if (e.clientX === 0 || e.clientY === 0) {
        document.body.classList.remove('drag-active');
    }
});

window.addEventListener('drop', (e) => {
    e.preventDefault();
    document.body.classList.remove('drag-active');

    if (e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.name.endsWith('.md') || file.name.endsWith('.txt') || file.type.includes('text/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                mdInput.value = event.target.result;
                updatePreview();
            };
            reader.readAsText(file);
        } else {
            alert("Harap masukkan file berformat Markdown (.md) atau Teks (.txt)");
        }
    }
});