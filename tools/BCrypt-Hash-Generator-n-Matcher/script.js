// Daftarkan bcrypt dari library dcodeIO
const bcrypt = dcodeIO.bcrypt;
// === ELEMEN DOM ===
const themeToggle = document.getElementById('themeToggle');

// Generator Elements
const genInput = document.getElementById('genInput');
const genRounds = document.getElementById('genRounds');
const btnGenerate = document.getElementById('btnGenerate');
const genOutput = document.getElementById('genOutput');
const copyGenBtn = document.getElementById('copyGenBtn');

// Matcher Elements
const matchInput = document.getElementById('matchInput');
const matchHash = document.getElementById('matchHash');
const btnMatch = document.getElementById('btnMatch');
const matchResult = document.getElementById('matchResult');
const matchIcon = document.getElementById('matchIcon');
const matchText = document.getElementById('matchText');

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

// === FUNGSI 1: BCRYPT GENERATOR ===
btnGenerate.addEventListener('click', () => {
    const plainText = genInput.value;
    let rounds = parseInt(genRounds.value, 10);

    if (!plainText) {
        alert("Harap masukkan password mentah terlebih dahulu.");
        genInput.focus();
        return;
    }

    // Batasi cost minimal 4 dan maksimal 18 agar browser tidak hang (crash)
    if (isNaN(rounds) || rounds < 4) rounds = 4;
    if (rounds > 18) {
        alert("Rounds lebih dari 18 akan membuat browser hang. Maksimal di-set ke 18.");
        rounds = 18;
    }
    genRounds.value = rounds;

    // Set UI Loading State
    btnGenerate.textContent = "⏳ Sedang Menghitung Hash...";
    btnGenerate.disabled = true;
    copyGenBtn.disabled = true;
    genOutput.textContent = "Processing...";
    genOutput.style.color = "var(--text-muted)";

    // Gunakan setTimeout agar UI sempat me-render text "Sedang Menghitung" sebelum thread diblokir oleh komputasi BCrypt
    setTimeout(() => {
        try {
            // Gunakan dcodeIO.bcrypt untuk generate
            const salt = bcrypt.genSaltSync(rounds);
            const hash = bcrypt.hashSync(plainText, salt);

            genOutput.textContent = hash;
            genOutput.style.color = "var(--accent)";
            copyGenBtn.disabled = false;
        } catch (error) {
            genOutput.textContent = "Error: " + error.message;
            genOutput.style.color = "var(--danger)";
        } finally {
            btnGenerate.textContent = "Generate BCrypt Hash";
            btnGenerate.disabled = false;
        }
    }, 50);
});

// Fitur Copy Hash (Anti-Gagal / Fallback Support)
copyGenBtn.addEventListener('click', async () => {
    const hashValue = genOutput.textContent;
    if (hashValue === '-' || hashValue === 'Processing...') return;

    // Fungsi kecil untuk menampilkan efek sukses pada tombol
    const showSuccessEffect = () => {
        const originalText = copyGenBtn.textContent;
        copyGenBtn.textContent = '✅ Berhasil Disalin!';
        copyGenBtn.style.backgroundColor = 'var(--success)';
        copyGenBtn.style.color = 'white';

        setTimeout(() => {
            copyGenBtn.textContent = originalText;
            copyGenBtn.style.backgroundColor = '';
            copyGenBtn.style.color = '';
        }, 2000);
    };

    // 1. Coba Cara Modern (Jika browser mendukung dan diizinkan)
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(hashValue);
            showSuccessEffect();
            return; // Hentikan fungsi jika berhasil
        } catch (err) {
            console.warn("Clipboard API diblokir, beralih ke metode Fallback...");
        }
    }

    // 2. Cara Fallback (Cadangan untuk file:/// lokal atau browser lawas)
    try {
        // Buat elemen textarea sementara
        const tempTextArea = document.createElement("textarea");
        tempTextArea.value = hashValue;

        // Sembunyikan elemen jauh dari layar agar tidak merusak tampilan
        tempTextArea.style.position = "absolute";
        tempTextArea.style.left = "-999999px";

        document.body.appendChild(tempTextArea);

        // Seleksi dan salin
        tempTextArea.select();
        document.execCommand("copy");

        // Hapus elemen sementaranya
        document.body.removeChild(tempTextArea);

        showSuccessEffect(); // Tampilkan notifikasi sukses
    } catch (err) {
        // Jika tingkat keamanan browser sangat tinggi (sangat jarang terjadi)
        alert('Gagal menyalin secara otomatis. Silakan blok manual teks hash-nya lalu CTRL+C.');
    }
});

// === FUNGSI 2: BCRYPT MATCHER ===
btnMatch.addEventListener('click', () => {
    const plainText = matchInput.value;
    const hashToTest = matchHash.value.trim();

    if (!plainText || !hashToTest) {
        alert("Harap isi kedua kolom (Password Mentah & Hash).");
        return;
    }

    // Validasi sederhana format BCrypt (biasanya berawalan $2a$, $2b$, atau $2y$)
    if (!hashToTest.startsWith('$2a$') && !hashToTest.startsWith('$2b$') && !hashToTest.startsWith('$2y$')) {
        matchResult.className = 'result-box error';
        matchIcon.textContent = '❌';
        matchText.textContent = "Format Hash Tidak Valid (Bukan BCrypt)";
        matchResult.classList.remove('hidden');
        return;
    }

    // Set UI Loading
    btnMatch.textContent = "⏳ Sedang Mencocokkan...";
    btnMatch.disabled = true;

    setTimeout(() => {
        try {
            // Proses komparasi
            const isMatch = bcrypt.compareSync(plainText, hashToTest);

            if (isMatch) {
                matchResult.className = 'result-box success';
                matchIcon.textContent = '✅';
                matchText.textContent = "COCOK (MATCH!)";
            } else {
                matchResult.className = 'result-box error';
                matchIcon.textContent = '❌';
                matchText.textContent = "TIDAK COCOK (NO MATCH)";
            }

            matchResult.classList.remove('hidden');
        } catch (error) {
            matchResult.className = 'result-box error';
            matchIcon.textContent = '⚠️';
            matchText.textContent = "Error: " + error.message;
            matchResult.classList.remove('hidden');
        } finally {
            btnMatch.textContent = "Bandingkan (Verify)";
            btnMatch.disabled = false;
        }
    }, 50);
});