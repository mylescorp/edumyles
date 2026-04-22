import { v } from "convex/values";
import { internalMutation, mutation } from "../../_generated/server";
import { logAction } from "../../helpers/auditLog";
import { hasPermission } from "../platform/rbac";
import { recalculateProjectMetrics, requireProjectAccess } from "./helpers";

export const linkGitHubPullRequest = mutation({
  args: {
    sessionToken: v.string(),
    taskId: v.id("pmTasks"),
    pullRequestNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || task.isDeleted) throw new Error("TASK_NOT_FOUND");
    const { actor } = await requireProjectAccess(ctx, args, task.projectId, "pm.edit_own_task");

    const current = [...(task.githubPrNumbers ?? [])];
    if (current.includes(args.pullRequestNumber)) {
      throw new Error("PR_ALREADY_LINKED");
    }

    current.push(args.pullRequestNumber);
    await ctx.db.patch(args.taskId, {
      githubPrNumber: args.pullRequestNumber,
      githubPrNumbers: current,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: actor.userId,
      actorEmail: actor.email || "unknown@example.com",
      action: "pm.task.updated",
      entityType: "pmTask",
      entityId: String(args.taskId),
      after: { githubPrNumber: args.pullRequestNumber },
    });

    return { success: true };
  },
});

export const linkGitHubIssue = mutation({
  args: {
    sessionToken: v.string(),
    taskId: v.id("pmTasks"),
    issueNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || task.isDeleted) throw new Error("TASK_NOT_FOUND");
    const { actor } = await requireProjectAccess(ctx, args, task.projectId, "pm.edit_own_task");

    const current = [...(task.githubIssueNumbers ?? [])];
    if (current.includes(args.issueNumber)) {
      throw new Error("ISSUE_ALREADY_LINKED");
    }

    current.push(args.issueNumber);
    await ctx.db.patch(args.taskId, {
      githubIssueNumber: args.issueNumber,
      githubIssueNumbers: current,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: actor.userId,
      actorEmail: actor.email || "unknown@example.com",
      action: "pm.task.updated",
      entityType: "pmTask",
      entityId: String(args.taskId),
      after: { githubIssueNumber: args.issueNumber },
    });

    return { success: true };
  },
});

export const processPullRequest = internalMutation({
  args: {
    repository: v.string(),
    deliveryId: v.optional(v.string()),
    action: v.optional(v.string()),
    pullRequestNumber: v.number(),
    branch: v.optional(v.string()),
    merged: v.optional(v.boolean()),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    const matchingProjects = await ctx.db
      .query("pmProjects")
      .collect()
      .then((rows) =>
        rows.filter(
          (project) => !project.isDeleted && (project.githubRepo ?? "").toLowerCase().includes(args.repository.toLowerCase())
        )
      );

    for (const project of matchingProjects) {
      const task = await findTaskForGithubEvent(ctx, project._id, {
        prNumber: args.pullRequestNumber,
        branch: args.branch,
      });

      const eventId = await ctx.db.insert("pmGithubEvents", {
        projectId: project._id,
        repository: args.repository,
        eventType: "pull_request",
        deliveryId: args.deliveryId,
        action: args.action,
        payload: args.payload,
        createdAt: Date.now(),
      });

      if (!task) continue;

      const patch: Record<string, unknown> = {
        githubPrNumber: args.pullRequestNumber,
        githubPrNumbers: dedupeNumbers([...(task.githubPrNumbers ?? []), args.pullRequestNumber]),
        updatedAt: Date.now(),
      };

      if (args.merged) {
        patch.status = "Done";
        patch.completedAt = Date.now();
      } else if (args.action === "opened" || args.action === "synchronize" || args.action === "ready_for_review") {
        patch.status = "In Review";
      }

      await ctx.db.patch(task._id, patch);
      await ctx.db.insert("pmTaskComments", {
        taskId: task._id,
        authorId: "github-system",
        body: `GitHub PR #${args.pullRequestNumber} ${args.action ?? "updated"}${args.merged ? " and merged" : ""}.`,
        mentions: [],
        reactions: [],
        isEdited: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await recalculateProjectMetrics(ctx, project._id);

      await ctx.db.patch(eventId, {
        payload: {
          ...(args.payload ?? {}),
          matchedTaskId: String(task._id),
        },
      });
    }

    return { success: true };
  },
});

export const processIssueEvent = internalMutation({
  args: {
    repository: v.string(),
    deliveryId: v.optional(v.string()),
    action: v.optional(v.string()),
    issueNumber: v.number(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    const matchingProjects = await ctx.db
      .query("pmProjects")
      .collect()
      .then((rows) =>
        rows.filter(
          (project) => !project.isDeleted && (project.githubRepo ?? "").toLowerCase().includes(args.repository.toLowerCase())
        )
      );

    for (const project of matchingProjects) {
      const task = await ctx.db
        .query("pmTasks")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect()
        .then((tasks) =>
          tasks.find(
            (entry) =>
              !entry.isDeleted &&
              (entry.githubIssueNumber === args.issueNumber ||
                (entry.githubIssueNumbers ?? []).includes(args.issueNumber))
          )
        );

      await ctx.db.insert("pmGithubEvents", {
        projectId: project._id,
        repository: args.repository,
        eventType: "issues",
        deliveryId: args.deliveryId,
        action: args.action,
        payload: args.payload,
        createdAt: Date.now(),
      });

      if (!task) continue;

      const patch: Record<string, unknown> = {
        githubIssueNumber: args.issueNumber,
        githubIssueNumbers: dedupeNumbers([...(task.githubIssueNumbers ?? []), args.issueNumber]),
        updatedAt: Date.now(),
      };

      if (args.action === "closed") {
        patch.status = "Done";
        patch.completedAt = Date.now();
      } else if (args.action === "reopened") {
        patch.status = "To Do";
        patch.completedAt = undefined;
      }

      await ctx.db.patch(task._id, patch);
      await ctx.db.insert("pmTaskComments", {
        taskId: task._id,
        authorId: "github-system",
        body: `GitHub issue #${args.issueNumber} ${args.action ?? "updated"}.`,
        mentions: [],
        reactions: [],
        isEdited: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await recalculateProjectMetrics(ctx, project._id);
    }

    return { success: true };
  },
});

async function findTaskForGithubEvent(
  ctx: any,
  projectId: any,
  params: { prNumber?: number; branch?: string }
) {
  const tasks = await ctx.db
    .query("pmTasks")
    .withIndex("by_project", (q: any) => q.eq("projectId", projectId))
    .collect();

  return tasks.find(
    (task: any) =>
      !task.isDeleted &&
      ((params.prNumber !== undefined &&
        (task.githubPrNumber === params.prNumber || (task.githubPrNumbers ?? []).includes(params.prNumber))) ||
        (params.branch && task.githubBranch === params.branch))
  );
}

function dedupeNumbers(values: number[]) {
  return [...new Set(values)];
}

