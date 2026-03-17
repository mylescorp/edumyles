import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

/**
 * List recent data exports for the current tenant
 */
export const listExports = query({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const exports = await ctx.db
      .query("dataExports")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .order("desc")
      .take(args.limit ?? 50);

    return exports;
  },
});

/**
 * Get the status of a specific export
 */
export const getExportStatus = query({
  args: {
    sessionToken: v.string(),
    exportId: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const exp = await ctx.db.get(args.exportId as Id<"dataExports">);
    if (!exp) throw new Error("Export not found");

    return {
      _id: exp._id,
      status: exp.status,
      exportType: exp.exportType,
      format: exp.format,
      rowCount: exp.rowCount,
      completedAt: exp.completedAt,
      errorMessage: exp.errorMessage,
      fileUrl: exp.fileUrl,
      dataContent: exp.dataContent,
    };
  },
});
