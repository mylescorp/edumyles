import { Page } from "@playwright/test";

/**
 * Programmatically inject a mock session cookie so tests don't need to go
 * through the full WorkOS SSO flow. In CI, real cookies are injected via
 * the setup project; locally you can override with E2E_SESSION_TOKEN env.
 */
export async function injectSessionCookie(
  page: Page,
  options: { role?: string; sessionToken?: string } = {}
) {
  const token = options.sessionToken ?? process.env.E2E_SESSION_TOKEN ?? "e2e-test-session";
  const role = options.role ?? "school_admin";

  await page.context().addCookies([
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
  ]);
}

export async function clearSessionCookies(page: Page) {
  await page.context().clearCookies();
}
