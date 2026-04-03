import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export const dynamic = "force-dynamic";

const MASTER_ADMIN_EMAILS = [
  process.env.MASTER_ADMIN_EMAIL,
]
  .filter((value): value is string => Boolean(value))
  .map((value) => value.toLowerCase());

function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }
  return new ConvexHttpClient(convexUrl);
}

function isConfiguredMasterAdmin(email?: string | null) {
  if (!email) return false;
  return MASTER_ADMIN_EMAILS.includes(email.toLowerCase());
}

function normalizeRole(role?: string | null) {
  if (role === "platform_admin") return "super_admin";
  return role ?? "school_admin";
}

async function getSessionCompat(convex: ConvexHttpClient, sessionToken: string, serverSecret?: string) {
  const getSessionRef = (api.sessions as any).getSession;

  if (serverSecret) {
    try {
      return await convex.query(getSessionRef, {
        sessionToken,
        serverSecret,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("extra field `serverSecret`")) {
        throw error;
      }
    }
  }

  return await convex.query(getSessionRef, { sessionToken });
}

async function ensureDevTenantSession(convex: ConvexHttpClient) {
  const serverSecret = process.env.CONVEX_WEBHOOK_SECRET ?? "";
  const platformAdminEmail = process.env.MASTER_ADMIN_EMAIL ?? "admin@edumyles.local";
  const tenantAdminEmail = "demo-admin@edumyles.local";
  const platformSessionToken = "dev-platform-session";
  const tenantSessionToken = "dev-tenant-admin-session";
  const tenantSubdomain = "demo-school";
  const tenantAdminUserId = "dev-tenant-admin";
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

  const createSessionRef = (api.sessions as any).createSession;
  const createSessionBase = {
    sessionToken: platformSessionToken,
    tenantId: "PLATFORM",
    userId: "dev-platform-admin",
    email: platformAdminEmail,
    role: "master_admin",
    expiresAt,
  };

  try {
    await convex.mutation(createSessionRef, {
      ...createSessionBase,
      serverSecret,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("extra field `serverSecret`")) {
      throw error;
    }
    await convex.mutation(createSessionRef, createSessionBase);
  }

  const listTenantsRef = (api.platform.tenants.queries as any).listAllTenants;
  const createTenantRef = (api.platform.tenants.mutations as any).createTenant;

  const existingTenants = await convex.query(listTenantsRef, {
    sessionToken: platformSessionToken,
  });

  let tenant = Array.isArray(existingTenants)
    ? existingTenants.find((entry: any) => entry.subdomain === tenantSubdomain)
    : null;

  if (!tenant) {
    await convex.mutation(createTenantRef, {
      sessionToken: platformSessionToken,
      name: "Demo School",
      subdomain: tenantSubdomain,
      email: tenantAdminEmail,
      phone: "+254700000000",
      plan: "starter",
      county: "Nairobi",
      country: "KE",
    });

    const refreshedTenants = await convex.query(listTenantsRef, {
      sessionToken: platformSessionToken,
    });
    tenant = Array.isArray(refreshedTenants)
      ? refreshedTenants.find((entry: any) => entry.subdomain === tenantSubdomain)
      : null;
  }

  if (!tenant?.tenantId) {
    throw new Error("Dev tenant bootstrap failed");
  }

  try {
    await convex.mutation((api.modules.marketplace.seed as any).ensureCoreModules, {});
  } catch (error) {
    console.warn("[api/auth/session] Failed to ensure core modules via seed helper:", error);
  }

  try {
    await convex.mutation((api.modules.marketplace.seed as any).seedModuleRegistry, {});
  } catch (error) {
    console.warn("[api/auth/session] Failed to seed module registry via seed helper:", error);
    try {
      await convex.mutation((api.modules.marketplace.mutations as any).runSeedModuleRegistry, {});
    } catch (secondaryError) {
      console.warn("[api/auth/session] Failed to seed module registry via fallback mutation:", secondaryError);
    }
  }

  const tenantSessionBase = {
    sessionToken: tenantSessionToken,
    tenantId: tenant.tenantId,
    userId: tenantAdminUserId,
    email: tenantAdminEmail,
    role: "school_admin",
    expiresAt,
  };

  try {
    await convex.mutation(createSessionRef, {
      ...tenantSessionBase,
      serverSecret,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("extra field `serverSecret`")) {
      throw error;
    }
    await convex.mutation(createSessionRef, tenantSessionBase);
  }

  return {
    sessionToken: tenantSessionToken,
    tenantId: tenant.tenantId,
    userId: tenantAdminUserId,
    email: tenantAdminEmail,
    role: "school_admin",
    expiresAt,
    user: {
      email: tenantAdminEmail,
      firstName: "Demo",
      lastName: "Admin",
    },
  };
}

function setSessionCookies(
  response: NextResponse,
  sessionToken: string,
  user: { email: string; firstName?: string | null; lastName?: string | null },
  role: string,
  tenantId: string
) {
  const isProduction = process.env.NODE_ENV === "production";

  response.cookies.set("edumyles_session", sessionToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });

  response.cookies.set(
    "edumyles_user",
    JSON.stringify({
      email: user.email,
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      role,
      tenantId,
      sessionToken,
    }),
    {
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    }
  );

  response.cookies.set("edumyles_role", role, {
    httpOnly: false,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });
}

/**
 * GET /api/auth/session
 *
 * Server-side session validation endpoint.
 * Reads the httpOnly session cookie (not accessible from client JS)
 * and validates it against Convex, returning the session data.
 */
export async function GET(req: NextRequest) {
  try {
    // Development bypass - only when explicitly enabled AND not in production
    if (
      process.env.ENABLE_DEV_AUTH_BYPASS === "true" &&
      process.env.NODE_ENV !== "production" &&
      (!req.cookies.get("edumyles_session")?.value ||
        req.cookies.get("edumyles_session")?.value === "dev_session_token")
    ) {
      const convex = getConvexClient();

      console.log("[api/auth/session] Dev bypass: Bootstrapping real tenant session");
      const seeded = await ensureDevTenantSession(convex);

      const response = NextResponse.json({
        session: {
          sessionToken: seeded.sessionToken,
          tenantId: seeded.tenantId,
          userId: seeded.userId,
          email: seeded.email,
          role: seeded.role,
          expiresAt: seeded.expiresAt,
        },
      });

      setSessionCookies(
        response,
        seeded.sessionToken,
        seeded.user,
        seeded.role,
        seeded.tenantId
      );

      return response;
    }

    const sessionToken = req.cookies.get("edumyles_session")?.value;
    const serverSecret = process.env.CONVEX_WEBHOOK_SECRET;

    if (!sessionToken) {
      return NextResponse.json({ session: null }, { status: 200 });
    }

    const userCookie = req.cookies.get("edumyles_user")?.value;
    const roleCookie = req.cookies.get("edumyles_role")?.value;

    // Fast path: reconstruct the client session directly from the signed-in
    // cookie set. Convex queries still validate the session token server-side,
    // so we can avoid blocking every page render on an extra Convex round-trip.
    if (userCookie) {
      try {
        const user = JSON.parse(userCookie);
        const effectiveRole = isConfiguredMasterAdmin(user.email)
          ? "master_admin"
          : normalizeRole(user.role ?? roleCookie);
        const effectiveTenantId =
          effectiveRole === "master_admin" ? "PLATFORM" : user.tenantId || "PLATFORM";

        return NextResponse.json({
          session: {
            sessionToken,
            tenantId: effectiveTenantId,
            userId: user.userId || user.email,
            email: user.email,
            role: effectiveRole,
            expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000),
          },
        });
      } catch (parseError) {
        console.error("[api/auth/session] Failed to parse fast-path user cookie:", parseError);
      }
    }

    let convexLookupFailed = false;

    // Try Convex first
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (convexUrl) {
      try {
        const convex = getConvexClient();
        const session = await getSessionCompat(convex, sessionToken, serverSecret);

        if (session) {
          const normalizedRole = isConfiguredMasterAdmin(session.email)
            ? "master_admin"
            : normalizeRole(session.role);
          const normalizedTenantId = normalizedRole === "master_admin" ? "PLATFORM" : session.tenantId;

          if (isConfiguredMasterAdmin(session.email) && session.role !== "master_admin") {
            try {
              await convex.mutation(api.users.syncMasterAdminRole, {
                workosUserId: session.userId,
                email: session.email,
                sessionToken,
              });
            } catch (repairError) {
              console.error("[api/auth/session] Failed to repair master admin role:", repairError);
            }
          }

          const response = NextResponse.json({
            session: {
              sessionToken: session.sessionToken,
              tenantId: normalizedTenantId,
              userId: session.userId,
              email: session.email,
              role: normalizedRole,
              expiresAt: session.expiresAt,
            },
          });
          const isProduction = process.env.NODE_ENV === "production";
          const userCookie = req.cookies.get("edumyles_user")?.value;
          if (userCookie) {
            try {
              const parsedUser = JSON.parse(userCookie);
              response.cookies.set(
                "edumyles_user",
                JSON.stringify({
                  ...parsedUser,
                  email: session.email,
                  role: normalizedRole,
                  tenantId: normalizedTenantId,
                  sessionToken: session.sessionToken,
                }),
                {
                  httpOnly: false,
                  secure: isProduction,
                  sameSite: "lax",
                  maxAge: 30 * 24 * 60 * 60,
                  path: "/",
                }
              );
            } catch {
              // Ignore malformed companion cookie and continue with session response.
            }
          }
          response.cookies.set("edumyles_role", normalizedRole, {
            httpOnly: false,
            secure: isProduction,
            sameSite: "lax",
            maxAge: 30 * 24 * 60 * 60,
            path: "/",
          });
          return response;
        }
      } catch (convexError) {
        convexLookupFailed = true;
        console.log("[api/auth/session] Convex unavailable, trying fallback:", convexError);
      }
    }

    // Fallback: when Convex is unavailable or session not found in DB,
    // reconstruct session from the companion cookies set at login time.
    // The httpOnly edumyles_session cookie (which cannot be set via JS) is the
    // security gate — if it exists, it was set server-side during auth callback.
    if (convexLookupFailed && userCookie) {
      try {
        const user = JSON.parse(userCookie);
        const effectiveRole = isConfiguredMasterAdmin(user.email)
          ? "master_admin"
          : normalizeRole(user.role ?? roleCookie);
        const effectiveTenantId = effectiveRole === "master_admin" ? "PLATFORM" : user.tenantId || "PLATFORM";
        return NextResponse.json({
          session: {
            sessionToken,
            tenantId: effectiveTenantId,
            userId: user.email,
            email: user.email,
            role: effectiveRole,
            expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
          },
        });
      } catch (parseError) {
        console.error("[api/auth/session] Failed to parse user cookie:", parseError);
      }
    }

    return NextResponse.json({ session: null }, { status: 200 });
  } catch (err) {
    console.error("[api/auth/session] Session validation failed:", err);
    return NextResponse.json({ session: null }, { status: 200 });
  }
}
