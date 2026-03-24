import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

export const getWhiteLabelConfig = query({
  args: {
    sessionToken: v.string(),
    tenantId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);

    const targetTenantId = args.tenantId || platform.tenantId;
    const config = await ctx.db
      .query("whiteLabelConfigs")
      .withIndex("by_tenant", (q) => q.eq("tenantId", targetTenantId))
      .first();

    return config || null;
  },
});

export const listWhiteLabelConfigs = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    return await ctx.db.query("whiteLabelConfigs").collect();
  },
});
