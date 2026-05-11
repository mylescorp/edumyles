import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { normalizeDevRole } from "@/lib/dev/access";

const DEV_PLATFORM_SESSION_TOKEN = "dev-platform-session";
const DEV_TENANT_SESSION_TOKEN = "dev-tenant-admin-session";

function canUseExplicitDevSession(sessionToken: string) {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.ENABLE_DEV_AUTH_BYPASS === "true" &&
    (sessionToken === DEV_PLATFORM_SESSION_TOKEN ||
      sessionToken === DEV_TENANT_SESSION_TOKEN ||
      sessionToken.startsWith("e2e-"))
  );
}

function readDevUserCookie(userCookie?: string | null) {
  if (!userCookie) return null;
  try {
    return JSON.parse(userCookie) as {
      email?: string;
      role?: string;
      tenantId?: string;
      activeTenantId?: string;
      sessionToken?: string;
    };
  } catch {
    return null;
  }
}

function buildExplicitDevSession(
  sessionToken: string,
  roleCookie?: string | null,
  userCookie?: string | null
) {
  if (!canUseExplicitDevSession(sessionToken)) {
    return null;
  }

  const user = readDevUserCookie(userCookie);
  const role = normalizeDevRole(user?.role ?? roleCookie) ?? "school_admin";
  const isPlatformSession =
    sessionToken === DEV_PLATFORM_SESSION_TOKEN ||
    role === "master_admin" ||
    role === "super_admin";
  const tenantId = isPlatformSession
    ? "PLATFORM"
    : user?.activeTenantId ?? user?.tenantId ?? "TENANT-733447";

  return {
    sessionToken,
    tenantId,
    activeTenantId: tenantId,
    userId: user?.email ?? (isPlatformSession ? "dev-platform-admin" : "dev-tenant-admin"),
    email:
      user?.email ??
      (isPlatformSession
        ? (process.env.MASTER_ADMIN_EMAIL ?? "admin@edumyles.local")
        : "demo-admin@edumyles.local"),
    role: isPlatformSession ? "master_admin" : role,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };
}

export async function ensureProtectedRouteSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("edumyles_session")?.value ?? null;
  const role = cookieStore.get("edumyles_role")?.value ?? null;
  const userCookie = cookieStore.get("edumyles_user")?.value ?? null;

  if (!sessionToken) {
    redirect("/auth/login");
  }

  return {
    sessionToken,
    role,
    userCookie,
  };
}

async function getValidatedServerSession(
  sessionToken: string,
  roleCookie?: string | null,
  userCookie?: string | null
) {
  const devSession = buildExplicitDevSession(sessionToken, roleCookie, userCookie);
  if (devSession) {
    return devSession;
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }

  const convex = new ConvexHttpClient(convexUrl);
  const serverSecret = process.env.CONVEX_WEBHOOK_SECRET;

  if (serverSecret) {
    try {
      return await convex.query(api.sessions.getSession, {
        sessionToken,
        serverSecret,
      });
    } catch (error) {
      if (process.env.NODE_ENV === "production") {
        throw error;
      }
      console.warn(
        "[serverRouteAuth] Trusted session validation failed, trying dev fallback:",
        error
      );
    }
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("CONVEX_WEBHOOK_SECRET is required for production route authorization");
  }

  return await convex.query(api.sessions.getCurrentSession, { sessionToken });
}

export async function ensureAuthorizedRouteSession(
  allowedRoles: readonly string[],
  fallbackHref = "/dashboard"
) {
  const session = await ensureProtectedRouteSession();
  const validatedSession = await getValidatedServerSession(session.sessionToken, session.role, session.userCookie).catch((error) => {
    if (process.env.NODE_ENV === "production") {
      throw error;
    }
    console.error("[serverRouteAuth] Session validation failed:", error);
    return null;
  });
  const normalizedRole = normalizeDevRole(validatedSession?.role);

  if (!normalizedRole || !allowedRoles.includes(normalizedRole)) {
    redirect(fallbackHref);
  }

  return {
    ...session,
    tenantId: validatedSession?.activeTenantId ?? validatedSession?.tenantId,
    role: normalizedRole,
  };
}
