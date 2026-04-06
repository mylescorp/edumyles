import { QueryCtx, MutationCtx } from "../_generated/server";
import { v } from "convex/values";

export const platformSessionArg = { sessionToken: v.string() };

// Primary: match by immutable WorkOS user ID (set MASTER_ADMIN_WORKOS_USER_ID env var)
const MASTER_ADMIN_WORKOS_USER_ID = process.env.MASTER_ADMIN_WORKOS_USER_ID?.trim();
// Fallback: match by email (deprecated — prefer MASTER_ADMIN_WORKOS_USER_ID)
const MASTER_ADMIN_EMAIL = process.env.MASTER_ADMIN_EMAIL?.toLowerCase();
const FALLBACK_MASTER_ADMIN_EMAILS = MASTER_ADMIN_EMAIL ? [MASTER_ADMIN_EMAIL] : [];

export interface PlatformContext {
  tenantId: string;
  userId: string;
  role: string;
  email: string;
  workosUserId?: string;
}

export interface PlatformRoleContext extends PlatformContext {
  platformUserId?: string;
  addedPermissions?: string[];
  removedPermissions?: string[];
}

/**
 * Validates a platform session token and ensures the caller has
 * master_admin or super_admin role.
 *
 * Master admin is determined by (in priority order):
 * 1. session.workosUserId matches MASTER_ADMIN_WORKOS_USER_ID env var (immutable ID — preferred)
 * 2. session.email matches MASTER_ADMIN_EMAIL env var (deprecated fallback)
 *
 * Unlike requireTenantContext, this does NOT use ctx.auth (Convex JWT auth).
 * It validates the sessionToken arg directly against the sessions table,
 * making it compatible with the cookie-based auth system.
 */
export async function requirePlatformSession(
  ctx: QueryCtx | MutationCtx,
  args: { sessionToken: string }
): Promise<PlatformContext> {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
    .first();

  if (!session) throw new Error("UNAUTHENTICATED: Session not found");
  if (session.expiresAt < Date.now()) throw new Error("UNAUTHENTICATED: Session expired");

  // Resolve master admin status — prefer workosUserId comparison (immutable) over email
  const userRow = await ctx.db
    .query("users")
    .withIndex("by_user_id", (q) => q.eq("eduMylesUserId", session.userId))
    .first();

  const isMasterAdminByWorkosId =
    MASTER_ADMIN_WORKOS_USER_ID !== undefined &&
    userRow?.workosUserId === MASTER_ADMIN_WORKOS_USER_ID;

  const normalizedEmail = session.email?.toLowerCase() || "";
  const isMasterAdminByEmail =
    !isMasterAdminByWorkosId && FALLBACK_MASTER_ADMIN_EMAILS.includes(normalizedEmail);

  if (isMasterAdminByEmail) {
    console.warn(
      "[platformGuard] Master admin resolved by email — set MASTER_ADMIN_WORKOS_USER_ID for immutable ID-based resolution"
    );
  }

  const isConfiguredMasterAdmin = isMasterAdminByWorkosId || isMasterAdminByEmail;
  const normalizedRole = session.role === "platform_admin" ? "super_admin" : session.role;
  const effectiveRole = isConfiguredMasterAdmin ? "master_admin" : normalizedRole;
  const effectiveTenantId = effectiveRole === "master_admin" ? "PLATFORM" : session.tenantId;

  if (!["master_admin", "super_admin"].includes(effectiveRole)) {
    throw new Error("UNAUTHORIZED: Platform access denied");
  }

  return {
    tenantId: effectiveTenantId,
    userId: session.userId,
    role: effectiveRole,
    email: session.email || "",
    workosUserId: userRow?.workosUserId,
  };
}

export async function requirePlatformRole(
  ctx: QueryCtx | MutationCtx,
  args: { sessionToken: string },
  allowedRoles: string[]
): Promise<PlatformRoleContext> {
  const platform = await requirePlatformSession(ctx, args);
  if (platform.role === "master_admin") {
    return platform;
  }

  const platformUser = await ctx.db
    .query("platform_users")
    .withIndex("by_userId", (q) => q.eq("userId", platform.userId))
    .first();

  const effectiveRole = platformUser?.role ?? platform.role;
  if (platformUser) {
    if (platformUser.status !== "active") {
      throw new Error("FORBIDDEN: Platform staff account is suspended");
    }
    if (platformUser.accessExpiresAt !== undefined && platformUser.accessExpiresAt < Date.now()) {
      throw new Error("FORBIDDEN: Platform staff access has expired");
    }
  }

  if (!allowedRoles.includes(effectiveRole)) {
    throw new Error(`FORBIDDEN: requires one of [${allowedRoles.join(", ")}]`);
  }

  return {
    ...platform,
    role: effectiveRole,
    platformUserId: platformUser ? String(platformUser._id) : undefined,
    addedPermissions: platformUser?.addedPermissions,
    removedPermissions: platformUser?.removedPermissions,
  };
}
