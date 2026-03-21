import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

export const getWorkflows = query({
  args: {
    sessionToken: v.string(),
    category: v.optional(v.union(
      v.literal("onboarding"),
      v.literal("offboarding"),
      v.literal("compliance"),
      v.literal("security"),
      v.literal("communications"),
      v.literal("data_management"),
      v.literal("approval"),
      v.literal("notification"),
      v.literal("integration")
    )),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("draft"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const limit = args.limit ?? 50;

    let workflows;
    if (args.category) {
      workflows = await ctx.db
        .query("workflows")
        .withIndex("by_category", (q) => q.eq("tenantId", "PLATFORM").eq("category", args.category!))
        .order("desc")
        .take(limit);
    } else {
      workflows = await ctx.db
        .query("workflows")
        .withIndex("by_tenant", (q) => q.eq("tenantId", "PLATFORM"))
        .order("desc")
        .take(limit);
    }

    if (args.status === "active") {
      workflows = workflows.filter((w) => w.isActive);
    } else if (args.status === "inactive") {
      workflows = workflows.filter((w) => !w.isActive);
    }

    return workflows;
  },
});

export const getWorkflowExecutions = query({
  args: {
    sessionToken: v.string(),
    workflowId: v.optional(v.string()),
    status: v.optional(v.union(v.literal("running"), v.literal("completed"), v.literal("failed"), v.literal("cancelled"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const limit = args.limit ?? 50;

    let executions;
    if (args.workflowId) {
      executions = await ctx.db
        .query("workflowExecutions")
        .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId!))
        .order("desc")
        .take(limit);
    } else if (args.status) {
      executions = await ctx.db
        .query("workflowExecutions")
        .withIndex("by_status", (q) => q.eq("tenantId", "PLATFORM").eq("status", args.status!))
        .order("desc")
        .take(limit);
    } else {
      executions = await ctx.db
        .query("workflowExecutions")
        .withIndex("by_tenant", (q) => q.eq("tenantId", "PLATFORM"))
        .order("desc")
        .take(limit);
    }

    if (args.status && !args.workflowId) return executions;
    if (args.status) {
      executions = executions.filter((e) => e.status === args.status);
    }
    return executions;
  },
});

export const getWorkflowTemplates = query({
  args: {
    sessionToken: v.string(),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const limit = args.limit ?? 50;

    let templates;
    if (args.category) {
      templates = await ctx.db
        .query("workflowTemplates")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .take(limit);
    } else {
      templates = await ctx.db
        .query("workflowTemplates")
        .order("desc")
        .take(limit);
    }

    if (args.tags && args.tags.length > 0) {
      templates = templates.filter((t) =>
        args.tags!.some((tag) => t.tags.includes(tag))
      );
    }

    return templates;
  },
});

export const getAutomationMetrics = query({
  args: {
    sessionToken: v.string(),
    timeRange: v.optional(v.union(v.literal("24h"), v.literal("7d"), v.literal("30d"), v.literal("90d"))),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const timeRange = args.timeRange ?? "30d";
    const msMap: Record<string, number> = {
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
    };
    const since = Date.now() - msMap[timeRange];

    const allWorkflows = await ctx.db
      .query("workflows")
      .withIndex("by_tenant", (q) => q.eq("tenantId", "PLATFORM"))
      .collect();

    const allExecutions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_tenant", (q) => q.eq("tenantId", "PLATFORM"))
      .collect();

    const recentExecutions = allExecutions.filter((e) => e.startedAt >= since);

    const totalExecutions = recentExecutions.length;
    const successfulExecutions = recentExecutions.filter((e) => e.status === "completed").length;
    const failedExecutions = recentExecutions.filter((e) => e.status === "failed").length;
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;
    const avgDuration =
      recentExecutions.length > 0
        ? recentExecutions.reduce((sum, e) => sum + (e.duration ?? 0), 0) / recentExecutions.length
        : 0;

    // Group by category
    const categoryMap: Record<string, { count: number; executions: number; successCount: number }> = {};
    for (const wf of allWorkflows) {
      if (!categoryMap[wf.category]) {
        categoryMap[wf.category] = { count: 0, executions: 0, successCount: 0 };
      }
      categoryMap[wf.category].count++;
    }
    for (const ex of recentExecutions) {
      const wf = allWorkflows.find((w) => w._id.toString() === ex.workflowId);
      if (wf && categoryMap[wf.category]) {
        categoryMap[wf.category].executions++;
        if (ex.status === "completed") categoryMap[wf.category].successCount++;
      }
    }
    const byCategory = Object.entries(categoryMap).map(([category, data]) => ({
      category,
      count: data.count,
      executions: data.executions,
      successRate: data.executions > 0 ? (data.successCount / data.executions) * 100 : 0,
    }));

    // Top performers
    const topPerformers = allWorkflows
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5)
      .map((wf) => ({
        workflowId: wf._id,
        workflowName: wf.name,
        executions: wf.executionCount,
        successRate: wf.successRate,
        avgDuration: wf.averageDuration,
      }));

    // Daily trends (last 7 data points)
    const trends: { date: string; executions: number; successRate: number }[] = [];
    const dayMs = 24 * 60 * 60 * 1000;
    for (let i = 6; i >= 0; i--) {
      const dayStart = Date.now() - i * dayMs;
      const dayEnd = dayStart + dayMs;
      const dayExecs = recentExecutions.filter((e) => e.startedAt >= dayStart && e.startedAt < dayEnd);
      const daySuc = dayExecs.filter((e) => e.status === "completed").length;
      trends.push({
        date: new Date(dayStart).toISOString().split("T")[0],
        executions: dayExecs.length,
        successRate: dayExecs.length > 0 ? (daySuc / dayExecs.length) * 100 : 0,
      });
    }

    return {
      overview: {
        totalWorkflows: allWorkflows.length,
        activeWorkflows: allWorkflows.filter((w) => w.isActive).length,
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        successRate: Math.round(successRate * 10) / 10,
        averageExecutionTime: Math.round(avgDuration * 100) / 100,
      },
      byCategory,
      trends,
      topPerformers,
      timeSaved: {
        totalHoursSaved: Math.round(successfulExecutions * 1.5),
        avgHoursPerExecution: 1.5,
        estimatedCostSavings: Math.round(successfulExecutions * 1.5 * 500),
      },
    };
  },
});
