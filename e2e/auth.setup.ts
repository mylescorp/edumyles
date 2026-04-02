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

setup("authenticate as school admin", async ({ page }) => {
  const token = process.env.E2E_SESSION_TOKEN;

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
      value: process.env.E2E_ROLE ?? "school_admin",
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);

  await page.context().storageState({ path: authFile });
});
