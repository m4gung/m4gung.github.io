// === ELEMEN DOM ===
const themeToggle = document.getElementById('themeToggle');
const sqlInput = document.getElementById('sqlInput');
const sqlOutput = document.getElementById('sqlOutput');
const sqlDialect = document.getElementById('sqlDialect');

const clearBtn = document.getElementById('clearBtn');
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

// === FUNGSI INTI: FORMAT SQL ===
function processSQL(action) {
    const rawQuery = sqlInput.value.trim();
    if (!rawQuery) {
        sqlOutput.value = '';
        return;
    }

    try {
        if (action === 'format') {
            // Gunakan library sqlFormatter
            const formatted = sqlFormatter.format(rawQuery, {
                language: sqlDialect.value, // mysql, postgresql, dll
                tabWidth: 4,
                keywordCase: 'upper',       // Ubah SELECT, FROM, dll jadi huruf besar
                linesBetweenQueries: 2      // Spasi antar query jika ada lebih dari 1
            });
            sqlOutput.value = formatted;
        }
        else if (action === 'minify') {
            // Minify: Hapus baris baru dan spasi berlebih
            // (Cara sederhana mengubah query cantik kembali jadi 1 baris)
            const minified = rawQuery
                .replace(/\n/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            sqlOutput.value = minified;
        }
    } catch (error) {
        sqlOutput.value = "-- Terjadi kesalahan saat memformat SQL:\n" + error.message;
    }
}

// === EVENT LISTENERS ===
formatBtn.addEventListener('click', () => processSQL('format'));
minifyBtn.addEventListener('click', () => processSQL('minify'));
sqlDialect.addEventListener('change', () => processSQL('format')); // Auto format jika dialek diubah

// Opsional: Format otomatis setelah mengetik (diberi jeda agar tidak berat)
let typingTimer;
sqlInput.addEventListener('input', () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        if (sqlInput.value.trim() !== '') {
            processSQL('format');
        } else {
            sqlOutput.value = '';
        }
    }, 500); // Format setelah 0.5 detik berhenti mengetik
});

clearBtn.addEventListener('click', () => {
    sqlInput.value = '';
    sqlOutput.value = '';
    sqlInput.focus();
});

// Fitur Copy
copyBtn.addEventListener('click', async () => {
    const textToCopy = sqlOutput.value;
    if (!textToCopy) return;

    try {
        await navigator.clipboard.writeText(textToCopy);

        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Berhasil Disalin!';
        copyBtn.classList.remove('success'); // Hapus warna transparan default
        copyBtn.style.backgroundColor = 'var(--success)';
        copyBtn.style.color = 'white';

        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.classList.add('success');
            copyBtn.style.backgroundColor = '';
            copyBtn.style.color = '';
        }, 2000);
    } catch (err) {
        alert('Gagal menyalin teks!');
    }
});