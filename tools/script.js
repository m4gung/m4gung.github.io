// === FITUR LIGHT / DARK MODE ===
const themeToggle = document.getElementById('themeToggle');

// Cek apakah user sudah punya preferensi tema sebelumnya
const savedTheme = localStorage.getItem('theme') || 'dark';

// Terapkan tema saat halaman dimuat
document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

// Event klik pada tombol tema
themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    // Ubah atribut HTML dan simpan ke Local Storage
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Perbarui ikon matahari/bulan
    updateThemeIcon(newTheme);
});

// Fungsi untuk mengganti ikon tombol
function updateThemeIcon(theme) {
    if (theme === 'dark') {
        themeToggle.textContent = '☀️';
        themeToggle.title = 'Ubah ke Terang';
    } else {
        themeToggle.textContent = '🌙';
        themeToggle.title = 'Ubah ke Gelap';
    }
}