import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

/**
 * List all scheduled reports for a tenant.
 */
export const listScheduledReports = query({
  args: {
    sessionToken: v.string(),
    isActive: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    let reportsQuery;
    if (args.isActive !== undefined) {
      const isActive = args.isActive;
      reportsQuery = ctx.db
        .query("scheduledReports")
        .withIndex("by_active", (q) => q.eq("tenantId", tenantId).eq("isActive", isActive));
    } else {
      reportsQuery = ctx.db
        .query("scheduledReports")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId));
    }

    const reports = await reportsQuery.order("desc").take(args.limit ?? 100);

    // Enrich with latest run info
    const enriched = await Promise.all(
      reports.map(async (report) => {
        const latestRun = await ctx.db
          .query("scheduledReportRuns")
          .withIndex("by_report", (q) => q.eq("reportId", report._id))
          .order("desc")
          .first();

        return {
          ...report,
          latestRun: latestRun
            ? {
                status: latestRun.status,
                startedAt: latestRun.startedAt,
                completedAt: latestRun.completedAt,
                error: latestRun.error,
              }
            : null,
        };
      })
    );

    return enriched;
  },
});

/**
 * Get run history for a specific report.
 */
export const getReportRunHistory = query({
  args: {
    sessionToken: v.string(),
    reportId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const runs = await ctx.db
      .query("scheduledReportRuns")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .order("desc")
      .take(args.limit ?? 50);

    return runs;
  },
});
