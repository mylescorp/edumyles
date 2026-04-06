import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

export const listDeals = query({
  args: {
    sessionToken: v.string(),
    stage: v.optional(v.union(
      v.literal("lead"),
      v.literal("qualified"),
      v.literal("proposal"),
      v.literal("negotiation"),
      v.literal("closed_won"),
      v.literal("closed_lost")
    )),
    assignedTo: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const limit = args.limit ?? 50;

    let deals;
    if (args.stage) {
      deals = await ctx.db
        .query("crmDeals")
        .withIndex("by_stage", (q) => q.eq("stage", args.stage!))
        .order("desc")
        .take(limit);
    } else if (args.assignedTo) {
      deals = await ctx.db
        .query("crmDeals")
        .withIndex("by_assignedTo", (q) => q.eq("assignedTo", args.assignedTo!))
        .order("desc")
        .take(limit);
    } else {
      deals = await ctx.db
        .query("crmDeals")
        .withIndex("by_createdAt")
        .order("desc")
        .take(limit);
    }

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      deals = deals.filter(
        (d) =>
          d.schoolName.toLowerCase().includes(searchLower) ||
          d.contactPerson.toLowerCase().includes(searchLower) ||
          d.email.toLowerCase().includes(searchLower)
      );
    }

    return deals;
  },
});

export const getDealById = query({
  args: {
    sessionToken: v.string(),
    dealId: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const deal = await ctx.db.get(args.dealId as any);
    if (!deal) throw new Error("Deal not found");

    const activities = await ctx.db
      .query("crmActivities")
      .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
      .order("desc")
      .take(50);

    return { ...deal, activities };
  },
});

export const getPipelineStats = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const stages = ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"] as const;
    const stats: Record<string, { count: number; totalValue: number }> = {};

    for (const stage of stages) {
      const deals = await ctx.db
        .query("crmDeals")
        .withIndex("by_stage", (q) => q.eq("stage", stage))
        .collect();
      stats[stage] = {
        count: deals.length,
        totalValue: deals.reduce((sum, d) => sum + d.value, 0),
      };
    }

    const allDeals = await ctx.db.query("crmDeals").collect();
    const totalValue = allDeals.reduce((sum, d) => sum + d.value, 0);
    const wonStageStats = stats.closed_won ?? { count: 0, totalValue: 0 };
    const wonValue = wonStageStats.totalValue;

    return {
      stages: stats,
      totalDeals: allDeals.length,
      totalValue,
      wonValue,
      winRate: allDeals.length > 0
        ? Math.round((wonStageStats.count / allDeals.length) * 100)
        : 0,
    };
  },
});

export const listLeads = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(v.union(
      v.literal("new"),
      v.literal("contacted"),
      v.literal("qualified"),
      v.literal("converted"),
      v.literal("lost")
    )),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    let leads;
    if (args.status) {
      leads = await ctx.db
        .query("crmLeads")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(100);
    } else {
      leads = await ctx.db
        .query("crmLeads")
        .withIndex("by_createdAt")
        .order("desc")
        .take(100);
    }

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      leads = leads.filter(
        (l) =>
          l.schoolName.toLowerCase().includes(searchLower) ||
          l.contactPerson.toLowerCase().includes(searchLower) ||
          l.email.toLowerCase().includes(searchLower)
      );
    }

    return leads;
  },
});

export const getLeadById = query({
  args: {
    sessionToken: v.string(),
    leadId: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const lead = await ctx.db.get(args.leadId as any);
    if (!lead) throw new Error("Lead not found");

    const activities = await ctx.db
      .query("crmActivities")
      .withIndex("by_lead", (q) => q.eq("leadId", args.leadId))
      .order("desc")
      .take(50);

    return { ...lead, activities };
  },
});

export const getRecentActivities = query({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const limit = args.limit ?? 20;

    const activities = await ctx.db
      .query("crmActivities")
      .order("desc")
      .take(limit);

    return activities;
  },
});
