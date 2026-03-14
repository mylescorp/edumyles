import { mutation, query } from "../../_generated/server";
import { v } from "convex/values";
import { logAction } from "../../helpers/auditLog";

export const getUserByUserId = query({
  args: { sessionToken: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    // Validate session first
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) return null;

    // Find user by eduMylesUserId
    const users = await ctx.db.query("users").collect();
    const user = users.find((u) => u.eduMylesUserId === args.userId);
    if (!user) return null;

    return {
      _id: user._id,
      email: user.email,
      passwordHash: user.passwordHash ?? null,
      twoFactorEnabled: user.twoFactorEnabled ?? false,
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

    const users = await ctx.db.query("users").collect();
    const user = users.find((u) => u.eduMylesUserId === args.userId);
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
      entityId: args.userId,
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
    const users = await ctx.db.query("users").collect();
    const user = users.find((u) => u.email === args.email);

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
    const users = await ctx.db.query("users").collect();
    const user = users.find((u) => u.eduMylesUserId === args.userId);
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
