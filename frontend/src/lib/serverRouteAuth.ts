import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { normalizeDevRole } from "@/lib/dev/access";

const DEV_PLATFORM_SESSION_TOKEN = "dev-platform-session";

function buildExplicitDevPlatformSession(sessionToken: string) {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.ENABLE_DEV_AUTH_BYPASS !== "true" ||
    sessionToken !== DEV_PLATFORM_SESSION_TOKEN
  ) {
    return null;
  }

  return {
    sessionToken,
    tenantId: "PLATFORM",
    activeTenantId: "PLATFORM",
    userId: "dev-platform-admin",
    email: process.env.MASTER_ADMIN_EMAIL ?? "admin@edumyles.local",
    role: "master_admin",
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };
}

export async function ensureProtectedRouteSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("edumyles_session")?.value ?? null;
  const role = cookieStore.get("edumyles_role")?.value ?? null;

  if (!sessionToken) {
    redirect("/auth/login");
  }

  return {
    sessionToken,
    role,
  };
}

async function getValidatedServerSession(sessionToken: string) {
  const devSession = buildExplicitDevPlatformSession(sessionToken);
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
  const validatedSession = await getValidatedServerSession(session.sessionToken).catch((error) => {
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
