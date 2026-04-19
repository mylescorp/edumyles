const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const entries = [];
  page.on('response', async (resp) => {
    const url = resp.url();
    if (url.includes('/api/mutation') || url.includes('/api/query')) {
      let text = '';
      try { text = await resp.text(); } catch {}
      entries.push({ url, status: resp.status(), text: text.slice(0, 1200) });
    }
  });
  await page.goto('http://localhost:3000/admin/setup', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /^Save & Continue$/i }).click();
  await page.waitForTimeout(2500);
  console.log(JSON.stringify(entries.slice(-10), null, 2));
  await browser.close();
})();
