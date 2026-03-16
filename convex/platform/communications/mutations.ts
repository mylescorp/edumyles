import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { platformSessionArg, requirePlatformSession } from "../../helpers/platformGuard";

const messageTypeValidator = v.union(
  v.literal("broadcast"),
  v.literal("campaign"),
  v.literal("alert"),
  v.literal("transactional"),
  v.literal("drip_step")
);

const channelValidator = v.union(v.literal("in_app"), v.literal("email"), v.literal("sms"));

const statusValidator = v.union(
  v.literal("draft"),
  v.literal("scheduled"),
  v.literal("sending"),
  v.literal("sent"),
  v.literal("failed")
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

function normalizeString(value?: string) {
  return value?.trim() || undefined;
}

function validateMessagePayload(args: {
  subject?: string;
  emailBody?: string;
  smsBody?: string;
  inAppBody?: string;
  channels?: Array<"in_app" | "email" | "sms">;
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
  segment: {
    planTiers?: string[];
    tenantIds?: string[];
    statuses?: string[];
    counties?: string[];
    schoolTypes?: string[];
    excludeTenantIds?: string[];
  }
): Promise<string[]> {
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
  messageType: "broadcast" | "campaign" | "alert" | "transactional" | "drip_step"
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

    return await ctx.db.insert("platform_messages", {
      senderId: actor.userId,
      type: args.type,
      subject: args.subject.trim(),
      emailBody: normalizeString(args.emailBody),
      smsBody: normalizeString(args.smsBody),
      inAppBody: normalizeString(args.inAppBody),
      channels: args.channels,
      segment: args.segment,
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
    await requirePlatformSession(ctx, args);

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
      channels: args.channels ?? message.channels,
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
    if (args.segment !== undefined) patch.segment = args.segment;
    if (args.scheduledAt !== undefined) patch.scheduledAt = args.scheduledAt;
    if (args.status !== undefined) patch.status = args.status;

    await ctx.db.patch(args.messageId, patch);
    return args.messageId;
  },
});

export const deletePlatformMessage = mutation({
  args: {
    ...platformSessionArg,
    messageId: v.id("platform_messages"),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Platform message not found.");
    }

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
    await requirePlatformSession(ctx, args);

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

    return args.messageId;
  },
});

export const sendPlatformMessageNow = mutation({
  args: {
    ...platformSessionArg,
    messageId: v.id("platform_messages"),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

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
      status: "sending",
      updatedAt: Date.now(),
    });

    const tenantIds = await resolveTargetTenantIds(ctx, message.segment);
    const now = Date.now();
    let delivered = 0;

    if (message.channels.includes("in_app")) {
      const notificationType = inferNotificationType(message.type);

      for (const tenantId of tenantIds) {
        await ctx.db.insert("tenant_notifications", {
          tenantId,
          platformMessageId: args.messageId,
          type: notificationType,
          title: message.subject,
          body: message.inAppBody ?? "",
          read: false,
          ctaUrl: undefined,
          createdAt: now,
          updatedAt: now,
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
    await requirePlatformSession(ctx, args);

    const now = Date.now();

    return await ctx.db.insert("tenant_notifications", {
      tenantId: args.tenantId,
      platformMessageId: args.platformMessageId,
      type: args.type,
      title: args.title.trim(),
      body: args.body.trim(),
      read: false,
      ctaUrl: normalizeString(args.ctaUrl),
      createdAt: now,
      updatedAt: now,
    });
  },
});
