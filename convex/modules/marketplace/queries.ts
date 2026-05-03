import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requireTenantSession } from "../../helpers/tenantGuard";
import { requireRole } from "../../helpers/authorize";
import { getInstalledModules as getGuardInstalledModules } from "../../helpers/moduleGuard";
import { TIER_MODULES } from "./tierModules";
import { ALL_MODULES } from "./moduleDefinitions";
import {
  getAllBuiltinModuleSlugs,
  getBuiltinDefinition,
  getCanonicalDependencies,
  getCanonicalTierModules,
  getCoreModuleSlugs,
  isCoreModuleSlug,
  normalizeModuleSlug,
  toLegacyModuleId,
} from "./moduleAliases";

type AccessStatus =
  | "allowed"
  | "plan_upgrade_required"
  | "rbac_escalation_required"
  | "payment_required"
  | "waitlist_only";

async function getTenantPlan(ctx: any, tenantId: string) {
  const [tenant, organization] = await Promise.all([
    ctx.db.query("tenants").withIndex("by_tenantId", (q: any) => q.eq("tenantId", tenantId)).first(),
    ctx.db.query("organizations").withIndex("by_tenant", (q: any) => q.eq("tenantId", tenantId)).first(),
  ]);
  return organization?.tier ?? tenant?.plan ?? "free";
}

async function getMarketplaceModule(ctx: any, moduleSlugOrId: string) {
  const moduleSlug = normalizeModuleSlug(moduleSlugOrId);
  const record = await ctx.db
    .query("marketplace_modules")
    .withIndex("by_slug", (q: any) => q.eq("slug", moduleSlug))
    .first();
  return record ?? null;
}

function buildBuiltinModuleSummary(moduleDefinition: (typeof ALL_MODULES)[number]) {
  const moduleSlug = normalizeModuleSlug(moduleDefinition.moduleId);
  return {
    _id: moduleSlug as any,
    _creationTime: 0,
    moduleId: moduleDefinition.moduleId,
    moduleSlug,
    slug: moduleSlug,
    name: moduleDefinition.name,
    description: moduleDefinition.description,
    tagline: moduleDefinition.description,
    tier: moduleDefinition.tier,
    minimumPlan: moduleDefinition.tier,
    category: moduleDefinition.category,
    isCore: moduleDefinition.isCore,
    iconName: moduleDefinition.iconName,
    status: "published" as const,
    version: moduleDefinition.version,
    features: moduleDefinition.features,
    dependencies: moduleDefinition.dependencies,
    dependencySlugs: moduleDefinition.dependencies.map(normalizeModuleSlug),
    documentation: moduleDefinition.documentation,
    documentationUrl: moduleDefinition.documentation,
    pricing: moduleDefinition.pricing,
    support: moduleDefinition.support,
    supportedRoles: ["school_admin", "principal"],
    averageRating: 0,
    reviewCount: 0,
    installCount: 0,
    activeInstallCount: 0,
  };
}

function normalizeMarketplaceModule(record: any) {
  const builtin = getBuiltinDefinition(record.slug);
  const summary = builtin ? buildBuiltinModuleSummary(builtin) : null;
  return {
    ...summary,
    ...record,
    moduleId: summary?.moduleId ?? toLegacyModuleId(record.slug),
    moduleSlug: record.slug,
    slug: record.slug,
    tier: summary?.tier ?? record.minimumPlan,
    features: summary?.features ?? [],
    dependencies: (record.dependencies ?? []).map(toLegacyModuleId),
    dependencySlugs: record.dependencies ?? [],
    documentation: record.documentationUrl,
    pricing: summary?.pricing,
    support: summary?.support,
    availableForTier: false,
  };
}

async function listPublishedMarketplaceModules(ctx: any) {
  const records = await ctx.db
    .query("marketplace_modules")
    .withIndex("by_status", (q: any) => q.eq("status", "published"))
    .collect();

  const merged = new Map<string, any>();
  for (const moduleDefinition of ALL_MODULES) {
    const summary = buildBuiltinModuleSummary(moduleDefinition);
    merged.set(summary.moduleSlug, summary);
  }
  for (const record of records) {
    merged.set(record.slug, normalizeMarketplaceModule(record));
  }
  return Array.from(merged.values());
}

async function getActivePilotGrantModuleSlugs(ctx: any, tenantId: string) {
  const activeGrants = await ctx.db
    .query("pilot_grants")
    .withIndex("by_tenant_status", (q: any) => q.eq("tenantId", tenantId).eq("status", "active"))
    .collect();

  const moduleRecords = await ctx.db.query("marketplace_modules").collect();
  const moduleSlugById = new Map<string, string>(
    moduleRecords.map((moduleRecord: any) => [String(moduleRecord._id), moduleRecord.slug])
  );

  return new Set<string>(
    activeGrants
      .filter((grant: any) => !grant.endDate || grant.endDate >= Date.now())
      .map((grant: any) =>
        normalizeModuleSlug(String(moduleSlugById.get(String(grant.moduleId)) ?? grant.moduleId))
      )
  );
}

async function getEntitledModuleSlugs(ctx: any, tenantId: string, plan: string) {
  const [installed, pilotGrantSlugs] = await Promise.all([
    getGuardInstalledModules(ctx, tenantId),
    getActivePilotGrantModuleSlugs(ctx, tenantId),
  ]);
  const entitled = new Set([
    ...getCoreModuleSlugs(),
    ...getCanonicalTierModules((TIER_MODULES[plan] ?? TIER_MODULES.free ?? []) as string[]),
  ]);

  for (const install of installed) {
    entitled.add(normalizeModuleSlug(String(install.moduleSlug ?? install.moduleId)));
  }
  for (const slug of pilotGrantSlugs) {
    entitled.add(slug);
  }

  return entitled;
}

export const getMarketplaceModules = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requireTenantSession(ctx, args);
    return (await listPublishedMarketplaceModules(ctx)).map((moduleRecord) => ({
      ...moduleRecord,
      availableForTier: true,
    }));
  },
});

export const getInstalledModules = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    if (!args.sessionToken?.trim()) return [];
    const tenant = await requireTenantSession(ctx, args);
    return await getGuardInstalledModules(ctx, tenant.tenantId);
  },
});

export const getInstalledModuleIds = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    if (!args.sessionToken?.trim()) return getCoreModuleSlugs();
    const tenant = await requireTenantSession(ctx, args);

    if (tenant.tenantId === "PLATFORM") {
      return getAllBuiltinModuleSlugs();
    }

    const installed = await getGuardInstalledModules(ctx, tenant.tenantId);
    return Array.from(
      new Set([
        ...getCoreModuleSlugs(),
        ...installed.map((install: any) => normalizeModuleSlug(String(install.moduleSlug ?? install.moduleId))),
      ])
    );
  },
});

export const getAvailableForTier = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    if (!args.sessionToken?.trim()) {
      return (await listPublishedMarketplaceModules(ctx)).map((moduleRecord) => ({
        ...moduleRecord,
        availableForTier: isCoreModuleSlug(moduleRecord.moduleSlug),
      }));
    }

    const tenant = await requireTenantSession(ctx, args);
    if (tenant.tenantId === "PLATFORM") {
      return (await listPublishedMarketplaceModules(ctx)).map((moduleRecord) => ({
        ...moduleRecord,
        availableForTier: true,
      }));
    }

    const plan = await getTenantPlan(ctx, tenant.tenantId);
    const entitled = await getEntitledModuleSlugs(ctx, tenant.tenantId, plan);
    return (await listPublishedMarketplaceModules(ctx)).map((moduleRecord) => ({
      ...moduleRecord,
      currentTier: plan,
      availableForTier: entitled.has(moduleRecord.moduleSlug),
    }));
  },
});

export const getModuleDetails = query({
  args: { sessionToken: v.string(), moduleId: v.string() },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, args);
    const moduleSlug = normalizeModuleSlug(args.moduleId);
    const builtinDefinition = getBuiltinDefinition(moduleSlug);
    const moduleRecord =
      (await getMarketplaceModule(ctx, moduleSlug)) ??
      (builtinDefinition ? buildBuiltinModuleSummary(builtinDefinition as (typeof ALL_MODULES)[number]) : null);

    if (!moduleRecord || normalizeModuleSlug(moduleRecord.slug ?? moduleRecord.moduleId) !== moduleSlug) {
      throw new Error("MODULE_NOT_FOUND");
    }

    const [installed, plan] = await Promise.all([
      getGuardInstalledModules(ctx, tenant.tenantId),
      getTenantPlan(ctx, tenant.tenantId),
    ]);
    const installedState =
      installed.find((install: any) => normalizeModuleSlug(String(install.moduleSlug ?? install.moduleId)) === moduleSlug) ??
      (isCoreModuleSlug(moduleSlug)
        ? {
            status: "active",
            installedAt: 0,
            installedBy: "system",
            config: {},
          }
        : null);
    const entitled = await getEntitledModuleSlugs(ctx, tenant.tenantId, plan);

    return {
      ...normalizeMarketplaceModule(moduleRecord.slug ? moduleRecord : { ...moduleRecord, slug: moduleSlug }),
      installed: installedState,
      availableForTier: entitled.has(moduleSlug),
      currentTier: plan,
    };
  },
});

export const getModuleRequests = query({
  args: { sessionToken: v.string(), status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, args);
    requireRole(tenant, "school_admin", "master_admin", "super_admin");

    const requests = args.status
      ? await ctx.db
          .query("module_requests")
          .withIndex("by_tenant_status", (q: any) => q.eq("tenantId", tenant.tenantId).eq("status", args.status!))
          .collect()
      : await ctx.db
          .query("module_requests")
          .withIndex("by_tenantId", (q: any) => q.eq("tenantId", tenant.tenantId))
          .collect();

    return await Promise.all(
      requests.map(async (request: any) => {
        const moduleSlug = request.moduleId ? normalizeModuleSlug(request.moduleId) : undefined;
        const moduleRecord = moduleSlug ? await getMarketplaceModule(ctx, moduleSlug) : null;
        return {
          ...request,
          moduleSlug,
          moduleName: moduleRecord?.name ?? getBuiltinDefinition(moduleSlug ?? "")?.name ?? request.name ?? request.moduleId,
        };
      })
    );
  },
});

export const getModuleAccessStatus = query({
  args: { sessionToken: v.string(), moduleId: v.string() },
  handler: async (
    ctx,
    args
  ): Promise<{ status: AccessStatus; reason: string; platformPriceKes?: number }> => {
    const tenant = await requireTenantSession(ctx, args);
    const moduleSlug = normalizeModuleSlug(args.moduleId);
    const moduleRecord = await getMarketplaceModule(ctx, moduleSlug);
    const builtin = getBuiltinDefinition(moduleSlug);

    if (!moduleRecord && !builtin) {
      return { status: "waitlist_only", reason: "Module not found" };
    }

    if (moduleRecord && moduleRecord.status !== "published") {
      return { status: "waitlist_only", reason: "Module is not yet published" };
    }

    if (isCoreModuleSlug(moduleSlug)) {
      return { status: "allowed", reason: "Core module" };
    }

    const installed = await getGuardInstalledModules(ctx, tenant.tenantId);
    const existing = installed.find(
      (install: any) => normalizeModuleSlug(String(install.moduleSlug ?? install.moduleId)) === moduleSlug
    );
    if (existing?.status === "active") {
      return { status: "allowed", reason: "Module is already installed" };
    }

    const pilotGrantSlugs = await getActivePilotGrantModuleSlugs(ctx, tenant.tenantId);
    if (pilotGrantSlugs.has(moduleSlug)) {
      return { status: "allowed", reason: "Pilot grant active" };
    }

    const tenantPlan = await getTenantPlan(ctx, tenant.tenantId);
    const allowedForPlan = getCanonicalTierModules(TIER_MODULES[tenantPlan] ?? []);
    if (!allowedForPlan.includes(moduleSlug)) {
      return {
        status: "plan_upgrade_required",
        reason: `Module requires a higher plan (current: ${tenantPlan})`,
      };
    }

    const supportedRoles = moduleRecord?.supportedRoles ?? ["school_admin", "principal"];
    if (supportedRoles.length > 0) {
      const tenantUsers = await ctx.db
        .query("users")
        .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
        .collect();
      const hasEligibleRole = tenantUsers.some(
        (user: any) => user.isActive && supportedRoles.includes(user.role)
      );
      if (!hasEligibleRole) {
        return {
          status: "rbac_escalation_required",
          reason: `No active users with roles: ${supportedRoles.join(", ")}`,
        };
      }
    }

    for (const dependencySlug of getCanonicalDependencies(moduleSlug)) {
      const dependencyInstall = installed.find(
        (install: any) => normalizeModuleSlug(String(install.moduleSlug ?? install.moduleId)) === dependencySlug
      );
      if (!dependencyInstall || dependencyInstall.status !== "active") {
        return {
          status: "waitlist_only",
          reason: `Missing dependency: ${toLegacyModuleId(dependencySlug)} must be installed and active first`,
        };
      }
    }

    const pricing = moduleRecord
      ? await ctx.db
          .query("module_pricing")
          .withIndex("by_moduleId", (q: any) => q.eq("moduleId", moduleRecord._id))
          .first()
      : null;
    if (pricing && !moduleRecord?.isCore) {
      return {
        status: "payment_required",
        reason: "Module requires marketplace billing setup",
        platformPriceKes: pricing.baseRateKes,
      };
    }

    return { status: "allowed", reason: "Access granted" };
  },
});
