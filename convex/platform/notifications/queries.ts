import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

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

export const listNotifications = query({
  args: {
    sessionToken: v.string(),
    unreadOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await fetchPlatformNotifications(ctx, args);
  },
});

export const getUnreadCount = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    const unread = await ctx.db
      .query("platform_notifications")
      .withIndex("by_userId_isRead", (q) =>
        q.eq("userId", session.userId).eq("isRead", false)
      )
      .collect();

    return unread.length;
  },
});

export const getMyNotifications = query({
  args: {
    sessionToken: v.string(),
    unreadOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    type: v.optional(notificationType),
  },
  handler: async (ctx, args) => {
    const notifications = await fetchPlatformNotifications(ctx, {
      sessionToken: args.sessionToken,
      unreadOnly: args.unreadOnly,
      limit: args.limit,
    });

    const filtered =
      args.type === undefined
        ? notifications
        : notifications.filter((notification: any) => notification.type === args.type);

    return {
      notifications: filtered,
      unreadCount: filtered.filter((notification: any) => !notification.isRead).length,
    };
  },
});

async function fetchPlatformNotifications(
  ctx: any,
  args: { sessionToken: string; unreadOnly?: boolean; limit?: number }
) {
  const session = await requirePlatformSession(ctx, args);

  let notifications;
  if (args.unreadOnly) {
    notifications = await ctx.db
      .query("platform_notifications")
      .withIndex("by_userId_isRead", (q: any) =>
        q.eq("userId", session.userId).eq("isRead", false)
      )
      .order("desc")
      .collect();
  } else {
    notifications = await ctx.db
      .query("platform_notifications")
      .withIndex("by_userId", (q: any) => q.eq("userId", session.userId))
      .order("desc")
      .collect();
  }

  if (args.limit) notifications = notifications.slice(0, args.limit);

  return notifications.map((notification: any) => ({
    ...notification,
    message: notification.body,
    link: notification.actionUrl,
  }));
}
