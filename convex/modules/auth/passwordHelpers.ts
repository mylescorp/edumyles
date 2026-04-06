import { mutation, query } from "../../_generated/server";
import { v } from "convex/values";
import { logAction } from "../../helpers/auditLog";

async function resolveUserBySession(ctx: any, session: any) {
  const byEduMylesUserId = await ctx.db
    .query("users")
    .withIndex("by_user_id", (q: any) => q.eq("eduMylesUserId", session.userId))
    .first();

  if (byEduMylesUserId) {
    return byEduMylesUserId;
  }

  if (session.workosUserId) {
    const byWorkosUserId = await ctx.db
      .query("users")
      .withIndex("by_workos_user", (q: any) => q.eq("workosUserId", session.workosUserId))
      .first();

    if (byWorkosUserId) {
      return byWorkosUserId;
    }
  }

  const bySessionUserIdAsWorkos = await ctx.db
    .query("users")
    .withIndex("by_workos_user", (q: any) => q.eq("workosUserId", session.userId))
    .first();

  if (bySessionUserIdAsWorkos) {
    return bySessionUserIdAsWorkos;
  }

  const byTenantEmail = await ctx.db
    .query("users")
    .withIndex("by_tenant_email", (q: any) =>
      q.eq("tenantId", session.tenantId).eq("email", session.email ?? "")
    )
    .first();

  if (byTenantEmail) {
    return byTenantEmail;
  }

  return null;
}

async function resolveOrCreateUserBySession(ctx: any, session: any) {
  const existing = await resolveUserBySession(ctx, session);
  if (existing) {
    return existing;
  }

  const eduMylesUserId =
    typeof session.userId === "string" && (session.userId.startsWith("USR-") || session.userId.startsWith("USER-"))
      ? session.userId
      : `USR-${session.tenantId}-${session.userId}`;

  const workosUserId = session.workosUserId ?? session.userId;
  const permissions = Array.isArray(session.permissions) ? session.permissions : [];

  const userId = await ctx.db.insert("users", {
    tenantId: session.tenantId,
    eduMylesUserId,
    workosUserId,
    email: session.email ?? "",
    firstName: undefined,
    lastName: undefined,
    role: session.role,
    permissions,
    organizationId: undefined,
    isActive: true,
    createdAt: Date.now(),
  });

  return await ctx.db.get(userId);
}

export const getUserByUserId = query({
  args: { sessionToken: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    // Validate session first
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) return null;

    const user = await resolveUserBySession(ctx, session);
    if (!user) return null;

    return {
      _id: user._id,
      email: user.email,
      passwordHash: user.passwordHash ?? null,
      twoFactorEnabled: user.twoFactorEnabled ?? false,
      twoFactorSecret: user.twoFactorSecret,
    };
  },
});

export const updatePasswordHash = mutation({
  args: {
    sessionToken: v.string(),
    userId: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("UNAUTHENTICATED");
    }

    const user = await resolveOrCreateUserBySession(ctx, session);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      passwordHash: args.passwordHash,
      lastPasswordChangeAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email ?? "unknown",
      action: "user.updated",
      entityType: "user",
      entityId: user.eduMylesUserId,
      after: { passwordChanged: true },
    });
  },
});

export const createResetToken = mutation({
  args: {
    email: v.string(),
    token: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    // Always succeed to prevent email enumeration
    if (!user) return;

    // Invalidate any existing tokens for this user
    const existingTokens = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_userId", (q) => q.eq("userId", user.eduMylesUserId))
      .collect();

    for (const t of existingTokens) {
      await ctx.db.patch(t._id, { used: true });
    }

    await ctx.db.insert("passwordResetTokens", {
      userId: user.eduMylesUserId,
      email: args.email,
      token: args.token,
      expiresAt: args.expiresAt,
      used: false,
      createdAt: Date.now(),
    });
  },
});

export const getResetToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const resetToken = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    return resetToken;
  },
});

export const resetPasswordWithToken = mutation({
  args: {
    token: v.string(),
    userId: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    // Mark token as used
    const resetToken = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (resetToken) {
      await ctx.db.patch(resetToken._id, { used: true });
    }

    // Update user password
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("eduMylesUserId", args.userId))
      .first();
    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      passwordHash: args.passwordHash,
      lastPasswordChangeAt: Date.now(),
    });

    // Delete all sessions for this user (force re-login)
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const s of sessions) {
      await ctx.db.delete(s._id);
    }

    await logAction(ctx, {
      tenantId: user.tenantId,
      actorId: args.userId,
      actorEmail: user.email,
      action: "user.updated",
      entityType: "user",
      entityId: args.userId,
      after: { passwordReset: true },
    });
  },
});
