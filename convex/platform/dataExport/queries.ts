import { query, Id } from "../../_generated/server";
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
      status: (exp as any).status,
      exportType: (exp as any).exportType,
      format: (exp as any).format,
      rowCount: (exp as any).rowCount,
      completedAt: (exp as any).completedAt,
      errorMessage: (exp as any).errorMessage,
      fileUrl: (exp as any).fileUrl,
      dataContent: (exp as any).dataContent,
    };
  },
});
