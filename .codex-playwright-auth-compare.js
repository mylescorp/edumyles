const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/admin/setup', { waitUntil: 'networkidle' });
  const data = await page.evaluate(async () => {
    const normal = await fetch('/api/auth/session', { credentials: 'same-origin', cache: 'no-store' }).then(r => r.json());
    const admin = await fetch('/api/auth/session?workspace=admin', { credentials: 'same-origin', cache: 'no-store' }).then(r => r.json());
    return { normal, admin, cookie: document.cookie };
  });
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
