const API_URL = "/api/tasks";

let tasks = [];
let currentFilter = "all";

// DOM elements
const taskList = document.getElementById("task-list");
const taskForm = document.getElementById("task-form");
const taskName = document.getElementById("task-name");
const taskDescription = document.getElementById("task-description");
const searchInput = document.getElementById("search-input");

const openFormButton = document.getElementById("open-form");
const cancelFormButton = document.getElementById("cancel-form");


// API request helper
async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
    }

    return data;
}


// Load tasks from Flask
async function loadTasks() {
    try {
        tasks = await apiRequest(API_URL);
        renderTasks();
        updateStatistics();
    } catch (error) {
        console.error(error);
        showMessage("Unable to load tasks. Check that Flask is running.");
    }
}


// Display tasks
function renderTasks() {
    const searchTerm = searchInput.value.toLowerCase().trim();

    let filteredTasks = tasks.filter(task => {
        const matchesSearch =
            task.name.toLowerCase().includes(searchTerm) ||
            (task.description || "").toLowerCase().includes(searchTerm);

        const matchesFilter =
            currentFilter === "all" ||
            (currentFilter === "completed" && task.completed) ||
            (currentFilter === "pending" && !task.completed);

        return matchesSearch && matchesFilter;
    });

    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✓</div>
                <h3>No tasks found</h3>
                <p>Try adding a task or changing your search.</p>
            </div>
        `;
        return;
    }

    taskList.innerHTML = filteredTasks.map(task => `
        <div class="task-card ${task.completed ? "completed" : ""}">

            <input
                type="checkbox"
                class="task-check"
                ${task.completed ? "checked" : ""}
                onchange="toggleTask('${task.id}', this.checked)"
                aria-label="Mark ${escapeHTML(task.name)} as completed"
            >

            <div class="task-info">
                <h3>${escapeHTML(task.name)}</h3>
                <p>${escapeHTML(task.description || "No description provided")}</p>
            </div>

            <span class="task-status">
                ${task.completed ? "Completed" : "Pending"}
            </span>

            <button
                class="delete-button"
                onclick="deleteTask('${task.id}')"
                aria-label="Delete task"
            >
                ×
            </button>

        </div>
    `).join("");
}


// Escape user content before displaying it as HTML
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}


// Update dashboard statistics
async function updateStatistics() {
    try {
        const stats = await apiRequest("/api/stats");

        document.getElementById("total-tasks").textContent = stats.total;
        document.getElementById("pending-tasks").textContent = stats.pending;
        document.getElementById("completed-tasks").textContent = stats.completed;
    } catch (error) {
        console.error("Statistics error:", error);
    }
}


// Add new task
taskForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const name = taskName.value.trim();
    const description = taskDescription.value.trim();

    if (!name) {
        alert("Please enter a task name.");
        return;
    }

    try {
        await apiRequest(API_URL, {
            method: "POST",
            body: JSON.stringify({
                name: name,
                description: description
            })
        });

        taskForm.reset();
        taskForm.classList.add("hidden");

        await loadTasks();

    } catch (error) {
        alert(error.message);
    }
});


// Complete or uncomplete a task
async function toggleTask(taskId, completed) {
    try {
        await apiRequest(`${API_URL}/${encodeURIComponent(taskId)}`, {
            method: "PATCH",
            body: JSON.stringify({
                completed: completed
            })
        });

        await loadTasks();

    } catch (error) {
        alert(error.message);
        await loadTasks();
    }
}


// Delete task
async function deleteTask(taskId) {
    const confirmed = confirm("Are you sure you want to delete this task?");

    if (!confirmed) return;

    try {
        await apiRequest(`${API_URL}/${encodeURIComponent(taskId)}`, {
            method: "DELETE"
        });

        await loadTasks();

    } catch (error) {
        alert(error.message);
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
document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", function(event) {
        event.preventDefault();

        currentFilter = this.dataset.filter;

        document.querySelectorAll(".nav-link").forEach(item => {
            item.classList.remove("active");
        });

        this.classList.add("active");

        document.querySelectorAll(".filter-button").forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.filter === currentFilter
            );
        });

        renderTasks();
    });
});


// Open task form
openFormButton.addEventListener("click", function() {
    taskForm.classList.remove("hidden");
    taskName.focus();
});


// Close task form
cancelFormButton.addEventListener("click", function() {
    taskForm.reset();
    taskForm.classList.add("hidden");
});


// Display an error message
function showMessage(message) {
    taskList.innerHTML = `
        <div class="empty-state">
            <h3>Something went wrong</h3>
            <p>${escapeHTML(message)}</p>
        </div>
    `;
}


// Start application
loadTasks();