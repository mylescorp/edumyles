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

  // Determine active users from session/login data
  const recentSessions: any[] = await ctx.db
    .query("sessions")
    .filter((q: any) =>
      q.and(
        q.eq(q.field("tenantId"), tenantId),
        q.gte(q.field("createdAt"), cutoffTime)
      )
    )
    .collect();

  const activeUserIds = new Set(recentSessions.map((s: any) => s.userId));
  const activeUsers = users.filter((user: any) => activeUserIds.has(user._id));

  const roleDistribution = users.reduce((acc: any, user: any) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  const newUsers = users.filter((user: any) => user.createdAt >= cutoffTime).length;

  // Calculate real login frequency from sessions
  const sessionsByUser: Record<string, number> = {};
  recentSessions.forEach((s: any) => {
    sessionsByUser[s.userId] = (sessionsByUser[s.userId] || 0) + 1;
  });
  const sessionCounts = Object.values(sessionsByUser);
  const avgLoginFrequency = sessionCounts.length > 0
    ? sessionCounts.reduce((sum, c) => sum + c, 0) / sessionCounts.length
    : 0;

  // Calculate real feature usage from audit logs
  const auditLogs: any[] = await ctx.db
    .query("auditLogs")
    .filter((q: any) =>
      q.and(
        q.eq(q.field("tenantId"), tenantId),
        q.gte(q.field("timestamp"), cutoffTime)
      )
    )
    .collect();

  const totalLogs = auditLogs.length || 1;
  const featureUsage: Record<string, number> = {};
  auditLogs.forEach((log: any) => {
    const module = log.module || "other";
    featureUsage[module] = (featureUsage[module] || 0) + 1;
  });
  Object.keys(featureUsage).forEach((k) => {
    featureUsage[k] = featureUsage[k] / totalLogs;
  });

  return {
    totalUsers: users.length,
    activeUsers: activeUsers.length,
    newUsers,
    roleDistribution,
    growthRate: calculateGrowthRate(users, cutoffTime),
    engagementMetrics: {
      averageLoginFrequency: Math.round(avgLoginFrequency * 10) / 10,
      sessionDuration: 0, // Would need session end tracking
      featureUsage,
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
      averageCsat: tickets.length > 0
        ? tickets.filter((t: any) => t.rating).reduce((sum: number, t: any) => sum + (t.rating || 0), 0) / (tickets.filter((t: any) => t.rating).length || 1)
        : 0,
      responseTime: avgResolutionTime > 0 ? Math.round(avgResolutionTime * 10) / 10 : 0,
      escalationRate: tickets.length > 0
        ? tickets.filter((t: any) => t.priority === "urgent" || t.escalated).length / tickets.length
        : 0,
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

  // Calculate churn from inactive tenants
  const inactiveTenants = tenants.filter((t: any) => t.status === "inactive" || t.status === "churned");
  const churnRate = tenants.length > 0 ? inactiveTenants.length / tenants.length : 0;

  // Calculate support load from tickets
  const tenantTickets: any[] = await ctx.db
    .query("tickets")
    .filter((q: any) => q.gte(q.field("createdAt"), cutoffTime))
    .collect();
  const openTicketCount = tenantTickets.filter((t: any) => t.status === "open" || t.status === "in_progress").length;
  const supportLoad = tenants.length > 0 ? Math.min(openTicketCount / (tenants.length * 5), 1) : 0;

  return {
    totalTenants: tenants.length,
    activeTenants: activeTenants.length,
    newTenants: newTenants.length,
    planDistribution,
    growthMetrics: {
      newTenantsGrowth: calculateGrowthRate(tenants, cutoffTime),
      churnRate: Math.round(churnRate * 100) / 100,
      retentionRate: Math.round((1 - churnRate) * 100) / 100,
    },
    performanceMetrics: {
      avgTenantHealth: tenants.length > 0 ? Math.round((activeTenants.length / tenants.length) * 100) / 100 : 0,
      resourceUtilization: tenants.length > 0 ? Math.round((activeTenants.length / Math.max(tenants.length, 1)) * 100) / 100 : 0,
      supportLoad: Math.round(supportLoad * 100) / 100,
    },
  };
}

// System analytics aggregation - derives metrics from real data
async function getSystemAnalytics(ctx: any, cutoffTime: number) {
  // Get real security metrics
  const failedLogins: any[] = await ctx.db
    .query("loginAttempts")
    .filter((q: any) =>
      q.and(
        q.eq(q.field("success"), false),
        q.gte(q.field("timestamp"), cutoffTime)
      )
    )
    .collect();

  const blockedIPs: any[] = await ctx.db
    .query("blockedIPs")
    .filter((q: any) => q.eq(q.field("isActive"), true))
    .collect();

  const securityIncidents: any[] = await ctx.db
    .query("securityIncidents")
    .filter((q: any) => q.gte(q.field("detectedAt"), cutoffTime))
    .collect();

  const criticalIncidents = securityIncidents.filter((i: any) => i.severity === "critical").length;
  const threatLevel = criticalIncidents > 5 ? "critical" : criticalIncidents > 2 ? "high" : criticalIncidents > 0 ? "medium" : "low";

  // Derive system health from real operational data
  const allIncidents: any[] = await ctx.db
    .query("incidents")
    .filter((q: any) => q.gte(q.field("createdAt"), cutoffTime))
    .collect();
  const resolvedIncidents = allIncidents.filter((i: any) => i.status === "resolved").length;
  const incidentResolutionRate = allIncidents.length > 0 ? resolvedIncidents / allIncidents.length : 1;

  // Error rate from failed workflow executions
  const executions: any[] = await ctx.db
    .query("workflowExecutions")
    .filter((q: any) => q.gte(q.field("startedAt"), cutoffTime))
    .collect();
  const failedExecs = executions.filter((e: any) => e.status === "failed").length;
  const errorRate = executions.length > 0 ? failedExecs / executions.length : 0;

  const healthScore = Math.round(((incidentResolutionRate + (1 - errorRate)) / 2) * 100) / 100;

  return {
    healthScore,
    performance: {
      responseTime: 0, // Would need APM integration
      throughput: executions.length,
      errorRate: Math.round(errorRate * 1000) / 1000,
      uptime: Math.round((1 - errorRate) * 1000) / 1000,
    },
    resources: {
      cpuUsage: 0, // Would need infrastructure monitoring
      memoryUsage: 0,
      diskUsage: 0,
      networkBandwidth: 0,
    },
    database: {
      queryPerformance: 0, // Would need DB monitoring
      connectionPool: 0,
      indexEfficiency: 0,
      cacheHitRate: 0,
    },
    security: {
      failedLogins: failedLogins.length,
      blockedIPs: blockedIPs.length,
      securityEvents: securityIncidents.length,
      threatLevel,
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
  const executions: any[] = await ctx.db
    .query("workflowExecutions")
    .filter((q: any) =>
      q.and(
        q.eq(q.field("tenantId"), tenantId),
        q.gte(q.field("startedAt"), cutoffTime)
      )
    )
    .collect();

  // Get workflow definitions to map execution to category
  const workflows: any[] = await ctx.db
    .query("workflows")
    .filter((q: any) => q.eq(q.field("tenantId"), tenantId))
    .collect();

  const workflowMap = new Map(workflows.map((w: any) => [w._id.toString(), w]));

  const categories: Record<string, { total: number; completed: number; totalTime: number }> = {};

  executions.forEach((exec: any) => {
    const workflow = workflowMap.get(exec.workflowId?.toString());
    const category = workflow?.category || "uncategorized";
    if (!categories[category]) {
      categories[category] = { total: 0, completed: 0, totalTime: 0 };
    }
    categories[category].total++;
    if (exec.status === "completed") {
      categories[category].completed++;
      categories[category].totalTime += (exec.duration || 0);
    }
  });

  const result: Record<string, { executions: number; successRate: number; avgTime: number }> = {};
  for (const [cat, data] of Object.entries(categories)) {
    result[cat] = {
      executions: data.total,
      successRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) / 100 : 0,
      avgTime: data.completed > 0 ? Math.round((data.totalTime / data.completed) * 10) / 10 : 0,
    };
  }

  return result;
}

async function getTopPerformingWorkflows(ctx: any, tenantId: string, cutoffTime: number) {
  const executions: any[] = await ctx.db
    .query("workflowExecutions")
    .filter((q: any) =>
      q.and(
        q.eq(q.field("tenantId"), tenantId),
        q.gte(q.field("startedAt"), cutoffTime)
      )
    )
    .collect();

  const workflows: any[] = await ctx.db
    .query("workflows")
    .filter((q: any) => q.eq(q.field("tenantId"), tenantId))
    .collect();

  const workflowMap = new Map(workflows.map((w: any) => [w._id.toString(), w]));

  // Group executions by workflow
  const byWorkflow: Record<string, { total: number; completed: number; totalDuration: number }> = {};
  executions.forEach((exec: any) => {
    const wfId = exec.workflowId?.toString() || "unknown";
    if (!byWorkflow[wfId]) {
      byWorkflow[wfId] = { total: 0, completed: 0, totalDuration: 0 };
    }
    byWorkflow[wfId].total++;
    if (exec.status === "completed") {
      byWorkflow[wfId].completed++;
      byWorkflow[wfId].totalDuration += (exec.duration || 0);
    }
  });

  // Calculate performance and sort
  const performers = Object.entries(byWorkflow).map(([wfId, data]) => {
    const workflow = workflowMap.get(wfId);
    const successRate = data.total > 0 ? data.completed / data.total : 0;
    const avgDuration = data.completed > 0 ? data.totalDuration / data.completed : 0;
    const efficiency = successRate * (1 - Math.min(avgDuration / 10, 1)); // Penalize slow workflows
    return {
      workflowId: wfId,
      workflowName: workflow?.name || "Unknown Workflow",
      executions: data.total,
      successRate: Math.round(successRate * 1000) / 1000,
      avgDuration: Math.round(avgDuration * 10) / 10,
      efficiency: Math.round(efficiency * 100) / 100,
    };
  });

  return performers.sort((a, b) => b.efficiency - a.efficiency).slice(0, 10);
}

async function calculateTrends(ctx: any, tenantId: string, timeRange: string) {
  const points = timeRange === "24h" ? 24 : timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
  const now = Date.now();
  const totalMs = getTimeRangeMs(timeRange);
  const intervalMs = totalMs / points;

  // Fetch data for the entire time range
  const cutoffTime = now - totalMs;

  const [sessions, tickets, executions] = await Promise.all([
    ctx.db.query("sessions")
      .filter((q: any) =>
        q.and(
          q.eq(q.field("tenantId"), tenantId),
          q.gte(q.field("createdAt"), cutoffTime)
        )
      ).collect(),
    ctx.db.query("tickets")
      .filter((q: any) =>
        q.and(
          q.eq(q.field("tenantId"), tenantId),
          q.gte(q.field("createdAt"), cutoffTime)
        )
      ).collect(),
    ctx.db.query("workflowExecutions")
      .filter((q: any) =>
        q.and(
          q.eq(q.field("tenantId"), tenantId),
          q.gte(q.field("startedAt"), cutoffTime)
        )
      ).collect(),
  ]);

  const trends = [];
  for (let i = points - 1; i >= 0; i--) {
    const bucketEnd = now - (i * intervalMs);
    const bucketStart = bucketEnd - intervalMs;

    const bucketSessions = sessions.filter((s: any) => s.createdAt >= bucketStart && s.createdAt < bucketEnd);
    const uniqueUsers = new Set(bucketSessions.map((s: any) => s.userId)).size;
    const bucketTickets = tickets.filter((t: any) => t.createdAt >= bucketStart && t.createdAt < bucketEnd);
    const bucketExecs = executions.filter((e: any) => e.startedAt >= bucketStart && e.startedAt < bucketEnd);
    const failedExecs = bucketExecs.filter((e: any) => e.status === "failed").length;

    trends.push({
      timestamp: bucketEnd,
      date: new Date(bucketEnd).toISOString(),
      users: uniqueUsers,
      tickets: bucketTickets.length,
      workflows: bucketExecs.length,
      systemHealth: bucketExecs.length > 0 ? Math.round((1 - failedExecs / bucketExecs.length) * 100) / 100 : 1,
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
        data[metric] = { value: 0, trend: "stable", note: "Custom metric not yet configured" };
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
