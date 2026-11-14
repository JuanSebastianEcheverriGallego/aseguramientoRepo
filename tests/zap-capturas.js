// Capturas de los reportes HTML de OWASP ZAP (uso: node tests/zap-capturas.js)
const { chromium } = require('playwright-core');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
(async () => {
  const b = await chromium.launch({ channel: 'msedge' });
  const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
  for (const f of ['v1', 'final']) {
    await p.goto(pathToFileURL(path.resolve(`evidencias/zap-${f}.html`)).href);
    await p.waitForTimeout(800);
    await p.screenshot({ path: `evidencias/zap-${f}.png` });
  }
  await b.close();
})();
