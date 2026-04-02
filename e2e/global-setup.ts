import type { FullConfig } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import { AUTH_STORAGE_STATE_PATH } from "./fixtures/auth.fixture";

function buildStorageState(sessionToken?: string, role?: string) {
  if (!sessionToken) {
    return { cookies: [], origins: [] };
  }

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
        value: role ?? "school_admin",
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
    const { seedDevData } = await import("../scripts/seed");
    const seeded = await seedDevData({
      convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL,
      webhookSecret: process.env.CONVEX_WEBHOOK_SECRET,
      tenantName: process.env.E2E_TENANT_NAME,
      subdomain: process.env.E2E_TENANT_SUBDOMAIN,
      adminEmail: process.env.E2E_ADMIN_EMAIL,
    });

    sessionToken = seeded.adminSessionToken;
    role = seeded.adminRole;

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
