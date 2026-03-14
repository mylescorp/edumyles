import { query } from "../../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../../helpers/platformGuard";

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
    const { tenantId } = await requirePlatformSession(ctx, args.sessionToken);

    let incidentsQuery = ctx.db.query("incidents").withIndex("by_tenantId", (q) => q.eq("tenantId", tenantId));

    // Apply filters
    if (args.status && args.status !== "all") {
      incidentsQuery = incidentsQuery.withIndex("by_status", (q) => q.eq("status", args.status));
    }

    if (args.severity) {
      incidentsQuery = incidentsQuery.withIndex("by_severity", (q) => q.eq("severity", args.severity));
    }

    if (args.assignedTo) {
      incidentsQuery = incidentsQuery.withIndex("by_assignedTo", (q) => q.eq("assignedTo", args.assignedTo));
    }

    // Apply time range filter
    const now = Date.now();
    let timeFilter = 0;
    switch (args.timeRange) {
      case "24h":
        timeFilter = 24 * 60 * 60 * 1000;
        break;
      case "7d":
        timeFilter = 7 * 24 * 60 * 60 * 1000;
        break;
      case "30d":
        timeFilter = 30 * 24 * 60 * 60 * 1000;
        break;
    }
    if (timeFilter > 0) {
      incidentsQuery = incidentsQuery.filter((q) => q.gte(q.field("createdAt"), now - timeFilter));
    }

    // Get incidents with timeline
    const incidents = await incidentsQuery.take(args.limit || 50).collect();
    
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
    const { tenantId } = await requirePlatformSession(ctx, args.sessionToken);

    // Get incident
    const incident = await ctx.db.get(args.incidentId);
    if (!incident || incident.tenantId !== tenantId) {
      throw new Error("Incident not found");
    }

    // Get full timeline
    const timeline = await ctx.db
      .query("incidentTimeline")
      .withIndex("by_incidentId", (q) => q.eq("incidentId", incident._id))
      .order("desc")
      .collect();

    // Get related alerts
    const alerts = await ctx.db
      .query("operationsAlerts")
      .withIndex("by_createdAt", (q) => q.gte(q.field("createdAt"), incident.startTime))
      .filter((q) => q.lte(q.field("createdAt"), incident.endTime || Date.now()))
      .take(10)
      .collect();

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
    const { tenantId } = await requirePlatformSession(ctx, args.sessionToken);

    let maintenanceQuery = ctx.db.query("maintenanceWindows").withIndex("by_tenantId", (q) => q.eq("tenantId", tenantId));

    // Apply status filter
    if (args.status && args.status !== "all") {
      maintenanceQuery = maintenanceQuery.withIndex("by_status", (q) => q.eq("status", args.status));
    }

    // Apply time range filter
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
    const { tenantId } = await requirePlatformSession(ctx, args.sessionToken);

    let alertsQuery = ctx.db.query("operationsAlerts").withIndex("by_tenantId", (q) => q.eq("tenantId", tenantId));

    // Apply filters
    if (args.type) {
      alertsQuery = alertsQuery.withIndex("by_type", (q) => q.eq("type", args.type));
    }

    if (args.severity) {
      alertsQuery = alertsQuery.withIndex("by_severity", (q) => q.eq("severity", args.severity));
    }

    if (args.status && args.status !== "all") {
      alertsQuery = alertsQuery.withIndex("by_status", (q) => q.eq("status", args.status));
    }

    if (args.acknowledged !== undefined) {
      if (args.acknowledged) {
        // Get alerts that have acknowledgements
        const acknowledgedAlertIds = await ctx.db
          .query("alertAcknowledgements")
          .withIndex("by_userId", (q) => q.eq("userId", tenantId))
          .collect()
          .then(acks => acks.map(ack => ack.alertId));

        alertsQuery = alertsQuery.filter((q) => 
          q.in(q.field("_id"), acknowledgedAlertIds)
        );
      } else {
        // Get alerts without acknowledgements
        const acknowledgedAlertIds = await ctx.db
          .query("alertAcknowledgements")
          .collect()
          .then(acks => acks.map(ack => ack.alertId));

        alertsQuery = alertsQuery.filter((q) => 
          q.notIn(q.field("_id"), acknowledgedAlertIds)
        );
      }
    }

    // Apply time range filter
    const now = Date.now();
    let timeFilter = 0;
    switch (args.timeRange) {
      case "1h":
        timeFilter = 1 * 60 * 60 * 1000;
        break;
      case "24h":
        timeFilter = 24 * 60 * 60 * 1000;
        break;
      case "7d":
        timeFilter = 7 * 24 * 60 * 60 * 1000;
        break;
    }
    if (timeFilter > 0) {
      alertsQuery = alertsQuery.filter((q) => q.gte(q.field("createdAt"), now - timeFilter));
    }

    const alerts = await alertsQuery.order("desc").take(args.limit || 50).collect();

    // Enrich with acknowledgements
    const alertsWithAcknowledgements = await Promise.all(
      alerts.map(async (alert) => {
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
    const { tenantId } = await requirePlatformSession(ctx, args.sessionToken);

    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    const last7Days = now - (7 * 24 * 60 * 60 * 1000);

    // Get counts
    const [activeIncidents, criticalIncidents, resolvedIncidents] = await Promise.all([
      ctx.db
        .query("incidents")
        .withIndex("by_tenantId", (q) => q.eq("tenantId", tenantId))
        .withIndex("by_status", (q) => q.eq("status", "active"))
        .collect()
        .then(incidents => incidents.length),
      
      ctx.db
        .query("incidents")
        .withIndex("by_tenantId", (q) => q.eq("tenantId", tenantId))
        .withIndex("by_severity", (q) => q.eq("severity", "critical"))
        .filter((q) => q.gte(q.field("createdAt"), last24Hours))
        .collect()
        .then(incidents => incidents.length),
      
      ctx.db
        .query("incidents")
        .withIndex("by_tenantId", (q) => q.eq("tenantId", tenantId))
        .withIndex("by_status", (q) => q.eq("status", "resolved"))
        .filter((q) => q.gte(q.field("resolvedAt"), last7Days))
        .collect()
        .then(incidents => incidents.length),
    ]);

    const [activeAlerts, criticalAlerts, resolvedAlerts] = await Promise.all([
      ctx.db
        .query("operationsAlerts")
        .withIndex("by_tenantId", (q) => q.eq("tenantId", tenantId))
        .withIndex("by_status", (q) => q.eq("status", "active"))
        .collect()
        .then(alerts => alerts.length),
      
      ctx.db
        .query("operationsAlerts")
        .withIndex("by_tenantId", (q) => q.eq("tenantId", tenantId))
        .withIndex("by_severity", (q) => q.eq("severity", "critical"))
        .filter((q) => q.gte(q.field("createdAt"), last24Hours))
        .collect()
        .then(alerts => alerts.length),
      
      ctx.db
        .query("operationsAlerts")
        .withIndex("by_tenantId", (q) => q.eq("tenantId", tenantId))
        .withIndex("by_status", (q) => q.eq("status", "resolved"))
        .filter((q) => q.gte(q.field("resolvedAt"), last7Days))
        .collect()
        .then(alerts => alerts.length),
    ]);

    const [upcomingMaintenance, activeMaintenance] = await Promise.all([
      ctx.db
        .query("maintenanceWindows")
        .withIndex("by_tenantId", (q) => q.eq("tenantId", tenantId))
        .withIndex("by_status", (q) => q.eq("status", "scheduled"))
        .filter((q) => q.gte(q.field("scheduledStart"), now))
        .collect()
        .then(maintenance => maintenance.length),
      
      ctx.db
        .query("maintenanceWindows")
        .withIndex("by_tenantId", (q) => q.eq("tenantId", tenantId))
        .withIndex("by_status", (q) => q.eq("status", "in_progress"))
        .collect()
        .then(maintenance => maintenance.length),
    ]);

    // Get system health status
    const systemHealth = await ctx.db
      .query("systemHealth")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenantId))
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
      systemHealth: systemHealth || {
        overall: "unknown",
        score: 0,
        lastChecked: now,
      },
      lastUpdated: now,
    };
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
    const { tenantId } = await requirePlatformSession(ctx, args.sessionToken);

    let notificationsQuery = ctx.db
      .query("scheduledNotifications")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenantId));

    if (args.status && args.status !== "all") {
      notificationsQuery = notificationsQuery.withIndex("by_status", (q) => q.eq("status", args.status));
    }

    const notifications = await notificationsQuery.order("desc").collect();

    // Enrich with maintenance details
    const notificationsWithDetails = await Promise.all(
      notifications.map(async (notification) => {
        let maintenance = null;
        if (notification.maintenanceId) {
          maintenance = await ctx.db.get(notification.maintenanceId);
        }

        return {
          ...notification,
          maintenance,
        };
      })
    );

    return notificationsWithDetails;
  },
});
