import { internalMutation, mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";
import {
  createPlatformNotificationRecord,
  type PlatformNotificationKind,
} from "../../modules/platform/notificationHelpers";

const notificationType = v.union(
  v.literal("invite"),
  v.literal("rbac"),
  v.literal("crm"),
  v.literal("pm"),
  v.literal("security"),
  v.literal("billing"),
  v.literal("waitlist"),
  v.literal("system")
);

export const createNotification = mutation({
  args: {
    sessionToken: v.string(),
    targetUserId: v.string(),
    title: v.string(),
    message: v.string(),
    type: v.string(),
    actionUrl: v.optional(v.string()),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    return await createPlatformNotificationRecord(ctx, {
      userId: args.targetUserId,
      title: args.title,
      body: args.message,
      type: normalizeType(args.type),
      actionUrl: args.link ?? args.actionUrl,
    });
  },
});

export const createPlatformNotification = internalMutation({
  args: {
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    type: notificationType,
    actionUrl: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await createPlatformNotificationRecord(ctx, args);
  },
});

export const markAsRead = mutation({
  args: {
    sessionToken: v.string(),
    notificationId: v.id("platform_notifications"),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);
    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== session.userId) {
      throw new Error("Notification not found");
    }

    await ctx.db.patch(args.notificationId, { isRead: true, readAt: Date.now() });
  },
});

export const markNotificationRead = mutation({
  args: {
    sessionToken: v.string(),
    notificationId: v.id("platform_notifications"),
  },
  handler: async (ctx, args) => {
    await markNotificationReadHelper(ctx, args);
  },
});

export const markAllAsRead = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    const unread = await ctx.db
      .query("platform_notifications")
      .withIndex("by_userId_isRead", (q) =>
        q.eq("userId", session.userId).eq("isRead", false)
      )
      .collect();

    for (const notification of unread) {
      await ctx.db.patch(notification._id, { isRead: true, readAt: Date.now() });
    }
  },
});

export const markAllNotificationsRead = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await markAllNotificationsReadHelper(ctx, args);
  },
});

export const dismissNotification = mutation({
  args: {
    sessionToken: v.string(),
    notificationId: v.id("platform_notifications"),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);
    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== session.userId) {
      throw new Error("Notification not found");
    }

    await ctx.db.delete(args.notificationId);
  },
});

export const deleteNotification = mutation({
  args: {
    sessionToken: v.string(),
    notificationId: v.id("platform_notifications"),
  },
  handler: async (ctx, args) => {
    await deleteNotificationHelper(ctx, args);
  },
});

export const purgeOldNotifications = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const notifications = await ctx.db.query("platform_notifications").collect();
    let deleted = 0;

    for (const notification of notifications) {
      if (notification.createdAt < cutoff) {
        await ctx.db.delete(notification._id);
        deleted += 1;
      }
    }

    return { deleted };
  },
});

export const backfillNotificationReadAndLink = mutation({
  args: {
    sessionToken: v.string(),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const dryRun = args.dryRun ?? false;

    const notifications = await ctx.db.query("platform_notifications").collect();
    let updated = 0;
    let wouldUpdate = 0;

    for (const notification of notifications) {
      const legacy = notification as unknown as { read?: boolean; link?: string };
      const patch: { isRead?: boolean; actionUrl?: string } = {};

      if (notification.isRead === undefined) {
        patch.isRead = typeof legacy.read === "boolean" ? legacy.read : false;
      }

      if (!notification.actionUrl && typeof legacy.link === "string" && legacy.link.length > 0) {
        patch.actionUrl = legacy.link;
      }

      if (Object.keys(patch).length === 0) continue;
      if (dryRun) {
        wouldUpdate += 1;
        continue;
      }

      await ctx.db.patch(notification._id, patch);
      updated += 1;
    }

    return { scanned: notifications.length, updated, wouldUpdate, dryRun };
  },
});

function normalizeType(value: string): PlatformNotificationKind {
  if (
    value === "invite" ||
    value === "rbac" ||
    value === "crm" ||
    value === "pm" ||
    value === "security" ||
    value === "billing" ||
    value === "waitlist" ||
    value === "system"
  ) {
    return value;
  }
  return "system";
}

async function markNotificationReadHelper(
  ctx: any,
  args: { sessionToken: string; notificationId: any }
) {
  const session = await requirePlatformSession(ctx, args);
  const notification = await ctx.db.get(args.notificationId);
  if (!notification || notification.userId !== session.userId) {
    throw new Error("Notification not found");
  }
  await ctx.db.patch(args.notificationId, { isRead: true, readAt: Date.now() });
}

async function markAllNotificationsReadHelper(ctx: any, args: { sessionToken: string }) {
  const session = await requirePlatformSession(ctx, args);
  const unread = await ctx.db
    .query("platform_notifications")
    .withIndex("by_userId_isRead", (q: any) =>
      q.eq("userId", session.userId).eq("isRead", false)
    )
    .collect();

  for (const notification of unread) {
    await ctx.db.patch(notification._id, { isRead: true, readAt: Date.now() });
  }
}

async function deleteNotificationHelper(
  ctx: any,
  args: { sessionToken: string; notificationId: any }
) {
  const session = await requirePlatformSession(ctx, args);
  const notification = await ctx.db.get(args.notificationId);
  if (!notification || notification.userId !== session.userId) {
    throw new Error("Notification not found");
  }
  await ctx.db.delete(args.notificationId);
}
