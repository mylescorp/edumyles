import { v } from "convex/values";
import { mutation, query } from "../../../_generated/server";
import { requirePublisherContext } from "../../../helpers/publisherGuard";
import { logAction } from "../../../helpers/auditLog";

export const getSupportTickets = query({
  args: {
    status: v.optional(v.union(v.literal("open"), v.literal("in_progress"), v.literal("resolved"), v.literal("closed"))),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const publisher = await requirePublisherContext(ctx);
    
    const page = args.page || 1;
    const pageSize = args.pageSize || 25;
    const skip = (page - 1) * pageSize;

    const tickets = await ctx.db
      .query("publisher_support_tickets")
      .withIndex("by_publisherId", q => q.eq("publisherId", publisher.publisherId))
      .collect();

    // Filter by status if provided
    let filteredTickets = tickets;
    if (args.status) {
      filteredTickets = tickets.filter(t => t.status === args.status);
    }

    // Apply pagination
    const paginatedTickets = filteredTickets.slice(skip, skip + pageSize);

    return {
      tickets: paginatedTickets,
      total: filteredTickets.length,
      page,
      pageSize,
      hasMore: skip + pageSize < filteredTickets.length,
    };
  },
});

export const createSupportTicket = mutation({
  args: {
    title: v.string(),
    body: v.string(),
    category: v.union(
      v.literal("technical"),
      v.literal("billing"),
      v.literal("account"),
      v.literal("feature"),
      v.literal("other")
    ),
    priority: v.union(v.literal("P3"), v.literal("P2"), v.literal("P1"), v.literal("P0")),
    attachments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const publisher = await requirePublisherContext(ctx);
    const priorityMap = {
      P3: "low",
      P2: "medium",
      P1: "high",
      P0: "critical",
    } as const;

    const ticketId = await ctx.db.insert("publisher_support_tickets", {
      publisherId: publisher.publisherId,
      moduleId: "general",
      tenantId: "platform",
      subject: args.title,
      status: "open",
      priority: priorityMap[args.priority],
      thread: [
        {
          authorId: publisher.userId,
          authorEmail: publisher.email,
          authorRole: "publisher",
          content: args.body,
          attachments: args.attachments || [],
          createdAt: Date.now(),
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log the action
    await logAction(ctx, {
      tenantId: "platform",
      actorId: publisher.userId,
      actorEmail: publisher.email,
      action: "ticket.created",
      entityType: "ticket",
      entityId: String(ticketId),
      after: { title: args.title, category: args.category, priority: args.priority },
    });

    return { success: true, ticketId };
  },
});

export const getSupportTicketDetail = query({
  args: {
    ticketId: v.id("publisher_support_tickets"),
  },
  handler: async (ctx, args) => {
    const publisher = await requirePublisherContext(ctx);

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      throw new Error("Ticket not found");
    }

    if (ticket.publisherId !== publisher.publisherId) {
      throw new Error("Not authorized to view this ticket");
    }

    return ticket;
  },
});

export const addTicketComment = mutation({
  args: {
    ticketId: v.id("publisher_support_tickets"),
    content: v.string(),
    attachments: v.optional(v.array(v.string())),
    isInternal: v.boolean(),
  },
  handler: async (ctx, args) => {
    const publisher = await requirePublisherContext(ctx);

    // Get the ticket
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      throw new Error("Ticket not found");
    }

    if (ticket.publisherId !== publisher.publisherId) {
      throw new Error("Not authorized to comment on this ticket");
    }

    const thread = Array.isArray(ticket.thread) ? [...ticket.thread] : [];
    thread.push({
      authorId: publisher.userId,
      authorEmail: publisher.email,
      authorRole: "publisher",
      content: args.content,
      isInternal: args.isInternal,
      attachments: args.attachments || [],
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.ticketId, {
      thread,
      updatedAt: Date.now(),
    });

    // Update ticket status if it was closed
    await logAction(ctx, {
      tenantId: "platform",
      actorId: publisher.userId,
      actorEmail: publisher.email,
      action: "ticket.comment_added",
      entityType: "ticket",
      entityId: String(args.ticketId),
      after: { ticketId: args.ticketId, content: args.content },
    });

    return { success: true };
  },
});

export const getModuleReviews = query({
  args: {
    moduleId: v.string(),
    rating: v.optional(v.number()), // Filter by rating (1-5)
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const publisher = await requirePublisherContext(ctx);
    
    // Get the module
    const module = await ctx.db
      .query("modules")
      .withIndex("by_slug", q => q.eq("slug", args.moduleId))
      .unique();

    if (!module) {
      throw new Error("Module not found");
    }

    if (module.publisherId !== publisher.publisherId) {
      throw new Error("Not authorized to view reviews for this module");
    }
    const page = args.page || 1;
    const pageSize = args.pageSize || 25;
    const skip = (page - 1) * pageSize;

    let reviews = await ctx.db
      .query("module_reviews")
      .withIndex("by_moduleId", q => q.eq("moduleId", String(module._id)))
      .collect();

    if (args.rating !== undefined) {
      reviews = reviews.filter((review) => review.rating === args.rating);
    }

    const total = reviews.length;
    const paginatedReviews = reviews.slice(skip, skip + pageSize);

    return {
      reviews: paginatedReviews,
      total,
      page,
      pageSize,
      hasMore: skip + pageSize < total,
      moduleInfo: {
        moduleId: String(module._id),
        name: module.name,
        averageRating: total > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / total : 0,
        reviewCount: total,
      },
    };
  },
});

export const respondToReview = mutation({
  args: {
    reviewId: v.string(),
    response: v.string(),
    public: v.boolean(),
  },
  handler: async (ctx, args) => {
    const publisher = await requirePublisherContext(ctx);

    // TODO: Get review from reviews table and validate ownership
    // For now, just log the action

    await logAction(ctx, {
      tenantId: "platform",
      actorId: publisher.userId,
      actorEmail: publisher.email,
      action: "marketplace.review_moderated" as any,
      entityType: "review",
      entityId: args.reviewId,
      after: { reviewId: args.reviewId, response: args.response, public: args.public },
    });

    return { success: true };
  },
});

export const getNotifications = query({
  args: {
    unreadOnly: v.boolean(),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const publisher = await requirePublisherContext(ctx);
    
    const page = args.page || 1;
    const pageSize = args.pageSize || 25;
    const skip = (page - 1) * pageSize;

    // Get notifications for this publisher
    const notifications = await ctx.db
      .query("notifications")
      .filter(q => q.eq(q.field("userId"), publisher.userId))
      .collect();

    // Filter by read status if requested
    let filteredNotifications = notifications;
    if (args.unreadOnly) {
      filteredNotifications = notifications.filter(n => !n.isRead);
    }

    // Sort by creation date (newest first)
    filteredNotifications.sort((a, b) => b.createdAt - a.createdAt);

    // Apply pagination
    const paginatedNotifications = filteredNotifications.slice(skip, skip + pageSize);

    return {
      notifications: paginatedNotifications,
      total: filteredNotifications.length,
      unreadCount: notifications.filter(n => !n.isRead).length,
      page,
      pageSize,
      hasMore: skip + pageSize < filteredNotifications.length,
    };
  },
});

export const markNotificationRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const publisher = await requirePublisherContext(ctx);

    // Get the notification
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    // Check if notification belongs to this user
    if (notification.userId !== publisher.userId) {
      throw new Error("Not authorized to update this notification");
    }

    await ctx.db.patch(args.notificationId, {
      isRead: true,
    });

    return { success: true };
  },
});

export const markAllNotificationsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const publisher = await requirePublisherContext(ctx);

    // Get all unread notifications
    const unreadNotifications = await ctx.db
      .query("notifications")
      .filter(q => q.and(
        q.eq(q.field("userId"), publisher.userId),
        q.eq(q.field("isRead"), false)
      ))
      .collect();

    // Mark all as read
    await Promise.all(
      unreadNotifications.map(notification =>
        ctx.db.patch(notification._id, { isRead: true })
      )
    );

    return { success: true, markedCount: unreadNotifications.length };
  },
});
