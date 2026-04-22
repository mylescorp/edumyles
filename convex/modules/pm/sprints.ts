import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { logAction } from "../../helpers/auditLog";
import { hasPermission } from "../platform/rbac";
import { recalculateProjectMetrics, requireProjectAccess } from "./helpers";

export const getSprints = query({
  args: {
    sessionToken: v.string(),
    projectId: v.id("pmProjects"),
  },
  handler: async (ctx, args) => {
    await requireProjectAccess(ctx, args, args.projectId);
    const sprints = await ctx.db
      .query("pmSprints")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    return sprints.sort((a, b) => b.startDate - a.startDate);
  },
});

export const createSprint = mutation({
  args: {
    sessionToken: v.string(),
    projectId: v.id("pmProjects"),
    name: v.string(),
    goal: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const { actor, project } = await requireProjectAccess(
      ctx,
      args,
      args.projectId,
      "pm.manage_sprints"
    );
    const canManage =
      hasPermission(actor.permissions, "pm.edit_any_project") ||
      project.ownerId === actor.userId ||
      project.leadId === actor.userId;
    if (!canManage) throw new Error("UNAUTHORIZED");

    const sprintId = await ctx.db.insert("pmSprints", {
      projectId: args.projectId,
      name: args.name.trim(),
      goal: args.goal?.trim(),
      startDate: args.startDate,
      endDate: args.endDate,
      status: "planned",
      velocity: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: actor.userId,
      actorEmail: actor.email || "unknown@example.com",
      action: "pm.project.updated",
      entityType: "pmSprint",
      entityId: String(sprintId),
      after: { name: args.name, projectId: String(args.projectId) },
    });

    return { success: true, sprintId };
  },
});

export const startSprint = mutation({
  args: {
    sessionToken: v.string(),
    sprintId: v.id("pmSprints"),
  },
  handler: async (ctx, args) => {
    const sprint = await ctx.db.get(args.sprintId);
    if (!sprint) throw new Error("SPRINT_NOT_FOUND");
    const { actor, project } = await requireProjectAccess(
      ctx,
      args,
      sprint.projectId,
      "pm.manage_sprints"
    );
    const canManage =
      hasPermission(actor.permissions, "pm.edit_any_project") ||
      project.ownerId === actor.userId ||
      project.leadId === actor.userId;
    if (!canManage) throw new Error("UNAUTHORIZED");

    const activeSprint = await ctx.db
      .query("pmSprints")
      .withIndex("by_project_status", (q) => q.eq("projectId", sprint.projectId).eq("status", "active"))
      .first();
    if (activeSprint && String(activeSprint._id) !== String(args.sprintId)) {
      throw new Error("ACTIVE_SPRINT_ALREADY_EXISTS");
    }

    await ctx.db.patch(args.sprintId, {
      status: "active",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const closeSprint = mutation({
  args: {
    sessionToken: v.string(),
    sprintId: v.id("pmSprints"),
    moveIncompleteToSprintId: v.optional(v.id("pmSprints")),
  },
  handler: async (ctx, args) => {
    const sprint = await ctx.db.get(args.sprintId);
    if (!sprint) throw new Error("SPRINT_NOT_FOUND");
    const { actor, project } = await requireProjectAccess(
      ctx,
      args,
      sprint.projectId,
      "pm.manage_sprints"
    );
    const canManage =
      hasPermission(actor.permissions, "pm.edit_any_project") ||
      project.ownerId === actor.userId ||
      project.leadId === actor.userId;
    if (!canManage) throw new Error("UNAUTHORIZED");

    const sprintTasks = await ctx.db
      .query("pmTasks")
      .withIndex("by_sprint", (q) => q.eq("sprintId", args.sprintId))
      .collect();
    const incomplete = sprintTasks.filter(
      (task) => !task.isDeleted && task.status.toLowerCase() !== "done"
    );

    for (const task of incomplete) {
      await ctx.db.patch(task._id, {
        sprintId: args.moveIncompleteToSprintId,
        updatedAt: Date.now(),
      });
    }

    const velocity = sprintTasks
      .filter((task) => !task.isDeleted && task.status.toLowerCase() === "done")
      .reduce((sum, task) => sum + (task.storyPoints ?? 0), 0);

    await ctx.db.patch(args.sprintId, {
      status: "completed",
      velocity,
      updatedAt: Date.now(),
    });
    await recalculateProjectMetrics(ctx, sprint.projectId);

    return { success: true, movedIncomplete: incomplete.length, velocity };
  },
});

