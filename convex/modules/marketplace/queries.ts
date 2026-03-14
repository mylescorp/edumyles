import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requireRole } from "../../helpers/authorize";
import { TIER_MODULES } from "./tierModules";

/**
 * List all modules in the registry (public catalog).
 * Only returns active/beta modules. Requires authentication.
 */
export const getModuleRegistry = query({
  args: {},
  handler: async (ctx) => {
    await requireTenantContext(ctx);

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
 * Get all installed modules for the caller's tenant.
 * TenantId is derived from the session — never from client args.
 */
export const getInstalledModules = query({
  args: {},
  handler: async (ctx) => {
    const { tenantId } = await requireTenantContext(ctx);

    return await ctx.db
      .query("installedModules")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .collect();
  },
});

/**
 * Get modules available for the caller's subscription tier.
 * Returns registry modules annotated with tier availability.
 */
export const getAvailableForTier = query({
  args: {},
  handler: async (ctx) => {
    const { tenantId } = await requireTenantContext(ctx);

    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenantId))
      .first();

    if (!tenant) {
      throw new Error("TENANT_NOT_FOUND");
    }

    const tier = tenant.plan ?? "free";
    const allowedModuleIds = TIER_MODULES[tier] || TIER_MODULES["free"];

    console.log("getAvailableForTier:", {
      tenantId,
      tier,
      allowedModuleIds,
      hasTier: !!TIER_MODULES[tier]
    });

    const allModules = await ctx.db.query("moduleRegistry").collect();

    return allModules.map((mod) => ({
      ...mod,
      availableForTier: allowedModuleIds!.includes(mod.moduleId),
    }));
  },
});

/**
 * Get details for a single module including install status.
 * TenantId is derived from the session.
 */
export const getModuleDetails = query({
  args: { moduleId: v.string() },
  handler: async (ctx, args) => {
    const { tenantId } = await requireTenantContext(ctx);

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
        q.eq("tenantId", tenantId).eq("moduleId", args.moduleId)
      )
      .first();

    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenantId))
      .first();

    const org = await ctx.db
      .query("organizations")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .first();

    const tier = org?.tier ?? tenant?.plan ?? "free";
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
      availableForTier: allowedModuleIds!.includes(args.moduleId),
      currentTier: tier,
    };
  },
});

/**
 * Get module access requests for the caller's tenant.
 * Only school_admin / master_admin / super_admin can view requests.
 */
export const getModuleRequests = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const tenantCtx = await requireTenantContext(ctx);
    requireRole(tenantCtx, "school_admin", "master_admin", "super_admin");

    const { tenantId } = tenantCtx;

    if (args.status) {
      return await ctx.db
        .query("moduleRequests")
        .withIndex("by_tenant_status", (q) =>
          q.eq("tenantId", tenantId).eq("status", args.status!)
        )
        .collect();
    }

    return await ctx.db
      .query("moduleRequests")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .collect();
  },
});
