// Pruebas UNITARIAS - particion de equivalencia y valores limite
const { test } = require('node:test');
const assert = require('node:assert/strict');
const v = require('../src/validators');
const { hashPassword, verifyPassword } = require('../src/app');

test('AT01 usuario - valores limite de longitud (2,3,20,21)', () => {
  assert.ok(v.validateUsername('ab'));            // 2 -> invalido
  assert.equal(v.validateUsername('abc'), null);  // 3 -> valido (limite inferior)
  assert.equal(v.validateUsername('a'.repeat(20)), null); // 20 -> valido (limite superior)
  assert.ok(v.validateUsername('a'.repeat(21)));  // 21 -> invalido
});

test('AT02 usuario - particiones de equivalencia (validos, caracteres especiales, tipo)', () => {
  assert.equal(v.validateUsername('juan_01'), null); // clase valida
  assert.ok(v.validateUsername('juan perez'));       // clase invalida: espacio
  assert.ok(v.validateUsername('juan<script>'));     // clase invalida: simbolos
  assert.ok(v.validateUsername(undefined));          // clase invalida: ausente
  assert.ok(v.validateUsername(12345));              // clase invalida: tipo
});

test('AT03 contrasena - valores limite (7,8,64,65)', () => {
  assert.ok(v.validatePassword('a'.repeat(7)));
  assert.equal(v.validatePassword('a'.repeat(8)), null);
  assert.equal(v.validatePassword('a'.repeat(64)), null);
  assert.ok(v.validatePassword('a'.repeat(65)));
});

test('AT04 titulo - limites (0, espacios, 1, 100, 101)', () => {
  assert.ok(v.validateTitle(''));
  assert.ok(v.validateTitle('   '));
  assert.equal(v.validateTitle('x'), null);
  assert.equal(v.validateTitle('x'.repeat(100)), null);
  assert.ok(v.validateTitle('x'.repeat(101)));
});

test('AT05 prioridad - limites (0,1,5,6) y clases invalidas (decimal, texto)', () => {
  assert.ok(v.validatePriority(0));
  assert.equal(v.validatePriority(1), null);
  assert.equal(v.validatePriority(5), null);
  assert.ok(v.validatePriority(6));
  assert.ok(v.validatePriority(2.5));
  assert.ok(v.validatePriority('3'));
});

test('AT06 contrasenas se almacenan con hash y sal (RNF02)', () => {
  const h1 = hashPassword('Secreta123');
  const h2 = hashPassword('Secreta123');
  assert.notEqual(h1, h2);                 // sal distinta
  assert.ok(!h1.includes('Secreta123'));   // no texto plano
  assert.ok(verifyPassword('Secreta123', h1));
  assert.ok(!verifyPassword('Otra12345', h1));
});
