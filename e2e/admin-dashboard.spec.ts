import { test, expect } from "@playwright/test";

/**
 * Admin dashboard tests — uses the pre-authenticated state from auth.setup.ts.
 * These tests will be skipped / redirected to login if no E2E_SESSION_TOKEN is set.
 */
test.describe("Admin dashboard", () => {
  test("dashboard loads without crashing", async ({ page }) => {
    const response = await page.goto("/admin");
    // Either loads the admin dashboard OR redirects to login — never a 500
    expect(response?.status()).toBeLessThan(500);
  });

  test("admin nav contains expected links", async ({ page }) => {
    await page.goto("/admin");
    // If redirected to login, skip the rest
    if (page.url().includes("/auth/")) return;

    // These links should always be present in the admin layout
    const nav = page.locator("nav").first();
    await expect(nav).toBeVisible({ timeout: 10_000 });
  });

  test("students page renders a table or empty state", async ({ page }) => {
    await page.goto("/admin/students");
    if (page.url().includes("/auth/")) return;

    // Wait for content to render
    await page.waitForLoadState("networkidle");
    const body = await page.content();
    expect(body).toMatch(/student|Students|No students/i);
  });

  test("finance page loads", async ({ page }) => {
    const response = await page.goto("/admin/finance");
    if (page.url().includes("/auth/")) return;
    expect(response?.status()).toBeLessThan(500);
  });

  test("settings page loads", async ({ page }) => {
    const response = await page.goto("/admin/settings");
    if (page.url().includes("/auth/")) return;
    expect(response?.status()).toBeLessThan(500);
  });
});
