// === ELEMEN DOM ===
const themeToggle = document.getElementById('themeToggle');
const jsonInput = document.getElementById('jsonInput');
const jsonOutput = document.getElementById('jsonOutput');
const statusIndicator = document.getElementById('statusIndicator');

const pasteBtn = document.getElementById('pasteBtn');
const loadBtn = document.getElementById('loadBtn');
const clearBtn = document.getElementById('clearBtn');
const fileInput = document.getElementById('fileInput');

const formatBtn = document.getElementById('formatBtn');
const minifyBtn = document.getElementById('minifyBtn');
const copyBtn = document.getElementById('copyBtn');

// === FITUR LIGHT / DARK MODE ===
const savedTheme = localStorage.getItem('theme') || 'dark';
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
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    themeToggle.title = theme === 'dark' ? 'Ubah ke Terang' : 'Ubah ke Gelap';
}

// === FUNGSI INTI: PARSING & VALIDASI ===
function processJSON(action) {
    const rawData = jsonInput.value.trim();

    if (!rawData) {
        setStatus('Menunggu Input...', '');
        jsonOutput.value = '';
        return;
    }

    try {
        const parsedData = JSON.parse(rawData);

        if (action === 'format') {
            jsonOutput.value = JSON.stringify(parsedData, null, 4);
        } else if (action === 'minify') {
            jsonOutput.value = JSON.stringify(parsedData);
        }

        setStatus('✅ JSON Valid', 'valid');
    } catch (error) {
        jsonOutput.value = error.message;
        setStatus('❌ JSON Tidak Valid', 'invalid');
    }
}

function setStatus(message, className) {
    statusIndicator.textContent = message;
    statusIndicator.className = 'status-badge ' + className;
}

// === EVENT LISTENER: PANEL KIRI ===
pasteBtn.addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        jsonInput.value = text;
        processJSON('format');
    } catch (err) {
        alert('Gagal membaca clipboard. Pastikan browser memberikan izin.');
    }
});

loadBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        jsonInput.value = event.target.result;
        processJSON('format');
        fileInput.value = '';
    };
    reader.readAsText(file);
});

clearBtn.addEventListener('click', () => {
    jsonInput.value = '';
    jsonOutput.value = '';
    setStatus('Menunggu Input...', '');
});

// === EVENT LISTENER: PANEL KANAN ===
formatBtn.addEventListener('click', () => processJSON('format'));
minifyBtn.addEventListener('click', () => processJSON('minify'));

copyBtn.addEventListener('click', async () => {
    const textToCopy = jsonOutput.value;
    if (!textToCopy) return;

    try {
        await navigator.clipboard.writeText(textToCopy);

        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.style.backgroundColor = 'var(--success)';
        copyBtn.style.color = 'white';

        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.backgroundColor = 'transparent';
            copyBtn.style.color = 'var(--success)';
        }, 2000);
    } catch (err) {
        alert('Gagal menyalin teks!');
    }
});

// === REAL-TIME VALIDATION ===
jsonInput.addEventListener('input', () => {
    processJSON('format');
});