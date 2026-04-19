const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const logs = { console: [], errors: [] };
  page.on('console', msg => logs.console.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', err => logs.errors.push(String(err)));
  await page.goto('http://localhost:3000/admin/setup', { waitUntil: 'networkidle' });
  const body = await page.locator('body').innerText();
  console.log(JSON.stringify({ url: page.url(), excerpt: body.slice(0, 1600), console: logs.console.filter(x => x.type === 'error' || x.text.includes('CONVEX')), errors: logs.errors }, null, 2));
  await browser.close();
})();
