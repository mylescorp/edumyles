import { mutation } from "../../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../../helpers/platformGuard";
import { idGenerator } from "../../../helpers/idGenerator";

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
    const { tenantId, userId, role } = await requirePlatformSession(ctx, args.sessionToken);

    const incidentId = idGenerator("incident");

    // Create the incident
    await ctx.db.insert("incidents", {
      _id: incidentId,
      title: args.title,
      description: args.description,
      severity: args.severity,
      status: "active",
      services: args.services,
      impact: args.impact || "",
      assignedTo: args.assignedTo || null,
      tags: args.tags || [],
      createdBy: userId,
      tenantId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      startTime: Date.now(),
      endTime: null,
      duration: null,
      resolution: null,
      resolvedBy: null,
      acknowledged: false,
      acknowledgedAt: null,
      acknowledgedBy: null,
      notifications: [],
      metrics: {
        affectedUsers: 0,
        affectedTenants: 0,
        businessImpact: "unknown",
        recoveryTime: null,
      },
    });

    // Send notifications to operations team
    await ctx.db.insert("operationsNotifications", {
      _id: idGenerator("notification"),
      type: "incident_created",
      title: `New ${args.severity} severity incident: ${args.title}`,
      message: `Incident ${incidentId} has been created and requires immediate attention.`,
      incidentId,
      severity: args.severity,
      status: "unread",
      sentTo: "ops-team@edumyles.com",
      sentBy: userId,
      tenantId,
      createdAt: Date.now(),
      readAt: null,
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
      status: v.optional(v.union(v.literal("active"), v.literal("investigating"), v.literal("resolved"), v.literal("monitoring"))),
      assignedTo: v.optional(v.string()),
      impact: v.optional(v.string()),
      resolution: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const { tenantId, userId, role } = await requirePlatformSession(ctx, args.sessionToken);

    // Get the incident
    const incident = await ctx.db.get(args.incidentId);
    if (!incident) {
      throw new Error("Incident not found");
    }

    // Check permissions
    if (role !== "super_admin" && incident.createdBy !== userId) {
      throw new Error("Insufficient permissions to update this incident");
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    // Handle status changes
    if (args.updates.status) {
      updateData.status = args.updates.status;
      
      if (args.updates.status === "resolved") {
        updateData.endTime = Date.now();
        updateData.duration = Date.now() - incident.startTime;
        updateData.resolvedBy = userId;
      }
    }

    // Handle acknowledgment
    if (args.updates.status === "investigating" && !incident.acknowledged) {
      updateData.acknowledged = true;
      updateData.acknowledgedAt = Date.now();
      updateData.acknowledgedBy = userId;
    }

    // Apply other updates
    Object.keys(args.updates).forEach(key => {
      if (args.updates[key as keyof typeof args.updates] !== undefined) {
        updateData[key] = args.updates[key as keyof typeof args.updates];
      }
    });

    await ctx.db.patch(args.incidentId, updateData);

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
    const { tenantId, userId, role } = await requirePlatformSession(ctx, args.sessionToken);

    const timelineId = idGenerator("timeline");

    await ctx.db.insert("incidentTimeline", {
      _id: timelineId,
      incidentId: args.incidentId,
      type: args.entry.type,
      message: args.entry.message,
      metadata: args.entry.metadata || null,
      internal: args.entry.internal || false,
      createdBy: userId,
      tenantId,
      createdAt: Date.now(),
    });

    return {
      success: true,
      timelineId,
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
    const { tenantId, userId, role } = await requirePlatformSession(ctx, args.sessionToken);

    const maintenanceId = idGenerator("maintenance");

    await ctx.db.insert("maintenanceWindows", {
      _id: maintenanceId,
      title: args.title,
      description: args.description,
      status: "scheduled",
      scheduledStart: args.scheduledStart,
      scheduledEnd: args.scheduledEnd,
      actualStart: null,
      actualEnd: null,
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

    // Schedule notifications if auto-notify is enabled
    if (args.autoNotify) {
      const notificationTime = args.scheduledStart - (30 * 60 * 1000); // 30 minutes before
      if (notificationTime > Date.now()) {
        await ctx.db.insert("scheduledNotifications", {
          _id: idGenerator("scheduled"),
          type: "maintenance_reminder",
          scheduledFor: notificationTime,
          maintenanceId,
          message: `Maintenance window "${args.title}" is scheduled to start in 30 minutes`,
          channels: args.notificationChannels,
          status: "pending",
          tenantId,
          createdAt: Date.now(),
        });
      }
    }

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
    const { tenantId, userId, role } = await requirePlatformSession(ctx, args.sessionToken);

    const maintenance = await ctx.db.get(args.maintenanceId);
    if (!maintenance) {
      throw new Error("Maintenance window not found");
    }

    const updateData: any = {
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

    await ctx.db.patch(args.maintenanceId, updateData);

    return {
      success: true,
      message: "Maintenance status updated successfully",
    };
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
    const { tenantId, userId, role } = await requirePlatformSession(ctx, args.sessionToken);

    const alertId = idGenerator("alert");

    await ctx.db.insert("operationsAlerts", {
      _id: alertId,
      type: args.type,
      title: args.title,
      description: args.description,
      severity: args.severity,
      status: "active",
      source: args.source,
      metrics: args.metrics || {},
      autoResolve: args.autoResolve || false,
      resolveCondition: args.resolveCondition || null,
      createdBy: userId,
      tenantId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      resolvedAt: null,
      resolvedBy: null,
      resolution: null,
      acknowledgements: [],
      notifications: [],
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
    const { tenantId, userId, role } = await requirePlatformSession(ctx, args.sessionToken);

    const alert = await ctx.db.get(args.alertId);
    if (!alert) {
      throw new Error("Alert not found");
    }

    // Add acknowledgment
    await ctx.db.insert("alertAcknowledgements", {
      _id: idGenerator("acknowledgement"),
      alertId: args.alertId,
      userId,
      notes: args.notes || "",
      acknowledgedAt: Date.now(),
      tenantId,
    });

    // Update alert status
    await ctx.db.patch(args.alertId, {
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
    const { tenantId, userId, role } = await requirePlatformSession(ctx, args.sessionToken);

    const alert = await ctx.db.get(args.alertId);
    if (!alert) {
      throw new Error("Alert not found");
    }

    await ctx.db.patch(args.alertId, {
      status: "resolved",
      resolvedAt: Date.now(),
      resolvedBy: userId,
      resolution: args.resolution,
      updatedAt: Date.now(),
    });

    // Prevent recurrence if requested
    if (args.preventRecurrence && alert.resolveCondition) {
      await ctx.db.insert("alertSuppressions", {
        _id: idGenerator("suppression"),
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
