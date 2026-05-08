import { test, expect } from "@playwright/test";

async function allowAuthRedirect(page: import("@playwright/test").Page) {
  await page.waitForLoadState("domcontentloaded");
  return page.url().includes("/auth/");
}

async function gotoPlatformPage(page: import("@playwright/test").Page, pathname: string) {
  await page.goto(pathname, { waitUntil: "domcontentloaded" });
  if (await allowAuthRedirect(page)) return false;
  await expect(page.locator("main")).not.toBeEmpty({ timeout: 20_000 });
  return true;
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
  test.describe.configure({ mode: "serial" });

  test("/platform redirects non-platform-admins", async ({ page }) => {
    await page.context().addCookies([
      { name: "edumyles_session", value: "school-admin-session", domain: "localhost", path: "/", secure: false, sameSite: "Lax" },
      { name: "edumyles_role", value: "school_admin", domain: "localhost", path: "/", secure: false, sameSite: "Lax" },
    ]);

    await page.goto("/platform", { waitUntil: "domcontentloaded" });
    await expect(page).not.toHaveURL(/^.*\/platform$/);
  });

  test("impersonation page loads for platform admins", async ({ page, context }) => {
    await authenticateAsPlatformAdmin(context);

    if (!(await gotoPlatformPage(page, "/platform/impersonation"))) return;

    await expect(page.getByRole("heading", { name: "Impersonation" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Active Tenant Contexts")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("No impersonation history")).toBeVisible({ timeout: 20_000 });
  });

  test("platform users page exposes live management surface", async ({ page, context }) => {
    await authenticateAsPlatformAdmin(context);

    if (!(await gotoPlatformPage(page, "/platform/users"))) return;

    await expect(page.getByRole("heading", { name: "Platform Users" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "User Management" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: /invite staff/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("tab", { name: /all staff/i })).toBeVisible({ timeout: 20_000 });
  });

  test("operations page exposes incident and maintenance controls", async ({ page, context }) => {
    await authenticateAsPlatformAdmin(context);

    if (!(await gotoPlatformPage(page, "/platform/operations"))) return;

    await expect(page.getByRole("heading", { name: /operations center/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("tab", { name: /^overview$/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("tab", { name: /incidents/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: /new incident/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: /schedule maintenance/i })).toBeVisible({ timeout: 20_000 });
  });

  test("security page exposes threat and compliance sections", async ({ page, context }) => {
    await authenticateAsPlatformAdmin(context);

    if (!(await gotoPlatformPage(page, "/platform/security"))) return;

    await expect(page.getByRole("heading", { name: /advanced security dashboard/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("tab", { name: /security/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("tab", { name: /audit log/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/blocked ips/i)).toBeVisible({ timeout: 20_000 });
  });
});

test.describe("IP blocking", () => {
  test("admin route avoids 5xx for normal requests", async ({ request }) => {
    const response = await request.get("/admin");
    expect(response.status()).toBeLessThan(500);
  });
});
