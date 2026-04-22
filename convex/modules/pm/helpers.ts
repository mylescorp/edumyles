import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { getUserPermissions, hasPermission, requirePermission } from "../platform/rbac";

type Ctx = QueryCtx | MutationCtx;

type Actor = {
  userId: string;
  email: string;
  permissions: string[];
  platformUser: any;
};

export type ProjectAccessLevel = "none" | "view" | "comment" | "edit";

export async function requirePmPermission(
  ctx: Ctx,
  args: { sessionToken: string },
  permission: string
): Promise<Actor> {
  const actor = await requirePermission(ctx, permission, args.sessionToken);
  return {
    userId: actor.userId,
    email: actor.email,
    permissions: actor.permissions,
    platformUser: actor.platformUser,
  };
}

export function sanitizeRichText(value?: string | null) {
  if (!value) return "";
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "")
    .trim();
}

export async function getProjectsForUser(
  ctx: Ctx,
  userId: string,
  permissions: string[]
): Promise<Array<Doc<"pmProjects">>> {
  const allProjects = await ctx.db.query("pmProjects").collect();
  const activeProjects = allProjects.filter(
    (project) => !project.isDeleted && !project.isArchived && project.status !== "archived"
  );

  if (hasPermission(permissions, "pm.view_all")) {
    return activeProjects;
  }

  const byId = new Map<string, Doc<"pmProjects">>();
  const accessibleProjectIds = new Set<string>();

  const sharedProjects = await ctx.db
    .query("pmProjectShares")
    .withIndex("by_sharedWithUserId", (q) => q.eq("sharedWithUserId", userId))
    .collect();
  for (const share of sharedProjects) {
    if (share.expiresAt && share.expiresAt < Date.now()) continue;
    accessibleProjectIds.add(String(share.projectId));
  }

  const assignedTasks = await ctx.db
    .query("pmTasks")
    .withIndex("by_assignee", (q) => q.eq("assigneeId", userId))
    .collect();
  for (const task of assignedTasks) {
    if (task.isDeleted) continue;
    accessibleProjectIds.add(String(task.projectId));
  }

  for (const project of activeProjects) {
    if (
      project.ownerId === userId ||
      project.leadId === userId ||
      project.memberIds.includes(userId) ||
      project.visibility === "all_staff" ||
      accessibleProjectIds.has(String(project._id))
    ) {
      byId.set(String(project._id), project);
    }
  }

  return Array.from(byId.values());
}

export async function getWorkspaceAccess(
  ctx: Ctx,
  workspace: Doc<"pmWorkspaces">,
  userId: string,
  permissions: string[]
) {
  if (hasPermission(permissions, "pm.view_all")) {
    return true;
  }

  if (!workspace.isPrivate) {
    return true;
  }

  return (workspace.memberIds ?? []).includes(userId);
}

export async function getProjectAccessLevel(
  ctx: Ctx,
  project: Doc<"pmProjects">,
  userId: string,
  permissions: string[]
): Promise<ProjectAccessLevel> {
  if (project.isDeleted) return "none";

  if (hasPermission(permissions, "pm.view_all")) {
    return hasPermission(permissions, "pm.edit_any_project") ? "edit" : "view";
  }

  if (project.ownerId === userId || project.leadId === userId) {
    return hasPermission(permissions, "pm.edit_own_project") ? "edit" : "view";
  }

  if (project.memberIds.includes(userId)) {
    return hasPermission(permissions, "pm.edit_own_task") ? "edit" : "comment";
  }

  if (project.visibility === "all_staff") {
    return "view";
  }

  const share = await ctx.db
    .query("pmProjectShares")
    .withIndex("by_sharedWithUserId", (q) => q.eq("sharedWithUserId", userId))
    .collect()
    .then((rows) =>
      rows.find(
        (row) =>
          String(row.projectId) === String(project._id) &&
          (!row.expiresAt || row.expiresAt >= Date.now())
      )
    );

  if (!share) {
    const assignedTask = await ctx.db
      .query("pmTasks")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", userId))
      .collect()
      .then((tasks) =>
        tasks.find((task) => String(task.projectId) === String(project._id) && !task.isDeleted)
      );

    return assignedTask ? "comment" : "none";
  }

  if (share.accessLevel === "edit") return "edit";
  if (share.accessLevel === "comment") return "comment";
  return "view";
}

export async function requireProjectAccess(
  ctx: Ctx,
  args: { sessionToken: string },
  projectId: Id<"pmProjects">,
  permission = "pm.view_own"
) {
  const actor = await requirePmPermission(ctx, args, permission);
  const project = await ctx.db.get(projectId);
  if (!project || project.isDeleted) {
    throw new Error("PROJECT_NOT_FOUND");
  }

  const access = await getProjectAccessLevel(ctx, project, actor.userId, actor.permissions);
  if (access === "none") {
    throw new Error("UNAUTHORIZED");
  }

  return { actor, project, access };
}

export async function recalculateProjectMetrics(ctx: MutationCtx, projectId: Id<"pmProjects">) {
  const tasks = await ctx.db
    .query("pmTasks")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();

  const activeTasks = tasks.filter((task) => !task.isDeleted);
  const completedTasks = activeTasks.filter(
    (task) => task.status.toLowerCase() === "done" || Boolean(task.completedAt)
  );

  await ctx.db.patch(projectId, {
    totalTasks: activeTasks.length,
    completedTasks: completedTasks.length,
    progress:
      activeTasks.length === 0 ? 0 : Math.round((completedTasks.length / activeTasks.length) * 100),
    updatedAt: Date.now(),
  });
}

export async function recalculateTaskActualHours(ctx: MutationCtx, taskId: Id<"pmTasks">) {
  const logs = await ctx.db
    .query("pmTimeLogs")
    .withIndex("by_task", (q) => q.eq("taskId", taskId))
    .collect();
  const minutes = logs.reduce((sum, log) => sum + log.minutes, 0);
  await ctx.db.patch(taskId, {
    loggedMinutes: minutes,
    actualHours: Math.round((minutes / 60) * 100) / 100,
    updatedAt: Date.now(),
  });
}
