import { query } from "../../_generated/server";
import { v } from "convex/values";

export const listApiKeys = query({
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

    let q = ctx.db.query("apiKeys");
    const keys = await q.collect();

    const filtered = args.tenantId
      ? keys.filter((k) => k.tenantId === args.tenantId)
      : keys;

    return filtered.map((k) => ({
      ...k,
      key: k.keyPrefix + "************************",
    }));
  },
});

export const getKeyUsageStats = query({
  args: {
    sessionToken: v.string(),
    keyId: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    if (!session || session.expiresAt < Date.now()) throw new Error("Invalid session");

    const usage = await ctx.db
      .query("apiKeyUsage")
      .withIndex("by_key", (q) => q.eq("keyId", args.keyId))
      .collect();

    const last24h = usage.filter((u) => u.timestamp >= Date.now() - 86400000);
    const last7d = usage.filter((u) => u.timestamp >= Date.now() - 604800000);

    return {
      totalRequests: usage.length,
      last24h: last24h.length,
      last7d: last7d.length,
      avgResponseTime:
        usage.length > 0
          ? Math.round(usage.reduce((sum, u) => sum + (u.responseTime || 0), 0) / usage.length)
          : 0,
      errorRate:
        usage.length > 0
          ? Math.round((usage.filter((u) => (u.statusCode || 0) >= 400).length / usage.length) * 100) / 100
          : 0,
    };
  },
});
