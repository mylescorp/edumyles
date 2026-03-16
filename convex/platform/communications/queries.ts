import { v } from "convex/values";
import { query } from "../../_generated/server";
import { platformSessionArg, requirePlatformSession } from "../../helpers/platformGuard";

const statusValidator = v.union(
  v.literal("draft"),
  v.literal("scheduled"),
  v.literal("sending"),
  v.literal("sent"),
  v.literal("failed")
);

const messageTypeValidator = v.union(
  v.literal("broadcast"),
  v.literal("campaign"),
  v.literal("alert"),
  v.literal("transactional"),
  v.literal("drip_step")
);

const channelValidator = v.union(v.literal("in_app"), v.literal("email"), v.literal("sms"));

function normalizeLimit(limit?: number) {
  const value = limit ?? 50;
  return Math.min(Math.max(value, 1), 100);
}

export const listPlatformMessages = query({
  args: {
    ...platformSessionArg,
    status: v.optional(statusValidator),
    type: v.optional(messageTypeValidator),
    channel: v.optional(channelValidator),
    senderId: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const limit = normalizeLimit(args.limit);
    let messages = await ctx.db.query("platform_messages").collect();

    if (args.status) {
      messages = messages.filter((m: any) => m.status === args.status);
    }

    if (args.type) {
      messages = messages.filter((m: any) => m.type === args.type);
    }

    if (args.channel) {
      messages = messages.filter((m: any) => m.channels.includes(args.channel));
    }

    if (args.senderId) {
      messages = messages.filter((m: any) => m.senderId === args.senderId);
    }

    if (args.search?.trim()) {
      const search = args.search.trim().toLowerCase();
      messages = messages.filter((m: any) => (m.subject ?? "").toLowerCase().includes(search));
    }

    return messages.sort((a: any, b: any) => b.createdAt - a.createdAt).slice(0, limit);
  },
});

export const getPlatformMessage = query({
  args: {
    ...platformSessionArg,
    messageId: v.id("platform_messages"),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const message = await ctx.db.get(args.messageId);
    if (!message) return null;

    return message;
  },
});

export const getPlatformCommunicationStats = query({
  args: {
    ...platformSessionArg,
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const messages = await ctx.db.query("platform_messages").collect();

    return {
      total: messages.length,
      drafts: messages.filter((m: any) => m.status === "draft").length,
      scheduled: messages.filter((m: any) => m.status === "scheduled").length,
      sending: messages.filter((m: any) => m.status === "sending").length,
      sent: messages.filter((m: any) => m.status === "sent").length,
      failed: messages.filter((m: any) => m.status === "failed").length,
      delivered: messages.reduce((sum: number, m: any) => sum + (m.stats?.delivered ?? 0), 0),
      opened: messages.reduce((sum: number, m: any) => sum + (m.stats?.opened ?? 0), 0),
      clicked: messages.reduce((sum: number, m: any) => sum + (m.stats?.clicked ?? 0), 0),
      bounced: messages.reduce((sum: number, m: any) => sum + (m.stats?.bounced ?? 0), 0),
    };
  },
});

export const listTenantNotifications = query({
  args: {
    ...platformSessionArg,
    tenantId: v.optional(v.string()),
    platformMessageId: v.optional(v.id("platform_messages")),
    read: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const limit = normalizeLimit(args.limit);
    let notifications = await ctx.db.query("tenant_notifications").collect();

    if (args.tenantId) {
      notifications = notifications.filter((n: any) => n.tenantId === args.tenantId);
    }

    if (args.platformMessageId) {
      notifications = notifications.filter(
        (n: any) => n.platformMessageId === args.platformMessageId
      );
    }

    if (args.read !== undefined) {
      notifications = notifications.filter((n: any) => n.read === args.read);
    }

    return notifications.sort((a: any, b: any) => b.createdAt - a.createdAt).slice(0, limit);
  },
});

export const getTenantNotificationStats = query({
  args: {
    ...platformSessionArg,
    tenantId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    let notifications = await ctx.db.query("tenant_notifications").collect();

    if (args.tenantId) {
      notifications = notifications.filter((n: any) => n.tenantId === args.tenantId);
    }

    return {
      total: notifications.length,
      unread: notifications.filter((n: any) => !n.read).length,
      read: notifications.filter((n: any) => n.read).length,
    };
  },
});
