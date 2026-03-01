import { QueryCtx, MutationCtx, ActionCtx } from "../_generated/server";

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: string;
  email: string;
}

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
