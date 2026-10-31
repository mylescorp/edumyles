import type { FullConfig } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { AUTH_STORAGE_STATE_PATH } from "./fixtures/auth.fixture";

function buildUserCookie(sessionToken: string, role: string) {
  const tenantId = role === "master_admin" ? "PLATFORM" : (process.env.E2E_TENANT_ID ?? "TENANT-733447");
  return JSON.stringify({
    email: process.env.E2E_ADMIN_EMAIL ?? "admin@edumyles.local",
    firstName: "Platform",
    lastName: "Admin",
    role,
    tenantId,
    sessionToken,
    activeTenantId: tenantId,
    accessibleTenantIds: [tenantId],
  });
}

function buildStorageState(sessionToken?: string, role?: string) {
  if (!sessionToken) {
    return { cookies: [], origins: [] };
  }
  const resolvedRole = role ?? "school_admin";

  return {
    cookies: [
      {
        name: "edumyles_session",
        value: sessionToken,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Lax" as const,
      },
      {
        name: "edumyles_role",
        value: resolvedRole,
        domain: "localhost",
        path: "/",
        httpOnly: false,
        secure: false,
        sameSite: "Lax" as const,
      },
      {
        name: "edumyles_user",
        value: buildUserCookie(sessionToken, resolvedRole),
        domain: "localhost",
        path: "/",
        httpOnly: false,
        secure: false,
        sameSite: "Lax" as const,
      },
      {
        name: "edumyles_admin_workspace_mode",
        value: resolvedRole === "master_admin" ? "platform" : "admin",
        domain: "localhost",
        path: "/",
        httpOnly: false,
        secure: false,
        sameSite: "Lax" as const,
      },
      {
        name: "edumyles_dev_bootstrap",
        value: "full-access-v2",
        domain: "localhost",
        path: "/",
        httpOnly: false,
        secure: false,
        sameSite: "Lax" as const,
      },
    ],
    origins: [],
  };
}

export default async function globalSetup(config: FullConfig) {
  fs.mkdirSync(path.dirname(AUTH_STORAGE_STATE_PATH), { recursive: true });
  fs.mkdirSync(path.join("test-results"), { recursive: true });
  fs.mkdirSync(path.join(".e2e-runtime"), { recursive: true });

  let sessionToken = process.env.E2E_SESSION_TOKEN;
  let role = process.env.E2E_ROLE ?? "school_admin";

  if (!sessionToken && process.env.E2E_SEED_DATA === "true") {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    const webhookSecret = process.env.CONVEX_WEBHOOK_SECRET;
    if (!convexUrl || !webhookSecret) {
      throw new Error("Convex URL and webhook secret are required when E2E_SEED_DATA is enabled");
    }

    const { seedDevData } = await import("../scripts/seed");
    const seeded = await seedDevData({
      convexUrl,
      webhookSecret,
      tenantName: process.env.E2E_TENANT_NAME,
      subdomain: process.env.E2E_TENANT_SUBDOMAIN,
      adminEmail: process.env.E2E_ADMIN_EMAIL,
    });

    sessionToken = seeded.adminSessionToken;
    role = seeded.adminRole;
    process.env.E2E_TENANT_SESSION_TOKEN = sessionToken;

    const platformSessionToken = process.env.E2E_PLATFORM_SESSION_TOKEN ?? "dev-platform-session";
    const client = new ConvexHttpClient(convexUrl);
    await client.mutation(api.sessions.createSession, {
      serverSecret: webhookSecret,
      sessionToken: platformSessionToken,
      tenantId: "PLATFORM",
      activeTenantId: "PLATFORM",
      accessibleTenantIds: ["PLATFORM"],
      userId: "e2e-platform-admin",
      email: "platform-admin@edumyles.local",
      role: "master_admin",
      expiresAt: Date.now() + 60 * 60 * 1000,
      permissions: ["*"],
    });
    process.env.E2E_PLATFORM_SESSION_TOKEN = platformSessionToken;

    fs.writeFileSync(
      path.join(".e2e-runtime", "seed-summary.json"),
      JSON.stringify(seeded, null, 2)
    );
  }

  fs.writeFileSync(
    AUTH_STORAGE_STATE_PATH,
    JSON.stringify(buildStorageState(sessionToken, role), null, 2)
  );

  fs.writeFileSync(
    path.join(".e2e-runtime", "setup.json"),
    JSON.stringify(
      {
        baseURL: config.projects[0]?.use?.baseURL ?? process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
        hasSessionToken: Boolean(sessionToken),
        role,
        seeded: process.env.E2E_SEED_DATA === "true",
        completedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );
}
