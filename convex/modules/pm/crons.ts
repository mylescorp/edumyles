import { internalMutation } from "../../_generated/server";
import { createPlatformNotificationRecord } from "../platform/notificationHelpers";

function startOfTodayUtc() {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

function endOfTodayUtc() {
  return startOfTodayUtc() + 24 * 60 * 60 * 1000 - 1;
}

async function hasNotificationFor(ctx: any, userId: string, key: string) {
  const rows = await ctx.db
    .query("platform_notifications")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .collect();
  return rows.some((row: any) => row.metadata?.dedupeKey === key);
}

export const sendTaskDueNotifications = internalMutation({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("pmTasks").collect();
    const start = startOfTodayUtc();
    const end = endOfTodayUtc();
    let created = 0;

    for (const task of tasks) {
      if (task.isDeleted || !task.assigneeId || !task.dueDate) continue;
      if (task.dueDate < start || task.dueDate > end) continue;
      if (String(task.status).toLowerCase() === "done" || String(task.status).toLowerCase() === "cancelled") continue;

      const key = `pm_due_today:${task._id}:${start}`;
      if (await hasNotificationFor(ctx, task.assigneeId, key)) continue;

      await createPlatformNotificationRecord(ctx, {
        userId: task.assigneeId,
        title: "Task due today",
        body: `${task.title} is due today and needs attention.`,
        type: "pm",
        metadata: { dedupeKey: key, taskId: String(task._id), projectId: String(task.projectId) },
      });
      created += 1;
    }

    return { created };
  },
});

export const markOverdueTasks = internalMutation({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("pmTasks").collect();
    let updated = 0;
    let notified = 0;

    for (const task of tasks) {
      if (task.isDeleted || !task.dueDate) continue;
      const status = String(task.status).toLowerCase();
      if (status === "done" || status === "cancelled") continue;
      if (task.dueDate >= Date.now()) continue;

      if (!task.customFields?.isOverdue) {
        await ctx.db.patch(task._id, {
          customFields: {
            ...(task.customFields ?? {}),
            isOverdue: true,
            overdueMarkedAt: Date.now(),
          },
          updatedAt: Date.now(),
        });
        updated += 1;
      }

      if (task.assigneeId) {
        const key = `pm_overdue:${task._id}`;
        if (!(await hasNotificationFor(ctx, task.assigneeId, key))) {
          await createPlatformNotificationRecord(ctx, {
            userId: task.assigneeId,
            title: "Overdue PM task",
            body: `${task.title} is overdue and should be rescheduled or completed.`,
            type: "pm",
            metadata: { dedupeKey: key, taskId: String(task._id), projectId: String(task.projectId) },
          });
          notified += 1;
        }
      }
    }

    return { updated, notified };
  },
});

export const notifySprintEndingSoon = internalMutation({
  args: {},
  handler: async (ctx) => {
    const sprints = await ctx.db.query("pmSprints").collect();
    const cutoff = Date.now() + 2 * 24 * 60 * 60 * 1000;
    let created = 0;

    for (const sprint of sprints) {
      if (sprint.status !== "active" || sprint.endDate > cutoff) continue;
      const project = await ctx.db.get(sprint.projectId);
      if (!project?.leadId) continue;

      const key = `pm_sprint_ending:${sprint._id}`;
      if (await hasNotificationFor(ctx, project.leadId, key)) continue;

      await createPlatformNotificationRecord(ctx, {
        userId: project.leadId,
        title: "Sprint ending soon",
        body: `${sprint.name} ends within the next 48 hours. Review incomplete work now.`,
        type: "pm",
        metadata: { dedupeKey: key, sprintId: String(sprint._id), projectId: String(project._id) },
      });
      created += 1;
    }

    return { created };
  },
});

export const sendWeeklyProjectSummary = internalMutation({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query("pmProjects").collect();
    const weekKey = new Date().toISOString().slice(0, 10);
    let created = 0;

    for (const project of projects) {
      if (project.isDeleted || project.isArchived || !project.leadId) continue;
      const key = `pm_weekly_summary:${project._id}:${weekKey}`;
      if (await hasNotificationFor(ctx, project.leadId, key)) continue;

      await createPlatformNotificationRecord(ctx, {
        userId: project.leadId,
        title: "Weekly PM summary",
        body: `${project.name} is at ${project.progress ?? 0}% progress with ${project.completedTasks ?? 0}/${project.totalTasks ?? 0} tasks completed.`,
        type: "pm",
        metadata: { dedupeKey: key, projectId: String(project._id) },
      });
      created += 1;
    }

    return { created };
  },
});
