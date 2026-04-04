import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

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
