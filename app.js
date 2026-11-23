/**
 * ZAMONAVIY TASK MENEJER
 * To'liq CRUD, Toast bildirishnomalar, Kanban & Ro'yxat ko'rinishi,
 * Statistika, Filtrlash, Saralash, Taymer (Countdown),
 * Web Audio API Ovozli Signali va Eslatma tizimi bilan.
 */

// Boshlang'ich holat va o'zgaruvchilar
const STORAGE_KEY = 'taskflow_tasks_data';
const THEME_KEY = 'taskflow_theme';

let tasks = [];
let currentFilter = 'all'; // all, pending, completed, starred
let currentCategory = 'all';
let currentPriority = 'all';
let currentSort = 'newest';
let searchQuery = '';
let currentView = 'list'; // 'list' yoki 'kanban'
let taskToDeleteId = null;
let currentAlarmTaskId = null;

// Audio kontekst va signal o'zgaruvchilari
let audioCtx = null;
let alarmIntervalId = null;
let globalCountdownInterval = null;

// DOM Elementlari
const tasksListContainer = document.getElementById('tasks-list');
const kanbanContainer = document.getElementById('kanban-container');
const kanbanPendingList = document.getElementById('kanban-pending-list');
const kanbanCompletedList = document.getElementById('kanban-completed-list');
const emptyState = document.getElementById('empty-state');

// Modallar
const taskModal = document.getElementById('task-modal');
const deleteModal = document.getElementById('delete-modal');
const alarmModal = document.getElementById('alarm-modal');
const taskForm = document.getElementById('task-form');
const modalTitle = document.getElementById('modal-title');
const modalSubtitle = document.getElementById('modal-subtitle');
const modalIcon = document.getElementById('modal-icon');
const saveBtnText = document.getElementById('save-btn-text');

// Form maydonlari
const taskIdInput = document.getElementById('task-id');
const taskTitleInput = document.getElementById('task-title');
const taskDescInput = document.getElementById('task-desc');
const taskCategoryInput = document.getElementById('task-category');
const taskPriorityInput = document.getElementById('task-priority');
const taskDueDateInput = document.getElementById('task-due-date');
const taskStatusInput = document.getElementById('task-status');
const taskTimerMinutesInput = document.getElementById('task-timer-minutes');
const taskAlarmEnabledInput = document.getElementById('task-alarm-enabled');

// Alarm Modal elementlari
const alarmTaskTitle = document.getElementById('alarm-task-title');
const alarmTaskMessage = document.getElementById('alarm-task-message');
const alarmSnoozeBtn = document.getElementById('alarm-snooze-btn');
const alarmCompleteBtn = document.getElementById('alarm-complete-btn');
const alarmDismissBtn = document.getElementById('alarm-dismiss-btn');

// Aqlli Reja Tuzuvchi (AI Breakdown) elementlari
const openAiModalBtn = document.getElementById('open-ai-modal-btn');
const aiModal = document.getElementById('ai-modal');
const closeAiModalBtn = document.getElementById('close-ai-modal-btn');
const aiGoalInput = document.getElementById('ai-goal-input');
const aiStepMinutesInput = document.getElementById('ai-step-minutes');
const aiStepCountSelect = document.getElementById('ai-step-count');
const aiGenerateBtn = document.getElementById('ai-generate-btn');
const aiResultsContainer = document.getElementById('ai-results-container');
const aiStepsList = document.getElementById('ai-steps-list');
const aiStepsCountBadge = document.getElementById('ai-steps-count-badge');
const aiTotalTime = document.getElementById('ai-total-time');
const aiCancelBtn = document.getElementById('ai-cancel-btn');
const aiApplyAllBtn = document.getElementById('ai-apply-all-btn');

let generatedAiSteps = [];

// Boshqaruv elementlari
const openAddModalBtn = document.getElementById('open-add-modal-btn');
const emptyAddBtn = document.getElementById('empty-add-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelModalBtn = document.getElementById('cancel-modal-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const deleteTaskPreview = document.getElementById('delete-task-preview');

// Qidiruv va Filtrlar
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const priorityFilter = document.getElementById('priority-filter');
const sortSelect = document.getElementById('sort-select');
const activeFilterLabel = document.getElementById('active-filter-label');
const themeToggleBtn = document.getElementById('theme-toggle');
const viewListBtn = document.getElementById('view-list');
const viewKanbanBtn = document.getElementById('view-kanban');

// Statistika va nishonlar
const statTotal = document.getElementById('stat-total');
const statPending = document.getElementById('stat-pending');
const statCompleted = document.getElementById('stat-completed');
const statPriority = document.getElementById('stat-priority');
const badgeAll = document.getElementById('badge-all');
const badgePending = document.getElementById('badge-pending');
const badgeCompleted = document.getElementById('badge-completed');
const badgeStarred = document.getElementById('badge-starred');
const productivityPercent = document.getElementById('productivity-percent');
const productivityBar = document.getElementById('productivity-bar');

// Eksport va Import
const exportBtn = document.getElementById('export-btn');
const importFile = document.getElementById('import-file');

// ==========================================
// 1. DASTURNI BOSHLASH VA MA'LUMOTLARNI YUKLASH
// ==========================================

function initApp() {
    loadTheme();
    loadTasks();
    setupEventListeners();
    requestNotificationPermission();
    startGlobalTimer();
    render();
}

// Brauzer Desktop Bildirishnomalar ruxsatini so'rash
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Boshlang'ich demo ma'lumotlar
function getDefaultTasks() {
    return [
        {
            id: 'task_' + Date.now() + '_1',
            title: 'Loyiha arxitekturasini rejalashtirish',
            desc: 'Yangi veb-ilova uchun barcha talablar va texnologiyalarni aniqlab olish.',
            category: 'Ish',
            priority: 'high',
            dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
            status: 'pending',
            starred: true,
            timerMinutes: 5,
            timerRemaining: 300, // 5 minut = 300 soniya
            timerRunning: true,
            alarmEnabled: true,
            isExpired: false,
            createdAt: new Date().toISOString(),
            updatedAt: null
        },
        {
            id: 'task_' + Date.now() + '_2',
            title: 'Ingliz tili lug\'atlarini takrorlash',
            desc: 'Yangi 30 ta so\'z va iboralarni qaytarish hamda mashqlar bajarish.',
            category: 'O\'qish',
            priority: 'medium',
            dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            status: 'completed',
            starred: false,
            timerMinutes: 10,
            timerRemaining: 0,
            timerRunning: false,
            alarmEnabled: true,
            isExpired: false,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: null
        },
        {
            id: 'task_' + Date.now() + '_3',
            title: 'Kechki yugurish va jismoniy tarbiya',
            desc: 'Bog\'da 5 km masofani bosib o\'tish va badantarbiya mashqlari.',
            category: 'Sog\'liq',
            priority: 'low',
            dueDate: new Date().toISOString().split('T')[0],
            status: 'pending',
            starred: false,
            timerMinutes: 5,
            timerRemaining: 300,
            timerRunning: false,
            alarmEnabled: true,
            isExpired: false,
            createdAt: new Date().toISOString(),
            updatedAt: null
        }
    ];
}

function loadTasks() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        try {
            tasks = JSON.parse(data);
            // Qadimgi ma'lumotlarda taymer maydonlari bo'lmasa to'ldirish
            tasks = tasks.map(t => ({
                ...t,
                timerMinutes: t.timerMinutes !== undefined ? t.timerMinutes : 5,
                timerRemaining: t.timerRemaining !== undefined ? t.timerRemaining : (t.timerMinutes || 5) * 60,
                timerRunning: t.status === 'pending' ? (t.timerRunning !== undefined ? t.timerRunning : true) : false,
                alarmEnabled: t.alarmEnabled !== undefined ? t.alarmEnabled : true,
                isExpired: t.isExpired || false
            }));
        } catch (e) {
            console.error("Ma'lumotlarni o'qishda xatolik:", e);
            tasks = getDefaultTasks();
            saveTasksToStorage();
        }
    } else {
        tasks = getDefaultTasks();
        saveTasksToStorage();
    }
}

function saveTasksToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ==========================================
// 2. WEB AUDIO API SIGNAL GENERATORI
// ==========================================

function getAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

// Bitta signal zarbasi (beep)
function playTone(freq, type, duration, delay = 0) {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

        gain.gain.setValueAtTime(0.2, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration);
    } catch (e) {
        console.warn("Audio signal chalishda ogohlantirish:", e);
    }
}

// Ritmik qo'ng'iroq signali (Chime / Alarm)
function playAlarmBurst() {
    // 3 martalik chiroyli baland signal: 880Hz -> 1046Hz (A5 -> C6)
    playTone(880, 'sine', 0.15, 0);
    playTone(1046, 'sine', 0.25, 0.18);
    playTone(880, 'sine', 0.15, 0.45);
    playTone(1318, 'sine', 0.35, 0.65);
}

function startAlarmSound() {
    stopAlarmSound();
    playAlarmBurst();
    // Har 2 soniyada signalni takrorlab turadi
    alarmIntervalId = setInterval(() => {
        playAlarmBurst();
    }, 2000);
}

function stopAlarmSound() {
    if (alarmIntervalId) {
        clearInterval(alarmIntervalId);
        alarmIntervalId = null;
    }
}

// ==========================================
// 3. VAQT VA TAYMERNI BOSHQARISH (Countdown)
// ==========================================

function startGlobalTimer() {
    if (globalCountdownInterval) clearInterval(globalCountdownInterval);

    globalCountdownInterval = setInterval(() => {
        let changed = false;

        tasks.forEach(task => {
            if (task.status === 'pending' && task.timerRunning && task.timerRemaining > 0) {
                task.timerRemaining -= 1;
                changed = true;

                // DOM-dagi raqamni sahifani qayta chizmasdan tezkor yangilash
                updateTimerDisplayInDOM(task.id, task.timerRemaining);

                // Vaqt 0 ga yetdi!
                if (task.timerRemaining <= 0) {
                    task.timerRunning = false;
                    task.isExpired = true;
                    changed = true;

                    // Eslatish va signal berish!
                    triggerTaskAlarm(task);
                }
            }
        });

        if (changed) {
            // Har 10 soniyada bir xotiraga saqlab turish (unumdorlik uchun)
            if (Math.random() < 0.1) {
                saveTasksToStorage();
            }
        }
    }, 1000);
}

function formatTimerSeconds(totalSeconds) {
    if (totalSeconds < 0) totalSeconds = 0;
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updateTimerDisplayInDOM(taskId, remainingSeconds) {
    const el = document.getElementById(`timer-digits-${taskId}`);
    if (el) {
        el.textContent = formatTimerSeconds(remainingSeconds);
    }
}

// Vaqt tugaganda chaqiriladigan asosiy funksiya
function triggerTaskAlarm(task) {
    saveTasksToStorage();
    render(); // Kartochkani expired va miltillovchi holatga o'tkazish

    // Ovozli signalni yoqish
    if (task.alarmEnabled) {
        startAlarmSound();
    }

    // Modal oynani ochish
    currentAlarmTaskId = task.id;
    alarmTaskTitle.textContent = `"${task.title}"`;
    alarmTaskMessage.textContent = `Ushbu vazifa uchun ajratilgan ${task.timerMinutes || 5} daqiqa vaqt to'liq tugadi! Vazifani bajardingizmi?`;
    alarmModal.classList.add('active');

    // Desktop Notification (agar ruxsat bo'lsa)
    if ('Notification' in window && Notification.permission === 'granted') {
        try {
            new Notification('⏰ TaskFlow: Vaqt tugadi!', {
                body: `"${task.title}" vazifasi uchun ajratilgan vaqt tugadi!`,
                icon: 'https://cdn-icons-png.flaticon.com/512/3239/3239952.png'
            });
        } catch (e) {
            console.log("Desktop notification ko'rsatilmadi:", e);
        }
    }

    // Toast ham chiqarish
    showToast(
        "⏰ Vaqt tugadi!", 
        `"${task.title}" vazifasi vaqti yakunlandi va signal chalindi.`, 
        "danger"
    );
}

// Alarm Modal tugmalari
function dismissAlarm() {
    stopAlarmSound();
    alarmModal.classList.remove('active');
    currentAlarmTaskId = null;
}

// Bajarildi deb belgilash
function completeAlarmTask() {
    if (currentAlarmTaskId) {
        const task = tasks.find(t => t.id === currentAlarmTaskId);
        if (task) {
            task.status = 'completed';
            task.timerRunning = false;
            task.isExpired = false;
            saveTasksToStorage();
            render();
            showToast("Bajarildi!", `"${task.title}" vazifasi muvaffaqiyatli yakunlandi! 🎉`, "success");
        }
    }
    dismissAlarm();
}

// Yana 5 minut qo'shish (Snooze)
function snoozeAlarmTask(minutes = 5) {
    if (currentAlarmTaskId) {
        const task = tasks.find(t => t.id === currentAlarmTaskId);
        if (task) {
            task.timerRemaining = minutes * 60;
            task.timerRunning = true;
            task.isExpired = false;
            saveTasksToStorage();
            render();
            showToast("Vaqt uzaytirildi", `"${task.title}" vazifasiga yana ${minutes} daqiqa qo'shildi.`, "info");
        }
    }
    dismissAlarm();
}

// Kartochkadagi taymerni boshqarish
function toggleTaskTimer(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.timerRemaining <= 0) {
        // Vaqt tugagan bo'lsa qaytadan boshlash
        task.timerRemaining = (task.timerMinutes || 5) * 60;
        task.timerRunning = true;
        task.isExpired = false;
    } else {
        task.timerRunning = !task.timerRunning;
    }

    saveTasksToStorage();
    render();

    if (task.timerRunning) {
        showToast("Taymer boshlandi", `"${task.title}" vazifasi uchun vaqt hisoblanmoqda.`, "info");
    } else {
        showToast("Taymer to'xtatildi", `"${task.title}" vazifasi taymeri to'xtatib turildi.`, "warning");
    }
}

function resetTaskTimer(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    task.timerRemaining = (task.timerMinutes || 5) * 60;
    task.timerRunning = false;
    task.isExpired = false;
    saveTasksToStorage();
    render();
    showToast("Taymer qayta o'rnatildi", `"${task.title}" vaqti ${task.timerMinutes || 5} daqiqaga qaytarildi.`, "info");
}

// ==========================================
// 4. MAVZU (DARK / LIGHT THEME)
// ==========================================

function loadTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    applyTheme(savedTheme);
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.remove('theme-light');
        document.body.classList.add('theme-dark');
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun" style="color: #f59e0b;"></i>';
    } else {
        document.body.classList.remove('theme-dark');
        document.body.classList.add('theme-light');
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
    localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
    const isDark = document.body.classList.contains('theme-dark');
    applyTheme(isDark ? 'light' : 'dark');
}

// ==========================================
// 5. TOAST BILDIRISHNOMALARI
// ==========================================

function showToast(title, message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconClass = 'fa-solid fa-circle-check';
    if (type === 'info') iconClass = 'fa-solid fa-pen-to-square';
    if (type === 'danger') iconClass = 'fa-solid fa-bell';
    if (type === 'warning') iconClass = 'fa-solid fa-triangle-exclamation';

    toast.innerHTML = `
        <div class="toast-icon">
            <i class="${iconClass}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-msg">${message}</div>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ==========================================
// 6. CRUD AMALLARI (Create, Read, Update, Delete)
// ==========================================

// Modalni ochish (Yangi qo'shish yoki Tahrirlash)
function openTaskModal(taskId = null) {
    taskForm.reset();
    
    // Foydalanuvchi birinchi marta bosganda AudioContext faollashishi uchun
    getAudioContext();

    if (taskId) {
        // Tahrirlash rejimi
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        modalTitle.textContent = "Vazifani O'zgartirish";
        modalSubtitle.textContent = "Kerakli ma'lumotlarni tahrirlang";
        modalIcon.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
        saveBtnText.textContent = "O'zgarishlarni Saqlash";

        taskIdInput.value = task.id;
        taskTitleInput.value = task.title;
        taskDescInput.value = task.desc || '';
        taskCategoryInput.value = task.category || 'Ish';
        taskPriorityInput.value = task.priority || 'medium';
        taskDueDateInput.value = task.dueDate || '';
        taskStatusInput.value = task.status || 'pending';
        taskTimerMinutesInput.value = task.timerMinutes || 5;
        taskAlarmEnabledInput.checked = task.alarmEnabled !== false;
    } else {
        // Yangi qo'shish rejimi
        modalTitle.textContent = "Yangi Vazifa Qo'shish";
        modalSubtitle.textContent = "Kerakli ma'lumotlarni to'ldiring";
        modalIcon.innerHTML = '<i class="fa-solid fa-plus"></i>';
        saveBtnText.textContent = "Vazifani Qo'shish";

        taskIdInput.value = '';
        taskPriorityInput.value = 'medium';
        taskCategoryInput.value = 'Ish';
        taskStatusInput.value = 'pending';
        taskTimerMinutesInput.value = 5; // Standart 5 minut
        taskAlarmEnabledInput.checked = true;

        const today = new Date().toISOString().split('T')[0];
        taskDueDateInput.value = today;
    }

    taskModal.classList.add('active');
    setTimeout(() => taskTitleInput.focus(), 100);
}

function closeTaskModal() {
    taskModal.classList.remove('active');
}

// Formani saqlash (Qo'shish yoki Yangilash)
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = taskTitleInput.value.trim();
    if (!title) {
        showToast("Xatolik", "Vazifa nomini kiritish majburiy!", "warning");
        return;
    }

    const taskId = taskIdInput.value;
    const desc = taskDescInput.value.trim();
    const category = taskCategoryInput.value;
    const priority = taskPriorityInput.value;
    const dueDate = taskDueDateInput.value;
    const status = taskStatusInput.value;
    const timerMinutes = parseInt(taskTimerMinutesInput.value, 10) || 5;
    const alarmEnabled = taskAlarmEnabledInput.checked;

    if (taskId) {
        // O'ZGARTIRISH (Update)
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            const oldTask = tasks[taskIndex];
            const minutesChanged = oldTask.timerMinutes !== timerMinutes;

            tasks[taskIndex] = {
                ...oldTask,
                title,
                desc,
                category,
                priority,
                dueDate,
                status,
                timerMinutes,
                timerRemaining: minutesChanged ? timerMinutes * 60 : oldTask.timerRemaining,
                alarmEnabled,
                isExpired: false,
                updatedAt: new Date().toISOString()
            };

            saveTasksToStorage();
            render();
            closeTaskModal();
            showToast(
                "O'zgartirildi!", 
                `"${title}" vazifasi muvaffaqiyatli yangilandi!`, 
                "info"
            );
        }
    } else {
        // YANGI QO'SHISH (Create)
        const newTask = {
            id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            title,
            desc,
            category,
            priority,
            dueDate,
            status,
            starred: false,
            timerMinutes,
            timerRemaining: timerMinutes * 60, // 5 minut bo'lsa 300 soniya
            timerRunning: status === 'pending', // Avtomatik ortga hisoblash boshlanadi
            alarmEnabled,
            isExpired: false,
            createdAt: new Date().toISOString(),
            updatedAt: null
        };

        tasks.unshift(newTask); // Eng yuqoriga qo'shish
        saveTasksToStorage();
        render();
        closeTaskModal();
        showToast(
            "Yangi vazifa qo'shildi!", 
            `"${title}" vazifasi qo'shildi (${timerMinutes} daqiqa taymer yoqildi).`, 
            "success"
        );
    }
});

// Holatni o'zgartirish (Status Toggle: pending <-> completed)
function toggleTaskStatus(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    task.status = task.status === 'completed' ? 'pending' : 'completed';
    task.updatedAt = new Date().toISOString();

    if (task.status === 'completed') {
        task.timerRunning = false;
        task.isExpired = false;
        showToast("Bajarildi!", `"${task.title}" vazifasi muvaffaqiyatli yakunlandi! 🎉`, "success");
    } else {
        task.timerRunning = true;
        showToast("Qaytarildi", `"${task.title}" yana bajarilmoqda holatiga o'tkazildi.`, "warning");
    }

    saveTasksToStorage();
    render();
}

// Muhimlikni belgilash (Star Toggle)
function toggleTaskStar(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    task.starred = !task.starred;
    task.updatedAt = new Date().toISOString();
    saveTasksToStorage();
    render();

    if (task.starred) {
        showToast("Muhim deb belgilandi", `"${task.title}" muhim vazifalar ro'yxatiga qo'shildi.`, "info");
    }
}

// O'chirish modali
function promptDeleteTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    taskToDeleteId = taskId;
    deleteTaskPreview.textContent = `"${task.title}"`;
    deleteModal.classList.add('active');
}

function closeDeleteModal() {
    deleteModal.classList.remove('active');
    taskToDeleteId = null;
}

confirmDeleteBtn.addEventListener('click', () => {
    if (!taskToDeleteId) return;

    const taskIndex = tasks.findIndex(t => t.id === taskToDeleteId);
    if (taskIndex !== -1) {
        const deletedTaskTitle = tasks[taskIndex].title;
        tasks.splice(taskIndex, 1);
        saveTasksToStorage();
        render();
        closeDeleteModal();
        showToast(
            "O'chirildi!", 
            `"${deletedTaskTitle}" vazifasi muvaffaqiyatli o'chirildi.`, 
            "danger"
        );
    }
});

// ==========================================
// 7. FILTRLASH VA SARALASH
// ==========================================

function getFilteredTasks() {
    let result = [...tasks];

    // 1. Asosiy filtr (All, Pending, Completed, Starred)
    if (currentFilter === 'pending') {
        result = result.filter(t => t.status === 'pending');
    } else if (currentFilter === 'completed') {
        result = result.filter(t => t.status === 'completed');
    } else if (currentFilter === 'starred') {
        result = result.filter(t => t.starred);
    }

    // 2. Kategoriya filtri
    if (currentCategory !== 'all') {
        result = result.filter(t => t.category === currentCategory);
    }

    // 3. Ustuvorlik filtri
    if (currentPriority !== 'all') {
        result = result.filter(t => t.priority === currentPriority);
    }

    // 4. Qidiruv
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        result = result.filter(t => 
            t.title.toLowerCase().includes(q) || 
            (t.desc && t.desc.toLowerCase().includes(q))
        );
    }

    // 5. Saralash
    result.sort((a, b) => {
        if (currentSort === 'newest') {
            return new Date(b.createdAt) - new Date(a.createdAt);
        } else if (currentSort === 'oldest') {
            return new Date(a.createdAt) - new Date(b.createdAt);
        } else if (currentSort === 'due-date') {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        } else if (currentSort === 'priority-desc') {
            const weight = { high: 3, medium: 2, low: 1 };
            return (weight[b.priority] || 0) - (weight[a.priority] || 0);
        } else if (currentSort === 'alphabetical') {
            return a.title.localeCompare(b.title);
        }
        return 0;
    });

    return result;
}

// ==========================================
// 8. RENDER QILISH VA STATISTIKA
// ==========================================

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = total - completed;
    const highPriority = tasks.filter(t => t.priority === 'high' && t.status === 'pending').length;
    const starred = tasks.filter(t => t.starred).length;

    statTotal.textContent = total;
    statPending.textContent = pending;
    statCompleted.textContent = completed;
    statPriority.textContent = highPriority;

    badgeAll.textContent = total;
    badgePending.textContent = pending;
    badgeCompleted.textContent = completed;
    badgeStarred.textContent = starred;

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    productivityPercent.textContent = `${percent}%`;
    productivityBar.style.width = `${percent}%`;

    const kanbanPending = tasks.filter(t => t.status === 'pending').length;
    const kanbanCompleted = tasks.filter(t => t.status === 'completed').length;
    document.getElementById('kanban-pending-count').textContent = kanbanPending;
    document.getElementById('kanban-completed-count').textContent = kanbanCompleted;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

function getDueDateStatus(dueDateStr) {
    if (!dueDateStr) return { label: '', className: '' };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dueDateStr);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { label: `Muddati o'tgan (${Math.abs(diffDays)} kun oldin)`, className: 'overdue' };
    } else if (diffDays === 0) {
        return { label: 'Bugun oxirgi muddat!', className: 'due-today' };
    } else if (diffDays === 1) {
        return { label: 'Ertaga oxirgi muddat', className: 'due-today' };
    } else {
        return { label: `${formatDate(dueDateStr)} gacha`, className: '' };
    }
}

// Bitta vazifa HTML kartochkasini yaratish
function createTaskCardHTML(task) {
    const isCompleted = task.status === 'completed';
    const dueDateInfo = getDueDateStatus(task.dueDate);

    const priorityNames = {
        high: 'Yuqori',
        medium: 'O\'rta',
        low: 'Past'
    };

    const updatedText = task.updatedAt 
        ? `<span class="task-edited-tag" title="Oxirgi tahrir: ${new Date(task.updatedAt).toLocaleTimeString()}"><i class="fa-solid fa-pen-nib"></i> tahrirlangan</span>` 
        : '';

    // Taymer vidjeti holati
    let timerWidgetHTML = '';
    if (!isCompleted) {
        const isRunning = task.timerRunning;
        const isExpired = task.isExpired || task.timerRemaining <= 0;
        const timerClass = isExpired ? 'expired' : (isRunning ? 'running' : '');

        timerWidgetHTML = `
            <div class="task-timer-widget ${timerClass}" title="Vazifa taymeri">
                <i class="fa-solid ${isExpired ? 'fa-bell ringing-bell' : (isRunning ? 'fa-hourglass-start fa-spin' : 'fa-stopwatch')}"></i>
                <span class="timer-digits" id="timer-digits-${task.id}">${formatTimerSeconds(task.timerRemaining)}</span>
                <div class="timer-actions">
                    <button class="timer-mini-btn" onclick="toggleTaskTimer('${task.id}')" title="${isRunning ? 'To\'xtatib turish' : 'Boshlash'}">
                        <i class="fa-solid ${isRunning ? 'fa-pause' : 'fa-play'}"></i>
                    </button>
                    <button class="timer-mini-btn" onclick="resetTaskTimer('${task.id}')" title="Qayta o'rnatish (${task.timerMinutes || 5} min)">
                        <i class="fa-solid fa-rotate-right"></i>
                    </button>
                </div>
            </div>
        `;
    }

    const alarmPulsingClass = (!isCompleted && task.isExpired) ? 'alarm-pulsing' : '';

    return `
        <div class="task-card priority-${task.priority} ${isCompleted ? 'is-completed' : ''} ${alarmPulsingClass}" data-id="${task.id}">
            <div class="task-checkbox-wrapper">
                <div class="custom-checkbox ${isCompleted ? 'checked' : ''}" onclick="toggleTaskStatus('${task.id}')" title="${isCompleted ? 'Qayta tiklash' : 'Bajarildi deb belgilash'}">
                    <i class="fa-solid fa-check"></i>
                </div>
            </div>

            <div class="task-body">
                <div class="task-header-row">
                    <span class="task-category-tag">${escapeHtml(task.category || 'Boshqa')}</span>
                    <span class="priority-pill ${task.priority}">${priorityNames[task.priority] || 'Oddiy'}</span>
                    ${timerWidgetHTML}
                    ${updatedText}
                </div>

                <h4 class="task-main-title">${escapeHtml(task.title)}</h4>
                
                ${task.desc ? `<p class="task-desc">${escapeHtml(task.desc)}</p>` : ''}

                <div class="task-footer-row">
                    ${task.dueDate ? `
                        <div class="task-meta-item ${dueDateInfo.className}">
                            <i class="fa-regular fa-calendar"></i>
                            <span>${dueDateInfo.label}</span>
                        </div>
                    ` : ''}

                    <div class="task-meta-item" title="Yaratilgan vaqti: ${new Date(task.createdAt).toLocaleString()}">
                        <i class="fa-regular fa-clock"></i>
                        <span>${formatDate(task.createdAt)}</span>
                    </div>

                    ${task.alarmEnabled ? `
                        <div class="task-meta-item" title="Vaqt tugaganda ovozli signal beradi" style="color: var(--primary);">
                            <i class="fa-solid fa-bell"></i>
                            <span>Signal yoqilgan</span>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="task-actions">
                <button class="action-btn star-btn ${task.starred ? 'active' : ''}" onclick="toggleTaskStar('${task.id}')" title="${task.starred ? 'Muhimlardan chiqarish' : 'Muhim deb belgilash'}">
                    <i class="${task.starred ? 'fa-solid' : 'fa-regular'} fa-star"></i>
                </button>
                <button class="action-btn edit-btn" onclick="openTaskModal('${task.id}')" title="Tahrirlash / O'zgartirish">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button class="action-btn delete-btn" onclick="promptDeleteTask('${task.id}')" title="O'chirish">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        </div>
    `;
}

function render() {
    updateStats();
    const filtered = getFilteredTasks();

    if (filtered.length === 0) {
        tasksListContainer.innerHTML = '';
        kanbanPendingList.innerHTML = '';
        kanbanCompletedList.innerHTML = '';
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';

        if (currentView === 'list') {
            tasksListContainer.parentElement.style.display = 'block';
            kanbanContainer.style.display = 'none';
            tasksListContainer.innerHTML = filtered.map(t => createTaskCardHTML(t)).join('');
        } else {
            tasksListContainer.parentElement.style.display = 'none';
            kanbanContainer.style.display = 'grid';

            const pendingCards = filtered.filter(t => t.status === 'pending');
            const completedCards = filtered.filter(t => t.status === 'completed');

            kanbanPendingList.innerHTML = pendingCards.length 
                ? pendingCards.map(t => createTaskCardHTML(t)).join('') 
                : '<p style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding: 20px;">Vazifalar yo\'q</p>';

            kanbanCompletedList.innerHTML = completedCards.length 
                ? completedCards.map(t => createTaskCardHTML(t)).join('') 
                : '<p style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding: 20px;">Bajarilgan vazifalar yo\'q</p>';
        }
    }

    // Filtr nomi yozuvi
    let filterName = 'Barcha vazifalar';
    if (currentFilter === 'pending') filterName = 'Bajarilayotgan vazifalar';
    if (currentFilter === 'completed') filterName = 'Bajarilgan vazifalar';
    if (currentFilter === 'starred') filterName = 'Muhim vazifalar';
    if (currentCategory !== 'all') filterName += ` (${currentCategory})`;
    activeFilterLabel.textContent = `${filterName} ko'rsatilmoqda: ${filtered.length} ta`;
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ==========================================
// 9. HODISALAR (EVENT LISTENERS)
// ==========================================

function setupEventListeners() {
    // Modal ochish
    openAddModalBtn.addEventListener('click', () => openTaskModal());
    emptyAddBtn.addEventListener('click', () => openTaskModal());
    closeModalBtn.addEventListener('click', closeTaskModal);
    cancelModalBtn.addEventListener('click', closeTaskModal);

    // O'chirish modali
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);

    // Alarm Modal tugmalari
    alarmDismissBtn.addEventListener('click', dismissAlarm);
    alarmCompleteBtn.addEventListener('click', completeAlarmTask);
    alarmSnoozeBtn.addEventListener('click', () => snoozeAlarmTask(5));

    // Modallardan tashqarini bosganda yopish
    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) closeTaskModal();
    });
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) closeDeleteModal();
    });

    // Klaviatura Escape tugmasi
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeTaskModal();
            closeDeleteModal();
            dismissAlarm();
            closeAiBreakdownModal();
        }
    });

    // Aqlli Reja Tuzuvchi hodisalari
    setupAiEventListeners();

    // Mavzuni almashtirish
    themeToggleBtn.addEventListener('click', toggleTheme);

    // Ko'rinish rejimi (List vs Kanban)
    viewListBtn.addEventListener('click', () => {
        currentView = 'list';
        viewListBtn.classList.add('active');
        viewKanbanBtn.classList.remove('active');
        render();
    });

    viewKanbanBtn.addEventListener('click', () => {
        currentView = 'kanban';
        viewKanbanBtn.classList.add('active');
        viewListBtn.classList.remove('active');
        render();
    });

    // Menyu filtrlari
    document.querySelectorAll('.nav-menu .nav-item[data-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-menu .nav-item[data-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            render();
        });
    });

    // Kategoriya filtrlari
    document.querySelectorAll('.nav-category').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-category').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            render();
        });
    });

    // Ustuvorlik filtri
    priorityFilter.addEventListener('change', (e) => {
        currentPriority = e.target.value;
        render();
    });

    // Saralash
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        render();
    });

    // Qidiruv
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
        render();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        render();
    });

// ==========================================
// 10. AQLLI REJA TUZUVCHI (AI TASK BREAKDOWN)
// ==========================================

function openAiBreakdownModal() {
    getAudioContext();
    aiModal.classList.add('active');
    setTimeout(() => aiGoalInput.focus(), 150);
}

function closeAiBreakdownModal() {
    aiModal.classList.remove('active');
}

// Matnni tahlil qilib, qadam-baqadam vazifalarga bo'lish
function breakdownGoalIntoTasks(goalText, minutesPerStep = 5, countMode = 'auto') {
    const raw = goalText.trim();
    if (!raw) return [];

    const lower = raw.toLowerCase();
    let category = 'Ish';
    let steps = [];

    // 1. OSH / TAOM / PAZANDACHILIK
    if (
        lower.includes('osh') || lower.includes('palov') || lower.includes('taom') || 
        lower.includes('ovqat') || lower.includes('pishir') || lower.includes('manti') || 
        lower.includes('somsa') || lower.includes('sho\'rva') || lower.includes('shashlik') || 
        lower.includes('kabob') || lower.includes('tort') || lower.includes('pishiriq')
    ) {
        category = 'Shaxsiy';

        if (lower.includes('osh') || lower.includes('palov')) {
            steps = [
                {
                    title: '1-qadam: Masalliq va go\'shtni tayyorlash',
                    desc: 'Go\'sht, guruch, sabzi, piyoz, yog\' va ziravorlarni (zira, kashnich, tuz) tozalab, to\'g\'rab hozirlash.',
                    priority: 'high'
                },
                {
                    title: '2-qadam: Qozonni o\'choqqa qo\'yish va yog\'ni dog\'lash',
                    desc: 'Qozonni o\'choq yoki gaz ustiga qo\'yib qizdirish, paxta yoki o\'simlik yog\'ini solib yaxshilab dog\'lash.',
                    priority: 'high'
                },
                {
                    title: '3-qadam: Piyoz va go\'shtni qovurish',
                    desc: 'Avval to\'g\'ralgan piyozni tillarang bo\'lguncha, so\'ng go\'sht bo\'laklarini solib qovurish.',
                    priority: 'high'
                },
                {
                    title: '4-qadam: Sabzini solish va zirvakni qaynatish',
                    desc: 'Sabzini solib yumshaguncha qovurish, so\'ng suv quyib past olovda zirvakni 20-30 daqiqa qaynatish.',
                    priority: 'medium'
                },
                {
                    title: '5-qadam: Guruchni yuvish va zirvak ustiga solish',
                    desc: 'Guruchni iliq sho\'r suvda 3-4 marta tiniq bo\'lguncha yuvib, zirvak yuziga bir tekis qilib yoyish.',
                    priority: 'high'
                },
                {
                    title: '6-qadam: Suvini torttirib qozonni dimlash',
                    desc: 'Guruch suvini to\'liq shimib olgach, o\'rtaga gumbaz qilib to\'plash, teshiklar ochish va qopqoqni yopib 20 daqiqa dimlash.',
                    priority: 'medium'
                },
                {
                    title: '7-qadam: Oshni aralashtirish va laganga suzish',
                    desc: 'Qozonni ochib oshni yaxshilab aralashtirish, laganlarga go\'sht va sabzisini chiroyli qilib terib dasturxonga tortish.',
                    priority: 'low'
                }
            ];
        } else {
            steps = [
                {
                    title: `1-qadam: ${raw} uchun retsept va masalliqlarni tanlash`,
                    desc: 'Kerakli barcha go\'sht, sabzavotlar, ziravorlar va mahsulotlar ro\'yxatini tekshirib olish.',
                    priority: 'high'
                },
                {
                    title: '2-qadam: Oshxona jihozlari va idishlarni tayyorlash',
                    desc: 'Qozon, pichoq, taxtakach va idishlarni yuvib, quruq holatga keltirish.',
                    priority: 'high'
                },
                {
                    title: '3-qadam: Masalliqlarni yuvish va to\'g\'rash',
                    desc: 'Barcha masalliqlarni me\'yoriga ko\'ra tozalash, yuvish va to\'g\'rab chiqish.',
                    priority: 'medium'
                },
                {
                    title: '4-qadam: Pishirish jarayonini boshlash',
                    desc: 'Olovni yoqish, bosqichma-bosqich qovurish yoki qaynatish amallarini bajarish.',
                    priority: 'high'
                },
                {
                    title: '5-qadam: Ziravorlar va ta\'mini me\'yoriga keltirish',
                    desc: 'Tuz, murch va maxsus ziravorlarni qo\'shib, taomini sinab ko\'rish.',
                    priority: 'medium'
                },
                {
                    title: '6-qadam: Tayyor bo\'lishini kutish va dasturxonga tortish',
                    desc: 'Taomni me\'yoriga yetkazib pishirish va salatlar bilan birga tortish.',
                    priority: 'low'
                }
            ];
        }
    }
    // 2. UY / TOZALIK / RO'ZG'OR
    else if (
        lower.includes('uy') || lower.includes('tozala') || lower.includes('xona') || 
        lower.includes('kir') || lower.includes('idish') || lower.includes('tartib') || 
        lower.includes('yig\'') || lower.includes('pol') || lower.includes('deraza')
    ) {
        category = 'Shaxsiy';
        steps = [
            {
                title: '1-qadam: Tozalash vositalari va anjomlarni tayyorlash',
                desc: 'Changyutgich, latta, chelak, pol yuvgich va maxsus yuvish vositalarini hozirlash.',
                priority: 'high'
            },
            {
                title: '2-qadam: Keraksiz narsalar va chiqindilarni yig\'ishtirish',
                desc: 'Xonalardagi sochilib yotgan buyumlarni o\'z joyiga qo\'yish, chiqindilarni alohida ajratish.',
                priority: 'high'
            },
            {
                title: '3-qadam: Mebellar va yuzalardagi changlarni artish',
                desc: 'Stollar, javonlar, televizor va barcha qattiq yuzalarni nam latta bilan artib chiqish.',
                priority: 'medium'
            },
            {
                title: '4-qadam: Polni changyutgich bilan tozalash',
                desc: 'Gilamlar va burchaklardagi chang-to\'zonlarni changyutgich yordamida chuqur tozalash.',
                priority: 'high'
            },
            {
                title: '5-qadam: Polni yuvish va xonalarni shamollatish',
                desc: 'Polni xushbo\'y vosita bilan artib chiqish va derazalarni ochib toza havo kiritish.',
                priority: 'low'
            }
        ];
    }
    // 3. SAYT / DASTURLASH / IT / LOYIHA
    else if (
        lower.includes('sayt') || lower.includes('dastur') || lower.includes('kod') || 
        lower.includes('web') || lower.includes('app') || lower.includes('bot') || 
        lower.includes('loyiha') || lower.includes('backend') || lower.includes('frontend')
    ) {
        category = 'Ish';
        steps = [
            {
                title: `1-qadam: ${raw} bo'yicha talablar va arxitekturani aniqlash`,
                desc: 'Loyiha qanday vazifalarni bajarishi, kimlar uchun ekanligi va texnologiyalar stekini tanlash.',
                priority: 'high'
            },
            {
                title: '2-qadam: UI/UX dizayn eskizlari va maketini chizish',
                desc: 'Foydalanuvchi interfeysi, sahifalar tuzilishi va qulay navigatsiyani rejalashtirish.',
                priority: 'high'
            },
            {
                title: '3-qadam: Ma\'lumotlar bazasi va Backend logikasini tuzish',
                desc: 'Ma\'lumotlar strukturasi, API endpointlari va xavfsizlik qoidalarini yozish.',
                priority: 'high'
            },
            {
                title: '4-qadam: Frontend (Interfeys) qismini ishlab chiqish',
                desc: 'Dizayn asosida komponentlar, tugmalar va sahifalar responsivligini ta\'minlash.',
                priority: 'medium'
            },
            {
                title: '5-qadam: Tizimni testlash va xatoliklarni bartaraf etish',
                desc: 'Barcha tugma va funksiyalarni har xil qurilmalarda tekshirib, xatolarni to\'g\'rilash.',
                priority: 'medium'
            },
            {
                title: '6-qadam: Loyihani serverga joylash (Deploy)',
                desc: 'Dasturni jonli serverga yuklash, domen va SSL sertifikatlarini sozlash.',
                priority: 'low'
            }
        ];
    }
    // 4. O'QISH / TA'LIM / IMTIHON
    else if (
        lower.includes('imtihon') || lower.includes('dars') || lower.includes('o\'qish') || 
        lower.includes('kitob') || lower.includes('ingliz') || lower.includes('til') || 
        lower.includes('test') || lower.includes('o\'rgan')
    ) {
        category = 'O\'qish';
        steps = [
            {
                title: '1-qadam: O\'rganiladigan mavzular va materiallar ro\'yxati',
                desc: 'Darsliklar, konspektlar, videodarslar va asosiy adabiyotlarni to\'plash.',
                priority: 'high'
            },
            {
                title: '2-qadam: Nazariy tushunchalar va qoidalarni o\'zlashtirish',
                desc: 'Asosiy tushunchalarni diqqat bilan o\'qib chiqish, muhim qismlarini daftarga yozib borish.',
                priority: 'high'
            },
            {
                title: '3-qadam: Lug\'at va formulalarni yodlash',
                desc: 'Eng ko\'p uchraydigan terminlar, so\'zlar yoki formulalarni kartochkalar orqali takrorlash.',
                priority: 'medium'
            },
            {
                title: '4-qadam: Amaliy mashqlar va testlar ishlash',
                desc: 'Nazariyani mustahkamlash uchun mustaqil masalalar va test savollarini yechish.',
                priority: 'high'
            },
            {
                title: '5-qadam: Xatolar tahlili va yakuniy takrorlash',
                desc: 'Xato qilingan savollarga qaytib, sabablarini tushunish va umumiy xulosa qilish.',
                priority: 'low'
            }
        ];
    }
    // 5. SAYOHAT / SAFAR
    else if (
        lower.includes('sayohat') || lower.includes('dam olish') || lower.includes('safar') || 
        lower.includes('tog\'') || lower.includes('samolyot') || lower.includes('mehmonxona')
    ) {
        category = 'Shaxsiy';
        steps = [
            {
                title: '1-qadam: Safar marshruti va byudjetni belgilash',
                desc: 'Boriladigan shahar/joylar, kunlar soni va umumiy xarajatlarni aniq hisoblab chiqish.',
                priority: 'high'
            },
            {
                title: '2-qadam: Transport chiptalari va turar-joyni band qilish',
                desc: 'Poyezd/avtobus/samolyot chiptalarini sotib olish hamda mehmonxona yoki uyni bron qilish.',
                priority: 'high'
            },
            {
                title: '3-qadam: Hujjatlar va zaruriy narsalar ro\'yxatini tekshirish',
                desc: 'Pasport, sug\'urta, pullar, quvvatlagichlar va birinchi yordam dori-darmonlarini tayyorlash.',
                priority: 'high'
            },
            {
                title: '4-qadam: Chamadon va kiyimlarni yig\'ish',
                desc: 'Ob-havoga mos kiyimlarni saralab, ixcham va xavfsiz qilib chamadonga joylash.',
                priority: 'medium'
            },
            {
                title: '5-qadam: Yo\'lga chiqish va vaqtida manzilga yetib borish',
                desc: 'Belgilangan vaqtdan 1-2 soat oldin harakatni boshlash va xavfsiz sayohat qilish.',
                priority: 'low'
            }
        ];
    }
    // 6. AVTOMOBIL / XARID / MASHINA
    else if (
        lower.includes('mashina') || lower.includes('avto') || lower.includes('sotib') || 
        lower.includes('xarid') || lower.includes('bozor')
    ) {
        category = 'Ish';
        steps = [
            {
                title: '1-qadam: Talablar, mezonlar va byudjetni aniqlash',
                desc: 'Maksimal ajratiladigan mablag\', kerakli xususiyatlar va model turlarini tanlab olish.',
                priority: 'high'
            },
            {
                title: '2-qadam: Bozordagi narxlar va variantlarni tahlil qilish',
                desc: 'E\'lonlar, rasmiy do\'konlar yoki bozorlardagi narxlar va takliflarni solishtirish.',
                priority: 'high'
            },
            {
                title: '3-qadam: Tanlangan variantlarni ko\'rikdan o\'tkazish',
                desc: 'Mutaxassis yoki ishonchli usta bilan borib texnik holatini sinovdan o\'tkazish.',
                priority: 'high'
            },
            {
                title: '4-qadam: Hujjatlar va qonuniyligini tekshirish',
                desc: 'Kafolat qog\'ozlari, soliqlar yoki taqiqlar yo\'qligini rasmiy manbalardan tekshirish.',
                priority: 'medium'
            },
            {
                title: '5-qadam: Bitimni rasmiylashtirish va xaridni amalga oshirish',
                desc: 'To\'lovni amalga oshirish va qonuniy rasmiylashtirib o\'z nomiga o\'tkazish.',
                priority: 'low'
            }
        ];
    }
    // 7. SPORT / SALOMATLIK / YUGURISH
    else if (
        lower.includes('sport') || lower.includes('yugur') || lower.includes('mashq') || 
        lower.includes('zal') || lower.includes('fitness') || lower.includes('parhez')
    ) {
        category = 'Sog\'liq';
        steps = [
            {
                title: '1-qadam: Maqsad va mashg\'ulot rejasini tuzish',
                desc: 'Qaysi mushak guruhlariga ishlash yoki qancha masofaga yugurishni belgilash.',
                priority: 'high'
            },
            {
                title: '2-qadam: Sport kiyimlari va qulay poyabzalni kiyish',
                desc: 'Harakatga xalaqit bermaydigan qulay kiyim va suv idishini tayyorlab olish.',
                priority: 'high'
            },
            {
                title: '3-qadam: Mushaklarni qizdirish (Razminka)',
                desc: 'Shikastlanishlarning oldini olish uchun 5-10 daqiqa yengil harakatlar bilan qizish.',
                priority: 'high'
            },
            {
                title: '4-qadam: Asosiy intensiv mashg\'ulotni bajarish',
                desc: 'Rejalashtirilgan mashqlarni to\'liq va to\'g\'ri texnika bilan bajarish.',
                priority: 'medium'
            },
            {
                title: '5-qadam: Mushaklarni cho\'zish (Zaminka) va suv ichish',
                desc: 'Yurak urishini me\'yoriga tushirish, cho\'zilish mashqlarini qilish va yetarlicha suv ichish.',
                priority: 'low'
            }
        ];
    }
    // 8. BOSHQA IXTIYORIY ISH VA MAQSADLAR UCHUN UNIVERSAL HEVRISTIK DEKOMPOZITSIYA
    else {
        category = 'Ish';
        steps = [
            {
                title: `1-qadam: ${raw} bo'yicha tayyorgarlik va reja tuzish`,
                desc: 'Ishning maqsadini, unga kerak bo\'ladigan vaqt, mablag\' va vositalarni aniqlab olish.',
                priority: 'high'
            },
            {
                title: '2-qadam: Kerakli ma\'lumotlar va asboblarni yig\'ish',
                desc: 'Ishni to\'xtovsiz va sifatli bajarish uchun barcha kerakli buyumlarni tayyorlab qo\'yish.',
                priority: 'high'
            },
            {
                title: '3-qadam: Asosiy amaliy qismni boshlash va bajarish',
                desc: 'Rejaning eng muhim va hal qiluvchi harakatlarini diqqat bilan amalga oshirish.',
                priority: 'high'
            },
            {
                title: '4-qadam: Oraliq natijani tekshirish va tuzatishlar kiritish',
                desc: 'Bajarilgan ishlarni ko\'zdan kechirish, kamchiliklar bo\'lsa darhol to\'g\'rilash.',
                priority: 'medium'
            },
            {
                title: '5-qadam: Ishni yakunlash va natijani qayd etish',
                desc: 'Yakuniy tekshiruvni o\'tkazish, ish joyini tartibga keltirish va natijadan xulosa chiqarish.',
                priority: 'low'
            }
        ];
    }

    // Bosqichlar sonini sozlash
    if (countMode === 'compact' && steps.length > 4) {
        steps = [steps[0], steps[1], steps[Math.floor(steps.length / 2)], steps[steps.length - 1]];
    }

    // Har bir qadamga taymer va xususiyatlarni biriktirish
    return steps.map((s, idx) => ({
        ...s,
        stepNumber: idx + 1,
        category: category,
        minutes: minutesPerStep,
        alarmEnabled: true
    }));
}

// Generatsiya qilingan bosqichlarni ko'rsatish
function renderGeneratedSteps() {
    if (generatedAiSteps.length === 0) {
        aiResultsContainer.style.display = 'none';
        return;
    }

    aiResultsContainer.style.display = 'flex';
    aiStepsCountBadge.textContent = generatedAiSteps.length;
    
    const totalMins = generatedAiSteps.reduce((sum, item) => sum + (item.minutes || 5), 0);
    aiTotalTime.textContent = `Jami vaqt: ${totalMins} daqiqa`;

    aiStepsList.innerHTML = generatedAiSteps.map((step, idx) => `
        <div class="ai-step-card" data-index="${idx}">
            <div class="step-num">${idx + 1}</div>
            <div class="step-content">
                <h5>${escapeHtml(step.title)}</h5>
                <p>${escapeHtml(step.desc)}</p>
                <div class="step-meta">
                    <span class="step-time-badge"><i class="fa-solid fa-stopwatch"></i> ${step.minutes} minut</span>
                    <span class="priority-pill ${step.priority}">${step.priority === 'high' ? 'Muhim' : (step.priority === 'medium' ? 'O\'rta' : 'Past')}</span>
                    <span><i class="fa-solid fa-tag"></i> ${escapeHtml(step.category)}</span>
                </div>
            </div>
            <button type="button" class="remove-step-btn" onclick="removeGeneratedStep(${idx})" title="Ushbu qadamni olib tashlash">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
    `).join('');
}

function removeGeneratedStep(index) {
    generatedAiSteps.splice(index, 1);
    // Raqamlarni qayta sanash
    generatedAiSteps.forEach((s, i) => s.stepNumber = i + 1);
    renderGeneratedSteps();
}

// Barcha bosqichlarni haqiqiy Task Menejer vazifalariga aylantirish
function applyAllGeneratedStepsToTasks() {
    if (generatedAiSteps.length === 0) return;

    const today = new Date().toISOString().split('T')[0];
    const newTasks = generatedAiSteps.map((step, idx) => ({
        id: 'task_' + (Date.now() + idx) + '_' + Math.random().toString(36).substr(2, 5),
        title: step.title,
        desc: step.desc,
        category: step.category || 'Ish',
        priority: step.priority || 'medium',
        dueDate: today,
        status: 'pending',
        starred: idx === 0, // 1-qadamni avtomatik muhim qilish
        timerMinutes: step.minutes || 5,
        timerRemaining: (step.minutes || 5) * 60,
        timerRunning: idx === 0, // 1-vazifaning taymerini darhol yurgizish!
        alarmEnabled: true,
        isExpired: false,
        createdAt: new Date(Date.now() - (generatedAiSteps.length - idx) * 1000).toISOString(),
        updatedAt: null
    }));

    // Boshiga qo'shish
    tasks = [...newTasks, ...tasks];
    saveTasksToStorage();
    render();
    closeAiBreakdownModal();

    showToast(
        "Muvaffaqiyatli!", 
        `${newTasks.length} ta bosqichli vazifa qo'shildi! 1-bosqich taymeri ishga tushdi.`, 
        "success"
    );
}

// Event Listeners ga AI hodisalarini ulash
function setupAiEventListeners() {
    openAiModalBtn.addEventListener('click', openAiBreakdownModal);
    closeAiModalBtn.addEventListener('click', closeAiBreakdownModal);
    aiCancelBtn.addEventListener('click', closeAiBreakdownModal);

    // Tashqariga bosganda yopish
    aiModal.addEventListener('click', (e) => {
        if (e.target === aiModal) closeAiBreakdownModal();
    });

    // Tezkor chiplarni bosish
    document.querySelectorAll('.quick-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            aiGoalInput.value = chip.dataset.example;
            aiGenerateBtn.click();
        });
    });

    // Generatsiya tugmasi
    aiGenerateBtn.addEventListener('click', () => {
        const goal = aiGoalInput.value.trim();
        if (!goal) {
            showToast("Diqqat", "Iltimos, qilmoqchi bo'lgan ishingizni yozing!", "warning");
            aiGoalInput.focus();
            return;
        }

        const mins = parseInt(aiStepMinutesInput.value, 10) || 5;
        const countMode = aiStepCountSelect.value;

        // Generatsiya qilish
        generatedAiSteps = breakdownGoalIntoTasks(goal, mins, countMode);
        renderGeneratedSteps();

        showToast(
            "Reja tayyor!", 
            `"${goal}" ishi uchun ${generatedAiSteps.length} ta bosqich tuzildi.`, 
            "info"
        );
    });

    // Barchasini qo'shish
    aiApplyAllBtn.addEventListener('click', applyAllGeneratedStepsToTasks);
}

// Eksport (JSON)
    exportBtn.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `TaskFlow_Vazifalar_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast("Eksport qilindi", "Barcha vazifalar JSON fayl sifatida yuklandi.", "success");
    });

    // Import (JSON)
    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const imported = JSON.parse(event.target.result);
                if (Array.isArray(imported)) {
                    tasks = imported;
                    saveTasksToStorage();
                    render();
                    showToast("Muvaffaqiyatli!", "Vazifalar zaxiradan qayta tiklandi.", "success");
                } else {
                    showToast("Xato", "Fayl formati noto'g'ri!", "danger");
                }
            } catch (err) {
                showToast("Xato", "Faylni o'qishda xatolik yuz berdi.", "danger");
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });
}

// Dasturni yurgizish
document.addEventListener('DOMContentLoaded', initApp);
