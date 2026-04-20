// === DEKLARASI ELEMEN ===
const themeToggle = document.getElementById('themeToggle');
const actionBtn = document.getElementById('actionBtn');

const leftInput = document.getElementById('leftInput');
const rightInput = document.getElementById('rightInput');
const leftOutput = document.getElementById('leftOutput');
const rightOutput = document.getElementById('rightOutput');
const minimap = document.getElementById('minimap');

let isDiffMode = false;

// === FITUR LIGHT / DARK MODE ===
const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    themeToggle.title = theme === 'dark' ? 'Ubah ke Terang' : 'Ubah ke Gelap';
}

// === FUNGSI UTAMA: DIFF CHECKER ===
const escapeHTML = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

actionBtn.addEventListener('click', () => {
    if (!isDiffMode) {
        // 1. Eksekusi Perbandingan
        const oldText = leftInput.value;
        const newText = rightInput.value;
        const diffResult = Diff.diffWordsWithSpace(oldText, newText);

        let leftHTML = "";
        let rightHTML = "";

        diffResult.forEach(part => {
            const escapedText = escapeHTML(part.value);
            if (part.added) {
                rightHTML += `<span class="diff-add">${escapedText}</span>`;
            } else if (part.removed) {
                leftHTML += `<span class="diff-del">${escapedText}</span>`;
            } else {
                leftHTML += `<span>${escapedText}</span>`;
                rightHTML += `<span>${escapedText}</span>`;
            }
        });

        // 2. Render Hasil ke Layar
        leftOutput.innerHTML = leftHTML;
        rightOutput.innerHTML = rightHTML;

        // 3. Atur Visibilitas Elemen
        leftInput.classList.add('hidden');
        rightInput.classList.add('hidden');
        leftOutput.classList.remove('hidden');
        rightOutput.classList.remove('hidden');
        minimap.classList.remove('hidden'); // Tampilkan Minimap

        // 4. Generate Minimap (Berikan jeda sedikit agar DOM selesai menggambar)
        setTimeout(() => {
            generateMinimap();
        }, 50);

        // Ubah Tombol
        actionBtn.innerHTML = "✏️ Kembali Mengedit";
        actionBtn.classList.remove('primary');
        isDiffMode = true;

    } else {
        // KEMBALI KE MODE EDIT
        leftInput.classList.remove('hidden');
        rightInput.classList.remove('hidden');
        leftOutput.classList.add('hidden');
        rightOutput.classList.add('hidden');
        minimap.classList.add('hidden'); // Sembunyikan Minimap

        actionBtn.innerHTML = "🔍 Bandingkan Teks";
        actionBtn.classList.add('primary');
        isDiffMode = false;
    }
});

// === FITUR MINIMAP ===
function generateMinimap() {
    minimap.innerHTML = '';

    const additions = rightOutput.querySelectorAll('.diff-add');
    const deletions = leftOutput.querySelectorAll('.diff-del');

    // Karena text panjang bisa butuh scroll, tinggi patokan adalah scrollHeight
    const containerHeight = rightOutput.scrollHeight;

    const createMarker = (el, type) => {
        // Mencari posisi persentase
        const topPercentage = (el.offsetTop / containerHeight) * 100;

        // Memastikan balok paling kecil tetap terlihat
        let heightPercentage = (el.offsetHeight / containerHeight) * 100;
        if (heightPercentage < 0.5) heightPercentage = 0.5;

        const marker = document.createElement('div');
        marker.className = `minimap-marker ${type}`;
        marker.style.top = `${topPercentage}%`;
        marker.style.height = `${heightPercentage}%`;

        minimap.appendChild(marker);
    };

    additions.forEach(el => createMarker(el, 'add'));
    deletions.forEach(el => createMarker(el, 'del'));
}

// Fitur Klik Minimap untuk Cepat Menuju Teks yang Berubah
minimap.addEventListener('click', (e) => {
    const clickY = e.offsetY;
    const minimapHeight = minimap.clientHeight;
    const clickPercentage = clickY / minimapHeight;

    const targetScroll = rightOutput.scrollHeight * clickPercentage;

    rightOutput.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
    });
});

// === FITUR SYNCHRONIZED SCROLLING ===
function syncScroll(el1, el2) {
    let isScrolling = false;
    el1.addEventListener('scroll', () => {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                el2.scrollTop = el1.scrollTop;
                el2.scrollLeft = el1.scrollLeft;
                isScrolling = false;
            });
            isScrolling = true;
        }
    });
}

syncScroll(leftInput, rightInput);
syncScroll(rightInput, leftInput);
syncScroll(leftOutput, rightOutput);
syncScroll(rightOutput, leftOutput);