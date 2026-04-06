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
    const user = await resolveOrCreateUserBySession(ctx, session);
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

    const user = await resolveUserBySession(ctx, session);
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

    const user = await resolveOrCreateUserBySession(ctx, session);
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
      entityId: user.eduMylesUserId,
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

    const user = await resolveOrCreateUserBySession(ctx, session);
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
      entityId: user.eduMylesUserId,
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

    const user = await resolveUserBySession(ctx, session);
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
      entityId: user.eduMylesUserId,
      after: { backupCodeUsed: true },
    });

    return true;
  },
});
