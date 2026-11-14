const express = require('express');
const path = require('node:path');
const crypto = require('node:crypto');
const { createDb } = require('./db');
const v = require('./validators');

const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const candidate = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(candidate, Buffer.from(hash, 'hex'));
}

function createApp({ dbFile } = {}) {
  const db = createDb(dbFile);
  const sessions = new Map(); // token -> userId
  const failedLogins = new Map(); // username -> { count, until }  (DEF-03)
  const app = express();

  // DEF-01: ocultar tecnologia y agregar cabeceras de seguridad
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set({
      'Content-Security-Policy': "default-src 'self'; frame-ancestors 'none'; form-action 'self'",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin',
      'Cache-Control': 'no-store',
    });
    next();
  });

  app.use(express.json({ limit: '10kb' }));
  app.use(express.static(path.join(__dirname, '..', 'public')));

  function auth(req, res, next) {
    const header = req.get('Authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    const userId = token && sessions.get(token);
    if (!userId) return res.status(401).json({ error: 'No autenticado' });
    req.userId = userId;
    next();
  }

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  app.post('/api/register', (req, res) => {
    const { username, password } = req.body || {};
    const error = v.validateUsername(username) || v.validatePassword(password);
    if (error) return res.status(400).json({ error });
    const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (exists) return res.status(409).json({ error: 'El usuario ya existe' });
    const info = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hashPassword(password));
    res.status(201).json({ id: Number(info.lastInsertRowid), username });
  });

  app.post('/api/login', (req, res) => {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Usuario y contrasena son obligatorios' });
    }
    const attempts = failedLogins.get(username);
    if (attempts && attempts.until > Date.now()) {
      return res.status(429).json({ error: 'Demasiados intentos fallidos, intente de nuevo en 15 minutos' });
    }
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || !verifyPassword(password, user.password_hash)) {
      const count = (attempts?.count || 0) + 1;
      failedLogins.set(username, { count: count >= MAX_ATTEMPTS ? 0 : count, until: count >= MAX_ATTEMPTS ? Date.now() + LOCK_MS : 0 });
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }
    failedLogins.delete(username);
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, user.id);
    res.json({ token });
  });

  app.post('/api/logout', auth, (req, res) => {
    sessions.delete(req.get('Authorization').slice(7));
    res.status(204).end();
  });

  app.get('/api/tasks', auth, (req, res) => {
    const tasks = db.prepare('SELECT id, title, priority, done, created_at FROM tasks WHERE user_id = ? ORDER BY priority DESC, id').all(req.userId);
    res.json(tasks.map((t) => ({ ...t, done: Boolean(t.done) })));
  });

  app.post('/api/tasks', auth, (req, res) => {
    const { title, priority = 3 } = req.body || {};
    const error = v.validateTitle(title) || v.validatePriority(priority);
    if (error) return res.status(400).json({ error });
    const info = db.prepare('INSERT INTO tasks (user_id, title, priority) VALUES (?, ?, ?)').run(req.userId, title.trim(), priority);
    res.status(201).json({ id: Number(info.lastInsertRowid), title: title.trim(), priority, done: false });
  });

  app.patch('/api/tasks/:id', auth, (req, res) => {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(Number(req.params.id), req.userId);
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });
    const { done } = req.body || {};
    if (typeof done !== 'boolean') return res.status(400).json({ error: 'El campo done debe ser booleano' });
    db.prepare('UPDATE tasks SET done = ? WHERE id = ?').run(done ? 1 : 0, task.id);
    res.json({ id: task.id, done });
  });

  app.delete('/api/tasks/:id', auth, (req, res) => {
    const info = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(Number(req.params.id), req.userId);
    if (info.changes === 0) return res.status(404).json({ error: 'Tarea no encontrada' });
    res.status(204).end();
  });

  // DEF-06: 404 propio para no usar el manejador por defecto (que reemplaza la CSP)
  app.use((req, res) => res.status(404).json({ error: 'Recurso no encontrado' }));

  // DEF-02: errores (ej. JSON malformado) sin exponer stack trace ni rutas internas
  app.use((err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).json({ error: status === 500 ? 'Error interno' : 'Solicitud invalida' });
  });

  return app;
}

module.exports = { createApp, hashPassword, verifyPassword };
