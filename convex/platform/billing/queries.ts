import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

const PLAN_PRICES_CENTS: Record<string, number> = {
  starter: 2999,
  standard: 7999,
  pro: 19999,
  enterprise: 49999,
};

// List all tenant subscriptions
export const listSubscriptions = query({
  args: {
    sessionToken: v.string(),
    plan: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    let tenants = await ctx.db.query("tenants").collect();

    if (args.plan) {
      tenants = tenants.filter((t) => t.plan === args.plan);
    }

    if (args.status) {
      tenants = tenants.filter((t) => t.status === args.status);
    }

    return tenants.map((t) => ({
      _id: t._id,
      tenantId: t.tenantId,
      name: t.name,
      subdomain: t.subdomain,
      plan: t.plan,
      status: t.status,
      email: t.email,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
  },
});

// Get subscription details for a single tenant
export const getSubscriptionDetails = query({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .first();

    if (!tenant) throw new Error("NOT_FOUND: Tenant not found");

    const org = await ctx.db
      .query("organizations")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .first();

    const users = await ctx.db
      .query("users")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    const modules = await ctx.db
      .query("installedModules")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    return {
      tenant: {
        ...tenant,
      },
      organization: org ? { name: org.name, tier: org.tier, subdomain: org.subdomain } : null,
      userCount: users.length,
      moduleCount: modules.filter((m) => m.status === "active").length,
    };
  },
});

// Get billing overview - MRR, ARR, revenue, overdue invoices
export const getBillingOverview = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const tenants = await ctx.db.query("tenants").collect();
    const platformInvoices = await ctx.db.query("platformInvoices").collect();

    const activeTenants = tenants.filter((t) => t.status === "active" || t.status === "trial");

    // MRR from active tenants
    const mrr = activeTenants.reduce((sum, t) => sum + (PLAN_PRICES_CENTS[t.plan] ?? 0), 0);

    // Total revenue from paid invoices
    const totalRevenue = platformInvoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + inv.amountCents, 0);

    // Overdue invoices
    const now = Date.now();
    const overdueInvoices = platformInvoices.filter(
      (inv) => inv.status === "overdue" || (inv.status === "sent" && inv.dueDate < now)
    );

    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.amountCents, 0);

    // Revenue this month vs last month for growth
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);
    const lastMonthStart = new Date(thisMonthStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    const thisMonthRevenue = platformInvoices
      .filter(
        (inv) => inv.status === "paid" && inv.paidAt && inv.paidAt >= thisMonthStart.getTime()
      )
      .reduce((sum, inv) => sum + inv.amountCents, 0);

    const lastMonthRevenue = platformInvoices
      .filter(
        (inv) =>
          inv.status === "paid" &&
          inv.paidAt &&
          inv.paidAt >= lastMonthStart.getTime() &&
          inv.paidAt < thisMonthStart.getTime()
      )
      .reduce((sum, inv) => sum + inv.amountCents, 0);

    const revenueGrowth =
      lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

    // Credits available
    const credits = await ctx.db.query("billingCredits").collect();
    const availableCredits = credits
      .filter((c) => c.status === "available")
      .reduce((sum, c) => sum + c.amountCents, 0);

    return {
      mrr,
      arr: mrr * 12,
      totalRevenue,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      activeSubscriptions: activeTenants.length,
      totalTenants: tenants.length,
      overdueInvoiceCount: overdueInvoices.length,
      overdueAmount,
      availableCredits,
      thisMonthRevenue,
      lastMonthRevenue,
    };
  },
});

// List platform invoices with filters
export const listInvoices = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("sent"),
        v.literal("paid"),
        v.literal("overdue"),
        v.literal("void"),
        v.literal("refunded")
      )
    ),
    tenantId: v.optional(v.string()),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    let invoices = await ctx.db.query("platformInvoices").collect();

    if (args.status) {
      invoices = invoices.filter((inv) => inv.status === args.status);
    }

    if (args.tenantId) {
      invoices = invoices.filter((inv) => inv.tenantId === args.tenantId);
    }

    if (args.dateFrom) {
      invoices = invoices.filter((inv) => inv.createdAt >= args.dateFrom!);
    }

    if (args.dateTo) {
      invoices = invoices.filter((inv) => inv.createdAt <= args.dateTo!);
    }

    // Sort newest first
    invoices.sort((a, b) => b.createdAt - a.createdAt);

    return invoices;
  },
});

// Revenue breakdown by plan tier and by month
export const getRevenueBreakdown = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const tenants = await ctx.db.query("tenants").collect();
    const platformInvoices = await ctx.db.query("platformInvoices").collect();
    const paidInvoices = platformInvoices.filter((inv) => inv.status === "paid");

    // Revenue by plan tier (from active tenants - estimated MRR)
    const byPlan: Record<string, { count: number; mrrCents: number; revenueCents: number }> = {};
    for (const t of tenants) {
      if (!byPlan[t.plan]) {
        byPlan[t.plan] = { count: 0, mrrCents: 0, revenueCents: 0 };
      }
      const planEntry = byPlan[t.plan];
      if (!planEntry) continue;
      planEntry.count++;
      if (t.status === "active" || t.status === "trial") {
        planEntry.mrrCents += PLAN_PRICES_CENTS[t.plan] ?? 0;
      }
    }

    // Add actual revenue from invoices
    for (const inv of paidInvoices) {
      const planEntry = byPlan[inv.plan];
      if (planEntry) {
        planEntry.revenueCents += inv.amountCents;
      }
    }

    const revenueByPlan = Object.entries(byPlan).map(([plan, data]) => ({
      plan,
      tenantCount: data.count,
      mrrCents: data.mrrCents,
      revenueCents: data.revenueCents,
    }));

    // Revenue by month (last 12 months)
    const revenueByMonth: Array<{ month: string; revenueCents: number; invoiceCount: number }> = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = d.getTime();
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
      const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });

      const monthInvoices = paidInvoices.filter(
        (inv) => inv.paidAt && inv.paidAt >= monthStart && inv.paidAt < monthEnd
      );

      revenueByMonth.push({
        month: label,
        revenueCents: monthInvoices.reduce((sum, inv) => sum + inv.amountCents, 0),
        invoiceCount: monthInvoices.length,
      });
    }

    return { revenueByPlan, revenueByMonth };
  },
});

// Subscription metrics - active, trial, churned, etc.
export const getSubscriptionMetrics = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const tenants = await ctx.db.query("tenants").collect();

    const active = tenants.filter((t) => t.status === "active").length;
    const trial = tenants.filter((t) => t.status === "trial").length;
    const suspended = tenants.filter((t) => t.status === "suspended").length;
    const inactive = tenants.filter(
      (t) => t.status !== "active" && t.status !== "trial" && t.status !== "suspended"
    ).length;

    // Plan distribution
    const planDistribution: Record<string, number> = {};
    for (const t of tenants) {
      planDistribution[t.plan] = (planDistribution[t.plan] ?? 0) + 1;
    }

    // Recent signups (last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentSignups = tenants.filter((t) => t.createdAt >= thirtyDaysAgo).length;

    // Tenants created per month (last 6 months)
    const signupsByMonth: Array<{ month: string; count: number }> = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = d.getTime();
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
      const label = d.toLocaleDateString("en-US", { month: "short" });

      signupsByMonth.push({
        month: label,
        count: tenants.filter((t) => t.createdAt >= monthStart && t.createdAt < monthEnd).length,
      });
    }

    return {
      active,
      trial,
      suspended,
      inactive,
      total: tenants.length,
      planDistribution,
      recentSignups,
      signupsByMonth,
      churnRate: tenants.length > 0 ? Math.round((suspended / tenants.length) * 1000) / 10 : 0,
    };
  },
});
