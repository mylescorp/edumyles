import { query, mutation } from "../../../_generated/server";
import { v } from "convex/values";
import { requireResellerContext } from "../../../helpers/resellerGuard";

export const getTickets = query({
  args: {},
  handler: async (ctx) => {
    const reseller = await requireResellerContext(ctx);
    const tickets = await ctx.db.query("tickets").collect();
    const ticketComments = await ctx.db.query("ticketComments").collect();

    return tickets
      .filter((ticket) => ticket.createdBy === reseller.userId)
      .map((ticket) => ({
        ...ticket,
        replyCount: ticketComments.filter((comment) => String(comment.ticketId) === String(ticket._id)).length,
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const getTicketDetail = query({
  args: {
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    const reseller = await requireResellerContext(ctx);
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket || ticket.createdBy !== reseller.userId) {
      throw new Error("Ticket not found");
    }

    const comments = await ctx.db
      .query("ticketComments")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .order("asc")
      .collect();

    return {
      ...ticket,
      comments: comments.filter((comment) => !comment.isInternal),
    };
  },
});

export const createTicket = mutation({
  args: {
    title: v.string(),
    body: v.string(),
    category: v.union(
      v.literal("billing"),
      v.literal("technical"),
      v.literal("data"),
      v.literal("feature"),
      v.literal("onboarding"),
      v.literal("account"),
      v.literal("legal"),
      v.literal("other")
    ),
    priority: v.union(v.literal("P0"), v.literal("P1"), v.literal("P2"), v.literal("P3")),
  },
  handler: async (ctx, args) => {
    const reseller = await requireResellerContext(ctx);
    const now = Date.now();
    const slaMap = {
      P0: { first: 2, resolution: 4 },
      P1: { first: 8, resolution: 24 },
      P2: { first: 24, resolution: 72 },
      P3: { first: 72, resolution: 168 },
    } as const;
    const sla = slaMap[args.priority];

    return await ctx.db.insert("tickets", {
      tenantId: "platform",
      title: args.title,
      body: args.body,
      category: args.category,
      priority: args.priority,
      status: "open",
      assignedTo: undefined,
      createdBy: reseller.userId,
      attachments: [],
      slaFirstResponseDL: now + sla.first * 60 * 60 * 1000,
      slaResolutionDL: now + sla.resolution * 60 * 60 * 1000,
      slaBreached: false,
      slaClockPaused: false,
      firstResponseAt: undefined,
      resolvedAt: undefined,
      csatScore: undefined,
      csatComment: undefined,
      linearIssueUrl: undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const addTicketComment = mutation({
  args: {
    ticketId: v.id("tickets"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const reseller = await requireResellerContext(ctx);
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket || ticket.createdBy !== reseller.userId) {
      throw new Error("Ticket not found");
    }

    await ctx.db.insert("ticketComments", {
      ticketId: args.ticketId,
      authorId: reseller.userId,
      authorEmail: reseller.email,
      authorRole: "reseller",
      content: args.content,
      isInternal: false,
      attachments: [],
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.ticketId, {
      updatedAt: Date.now(),
      status: ticket.status === "resolved" ? "open" : ticket.status,
    });

    return { success: true };
  },
});
