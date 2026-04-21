// === DEKLARASI ELEMEN ===
const themeToggle = document.getElementById('themeToggle');

// Pomodoro Elements
const timeDisplay = document.getElementById('timeDisplay');
const activeTaskDisplay = document.getElementById('activeTaskDisplay');
const clockSizeSlider = document.getElementById('clockSizeSlider');
const modeText = document.getElementById('modeText');
const startTimerBtn = document.getElementById('startTimerBtn');
const pauseTimerBtn = document.getElementById('pauseTimerBtn');
const resetTimerBtn = document.getElementById('resetTimerBtn');
const workInput = document.getElementById('workInput');
const breakInput = document.getElementById('breakInput');

// Task Elements
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');

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

// === UBAH UKURAN JAM ===
clockSizeSlider.addEventListener('input', (e) => {
    timeDisplay.style.fontSize = `${e.target.value}rem`;
});

// === NOTIFIKASI BROWSER ===
function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }
}
function notifyUser(title, body) {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body: body, icon: "https://cdn-icons-png.flaticon.com/512/1532/1532788.png" });
    }
}

// === ENGINE: TO-DO TASK TRACKER & DRAG DROP ===
// Struktur baru menggunakan ID unik agar status Fokus tidak hilang saat di-drag
let tasks = JSON.parse(localStorage.getItem('pwaTasksV2')) || [];
let focusedTaskId = localStorage.getItem('focusedTaskId') || null;

function saveTasks() {
    localStorage.setItem('pwaTasksV2', JSON.stringify(tasks));
    if (focusedTaskId) localStorage.setItem('focusedTaskId', focusedTaskId);
    else localStorage.removeItem('focusedTaskId');
}

function updateFocusDisplay() {
    const focusedTask = tasks.find(t => t.id === focusedTaskId);
    if (focusedTask) {
        activeTaskDisplay.textContent = `🎯 ${focusedTask.text}`;
    } else {
        activeTaskDisplay.textContent = "Pilih tugas untuk difokuskan...";
    }
    updateTimerDisplay(); // Segarkan judul tab
}

function renderTasks() {
    taskList.innerHTML = '';
    let pendingCount = 0;

    tasks.forEach((task, index) => {
        if (!task.completed) pendingCount++;
        const isFocused = task.id === focusedTaskId;

        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''} ${isFocused ? 'is-focused' : ''}`;
        li.setAttribute('draggable', 'true');
        li.setAttribute('data-index', index); // Untuk keperluan drag & drop

        li.innerHTML = `
            <div class="task-left" onclick="toggleTask('${task.id}')">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onclick="event.stopPropagation()">
                <span class="task-text">${task.text}</span>
            </div>
            <div class="task-actions">
                <button class="focus-btn" onclick="setFocus('${task.id}')" title="Fokuskan Tugas Ini">🎯</button>
                <button class="delete-btn" onclick="deleteTask('${task.id}')" title="Hapus Tugas">🗑️</button>
            </div>
        `;

        // EVENT LISTENER UNTUK DRAG & DROP
        li.addEventListener('dragstart', handleDragStart);
        li.addEventListener('dragover', handleDragOver);
        li.addEventListener('dragleave', handleDragLeave);
        li.addEventListener('drop', handleDrop);
        li.addEventListener('dragend', handleDragEnd);

        taskList.appendChild(li);
    });

    taskCount.textContent = `${pendingCount} Tugas Tersisa`;
    updateFocusDisplay();
}

// FUNGSI DRAG & DROP
let dragStartIndex;

function handleDragStart(e) {
    dragStartIndex = +this.getAttribute('data-index');
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}
function handleDragOver(e) {
    e.preventDefault(); // Wajib agar drop bisa bekerja
    this.classList.add('drag-over');
}
function handleDragLeave() {
    this.classList.remove('drag-over');
}
function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    const dragEndIndex = +this.getAttribute('data-index');

    // Pindahkan posisi dalam array
    const taskToMove = tasks.splice(dragStartIndex, 1)[0];
    tasks.splice(dragEndIndex, 0, taskToMove);

    saveTasks();
    renderTasks();
}
function handleDragEnd() {
    this.classList.remove('dragging');
    document.querySelectorAll('.task-item').forEach(item => item.classList.remove('drag-over'));
}

// AKSI TUGAS
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;

    // Tambah dengan ID Unik
    tasks.push({ id: Date.now().toString(), text: text, completed: false });
    saveTasks();
    renderTasks();
    taskInput.value = '';
});

window.toggleTask = function (id) {
    const task = tasks.find(t => t.id === id);
    if (task) task.completed = !task.completed;
    saveTasks();
    renderTasks();
};

window.deleteTask = function (id) {
    tasks = tasks.filter(t => t.id !== id);
    if (focusedTaskId === id) focusedTaskId = null; // Reset fokus jika tugas dihapus
    saveTasks();
    renderTasks();
};

window.setFocus = function (id) {
    // Jika diklik tugas yang sama, batalkan fokus
    if (focusedTaskId === id) {
        focusedTaskId = null;
    } else {
        focusedTaskId = id;
    }
    saveTasks();
    renderTasks();
};

clearCompletedBtn.addEventListener('click', () => {
    // Cek apakah tugas yang sedang difokuskan ikut terhapus
    const completedFocusTask = tasks.find(t => t.id === focusedTaskId && t.completed);
    if (completedFocusTask) focusedTaskId = null;

    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
});


// === ENGINE: POMODORO TIMER ===
let timerInterval;
let timeRemaining = 25 * 60;
let isRunning = false;
let isWorkMode = true;

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    timeDisplay.textContent = timeString;

    // Update Judul Tab Dinamis (Contoh: "[25:00] Fix Bug Login - Fokus")
    const modeName = isWorkMode ? 'Fokus' : 'Istirahat';
    const focusedTask = tasks.find(t => t.id === focusedTaskId);

    if (focusedTask) {
        document.title = `[${timeString}] ${focusedTask.text} - ${modeName}`;
    } else {
        document.title = `[${timeString}] - ${modeName}`;
    }
}

function switchMode() {
    isWorkMode = !isWorkMode;
    if (isWorkMode) {
        modeText.textContent = "🎯 Waktu Fokus";
        modeText.className = "badge-mode work-mode";
        timeRemaining = (parseInt(workInput.value) || 25) * 60;
        notifyUser("Waktu Istirahat Selesai!", "Ayo kembali fokus kerja!");
    } else {
        modeText.textContent = "☕ Waktu Istirahat";
        modeText.className = "badge-mode break-mode";
        timeRemaining = (parseInt(breakInput.value) || 5) * 60;
        notifyUser("Kerja Bagus!", "Waktunya istirahat sejenak.");
    }
    updateTimerDisplay();
}

function startTimer() {
    requestNotificationPermission();
    if (isRunning) return;

    isRunning = true;
    startTimerBtn.style.display = "none";
    pauseTimerBtn.style.display = "flex";

    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            isRunning = false;
            startTimerBtn.style.display = "flex";
            pauseTimerBtn.style.display = "none";
            switchMode();
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    startTimerBtn.style.display = "flex";
    pauseTimerBtn.style.display = "none";
}

function resetTimer() {
    pauseTimer();
    isWorkMode = true;
    modeText.textContent = "🎯 Waktu Fokus";
    modeText.className = "badge-mode work-mode";
    timeRemaining = (parseInt(workInput.value) || 25) * 60;
    updateTimerDisplay();
}

startTimerBtn.addEventListener('click', startTimer);
pauseTimerBtn.addEventListener('click', pauseTimer);
resetTimerBtn.addEventListener('click', resetTimer);
[workInput, breakInput].forEach(input => input.addEventListener('change', () => { if (!isRunning) resetTimer(); }));

// Init
renderTasks();
updateTimerDisplay();

// PWA Install Logic (Biarkan Sama)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
}
let deferredPrompt;
const installPwaBtn = document.getElementById('installPwaBtn');
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installPwaBtn.style.display = 'inline-flex';
});
installPwaBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') installPwaBtn.style.display = 'none';
        deferredPrompt = null;
    }
});