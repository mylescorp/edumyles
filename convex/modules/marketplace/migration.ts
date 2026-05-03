import { mutation, query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { ALL_MODULES } from "./moduleDefinitions";
import {
  getBuiltinDefinition,
  getCanonicalDependencies,
  isCoreModuleSlug,
  normalizeModuleSlug,
} from "./moduleAliases";

type MarketplacePlan = "free" | "starter" | "pro" | "enterprise";

const legacyRegistryValidator = v.object({
  moduleId: v.string(),
  name: v.optional(v.string()),
  description: v.optional(v.string()),
  tier: v.optional(v.string()),
  category: v.optional(v.string()),
  status: v.optional(v.string()),
  version: v.optional(v.string()),
  isCore: v.optional(v.boolean()),
  features: v.optional(v.array(v.string())),
  dependencies: v.optional(v.array(v.string())),
  documentation: v.optional(v.string()),
});

const legacyInstallValidator = v.object({
  tenantId: v.string(),
  moduleId: v.string(),
  installedAt: v.optional(v.number()),
  installedBy: v.optional(v.string()),
  config: v.optional(v.any()),
  status: v.optional(v.string()),
  updatedAt: v.optional(v.number()),
});

const legacyRequestValidator = v.object({
  tenantId: v.string(),
  userId: v.optional(v.string()),
  moduleId: v.optional(v.string()),
  requestedAt: v.optional(v.number()),
  status: v.optional(v.string()),
  reviewedBy: v.optional(v.string()),
  reviewedAt: v.optional(v.number()),
  notes: v.optional(v.string()),
  reason: v.optional(v.string()),
});

function toMarketplacePlan(value?: string): MarketplacePlan {
  if (value === "free" || value === "starter" || value === "pro" || value === "enterprise") {
    return value;
  }
  if (value === "standard" || value === "growth") return "pro";
  return "starter";
}

function toInstallStatus(value?: string) {
  switch (value) {
    case "active":
      return "active" as const;
    case "inactive":
    case "disabled":
      return "disabled" as const;
    case "uninstalled":
      return "uninstalled" as const;
    case "suspended":
      return "suspended" as const;
    default:
      return "active" as const;
  }
}

function toRequestStatus(value?: string) {
  switch (value) {
    case "approved":
      return "approved_exception_granted" as const;
    case "rejected":
      return "rejected" as const;
    case "under_review":
      return "under_review" as const;
    case "waitlisted":
      return "waitlisted" as const;
    default:
      return "submitted" as const;
  }
}

function buildModulePayload(moduleSlugOrId: string, legacy?: any) {
  const moduleSlug = normalizeModuleSlug(moduleSlugOrId);
  const builtin = getBuiltinDefinition(moduleSlug);
  const now = Date.now();
  return {
    slug: moduleSlug,
    name: legacy?.name ?? builtin?.name ?? moduleSlug,
    tagline: (legacy?.description ?? builtin?.description ?? moduleSlug).slice(0, 140),
    description: legacy?.description ?? builtin?.description ?? moduleSlug,
    category: legacy?.category ?? builtin?.category ?? "general",
    status: legacy?.status === "deprecated" ? ("deprecated" as const) : ("published" as const),
    isFeatured: Boolean(builtin?.isCore),
    isCore: legacy?.isCore ?? builtin?.isCore ?? isCoreModuleSlug(moduleSlug),
    minimumPlan: toMarketplacePlan(legacy?.tier ?? builtin?.tier),
    dependencies: (legacy?.dependencies ?? builtin?.dependencies ?? []).map(normalizeModuleSlug),
    supportedRoles: ["school_admin", "principal"],
    version: legacy?.version ?? builtin?.version ?? "1.0.0",
    iconUrl: undefined,
    screenshots: [],
    documentationUrl: legacy?.documentation ?? builtin?.documentation,
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

async function upsertMarketplaceModule(ctx: any, moduleSlugOrId: string, legacy: any, dryRun: boolean) {
  const payload = buildModulePayload(moduleSlugOrId, legacy);
  const existing = await ctx.db
    .query("marketplace_modules")
    .withIndex("by_slug", (q: any) => q.eq("slug", payload.slug))
    .first();

  if (!dryRun) {
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
      return await ctx.db.get(existing._id);
    }
    const id = await ctx.db.insert("marketplace_modules", payload);
    return await ctx.db.get(id);
  }

  return existing ?? { ...payload, _id: payload.slug };
}

async function collectStatus(ctx: any) {
  const [tenants, modules, installs, requests] = await Promise.all([
    ctx.db.query("tenants").collect(),
    ctx.db.query("marketplace_modules").collect(),
    ctx.db.query("module_installs").collect(),
    ctx.db.query("module_requests").collect(),
  ]);

  const modulesBySlug = new Map(modules.map((moduleRecord: any) => [moduleRecord.slug, moduleRecord]));
  const missingCatalogSlugs = ALL_MODULES.map((moduleRecord) => normalizeModuleSlug(moduleRecord.moduleId)).filter(
    (slug) => !modulesBySlug.has(slug)
  );
  const installsMissingSlug = installs.filter((install: any) => !install.moduleSlug).length;
  const installsMissingCatalog = installs.filter(
    (install: any) => !modulesBySlug.has(normalizeModuleSlug(install.moduleSlug ?? String(install.moduleId)))
  ).length;
  const coreMissingByTenant = tenants.flatMap((tenant: any) =>
    ALL_MODULES.filter((moduleRecord) => moduleRecord.isCore)
      .map((moduleRecord) => normalizeModuleSlug(moduleRecord.moduleId))
      .filter(
        (moduleSlug) =>
          !installs.some(
            (install: any) =>
              install.tenantId === tenant.tenantId &&
              normalizeModuleSlug(install.moduleSlug ?? String(install.moduleId)) === moduleSlug &&
              install.status === "active"
          )
      )
      .map((moduleSlug) => ({ tenantId: tenant.tenantId, moduleSlug }))
  );

  return {
    tenants: tenants.length,
    marketplaceModules: modules.length,
    moduleInstalls: installs.length,
    moduleRequests: requests.length,
    missingCatalogSlugs,
    installsMissingSlug,
    installsMissingCatalog,
    coreMissingByTenantCount: coreMissingByTenant.length,
    coreMissingByTenant: coreMissingByTenant.slice(0, 100),
    productionReady:
      missingCatalogSlugs.length === 0 &&
      installsMissingSlug === 0 &&
      installsMissingCatalog === 0 &&
      coreMissingByTenant.length === 0,
  };
}

async function recordRun(ctx: any, args: any, action: "status" | "repair_canonical" | "import_legacy_snapshot", summary: any) {
  const now = Date.now();
  await ctx.db.insert("marketplace_migration_runs", {
    runKey: `${action}:${now}`,
    action,
    requestedBy: args.session?.userId ?? "platform",
    dryRun: Boolean(args.dryRun),
    summary,
    createdAt: now,
  });
}

export const getMarketplaceMigrationStatus = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    return await collectStatus(ctx);
  },
});

export const repairCanonicalMarketplaceData = mutation({
  args: {
    sessionToken: v.string(),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);
    const dryRun = args.dryRun ?? false;
    let modulesCreatedOrUpdated = 0;
    let installsRepaired = 0;
    let coreInstallsCreated = 0;

    for (const moduleDefinition of ALL_MODULES) {
      await upsertMarketplaceModule(ctx, moduleDefinition.moduleId, undefined, dryRun);
      modulesCreatedOrUpdated++;
    }

    const modules = await ctx.db.query("marketplace_modules").collect();
    const modulesBySlug = new Map(modules.map((moduleRecord: any) => [moduleRecord.slug, moduleRecord]));
    const installs = await ctx.db.query("module_installs").collect();

    for (const install of installs) {
      const moduleSlug = normalizeModuleSlug(install.moduleSlug ?? String(install.moduleId));
      const moduleRecord = modulesBySlug.get(moduleSlug) ?? (await upsertMarketplaceModule(ctx, moduleSlug, undefined, dryRun));
      if (!install.moduleSlug || String(install.moduleId) !== String(moduleRecord._id)) {
        installsRepaired++;
        if (!dryRun) {
          await ctx.db.patch(install._id, {
            moduleId: moduleRecord._id,
            moduleSlug,
            updatedAt: Date.now(),
          });
        }
      }
    }

    const tenants = await ctx.db.query("tenants").collect();
    for (const tenant of tenants) {
      for (const coreModule of ALL_MODULES.filter((moduleRecord) => moduleRecord.isCore)) {
        const moduleSlug = normalizeModuleSlug(coreModule.moduleId);
        const moduleRecord = modulesBySlug.get(moduleSlug) ?? (await upsertMarketplaceModule(ctx, moduleSlug, undefined, dryRun));
        const existing = await ctx.db
          .query("module_installs")
          .withIndex("by_tenantId_moduleSlug", (q: any) =>
            q.eq("tenantId", tenant.tenantId).eq("moduleSlug", moduleSlug)
          )
          .first();

        if (existing) continue;
        coreInstallsCreated++;
        if (!dryRun) {
          const now = Date.now();
          await ctx.db.insert("module_installs", {
            tenantId: tenant.tenantId,
            moduleId: moduleRecord._id,
            moduleSlug,
            status: "active",
            billingPeriod: "monthly",
            currentPriceKes: 0,
            hasPriceOverride: false,
            isFree: true,
            firstInstalledAt: now,
            billingStartsAt: now,
            nextBillingDate: now,
            installedAt: now,
            installedBy: session.userId,
            version: moduleRecord.version,
            paymentFailureCount: 0,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }

    const status = await collectStatus(ctx);
    const summary = { dryRun, modulesCreatedOrUpdated, installsRepaired, coreInstallsCreated, status };
    if (!dryRun) await recordRun(ctx, { ...args, session }, "repair_canonical", summary);
    return summary;
  },
});

export const importLegacyMarketplaceSnapshot = mutation({
  args: {
    sessionToken: v.string(),
    dryRun: v.optional(v.boolean()),
    moduleRegistry: v.optional(v.array(legacyRegistryValidator)),
    installedModules: v.optional(v.array(legacyInstallValidator)),
    moduleRequests: v.optional(v.array(legacyRequestValidator)),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);
    const dryRun = args.dryRun ?? false;
    let modulesImported = 0;
    let installsImported = 0;
    let requestsImported = 0;

    for (const registryRecord of args.moduleRegistry ?? []) {
      await upsertMarketplaceModule(ctx, registryRecord.moduleId, registryRecord, dryRun);
      modulesImported++;
    }

    for (const install of args.installedModules ?? []) {
      const moduleSlug = normalizeModuleSlug(install.moduleId);
      const moduleRecord = await upsertMarketplaceModule(ctx, moduleSlug, undefined, dryRun);
      const existing = await ctx.db
        .query("module_installs")
        .withIndex("by_tenantId_moduleSlug", (q: any) =>
          q.eq("tenantId", install.tenantId).eq("moduleSlug", moduleSlug)
        )
        .first();

      if (existing?.status === "active" && toInstallStatus(install.status) === "active") continue;
      installsImported++;
      if (!dryRun) {
        const now = Date.now();
        const payload = {
          tenantId: install.tenantId,
          moduleId: moduleRecord._id,
          moduleSlug,
          status: toInstallStatus(install.status),
          billingPeriod: "monthly" as const,
          currentPriceKes: 0,
          hasPriceOverride: false,
          isFree: isCoreModuleSlug(moduleSlug),
          firstInstalledAt: install.installedAt ?? now,
          billingStartsAt: install.installedAt ?? now,
          nextBillingDate: install.updatedAt ?? now,
          installedAt: install.installedAt ?? now,
          installedBy: install.installedBy ?? session.userId,
          version: moduleRecord.version,
          paymentFailureCount: 0,
          createdAt: install.installedAt ?? now,
          updatedAt: install.updatedAt ?? now,
        };
        if (existing) {
          await ctx.db.patch(existing._id, payload);
        } else {
          await ctx.db.insert("module_installs", payload);
        }
      }
    }

    for (const request of args.moduleRequests ?? []) {
      const moduleSlug = request.moduleId ? normalizeModuleSlug(request.moduleId) : undefined;
      const existing = moduleSlug
        ? await ctx.db
            .query("module_requests")
            .withIndex("by_moduleId", (q: any) => q.eq("moduleId", moduleSlug))
            .collect()
        : [];
      const duplicate = existing.some(
        (entry: any) =>
          entry.tenantId === request.tenantId &&
          entry.requestedBy === (request.userId ?? session.userId) &&
          entry.createdAt === (request.requestedAt ?? entry.createdAt)
      );
      if (duplicate) continue;

      requestsImported++;
      if (!dryRun) {
        const now = Date.now();
        await ctx.db.insert("module_requests", {
          tenantId: request.tenantId,
          requestedBy: request.userId ?? session.userId,
          type: "rbac_restricted",
          moduleId: moduleSlug,
          name: moduleSlug,
          description: request.reason ?? request.notes,
          useCase: request.reason ?? request.notes,
          urgencyLevel: "normal",
          status: toRequestStatus(request.status),
          resolution: request.notes,
          createdAt: request.requestedAt ?? now,
          updatedAt: request.reviewedAt ?? request.requestedAt ?? now,
        });
      }
    }

    const status = await collectStatus(ctx);
    const summary = { dryRun, modulesImported, installsImported, requestsImported, status };
    if (!dryRun) await recordRun(ctx, { ...args, session }, "import_legacy_snapshot", summary);
    return summary;
  },
});
