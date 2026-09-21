/**
 * UUID & ULID Studio - Generator & Inspector
 * Compliant with RFC 9562 (UUIDv7, UUIDv4), RFC 4122, and ULID Specification
 * 100% Client-Side Web Crypto API
 */

(function () {
    'use strict';

    // === CROCKFORD BASE32 (FOR ULID) ===
    const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    const CROCKFORD_MAP = {};
    for (let i = 0; i < CROCKFORD_ALPHABET.length; i++) {
        CROCKFORD_MAP[CROCKFORD_ALPHABET[i]] = i;
    }
    // Handle aliases per Crockford spec: I/L -> 1, O -> 0
    CROCKFORD_MAP['I'] = 1;
    CROCKFORD_MAP['i'] = 1;
    CROCKFORD_MAP['L'] = 1;
    CROCKFORD_MAP['l'] = 1;
    CROCKFORD_MAP['O'] = 0;
    CROCKFORD_MAP['o'] = 0;

    // === NANOID ALPHABET ===
    const NANOID_ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLFGQZ_bfghjklqvwyzict';

    // State for UUIDv7 sub-millisecond monotonicity
    let lastV7Timestamp = -1;
    let v7Counter = 0;

    // DOM Elements Cache
    const el = (id) => document.getElementById(id);

    // ==========================================
    // 1. THEME TOGGLE
    // ==========================================
    const themeToggle = el('themeToggle');
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (themeToggle) {
            themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
            themeToggle.setAttribute('title', theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap');
        }
    }

    const savedTheme = localStorage.getItem('theme') ||
        (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    applyTheme(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') || 'dark';
            applyTheme(current === 'dark' ? 'light' : 'dark');
        });
    }

    // ==========================================
    // 2. TABS MANAGEMENT
    // ==========================================
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabPanes = document.querySelectorAll('.tab-pane');

    function switchTab(tabId) {
        navTabs.forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-tab') === tabId);
        });
        tabPanes.forEach(pane => {
            pane.classList.toggle('active', pane.id === tabId);
        });
    }

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-tab');
            switchTab(targetId);
        });
    });

    // Link from generator footer to inspector
    const btnInspectFirst = el('btnInspectFirst');
    if (btnInspectFirst) {
        btnInspectFirst.addEventListener('click', () => {
            const output = el('outputArea').value.trim();
            if (!output) {
                showToast('Belum ada ID yang digenerate.', 'warning');
                return;
            }
            // Parse first ID
            const firstLine = output.split('\n')[0].replace(/^[\s\(\[\{'"`,]+|[\s\)\]\}'",;]+$/g, '');
            switchTab('tab-inspector');
            el('inspectInput').value = firstLine;
            inspectIdentifier(firstLine);
        });
    }

    // ==========================================
    // 3. GENERATORS IMPLEMENTATION
    // ==========================================

    /**
     * UUID v7 Generator (RFC 9562)
     * 48-bit millisecond timestamp + 12-bit monotonic counter + 62-bit randomness
     */
    function generateUUIDv7() {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);

        let now = Date.now();
        if (now <= lastV7Timestamp) {
            now = lastV7Timestamp;
            v7Counter = (v7Counter + 1) & 0xfff;
            if (v7Counter === 0) {
                // If counter overflows within same ms, advance to next ms
                now = lastV7Timestamp + 1;
                lastV7Timestamp = now;
            }
        } else {
            lastV7Timestamp = now;
            // Seed counter with 12 random bits
            v7Counter = ((bytes[6] & 0x0f) << 8) | bytes[7];
        }

        // 48-bit timestamp (bytes 0-5)
        bytes[0] = Math.floor(now / 0x10000000000) & 0xff;
        bytes[1] = Math.floor(now / 0x100000000) & 0xff;
        bytes[2] = Math.floor(now / 0x1000000) & 0xff;
        bytes[3] = Math.floor(now / 0x10000) & 0xff;
        bytes[4] = Math.floor(now / 0x100) & 0xff;
        bytes[5] = now & 0xff;

        // Byte 6: 4-bit version (0111 = 7) + top 4 bits of counter
        bytes[6] = 0x70 | ((v7Counter >> 8) & 0x0f);
        // Byte 7: bottom 8 bits of counter
        bytes[7] = v7Counter & 0xff;

        // Byte 8: 2-bit variant (10xx xxxx = RFC 4122/9562) + 6 bits random
        bytes[8] = 0x80 | (bytes[8] & 0x3f);

        return bytes;
    }

    /**
     * UUID v4 Generator (RFC 4122 / RFC 9562)
     */
    function generateUUIDv4() {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);

        // Version 4 (0100)
        bytes[6] = 0x40 | (bytes[6] & 0x0f);
        // Variant 10xx xxxx
        bytes[8] = 0x80 | (bytes[8] & 0x3f);

        return bytes;
    }

    /**
     * UUID v1 Generator (Gregorian time-based)
     */
    function generateUUIDv1() {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);

        // Gregorian offset: 100ns intervals between 1582-10-15 and 1970-01-01
        // 122192928000000000 in BigInt
        const nowMs = BigInt(Date.now());
        const gregorian100ns = (nowMs * 10000n) + 122192928000000000n;

        const timeLow = Number(gregorian100ns & 0xffffffffn);
        const timeMid = Number((gregorian100ns >> 32n) & 0xffffn);
        const timeHi = Number((gregorian100ns >> 48n) & 0x0fffn);

        bytes[0] = (timeLow >>> 24) & 0xff;
        bytes[1] = (timeLow >>> 16) & 0xff;
        bytes[2] = (timeLow >>> 8) & 0xff;
        bytes[3] = timeLow & 0xff;

        bytes[4] = (timeMid >>> 8) & 0xff;
        bytes[5] = timeMid & 0xff;

        // Version 1 (0001)
        bytes[6] = 0x10 | (timeHi >>> 8);
        bytes[7] = timeHi & 0xff;

        // Variant 10xx xxxx
        bytes[8] = 0x80 | (bytes[8] & 0x3f);

        return bytes;
    }

    /**
     * ULID Generator (48-bit timestamp + 80-bit random = 26 Base32 characters)
     */
    function generateULID() {
        const now = Date.now();
        let timeStr = '';
        let timeVal = now;

        // Encode 48-bit timestamp into 10 Crockford Base32 characters (big-endian)
        for (let i = 9; i >= 0; i--) {
            const mod = timeVal % 32;
            timeStr = CROCKFORD_ALPHABET[mod] + timeStr;
            timeVal = Math.floor(timeVal / 32);
        }

        // Generate 80 bits (10 bytes = 16 characters in base32)
        const randBytes = new Uint8Array(10);
        crypto.getRandomValues(randBytes);

        let randStr = '';
        // 80 bits is 16 base32 characters (each 5 bits)
        // Convert 10 bytes (80 bits) into 16 base32 chars
        let bitBuffer = 0n;
        for (let i = 0; i < 10; i++) {
            bitBuffer = (bitBuffer << 8n) | BigInt(randBytes[i]);
        }

        for (let i = 15; i >= 0; i--) {
            const index = Number(bitBuffer & 0x1fn);
            randStr = CROCKFORD_ALPHABET[index] + randStr;
            bitBuffer >>= 5n;
        }

        return timeStr + randStr;
    }

    /**
     * NanoID Generator (21 characters)
     */
    function generateNanoID(size = 21) {
        const bytes = new Uint8Array(size);
        crypto.getRandomValues(bytes);
        let id = '';
        for (let i = 0; i < size; i++) {
            id += NANOID_ALPHABET[bytes[i] & 63];
        }
        return id;
    }

    /**
     * Format byte array to standard UUID string
     */
    function formatUUIDBytes(bytes, options = {}) {
        const { uppercase = false, hyphens = true, braces = false } = options;
        let hex = '';
        for (let i = 0; i < 16; i++) {
            hex += bytes[i].toString(16).padStart(2, '0');
        }

        let result = hex;
        if (hyphens) {
            result = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
        }

        if (uppercase) {
            result = result.toUpperCase();
        }

        if (braces) {
            result = `{${result}}`;
        }

        return result;
    }

    // ==========================================
    // 4. GENERATOR CONTROLS & BATCH RUN
    // ==========================================

    const qtyChips = document.querySelectorAll('.qty-chip');
    const customQtyInput = el('customQtyInput');
    const typeRadios = document.querySelectorAll('input[name="idType"]');
    const typeCards = document.querySelectorAll('.type-radio-card');
    const optUppercase = el('optUppercase');
    const optHyphens = el('optHyphens');
    const optBraces = el('optBraces');
    const wrapperOptHyphens = el('wrapperOptHyphens');
    const wrapperOptBraces = el('wrapperOptBraces');
    const outputFormatSelect = el('outputFormatSelect');
    const btnGenerate = el('btnGenerate');
    const outputArea = el('outputArea');
    const outputMetaBadge = el('outputMetaBadge');
    const genSpeedInfo = el('genSpeedInfo');

    // Sync radio card active class
    function updateTypeCardState() {
        const selectedType = document.querySelector('input[name="idType"]:checked').value;
        typeCards.forEach(card => {
            const radio = card.querySelector('input[type="radio"]');
            card.classList.toggle('active', radio.checked);
        });

        const isUUID = selectedType.startsWith('uuid');
        wrapperOptHyphens.style.display = isUUID ? 'flex' : 'none';
        wrapperOptBraces.style.display = isUUID ? 'flex' : 'none';
    }

    typeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            updateTypeCardState();
            runBatchGeneration();
        });
    });

    // Quantity selection
    qtyChips.forEach(chip => {
        chip.addEventListener('click', () => {
            qtyChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            customQtyInput.value = chip.getAttribute('data-qty');
            runBatchGeneration();
        });
    });

    customQtyInput.addEventListener('input', () => {
        let val = parseInt(customQtyInput.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 1000) val = 1000;

        qtyChips.forEach(chip => {
            chip.classList.toggle('active', chip.getAttribute('data-qty') === String(val));
        });
    });

    customQtyInput.addEventListener('change', () => {
        let val = parseInt(customQtyInput.value, 10);
        if (isNaN(val) || val < 1) customQtyInput.value = 1;
        if (val > 1000) customQtyInput.value = 1000;
        runBatchGeneration();
    });

    [optUppercase, optHyphens, optBraces, outputFormatSelect].forEach(input => {
        if (input) input.addEventListener('change', runBatchGeneration);
    });

    function runBatchGeneration() {
        const startTime = performance.now();
        const selectedType = document.querySelector('input[name="idType"]:checked').value;
        let count = parseInt(customQtyInput.value, 10);
        if (isNaN(count) || count < 1) count = 1;
        if (count > 1000) count = 1000;

        const uppercase = optUppercase.checked;
        const hyphens = optHyphens.checked;
        const braces = optBraces.checked;
        const format = outputFormatSelect.value;

        const results = [];
        for (let i = 0; i < count; i++) {
            let idStr = '';
            if (selectedType === 'uuidv7') {
                const bytes = generateUUIDv7();
                idStr = formatUUIDBytes(bytes, { uppercase, hyphens, braces });
            } else if (selectedType === 'uuidv4') {
                const bytes = generateUUIDv4();
                idStr = formatUUIDBytes(bytes, { uppercase, hyphens, braces });
            } else if (selectedType === 'uuidv1') {
                const bytes = generateUUIDv1();
                idStr = formatUUIDBytes(bytes, { uppercase, hyphens, braces });
            } else if (selectedType === 'ulid') {
                idStr = generateULID();
                if (!uppercase) idStr = idStr.toLowerCase();
            } else if (selectedType === 'nanoid') {
                idStr = generateNanoID();
                if (uppercase) idStr = idStr.toUpperCase();
            }
            results.push(idStr);
        }

        // Format final text
        let formattedOutput = '';
        if (format === 'lines') {
            formattedOutput = results.join('\n');
        } else if (format === 'json') {
            formattedOutput = JSON.stringify(results, null, 2);
        } else if (format === 'sql') {
            formattedOutput = `IN (\n  '${results.join("',\n  '")}'\n)`;
        } else if (format === 'comma') {
            formattedOutput = results.join(', ');
        } else if (format === 'quoted-comma') {
            formattedOutput = `'${results.join("', '")}'`;
        }

        outputArea.value = formattedOutput;
        const duration = (performance.now() - startTime).toFixed(2);
        outputMetaBadge.textContent = `${count} ID dibuat (${selectedType.toUpperCase()})`;
        genSpeedInfo.textContent = `⚡ Dibuat dalam ${duration} ms (Web Crypto API CSPRNG)`;
    }

    if (btnGenerate) {
        btnGenerate.addEventListener('click', runBatchGeneration);
    }

    // ==========================================
    // 5. OUTPUT ACTIONS (COPY, DOWNLOAD, CLEAR)
    // ==========================================

    const btnCopyAll = el('btnCopyAll');
    const btnCopyFirst = el('btnCopyFirst');
    const btnDownload = el('btnDownload');
    const btnClearOutput = el('btnClearOutput');

    if (btnCopyAll) {
        btnCopyAll.addEventListener('click', () => {
            const val = outputArea.value;
            if (!val) return;
            navigator.clipboard.writeText(val).then(() => {
                showToast('✅ Semua ID berhasil disalin ke clipboard!');
            }).catch(() => {
                outputArea.select();
                document.execCommand('copy');
                showToast('✅ Semua ID berhasil disalin!');
            });
        });
    }

    if (btnCopyFirst) {
        btnCopyFirst.addEventListener('click', () => {
            const val = outputArea.value.trim();
            if (!val) return;
            const lines = val.split('\n');
            let first = lines[0].replace(/^[\s\(\[\{'"`,]+|[\s\)\]\}'",;]+$/g, '');
            navigator.clipboard.writeText(first).then(() => {
                showToast(`✅ ID pertama disalin: ${first}`);
            });
        });
    }

    if (btnDownload) {
        btnDownload.addEventListener('click', () => {
            const val = outputArea.value;
            if (!val) {
                showToast('Tidak ada data untuk diunduh.', 'warning');
                return;
            }
            const selectedType = document.querySelector('input[name="idType"]:checked').value;
            const blob = new Blob([val], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedType}_${Date.now()}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('💾 Berkas berhasil diunduh!');
        });
    }

    if (btnClearOutput) {
        btnClearOutput.addEventListener('click', () => {
            outputArea.value = '';
            outputMetaBadge.textContent = 'Kosong';
            genSpeedInfo.textContent = 'Output telah dibersihkan';
        });
    }

    // ==========================================
    // 6. INSPECTOR & DECODER LOGIC
    // ==========================================

    const inspectInput = el('inspectInput');
    const btnPasteInspect = el('btnPasteInspect');
    const clearInspectBtn = el('clearInspectBtn');
    const sampleV7Btn = el('sampleV7Btn');
    const sampleV4Btn = el('sampleV4Btn');
    const sampleUlidBtn = el('sampleUlidBtn');
    const sampleV1Btn = el('sampleV1Btn');

    const inspectStatusIcon = el('inspectStatusIcon');
    const inspectStatusTitle = el('inspectStatusTitle');
    const inspectStatusDesc = el('inspectStatusDesc');
    const inspectStatusTags = el('inspectStatusTags');

    const timestampCard = el('timestampCard');
    const tsLocal = el('tsLocal');
    const tsIso = el('tsIso');
    const tsRelative = el('tsRelative');
    const tsEpoch = el('tsEpoch');

    const anatomyCard = el('anatomyCard');
    const anatomyVisual = el('anatomyVisual');
    const anatomyTableBody = el('anatomyTableBody');

    const altRepCard = el('altRepCard');
    const repList = el('repList');

    if (inspectInput) {
        inspectInput.addEventListener('input', () => {
            inspectIdentifier(inspectInput.value.trim());
        });
    }

    if (btnPasteInspect) {
        btnPasteInspect.addEventListener('click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                if (text) {
                    inspectInput.value = text.trim();
                    inspectIdentifier(text.trim());
                    showToast('📋 Teks di-paste dari clipboard!');
                }
            } catch (err) {
                inspectInput.focus();
                showToast('Silakan paste manual (Ctrl+V / Cmd+V)', 'warning');
            }
        });
    }

    if (clearInspectBtn) {
        clearInspectBtn.addEventListener('click', () => {
            inspectInput.value = '';
            resetInspector();
        });
    }

    // Sample buttons
    if (sampleV7Btn) {
        sampleV7Btn.addEventListener('click', () => {
            const v7 = formatUUIDBytes(generateUUIDv7());
            inspectInput.value = v7;
            inspectIdentifier(v7);
        });
    }

    if (sampleV4Btn) {
        sampleV4Btn.addEventListener('click', () => {
            const v4 = formatUUIDBytes(generateUUIDv4());
            inspectInput.value = v4;
            inspectIdentifier(v4);
        });
    }

    if (sampleUlidBtn) {
        sampleUlidBtn.addEventListener('click', () => {
            const ulidVal = generateULID();
            inspectInput.value = ulidVal;
            inspectIdentifier(ulidVal);
        });
    }

    if (sampleV1Btn) {
        sampleV1Btn.addEventListener('click', () => {
            const v1 = formatUUIDBytes(generateUUIDv1());
            inspectInput.value = v1;
            inspectIdentifier(v1);
        });
    }

    function resetInspector() {
        inspectStatusIcon.textContent = '❓';
        inspectStatusTitle.textContent = 'Masukkan identifier untuk memulai';
        inspectStatusDesc.textContent = 'Mendukung UUID v7 (RFC 9562), UUID v4 (RFC 4122), UUID v1, ULID, dan format hex 128-bit.';
        inspectStatusTags.innerHTML = '';
        timestampCard.classList.add('hidden');
        anatomyCard.classList.add('hidden');
        altRepCard.classList.add('hidden');
    }

    function getRelativeTimeString(date) {
        const now = Date.now();
        const diffMs = now - date.getTime();
        const diffSec = Math.round(diffMs / 1000);
        const diffMin = Math.round(diffSec / 60);
        const diffHour = Math.round(diffMin / 60);
        const diffDay = Math.round(diffHour / 24);

        if (Math.abs(diffSec) < 5) return 'Baru saja (Just now)';
        if (diffSec > 0) {
            if (diffSec < 60) return `${diffSec} detik yang lalu`;
            if (diffMin < 60) return `${diffMin} menit yang lalu`;
            if (diffHour < 24) return `${diffHour} jam yang lalu`;
            return `${diffDay} hari yang lalu`;
        } else {
            const absSec = Math.abs(diffSec);
            if (absSec < 60) return `dalam ${absSec} detik`;
            return `di masa depan (${Math.abs(diffMin)} menit lagi)`;
        }
    }

    /**
     * Inspect any input string
     */
    function inspectIdentifier(rawInput) {
        if (!rawInput) {
            resetInspector();
            return;
        }

        // Clean input: strip braces, quotes, spaces
        const clean = rawInput.replace(/[{}"'`,;\(\)\s]/g, '').trim();

        // 1. Check if ULID (26 Crockford Base32 characters)
        const ulidRegex = /^[0123456789ABCDEFGHJKMNPQRSTVWXYZabcdefghjkmnpqrstvwxyz]{26}$/;
        if (ulidRegex.test(clean)) {
            inspectULID(clean.toUpperCase());
            return;
        }

        // 2. Check if UUID format (with or without hyphens)
        const uuidWithHyphens = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        const uuidCompact = /^[0-9a-fA-F]{32}$/;

        if (uuidWithHyphens.test(clean) || uuidCompact.test(clean)) {
            const hex32 = clean.replace(/-/g, '').toLowerCase();
            inspectUUID(hex32);
            return;
        }

        // 3. Fallback check for NanoID
        if (/^[A-Za-z0-9_-]{21}$/.test(clean)) {
            inspectNanoID(clean);
            return;
        }

        // Invalid Format
        inspectStatusIcon.textContent = '⚠️';
        inspectStatusTitle.textContent = 'Format Tidak Dikenali';
        inspectStatusDesc.textContent = `Input memiliki panjang ${clean.length} karakter dan bukan UUID standar (32/36 hex), ULID (26 base32), maupun NanoID (21 char).`;
        inspectStatusTags.innerHTML = `<span class="badge-pill danger">Invalid Format</span>`;
        timestampCard.classList.add('hidden');
        anatomyCard.classList.add('hidden');
        altRepCard.classList.add('hidden');
    }

    /**
     * Inspect valid UUID (hex32)
     */
    function inspectUUID(hex32) {
        // Extract bytes
        const bytes = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            bytes[i] = parseInt(hex32.substr(i * 2, 2), 16);
        }

        const versionNibble = (bytes[6] >> 4) & 0x0f;
        const variantBits = (bytes[8] >> 6) & 0x03;

        let variantName = 'RFC 4122 / RFC 9562 (Leach-Salz)';
        if ((bytes[8] & 0x80) === 0) variantName = 'NCS Backward Compatibility';
        else if ((bytes[8] & 0xe0) === 0xc0) variantName = 'Microsoft GUID';
        else if ((bytes[8] & 0xe0) === 0xe0) variantName = 'Reserved for future definition';

        const standardHyphenated = `${hex32.slice(0, 8)}-${hex32.slice(8, 12)}-${hex32.slice(12, 16)}-${hex32.slice(16, 20)}-${hex32.slice(20, 32)}`;

        inspectStatusIcon.textContent = '✅';
        inspectStatusTags.innerHTML = `
            <span class="badge-pill rec">Valid UUID</span>
            <span class="badge-pill info">Version ${versionNibble}</span>
            <span class="badge-pill">${variantName.split(' ')[0]}</span>
        `;

        if (versionNibble === 7) {
            // UUID v7
            inspectStatusTitle.textContent = 'UUID Version 7 (Time-Ordered Unix Epoch)';
            inspectStatusDesc.textContent = 'Standar modern RFC 9562 untuk database. 48-bit pertama adalah Unix timestamp presisi milidetik.';

            // Timestamp extraction (48-bit from first 12 hex chars)
            const tsHex = hex32.slice(0, 12);
            const tsMs = parseInt(tsHex, 16);
            renderTimestampData(tsMs);

            // Anatomy breakdown for v7
            renderUUIDv7Anatomy(hex32, bytes, tsMs);
        } else if (versionNibble === 4) {
            // UUID v4
            inspectStatusTitle.textContent = 'UUID Version 4 (Random)';
            inspectStatusDesc.textContent = 'RFC 4122 / RFC 9562 standar. 122-bit angka acak kriptografis murni. Tidak menyimpan informasi waktu.';
            timestampCard.classList.add('hidden');
            renderUUIDv4Anatomy(hex32, bytes);
        } else if (versionNibble === 1) {
            // UUID v1
            inspectStatusTitle.textContent = 'UUID Version 1 (Gregorian Time-Based)';
            inspectStatusDesc.textContent = 'RFC 4122 legacy format. Menggunakan interval 100ns sejak reformasi kalender Gregorian (1582) dan node/MAC.';

            // Extract time: time_low(32) + time_mid(16) + time_hi(12)
            const timeLow = hex32.slice(0, 8);
            const timeMid = hex32.slice(8, 12);
            const timeHi = hex32.slice(13, 16); // skip version nibble at 12
            const gregorianHex = timeHi + timeMid + timeLow;
            const gregorian100ns = BigInt('0x' + gregorianHex);
            const unixMs = Number((gregorian100ns - 122192928000000000n) / 10000n);
            renderTimestampData(unixMs);
            renderUUIDv1Anatomy(hex32, bytes);
        } else {
            // Other UUID versions (v3, v5, v8, etc.)
            inspectStatusTitle.textContent = `UUID Version ${versionNibble}`;
            inspectStatusDesc.textContent = `Format UUID RFC 4122/9562 dengan varian ${variantName}.`;
            timestampCard.classList.add('hidden');
            renderGenericUUIDAnatomy(hex32, bytes, versionNibble);
        }

        renderRepresentations(hex32, bytes, standardHyphenated);
    }

    /**
     * Inspect ULID
     */
    function inspectULID(ulidStr) {
        inspectStatusIcon.textContent = '⚡';
        inspectStatusTitle.textContent = 'ULID (Universally Unique Lexicographically Sortable Identifier)';
        inspectStatusDesc.textContent = 'Format 26 karakter Crockford Base32 (128-bit). 10 karakter pertama menyimpan timestamp 48-bit.';
        inspectStatusTags.innerHTML = `
            <span class="badge-pill rec">Valid ULID</span>
            <span class="badge-pill info">26 Base32 Chars</span>
            <span class="badge-pill">URL Safe</span>
        `;

        // Decode 10 characters timestamp (Crockford Base32)
        const timePart = ulidStr.slice(0, 10);
        const randPart = ulidStr.slice(10);

        let tsMs = 0;
        for (let i = 0; i < 10; i++) {
            const char = timePart[i];
            const val = CROCKFORD_MAP[char] || 0;
            tsMs = tsMs * 32 + val;
        }

        renderTimestampData(tsMs);

        // Convert ULID to 16 bytes for representation
        let totalBigInt = 0n;
        for (let i = 0; i < 26; i++) {
            const val = BigInt(CROCKFORD_MAP[ulidStr[i]] || 0);
            totalBigInt = (totalBigInt * 32n) + val;
        }

        let hex32 = totalBigInt.toString(16).padStart(32, '0');
        const bytes = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            bytes[i] = parseInt(hex32.substr(i * 2, 2), 16);
        }
        const standardUUID = `${hex32.slice(0, 8)}-${hex32.slice(8, 12)}-${hex32.slice(12, 16)}-${hex32.slice(16, 20)}-${hex32.slice(20, 32)}`;

        // Anatomy for ULID
        anatomyCard.classList.remove('hidden');
        anatomyVisual.innerHTML = `
            <div class="anatomy-block block-ts">
                <span>${timePart}</span>
                <span class="block-label">Timestamp (10 Chars / 48-Bit)</span>
            </div>
            <div class="anatomy-block block-randb">
                <span>${randPart}</span>
                <span class="block-label">Randomness / Entropy (16 Chars / 80-Bit)</span>
            </div>
        `;

        anatomyTableBody.innerHTML = `
            <tr>
                <td><strong>Timestamp (ms)</strong></td>
                <td>48 bits (10 chars)</td>
                <td><code>${timePart}</code></td>
                <td>Unix epoch dalam milidetik (${new Date(tsMs).toISOString()})</td>
            </tr>
            <tr>
                <td><strong>Randomness</strong></td>
                <td>80 bits (16 chars)</td>
                <td><code>${randPart}</code></td>
                <td>Crockford Base32 entropy kriptografis</td>
            </tr>
        `;

        renderRepresentations(hex32, bytes, standardUUID, ulidStr);
    }

    /**
     * Inspect NanoID
     */
    function inspectNanoID(nanoIdStr) {
        inspectStatusIcon.textContent = '✨';
        inspectStatusTitle.textContent = 'NanoID';
        inspectStatusDesc.textContent = 'Compact URL-friendly unique string (21 characters, A-Za-z0-9_-). Menggunakan entropy kriptografis tanpa timestamp.';
        inspectStatusTags.innerHTML = `
            <span class="badge-pill info">NanoID (21 Chars)</span>
            <span class="badge-pill">URL Safe</span>
        `;
        timestampCard.classList.add('hidden');
        anatomyCard.classList.add('hidden');

        altRepCard.classList.remove('hidden');
        repList.innerHTML = `
            <div class="rep-item">
                <div class="rep-left">
                    <span class="rep-name">NanoID Asli</span>
                </div>
                <span class="rep-val">${nanoIdStr}</span>
                <button class="btn btn-xs secondary-btn copy-rep-btn" data-copy="${nanoIdStr}">Salin</button>
            </div>
            <div class="rep-item">
                <div class="rep-left">
                    <span class="rep-name">Uppercase</span>
                </div>
                <span class="rep-val">${nanoIdStr.toUpperCase()}</span>
                <button class="btn btn-xs secondary-btn copy-rep-btn" data-copy="${nanoIdStr.toUpperCase()}">Salin</button>
            </div>
        `;
        bindCopyRepButtons();
    }

    /**
     * Render Timestamp UI
     */
    function renderTimestampData(tsMs) {
        timestampCard.classList.remove('hidden');
        const date = new Date(tsMs);

        // Check if date is reasonable
        if (isNaN(date.getTime()) || tsMs < 0 || tsMs > 4102444800000) {
            tsLocal.textContent = 'Timestamp di luar batas wajar';
            tsIso.textContent = '-';
            tsRelative.textContent = '-';
            tsEpoch.textContent = `${tsMs} ms`;
            return;
        }

        // Format Indonesian locale
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3,
            timeZoneName: 'short'
        };

        try {
            tsLocal.textContent = date.toLocaleDateString('id-ID', options);
        } catch (e) {
            tsLocal.textContent = date.toString();
        }

        tsIso.textContent = date.toISOString();
        tsRelative.textContent = getRelativeTimeString(date);
        tsEpoch.textContent = `${tsMs} ms (${Math.floor(tsMs / 1000)} s)`;
    }

    /**
     * Render Anatomy for UUID v7
     */
    function renderUUIDv7Anatomy(hex32, bytes, tsMs) {
        anatomyCard.classList.remove('hidden');

        const part1 = hex32.slice(0, 8);
        const part2 = hex32.slice(8, 12);
        const ver = hex32.slice(12, 13);
        const randA = hex32.slice(13, 16);
        const varBits = hex32.slice(16, 17);
        const randB = hex32.slice(17, 32);

        anatomyVisual.innerHTML = `
            <div class="anatomy-block block-ts">
                <span>${part1}</span>
                <span class="block-label">unix_ts_ms (32-bit)</span>
            </div>
            <span class="block-hyphen">-</span>
            <div class="anatomy-block block-ts">
                <span>${part2}</span>
                <span class="block-label">unix_ts_ms (16-bit)</span>
            </div>
            <span class="block-hyphen">-</span>
            <div class="anatomy-block block-ver">
                <span>${ver}</span>
                <span class="block-label">Ver 7</span>
            </div>
            <div class="anatomy-block block-randa">
                <span>${randA}</span>
                <span class="block-label">rand_a / counter (12-bit)</span>
            </div>
            <span class="block-hyphen">-</span>
            <div class="anatomy-block block-var">
                <span>${varBits}</span>
                <span class="block-label">Var (10)</span>
            </div>
            <div class="anatomy-block block-randb">
                <span>${randB.slice(0, 3)}</span>
                <span class="block-label">rand_b</span>
            </div>
            <span class="block-hyphen">-</span>
            <div class="anatomy-block block-randb">
                <span>${randB.slice(3)}</span>
                <span class="block-label">rand_b (48-bit)</span>
            </div>
        `;

        anatomyTableBody.innerHTML = `
            <tr>
                <td><strong>unix_ts_ms</strong></td>
                <td>48 bits (6 bytes)</td>
                <td><code>0x${part1}${part2}</code> (${tsMs} ms)</td>
                <td>Unix timestamp dalam milidetik (Big-endian)</td>
            </tr>
            <tr>
                <td><strong>ver (Version)</strong></td>
                <td>4 bits</td>
                <td><code>0x${ver}</code> (Binary: 0111)</td>
                <td>UUID Version 7 (RFC 9562)</td>
            </tr>
            <tr>
                <td><strong>rand_a</strong></td>
                <td>12 bits</td>
                <td><code>0x${randA}</code></td>
                <td>Sub-millisecond monotonic sequence counter atau pseudo-random</td>
            </tr>
            <tr>
                <td><strong>var (Variant)</strong></td>
                <td>2 bits</td>
                <td><code>0x${varBits}</code> (Binary: 10xx)</td>
                <td>RFC 4122 / RFC 9562 Variant 1 (Leach-Salz)</td>
            </tr>
            <tr>
                <td><strong>rand_b</strong></td>
                <td>62 bits</td>
                <td><code>0x${randB}</code></td>
                <td>Cryptographic pseudo-random bits untuk collision-resistance</td>
            </tr>
        `;
    }

    /**
     * Render Anatomy for UUID v4
     */
    function renderUUIDv4Anatomy(hex32, bytes) {
        anatomyCard.classList.remove('hidden');

        const part1 = hex32.slice(0, 8);
        const part2 = hex32.slice(8, 12);
        const ver = hex32.slice(12, 13);
        const randMid = hex32.slice(13, 16);
        const varBits = hex32.slice(16, 17);
        const randEnd1 = hex32.slice(17, 20);
        const randEnd2 = hex32.slice(20, 32);

        anatomyVisual.innerHTML = `
            <div class="anatomy-block block-randb">
                <span>${part1}</span>
                <span class="block-label">random (32-bit)</span>
            </div>
            <span class="block-hyphen">-</span>
            <div class="anatomy-block block-randb">
                <span>${part2}</span>
                <span class="block-label">random (16-bit)</span>
            </div>
            <span class="block-hyphen">-</span>
            <div class="anatomy-block block-ver">
                <span>${ver}</span>
                <span class="block-label">Ver 4</span>
            </div>
            <div class="anatomy-block block-randb">
                <span>${randMid}</span>
                <span class="block-label">random (12-bit)</span>
            </div>
            <span class="block-hyphen">-</span>
            <div class="anatomy-block block-var">
                <span>${varBits}</span>
                <span class="block-label">Var (10)</span>
            </div>
            <div class="anatomy-block block-randb">
                <span>${randEnd1}</span>
                <span class="block-label">random</span>
            </div>
            <span class="block-hyphen">-</span>
            <div class="anatomy-block block-randb">
                <span>${randEnd2}</span>
                <span class="block-label">random (48-bit)</span>
            </div>
        `;

        anatomyTableBody.innerHTML = `
            <tr>
                <td><strong>Random Payload</strong></td>
                <td>122 bits</td>
                <td><code>0x${part1}...</code></td>
                <td>Cryptographically secure random data</td>
            </tr>
            <tr>
                <td><strong>ver (Version)</strong></td>
                <td>4 bits</td>
                <td><code>0x${ver}</code> (Binary: 0100)</td>
                <td>UUID Version 4 (Random)</td>
            </tr>
            <tr>
                <td><strong>var (Variant)</strong></td>
                <td>2 bits</td>
                <td><code>0x${varBits}</code> (Binary: 10xx)</td>
                <td>RFC 4122 Variant 1 (Leach-Salz)</td>
            </tr>
        `;
    }

    /**
     * Render Anatomy for UUID v1
     */
    function renderUUIDv1Anatomy(hex32, bytes) {
        anatomyCard.classList.remove('hidden');
        anatomyVisual.innerHTML = `
            <div class="anatomy-block block-ts">
                <span>${hex32.slice(0, 8)}</span>
                <span class="block-label">time_low</span>
            </div>
            <span class="block-hyphen">-</span>
            <div class="anatomy-block block-ts">
                <span>${hex32.slice(8, 12)}</span>
                <span class="block-label">time_mid</span>
            </div>
            <span class="block-hyphen">-</span>
            <div class="anatomy-block block-ver">
                <span>${hex32.slice(12, 13)}</span>
                <span class="block-label">Ver 1</span>
            </div>
            <div class="anatomy-block block-ts">
                <span>${hex32.slice(13, 16)}</span>
                <span class="block-label">time_hi</span>
            </div>
            <span class="block-hyphen">-</span>
            <div class="anatomy-block block-var">
                <span>${hex32.slice(16, 20)}</span>
                <span class="block-label">clock_seq</span>
            </div>
            <span class="block-hyphen">-</span>
            <div class="anatomy-block block-randb">
                <span>${hex32.slice(20, 32)}</span>
                <span class="block-label">node / MAC</span>
            </div>
        `;

        anatomyTableBody.innerHTML = `
            <tr>
                <td><strong>time_low / mid / hi</strong></td>
                <td>60 bits</td>
                <td><code>0x${hex32.slice(0, 12)}...</code></td>
                <td>Timestamp 100ns sejak kalender Gregorian (1582)</td>
            </tr>
            <tr>
                <td><strong>Version</strong></td>
                <td>4 bits</td>
                <td><code>0x1</code></td>
                <td>UUID Version 1 (Time + Node)</td>
            </tr>
            <tr>
                <td><strong>node</strong></td>
                <td>48 bits</td>
                <td><code>${hex32.slice(20, 32)}</code></td>
                <td>MAC address kartu jaringan atau acak</td>
            </tr>
        `;
    }

    function renderGenericUUIDAnatomy(hex32, bytes, ver) {
        anatomyCard.classList.remove('hidden');
        anatomyVisual.innerHTML = `
            <div class="anatomy-block block-ts">
                <span>${hex32.slice(0, 8)}-${hex32.slice(8, 12)}-${hex32.slice(12, 16)}-${hex32.slice(16, 20)}-${hex32.slice(20, 32)}</span>
                <span class="block-label">UUID v${ver}</span>
            </div>
        `;
        anatomyTableBody.innerHTML = `
            <tr>
                <td><strong>Version</strong></td>
                <td>4 bits</td>
                <td><code>0x${ver}</code></td>
                <td>UUID Version ${ver}</td>
            </tr>
        `;
    }

    /**
     * Render Representations List (Base64, Byte Array, BigInt, etc.)
     */
    function renderRepresentations(hex32, bytes, standardUUID, originalULID = null) {
        altRepCard.classList.remove('hidden');

        // Convert bytes to Base64
        let binaryString = '';
        for (let i = 0; i < 16; i++) {
            binaryString += String.fromCharCode(bytes[i]);
        }
        const base64Str = btoa(binaryString);

        // BigInt decimal representation
        const bigIntVal = BigInt('0x' + hex32).toString(10);

        // Byte Array
        const byteArrStr = '[' + Array.from(bytes).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ') + ']';

        let reps = [
            { name: 'UUID Standar (Hyphenated)', value: standardUUID },
            { name: 'Hexadecimal Tanpa Hyphen', value: hex32 },
            { name: 'Uppercase Hex', value: hex32.toUpperCase() },
            { name: 'Kurung Kurawal (Braces)', value: `{${standardUUID}}` },
            { name: 'Base64 (16 Bytes / Raw Binary)', value: base64Str },
            { name: 'Java / C Byte Array', value: byteArrStr },
            { name: 'BigInteger (Decimal)', value: bigIntVal }
        ];

        if (originalULID) {
            reps.unshift({ name: 'ULID Crockford Base32', value: originalULID });
        }

        repList.innerHTML = reps.map(r => `
            <div class="rep-item">
                <div class="rep-left">
                    <span class="rep-name">${r.name}</span>
                </div>
                <span class="rep-val">${r.value}</span>
                <button type="button" class="btn btn-xs secondary-btn copy-rep-btn" data-copy="${r.value.replace(/"/g, '&quot;')}">Salin</button>
            </div>
        `).join('');

        bindCopyRepButtons();
    }

    function bindCopyRepButtons() {
        document.querySelectorAll('.copy-rep-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const text = btn.getAttribute('data-copy');
                navigator.clipboard.writeText(text).then(() => {
                    showToast('✅ Berhasil disalin ke clipboard!');
                });
            });
        });
    }

    // ==========================================
    // 7. BACKEND GUIDE CODE SNIPPETS
    // ==========================================

    const snippetTabBtns = document.querySelectorAll('.snippet-tab-btn');
    const snippetContents = document.querySelectorAll('.snippet-content');

    snippetTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            snippetTabBtns.forEach(b => b.classList.toggle('active', b === btn));
            snippetContents.forEach(c => {
                c.classList.toggle('active', c.id === `snippet-${lang}`);
            });
        });
    });

    document.querySelectorAll('.copy-snippet-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const container = e.target.closest('.snippet-content');
            const code = container.querySelector('code').innerText;
            navigator.clipboard.writeText(code).then(() => {
                showToast('✅ Cuplikan kode berhasil disalin!');
            });
        });
    });

    // ==========================================
    // 8. TOAST UTILITY
    // ==========================================

    let toastTimer = null;
    function showToast(msg, type = 'info') {
        const toast = el('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.className = `toast show ${type}`;

        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, 2800);
    }

    // Initialize on load
    updateTypeCardState();
    runBatchGeneration();

})();
