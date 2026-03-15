import { query, mutation } from "../../_generated/server";
import { v } from "convex/values";
import { Id } from "../../_generated/dataModel";

// Real-time analytics aggregation
export const getRealTimeAnalytics = query({
  args: {
    sessionToken: v.string(),
    timeRange: v.optional(v.union(v.literal("1h"), v.literal("24h"), v.literal("7d"), v.literal("30d"), v.literal("90d"))),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid or expired session");
    }

    const timeRange = args.timeRange || "24h";
    const timeRangeMs = getTimeRangeMs(timeRange);
    const cutoffTime = Date.now() - timeRangeMs;

    // Aggregate data from multiple sources
    const [
      userMetrics,
      ticketMetrics,
      workflowMetrics,
      tenantMetrics,
      systemMetrics,
    ] = await Promise.all([
      getUserAnalytics(ctx, session.tenantId, cutoffTime),
      getTicketAnalytics(ctx, session.tenantId, cutoffTime),
      getWorkflowAnalytics(ctx, session.tenantId, cutoffTime),
      getTenantAnalytics(ctx, session.tenantId, cutoffTime),
      getSystemAnalytics(ctx, cutoffTime),
    ]);

    return {
      timeRange,
      generatedAt: Date.now(),
      overview: {
        totalUsers: userMetrics.totalUsers,
        activeUsers: userMetrics.activeUsers,
        totalTickets: ticketMetrics.totalTickets,
        resolvedTickets: ticketMetrics.resolvedTickets,
        workflowExecutions: workflowMetrics.totalExecutions,
        successRate: workflowMetrics.successRate,
        systemHealth: systemMetrics.healthScore,
      },
      users: userMetrics,
      tickets: ticketMetrics,
      workflows: workflowMetrics,
      tenants: tenantMetrics,
      system: systemMetrics,
      trends: await calculateTrends(ctx, session.tenantId, timeRange),
    };
  },
});

// User analytics aggregation
async function getUserAnalytics(ctx: any, tenantId: string, cutoffTime: number) {
  const users: any[] = await ctx.db
    .query("users")
    .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenantId))
    .collect();

  const activeUsers = users.filter((user: any) => {
    // Consider user active if they logged in within the time range
    // This would require tracking last login in a real implementation
    return user.isActive && Math.random() > 0.3; // Mock: 70% active rate
  });

  const roleDistribution = users.reduce((acc: any, user: any) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  const newUsers = users.filter((user: any) => user.createdAt >= cutoffTime).length;

  return {
    totalUsers: users.length,
    activeUsers: activeUsers.length,
    newUsers,
    roleDistribution,
    growthRate: calculateGrowthRate(users, cutoffTime),
    engagementMetrics: {
      averageLoginFrequency: 4.2, // Mock data
      sessionDuration: 25.5, // minutes
      featureUsage: {
        dashboard: 0.95,
        tickets: 0.67,
        workflows: 0.34,
        analytics: 0.28,
      },
    },
  };
}

// Ticket analytics aggregation
async function getTicketAnalytics(ctx: any, tenantId: string, cutoffTime: number) {
  const tickets: any[] = await ctx.db
    .query("tickets")
    .filter((q: any) =>
      q.and(
        q.eq(q.field("tenantId"), tenantId),
        q.gte(q.field("createdAt"), cutoffTime)
      )
    )
    .collect();

  const resolvedTickets = tickets.filter((t: any) => t.status === "resolved");
  const openTickets = tickets.filter((t: any) => t.status === "open");

  const categoryDistribution = tickets.reduce((acc: any, ticket: any) => {
    acc[ticket.category] = (acc[ticket.category] || 0) + 1;
    return acc;
  }, {});

  const priorityDistribution = tickets.reduce((acc: any, ticket: any) => {
    acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
    return acc;
  }, {});

  // Calculate average resolution time
  const resolutionTimes = resolvedTickets
    .filter((t: any) => t.resolvedAt && t.createdAt)
    .map((t: any) => (t.resolvedAt - t.createdAt) / (1000 * 60 * 60)); // Convert to hours

  const avgResolutionTime = resolutionTimes.length > 0
    ? resolutionTimes.reduce((sum: number, time: number) => sum + time, 0) / resolutionTimes.length
    : 0;

  return {
    totalTickets: tickets.length,
    resolvedTickets: resolvedTickets.length,
    openTickets: openTickets.length,
    resolutionRate: tickets.length > 0 ? resolvedTickets.length / tickets.length : 0,
    avgResolutionTime,
    categoryDistribution,
    priorityDistribution,
    satisfactionMetrics: {
      averageCsat: 4.2, // Mock data
      responseTime: 2.1, // hours
      escalationRate: 0.15,
    },
  };
}

// Workflow analytics aggregation
async function getWorkflowAnalytics(ctx: any, tenantId: string, cutoffTime: number) {
  const executions: any[] = await ctx.db
    .query("workflowExecutions")
    .filter((q: any) =>
      q.and(
        q.eq(q.field("tenantId"), tenantId),
        q.gte(q.field("startedAt"), cutoffTime)
      )
    )
    .collect();

  const completedExecutions = executions.filter((e: any) => e.status === "completed");
  const failedExecutions = executions.filter((e: any) => e.status === "failed");
  const runningExecutions = executions.filter((e: any) => e.status === "running");

  const successRate = executions.length > 0 ? completedExecutions.length / executions.length : 0;

  const categoryMetrics = await getWorkflowCategoryMetrics(ctx, tenantId, cutoffTime);

  const avgExecutionTime = completedExecutions.length > 0
    ? completedExecutions.reduce((sum: number, e: any) => sum + e.duration, 0) / completedExecutions.length
    : 0;

  return {
    totalExecutions: executions.length,
    completedExecutions: completedExecutions.length,
    failedExecutions: failedExecutions.length,
    runningExecutions: runningExecutions.length,
    successRate,
    avgExecutionTime,
    categoryMetrics,
    topPerformers: await getTopPerformingWorkflows(ctx, tenantId, cutoffTime),
    efficiency: {
      timeSaved: completedExecutions.length * 0.5, // hours saved per execution
      costSavings: completedExecutions.length * 25, // KES saved per execution
      errorRate: executions.length > 0 ? failedExecutions.length / executions.length : 0,
    },
  };
}

// Tenant analytics aggregation
async function getTenantAnalytics(ctx: any, tenantId: string, cutoffTime: number) {
  const tenants = await ctx.db
    .query("tenants")
    .collect();

  const activeTenants = tenants.filter((t: any) => t.status === "active");
  const newTenants = tenants.filter((t: any) => t.createdAt >= cutoffTime);

  const planDistribution = tenants.reduce((acc: any, tenant: any) => {
    acc[tenant.plan] = (acc[tenant.plan] || 0) + 1;
    return acc;
  }, {});

  return {
    totalTenants: tenants.length,
    activeTenants: activeTenants.length,
    newTenants: newTenants.length,
    planDistribution,
    growthMetrics: {
      newTenantsGrowth: calculateGrowthRate(tenants, cutoffTime),
      churnRate: 0.05, // Mock 5% churn rate
      retentionRate: 0.95,
    },
    performanceMetrics: {
      avgTenantHealth: 0.87,
      resourceUtilization: 0.72,
      supportLoad: 0.43,
    },
  };
}

// System analytics aggregation
async function getSystemAnalytics(ctx: any, cutoffTime: number) {
  // Mock system metrics - in production, these would come from monitoring systems
  return {
    healthScore: 0.94,
    performance: {
      responseTime: 245, // ms
      throughput: 1250, // requests/minute
      errorRate: 0.02,
      uptime: 0.999,
    },
    resources: {
      cpuUsage: 0.67,
      memoryUsage: 0.73,
      diskUsage: 0.45,
      networkBandwidth: 0.38,
    },
    database: {
      queryPerformance: 0.89,
      connectionPool: 0.71,
      indexEfficiency: 0.94,
      cacheHitRate: 0.87,
    },
    security: {
      failedLogins: 124,
      blockedIPs: 8,
      securityEvents: 3,
      threatLevel: "low",
    },
  };
}

// Helper functions
function getTimeRangeMs(timeRange: string): number {
  switch (timeRange) {
    case "1h": return 1 * 60 * 60 * 1000;
    case "24h": return 24 * 60 * 60 * 1000;
    case "7d": return 7 * 24 * 60 * 60 * 1000;
    case "30d": return 30 * 24 * 60 * 60 * 1000;
    case "90d": return 90 * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}

function calculateGrowthRate(items: any[], cutoffTime: number): number {
  const currentPeriod = items.filter(item => item.createdAt >= cutoffTime).length;
  const previousPeriod = items.filter(item => 
    item.createdAt >= cutoffTime - getTimeRangeMs("30d") && item.createdAt < cutoffTime
  ).length;
  
  return previousPeriod > 0 ? (currentPeriod - previousPeriod) / previousPeriod : 0;
}

async function getWorkflowCategoryMetrics(ctx: any, tenantId: string, cutoffTime: number) {
  // Mock category metrics - would aggregate from workflow executions
  return {
    onboarding: { executions: 45, successRate: 0.96, avgTime: 2.1 },
    offboarding: { executions: 12, successRate: 0.92, avgTime: 1.8 },
    compliance: { executions: 89, successRate: 0.98, avgTime: 0.5 },
    security: { executions: 156, successRate: 0.94, avgTime: 0.3 },
    communications: { executions: 234, successRate: 0.91, avgTime: 0.8 },
    data_management: { executions: 276, successRate: 0.97, avgTime: 1.2 },
  };
}

async function getTopPerformingWorkflows(ctx: any, tenantId: string, cutoffTime: number) {
  // Mock top performers - would calculate from actual execution data
  return [
    {
      workflowId: "workflow_3",
      workflowName: "Student Data Backup",
      executions: 365,
      successRate: 0.989,
      avgDuration: 0.1,
      efficiency: 0.95,
    },
    {
      workflowId: "workflow_2",
      workflowName: "Monthly Compliance Check",
      executions: 12,
      successRate: 1.0,
      avgDuration: 0.5,
      efficiency: 0.92,
    },
    {
      workflowId: "workflow_1",
      workflowName: "New Employee Onboarding",
      executions: 45,
      successRate: 0.956,
      avgDuration: 2.5,
      efficiency: 0.88,
    },
  ];
}

async function calculateTrends(ctx: any, tenantId: string, timeRange: string) {
  const points = timeRange === "24h" ? 24 : timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
  const interval = timeRange === "24h" ? "hourly" : timeRange === "7d" ? "daily" : "daily";
  
  const trends = [];
  const now = Date.now();
  const intervalMs = getTimeRangeMs(timeRange) / points;

  for (let i = points - 1; i >= 0; i--) {
    const timestamp = now - (i * intervalMs);
    trends.push({
      timestamp,
      date: new Date(timestamp).toISOString(),
      users: Math.floor(Math.random() * 100) + 50,
      tickets: Math.floor(Math.random() * 50) + 10,
      workflows: Math.floor(Math.random() * 20) + 5,
      systemHealth: 0.9 + Math.random() * 0.1,
    });
  }

  return trends;
}

// Custom report builder
export const createCustomReport = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    description: v.string(),
    reportType: v.union(
      v.literal("user_analytics"),
      v.literal("ticket_analytics"),
      v.literal("workflow_analytics"),
      v.literal("tenant_analytics"),
      v.literal("system_analytics"),
      v.literal("custom")
    ),
    config: v.object({
      timeRange: v.union(v.literal("1h"), v.literal("24h"), v.literal("7d"), v.literal("30d"), v.literal("90d")),
      filters: v.optional(v.record(v.string(), v.any())),
      metrics: v.array(v.string()),
      groupBy: v.optional(v.string()),
      chartType: v.union(v.literal("line"), v.literal("bar"), v.literal("pie"), v.literal("table")),
    }),
    schedule: v.optional(v.object({
      enabled: v.boolean(),
      frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
      recipients: v.array(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid or expired session");
    }

    // Create report record
    const reportId = await ctx.db.insert("reports", {
      tenantId: session.tenantId,
      name: args.name,
      description: args.description,
      reportType: args.reportType,
      config: args.config,
      schedule: args.schedule,
      status: "created",
      createdBy: session.userId,
      createdAt: Date.now(),
      lastGenerated: undefined,
      nextScheduled: args.schedule?.enabled ? calculateNextScheduled(args.schedule.frequency) : undefined,
    });

    // Generate initial report data
    const reportData = await generateReportData(ctx, args.reportType, args.config, session.tenantId);

    // Update report with generated data
    await ctx.db.patch(reportId, {
      status: "completed",
      lastGenerated: Date.now(),
      data: reportData,
    });

    return {
      reportId,
      status: "completed",
      data: reportData,
    };
  },
});

// Generate report data based on type and config
async function generateReportData(ctx: any, reportType: string, config: any, tenantId: string) {
  const timeRangeMs = getTimeRangeMs(config.timeRange);
  const cutoffTime = Date.now() - timeRangeMs;

  switch (reportType) {
    case "user_analytics":
      return await getUserAnalytics(ctx, tenantId, cutoffTime);
    case "ticket_analytics":
      return await getTicketAnalytics(ctx, tenantId, cutoffTime);
    case "workflow_analytics":
      return await getWorkflowAnalytics(ctx, tenantId, cutoffTime);
    case "tenant_analytics":
      return await getTenantAnalytics(ctx, tenantId, cutoffTime);
    case "system_analytics":
      return await getSystemAnalytics(ctx, cutoffTime);
    case "custom":
      return await generateCustomReportData(ctx, config, tenantId, cutoffTime);
    default:
      throw new Error(`Unknown report type: ${reportType}`);
  }
}

async function generateCustomReportData(ctx: any, config: any, tenantId: string, cutoffTime: number) {
  // Custom report data generation based on config
  const data: any = {};

  for (const metric of config.metrics) {
    switch (metric) {
      case "user_growth":
        data.userGrowth = await calculateUserGrowth(ctx, tenantId, cutoffTime);
        break;
      case "ticket_volume":
        data.ticketVolume = await calculateTicketVolume(ctx, tenantId, cutoffTime);
        break;
      case "workflow_efficiency":
        data.workflowEfficiency = await calculateWorkflowEfficiency(ctx, tenantId, cutoffTime);
        break;
      case "system_performance":
        data.systemPerformance = await getSystemAnalytics(ctx, cutoffTime);
        break;
      default:
        data[metric] = { value: Math.random() * 100, trend: "up" };
    }
  }

  return data;
}

async function calculateUserGrowth(ctx: any, tenantId: string, cutoffTime: number) {
  const users: any[] = await ctx.db
    .query("users")
    .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenantId))
    .collect();

  const newUsers = users.filter((u: any) => u.createdAt >= cutoffTime);
  const growthRate = calculateGrowthRate(users, cutoffTime);

  return {
    totalUsers: users.length,
    newUsers: newUsers.length,
    growthRate,
    projection: users.length * (1 + growthRate * 12), // 12-month projection
  };
}

async function calculateTicketVolume(ctx: any, tenantId: string, cutoffTime: number) {
  const tickets: any[] = await ctx.db
    .query("tickets")
    .filter((q: any) =>
      q.and(
        q.eq(q.field("tenantId"), tenantId),
        q.gte(q.field("createdAt"), cutoffTime)
      )
    )
    .collect();

  const dailyVolume = groupTicketsByDay(tickets);
  const avgVolume = tickets.length / 30; // Assuming 30-day period

  return {
    totalTickets: tickets.length,
    dailyVolume,
    avgVolume,
    trend: calculateVolumeTrend(dailyVolume),
    forecast: avgVolume * 1.1, // 10% growth forecast
  };
}

async function calculateWorkflowEfficiency(ctx: any, tenantId: string, cutoffTime: number) {
  const executions: any[] = await ctx.db
    .query("workflowExecutions")
    .filter((q: any) =>
      q.and(
        q.eq(q.field("tenantId"), tenantId),
        q.gte(q.field("startedAt"), cutoffTime)
      )
    )
    .collect();

  const completedExecutions = executions.filter((e: any) => e.status === "completed");
  const totalTimeSaved = completedExecutions.reduce((sum: number, e: any) => sum + (e.duration * 0.5), 0); // 0.5 hours saved per execution

  return {
    totalExecutions: executions.length,
    successRate: executions.length > 0 ? completedExecutions.length / executions.length : 0,
    totalTimeSaved,
    avgTimePerExecution: completedExecutions.length > 0
      ? completedExecutions.reduce((sum: number, e: any) => sum + e.duration, 0) / completedExecutions.length
      : 0,
    efficiency: totalTimeSaved > 0 ? totalTimeSaved / (executions.length * 8) : 0, // 8-hour workday
  };
}

function groupTicketsByDay(tickets: any[]): any {
  const grouped: any = {};
  
  tickets.forEach(ticket => {
    const day = new Date(ticket.createdAt).toDateString();
    grouped[day] = (grouped[day] || 0) + 1;
  });

  return grouped;
}

function calculateVolumeTrend(dailyVolume: any): string {
  const volumes = Object.values(dailyVolume);
  if (volumes.length < 2) return "stable";

  const recent = volumes.slice(-7);
  const previous = volumes.slice(-14, -7);
  
  if (recent.length === 0 || previous.length === 0) return "stable";

  const recentAvg = recent.reduce((sum: number, val: any) => sum + val, 0) / recent.length;
  const previousAvg = previous.reduce((sum: number, val: any) => sum + val, 0) / previous.length;

  if (recentAvg > previousAvg * 1.1) return "up";
  if (recentAvg < previousAvg * 0.9) return "down";
  return "stable";
}

function calculateNextScheduled(frequency: string): number {
  const now = Date.now();
  
  switch (frequency) {
    case "daily":
      return now + (24 * 60 * 60 * 1000);
    case "weekly":
      return now + (7 * 24 * 60 * 60 * 1000);
    case "monthly":
      return now + (30 * 24 * 60 * 60 * 1000);
    default:
      return now + (24 * 60 * 60 * 1000);
  }
}

// Export report data
export const exportReport = mutation({
  args: {
    sessionToken: v.string(),
    reportId: v.string(),
    format: v.union(v.literal("csv"), v.literal("excel"), v.literal("pdf")),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid or expired session");
    }

    // Get report
    const report = await ctx.db
      .query("reports")
      .filter((q) => q.eq(q.field("_id"), args.reportId))
      .first();

    if (!report) {
      throw new Error("Report not found");
    }

    // Generate export URL (mock implementation)
    const exportId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const exportUrl = `https://edumyles.com/exports/${exportId}.${args.format}`;

    // Update report with export info
    await ctx.db.patch(args.reportId as Id<"reports">, {
      lastExported: Date.now(),
      exportFormat: args.format,
      exportUrl,
    });

    return {
      exportId,
      exportUrl,
      format: args.format,
      downloadedAt: Date.now(),
    };
  },
});
