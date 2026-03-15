import { query } from "../../_generated/server";
import { v } from "convex/values";

export const getTenantHealthScores = query({
  args: {
    sessionToken: v.string(),
    tenantId: v.optional(v.string()),
    category: v.optional(v.union(
      v.literal("adoption"),
      v.literal("engagement"),
      v.literal("support"),
      v.literal("technical"),
      v.literal("financial"),
      v.literal("overall")
    )),
    timeRange: v.optional(v.union(v.literal("30d"), v.literal("90d"), v.literal("180d"), v.literal("365d"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let scores;
    if (args.tenantId && args.category) {
      scores = await ctx.db
        .query("tenantHealthScores")
        .withIndex("by_category", (q) =>
          q.eq("tenantId", args.tenantId!).eq("category", args.category!)
        )
        .order("desc")
        .take(limit);
    } else if (args.tenantId) {
      scores = await ctx.db
        .query("tenantHealthScores")
        .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId!))
        .order("desc")
        .take(limit);
    } else {
      scores = await ctx.db
        .query("tenantHealthScores")
        .order("desc")
        .take(limit);
    }

    // Enrich with tenant name
    const result = await Promise.all(
      scores.map(async (score) => {
        const tenant = await ctx.db
          .query("tenants")
          .withIndex("by_tenantId", (q) => q.eq("tenantId", score.tenantId))
          .first();
        return { ...score, tenantName: tenant?.name ?? score.tenantId };
      })
    );

    return result;
  },
});

export const getSuccessInitiatives = query({
  args: {
    sessionToken: v.string(),
    tenantId: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("planned"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    )),
    category: v.optional(v.union(
      v.literal("onboarding"),
      v.literal("training"),
      v.literal("optimization"),
      v.literal("support"),
      v.literal("engagement"),
      v.literal("retention")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let initiatives;
    if (args.tenantId && args.status) {
      initiatives = await ctx.db
        .query("successInitiatives")
        .withIndex("by_status", (q) =>
          q.eq("tenantId", args.tenantId!).eq("status", args.status!)
        )
        .order("desc")
        .take(limit);
    } else if (args.tenantId) {
      initiatives = await ctx.db
        .query("successInitiatives")
        .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId!))
        .order("desc")
        .take(limit);
    } else if (args.status) {
      initiatives = await ctx.db
        .query("successInitiatives")
        .filter((q) => q.eq(q.field("status"), args.status!))
        .order("desc")
        .take(limit);
    } else {
      initiatives = await ctx.db
        .query("successInitiatives")
        .order("desc")
        .take(limit);
    }

    if (args.category) {
      initiatives = initiatives.filter((i) => i.category === args.category);
    }

    const result = await Promise.all(
      initiatives.map(async (init) => {
        const tenant = await ctx.db
          .query("tenants")
          .withIndex("by_tenantId", (q) => q.eq("tenantId", init.tenantId))
          .first();
        return { ...init, tenantName: tenant?.name ?? init.tenantId };
      })
    );

    return result;
  },
});

export const getSuccessMetrics = query({
  args: {
    sessionToken: v.string(),
    tenantId: v.optional(v.string()),
    category: v.optional(v.union(
      v.literal("adoption"),
      v.literal("engagement"),
      v.literal("support"),
      v.literal("technical"),
      v.literal("financial")
    )),
    isActive: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let metrics;
    if (args.tenantId && args.isActive !== undefined) {
      metrics = await ctx.db
        .query("successMetrics")
        .withIndex("by_active", (q) =>
          q.eq("tenantId", args.tenantId!).eq("isActive", args.isActive!)
        )
        .take(limit);
    } else if (args.tenantId && args.category) {
      metrics = await ctx.db
        .query("successMetrics")
        .withIndex("by_category", (q) =>
          q.eq("tenantId", args.tenantId!).eq("category", args.category!)
        )
        .take(limit);
    } else if (args.tenantId) {
      metrics = await ctx.db
        .query("successMetrics")
        .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId!))
        .take(limit);
    } else {
      metrics = await ctx.db
        .query("successMetrics")
        .order("desc")
        .take(limit);
    }

    if (args.category) {
      metrics = metrics.filter((m) => m.category === args.category);
    }
    if (args.isActive !== undefined) {
      metrics = metrics.filter((m) => m.isActive === args.isActive);
    }

    return metrics;
  },
});

export const getTenantSuccessOverview = query({
  args: {
    sessionToken: v.string(),
    timeRange: v.optional(v.union(v.literal("30d"), v.literal("90d"), v.literal("180d"), v.literal("365d"))),
  },
  handler: async (ctx, args) => {
    const allTenants = await ctx.db.query("tenants").collect();
    const activeTenants = allTenants.filter((t) => t.status === "active");

    const allScores = await ctx.db.query("tenantHealthScores").collect();
    const overallScores = allScores.filter((s) => s.category === "overall");

    const avgScore =
      overallScores.length > 0
        ? overallScores.reduce((sum, s) => sum + s.score, 0) / overallScores.length
        : 0;

    const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    for (const s of overallScores) {
      gradeDistribution[s.grade]++;
    }

    const allInitiatives = await ctx.db.query("successInitiatives").collect();
    const initiativeCounts = {
      total: allInitiatives.length,
      active: allInitiatives.filter((i) => i.status === "active").length,
      completed: allInitiatives.filter((i) => i.status === "completed").length,
      planned: allInitiatives.filter((i) => i.status === "planned").length,
    };

    // At-risk tenants: overall score < 70 or no score recorded
    const atRisk = overallScores
      .filter((s) => s.score < 70)
      .map((s) => {
        const tenant = allTenants.find((t) => t.tenantId === s.tenantId);
        return {
          tenantId: s.tenantId,
          tenantName: tenant?.name ?? s.tenantId,
          healthScore: s.score,
          grade: s.grade,
          riskFactors: s.recommendations.slice(0, 2),
          recommendedActions: s.recommendations.slice(0, 3),
        };
      });

    // Top performers
    const topPerformers = overallScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((s) => {
        const tenant = allTenants.find((t) => t.tenantId === s.tenantId);
        return {
          tenantId: s.tenantId,
          tenantName: tenant?.name ?? s.tenantId,
          healthScore: s.score,
          grade: s.grade,
        };
      });

    return {
      overview: {
        totalTenants: allTenants.length,
        activeTenants: activeTenants.length,
        averageHealthScore: Math.round(avgScore * 10) / 10,
        gradeDistribution,
        initiatives: initiativeCounts,
      },
      trends: { healthScores: [], initiativeCompletions: [], engagementMetrics: [] },
      topPerformers,
      atRiskTenants: atRisk,
      categoryBreakdown: [],
    };
  },
});
