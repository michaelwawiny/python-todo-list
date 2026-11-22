from flask import Flask, jsonify, request, render_template
from pathlib import Path
from datetime import date
import json
import uuid

app = Flask(__name__)

DATA_FILE = Path(__file__).parent / "tasks.json"


def load_tasks():
    if not DATA_FILE.exists():
        return []

    try:
        with open(DATA_FILE, "r", encoding="utf-8") as file:
            tasks = json.load(file)

        if not isinstance(tasks, list):
            return []

        changed = False

        for task in tasks:
            if "id" not in task:
                task["id"] = str(uuid.uuid4())
                changed = True

            defaults = {
                "name": "Untitled task",
                "description": "",
                "completed": False,
                "priority": "medium",
                "deadline": ""
            }

            for key, value in defaults.items():
                if key not in task:
                    task[key] = value
                    changed = True

        if changed:
            save_tasks(tasks)

        return tasks

    except (json.JSONDecodeError, OSError):
        return []


def save_tasks(tasks):
    with open(DATA_FILE, "w", encoding="utf-8") as file:
        json.dump(tasks, file, indent=4)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    return jsonify(load_tasks())


@app.route("/api/tasks", methods=["POST"])
def add_task():
    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    description = data.get("description", "").strip()
    priority = data.get("priority", "medium")
    deadline = data.get("deadline", "")

    if not name:
        return jsonify({"error": "Task name is required."}), 400

    if priority not in ["low", "medium", "high"]:
        return jsonify({"error": "Invalid priority."}), 400

    task = {
        "id": str(uuid.uuid4()),
        "name": name,
        "description": description,
        "completed": False,
        "priority": priority,
        "deadline": deadline
    }

    tasks = load_tasks()
    tasks.append(task)
    save_tasks(tasks)

    return jsonify(task), 201


@app.route("/api/tasks/<task_id>", methods=["PATCH"])
def update_task(task_id):
    data = request.get_json(silent=True) or {}
    tasks = load_tasks()

    for task in tasks:
        if task["id"] == task_id:

            if "name" in data:
                name = data["name"].strip()

                if not name:
                    return jsonify({"error": "Task name cannot be empty."}), 400

                task["name"] = name

            if "description" in data:
                task["description"] = data["description"].strip()

            if "completed" in data:
                if not isinstance(data["completed"], bool):
                    return jsonify({"error": "Invalid completion status."}), 400

                task["completed"] = data["completed"]

            if "priority" in data:
                if data["priority"] not in ["low", "medium", "high"]:
                    return jsonify({"error": "Invalid priority."}), 400

                task["priority"] = data["priority"]

            if "deadline" in data:
                task["deadline"] = data["deadline"]

            save_tasks(tasks)
            return jsonify(task)

    return jsonify({"error": "Task not found."}), 404


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


@app.route("/api/stats", methods=["GET"])
def get_stats():
    tasks = load_tasks()

    total = len(tasks)
    completed = sum(1 for task in tasks if task["completed"])
    pending = total - completed

    overdue = sum(
        1 for task in tasks
        if task.get("deadline")
        and task["deadline"] < date.today().isoformat()
        and not task["completed"]
    )

    progress = round((completed / total) * 100) if total else 0

    return jsonify({
        "total": total,
        "completed": completed,
        "pending": pending,
        "overdue": overdue,
        "progress": progress
    })


if __name__ == "__main__":
    app.run(debug=True)