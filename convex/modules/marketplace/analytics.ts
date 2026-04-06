import { internalMutation, query } from "../../_generated/server";
import { ConvexError, v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { requirePublisherContext } from "../../helpers/publisherGuard";

async function getPublisherOwnedModule(ctx: any, moduleId: string, publisherId: string) {
  const module = await ctx.db
    .query("modules")
    .withIndex("by_publisherId", (q: any) => q.eq("publisherId", publisherId))
    .collect()
    .then((records: any[]) => records.find((record) => String(record._id) === moduleId) ?? null);

  if (!module) {
    throw new ConvexError({ code: "NOT_FOUND", message: "Module not found" });
  }

  return module;
}

async function recomputeModuleStats(ctx: any, moduleId: string) {
  const installs = await ctx.db
    .query("module_installs")
    .withIndex("by_moduleId", (q: any) => q.eq("moduleId", moduleId))
    .collect();

  const reviews = await ctx.db
    .query("module_reviews")
    .withIndex("by_moduleId", (q: any) => q.eq("moduleId", moduleId))
    .collect();

  const payments = await ctx.db
    .query("module_payments")
    .withIndex("by_moduleId", (q: any) => q.eq("moduleId", moduleId))
    .collect();

  const approvedReviews = reviews.filter((review: any) => review.status === "approved");
  const totalInstalls = installs.length;
  const activeInstalls = installs.filter((install: any) => install.status === "active").length;
  const churnedInstalls = installs.filter((install: any) => install.status === "uninstalled").length;
  const avgRating =
    approvedReviews.length > 0
      ? approvedReviews.reduce((sum: number, review: any) => sum + review.rating, 0) /
        approvedReviews.length
      : undefined;
  const totalRevenueKes = payments
    .filter((payment: any) => payment.status === "success")
    .reduce((sum: number, payment: any) => sum + payment.amountKes, 0);

  const now = Date.now();
  const existing = await ctx.db
    .query("module_install_stats")
    .withIndex("by_moduleId", (q: any) => q.eq("moduleId", moduleId))
    .first();

  if (existing) {
    await ctx.db.patch(existing._id, {
      totalInstalls,
      activeInstalls,
      churnedInstalls,
      avgRating,
      totalRevenueKes,
      updatedAt: now,
    });
  } else {
    await ctx.db.insert("module_install_stats", {
      moduleId,
      totalInstalls,
      activeInstalls,
      churnedInstalls,
      avgRating,
      totalRevenueKes,
      createdAt: now,
      updatedAt: now,
    });
  }

  return {
    totalInstalls,
    activeInstalls,
    churnedInstalls,
    avgRating,
    totalRevenueKes,
  };
}

export const getModuleAnalytics = query({
  args: {
    moduleId: v.string(),
  },
  handler: async (ctx, args) => {
    const publisher = await requirePublisherContext(ctx);
    const module = await getPublisherOwnedModule(ctx, args.moduleId, publisher.publisherId);
    const events = await ctx.db
      .query("module_analytics_events")
      .withIndex("by_moduleId", (q) => q.eq("moduleId", String(module._id)))
      .collect();
    const stats =
      (await ctx.db
        .query("module_install_stats")
        .withIndex("by_moduleId", (q) => q.eq("moduleId", String(module._id)))
        .first()) ?? null;

    const eventCounts = events.reduce((acc: Record<string, number>, event) => {
      acc[event.eventType] = (acc[event.eventType] ?? 0) + 1;
      return acc;
    }, {});

    return {
      module,
      stats,
      totals: {
        events: events.length,
        installs: eventCounts.install_requested ?? 0,
        activations: eventCounts.install_activated ?? 0,
        uninstalls: eventCounts.uninstalled ?? 0,
        reviews: eventCounts.review_submitted ?? 0,
      },
      eventCounts,
      recentEvents: events.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50),
    };
  },
});

export const getModuleInstallStats = query({
  args: {
    sessionToken: v.string(),
    moduleId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    if (args.moduleId) {
      return await ctx.db
        .query("module_install_stats")
        .withIndex("by_moduleId", (q) => q.eq("moduleId", args.moduleId!))
        .first();
    }

    return await ctx.db.query("module_install_stats").collect();
  },
});

export const recordAnalyticsEvent = internalMutation({
  args: {
    moduleId: v.string(),
    tenantId: v.string(),
    eventType: v.string(),
    metadata: v.optional(v.any()),
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = args.timestamp ?? Date.now();

    await ctx.db.insert("module_analytics_events", {
      moduleId: args.moduleId,
      tenantId: args.tenantId,
      eventType: args.eventType,
      metadata: args.metadata,
      timestamp: now,
      createdAt: now,
    });

    return { success: true };
  },
});

export const refreshModuleInstallStats = internalMutation({
  args: {
    moduleId: v.string(),
  },
  handler: async (ctx, args) => {
    const stats = await recomputeModuleStats(ctx, args.moduleId);
    return { success: true, stats };
  },
});
