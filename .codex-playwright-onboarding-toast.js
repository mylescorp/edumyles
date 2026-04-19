const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/admin/setup', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /^Save & Continue$/i }).click();
  await page.waitForTimeout(1200);
  const toasts = await page.locator('[data-sonner-toast], [role="status"], [role="alert"]').evaluateAll((els) => els.map((el) => ({ text: el.textContent, cls: el.className })));
  const text = await page.locator('body').innerText();
  console.log(JSON.stringify({ toasts, excerpt: text.slice(0, 2600) }, null, 2));
  await browser.close();
})();
