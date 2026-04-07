document.addEventListener('DOMContentLoaded', () => {
    initThemeSettings();
    initDateDisplay();
    initShortcuts();
    initTodos();
    initViews();
    initBackground();
});

// --- Theme & Options Logic ---
function initThemeSettings() {
    const optionsToggleBtn = document.getElementById('options-toggle-btn');
    const optionsMenu = document.getElementById('options-menu');
    const darkModeItem = document.getElementById('dark-mode-item');
    const darkModeIcon = document.getElementById('dark-mode-icon');
    
    // Toggle Menu
    optionsToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        optionsMenu.classList.toggle('hidden');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!optionsToggleBtn.contains(e.target) && !optionsMenu.contains(e.target)) {
            optionsMenu.classList.add('hidden');
        }
    });

    // 1. Dark Mode Logic
    let currentTheme = localStorage.getItem('chromeStartTheme') || 'light';
    if (currentTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        darkModeIcon.classList.replace('fa-moon', 'fa-sun');
    }
    
    darkModeItem.addEventListener('click', () => {
        currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            darkModeIcon.classList.replace('fa-moon', 'fa-sun');
        } else {
            document.documentElement.removeAttribute('data-theme');
            darkModeIcon.classList.replace('fa-sun', 'fa-moon');
        }
        localStorage.setItem('chromeStartTheme', currentTheme);
    });

    // 2. Accent Color Logic
    const swatches = document.querySelectorAll('.color-swatch');
    const rootStyles = document.documentElement.style;
    const currentAccent = localStorage.getItem('chromeStartAccent') || '#f59e0b';
    
    const customColorPicker = document.getElementById('custom-color-picker');
    const customColorWrapper = document.getElementById('custom-color-wrapper');
    
    const hoverHues = {
        '#f59e0b': '#d97706',
        '#E50914': '#b91c1c',
        '#7928ca': '#5b21b6'
    };

    const applyAccent = (color, activeSwatch) => {
        rootStyles.setProperty('--accent', color);
        if (hoverHues[color]) {
            rootStyles.setProperty('--accent-hover', hoverHues[color]);
        } else {
            rootStyles.setProperty('--accent-hover', color);
        }
        localStorage.setItem('chromeStartAccent', color);
        
        swatches.forEach(s => s.classList.remove('active'));
        if (activeSwatch) activeSwatch.classList.add('active');
    };

    // Initialize layout
    let foundPreset = false;
    swatches.forEach(sw => {
        if(sw.dataset.color && sw.dataset.color.toLowerCase() === currentAccent.toLowerCase()) {
            sw.classList.add('active');
            foundPreset = true;
        }
    });

    if (!foundPreset) {
        customColorPicker.value = currentAccent;
        customColorWrapper.classList.add('active');
    }

    // Call once to inject actual root bindings safely on load
    rootStyles.setProperty('--accent', currentAccent);
    if(hoverHues[currentAccent]) rootStyles.setProperty('--accent-hover', hoverHues[currentAccent]);
    else rootStyles.setProperty('--accent-hover', currentAccent);

    // Bind Presets
    swatches.forEach(swatch => {
        if (swatch.dataset.color) {
            swatch.addEventListener('click', (e) => {
                e.stopPropagation();
                applyAccent(swatch.dataset.color, swatch);
            });
        }
    });

    // Bind Custom Picker
    customColorPicker.addEventListener('input', (e) => {
        applyAccent(e.target.value, customColorWrapper);
    });
    customColorPicker.addEventListener('click', (e) => e.stopPropagation());
}

// --- Date Display ---
function initDateDisplay() {
    const dateDisplay = document.getElementById('date-display');
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    const today = new Date();
    dateDisplay.textContent = today.toLocaleDateString('en-US', options);
}

// --- Shortcuts Logic ---
const defaultShortcuts = [
    { id: '1', name: 'YouTube', url: 'https://youtube.com', icon: 'fa-brands fa-youtube' },
    { id: '2', name: 'Gmail', url: 'https://mail.google.com', icon: 'fa-solid fa-envelope' },
    { id: '3', name: 'LinkedIn', url: 'https://linkedin.com', icon: 'fa-brands fa-linkedin' },
    { id: '4', name: 'GitHub', url: 'https://github.com', icon: 'fa-brands fa-github' },
    { id: '5', name: 'WhatsApp', url: 'https://web.whatsapp.com', icon: 'fa-brands fa-whatsapp' },
];

function initShortcuts() {
    let shortcuts = JSON.parse(localStorage.getItem('chromeStartShortcuts'));
    if (!shortcuts || shortcuts.length === 0) {
        shortcuts = defaultShortcuts;
        saveShortcuts(shortcuts);
    }
    renderShortcuts(shortcuts);

    const addBtn = document.getElementById('add-shortcut-btn');
    const modal = document.getElementById('shortcut-modal');
    const cancelBtn = document.getElementById('cancel-shortcut');
    const saveBtn = document.getElementById('save-shortcut');
    const nameInput = document.getElementById('shortcut-name');
    const urlInput = document.getElementById('shortcut-url');
    let editingShortcutId = null;
    const modalHeader = modal.querySelector('h3');

    addBtn.addEventListener('click', () => {
        editingShortcutId = null;
        modalHeader.textContent = 'Add New Shortcut';
        modal.classList.remove('hidden');
        nameInput.focus();
    });

    const closeModal = () => {
        modal.classList.add('hidden');
        nameInput.value = '';
        urlInput.value = '';
        editingShortcutId = null;
    };

    cancelBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    saveBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        let url = urlInput.value.trim();
        
        if (name && url) {
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            
            if (editingShortcutId) {
                const idx = shortcuts.findIndex(s => s.id === editingShortcutId);
                if (idx > -1) {
                    shortcuts[idx].name = name;
                    shortcuts[idx].url = url;
                }
            } else {
                const newShortcut = {
                    id: Date.now().toString(),
                    name,
                    url,
                    icon: 'fa-solid fa-globe'
                };
                shortcuts.push(newShortcut);
            }
            
            saveShortcuts(shortcuts);
            renderShortcuts(shortcuts);
            closeModal();
        }
    });

    // Delegate edit/delete events
    document.getElementById('shortcuts-grid').addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-shortcut');
        const editBtn = e.target.closest('.edit-shortcut');
        if (deleteBtn) {
            e.preventDefault(); // Stop navigation
            e.stopPropagation();
            const id = deleteBtn.dataset.id;
            shortcuts = shortcuts.filter(s => s.id !== id);
            saveShortcuts(shortcuts);
            renderShortcuts(shortcuts);
        } else if (editBtn) {
            e.preventDefault();
            e.stopPropagation();
            editingShortcutId = editBtn.dataset.id;
            const target = shortcuts.find(s => s.id === editingShortcutId);
            if (target) {
                nameInput.value = target.name;
                urlInput.value = target.url;
                modalHeader.textContent = 'Edit Shortcut';
                modal.classList.remove('hidden');
                nameInput.focus();
            }
        }
    });
}

function saveShortcuts(shortcuts) {
    localStorage.setItem('chromeStartShortcuts', JSON.stringify(shortcuts));
}

function renderShortcuts(shortcuts) {
    const grid = document.getElementById('shortcuts-grid');
    grid.innerHTML = '';

    shortcuts.forEach(shortcut => {
        const a = document.createElement('a');
        a.href = shortcut.url;
        a.className = 'shortcut-tile';
        a.innerHTML = `
            <div class="shortcut-icon">
                <i class="${shortcut.icon}"></i>
            </div>
            <span class="shortcut-name">${shortcut.name}</span>
            <button class="edit-shortcut" data-id="${shortcut.id}" aria-label="Edit">
                <i class="fa-solid fa-pen"></i>
            </button>
            <button class="delete-shortcut" data-id="${shortcut.id}" aria-label="Delete">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;
        grid.appendChild(a);
    });
}

// --- Todos Logic ---
let todoLists = [];
let currentListId = null;
let todos = [];

function initTodos() {
    todoLists = JSON.parse(localStorage.getItem('chromeStartLists'));
    if (!todoLists || todoLists.length === 0) {
        todoLists = [{ id: 'general', name: 'General' }];
        localStorage.setItem('chromeStartLists', JSON.stringify(todoLists));
    }
    currentListId = localStorage.getItem('chromeStartCurrentList') || todoLists[0].id;
    
    // Migrate old todos if they don't have listId
    let rawTodos = JSON.parse(localStorage.getItem('chromeStartTodos')) || [];
    todos = rawTodos.map(t => t.listId ? t : { ...t, listId: 'general' });
    saveTodos(todos);

    const scroller = document.getElementById('lists-scroller');
    const form = document.getElementById('todo-form');
    const input = document.getElementById('todo-input');
    const clearBtn = document.getElementById('clear-completed');
    
    // List UI Setup
    const addListBtn = document.getElementById('add-list-btn');
    const deleteListBtn = document.getElementById('delete-list-btn');
    const listModal = document.getElementById('list-modal');
    const saveListBtn = document.getElementById('save-list');
    const cancelListBtn = document.getElementById('cancel-list');
    const listNameInput = document.getElementById('list-name');

    function renderLists() {
        scroller.innerHTML = '';
        todoLists.forEach(list => {
            const tab = document.createElement('div');
            tab.className = `list-tab ${list.id === currentListId ? 'active' : ''}`;
            tab.textContent = list.name;
            
            tab.addEventListener('click', () => {
                currentListId = list.id;
                localStorage.setItem('chromeStartCurrentList', currentListId);
                renderLists();
            });
            scroller.appendChild(tab);
        });
        
        // Ensure currentListId exists
        if (!todoLists.find(l => l.id === currentListId) && todoLists.length > 0) {
            currentListId = todoLists[0].id;
            localStorage.setItem('chromeStartCurrentList', currentListId);
            renderLists();
        }
        deleteListBtn.style.display = todoLists.length > 1 ? 'flex' : 'none';
        renderTodos();
    }

    renderLists();

    addListBtn.addEventListener('click', () => {
        listModal.classList.remove('hidden');
        listNameInput.focus();
    });

    const closeListModal = () => {
        listModal.classList.add('hidden');
        listNameInput.value = '';
    };

    cancelListBtn.addEventListener('click', closeListModal);

    listModal.addEventListener('click', (e) => {
        if (e.target === listModal) closeListModal();
    });

    saveListBtn.addEventListener('click', () => {
        const name = listNameInput.value.trim();
        if (name) {
            const newList = { id: Date.now().toString(), name };
            todoLists.push(newList);
            localStorage.setItem('chromeStartLists', JSON.stringify(todoLists));
            currentListId = newList.id;
            localStorage.setItem('chromeStartCurrentList', currentListId);
            renderLists();
            closeListModal();
        }
    });

    deleteListBtn.addEventListener('click', () => {
        if (todoLists.length > 1) {
            // Remove todos for this list
            todos = todos.filter(t => t.listId !== currentListId);
            saveTodos(todos);
            
            // Remove list
            todoLists = todoLists.filter(l => l.id !== currentListId);
            localStorage.setItem('chromeStartLists', JSON.stringify(todoLists));
            currentListId = todoLists[0].id;
            localStorage.setItem('chromeStartCurrentList', currentListId);
            renderLists();
        }
    });

    // Todo Logic
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (text && currentListId) {
            todos.push({
                id: Date.now().toString(),
                listId: currentListId,
                text: text,
                completed: false
            });
            saveTodos(todos);
            renderTodos();
            input.value = '';
        }
    });

    document.getElementById('todo-list').addEventListener('click', (e) => {
        const list = e.target.closest('#todo-list');
        if (!list) return;

        if (e.target.classList.contains('todo-checkbox')) {
            const id = e.target.dataset.id;
            todos = todos.map(t => t.id === id ? { ...t, completed: e.target.checked } : t);
            saveTodos(todos);
            renderTodos();
        }

        const deleteBtn = e.target.closest('.todo-delete');
        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            todos = todos.filter(t => t.id !== id);
            saveTodos(todos);
            renderTodos();
        }
    });

    clearBtn.addEventListener('click', () => {
        // Only clear completed for current list
        todos = todos.filter(t => !(t.listId === currentListId && t.completed));
        saveTodos(todos);
        renderTodos();
    });
}

function saveTodos(newTodos) {
    todos = newTodos;
    localStorage.setItem('chromeStartTodos', JSON.stringify(todos));
}

function renderTodos() {
    const list = document.getElementById('todo-list');
    list.innerHTML = '';

    const currentTodos = todos.filter(t => t.listId === currentListId);

    currentTodos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <input type="checkbox" class="todo-checkbox" data-id="${todo.id}" ${todo.completed ? 'checked' : ''}>
            <span class="todo-text">${todo.text}</span>
            <button class="todo-delete" data-id="${todo.id}" aria-label="Delete todo">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        list.appendChild(li);
    });
}

// --- Background Logic ---
const localImages = ["1.jpg", "2.png", "3.jpg", "4.jpg", "5.jpg", "6.jpg", "7.jpg", "8.jpg", "9.jpg", "10.jpg", "11.jpg", "12.jpg", "13.jpg", "14.jpg", "15.jpg", "16.jpg", "17.jpg", "18.jpg", "19.jpg", "20.avif", "21.avif", "22.jpg", "23.jpg", "24.jpg", "25.jpg", "26.jpg", "27.jpg", "28.jpg"];

function initBackground() {
    const bgElement = document.querySelector('.background-image');
    const changeBtn = document.getElementById('change-bg-btn');
    
    // Load saved BG index or choose a random one to start
    let savedIndex = localStorage.getItem('chromeStartBgIndex');
    let currentImageIndex = savedIndex !== null ? parseInt(savedIndex) : Math.floor(Math.random() * localImages.length);
    
    function setBackground(index) {
        const imagePath = localImages[index];
        bgElement.style.backgroundImage = `url('${imagePath}')`;
        localStorage.setItem('chromeStartBgIndex', index);
        currentImageIndex = index;
    }
    
    // Apply initial background
    setBackground(currentImageIndex);

    if (changeBtn) {
        changeBtn.addEventListener('click', () => {
            // Pick the next image in sequence
            let nextIndex = (currentImageIndex + 1) % localImages.length;
            setBackground(nextIndex);
            
            // Highlight the active thumbnail if modal is open
            document.querySelectorAll('.bg-thumbnail').forEach((t, idx) => {
                if (idx === nextIndex) t.classList.add('active');
                else t.classList.remove('active');
            });
            
            // Add a simple pop animation to the button
            changeBtn.style.transform = 'scale(0.9)';
            setTimeout(() => changeBtn.style.transform = '', 150);
        });
    }

    const openBtn = document.getElementById('open-bg-modal-item');
    const closeBtn = document.getElementById('close-bg-modal-btn');
    const bgModal = document.getElementById('bg-selector-modal');
    const bgGrid = document.getElementById('bg-grid');
    const optionsMenu = document.getElementById('options-menu');

    if (openBtn && bgModal) {
        openBtn.addEventListener('click', () => {
            optionsMenu.classList.add('hidden');
            bgModal.classList.remove('hidden');
        });

        const closeBgModal = () => bgModal.classList.add('hidden');
        closeBtn.addEventListener('click', closeBgModal);
        bgModal.addEventListener('click', (e) => {
            if (e.target === bgModal) closeBgModal();
        });

        bgGrid.innerHTML = '';
        localImages.forEach((img, i) => {
            const thumb = document.createElement('div');
            thumb.className = `bg-thumbnail ${i === currentImageIndex ? 'active' : ''}`;
            thumb.style.backgroundImage = `url('${img}')`;
            
            thumb.addEventListener('click', () => {
                setBackground(i);
                document.querySelectorAll('.bg-thumbnail').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            });
            
            bgGrid.appendChild(thumb);
        });
    }
}

// --- Views & Notes Logic ---
function initViews() {
    const tasksBtn = document.getElementById('view-tasks-btn');
    const notesBtn = document.getElementById('view-notes-btn');
    const tasksView = document.getElementById('tasks-view');
    const notesView = document.getElementById('notes-view');
    const tasksControls = document.getElementById('tasks-header-controls');
    const textarea = document.getElementById('notes-textarea');
    
    const savedView = localStorage.getItem('chromeStartView') || 'tasks';
    
    const setView = (view) => {
        if (view === 'tasks') {
            tasksBtn.classList.add('active');
            notesBtn.classList.remove('active');
            tasksView.classList.remove('hidden-view');
            notesView.classList.add('hidden-view');
            tasksControls.style.display = 'flex';
        } else {
            notesBtn.classList.add('active');
            tasksBtn.classList.remove('active');
            notesView.classList.remove('hidden-view');
            tasksView.classList.add('hidden-view');
            tasksControls.style.display = 'none';
        }
        localStorage.setItem('chromeStartView', view);
    };

    tasksBtn.addEventListener('click', () => setView('tasks'));
    notesBtn.addEventListener('click', () => setView('notes'));
    
    setView(savedView);

    // Notes auto-save implementation
    textarea.value = localStorage.getItem('chromeStartNotes') || '';
    textarea.addEventListener('input', () => {
        localStorage.setItem('chromeStartNotes', textarea.value);
    });
}
