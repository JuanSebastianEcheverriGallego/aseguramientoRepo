// Captura del dashboard de SonarQube (uso: SONAR_PASS=... node tests/sonar-capturas.js <sufijo>)
const { chromium } = require('playwright-core');
const SONAR = 'http://localhost:9000';
const suf = process.argv[2] || 'v1';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.goto(`${SONAR}/sessions/new`);
  await page.fill('#login-input', 'admin');
  await page.fill('#password-input', process.env.SONAR_PASS);
  await page.keyboard.press('Enter');
  await page.waitForURL((u) => !u.pathname.includes('sessions'));
  await page.goto(`${SONAR}/dashboard?id=taskapp&codeScope=overall`);
  await page.waitForTimeout(6000);
  await page.getByRole('button', { name: 'Dismiss' }).click().catch(() => {});
  await page.screenshot({ path: `evidencias/sonar-dashboard-${suf}.png`, fullPage: true });
  await page.goto(`${SONAR}/project/issues?id=taskapp&resolved=false`);
  await page.waitForTimeout(6000);
  await page.screenshot({ path: `evidencias/sonar-issues-${suf}.png`, fullPage: true });
  await page.goto(`${SONAR}/security_hotspots?id=taskapp`);
  await page.waitForTimeout(6000);
  await page.screenshot({ path: `evidencias/sonar-hotspots-${suf}.png`, fullPage: true });
  await browser.close();
})();
