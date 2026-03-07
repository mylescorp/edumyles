import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

export const listAllTenants = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("suspended"),
      v.literal("trial")
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

export const getPlatformStats = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const tenants = await ctx.db.query("tenants").collect();
    const activeTenants = tenants.filter((t) => t.status === "active");
    const suspendedTenants = tenants.filter((t) => t.status === "suspended");
    const trialTenants = tenants.filter((t) => t.status === "trial");

    const users = await ctx.db.query("users").collect();
    const activeUsers = users.filter((u) => u.isActive);
    const students = await ctx.db.query("students").collect();

    // Count tenants per plan tier
    const planCounts: Record<string, number> = {};
    for (const t of tenants) {
      planCounts[t.plan] = (planCounts[t.plan] || 0) + 1;
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

    // Get recent audit logs across all tenants
    const logs = await ctx.db.query("auditLogs").order("desc").take(limit);

    // Enrich with tenant names
    const enriched = await Promise.all(
      logs.map(async (log) => {
        const tenant = await ctx.db
          .query("tenants")
          .withIndex("by_tenantId", (q) => q.eq("tenantId", log.tenantId))
          .first();
        return {
          ...log,
          tenantName: tenant?.name ?? "Unknown",
        };
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
