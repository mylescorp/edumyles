import { mutation, query } from "../../_generated/server";
import { ConvexError, v } from "convex/values";
import { logAction } from "../../helpers/auditLog";
import { requirePlatformRole, requirePlatformSession } from "../../helpers/platformGuard";
import { requireTenantContext } from "../../helpers/tenantGuard";

async function getSupportTicketRecord(ctx: any, ticketId: string) {
  return (await ctx.db.get(ticketId as any)) as any;
}

export const getSupportTickets = query({
  args: {
    sessionToken: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("open"), v.literal("in_progress"), v.literal("resolved"), v.literal("closed"))
    ),
  },
    handler: async (ctx, args) => {
      if (args.sessionToken) {
        await requirePlatformRole(ctx, { sessionToken: args.sessionToken }, [
          "support_agent",
          "platform_manager",
          "super_admin",
          "master_admin",
        ]);
        let tickets = await ctx.db.query("support_tickets").collect();
      if (args.status) tickets = tickets.filter((ticket) => ticket.status === args.status);
      return tickets.sort((a, b) => b.updatedAt - a.updatedAt);
    }

    const tenant = await requireTenantContext(ctx);
    let tickets = await ctx.db
      .query("support_tickets")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenant.tenantId))
      .collect();
    if (args.status) tickets = tickets.filter((ticket) => ticket.status === args.status);
    return tickets.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const getSupportTicketMessages = query({
  args: {
    sessionToken: v.optional(v.string()),
    ticketId: v.string(),
  },
    handler: async (ctx, args) => {
      if (args.sessionToken) {
        await requirePlatformRole(ctx, { sessionToken: args.sessionToken }, [
          "support_agent",
          "platform_manager",
          "super_admin",
          "master_admin",
        ]);
      } else {
      const tenant = await requireTenantContext(ctx);
      const ticket = await getSupportTicketRecord(ctx, args.ticketId);
      if (!ticket || ticket.tenantId !== tenant.tenantId) {
        throw new ConvexError({ code: "NOT_FOUND", message: "Support ticket not found" });
      }
    }

    const messages = await ctx.db
      .query("support_ticket_messages")
      .withIndex("by_ticketId", (q) => q.eq("ticketId", args.ticketId))
      .collect();

    return messages.sort((a, b) => a.sentAt - b.sentAt);
  },
});

export const createSupportTicket = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    tenantId: v.optional(v.string()),
    subject: v.string(),
    moduleId: v.optional(v.string()),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    source: v.optional(v.string()),
    message: v.string(),
    attachments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    if (args.sessionToken) {
      const platform = await requirePlatformRole(ctx, { sessionToken: args.sessionToken }, [
        "support_agent",
        "platform_manager",
        "super_admin",
        "master_admin",
      ]);

      if (!args.tenantId) {
        throw new ConvexError({ code: "INVALID_ARGUMENT", message: "tenantId is required for platform-created tickets" });
      }

      const ticketId = await ctx.db.insert("support_tickets", {
        tenantId: args.tenantId,
        userId: platform.userId,
        moduleId: args.moduleId,
        subject: args.subject,
        status: "open",
        priority: args.priority,
        assignedTo: platform.userId,
        slaDueAt: undefined,
        resolvedAt: undefined,
        source: args.source ?? "platform",
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("support_ticket_messages", {
        ticketId: String(ticketId),
        senderId: platform.userId,
        body: args.message,
        attachments: args.attachments,
        sentAt: now,
        isInternal: false,
        createdAt: now,
      });

      await logAction(ctx, {
        tenantId: args.tenantId,
        actorId: platform.userId,
        actorEmail: platform.email,
        action: "support.ticket.created",
        entityType: "support_ticket",
        entityId: String(ticketId),
        after: { subject: args.subject, priority: args.priority, source: args.source ?? "platform" },
      });

      return { success: true, ticketId };
    }

    const tenant = await requireTenantContext(ctx);

    const ticketId = await ctx.db.insert("support_tickets", {
      tenantId: tenant.tenantId,
      userId: tenant.userId,
      moduleId: args.moduleId,
      subject: args.subject,
      status: "open",
      priority: args.priority,
      assignedTo: undefined,
      slaDueAt: undefined,
      resolvedAt: undefined,
      source: args.source ?? "portal",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("support_ticket_messages", {
      ticketId: String(ticketId),
      senderId: tenant.userId,
      body: args.message,
      attachments: args.attachments,
      sentAt: now,
      isInternal: false,
      createdAt: now,
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "support.ticket.created",
      entityType: "support_ticket",
      entityId: String(ticketId),
      after: { subject: args.subject, priority: args.priority },
    });

    return { success: true, ticketId };
  },
});

export const replySupportTicket = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    ticketId: v.string(),
    body: v.string(),
    attachments: v.optional(v.array(v.string())),
    isInternal: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const ticket = await getSupportTicketRecord(ctx, args.ticketId);
    if (!ticket) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Support ticket not found" });
    }

      const now = Date.now();
      if (args.sessionToken) {
        const platform = await requirePlatformRole(ctx, { sessionToken: args.sessionToken }, [
          "support_agent",
          "platform_manager",
          "super_admin",
          "master_admin",
        ]);

      const messageId = await ctx.db.insert("support_ticket_messages", {
        ticketId: args.ticketId,
        senderId: platform.userId,
        body: args.body,
        attachments: args.attachments,
        sentAt: now,
        isInternal: args.isInternal ?? false,
        createdAt: now,
      });

      await ctx.db.patch(ticket._id, {
        status: ticket.status === "open" ? "in_progress" : ticket.status,
        updatedAt: now,
      });

      await logAction(ctx, {
        tenantId: "PLATFORM",
        actorId: platform.userId,
        actorEmail: platform.email,
        action: "ticket.comment_added",
        entityType: "support_ticket",
        entityId: String(ticket._id),
        after: { isInternal: args.isInternal ?? false, responder: "platform" },
      });

      return { success: true, messageId };
    }

    const tenant = await requireTenantContext(ctx);
    if (ticket.tenantId !== tenant.tenantId) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Support ticket access denied" });
    }

    const messageId = await ctx.db.insert("support_ticket_messages", {
      ticketId: args.ticketId,
      senderId: tenant.userId,
      body: args.body,
      attachments: args.attachments,
      sentAt: now,
      isInternal: false,
      createdAt: now,
    });

    await ctx.db.patch(ticket._id, { updatedAt: now });
    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "ticket.comment_added",
      entityType: "support_ticket",
      entityId: String(ticket._id),
      after: { responder: "tenant" },
    });
    return { success: true, messageId };
  },
});

export const updateSupportTicket = mutation({
  args: {
    sessionToken: v.string(),
    ticketId: v.id("support_tickets"),
    status: v.optional(
      v.union(v.literal("open"), v.literal("in_progress"), v.literal("resolved"), v.literal("closed"))
    ),
    assignedTo: v.optional(v.string()),
    slaDueAt: v.optional(v.number()),
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
      throw new ConvexError({ code: "NOT_FOUND", message: "Support ticket not found" });
    }

    const now = Date.now();
    await ctx.db.patch(args.ticketId, {
      status: args.status ?? ticket.status,
      assignedTo: args.assignedTo ?? ticket.assignedTo,
      slaDueAt: args.slaDueAt ?? ticket.slaDueAt,
      resolvedAt:
        args.status === "resolved" ? now : args.status === "closed" ? ticket.resolvedAt : undefined,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "support.ticket.updated",
      entityType: "support_ticket",
      entityId: String(args.ticketId),
      after: { status: args.status, assignedTo: args.assignedTo, slaDueAt: args.slaDueAt },
    });

    return { success: true };
  },
});

export const getKnowledgeBaseArticles = query({
  args: {
    sessionToken: v.optional(v.string()),
    visibility: v.optional(
      v.union(v.literal("public"), v.literal("tenants_only"), v.literal("staff_only"))
    ),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))),
  },
  handler: async (ctx, args) => {
    let articles = await ctx.db.query("kb_articles").collect();

    if (args.visibility) {
      articles = articles.filter((article) => article.visibility === args.visibility);
    }
    if (args.status) {
      articles = articles.filter((article) => article.status === args.status);
    } else if (!args.sessionToken) {
      articles = articles.filter((article) => article.status === "published");
    }

    return articles.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const getKnowledgeBaseArticle = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("kb_articles")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const upsertKnowledgeBaseArticle = mutation({
  args: {
    sessionToken: v.string(),
    articleId: v.optional(v.id("kb_articles")),
    title: v.string(),
    slug: v.string(),
    body: v.string(),
    category: v.optional(v.string()),
    tags: v.array(v.string()),
    visibility: v.union(v.literal("public"), v.literal("tenants_only"), v.literal("staff_only")),
    relatedArticleIds: v.array(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "content_moderator",
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    const now = Date.now();

    if (args.articleId) {
      const existing = await ctx.db.get(args.articleId);
      await ctx.db.patch(args.articleId, {
        title: args.title,
        slug: args.slug,
        body: args.body,
        category: args.category,
        tags: args.tags,
        visibility: args.visibility,
        publishedAt: args.status === "published" ? now : undefined,
        relatedArticleIds: args.relatedArticleIds,
        status: args.status ?? "draft",
        updatedAt: now,
      });

      await logAction(ctx, {
        tenantId: "PLATFORM",
        actorId: platform.userId,
        actorEmail: platform.email,
        action: "knowledge_base.article_updated",
        entityType: "kb_article",
        entityId: String(args.articleId),
        before: existing
          ? { title: existing.title, slug: existing.slug, status: existing.status }
          : undefined,
        after: { title: args.title, slug: args.slug, status: args.status ?? "draft" },
      });

      return { success: true, articleId: args.articleId };
    }

    const articleId = await ctx.db.insert("kb_articles", {
      title: args.title,
      slug: args.slug,
      body: args.body,
      category: args.category,
      tags: args.tags,
      visibility: args.visibility,
      publishedAt: args.status === "published" ? now : undefined,
      authorId: platform.userId,
      views: 0,
      relatedArticleIds: args.relatedArticleIds,
      status: args.status ?? "draft",
      createdAt: now,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "knowledge_base.article_created",
      entityType: "kb_article",
      entityId: String(articleId),
      after: { title: args.title, slug: args.slug, status: args.status ?? "draft" },
    });

    return { success: true, articleId };
  },
});

export const getSlaConfigs = query({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.sessionToken) {
      await requirePlatformSession(ctx, { sessionToken: args.sessionToken });
    }
    return await ctx.db.query("sla_configs").collect();
  },
});

export const upsertSlaConfig = mutation({
  args: {
    sessionToken: v.string(),
    supportTier: v.union(
      v.literal("community"),
      v.literal("email"),
      v.literal("priority"),
      v.literal("dedicated")
    ),
    firstResponseHours: v.number(),
    resolutionHours: v.number(),
    businessHoursOnly: v.boolean(),
    escalationRules: v.any(),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "support_agent",
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    const now = Date.now();

    const existing = await ctx.db
      .query("sla_configs")
      .withIndex("by_supportTier", (q) => q.eq("supportTier", args.supportTier))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        firstResponseHours: args.firstResponseHours,
        resolutionHours: args.resolutionHours,
        businessHoursOnly: args.businessHoursOnly,
        escalationRules: args.escalationRules,
        updatedAt: now,
      });
      await logAction(ctx, {
        tenantId: "PLATFORM",
        actorId: platform.userId,
        actorEmail: platform.email,
        action: "sla.updated",
        entityType: "sla_config",
        entityId: String(existing._id),
        after: { supportTier: args.supportTier },
      });
      return { success: true, configId: existing._id };
    }

    const configId = await ctx.db.insert("sla_configs", {
      supportTier: args.supportTier,
      firstResponseHours: args.firstResponseHours,
      resolutionHours: args.resolutionHours,
      businessHoursOnly: args.businessHoursOnly,
      escalationRules: args.escalationRules,
      createdAt: now,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "sla.created",
      entityType: "sla_config",
      entityId: String(configId),
      after: { supportTier: args.supportTier },
    });

    return { success: true, configId };
  },
});
