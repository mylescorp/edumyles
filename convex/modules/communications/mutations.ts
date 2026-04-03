import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";
import { logAction } from "../../helpers/auditLog";
import { DEFAULT_SMS_TEMPLATES, TemplateType, substituteTemplateVariables } from "./templates";

const DEFAULT_CONVERSATION_CONTACT_ROLES = [
  "school_admin",
  "principal",
  "bursar",
  "hr_manager",
  "librarian",
  "transport_manager",
  "receptionist",
];

async function resolveConversationParticipants(ctx: any, tenant: any, requestedParticipants: string[]) {
  const explicitParticipants = Array.from(
    new Set(
      requestedParticipants.filter(
        (participant) => participant && participant !== tenant.userId
      )
    )
  );

  if (explicitParticipants.length > 0) {
    return explicitParticipants;
  }

  const tenantUsers = await ctx.db
    .query("users")
    .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
    .collect();

  const schoolContacts = tenantUsers
    .filter(
      (user: any) =>
        user.isActive &&
        user._id.toString() !== tenant.userId &&
        DEFAULT_CONVERSATION_CONTACT_ROLES.includes(user.role)
    )
    .map((user: any) => user._id.toString());

  if (schoolContacts.length === 0) {
    throw new Error("No school staff contact is available yet");
  }

  return Array.from(new Set(schoolContacts));
}

async function getPushRecipientsForUsers(ctx: any, tenantId: string, userIds: string[]) {
  if (userIds.length === 0) {
    return [];
  }

  const tokens = await ctx.db
    .query("mobileDeviceTokens")
    .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenantId))
    .collect();

  return tokens
    .filter(
      (token: any) =>
        token.notificationsEnabled &&
        token.provider === "expo" &&
        userIds.includes(token.userId)
    )
    .map((token: any) => ({
      userId: token.userId,
      pushToken: token.pushToken,
      platform: token.platform,
      deviceName: token.deviceName,
    }));
}

// ─── Announcements ─────────────────────────────────────────────────

export const createAnnouncement = mutation({
  args: {
    title: v.string(),
    body: v.string(),
    audience: v.string(),
    priority: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "communications");
    requirePermission(tenant, "communications:write");

    const now = Date.now();
    const id = await ctx.db.insert("announcements", {
      tenantId: tenant.tenantId,
      title: args.title,
      body: args.body,
      audience: args.audience,
      priority: args.priority ?? "normal",
      status: args.status ?? "draft",
      createdBy: tenant.userId,
      createdAt: now,
      updatedAt: now,
    });
    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "communication.announcement_created",
      entityType: "announcement",
      entityId: id.toString(),
      after: { ...args, createdAt: now, updatedAt: now },
    });
    return id;
  },
});

export const updateAnnouncement = mutation({
  args: {
    announcementId: v.id("announcements"),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    audience: v.optional(v.string()),
    priority: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "communications");
    requirePermission(tenant, "communications:write");

    const ann = await ctx.db.get(args.announcementId);
    if (!ann || ann.tenantId !== tenant.tenantId) throw new Error("Announcement not found");

    const { announcementId, ...updates } = args;
    const nextState = { ...updates, updatedAt: Date.now() };
    await ctx.db.patch(announcementId, nextState);
    if (args.status === "published" && ann.status !== "published") {
      const publishedAt = Date.now();
      await ctx.db.patch(announcementId, { publishedAt });
      await logAction(ctx, {
        tenantId: tenant.tenantId,
        actorId: tenant.userId,
        actorEmail: tenant.email,
        action: "communication.announcement_published",
        entityType: "announcement",
        entityId: announcementId.toString(),
        before: ann,
        after: { ...ann, ...nextState, publishedAt },
      });
      return announcementId;
    }
    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "communication.announcement_updated",
      entityType: "announcement",
      entityId: announcementId.toString(),
      before: ann,
      after: { ...ann, ...nextState },
    });
    return announcementId;
  },
});

export const publishAnnouncement = mutation({
  args: { announcementId: v.id("announcements") },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "communications");
    requirePermission(tenant, "communications:write");

    const ann = await ctx.db.get(args.announcementId);
    if (!ann || ann.tenantId !== tenant.tenantId) throw new Error("Announcement not found");

    const now = Date.now();
    await ctx.db.patch(args.announcementId, {
      status: "published",
      publishedAt: now,
      updatedAt: now,
    });
    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "communication.announcement_published",
      entityType: "announcement",
      entityId: args.announcementId.toString(),
      before: ann,
      after: { ...ann, status: "published", publishedAt: now, updatedAt: now },
    });
    return args.announcementId;
  },
});

export const deleteAnnouncement = mutation({
  args: { announcementId: v.id("announcements") },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "communications");
    requirePermission(tenant, "communications:write");

    const ann = await ctx.db.get(args.announcementId);
    if (!ann || ann.tenantId !== tenant.tenantId) throw new Error("Announcement not found");

    await ctx.db.delete(args.announcementId);
    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "communication.announcement_deleted",
      entityType: "announcement",
      entityId: args.announcementId.toString(),
      before: ann,
    });
    return { success: true };
  },
});

// ─── Notifications ──────────────────────────────────────────────────

/** Create a notification (tenant-scoped). Used by broadcast/template flows. */
export const createNotification = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    message: v.string(),
    type: v.string(),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "communications");
    requirePermission(tenant, "communications:write");

    const notificationId = await ctx.db.insert("notifications", {
      tenantId: tenant.tenantId,
      userId: args.userId,
      title: args.title,
      message: args.message,
      type: args.type,
      isRead: false,
      ...(args.link ? { link: args.link } : {}),
      createdAt: Date.now(),
    });
    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "notification.created",
      entityType: "notification",
      entityId: notificationId.toString(),
      after: args,
    });
    return notificationId;
  },
});

// ─── Campaigns (Tenant-scoped) ──────────────────────────────────────

/** Create a tenant-level campaign */
export const createCampaign = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    channels: v.array(v.string()),
    message: v.string(),
    subject: v.optional(v.string()),
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
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "communications");
    requirePermission(tenant, "communications:campaigns");

    const now = Date.now();
    const campaignId = await ctx.db.insert("campaigns", {
      tenantId: tenant.tenantId,
      name: args.name,
      description: args.description,
      channels: args.channels,
      status: args.scheduledFor ? "scheduled" : "draft",
      message: args.message,
      subject: args.subject,
      templateId: args.templateId,
      targetAudience: args.targetAudience,
      scheduledFor: args.scheduledFor,
      isPlatformLevel: false,
      stats: {
        totalRecipients: 0,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        failed: 0,
        bounced: 0,
      },
      createdBy: tenant.userId,
      createdAt: now,
      updatedAt: now,
    });
    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "communication.campaign_created",
      entityType: "campaign",
      entityId: campaignId.toString(),
      after: { ...args, status: args.scheduledFor ? "scheduled" : "draft" },
    });

    return { success: true, campaignId };
  },
});

/** Launch a tenant campaign — sends in-app notifications to targeted users */
export const launchCampaign = mutation({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "communications");
    requirePermission(tenant, "communications:campaigns");

    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign || campaign.tenantId !== tenant.tenantId) throw new Error("Campaign not found");
    if (campaign.status !== "draft" && campaign.status !== "scheduled") {
      throw new Error("Campaign can only be launched from draft or scheduled status");
    }

    const now = Date.now();

    // Get tenant users based on target audience
    const allUsers = await ctx.db
      .query("users")
      .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
      .collect();

    let targetUsers = allUsers;
    if (campaign.targetAudience.type === "by_role" && campaign.targetAudience.roles) {
      targetUsers = allUsers.filter((u: any) => campaign.targetAudience.roles!.includes(u.role));
    }

    // Create in-app notifications
    if (campaign.channels.includes("in_app")) {
      for (const user of targetUsers) {
        await ctx.db.insert("notifications", {
          tenantId: tenant.tenantId,
          userId: (user as any).userId ?? (user as any)._id.toString(),
          title: campaign.subject ?? campaign.name,
          message: campaign.message,
          type: "campaign",
          isRead: false,
          createdAt: now,
        });

        await ctx.db.insert("messageRecords", {
          tenantId: tenant.tenantId,
          campaignId: args.campaignId,
          channel: "in_app",
          recipientId: (user as any).userId ?? (user as any)._id.toString(),
          content: campaign.message,
          status: "delivered",
          sentAt: now,
          deliveredAt: now,
          createdAt: now,
        });
      }
    }

    if (campaign.channels.includes("push")) {
      const pushRecipients = await getPushRecipientsForUsers(
        ctx,
        tenant.tenantId,
        targetUsers.map((user: any) => (user as any).userId ?? (user as any)._id.toString())
      );

      if (pushRecipients.length > 0) {
        await ctx.scheduler.runAfter(
          0,
          (internal as any).actions.communications.push.sendPushInternal,
          {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            recipients: pushRecipients,
            title: campaign.subject ?? campaign.name,
            body: campaign.message,
            link: `/communications/campaigns/${args.campaignId}`,
            metadata: {
              campaignId: args.campaignId.toString(),
              channel: "push",
            },
          }
        );

        for (const recipient of pushRecipients) {
          await ctx.db.insert("messageRecords", {
            tenantId: tenant.tenantId,
            campaignId: args.campaignId,
            channel: "push",
            recipientId: recipient.userId,
            content: campaign.message,
            status: "queued",
            sentAt: now,
            createdAt: now,
          });
        }
      }
    }

    await ctx.db.patch(args.campaignId, {
      status: "running",
      startedAt: now,
      updatedAt: now,
      stats: {
        totalRecipients: targetUsers.length,
        sent: targetUsers.length,
        delivered: targetUsers.length,
        opened: 0,
        clicked: 0,
        failed: 0,
        bounced: 0,
      },
    });
    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "communication.campaign_sent",
      entityType: "campaign",
      entityId: args.campaignId.toString(),
      before: campaign,
      after: {
        ...campaign,
        status: "running",
        startedAt: now,
        updatedAt: now,
        stats: {
          totalRecipients: targetUsers.length,
          sent: targetUsers.length,
          delivered: targetUsers.length,
          opened: 0,
          clicked: 0,
          failed: 0,
          bounced: 0,
        },
      },
    });

    return { success: true, recipientCount: targetUsers.length };
  },
});

/** Pause a tenant campaign */
export const pauseCampaign = mutation({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "communications");
    requirePermission(tenant, "communications:campaigns");

    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign || campaign.tenantId !== tenant.tenantId) throw new Error("Campaign not found");
    if (campaign.status !== "running") throw new Error("Only running campaigns can be paused");

    const updates = { status: "paused", updatedAt: Date.now() };
    await ctx.db.patch(args.campaignId, updates);
    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "communication.campaign_updated",
      entityType: "campaign",
      entityId: args.campaignId.toString(),
      before: campaign,
      after: { ...campaign, ...updates },
    });
    return { success: true };
  },
});

/** Delete a tenant campaign (draft/cancelled only) */
export const deleteCampaign = mutation({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "communications");
    requirePermission(tenant, "communications:campaigns");

    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign || campaign.tenantId !== tenant.tenantId) throw new Error("Campaign not found");
    if (campaign.status !== "draft" && campaign.status !== "cancelled") {
      throw new Error("Only draft or cancelled campaigns can be deleted");
    }

    await ctx.db.delete(args.campaignId);
    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "communication.campaign_deleted",
      entityType: "campaign",
      entityId: args.campaignId.toString(),
      before: campaign,
    });
    return { success: true };
  },
});

// ─── Templates (Tenant-scoped) ─────────────────────────────────────

/** Create a tenant-level message template */
export const createTemplate = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    channels: v.array(v.string()),
    subject: v.optional(v.string()),
    content: v.string(),
    variables: v.array(
      v.object({
        name: v.string(),
        type: v.string(),
        defaultValue: v.optional(v.string()),
        required: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "communications");
    requirePermission(tenant, "communications:templates");

    const now = Date.now();
    const templateId = await ctx.db.insert("messageTemplates", {
      tenantId: tenant.tenantId,
      name: args.name,
      description: args.description,
      category: args.category,
      channels: args.channels,
      subject: args.subject,
      content: args.content,
      variables: args.variables,
      isGlobal: false,
      status: "active",
      usageCount: 0,
      createdBy: tenant.userId,
      createdAt: now,
      updatedAt: now,
    });
    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "communication.template_created",
      entityType: "messageTemplate",
      entityId: templateId.toString(),
      after: args,
    });

    return { success: true, templateId };
  },
});

/** Update a tenant template */
export const updateTemplate = mutation({
  args: {
    templateId: v.id("messageTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    channels: v.optional(v.array(v.string())),
    subject: v.optional(v.string()),
    content: v.optional(v.string()),
    variables: v.optional(
      v.array(
        v.object({
          name: v.string(),
          type: v.string(),
          defaultValue: v.optional(v.string()),
          required: v.boolean(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "communications");
    requirePermission(tenant, "communications:templates");

    const template = await ctx.db.get(args.templateId);
    if (!template || template.tenantId !== tenant.tenantId) throw new Error("Template not found");

    const { templateId, ...updates } = args;
    const nextState = { ...updates, updatedAt: Date.now() };
    await ctx.db.patch(templateId, nextState);
    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "communication.template_updated",
      entityType: "messageTemplate",
      entityId: templateId.toString(),
      before: template,
      after: { ...template, ...nextState },
    });
    return { success: true };
  },
});

/** Delete a tenant template */
export const deleteTemplate = mutation({
  args: { templateId: v.id("messageTemplates") },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "communications");
    requirePermission(tenant, "communications:templates");

    const template = await ctx.db.get(args.templateId);
    if (!template || template.tenantId !== tenant.tenantId) throw new Error("Template not found");
    if (template.isGlobal) throw new Error("Cannot delete a global template from tenant level");

    await ctx.db.delete(args.templateId);
    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "communication.template_deleted",
      entityType: "messageTemplate",
      entityId: args.templateId.toString(),
      before: template,
    });
    return { success: true };
  },
});

// ─── Direct Messaging (Tenant-scoped) ──────────────────────────────

/** Create a conversation */
export const createConversation = mutation({
  args: {
    type: v.string(), // direct | group
    name: v.optional(v.string()),
    participants: v.array(v.string()),
    initialMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "communications");
    requirePermission(tenant, "communications:messaging");

    const now = Date.now();
    const resolvedParticipants = await resolveConversationParticipants(
      ctx,
      tenant,
      args.participants
    );
    const participants: string[] = Array.from(
      new Set<string>([String(tenant.userId), ...resolvedParticipants.map(String)])
    );

    const conversationId = await ctx.db.insert("conversations", {
      tenantId: tenant.tenantId,
      type: args.type,
      name: args.name,
      participants,
      lastMessageAt: args.initialMessage ? now : undefined,
      lastMessagePreview: args.initialMessage?.substring(0, 100),
      createdBy: tenant.userId,
      createdAt: now,
      updatedAt: now,
    });

    if (args.initialMessage) {
      await ctx.db.insert("directMessages", {
        tenantId: tenant.tenantId,
        conversationId,
        senderId: tenant.userId,
        senderRole: tenant.role,
        content: args.initialMessage,
        readBy: [tenant.userId],
        createdAt: now,
      });
    }
    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "communication.conversation_created",
      entityType: "conversation",
      entityId: conversationId.toString(),
      after: {
        type: args.type,
        name: args.name,
        participants,
        hasInitialMessage: Boolean(args.initialMessage),
      },
    });

    return { success: true, conversationId };
  },
});

/** Send a message in a conversation */
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    attachments: v.optional(
      v.array(
        v.object({
          name: v.string(),
          url: v.string(),
          type: v.string(),
          size: v.optional(v.number()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "communications");
    requirePermission(tenant, "communications:messaging");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || !conversation.participants.includes(tenant.userId)) {
      throw new Error("Conversation not found or access denied");
    }

    const now = Date.now();
    const messageId = await ctx.db.insert("directMessages", {
      tenantId: tenant.tenantId,
      conversationId: args.conversationId,
      senderId: tenant.userId,
      senderRole: tenant.role,
      content: args.content,
      attachments: args.attachments,
      readBy: [tenant.userId],
      createdAt: now,
    });

    await ctx.db.patch(args.conversationId, {
      lastMessageAt: now,
      lastMessagePreview: args.content.substring(0, 100),
      updatedAt: now,
    });

    // Create notifications for other participants
    for (const participantId of conversation.participants) {
      if (participantId !== tenant.userId) {
        await ctx.db.insert("notifications", {
          tenantId: tenant.tenantId,
          userId: participantId,
          title: "New Message",
          message: args.content.substring(0, 100),
          type: "message",
          isRead: false,
          link: `/communications/messages/${args.conversationId}`,
          createdAt: now,
        });
      }
    }
    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "message.sent",
      entityType: "directMessage",
      entityId: messageId.toString(),
      after: {
        conversationId: args.conversationId,
        content: args.content,
        attachmentCount: args.attachments?.length ?? 0,
      },
    });

    return { success: true, messageId };
  },
});

/** Mark messages as read in a conversation */
export const markConversationRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "communications");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || !conversation.participants.includes(tenant.userId)) {
      throw new Error("Conversation not found");
    }

    const messages = await ctx.db
      .query("directMessages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    for (const msg of messages) {
      if (!msg.readBy?.includes(tenant.userId)) {
        await ctx.db.patch(msg._id, {
          readBy: [...(msg.readBy ?? []), tenant.userId],
        });
      }
    }

    return { success: true };
  },
});

// ─── Notification Preferences ───────────────────────────────────────

/** Update notification preferences */
export const updateNotificationPreferences = mutation({
  args: {
    emailEnabled: v.optional(v.boolean()),
    smsEnabled: v.optional(v.boolean()),
    pushEnabled: v.optional(v.boolean()),
    inAppEnabled: v.optional(v.boolean()),
    quietHoursStart: v.optional(v.string()),
    quietHoursEnd: v.optional(v.string()),
    categories: v.optional(
      v.object({
        announcements: v.optional(v.boolean()),
        academic: v.optional(v.boolean()),
        finance: v.optional(v.boolean()),
        system: v.optional(v.boolean()),
        marketing: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    const now = Date.now();

    const existing = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", tenant.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now });
      await logAction(ctx, {
        tenantId: tenant.tenantId,
        actorId: tenant.userId,
        actorEmail: tenant.email,
        action: "settings.updated",
        entityType: "notificationPreferences",
        entityId: existing._id.toString(),
        before: existing,
        after: { ...existing, ...args, updatedAt: now },
      });
    } else {
      const preferenceId = await ctx.db.insert("notificationPreferences", {
        tenantId: tenant.tenantId,
        userId: tenant.userId,
        emailEnabled: args.emailEnabled ?? true,
        smsEnabled: args.smsEnabled ?? true,
        pushEnabled: args.pushEnabled ?? true,
        inAppEnabled: args.inAppEnabled ?? true,
        quietHoursStart: args.quietHoursStart,
        quietHoursEnd: args.quietHoursEnd,
        categories: args.categories,
        createdAt: now,
        updatedAt: now,
      });
      await logAction(ctx, {
        tenantId: tenant.tenantId,
        actorId: tenant.userId,
        actorEmail: tenant.email,
        action: "settings.updated",
        entityType: "notificationPreferences",
        entityId: preferenceId.toString(),
        after: {
          emailEnabled: args.emailEnabled ?? true,
          smsEnabled: args.smsEnabled ?? true,
          pushEnabled: args.pushEnabled ?? true,
          inAppEnabled: args.inAppEnabled ?? true,
          quietHoursStart: args.quietHoursStart,
          quietHoursEnd: args.quietHoursEnd,
          categories: args.categories,
        },
      });
    }

    return { success: true };
  },
});

/** Send a tenant broadcast to targeted users within the school */
export const sendBroadcast = mutation({
  args: {
    channels: v.array(v.string()),
    subject: v.optional(v.string()),
    message: v.string(),
    audience: v.string(), // all | students | parents | staff | teachers
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "communications");
    requirePermission(tenant, "communications:broadcast");

    const now = Date.now();

    // Get tenant users
    const allUsers = await ctx.db
      .query("users")
      .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
      .collect();

    let targetUsers = allUsers;
    if (args.audience !== "all") {
      const roleMap: Record<string, string[]> = {
        students: ["student"],
        parents: ["parent"],
        staff: [
          "school_admin",
          "principal",
          "bursar",
          "hr_manager",
          "librarian",
          "transport_manager",
        ],
        teachers: ["teacher"],
      };
      const targetRoles = roleMap[args.audience] ?? [];
      targetUsers = allUsers.filter((u: any) => targetRoles.includes(u.role));
    }

    // Create campaign for tracking
    const campaignId = await ctx.db.insert("campaigns", {
      tenantId: tenant.tenantId,
      name: args.subject ?? `Broadcast to ${args.audience}`,
      description: `Quick broadcast - ${args.audience}`,
      channels: args.channels,
      status: "completed",
      message: args.message,
      subject: args.subject,
      targetAudience: { type: args.audience === "all" ? "all" : "by_role" },
      isPlatformLevel: false,
      startedAt: now,
      completedAt: now,
      stats: {
        totalRecipients: targetUsers.length,
        sent: targetUsers.length,
        delivered: targetUsers.length,
        opened: 0,
        clicked: 0,
        failed: 0,
        bounced: 0,
      },
      createdBy: tenant.userId,
      createdAt: now,
      updatedAt: now,
    });

    // Create in-app notifications
    if (args.channels.includes("in_app")) {
      for (const user of targetUsers) {
        await ctx.db.insert("notifications", {
          tenantId: tenant.tenantId,
          userId: (user as any).userId ?? (user as any)._id.toString(),
          title: args.subject ?? "Broadcast",
          message: args.message,
          type: "broadcast",
          isRead: false,
          createdAt: now,
        });
      }
    }

    if (args.channels.includes("push")) {
      const pushRecipients = await getPushRecipientsForUsers(
        ctx,
        tenant.tenantId,
        targetUsers.map((user: any) => (user as any).userId ?? (user as any)._id.toString())
      );

      if (pushRecipients.length > 0) {
        await ctx.scheduler.runAfter(
          0,
          (internal as any).actions.communications.push.sendPushInternal,
          {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            recipients: pushRecipients,
            title: args.subject ?? "Broadcast",
            body: args.message,
            link: "/communications",
            metadata: {
              campaignId: campaignId.toString(),
              audience: args.audience,
              channel: "push",
            },
          }
        );

        for (const recipient of pushRecipients) {
          await ctx.db.insert("messageRecords", {
            tenantId: tenant.tenantId,
            campaignId,
            channel: "push",
            recipientId: recipient.userId,
            content: args.message,
            status: "queued",
            sentAt: now,
            createdAt: now,
          });
        }
      }
    }
    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "communication.broadcast_sent",
      entityType: "campaign",
      entityId: campaignId.toString(),
      after: {
        audience: args.audience,
        channels: args.channels,
        recipientCount: targetUsers.length,
      },
    });

    return { success: true, campaignId, recipientCount: targetUsers.length };
  },
});

// ─── SMS Templates ─────────────────────────────────────────────────────

export const createSMSTemplate = mutation({
  args: {
    type: v.optional(v.string()),
    name: v.string(),
    content: v.optional(v.string()),
    body: v.optional(v.string()),
    variables: v.array(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "communications");
    requirePermission(tenant, "communications:templates");

    const now = Date.now();
    const id = await ctx.db.insert("smsTemplates", {
      tenantId: tenant.tenantId,
      name: args.name,
      body: args.body ?? args.content ?? "",
      variables: args.variables,
      category: args.type ?? "general",
      createdBy: tenant.userId,
      createdAt: now,
      updatedAt: now,
    });
    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "communication.template_created",
      entityType: "smsTemplate",
      entityId: id.toString(),
      after: {
        name: args.name,
        body: args.body ?? args.content ?? "",
        variables: args.variables,
        category: args.type ?? "general",
      },
    });
    return id;
  },
});

export const updateSMSTemplate = mutation({
  args: {
    templateId: v.id("smsTemplates"),
    name: v.optional(v.string()),
    content: v.optional(v.string()),
    body: v.optional(v.string()),
    variables: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "communications");
    requirePermission(tenant, "communications:templates");

    const template = await ctx.db.get(args.templateId);
    if (!template || template.tenantId !== tenant.tenantId) {
      throw new Error("Template not found or access denied");
    }

    const updates: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.content !== undefined) updates.body = args.content;
    if (args.body !== undefined) updates.body = args.body;
    if (args.variables !== undefined) updates.variables = args.variables;

    await ctx.db.patch(args.templateId, updates);
    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "communication.template_updated",
      entityType: "smsTemplate",
      entityId: args.templateId.toString(),
      before: template,
      after: { ...template, ...updates },
    });
    return args.templateId;
  },
});

export const initializeDefaultSMSTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "communications");
    requirePermission(tenant, "communications:templates");

    const now = Date.now();
    let initialized = 0;
    for (const [type, defaultTemplate] of Object.entries(DEFAULT_SMS_TEMPLATES)) {
      const existingTemplates = await ctx.db
        .query("smsTemplates")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
        .collect();
      const existing = existingTemplates.find((template) => template.category === type);

      if (!existing) {
        const templateId = await ctx.db.insert("smsTemplates", {
          tenantId: tenant.tenantId,
          name: defaultTemplate.name,
          body: defaultTemplate.content,
          variables: defaultTemplate.variables,
          category: type as TemplateType,
          createdBy: tenant.userId,
          createdAt: now,
          updatedAt: now,
        });
        initialized += 1;
        await logAction(ctx, {
          tenantId: tenant.tenantId,
          actorId: tenant.userId,
          actorEmail: tenant.email,
          action: "communication.template_created",
          entityType: "smsTemplate",
          entityId: templateId.toString(),
          after: {
            name: defaultTemplate.name,
            body: defaultTemplate.content,
            variables: defaultTemplate.variables,
            category: type,
          },
        });
      }
    }

    return { success: true, initialized };
  },
});

// ─── Email Templates ────────────────────────────────────────────────────

export const createEmailTemplate = mutation({
  args: {
    name: v.string(),
    subject: v.string(),
    body: v.string(),
    variables: v.array(v.string()),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "communications");
    requirePermission(tenant, "communications:templates");

    const now = Date.now();
    const id = await ctx.db.insert("emailTemplates", {
      tenantId: tenant.tenantId,
      name: args.name,
      subject: args.subject,
      body: args.body,
      variables: args.variables,
      category: args.category,
      createdBy: tenant.userId,
      createdAt: now,
      updatedAt: now,
    });
    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "communication.template_created",
      entityType: "emailTemplate",
      entityId: id.toString(),
      after: args,
    });
    return id;
  },
});

export const updateEmailTemplate = mutation({
  args: {
    templateId: v.id("emailTemplates"),
    name: v.optional(v.string()),
    subject: v.optional(v.string()),
    body: v.optional(v.string()),
    variables: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "communications");
    requirePermission(tenant, "communications:templates");

    const template = await ctx.db.get(args.templateId);
    if (!template || template.tenantId !== tenant.tenantId) {
      throw new Error("Template not found or access denied");
    }

    const updates: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.subject !== undefined) updates.subject = args.subject;
    if (args.body !== undefined) updates.body = args.body;
    if (args.variables !== undefined) updates.variables = args.variables;
    if (args.category !== undefined) updates.category = args.category;

    await ctx.db.patch(args.templateId, updates);
    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "communication.template_updated",
      entityType: "emailTemplate",
      entityId: args.templateId.toString(),
      before: template,
      after: { ...template, ...updates },
    });
    return args.templateId;
  },
});

