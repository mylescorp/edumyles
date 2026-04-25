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
const MASTER_SESSION_BACKUP_COOKIE = "edumyles_master_session";
const ADMIN_WORKSPACE_MODE_COOKIE = "edumyles_admin_workspace_mode";
const ADMIN_TENANT_COOKIE = "edumyles_admin_tenant";

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

function isPlatformRole(role?: string | null) {
  if (!role) return false;
  return [
    "master_admin",
    "super_admin",
    "platform_manager",
    "support_agent",
    "billing_admin",
    "marketplace_reviewer",
    "content_moderator",
    "analytics_viewer",
  ].includes(normalizeRole(role));
}

function getRequestIp(req: NextRequest) {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    undefined
  );
}

async function recordPlatformActivityIfNeeded(
  convex: ConvexHttpClient,
  req: NextRequest,
  params: {
    sessionToken: string;
    role?: string | null;
    email?: string | null;
  }
) {
  if (!isPlatformRole(params.role)) return;
  try {
    await convex.mutation(api.modules.platform.auth.recordPlatformActivity, {
      sessionToken: params.sessionToken,
      sessionId: params.sessionToken,
    });
  } catch (error) {
    console.warn("[api/auth/session] Platform activity tracking failed:", {
      error,
      email: params.email,
      ipAddress: getRequestIp(req),
    });
  }
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

async function ensureDevTenantSession(convex: ConvexHttpClient, preferredTenantId?: string | null) {
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

  const rankedTenants = Array.isArray(existingTenants)
    ? [...existingTenants]
        .filter((entry: any) => entry?.tenantId && entry.tenantId !== "PLATFORM")
        .sort((a: any, b: any) => (b?.updatedAt ?? b?.createdAt ?? 0) - (a?.updatedAt ?? a?.createdAt ?? 0))
    : [];

  let tenant =
    rankedTenants.find((entry: any) => entry.tenantId === preferredTenantId) ??
    rankedTenants.find((entry: any) => entry.subdomain === tenantSubdomain) ??
    rankedTenants[0] ??
    null;

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
    await convex.mutation((api.modules.marketplace.seed as any).ensureCoreModules, { sessionToken: platformSessionToken });
  } catch (error) {
    console.warn("[api/auth/session] Failed to ensure core modules via seed helper:", error);
  }

  try {
    await convex.mutation((api.modules.marketplace.seed as any).seedModuleRegistry, { sessionToken: platformSessionToken });
  } catch (error) {
    console.warn("[api/auth/session] Failed to seed module registry via seed helper:", error);
    try {
      await convex.mutation((api.modules.marketplace.mutations as any).runSeedModuleRegistry, { sessionToken: platformSessionToken });
    } catch (secondaryError) {
      console.warn("[api/auth/session] Failed to seed module registry via fallback mutation:", secondaryError);
    }
  }

  const tenantUsers = await convex.query((api.platform.tenants.queries as any).getTenantUsers, {
    sessionToken: platformSessionToken,
    tenantId: tenant.tenantId,
  });

  const preferredUser = Array.isArray(tenantUsers)
    ? (
        tenantUsers.find((user: any) => user?.role === "school_admin" && user?.isActive) ??
        tenantUsers.find((user: any) => user?.role === "principal" && user?.isActive) ??
        tenantUsers.find((user: any) => user?.isActive) ??
        null
      )
    : null;

  const tenantSessionBase = {
    sessionToken: tenantSessionToken,
    tenantId: tenant.tenantId,
    userId: preferredUser?.eduMylesUserId ?? tenantAdminUserId,
    email: preferredUser?.email ?? tenantAdminEmail,
    role: preferredUser?.role ?? "school_admin",
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
    userId: preferredUser?.eduMylesUserId ?? tenantAdminUserId,
    email: preferredUser?.email ?? tenantAdminEmail,
    role: preferredUser?.role ?? "school_admin",
    expiresAt,
    user: {
      email: preferredUser?.email ?? tenantAdminEmail,
      firstName: preferredUser?.firstName ?? "Demo",
      lastName: preferredUser?.lastName ?? "Admin",
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

function setAuxSessionCookie(response: NextResponse, name: string, value: string) {
  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set(name, value, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });
}

async function buildWorkspaceAdminResponse(
  convex: ConvexHttpClient,
  adminSessionToken: string,
  preferredTenantId?: string | null
) {
  let tenantSession;
  try {
    tenantSession = await ensureDevTenantSession(convex, preferredTenantId);
  } catch (error) {
    console.warn("[api/auth/session] Falling back to synthetic admin workspace session:", error);
    tenantSession = {
      sessionToken: adminSessionToken || DEV_PLATFORM_SESSION_TOKEN,
      tenantId: preferredTenantId || "TENANT-733447",
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

  const response = NextResponse.json({
    session: {
      sessionToken: tenantSession.sessionToken,
      tenantId: tenantSession.tenantId,
      userId: tenantSession.userId,
      email: tenantSession.email,
      role: tenantSession.role,
      expiresAt: tenantSession.expiresAt,
    },
  });

  setSessionCookies(
    response,
    tenantSession.sessionToken,
    tenantSession.user,
    tenantSession.role,
    tenantSession.tenantId
  );
  setAuxSessionCookie(response, MASTER_SESSION_BACKUP_COOKIE, adminSessionToken);
  response.cookies.set(ADMIN_WORKSPACE_MODE_COOKIE, "true", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });
  response.cookies.set(ADMIN_TENANT_COOKIE, tenantSession.tenantId, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });
  return response;
}

async function buildWorkspacePlatformResponse(
  convex: ConvexHttpClient,
  sessionToken: string,
  serverSecret?: string
) {
  const session = await getSessionCompat(convex, sessionToken, serverSecret);
  if (!session) {
    return null;
  }

  const normalizedRole = isConfiguredMasterAdmin(session.email)
    ? "master_admin"
    : normalizeRole(session.role);
  const normalizedTenantId = normalizedRole === "master_admin" ? "PLATFORM" : session.tenantId;
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

  setSessionCookies(
    response,
    session.sessionToken,
    {
      email: session.email,
      firstName: session.firstName ?? "Platform",
      lastName: session.lastName ?? "Admin",
    },
    normalizedRole,
    normalizedTenantId
  );
  response.cookies.delete(ADMIN_WORKSPACE_MODE_COOKIE);
  response.cookies.delete(ADMIN_TENANT_COOKIE);

  return response;
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
    const requestedWorkspace = req.nextUrl.searchParams.get("workspace");
    const currentSessionCookie = req.cookies.get("edumyles_session")?.value;
    const userCookie = req.cookies.get("edumyles_user")?.value;
    const roleCookie = req.cookies.get("edumyles_role")?.value;
    const masterSessionBackup = req.cookies.get(MASTER_SESSION_BACKUP_COOKIE)?.value;
    const preferredAdminTenantId =
      req.nextUrl.searchParams.get("tenantId") ??
      req.cookies.get(ADMIN_TENANT_COOKIE)?.value ??
      null;
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
      if (requestedWorkspace === "admin") {
        const convex = getConvexClient();
        return await buildWorkspaceAdminResponse(
          convex,
          masterSessionBackup ?? DEV_PLATFORM_SESSION_TOKEN,
          preferredAdminTenantId
        );
      }

      // No session cookie at all → default to platform master_admin so the dev
      // can browse every panel without being blocked by RoleGuard.
      const devTokenToUse =
        !currentSessionCookie || currentSessionCookie === "dev_session_token"
          ? DEV_PLATFORM_SESSION_TOKEN
          : currentSessionCookie === DEV_PLATFORM_SESSION_TOKEN
            ? DEV_PLATFORM_SESSION_TOKEN
            : DEV_TENANT_SESSION_TOKEN;

      const devSession = buildDevSessionFromCookies(
        devTokenToUse,
        undefined, // ignore stale user cookie — force the token-based session
        undefined
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

    const serverSecret = process.env.CONVEX_WEBHOOK_SECRET;
    let sessionToken = req.cookies.get("edumyles_session")?.value;

    if (
      requestedWorkspace === "platform" &&
      sessionToken === DEV_TENANT_SESSION_TOKEN &&
      masterSessionBackup
    ) {
      sessionToken = masterSessionBackup;
    }

    if (!sessionToken) {
      if (requestedWorkspace === "admin" && userCookie) {
        try {
          const user = JSON.parse(userCookie) as { email?: string; role?: string };
          const visibleRole = normalizeRole(user.role ?? roleCookie);
          if (visibleRole === "master_admin" || visibleRole === "super_admin") {
            const convex = getConvexClient();
            return await buildWorkspaceAdminResponse(
              convex,
              masterSessionBackup ?? DEV_PLATFORM_SESSION_TOKEN,
              preferredAdminTenantId
            );
          }
        } catch {
          // fall through to null session response
        }
      }

      return NextResponse.json({ session: null }, { status: 200 });
    }

    if (
      requestedWorkspace === "admin" &&
      (
        sessionToken === DEV_PLATFORM_SESSION_TOKEN ||
        roleCookie === "master_admin" ||
        roleCookie === "super_admin" ||
        Boolean(masterSessionBackup)
      )
    ) {
      const convex = getConvexClient();
      return await buildWorkspaceAdminResponse(
        convex,
        masterSessionBackup ?? sessionToken,
        preferredAdminTenantId
      );
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

        if (effectiveRole === "master_admin" && requestedWorkspace === "admin") {
          const convex = getConvexClient();
          return await buildWorkspaceAdminResponse(
            convex,
            masterSessionBackup ?? sessionToken,
            preferredAdminTenantId
          );
        }

        if (requestedWorkspace === "platform" && masterSessionBackup) {
          const convex = getConvexClient();
          const restored = await buildWorkspacePlatformResponse(convex, masterSessionBackup, serverSecret);
          if (restored) {
            return restored;
          }
        }

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

          if (normalizedRole === "master_admin" && requestedWorkspace === "admin") {
            return await buildWorkspaceAdminResponse(
              convex,
              masterSessionBackup ?? sessionToken,
              preferredAdminTenantId
            );
          }

          if (
            requestedWorkspace === "platform" &&
            masterSessionBackup &&
            sessionToken !== masterSessionBackup
          ) {
            const restored = await buildWorkspacePlatformResponse(convex, masterSessionBackup, serverSecret);
            if (restored) {
              return restored;
            }
          }

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
          await recordPlatformActivityIfNeeded(convex, req, {
            sessionToken: session.sessionToken,
            role: normalizedRole,
            email: session.email,
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
