import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

export const getDashboardKPIs = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const now = Date.now();
    const currentMonth = new Date(now).getMonth();
    const currentYear = new Date(now).getFullYear();

    // Get tenant data
    const tenants = await ctx.db.query("tenants").collect();
    const activeTenants = tenants.filter(t => t.status === "active");
    const trialTenants = tenants.filter(t => t.status === "trial");
    
    // Calculate MRR and ARR (using KES as specified)
    const PLAN_PRICES_KES = {
      starter: 250000, // KES 2,500 per month in cents
      growth: 650000, // KES 6,500 per month in cents  
      pro: 1500000,   // KES 15,000 per month in cents
      enterprise: 0,  // Custom pricing
    };

    const mrr = activeTenants.reduce((sum, tenant) => {
      const planPrice = PLAN_PRICES_KES[tenant.plan as keyof typeof PLAN_PRICES_KES] || 0;
      return sum + planPrice;
    }, 0);

    const arr = mrr * 12;

    // Get ticket data
    const tickets = await ctx.db.query("tickets").collect();
    const openTickets = tickets.filter(t => t.status !== "closed");

    // Get pipeline value (CRM deals - placeholder for now)
    const pipelineValue = 0; // Will implement when CRM module is built

    // Get system health (placeholder - will implement with System Health module)
    const systemHealth = 98.5; // Placeholder percentage

    // Get new tenants this month
    const newThisMonth = tenants.filter(tenant => {
      const createdDate = new Date(tenant.createdAt);
      return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
    }).length;

    return {
      activeTenants: activeTenants.length,
      mrr: mrr / 100, // Convert from cents to KES
      arr: arr / 100,   // Convert from cents to KES
      openTickets: openTickets.length,
      pipelineValue,
      systemHealth,
      trialsActive: trialTenants.length,
      newThisMonth,
    };
  },
});

export const getDashboardCharts = query({
  args: { 
    sessionToken: v.string(),
    timeRange: v.optional(v.union(v.literal("7d"), v.literal("30d"), v.literal("90d"), v.literal("12m")))
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const timeRange = args.timeRange || "12m";
    const now = Date.now();
    
    // Calculate date range
    let startDate: number;
    if (timeRange === "7d") {
      startDate = now - (7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === "30d") {
      startDate = now - (30 * 24 * 60 * 60 * 1000);
    } else if (timeRange === "90d") {
      startDate = now - (90 * 24 * 60 * 60 * 1000);
    } else {
      startDate = now - (12 * 30 * 24 * 60 * 60 * 1000); // 12 months
    }

    // Get MRR trend data
    const tenants = await ctx.db.query("tenants").collect();
    const PLAN_PRICES_KES = {
      starter: 250000,
      growth: 650000,
      pro: 1500000,
      enterprise: 0,
    };

    // Generate monthly MRR data for the last 12 months
    const mrrTrend = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now);
      monthDate.setMonth(monthDate.getMonth() - i);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).getTime();
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getTime();
      
      const activeTenantsInMonth = tenants.filter(t => 
        t.status === "active" && t.createdAt <= monthEnd
      );
      
      const monthMRR = activeTenantsInMonth.reduce((sum, tenant) => {
        const planPrice = PLAN_PRICES_KES[tenant.plan as keyof typeof PLAN_PRICES_KES] || 0;
        return sum + planPrice;
      }, 0);

      mrrTrend.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        mrr: monthMRR / 100, // Convert to KES
        newTenants: tenants.filter(t => 
          t.createdAt >= monthStart && t.createdAt <= monthEnd
        ).length,
      });
    }

    // Get tenant growth data
    const tenantGrowth = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now);
      monthDate.setMonth(monthDate.getMonth() - i);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).getTime();
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getTime();
      
      const newTenants = tenants.filter(t => 
        t.createdAt >= monthStart && t.createdAt <= monthEnd
      );
      
      // Count by plan tier
      const planCounts = {
        starter: newTenants.filter(t => t.plan === "starter").length,
        growth: newTenants.filter(t => t.plan === "growth").length,
        pro: newTenants.filter(t => t.plan === "pro").length,
        enterprise: newTenants.filter(t => t.plan === "enterprise").length,
      };

      tenantGrowth.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
        ...planCounts,
        total: newTenants.length,
      });
    }

    // Get ticket volume data (weekly for last 8 weeks)
    const tickets = await ctx.db.query("tickets").collect();
    const ticketVolume = [];
    
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart.getTime() + (7 * 24 * 60 * 60 * 1000));
      
      const createdTickets = tickets.filter(t => 
        t.createdAt >= weekStart.getTime() && t.createdAt < weekEnd.getTime()
      );
      const resolvedTickets = tickets.filter(t => 
        t.resolvedAt && t.resolvedAt >= weekStart.getTime() && t.resolvedAt < weekEnd.getTime()
      );

      ticketVolume.push({
        week: `Week ${8 - i}`,
        created: createdTickets.length,
        resolved: resolvedTickets.length,
      });
    }

    // Get revenue by plan
    const activeTenants = tenants.filter(t => t.status === "active");
    const revenueByPlan = Object.entries(PLAN_PRICES_KES).map(([plan, price]) => {
      const tenantsInPlan = activeTenants.filter((t: any) => t.plan === plan);
      const totalMRR = tenantsInPlan.length * price;
      
      return {
        plan: plan.charAt(0).toUpperCase() + plan.slice(1),
        mrr: totalMRR / 100, // Convert to KES
        tenants: tenantsInPlan.length,
      };
    }).filter(item => item.mrr > 0);

    return {
      mrrTrend,
      tenantGrowth,
      ticketVolume,
      revenueByPlan,
    };
  },
});

export const getActivityFeed = query({
  args: { 
    sessionToken: v.string(),
    limit: v.optional(v.number()),
    eventType: v.optional(v.union(
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
    ))
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const limit = args.limit ?? 50;

    // Get recent audit logs across all tenants
    const logs = await ctx.db.query("auditLogs").order("desc").take(limit);

    // Enrich with tenant names and categorize events
    const enriched = await Promise.all(
      logs.map(async (log) => {
        const tenant = await ctx.db
          .query("tenants")
          .withIndex("by_tenantId", (q) => q.eq("tenantId", log.tenantId))
          .first();

        // Enhanced event categorization with metadata
        let eventType: string = "system";
        let icon = "Clock";
        let metadata: Record<string, any> = {};

        // School-related events
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
          if (log.action.includes("started")) {
            eventType = "school";
            icon = "Building";
          } else if (log.action.includes("expired")) {
            eventType = "exit";
            icon = "LogOut";
          }
          metadata = { plan: log.after?.plan || "trial" };
        }

        // Payment-related events
        else if (log.action.includes("payment") || log.action.includes("invoice")) {
          eventType = "payment";
          icon = "DollarSign";
          metadata = { 
            amount: log.after?.amount || 0,
            method: log.after?.method || "unknown",
            status: log.action.includes("failed") ? "failed" : "success"
          };
        } else if (log.action.includes("billing") || log.action.includes("subscription")) {
          eventType = "billing";
          icon = "CreditCard";
          metadata = { 
            plan: log.after?.plan || "unknown",
            amount: log.after?.amount || 0
          };
        }

        // Ticket-related events
        else if (log.entityType === "ticket") {
          eventType = "ticket";
          icon = "MessageSquare";
          metadata = { 
            ticketId: log.entityId,
            priority: log.after?.priority || "normal",
            category: log.after?.category || "general"
          };
          if (log.action.includes("resolved") || log.action.includes("closed")) {
            eventType = "done";
            icon = "CheckCircle";
          }
        }

        // User-related events
        else if (log.action.includes("user") || log.entityType === "user") {
          eventType = "user";
          icon = "Users";
          metadata = { 
            role: log.after?.role || "unknown",
            email: log.after?.email || ""
          };
          if (log.action.includes("suspended")) {
            eventType = "alert";
            icon = "AlertTriangle";
          }
        }

        // Module-related events
        else if (log.action.includes("module") || log.entityType === "module") {
          eventType = "done";
          icon = "CheckCircle";
          metadata = { 
            module: log.after?.module || "unknown",
            action: log.action.includes("installed") ? "installed" : "updated"
          };
        }

        // Security events
        else if (log.action.includes("impersonation")) {
          eventType = "security";
          icon = "Shield";
          metadata = { 
            adminUser: log.after?.adminUser || "unknown",
            targetUser: log.after?.targetUser || "unknown"
          };
        } else if (log.action.includes("login") && log.action.includes("failed")) {
          eventType = "alert";
          icon = "AlertTriangle";
          metadata = { 
            attempts: log.after?.attempts || 1,
            ip: log.after?.ip || "unknown"
          };
        } else if (log.action.includes("unauthorized") || log.action.includes("forbidden")) {
          eventType = "red";
          icon = "X";
          metadata = { 
            resource: log.after?.resource || "unknown",
            ip: log.after?.ip || "unknown"
          };
        }

        // Document-related events
        else if (log.action.includes("document") || log.action.includes("report") || log.action.includes("export")) {
          eventType = "document";
          icon = "FileText";
          metadata = { 
            documentType: log.after?.type || "unknown",
            format: log.after?.format || "pdf"
          };
        }

        // System events
        else if (log.action.includes("system") || log.action.includes("backup") || log.action.includes("maintenance")) {
          eventType = "system";
          icon = "Settings";
          metadata = { 
            component: log.after?.component || "unknown",
            status: log.action.includes("failed") ? "failed" : "success"
          };
        }

        // Scheduled events
        else if (log.action.includes("scheduled") || log.action.includes("cron") || log.action.includes("reminder")) {
          eventType = "scheduled";
          icon = "Calendar";
          metadata = { 
            schedule: log.after?.schedule || "unknown",
            nextRun: log.after?.nextRun || ""
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

    // Filter by event type if specified
    if (args.eventType) {
      return enriched.filter(event => event.eventType === args.eventType);
    }

    return enriched;
  },
});
