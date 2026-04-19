const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const logs = { console: [], errors: [] };
  page.on('console', msg => logs.console.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', err => logs.errors.push(String(err)));
  await page.goto('http://localhost:3000/admin/setup', { waitUntil: 'networkidle' });
  const parentsStep = page.getByRole('button', { name: /11\. Parents/i }).first();
  if (await parentsStep.isVisible().catch(() => false)) {
    await parentsStep.click();
    await page.waitForTimeout(500);
  }
  await page.getByRole('button', { name: /^Save & Continue$/i }).click();
  await page.waitForTimeout(2000);
  const body = await page.locator('body').innerText();
  const toasts = await page.locator('[data-sonner-toast]').evaluateAll((els) => els.map((el) => el.textContent));
  console.log(JSON.stringify({ excerpt: body.slice(0, 1800), toasts, console: logs.console.filter(x => x.type === 'error' || x.text.includes('CONVEX')), errors: logs.errors }, null, 2));
  await browser.close();
})();
