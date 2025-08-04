class TodoApp {
    constructor() {
        this.todos = this.loadTodos();
        this.init();
        this.aiSuggestions = []; 
        this.selectedAiSuggestions = new Set(); 
    }

    init() {
        this.bindEvents();
        this.render();
        this.updateStats();
        this.checkNotificationPermission();
        this.startReminderChecker();
        this.loadTheme(); 
    }

    bindEvents() {
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        document.getElementById('addBtn').addEventListener('click', () => {
            this.addTodo();
        });

        document.getElementById('todoInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTodo();
            }
        });

        document.getElementById('reminderToggle').addEventListener('click', () => {
            this.toggleReminder();
        });

        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearCompleted();
        });

        document.getElementById('aiGenerateBtn').addEventListener('click', () => {
            this.generateAiTasks();
        });

        document.getElementById('aiPrompt').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { 
                e.preventDefault(); 
                this.generateAiTasks();
            }
        });

        document.getElementById('addAllBtn').addEventListener('click', () => {
            this.addAllAiSuggestions();
        });

        document.getElementById('clearSuggestionsBtn').addEventListener('click', () => {
            this.clearAiSuggestions();
        });
    }

    addTodo(text = null) {
        const input = document.getElementById('todoInput');
        const timeInput = document.getElementById('timeInput');
        const reminderToggle = document.getElementById('reminderToggle');

        const todoText = text !== null ? text : input.value.trim();

        if (!todoText) {
            this.showNotification('Please enter a task!', 'error');
            return;
        }

        const todo = {
            id: Date.now(),
            text: todoText,
            completed: false,
            createdAt: new Date().toISOString(),
            reminder: reminderToggle.classList.contains('active') && text === null ? timeInput.value : null
        };

        this.todos.push(todo);
        this.saveTodos();
        this.render();
        this.updateStats();

        if (text === null) { 
            input.value = '';
            timeInput.value = '';
            reminderToggle.classList.remove('active');
            this.showNotification('Task added successfully!', 'success');
        } else {
        }
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.render();
            this.updateStats();
        }
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(t => t.id !== id);
        this.saveTodos();
        this.render();
        this.updateStats();
        this.showNotification('Task deleted!', 'success');
    }

    toggleTodoReminder(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            if (todo.reminder) {
                todo.reminder = null;
                this.showNotification('Reminder removed!', 'success');
            } else {
                const timeInput = document.getElementById('timeInput');
                if (!timeInput.value) {
                    this.showNotification('Please set a time first!', 'error');
                    return;
                }
                todo.reminder = timeInput.value;
                this.showNotification('Reminder set!', 'success');
            }
            this.saveTodos();
            this.render();
        }
    }

    clearCompleted() {
        const completedCount = this.todos.filter(t => t.completed).length;
        if (completedCount === 0) {
            this.showNotification('No completed tasks to clear!', 'error');
            return;
        }

        this.todos = this.todos.filter(t => !t.completed);
        this.saveTodos();
        this.render();
        this.updateStats();
        this.showNotification(`Cleared ${completedCount} completed tasks!`, 'success');
    }

    toggleReminder() {
        const reminderToggle = document.getElementById('reminderToggle');
        const timeInput = document.getElementById('timeInput');

        reminderToggle.classList.toggle('active');

        if (reminderToggle.classList.contains('active')) {
            const now = new Date();
            now.setHours(now.getHours() + 1); 
            timeInput.value = now.toISOString().slice(0, 16);
        } else {
            timeInput.value = ''; 
        }
    }

    toggleTheme() {
        const body = document.body;
        const themeIcon = document.getElementById('themeIcon');
        const themeText = document.getElementById('themeText');

        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        body.setAttribute('data-theme', newTheme);

        if (newTheme === 'dark') {
            themeIcon.textContent = '🌙';
            themeText.textContent = 'Dark Mode';
        } else {
            themeIcon.textContent = '☀️';
            themeText.textContent = 'Light Mode';
        }

        localStorage.setItem('theme', newTheme);
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.body.setAttribute('data-theme', savedTheme);

        const themeIcon = document.getElementById('themeIcon');
        const themeText = document.getElementById('themeText');
        if (savedTheme === 'light') {
            themeIcon.textContent = '☀️';
            themeText.textContent = 'Light Mode';
        } else {
            themeIcon.textContent = '🌙';
            themeText.textContent = 'Dark Mode';
        }
    }

    render() {
        const todoList = document.getElementById('todoList');

        if (this.todos.length === 0) {
            todoList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <div class="empty-text">No tasks yet</div>
                    <div class="empty-subtext">Add your first task to get started!</div>
                </div>
            `;
            return;
        }

        todoList.innerHTML = this.todos.map(todo => this.createTodoHTML(todo)).join('');

        this.todos.forEach(todo => {
            const todoElement = document.getElementById(`todo-${todo.id}`);
            if (todoElement) {
                const checkbox = todoElement.querySelector('.todo-checkbox');
                checkbox.addEventListener('click', () => this.toggleTodo(todo.id));

                const text = todoElement.querySelector('.todo-text');
                text.addEventListener('click', () => this.toggleTodo(todo.id));

                const deleteBtn = todoElement.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', () => this.deleteTodo(todo.id));

                const notificationBtn = todoElement.querySelector('.notification-btn');
                if (notificationBtn) {
                    notificationBtn.addEventListener('click', () => this.toggleTodoReminder(todo.id));
                }
            }
        });
    }

    createTodoHTML(todo) {
        const createdDate = new Date(todo.createdAt).toLocaleDateString();
        const reminderDate = todo.reminder ? new Date(todo.reminder).toLocaleString() : null;

        return `
            <li class="todo-item ${todo.completed ? 'completed' : ''}" id="todo-${todo.id}">
                <div class="todo-header">
                    <div class="todo-checkbox ${todo.completed ? 'checked' : ''}"></div>
                    <div class="todo-text">${this.escapeHtml(todo.text)}</div>
                    <div class="todo-actions">
                        <button class="action-btn notification-btn ${todo.reminder ? 'active' : ''}" title="${todo.reminder ? 'Remove reminder' : 'Set reminder'}">
                            🔔
                        </button>
                        <button class="action-btn delete-btn" title="Delete task">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="todo-meta">
                    <span>Created: ${createdDate}</span>
                    ${reminderDate ? `<div class="reminder-info">🔔 ${reminderDate}</div>` : ''}
                </div>
            </li>
        `;
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const pending = total - completed;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
        document.getElementById('taskCount').textContent = pending;
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notificationStatus');
        notification.textContent = message;
        notification.className = `notification-status ${type}`;
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    checkNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.showNotification('Notifications enabled! You\'ll get reminders for your tasks.', 'success');
                }
            });
        }
    }

    startReminderChecker() {
        setInterval(() => {
            this.checkReminders();
        }, 60000);

        this.checkReminders();
    }

    checkReminders() {
        const now = new Date();

        this.todos.forEach(todo => {
            if (todo.reminder && !todo.completed) {
                const reminderTime = new Date(todo.reminder);
                const timeDiff = reminderTime - now;

                if (timeDiff <= 0 && timeDiff > -60000) { 
                    this.showTaskReminder(todo);
                }
            }
        });
    }

    showTaskReminder(todo) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Task Reminder', {
                body: todo.text,
                icon: '✨',
                badge: '📝'
            });
        }

        this.showNotification(`Reminder: ${todo.text}`, 'success');
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    loadTodos() {
        const saved = localStorage.getItem('todos');
        return saved ? JSON.parse(saved) : [];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }


    setLoadingState(isLoading) {
        const aiGenerateBtn = document.getElementById('aiGenerateBtn');
        const aiBtnContent = aiGenerateBtn.querySelector('.ai-btn-content');
        const aiLoading = aiGenerateBtn.querySelector('.ai-loading');
        const aiPrompt = document.getElementById('aiPrompt');

        if (isLoading) {
            aiBtnContent.style.display = 'none';
            aiLoading.style.display = 'flex';
            aiGenerateBtn.disabled = true;
            aiPrompt.disabled = true;
        } else {
            aiBtnContent.style.display = 'flex';
            aiLoading.style.display = 'none';
            aiGenerateBtn.disabled = false;
            aiPrompt.disabled = false;
        }
    }

    async callAiAPI(prompt) {
   

        try {
            const response = await fetch('http://localhost:3000/api/generate-ai-tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userPrompt: prompt })
            });

            if (!response.ok) {
                let errorDetails = response.statusText;
                try {
                    const errorData = await response.json();
                    errorDetails = errorData.message || errorDetails;
                } catch (jsonError) {
                }
                throw new Error(`Backend error (${response.status}): ${errorDetails}`);
            }

            const data = await response.json();
            return data.tasks || []; 
        } catch (error) {
            console.error("Error calling AI API via backend:", error);
            throw new Error(error.message || "Could not connect to AI service. Please ensure your backend is running and accessible.");
        }
    }

    async generateAiTasks() {
        const prompt = document.getElementById('aiPrompt').value.trim();
        const aiSuggestionsDiv = document.getElementById('aiSuggestions');
        const suggestionsListDiv = document.getElementById('suggestionsList');

        if (!prompt) {
            this.showNotification('Please enter a prompt for the AI assistant!', 'error');
            return;
        }

        this.setLoadingState(true);
        aiSuggestionsDiv.style.display = 'none'; 
        suggestionsListDiv.innerHTML = ''; 
        this.aiSuggestions = []; 
        this.selectedAiSuggestions.clear(); 

        try {
            const generatedTasks = await this.callAiAPI(prompt);

            this.aiSuggestions = generatedTasks;

            if (this.aiSuggestions.length > 0) {
                aiSuggestionsDiv.style.display = 'block';
                this.aiSuggestions.forEach((suggestion, index) => {
                    const suggestionItem = document.createElement('div');
                    suggestionItem.classList.add('suggestion-item');
                    suggestionItem.dataset.index = index;

                    const checkbox = document.createElement('div');
                    checkbox.classList.add('suggestion-checkbox');
                    if (this.selectedAiSuggestions.has(index)) {
                        checkbox.classList.add('checked');
                        suggestionItem.classList.add('selected');
                    }
                    checkbox.addEventListener('click', () => this.toggleAiSuggestion(index, suggestionItem));

                    const text = document.createElement('div');
                    text.classList.add('suggestion-text');
                    text.textContent = this.escapeHtml(suggestion);
                    text.addEventListener('click', () => this.toggleAiSuggestion(index, suggestionItem));

                    suggestionItem.appendChild(checkbox);
                    suggestionItem.appendChild(text);
                    suggestionsListDiv.appendChild(suggestionItem);
                });
                this.showNotification('AI generated tasks. Review and add!', 'success');
            } else {
                this.showNotification('AI could not generate tasks for this prompt. Try another!', 'error');
                aiSuggestionsDiv.style.display = 'none';
            }

        } catch (error) {
            console.error('Error generating AI tasks:', error);
            this.showNotification(error.message || 'Failed to generate tasks. Please try again.', 'error');
            aiSuggestionsDiv.style.display = 'none'; 
        } finally {
            this.setLoadingState(false);
        }
    }

    toggleAiSuggestion(index, element) {
        if (this.selectedAiSuggestions.has(index)) {
            this.selectedAiSuggestions.delete(index);
            element.classList.remove('selected');
            element.querySelector('.suggestion-checkbox').classList.remove('checked');
        } else {
            this.selectedAiSuggestions.add(index);
            element.classList.add('selected');
            element.querySelector('.suggestion-checkbox').classList.add('checked');
        }
    }

    addAllAiSuggestions() {
        if (this.selectedAiSuggestions.size === 0) {
            this.showNotification('No suggested tasks selected to add!', 'error');
            return;
        }

        let addedCount = 0;
        Array.from(this.selectedAiSuggestions).sort((a,b) => a - b).forEach(index => {
            const taskText = this.aiSuggestions[index];
            if (taskText) {
                this.addTodo(taskText); 
                addedCount++;
            }
        });

        this.clearAiSuggestions(); 
        this.showNotification(`Added ${addedCount} tasks from AI suggestions!`, 'success');
    }

    clearAiSuggestions() {
        document.getElementById('aiSuggestions').style.display = 'none';
        document.getElementById('suggestionsList').innerHTML = '';
        document.getElementById('aiPrompt').value = '';
        this.aiSuggestions = [];
        this.selectedAiSuggestions.clear();
        this.showNotification('AI suggestions cleared!', 'success');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);

    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    if (themeIcon && themeText) {
        if (savedTheme === 'light') {
            themeIcon.textContent = '☀️';
            themeText.textContent = 'Light Mode';
        } else {
            themeIcon.textContent = '🌙';
            themeText.textContent = 'Dark Mode';
        }
    }
    new TodoApp(); 
});


document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const todoInput = document.getElementById('todoInput');
        if (document.activeElement === todoInput) {
            e.preventDefault(); 
            document.getElementById('addBtn').click();
        } else {
            const aiPrompt = document.getElementById('aiPrompt');
            if (document.activeElement === aiPrompt && !e.shiftKey) {
                e.preventDefault();
                document.getElementById('aiGenerateBtn').click();
            }
        }
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'Backspace') {
        document.getElementById('clearBtn').click();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const focusableElements = document.querySelectorAll('button, input, textarea, [tabindex]:not([tabindex="-1"])');

    focusableElements.forEach(element => {
        element.addEventListener('focus', (e) => {
            e.target.style.outline = '2px solid var(--accent)';
            e.target.style.outlineOffset = '2px';
        });

        element.addEventListener('blur', (e) => {
            e.target.style.outline = 'none';
        });
    });
});