from __future__ import annotations
from flask import Flask, request, jsonify
from datetime import datetime, timezone
import itertools
import json
import os
from openai import OpenAI
from dotenv import load_dotenv

# Load environment
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# App
app = Flask(__name__, static_folder="static", static_url_path="")

# In-memory store (reset on restart)
_tasks: list[dict] = []
_id_gen = itertools.count(1)

# MASTER SYSTEM PROMPT (dual-mode, multilingual, fuzzy synonyms, ordinal detection)
MASTER_SYSTEM_PROMPT = """
You are an AI assistant for a To-Do List + Chat application.

Goals:
1) Decide whether the user's message is TASK-related (add/view/complete/delete/update)
   or a normal conversational message.

2) If TASK-related:
   - ALWAYS return a JSON object, even if multiple tasks.
   - If the user mentions multiple tasks in one sentence (separated by 'and', ',', ';' or 'then'):
       - Split them into separate tasks.
       - Return a list of function_call objects, one per task.
   - The JSON structure:
       {
         "function_call": [
            {"function": "<name>", "parameters": {...}},
            ...
         ],
         "reply": "<friendly confirmation mentioning all tasks>"
       }
     If only one task, function_call can still be a single object instead of a list.
   - Each task's function_call must be one of:
       - addTask      -> parameters: { "description": "<text>" }
       - viewTasks    -> parameters: {}
       - completeTask -> parameters: { "task_id": <int> }
       - deleteTask   -> parameters: { "task_id": <int> }
       - updateTask   -> parameters: { "task_id": <int>, "description": "<text>" }
   - The reply field must mention **all tasks added/updated/deleted** in normal language.
   - Be flexible to synonyms across languages. Examples:
       add: "add", "put", "tambah", "masukkan", "加入"
       view: "show", "view", "lihat", "paparkan", "展示"
       complete: "done", "complete", "siap", "sudah", "selesai", "完成"
       delete: "delete", "remove", "buang", "hapus", "删除"
       update: "edit", "ubah", "kemaskini", "更改"
   - Support ordinal/number references: "5th", "fifth", "task number 5", "ke-5", "lima" etc.
     For ordinal references, return task_id as the numeric index referenced (1-based).
   - If a referenced task number does not exist, still return function_call with that task_id
     (so the backend can check existence) and a human-friendly reply explaining the error.

3) If NOT task-related:
   - Return {"function_call": null, "reply": "<friendly chat reply in user's language>"}

Important formatting rule:
- ALWAYS return a **single JSON object**.
- function_call can be a **single object** or a **list of objects**.
- Do not include any extra text outside the JSON.
- Example for multiple tasks:
{
  "function_call": [
    {"function":"addTask", "parameters":{"description":"buy milk"}},
    {"function":"addTask", "parameters":{"description":"feed cat"}}
  ],
  "reply": "Added 'buy milk' and 'feed cat' to your list."
}
- Example for a single task:
{
  "function_call": {"function":"addTask", "parameters":{"description":"buy milk"}},
  "reply": "Added 'buy milk' to your list."
}

Always respond in the user's language for the 'reply' field.
"""

def interpret_message(user_message: str) -> dict:
    """
    Use OpenAI >=1.0.0 to classify/translate the user message and produce:
      { "function_call": {...} | [...] | null, "reply": "..." }
    """
    try:
        resp = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": MASTER_SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.3,
            max_tokens=600,
        )
        content = resp.choices[0].message.content.strip()
        data = json.loads(content)

        # Normalize: always return list for function_call if multiple
        fc = data.get("function_call")
        if isinstance(fc, dict):
            data["function_call"] = [fc]  # wrap single object in a list
        elif fc is None:
            data["function_call"] = []

        return data
    except Exception as e:
        # Safe fallback: conversational reply only
        return {"function_call": None, "reply": f"Sorry — I couldn't interpret that ({str(e)})"}

# --- CRUD endpoints with timestamps ---
def _now_iso():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()

@app.get("/")
def index():
    return app.send_static_file("index.html")

@app.get("/api/tasks")
def list_tasks():
    # Return tasks as-is
    return jsonify(sorted(_tasks, key=lambda t: t["id"]))

@app.post("/api/tasks")
def create_task():
    data = request.get_json(silent=True) or {}
    description = (data.get("description") or "").strip()
    if not description:
        return jsonify({"error": "Description required"}), 400
    now = _now_iso()
    task = {
        "id": next(_id_gen),
        "description": description,
        "completed": False,
        "created_at": now,
        "updated_at": now,
    }
    _tasks.append(task)
    return jsonify(task), 201

@app.put("/api/tasks/<int:task_id>")
def put_update_task(task_id: int):
    data = request.get_json(silent=True) or {}
    new_desc = (data.get("description") or "").strip()
    new_completed = data.get("completed")
    for t in _tasks:
        if t["id"] == task_id:
            if new_desc:
                t["description"] = new_desc
            if new_completed is not None:
                t["completed"] = bool(new_completed)
            t["updated_at"] = _now_iso()
            return jsonify(t), 200
    return jsonify({"error": "Task not found"}), 404

@app.post("/api/tasks/<int:task_id>/complete")
def post_complete_task(task_id: int):
    for t in _tasks:
        if t["id"] == task_id:
            t["completed"] = True
            t["updated_at"] = _now_iso()
            return jsonify(t), 200
    return jsonify({"error": "Task not found"}), 404

@app.delete("/api/tasks/<int:task_id>")
def delete_task(task_id: int):
    global _tasks
    before = len(_tasks)
    _tasks = [t for t in _tasks if t["id"] != task_id]
    if len(_tasks) < before:
        return jsonify({"status": "deleted"}), 200
    return jsonify({"error": "Task not found"}), 404

# AI interpret endpoint
@app.post("/api/ai/interpret")
def ai_interpret():
    data = request.get_json(silent=True) or {}
    message = data.get("message", "")
    result = interpret_message(message)
    return jsonify(result), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)