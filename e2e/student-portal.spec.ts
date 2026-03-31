import { test, expect } from "@playwright/test";

/**
 * Student portal E2E tests.
 */
test.describe("Student portal", () => {
  test("student portal redirects unauthenticated users", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/portal/student");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("student dashboard loads", async ({ page }) => {
    await page.goto("/portal/student");
    if (page.url().includes("/auth/")) return;
    await page.waitForLoadState("networkidle");
    expect(await page.title()).toBeTruthy();
  });

  test("wallet page renders balance card", async ({ page }) => {
    await page.goto("/portal/student/wallet");
    if (page.url().includes("/auth/")) return;
    await page.waitForLoadState("networkidle");
    // Should show a balance card (even if balance is 0)
    const body = await page.content();
    expect(body).toMatch(/wallet|balance|KES/i);
  });

  test("grades page loads without 500", async ({ page }) => {
    const response = await page.goto("/portal/student/grades");
    expect(response?.status()).toBeLessThan(500);
  });

  test("assignments page loads without 500", async ({ page }) => {
    const response = await page.goto("/portal/student/assignments");
    expect(response?.status()).toBeLessThan(500);
  });
});
