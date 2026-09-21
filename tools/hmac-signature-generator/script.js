/**
 * HMAC & API Signature Studio
 * 100% Client-Side Web Crypto API (SubtleCrypto)
 * Zero Dependencies, Fast & Secure
 */

(function () {
    'use strict';

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

    // ==========================================
    // 3. CRYPTOGRAPHIC HELPERS (WEB CRYPTO API)
    // ==========================================

    const textEncoder = new TextEncoder();

    /**
     * Convert ArrayBuffer to Hex String
     */
    function bufferToHex(buffer) {
        const byteArray = new Uint8Array(buffer);
        let hex = '';
        for (let i = 0; i < byteArray.length; i++) {
            hex += byteArray[i].toString(16).padStart(2, '0');
        }
        return hex;
    }

    /**
     * Convert ArrayBuffer to Base64
     */
    function bufferToBase64(buffer) {
        const byteArray = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < byteArray.length; i++) {
            binary += String.fromCharCode(byteArray[i]);
        }
        return btoa(binary);
    }

    /**
     * Convert Base64 to Base64URL
     */
    function base64ToBase64Url(base64) {
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    /**
     * Parse Secret Key based on encoding
     */
    function parseKeyBytes(keyStr, encoding = 'utf8') {
        if (encoding === 'hex') {
            const clean = keyStr.replace(/[^0-9a-fA-F]/g, '');
            const len = Math.floor(clean.length / 2);
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
            }
            return bytes;
        } else if (encoding === 'base64') {
            try {
                const bin = atob(keyStr.trim());
                const bytes = new Uint8Array(bin.length);
                for (let i = 0; i < bin.length; i++) {
                    bytes[i] = bin.charCodeAt(i);
                }
                return bytes;
            } catch (e) {
                return textEncoder.encode(keyStr);
            }
        }
        return textEncoder.encode(keyStr);
    }

    /**
     * Calculate HMAC or Hash using Web Crypto API
     */
    async function calculateSignature(algo, keyStr, keyEncoding, messageStr) {
        const msgBytes = textEncoder.encode(messageStr);

        if (algo === 'PLAIN-SHA256' || algo === 'PLAIN-SHA512') {
            const hashName = algo === 'PLAIN-SHA256' ? 'SHA-256' : 'SHA-512';
            const digest = await crypto.subtle.digest(hashName, msgBytes);
            return digest;
        }

        const keyBytes = parseKeyBytes(keyStr, keyEncoding);
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            keyBytes,
            { name: 'HMAC', hash: { name: algo } },
            false,
            ['sign']
        );

        const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgBytes);
        return signature;
    }

    // ==========================================
    // 4. GENERATOR CONTROLS & REALTIME LOGIC
    // ==========================================

    const algoSelect = el('algoSelect');
    const secretKeyInput = el('secretKeyInput');
    const messageInput = el('messageInput');
    const groupSecretKey = el('groupSecretKey');
    const payloadStats = el('payloadStats');
    const calcTimeBadge = el('calcTimeBadge');
    const outHexLower = el('outHexLower');
    const outHexUpper = el('outHexUpper');
    const outBase64 = el('outBase64');
    const outBase64Url = el('outBase64Url');
    const httpHeaderSnippet = el('httpHeaderSnippet');
    const btnToggleKeyVisibility = el('btnToggleKeyVisibility');
    const btnGenRandomKey = el('btnGenRandomKey');
    const btnClearGen = el('btnClearGen');
    const btnSendToVerifier = el('btnSendToVerifier');

    // Toggle password visibility
    if (btnToggleKeyVisibility) {
        let isPass = false;
        btnToggleKeyVisibility.addEventListener('click', () => {
            isPass = !isPass;
            secretKeyInput.type = isPass ? 'password' : 'text';
            btnToggleKeyVisibility.textContent = isPass ? '🙈' : '👁️';
        });
    }

    // Generate random secret key
    if (btnGenRandomKey) {
        btnGenRandomKey.addEventListener('click', () => {
            const randomBytes = new Uint8Array(32);
            crypto.getRandomValues(randomBytes);
            let hex = '';
            for (let i = 0; i < randomBytes.length; i++) {
                hex += randomBytes[i].toString(16).padStart(2, '0');
            }
            secretKeyInput.value = hex;
            runGenerator();
            showToast('🎲 Secret key acak 256-bit dibuat!');
        });
    }

    // Reset button
    if (btnClearGen) {
        btnClearGen.addEventListener('click', () => {
            secretKeyInput.value = '';
            messageInput.value = '';
            runGenerator();
        });
    }

    // Presets
    el('presetStandard')?.addEventListener('click', () => {
        algoSelect.value = 'SHA-256';
        secretKeyInput.value = 'secret-webhook-key-2026';
        messageInput.value = JSON.stringify({
            event: 'order.completed',
            order_id: 'INV-2026-0921-001',
            amount: 250000,
            timestamp: Math.floor(Date.now() / 1000)
        }, null, 2);
        runGenerator();
        showToast('Preset Standard Webhook dimuat!');
    });

    el('presetMidtrans')?.addEventListener('click', () => {
        algoSelect.value = 'PLAIN-SHA512';
        const orderId = 'INV-1029384';
        const statusCode = '200';
        const grossAmount = '150000.00';
        const serverKey = 'SB-Mid-server-YOUR-SERVER-KEY';
        secretKeyInput.value = serverKey;
        // Midtrans: SHA512(order_id + status_code + gross_amount + ServerKey)
        messageInput.value = `${orderId}${statusCode}${grossAmount}${serverKey}`;
        runGenerator();
        showToast('Preset Midtrans Signature dimuat!');
    });

    el('presetStripe')?.addEventListener('click', () => {
        algoSelect.value = 'SHA-256';
        secretKeyInput.value = 'whsec_9b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e';
        const timestamp = Math.floor(Date.now() / 1000);
        const payload = JSON.stringify({ id: 'evt_1Mjj782eZvKYlo2C', object: 'event', type: 'payment_intent.succeeded' });
        // Stripe uses: timestamp.payload
        messageInput.value = `${timestamp}.${payload}`;
        runGenerator();
        showToast('Preset Stripe Webhook dimuat!');
    });

    el('presetSnapBi')?.addEventListener('click', () => {
        algoSelect.value = 'SHA-256';
        secretKeyInput.value = 'SNAP_SECRET_KEY_PARTNER_001';
        const timestamp = new Date().toISOString();
        const minifiedBodySha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
        messageInput.value = `POST:/api/v1.0/transfer-va:token-bearer:${minifiedBodySha256}:${timestamp}`;
        runGenerator();
        showToast('Preset SNAP BI Signature dimuat!');
    });

    // Send to Verifier tab
    if (btnSendToVerifier) {
        btnSendToVerifier.addEventListener('click', () => {
            const hex = outHexLower.value;
            const key = secretKeyInput.value;
            const msg = messageInput.value;
            const algo = algoSelect.value;

            switchTab('tab-verifier');
            el('verifyExpectedSig').value = hex;
            el('verifySecretKey').value = key;
            el('verifyPayload').value = msg;
            el('verifyAlgoSelect').value = algo;
            runVerifier();
        });
    }

    async function runGenerator() {
        const start = performance.now();
        const algo = algoSelect.value;
        const isPlainHash = algo.startsWith('PLAIN');
        groupSecretKey.style.display = isPlainHash ? 'none' : 'block';

        const keyEncoding = document.querySelector('input[name="keyEncoding"]:checked')?.value || 'utf8';
        const key = secretKeyInput.value;
        const msg = messageInput.value;

        // Stats
        const byteLen = textEncoder.encode(msg).length;
        payloadStats.textContent = `${byteLen} bytes (${msg.length} chars)`;

        try {
            const buffer = await calculateSignature(algo, key, keyEncoding, msg);
            const hexLower = bufferToHex(buffer);
            const hexUpper = hexLower.toUpperCase();
            const base64 = bufferToBase64(buffer);
            const base64Url = base64ToBase64Url(base64);

            outHexLower.value = hexLower;
            outHexUpper.value = hexUpper;
            outBase64.value = base64;
            outBase64Url.value = base64Url;

            // Snippet
            httpHeaderSnippet.textContent = `X-Signature: ${hexLower}\nX-Signature-Base64: ${base64}\nX-Signature-SHA: ${algo}`;

            const elapsed = (performance.now() - start).toFixed(2);
            calcTimeBadge.textContent = `${elapsed} ms`;
            calcTimeBadge.className = 'badge-pill rec';
        } catch (err) {
            calcTimeBadge.textContent = 'Error';
            calcTimeBadge.className = 'badge-pill danger';
            outHexLower.value = 'Error kalkulasi: ' + err.message;
            outHexUpper.value = '';
            outBase64.value = '';
            outBase64Url.value = '';
        }
    }

    [algoSelect, secretKeyInput, messageInput].forEach(inp => {
        inp?.addEventListener('input', runGenerator);
        inp?.addEventListener('change', runGenerator);
    });

    document.querySelectorAll('input[name="keyEncoding"]').forEach(radio => {
        radio.addEventListener('change', runGenerator);
    });

    // Copy Buttons in Generator
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const targetInput = el(targetId);
            if (!targetInput || !targetInput.value) return;

            navigator.clipboard.writeText(targetInput.value).then(() => {
                showToast('📋 Hasil signature disalin ke clipboard!');
            });
        });
    });

    // ==========================================
    // 5. VERIFIER & MATCHER LOGIC
    // ==========================================

    const verifyExpectedSig = el('verifyExpectedSig');
    const verifySecretKey = el('verifySecretKey');
    const verifyAlgoSelect = el('verifyAlgoSelect');
    const verifyPayload = el('verifyPayload');
    const verifyResultBanner = el('verifyResultBanner');
    const verifyIcon = el('verifyIcon');
    const verifyTitle = el('verifyTitle');
    const verifyMessage = el('verifyMessage');
    const verifyComparisonBox = el('verifyComparisonBox');
    const compExpected = el('compExpected');
    const compComputed = el('compComputed');
    const verifyTroubleshootTip = el('verifyTroubleshootTip');

    async function runVerifier() {
        const rawExpected = verifyExpectedSig.value.trim();
        const key = verifySecretKey.value;
        const algo = verifyAlgoSelect.value;
        const payload = verifyPayload.value;

        if (!rawExpected || !payload) {
            verifyResultBanner.className = 'verify-banner idle';
            verifyIcon.textContent = '❓';
            verifyTitle.textContent = 'Menunggu Data Verifikasi';
            verifyMessage.textContent = 'Masukkan Expected Signature dan Raw Payload untuk mencocokkan signature.';
            verifyComparisonBox.classList.add('hidden');
            return;
        }

        // Clean expected signature: strip common prefixes like "sha256=", "v1=", "t=...,v1="
        let cleanExpected = rawExpected;
        let prefixFound = '';
        if (cleanExpected.includes('=')) {
            const v1Match = cleanExpected.match(/v1=([0-9a-fA-F]+|[A-Za-z0-9+/=_-]+)/);
            if (v1Match) {
                prefixFound = cleanExpected.split('v1=')[0] + 'v1=';
                cleanExpected = v1Match[1];
            } else if (cleanExpected.startsWith('sha256=') || cleanExpected.startsWith('sha512=') || cleanExpected.startsWith('sha1=')) {
                prefixFound = cleanExpected.split('=')[0] + '=';
                cleanExpected = cleanExpected.split('=')[1];
            }
        }

        try {
            const buffer = await calculateSignature(algo, key, 'utf8', payload);
            const computedHexLower = bufferToHex(buffer);
            const computedHexUpper = computedHexLower.toUpperCase();
            const computedBase64 = bufferToBase64(buffer);
            const computedBase64Url = base64ToBase64Url(computedBase64);

            // Compare
            let isMatch = false;
            let matchedFormat = '';

            if (cleanExpected.toLowerCase() === computedHexLower) {
                isMatch = true;
                matchedFormat = 'Hexadecimal';
            } else if (cleanExpected === computedBase64) {
                isMatch = true;
                matchedFormat = 'Base64';
            } else if (cleanExpected === computedBase64Url) {
                isMatch = true;
                matchedFormat = 'Base64URL';
            }

            verifyComparisonBox.classList.remove('hidden');
            compExpected.textContent = rawExpected;
            compComputed.textContent = `${computedHexLower} (Hex) / ${computedBase64} (Base64)`;

            if (isMatch) {
                verifyResultBanner.className = 'verify-banner match';
                verifyIcon.textContent = '✅';
                verifyTitle.textContent = 'SIGNATURE COCOK (MATCH IDENTIK)';
                verifyMessage.textContent = `Signature valid sesuai dengan payload dan secret key (${matchedFormat}, ${algo}).`;
                verifyTroubleshootTip.style.display = 'none';
            } else {
                verifyResultBanner.className = 'verify-banner mismatch';
                verifyIcon.textContent = '❌';
                verifyTitle.textContent = 'SIGNATURE TIDAK COCOK (MISMATCH)';
                verifyMessage.textContent = 'Signature yang dihitung berbeda dengan signature yang diterima dari header.';
                verifyTroubleshootTip.style.display = 'block';

                // Troubleshooting hints
                let tip = '💡 <strong>Tips Troubleshooting Backend:</strong><br>';
                if (prefixFound) {
                    tip += `• Ditemukan prefix <code>${prefixFound}</code> yang otomatis diabaikan.<br>`;
                }
                if (payload.includes('\r\n')) {
                    tip += '• Payload mengandung karakter baris baru Windows (CRLF <code>\\r\\n</code>). Banyak server mengirimkan LF murni (<code>\\n</code>).<br>';
                }
                if (payload.startsWith('{') && (payload.includes('  ') || payload.includes('\n'))) {
                    tip += '• Format JSON di atas memiliki spasi/indentasi. Pastikan apakah server Anda mengirim JSON mentah yang ter-minify tanpa spasi.<br>';
                }
                tip += `• Cek kembali apakah Secret Key sudah sesuai dan tidak ada karakter spasi di awal/akhir.<br>`;
                tip += `• Cek apakah string-to-sign menyertakan method atau timestamp (gunakan tab <em>String-to-Sign Builder</em> jika API memerlukan canonical string).`;
                verifyTroubleshootTip.innerHTML = tip;
            }
        } catch (e) {
            verifyResultBanner.className = 'verify-banner mismatch';
            verifyIcon.textContent = '⚠️';
            verifyTitle.textContent = 'Gagal Melakukan Verifikasi';
            verifyMessage.textContent = e.message;
        }
    }

    [verifyExpectedSig, verifySecretKey, verifyAlgoSelect, verifyPayload].forEach(inp => {
        inp?.addEventListener('input', runVerifier);
        inp?.addEventListener('change', runVerifier);
    });

    // ==========================================
    // 6. STRING-TO-SIGN BUILDER
    // ==========================================

    const buildMethod = el('buildMethod');
    const buildPath = el('buildPath');
    const buildTimestamp = el('buildTimestamp');
    const buildBody = el('buildBody');
    const btnNowTimestamp = el('btnNowTimestamp');
    const outCanonicalString = el('outCanonicalString');
    const btnCopyCanonical = el('btnCopyCanonical');
    const btnApplyCanonicalToGen = el('btnApplyCanonicalToGen');

    if (buildTimestamp && !buildTimestamp.value) {
        buildTimestamp.value = new Date().toISOString();
    }

    if (btnNowTimestamp) {
        btnNowTimestamp.addEventListener('click', () => {
            buildTimestamp.value = new Date().toISOString();
            updateCanonicalString();
        });
    }

    async function updateCanonicalString() {
        const method = buildMethod.value;
        const path = buildPath.value.trim();
        const ts = buildTimestamp.value.trim();
        const rawBody = buildBody.value.trim();

        // Minify body JSON if valid
        let cleanBody = rawBody;
        try {
            cleanBody = JSON.stringify(JSON.parse(rawBody));
        } catch (e) {
            cleanBody = rawBody;
        }

        // SHA-256 of minified body
        let bodyHash = '';
        if (cleanBody) {
            const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(cleanBody));
            bodyHash = bufferToHex(digest);
        }

        // Standard canonical format: METHOD:PATH:BODY_HASH:TIMESTAMP
        const canonical = `${method}:${path}:${bodyHash}:${ts}`;
        outCanonicalString.textContent = canonical;
    }

    [buildMethod, buildPath, buildTimestamp, buildBody].forEach(inp => {
        inp?.addEventListener('input', updateCanonicalString);
        inp?.addEventListener('change', updateCanonicalString);
    });

    if (btnCopyCanonical) {
        btnCopyCanonical.addEventListener('click', () => {
            const val = outCanonicalString.textContent;
            navigator.clipboard.writeText(val).then(() => {
                showToast('📋 Canonical String-to-Sign disalin!');
            });
        });
    }

    if (btnApplyCanonicalToGen) {
        btnApplyCanonicalToGen.addEventListener('click', () => {
            const canonical = outCanonicalString.textContent;
            switchTab('tab-generator');
            messageInput.value = canonical;
            runGenerator();
            showToast('🚀 Canonical String dipasang di tab Generator!');
        });
    }

    // ==========================================
    // 7. BACKEND CODE SNIPPETS
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

    // Initialize
    runGenerator();
    updateCanonicalString();

})();
