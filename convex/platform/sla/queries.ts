import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

export const listSLAConfigurations = query({
  args: {
    sessionToken: v.string(),
    tenantId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const configs = await ctx.db.query("slaConfigurations").collect();
    const targetTenantId = args.tenantId ?? platform.tenantId;
    return configs.filter((c) => c.tenantId === targetTenantId);
  },
});

export const getSLAMetrics = query({
  args: {
    sessionToken: v.string(),
    timeRange: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const cutoff = Date.now() - (args.timeRange === "7d" ? 604800000 : args.timeRange === "90d" ? 7776000000 : 2592000000);

    const breaches = await ctx.db.query("slaBreaches").collect();
    const recentBreaches = breaches.filter(
      (b) => b.tenantId === platform.tenantId && b.breachedAt >= cutoff
    );
    const configs = await ctx.db.query("slaConfigurations").collect();
    const activeConfigs = configs.filter((c) => c.isActive);

    const tickets = await ctx.db
      .query("tickets")
      .filter((q) => q.gte(q.field("createdAt"), cutoff))
      .collect();
    const tenantTickets = tickets.filter((ticket) => ticket.tenantId === platform.tenantId);

    const totalTickets = tenantTickets.length || 1;
    const complianceRate = Math.round(((totalTickets - recentBreaches.length) / totalTickets) * 100) / 100;

    return {
      totalConfigurations: activeConfigs.length,
      complianceRate,
      totalBreaches: recentBreaches.length,
      responseBreaches: recentBreaches.filter((b) => b.breachType === "response").length,
      resolutionBreaches: recentBreaches.filter((b) => b.breachType === "resolution").length,
      avgResponseTime: 0,
      avgResolutionTime: 0,
    };
  },
});

export const listBreaches = query({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const breaches = await ctx.db
      .query("slaBreaches")
      .order("desc")
      .collect();

    return breaches
      .filter((breach) => breach.tenantId === platform.tenantId)
      .slice(0, args.limit || 50);
  },
});
