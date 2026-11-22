// ==========================================
// TASKFLOW v1.0
// Browser-based task management application
// ==========================================

const STORAGE_KEY = "taskflow_tasks";

let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let currentFilter = "all";
let editingTaskId = null;


// ==========================================
// DOM ELEMENTS
// ==========================================

const taskForm = document.getElementById("task-form");
const taskDataForm = document.getElementById("task-data-form");

const taskNameInput = document.getElementById("task-name");
const taskDescriptionInput = document.getElementById("task-description");
const taskPriorityInput = document.getElementById("task-priority");
const taskDeadlineInput = document.getElementById("task-deadline");

const taskList = document.getElementById("task-list");
const searchInput = document.getElementById("search-input");


// ==========================================
// STORAGE
// ==========================================

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}


// ==========================================
// DATE FUNCTIONS
// ==========================================

function getLocalDateString() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function isOverdue(task) {
    return Boolean(
        task.deadline &&
        task.deadline < getLocalDateString() &&
        !task.completed
    );
}


function formatDeadline(deadline) {
    if (!deadline) return "";

    const date = new Date(`${deadline}T00:00:00`);

    return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}


// ==========================================
// SECURITY
// ==========================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[character];
    });
}


// ==========================================
// TASK STATISTICS
// ==========================================

function updateStatistics() {
    const total = tasks.length;

    const completed = tasks.filter(task => task.completed).length;

    const pending = total - completed;

    const overdue = tasks.filter(task => isOverdue(task)).length;

    const progress = total > 0
        ? Math.round((completed / total) * 100)
        : 0;

    document.getElementById("total-tasks").textContent = total;

    document.getElementById("pending-tasks").textContent = pending;

    document.getElementById("completed-tasks").textContent = completed;

    document.getElementById("overdue-tasks").textContent = overdue;

    document.getElementById("progress-percentage").textContent =
        `${progress}%`;

    document.getElementById("progress-bar").style.width =
        `${progress}%`;
}


// ==========================================
// RENDER TASKS
// ==========================================

function renderTasks() {
    const searchTerm = searchInput.value.toLowerCase().trim();

    let filteredTasks = tasks.filter(task => {

        const matchesSearch =
            task.name.toLowerCase().includes(searchTerm) ||
            (task.description || "").toLowerCase().includes(searchTerm);

        let matchesFilter = true;

        if (currentFilter === "pending") {
            matchesFilter = !task.completed;
        }

        if (currentFilter === "completed") {
            matchesFilter = task.completed;
        }

        return matchesSearch && matchesFilter;
    });


    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✓</div>
                <h3>No tasks found</h3>
                <p>Add a task or change your search and filters.</p>
            </div>
        `;

        return;
    }


    taskList.innerHTML = filteredTasks.map(task => {

        const priority = task.priority || "medium";

        const overdue = isOverdue(task);

        return `
            <div class="task-card ${task.completed ? "completed" : ""}">

                <div class="task-checkbox">
                    <input
                        type="checkbox"
                        ${task.completed ? "checked" : ""}
                        onchange="toggleTask('${task.id}', this.checked)"
                        aria-label="Complete task"
                    >
                </div>

                <div class="task-content">

                    <h3 class="task-title">
                        ${escapeHTML(task.name)}
                    </h3>

                    ${
                        task.description
                            ? `<p class="task-description">
                                ${escapeHTML(task.description)}
                               </p>`
                            : ""
                    }

                    <div class="task-meta">

                        <span class="priority-badge priority-${priority}">
                            ${priority.toUpperCase()} PRIORITY
                        </span>

                        ${
                            task.deadline
                                ? `<span class="deadline-badge ${overdue ? "deadline-overdue" : ""}">
                                    ${overdue ? "Overdue: " : "Due: "}
                                    ${formatDeadline(task.deadline)}
                                   </span>`
                                : ""
                        }

                    </div>

                </div>

                <div class="task-actions">

                    <button
                        class="edit-button"
                        onclick="editTask('${task.id}')"
                        title="Edit task"
                    >✎</button>

                    <button
                        class="delete-button"
                        onclick="deleteTask('${task.id}')"
                        title="Delete task"
                    >×</button>

                </div>

            </div>
        `;

    }).join("");
}


// ==========================================
// ADD TASK
// ==========================================

function addTask(taskData) {

    const task = {
        id: crypto.randomUUID(),
        name: taskData.name,
        description: taskData.description,
        priority: taskData.priority,
        deadline: taskData.deadline,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(task);

    saveTasks();

    refreshDashboard();
}


// ==========================================
// EDIT TASK
// ==========================================

function editTask(taskId) {

    const task = tasks.find(item => item.id === taskId);

    if (!task) return;

    editingTaskId = taskId;

    taskNameInput.value = task.name;

    taskDescriptionInput.value = task.description || "";

    taskPriorityInput.value = task.priority || "medium";

    taskDeadlineInput.value = task.deadline || "";

    document.querySelector(".form-heading h2").textContent =
        "Edit Task";

    taskForm.hidden = false;

    taskNameInput.focus();

    taskForm.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


// ==========================================
// UPDATE TASK
// ==========================================

function updateTask(taskData) {

    const task = tasks.find(item => item.id === editingTaskId);

    if (!task) return;

    task.name = taskData.name;

    task.description = taskData.description;

    task.priority = taskData.priority;

    task.deadline = taskData.deadline;

    saveTasks();

    refreshDashboard();
}


// ==========================================
// COMPLETE TASK
// ==========================================

function toggleTask(taskId, completed) {

    const task = tasks.find(item => item.id === taskId);

    if (!task) return;

    task.completed = completed;

    saveTasks();

    refreshDashboard();
}


// ==========================================
// DELETE TASK
// ==========================================

function deleteTask(taskId) {

    const confirmed = confirm(
        "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    tasks = tasks.filter(task => task.id !== taskId);

    saveTasks();

    refreshDashboard();
}


// ==========================================
// FORM MANAGEMENT
// ==========================================

function openTaskForm() {

    editingTaskId = null;

    taskDataForm.reset();

    document.querySelector(".form-heading h2").textContent =
        "Add New Task";

    taskForm.hidden = false;

    taskNameInput.focus();
}


function closeTaskForm() {

    taskForm.hidden = true;

    taskDataForm.reset();

    editingTaskId = null;

    document.querySelector(".form-heading h2").textContent =
        "Add New Task";
}


// ==========================================
// FORM SUBMISSION
// ==========================================

taskDataForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const taskData = {
        name: taskNameInput.value.trim(),
        description: taskDescriptionInput.value.trim(),
        priority: taskPriorityInput.value,
        deadline: taskDeadlineInput.value
    };

    if (!taskData.name) {
        alert("Please enter a task name.");
        return;
    }

    if (editingTaskId) {
        updateTask(taskData);
    } else {
        addTask(taskData);
    }

    closeTaskForm();

});


// ==========================================
// SEARCH
// ==========================================

searchInput.addEventListener("input", renderTasks);


// ==========================================
// FILTERS
// ==========================================

function setFilter(filter) {

    currentFilter = filter;

    document.querySelectorAll(".filter-button").forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.filter === filter
        );

    });

    document.querySelectorAll(".nav-item").forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.filter === filter
        );

    });

    renderTasks();
}


document.querySelectorAll(".filter-button").forEach(button => {

    button.addEventListener("click", function() {

        setFilter(this.dataset.filter);

    });

});


document.querySelectorAll(".nav-item").forEach(button => {

    button.addEventListener("click", function() {

        setFilter(this.dataset.filter);

    });

});


// ==========================================
// BUTTON EVENTS
// ==========================================

document.getElementById("open-form").addEventListener(
    "click",
    openTaskForm
);

document.getElementById("close-form").addEventListener(
    "click",
    closeTaskForm
);

document.getElementById("cancel-form").addEventListener(
    "click",
    closeTaskForm
);


// ==========================================
// REFRESH DASHBOARD
// ==========================================

function refreshDashboard() {

    renderTasks();

    updateStatistics();

}


// ==========================================
// INITIALIZE APPLICATION
// ==========================================

refreshDashboard();