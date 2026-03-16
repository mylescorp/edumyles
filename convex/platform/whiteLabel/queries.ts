import { query } from "../../_generated/server";
import { v } from "convex/values";

export const getWhiteLabelConfig = query({
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

    const targetTenantId = args.tenantId || session.tenantId;
    const configs = await ctx.db
      .query("whiteLabelConfigs")
      .collect();

    return configs.find((c) => c.tenantId === targetTenantId) || null;
  },
});

export const listWhiteLabelConfigs = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    if (!session || session.expiresAt < Date.now()) throw new Error("Invalid session");

    return await ctx.db.query("whiteLabelConfigs").collect();
  },
});
