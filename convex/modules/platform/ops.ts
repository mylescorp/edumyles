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
