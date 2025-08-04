class TodoApp {
    constructor() {
        this.todos = this.loadTodos();
        this.init();
    }

    init() {
        this.bindEvents();
        this.render();
        this.updateStats();
        this.checkNotificationPermission();
        this.startReminderChecker();
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
    }

    addTodo() {
        const input = document.getElementById('todoInput');
        const timeInput = document.getElementById('timeInput');
        const reminderToggle = document.getElementById('reminderToggle');
        
        const text = input.value.trim();
        if (!text) {
            this.showNotification('Please enter a task!', 'error');
            return;
        }

        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString(),
            reminder: reminderToggle.classList.contains('active') ? timeInput.value : null
        };

        this.todos.push(todo);
        this.saveTodos();
        this.render();
        this.updateStats();
        
        input.value = '';
        timeInput.value = '';
        reminderToggle.classList.remove('active');
        
        this.showNotification('Task added successfully!', 'success');
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
}

const savedTheme = localStorage.getItem('theme') || 'dark';
document.body.setAttribute('data-theme', savedTheme);

const themeIcon = document.getElementById('themeIcon');
const themeText = document.getElementById('themeText');
if (savedTheme === 'light') {
    themeIcon.textContent = '☀️';
    themeText.textContent = 'Light Mode';
}

document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        document.getElementById('addBtn').click();
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'Backspace') {
        document.getElementById('clearBtn').click();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const focusableElements = document.querySelectorAll('button, input, [tabindex]');
    
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