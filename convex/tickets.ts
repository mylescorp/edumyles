import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { requireTenantContext, requireTenantSession } from "./helpers/tenantGuard";

// SLA Rules based on specification
const SLA_RULES = {
  P0: { firstResponse: 2, resolution: 4 },    // Critical: 2h response, 4h resolution
  P1: { firstResponse: 8, resolution: 24 },   // High: 8h response, 24h resolution
  P2: { firstResponse: 24, resolution: 72 },  // Medium: 24h response, 72h resolution
  P3: { firstResponse: 72, resolution: 168 }, // Low: 72h response, 7d resolution
} as const;

// Create a new ticket
export const createTicket = mutation({
  args: {
    tenantId: v.string(),
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
    attachments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const now = Date.now();
    const sla = SLA_RULES[args.priority];
    
    const ticketId = await ctx.db.insert("tickets", {
      tenantId: args.tenantId,
      title: args.title,
      body: args.body,
      category: args.category,
      priority: args.priority,
      status: "open",
      assignedTo: undefined, // Will be assigned by agent
      createdBy: identity.tokenIdentifier,
      attachments: args.attachments || [],
      slaFirstResponseDL: now + (sla.firstResponse * 60 * 60 * 1000),
      slaResolutionDL: now + (sla.resolution * 60 * 60 * 1000),
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

    return ticketId;
  },
});

// Get tickets for platform admin view
export const getTickets = query({
  args: {
    status: v.optional(v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("pending_school"),
      v.literal("resolved"),
      v.literal("closed")
    )),
    priority: v.optional(v.union(v.literal("P0"), v.literal("P1"), v.literal("P2"), v.literal("P3"))),
    assignedTo: v.optional(v.string()),
    category: v.optional(v.union(
      v.literal("billing"),
      v.literal("technical"),
      v.literal("data"),
      v.literal("feature"),
      v.literal("onboarding"),
      v.literal("account"),
      v.literal("legal"),
      v.literal("other")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    const tickets = await ctx.db.query("tickets").collect();
    const scopedTickets =
      tenant.tenantId === "PLATFORM"
        ? tickets
        : tickets.filter((ticket) => ticket.tenantId === tenant.tenantId);
    
    // Filter tickets based on arguments
    let filteredTickets = scopedTickets;
    
    if (args.status) {
      filteredTickets = filteredTickets.filter(t => t.status === args.status);
    }
    if (args.priority) {
      filteredTickets = filteredTickets.filter(t => t.priority === args.priority);
    }
    if (args.assignedTo) {
      filteredTickets = filteredTickets.filter(t => t.assignedTo === args.assignedTo);
    }
    if (args.category) {
      filteredTickets = filteredTickets.filter(t => t.category === args.category);
    }
    
    // Sort by creation date (newest first) and apply limit
    const sortedTickets = filteredTickets.sort((a, b) => b.createdAt - a.createdAt);
    const limitedTickets = sortedTickets.slice(0, args.limit || 50);
    
    // Fetch tenant names for display
    const ticketsWithTenants = await Promise.all(
      limitedTickets.map(async (ticket) => {
        const tenant = await ctx.db
          .query("tenants")
          .withIndex("by_tenantId", (q) => q.eq("tenantId", ticket.tenantId))
          .first();
        return {
          ...ticket,
          tenantName: tenant?.name || "Unknown Tenant",
        };
      })
    );

    return ticketsWithTenants;
  },
});

// Get single ticket with comments
export const getTicket = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");
    if (tenant.tenantId !== "PLATFORM" && ticket.tenantId !== tenant.tenantId) {
      throw new Error("Ticket not found");
    }

    // Get comments for this ticket
    const comments = await ctx.db
      .query("ticketComments")
      .withIndex("by_ticket", q => q.eq("ticketId", args.ticketId))
      .order("asc")
      .collect();

    // Get tenant info
    const ticketTenant = await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", ticket.tenantId))
      .first();

    return {
      ...ticket,
      tenantName: ticketTenant?.name || "Unknown Tenant",
      comments,
    };
  },
});

// Update ticket status
export const updateTicketStatus = mutation({
  args: {
    ticketId: v.id("tickets"),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("pending_school"),
      v.literal("resolved"),
      v.literal("closed")
    ),
    assignedTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const existing = await ctx.db.get(args.ticketId);
    if (!existing) throw new Error("Ticket not found");

    const updates: any = {
      status: args.status,
      updatedAt: Date.now(),
    };

    // Handle first response
    if (args.status === "in_progress" && !existing.firstResponseAt) {
      updates.firstResponseAt = Date.now();
    }

    // Handle resolution
    if (args.status === "resolved" || args.status === "closed") {
      updates.resolvedAt = Date.now();
    }

    // Handle assignment
    if (args.assignedTo) {
      updates.assignedTo = args.assignedTo;
    }

    // Pause SLA clock when waiting for school
    if (args.status === "pending_school") {
      updates.slaClockPaused = true;
    } else if (existing.slaClockPaused) {
      updates.slaClockPaused = false;
    }

    await ctx.db.patch(args.ticketId, updates);

    return true;
  },
});

// Add comment to ticket
export const addComment = mutation({
  args: {
    ticketId: v.id("tickets"),
    content: v.string(),
    isInternal: v.boolean(),
    attachments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Get user info
    const users = await ctx.db.query("users").collect();
    const user = users.find(u => u.workosUserId === identity.tokenIdentifier);

    if (!user) throw new Error("User not found");

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    await ctx.db.insert("ticketComments", {
      ticketId: args.ticketId,
      authorId: identity.tokenIdentifier,
      authorEmail: user.email,
      authorRole: user.role,
      content: args.content,
      isInternal: args.isInternal,
      attachments: args.attachments || [],
      createdAt: Date.now(),
    });

    // Update ticket timestamp
    await ctx.db.patch(args.ticketId, { updatedAt: Date.now() });

    return true;
  },
});

// Get SLA statistics
export const getSLAStats = query({
  args: {},
  handler: async (ctx) => {
    const tenant = await requireTenantContext(ctx);
    const now = Date.now();
    const allTickets = await ctx.db.query("tickets").collect();
    const scopedTickets =
      tenant.tenantId === "PLATFORM"
        ? allTickets
        : allTickets.filter((ticket) => ticket.tenantId === tenant.tenantId);

    const stats = {
      total: scopedTickets.length,
      open: scopedTickets.filter(t => t.status === "open").length,
      inProgress: scopedTickets.filter(t => t.status === "in_progress").length,
      breached: scopedTickets.filter(t => t.slaBreached).length,
      atRisk: scopedTickets.filter(t => {
        if (t.status === "resolved" || t.status === "closed") return false;
        if (t.slaClockPaused) return false;
        const timeToResolution = t.slaResolutionDL - now;
        return timeToResolution > 0 && timeToResolution < (2 * 60 * 60 * 1000); // < 2 hours
      }).length,
      compliance: 0, // Will calculate below
    };

    // Calculate SLA compliance
    const resolvedTickets = scopedTickets.filter(t => t.status === "resolved" || t.status === "closed");
    const compliantTickets = resolvedTickets.filter(t => !t.slaBreached);
    stats.compliance = resolvedTickets.length > 0 
      ? Math.round((compliantTickets.length / resolvedTickets.length) * 100)
      : 100;

    return stats;
  },
});

// Get tickets for a specific tenant (school portal view)
export const getTenantTickets = query({
  args: {
    tenantId: v.id("tenants"),
    status: v.optional(v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("pending_school"),
      v.literal("resolved"),
      v.literal("closed")
    )),
  },
  handler: async (ctx, args) => {
    const tickets = await ctx.db.query("tickets").collect();
    
    // Filter by tenant first
    let tenantTickets = tickets.filter(t => t.tenantId === args.tenantId);
    
    // Then filter by status if provided
    if (args.status) {
      tenantTickets = tenantTickets.filter(t => t.status === args.status);
    }
    
    // Sort by creation date (newest first)
    return tenantTickets.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// ─── Session-based tenant tickets query (for school admin panel) ─────────────
export const listTenantTickets = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("pending_school"),
      v.literal("resolved"),
      v.literal("closed")
    )),
  },
  handler: async (ctx, args) => {
    const { sessionToken, status } = args;
    const tenantCtx = await requireTenantSession(ctx, { sessionToken });

    const tickets = await ctx.db.query("tickets").collect();
    let tenantTickets = tickets.filter((t) => t.tenantId === tenantCtx.tenantId);

    if (status) {
      tenantTickets = tenantTickets.filter((t) => t.status === status);
    }

    return tenantTickets.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const createTenantTicket = mutation({
  args: {
    sessionToken: v.string(),
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
    attachments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requireTenantSession(ctx, { sessionToken: args.sessionToken });
    const now = Date.now();
    const sla = SLA_RULES[args.priority];

    return await ctx.db.insert("tickets", {
      tenantId: tenantCtx.tenantId,
      title: args.title,
      body: args.body,
      category: args.category,
      priority: args.priority,
      status: "open",
      assignedTo: undefined,
      createdBy: tenantCtx.userId,
      attachments: args.attachments || [],
      slaFirstResponseDL: now + sla.firstResponse * 60 * 60 * 1000,
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

export const getTenantTicketDetail = query({
  args: {
    sessionToken: v.string(),
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requireTenantSession(ctx, { sessionToken: args.sessionToken });
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket || ticket.tenantId !== tenantCtx.tenantId) {
      throw new Error("Ticket not found");
    }

    const comments = await ctx.db
      .query("ticketComments")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .order("asc")
      .collect();

    const publicComments = comments.filter((comment) => !comment.isInternal);

    return {
      ...ticket,
      comments: publicComments,
    };
  },
});

export const addTenantTicketComment = mutation({
  args: {
    sessionToken: v.string(),
    ticketId: v.id("tickets"),
    content: v.string(),
    attachments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requireTenantSession(ctx, { sessionToken: args.sessionToken });
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket || ticket.tenantId !== tenantCtx.tenantId) {
      throw new Error("Ticket not found");
    }

    await ctx.db.insert("ticketComments", {
      ticketId: args.ticketId,
      authorId: tenantCtx.userId,
      authorEmail: tenantCtx.email,
      authorRole: tenantCtx.role,
      content: args.content,
      isInternal: false,
      attachments: args.attachments || [],
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.ticketId, { updatedAt: Date.now() });

    return { success: true };
  },
});
