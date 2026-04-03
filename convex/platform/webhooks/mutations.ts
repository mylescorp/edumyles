"use node";

import { createHmac } from "node:crypto";
import { internalAction, internalMutation, mutation } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { v } from "convex/values";
import { Id } from "../../_generated/dataModel";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";

function buildSignature(secret: string, payload: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export const createEndpoint = mutation({
  args: {
    sessionToken: v.string(),
    url: v.string(),
    events: v.array(v.string()),
    description: v.optional(v.string()),
    secret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId, email } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const secret = args.secret || `whsec_${Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join("")}`;
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

    await logAction(ctx, {
      tenantId,
      actorId: userId,
      actorEmail: email,
      action: "webhook.created",
      entityType: "webhook_endpoint",
      entityId: String(endpointId),
      after: { url: args.url, events: args.events, description: args.description },
    });

    return { success: true, endpointId, secret, message: "Webhook endpoint created" };
  },
});

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
    const { tenantId, userId, email } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

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

    await logAction(ctx, {
      tenantId,
      actorId: userId,
      actorEmail: email,
      action: "webhook.updated",
      entityType: "webhook_endpoint",
      entityId: String(args.endpointId),
      before: { url: endpoint.url, events: endpoint.events, isActive: endpoint.isActive },
      after: updates,
    });

    return { success: true, message: "Webhook endpoint updated" };
  },
});

export const deleteEndpoint = mutation({
  args: {
    sessionToken: v.string(),
    endpointId: v.id("webhookEndpoints"),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId, email } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const endpoint = await ctx.db.get(args.endpointId);
    if (!endpoint || endpoint.tenantId !== tenantId) {
      throw new Error("Webhook endpoint not found");
    }

    await ctx.db.delete(args.endpointId);

    await logAction(ctx, {
      tenantId,
      actorId: userId,
      actorEmail: email,
      action: "webhook.deleted",
      entityType: "webhook_endpoint",
      entityId: String(args.endpointId),
      before: { url: endpoint.url, events: endpoint.events, isActive: endpoint.isActive },
    });

    return { success: true, message: "Webhook endpoint deleted" };
  },
});

export const testEndpoint = mutation({
  args: {
    sessionToken: v.string(),
    endpointId: v.id("webhookEndpoints"),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId, email } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const endpoint = await ctx.db.get(args.endpointId);
    if (!endpoint || endpoint.tenantId !== tenantId) {
      throw new Error("Webhook endpoint not found");
    }

    const payload = JSON.stringify({
      event: "test.ping",
      timestamp: Date.now(),
      data: {
        message: "This is a test webhook delivery from EduMyles",
        endpointId: args.endpointId,
      },
    });

    const deliveryId = await ctx.db.insert("webhookDeliveries", {
      tenantId,
      endpointId: args.endpointId,
      event: "test.ping",
      payload,
      statusCode: 0,
      response: "",
      status: "pending",
      attemptCount: 1,
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.platform.webhooks.mutations.deliverWebhookInternal, {
      deliveryId,
      actorId: userId,
      actorEmail: email,
    });

    return { success: true, deliveryId, message: "Test webhook queued" };
  },
});

export const retryDelivery = mutation({
  args: {
    sessionToken: v.string(),
    deliveryId: v.id("webhookDeliveries"),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId, email } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const delivery = await ctx.db.get(args.deliveryId);
    if (!delivery || delivery.tenantId !== tenantId) {
      throw new Error("Delivery not found");
    }

    if (delivery.status !== "failed") {
      throw new Error("Only failed deliveries can be retried");
    }

    await ctx.db.patch(args.deliveryId, {
      status: "pending",
      response: "",
      statusCode: 0,
      attemptCount: delivery.attemptCount + 1,
      completedAt: undefined,
    });

    await ctx.scheduler.runAfter(0, internal.platform.webhooks.mutations.deliverWebhookInternal, {
      deliveryId: args.deliveryId,
      actorId: userId,
      actorEmail: email,
    });

    return { success: true, message: "Delivery retry queued" };
  },
});

export const deliverWebhookInternal = internalAction({
  args: {
    deliveryId: v.id("webhookDeliveries"),
    actorId: v.string(),
    actorEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const delivery = await ctx.runQuery(internal.platform.webhooks.queries.getDeliveryInternal, {
      deliveryId: args.deliveryId,
    });

    if (!delivery) {
      return;
    }

    const endpoint = await ctx.runQuery(internal.platform.webhooks.queries.getEndpointInternal, {
      endpointId: delivery.endpointId,
    });

    if (!endpoint || !endpoint.isActive) {
      await ctx.runMutation(internal.platform.webhooks.mutations.finalizeDeliveryInternal, {
        deliveryId: args.deliveryId,
        endpointId: delivery.endpointId,
        status: "failed",
        statusCode: 410,
        response: "Endpoint inactive or deleted",
        actorId: args.actorId,
        actorEmail: args.actorEmail,
      });
      return;
    }

    try {
      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-EduMyles-Event": delivery.event,
          "X-EduMyles-Signature": buildSignature(endpoint.secret, delivery.payload),
          "X-EduMyles-Delivery": String(delivery._id),
        },
        body: delivery.payload,
      });

      const responseText = await response.text();
      await ctx.runMutation(internal.platform.webhooks.mutations.finalizeDeliveryInternal, {
        deliveryId: args.deliveryId,
        endpointId: delivery.endpointId,
        status: response.ok ? "success" : "failed",
        statusCode: response.status,
        response: responseText.slice(0, 2000),
        actorId: args.actorId,
        actorEmail: args.actorEmail,
      });
    } catch (error) {
      await ctx.runMutation(internal.platform.webhooks.mutations.finalizeDeliveryInternal, {
        deliveryId: args.deliveryId,
        endpointId: delivery.endpointId,
        status: "failed",
        statusCode: 0,
        response: error instanceof Error ? error.message : "Webhook delivery failed",
        actorId: args.actorId,
        actorEmail: args.actorEmail,
      });
    }
  },
});

export const finalizeDeliveryInternal = internalMutation({
  args: {
    deliveryId: v.id("webhookDeliveries"),
    endpointId: v.id("webhookEndpoints"),
    status: v.union(v.literal("success"), v.literal("failed")),
    statusCode: v.number(),
    response: v.string(),
    actorId: v.string(),
    actorEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const delivery = await ctx.db.get(args.deliveryId);
    const endpoint = await ctx.db.get(args.endpointId);
    if (!delivery || !endpoint) return;

    const completedAt = Date.now();
    await ctx.db.patch(args.deliveryId, {
      status: args.status,
      statusCode: args.statusCode,
      response: args.response,
      completedAt,
    });

    await ctx.db.patch(args.endpointId, {
      lastTriggeredAt: completedAt,
      failureCount: args.status === "failed" ? (endpoint.failureCount ?? 0) + 1 : 0,
      updatedAt: completedAt,
    });

    await ctx.runMutation(internal.helpers.auditLog.internalLogAction, {
      tenantId: endpoint.tenantId,
      actorId: args.actorId,
      actorEmail: args.actorEmail,
      action: `webhook.delivery_${args.status}`,
      entityType: "webhook_delivery",
      entityId: String(args.deliveryId),
      after: {
        endpointId: args.endpointId,
        statusCode: args.statusCode,
        status: args.status,
      },
    });
  },
});
