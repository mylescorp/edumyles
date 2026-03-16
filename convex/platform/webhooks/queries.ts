import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

/**
 * List all webhook endpoints for the tenant
 */
export const listEndpoints = query({
  args: {
    sessionToken: v.string(),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    if (args.activeOnly) {
      return await ctx.db
        .query("webhookEndpoints")
        .withIndex("by_tenant_active", (q) => q.eq("tenantId", tenantId).eq("isActive", true))
        .order("desc")
        .collect();
    }

    return await ctx.db
      .query("webhookEndpoints")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .order("desc")
      .collect();
  },
});

/**
 * Get a single webhook endpoint by ID
 */
export const getEndpointById = query({
  args: {
    sessionToken: v.string(),
    endpointId: v.id("webhookEndpoints"),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const endpoint = await ctx.db.get(args.endpointId);
    if (!endpoint || endpoint.tenantId !== tenantId) {
      throw new Error("Webhook endpoint not found");
    }

    // Get recent deliveries
    const recentDeliveries = await ctx.db
      .query("webhookDeliveries")
      .withIndex("by_endpoint", (q) => q.eq("endpointId", args.endpointId))
      .order("desc")
      .take(20);

    return { ...endpoint, recentDeliveries };
  },
});

/**
 * List webhook deliveries with optional filtering
 */
export const listDeliveries = query({
  args: {
    sessionToken: v.string(),
    endpointId: v.optional(v.id("webhookEndpoints")),
    status: v.optional(v.union(v.literal("pending"), v.literal("success"), v.literal("failed"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    if (args.endpointId) {
      const endpoint = await ctx.db.get(args.endpointId);
      if (!endpoint || endpoint.tenantId !== tenantId) {
        throw new Error("Webhook endpoint not found");
      }

      let deliveryQuery = ctx.db
        .query("webhookDeliveries")
        .withIndex("by_endpoint", (q) => q.eq("endpointId", args.endpointId!));

      if (args.status) {
        const status = args.status;
        deliveryQuery = deliveryQuery.filter((q) => q.eq(q.field("status"), status));
      }

      return await deliveryQuery.order("desc").take(args.limit ?? 50);
    }

    if (args.status) {
      const status = args.status;
      return await ctx.db
        .query("webhookDeliveries")
        .withIndex("by_status", (q) => q.eq("tenantId", tenantId).eq("status", status))
        .order("desc")
        .take(args.limit ?? 50);
    }

    return await ctx.db
      .query("webhookDeliveries")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .order("desc")
      .take(args.limit ?? 50);
  },
});
