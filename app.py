from flask import Flask, jsonify, request, render_template
from pathlib import Path
import json
import uuid

app = Flask(__name__)

DATA_FILE = Path(__file__).parent / "tasks.json"


# Load tasks
def load_tasks():
    if not DATA_FILE.exists():
        return []

    try:
        with open(DATA_FILE, "r", encoding="utf-8") as file:
            tasks = json.load(file)

        if not isinstance(tasks, list):
            return []

        # Give older tasks IDs if they don't have them
        changed = False

        for task in tasks:
            if "id" not in task:
                task["id"] = str(uuid.uuid4())
                changed = True

            if "completed" not in task:
                task["completed"] = False
                changed = True

            if "name" not in task:
                task["name"] = "Untitled task"
                changed = True

        if changed:
            save_tasks(tasks)

        return tasks

    except (json.JSONDecodeError, OSError):
        return []


# Save tasks
def save_tasks(tasks):
    with open(DATA_FILE, "w", encoding="utf-8") as file:
        json.dump(tasks, file, indent=4)


# Homepage
@app.route("/")
def home():
    return render_template("index.html")


# Get all tasks
@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    tasks = load_tasks()
    return jsonify(tasks)


# Add a task
@app.route("/api/tasks", methods=["POST"])
def add_task():
    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    description = data.get("description", "").strip()

    if not name:
        return jsonify({"error": "Task name is required."}), 400

    tasks = load_tasks()

    task = {
        "id": str(uuid.uuid4()),
        "name": name,
        "description": description,
        "completed": False
    }

    tasks.append(task)
    save_tasks(tasks)

    return jsonify(task), 201


# Complete or update a task
@app.route("/api/tasks/<task_id>", methods=["PATCH"])
def update_task(task_id):
    data = request.get_json(silent=True) or {}
    tasks = load_tasks()

    for task in tasks:
        if task["id"] == task_id:
            if "completed" in data:
                if not isinstance(data["completed"], bool):
                    return jsonify({"error": "Completed must be true or false."}), 400

                task["completed"] = data["completed"]

            if "name" in data:
                name = data["name"].strip()

                if not name:
                    return jsonify({"error": "Task name cannot be empty."}), 400

                task["name"] = name

            if "description" in data:
                task["description"] = data["description"].strip()

            save_tasks(tasks)
            return jsonify(task)

    return jsonify({"error": "Task not found."}), 404


# Delete a task
@app.route("/api/tasks/<task_id>", methods=["DELETE"])
def delete_task(task_id):
    tasks = load_tasks()

    updated_tasks = [
        task for task in tasks if task["id"] != task_id
    ]

    if len(updated_tasks) == len(tasks):
        return jsonify({"error": "Task not found."}), 404

    save_tasks(updated_tasks)

    return jsonify({"message": "Task deleted successfully."})


# Dashboard statistics
@app.route("/api/stats", methods=["GET"])
def get_stats():
    tasks = load_tasks()

    total = len(tasks)
    completed = sum(1 for task in tasks if task["completed"])
    pending = total - completed

    return jsonify({
        "total": total,
        "completed": completed,
        "pending": pending
    })


if __name__ == "__main__":
    app.run(debug=True)