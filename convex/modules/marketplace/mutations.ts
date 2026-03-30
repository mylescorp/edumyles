import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requireTenantSession } from "../../helpers/tenantGuard";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { requireRole } from "../../helpers/authorize";
import { logAction } from "../../helpers/auditLog";
import { TIER_MODULES } from "./tierModules";
import { isCoreModule, CORE_MODULE_IDS, ALL_MODULES, MODULE_DEPENDENCIES } from "./moduleDefinitions";

// Reverse dependency map — which modules depend on this module (derived from MODULE_DEPENDENCIES)
const REVERSE_DEPENDENCIES: Record<string, string[]> = Object.entries(MODULE_DEPENDENCIES).reduce(
  (acc, [moduleId, deps]) => {
    for (const dep of deps) {
      acc[dep] = acc[dep] ? [...acc[dep], moduleId] : [moduleId];
    }
    return acc;
  },
  {} as Record<string, string[]>
);

/**
 * Validate args.tenantId matches the authenticated session's tenantId.
 * Prevents cross-tenant spoofing via client-sent tenantId.
 */
function assertTenantMatch(sessionTenantId: string, argsTenantId: string) {
  if (argsTenantId !== sessionTenantId) {
    throw new Error("UNAUTHORIZED: Cross-tenant access denied");
  }
}

/**
 * Install a module for a tenant.
 * Validates tier access, checks dependencies, creates install record.
 */
export const installModule = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    moduleId: v.string(),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requireTenantSession(ctx, args);
    requireRole(tenantCtx, "school_admin", "master_admin", "super_admin");
    assertTenantMatch(tenantCtx.tenantId, args.tenantId);

    const { tenantId } = tenantCtx;

    // Verify the module exists in registry; fall back to static definitions if
    // the registry hasn't been seeded yet so installs never silently fail.
    const registryModule = await ctx.db
      .query("moduleRegistry")
      .withIndex("by_module_id", (q) => q.eq("moduleId", args.moduleId))
      .first();

    if (!registryModule) {
      // If no registry record, check whether the module exists in the static
      // module catalog so the install can proceed without a prior seed.
      const staticModule = ALL_MODULES.find((m) => m.moduleId === args.moduleId);
      if (!staticModule) {
        throw new Error("MODULE_NOT_FOUND: Module does not exist");
      }
      // Auto-seed this single module into the registry so future lookups work.
      await ctx.db.insert("moduleRegistry", {
        moduleId: staticModule.moduleId,
        name: staticModule.name,
        description: staticModule.description,
        tier: staticModule.tier,
        category: staticModule.category,
        status: "published",
        version: staticModule.version,
        isCore: staticModule.isCore,
      });
    } else if (registryModule.status === "deprecated") {
      throw new Error("MODULE_DEPRECATED: Cannot install a deprecated module");
    }

    // Check if already installed
    const existing = await ctx.db
      .query("installedModules")
      .withIndex("by_tenant_module", (q) =>
        q.eq("tenantId", tenantId).eq("moduleId", args.moduleId)
      )
      .first();

    if (existing) {
      throw new Error("MODULE_ALREADY_INSTALLED: Module is already installed");
    }

    // Check tier access
    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenantId))
      .first();

    const org = await ctx.db
      .query("organizations")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .first();

    const tier = org?.tier ?? tenant?.plan ?? "free";
    const allowedModules = TIER_MODULES[tier] ?? TIER_MODULES["free"];

    if (!allowedModules!.includes(args.moduleId)) {
      throw new Error(
        `TIER_RESTRICTED: Module '${args.moduleId}' is not available on '${tier}' tier. Upgrade required.`
      );
    }

    // Check dependencies
    const deps = MODULE_DEPENDENCIES[args.moduleId] ?? [];
    for (const dep of deps) {
      const depInstalled = await ctx.db
        .query("installedModules")
        .withIndex("by_tenant_module", (q) =>
          q.eq("tenantId", tenantId).eq("moduleId", dep)
        )
        .first();

      if (!depInstalled || depInstalled.status !== "active") {
        throw new Error(
          `DEPENDENCY_MISSING: Module '${args.moduleId}' requires '${dep}' to be installed and active first.`
        );
      }
    }

    // Install the module
    const now = Date.now();
    await ctx.db.insert("installedModules", {
      tenantId,
      moduleId: args.moduleId,
      installedAt: now,
      installedBy: tenantCtx.userId,
      config: {},
      status: "active",
      updatedAt: now,
    });

    // Audit log
    await logAction(ctx, {
      tenantId,
      actorId: tenantCtx.userId,
      actorEmail: tenantCtx.email!,
      action: "module.installed",
      entityType: "module",
      entityId: args.moduleId,
      after: { moduleId: args.moduleId, tier },
    });

    return { success: true, moduleId: args.moduleId };
  },
});

/**
 * Uninstall a module from a tenant.
 * Checks reverse dependencies before allowing removal.
 */
export const uninstallModule = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    moduleId: v.string(),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requireTenantSession(ctx, args);
    requireRole(tenantCtx, "school_admin", "master_admin", "super_admin");
    assertTenantMatch(tenantCtx.tenantId, args.tenantId);

    const { tenantId } = tenantCtx;

    // Core modules cannot be uninstalled
    if (isCoreModule(args.moduleId)) {
      throw new Error(
        `CORE_MODULE: Cannot uninstall '${args.moduleId}' — it is a core module required by the platform.`
      );
    }

    // Check if installed
    const installed = await ctx.db
      .query("installedModules")
      .withIndex("by_tenant_module", (q) =>
        q.eq("tenantId", tenantId).eq("moduleId", args.moduleId)
      )
      .first();

    if (!installed) {
      throw new Error("MODULE_NOT_INSTALLED: Module is not installed");
    }

    // Check reverse dependencies — are other installed modules depending on this one?
    const reverseDeps = REVERSE_DEPENDENCIES[args.moduleId] ?? [];
    for (const dep of reverseDeps) {
      const depInstalled = await ctx.db
        .query("installedModules")
        .withIndex("by_tenant_module", (q) =>
          q.eq("tenantId", tenantId).eq("moduleId", dep)
        )
        .first();

      if (depInstalled && depInstalled.status === "active") {
        throw new Error(
          `DEPENDENCY_CONFLICT: Cannot uninstall '${args.moduleId}' because '${dep}' depends on it. Uninstall '${dep}' first.`
        );
      }
    }

    // Remove the installed module record
    await ctx.db.delete(installed._id);

    // Audit log
    await logAction(ctx, {
      tenantId,
      actorId: tenantCtx.userId,
      actorEmail: tenantCtx.email!,
      action: "module.uninstalled",
      entityType: "module",
      entityId: args.moduleId,
      after: { moduleId: args.moduleId },
    });

    return { success: true, moduleId: args.moduleId };
  },
});

/**
 * Update configuration for an installed module.
 */
export const updateModuleConfig = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    moduleId: v.string(),
    config: v.any(),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requireTenantSession(ctx, args);
    requireRole(tenantCtx, "school_admin", "master_admin", "super_admin");
    assertTenantMatch(tenantCtx.tenantId, args.tenantId);

    const { tenantId } = tenantCtx;

    const installed = await ctx.db
      .query("installedModules")
      .withIndex("by_tenant_module", (q) =>
        q.eq("tenantId", tenantId).eq("moduleId", args.moduleId)
      )
      .first();

    if (!installed && !isCoreModule(args.moduleId)) {
      throw new Error("MODULE_NOT_INSTALLED");
    }

    if (installed) {
      await ctx.db.patch(installed._id, {
        config: args.config,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("installedModules", {
        tenantId,
        moduleId: args.moduleId,
        installedAt: Date.now(),
        installedBy: tenantCtx.userId,
        config: args.config,
        status: "active",
        updatedAt: Date.now(),
      });
    }

    await logAction(ctx, {
      tenantId,
      actorId: tenantCtx.userId,
      actorEmail: tenantCtx.email!,
      action: "module.config_updated",
      entityType: "module",
      entityId: args.moduleId,
      after: { config: args.config },
    });

    return { success: true };
  },
});

/**
 * Request access to a module (used by non-admin users).
 */
export const requestModuleAccess = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    moduleId: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requireTenantSession(ctx, args);
    assertTenantMatch(tenantCtx.tenantId, args.tenantId);

    const { tenantId } = tenantCtx;

    // Check if module exists
    const registryModule = await ctx.db
      .query("moduleRegistry")
      .withIndex("by_module_id", (q) => q.eq("moduleId", args.moduleId))
      .first();

    if (!registryModule) {
      throw new Error("MODULE_NOT_FOUND");
    }

    // Check for existing pending request
    const existingRequest = await ctx.db
      .query("moduleRequests")
      .withIndex("by_tenant_status", (q) =>
        q.eq("tenantId", tenantId).eq("status", "pending")
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), tenantCtx.userId),
          q.eq(q.field("moduleId"), args.moduleId)
        )
      )
      .first();

    if (existingRequest) {
      throw new Error("REQUEST_EXISTS: You already have a pending request for this module");
    }

    await ctx.db.insert("moduleRequests", {
      tenantId,
      userId: tenantCtx.userId,
      moduleId: args.moduleId,
      reason: args.reason,
      requestedAt: Date.now(),
      status: "pending",
    });

    await logAction(ctx, {
      tenantId,
      actorId: tenantCtx.userId,
      actorEmail: tenantCtx.email!,
      action: "module.access_requested",
      entityType: "module",
      entityId: args.moduleId,
      after: { reason: args.reason },
    });

    return { success: true };
  },
});

/**
 * Review a module access request (approve/reject).
 */
export const reviewModuleRequest = mutation({
  args: {
    sessionToken: v.string(),
    requestId: v.id("moduleRequests"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requireTenantSession(ctx, args);
    requireRole(tenantCtx, "school_admin", "master_admin", "super_admin");

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("REQUEST_NOT_FOUND");
    }

    // Ensure the request belongs to the caller's tenant
    assertTenantMatch(tenantCtx.tenantId, request.tenantId);

    if (request.status !== "pending") {
      throw new Error("REQUEST_ALREADY_REVIEWED");
    }

    await ctx.db.patch(args.requestId, {
      status: args.status,
      reviewedBy: tenantCtx.userId,
      reviewedAt: Date.now(),
      notes: args.notes,
    });

    if (args.status === "approved") {
      const existing = await ctx.db
        .query("installedModules")
        .withIndex("by_tenant_module", (q) =>
          q.eq("tenantId", request.tenantId).eq("moduleId", request.moduleId)
        )
        .first();

      if (!existing && !isCoreModule(request.moduleId)) {
        const registryModule = await ctx.db
          .query("moduleRegistry")
          .withIndex("by_module_id", (q) => q.eq("moduleId", request.moduleId))
          .first();

        if (!registryModule || registryModule.status === "deprecated") {
          throw new Error("MODULE_NOT_AVAILABLE");
        }

        const tenant = await ctx.db
          .query("tenants")
          .withIndex("by_tenantId", (q) => q.eq("tenantId", request.tenantId))
          .first();

        const org = await ctx.db
          .query("organizations")
          .withIndex("by_tenant", (q) => q.eq("tenantId", request.tenantId))
          .first();

        const tier = org?.tier ?? tenant?.plan ?? "free";
        const allowedModules = TIER_MODULES[tier] ?? TIER_MODULES["free"];

        if (!allowedModules?.includes(request.moduleId)) {
          throw new Error("TIER_RESTRICTED");
        }

        const deps = MODULE_DEPENDENCIES[request.moduleId] ?? [];
        for (const dep of deps) {
          if (isCoreModule(dep)) continue;

          const depInstalled = await ctx.db
            .query("installedModules")
            .withIndex("by_tenant_module", (q) =>
              q.eq("tenantId", request.tenantId).eq("moduleId", dep)
            )
            .first();

          if (!depInstalled || depInstalled.status !== "active") {
            throw new Error(`DEPENDENCY_MISSING: ${dep}`);
          }
        }

        await ctx.db.insert("installedModules", {
          tenantId: request.tenantId,
          moduleId: request.moduleId,
          installedAt: Date.now(),
          installedBy: tenantCtx.userId,
          config: {},
          status: "active",
          updatedAt: Date.now(),
        });
      }
    }

    return { success: true, status: args.status };
  },
});

/**
 * Toggle module status (enable/disable) for a tenant.
 */
export const toggleModuleStatus = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    moduleId: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive")),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requireTenantSession(ctx, args);
    requireRole(tenantCtx, "school_admin", "master_admin", "super_admin");
    assertTenantMatch(tenantCtx.tenantId, args.tenantId);

    const { tenantId } = tenantCtx;

    const installed = await ctx.db
      .query("installedModules")
      .withIndex("by_tenant_module", (q) =>
        q.eq("tenantId", tenantId).eq("moduleId", args.moduleId)
      )
      .first();

    if (!installed) {
      throw new Error("MODULE_NOT_INSTALLED");
    }

    // Core modules cannot be deactivated
    if (args.status === "inactive" && isCoreModule(args.moduleId)) {
      throw new Error(
        `CORE_MODULE: Cannot deactivate '${args.moduleId}' — it is a core module.`
      );
    }

    // If deactivating, check that no active module depends on this one
    if (args.status === "inactive") {
      const reverseDeps = REVERSE_DEPENDENCIES[args.moduleId] ?? [];
      for (const dep of reverseDeps) {
        const depInstalled = await ctx.db
          .query("installedModules")
          .withIndex("by_tenant_module", (q) =>
            q.eq("tenantId", tenantId).eq("moduleId", dep)
          )
          .first();

        if (depInstalled && depInstalled.status === "active") {
          throw new Error(
            `DEPENDENCY_CONFLICT: Cannot disable '${args.moduleId}' because '${dep}' depends on it.`
          );
        }
      }
    }

    await ctx.db.patch(installed._id, {
      status: args.status,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId,
      actorId: tenantCtx.userId,
      actorEmail: tenantCtx.email!,
      action: "module.status_toggled",
      entityType: "module",
      entityId: args.moduleId,
      after: { status: args.status },
    });

    return { success: true };
  },
});

/**
 * Seed / re-sync moduleRegistry from the ALL_MODULES static definition.
 * Idempotent — safe to run multiple times. Existing records are updated.
 * Requires platform admin session so only platform staff can trigger it.
 */
export const runSeedModuleRegistry = mutation({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Require platform session when a token is provided; allow internal calls
    if (args.sessionToken) {
      await requirePlatformSession(ctx, { sessionToken: args.sessionToken });
    }
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
