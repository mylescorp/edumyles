import { test, expect } from "@playwright/test";

async function authenticateAsSchoolAdmin(context: import("@playwright/test").BrowserContext) {
  const token = process.env.E2E_SESSION_TOKEN ?? "dev-tenant-admin-session";
  const tenantId = process.env.E2E_TENANT_ID ?? "TENANT-733447";
  const role = process.env.E2E_ROLE ?? "school_admin";

  await context.clearCookies();
  await context.addCookies([
    {
      name: "edumyles_session",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
    {
      name: "edumyles_role",
      value: role,
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
    {
      name: "edumyles_user",
      value: JSON.stringify({
        email: process.env.E2E_ADMIN_EMAIL ?? "demo-admin@edumyles.local",
        firstName: "School",
        lastName: "Admin",
        role,
        tenantId,
        sessionToken: token,
        activeTenantId: tenantId,
        accessibleTenantIds: [tenantId],
      }),
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
    {
      name: "edumyles_admin_workspace_mode",
      value: "admin",
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
    {
      name: "edumyles_dev_bootstrap",
      value: "full-access-v2",
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}

async function gotoAdminPage(page: import("@playwright/test").Page, pathname: string) {
  const response = await page.goto(pathname, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBeLessThan(500);
  await expect(page).toHaveURL(new RegExp(`${pathname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:[?#].*)?$`), {
    timeout: 20_000,
  });
  await expect(page.getByRole("main")).not.toBeEmpty({ timeout: 20_000 });
}

/**
 * Admin dashboard tests — uses the pre-authenticated state from auth.setup.ts.
 * These tests will be skipped / redirected to login if no E2E_SESSION_TOKEN is set.
 */
test.describe("Admin dashboard", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ context }) => {
    await authenticateAsSchoolAdmin(context);
  });

  test("dashboard loads the school admin command surface", async ({ page }) => {
    await gotoAdminPage(page, "/admin");

    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/active students/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("link", { name: "Enroll Student", exact: true })).toBeVisible({ timeout: 20_000 });
  });

  test("admin nav contains expected links", async ({ page }) => {
    await gotoAdminPage(page, "/admin");

    const nav = page.getByRole("navigation").first();
    await expect(nav).toBeVisible({ timeout: 20_000 });
    await expect(nav.getByRole("link", { name: /dashboard/i })).toBeVisible({ timeout: 20_000 });
    await expect(nav.getByText(/students/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(nav.getByText(/settings/i).first()).toBeVisible({ timeout: 20_000 });
  });

  test("students page renders a table or empty state", async ({ page }) => {
    await gotoAdminPage(page, "/admin/students");

    await expect(page.getByRole("heading", { name: /^students$/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: /enroll student/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/all students/i)).toBeVisible({ timeout: 20_000 });
  });

  test("finance page loads", async ({ page }) => {
    await gotoAdminPage(page, "/admin/finance");

    await expect(page.getByRole("heading", { name: /finance dashboard/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("link", { name: /manage invoices/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("link", { name: /fee structures/i })).toBeVisible({ timeout: 20_000 });
  });

  test("settings page loads", async ({ page }) => {
    await gotoAdminPage(page, "/admin/settings");

    await expect(page.getByRole("heading", { name: /^settings$/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("link", { name: "Billing", exact: true })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("link", { name: "Modules", exact: true })).toBeVisible({ timeout: 20_000 });
  });
});
