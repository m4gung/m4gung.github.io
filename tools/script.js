// === TRANSLATIONS ===
const translations = {
    en: {
        welcomeTitle: "Welcome to DevTools",
        welcomeDesc: "A collection of lightweight, fast frontend utilities that run 100% in the browser without backend. All developer tools are free to use and require no installation. Perfect for web developers, programmers, and anyone needing coding assistance.",
        toolsTitle: "Available Developer Tools",
        toolsDesc: "We provide various web development tools frequently needed in software development workflows. Each tool is designed with an intuitive and responsive user interface.",
        aboutTitle: "About DevTools",
        aboutDesc: "My DevTools is a collection of web development tools that run entirely in the browser. No software installation or backend server required. These tools are designed to help developers with everyday tasks like formatting JSON, testing regular expressions, comparing code, and various other web development tasks.",
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
        jsonToJavaPojoDesc: "Convert JSON to Java POJO (Lombok & Jackson) with ease."
    },
    id: {
        welcomeTitle: "Selamat Datang di DevTools",
        welcomeDesc: "Kumpulan utilitas frontend ringan, cepat, dan 100% berjalan di browser tanpa backend. Semua alat developer ini gratis untuk digunakan dan tidak memerlukan instalasiapun. Cocok untuk developer web, programmer, dan siapa saja yang membutuhkan alat bantu coding sehari-hari.",
        toolsTitle: "Alat Developer Tersedia",
        toolsDesc: "Kami menyediakan berbagai alat pengembangan web yang sering diperlukan dalam workflow pengembangan software. Setiap alat dirancang dengan antarmuka pengguna yang intuitif dan responsif.",
        aboutTitle: "Tentang DevTools",
        aboutDesc: "My DevTools adalah kumpulan alat pengembangan web yang berjalan sepenuhnya di browser. Tidak diperlukan instalasi software atau server backend. Alat-alat ini dirancang untuk membantu developer dalam pekerjaan sehari-hari seperti memformat JSON, menguji regular expression, membandingkan kode, dan berbagai tugas pengembangan web lainnya.",
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
        jsonToJavaPojoDesc: "Konversi JSON ke Java POJO (Lombok & Jackson) dengan mudah."
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
            'tool-json-to-java-pojo': t.jsonToJavaPojo
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
            'tool-json-to-java-pojo': t.jsonToJavaPojoDesc
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