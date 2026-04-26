import { v } from "convex/values";
import { internal } from "../../_generated/api";
import { mutation, query } from "../../_generated/server";
import { logAction } from "../../helpers/auditLog";
import { hasPermission } from "../platform/rbac";
import { createPlatformNotificationRecord } from "../platform/notificationHelpers";
import {
  getProjectAccessLevel,
  getProjectsForUser,
  recalculateProjectMetrics,
  recalculateTaskActualHours,
  requirePmPermission,
  requireProjectAccess,
  sanitizeRichText,
} from "./helpers";

function orderValue(existing: number[]) {
  return existing.length > 0 ? Math.max(...existing) + 1000 : 1000;
}

export const getTasks = query({
  args: {
    sessionToken: v.string(),
    projectId: v.optional(v.id("pmProjects")),
    status: v.optional(v.string()),
    assigneeId: v.optional(v.string()),
    sprintId: v.optional(v.id("pmSprints")),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePmPermission(ctx, args, "pm.view_own");

    if (args.projectId) {
      const { project } = await requireProjectAccess(ctx, args, args.projectId);
      let tasks = await ctx.db
        .query("pmTasks")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect();
      tasks = tasks.filter((task) => !task.isDeleted);
      if (args.status) tasks = tasks.filter((task) => task.status === args.status);
      if (args.assigneeId) tasks = tasks.filter((task) => task.assigneeId === args.assigneeId);
      if (args.sprintId) tasks = tasks.filter((task) => String(task.sprintId) === String(args.sprintId));
      if (args.search?.trim()) {
        const needle = args.search.trim().toLowerCase();
        tasks = tasks.filter(
          (task) =>
            task.title.toLowerCase().includes(needle) ||
            task.description.toLowerCase().includes(needle)
        );
      }
      return tasks.sort((a, b) => (a.order ?? a.position) - (b.order ?? b.position));
    }

    const projects = await getProjectsForUser(ctx, actor.userId, actor.permissions);
    const projectIds = new Set(projects.map((project) => String(project._id)));
    let tasks = (await ctx.db.query("pmTasks").collect()).filter(
      (task) => !task.isDeleted && projectIds.has(String(task.projectId))
    );
    if (args.status) tasks = tasks.filter((task) => task.status === args.status);
    if (args.sprintId) tasks = tasks.filter((task) => String(task.sprintId) === String(args.sprintId));
    if (args.assigneeId) {
      tasks = hasPermission(actor.permissions, "pm.view_all")
        ? tasks.filter((task) => task.assigneeId === args.assigneeId)
        : tasks.filter((task) => task.assigneeId === actor.userId);
    }
    if (args.search?.trim()) {
      const needle = args.search.trim().toLowerCase();
      tasks = tasks.filter(
        (task) =>
          task.title.toLowerCase().includes(needle) ||
          task.description.toLowerCase().includes(needle)
      );
    }

    return tasks.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const getTask = query({
  args: {
    sessionToken: v.string(),
    taskId: v.id("pmTasks"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || task.isDeleted) throw new Error("TASK_NOT_FOUND");
    const { project, access } = await requireProjectAccess(ctx, args, task.projectId);

    const subtasks = await ctx.db
      .query("pmTasks")
      .withIndex("by_parent", (q) => q.eq("parentTaskId", task._id))
      .collect();
    const comments = await ctx.db
      .query("pmTaskComments")
      .withIndex("by_taskId", (q) => q.eq("taskId", task._id))
      .collect();
    const timeLogs = await ctx.db
      .query("pmTimeLogs")
      .withIndex("by_task", (q) => q.eq("taskId", task._id))
      .collect();

    return {
      ...task,
      project,
      subtasks: subtasks.filter((entry) => !entry.isDeleted),
      comments,
      timeLogs,
      userAccess: access,
    };
  },
});

export const getMyTasks = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requirePmPermission(ctx, args, "pm.view_own");
    const tasks = await ctx.db
      .query("pmTasks")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", actor.userId))
      .collect();

    const rows = [];
    for (const task of tasks) {
      if (task.isDeleted) continue;
      const project = await ctx.db.get(task.projectId);
      if (!project || project.isDeleted) continue;
      const access = await getProjectAccessLevel(ctx, project, actor.userId, actor.permissions);
      if (access === "none") continue;
      rows.push({ ...task, project });
    }
    return rows.sort((a, b) => (a.dueDate ?? Number.MAX_SAFE_INTEGER) - (b.dueDate ?? Number.MAX_SAFE_INTEGER));
  },
});

export const createTask = mutation({
  args: {
    sessionToken: v.string(),
    projectId: v.id("pmProjects"),
    title: v.string(),
    description: v.string(),
    type: v.optional(v.string()),
    priority: v.union(
      v.literal("urgent"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low"),
      v.literal("none")
    ),
    status: v.string(),
    assigneeId: v.optional(v.string()),
    reviewerId: v.optional(v.string()),
    collaboratorIds: v.optional(v.array(v.string())),
    epicId: v.optional(v.id("pmEpics")),
    parentTaskId: v.optional(v.id("pmTasks")),
    sprintId: v.optional(v.id("pmSprints")),
    dueDate: v.optional(v.number()),
    estimateMinutes: v.optional(v.number()),
    storyPoints: v.optional(v.number()),
    labels: v.optional(v.array(v.string())),
    githubBranch: v.optional(v.string()),
    customFields: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    const { actor, project } = await requireProjectAccess(ctx, args, args.projectId, "pm.create_task");
    if (!hasPermission(actor.permissions, "pm.view_all") && !project.memberIds.includes(actor.userId)) {
      throw new Error("UNAUTHORIZED");
    }

    const existing = await ctx.db
      .query("pmTasks")
      .withIndex("by_project_status", (q) => q.eq("projectId", args.projectId).eq("status", args.status))
      .collect();

    const taskId = await ctx.db.insert("pmTasks", {
      projectId: args.projectId,
      epicId: args.epicId,
      parentTaskId: args.parentTaskId,
      title: args.title.trim(),
      description: sanitizeRichText(args.description),
      type: args.type ?? "task",
      status: args.status,
      priority: args.priority,
      assigneeId: args.assigneeId,
      reviewerId: args.reviewerId,
      collaboratorIds: args.collaboratorIds ?? [],
      reporterId: actor.userId,
      creatorId: actor.userId,
      sprintId: args.sprintId,
      dueDate: args.dueDate,
      estimateMinutes: args.estimateMinutes,
      storyPoints: args.storyPoints,
      loggedMinutes: 0,
      actualHours: 0,
      githubBranch: args.githubBranch?.trim(),
      githubPrNumbers: [],
      githubIssueNumbers: [],
      customFields: args.customFields ?? {},
      labels: args.labels ?? [],
      isDeleted: false,
      position: orderValue(existing.map((task) => task.position)),
      order: orderValue(existing.map((task) => task.order ?? task.position)),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await recalculateProjectMetrics(ctx, args.projectId);

    if (project.githubRepo) {
      await ctx.scheduler.runAfter(0, internal.actions.pm.github.createGithubIssue, {
        taskId,
        repository: project.githubRepo,
        title: args.title.trim(),
        description: sanitizeRichText(args.description),
        labels: args.labels ?? [],
      });
    }

    if (args.assigneeId && args.assigneeId !== actor.userId) {
      await createPlatformNotificationRecord(ctx, {
        userId: args.assigneeId,
        title: "New task assigned",
        body: `${args.title} was assigned to you in ${project.name}.`,
        type: "pm",
        metadata: { taskId: String(taskId), projectId: String(project._id) },
      });
    }

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: actor.userId,
      actorEmail: actor.email || "unknown@example.com",
      action: "pm.task.created",
      entityType: "pmTask",
      entityId: String(taskId),
      after: { title: args.title, projectId: String(args.projectId), assigneeId: args.assigneeId },
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
    type: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(
      v.union(v.literal("urgent"), v.literal("high"), v.literal("medium"), v.literal("low"), v.literal("none"))
    ),
    assigneeId: v.optional(v.string()),
    reviewerId: v.optional(v.string()),
    collaboratorIds: v.optional(v.array(v.string())),
    sprintId: v.optional(v.id("pmSprints")),
    dueDate: v.optional(v.number()),
    estimateMinutes: v.optional(v.number()),
    storyPoints: v.optional(v.number()),
    labels: v.optional(v.array(v.string())),
    githubBranch: v.optional(v.string()),
    customFields: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || task.isDeleted) throw new Error("TASK_NOT_FOUND");
    const { actor, project } = await requireProjectAccess(
      ctx,
      args,
      task.projectId,
      "pm.edit_own_task"
    );
    const canEdit =
      hasPermission(actor.permissions, "pm.edit_any_task") ||
      task.assigneeId === actor.userId ||
      task.creatorId === actor.userId ||
      project.memberIds.includes(actor.userId);
    if (!canEdit) throw new Error("UNAUTHORIZED");

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.title !== undefined) patch.title = args.title.trim();
    if (args.description !== undefined) patch.description = sanitizeRichText(args.description);
    if (args.type !== undefined) patch.type = args.type;
    if (args.status !== undefined) {
      patch.status = args.status;
      if (args.status.toLowerCase() === "done") patch.completedAt = Date.now();
    }
    if (args.priority !== undefined) patch.priority = args.priority;
    if (args.assigneeId !== undefined) patch.assigneeId = args.assigneeId;
    if (args.reviewerId !== undefined) patch.reviewerId = args.reviewerId;
    if (args.collaboratorIds !== undefined) patch.collaboratorIds = args.collaboratorIds;
    if (args.sprintId !== undefined) patch.sprintId = args.sprintId;
    if (args.dueDate !== undefined) patch.dueDate = args.dueDate;
    if (args.estimateMinutes !== undefined) patch.estimateMinutes = args.estimateMinutes;
    if (args.storyPoints !== undefined) patch.storyPoints = args.storyPoints;
    if (args.labels !== undefined) patch.labels = args.labels;
    if (args.githubBranch !== undefined) patch.githubBranch = args.githubBranch?.trim();
    if (args.customFields !== undefined) patch.customFields = args.customFields;

    await ctx.db.patch(args.taskId, patch);
    await recalculateProjectMetrics(ctx, task.projectId);

    if (
      args.assigneeId !== undefined &&
      args.assigneeId &&
      args.assigneeId !== task.assigneeId &&
      args.assigneeId !== actor.userId
    ) {
      await createPlatformNotificationRecord(ctx, {
        userId: args.assigneeId,
        title: "Task assignment updated",
        body: `${task.title} is now assigned to you in ${project.name}.`,
        type: "pm",
        metadata: { taskId: String(task._id), projectId: String(project._id) },
      });
    }

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: actor.userId,
      actorEmail: actor.email || "unknown@example.com",
      action: "pm.task.updated",
      entityType: "pmTask",
      entityId: String(args.taskId),
      before: task,
      after: patch,
    });

    return { success: true };
  },
});

export const moveTask = mutation({
  args: {
    sessionToken: v.string(),
    taskId: v.id("pmTasks"),
    newStatus: v.string(),
    newOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || task.isDeleted) throw new Error("TASK_NOT_FOUND");
    const { actor, project } = await requireProjectAccess(
      ctx,
      args,
      task.projectId,
      "pm.edit_own_task"
    );
    const canMove =
      hasPermission(actor.permissions, "pm.edit_any_task") ||
      project.memberIds.includes(actor.userId) ||
      task.assigneeId === actor.userId ||
      task.creatorId === actor.userId;
    if (!canMove) throw new Error("UNAUTHORIZED");

    await ctx.db.patch(args.taskId, {
      status: args.newStatus,
      order: args.newOrder,
      position: args.newOrder,
      completedAt: args.newStatus.toLowerCase() === "done" ? Date.now() : undefined,
      updatedAt: Date.now(),
    });
    await recalculateProjectMetrics(ctx, task.projectId);
    return { success: true };
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
    if (!task || task.isDeleted) throw new Error("TASK_NOT_FOUND");
    const { actor } = await requireProjectAccess(ctx, args, task.projectId, "pm.view_own");
    const canDelete =
      hasPermission(actor.permissions, "pm.delete_any_task") || task.creatorId === actor.userId;
    if (!canDelete) throw new Error("UNAUTHORIZED");

    const subtasks = await ctx.db
      .query("pmTasks")
      .withIndex("by_parent", (q) => q.eq("parentTaskId", task._id))
      .collect();
    if (subtasks.some((entry) => !entry.isDeleted)) {
      throw new Error("CANNOT_DELETE_TASK_WITH_SUBTASKS");
    }

    await ctx.db.patch(args.taskId, {
      isDeleted: true,
      updatedAt: Date.now(),
    });
    await recalculateProjectMetrics(ctx, task.projectId);

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: actor.userId,
      actorEmail: actor.email || "unknown@example.com",
      action: "pm.task.deleted",
      entityType: "pmTask",
      entityId: String(args.taskId),
      before: task,
      after: { reason: args.reason, isDeleted: true },
    });

    return { success: true };
  },
});

export const addComment = mutation({
  args: {
    sessionToken: v.string(),
    taskId: v.id("pmTasks"),
    body: v.string(),
    mentions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || task.isDeleted) throw new Error("TASK_NOT_FOUND");
    const { actor } = await requireProjectAccess(ctx, args, task.projectId);

    const commentId = await ctx.db.insert("pmTaskComments", {
      taskId: task._id,
      authorId: actor.userId,
      body: sanitizeRichText(args.body),
      mentions: args.mentions ?? [],
      reactions: [],
      isEdited: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    for (const mentionedUserId of args.mentions ?? []) {
      if (mentionedUserId === actor.userId) continue;
      await createPlatformNotificationRecord(ctx, {
        userId: mentionedUserId,
        title: "Mentioned in a PM comment",
        body: `${actor.email || "A teammate"} mentioned you on ${task.title}.`,
        type: "pm",
        metadata: { taskId: String(task._id), commentId: String(commentId), projectId: String(task.projectId) },
      });
    }

    return { success: true, commentId };
  },
});

export const editComment = mutation({
  args: {
    sessionToken: v.string(),
    commentId: v.id("pmTaskComments"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requirePmPermission(ctx, args, "pm.view_own");
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("COMMENT_NOT_FOUND");
    if (comment.authorId !== actor.userId) throw new Error("UNAUTHORIZED");

    await ctx.db.patch(args.commentId, {
      body: sanitizeRichText(args.body),
      isEdited: true,
      editedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const addReaction = mutation({
  args: {
    sessionToken: v.string(),
    commentId: v.id("pmTaskComments"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requirePmPermission(ctx, args, "pm.view_own");
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("COMMENT_NOT_FOUND");
    const task = await ctx.db.get(comment.taskId);
    if (!task || task.isDeleted) throw new Error("TASK_NOT_FOUND");
    await requireProjectAccess(ctx, args, task.projectId);

    const reactions = [...(comment.reactions ?? [])];
    const existing = reactions.find((entry) => entry.emoji === args.emoji);
    if (existing) {
      if (existing.userIds.includes(actor.userId)) {
        existing.userIds = existing.userIds.filter((id) => id !== actor.userId);
      } else {
        existing.userIds.push(actor.userId);
      }
    } else {
      reactions.push({ emoji: args.emoji, userIds: [actor.userId] });
    }

    await ctx.db.patch(args.commentId, {
      reactions: reactions.filter((entry) => entry.userIds.length > 0),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const addGithubPr = mutation({
  args: {
    sessionToken: v.string(),
    taskId: v.id("pmTasks"),
    prNumber: v.number(),
  },
  handler: async (ctx, args) => {
    return await updateTaskGithubLinks(ctx, args.taskId, args.sessionToken, args.prNumber, "pr");
  },
});

export const addGithubIssue = mutation({
  args: {
    sessionToken: v.string(),
    taskId: v.id("pmTasks"),
    issueNumber: v.number(),
  },
  handler: async (ctx, args) => {
    return await updateTaskGithubLinks(
      ctx,
      args.taskId,
      args.sessionToken,
      args.issueNumber,
      "issue"
    );
  },
});

async function updateTaskGithubLinks(
  ctx: any,
  taskId: any,
  sessionToken: string,
  number: number,
  kind: "pr" | "issue"
) {
  const task = await ctx.db.get(taskId);
  if (!task || task.isDeleted) throw new Error("TASK_NOT_FOUND");
  const { actor } = await requireProjectAccess(
    ctx,
    { sessionToken },
    task.projectId,
    "pm.edit_own_task"
  );
  const field = kind === "pr" ? "githubPrNumbers" : "githubIssueNumbers";
  const singleField = kind === "pr" ? "githubPrNumber" : "githubIssueNumber";
  const current = [...(task[field] ?? [])];
  if (number === undefined) throw new Error("LINK_NUMBER_REQUIRED");
  if (current.includes(number)) throw new Error("ALREADY_LINKED");
  current.push(number);

  await ctx.db.patch(taskId, {
    [field]: current,
    [singleField]: number,
    updatedAt: Date.now(),
  });

  await logAction(ctx, {
    tenantId: "PLATFORM",
    actorId: actor.userId,
    actorEmail: actor.email || "unknown@example.com",
    action: "pm.task.updated",
    entityType: "pmTask",
    entityId: String(taskId),
    after: { [singleField]: number },
  });

  return { success: true };
}

async function reorderTaskBatch(
  ctx: any,
  sessionToken: string,
  items: Array<{ taskId: any; status: string; position: number }>
) {
  for (const entry of items) {
    const task = await ctx.db.get(entry.taskId);
    if (!task || task.isDeleted) throw new Error("TASK_NOT_FOUND");
    const { actor, project } = await requireProjectAccess(
      ctx,
      { sessionToken },
      task.projectId,
      "pm.edit_own_task"
    );
    const canMove =
      hasPermission(actor.permissions, "pm.edit_any_task") ||
      project.memberIds.includes(actor.userId) ||
      task.assigneeId === actor.userId ||
      task.creatorId === actor.userId;
    if (!canMove) throw new Error("UNAUTHORIZED");

    await ctx.db.patch(entry.taskId, {
      status: entry.status,
      order: entry.position,
      position: entry.position,
      completedAt: entry.status.toLowerCase() === "done" ? Date.now() : undefined,
      updatedAt: Date.now(),
    });
    await recalculateProjectMetrics(ctx, task.projectId);
  }
}

export const reorderTasks = mutation({
  args: {
    sessionToken: v.string(),
    tasks: v.array(
      v.object({
        taskId: v.id("pmTasks"),
        status: v.string(),
        position: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    await reorderTaskBatch(ctx, args.sessionToken, args.tasks);
    return { success: true };
  },
});
