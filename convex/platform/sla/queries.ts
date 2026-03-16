import { query } from "../../_generated/server";
import { v } from "convex/values";

export const listSLAConfigurations = query({
  args: {
    sessionToken: v.string(),
    tenantId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    if (!session || session.expiresAt < Date.now()) throw new Error("Invalid session");

    const configs = await ctx.db.query("slaConfigurations").collect();
    return args.tenantId ? configs.filter((c) => c.tenantId === args.tenantId) : configs;
  },
});

export const getSLAMetrics = query({
  args: {
    sessionToken: v.string(),
    timeRange: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    if (!session || session.expiresAt < Date.now()) throw new Error("Invalid session");

    const cutoff = Date.now() - (args.timeRange === "7d" ? 604800000 : args.timeRange === "90d" ? 7776000000 : 2592000000);

    const breaches = await ctx.db.query("slaBreaches").collect();
    const recentBreaches = breaches.filter((b) => b.breachedAt >= cutoff);
    const configs = await ctx.db.query("slaConfigurations").collect();
    const activeConfigs = configs.filter((c) => c.isActive);

    const tickets = await ctx.db
      .query("tickets")
      .filter((q) => q.gte(q.field("createdAt"), cutoff))
      .collect();

    const totalTickets = tickets.length || 1;
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
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    if (!session || session.expiresAt < Date.now()) throw new Error("Invalid session");

    const breaches = await ctx.db
      .query("slaBreaches")
      .order("desc")
      .collect();

    return breaches.slice(0, args.limit || 50);
  },
});
