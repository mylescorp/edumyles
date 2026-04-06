import { paginationOptsValidator } from "convex/server";
import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

async function enrichTenant(ctx: any, tenant: any) {
  const [users, installedModules] = await Promise.all([
    ctx.db
      .query("users")
      .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
      .collect(),
    ctx.db
      .query("installedModules")
      .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
      .collect(),
  ]);

  return {
    ...tenant,
    userCount: users.filter((user: any) => user.isActive).length,
    modules: installedModules
      .filter((module: any) => module.status === "active")
      .map((module: any) => module.moduleId),
  };
}

export const listAllTenants = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("suspended"),
      v.literal("trial"),
      v.literal("archived")
    )),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const tenants = await ctx.db.query("tenants").collect();

    if (args.status) {
      return tenants.filter((t) => t.status === args.status);
    }

    return tenants;
  },
});

export const listAllTenantsPaginated = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(
      v.union(v.literal("active"), v.literal("suspended"), v.literal("trial"), v.literal("archived"))
    ),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const paginated = args.status
      ? await ctx.db
          .query("tenants")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .paginate(args.paginationOpts)
      : await ctx.db.query("tenants").order("desc").paginate(args.paginationOpts);

    const page = await Promise.all(paginated.page.map((tenant) => enrichTenant(ctx, tenant)));

    return {
      ...paginated,
      page,
    };
  },
});

export const getTenantById = query({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    return await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .first();
  },
});

export const getTenantDependencySummary = query({
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

    if (!tenant) {
      throw new Error("NOT_FOUND: Tenant not found");
    }

    const [users, students, invoices, payments, modules, organizations] = await Promise.all([
      ctx.db.query("users").withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId)).collect(),
      ctx.db.query("students").withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId)).collect(),
      ctx.db.query("invoices").withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId)).collect(),
      ctx.db.query("payments").withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId)).collect(),
      ctx.db.query("installedModules").withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId)).collect(),
      ctx.db.query("organizations").withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId)).collect(),
    ]);

    const activeUsers = users.filter((user) => user.isActive).length;
    const openInvoices = invoices.filter((invoice) => invoice.status !== "paid" && invoice.status !== "cancelled").length;

    return {
      tenantId: args.tenantId,
      tenantStatus: tenant.status,
      users: users.length,
      activeUsers,
      students: students.length,
      invoices: invoices.length,
      openInvoices,
      payments: payments.length,
      modules: modules.length,
      organizations: organizations.length,
      canArchive: tenant.status === "suspended",
      canDelete:
        tenant.status === "archived" &&
        users.length === 0 &&
        students.length === 0 &&
        invoices.length === 0 &&
        payments.length === 0,
    };
  },
});

export const getPlatformStats = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    // Helper to safely query tables that may not exist yet
    async function safeCollect<T>(fn: () => Promise<T[]>): Promise<T[]> {
      try { return await fn(); } catch { return []; }
    }

    const tenants = await safeCollect(() => ctx.db.query("tenants").collect());
    const activeTenants = tenants.filter((t: any) => t.status === "active");
    const suspendedTenants = tenants.filter((t: any) => t.status === "suspended");
    const trialTenants = tenants.filter((t: any) => t.status === "trial");

    const users = await safeCollect(() => ctx.db.query("users").collect());
    const activeUsers = users.filter((u: any) => u.isActive);
    const students = await safeCollect(() => ctx.db.query("students").collect());

    // Count tenants per plan tier
    const planCounts: Record<string, number> = {};
    for (const t of tenants) {
      planCounts[(t as any).plan] = (planCounts[(t as any).plan] || 0) + 1;
    }

    return {
      totalTenants: tenants.length,
      activeTenants: activeTenants.length,
      suspendedTenants: suspendedTenants.length,
      trialTenants: trialTenants.length,
      totalUsers: users.length,
      activeUsers: activeUsers.length,
      totalStudents: students.length,
      planCounts,
    };
  },
});

export const getRecentActivity = query({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const limit = args.limit ?? 20;

    // Get recent audit logs across all tenants (safely handle missing table)
    let logs: any[];
    try {
      logs = await ctx.db.query("auditLogs").order("desc").take(limit);
    } catch {
      return [];
    }

    // Enrich with tenant names
    const enriched = await Promise.all(
      logs.map(async (log: any) => {
        let tenantName = "Unknown";
        try {
          const tenant = await ctx.db
            .query("tenants")
            .withIndex("by_tenantId", (q) => q.eq("tenantId", log.tenantId))
            .first();
          tenantName = tenant?.name ?? "Unknown";
        } catch {
          // Table or index may not exist
        }
        return { ...log, tenantName };
      })
    );

    return enriched;
  },
});

export const getTenantUsers = query({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    return await ctx.db
      .query("users")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
  },
});

export const getTenantModules = query({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    return await ctx.db
      .query("installedModules")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
  },
});

export const getTenantDetailBundle = query({
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

    if (!tenant) {
      return null;
    }

    const [
      organization,
      subscription,
      usageStats,
      users,
      installedModules,
      moduleConfigs,
      pilotGrants,
      subscriptionInvoices,
      invoices,
      payments,
      supportTickets,
      auditLogs,
      platformAnnouncements,
      featureFlags,
      maintenanceWindows,
    ] = await Promise.all([
      ctx.db.query("organizations").withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId)).first(),
      ctx.db
        .query("tenant_subscriptions")
        .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
        .first(),
      ctx.db
        .query("tenant_usage_stats")
        .withIndex("by_tenant_recordedAt", (q) => q.eq("tenantId", args.tenantId))
        .collect(),
      ctx.db.query("users").withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId)).collect(),
      ctx.db.query("installedModules").withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId)).collect(),
      ctx.db.query("module_configs").withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId)).collect(),
      ctx.db.query("pilot_grants").withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId)).collect(),
      ctx.db
        .query("subscription_invoices")
        .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
        .collect(),
      ctx.db.query("invoices").withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId)).collect(),
      ctx.db.query("payments").withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId)).collect(),
      ctx.db.query("support_tickets").withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId)).collect(),
      ctx.db.query("auditLogs").withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId)).collect(),
      ctx.db.query("platform_announcements").collect(),
      ctx.db.query("feature_flags").collect(),
      ctx.db.query("maintenance_windows").collect(),
    ]);

    const plan = subscription
      ? await ctx.db
          .query("subscription_plans")
          .withIndex("by_name", (q) => q.eq("name", subscription.planId as any))
          .first()
      : null;

    const moduleRegistryEntries = await ctx.db.query("moduleRegistry").collect();
    const marketplaceEntries = await ctx.db.query("modules").collect();

    const moduleRegistryById = new Map(
      moduleRegistryEntries.map((entry: any) => [entry.moduleId, entry])
    );
    const marketplaceBySlug = new Map(
      marketplaceEntries.map((entry: any) => [entry.slug, entry])
    );
    const configByModuleId = new Map(
      moduleConfigs.map((entry: any) => [entry.moduleId, entry])
    );

    const latestUsage =
      usageStats.sort((a: any, b: any) => b.recordedAt - a.recordedAt)[0] ?? null;

    const moduleRows = installedModules
      .slice()
      .sort((a: any, b: any) => b.updatedAt - a.updatedAt)
      .map((module: any) => {
        const registry = moduleRegistryById.get(module.moduleId);
        const marketplace = marketplaceBySlug.get(module.moduleId);
        const config = configByModuleId.get(module.moduleId);
        const relatedGrant = pilotGrants.find((grant: any) => grant.moduleId === module.moduleId);

        return {
          moduleId: module.moduleId,
          name: registry?.name ?? marketplace?.name ?? module.moduleId,
          category: registry?.category ?? marketplace?.category ?? "general",
          status: module.status,
          installedAt: module.installedAt,
          updatedAt: module.updatedAt,
          configUpdatedAt: config?.updatedAt,
          rolePermissions: config?.rolePermissions ?? {},
          featureFlags: config?.featureFlags ?? {},
          pilotGrantStatus: relatedGrant?.status ?? null,
          pricingModel: marketplace?.pricingModel ?? null,
          minimumPlan: marketplace?.minimumPlan ?? registry?.tier ?? null,
        };
      });

    const activeUsers = users.filter((user: any) => user.isActive);
    const pendingUsers = users.filter((user: any) => user.workosUserId?.startsWith("pending-"));
    const openTickets = supportTickets.filter((ticket: any) =>
      ["open", "in_progress"].includes(ticket.status)
    );
    const activeFlags = featureFlags.filter(
      (flag: any) =>
        flag.enabledGlobally || (flag.enabledTenantIds ?? []).includes(args.tenantId)
    );
    const tenantMaintenance = maintenanceWindows.filter((window: any) => {
      const affects = window.affectsTenants ?? [];
      return affects.length === 0 || affects.includes(args.tenantId);
    });
    const relevantAnnouncements = platformAnnouncements
      .filter((announcement: any) => {
        const matchesPlan =
          (announcement.targetPlans ?? []).length === 0 ||
          (announcement.targetPlans ?? []).includes(tenant.plan);
        const matchesCountry =
          (announcement.targetCountries ?? []).length === 0 ||
          (announcement.targetCountries ?? []).includes(tenant.country);
        return matchesPlan && matchesCountry;
      })
      .sort((a: any, b: any) => b.createdAt - a.createdAt)
      .slice(0, 5);

    const recentAuditLogs = auditLogs
      .slice()
      .sort((a: any, b: any) => b.timestamp - a.timestamp)
      .slice(0, 12);

    const recentSubscriptionInvoices = subscriptionInvoices
      .slice()
      .sort((a: any, b: any) => b.createdAt - a.createdAt)
      .slice(0, 10);

    const recentInvoices = invoices
      .slice()
      .sort((a: any, b: any) => b.createdAt - a.createdAt)
      .slice(0, 10);

    const recentPayments = payments
      .slice()
      .sort((a: any, b: any) => b.createdAt - a.createdAt)
      .slice(0, 10);

    return {
      tenant,
      organization,
      subscription: subscription
        ? {
            ...subscription,
            plan,
          }
        : null,
      usage: latestUsage,
      overview: {
        userCount: users.length,
        activeUserCount: activeUsers.length,
        pendingInviteCount: pendingUsers.length,
        moduleCount: moduleRows.length,
        activeModuleCount: moduleRows.filter((module: any) => module.status === "active").length,
        pilotGrantCount: pilotGrants.length,
        openTicketCount: openTickets.length,
        auditEventCount: auditLogs.length,
      },
      users: activeUsers
        .slice()
        .sort((a: any, b: any) => b.createdAt - a.createdAt),
      pendingInvites: pendingUsers
        .slice()
        .sort((a: any, b: any) => b.createdAt - a.createdAt),
      modules: moduleRows,
      pilotGrants: pilotGrants
        .slice()
        .sort((a: any, b: any) => b.createdAt - a.createdAt),
      finance: {
        subscriptionInvoices: recentSubscriptionInvoices,
        invoices: recentInvoices,
        payments: recentPayments,
        totals: {
          totalInvoiceAmountKes: subscriptionInvoices.reduce(
            (sum: number, invoice: any) => sum + invoice.totalAmountKes,
            0
          ),
          totalCollectedKes: recentPayments
            .filter((payment: any) => ["completed", "success"].includes(payment.status))
            .reduce((sum: number, payment: any) => sum + payment.amount, 0),
          outstandingInvoiceCount: recentInvoices.filter((invoice: any) =>
            !["paid", "cancelled"].includes(invoice.status)
          ).length,
        },
      },
      communications: {
        supportTickets: supportTickets
          .slice()
          .sort((a: any, b: any) => b.updatedAt - a.updatedAt)
          .slice(0, 10),
        announcements: relevantAnnouncements,
      },
      auditLogs: recentAuditLogs,
      settings: {
        featureFlags: activeFlags.sort((a: any, b: any) => b.updatedAt - a.updatedAt),
        maintenanceWindows: tenantMaintenance
          .slice()
          .sort((a: any, b: any) => b.startAt - a.startAt)
          .slice(0, 10),
      },
    };
  },
});
