# AI-Powered Task Manager

A full-stack **To-Do List + AI Chat Assistant** built with **Flask**, **Vanilla JS**, **HTML/CSS**, and **OpenAI GPT**.  
This project combines traditional task management with natural language interaction, allowing tasks to be added, completed, updated, and deleted directly via chat.

---

## ✨ Features

### ✅ Task Management
- Add, view, update, complete, and delete tasks.
- Inline editing (press Enter or blur to save).
- Emoji indicators for completion state.
- Task sorting (newest/oldest) and keyword search.

### 🤖 AI Chat Assistant
- Understands natural language commands for tasks.
- Handles **ordinals** (“mark the 3rd task done”) and synonyms.
- Multi-language support with fuzzy matching.
- Friendly confirmations and robust error handling.

### 🎨 UI/UX
- Clean, modern, responsive single-page app.
- Split-panel layout: Tasks (left) and AI Chat (right).
- Accessibility: `aria-live` for task updates.
- Gradients, card styling, and soft shadows.

### 🛠 Tech Stack
- **Backend**: Flask (Python 3.11+)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **AI**: OpenAI GPT-3.5-turbo for interpretation
- **Styling**: CSS variables, responsive layout

---

## 🔌 API Endpoints

| Endpoint             | Method | URL                             | Request Body                                             | Response                                                                                                                |
| -------------------- | ------ | ------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Create Task          | POST   | `/api/tasks`                    | `{ "description": "<task text>" }`                       | `201 Created` `{ "id": int, "description": str, "completed": false, "created_at": str, "updated_at": str }`             |
| View All Tasks       | GET    | `/api/tasks`                    | —                                                        | `200 OK` `[ { "id": int, "description": str, "completed": bool, "created_at": str, "updated_at": str }, ... ]`          |
| Update Task          | PUT    | `/api/tasks/<task_id>`          | `{ "description": str, "completed": bool (optional) }`   | `200 OK` `{ updated task object }`                                                                                      |
| Complete Task        | POST   | `/api/tasks/<task_id>/complete` | —                                                        | `200 OK` `{ updated task object with completed=true }`                                                                  |
| Delete Task          | DELETE | `/api/tasks/<task_id>`          | —                                                        | `200 OK` `{ "status": "deleted" }`                                                                                      |
| AI Interpret Message | POST   | `/api/ai/interpret`             | `{ "message": "<user text>" }`                           | `200 OK` `{ "function_call": [...], "reply": "<AI response>" }`                                                         |

---

## 🚀 Installation

1. Clone the repo:
   ```bash
   git clone <repo-url>
   cd ai-task-manager
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create `.env` file:
   ```ini
   OPENAI_API_KEY=<your_openai_api_key>
   ```

4. Run the Flask server:
   ```bash
   python app.py
   ```

5. Open your browser at:  
   👉 http://localhost:5000

---

## 📂 Project Structure

```
.
├── app.py               # Flask backend + AI integration
├── static/
│   ├── main.js          # Frontend logic (tasks + chat)
│   ├── styles.css       # Responsive styling
├── index.html           # Single-page layout
├── requirements.txt     # Python dependencies
├── README.md            # Project documentation
├── design.md            # Architecture, diagrams & API flow
└── test_log.md          # Test cases & logs
```

---

## 🎯 Bonus Features

- AI can process **multiple tasks in one message**  
  (e.g., “Add buy milk and finish homework”).
- Handles errors gracefully with fallback replies.
- Modern creative UI (gradients, shadows, emojis).
- Multi-language prompts + ordinal support.  
- Current task list always synced between **UI** and **AI chat**.

---

## 🏆 Grading Criteria Coverage

- **Core Features**: CRUD + working AI integration.  
- **Design & Architecture**: See `design.md` (API flow, diagrams, mapping).  
- **UI/UX**: Responsive, accessible, creative.  
- **Bonus**: Multi-language, ordinals, error handling, extra polish.

---