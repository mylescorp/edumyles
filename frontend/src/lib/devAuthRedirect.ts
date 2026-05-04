import { NextRequest, NextResponse } from "next/server";

const DEV_PLATFORM_SESSION_TOKEN = "dev-platform-session";
const DEV_BOOTSTRAP_VERSION = "full-access-v2";
const DEV_SESSION_MAX_AGE = 30 * 24 * 60 * 60;

function isLocalHost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  );
}

export function canUseLocalDevAuth(req: NextRequest) {
  return (
    process.env.NODE_ENV !== "production" &&
    (process.env.ENABLE_DEV_AUTH_BYPASS === "true" ||
      isLocalHost(req.nextUrl.hostname))
  );
}

export function resolveSafeReturnTo(req: NextRequest, fallbackPath = "/platform") {
  const returnTo = req.nextUrl.searchParams.get("returnTo");
  return returnTo?.startsWith("/") ? returnTo : fallbackPath;
}

export function redirectWithLocalDevSession(
  req: NextRequest,
  fallbackPath = "/platform"
) {
  const response = NextResponse.redirect(
    new URL(resolveSafeReturnTo(req, fallbackPath), req.url)
  );
  const cookieOptions = {
    secure: false,
    sameSite: "lax" as const,
    maxAge: DEV_SESSION_MAX_AGE,
    path: "/",
  };
  const user = {
    email: process.env.MASTER_ADMIN_EMAIL ?? "admin@edumyles.local",
    firstName: "Platform",
    lastName: "Admin",
    role: "master_admin",
    tenantId: "PLATFORM",
    activeTenantId: "PLATFORM",
    accessibleTenantIds: ["PLATFORM"],
    sessionToken: DEV_PLATFORM_SESSION_TOKEN,
  };

  response.cookies.set("edumyles_session", DEV_PLATFORM_SESSION_TOKEN, {
    ...cookieOptions,
    httpOnly: true,
  });
  response.cookies.set("edumyles_user", JSON.stringify(user), {
    ...cookieOptions,
    httpOnly: false,
  });
  response.cookies.set("edumyles_role", "master_admin", {
    ...cookieOptions,
    httpOnly: false,
  });
  response.cookies.set("edumyles_admin_workspace_mode", "platform", {
    ...cookieOptions,
    httpOnly: false,
  });
  response.cookies.set("edumyles_dev_bootstrap", DEV_BOOTSTRAP_VERSION, {
    ...cookieOptions,
    httpOnly: false,
  });

  return response;
}
