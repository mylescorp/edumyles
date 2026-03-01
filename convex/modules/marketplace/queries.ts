import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requireTenantContext } from "../../helpers/tenantGuard";

/**
 * List all modules in the registry (public catalog).
 * Only returns active/beta modules.
 */
export const getModuleRegistry = query({
  args: {},
  handler: async (ctx) => {
    const modules = await ctx.db
      .query("moduleRegistry")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const betaModules = await ctx.db
      .query("moduleRegistry")
      .withIndex("by_status", (q) => q.eq("status", "beta"))
      .collect();

    return [...modules, ...betaModules];
  },
});

/**
 * Get all installed modules for the current tenant.
 */
export const getInstalledModules = query({
  args: { tenantId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("installedModules")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
  },
});

/**
 * Get modules available for the tenant's subscription tier.
 * Returns registry modules filtered by tier access.
 */
export const getAvailableForTier = query({
  args: { tenantId: v.string() },
  handler: async (ctx, args) => {
    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .first();

    if (!tenant) {
      throw new Error("TENANT_NOT_FOUND");
    }

    // Also check organization tier
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .first();

    const tier = org?.tier ?? tenant.plan ?? "free";

    const TIER_MODULES: Record<string, string[]> = {
      free: ["sis", "communications"],
      starter: ["sis", "admissions", "finance", "communications"],
      standard: [
        "sis",
        "admissions",
        "finance",
        "timetable",
        "academics",
        "communications",
      ],
      growth: [
        "sis",
        "admissions",
        "finance",
        "timetable",
        "academics",
        "communications",
      ],
      pro: [
        "sis",
        "admissions",
        "finance",
        "timetable",
        "academics",
        "hr",
        "library",
        "transport",
        "communications",
      ],
      enterprise: [
        "sis",
        "admissions",
        "finance",
        "timetable",
        "academics",
        "hr",
        "library",
        "transport",
        "communications",
        "ewallet",
        "ecommerce",
      ],
    };

    const allowedModuleIds = TIER_MODULES[tier] ?? TIER_MODULES["free"];

    // Get all registry modules
    const allModules = await ctx.db.query("moduleRegistry").collect();

    return allModules.map((mod) => ({
      ...mod,
      availableForTier: allowedModuleIds.includes(mod.moduleId),
    }));
  },
});

/**
 * Get details for a single module including install status.
 */
export const getModuleDetails = query({
  args: { tenantId: v.string(), moduleId: v.string() },
  handler: async (ctx, args) => {
    const registryModule = await ctx.db
      .query("moduleRegistry")
      .withIndex("by_module_id", (q) => q.eq("moduleId", args.moduleId))
      .first();

    if (!registryModule) {
      throw new Error("MODULE_NOT_FOUND");
    }

    const installed = await ctx.db
      .query("installedModules")
      .withIndex("by_tenant_module", (q) =>
        q.eq("tenantId", args.tenantId).eq("moduleId", args.moduleId)
      )
      .first();

    // Check tier access
    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .first();

    const org = await ctx.db
      .query("organizations")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .first();

    const tier = org?.tier ?? tenant?.plan ?? "free";

    const TIER_MODULES: Record<string, string[]> = {
      free: ["sis", "communications"],
      starter: ["sis", "admissions", "finance", "communications"],
      standard: [
        "sis",
        "admissions",
        "finance",
        "timetable",
        "academics",
        "communications",
      ],
      growth: [
        "sis",
        "admissions",
        "finance",
        "timetable",
        "academics",
        "communications",
      ],
      pro: [
        "sis",
        "admissions",
        "finance",
        "timetable",
        "academics",
        "hr",
        "library",
        "transport",
        "communications",
      ],
      enterprise: [
        "sis",
        "admissions",
        "finance",
        "timetable",
        "academics",
        "hr",
        "library",
        "transport",
        "communications",
        "ewallet",
        "ecommerce",
      ],
    };

    const allowedModuleIds = TIER_MODULES[tier] ?? TIER_MODULES["free"];

    return {
      ...registryModule,
      installed: installed
        ? {
            status: installed.status,
            installedAt: installed.installedAt,
            installedBy: installed.installedBy,
            config: installed.config,
          }
        : null,
      availableForTier: allowedModuleIds.includes(args.moduleId),
      currentTier: tier,
    };
  },
});

/**
 * Get module access requests for the current tenant.
 */
export const getModuleRequests = query({
  args: { tenantId: v.string(), status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("moduleRequests")
        .withIndex("by_tenant_status", (q) =>
          q.eq("tenantId", args.tenantId).eq("status", args.status!)
        )
        .collect();
    }

    return await ctx.db
      .query("moduleRequests")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
  },
});
