import json
import os

FILE_NAME = "tasks.json"


# Load tasks from file
def load_tasks():
    if not os.path.exists(FILE_NAME):
        return []

    try:
        with open(FILE_NAME, "r") as file:
            return json.load(file)
    except (json.JSONDecodeError, OSError):
        return []


# Save tasks to file
def save_tasks(tasks):
    with open(FILE_NAME, "w") as file:
        json.dump(tasks, file, indent=4)


# Add a new task
def add_task(tasks):
    task_name = input("\nEnter your task: ").strip()

    if not task_name:
        print("Task cannot be empty!")
        return

    task = {
        "name": task_name,
        "completed": False
    }

    tasks.append(task)
    save_tasks(tasks)

    print("Task added successfully!")


# Display all tasks
def view_tasks(tasks):
    print("\n========== YOUR TASKS ==========")

    if not tasks:
        print("You have no tasks yet.")
        return

    for index, task in enumerate(tasks, start=1):
        status = "DONE" if task["completed"] else "PENDING"
        print(f"{index}. {task['name']} [{status}]")


# Mark a task as completed
def complete_task(tasks):
    view_tasks(tasks)

    if not tasks:
        return

    try:
        number = int(input("\nEnter task number to complete: "))

        if 1 <= number <= len(tasks):
            tasks[number - 1]["completed"] = True
            save_tasks(tasks)
            print("Task marked as completed!")
        else:
            print("Invalid task number.")

    except ValueError:
        print("Please enter a valid number.")


# Delete a task
def delete_task(tasks):
    view_tasks(tasks)

    if not tasks:
        return

    try:
        number = int(input("\nEnter task number to delete: "))

        if 1 <= number <= len(tasks):
            removed = tasks.pop(number - 1)
            save_tasks(tasks)
            print(f"Deleted: {removed['name']}")
        else:
            print("Invalid task number.")

    except ValueError:
        print("Please enter a valid number.")


# Main application
def main():
    tasks = load_tasks()

    while True:
        print("\n==============================")
        print("       MY TO-DO LIST")
        print("==============================")
        print("1. Add Task")
        print("2. View Tasks")
        print("3. Complete Task")
        print("4. Delete Task")
        print("5. Exit")
        print("==============================")

        choice = input("Choose an option: ").strip()

        if choice == "1":
            add_task(tasks)

        elif choice == "2":
            view_tasks(tasks)

        elif choice == "3":
            complete_task(tasks)

        elif choice == "4":
            delete_task(tasks)

        elif choice == "5":
            print("\nYour tasks have been saved.")
            print("Goodbye!")
            break

        else:
            print("Invalid choice. Try again.")


if __name__ == "__main__":
    main()