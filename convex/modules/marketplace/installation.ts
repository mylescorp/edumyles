import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "../../_generated/server";
import { requireTenantSession } from "../../helpers/tenantGuard";
import { requireRole } from "../../helpers/authorize";
import { logAction } from "../../helpers/auditLog";
import { publishEvent } from "../../eventBus";
import { calculateModulePrice } from "./pricing";
import { runModuleOnInstallSetup, runModuleOnUninstallCleanup } from "../moduleRuntime";
import { ModuleSlug } from "../moduleCatalog";

const BILLING_PERIOD_DAYS = {
  monthly: 30,
  termly: 90,
  quarterly: 90,
  annual: 365,
} as const;

const FREE_CORE_MODULE_SLUGS = ["core_sis", "core_users", "core_notifications"] as const;

async function getTenantPlan(ctx: any, tenantId: string) {
  const [organization, tenant] = await Promise.all([
    ctx.db.query("organizations").withIndex("by_tenant", (q: any) => q.eq("tenantId", tenantId)).first(),
    ctx.db.query("tenants").withIndex("by_tenantId", (q: any) => q.eq("tenantId", tenantId)).first(),
  ]);

  return organization?.tier ?? tenant?.plan ?? "free";
}

async function getModuleRecord(ctx: any, moduleSlug: string) {
  const moduleRecord = await ctx.db
    .query("marketplace_modules")
    .withIndex("by_slug", (q: any) => q.eq("slug", moduleSlug))
    .unique();

  if (!moduleRecord) {
    throw new ConvexError({
      code: "MODULE_NOT_FOUND",
      message: `Marketplace module '${moduleSlug}' was not found`,
    });
  }

  return moduleRecord;
}

async function getPricingRecord(ctx: any, moduleId: any) {
  return await ctx.db
    .query("module_pricing")
    .withIndex("by_moduleId", (q: any) => q.eq("moduleId", moduleId))
    .unique();
}

async function getStudentCount(ctx: any, tenantId: string) {
  const students = await ctx.db
    .query("students")
    .withIndex("by_tenant_status", (q: any) => q.eq("tenantId", tenantId).eq("status", "active"))
    .collect();
  return students.length;
}

async function getInstallRecord(ctx: any, tenantId: string, moduleSlug: string) {
  return await ctx.db
    .query("module_installs")
    .withIndex("by_tenantId_moduleSlug", (q: any) =>
      q.eq("tenantId", tenantId).eq("moduleSlug", moduleSlug)
    )
    .unique();
}

async function isIncludedInPlan(ctx: any, tenantId: string, moduleId: any) {
  const plan = await getTenantPlan(ctx, tenantId);
  const inclusion = await ctx.db
    .query("module_plan_inclusions")
    .withIndex("by_moduleId_plan", (q: any) => q.eq("moduleId", moduleId).eq("plan", plan))
    .unique();

  return Boolean(inclusion?.isIncluded);
}

async function getActivePilotGrant(ctx: any, tenantId: string, moduleId: any) {
  const grant = await ctx.db
    .query("pilot_grants")
    .withIndex("by_moduleId_tenantId", (q: any) =>
      q.eq("moduleId", moduleId).eq("tenantId", tenantId)
    )
    .unique();

  if (!grant || grant.status === "revoked" || grant.status === "expired") {
    return null;
  }

  if (grant.endDate && grant.endDate < Date.now()) {
    return null;
  }

  return grant;
}

async function createAdminNotification(ctx: any, args: { tenantId: string; userId: string; title: string; message: string; link?: string; }) {
  await ctx.db.insert("notifications", {
    tenantId: args.tenantId,
    userId: args.userId,
    title: args.title,
    message: args.message,
    type: "marketplace",
    isRead: false,
    link: args.link,
    createdAt: Date.now(),
  });
}

async function activateModuleInstall(
  ctx: any,
  args: {
    tenantId: string;
    userId: string;
    userEmail: string;
    moduleSlug: string;
    billingPeriod: "monthly" | "termly" | "quarterly" | "annual";
  }
) {
  const moduleRecord = await getModuleRecord(ctx, args.moduleSlug);
  const requirements = await computeInstallRequirements(ctx, {
    tenantId: args.tenantId,
    moduleSlug: args.moduleSlug,
    billingPeriod: args.billingPeriod,
  });
  if (!requirements.canInstall) {
    throw new ConvexError({
      code: "MODULE_INSTALL_BLOCKED",
      message: requirements.reason ?? "Module cannot be installed",
    });
  }

  const now = Date.now();
  const studentCount = await getStudentCount(ctx, args.tenantId);
  const pricing = (await getPricingRecord(ctx, moduleRecord._id)) ?? null;
  const pricingBreakdown =
    pricing && requirements.requiresPayment
      ? calculateModulePrice(pricing, studentCount, args.billingPeriod)
      : null;

  const existingInstall = await getInstallRecord(ctx, args.tenantId, args.moduleSlug);
  const installPayload = {
    moduleId: moduleRecord._id,
    moduleSlug: args.moduleSlug,
    tenantId: args.tenantId,
    status: "installing" as const,
    billingPeriod: args.billingPeriod,
    currentPriceKes: pricingBreakdown?.totalKes ?? 0,
    hasPriceOverride: false,
    isFree: !requirements.requiresPayment,
    firstInstalledAt: existingInstall?.firstInstalledAt ?? now,
    trialEndsAt: args.moduleSlug.startsWith("core_") ? undefined : now + 14 * 24 * 60 * 60 * 1000,
    billingStartsAt: now + BILLING_PERIOD_DAYS[args.billingPeriod] * 24 * 60 * 60 * 1000,
    nextBillingDate: now + BILLING_PERIOD_DAYS[args.billingPeriod] * 24 * 60 * 60 * 1000,
    version: moduleRecord.version,
    paymentFailureCount: 0,
    installedBy: args.userId,
    installedAt: now,
    createdAt: existingInstall?.createdAt ?? now,
    updatedAt: now,
  };

  const installId = existingInstall
    ? await (async () => {
        await ctx.db.patch(existingInstall._id, installPayload);
        return existingInstall._id;
      })()
    : await ctx.db.insert("module_installs", installPayload);

  if (!args.moduleSlug.startsWith("core_")) {
    await runModuleOnInstallSetup(ctx, {
      moduleSlug: args.moduleSlug as ModuleSlug,
      tenantId: args.tenantId,
      updatedBy: args.userId,
    });
  }

  await ctx.db.patch(installId, {
    status: "active",
    updatedAt: Date.now(),
  });

  await createAdminNotification(ctx, {
    tenantId: args.tenantId,
    userId: args.userId,
    title: `${moduleRecord.name} installed`,
    message: `${moduleRecord.name} is now active for your school.`,
    link: `/admin/settings/modules/${args.moduleSlug}`,
  });

  await publishEvent(ctx, {
    eventType: "module.installed",
    publisherModule: args.moduleSlug,
    tenantId: args.tenantId,
    payload: {
      moduleSlug: args.moduleSlug,
      installedBy: args.userId,
    },
  });

  await logAction(ctx, {
    tenantId: args.tenantId,
    actorId: args.userId,
    actorEmail: args.userEmail,
    action: "marketplace.module_installed",
    entityType: "marketplace_module",
    entityId: args.moduleSlug,
    after: {
      moduleSlug: args.moduleSlug,
      billingPeriod: args.billingPeriod,
      isFree: !requirements.requiresPayment,
    },
  });

  return {
    success: true,
    installId,
    moduleSlug: args.moduleSlug,
  };
}

async function computeInstallRequirements(
  ctx: any,
  args: { tenantId: string; moduleSlug: string; billingPeriod?: "monthly" | "termly" | "quarterly" | "annual" }
) {
  const moduleRecord = await getModuleRecord(ctx, args.moduleSlug);
  const existingInstall = await getInstallRecord(ctx, args.tenantId, args.moduleSlug);

  if (
    existingInstall &&
    existingInstall.status !== "uninstalled" &&
    existingInstall.status !== "data_purged"
  ) {
    return { canInstall: false, reason: "Module is already installed or pending activation." };
  }

  const pricing = await getPricingRecord(ctx, moduleRecord._id);
  const includedInPlan = await isIncludedInPlan(ctx, args.tenantId, moduleRecord._id);
  const activePilotGrant = await getActivePilotGrant(ctx, args.tenantId, moduleRecord._id);
  const studentCount = await getStudentCount(ctx, args.tenantId);
  const billingPeriod = args.billingPeriod ?? "monthly";

  if (
    !pricing ||
    moduleRecord.isCore ||
    includedInPlan ||
    activePilotGrant?.grantType === "free_trial" ||
    activePilotGrant?.grantType === "free_permanent"
  ) {
    return {
      canInstall: true,
      requiresPayment: false,
      includedInPlan,
      hasPilotGrant: Boolean(activePilotGrant),
    };
  }

  return {
    canInstall: true,
    requiresPayment: true,
    pricing: calculateModulePrice(pricing, studentCount, billingPeriod),
    studentCount,
  };
}

export const checkInstallRequirements = query({
  args: {
    sessionToken: v.string(),
    moduleSlug: v.string(),
    billingPeriod: v.optional(
      v.union(v.literal("monthly"), v.literal("termly"), v.literal("quarterly"), v.literal("annual"))
  ),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, args);
    return await computeInstallRequirements(ctx, {
      tenantId: tenant.tenantId,
      moduleSlug: args.moduleSlug,
      billingPeriod: args.billingPeriod,
    });
  },
});

export const installModule = mutation({
  args: {
    sessionToken: v.string(),
    moduleSlug: v.string(),
    billingPeriod: v.union(v.literal("monthly"), v.literal("termly"), v.literal("quarterly"), v.literal("annual")),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, args);
    requireRole(tenant, "school_admin", "principal", "master_admin", "super_admin");
    return await activateModuleInstall(ctx, {
      tenantId: tenant.tenantId,
      userId: tenant.userId,
      userEmail: tenant.email,
      moduleSlug: args.moduleSlug,
      billingPeriod: args.billingPeriod,
    });
  },
});

export const installAllFreeCoreModules = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, args);
    requireRole(tenant, "school_admin", "principal", "master_admin", "super_admin");

    const results = [];
    for (const moduleSlug of FREE_CORE_MODULE_SLUGS) {
      const existingInstall = await getInstallRecord(ctx, tenant.tenantId, moduleSlug);
      if (existingInstall?.status === "active") {
        results.push({ moduleSlug, status: "already_active" });
        continue;
      }

      await activateModuleInstall(ctx, {
        tenantId: tenant.tenantId,
        userId: tenant.userId,
        userEmail: tenant.email,
        moduleSlug,
        billingPeriod: "monthly",
      });
      results.push({ moduleSlug, status: "installed" });
    }

    return {
      success: true,
      results,
    };
  },
});

export const uninstallModule = mutation({
  args: {
    sessionToken: v.string(),
    moduleSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, args);
    requireRole(tenant, "school_admin", "master_admin", "super_admin");

    const install = await getInstallRecord(ctx, tenant.tenantId, args.moduleSlug);
    if (!install) {
      throw new ConvexError({
        code: "MODULE_NOT_INSTALLED",
        message: `Module '${args.moduleSlug}' is not installed`,
      });
    }

    if (!args.moduleSlug.startsWith("core_")) {
      await runModuleOnUninstallCleanup(ctx, {
        moduleSlug: args.moduleSlug as ModuleSlug,
        tenantId: tenant.tenantId,
      });
    }

    await ctx.db.patch(install._id, {
      status: "uninstalled",
      dataRetentionEndsAt: Date.now() + 90 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now(),
    });

    await publishEvent(ctx, {
      eventType: "module.uninstalled",
      publisherModule: args.moduleSlug,
      tenantId: tenant.tenantId,
      payload: {
        moduleSlug: args.moduleSlug,
        uninstalledBy: tenant.userId,
      },
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "marketplace.module_uninstalled",
      entityType: "marketplace_module",
      entityId: args.moduleSlug,
      after: {
        moduleSlug: args.moduleSlug,
        dataRetentionEndsAt: Date.now() + 90 * 24 * 60 * 60 * 1000,
      },
    });

    return { success: true };
  },
});

export const reinstallModule = mutation({
  args: {
    sessionToken: v.string(),
    moduleSlug: v.string(),
    restoreData: v.boolean(),
    billingPeriod: v.union(v.literal("monthly"), v.literal("termly"), v.literal("quarterly"), v.literal("annual")),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, args);
    requireRole(tenant, "school_admin", "master_admin", "super_admin");

    const install = await getInstallRecord(ctx, tenant.tenantId, args.moduleSlug);
    if (!install) {
      throw new ConvexError({
        code: "MODULE_NOT_FOUND",
        message: "No previous install record exists for this module",
      });
    }

    if (install.status === "data_purged") {
      throw new ConvexError({
        code: "MODULE_DATA_PURGED",
        message: "This module's retained data has already been purged",
      });
    }

    if (!args.restoreData) {
      await ctx.db.patch(install._id, {
        dataRetentionEndsAt: Date.now(),
      });
    }

    await ctx.db.patch(install._id, {
      status: "active",
      billingPeriod: args.billingPeriod,
      updatedAt: Date.now(),
    });

    if (!args.moduleSlug.startsWith("core_")) {
      await runModuleOnInstallSetup(ctx, {
        moduleSlug: args.moduleSlug as ModuleSlug,
        tenantId: tenant.tenantId,
        updatedBy: tenant.userId,
      });
    }

    return { success: true, restoredData: args.restoreData };
  },
});

export const disableModule = mutation({
  args: {
    sessionToken: v.string(),
    moduleSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, args);
    requireRole(tenant, "school_admin", "master_admin", "super_admin");
    const install = await getInstallRecord(ctx, tenant.tenantId, args.moduleSlug);
    if (!install) throw new ConvexError({ code: "MODULE_NOT_INSTALLED", message: "Module is not installed" });

    await ctx.db.patch(install._id, {
      status: "disabled",
      disabledAt: Date.now(),
      disabledBy: tenant.userId,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const enableModule = mutation({
  args: {
    sessionToken: v.string(),
    moduleSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, args);
    requireRole(tenant, "school_admin", "master_admin", "super_admin");
    const install = await getInstallRecord(ctx, tenant.tenantId, args.moduleSlug);
    if (!install) throw new ConvexError({ code: "MODULE_NOT_INSTALLED", message: "Module is not installed" });

    await ctx.db.patch(install._id, {
      status: "active",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const purgeExpiredModuleData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const installs = await ctx.db
      .query("module_installs")
      .withIndex("by_status", (q) => q.eq("status", "uninstalled"))
      .collect();

    const expired = installs.filter(
      (install) => install.dataRetentionEndsAt !== undefined && install.dataRetentionEndsAt < Date.now()
    );

    for (const install of expired) {
      const accessConfigs = await ctx.db
        .query("module_access_config")
        .withIndex("by_tenantId", (q) => q.eq("tenantId", install.tenantId))
        .collect();
      for (const config of accessConfigs.filter((entry) => entry.moduleSlug === install.moduleSlug)) {
        await ctx.db.delete(config._id);
      }

      const notificationSettings = await ctx.db
        .query("module_notification_settings")
        .withIndex("by_tenantId_moduleSlug", (q) =>
          q.eq("tenantId", install.tenantId).eq("moduleSlug", install.moduleSlug ?? "")
        )
        .collect();
      for (const setting of notificationSettings) {
        await ctx.db.delete(setting._id);
      }

      const subscriptions = await ctx.db
        .query("module_event_subscriptions")
        .withIndex("by_subscriberModule_tenantId", (q) =>
          q.eq("subscriberModule", install.moduleSlug ?? "").eq("tenantId", install.tenantId)
        )
        .collect();
      for (const subscription of subscriptions) {
        await ctx.db.delete(subscription._id);
      }

      await ctx.db.patch(install._id, {
        status: "data_purged",
        updatedAt: Date.now(),
      });
    }

    return { purgedCount: expired.length };
  },
});
