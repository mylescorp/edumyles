import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

export const createPerformanceRecord = mutation({
  args: {
    sessionToken: v.string(),
    userId: v.string(),
    userName: v.string(),
    userEmail: v.string(),
    role: v.string(),
    department: v.optional(v.string()),
    period: v.string(),
    metrics: v.object({
      ticketsResolved: v.number(),
      avgResponseTime: v.number(),
      avgResolutionTime: v.number(),
      satisfactionScore: v.number(),
      slaCompliance: v.number(),
      escalationRate: v.number(),
      firstContactResolution: v.number(),
    }),
    goals: v.optional(v.object({
      ticketsTarget: v.optional(v.number()),
      satisfactionTarget: v.optional(v.number()),
      responseTimeTarget: v.optional(v.number()),
    })),
    achievements: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const now = Date.now();

    // Calculate overall score (weighted average of key metrics)
    const m = args.metrics;
    const overallScore = Math.round(
      (m.satisfactionScore * 0.25 +
        m.slaCompliance * 0.20 +
        m.firstContactResolution * 0.20 +
        Math.min(100, m.ticketsResolved) * 0.15 +
        (100 - m.escalationRate) * 0.10 +
        Math.max(0, 100 - m.avgResponseTime / 60) * 0.10)
    );

    // Determine trend by comparing with previous record
    const previousRecords = await ctx.db
      .query("staffPerformanceRecords")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(1);

    let trend: "up" | "down" | "stable" = "stable";
    if (previousRecords.length > 0) {
      const prevScore = previousRecords[0].overallScore;
      if (overallScore > prevScore + 2) trend = "up";
      else if (overallScore < prevScore - 2) trend = "down";
    }

    const recordId = await ctx.db.insert("staffPerformanceRecords", {
      userId: args.userId,
      userName: args.userName,
      userEmail: args.userEmail,
      role: args.role,
      department: args.department,
      period: args.period,
      metrics: args.metrics,
      goals: args.goals,
      achievements: args.achievements ?? [],
      trend,
      overallScore,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, recordId, overallScore, trend, message: "Performance record created" };
  },
});

export const updatePerformanceRecord = mutation({
  args: {
    sessionToken: v.string(),
    recordId: v.string(),
    metrics: v.optional(v.object({
      ticketsResolved: v.number(),
      avgResponseTime: v.number(),
      avgResolutionTime: v.number(),
      satisfactionScore: v.number(),
      slaCompliance: v.number(),
      escalationRate: v.number(),
      firstContactResolution: v.number(),
    })),
    achievements: v.optional(v.array(v.string())),
    trend: v.optional(v.union(v.literal("up"), v.literal("down"), v.literal("stable"))),
    overallScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const record = await ctx.db.get(args.recordId as any);
    if (!record) throw new Error("Performance record not found");

    const updates: Record<string, any> = { updatedAt: Date.now() };
    if (args.metrics) updates.metrics = args.metrics;
    if (args.achievements) updates.achievements = args.achievements;
    if (args.trend) updates.trend = args.trend;
    if (args.overallScore !== undefined) updates.overallScore = args.overallScore;

    await ctx.db.patch(args.recordId as any, updates);

    return { success: true, message: "Performance record updated" };
  },
});

export const setPerformanceGoals = mutation({
  args: {
    sessionToken: v.string(),
    recordId: v.string(),
    goals: v.object({
      ticketsTarget: v.optional(v.number()),
      satisfactionTarget: v.optional(v.number()),
      responseTimeTarget: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const record = await ctx.db.get(args.recordId as any);
    if (!record) throw new Error("Performance record not found");

    await ctx.db.patch(args.recordId as any, {
      goals: args.goals,
      updatedAt: Date.now(),
    });

    return { success: true, message: "Performance goals updated" };
  },
});

export const calculatePerformanceScores = mutation({
  args: {
    sessionToken: v.string(),
    userId: v.string(),
    period: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    // Get tickets assigned to this user
    const tickets = await ctx.db
      .query("aiSupportTickets")
      .withIndex("by_assignedTo", (q) => q.eq("assignedTo", args.userId))
      .collect();

    if (tickets.length === 0) {
      return { success: false, message: "No tickets found for this user" };
    }

    const resolved = tickets.filter((t) => t.status === "resolved" || t.status === "closed");
    const escalated = tickets.filter((t) => t.status === "escalated");
    const rated = tickets.filter((t) => t.satisfaction !== undefined && t.satisfaction !== null);

    const avgSatisfaction = rated.length > 0
      ? Math.round((rated.reduce((sum, t) => sum + (t.satisfaction ?? 0), 0) / rated.length) * 10) / 10
      : 0;

    const metrics = {
      ticketsResolved: resolved.length,
      avgResponseTime: 0, // Would need response timestamps to calculate
      avgResolutionTime: resolved.length > 0
        ? Math.round(
            resolved
              .filter((t) => t.resolutionTime !== undefined && t.resolutionTime !== null)
              .reduce((sum, t) => sum + (t.resolutionTime ?? 0), 0) /
            Math.max(1, resolved.filter((t) => t.resolutionTime !== undefined).length)
          )
        : 0,
      satisfactionScore: avgSatisfaction * 20, // Scale 0-5 to 0-100
      slaCompliance: tickets.length > 0
        ? Math.round((resolved.length / tickets.length) * 100)
        : 0,
      escalationRate: tickets.length > 0
        ? Math.round((escalated.length / tickets.length) * 100)
        : 0,
      firstContactResolution: resolved.length > 0
        ? Math.round(
            (resolved.filter((t) => t.aiResponses.length <= 1).length / resolved.length) * 100
          )
        : 0,
    };

    // Calculate overall score
    const overallScore = Math.round(
      (metrics.satisfactionScore * 0.25 +
        metrics.slaCompliance * 0.20 +
        metrics.firstContactResolution * 0.20 +
        Math.min(100, metrics.ticketsResolved) * 0.15 +
        (100 - metrics.escalationRate) * 0.10 +
        Math.max(0, 100 - metrics.avgResponseTime / 60) * 0.10)
    );

    // Check if record exists for this period
    const existing = await ctx.db
      .query("staffPerformanceRecords")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const periodRecord = existing.find((r) => r.period === args.period);

    // Determine trend
    const previousRecords = existing
      .filter((r) => r.period !== args.period)
      .sort((a, b) => b.createdAt - a.createdAt);

    let trend: "up" | "down" | "stable" = "stable";
    if (previousRecords.length > 0) {
      const prevScore = previousRecords[0].overallScore;
      if (overallScore > prevScore + 2) trend = "up";
      else if (overallScore < prevScore - 2) trend = "down";
    }

    const now = Date.now();

    if (periodRecord) {
      await ctx.db.patch(periodRecord._id, {
        metrics,
        overallScore,
        trend,
        updatedAt: now,
      });
      return { success: true, recordId: periodRecord._id, overallScore, trend, message: "Performance scores recalculated" };
    }

    // Need user info - try to find from existing records or use userId
    const userName = existing.length > 0 ? existing[0].userName : args.userId;
    const userEmail = existing.length > 0 ? existing[0].userEmail : "";
    const role = existing.length > 0 ? existing[0].role : "agent";
    const department = existing.length > 0 ? existing[0].department : undefined;

    const recordId = await ctx.db.insert("staffPerformanceRecords", {
      userId: args.userId,
      userName,
      userEmail,
      role,
      department,
      period: args.period,
      metrics,
      goals: existing.length > 0 ? existing[0].goals : undefined,
      achievements: [],
      trend,
      overallScore,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, recordId, overallScore, trend, message: "Performance scores calculated" };
  },
});
