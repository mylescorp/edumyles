import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requirePlatformSession } from "../../helpers/platformGuard";

const DAY_MS = 24 * 60 * 60 * 1000;

type SupportedRange = "7d" | "30d" | "90d" | "12m";

function getRangeStart(now: number, timeRange: SupportedRange) {
  switch (timeRange) {
    case "7d":
      return now - 7 * DAY_MS;
    case "30d":
      return now - 30 * DAY_MS;
    case "90d":
      return now - 90 * DAY_MS;
    case "12m":
    default:
      return new Date(new Date(now).getFullYear(), new Date(now).getMonth() - 11, 1).getTime();
  }
}

function buildBuckets(now: number, timeRange: SupportedRange) {
  if (timeRange === "12m") {
    return Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now);
      date.setDate(1);
      date.setMonth(date.getMonth() - (11 - index));

      const start = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 1).getTime();

      return {
        start,
        end,
        label: date.toLocaleDateString("en-US", { month: "short" }),
      };
    });
  }

  const bucketSize = timeRange === "90d" ? 7 * DAY_MS : DAY_MS;
  const bucketCount = timeRange === "90d" ? 13 : timeRange === "30d" ? 30 : 7;
  const start = getRangeStart(now, timeRange);

  return Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = start + index * bucketSize;
    const bucketEnd = bucketStart + bucketSize;
    const date = new Date(bucketStart);

    return {
      start: bucketStart,
      end: bucketEnd,
      label:
        timeRange === "90d"
          ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
  });
}

function isOpenTicket(status: string) {
  return status === "open" || status === "in_progress";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getMonthlyPlanPriceKes(subscription: any, planByName: Map<string, any>) {
  if (typeof subscription.customPriceMonthlyKes === "number") {
    return subscription.customPriceMonthlyKes;
  }

  if (typeof subscription.customPriceAnnualKes === "number") {
    return Math.round(subscription.customPriceAnnualKes / 12);
  }

  const plan = planByName.get(subscription.planId);
  if (!plan) {
    return 0;
  }

  if (typeof plan.priceMonthlyKes === "number") {
    return plan.priceMonthlyKes;
  }

  if (typeof plan.priceAnnualKes === "number") {
    return Math.round(plan.priceAnnualKes / 12);
  }

  return 0;
}

function sum<T>(items: T[], selector: (item: T) => number) {
  return items.reduce((total, item) => total + selector(item), 0);
}

export const getDashboardOverview = query({
  args: {
    sessionToken: v.string(),
    timeRange: v.optional(v.union(v.literal("7d"), v.literal("30d"), v.literal("90d"), v.literal("12m"))),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const timeRange = args.timeRange ?? "30d";
    const now = Date.now();
    const rangeStart = getRangeStart(now, timeRange);

    const [
      tenants,
      subscriptions,
      plans,
      invoices,
      waitlistEntries,
      supportTickets,
      modules,
      moduleInstalls,
      moduleRequests,
      publishers,
      pilotGrants,
      deals,
      incidents,
      securityIncidents,
      maintenanceWindows,
      auditLogs,
    ] = await Promise.all([
      ctx.db.query("tenants").collect(),
      ctx.db.query("tenant_subscriptions").collect(),
      ctx.db.query("subscription_plans").collect(),
      ctx.db.query("subscription_invoices").collect(),
      ctx.db.query("waitlist").collect(),
      ctx.db.query("support_tickets").collect(),
      ctx.db.query("modules").collect(),
      ctx.db.query("module_installs").collect(),
      ctx.db.query("module_requests").collect(),
      ctx.db.query("publishers").collect(),
      ctx.db.query("pilot_grants").collect(),
      ctx.db.query("crm_deals").collect(),
      ctx.db.query("incidents").collect(),
      ctx.db.query("securityIncidents").collect(),
      ctx.db.query("maintenance_windows").collect(),
      ctx.db
        .query("auditLogs")
        .filter((q) => q.gte(q.field("timestamp"), now - DAY_MS))
        .collect(),
    ]);

    const planByName = new Map(plans.map((plan) => [plan.name, plan]));

    const activeSubscriptions = subscriptions.filter(
      (subscription) => subscription.status === "active" || subscription.status === "past_due"
    );
    const trialSubscriptions = subscriptions.filter((subscription) => subscription.status === "trialing");
    const activeOrTrialSubscriptions = subscriptions.filter(
      (subscription) => subscription.status === "active" || subscription.status === "past_due" || subscription.status === "trialing"
    );

    const mrrKes = sum(activeSubscriptions, (subscription) =>
      getMonthlyPlanPriceKes(subscription, planByName)
    );
    const arrKes = mrrKes * 12;

    const paidInvoices = invoices.filter((invoice) => invoice.status === "paid");
    const paidInvoicesInRange = paidInvoices.filter(
      (invoice) => typeof invoice.paidAt === "number" && invoice.paidAt >= rangeStart
    );
    const outstandingInvoices = invoices.filter(
      (invoice) => invoice.status === "sent" && invoice.dueDate < now
    );

    const openTickets = supportTickets.filter((ticket) => isOpenTicket(ticket.status));
    const criticalTickets = openTickets.filter(
      (ticket) => ticket.priority === "critical" || ticket.priority === "high"
    );
    const slaBreachedTickets = openTickets.filter(
      (ticket) => typeof ticket.slaDueAt === "number" && ticket.slaDueAt < now
    );

    const activeIncidents = incidents.filter(
      (incident) => incident.status === "active" || incident.status === "investigating"
    );
    const openSecurityIncidents = securityIncidents.filter(
      (incident) => incident.status === "open" || incident.status === "investigating" || incident.status === "contained"
    );
    const activeMaintenance = maintenanceWindows.filter(
      (window) => window.status === "in_progress" || (window.status === "scheduled" && window.startAt <= now && window.endAt >= now)
    );
    const upcomingMaintenance = maintenanceWindows.filter(
      (window) => window.status === "scheduled" && window.startAt > now
    );

    const failedAuditActions = auditLogs.filter((log) =>
      ["fail", "error", "denied"].some((keyword) => log.action.toLowerCase().includes(keyword))
    ).length;

    const healthScore = clamp(
      100 -
        activeIncidents.length * 14 -
        openSecurityIncidents.length * 10 -
        activeMaintenance.length * 6 -
        criticalTickets.length * 4 -
        Math.min(20, failedAuditActions),
      38,
      100
    );

    const healthStatus =
      healthScore >= 90
        ? "healthy"
        : healthScore >= 75
          ? "watch"
          : "degraded";

    const activeTenants = tenants.filter((tenant) => tenant.status === "active");
    const trialTenants = tenants.filter((tenant) => tenant.status === "trial");
    const suspendedTenants = tenants.filter((tenant) => tenant.status === "suspended");

    const planDistributionMap = new Map<string, number>();
    for (const subscription of activeOrTrialSubscriptions) {
      planDistributionMap.set(
        subscription.planId,
        (planDistributionMap.get(subscription.planId) ?? 0) + 1
      );
    }
    const planDistribution = Array.from(planDistributionMap.entries())
      .map(([planId, count]) => ({
        planId,
        count,
      }))
      .sort((left, right) => right.count - left.count);

    const buckets = buildBuckets(now, timeRange);
    const revenueTrend = buckets.map((bucket) => {
      const paidInBucket = paidInvoices.filter(
        (invoice) =>
          typeof invoice.paidAt === "number" &&
          invoice.paidAt >= bucket.start &&
          invoice.paidAt < bucket.end
      );
      const subscriptionsInBucket = subscriptions.filter(
        (subscription) => subscription.createdAt >= bucket.start && subscription.createdAt < bucket.end
      );
      const recurringRevenueKes = sum(
        subscriptionsInBucket.filter(
          (subscription) =>
            subscription.status === "active" ||
            subscription.status === "past_due" ||
            subscription.status === "trialing"
        ),
        (subscription) => getMonthlyPlanPriceKes(subscription, planByName)
      );

      return {
        label: bucket.label,
        invoicesKes: sum(paidInBucket, (invoice) => invoice.totalAmountKes),
        recurringKes: recurringRevenueKes,
      };
    });

    const tenantGrowth = buckets.map((bucket) => ({
      label: bucket.label,
      newTenants: tenants.filter(
        (tenant) => tenant.createdAt >= bucket.start && tenant.createdAt < bucket.end
      ).length,
      waitlistConversions: waitlistEntries.filter(
        (entry) =>
          typeof entry.convertedAt === "number" &&
          entry.convertedAt >= bucket.start &&
          entry.convertedAt < bucket.end
      ).length,
    }));

    const marketplaceStatusMap = new Map<string, number>();
    for (const module of modules) {
      marketplaceStatusMap.set(
        module.status,
        (marketplaceStatusMap.get(module.status) ?? 0) + 1
      );
    }

    const activePilotGrants = pilotGrants.filter(
      (grant) =>
        grant.status === "active" &&
        grant.startDate <= now &&
        (grant.endDate === undefined || grant.endDate >= now)
    );

    const openPipelineDeals = deals.filter((deal) => deal.status === "open");

    return {
      period: {
        timeRange,
        startAt: rangeStart,
        endAt: now,
      },
      stats: {
        activeTenants: activeTenants.length,
        totalTenants: tenants.length,
        trialTenants: trialTenants.length || trialSubscriptions.length,
        waitlistEntries: waitlistEntries.filter((entry) => entry.status === "waiting").length,
        mrrKes,
        arrKes,
        openTickets: openTickets.length,
        activeInstalls: moduleInstalls.filter((install) => install.status === "active").length,
      },
      health: {
        score: healthScore,
        status: healthStatus,
        activeIncidents: activeIncidents.length,
        openSecurityIncidents: openSecurityIncidents.length,
        activeMaintenance: activeMaintenance.length,
        scheduledMaintenance: upcomingMaintenance.length,
        criticalTickets: criticalTickets.length,
        slaBreaches: slaBreachedTickets.length,
        failedActions24h: failedAuditActions,
      },
      revenue: {
        mrrKes,
        arrKes,
        collectedKes: sum(paidInvoicesInRange, (invoice) => invoice.totalAmountKes),
        overdueKes: sum(outstandingInvoices, (invoice) => invoice.totalAmountKes),
        pipelineKes: sum(openPipelineDeals, (deal) => deal.valueKes),
        paidInvoices: paidInvoicesInRange.length,
        overdueInvoices: outstandingInvoices.length,
      },
      tenants: {
        total: tenants.length,
        active: activeTenants.length,
        trialing: trialTenants.length || trialSubscriptions.length,
        suspended: suspendedTenants.length,
        newInRange: tenants.filter((tenant) => tenant.createdAt >= rangeStart).length,
        waitlistWaiting: waitlistEntries.filter((entry) => entry.status === "waiting").length,
        planDistribution,
        growth: tenantGrowth,
      },
      marketplace: {
        publishedModules: modules.filter((module) => module.status === "published").length,
        pendingReview: modules.filter((module) => module.status === "pending_review").length,
        activePublishers: publishers.filter((publisher) => publisher.status === "approved").length,
        featuredModules: modules.filter((module) => module.isFeatured).length,
        activeInstalls: moduleInstalls.filter((install) => install.status === "active").length,
        activePilotGrants: activePilotGrants.length,
        pendingRequests: moduleRequests.filter(
          (request) => request.status === "submitted" || request.status === "under_review"
        ).length,
        statusBreakdown: Array.from(marketplaceStatusMap.entries())
          .map(([status, count]) => ({ status, count }))
          .sort((left, right) => right.count - left.count),
      },
      charts: {
        revenueTrend,
        tenantGrowth,
        planDistribution,
      },
    };
  },
});

export const getActivityFeed = query({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
    eventType: v.optional(
      v.union(
        v.literal("school"),
        v.literal("payment"),
        v.literal("ticket"),
        v.literal("done"),
        v.literal("alert"),
        v.literal("red"),
        v.literal("up"),
        v.literal("exit"),
        v.literal("user"),
        v.literal("billing"),
        v.literal("document"),
        v.literal("system"),
        v.literal("security"),
        v.literal("scheduled")
      )
    ),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const limit = args.limit ?? 50;
    const logs = await ctx.db.query("auditLogs").order("desc").take(limit);

    const enriched = await Promise.all(
      logs.map(async (log) => {
        const tenant = await ctx.db
          .query("tenants")
          .withIndex("by_tenantId", (q) => q.eq("tenantId", log.tenantId))
          .first();

        let eventType: string = "system";
        let icon = "Clock";
        let metadata: Record<string, unknown> = {};

        if (log.action.includes("created") && log.entityType === "tenant") {
          eventType = "school";
          icon = "Building";
          metadata = { plan: log.after?.plan || "unknown" };
        } else if (log.action.includes("suspended") && log.entityType === "tenant") {
          eventType = "red";
          icon = "X";
          metadata = { reason: log.after?.reason || "Policy violation" };
        } else if (log.action.includes("activated") && log.entityType === "tenant") {
          eventType = "up";
          icon = "TrendingUp";
          metadata = { plan: log.after?.plan || "unknown" };
        } else if (log.action.includes("trial") && log.entityType === "tenant") {
          eventType = log.action.includes("expired") ? "exit" : "school";
          icon = log.action.includes("expired") ? "LogOut" : "Building";
          metadata = { plan: log.after?.plan || "trial" };
        } else if (log.action.includes("payment") || log.action.includes("invoice")) {
          eventType = "payment";
          icon = "DollarSign";
          metadata = {
            amount: log.after?.amount || 0,
            method: log.after?.method || "unknown",
            status: log.action.includes("failed") ? "failed" : "success",
          };
        } else if (log.action.includes("billing") || log.action.includes("subscription")) {
          eventType = "billing";
          icon = "CreditCard";
          metadata = {
            plan: log.after?.plan || "unknown",
            amount: log.after?.amount || 0,
          };
        } else if (log.entityType === "ticket") {
          eventType = log.action.includes("resolved") || log.action.includes("closed") ? "done" : "ticket";
          icon = log.action.includes("resolved") || log.action.includes("closed") ? "CheckCircle" : "MessageSquare";
          metadata = {
            ticketId: log.entityId,
            priority: log.after?.priority || "normal",
            category: log.after?.category || "general",
          };
        } else if (log.action.includes("user") || log.entityType === "user") {
          eventType = log.action.includes("suspended") ? "alert" : "user";
          icon = log.action.includes("suspended") ? "AlertTriangle" : "Users";
          metadata = {
            role: log.after?.role || "unknown",
            email: log.after?.email || "",
          };
        } else if (log.action.includes("module") || log.entityType === "module") {
          eventType = "done";
          icon = "CheckCircle";
          metadata = {
            module: log.after?.module || "unknown",
            action: log.action.includes("installed") ? "installed" : "updated",
          };
        } else if (log.action.includes("impersonation")) {
          eventType = "security";
          icon = "Shield";
          metadata = {
            adminUser: log.after?.adminUser || "unknown",
            targetUser: log.after?.targetUser || "unknown",
          };
        } else if (log.action.includes("login") && log.action.includes("failed")) {
          eventType = "alert";
          icon = "AlertTriangle";
          metadata = {
            attempts: log.after?.attempts || 1,
            ip: log.after?.ip || "unknown",
          };
        } else if (log.action.includes("unauthorized") || log.action.includes("forbidden")) {
          eventType = "red";
          icon = "X";
          metadata = {
            resource: log.after?.resource || "unknown",
            ip: log.after?.ip || "unknown",
          };
        } else if (
          log.action.includes("document") ||
          log.action.includes("report") ||
          log.action.includes("export")
        ) {
          eventType = "document";
          icon = "FileText";
          metadata = {
            documentType: log.after?.type || "unknown",
            format: log.after?.format || "pdf",
          };
        } else if (
          log.action.includes("system") ||
          log.action.includes("backup") ||
          log.action.includes("maintenance")
        ) {
          eventType = "system";
          icon = "Settings";
          metadata = {
            component: log.after?.component || "unknown",
            status: log.action.includes("failed") ? "failed" : "success",
          };
        } else if (
          log.action.includes("scheduled") ||
          log.action.includes("cron") ||
          log.action.includes("reminder")
        ) {
          eventType = "scheduled";
          icon = "Calendar";
          metadata = {
            schedule: log.after?.schedule || "unknown",
            nextRun: log.after?.nextRun || "",
          };
        }

        return {
          ...log,
          tenantName: tenant?.name || "Unknown School",
          eventType,
          icon,
          metadata,
        };
      })
    );

    if (args.eventType) {
      return enriched.filter((event) => event.eventType === args.eventType);
    }

    return enriched;
  },
});
