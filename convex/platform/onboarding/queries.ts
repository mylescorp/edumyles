import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

/**
 * Get the current onboarding progress for a specific tenant.
 */
export const getOnboardingProgress = query({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const progress = await ctx.db
      .query("onboardingProgress")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .first();

    if (!progress) return null;

    // Enrich with tenant info
    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .first();

    return {
      ...progress,
      tenantName: tenant?.name ?? "Unknown",
    };
  },
});

/**
 * List all tenants' onboarding statuses.
 */
export const listOnboardingStatuses = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(
      v.union(
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("abandoned")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    let progressQuery;
    if (args.status) {
      const status = args.status;
      progressQuery = ctx.db
        .query("onboardingProgress")
        .withIndex("by_status", (q) => q.eq("status", status));
    } else {
      progressQuery = ctx.db.query("onboardingProgress");
    }

    const records = await progressQuery.order("desc").take(args.limit ?? 100);

    // Enrich with tenant names
    const enriched = await Promise.all(
      records.map(async (record) => {
        const tenant = await ctx.db
          .query("tenants")
          .withIndex("by_tenantId", (q) => q.eq("tenantId", record.tenantId))
          .first();
        return {
          ...record,
          tenantName: tenant?.name ?? "Unknown",
          tenantStatus: tenant?.status ?? "unknown",
        };
      })
    );

    return enriched;
  },
});
