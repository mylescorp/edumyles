import { test, expect } from "@playwright/test";

/**
 * Visual regression tests using Playwright's built-in screenshot comparison.
 * On first run these create baseline snapshots in e2e/__snapshots__/.
 * Subsequent runs diff against the baseline and fail on pixel threshold breach.
 *
 * Run with:  npx playwright test --project=chromium e2e/visual-regression.spec.ts
 * Update:    npx playwright test --update-snapshots
 */

test.describe("Visual regression — public pages", () => {
  test("login page matches snapshot", async ({ page }) => {
    await page.goto("/auth/login");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("login.png", {
      maxDiffPixelRatio: 0.02, // allow up to 2% pixel difference
    });
  });

  test("maintenance page matches snapshot", async ({ page }) => {
    await page.goto("/maintenance");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("maintenance.png", {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe("Visual regression — portal pages", () => {
  test("student wallet page matches snapshot", async ({ page }) => {
    await page.goto("/portal/student/wallet");
    if (page.url().includes("/auth/")) {
      test.skip(); // skip if not authenticated
      return;
    }
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("student-wallet.png", {
      maxDiffPixelRatio: 0.03,
    });
  });
});
