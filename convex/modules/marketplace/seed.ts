import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { requireTenantSession } from "../../helpers/tenantGuard";
import { ALL_MODULES } from "./moduleDefinitions";
import { normalizeModuleSlug } from "./moduleAliases";

type MarketplacePlan = "free" | "starter" | "pro" | "enterprise";

function toMarketplacePlan(tier: string): MarketplacePlan {
  if (tier === "free" || tier === "starter" || tier === "pro" || tier === "enterprise") {
    return tier;
  }
  return "pro";
}

function buildPayload(moduleDefinition: (typeof ALL_MODULES)[number]) {
  const now = Date.now();
  return {
    slug: normalizeModuleSlug(moduleDefinition.moduleId),
    name: moduleDefinition.name,
    tagline: moduleDefinition.description.slice(0, 140),
    description: moduleDefinition.description,
    category: moduleDefinition.category,
    status: "published" as const,
    isFeatured: false,
    isCore: moduleDefinition.isCore,
    minimumPlan: toMarketplacePlan(moduleDefinition.tier),
    dependencies: moduleDefinition.dependencies.map(normalizeModuleSlug),
    supportedRoles: ["school_admin", "principal"],
    version: moduleDefinition.version,
    iconUrl: undefined,
    screenshots: [],
    documentationUrl: moduleDefinition.documentation,
    changelogUrl: undefined,
    publishedAt: now,
    averageRating: 0,
    reviewCount: 0,
    installCount: 0,
    activeInstallCount: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export const seedMarketplaceModules = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    let created = 0;
    let updated = 0;

    for (const moduleDefinition of ALL_MODULES) {
      const payload = buildPayload(moduleDefinition);
      const existing = await ctx.db
        .query("marketplace_modules")
        .withIndex("by_slug", (q) => q.eq("slug", payload.slug))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...payload,
          installCount: existing.installCount ?? 0,
          activeInstallCount: existing.activeInstallCount ?? 0,
          reviewCount: existing.reviewCount ?? 0,
          averageRating: existing.averageRating ?? 0,
          createdAt: existing.createdAt,
          updatedAt: Date.now(),
        });
        updated++;
      } else {
        await ctx.db.insert("marketplace_modules", payload);
        created++;
      }
    }

    return { created, updated, total: ALL_MODULES.length };
  },
});

export const ensureCoreModules = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const tenants = await ctx.db.query("tenants").collect();
    let totalInstalled = 0;

    for (const tenant of tenants) {
      for (const moduleDefinition of ALL_MODULES.filter((moduleRecord) => moduleRecord.isCore)) {
        const moduleSlug = normalizeModuleSlug(moduleDefinition.moduleId);
        const moduleRecord = await ctx.db
          .query("marketplace_modules")
          .withIndex("by_slug", (q) => q.eq("slug", moduleSlug))
          .first();
        if (!moduleRecord) continue;

        const existing = await ctx.db
          .query("module_installs")
          .withIndex("by_tenantId_moduleSlug", (q) =>
            q.eq("tenantId", tenant.tenantId).eq("moduleSlug", moduleSlug)
          )
          .first();
        if (existing) continue;

        await ctx.db.insert("module_installs", {
          tenantId: tenant.tenantId,
          moduleId: moduleRecord._id,
          moduleSlug,
          status: "active",
          billingPeriod: "monthly",
          currentPriceKes: 0,
          hasPriceOverride: false,
          isFree: true,
          firstInstalledAt: Date.now(),
          billingStartsAt: Date.now(),
          nextBillingDate: Date.now(),
          installedAt: Date.now(),
          installedBy: "system",
          version: moduleRecord.version,
          paymentFailureCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        totalInstalled++;
      }
    }

    return { tenantsProcessed: tenants.length, coreModulesInstalled: totalInstalled };
  },
});

export const ensureCoreModulesForTenant = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await requireTenantSession(ctx, args);
    let installed = 0;

    for (const moduleDefinition of ALL_MODULES.filter((moduleRecord) => moduleRecord.isCore)) {
      const moduleSlug = normalizeModuleSlug(moduleDefinition.moduleId);
      const moduleRecord = await ctx.db
        .query("marketplace_modules")
        .withIndex("by_slug", (q) => q.eq("slug", moduleSlug))
        .first();
      if (!moduleRecord) continue;

      const existing = await ctx.db
        .query("module_installs")
        .withIndex("by_tenantId_moduleSlug", (q) =>
          q.eq("tenantId", session.tenantId).eq("moduleSlug", moduleSlug)
        )
        .first();
      if (existing) continue;

      await ctx.db.insert("module_installs", {
        tenantId: session.tenantId,
        moduleId: moduleRecord._id,
        moduleSlug,
        status: "active",
        billingPeriod: "monthly",
        currentPriceKes: 0,
        hasPriceOverride: false,
        isFree: true,
        firstInstalledAt: Date.now(),
        billingStartsAt: Date.now(),
        nextBillingDate: Date.now(),
        installedAt: Date.now(),
        installedBy: "system",
        version: moduleRecord.version,
        paymentFailureCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      installed++;
    }

    return { installed };
  },
});
