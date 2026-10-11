document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const specSelect = document.getElementById('specSelect');
    const rawInput = document.getElementById('rawInput');
    const charCounter = document.getElementById('charCounter');
    const inputFeedback = document.getElementById('inputFeedback');
    const statusBadge = document.getElementById('statusBadge');
    const sampleBtn = document.getElementById('sampleBtn');
    const pasteBtn = document.getElementById('pasteBtn');
    const clearBtn = document.getElementById('clearBtn');
    const themeToggle = document.getElementById('themeToggle');

    const tableViewBtn = document.getElementById('tableViewBtn');
    const jsonViewBtn = document.getElementById('jsonViewBtn');
    const trimToggleBtn = document.getElementById('trimToggleBtn');
    const copyTableBtn = document.getElementById('copyTableBtn');
    const copyJsonBtn = document.getElementById('copyJsonBtn');

    const tableView = document.getElementById('tableView');
    const jsonView = document.getElementById('jsonView');
    const emptyState = document.getElementById('emptyState');
    const resultTable = document.getElementById('resultTable');
    const resultTableBody = document.getElementById('resultTableBody');
    const jsonOutput = document.getElementById('jsonOutput');
    const toast = document.getElementById('toast');

    // State
    let currentSpecId = 'check_nasabah';
    let currentView = 'table'; // 'table' or 'json'
    let isTrimEnabled = false;
    let parsedData = []; // Array of { no, name, length, start, end, rawValue, trimmedValue }

    // Init Theme from LocalStorage
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

    // Populate Spec Dropdown
    function initSpecSelector() {
        specSelect.innerHTML = '';
        Object.keys(SPECS).forEach(key => {
            const spec = SPECS[key];
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = `${spec.title} (${spec.totalLength} char)`;
            specSelect.appendChild(opt);
        });

        // Try to retrieve previous selection
        const savedSpec = localStorage.getItem('wbk_parser_spec');
        if (savedSpec && SPECS[savedSpec]) {
            currentSpecId = savedSpec;
            specSelect.value = savedSpec;
        } else {
            currentSpecId = Object.keys(SPECS)[0];
            specSelect.value = currentSpecId;
        }
    }

    // Show Toast
    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2200);
    }

    // Parse Logic
    function parseData() {
        const text = rawInput.value;
        const spec = SPECS[currentSpecId];
        if (!spec) return;

        const inputLen = text.length;
        const expectedLen = spec.totalLength;

        // Update Counter
        charCounter.textContent = `${inputLen} / ${expectedLen} char`;
        if (inputLen === 0) {
            charCounter.className = 'len-counter';
            statusBadge.className = 'status-badge info';
            statusBadge.textContent = 'Menunggu Input...';
            inputFeedback.className = 'input-feedback';
            inputFeedback.textContent = '';
        } else if (inputLen === expectedLen) {
            charCounter.className = 'len-counter match';
            statusBadge.className = 'status-badge valid';
            statusBadge.textContent = '✓ Panjang Sesuai';
            inputFeedback.className = 'input-feedback success show';
            inputFeedback.textContent = `✓ Panjang data tepat sesuai spesifikasi (${expectedLen} karakter).`;
        } else if (inputLen < expectedLen) {
            charCounter.className = 'len-counter mismatch';
            statusBadge.className = 'status-badge warning';
            statusBadge.textContent = `⚠️ Kurang (${inputLen}/${expectedLen})`;
            inputFeedback.className = 'input-feedback warning show';
            inputFeedback.textContent = `⚠️ Peringatan: Panjang input saat ini ${inputLen} karakter. Kurang ${expectedLen - inputLen} karakter dari target ${expectedLen}.`;
        } else {
            charCounter.className = 'len-counter mismatch';
            statusBadge.className = 'status-badge warning';
            statusBadge.textContent = `⚠️ Lebih (${inputLen}/${expectedLen})`;
            inputFeedback.className = 'input-feedback warning show';
            inputFeedback.textContent = `⚠️ Peringatan: Panjang input saat ini ${inputLen} karakter. Melebihi ${inputLen - expectedLen} karakter dari target ${expectedLen}.`;
        }

        // Parse Fields
        parsedData = [];
        let currentPos = 0;

        spec.fields.forEach((field, index) => {
            const start = currentPos;
            const end = currentPos + field.length;
            const rawVal = text.substring(start, end);
            const trimmedVal = rawVal.trim();

            parsedData.push({
                no: index + 1,
                name: field.name,
                length: field.length,
                start: start,
                end: end,
                rawValue: rawVal,
                trimmedValue: trimmedVal
            });

            currentPos = end;
        });

        renderOutput();
    }

    // Render Output
    function renderOutput() {
        const text = rawInput.value;

        if (!text && parsedData.length === 0) {
            emptyState.style.display = 'flex';
            resultTable.style.display = 'none';
            jsonOutput.textContent = '// Menunggu input...';
            return;
        }

        emptyState.style.display = 'none';
        resultTable.style.display = 'table';

        // Render Table Rows
        resultTableBody.innerHTML = '';
        parsedData.forEach(item => {
            const tr = document.createElement('tr');

            const valToDisplay = isTrimEnabled ? item.trimmedValue : item.rawValue;
            const isValEmpty = valToDisplay === '';

            tr.innerHTML = `
                <td class="col-no">${item.no}</td>
                <td class="col-name">${escapeHtml(item.name)}</td>
                <td class="col-len">${item.length}</td>
                <td class="col-range">${item.start}-${item.end}</td>
                <td class="col-val ${isValEmpty ? 'empty' : ''}">${isValEmpty ? '(kosong)' : escapeHtml(valToDisplay)}</td>
                <td class="col-action">
                    <button class="row-copy-btn" title="Salin nilai field ini" data-val="${escapeAttr(valToDisplay)}">📋</button>
                </td>
            `;

            resultTableBody.appendChild(tr);
        });

        // Attach Row Copy Listeners
        document.querySelectorAll('.row-copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const val = e.currentTarget.getAttribute('data-val');
                navigator.clipboard.writeText(val).then(() => {
                    showToast('✓ Nilai field disalin!');
                }).catch(() => {
                    fallbackCopy(val);
                });
            });
        });

        // Render JSON
        const jsonObj = {};
        parsedData.forEach(item => {
            jsonObj[item.name] = isTrimEnabled ? item.trimmedValue : item.rawValue;
        });
        jsonOutput.textContent = JSON.stringify(jsonObj, null, 2);
    }

    // Escape Helper
    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function escapeAttr(str) {
        if (!str) return '';
        return str.replace(/"/g, '&quot;');
    }

    // Fallback Clipboard Copy
    function fallbackCopy(text) {
        const temp = document.createElement('textarea');
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        try {
            document.execCommand('copy');
            showToast('✓ Berhasil disalin ke clipboard!');
        } catch (err) {
            alert('Gagal menyalin text: ' + err);
        }
        document.body.removeChild(temp);
    }

    // Auto-detect Schema from length if possible
    function tryAutoDetectSpec(text) {
        if (!text) return;
        const len = text.length;
        for (const key of Object.keys(SPECS)) {
            if (SPECS[key].totalLength === len && key !== currentSpecId) {
                currentSpecId = key;
                specSelect.value = key;
                localStorage.setItem('wbk_parser_spec', currentSpecId);
                showToast(`ℹ️ Terdeteksi skema: ${SPECS[key].title} (${len} char)`);
                break;
            }
        }
    }

    // Event Listeners
    rawInput.addEventListener('input', () => {
        tryAutoDetectSpec(rawInput.value);
        parseData();
    });

    specSelect.addEventListener('change', () => {
        currentSpecId = specSelect.value;
        localStorage.setItem('wbk_parser_spec', currentSpecId);
        parseData();
    });

    // Sample Button
    sampleBtn.addEventListener('click', () => {
        const spec = SPECS[currentSpecId];
        if (spec && spec.sample) {
            rawInput.value = spec.sample;
            parseData();
            showToast(`✓ Contoh data ${spec.title} dimuat!`);
        } else {
            showToast('Contoh data belum tersedia untuk skema ini.');
        }
    });

    // Paste Button
    pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            rawInput.value = text;
            tryAutoDetectSpec(text);
            parseData();
            showToast('✓ Berhasil menempel data dari clipboard!');
        } catch (err) {
            rawInput.focus();
            showToast('Gunakan Ctrl+V / Cmd+V untuk paste');
        }
    });

    // Clear Button
    clearBtn.addEventListener('click', () => {
        rawInput.value = '';
        parseData();
        showToast('Input dikosongkan.');
    });

    // View Toggle
    tableViewBtn.addEventListener('click', () => {
        currentView = 'table';
        tableViewBtn.classList.add('active');
        jsonViewBtn.classList.remove('active');
        tableView.style.display = 'block';
        jsonView.style.display = 'none';
    });

    jsonViewBtn.addEventListener('click', () => {
        currentView = 'json';
        jsonViewBtn.classList.add('active');
        tableViewBtn.classList.remove('active');
        tableView.style.display = 'none';
        jsonView.style.display = 'block';
    });

    // Trim Toggle
    trimToggleBtn.addEventListener('click', () => {
        isTrimEnabled = !isTrimEnabled;
        trimToggleBtn.textContent = isTrimEnabled ? '✂️ Trim: ON' : '✂️ Trim: OFF';
        if (isTrimEnabled) {
            trimToggleBtn.classList.add('primary');
        } else {
            trimToggleBtn.classList.remove('primary');
        }
        renderOutput();
        showToast(isTrimEnabled ? 'Trim spasi diaktifkan' : 'Trim spasi dinonaktifkan (Nilai raw)');
    });

    // Copy Table as TSV (Excel Friendly)
    copyTableBtn.addEventListener('click', () => {
        if (parsedData.length === 0) {
            showToast('⚠️ Tidak ada data untuk disalin');
            return;
        }

        const headers = ['No', 'Nama Field', 'Panjang', 'Index', 'Nilai'];
        const rows = parsedData.map(item => {
            const val = isTrimEnabled ? item.trimmedValue : item.rawValue;
            return [item.no, item.name, item.length, `${item.start}-${item.end}`, val].join('\t');
        });

        const tsv = [headers.join('\t'), ...rows].join('\n');
        navigator.clipboard.writeText(tsv).then(() => {
            showToast('✓ Tabel berhasil disalin (Format TSV untuk Excel)!');
        }).catch(() => {
            fallbackCopy(tsv);
        });
    });

    // Copy JSON
    copyJsonBtn.addEventListener('click', () => {
        if (parsedData.length === 0) {
            showToast('⚠️ Tidak ada data untuk disalin');
            return;
        }

        const jsonStr = jsonOutput.textContent;
        navigator.clipboard.writeText(jsonStr).then(() => {
            showToast('✓ JSON berhasil disalin ke clipboard!');
        }).catch(() => {
            fallbackCopy(jsonStr);
        });
    });

    // Theme Toggle
    themeToggle.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme');
        const next = cur === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
    });

    // Init
    initSpecSelector();
    parseData();
});
