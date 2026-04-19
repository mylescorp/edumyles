const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  const data = await page.evaluate(async () => {
    const admin = await fetch('/api/auth/session?workspace=admin', { credentials: 'same-origin', cache: 'no-store' }).then(async (r) => ({ status: r.status, body: await r.text() }));
    return { admin, cookie: document.cookie };
  });
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
