import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { Id } from "../../_generated/dataModel";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";

/**
 * Create a new custom role.
 */
export const createRole = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    description: v.string(),
    tenantId: v.optional(v.string()),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const id = await ctx.db.insert("customRoles", {
      name: args.name,
      description: args.description,
      tenantId: args.tenantId,
      permissions: args.permissions,
      isSystem: false,
      createdBy: actor.userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: args.tenantId ?? actor.tenantId,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "role.created",
      entityType: "custom_role",
      entityId: id,
      after: { name: args.name, description: args.description, tenantId: args.tenantId, permissions: args.permissions },
    });

    return { success: true, id, message: "Role created" };
  },
});

/**
 * Update an existing custom role.
 */
export const updateRole = mutation({
  args: {
    sessionToken: v.string(),
    roleId: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    permissions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const actor = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const role = await ctx.db.get(args.roleId as Id<"customRoles">);
    if (!role) throw new Error("Role not found");
    if (role.isSystem) throw new Error("Cannot modify system roles");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.permissions !== undefined) updates.permissions = args.permissions;

    await ctx.db.patch(args.roleId as Id<"customRoles">, updates);

    await logAction(ctx, {
      tenantId: role.tenantId ?? actor.tenantId,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "role.updated",
      entityType: "custom_role",
      entityId: args.roleId,
      before: { name: role.name, description: role.description, permissions: role.permissions },
      after: updates,
    });

    return { success: true, message: "Role updated" };
  },
});

/**
 * Delete a custom role.
 */
export const deleteRole = mutation({
  args: {
    sessionToken: v.string(),
    roleId: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const role = await ctx.db.get(args.roleId as Id<"customRoles">);
    if (!role) throw new Error("Role not found");
    if (role.isSystem) throw new Error("Cannot delete system roles");

    await ctx.db.delete(args.roleId as Id<"customRoles">);

    await logAction(ctx, {
      tenantId: role.tenantId ?? actor.tenantId,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "role.deleted",
      entityType: "custom_role",
      entityId: args.roleId,
      before: { name: role.name, description: role.description, tenantId: role.tenantId },
    });

    return { success: true, message: "Role deleted" };
  },
});

/**
 * Duplicate an existing role.
 */
export const duplicateRole = mutation({
  args: {
    sessionToken: v.string(),
    roleId: v.string(),
    newName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const role = await ctx.db.get(args.roleId as Id<"customRoles">);
    if (!role) throw new Error("Role not found");

    const newName = args.newName ?? `${role.name} (Copy)`;
    const id = await ctx.db.insert("customRoles", {
      name: newName,
      description: role.description,
      tenantId: role.tenantId,
      permissions: [...role.permissions],
      isSystem: false,
      createdBy: actor.userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: role.tenantId ?? actor.tenantId,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "role.duplicated",
      entityType: "custom_role",
      entityId: id,
      after: { name: newName, duplicatedFrom: args.roleId, tenantId: role.tenantId },
    });

    return { success: true, id, message: "Role duplicated" };
  },
});

/**
 * Create a permission group.
 */
export const createPermissionGroup = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    description: v.string(),
    permissions: v.array(v.string()),
    module: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

    const id = await ctx.db.insert("permissionGroups", {
      name: args.name,
      description: args.description,
      permissions: args.permissions,
      module: args.module,
    });

    await logAction(ctx, {
      tenantId: actor.tenantId,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "permission_group.created",
      entityType: "permission_group",
      entityId: id,
      after: { name: args.name, description: args.description, module: args.module, permissions: args.permissions },
    });

    return { success: true, id, message: "Permission group created" };
  },
});
