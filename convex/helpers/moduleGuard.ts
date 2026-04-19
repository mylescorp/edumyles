import { ConvexError } from "convex/values";
import { MutationCtx, QueryCtx } from "../_generated/server";
import { CORE_MODULE_IDS, MODULE_DEPENDENCIES } from "../modules/marketplace/moduleDefinitions";
import { TIER_MODULES } from "../modules/marketplace/tierModules";

type GuardCtx = QueryCtx | MutationCtx;

const LEGACY_MODULE_IDS_BY_SLUG: Record<string, string> = {
  core_sis: "sis",
  core_users: "users",
  core_notifications: "communications",
  mod_academics: "academics",
  mod_attendance: "attendance",
  mod_admissions: "admissions",
  mod_finance: "finance",
  mod_timetable: "timetable",
  mod_library: "library",
  mod_transport: "transport",
  mod_hr: "hr",
  mod_communications: "communications",
  mod_ewallet: "ewallet",
  mod_ecommerce: "ecommerce",
  mod_reports: "reports",
  mod_advanced_analytics: "reports",
  mod_parent_portal: "portal_parent",
  mod_alumni: "portal_alumni",
  mod_partner: "portal_partner",
};

const SPEC_MODULE_SLUG_BY_LEGACY_ID: Record<string, string> = {
  sis: "core_sis",
  users: "core_users",
  notifications: "core_notifications",
  communications: "mod_communications",
  academics: "mod_academics",
  attendance: "mod_attendance",
  admissions: "mod_admissions",
  finance: "mod_finance",
  timetable: "mod_timetable",
  library: "mod_library",
  transport: "mod_transport",
  hr: "mod_hr",
  ewallet: "mod_ewallet",
  ecommerce: "mod_ecommerce",
  reports: "mod_reports",
  advanced_analytics: "mod_advanced_analytics",
  analytics: "mod_advanced_analytics",
  parent_portal: "mod_parent_portal",
  alumni: "mod_alumni",
  partner: "mod_partner",
  portal_parent: "mod_parent_portal",
  portal_alumni: "mod_alumni",
  portal_partner: "mod_partner",
};

function normalizeModuleSlug(moduleSlugOrId: string): string {
  return SPEC_MODULE_SLUG_BY_LEGACY_ID[moduleSlugOrId] ?? moduleSlugOrId;
}

function getLegacyModuleId(moduleSlugOrId: string): string {
  return LEGACY_MODULE_IDS_BY_SLUG[moduleSlugOrId] ?? moduleSlugOrId;
}

async function getMarketplaceModuleBySlug(ctx: GuardCtx, moduleSlugOrId: string) {
  const normalizedModuleSlug = normalizeModuleSlug(moduleSlugOrId);
  return await ctx.db
    .query("marketplace_modules")
    .withIndex("by_slug", (q) => q.eq("slug", normalizedModuleSlug))
    .unique();
}

async function getModuleInstallRecord(ctx: GuardCtx, tenantId: string, moduleSlugOrId: string) {
  const normalizedModuleSlug = normalizeModuleSlug(moduleSlugOrId);

  const install = await ctx.db
    .query("module_installs")
    .withIndex("by_tenantId_moduleSlug", (q) =>
      q.eq("tenantId", tenantId).eq("moduleSlug", normalizedModuleSlug)
    )
    .unique();

  if (install) {
    return {
      source: "module_installs" as const,
      moduleSlug: normalizedModuleSlug,
      install,
    };
  }

  const legacyModuleId = getLegacyModuleId(moduleSlugOrId);
  const legacyInstall = await ctx.db
    .query("installedModules")
    .withIndex("by_tenant_module", (q) =>
      q.eq("tenantId", tenantId).eq("moduleId", legacyModuleId)
    )
    .first();

  if (!legacyInstall) {
    return null;
  }

  return {
    source: "installedModules" as const,
    moduleSlug: normalizedModuleSlug,
    install: {
      ...legacyInstall,
      moduleSlug: normalizedModuleSlug,
      billingPeriod: "monthly" as const,
      currentPriceKes: 0,
      hasPriceOverride: false,
      isFree: CORE_MODULE_IDS.includes(legacyModuleId),
      firstInstalledAt: legacyInstall.installedAt,
      billingStartsAt: legacyInstall.installedAt,
      nextBillingDate: legacyInstall.updatedAt,
      version: "legacy",
      paymentFailureCount: 0,
      installedBy: legacyInstall.installedBy,
      installedAt: legacyInstall.installedAt,
      updatedAt: legacyInstall.updatedAt,
    },
  };
}

function isReadableFeature(featureKey: string) {
  return (
    featureKey.startsWith("view_") ||
    featureKey.startsWith("read_") ||
    featureKey.startsWith("get_") ||
    featureKey.startsWith("list_")
  );
}

export async function requireModuleAccess(
  ctx: GuardCtx,
  moduleSlug: string,
  tenantId: string
) {
  const normalizedModuleSlug = normalizeModuleSlug(moduleSlug);

  if (normalizedModuleSlug.startsWith("core_")) {
    return {
      install: {
        moduleSlug: normalizedModuleSlug,
        tenantId,
        status: "active",
        isFree: true,
      },
    };
  }

  const installRecord = await getModuleInstallRecord(ctx, tenantId, normalizedModuleSlug);

  if (!installRecord) {
    throw new ConvexError({
      code: "MODULE_NOT_INSTALLED",
      message: `Module '${normalizedModuleSlug}' is not installed for tenant '${tenantId}'`,
    });
  }

  const status = installRecord.install.status;

  if (status !== "active") {
    const messageByStatus: Record<string, string> = {
      install_requested: "Installation has been requested but is not complete yet.",
      payment_pending: "Module installation is waiting for payment confirmation.",
      payment_failed: "Module payment failed. Update billing to continue installation.",
      installing: "Module installation is still in progress.",
      disabled: "Module has been disabled by your school administrator.",
      suspended: "Module access is currently suspended.",
      suspended_platform: "Module access was suspended by the platform team.",
      suspended_payment: "Module access was suspended because of payment issues.",
      uninstalling: "Module is being uninstalled.",
      uninstalled: "Module has been uninstalled for this tenant.",
      data_purged: "Module data has already been purged for this tenant.",
      inactive: "Module is inactive for this tenant.",
    };

    throw new ConvexError({
      code: "MODULE_INACTIVE",
      message:
        messageByStatus[status] ??
        `Module '${normalizedModuleSlug}' is not active for tenant '${tenantId}' (status: '${status}')`,
    });
  }

  return {
    install: installRecord.install,
  };
}

export async function requireModuleFeatureAccess(
  ctx: GuardCtx,
  moduleSlug: string,
  tenantId: string,
  userRole: string,
  featureKey: string
) {
  const access = await requireModuleAccess(ctx, moduleSlug, tenantId);
  const normalizedModuleSlug = normalizeModuleSlug(moduleSlug);
  const moduleRecord = await getMarketplaceModuleBySlug(ctx, normalizedModuleSlug);

  if (!moduleRecord) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: `Marketplace module '${normalizedModuleSlug}' is not registered`,
    });
  }

  const config = await ctx.db
    .query("module_access_config")
    .withIndex("by_tenantId_moduleId", (q) =>
      q.eq("tenantId", tenantId).eq("moduleId", moduleRecord._id)
    )
    .unique();

  if (!config) {
    if (userRole === "school_admin" || userRole === "principal") {
      return access;
    }

    throw new ConvexError({
      code: "MODULE_ACCESS_CONFIG_MISSING",
      message: `Role access for module '${normalizedModuleSlug}' has not been configured yet`,
    });
  }

  const roleAccess = config.roleAccess.find((entry) => entry.role === userRole);

  if (!roleAccess || roleAccess.accessLevel === "none") {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: `Role '${userRole}' does not have access to module '${normalizedModuleSlug}'`,
    });
  }

  if (roleAccess.accessLevel === "full") {
    return access;
  }

  if (roleAccess.accessLevel === "read_only") {
    if (isReadableFeature(featureKey)) {
      return access;
    }

    throw new ConvexError({
      code: "FORBIDDEN",
      message: `Role '${userRole}' has read-only access to module '${normalizedModuleSlug}'`,
    });
  }

  if (roleAccess.accessLevel === "restricted") {
    if (roleAccess.allowedFeatures.includes(featureKey)) {
      return access;
    }

    throw new ConvexError({
      code: "FORBIDDEN",
      message: `Feature '${featureKey}' is not allowed for role '${userRole}' in module '${normalizedModuleSlug}'`,
    });
  }

  return access;
}

export async function getInstalledModules(ctx: GuardCtx, tenantId: string) {
  const [marketplaceInstalls, legacyInstalls, marketplaceModules, accessConfigs] = await Promise.all([
    ctx.db
      .query("module_installs")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenantId))
      .collect(),
    ctx.db
      .query("installedModules")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .collect(),
    ctx.db.query("marketplace_modules").collect(),
    ctx.db
      .query("module_access_config")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenantId))
      .collect(),
  ]);

  const moduleBySlug = new Map(marketplaceModules.map((module) => [module.slug, module]));
  const accessConfigBySlug = new Map(
    accessConfigs.map((config) => [config.moduleSlug, config])
  );
  const results = new Map<string, any>();

  for (const install of marketplaceInstalls.filter((record) => record.status === "active")) {
    const moduleSlug = install.moduleSlug ?? normalizeModuleSlug(String(install.moduleId));
    results.set(moduleSlug, {
      ...install,
      moduleSlug,
      module: moduleBySlug.get(moduleSlug) ?? null,
      accessConfig: accessConfigBySlug.get(moduleSlug) ?? null,
    });
  }

  for (const legacyInstall of legacyInstalls.filter((record) => record.status === "active")) {
    const moduleSlug = normalizeModuleSlug(legacyInstall.moduleId);
    if (results.has(moduleSlug)) {
      continue;
    }

    results.set(moduleSlug, {
      ...legacyInstall,
      moduleSlug,
      module: moduleBySlug.get(moduleSlug) ?? null,
      accessConfig: accessConfigBySlug.get(moduleSlug) ?? null,
    });
  }

  return Array.from(results.values());
}

export async function isModuleInstalled(
  ctx: GuardCtx,
  moduleSlug: string,
  tenantId: string
) {
  try {
    await requireModuleAccess(ctx, moduleSlug, tenantId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Legacy guard retained so the existing app remains functional while the
 * marketplace-specific guard system rolls out on `module_installs`.
 */
export async function requireModule(
  ctx: GuardCtx,
  tenantId: string,
  moduleId: string
): Promise<void> {
  await requireModuleAccess(ctx, normalizeModuleSlug(moduleId), tenantId);
}

export async function getInstalledModule(
  ctx: GuardCtx,
  tenantId: string,
  moduleId: string
) {
  const installRecord = await getModuleInstallRecord(ctx, tenantId, moduleId);
  return installRecord?.install ?? null;
}

async function validateModuleTier(
  ctx: GuardCtx,
  tenantId: string,
  moduleId: string
): Promise<void> {
  const tenant = await ctx.db
    .query("tenants")
    .withIndex("by_tenantId", (q) => q.eq("tenantId", tenantId))
    .first();

  if (!tenant) {
    throw new Error(`TENANT_NOT_FOUND: Tenant '${tenantId}' not found`);
  }

  const organization = await ctx.db
    .query("organizations")
    .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
    .first();

  const tier = organization?.tier || tenant.plan || "starter";

  if (CORE_MODULE_IDS.includes(moduleId)) {
    return;
  }

  const availableModules = [
    ...(TIER_MODULES[tier as keyof typeof TIER_MODULES] ?? []),
    ...((tier as keyof typeof TIER_MODULES) === "starter" ? [] : (TIER_MODULES.starter ?? [])),
  ];

  if (!availableModules.includes(moduleId)) {
    throw new Error(
      `MODULE_NOT_AVAILABLE_FOR_TIER: Module '${moduleId}' is not available for tier '${tier}'`
    );
  }
}

async function validateModuleDependencies(
  ctx: GuardCtx,
  tenantId: string,
  moduleId: string
): Promise<void> {
  const dependencies = MODULE_DEPENDENCIES[moduleId as keyof typeof MODULE_DEPENDENCIES];

  if (!dependencies || dependencies.length === 0) {
    return;
  }

  for (const depModuleId of dependencies) {
    const depModule = await getInstalledModule(ctx, tenantId, depModuleId);

    if (!depModule) {
      throw new Error(
        `MODULE_DEPENDENCIES_NOT_MET: Module '${moduleId}' requires '${depModuleId}' which is not installed`
      );
    }

    if (depModule.status !== "active") {
      throw new Error(
        `MODULE_DEPENDENCIES_NOT_MET: Module '${moduleId}' requires '${depModuleId}' which is not active (status: '${depModule.status}')`
      );
    }
  }
}

export async function getModuleConfig(
  ctx: GuardCtx,
  tenantId: string,
  moduleId: string
): Promise<any> {
  const installed = await getInstalledModule(ctx, tenantId, moduleId);

  if (!installed) {
    throw new Error(
      `MODULE_NOT_INSTALLED: Module '${moduleId}' is not installed for tenant '${tenantId}'`
    );
  }

  return ("config" in (installed as any) ? (installed as any).config : undefined) || {};
}

export async function activateModule(
  ctx: MutationCtx,
  tenantId: string,
  moduleId: string
): Promise<boolean> {
  const installed = await getInstalledModule(ctx, tenantId, moduleId);

  if (!installed) {
    throw new Error(
      `MODULE_NOT_INSTALLED: Module '${moduleId}' is not installed for tenant '${tenantId}'`
    );
  }

  if (installed.status === "active") {
    return true;
  }

  await validateModuleTier(ctx, tenantId, moduleId);
  await validateModuleDependencies(ctx, tenantId, moduleId);

  await ctx.db.patch(installed._id, { status: "active" });

  return true;
}

export async function deactivateModule(
  ctx: MutationCtx,
  tenantId: string,
  moduleId: string
): Promise<boolean> {
  const installed = await getInstalledModule(ctx, tenantId, moduleId);

  if (!installed) {
    throw new Error(
      `MODULE_NOT_INSTALLED: Module '${moduleId}' is not installed for tenant '${tenantId}'`
    );
  }

  if (installed.status === "inactive") {
    return true;
  }

  const dependentModules = Object.entries(MODULE_DEPENDENCIES)
    .filter(([_, deps]) => deps.includes(moduleId))
    .map(([dependentModuleId]) => dependentModuleId);

  for (const dependentModuleId of dependentModules) {
    const dependentModule = await getInstalledModule(ctx, tenantId, dependentModuleId);
    if (dependentModule && dependentModule.status === "active") {
      throw new Error(
        `CANNOT_DEACTIVATE: Module '${moduleId}' is required by active module '${dependentModuleId}'`
      );
    }
  }

  await ctx.db.patch(installed._id, { status: "inactive" });

  return true;
}
