import { mutation, query } from "../../_generated/server";
import { v } from "convex/values";
import { logAction } from "../../helpers/auditLog";

export const storeTempSecret = mutation({
  args: {
    sessionToken: v.string(),
    userId: v.string(),
    secret: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("UNAUTHENTICATED");
    }

    // Store in a temporary storage (could be a separate table or use user table with a flag)
    const users = await ctx.db.query("users").collect();
    const user = users.find((u) => u.eduMylesUserId === args.userId);
    if (!user) throw new Error("User not found");

    // Store the secret temporarily (not enabled yet)
    await ctx.db.patch(user._id, {
      tempTwoFactorSecret: args.secret,
    });
  },
});

export const getTempSecret = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) return null;

    const users = await ctx.db.query("users").collect();
    const user = users.find((u) => u.eduMylesUserId === session.userId);
    if (!user || !user.tempTwoFactorSecret) return null;

    return {
      secret: user.tempTwoFactorSecret,
    };
  },
});

export const enableTwoFactor = mutation({
  args: {
    sessionToken: v.string(),
    userId: v.string(),
    secret: v.string(),
    backupCodes: v.array(v.string()),
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
      twoFactorEnabled: true,
      twoFactorSecret: args.secret,
      recoveryCodes: args.backupCodes,
      tempTwoFactorSecret: undefined, // Clear temporary secret
    });

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email ?? "unknown",
      action: "user.updated",
      entityType: "user",
      entityId: args.userId,
      after: { twoFactorEnabled: true },
    });
  },
});

export const disableTwoFactor = mutation({
  args: {
    sessionToken: v.string(),
    userId: v.string(),
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
      twoFactorEnabled: false,
      twoFactorSecret: undefined,
      recoveryCodes: undefined,
      tempTwoFactorSecret: undefined,
    });

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email ?? "unknown",
      action: "user.updated",
      entityType: "user",
      entityId: args.userId,
      after: { twoFactorEnabled: false },
    });
  },
});

export const verifyBackupCode = mutation({
  args: {
    sessionToken: v.string(),
    userId: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) return false;

    const users = await ctx.db.query("users").collect();
    const user = users.find((u) => u.eduMylesUserId === args.userId);
    if (!user || !user.recoveryCodes) return false;

    const codeIndex = user.recoveryCodes.indexOf(args.code);
    if (codeIndex === -1) return false;

    // Remove the used backup code
    const updatedCodes = [...user.recoveryCodes];
    updatedCodes.splice(codeIndex, 1);

    await ctx.db.patch(user._id, {
      recoveryCodes: updatedCodes,
    });

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email ?? "unknown",
      action: "user.updated",
      entityType: "user",
      entityId: args.userId,
      after: { backupCodeUsed: true },
    });

    return true;
  },
});
