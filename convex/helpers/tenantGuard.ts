import { QueryCtx, MutationCtx, ActionCtx, internalQuery } from "../_generated/server";
import { ConvexError, v } from "convex/values";

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: string;
  email: string;
  permissions: string[];
}

const DEV_PLATFORM_SESSION_TOKEN = "dev-platform-session";
const DEV_TENANT_SESSION_TOKEN = "dev-tenant-admin-session";
const DEV_SESSION_TOKEN = "dev_session_token";

function toTenantContext(session: {
  tenantId: string;
  userId: string;
  role: string;
  email?: string;
  permissions?: string[];
}) {
  return {
    tenantId: session.tenantId,
    userId: session.userId,
    role: session.role === "platform_admin" ? "super_admin" : session.role,
    email: session.email || "",
    permissions: session.permissions ?? [],
  };
}

/** Internal query used by the action guard */
export const checkActionSession = internalQuery({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, args): Promise<TenantContext> => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.tokenIdentifier))
      .first();

    if (!session) throw new ConvexError({ code: "UNAUTHENTICATED", message: "Session not found" });
    if (session.expiresAt < Date.now()) throw new ConvexError({ code: "UNAUTHENTICATED", message: "Session expired" });

    return {
      ...toTenantContext(session),
    };
  },
});

export async function requireTenantSession(
  ctx: QueryCtx | MutationCtx,
  args: { sessionToken: string; tenantId?: string }
): Promise<TenantContext> {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
    .first();

  const devBypassEnabled =
    process.env.NODE_ENV !== "production" &&
    process.env.ENABLE_DEV_AUTH_BYPASS === "true";

  async function resolveTenantIdForDevFallback() {
    if (args.tenantId && args.tenantId !== "PLATFORM") {
      return args.tenantId;
    }

    const tenants = await ctx.db.query("tenants").collect();
    const ranked = tenants
      .filter((tenant) => tenant.tenantId && tenant.tenantId !== "PLATFORM")
      .sort((a, b) => (b.updatedAt ?? b.createdAt ?? 0) - (a.updatedAt ?? a.createdAt ?? 0));

    return ranked[0]?.tenantId;
  }

  async function buildDevTenantContext(base?: {
    userId?: string;
    role?: string;
    email?: string;
    permissions?: string[];
  }) {
    const tenantId = await resolveTenantIdForDevFallback();

    if (!tenantId) {
      throw new ConvexError({ code: "UNAUTHENTICATED", message: "Session not found" });
    }

    const tenantRecord = await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenantId))
      .first();

    if (!tenantRecord) {
      throw new ConvexError({ code: "UNAUTHENTICATED", message: "Tenant not found" });
    }

    const schoolAdmin = await ctx.db
      .query("users")
      .withIndex("by_tenant_role", (q) => q.eq("tenantId", tenantId).eq("role", "school_admin"))
      .first();

    return {
      tenantId,
      userId: schoolAdmin?.eduMylesUserId ?? base?.userId ?? `dev-school-admin-${tenantId}`,
      role: schoolAdmin?.role ?? base?.role ?? "school_admin",
      email:
        schoolAdmin?.email ??
        base?.email ??
        process.env.MASTER_ADMIN_EMAIL ??
        "admin@edumyles.local",
      permissions: schoolAdmin ? [] : (base?.permissions ?? ["*"]),
    };
  }

  if (!session) {
    const isKnownDevToken = [DEV_PLATFORM_SESSION_TOKEN, DEV_TENANT_SESSION_TOKEN, DEV_SESSION_TOKEN].includes(
      args.sessionToken
    );

    if (devBypassEnabled && isKnownDevToken) {
      return await buildDevTenantContext({
        role: args.sessionToken === DEV_PLATFORM_SESSION_TOKEN ? "master_admin" : "school_admin",
      });
    }

    throw new ConvexError({ code: "UNAUTHENTICATED", message: "Session not found" });
  }

  if (session.expiresAt < Date.now()) {
    throw new ConvexError({ code: "UNAUTHENTICATED", message: "Session expired" });
  }

  const isPlatformScopedSession =
    session.tenantId === "PLATFORM" ||
    ["master_admin", "super_admin", "platform_admin"].includes(session.role);

  if (devBypassEnabled && isPlatformScopedSession && args.tenantId && args.tenantId !== "PLATFORM") {
    return await buildDevTenantContext({
      userId: session.userId,
      role: session.role === "platform_admin" ? "super_admin" : session.role,
      email: session.email,
      permissions: session.permissions ?? [],
    });
  }

  if (!session.tenantId.startsWith("TENANT-") && session.tenantId !== "PLATFORM") {
    throw new ConvexError({ code: "INVALID_TENANT", message: "Malformed tenantId" });
  }

  return toTenantContext(session);
}

export async function requireTenantContext(ctx: QueryCtx | MutationCtx): Promise<TenantContext> {
  const identity = await ctx.auth.getUserIdentity();
  const devBypassEnabled =
    process.env.NODE_ENV !== "production" &&
    process.env.ENABLE_DEV_AUTH_BYPASS === "true";
  if (devBypassEnabled) {
    console.warn("[SECURITY] Dev auth bypass is active — NEVER enable this in production");
  }
  const tokenIdentifier = identity?.tokenIdentifier ?? (devBypassEnabled ? "dev-tenant-admin-session" : undefined);
  if (!tokenIdentifier) {
    throw new ConvexError({ code: "UNAUTHENTICATED", message: "No active session" });
  }

  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("sessionToken", tokenIdentifier))
    .first();

  if (!session) {
    throw new ConvexError({ code: "UNAUTHENTICATED", message: "Session not found" });
  }

  if (session.expiresAt < Date.now()) {
    throw new ConvexError({ code: "UNAUTHENTICATED", message: "Session expired" });
  }

  if (!session.tenantId.startsWith("TENANT-") && session.tenantId !== "PLATFORM") {
    throw new ConvexError({ code: "INVALID_TENANT", message: "Malformed tenantId" });
  }

  return toTenantContext(session);
}

/** Guard for Actions to verify session and tenant */
export async function requireActionTenantContext(ctx: ActionCtx): Promise<TenantContext> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({ code: "UNAUTHENTICATED", message: "No active session" });
  }

  // Use internal query to check session since actions can't access DB directly
  return await ctx.runQuery((ctx as any).internal.helpers.tenantGuard.checkActionSession, {
    tokenIdentifier: identity.tokenIdentifier,
  });
}
