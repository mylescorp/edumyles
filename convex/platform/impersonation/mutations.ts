import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { logImpersonation } from "../../helpers/auditLog";

// 2-hour impersonation session lifetime
const IMPERSONATION_TTL_MS = 2 * 60 * 60 * 1000;

export const startImpersonation = mutation({
  args: {
    sessionToken: v.string(),
    targetUserId: v.string(),
    targetTenantId: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requirePlatformSession(ctx, args);

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
      adminEmail: tenantCtx.email,
      targetUserId: args.targetUserId,
      tenantId: tenantCtx.tenantId,
      action: "impersonation.started",
    });

    return { success: true };
  },
});

/**
 * Creates a real, short-lived session token for the target user so the admin
 * can actually browse the platform as that user (auth context swap).
 * Returns the session token and target user details for the frontend to set cookies.
 */
export const beginImpersonationSession = mutation({
  args: {
    sessionToken: v.string(),
    targetUserId: v.string(),
    targetTenantId: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requirePlatformSession(ctx, args);

    // Look up the target user
    const targetUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("eduMylesUserId"), args.targetUserId))
      .first();
    if (!targetUser) throw new Error("NOT_FOUND: Target user not found");
    if (targetUser.tenantId !== args.targetTenantId) {
      throw new Error("FORBIDDEN: User does not belong to the specified tenant");
    }

    const now = Date.now();
    const expiresAt = now + IMPERSONATION_TTL_MS;

    // Generate a unique token for this impersonation session
    // Use a prefix so it's identifiable in logs: "imp_" + hex
    const tokenBytes = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 256).toString(16).padStart(2, "0")
    ).join("");
    const impersonationToken = `imp_${tokenBytes}`;

    // Create a real session record for the target user — marked with impersonatedBy
    await ctx.db.insert("sessions", {
      sessionToken: impersonationToken,
      tenantId: args.targetTenantId,
      userId: args.targetUserId,
      email: targetUser.email,
      role: targetUser.role,
      expiresAt,
      createdAt: now,
      impersonatedBy: tenantCtx.userId,
    });

    // Record the impersonation session (upsert if already exists for this admin+target)
    const existing = await ctx.db
      .query("impersonationSessions")
      .withIndex("by_admin", (q) => q.eq("adminId", tenantCtx.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("targetUserId"), args.targetUserId),
          q.eq(q.field("active"), true)
        )
      )
      .first();

    if (existing) {
      // Expire the old impersonation session token and update
      const oldToken = existing.impersonationSessionToken;
      if (oldToken) {
        const oldSession = await ctx.db
          .query("sessions")
          .withIndex("by_token", (q) => q.eq("sessionToken", oldToken))
          .first();
        if (oldSession) {
          await ctx.db.patch(oldSession._id, { expiresAt: now - 1 });
        }
      }
      await ctx.db.patch(existing._id, {
        impersonationSessionToken: impersonationToken,
        impersonationExpiresAt: expiresAt,
        startedAt: now,
      });
    } else {
      await ctx.db.insert("impersonationSessions", {
        adminId: tenantCtx.userId,
        targetUserId: args.targetUserId,
        targetTenantId: args.targetTenantId,
        reason: args.reason,
        startedAt: now,
        active: true,
        impersonationSessionToken: impersonationToken,
        impersonationExpiresAt: expiresAt,
      });
    }

    await logImpersonation(ctx, {
      adminId: tenantCtx.userId,
      adminEmail: tenantCtx.email,
      targetUserId: args.targetUserId,
      tenantId: tenantCtx.tenantId,
      action: "impersonation.started",
    });

    return {
      impersonationToken,
      expiresAt,
      targetUser: {
        userId: targetUser.eduMylesUserId,
        email: targetUser.email,
        role: targetUser.role,
        name: [targetUser.firstName, targetUser.lastName].filter(Boolean).join(" ") || targetUser.email,
        tenantId: args.targetTenantId,
      },
    };
  },
});

export const endImpersonation = mutation({
  args: {
    sessionToken: v.string(),
    targetUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requirePlatformSession(ctx, args);

    const session = await ctx.db
      .query("impersonationSessions")
      .withIndex("by_admin", (q) => q.eq("adminId", tenantCtx.userId))
      .filter((q) => q.eq(q.field("active"), true))
      .first();

    if (!session) throw new Error("NOT_FOUND: No active impersonation session");

    // Expire the impersonation session token in the sessions table
    if (session.impersonationSessionToken) {
      const impSession = await ctx.db
        .query("sessions")
        .withIndex("by_token", (q) =>
          q.eq("sessionToken", session.impersonationSessionToken!)
        )
        .first();
      if (impSession) {
        await ctx.db.patch(impSession._id, { expiresAt: Date.now() - 1 });
      }
    }

    await ctx.db.patch(session._id, {
      active: false,
      endedAt: Date.now(),
    });

    await logImpersonation(ctx, {
      adminId: tenantCtx.userId,
      adminEmail: tenantCtx.email,
      targetUserId: args.targetUserId,
      tenantId: tenantCtx.tenantId,
      action: "impersonation.ended",
    });

    return { success: true };
  },
});
