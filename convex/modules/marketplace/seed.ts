import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { requireTenantSession } from "../../helpers/tenantGuard";
import { ALL_MODULES, CORE_MODULE_IDS } from "./moduleDefinitions";

/**
 * Seed the moduleRegistry with all module definitions.
 * Platform admin only — idempotent.
 */
export const seedModuleRegistry = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    let created = 0;
    let updated = 0;

    for (const mod of ALL_MODULES) {
      const existing = await ctx.db
        .query("moduleRegistry")
        .withIndex("by_module_id", (q) => q.eq("moduleId", mod.moduleId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
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
        });
        updated++;
      } else {
        await ctx.db.insert("moduleRegistry", {
          moduleId: mod.moduleId,
          name: mod.name,
          description: mod.description,
          tier: mod.tier,
          category: mod.category,
          isCore: mod.isCore,
          iconName: mod.iconName,
          status: "published" as const,
          version: mod.version,
          pricing: mod.pricing,
          features: mod.features,
          dependencies: mod.dependencies,
          documentation: mod.documentation,
          support: mod.support,
        });
        created++;
      }
    }

    return { created, updated, total: ALL_MODULES.length };
  },
});

/**
 * Ensure core modules are installed for ALL tenants.
 * Platform admin only — idempotent backfill.
 */
export const ensureCoreModules = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const tenants = await ctx.db.query("tenants").collect();
    let totalInstalled = 0;

    for (const tenant of tenants) {
      const tenantId = tenant.tenantId;

      for (const coreModuleId of CORE_MODULE_IDS) {
        const existing = await ctx.db
          .query("installedModules")
          .withIndex("by_tenant_module", (q) =>
            q.eq("tenantId", tenantId).eq("moduleId", coreModuleId)
          )
          .first();

        if (!existing) {
          await ctx.db.insert("installedModules", {
            tenantId,
            moduleId: coreModuleId,
            installedAt: Date.now(),
            installedBy: "system",
            config: {},
            status: "active",
            updatedAt: Date.now(),
          });
          totalInstalled++;
        }
      }
    }

    return { tenantsProcessed: tenants.length, coreModulesInstalled: totalInstalled };
  },
});

/**
 * Ensure core modules are installed for the calling user's tenant.
 * Called on first login / tenant setup. Requires a valid tenant session.
 */
export const ensureCoreModulesForTenant = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await requireTenantSession(ctx, args);
    const tenantId = session.tenantId;

    let installed = 0;
    for (const coreModuleId of CORE_MODULE_IDS) {
      const existing = await ctx.db
        .query("installedModules")
        .withIndex("by_tenant_module", (q) =>
          q.eq("tenantId", tenantId).eq("moduleId", coreModuleId)
        )
        .first();

      if (!existing) {
        await ctx.db.insert("installedModules", {
          tenantId,
          moduleId: coreModuleId,
          installedAt: Date.now(),
          installedBy: "system",
          config: {},
          status: "active",
          updatedAt: Date.now(),
        });
        installed++;
      }
    }

    return { installed };
  },
});
