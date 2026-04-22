import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { logAction } from "../../helpers/auditLog";
import { hasPermission } from "../platform/rbac";
import {
  getProjectsForUser,
  recalculateTaskActualHours,
  requirePmPermission,
  requireProjectAccess,
  sanitizeRichText,
} from "./helpers";

function toDateString(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

async function getTimeLogRows(
  ctx: any,
  args: {
    sessionToken: string;
    projectId?: any;
    userId?: string;
    dateFrom?: number;
    dateTo?: number;
  }
) {
  const actor = await requirePmPermission(ctx, args, "pm.view_time_logs");
  const projects = await getProjectsForUser(ctx, actor.userId, actor.permissions);
  const projectIds = new Set(projects.map((project) => String(project._id)));

  let logs = await ctx.db.query("pmTimeLogs").collect();
  logs = logs.filter((log: any) => {
    if (args.userId && hasPermission(actor.permissions, "pm.view_all") && log.userId !== args.userId) {
      return false;
    }
    if (!hasPermission(actor.permissions, "pm.view_all") && log.userId !== actor.userId) {
      return false;
    }
    if (args.dateFrom && log.loggedAt < args.dateFrom) return false;
    if (args.dateTo && log.loggedAt > args.dateTo) return false;
    return true;
  });

  const rows = [];
  for (const log of logs) {
    const task = await ctx.db.get(log.taskId);
    if (!task || task.isDeleted) continue;
    if (!projectIds.has(String(task.projectId))) continue;
    if (args.projectId && String(task.projectId) !== String(args.projectId)) continue;
    const project = await ctx.db.get(task.projectId);
    if (!project) continue;
    rows.push({ ...log, task, project });
  }

  return {
    actor,
    rows: rows.sort((a, b) => b.loggedAt - a.loggedAt),
  };
}

export const getTimeLogs = query({
  args: {
    sessionToken: v.string(),
    projectId: v.optional(v.id("pmProjects")),
    userId: v.optional(v.string()),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const result = await getTimeLogRows(ctx, args);
    return result.rows;
  },
});

export const getUserTimeLogs = query({
  args: {
    sessionToken: v.string(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const result = await getTimeLogRows(ctx, {
      sessionToken: args.sessionToken,
      dateFrom: args.startDate,
      dateTo: args.endDate,
      projectId: undefined,
      userId: undefined,
    });
    return result.rows;
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
    const result = await getTimeLogRows(ctx, {
      sessionToken: args.sessionToken,
      projectId: args.projectId,
      userId: args.userId,
      dateFrom: args.startDate,
      dateTo: args.endDate,
    });
    const actor = result.actor;
    let logs = result.rows;

    if (args.taskId) {
      logs = logs.filter((log: any) => String(log.taskId) === String(args.taskId));
    }

    const totalMinutes = logs.reduce((sum: number, log: any) => sum + log.minutes, 0);
    return {
      totalMinutes,
      totalHours: Math.round((totalMinutes / 60) * 100) / 100,
      entryCount: logs.length,
      daysWorked: new Set(logs.map((log: any) => toDateString(log.loggedAt))).size,
      canViewAll: hasPermission(actor.permissions, "pm.view_all"),
    };
  },
});

export const logTime = mutation({
  args: {
    sessionToken: v.string(),
    taskId: v.id("pmTasks"),
    durationMinutes: v.number(),
    description: v.optional(v.string()),
    date: v.string(),
    billable: v.boolean(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || task.isDeleted) throw new Error("TASK_NOT_FOUND");
    const { actor } = await requireProjectAccess(ctx, args, task.projectId, "pm.log_time");

    const parsedTimestamp = new Date(`${args.date}T12:00:00.000Z`).getTime();
    const timeLogId = await ctx.db.insert("pmTimeLogs", {
      taskId: task._id,
      userId: actor.userId,
      minutes: args.durationMinutes,
      description: sanitizeRichText(args.description),
      loggedAt: parsedTimestamp,
      billable: args.billable,
      date: args.date,
      createdAt: Date.now(),
    });

    await recalculateTaskActualHours(ctx, task._id);

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: actor.userId,
      actorEmail: actor.email || "unknown@example.com",
      action: "pm.task.updated",
      entityType: "pmTimeLog",
      entityId: String(timeLogId),
      after: { taskId: String(task._id), durationMinutes: args.durationMinutes, billable: args.billable },
    });

    return { success: true, timeLogId };
  },
});

export const updateTimeLog = mutation({
  args: {
    sessionToken: v.string(),
    timeLogId: v.id("pmTimeLogs"),
    minutes: v.optional(v.number()),
    description: v.optional(v.string()),
    loggedAt: v.optional(v.number()),
    billable: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePmPermission(ctx, args, "pm.log_time");
    const log = await ctx.db.get(args.timeLogId);
    if (!log) throw new Error("TIME_LOG_NOT_FOUND");
    if (!hasPermission(actor.permissions, "pm.view_all") && log.userId !== actor.userId) {
      throw new Error("UNAUTHORIZED");
    }

    const patch: Record<string, unknown> = {};
    if (args.minutes !== undefined) patch.minutes = args.minutes;
    if (args.description !== undefined) patch.description = sanitizeRichText(args.description);
    if (args.loggedAt !== undefined) {
      patch.loggedAt = args.loggedAt;
      patch.date = toDateString(args.loggedAt);
    }
    if (args.billable !== undefined) patch.billable = args.billable;

    await ctx.db.patch(args.timeLogId, patch);
    await recalculateTaskActualHours(ctx, log.taskId);

    return { success: true };
  },
});

export const deleteTimeLog = mutation({
  args: {
    sessionToken: v.string(),
    timeLogId: v.id("pmTimeLogs"),
  },
  handler: async (ctx, args) => {
    const actor = await requirePmPermission(ctx, args, "pm.log_time");
    const log = await ctx.db.get(args.timeLogId);
    if (!log) throw new Error("TIME_LOG_NOT_FOUND");
    if (!hasPermission(actor.permissions, "pm.view_all") && log.userId !== actor.userId) {
      throw new Error("UNAUTHORIZED");
    }

    await ctx.db.delete(args.timeLogId);
    await recalculateTaskActualHours(ctx, log.taskId);
    return { success: true };
  },
});
