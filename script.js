// 完全版 script.js（Todo管理＋最終ゴール期限カウントダウン）

document.addEventListener('DOMContentLoaded', () => {
    const todoForm = document.getElementById('todo-form');
    const todoNameInput = document.getElementById('todo-name-input');
    const addTagCheckboxes = document.querySelectorAll('#add-todo-section .tag-checkbox');
    const todoList = document.getElementById('todo-list');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const emptyState = document.getElementById('empty-state');

    // ゴール関連
    const setGoalBtn = document.getElementById('set-goal-btn');
    const goalModal = document.getElementById('goal-modal');
    const closeGoalModalBtn = goalModal.querySelector('.close-button');
    const goalInput = document.getElementById('goal-input');
    const goalDeadlineInput = document.getElementById('goal-deadline-input');
    const saveGoalBtn = document.getElementById('save-goal-btn');
    const currentGoalDisplay = document.getElementById('current-goal');

    let todos = [];
    let currentFilter = 'all';

    // --- ヘルパー関数 ---

    const loadFromLocalStorage = (key) => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    };

    const saveToLocalStorage = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    };

    const updateCountdown = (deadline) => {
        const now = new Date();
        const goalDate = new Date(deadline);
        const diffTime = goalDate - now;
        const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

        const daysLeftElement = document.getElementById('days-left');
        if (daysLeftElement) {
            daysLeftElement.textContent = diffDays;
        }
    };

    const loadGoal = () => {
        const storedGoal = loadFromLocalStorage('finalGoal');
        if (storedGoal) {
            currentGoalDisplay.innerHTML = `${storedGoal.text} <br> ⏳あと<span id="days-left"></span>日`;
            goalInput.value = storedGoal.text;
            goalDeadlineInput.value = storedGoal.deadline;
            updateCountdown(storedGoal.deadline);
        } else {
            currentGoalDisplay.textContent = 'まだゴールが設定されていません。';
            goalInput.value = '';
            goalDeadlineInput.value = '';
        }
    };

    const saveGoal = (goalText, deadline) => {
        const goalData = {
            text: goalText,
            deadline: deadline
        };
        saveToLocalStorage('finalGoal', goalData);
        loadGoal();
    };

    const handleSaveGoal = () => {
        const newGoal = goalInput.value.trim();
        const deadline = goalDeadlineInput.value;

        if (!newGoal) {
            alert('ゴールを入力してください。');
            return;
        }

        if (!deadline) {
            alert('期限を入力してください。');
            return;
        }

        saveGoal(newGoal, deadline);
        goalModal.style.display = 'none';
        alert('ゴールを保存しました！');
    };

    let overallLevelData = loadFromLocalStorage('overallLevelData') || { exp: 0, level: 1 };

function addOverallExp(amount) {
    let data = overallLevelData;
    data.exp += amount;
    if (data.exp >= data.level * 500) {
        data.exp = 0;
        data.level++;
        alert(`垢抜けレベルが上がったよ！ Lv.${data.level}`);
    }
    updateOverallLevelBar();
    saveToLocalStorage('overallLevelData', data);
}
// ダークモード切り替え
const themeToggle = document.getElementById('theme-toggle');

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');

    // ローカルストレージに保存（次回アクセスでも反映）
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode ? 'on' : 'off');
});

// ページロード時に前回の状態を復元
window.addEventListener('DOMContentLoaded', () => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'on') {
        document.body.classList.add('dark-mode');
    }
});


function updateOverallLevelBar() {
    const data = overallLevelData;
    const requiredExp = data.level * 500; // ここと合わせる！
    const percent = (data.exp / requiredExp) * 100;

    const bar = document.querySelector('#overall-level .bar-fill');
    const levelText = document.querySelector('#overall-level .level-text');

    bar.style.width = `${percent}%`;
    levelText.textContent = `Lv ${data.level}`;
}


    const renderTodos = () => {
        todoList.innerHTML = '';
        const displayTodos = todos.filter(todo => {
            if (currentFilter === 'all') return true;
            if (currentFilter === '未完了') return !todo.isCompleted;
            if (currentFilter === '完了') return todo.isCompleted;
            return todo.tags.includes(currentFilter);
        });

        if (displayTodos.length === 0) {
            emptyState.classList.add('active');
        } else {
            emptyState.classList.remove('active');
        }

        displayTodos.forEach(todo => {
            const li = document.createElement('li');
            li.dataset.id = todo.id;
            li.className = todo.isCompleted ? 'completed' : '';

            li.innerHTML = `
                <input type="checkbox" class="todo-checkbox" ${todo.isCompleted ? 'checked' : ''}>
                <span class="todo-name">${todo.name}</span>
                <div class="todo-tags">${todo.tags.map(tag => `<span>${tag}</span>`).join('')}</div>
                <button class="delete-btn">削除</button>
            `;

            todoList.appendChild(li);
        });

        saveToLocalStorage('todos', todos);
    };

    const addTodo = (todo) => {
        todos.unshift(todo);
        renderTodos();
    };

    const initializeApp = () => {
        todos = loadFromLocalStorage('todos') || [];
        loadGoal();
        renderTodos();
        updateOverallLevelBar();
    };

    // --- イベントリスナー ---

    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const todoName = todoNameInput.value.trim();
        if (!todoName) {
            alert('Todo名を入力してください。');
            return;
        }

        const selectedTags = Array.from(addTagCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        if (selectedTags.length === 0) {
            alert('少なくとも1つのタグを選択してください。');
            return;
        }

        const newTodo = {
            id: crypto.randomUUID(),
            name: todoName,
            tags: selectedTags,
            isCompleted: false,
            createdAt: new Date().toISOString()
        };

        addTodo(newTodo);
        todoForm.reset();

    });

    // チェック時の経験値処理
todoList.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;

    const todoId = li.dataset.id;
    const todo = todos.find(t => t.id === todoId);

    if (e.target.classList.contains('todo-checkbox')) {
        const wasCompleted = todo.isCompleted; // もともとの状態を記録
        todo.isCompleted = e.target.checked;

        if (!wasCompleted && todo.isCompleted) {
            addOverallExp(20); // チェック時に20exp追加（ここを好きな値に調整可）
        }

        saveToLocalStorage('todos', todos);
        renderTodos();
    }

    if (e.target.classList.contains('delete-btn')) {
        todos = todos.filter(t => t.id !== todoId);
        saveToLocalStorage('todos', todos);
        renderTodos();
    }
});

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = button.dataset.filter;
            renderTodos();
        });
    });

    // ゴール関連
    setGoalBtn.addEventListener('click', () => {
        goalModal.style.display = 'block';
    });

    closeGoalModalBtn.addEventListener('click', () => {
        goalModal.style.display = 'none';
    });

    saveGoalBtn.addEventListener('click', handleSaveGoal);

    window.addEventListener('click', (event) => {
        if (event.target == goalModal) {
            goalModal.style.display = 'none';
        }
    });

    setInterval(() => {
        const storedGoal = loadFromLocalStorage('finalGoal');
        if (storedGoal) {
            updateCountdown(storedGoal.deadline);
        }
    }, 1000 * 60 * 60);

    // --- 初期化 ---
    initializeApp();
});
