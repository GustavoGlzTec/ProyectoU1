const STORAGE_KEYS = {
  users: "taskflow-users",
  session: "taskflow-session",
  tasks: "taskflow-tasks",
  theme: "taskflow-theme"
};

const state = {
  authMode: "login",
  currentUser: null,
  editingTaskId: null,
  statusFilter: "all",
  search: ""
};

const el = {
  authSection: document.getElementById("authSection"),
  todoSection: document.getElementById("todoSection"),
  authTabs: document.querySelectorAll(".tab"),
  authForm: document.getElementById("authForm"),
  authSubmit: document.getElementById("authSubmit"),
  emailInput: document.getElementById("emailInput"),
  passwordInput: document.getElementById("passwordInput"),
  welcomeTitle: document.getElementById("welcomeTitle"),
  statsText: document.getElementById("statsText"),
  logoutBtn: document.getElementById("logoutBtn"),
  taskForm: document.getElementById("taskForm"),
  taskFormTitle: document.getElementById("taskFormTitle"),
  taskTitle: document.getElementById("taskTitle"),
  taskDescription: document.getElementById("taskDescription"),
  taskSubmit: document.getElementById("taskSubmit"),
  taskCancel: document.getElementById("taskCancel"),
  statusFilter: document.getElementById("statusFilter"),
  searchInput: document.getElementById("searchInput"),
  tasksList: document.getElementById("tasksList"),
  taskTemplate: document.getElementById("taskTemplate"),
  themeToggle: document.getElementById("themeToggle")
};

function readStorage(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getUsers() {
  return readStorage(STORAGE_KEYS.users, []);
}

function saveUsers(users) {
  writeStorage(STORAGE_KEYS.users, users);
}

function getTaskMap() {
  return readStorage(STORAGE_KEYS.tasks, {});
}

function saveTaskMap(map) {
  writeStorage(STORAGE_KEYS.tasks, map);
}

function getTasksForUser(userEmail) {
  const taskMap = getTaskMap();
  return taskMap[userEmail] || [];
}

function saveTasksForUser(userEmail, tasks) {
  const taskMap = getTaskMap();
  taskMap[userEmail] = tasks;
  saveTaskMap(taskMap);
}

function createTask(title, description) {
  return {
    id: crypto.randomUUID(),
    title,
    description,
    completed: false,
    createdAt: Date.now()
  };
}

function setTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  el.themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
  writeStorage(STORAGE_KEYS.theme, theme);
}

function initTheme() {
  const savedTheme = readStorage(STORAGE_KEYS.theme, "light");
  setTheme(savedTheme);
}

function setSession(user) {
  state.currentUser = user;
  writeStorage(STORAGE_KEYS.session, user ? { email: user.email } : null);
  renderAuthState();
  if (user) {
    renderTasks();
  }
}

function renderAuthState() {
  const isLoggedIn = Boolean(state.currentUser);
  el.authSection.classList.toggle("hidden", isLoggedIn);
  el.todoSection.classList.toggle("hidden", !isLoggedIn);

  if (isLoggedIn) {
    el.welcomeTitle.textContent = `Hola, ${state.currentUser.email}`;
  }
}

function resetTaskForm() {
  state.editingTaskId = null;
  el.taskForm.reset();
  el.taskFormTitle.textContent = "Agregar tarea";
  el.taskSubmit.textContent = "Guardar tarea";
  el.taskCancel.classList.add("hidden");
}

function getFilteredTasks(tasks) {
  const text = state.search.trim().toLowerCase();
  return tasks.filter((task) => {
    const statusMatch =
      state.statusFilter === "all" ||
      (state.statusFilter === "completed" && task.completed) ||
      (state.statusFilter === "pending" && !task.completed);

    const textMatch =
      !text ||
      task.title.toLowerCase().includes(text) ||
      task.description.toLowerCase().includes(text);

    return statusMatch && textMatch;
  });
}

function renderStats(tasks) {
  const completed = tasks.filter((task) => task.completed).length;
  const pending = tasks.length - completed;
  el.statsText.textContent = `${pending} pendientes · ${completed} completadas`;
}

function renderTasks() {
  if (!state.currentUser) return;

  const tasks = getTasksForUser(state.currentUser.email).sort((a, b) => b.createdAt - a.createdAt);
  const filteredTasks = getFilteredTasks(tasks);
  renderStats(tasks);

  el.tasksList.innerHTML = "";

  if (!filteredTasks.length) {
    const empty = document.createElement("div");
    empty.className = "card empty-state";
    empty.textContent = "No hay tareas para mostrar con ese filtro.";
    el.tasksList.append(empty);
    return;
  }

  filteredTasks.forEach((task) => {
    const fragment = el.taskTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".task-card");
    const check = fragment.querySelector(".task-check");
    const checkLabel = fragment.querySelector(".check-label");

    card.dataset.id = task.id;
    card.classList.toggle("done", task.completed);
    check.checked = task.completed;
    checkLabel.textContent = task.completed ? "Completada" : "Pendiente";

    fragment.querySelector(".task-title").textContent = task.title;
    fragment.querySelector(".task-description").textContent = task.description || "Sin descripción";

    check.addEventListener("change", () => toggleTaskStatus(task.id));
    fragment.querySelector(".edit-btn").addEventListener("click", () => startEditTask(task.id));
    fragment.querySelector(".delete-btn").addEventListener("click", () => deleteTask(task.id));

    el.tasksList.append(fragment);
  });
}

function handleAuthSubmit(event) {
  event.preventDefault();
  const email = el.emailInput.value.trim().toLowerCase();
  const password = el.passwordInput.value;

  if (!email || !password) return;

  const users = getUsers();
  const existing = users.find((user) => user.email === email);

  if (state.authMode === "register") {
    if (existing) {
      alert("Ese usuario ya existe.");
      return;
    }

    users.push({ email, password });
    saveUsers(users);
    setSession({ email });
    el.authForm.reset();
    return;
  }

  if (!existing || existing.password !== password) {
    alert("Credenciales inválidas.");
    return;
  }

  setSession({ email });
  el.authForm.reset();
}

function handleTaskSubmit(event) {
  event.preventDefault();

  if (!state.currentUser) return;

  const title = el.taskTitle.value.trim();
  const description = el.taskDescription.value.trim();

  if (!title) return;

  const tasks = getTasksForUser(state.currentUser.email);

  if (state.editingTaskId) {
    const updated = tasks.map((task) =>
      task.id === state.editingTaskId ? { ...task, title, description } : task
    );
    saveTasksForUser(state.currentUser.email, updated);
  } else {
    tasks.push(createTask(title, description));
    saveTasksForUser(state.currentUser.email, tasks);
  }

  resetTaskForm();
  renderTasks();
}

function startEditTask(taskId) {
  if (!state.currentUser) return;

  const tasks = getTasksForUser(state.currentUser.email);
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;

  state.editingTaskId = task.id;
  el.taskFormTitle.textContent = "Editar tarea";
  el.taskSubmit.textContent = "Actualizar tarea";
  el.taskCancel.classList.remove("hidden");
  el.taskTitle.value = task.title;
  el.taskDescription.value = task.description;
  el.taskTitle.focus();
}

function deleteTask(taskId) {
  if (!state.currentUser) return;

  const tasks = getTasksForUser(state.currentUser.email).filter((task) => task.id !== taskId);
  saveTasksForUser(state.currentUser.email, tasks);

  if (state.editingTaskId === taskId) {
    resetTaskForm();
  }

  renderTasks();
}

function toggleTaskStatus(taskId) {
  if (!state.currentUser) return;

  const tasks = getTasksForUser(state.currentUser.email).map((task) =>
    task.id === taskId ? { ...task, completed: !task.completed } : task
  );
  saveTasksForUser(state.currentUser.email, tasks);
  renderTasks();
}

function restoreSession() {
  const session = readStorage(STORAGE_KEYS.session, null);
  if (!session) return;

  const users = getUsers();
  const exists = users.some((user) => user.email === session.email);
  if (exists) {
    setSession({ email: session.email });
  }
}

function bindEvents() {
  el.authTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.authMode = tab.dataset.mode;
      el.authSubmit.textContent = state.authMode === "login" ? "Entrar" : "Crear cuenta";
      el.authTabs.forEach((node) => node.classList.toggle("active", node === tab));
    });
  });

  el.authForm.addEventListener("submit", handleAuthSubmit);
  el.taskForm.addEventListener("submit", handleTaskSubmit);

  el.logoutBtn.addEventListener("click", () => {
    resetTaskForm();
    setSession(null);
  });

  el.taskCancel.addEventListener("click", resetTaskForm);

  el.statusFilter.addEventListener("change", (event) => {
    state.statusFilter = event.target.value;
    renderTasks();
  });

  el.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderTasks();
  });

  el.themeToggle.addEventListener("click", () => {
    const next = document.body.classList.contains("dark") ? "light" : "dark";
    setTheme(next);
  });
}

initTheme();
bindEvents();
restoreSession();
renderAuthState();
