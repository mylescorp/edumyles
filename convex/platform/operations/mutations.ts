import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { Id } from "../../_generated/dataModel";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";

/**
 * Create a new incident in the operations center
 */
export const createIncident = mutation({
  args: {
    sessionToken: v.string(),
    title: v.string(),
    description: v.string(),
    severity: v.union(v.literal("critical"), v.literal("high"), v.literal("medium"), v.literal("low")),
    services: v.array(v.string()),
    impact: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId, email } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const incidentId = await ctx.db.insert("incidents", {
      title: args.title,
      description: args.description,
      severity: args.severity,
      status: "active",
      services: args.services,
      impact: args.impact ?? "",
      assignedTo: args.assignedTo,
      tags: args.tags ?? [],
      createdBy: userId,
      tenantId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      startTime: Date.now(),
      acknowledged: false,
      notifications: [],
      metrics: {
        affectedUsers: 0,
        affectedTenants: 0,
        businessImpact: "unknown",
      },
    });

    await logAction(ctx, {
      tenantId,
      actorId: userId,
      actorEmail: email,
      action: "operations.incident_created",
      entityType: "incident",
      entityId: String(incidentId),
      after: { title: args.title, severity: args.severity, services: args.services },
    });

    return {
      success: true,
      incidentId,
      message: "Incident created successfully",
    };
  },
});

/**
 * Update an existing incident
 */
export const updateIncident = mutation({
  args: {
    sessionToken: v.string(),
    incidentId: v.string(),
    updates: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      severity: v.optional(v.union(v.literal("critical"), v.literal("high"), v.literal("medium"), v.literal("low"))),
      status: v.optional(v.union(v.literal("active"), v.literal("investigating"), v.literal("resolved"), v.literal("closed"))),
      assignedTo: v.optional(v.string()),
      impact: v.optional(v.string()),
      resolution: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId, role, email } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const incident = await ctx.db.get(args.incidentId as Id<"incidents">);
    if (!incident) {
      throw new Error("Incident not found");
    }

    if (role !== "super_admin" && incident.createdBy !== userId) {
      throw new Error("Insufficient permissions to update this incident");
    }

    const updateData: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.updates.status) {
      updateData.status = args.updates.status;
      if (args.updates.status === "resolved") {
        updateData.endTime = Date.now();
        updateData.duration = Date.now() - incident.startTime;
        updateData.resolvedBy = userId;
      }
    }

    if (args.updates.status === "investigating" && !incident.acknowledged) {
      updateData.acknowledged = true;
      updateData.acknowledgedAt = Date.now();
      updateData.acknowledgedBy = userId;
    }

    Object.keys(args.updates).forEach(key => {
      if (args.updates[key as keyof typeof args.updates] !== undefined) {
        updateData[key] = args.updates[key as keyof typeof args.updates];
      }
    });

    await ctx.db.patch(args.incidentId as Id<"incidents">, updateData);

    await logAction(ctx, {
      tenantId,
      actorId: userId,
      actorEmail: email,
      action: "operations.incident_updated",
      entityType: "incident",
      entityId: args.incidentId,
      before: { title: incident.title, severity: incident.severity, status: incident.status },
      after: updateData,
    });

    return {
      success: true,
      message: "Incident updated successfully",
    };
  },
});

/**
 * Add a timeline entry to an incident
 */
export const addIncidentTimeline = mutation({
  args: {
    sessionToken: v.string(),
    incidentId: v.string(),
    entry: v.object({
      type: v.union(v.literal("status_change"), v.literal("note"), v.literal("action"), v.literal("notification")),
      message: v.string(),
      metadata: v.optional(v.any()),
      internal: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    await ctx.db.insert("incidentTimeline", {
      incidentId: args.incidentId,
      type: args.entry.type,
      message: args.entry.message,
      metadata: args.entry.metadata,
      internal: args.entry.internal ?? false,
      createdBy: userId,
      tenantId,
      createdAt: Date.now(),
    });

    return {
      success: true,
      message: "Timeline entry added successfully",
    };
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
    notificationChannels: v.array(v.string()),
    autoNotify: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId, email } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const maintenanceId = await ctx.db.insert("maintenanceWindows", {
      title: args.title,
      description: args.description,
      status: "scheduled",
      scheduledStart: args.scheduledStart,
      scheduledEnd: args.scheduledEnd,
      impact: args.impact,
      affectedServices: args.affectedServices,
      notificationChannels: args.notificationChannels,
      autoNotify: args.autoNotify,
      createdBy: userId,
      tenantId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      notifications: [],
    });

    if (args.autoNotify) {
      const notificationTime = args.scheduledStart - (30 * 60 * 1000); // 30 minutes before
      if (notificationTime > Date.now()) {
        await ctx.db.insert("scheduledNotifications", {
          type: "maintenance_reminder",
          scheduledFor: notificationTime,
          maintenanceId: maintenanceId,
          message: `Maintenance window "${args.title}" is scheduled to start in 30 minutes`,
          channels: args.notificationChannels,
          status: "pending",
          tenantId,
          createdAt: Date.now(),
        });
      }
    }

    await logAction(ctx, {
      tenantId,
      actorId: userId,
      actorEmail: email,
      action: "operations.maintenance_window_created",
      entityType: "maintenance_window",
      entityId: String(maintenanceId),
      after: { title: args.title, scheduledStart: args.scheduledStart, scheduledEnd: args.scheduledEnd, impact: args.impact, affectedServices: args.affectedServices },
    });

    return {
      success: true,
      maintenanceId,
      message: "Maintenance window created successfully",
    };
  },
});

/**
 * Update maintenance window status
 */
export const updateMaintenanceStatus = mutation({
  args: {
    sessionToken: v.string(),
    maintenanceId: v.string(),
    status: v.union(v.literal("scheduled"), v.literal("in_progress"), v.literal("completed"), v.literal("cancelled")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const maintenance = await ctx.db.get(args.maintenanceId as Id<"maintenanceWindows">);
    if (!maintenance) {
      throw new Error("Maintenance window not found");
    }

    const updateData: Record<string, unknown> = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.status === "in_progress" && !maintenance.actualStart) {
      updateData.actualStart = Date.now();
    }

    if (args.status === "completed" && !maintenance.actualEnd) {
      updateData.actualEnd = Date.now();
    }

    if (args.notes) {
      updateData.notes = args.notes;
    }

    await ctx.db.patch(args.maintenanceId as Id<"maintenanceWindows">, updateData);

    return {
      success: true,
      message: "Maintenance status updated successfully",
    };
  },
});

/**
 * Cancel a maintenance window
 */
export const cancelMaintenance = mutation({
  args: {
    sessionToken: v.string(),
    maintenanceId: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const maintenance = await ctx.db.get(args.maintenanceId as Id<"maintenanceWindows">);
    if (!maintenance) throw new Error("Maintenance window not found");

    await ctx.db.patch(args.maintenanceId as Id<"maintenanceWindows">, {
      status: "cancelled",
      updatedAt: Date.now(),
      notes: args.reason ?? "Cancelled by admin",
    });

    return { success: true, message: "Maintenance window cancelled" };
  },
});

/**
 * Create an alert suppression rule
 */
export const createAlertSuppression = mutation({
  args: {
    sessionToken: v.string(),
    alertType: v.union(v.literal("system"), v.literal("security"), v.literal("performance"), v.literal("capacity")),
    source: v.string(),
    condition: v.string(),
    durationHours: v.optional(v.number()),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const expiresAt = Date.now() + ((args.durationHours ?? 168) * 60 * 60 * 1000); // default 7 days

    const suppressionId = await ctx.db.insert("alertSuppressions", {
      alertType: args.alertType,
      source: args.source,
      condition: args.condition,
      suppressedBy: userId,
      suppressedAt: Date.now(),
      expiresAt,
      tenantId,
    });

    return { success: true, suppressionId, message: "Alert suppression created" };
  },
});

/**
 * Remove an alert suppression
 */
export const removeAlertSuppression = mutation({
  args: {
    sessionToken: v.string(),
    suppressionId: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const suppression = await ctx.db.get(args.suppressionId as Id<"alertSuppressions">);
    if (!suppression) throw new Error("Alert suppression not found");

    await ctx.db.delete(args.suppressionId as Id<"alertSuppressions">);
    return { success: true, message: "Alert suppression removed" };
  },
});

/**
 * Create an operations alert
 */
export const createAlert = mutation({
  args: {
    sessionToken: v.string(),
    type: v.union(v.literal("system"), v.literal("security"), v.literal("performance"), v.literal("capacity")),
    title: v.string(),
    description: v.string(),
    severity: v.union(v.literal("critical"), v.literal("warning"), v.literal("info")),
    source: v.string(),
    metrics: v.optional(v.any()),
    autoResolve: v.optional(v.boolean()),
    resolveCondition: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId, email } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const alertId = await ctx.db.insert("operationsAlerts", {
      type: args.type,
      title: args.title,
      description: args.description,
      severity: args.severity,
      status: "active",
      source: args.source,
      metrics: args.metrics,
      autoResolve: args.autoResolve ?? false,
      resolveCondition: args.resolveCondition,
      createdBy: userId,
      tenantId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      acknowledgements: [],
    });

    await logAction(ctx, {
      tenantId,
      actorId: userId,
      actorEmail: email,
      action: "operations.alert_created",
      entityType: "operations_alert",
      entityId: String(alertId),
      after: { type: args.type, title: args.title, severity: args.severity, source: args.source },
    });

    return {
      success: true,
      alertId,
      message: "Alert created successfully",
    };
  },
});

/**
 * Acknowledge an alert
 */
export const acknowledgeAlert = mutation({
  args: {
    sessionToken: v.string(),
    alertId: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const alert = await ctx.db.get(args.alertId as Id<"operationsAlerts">);
    if (!alert) {
      throw new Error("Alert not found");
    }

    await ctx.db.insert("alertAcknowledgements", {
      alertId: args.alertId,
      userId,
      notes: args.notes ?? "",
      acknowledgedAt: Date.now(),
      tenantId,
    });

    await ctx.db.patch(args.alertId as Id<"operationsAlerts">, {
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: "Alert acknowledged successfully",
    };
  },
});

/**
 * Resolve an alert
 */
export const resolveAlert = mutation({
  args: {
    sessionToken: v.string(),
    alertId: v.string(),
    resolution: v.string(),
    preventRecurrence: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const alert = await ctx.db.get(args.alertId as Id<"operationsAlerts">);
    if (!alert) {
      throw new Error("Alert not found");
    }

    await ctx.db.patch(args.alertId as Id<"operationsAlerts">, {
      status: "resolved",
      resolvedAt: Date.now(),
      resolvedBy: userId,
      resolution: args.resolution,
      updatedAt: Date.now(),
    });

    if (args.preventRecurrence && alert.resolveCondition) {
      await ctx.db.insert("alertSuppressions", {
        alertType: alert.type,
        source: alert.source,
        condition: alert.resolveCondition,
        suppressedBy: userId,
        suppressedAt: Date.now(),
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
        tenantId,
      });
    }

    return {
      success: true,
      message: "Alert resolved successfully",
    };
  },
});
