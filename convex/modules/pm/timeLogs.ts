import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { requirePmRole } from "./roles";
import { updateEpicProgress } from "./epics";

// Queries
export const getTimeLogs = query({
  args: {
    sessionToken: v.string(),
    taskId: v.id("pmTasks"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("TASK_NOT_FOUND");
    }

    const project = await ctx.db.get(task.projectId);
    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    await requirePmRole(ctx, args, "viewer", project.workspaceId);

    const timeLogs = await ctx.db
      .query("pmTimeLogs")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();

    // Sort by loggedAt (newest first)
    timeLogs.sort((a, b) => b.loggedAt - a.loggedAt);

    return timeLogs;
  },
});

export const getUserTimeLogs = query({
  args: {
    sessionToken: v.string(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requirePmRole(ctx, args, "viewer");

    let timeLogs = await ctx.db
      .query("pmTimeLogs")
      .withIndex("by_user", (q) => q.eq("userId", tenantCtx.userId))
      .collect();

    // Apply date filters
    if (args.startDate) {
      timeLogs = timeLogs.filter(log => log.loggedAt >= args.startDate!);
    }
    if (args.endDate) {
      timeLogs = timeLogs.filter(log => log.loggedAt <= args.endDate!);
    }

    // Sort by loggedAt (newest first)
    timeLogs.sort((a, b) => b.loggedAt - a.loggedAt);

    // Get task details for each time log
    const timeLogsWithTask = await Promise.all(
      timeLogs.map(async (timeLog) => {
        const task = await ctx.db.get(timeLog.taskId);
        const project = task ? await ctx.db.get(task.projectId) : null;
        
        return {
          ...timeLog,
          task,
          project,
        };
      })
    );

    return timeLogsWithTask;
  },
});

export const getTimeLogStats = query({
  args: {
    sessionToken: v.string(),
    taskId: v.optional(v.id("pmTasks")),
    projectId: v.optional(v.id("pmProjects")),
    userId: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    let timeLogs: any[] = [];

    if (args.taskId) {
      // Get time logs for specific task
      const task = await ctx.db.get(args.taskId);
      if (!task) {
        throw new Error("TASK_NOT_FOUND");
      }

      const project = await ctx.db.get(task.projectId);
      if (!project) {
        throw new Error("PROJECT_NOT_FOUND");
      }

      await requirePmRole(ctx, args, "viewer", project.workspaceId);

      timeLogs = await ctx.db
        .query("pmTimeLogs")
        .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
        .collect();
    } else if (args.userId) {
      // Get time logs for specific user
      await requirePmRole(ctx, args, "viewer");

      timeLogs = await ctx.db
        .query("pmTimeLogs")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();
    } else {
      // Get all time logs the user has access to
      const tenantCtx = await requirePmRole(ctx, args, "viewer");
      timeLogs = await ctx.db
        .query("pmTimeLogs")
        .withIndex("by_user", (q) => q.eq("userId", tenantCtx.userId))
        .collect();
    }

    // Apply date filters
    if (args.startDate) {
      timeLogs = timeLogs.filter(log => log.loggedAt >= args.startDate);
    }
    if (args.endDate) {
      timeLogs = timeLogs.filter(log => log.loggedAt <= args.endDate);
    }

    // Filter by project if specified
    if (args.projectId) {
      const taskIds = await ctx.db
        .query("pmTasks")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect()
        .then(tasks => tasks.map(t => t._id));

      timeLogs = timeLogs.filter(log => taskIds.includes(log.taskId));
    }

    // Calculate statistics
    const totalMinutes = timeLogs.reduce((sum, log) => sum + log.minutes, 0);
    const totalHours = totalMinutes / 60;
    const daysWorked = new Set(timeLogs.map(log => new Date(log.loggedAt).toDateString())).size;

    return {
      totalMinutes,
      totalHours: Math.round(totalHours * 100) / 100,
      daysWorked,
      entryCount: timeLogs.length,
      averageMinutesPerEntry: timeLogs.length > 0 ? Math.round((totalMinutes / timeLogs.length) * 100) / 100 : 0,
    };
  },
});

// Mutations
export const logTime = mutation({
  args: {
    sessionToken: v.string(),
    taskId: v.id("pmTasks"),
    minutes: v.number(),
    description: v.optional(v.string()),
    loggedAt: v.number(), // Unix timestamp of the work date
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("TASK_NOT_FOUND");
    }

    const project = await ctx.db.get(task.projectId);
    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    const tenantCtx = await requirePmRole(ctx, args, "member", project.workspaceId);

    const timeLogId = await ctx.db.insert("pmTimeLogs", {
      taskId: args.taskId,
      userId: tenantCtx.userId,
      minutes: args.minutes,
      description: args.description,
      loggedAt: args.loggedAt,
      createdAt: Date.now(),
    });

    // Update task's logged minutes
    const currentTimeLogs = await ctx.db
      .query("pmTimeLogs")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();

    const totalLoggedMinutes = currentTimeLogs.reduce((sum, log) => sum + log.minutes, 0);

    await ctx.db.patch(args.taskId, {
      loggedMinutes: totalLoggedMinutes,
      updatedAt: Date.now(),
    });

    // Update epic progress if task is part of an epic
    if (task.epicId) {
      await updateEpicProgress(ctx, task.epicId);
    }

    return timeLogId;
  },
});

export const updateTimeLog = mutation({
  args: {
    sessionToken: v.string(),
    timeLogId: v.id("pmTimeLogs"),
    minutes: v.optional(v.number()),
    description: v.optional(v.string()),
    loggedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const timeLog = await ctx.db.get(args.timeLogId);
    if (!timeLog) {
      throw new Error("TIME_LOG_NOT_FOUND");
    }

    const task = await ctx.db.get(timeLog.taskId);
    if (!task) {
      throw new Error("TASK_NOT_FOUND");
    }

    const project = await ctx.db.get(task.projectId);
    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    await requirePmRole(ctx, args, "member", project.workspaceId);

    // Only allow users to edit their own time logs
    const tenantCtx = await requirePmRole(ctx, args, "member");
    if (timeLog.userId !== tenantCtx.userId) {
      throw new Error("CANNOT_EDIT_OTHERS_TIME_LOGS");
    }

    const updateData: any = {};
    if (args.minutes !== undefined) updateData.minutes = args.minutes;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.loggedAt !== undefined) updateData.loggedAt = args.loggedAt;

    await ctx.db.patch(args.timeLogId, updateData);

    // Recalculate task's logged minutes
    const updatedTimeLogs = await ctx.db
      .query("pmTimeLogs")
      .withIndex("by_task", (q) => q.eq("taskId", timeLog.taskId))
      .collect();

    const totalLoggedMinutes = updatedTimeLogs.reduce((sum, log) => sum + log.minutes, 0);

    await ctx.db.patch(timeLog.taskId, {
      loggedMinutes: totalLoggedMinutes,
      updatedAt: Date.now(),
    });

    // Update epic progress if task is part of an epic
    if (task.epicId) {
      await updateEpicProgress(ctx, task.epicId);
    }

    return true;
  },
});

export const deleteTimeLog = mutation({
  args: {
    sessionToken: v.string(),
    timeLogId: v.id("pmTimeLogs"),
  },
  handler: async (ctx, args) => {
    const timeLog = await ctx.db.get(args.timeLogId);
    if (!timeLog) {
      throw new Error("TIME_LOG_NOT_FOUND");
    }

    const task = await ctx.db.get(timeLog.taskId);
    if (!task) {
      throw new Error("TASK_NOT_FOUND");
    }

    const project = await ctx.db.get(task.projectId);
    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    await requirePmRole(ctx, args, "member", project.workspaceId);

    // Only allow users to delete their own time logs
    const tenantCtx = await requirePmRole(ctx, args, "member");
    if (timeLog.userId !== tenantCtx.userId) {
      throw new Error("CANNOT_DELETE_OTHERS_TIME_LOGS");
    }

    await ctx.db.delete(args.timeLogId);

    // Recalculate task's logged minutes
    const remainingTimeLogs = await ctx.db
      .query("pmTimeLogs")
      .withIndex("by_task", (q) => q.eq("taskId", timeLog.taskId))
      .collect();

    const totalLoggedMinutes = remainingTimeLogs.reduce((sum, log) => sum + log.minutes, 0);

    await ctx.db.patch(timeLog.taskId, {
      loggedMinutes: totalLoggedMinutes,
      updatedAt: Date.now(),
    });

    // Update epic progress if task is part of an epic
    if (task.epicId) {
      await updateEpicProgress(ctx, task.epicId);
    }

    return true;
  },
});
