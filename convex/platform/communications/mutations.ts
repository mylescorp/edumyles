import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

export const createCampaign = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    channels: v.array(v.string()),
    message: v.string(),
    subject: v.optional(v.string()),
    targetAudience: v.object({
      type: v.optional(v.string()),
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
      name: args.name,
      description: args.description,
      channels: args.channels,
      message: args.message,
      subject: args.subject,
      templateId: args.templateId,
      targetAudience: {
        type: args.targetAudience.type ?? "custom",
        tenantIds: args.targetAudience.tenantIds,
        roles: args.targetAudience.roles,
        tenantStatuses: args.targetAudience.tenantStatuses,
        tenantPlans: args.targetAudience.tenantPlans,
        excludeTenantIds: args.targetAudience.excludeTenantIds,
      },
      scheduledFor: args.scheduledFor,
      status: args.scheduledFor ? "scheduled" : "draft",
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

export const updateCampaign = mutation({
  args: {
    sessionToken: v.string(),
    campaignId: v.id("campaigns"),
    updates: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      message: v.optional(v.string()),
      subject: v.optional(v.string()),
      status: v.optional(v.string()),
      scheduledFor: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");

    await ctx.db.patch(args.campaignId, {
      ...args.updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const sendBroadcast = mutation({
  args: {
    sessionToken: v.string(),
    campaignId: v.id("campaigns"),
    channels: v.array(v.string()),
    message: v.string(),
    recipients: v.array(v.object({
      userId: v.string(),
      tenantId: v.string(),
      email: v.string(),
      phone: v.optional(v.string()),
    })),
    sendImmediately: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const now = Date.now();
    let queued = 0;

    // Insert a messageRecord for each recipient × channel
    for (const recipient of args.recipients) {
      for (const channel of args.channels) {
        if (channel === "sms" && !recipient.phone) continue;
        await ctx.db.insert("messageRecords", {
          tenantId: recipient.tenantId,
          campaignId: args.campaignId,
          channel,
          recipientId: recipient.userId,
          recipientEmail: recipient.email,
          recipientPhone: recipient.phone,
          content: args.message,
          status: "queued",
          createdAt: now,
        });
        queued++;
      }
    }

    // Update campaign stats and status
    await ctx.db.patch(args.campaignId, {
      status: args.sendImmediately ? "running" : "scheduled",
      startedAt: args.sendImmediately ? now : undefined,
      stats: {
        totalRecipients: args.recipients.length,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        failed: 0,
        bounced: 0,
      },
      updatedAt: now,
    });

    return {
      success: true,
      results: args.channels.map((channel) => ({
        channel,
        queued: args.recipients.filter((r) => channel !== "sms" || !!r.phone).length,
        messageId: `msg_${now}_${channel}`,
      })),
    };
  },
});

export const sendCampaign = mutation({
  args: {
    sessionToken: v.string(),
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");
    if (campaign.status === "completed") throw new Error("Campaign already completed");

    const now = Date.now();
    await ctx.db.patch(args.campaignId, {
      status: "running",
      startedAt: now,
      updatedAt: now,
    });

    return { success: true, message: "Campaign sent" };
  },
});

export const deleteCampaign = mutation({
  args: {
    sessionToken: v.string(),
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");
    if (campaign.status === "running") throw new Error("Cannot delete a running campaign");

    await ctx.db.delete(args.campaignId);

    return { success: true, message: "Campaign deleted" };
  },
});

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

export const updateTemplate = mutation({
  args: {
    sessionToken: v.string(),
    templateId: v.id("messageTemplates"),
    updates: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      content: v.optional(v.string()),
      htmlContent: v.optional(v.string()),
      subject: v.optional(v.string()),
      status: v.optional(v.string()),
      variables: v.optional(v.array(v.object({
        name: v.string(),
        type: v.string(),
        defaultValue: v.optional(v.string()),
        required: v.boolean(),
      }))),
    }),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");

    await ctx.db.patch(args.templateId, {
      ...args.updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const deleteTemplate = mutation({
  args: {
    sessionToken: v.string(),
    templateId: v.id("messageTemplates"),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");

    // Soft delete — mark as archived rather than deleting
    await ctx.db.patch(args.templateId, {
      status: "archived",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const duplicateTemplate = mutation({
  args: {
    sessionToken: v.string(),
    templateId: v.id("messageTemplates"),
    newName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");

    const now = Date.now();
    const newTemplateId = await ctx.db.insert("messageTemplates", {
      tenantId: template.tenantId,
      name: args.newName ?? `${template.name} (Copy)`,
      description: template.description,
      category: template.category,
      channels: template.channels,
      subject: template.subject,
      content: template.content,
      htmlContent: template.htmlContent,
      variables: template.variables,
      isGlobal: template.isGlobal,
      status: "draft",
      usageCount: 0,
      createdBy: session.userId,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, templateId: newTemplateId, message: "Template duplicated" };
  },
});
