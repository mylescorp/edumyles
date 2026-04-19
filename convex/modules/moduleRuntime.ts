import { ConvexError, v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { ModuleSlug, getModuleSpec } from "./moduleCatalog";

async function getMarketplaceModuleBySlug(ctx: any, moduleSlug: ModuleSlug) {
  const moduleRecord = await ctx.db
    .query("marketplace_modules")
    .withIndex("by_slug", (q: any) => q.eq("slug", moduleSlug))
    .unique();

  if (!moduleRecord) {
    throw new ConvexError({
      code: "MARKETPLACE_MODULE_MISSING",
      message: `Marketplace module '${moduleSlug}' is not seeded`,
    });
  }

  return moduleRecord;
}

async function upsertModuleAccessConfig(
  ctx: any,
  args: { moduleSlug: ModuleSlug; tenantId: string; updatedBy: string }
) {
  const moduleRecord = await getMarketplaceModuleBySlug(ctx, args.moduleSlug);
  const spec = getModuleSpec(args.moduleSlug);
  const existing = await ctx.db
    .query("module_access_config")
    .withIndex("by_tenantId_moduleId", (q: any) =>
      q.eq("tenantId", args.tenantId).eq("moduleId", moduleRecord._id)
    )
    .unique();

  const payload = {
    moduleId: moduleRecord._id,
    moduleSlug: args.moduleSlug,
    tenantId: args.tenantId,
    roleAccess: spec.defaultRoleAccess,
    config: JSON.stringify(spec.configSchema),
    updatedBy: args.updatedBy,
    updatedAt: Date.now(),
  };

  if (existing) {
    await ctx.db.patch(existing._id, payload);
    return existing._id;
  }

  return await ctx.db.insert("module_access_config", payload);
}

async function upsertModuleNotificationSettings(
  ctx: any,
  args: { moduleSlug: ModuleSlug; tenantId: string; updatedBy: string }
) {
  const spec = getModuleSpec(args.moduleSlug);
  const existing = await ctx.db
    .query("module_notification_settings")
    .withIndex("by_tenantId_moduleSlug", (q: any) =>
      q.eq("tenantId", args.tenantId).eq("moduleSlug", args.moduleSlug)
    )
    .unique();

  const notifications = spec.notifications.map((notification) => ({
    key: notification.key,
    enabled: true,
    channels: notification.defaultChannels,
    frequencyDays: notification.hasFrequency ? 1 : undefined,
    quietHoursStart: undefined,
    quietHoursEnd: undefined,
  }));

  const payload = {
    moduleSlug: args.moduleSlug,
    tenantId: args.tenantId,
    notifications,
    updatedBy: args.updatedBy,
    updatedAt: Date.now(),
  };

  if (existing) {
    await ctx.db.patch(existing._id, payload);
    return existing._id;
  }

  return await ctx.db.insert("module_notification_settings", payload);
}

async function syncModuleEventSubscriptions(
  ctx: any,
  args: { moduleSlug: ModuleSlug; tenantId: string }
) {
  const spec = getModuleSpec(args.moduleSlug);
  const existing = await ctx.db
    .query("module_event_subscriptions")
    .withIndex("by_subscriberModule_tenantId", (q: any) =>
      q.eq("subscriberModule", args.moduleSlug).eq("tenantId", args.tenantId)
    )
    .collect();

  const existingByKey = new Map(
    existing.map((subscription: any) => [
      `${subscription.eventType}:${subscription.handlerFunctionName}`,
      subscription,
    ])
  );
  const expectedKeys = new Set<string>();

  for (const subscription of spec.subscriptions) {
    const key = `${subscription.eventType}:${subscription.handlerFunctionName}`;
    expectedKeys.add(key);
    const match: any = existingByKey.get(key);

    if (match) {
      await ctx.db.patch(match._id, { isActive: true });
      continue;
    }

    await ctx.db.insert("module_event_subscriptions", {
      eventType: subscription.eventType,
      subscriberModule: args.moduleSlug,
      tenantId: args.tenantId,
      handlerFunctionName: subscription.handlerFunctionName,
      isActive: true,
      createdAt: Date.now(),
    });
  }

  for (const stale of existing) {
    const key = `${stale.eventType}:${stale.handlerFunctionName}`;
    if (!expectedKeys.has(key)) {
      await ctx.db.patch(stale._id, { isActive: false });
    }
  }
}

async function seedModuleSpecificDefaults(ctx: any, moduleSlug: ModuleSlug, tenantId: string) {
  if (moduleSlug === "mod_attendance") {
    const config = {
      schoolStartTime: "08:00",
      lateThresholdMinutes: 15,
      markingMethod: "period",
    };
    const existing = await ctx.db
      .query("module_access_config")
      .withIndex("by_tenantId", (q: any) => q.eq("tenantId", tenantId))
      .collect();
    const match = existing.find((entry: any) => entry.moduleSlug === moduleSlug);
    if (match) {
      await ctx.db.patch(match._id, {
        config: JSON.stringify({
          ...JSON.parse(match.config),
          defaults: config,
        }),
        updatedAt: Date.now(),
      });
    }
  }

  if (moduleSlug === "mod_library") {
    const config = {
      maxBooksPerStudent: 3,
      borrowingPeriodDays: 14,
      finePerDayKes: 5,
    };
    const existing = await ctx.db
      .query("module_access_config")
      .withIndex("by_tenantId", (q: any) => q.eq("tenantId", tenantId))
      .collect();
    const match = existing.find((entry: any) => entry.moduleSlug === moduleSlug);
    if (match) {
      await ctx.db.patch(match._id, {
        config: JSON.stringify({
          ...JSON.parse(match.config),
          defaults: config,
        }),
        updatedAt: Date.now(),
      });
    }
  }
}

export async function runModuleOnInstallSetup(
  ctx: any,
  args: { moduleSlug: ModuleSlug; tenantId: string; updatedBy?: string }
) {
  const updatedBy = args.updatedBy ?? "system";
  await upsertModuleAccessConfig(ctx, {
    moduleSlug: args.moduleSlug,
    tenantId: args.tenantId,
    updatedBy,
  });
  await syncModuleEventSubscriptions(ctx, {
    moduleSlug: args.moduleSlug,
    tenantId: args.tenantId,
  });
  await upsertModuleNotificationSettings(ctx, {
    moduleSlug: args.moduleSlug,
    tenantId: args.tenantId,
    updatedBy,
  });
  await seedModuleSpecificDefaults(ctx, args.moduleSlug, args.tenantId);

  return { ok: true, moduleSlug: args.moduleSlug, tenantId: args.tenantId };
}

export async function runModuleOnUninstallCleanup(
  ctx: any,
  args: { moduleSlug: ModuleSlug; tenantId: string }
) {
  const subscriptions = await ctx.db
    .query("module_event_subscriptions")
    .withIndex("by_subscriberModule_tenantId", (q: any) =>
      q.eq("subscriberModule", args.moduleSlug).eq("tenantId", args.tenantId)
    )
    .collect();

  for (const subscription of subscriptions) {
    await ctx.db.patch(subscription._id, {
      isActive: false,
    });
  }

  return { ok: true, moduleSlug: args.moduleSlug, tenantId: args.tenantId };
}

export function defineModuleOnInstall(moduleSlug: ModuleSlug) {
  return internalMutation({
    args: {
      tenantId: v.string(),
      updatedBy: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
      return await runModuleOnInstallSetup(ctx, {
        moduleSlug,
        tenantId: args.tenantId,
        updatedBy: args.updatedBy,
      });
    },
  });
}

export function defineModuleOnUninstall(moduleSlug: ModuleSlug) {
  return internalMutation({
    args: {
      tenantId: v.string(),
    },
    handler: async (ctx, args) => {
      return await runModuleOnUninstallCleanup(ctx, {
        moduleSlug,
        tenantId: args.tenantId,
      });
    },
  });
}

export function defineModuleEventHandler(moduleSlug: ModuleSlug, handlerName: string) {
  return internalMutation({
    args: {
      eventId: v.id("module_events"),
      eventType: v.string(),
      tenantId: v.string(),
      payload: v.string(),
      correlationId: v.optional(v.string()),
      causationId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
      await ctx.db.insert("admin_task_queue", {
        tenantId: args.tenantId,
        type: "module_event_handler",
        requestedBy: "system",
        requestedByRole: "system",
        moduleSlug,
        moduleName: `${moduleSlug}:${handlerName}`,
        reason: `Processed ${args.eventType} via ${handlerName}`,
        status: "pending",
        createdAt: Date.now(),
      });

      return {
        ok: true,
        moduleSlug,
        handlerName,
        eventId: args.eventId,
      };
    },
  });
}
