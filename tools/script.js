// === TRANSLATIONS ===
const translations = {
    en: {
        welcomeTitle: "Welcome to Tools",
        welcomeDesc: "A collection of lightweight, fast frontend utilities that run 100% in the browser without backend. All developer tools are free to use and require no installation. Perfect for web developers, programmers, and anyone needing coding assistance.",
        toolsTitle: "Available Developer Tools",
        toolsDesc: "We provide various web development tools frequently needed in software development workflows. Each tool is designed with an intuitive and responsive user interface.",
        aboutTitle: "About Tools",
        aboutDesc: "My Tools is a collection of web development tools that run entirely in the browser. No software installation or backend server required. These tools are designed to help developers with everyday tasks like formatting JSON, testing regular expressions, comparing code, and various other web development tasks.",
        jsonFormatter: "JSON Formatter",
        jsonFormatterDesc: "Format, validate, and beautify raw JSON data with smart copy/paste features.",
        markdownPreviewer: "Markdown Previewer",
        markdownPreviewerDesc: "Real-time Markdown editor with split-pane, syntax highlighting, and PDF export.",
        regexTester: "RegEx Tester",
        regexTesterDesc: "Test your Regular Expression patterns directly with precise highlight features.",
        diffChecker: "Diff Checker",
        diffCheckerDesc: "Compare two texts or codes to see changes (add/remove) with minimap.",
        plantUmlEditor: "PlantUML Editor",
        plantUmlEditorDesc: "Write system architecture code and render as visual diagrams in real-time.",
        epochConverter: "Epoch Converter",
        epochConverterDesc: "Convert Unix Timestamp numbers to human-readable dates and vice versa.",
        cronGenerator: "Cron Generator",
        cronGeneratorDesc: "Generate cron expressions for scheduling tasks.",
        sqlFormatter: "SQL Formatter",
        sqlFormatterDesc: "Format, beautify, and tidy up your SQL queries to make them easy to read and understand.",
        iso8583Formatter: "ISO8583 Formatter",
        iso8583FormatterDesc: "Format, beautify, and tidy up your ISO8583 messages to make them easy to read and understand.",
        springFormatter: "Spring Properties YAML Converter",
        springFormatterDesc: "Convert Spring Properties files to YAML and vice versa.",
        javaSpringStackTraceBeautifier: "Spring Log Analyzer & Trace Beautifier",
        javaSpringStackTraceBeautifierDesc: "Format, beautify, and tidy up your Java Spring stack traces to make them easy to read and understand.",
        bcryptGenerator: "BCrypt Hash Generator & Matcher",
        bcryptGeneratorDesc: "Generate and compare BCrypt hashes with ease.",
        jsonToJavaPojo: "JSON to Java POJO (Lombok & Jackson) Converter",
        jsonToJavaPojoDesc: "Convert JSON to Java POJO (Lombok & Jackson) with ease.",
        jwtDecoderValidator: "JWT Decoder & Validator",
        jwtDecoderValidatorDesc: "Decode and validate JWT with ease.",
        csvExcelProcessor: "CSV/Excel Processor",
        csvExcelProcessorDesc: "Open, search, filter, sort, and export data from CSV or Excel files with ease.",
        encryptDecryptHash: "Encrypt-Decrypt & Hash Generator",
        encryptDecryptHashDesc: "Encrypt and decrypt text with ease.",
        focusTaskTracker: "Focus & Task Tracker",
        focusTaskTrackerDesc: "Pomodoro and To-Do List that can be installed on mobile and PC.",
        curlToCode: "cURL to Code Converter",
        curlToCodeDesc: "Convert cURL commands to Java (HttpClient, RestTemplate, WebClient, OkHttp), JS, Python, and Go instantly.",
        searchPlaceholder: "Search tools (e.g. JSON, JWT, cURL, Spring, SQL)...",
        searchResultCount: "Showing {count} of {total} tools",
        noResultsTitle: "No tools found",
        noResultsDesc: "Try another keyword or check your spelling.",
        resetSearchBtn: "Show All Tools"
    },
    id: {
        welcomeTitle: "Selamat Datang di Tools",
        welcomeDesc: "Kumpulan utilitas frontend ringan, cepat, dan 100% berjalan di browser tanpa backend. Semua alat developer ini gratis untuk digunakan dan tidak memerlukan instalasiapun. Cocok untuk developer web, programmer, dan siapa saja yang membutuhkan alat bantu coding sehari-hari.",
        toolsTitle: "Alat Developer Tersedia",
        toolsDesc: "Kami menyediakan berbagai alat pengembangan web yang sering diperlukan dalam workflow pengembangan software. Setiap alat dirancang dengan antarmuka pengguna yang intuitif dan responsif.",
        aboutTitle: "Tentang Tools",
        aboutDesc: "My Tools adalah kumpulan alat pengembangan web yang berjalan sepenuhnya di browser. Tidak diperlukan instalasi software atau server backend. Alat-alat ini dirancang untuk membantu developer dalam pekerjaan sehari-hari seperti memformat JSON, menguji regular expression, membandingkan kode, dan berbagai tugas pengembangan web lainnya.",
        jsonFormatter: "JSON Formatter",
        jsonFormatterDesc: "Format, validasi, dan percantik data JSON mentah dengan fitur copy/paste cerdas.",
        markdownPreviewer: "Markdown Previewer",
        markdownPreviewerDesc: "Editor Markdown real-time dengan split-pane, syntax highlighting, dan export PDF.",
        regexTester: "RegEx Tester",
        regexTesterDesc: "Uji pola Regular Expression kamu secara langsung dengan fitur highlight yang presisi.",
        diffChecker: "Diff Checker",
        diffCheckerDesc: "Bandingkan dua teks atau kode untuk melihat perubahannya (tambah/hapus) lengkap dengan minimap.",
        plantUmlEditor: "PlantUML Editor",
        plantUmlEditorDesc: "Tulis kode arsitektur sistem dan render menjadi diagram visual secara real-time.",
        epochConverter: "Epoch Converter",
        epochConverterDesc: "Konversi angka Unix Timestamp ke tanggal yang bisa dibaca manusia, dan sebaliknya.",
        cronGenerator: "Cron Generator",
        cronGeneratorDesc: "Generate cron expressions for scheduling tasks.",
        sqlFormatter: "SQL Formatter",
        sqlFormatterDesc: "Format, percantik, dan rapikan query SQL kamu agar mudah dibaca dan dipahami.",
        iso8583Formatter: "ISO8583 Formatter",
        iso8583FormatterDesc: "Format, percantik, dan rapikan pesan ISO8583 kamu agar mudah dibaca dan dipahami.",
        springFormatter: "Spring Properties YAML Converter",
        springFormatterDesc: "Konversi file properties ke YAML dan sebaliknya.",
        javaSpringStackTraceBeautifier: "Spring Log Analyzer & Trace Beautifier",
        javaSpringStackTraceBeautifierDesc: "Format, percantik, dan rapikan stack trace Java Spring kamu agar mudah dibaca dan dipahami.",
        bcryptGenerator: "BCrypt Hash Generator & Matcher",
        bcryptGeneratorDesc: "Generate dan bandingkan hash BCrypt dengan mudah.",
        jsonToJavaPojo: "JSON to Java POJO (Lombok & Jackson) Converter",
        jsonToJavaPojoDesc: "Konversi JSON ke Java POJO (Lombok & Jackson) dengan mudah.",
        jwtDecoderValidator: "JWT Decoder & Validator",
        jwtDecoderValidatorDesc: "Decode dan validasi JWT dengan mudah.",
        csvExcelProcessor: "CSV/Excel Processor",
        csvExcelProcessorDesc: "Buka, cari, filter, urutkan, dan export data dari file CSV atau Excel dengan mudah.",
        encryptDecryptHash: "Encrypt-Decrypt & Hash Generator",
        encryptDecryptHashDesc: "Encrypt dan decrypt teks dengan mudah.",
        focusTaskTracker: "Focus & Task Tracker",
        focusTaskTrackerDesc: "Aplikasi Pomodoro dan To-Do List yang bisa di-install di HP dan PC.",
        curlToCode: "cURL to Code Converter",
        curlToCodeDesc: "Konversi perintah cURL ke Java (HttpClient, RestTemplate, WebClient, OkHttp), JS, Python, dan Go secara instan.",
        searchPlaceholder: "Cari tools (misal: JSON, JWT, cURL, Spring, SQL)...",
        searchResultCount: "Menampilkan {count} dari {total} tools",
        noResultsTitle: "Tidak ada tools yang cocok",
        noResultsDesc: "Coba gunakan kata kunci lain atau periksa ejaan Anda.",
        resetSearchBtn: "Tampilkan Semua Tools"
    }
};

// === LANGUAGE ===
(function () {
    const langEn = document.getElementById('lang-en');
    const langId = document.getElementById('lang-id');
    if (!langEn || !langId) return;

    let currentLang = localStorage.getItem('lang') || 'id';

    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('lang', lang);
        document.documentElement.lang = lang;
        updateContent();
        updateLangButtons();
    }

    function updateContent() {
        const t = translations[currentLang];

        // Welcome section
        const el = (id) => document.getElementById(id);
        if (el('welcome-title')) el('welcome-title').textContent = t.welcomeTitle;
        if (el('welcome-desc')) el('welcome-desc').textContent = t.welcomeDesc;
        if (el('tools-title')) el('tools-title').textContent = t.toolsTitle;
        if (el('tools-desc')) el('tools-desc').textContent = t.toolsDesc;
        if (el('about-title')) el('about-title').textContent = t.aboutTitle;
        if (el('about-desc')) el('about-desc').textContent = t.aboutDesc;

        // Search bar translations
        if (el('toolSearch')) el('toolSearch').setAttribute('placeholder', t.searchPlaceholder);
        if (el('noResultsTitle')) el('noResultsTitle').textContent = t.noResultsTitle;
        if (el('noResultsDesc')) el('noResultsDesc').textContent = t.noResultsDesc;
        if (el('resetSearchBtn')) el('resetSearchBtn').textContent = t.resetSearchBtn;
        if (window.updateSearchResults) window.updateSearchResults();


        // Tool cards
        const toolTitles = {
            'tool-json': t.jsonFormatter,
            'tool-markdown': t.markdownPreviewer,
            'tool-regex': t.regexTester,
            'tool-diff': t.diffChecker,
            'tool-plant': t.plantUmlEditor,
            'tool-epoch': t.epochConverter,
            'tool-cron': t.cronGenerator,
            'tool-sql': t.sqlFormatter,
            'tool-iso': t.iso8583Formatter,
            'tool-spring': t.springFormatter,
            'tool-java-spring-stack-trace': t.javaSpringStackTraceBeautifier,
            'tool-bcrypt': t.bcryptGenerator,
            'tool-json-to-java-pojo': t.jsonToJavaPojo,
            'tool-jwt': t.jwtDecoderValidator,
            'tool-csv-excel': t.csvExcelProcessor,
            'tool-encrypt-decrypt-hash': t.encryptDecryptHash,
            'tool-focus-task': t.focusTaskTracker,
            'tool-curl-to-code': t.curlToCode
        };

        const toolDescs = {
            'tool-json': t.jsonFormatterDesc,
            'tool-markdown': t.markdownPreviewerDesc,
            'tool-regex': t.regexTesterDesc,
            'tool-diff': t.diffCheckerDesc,
            'tool-plant': t.plantUmlEditorDesc,
            'tool-epoch': t.epochConverterDesc,
            'tool-cron': t.cronGeneratorDesc,
            'tool-sql': t.sqlFormatterDesc,
            'tool-iso': t.iso8583FormatterDesc,
            'tool-spring': t.springFormatterDesc,
            'tool-java-spring-stack-trace': t.javaSpringStackTraceBeautifierDesc,
            'tool-bcrypt': t.bcryptGeneratorDesc,
            'tool-json-to-java-pojo': t.jsonToJavaPojoDesc,
            'tool-jwt': t.jwtDecoderValidatorDesc,
            'tool-csv-excel': t.csvExcelProcessorDesc,
            'tool-encrypt-decrypt-hash': t.encryptDecryptHashDesc,
            'tool-focus-task': t.focusTaskTrackerDesc,
            'tool-curl-to-code': t.curlToCodeDesc
        };

        for (const [id, title] of Object.entries(toolTitles)) {
            const titleEl = document.querySelector(`#${id} .tool-title`);
            const descEl = document.querySelector(`#${id} .tool-desc`);
            if (titleEl) titleEl.textContent = title;
            if (descEl) descEl.textContent = toolDescs[id];
        }
    }

    function updateLangButtons() {
        langEn.classList.toggle('active', currentLang === 'en');
        langId.classList.toggle('active', currentLang === 'id');
    }

    langEn.addEventListener('click', () => setLanguage('en'));
    langId.addEventListener('click', () => setLanguage('id'));

    // Initialize
    updateContent();
    updateLangButtons();
})();

// === LIGHT / DARK MODE ===
(function () {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    const getPreferredTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) return savedTheme;
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return 'light';
        }
        return 'dark';
    };

    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        updateThemeIcon(theme);
    };

    const updateThemeIcon = (theme) => {
        if (theme === 'dark') {
            themeToggle.textContent = '🌙';
            themeToggle.setAttribute('aria-label', 'Switch to light mode');
        } else {
            themeToggle.textContent = '☀️';
            themeToggle.setAttribute('aria-label', 'Switch to dark mode');
        }
    };

    const initialTheme = getPreferredTheme();
    applyTheme(initialTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    // Touch improvements
    document.addEventListener('touchstart', function () { }, { passive: true });
})();

// === SEARCH FILTER ===
(function () {
    const searchInput = document.getElementById('toolSearch');
    const clearBtn = document.getElementById('clearSearch');
    const searchMeta = document.getElementById('searchMeta');
    const resultCountEl = document.getElementById('searchResultCount');
    const noResults = document.getElementById('noResults');
    const resetSearchBtn = document.getElementById('resetSearchBtn');
    const toolsGrid = document.querySelector('.tools-grid');
    const toolCards = Array.from(document.querySelectorAll('.tool-card'));

    if (!searchInput || !toolsGrid) return;

    function doSearch() {
        const rawQuery = searchInput.value.trim().toLowerCase();
        clearBtn.style.display = rawQuery.length > 0 ? 'inline-flex' : 'none';

        // Split query into terms to support multi-word search (e.g., "spring yaml")
        const terms = rawQuery ? rawQuery.split(/\s+/).filter(Boolean) : [];

        let matchCount = 0;
        toolCards.forEach(card => {
            const title = (card.querySelector('.tool-title')?.textContent || '').toLowerCase();
            const desc = (card.querySelector('.tool-desc')?.textContent || '').toLowerCase();
            const id = (card.id || '').toLowerCase().replace(/^tool-/, '').replace(/-/g, ' ');
            const href = (card.getAttribute('href') || '').toLowerCase().replace(/[\.\/-]/g, ' ');

            const cardSearchText = `${title} ${desc} ${id} ${href}`;

            // All search terms must match somewhere in the card's text
            const isMatch = terms.length === 0 || terms.every(term => cardSearchText.includes(term));

            if (isMatch) {
                card.classList.remove('is-hidden');
                matchCount++;
            } else {
                card.classList.add('is-hidden');
            }
        });

        const currentLang = localStorage.getItem('lang') || 'id';
        const t = (typeof translations !== 'undefined' && translations[currentLang]) ? translations[currentLang] : (translations?.id || {});

        if (terms.length > 0) {
            searchMeta.style.display = 'flex';
            if (resultCountEl && t.searchResultCount) {
                resultCountEl.textContent = t.searchResultCount
                    .replace('{count}', matchCount)
                    .replace('{total}', toolCards.length);
            }
        } else {
            searchMeta.style.display = 'none';
        }

        if (matchCount === 0) {
            noResults.style.display = 'block';
            toolsGrid.style.display = 'none';
        } else {
            noResults.style.display = 'none';
            toolsGrid.style.display = '';
        }
    }

    window.updateSearchResults = doSearch;

    searchInput.addEventListener('input', doSearch);

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchInput.focus();
        doSearch();
    });

    if (resetSearchBtn) {
        resetSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchInput.focus();
            doSearch();
        });
    }

    // Keyboard shortcut: press '/' to focus search, and 'Escape' to clear
    document.addEventListener('keydown', (e) => {
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (e.key === '/' && document.activeElement !== searchInput && !['input', 'textarea', 'select'].includes(activeTag)) {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        } else if (e.key === 'Escape' && document.activeElement === searchInput) {
            searchInput.value = '';
            searchInput.blur();
            doSearch();
        }
    });
})();