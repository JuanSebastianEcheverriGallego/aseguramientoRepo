// Reglas de validacion de entrada (usadas por la API y probadas con particion de equivalencia / valores limite)

const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

function validateUsername(username) {
  if (typeof username !== 'string') return 'El usuario es obligatorio';
  if (username.length < 3 || username.length > 20) return 'El usuario debe tener entre 3 y 20 caracteres';
  if (!USERNAME_RE.test(username)) return 'El usuario solo admite letras, numeros y _';
  return null;
}

function validatePassword(password) {
  if (typeof password !== 'string') return 'La contrasena es obligatoria';
  if (password.length < 8 || password.length > 64) return 'La contrasena debe tener entre 8 y 64 caracteres';
  return null;
}

function validateTitle(title) {
  if (typeof title !== 'string' || title.trim().length === 0) return 'El titulo es obligatorio';
  if (title.length > 100) return 'El titulo no puede superar 100 caracteres';
  return null;
}

function validatePriority(priority) {
  if (!Number.isInteger(priority) || priority < 1 || priority > 5) return 'La prioridad debe ser un entero entre 1 y 5';
  return null;
}

module.exports = { validateUsername, validatePassword, validateTitle, validatePriority };
