import { test, expect, type Page } from "./fixtures/auth.fixture";

const requiresOnboardingE2E =
  process.env.REQUIRE_E2E_ONBOARDING === "true" ||
  Boolean(process.env.E2E_SESSION_TOKEN) ||
  process.env.E2E_SEED_DATA === "true";

async function field(page: Page, label: string) {
  return page
    .locator(".space-y-2")
    .filter({ has: page.locator("label", { hasText: label }) })
    .last();
}

async function fillField(page: Page, label: string, value: string) {
  await (await field(page, label)).locator("input, textarea").first().fill(value);
}

async function chooseFieldOption(page: Page, label: string, option: string | RegExp) {
  await (await field(page, label)).locator("button").first().click();
  await page.getByRole("option", { name: option }).click();
}

async function saveAndWaitForStep(page: Page, nextStep: string | RegExp) {
  await page.getByRole("button", { name: /save & continue/i }).click();
  await expect(page.getByRole("heading", { name: nextStep })).toBeVisible({ timeout: 20_000 });
}

async function skipAndWaitForStep(page: Page, nextStep: string | RegExp) {
  await page.getByRole("button", { name: /skip for now/i }).click();
  await expect(page.getByRole("heading", { name: nextStep })).toBeVisible({ timeout: 20_000 });
}

test.describe("tenant onboarding production journey", () => {
  test("completes setup through parent invitations without server errors", async ({ page }) => {
    test.skip(
      !requiresOnboardingE2E,
      "Set E2E_SEED_DATA=true or E2E_SESSION_TOKEN to run the tenant onboarding journey."
    );

    const stamp = Date.now();
    const admissionNumber = `E2E-${stamp}`;

    const response = await page.goto("/admin/setup");
    expect(response?.status()).toBeLessThan(500);
    await page.waitForLoadState("networkidle");
    expect(page.url()).not.toContain("/auth/");

    await expect(page.getByRole("heading", { name: /school profile/i })).toBeVisible({
      timeout: 20_000,
    });

    await chooseFieldOption(page, "School Type", /secondary/i);
    await chooseFieldOption(page, "Boarding Type", /^day$/i);
    await fillField(page, "Official Email", `onboarding-${stamp}@edumyles.test`);
    await fillField(page, "Phone", "+254712345678");
    await fillField(page, "County", "Nairobi");
    await saveAndWaitForStep(page, /academic year/i);

    await fillField(page, "Year Name", `E2E ${stamp}`);
    await fillField(page, "Start Date", "2026-01-05");
    await fillField(page, "End Date", "2026-11-20");
    await saveAndWaitForStep(page, /grading system/i);

    await fillField(page, "Pass Mark (%)", "50");
    await fillField(page, "Scale Label", "A-E");
    await saveAndWaitForStep(page, /^subjects$/i);

    await fillField(page, "Subject Name", "Mathematics");
    await fillField(page, "Code", `MATH-${stamp}`);
    await fillField(page, "Department", "STEM");
    await saveAndWaitForStep(page, /^classes$/i);

    await fillField(page, "Class Name", "Form 1 East");
    await fillField(page, "Level", "Form 1");
    await fillField(page, "Stream", "East");
    await fillField(page, "Capacity", "40");
    await fillField(page, "Academic Year", `E2E ${stamp}`);
    await saveAndWaitForStep(page, /fee structure/i);

    await fillField(page, "Fee Structure Name", "Term 1 Day Scholar");
    await fillField(page, "Amount (KES)", "25000");
    await fillField(page, "Academic Year", `E2E ${stamp}`);
    await fillField(page, "Grade / Level", "Form 1");
    await saveAndWaitForStep(page, /^staff$/i);

    await skipAndWaitForStep(page, /^students$/i);

    await fillField(page, "Admission Number", admissionNumber);
    await fillField(page, "First Name", "Amani");
    await fillField(page, "Last Name", "Otieno");
    await fillField(page, "Date of Birth", "2012-04-12");
    await fillField(page, "Class Name", "Form 1 East");
    await fillField(page, "Guardian Name", "Mary Otieno");
    await fillField(page, "Guardian Email", `guardian-${stamp}@edumyles.test`);
    await fillField(page, "Guardian Phone", "+254700000001");
    await saveAndWaitForStep(page, /^modules$/i);

    await saveAndWaitForStep(page, /customize portal/i);

    await fillField(page, "Brand Name", `E2E School ${stamp}`);
    await fillField(page, "Footer Text", "Powered by EduMyles");
    await saveAndWaitForStep(page, /^parents$/i);

    await skipAndWaitForStep(page, /first action/i);

    await expect(page.getByText(/first real attendance mark|create fee invoice/i)).toBeVisible();
    await page.goto("/admin/students");
    await expect(page.getByText(admissionNumber)).toBeVisible({ timeout: 20_000 });
  });
});
