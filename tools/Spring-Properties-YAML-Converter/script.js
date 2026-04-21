// === ELEMEN DOM ===
const themeToggle = document.getElementById('themeToggle');
const configInput = document.getElementById('configInput');
const configOutput = document.getElementById('configOutput');
const conversionMode = document.getElementById('conversionMode');

const clearBtn = document.getElementById('clearBtn');
const convertBtn = document.getElementById('convertBtn');
const copyBtn = document.getElementById('copyBtn');

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

// === LOGIKA: PROPERTIES KE OBJECT ===
function propertiesToObject(propsString) {
    const obj = {};
    const lines = propsString.split('\n');

    for (let line of lines) {
        line = line.trim();
        // Abaikan baris kosong atau komentar
        if (!line || line.startsWith('#') || line.startsWith('!')) continue;

        // Cari tanda '=' pertama
        const eqIndex = line.indexOf('=');
        if (eqIndex === -1) continue; // Jika tidak ada sama dengan, lewati

        const key = line.substring(0, eqIndex).trim();
        let value = line.substring(eqIndex + 1).trim();

        // Konversi tipe data otomatis (boolean atau number) agar YAML lebih rapi
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (!isNaN(value) && value !== '') value = Number(value);

        // Pecah kunci berdasarkan titik (contoh: spring.datasource.url)
        const parts = key.split('.');
        let currentObj = obj;

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!currentObj[part]) {
                currentObj[part] = {};
            }
            currentObj = currentObj[part];
        }

        // Tetapkan nilai di simpul terakhir
        currentObj[parts[parts.length - 1]] = value;
    }
    return obj;
}

// === LOGIKA: OBJECT KE PROPERTIES (REKURSIF) ===
function objectToProperties(obj, parentKey = '') {
    let props = [];

    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            const currentKey = parentKey ? `${parentKey}.${key}` : key;
            const value = obj[key];

            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                // Jika masih berupa objek (hierarki), panggil fungsi ini lagi
                props = props.concat(objectToProperties(value, currentKey));
            } else if (Array.isArray(value)) {
                // Tangani penulisan array Spring (contoh: my.list[0]=value)
                value.forEach((item, index) => {
                    if (typeof item === 'object') {
                        props = props.concat(objectToProperties(item, `${currentKey}[${index}]`));
                    } else {
                        props.push(`${currentKey}[${index}]=${item}`);
                    }
                });
            } else {
                // Ujung hierarki, cetak key=value
                props.push(`${currentKey}=${value}`);
            }
        }
    }
    return props;
}

// === FUNGSI UTAMA KONVERSI ===
function executeConversion() {
    const rawData = configInput.value.trim();
    if (!rawData) {
        configOutput.value = '';
        return;
    }

    try {
        const mode = conversionMode.value;

        if (mode === 'prop2yaml') {
            // 1. Ubah teks properties jadi JS Object
            const nestedObj = propertiesToObject(rawData);

            // 2. Ubah JS Object ke string YAML menggunakan library js-yaml
            const yamlStr = jsyaml.dump(nestedObj, { indent: 2 });
            configOutput.value = yamlStr;

        } else if (mode === 'yaml2prop') {
            // 1. Ubah teks YAML jadi JS Object
            const parsedObj = jsyaml.load(rawData);

            // 2. Ratakan (flatten) JS Object menjadi array teks properties
            const propsArray = objectToProperties(parsedObj);
            configOutput.value = propsArray.join('\n');
        }

    } catch (error) {
        configOutput.value = "❌ Terjadi Kesalahan Parsing:\n\n" + error.message;
    }
}

// === EVENT LISTENERS ===
convertBtn.addEventListener('click', executeConversion);
conversionMode.addEventListener('change', executeConversion);

// Jalankan otomatis dengan jeda saat user mengetik
let typingTimer;
configInput.addEventListener('input', () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        if (configInput.value.trim() !== '') {
            executeConversion();
        } else {
            configOutput.value = '';
        }
    }, 500);
});

clearBtn.addEventListener('click', () => {
    configInput.value = '';
    configOutput.value = '';
    configInput.focus();
});

copyBtn.addEventListener('click', async () => {
    const textToCopy = configOutput.value;
    if (!textToCopy) return;

    try {
        await navigator.clipboard.writeText(textToCopy);
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Berhasil Disalin!';
        copyBtn.style.backgroundColor = 'var(--success)';
        copyBtn.style.color = 'white';
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.backgroundColor = '';
            copyBtn.style.color = '';
        }, 2000);
    } catch (err) {
        alert('Gagal menyalin teks!');
    }
});