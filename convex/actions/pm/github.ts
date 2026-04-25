"use node";

import { v } from "convex/values";
import { internalAction } from "../../_generated/server";
import { internal } from "../../_generated/api";

function getGitHubToken() {
  return (
    process.env.GITHUB_TOKEN ??
    process.env.GITHUB_API_TOKEN ??
    process.env.GH_TOKEN ??
    undefined
  );
}

function parseRepo(fullName: string) {
  const trimmed = fullName.trim().replace(/^https?:\/\/github\.com\//i, "").replace(/\.git$/i, "");
  const [owner, repo] = trimmed.split("/");
  if (!owner || !repo) {
    throw new Error("INVALID_GITHUB_REPO");
  }
  return { owner, repo };
}

export const createGithubIssue = internalAction({
  args: {
    taskId: v.id("pmTasks"),
    repository: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    labels: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const token = getGitHubToken();
    if (!token) {
      return { created: false, skipped: true, reason: "missing_token" };
    }

    const { owner, repo } = parseRepo(args.repository);
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "EduMyles-PM-Automation",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: args.title,
        body: args.description,
        labels: args.labels ?? [],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GITHUB_ISSUE_CREATE_FAILED: ${response.status} ${errorText}`);
    }

    const issue = (await response.json()) as { number: number; html_url?: string };

    await ctx.runMutation(internal.modules.pm.github.attachGithubIssueToTask, {
      taskId: args.taskId,
      issueNumber: issue.number,
    });

    return {
      created: true,
      issueNumber: issue.number,
      issueUrl: issue.html_url,
    };
  },
});
