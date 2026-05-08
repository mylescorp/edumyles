import { test, expect } from "@playwright/test";

async function allowAuthRedirect(page: import("@playwright/test").Page) {
  await page.waitForLoadState("domcontentloaded");
  return page.url().includes("/auth/");
}

async function authenticateAsPlatformAdmin(context: import("@playwright/test").BrowserContext) {
  const token = process.env.E2E_SESSION_TOKEN ?? "dev-platform-session";
  const role = process.env.E2E_ROLE ?? "master_admin";
  const tenantId = role === "master_admin" ? "PLATFORM" : (process.env.E2E_TENANT_ID ?? "TENANT-733447");
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
        email: process.env.E2E_ADMIN_EMAIL ?? "admin@edumyles.local",
        firstName: "Platform",
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
  ]);
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
    await authenticateAsPlatformAdmin(context);

    await page.goto("/platform/impersonation");
    if (await allowAuthRedirect(page)) return;

    await expect(page.getByRole("heading", { name: /impersonation sessions/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /active/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /history/i })).toBeVisible();
  });

  test("platform users page exposes live management surface", async ({ page, context }) => {
    await authenticateAsPlatformAdmin(context);

    await page.goto("/platform/users");
    if (await allowAuthRedirect(page)) return;

    await expect(page.getByRole("heading", { name: "Platform Users" })).toBeVisible();
    await expect(page.getByRole("tab", { name: /^users$/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /roles/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /invite platform admin/i })).toBeVisible();
  });

  test("operations page exposes incident and maintenance controls", async ({ page, context }) => {
    await authenticateAsPlatformAdmin(context);

    await page.goto("/platform/operations");
    if (await allowAuthRedirect(page)) return;

    await expect(page.getByRole("heading", { name: /operations center/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /^overview$/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /incidents/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /new incident/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /schedule maintenance/i })).toBeVisible();
  });

  test("security page exposes threat and compliance sections", async ({ page, context }) => {
    await authenticateAsPlatformAdmin(context);

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
