import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { requireTenantContext, requireTenantSession } from "./helpers/tenantGuard";

async function getOwnedNotification(ctx: any, sessionToken: string, notificationId: any) {
  const session = await requireTenantSession(ctx, { sessionToken });
  const notification = await ctx.db.get(notificationId);

  if (!notification) {
    throw new ConvexError({ code: "NOT_FOUND", message: "Notification not found" });
  }

  if (notification.userId !== session.userId || notification.tenantId !== session.tenantId) {
    throw new ConvexError({ code: "FORBIDDEN", message: "Notification access denied" });
  }

  return { session, notification };
}

export const getNotifications = query({
  args: {
    sessionToken: v.string(),
    userId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await requireTenantSession(ctx, args);
    const limit = args.limit ?? 20;

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", session.userId))
      .order("desc")
      .take(limit);

    return notifications.filter((notification) => notification.tenantId === session.tenantId);
  },
});

export const getUnreadCount = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await requireTenantSession(ctx, args);

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) => q.eq("userId", session.userId).eq("isRead", false))
      .collect();

    return unread.filter((notification) => notification.tenantId === session.tenantId).length;
  },
});

export const markAsRead = mutation({
  args: {
    sessionToken: v.string(),
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const { notification } = await getOwnedNotification(ctx, args.sessionToken, args.notificationId);

    if (!notification.isRead) {
      await ctx.db.patch(args.notificationId, { isRead: true });
    }
  },
});

export const markAllAsRead = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await requireTenantSession(ctx, args);

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) => q.eq("userId", session.userId).eq("isRead", false))
      .collect();

    for (const notification of unread) {
      if (notification.tenantId !== session.tenantId) continue;
      await ctx.db.patch(notification._id, { isRead: true });
    }
  },
});

export const createNotification = mutation({
  args: {
    tenantId: v.string(),
    userId: v.string(),
    title: v.string(),
    message: v.string(),
    type: v.string(),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requireTenantContext(ctx);

    if (actor.tenantId !== args.tenantId && actor.tenantId !== "PLATFORM") {
      throw new ConvexError({ code: "FORBIDDEN", message: "Cannot create cross-tenant notification" });
    }

    return await ctx.db.insert("notifications", {
      tenantId: args.tenantId,
      userId: args.userId,
      title: args.title,
      message: args.message,
      type: args.type,
      isRead: false,
      link: args.link,
      createdAt: Date.now(),
    });
  },
});
