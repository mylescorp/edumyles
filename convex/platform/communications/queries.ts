import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

/** List campaigns — platform-level (isPlatformLevel=true) */
export const listCampaigns = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("paused"),
      v.literal("cancelled")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const limit = args.limit ?? 50;

    let results;
    if (args.status) {
      results = await ctx.db
        .query("campaigns")
        .withIndex("by_platform", (q) =>
          q.eq("isPlatformLevel", true).eq("status", args.status!)
        )
        .collect();
    } else {
      results = await ctx.db
        .query("campaigns")
        .withIndex("by_platform", (q) => q.eq("isPlatformLevel", true))
        .collect();
    }

    return results.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  },
});

export const getCampaignById = query({
  args: {
    sessionToken: v.string(),
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) return null;
    return campaign;
  },
});

/** List message templates — platform-level (isGlobal=true) + all tenant templates */
export const listTemplates = query({
  args: {
    sessionToken: v.string(),
    category: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const limit = args.limit ?? 50;

    // Get global templates
    const globalTemplates = await ctx.db
      .query("messageTemplates")
      .withIndex("by_global", (q) => q.eq("isGlobal", true).eq("status", "active"))
      .collect();

    let results = globalTemplates;

    // Filter by category if provided
    if (args.category) {
      results = results.filter((t) => t.category === args.category);
    }

    return results.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
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

/** Delivery analytics across all platform campaigns */
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

    // Get all platform campaigns
    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_platform", (q) => q.eq("isPlatformLevel", true))
      .collect();

    // Aggregate stats from campaigns
    const overview = {
      totalSent: 0,
      totalDelivered: 0,
      totalOpened: 0,
      totalClicked: 0,
      totalFailed: 0,
      totalBounced: 0,
      deliveryRate: 0,
      openRate: 0,
      clickRate: 0,
    };

    const channelStats: Record<string, { sent: number; delivered: number; opened: number; clicked: number; failed: number }> = {
      email: { sent: 0, delivered: 0, opened: 0, clicked: 0, failed: 0 },
      sms: { sent: 0, delivered: 0, opened: 0, clicked: 0, failed: 0 },
      push: { sent: 0, delivered: 0, opened: 0, clicked: 0, failed: 0 },
      in_app: { sent: 0, delivered: 0, opened: 0, clicked: 0, failed: 0 },
    };

    for (const campaign of campaigns) {
      if (campaign.stats) {
        overview.totalSent += campaign.stats.sent;
        overview.totalDelivered += campaign.stats.delivered;
        overview.totalOpened += campaign.stats.opened;
        overview.totalClicked += campaign.stats.clicked;
        overview.totalFailed += campaign.stats.failed;
        overview.totalBounced += campaign.stats.bounced;
      }
    }

    // Get message records for channel breakdown
    if (args.campaignId) {
      const records = await ctx.db
        .query("messageRecords")
        .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId!))
        .collect();

      for (const record of records) {
        const ch = channelStats[record.channel];
        if (!ch) continue;
        ch.sent++;
        if (record.status === "delivered" || record.status === "opened" || record.status === "clicked") ch.delivered++;
        if (record.status === "opened" || record.status === "clicked") ch.opened++;
        if (record.status === "clicked") ch.clicked++;
        if (record.status === "failed") ch.failed++;
      }
    }

    if (overview.totalSent > 0) {
      overview.deliveryRate = Math.round((overview.totalDelivered / overview.totalSent) * 1000) / 10;
      overview.openRate = Math.round((overview.totalOpened / overview.totalDelivered) * 1000) / 10;
      overview.clickRate = Math.round((overview.totalClicked / overview.totalOpened) * 1000) / 10;
    }

    const byChannel = Object.entries(channelStats)
      .filter(([, stats]) => stats.sent > 0)
      .map(([channel, stats]) => ({
        channel,
        ...stats,
        deliveryRate: stats.sent > 0 ? Math.round((stats.delivered / stats.sent) * 1000) / 10 : 0,
        openRate: stats.delivered > 0 ? Math.round((stats.opened / stats.delivered) * 1000) / 10 : 0,
        clickRate: stats.opened > 0 ? Math.round((stats.clicked / stats.opened) * 1000) / 10 : 0,
      }));

    return { overview, byChannel, campaignCount: campaigns.length };
  },
});

/** Get recipient lists — platform-level */
export const getRecipientLists = query({
  args: {
    sessionToken: v.string(),
    type: v.optional(v.union(v.literal("tenant"), v.literal("role"), v.literal("custom"), v.literal("dynamic"))),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const lists = await ctx.db
      .query("contactLists")
      .withIndex("by_platform", (q) => q.eq("isPlatformLevel", true))
      .collect();

    if (args.type) {
      return lists.filter((l) => l.type === args.type);
    }
    return lists;
  },
});

/** Platform-wide communication stats overview */
export const getPlatformCommStats = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_platform", (q) => q.eq("isPlatformLevel", true))
      .collect();

    const templates = await ctx.db
      .query("messageTemplates")
      .withIndex("by_global", (q) => q.eq("isGlobal", true).eq("status", "active"))
      .collect();

    const contactLists = await ctx.db
      .query("contactLists")
      .withIndex("by_platform", (q) => q.eq("isPlatformLevel", true))
      .collect();

    // Aggregate campaign stats
    let totalSent = 0;
    let totalDelivered = 0;
    let totalRecipients = 0;
    const activeCampaigns = campaigns.filter((c) => c.status === "running").length;
    const scheduledCampaigns = campaigns.filter((c) => c.status === "scheduled").length;

    for (const campaign of campaigns) {
      if (campaign.stats) {
        totalSent += campaign.stats.sent;
        totalDelivered += campaign.stats.delivered;
        totalRecipients += campaign.stats.totalRecipients;
      }
    }

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns,
      scheduledCampaigns,
      totalTemplates: templates.length,
      totalContactLists: contactLists.length,
      totalSent,
      totalDelivered,
      totalRecipients,
      deliveryRate: totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0,
    };
  },
});

/** List all conversations for platform admin (cross-tenant support threads) */
export const listPlatformConversations = query({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);
    const limit = args.limit ?? 50;

    // Get platform threads and conversations the admin is part of
    const platformThreads = await ctx.db
      .query("conversations")
      .withIndex("by_platform", (q) => q.eq("isPlatformThread", true))
      .collect();

    return platformThreads
      .sort((a, b) => (b.lastMessageAt ?? b.createdAt) - (a.lastMessageAt ?? a.createdAt))
      .slice(0, limit);
  },
});

/** List all tenants for audience targeting */
export const listTenantsForTargeting = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const tenants = await ctx.db.query("tenants").collect();
    return tenants.map((t) => ({
      tenantId: t.tenantId,
      name: t.name,
      plan: t.plan,
      status: t.status,
      county: t.county,
    }));
  },
});
