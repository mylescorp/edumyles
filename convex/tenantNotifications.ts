import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

async function requireTenantSession(ctx: any, args: { sessionToken: string; tenantId: string }) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("sessionToken", args.sessionToken))
    .first();

  if (!session) {
    throw new Error("UNAUTHENTICATED: Session not found");
  }

  if (session.expiresAt < Date.now()) {
    throw new Error("UNAUTHENTICATED: Session expired");
  }

  if (session.tenantId !== args.tenantId) {
    throw new Error("UNAUTHORIZED: Tenant access denied");
  }

  return session;
}

export const listMyTenantNotifications = query({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    read: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireTenantSession(ctx, args);

    const limit = Math.min(Math.max(args.limit ?? 50, 1), 100);

    let notifications = await ctx.db
      .query("tenant_notifications")
      .withIndex("by_tenant", (q: any) => q.eq("tenantId", args.tenantId))
      .collect();

    if (args.read !== undefined) {
      notifications = notifications.filter((n: any) => n.read === args.read);
    }

    return notifications.sort((a: any, b: any) => b.createdAt - a.createdAt).slice(0, limit);
  },
});

export const getMyTenantNotificationStats = query({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireTenantSession(ctx, args);

    const notifications = await ctx.db
      .query("tenant_notifications")
      .withIndex("by_tenant", (q: any) => q.eq("tenantId", args.tenantId))
      .collect();

    return {
      total: notifications.length,
      unread: notifications.filter((n: any) => !n.read).length,
      read: notifications.filter((n: any) => n.read).length,
    };
  },
});

export const markTenantNotificationAsRead = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    notificationId: v.id("tenant_notifications"),
  },
  handler: async (ctx, args) => {
    await requireTenantSession(ctx, args);

    const notification = await ctx.db.get(args.notificationId);

    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.tenantId !== args.tenantId) {
      throw new Error("UNAUTHORIZED: Notification does not belong to this tenant");
    }

    await ctx.db.patch(args.notificationId, {
      read: true,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
