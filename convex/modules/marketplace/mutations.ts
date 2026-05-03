import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requireTenantSession } from "../../helpers/tenantGuard";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { requireRole } from "../../helpers/authorize";
import { logAction } from "../../helpers/auditLog";
import { getInstalledModules as getGuardInstalledModules } from "../../helpers/moduleGuard";
import { runModuleOnInstallSetup, runModuleOnUninstallCleanup } from "../moduleRuntime";
import { TIER_MODULES } from "./tierModules";
import { ALL_MODULES } from "./moduleDefinitions";
import {
  getBuiltinDefinition,
  getCanonicalDependencies,
  getCanonicalTierModules,
  isCoreModuleSlug,
  normalizeModuleSlug,
  toLegacyModuleId,
} from "./moduleAliases";

const MODULE_RUNTIME_SLUGS = new Set([
  "mod_finance",
  "mod_attendance",
  "mod_academics",
  "mod_admissions",
  "mod_library",
  "mod_transport",
  "mod_hr",
  "mod_communications",
  "mod_ewallet",
  "mod_ecommerce",
  "mod_reports",
  "mod_timetable",
  "mod_advanced_analytics",
  "mod_parent_portal",
  "mod_alumni",
  "mod_partner",
  "mod_social",
]);

function assertTenantMatch(sessionTenantId: string, argsTenantId: string) {
  if (argsTenantId !== sessionTenantId) {
    throw new Error("UNAUTHORIZED: Cross-tenant access denied");
  }
}

type MarketplacePlan = "free" | "starter" | "pro" | "enterprise";

function toMarketplacePlan(tier: string): MarketplacePlan {
  if (tier === "free" || tier === "starter" || tier === "pro" || tier === "enterprise") {
    return tier;
  }
  return "pro";
}

function buildMarketplacePayload(moduleSlug: string) {
  const definition = getBuiltinDefinition(moduleSlug);
  if (!definition) {
    throw new Error("MODULE_NOT_FOUND: Module does not exist");
  }

  const now = Date.now();
  return {
    slug: moduleSlug,
    name: definition.name,
    tagline: definition.description.slice(0, 140),
    description: definition.description,
    category: definition.category,
    status: "published" as const,
    isFeatured: false,
    isCore: definition.isCore,
    minimumPlan: toMarketplacePlan(definition.tier),
    dependencies: definition.dependencies.map(normalizeModuleSlug),
    supportedRoles: ["school_admin", "principal"],
    version: definition.version,
    iconUrl: undefined,
    screenshots: [],
    documentationUrl: definition.documentation,
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

async function getOrCreateMarketplaceModule(ctx: any, moduleSlugOrId: string) {
  const moduleSlug = normalizeModuleSlug(moduleSlugOrId);
  const existing = await ctx.db
    .query("marketplace_modules")
    .withIndex("by_slug", (q: any) => q.eq("slug", moduleSlug))
    .first();

  if (existing) return existing;

  const payload = buildMarketplacePayload(moduleSlug);
  const moduleId = await ctx.db.insert("marketplace_modules", payload);
  return await ctx.db.get(moduleId);
}

async function getTenantPlan(ctx: any, tenantId: string) {
  const [tenant, organization] = await Promise.all([
    ctx.db.query("tenants").withIndex("by_tenantId", (q: any) => q.eq("tenantId", tenantId)).first(),
    ctx.db.query("organizations").withIndex("by_tenant", (q: any) => q.eq("tenantId", tenantId)).first(),
  ]);
  return organization?.tier ?? tenant?.plan ?? "free";
}

async function hasActivePilotGrant(ctx: any, tenantId: string, moduleRecord: any) {
  const grants = await ctx.db
    .query("pilot_grants")
    .withIndex("by_moduleId_tenantId", (q: any) =>
      q.eq("moduleId", moduleRecord._id).eq("tenantId", tenantId)
    )
    .collect();

  return grants.some(
    (grant: any) =>
      (grant.status === "active" || grant.status === "extended") &&
      (!grant.endDate || grant.endDate >= Date.now())
  );
}

async function assertCanInstall(ctx: any, tenantId: string, moduleRecord: any) {
  const plan = await getTenantPlan(ctx, tenantId);
  const allowedModuleSlugs = getCanonicalTierModules(TIER_MODULES[plan] ?? TIER_MODULES.free ?? []);
  const hasPilotAccess = await hasActivePilotGrant(ctx, tenantId, moduleRecord);

  if (!isCoreModuleSlug(moduleRecord.slug) && !allowedModuleSlugs.includes(moduleRecord.slug) && !hasPilotAccess) {
    throw new Error(
      `TIER_RESTRICTED: Module '${toLegacyModuleId(moduleRecord.slug)}' is not available on '${plan}' tier. Upgrade required.`
    );
  }

  const installed = await getGuardInstalledModules(ctx, tenantId);
  for (const dependencySlug of getCanonicalDependencies(moduleRecord.slug)) {
    const dependencyInstall = installed.find(
      (install: any) => normalizeModuleSlug(String(install.moduleSlug ?? install.moduleId)) === dependencySlug
    );
    if (!dependencyInstall || dependencyInstall.status !== "active") {
      throw new Error(
        `DEPENDENCY_MISSING: Module '${toLegacyModuleId(moduleRecord.slug)}' requires '${toLegacyModuleId(dependencySlug)}' to be installed and active first.`
      );
    }
  }

  return { plan, installed };
}

async function findInstall(ctx: any, tenantId: string, moduleSlug: string) {
  return await ctx.db
    .query("module_installs")
    .withIndex("by_tenantId_moduleSlug", (q: any) =>
      q.eq("tenantId", tenantId).eq("moduleSlug", moduleSlug)
    )
    .first();
}

async function runInstallRuntime(ctx: any, moduleSlug: string, tenantId: string, updatedBy: string) {
  if (isCoreModuleSlug(moduleSlug) || !MODULE_RUNTIME_SLUGS.has(moduleSlug)) return;
  await runModuleOnInstallSetup(ctx, { moduleSlug: moduleSlug as any, tenantId, updatedBy });
}

async function runUninstallRuntime(ctx: any, moduleSlug: string, tenantId: string) {
  if (isCoreModuleSlug(moduleSlug) || !MODULE_RUNTIME_SLUGS.has(moduleSlug)) return;
  await runModuleOnUninstallCleanup(ctx, { moduleSlug: moduleSlug as any, tenantId });
}

async function installModuleForTenant(
  ctx: any,
  args: { tenantId: string; userId: string; userEmail: string; moduleId: string }
) {
  const moduleSlug = normalizeModuleSlug(args.moduleId);
  const moduleRecord = await getOrCreateMarketplaceModule(ctx, moduleSlug);
  if (!moduleRecord) throw new Error("MODULE_NOT_FOUND");
  if (moduleRecord.status === "deprecated" || moduleRecord.status === "suspended" || moduleRecord.status === "banned") {
    throw new Error("MODULE_NOT_AVAILABLE");
  }

  const existing = await findInstall(ctx, args.tenantId, moduleSlug);
  if (existing?.status === "active") {
    return { success: true, moduleId: toLegacyModuleId(moduleSlug), moduleSlug, alreadyInstalled: true };
  }

  const { plan } = await assertCanInstall(ctx, args.tenantId, moduleRecord);
  const now = Date.now();
  const payload = {
    moduleId: moduleRecord._id,
    moduleSlug,
    tenantId: args.tenantId,
    status: "installing" as const,
    billingPeriod: "monthly" as const,
    currentPriceKes: 0,
    hasPriceOverride: false,
    isFree: moduleRecord.isCore,
    firstInstalledAt: existing?.firstInstalledAt ?? now,
    billingStartsAt: now,
    nextBillingDate: now,
    installedAt: now,
    installedBy: args.userId,
    version: moduleRecord.version,
    paymentFailureCount: 0,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const installId = existing
    ? await (async () => {
        await ctx.db.patch(existing._id, payload);
        return existing._id;
      })()
    : await ctx.db.insert("module_installs", payload);

  await runInstallRuntime(ctx, moduleSlug, args.tenantId, args.userId);
  await ctx.db.patch(installId, { status: "active", updatedAt: Date.now() });

  await ctx.db.patch(moduleRecord._id, {
    installCount: (moduleRecord.installCount ?? 0) + (existing ? 0 : 1),
    activeInstallCount: (moduleRecord.activeInstallCount ?? 0) + (existing?.status === "active" ? 0 : 1),
    updatedAt: Date.now(),
  });

  await logAction(ctx, {
    tenantId: args.tenantId,
    actorId: args.userId,
    actorEmail: args.userEmail,
    action: "module.installed",
    entityType: "marketplace_module",
    entityId: moduleSlug,
    after: { moduleSlug, plan },
  });

  return { success: true, moduleId: toLegacyModuleId(moduleSlug), moduleSlug, installId };
}

export const installModule = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    moduleId: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, args);
    requireRole(tenant, "school_admin", "master_admin", "super_admin");
    assertTenantMatch(tenant.tenantId, args.tenantId);
    return await installModuleForTenant(ctx, {
      tenantId: tenant.tenantId,
      userId: tenant.userId,
      userEmail: tenant.email,
      moduleId: args.moduleId,
    });
  },
});

export const uninstallModule = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    moduleId: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, args);
    requireRole(tenant, "school_admin", "master_admin", "super_admin");
    assertTenantMatch(tenant.tenantId, args.tenantId);

    const moduleSlug = normalizeModuleSlug(args.moduleId);
    if (isCoreModuleSlug(moduleSlug)) {
      throw new Error(`CORE_MODULE: Cannot uninstall '${toLegacyModuleId(moduleSlug)}' because it is required by the platform.`);
    }

    const install = await findInstall(ctx, tenant.tenantId, moduleSlug);
    if (!install) throw new Error("MODULE_NOT_INSTALLED");

    const installed = await getGuardInstalledModules(ctx, tenant.tenantId);
    for (const candidate of ALL_MODULES) {
      const candidateSlug = normalizeModuleSlug(candidate.moduleId);
      if (!getCanonicalDependencies(candidateSlug).includes(moduleSlug)) continue;
      const dependentInstall = installed.find(
        (record: any) => normalizeModuleSlug(String(record.moduleSlug ?? record.moduleId)) === candidateSlug
      );
      if (dependentInstall?.status === "active") {
        throw new Error(
          `DEPENDENCY_CONFLICT: Cannot uninstall '${toLegacyModuleId(moduleSlug)}' because '${candidate.moduleId}' depends on it.`
        );
      }
    }

    await runUninstallRuntime(ctx, moduleSlug, tenant.tenantId);
    await ctx.db.patch(install._id, {
      status: "uninstalled",
      uninstalledAt: Date.now(),
      uninstalledBy: tenant.userId,
      dataRetentionEndsAt: Date.now() + 90 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now(),
    });

    const moduleRecord = await ctx.db
      .query("marketplace_modules")
      .withIndex("by_slug", (q) => q.eq("slug", moduleSlug))
      .first();
    if (moduleRecord?._id) {
      await ctx.db.patch(moduleRecord._id, {
        activeInstallCount: Math.max(0, (moduleRecord.activeInstallCount ?? 0) - 1),
        updatedAt: Date.now(),
      });
    }

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "module.uninstalled",
      entityType: "marketplace_module",
      entityId: moduleSlug,
      after: { moduleSlug },
    });

    return { success: true, moduleId: toLegacyModuleId(moduleSlug), moduleSlug };
  },
});

export const updateModuleConfig = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    moduleId: v.string(),
    config: v.any(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, args);
    requireRole(tenant, "school_admin", "master_admin", "super_admin");
    assertTenantMatch(tenant.tenantId, args.tenantId);

    const moduleSlug = normalizeModuleSlug(args.moduleId);
    const moduleRecord = await getOrCreateMarketplaceModule(ctx, moduleSlug);
    if (!moduleRecord) throw new Error("MODULE_NOT_FOUND");

    const install = await findInstall(ctx, tenant.tenantId, moduleSlug);
    if (!install && !isCoreModuleSlug(moduleSlug)) throw new Error("MODULE_NOT_INSTALLED");

    const existing = await ctx.db
      .query("module_access_config")
      .withIndex("by_tenantId_moduleId", (q: any) =>
        q.eq("tenantId", tenant.tenantId).eq("moduleId", moduleRecord._id)
      )
      .first();
    const payload = {
      moduleId: moduleRecord._id,
      moduleSlug,
      tenantId: tenant.tenantId,
      roleAccess: args.config?.roleAccess ?? existing?.roleAccess ?? [],
      config: JSON.stringify(args.config ?? {}),
      updatedBy: tenant.userId,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
    } else {
      await ctx.db.insert("module_access_config", payload);
    }

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "module.config_updated",
      entityType: "marketplace_module",
      entityId: moduleSlug,
      after: { config: args.config },
    });

    return { success: true };
  },
});

export const requestModuleAccess = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    moduleId: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, args);
    assertTenantMatch(tenant.tenantId, args.tenantId);

    const moduleSlug = normalizeModuleSlug(args.moduleId);
    const moduleRecord = await getOrCreateMarketplaceModule(ctx, moduleSlug);
    if (!moduleRecord) throw new Error("MODULE_NOT_FOUND");

    const pending = await ctx.db
      .query("module_requests")
      .withIndex("by_tenant_status", (q: any) => q.eq("tenantId", tenant.tenantId).eq("status", "submitted"))
      .collect();
    if (
      pending.some(
        (request: any) => request.requestedBy === tenant.userId && normalizeModuleSlug(request.moduleId ?? "") === moduleSlug
      )
    ) {
      throw new Error("REQUEST_EXISTS: You already have a pending request for this module");
    }

    await ctx.db.insert("module_requests", {
      tenantId: tenant.tenantId,
      requestedBy: tenant.userId,
      type: "rbac_restricted",
      moduleId: moduleSlug,
      name: moduleRecord.name,
      description: args.reason,
      useCase: args.reason,
      status: "submitted",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "module.access_requested",
      entityType: "marketplace_module",
      entityId: moduleSlug,
      after: { reason: args.reason },
    });

    return { success: true };
  },
});

export const reviewModuleRequest = mutation({
  args: {
    sessionToken: v.string(),
    requestId: v.id("module_requests"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, args);
    requireRole(tenant, "school_admin", "master_admin", "super_admin");

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("REQUEST_NOT_FOUND");
    assertTenantMatch(tenant.tenantId, request.tenantId);

    await ctx.db.patch(args.requestId, {
      status: args.status === "approved" ? "approved_exception_granted" : "rejected",
      resolution: args.notes,
      updatedAt: Date.now(),
    });

    if (args.status === "approved" && request.moduleId) {
      await installModuleForTenant(ctx, {
        tenantId: request.tenantId,
        userId: tenant.userId,
        userEmail: tenant.email,
        moduleId: request.moduleId,
      });
    }

    return { success: true, status: args.status };
  },
});

export const toggleModuleStatus = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    moduleId: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive")),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, args);
    requireRole(tenant, "school_admin", "master_admin", "super_admin");
    assertTenantMatch(tenant.tenantId, args.tenantId);

    const moduleSlug = normalizeModuleSlug(args.moduleId);
    if (args.status === "inactive" && isCoreModuleSlug(moduleSlug)) {
      throw new Error(`CORE_MODULE: Cannot deactivate '${toLegacyModuleId(moduleSlug)}' because it is required by the platform.`);
    }

    const install = await findInstall(ctx, tenant.tenantId, moduleSlug);
    if (!install) throw new Error("MODULE_NOT_INSTALLED");

    if (args.status === "inactive") {
      const installed = await getGuardInstalledModules(ctx, tenant.tenantId);
      for (const candidate of ALL_MODULES) {
        const candidateSlug = normalizeModuleSlug(candidate.moduleId);
        if (!getCanonicalDependencies(candidateSlug).includes(moduleSlug)) continue;
        const dependentInstall = installed.find(
          (record: any) => normalizeModuleSlug(String(record.moduleSlug ?? record.moduleId)) === candidateSlug
        );
        if (dependentInstall?.status === "active") {
          throw new Error(
            `DEPENDENCY_CONFLICT: Cannot disable '${toLegacyModuleId(moduleSlug)}' because '${candidate.moduleId}' depends on it.`
          );
        }
      }
    }

    await ctx.db.patch(install._id, {
      status: args.status === "active" ? "active" : "disabled",
      disabledAt: args.status === "inactive" ? Date.now() : undefined,
      disabledBy: args.status === "inactive" ? tenant.userId : undefined,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "module.status_toggled",
      entityType: "marketplace_module",
      entityId: moduleSlug,
      after: { status: args.status },
    });

    return { success: true };
  },
});

export const seedMarketplaceModules = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });
    let created = 0;
    let updated = 0;

    for (const moduleDefinition of ALL_MODULES) {
      const moduleSlug = normalizeModuleSlug(moduleDefinition.moduleId);
      const payload = buildMarketplacePayload(moduleSlug);
      const existing = await ctx.db
        .query("marketplace_modules")
        .withIndex("by_slug", (q: any) => q.eq("slug", moduleSlug))
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
