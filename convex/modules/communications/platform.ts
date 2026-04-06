import { mutation, query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

// SECURITY: Platform-scoped functions in this file use requirePlatformSession()
// because they are called with explicit sessionToken args rather than Convex JWT auth.

// ── Campaign Mutations ──────────────────────────────────────────────

/** Create a platform-level campaign */
export const createCampaign = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    channels: v.array(v.string()),
    message: v.string(),
    subject: v.optional(v.string()),
    htmlContent: v.optional(v.string()),
    targetAudience: v.object({
      type: v.string(),
      tenantIds: v.optional(v.array(v.string())),
      roles: v.optional(v.array(v.string())),
      tenantStatuses: v.optional(v.array(v.string())),
      tenantPlans: v.optional(v.array(v.string())),
      excludeTenantIds: v.optional(v.array(v.string())),
    }),
    scheduledFor: v.optional(v.number()),
    templateId: v.optional(v.id("messageTemplates")),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);
    const now = Date.now();

    const campaignId = await ctx.db.insert("campaigns", {
      tenantId: session.tenantId,
      name: args.name,
      description: args.description,
      channels: args.channels,
      status: args.scheduledFor ? "scheduled" : "draft",
      message: args.message,
      subject: args.subject,
      htmlContent: args.htmlContent,
      templateId: args.templateId,
      targetAudience: args.targetAudience,
      scheduledFor: args.scheduledFor,
      isPlatformLevel: true,
      stats: {
        totalRecipients: 0,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        failed: 0,
        bounced: 0,
      },
      createdBy: session.userId,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, campaignId };
  },
});

/** Update a platform campaign */
export const updateCampaign = mutation({
  args: {
    sessionToken: v.string(),
    campaignId: v.id("campaigns"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    channels: v.optional(v.array(v.string())),
    message: v.optional(v.string()),
    subject: v.optional(v.string()),
    htmlContent: v.optional(v.string()),
    targetAudience: v.optional(v.object({
      type: v.string(),
      tenantIds: v.optional(v.array(v.string())),
      roles: v.optional(v.array(v.string())),
      tenantStatuses: v.optional(v.array(v.string())),
      tenantPlans: v.optional(v.array(v.string())),
      excludeTenantIds: v.optional(v.array(v.string())),
    })),
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");
    if (campaign.status === "running" || campaign.status === "completed") {
      throw new Error("Cannot edit a running or completed campaign");
    }

    const { sessionToken, campaignId, ...updates } = args;
    await ctx.db.patch(campaignId, { ...updates, updatedAt: Date.now() });
    return { success: true };
  },
});

/** Launch/start a campaign (changes status to running) */
export const launchCampaign = mutation({
  args: {
    sessionToken: v.string(),
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");
    if (campaign.status !== "draft" && campaign.status !== "scheduled") {
      throw new Error("Campaign can only be launched from draft or scheduled status");
    }

    let recipientCount = 0;
    const { targetAudience } = campaign;

    if (targetAudience.type === "all") {
      const users = await ctx.db.query("users").collect();
      recipientCount = users.length;
    } else if (targetAudience.type === "by_tenant" && targetAudience.tenantIds) {
      for (const tenantId of targetAudience.tenantIds) {
        const users = await ctx.db
          .query("users")
          .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenantId))
          .collect();
        recipientCount += users.length;
      }
    } else if (targetAudience.type === "by_role" && targetAudience.roles) {
      const users = await ctx.db.query("users").collect();
      recipientCount = users.filter((u: any) => targetAudience.roles!.includes(u.role)).length;
    }

    const now = Date.now();
    await ctx.db.patch(args.campaignId, {
      status: "running",
      startedAt: now,
      updatedAt: now,
      stats: {
        totalRecipients: recipientCount,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        failed: 0,
        bounced: 0,
      },
    });

    return { success: true, recipientCount };
  },
});

/** Pause a running campaign */
export const pauseCampaign = mutation({
  args: {
    sessionToken: v.string(),
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");
    if (campaign.status !== "running") throw new Error("Only running campaigns can be paused");

    await ctx.db.patch(args.campaignId, { status: "paused", updatedAt: Date.now() });
    return { success: true };
  },
});

/** Resume a paused campaign */
export const resumeCampaign = mutation({
  args: {
    sessionToken: v.string(),
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");
    if (campaign.status !== "paused") throw new Error("Only paused campaigns can be resumed");

    await ctx.db.patch(args.campaignId, { status: "running", updatedAt: Date.now() });
    return { success: true };
  },
});

/** Cancel a campaign */
export const cancelCampaign = mutation({
  args: {
    sessionToken: v.string(),
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");
    if (campaign.status === "completed" || campaign.status === "cancelled") {
      throw new Error("Campaign is already finished");
    }

    await ctx.db.patch(args.campaignId, { status: "cancelled", updatedAt: Date.now() });
    return { success: true };
  },
});

/** Delete a draft campaign */
export const deleteCampaign = mutation({
  args: {
    sessionToken: v.string(),
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");
    if (campaign.status !== "draft" && campaign.status !== "cancelled") {
      throw new Error("Only draft or cancelled campaigns can be deleted");
    }

    await ctx.db.delete(args.campaignId);
    return { success: true };
  },
});

// ── Template Mutations ──────────────────────────────────────────────

/** Create a platform-level (global) message template */
export const createTemplate = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    channels: v.array(v.string()),
    subject: v.optional(v.string()),
    content: v.string(),
    htmlContent: v.optional(v.string()),
    variables: v.array(v.object({
      name: v.string(),
      type: v.string(),
      defaultValue: v.optional(v.string()),
      required: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);
    const now = Date.now();

    const templateId = await ctx.db.insert("messageTemplates", {
      name: args.name,
      description: args.description,
      category: args.category,
      channels: args.channels,
      subject: args.subject,
      content: args.content,
      htmlContent: args.htmlContent,
      variables: args.variables,
      isGlobal: true,
      status: "active",
      usageCount: 0,
      createdBy: session.userId,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, templateId };
  },
});

/** Update a message template */
export const updateTemplate = mutation({
  args: {
    sessionToken: v.string(),
    templateId: v.id("messageTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    channels: v.optional(v.array(v.string())),
    subject: v.optional(v.string()),
    content: v.optional(v.string()),
    htmlContent: v.optional(v.string()),
    variables: v.optional(v.array(v.object({
      name: v.string(),
      type: v.string(),
      defaultValue: v.optional(v.string()),
      required: v.boolean(),
    }))),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");

    const { sessionToken, templateId, ...updates } = args;
    await ctx.db.patch(templateId, { ...updates, updatedAt: Date.now() });
    return { success: true };
  },
});

/** Delete a template */
export const deleteTemplate = mutation({
  args: {
    sessionToken: v.string(),
    templateId: v.id("messageTemplates"),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");

    await ctx.db.delete(args.templateId);
    return { success: true };
  },
});

// ── Broadcast Mutation ──────────────────────────────────────────────

/** Send a direct broadcast message (immediate, no campaign) */
export const sendBroadcast = mutation({
  args: {
    sessionToken: v.string(),
    channels: v.array(v.string()),
    subject: v.optional(v.string()),
    message: v.string(),
    targetAudience: v.object({
      type: v.string(),
      tenantIds: v.optional(v.array(v.string())),
      roles: v.optional(v.array(v.string())),
      tenantStatuses: v.optional(v.array(v.string())),
      tenantPlans: v.optional(v.array(v.string())),
      excludeTenantIds: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);
    const now = Date.now();

    const campaignId = await ctx.db.insert("campaigns", {
      tenantId: session.tenantId,
      name: `Broadcast - ${new Date(now).toLocaleDateString()}`,
      description: "Instant broadcast message",
      channels: args.channels,
      status: "running",
      message: args.message,
      subject: args.subject,
      targetAudience: args.targetAudience,
      isPlatformLevel: true,
      startedAt: now,
      stats: {
        totalRecipients: 0,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        failed: 0,
        bounced: 0,
      },
      createdBy: session.userId,
      createdAt: now,
      updatedAt: now,
    });

    let recipientCount = 0;
    if (args.channels.includes("in_app")) {
      let users: any[] = [];
      const { targetAudience } = args;

      if (targetAudience.type === "all") {
        users = await ctx.db.query("users").collect();
      } else if (targetAudience.type === "by_tenant" && targetAudience.tenantIds) {
        for (const tenantId of targetAudience.tenantIds) {
          const tenantUsers = await ctx.db
            .query("users")
            .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenantId))
            .collect();
          users.push(...tenantUsers);
        }
      } else if (targetAudience.type === "by_role" && targetAudience.roles) {
        const allUsers = await ctx.db.query("users").collect();
        users = allUsers.filter((u: any) => targetAudience.roles!.includes(u.role));
      }

      if (targetAudience.excludeTenantIds?.length) {
        users = users.filter((u: any) => !targetAudience.excludeTenantIds!.includes(u.tenantId));
      }

      recipientCount = users.length;

      for (const user of users) {
        await ctx.db.insert("notifications", {
          tenantId: user.tenantId ?? session.tenantId,
          userId: user.userId ?? user._id.toString(),
          title: args.subject ?? "Platform Broadcast",
          message: args.message,
          type: "broadcast",
          isRead: false,
          createdAt: now,
        });

        await ctx.db.insert("messageRecords", {
          tenantId: user.tenantId ?? session.tenantId,
          campaignId,
          channel: "in_app",
          recipientId: user.userId ?? user._id.toString(),
          content: args.message,
          status: "delivered",
          sentAt: now,
          deliveredAt: now,
          createdAt: now,
        });
      }
    }

    await ctx.db.patch(campaignId, {
      status: "completed",
      completedAt: now,
      stats: {
        totalRecipients: recipientCount,
        sent: recipientCount,
        delivered: recipientCount,
        opened: 0,
        clicked: 0,
        failed: 0,
        bounced: 0,
      },
    });

    return { success: true, campaignId, recipientCount };
  },
});

// ── Contact List Mutations ──────────────────────────────────────────

/** Create a contact/recipient list */
export const createContactList = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    type: v.string(),
    criteria: v.object({
      roles: v.optional(v.array(v.string())),
      tenantIds: v.optional(v.array(v.string())),
      tenantStatuses: v.optional(v.array(v.string())),
      tenantPlans: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);
    const now = Date.now();

    const listId = await ctx.db.insert("contactLists", {
      name: args.name,
      description: args.description,
      type: args.type,
      isPlatformLevel: true,
      criteria: args.criteria,
      memberCount: 0,
      createdBy: session.userId,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, listId };
  },
});

/** Delete a contact list */
export const deleteContactList = mutation({
  args: {
    sessionToken: v.string(),
    listId: v.id("contactLists"),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const list = await ctx.db.get(args.listId);
    if (!list) throw new Error("Contact list not found");
    await ctx.db.delete(args.listId);
    return { success: true };
  },
});

// ── Conversation Mutations ──────────────────────────────────────────

/** Create a platform conversation thread */
export const createConversation = mutation({
  args: {
    sessionToken: v.string(),
    type: v.string(),
    name: v.optional(v.string()),
    participants: v.array(v.string()),
    initialMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);
    const now = Date.now();

    const participants = Array.from(new Set([session.userId, ...args.participants]));

    const conversationId = await ctx.db.insert("conversations", {
      tenantId: session.tenantId,
      type: args.type,
      name: args.name,
      participants,
      isPlatformThread: true,
      lastMessageAt: args.initialMessage ? now : undefined,
      lastMessagePreview: args.initialMessage?.substring(0, 100),
      createdBy: session.userId,
      createdAt: now,
      updatedAt: now,
    });

    if (args.initialMessage) {
      await ctx.db.insert("directMessages", {
        tenantId: session.tenantId,
        conversationId,
        senderId: session.userId,
        senderRole: session.role,
        content: args.initialMessage,
        readBy: [session.userId],
        createdAt: now,
      });
    }

    return { success: true, conversationId };
  },
});

/** Send a message in a conversation */
export const sendMessage = mutation({
  args: {
    sessionToken: v.string(),
    conversationId: v.id("conversations"),
    content: v.string(),
    attachments: v.optional(v.array(v.object({
      name: v.string(),
      url: v.string(),
      type: v.string(),
      size: v.optional(v.number()),
    }))),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);
    const now = Date.now();

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    const messageId = await ctx.db.insert("directMessages", {
      tenantId: session.tenantId,
      conversationId: args.conversationId,
      senderId: session.userId,
      senderRole: session.role,
      content: args.content,
      attachments: args.attachments,
      readBy: [session.userId],
      createdAt: now,
    });

    await ctx.db.patch(args.conversationId, {
      lastMessageAt: now,
      lastMessagePreview: args.content.substring(0, 100),
      updatedAt: now,
    });

    return { success: true, messageId };
  },
});

// ── Campaign Queries ────────────────────────────────────────────────

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

// ── Template Queries ────────────────────────────────────────────────

/** List message templates — platform-level (isGlobal=true) */
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

    const globalTemplates = await ctx.db
      .query("messageTemplates")
      .withIndex("by_global", (q) => q.eq("isGlobal", true).eq("status", "active"))
      .collect();

    let results = globalTemplates;

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

// ── Analytics Queries ───────────────────────────────────────────────

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

    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_platform", (q) => q.eq("isPlatformLevel", true))
      .collect();

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

/** List all conversations for platform admin */
export const listPlatformConversations = query({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);
    const limit = args.limit ?? 50;

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
