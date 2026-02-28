import { QueryCtx, MutationCtx } from "../_generated/server";

/**
 * Checks if a module is installed and active for the given tenant.
 * Throws if the module is not installed or is inactive.
 */
export async function requireModule(
  ctx: QueryCtx | MutationCtx,
  tenantId: string,
  moduleId: string
): Promise<void> {
  const installed = await ctx.db
    .query("installedModules")
    .withIndex("by_tenant_module", (q) =>
      q.eq("tenantId", tenantId).eq("moduleId", moduleId)
    )
    .first();

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
