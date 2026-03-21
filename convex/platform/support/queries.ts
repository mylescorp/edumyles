import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

export const getAISupportTickets = query({
  args: {
    sessionToken: v.string(),
    tenantId: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed"),
      v.literal("escalated")
    )),
    category: v.optional(v.union(
      v.literal("technical"),
      v.literal("billing"),
      v.literal("account"),
      v.literal("feature_request"),
      v.literal("bug_report"),
      v.literal("general")
    )),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))),
    assignedTo: v.optional(v.string()),
    dateRange: v.optional(v.object({ start: v.number(), end: v.number() })),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const limit = args.limit ?? 50;

    let tickets;
    if (args.tenantId && args.status) {
      tickets = await ctx.db
        .query("aiSupportTickets")
        .withIndex("by_status", (q) =>
          q.eq("tenantId", args.tenantId!).eq("status", args.status!)
        )
        .order("desc")
        .take(limit);
    } else if (args.tenantId && args.category) {
      tickets = await ctx.db
        .query("aiSupportTickets")
        .withIndex("by_category", (q) =>
          q.eq("tenantId", args.tenantId!).eq("category", args.category!)
        )
        .order("desc")
        .take(limit);
    } else if (args.tenantId) {
      tickets = await ctx.db
        .query("aiSupportTickets")
        .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId!))
        .order("desc")
        .take(limit);
    } else if (args.assignedTo) {
      tickets = await ctx.db
        .query("aiSupportTickets")
        .withIndex("by_assignedTo", (q) => q.eq("assignedTo", args.assignedTo!))
        .order("desc")
        .take(limit);
    } else {
      tickets = await ctx.db
        .query("aiSupportTickets")
        .order("desc")
        .take(limit);
    }

    if (args.priority) tickets = tickets.filter((t) => t.priority === args.priority);
    if (args.dateRange) {
      tickets = tickets.filter(
        (t) => t.createdAt >= args.dateRange!.start && t.createdAt <= args.dateRange!.end
      );
    }

    const result = await Promise.all(
      tickets.map(async (ticket) => {
        const tenant = await ctx.db
          .query("tenants")
          .withIndex("by_tenantId", (q) => q.eq("tenantId", ticket.tenantId))
          .first();
        return { ...ticket, tenantName: tenant?.name ?? ticket.tenantId };
      })
    );

    return result;
  },
});

export const getAIInsights = query({
  args: {
    sessionToken: v.string(),
    insightType: v.union(
      v.literal("ticketTrends"),
      v.literal("agentPerformance"),
      v.literal("customerSatisfaction"),
      v.literal("aiEffectiveness")
    ),
    dateRange: v.object({ start: v.number(), end: v.number() }),
    filters: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const tickets = await ctx.db
      .query("aiSupportTickets")
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), args.dateRange.start),
          q.lte(q.field("createdAt"), args.dateRange.end)
        )
      )
      .collect();

    const total = tickets.length;
    const resolved = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length;

    if (args.insightType === "ticketTrends") {
      const byCategory: Record<string, number> = {};
      for (const t of tickets) {
        byCategory[t.category] = (byCategory[t.category] ?? 0) + 1;
      }
      return {
        totalTickets: total,
        resolvedTickets: resolved,
        avgResolutionTime: 0,
        topCategories: Object.entries(byCategory)
          .sort((a, b) => b[1] - a[1])
          .map(([category, count]) => ({ category, count })),
        recommendations: [],
      };
    }

    if (args.insightType === "customerSatisfaction") {
      const rated = tickets.filter((t) => t.satisfaction !== undefined && t.satisfaction !== null);
      const avgRating =
        rated.length > 0
          ? rated.reduce((sum, t) => sum + (t.satisfaction ?? 0), 0) / rated.length
          : 0;
      return {
        averageRating: Math.round(avgRating * 10) / 10,
        responseRate: total > 0 ? Math.round((rated.length / total) * 100) : 0,
        netPromoterScore: 0,
        feedback: [],
        recommendations: [],
      };
    }

    if (args.insightType === "aiEffectiveness") {
      const aiHandled = tickets.filter((t) => t.aiResponses.length > 0).length;
      const escalated = tickets.filter((t) => t.status === "escalated").length;
      return {
        aiHandledTickets: aiHandled,
        aiResolutionRate: aiHandled > 0 ? Math.round((resolved / aiHandled) * 100) : 0,
        avgResponseTime: 0,
        customerSatisfaction: 0,
        escalationRate: total > 0 ? Math.round((escalated / total) * 100) : 0,
        costSavings: aiHandled * 500,
        timeSavings: aiHandled * 0.5,
        recommendations: [],
      };
    }

    // agentPerformance
    const agentMap: Record<string, { tickets: number; resolved: number }> = {};
    for (const t of tickets) {
      if (t.assignedTo) {
        if (!agentMap[t.assignedTo]) agentMap[t.assignedTo] = { tickets: 0, resolved: 0 };
        agentMap[t.assignedTo].tickets++;
        if (t.status === "resolved" || t.status === "closed") agentMap[t.assignedTo].resolved++;
      }
    }
    return {
      totalAgents: Object.keys(agentMap).length,
      avgTicketsPerAgent:
        Object.keys(agentMap).length > 0 ? total / Object.keys(agentMap).length : 0,
      avgResponseTime: 0,
      satisfactionScore: 0,
      topPerformers: Object.entries(agentMap)
        .sort((a, b) => b[1].resolved - a[1].resolved)
        .slice(0, 5)
        .map(([agentId, data]) => ({ agentId, ...data })),
      recommendations: [],
    };
  },
});

export const getAIKnowledgeBase = query({
  args: {
    sessionToken: v.string(),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    keywords: v.optional(v.array(v.string())),
    isPublic: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const limit = args.limit ?? 50;

    let articles;
    if (args.category) {
      articles = await ctx.db
        .query("aiKnowledgeBase")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .take(limit);
    } else if (args.isPublic !== undefined) {
      articles = await ctx.db
        .query("aiKnowledgeBase")
        .withIndex("by_public", (q) => q.eq("isPublic", args.isPublic!))
        .take(limit);
    } else {
      articles = await ctx.db
        .query("aiKnowledgeBase")
        .order("desc")
        .take(limit);
    }

    if (args.tags && args.tags.length > 0) {
      articles = articles.filter((a) => args.tags!.some((tag) => a.tags.includes(tag)));
    }
    if (args.keywords && args.keywords.length > 0) {
      articles = articles.filter((a) =>
        args.keywords!.some(
          (kw) =>
            a.keywords.includes(kw) ||
            a.title.toLowerCase().includes(kw.toLowerCase()) ||
            a.content.toLowerCase().includes(kw.toLowerCase())
        )
      );
    }

    return articles;
  },
});

export const getAIAgentMetrics = query({
  args: {
    sessionToken: v.string(),
    agentId: v.optional(v.string()),
    dateRange: v.object({ start: v.number(), end: v.number() }),
    metrics: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const tickets = await ctx.db
      .query("aiSupportTickets")
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), args.dateRange.start),
          q.lte(q.field("createdAt"), args.dateRange.end)
        )
      )
      .collect();

    const agentTickets = args.agentId
      ? tickets.filter((t) => t.assignedTo === args.agentId)
      : tickets.filter((t) => t.assignedTo);

    const agentMap: Record<string, typeof tickets> = {};
    for (const t of agentTickets) {
      if (t.assignedTo) {
        if (!agentMap[t.assignedTo]) agentMap[t.assignedTo] = [];
        agentMap[t.assignedTo].push(t);
      }
    }

    return Object.entries(agentMap).map(([agentId, agentTicketList]) => {
      const total = agentTicketList.length;
      const resolved = agentTicketList.filter(
        (t) => t.status === "resolved" || t.status === "closed"
      ).length;
      const rated = agentTicketList.filter((t) => t.satisfaction !== undefined);
      const avgSat =
        rated.length > 0
          ? rated.reduce((sum, t) => sum + (t.satisfaction ?? 0), 0) / rated.length
          : 0;
      return {
        agentId,
        metrics: {
          totalTickets: total,
          resolvedTickets: resolved,
          satisfactionScore: Math.round(avgSat * 10) / 10,
          aiAssistedTickets: agentTicketList.filter((t) => t.aiResponses.length > 0).length,
        },
      };
    });
  },
});

export const getAISystemPerformance = query({
  args: {
    sessionToken: v.string(),
    timeRange: v.optional(v.union(v.literal("1h"), v.literal("24h"), v.literal("7d"), v.literal("30d"))),
    metrics: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const msMap: Record<string, number> = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };
    const since = Date.now() - msMap[args.timeRange ?? "30d"];

    const tickets = await ctx.db
      .query("aiSupportTickets")
      .filter((q) => q.gte(q.field("createdAt"), since))
      .collect();

    const total = tickets.length;
    const resolved = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length;
    const aiHandled = tickets.filter((t) => t.aiResponses.length > 0).length;
    const escalated = tickets.filter((t) => t.status === "escalated").length;
    const rated = tickets.filter((t) => t.satisfaction !== undefined);
    const avgSat =
      rated.length > 0
        ? rated.reduce((sum, t) => sum + (t.satisfaction ?? 0), 0) / rated.length
        : 0;

    return {
      overview: {
        totalAIRequests: total,
        successfulResponses: aiHandled,
        avgResponseTime: 0,
        accuracy: aiHandled > 0 ? Math.round((resolved / aiHandled) * 100) : 0,
        customerSatisfaction: Math.round(avgSat * 10) / 10,
        costPerResponse: 50,
        humanAgentEquivalents: Math.round(aiHandled * 0.3),
      },
      escalationRate: total > 0 ? Math.round((escalated / total) * 100) : 0,
      costAnalysis: {
        totalCost: aiHandled * 50,
        costPerTicket: 50,
        humanAgentCost: total * 500,
        savings: total * 500 - aiHandled * 50,
        ROI: aiHandled > 0 ? Math.round(((total * 500 - aiHandled * 50) / (aiHandled * 50)) * 100) : 0,
      },
      recommendations: [],
    };
  },
});
