import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { logAction } from "../../helpers/auditLog";
import { hasPermission } from "../platform/rbac";
import { createPlatformNotificationRecord } from "../platform/notificationHelpers";
import {
  getProjectAccessLevel,
  getProjectsForUser,
  getWorkspaceAccess,
  requirePmPermission,
  requireProjectAccess,
  sanitizeRichText,
} from "./helpers";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function dedupe(values?: string[]) {
  return [...new Set((values ?? []).filter(Boolean))];
}

async function archiveProjectHandler(
  ctx: any,
  args: { sessionToken: string; projectId: any }
) {
  const { actor, project, access } = await requireProjectAccess(
    ctx,
    args,
    args.projectId,
    "pm.edit_own_project"
  );
  if (access !== "edit" && !hasPermission(actor.permissions, "pm.edit_any_project")) {
    throw new Error("UNAUTHORIZED");
  }

  const patch = {
    status: "archived" as const,
    isArchived: true,
    archivedAt: Date.now(),
    updatedAt: Date.now(),
  };

  await ctx.db.patch(args.projectId, patch);
  await logAction(ctx, {
    tenantId: "PLATFORM",
    actorId: actor.userId,
    actorEmail: actor.email || "unknown@example.com",
    action: "pm.project.updated",
    entityType: "pmProject",
    entityId: String(args.projectId),
    before: project,
    after: patch,
  });

  return { success: true };
}

export const getProjects = query({
  args: {
    sessionToken: v.string(),
    workspaceId: v.optional(v.id("pmWorkspaces")),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    search: v.optional(v.string()),
    showOwn: v.optional(v.boolean()),
    leadId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePmPermission(ctx, args, "pm.view_own");
    const accessibleProjects = await getProjectsForUser(ctx, actor.userId, actor.permissions);

    let rows = accessibleProjects;
    if (args.workspaceId) {
      rows = rows.filter((project) => String(project.workspaceId) === String(args.workspaceId));
    }
    if (args.status) {
      rows = rows.filter((project) => project.status === args.status);
    }
    if (args.priority) {
      rows = rows.filter((project) => project.priority === args.priority);
    }
    if (args.search?.trim()) {
      const needle = args.search.trim().toLowerCase();
      rows = rows.filter(
        (project) =>
          project.name.toLowerCase().includes(needle) ||
          project.description.toLowerCase().includes(needle) ||
          (project.tags ?? []).some((tag) => tag.toLowerCase().includes(needle))
      );
    }
    if (args.showOwn) {
      rows = rows.filter(
        (project) =>
          project.ownerId === actor.userId ||
          project.leadId === actor.userId ||
          project.memberIds.includes(actor.userId)
      );
    }
    if (args.leadId && hasViewAll(actor.permissions)) {
      rows = rows.filter((project) => project.leadId === args.leadId);
    }

    const projectMap = await Promise.all(
      rows.map(async (project) => {
        const tasks = await ctx.db
          .query("pmTasks")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect();
        const activeTasks = tasks.filter((task) => !task.isDeleted);
        return {
          ...project,
          taskCount: activeTasks.length,
          totalTasks: project.totalTasks ?? activeTasks.length,
          completedTasks:
            project.completedTasks ??
            activeTasks.filter(
              (task) => task.status.toLowerCase() === "done" || Boolean(task.completedAt)
            ).length,
          progress: project.progress ?? 0,
        };
      })
    );

    return projectMap.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const getProject = query({
  args: {
    sessionToken: v.string(),
    projectId: v.id("pmProjects"),
  },
  handler: async (ctx, args) => {
    const { actor, project, access } = await requireProjectAccess(ctx, args, args.projectId);
    const tasks = await ctx.db
      .query("pmTasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const comments = await Promise.all(
      tasks
        .filter((task) => !task.isDeleted)
        .slice(0, 40)
        .map(async (task) => ({
          taskId: task._id,
          comments: await ctx.db
            .query("pmTaskComments")
            .withIndex("by_taskId", (q) => q.eq("taskId", task._id))
            .collect(),
        }))
    );
    const sprints = await ctx.db
      .query("pmSprints")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const epics = await ctx.db
      .query("pmEpics")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const shares = await ctx.db
      .query("pmProjectShares")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .collect();

    return {
      ...project,
      tasks: tasks.filter((task) => !task.isDeleted),
      comments,
      sprints,
      epics,
      shares: shares.filter((share) => !share.expiresAt || share.expiresAt >= Date.now()),
      userAccess: access,
      canEdit: access === "edit",
      viewerId: actor.userId,
    };
  },
});

export const createProject = mutation({
  args: {
    sessionToken: v.string(),
    workspaceId: v.id("pmWorkspaces"),
    name: v.string(),
    description: v.string(),
    priority: v.optional(v.string()),
    visibility: v.optional(
      v.union(v.literal("private"), v.literal("workspace"), v.literal("all_staff"))
    ),
    leadId: v.optional(v.string()),
    memberIds: v.optional(v.array(v.string())),
    startDate: v.number(),
    dueDate: v.number(),
    tags: v.optional(v.array(v.string())),
    githubRepo: v.optional(v.string()),
    customFields: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    const actor = await requirePmPermission(ctx, args, "pm.create_project");
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("WORKSPACE_NOT_FOUND");
    const canAccess = await getWorkspaceAccess(ctx, workspace, actor.userId, actor.permissions);
    if (!canAccess) throw new Error("UNAUTHORIZED");

    const now = Date.now();
    const memberIds = dedupe([actor.userId, ...(args.memberIds ?? []), args.leadId ?? ""]);

    const projectId = await ctx.db.insert("pmProjects", {
      workspaceId: args.workspaceId,
      slug: slugify(args.name),
      name: args.name.trim(),
      description: sanitizeRichText(args.description),
      priority: args.priority ?? "medium",
      visibility: args.visibility ?? "private",
      status: "active",
      startDate: args.startDate,
      dueDate: args.dueDate,
      ownerId: actor.userId,
      leadId: args.leadId ?? actor.userId,
      memberIds,
      progress: 0,
      totalTasks: 0,
      completedTasks: 0,
      isDeleted: false,
      isArchived: false,
      githubRepo: args.githubRepo?.trim(),
      tags: dedupe(args.tags),
      customFields: args.customFields ?? {},
      createdAt: now,
      updatedAt: now,
    });

    for (const memberId of memberIds) {
      if (memberId === actor.userId) continue;
      await createPlatformNotificationRecord(ctx, {
        userId: memberId,
        title: "Added to a PM project",
        body: `You were added to ${args.name.trim()}.`,
        type: "pm",
        metadata: { projectId: String(projectId) },
      });
    }

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: actor.userId,
      actorEmail: actor.email || "unknown@example.com",
      action: "pm.project.created",
      entityType: "pmProject",
      entityId: String(projectId),
      after: { name: args.name, workspaceId: String(args.workspaceId), visibility: args.visibility },
    });

    return projectId;
  },
});

export const updateProject = mutation({
  args: {
    sessionToken: v.string(),
    projectId: v.id("pmProjects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.string()),
    visibility: v.optional(
      v.union(v.literal("private"), v.literal("workspace"), v.literal("all_staff"))
    ),
    status: v.optional(
      v.union(v.literal("active"), v.literal("paused"), v.literal("completed"), v.literal("archived"))
    ),
    leadId: v.optional(v.string()),
    memberIds: v.optional(v.array(v.string())),
    startDate: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    githubRepo: v.optional(v.string()),
    customFields: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    const { actor, project, access } = await requireProjectAccess(
      ctx,
      args,
      args.projectId,
      "pm.edit_own_project"
    );
    if (access !== "edit" && !hasPermission(actor.permissions, "pm.edit_any_project")) {
      throw new Error("UNAUTHORIZED");
    }

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) {
      patch.name = args.name.trim();
      patch.slug = slugify(args.name);
    }
    if (args.description !== undefined) patch.description = sanitizeRichText(args.description);
    if (args.priority !== undefined) patch.priority = args.priority;
    if (args.visibility !== undefined) patch.visibility = args.visibility;
    if (args.status !== undefined) patch.status = args.status;
    if (args.leadId !== undefined) patch.leadId = args.leadId;
    if (args.memberIds !== undefined) patch.memberIds = dedupe([project.ownerId, ...args.memberIds]);
    if (args.startDate !== undefined) patch.startDate = args.startDate;
    if (args.dueDate !== undefined) patch.dueDate = args.dueDate;
    if (args.tags !== undefined) patch.tags = dedupe(args.tags);
    if (args.githubRepo !== undefined) patch.githubRepo = args.githubRepo?.trim();
    if (args.customFields !== undefined) patch.customFields = args.customFields;
    if (args.status === "archived") {
      patch.isArchived = true;
      patch.archivedAt = Date.now();
    }

    await ctx.db.patch(args.projectId, patch);

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: actor.userId,
      actorEmail: actor.email || "unknown@example.com",
      action: "pm.project.updated",
      entityType: "pmProject",
      entityId: String(args.projectId),
      before: project,
      after: patch,
    });

    return { success: true };
  },
});

export const archiveProject = mutation({
  args: {
    sessionToken: v.string(),
    projectId: v.id("pmProjects"),
  },
  handler: async (ctx, args) => {
    return await archiveProjectHandler(ctx, args);
  },
});

export const deleteProject = mutation({
  args: {
    sessionToken: v.string(),
    projectId: v.id("pmProjects"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const { actor, project } = await requireProjectAccess(
      ctx,
      args,
      args.projectId,
      "pm.delete_own_project"
    );
    if (
      !hasPermission(actor.permissions, "pm.delete_any_project") &&
      project.ownerId !== actor.userId
    ) {
      throw new Error("UNAUTHORIZED");
    }

    await ctx.db.patch(args.projectId, {
      isDeleted: true,
      isArchived: true,
      status: "archived",
      archivedAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: actor.userId,
      actorEmail: actor.email || "unknown@example.com",
      action: "pm.project.deleted",
      entityType: "pmProject",
      entityId: String(args.projectId),
      before: project,
      after: { reason: args.reason, isDeleted: true },
    });

    return { success: true };
  },
});

export const manageProjectMembers = mutation({
  args: {
    sessionToken: v.string(),
    projectId: v.id("pmProjects"),
    action: v.union(v.literal("add"), v.literal("remove")),
    memberIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { actor, project } = await requireProjectAccess(
      ctx,
      args,
      args.projectId,
      "pm.manage_members"
    );
    const canManage =
      hasPermission(actor.permissions, "pm.edit_any_project") ||
      project.ownerId === actor.userId ||
      project.leadId === actor.userId;
    if (!canManage) throw new Error("UNAUTHORIZED");

    const current = new Set(project.memberIds);
    if (args.action === "add") {
      args.memberIds.forEach((id) => current.add(id));
    } else {
      args.memberIds.forEach((id) => {
        if (id !== project.ownerId) current.delete(id);
      });
    }

    const nextMemberIds = dedupe(Array.from(current));
    await ctx.db.patch(args.projectId, {
      memberIds: nextMemberIds,
      updatedAt: Date.now(),
    });

    if (args.action === "add") {
      for (const memberId of args.memberIds) {
        if (memberId === actor.userId) continue;
        await createPlatformNotificationRecord(ctx, {
          userId: memberId,
          title: "Project membership granted",
          body: `You now have access to ${project.name}.`,
          type: "pm",
          metadata: { projectId: String(project._id) },
        });
      }
    }

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: actor.userId,
      actorEmail: actor.email || "unknown@example.com",
      action: "pm.project.updated",
      entityType: "pmProject",
      entityId: String(args.projectId),
      before: { memberIds: project.memberIds },
      after: { memberIds: nextMemberIds, action: args.action },
    });

    return { success: true, memberIds: nextMemberIds };
  },
});

export const shareProject = mutation({
  args: {
    sessionToken: v.string(),
    projectId: v.id("pmProjects"),
    sharedWithUserId: v.string(),
    accessLevel: v.union(v.literal("view"), v.literal("comment"), v.literal("edit")),
    message: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { actor, project } = await requireProjectAccess(ctx, args, args.projectId);
    const canShare =
      hasViewAll(actor.permissions) || project.ownerId === actor.userId || project.leadId === actor.userId;
    if (!canShare) throw new Error("UNAUTHORIZED");

    const existing = await ctx.db
      .query("pmProjectShares")
      .withIndex("by_sharedWithUserId", (q) => q.eq("sharedWithUserId", args.sharedWithUserId))
      .collect()
      .then((rows) => rows.find((row) => String(row.projectId) === String(args.projectId)));

    const patch = {
      projectId: args.projectId,
      sharedWithUserId: args.sharedWithUserId,
      sharedByUserId: actor.userId,
      accessLevel: args.accessLevel,
      message: args.message?.trim(),
      expiresAt: args.expiresAt,
      updatedAt: Date.now(),
    };

    let shareId = existing?._id;
    if (existing) {
      await ctx.db.patch(existing._id, patch);
    } else {
      shareId = await ctx.db.insert("pmProjectShares", {
        ...patch,
        createdAt: Date.now(),
      });
    }

    if (args.sharedWithUserId !== actor.userId) {
      await createPlatformNotificationRecord(ctx, {
        userId: args.sharedWithUserId,
        title: "Project shared with you",
        body: `${project.name} was shared with ${args.accessLevel} access.`,
        type: "pm",
        metadata: { projectId: String(project._id), accessLevel: args.accessLevel },
      });
    }

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: actor.userId,
      actorEmail: actor.email || "unknown@example.com",
      action: "pm.project.updated",
      entityType: "pmProjectShare",
      entityId: String(shareId),
      after: patch,
    });

    return { success: true, shareId };
  },
});

function hasViewAll(permissions: string[]) {
  return permissions.includes("*") || permissions.includes("pm.view_all");
}
