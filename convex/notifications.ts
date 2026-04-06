import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { requireTenantContext, requireTenantSession } from "./helpers/tenantGuard";

async function getNotificationSession(ctx: any, sessionToken?: string) {
  return sessionToken
    ? await requireTenantSession(ctx, { sessionToken })
    : await requireTenantContext(ctx);
}

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
    sessionToken: v.optional(v.string()),
    userId: v.optional(v.string()),
    role: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await getNotificationSession(ctx, args.sessionToken);
    const limit = args.limit ?? 20;

    let targetUserId = args.userId ?? session.userId;

    if (args.role && args.role !== session.role) {
      const roleUser = await ctx.db
        .query("users")
        .withIndex("by_tenant_role", (q) => q.eq("tenantId", session.tenantId).eq("role", args.role!))
        .first();
      if (!roleUser) {
        return [];
      }
      targetUserId = roleUser.eduMylesUserId;
    }

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId))
      .order("desc")
      .take(limit);

    return notifications.filter((notification) => notification.tenantId === session.tenantId);
  },
});

export const getUnreadCount = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const session = await getNotificationSession(ctx, args.sessionToken);

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

export const markNotificationRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const session = await requireTenantContext(ctx);
    const notification = await ctx.db.get(args.notificationId);

    if (!notification) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Notification not found" });
    }

    if (notification.userId !== session.userId || notification.tenantId !== session.tenantId) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Notification access denied" });
    }

    if (!notification.isRead) {
      await ctx.db.patch(args.notificationId, { isRead: true });
    }

    return { success: true };
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

export const markAllNotificationsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const session = await requireTenantContext(ctx);

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) => q.eq("userId", session.userId).eq("isRead", false))
      .collect();

    for (const notification of unread) {
      if (notification.tenantId !== session.tenantId) continue;
      await ctx.db.patch(notification._id, { isRead: true });
    }

    return { success: true, count: unread.filter((n) => n.tenantId === session.tenantId).length };
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

export const createNotificationForRoles = mutation({
  args: {
    tenantId: v.string(),
    roles: v.array(v.string()),
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

    const users = await ctx.db
      .query("users")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    const roleSet = new Set(args.roles);
    const targetUsers = users.filter((user) => roleSet.has(user.role) && user.isActive);

    const insertedIds = [];
    for (const user of targetUsers) {
      const id = await ctx.db.insert("notifications", {
        tenantId: args.tenantId,
        userId: user.eduMylesUserId,
        title: args.title,
        message: args.message,
        type: args.type,
        isRead: false,
        link: args.link,
        createdAt: Date.now(),
      });
      insertedIds.push(id);
    }

    return { success: true, count: insertedIds.length, notificationIds: insertedIds };
  },
});
