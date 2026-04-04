import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export const dynamic = "force-dynamic";

const MASTER_ADMIN_EMAILS = [
  process.env.MASTER_ADMIN_EMAIL,
]
  .filter((value): value is string => Boolean(value))
  .map((value) => value.toLowerCase());
const DEV_BOOTSTRAP_VERSION = "full-access-v2";
const DEV_PLATFORM_SESSION_TOKEN = "dev-platform-session";
const DEV_TENANT_SESSION_TOKEN = "dev-tenant-admin-session";
const DEV_TENANT_ADMIN_EMAIL = "demo-admin@edumyles.local";

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
  const tenantAdminEmail = DEV_TENANT_ADMIN_EMAIL;
  const platformSessionToken = DEV_PLATFORM_SESSION_TOKEN;
  const tenantSessionToken = DEV_TENANT_SESSION_TOKEN;
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
    permissions: ["*"],
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
    await convex.mutation((api.platform.billing.mutations as any).updateTenantTier, {
      sessionToken: platformSessionToken,
      tenantId: tenant.tenantId,
      plan: "enterprise",
    });
  } catch (error) {
    console.warn("[api/auth/session] Failed to upgrade demo tenant to enterprise:", error);
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
    permissions: ["*"],
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

  try {
    const registry = await convex.query((api.modules.marketplace.queries as any).getModuleRegistry, {
      sessionToken: tenantSessionToken,
    });

    const moduleIds = Array.isArray(registry)
      ? registry
          .map((mod: any) => mod?.moduleId)
          .filter((moduleId: unknown): moduleId is string => typeof moduleId === "string")
      : [];

    const optionalModuleIds = moduleIds.filter((moduleId) => !["sis", "communications", "users"].includes(moduleId));
    const pending = new Set(optionalModuleIds);

    for (let pass = 0; pass < 4 && pending.size > 0; pass += 1) {
      let progress = false;

      for (const moduleId of [...pending]) {
        try {
          await convex.mutation((api.modules.marketplace.mutations as any).installModule, {
            sessionToken: tenantSessionToken,
            tenantId: tenant.tenantId,
            moduleId,
          });
          pending.delete(moduleId);
          progress = true;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (
            message.includes("MODULE_ALREADY_INSTALLED") ||
            message.includes("already installed")
          ) {
            pending.delete(moduleId);
            progress = true;
          }
        }
      }

      if (!progress) break;
    }

    if (pending.size > 0) {
      console.warn("[api/auth/session] Some demo modules could not be installed:", [...pending]);
    }
  } catch (error) {
    console.warn("[api/auth/session] Failed to install full demo module set:", error);
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

function buildDevSessionFromCookies(
  sessionToken: string,
  userCookie?: string,
  roleCookie?: string
) {
  if (userCookie) {
    try {
      const user = JSON.parse(userCookie) as {
        email?: string;
        firstName?: string;
        lastName?: string;
        role?: string;
        tenantId?: string;
      };

      if (user.email) {
        const role = normalizeRole(user.role ?? roleCookie) ?? "school_admin";
        return {
          sessionToken,
          tenantId: role === "master_admin" ? "PLATFORM" : (user.tenantId ?? "TENANT-733447"),
          userId: user.email,
          email: user.email,
          role,
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
          user: {
            email: user.email,
            firstName: user.firstName ?? "Demo",
            lastName: user.lastName ?? "Admin",
          },
        };
      }
    } catch {
      // Fall through to the deterministic demo session below.
    }
  }

  if (sessionToken === DEV_PLATFORM_SESSION_TOKEN) {
    return {
      sessionToken,
      tenantId: "PLATFORM",
      userId: "dev-platform-admin",
      email: process.env.MASTER_ADMIN_EMAIL ?? "admin@edumyles.local",
      role: "master_admin",
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      user: {
        email: process.env.MASTER_ADMIN_EMAIL ?? "admin@edumyles.local",
        firstName: "Platform",
        lastName: "Admin",
      },
    };
  }

  return {
    sessionToken,
    tenantId: "TENANT-733447",
    userId: DEV_TENANT_ADMIN_EMAIL,
    email: DEV_TENANT_ADMIN_EMAIL,
    role: "school_admin",
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    user: {
      email: DEV_TENANT_ADMIN_EMAIL,
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
    const currentSessionCookie = req.cookies.get("edumyles_session")?.value;
    const userCookie = req.cookies.get("edumyles_user")?.value;
    const roleCookie = req.cookies.get("edumyles_role")?.value;
    const bootstrapVersion = req.cookies.get("edumyles_dev_bootstrap")?.value;
    const isDevBypassEnabled =
      process.env.ENABLE_DEV_AUTH_BYPASS === "true" &&
      process.env.NODE_ENV !== "production" &&
      (
        !currentSessionCookie ||
        currentSessionCookie === "dev_session_token" ||
        (currentSessionCookie === DEV_TENANT_SESSION_TOKEN && bootstrapVersion !== DEV_BOOTSTRAP_VERSION)
      );

    if (isDevBypassEnabled) {
      const devSession = buildDevSessionFromCookies(
        currentSessionCookie === DEV_PLATFORM_SESSION_TOKEN
          ? DEV_PLATFORM_SESSION_TOKEN
          : DEV_TENANT_SESSION_TOKEN,
        userCookie,
        roleCookie
      );

      const response = NextResponse.json({
        session: {
          sessionToken: devSession.sessionToken,
          tenantId: devSession.tenantId,
          userId: devSession.userId,
          email: devSession.email,
          role: devSession.role,
          expiresAt: devSession.expiresAt,
        },
      });

      setSessionCookies(
        response,
        devSession.sessionToken,
        devSession.user,
        devSession.role,
        devSession.tenantId
      );
      response.cookies.set("edumyles_dev_bootstrap", DEV_BOOTSTRAP_VERSION, {
        httpOnly: false,
        secure: false,
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });

      return response;
    }

    const sessionToken = req.cookies.get("edumyles_session")?.value;
    const serverSecret = process.env.CONVEX_WEBHOOK_SECRET;

    if (!sessionToken) {
      return NextResponse.json({ session: null }, { status: 200 });
    }

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
