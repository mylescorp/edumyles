import { query } from "../../_generated/server";
import { v } from "convex/values";
import { Id } from "../../_generated/dataModel";
import { requirePlatformSession } from "../../helpers/platformGuard";

/**
 * List all custom roles, optionally filtered by tenant.
 */
export const listCustomRoles = query({
  args: {
    sessionToken: v.string(),
    tenantId: v.optional(v.string()),
    includeSystem: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    // Always scope to a tenantId: use the provided one or fall back to the actor's own tenant.
    // master_admin with no tenantId arg will see platform-level roles (tenantId undefined/null),
    // but should not see every other tenant's roles; callers must pass tenantId explicitly for
    // cross-tenant queries.
    const scopedTenantId = args.tenantId ?? actor.tenantId;

    let rolesQuery;
    {
      const tenantId = scopedTenantId;
      rolesQuery = ctx.db
        .query("customRoles")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId));
    }

    const roles = await rolesQuery.order("desc").collect();

    if (args.includeSystem === false) {
      return roles.filter((r) => !r.isSystem);
    }

    return roles;
  },
});

/**
 * List all permission groups, optionally filtered by module.
 */
export const listPermissionGroups = query({
  args: {
    sessionToken: v.string(),
    module: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    if (args.module) {
      const mod = args.module;
      return await ctx.db
        .query("permissionGroups")
        .withIndex("by_module", (q) => q.eq("module", mod))
        .collect();
    }

    return await ctx.db.query("permissionGroups").collect();
  },
});

/**
 * Get a single role by ID.
 */
export const getRoleById = query({
  args: {
    sessionToken: v.string(),
    roleId: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const role = await ctx.db.get(args.roleId as Id<"customRoles">);
    if (!role) throw new Error("Role not found");
    return role;
  },
});
