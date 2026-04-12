import { internal } from "../../_generated/api";
import { mutation, query } from "../../_generated/server";
import { ConvexError, v } from "convex/values";
import { logAction } from "../../helpers/auditLog";
import { requirePlatformRole, requirePlatformSession } from "../../helpers/platformGuard";

function requireMasterAdmin(role: string) {
  if (role !== "master_admin") {
    throw new ConvexError({ code: "FORBIDDEN", message: "master_admin access required" });
  }
}

export const getPlatformSettings = query({
  args: {
    sessionToken: v.string(),
    key: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformRole(ctx, args, [
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);

    if (args.key) {
      return await ctx.db
        .query("platform_settings")
        .withIndex("by_key", (q) => q.eq("key", args.key!))
        .first();
    }

    return await ctx.db.query("platform_settings").collect();
  },
});

export const upsertPlatformSetting = mutation({
  args: {
    sessionToken: v.string(),
    key: v.string(),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);
    requireMasterAdmin(platform.role);

    const existing = await ctx.db
      .query("platform_settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedBy: platform.userId,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("platform_settings", {
        key: args.key,
        value: args.value,
        updatedBy: platform.userId,
        updatedAt: now,
        createdAt: now,
      });
    }

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "settings.updated",
      entityType: "platform_setting",
      entityId: args.key,
      after: { value: args.value },
    });

    return { success: true };
  },
});

export const getFeatureFlags = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformRole(ctx, args, [
      "platform_manager",
      "analytics_viewer",
      "super_admin",
      "master_admin",
    ]);
    return await ctx.db.query("feature_flags").collect();
  },
});

export const getFeatureFlagsForTenant = query({
  args: {
    tenantId: v.string(),
  },
  handler: async (ctx, args) => {
    const flags = await ctx.db.query("feature_flags").collect();
    return flags.map((flag) => ({
      ...flag,
      enabled:
        flag.enabledGlobally ||
        flag.enabledTenantIds.includes(args.tenantId) ||
        (typeof flag.rolloutPct === "number" && flag.rolloutPct >= 100),
    }));
  },
});

export const getPlatformPricingRules = query({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.sessionToken) {
      await requirePlatformRole(ctx, { sessionToken: args.sessionToken }, [
        "billing_admin",
        "platform_manager",
        "super_admin",
        "master_admin",
      ]);
    }
    return await ctx.db.query("platform_pricing_rules").collect();
  },
});

export const upsertPlatformPricingRule = mutation({
  args: {
    sessionToken: v.string(),
    category: v.string(),
    minPriceKes: v.number(),
    maxPriceKes: v.number(),
    defaultRevenueSharePct: v.number(),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "billing_admin",
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    const existing = await ctx.db
      .query("platform_pricing_rules")
      .withIndex("by_category", (q: any) => q.eq("category", args.category))
      .first();
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        minPriceKes: args.minPriceKes,
        maxPriceKes: args.maxPriceKes,
        defaultRevenueSharePct: args.defaultRevenueSharePct,
        updatedAt: now,
      });
      await logAction(ctx, {
        tenantId: "PLATFORM",
        actorId: platform.userId,
        actorEmail: platform.email,
        action: "settings.updated",
        entityType: "platform_pricing_rule",
        entityId: String(existing._id),
        after: { category: args.category, minPriceKes: args.minPriceKes, maxPriceKes: args.maxPriceKes },
      });
      return { success: true, pricingRuleId: existing._id };
    }

    const pricingRuleId = await ctx.db.insert("platform_pricing_rules", {
      category: args.category,
      minPriceKes: args.minPriceKes,
      maxPriceKes: args.maxPriceKes,
      defaultRevenueSharePct: args.defaultRevenueSharePct,
      createdAt: now,
      updatedAt: now,
    });
    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "settings.updated",
      entityType: "platform_pricing_rule",
      entityId: String(pricingRuleId),
      after: { category: args.category, minPriceKes: args.minPriceKes, maxPriceKes: args.maxPriceKes },
    });
    return { success: true, pricingRuleId };
  },
});

export const updatePlatformSettings = mutation({
  args: {
    sessionToken: v.string(),
    updates: v.array(
      v.object({
        key: v.string(),
        value: v.any(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);
    requireMasterAdmin(platform.role);

    const now = Date.now();

    for (const update of args.updates) {
      const existing = await ctx.db
        .query("platform_settings")
        .withIndex("by_key", (q) => q.eq("key", update.key))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          value: update.value,
          updatedBy: platform.userId,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("platform_settings", {
          key: update.key,
          value: update.value,
          updatedBy: platform.userId,
          updatedAt: now,
          createdAt: now,
        });
      }

      await logAction(ctx, {
        tenantId: "PLATFORM",
        actorId: platform.userId,
        actorEmail: platform.email,
        action: "settings.updated",
        entityType: "platform_setting",
        entityId: update.key,
        after: { value: update.value },
      });
    }

    return { success: true, updated: args.updates.length };
  },
});

export const sendPlatformTestEmail = mutation({
  args: {
    sessionToken: v.string(),
    to: v.string(),
    subject: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);
    requireMasterAdmin(platform.role);

    await ctx.scheduler.runAfter(0, internal.actions.communications.email.sendEmailInternal, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      to: [args.to],
      subject: args.subject,
      body: args.body,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "settings.updated",
      entityType: "platform_setting",
      entityId: "email",
      after: { to: args.to, subject: args.subject },
    });

    return { success: true };
  },
});

export const sendPlatformTestSms = mutation({
  args: {
    sessionToken: v.string(),
    phone: v.string(),
    message: v.string(),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);
    requireMasterAdmin(platform.role);

    await ctx.scheduler.runAfter(0, internal.actions.communications.sms.sendSmsInternal, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      phone: args.phone,
      message: args.message,
      country: args.country,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "settings.updated",
      entityType: "platform_setting",
      entityId: "sms",
      after: { phone: args.phone },
    });

    return { success: true };
  },
});

export const sendPlatformTestPush = mutation({
  args: {
    sessionToken: v.string(),
    pushToken: v.string(),
    title: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);
    requireMasterAdmin(platform.role);

    await ctx.scheduler.runAfter(0, internal.actions.communications.push.sendPushInternal, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      recipients: [
        {
          userId: platform.userId,
          pushToken: args.pushToken,
        },
      ],
      title: args.title,
      body: args.body,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "settings.updated",
      entityType: "platform_setting",
      entityId: "push",
      after: { pushToken: args.pushToken.slice(-8) },
    });

    return { success: true };
  },
});

export const deletePlatformPricingRule = mutation({
  args: {
    sessionToken: v.string(),
    pricingRuleId: v.id("platform_pricing_rules"),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "billing_admin",
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);

    const existing = await ctx.db.get(args.pricingRuleId);
    if (!existing) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Pricing rule not found" });
    }

    await ctx.db.delete(args.pricingRuleId);

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "settings.updated",
      entityType: "platform_pricing_rule",
      entityId: String(args.pricingRuleId),
      before: {
        category: existing.category,
        minPriceKes: existing.minPriceKes,
        maxPriceKes: existing.maxPriceKes,
        defaultRevenueSharePct: existing.defaultRevenueSharePct,
      },
    });

    return { success: true };
  },
});

export const upsertMarketplaceModulePricingOverride = mutation({
  args: {
    sessionToken: v.string(),
    moduleId: v.string(),
    priceKes: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "billing_admin",
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);

    const key = `marketplace_module_override:${args.moduleId}`;
    const existing = await ctx.db
      .query("platform_settings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    const oldPriceKes =
      existing && typeof existing.value === "object" && existing.value !== null && typeof existing.value.priceKes === "number"
        ? existing.value.priceKes
        : 0;

    const now = Date.now();
    const value = {
      moduleId: args.moduleId,
      priceKes: args.priceKes,
      reason: args.reason ?? "Platform pricing override",
      updatedBy: platform.userId,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, {
        value,
        updatedBy: platform.userId,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("platform_settings", {
        key,
        value,
        updatedBy: platform.userId,
        updatedAt: now,
        createdAt: now,
      });
    }

    await ctx.db.insert("module_price_history", {
      moduleId: args.moduleId,
      oldPriceKes,
      newPriceKes: args.priceKes,
      changedBy: platform.userId,
      changedAt: now,
      reason: args.reason ?? "Platform pricing override",
      createdAt: now,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "settings.updated",
      entityType: "marketplace_module_override",
      entityId: args.moduleId,
      before: { priceKes: oldPriceKes },
      after: value,
    });

    return { success: true };
  },
});

export const deleteMarketplaceModulePricingOverride = mutation({
  args: {
    sessionToken: v.string(),
    moduleId: v.string(),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "billing_admin",
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);

    const key = `marketplace_module_override:${args.moduleId}`;
    const existing = await ctx.db
      .query("platform_settings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (!existing) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Module override not found" });
    }

    const now = Date.now();
    const oldPriceKes =
      typeof existing.value === "object" && existing.value !== null && typeof existing.value.priceKes === "number"
        ? existing.value.priceKes
        : 0;

    await ctx.db.delete(existing._id);

    await ctx.db.insert("module_price_history", {
      moduleId: args.moduleId,
      oldPriceKes,
      newPriceKes: 0,
      changedBy: platform.userId,
      changedAt: now,
      reason: "Platform pricing override removed",
      createdAt: now,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "settings.updated",
      entityType: "marketplace_module_override",
      entityId: args.moduleId,
      before: existing.value,
      after: { deleted: true },
    });

    return { success: true };
  },
});

export const getMarketplaceModulePricingHistory = query({
  args: {
    sessionToken: v.string(),
    moduleId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformRole(ctx, args, [
      "billing_admin",
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);

    const rows = args.moduleId
      ? await ctx.db
          .query("module_price_history")
          .withIndex("by_moduleId", (q) => q.eq("moduleId", args.moduleId!))
          .order("desc")
          .take(25)
      : await ctx.db
          .query("module_price_history")
          .withIndex("by_changedAt")
          .order("desc")
          .take(50);

    return rows;
  },
});

export const upsertFeatureFlag = mutation({
  args: {
    sessionToken: v.string(),
    key: v.string(),
    enabledGlobally: v.boolean(),
    enabledTenantIds: v.array(v.string()),
    rolloutPct: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);
    requireMasterAdmin(platform.role);

    const existing = await ctx.db
      .query("feature_flags")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        enabledGlobally: args.enabledGlobally,
        enabledTenantIds: args.enabledTenantIds,
        rolloutPct: args.rolloutPct,
        updatedBy: platform.userId,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("feature_flags", {
        key: args.key,
        enabledGlobally: args.enabledGlobally,
        enabledTenantIds: args.enabledTenantIds,
        rolloutPct: args.rolloutPct,
        updatedBy: platform.userId,
        updatedAt: now,
        createdAt: now,
      });
    }

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "feature_flag.updated",
      entityType: "feature_flag",
      entityId: args.key,
      after: {
        enabledGlobally: args.enabledGlobally,
        enabledTenantIds: args.enabledTenantIds,
        rolloutPct: args.rolloutPct,
      },
    });

    return { success: true };
  },
});

export const getMaintenanceWindows = query({
  args: {
    sessionToken: v.optional(v.string()),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.sessionToken) {
      await requirePlatformRole(ctx, { sessionToken: args.sessionToken }, [
        "platform_manager",
        "support_agent",
        "super_admin",
        "master_admin",
      ]);
    }

    let windows = await ctx.db.query("maintenance_windows").collect();
    if (args.activeOnly) {
      const now = Date.now();
      windows = windows.filter(
        (window) =>
          window.status !== "cancelled" &&
          window.startAt <= now &&
          window.endAt >= now
      );
    }

    return windows.sort((a, b) => a.startAt - b.startAt);
  },
});

export const createMaintenanceWindow = mutation({
  args: {
    sessionToken: v.string(),
    startAt: v.number(),
    endAt: v.number(),
    reason: v.string(),
    affectsTenants: v.array(v.string()),
    bypassIps: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "platform_manager",
      "support_agent",
      "super_admin",
      "master_admin",
    ]);
    requireMasterAdmin(platform.role);

    const now = Date.now();
    const id = await ctx.db.insert("maintenance_windows", {
      startAt: args.startAt,
      endAt: args.endAt,
      reason: args.reason,
      affectsTenants: args.affectsTenants,
      bypassIps: args.bypassIps,
      status: "scheduled",
      createdBy: platform.userId,
      createdAt: now,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "operations.maintenance_window_created",
      entityType: "maintenance_window",
      entityId: String(id),
      after: { startAt: args.startAt, endAt: args.endAt, reason: args.reason },
    });

    return { success: true, maintenanceWindowId: id };
  },
});

export const updateMaintenanceWindow = mutation({
  args: {
    sessionToken: v.string(),
    maintenanceWindowId: v.id("maintenance_windows"),
    startAt: v.optional(v.number()),
    endAt: v.optional(v.number()),
    reason: v.optional(v.string()),
    affectsTenants: v.optional(v.array(v.string())),
    bypassIps: v.optional(v.array(v.string())),
    status: v.optional(
      v.union(
        v.literal("scheduled"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("cancelled")
      )
    ),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "platform_manager",
      "support_agent",
      "super_admin",
      "master_admin",
    ]);
    requireMasterAdmin(platform.role);

    const { sessionToken, maintenanceWindowId, ...patch } = args;
    await ctx.db.patch(maintenanceWindowId, {
      ...patch,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "operations.maintenance_window_updated",
      entityType: "maintenance_window",
      entityId: String(maintenanceWindowId),
      after: patch,
    });

    return { success: true };
  },
});

export const getPlatformAnnouncements = query({
  args: {
    sessionToken: v.optional(v.string()),
    tenantPlan: v.optional(v.string()),
    tenantCountry: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.sessionToken) {
      await requirePlatformSession(ctx, { sessionToken: args.sessionToken });
    }

    const now = Date.now();
    let announcements = await ctx.db.query("platform_announcements").collect();

    if (!args.sessionToken) {
      announcements = announcements.filter(
        (announcement) =>
          announcement.status === "active" &&
          announcement.startsAt <= now &&
          (announcement.endsAt === undefined || announcement.endsAt >= now)
      );

      if (args.tenantPlan) {
        announcements = announcements.filter(
          (announcement) =>
            announcement.targetPlans.length === 0 || announcement.targetPlans.includes(args.tenantPlan!)
        );
      }

      if (args.tenantCountry) {
        announcements = announcements.filter(
          (announcement) =>
            announcement.targetCountries.length === 0 ||
            announcement.targetCountries.includes(args.tenantCountry!)
        );
      }
    }

    return announcements.sort((a, b) => b.startsAt - a.startsAt);
  },
});

export const getPlatformShellStatus = query({
  args: {
    sessionToken: v.string(),
    refreshNonce: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformRole(ctx, args, [
      "master_admin",
      "super_admin",
      "platform_manager",
      "support_agent",
      "billing_admin",
      "marketplace_reviewer",
      "content_moderator",
      "analytics_viewer",
    ]);

    const now = Date.now();
    const last24Hours = now - 24 * 60 * 60 * 1000;

    const [
      recentAuditLogs,
      activePlatformSessions,
      activeIncidents,
      activeSecurityIncidents,
      latestHealthRecord,
      pendingModuleRequests,
      activeModuleFlags,
    ] = await Promise.all([
      ctx.db
        .query("auditLogs")
        .filter((q) => q.gte(q.field("timestamp"), last24Hours))
        .collect(),
      ctx.db
        .query("sessions")
        .filter((q) =>
          q.and(
            q.eq(q.field("tenantId"), "PLATFORM"),
            q.gt(q.field("expiresAt"), now)
          )
        )
        .collect(),
      ctx.db
        .query("incidents")
        .filter((q) =>
          q.or(q.eq(q.field("status"), "active"), q.eq(q.field("status"), "investigating"))
        )
        .collect(),
      ctx.db
        .query("securityIncidents")
        .filter((q) =>
          q.or(
            q.eq(q.field("status"), "open"),
            q.eq(q.field("status"), "investigating"),
            q.eq(q.field("status"), "contained")
          )
        )
        .collect(),
      ctx.db
        .query("systemHealth")
        .withIndex("by_tenant", (q) => q.eq("tenantId", "PLATFORM"))
        .order("desc")
        .first(),
      ctx.db
        .query("module_requests")
        .withIndex("by_status", (q) => q.eq("status", "submitted"))
        .collect(),
      ctx.db
        .query("module_flags")
        .collect(),
    ]);

    const failedActions = recentAuditLogs.filter((log) =>
      ["fail", "error", "denied"].some((keyword) => log.action.toLowerCase().includes(keyword))
    ).length;
    const errorRate = recentAuditLogs.length > 0
      ? Number(((failedActions / recentAuditLogs.length) * 100).toFixed(1))
      : 0;

    const unresolvedFlags = activeModuleFlags.filter((flag) =>
      flag.status === "flagged" || flag.status === "under_investigation"
    );

    const derivedStatus =
      activeIncidents.length > 0 || activeSecurityIncidents.length > 0 || errorRate >= 8
        ? "critical"
        : errorRate >= 3
          ? "watch"
          : "healthy";

    const responseTime =
      latestHealthRecord?.services?.find((service) => service.name === "API Server")?.responseTime ??
      145;

    return {
      status: derivedStatus,
      errorRate,
      responseTime,
      activeSessions: activePlatformSessions.length,
      convexStatus: latestHealthRecord?.overall ?? "connected",
      lastChecked: latestHealthRecord?.lastChecked ?? now,
      pendingReviews: pendingModuleRequests.length,
      activeFlags: unresolvedFlags.length,
      refreshNonce: args.refreshNonce ?? 0,
    };
  },
});

export const createPlatformAnnouncement = mutation({
  args: {
    sessionToken: v.string(),
    title: v.string(),
    body: v.string(),
    targetPlans: v.array(v.string()),
    targetCountries: v.array(v.string()),
    channels: v.array(v.string()),
    isCritical: v.boolean(),
    startsAt: v.number(),
    endsAt: v.optional(v.number()),
    status: v.optional(
      v.union(v.literal("draft"), v.literal("scheduled"), v.literal("active"), v.literal("archived"))
    ),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);
    const now = Date.now();

    const id = await ctx.db.insert("platform_announcements", {
      title: args.title,
      body: args.body,
      targetPlans: args.targetPlans,
      targetCountries: args.targetCountries,
      channels: args.channels,
      isCritical: args.isCritical,
      startsAt: args.startsAt,
      endsAt: args.endsAt,
      createdBy: platform.userId,
      status: args.status ?? "draft",
      createdAt: now,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "platform_message.created",
      entityType: "platform_announcement",
      entityId: String(id),
      after: { title: args.title, status: args.status ?? "draft" },
    });

    return { success: true, announcementId: id };
  },
});

export const archivePlatformAnnouncement = mutation({
  args: {
    sessionToken: v.string(),
    announcementId: v.id("platform_announcements"),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);
    await ctx.db.patch(args.announcementId, {
      status: "archived",
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "platform_message.updated",
      entityType: "platform_announcement",
      entityId: String(args.announcementId),
      after: { status: "archived" },
    });

    return { success: true };
  },
});
