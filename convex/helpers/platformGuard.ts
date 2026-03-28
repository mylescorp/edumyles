import { QueryCtx, MutationCtx } from "../_generated/server";
import { v } from "convex/values";

export const platformSessionArg = { sessionToken: v.string() };
const FALLBACK_MASTER_ADMIN_EMAILS = ["ayany004@gmail.com"];

export interface PlatformContext {
  tenantId: string;
  userId: string;
  role: string;
  email: string;
}

/**
 * Validates a platform session token and ensures the caller has
 * master_admin or super_admin role.
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
  const normalizedEmail = session.email?.toLowerCase() || "";
  const isConfiguredMasterAdmin = FALLBACK_MASTER_ADMIN_EMAILS.includes(normalizedEmail);
  const effectiveRole = isConfiguredMasterAdmin ? "master_admin" : session.role;
  const effectiveTenantId = effectiveRole === "master_admin" ? "PLATFORM" : session.tenantId;

  if (!["master_admin", "super_admin"].includes(effectiveRole)) {
    throw new Error("UNAUTHORIZED: Platform access denied");
  }

  return {
    tenantId: effectiveTenantId,
    userId: session.userId,
    role: effectiveRole,
    email: session.email || "",
  };
}
