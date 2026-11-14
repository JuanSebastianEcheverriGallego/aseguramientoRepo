// Prueba E2E de interfaz + capturas de pantalla (Playwright usando el Microsoft Edge instalado)
// Uso: node tests/ui-evidencias.js   (requiere el servidor en http://localhost:3000)
const { chromium } = require('playwright-core');
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const OUT = process.env.OUT || 'evidencias';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  const user = 'ui' + Date.now().toString().slice(-6);

  await page.goto(BASE);
  await page.screenshot({ path: `${OUT}/ui-01-login.png` });

  await page.fill('#username', user);
  await page.fill('#password', 'corta');
  await page.click('#registerBtn');
  await page.waitForFunction(() => document.getElementById('msg').textContent !== '');
  await page.screenshot({ path: `${OUT}/ui-02-registro-clave-corta.png` });
  console.log('Registro clave corta ->', await page.textContent('#msg'));

  await page.fill('#password', 'Clave1234');
  await page.click('#registerBtn');
  await page.waitForFunction(() => document.getElementById('msg').textContent.includes('creado'));
  await page.click('#loginBtn');
  await page.waitForSelector('#tasks:not([hidden])');

  for (const [title, p] of [['Preparar informe QA', '5'], ['Revisar SonarQube', '4'], ['Comprar cafe', '1']]) {
    await page.fill('#title', title);
    await page.selectOption('#priority', p);
    await page.click('#addBtn');
    await page.waitForFunction((t) => document.getElementById('list').textContent.includes(t), title);
  }
  await page.locator('#list li').first().locator('input[type=checkbox]').check();
  await page.waitForSelector('#list li.done');
  await page.fill('#title', '<img src=x onerror=alert(1)>');
  await page.click('#addBtn');
  await page.waitForFunction(() => document.getElementById('list').textContent.includes('<img'));
  await page.screenshot({ path: `${OUT}/ui-03-tareas.png` });

  const items = await page.locator('#list li').count();
  console.log('Tareas en pantalla:', items, items === 4 ? 'OK' : 'FALLO');
  await browser.close();
  process.exit(items === 4 ? 0 : 1);
})();
