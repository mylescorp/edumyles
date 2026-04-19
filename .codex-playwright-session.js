const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/admin/setup', { waitUntil: 'networkidle' });
  const session = await page.evaluate(async () => {
    const res = await fetch('/api/auth/session');
    return await res.json();
  });
  const body = await page.locator('body').innerText();
  console.log(JSON.stringify({ session, excerpt: body.slice(0, 1600) }, null, 2));
  await browser.close();
})();
