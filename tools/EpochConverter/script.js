// === DEKLARASI ELEMEN ===
const themeToggle = document.getElementById('themeToggle');
const liveEpoch = document.getElementById('liveEpoch');
const copyLiveBtn = document.getElementById('copyLiveBtn');

// Card 1
const epochInput = document.getElementById('epochInput');
const btnEpochToDate = document.getElementById('btnEpochToDate');
const epochResult = document.getElementById('epochResult');

// Card 2
const dateInput = document.getElementById('dateInput');
const tzSelect = document.getElementById('tzSelect');
const btnDateToEpoch = document.getElementById('btnDateToEpoch');
const dateResult = document.getElementById('dateResult');

// === FITUR LIGHT / DARK MODE ===
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

// === 1. LIVE EPOCH CLOCK ===
function updateLiveClock() {
    // Math.floor digunakan karena Date.now() mengembalikan milidetik
    // Backend standard (Unix) menggunakan detik.
    liveEpoch.textContent = Math.floor(Date.now() / 1000);
}
setInterval(updateLiveClock, 1000); // Update setiap 1 detik
updateLiveClock();

copyLiveBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(liveEpoch.textContent);
    copyLiveBtn.textContent = "Tersalin!";
    setTimeout(() => copyLiveBtn.textContent = "Salin", 1500);
});

// === 2. EPOCH TO DATE CONVERTER ===
btnEpochToDate.addEventListener('click', () => {
    let val = epochInput.value.trim();
    if (!val) return;

    val = parseInt(val, 10);

    // AUTO-DETECT: Jika digitnya kurang dari 12, kemungkinan besar itu Detik.
    // Jika lebih panjang, kemungkinan itu Milidetik (contoh Javascript Date.now())
    const dateObj = new Date(val < 10000000000 ? val * 1000 : val);

    // Cek apakah tanggal valid
    if (isNaN(dateObj.getTime())) {
        alert("Format angka tidak valid!");
        return;
    }

    // Tampilkan di UI
    document.getElementById('resUtc').textContent = dateObj.toUTCString();
    document.getElementById('resLocal').textContent = dateObj.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'long' });
    document.getElementById('resRelative').textContent = getRelativeTime(dateObj);

    epochResult.classList.remove('hidden');
});

// === 3. DATE TO EPOCH CONVERTER ===
btnDateToEpoch.addEventListener('click', () => {
    const dateVal = dateInput.value;
    if (!dateVal) return;

    let dateObj;

    if (tzSelect.value === 'utc') {
        // Jika user memilih UTC, kita tambahkan huruf 'Z' di belakang string
        // agar JS menganggapnya sebagai waktu UTC
        dateObj = new Date(dateVal + 'Z');
    } else {
        // Waktu lokal browser
        dateObj = new Date(dateVal);
    }

    if (isNaN(dateObj.getTime())) {
        alert("Tanggal tidak valid!");
        return;
    }

    const ms = dateObj.getTime();
    const sec = Math.floor(ms / 1000);

    // Tampilkan di UI
    document.getElementById('resSec').textContent = sec;
    document.getElementById('resMs').textContent = ms;
    document.getElementById('resIso').textContent = dateObj.toISOString();

    dateResult.classList.remove('hidden');
});

// SET NILAI DEFAULT INPUT DATE SAAT HALAMAN DIBUKA
window.addEventListener('DOMContentLoaded', () => {
    // Format yang dibutuhkan input datetime-local adalah: YYYY-MM-DDThh:mm:ss
    const now = new Date();
    // Trick kecil membuang zona waktu agar formatnya pas untuk input HTML
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    dateInput.value = now.toISOString().slice(0, 16);
});

// === FUNGSI TAMBAHAN: MENGHITUNG WAKTU RELATIF ===
// (Contoh: "2 hari yang lalu" atau "Dalam 3 jam")
function getRelativeTime(date) {
    const rtf = new Intl.RelativeTimeFormat('id', { numeric: 'auto' });
    const daysDifference = Math.round((date - new Date()) / (1000 * 60 * 60 * 24));

    if (daysDifference === 0) {
        const hoursDiff = Math.round((date - new Date()) / (1000 * 60 * 60));
        if (hoursDiff === 0) {
            const minDiff = Math.round((date - new Date()) / (1000 * 60));
            return rtf.format(minDiff, 'minute');
        }
        return rtf.format(hoursDiff, 'hour');
    }
    return rtf.format(daysDifference, 'day');
}