const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/admin/setup', { waitUntil: 'networkidle' });
  const studentsStep = page.getByRole('button', { name: /8\. Students/i }).first();
  if (await studentsStep.isVisible().catch(() => false)) await studentsStep.click();
  await page.waitForTimeout(400);
  const inputs = await page.locator('input').evaluateAll((els) => els.map((el) => ({ type: el.type, value: el.value, placeholder: el.getAttribute('placeholder') || '', outer: el.outerHTML.slice(0, 180) })));
  console.log(JSON.stringify(inputs, null, 2));
  await browser.close();
})();
