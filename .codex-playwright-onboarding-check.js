const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const logs = { console: [], errors: [] };
  page.on('console', msg => logs.console.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', err => logs.errors.push(String(err)));
  await page.goto('http://localhost:3000/admin/setup', { waitUntil: 'networkidle' });

  async function stepSnapshot(label) {
    const body = await page.locator('body').innerText();
    console.log(`--- ${label} ---`);
    console.log(body.slice(0, 1800));
  }

  await stepSnapshot('initial');

  // If still on staff step, fill it. Otherwise try to navigate there.
  const bodyText = await page.locator('body').innerText();
  if (!bodyText.includes('Invite your first staff members')) {
    const staffNav = page.getByText(/7\. Staff/i).first();
    if (await staffNav.isVisible().catch(() => false)) {
      await staffNav.click();
      await page.waitForTimeout(500);
    }
  }

  if (await page.getByLabel(/Full name/i).first().isVisible().catch(() => false)) {
    await page.getByLabel(/Full name/i).first().fill('Jane Teacher');
  }
  if (await page.getByLabel(/^Email$/i).first().isVisible().catch(() => false)) {
    await page.getByLabel(/^Email$/i).first().fill('jane.teacher+' + Date.now() + '@example.com');
  }
  if (await page.getByLabel(/Role/i).first().isVisible().catch(() => false)) {
    await page.getByLabel(/Role/i).first().selectOption('teacher').catch(async () => {
      const sel = page.locator('select').nth(0);
      if (await sel.isVisible()) await sel.selectOption({ index: 1 }).catch(() => {});
    });
  }
  if (await page.getByLabel(/Department/i).first().isVisible().catch(() => false)) {
    await page.getByLabel(/Department/i).first().fill('Academics');
  }

  const saveBtn = page.getByRole('button', { name: /save & continue/i }).first();
  if (await saveBtn.isVisible().catch(() => false)) {
    await saveBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);
  }
  await stepSnapshot('after staff');

  // Student step
  if (await page.getByLabel(/Student full name/i).first().isVisible().catch(() => false)) {
    await page.getByLabel(/Student full name/i).first().fill('John Learner');
  }
  if (await page.getByLabel(/Admission number/i).first().isVisible().catch(() => false)) {
    await page.getByLabel(/Admission number/i).first().fill('ADM-' + Date.now().toString().slice(-6));
  }
  if (await page.getByLabel(/Level/i).first().isVisible().catch(() => false)) {
    await page.getByLabel(/Level/i).first().fill('Form 1');
  }
  if (await page.getByLabel(/Guardian contact/i).first().isVisible().catch(() => false)) {
    await page.getByLabel(/Guardian contact/i).first().fill('+254700123456');
  }
  if (await saveBtn.isVisible().catch(() => false)) {
    await saveBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
  }
  await stepSnapshot('after students');

  console.log('CONSOLE', JSON.stringify(logs.console, null, 2));
  console.log('ERRORS', JSON.stringify(logs.errors, null, 2));

  await browser.close();
})();
