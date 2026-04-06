import { mutation, query } from "../../_generated/server";
import { ConvexError, v } from "convex/values";
import { logAction } from "../../helpers/auditLog";
import { requirePlatformRole } from "../../helpers/platformGuard";
import { requirePublisherContext } from "../../helpers/publisherGuard";
import { requireTenantContext } from "../../helpers/tenantGuard";

async function getPublisherRecord(ctx: any, publisherUserId: string) {
  return await ctx.db
    .query("publishers")
    .withIndex("by_userId", (q: any) => q.eq("userId", publisherUserId))
    .first();
}

async function getModuleByRef(ctx: any, moduleId: string) {
  const direct = await ctx.db
    .query("modules")
    .withIndex("by_slug", (q: any) => q.eq("slug", moduleId))
    .first();
  if (direct) return direct;

  const modules = await ctx.db
    .query("modules")
    .withIndex("by_publisherId", (q: any) => q.gt("publisherId", ""))
    .collect();
  return modules.find((record: any) => String(record._id) === moduleId) ?? null;
}

function generateApiKey(prefix = "edm_pub") {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

export const getPublisherPayouts = query({
  args: {},
  handler: async (ctx) => {
    const publisher = await requirePublisherContext(ctx);
    return await ctx.db
      .query("publisher_payouts")
      .withIndex("by_publisherId", (q) => q.eq("publisherId", publisher.publisherId))
      .collect();
  },
});

export const triggerPayout = mutation({
  args: {
    sessionToken: v.string(),
    publisherId: v.string(),
    amountKes: v.number(),
    periodStart: v.number(),
    periodEnd: v.number(),
    bankReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "billing_admin",
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    const now = Date.now();

    const payoutId = await ctx.db.insert("publisher_payouts", {
      publisherId: args.publisherId,
      amountKes: args.amountKes,
      periodStart: args.periodStart,
      periodEnd: args.periodEnd,
      status: "processing",
      processedAt: undefined,
      bankReference: args.bankReference,
      createdAt: now,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "billing.subscription_updated",
      entityType: "publisher_payout",
      entityId: String(payoutId),
      after: { publisherId: args.publisherId, amountKes: args.amountKes, status: "processing" },
    });

    return { success: true, payoutId };
  },
});

export const getPublisherSupportTickets = query({
  args: {
    status: v.optional(
      v.union(v.literal("open"), v.literal("in_progress"), v.literal("resolved"), v.literal("closed"))
    ),
  },
  handler: async (ctx, args) => {
    const publisher = await requirePublisherContext(ctx);
    let tickets = await ctx.db
      .query("publisher_support_tickets")
      .withIndex("by_publisherId", (q) => q.eq("publisherId", publisher.publisherId))
      .collect();

    if (args.status) {
      tickets = tickets.filter((ticket) => ticket.status === args.status);
    }

    return tickets.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const createSupportTicket = mutation({
  args: {
    moduleId: v.string(),
    subject: v.string(),
    message: v.string(),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    const module = await getModuleByRef(ctx, args.moduleId);

    if (!module) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Module not found" });
    }

    const now = Date.now();
    const ticketId = await ctx.db.insert("publisher_support_tickets", {
      publisherId: module.publisherId,
      moduleId: String(module._id),
      tenantId: tenant.tenantId,
      subject: args.subject,
      status: "open",
      priority: args.priority,
      assignedTo: undefined,
      slaDueAt: undefined,
      resolvedAt: undefined,
      thread: [
        {
          authorType: "tenant",
          authorId: tenant.userId,
          authorEmail: tenant.email,
          message: args.message,
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "support.ticket.created",
      entityType: "publisher_support_ticket",
      entityId: String(ticketId),
      after: { moduleId: String(module._id), publisherId: module.publisherId },
    });

    return { success: true, ticketId };
  },
});

export const replySupportTicket = mutation({
  args: {
    ticketId: v.id("publisher_support_tickets"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Ticket not found" });
    }

    const now = Date.now();

    try {
      const publisher = await requirePublisherContext(ctx);
      if (ticket.publisherId !== publisher.publisherId) {
        throw new ConvexError({ code: "FORBIDDEN", message: "Ticket access denied" });
      }

      await ctx.db.patch(args.ticketId, {
        status: ticket.status === "open" ? "in_progress" : ticket.status,
        thread: [
          ...(ticket.thread ?? []),
          {
            authorType: "publisher",
            authorId: publisher.userId,
            authorEmail: publisher.email,
            message: args.message,
            createdAt: now,
          },
        ],
        updatedAt: now,
      });

      return { success: true, actor: "publisher" as const };
    } catch (publisherError) {
      const tenant = await requireTenantContext(ctx);
      if (ticket.tenantId !== tenant.tenantId) {
        throw publisherError;
      }

      await ctx.db.patch(args.ticketId, {
        thread: [
          ...(ticket.thread ?? []),
          {
            authorType: "tenant",
            authorId: tenant.userId,
            authorEmail: tenant.email,
            message: args.message,
            createdAt: now,
          },
        ],
        updatedAt: now,
      });

      return { success: true, actor: "tenant" as const };
    }
  },
});

export const escalateSupportTicket = mutation({
  args: {
    sessionToken: v.string(),
    ticketId: v.id("publisher_support_tickets"),
    assignedTo: v.optional(v.string()),
    adminNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "support_agent",
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    const ticket = await ctx.db.get(args.ticketId);

    if (!ticket) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Ticket not found" });
    }

    const now = Date.now();
    await ctx.db.patch(args.ticketId, {
      status: "in_progress",
      assignedTo: args.assignedTo ?? ticket.assignedTo,
      thread: args.adminNote
        ? [
            ...(ticket.thread ?? []),
            {
              authorType: "platform",
              authorId: platform.userId,
              authorEmail: platform.email,
              message: args.adminNote,
              createdAt: now,
            },
          ]
        : ticket.thread,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "support.ticket.escalated",
      entityType: "publisher_support_ticket",
      entityId: String(args.ticketId),
      after: { assignedTo: args.assignedTo, status: "in_progress" },
    });

    return { success: true };
  },
});

export const getWebhookLogs = query({
  args: {
    status: v.optional(v.union(v.literal("delivered"), v.literal("failed"), v.literal("retrying"))),
  },
  handler: async (ctx, args) => {
    const publisher = await requirePublisherContext(ctx);
    let logs = await ctx.db
      .query("publisher_webhook_logs")
      .withIndex("by_publisherId", (q) => q.eq("publisherId", publisher.publisherId))
      .collect();

    if (args.status) {
      logs = logs.filter((log) => log.status === args.status);
    }

    return logs.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const retryWebhook = mutation({
  args: {
    logId: v.id("publisher_webhook_logs"),
  },
  handler: async (ctx, args) => {
    const publisher = await requirePublisherContext(ctx);
    const log = await ctx.db.get(args.logId);

    if (!log || log.publisherId !== publisher.publisherId) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Webhook log not found" });
    }

    await ctx.db.patch(args.logId, {
      status: "retrying",
      attempts: log.attempts + 1,
      lastAttemptAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: publisher.userId,
      actorEmail: publisher.email,
      action: "webhook.retried",
      entityType: "publisher_webhook_log",
      entityId: String(args.logId),
      after: { attempts: log.attempts + 1, status: "retrying" },
    });

    return { success: true };
  },
});

export const manageApiKeys = mutation({
  args: {
    action: v.union(v.literal("create"), v.literal("rotate"), v.literal("revoke")),
  },
  handler: async (ctx, args) => {
    const publisher = await requirePublisherContext(ctx);
    const publisherRecord = await getPublisherRecord(ctx, publisher.userId);

    if (!publisherRecord) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Publisher account not found" });
    }

    let apiKey: string | undefined = publisherRecord.apiKey;

    if (args.action === "revoke") {
      apiKey = undefined;
    } else if (args.action === "create") {
      apiKey = publisherRecord.apiKey ?? generateApiKey();
    } else {
      apiKey = generateApiKey();
    }

    await ctx.db.patch(publisherRecord._id, {
      apiKey,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: publisher.userId,
      actorEmail: publisher.email,
      action:
        args.action === "create"
          ? "api_key.created"
          : args.action === "rotate"
            ? "api_key.rotated"
            : "api_key.revoked",
      entityType: "publisher",
      entityId: String(publisherRecord._id),
      after: { action: args.action, hasApiKey: Boolean(apiKey) },
    });

    return {
      success: true,
      apiKey,
      action: args.action,
    };
  },
});
