import { QueryCtx, MutationCtx } from "../_generated/server";
import { CORE_MODULE_IDS, MODULE_DEPENDENCIES } from "../modules/marketplace/moduleDefinitions";
import { TIER_MODULES } from "../modules/marketplace/tierModules";

/**
 * Checks if a module is installed and active for the given tenant.
 * Throws if the module is not installed or is inactive.
 */
export async function requireModule(
  ctx: QueryCtx | MutationCtx,
  tenantId: string,
  moduleId: string
): Promise<void> {
  // Core modules are always available — skip install check
  if (CORE_MODULE_IDS.includes(moduleId)) {
    return;
  }

  const installed = await getInstalledModule(ctx, tenantId, moduleId);

  if (!installed) {
    throw new Error(
      `MODULE_NOT_INSTALLED: Module '${moduleId}' is not installed for tenant '${tenantId}'`
    );
  }

  if (installed.status !== "active") {
    throw new Error(
      `MODULE_INACTIVE: Module '${moduleId}' is installed but status is '${installed.status}'`
    );
  }

  // Check tier access
  await validateModuleTier(ctx, tenantId, moduleId);

  // Check dependencies
  await validateModuleDependencies(ctx, tenantId, moduleId);
}

/**
 * Checks if a module is installed (any status) for the given tenant.
 * Returns the installed module record or null.
 */
export async function getInstalledModule(
  ctx: QueryCtx | MutationCtx,
  tenantId: string,
  moduleId: string
) {
  return await ctx.db
    .query("installedModules")
    .withIndex("by_tenant_module", (q) =>
      q.eq("tenantId", tenantId).eq("moduleId", moduleId)
    )
    .first();
}

/**
 * Validates that the tenant's tier allows access to the requested module
 */
async function validateModuleTier(
  ctx: QueryCtx | MutationCtx,
  tenantId: string,
  moduleId: string
): Promise<void> {
  // Get tenant tier
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

  // Core modules are always available regardless of tier
  if (CORE_MODULE_IDS.includes(moduleId)) {
    return;
  }

  // Check if module is available for this tier
  const availableModules = TIER_MODULES[tier as keyof typeof TIER_MODULES] || TIER_MODULES.free;

  if (!availableModules.includes(moduleId)) {
    throw new Error(
      `MODULE_NOT_AVAILABLE_FOR_TIER: Module '${moduleId}' is not available for tier '${tier}'`
    );
  }
}

/**
 * Validates that all required dependencies for a module are installed and active
 */
async function validateModuleDependencies(
  ctx: QueryCtx | MutationCtx,
  tenantId: string,
  moduleId: string
): Promise<void> {
  const dependencies = MODULE_DEPENDENCIES[moduleId as keyof typeof MODULE_DEPENDENCIES];
  
  if (!dependencies || dependencies.length === 0) {
    return; // No dependencies to check
  }

  // Check each dependency
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

/**
 * Gets the configuration for an installed module
 */
export async function getModuleConfig(
  ctx: QueryCtx | MutationCtx,
  tenantId: string,
  moduleId: string
): Promise<any> {
  const installed = await getInstalledModule(ctx, tenantId, moduleId);
  
  if (!installed) {
    throw new Error(
      `MODULE_NOT_INSTALLED: Module '${moduleId}' is not installed for tenant '${tenantId}'`
    );
  }

  return installed.config || {};
}

/**
 * Activates a module for a tenant
 */
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
    return true; // Already active
  }

  // Validate tier and dependencies before activation
  await validateModuleTier(ctx, tenantId, moduleId);
  await validateModuleDependencies(ctx, tenantId, moduleId);

  // Activate the module
  await ctx.db.patch(installed._id, { status: "active" });
  
  return true;
}

/**
 * Deactivates a module for a tenant
 */
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
    return true; // Already inactive
  }

  // Check if other modules depend on this one
  const dependentModules = Object.entries(MODULE_DEPENDENCIES)
    .filter(([_, deps]) => deps.includes(moduleId))
    .map(([moduleId]) => moduleId);

  if (dependentModules.length > 0) {
    // Check if any dependent modules are active
    for (const depModuleId of dependentModules) {
      const depModule = await getInstalledModule(ctx, tenantId, depModuleId);
      if (depModule && depModule.status === "active") {
        throw new Error(
          `CANNOT_DEACTIVATE: Module '${moduleId}' is required by active module '${depModuleId}'`
        );
      }
    }
  }

  // Deactivate the module
  await ctx.db.patch(installed._id, { status: "inactive" });
  
  return true;
}
