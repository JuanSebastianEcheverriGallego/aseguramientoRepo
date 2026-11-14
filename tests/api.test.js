// Pruebas de INTEGRACION / SISTEMA sobre la API HTTP real (servidor levantado en puerto aleatorio)
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');

let server, base;

before(() => new Promise((resolve) => {
  server = createApp().listen(0, () => {
    base = `http://127.0.0.1:${server.address().port}`;
    resolve();
  });
}));
after(() => server.close());

async function call(method, path, body, token) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null, headers: res.headers };
}

async function login(username) {
  await call('POST', '/api/register', { username, password: 'Clave1234' });
  return (await call('POST', '/api/login', { username, password: 'Clave1234' })).body.token;
}

test('AT07 registro exitoso y usuario duplicado (RF01)', async () => {
  const r1 = await call('POST', '/api/register', { username: 'ana', password: 'Clave1234' });
  assert.equal(r1.status, 201);
  const r2 = await call('POST', '/api/register', { username: 'ana', password: 'Clave1234' });
  assert.equal(r2.status, 409);
});

test('AT08 login correcto devuelve token y login incorrecto 401 (RF02)', async () => {
  await call('POST', '/api/register', { username: 'beto', password: 'Clave1234' });
  const ok = await call('POST', '/api/login', { username: 'beto', password: 'Clave1234' });
  assert.equal(ok.status, 200);
  assert.match(ok.body.token, /^[a-f0-9]{64}$/);
  const bad = await call('POST', '/api/login', { username: 'beto', password: 'mala12345' });
  assert.equal(bad.status, 401);
});

test('AT09 CRUD completo de tareas (RF03-RF06)', async () => {
  const token = await login('carla');
  const created = await call('POST', '/api/tasks', { title: 'Estudiar QA', priority: 5 }, token);
  assert.equal(created.status, 201);
  const list = await call('GET', '/api/tasks', null, token);
  assert.equal(list.body.length, 1);
  const done = await call('PATCH', `/api/tasks/${created.body.id}`, { done: true }, token);
  assert.equal(done.body.done, true);
  const del = await call('DELETE', `/api/tasks/${created.body.id}`, null, token);
  assert.equal(del.status, 204);
  assert.equal((await call('GET', '/api/tasks', null, token)).body.length, 0);
});

test('AT10 endpoints protegidos rechazan peticiones sin token (RNF03)', async () => {
  assert.equal((await call('GET', '/api/tasks')).status, 401);
  assert.equal((await call('POST', '/api/tasks', { title: 'x' })).status, 401);
  assert.equal((await call('GET', '/api/tasks', null, 'token-falso')).status, 401);
});

test('AT11 un usuario no puede modificar tareas de otro (control de acceso)', async () => {
  const t1 = await login('dani');
  const t2 = await login('eva');
  const task = await call('POST', '/api/tasks', { title: 'Privada' }, t1);
  assert.equal((await call('DELETE', `/api/tasks/${task.body.id}`, null, t2)).status, 404);
  assert.equal((await call('PATCH', `/api/tasks/${task.body.id}`, { done: true }, t2)).status, 404);
});

test('AT12 validacion de entrada en API: prioridad fuera de rango y titulo vacio -> 400', async () => {
  const token = await login('fer');
  assert.equal((await call('POST', '/api/tasks', { title: 'x', priority: 6 }, token)).status, 400);
  assert.equal((await call('POST', '/api/tasks', { title: '', priority: 3 }, token)).status, 400);
});

test('AT13 inyeccion SQL en login no autentica', async () => {
  const r = await call('POST', '/api/login', { username: "' OR '1'='1", password: "' OR '1'='1" });
  assert.equal(r.status, 401);
});

test('AT14 cabeceras de seguridad presentes y sin X-Powered-By', async () => {
  const r = await call('GET', '/api/health');
  assert.equal(r.headers.get('x-powered-by'), null);
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.ok(r.headers.get('content-security-policy'));
});
