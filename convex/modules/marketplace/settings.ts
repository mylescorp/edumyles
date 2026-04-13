import { ConvexError, v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { requireTenantSession } from "../../helpers/tenantGuard";
import { requireRole } from "../../helpers/authorize";
import { logAction } from "../../helpers/auditLog";
import { getInstalledModules as getGuardInstalledModules } from "../../helpers/moduleGuard";
import { MODULE_SPECS } from "../moduleCatalog";

async function getMarketplaceModule(ctx: any, moduleSlug: string) {
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

async function getTenantPlan(ctx: any, tenantId: string) {
  const [organization, tenant] = await Promise.all([
    ctx.db
      .query("organizations")
      .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenantId))
      .first(),
    ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q: any) => q.eq("tenantId", tenantId))
      .first(),
  ]);

  return organization?.tier ?? tenant?.plan ?? "free";
}

function parseStoredConfig(config: string | undefined) {
  if (!config) return {};
  try {
    return JSON.parse(config);
  } catch {
    return {};
  }
}

export const getMarketplaceModules = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, args);
    const [modules, installs, plan] = await Promise.all([
      ctx.db
        .query("marketplace_modules")
        .withIndex("by_status", (q: any) => q.eq("status", "published"))
        .collect(),
      getGuardInstalledModules(ctx, tenant.tenantId),
      getTenantPlan(ctx, tenant.tenantId),
    ]);

    return modules.map((moduleRecord: any) => {
      const install =
        installs.find((entry: any) => entry.moduleSlug === moduleRecord.slug) ?? null;
      return {
        ...moduleRecord,
        installed: install,
        state: install?.status ?? "not_installed",
        plan,
      };
    });
  },
});

export const getInstalledModulesForTenant = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, args);
    return await getGuardInstalledModules(ctx, tenant.tenantId);
  },
});

export const getModuleDetail = query({
  args: {
    sessionToken: v.string(),
    moduleSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, args);
    const moduleRecord = await getMarketplaceModule(ctx, args.moduleSlug);
    const moduleSpec = MODULE_SPECS[args.moduleSlug as keyof typeof MODULE_SPECS];
    const [install, pricing, reviews, versions] = await Promise.all([
      ctx.db
        .query("module_installs")
        .withIndex("by_tenantId_moduleSlug", (q: any) =>
          q.eq("tenantId", tenant.tenantId).eq("moduleSlug", args.moduleSlug)
        )
        .unique(),
      ctx.db
        .query("module_pricing")
        .withIndex("by_moduleId", (q: any) => q.eq("moduleId", moduleRecord._id))
        .unique(),
      ctx.db
        .query("module_reviews")
        .withIndex("by_moduleId_status", (q: any) =>
          q.eq("moduleId", moduleRecord._id).eq("status", "approved")
        )
        .collect(),
      ctx.db
        .query("module_versions")
        .withIndex("by_moduleId", (q: any) => q.eq("moduleId", moduleRecord._id))
        .collect(),
    ]);

    return {
      ...moduleRecord,
      install,
      pricing,
      reviews,
      versions,
      features: moduleSpec ? Object.values(moduleSpec.features) : [],
      configSchema: moduleSpec?.configSchema ?? null,
      notificationsCatalog: moduleSpec?.notifications ?? [],
      navConfig: moduleSpec?.navConfig ?? null,
    };
  },
});

export const getModuleAccessConfig = query({
  args: {
    sessionToken: v.string(),
    moduleSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, args);
    const moduleRecord = await getMarketplaceModule(ctx, args.moduleSlug);
    const config = await ctx.db
      .query("module_access_config")
      .withIndex("by_tenantId_moduleId", (q: any) =>
        q.eq("tenantId", tenant.tenantId).eq("moduleId", moduleRecord._id)
      )
      .unique();

    return config
      ? {
          ...config,
          parsedConfig: parseStoredConfig(config.config),
        }
      : null;
  },
});

export const updateModuleAccessConfig = mutation({
  args: {
    sessionToken: v.string(),
    moduleSlug: v.string(),
    roleAccess: v.array(
      v.object({
        role: v.string(),
        accessLevel: v.union(
          v.literal("full"),
          v.literal("read_only"),
          v.literal("restricted"),
          v.literal("none")
        ),
        allowedFeatures: v.array(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, args);
    requireRole(tenant, "school_admin", "principal", "master_admin", "super_admin");
    const moduleRecord = await getMarketplaceModule(ctx, args.moduleSlug);
    const existing = await ctx.db
      .query("module_access_config")
      .withIndex("by_tenantId_moduleId", (q: any) =>
        q.eq("tenantId", tenant.tenantId).eq("moduleId", moduleRecord._id)
      )
      .unique();

    if (!existing) {
      throw new ConvexError({
        code: "MODULE_ACCESS_CONFIG_MISSING",
        message: "Module access configuration does not exist yet",
      });
    }

    await ctx.db.patch(existing._id, {
      roleAccess: args.roleAccess,
      updatedBy: tenant.userId,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "module.config_updated",
      entityType: "module_access_config",
      entityId: String(existing._id),
      after: { moduleSlug: args.moduleSlug, roleAccess: args.roleAccess },
    });

    return { success: true };
  },
});

export const getModuleConfig = query({
  args: {
    sessionToken: v.string(),
    moduleSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, args);
    const moduleRecord = await getMarketplaceModule(ctx, args.moduleSlug);
    const config = await ctx.db
      .query("module_access_config")
      .withIndex("by_tenantId_moduleId", (q: any) =>
        q.eq("tenantId", tenant.tenantId).eq("moduleId", moduleRecord._id)
      )
      .unique();

    return parseStoredConfig(config?.config);
  },
});

export const updateModuleConfig = mutation({
  args: {
    sessionToken: v.string(),
    moduleSlug: v.string(),
    config: v.any(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, args);
    requireRole(tenant, "school_admin", "principal", "master_admin", "super_admin");
    const moduleRecord = await getMarketplaceModule(ctx, args.moduleSlug);
    const existing = await ctx.db
      .query("module_access_config")
      .withIndex("by_tenantId_moduleId", (q: any) =>
        q.eq("tenantId", tenant.tenantId).eq("moduleId", moduleRecord._id)
      )
      .unique();

    if (!existing) {
      throw new ConvexError({
        code: "MODULE_CONFIG_MISSING",
        message: "Module configuration does not exist yet",
      });
    }

    await ctx.db.patch(existing._id, {
      config: JSON.stringify(args.config ?? {}),
      updatedBy: tenant.userId,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const getModuleNotificationSettings = query({
  args: {
    sessionToken: v.string(),
    moduleSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, args);
    return await ctx.db
      .query("module_notification_settings")
      .withIndex("by_tenantId_moduleSlug", (q: any) =>
        q.eq("tenantId", tenant.tenantId).eq("moduleSlug", args.moduleSlug)
      )
      .unique();
  },
});

export const updateModuleNotificationSettings = mutation({
  args: {
    sessionToken: v.string(),
    moduleSlug: v.string(),
    notifications: v.array(
      v.object({
        key: v.string(),
        enabled: v.boolean(),
        channels: v.array(v.string()),
        frequencyDays: v.optional(v.number()),
        quietHoursStart: v.optional(v.string()),
        quietHoursEnd: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, args);
    requireRole(tenant, "school_admin", "principal", "master_admin", "super_admin");
    const existing = await ctx.db
      .query("module_notification_settings")
      .withIndex("by_tenantId_moduleSlug", (q: any) =>
        q.eq("tenantId", tenant.tenantId).eq("moduleSlug", args.moduleSlug)
      )
      .unique();

    if (!existing) {
      throw new ConvexError({
        code: "MODULE_NOTIFICATION_SETTINGS_MISSING",
        message: "Module notification settings do not exist yet",
      });
    }

    await ctx.db.patch(existing._id, {
      notifications: args.notifications,
      updatedBy: tenant.userId,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const getModuleBillingInfo = query({
  args: {
    sessionToken: v.string(),
    moduleSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, args);
    const install = await ctx.db
      .query("module_installs")
      .withIndex("by_tenantId_moduleSlug", (q: any) =>
        q.eq("tenantId", tenant.tenantId).eq("moduleSlug", args.moduleSlug)
      )
      .unique();

    if (!install) {
      return null;
    }

    const invoices = await ctx.db
      .query("subscription_invoices")
      .withIndex("by_tenantId", (q: any) => q.eq("tenantId", tenant.tenantId))
      .collect();

    const relatedInvoices = invoices.filter(
      (invoice: any) => invoice.metadata?.moduleSlug === args.moduleSlug
    );

    return {
      install,
      invoices: relatedInvoices.slice(-12).reverse(),
    };
  },
});

export const getModuleAccessStatus = query({
  args: {
    sessionToken: v.string(),
    moduleSlug: v.string(),
    userRole: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, args);
    const moduleRecord = await getMarketplaceModule(ctx, args.moduleSlug);
    const install = await ctx.db
      .query("module_installs")
      .withIndex("by_tenantId_moduleSlug", (q: any) =>
        q.eq("tenantId", tenant.tenantId).eq("moduleSlug", args.moduleSlug)
      )
      .unique();

    if (!install) {
      return {
        isInstalled: false,
        hasAccess: false,
        accessLevel: "none",
        installStatus: "not_installed",
        reason: "Module is not installed for this school.",
      };
    }

    if (install.status !== "active") {
      return {
        isInstalled: true,
        hasAccess: false,
        accessLevel: "none",
        installStatus: install.status,
        reason: "Module is currently unavailable.",
      };
    }

    const config = await ctx.db
      .query("module_access_config")
      .withIndex("by_tenantId_moduleId", (q: any) =>
        q.eq("tenantId", tenant.tenantId).eq("moduleId", moduleRecord._id)
      )
      .unique();

    const userRole = args.userRole ?? tenant.role;
    const roleAccess = config?.roleAccess?.find((entry: any) => entry.role === userRole);
    const accessLevel = roleAccess?.accessLevel ?? (userRole === "school_admin" ? "full" : "none");

    return {
      isInstalled: true,
      hasAccess: accessLevel !== "none",
      accessLevel,
      installStatus: install.status,
      reason:
        accessLevel === "none"
          ? "Your role does not have access to this module."
          : "Access granted.",
    };
  },
});
