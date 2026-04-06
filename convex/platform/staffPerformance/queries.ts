import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

export const listStaffPerformance = query({
  args: {
    sessionToken: v.string(),
    department: v.optional(v.string()),
    period: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    let records;
    if (args.period) {
      records = await ctx.db
        .query("staffPerformanceRecords")
        .withIndex("by_period", (q) => q.eq("period", args.period!))
        .collect();
    } else {
      records = await ctx.db
        .query("staffPerformanceRecords")
        .order("desc")
        .take(200);
    }

    if (args.department) {
      records = records.filter((r) => r.department === args.department);
    }

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      records = records.filter(
        (r) =>
          r.userName.toLowerCase().includes(searchLower) ||
          r.userEmail.toLowerCase().includes(searchLower) ||
          r.role.toLowerCase().includes(searchLower)
      );
    }

    return records;
  },
});

export const getStaffDetail = query({
  args: {
    sessionToken: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const records = await ctx.db
      .query("staffPerformanceRecords")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    if (records.length === 0) throw new Error("No performance records found for this user");

    const latest = records[0];
    if (!latest) throw new Error("No performance records found for this user");
    return {
      userId: latest.userId,
      userName: latest.userName,
      userEmail: latest.userEmail,
      role: latest.role,
      department: latest.department,
      currentScore: latest.overallScore,
      trend: latest.trend,
      achievements: latest.achievements,
      goals: latest.goals,
      periods: records.map((r) => ({
        period: r.period,
        metrics: r.metrics,
        overallScore: r.overallScore,
        trend: r.trend,
      })),
    };
  },
});

export const getPerformanceTrends = query({
  args: {
    sessionToken: v.string(),
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    let records;
    if (args.period) {
      records = await ctx.db
        .query("staffPerformanceRecords")
        .withIndex("by_period", (q) => q.eq("period", args.period!))
        .collect();
    } else {
      records = await ctx.db
        .query("staffPerformanceRecords")
        .order("desc")
        .take(500);
    }

    if (records.length === 0) {
      return {
        totalStaff: 0,
        avgScore: 0,
        avgSatisfaction: 0,
        avgResponseTime: 0,
        avgResolutionTime: 0,
        avgSlaCompliance: 0,
        trendUp: 0,
        trendDown: 0,
        trendStable: 0,
      };
    }

    const totalStaff = records.length;
    const avgScore = Math.round(records.reduce((sum, r) => sum + r.overallScore, 0) / totalStaff);
    const avgSatisfaction = Math.round(
      (records.reduce((sum, r) => sum + r.metrics.satisfactionScore, 0) / totalStaff) * 10
    ) / 10;
    const avgResponseTime = Math.round(
      records.reduce((sum, r) => sum + r.metrics.avgResponseTime, 0) / totalStaff
    );
    const avgResolutionTime = Math.round(
      records.reduce((sum, r) => sum + r.metrics.avgResolutionTime, 0) / totalStaff
    );
    const avgSlaCompliance = Math.round(
      records.reduce((sum, r) => sum + r.metrics.slaCompliance, 0) / totalStaff
    );

    return {
      totalStaff,
      avgScore,
      avgSatisfaction,
      avgResponseTime,
      avgResolutionTime,
      avgSlaCompliance,
      trendUp: records.filter((r) => r.trend === "up").length,
      trendDown: records.filter((r) => r.trend === "down").length,
      trendStable: records.filter((r) => r.trend === "stable").length,
    };
  },
});

export const getTopPerformers = query({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const limit = args.limit ?? 10;

    const records = await ctx.db
      .query("staffPerformanceRecords")
      .withIndex("by_overallScore")
      .order("desc")
      .take(limit);

    return records;
  },
});
