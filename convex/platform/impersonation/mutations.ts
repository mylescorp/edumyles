import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requireRole } from "../../helpers/authorize";
import { logImpersonation } from "../../helpers/auditLog";

export const startImpersonation = mutation({
  args: {
    targetUserId: v.string(),
    targetTenantId: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requireTenantContext(ctx);
    requireRole(tenantCtx, "master_admin");

    await ctx.db.insert("impersonationSessions", {
      adminId: tenantCtx.userId,
      targetUserId: args.targetUserId,
      targetTenantId: args.targetTenantId,
      reason: args.reason,
      startedAt: Date.now(),
      active: true,
    });

    await logImpersonation(ctx, {
      adminId: tenantCtx.userId,
      targetUserId: args.targetUserId,
      tenantId: tenantCtx.tenantId,
      action: "impersonation.started",
    });

    return { success: true };
  },
});

export const endImpersonation = mutation({
  args: { targetUserId: v.string() },
  handler: async (ctx, args) => {
    const tenantCtx = await requireTenantContext(ctx);
    requireRole(tenantCtx, "master_admin");

    const session = await ctx.db
      .query("impersonationSessions")
      .withIndex("by_admin", (q) => q.eq("adminId", tenantCtx.userId))
      .filter((q) => q.eq(q.field("active"), true))
      .first();

    if (!session) throw new Error("NOT_FOUND: No active impersonation session");

    await ctx.db.patch(session._id, {
      active: false,
      endedAt: Date.now(),
    });

    await logImpersonation(ctx, {
      adminId: tenantCtx.userId,
      targetUserId: args.targetUserId,
      tenantId: tenantCtx.tenantId,
      action: "impersonation.ended",
    });

    return { success: true };
  },
});
