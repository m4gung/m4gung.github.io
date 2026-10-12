/**
 * SNAP BI B2B Access Token Signature Studio
 * 100% Client-Side Web Crypto API (SubtleCrypto: RSASSA-PKCS1-v1_5 + SHA-256)
 * Specifically modeled for Bank Danamon SC-73 v1.2 & Standard ASPI SNAP BI
 */

(function () {
    "use strict";

    const DANAMON_SAMPLE_PRIV = "-----BEGIN PRIVATE KEY-----\n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\nb+avK7hkTWpQbM+taTfFGPEyL4Bp\n-----END PRIVATE KEY-----";
const DANAMON_SAMPLE_PUB = "-----BEGIN PUBLIC KEY-----\nMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAr5Iy4BwiyJNX1rcHZK1T\nnU1aog3ZRpRQz0oLysTqnNeMG1y44kF2N6rBFit2D0L9I1FAgou74DLGUGhmMwcl\nfjfAZjD9oh1F8kf69PjVARn86GkD34nClAYe/mAMy5cDf8vJFwQi8S+JqfCXHRtV\n0Ljy92Wl89qFcCY6gnLTFlni+Ggo4g24F+byEJK5mq4x7wQ5TL6tvurmWTxff/+9\nW6n9LoKVl29gU7IAI52DIuXHPyGkdIWesAHNfpwnzeLbieRDuy3VbJCeFi8EVxCL\nLv2p1NT2bkqbp5/ZvKjcI+ujhR6rPBHbgbKrA4Wz9EHM/rOhUuCsXO0OWW9OfqWq\nawmRShG53WbXquxJF3oIzy/6VHpf7QLAXR6FSPna6j7mx1cpZRHMhN/5iVl7F1OF\nRHYfqPeKsO3tjMNcvUsKzW9dwNSsvtAiGaKiX7k3WCH4wzhdcOwAE3PyyvkH0kPg\nseGU4FczXSGcxKSvrsiy7cgDLEiYKx+zNUkMocwdiduVDQho9nEdZxmm4q1YBUjp\n+Jh7qgd8pKjGUH7xTh3nFYx49RocaQ1F3CnBANaB1nIwkL4mkl/fTwgzCQvg+1VW\nt/mwRT5dXgVQ5P5Zt8hDEz01DBgezFb6TK+7vz7hxNPROsSfepNdYieO2ZAr6J1F\n3cD2VG05W+k1sJwjTHzIiYECAwEAAQ==\n-----END PUBLIC KEY-----";


    const DANAMON_CLIENT_ID = "bc72c83b-91bb-43f1-9e35-dd5eed08484f";
    const DANAMON_TIMESTAMP = "2025-08-04T14:57:08+07:00";

    const el = (id) => document.getElementById(id);

    // ==========================================
    // 1. THEME TOGGLE
    // ==========================================
    const themeToggle = el("themeToggle");
    function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
        if (themeToggle) {
            themeToggle.textContent = theme === "dark" ? "🌙" : "☀️";
            themeToggle.setAttribute("title", theme === "dark" ? "Ganti ke tema terang" : "Ganti ke tema gelap");
        }
    }

    const savedTheme = localStorage.getItem("theme") ||
        (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    applyTheme(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            const current = document.documentElement.getAttribute("data-theme") || "dark";
            applyTheme(current === "dark" ? "light" : "dark");
        });
    }

    // ==========================================
    // 2. TABS MANAGEMENT
    // ==========================================
    const navTabs = document.querySelectorAll(".nav-tab");
    const tabPanes = document.querySelectorAll(".tab-pane");

    navTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const targetId = tab.getAttribute("data-tab");
            navTabs.forEach(t => t.classList.toggle("active", t === tab));
            tabPanes.forEach(pane => pane.classList.toggle("active", pane.id === targetId));
        });
    });

    // Code Snippets Tab Switcher
    const snippetTabs = document.querySelectorAll(".snippet-tab");
    snippetTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const lang = tab.getAttribute("data-lang");
            snippetTabs.forEach(t => t.classList.toggle("active", t === tab));
            document.querySelectorAll(".snippet-block").forEach(block => {
                block.style.display = block.id === ("block-" + lang) ? "block" : "none";
            });
        });
    });

    // Copy Code Buttons inside snippet blocks
    document.querySelectorAll(".copy-code-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const block = btn.closest(".snippet-block");
            const code = block.querySelector("code").textContent;
            navigator.clipboard.writeText(code).then(() => {
                showToast("📋 Kode disalin ke clipboard!");
            });
        });
    });

    // ==========================================
    // 3. TOAST NOTIFICATIONS
    // ==========================================
    function showToast(message) {
        const container = el("toastContainer");
        if (!container) return;
        const toast = document.createElement("div");
        toast.className = "toast";
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transition = "opacity 0.3s ease";
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    // ==========================================
    // 4. CRYPTO HELPERS (WEB CRYPTO API)
    // ==========================================
    const textEncoder = new TextEncoder();

    function bufferToHex(buffer) {
        const byteArray = new Uint8Array(buffer);
        let hex = "";
        for (let i = 0; i < byteArray.length; i++) {
            hex += byteArray[i].toString(16).padStart(2, "0");
        }
        return hex;
    }

    function bufferToBase64(buffer) {
        const byteArray = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < byteArray.length; i++) {
            binary += String.fromCharCode(byteArray[i]);
        }
        return btoa(binary);
    }

    function base64ToBuffer(base64) {
        const binary = atob(base64.trim());
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    function pemToArrayBuffer(pem) {
        const b64 = pem.replace(/-----[A-Z0-9 ]+-----/g, "").replace(/\s+/g, "");
        return base64ToBuffer(b64);
    }

    function arrayBufferToPem(buffer, type) {
        const b64 = bufferToBase64(buffer);
        const lines = b64.match(/.{1,64}/g) || [];
        return "-----BEGIN " + type + "-----\n" + lines.join("\n") + "\n-----END " + type + "-----";
    }

    // Import Private Key (PKCS#8)
    async function importRsaPrivateKey(pem) {
        const binary = pemToArrayBuffer(pem);
        return await window.crypto.subtle.importKey(
            "pkcs8",
            binary,
            {
                name: "RSASSA-PKCS1-v1_5",
                hash: { name: "SHA-256" }
            },
            true,
            ["sign"]
        );
    }

    // Import Public Key (SPKI)
    async function importRsaPublicKey(pem) {
        const binary = pemToArrayBuffer(pem);
        return await window.crypto.subtle.importKey(
            "spki",
            binary,
            {
                name: "RSASSA-PKCS1-v1_5",
                hash: { name: "SHA-256" }
            },
            true,
            ["verify"]
        );
    }

    // Generate New RSA Key Pair
    async function generateRsaKeyPair(modulusLength = 4096) {
        return await window.crypto.subtle.generateKey(
            {
                name: "RSASSA-PKCS1-v1_5",
                modulusLength: modulusLength,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: { name: "SHA-256" }
            },
            true,
            ["sign", "verify"]
        );
    }

    // ==========================================
    // 5. APPLICATION STATE & ELEMENTS
    // ==========================================
    const outEncoding = el("outEncoding");
    const patternTemplate = el("patternTemplate");
    const clientIdInput = el("clientIdInput");
    const timestampInput = el("timestampInput");
    const privateKeyInput = el("privateKeyInput");
    const publicKeyInput = el("publicKeyInput");

    const canonicalPreview = el("canonicalPreview");
    const signatureOutput = el("signatureOutput");
    const sigStatsBadge = el("sigStatsBadge");
    const validationCard = el("validationCard");
    const validationIcon = el("validationIcon");
    const validationTitle = el("validationTitle");
    const validationDesc = el("validationDesc");
    const headersPreview = el("headersPreview");
    const curlPreview = el("curlPreview");
    const activeSpecBadge = el("activeSpecBadge");

    // Default load Danamon keys
    privateKeyInput.value = DANAMON_SAMPLE_PRIV;
    publicKeyInput.value = DANAMON_SAMPLE_PUB;

    function getIso8601Gmt7() {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        const tzOffsetMs = 7 * 60 * 60 * 1000;
        const gmt7Date = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + tzOffsetMs);

        const year = gmt7Date.getFullYear();
        const month = pad(gmt7Date.getMonth() + 1);
        const day = pad(gmt7Date.getDate());
        const hours = pad(gmt7Date.getHours());
        const mins = pad(gmt7Date.getMinutes());
        const secs = pad(gmt7Date.getSeconds());

        return year + "-" + month + "-" + day + "T" + hours + ":" + mins + ":" + secs + "+07:00";
    }

    function buildStringToSign() {
        const template = patternTemplate.value || "{clientId}|{timestamp}";
        const clientId = clientIdInput.value.trim();
        const timestamp = timestampInput.value.trim();

        return template
            .replace(/\{clientId\}/g, clientId)
            .replace(/\{timestamp\}/g, timestamp)
            .replace(/\{httpMethod\}/g, "POST")
            .replace(/\{endpointPath\}/g, "/api/v2.0/access-token/b2b");
    }

    // ==========================================
    // 6. REALTIME EXECUTION & VERIFICATION ENGINE
    // ==========================================
    async function runStudio() {
        const stringToSign = buildStringToSign();
        canonicalPreview.textContent = stringToSign;

        const privPem = privateKeyInput.value.trim();
        const pubPem = publicKeyInput.value.trim();
        const encoding = outEncoding.value;

        if (!stringToSign || !privPem) {
            signatureOutput.value = "";
            sigStatsBadge.textContent = "0 bytes";
            validationCard.className = "validation-card pending";
            validationIcon.textContent = "⏳";
            validationTitle.textContent = "Menunggu Private Key";
            validationDesc.textContent = "Silakan masukkan Private Key untuk menghasilkan digital signature.";
            updateHeadersAndCurl("", stringToSign);
            return;
        }

        try {
            const cryptoPrivKey = await importRsaPrivateKey(privPem);
            const dataBytes = textEncoder.encode(stringToSign);
            const sigBuffer = await window.crypto.subtle.sign(
                "RSASSA-PKCS1-v1_5",
                cryptoPrivKey,
                dataBytes
            );

            let formattedSig = "";
            const hexSig = bufferToHex(sigBuffer);
            if (encoding === "hex-lower") {
                formattedSig = hexSig.toLowerCase();
            } else if (encoding === "hex-upper") {
                formattedSig = hexSig.toUpperCase();
            } else if (encoding === "base64") {
                formattedSig = bufferToBase64(sigBuffer);
            }

            signatureOutput.value = formattedSig;
            const byteLen = sigBuffer.byteLength;
            sigStatsBadge.textContent = formattedSig.length + " karakter (" + byteLen + " bytes / " + (byteLen * 8) + "-bit RSA)";

            // Verify with Public Key if present
            if (pubPem) {
                try {
                    const cryptoPubKey = await importRsaPublicKey(pubPem);
                    const isValid = await window.crypto.subtle.verify(
                        "RSASSA-PKCS1-v1_5",
                        cryptoPubKey,
                        sigBuffer,
                        dataBytes
                    );

                    if (isValid) {
                        validationCard.className = "validation-card valid";
                        validationIcon.textContent = "✅";
                        validationTitle.textContent = "Signature Valid & Terverifikasi!";
                        validationDesc.textContent = "Signature 100% lolos verifikasi menggunakan Public Key Danamon / Client Key yang bersesuaian.";
                    } else {
                        validationCard.className = "validation-card invalid";
                        validationIcon.textContent = "❌";
                        validationTitle.textContent = "Signature Gagal Diverifikasi";
                        validationDesc.textContent = "Public Key tidak cocok dengan Private Key yang digunakan.";
                    }
                } catch (pubErr) {
                    validationCard.className = "validation-card invalid";
                    validationIcon.textContent = "⚠️";
                    validationTitle.textContent = "Format Public Key Bermasalah";
                    validationDesc.textContent = pubErr.message;
                }
            } else {
                validationCard.className = "validation-card pending";
                validationIcon.textContent = "ℹ️";
                validationTitle.textContent = "Signature Berhasil Dibuat";
                validationDesc.textContent = "Masukkan Public Key untuk memverifikasi kecocokan signature secara otomatis.";
            }

            updateHeadersAndCurl(formattedSig, stringToSign);

        } catch (err) {
            signatureOutput.value = "";
            sigStatsBadge.textContent = "Error";
            validationCard.className = "validation-card invalid";
            validationIcon.textContent = "❌";
            validationTitle.textContent = "Gagal Menghasilkan Signature";
            validationDesc.textContent = "Format Private Key salah atau tidak didukung: " + err.message;
            updateHeadersAndCurl("", stringToSign);
        }
    }

    function updateHeadersAndCurl(signature, stringToSign) {
        const clientId = clientIdInput.value.trim() || "bc72c83b-91bb-43f1-9e35-dd5eed08484f";
        const timestamp = timestampInput.value.trim() || "2025-08-04T14:57:08+07:00";
        const sigVal = signature || "[X-SIGNATURE-OUTPUT]";

        const headersText = "X-TIMESTAMP: " + timestamp + "\nContent-Type: application/json\nX-CLIENT-KEY: " + clientId + "\nX-SIGNATURE: " + sigVal;
        headersPreview.textContent = headersText;

        const curlText = "curl -X POST \"https://<ip>/api/v2.0/access-token/b2b\" \\\n  -H \"Content-Type: application/json\" \\\n  -H \"X-TIMESTAMP: " + timestamp + "\" \\\n  -H \"X-CLIENT-KEY: " + clientId + "\" \\\n  -H \"X-SIGNATURE: " + sigVal + "\" \\\n  -d '{\"grantType\": \"client_credentials\"}'";
        curlPreview.textContent = curlText;
    }

    // ==========================================
    // 7. EVENT LISTENERS
    // ==========================================
    [patternTemplate, clientIdInput, timestampInput, outEncoding, privateKeyInput, publicKeyInput].forEach(inp => {
        inp.addEventListener("input", runStudio);
        inp.addEventListener("change", runStudio);
    });

    // Preset: Danamon SC-73
    el("btnPresetDanamon")?.addEventListener("click", () => {
        activeSpecBadge.textContent = "Danamon SC-73 v1.2";
        outEncoding.value = "hex-lower";
        patternTemplate.value = "{clientId}|{timestamp}";
        clientIdInput.value = DANAMON_CLIENT_ID;
        timestampInput.value = DANAMON_TIMESTAMP;
        privateKeyInput.value = DANAMON_SAMPLE_PRIV;
        publicKeyInput.value = DANAMON_SAMPLE_PUB;
        runStudio();
        showToast("🏦 Preset Bank Danamon SC-73 v1.2 dimuat!");
    });

    // Preset: Standard ASPI SNAP BI
    el("btnPresetStandardAspi")?.addEventListener("click", () => {
        activeSpecBadge.textContent = "Standard ASPI SNAP BI";
        outEncoding.value = "base64";
        patternTemplate.value = "{clientId}|{timestamp}";
        timestampInput.value = getIso8601Gmt7();
        runStudio();
        showToast("🌐 Preset Standard ASPI SNAP BI (Base64) dimuat!");
    });

    // Reset
    el("btnResetSpec")?.addEventListener("click", () => {
        patternTemplate.value = "{clientId}|{timestamp}";
        clientIdInput.value = "";
        timestampInput.value = getIso8601Gmt7();
        privateKeyInput.value = "";
        publicKeyInput.value = "";
        runStudio();
        showToast("🔄 Konfigurasi dibersihkan");
    });

    // Generate UUID
    el("btnGenUuid")?.addEventListener("click", () => {
        clientIdInput.value = crypto.randomUUID();
        runStudio();
        showToast("🎲 UUID v4 Client Key baru dibuat!");
    });

    // Timestamp Now GMT+7
    el("btnNowWib")?.addEventListener("click", () => {
        timestampInput.value = getIso8601Gmt7();
        runStudio();
        showToast("⏱️ Timestamp waktu saat ini (GMT+7) diperbarui!");
    });

    // Sample Key Buttons
    el("btnLoadSamplePriv")?.addEventListener("click", () => {
        privateKeyInput.value = DANAMON_SAMPLE_PRIV;
        runStudio();
        showToast("🔑 Sample Private Key Danamon dimuat");
    });
    el("btnClearPriv")?.addEventListener("click", () => {
        privateKeyInput.value = "";
        runStudio();
    });

    el("btnLoadSamplePub")?.addEventListener("click", () => {
        publicKeyInput.value = DANAMON_SAMPLE_PUB;
        runStudio();
        showToast("🔑 Sample Public Key Danamon dimuat");
    });
    el("btnClearPub")?.addEventListener("click", () => {
        publicKeyInput.value = "";
        runStudio();
    });

    // Generate New RSA Key Pair
    el("btnGenRsaPair")?.addEventListener("click", async () => {
        const btn = el("btnGenRsaPair");
        btn.textContent = "⏳ Generating 4096-bit...";
        btn.disabled = true;

        try {
            const keyPair = await generateRsaKeyPair(4096);
            const privExported = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
            const pubExported = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);

            const privPem = arrayBufferToPem(privExported, "PRIVATE KEY");
            const pubPem = arrayBufferToPem(pubExported, "PUBLIC KEY");

            privateKeyInput.value = privPem;
            publicKeyInput.value = pubPem;
            activeSpecBadge.textContent = "Custom RSA 4096-bit";
            runStudio();
            showToast("🎉 Pasangan Kunci RSA 4096-bit baru berhasil dibuat!");
        } catch (e) {
            alert("Gagal membuat key pair: " + e.message);
        } finally {
            btn.textContent = "🎲 Generate RSA Key Pair";
            btn.disabled = false;
        }
    });

    // Copy actions
    el("btnCopyCanonical")?.addEventListener("click", () => {
        navigator.clipboard.writeText(canonicalPreview.textContent).then(() => {
            showToast("📋 String-to-Sign disalin!");
        });
    });

    el("btnCopySignature")?.addEventListener("click", () => {
        const sig = signatureOutput.value;
        if (!sig) return;
        navigator.clipboard.writeText(sig).then(() => {
            showToast("📋 X-SIGNATURE disalin!");
        });
    });

    el("btnCopyHeaders")?.addEventListener("click", () => {
        navigator.clipboard.writeText(headersPreview.textContent).then(() => {
            showToast("📋 HTTP Headers disalin!");
        });
    });

    el("btnCopyCurl")?.addEventListener("click", () => {
        navigator.clipboard.writeText(curlPreview.textContent).then(() => {
            showToast("📋 Perintah cURL disalin!");
        });
    });

    // INITIAL RUN
    runStudio();

})();
