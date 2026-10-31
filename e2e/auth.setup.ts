/**
 * Auth setup — runs before all test projects.
 * In a real CI environment, this would perform a full login flow and
 * save the resulting storage state. Here we use the E2E_SESSION_TOKEN
 * env var to inject pre-generated test credentials.
 */
import { test as setup, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { AUTH_STORAGE_STATE_PATH } from "./fixtures/auth.fixture";

const authFile = AUTH_STORAGE_STATE_PATH;

function buildUserCookie(token: string, role: string) {
  return JSON.stringify({
    email: process.env.E2E_ADMIN_EMAIL ?? "admin@edumyles.local",
    firstName: "Platform",
    lastName: "Admin",
    role,
    tenantId: role === "master_admin" ? "PLATFORM" : (process.env.E2E_TENANT_ID ?? "TENANT-733447"),
    sessionToken: token,
    activeTenantId:
      role === "master_admin" ? "PLATFORM" : (process.env.E2E_TENANT_ID ?? "TENANT-733447"),
    accessibleTenantIds: [
      role === "master_admin" ? "PLATFORM" : (process.env.E2E_TENANT_ID ?? "TENANT-733447"),
    ],
  });
}

setup("authenticate as school admin", async ({ page }) => {
  const token = process.env.E2E_TENANT_SESSION_TOKEN ?? process.env.E2E_SESSION_TOKEN;
  const role = process.env.E2E_ROLE ?? "school_admin";

  if (!token) {
    // No token provided — write an empty storage state so tests can still
    // run (they will hit the auth redirect, which is expected for unauthed tests).
    const emptyState = { cookies: [], origins: [] };
    fs.mkdirSync(path.dirname(authFile), { recursive: true });
    fs.writeFileSync(authFile, JSON.stringify(emptyState));
    return;
  }

  // Inject cookies into a fresh context and save storage state
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
    {
      name: "edumyles_user",
      value: buildUserCookie(token, role),
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
    {
      name: "edumyles_admin_workspace_mode",
      value: role === "master_admin" ? "platform" : "admin",
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

  await page.context().storageState({ path: authFile });
});
