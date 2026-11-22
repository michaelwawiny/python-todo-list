# TaskFlow – Python To-Do List

A simple and modern task management application built with Python, Flask, HTML, CSS, and JavaScript.

TaskFlow helps users organize daily activities, track deadlines, manage priorities, and monitor their productivity.

## Features

- Add new tasks.
- Edit existing tasks.
- Delete tasks.
- Mark tasks as completed.
- Set task priorities: Low, Medium, and High.
- Add task deadlines.
- Identify overdue tasks.
- Search tasks.
- Filter tasks by status.
- View task statistics.
- Track completion progress.
- Save tasks locally using JSON.

## Technologies Used

| Technology | Purpose |
|---|---|
| Python | Backend programming |
| Flask | Web framework |
| HTML5 | Application structure |
| CSS3 | Styling and layout |
| JavaScript | Frontend functionality |
| JSON | Local task storage |
| Git & GitHub | Version control |

## Project Structure

```text
todo-list/
│
├── app.py
├── main.py
├── requirements.txt
├── .gitignore
│
├── templates/
│   └── index.html
│
└── static/
    ├── style.css
    └── script.js
```

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/michaelwawiny/python-todo-list.git
```

### 2. Enter the project directory

```bash
cd python-todo-list
```

### 3. Create a virtual environment

```bash
python3 -m venv venv
```

### 4. Activate the environment

Linux/macOS:

```bash
source venv/bin/activate
```

### 5. Install dependencies

```bash
pip install -r requirements.txt
```

### 6. Run the application

```bash
python app.py
```

### 7. Open in your browser

```text
http://127.0.0.1:5000
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks` | Retrieve all tasks |
| POST | `/api/tasks` | Create a task |
| PATCH | `/api/tasks/<id>` | Update a task |
| DELETE | `/api/tasks/<id>` | Delete a task |
| GET | `/api/stats` | Retrieve task statistics |

## Data Storage

Tasks are stored locally in `tasks.json`.

The file is excluded from Git using `.gitignore` so personal task data is not uploaded to the repository.

## Future Improvements

- User authentication.
- PostgreSQL database integration.
- Cloud deployment.
- User-specific task management.
- Improved dashboard analytics.

## Author

**Michael Wawiny**

GitHub: [@michaelwawiny](https://github.com/michaelwawiny)

---

Built as part of my Python and web development learning journey.