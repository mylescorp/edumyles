import { test, expect } from "@playwright/test";

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
    // Should redirect to login (not 500 or crash)
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("unauthenticated /platform redirects to login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/platform");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("maintenance page is reachable", async ({ page }) => {
    const response = await page.goto("/maintenance");
    expect(response?.status()).toBeLessThan(500);
  });
});
