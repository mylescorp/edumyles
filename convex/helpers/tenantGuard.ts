import { QueryCtx, MutationCtx, ActionCtx, internalQuery } from "../_generated/server";
import { v } from "convex/values";

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: string;
  email: string;
}

/** Internal query used by the action guard */
export const checkActionSession = internalQuery({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, args): Promise<TenantContext> => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.tokenIdentifier))
      .first();

    if (!session) throw new Error("UNAUTHENTICATED: Session not found");
    if (session.expiresAt < Date.now()) throw new Error("UNAUTHENTICATED: Session expired");

    return {
      tenantId: session.tenantId,
      userId: session.userId,
      role: session.role,
      email: session.email || "",
    };
  },
});

export async function requireTenantContext(
  ctx: QueryCtx | MutationCtx
): Promise<TenantContext> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("UNAUTHENTICATED: No active session");
  }

  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) =>
      q.eq("sessionToken", identity.tokenIdentifier)
    )
    .first();

  if (!session) {
    throw new Error("UNAUTHENTICATED: Session not found");
  }

  if (session.expiresAt < Date.now()) {
    throw new Error("UNAUTHENTICATED: Session expired");
  }

  if (!session.tenantId.startsWith("TENANT-")) {
    throw new Error("INVALID_TENANT: Malformed tenantId");
  }

  return {
    tenantId: session.tenantId,
    userId: session.userId,
    role: session.role,
    email: session.email || "",
  };
}

/** Gaurd for Actions to verify session and tenant */
export async function requireActionTenantContext(
  ctx: ActionCtx
): Promise<TenantContext> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("UNAUTHENTICATED: No active session");
  }

  // Use internal query to check session since actions can't access DB directly
  return await ctx.runQuery((ctx as any).internal.helpers.tenantGuard.checkActionSession, {
    tokenIdentifier: identity.tokenIdentifier,
  });
}
