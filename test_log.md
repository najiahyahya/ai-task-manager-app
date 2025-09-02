# AI Task Manager Test Log

Perfect! Let’s stress-test your To-Do + Chat app with **varied inputs** covering all main features: adding multiple tasks, viewing, completing, deleting, updating, and conversational messages. I’ll also include tricky edge cases.

---

## **1️⃣ Add Tasks (single & multiple)**

| Test Text                                      | Expected Behavior                                                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `buy milk`                                     | Adds **one task**, AI reply: `"Added 'buy milk' to your list."` + task appears in both chat bubble and list. |
| `put buy eggs and feed cat`                    | Adds **two tasks**: `"buy eggs"` & `"feed cat"`; AI reply mentions both; both show ✅/◯ in chat + task list.  |
| `tambah cucian, basuh pinggan, and mop lantai` | Adds **three tasks** (Malay synonyms + separators).                                                          |
| `加入水和水果`                                       | Adds **two tasks** (Chinese).                                                                                |
| `add walk dog; play guitar`                    | Splits `;` and adds two tasks.                                                                               |

---

## **2️⃣ View Tasks**

| Test Text           | Expected Behavior                                            |
| ------------------- | ------------------------------------------------------------ |
| `show me my tasks`  | AI reply `"Here are your tasks:"` + inline task list bubble. |
| `lihat semua tugas` | Malay synonym of `view`; same behavior.                      |

---

## **3️⃣ Complete Tasks**

| Test Text                         | Expected Behavior                                                  |
| --------------------------------- | ------------------------------------------------------------------ |
| `mark 1 as done`                  | Completes **task #1**, updates UI ✅, AI reply confirms.            |
| `tandai tugas ke-2 sudah selesai` | Malay ordinal + complete; task 2 updated.                          |
| `完成第3个任务`                         | Chinese ordinal + complete; task 3 updated.                        |
| `done 99`                         | Nonexistent task; AI reply should warn, backend ignores, no crash. |

---

## **4️⃣ Delete Tasks**

| Test Text          | Expected Behavior                                   |
| ------------------ | --------------------------------------------------- |
| `delete 1`         | Deletes **task #1**, UI updates, AI reply confirms. |
| `hapus tugas ke-2` | Malay delete synonym, correct task removed.         |
| `remove 99`        | Nonexistent task; AI should warn.                   |

---

## **5️⃣ Update Tasks**

| Test Text                          | Expected Behavior                                          |
| ---------------------------------- | ---------------------------------------------------------- |
| `update 1 to buy almond milk`      | Changes task 1 description; UI updates, AI reply confirms. |
| `ubah tugas ke-2 menjadi feed dog` | Malay synonym; updates correctly.                          |
| `更改第3个任务为walk cat`                 | Chinese synonym; updates correctly.                        |
| `edit 99 to do nothing`            | Nonexistent task; AI warns, no crash.                      |

---

## **6️⃣ Multiple Actions in One Sentence**

| Test Text                                  | Expected Behavior                                                    |
| ------------------------------------------ | -------------------------------------------------------------------- |
| `add water plants and then mark 1 as done` | **Two actions**: add task & complete task 1; AI reply mentions both. |
| `tambah cucian, basuh pinggan; delete 2`   | **Add two tasks, delete task 2**; tasks update properly.             |

---

## **7️⃣ Conversational / Non-Task**

| Test Text             | Expected Behavior                                 |
| --------------------- | ------------------------------------------------- |
| `hello, how are you?` | AI returns friendly reply only; no tasks updated. |
| `tell me a joke`      | AI returns joke; no task update.                  |

---

## **8️⃣ Edge Cases / Fuzzy Inputs**

| Test Text                        | Expected Behavior                                                    |
| -------------------------------- | -------------------------------------------------------------------- |
| `put buy milk and feed cat then` | Should **ignore trailing `then`** and split correctly.               |
| `add`                            | AI should reply: `"I need a task description."` (optional handling). |
| `delete zero`                    | AI should handle invalid ordinal gracefully.                         |
| `update 1`                       | Missing description; AI should warn.                                 |
| `add walk dog, , play piano`     | Ignore empty task between commas.                                    |

---

