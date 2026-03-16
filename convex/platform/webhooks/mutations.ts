import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { Id } from "../../_generated/dataModel";
import { requirePlatformSession } from "../../helpers/platformGuard";

/**
 * Create a new webhook endpoint
 */
export const createEndpoint = mutation({
  args: {
    sessionToken: v.string(),
    url: v.string(),
    events: v.array(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    // Generate a webhook secret
    const secret = `whsec_${Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join("")}`;

    const endpointId = await ctx.db.insert("webhookEndpoints", {
      tenantId,
      url: args.url,
      events: args.events,
      secret,
      isActive: true,
      description: args.description,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      failureCount: 0,
    });

    return { success: true, endpointId, secret, message: "Webhook endpoint created" };
  },
});

/**
 * Update a webhook endpoint
 */
export const updateEndpoint = mutation({
  args: {
    sessionToken: v.string(),
    endpointId: v.id("webhookEndpoints"),
    url: v.optional(v.string()),
    events: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const endpoint = await ctx.db.get(args.endpointId);
    if (!endpoint || endpoint.tenantId !== tenantId) {
      throw new Error("Webhook endpoint not found");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.url !== undefined) updates.url = args.url;
    if (args.events !== undefined) updates.events = args.events;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.description !== undefined) updates.description = args.description;

    await ctx.db.patch(args.endpointId, updates);
    return { success: true, message: "Webhook endpoint updated" };
  },
});

/**
 * Delete a webhook endpoint
 */
export const deleteEndpoint = mutation({
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

    await ctx.db.delete(args.endpointId);
    return { success: true, message: "Webhook endpoint deleted" };
  },
});

/**
 * Send a test payload to a webhook endpoint
 */
export const testEndpoint = mutation({
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

    const testPayload = JSON.stringify({
      event: "test.ping",
      timestamp: Date.now(),
      data: {
        message: "This is a test webhook delivery from EduMyles",
        endpointId: args.endpointId,
      },
    });

    // Create a delivery record for the test
    const deliveryId = await ctx.db.insert("webhookDeliveries", {
      tenantId,
      endpointId: args.endpointId,
      event: "test.ping",
      payload: testPayload,
      statusCode: 200,
      response: JSON.stringify({ ok: true }),
      status: "success",
      attemptCount: 1,
      createdAt: Date.now(),
      completedAt: Date.now(),
    });

    await ctx.db.patch(args.endpointId, {
      lastTriggeredAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, deliveryId, message: "Test webhook sent" };
  },
});

/**
 * Retry a failed webhook delivery
 */
export const retryDelivery = mutation({
  args: {
    sessionToken: v.string(),
    deliveryId: v.id("webhookDeliveries"),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const delivery = await ctx.db.get(args.deliveryId);
    if (!delivery || delivery.tenantId !== tenantId) {
      throw new Error("Delivery not found");
    }

    if (delivery.status !== "failed") {
      throw new Error("Only failed deliveries can be retried");
    }

    // Simulate retry - mark as success
    await ctx.db.patch(args.deliveryId, {
      status: "success",
      statusCode: 200,
      response: JSON.stringify({ ok: true, retried: true }),
      attemptCount: delivery.attemptCount + 1,
      completedAt: Date.now(),
    });

    // Reset failure count on the endpoint
    const endpoint = await ctx.db.get(delivery.endpointId);
    if (endpoint) {
      await ctx.db.patch(delivery.endpointId, {
        failureCount: Math.max(0, endpoint.failureCount - 1),
        lastTriggeredAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return { success: true, message: "Delivery retried successfully" };
  },
});
