import { mutation } from "../../_generated/server";
import { v } from "convex/values";

export const createTenantHealthScore = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    category: v.union(
      v.literal("adoption"),
      v.literal("engagement"),
      v.literal("support"),
      v.literal("technical"),
      v.literal("financial"),
      v.literal("overall")
    ),
    metrics: v.record(v.string(), v.any()),
    score: v.number(),
    grade: v.union(v.literal("A"), v.literal("B"), v.literal("C"), v.literal("D"), v.literal("F")),
    factors: v.array(v.object({
      name: v.string(),
      weight: v.number(),
      value: v.number(),
      impact: v.string(),
    })),
    recommendations: v.array(v.string()),
    calculatedAt: v.number(),
    calculatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Find previous score for delta tracking
    const previous = await ctx.db
      .query("tenantHealthScores")
      .withIndex("by_category", (q) =>
        q.eq("tenantId", args.tenantId).eq("category", args.category)
      )
      .order("desc")
      .first();

    const healthScoreId = await ctx.db.insert("tenantHealthScores", {
      tenantId: args.tenantId,
      category: args.category,
      score: args.score,
      grade: args.grade,
      metrics: args.metrics,
      factors: args.factors,
      recommendations: args.recommendations,
      trends: [],
      calculatedAt: args.calculatedAt,
      calculatedBy: args.calculatedBy,
      previousScore: previous?.score,
      scoreChange: previous ? args.score - previous.score : undefined,
    });

    return { success: true, healthScoreId, message: "Health score created" };
  },
});

export const updateTenantHealthScore = mutation({
  args: {
    sessionToken: v.string(),
    healthScoreId: v.string(),
    metrics: v.optional(v.record(v.string(), v.any())),
    score: v.optional(v.number()),
    grade: v.optional(v.union(v.literal("A"), v.literal("B"), v.literal("C"), v.literal("D"), v.literal("F"))),
    factors: v.optional(v.array(v.object({
      name: v.string(),
      weight: v.number(),
      value: v.number(),
      impact: v.string(),
    }))),
    recommendations: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.healthScoreId as any);
    if (!existing) throw new Error("Health score not found");

    const patch: Record<string, any> = { calculatedAt: Date.now(), calculatedBy: args.updatedBy };
    if (args.metrics !== undefined) patch.metrics = args.metrics;
    if (args.score !== undefined) {
      patch.previousScore = (existing as any).score;
      patch.scoreChange = args.score - (existing as any).score;
      patch.score = args.score;
    }
    if (args.grade !== undefined) patch.grade = args.grade;
    if (args.factors !== undefined) patch.factors = args.factors;
    if (args.recommendations !== undefined) patch.recommendations = args.recommendations;

    await ctx.db.patch(args.healthScoreId as any, patch);
    return { success: true, message: "Health score updated" };
  },
});

export const createSuccessInitiative = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("onboarding"),
      v.literal("training"),
      v.literal("optimization"),
      v.literal("support"),
      v.literal("engagement"),
      v.literal("retention")
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    targetScore: v.number(),
    currentScore: v.number(),
    actions: v.array(v.object({
      id: v.string(),
      title: v.string(),
      assignee: v.string(),
      dueDate: v.string(),
      status: v.string(),
      completedAt: v.optional(v.string()),
    })),
    milestones: v.array(v.object({
      title: v.string(),
      targetDate: v.string(),
      completed: v.boolean(),
      completedAt: v.optional(v.string()),
    })),
    createdBy: v.string(),
    assignedTo: v.string(),
    startDate: v.string(),
    targetDate: v.string(),
    status: v.union(
      v.literal("planned"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const initiativeId = await ctx.db.insert("successInitiatives", {
      tenantId: args.tenantId,
      title: args.title,
      description: args.description,
      category: args.category,
      priority: args.priority,
      targetScore: args.targetScore,
      currentScore: args.currentScore,
      progress: 0,
      actions: args.actions,
      milestones: args.milestones,
      createdBy: args.createdBy,
      assignedTo: args.assignedTo,
      startDate: args.startDate,
      targetDate: args.targetDate,
      status: args.status,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, initiativeId, message: "Initiative created" };
  },
});

export const updateInitiativeProgress = mutation({
  args: {
    sessionToken: v.string(),
    initiativeId: v.string(),
    actionUpdates: v.array(v.object({
      id: v.string(),
      status: v.string(),
      completedAt: v.optional(v.string()),
    })),
    milestoneUpdates: v.array(v.object({
      title: v.string(),
      completed: v.boolean(),
      completedAt: v.optional(v.string()),
    })),
    newScore: v.optional(v.number()),
    notes: v.string(),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const initiative = await ctx.db.get(args.initiativeId as any);
    if (!initiative) throw new Error("Initiative not found");

    const init = initiative as any;

    // Merge action updates
    const updatedActions = init.actions.map((action: any) => {
      const update = args.actionUpdates.find((u) => u.id === action.id);
      return update ? { ...action, ...update } : action;
    });

    // Merge milestone updates
    const updatedMilestones = init.milestones.map((milestone: any) => {
      const update = args.milestoneUpdates.find((u) => u.title === milestone.title);
      return update ? { ...milestone, ...update } : milestone;
    });

    // Recalculate progress from completed actions
    const totalActions = updatedActions.length;
    const completedActions = updatedActions.filter((a: any) => a.status === "completed").length;
    const progress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

    await ctx.db.patch(args.initiativeId as any, {
      actions: updatedActions,
      milestones: updatedMilestones,
      progress,
      currentScore: args.newScore ?? init.currentScore,
      updatedAt: Date.now(),
    });

    return { success: true, message: "Initiative progress updated" };
  },
});

export const createSuccessMetric = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("adoption"),
      v.literal("engagement"),
      v.literal("support"),
      v.literal("technical"),
      v.literal("financial")
    ),
    unit: v.string(),
    targetValue: v.number(),
    currentValue: v.number(),
    baselineValue: v.number(),
    calculationMethod: v.union(v.literal("automated"), v.literal("manual"), v.literal("survey")),
    frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    isActive: v.boolean(),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const metricId = await ctx.db.insert("successMetrics", {
      tenantId: args.tenantId,
      name: args.name,
      description: args.description,
      category: args.category,
      unit: args.unit,
      targetValue: args.targetValue,
      currentValue: args.currentValue,
      baselineValue: args.baselineValue,
      calculationMethod: args.calculationMethod,
      frequency: args.frequency,
      isActive: args.isActive,
      trend: undefined,
      lastUpdated: now,
      history: [],
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, metricId, message: "Metric created" };
  },
});

export const recordMetricValue = mutation({
  args: {
    sessionToken: v.string(),
    metricId: v.string(),
    value: v.number(),
    recordedAt: v.number(),
    notes: v.optional(v.string()),
    recordedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const metric = await ctx.db.get(args.metricId as any);
    if (!metric) throw new Error("Metric not found");

    const m = metric as any;
    const history = [...(m.history ?? []), {
      date: new Date(args.recordedAt).toISOString().split("T")[0],
      value: args.value,
    }];

    // Determine trend from last 2 values
    let trend: string | undefined;
    if (history.length >= 2) {
      const prev = history[history.length - 2].value;
      trend = args.value > prev ? "up" : args.value < prev ? "down" : "stable";
    }

    await ctx.db.patch(args.metricId as any, {
      currentValue: args.value,
      history,
      trend,
      lastUpdated: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, recordId: `record_${Date.now()}`, message: "Metric value recorded" };
  },
});

export const generateSuccessReport = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    reportType: v.union(
      v.literal("health_score"),
      v.literal("initiatives"),
      v.literal("metrics"),
      v.literal("comprehensive")
    ),
    dateRange: v.object({ start: v.number(), end: v.number() }),
    format: v.union(v.literal("pdf"), v.literal("excel"), v.literal("csv")),
    includeRecommendations: v.boolean(),
    includeActionItems: v.boolean(),
    requestedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const reportId = await ctx.db.insert("reports", {
      tenantId: args.tenantId,
      name: `${args.reportType} report`,
      description: `Success report for tenant ${args.tenantId}`,
      reportType: "tenant_analytics",
      config: {
        timeRange: "30d",
        metrics: [args.reportType],
        chartType: "table",
      },
      status: "generating",
      createdBy: args.requestedBy,
      createdAt: Date.now(),
      exportFormat: args.format,
      data: { dateRange: args.dateRange, includeRecommendations: args.includeRecommendations },
    });

    return {
      success: true,
      reportId,
      downloadUrl: null,
      estimatedTime: "2-3 minutes",
      message: "Report queued for generation",
    };
  },
});
