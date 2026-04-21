// === ELEMEN DOM ===
const themeToggle = document.getElementById('themeToggle');
const traceInput = document.getElementById('traceInput');
const traceOutput = document.getElementById('traceOutput');

const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const clearBtn = document.getElementById('clearBtn');
const exampleBtn = document.getElementById('exampleBtn');

const filterDebug = document.getElementById('filterDebug');
const filterInfo = document.getElementById('filterInfo');
const filterWarn = document.getElementById('filterWarn');
const filterError = document.getElementById('filterError');
const hideFrameworksToggle = document.getElementById('hideFrameworksToggle');

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

const escapeHTML = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const frameworkPackages = [
    'java.', 'javax.', 'jakarta.', 'sun.', 'jdk.',
    'org.springframework.', 'org.apache.catalina.',
    'org.apache.tomcat.', 'org.apache.coyote.',
    'org.hibernate.', 'net.sf.cglib.', 'org.postgresql.',
    'com.mysql.', 'com.zaxxer.hikari.'
];

// === ENGINE: TRACE & LOG ANALYZER ===
function beautifyTrace() {
    const rawData = traceInput.value;
    if (!rawData.trim()) {
        traceOutput.innerHTML = "Menunggu input log error...";
        return;
    }

    const lines = rawData.split('\n');
    let htmlBuilder = "";

    // Status state untuk melacak tipe log multi-baris
    let currentLogLevel = "INFO";

    for (let line of lines) {
        if (!line.trim()) {
            htmlBuilder += '<br>';
            continue;
        }

        const safeLine = escapeHTML(line);
        const trimmedLine = line.trim();

        // 1. Deteksi Log Level (Termasuk format JSON .json log)
        const levelMatch = trimmedLine.match(/\b(INFO|WARN|WARNING|ERROR|FATAL|DEBUG|TRACE)\b/i);
        if (levelMatch) {
            currentLogLevel = levelMatch[1].toUpperCase();
            if (currentLogLevel === 'WARNING') currentLogLevel = 'WARN';
            if (currentLogLevel === 'FATAL') currentLogLevel = 'ERROR';
        }

        // 2. Deteksi Exception
        const isException = /^[a-zA-Z0-9\.]+Exception:|^Caused by:|^Suppressed:/.test(trimmedLine);
        const isAtLine = trimmedLine.startsWith('at ');

        // Jika menemukan exception atau stack trace, paksa level menjadi ERROR
        if (isException || isAtLine) {
            currentLogLevel = 'ERROR';
        }

        // --- RENDER HTML BERDASARKAN TIPE ---
        let finalHtml = safeLine;

        // Warnai tulisan level log agar cantik
        finalHtml = finalHtml.replace(/\bDEBUG\b/g, '<span class="log-lvl-debug">DEBUG</span>');
        finalHtml = finalHtml.replace(/\bTRACE\b/g, '<span class="log-lvl-debug">TRACE</span>');
        finalHtml = finalHtml.replace(/\bINFO\b/g, '<span class="log-lvl-info">INFO</span>');
        finalHtml = finalHtml.replace(/\bWARN(ING)?\b/g, '<span class="log-lvl-warn">WARN</span>');
        finalHtml = finalHtml.replace(/\bERROR\b/g, '<span class="log-lvl-error">ERROR</span>');

        if (isException) {
            htmlBuilder += `<div class="trace-line exception" data-level="${currentLogLevel}">${finalHtml}</div>`;
        }
        else if (isAtLine) {
            const isFramework = frameworkPackages.some(pkg => trimmedLine.startsWith(`at ${pkg}`));
            if (isFramework) {
                htmlBuilder += `<div class="trace-line framework" data-level="${currentLogLevel}">${finalHtml}</div>`;
            } else {
                let highlightedLine = safeLine;
                const regexMatch = safeLine.match(/(at\s+.*?\.)([a-zA-Z0-9_<>]+)(\([^)]+\))/);
                if (regexMatch) {
                    const prefix = regexMatch[1];
                    const method = regexMatch[2];
                    const coloredFileAndLine = regexMatch[3].replace(/:(\d+)\)/, ':<span class="line-num">$1</span>)');
                    highlightedLine = `${prefix}<span class="method">${method}</span>${coloredFileAndLine}`;
                }
                htmlBuilder += `<div class="trace-line user-code" data-level="${currentLogLevel}">${highlightedLine}</div>`;
            }
        }
        else {
            htmlBuilder += `<div class="trace-line" data-level="${currentLogLevel}">${finalHtml}</div>`;
        }
    }

    traceOutput.innerHTML = htmlBuilder;
}

// === FITUR FILTERING ===
function updateFilters() {
    traceOutput.classList.toggle('hide-debug', !filterDebug.checked);
    traceOutput.classList.toggle('hide-info', !filterInfo.checked);
    traceOutput.classList.toggle('hide-warn', !filterWarn.checked);
    traceOutput.classList.toggle('hide-error', !filterError.checked);
    traceOutput.classList.toggle('hide-frameworks', hideFrameworksToggle.checked);
}

// Tambahkan filterDebug ke dalam array listener
[filterDebug, filterInfo, filterWarn, filterError, hideFrameworksToggle].forEach(checkbox => {
    checkbox.addEventListener('change', updateFilters);
});

// === UPLOAD FILE (.log, .txt, .json) ===
uploadBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Peringatan jika file terlalu besar (> 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert("Peringatan: File ini cukup besar. Parsing mungkin butuh beberapa detik.");
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        traceInput.value = event.target.result;
        beautifyTrace();
    };
    reader.readAsText(file);
    fileInput.value = ''; // Reset
});

// Drag & Drop Support
traceInput.addEventListener('dragover', (e) => e.preventDefault());
traceInput.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            traceInput.value = event.target.result;
            beautifyTrace();
        };
        reader.readAsText(file);
    }
});

// === EVENT LISTENERS LAINNYA ===
let typingTimer;
traceInput.addEventListener('input', () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(beautifyTrace, 500); // Debounce agar tidak lag jika teks panjang
});

clearBtn.addEventListener('click', () => {
    traceInput.value = '';
    beautifyTrace();
});

exampleBtn.addEventListener('click', () => {
    traceInput.value = `2026-04-21 10:15:30.001  INFO 1234 --- [main] com.app.SpringBootApplication : Starting Application...
2026-04-21 10:15:32.145 DEBUG 1234 --- [main] org.hibernate.SQL : select * from users;
2026-04-21 10:15:35.882  WARN 1234 --- [http-nio-8080] com.app.AuthService : User admin attempted login with wrong password
2026-04-21 10:15:36.999 ERROR 1234 --- [http-nio-8080] com.app.PaymentController : Transaction failed!
java.lang.NullPointerException: Cannot invoke "com.app.model.Order.getId()" because "order" is null
\tat com.app.payment.service.BillingService.process(BillingService.java:142)
\tat com.app.payment.controller.PaymentController.submit(PaymentController.java:55)
\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
\tat org.springframework.web.servlet.FrameworkServlet.service(FrameworkServlet.java:883)
\tat org.apache.catalina.core.ApplicationFilterChain.internalDoFilter(ApplicationFilterChain.java:227)
2026-04-21 10:15:38.000  INFO 1234 --- [main] com.app.AuditLog : Process finished.`;
    beautifyTrace();
});

// Init Filter
updateFilters();