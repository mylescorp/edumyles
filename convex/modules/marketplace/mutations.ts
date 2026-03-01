import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requireRole } from "../../helpers/authorize";
import { logAction } from "../../helpers/auditLog";
import { TIER_MODULES } from "./tierModules";

// Module dependency map — some modules require others to be installed first
const MODULE_DEPENDENCIES: Record<string, string[]> = {
  academics: ["sis"],
  admissions: ["sis"],
  finance: ["sis"],
  timetable: ["sis", "academics"],
  hr: [],
  library: ["sis"],
  transport: ["sis"],
  communications: [],
  ewallet: ["finance"],
  ecommerce: ["ewallet"],
};

// Reverse dependency map — which modules depend on this module
const REVERSE_DEPENDENCIES: Record<string, string[]> = {
  sis: ["academics", "admissions", "finance", "timetable", "library", "transport"],
  academics: ["timetable"],
  finance: ["ewallet"],
  ewallet: ["ecommerce"],
};

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
    tenantId: v.string(),
    moduleId: v.string(),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requireTenantContext(ctx);
    requireRole(tenantCtx, "school_admin", "master_admin", "super_admin");
    assertTenantMatch(tenantCtx.tenantId, args.tenantId);

    const { tenantId } = tenantCtx;

    // Verify the module exists in registry
    const registryModule = await ctx.db
      .query("moduleRegistry")
      .withIndex("by_module_id", (q) => q.eq("moduleId", args.moduleId))
      .first();

    if (!registryModule) {
      throw new Error("MODULE_NOT_FOUND: Module does not exist in registry");
    }

    if (registryModule.status === "deprecated") {
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
      userId: tenantCtx.userId,
      action: "module.installed",
      targetId: args.moduleId,
      targetType: "module",
      details: { moduleId: args.moduleId, tier },
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
    tenantId: v.string(),
    moduleId: v.string(),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requireTenantContext(ctx);
    requireRole(tenantCtx, "school_admin", "master_admin", "super_admin");
    assertTenantMatch(tenantCtx.tenantId, args.tenantId);

    const { tenantId } = tenantCtx;

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
      userId: tenantCtx.userId,
      action: "module.uninstalled",
      targetId: args.moduleId,
      targetType: "module",
      details: { moduleId: args.moduleId },
    });

    return { success: true, moduleId: args.moduleId };
  },
});

/**
 * Update configuration for an installed module.
 */
export const updateModuleConfig = mutation({
  args: {
    tenantId: v.string(),
    moduleId: v.string(),
    config: v.any(),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requireTenantContext(ctx);
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

    await ctx.db.patch(installed._id, {
      config: args.config,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Request access to a module (used by non-admin users).
 */
export const requestModuleAccess = mutation({
  args: {
    tenantId: v.string(),
    moduleId: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requireTenantContext(ctx);
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
    const existingRequests = await ctx.db
      .query("moduleRequests")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .collect();

    const hasPending = existingRequests.some(
      (r) =>
        r.userId === tenantCtx.userId &&
        r.moduleId === args.moduleId &&
        r.status === "pending"
    );

    if (hasPending) {
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

    return { success: true };
  },
});

/**
 * Review a module access request (approve/reject).
 */
export const reviewModuleRequest = mutation({
  args: {
    requestId: v.id("moduleRequests"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requireTenantContext(ctx);
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

    return { success: true, status: args.status };
  },
});

/**
 * Toggle module status (enable/disable) for a tenant.
 */
export const toggleModuleStatus = mutation({
  args: {
    tenantId: v.string(),
    moduleId: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive")),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requireTenantContext(ctx);
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

    return { success: true };
  },
});
