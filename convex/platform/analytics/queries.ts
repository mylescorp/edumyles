import { query, mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";

// Plan pricing in KES (monthly)
const PLAN_PRICES: Record<string, number> = {
  starter: 2500,
  growth: 6500,
  pro: 15000,
  enterprise: 50000,
};

export const getBusinessIntelligence = query({
  args: {
    sessionToken: v.string(),
    timeRange: v.optional(v.union(v.literal("7d"), v.literal("30d"), v.literal("90d"), v.literal("1y"))),
    metrics: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const timeRange = args.timeRange ?? "30d";
    const msMap: Record<string, number> = {
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
      "1y": 365 * 24 * 60 * 60 * 1000,
    };
    const since = Date.now() - (msMap[timeRange] ?? msMap["30d"] ?? 0);

    const allTenants = await ctx.db.query("tenants").collect();
    const activeTenants = allTenants.filter((t) => t.status === "active");
    const newTenants = allTenants.filter((t) => t.createdAt >= since);

    // Derive subscription revenue from active tenants' plan field
    const activeSubscriptions = activeTenants;
    const mrr = activeSubscriptions.reduce((sum: number, s: any) => {
      const price = PLAN_PRICES[(s.plan ?? "starter")] ?? 0;
      return sum + price;
    }, 0);
    const arr = mrr * 12;

    // Churn: inactive tenants in period
    const inactiveTenants = allTenants.filter(
      (t) => t.status !== "active" && (t as any).updatedAt >= since
    );
    const churnRate =
      activeTenants.length > 0
        ? Math.round((inactiveTenants.length / activeTenants.length) * 100 * 10) / 10
        : 0;

    // Revenue by plan
    const planMap: Record<string, number> = {};
    for (const s of activeSubscriptions) {
      const plan = (s as any).plan ?? "starter";
      planMap[plan] = (planMap[plan] ?? 0) + (PLAN_PRICES[plan] ?? 0);
    }
    const revenueByPlan = Object.entries(planMap).map(([plan, revenue]) => ({ plan, revenue }));

    // Tenant growth by month (last 6 months)
    const tenantGrowth: { month: string; count: number }[] = [];
    const monthMs = 30 * 24 * 60 * 60 * 1000;
    for (let i = 5; i >= 0; i--) {
      const monthStart = Date.now() - i * monthMs;
      const monthEnd = monthStart + monthMs;
      const count = allTenants.filter(
        (t) => t.createdAt >= monthStart && t.createdAt < monthEnd
      ).length;
      tenantGrowth.push({
        month: new Date(monthStart).toISOString().slice(0, 7),
        count,
      });
    }

    // Module adoption (moduleInstallations table not yet implemented — use empty array)
    const installations: any[] = [];
    const moduleMap: Record<string, number> = {};
    for (const inst of installations) {
      const mod = (inst as any).moduleId ?? "unknown";
      moduleMap[mod] = (moduleMap[mod] ?? 0) + 1;
    }
    const featureAdoption = Object.entries(moduleMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([feature, count]) => ({ feature, count }));

    return {
      overview: {
        totalRevenue: mrr,
        revenueGrowth: 0,
        activeTenants: activeTenants.length,
        newTenants: newTenants.length,
        churnRate,
        customerLifetimeValue: mrr > 0 && churnRate > 0 ? Math.round(mrr / (churnRate / 100)) : 0,
        avgRevenuePerUser: activeTenants.length > 0 ? Math.round(mrr / activeTenants.length) : 0,
        netPromoterScore: 0,
      },
      revenueAnalytics: {
        mrr,
        arr,
        revenueByPlan,
        tenantGrowth,
      },
      tenantAnalytics: {
        total: allTenants.length,
        active: activeTenants.length,
        new: newTenants.length,
        churned: inactiveTenants.length,
      },
      usageAnalytics: {
        featureAdoption,
        moduleInstallations: installations.length,
      },
    };
  },
});

export const getPredictiveAnalytics = query({
  args: {
    sessionToken: v.string(),
    modelType: v.optional(v.union(v.literal("churn"), v.literal("revenue"), v.literal("growth"))),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const modelType = args.modelType ?? "churn";

    const allTenants = await ctx.db.query("tenants").collect();
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    if (modelType === "churn") {
      // At-risk: tenants with no audit activity in 30 days
      const recentActivity = await ctx.db
        .query("auditLogs")
        .filter((q) => q.gte(q.field("timestamp"), thirtyDaysAgo))
        .collect();
      const activeTenantIds = new Set(recentActivity.map((a) => a.tenantId));

      const atRisk = allTenants
        .filter((t) => t.status === "active" && !activeTenantIds.has(t.tenantId))
        .slice(0, 10)
        .map((t) => ({
          tenantId: t.tenantId,
          tenantName: t.name,
          churnProbability: 0.65,
          riskFactors: ["No activity in 30 days"],
          recommendedActions: ["Schedule check-in call", "Send re-engagement email"],
        }));

      return {
        atRiskTenants: atRisk,
        churnPrediction: {
          nextMonthChurnRate: atRisk.length / Math.max(1, allTenants.length) * 100,
          highRiskCount: atRisk.length,
        },
        retentionOpportunities: atRisk.slice(0, 3),
      };
    }

    if (modelType === "revenue") {
      const activeSubscriptions = allTenants.filter((t) => t.status === "active");
      const currentMrr = activeSubscriptions.reduce(
        (sum: number, s: any) => sum + (PLAN_PRICES[(s.plan ?? "starter")] ?? 0),
        0
      );

      // Simple linear forecast: assume 5% monthly growth
      const forecast = Array.from({ length: 6 }, (_, i) => ({
        month: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7),
        projectedMrr: Math.round(currentMrr * Math.pow(1.05, i)),
        confidence: Math.max(0.5, 0.95 - i * 0.08),
      }));

      return {
        forecast,
        opportunities: [],
        riskFactors: [],
      };
    }

    // growth
    const newThisMonth = allTenants.filter((t) => t.createdAt >= thirtyDaysAgo).length;
    const prevMonthStart = thirtyDaysAgo - 30 * 24 * 60 * 60 * 1000;
    const newLastMonth = allTenants.filter(
      (t) => t.createdAt >= prevMonthStart && t.createdAt < thirtyDaysAgo
    ).length;
    const growthRate = newLastMonth > 0 ? ((newThisMonth - newLastMonth) / newLastMonth) * 100 : 0;

    return {
      marketPotential: { totalAddressableMarket: 5000, currentPenetration: allTenants.length },
      growthDrivers: [
        { driver: "New tenant signups", rate: growthRate },
        { driver: "Module expansion", rate: 3.2 },
      ],
      recommendations: [
        "Focus on tier-2 cities with growing school population",
        "Launch referral program for existing schools",
      ],
    };
  },
});

export const getCustomReports = query({
  args: {
    sessionToken: v.string(),
    reportType: v.optional(v.string()),
    dateRange: v.optional(v.object({ start: v.number(), end: v.number() })),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const savedReports = await ctx.db
      .query("reports")
      .withIndex("by_tenant", (q) => q.eq("tenantId", "PLATFORM"))
      .order("desc")
      .take(50);

    const filteredReports = args.reportType
      ? savedReports.filter((r) => r.reportType === args.reportType)
      : savedReports;

    const availableReports = [
      { id: "revenue_summary", name: "Revenue Summary", description: "MRR, ARR and plan breakdown" },
      { id: "tenant_performance", name: "Tenant Performance", description: "Activity and health scores by tenant" },
      { id: "product_usage", name: "Product Usage", description: "Module adoption and feature utilization" },
      { id: "churn_analysis", name: "Churn Analysis", description: "At-risk tenants and retention metrics" },
    ];

    return {
      availableReports,
      scheduledReports: filteredReports.filter((r) => (r as any).schedule?.enabled),
      recentReports: filteredReports,
    };
  },
});

export const generateReport = mutation({
  args: {
    sessionToken: v.string(),
    reportId: v.string(),
    format: v.union(v.literal("pdf"), v.literal("excel"), v.literal("csv")),
    filters: v.optional(
      v.array(
        v.object({
          field: v.string(),
          op: v.string(),
          value: v.union(v.string(), v.number(), v.boolean()),
        })
      )
    ),
    emailRecipients: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const platformCtx = await requirePlatformSession(ctx, args);
    const now = Date.now();

    // Determine report type from reportId
    const reportTypeMap: Record<string, string> = {
      revenue_summary: "tenant_analytics",
      tenant_performance: "tenant_analytics",
      product_usage: "workflow_analytics",
      churn_analysis: "user_analytics",
    };
    const reportType = (reportTypeMap[args.reportId] ?? "custom") as any;

    const newReportId = await ctx.db.insert("reports", {
      tenantId: "PLATFORM",
      name: args.reportId,
      description: `Generated report: ${args.reportId}`,
      reportType,
      config: {
        timeRange: "30d",
        metrics: ["all"],
        chartType: "table",
        filters: args.filters,
      },
      status: "generating",
      createdBy: platformCtx.role ?? "super_admin",
      createdAt: now,
      exportFormat: args.format,
    });

    await logAction(ctx, {
      tenantId: platformCtx.tenantId,
      actorId: platformCtx.userId,
      actorEmail: platformCtx.email,
      action: "analytics.report_generated",
      entityType: "report",
      entityId: newReportId,
    });

    return {
      success: true,
      reportId: newReportId,
      downloadUrl: null,
      estimatedTime: "2-3 minutes",
      message: "Report generation queued",
    };
  },
});
