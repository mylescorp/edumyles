import { QueryCtx, MutationCtx, ActionCtx, internalQuery } from "../_generated/server";
import { ConvexError, v } from "convex/values";

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

    if (!session) throw new ConvexError({ code: "UNAUTHENTICATED", message: "Session not found" });
    if (session.expiresAt < Date.now()) throw new ConvexError({ code: "UNAUTHENTICATED", message: "Session expired" });

    return {
      tenantId: session.tenantId,
      userId: session.userId,
      role: session.role,
      email: session.email || "",
    };
  },
});

export async function requireTenantSession(
  ctx: QueryCtx | MutationCtx,
  args: { sessionToken: string }
): Promise<TenantContext> {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
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

  return {
    tenantId: session.tenantId,
    userId: session.userId,
    role: session.role,
    email: session.email || "",
  };
}

export async function requireTenantContext(ctx: QueryCtx | MutationCtx): Promise<TenantContext> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({ code: "UNAUTHENTICATED", message: "No active session" });
  }

  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("sessionToken", identity.tokenIdentifier))
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

  return {
    tenantId: session.tenantId,
    userId: session.userId,
    role: session.role,
    email: session.email || "",
  };
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
