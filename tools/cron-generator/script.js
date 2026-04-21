// === DEKLARASI ELEMEN ===
const themeToggle = document.getElementById('themeToggle');

// Translator Elements
const cronInput = document.getElementById('cronInput');
const translateResult = document.getElementById('translateResult');
const humanReadable = document.getElementById('humanReadable');
const presetBtns = document.querySelectorAll('.preset-btn');

// Generator Elements
const genSelects = document.querySelectorAll('.gen-select');
const generatedCron = document.getElementById('generatedCron');
const genReadable = document.getElementById('genReadable');
const copyGenBtn = document.getElementById('copyGenBtn');

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

// === 1. FITUR TRANSLATOR (Cron ke Teks Manusia) ===
function translateCronStr(cronStr, targetElement, boxElement = null) {
    try {
        // Gunakan library cronstrue dengan opsi locale Bahasa Indonesia (id)
        const text = cronstrue.toString(cronStr, {
            locale: 'id',
            use24HourTimeFormat: true
        });

        targetElement.textContent = text;

        if (boxElement) {
            boxElement.className = 'result-box success';
            boxElement.querySelector('.result-icon').textContent = '✨';
        }
    } catch (error) {
        // Jika format cron tidak valid
        targetElement.textContent = "Format Cron tidak valid!";

        if (boxElement) {
            boxElement.className = 'result-box error';
            boxElement.querySelector('.result-icon').textContent = '❌';
        }
    }
}

// Event Listeners Translator
cronInput.addEventListener('input', () => {
    translateCronStr(cronInput.value, humanReadable, translateResult);
});

// Fitur Tombol Preset
presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const cronVal = btn.getAttribute('data-cron');
        cronInput.value = cronVal;
        translateCronStr(cronVal, humanReadable, translateResult);
    });
});


// === 2. FITUR GENERATOR (Dropdown UI ke Cron) ===
function updateGenerator() {
    // Ambil semua nilai dari dropdown berurutan (Menit, Jam, Tgl, Bln, Hari)
    const min = document.getElementById('genMin').value;
    const hour = document.getElementById('genHour').value;
    const dom = document.getElementById('genDom').value;
    const month = document.getElementById('genMonth').value;
    const dow = document.getElementById('genDow').value;

    // Gabungkan dengan spasi
    const finalCron = `${min} ${hour} ${dom} ${month} ${dow}`;

    generatedCron.textContent = finalCron;

    // Terjemahkan juga hasil generator ke bahasa manusia
    translateCronStr(finalCron, genReadable);
}

// Tambahkan event listener ke semua dropdown
genSelects.forEach(select => {
    select.addEventListener('change', updateGenerator);
});

// Fitur Copy
copyGenBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(generatedCron.textContent);

    const originalText = copyGenBtn.textContent;
    copyGenBtn.textContent = '✅ Berhasil Disalin!';
    copyGenBtn.style.backgroundColor = 'var(--success)';
    copyGenBtn.style.borderColor = 'var(--success)';

    setTimeout(() => {
        copyGenBtn.textContent = originalText;
        copyGenBtn.style.backgroundColor = '';
        copyGenBtn.style.borderColor = '';
    }, 2000);
});

// === INISIALISASI SAAT HALAMAN DIBUKA ===
window.addEventListener('DOMContentLoaded', () => {
    // Jalankan terjemahan pertama kali
    translateCronStr(cronInput.value, humanReadable, translateResult);
    updateGenerator();
});