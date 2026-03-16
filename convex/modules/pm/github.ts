import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { requirePmRole } from "./roles";

// GitHub webhook event types
const GITHUB_WEBHOOK_EVENTS = [
  "push",
  "pull_request",
  "issues",
  "issue_comment",
  "pull_request_review",
] as const;

// Queries
export const getGitHubIntegrations = query({
  args: {
    sessionToken: v.string(),
    projectId: v.id("pmProjects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    await requirePmRole(ctx, args, "member", project.workspaceId);

    // Get GitHub integrations for this project
    // This would typically query a githubIntegrations table
    // For now, return the project's GitHub repo if configured
    return {
      repo: project.githubRepo,
      configured: !!project.githubRepo,
      webhookUrl: project.githubRepo ? 
        `https://your-domain.com/api/github/webhook` : null,
    };
  },
});

export const getLinkedPullRequests = query({
  args: {
    sessionToken: v.string(),
    projectId: v.id("pmProjects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    await requirePmRole(ctx, args, "member", project.workspaceId);

    // Get tasks with GitHub PR numbers
    const tasks = await ctx.db
      .query("pmTasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const prNumbers = tasks.flatMap(task => task.githubPrNumbers || []);
    
    // In a real implementation, you'd fetch PR details from GitHub API
    // For now, return mock data based on task PR numbers
    const linkedPRs = prNumbers.map(prNumber => ({
      number: prNumber,
      title: `PR #${prNumber}`,
      state: "open", // Would come from GitHub API
      url: `https://github.com/owner/repo/pull/${prNumber}`,
      taskId: tasks.find(task => task.githubPrNumbers?.includes(prNumber))?._id,
      taskTitle: tasks.find(task => task.githubPrNumbers?.includes(prNumber))?.title,
    }));

    return linkedPRs;
  },
});

export const getLinkedIssues = query({
  args: {
    sessionToken: v.string(),
    projectId: v.id("pmProjects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    await requirePmRole(ctx, args, "member", project.workspaceId);

    // Get tasks with GitHub issue numbers
    const tasks = await ctx.db
      .query("pmTasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const issueNumbers = tasks.flatMap(task => task.githubIssueNumbers || []);
    
    // In a real implementation, you'd fetch issue details from GitHub API
    // For now, return mock data based on task issue numbers
    const linkedIssues = issueNumbers.map(issueNumber => ({
      number: issueNumber,
      title: `Issue #${issueNumber}`,
      state: "open", // Would come from GitHub API
      url: `https://github.com/owner/repo/issues/${issueNumber}`,
      taskId: tasks.find(task => task.githubIssueNumbers?.includes(issueNumber))?._id,
      taskTitle: tasks.find(task => task.githubIssueNumbers?.includes(issueNumber))?.title,
    }));

    return linkedIssues;
  },
});

// Mutations
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

    // Check if PR is already linked
    const currentPRs = task.githubPrNumbers || [];
    if (currentPRs.includes(args.pullRequestNumber)) {
      throw new Error("PR_ALREADY_LINKED");
    }

    // Add PR number to task
    await ctx.db.patch(args.taskId, {
      githubPrNumbers: [...currentPRs, args.pullRequestNumber],
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const unlinkGitHubPullRequest = mutation({
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

    // Remove PR number from task
    const currentPRs = task.githubPrNumbers || [];
    const updatedPRs = currentPRs.filter(pr => pr !== args.pullRequestNumber);

    await ctx.db.patch(args.taskId, {
      githubPrNumbers: updatedPRs,
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

    // Check if issue is already linked
    const currentIssues = task.githubIssueNumbers || [];
    if (currentIssues.includes(args.issueNumber)) {
      throw new Error("ISSUE_ALREADY_LINKED");
    }

    // Add issue number to task
    await ctx.db.patch(args.taskId, {
      githubIssueNumbers: [...currentIssues, args.issueNumber],
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const unlinkGitHubIssue = mutation({
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

    // Remove issue number from task
    const currentIssues = task.githubIssueNumbers || [];
    const updatedIssues = currentIssues.filter(issue => issue !== args.issueNumber);

    await ctx.db.patch(args.taskId, {
      githubIssueNumbers: updatedIssues,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const configureGitHubWebhook = mutation({
  args: {
    sessionToken: v.string(),
    projectId: v.id("pmProjects"),
    repoUrl: v.string(),
    webhookSecret: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    await requirePmRole(ctx, args, "member", project.workspaceId);

    // Extract repo owner and name from URL
    const repoMatch = args.repoUrl.match(/github\.com\/(.+?)\/(.+?)(?:\.git)?$/);
    if (!repoMatch) {
      throw new Error("INVALID_GITHUB_URL");
    }

    const [, owner, repo] = repoMatch;

    // In a real implementation, you would:
    // 1. Create GitHub webhook via GitHub API
    // 2. Store webhook configuration in database
    // 3. Return webhook configuration details

    // For now, just update the project with GitHub repo info
    await ctx.db.patch(args.projectId, {
      githubRepo: `${owner}/${repo}`,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      webhookUrl: `https://your-domain.com/api/github/webhook`,
      events: GITHUB_WEBHOOK_EVENTS,
    };
  },
});

// Webhook handler (this would be an HTTP action, not a regular mutation)
export const handleGitHubWebhook = mutation({
  args: {
    // Webhook payload will be passed as args
    payload: v.any(),
    signature: v.string(),
    event: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify webhook signature
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("WEBHOOK_SECRET_NOT_CONFIGURED");
    }

    // In a real implementation, you would verify the signature
    // For now, process the webhook payload

    const { payload, event } = args;

    switch (event) {
      case "pull_request":
        await handlePullRequest(ctx, payload);
        break;
      case "issues":
        await handleIssue(ctx, payload);
        break;
      case "push":
        await handlePush(ctx, payload);
        break;
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    return { received: true };
  },
});

// Helper functions for webhook handling
async function handlePullRequest(ctx: any, payload: any) {
  const { action, pull_request, repository } = payload;
  
  if (action === "opened" || action === "synchronize") {
    // Find tasks that might be related to this PR
    // This would typically involve matching by branch name, title, or description
    const prNumber = pull_request.number;
    const prTitle = pull_request.title;
    
    // Update tasks that reference this PR
    // This is a simplified implementation
    console.log(`PR #${prNumber}: ${prTitle} - ${action}`);
  }
}

async function handleIssue(ctx: any, payload: any) {
  const { action, issue, repository } = payload;
  
  if (action === "opened" || action === "closed" || action === "reopened") {
    const issueNumber = issue.number;
    const issueTitle = issue.title;
    
    // Update tasks that reference this issue
    console.log(`Issue #${issueNumber}: ${issueTitle} - ${action}`);
  }
}

async function handlePush(ctx: any, payload: any) {
  const { ref, commits, repository } = payload;
  
  if (ref.startsWith("refs/heads/")) {
    const branch = ref.replace("refs/heads/", "");
    console.log(`Push to ${branch}: ${commits.length} commits`);
    
    // You could trigger builds, deployments, or other automation here
  }
}
