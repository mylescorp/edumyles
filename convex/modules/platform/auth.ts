import { v } from "convex/values";
import { internal } from "../../_generated/api";
import { internalMutation, mutation } from "../../_generated/server";
import { logAction } from "../../helpers/auditLog";
import { createPlatformNotificationRecord } from "./notificationHelpers";

function normalizeLocation(args: {
  location?: string;
  countryCode?: string;
}) {
  if (args.location?.trim()) return args.location.trim();
  if (args.countryCode?.trim()) return args.countryCode.trim().toUpperCase();
  return "Unknown";
}

function extractDeviceLabel(userAgent?: string) {
  if (!userAgent) return "Unknown device";
  if (/iphone/i.test(userAgent)) return "iPhone";
  if (/ipad/i.test(userAgent)) return "iPad";
  if (/android/i.test(userAgent)) return "Android device";
  if (/windows/i.test(userAgent)) return "Windows browser";
  if (/mac os/i.test(userAgent)) return "Mac browser";
  if (/linux/i.test(userAgent)) return "Linux browser";
  return "Browser session";
}

async function getMasterAdminUserIds(ctx: any) {
  const platformUsers = await ctx.db
    .query("platform_users")
    .withIndex("by_role", (q: any) => q.eq("role", "master_admin"))
    .collect();

  return platformUsers
    .filter((user: any) => user.status === "active")
    .map((user: any) => user.userId)
    .filter(Boolean);
}

async function upsertPlatformSessionRecord(
  ctx: any,
  args: {
    platformUserId?: any;
    userId: string;
    workosUserId?: string;
    sessionId: string;
    sessionToken?: string;
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    countryCode?: string;
    expiresAt?: number;
    isCurrent?: boolean;
  }
) {
  const now = Date.now();
  const existing = await ctx.db
    .query("platform_sessions")
    .withIndex("by_sessionId", (q: any) => q.eq("sessionId", args.sessionId))
    .unique();

  const patch = {
    platformUserId: args.platformUserId,
    userId: args.userId,
    workosUserId: args.workosUserId,
    sessionId: args.sessionId,
    sessionToken: args.sessionToken,
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
    deviceLabel: extractDeviceLabel(args.userAgent),
    location: normalizeLocation(args),
    countryCode: args.countryCode?.trim().toUpperCase(),
    lastActiveAt: now,
    expiresAt: args.expiresAt,
    revokedAt: undefined,
    isCurrent: args.isCurrent ?? true,
    updatedAt: now,
  };

  if (existing) {
    await ctx.db.patch(existing._id, patch);
    return existing._id;
  }

  return await ctx.db.insert("platform_sessions", {
    ...patch,
    createdAt: now,
  });
}

export const recordPlatformLogin = mutation({
  args: {
    sessionToken: v.string(),
    sessionId: v.optional(v.string()),
    workosUserId: v.string(),
    email: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    location: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const platformUser = await ctx.db
      .query("platform_users")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.workosUserId))
      .unique();

    if (!platformUser) {
      return { recorded: false, reason: "platform_user_not_found" };
    }

    const previousSessions = await ctx.db
      .query("platform_sessions")
      .withIndex("by_userId", (q: any) => q.eq("userId", platformUser.userId))
      .collect();

    const previousCountry = previousSessions
      .map((session: any) => session.countryCode)
      .find((country: string | undefined) => Boolean(country));

    const sessionId = args.sessionId ?? args.sessionToken;
    await upsertPlatformSessionRecord(ctx, {
      platformUserId: platformUser._id,
      userId: platformUser.userId,
      workosUserId: args.workosUserId,
      sessionId,
      sessionToken: args.sessionToken,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      location: args.location,
      countryCode: args.countryCode,
      expiresAt: args.expiresAt,
      isCurrent: true,
    });

    const freshSessions = await ctx.db
      .query("platform_sessions")
      .withIndex("by_userId", (q: any) => q.eq("userId", platformUser.userId))
      .collect();

    await ctx.db.patch(platformUser._id, {
      lastLogin: now,
      sessionCount: freshSessions.filter((session: any) => !session.revokedAt).length,
      updatedAt: now,
    });

    if (
      args.countryCode &&
      previousCountry &&
      previousCountry !== args.countryCode.toUpperCase()
    ) {
      await ctx.scheduler.runAfter(
        0,
        internal.modules.platform.auth.alertSuspiciousLogin,
        {
          targetUserId: platformUser.userId,
          email: args.email,
          previousCountryCode: previousCountry,
          countryCode: args.countryCode.toUpperCase(),
          location: normalizeLocation(args),
          ipAddress: args.ipAddress,
        }
      );
    }

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platformUser.userId,
      actorEmail: args.email,
      action: "user.login",
      entityType: "platform_session",
      entityId: sessionId,
      after: {
        sessionId,
        ipAddress: args.ipAddress,
        countryCode: args.countryCode,
        location: normalizeLocation(args),
      },
    });

    return { recorded: true };
  },
});

export const recordPlatformActivity = mutation({
  args: {
    sessionToken: v.string(),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sessionId = args.sessionId ?? args.sessionToken;
    const session = await ctx.db
      .query("platform_sessions")
      .withIndex("by_sessionId", (q: any) => q.eq("sessionId", sessionId))
      .unique();

    if (!session || session.revokedAt) {
      return { updated: false, reason: "session_not_found" };
    }

    await ctx.db.patch(session._id, {
      lastActiveAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { updated: true };
  },
});

export const alertSuspiciousLogin = internalMutation({
  args: {
    targetUserId: v.string(),
    email: v.string(),
    previousCountryCode: v.string(),
    countryCode: v.string(),
    location: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const masterAdminIds = await getMasterAdminUserIds(ctx);
    const title = "Suspicious platform login detected";
    const body = `${args.email} signed in from ${args.countryCode} after activity from ${args.previousCountryCode}.`;

    for (const userId of masterAdminIds) {
      await createPlatformNotificationRecord(ctx, {
        userId,
        title,
        body,
        type: "security",
        actionUrl: "/platform/security",
        metadata: {
          targetUserId: args.targetUserId,
          previousCountryCode: args.previousCountryCode,
          countryCode: args.countryCode,
          location: args.location,
          ipAddress: args.ipAddress,
        },
      });
    }

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: "system",
      actorEmail: "system@edumyles.co.ke",
      action: "security.incident_created",
      entityType: "platform_user",
      entityId: args.targetUserId,
      after: {
        email: args.email,
        previousCountryCode: args.previousCountryCode,
        countryCode: args.countryCode,
        location: args.location,
        ipAddress: args.ipAddress,
      },
    });

    await ctx.scheduler.runAfter(
      0,
      internal.actions.platform.security.sendSlackSecurityAlert,
      {
        title,
        message: `${body}\nLocation: ${args.location ?? "Unknown"}\nIP: ${args.ipAddress ?? "Unknown"}`,
        metadata: {
          targetUserId: args.targetUserId,
          email: args.email,
        },
      }
    );

    return { delivered: masterAdminIds.length };
  },
});

export const runDailySecurityChecks = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;
    const masterAdminIds = await getMasterAdminUserIds(ctx);

    const platformUsers = await ctx.db.query("platform_users").collect();
    let inactiveCount = 0;
    let expiringCount = 0;

    for (const user of platformUsers) {
      if (user.status !== "active") continue;

      const sessions = await ctx.db
        .query("platform_sessions")
        .withIndex("by_userId", (q: any) => q.eq("userId", user.userId))
        .collect();

      const lastActiveAt = sessions.reduce(
        (latest: number, session: any) => Math.max(latest, session.lastActiveAt ?? 0),
        user.lastLogin ?? 0
      );

      if (lastActiveAt > 0 && lastActiveAt < ninetyDaysAgo) {
        inactiveCount += 1;
        for (const adminId of masterAdminIds) {
          await createPlatformNotificationRecord(ctx, {
            userId: adminId,
            title: "Inactive platform account",
            body: `${user.email} has been inactive for more than 90 days.`,
            type: "security",
            actionUrl: `/platform/users/${String(user._id)}`,
            metadata: { targetUserId: user.userId, lastActiveAt },
          });
        }
      }

      if (
        user.accessExpiresAt &&
        user.accessExpiresAt >= now &&
        user.accessExpiresAt <= sevenDaysFromNow
      ) {
        expiringCount += 1;
        await createPlatformNotificationRecord(ctx, {
          userId: user.userId,
          title: "Platform access expiring soon",
          body: `Your platform access expires on ${new Date(user.accessExpiresAt).toLocaleDateString("en-KE")}.`,
          type: "security",
          actionUrl: `/platform/users/${String(user._id)}`,
          metadata: { accessExpiresAt: user.accessExpiresAt },
        });
      }
    }

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: "system",
      actorEmail: "system@edumyles.co.ke",
      action: "security.incident_updated",
      entityType: "platform_security",
      entityId: "daily_checks",
      after: {
        inactiveCount,
        expiringCount,
      },
    });

    return { inactiveCount, expiringCount };
  },
});
