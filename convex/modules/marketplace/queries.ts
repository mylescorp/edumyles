import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requireTenantSession } from "../../helpers/tenantGuard";
import { requireRole } from "../../helpers/authorize";
import { TIER_MODULES } from "./tierModules";
import { CORE_MODULE_IDS, ALL_MODULES, MODULE_DEPENDENCIES } from "./moduleDefinitions";

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
    if (!args.sessionToken || args.sessionToken.trim() === "") {
      console.log("getInstalledModules called without a session token, returning []");
      return [];
    }

    let tenantId: string;
    try {
      const tenantContext = await requireTenantSession(ctx, args);
      tenantId = tenantContext.tenantId;
    } catch (sessionError) {
      console.error("getInstalledModules session validation failed:", sessionError);
      return [];
    }

    try {
      const installed = await ctx.db
        .query("installedModules")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
        .collect();

      const installedById = new Map(installed.map((mod) => [mod.moduleId, mod]));
      const coreInstalled = ALL_MODULES
        .filter((mod) => CORE_MODULE_IDS.includes(mod.moduleId))
        .map((mod) => {
          const existing = installedById.get(mod.moduleId);
          return existing ?? {
            _id: (`core:${mod.moduleId}`) as any,
            _creationTime: 0,
            tenantId,
            moduleId: mod.moduleId,
            installedAt: 0,
            installedBy: "system",
            config: {},
            status: "active" as const,
            updatedAt: 0,
          };
        });

      const optionalInstalled = installed.filter(
        (mod) => !CORE_MODULE_IDS.includes(mod.moduleId)
      );

      return [...coreInstalled, ...optionalInstalled];
    } catch (dbError) {
      console.error("getInstalledModules query failed:", dbError);
      return ALL_MODULES.filter((mod) => CORE_MODULE_IDS.includes(mod.moduleId)).map((mod) => ({
        _id: (`core:${mod.moduleId}`) as any,
        _creationTime: 0,
        tenantId,
        moduleId: mod.moduleId,
        installedAt: 0,
        installedBy: "system",
        config: {},
        status: "active" as const,
        updatedAt: 0,
      }));
    }
  },
});

export const getInstalledModuleIds = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    console.log("getInstalledModuleIds called with:", {
      sessionToken: args.sessionToken ? "present" : "missing"
    });

    // First validate sessionToken exists
    if (!args.sessionToken || args.sessionToken.trim() === "") {
      console.log("No session token provided, returning core modules");
      return CORE_MODULE_IDS;
    }

    let tenantId;
    try {
      const tenantContext = await requireTenantSession(ctx, args);
      tenantId = tenantContext.tenantId;
      console.log("getInstalledModuleIds tenant context:", { tenantId });
    } catch (sessionError) {
      console.error("Session validation failed:", sessionError);
      console.log("Falling back to core modules due to session error");
      return CORE_MODULE_IDS;
    }

    // Platform admins are not tenants — return all module IDs as "installed"
    if (tenantId === "PLATFORM") {
      console.log("Platform admin detected, returning all module IDs");
      return ALL_MODULES.map((m) => m.moduleId);
    }

    try {
      // Check if installedModules table exists by attempting a simple query first
      console.log("Attempting to query installedModules table...");
      
      const installed = await ctx.db
        .query("installedModules")
        .withIndex("by_tenant_status", (q) =>
          q.eq("tenantId", tenantId).eq("status", "active")
        )
        .collect();

      console.log("getInstalledModuleIds found installed modules:", installed.length);

      const installedIds = installed.map((m) => m.moduleId);
      const allIds = new Set([...CORE_MODULE_IDS, ...installedIds]);
      const result = Array.from(allIds);
      
      console.log("getInstalledModuleIds returning:", {
        coreModules: CORE_MODULE_IDS.length,
        installedModules: installedIds.length,
        totalModules: result.length
      });

      return result;
    } catch (dbError) {
      console.error("Database query failed:", dbError);
      console.log("Falling back to core modules only due to database error");
      return CORE_MODULE_IDS;
    }
  },
});

export const getAvailableForTier = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    if (!args.sessionToken || args.sessionToken.trim() === "") {
      return buildFallbackModules([]);
    }

    let tenantId: string;
    try {
      const tenantContext = await requireTenantSession(ctx, args);
      tenantId = tenantContext.tenantId;
    } catch (sessionError) {
      console.error("getAvailableForTier session validation failed:", sessionError);
      return buildFallbackModules([]);
    }

    // Platform admins see all modules as available
    if (tenantId === "PLATFORM") {
      const allModuleIds = ALL_MODULES.map((m) => m.moduleId);
      const dbModules = await ctx.db.query("moduleRegistry").collect();
      if (dbModules.length === 0) {
        return buildFallbackModules(allModuleIds);
      }
      return dbModules.map((mod) => ({
        ...mod,
        isCore: mod.isCore ?? CORE_MODULE_IDS.includes(mod.moduleId),
        availableForTier: true,
      }));
    }

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

    const installedState = installed
      ? {
          status: installed.status,
          installedAt: installed.installedAt,
          installedBy: installed.installedBy,
          config: installed.config,
        }
      : CORE_MODULE_IDS.includes(args.moduleId)
        ? {
            status: "active" as const,
            installedAt: 0,
            installedBy: "system",
            config: {},
          }
        : null;

    return {
      ...registryModule,
      installed: installedState,
      availableForTier:
        CORE_MODULE_IDS.includes(args.moduleId) ||
        allowedModuleIds.includes(args.moduleId),
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

    const requests = args.status
      ? await ctx.db
        .query("moduleRequests")
        .withIndex("by_tenant_status", (q) =>
          q.eq("tenantId", tenantId).eq("status", args.status!)
        )
        .collect()
      : await ctx.db
          .query("moduleRequests")
          .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
          .collect();

    return await Promise.all(
      requests.map(async (request) => {
        const registryModule =
          (await ctx.db
            .query("moduleRegistry")
            .withIndex("by_module_id", (q) => q.eq("moduleId", request.moduleId))
            .first()) ??
          ALL_MODULES.find((mod) => mod.moduleId === request.moduleId);

        return {
          ...request,
          moduleName: registryModule?.name ?? request.moduleId,
        };
      })
    );
  },
});

/**
 * Public query that checks whether a tenant can install a given module and
 * returns one of five access statuses so the UI can route to the right flow.
 * Mirrors the logic in the internalMutation checkModuleAccess.
 */
export const getModuleAccessStatus = query({
  args: { sessionToken: v.string(), moduleId: v.string() },
  handler: async (ctx, args): Promise<{
    status: "allowed" | "plan_upgrade_required" | "rbac_escalation_required" | "payment_required" | "waitlist_only";
    reason: string;
    platformPriceKes?: number;
  }> => {
    const { tenantId } = await requireTenantSession(ctx, args);

    // Resolve module from registry or static definitions
    const registryModule =
      (await ctx.db
        .query("moduleRegistry")
        .withIndex("by_module_id", (q) => q.eq("moduleId", args.moduleId))
        .first()) ??
      (ALL_MODULES.find((m) => m.moduleId === args.moduleId) as any ?? null);

    if (!registryModule) {
      return { status: "waitlist_only", reason: "Module not found" };
    }

    if (registryModule.status && registryModule.status !== "published") {
      return { status: "waitlist_only", reason: "Module is not yet published" };
    }

    // Core modules are always allowed
    if (CORE_MODULE_IDS.includes(args.moduleId)) {
      return { status: "allowed", reason: "Core module" };
    }

    // Check pilot grant
    const pilotGrant = await ctx.db
      .query("pilot_grants")
      .withIndex("by_tenant_status", (q) => q.eq("tenantId", tenantId).eq("status", "active"))
      .collect();
    const activePilot = pilotGrant.find(
      (g) =>
        (g as any).moduleId === args.moduleId &&
        (!((g as any).endDate) || (g as any).endDate >= Date.now())
    );
    if (activePilot) {
      return { status: "allowed", reason: "Pilot grant active" };
    }

    // Check exception grant
    const exceptionGrant = await ctx.db
      .query("module_exception_grants")
      .withIndex("by_tenant_module", (q) =>
        q.eq("tenantId", tenantId).eq("moduleId", String(registryModule._id ?? args.moduleId))
      )
      .first();
    if (exceptionGrant && (!exceptionGrant.expiresAt || exceptionGrant.expiresAt >= Date.now())) {
      return { status: "allowed", reason: "Exception grant active" };
    }

    // Check plan tier
    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenantId))
      .first();
    const plan = tenant?.plan ?? "free";
    const allowedForPlan = TIER_MODULES[plan] ?? [];
    if (!allowedForPlan.includes(args.moduleId)) {
      return { status: "plan_upgrade_required", reason: `Module requires a higher plan (current: ${plan})` };
    }

    // RBAC check — if module declares required roles, at least one active user must have it
    if (Array.isArray(registryModule.supportedRoles) && registryModule.supportedRoles.length > 0) {
      const tenantUsers = await ctx.db
        .query("users")
        .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenantId))
        .collect();
      const hasEligibleRole = tenantUsers.some(
        (user: any) => user.isActive && registryModule.supportedRoles.includes(user.role)
      );
      if (!hasEligibleRole) {
        return {
          status: "rbac_escalation_required",
          reason: `No active users with roles: ${registryModule.supportedRoles.join(", ")}`,
        };
      }
    }

    // Dependency check
    const deps = MODULE_DEPENDENCIES[args.moduleId] ?? [];
    for (const dep of deps) {
      const depInstall = await ctx.db
        .query("installedModules")
        .withIndex("by_tenant_module", (q) => q.eq("tenantId", tenantId).eq("moduleId", dep))
        .first();
      if (!depInstall || depInstall.status !== "active") {
        return {
          status: "waitlist_only",
          reason: `Missing dependency: ${dep} must be installed and active first`,
        };
      }
    }

    // Payment check
    const successfulPayment = await ctx.db
      .query("module_payments")
      .withIndex("by_tenant_status", (q) =>
        q.eq("tenantId", tenantId).eq("status", "success")
      )
      .filter((q) => q.eq(q.field("moduleId"), args.moduleId))
      .collect();
    const hasSuccessfulPayment = successfulPayment.some(
      (payment) => payment.status === "success"
    );

    if (
      registryModule.platformPriceKes &&
      registryModule.platformPriceKes > 0 &&
      !hasSuccessfulPayment
    ) {
      return {
        status: "payment_required",
        reason: "Module requires a one-time payment",
        platformPriceKes: registryModule.platformPriceKes,
      };
    }

    return { status: "allowed", reason: "Access granted" };
  },
});
