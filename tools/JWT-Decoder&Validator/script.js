// === ELEMEN DOM ===
const themeToggle = document.getElementById('themeToggle');
const jwtInput = document.getElementById('jwtInput');
const tokenStatus = document.getElementById('tokenStatus');
const coloredRaw = document.getElementById('coloredRaw');

const headerOutput = document.getElementById('headerOutput');
const payloadOutput = document.getElementById('payloadOutput');
const signatureOutput = document.getElementById('signatureOutput');

const iatText = document.getElementById('iatText');
const nbfText = document.getElementById('nbfText');
const expText = document.getElementById('expText');

const clearBtn = document.getElementById('clearBtn');
const exampleBtn = document.getElementById('exampleBtn');

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

// === HELPER: BASE64URL DECODER (Aman untuk UTF-8) ===
function decodeBase64Url(base64UrlStr) {
    try {
        // Ganti karakter spesifik Base64Url ke Base64 standar
        let base64 = base64UrlStr.replace(/-/g, '+').replace(/_/g, '/');
        // Tambahkan padding '=' jika kurang
        while (base64.length % 4) { base64 += '='; }

        // Decode menggunakan textDecoder agar emoji/karakter UTF-8 aman
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        const decoder = new TextDecoder('utf-8');
        return JSON.parse(decoder.decode(bytes));
    } catch (error) {
        throw new Error("Gagal melakukan decode Base64Url.");
    }
}

// === HELPER: FORMAT TANGGAL ===
function formatTimestamp(unixSeconds) {
    if (!unixSeconds) return "-";
    const date = new Date(unixSeconds * 1000);
    // Format: 21 Apr 2026, 14:30:00
    return date.toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
}

function setStatus(msg, className) {
    tokenStatus.textContent = msg;
    tokenStatus.className = `status-badge ${className}`;
}

// === ENGINE: JWT DECODER ===
function processJWT() {
    const rawToken = jwtInput.value.trim();

    // Reset Data
    headerOutput.value = "";
    payloadOutput.value = "";
    signatureOutput.textContent = "Signature...";
    iatText.textContent = "-";
    nbfText.textContent = "-";
    expText.innerHTML = "-";
    coloredRaw.innerHTML = "Mulai ketik untuk melihat anatomi...";

    if (!rawToken) {
        setStatus("Menunggu Token...", "");
        return;
    }

    const parts = rawToken.split('.');

    if (parts.length !== 3) {
        setStatus("❌ Format Tidak Valid", "invalid");
        coloredRaw.innerHTML = `<span style="color:var(--danger)">Format Token tidak dikenali. JWT harus terdiri dari 3 bagian yang dipisah oleh titik (.).</span>`;
        return;
    }

    const [header, payload, signature] = parts;

    // Render Raw Colored Breakdown
    coloredRaw.innerHTML = `
        <span class="text-header">${header}</span>.<span class="text-payload">${payload}</span>.<span class="text-signature">${signature}</span>
    `;

    try {
        // Decode Header & Payload
        const decodedHeader = decodeBase64Url(header);
        const decodedPayload = decodeBase64Url(payload);

        // Tampilkan di Textarea
        headerOutput.value = JSON.stringify(decodedHeader, null, 4);
        payloadOutput.value = JSON.stringify(decodedPayload, null, 4);
        signatureOutput.textContent = signature;

        // Analisis Waktu & Expiration
        const nowUnix = Math.floor(Date.now() / 1000);
        let isValidFormat = true;
        let isExpired = false;

        if (decodedPayload.iat) iatText.textContent = formatTimestamp(decodedPayload.iat);
        if (decodedPayload.nbf) nbfText.textContent = formatTimestamp(decodedPayload.nbf);

        if (decodedPayload.exp) {
            const expFormatted = formatTimestamp(decodedPayload.exp);

            if (decodedPayload.exp < nowUnix) {
                isExpired = true;
                expText.innerHTML = `${expFormatted} <span class="time-expired">(Expired)</span>`;
            } else {
                expText.innerHTML = `${expFormatted} <span class="time-active">(Active)</span>`;
            }
        } else {
            expText.innerHTML = `<span style="color:var(--text-muted)">Token tidak memiliki batas waktu (No Expiration)</span>`;
        }

        // Tentukan Status Utama
        if (isExpired) {
            setStatus("⚠️ Token Expired", "warning");
        } else {
            setStatus("✅ Valid Format", "valid");
        }

    } catch (err) {
        setStatus("❌ Gagal Decode", "invalid");
        headerOutput.value = "Terjadi kesalahan saat decode isi token.";
    }
}

// === EVENT LISTENERS ===
jwtInput.addEventListener('input', processJWT);

clearBtn.addEventListener('click', () => {
    jwtInput.value = '';
    processJWT();
    jwtInput.focus();
});

exampleBtn.addEventListener('click', () => {
    // Header: { "alg": "HS256", "typ": "JWT" }
    // Payload: { "sub": "1234567890", "name": "John Doe", "role": "ADMIN", "iat": 1713689404, "exp": 253402300799 } (Exp in year 9999)
    const mockJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzEzNjg5NDA0LCJleHAiOjI1MzQwMjMwMDc5OX0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

    jwtInput.value = mockJwt;
    processJWT();
});