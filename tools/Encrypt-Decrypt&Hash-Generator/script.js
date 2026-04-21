// === ELEMEN DOM ===
const themeToggle = document.getElementById('themeToggle');

// AES Elements
const aesInput = document.getElementById('aesInput');
const aesKey = document.getElementById('aesKey');
const btnEncrypt = document.getElementById('btnEncrypt');
const btnDecrypt = document.getElementById('btnDecrypt');
const aesOutput = document.getElementById('aesOutput');
const copyAesBtn = document.getElementById('copyAesBtn');

// Hash Elements
const hashInput = document.getElementById('hashInput');
const hashAlgo = document.getElementById('hashAlgo');
const btnHash = document.getElementById('btnHash');
const hashOutput = document.getElementById('hashOutput');
const copyHashBtn = document.getElementById('copyHashBtn');

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

// === FUNGSI COPY CLIPBOARD (Anti-Gagal) ===
async function copyToClipboard(text, btnElement) {
    if (text === '-' || !text) return;

    const showSuccess = () => {
        const originalText = btnElement.textContent;
        btnElement.textContent = '✅ Berhasil Disalin!';
        btnElement.style.backgroundColor = 'var(--success)';
        btnElement.style.color = 'white';
        setTimeout(() => {
            btnElement.textContent = originalText;
            btnElement.style.backgroundColor = '';
            btnElement.style.color = '';
        }, 2000);
    };

    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            showSuccess();
            return;
        } catch (err) { }
    }

    try {
        const tempArea = document.createElement("textarea");
        tempArea.value = text;
        tempArea.style.position = "absolute";
        tempArea.style.left = "-999999px";
        document.body.appendChild(tempArea);
        tempArea.select();
        document.execCommand("copy");
        document.body.removeChild(tempArea);
        showSuccess();
    } catch (err) {
        alert("Gagal menyalin teks.");
    }
}

// === LOGIKA: AES ENCRYPT / DECRYPT ===
btnEncrypt.addEventListener('click', () => {
    const text = aesInput.value;
    const key = aesKey.value;

    if (!text || !key) {
        alert("Harap isi Teks Pesan dan Kunci Rahasia!");
        return;
    }

    try {
        // Enkripsi menggunakan AES
        const encrypted = CryptoJS.AES.encrypt(text, key).toString();
        aesOutput.textContent = encrypted;
        aesOutput.style.color = "var(--success)";
    } catch (error) {
        aesOutput.textContent = "Error saat Enkripsi!";
        aesOutput.style.color = "var(--danger)";
    }
});

btnDecrypt.addEventListener('click', () => {
    const cipherText = aesInput.value.trim();
    const key = aesKey.value;

    if (!cipherText || !key) {
        alert("Harap isi Teks Cipher (Pesan teracak) dan Kunci Rahasia!");
        return;
    }

    try {
        // Dekripsi menggunakan AES
        const decryptedBytes = CryptoJS.AES.decrypt(cipherText, key);
        const originalText = decryptedBytes.toString(CryptoJS.enc.Utf8);

        if (!originalText) {
            // Jika hasilnya kosong, biasanya karena Password Salah
            throw new Error("Kunci rahasia salah atau format teks tidak valid.");
        }

        aesOutput.textContent = originalText;
        aesOutput.style.color = "var(--accent)";
    } catch (error) {
        aesOutput.textContent = "❌ Dekripsi Gagal: Password Salah atau Data Rusak.";
        aesOutput.style.color = "var(--danger)";
    }
});

copyAesBtn.addEventListener('click', () => copyToClipboard(aesOutput.textContent, copyAesBtn));

// === LOGIKA: HASH GENERATOR ===
function generateHash() {
    const text = hashInput.value;
    const algo = hashAlgo.value;

    if (!text) {
        hashOutput.textContent = "-";
        return;
    }

    let hashResult = "";

    // Panggil algoritma berdasarkan pilihan Dropdown
    switch (algo) {
        case 'MD5':
            hashResult = CryptoJS.MD5(text).toString();
            break;
        case 'SHA1':
            hashResult = CryptoJS.SHA1(text).toString();
            break;
        case 'SHA256':
            hashResult = CryptoJS.SHA256(text).toString();
            break;
        case 'SHA512':
            hashResult = CryptoJS.SHA512(text).toString();
            break;
    }

    hashOutput.textContent = hashResult;
    hashOutput.style.color = "var(--accent)";
}

btnHash.addEventListener('click', generateHash);

// Auto-hash saat user mengetik atau mengganti dropdown
hashInput.addEventListener('input', generateHash);
hashAlgo.addEventListener('change', generateHash);

copyHashBtn.addEventListener('click', () => copyToClipboard(hashOutput.textContent, copyHashBtn));