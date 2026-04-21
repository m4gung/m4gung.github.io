// === ELEMEN DOM ===
const themeToggle = document.getElementById('themeToggle');
const jsonInput = document.getElementById('jsonInput');
const javaOutput = document.getElementById('javaOutput');
const rootClassNameInput = document.getElementById('rootClassName');

const formatJsonBtn = document.getElementById('formatJsonBtn');
const clearBtn = document.getElementById('clearBtn');
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


// === ENGINE: JSON TO JAVA POJO ===
let classDefinitions = new Map(); // Menyimpan nama class dan isi kodenya
let requiredImports = new Set();  // Menyimpan imports agar tidak duplikat

// Helper: Konversi snake_case ke camelCase (user_id -> userId)
function toCamelCase(str) {
    return str.replace(/([-_][a-z])/ig, ($1) => {
        return $1.toUpperCase().replace('-', '').replace('_', '');
    }).replace(/^[A-Z]/, (m) => m.toLowerCase());
}

// Helper: Konversi ke PascalCase untuk Nama Class (user_obj -> UserObj)
function toPascalCase(str) {
    const camel = toCamelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
}

// Helper: Menjadikan kata singular sederhana (users -> User, addresses -> Address)
function singularize(str) {
    if (str.endsWith('ies')) return str.slice(0, -3) + 'y';
    if (str.endsWith('sses')) return str.slice(0, -2);
    if (str.endsWith('s') && str.length > 1) return str.slice(0, -1);
    return str;
}

// Menentukan tipe data Java
function getJavaType(value, key) {
    if (value === null) return 'Object';

    const type = typeof value;
    if (type === 'string') return 'String';
    if (type === 'number') return Number.isInteger(value) ? 'Integer' : 'Double';
    if (type === 'boolean') return 'Boolean';

    if (Array.isArray(value)) {
        requiredImports.add("import java.util.List;");
        if (value.length === 0) return 'List<Object>'; // Array kosong tidak diketahui tipenya

        // Cek isi array
        const firstItem = value[0];
        // Singularize nama array-nya. Misal: key "users" -> "User"
        let itemKey = singularize(key);
        const genericType = getJavaType(firstItem, itemKey);

        return `List<${genericType}>`;
    }

    if (type === 'object') {
        // Ini adalah Nested Object. Kita harus membuat Class baru.
        let newClassName = toPascalCase(key);
        if (newClassName === '') newClassName = 'NestedObject';

        generateClassCode(value, newClassName);
        return newClassName;
    }

    return 'Object';
}

// Men-generate kode Java per 1 Class
function generateClassCode(obj, className) {
    // Hindari generate class yang sama berulang kali
    if (classDefinitions.has(className)) return;

    let code = `@Data\n@NoArgsConstructor\npublic class ${className} {\n`;

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            const javaType = getJavaType(value, key);
            const camelCaseName = toCamelCase(key);

            // Tambahkan @JsonProperty selalu, agar aman walau penamaan beda
            code += `\n    @JsonProperty("${key}")\n`;
            code += `    private ${javaType} ${camelCaseName};\n`;
        }
    }
    code += `}\n`;

    // Simpan ke memory
    classDefinitions.set(className, code);
}

// Fungsi Eksekusi Utama
function convertJsonToJava() {
    const rawJson = jsonInput.value.trim();
    if (!rawJson) {
        javaOutput.value = '';
        return;
    }

    try {
        const parsedJson = JSON.parse(rawJson);
        const rootName = rootClassNameInput.value.trim() || 'RootResponse';

        // Reset state
        classDefinitions.clear();
        requiredImports.clear();
        requiredImports.add("import lombok.Data;");
        requiredImports.add("import lombok.NoArgsConstructor;");
        requiredImports.add("import com.fasterxml.jackson.annotation.JsonProperty;");

        // Jika JSON mentah berawalan Array [ {...} ]
        if (Array.isArray(parsedJson)) {
            if (parsedJson.length > 0) {
                generateClassCode(parsedJson[0], rootName);
            } else {
                javaOutput.value = "// Error: Array JSON Kosong. Tidak bisa menebak struktur.";
                return;
            }
        } else {
            // Berawalan Object { ... }
            generateClassCode(parsedJson, rootName);
        }

        // Susun Output Akhir
        let finalCode = Array.from(requiredImports).join('\n') + '\n\n';

        // Output class utama terlebih dahulu, disusul nested class di bawahnya
        classDefinitions.forEach((codeStr, className) => {
            finalCode += codeStr + '\n';
        });

        javaOutput.value = finalCode.trim();

    } catch (error) {
        javaOutput.value = "❌ Error Parsing JSON: \n" + error.message + "\n\nPastikan JSON yang kamu masukkan valid!";
    }
}


// === EVENT LISTENERS ===
let typingTimer;
jsonInput.addEventListener('input', () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(convertJsonToJava, 500);
});

rootClassNameInput.addEventListener('input', convertJsonToJava);

formatJsonBtn.addEventListener('click', () => {
    try {
        const parsed = JSON.parse(jsonInput.value);
        jsonInput.value = JSON.stringify(parsed, null, 4);
    } catch (e) {
        alert("JSON tidak valid, tidak bisa dirapikan!");
    }
});

clearBtn.addEventListener('click', () => {
    jsonInput.value = '';
    javaOutput.value = '';
    jsonInput.focus();
});

// Fitur Copy Kode Canggih
copyBtn.addEventListener('click', async () => {
    const textToCopy = javaOutput.value;
    if (!textToCopy || textToCopy.startsWith('❌')) return;

    const showSuccessEffect = () => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ Berhasil Disalin!';
        copyBtn.style.backgroundColor = 'var(--success)';
        copyBtn.style.color = 'white';
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.backgroundColor = '';
            copyBtn.style.color = '';
        }, 2000);
    };

    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(textToCopy);
            showSuccessEffect();
            return;
        } catch (err) { }
    }

    try {
        const tempTextArea = document.createElement("textarea");
        tempTextArea.value = textToCopy;
        tempTextArea.style.position = "absolute";
        tempTextArea.style.left = "-999999px";
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        document.execCommand("copy");
        document.body.removeChild(tempTextArea);
        showSuccessEffect();
    } catch (err) {
        alert('Gagal menyalin secara otomatis.');
    }
});