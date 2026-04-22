import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { logAction } from "../../helpers/auditLog";
import { getProjectsForUser, getWorkspaceAccess, requirePmPermission } from "./helpers";

const workspaceFieldSchema = v.object({
  key: v.string(),
  name: v.string(),
  type: v.union(
    v.literal("text"),
    v.literal("number"),
    v.literal("select"),
    v.literal("multi_select"),
    v.literal("date"),
    v.literal("user"),
    v.literal("checkbox")
  ),
  options: v.optional(v.array(v.string())),
  required: v.boolean(),
});

function uniqueMembers(ids: string[], actorId: string) {
  return [...new Set([actorId, ...ids.filter(Boolean)])];
}

export const getWorkspaces = query({
  args: {
    sessionToken: v.string(),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePmPermission(ctx, args, "pm.view_own");
    const workspaces = await ctx.db.query("pmWorkspaces").collect();
    const accessibleWorkspaces = [];

    for (const workspace of workspaces) {
      if (!args.includeArchived && workspace.isArchived) continue;
      const canAccess = await getWorkspaceAccess(ctx, workspace, actor.userId, actor.permissions);
      if (!canAccess) continue;

      const projects = (await getProjectsForUser(ctx, actor.userId, actor.permissions)).filter(
        (project) => String(project.workspaceId) === String(workspace._id)
      );

      accessibleWorkspaces.push({
        ...workspace,
        projectCount: projects.length,
        memberCount: workspace.memberIds?.length ?? 0,
      });
    }

    return accessibleWorkspaces.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const getWorkspace = query({
  args: {
    sessionToken: v.string(),
    workspaceId: v.id("pmWorkspaces"),
  },
  handler: async (ctx, args) => {
    const actor = await requirePmPermission(ctx, args, "pm.view_own");
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("WORKSPACE_NOT_FOUND");

    const canAccess = await getWorkspaceAccess(ctx, workspace, actor.userId, actor.permissions);
    if (!canAccess) throw new Error("UNAUTHORIZED");

    const projects = (await getProjectsForUser(ctx, actor.userId, actor.permissions)).filter(
      (project) => String(project.workspaceId) === String(workspace._id)
    );

    return {
      ...workspace,
      projects,
      projectCount: projects.length,
      memberCount: workspace.memberIds?.length ?? 0,
    };
  },
});

export const getWorkspaceBySlug = query({
  args: {
    sessionToken: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requirePmPermission(ctx, args, "pm.view_own");
    const workspace = await ctx.db
      .query("pmWorkspaces")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!workspace) throw new Error("WORKSPACE_NOT_FOUND");
    const canAccess = await getWorkspaceAccess(ctx, workspace, actor.userId, actor.permissions);
    if (!canAccess) throw new Error("UNAUTHORIZED");
    return workspace;
  },
});

export const getPmStats = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requirePmPermission(ctx, args, "pm.view_own");
    const accessibleProjects = await getProjectsForUser(ctx, actor.userId, actor.permissions);
    const projectIds = new Set(accessibleProjects.map((project) => String(project._id)));

    const tasks = (await ctx.db.query("pmTasks").collect()).filter(
      (task) => !task.isDeleted && projectIds.has(String(task.projectId))
    );
    const logs = await ctx.db.query("pmTimeLogs").collect();
    const relevantLogs = logs.filter((log) => {
      const task = tasks.find((entry) => String(entry._id) === String(log.taskId));
      if (!task) return false;
      return hasViewAll(actor.permissions) || log.userId === actor.userId;
    });

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    return {
      activeTasks: tasks.filter(
        (task) => !["done", "cancelled", "completed"].includes(task.status.toLowerCase())
      ).length,
      hoursLoggedThisMonth: Math.round(
        relevantLogs
          .filter((log) => log.loggedAt >= monthStart.getTime())
          .reduce((sum, log) => sum + log.minutes, 0) / 60
      ),
      teamMembers: new Set(accessibleProjects.flatMap((project) => project.memberIds)).size,
    };
  },
});

export const createWorkspace = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("engineering"),
      v.literal("onboarding"),
      v.literal("bugs"),
      v.literal("okrs")
    ),
    icon: v.string(),
    color: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
    memberIds: v.optional(v.array(v.string())),
    defaultStatuses: v.array(v.string()),
    customFieldSchema: v.optional(v.array(workspaceFieldSchema)),
  },
  handler: async (ctx, args) => {
    const actor = await requirePmPermission(ctx, args, "pm.create_workspace");
    const existing = await ctx.db
      .query("pmWorkspaces")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (existing) throw new Error("SLUG_ALREADY_EXISTS");

    const workspaceId = await ctx.db.insert("pmWorkspaces", {
      name: args.name.trim(),
      slug: args.slug.trim(),
      description: args.description?.trim(),
      type: args.type,
      icon: args.icon.trim(),
      color: args.color?.trim(),
      isPrivate: args.isPrivate ?? false,
      memberIds: uniqueMembers(args.memberIds ?? [], actor.userId),
      isArchived: false,
      defaultStatuses: args.defaultStatuses,
      customFieldSchema: args.customFieldSchema ?? [],
      createdBy: actor.userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: actor.userId,
      actorEmail: actor.email || "unknown@example.com",
      action: "pm.workspace.created",
      entityType: "pmWorkspace",
      entityId: String(workspaceId),
      after: { name: args.name, slug: args.slug, isPrivate: args.isPrivate ?? false },
    });

    return workspaceId;
  },
});

export const updateWorkspace = mutation({
  args: {
    sessionToken: v.string(),
    workspaceId: v.id("pmWorkspaces"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
    memberIds: v.optional(v.array(v.string())),
    defaultStatuses: v.optional(v.array(v.string())),
    customFieldSchema: v.optional(v.array(workspaceFieldSchema)),
  },
  handler: async (ctx, args) => {
    const actor = await requirePmPermission(ctx, args, "pm.manage_workspace");
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("WORKSPACE_NOT_FOUND");

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.slug && args.slug !== workspace.slug) {
      const existing = await ctx.db
        .query("pmWorkspaces")
        .withIndex("by_slug", (q) => q.eq("slug", args.slug!))
        .first();
      if (existing && String(existing._id) !== String(args.workspaceId)) {
        throw new Error("SLUG_ALREADY_EXISTS");
      }
    }

    if (args.name !== undefined) patch.name = args.name.trim();
    if (args.slug !== undefined) patch.slug = args.slug.trim();
    if (args.description !== undefined) patch.description = args.description?.trim();
    if (args.icon !== undefined) patch.icon = args.icon.trim();
    if (args.color !== undefined) patch.color = args.color?.trim();
    if (args.isPrivate !== undefined) patch.isPrivate = args.isPrivate;
    if (args.memberIds !== undefined) patch.memberIds = uniqueMembers(args.memberIds, actor.userId);
    if (args.defaultStatuses !== undefined) patch.defaultStatuses = args.defaultStatuses;
    if (args.customFieldSchema !== undefined) patch.customFieldSchema = args.customFieldSchema;

    await ctx.db.patch(args.workspaceId, patch);

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: actor.userId,
      actorEmail: actor.email || "unknown@example.com",
      action: "pm.workspace.updated",
      entityType: "pmWorkspace",
      entityId: String(args.workspaceId),
      before: workspace,
      after: patch,
    });

    return { success: true };
  },
});

export const deleteWorkspace = mutation({
  args: {
    sessionToken: v.string(),
    workspaceId: v.id("pmWorkspaces"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requirePmPermission(ctx, args, "pm.manage_workspace");
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("WORKSPACE_NOT_FOUND");

    const projects = await ctx.db
      .query("pmProjects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
    if (projects.some((project) => !project.isDeleted)) {
      throw new Error("CANNOT_DELETE_WORKSPACE_WITH_PROJECTS");
    }

    await ctx.db.patch(args.workspaceId, {
      isArchived: true,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: actor.userId,
      actorEmail: actor.email || "unknown@example.com",
      action: "pm.workspace.deleted",
      entityType: "pmWorkspace",
      entityId: String(args.workspaceId),
      before: workspace,
      after: { reason: args.reason, isArchived: true },
    });

    return { success: true };
  },
});

function hasViewAll(permissions: string[]) {
  return permissions.includes("*") || permissions.includes("pm.view_all");
}

