import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

export const listMessages = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("sent")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const limit = args.limit ?? 100;
    let messages;

    if (args.status) {
      messages = await ctx.db
        .query("platform_messages")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(limit);
    } else {
      messages = await ctx.db
        .query("platform_messages")
        .order("desc")
        .take(limit);
    }

    return messages;
  },
});

export const getMessage = query({
  args: {
    sessionToken: v.string(),
    messageId: v.id("platform_messages"),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    return await ctx.db.get(args.messageId);
  },
});

export const listCampaigns = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("paused")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const limit = args.limit ?? 50;
    let q = ctx.db
      .query("campaigns")
      .withIndex("by_platform", (q) => q.eq("isPlatformLevel", true));

    const campaigns = await q.order("desc").take(limit);

    if (args.status) {
      return campaigns.filter((c) => c.status === args.status);
    }
    return campaigns;
  },
});

export const getCampaignById = query({
  args: {
    sessionToken: v.string(),
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    return await ctx.db.get(args.campaignId);
  },
});

export const listTemplates = query({
  args: {
    sessionToken: v.string(),
    category: v.optional(v.string()),
    channel: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    // Get global (platform-level) templates
    const templates = await ctx.db
      .query("messageTemplates")
      .withIndex("by_global", (q) => q.eq("isGlobal", true).eq("status", "active"))
      .order("desc")
      .take(args.limit ?? 100);

    let results = templates;
    if (args.category) {
      results = results.filter((t) => t.category === args.category);
    }
    if (args.channel) {
      results = results.filter((t) => t.channels.includes(args.channel!));
    }
    return results;
  },
});

export const getTemplateById = query({
  args: {
    sessionToken: v.string(),
    templateId: v.id("messageTemplates"),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    return await ctx.db.get(args.templateId);
  },
});

export const getDeliveryAnalytics = query({
  args: {
    sessionToken: v.string(),
    campaignId: v.optional(v.id("campaigns")),
    dateRange: v.optional(v.object({
      start: v.number(),
      end: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    let records;
    if (args.campaignId) {
      records = await ctx.db
        .query("messageRecords")
        .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
        .collect();
    } else {
      records = await ctx.db
        .query("messageRecords")
        .withIndex("by_status", (q) => q.eq("status", "sent"))
        .order("desc")
        .take(5000);
    }

    if (args.dateRange) {
      records = records.filter(
        (r) => r.createdAt >= args.dateRange!.start && r.createdAt <= args.dateRange!.end
      );
    }

    const total = records.length;
    const sent = records.filter((r) => ["sent", "delivered", "opened", "clicked"].includes(r.status)).length;
    const delivered = records.filter((r) => ["delivered", "opened", "clicked"].includes(r.status)).length;
    const opened = records.filter((r) => ["opened", "clicked"].includes(r.status)).length;
    const clicked = records.filter((r) => r.status === "clicked").length;
    const failed = records.filter((r) => ["failed", "bounced"].includes(r.status)).length;

    // Breakdown by channel
    const channels = ["email", "sms", "push", "in_app"];
    const byChannel = channels.map((channel) => {
      const ch = records.filter((r) => r.channel === channel);
      const chSent = ch.filter((r) => ["sent", "delivered", "opened", "clicked"].includes(r.status)).length;
      const chDelivered = ch.filter((r) => ["delivered", "opened", "clicked"].includes(r.status)).length;
      const chOpened = ch.filter((r) => ["opened", "clicked"].includes(r.status)).length;
      const chClicked = ch.filter((r) => r.status === "clicked").length;
      const chFailed = ch.filter((r) => ["failed", "bounced"].includes(r.status)).length;
      return {
        channel,
        sent: chSent,
        delivered: chDelivered,
        opened: chOpened,
        clicked: chClicked,
        failed: chFailed,
        deliveryRate: chSent > 0 ? Math.round((chDelivered / chSent) * 1000) / 10 : 0,
        openRate: chDelivered > 0 ? Math.round((chOpened / chDelivered) * 1000) / 10 : 0,
        clickRate: chOpened > 0 ? Math.round((chClicked / chOpened) * 1000) / 10 : 0,
      };
    }).filter((c) => c.sent > 0);

    // Daily trend for last 30 days
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const trends = [];
    for (let i = 29; i >= 0; i--) {
      const dayStart = now - (i + 1) * dayMs;
      const dayEnd = now - i * dayMs;
      const dayRecords = records.filter((r) => r.createdAt >= dayStart && r.createdAt < dayEnd);
      const daySent = dayRecords.filter((r) => ["sent", "delivered", "opened", "clicked"].includes(r.status)).length;
      const dayDelivered = dayRecords.filter((r) => ["delivered", "opened", "clicked"].includes(r.status)).length;
      const dayOpened = dayRecords.filter((r) => ["opened", "clicked"].includes(r.status)).length;
      const dayClicked = dayRecords.filter((r) => r.status === "clicked").length;
      trends.push({
        date: new Date(dayStart).toISOString().split("T")[0],
        sent: daySent,
        delivered: dayDelivered,
        opened: dayOpened,
        clicked: dayClicked,
      });
    }

    return {
      overview: {
        totalSent: sent,
        totalDelivered: delivered,
        totalOpened: opened,
        totalClicked: clicked,
        totalFailed: failed,
        deliveryRate: sent > 0 ? Math.round((delivered / sent) * 1000) / 10 : 0,
        openRate: delivered > 0 ? Math.round((opened / delivered) * 1000) / 10 : 0,
        clickRate: opened > 0 ? Math.round((clicked / opened) * 1000) / 10 : 0,
      },
      byChannel,
      trends,
    };
  },
});

export const getRecipientLists = query({
  args: {
    sessionToken: v.string(),
    type: v.optional(v.union(v.literal("tenant"), v.literal("role"), v.literal("custom"))),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const tenants = await ctx.db.query("tenants").collect();
    const users = await ctx.db.query("users").collect();

    const activeTenants = tenants.filter((t) => t.status === "active");
    const trialTenants = tenants.filter((t) => t.status === "trial");
    const adminUsers = users.filter((u) => ["school_admin", "principal", "bursar"].includes(u.role));
    const allActiveUsers = users.filter((u) => u.isActive);

    const lists = [
      {
        _id: "list_all_admins",
        name: "All School Administrators",
        type: "role",
        description: "All users with admin roles across all tenants",
        count: adminUsers.length,
        criteria: { roles: ["school_admin", "principal", "bursar"] },
      },
      {
        _id: "list_active_tenants",
        name: "Active Schools (All Users)",
        type: "tenant",
        description: "All users from active tenant schools",
        count: allActiveUsers.filter((u) => activeTenants.some((t) => t.tenantId === u.tenantId)).length,
        criteria: { tenantStatus: "active" },
      },
      {
        _id: "list_trial_tenants",
        name: "Trial Schools (All Users)",
        type: "tenant",
        description: "All users from trial schools",
        count: users.filter((u) => trialTenants.some((t) => t.tenantId === u.tenantId)).length,
        criteria: { tenantStatus: "trial" },
      },
      {
        _id: "list_all_users",
        name: "All Platform Users",
        type: "custom",
        description: "Every active user on the platform",
        count: allActiveUsers.length,
        criteria: { type: "all" },
      },
    ];

    if (args.type) {
      return lists.filter((l) => l.type === args.type);
    }
    return lists;
  },
});
