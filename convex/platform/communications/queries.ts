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

export const listPlatformMessages = query({
  args: {
    ...platformSessionArg,
    status: v.optional(statusValidator),
    type: v.optional(messageTypeValidator),
    channel: v.optional(channelValidator),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const limit = args.limit ?? 50;
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
    return await ctx.db.get(args.messageId);
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
      sent: messages.filter((m: any) => m.status === "sent").length,
      failed: messages.filter((m: any) => m.status === "failed").length,
      delivered: messages.reduce((sum: number, m: any) => sum + (m.stats?.delivered ?? 0), 0),
    };
  },
});

export const listTenantNotifications = query({
  args: {
    ...platformSessionArg,
    tenantId: v.optional(v.string()),
    read: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const limit = args.limit ?? 50;
    let notifications = await ctx.db.query("tenant_notifications").collect();

    if (args.tenantId) {
      notifications = notifications.filter((n: any) => n.tenantId === args.tenantId);
    }

    if (args.read !== undefined) {
      notifications = notifications.filter((n: any) => n.read === args.read);
    }

    return notifications.sort((a: any, b: any) => b.createdAt - a.createdAt).slice(0, limit);
  },
});
