const API_URL = "/api/tasks";

let tasks = [];
let currentFilter = "all";
let editingTaskId = null;

// DOM elements
const taskForm = document.getElementById("task-form");
const taskDataForm = document.getElementById("task-data-form");

const taskNameInput = document.getElementById("task-name");
const taskDescriptionInput = document.getElementById("task-description");
const taskPriorityInput = document.getElementById("task-priority");
const taskDeadlineInput = document.getElementById("task-deadline");

const taskList = document.getElementById("task-list");
const searchInput = document.getElementById("search-input");


// Get today's date in YYYY-MM-DD format
function getLocalDateString() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// Check whether a task is overdue
function isOverdue(task) {
    return Boolean(
        task.deadline &&
        task.deadline < getLocalDateString() &&
        !task.completed
    );
}


// API request helper
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                "Content-Type": "application/json"
            },
            ...options
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Something went wrong.");
        }

        return data;

    } catch (error) {
        alert(error.message);
        throw error;
    }
}


// Load tasks from Flask
async function loadTasks() {
    try {
        tasks = await apiRequest(API_URL);

        renderTasks();
        updateStatistics();

    } catch (error) {
        console.error("Unable to load tasks:", error);
    }
}


// Escape HTML to prevent user-entered text from being interpreted as HTML
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


// Format deadline for display
function formatDeadline(deadline) {
    if (!deadline) return "";

    const date = new Date(`${deadline}T00:00:00`);

    return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}


// Render tasks
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
            <div class="task-card ${task.completed ? "completed" : ""}"
                 data-id="${escapeHTML(task.id)}">

                <div class="task-checkbox">
                    <input
                        type="checkbox"
                        ${task.completed ? "checked" : ""}
                        onchange="toggleTask('${escapeHTML(task.id)}', this.checked)"
                        aria-label="Mark ${escapeHTML(task.name)} as completed"
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

                        <span class="priority-badge priority-${escapeHTML(priority)}">
                            ${escapeHTML(priority.toUpperCase())} PRIORITY
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
                        onclick="editTask('${escapeHTML(task.id)}')"
                        title="Edit task"
                    >
                        ✎
                    </button>

                    <button
                        class="delete-button"
                        onclick="deleteTask('${escapeHTML(task.id)}')"
                        title="Delete task"
                    >
                        ×
                    </button>

                </div>

            </div>
        `;
    }).join("");
}


// Update dashboard statistics
async function updateStatistics() {
    try {
        const stats = await apiRequest("/api/stats");

        document.getElementById("total-tasks").textContent = stats.total;
        document.getElementById("pending-tasks").textContent = stats.pending;
        document.getElementById("completed-tasks").textContent = stats.completed;
        document.getElementById("overdue-tasks").textContent = stats.overdue;

        document.getElementById("progress-percentage").textContent =
            `${stats.progress}%`;

        document.getElementById("progress-bar").style.width =
            `${stats.progress}%`;

    } catch (error) {
        console.error("Unable to update statistics:", error);
    }
}


// Open task form
function openTaskForm() {
    editingTaskId = null;

    taskDataForm.reset();

    document.querySelector("#task-form h2").textContent = "Add New Task";

    taskForm.hidden = false;

    taskNameInput.focus();
}


// Close task form
function closeTaskForm() {
    taskForm.hidden = true;

    taskDataForm.reset();

    editingTaskId = null;
}


// Edit task
function editTask(taskId) {
    const task = tasks.find(item => item.id === taskId);

    if (!task) {
        alert("Task not found.");
        return;
    }

    editingTaskId = taskId;

    taskNameInput.value = task.name;
    taskDescriptionInput.value = task.description || "";
    taskPriorityInput.value = task.priority || "medium";
    taskDeadlineInput.value = task.deadline || "";

    document.querySelector("#task-form h2").textContent = "Edit Task";

    taskForm.hidden = false;

    taskNameInput.focus();
}


// Submit task form
taskDataForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const name = taskNameInput.value.trim();
    const description = taskDescriptionInput.value.trim();
    const priority = taskPriorityInput.value;
    const deadline = taskDeadlineInput.value;

    if (!name) {
        alert("Please enter a task name.");
        return;
    }

    const taskData = {
        name,
        description,
        priority,
        deadline
    };

    try {
        if (editingTaskId) {
            await apiRequest(`${API_URL}/${editingTaskId}`, {
                method: "PATCH",
                body: JSON.stringify(taskData)
            });

        } else {
            await apiRequest(API_URL, {
                method: "POST",
                body: JSON.stringify(taskData)
            });
        }

        closeTaskForm();

        await loadTasks();

    } catch (error) {
        console.error("Unable to save task:", error);
    }
});


// Complete or uncomplete task
async function toggleTask(taskId, completed) {
    try {
        await apiRequest(`${API_URL}/${taskId}`, {
            method: "PATCH",
            body: JSON.stringify({ completed })
        });

        await loadTasks();

    } catch (error) {
        console.error("Unable to update task:", error);
    }
}


// Delete task
async function deleteTask(taskId) {
    const confirmed = confirm("Are you sure you want to delete this task?");

    if (!confirmed) return;

    try {
        await apiRequest(`${API_URL}/${taskId}`, {
            method: "DELETE"
        });

        await loadTasks();

    } catch (error) {
        console.error("Unable to delete task:", error);
    }
}


// Search tasks
searchInput.addEventListener("input", renderTasks);


// Filter buttons
document.querySelectorAll(".filter-button").forEach(button => {
    button.addEventListener("click", function() {
        currentFilter = this.dataset.filter;

        document.querySelectorAll(".filter-button").forEach(item => {
            item.classList.remove("active");
        });

        this.classList.add("active");

        renderTasks();
    });
});


// Sidebar navigation
document.querySelectorAll("[data-filter]").forEach(link => {
    link.addEventListener("click", function(event) {
        event.preventDefault();

        currentFilter = this.dataset.filter;

        document.querySelectorAll(".filter-button").forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.filter === currentFilter
            );
        });

        renderTasks();
    });
});


// Open and close form buttons
document.getElementById("open-form").addEventListener("click", openTaskForm);

document.getElementById("close-form").addEventListener("click", closeTaskForm);


// Load application data
loadTasks();