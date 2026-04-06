import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { requirePmRole } from "./roles";

// SECURITY: PM functions use requirePmRole(), which internally validates the
// tenant session before applying PM-specific authorization.

// Queries
export const getEpics = query({
  args: {
    sessionToken: v.string(),
    projectId: v.id("pmProjects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    await requirePmRole(ctx, args, "viewer", project.workspaceId);

    const epics = await ctx.db
      .query("pmEpics")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Add task counts and progress calculation to each epic
    const epicsWithStats = await Promise.all(
      epics.map(async (epic) => {
        const tasks = await ctx.db
          .query("pmTasks")
          .withIndex("by_epic", (q) => q.eq("epicId", epic._id))
          .collect();

        const completedTasks = tasks.filter(task => task.status === "Done").length;
        const totalTasks = tasks.length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          ...epic,
          taskCount: totalTasks,
          completedTasks,
          progress,
        };
      })
    );

    return epicsWithStats;
  },
});

export const getEpic = query({
  args: {
    sessionToken: v.string(),
    epicId: v.id("pmEpics"),
  },
  handler: async (ctx, args) => {
    const epic = await ctx.db.get(args.epicId);
    if (!epic) {
      throw new Error("EPIC_NOT_FOUND");
    }

    const project = await ctx.db.get(epic.projectId);
    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    await requirePmRole(ctx, args, "viewer", project.workspaceId);

    // Get tasks for this epic
    const tasks = await ctx.db
      .query("pmTasks")
      .withIndex("by_epic", (q) => q.eq("epicId", epic._id))
      .collect();

    return {
      ...epic,
      tasks,
    };
  },
});

// Mutations
export const createEpic = mutation({
  args: {
    sessionToken: v.string(),
    projectId: v.id("pmProjects"),
    title: v.string(),
    status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("done")),
    startDate: v.optional(v.number()),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    const tenantCtx = await requirePmRole(ctx, args, "member", project.workspaceId);

    const epicId = await ctx.db.insert("pmEpics", {
      projectId: args.projectId,
      title: args.title,
      status: args.status,
      startDate: args.startDate,
      dueDate: args.dueDate,
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return epicId;
  },
});

export const updateEpic = mutation({
  args: {
    sessionToken: v.string(),
    epicId: v.id("pmEpics"),
    title: v.optional(v.string()),
    status: v.optional(v.union(v.literal("open"), v.literal("in_progress"), v.literal("done"))),
    startDate: v.optional(v.number()),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const epic = await ctx.db.get(args.epicId);
    if (!epic) {
      throw new Error("EPIC_NOT_FOUND");
    }

    const project = await ctx.db.get(epic.projectId);
    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    await requirePmRole(ctx, args, "member", project.workspaceId);

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updateData.title = args.title;
    if (args.status !== undefined) updateData.status = args.status;
    if (args.startDate !== undefined) updateData.startDate = args.startDate;
    if (args.dueDate !== undefined) updateData.dueDate = args.dueDate;

    await ctx.db.patch(args.epicId, updateData);
    return true;
  },
});

export const deleteEpic = mutation({
  args: {
    sessionToken: v.string(),
    epicId: v.id("pmEpics"),
  },
  handler: async (ctx, args) => {
    const epic = await ctx.db.get(args.epicId);
    if (!epic) {
      throw new Error("EPIC_NOT_FOUND");
    }

    const project = await ctx.db.get(epic.projectId);
    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    await requirePmRole(ctx, args, "member", project.workspaceId);

    // Check if epic has tasks
    const tasks = await ctx.db
      .query("pmTasks")
      .withIndex("by_epic", (q) => q.eq("epicId", epic._id))
      .collect();

    if (tasks.length > 0) {
      throw new Error("CANNOT_DELETE_EPIC_WITH_TASKS");
    }

    await ctx.db.delete(args.epicId);
    return true;
  },
});

// Internal function to update epic progress (called when tasks are updated)
export async function updateEpicProgress(ctx: any, epicId: string) {
  const epic = await ctx.db.get(epicId);
  if (!epic) return;

  const tasks = await ctx.db
    .query("pmTasks")
    .withIndex("by_epic", (q: any) => q.eq("epicId", epicId))
    .collect();

  const completedTasks = tasks.filter((task: any) => task.status === "Done").length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  await ctx.db.patch(epicId, {
    progress,
    updatedAt: Date.now(),
  });
}
