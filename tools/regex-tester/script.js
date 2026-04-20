// === DEKLARASI ELEMEN ===
const themeToggle = document.getElementById('themeToggle');
const patternInput = document.getElementById('regexPattern');
const flagsInput = document.getElementById('regexFlags');
const testStringInput = document.getElementById('testString');
const matchOutput = document.getElementById('matchOutput');
const errorMsg = document.getElementById('errorMsg');
const matchStatus = document.getElementById('matchStatus');

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

// === FUNGSI INTI: EKSEKUSI REGEX ===
const escapeHTML = (str) => {
    return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};

function evaluateRegex() {
    const patternText = patternInput.value;
    const flagsText = flagsInput.value;
    const testText = testStringInput.value;

    if (!patternText) {
        matchOutput.innerHTML = escapeHTML(testText);
        matchStatus.textContent = "0 Matches";
        errorMsg.classList.remove('active');
        return;
    }

    try {
        const regex = new RegExp(patternText, flagsText);
        errorMsg.classList.remove('active');

        let resultHtml = "";
        let matchCount = 0;
        let lastIdx = 0;
        let match;

        if (!regex.global) {
            match = regex.exec(testText);
            if (match) {
                resultHtml += escapeHTML(testText.substring(0, match.index));
                resultHtml += `<mark>${escapeHTML(match[0])}</mark>`;
                resultHtml += escapeHTML(testText.substring(match.index + match[0].length));
                matchCount = 1;
            } else {
                resultHtml = escapeHTML(testText);
            }
        } else {
            while ((match = regex.exec(testText)) !== null) {
                if (match.index === regex.lastIndex) regex.lastIndex++;

                resultHtml += escapeHTML(testText.substring(lastIdx, match.index));
                resultHtml += `<mark>${escapeHTML(match[0])}</mark>`;

                lastIdx = match.index + match[0].length;
                matchCount++;
            }
            resultHtml += escapeHTML(testText.substring(lastIdx));
        }

        matchOutput.innerHTML = resultHtml;
        matchStatus.textContent = `${matchCount} Matches`;

    } catch (err) {
        errorMsg.textContent = "Error: " + err.message;
        errorMsg.classList.add('active');
        matchOutput.innerHTML = escapeHTML(testText);
        matchStatus.textContent = "Invalid RegEx";
    }
}

// === EVENT LISTENERS ===
[patternInput, flagsInput, testStringInput].forEach(input => {
    input.addEventListener('input', evaluateRegex);
});

window.addEventListener('DOMContentLoaded', evaluateRegex);