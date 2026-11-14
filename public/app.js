let token = null;
const $ = (id) => document.getElementById(id);

async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: 'Bearer ' + token }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.status === 204 ? null : await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

function show(msg) { $('msg').textContent = msg || ''; }

async function loadTasks() {
  const tasks = await api('GET', '/api/tasks');
  const list = $('list');
  list.replaceChildren();
  for (const t of tasks) {
    const li = document.createElement('li');
    li.className = t.done ? 'done' : '';
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = t.done;
    check.onchange = () => api('PATCH', '/api/tasks/' + t.id, { done: check.checked }).then(loadTasks).catch((e) => show(e.message));
    const span = document.createElement('span');
    span.textContent = `[P${t.priority}] ${t.title}`;
    const del = document.createElement('button');
    del.textContent = 'Eliminar';
    del.onclick = () => api('DELETE', '/api/tasks/' + t.id).then(loadTasks).catch((e) => show(e.message));
    li.append(check, span, del);
    list.append(li);
  }
}

$('authForm').onsubmit = async (e) => {
  e.preventDefault();
  try {
    const r = await api('POST', '/api/login', { username: $('username').value, password: $('password').value });
    token = r.token;
    $('auth').hidden = true;
    $('tasks').hidden = false;
    show('');
    await loadTasks();
  } catch (err) { show(err.message); }
};

$('registerBtn').onclick = async () => {
  try {
    await api('POST', '/api/register', { username: $('username').value, password: $('password').value });
    show('Usuario creado, ahora inicia sesión');
  } catch (err) { show(err.message); }
};

$('taskForm').onsubmit = async (e) => {
  e.preventDefault();
  try {
    await api('POST', '/api/tasks', { title: $('title').value, priority: Number($('priority').value) });
    $('title').value = '';
    show('');
    await loadTasks();
  } catch (err) { show(err.message); }
};

$('logoutBtn').onclick = async () => {
  await api('POST', '/api/logout').catch(() => {});
  token = null;
  $('tasks').hidden = true;
  $('auth').hidden = false;
};
