import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { Id } from "../../_generated/dataModel";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";

/**
 * Create a new operations incident
 */
export const createIncident = mutation({
  args: {
    sessionToken: v.string(),
    title: v.string(),
    description: v.string(),
    severity: v.union(v.literal("critical"), v.literal("high"), v.literal("medium"), v.literal("low")),
    services: v.array(v.string()),
    impact: v.string(),
    tags: v.optional(v.array(v.string())),
    metrics: v.optional(v.object({
      affectedUsers: v.number(),
      affectedTenants: v.number(),
      businessImpact: v.string(),
      recoveryTime: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId, email } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const now = Date.now();

    const incidentId = await ctx.db.insert("incidents", {
      tenantId: "PLATFORM",
      title: args.title,
      description: args.description,
      severity: args.severity,
      status: "active",
      services: args.services,
      impact: args.impact,
      tags: args.tags ?? [],
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      startTime: now,
      acknowledged: false,
      notifications: [],
      metrics: args.metrics ?? {
        affectedUsers: 0,
        affectedTenants: 0,
        businessImpact: "unknown",
      },
    });

    await ctx.db.insert("incidentTimeline", {
      incidentId,
      type: "status_change",
      message: `Incident created with severity: ${args.severity}`,
      metadata: { severity: args.severity, services: args.services },
      internal: false,
      createdBy: userId,
      tenantId: "PLATFORM",
      createdAt: now,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: userId,
      actorEmail: email,
      action: "operations.incident_created",
      entityType: "incident",
      entityId: incidentId,
      after: { title: args.title, severity: args.severity, services: args.services },
    });

    return { success: true, incidentId, message: "Incident created successfully" };
  },
});

/**
 * Update the status of an incident
 */
export const updateIncidentStatus = mutation({
  args: {
    sessionToken: v.string(),
    incidentId: v.string(),
    status: v.union(v.literal("active"), v.literal("investigating"), v.literal("resolved"), v.literal("closed")),
    resolution: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const incident = await ctx.db.get(args.incidentId as Id<"incidents">);
    if (!incident) throw new Error("Incident not found");

    const now = Date.now();
    const isResolved = args.status === "resolved" || args.status === "closed";

    const updateData: Record<string, unknown> = {
      status: args.status,
      updatedAt: now,
    };

    if (isResolved) {
      updateData.endTime = now;
      updateData.resolvedBy = userId;
      if (args.resolution) {
        updateData.resolution = args.resolution;
      }
    }

    await ctx.db.patch(args.incidentId as Id<"incidents">, updateData);

    await ctx.db.insert("incidentTimeline", {
      incidentId: args.incidentId,
      type: "status_change",
      message: `Status updated to ${args.status}${args.resolution ? `: ${args.resolution}` : ""}`,
      metadata: { previousStatus: incident.status, newStatus: args.status },
      internal: false,
      createdBy: userId,
      tenantId: incident.tenantId,
      createdAt: now,
    });

    await logAction(ctx, {
      tenantId: incident.tenantId,
      actorId: userId,
      actorEmail: email,
      action: isResolved ? "operations.incident_resolved" : "operations.incident_updated",
      entityType: "incident",
      entityId: args.incidentId,
      before: { status: incident.status },
      after: { status: args.status, resolution: args.resolution },
    });

    return { success: true, message: "Incident status updated successfully" };
  },
});

/**
 * Acknowledge an incident
 */
export const acknowledgeIncident = mutation({
  args: {
    sessionToken: v.string(),
    incidentId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const incident = await ctx.db.get(args.incidentId as Id<"incidents">);
    if (!incident) throw new Error("Incident not found");

    const now = Date.now();

    await ctx.db.patch(args.incidentId as Id<"incidents">, {
      acknowledged: true,
      acknowledgedAt: now,
      acknowledgedBy: userId,
      updatedAt: now,
    });

    await ctx.db.insert("incidentTimeline", {
      incidentId: args.incidentId,
      type: "action",
      message: "Incident acknowledged",
      metadata: { acknowledgedBy: userId },
      internal: false,
      createdBy: userId,
      tenantId: incident.tenantId,
      createdAt: now,
    });

    await logAction(ctx, {
      tenantId: incident.tenantId,
      actorId: userId,
      actorEmail: email,
      action: "operations.incident_updated",
      entityType: "incident",
      entityId: args.incidentId,
      before: { acknowledged: false },
      after: { acknowledged: true, acknowledgedAt: now },
    });

    return { success: true, message: "Incident acknowledged successfully" };
  },
});

/**
 * Create a maintenance window
 */
export const createMaintenanceWindow = mutation({
  args: {
    sessionToken: v.string(),
    title: v.string(),
    description: v.string(),
    scheduledStart: v.number(),
    scheduledEnd: v.number(),
    impact: v.union(v.literal("no_impact"), v.literal("degraded_performance"), v.literal("service_unavailable")),
    affectedServices: v.array(v.string()),
    autoNotify: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const now = Date.now();

    const windowId = await ctx.db.insert("maintenanceWindows", {
      tenantId: "PLATFORM",
      title: args.title,
      description: args.description,
      status: "scheduled",
      scheduledStart: args.scheduledStart,
      scheduledEnd: args.scheduledEnd,
      impact: args.impact,
      affectedServices: args.affectedServices,
      notificationChannels: [],
      autoNotify: args.autoNotify,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      notifications: [],
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: userId,
      actorEmail: email,
      action: "operations.maintenance_window_created",
      entityType: "maintenanceWindow",
      entityId: windowId,
      after: {
        title: args.title,
        scheduledStart: args.scheduledStart,
        scheduledEnd: args.scheduledEnd,
        affectedServices: args.affectedServices,
      },
    });

    return { success: true, windowId, message: "Maintenance window created successfully" };
  },
});

/**
 * Update the status of a maintenance window
 */
export const updateMaintenanceWindow = mutation({
  args: {
    sessionToken: v.string(),
    windowId: v.string(),
    status: v.union(v.literal("scheduled"), v.literal("in_progress"), v.literal("completed"), v.literal("cancelled")),
    actualStart: v.optional(v.number()),
    actualEnd: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const window = await ctx.db.get(args.windowId as Id<"maintenanceWindows">);
    if (!window) throw new Error("Maintenance window not found");

    const now = Date.now();

    const updateData: Record<string, unknown> = {
      status: args.status,
      updatedAt: now,
    };

    if (args.actualStart !== undefined) updateData.actualStart = args.actualStart;
    if (args.actualEnd !== undefined) updateData.actualEnd = args.actualEnd;
    if (args.notes !== undefined) updateData.notes = args.notes;

    // Auto-set actualStart when transitioning to in_progress
    if (args.status === "in_progress" && !window.actualStart && args.actualStart === undefined) {
      updateData.actualStart = now;
    }

    // Auto-set actualEnd when completing or cancelling
    if ((args.status === "completed" || args.status === "cancelled") && !window.actualEnd && args.actualEnd === undefined) {
      updateData.actualEnd = now;
    }

    await ctx.db.patch(args.windowId as Id<"maintenanceWindows">, updateData);

    await logAction(ctx, {
      tenantId: window.tenantId,
      actorId: userId,
      actorEmail: email,
      action: "operations.maintenance_window_updated",
      entityType: "maintenanceWindow",
      entityId: args.windowId,
      before: { status: window.status },
      after: { status: args.status, notes: args.notes },
    });

    return { success: true, message: "Maintenance window updated successfully" };
  },
});

/**
 * Resolve an operations alert
 */
export const resolveAlert = mutation({
  args: {
    sessionToken: v.string(),
    alertId: v.string(),
    resolution: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const alert = await ctx.db.get(args.alertId as Id<"operationsAlerts">);
    if (!alert) throw new Error("Alert not found");

    const now = Date.now();

    await ctx.db.patch(args.alertId as Id<"operationsAlerts">, {
      status: "resolved",
      resolvedAt: now,
      resolvedBy: userId,
      resolution: args.resolution,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: alert.tenantId,
      actorId: userId,
      actorEmail: email,
      action: "operations.alert_created",
      entityType: "operationsAlert",
      entityId: args.alertId,
      before: { status: alert.status },
      after: { status: "resolved", resolution: args.resolution, resolvedAt: now },
    });

    return { success: true, message: "Alert resolved successfully" };
  },
});
