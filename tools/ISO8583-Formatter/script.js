// === ELEMEN DOM ===
const themeToggle = document.getElementById('themeToggle');
const isoInput = document.getElementById('isoInput');
const isoOutput = document.getElementById('isoOutput');
const specBadge = document.getElementById('specBadge');

const uploadSpecBtn = document.getElementById('uploadSpecBtn');
const specFile = document.getElementById('specFile');
const clearBtn = document.getElementById('clearBtn');
const parseBtn = document.getElementById('parseBtn');
const copyBtn = document.getElementById('copyBtn');

// === KAMUS DEFAULT (WIKIPEDIA ISO 8583) ===
// Kita jadikan konstan agar bisa digunakan sebagai fallback penamaan
const DEFAULT_SPEC = {
    2: { name: "Primary Account Number (PAN)", type: "LLVAR" },
    3: { name: "Processing Code", type: "FIXED", length: 6 },
    4: { name: "Amount, transaction", type: "FIXED", length: 12 },
    7: { name: "Transmission date & time", type: "FIXED", length: 10 },
    11: { name: "System trace audit number (STAN)", type: "FIXED", length: 6 },
    12: { name: "Time, local transaction", type: "FIXED", length: 6 },
    13: { name: "Date, local transaction", type: "FIXED", length: 4 },
    14: { name: "Date, expiration", type: "FIXED", length: 4 },
    15: { name: "Date, settlement", type: "FIXED", length: 4 },
    18: { name: "Merchant type", type: "FIXED", length: 4 },
    22: { name: "Point of service entry mode", type: "FIXED", length: 3 },
    25: { name: "Point of service condition code", type: "FIXED", length: 2 },
    26: { name: "Point of service PIN capture code", type: "FIXED", length: 2 },
    28: { name: "Amount, transaction fee", type: "FIXED", length: 9 },
    29: { name: "Amount, settlement fee", type: "FIXED", length: 9 },
    30: { name: "Amount, transaction processing fee", type: "FIXED", length: 9 },
    31: { name: "Amount, settlement processing fee", type: "FIXED", length: 9 },
    32: { name: "Acquiring institution identification code", type: "LLVAR" },
    33: { name: "Forwarding institution identification code", type: "LLVAR" },
    34: { name: "Primary account number, extended", type: "LLVAR" },
    35: { name: "Track 2 data", type: "LLVAR" },
    37: { name: "Retrieval reference number", type: "FIXED", length: 12 },
    38: { name: "Authorization identification response", type: "FIXED", length: 6 },
    39: { name: "Response code", type: "FIXED", length: 2 },
    41: { name: "Card acceptor terminal identification", type: "FIXED", length: 8 },
    42: { name: "Card acceptor identification code", type: "FIXED", length: 15 },
    43: { name: "Card acceptor name/location", type: "FIXED", length: 40 },
    48: { name: "Additional data - private", type: "LLLVAR" },
    49: { name: "Currency code, transaction", type: "FIXED", length: 3 },
    50: { name: "Currency code, settlement", type: "FIXED", length: 3 },
    52: { name: "Personal identification number data", type: "FIXED", length: 16 },
    53: { name: "Security related control information", type: "FIXED", length: 16 },
    54: { name: "Additional amounts", type: "LLLVAR" },
    56: { name: "Reserved ISO", type: "LLLVAR" },
    60: { name: "Reserved National", type: "LLLVAR" },
    61: { name: "Reserved Private", type: "LLLVAR" },
    63: { name: "Network Data", type: "LLLVAR" },
    66: { name: "Settlement code", type: "FIXED", length: 1 },
    70: { name: "Network management information code", type: "FIXED", length: 3 },
    76: { name: "Debits, number", type: "FIXED", length: 10 },
    77: { name: "Debits, reversal number", type: "FIXED", length: 10 },
    80: { name: "Inquiries number", type: "FIXED", length: 10 },
    84: { name: "Debits, processing fee amount", type: "FIXED", length: 12 },
    85: { name: "Debits, transaction fee amount", type: "FIXED", length: 12 },
    88: { name: "Debits, amount", type: "FIXED", length: 16 },
    89: { name: "Debits, reversal amount", type: "FIXED", length: 16 },
    90: { name: "Original data elements", type: "FIXED", length: 42 },
    95: { name: "Replacement amounts", type: "FIXED", length: 42 },
    97: { name: "Amount, net settlement", type: "FIXED", length: 17 },
    98: { name: "Payee", type: "FIXED", length: 25 },
    99: { name: "Settlement institution identification code", type: "LLVAR" },
    100: { name: "Receiving institution identification code", type: "LLVAR" },
    102: { name: "Account identification 1", type: "LLVAR" },
    103: { name: "Account identification 2", type: "LLVAR" },
    104: { name: "Transaction description", type: "LLLVAR" },
    128: { name: "Message Authentication Code (MAC)", type: "FIXED", length: 16 }
};

let isoSpec = JSON.parse(JSON.stringify(DEFAULT_SPEC));
let parsedResultJson = {};

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

// === HELPER: HEX KE BINARY ===
function hexToBinary(hex) {
    let binary = "";
    for (let i = 0; i < hex.length; i++) {
        binary += parseInt(hex[i], 16).toString(2).padStart(4, '0');
    }
    return binary;
}

// === ENGINE: ISO8583 PARSER (DINAMIS) ===
function parseISO8583() {
    // PERBAIKAN: Hanya gunakan trim() agar spasi di dalam string (seperti pada Field 43) tidak hilang
    const raw = isoInput.value.trim();

    if (!raw) {
        isoOutput.innerHTML = "Menunggu input...";
        return;
    }

    try {
        parsedResultJson = {};
        let cursor = 0;
        let htmlBuilder = "";

        // 1. Ekstrak MTI
        const mti = raw.substring(cursor, cursor + 4);
        cursor += 4;
        htmlBuilder += `<div class="iso-row"><div class="iso-field">MTI</div><div class="iso-name">Message Type Indicator</div><div class="iso-value">${mti}</div></div>`;
        parsedResultJson['MTI'] = mti;

        // 2. Ekstrak Primary Bitmap
        const primaryBitmapHex = raw.substring(cursor, cursor + 16);
        cursor += 16;
        let bitmapBinary = hexToBinary(primaryBitmapHex);
        htmlBuilder += `<div class="iso-row"><div class="iso-field">BIT</div><div class="iso-name">Primary Bitmap</div><div class="iso-value">${primaryBitmapHex}</div></div>`;

        // 3. Ekstrak Secondary Bitmap (Jika ada)
        if (bitmapBinary[0] === '1') {
            const secondaryBitmapHex = raw.substring(cursor, cursor + 16);
            cursor += 16;
            bitmapBinary += hexToBinary(secondaryBitmapHex);
            htmlBuilder += `<div class="iso-row"><div class="iso-field">BIT2</div><div class="iso-name">Secondary Bitmap</div><div class="iso-value">${secondaryBitmapHex}</div></div>`;
        }

        // 4. Iterasi Data Elements
        let dataElementsHtml = "<br><strong>--- DATA ELEMENTS ---</strong><br>";

        for (let i = 1; i < bitmapBinary.length; i++) {
            if (bitmapBinary[i] === '1') {
                const fieldNumber = i + 1;
                const fieldSpec = isoSpec[fieldNumber];

                if (!fieldSpec) {
                    throw new Error(`Field [${fieldNumber}] aktif di Bitmap, tapi tidak ada di XML Spec. Berhenti di posisi ${cursor}.`);
                }

                let value = "";
                let len = 0;

                let lenIndicatorSize = 0;
                if (fieldSpec.type.endsWith("VAR")) {
                    lenIndicatorSize = fieldSpec.type.indexOf("VAR");
                }

                if (fieldSpec.type === "FIXED") {
                    len = fieldSpec.length;
                    value = raw.substring(cursor, cursor + len);
                    cursor += len;
                } else if (lenIndicatorSize > 0) {
                    const varLenStr = raw.substring(cursor, cursor + lenIndicatorSize);
                    len = parseInt(varLenStr, 10);

                    if (isNaN(len)) throw new Error(`Gagal membaca panjang dinamis pada Field ${fieldNumber}`);

                    cursor += lenIndicatorSize;
                    value = raw.substring(cursor, cursor + len);
                    cursor += len;
                }

                // Ganti spasi kosong dengan karakter HTML khusus (&nbsp;) agar terlihat visual di layar
                const displayValue = value.replace(/ /g, '&nbsp;');

                dataElementsHtml += `
                    <div class="iso-row">
                        <div class="iso-field">[${String(fieldNumber).padStart(3, '0')}]</div>
                        <div class="iso-name">${fieldSpec.name}</div>
                        <div class="iso-value" style="font-family: 'Fira Code', monospace;">${displayValue}</div>
                    </div>`;

                parsedResultJson[`Field_${fieldNumber}`] = value;
            }
        }

        isoOutput.innerHTML = htmlBuilder + dataElementsHtml;

        if (cursor < raw.length) {
            isoOutput.innerHTML += `<br><div style="color:var(--warning); padding-top: 15px;"><strong>⚠️ Sisa String Terdeteksi:</strong><br><span style="font-family:monospace; word-break:break-all;">${raw.substring(cursor)}</span></div>`;
        }

    } catch (error) {
        isoOutput.innerHTML = `<div class="iso-error">❌ Parsing Error: <br><br>${error.message}</div>`;
    }
}

// === FITUR UPLOAD SPEC .XML ===
uploadSpecBtn.addEventListener('click', () => { specFile.click(); });

specFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(event.target.result, "text/xml");

            if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
                throw new Error("Struktur XML tidak valid.");
            }

            // AUTO DETECT: Apakah jPOS, j8583, atau XML biasa
            const isJpos = xmlDoc.getElementsByTagName("isopackager").length > 0;
            const isJ8583 = xmlDoc.getElementsByTagName("j8583-config").length > 0;

            let targetFields;
            if (isJpos) {
                targetFields = [...xmlDoc.getElementsByTagName("isofield"), ...xmlDoc.getElementsByTagName("isofieldpackager")];
            } else if (isJ8583) {
                targetFields = xmlDoc.getElementsByTagName("field");
            } else {
                targetFields = xmlDoc.getElementsByTagName("field");
            }

            if (targetFields.length === 0) throw new Error("Tag field tidak ditemukan.");

            let uploadedSpec = {};

            for (let i = 0; i < targetFields.length; i++) {
                const node = targetFields[i];
                let id, name, type, length;

                // === LOGIKA PARSING J8583 ===
                if (isJ8583) {
                    id = parseInt(node.getAttribute("num"), 10);
                    let rawType = node.getAttribute("type");
                    let rawLen = node.getAttribute("length");

                    if (!rawType) continue; // Skip jika tidak ada tipe
                    rawType = rawType.toUpperCase();

                    // j8583 tidak memiliki atribut "name", jadi kita gunakan fallback dari DEFAULT_SPEC
                    name = DEFAULT_SPEC[id] ? DEFAULT_SPEC[id].name : `Field ${id} (${rawType})`;

                    // Transformasi tipe khusus j8583
                    if (rawType.endsWith("VAR")) {
                        type = rawType;
                    } else if (rawType === "AMOUNT") {
                        type = "FIXED"; length = 12;
                    } else if (rawType === "DATE10") {
                        type = "FIXED"; length = 10;
                    } else if (rawType === "DATE4") {
                        type = "FIXED"; length = 4;
                    } else if (rawType === "TIME") {
                        type = "FIXED"; length = 6;
                    } else {
                        // ALPHA, NUMERIC
                        type = "FIXED";
                        length = parseInt(rawLen, 10);
                    }
                }
                // === LOGIKA PARSING JPOS & SIMPLE XML ===
                else {
                    if (isJpos && node.parentNode.tagName !== "isopackager") continue; // Abaikan sub-field

                    id = parseInt(node.getAttribute("id"), 10);
                    name = node.getAttribute("name");
                    length = node.getAttribute("length") ? parseInt(node.getAttribute("length"), 10) : null;

                    const className = node.getAttribute("class"); // jPOS
                    type = node.getAttribute("type");             // Simple XML

                    // Transformasi kelas jPOS
                    if (isJpos && className) {
                        if (className.includes("LLLLLL")) type = "LLLLLLVAR";
                        else if (className.includes("LLLLL")) type = "LLLLLVAR";
                        else if (className.includes("LLLL")) type = "LLLLVAR";
                        else if (className.includes("LLL")) type = "LLLVAR";
                        else if (className.includes("LL")) type = "LLVAR";
                        else if (className.includes("L")) type = "LVAR";
                        else type = "FIXED";
                    } else if (type) {
                        type = type.toUpperCase();
                    }

                    if (node.tagName === "isofieldpackager") {
                        name = `${name} (Sub-Packager)`;
                    }
                }

                // Masukkan ke spesifikasi baru
                if (id !== 0 && id && name && type) {
                    uploadedSpec[id] = { name: name, type: type };
                    if (length) uploadedSpec[id].length = length;
                }
            }

            isoSpec = uploadedSpec;

            // Ubah Badge sesuai tipe XML yang dideteksi
            if (isJpos) specBadge.textContent = `Spec: jPOS (${file.name})`;
            else if (isJ8583) specBadge.textContent = `Spec: j8583 (${file.name})`;
            else specBadge.textContent = `Spec: Custom XML (${file.name})`;

            specBadge.className = "status-badge custom";

            if (isoInput.value) parseISO8583();
            alert(`Spesifikasi ${isJpos ? 'jPOS' : isJ8583 ? 'j8583' : 'XML'} berhasil dimuat!`);

        } catch (err) {
            alert("Gagal membaca file XML.\nError: " + err.message);
        }
        specFile.value = '';
    };
    reader.readAsText(file);
});

// === EVENT LISTENERS LAINNYA ===
parseBtn.addEventListener('click', parseISO8583);
clearBtn.addEventListener('click', () => { isoInput.value = ''; isoOutput.innerHTML = 'Menunggu input...'; parsedResultJson = {}; });
copyBtn.addEventListener('click', async () => {
    if (Object.keys(parsedResultJson).length === 0) return alert('Tidak ada data.');
    await navigator.clipboard.writeText(JSON.stringify(parsedResultJson, null, 4));
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Tersalin!';
    setTimeout(() => copyBtn.textContent = originalText, 2000);
});