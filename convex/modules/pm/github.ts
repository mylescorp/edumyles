import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { requirePmRole } from "./roles";

// Simplified GitHub integration
export const linkGitHubPullRequest = mutation({
  args: {
    sessionToken: v.string(),
    taskId: v.id("pmTasks"),
    pullRequestNumber: v.number(),
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

    // Simple implementation
    const currentPRs = (task.githubPrNumbers as any[]) || [];
    if (currentPRs.includes(args.pullRequestNumber)) {
      throw new Error("PR_ALREADY_LINKED");
    }

    await ctx.db.patch(args.taskId, {
      githubPrNumbers: [...currentPRs, args.pullRequestNumber],
      updatedAt: Date.now(),
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
    if (!task) {
      throw new Error("TASK_NOT_FOUND");
    }

    const project = await ctx.db.get(task.projectId);
    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    await requirePmRole(ctx, args, "member", project.workspaceId);

    const currentIssues = (task.githubIssueNumbers as any[]) || [];
    if (currentIssues.includes(args.issueNumber)) {
      throw new Error("ISSUE_ALREADY_LINKED");
    }

    await ctx.db.patch(args.taskId, {
      githubIssueNumbers: [...currentIssues, args.issueNumber],
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
