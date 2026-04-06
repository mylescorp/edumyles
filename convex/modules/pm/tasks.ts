import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { requirePmRole } from "./roles";
import { logAction } from "../../helpers/auditLog";

// SECURITY: PM functions use requirePmRole(), which internally validates the
// tenant session before applying PM-specific authorization.

// Queries
export const getTasks = query({
  args: {
    sessionToken: v.string(),
    projectId: v.id("pmProjects"),
    status: v.optional(v.string()),
    assigneeId: v.optional(v.string()),
    epicId: v.optional(v.id("pmEpics")),
    parentTaskId: v.optional(v.id("pmTasks")),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    await requirePmRole(ctx, args, "viewer", project.workspaceId);

    let tasksQuery = ctx.db
      .query("pmTasks")
      .withIndex("by_project_status", (q) => 
        q.eq("projectId", args.projectId).eq("status", args.status || "Backlog")
      );

    let tasks = await tasksQuery.collect();

    // Apply additional filters
    if (args.assigneeId) {
      tasks = tasks.filter(task => task.assigneeId === args.assigneeId);
    }
    if (args.epicId) {
      tasks = tasks.filter(task => task.epicId === args.epicId);
    }
    if (args.parentTaskId) {
      tasks = tasks.filter(task => task.parentTaskId === args.parentTaskId);
    }

    // Sort by position
    tasks.sort((a, b) => a.position - b.position);

    return tasks;
  },
});

export const getTask = query({
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

    // Get time logs for this task
    const timeLogs = await ctx.db
      .query("pmTimeLogs")
      .withIndex("by_task", (q) => q.eq("taskId", task._id))
      .collect();

    // Get subtasks if this is a parent task
    const subtasks = await ctx.db
      .query("pmTasks")
      .withIndex("by_parent", (q) => q.eq("parentTaskId", task._id))
      .collect();

    return {
      ...task,
      timeLogs,
      subtasks,
    };
  },
});

export const getMyTasks = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requirePmRole(ctx, args, "viewer");

    const tasks = await ctx.db
      .query("pmTasks")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", tenantCtx.userId))
      .collect();

    // Get project details for each task
    const tasksWithProject = await Promise.all(
      tasks.map(async (task) => {
        const project = await ctx.db.get(task.projectId);
        return {
          ...task,
          project,
        };
      })
    );

    return tasksWithProject;
  },
});

// Mutations
export const createTask = mutation({
  args: {
    sessionToken: v.string(),
    projectId: v.id("pmProjects"),
    epicId: v.optional(v.id("pmEpics")),
    parentTaskId: v.optional(v.id("pmTasks")),
    title: v.string(),
    description: v.string(),
    status: v.string(),
    priority: v.union(v.literal("urgent"), v.literal("high"), v.literal("medium"), v.literal("low"), v.literal("none")),
    assigneeId: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    estimateMinutes: v.optional(v.number()),
    labels: v.optional(v.array(v.string())),
    customFields: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    const tenantCtx = await requirePmRole(ctx, args, "member", project.workspaceId);

    // Get the next position for this status column
    const existingTasks = await ctx.db
      .query("pmTasks")
      .withIndex("by_project_status", (q) => 
        q.eq("projectId", args.projectId).eq("status", args.status)
      )
      .collect();

    const nextPosition = existingTasks.length > 0 ? 
      Math.max(...existingTasks.map(t => t.position)) + 1000 : 1000;

    const taskId = await ctx.db.insert("pmTasks", {
      projectId: args.projectId,
      epicId: args.epicId,
      parentTaskId: args.parentTaskId,
      title: args.title,
      description: args.description,
      status: args.status,
      priority: args.priority,
      assigneeId: args.assigneeId,
      reporterId: tenantCtx.userId,
      dueDate: args.dueDate,
      estimateMinutes: args.estimateMinutes,
      loggedMinutes: 0,
      githubPrNumbers: [],
      githubIssueNumbers: [],
      customFields: args.customFields || {},
      labels: args.labels || [],
      position: nextPosition,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: tenantCtx.tenantId,
      actorId: tenantCtx.userId,
      actorEmail: tenantCtx.email,
      action: "pm.task.created",
      entityType: "pmTask",
      entityId: String(taskId),
      after: {
        projectId: String(args.projectId),
        epicId: args.epicId ? String(args.epicId) : undefined,
        parentTaskId: args.parentTaskId ? String(args.parentTaskId) : undefined,
        title: args.title,
        description: args.description,
        status: args.status,
        priority: args.priority,
        assigneeId: args.assigneeId,
        dueDate: args.dueDate,
        estimateMinutes: args.estimateMinutes,
        labels: args.labels || [],
      },
    });

    return taskId;
  },
});

export const updateTask = mutation({
  args: {
    sessionToken: v.string(),
    taskId: v.id("pmTasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("urgent"), v.literal("high"), v.literal("medium"), v.literal("low"), v.literal("none"))),
    assigneeId: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    estimateMinutes: v.optional(v.number()),
    labels: v.optional(v.array(v.string())),
    customFields: v.optional(v.record(v.string(), v.any())),
    position: v.optional(v.number()),
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

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updateData.title = args.title;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.status !== undefined) updateData.status = args.status;
    if (args.priority !== undefined) updateData.priority = args.priority;
    if (args.assigneeId !== undefined) updateData.assigneeId = args.assigneeId;
    if (args.dueDate !== undefined) updateData.dueDate = args.dueDate;
    if (args.estimateMinutes !== undefined) updateData.estimateMinutes = args.estimateMinutes;
    if (args.labels !== undefined) updateData.labels = args.labels;
    if (args.customFields !== undefined) updateData.customFields = args.customFields;
    if (args.position !== undefined) updateData.position = args.position;

    await ctx.db.patch(args.taskId, updateData);

    await logAction(ctx, {
      tenantId: tenantCtx.tenantId,
      actorId: tenantCtx.userId,
      actorEmail: tenantCtx.email,
      action: "pm.task.updated",
      entityType: "pmTask",
      entityId: String(args.taskId),
      before: {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assigneeId,
        dueDate: task.dueDate,
        estimateMinutes: task.estimateMinutes,
        labels: task.labels,
        customFields: task.customFields,
        position: task.position,
      },
      after: updateData,
    });
    return true;
  },
});

export const deleteTask = mutation({
  args: {
    sessionToken: v.string(),
    taskId: v.id("pmTasks"),
    reason: v.string(),
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

    // Check if task has subtasks
    const subtasks = await ctx.db
      .query("pmTasks")
      .withIndex("by_parent", (q) => q.eq("parentTaskId", task._id))
      .collect();

    if (subtasks.length > 0) {
      throw new Error("CANNOT_DELETE_TASK_WITH_SUBTASKS");
    }

    // Delete associated time logs
    const timeLogs = await ctx.db
      .query("pmTimeLogs")
      .withIndex("by_task", (q) => q.eq("taskId", task._id))
      .collect();

    for (const timeLog of timeLogs) {
      await ctx.db.delete(timeLog._id);
    }

    await ctx.db.delete(args.taskId);

    await logAction(ctx, {
      tenantId: tenantCtx.tenantId,
      actorId: tenantCtx.userId,
      actorEmail: tenantCtx.email,
      action: "pm.task.deleted",
      entityType: "pmTask",
      entityId: String(args.taskId),
      before: {
        projectId: String(task.projectId),
        epicId: task.epicId ? String(task.epicId) : undefined,
        parentTaskId: task.parentTaskId ? String(task.parentTaskId) : undefined,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assigneeId,
        dueDate: task.dueDate,
        estimateMinutes: task.estimateMinutes,
        labels: task.labels,
      },
      after: {
        reason: args.reason,
      },
    });
    return true;
  },
});

export const reorderTasks = mutation({
  args: {
    sessionToken: v.string(),
    tasks: v.array(v.object({
      taskId: v.id("pmTasks"),
      status: v.string(),
      position: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    // Verify all tasks exist and user has permission
    for (const taskUpdate of args.tasks) {
      const task = await ctx.db.get(taskUpdate.taskId);
      if (!task) {
        throw new Error("TASK_NOT_FOUND");
      }

      const project = await ctx.db.get(task.projectId);
      if (!project) {
        throw new Error("PROJECT_NOT_FOUND");
      }

      await requirePmRole(ctx, args, "member", project.workspaceId);
    }

    // Update all tasks with new positions and statuses
    for (const taskUpdate of args.tasks) {
      await ctx.db.patch(taskUpdate.taskId, {
        status: taskUpdate.status,
        position: taskUpdate.position,
        updatedAt: Date.now(),
      });
    }

    return true;
  },
});

export const addGithubPr = mutation({
  args: {
    sessionToken: v.string(),
    taskId: v.id("pmTasks"),
    prNumber: v.number(),
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

    await requirePmRole(ctx, args, "member", project.workspaceId);

    const currentPrNumbers = task.githubPrNumbers || [];
    if (currentPrNumbers.includes(args.prNumber)) {
      throw new Error("PR_ALREADY_LINKED");
    }

    await ctx.db.patch(args.taskId, {
      githubPrNumbers: [...currentPrNumbers, args.prNumber],
      updatedAt: Date.now(),
    });

    return true;
  },
});

export const addGithubIssue = mutation({
  args: {
    sessionToken: v.string(),
    taskId: v.id("pmTasks"),
    issueNumber: v.number(),
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

    await requirePmRole(ctx, args, "member", project.workspaceId);

    const currentIssueNumbers = task.githubIssueNumbers || [];
    if (currentIssueNumbers.includes(args.issueNumber)) {
      throw new Error("ISSUE_ALREADY_LINKED");
    }

    await ctx.db.patch(args.taskId, {
      githubIssueNumbers: [...currentIssueNumbers, args.issueNumber],
      updatedAt: Date.now(),
    });

    return true;
  },
});
