const STORAGE_KEY = "todo-tasks";

let tasks = loadTasks();
let currentFilter = "all";

const listEl = document.getElementById("task-list");
const formEl = document.getElementById("task-form");
const inputEl = document.getElementById("task-input");
const countEl = document.getElementById("count");
const emptyStateEl = document.getElementById("empty-state");
const clearCompletedBtn = document.getElementById("clear-completed");
const filterBtns = document.querySelectorAll(".filter-btn");

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  tasks.unshift({ id: uid(), text: trimmed, completed: false });
  saveTasks();
  render();
}

function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) task.completed = !task.completed;
  saveTasks();
  render();
}

function deleteTask(id) {
  const item = listEl.querySelector(`[data-id="${id}"]`);
  if (item) {
    item.style.transition = "opacity 0.15s ease, transform 0.15s ease";
    item.style.opacity = "0";
    item.style.transform = "translateX(8px)";
    setTimeout(() => {
      tasks = tasks.filter((t) => t.id !== id);
      saveTasks();
      render();
    }, 140);
  } else {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks();
    render();
  }
}

function editTask(id, newText) {
  const trimmed = newText.trim();
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  if (!trimmed) {
    deleteTask(id);
    return;
  }
  task.text = trimmed;
  saveTasks();
  render();
}

function clearCompleted() {
  tasks = tasks.filter((t) => !t.completed);
  saveTasks();
  render();
}

function setFilter(filter) {
  currentFilter = filter;
  filterBtns.forEach((btn) => {
    const isActive = btn.dataset.filter === filter;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", isActive);
  });
  render();
}

function getVisibleTasks() {
  if (currentFilter === "active") return tasks.filter((t) => !t.completed);
  if (currentFilter === "completed") return tasks.filter((t) => t.completed);
  return tasks;
}

function checkIconSVG() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
}

function editIconSVG() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"></path></svg>`;
}

function deleteIconSVG() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
}

function render() {
  const visible = getVisibleTasks();

  listEl.innerHTML = "";

  visible.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item" + (task.completed ? " completed" : "");
    li.dataset.id = task.id;

    li.innerHTML = `
      <button class="task-checkbox" aria-label="${task.completed ? "Mark as active" : "Mark as complete"}">
        ${checkIconSVG()}
      </button>
      <span class="task-text" tabindex="0" role="textbox" aria-label="Task text">${escapeHTML(task.text)}</span>
      <span class="task-actions">
        <button class="icon-btn edit" aria-label="Edit task">${editIconSVG()}</button>
        <button class="icon-btn delete" aria-label="Delete task">${deleteIconSVG()}</button>
      </span>
    `;

    const checkbox = li.querySelector(".task-checkbox");
    const textSpan = li.querySelector(".task-text");
    const editBtn = li.querySelector(".edit");
    const deleteBtn = li.querySelector(".delete");

    checkbox.addEventListener("click", () => toggleTask(task.id));
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    const startEdit = () => {
      textSpan.contentEditable = "true";
      textSpan.focus();
      document.execCommand("selectAll", false, null);
    };

    editBtn.addEventListener("click", startEdit);
    textSpan.addEventListener("dblclick", startEdit);

    textSpan.addEventListener("blur", () => {
      if (textSpan.contentEditable === "true") {
        textSpan.contentEditable = "false";
        editTask(task.id, textSpan.textContent);
      }
    });

    textSpan.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        textSpan.blur();
      }
      if (e.key === "Escape") {
        textSpan.textContent = task.text;
        textSpan.contentEditable = "false";
        textSpan.blur();
      }
    });

    listEl.appendChild(li);
  });

  emptyStateEl.classList.toggle("visible", visible.length === 0);
  if (visible.length === 0) {
    if (tasks.length === 0) {
      emptyStateEl.textContent = "Nothing here yet. Add your first task above.";
    } else if (currentFilter === "active") {
      emptyStateEl.textContent = "No active tasks. Nice work.";
    } else if (currentFilter === "completed") {
      emptyStateEl.textContent = "No completed tasks yet.";
    }
  }

  const activeCount = tasks.filter((t) => !t.completed).length;
  countEl.textContent = `${activeCount} task${activeCount === 1 ? "" : "s"}`;

  clearCompletedBtn.style.display = tasks.some((t) => t.completed) ? "inline-block" : "none";
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  addTask(inputEl.value);
  inputEl.value = "";
  inputEl.focus();
});

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => setFilter(btn.dataset.filter));
});

clearCompletedBtn.addEventListener("click", clearCompleted);

render();