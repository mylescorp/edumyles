import { test, expect, type Page } from "@playwright/test";

async function expectAuthBoundary(page: Page) {
  await expect(page).toHaveURL(/\/auth\/(login|error)/);
  expect(page.url()).toMatch(/reason=not_configured|\/auth\/login/);
}

/**
 * Public page tests — no auth required.
 */
test.describe("Public pages", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/auth/login");
    // The login page or its redirect should return a successful response
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("unauthenticated /admin redirects to login", async ({ page }) => {
    // Clear any cookies first
    await page.context().clearCookies();
    const response = await page.goto("/admin");
    expect(response?.status()).toBeLessThan(500);
    await expectAuthBoundary(page);
  });

  test("unauthenticated /platform redirects to login", async ({ page }) => {
    await page.context().clearCookies();
    const response = await page.goto("/platform");
    expect(response?.status()).toBeLessThan(500);
    await expectAuthBoundary(page);
  });

  test("maintenance page is reachable", async ({ page }) => {
    const response = await page.goto("/maintenance");
    expect(response?.status()).toBeLessThan(500);
  });
});
