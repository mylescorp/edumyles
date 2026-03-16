import { query } from "../../_generated/server";
import { v } from "convex/values";
import { Id } from "../../_generated/dataModel";
import { requirePlatformSession } from "../../helpers/platformGuard";

/**
 * Get all incidents with optional filtering
 */
export const getIncidents = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(v.union(v.literal("active"), v.literal("investigating"), v.literal("resolved"), v.literal("all"))),
    severity: v.optional(v.union(v.literal("critical"), v.literal("high"), v.literal("medium"), v.literal("low"))),
    assignedTo: v.optional(v.string()),
    timeRange: v.optional(v.union(v.literal("24h"), v.literal("7d"), v.literal("30d"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    // Use compound index when status is specified, otherwise filter by tenant
    let rawQuery;
    if (args.status && args.status !== "all") {
      const status = args.status;
      rawQuery = ctx.db
        .query("incidents")
        .withIndex("by_status", (q) => q.eq("tenantId", tenantId).eq("status", status));
    } else {
      rawQuery = ctx.db
        .query("incidents")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId));
    }

    // Apply severity filter
    if (args.severity) {
      const sev = args.severity;
      rawQuery = rawQuery.filter((q) => q.eq(q.field("severity"), sev));
    }

    // Apply assignedTo filter
    if (args.assignedTo) {
      const assignee = args.assignedTo;
      rawQuery = rawQuery.filter((q) => q.eq(q.field("assignedTo"), assignee));
    }

    // Apply time range filter
    const now = Date.now();
    let timeFilter = 0;
    switch (args.timeRange) {
      case "24h": timeFilter = 24 * 60 * 60 * 1000; break;
      case "7d":  timeFilter = 7 * 24 * 60 * 60 * 1000; break;
      case "30d": timeFilter = 30 * 24 * 60 * 60 * 1000; break;
    }
    if (timeFilter > 0) {
      const cutoff = now - timeFilter;
      rawQuery = rawQuery.filter((q) => q.gte(q.field("createdAt"), cutoff));
    }

    const incidents = await rawQuery.take(args.limit ?? 50);

    // Enrich with timeline entries
    const incidentsWithTimeline = await Promise.all(
      incidents.map(async (incident) => {
        const timeline = await ctx.db
          .query("incidentTimeline")
          .withIndex("by_incidentId", (q) => q.eq("incidentId", incident._id))
          .order("desc")
          .collect();

        return {
          ...incident,
          timeline,
          duration: incident.endTime ? incident.endTime - incident.startTime : null,
        };
      })
    );

    return incidentsWithTimeline;
  },
});

/**
 * Get incident details with full timeline
 */
export const getIncidentDetails = query({
  args: {
    sessionToken: v.string(),
    incidentId: v.string(),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const incident = await ctx.db.get(args.incidentId as Id<"incidents">);
    if (!incident || incident.tenantId !== tenantId) {
      throw new Error("Incident not found");
    }

    // Get full timeline
    const timeline = await ctx.db
      .query("incidentTimeline")
      .withIndex("by_incidentId", (q) => q.eq("incidentId", incident._id))
      .order("desc")
      .collect();

    // Get related alerts (created during incident window)
    const startTime = incident.startTime;
    const endTime = incident.endTime ?? Date.now();
    const alerts = await ctx.db
      .query("operationsAlerts")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), startTime),
          q.lte(q.field("createdAt"), endTime)
        )
      )
      .take(10);

    return {
      incident,
      timeline,
      alerts,
    };
  },
});

/**
 * Get maintenance windows
 */
export const getMaintenanceWindows = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(v.union(v.literal("scheduled"), v.literal("in_progress"), v.literal("completed"), v.literal("all"))),
    timeRange: v.optional(v.union(v.literal("upcoming"), v.literal("past"), v.literal("all"))),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    let maintenanceQuery;
    if (args.status && args.status !== "all") {
      const status = args.status;
      maintenanceQuery = ctx.db
        .query("maintenanceWindows")
        .withIndex("by_status", (q) => q.eq("tenantId", tenantId).eq("status", status));
    } else {
      maintenanceQuery = ctx.db
        .query("maintenanceWindows")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId));
    }

    const now = Date.now();
    if (args.timeRange === "upcoming") {
      maintenanceQuery = maintenanceQuery.filter((q) => q.gte(q.field("scheduledStart"), now));
    } else if (args.timeRange === "past") {
      maintenanceQuery = maintenanceQuery.filter((q) => q.lt(q.field("scheduledStart"), now));
    }

    const maintenance = await maintenanceQuery.order("desc").collect();

    return maintenance.map((window) => ({
      ...window,
      duration: window.actualEnd && window.actualStart ? window.actualEnd - window.actualStart : null,
      scheduledDuration: window.scheduledEnd - window.scheduledStart,
    }));
  },
});

/**
 * Get operations alerts
 */
export const getAlerts = query({
  args: {
    sessionToken: v.string(),
    type: v.optional(v.union(v.literal("system"), v.literal("security"), v.literal("performance"), v.literal("capacity"))),
    severity: v.optional(v.union(v.literal("critical"), v.literal("warning"), v.literal("info"))),
    status: v.optional(v.union(v.literal("active"), v.literal("resolved"), v.literal("all"))),
    acknowledged: v.optional(v.boolean()),
    timeRange: v.optional(v.union(v.literal("1h"), v.literal("24h"), v.literal("7d"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    // Start with most specific available index
    let alertsQuery;
    if (args.status && args.status !== "all") {
      const status = args.status;
      alertsQuery = ctx.db
        .query("operationsAlerts")
        .withIndex("by_status", (q) => q.eq("tenantId", tenantId).eq("status", status));
    } else if (args.type) {
      const type = args.type;
      alertsQuery = ctx.db
        .query("operationsAlerts")
        .withIndex("by_type", (q) => q.eq("tenantId", tenantId).eq("type", type));
    } else if (args.severity) {
      const severity = args.severity;
      alertsQuery = ctx.db
        .query("operationsAlerts")
        .withIndex("by_severity", (q) => q.eq("tenantId", tenantId).eq("severity", severity));
    } else {
      alertsQuery = ctx.db
        .query("operationsAlerts")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId));
    }

    // Apply remaining filters as JS-level filters
    if (args.type && args.status && args.status !== "all") {
      const type = args.type;
      alertsQuery = alertsQuery.filter((q) => q.eq(q.field("type"), type));
    }
    if (args.severity && (args.status || args.type)) {
      const severity = args.severity;
      alertsQuery = alertsQuery.filter((q) => q.eq(q.field("severity"), severity));
    }

    // Apply time range filter
    const now = Date.now();
    let timeFilter = 0;
    switch (args.timeRange) {
      case "1h":  timeFilter = 1 * 60 * 60 * 1000; break;
      case "24h": timeFilter = 24 * 60 * 60 * 1000; break;
      case "7d":  timeFilter = 7 * 24 * 60 * 60 * 1000; break;
    }
    if (timeFilter > 0) {
      const cutoff = now - timeFilter;
      alertsQuery = alertsQuery.filter((q) => q.gte(q.field("createdAt"), cutoff));
    }

    const rawAlerts = await alertsQuery.order("desc").take(args.limit ?? 50);

    // Enrich with acknowledgements
    const alertsWithAcknowledgements = await Promise.all(
      rawAlerts.map(async (alert) => {
        const acknowledgements = await ctx.db
          .query("alertAcknowledgements")
          .withIndex("by_alertId", (q) => q.eq("alertId", alert._id))
          .collect();

        return {
          ...alert,
          acknowledgements,
          acknowledged: acknowledgements.length > 0,
        };
      })
    );

    // Apply acknowledged filter in JS (avoids q.in / q.notIn)
    if (args.acknowledged !== undefined) {
      return alertsWithAcknowledgements.filter((a) =>
        args.acknowledged ? a.acknowledged : !a.acknowledged
      );
    }

    return alertsWithAcknowledgements;
  },
});

/**
 * Get operations dashboard overview
 */
export const getOperationsOverview = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    const last7Days = now - (7 * 24 * 60 * 60 * 1000);

    const [activeIncidents, criticalIncidents, resolvedIncidents] = await Promise.all([
      ctx.db
        .query("incidents")
        .withIndex("by_status", (q) => q.eq("tenantId", tenantId).eq("status", "active"))
        .collect()
        .then((r) => r.length),

      ctx.db
        .query("incidents")
        .withIndex("by_severity", (q) => q.eq("tenantId", tenantId).eq("severity", "critical"))
        .filter((q) => q.gte(q.field("createdAt"), last24Hours))
        .collect()
        .then((r) => r.length),

      ctx.db
        .query("incidents")
        .withIndex("by_status", (q) => q.eq("tenantId", tenantId).eq("status", "resolved"))
        .filter((q) => q.gte(q.field("updatedAt"), last7Days))
        .collect()
        .then((r) => r.length),
    ]);

    const [activeAlerts, criticalAlerts, resolvedAlerts] = await Promise.all([
      ctx.db
        .query("operationsAlerts")
        .withIndex("by_status", (q) => q.eq("tenantId", tenantId).eq("status", "active"))
        .collect()
        .then((r) => r.length),

      ctx.db
        .query("operationsAlerts")
        .withIndex("by_severity", (q) => q.eq("tenantId", tenantId).eq("severity", "critical"))
        .filter((q) => q.gte(q.field("createdAt"), last24Hours))
        .collect()
        .then((r) => r.length),

      ctx.db
        .query("operationsAlerts")
        .withIndex("by_status", (q) => q.eq("tenantId", tenantId).eq("status", "resolved"))
        .filter((q) => q.gte(q.field("updatedAt"), last7Days))
        .collect()
        .then((r) => r.length),
    ]);

    const [upcomingMaintenance, activeMaintenance] = await Promise.all([
      ctx.db
        .query("maintenanceWindows")
        .withIndex("by_status", (q) => q.eq("tenantId", tenantId).eq("status", "scheduled"))
        .filter((q) => q.gte(q.field("scheduledStart"), now))
        .collect()
        .then((r) => r.length),

      ctx.db
        .query("maintenanceWindows")
        .withIndex("by_status", (q) => q.eq("tenantId", tenantId).eq("status", "in_progress"))
        .collect()
        .then((r) => r.length),
    ]);

    const systemHealth = await ctx.db
      .query("systemHealth")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .order("desc")
      .first();

    return {
      incidents: {
        active: activeIncidents,
        critical: criticalIncidents,
        resolved: resolvedIncidents,
      },
      alerts: {
        active: activeAlerts,
        critical: criticalAlerts,
        resolved: resolvedAlerts,
      },
      maintenance: {
        upcoming: upcomingMaintenance,
        active: activeMaintenance,
      },
      systemHealth: systemHealth ?? {
        overall: "unknown",
        score: 0,
        lastChecked: now,
      },
      lastUpdated: now,
    };
  },
});

/**
 * List alert suppressions
 */
export const listAlertSuppressions = query({
  args: {
    sessionToken: v.string(),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const suppressions = await ctx.db
      .query("alertSuppressions")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .collect();

    if (args.active) {
      const now = Date.now();
      return suppressions.filter((s) => s.expiresAt > now);
    }

    return suppressions;
  },
});

/**
 * Get alert acknowledgements for a specific alert
 */
export const getAlertAcknowledgements = query({
  args: {
    sessionToken: v.string(),
    alertId: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    return await ctx.db
      .query("alertAcknowledgements")
      .withIndex("by_alertId", (q) => q.eq("alertId", args.alertId))
      .order("desc")
      .collect();
  },
});

/**
 * Get scheduled notifications
 */
export const getScheduledNotifications = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(v.union(v.literal("pending"), v.literal("sent"), v.literal("all"))),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    let notificationsQuery;
    if (args.status && args.status !== "all") {
      const status = args.status;
      notificationsQuery = ctx.db
        .query("scheduledNotifications")
        .withIndex("by_status", (q) => q.eq("tenantId", tenantId).eq("status", status));
    } else {
      notificationsQuery = ctx.db
        .query("scheduledNotifications")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId));
    }

    const notifications = await notificationsQuery.order("desc").collect();

    // Enrich with maintenance details
    const notificationsWithDetails = await Promise.all(
      notifications.map(async (notification) => {
        let maintenance = null;
        if (notification.maintenanceId) {
          maintenance = await ctx.db.get(notification.maintenanceId as Id<"maintenanceWindows">);
        }
        return { ...notification, maintenance };
      })
    );

    return notificationsWithDetails;
  },
});
