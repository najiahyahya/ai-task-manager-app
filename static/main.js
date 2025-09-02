// static/main.js
// Full front-end: chat + tasks UI (inline edit, tick/untick, delete on clear, timestamps, sort, search)

const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");

const taskListEl = document.getElementById("task-list");
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const sortDropdown = document.getElementById("sortDropdown");
const searchInputId = "task-search-input";

// create search input next to sort dropdown (UI)
(function injectSearch() {
  const container = document.querySelector(".section-header .sort-container");
  if (container) {
    const input = document.createElement("input");
    input.id = searchInputId;
    input.placeholder = "Search tasks...";
    input.style.marginLeft = "0.5rem";
    input.style.padding = "0.35rem 0.5rem";
    input.style.borderRadius = "8px";
    input.style.border = "1px solid rgba(0,0,0,0.08)";
    container.appendChild(input);
  }
})();

let tasks = [];
let currentTaskView = []; 

// Utility: append chat message with type (ai/chat-task)
function appendMessage(sender, text, opts = {}) {
  const div = document.createElement("div");
  div.className = `msg ${sender}`;
  if (opts.taskUpdate) div.classList.add("task-update");
  div.textContent = text;
  const chatMessages = document.querySelector(".messages");
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendTasksInChat(tasks) {
  if (!tasks || tasks.length === 0) return;

  const div = document.createElement("div");
  div.className = "msg ai task-update";

  div.innerHTML = tasks.map((t, i) => {
    const status = t.completed ? "✅" : "◯";
    const ordinal = i + 1; // just for display
    return `${ordinal}. ${status} ${t.description}`;
  }).join("<br>");

  const chatMessages = document.querySelector(".messages");
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// API helpers
async function apiFetch(path, opts = {}) {
  const res = await fetch(path, opts);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || res.statusText);
  }
  return res.json();
}

async function loadTasks() {
  try {
    tasks = await apiFetch("/api/tasks");
    renderTasks();
  } catch (e) {
    appendMessage("ai", "⚠️ Failed to load tasks.");
    console.error(e);
  }
}

// Render tasks (apply search & sort)
function renderTasks() {
  const query = (document.getElementById(searchInputId)?.value || "").toLowerCase().trim();
  const sort = sortDropdown?.value || "newest";

  let toRender = [...tasks];

  // Filter
  if (query) {
    toRender = toRender.filter(t => (t.description || "").toLowerCase().includes(query));
  }

  // Sort
  toRender.sort((a, b) => {
    const aTime = new Date(a.created_at || a.timestamp || 0).getTime();
    const bTime = new Date(b.created_at || b.timestamp || 0).getTime();
    return sort === "newest" ? bTime - aTime : aTime - bTime;
  });

  currentTaskView = [...toRender];

  taskListEl.innerHTML = "";
  if (toRender.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "No tasks yet — add one at the bottom!";
    taskListEl.appendChild(li);
    return;
  }

  toRender.forEach((task, index) => {
    const li = document.createElement("li");
    li.dataset.id = task.id;
    li.className = task.completed ? "task-row completed" : "task-row";

    // Left: circle / toggle
    const left = document.createElement("div");
    left.className = "task-left";

    const circle = document.createElement("button");
    circle.className = "task-circle";
    circle.title = task.completed ? "Mark as not done" : "Mark as done";
    circle.textContent = task.completed ? "✅" : "◯"; // emoji icons
    circle.addEventListener("click", async (e) => {
      e.stopPropagation();
      try {
        const newStatus = !task.completed; // toggle

        // 1️⃣ Update backend
        await fetch(`/api/tasks/${task.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: task.description,
            completed: newStatus
          })
        });
        await loadTasks(); // refresh UI

        // 2️⃣ Ask AI to give friendly reply
        const actionText = newStatus
          ? `Mark task "${task.description}" as done`
          : `Mark task "${task.description}" as not done`;

        const { reply } = await interpretMessage(actionText);
        if (reply) appendMessage("ai", reply);

      } catch (err) {
        appendMessage("ai", `⚠️ ${err.message}`);
        console.error(err);
      }
    });

    left.appendChild(circle);

    // Middle: editable description
    const descWrap = document.createElement("div");
    descWrap.className = "task-middle";

    const desc = document.createElement("div");
    desc.className = "task-desc";
    if (task.completed) desc.classList.add("completed");
    desc.contentEditable = true;
    desc.spellcheck = false;
    desc.innerText = `${index + 1}. ${task.description}`;
    desc.setAttribute("data-id", task.id);

    // inline edit: Enter to save; if empty then delete
    desc.addEventListener("keydown", async (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        const newText = desc.innerText.trim();
        if (!newText) {
          // delete if empty
          try {
            await apiFetch(`/api/tasks/${task.id}`, { method: "DELETE" });
            await loadTasks();
            appendMessage("ai", `Deleted task ${task.id}.`);
          } catch (err) {
            appendMessage("ai", `⚠️ ${err.message}`);
          }
        } else if (newText !== task.description) {
          try {
            await apiFetch(`/api/tasks/${task.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ description: newText }),
            });
            await loadTasks();
            appendMessage("ai", `Updated task ${task.id}.`);
          } catch (err) {
            appendMessage("ai", `⚠️ ${err.message}`);
          }
        }
        desc.blur();
      }
    });

    // Blur: if changed, save
    desc.addEventListener("blur", async () => {
      const newText = desc.innerText.trim();
      if (newText && newText !== task.description) {
        try {
          await apiFetch(`/api/tasks/${task.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description: newText }),
          });
          await loadTasks();
        } catch (err) {
          appendMessage("ai", `⚠️ ${err.message}`);
        }
      }
    });

    descWrap.appendChild(desc);

    // Right: timestamp + delete
    const right = document.createElement("div");
    right.className = "task-right";

    const ts = document.createElement("div");
    ts.className = "task-date";
    const created = task.created_at || task.timestamp || "";
    const updated = task.updated_at || "";
    ts.textContent = updated ? `${new Date(updated).toLocaleString()}` : `${new Date(created).toLocaleString()}`;
    right.appendChild(ts);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "task-delete";
    deleteBtn.title = "Delete task";
    deleteBtn.textContent = "🗑️";
    deleteBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      try {
        await apiFetch(`/api/tasks/${task.id}`, { method: "DELETE" });
        await loadTasks();
        appendMessage("ai", `Deleted task ${task.id}.`);
      } catch (err) {
        appendMessage("ai", `⚠️ ${err.message}`);
      }
    });
    right.appendChild(deleteBtn);

    li.appendChild(left);
    li.appendChild(descWrap);
    li.appendChild(right);
    taskListEl.appendChild(li);
  });
}

// Task form (bottom)
taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = (taskInput.value || "").trim();
  if (!text) return;
  try {
    await apiFetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: text }),
    });
    taskInput.value = "";
    await loadTasks();
    appendMessage("ai", `Added: ${text}`, { taskUpdate: true });
  } catch (err) {
    appendMessage("ai", `⚠️ ${err.message}`);
  }
});

// AI interpretation
async function interpretMessage(message) {
  const res = await fetch("/api/ai/interpret", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  return res.json();
}

function getTaskIdFromOrdinal(n) {
  const index = n - 1; // 1-based
  if (index >= 0 && index < currentTaskView.length) {
    return currentTaskView[index].id;
  }
  return n; // fallback
}

// Chat submit
chatForm.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const text = (chatInput.value || "").trim();
  if (!text) return;

  appendMessage("user", text);
  chatInput.value = "";

  try {
    const result = await interpretMessage(text);
    let function_call = result.function_call || null;
    const reply = result.reply || "";

    // show reply; if function_call exists show task-update class
    appendMessage("ai", reply, { taskUpdate: Boolean(function_call) });

    // normalize function_call to an array (even if single object)
    let calls = [];
    if (function_call) {
      if (Array.isArray(function_call)) {
        calls = function_call;
      } else if (typeof function_call === "object") {
        calls = [function_call];
      }
    }

    // loop through each function call
    for (const fc of calls) {
      const fn = fc.function;
      const params = fc.parameters || {};

      if (fn === "addTask" && params.description) {
        await apiFetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: params.description }),
        });
        await loadTasks();

      } else if (fn === "viewTasks") {
        await loadTasks();
        appendTasksInChat(tasks);

      } else if (fn === "completeTask" && params.task_id) {
        try {
          const realId = getTaskIdFromOrdinal(params.task_id);
          await apiFetch(`/api/tasks/${realId}/complete`, { method: "POST" });
          await loadTasks();
        } catch (err) {
          appendMessage("ai", `⚠️ ${err.message}`);
        }

      } else if (fn === "deleteTask" && params.task_id) {
        try {
          const realId = getTaskIdFromOrdinal(params.task_id);
          await apiFetch(`/api/tasks/${realId}`, { method: "DELETE" });
          await loadTasks();
        } catch (err) {
          appendMessage("ai", `⚠️ ${err.message}`);
        }

      } else if (fn === "updateTask" && params.task_id && params.description) {
        try {
          const realId = getTaskIdFromOrdinal(params.task_id);
          await apiFetch(`/api/tasks/${realId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description: params.description }),
          });
          await loadTasks();
        } catch (err) {
          appendMessage("ai", `⚠️ ${err.message}`);
        }
      }
    }
  } catch (err) {
    appendMessage("ai", "⚠️ Error contacting AI.");
    console.error(err);
  }
});

// Search & sort listeners
document.getElementById(searchInputId)?.addEventListener("input", renderTasks);
sortDropdown?.addEventListener("change", renderTasks);

// Initial load
window.addEventListener("DOMContentLoaded", async () => {
  await loadTasks();
});