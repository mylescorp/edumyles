const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const logs = { console: [], errors: [] };
  page.on('console', msg => logs.console.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', err => logs.errors.push(String(err)));
  await page.goto('http://localhost:3000/admin/setup', { waitUntil: 'networkidle' });

  async function body(label) {
    const text = await page.locator('body').innerText();
    console.log(`--- ${label} ---`);
    console.log(text.slice(0, 2200));
  }

  await body('initial');

  // Ensure we are on Students step if possible.
  const studentsStep = page.getByRole('button', { name: /8\. Students/i }).first();
  if (await studentsStep.isVisible().catch(() => false)) {
    await studentsStep.click();
    await page.waitForTimeout(500);
  }

  if (await page.getByLabel('Admission Number').first().isVisible().catch(() => false)) {
    await page.getByLabel('Admission Number').first().fill('ADM-' + Date.now().toString().slice(-6));
    await page.getByLabel('First Name').first().fill('John');
    await page.getByLabel('Last Name').first().fill('Learner');
    await page.getByLabel('Date of Birth').first().fill('2012-01-15');
    await page.getByLabel('Class Name').first().fill('Form 1 East');
    await page.getByLabel('Guardian Name').first().fill('Mary Learner');
    await page.getByLabel('Guardian Email').first().fill('mary.learner+' + Date.now() + '@example.com');
    await page.getByLabel('Guardian Phone').first().fill('+254700123456');
  }

  await page.getByRole('button', { name: /^Save & Continue$/i }).click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1800);
  await body('after students save');

  // If modules step is active, continue.
  const modulesBody = await page.locator('body').innerText();
  if (modulesBody.includes('Recommended modules are free during trial')) {
    await page.getByRole('button', { name: /^Save & Continue$/i }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);
    await body('after modules save');
  }

  const after = await page.locator('body').innerText();
  if (after.includes('Brand Name') || after.includes('Customize portal')) {
    const footer = page.getByLabel('Footer Text').first();
    if (await footer.isVisible().catch(() => false)) {
      await footer.fill('Powered by EduMyles for automated onboarding verification');
    }
    await page.getByRole('button', { name: /^Save & Continue$/i }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);
    await body('after portal save');
  }

  console.log('FINAL_URL', page.url());
  console.log('CONSOLE', JSON.stringify(logs.console.filter(x => x.type === 'error' || x.text.includes('CONVEX')), null, 2));
  console.log('ERRORS', JSON.stringify(logs.errors, null, 2));
  await browser.close();
})();
