import { v } from "convex/values";
import { mutation, query, QueryCtx, MutationCtx } from "../../_generated/server";
import { requireTenantSession } from "../../helpers/tenantGuard";

// Role hierarchy for permission checking
const ROLE_HIERARCHY = {
  viewer: 0,
  member: 1,
  admin: 2,
} as const;

type PmRole = keyof typeof ROLE_HIERARCHY;
type PmScope = "global" | "workspace" | "project";

/**
 * Get the effective role for a user in a given scope
 * Priority: project > workspace > global
 */
export async function getEffectivePmRole(
  ctx: QueryCtx,
  userId: string,
  workspaceId?: string,
  projectId?: string
): Promise<PmRole> {
  // Check project-level role first (highest priority)
  if (projectId) {
    const projectRole = await ctx.db
      .query("pmRoles")
      .withIndex("by_user_scope", (q) =>
        q
          .eq("userId", userId)
          .eq("scope", "project")
          .eq("scopeId", projectId)
      )
      .first();
    
    if (projectRole) {
      return projectRole.role as PmRole;
    }
  }

  // Check workspace-level role second
  if (workspaceId) {
    const workspaceRole = await ctx.db
      .query("pmRoles")
      .withIndex("by_user_scope", (q) =>
        q
          .eq("userId", userId)
          .eq("scope", "workspace")
          .eq("scopeId", workspaceId)
      )
      .first();
    
    if (workspaceRole) {
      return workspaceRole.role as PmRole;
    }
  }

  // Check global role last (lowest priority)
  const globalRole = await ctx.db
    .query("pmRoles")
    .withIndex("by_user_scope", (q) =>
      q
        .eq("userId", userId)
        .eq("scope", "global")
    )
    .first();

  return (globalRole?.role || "viewer") as PmRole;
}

/**
 * Check if a user has the required minimum role level
 */
export function hasMinimumRole(userRole: PmRole, requiredRole: PmRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Helper function to require PM role access in mutations/queries
 */
export async function requirePmRole(
  ctx: QueryCtx | MutationCtx,
  args: { sessionToken: string },
  minRole: PmRole = "member",
  workspaceId?: string,
  projectId?: string
) {
  const tenantCtx = await requireTenantSession(ctx, args);
  
  if (!tenantCtx) {
    throw new Error("AUTHENTICATION_REQUIRED");
  }

  const effectiveRole = await getEffectivePmRole(
    ctx,
    tenantCtx.userId,
    workspaceId,
    projectId
  );
  
  if (!hasMinimumRole(effectiveRole, minRole)) {
    throw new Error("INSUFFICIENT_PERMISSIONS");
  }

  return {
    ...tenantCtx,
    userRole: effectiveRole,
  };
}

// Queries
export const getUserPmRoles = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requireTenantSession(ctx, args);
    
    const roles = await ctx.db
      .query("pmRoles")
      .withIndex("by_user_scope", (q) => q.eq("userId", tenantCtx.userId))
      .collect();

    return roles;
  },
});

export const getEffectiveRole = query({
  args: {
    sessionToken: v.string(),
    workspaceId: v.optional(v.string()),
    projectId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requireTenantSession(ctx, args);
    
    const effectiveRole = await getEffectivePmRole(
      ctx,
      tenantCtx.userId,
      args.workspaceId,
      args.projectId
    );

    return { role: effectiveRole };
  },
});

// Mutations
export const assignPmRole = mutation({
  args: {
    sessionToken: v.string(),
    userId: v.string(),
    scope: v.union(v.literal("global"), v.literal("workspace"), v.literal("project")),
    scopeId: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("member"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    await requirePmRole(ctx, args, "admin");

    // Check if role assignment already exists
    const existing = await ctx.db
      .query("pmRoles")
      .withIndex("by_user_scope", (q) =>
        q
          .eq("userId", args.userId)
          .eq("scope", args.scope)
          .eq("scopeId", args.scopeId || "")
      )
      .first();

    if (existing) {
      // Update existing role
      await ctx.db.patch(existing._id, {
        role: args.role,
      });
      return existing._id;
    } else {
      // Create new role assignment
      const roleId = await ctx.db.insert("pmRoles", {
        userId: args.userId,
        scope: args.scope,
        scopeId: args.scopeId,
        role: args.role,
        createdAt: Date.now(),
      });
      return roleId;
    }
  },
});

export const removePmRole = mutation({
  args: {
    sessionToken: v.string(),
    userId: v.string(),
    scope: v.union(v.literal("global"), v.literal("workspace"), v.literal("project")),
    scopeId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePmRole(ctx, args, "admin");

    const existing = await ctx.db
      .query("pmRoles")
      .withIndex("by_user_scope", (q) =>
        q
          .eq("userId", args.userId)
          .eq("scope", args.scope)
          .eq("scopeId", args.scopeId || "")
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return true;
    }

    return false;
  },
});
