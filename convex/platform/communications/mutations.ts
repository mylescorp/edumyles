import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { platformSessionArg, requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";

const messageTypeValidator = v.union(
  v.literal("broadcast"),
  v.literal("targeted"),
  v.literal("campaign"),
  v.literal("alert"),
  v.literal("transactional"),
  v.literal("drip_step")
);

const channelValidator = v.union(v.literal("in_app"), v.literal("email"), v.literal("sms"));

const statusValidator = v.union(
  v.literal("draft"),
  v.literal("scheduled"),
  v.literal("sent")
);

const notificationTypeValidator = v.union(
  v.literal("info"),
  v.literal("warning"),
  v.literal("success"),
  v.literal("alert")
);

const segmentValidator = v.object({
  planTiers: v.optional(v.array(v.string())),
  tenantIds: v.optional(v.array(v.string())),
  statuses: v.optional(v.array(v.string())),
  counties: v.optional(v.array(v.string())),
  schoolTypes: v.optional(v.array(v.string())),
  excludeTenantIds: v.optional(v.array(v.string())),
});

function sanitizeHtml(value?: string): string | undefined {
  if (!value) return undefined;
  
  // Basic XSS prevention - remove HTML tags and dangerous characters
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

function normalizeString(value?: string) {
  return sanitizeHtml(value?.trim() || undefined);
}

function validateMessagePayload(args: {
  subject?: string;
  emailBody?: string;
  smsBody?: string;
  inAppBody?: string;
  channels?: string[];
}) {
  const subject = args.subject?.trim() || "";
  const channels = args.channels ?? [];

  if (!subject) {
    throw new Error("Subject is required.");
  }

  if (channels.length === 0) {
    throw new Error("At least one channel must be selected.");
  }

  if (channels.includes("in_app") && !args.inAppBody?.trim()) {
    throw new Error("In-app body is required when in_app channel is selected.");
  }

  if (channels.includes("email") && !args.emailBody?.trim()) {
    throw new Error("Email body is required when email channel is selected.");
  }

  if (channels.includes("sms") && !args.smsBody?.trim()) {
    throw new Error("SMS body is required when sms channel is selected.");
  }
}

async function resolveTargetTenantIds(
  ctx: any,
  segmentValue?: string
): Promise<string[]> {
  const segment: {
    planTiers?: string[];
    tenantIds?: string[];
    statuses?: string[];
    counties?: string[];
    schoolTypes?: string[];
    excludeTenantIds?: string[];
  }
    = segmentValue ? JSON.parse(segmentValue) : {};
  const explicitTenantIds = [...new Set(segment.tenantIds ?? [])];
  const excludeTenantIds = new Set(segment.excludeTenantIds ?? []);

  if (explicitTenantIds.length > 0) {
    return explicitTenantIds.filter((tenantId) => !excludeTenantIds.has(tenantId));
  }

  let tenants = await ctx.db.query("tenants").collect();

  if (segment.planTiers?.length) {
    tenants = tenants.filter((t: any) => segment.planTiers!.includes(t.plan));
  }

  if (segment.statuses?.length) {
    tenants = tenants.filter((t: any) => segment.statuses!.includes(t.status));
  }

  if (segment.counties?.length) {
    tenants = tenants.filter((t: any) => segment.counties!.includes(t.county));
  }

  // schoolTypes intentionally not applied yet until tenant schema confirms support

  const filteredTenantIds = tenants
    .map((t: any) => String(t.tenantId))
    .filter((tenantId: string) => !excludeTenantIds.has(tenantId));

  return Array.from(new Set<string>(filteredTenantIds));
}

function inferNotificationType(
  messageType: "broadcast" | "targeted" | "campaign" | "alert" | "transactional" | "drip_step"
): "info" | "warning" | "success" | "alert" {
  if (messageType === "alert") return "alert";
  if (messageType === "transactional") return "success";
  return "info";
}

export const createPlatformMessage = mutation({
  args: {
    ...platformSessionArg,
    type: messageTypeValidator,
    subject: v.string(),
    emailBody: v.optional(v.string()),
    smsBody: v.optional(v.string()),
    inAppBody: v.optional(v.string()),
    channels: v.array(channelValidator),
    segment: segmentValidator,
    scheduledAt: v.optional(v.number()),
    status: statusValidator,
  },
  handler: async (ctx, args) => {
    const actor = await requirePlatformSession(ctx, args);

    validateMessagePayload(args);

    const now = Date.now();

    const messageId = await ctx.db.insert("platform_messages", {
      senderId: actor.userId,
      type: args.type,
      subject: args.subject.trim(),
      emailBody: normalizeString(args.emailBody) ?? "",
      smsBody: normalizeString(args.smsBody) ?? "",
      inAppBody: normalizeString(args.inAppBody) ?? "",
      channels: args.channels,
      segment: JSON.stringify(args.segment),
      scheduledAt: args.scheduledAt,
      sentAt: undefined,
      status: args.status,
      stats: {
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
      },
      createdAt: now,
      updatedAt: now,
    });

    // Log audit action
    await logAction(ctx, {
      tenantId: actor.tenantId,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "platform_message.created",
      entityType: "platform_message",
      entityId: messageId,
      after: {
        type: args.type,
        subject: args.subject.trim(),
      channels: args.channels,
      status: args.status,
      },
    });

    return messageId;
  },
});

export const updatePlatformMessage = mutation({
  args: {
    ...platformSessionArg,
    messageId: v.id("platform_messages"),
    type: v.optional(messageTypeValidator),
    subject: v.optional(v.string()),
    emailBody: v.optional(v.string()),
    smsBody: v.optional(v.string()),
    inAppBody: v.optional(v.string()),
    channels: v.optional(v.array(channelValidator)),
    segment: v.optional(segmentValidator),
    scheduledAt: v.optional(v.number()),
    status: v.optional(statusValidator),
  },
  handler: async (ctx, args) => {
    const actor = await requirePlatformSession(ctx, args);

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Platform message not found.");
    }

    if (message.status === "sent") {
      throw new Error("Sent messages cannot be edited.");
    }

    const nextPayload = {
      subject: args.subject ?? message.subject,
      emailBody: args.emailBody ?? message.emailBody,
      smsBody: args.smsBody ?? message.smsBody,
      inAppBody: args.inAppBody ?? message.inAppBody,
      channels: (args.channels ?? message.channels) as string[],
    };

    validateMessagePayload(nextPayload);

    const patch: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.type !== undefined) patch.type = args.type;
    if (args.subject !== undefined) patch.subject = args.subject.trim();
    if (args.emailBody !== undefined) patch.emailBody = normalizeString(args.emailBody);
    if (args.smsBody !== undefined) patch.smsBody = normalizeString(args.smsBody);
    if (args.inAppBody !== undefined) patch.inAppBody = normalizeString(args.inAppBody);
    if (args.channels !== undefined) patch.channels = args.channels;
    if (args.segment !== undefined) patch.segment = JSON.stringify(args.segment);
    if (args.scheduledAt !== undefined) patch.scheduledAt = args.scheduledAt;
    if (args.status !== undefined) {
      if (["sent", "sending"].includes(args.status)) {
        throw new Error("Cannot manually set status to 'sent' or 'sending'. Use the send action instead.");
      }
      patch.status = args.status;
    }

    await ctx.db.patch(args.messageId, patch);

    // Log audit action
    await logAction(ctx, {
      tenantId: actor.tenantId,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "platform_message.updated",
      entityType: "platform_message",
      entityId: args.messageId,
      before: {
        subject: message.subject,
        status: message.status,
        type: message.type,
      },
      after: {
        subject: args.subject?.trim() ?? message.subject,
        status: args.status ?? message.status,
        type: args.type ?? message.type,
      },
    });

    return args.messageId;
  },
});

export const deletePlatformMessage = mutation({
  args: {
    ...platformSessionArg,
    messageId: v.id("platform_messages"),
  },
  handler: async (ctx, args) => {
    const actor = await requirePlatformSession(ctx, args);

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Platform message not found.");
    }

    if (message.status === "sent") {
      throw new Error("Sent messages cannot be deleted.");
    }

    // Log audit action before deletion
    await logAction(ctx, {
      tenantId: actor.tenantId,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "platform_message.deleted",
      entityType: "platform_message",
      entityId: args.messageId,
      before: {
        subject: message.subject,
        status: message.status,
        type: message.type,
      },
    });

    await ctx.db.delete(args.messageId);
    return { success: true };
  },
});

export const schedulePlatformMessage = mutation({
  args: {
    ...platformSessionArg,
    messageId: v.id("platform_messages"),
    scheduledAt: v.number(),
  },
  handler: async (ctx, args) => {
    const actor = await requirePlatformSession(ctx, args);

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Platform message not found.");
    }

    if (message.status === "sent") {
      throw new Error("Sent messages cannot be scheduled.");
    }

    await ctx.db.patch(args.messageId, {
      scheduledAt: args.scheduledAt,
      status: "scheduled",
      updatedAt: Date.now(),
    });

    // Log audit action
    await logAction(ctx, {
      tenantId: actor.tenantId,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "platform_message.updated",
      entityType: "platform_message",
      entityId: args.messageId,
      before: {
        status: message.status,
        scheduledAt: message.scheduledAt,
      },
      after: {
        status: "scheduled",
        scheduledAt: args.scheduledAt,
      },
    });

    return args.messageId;
  },
});

export const sendPlatformMessageNow = mutation({
  args: {
    ...platformSessionArg,
    messageId: v.id("platform_messages"),
  },
  handler: async (ctx, args) => {
    const actor = await requirePlatformSession(ctx, args);

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Platform message not found.");
    }

    if (message.status === "sent") {
      throw new Error("This message has already been sent.");
    }

    validateMessagePayload({
      subject: message.subject,
      emailBody: message.emailBody,
      smsBody: message.smsBody,
      inAppBody: message.inAppBody,
      channels: message.channels,
    });

    await ctx.db.patch(args.messageId, {
      status: "scheduled",
      updatedAt: Date.now(),
    });

    const tenantIds = await resolveTargetTenantIds(ctx, message.segment);
    const now = Date.now();
    let delivered = 0;

    if (message.channels.includes("in_app")) {
      if (!message.inAppBody?.trim()) {
        throw new Error("In-app delivery requires an in-app body.");
      }

      const notificationType = inferNotificationType(message.type);

      for (const tenantId of tenantIds) {
        await ctx.db.insert("notifications", {
          tenantId,
          userId: `platform:${tenantId}`,
          title: message.subject,
          message: message.inAppBody,
          type: notificationType,
          isRead: false,
          link: undefined,
          createdAt: now,
        });
        delivered += 1;
      }
    }

    await ctx.db.patch(args.messageId, {
      status: "sent",
      sentAt: now,
      stats: {
        delivered,
        opened: message.stats?.opened ?? 0,
        clicked: message.stats?.clicked ?? 0,
        bounced: message.stats?.bounced ?? 0,
      },
      updatedAt: now,
    });

    // Log audit action
    await logAction(ctx, {
      tenantId: actor.tenantId,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "platform_message.sent",
      entityType: "platform_message",
      entityId: args.messageId,
      before: {
        status: message.status,
        stats: message.stats,
      },
      after: {
        status: "sent",
        delivered,
        tenantCount: tenantIds.length,
      },
    });

    return {
      success: true,
      delivered,
      tenantCount: tenantIds.length,
    };
  },
});

export const createTenantNotification = mutation({
  args: {
    ...platformSessionArg,
    tenantId: v.string(),
    type: notificationTypeValidator,
    title: v.string(),
    body: v.string(),
    ctaUrl: v.optional(v.string()),
    platformMessageId: v.optional(v.id("platform_messages")),
  },
  handler: async (ctx, args) => {
    const actor = await requirePlatformSession(ctx, args);

    const now = Date.now();

    const notificationId = await ctx.db.insert("notifications", {
      tenantId: args.tenantId,
      userId: `platform:${args.tenantId}`,
      title: args.title.trim(),
      message: args.body.trim(),
      type: args.type,
      isRead: false,
      link: normalizeString(args.ctaUrl),
      createdAt: now,
    });

    // Log audit action
    await logAction(ctx, {
      tenantId: actor.tenantId,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "platform_notification.created",
      entityType: "platform_notification",
      entityId: notificationId,
      after: {
        tenantId: args.tenantId,
        type: args.type,
        title: args.title.trim(),
        platformMessageId: args.platformMessageId,
      },
    });

    return notificationId;
  },
});
