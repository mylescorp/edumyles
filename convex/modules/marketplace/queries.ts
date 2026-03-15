import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requireTenantSession } from "../../helpers/tenantGuard";
import { requireRole } from "../../helpers/authorize";
import { TIER_MODULES } from "./tierModules";
import { CORE_MODULE_IDS, ALL_MODULES } from "./moduleDefinitions";

// ── Helpers ────────────────────────────────────────────────────────────────

function buildFallbackModules(allowedModuleIds: string[]) {
  return ALL_MODULES.map((mod) => ({
    _id: mod.moduleId as any,
    _creationTime: 0,
    moduleId: mod.moduleId,
    name: mod.name,
    description: mod.description,
    tier: mod.tier,
    category: mod.category,
    isCore: mod.isCore,
    iconName: mod.iconName,
    version: mod.version,
    features: mod.features,
    dependencies: mod.dependencies,
    documentation: mod.documentation,
    pricing: mod.pricing,
    support: mod.support,
    status: "published" as const,
    availableForTier:
      CORE_MODULE_IDS.includes(mod.moduleId) ||
      allowedModuleIds.includes(mod.moduleId),
  }));
}

// ── Queries ────────────────────────────────────────────────────────────────

export const getModuleRegistry = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requireTenantSession(ctx, args);

    const modules = await ctx.db
      .query("moduleRegistry")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    if (modules.length === 0) {
      return ALL_MODULES.map((mod) => ({
        _id: mod.moduleId as any,
        _creationTime: 0,
        moduleId: mod.moduleId,
        name: mod.name,
        description: mod.description,
        tier: mod.tier,
        category: mod.category,
        isCore: mod.isCore,
        iconName: mod.iconName,
        version: mod.version,
        features: mod.features,
        dependencies: mod.dependencies,
        documentation: mod.documentation,
        pricing: mod.pricing,
        support: mod.support,
        status: "published" as const,
      }));
    }

    return modules;
  },
});

export const getInstalledModules = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const { tenantId } = await requireTenantSession(ctx, args);

    return await ctx.db
      .query("installedModules")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .collect();
  },
});

export const getInstalledModuleIds = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const { tenantId } = await requireTenantSession(ctx, args);

    const installed = await ctx.db
      .query("installedModules")
      .withIndex("by_tenant_status", (q) =>
        q.eq("tenantId", tenantId).eq("status", "active")
      )
      .collect();

    const installedIds = installed.map((m) => m.moduleId);
    const allIds = new Set([...CORE_MODULE_IDS, ...installedIds]);
    return Array.from(allIds);
  },
});

export const getAvailableForTier = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const { tenantId } = await requireTenantSession(ctx, args);

    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenantId))
      .first();

    const tier = tenant?.plan ?? "free";
    const allowedModuleIds = TIER_MODULES[tier] || TIER_MODULES["free"]!;

    const dbModules = await ctx.db.query("moduleRegistry").collect();

    if (dbModules.length === 0) {
      return buildFallbackModules(allowedModuleIds);
    }

    return dbModules.map((mod) => ({
      ...mod,
      isCore: mod.isCore ?? CORE_MODULE_IDS.includes(mod.moduleId),
      availableForTier:
        CORE_MODULE_IDS.includes(mod.moduleId) ||
        allowedModuleIds.includes(mod.moduleId),
    }));
  },
});

export const getModuleDetails = query({
  args: { sessionToken: v.string(), moduleId: v.string() },
  handler: async (ctx, args) => {
    const { tenantId } = await requireTenantSession(ctx, args);

    const registryModule =
      (await ctx.db
        .query("moduleRegistry")
        .withIndex("by_module_id", (q) => q.eq("moduleId", args.moduleId))
        .first()) ??
      (ALL_MODULES.find((m) => m.moduleId === args.moduleId) as any ?? null);

    if (!registryModule) throw new Error("MODULE_NOT_FOUND");

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

    const tier = tenant?.plan ?? "free";
    const allowedModuleIds = TIER_MODULES[tier] ?? TIER_MODULES["free"]!;

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

export const getModuleRequests = query({
  args: { sessionToken: v.string(), status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const tenantCtx = await requireTenantSession(ctx, args);
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
