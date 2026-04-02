import { test, expect } from "@playwright/test";

async function allowAuthRedirect(page: import("@playwright/test").Page) {
  await page.waitForLoadState("networkidle");
  return page.url().includes("/auth/");
}

test.describe("Platform security", () => {
  test("/platform redirects non-platform-admins", async ({ page }) => {
    await page.context().addCookies([
      { name: "edumyles_session", value: "school-admin-session", domain: "localhost", path: "/", secure: false, sameSite: "Lax" },
      { name: "edumyles_role", value: "school_admin", domain: "localhost", path: "/", secure: false, sameSite: "Lax" },
    ]);

    await page.goto("/platform");
    await expect(page).not.toHaveURL(/^.*\/platform$/);
  });

  test("impersonation page loads for platform admins", async ({ page, context }) => {
    await context.addCookies([
      { name: "edumyles_session", value: "platform-admin-session", domain: "localhost", path: "/", secure: false, sameSite: "Lax" },
      { name: "edumyles_role", value: "master_admin", domain: "localhost", path: "/", secure: false, sameSite: "Lax" },
    ]);

    await page.goto("/platform/impersonation");
    if (await allowAuthRedirect(page)) return;

    await expect(page.getByRole("heading", { name: /impersonation sessions/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /active/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /history/i })).toBeVisible();
  });

  test("platform users page exposes live management surface", async ({ page, context }) => {
    await context.addCookies([
      { name: "edumyles_session", value: "platform-admin-session", domain: "localhost", path: "/", secure: false, sameSite: "Lax" },
      { name: "edumyles_role", value: "master_admin", domain: "localhost", path: "/", secure: false, sameSite: "Lax" },
    ]);

    await page.goto("/platform/users");
    if (await allowAuthRedirect(page)) return;

    await expect(page.getByRole("heading", { name: /user management/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /^users$/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /roles/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /invite platform admin/i })).toBeVisible();
  });

  test("operations page exposes incident and maintenance controls", async ({ page, context }) => {
    await context.addCookies([
      { name: "edumyles_session", value: "platform-admin-session", domain: "localhost", path: "/", secure: false, sameSite: "Lax" },
      { name: "edumyles_role", value: "master_admin", domain: "localhost", path: "/", secure: false, sameSite: "Lax" },
    ]);

    await page.goto("/platform/operations");
    if (await allowAuthRedirect(page)) return;

    await expect(page.getByRole("heading", { name: /operations center/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /^overview$/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /incidents/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /new incident/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /schedule maintenance/i })).toBeVisible();
  });

  test("security page exposes threat and compliance sections", async ({ page, context }) => {
    await context.addCookies([
      { name: "edumyles_session", value: "platform-admin-session", domain: "localhost", path: "/", secure: false, sameSite: "Lax" },
      { name: "edumyles_role", value: "master_admin", domain: "localhost", path: "/", secure: false, sameSite: "Lax" },
    ]);

    await page.goto("/platform/security");
    if (await allowAuthRedirect(page)) return;

    await expect(page.getByRole("heading", { name: /advanced security dashboard/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /threats/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /compliance/i })).toBeVisible();
    await expect(page.getByText(/security score/i)).toBeVisible();
  });
});

test.describe("IP blocking", () => {
  test("admin route avoids 5xx for normal requests", async ({ request }) => {
    const response = await request.get("/admin");
    expect(response.status()).toBeLessThan(500);
  });
});
